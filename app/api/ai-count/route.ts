import {analyzeImages} from "@/lib/ai-vision";
export async function POST(request:Request){
 try{
  const form=await request.formData(),image=form.get("image"),kind=form.get("kind");
  if(!(image instanceof File)||image.size>8_000_000||!["image/jpeg","image/png","image/webp"].includes(image.type)||!["colony","cell"].includes(String(kind)))return Response.json({error:"ภาพไม่ถูกต้อง"},{status:400});
  const prompt=kind==="colony"?"Count individual visible colonies on the culture plate. Avoid plate edge, reflections, text, artifacts and merged non-colony patches.":"Count individual visible cells. Label live/dead only if the stain and appearance genuinely support it; otherwise use unknown.";
  const result=await analyzeImages([image],`${prompt} Return JSON object with points array of {x,y,type}; x and y are percent coordinates 0..100 from top-left of the ORIGINAL image (not 0..1000), type is live, dead or unknown for cells. Max 500 points. If uncertain omit a point rather than invent. Also return note string. This is a suggestion requiring human visual review.`);
  const raw=Array.isArray(result.data.points)?result.data.points:[];
  const points=raw.slice(0,500).filter((p):p is Record<string,unknown>=>typeof p==="object"&&p!==null).map(p=>({x:Number(p.x),y:Number(p.y),type:p.type==="dead"?"dead":p.type==="live"?"live":"unknown"})).filter(p=>Number.isFinite(p.x)&&Number.isFinite(p.y)&&p.x>=0&&p.x<=100&&p.y>=0&&p.y<=100);
  return Response.json({points,note:String(result.data.note||"").slice(0,300),provider:result.provider,warning:result.warning});
 }catch(error){return Response.json({error:error instanceof Error?error.message:"วิเคราะห์ไม่สำเร็จ"},{status:503})}
}
