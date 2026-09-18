"use client";
import {useState} from "react";
export type CountCircle={x:number;y:number;rx:number;ry:number;type?:"live"|"dead"};
const clamp=(n:number)=>Math.min(100,Math.max(0,n));
export function CountImage({url,alt,circles,onChange,kind="colony",active="live"}:{url:string;alt:string;circles:CountCircle[];onChange:(next:CountCircle[])=>void;kind?:"colony"|"cell";active?:"live"|"dead"}){
 const [start,setStart]=useState<{x:number;y:number}|null>(null),[draft,setDraft]=useState<CountCircle|null>(null);
 function pos(e:React.PointerEvent<HTMLDivElement>){const r=e.currentTarget.getBoundingClientRect();return {x:clamp((e.clientX-r.left)/r.width*100),y:clamp((e.clientY-r.top)/r.height*100)}}
 function circle(a:{x:number;y:number},b:{x:number;y:number}):CountCircle{return {x:a.x,y:a.y,rx:Math.min(Math.abs(b.x-a.x),a.x,100-a.x),ry:Math.min(Math.abs(b.y-a.y),a.y,100-a.y),...(kind==="cell"?{type:active}:{})}}
 return <div className="photo-inner circle-canvas" onPointerDown={e=>{if(e.target!==e.currentTarget&&e.target instanceof HTMLElement&&e.target.closest("button"))return;const a=pos(e);setStart(a);setDraft(circle(a,a));e.currentTarget.setPointerCapture(e.pointerId)}} onPointerMove={e=>{if(start)setDraft(circle(start,pos(e)))}} onPointerUp={e=>{if(!start)return;const end=circle(start,pos(e));const minRadius=1.2;onChange([...circles,{...end,rx:end.rx<.6?minRadius:end.rx,ry:end.ry<.6?minRadius:end.ry}]);setStart(null);setDraft(null);e.currentTarget.releasePointerCapture(e.pointerId)}} onPointerCancel={()=>{setStart(null);setDraft(null)}}>
 <img src={url} alt={alt} draggable={false}/>
 {[...circles,...(draft?[draft]:[])].map((p,i)=><button type="button" key={i} className={"count-ring "+(p.type||"")+(i===circles.length?" preview":"")} style={{left:p.x+"%",top:p.y+"%",width:Math.max(1.5,p.rx*2)+"%",height:Math.max(1.5,p.ry*2)+"%"}} onPointerDown={e=>e.stopPropagation()} onClick={e=>{e.stopPropagation();if(i<circles.length)onChange(circles.filter((_,j)=>j!==i))}} aria-label={i<circles.length?`ลบวงที่ ${i+1}`:"วงที่กำลังวาด"}><span>{i+1}</span></button>)}
 </div>
}
