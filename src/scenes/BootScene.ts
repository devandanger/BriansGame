import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  preload() {
    this.generateProceduralTextures();
    this.drawLoadingUI();

    this.load.audio('titleAudio', 'assets/title-audio.m4a');
    this.load.audio('blobfishSfx', 'assets/blobfish.m4a');
    this.load.audio('sharkSfx', 'assets/shark.m4a');
    this.load.image('blobfish', 'assets/blobfish.png');
    this.load.image('coral', 'assets/coral.png');
    this.load.image('shark', 'assets/shark.png');
  }

  create() {
    this.scene.start('TitleScene');
  }

  private drawLoadingUI() {
    const { width, height } = this.scale;
    const cx = width / 2;
    const cy = height / 2;

    this.cameras.main.setBackgroundColor('#f5efdc');

    this.add.text(cx, cy - 50, "Uncle Brian's Game", {
      fontFamily: "'Caveat', 'Kalam', cursive",
      fontSize: '44px',
      color: '#2a2420'
    }).setOrigin(0.5);

    const barW = 260;
    const barH = 14;
    const barX = cx - barW / 2;
    const barY = cy + 10;

    const frame = this.add.graphics();
    frame.lineStyle(1.5, 0x2a2420, 0.9);
    frame.strokeRect(barX, barY, barW, barH);

    const fill = this.add.graphics();
    const pct = this.add.text(cx, cy + 40, '0%', {
      fontFamily: "'Caveat', 'Kalam', cursive",
      fontSize: '22px',
      color: '#8a5a2b'
    }).setOrigin(0.5);

    this.load.on('progress', (p: number) => {
      fill.clear();
      fill.fillStyle(0xc95454, 0.85);
      fill.fillRect(barX + 1, barY + 1, (barW - 2) * p, barH - 2);
      pct.setText(`${Math.round(p * 100)}%`);
    });
  }

  private generateProceduralTextures() {
    const g = this.add.graphics();

    sketchRect(g, 0, 0, 24, 32, 0xfff8e8, 0x2a2420);
    g.fillStyle(0x2a2420, 1);
    g.fillCircle(9, 11, 1.5);
    g.fillCircle(16, 11, 1.5);
    g.lineStyle(1, 0x2a2420, 0.9);
    g.beginPath();
    g.moveTo(9, 20);
    g.lineTo(16, 20);
    g.strokePath();
    g.generateTexture('player', 24, 32);
    g.clear();

    sketchRect(g, 0, 0, 64, 32, 0xe8dcb5, 0x2a2420);
    g.lineStyle(1, 0x2a2420, 0.35);
    for (let i = 0; i < 6; i++) {
      const sx = 4 + i * 10 + Math.random() * 2;
      g.lineBetween(sx, 8 + Math.random() * 2, sx + 6, 14 + Math.random() * 2);
    }
    g.generateTexture('ground', 64, 32);
    g.clear();

    sketchRect(g, 0, 0, 32, 32, 0xd9c98a, 0x2a2420);
    g.lineStyle(1, 0x2a2420, 0.3);
    for (let i = 0; i < 3; i++) {
      const hy = 8 + i * 8 + Math.random() * 2;
      g.lineBetween(5 + Math.random() * 2, hy, 27 - Math.random() * 2, hy + 3);
    }
    g.generateTexture('block', 32, 32);
    g.destroy();
  }
}

function sketchRect(
  g: Phaser.GameObjects.Graphics,
  x: number, y: number, w: number, h: number,
  fill: number, stroke: number
) {
  g.fillStyle(fill, 1);
  g.fillRect(x, y, w, h);

  const outline = (lineW: number, alpha: number) => {
    const r = () => Math.random() * 1.2;
    g.lineStyle(lineW, stroke, alpha);
    g.beginPath();
    g.moveTo(x + r(), y + r());
    g.lineTo(x + w - r(), y + r());
    g.lineTo(x + w - r(), y + h - r());
    g.lineTo(x + r(), y + h - r());
    g.closePath();
    g.strokePath();
  };
  outline(1.5, 0.9);
  outline(1, 0.5);
}
