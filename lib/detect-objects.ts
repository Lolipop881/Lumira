export type DetectedPoint = {x:number;y:number};

// Local adaptive threshold and connected components. Suggestions require visual review.
export async function detectObjects(url:string, contrast:number, minimum:number, polarity:"dark"|"light"):Promise<DetectedPoint[]> {
  const image=new Image();image.src=url;await image.decode();
  const scale=Math.min(1,720/Math.max(image.naturalWidth,image.naturalHeight));
  const w=Math.max(1,Math.round(image.naturalWidth*scale)),h=Math.max(1,Math.round(image.naturalHeight*scale));
  const canvas=document.createElement("canvas");canvas.width=w;canvas.height=h;
  const ctx=canvas.getContext("2d",{willReadFrequently:true});if(!ctx)throw Error("Canvas unavailable");
  ctx.drawImage(image,0,0,w,h);
  const rgba=ctx.getImageData(0,0,w,h).data;
  const gray=new Uint8Array(w*h), integral=new Float64Array((w+1)*(h+1));
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){
    const i=y*w+x,j=i*4;gray[i]=Math.round(.299*rgba[j]+.587*rgba[j+1]+.114*rgba[j+2]);
    integral[(y+1)*(w+1)+x+1]=gray[i]+integral[y*(w+1)+x+1]+integral[(y+1)*(w+1)+x]-integral[y*(w+1)+x];
  }
  const mask=new Uint8Array(w*h),radius=Math.max(12,Math.round(Math.min(w,h)/25));
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){
    const x0=Math.max(0,x-radius),x1=Math.min(w,x+radius+1),y0=Math.max(0,y-radius),y1=Math.min(h,y+radius+1);
    const mean=(integral[y1*(w+1)+x1]-integral[y0*(w+1)+x1]-integral[y1*(w+1)+x0]+integral[y0*(w+1)+x0])/((x1-x0)*(y1-y0));
    const delta=gray[y*w+x]-mean;
    if((polarity==="dark"?-delta:delta)>contrast)mask[y*w+x]=1;
  }
  const visited=new Uint8Array(w*h),found:DetectedPoint[]=[],queue=new Int32Array(w*h),maxArea=Math.min(9000,Math.round(w*h*.025));
  for(let y=1;y<h-1;y++)for(let x=1;x<w-1;x++){
    const seed=y*w+x;if(!mask[seed]||visited[seed])continue;
    let head=0,tail=1,area=0,sumX=0,sumY=0,minX=x,maxX=x,minY=y,maxY=y;
    queue[0]=seed;visited[seed]=1;
    while(head<tail){
      const i=queue[head++],cy=(i/w)|0,cx=i-cy*w;area++;sumX+=cx;sumY+=cy;
      minX=Math.min(minX,cx);maxX=Math.max(maxX,cx);minY=Math.min(minY,cy);maxY=Math.max(maxY,cy);
      for(const next of [i-1,i+1,i-w,i+w]){
        const ny=(next/w)|0,nx=next-ny*w;
        if(nx<1||nx>=w-1||ny<1||ny>=h-1||!mask[next]||visited[next])continue;
        visited[next]=1;queue[tail++]=next;
      }
    }
    const ratio=(maxX-minX+1)/(maxY-minY+1);
    if(area>=minimum&&area<=maxArea&&ratio>.28&&ratio<3.5&&area/((maxX-minX+1)*(maxY-minY+1))>.12)found.push({x:sumX/area/w*100,y:sumY/area/h*100});
    if(found.length>=3000)return found;
  }
  return found;
}
