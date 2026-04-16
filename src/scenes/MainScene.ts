import Phaser from 'phaser';

const WORLD_WIDTH = 3200;
const WORLD_HEIGHT = 540;
const GROUND_Y = WORLD_HEIGHT - 16;
const LAND_GRAVITY = 900;
const WATER_GRAVITY = 260;
const JUMP_VELOCITY = -620;
const SWIM_VELOCITY = -280;
const WATER_TOP_Y = WORLD_HEIGHT * 0.2;

export class MainScene extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Sprite;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private platforms!: Phaser.Physics.Arcade.StaticGroup;
  private level = 1;
  private prompting = false;

  private get isWaterLevel() {
    return this.level % 2 === 0;
  }

  constructor() {
    super('MainScene');
  }

  init(data: { level?: number }) {
    this.level = data.level ?? 1;
    this.prompting = false;
  }

  preload() {
    const g = this.add.graphics();
    g.fillStyle(0x4ab6ff, 1);
    g.fillRect(0, 0, 24, 32);
    g.generateTexture('player', 24, 32);
    g.clear();

    g.fillStyle(0x3a7d3a, 1);
    g.fillRect(0, 0, 64, 32);
    g.generateTexture('ground', 64, 32);
    g.clear();

    g.fillStyle(0x8a5a2b, 1);
    g.fillRect(0, 0, 32, 32);
    g.generateTexture('block', 32, 32);
    g.destroy();
  }

  create() {
    this.physics.world.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    this.physics.world.TILE_BIAS = 32;
    this.physics.world.gravity.y = this.isWaterLevel ? WATER_GRAVITY : LAND_GRAVITY;
    this.cameras.main.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    this.cameras.main.setBackgroundColor(this.isWaterLevel ? '#0a2a44' : '#1d1d2a');

    if (this.isWaterLevel) {
      const waterHeight = WORLD_HEIGHT - WATER_TOP_Y;
      this.add.rectangle(
        WORLD_WIDTH / 2,
        WATER_TOP_Y + waterHeight / 2,
        WORLD_WIDTH,
        waterHeight,
        0x3377cc,
        0.35
      ).setDepth(5);
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
    this.physics.add.collider(this.player, this.platforms);

    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
    this.cursors = this.input.keyboard!.createCursorKeys();

    const label = this.isWaterLevel ? `Level ${this.level}  ~ water ~` : `Level ${this.level}`;
    this.add.text(12, 12, label, {
      fontFamily: 'monospace',
      fontSize: '20px',
      color: '#ffffff'
    }).setScrollFactor(0).setDepth(100);
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

    const bg = this.add.rectangle(0, 0, 420, 160, 0x000000, 0.75).setStrokeStyle(2, 0xffffff);
    const title = this.add.text(0, -40, `Level ${this.level} complete!`, {
      fontFamily: 'monospace', fontSize: '22px', color: '#ffffff'
    }).setOrigin(0.5);
    const body = this.add.text(0, 0, 'Go to next board?', {
      fontFamily: 'monospace', fontSize: '18px', color: '#ffffff'
    }).setOrigin(0.5);
    const hint = this.add.text(0, 40, 'Press any key to continue', {
      fontFamily: 'monospace', fontSize: '16px', color: '#ffcc33'
    }).setOrigin(0.5);

    this.add.container(cx, cy, [bg, title, body, hint])
      .setScrollFactor(0)
      .setDepth(100);

    this.input.keyboard!.once('keydown', () => this.nextLevel());
  }

  private nextLevel() {
    this.scene.restart({ level: this.level + 1 });
  }

  update() {
    if (this.prompting) return;

    const runSpeed = 240;
    const body = this.player.body as Phaser.Physics.Arcade.Body;

    this.player.setVelocityX(runSpeed);

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
  }
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
