import { getDb } from "@/db";
import { measurements } from "@/db/schema";
import { desc } from "drizzle-orm";
export async function GET(){
 try{return Response.json(await getDb().select().from(measurements).orderBy(desc(measurements.createdAt)).limit(200))}
 catch(error){console.error(error);return Response.json({error:"unavailable"},{status:503})}
}
export async function POST(request:Request){
 try{
  const form=await request.formData();
  const kind=String(form.get("kind")??""),title=String(form.get("title")??"").trim(),data=String(form.get("data")??"");
  if(!["cell","organism","recipe","lab"].includes(kind)||!title||title.length>200||data.length>50000)return Response.json({error:"invalid"},{status:400});
  const parsed=JSON.parse(data);if(typeof parsed!=="object"||parsed===null||Array.isArray(parsed))return Response.json({error:"invalid data"},{status:400});
  const row={id:crypto.randomUUID(),kind,title,data,imageKey:null,createdAt:new Date().toISOString()};
  await getDb().insert(measurements).values(row);return Response.json(row,{status:201});
 }catch(error){console.error(error);return Response.json({error:"unavailable"},{status:503})}
}
