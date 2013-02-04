/**
 * Asteroid client representation for the server
 * 
 * Clients are responsible for authentication and relaying room data to the browser
 * 
 * They pass the following states:
 * - Connected
 * - Authenticated
 * - Playing
 * - Disconnected
 */

var users = require('./users');

var rooms = []; //holds the rooms that are added by the app


var STATE_CONNECTED = 0;
var STATE_AUTHENTICATED = 1;
var STATE_PLAYING = 2;
var STATE_DISCONNECTED = 3;
var Client = function(socket) {
	var self = this;
	
	this.state = 0; //0 = connected
	//request the user to authenticate
	this.socket = socket;
	this.user = null;
	
	//the client requests to end authentication
	/*this.socket.on('authenticate', function(data) {
		//they should have send a username, the nonce used, and their solution
		users.getUser(data.username, function(err, user) {
			if (!err) {
				//end the authentication
				users.endAuthenticate(user, data.nonce, data.solution, function (err, status) {
					if (status) {
						//we move on to authenticated status
						self.user = user;
						self.state = STATE_AUTHENTICATED;
						self.socket.emit('user', user.record); //give them our user record
					}
					else {
						//retry authentication
						self.beginAuthenticate();
					}
				});
			}
		});
	});
	
	//returns the salt value for a username
	this.socket.on('getSalt', function(data) {
		users.getUser(data.username, function(err, user) {
			if (!err) {
				self.socket.emit('salt', { username: user.record._id, salt: user.record.salt });
			}
		});
	});
	
	this.beginAuthenticate();*/
};
Client.prototype.beginAuthenticate = function () {
	var self = this;
	users.beginAuthenticate(function(err, nonce) {
		if (!err) {
			self.socket.emit('authenticate', { nonce: nonce });
		}
		else {
			self.socket.emit('error', "Server Error");
		}
	});
};

function create(socket) {
	
	new Client(socket);
	
}

exports.create = create;
exports.rooms = rooms;
