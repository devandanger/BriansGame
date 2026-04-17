import Phaser from 'phaser';

const STORAGE_KEY = 'unclebrian.soundOn';

function readSoundOn(): boolean {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    return v === null ? true : v === '1';
  } catch {
    return true;
  }
}

function writeSoundOn(on: boolean) {
  try {
    localStorage.setItem(STORAGE_KEY, on ? '1' : '0');
  } catch {
    // ignore
  }
}

export function applyStoredMuteState(scene: Phaser.Scene) {
  scene.sound.mute = !readSoundOn();
}

export function addMuteButton(scene: Phaser.Scene): Phaser.GameObjects.Text {
  applyStoredMuteState(scene);

  const icon = () => (scene.sound.mute ? '🔇' : '🔊');

  const btn = scene.add.text(12, 12, icon(), {
    fontFamily: "'Caveat', 'Kalam', cursive",
    fontSize: '28px',
    color: '#2a2420',
    backgroundColor: '#fff8e8',
    padding: { left: 10, right: 10, top: 4, bottom: 4 }
  })
    .setScrollFactor(0)
    .setDepth(1000)
    .setInteractive({ useHandCursor: true });

  btn.on('pointerdown', (_p: Phaser.Input.Pointer, _x: number, _y: number, ev: Phaser.Types.Input.EventData) => {
    ev?.stopPropagation?.();
    const nextMute = !scene.sound.mute;
    scene.sound.mute = nextMute;
    writeSoundOn(!nextMute);
    btn.setText(icon());
  });

  return btn;
}
