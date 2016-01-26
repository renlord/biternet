const bitcoin 					= require('bitcoinjs-lib')
const io 								= require('socket.io-client')
const request 					= require('browser-request')
const Consumer 					= require('btc-payment-channel').Consumer
const message 					= require('./message')

const BITERNET_SERVER 	= 'http://192.168.10.1:6164'

const TESTNET_URL     	=	'https://testnet.blockexplorer.com/api/addr/'
const UTXO            	= '/utxo'
const TESTNET_BROADCAST = 'https://testnet.blockexplorer.com/api/tx/send'
const BTC             	= 100000000
const TX_FEE          	= 1000
const DAY             	= 60 * 60 * 24

function _WebClient() {
	return new WebClient();
}

function WebClient() {
	this._privateKey = bitcoin.ECPair.makeRandom({ 
		network: bitcoin.networks.testnet 
	})
	this._fundingAddress = this._privateKey.getAddress()
	this.socket = io.connect(BITERNET_SERVER)
	this._consumer = null

	this._refundAddress = null

	// payment information
  this._billedData = 0;
  this._paidInvoiceTimestamp = null;

	// network update callback
	this._networkUpdate = null

	this._channelReady = false
	this._ready = false

	// Server contributed objects
	this.advertisement = null

	// balance info
	this.balance = null

	// component callback state update handlers
	this.balanceComponentHandler = null

	var self = this

	this.socket.on('TOS', function(data) {
		self.tos = data
	})
}

WebClient.prototype.getFundingAddress = function() {
	return this._fundingAddress
}

WebClient.prototype.getWIF = function() {
	return this._privateKey.toWIF()
}

WebClient.prototype.checkDeposit = function(amount) {
	if (amount < this.advertisement.minDeposit) {
		alert('Insufficient Deposit Amount. Required: '+ this.advertisement.minDeposit + ' satoshis')
		return false
	}
	return true
}

WebClient.prototype.startChannel = function() {
	// start socket
	if (this.tos === null) {
		alert('Terms of Service not received from Mesh Node')
	}
	var self = this
	request(TESTNET_URL + this._fundingAddress + UTXO, function(err, res, body) {
		console.log(body)
		var utxos = JSON.parse(body)
    var utxoValue = 0
    var utxoKeys = []

    for (var i = 0; i < utxos.length; i++) {
      utxoValue += (utxos[i].amount * BTC)
      utxoKeys.push(self._privateKey)
    }
    utxoValue = Math.round(utxoValue)

		// if (self.checkDeposit(utxoValue)) {
		// 	console.log('validation fail')
		// 	return 
		// } 

   	self._consumer = new Consumer({
      consumerKeyPair : self._privateKey,
      providerPubKey : new Buffer(self.advertisement.serverPublicKey, 'hex'),
      refundAddress : self._refundAddress,
      paymentAddress : self.advertisement.paymentAddress,
      utxos : utxos,
      utxoKeys : utxoKeys,
      depositAmount : utxoValue - TX_FEE,
      txFee : TX_FEE,
      network : bitcoin.networks.testnet
    })

    self.socket.on('channel', function(data) {
    	switch (data.type) {
    		case 'commitment':
        console.log('commitment outcome received...');
        self.processCommitment(data);
        break;
      case 'invoice':
        console.log('invoice received...');
        console.log(data);
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
    })

		self.socket.emit('acceptTOS', message.TOSAcceptance({
	    consumerPubKey : self._consumer._consumerKeyPair.getPublicKeyBuffer().toString('hex'),
	    refundAddress : self._consumer.refundAddress,
	    deposit : utxoValue,
	    refundTxHash : self._consumer._refundTx.toHex()
	  }))
	  console.log('acceptTOS emitted')
	})
}

WebClient.prototype.closeChannel = function() {
	this.channelReady = false
	this.socket.emit('channel', message.Shutdown())
	this.socket.removeListener('channel')
}

WebClient.prototype.processCommitment = function(commitment) {
	 if (commitment.outcome === 'valid') {
    console.log('Biternet Service now Available...')
    this.channelReady = true
    return;
  } 

  if (commitment.outcome === 'invalid') {
    console.log('Commitment Tx is Invalid...')
    alert('commitmentTx is invalid')
    return;
  }
}

WebClient.prototype.processInvoice = function(invoiceMsg) {
	var invoice = data.invoice;
  if ((invoice.totalPaidAmount + invoice.incrementAmount) > this._deposit) {
    throw new ClientChannel.InsufficientFundError();
  }
  if (this._paidInvoiceTimestamp === invoice.time) {
    console.log('refuse to pay!');
    return;
  }

  var self = this;
  var sendPaymentHandle = function(paymentTxHex) {
    self.socket.emit('channel', message.Payment(paymentTxHex));
    console.log('payment made...');
  }
  this._consumer.incrementPayment(invoice.incrementAmount, sendPaymentHandle);
  this._paidInvoiceTimestamp = invoice.time;
  this.balanceComponentHandler(this.balance)
}

WebClient.prototype.processRefund = function(refundMsg) {
	this._consumer.validateRefund(refundMsg.refundTx);
  this.socket.emit('channel', message.Commitment(this._consumer._commitmentTx.toHex()));
}

WebClient.prototype.getRawRefundTx = function() {
	console.log(this._consumer.refundTx.toHex())
}

WebClient.prototype.broadcastRefund = function() {
	if (this._consumer.refundTx === null) {
		alert('no refundTx in cache to broadcast')
	}
	this._consumer.broadcastRefundTx(function(tx) {
		request({
			method: 'POST', 
			url: TESTNET_BROADCAST, 
			body: '{"rawTx":' + tx + '}',
			json:true
		}, function(err, res, body) {
			console.log(body)
		})
	})
}

WebClient.prototype.processShutdown = function() {
	this.channelReady = false
	this.socket.removeListener('channel')
}

module.exports = _WebClient