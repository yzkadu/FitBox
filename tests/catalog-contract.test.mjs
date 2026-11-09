import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const file = path => readFileSync(new URL('../' + path, import.meta.url),'utf8');
const exercises = file('src/lib/exercises.ts');
const extra = file('src/lib/extraExercises.ts');
const idPattern = /\bid:\s*'([^']+)',\s*name:\s*'(?:\\'|[^']+)+'/g;
const ids = [...exercises.matchAll(idPattern), ...extra.matchAll(idPattern)].map(x=>x[1]);

test('catálogo: IDs de exercício devem ser únicos e estáveis',()=>{
  assert.ok(ids.length > 300, 'catálogo inesperadamente pequeno');
  assert.equal(new Set(ids).size, ids.length, 'ID de exercício duplicado');
});

test('mídias: todos os vínculos explícitos apontam para exercícios existentes',()=>{
  const library = new Set(ids);
  const sources = [
    'src/lib/exerciseMedia.ts',
    'src/lib/exerciseMediaExpansion.ts',
    'src/lib/exerciseMediaNovember.ts',
    'src/lib/exerciseMediaRoundTwo.ts',
    'src/lib/hyroxMedia.ts',
  ];
  const mediaIds = new Set();
  for(const source of sources){
    const text = file(source);
    for(const match of text.matchAll(/'((?:ex-|[a-z]+-)[^']+)':\s*(?:'[^']+'|skierg|burpee|wallball|sandbag)/g)){
      mediaIds.add(match[1]);
    }
  }
  for(const id of mediaIds) assert.ok(library.has(id), 'mídia órfã: '+id);
  assert.ok(mediaIds.size >= 230, 'cobertura de mídia regrediu');
});

test('rotas essenciais continuam no aplicativo',()=>{
  const app = file('src/App.tsx');
  for(const route of ['/treinos','/montador','/programas','/historico','/evolucao','/nutricao','/cardio']){
    assert.ok(app.includes('path="'+route+'"') || app.includes("path='"+route+"'"),'rota ausente: '+route);
  }
});
