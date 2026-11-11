import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read = (p) => readFileSync(new URL('../'+p,import.meta.url),'utf8');
const catalogFiles = ['src/lib/exercises.ts','src/lib/extraExercises.ts'];
const illustrationFiles = [
  'src/lib/userProvidedIllustrationMedia.ts',
  'src/lib/supplementIllustrationMedia.ts','src/lib/conditioningIllustrationMedia.ts',
  'src/lib/tricepsIllustrationMedia.ts','src/lib/bicepsIllustrationMedia.ts',
  'src/lib/chestIllustrationMedia.ts','src/lib/backShoulderIllustrationMedia.ts',
  'src/lib/lowerBodyIllustrationMedia.ts','src/lib/abdomenIllustrationMedia.ts',
];
const photoFiles = [
  'src/lib/exerciseMedia.ts','src/lib/exerciseMediaExpansion.ts',
  'src/lib/exerciseMediaNovember.ts','src/lib/exerciseMediaRoundTwo.ts',
  'src/lib/lowerBodyPhotoMedia.ts','src/lib/hyroxMedia.ts',
];
const catalog = catalogFiles.flatMap(path => [...read(path).matchAll(/\{\s*id:\s*'(ex-[^']+)',\s*name:\s*'([^']+)',\s*muscleGroup:\s*'([^']+)'/g)]
  .map(m=>({id:m[1],name:m[2]})));
const illustrated = new Set(illustrationFiles.flatMap(path => [...read(path).matchAll(/['"](ex-[a-z0-9-]+)['"]/g)].map(m=>m[1])));
const photographs = new Set(photoFiles.flatMap(path => [...read(path).matchAll(/['"](ex-[a-z0-9-]+)['"]\s*:/g)].map(m=>m[1])));
const currentPhotos = catalog.filter(item=>!illustrated.has(item.id) && photographs.has(item.id));
const expectedPhotos = [];

test('catalog has unique exercise IDs with a media mapping for each',()=>{
  assert.equal(catalog.length,329);
  assert.equal(new Set(catalog.map(item=>item.id)).size,catalog.length);
  for(const item of catalog)assert.ok(illustrated.has(item.id)||photographs.has(item.id),item.id+' has no media');
});

test('all 329 catalog exercises now have an illustrated guide mapping',()=>{
  assert.deepEqual(currentPhotos.map(item=>item.id).sort(),expectedPhotos.slice().sort());
  assert.equal(catalog.filter(item=>illustrated.has(item.id)).length,329);
});

test('personal program label is clean and ID remains stable',()=>{
  const programs=read('src/lib/readyPrograms.ts');
  const page=read('src/pages/ProgramLibrary.tsx');
  assert.match(programs,/PERSONAL_UPPER_HYROX_PROGRAM_ID = 'upper-hyrox-lower-personal-5dias'/);
  assert.match(programs,/title: 'Upper \/ HYROX \/ Lower · 5 dias'/);
  assert.doesNotMatch(programs,/title: 'Meu plano · Upper/);
  assert.match(page,/label:'Upper \/ HYROX \/ Lower'/);
});
