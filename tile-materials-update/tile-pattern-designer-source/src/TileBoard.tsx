import {useEffect,useRef,useState} from 'react';
import {TILE_FILES,type TileGrid} from './model';
import {loadImage} from './export';
type Props={grid:TileGrid;selected:number;lines:boolean;mode:'paint'|'pan';onCommit:(g:TileGrid)=>void;onError:(s:string)=>void};
export function TileBoard({grid,selected,lines,mode,onCommit,onError}:Props){
  const canvas=useRef<HTMLCanvasElement>(null),host=useRef<HTMLDivElement>(null),images=useRef<HTMLImageElement[]>([]);
  const [ready,setReady]=useState(false),[size,setSize]=useState({w:600,h:400}),[view,setView]=useState({x:0,y:0,cell:48}),[draft,setDraft]=useState<TileGrid|null>(null),[focus,setFocus]=useState(0);
  const working=useRef<TileGrid|null>(null),points=useRef(new Map<number,{x:number;y:number}>()),last=useRef<{x:number;y:number}|null>(null),gesture=useRef(false);
  const shown=draft||grid;
  useEffect(()=>{let active=true;Promise.all(TILE_FILES.map(loadImage)).then(imgs=>{if(active){images.current=imgs;setReady(true);}}).catch(e=>onError(e.message));return()=>{active=false;};},[]);
  useEffect(()=>{const ob=new ResizeObserver(entries=>{const r=entries[0].contentRect;setSize({w:r.width,h:r.height});});if(host.current)ob.observe(host.current);return()=>ob.disconnect();},[]);
  const fit=()=>{const cell=Math.max(2,Math.min((size.w-72)/grid.width,(size.h-72)/grid.height,72));setView({cell,x:(size.w-grid.width*cell)/2,y:(size.h-grid.height*cell)/2});};
  useEffect(()=>{fit();setFocus(0);},[size.w,size.h,grid.width,grid.height]);
  useEffect(()=>{
    const c=canvas.current;if(!c)return;const dpr=Math.min(devicePixelRatio||1,2);c.width=Math.round(size.w*dpr);c.height=Math.round(size.h*dpr);const ctx=c.getContext('2d');if(!ctx)return;ctx.scale(dpr,dpr);ctx.clearRect(0,0,size.w,size.h);
    const {x:ox,y:oy,cell}=view;ctx.fillStyle='#fffefb';ctx.shadowColor='#233b2220';ctx.shadowBlur=22;ctx.fillRect(ox,oy,shown.width*cell,shown.height*cell);ctx.shadowBlur=0;
    const x0=Math.max(0,Math.floor(-ox/cell)),y0=Math.max(0,Math.floor(-oy/cell)),x1=Math.min(shown.width,Math.ceil((size.w-ox)/cell)),y1=Math.min(shown.height,Math.ceil((size.h-oy)/cell));
    for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++){const id=shown.tiles[y*shown.width+x],left=ox+x*cell,top=oy+y*cell;if(id>=0&&images.current[id])ctx.drawImage(images.current[id],left,top,cell+.15,cell+.15);else if(id<0){ctx.fillStyle='#f0eee8';ctx.fillRect(left,top,cell/2,cell/2);ctx.fillRect(left+cell/2,top+cell/2,cell/2,cell/2);}}
    if(lines){ctx.beginPath();ctx.strokeStyle='#596e5440';ctx.lineWidth=.7;for(let x=x0;x<=x1;x++){ctx.moveTo(ox+x*cell,Math.max(0,oy));ctx.lineTo(ox+x*cell,Math.min(size.h,oy+shown.height*cell));}for(let y=y0;y<=y1;y++){ctx.moveTo(Math.max(0,ox),oy+y*cell);ctx.lineTo(Math.min(size.w,ox+shown.width*cell),oy+y*cell);}ctx.stroke();}
    if(document.activeElement===c){ctx.strokeStyle='#b96837';ctx.lineWidth=3;ctx.strokeRect(ox+(focus%grid.width)*cell+2,oy+Math.floor(focus/grid.width)*cell+2,cell-4,cell-4);}
  },[shown,view,size,lines,ready,focus]);
  function paint(p:{x:number;y:number}){const x=Math.floor((p.x-view.x)/view.cell),y=Math.floor((p.y-view.y)/view.cell);if(!working.current)working.current={...grid,tiles:[...grid.tiles]};const start=last.current||{x,y},steps=Math.max(Math.abs(x-start.x),Math.abs(y-start.y),1);for(let i=0;i<=steps;i++){const xx=Math.round(start.x+(x-start.x)*i/steps),yy=Math.round(start.y+(y-start.y)*i/steps);if(xx>=0&&xx<grid.width&&yy>=0&&yy<grid.height)working.current.tiles[yy*grid.width+xx]=selected;}last.current={x,y};setDraft({...working.current});}
  function finish(){if(working.current)onCommit(working.current);working.current=null;setDraft(null);last.current=null;}
  function position(e:React.PointerEvent){const r=e.currentTarget.getBoundingClientRect();return {x:e.clientX-r.left,y:e.clientY-r.top};}
  function zoom(factor:number,cx=size.w/2,cy=size.h/2){setView(v=>{const cell=Math.max(2,Math.min(240,v.cell*factor)),f=cell/v.cell;return {cell,x:cx-(cx-v.x)*f,y:cy-(cy-v.y)*f};});}
  return <section className="workspace" aria-label="地磚拼貼工作區"><div className="board" ref={host}>
    <canvas ref={canvas} tabIndex={0} role="application" aria-label={`${grid.width} × ${grid.height} 地磚畫布，方向鍵移動，空白鍵填入，Delete 清除。`} onFocus={()=>setFocus(n=>n)}
      onPointerDown={e=>{if(e.button!==0)return;e.currentTarget.setPointerCapture(e.pointerId);const p=position(e);points.current.set(e.pointerId,p);if(points.current.size>1){gesture.current=true;working.current=null;setDraft(null);last.current=null;}else if(mode==='paint')paint(p);}}
      onPointerMove={e=>{const old=points.current.get(e.pointerId);if(!old)return;const p=position(e);if(points.current.size>=2){const other=[...points.current.entries()].find(([id])=>id!==e.pointerId)![1],d0=Math.hypot(old.x-other.x,old.y-other.y),d1=Math.hypot(p.x-other.x,p.y-other.y),cx=(old.x+other.x)/2,cy=(old.y+other.y)/2;setView(v=>{const cell=Math.max(2,Math.min(240,v.cell*(d0>0?d1/d0:1))),f=cell/v.cell;return {cell,x:cx-(cx-v.x)*f+(p.x-old.x)/2,y:cy-(cy-v.y)*f+(p.y-old.y)/2};});}else if(mode==='pan'||gesture.current)setView(v=>({...v,x:v.x+p.x-old.x,y:v.y+p.y-old.y}));else paint(p);points.current.set(e.pointerId,p);}}
      onPointerUp={e=>{points.current.delete(e.pointerId);if(!points.current.size){finish();gesture.current=false;}}}
      onPointerCancel={e=>{points.current.delete(e.pointerId);if(!points.current.size){finish();gesture.current=false;}}}
      onLostPointerCapture={e=>{if(points.current.has(e.pointerId)){points.current.delete(e.pointerId);finish();}}}
      onWheel={e=>{zoom(e.deltaY<0?1.1:1/1.1,e.nativeEvent.offsetX,e.nativeEvent.offsetY);}}
      onKeyDown={e=>{const moves:Record<string,number>={ArrowLeft:-1,ArrowRight:1,ArrowUp:-grid.width,ArrowDown:grid.width};if(e.key in moves){e.preventDefault();setFocus(f=>Math.max(0,Math.min(grid.tiles.length-1,f+moves[e.key])));}if(e.key===' '||e.key==='Enter'||e.key==='Delete'){e.preventDefault();const tiles=[...grid.tiles];tiles[focus]=e.key==='Delete'?-1:selected;onCommit({...grid,tiles});}}}/>
    <div className="axis-label">{grid.width} 格 × {grid.height} 格</div>
    <div className="zoom-control"><button aria-label="縮小" onClick={()=>zoom(1/1.25)}>−</button><span>{Math.round(view.cell/48*100)}%</span><button aria-label="放大" onClick={()=>zoom(1.25)}>＋</button><i/><button onClick={fit}>符合畫面</button></div>
  </div></section>;
}
