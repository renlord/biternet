const bitcoin = require('bitcoinjs-lib');
const payment_channel = require('btc-payment-channel');

 /**
 * ClientChannel 
 * An object instance to account for a channel between two nodes.
 * When the channel instance is created, it is assumed that the negotiation is 
 * complete and payment objects are intiailised. 
 *
 * Arguments {} Object
 * @serverPubKey
 * @balance
 * @deposit
 * @serverIP
 * @consumer OR @provider
 */
function ClientChannel(opts) {
	var compulsoryProperties = ['serverPubKey', 'balance', 'deposit', 'serverIP'];
	compulsoryProperties.forEach(function(p) {
		if (!opts.hasOwnProperty(p)) {
			throw new Error('missing parameter for Channel : \"' + p + '\"');
		}
	})

	if (!(opts.hasOwnProperty('consumer') || opts.hasOwnProperty('provider'))) {
		throw new Error('channel needs to have a \"consumer\" or a \"producer\"');
	} 

	this._serverPubKey = opts.serverPubKey;
	this._deposit = opts.deposit;	
	this._serverIP = opts.serverIP;

	// payment information
	this._billedData = 0;
	this._elapsedTime = 0; // seconds
	this._warningTime = 0;
}

ClientChannel.prototype.processInvoice = function(invoice, callback) {

}

ClientChannel.prototype.

/**
 * Channel Manager
 * An object instance dedicated to channel management, creation and all things 
 * related to channels.
 *
 * ARGUMENT {} object
 * @refundAddress, 											refundAddress for bitcoin transactions
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

	this._network = opts.network ? opts.network : bitcoin.networks.test;

	/** test the addresses **/
	bitcoin.address.toOutputScript(opts.refundAddress, this._network);

	this._refundAddress = opts.refundAddress;

	this._maxPricePerKB = opts.maxPricePerKB ? opts.maxPricePerKB : 5;
	this._maxDeposit = opts.maxDeposit ? opts.maxDeposit : 1000000;
	this._maxChargeInterval = opts.maxChargeInterval ? opts.maxChargeInterval : 
		10;
	this._maxTimeLockDuration = opts.maxTimeLockDuration ? 
		opts.maxTimeLockDuration : (2 * DAY);

	this._keyPair = bitcoin.ECPair.makeRandom({
		network : this._network
	});

	if (!opts.recoveryHandler) {
		console.log('###### RECORD THIS ######\n'
			'Coin Temporary Wallet WIF for Recovery Purposes : ' + 
			this._keyPair.toWIF().toString() + '\n' + 
			'###### END ######\n');
	}

	this._fundingAddress = this._keyPair.getAddress();
	/** non-init stuff **/
	this._polling = null; // object returned by setInterval. polling IpTables
	this._isFunded = false;
	this._clientBalance = 0;

	this._activeChannels = [];
}

/**
 * Checks if a provider TOS is acceptable by a client.
 * Biternet nodes DO NOT use this method as OSLRD checks for the most optimal
 * path in terms of reliability and cost.
 *
 * ARGUMENT
 * @providerAd, the advertisement message by the provider
 */
ClientChannelManager.prototype.isChannelOK = function(providerAd) {
	return (providerAd.pricePerKB > this._maxPricePerKB || 
		providerAd.minDeposit > this._maxDeposit || 
		providerAd.maxChargeInterval > this._maxChargeInterval || 
		providerAd.minTimeLockDuration > this._maxTimeLockDuration
	) ? false : true; 
}

/**
 * Polls the funding address to check how much unspent output is available to 
 * purchase services from a provider.
 *
 * ARGUMENT
 * @callback, callback function to call when unspent outputs are found.
 * @networkHandler [OPTIONAL], a function to poll the blockchain for utxos
 */
ClientChannelManager.prototype.pollFunding = function(callback, networkHandler) {

}

/**
 * Starts a channel from a consumer perspective.
 *
 * ARGUMENT
 * @callback, callback function to call when the payment channel is set up.
 */
ClientChannelManager.prototype.startChannel = function(callback) {
	// run btc payment channel stuff.

}

/**
 * Processes an invoice sent by a provider
 *
 * NOTE: right now, it will just pay so as long the balance is positive.
 * Otherwise, it will volunteer to close the channel.
 */
ClientChannelManager.prototype.processInvoice = function(invoice, callback) {
	var channel = this._activeChannels[invoice.serverPubKey];
	if (invoice.requestedAmount > this._clientBalance) {
		channel.endService(callback);
	} else {
	 	channel.processInvoice(invoice);
	}
}