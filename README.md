# Biternet
Mesh networking with Bitcoins. 
A complete repository that allows you to charge clients using Bitcoin Micropayment Channels when selling your bandwidth or while retailing on behalf of another node.

*This Project is a proof of concept*

Link to the Full Writeup: 
ftp://ftp.tik.ee.ethz.ch/pub/students/2015-HS/SA-2015-34.pdf

## Requirements
- [OLSRD](http://www.olsr.org) 
- [Debian Jessie](https://www.debian.org/releases/stable/)
- [hostapd-rtl8188](https://github.com/lostincynicism/hostapd-rtl8188) 
- Node.js, NPM (Node.js Package Manager)

## Tested Hardware
- Edimax EW 7811un (RTL8192cu Driver - Ad Hoc Mode FAILS, only used for DHCP AP or Dongle acting as WAN Gateway)
- Tp-Link TL-WN722N (Ad-Hoc Mode works OK)
- Raspberry Pi 2 Model B

## Setup Instructions
1. run `git submodule init & git submodule udpate`
2. run `setup.sh`
This script should set up the appropriate configurations for your Raspberry Pi's network interfaces.

## Troubleshooting
1. Separate IBSS (Ad-Hoc Cells)
This is frequent occurance when starting up Raspberry Pis simultaneously. A quick fix would be to unplug the Ad-Hoc WiFi Dongle and re-plugging it back in. The cause of this problem is due to the fact at start up both WiFi dongles will attempt to scan for beacons, but since beacons were not detected at boot up, both will then start broadcasting their own cells, thus creating two separate Ad-Hoc networks with differing Cell IDs.

## Problems
1. Mid Link Interruptions
Suppose the current topology of the mesh network is as follows:
Client -> A -> B -> C -> Internet
If Node B were to fail whilst A was providing relay services on behalf of B and C. Relay A and B will lose all its potential receipts. While C will still be able to commit its latest Microtransaction.

