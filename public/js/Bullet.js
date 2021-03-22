class Bullet extends Phaser.Physics.Arcade.Sprite {
    constructor(scene) {
        super(scene, 0, 0, 'beam');

        scene.physics.world.on('worldbounds', this.onWorldBounds);
        this.setBlendMode(1);
        this.setDepth(1);
        this.speed = 300;
        this._temp = new Phaser.Math.Vector2();
    }

    fire(ship) {
        this.setActive(true);
        this.setVisible(true);
        this.setAngle(ship.body.rotation);
        this.setPosition(ship.x, ship.y);
        this.body.reset(ship.x, ship.y);
        this.body.onWorldBounds = true;

        var angle = Phaser.Math.DegToRad(ship.body.rotation);

        this.scene.physics.velocityFromRotation(angle, this.speed, this.body.velocity);

        this.body.velocity.x *= 2;
        this.body.velocity.y *= 2;
    }

    onWorldBounds (body)
    {
        var bullet = body.gameObject;
        bullet.setActive(false);
        bullet.setVisible(false);
        bullet.body.stop();
    }
}