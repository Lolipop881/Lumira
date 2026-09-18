import { env } from "cloudflare:workers";
import { getDb } from "@/db";
import { measurements } from "@/db/schema";
import { desc } from "drizzle-orm";
export async function GET(){
 try{return Response.json(await getDb().select().from(measurements).orderBy(desc(measurements.createdAt)).limit(200))}
 catch(error){console.error(error);return Response.json({error:"unavailable"},{status:503})}
}
export async function POST(request:Request){
 let key:string|null=null;
 try{
  const form=await request.formData();
  const kind=String(form.get("kind")??""),title=String(form.get("title")??"").trim(),data=String(form.get("data")??"");
  if(!["cell","organism","recipe","lab"].includes(kind)||!title||title.length>200||data.length>50000)return Response.json({error:"invalid"},{status:400});
  const parsed=JSON.parse(data);if(typeof parsed!=="object"||parsed===null||Array.isArray(parsed))return Response.json({error:"invalid data"},{status:400});
  const image=form.get("image");
  if(image instanceof File && image.size){
   if(image.size>8_000_000||!["image/jpeg","image/png","image/webp"].includes(image.type)||!env.BUCKET)return Response.json({error:"invalid image"},{status:400});
   key=crypto.randomUUID()+"."+({"image/jpeg":"jpg","image/png":"png","image/webp":"webp"} as Record<string,string>)[image.type];
   await env.BUCKET.put(key,image.stream(),{httpMetadata:{contentType:image.type}});
  }
  const row={id:crypto.randomUUID(),kind,title,data,imageKey:key,createdAt:new Date().toISOString()};
  await getDb().insert(measurements).values(row);return Response.json(row,{status:201});
 }catch(error){console.error(error);if(key)await env.BUCKET?.delete(key).catch(()=>{});return Response.json({error:"unavailable"},{status:503})}
}
