/**
 * Copia as 89 ilustrações recortadas para o diretório estático do FitBox.
 * Uso: node scripts/import-exercise-guide.mjs /pasta/descompactada/execucoes
 * Não gera imagens, não modifica fichas e falha se qualquer quadro estiver faltando.
 */
import { existsSync, mkdirSync, copyFileSync, readFileSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';

const source = process.argv[2];
if (!source) {
  console.error('Uso: node scripts/import-exercise-guide.mjs <pasta/execucoes>');
  process.exit(1);
}
const from = resolve(source);
const target = resolve('public/exercise-guide');
const names = Array.from({ length: 89 }, (_, i) => String(i + 1).padStart(2, '0') + '.webp');
const missing = names.filter(name => !existsSync(join(from, name)));
if (missing.length) {
  console.error('Arquivos ausentes:', missing.join(', '));
  process.exit(1);
}
const invalid = names.filter(name => {
  const path = join(from, name);
  const bytes = readFileSync(path);
  return statSync(path).size < 1000 || bytes.toString('ascii',0,4) !== 'RIFF' || bytes.toString('ascii',8,12) !== 'WEBP';
});
if (invalid.length) {
  console.error('WebP inválidos:', invalid.join(', '));
  process.exit(1);
}
mkdirSync(target, { recursive: true });
for (const name of names) copyFileSync(join(from, name), join(target, name));
console.log('89 ilustrações copiadas para public/exercise-guide/');
console.log('Revise visualmente o conteúdo antes de usá-lo como instrução de técnica.');
