import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';

process.env.TZ='America/Sao_Paulo';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const source=read('src/lib/stats.ts');
const output=ts.transpileModule(source,{
  compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}
}).outputText;
const stats=await import('data:text/javascript;base64,'+Buffer.from(output).toString('base64'));
const quick=(date,kind='hyrox',durationMin=40)=>({id:date+kind,date,kind,durationMin,caloriesKcal:450});
const cardio=(date)=>({id:date,date,type:'corrida',durationMin:25});
const strength=(date)=>({id:date,finishedAt:date+'T16:00:00-03:00',startedAt:date+'T15:00:00-03:00',durationSeconds:3600,exercises:[]});

test('HYROX retroativo de ontem mantém foguinho, sem ficha de exercícios',()=>{
  const reference=new Date('2026-11-13T10:00:00-03:00');
  assert.equal(stats.getCurrentStreakDays([],[],undefined,reference,[quick('2026-11-12')]),1);
  assert.equal(stats.getCurrentStreakDays([],[],undefined,reference,[quick('2026-11-11')]),0);
});

test('HYROX + cardio + musculação no mesmo dia pontuam uma única vez',()=>{
  const logs=[quick('2026-11-13')];
  const days=stats.getActiveTrainingDays([strength('2026-11-13')],[cardio('2026-11-13')],logs);
  assert.deepEqual([...days],['2026-11-13']);
  assert.equal(stats.getCurrentStreakDays([strength('2026-11-13')],[cardio('2026-11-13')],undefined,new Date('2026-11-13T11:00:00-03:00'),logs),1);
});

test('atividade sem minutos não conta e não é adicionada a dias ativos',()=>{
  assert.equal(stats.getActiveTrainingDays([],[],[quick('2026-11-13','hyrox',0)]).size,0);
});

test('frequência, minutos e dias mensais incluem registro rápido',()=>{
  const now=new Date();
  const date=[now.getFullYear(),String(now.getMonth()+1).padStart(2,'0'),String(now.getDate()).padStart(2,'0')].join('-');
  const logs=[quick(date,'hyrox',50)];
  assert.equal(stats.getWeeklyFrequency([],[],1,logs)[0].count,1);
  assert.equal(stats.getTrainingDaysThisWeek([],[],logs),1);
  assert.equal(stats.getTrainingDaysThisMonth([],[],logs),1);
  assert.equal(stats.getTrainingMinutesThisWeek([],[],logs),50);
});

test('formulário, navegação, sincronização e RLS fazem parte do projeto',()=>{
  const activities=read('src/pages/Activities.tsx');
  const types=read('src/types/index.ts');
  const storage=read('src/lib/storage.ts');
  const actions=read('src/lib/actions.ts');
  const schema=read('docs/ACTIVITY_LOGS_SCHEMA_2026_11_13.sql');
  assert.match(activities,/Registrar ontem/);
  assert.match(activities,/Calorias gastas \(kcal\)/);
  assert.match(activities,/kind:'hyrox'/);
  assert.doesNotMatch(activities,/addExerciseToSession/);
  assert.match(types,/export interface ActivityLog/);
  assert.match(storage,/activityLogs: \(activityRes\.data \?\? \[\]\)\.map\(rowToActivity\)/);
  assert.match(actions,/await supabase\.from\('activity_logs'\)\.insert/);
  assert.match(schema,/enable row level security/);
  assert.match(schema,/auth\.uid\(\)/);
  assert.match(read('src/App.tsx'),/path="\/atividades"/);
  assert.match(read('src/pages/Home.tsx'),/Registrar atividade rápida/);
  assert.match(read('src/pages/Progress.tsx'),/getWeeklyFrequency\(sessions, cardioLogs, 10, activityLogs\)/);
});
