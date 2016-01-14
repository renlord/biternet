const bitcoin = require('bitcoinjs-lib');
const payment_channel = require('btc-payment-channel');

const request = require('request');
const io 		  = require('socket.io-client');

const message = require('./protocol').ClientMessage;

const BITERNET_PORT 	= 6164;

const TESTNET_URL 		= 'https://testnet.blockexplorer.com/api/addr/';
const UTXO						= '/utxo';
const BTC 						= 100000000;
const TX_FEE 					= 1000;
const DAY 			= 60 * 60 * 24;

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
	var compulsoryProperties = ['deposit', 'socket', 'consumer'];
	compulsoryProperties.forEach(function(p) {
		if (!opts.hasOwnProperty(p)) {
			throw new Error('missing parameter for Channel : \"' + p + '\"');
		}
	})

	this._deposit = opts.deposit;	
	this._socket = opts.socket;
	this._consumer = opts.consumer;

	// payment information
	this._billedData = 0;

	var socket = this._socket;
	this._consumer.sendRefundTx(function(refundTxHex) {
		socket.emit('channel', {
			type : 'refund',
			refundTx : refundTxHex
		});
	});
}

ClientChannel.prototype.init = function() {
	this._socket.emit('acceptTOS', message.TOSAcceptance({
		consumerPubKey : this._consumer._consumerKeyPair.getPublicKeyBuffer().toHex(),
		deposit : this._deposit,
		refundTx : this._consumer._refundTx
	}));
}

/**
 * processes an invoice sent by the provider server
 */
ClientChannel.prototype.processInvoice = function(invoice) {
	if (invoice.payAmount > this._deposit) {
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

ClientChannel.prototype.processRefund = function(refundTx) {
	this._consumer.validateRefund(refundTx);
	console.log('RefundTxHash : \" ' + refundTx + ' \"');
	this._socket.emit('commitment', message.Commitment(this._consumer.commitmentTx.toHex()));
}

ClientChannel.prototype.closeChannel = function() {
	this._socket.emit('channel', {
		type : 'shutdown'
	})
}

/**
 * Channel Manager
 * An object instance dedicated to channel management, creation and all things 
 * related to channels.
 *
 * ARGUMENT {} object
 * @refundAddress, 											refundAddress for bitcoin transactions
 * @keyPairWIF [OPTIONAL],									keyPair for consumer
 * @maxPricePerKB [OPTIONAL], 					price per kB in satoshis
 * @maxDeposit [OPTIONAL], 							btc amount in satoshis
 * @maxChargeInterval [OPTIONAL], 			charging interval in seconds
 * @maxTimeLockDuration [OPTIONAL], 		the min. timelock duration the provider 
 																				instance is willing to accept (in seconds)
 * @recoveryHandler [OPTIONAL], 				function to call for recovery handling
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

	/** non-init stuff **/
	this._clientBalance = 0;

	this.channels = [];
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
			deposit : opts.deposit,
			socket : opts.socket,
			consumer : new payment_channel.Consumer({
				consumerKeyPair : self._keyPair,
				providerPubKey : new String(opts.serverPublicKey),
				refundAddress : opts.refundAddress,
				paymentAddress : opts.paymentAddress,
				utxos : utxos,
				utxoKeys : utxoKeys,
				depositAmount : opts.deposit,
				txFee : TX_FEE,
				network : self._network
			})
		}
		this._channels[ipaddr] = new ClientChannel(consumerRequiredDetails);
		callback(this._channels[ipaddr]);
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

ClientChannelManager.prototype.closeChannel = function(channel, socketEmit) {
	channel.closeChannel(socketEmit);
	delete this._channels[channel._serverIP];
}

module.exports = ClientChannelManager;
