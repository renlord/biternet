'use strict';

function Message() {}

class ParameterError extends Error {}

function checkParameter(expected, actual) {
	expected.forEach(function(p) {
		if (!actual.hasOwnProperty(p)) {
			throw new ParameterError('missing parameter : \" ' + p + ' \"');
		}
	})
}

Message.invoice = function(opts) {
	checkParameter(['payAmount', 'totalPaidAmount', 'usage', 'totalUsage',
		'pricePerKB', 'time'], opts);

	this.payAmount = opts.payAmount;
	this.totalPaidAmount = opts.totalPaidAmount;
	this.usage = opts.usage;
	this.totalUsage = opts.totalUsage;
	this.pricePerKB = opts.pricePerKB;
	this.time = opts.time;
}

Message.InvalidCommitment = function() {
	return {
		type : 'commitment',
		outcome : 'invalid'
	}
}

Message.ValidCommitment = function() {
	return {
		type : 'commitment',
		outcome : 'valid'
	}
}