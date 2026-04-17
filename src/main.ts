import Phaser from 'phaser';
import { TitleScene } from './scenes/TitleScene';
import { MainScene } from './scenes/MainScene';
import { CreditsScene } from './scenes/CreditsScene';

new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  width: 960,
  height: 540,
  pixelArt: false,
  backgroundColor: '#f5efdc',
  physics: {
    default: 'arcade',
    arcade: { gravity: { x: 0, y: 900 }, debug: false }
  },
  scene: [TitleScene, MainScene, CreditsScene]
});
