import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const readText = path => readFileSync(new URL('../'+path, import.meta.url), 'utf8');
const mappings = {
  'ex-agachamento-hack': 'agachamento-hack.webp',
  'ex-cadeira-adutora': 'cadeira-adutora.webp',
  'ex-new-caminhadalateralcomminiband': 'caminhada-lateral-com-miniband.webp',
  'ex-new-extensaodequadrilemquatroapoios': 'extensao-quadril-quatro-apoios.webp',
  'ex-new-extensoracompausa': 'extensora-com-pausa.webp',
  'ex-fedb-donkey-calf-raises': 'panturrilha-burro.webp',
  'ex-new-passadaparatrascomhalteres': 'passada-para-tras-com-halteres.webp',
  'ex-new-pullthroughnocabo': 'pull-through-no-cabo.webp',
  'ex-new-roscanobancoinclinado': 'rosca-no-banco-inclinado.webp',
  'ex-new-russiantwistcomanilha': 'russian-twist-com-anilha.webp',
};

test('all ten user illustration files are real WebP assets', () => {
  for (const [id, filename] of Object.entries(mappings)) {
    const file = readFileSync(new URL('../src/assets/exercise-guide/user-updates-20261111/'+filename, import.meta.url));
    assert.ok(file.byteLength > 5000, id + ' is unexpectedly small');
    assert.equal(file.toString('ascii',0,4), 'RIFF', id);
    assert.equal(file.toString('ascii',8,12), 'WEBP', id);
  }
});

test('each user illustration is bound to the exact exercise ID', () => {
  const source = readText('src/lib/userProvidedIllustrationMedia.ts');
  const actual = [...source.matchAll(/'(ex-[a-z0-9-]+)': '([^']+\\.webp)'/g)];
  assert.equal(actual.length, 10);
  assert.deepEqual(Object.fromEntries(actual.map(match => [match[1],match[2]])), mappings);
  assert.match(source, /import\\.meta\\.glob/);
  assert.match(source, /return files\\[/);
});

test('custom illustrations win over photos without affecting older atlases', () => {
  const resolver = readText('src/lib/exerciseMedia.ts');
  const customIndex = resolver.indexOf('const userIllustration = getUserProvidedIllustration(exerciseId)');
  const atlasIndex = resolver.indexOf('const supplement = getSupplementIllustration(exerciseId)');
  const photoIndex = resolver.indexOf('const id = VERIFIED_MEDIA_IDS[exerciseId]');
  assert.ok(customIndex > 0 && customIndex < atlasIndex && atlasIndex < photoIndex);
  assert.match(resolver, /kind: 'ilustracao'/);
});
