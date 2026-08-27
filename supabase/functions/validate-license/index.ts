import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import {createClient} from "jsr:@supabase/supabase-js@2";
Deno.serve(async(req)=>{
 const auth=req.headers.get("Authorization");if(!auth)return new Response("Unauthorized",{status:401});
 const sb=createClient(Deno.env.get("SUPABASE_URL")!,Deno.env.get("SUPABASE_ANON_KEY")!,{global:{headers:{Authorization:auth}}});
 const {data:{user}}=await sb.auth.getUser();if(!user)return new Response("Unauthorized",{status:401});
 const {data}=await sb.rpc("ai_license_status");
 const lic=data?.[0]||null;
 return Response.json({licensed:!!lic&&["active","trialing"].includes(lic.license_status),license:lic});
});