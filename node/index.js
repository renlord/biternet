var account = require('./accounting.js');
var iproute = require('iproute');

var express = require('express');
var app = express();

app.listen(3000);
app.use(express.static('public'));

app.get('/', function(req, res) {
	res.sendFile('index.html');
})