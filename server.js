var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);

const players = {};
const scores = {};
const winnerCondition = 8;
const mapTitle = "crosses";
const countOfPlayers = 3;
let currentPlayersCount = 0;
let notKilledPLayers = 0;
let gameOverFlag = false;
let roundNumber = 1;
const playerCoordinates = [
    {
        x: Math.floor(Math.random() * 200),
        y: Math.floor(Math.random() * 200),
    },
    {
        x: Math.floor(Math.random() * 200) + 600,
        y: Math.floor(Math.random() * 200),
    },
    {
        x: Math.floor(Math.random() * 200) + 600,
        y: Math.floor(Math.random() * 200) + 600,
    },
    {
        x: Math.floor(Math.random() * 200),
        y: Math.floor(Math.random() * 200) + 600,
    }
]

app.use(express.static(__dirname + '/public'));

app.get('/', function (req, res) {
    res.sendFile(__dirname + '/public/game.html');
});

io.on('connection', function (socket) {

    console.log(`${socket.id} connected`);

    currentPlayersCount += 1;

    scores[socket.id] = 0;
    players[socket.id] = {
        rotation: 0,
        x: playerCoordinates[currentPlayersCount - 1].x,
        y: playerCoordinates[currentPlayersCount - 1].y,
        startX: playerCoordinates[currentPlayersCount - 1].x,
        startY: playerCoordinates[currentPlayersCount - 1].y,
        playerId: socket.id
    };

    socket.emit('loading', mapTitle);

    if (currentPlayersCount === countOfPlayers){
        console.log(`count of players ${currentPlayersCount}`)
        notKilledPLayers = currentPlayersCount;
        io.emit('currentPlayers', players);
        socket.broadcast.emit('newPlayer', players[socket.id]);
    }

    socket.on('disconnect', function () {
        console.log(`${socket.id} disconnected`);

        delete players[socket.id];
        currentPlayersCount -= 1;
        io.emit('disconnect', socket.id);
    });

    socket.on('playerMovement', function (movementData) {
        if(players[socket.id]){
            players[socket.id].x = movementData.x;
            players[socket.id].y = movementData.y;
            players[socket.id].rotation = movementData.rotation;
            socket.broadcast.emit('playerMoved', players[socket.id]);
        }
    });

    socket.on('playerShooting', function (movementData) {
        socket.broadcast.emit('playerShot', players[socket.id]);
    });

    socket.on('playerDeath', function (data) {
        console.log(`playerDied ${socket.id}`);
        console.log(`player was killed by ${data.killerPlayerId}`)
        scores[data.killerPlayerId] += 1;
        notKilledPLayers -= 1;
        if (scores[data.killerPlayerId] >= winnerCondition){
            gameOverFlag = true;
        }
        io.emit('playerDied', players[data.killedPlayerId]);
        //delete players[data.killedPlayerId];
        console.log(`count of not killed players ${notKilledPLayers}`)
        if(notKilledPLayers === 1){
            if(gameOverFlag){
                io.emit('gameOver', scores[data.killerPlayerId], scores[socket.id]);
            }else{
                roundNumber += 1;
                notKilledPLayers = countOfPlayers;
                Object.values(players).forEach(player => {
                    player.x = player.startX;
                    player.y = player.startY;
                });
                io.emit('nextRound', players, roundNumber);
            }
        }
    });
});

server.listen(process.env.PORT || 3003, function () {
    console.log(`Listening on ${server.address().port}`);
});
