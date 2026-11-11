import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const file = path => readFileSync(new URL('../' + path, import.meta.url),'utf8');
const exercises = file('src/lib/exercises.ts');
const extra = file('src/lib/extraExercises.ts');
const idPattern = /\bid:\s*'([^']+)',\s*name:\s*'(?:\\'|[^']+)+'/g;
const ids = [...exercises.matchAll(idPattern), ...extra.matchAll(idPattern)].map(x=>x[1]);
const idsAll=ids;

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
  for(const route of ['/treinos','/montador','/programas','/historico','/evolucao','/cardio']){
    assert.ok(app.includes('path="'+route+'"') || app.includes("path='"+route+"'"),'rota ausente: '+route);
  }
});

test('nutrição fica fora da interface sem excluir os dados existentes',()=>{
  const files=[
    'src/App.tsx','src/components/BottomNav.tsx','src/components/Sidebar.tsx',
    'src/pages/Home.tsx','src/pages/Progress.tsx',
  ];
  for(const path of files){
    const content=file(path);
    assert.doesNotMatch(content,/NutritionQuickCard|<Nutrition\b|to=['"]\/nutricao['"]|path=['"]\/nutricao['"]/,
      path+' ainda expõe o módulo de nutrição na interface');
  }
  // Não removemos módulo, dados, histórico, tipos ou mecanismos de persistência.
  assert.match(file('src/pages/Nutrition.tsx'),/export function Nutrition\(/);
  assert.match(file('src/components/NutritionQuickCard.tsx'),/export function NutritionQuickCard\(/);
});

test('guia de peito: 40 imagens referenciam exercícios existentes sem duplicatas',()=>{
  const guide=file('src/lib/chestIllustrationMedia.ts');
  const array=guide.match(/export const CHEST_GUIDE_IDS = (\[[\s\S]*?\]) as const;/);
  assert.ok(array,'manifest de peito não encontrado');
  const ids=JSON.parse(array[1]);
  assert.equal(ids.length,40,'devem existir exatamente 40 painéis de peito');
  assert.equal(new Set(ids).size,40,'imagem de peito duplicada');
  for(const id of ids) assert.ok(new Set(idsAll).has(id),'ID de peito não cadastrado: '+id);
  assert.ok(guide.includes('SPRITE_PATH') && guide.includes('positions.get(exerciseId)'),
    'o atlas instalado não está ligado ao ID do exercício');
  assert.ok(file('src/lib/exerciseMedia.ts').includes('getChestIllustration(exerciseId)'),
    'o novo guia não está vinculado ao resolver de mídias');
});
