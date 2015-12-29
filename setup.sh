#!/bin/bash

# apt-get stuff
sudo apt-get update
sudo apt-get -y upgrade
sudo apt-get -y dist-upgrade
sudo apt-get -y autoremove

sudo apt-get -y install iptables-persistent
sudo apt-get -y install olsrd
sudo apt-get -y install dnsmasq

# olsrd configuration

# iptables configuration
sudo iptables -t nat -A POSTROUTING -o wlan0 -j MASQUERADE
sudo iptables-save

# wlan0 is always designated for olsr interface
# wlan1 is for connecting to the internet
# wlan2 if for providing WiFi connectivity
# assign the correct interface name for your wireless device

# turn off ifplug.d

