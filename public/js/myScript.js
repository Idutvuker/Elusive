class Player {
    static radius = 10;

    constructor(x, y) {
        this.x = x;
        this.y = y;
    }

    draw(ctx) {
        ctx.beginPath();
        //console.log(Player.radius);
        ctx.arc(this.x, this.y, Player.radius, 0, 2 * Math.PI);
        ctx.fill();
        ctx.closePath();
    }

    update() {
        if (keyMap.getOrElse('ArrowLeft'))
            this.x -= 5;

        if (keyMap.getOrElse('ArrowRight'))
            this.x += 5;

        if (keyMap.getOrElse('ArrowDown'))
            this.y += 5;

        if (keyMap.getOrElse('ArrowUp'))
            this.y -= 5;
    }
}

var canvas = document.getElementById('myCanvas');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;


var ctx = canvas.getContext('2d');
var player = new Player(50, 50);

function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    player.update();
    player.draw(ctx);
}

setInterval(render, 10);

Map.prototype.getOrElse = function(key, value) {
    return this.has(key) ? this.get(key) : value;
}

var keyMap = new Map();

document.addEventListener('keydown', function (event) {
    keyMap.set(event.code, true);
    console.log(event.code);
});

document.addEventListener('keyup', function (event) {
    keyMap.set(event.code, false);
});