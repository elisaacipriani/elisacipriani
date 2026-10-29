// Regression: a closed drawing must enclose real volume with a seamless surface.
const path=require('node:path'),fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');const c={window:{},Float32Array,Float64Array,Uint16Array,Math};vm.createContext(c);for(const file of ['nire-inflate.js','nire-elements.js'])vm.runInContext(fs.readFileSync(path.join(__dirname,'../assets/js',file),'utf8'),c);
function curve(a,b,d,e,n){return Array.from({length:n},(_,i)=>{const t=i/(n-1),u=1-t;return [0,1].map(k=>u*u*u*a[k]+3*u*u*t*b[k]+3*u*t*t*d[k]+t*t*t*e[k])})}
const drop=[...curve([.5,.08],[.5,.35],[.2,.56],[.2,.72],31),...curve([.2,.72],[.2,1],[.8,1],[.8,.72],31).slice(1),...curve([.8,.72],[.8,.56],[.5,.35],[.5,.08],31).slice(1)];
const circle=(x=.5,y=.5,r=.3)=>Array.from({length:81},(_,i)=>[x+Math.cos(i/80*Math.PI*2)*r,y+Math.sin(i/80*Math.PI*2)*r]);
const fixtures={drop:[drop],circle:[circle()],gap:[drop.slice(0,-5)],twoHalves:[circle().slice(0,41),circle().slice(40)],overlap:[circle(.4,.5,.25),circle(.6,.5,.25)],separate:[circle(.2,.5,.15),circle(.8,.5,.15)]};
for(const quality of [false,true])for(const [name,strokes]of Object.entries(fixtures)){
 const began=performance.now(),geometry=c.window.NireElementGeometry.mesh(strokes,quality);assert.equal(geometry.solids,name==='separate'?2:1,name+' filled');let volume=0,total=0;
 for(const batch of geometry.batches){const v=batch.vertices,index=batch.indices,edges=new Map();let min=[Infinity,Infinity,Infinity],max=[-Infinity,-Infinity,-Infinity];for(let i=0;i<v.length;i+=6){for(let k=0;k<3;k++){assert.ok(Number.isFinite(v[i+k]));min[k]=Math.min(min[k],v[i+k]);max[k]=Math.max(max[k],v[i+k]);}assert.ok(Math.abs(Math.hypot(...v.slice(i+3,i+6))-1)<1e-5,'unit normals')}
 assert.ok(max[2]-min[2]>(Math.min(max[0]-min[0],max[1]-min[1]))*.8,'real depth');
 for(let i=0;i<index.length;i+=3){const a=index[i],b=index[i+1],d=index[i+2];for(const [x,y]of[[a,b],[b,d],[d,a]]){const key=x<y?x+','+y:y+','+x;edges.set(key,(edges.get(key)||0)+1)}const p=Array.from(v.slice(a*6,a*6+3)),q=Array.from(v.slice(b*6,b*6+3)),r=Array.from(v.slice(d*6,d*6+3));volume+=(p[0]*(q[1]*r[2]-q[2]*r[1])+p[1]*(q[2]*r[0]-q[0]*r[2])+p[2]*(q[0]*r[1]-q[1]*r[0]))/6}
 assert.ok([...edges.values()].every(n=>n===2),'closed watertight '+name);total+=v.length/6;assert.ok(v.length/6<65536);
 }
 assert.ok(volume>.03,name+' has solid volume');if(name==='circle')assert.ok(Math.abs(volume-(4*Math.PI/3*.5*.5*.46))<.025,'rounded sphere volume');console.log({name,quality,vertices:total,triangles:geometry.triangles,volume,ms:Math.round(performance.now()-began)});
}
const open=c.window.NireElementGeometry.mesh([[[.2,.2],[.8,.8]]],true);assert.equal(open.solids,0);assert.ok(open.triangles>0);console.log('Filled geometry, welded edges, volume, normals and open strokes passed.');
