import {env} from "cloudflare:workers";

type Quota={warning:string;used:number|null;limit:number|null};
const models=["gemini-2.5-flash","gemini-2.5-flash-lite"] as const;
function budget():number|null{const n=Number(env.AI_DAILY_REQUEST_LIMIT);return Number.isInteger(n)&&n>0?n:null}
async function reserve(model:string):Promise<Quota>{
 const limit=budget(),db=env.DB;
 if(limit&&!db)throw Error("quota-setup");
 if(!limit)return {warning:"ยังไม่ได้ตั้งเพดานรายวัน: ดูโควตาจริงใน Google AI Studio",used:null,limit};
 // Approximate per-model request cap, reset at midnight Pacific time (Google RPD).
 const day=new Intl.DateTimeFormat("en-CA",{timeZone:"America/Los_Angeles",year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date());
 try{
  const saved=await db!.prepare("INSERT INTO ai_usage (day, model, count) VALUES (?, ?, 1) ON CONFLICT(day,model) DO UPDATE SET count=count+1 WHERE count < ?").bind(day,model,limit).run();
  if(!saved.meta.changes)throw Error("quota");
  const row=await db!.prepare("SELECT count FROM ai_usage WHERE day=? AND model=?").bind(day,model).first<{count:number}>();
  if(!row||row.count>limit)throw Error("quota");
  // Atomic reservation above prevents running beyond cap except for the last allowed call.
  if(model===models[0]&&row.count>=Math.ceil(limit*.8))throw Error("near-quota");
  return {warning:row.count>=Math.ceil(limit*.8)?`ใกล้ถึงเพดานที่ตั้งไว้ (${row.count}/${limit} คำขอของ ${model} วันนี้)`:"",used:row.count,limit};
 }catch(error){if(error instanceof Error&&["quota","near-quota"].includes(error.message))throw error;throw Error("quota-setup")}
}
export async function analyzeImages(images:File[],prompt:string):Promise<{data:Record<string,unknown>;provider:string;warning:string}>{
 if(!env.GEMINI_API_KEY)throw Error("ยังไม่ได้ตั้ง GEMINI_API_KEY ใน Cloudflare Secrets");
 const parts:({text:string}|{inline_data:{mime_type:string;data:string}})[]=[{text:prompt}];
 for(const image of images){const bytes=new Uint8Array(await image.arrayBuffer());let binary="";for(let i=0;i<bytes.length;i+=8192)binary+=String.fromCharCode(...bytes.subarray(i,i+8192));parts.push({inline_data:{mime_type:image.type,data:btoa(binary)}})}
 let warning="";
 for(const model of models){
  let quota:Quota;
  try{quota=await reserve(model)}catch(error){if(error instanceof Error&&error.message==="quota-setup")throw Error("ยังไม่ตั้งตาราง ai_usage สำหรับตรวจโควตา");warning="โควตาโมเดลหลักใกล้ถึงเพดานที่ตั้งไว้หรือใช้เต็มแล้ว จึงสลับเป็นโมเดลฟรีสำรอง";continue}
  const response=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,{method:"POST",headers:{"Content-Type":"application/json","x-goog-api-key":env.GEMINI_API_KEY},body:JSON.stringify({contents:[{role:"user",parts}],generationConfig:{responseMimeType:"application/json",temperature:0,maxOutputTokens:8192}}),signal:AbortSignal.timeout(45000)});
  if(response.status===429){warning="บริการ AI แจ้งว่าโควตาหรืออัตราคำขอของโมเดลหลักเต็มแล้ว กำลังลองโมเดลสำรอง";continue}
  if(!response.ok)throw Error(`บริการ AI ไม่พร้อม (${response.status})`);
  const result=await response.json() as {candidates?:{content?:{parts?:{text?:string}[]}}[]};
  const raw=result.candidates?.[0]?.content?.parts?.map(p=>p.text||"").join("")||"{}";
  const data=JSON.parse(raw) as Record<string,unknown>;
  return {data,provider:model,warning:[warning,quota.warning].filter(Boolean).join(" · ")};
 }
 throw Error("โควตา AI ทั้งสองโมเดลใช้ไม่ได้ในขณะนี้");
}
