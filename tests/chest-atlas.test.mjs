import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, statSync } from 'node:fs';

const media = readFileSync(new URL('../src/lib/chestIllustrationMedia.ts', import.meta.url), 'utf8');
const exerciseMedia = readFileSync(new URL('../src/lib/exerciseMedia.ts', import.meta.url), 'utf8');
const view = readFileSync(new URL('../src/components/ExerciseVisual.tsx', import.meta.url), 'utf8');
const spritePath = new URL('../public/exercise-guide/chest/sprite.webp', import.meta.url);

test('40 quadros de peito correspondem a 40 IDs únicos do catálogo', () => {
  const src = media.match(/export const CHEST_GUIDE_IDS = \[([\s\S]*?)\] as const;/)?.[1];
  assert.ok(src, 'lista de IDs não encontrada');
  const ids = [...src.matchAll(/"(ex-[a-z0-9-]+)"/g)].map(m => m[1]);
  assert.equal(ids.length, 40);
  assert.equal(new Set(ids).size, 40);
  assert.equal(ids[0], 'ex-supino-reto-barra');
  assert.equal(ids[39], 'ex-new-flexaocomresistenciaelastica');
});

test('atlas binário WebP instalado no deploy e usado pela UI', () => {
  assert.ok(statSync(spritePath).size > 50000, 'WebP ausente ou muito pequeno');
  const bytes = readFileSync(spritePath);
  assert.equal(bytes.toString('ascii',0,4),'RIFF');
  assert.equal(bytes.toString('ascii',8,12),'WEBP');
  assert.ok(media.includes("const SPRITE_PATH = '/exercise-guide/chest/sprite.webp'"));
  assert.ok(exerciseMedia.includes('spriteIndex: chestIllustration.index'));
  assert.ok(view.includes("backgroundSize: '500% 800%'"));
});
