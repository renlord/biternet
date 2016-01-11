'use strict';
const payment_channel = require('btc-payment-channel');
const bitcoin 				= require('bitcoinjs-lib');

const EventEmitter 		= require('events');
const util 						= require('util');

const DAY = 60 * 60 * 24;

/**
 * Channel 
 * An object instance to account for a channel between two nodes.
 * When the channel instance is created, it is assumed that the negotiation is 
 * complete and payment objects are intiailised. 
 */
function ServerChannel(opts) {
	var compulsoryProperties = ['clientPubKey', 'balance', 'deposit', 'clientIP'];
	compulsoryProperties.forEach(function(p) {
		if (!opts.hasOwnProperty(p)) {
			throw new Error('missing parameter for Channel : \"' + p + '\"');
		}
	})

	if (!(opts.hasOwnProperty('consumer') || opts.hasOwnProperty('provider'))) {
		throw new Error('channel needs to have a \"consumer\" or a \"producer\"');
	} 

	this._clientPubKey = opts.clientPubKey;
	this._clientBalance = opts.balance;
	this._clientDeposit = opts.deposit;	
	this._clientIP = opts.clientIP;

	// payment information
	this._billedData = 0;
	this._elapsedTime = 0; // seconds
	this._warningTime = 0;
}

ServerChannel.prototype.processPayment = function() {

}

/**
 * Channel Manager
 * An object instance dedicated to channel management, creation and all things 
 * related to channels.
 *
 * ARGUMENT {} object
 * @paymentAddress, 										paymentAddress for bitcoin transactions
 * @refundAddress, 											refundAddress for bitcoin transactions
 * @keyPairWIF, 												WIF export format for private key 
 																				generation using bitcoinjs-lib
 * @pricePerKB [OPTIONAL], 							price per kB in satoshis
 * @minDeposit [OPTIONAL], 							btc amount in satoshis
 * @chargeInterval [OPTIONAL], 					charging interval in seconds
 * @minTimeLockDuration [OPTIONAL], 		the min. timelock duration the provider 
 																				instance is willing to accept (in seconds)
 * @warningAmountThreshold [OPTIONAL], 	the threshold for an event to be emitted
 * @warningTime [OPTIONAL],							amount of time provided to client to 
 																				resolve warnings
 * @network, OPTIONAL. 
 */
function ProviderChannelManager(opts) {
	var compulsoryProperties = ['paymentAddress', 'refundAddress', 'keyPairWIF'];
	compulsoryProperties.forEach(function(p) {
		if(!opts.hasOwnProperty(p)) {
			throw new Error('missing parameter for Channel Manager : \"' + p + '\"');
		}
	})

	this._network = opts.network ? opts.network : bitcoin.networks.test;

	/** test the addresses **/
	bitcoin.address.toOutputScript(opts.paymentAddress, this._network);
	bitcoin.address.toOutputScript(opts.refundAddress, this._network);

	this._paymentAddress = opts.paymentAddress;
	this._refundAddress = opts.refundAddress;

	this._warningAmountThreshold = opts.warningAmountThreshold ? 
		opts.warningAmountThreshold : 1000;
	this._warningTime = opts.warningTime ? opts.warningTime : 60;
	this._pricePerKB = opts.pricePerKB ? opts.pricePerKB : 2;
	this._minDeposit = opts.minDeposit ? opts.minDeposit : 225000;
	this._chargeInterval = opts.chargeInterval ? opts.chargeInterval : 5;
	this._minTimeLockDuration = opts.minTimeLockDuration ? 
		opts.minTimeLockDuration : DAY;

	if (!opts.keyPairWIF instanceof String) {
		throw new Error('wrong type for keyPairWIF. Must be type String');
	}
	this._keyPair = bitcoin.ECPair.fromWIF(opts.keyPairWIF, this._network);

	/** non-init stuff **/
	this._polling = null; // object returned by setInterval. polling IpTables

	this._providingChannel = [];
	this._consumingChannel = [];
}

/**
 * Channel builder
 *
 */
ChannelManager.prototype.startChannel = function(clientDetails) {
	var newChannel = new Channel(clientDetails);
	this._activeChannels.push(newChannel);
}

ChannelManager.prototype.clientStartChannel = function(providerDetails) {
	var newChannel = new Channel(providerDetails);
	this._activeChannels.push(newChannel);
}

ChannelManager.prototype.getAdvertisement = function() {
	return JSON.stringify({
		type : 'advertisement',
		coin_network : this._network,
		paymentAddress : this._paymentAddress,
		providerPubKey : this._keyPair.getPublicKeyBuffer().toHex(),
		pricePerKB : this._pricePerKB,
		warningAmountThreshold : this._warningAmountThreshold,
		minDeposit : this._minDeposit,
		chargeInterval : this._chargeInterval,
		minTimeLockDuration : this._minTimeLockDuration
	});
}

ChannelManager.prototype.recvAdvertisement = function(msg, callback) {
	// check the advertisement message
	var compulsoryProperties = ['coin_network', 'paymentAddress', 'providerPubKey',
		'pricePerKB', 'warningAmountThreshold', 'minDeposit', 'chargeInterval', 
		'minTimeLockDuration'];

	compulsoryProperties.forEach(function(p) {
		if (!msg.hasOwnProperty(p)) {
			throw new Error('missing parameter in Advertisement message!');
		}
	});

	if (this._network !== coin_network) {
		callback()
	}

	// callback to handle.
	callback(msg);
}

ChannelManager.prototype.sendAcceptance = function(callback) {
	callback(JSON.stringify({
		type : 'acceptance',
		clientPubKey : this._keyPair.getPublicKeyBuffer().toHex()
	}));
}

ChannelManager.prototype.recvAdvertisement = function(msg, callback) {
	msg = JSON.parse(msg);
	callback(msg);
}

ChannelManager.prototype.sendPaymentRequest = function(params, callback) {
	var compulsoryProperties = ['amount', 'n'];
	compulsoryProperties.forEach(function(p) {
		if(!opts.hasOwnProperty(p)) {
			throw new Error('missing parameter for Channel Manager : \"' + p + '\"');
		}
	})
	callback(JSON.stringify({
		type : 'payment_request',
		amount : params.amount,
		n : params.n
	}));
}

ChannelManager.prototype.sendShutdown = function(callback) {
	callback(JSON.stringify({
		type : 'shutdown'
	}));
}

ChannelManager.prototype.shutdown = function() {
	clearInterval(this._poll);
	this._activeChannels.forEach(function(c) {
		this.sendShutdown()
	})
	setTimeout(function() {
		process.exit();
	}, 60000);
}

/**
 * polls the IPTables every 1 second. 
 * 
 */
ChannelManager.poll = function() {
	this._polling = setInterval(function() {
		// check the iptables
	}, 1000);
}

modules.exports = ChannelManager;