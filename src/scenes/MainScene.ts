import Phaser from 'phaser';
import { addMuteButton } from '../ui/muteButton';

const WORLD_WIDTH = 3200;
const WORLD_HEIGHT = 540;
const GROUND_Y = WORLD_HEIGHT - 16;
const LAND_GRAVITY = 900;
const WATER_GRAVITY = 260;
const JUMP_VELOCITY = -620;
const SWIM_VELOCITY = -280;
const WATER_TOP_Y = WORLD_HEIGHT * 0.2;

type Blobfish = Phaser.GameObjects.Image & { _seen?: boolean };

export class MainScene extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Sprite;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private platforms!: Phaser.Physics.Arcade.StaticGroup;
  private blobfish: Blobfish[] = [];
  private level = 1;
  private prompting = false;
  private bounceUntil = 0;
  private bounceCooldownUntil = 0;

  private get isWaterLevel() {
    return this.level % 2 === 0;
  }

  constructor() {
    super('MainScene');
  }

  init(data: { level?: number }) {
    this.level = data.level ?? 1;
    this.prompting = false;
    this.blobfish = [];
    this.bounceUntil = 0;
    this.bounceCooldownUntil = 0;
  }

  preload() {
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

    this.load.image('blobfish', 'assets/blobfish.png');
    this.load.image('coral', 'assets/coral.png');
    this.load.image('shark', 'assets/shark.png');
    this.load.audio('blobfishSfx', 'assets/blobfish.m4a');
    this.load.audio('sharkSfx', 'assets/shark.m4a');
  }

  create() {
    this.physics.world.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    this.physics.world.TILE_BIAS = 32;
    this.physics.world.gravity.y = this.isWaterLevel ? WATER_GRAVITY : LAND_GRAVITY;
    this.cameras.main.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    this.cameras.main.setBackgroundColor(this.isWaterLevel ? '#dfe9f1' : '#f5efdc');

    this.drawPaperBackground();

    if (this.isWaterLevel) {
      this.drawWater();
      this.spawnCoral();
      this.spawnBlobfish();
      this.scheduleSharkPass();
    }

    this.platforms = this.physics.add.staticGroup();
    for (let x = 0; x < WORLD_WIDTH; x += 64) {
      this.platforms.create(x + 32, GROUND_Y, 'ground');
    }

    this.generateObstacles();

    const spawnY = this.isWaterLevel ? WATER_TOP_Y + 40 : 400;
    this.player = this.physics.add.sprite(80, spawnY, 'player');
    this.player.setCollideWorldBounds(true);
    this.player.body!.setSize(18, 28).setOffset(3, 3);
    this.player.setDepth(6);
    this.physics.add.collider(this.player, this.platforms, this.onObstacleHit, undefined, this);

    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
    this.cursors = this.input.keyboard!.createCursorKeys();

    this.input.on('pointerdown', (_p: Phaser.Input.Pointer, currentlyOver: Phaser.GameObjects.GameObject[]) => {
      if (currentlyOver && currentlyOver.length > 0) return;
      this.handlePointerAction();
    });

    const label = this.isWaterLevel ? `Level ${this.level}  ~ water ~` : `Level ${this.level}`;
    this.add.text(72, 12, label, {
      fontFamily: "'Caveat', 'Kalam', cursive",
      fontSize: '28px',
      color: '#2a2420'
    }).setScrollFactor(0).setDepth(100);

    addMuteButton(this);
  }

  private drawPaperBackground() {
    const bg = this.add.graphics().setDepth(-10);
    bg.lineStyle(1, 0x8fb4d6, 0.55);
    for (let ly = 40; ly < WORLD_HEIGHT - 20; ly += 30) {
      const jy = ly + (Math.random() - 0.5);
      bg.lineBetween(0, jy, WORLD_WIDTH, jy);
    }
    bg.lineStyle(1.5, 0xc95454, 0.55);
    bg.lineBetween(60, 0, 60, WORLD_HEIGHT);
    bg.lineStyle(1.5, 0xc95454, 0.35);
    bg.lineBetween(62, 0, 62, WORLD_HEIGHT);
  }

  private scheduleSharkPass() {
    const delay = 2500 + Math.random() * 6000;
    this.time.delayedCall(delay, () => this.spawnShark());
  }

  private spawnShark() {
    if (this.prompting || !this.scene.isActive()) return;

    const cam = this.cameras.main;
    const fromLeft = Math.random() < 0.5;
    const startY = WATER_TOP_Y + 30 + Math.random() * 40;
    const endY = WORLD_HEIGHT - 60;
    const offscreenPad = 220;

    const startX = fromLeft
      ? cam.scrollX - offscreenPad
      : cam.scrollX + cam.width + offscreenPad;
    const endX = fromLeft
      ? cam.scrollX + cam.width + offscreenPad
      : cam.scrollX - offscreenPad;

    this.sound.play('sharkSfx', { volume: 0.7 });

    const shark = this.add.image(startX, startY, 'shark').setDepth(7).setScale(0.35);
    if (fromLeft) {
      shark.setAngle(30);
    } else {
      shark.setFlipX(true);
      shark.setAngle(-30);
    }

    const duration = 2400 + Math.random() * 1400;
    this.tweens.add({
      targets: shark,
      x: endX,
      y: endY,
      duration,
      ease: 'Sine.easeIn',
      onComplete: () => shark.destroy()
    });
  }

  private spawnCoral() {
    const rng = mulberry32(hashLevel(this.level) ^ 0x636f7261);
    const count = 8 + Math.floor(rng() * 6);
    const minX = 160;
    const maxX = WORLD_WIDTH - 160;
    const groundTop = GROUND_Y - 16;

    for (let i = 0; i < count; i++) {
      const x = minX + rng() * (maxX - minX);
      const scale = 0.5 + rng() * 0.45;
      const coral = this.add.image(x, groundTop, 'coral').setOrigin(0.5, 1).setDepth(2);
      coral.setScale(scale);
      if (rng() < 0.5) coral.setFlipX(true);
    }
  }

  private spawnBlobfish() {
    const rng = mulberry32(hashLevel(this.level) ^ 0x626c6f62);
    const count = 5 + Math.floor(rng() * 4);
    const minX = 280;
    const maxX = WORLD_WIDTH - 200;
    const minY = WATER_TOP_Y + 50;
    const maxY = WORLD_HEIGHT - 70;

    for (let i = 0; i < count; i++) {
      const x = minX + rng() * (maxX - minX);
      const y = minY + rng() * (maxY - minY);
      const scale = 0.16 + rng() * 0.12;
      const fish = this.add.image(x, y, 'blobfish').setScale(scale).setDepth(3) as Blobfish;
      if (rng() < 0.5) fish.setFlipX(true);

      const bobAmp = 14 + rng() * 24;
      const bobDuration = 1400 + rng() * 1400;
      this.tweens.add({
        targets: fish,
        y: y + bobAmp,
        duration: bobDuration,
        ease: 'Sine.easeInOut',
        yoyo: true,
        repeat: -1,
        delay: rng() * 1200
      });

      this.blobfish.push(fish);
    }
  }

  private drawWater() {
    const waterHeight = WORLD_HEIGHT - WATER_TOP_Y;
    this.add.rectangle(
      WORLD_WIDTH / 2,
      WATER_TOP_Y + waterHeight / 2,
      WORLD_WIDTH,
      waterHeight,
      0x6fa8cf,
      0.22
    ).setDepth(4);

    const wave = this.add.graphics().setDepth(5);
    wave.lineStyle(2, 0x2e5a80, 0.75);
    wave.beginPath();
    wave.moveTo(0, WATER_TOP_Y);
    for (let wx = 0; wx <= WORLD_WIDTH; wx += 14) {
      const wy = WATER_TOP_Y + Math.sin(wx * 0.09) * 3 + (Math.random() - 0.5);
      wave.lineTo(wx, wy);
    }
    wave.strokePath();

    wave.lineStyle(1, 0x2e5a80, 0.35);
    wave.beginPath();
    wave.moveTo(0, WATER_TOP_Y + 4);
    for (let wx = 0; wx <= WORLD_WIDTH; wx += 14) {
      const wy = WATER_TOP_Y + 4 + Math.sin(wx * 0.11 + 1) * 2;
      wave.lineTo(wx, wy);
    }
    wave.strokePath();
  }

  private generateObstacles() {
    const rng = mulberry32(hashLevel(this.level));
    const obstacleCount = 10 + this.level * 3;
    const minX = 250;
    const maxX = WORLD_WIDTH - 120;
    const minGroundGap = 200;
    const groundTop = GROUND_Y - 16;
    const groundBaseY = groundTop - 16;

    const placedGroundX: number[] = [];

    for (let i = 0; i < obstacleCount; i++) {
      const floating = rng() < 0.35;
      const width = 1 + Math.floor(rng() * 3);
      const stackHeight = floating
        ? 1 + Math.floor(rng() * 3)
        : 1 + Math.floor(rng() * 2);

      let x = minX + rng() * (maxX - minX);

      if (!floating) {
        let tries = 0;
        while (
          tries < 8 &&
          placedGroundX.some(px => Math.abs(px - x) < minGroundGap)
        ) {
          x = minX + rng() * (maxX - minX);
          tries++;
        }
        if (placedGroundX.some(px => Math.abs(px - x) < minGroundGap)) continue;
        placedGroundX.push(x);
      }

      const baseY = floating ? 200 + rng() * 200 : groundBaseY;

      for (let wx = 0; wx < width; wx++) {
        for (let sy = 0; sy < stackHeight; sy++) {
          this.platforms.create(
            Math.round(x + wx * 32),
            Math.round(baseY - sy * 32),
            'block'
          );
        }
      }
    }
  }

  private reachEdge() {
    if (this.prompting) return;
    this.prompting = true;
    this.physics.pause();
    this.player.setTint(0xffffaa);
    this.showPrompt();
  }

  private showPrompt() {
    const cam = this.cameras.main;
    const cx = cam.width / 2;
    const cy = cam.height / 2;

    const paper = this.add.graphics();
    paper.fillStyle(0xfff8e8, 0.96);
    paper.fillRoundedRect(-210, -80, 420, 160, 6);
    const drawBorder = () => {
      paper.beginPath();
      paper.moveTo(-210 + Math.random() * 1.5, -80 + Math.random() * 1.5);
      paper.lineTo(210 - Math.random() * 1.5, -80 + Math.random() * 1.5);
      paper.lineTo(210 - Math.random() * 1.5, 80 - Math.random() * 1.5);
      paper.lineTo(-210 + Math.random() * 1.5, 80 - Math.random() * 1.5);
      paper.closePath();
      paper.strokePath();
    };
    paper.lineStyle(2, 0x2a2420, 0.9);
    drawBorder();
    paper.lineStyle(1, 0x2a2420, 0.5);
    drawBorder();

    const font = { fontFamily: "'Caveat', 'Kalam', cursive", color: '#2a2420' };
    const title = this.add.text(0, -40, `Level ${this.level} complete!`, { ...font, fontSize: '32px' }).setOrigin(0.5);
    const body = this.add.text(0, 0, 'Go to next page?', { ...font, fontSize: '24px' }).setOrigin(0.5);
    const hint = this.add.text(0, 40, 'Press any key to continue', { ...font, fontSize: '20px', color: '#8a5a2b' }).setOrigin(0.5);

    this.add.container(cx, cy, [paper, title, body, hint])
      .setScrollFactor(0)
      .setDepth(100);

    this.input.keyboard!.once('keydown', () => this.nextLevel());
  }

  private nextLevel() {
    if (this.level >= 2) {
      this.scene.start('CreditsScene');
      return;
    }
    this.scene.restart({ level: this.level + 1 });
  }

  private onObstacleHit() {
    if (this.time.now < this.bounceCooldownUntil) return;
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    if (body.touching.right || body.blocked.right) {
      this.bounceUntil = this.time.now + 180;
      this.bounceCooldownUntil = this.time.now + 650;
    }
  }

  private handlePointerAction() {
    if (this.prompting) {
      this.nextLevel();
      return;
    }
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    if (this.isWaterLevel) {
      this.player.setVelocityY(SWIM_VELOCITY);
    } else if (body.blocked.down) {
      this.player.setVelocityY(JUMP_VELOCITY);
    }
  }

  update() {
    if (this.prompting) return;

    const runSpeed = 240;
    const body = this.player.body as Phaser.Physics.Arcade.Body;

    if (this.time.now < this.bounceUntil) {
      this.player.setVelocityX(-150);
    } else {
      this.player.setVelocityX(runSpeed);
    }

    const up = this.cursors.up!;
    const space = this.cursors.space!;
    const tapped = Phaser.Input.Keyboard.JustDown(up) || Phaser.Input.Keyboard.JustDown(space);

    if (this.isWaterLevel) {
      if (tapped) this.player.setVelocityY(SWIM_VELOCITY);
    } else if ((up.isDown || space.isDown) && body.blocked.down) {
      this.player.setVelocityY(JUMP_VELOCITY);
    }

    if (this.player.x >= WORLD_WIDTH - this.player.width / 2 - 1) {
      this.reachEdge();
    }

    if (this.blobfish.length) this.checkBlobfishSeen();
  }

  private checkBlobfishSeen() {
    const view = this.cameras.main.worldView;
    for (const fish of this.blobfish) {
      if (fish._seen) continue;
      if (
        fish.x + fish.displayWidth / 2 >= view.x &&
        fish.x - fish.displayWidth / 2 <= view.x + view.width &&
        fish.y + fish.displayHeight / 2 >= view.y &&
        fish.y - fish.displayHeight / 2 <= view.y + view.height
      ) {
        fish._seen = true;
        this.sound.play('blobfishSfx', { volume: 0.6 });
      }
    }
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

function hashLevel(level: number): number {
  let h = 2166136261 ^ level;
  h = Math.imul(h ^ (h >>> 16), 2246822507);
  h = Math.imul(h ^ (h >>> 13), 3266489909);
  return (h ^ (h >>> 16)) >>> 0;
}

function mulberry32(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
