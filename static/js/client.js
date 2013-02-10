/**
 * Client-side javascript for the asteroids game
 */

(function ($) {
	
	var SCALING_FACTOR = 40; //20 pixels per meter in the game
	var shape = [ [12, 0], [-6, 6], [-4, 0], [-6, -6] ]; //the ship shape vertices, post scaling
	
	/**
	 * Represents a game attached to a socket
	 */
	var Game = function (socket) {
		var self = this;
		
		this.socket = socket;
		
		this.entities = null; //will contain entity information
		this.entityAge = 0; //seconds since entities was updated
		
		this.predictedStatus = null;
		this.predictedEntities = null;
		
		var player = null; //this will be populated with player information
		self.socket.on('identity', function (data) {
			self.player = {
				id: data.id,
				score: data.score,
			};
		});
		
		this.hitWait = 0;
		self.socket.on('hit', function () {
			hitWait = 500; //500ms to show the hit
		});
		
		var socketPoll = setInterval( function () {
			self.socket.emit('world', { x: 0, y: 0, width: 950/SCALING_FACTOR, height: 512/SCALING_FACTOR }); //every 250ms we update from the socket
		}, 250)
		
		var stepInterval = setInterval( function () {
			self.step();
		}, 1.0/30.0 * 1000); //30fps update speed
		
		socket.on('entities', function (entities) { //updates all the entities in our view we declared by emiting what our world was
			self.entities = entities;
			self.entityAge = 0;
		});
		
		socket.on('disconnect', function () {
			//we are done with the socket
			clearInterval(socketPoll);
		});
	};
	//the game steps every 1/30 second
	Game.prototype.step = function () {
		var self = this;
		
		if (this.entities) {
			this.predictedEntities = [];
			_.each(this.entities, function (entity) {
				self.predictedEntities.push({
					id: entity.id,
					type: entity.type,
					x: SCALING_FACTOR * (entity.x + (entity.velocity.x * self.entityAge)),
					y: SCALING_FACTOR * (entity.y + (entity.velocity.y * self.entityAge)),
					rot: entity.rot + (entity.omega * self.entityAge),
					velocity: entity.velocity,
					omega: entity.omega,
				});
			});
			
			//increment the age
			this.entityAge += 1.0 / 30.0;
		}
		
		this.render();
	};
	//the game renders when finished stepping
	Game.prototype.render = function () {
		var self = this;
		
		var canvas = $("#game")[0];
		var context = canvas.getContext("2d");
		context.fillStyle = '#000000';
		context.fillRect(0, 0, 950, 512);
		
		if (this.predictedEntities) {
			_.each(this.predictedEntities, function(entity) {
				if (entity.type == "player") { //render a player
					context.beginPath();
					var first = true;
					_.each(shape, function (vert) {
						//transform and add this vert
						var c = Math.cos(entity.rot);
						var s = Math.sin(entity.rot);
						var x = entity.x + (vert[0] * c - vert[1] * s);
						var y = entity.y + (vert[0] * s + vert[1] * c);
						if (first) { context.moveTo(x, y); first = false; }
						else { context.lineTo(x, y); }
					});
					context.closePath();
					if (!self.player || self.player.id != entity.id) {
						//them
						context.fillStyle="#888888";
					}
					else {
						//us
						if (this.hitWait > 0) {
							var s = Math.floor(this.hitWait / 4);
							if (s / 2 == Math.floor(s / 2)) {
								context.fillStyle="#ff0000";
							}
							else {
								context.fillStyle="#ffffff";
							}
							this.hitWait -= 30;
						}
						else {
							context.fillStyle="#ffffff";
						}
					}
					context.fill();
				}
				else if (entity.type == "bullet") { //render a bullet
					context.beginPath();
					context.arc(entity.x, entity.y, 2, 0, Math.PI * 2, false);
					context.closePath();
					context.fillStyle = "#0000ff";
					context.fill();
				}
			});			
		}
		
		if (this.player) {
			context.font = "30px Ariel";
			context.fillStyle = "#ffffff";
			context.fillText("Score: " + this.player.score, 10, 50);
		}
	};
	Game.prototype.onKeyDown = function(e) {
		if (e.keyCode == 37) {
			//left: rotate counter clockwise
			this.socket.emit('cclockwise');
		}
		if (e.keyCode == 38) {
			//up: forward impulse
			this.socket.emit('forward');
		}
		if (e.keyCode == 39) {
			//right: rotate clockwise
			this.socket.emit('clockwise');
		}
		if (e.keyCode == 40) {
			//down
			this.socket.emit('brake');
		}
		if (e.keyCode == 32) {
			//shoot
			console.log("shoot");
			this.socket.emit('shoot');
		}
	};
	
	$(document).ready(function () {
		var socket = io.connect('http://192.168.6.59:8080');
		
		var game;
		socket.on('connect', function () {
			//let the games begin!
			$(".connecting-message").hide();
			$("#overlay").hide();
			game = new Game(socket);
			$(document).keydown(function (e) {
				game.onKeyDown(e); //execute from the context of the game
			});
		});
		socket.on('disconnect', function () {
			//hide us behind something
			$("#overlay").show();
			$(".connecting-message").show();
		});
	});
	
})(jQuery);

