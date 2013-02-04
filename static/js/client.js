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
		
		var socketPoll = setInterval( function () {
			self.update(); //every 250ms we update from the socket
		}, 250)
		
		var stepInterval = setInterval( function () {
			self.step();
		}, 1.0/30.0 * 1000); //30fps update speed
		
		socket.on('disconnect', function () {
			//we are done with the socket
			clearInterval(socketPoll);
		});
	};
	//the game updates from the socket every 250ms
	Game.prototype.update = function () {
		this.socket.emit('status'); //ask for our status
	};
	//the game steps every 1/30 second
	Game.prototype.step = function () {
		this.render();
	};
	//the game renders when finished stepping
	Game.prototype.render = function () {
		var canvas = $("#game")[0];
		var context = canvas.getContext("2d");
		context.fillStyle = '#ff0000';
		context.fillRect(0, 0, 950, 512);
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

