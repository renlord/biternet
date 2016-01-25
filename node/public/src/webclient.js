const bitcoin 				= require('bitcoinjs-lib')
const io 							= require('socket.io-client')
const request 				= require('browser-request')
const Consumer 				= require('btc-payment-channel').Consumer


const BITERNET_SERVER = 'http://192.168.10.1:6164'

const TESTNET_URL     = 'https://testnet.blockexplorer.com/api/addr/';
const UTXO            = '/utxo';
const BTC             = 100000000;
const TX_FEE          = 1000;
const DAY             = 60 * 60 * 24;

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
	// network update callback
	this._networkUpdate = null

	this._channelReady = false
	this._ready = false
}

WebClient.prototype.getFundingAddress = function() {
	return this._fundingAddress
}

WebClient.prototype.getWIF = function() {
	return this._privateKey.toWIF()
}

WebClient.prototype.startChannel = function(serverDetails) {
	// start socket
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
      providerPubKey : new Buffer(serverDetails.serverPublicKey, 'hex'),
      refundAddress : self._refundAddress,
      paymentAddress : serverDetails.paymentAddress,
      utxos : utxos,
      utxoKeys : utxoKeys,
      depositAmount : utxoValue,
      txFee : TX_FEE,
      network : bitcoin.networks.testnet
    })

		self.socket.emit('acceptTOS', message.TOSAcceptance({
	    consumerPubKey : self._consumer._consumerKeyPair.getPublicKeyBuffer().toString('hex'),
	    refundAddress : self._consumer.refundAddress,
	    deposit : utxoValue,
	    refundTxHash : self._consumer._refundTx.toHex()
	  }))

	  this._channelReady = true
	})
}

WebClient.prototype.closeChannel = function() {
	this.channelReady = false
}

WebClient.prototype.processCommitment = function(commitMsg) {

}

WebClient.prototype.processInvoice = function(invoiceMsg) {

}

WebClient.prototype.processRefund = function(refundMsg) {

}

WebClient.prototype.processShutdown = function() {

}

// use http 
WebClient.prototype.getAdvertisement = function(callback) {

}

// Controller Logic

module.exports = _WebClient