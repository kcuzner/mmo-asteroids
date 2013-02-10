Asteroids
=========
As an MMO (kinda)
-----------------

By Kevin Cuzner

Concept
-------
Modeled after [this April Fools Joke](http://seb.ly/2012/04/node-js-experiment-mmo-asteroids/), this is an experiment with
Node.js, socket.io, and the HTML5 canvas to make a simple MMO. It probably can't handle much and hasn't been tested for
large amounts of players, but hopefully it will at least provide some entertainment and education.

Drawing Board
-------------

 * Users are stored in CouchDB with a hash. Users log in using the client-side nonce hash method.
   * Score and kill information is also stored in the user's document
 * The game is organized into "rooms" with a limit of 1000 clients per room.
   * At the moment I will just make one room per instance of the program to keep it simple
 * There will be up to 200 server side bots in each room at a time. When 200 players is reached,
   the number of bots will be reduced.
 * Dead-reckoning seems to be a good option for the client side while waiting for player updates.
   * The server will manage which ships are visible to which players, effectivly controlling the
     view server side.
   * The client should request an update every 250-500ms to keep things real and smooth animation
     itself.

