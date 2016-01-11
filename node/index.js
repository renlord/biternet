var config 					= require('./config.json');
var Biternode 			= require('./node');

/**
 * initIpTables
 *
 * bunch of execSync procedures to create IpTables and add rules to tables
 */
function initIpTables() {
	var add_header = 'sudo iptables -t nat -A'
	BITERNODE_IPTABLE_RULES.forEach(function(rule) {
		process.execSync(add_header + rule);
	})
}

/**
 * cleanUpIpTables
 * 
 * bunch of execSync procedures to flush IPTables to set them back to their 
 * original state.
 */ 
function cleanUpIpTables() {
	var remove_header = 'sudo iptables -t nat -D'
	BITERNODE_IPTABLE_RULES.forEach(function(rule) {
		process.execSync(remove_header + rule);
	})
}

console.log('========= Biternet Node =========');
new Biternode(config);

throw new Error('control flow should not reach here!');