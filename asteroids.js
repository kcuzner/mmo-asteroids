/**
 * Server side of the asteroids game
 */

var MAX_SPEED = 10.0; //10 m/s max
var MAX_ROT = 6.28; //2pi rad/s max
var FORWARD_FORCE = 1000; //2.5 N impulse forward
var ROT_TORQUE = 3.0; //3 Nm torque for rotating

var b2d = require('box2d'),
	util = require('util');



/**
 * Represents a player in a room
 */
function Player(body) {
	this.score = 0;
	
	this.body = body;
	this.body.m_userData = this;
}
//returns the current player x position
Player.prototype.getX = function() {
	return this.body.GetWorldCenter().x;
}
//returns the current player y position
Player.prototype.getY = function() {
	return this.body.GetWorldCenter().y;
}
//returns the current player rotation
Player.prototype.getRotation = function () {
	return this.body.GetAngle();
}
//moves a player in their current direction so long as their speed isn't exceeding the max
Player.prototype.forward = function () {
	var rotation = this.body.GetAngle();
	var force = new b2d.b2Vec2(Math.cos(rotation) * FORWARD_FORCE, Math.sin(rotation));
	this.body.ApplyForce(force, this.body.GetWorldCenter());
}
//rotates a player clockwise so long as their rotational speed isn't exceeding the max
Player.prototype.clockwise = function () {
	this.body.ApplyTorque(-ROT_TORQUE);
}
//rotates a player counterclockwise so long as their rotational speed isn't exceeding the max
Player.prototype.cclockwise = function () {
	this.body.ApplyTorque(ROT_TORQUE);
}



/**
 * A bot player
 */
function Bot(body) {
	Player.call(this, body);
}
util.inherits(Bot, Player);



/**
 * A human player
 */
function Client(body) {
	Player.call(this, body);
}
util.inherits(Client, Player);



/**
 * Represents a room with a given capacity
 */
exports.Room = function(capacity, maxBots) {
	this.__clientShape = new b2d.b2PolygonDef();
	this.__clientShape.SetAsBox(1.0, 1.0);
	this.__clientShape.density = 1.0;
	this.__clientShape.friction = 0.3;
	
	//a room contains a world with dimensions 500 by 500
	var worldAABB = new b2d.b2AABB();
	worldAABB.lowerBound.Set(-250.0, -250.0);
	worldAABB.upperBound.Set(250.0, 250.0);
	this.world = new b2d.b2World(worldAABB, new b2d.b2Vec2(0.0, 0.0), true);
	
	this.__intervalId = null;
};
//starts room simulation
exports.Room.prototype.start = function() {
	var self = this;
	
	var timestep = 1.0/60.0; //60fps
	var iterations = 10; //10 iterations
	
	this.__intervalId = setInterval(function () {
		self.world.Step(timestep, iterations);
	}, 1.0/60.0 * 1000);
}
//stops room simulation
exports.Room.prototype.stop = function() {
	if (this.__itervalId) {
		clearInterval(this.__intervalId);
		this.__intervalId = null;
	}
}
//Creates a client in a room
exports.Room.prototype.createClient = function() {
	var bodyDef = new b2d.b2BodyDef();
	bodyDef.position.Set(0.0, 0.0);
	bodyDef.angularDamping = 0.2;
	bodyDef.linearDamping = 0.2;
	
	var body = this.world.CreateBody(bodyDef);
	body.CreateShape(this.__clientShape);
	body.SetMassFromShapes();
	
	var client = new Client(body);
	
	return client;
}
//destroyes a player (bot or client) in a room
exports.Room.prototype.destroyPlayer = function(player) {
	var body = player.body;
	this.world.DestroyBody(body);
}