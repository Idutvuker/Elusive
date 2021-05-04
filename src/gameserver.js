function create(server) {
    const myServer = require('./myserver');
    const io = require('socket.io')(server);

    let gameData;
    let exiting;
    let players;
    let scores;
    let winnerCondition;
    let mapTitle;
    let countOfPlayers;
    let currentPlayersCount;
    let notKilledPLayers;
    let gameOverFlag;
    let roundNumber;
    let playerCoordinates;

    let manage = {
        reset: function (_gameData) {
            gameData = _gameData
            players = {};
            scores = {};
            mapTitle = gameData.level;
            winnerCondition = parseInt(gameData.scoreLimit);
            countOfPlayers = parseInt(gameData.playerNumber);
            currentPlayersCount = 0;
            notKilledPLayers = 0;
            gameOverFlag = false;
            roundNumber = 1;
            exiting = true;

            playerCoordinates = [
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
            ];

            io.emit('disconnect');
        }
    }

    function connect(socket) {
        exiting = false;
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

        if (currentPlayersCount === countOfPlayers) {
            console.log(`count of players ${currentPlayersCount}`)
            notKilledPLayers = currentPlayersCount;
            io.emit('currentPlayers', players);
            socket.broadcast.emit('newPlayer', players[socket.id]);
        }

        socket.on('disconnect', function (message) {
            if (exiting !== true) {
                console.log(`${socket.id} disconnected`);

                delete players[socket.id];
                currentPlayersCount -= 1;
                io.emit('playerDisconnected', socket.id);
            }
        });

        socket.on('playerMovement', function (movementData) {
            if (players[socket.id]) {
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
            scores[data.killerPlayerId] += 1;
            notKilledPLayers -= 1;
            if (scores[data.killerPlayerId] >= winnerCondition) {
                gameOverFlag = true;
            }
            io.emit('playerDied', players[data.killedPlayerId]);

            if (notKilledPLayers === 1) {
                if (gameOverFlag) {
                    io.emit('gameOver', scores[data.killerPlayerId], scores[socket.id]);
                    setTimeout(() => manage.reset(gameData), 4000);
                } else {
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
    }

    io.on('connection', function (socket) {
        socket.on('token', token => {
            let userData = myServer.verifyToken(token);

            if (userData == null) {
                socket.emit('alert', 'Authorization failed! Disconnected.');
                socket.disconnect();
            } else if (currentPlayersCount < countOfPlayers) {
                connect(socket);
            } else {
                socket.emit('alert', 'Game is full');
                socket.disconnect();
            }
        });
    });

    return manage;
}

module.exports = create;
