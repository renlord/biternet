'use strict';

function ServerMessage() {}

function ClientMessage() {}

class ParameterError extends Error {}

function checkParameter(expected, actual) {
	expected.forEach(function(p) {
		if (!actual.hasOwnProperty(p)) {
			throw new ParameterError('missing parameter : \" ' + p + ' \"');
		}
	})
}

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

ServerMessage.Invoice = function(opts) {
	checkParameter(['incrementAmount', 'totalPaidAmount', 'usage', 'totalUsage',
		'pricePerKB', 'time'], opts);

	return {
		incrementAmount : opts.incrementAmount,
		totalPaidAmount : opts.totalPaidAmount,
		usage : opts.usage,
		totalUsage : opts.totalUsage,
		pricePerKB : opts.pricePerKB,
		time : opts.time
	}
}

ClientMessage.Commitment = function(commitmentTxHash) {
	return {
		type : 'commitment',
		commitmentTx : commitmentTxHash
	}
}

ServerMessage.InvalidCommitment = function() {
	return {
		type : 'commitment',
		outcome : 'invalid'
	}
}

ServerMessage.ValidCommitment = function() {
	return {
		type : 'commitment',
		outcome : 'valid'
	}
}

ClientMessage.Payment = function(paymentTxHash) {
	return {
		type : 'payment',
		paymentTx : paymentTxHash
	}
}

ServerMessage.PaymentReceipt = function(timestamp) {
	return {
		type : 'payment',
		invoiceTimestamp : timestamp
	}
}

ServerMessage.PaymentInvalid = function(invoice) {
	return {
		type : 'payment',
		invoice : invoice
	}
}

ClientMessage.Refund = function(refundTxHash) {
	return {
		type : 'refund',
		refundTx : refundTxHash
	}
}

ServerMessage.SignedRefund = function(refundTxHash) {
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

ServerMessage.Shutdown = function() {
	return {
		type : 'shutdown'
	}
}

ServerMessage.Teardown = function() {
	return {
		type : 'teardown'
	}
}

module.exports = {
	ClientMessage : ClientMessage,
	ServerMessage : ServerMessage
}