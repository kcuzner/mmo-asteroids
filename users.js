/**
 * Holds methods for accessing users from couchdb
 */

var HOST = "127.0.0.1";
var PORT = 5984;
var DB_NAME = "/asteroids/";

var crypto = require('crypto'),
	http = require('http'),
	util = require('util'),
	events = require('events'),
	db = require('./db');

var couch = db.create(HOST, PORT);

/**
 * The user model which also keeps track of scoring and such
 */
function User(record, id, rev) {
	this.record = record;
	
	if (!this.record._id) {
		this.record._id = id;
	}
	if (!this.record._rev) {
		this.record._rev = rev;
	}
}
util.inherits(User, events.EventEmitter);
User.prototype.updateScore = function (score) {
	var self = this;
	this.record.score = score;
	couch.put(DB_NAME + this.record._id, this.record, function(err, obj) {
		if (err) {
			self.emit('error', err);
		}
		else {
			if (obj.error) {
				self.emit('error', "Error: " + obj.error + ". Reason: " + obj.reason);
			}
			else {
				//update our record rev
				self.record._rev = obj._rev;
				self.emit('updated', self);
			}
		}
	});
}

/**
 * Create user function
 * 
 * Callback signature: err, User
 */
exports.createUser = function(username, password, callback) {
	crypto.randomBytes(12, function(ex, buf) {
		//create the password hash using our salt
		if (ex) throw ex;
		var salt = buf.toString('base64');
		var hash = crypto.createHash('sha512');
		hash.update(salt);
		hash.update(password);
		var passHash = hash.digest('hex');
		
		var now = new Date();
		var user = {
			type: "user",
			password: passHash,
			salt: salt,
			created_on: now.toJSON(),
			score: 0
		};
		
		couch.put(DB_NAME + username, user, function (err, obj) {
			if (err) {
				callback(err);
			}
			else {
				if (obj.ok == true) {
					callback(null, new User(user, obj.rev)); //we added the user successfully
				}
				else {
					callback("Error: " + obj.error + ". Reason: " + obj.reason); //there was an error
				}
			}
		});
	});
}

/**
 * Returns a user from the database
 * 
 * Callback signature: err, User
 */
exports.getUser = function (username, callback) {
	couch.get(DB_NAME + username, function (err, obj) {
		if (err) {
			callback(err);
		}
		else {
			if (obj.error) {
				callback("Error: " + obj.error + ". Reason: " + obj.reason); //there was an error
			}
			else {
				callback(null , new User(obj)); //we found the user
			}
		}
	});
}

/**
 * Requests a beginning to authentication by creating a nonce
 * 
 * Callback signature: err, nonce
 */
exports.beginAuthenticate = function(callback) {
	//get a uuid
	couch.get("/_uuids", function(err, obj) {
		if (err) {
			callback(err);
		}
		else {
			//using this uuid, create a nonce
			crypto.randomBytes(48, function (ex, buf) {
				if (ex) {
					callback(ex);
				}
				else {
					var now = new Date();
					var nonce = {
						_id: obj.uuids[0],
						type: "nonce",
						value: buf.toString('base64'),
						created: now.toJSON(),
					}
					couch.put(DB_NAME + obj.uuids[0], nonce, function (err, obj) {
						if (err) {
							callback(err);
						}
						else {
							if (obj.ok == true) {
								nonce._rev = obj.rev;
								callback(err, nonce); //nonce created
							}
							else {
								callback("Error: " + obj.error + ". Reason: " + obj.reason); //there was an error
							}							
						}
					});
				}
			});
		}
	});
}

/**
 * Finishes authentication using the passed nonce
 * user: the user previously returned by getUser
 * nonce: nonce object returned by beginAuthenticate
 * theirs: the client's version of the signed nonce.
 * 
 * Signing is done as follows (+ is concat): SHA512( nonce.value + SHA512(salt + password) )
 * 
 * Callback signature: err, status
 */
exports.endAuthenticate = function(user, nonce, theirs, callback) {
	var sha512 = crypto.createHash("sha512");
	sha512.update(nonce.value);
	sha512.update(user.record.password); //the password is stored as SHA512(salt+password)
	
	var ours = sha512.digest('hex');
	var status = ours == theirs;
	
	//delete the nonce
	couch.delete(DB_NAME + nonce._id, nonce, function (err, obj) {
		if (err) {
			callback(err);
		}
		else if (obj.error) {
			callback("Error: " +obj.error + ". Reason: " + obj.reason);
		}
		else {
			callback(null, status);
		}
	});
}
