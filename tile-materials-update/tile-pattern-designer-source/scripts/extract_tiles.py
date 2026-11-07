"""Deterministic perspective crops. Usage: python scripts/extract_tiles.py SOURCE.jpg
Requires Pillow and numpy. ID order: top row 0-4, middle 5-10, bottom 11-16.
"""
import sys
from pathlib import Path
import numpy as np
from PIL import Image, ImageOps, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
QUADS = [
 [(348,169),(545,170),(547,372),(345,370)],
 [(552,172),(750,175),(748,374),(553,373)],
 [(756,176),(950,177),(946,375),(753,374)],
 [(956,179),(1145,182),(1142,375),(952,375)],
 [(1152,184),(1334,188),(1333,377),(1148,376)],
 [(143,374),(341,375),(342,570),(145,570)],
 [(348,376),(548,378),(547,571),(348,571)],
 [(554,379),(747,380),(746,571),(554,571)],
 [(753,380),(946,380),(943,572),(752,571)],
 [(952,381),(1141,382),(1138,573),(950,572)],
 [(1148,382),(1330,383),(1326,574),(1145,573)],
 [(147,577),(342,577),(343,771),(150,770)],
 [(349,578),(547,579),(548,770),(351,771)],
 [(555,579),(745,579),(743,768),(555,769)],
 [(752,579),(942,580),(940,767),(750,768)],
 [(949,580),(1137,582),(1132,769),(947,768)],
 [(1144,581),(1326,583),(1320,768),(1141,768)],
]
image=ImageOps.exif_transpose(Image.open(sys.argv[1])).convert('RGB')
if image.size != (1477,1108):
 raise ValueError(f'Expected original 1477x1108 photograph, got {image.size}')
out=ROOT/'public'/'tiles';out.mkdir(parents=True,exist_ok=True)
size=256
dest=[(0,0),(size,0),(size,size),(0,size)]
sheet=Image.new('RGB',(6*180,3*208),(247,246,242));draw=ImageDraw.Draw(sheet)
for tile_id,quad in enumerate(QUADS):
 matrix=[];values=[]
 for (x,y),(u,v) in zip(dest,quad):
  matrix.extend([[x,y,1,0,0,0,-u*x,-u*y],[0,0,0,x,y,1,-v*x,-v*y]])
  values.extend([u,v])
 coeff=np.linalg.solve(np.array(matrix,dtype=float),np.array(values,dtype=float))
 tile=image.transform((size,size),Image.Transform.PERSPECTIVE,coeff,Image.Resampling.BICUBIC)
 tile.save(out/f'tile-{tile_id:02}.png',optimize=True)
 row=0 if tile_id<5 else 1 if tile_id<11 else 2
 col=tile_id if row==0 else tile_id-5 if row==1 else tile_id-11
 x,y=col*180+10,row*208+10
 sheet.paste(tile.resize((160,160),Image.Resampling.LANCZOS),(x,y))
 draw.text((x+70,y+170),f'{tile_id:02}',fill=(45,61,51))
(ROOT/'.tools').mkdir(exist_ok=True)
sheet.save(ROOT/'.tools'/'tile-contact-sheet.jpg',quality=95)
print('Extracted 17 square PNGs; preserved original orientation and photograph colors.')
