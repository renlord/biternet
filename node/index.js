const process 				= require('process');
const config 					= require('./config.json');
const Biternode 			= require('./node');

console.log('========= Biternet Node =========');
var biternode = new Biternode(config);

process.on('SIGTERM', function()) {
	biternode.shutdown();
}
console.log('biternet node running...');