/**
 * Asteroids application
 */


function start() {
	var express = require('express'),
		app = express(),
		server = require('http').createServer(app),
		io = require('socket.io').listen(server),
		asteroids = require('./asteroids'),
		clients = require('./client');
	
	server.listen(8080);
	
	app.get('/', function (req, res) {
		res.sendfile(__dirname + "/index.html");
	});
	app.use(express.static(__dirname + '/static'));
	
	var room = new asteroids.Room(50, 10);
	
	room.start();
	
	var handler = clients.makeSocketHandler(room);
	io.sockets.on('connection', handler);
}


exports.start = start;
