#!/usr/bin/env python3
"""Audita 11 atlas + 11 ilustrações individuais do FitBox sem alterar desenhos.
Analisa dimensões, células com pouco conteúdo, bordas encostadas e similaridade.
A correspondência semântica/biomecânica requer inspeção humana das prévias.
"""
from __future__ import annotations
from collections import defaultdict
from pathlib import Path
from PIL import Image, ImageChops, ImageOps, ImageStat, ImageDraw, ImageFont
import argparse, base64, io, json, re

ROOT = Path(__file__).resolve().parents[1]
ATLAS = [
    ("chest", "CHEST_GUIDE_IDS", 8, "src/lib/chestIllustrationMedia.ts", "public/exercise-guide/chest/sprite.webp"),
    ("back", "BACK_GUIDE_IDS", 8, "src/lib/backShoulderIllustrationMedia.ts", "public/exercise-guide/back/sprite.webp"),
    ("shoulders", "SHOULDER_GUIDE_IDS", 7, "src/lib/backShoulderIllustrationMedia.ts", "public/exercise-guide/shoulders/sprite.webp"),
    ("biceps", "BICEPS_GUIDE_IDS", 6, "src/lib/bicepsIllustrationMedia.ts", "public/exercise-guide/biceps/sprite.webp"),
    ("triceps", "TRICEPS_GUIDE_IDS", 5, "src/lib/tricepsIllustrationMedia.ts", "public/exercise-guide/triceps/sprite.webp"),
    ("legs", "LEG_GUIDE_IDS", 6, "src/lib/lowerBodyIllustrationMedia.ts", "public/exercise-guide/legs/sprite.webp"),
    ("glutes", "GLUTE_GUIDE_IDS", 3, "src/lib/lowerBodyIllustrationMedia.ts", "public/exercise-guide/glutes/sprite.webp"),
    ("calves", "CALF_GUIDE_IDS", 1, "src/lib/lowerBodyIllustrationMedia.ts", "public/exercise-guide/calves/sprite.webp"),
    ("abdomen", "ABDOMEN_GUIDE_IDS", 7, "src/lib/abdomenIllustrationMedia.ts", "public/exercise-guide/abdomen/sprite.webp"),
    ("conditioning", "CONDITIONING_GUIDE_IDS", 10, "src/lib/conditioningIllustrationMedia.ts", "public/exercise-guide/conditioning/sprite.webp"),
    ("supplement-22", "SUPPLEMENT_22_GUIDE_IDS", 5, "src/lib/supplementIllustrationMedia.ts", "src/assets/exercise-guide/supplement-22/sprite.webp"),
]

def entries(source: str, name: str) -> list[str]:
    m = re.search(r"export const\s+"+name+r"\s*=\s*\[([\s\S]*?)\]\s*as const", source)
    if not m:
        raise ValueError("Missing manifest " + name)
    return re.findall(r"['\"](ex-[a-z0-9-]+)['\"]", m.group(1))

def png_bounding(im: Image.Image) -> tuple[float, float, float]:
    # White is the intended background. Conservative threshold avoids
    # treating compression noise as an edge.
    g = ImageOps.grayscale(im.convert("RGB"))
    mask = g.point(lambda p: 255 if p < 222 else 0)
    box = mask.getbbox()
    if not box:
        return 0., 0., 0.
    w,h = im.size
    ink = ImageStat.Stat(mask).mean[0]/255
    edge = (min(box[0],w-box[2])/w, min(box[1],h-box[3])/h)
    return round(ink,4),round(edge[0],4),round(edge[1],4)

def dhash(im: Image.Image) -> int:
    im = ImageOps.grayscale(im).resize((9,8))
    px=list(im.getdata())
    return sum((1<<i) for i in range(64) if px[(i//8)*9+(i%8)] > px[(i//8)*9+(i%8)+1])

def main():
    parser=argparse.ArgumentParser()
    parser.add_argument("--previews",action="store_true")
    args=parser.parse_args()
    report=[]
    cells=[]
    for group,constant,rows,source,path in ATLAS:
        ids=entries((ROOT/source).read_text(),constant)
        im=Image.open(ROOT/path).convert("RGB")
        width,height=im.size
        if width%5 or height%rows:
            raise ValueError(f"{group}: sprite size {im.size} not divisible by 5x{rows}")
        cw,ch=width//5,height//rows
        warnings=[]
        for index,id in enumerate(ids):
            box=(index%5*cw,index//5*ch,(index%5+1)*cw,(index//5+1)*ch)
            tile=im.crop(box)
            ink,xmargin,ymargin=png_bounding(tile)
            key=f"{group}:{index}:{id}"
            cells.append((key,dhash(tile),ink,xmargin,ymargin))
            if ink<0.005: warnings.append("EMPTY? "+key)
            if min(xmargin,ymargin)<0.008 and ink>0.025:
                warnings.append("EDGE? "+key+f" x={xmargin} y={ymargin}")
        report.append(dict(group=group,width=width,height=height,count=len(ids),cells=rows*5,cell=[cw,ch],warnings=warnings))
        if args.previews:
            # Single line per image, decoded on demand from Actions logs.
            preview=im.copy()
            preview.thumbnail((850,850))
            buff=io.BytesIO()
            preview.save(buff,format="JPEG",quality=52,optimize=True)
            print("PREVIEW_"+group.upper().replace("-","_")+"="+base64.b64encode(buff.getvalue()).decode())
    user_dir=ROOT/"src/assets/exercise-guide/user-updates-20261111"
    singles=[]
    for p in sorted(user_dir.glob("*.webp")):
        im=Image.open(p)
        ink,xmargin,ymargin=png_bounding(im)
        singles.append(dict(file=p.name,dimensions=im.size,ink=ink,margin=[xmargin,ymargin]))
        cells.append(("individual:"+p.name,dhash(im),ink,xmargin,ymargin))
    # Hamming distance <= 4 in 64-bit hash is a strong suspect for duplicate images.
    duplicates=[]
    for i,(name,hash_,ink,*_) in enumerate(cells):
        for name2,h2,ink2,*_ in cells[:i]:
            if abs(ink-ink2)>0.10:continue
            dist=(hash_^h2).bit_count()
            if dist<=3:
                duplicates.append(dict(a=name2,b=name,distance=dist))
    index=defaultdict(list)
    for g,const,rows,source,path in ATLAS:
        for idx,eid in enumerate(entries((ROOT/source).read_text(),const)):
            index[eid].append(f"{g}:{idx}")
    collisions={id:loc for id,loc in index.items() if len(loc)>1}
    print("AUDIT_JSON="+json.dumps(dict(atlases=report,individual=singles,collisions=collisions,similar=duplicates),ensure_ascii=False,separators=(",",":")))
    print("AUDIT_SUMMARY: ",len(cells),"image cells;",len(duplicates),"near-duplicates;",len(collisions),"repeated exercise IDs")
if __name__=="__main__":main()
