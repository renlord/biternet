#!/bin/bash

cwd=pwd

# apt-get stuff
sudo apt-get update
sudo apt-get -y upgrade
sudo apt-get -y dist-upgrade
sudo apt-get -y autoremove

sudo apt-get -y install iptables-persistent
sudo apt-get -y install olsrd
sudo apt-get -y install dnsmasq

# nodejs installation
if [ -f /bin/node ]; then
    echo "nodejs found... "
else
    echo "installing nodejs"
    wget https://nodejs.org/dist/v4.2.4/node-v4.2.4-linux-armv7l.tar.gz
    tar xzvf node-v4.2.4-linux-armv7l.tar.gz 
    nodeid=node-v4.2.4-linux-armv7l
    sudo cp -r "$cwd/$nodeid/* /usr/."
    sudo rm -f "/usr/*.md"
    sudo rm -f "/usr/LICENSE"
    rm -rf "$cwd/$nodeid"
    rm -f "$cwd/node-v4.2.4-linux-arm7l.tar.gz"
fi

sudo npm install -g npm

# olsrd configuration


# iptables configuration
sudo iptables -t nat -A POSTROUTING -o wlan0 -j MASQUERADE
sudo iptables-save

# wlan0 is always designated for olsr interface
# wlan1 is for connecting to the internet
# wlan2 if for providing WiFi connectivity
# assign the correct interface name for your wireless device

# turn off ifplug.d
