/**
 * Client-side javascript for the asteroids game
 */

(function ($) {
	
	/**
	 * Represents a game attached to a socket
	 */
	var Game = function (socket) {
		var self = this;
		
		this.socket = socket;
		
		this.lastStatus = null;
		this.timeSinceLast = 0;
		
		this.predictedStatus = null;
		
		var socketPoll = setInterval( function () {
			self.socket.emit('statusRequest'); //every 250ms we update from the socket
		}, 250)
		
		var stepInterval = setInterval( function () {
			self.step();
		}, 1.0/30.0 * 1000); //30fps update speed
		
		socket.on('status', function (data) { //our status is updated
			self.lastStatus = data;
			self.timeSinceLast = 0;
		});
		
		socket.on('disconnect', function () {
			//we are done with the socket
			clearInterval(socketPoll);
		});
	};
	//the game steps every 1/30 second
	Game.prototype.step = function () {
		if (this.lastStatus) {
			//predict our status
			this.predictedStatus = {
				x: this.lastStatus.x + (this.lastStatus.velocity.x * this.timeSinceLast),
				y: this.lastStatus.y + (this.lastStatus.velocity.y * this.timeSinceLast),
				rot: this.lastStatus.rot + (this.lastStatus.omega * this.timeSinceLast),
				velocity: this.lastStatus.velocity,
				omega: this.lastStatus.omega
			};
			//increment the time since last
			this.timeSinceLast += 1.0 / 30.0;	
		}
		
		this.render();
	};
	//the game renders when finished stepping
	Game.prototype.render = function () {
		var canvas = $("#game")[0];
		var context = canvas.getContext("2d");
		context.fillStyle = '#ff0000';
		context.fillRect(0, 0, 950, 512);
		
		if (this.predictedStatus) {
			context.fillStyle = '#000000';
			context.lineWidth = 1;
			context.fillRect(this.predictedStatus.x, this.predictedStatus.y, 3, 3);
			var x2 = this.predictedStatus.x + Math.cos(this.predictedStatus.rot) * 10;
			var y2 = this.predictedStatus.y + Math.sin(this.predictedStatus.rot) * 10;
			context.fillRect(x2, y2, 1, 1);
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
		}
	};
	
	$(document).ready(function () {
		var socket = io.connect('http://localhost:8080');
		
		var game;
		socket.on('connect', function () {
			//let the games begin!
			game = new Game(socket);
			$(document).keydown(function (e) {
				game.onKeyDown(e); //execute from the context of the game
			});
		});
	});
	
})(jQuery);

