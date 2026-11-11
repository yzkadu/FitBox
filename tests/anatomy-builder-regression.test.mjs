import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const builder=readFileSync(new URL('../src/lib/guidedBuilder.ts',import.meta.url),'utf8');
const recommendations=readFileSync(new URL('../src/lib/programRecommendation.ts',import.meta.url),'utf8');

test('weekly anatomical coverage is committed only for actually selected primary workouts',()=>{
  assert.match(builder,/for\(const day of primary\.days\)\s*\{\s*if\(workouts\.length>=desired\)break;/);
  assert.match(builder,/if\(!candidate\.exercises\.length\)continue;\s*workouts\.push\(candidate\);\s*commitCoverage\(candidate\);/);
  assert.doesNotMatch(builder,/primary\.days\.map\(makeWorkout\)/);
});

test('secondary program candidates are read-only until approved and appended',()=>{
  assert.match(builder,/secondary\.days\s*\.map\(day=>previewWorkout\(day,weekRegions\)\)/);
  assert.match(builder,/workouts\.push\(\{\.\.\.candidate,title:candidate\.title\+' · segundo programa'\}\);\s*commitCoverage\(candidate\);/);
  assert.doesNotMatch(builder,/secondary\.days\.map\(makeWorkout\)/);
});

test('HYROX circuit order remains protected against anatomy-driven strength rearrangement',()=>{
  assert.match(builder,/if\(!prefs\.modes\.includes\('forca'\) \|\| prefs\.modes\.includes\('hyrox'\)\)return baseline;/);
  assert.match(recommendations,/const curatedPlan = getCuratedPlan\(input\);\s*if \(curatedPlan\) return curatedPlan;/);
});

test('old sessions and exercise IDs are not mutated by the anatomical planner',()=>{
  assert.doesNotMatch(builder,/store\.update\(/);
  assert.doesNotMatch(builder,/updateSet\(/);
  assert.doesNotMatch(recommendations,/store\.update\(/);
});
