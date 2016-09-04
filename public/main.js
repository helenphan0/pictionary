var socket = io();

var user;

function usernameAsk() {
    user = prompt("Please enter a username:", "Phteven");
    socket.emit('join', user);
};

var context;
var canvas;
var click = false;

var draw = function(position) {
    context.beginPath();
    context.arc(position.x, position.y,
                     2, 0, 2 * Math.PI);
    context.fill();
};

var guesser = function() {
    context.clearRect(0, 0, canvas[0].width, canvas[0].height);
    click = false;
    $('.draw').hide();
    $('#guesses').empty();
    console.log('You are a guesser');
    $('#guess').show();
    $('guess-input').focus();

    $('#guess').on('submit', function() {
        event.preventDefault();
        var guess = $('.guess-input').val();
        console.log(user + "'s guess: " + guess);
        socket.emit('guessword', {username: user, guessword: guess});
        $('.guess-input').val('');
    });
};

var guessword = function(data){
    $('#guesses').text(data.username + "'s guess: " + data.guessword);

    if (click == true && data.guessword == $('span.word').text() ) {
        console.log('guesser: ' + data.username + ' draw-word: ' + $('span.word').text());
        socket.emit('correct answer', {username: data.username, guessword: data.guessword});
        socket.emit('swap rooms', {from: user, to: data.username});
    }
};

var drawWord = function(word) {
    $('span.word').text(word);
    console.log('Your word to draw is: ' + word);
};

var userlist = function(names) {
    var html = '<p class="chatbox-header">' + 'Players' + '</p>';
    for (var i = 0; i < names.length; i++) {
        html += '<li>' + names[i] + '</li>';
    };
    $('ul').html(html);
};

var newDrawer = function() {
    socket.emit('new drawer', user);
    context.clearRect(0, 0, canvas[0].width, canvas[0].height);
    $('#guesses').empty();
};

var correctAnswer = function(data) {
    $('#guesses').html('<p>' + data.username + ' guessed correctly!' + '</p>');
};

var reset = function(name) {
    context.clearRect(0, 0, canvas[0].width, canvas[0].height);
    $('#guesses').empty();
    console.log('New drawer: ' + name);
    $('#guesses').html('<p>' + name + ' is the new drawer.' + '</p>');
};

var pictionary = function() {
    context.clearRect(0, 0, canvas[0].width, canvas[0].height);
    click = true;
    $('#guess').hide();
    $('#guesses').empty();
    $('.draw').show();

    
    var drawing;
    console.log('You are the drawer');

    $('.users').on('dblclick', 'li', function() {
        if (click == true) {
            var target = $(this).text();
            socket.emit('swap rooms', {from: user, to: target});
        };
    });

    canvas.on('mousedown', function(event) { 
        drawing = true;   
    });
    canvas.on('mouseup', function(event) {
        drawing = false;
    });

    canvas.on('mousemove', function(event) {
        var offset = canvas.offset();
        var position = {x: event.pageX - offset.left,
                        y: event.pageY - offset.top};
        
        if (drawing == true) {
            draw(position);
            socket.emit('draw', position);
        };
    });

};

$(document).ready(function() {

    canvas = $('#canvas');
    context = canvas[0].getContext('2d');
    canvas[0].width = canvas[0].offsetWidth;
    canvas[0].height = canvas[0].offsetHeight;

    usernameAsk();

    socket.on('userlist', userlist);
    socket.on('guesser', guesser);
    socket.on('guessword', guessword);
    socket.on('draw', draw);
    socket.on('draw word', drawWord);
    socket.on('drawer', pictionary);
    socket.on('new drawer', newDrawer);
    socket.on('correct answer', correctAnswer);
    socket.on('reset', reset);

});