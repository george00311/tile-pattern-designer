import {decode,encode} from './codec';
import {createGrid,type TileGrid} from './model';
export const STORAGE_KEY='tile-pattern-designer:v1';
export function initialGrid():{grid:TileGrid;message:string;protectBackup?:boolean}{
  const code=new URLSearchParams(location.hash.slice(1)).get('design');
  if(code){try{return {grid:decode(code),message:'已從分享連結還原設計。'};}catch(e){return {grid:createGrid(),protectBackup:true,message:`分享連結無法載入：${(e as Error).message} 請使用「載入進度」還原本機備份。`};}}
  try{const saved=localStorage.getItem(STORAGE_KEY);return {grid:saved?decode(saved):createGrid(),message:saved?'已恢復本機暫存。':''};}catch{return {grid:createGrid(),protectBackup:true,message:'本機暫存無法讀取，請用字串或檔案載入。'};}
}
export const saveLocal=(grid:TileGrid)=>localStorage.setItem(STORAGE_KEY,encode(grid));
