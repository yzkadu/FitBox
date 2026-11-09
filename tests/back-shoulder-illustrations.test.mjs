import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,statSync} from 'node:fs';

const read=path=>readFileSync(new URL('../'+path,import.meta.url));
const source=read('src/lib/backShoulderIllustrationMedia.ts').toString('utf8');
const catalog=(read('src/lib/exercises.ts').toString('utf8')+'\n'+read('src/lib/extraExercises.ts').toString('utf8'));
const back=source.match(/export const BACK_GUIDE_IDS = (\[[\s\S]*?\]) as const;/);
const shoulders=source.match(/export const SHOULDER_GUIDE_IDS = (\[[\s\S]*?\]) as const;/);
assert.ok(back && shoulders);
const backIds=JSON.parse(back[1]);
const shoulderIds=JSON.parse(shoulders[1]);

test('74 ilustrações recebem IDs sem duplicação e existentes no FitBox',()=>{
  assert.equal(backIds.length,40);
  assert.equal(shoulderIds.length,34);
  const ids=[...backIds,...shoulderIds];
  assert.equal(new Set(ids).size,74);
  for(const id of ids) assert.ok(catalog.includes("id: '"+id+"'"),'ID ausente: '+id);
});

test('ambos os sprites WebP estão instalados em Git, com dimensões compatíveis',()=>{
  for(const [group,expectedRows] of [['back',8],['shoulders',7]]){
    const file='public/exercise-guide/'+group+'/sprite.webp';
    const binary=read(file);
    assert.ok(statSync(new URL('../'+file,import.meta.url)).size>10000,file+' vazio');
    assert.equal(binary.toString('ascii',0,4),'RIFF');
    assert.equal(binary.toString('ascii',8,12),'WEBP');
    assert.ok(source.includes('rows:'+expectedRows), 'linhas do sprite divergentes');
  }
});
test('o renderizador usa a ordem e altura do sprite por grupo',()=>{
  const media=read('src/lib/exerciseMedia.ts').toString('utf8');
  const visual=read('src/components/ExerciseVisual.tsx').toString('utf8');
  assert.ok(media.includes('getBackShoulderIllustration(exerciseId)'));
  assert.ok(media.includes('spriteRows: backShoulderIllustration.rows'));
  assert.ok(visual.includes('spriteRows={images.spriteRows}'));
  assert.ok(visual.includes('backgroundSize: `500% ${spriteRows * 100}%`'));
});
