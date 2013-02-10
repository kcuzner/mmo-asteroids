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
	var shoot = function () {
		console.log("shoot");
		self.player.shoot();
	}
	var worldQuery = function (data) { //a query about world events from the client.
		var entityData = room.getEntitiesInsideBox(data.x, data.y, data.width, data.height);
		socket.emit('entities', entityData);
	}
	
	//tell the client who they are so they can find themselves in the entities
	var emitIdentity = function () {
		console.log("score");
		console.log(self.player.getScore());
		socket.emit('identity', { id: self.player.id, score: self.player.getScore() });
	}
	emitIdentity();
	
	//user countrol events
	socket.on('forward', forward);
	socket.on('clockwise', clockwise);
	socket.on('cclockwise', cclockwise);
	socket.on('shoot', shoot);
	
	//game status events
	socket.on('world', worldQuery);
	
	//socket events
	socket.on('disconnect', function () {
		socket.removeListener('forward', forward);
		socket.removeListener('clockwise', clockwise);
		socket.removeListener('cclockwise', cclockwise);
		socket.removeListener('shoot', shoot);
		socket.removeListener('world', worldQuery);
		
		room.destroyPlayer(self.player); //we are done with this client
		
		//remove us from the list of clients
		clients.splice(clients.indexOf(self), 1);
		console.log("There are " + clients.length + " clients.");
	});
	
	//player events
	this.player.on('scoreSet', function (score) {
		emitIdentity();
	});
	this.player.on('hit', function () {
		socket.emit('hit');
	});
};

exports.makeSocketHandler = function (room) {
	return function(socket) {
		clients.push(new Client(room, socket));
		console.log("There are " + clients.length + " clients.");
	};
};
