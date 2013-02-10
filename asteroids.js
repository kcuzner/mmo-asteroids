/**
 * Server side of the asteroids game
 */

var MAX_SPEED = 10.0; //10 m/s max
var MAX_ROT = 6.28; //2pi rad/s max
var FORWARD_IMPULSE = 0.25; //Ns impulse for a ship forward movement
var ROT_IMPULSE = 0.001; //Nm torque for rotating
var BULLET_IMPULSE = 0.05; //Ns impulse for the bullet
var PLAYER_TYPE = "player";
var BULLET_TYPE = "bullet";

var Box2D = require('box2dweb-commonjs').Box2D,
	util = require('util'),
	_ = require('underscore'),
	events = require('events');

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
	b2ContactListener = Box2D.Dynamics.b2ContactListener;

//fixture definition for a player
var playerFixDef = new b2FixtureDef;
playerFixDef.density = 1.0;
playerFixDef.friction = 0.3;
playerFixDef.resitution = 0.7;
playerFixDef.shape = new b2PolygonShape;
playerFixDef.shape.SetAsArray([ new b2Vec2(0.3, 0), new b2Vec2(-0.2, 0.2), new b2Vec2(-0.2, -0.2) ], 3);

//fixture definition for a bullet
var bulletFixDef = new b2FixtureDef;
bulletFixDef.density = 1.0;
bulletFixDef.friction = 0.3;
bulletFixDef.restition = 0.7;
bulletFixDef.shape = new b2PolygonShape;
bulletFixDef.shape.SetAsBox(0.05, 0.05);

var entityId = 0; //all entities get an id (even the bullets)

function Entity(body, type) {
	this.id = entityId++;
	this.body = body;
	this.body.SetUserData(this);
	this.type = type;
}

/**
 * Represents a bullet from a player
 */
function Bullet(body, player) {
	Entity.call(this, body, BULLET_TYPE);
	
	console.log("Bullet made for " + player.id);
	
	this.player = player;
	
	//set a timeout where we will destroy ourselves (whoa..you can do that?)
	setTimeout(function () {
		body.GetWorld().DestroyBody(body);
	}, 500);
}
util.inherits(Bullet, Entity);

/**
 * Represents a player in a room
 */
function Player(body) {
	var self = this;
	Entity.call(this, body, PLAYER_TYPE);
	events.EventEmitter.call(this);
	
	var score = 0;
	this.setScore = function (s) {
		console.log("SCOREDD!!!!!");
		score = s;
		self.emit('scoreSet', s);
	}
	this.getScore = function () {
		return score;
	}
	
	this.registerHit = function () {
		self.emit('hit');
	}
}
util.inherits(Player, Entity);
util.inherits(Player, events.EventEmitter);
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
Player.prototype.shoot = function () {
	var angle = this.body.GetAngle();
	var point = this.body.GetWorldCenter();
	
	point = new b2Vec2(point.x + Math.cos(angle) * 0.4, point.y + Math.sin(angle) * 0.4);
	
	var bodyDef = new b2BodyDef();
	bodyDef.type = b2Body.b2_dynamicBody;
	bodyDef.position.Set(point.x, point.y);
	
	var body = this.body.GetWorld().CreateBody(bodyDef);
	body.CreateFixture(bulletFixDef);
	body.SetBullet(true); //luckily this will be short lived...bullets are computationally expensive
	var force = new b2Vec2(Math.cos(angle) * BULLET_IMPULSE, Math.sin(angle) * BULLET_IMPULSE);
	body.ApplyImpulse(force, body.GetWorldCenter());
	
	return new Bullet(body, this); //we own this bullet
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
	var self = this;
	
	this.world = new b2World(new b2Vec2(0.0, 0.0), true);
	
	
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
	
	//create our contact listener to deal with bullets and damage
	var contactListener = new b2ContactListener();
	this.toRemove = []; //queue of bodies to remove
	contactListener.BeginContact = function (contact) {
		var entityA = contact.GetFixtureA().GetBody().GetUserData();
		var entityB = contact.GetFixtureB().GetBody().GetUserData();
		if (entityA && entityB) {
			if (entityA.type == BULLET_TYPE && entityB.type == BULLET_TYPE) {
				//they will destroy each other
				self.toRemove.push(contact.GetFixtureA().GetBody());
				self.toRemove.push(contact.GetFixtureB().GetBody());
			}
			else if (entityA.type == BULLET_TYPE && entityB.type == PLAYER_TYPE) {
				//the bullet is destroyed and its parent player has their score incremented
				if (entityA.player != entityB) {
					self.toRemove.push(contact.GetFixtureA().GetBody());
					entityA.player.setScore(entityA.player.getScore() + 10);
					entityB.registerHit();
				}
			}
			else if (entityA.type == PLAYER_TYPE && entityB.type == BULLET_TYPE) {
				//same as above
				if (entityB.player != entityA) {
					self.toRemove.push(contact.GetFixtureB().GetBody());
					entityB.player.setScore(entityB.player.setScore() + 10);
					entityA.registerHit();
				}
			}
		}
	};
	this.world.SetContactListener(contactListener);
	
	this.__intervalId = null;
};
//starts room simulation
exports.Room.prototype.start = function() {
	var self = this;
	
	var timestep = 1.0/60.0; //60fps
	var iterations = 10; //10 iterations
	
	this.__intervalId = setInterval(function () {
		self.world.Step(timestep, iterations);
		//remove any bodies queued for deletion during that step
		_.each(self.toRemove, function (body) {
			if (body.GetUserData().type == BULLET_TYPE) {
				self.world.DestroyBody(body);
			}
		});
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
exports.Room.prototype.createClient = function(x, y) {
	var bodyDef = new b2BodyDef();
	bodyDef.type = b2Body.b2_dynamicBody;
	bodyDef.linearDamping = 0.4;
	bodyDef.angularDamping = 0.4;
	bodyDef.position.Set(x || 10.0, y || 10.0);
	
	var body = this.world.CreateBody(bodyDef);
	body.CreateFixture(playerFixDef);
	
	var client = new Client(body);
	
	return client;
}
//destroyes a player (bot or client) in a room
exports.Room.prototype.destroyPlayer = function(player) {
	console.log("Destroying player");
	var body = player.body;
	this.world.DestroyBody(body);
}
//runs an AABB query on the room world and returns usable entity data (x, y, width, height)
exports.Room.prototype.getEntitiesInsideBox = function (x, y, width, height)  {
	var aabb = new b2AABB;
	aabb.lowerBound.Set(x, y);
	aabb.upperBound.Set(x + width, y + height);
	var bodies = [];
	this.world.QueryAABB(function (fixture) {
		var entity = fixture.GetBody().GetUserData();
		var location = entity.body.GetWorldCenter();
		var angle = entity.body.GetAngle();
		var velocity = entity.body.GetLinearVelocity();
		var omega = entity.body.GetAngularVelocity();
		console.log(location);
		bodies.push({
			id: entity.id,
			type: entity.type,
			x: location.x,
			y: location.y,
			rot: angle,
			velocity: { x: velocity.x, y: velocity.y },
			omega: omega,
		});
		return true;
	}, aabb);
	
	return bodies;
}
