class Scene2 extends Phaser.Scene {

    constructor() {
        super("playGame");
    }

    create(){
        this.background = this.add.image(0, 0, "background");
        this.background.setOrigin(0,0);

        this.addShips();

        //this.add.text(20, 20, "Playing game", {font: "25px Arial", fill: "yellow"})
    }

    update(){
        this.moveShip(this.ship1, 1);
        this.movePlayerManager();
        this.moveShip(this.ship2, 1);
        this.moveShip(this.ship3, 1);
        this.moveShip(this.ship4, 1);
    }

    addShips(){
        this.ship1 = this.physics.add.sprite(30, 30, "ship1");
        this.ship1.setScale(2);
        this.ship1.setAngle(45);
        this.anims.create({
            key: "ship1_anim",
            frames: this.anims.generateFrameNumbers("ship1"),
            frameRate: 20,
            repeat: -1
        });
        this.ship2 = this.physics.add.sprite(config.width-30, 30, "ship2");
        this.ship2.setScale(2);
        this.ship2.setAngle(135);
        this.anims.create({
            key: "ship2_anim",
            frames: this.anims.generateFrameNumbers("ship2"),
            frameRate: 20,
            repeat: -1
        });
        this.ship3 = this.physics.add.sprite(config.width-30, config.height-30, "ship3");
        this.ship3.setScale(2);
        this.ship3.setAngle(-135);
        this.anims.create({
            key: "ship3_anim",
            frames: this.anims.generateFrameNumbers("ship3"),
            frameRate: 20,
            repeat: -1
        });
        this.ship4 = this.physics.add.sprite(30, config.height-30, "ship4");
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

        this.ship1.play("ship1_anim");
        this.ship2.play("ship2_anim");
        this.ship3.play("ship3_anim");
        this.ship4.play("ship4_anim");

        this.cursorKeys = this.input.keyboard.createCursorKeys();
    }

    movePlayerManager(){

        if(this.cursorKeys.left.isDown){
            this.ship1.body.angularVelocity = -200;
        }
        else if(this.cursorKeys.right.isDown){
            this.ship1.body.angularVelocity = 200;
        }

        //if(this.cursorKeys.up.isDown){
        //    this.physics.velocityFromRotation(this.ship1.rotation, 6000, this.ship1.body.acceleration);
        //}
    }
    moveShip(ship, speed){
        ship.body.velocity.x = 0;
        ship.body.velocity.y = 0;
        ship.body.angularVelocity = 0;
        this.physics.velocityFromRotation(ship.rotation, 6000, ship.body.acceleration);
    }
}