/**
 * Local DB access methods
 * 
 * Uses couchdb
 */

var util = require('util'),
	http = require('http');

function DB(host, port) {
	this.host = host;
	this.port = port;
	
}
/**
 * CouchDB general functions.
 * Callback signature: error, object returned
 */

DB.prototype.put = function(path, obj, callback) {
	var options = {
		host: this.host,
		port: this.port,
		path: path,
		method: "PUT",
		headers: {"Content-Type":"applicaton/json"},
	};
	var req = http.request(options, function (res) {
		var data = "";
		res.on('data', function(chunk) {
			data += chunk;
		});
		res.on('end', function () {
			callback(null, JSON.parse(data));
		});
	});
	req.on('error', function (e) {
		callback(e);
	});
	req.write(JSON.stringify(obj));
	req.end();
}

DB.prototype.get = function(path, callback) {
	var options = {
		host: this.host,
		port: this.port,
		path: path,
		method: "GET"
	};
	var req = http.request(options, function (res) {
		var data = "";
		res.on('data', function(chunk) {
			data += chunk;
		});
		res.on('end', function() {
			callback(null, JSON.parse(data));
		});
	});
	req.on('error', function (e) {
		callback(e);
	});
	req.end();
}

DB.prototype.delete = function deleteDB(path, obj, callback) {
	var options = {
		host: this.host,
		port: this.port,
		path: path + "?rev=" + obj._rev,
		method: "DELETE"
	};
	var req = http.request(options, function(res) {
		var data = "";
		res.on('data', function(chunk) {
			data += chunk;
		});
		res.on('end', function () {
			callback(null, JSON.parse(data));
		});
	});
	req.on('error' , function(e) {
		callback(e);
	});
	req.end();
}

exports.create = function(host, port) {
	return new DB(host, port);
};

