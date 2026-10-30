import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  AMBIENT_SOUNDS_CATALOG,
  clampVolume,
  formatVolumePercent,
  isValidSoundType,
  getSoundMeta,
  DEFAULT_AMBIENT_CONFIG,
} from './ambientSounds.ts';

describe('Ambient Sounds Catalog & Pure Logic', () => {
  test('catalog contains the requested rain and cafe sounds, plus nature and focus sounds', () => {
    assert.strictEqual(AMBIENT_SOUNDS_CATALOG.length, 6);
    const soundIds = AMBIENT_SOUNDS_CATALOG.map((s) => s.id);
    assert.ok(soundIds.includes('rain'), 'Contains rain sound');
    assert.ok(soundIds.includes('cafe'), 'Contains cafe ambience');
    assert.ok(soundIds.includes('forest'), 'Contains forest nature sound');
    assert.ok(soundIds.includes('waves'), 'Contains ocean waves sound');
    assert.ok(soundIds.includes('fireplace'), 'Contains fireplace sound');
    assert.ok(soundIds.includes('brown_noise'), 'Contains brown noise sound');
  });

  test('every ambient sound has complete Persian metadata and emoji', () => {
    for (const sound of AMBIENT_SOUNDS_CATALOG) {
      assert.ok(sound.persianName.length > 0, `Sound ${sound.id} must have persianName`);
      assert.ok(sound.subtitle.length > 0, `Sound ${sound.id} must have subtitle`);
      assert.ok(sound.description.length > 0, `Sound ${sound.id} must have description`);
      assert.ok(sound.emoji.length > 0, `Sound ${sound.id} must have emoji`);
      assert.ok(sound.benefit.length > 0, `Sound ${sound.id} must have benefit`);
    }
  });

  test('clampVolume handles bounds correctly', () => {
    assert.strictEqual(clampVolume(-0.5), 0);
    assert.strictEqual(clampVolume(1.8), 1);
    assert.strictEqual(clampVolume(0.654), 0.65);
    assert.strictEqual(clampVolume(0), 0);
    assert.strictEqual(clampVolume(1), 1);
    assert.strictEqual(clampVolume(NaN), 0.5);
  });

  test('formatVolumePercent outputs correct percent string', () => {
    assert.strictEqual(formatVolumePercent(0.65), '65٪');
    assert.strictEqual(formatVolumePercent(1), '100٪');
    assert.strictEqual(formatVolumePercent(0), '0٪');
  });

  test('isValidSoundType distinguishes valid vs invalid sound ids', () => {
    assert.strictEqual(isValidSoundType('rain'), true);
    assert.strictEqual(isValidSoundType('cafe'), true);
    assert.strictEqual(isValidSoundType('forest'), true);
    assert.strictEqual(isValidSoundType('invalid_sound_type'), false);
    assert.strictEqual(isValidSoundType(''), false);
  });

  test('getSoundMeta returns sound info or falls back to rain', () => {
    const rain = getSoundMeta('rain');
    assert.strictEqual(rain.id, 'rain');
    assert.ok(rain.persianName.includes('باران'));

    const cafe = getSoundMeta('cafe');
    assert.strictEqual(cafe.id, 'cafe');
    assert.ok(cafe.persianName.includes('کافه'));

    // Unknown fallback
    // @ts-expect-error testing invalid input fallback
    const fallback = getSoundMeta('unknown_xyz');
    assert.strictEqual(fallback.id, 'rain');
  });

  test('DEFAULT_AMBIENT_CONFIG has enabled true, default rain sound, volume 0.65 and autoPlayOnTask true', () => {
    assert.strictEqual(DEFAULT_AMBIENT_CONFIG.enabled, true);
    assert.strictEqual(DEFAULT_AMBIENT_CONFIG.activeSound, 'rain');
    assert.strictEqual(DEFAULT_AMBIENT_CONFIG.volume, 0.65);
    assert.strictEqual(DEFAULT_AMBIENT_CONFIG.autoPlayOnTask, true);
  });
});
