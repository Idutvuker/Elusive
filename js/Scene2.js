var lastFired = 0;

class Scene2 extends Phaser.Scene {

    constructor() {
        super("playGame");
    }

    create() {
        this.background = this.add.image(0, 0, "background");
        this.background.setOrigin(0, 0);

        this.bullets = this.physics.add.group({
            classType: Bullet,
            maxSize: 30,
            runChildUpdate: true
        });

        this.addShips();
    }

    update(time, delta) {
        this.moveShip(this.ship1, 1);
        this.movePlayerManager();
        if (this.spacebar.isDown && time > lastFired){
            var bullet = this.bullets.get();
            bullet.play("beam_anim");

            if (bullet)
            {
                bullet.fire(this.ship1);

                lastFired = time + 100;
            }
        }
        this.moveShip(this.ship2, 1);
        this.moveShip(this.ship3, 1);
        this.moveShip(this.ship4, 1);
    }

    addShips() {
        this.ship1 = this.physics.add.sprite(30, 30, "ship1").setDepth(2);
        this.ship1.setCollideWorldBounds(true);
        this.ship1.setScale(2);
        //this.ship1.setAngle(45);
        //this.ship1.setDrag(300);
        //this.ship1.setAngularDrag(400);
        this.anims.create({
            key: "ship1_anim",
            frames: this.anims.generateFrameNumbers("ship1"),
            frameRate: 20,
            repeat: -1
        });
        this.ship2 = this.physics.add.sprite(config.width - 30, 30, "ship2");
        this.ship2.setCollideWorldBounds(true);
        this.ship2.setScale(2);
        this.ship2.setAngle(135);
        this.anims.create({
            key: "ship2_anim",
            frames: this.anims.generateFrameNumbers("ship2"),
            frameRate: 20,
            repeat: -1
        });
        this.ship3 = this.physics.add.sprite(config.width - 30, config.height - 30, "ship3");
        this.ship3.setCollideWorldBounds(true);
        this.ship3.setScale(2);
        this.ship3.setAngle(-135);
        this.anims.create({
            key: "ship3_anim",
            frames: this.anims.generateFrameNumbers("ship3"),
            frameRate: 20,
            repeat: -1
        });
        this.ship4 = this.physics.add.sprite(30, config.height - 30, "ship4");
        this.ship4.setCollideWorldBounds(true);
        this.ship4.setScale(2);
        this.ship4.setAngle(-45);
        this.anims.create({
            key: "ship4_anim",
            frames: this.anims.generateFrameNumbers("ship4"),
            frameRate: 20,
            repeat: -1
        });
        this.anims.create({
            key: "explode",
            frames: this.anims.generateFrameNumbers("ship4"),
            frameRate: 20,
            repeat: 0,
            hideOnComplete: true
        });
        this.anims.create({
            key: "red",
            frames: this.anims.generateFrameNumbers("power-up", {
                start: 0,
                end: 1
            }),
            frameRate: 20,
            repeat: -1,
        });
        this.anims.create({
            key: "gray",
            frames: this.anims.generateFrameNumbers("power-up", {
                start: 2,
                end: 3
            }),
            frameRate: 20,
            repeat: -1,
        });
        this.anims.create({
            key: "beam_anim",
            frames: this.anims.generateFrameNumbers("beam"),
            frameRate: 20,
            repeat: -1,
        });

        this.powerUps = this.physics.add.group();

        var maxObjects = 4;
        for (var i = 0; i <= maxObjects; i++) {
            var powerUp = this.physics.add.sprite(16, 16, "power-up");
            this.powerUps.add(powerUp);
            powerUp.setRandomPosition(0, 0, game.config.width, game.config.height);

            if (Math.random() > 0.5) {
                powerUp.play("red");
            } else {
                powerUp.play("gray");
            }

            powerUp.setVelocity(100);
            powerUp.setCollideWorldBounds(true);
            powerUp.setBounce(1);
        }

        this.ship1.play("ship1_anim");
        this.ship2.play("ship2_anim");
        this.ship3.play("ship3_anim");
        this.ship4.play("ship4_anim");

        this.cursorKeys = this.input.keyboard.createCursorKeys();
        this.spacebar = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

        this.projectiles = this.physics.add.group();
    }

    movePlayerManager() {

        if (this.cursorKeys.left.isDown) {
            this.ship1.setAngularVelocity(-200);
        } else if (this.cursorKeys.right.isDown) {
            this.ship1.setAngularVelocity(200);
        }else{
            this.ship1.setAngularVelocity(0);
        }
    }

    moveShip(ship, speed) {
        this.physics.velocityFromRotation(ship.rotation, 200, ship.body.acceleration);
    }
}