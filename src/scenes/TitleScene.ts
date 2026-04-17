import Phaser from 'phaser';

export class TitleScene extends Phaser.Scene {
  constructor() {
    super('TitleScene');
  }

  create() {
    const { width, height } = this.scale;

    this.cameras.main.setBackgroundColor('#f5efdc');

    const paper = this.add.graphics().setDepth(-10);
    paper.lineStyle(1, 0x8fb4d6, 0.55);
    for (let ly = 40; ly < height - 20; ly += 30) {
      paper.lineBetween(0, ly + (Math.random() - 0.5), width, ly + (Math.random() - 0.5));
    }
    paper.lineStyle(1.5, 0xc95454, 0.55);
    paper.lineBetween(60, 0, 60, height);
    paper.lineStyle(1.5, 0xc95454, 0.35);
    paper.lineBetween(62, 0, 62, height);

    const cx = width / 2;

    const title = this.add.text(cx, height * 0.38, "Uncle Brian's Game!!", {
      fontFamily: "'Caveat', 'Kalam', cursive",
      fontSize: '88px',
      color: '#2a2420'
    }).setOrigin(0.5);
    title.setShadow(2, 3, 'rgba(42,36,32,0.25)', 2, false, true);

    const underline = this.add.graphics();
    underline.lineStyle(3, 0xc95454, 0.85);
    const tx = title.x - title.width / 2 + 10;
    const ux = title.x + title.width / 2 - 10;
    const uy = title.y + title.height / 2 + 2;
    underline.beginPath();
    underline.moveTo(tx, uy);
    for (let x = tx; x <= ux; x += 12) {
      underline.lineTo(x, uy + (Math.random() - 0.5) * 2);
    }
    underline.lineTo(ux, uy);
    underline.strokePath();

    this.add.text(cx, height * 0.62, 'press any key to start', {
      fontFamily: "'Caveat', 'Kalam', cursive",
      fontSize: '36px',
      color: '#8a5a2b'
    }).setOrigin(0.5);

    const blink = this.add.text(cx, height * 0.72, '▸', {
      fontFamily: "'Caveat', 'Kalam', cursive",
      fontSize: '28px',
      color: '#8a5a2b'
    }).setOrigin(0.5);
    this.tweens.add({
      targets: blink,
      alpha: 0.2,
      duration: 600,
      yoyo: true,
      repeat: -1
    });

    this.input.keyboard!.once('keydown', () => this.scene.start('MainScene', { level: 1 }));
    this.input.once('pointerdown', () => this.scene.start('MainScene', { level: 1 }));
  }
}
