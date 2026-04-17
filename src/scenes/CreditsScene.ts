import Phaser from 'phaser';
import { addMuteButton } from '../ui/muteButton';

export class CreditsScene extends Phaser.Scene {
  constructor() {
    super('CreditsScene');
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
    const font = "'Caveat', 'Kalam', cursive";
    const ink = '#2a2420';

    this.add.text(cx, 80, 'The End', {
      fontFamily: font, fontSize: '64px', color: ink
    }).setOrigin(0.5).setShadow(2, 3, 'rgba(42,36,32,0.25)', 2, false, true);

    const note = [
      'Hey Bro —',
      '',
      'Evan here, this is all',
      'we came up with.',
      '',
      'Let me know if you like it',
      "and we'll make more levels :)"
    ].join('\n');

    this.add.text(cx, height / 2 + 10, note, {
      fontFamily: font,
      fontSize: '34px',
      color: ink,
      align: 'center',
      lineSpacing: 6
    }).setOrigin(0.5);

    const hint = this.add.text(cx, height - 40, 'press any key to return to title', {
      fontFamily: font, fontSize: '22px', color: '#8a5a2b'
    }).setOrigin(0.5);
    this.tweens.add({ targets: hint, alpha: 0.4, duration: 700, yoyo: true, repeat: -1 });

    addMuteButton(this);

    this.input.keyboard!.once('keydown', () => this.scene.start('TitleScene'));
    this.input.on('pointerdown', (_p: Phaser.Input.Pointer, currentlyOver: Phaser.GameObjects.GameObject[]) => {
      if (currentlyOver && currentlyOver.length > 0) return;
      this.scene.start('TitleScene');
    });
  }
}
