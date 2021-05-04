let lastFired = 0;

const currentPlayerColor = 0x0000FF;
const otherPlayerColor = 0xFF0000;
const maxBulletsCount = 200;
const playerSpriteScale = 2;
const currentPlayerDrag = 100;
const currentPlayerAngularDrag = 100;
const currentPlayerMaxVelocity = 200;
const nextRoundTitleDelay = 1000;
const spacerSize = 50;

class MainScene extends Phaser.Scene {

    constructor() {
        super("playGame");
    }

    create() {
        this.setBackground();
        this.setControlKeys();
        this.setPhysicalObjectGroups();
        this.setSocketEvents();
    }

    update(time) {
        this.playerControl(time);
        return 0
    }

    setBackground() {
        this.background = this.add.image(0, 0, "background");
        this.background.setOrigin(0, 0);
    }

    setMap(mapTitle) {
        this.map = this.physics.add.staticGroup();
        Object.entries(maps[mapTitle]).forEach(([objectTitle, coordinates]) => {
            for (let i = 0; i < coordinates.length; i++) {
                const object = this.physics.add.staticSprite(coordinates[i].x, coordinates[i].y, objectTitle).setDepth(2);
                this.map.add(object);
            }
        });
    }

    setControlKeys() {
        this.cursorKeys = this.input.keyboard.createCursorKeys();
        this.spacebar = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    }

    setPhysicalObjectGroups() {
        this.bullets = this.physics.add.group({
            classType: Bullet,
            maxSize: maxBulletsCount,
            collideWorldBounds: true
        });
        this.otherPlayers = this.physics.add.group();
    }

