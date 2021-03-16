class Scene1 extends Phaser.Scene {
    constructor() {
        super("bootGame");
    }

    preload(){
        this.load.image("background", "assets/images/background.png");
        this.load.spritesheet("ship1", "assets/images/ship.png", {
            frameWidth: 16,
            frameHeight: 16,
        });
        this.load.spritesheet("ship2", "assets/images/ship2.png", {
            frameWidth: 16,
            frameHeight: 32,
        });
        this.load.spritesheet("ship3", "assets/images/ship.png", {
            frameWidth: 16,
            frameHeight: 16,
        });
        this.load.spritesheet("ship4", "assets/images/ship3.png", {
            frameWidth: 32,
            frameHeight: 32,
        });
        this.load.spritesheet("explosion", "assets/images/explosion.png", {
            frameWidth: 16,
            frameHeight: 16,
        });
    }

    create() {
        this.add.text(20, 20, "Loading game...");
        this.scene.start("playGame");
    }
}