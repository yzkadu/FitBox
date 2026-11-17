import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';

// Executa a lógica real do arquivo TypeScript, sem copiar o algoritmo para o teste.
process.env.TZ = 'America/Sao_Paulo';
const source = readFileSync(new URL('../src/lib/stats.ts', import.meta.url), 'utf8');
const output = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
}).outputText;
const stats = await import('data:text/javascript;base64,' + Buffer.from(output).toString('base64'));
const completed = finishedAt => ({ id: finishedAt, finishedAt, startedAt: finishedAt, durationSeconds: 600, exercises: [] });
const cardio = (date, durationMin = 20) => ({ id: date + durationMin, date, durationMin, type: 'corrida' });
const localDay = date => [date.getFullYear(),String(date.getMonth()+1).padStart(2,'0'),String(date.getDate()).padStart(2,'0')].join('-');
const ref = new Date('2026-11-11T12:00:00-03:00');
const at = day => new Date(day + 'T15:00:00-03:00').toISOString();

test('apenas cardio mantém o foguinho aceso', () => {
  assert.equal(stats.getCurrentStreakDays([], [cardio('2026-11-11')], undefined, ref), 1);
});
test('apenas musculação concluída mantém o foguinho aceso', () => {
  assert.equal(stats.getCurrentStreakDays([completed(at('2026-11-11'))], [], undefined, ref), 1);
});
test('cardio e musculação no mesmo dia contam uma única vez', () => {
  const days = stats.getActiveTrainingDays(
    [completed(at('2026-11-11')),completed(at('2026-11-11'))],
    [cardio('2026-11-11'),cardio('2026-11-11', 35)],
  );
  assert.deepEqual([...days], ['2026-11-11']);
  assert.equal(stats.getCurrentStreakDays([completed(at('2026-11-11'))], [cardio('2026-11-11')], undefined, ref), 1);
});
test('sequência mista de cardio, força e HYROX não depende da modalidade', () => {
  const sessions = [completed(at('2026-11-10')),completed(at('2026-11-11'))];
  assert.equal(stats.getCurrentStreakDays(sessions,[cardio('2026-11-09'),cardio('2026-11-11')],undefined,ref),3);
});
test('hoje ainda não treinado não apaga sequência encerrada ontem', () => {
  assert.equal(stats.getCurrentStreakDays([], [cardio('2026-11-10')],undefined,ref),1);
});
test('não registrar atividade em dia anterior interrompe a sequência', () => {
  assert.equal(stats.getCurrentStreakDays([], [cardio('2026-11-09')],undefined,ref),0);
  assert.equal(stats.getCurrentStreakDays([], [cardio('2026-11-09'),cardio('2026-11-11')],undefined,ref),1);
});
test('dia de descanso sem registro não cria dia ativo fictício', () => {
  const schedule={terca:{kind:'descanso'}};
  assert.equal(stats.getCurrentStreakDays([], [cardio('2026-11-09')],schedule,ref),0);
});
test('meia-noite UTC usa calendário local do Brasil', () => {
  assert.deepEqual([...stats.getActiveTrainingDays([completed('2026-11-11T01:30:00Z')], [])], ['2026-11-10']);
});
test('sessões abertas ou registros de cardio com duração inválida não pontuam', () => {
  assert.equal(stats.getActiveTrainingDays([{finishedAt:null}], [cardio('2026-11-11',0)]).size, 0);
});
test('frequência semanal conta dias distintos, não número de treinos', () => {
  const now=new Date();
  const date=localDay(now);
  const sessions=[completed(now.toISOString()),completed(now.toISOString())];
  assert.equal(stats.getWeeklyFrequency(sessions,[cardio(date)],1)[0].count, 1);
  assert.equal(stats.getTrainingDaysThisWeek(sessions,[cardio(date)]),1);
  assert.equal(stats.getTrainingDaysThisMonth(sessions,[cardio(date)]),1);
});
test('tempo da semana soma cardio à musculação', () => {
  const now=new Date();
  assert.equal(stats.getTrainingMinutesThisWeek([completed(now.toISOString())],[cardio(localDay(now))]),30);
});


const weekdaysRoutine = {
  seg: {kind:'treino',workoutId:'upper-costas'},
  ter: {kind:'multi',activities:[{kind:'treino',workoutId:'hyrox'},{kind:'cardio',label:'HYROX'}]},
  qua: {kind:'treino',workoutId:'lower'},
  qui: {kind:'cardio',label:'HYROX'},
  sex: {kind:'treino',workoutId:'upper-biceps'},
  sab: {kind:'descanso'},
  dom: {kind:'descanso'},
};
const quick = (date,kind='hyrox') => ({id:date, date, kind, durationMin:50});

