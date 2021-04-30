const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'mainCanvas',
    backgroundColor: 0x000000,
    scene: [Resources, MainScene],
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
}

const game = new Phaser.Game(config);