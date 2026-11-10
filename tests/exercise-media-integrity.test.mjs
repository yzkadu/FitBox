import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, statSync } from 'node:fs';
import { resolve } from 'node:path';

const root = process.cwd();
const read = path => readFileSync(resolve(root,path),'utf8');
const list = (source, name) => {
  const match = read(source).match(new RegExp('export const ' + name + '\\s*=\\s*\\[([\\s\\S]*?)\\]\\s*as const'));
  assert.ok(match, 'Lista não encontrada: ' + name + ' em ' + source);
  return [...match[1].matchAll(/['"](ex-[a-z0-9-]+)['"]/g)].map(m => m[1]);
};

const groups = [
  {file:'src/lib/chestIllustrationMedia.ts',name:'CHEST_GUIDE_IDS',path:'public/exercise-guide/chest/sprite.webp',rows:8},
  {file:'src/lib/backShoulderIllustrationMedia.ts',name:'BACK_GUIDE_IDS',path:'public/exercise-guide/back/sprite.webp',rows:8},
  {file:'src/lib/backShoulderIllustrationMedia.ts',name:'SHOULDER_GUIDE_IDS',path:'public/exercise-guide/shoulders/sprite.webp',rows:7},
  {file:'src/lib/bicepsIllustrationMedia.ts',name:'BICEPS_GUIDE_IDS',path:'public/exercise-guide/biceps/sprite.webp',rows:6},
  {file:'src/lib/tricepsIllustrationMedia.ts',name:'TRICEPS_GUIDE_IDS',path:'public/exercise-guide/triceps/sprite.webp',rows:5},
  {file:'src/lib/lowerBodyIllustrationMedia.ts',name:'LEG_GUIDE_IDS',path:'public/exercise-guide/legs/sprite.webp',rows:6},
  {file:'src/lib/lowerBodyIllustrationMedia.ts',name:'GLUTE_GUIDE_IDS',path:'public/exercise-guide/glutes/sprite.webp',rows:3},
  {file:'src/lib/lowerBodyIllustrationMedia.ts',name:'CALF_GUIDE_IDS',path:'public/exercise-guide/calves/sprite.webp',rows:1},
  {file:'src/lib/abdomenIllustrationMedia.ts',name:'ABDOMEN_GUIDE_IDS',path:'public/exercise-guide/abdomen/sprite.webp',rows:7},
  {file:'src/lib/conditioningIllustrationMedia.ts',name:'CONDITIONING_GUIDE_IDS',path:'public/exercise-guide/conditioning/sprite.webp',rows:10},
  {file:'src/lib/supplementIllustrationMedia.ts',name:'SUPPLEMENT_22_GUIDE_IDS',path:'src/assets/exercise-guide/supplement-22/sprite.webp',rows:5},
];

const catalog = [
  ...read('src/lib/exercises.ts').matchAll(/\bid:\s*['"](ex-[a-z0-9-]+)['"]/g),
  ...read('src/lib/extraExercises.ts').matchAll(/\bid:\s*['"](ex-[a-z0-9-]+)['"]/g),
].map(m => m[1]);
const catalogSet = new Set(catalog);

test('catálogo mantém IDs únicos', () => {
  assert.equal(catalog.length,catalogSet.size,'ID duplicado quebra fichas persistidas');
  assert.ok(catalog.length>=330,'O catálogo diminuiu: verificar IDs históricos');
});

test('todos os atlas WebP obrigatórios estão no repositório, com cabeçalho válido', () => {
  for (const group of groups) {
    const path = resolve(root,group.path);
    assert.ok(statSync(path).size > 512, 'Atlas vazio: '+group.path);
    const buffer = readFileSync(path);
    assert.equal(buffer.toString('ascii',0,4),'RIFF','Arquivo não é RIFF: '+group.path);
    assert.equal(buffer.toString('ascii',8,12),'WEBP','Arquivo não é WebP: '+group.path);
  }
});

test('índices dos atlas não excedem os quadros e apontam para IDs do catálogo', () => {
  for (const group of groups) {
    const ids=list(group.file,group.name);
    assert.ok(ids.length>0,group.name+' vazio');
    assert.ok(ids.length<=group.rows*5,group.name+' excedeu o atlas de 5 colunas');
    for (const id of ids) assert.ok(catalogSet.has(id),group.name+': ID inexistente '+id);
  }
});

test('22 ilustrações adicionais têm vínculos únicos e corretos', () => {
  const ids=list('src/lib/supplementIllustrationMedia.ts','SUPPLEMENT_22_GUIDE_IDS');
  assert.equal(ids.length,22);
  assert.equal(new Set(ids).size,ids.length,'Não repetir quadros ou variar ID sem justificativa');
});

// Não equivale à validação biomecânica, licença de imagens externas,
// inspeção visual de cortes ou testes autenticados no navegador.
