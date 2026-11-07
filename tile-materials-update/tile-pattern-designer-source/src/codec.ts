import {validate,type TileGrid} from './model';
export const PREFIX='TP1.';
function checksum(bytes:Uint8Array){let crc=0xffffffff;for(const b of bytes){crc^=b;for(let i=0;i<8;i++)crc=(crc>>>1)^((crc&1)?0xedb88320:0);}return (crc^0xffffffff)>>>0;}
// Header: version,width,height,mode. Mode 0 = packed 5-bit IDs (+1), mode 1 = RLE (ID,count-1).
export function encode(grid:TileGrid):string {
  const g=validate(grid), packed=new Uint8Array(Math.ceil(g.tiles.length*5/8));
  g.tiles.forEach((id,i)=>{for(let j=0;j<5;j++)if((id+1)&(1<<j))packed[(i*5+j)>>3]|=1<<((i*5+j)%8);});
  const runs:number[]=[];
  for(let i=0;i<g.tiles.length;){const id=g.tiles[i];let n=1;while(i+n<g.tiles.length&&g.tiles[i+n]===id&&n<256)n++;runs.push(id+1,n-1);i+=n;}
  const mode=runs.length<packed.length?1:0,payload=mode?new Uint8Array(runs):packed;
  const data=new Uint8Array(4+payload.length+4);data.set([1,g.width,g.height,mode]);data.set(payload,4);
  new DataView(data.buffer).setUint32(data.length-4,checksum(data.subarray(0,-4)));
  return PREFIX+btoa(String.fromCharCode(...data)).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
}
export function extractCode(input:string):string {
  const text=input.trim();if(text.length>50000)throw Error('存檔內容過長。');
  if(text.startsWith('https://')||text.startsWith('http://')){try{return new URLSearchParams(new URL(text).hash.slice(1)).get('design')||'';}catch{throw Error('分享連結不正確。');}}
  return text;
}
export function decode(input:string):TileGrid {
  const text=extractCode(input);
  if(text.startsWith('{')){try{return validate(JSON.parse(text));}catch(e){throw Error(e instanceof SyntaxError?'JSON 存檔損壞。':(e as Error).message);}}
  if(!text.startsWith(PREFIX))throw Error('不支援的存檔格式或版本。');
  const raw=text.slice(PREFIX.length);if(!/^[A-Za-z0-9_-]+$/.test(raw)||raw.length%4===1)throw Error('存檔字串已損壞。');
  let data:Uint8Array;try{data=Uint8Array.from(atob(raw.replace(/-/g,'+').replace(/_/g,'/')),c=>c.charCodeAt(0));}catch{throw Error('存檔字串已損壞。');}
  if(data.length<9||new DataView(data.buffer).getUint32(data.length-4)!==checksum(data.subarray(0,-4)))throw Error('存檔校驗失敗，請重新複製完整字串。');
  const [v,width,height,mode]=data,n=width*height,p=data.subarray(4,-4),tiles:number[]=[];
  if(v!==1||width<1||height<1||width>100||height>100)throw Error('版本或尺寸不正確。');
  if(mode===0){if(p.length!==Math.ceil(n*5/8))throw Error('存檔長度不正確。');for(let i=0;i<n;i++){let id=0;for(let j=0;j<5;j++)id|=((p[(i*5+j)>>3]>>((i*5+j)%8))&1)<<j;tiles.push(id-1);}}
  else if(mode===1){if(p.length%2)throw Error('存檔長度不正確。');for(let i=0;i<p.length;i+=2){if(tiles.length+p[i+1]+1>n)throw Error('存檔長度不正確。');tiles.push(...Array(p[i+1]+1).fill(p[i]-1));}}
  else throw Error('不支援的編碼方式。');
  return validate({v,width,height,tiles});
}
