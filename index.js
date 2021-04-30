const express = require('express');
const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);

const mongoose = require('mongoose');
const User = require('./model/user');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

mongoose.connect('mongodb://localhost:27017/login-app-db', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true
});

JWT_SECRET = "\\}l8FZ55Ty4h\"6'H~V;Gf3a|l||GwYW>>*i1O,;s)}|3thbCJXA|1eq_IB:%&dy<Jq-/(!U6z0U{@c@'2j_Fd?";

app.use(express.json());
app.use(express.urlencoded({extended: true}));

app.use('/', express.static(__dirname + '/public'));

app.get('/', function (req, res) {
    res.sendFile(__dirname + '/public/main_menu.html');
});

function verifyToken(token) {
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch (error) {
        return null;
    }
}

app.post('/api/authorize', async (req, res) => {
    const {token} = req.body;
    const userData = verifyToken(token);

    if (userData == null) {
        res.json({status: 'error', error: 'Authorization failed!'});
    } else {
        res.json({status: 'ok', userData});
    }
});

app.post('/api/login', async (req, res) => {
    const {username, password} = req.body;

    const user = await User.findOne({username}).lean();

    if (user) {
        if (await bcrypt.compare(password, user.password)) {
            const token = jwt.sign(
                {
                    id: user._id,
                    username: user.username
                },
                JWT_SECRET
            )

            return res.json({status: 'ok', token});
        }
    }

    res.json({status: 'error', error: 'Invalid username/password'});
});

app.post('/api/register', async (req, res) => {
    const {email, username, password} = req.body;
    const password_hash = await bcrypt.hash(password, 10);

    try {
        const dbResponse = await User.create({
            email,
            username,
            password: password_hash
        });
        console.log('User created successfully: ', dbResponse);

    } catch (error) {
        if (error.code === 11000) {
            // duplicate key
            return res.json({status: 'error', error: 'Email or Username is already in use'});
        }
        throw error;
    }

    res.json({status: 'ok'});
});

app.post('/api/create-game', async (req, res) => {
    const {token, gameData} = req.body

    console.log(token);
    console.log(gameData);

    const user = verifyToken(token);
    if (user == null) {
        res.json({status: 'error', error: 'Authorization failed!'});
    } else {
        res.json({status: 'ok', gameID: Math.random()});
    }
});


let players = {};
let colors = [0xFF0000, 0x0000FF, 0x00FF00, 0xFFFF00];

io.on('connection', function (socket) {
    let index = Math.floor(Math.random() * colors.length);
    let color = colors[index];
    //delete colors[index];
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
        delete players[socket.id];
        io.emit('disconnect', socket.id);
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
        io.emit('playerDied', players[data.killedPlayerId]);
        delete players[data.killedPlayerId];
        //delete players[socket.id];
        //io.emit('disconnect', socket.id);
    });
});

server.listen(process.env.PORT || 3000, function () {
    console.log(`Listening on ${server.address().port}`);
});
