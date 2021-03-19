var canvas = document.getElementById('myCanvas');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
var ctx = canvas.getContext('2d');

var keyMap = new Map();
keyMap.getOrElse = function(key, value) {
    return this.has(key) ? this.get(key) : value;
}

document.addEventListener('keydown', event => keyMap.set(event.code, true));
document.addEventListener('keyup', event => keyMap.set(event.code, false));

var world = new World();
var self_id;

const socket = io();

socket.on('connected-to-server', player_id => {
    self_id = player_id;
});

socket.on('world-update', data => {
    world.data = data;
});


var old_dir = {x: 0, y: 0};

function update() {
    var dir = Player.control(keyMap);

    if (JSON.stringify(dir) !== JSON.stringify(old_dir)) {
        socket.emit('player-moved', dir);
        old_dir = dir;
    }

    World.update(world.data, delta_seconds);
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    World.draw(world.data, ctx);
}

const delta_seconds = 1 / 60;

setInterval(update, delta_seconds * 1000);