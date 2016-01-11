var app 					 = require('express')();
var bodyParser 		 = require('body-parser');
var server 				 = require('http').Server(app);
var io 						 = require('socket.io')(server);
var process 			 = require('process');

var ProviderChannelManager = require('./server-channel');
var ConsumerChannelManager = require('./client-channel');
var RouteObserver  = require('./routes');

const BITERNODE_PORT = 6164;
const DAY = 60 * 60 * 24;

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

	this._providerChannelManager = new ProviderChannelManager(config.providerDetails);
	this._consumerChannelManager = new ConsumerChannelManager(config.consumerDetails);
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

		});
	}

	io.on('connection', function(socket) {
		// provider side logic
		socket.emit('TOS', this._providerChannelManager.getAdvertisement());

		socket.on('acceptTOS', function(data) {
			this._providerChannelManager.startChannel(data);
		});

		socket.on('channel', function(data) {
			var multisigAddr = data.id;

			switch(data.type) {
				case 'init':

					break;

				case 'payment':

					break;

				case 'close':

					break;
			}
		});

		socket.on('biternode', function(data) {
			var multisigAddr = data.id;

			switch(data.type) {
				case 'shutdown':

					break;
			}
		});

		// consumer side logic
		socket.on('TOS', function(data) {
			// for now, a Biternet Node will always just accept a Provider TOS
			socket.emit('acceptTOS', {

			});
		});

		socket.on('channel', function(data) {
			var multisigAddr = data.id;

			switch(data.type) {
				case 'init':

					break;

				case 'invoice':

					break;

				case 'warning':

					break;
			}
		});

		socket.on('biternode', function(data) {
			var multisigAddr = data.id;

			switch(data.type) {
				case 'shutdown':

					break;
			}

		});
	});

	// initiates a socket io server
	server.listen(BITERNODE_PORT);
}

Biternode.prototype.run = function() {
	if (!this._provideInternetConnectivity) {
		
	} 
}

/**
 *
 */
Biternet.prototype.shutdown = function() {
	this._providerChannelManager.shutdown();
	this._consumerChannelManager.shutdown();
	setTimeout(function() {
		console.log('Biternet Node shutting down NOW!');
		process.exit()
	}, 60000)
	console.log('Biternet Node shutting down in 60 seconds');
}