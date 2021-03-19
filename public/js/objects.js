class World {
    static Data = class {
        players = {};
    };

    data = new World.Data();

    static draw(data, ctx) {
        Object.values(data.players).forEach(player => Player.draw(player.data, ctx));
    }

    static update(data, delta) {
        Object.values(data.players).forEach(player => Player.update(player.data, delta));
    }
}

class Player {
    static radius = 10;
    static speed = 200;

    static Data = class {
        name;
        x;
        y;
        speed = {
            x: 0,
            y: 0,
        };
    };

    data = new Player.Data();

    constructor(name, x, y) {
        this.data.name = name;
        this.data.x = x;
        this.data.y = y;
    }

    static draw(data, ctx) {
        ctx.beginPath();
        ctx.arc(data.x, data.y, Player.radius, 0, 2 * Math.PI);
        ctx.closePath();
        ctx.fill();

        ctx.font = "16px sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "hanging";
        ctx.fillText(data.name, data.x, data.y + Player.radius);
    }

    static update(data, delta) {
        data.x += data.speed.x * delta;
        data.y += data.speed.y * delta;
    }

    static control(keyMap) {
        var dir = {x: 0, y: 0};

        if (keyMap.getOrElse('ArrowLeft'))
            dir.x -= 1;

        if (keyMap.getOrElse('ArrowRight'))
            dir.x += 1;

        if (keyMap.getOrElse('ArrowDown'))
            dir.y += 1;

        if (keyMap.getOrElse('ArrowUp'))
            dir.y -= 1;
        
        var ln = Math.sqrt(dir.x**2 + dir.y**2);
        if (ln > 0) {
            dir.x /= ln;
            dir.y /= ln;
        }

        dir.x *= Player.speed;
        dir.y *= Player.speed;

        return dir;
    }
}

if (typeof exports !== 'undefined') {
    exports.World = World;
    exports.Player = Player;
}