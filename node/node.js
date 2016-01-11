var app 					 = require('express')();
var bodyParser 		 = require('body-parser');
var server 				 = require('http').Server(app);
var io 						 = require('socket.io')(server);

var ChannelManager = require('./channel');
var RouteObserver  = require('./routes');

const BITERNODE_PORT = 6164;
const DAY = 60 * 60 * 24;

/**
 * ClientPreAuth
 * An object instance to be held by the Channel Manager. Indicate the pre-
 * autheticated preference of the Biternet Node.
 * 
 * @maxPricePerKB [OPTIONAL], 							price per kB in satoshis
 * @maxDeposit [OPTIONAL], 							btc amount in satoshis
 * @maxChargeInterval [OPTIONAL], 					charging interval in seconds
 * @maxTimeLockDuration [OPTIONAL], 		the min. timelock duration the provider 
 																				instance is willing to accept (in seconds)
 */
function ConsumerPreAuth(opts) {
	this._maxPricePerKB = opts.maxPricePerKB ? opts.maxPricePerKB : 5;
	this._maxDeposit = opts.maxDeposit ? opts.maxDeposit : 1000000;
	this._maxChargeInterval = opts.maxChargeInterval ? opts.maxChargeInterval : 
		10;
	this._maxTimeLockDuration = opts.maxTimeLockDuration ? 
		opts.maxTimeLockDuration : (2 * DAY);

}

ConsumerPreAuth.prototype.isChannelOK = function(providerAd) {
	return (providerAd.pricePerKB > this._maxPricePerKB || 
		providerAd.minDeposit > this._maxDeposit || 
		providerAd.maxChargeInterval > this._maxChargeInterval || 
		providerAd.minTimeLockDuration > this._maxTimeLockDuration
	) ? false : true; 
}

/**
 * Biternode Instance
 * This is where all the action is
 * 
 * Arguments {} object
 * @ipv4Address, 					ipv4Address for the current Biternet Node.
 * @provideClientService, exposes the Biternet network to clients?
 * @providerDetails, 			refer to documentation
 * @consumerDetails, 			refer to documentation
 * @debugMode [OPTIONAL], defaults to false
 */
function Biternode(config) {
	var compulsoryProperties = ['ipv4Address', 'providerDetails', 
		'consumerDetails', 'provideRelayService'
	];

	compulsoryProperties.forEach(function(p) {
		if (!config.hasOwnProperty(p)) {
			throw new Error('Missing parameter : \"' + p + '\" for Biternode Instance');
		}
	});

	this._hasInternetConnectivity = false;
	this._provideInternetConnectivity = false;
	this._provideClientService = opts.provideRelayService;
	this._ipv4Address = opts.ipv4Address;

	this._channelManager = new ChannelManager(config.providerDetails);
	this._consumerPreAuth = new ConsumerPreAuth(config.consumerDetails);
	this._routeObserver = new RouteObserver();
	this.debugMode = false;
}

Biternode.prototype.init = function() {
	app.use(bodyParser.json()); // for parsing application/json

	app.get('/node', function(req, res, next) {
		this._channelManager.sendAdvertisement(res.send);
	});

	app.post('/node', function(req, res, next) {
		// initiates a socket io channel
		this._channelManager.startChannel(res.send);
	});

	if (this._provideClientService) {
		app.get('/', function(req, res, next) {
			// initiates a socket io channel

			// depending on Internet Availability. The node will serve different UIs.
		});
	}

	io.on('connection', function(socket) {
		// provider side logic
		this._channelManager.sendAdvertisement(socket.emit);
		socket.on('acceptTOS', function(data) {

		});

		socket.on('coin', function(data) {

		});

		socket.on('biternode', function(data) {

		});

		// consumer side logic
		socket.on('TOS', function(data) {

		});

		socket.on('coin', function(data) {

		});

		socket.on('biternode', function(data) {

		});
	});

	// initiates a socket io server
	server.listen(BITERNODE_PORT);
}

Biternode.prototype.run = function() {
	if (!this._provideInternetConnectivity) {

	} 
}

Biternet.prototype.shutdown = function() {
	this._channelManager.shutdown();
	console.log('Biternet Node shutting down now... 60 seconds to tidy everything 
		up');
}