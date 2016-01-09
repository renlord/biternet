var process = require('process');
var routes = require('./routes');
//var channel = require('./channel');
var config = require('./config.json');


/**
 * initIpTables
 *
 * bunch of execSync procedures to create IpTables and add rules to tables
 */
function initIpTables() {

}

/**
 * cleanUpIpTables
 * 
 * bunch of execSync procedures to flush IPTables to set them back to their 
 * original state.
 */ 
function cleanUpIpTables() {

}

function BiternetNode(config) {
	this.uri = config.uri;
	this.callsign = config.callsign;
}	



BiternetNode.prototype.getPaymentAddr = function() {

}

function verifyConfig() {
	if (!config) throw new Error('config does not exist! config must be named \
		`config.json`!');
	if (!config.callsign) throw new Error('no callsign field in config file');
	if (!config.uri) throw new Error('no URI resource!');
}

try {
	verifyConfig();
} catch (err) {	
	console.log(err);
	process.exit(1);
}