import {validateElement} from "./validation.mjs";
const route="/api/nire/elements";
function json(data,status=200,origin=""){
  return new Response(JSON.stringify(data),{status,headers:{"Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store","X-Content-Type-Options":"nosniff",...(origin?{"Access-Control-Allow-Origin":origin,"Vary":"Origin"}:{})}});
}
const unpack=row=>({...JSON.parse(row.payload),seq:row.seq,createdAt:row.created_at});
export default {
  async fetch(request,env){
    const url=new URL(request.url),origin=request.headers.get("Origin")||"",allowed=(env.ALLOWED_ORIGINS||"").split(",").map(x=>x.trim()),cors=allowed.includes(origin)?origin:"";
    if(url.pathname!==route)return json({error:"Not found"},404,cors);
    if(origin&&!cors)return json({error:"Origin not allowed"},403);
    if(request.method==="OPTIONS")return new Response(null,{status:204,headers:{"Access-Control-Allow-Origin":cors,"Access-Control-Allow-Methods":"GET, POST, OPTIONS","Access-Control-Allow-Headers":"Content-Type","Access-Control-Max-Age":"600","Vary":"Origin"}});
    try{
      if(request.method==="GET"){
        const after=Number(url.searchParams.get("after")||0);if(!Number.isSafeInteger(after)||after<0)return json({error:"Invalid cursor"},400,cors);
        const result=await env.DB.prepare("SELECT seq, created_at, payload FROM elements WHERE seq > ? ORDER BY seq LIMIT 200").bind(after).all();
        const rows=result.results||[];
        return json({elements:rows.map(unpack),cursor:rows.at(-1)?.seq||after,hasMore:rows.length===200},200,cors);
      }
      if(request.method!=="POST")return json({error:"Method not allowed"},405,cors);
      if(!request.headers.get("Content-Type")?.startsWith("application/json"))return json({error:"JSON required"},415,cors);
      const reader=request.body?.getReader();if(!reader)return json({error:"Body required"},400,cors);
      let size=0;const chunks=[];for(;;){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>60000){await reader.cancel();return json({error:"Element too large"},413,cors)}chunks.push(value);}
      const bytes=new Uint8Array(size);let offset=0;for(const c of chunks){bytes.set(c,offset);offset+=c.length;}
      let element;try{element=validateElement(JSON.parse(new TextDecoder().decode(bytes)))}catch(_){return json({error:"Invalid element"},400,cors);}
      const existing=await env.DB.prepare("SELECT seq,created_at,payload FROM elements WHERE id = ?").bind(element.id).first();
      if(existing){
        if(existing.payload!==JSON.stringify(element))return json({error:"Element already exists"},409,cors);
        return json({element:unpack(existing)},200,cors);
      }
      const ip=request.headers.get("CF-Connecting-IP")||"unknown";
      const hash=await crypto.subtle.digest("SHA-256",new TextEncoder().encode("nire:"+ip));
      const actor=Array.from(new Uint8Array(hash)).map(v=>v.toString(16).padStart(2,"0")).join("");
      const since=new Date(Date.now()-86400000).toISOString(),createdAt=new Date().toISOString(),payload=JSON.stringify(element);
      // The limit check and append are one statement, so parallel requests cannot bypass it.
      await env.DB.prepare("INSERT OR IGNORE INTO elements(id,created_at,actor,payload) SELECT ?,?,?,? WHERE (SELECT COUNT(*) FROM elements WHERE actor = ? AND created_at > ?) < 30").bind(element.id,createdAt,actor,payload,actor,since).run();
      const row=await env.DB.prepare("SELECT seq,created_at,payload FROM elements WHERE id = ?").bind(element.id).first();
      if(!row)return json({error:"Daily limit reached"},429,cors);
      if(row.payload!==payload)return json({error:"Element already exists"},409,cors);
      return json({element:unpack(row)},201,cors);
    }catch(_){return json({error:"Storage unavailable"},503,cors);}
  }
};
