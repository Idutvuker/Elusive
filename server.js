var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);

var players = {};
var colors = [0xFF0000, 0x0000FF, 0x00FF00, 0xFFFF00];

app.use(express.static(__dirname + '/public'));

app.get('/', function (req, res) {
    res.sendFile(__dirname + '/public/game.html');
});

io.on('connection', function (socket) {
    console.log('a user connected');
    var index = Math.floor(Math.random() * colors.length);
    var color = colors[index];
    delete colors[index];
    players[socket.id] = {
        rotation: 0,
        x: Math.floor(Math.random() * 700) + 50,
        y: Math.floor(Math.random() * 500) + 50,
        playerId: socket.id,
        color: color
    };
    socket.emit('currentPlayers', players);
    socket.broadcast.emit('newPlayer', players[socket.id]);
    socket.on('disconnect', function () {
        console.log('user disconnected');
        delete players[socket.id];
        io.emit('disconnect', socket.id);
    });
    socket.on('playerMovement', function (movementData) {
        players[socket.id].x = movementData.x;
        players[socket.id].y = movementData.y;
        players[socket.id].rotation = movementData.rotation;
        socket.broadcast.emit('playerMoved', players[socket.id]);
    });
    socket.on('playerShooting', function (movementData) {
        socket.broadcast.emit('playerShot', players[socket.id]);
    });
    socket.on('playerDeath', function (movementData) {
        delete players[socket.id];
        socket.broadcast.emit('playerDied', players[socket.id]);
    });
});

server.listen(8081, function () {
    console.log(`Listening on ${server.address().port}`);
});
