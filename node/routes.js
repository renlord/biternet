var exec = require('child_process').exec;
var execSync = require('child_process').execSync;

/**
 * returns the ip route to DEFAULT route (ie. Internet Gateway)
 */
function gatewayRoute() {
	try {
		return execSync('ip route show to 0/0')
						.toString('utf8')
						.match('[0-9]+.[0-9]+.[0-9]+.[0-9]+')[0];
	} catch(err) {

	}
	return null;
}

/** 
 * returns a list of neighouring ip addresses
 * 
 * For future use...
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

/**
 * RouteObserver
 * 
 * An observing function which watches if routes are available or not
 */
function RouteObserver(gatewayChangeHandler) {
	this._routes = [];
	this._toInternetRoute = null;
	this._foundGateway = false;

	var self = this;

	this._polling = setInterval(function() {
		var gateway = gatewayRoute();

		if (self._foundGateway) {
			if (gateway === null) {
				gatewayChangeHandler('no gateway');
				self._foundGateway = false;
				self._toInternetRoute = null;
			} else {
				gatewayChangeHandler('gateway changed');
				self._toInternetRoute = gateway;
			}
		} else {
			if (gateway) {
				gatewayChangeHandler('found gateway');
				self._foundGateway = true;
				self._toInternetRoute = gateway;
			}
		}
	}, 1000);
}

RouteObserver.prototype.shutdown = function() {
	clearInterval(this._polling);
}

module.exports = RouteObserver;