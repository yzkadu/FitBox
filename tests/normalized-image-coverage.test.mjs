import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync,readFileSync} from 'node:fs';
import {join} from 'node:path';

const read = path => readFileSync(new URL('../'+path,import.meta.url),'utf8');
const manifestPaths = [
 ['chest','src/lib/chestIllustrationMedia.ts','CHEST_GUIDE_IDS',8],
 ['back','src/lib/backShoulderIllustrationMedia.ts','BACK_GUIDE_IDS',8],
 ['shoulders','src/lib/backShoulderIllustrationMedia.ts','SHOULDER_GUIDE_IDS',7],
 ['biceps','src/lib/bicepsIllustrationMedia.ts','BICEPS_GUIDE_IDS',6],
 ['triceps','src/lib/tricepsIllustrationMedia.ts','TRICEPS_GUIDE_IDS',5],
 ['legs','src/lib/lowerBodyIllustrationMedia.ts','LEG_GUIDE_IDS',6],
 ['glutes','src/lib/lowerBodyIllustrationMedia.ts','GLUTE_GUIDE_IDS',3],
 ['calves','src/lib/lowerBodyIllustrationMedia.ts','CALF_GUIDE_IDS',1],
 ['abdomen','src/lib/abdomenIllustrationMedia.ts','ABDOMEN_GUIDE_IDS',7],
 ['conditioning','src/lib/conditioningIllustrationMedia.ts','CONDITIONING_GUIDE_IDS',10],
 ['supplement-22','src/lib/supplementIllustrationMedia.ts','SUPPLEMENT_22_GUIDE_IDS',5],
];
const find=(path,name)=>{
 const match=read(path).match(new RegExp('export const '+name+'\\s*=\\s*\\[([\\s\\S]*?)\\]\\s*as const'));
 assert.ok(match,name+' has no declared list');
 return [...match[1].matchAll(/['"](ex-[a-z0-9-]+)['"]/g)].map(m=>m[1]);
};

test('all 319 unique atlas IDs have a verified individual WebP without text-card format',()=>{
 const seen=new Set();
 for(const [group,path,name,rows] of manifestPaths){
   const ids=find(path,name);
   assert.ok(ids.length<=rows*5,name+' overflows source atlas');
   for(const id of ids){
     if(seen.has(id))continue; // first atlas mapping wins
     seen.add(id);
     const assetPath='public/exercise-guide/clean/'+group+'/'+id+'.webp';
     const url=new URL('../'+assetPath,import.meta.url);
     assert.ok(existsSync(url),'Missing '+assetPath);
     const bytes=readFileSync(url);
     assert.ok(bytes.length>1000,'Suspiciously tiny '+assetPath);
     assert.equal(bytes.toString('ascii',0,4),'RIFF',assetPath);
     assert.equal(bytes.toString('ascii',8,12),'WEBP',assetPath);
   }
 }
 assert.equal(seen.size,319);
});

test('the complete catalog contains 331 IDs and no image path is reused by unrelated IDs',()=>{
 const catalog=[...['src/lib/exercises.ts','src/lib/extraExercises.ts'].flatMap(p=>[...read(p).matchAll(/\bid:\s*'(ex-[a-z0-9-]+)'/g)].map(m=>m[1]))];
 assert.equal(catalog.length,331);
 assert.equal(new Set(catalog).size,catalog.length);
 const atlas=new Set(manifestPaths.flatMap(([,path,name])=>find(path,name)));
 const singles=[...read('src/lib/userProvidedIllustrationMedia.ts').matchAll(/'(ex-[a-z0-9-]+)':/g)].map(m=>m[1]);
 const alias='ex-fedb-freehand-jump-squat';
 const mapped=new Set([...atlas,...singles,alias]);
 assert.equal(mapped.size,331);
 assert.deepEqual([...mapped].sort(),[...catalog].sort());
 const source=read('src/lib/normalizedIllustrationMedia.ts');
 assert.match(source,/if \(!pathByExercise\.has\(id\)\)/);
 assert.match(source,/map\.set|pathByExercise\.set/);
 assert.match(source,/getNormalizedIllustration/);
});

test('image selection preserves 11 individually corrected drawings before generated assets',()=>{
 const resolver=read('src/lib/exerciseMedia.ts');
 const indexUser=resolver.indexOf('getUserProvidedIllustration(exerciseId)');
 const indexNormalized=resolver.indexOf('getNormalizedIllustration(exerciseId)');
 const indexLegacy=resolver.indexOf('getSupplementIllustration(exerciseId)');
 assert.ok(indexUser>=0 && indexUser<indexNormalized && indexNormalized<indexLegacy);
 assert.match(resolver,/standaloneCard: true/);
});

test('conditioning duplicate IDs point to the FIRST validated cell, never overwritten later',()=>{
 const src=read('src/lib/conditioningIllustrationMedia.ts');
 assert.match(src,/if \(!indexById\.has\(id\)\) indexById\.set\(id,index\)/);
 const ids=find('src/lib/conditioningIllustrationMedia.ts','CONDITIONING_GUIDE_IDS');
 assert.deepEqual(ids.flatMap((id,i)=>id==='ex-new-shuttlerun'?[i]:[]),[26,46]);
 assert.deepEqual(ids.flatMap((id,i)=>id==='ex-new-subidadeescadas'?[i]:[]),[32,47]);
});
