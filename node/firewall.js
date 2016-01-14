const execSync = require('child_process').execSync;
const exec = require('child_process').exec;

function Firewall() {}

Firewall.applyForwardFiltering = function() {
  execSync('sudo iptables -N BITERNET_NODE_DOWN;sudo iptables -N BITERNET_NODE_UP;sudo iptables -P FORWARD DROP;sudo iptables -A FORWARD -j BITERNET_NODE_DOWN;sudo iptables -A FORWARD -j BITERNET_NODE_UP');
}

Firewall.approveFilter = function(ipaddr) {
  execSync('sudo iptables -I BITERNET_NODE_DOWN -d ' + ipaddr + ' -j ACCEPT; sudo iptables -I BITERNET_NODE_UP -s ' + ipaddr + ' -j ACCEPT');
}

Firewall.removeFilter = function(ipaddr) {
  execSync('sudo iptables -D BITERNET_NODE_DOWN -d ' + ipaddr + ' -j ACCEPT;sudo iptables -D BITERNET_NODE_UP -s ' + ipaddr + ' -j ACCEPT');
}

Firewall.undoForwardFiltering = function() {
  execSync('sudo iptables -P FORWARD ACCEPT;sudo iptables -F FORWARD;sudo iptables -X BITERNET_NODE_DOWN;sudo iptables -X BITERNET_NODE_UP');
}

Firewall.readUpAcct = function() {
  var output = execSync('sudo iptables -L BITERNET_NODE_UP -v -x -n').toString();
  output = output.split('\n');
  output = output.splice(2);
  output = output.map(function(line) {
    return line.match(/[\w\.\/]+/gi);
  })
  return output;
}

Firewall.readDownAcct = function() {
  var output = execSync('sudo iptables -L BITERNET_NODE_DOWN -v -x -n').toString();
  output = output.split('\n');
  output = output.splice(2);
  output = output.map(function(line) {
    return line.match(/[\w\.\/]+/gi);
  })
  return output;
}

Firewall.applyCaptive = function() {
  
}

Firewall.undoCaptive = function() {

}

module.exports = Firewall;