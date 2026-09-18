import { env } from "cloudflare:workers";
import { getDb } from "@/db";
import { records, measurements } from "@/db/schema";
import { eq } from "drizzle-orm";
export async function GET(_request:Request,{params}:{params:Promise<{key:string}>}) {
  try {const {key}=await params;const row=await getDb().select({id:records.id}).from(records).where(eq(records.imageKey,key)).limit(1);const other=await getDb().select({id:measurements.id}).from(measurements).where(eq(measurements.imageKey,key)).limit(1);if(!row.length&&!other.length)return new Response(null,{status:404});const image=await env.BUCKET?.get(key);if(!image)return new Response(null,{status:404});return new Response(image.body,{headers:{"Content-Type":image.httpMetadata?.contentType??"image/jpeg","Cache-Control":"private, max-age=3600","X-Content-Type-Options":"nosniff"}})}
  catch(error){console.error(error);return new Response(null,{status:503})}
}
