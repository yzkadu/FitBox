#!/usr/bin/env python3
"""Gera quadros individuais limpos a partir dos atlas versionados do FitBox.
Sem OCR, geração sintética ou substituição de exercícios. A técnica desenhada
permanece idêntica: apenas remove margens, linhas e padroniza o enquadramento.
"""
from pathlib import Path
from collections import defaultdict
from PIL import Image, ImageOps, ImageChops
import re, json

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'public/exercise-guide/clean'
ATLAS=[
 ('chest','CHEST_GUIDE_IDS',8,'src/lib/chestIllustrationMedia.ts','public/exercise-guide/chest/sprite.webp'),
 ('back','BACK_GUIDE_IDS',8,'src/lib/backShoulderIllustrationMedia.ts','public/exercise-guide/back/sprite.webp'),
 ('shoulders','SHOULDER_GUIDE_IDS',7,'src/lib/backShoulderIllustrationMedia.ts','public/exercise-guide/shoulders/sprite.webp'),
 ('biceps','BICEPS_GUIDE_IDS',6,'src/lib/bicepsIllustrationMedia.ts','public/exercise-guide/biceps/sprite.webp'),
 ('triceps','TRICEPS_GUIDE_IDS',5,'src/lib/tricepsIllustrationMedia.ts','public/exercise-guide/triceps/sprite.webp'),
 ('legs','LEG_GUIDE_IDS',6,'src/lib/lowerBodyIllustrationMedia.ts','public/exercise-guide/legs/sprite.webp'),
 ('glutes','GLUTE_GUIDE_IDS',3,'src/lib/lowerBodyIllustrationMedia.ts','public/exercise-guide/glutes/sprite.webp'),
 ('calves','CALF_GUIDE_IDS',1,'src/lib/lowerBodyIllustrationMedia.ts','public/exercise-guide/calves/sprite.webp'),
 ('abdomen','ABDOMEN_GUIDE_IDS',7,'src/lib/abdomenIllustrationMedia.ts','public/exercise-guide/abdomen/sprite.webp'),
 ('conditioning','CONDITIONING_GUIDE_IDS',10,'src/lib/conditioningIllustrationMedia.ts','public/exercise-guide/conditioning/sprite.webp'),
 ('supplement-22','SUPPLEMENT_22_GUIDE_IDS',5,'src/lib/supplementIllustrationMedia.ts','src/assets/exercise-guide/supplement-22/sprite.webp'),
]
SIZE=(340,280)
def ids(source,name):
 m=re.search(r'export const\s+'+name+r'\s*=\s*\[([\s\S]*?)\]\s*as const',source)
 if not m:raise ValueError('Absent source group '+name)
 return re.findall(r'["\'](ex-[a-z0-9-]+)["\']',m.group(1))
def clean_tile(tile):
 tile=tile.convert('RGB')
 w,h=tile.size
 # Mask computed without the outer 5px to ignore grid rules; crop from
 # the full original to keep all figure pixels and a little safety padding.
 middle=tile.crop((5,5,w-5,h-5)).convert('L')
 mask=middle.point(lambda p:255 if p<236 else 0)
 bounds=mask.getbbox()
 if not bounds:return Image.new('RGB',SIZE,'white'),False
 x0,y0,x1,y1=bounds
 x0=max(0,x0+5-3);y0=max(0,y0+5-3)
 x1=min(w,x1+5+3);y1=min(h,y1+5+3)
 crop=tile.crop((x0,y0,x1,y1))
 # Never stretch aspect ratios. Resize to a common optical size.
 crop.thumbnail((SIZE[0]-34,SIZE[1]-30),Image.Resampling.LANCZOS)
 canvas=Image.new('RGB',SIZE,'white')
 canvas.paste(crop,((SIZE[0]-crop.width)//2,(SIZE[1]-crop.height)//2))
 return canvas,True

def main():
 OUT.mkdir(parents=True,exist_ok=True)
 by_id={}
 groups=[]
 duplicates={}
 for group,constant,rows,src,path in ATLAS:
  names=ids((ROOT/src).read_text(encoding='utf-8'),constant)
  im=Image.open(ROOT/path).convert('RGB')
  w,h=im.size
  if w%5 or h%rows:raise ValueError(f'Unexpected sprite layout {group}: {w}x{h}')
  cw,ch=w//5,h//rows
  # The list order is the row-major order of atlas artwork.
  for i,name in enumerate(names):
   if name in by_id:
    duplicates.setdefault(name,[]).append(f'{group}:{i}')
    continue # First valid image wins. Do not silently replace it later.
   tile=im.crop(((i%5)*cw,(i//5)*ch,(i%5+1)*cw,(i//5+1)*ch))
   normalized,nonempty=clean_tile(tile)
   if not nonempty:raise ValueError(f'Blank image: {group}:{i} {name}')
   dest=OUT/group/(name+'.webp')
   dest.parent.mkdir(parents=True,exist_ok=True)
   normalized.save(dest,'WEBP',quality=86,method=6)
   by_id[name]={'group':group,'index':i,'file':'/exercise-guide/clean/'+group+'/'+name+'.webp'}
  groups.append({'group':group,'source_cells':len(names),'file':path})
 assert len(by_id)==319, f'Unexpected illustrated ID count: {len(by_id)}'
 files=list(OUT.glob('*/*.webp'))
 assert len(files)==319, f'Unexpected file count: {len(files)}'
 (OUT/'manifest.json').write_text(json.dumps({'count':len(by_id),'groups':groups,'entries':by_id,'reused_ids':duplicates},ensure_ascii=False,indent=2)+'\n')
 print('NORMALIZED_COUNT='+str(len(by_id)))
 print('NORMALIZED_COLLISIONS='+json.dumps(duplicates,ensure_ascii=False))
 print('NORMALIZED_BYTES='+str(sum(f.stat().st_size for f in files)))

if __name__=='__main__':main()
