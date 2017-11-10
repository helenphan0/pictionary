var socket = io();
var user;
var IDENTIFY_URL = function(user) {
    return "https://api-staging.appcues.com/v1/accounts/14538/users/" + user + "/activity"
};
var ANNOUNCEMENTS_URL = function(user) {
    return "https://api-staging.appcues.com/v1/accounts/14538/users/" + user + "/nc?url=" + window.location.href;
};

var getAnnouncements = function(user) {

    $.ajax({
        url: ANNOUNCEMENTS_URL(user),
        dataType: "application/json",
        processData: false,
        type: "GET"
    })
    .complete(function(resp, textStatus, jqX) {

        var data = JSON.parse(resp.responseText);
        if (!data._embedded) return [];
        var flows = data._embedded["appcues:nc_item"];
        console.log('Fetching all flows from API', flows)
        var announcementsData = flows.filter(function(item) {
            return item && item.content_type === "announcement"
        });
        
        var announcementsList = announcementsData.map(function(item){
            if (item) {
                return ({
                    id: item.id,
                    name: item.content.name,
                    title: item.content.attributes.content.title,
                    imgUrl: item.content.attributes.content.img,
                    bodyText: item.content.attributes.content.body.bodyText,
                    bodyHtml: item.content.attributes.content.body.bodyHtml,
                    links: item.content.attributes.content.links
                })
            }
        });
        console.log('QUALIFIED', announcementsList)
        if (announcementsList.length > 0) {
            loadAnnouncements(announcementsList);
        }
        return announcementsList
    });
}

var identify = function(user, postData) {

    var data = JSON.stringify(postData);
    return (
        $.ajax({
            url: IDENTIFY_URL(user),
            contentType: "application/json",
            data: data,
            dataType: "application/json",
            type: "POST"
        })
    )
}

// SAMPLE ANNOUNCEMENT
// <div class="announcement">TITLE  TEXT HERE TITLE  TEXT HERE TITLE  TEXT HERE
//     <div class="announcement-opened hidden">
//         <div class="img"><img  src="https://d2gk7xgygi98cy.cloudfront.net/6527-3-large.jpg" /></div>
//         <p class="title">TTITLE  TEXT HERE TITLE  TEXT HERE</p>
//         <p class="bodyText">Body text</p>
//     </div>

// </div>

function loadAnnouncements(announcements) {

    var elements = announcements.map(function(item) {
        var header = '<p class="title">' + item.title + '</p>';
        var body = '<p class="bodyText">' + item.bodyText + '</p>';
        var img = '<div class="img"><img src="' + item.imgUrl + '" /></div>';
        return '<div class="announcement"><span>' + item.title +'</span><div class="announcement-opened hidden">' + img + header + body + '</div></div>'
    })
    $('.users .announcements-container .announcement-box').append(elements);
}

function usernameAsk() {
    $('.grey-out').fadeIn(500);
    $('.user').fadeIn(500);
    $('.user').submit(function(){
        event.preventDefault();
        user = $('#username').val().trim();
        var color = $('#color').val().trim();
        var food = $('#food').val().trim();

        if (user == '') {
            return false
        };

        var index = users.indexOf(user);

        if (index > -1) {
            alert(user + ' already exists');
            return false
        };
        
        socket.emit('join', user);

        var postData = {
            "profile_update": {
                "user": user,
                "favorite_color": color,
                "favorite_food": food
            }
        }

        identify(user, postData)
        .complete(function(resp) {
            console.log('IDENTIFIED', postData)
            getAnnouncements(user);
        });

        $('.grey-out').fadeOut(300);
        $('.user').fadeOut(300);
        $('input.guess-input').focus();
    });
};

var context;
var canvas;
var click = false;

var clearScreen = function() {
    context.clearRect(0, 0, canvas[0].width, canvas[0].height);
};

var guesser = function() {
    clearScreen();
    click = false;
    console.log('draw status: ' + click);
    $('.draw').hide();
    $('#guesses').empty();
    console.log('You are a guesser');
    $('#guess').show();
    $('.guess-input').focus();

    $('#guess').on('submit', function() {
        event.preventDefault();
        var guess = $('.guess-input').val();

        if (guess == '') {
            return false
        };

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
        click = false;
    }
};

var drawWord = function(word) {
    $('span.word').text(word);
    console.log('Your word to draw is: ' + word);
};

var users = [];

var userlist = function(names) {
    users = names;
    var html = '<p class="chatbox-header">' + 'Players' + '</p>';
    for (var i = 0; i < names.length; i++) {
        html += '<li>' + names[i] + '</li>';
    };
    $('ul').html(html);
};

var newDrawer = function() {
    socket.emit('new drawer', user);
    clearScreen();
    $('#guesses').empty();
};

var correctAnswer = function(data) {
    $('#guesses').html('<p>' + data.username + ' guessed correctly!' + '</p>');
};

var reset = function(name) {
    clearScreen();
    $('#guesses').empty();
    console.log('New drawer: ' + name);
    $('#guesses').html('<p>' + name + ' is the new drawer' + '</p>');
};

var draw = function(obj) {
    context.fillStyle = obj.color;
    context.beginPath();
    context.arc(obj.position.x, obj.position.y,
                     3, 0, 2 * Math.PI);
    context.fill();
};

var pictionary = function() {
    clearScreen();
    click = true;
    console.log('draw status: ' + click);
    $('#guess').hide();
    $('#guesses').empty();
    $('.draw').show();

    var drawing;
    var color;
    var obj = {};

    $('.draw-buttons').on('click', 'button', function(){
        obj.color = $(this).attr('value');
        console.log(obj.color);

        if (obj.color === '0') {
            socket.emit('clear screen', user);
            context.fillStyle = 'white';
            return;
        };
    });

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
        obj.position = {x: event.pageX - offset.left,
                        y: event.pageY - offset.top};
        
        if (drawing == true && click == true) {
            draw(obj);
            socket.emit('draw', obj);
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
    socket.on('clear screen', clearScreen);

    $('#main').on('click','.announcement',function(e){
        $(this).find('.announcement-opened').toggleClass('hidden')
    })

});