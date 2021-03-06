'use strict';
const process 				= require('process');
const config 					= require('./config.json');
const Biternode 			= require('./node');

const Firewall				= require('./firewall');

console.log('========= Biternet Node =========');

var biternode = new Biternode(config);

process.on('SIGTERM', function() {
	console.log('Caught Terminate Signal...')
	biternode.shutdown()
});

process.on('SIGINT', function() {
	console.log('Caught Interrupt Signal...')
	biternode.shutdown()
})

console.log('biternet node running...');