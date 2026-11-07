import {describe,it,expect} from 'vitest';
import {createGrid,resizeGrid,losesContent,validate} from '../src/model';
import {encode,decode} from '../src/codec';
import {historyReducer} from '../src/history';
import {exportSize} from '../src/export';
describe('地板與尺寸',()=>{
 it('預設 48 格、17 種 ID 和橡皮擦',()=>{const g=createGrid();expect(g.tiles).toHaveLength(48);g.tiles=g.tiles.map((_,i)=>i%18-1);expect(validate(g)).toEqual(g);});
 it('縮小保留座標並偵測損失',()=>{const g=createGrid(8,6);g.tiles[10]=3;g.tiles[47]=16;expect(losesContent(g,4,3)).toBe(true);const r=resizeGrid(g,4,3);expect(r.tiles[6]).toBe(3);expect(r.tiles).toHaveLength(12);expect(resizeGrid(r,8,6).tiles[10]).toBe(3);});
 it('拒絕不合法尺寸與 ID',()=>{for(const n of [0,101,NaN,2.5])expect(()=>createGrid(n,6)).toThrow();expect(()=>validate({...createGrid(),tiles:[17]})).toThrow();});
});
describe('穩定存檔',()=>{
 it.each([[1,1],[8,6],[100,100]])('%i × %i 逐格無損往返',(w,h)=>{const g=createGrid(w,h);g.tiles=g.tiles.map((_,i)=>(i*7+i%5)%18-1);expect(decode(encode(g))).toEqual(g);expect(decode(JSON.stringify(g))).toEqual(g);expect(decode('https://example.com/#design='+encode(g))).toEqual(g);});
 it('RLE 壓縮空白與長段落',()=>{const g=createGrid(100,100);expect(encode(g).length).toBeLessThan(140);expect(decode(encode(g))).toEqual(g);});
 it('拒絕損壞、長度、版本、無效 ID 與過長字串',()=>{const code=encode(createGrid());for(const s of [code.slice(0,-3),code.slice(0,7)+'X'+code.slice(8),'TP2.abc','TP1.!!!!','a'.repeat(50001),JSON.stringify({v:2,width:8,height:6,tiles:[]}),JSON.stringify({v:1,width:1,height:1,tiles:[17]}),JSON.stringify({v:1,width:2,height:1,tiles:[0]})])expect(()=>decode(s)).toThrow();});
});
describe('操作歷史',()=>{it('整筆提交、復原、重做與分支',()=>{const g=createGrid(),r=resizeGrid(g,2,2);let h=historyReducer({past:[],present:g,future:[]},{type:'commit',grid:r});h=historyReducer(h,{type:'undo'});expect(h.present).toEqual(g);h=historyReducer(h,{type:'redo'});expect(h.present).toEqual(r);h=historyReducer(h,{type:'undo'});h=historyReducer(h,{type:'commit',grid:createGrid(3,3)});expect(h.future).toHaveLength(0);});});
describe('匯出容量',()=>{it('預設解析度與大型畫布限制',()=>{expect(exportSize(createGrid(),128)).toEqual({w:1024,h:768});expect(()=>exportSize(createGrid(100,100),128)).toThrow();expect(exportSize(createGrid(100,100),32)).toEqual({w:3200,h:3200});});});
