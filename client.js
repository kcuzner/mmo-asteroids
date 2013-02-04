/**
 * Handles human client interactions
 */

var clients = [];

function Client(room, socket) {
	var self = this;
	this.socket = socket;
	this.player = room.createClient();
	
	var forward = function () {
		self.player.forward();
	};
	var clockwise = function () {
		self.player.clockwise();
	};
	var cclockwise = function () {
		self.player.cclockwise();
	}
	//user countrol events
	socket.on('forward', forward);
	socket.on('clockwise', clockwise);
	socket.on('cclockwise', cclockwise);
	
	//user status events
	var status = function () {
		self.emitStatus();
	};
	socket.on('statusRequest', status);
	
	//socket events
	socket.on('disconnect', function () {
		socket.removeListener('forward', forward);
		socket.removeListener('clockwise', clockwise);
		socket.removeListener('cclockwise', cclockwise);
		socket.removeListener('statusRequest', status);
		
		room.destroyPlayer(self.player); //we are done with this client
		
		//remove us from the list of clients
		clients.splice(clients.indexOf(self), 1);
		console.log("There are " + clients.length + " clients.");
	});
	
	this.emitStatus();
};
Client.prototype.emitStatus = function () {
	this.socket.emit('status', {
		x: this.player.getX(),
		y: this.player.getY(),
		rot: this.player.getRotation(),
		velocity: this.player.getLinearVelocity(),
		omega: this.player.getAngularVelocity()
	});
}

exports.makeSocketHandler = function (room) {
	return function(socket) {
		clients.push(new Client(room, socket));
		console.log("There are " + clients.length + " clients.");
	};
};
