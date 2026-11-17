import test from 'node:test';
import assert from 'node:assert/strict';
import ts from 'typescript';
import {readFileSync} from 'node:fs';

process.env.TZ='America/Sao_Paulo';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const asModule=async (path,rewrite=(s)=>s)=>{
  const source=ts.transpileModule(read(path),{
    compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022},
  }).outputText;
  const js=rewrite(source);
  assert.doesNotMatch(js,/from ['"]\.\.\/types['"]/,'Unresolved import in '+path);
  return import('data:text/javascript;base64,'+Buffer.from(js).toString('base64'));
};
const plan=await asModule('src/lib/nextTraining.ts',s=>s.replace(
  /import\s*\{\s*WEEKDAY_ORDER\s*\}\s*from\s*['"]\.\.\/types['"];?/,
  "const WEEKDAY_ORDER=['seg','ter','qua','qui','sex','sab','dom'];"
));
const history=await asModule('src/lib/sessionHistory.ts');
const stats=await asModule('src/lib/stats.ts');
const date=new Date('2026-11-17T13:00:00-03:00');
const upper={id:'upper-biceps',name:'Upper body — bíceps',exercises:[],archived:false};
const tue={id:'hyrox-tue',name:'HYROX · Aula livre (terça)',exercises:[],archived:false};
const wed={id:'lower-wed',name:'Lower body e abdômen',exercises:[],archived:false};
const workouts=[upper,tue,wed];
const schedule={
  seg:{kind:'treino',workoutId:upper.id},
  ter:{kind:'treino',workoutId:tue.id},
  qua:{kind:'treino',workoutId:wed.id},
  sab:{kind:'descanso'},dom:{kind:'descanso'},
};
const hyrox={id:'quick-1',kind:'hyrox',date:'2026-11-17',durationMin:52,caloriesKcal:520};
const session={id:'session-1',workoutId:upper.id,workoutName:upper.name,
 startedAt:'2026-11-16T17:00:00-03:00',finishedAt:'2026-11-16T18:00:00-03:00',
 exercises:[],durationSeconds:3600};

test('HYROX logged quickly automatically concludes scheduled Tuesday class',()=>{
 const options=plan.getActivitiesForDay(schedule.ter);
 assert.equal(options.length,1);
 assert.equal(plan.isScheduledActivityDone(options[0],[],[],date,[hyrox],workouts),true);
 assert.equal(plan.hasCompletedScheduledActivityToday(schedule.ter,[],[],date,[hyrox],workouts),true);
 assert.deepEqual(plan.findNextScheduledTraining(schedule,workouts,date),
   {kind:'treino',weekday:'qua',daysUntil:1,workout:wed});
});

test('existing quick HYROX links automatically even when no workout name was saved',()=>{
 assert.equal(plan.isScheduledActivityDone({kind:'treino',workoutId:tue.id},[],[],date,
   [{...hyrox,label:undefined}],workouts),true);
});

test('quick HYROX works when schedule uses a labelled cardio activity',()=>{
 const scheduled={kind:'cardio',label:'Aula de HYROX'};
 assert.equal(plan.isScheduledActivityDone(scheduled,[],[],date,[hyrox],workouts),true);
 assert.equal(plan.isScheduledActivityDone(scheduled,[],[{date:'2026-11-17',type:'corrida',durationMin:40}],date,[],workouts),false);
});

test('generic cardio does not fulfil a specific HYROX workout or upper workout',()=>{
 const cardio={...hyrox,id:'quick-cardio',kind:'cardio',label:undefined};
 const upperGeneric={...hyrox,id:'quick-upper',kind:'musculacao',label:undefined};
 assert.equal(plan.isScheduledActivityDone({kind:'treino',workoutId:tue.id},[],[],date,[cardio],workouts),false);
 assert.equal(plan.isScheduledActivityDone({kind:'treino',workoutId:upper.id},[],[],date,[upperGeneric],workouts),false);
 assert.equal(plan.hasCompletedScheduledActivityToday(schedule.ter,[],[],date,[upperGeneric],workouts),false);
});

test('explicitly linking a quick strength entry to planned upper counts but other upper does not',()=>{
 const log={...hyrox,kind:'musculacao',label:upper.name};
 const wrong={...log,label:'Lower body e abdômen'};
 assert.equal(plan.isScheduledActivityDone({kind:'treino',workoutId:upper.id},[],[],
   new Date('2026-11-17T13:00:00-03:00'),[log],workouts),true);
 assert.equal(plan.isScheduledActivityDone({kind:'treino',workoutId:upper.id},[],[],
   new Date('2026-11-17T13:00:00-03:00'),[wrong],workouts),false);
});

test('quick entry with wrong day, invalid duration, or deleted entry does not mark completed',()=>{
 const activity={kind:'treino',workoutId:tue.id};
 assert.equal(plan.isScheduledActivityDone(activity,[],[],date,[{...hyrox,date:'2026-11-16'}],workouts),false);
 assert.equal(plan.isScheduledActivityDone(activity,[],[],date,[{...hyrox,durationMin:0}],workouts),false);
 assert.equal(plan.isScheduledActivityDone(activity,[],[],date,[],workouts),false);
});

test('combination of two independent planned activities only completes when both are done',()=>{
 const combined={kind:'multi',activities:[
   {kind:'treino',workoutId:upper.id},{kind:'cardio',label:'Aula HYROX'},
 ]};
 assert.equal(plan.hasCompletedScheduledActivityToday(combined,[],[],date,[hyrox],workouts),false);
 const strength={...hyrox,id:'linked-upper',kind:'musculacao',label:upper.name};
 assert.equal(plan.hasCompletedScheduledActivityToday(combined,[],[],date,[hyrox,strength],workouts),true);
});

test('sessions timeline includes quick HYROX with kcal alongside real strength, not a fake extra session',()=>{
 const list=history.getSessionHistory([session],[hyrox]);
 assert.equal(list.length,2);
 assert.deepEqual(list.map(x=>x.kind),['activity','session']);
 assert.equal(list[0].activity.durationMin,52);
 assert.equal(list[0].activity.caloriesKcal,520);
 assert.equal(history.quickActivityName(hyrox),'HYROX');
 assert.equal(history.getSessionHistory([session],[]).length,1);
 assert.equal(history.getSessionHistory([],[]).length,0);
});

test('foguinho counts hybrid activity date only once even when cardio and strength coexist',()=>{
 const other={...session,finishedAt:'2026-11-17T18:00:00-03:00'};
 assert.deepEqual([...stats.getActiveTrainingDays([other],[{date:'2026-11-17',type:'corrida',durationMin:15}],[hyrox])],['2026-11-17']);
});

test('user interface reconciles program and sessions when quick log is saved',()=>{
 const home=read('src/pages/Home.tsx');
 const page=read('src/pages/History.tsx');
 const quick=read('src/pages/Activities.tsx');
 assert.match(home,/hasCompletedScheduledActivityToday\(todaySchedule, sessions, cardioLogs, new Date\(\), activityLogs, workouts\)/);
 assert.match(home,/isScheduledActivityDone\(activity, sessions, cardioLogs, new Date\(\), activityLogs, workouts\)/);
 assert.match(page,/timeline\.map/);
 assert.match(page,/Sessões/);
 assert.match(page,/quickActivityName\(a\)/);
 assert.match(page,/a\.caloriesKcal/);
 assert.match(quick,/linkedWorkoutId/);
 assert.match(quick,/Ver próximo treino/);
});
