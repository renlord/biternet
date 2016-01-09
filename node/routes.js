var exec = require('child_process').exec;
var execSync = require('child_process').execSync;

function RouteObserver(interfaces, callback) {
	this.routes = [];
	this.toInternetRoute = '';
	this.subscribers = [];
}

/**
 * @callback, handler function to handle if the .toInternetRoute changes!
 */
RouteObserver.prototype.pollInternetRoute = function() {
	var intervalObj = setInterval(function() {
		var gateway = gatewayRoute();
		if (gateway === null) {
			// Route via this relay no longer has Internet.
			this.subscribers.forEach(function(subscriber) {
				subscriber.notifyRouteChange('no internet');
			})
		}
		if (gateway !== this.toInternetRoute) {
			// Gateway changed.
			// notify other services
			this.subscribers.forEach(function(subscriber) {
				subscriber.notifyRouteChange('gateway changed');
			})
		}
	}, 2000);
}

RouteObserver.prototype.notifyShutdown = function() {
	var neighbours = neighbouringRoutes();
	neighbours.forEach(function(neighbour_ip) {

	})
}

/**
 * @callback, function to handle return from `exec`
 * ASYNC returns ONE route that should lead to an Internet Gateway!
 */
function gatewayRoute() {
	try {
		return execSync('ip route show to 0/0').toString('utf8').match('[0-9]+.[0-9]+.[0-9]+.[0-9]+')[0];
	} catch(err) {
		console.log(err);
	}
	return null;
}

/** 
 * returns a list of neighouring ip addresses
 */
function neighbouringRoutes() {
	var routes = [];
	var _routes = execSync('ip route show dev wlan0').toString('utf8');
	_routes = _routes.split('\n').filter(function(r) {
		if (r.search('onlink') != -1) {
			return r;
		}
	});
	_routes.forEach(function(r) {
		var ipaddr = route.match('[0-9]+.[0-9]+.[0-9]+.[0-9]+');
		
			if (ipaddr.index === 0) {
				routes.push(ipaddr[0]);
			}
	})
	return routes;
}