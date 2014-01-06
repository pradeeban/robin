var httpProxy = require('http-proxy/lib/node-http-proxy'),
    etc = require('etc'),
    Cookies = require('cookies');

Robin.prototype.maximumWeight = 1000;
Robin.prototype.defaultPort = 80;

function Robin() {
    var configObject = etc().argv().env().etc();
    this.conf = configObject.toJSON();
    this.noOfDeployments = this.conf.deployments.length;
    this.cookieName = this.conf.cookie_name;
    this.deployments = this.initDeployments();
    this.expiryTime = this.getExpiryTime();
    this.labels = this.initLabels();
    this.labelledDeployments = this.labelDeployments();
    this.defaultDeployment = null; 
    this.defaultDeploymentIndex = 0;
}

Robin.prototype.initDeployments = function () {
    this.deployments = [];
    for (var i = 0; i < this.noOfDeployments; i++) {
        this.deployments[i] = {
            host: this.conf.deployments[i].addr,
            port: this.conf.deployments[i].port
        };
        if ((this.conf.deployments[i].addr == this.conf.default_deployment) && 
            (this.conf.deployments[i].port == this.conf.default_deployment_port)) {
            this.defaultDeploymentIndex = i;
            this.defaultDeployment = this.deployments[i];
        }
    }
    return this.deployments;
}

Robin.prototype.initLabels = function () {
    this.labels = [];
    for (var i = 0; i < this.noOfDeployments; i++) {
        this.labels[i] = this.conf.deployments[i].label;
    }
    return this.labels;
}

Robin.prototype.labelDeployments = function () {
    this.labelledDeployments = []; 
    for (var i = 0; i < this.noOfDeployments; i++) {
        this.labelledDeployments[this.labels[i]] = this.deployments[i];
    }
    return this.labelledDeployments;
}

Robin.prototype.getProxyPort = function () {
    return this.conf.proxy_port || this.defaultPort; // "proxy_port" is optional in config.json.
}

Robin.prototype.getExpiryTime = function () {
    var currentTimeInMillis = new Date().getTime();
    var expires = parseInt(this.conf.expires);
    var expiryTime = new Date(currentTimeInMillis + expires);
    return expiryTime;
}

Robin.prototype.proxyRequests = function (req, res, proxy) {
    var target;
    var cookies = new Cookies(req, res);
    var receivedValue = cookies.get(this.cookieName);

    if (typeof this.labelledDeployments[receivedValue] != 'undefined') { //valid cookie in the request
        target = this.labelledDeployments[receivedValue];
        proxy.proxyRequest(req, res, target);
     } else { // no valid cookie found in the request
        this.proxyRequestFirstTime(req, res, proxy);
     }    
}

Robin.prototype.proxyRequestFirstTime = function (req, res, proxy) {
    var cookies = new Cookies(req, res);
    var receivedValue = cookies.get(this.cookieName);
    var deploymentIndex, target;
    var cookies = new Cookies(req, res);

    if (typeof receivedValue == 'undefined') { // No cookie in the request. Initial request.
        deploymentIndex = this.findDeployment(); // Find a deployment
        target = this.deployments[deploymentIndex];
     }  
     else { // A cookie exists in the request, but doesn't match any of the labels.
        deploymentIndex = this.defaultDeploymentIndex; // Match the default deployment.
        target = this.defaultDeployment;
     }

    var cookieValue = this.labels[deploymentIndex];
    cookies.set(this.cookieName, cookieValue, {expires: this.expiryTime}, {domain: req.headers.host});
    res.writeHead( 302, { "Location": req.url } );
    return res.end();
}

Robin.prototype.findDeployment = function () {
    var randomnumber= this.generateRandomNumber();
    var depWeight;
    for (var i = 0; i < this.noOfDeployments; i++) {
        depWeight = this.conf.deployments[i].weight;
        if (randomnumber < depWeight) {
            return i;
        } else {
            randomnumber = randomnumber - depWeight;
        }
    }
    return this.defaultDeploymentIndex;
}

Robin.prototype.generateRandomNumber = function () {
    var randomNumber = 
        Math.ceil( Math.random() * (this.conf.max_weight || this.maximumWeight) ); 
        // "max_weight" is optional in config.json.
    return randomNumber;
}

module.exports = Robin;
