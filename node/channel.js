var payment_channel = require('btc-payment-channel');
var bitcoin = require('bitcoinjs-lib');

/**
 * Channel 
 * An object instance to account for a channel between two nodes.
 * When the channel instance is created, it is assumed that the negotiation is 
 * complete and payment objects are intiailised. 
 */
function Channel(opts) {
	var compulsoryProperties = ['balance', 'deposit', 'clientIP', 'selfKeyPair'];
	compulsoryProperties.forEach(function(p) {
		if (!opts.hasOwnProperty(p)) {
			throw new Error('missing parameter for Channel : \"' + p + '\"');
		}
	})

	if (!(opts.hasOwnProperty('consumer') || opts.hasOwnProperty('provider'))) {
		throw new Error('channel needs to have a \"consumer\" or a \"producer\"');
	} 

	this._balance = opts.balance;
	this._deposit = opts.deposit;	
	this._clientIP = opts.clientIP;
	this._networkHandler = opts.networkHandler;
}

/**
 * Channel Manager
 * An object instance dedicated to channel management, creation and all things 
 * related to channels.
 *
 * ARGUMENT {} object
 * @paymentAddress, paymentAddress for bitcoin transactions
 * @refundAddress, refundAddress for bitcoin transactions
 * @keyPairWIF, WIF export format for private key generation using bitcoinjs-lib
 * @pricePerKB, price per kB in satoshis
 * @minDeposit, btc amount in satoshis
 * @chargeInterval, charging interval in seconds
 * @minTimeLockDuration, the min. timelock duration the provider instance is 
 * 											 willing to accept
 * @warningAmountThreshold, the threshold for an event to be emitted
 * @network, OPTIONAL. 
 */
function ChannelManager(opts) {
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

	if (!opts.keyPairWIF instanceof String) {
		throw new Error('wrong type for keyPairWIF. Must be type String');
	}
	this._keyPair = ECPair.fromWIF(opts.keyPairWIF, this._network);

	this._polling = null; // object returned by setInterval. polling IpTables

	this._activeChannels = [];
}

/**
 * Channel builder
 *
 *
 */
ChannelManager.prototype.startChannel = function() {

}

ChannelManager.prototype.topUpChannel = function() {

}

ChannelManager.prototype.sendAdvertisement = function() {
	return {

	}
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