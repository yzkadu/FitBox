import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const app=read('src/App.tsx');
const workouts=read('src/pages/Workouts.tsx');
const picker=read('src/components/ExercisePicker.tsx');
const editor=read('src/pages/WorkoutEditor.tsx');
const catalog=read('src/pages/ExerciseCatalog.tsx');

test('biblioteca é acessível pela aba de treinar sem modificar fichas',()=>{
  assert.match(app,/path="\/treinos\/catalogo" element=\{<ExerciseCatalog/);
  assert.match(workouts,/navigate\('\/treinos\/catalogo'\)/);
  assert.match(catalog,/exercises\.filter\(/);
  assert.match(catalog,/MUSCLE_GROUP_ORDER/);
  assert.match(catalog,/equipmentMatches\(/);
  assert.match(catalog,/ExerciseGuide exercise=\{ex\}/);
  assert.doesNotMatch(catalog,/removeExerciseFromWorkout|deleteWorkout|store\.update/);
});

test('criação manual leva à seleção e organiza recursos avançados de modo opcional',()=>{
  assert.match(workouts,/Próximo · escolher exercícios/);
  assert.match(editor,/2 · Escolha e organize os exercícios/);
  assert.match(editor,/multiSelect selectedExerciseIds/);
  assert.match(editor,/<details className="pl-7"/);
  assert.match(editor,/setWorkoutCircuit/);
  assert.match(editor,/handleStart/);
});

test('seletor compacto permite múltiplos exercícios e mantém opções para outras telas',()=>{
  assert.match(picker,/multiSelect = false/);
  assert.match(picker,/selectedExerciseIds = \[\]/);
  assert.match(picker,/onClick=\{onClose\}/);
  assert.match(picker,/setAdvancedOpen/);
  assert.match(picker,/Adicionar ao treino/);
  assert.match(picker,/addCustomExercise/);
});
