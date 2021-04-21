var lastFired = 0;

class MainScene extends Phaser.Scene {

    constructor() {
        super("playGame");
    }

    create() {
        const screenCenterX = this.cameras.main.worldView.x + this.cameras.main.width / 2;
        const screenCenterY = this.cameras.main.worldView.y + this.cameras.main.height / 2;
        this.background = this.add.image(0, 0, "background");
        this.background.setOrigin(0, 0);
        this.cursorKeys = this.input.keyboard.createCursorKeys();
        this.spacebar = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        this.bullets = this.physics.add.group({
            classType: Bullet,
            maxSize: 200,
            collideWorldBounds: true
        });

        var self = this;
        this.socket = io();
        this.otherPlayers = this.physics.add.group();
        this.socket.on('currentPlayers', function (players) {
            Object.keys(players).forEach(function (id) {
                if (players[id].playerId === self.socket.id) {
                    addPlayer(self, players[id]);
                } else {
                    addOtherPlayers(self, players[id]);
                }
            });
            self.physics.add.overlap(self.bullets, self.otherPlayers, self.hitEnemy, null, self);
        });
        this.socket.on('newPlayer', function (playerInfo) {
            addOtherPlayers(self, playerInfo);
        });
        this.socket.on('disconnect', function (playerId) {
            self.otherPlayers.getChildren().forEach(function (otherPlayer) {
                if (playerId === otherPlayer.playerId) {
                    otherPlayer.destroy();
                }
            });
        });
        this.socket.on('playerMoved', function (playerInfo) {
            self.otherPlayers.getChildren().forEach(function (otherPlayer) {
                if (playerInfo.playerId === otherPlayer.playerId) {
                    otherPlayer.setRotation(playerInfo.rotation);
                    otherPlayer.setPosition(playerInfo.x, playerInfo.y);
                }
            });
        });
        this.socket.on('playerShot', function (playerInfo) {
            if (self.scene.isPaused())
                return;
                
            self.otherPlayers.getChildren().forEach(function (otherPlayer) {
                if (playerInfo.playerId === otherPlayer.playerId) {
                    var bullet = self.bullets.get();

                    if (bullet)
                    {
                        bullet.fire(otherPlayer);
                        bullet.play("beam_anim");
                    }
                }
            });
        });
        this.socket.on('playerDied', function (playerInfo) {
            console.log(`${playerInfo} died`);
            self.otherPlayers.getChildren().forEach(function (otherPlayer) {
                if (playerInfo.playerId === otherPlayer.playerId) {
                    console.log('but not me!');
                    otherPlayer.destroy();
                }
            });
            if (self.ship.playerId === playerInfo.playerId){
                console.log('me :(');
                self.ship.destroy();
                self.ship = undefined;
                this.diedText = self.add.text(screenCenterX, screenCenterY, 'YOU DIED', { fontSize: '40px', fill: '#ff001e' }).setOrigin(0.5);
                //self.scene.pause();
            }
        });
        this.socket.on('gameOver', function (winnerScore, currentPlayerScore) {
            if (this.diedText !== undefined){
                this.diedText.destroy();
            }
            console.log(`winner score: ${winnerScore}`);
            this.winnerText = self.add.text(screenCenterX, screenCenterY - 50, `WINNER SCORE: ${winnerScore}`, { fontSize: '40px', fill: '#faf8f8' }).setOrigin(0.5);
            this.currentPlayerText = self.add.text(screenCenterX, screenCenterY, `YOUR SCORE: ${currentPlayerScore}`, { fontSize: '40px', fill: '#faf8f8' }).setOrigin(0.5);
            this.backToMainMenuButton = self.add.text(screenCenterX, screenCenterY + 50, 'Back to main menu', { fontSize: '40px', fill: '#faf8f8' }).setOrigin(0.5)
                .setInteractive()
                .on('pointerdown', () => actionOnClick() );
        });
    }

    update(time, delta) {
        this.playerControl(time, delta);
    }

    playerControl(time, delta) {
        if (this.ship !== undefined) {
            console.log(`This.ship: ${this.ship}`)
            this.physics.velocityFromRotation(this.ship.rotation, 200, this.ship.body.acceleration);
            if (this.cursorKeys.left.isDown) {
                this.ship.setAngularVelocity(-200);
            } else if (this.cursorKeys.right.isDown) {
                this.ship.setAngularVelocity(200);
            } else {
                this.ship.setAngularVelocity(0);
            }
            // emit player movement
            var x = this.ship.x;
            var y = this.ship.y;
            var r = this.ship.rotation;
            if (this.ship.oldPosition && (x !== this.ship.oldPosition.x || y !== this.ship.oldPosition.y || r !== this.ship.oldPosition.rotation)) {
                this.socket.emit('playerMovement', {x: this.ship.x, y: this.ship.y, rotation: this.ship.rotation});
            }

            // save old position data
            this.ship.oldPosition = {
                x: this.ship.x,
                y: this.ship.y,
                rotation: this.ship.rotation
            };
        }

        if (this.spacebar.isDown && time > lastFired){
            var bullet = this.bullets.get();

            if (bullet)
            {
                this.socket.emit('playerShooting', {});
                bullet.fire(this.ship);
                bullet.play("beam_anim");

                lastFired = time + 100;
            }
        }
    }


    hitEnemy(bullet, enemy) {
        if (this.ship !== undefined && bullet.owner.playerId !== enemy.playerId && bullet.owner.playerId === this.ship.playerId) {
            console.log(`bullet hit ${enemy.playerId} owner: ${bullet.owner.playerId} `);
            bullet.setActive(false);
            bullet.setVisible(false);
            if(bullet.body !== undefined){
                bullet.body.stop();
            }
            bullet.destroy();
            this.socket.emit('playerDeath', {killedPlayerId: enemy.playerId, killerPlayerId: bullet.owner.playerId});
        }
    }
}

function addPlayer(self, playerInfo) {
    self.ship = self.physics.add.sprite(playerInfo.x, playerInfo.y, 'ship1').setDepth(2);
    self.ship.setTint(playerInfo.color);
    self.ship.setScale(2);
    self.ship.setCollideWorldBounds(true);
    self.ship.setDrag(100);
    self.ship.setAngularDrag(100);
    self.ship.setMaxVelocity(200);
    self.ship.play("ship1_anim");
    
    self.ship.playerId = playerInfo.playerId;
}

function addOtherPlayers(self, playerInfo) {
    const otherPlayer = self.physics.add.sprite(playerInfo.x, playerInfo.y, 'ship1').setDepth(2);
    otherPlayer.setTint(playerInfo.color);
    otherPlayer.setScale(2);
    otherPlayer.rotation = playerInfo.rotation;
    otherPlayer.playerId = playerInfo.playerId;
    otherPlayer.play("ship1_anim");
    self.otherPlayers.add(otherPlayer);
    
}

function actionOnClick() {
    window.open("https://yandex.ru")
}