import Phaser from 'phaser';
import { addMuteButton } from '../ui/muteButton';

let titleAudioPlayedThisSession = false;

export class TitleScene extends Phaser.Scene {
  constructor() {
    super('TitleScene');
  }

  preload() {
    this.load.audio('titleAudio', 'assets/title-audio.m4a');
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

    const title = this.add.text(cx, height * 0.38, "Uncle Brian's Game", {
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

    this.add.text(width - 10, 10, `v${__APP_VERSION__}`, {
      fontFamily: "'Caveat', 'Kalam', cursive",
      fontSize: '18px',
      color: '#6b5340'
    }).setOrigin(1, 0).setAlpha(0.75).setDepth(1000);

    if (isIOSSafariNonStandalone()) {
      this.add.text(
        cx,
        height - 38,
        'iPhone: tap Share ⬆︎ → Add to Home Screen for full screen',
        {
          fontFamily: "'Caveat', 'Kalam', cursive",
          fontSize: '22px',
          color: '#6b5340'
        }
      ).setOrigin(0.5).setAlpha(0.9);
    }

    const start = () => {
      if (!titleAudioPlayedThisSession) {
        titleAudioPlayedThisSession = true;

        const native = new Audio('assets/title-audio.m4a');
        native.volume = 0.7;
        native.play().catch(() => {
          // iOS may refuse if gesture chain is broken; non-fatal
        });

        try {
          (this.sound as unknown as { unlock?: () => void }).unlock?.();
        } catch {
          // unlock is best-effort; in-game SFX will retry on next gesture
        }
      }
      try {
        if (!this.scale.isFullscreen) this.scale.startFullscreen();
      } catch {
        // iPhone Safari has no Fullscreen API; game still starts
      }
      this.scene.start('MainScene', { level: 1 });
    };

    addMuteButton(this);

    this.input.keyboard!.once('keydown', start);
    this.input.on('pointerdown', (_p: Phaser.Input.Pointer, currentlyOver: Phaser.GameObjects.GameObject[]) => {
      if (currentlyOver && currentlyOver.length > 0) return;
      start();
    });
  }
}

function isIOSSafariNonStandalone(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent;
  const isIOS = /iPad|iPhone|iPod/.test(ua) ||
    (ua.includes('Mac') && typeof document !== 'undefined' && 'ontouchend' in document);
  if (!isIOS) return false;
  const isSafari = !/CriOS|FxiOS|EdgiOS|OPiOS/.test(ua);
  if (!isSafari) return false;
  const standalone = (navigator as unknown as { standalone?: boolean }).standalone === true ||
    (typeof window !== 'undefined' && window.matchMedia?.('(display-mode: standalone)').matches);
  return !standalone;
}
