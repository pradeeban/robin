### Robin ###

### UniPlaces Proxy ###

### Features
* Proxies the deployments.
* Based on the weight function, directs the traffic to the deployments.


### Directory Structure
├── abproxy
│   ├── etc
│   │   └── config.json
│   ├── package.json
│   ├── proxy.js
│   └── README.md


### Installing Node and npm
If you are entirely new to NodeJs, you may have to install NodeJS and npm first.
* Install Node.js on Ubuntu.
sudo apt-get install nodejs 

* Install npm (node package manager)
sudo su
curl https://npmjs.org/install.sh | sh


### Installing the dependencies
* Install node-http-proxy
npm install http-proxy

* Install the configuration (JSON) loader, node-etc
npm install etc


### To run
From the abproxy folder,
node proxy

To be able to bind port 80 to the proxy
sudo setcap 'cap_net_bind_service=+ep' path_to_node
For example,
sudo setcap 'cap_net_bind_service=+ep' /usr/bin/node

Note: proxy_port is an optional parameter in config.json.
"proxy_port": "8000",
Default is, 80.
