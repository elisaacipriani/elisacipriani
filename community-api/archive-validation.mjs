export function validateArchiveEntry(raw){
  const fail=()=>{throw new Error('Invalid archive entry');};
  if(!raw||raw.version!==1||typeof raw.id!=='string'||!/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(raw.id))fail();
  const plain=(value,max,required=false)=>{if(typeof value!=='string'||value.length>max||/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(value)||/[\ud800-\udfff]/u.test(value))fail();const text=value.replace(/\r\n?/g,'\n').trim();if(required&&!text)fail();return text;};
  const title=plain(raw.title,80,true),text=plain(raw.text,2400,true),author=plain(raw.author??'',80),sourceId=plain(raw.sourceId??'',80);
  if(sourceId&&!/^[a-z0-9-]+$/i.test(sourceId))fail();
  if(typeof raw.image!=='string'||raw.image.length>1100000||!/^data:image\/jpeg;base64,[A-Za-z0-9+/]+={0,2}$/.test(raw.image))fail();
  let bytes;try{bytes=Uint8Array.from(atob(raw.image.slice(23)),c=>c.charCodeAt(0));}catch(_){fail();}
  if(bytes.length<100||bytes.length>800000||bytes[0]!==255||bytes[1]!==216||bytes.at(-2)!==255||bytes.at(-1)!==217)fail();
  // The client exports a fixed 600 × 800 archival print. Validate its JPEG
  // dimensions without executing or accepting SVG, HTML or external URLs.
  let at=2,dimensions=false;
  while(at+4<bytes.length){
    if(bytes[at++]!==255)break;while(bytes[at]===255)at++;const marker=bytes[at++];
    if(marker===218||marker===217)break;if(marker===0||marker===216||marker>=208&&marker<=215)continue;
    const length=bytes[at]*256+bytes[at+1];if(length<2||at+length>bytes.length)break;
    if([192,193,194,195,197,198,199,201,202,203,205,206,207].includes(marker)){
      if(length<8)break;const h=bytes[at+3]*256+bytes[at+4],w=bytes[at+5]*256+bytes[at+6];dimensions=w===600&&h===800;break;
    }at+=length;
  }
  if(!dimensions)fail();
  return {version:1,id:raw.id.toLowerCase(),title,text,author,sourceId,image:raw.image};
}
