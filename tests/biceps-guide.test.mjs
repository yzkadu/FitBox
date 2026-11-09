import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = path => readFileSync(new URL('../'+path,import.meta.url),'utf8');
const binary = path => readFileSync(new URL('../'+path,import.meta.url));

test('guia de bíceps contém 28 imagens vinculadas sem duplicações',()=>{
  const guide=source('src/lib/bicepsIllustrationMedia.ts');
  const match=guide.match(/export const BICEPS_GUIDE_IDS = (\\[[\\s\\S]*?\\]) as const;/);
  assert.ok(match,'lista de imagens de bíceps ausente');
  const ids=JSON.parse(match[1]);
  assert.equal(ids.length,28);
  assert.equal(new Set(ids).size,28);
  const catalog=source('src/lib/exercises.ts')+source('src/lib/extraExercises.ts');
  for(const id of ids) assert.ok(catalog.includes("id: '"+id+"'"),'exercício não cadastrado: '+id);
  assert.ok(source('src/lib/exerciseMedia.ts').includes('getBicepsIllustration(exerciseId)'));
  assert.ok(guide.includes('rows:6'));
});

test('atlas de bíceps é WebP real com 5 colunas e 6 linhas',()=>{
  const atlas=binary('public/exercise-guide/biceps/sprite.webp');
  assert.ok(atlas.length>30_000,'arquivo ilustrado ausente ou vazio');
  assert.equal(atlas.toString('ascii',0,4),'RIFF');
  assert.equal(atlas.toString('ascii',8,12),'WEBP');
  const frame=atlas.indexOf(Buffer.from([0x9d,0x01,0x2a]));
  assert.ok(frame>0,'quadro VP8 inválido');
  const width=atlas.readUInt16LE(frame+3)&0x3fff;
  const height=atlas.readUInt16LE(frame+5)&0x3fff;
  assert.equal(width,1600);
  assert.equal(height,1950);
});
