/**
 * Asteroids application
 */


function start() {
	var express = require('express'),
		app = express(),
		server = require('http').createServer(app),
		io = require('socket.io').listen(server),
		asteroids = require('./asteroids');
	
	server.listen(8080);
	
	app.get('/', function (req, res) {
		res.sendfile(__dirname + "/index.html");
	});
	app.use(express.static(__dirname + '/static'));
	
	
	var room = new asteroids.Room(50, 10);
	var client = room.createClient();
	client.forward();
	
	room.start();
	
	setInterval(function() {
		console.log(client.getX() + " " + client.getY() + " " + client.getRotation());
	}, 1000);
}


exports.start = start;
