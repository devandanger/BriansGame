import Phaser from 'phaser';
import { MainScene } from './scenes/MainScene';

new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  width: 960,
  height: 540,
  pixelArt: true,
  backgroundColor: '#1d1d2a',
  physics: {
    default: 'arcade',
    arcade: { gravity: { x: 0, y: 900 }, debug: false }
  },
  scene: [MainScene]
});
