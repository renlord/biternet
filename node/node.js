const express 			 = require('express');
const bodyParser 		 = require('body-parser');
const process 			 = require('process');

const ProviderChannelManager = require('./server');
const ConsumerChannelManager = require('./client');
const RouteObserver          = require('./routes');
const Firewall 							 = require('./firewall');

const app 					 = express();
const server 				 = require('http').Server(app);
const io 						 = require('socket.io')(server);

const BITERNODE_PORT = 6164;
const DAY = 60 * 60 * 24;

/**
 * Biternode Instance
 * This is where all the action is
 * 
 * Arguments {} object
 * @provideClientService, exposes the Biternet network to clients?
 * @providerDetails, 			refer to documentation
 * @consumerDetails, 			refer to documentation
 * @debugMode [OPTIONAL], defaults to false
 */
function Biternode(config) {
	var compulsoryProperties = ['providerDetails', 'consumerDetails', 
		'provideWebClientService'
	];

	compulsoryProperties.forEach(function(p) {
		if (!config.hasOwnProperty(p)) {
			throw new Error('Missing parameter : \"' + p + '\" for Biternode Instance');
		}
	});

	this._hasInternetConnectivity = false;
	this._provideInternetConnectivity = false;

	// provision of relay service is MANDATORY in the Biternet Network.
	this._provideWebClientService = config.provideWebClientService;
	this._canProvideWebClientService = false;

	this._providerChannelManager = new ProviderChannelManager(config.providerDetails);
	this._consumerChannelManager = new ConsumerChannelManager(config.consumerDetails);
	
	var self = this;
	this._routeObserver = new RouteObserver(function(res) {
		switch (res) {
			case 'found gateway':
				console.log('found gateway : ' + self._routeObserver._toInternetRoute);
				self._hasInternetConnectivity = true;
				self.contactNode(self._routeObserver._toInternetRoute);
				self._canProvideWebClientService = true;
				break;

			case 'gateway changed':
				console.log('gateway changed to : ' + self._routeObserver._toInternetRoute);
				self.contactNode(self._routeObserver._toInternetRoute);
				break;

			case 'no gateway':
				self._hasInternetConnectivity = false;
				self._canProvideWebClientService = false;
				break;
		}
	});

	this.init();
}

Biternode.prototype.init = function() {
	app.use(bodyParser.json()); // for parsing application/json
	app.use(express.static('public'));

	var self = this; 

	app.get('/', function(req, res, next) {
		// choose what application to serve depending if there is a route to internet
		// or not!
		if (this._provideWebClientService && this._canProvideWebClientService) {
			res.sendFile(__dirname + 'app.html');
		} else {
			res.sendFile(__dirname + 'noapp.html');
		}
	});

	// BTC Payment Protocol
	app.get('/payment', function(req, res, next) {
		res.send('hi');
	})

	io.on('connection', function(socket) {
		// provider side logic
		var ipaddr = socket.request.connection.remoteAddress;
		console.log('\"' + ipaddr + '\" connected');
		
		socket.emit('TOS', self._providerChannelManager.getAdvertisement());

		socket.on('acceptTOS', function(data) {
			// needs to contain clientDeposit, clientPubKey
			console.log('\"' + ipaddr + '\" starting channel');
			self._providerChannelManager.startChannel(ipaddr, data);
		});

		socket.on('channel', function(data) {
			// socket has IP information
			var _socket = socket;
			switch(data.type) {
				case 'refund':
					console.log('received refund from \"' + ipaddr + '\"');
					self._providerChannelManager.processRefund(ipaddr, data.refund);
					break;

				case 'commitment':
					// once a commitmentTx is confirmed and valid. The channel will be 
					// activated. 
					console.log('received commitment from \"' + ipaddr + '\"');
					self._providerChannelManager.processCommitment(ipaddr, data.commitment);
					break;

				case 'payment': 
					// process payment and keep paymentTx
					console.log('received payment from \"' + ipaddr + '\"');
					self._providerChannelManager.processPayment(ipaddr, data.payment);
					break;

				case 'error':
					self._providerChannelManager.processError(ipaddr, data.error);
					break;
			}
		});

		socket.on('biternet', function(data) {
			switch(data.type) {
				case 'shutdown':

					break;
			}
		});

		socket.on('disconnect', function() {
			console.log('\"' + ipaddr + '\" disconnected');
			self._providerChannelManager.shutdown(ipaddr);
		});

	});
	// initiates a socket io server
	server.listen(BITERNODE_PORT);
}

// BITERNODE CLIENT OPERATIONS

Biternode.prototype.contactNode = function(ipaddr) {
	// socket connect
	this._consumerChannelManager.contactNode(ipaddr);
}


// BITERNODE GENERAL OPERATIONS

/**
 *
 */
Biternode.prototype.shutdown = function() {
	this._providerChannelManager.shutdown();
	this._consumerChannelManager.shutdown();
	setTimeout(function() {
		console.log('Biternet Node shutting down NOW!');
		process.exit()
	}, 60000)
	console.log('Biternet Node shutting down in 60 seconds');
}

module.exports = Biternode;
