import {TILE_FILES,type TileGrid} from './model';
export function loadImage(src:string):Promise<HTMLImageElement>{return new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=()=>reject(Error('地磚圖片載入失敗，請重新整理後重試。'));img.src=src;});}
export function exportSize(g:TileGrid,px:number){const w=g.width*px,h=g.height*px;if(!Number.isInteger(px)||px<16||px>512||w>8192||h>8192||w*h>16_777_216)throw Error('圖片過大。請降低每格解析度（最多 1,677 萬像素，單邊 8192 像素）。');return {w,h};}
export async function renderPNG(g:TileGrid,px:number,lines:boolean):Promise<Blob>{
  const {w,h}=exportSize(g,px),canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;
  try{const ctx=canvas.getContext('2d');if(!ctx)throw Error('裝置無法建立畫布，請降低解析度。');
    const ids=[...new Set(g.tiles.filter(id=>id>=0))],images=new Map(await Promise.all(ids.map(async id=>[id,await loadImage(TILE_FILES[id])] as const)));
    g.tiles.forEach((id,i)=>{if(id>=0)ctx.drawImage(images.get(id)!,i%g.width*px,Math.floor(i/g.width)*px,px,px);});
    if(lines){ctx.strokeStyle='#53635980';ctx.lineWidth=1;ctx.beginPath();for(let x=0;x<=w;x+=px){ctx.moveTo(Math.min(x+.5,w-.5),0);ctx.lineTo(Math.min(x+.5,w-.5),h);}for(let y=0;y<=h;y+=px){ctx.moveTo(0,Math.min(y+.5,h-.5));ctx.lineTo(w,Math.min(y+.5,h-.5));}ctx.stroke();}
    return await new Promise<Blob>((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(Error('匯出失敗，請降低解析度。')),'image/png'));
  }finally{canvas.width=0;canvas.height=0;}
}
export function download(blob:Blob,name:string){const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),2000);}
export function filename(g:TileGrid,suffix:string){const d=new Date(),date=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;return `地磚-${g.width}x${g.height}-${date}.${suffix}`;}
