"""Crop the two supplied material photographs without regenerating their texture."""
import sys
from pathlib import Path
import numpy as np
from PIL import Image, ImageOps
root=Path(__file__).resolve().parents[1]
sources=[(17,sys.argv[1],[(100,365),(980,342),(990,1240),(92,1230)]),
         (18,sys.argv[2],[(243,65),(1200,49),(1205,1007),(267,1016)])]
for tile_id,path,quad in sources:
 image=ImageOps.exif_transpose(Image.open(path)).convert('RGB')
 matrix=[];values=[]
 for (x,y),(u,v) in zip([(0,0),(256,0),(256,256),(0,256)],quad):
  matrix.extend([[x,y,1,0,0,0,-u*x,-u*y],[0,0,0,x,y,1,-v*x,-v*y]])
  values.extend([u,v])
 coeff=np.linalg.solve(np.array(matrix,dtype=float),np.array(values,dtype=float))
 image.transform((256,256),Image.Transform.PERSPECTIVE,coeff,Image.Resampling.BICUBIC).save(root/'public'/'tiles'/f'tile-{tile_id:02}.png',optimize=True)
 print(f'Extracted tile {tile_id}')
