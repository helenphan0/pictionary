var http = require('http');
var express = require('express');
var socket_io = require('socket.io');

var app = express();
app.use(express.static('public'));

var server = http.Server(app);
var io = socket_io(server);

var users = [];

var words = [
    "word", "letter", "number", "person", "pen", "police", "people",
    "sound", "water", "breakfast", "place", "man", "men", "woman", "women", "boy",
    "girl", "serial killer", "Oregon Trail", "week", "month", "name", "sentence", "line", "air",
    "land", "home", "hand", "house", "picture", "animal", "mother", "father",
    "big foot", "sister", "world", "head", "page", "country", "question",
    "shiba inu", "school", "plant", "food", "sun", "state", "eye", "city", "tree",
    "farm", "story", "sea", "night", "day", "life", "north", "south", "east",
    "west", "child", "children", "example", "paper", "music", "river", "car",
    "Power Rangers", "feet", "book", "science", "room", "friend", "idea", "fish",
    "mountain", "horse", "watch", "color", "face", "wood", "list", "bird",
    "body", "fart", "family", "song", "door", "forest", "wind", "ship", "area",
    "rock", "Captain Planet", "fire", "problem", "airplane", "top", "bottom", "king",
    "space", "whale", "unicorn", "narwhal", "furniture", "sunset", "sunburn", "Grumpy cat", "feather", "pigeon"
];

function newWord() {
	wordcount = Math.floor(Math.random() * (words.length));
	return words[wordcount];
};

var wordcount;

io.on('connection', function (socket) {
	io.emit('userlist', users);

	socket.on('join', function(name) {
		socket.username = name;

		// user automatically joins a room under their own name
		socket.join(name);
		console.log(socket.username + ' has joined. ID: ' + socket.id);

		// save the name of the user to an array called users
		users.push(socket.username);

		// if the user is first to join OR 'drawer' room has no connections
		if (users.length == 1 || typeof io.sockets.adapter.rooms['drawer'] === 'undefined') {

			// place user into 'drawer' room
			socket.join('drawer');

			// server submits the 'drawer' event to this user
			io.in(socket.username).emit('drawer', socket.username);
			console.log(socket.username + ' is a drawer');

			// send the random word to the user inside the 'drawer' room
			io.in(socket.username).emit('draw word', newWord());
		//	console.log(socket.username + "'s draw word (join event): " + newWord());
		} 

		// if there are more than one names in users 
		// or there is a person in drawer room..
		else {

			// additional users will join the 'guesser' room
			socket.join('guesser');

			// server submits the 'guesser' event to this user
			io.in(socket.username).emit('guesser', socket.username);
			console.log(socket.username + ' is a guesser');
		}
	
		// update all clients with the list of users
		io.emit('userlist', users);
		
	});

	// submit drawing on canvas to other clients
	socket.on('draw', function(obj) {
		socket.broadcast.emit('draw', obj);
	});

	// submit each client's guesses to all clients
	socket.on('guessword', function(data) {
		io.emit('guessword', { username: data.username, guessword: data.guessword})
		console.log('guessword event triggered on server from: ' + data.username + ' with word: ' + data.guessword);
	});

	socket.on('disconnect', function() {
		for (var i = 0; i < users.length; i++) {

			// remove user from users list
			if (users[i] == socket.username) {
				users.splice(i, 1);
			};
		};
		console.log(socket.username + ' has disconnected.');

		// submit updated users list to all clients
		io.emit('userlist', users);

		// if 'drawer' room has no connections..
		if ( typeof io.sockets.adapter.rooms['drawer'] === "undefined") {
			
			// generate random number based on length of users list
			var x = Math.floor(Math.random() * (users.length));
			console.log(users[x]);

			// submit new drawer event to the random user in userslist
			io.in(users[x]).emit('new drawer', users[x]);
		};
	});

	socket.on('new drawer', function(name) {

		// remove user from 'guesser' room
		socket.leave('guesser');

		// place user into 'drawer' room
		socket.join('drawer');
		console.log('new drawer emit: ' + name);

		// submit 'drawer' event to the same user
		socket.emit('drawer', name);
		
		// send a random word to the user connected to 'drawer' room
		io.in('drawer').emit('draw word', newWord());
	
	});

	// initiated from drawer's 'dblclick' event in Player list
	socket.on('swap rooms', function(data) {

		// drawer leaves 'drawer' room and joins 'guesser' room
		socket.leave('drawer');
		socket.join('guesser');

		// submit 'guesser' event to this user
		socket.emit('guesser', socket.username);

		// submit 'drawer' event to the name of user that was doubleclicked
		io.in(data.to).emit('drawer', data.to);

		// submit random word to new user drawer
		io.in(data.to).emit('draw word', newWord());
	
		io.emit('reset', data.to);

	});

	socket.on('correct answer', function(data) {
		io.emit('correct answer', data);
		console.log(data.username + ' guessed correctly with ' + data.guessword);
	});

	socket.on('clear screen', function(name) {
		io.emit('clear screen', name);
	});

})

server.listen(process.env.PORT || 8080, function() {
	console.log('Server started at http://localhost:8080');
});