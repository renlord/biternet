'use strict';
const bitcoin         = require('bitcoinjs-lib');
const payment_channel = require('btc-payment-channel');

const request         = require('request');
const io              = require('socket.io-client');

const message         = require('./protocol').ClientMessage;

const BITERNET_PORT   = 6164;

const TESTNET_URL     = 'https://testnet.blockexplorer.com/api/addr/';
const UTXO            = '/utxo';
const BTC             = 100000000;
const TX_FEE          = 1000;
const DAY             = 60 * 60 * 24;

 /**
 * ClientChannel 
 * An object instance to account for a channel between two nodes.
 * When the channel instance is created, it is assumed that the negotiation is 
 * complete and payment objects are intiailised. 
 *
 * Arguments {} Object
 * @deposit
 * @socket
 * @consumer
 */
function ClientChannel(opts) {
  var compulsoryProperties = ['deposit', 'socket', 'consumer', 'serverIP', 
    'clientChannelManager'
  ];
  compulsoryProperties.forEach(function(p) {
    if (!opts.hasOwnProperty(p)) {
      throw new Error('missing parameter for Channel : \"' + p + '\"');
    }
  })

  this._serverIP = opts.serverIP;
  this._deposit = opts.deposit; 
  this._socket = opts.socket;
  this._consumer = opts.consumer;
  this._clientChannelManager = opts.clientChannelManager;

  // payment information
  this._billedData = 0;

  var socket = this._socket;
}

ClientChannel.prototype.init = function() {
  this._socket.emit('acceptTOS', message.TOSAcceptance({
    consumerPubKey : this._consumer._consumerKeyPair.getPublicKeyBuffer().toString('hex'),
    refundAddress : this._consumer.refundAddress,
    deposit : this._deposit,
    refundTxHash : this._consumer._refundTx.toHex()
  }));

  var self = this;

  this._socket.on('channel', function(data) {
    switch(data.type) {
      case 'commitment':
        console.log('commitment outcome received...');
        self.processCommitment(data);
        break;
      case 'invoice':
        console.log('invoice received...');
        self.processInvoice(data);
        break;

      case 'refund':
        console.log('signedRefundTx received...');
        self.processRefund(data);
        console.log(data.refundTx);
        break;

      case 'shutdown':
        console.log('shutdown received...');
        self.processShutdown(data);
        break;

      default: 
        console.log(data);
        throw new Error('unknown Biternode_Channel message type');
        break;
    }
  });

  this._socket.on('disconnect', function() {
    self.processShutdown();
  })
}

ClientChannel.prototype.processCommitment = function(commitment) {
  if (commitment.outcome === 'valid') {
    console.log('Biternet Service now Available...');
    return;
  } 

  if (commitment.outcome === 'invalid') {
    console.log('Commitment Tx is Invalid...');
    return;
  }
  throw new Error('unknown commitment outcome received');
}

/**
 * processes an invoice sent by the provider server
 */
ClientChannel.prototype.processInvoice = function(data) {
  var invoice = data.invoice;
  if ((invoice.totalPaidAmount + invoice.incrementAmount) > this._deposit) {
    throw new ClientChannel.InsufficientFundError();
  }

  var socket = this._socket;
  var sendPaymentHandle = function(paymentTxHex) {
    socket.emit('channel', message.Payment({
      type : 'payment',
      paymentTx : paymentTxHex
    }));
  }
  this._consumer.incrementPayment(invoice.incrementAmount, sendPaymentHandle);
}

/**
 * processes refundTxs signed by the provider server
 */
ClientChannel.prototype.processRefund = function(refund) {
  this._consumer.validateRefund(refund.refundTx);
  this._socket.emit('channel', message.Commitment(this._consumer._commitmentTx.toHex()));
}

ClientChannel.prototype.processShutdown = function() {
  console.log('server initiated shutdown... no more relay service');
  this.closeChannel();
}

ClientChannel.prototype.closeChannel = function() {
  this._clientChannelManager.closeChannel(this._serverIP);
  console.log('channel closing down...');
}

/**
 * Channel Manager
 * An object instance dedicated to channel management, creation and all things 
 * related to channels.
 *
 * ARGUMENT {} object
 * @refundAddress,                      refundAddress for bitcoin transactions
 * @keyPairWIF [OPTIONAL],                  keyPair for consumer
 * @maxPricePerKB [OPTIONAL],           price per kB in satoshis
 * @maxDeposit [OPTIONAL],              btc amount in satoshis
 * @maxChargeInterval [OPTIONAL],       charging interval in seconds
 * @maxTimeLockDuration [OPTIONAL],     the min. timelock duration the provider 
                                        instance is willing to accept (in seconds)
 * @recoveryHandler [OPTIONAL],         function to call for recovery handling
 * @network, OPTIONAL. 
 */
