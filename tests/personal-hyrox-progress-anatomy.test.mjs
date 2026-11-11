import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const programs=read('src/lib/readyPrograms.ts');
const editor=read('src/pages/WorkoutEditor.tsx');
const library=read('src/pages/ProgramLibrary.tsx');
const guided=read('src/pages/GuidedBuilder.tsx');
const progress=read('src/pages/Progress.tsx');
const measurements=read('src/pages/BodyStats.tsx');
const visual=read('src/components/ExerciseVisual.tsx');
const anatomy=read('src/data/anatomy330.json');
const catalog=new Set([read('src/lib/exercises.ts'),read('src/lib/extraExercises.ts')]
  .flatMap(src=>[...src.matchAll(/\bid:\s*'(ex-[^']+)'/g)].map(m=>m[1])));
const plan=programs.slice(programs.indexOf('const PERSONAL_UPPER_HYROX_PROGRAM:'),
  programs.indexOf('export const READY_PROGRAMS:'));

test('personal plan preserves three strength days and two independent empty HYROX lessons',()=>{
  assert.match(programs,/PERSONAL_UPPER_HYROX_PROGRAM_ID = 'upper-hyrox-lower-personal-5dias'/);
  assert.match(plan,/id: PERSONAL_UPPER_HYROX_PROGRAM_ID/);
  assert.match(plan,/Upper A · Peito, ombros e costas/);
  assert.match(plan,/Lower \+ abdômen · Completo/);
  assert.match(plan,/Upper B · Ênfase em bíceps e tríceps/);
  assert.match(plan,/HYROX · Aula livre \(terça\)[\s\S]*?exercises: \[\]/);
  assert.match(plan,/HYROX · Aula livre \(quinta\)[\s\S]*?exercises: \[\]/);
  assert.match(plan,/workoutDay\(0\),workoutDay\(1\),workoutDay\(2\),workoutDay\(3\),workoutDay\(4\),off,off/);
  const ids=[...plan.matchAll(/ex\('(ex-[^']+)'/g)].map(m=>m[1]);
  assert.equal(ids.length,28);
  for(const id of ids)assert.ok(catalog.has(id),'Missing exercise ID '+id);
});
test('the variable HYROX program does not impose race stations on classroom sessions',()=>{
  assert.match(programs,/id: 'hyrox-aula-funcional-livre'[\s\S]*?exercises:\[\]/);
  assert.match(editor,/Aula HYROX livre: não há exercícios obrigatórios/);
  assert.match(editor,/Adicione as estações que o professor passou/);
});
test('suggestions are reduced on entry while retaining expanded filters and full catalog',()=>{
  assert.match(library,/filtered\.slice\(0,5\)/);
  assert.match(library,/showAllPrograms/);
  assert.match(library,/PERSONAL_UPPER_HYROX_PROGRAM_ID/);
  assert.match(guided,/filteredCandidates\.slice\(0,3\)/);
  assert.match(guided,/<details/);
});
test('weight change target UI is hidden while evolution and measurement history remain',()=>{
  assert.doesNotMatch(progress,/WeightGoalCard|setWeightGoal|targetLossKg/);
  assert.match(progress,/Resumo das anotações/);
  assert.match(progress,/Últimas anotações corporais/);
  assert.match(progress,/Frequência de treino/);
  assert.match(measurements,/Médias das anotações/);
  assert.match(measurements,/Anotações \(opcional\)/);
  assert.match(measurements,/Fotos de evolução/);
  assert.match(read('src/types/index.ts'),/interface WeightGoal/);
});
test('exercise guide exposes anatomy beyond a single group, including pressing secondary muscles',()=>{
  assert.match(visual,/getExerciseAnatomicalProfile/);
  assert.match(visual,/anatomicalProfile\.secondaryMuscles/);
  assert.match(visual,/anatomicalProfile\.stabilizers/);
  const rows=JSON.parse(anatomy).exercicios;
  const bench=rows.find(row=>row.id==='ex-supino-maquina');
  assert.ok(bench);
  assert.match(bench.musculos_principais,/Peitoral maior/i);
  assert.match(bench.musculos_secundarios,/Tríceps braquial/i);
  assert.match(bench.musculos_secundarios,/deltoide anterior/i);
});
