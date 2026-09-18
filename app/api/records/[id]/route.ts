import { env } from "cloudflare:workers";
import { getDb } from "@/db";
import { records } from "@/db/schema";
import { eq } from "drizzle-orm";
export async function DELETE(_request:Request,{params}:{params:Promise<{id:string}>}) {
  try { const {id}=await params; const rows=await getDb().select().from(records).where(eq(records.id,id)).limit(1);if(!rows.length)return new Response(null,{status:404});await getDb().delete(records).where(eq(records.id,id));await env.BUCKET?.delete(rows[0].imageKey);return new Response(null,{status:204}); }
  catch(error){console.error(error);return Response.json({error:"delete unavailable"},{status:503})}
}
