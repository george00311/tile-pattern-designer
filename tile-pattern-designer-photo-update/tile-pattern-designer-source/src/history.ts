import type {TileGrid} from './model';
export interface History {past:TileGrid[];present:TileGrid;future:TileGrid[]}
export type Action={type:'commit';grid:TileGrid}|{type:'undo'|'redo'}|{type:'reset';grid:TileGrid};
export function historyReducer(h:History,a:Action):History {
  if(a.type==='reset')return {past:[],present:a.grid,future:[]};
  if(a.type==='commit'){if(JSON.stringify(a.grid)===JSON.stringify(h.present))return h;return {past:[...h.past,h.present].slice(-100),present:a.grid,future:[]};}
  if(a.type==='undo'&&h.past.length)return {past:h.past.slice(0,-1),present:h.past.at(-1)!,future:[h.present,...h.future]};
  if(a.type==='redo'&&h.future.length)return {past:[...h.past,h.present],present:h.future[0],future:h.future.slice(1)};
  return h;
}
