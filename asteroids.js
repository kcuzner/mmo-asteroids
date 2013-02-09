/**
 * Server side of the asteroids game
 */

var MAX_SPEED = 10.0; //10 m/s max
var MAX_ROT = 6.28; //2pi rad/s max
var FORWARD_IMPULSE = 10; //1000 N impulse forward
var ROT_IMPULSE = 0.5; //3 Nm torque for rotating

var Box2D = require('box2dweb-commonjs').Box2D,
	util = require('util');

var   b2Vec2 = Box2D.Common.Math.b2Vec2,
	b2BodyDef = Box2D.Dynamics.b2BodyDef,
	b2Body = Box2D.Dynamics.b2Body,
	b2FixtureDef = Box2D.Dynamics.b2FixtureDef,
	b2Fixture = Box2D.Dynamics.b2Fixture,
	b2World = Box2D.Dynamics.b2World,
	b2MassData = Box2D.Collision.Shapes.b2MassData,
	b2PolygonShape = Box2D.Collision.Shapes.b2PolygonShape,
	b2CircleShape = Box2D.Collision.Shapes.b2CircleShape,
	b2DebugDraw = Box2D.Dynamics.b2DebugDraw,
	b2AABB = Box2D.Collision.b2AABB;

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
//returns the current player linear velocity
Player.prototype.getLinearVelocity = function () {
	var v = this.body.GetLinearVelocity();
	return { x: v.x, y: v.y };
}
//returns the current player angular velocity
Player.prototype.getAngularVelocity = function () {
	return this.body.GetAngularVelocity();
}
//moves a player in their current direction so long as their speed isn't exceeding the max
Player.prototype.forward = function () {
	var rotation = this.body.GetAngle();
	var force = new b2Vec2(Math.cos(rotation) * FORWARD_IMPULSE, Math.sin(rotation) * FORWARD_IMPULSE);
	this.body.ApplyImpulse(force, this.body.GetWorldCenter());
}
//rotates a player clockwise so long as their rotational speed isn't exceeding the max
Player.prototype.clockwise = function () {
	var angle = this.body.GetAngle();
	var rotation = angle + Math.PI / 2; //angle we are going to apply the force at
	var force = new b2Vec2(Math.cos(rotation) * ROT_IMPULSE, Math.sin(rotation) * ROT_IMPULSE);
	var point = this.body.GetWorldCenter(); //this will be translated slightly
	point = new b2Vec2(point.x, point.y);
	point.x += Math.cos(angle) * 2;
	point.y += Math.sin(angle) * 2;
	this.body.ApplyImpulse(force, point);
}
//rotates a player counterclockwise so long as their rotational speed isn't exceeding the max
Player.prototype.cclockwise = function () {
	var angle = this.body.GetAngle();
	var rotation = angle - Math.PI / 2; //angle we are going to apply the force at
	var force = new b2Vec2(Math.cos(rotation) * ROT_IMPULSE, Math.sin(rotation) * ROT_IMPULSE);
	var point = this.body.GetWorldCenter(); //this will be translated slightly
	point = new b2Vec2(point.x, point.y);
	point.x += Math.cos(angle) * 2;
	point.y += Math.sin(angle) * 2;
	this.body.ApplyImpulse(force, point);
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
	this.__clientFixDef = new b2FixtureDef;
	this.__clientFixDef.density = 1.0;
	this.__clientFixDef.friction = 0.3;
	this.__clientFixDef.resitution = 0.2;
	this.__clientFixDef.shape = new b2PolygonShape;
	this.__clientFixDef.shape.SetAsBox(1.0, 1.0);
	
	
	//a room contains a world with dimensions 500 by 500
	this.world = new b2World(new b2Vec2(0.0, 0.0), true);
	
	/*var boundaryListener = new b2BoundaryListener();
	boundaryListener.Violation = function (body) {
		//we will move this body to the opposite side
		var position = body.GetWorldCenter();
		//snap to opposite side
		if (position.x < 0) {
			position.x = worldAABB.upperBound.x + position.x;
		}
		if (position.y < 0) {
			position.y = worldAABB.upperBound.y + position.y;
		}
		if (position.x > worldAABB.upperBound.x) {
			position.x -= worldAABB.upperBound.x;
		}
		if (position.y > worldAABB.upperBound.y) {
			position.y -= worldAABB.upperBound.y;
		}
		
		body.m_flags = body.m_flags & (~b2d.b2Body.e_frozenFlag);
	}
	this.world.SetBoundaryListener(boundaryListener);*/
	
	//create walls
	/*var fixDef = new b2FixtureDef;
	fixDef.density = 1.0;
	fixDef.friction = 0.5;
	fixDef.restitution = 0.2;

	var bodyDef = new b2BodyDef;

	bodyDef.type = b2Body.b2_staticBody;
	fixDef.shape = new b2PolygonShape;
	fixDef.shape.SetAsBox(20, 2);
	bodyDef.position.Set(10, 0);
	this.world.CreateBody(bodyDef).CreateFixture(fixDef);
	bodyDef.position.Set(10, 20);
	this.world.CreateBody(bodyDef).CreateFixture(fixDef);
	fixDef.shape.SetAsBox(2, 20);
	bodyDef.position.Set(0, 10);
	this.world.CreateBody(bodyDef).CreateFixture(fixDef);
	bodyDef.position.Set(20, 10);
	this.world.CreateBody(bodyDef).CreateFixture(fixDef);*/
	
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
	var bodyDef = new b2BodyDef();
	bodyDef.type = b2Body.b2_dynamicBody;
	bodyDef.linearDamping = 0.4;
	bodyDef.angularDamping = 0.4;
	bodyDef.position.Set(10.0, 10.0);
	
	var body = this.world.CreateBody(bodyDef);
	body.CreateFixture(this.__clientFixDef);
	
	var client = new Client(body);
	
	return client;
}
//destroyes a player (bot or client) in a room
exports.Room.prototype.destroyPlayer = function(player) {
	var body = player.body;
	this.world.DestroyBody(body);
}
