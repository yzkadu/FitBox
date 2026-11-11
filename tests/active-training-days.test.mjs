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
