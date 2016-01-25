const bitcoin 					= require('bitcoinjs-lib')
const io 								= require('socket.io-client')
const request 					= require('browser-request')
const Consumer 					= require('btc-payment-channel').Consumer


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
	this.tos = null
	this._ready = false

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

WebClient.prototype.startChannel = function() {
	// start socket
	if (this.tos === null) {
		alert('Terms of Service not received from Mesh Node')
	}
	var self = this
	request(TESTNET_URL + this._fundingAddress + UTXO, function(err, res, body) {
		console.log(body)
		var utxos = body;
    var utxoValue = 0
    var utxoKeys = []

    for (var i = 0; i < utxos.length; i++) {
      utxoValue += (utxos[i].amount * BTC)
      utxoKeys.push(self._privateKey)
    }
    utxoValue = Math.round(utxoValue)

   	self._consumer = new Consumer({
      consumerKeyPair : self._privateKey,
      providerPubKey : new Buffer(self.tos.serverPublicKey, 'hex'),
      refundAddress : self._refundAddress,
      paymentAddress : self.tos.paymentAddress,
      utxos : utxos,
      utxoKeys : utxoKeys,
      depositAmount : utxoValue,
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
	})
}

WebClient.prototype.closeChannel = function() {
	this.channelReady = false
}

WebClient.prototype.processCommitment = function(commitMsg) {

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
    self._socket.emit('channel', message.Payment(paymentTxHex));
    console.log('payment made...');
  }
  this._consumer.incrementPayment(invoice.incrementAmount, sendPaymentHandle);
  this._paidInvoiceTimestamp = invoice.time;
}

WebClient.prototype.processRefund = function(refundMsg) {
	this._consumer.validateRefund(refundMsg.refundTx) 
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
	this.socket.removeListener('channel')
}

// use http 
WebClient.prototype.getAdvertisement = function(callback) {

}

// Controller Logic

module.exports = _WebClient