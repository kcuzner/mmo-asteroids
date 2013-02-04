/**
 * Represents a room
 * 
 * Rooms are responsible for keeping track of the clients
 */

var b2d = require('box2d');
var roomIndex = 0;

var Room = function() {
	var self = this;
	this.id = roomIndex++;
	
	this.__nextId = 0;
	
	this.__clientShape = new b2d.b2PolygonDef();
	this.__clientShape.SetAsBox(1.0, 1.0);
	this.__clientShape.density = 1.0;
	this.__clientShape.friction = 0.3;
	
	this.clients = {};
	
	//a room contains a world with dimensions 500 by 500
	var worldAABB = new b2d.b2AABB();
	worldAABB.lowerBound.Set(-250.0, -250.0);
	worldAABB.upperBound.Set(250.0, 250.0);
	this.world = new b2d.b2World(worldAABB, new b2d.b2Vec2(0.0, 0.0), true);
	
	var timestep = 1.0/60.0; //60fps
	var iterations = 10; //10 iterations
	
	//step the world in real time
	var intervalId = setInterval(function () {
		self.world.Step(timestep, iterations);
	}, 1.0/60.0 * 1000);
	this.stop = function () {
		clearInterval(intervalId);
	}
}
Room.prototype = {
	addClient: function() { //adds a client and creates a body for it. returns a client object
		var id = this.__nextId++;
		
		var bodyDef = new b2d.b2BodyDef();
		bodyDef.position.Set(0.0, 0.0);
		bodyDef.angularDamping = 0.2;
		bodyDef.linearDamping = 0.2;
		
		var client = this.world.CreateBody(bodyDef);
		client.CreateShape(this.__clientShape);
		client.SetMassFromShapes();
		
		this.clients[id] = client;
		
		return { id: id, body: client };
	},
	removeClient: function(id) { //removes the client's body
		var body = this.clients[id];
		
		this.world.DestroyBody(body);
		delete this.clients[id]; //remove the reference from the array
	}
};

function create() {
	return new Room();
}

exports.create = create;
