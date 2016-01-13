const bitcoin = require('bitcoinjs-lib');
const payment_channel = require('btc-payment-channel');

const request = require('request');

const TESTNET_URL 		= 'https://testnet.blockexplorer.com/api/addr/';
const UTXO						= '/utxo';
const BTC 						= 100000000;
const TX_FEE 					= 1000;

 /**
 * ClientChannel 
 * An object instance to account for a channel between two nodes.
 * When the channel instance is created, it is assumed that the negotiation is 
 * complete and payment objects are intiailised. 
 *
 * Arguments {} Object
 * @deposit
 * @serverIP
 * @consumer
 */
function ClientChannel(opts) {
	var compulsoryProperties = ['deposit', 'serverIP', 'socket', 'consumer'];
	compulsoryProperties.forEach(function(p) {
		if (!opts.hasOwnProperty(p)) {
			throw new Error('missing parameter for Channel : \"' + p + '\"');
		}
	})

	this._deposit = opts.deposit;	
	this._serverIP = opts.serverIP;
	this._socket = opts.socket;

	// payment information
	this._billedData = 0;
	this._elapsedTime = 0; // seconds
	this._warningTime = 0;

	this._consumer = opts.consumer;

	var socket = this._socket;
	this._consumer.sendRefundTx(function(refundTxHex) {
		socket.emit('channel', {
			type : 'init',
			partialRefundTx : refundTxHex
		});
	});
}

/**
 * processes an invoice sent by the provider server
 *
 */
ClientChannel.prototype.processInvoice = function(invoice) {
	if (invoice.amount > (this._consumer._deposit - this._consumer._sentAmount)) {
		throw new ClientChannel.InsufficientFundError();
	}
	var socket = this._socket;
	var sendPaymentHandle = function(refundTxHex) {
		var paymentMsg = {
			type : 'payment',
			clientIP : this._serverIP,
			refundTx : refundTxHex,
		};
		socket.emit('channel', paymentMsg);
	}
	this._consumer.incrementPayment(invoice.amount, sendPaymentHandle);
}

ClientChannel.prototype.closeChannel = function(socketEmit) {
	socketEmit('channel', {
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
ClientChannelManager.prototype.isChannelOK = function(providerAd) {
	return (providerAd.pricePerKB > this._maxPricePerKB || 
		providerAd.minDeposit > this._maxDeposit || 
		providerAd.maxChargeInterval > this._maxChargeInterval || 
		providerAd.minTimeLockDuration > this._maxTimeLockDuration
	) ? false : true; 
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
		'refundAddress', 'paymentAddress'
	];

	compulsoryProperties.forEach(function(p) {
		if (!opts.hasOwnProperty(p)) {
			throw new Error('missing parameter for Channel : \"' + p + '\"');
		}
	});

	request
	.get(TESTNET_URL + this._fundingAddress + UTXO)
	.on('data', function(chunk) {
		var utxos = JSON.parse(chunk.toString('utf8'));	
		var utxoValue = 0;
		var utxoKeys = [];
		for (var i = 0; i < utxos.length; i++) {
			utxoValue += utxo.amount;
			utxoKeys.push(this._keyPair);
		}
		utxoValue = Math.round(utxoValue);

		if (utxoValue < opts.deposit) {
			throw new Error('Summed UTXOs is less than indicated deposit amount');
		}

		var consumerRequiredDetails = {
			deposit : opts.deposit,
			serverIP : opts.ipaddr,
			consumer : new payment_channel.Consumer({
				consumerKeyPair : this._keyPair,
				providerPubKey : opts.serverPublicKey,
				refundAddress : opts.refundAddress,
				paymentAddress : opts.paymentAddress,
				utxos : utxos,
				utxoKeys : utxoKeys,
				depositAmount : opts.deposit,
				txFee : TX_FEE,
				network : bitcoin.networks.test
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