import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = path => readFileSync(new URL('../' + path, import.meta.url));
const manifests = [
  {name:'peito',module:'src/lib/chestIllustrationMedia.ts',
    sprite:'public/exercise-guide/chest/sprite.webp',count:40,width:1400,height:1640},
  {name:'costas',module:'src/lib/backShoulderIllustrationMedia.ts',
    sprite:'public/exercise-guide/back/sprite.webp',count:40,width:1550,height:2000},
  {name:'ombros',module:'src/lib/backShoulderIllustrationMedia.ts',
    sprite:'public/exercise-guide/shoulders/sprite.webp',count:34,width:1550,height:1750},
];

function webpDimensions(bytes) {
  assert.equal(bytes.toString('ascii',0,4),'RIFF');
  assert.equal(bytes.toString('ascii',8,12),'WEBP');
  assert.equal(bytes.toString('ascii',12,16),'VP8 ',
    'Os três atlas precisam ser WebP VP8 estáticos para o teste de dimensões.');
  assert.equal(bytes.toString('hex',23,26),'9d012a','WebP sem cabeçalho VP8 válido');
  return {
    width:bytes.readUInt16LE(26)&0x3fff,
    height:bytes.readUInt16LE(28)&0x3fff,
  };
}

test('os três atlas têm tamanho exato para 5 colunas e a contagem prevista',()=>{
  const chest=read(manifests[0].module).toString();
  const backShoulder=read(manifests[1].module).toString();
  for(const atlas of manifests) {
    const dims=webpDimensions(read(atlas.sprite));
    assert.deepEqual(dims,{width:atlas.width,height:atlas.height},atlas.name);
    assert.ok(dims.width%5===0,atlas.name+' sem cinco colunas');
    const source=atlas.name==='peito' ? chest : backShoulder;
    const label=atlas.name==='peito'?'CHEST_GUIDE_IDS':atlas.name==='costas'?'BACK_GUIDE_IDS':'SHOULDER_GUIDE_IDS';
    const list=source.match(new RegExp('export const '+label+' = \\[([\\s\\S]*?)\\] as const;'));
    assert.ok(list,atlas.name+' sem manifesto');
    const ids=[...list[1].matchAll(/"([^"]+)"/g)].map(x=>x[1]);
    assert.equal(ids.length,atlas.count,atlas.name+' com contagem divergente');
    assert.equal(new Set(ids).size,atlas.count,atlas.name+' com ID duplicado');
  }
});

test('a visualização não impõe altura fixa a imagens do atlas',()=>{
  const visual=read('src/components/ExerciseVisual.tsx').toString();
  assert.ok(visual.includes("images.spriteIndex !== undefined && index === 0"),
    'Altura dos quadros do atlas precisa seguir sua proporção, não a altura das fotos');
  assert.ok(visual.includes("aspectRatio: spriteAspectRatio"));
  assert.ok(visual.includes("backgroundSize: `500% ${spriteRows * 100}%`"));
});
