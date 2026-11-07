export const TILE_IDS = Array.from({length:17},(_,i)=>i);
export const EMPTY = -1;
// Stable IDs. Replace assets here without ever changing an ID's meaning.
export const TILE_FILES = TILE_IDS.map(id=>`/tiles/tile-${id.toString().padStart(2,'0')}.png`);
export interface TileGrid {v:1; width:number; height:number; tiles:number[]}
export function validate(value:unknown):TileGrid {
  const g = value as TileGrid;
  if(!g || g.v!==1) throw Error('不支援的存檔版本。');
  if(!Number.isInteger(g.width)||!Number.isInteger(g.height)||g.width<1||g.width>100||g.height<1||g.height>100) throw Error('長度與寬度必須為 1～100 格。');
  if(!Array.isArray(g.tiles)||g.tiles.length!==g.width*g.height||!g.tiles.every(id=>Number.isInteger(id)&&id>=-1&&id<=16)) throw Error('地磚資料長度或 ID 不正確。');
  return {v:1,width:g.width,height:g.height,tiles:[...g.tiles]};
}
export const createGrid=(width=8,height=6):TileGrid=>validate({v:1,width,height,tiles:Array(width*height).fill(EMPTY)});
export function resizeGrid(g:TileGrid,width:number,height:number):TileGrid {
  const next=createGrid(width,height);
  for(let y=0;y<Math.min(height,g.height);y++) for(let x=0;x<Math.min(width,g.width);x++) next.tiles[y*width+x]=g.tiles[y*g.width+x];
  return next;
}
export const losesContent=(g:TileGrid,w:number,h:number)=>g.tiles.some((id,i)=>id!==EMPTY&&(i%g.width>=w||Math.floor(i/g.width)>=h));
