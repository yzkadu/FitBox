import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const path = new URL('../src/data/anatomy330.json',import.meta.url);
const data=JSON.parse(readFileSync(path,'utf8'));
const sources=['../src/lib/exercises.ts','../src/lib/extraExercises.ts'];
const catalogIds=sources.flatMap(file=>{
  const text=readFileSync(new URL(file,import.meta.url),'utf8');
  return [...text.matchAll(/\bid:\s*'([^']+)'/g)].map(match=>match[1]);
});
const profiles=new Map(data.exercicios.map(item=>[item.id,item]));

test('330 profiles match precisely the 330 stable exercise catalog IDs',()=>{
  assert.equal(data.total,330);
  assert.equal(data.exercicios.length,330);
  assert.equal(profiles.size,330);
  assert.equal(new Set(catalogIds).size,330);
  assert.deepEqual([...profiles.keys()].sort(),[...catalogIds].sort());
});

test('all profiles contain valid required anatomy fields',()=>{
  for(const p of data.exercicios){
    for(const field of ['id','exercicio','grupo_funcional','porcao_regiao_em_enfase',
      'musculos_principais','padrao_de_movimento','familia_biomecanica','modalidade']){
      assert.equal(typeof p[field],'string',p.id+' '+field);
      assert.ok(p[field].trim(),p.id+' '+field);
    }
    assert.equal(typeof p.series_hipertrofia,'boolean',p.id);
    assert.equal(typeof p.sugerir_automaticamente,'boolean',p.id);
    assert.ok(Array.isArray(p.tags_apoio),p.id+' tags_apoio');
  }
});

test('supino uses triceps and anterior deltoid secondarily, not biceps',()=>{
  const row=profiles.get('ex-supino-maquina');
  assert.ok(row.musculos_principais.toLowerCase().includes('peitoral'));
  assert.match(row.musculos_secundarios,/tríceps/i);
  assert.match(row.musculos_secundarios,/deltoide anterior/i);
  assert.doesNotMatch(row.musculos_secundarios,/bíceps/i);
});

test('families and regions distinguish the complementary chest/biceps exercise example',()=>{
  const ids=['ex-supino-inclinado-halter','ex-supino-maquina','ex-new-crossoveraltoparabaixo',
    'ex-new-roscabayesiannocabo','ex-rosca-scott','ex-rosca-martelo'];
  for(const id of ids)assert.ok(profiles.has(id),id);
  const chest=ids.slice(0,3).map(id=>profiles.get(id).porcao_regiao_em_enfase);
  assert.equal(new Set(chest).size,3,'three distinct relative chest emphases');
  assert.equal(new Set(ids.slice(0,3).map(id=>profiles.get(id).familia_biomecanica)).size,3);
});

test('manual catalog retains exercises excluded from automatic recommendations',()=>{
  const restricted=['ex-fedb-wide-grip-rear-pull-up','ex-fedb-jm-press',
    'ex-fedb-weighted-bench-dip','ex-new-tricepsbancocompeselevados'];
  for(const id of restricted)assert.equal(profiles.get(id)?.sugerir_automaticamente,false,id);
});

test('cardio, conditioning and mobility entries do not become hypertrophy sets',()=>{
  for(const profile of profiles.values()){
    if(['cardio','condicionamento','mobilidade','potência','funcional'].includes(profile.modalidade)) {
      assert.equal(profile.series_hipertrofia,false,profile.id);
    }
  }
});
