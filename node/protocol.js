Protocol.closeChannel = function() {
	return {
		type : 'close'
	}
}

Protocol.startChannel = function() {
	return {
		type : 'start'
	}
}

Protocol.billing = function(amount) {
	return {
		type : 'billing',
		amount : amount
	}
}

Protocol.error = function(err, msg) {
	return {
		type : 'error',
		error : err,
		msg : msg
	}
}

Protocol.warning = function(msg) {
	return {
		type : 'warning',
		message : msg
	}
}

module.exports = Protocol;