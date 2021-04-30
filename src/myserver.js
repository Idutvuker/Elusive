const express = require('express');
const mongoose = require('mongoose');
const User = require('./model/user');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
const gameserver = require('./gameserver');

mongoose.connect('mongodb://localhost:27017/login-app-db', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true
});

JWT_SECRET = "\\}l8FZ55Ty4h\"6'H~V;Gf3a|l||GwYW>>*i1O,;s)}|3thbCJXA|1eq_IB:%&dy<Jq-/(!U6z0U{@c@'2j_Fd?";

let myServer = {
    verifyToken: function(token) {
        try {
            return jwt.verify(token, JWT_SECRET);
        } catch (error) {
            return null;
        }
    },

    setup: function(app) {
        const server = require('http').Server(app);

        app.use(express.json());
        app.use(express.urlencoded({extended: true}));

        app.use(express.static('./public'));

        app.get('/', function (req, res) {
            res.sendFile(path.resolve('./public/main_menu.html'));
        });

        app.post('/api/authorize', async (req, res) => {
            const {token} = req.body;
            const userData = myServer.verifyToken(token);

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

            const user = myServer.verifyToken(token);
            if (user == null) {
                res.json({status: 'error', error: 'Authorization failed!'});
            } else {
                gameserver(server, gameData);
                res.json({status: 'ok', gameID: Math.random()});
            }
        });


        server.listen(process.env.PORT || 3000, function () {
            console.log(`Listening on ${server.address().port}`);
        });

    }
}

module.exports = myServer;
