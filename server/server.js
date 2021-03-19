const express = require('express');
const http = require('http');
const socketio = require('socket.io');
const { setInterval } = require('timers');
const { Player, World } = require('../public/js/objects');

const PORT = process.env.PORT || 3000;

const app = express();
const server = http.createServer(app);
const io = socketio(server);

app.use(express.static('public'));
server.listen(PORT, () => console.log(`Server is running on port ${PORT}`));


var world = new World();
console.log(world.data);

io.on('connection', socket => {
    console.log(`${socket.id} has connected!`)
    world.data.players[socket.id] = new Player(`Player ${socket.id}`, 50, 50);

    socket.emit('connected-to-serever', socket.id);

    socket.on('player-moved', dir => {
        var player = world.data.players[socket.id];
        player.data.speed = dir;
    });

    socket.on('disconnect', () => {
        console.log(`disconnected player ${socket.id}`);
        delete world.data.players[socket.id];
    });
});

const delta_seconds = 1 / 60;

function update(delta) {
    World.update(world.data, delta);

    io.emit('world-update', world.data);
};

setInterval(() => update(delta_seconds), delta_seconds * 1000);