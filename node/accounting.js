var iptables = require('iptables');

exports.Account = function(ip) {
	this.ruleNumber = 0;
	this.ipv4 = ip;
	this.max_quota = 0;
	this.used_quota = 0;
	this.rule_index = 0;
}

exports.AccountManager = function(params, byte_block) {
	this.drop_all_index = 0;
	this.forward_rule_counter = 0;
	this.byte_block = byte_block;
	// olsr 
	iptables.allow({
		chain : 'FORWARD',
		protocol : 'UDP',
		src : '0/0',
		dport : 698
	})
	// bitcoin
	iptables.allow({
		chain : 'FORWARD',
		protocol : 'TCP',
		src : '0/0',
		dport : 8333
	})
	if (debug) {
		iptables.allow({
			chain : 'FORWARD',
			protocol : 'ICMP'
		})
		iptables.allow({
			chain : 'FORWARD',
			protocol : 'ssh'
		})
		this.forward_rule_counter += 2;
	}
	iptables.reject({
		chain : 'FORWARD',
		src : '0/0'
	})
	this.forward_rule_counter += 3;
}

/**
 * Grants further privilleges to an IP address.
 */
AccountManager.prototype.authorise = function(account) {
	iptables.newRule(new ForwardRuleTemplate(account.ipv4));
}

/**
 * Revokes privilleges for an IP address
 */
AccountManager.prototype.deauthorise = function(account) {
	iptables.deleteRule(account.rule_index);
}

AccountManager.prototype.make_payment = function(account) {
	// reset quota limit. update quota usage on account.
	
}

AccountManager.prototype.

function ForwardRuleTemplate(ip, index, byte_limit) {
	if (typeof(ip) != "string") {
		ip = ipint2str(ip);
	}
	return {
		action : '-I ' + index,
		target : 'ACCEPT',
		chain : 'FORWARD',
		src : ip,
		module : {
			name : 'quota',
			args : '--quota ' + byte_limit
		}
	}
}

function update_set (xs, ys) {
	var zs = {
		prune: [],
		add: []
	};

	xs.sort();
	ys.sort();

	for (var x_i = 0, y_i = 0; x_i < xs.length && y_i < ys.length; ) {
		if (xs[x_i] < ys[y_i]) {
			zs.prune.append(xs[x_i]);
			x_i++;
		}
		if (xs[x_i] > ys[y_i]) {
			zs.add.append(ys[y_i]);
			y_i++;
		}
		if (xs[x_i] == ys[y_i]) {
			x_i++;
			y_i++;
		} 
	}
	if (x_i < xs.length) {
		for (; x_i < xs.length; x_i++) {
			zs.prune.append(xs[x_i]);
		}
	} 
	if (y_i < ys.length) {
		for (; y_i < ys.length; y_i++) {
			zs.add.append(ys[y_i]);
		}
	}
	return zs;
}

function ipstr2int(ip_str) {
	var bytes = ip_str.split(".");
	var ip_int = 0;
	bytes.forEach(function(a) {
		ip_int = (ip_int << 8) + a;
	})
	return ip_int;
}

function ipint2str(ip_int) {
	var a = ip_int & 0xF000;
	var b = ip_int & 0xF00;
	var c = ip_int & 0xF0;
	var d = ip_int & 0xF;
	return a + "." + b + "." + c + "." + d;
}