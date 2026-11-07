import QRCode from 'qrcode';
import jsQR from 'jsqr';
import {encode,decode} from './codec';
import {loadImage} from './export';
import type {TileGrid} from './model';
export const QR_LIMIT=1800;
export function shareLink(g:TileGrid){return `${location.origin}${location.pathname}#design=${encode(g)}`;}
export async function makeQR(text:string){if(new TextEncoder().encode(text).length>QR_LIMIT)throw Error('此設計超過單張 QR Code 的可靠容量，請改用字串或存檔檔案。');return QRCode.toDataURL(text,{errorCorrectionLevel:'M',margin:4,scale:8,color:{dark:'#172b22',light:'#ffffff'}});}
export async function readQR(file:File){
  if(file.size>20*1024*1024)throw Error('照片超過 20 MB，請縮小後再試。');
  const url=URL.createObjectURL(file);try{const img=await loadImage(url);const scale=Math.min(1,2200/Math.max(img.width,img.height)),c=document.createElement('canvas');c.width=Math.round(img.width*scale);c.height=Math.round(img.height*scale);const ctx=c.getContext('2d',{willReadFrequently:true});if(!ctx)throw Error('無法讀取圖片。');ctx.drawImage(img,0,0,c.width,c.height);const pixels=ctx.getImageData(0,0,c.width,c.height),result=jsQR(pixels.data,c.width,c.height,{inversionAttempts:'attemptBoth'});c.width=0;c.height=0;if(!result)throw Error('找不到 QR Code。請使用清晰、完整且光線充足的照片。');return decode(result.data);}finally{URL.revokeObjectURL(url);}
}
