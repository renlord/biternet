var Consumer = require('btc-payment-channel').Consumer;

// server provides some of these values
var consumer = new Consumer({
	network : 'testnet',
	providerPublicKey : providerPublicKey,
	providerAddress : providerAddress,
	refundAddress : refundAddress
})
 
console.info('Send bitcoins to ' + consumer.fundingAddress.toString() + ' to 
	fund the channel');
// do we wait for the server to do something here?
consumer.processFunding();