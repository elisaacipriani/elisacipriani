import assert from "node:assert/strict";
import {DatabaseSync} from "node:sqlite";
import {readFileSync} from "node:fs";
import {randomUUID} from "node:crypto";
import worker from "./worker.mjs";
const sqlite=new DatabaseSync(":memory:");
sqlite.exec(readFileSync(new URL("./schema.sql",import.meta.url),"utf8"));
// Run the Worker's actual SQL against SQLite using the D1 prepared-statement API.
const env={ALLOWED_ORIGINS:"https://elisacipriani.xyz",DB:{prepare(sql){return {bind(...values){return {
  async first(){return sqlite.prepare(sql).get(...values)||null;},
  async all(){return {results:sqlite.prepare(sql).all(...values)};},
  async run(){return sqlite.prepare(sql).run(...values);}
};}};}}};
const example=()=>({version:1,id:randomUUID(),strokes:[[[.2,.3],[.5,.7],[.7,.4]]],material:"glass",color:"#85bcb5",placement:{anchor:{x:800,y:1000,z:10},basis:[1,0,0,0,1,0,0,0,1],scale:.09}});
const request=(body,options={})=>worker.fetch(new Request("https://nire.example/api/nire/elements"+(options.query||""),{
  method:options.method||(body?"POST":"GET"),headers:{"Origin":"https://elisacipriani.xyz",...(body?{"Content-Type":"application/json"}:{}),...options.headers},...(body?{body:JSON.stringify(body)}:{})
}),env);
const item=example();let response=await request(item);assert.equal(response.status,201);assert.equal(response.headers.get("Access-Control-Allow-Origin"),"https://elisacipriani.xyz");
assert.equal((await response.json()).element.id,item.id);assert.equal((await request(item)).status,200);
assert.equal((await request({...item,color:"#ffffff"})).status,409);assert.equal((await request({...example(),strokes:[[[0,0],[2,2]]]})).status,400);
assert.equal((await request(null,{headers:{"Origin":"https://unrelated.example"}})).status,403);
assert.equal((await request({...example(),padding:"x".repeat(65000)})).status,413);
const preflight=await request(null,{method:"OPTIONS"});assert.equal(preflight.status,204);assert.match(preflight.headers.get("Access-Control-Allow-Methods"),/POST/);
const written={...example(),message:"  Una semilla 🌿\r\n<b>que crece</b>.  "};written.placement.scale=.18;
const writtenResponse=await request(written);assert.equal(writtenResponse.status,201);const saved=(await writtenResponse.json()).element;
assert.equal(saved.message,"Una semilla 🌿\n<b>que crece</b>.");assert.equal(saved.placement.scale,.18);assert.equal((await request(written)).status,200);
for(const message of [null,17,"a".repeat(241),"🌿".repeat(121),"bad\u0000message"])assert.equal((await request({...example(),message})).status,400);
for(const scale of [.019,.201]){const bad=example();bad.placement.scale=scale;assert.equal((await request(bad)).status,400);}
const small=example();small.placement.scale=.0225;assert.equal((await request(small)).status,201);
for(let i=0;i<27;i++)assert.equal((await request(example())).status,201);
assert.equal((await request(example())).status,429);const data=await(await request()).json();assert.equal(data.elements.length,30);
assert.equal((await(await request(null,{query:"?after="+data.cursor})).json()).elements.length,0);
assert.equal((await request(item)).status,200,"a retry still succeeds after the daily limit");
sqlite.close();console.log("Worker: durable SQL, idempotency, cursor, validation, CORS and daily limit passed.");
