/**
 * Importa as 40 ilustrações de peito do pacote gerado nesta conversa.
 * Primeiro extraia o ZIP e execute:
 *   node scripts/import-chest-illustrations.mjs /caminho/ilustracoes
 * Execute na raiz do repositório FitBox e faça commit dos .webp importados.
 */
import { existsSync, mkdirSync, copyFileSync, readFileSync, statSync } from 'node:fs';
import { resolve, join } from 'node:path';

const src = process.argv[2];
if (!src) {
  console.error('Uso: node scripts/import-chest-illustrations.mjs <pasta/ilustracoes>');
  process.exit(1);
}
const source=resolve(src);
const dest=resolve('src/assets/exercise-guide/chest');
const manifest=readFileSync('src/lib/chestIllustrationMedia.ts','utf8');
const ids=[...manifest.matchAll(/"((?:ex-)[a-z0-9-]+)"/g)].map(m=>m[1]);
if (ids.length !== 40 || new Set(ids).size !== 40) {
  console.error('Catálogo de peito inconsistente: esperados 40 IDs únicos.');
  process.exit(1);
}
const missing=ids.filter(id=>!existsSync(join(source,id+'.webp')));
if (missing.length) {
  console.error('Imagens ausentes ('+missing.length+'):\n'+missing.join('\n'));
  process.exit(1);
}
const invalid=ids.filter(id=>{
  const filepath=join(source,id+'.webp');
  if (statSync(filepath).size < 1000) return true;
  const head=readFileSync(filepath).subarray(0,12);
  return head.toString('ascii',0,4)!=='RIFF' || head.toString('ascii',8,12)!=='WEBP';
});
if (invalid.length) {
  console.error('Arquivos não-WebP ou vazios:\n'+invalid.join('\n'));
  process.exit(1);
}
mkdirSync(dest,{recursive:true});
for (const id of ids) copyFileSync(join(source,id+'.webp'),join(dest,id+'.webp'));
console.log('40 ilustrações importadas com sucesso em '+dest);
console.log('Execute npm run build e npm test; faça commit dos 40 arquivos WebP.');