test('sexta + segunda + terça formam sequência de 3 treinos, sem quebrar no descanso do fim de semana',()=>{
  const sessions=[completed(at('2026-11-13')),completed(at('2026-11-16'))];
  assert.equal(stats.getCurrentStreakDays(sessions,[],weekdaysRoutine,new Date('2026-11-17T13:00:00-03:00'),[quick('2026-11-17')]),3);
});

test('HYROX de quinta + upper sexta + upper segunda + HYROX terça resultam em 4 dias ativos na sequência',()=>{
  const sessions=[completed(at('2026-11-13')),completed(at('2026-11-16'))];
  const logs=[quick('2026-11-12'),quick('2026-11-17')];
  assert.equal(stats.getCurrentStreakDays(sessions,[],weekdaysRoutine,new Date('2026-11-17T13:00:00-03:00'),logs),4);
});

test('treino previsto para hoje ainda em aberto não perde sequência anterior',()=>{
  const sessions=[completed(at('2026-11-13')),completed(at('2026-11-16'))];
  assert.equal(stats.getCurrentStreakDays(sessions,[],weekdaysRoutine,new Date('2026-11-17T09:00:00-03:00')),2);
});

test('faltar a um treino previsto passado quebra a sequência mesmo após descanso',()=>{
  const sessions=[completed(at('2026-11-13'))];
  assert.equal(stats.getCurrentStreakDays(sessions,[],weekdaysRoutine,new Date('2026-11-17T09:00:00-03:00')),0);
  assert.equal(stats.getCurrentStreakDays(sessions,[],weekdaysRoutine,new Date('2026-11-17T17:00:00-03:00'),[quick('2026-11-17')]),1);
});

test('descanso não soma dias fictícios e treino previsto no sábado não pode ser pulado',()=>{
  const sessions=[completed(at('2026-11-13')),completed(at('2026-11-16'))];
  const ref=new Date('2026-11-17T13:00:00-03:00');
  assert.equal(stats.getCurrentStreakDays(sessions,[],weekdaysRoutine,ref,[quick('2026-11-17')]),3);
  const saturdayTraining={...weekdaysRoutine,sab:{kind:'treino',workoutId:'lower'}};
  assert.equal(stats.getCurrentStreakDays(sessions,[],saturdayTraining,ref,[quick('2026-11-17')]),2);
});

test('atividade extra no descanso conta uma vez, mas não mascara ausência em dia planejado',()=>{
  const ref=new Date('2026-11-17T13:00:00-03:00');
  const sessions=[completed(at('2026-11-13')),completed(at('2026-11-16'))];
  const extras=[quick('2026-11-14','caminhada'),quick('2026-11-17')];
  assert.equal(stats.getCurrentStreakDays(sessions,[],weekdaysRoutine,ref,extras),4);
  assert.equal(stats.getActiveTrainingDays(sessions,[cardio('2026-11-14')],extras).size,4);
});

test('agenda vazia conserva regra antiga de dias corridos, sem supor descanso no fim de semana',()=>{
  const sessions=[completed(at('2026-11-13')),completed(at('2026-11-16'))];
  const ref=new Date('2026-11-17T13:00:00-03:00');
  assert.equal(stats.hasPlannedTrainingDays({}),false);
  assert.equal(stats.hasPlannedTrainingDays({sab:{kind:'descanso'},dom:{kind:'descanso'}}),false);
  assert.equal(stats.hasPlannedTrainingDays(weekdaysRoutine),true);
  assert.equal(stats.getCurrentStreakDays(sessions,[],{},ref,[quick('2026-11-17')]),2);
});

test('programação multi vazia equivale a descanso e dia multi com cardio aceita HYROX rápido',()=>{
  const schedule={seg:{kind:'multi',activities:[]},ter:{kind:'multi',activities:[{kind:'cardio',label:'HYROX'}]},qua:{kind:'descanso'}};
  assert.equal(stats.getCurrentStreakDays([],[],schedule,new Date('2026-11-17T20:00:00-03:00'),[quick('2026-11-17')]),1);
  assert.equal(stats.hasPlannedTrainingDays(schedule),true);
});

test('abrir/check-in de sessão sem concluir não conta como treino cumprido',()=>{
  const ref=new Date('2026-11-17T13:00:00-03:00');
  const unclosed={startedAt:at('2026-11-16'),finishedAt:null,exercises:[]};
  assert.equal(stats.getCurrentStreakDays([unclosed],[],weekdaysRoutine,ref,[quick('2026-11-17')]),1);
});
