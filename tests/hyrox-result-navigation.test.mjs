import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const read=path=>readFileSync(new URL('../'+path, import.meta.url),'utf8');

test('HYROX circuit screen records total time and optional calories without rebuilding stations',()=>{
 const code=read('src/pages/WorkoutEditor.tsx');
 assert.match(code,/Resultado da aula HYROX/);
 assert.match(code,/Tempo total \(min\)/);
 assert.match(code,/Kcal gastas/);
 assert.match(code,/onSubmit=\{registerHyroxResult\}/);
 assert.match(code,/await addActivityLog\(/);
 assert.match(code,/kind: 'hyrox'/);
 assert.match(code,/durationMin: minutes, caloriesKcal: kcal/);
 assert.match(code,/activityLogs\.some/);
 assert.match(code,/sessions\.some/);
 assert.match(code,/setHyroxSuccess/);
 assert.match(code,/hyroxDate > localIsoDate\(new Date\(\)\)/);
 const panel=code.indexOf('<form onSubmit={registerHyroxResult}');
 const detailsEnd=code.indexOf('</details>');
 assert.ok(panel>detailsEnd,'The quick result must remain visible when advanced stations are closed');
});

test('desktop has standalone Atividades rápidas section on sidebar',()=>{
 const desktop=read('src/components/Sidebar.tsx');
 assert.match(desktop,/<NavLink to="\/atividades"/);
 assert.match(desktop,/>Registros</);
 assert.match(desktop,/Atividades rápidas/);
});

test('mobile Atividades rápidas is inside Explorar, not the Mais menu',()=>{
 const explore=read('src/pages/ProgramLibrary.tsx');
 const mobile=read('src/components/BottomNav.tsx');
 assert.match(explore,/className="lg:hidden/);
 assert.match(explore,/navigate\('\/atividades'\)/);
 assert.match(explore,/Atividades rápidas/);
 assert.doesNotMatch(mobile,/to: '\/atividades'/);
 assert.match(mobile,/label: 'Explorar'/);
});

test('same activity route is available and persists in the current Supabase logs',()=>{
 const app=read('src/App.tsx');
 const actions=read('src/lib/actions.ts');
 const stats=read('src/lib/stats.ts');
 assert.match(app,/path="\/atividades"/);
 assert.match(actions,/export async function addActivityLog/);
 assert.match(actions,/await supabase\.from\('activity_logs'\)\.insert/);
 assert.match(stats,/getActiveTrainingDays\(sessions, cardioLogs, activityLogs\)/);
});
