import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

/**
 * Inventário histórico do PR #5: preservado como TESTE, não como nova fonte de
 * fotos. Os 89 caminhos originais não devem sobrescrever atlas publicados.
 */
const legacyIds=[
  "ex-puxada-maquina",
  "ex-barra-fixa-assistida",
  "ex-pull-over-maquina",
  "ex-elevacao-lateral-cabo",
  "ex-elevacao-lateral-maquina",
  "ex-agachamento-bulgaro",
  "ex-leg-press-horizontal",
  "ex-afundo",
  "ex-hip-thrust-maquina",
  "ex-agachamento-sumo",
  "ex-stiff-unilateral",
  "ex-elevacao-pernas",
  "ex-bike",
  "ex-hyrox-sled-pull",
  "ex-new-flexaoarqueiro",
  "ex-new-crossoveraltoparabaixo",
  "ex-new-flexaocomtoquenoombro",
  "ex-new-supinocomkettlebell",
  "ex-new-flexaocomresistenciaelastica",
  "ex-new-barrafixaneutra",
  "ex-new-remadapendlay",
  "ex-new-remadarenegade",
  "ex-new-elevacaoynobancoinclinado",
  "ex-new-desenvolvimentomeioajoelhado",
  "ex-new-desenvolvimentolandmineunilatera",
  "ex-new-facepullcomrotacaoexterna",
  "ex-new-elevacaolateralnapoliaempe",
  "ex-new-pikepushup",
  "ex-new-rosca21",
  "ex-new-roscabayesiannocabo",
  "ex-new-roscacomtoalha",
  "ex-new-roscaconcentradaembancoinclinado",
  "ex-new-roscapronadacombarraw",
  "ex-new-roscacomelasticoempe",
  "ex-new-roscaspiderunilateral",
  "ex-new-tricepscoicenocabo",
  "ex-new-tricepsbancocompeselevados",
  "ex-new-extensaodetricepscomelastico",
  "ex-new-supinofechadocomhalteres",
  "ex-new-agachamentopausa",
  "ex-new-agachamentocaixa",
  "ex-new-agachamentolandmine",
  "ex-new-stepuplateral",
  "ex-new-cossacksquat",
  "ex-new-legpressunilateral",
  "ex-new-extensoracompausa",
  "ex-new-wallsitisometrico",
  "ex-new-afundoreverso",
  "ex-new-nordiccurlassistido",
  "ex-new-passadalateral",
  "ex-new-glutebridgenosolo",
  "ex-new-hipthrustunilateral",
  "ex-new-abducaolateraldeitada",
  "ex-new-pontecomminiband",
  "ex-new-frogpump",
  "ex-new-elevacaopelvicanotrx",
  "ex-new-abdominalcanivete",
  "ex-new-hollowhold",
  "ex-new-pranchacomtoquenoombro",
  "ex-new-pranchacomelevacaodeperna",
  "ex-new-birddog",
  "ex-new-suitcasecarryunilateral",
  "ex-new-pranchacomdeslocamento",
  "ex-new-elevacaodejoelhosnabarra",
  "ex-new-corridaleveaoarlivre",
  "ex-new-caminhadaeminclinacao",
  "ex-new-airbikeintervalada",
  "ex-new-assaultbikemoderada",
  "ex-new-shuttlerun",
  "ex-new-mobilidadedequadril9090",
  "ex-new-alongamentodeflexordequadril",
  "ex-new-alongamentodeposteriorcomfaixa",
  "ex-new-rotacaotoracicaemquatroapoios",
  "ex-new-mobilidadedetornozelonaparede",
  "ex-new-alongamentodepeitoralnaporta",
  "ex-new-worldsgreateststretch",
  "ex-new-agachamentoprofundosustentado",
  "ex-new-panturrilhaempeunilateral",
  "ex-new-panturrilhanostep",
  "ex-new-extensaodepunhos",
  "ex-new-flexaodepunhos",
  "ex-new-pronacaoesupinacaodeantebraco",
  "ex-new-farmercarryunilateral",
  "ex-new-roscapunhoreversa",
  "ex-new-deadhangnabarra",
  "ex-new-facepullnoelastico",
  "ex-new-pushpresscomhalteres",
  "ex-new-flexaodiamante",
  "ex-new-agachamentocomminiband"
];
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const catalog=[read('src/lib/exercises.ts'),read('src/lib/extraExercises.ts')];
const mediaFiles=[
  'src/lib/exerciseMedia.ts','src/lib/exerciseMediaExpansion.ts',
  'src/lib/exerciseMediaNovember.ts','src/lib/exerciseMediaRoundTwo.ts',
  'src/lib/hyroxMedia.ts','src/lib/lowerBodyPhotoMedia.ts',
  'src/lib/chestIllustrationMedia.ts','src/lib/backShoulderIllustrationMedia.ts',
  'src/lib/bicepsIllustrationMedia.ts','src/lib/tricepsIllustrationMedia.ts',
  'src/lib/lowerBodyIllustrationMedia.ts','src/lib/abdomenIllustrationMedia.ts',
  'src/lib/conditioningIllustrationMedia.ts','src/lib/supplementIllustrationMedia.ts',
];
const catalogIds=new Set(catalog.flatMap(source=>[...source.matchAll(/\\bid:\\s*'(ex-[^']+)'/g)].map(m=>m[1])));
const mediaIds=new Set(mediaFiles.flatMap(path=>[...read(path).matchAll(/['"](ex-[a-z0-9-]+)['"]/g)].map(m=>m[1])));

test('89 IDs do inventário histórico continuam no catálogo atual',()=>{
  assert.equal(legacyIds.length,89);
  assert.equal(new Set(legacyIds).size,89);
  for(const id of legacyIds)assert.ok(catalogIds.has(id),'ID legado ausente: '+id);
});

test('89 exercícios antigos já possuem vínculo com uma fonte de mídia no código atual',()=>{
  const missing=legacyIds.filter(id=>!mediaIds.has(id));
  assert.deepEqual(missing,[],'Não reativar URLs antigas: conferir faltantes nas fontes atuais.');
});

test('modelo atual conserva atlas ilustrados e mapas de fotos sem forçar os WebP antigos',()=>{
  const resolver=read('src/lib/exerciseMedia.ts');
  assert.match(resolver,/getSupplementIllustration\\(exerciseId\\)/);
  assert.match(resolver,/getConditioningIllustration\\(exerciseId\\)/);
  assert.match(resolver,/getLowerBodyIllustration\\(exerciseId\\)/);
  assert.match(resolver,/getChestIllustration\\(exerciseId\\)/);
  assert.doesNotMatch(resolver,/userExecutionGuide|\\/exercise-guide\\/01\\.webp/);
});

test('somente uma foto aparece inicialmente; segunda posição continua acessível',()=>{
  const visual=read('src/components/ExerciseVisual.tsx');
  assert.match(visual,/\\[images\\.first\\]\\.map\\(/);
  assert.match(visual,/showSecondPosition &&/);
  assert.match(visual,/src=\\{images\\.second\\}/);
  assert.match(visual,/aria-expanded=\\{showSecondPosition\\}/);
});
