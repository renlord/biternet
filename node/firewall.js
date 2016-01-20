'use strict';
const execSync = require('child_process').execSync;

/* GRATIS DOMAINS */
const domain_whitelist = [
  'bitpay.com',
  'blockexplorer.com'
];

function Firewall() {}

Firewall.applyForwardFiltering = function() {
  // Initial Tables 
  execSync('sudo iptables -N BITERNET_NODE_DOWN;' + 
           'sudo iptables -N BITERNET_NODE_UP;' +
           'sudo iptables -P FORWARD DROP;' +
           'sudo iptables -A FORWARD -j BITERNET_NODE_DOWN;' +
           'sudo iptables -A FORWARD -j BITERNET_NODE_UP'
  );
  // DNS Forwarding
  execSync('sudo iptables -I FORWARD -p udp --dport 53 -j ACCEPT;' +
           'sudo iptables -I FORWARD -p udp --sport 53 -j ACCEPT'
  );

  // Whitelisting
  domain_whitelist.forEach(function(domain) {
    execSync('sudo iptables -I FORWARD -p tcp --dest ' + domain + ' -j ACCEPT;' +
             'sudo iptables -I FORWARD -p tcp --src ' + domain + ' -j ACCEPT'
    );
  });
}

Firewall.undoForwardFiltering = function() {
  execSync('sudo iptables -P FORWARD ACCEPT;' + 
           'sudo iptables -F FORWARD;' + 
           'sudo iptables -F BITERNET_NODE_DOWN;' + 
           'sudo iptables -F BITERNET_NODE_UP;' +
           'sudo iptables -X BITERNET_NODE_DOWN;' +
           'sudo iptables -X BITERNET_NODE_UP' 
  );
}

Firewall.approveFilter = function(ipaddr) {
  execSync('sudo iptables -I BITERNET_NODE_DOWN -d ' + ipaddr + ' -j ACCEPT;' +
           'sudo iptables -I BITERNET_NODE_UP -s ' + ipaddr + ' -j ACCEPT'
  );
}

Firewall.removeFilter = function(ipaddr) {
  execSync('sudo iptables -D BITERNET_NODE_DOWN -d ' + ipaddr + ' -j ACCEPT;' +
           'sudo iptables -D BITERNET_NODE_UP -s ' + ipaddr + ' -j ACCEPT'
  );
}

Firewall.readUpAcct = function() {
  var output = execSync('sudo iptables -L BITERNET_NODE_UP -v -x -n').toString();
  output = output.split('\n');
  output = output.splice(2);
  output = output.map(function(line) {
    return line.match(/[\w\.\/]+/gi);
  });
  return output;
}

Firewall.readDownAcct = function() {
  var output = execSync('sudo iptables -L BITERNET_NODE_DOWN -v -x -n')
    .toString();
  output = output.split('\n');
  output = output.splice(2);
  output = output.map(function(line) {
    return line.match(/[\w\.\/]+/gi);
  });
  return output;
}

module.exports = Firewall;