function ClientChannelManager(opts) {
  var compulsoryProperties = ['refundAddress'];
  compulsoryProperties.forEach(function(p) {
    if(!opts.hasOwnProperty(p)) {
      throw new Error('missing parameter for Channel Manager : \"' + p + '\"');
    }
  })

  this._network = opts.network ? opts.network : bitcoin.networks.testnet;

  /** test the addresses **/
  bitcoin.address.toOutputScript(opts.refundAddress, this._network);

  this._refundAddress = opts.refundAddress;

  this._maxPricePerKB = opts.maxPricePerKB ? opts.maxPricePerKB : 5;
  this._maxDeposit = opts.maxDeposit ? opts.maxDeposit : 1000000;
  this._maxChargeInterval = opts.maxChargeInterval ? opts.maxChargeInterval : 
    10;
  this._maxTimeLockDuration = opts.maxTimeLockDuration ? 
    opts.maxTimeLockDuration : (2 * DAY);

  this._keyPair = opts.keyPairWIF ? bitcoin.ECPair.fromWIF(opts.keyPairWIF, 
    this._network) : bitcoin.ECPair.makeRandom({ network : this._network });

  if (!opts.recoveryHandler) {
    console.log('###### RECORD THIS ######\n' +
      'Coin Temporary Wallet WIF for Recovery Purposes : ' + 
      this._keyPair.toWIF().toString() + '\n' + 
      '###### END ######\n');
  }

  this._fundingAddress = this._keyPair.getAddress();
  console.log('FUNDING ADDRESS: ' + this._fundingAddress);
  
  /** non-init stuff **/
  this._clientBalance = 0;

  this._channels = [];
}

/**
 * Checks if a provider TOS is acceptable by a client.
 * Biternet nodes DO NOT use this method as OSLRD checks for the most optimal
 * path in terms of reliability and cost.
 *
 * ARGUMENT
 * @providerAd, the advertisement message by the provider
 */
ClientChannelManager.prototype.processAdvertisement = function(providerAd) {
  if (providerAd.pricePerKB > this._maxPricePerKB || 
    providerAd.minDeposit > this._maxDeposit || 
    providerAd.maxChargeInterval > this._maxChargeInterval || 
    providerAd.minTimeLockDuration > this._maxTimeLockDuration) 
  {
    console.log('advertisement OK...');
    return true;
  } else {
    console.log('advertisement BAD...');
    return false; 
  }
}

ClientChannelManager.prototype.contactNode = function(ipaddr) {
  var socket = io.connect('http://' + ipaddr + ':' + BITERNET_PORT);
  var self = this;
  socket.on('TOS', function(advertisement) {
    console.log(advertisement);
    console.log('client startning channel...');
    self.startChannel({
      deposit : advertisement.minDeposit,
      ipaddr : ipaddr,
      serverPublicKey: advertisement.serverPublicKey,
      refundAddress : self._refundAddress,
      paymentAddress : advertisement.paymentAddress,
      socket : socket
    }, function(c) {
      console.log('channel initializing...');
      c.init();
    });
  })
}

/**
 * Starts a channel from a consumer perspective.
 *
 * ARGUMENT
 * @opts
 * @callback
 */
ClientChannelManager.prototype.startChannel = function(opts, callback) {
  // run btc payment channel stuff.
  var compulsoryProperties = ['deposit', 'ipaddr', 'serverPublicKey', 
    'refundAddress', 'paymentAddress', 'socket'
  ];

  compulsoryProperties.forEach(function(p) {
    if (!opts.hasOwnProperty(p)) {
      throw new Error('missing parameter for Channel : \"' + p + '\"');
    }
  });

  var self = this;

  request
  .get(TESTNET_URL + this._fundingAddress + UTXO)
  .on('data', function(chunk) {
    var utxos = JSON.parse(chunk.toString('utf8')); 
    var utxoValue = 0;
    var utxoKeys = [];
    for (var i = 0; i < utxos.length; i++) {
      utxoValue += (utxos[i].amount * BTC);
      utxoKeys.push(self._keyPair);
    }
    utxoValue = Math.round(utxoValue);

    if (utxoValue < opts.deposit) {
      throw new Error('Summed UTXOs is less than indicated deposit amount');
    }

    var consumerRequiredDetails = {
      clientChannelManager : self,
      serverIP : opts.ipaddr,
      deposit : opts.deposit,
      socket : opts.socket,
      consumer : new payment_channel.Consumer({
        consumerKeyPair : self._keyPair,
        providerPubKey : new Buffer(opts.serverPublicKey, 'hex'),
        refundAddress : opts.refundAddress,
        paymentAddress : opts.paymentAddress,
        utxos : utxos,
        utxoKeys : utxoKeys,
        depositAmount : opts.deposit,
        txFee : TX_FEE,
        network : self._network
      })
    }
    self._channels[opts.ipaddr] = new ClientChannel(consumerRequiredDetails);
    callback(self._channels[opts.ipaddr]);
  });
}

/**
 * Processes an invoice sent by a provider
 *
 * NOTE: right now, it will just pay so as long the balance is positive.
 * Otherwise, it will volunteer to close the channel.
 */
ClientChannelManager.prototype.processInvoice = function(invoice) {
  try {
    var channel = this._channels[invoice.serverIP];
    if (invoice.requestedAmount > this._clientBalance) {
      channel.endService();
    } else {
      channel.processInvoice(invoice);
    }
  } catch(err) {
    console.log(err);
  }
}

ClientChannelManager.prototype.closeChannel = function(ipaddr) {
  delete this._channels[ipaddr];
}

ClientChannelManager.prototype.shutdown = function() {
  for (var c in this._channels) {
    this._channels[c].closeChannel();
  }
  console.log('all client channels closed');
}

module.exports = ClientChannelManager;