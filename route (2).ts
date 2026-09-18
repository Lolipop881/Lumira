import { getDb } from "@/db";
import { records } from "@/db/schema";
import { desc } from "drizzle-orm";

export async function GET() {
  try { return Response.json(await getDb().select().from(records).orderBy(desc(records.createdAt)).limit(100)); }
  catch (error) { console.error(error); return Response.json({ error: "unavailable" }, { status: 503 }); }
}
export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const data = JSON.parse(String(form.get("record") ?? ""));
    const count = data.points?.length;
    if (typeof data.name !== "string" || !data.name.trim() || data.name.length > 200 || typeof data.sampleId !== "string" || !data.sampleId.trim() || data.sampleId.length > 100 || !Array.isArray(data.points) || count > 10000 || data.points.some((p: {x:number;y:number;rx?:number;ry?:number}) => !Number.isFinite(p.x) || !Number.isFinite(p.y) || p.x<0 || p.x>100 || p.y<0 || p.y>100 || (p.rx!==undefined&&(!Number.isFinite(p.rx)||p.rx<0||p.rx>25||p.x-p.rx<0||p.x+p.rx>100)) || (p.ry!==undefined&&(!Number.isFinite(p.ry)||p.ry<0||p.ry>25||p.y-p.ry<0||p.y+p.ry>100)))) return Response.json({error:"invalid record"},{status:400});
    const dilution=Number(data.dilution),volume=Number(data.volume);
    if (!Number.isInteger(dilution)||dilution<0||dilution>20||!Number.isFinite(volume)||volume<=0) return Response.json({error:"invalid values"},{status:400});
    const id=crypto.randomUUID();
    const row={id,name:data.name.trim(),sampleId:data.sampleId.trim(),medium:String(data.medium??"").slice(0,100),location:String(data.location??"").slice(0,200),collectedAt:String(data.collectedAt??"").slice(0,40),sampleType:String(data.sampleType??"").slice(0,100),platingMethod:String(data.platingMethod??"").slice(0,100),incubationHours:String(data.incubationHours??"").slice(0,30),customField:String(data.customField??"").slice(0,2000),temperature:String(data.temperature??"").slice(0,30),notes:String(data.notes??"").slice(0,3000),dilution,volume,count,cfu:count*10**dilution/volume,points:JSON.stringify(data.points),imageKey:"",createdAt:new Date().toISOString()};
    await getDb().insert(records).values(row);
    return Response.json({...row,points:data.points},{status:201});
  } catch(error) { console.error(error); return Response.json({error:"save unavailable"},{status:503}); }
}
