export function validateElement(raw){
  const fail=()=>{throw new Error("Invalid element");};
  if(!raw||raw.version!==1||typeof raw.id!=="string"||!/^[a-f0-9-]{36}$/i.test(raw.id))fail();
  if(!["mineral","porcelain","glass"].includes(raw.material)||typeof raw.color!=="string"||!/^#[a-f0-9]{6}$/i.test(raw.color))fail();
  if(!Array.isArray(raw.strokes)||!raw.strokes.length||raw.strokes.length>12)fail();
  let count=0;
  const strokes=raw.strokes.map(stroke=>{
    if(!Array.isArray(stroke)||stroke.length<2||stroke.length>160)fail();
    count+=stroke.length;
    return stroke.map(p=>{if(!Array.isArray(p)||p.length!==2||p.some(n=>!Number.isFinite(n)||n<0||n>1))fail();return p.map(n=>Math.round(n*100000)/100000);});
  });
  if(count>1440)fail();
  let message="";
  if(raw.message!==undefined){
    if(typeof raw.message!=="string"||raw.message.length>240||/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(raw.message))fail();
    message=raw.message.replace(/\r\n?/g,"\n").trim();
  }
  const p=raw.placement,a=p?.anchor,b=p?.basis;
  if(!a||[a.x,a.y,a.z].some(n=>!Number.isFinite(n))||a.x< -300||a.x>1900||a.y< -400||a.y>3100||Math.abs(a.z)>1200||!Number.isFinite(p.scale)||p.scale<.02||p.scale>.2)fail();
  if(!Array.isArray(b)||b.length!==9||b.some(n=>!Number.isFinite(n)||Math.abs(n)>1.001))fail();
  const dot=(a,c)=>a.reduce((n,v,i)=>n+v*c[i],0),cols=[b.slice(0,3),b.slice(3,6),b.slice(6,9)];
  if(cols.some(c=>Math.abs(dot(c,c)-1)>.02)||Math.abs(dot(cols[0],cols[1]))>.02||Math.abs(dot(cols[0],cols[2]))>.02||Math.abs(dot(cols[1],cols[2]))>.02)fail();
  const det=b[0]*(b[4]*b[8]-b[5]*b[7])-b[3]*(b[1]*b[8]-b[2]*b[7])+b[6]*(b[1]*b[5]-b[2]*b[4]);
  if(det<.98)fail();
  return {version:1,id:raw.id.toLowerCase(),material:raw.material,color:raw.color.toLowerCase(),strokes,...(message?{message}:{}),placement:{anchor:{x:a.x,y:a.y,z:a.z},basis:b,scale:p.scale}};
}
