# Biternet Node Setup Instructions
---
### Enabling routing to localhost
`sysctl -w net.ipv4.conf.eth0.route_localnet=1`

### IpTable Rules for Captive Portal
1. Create a GREEN ZONE for approved devices (usage tracking)
  `iptables -t nat -N GREEN_ZONE`
  `iptables -t nat -A PREROUTING -j GREEN_ZONE`
  `iptables -t nat -A GREEN_ZONE -j ACCEPT`

2. Default DROP rules for all non-approved devices

3. Biternet Inter-Node Communication
  Node -> Node
  `iptables -t nat -A POSTROUTING -p all -o wlan0 -j MASQUERADE`

  Node -> WAN
  `iptables -t nat -A POSTROUTING -p all -o wlan1 -j MASQUERADE`
  
  It is assumed that the *wlan0* interface is used for Ad-Hoc connectivity. While the *wlan1* interface is used for connecting to WAN.

  When nodes with a route to *default* attempt to ping 8.8.8.8 and they fail to get a valid response, they will assume that they are not in a node's "GREEN ZONE". They will then contact the node providing a default gateway on port 3000 to initiate a payment channel.

  Otherwise, normal clients utilizing the Biternet Network will simply trigger a Captive Portal and etc...

### IpTable Rules to Add and Remove devices from the GREEN_ZONE
`iptables -t nat -I PREROUTING`