    setSocketEvents() {
        this.socket = io();

        this.socket.on('connect', () => {
            this.socket.emit('token', localStorage.getItem('token'));
        });

        this.socket.on('alert', message => {
            alert(message)
        });

        this.socket.on('disconnect', () => {
            location.href = 'main_menu.html';
        });

        let self = this;
        const screenCenterX = this.cameras.main.worldView.x + this.cameras.main.width / 2;
        const screenCenterY = this.cameras.main.worldView.y + this.cameras.main.height / 2;

        this.socket.on('loading', function (mapTitle) {
            console.log(`map ${mapTitle}`);
            self.setMap(mapTitle);
            this.loadingText = self.add.text(screenCenterX, screenCenterY, 'Waiting\nfor players', {
                fontSize: '40px',
                fill: '#faf8f8',
                align: 'center'
            }).setOrigin(0.5);
        });

        this.socket.on('currentPlayers', function (players) {
            if (this.loadingText !== undefined) {
                this.loadingText.destroy();
            }

            console.log('Current Players');

            Object.keys(players).forEach(function (id) {
                if (players[id].playerId === self.socket.id) {
                    self.addPlayer(players[id]);
                } else {
                    self.addOtherPlayers(players[id]);
                }
            });
            self.physics.add.overlap(self.bullets, self.otherPlayers, self.hitEnemy, null, self);
            self.physics.add.overlap(self.bullets, self.map, self.hideBullet, null, self);
            self.physics.add.collider(self.otherPlayers, self.map);
            self.physics.add.collider(self.ship, self.map);
        });

        this.socket.on('newPlayer', function (playerInfo) {
            self.addOtherPlayers(playerInfo);
        });

        this.socket.on('playerDisconnected', function (playerId) {
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
                    let bullet = self.bullets.get();

                    if (bullet) {
                        bullet.fire(otherPlayer);
                        bullet.play("beam_anim");
                    }
                }
            });
        });

        this.socket.on('playerDied', function (playerInfo) {
            self.otherPlayers.getChildren().forEach(function (otherPlayer) {
                if (playerInfo.playerId === otherPlayer.playerId) {
                    otherPlayer.destroy();
                }
            });
            if (self.ship.playerId !== undefined && self.ship.playerId === playerInfo.playerId) {
                self.ship.destroy();
                self.ship = undefined;
                this.diedText = self.add.text(screenCenterX, screenCenterY, 'YOU DIED', {
                    fontSize: '40px',
                    fill: '#ff001e'
                }).setOrigin(0.5);
                //self.scene.pause();
            }
        });

        this.socket.on('nextRound', function (players, roundNumber) {
            if (this.diedText !== undefined) {
                this.diedText.destroy();
            }
            self.otherPlayers.clear(true);
            if (self.ship !== undefined) {
                self.ship.destroy();
                self.ship = undefined;
            }
            self.nextRoundText = self.add.text(screenCenterX, screenCenterY, `ROUND ${roundNumber}`, {
                fontSize: '40px',
                fill: '#faf8f8'
            }).setOrigin(0.5).setDepth(3);
            let timer = self.time.delayedCall(nextRoundTitleDelay, self.deleteRoundText, [players], self);
        });

        this.socket.on('gameOver', function (winnerScore, currentPlayerScore) {
            if (this.diedText !== undefined) {
                this.diedText.destroy();
            }
            console.log(`winner score: ${winnerScore}`);
            this.winnerText = self.add.text(screenCenterX, screenCenterY - spacerSize, `WINNER SCORE: ${winnerScore}`, {
                fontSize: '40px',
                fill: '#faf8f8'
            }).setOrigin(0.5).setDepth(3);
            this.currentPlayerText = self.add.text(screenCenterX, screenCenterY, `YOUR SCORE: ${currentPlayerScore}`, {
                fontSize: '40px',
                fill: '#faf8f8'
            }).setOrigin(0.5).setDepth(3);
            // this.backToMainMenuButton = self.add.text(screenCenterX, screenCenterY + spacerSize, 'Back to main menu', {
            //     fontSize: '40px',
            //     fill: '#faf8f8'
            // }).setOrigin(0.5).setDepth(3)
            //     .setInteractive()
            //     .on('pointerdown', () => self.actionOnClick());
        });
    }

    deleteRoundText(players) {
        let self = this;
        this.nextRoundText.destroy();
        Object.keys(players).forEach(function (id) {
            if (players[id].playerId === self.socket.id) {
                self.addPlayer(players[id]);
            } else {
                self.addOtherPlayers(players[id]);
            }
        });
        this.physics.add.overlap(this.bullets, this.otherPlayers, this.hitEnemy, null, this);
        this.physics.add.overlap(self.bullets, self.map, self.hideBullet, null, self);
        this.physics.add.collider(self.otherPlayers, self.map);
        this.physics.add.collider(self.ship, self.map);
        return 0
    }

    playerControl(time) {
        if (this.ship !== undefined) {
            this.physics.velocityFromRotation(this.ship.rotation, 200, this.ship.body.acceleration);
            if (this.cursorKeys.left.isDown) {
                this.ship.setAngularVelocity(-200);
            } else if (this.cursorKeys.right.isDown) {
                this.ship.setAngularVelocity(200);
            } else {
                this.ship.setAngularVelocity(0);
            }

            // emit player movement
            let x = this.ship.x;
            let y = this.ship.y;
            let r = this.ship.rotation;
            if (this.ship.oldPosition && (x !== this.ship.oldPosition.x || y !== this.ship.oldPosition.y || r !== this.ship.oldPosition.rotation)) {
                this.socket.emit('playerMovement', {x: this.ship.x, y: this.ship.y, rotation: this.ship.rotation});
            }

            // save old position data
            this.ship.oldPosition = {
                x: this.ship.x,
                y: this.ship.y,
                rotation: this.ship.rotation
            };

            if (this.spacebar.isDown && time > lastFired) {
                let bullet = this.bullets.get();

                if (bullet) {
                    this.socket.emit('playerShooting', {});
                    bullet.fire(this.ship);
                    bullet.play("beam_anim");

                    lastFired = time + 100;
                }
            }
        }
    }


    hitEnemy(bullet, enemy) {
        if (this.ship !== undefined && bullet.owner.playerId !== enemy.playerId && bullet.owner.playerId === this.ship.playerId) {
            console.log(`bullet hit ${enemy.playerId} owner: ${bullet.owner.playerId} `);
            bullet.setActive(false);
            bullet.setVisible(false);
            if (bullet.body !== undefined) {
                bullet.body.stop();
            }
            bullet.destroy();
            this.socket.emit('playerDeath', {killedPlayerId: enemy.playerId, killerPlayerId: bullet.owner.playerId});
        }
    }

    hideBullet(bullet, map) {
        bullet.setActive(false);
        bullet.setVisible(false);
        if (bullet.body !== undefined) {
            bullet.body.stop();
        }
        bullet.destroy();
    }

    addPlayer(playerInfo) {
        console.log(`MainPlayer(x: ${playerInfo.x} y: ${playerInfo.y})`)
        this.ship = this.physics.add.sprite(playerInfo.x, playerInfo.y, 'ship1').setDepth(2);
        this.ship.setTint(currentPlayerColor);
        this.ship.setScale(playerSpriteScale);
        this.ship.setCollideWorldBounds(true);
        this.ship.setDrag(currentPlayerDrag);
        this.ship.setAngularDrag(currentPlayerAngularDrag);
        this.ship.setMaxVelocity(currentPlayerMaxVelocity);
        this.ship.play("ship1_anim");

        this.ship.playerId = playerInfo.playerId;
    }

    addOtherPlayers(playerInfo) {
        console.log(`OtherPlayer(x: ${playerInfo.x} y: ${playerInfo.y})`)
        const otherPlayer = this.physics.add.sprite(playerInfo.x, playerInfo.y, 'ship1').setDepth(2);
        otherPlayer.setTint(otherPlayerColor);
        otherPlayer.setScale(playerSpriteScale);
        otherPlayer.rotation = playerInfo.rotation;
        otherPlayer.playerId = playerInfo.playerId;
        otherPlayer.play("ship1_anim");
        this.otherPlayers.add(otherPlayer);

    }

    actionOnClick() {
        window.open("https://yandex.ru")
    }
}