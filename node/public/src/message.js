function checkParameter(expected, actual) {
	expected.forEach(function(p) {
		if (!actual.hasOwnProperty(p)) {
			throw new ParameterError('missing parameter : \" ' + p + ' \"');
		}
	})
}

function ClientMessage() {}

ClientMessage.TOSAcceptance = function(opts) {
	checkParameter(['consumerPubKey', 'deposit', 'refundTxHash', 'refundAddress'], 
		opts);
	return {
		consumerPubKey : opts.consumerPubKey,
		refundAddress : opts.refundAddress,
		deposit : opts.deposit,
		refundTxHash : opts.refundTxHash
	}
}
ClientMessage.Commitment = function(commitmentTxHash) {
	return {
		type : 'commitment',
		commitmentTx : commitmentTxHash
	}
}
ClientMessage.Payment = function(paymentTxHash) {
	return {
		type : 'payment',
		paymentTx : paymentTxHash
	}
}
ClientMessage.Refund = function(refundTxHash) {
	return {
		type : 'refund',
		refundTx : refundTxHash
	}
}
ClientMessage.Shutdown = function() {
	return {
		type : 'shutdown'
	}
}

module.exports = ClientMessage