(function () {
  "use strict";

  // One continuous, finely textured woody frame for the spatial herbarium.
  window.createNireFilaments = function (gl, changed) {
    const derivatives=gl.getExtension("OES_standard_derivatives");
    const vertex = `
      attribute vec3 aPosition;
      attribute vec3 aNormal;
      attribute float aRock;
      attribute float aPorous;
      uniform vec2 uViewport;
      uniform vec2 uCenter;
      uniform float uWidth;
      uniform float uAngle;
      uniform float uTilt;
      varying vec3 vLocalNormal;
      varying vec3 vLocalPosition;
      varying float vRock;
      varying float vPorous;
      vec3 rotate(vec3 p) {
        float c = cos(uAngle), s = sin(uAngle);
        p = vec3(c*p.x+s*p.z, p.y, -s*p.x+c*p.z);
        c = cos(uTilt); s = sin(uTilt);
        return vec3(p.x, c*p.y-s*p.z, s*p.y+c*p.z);
      }
      void main() {
        vec3 p = rotate(aPosition);
        float w = 4.0-p.z;
        vec2 center = vec2(2.0*uCenter.x/uViewport.x-1.0, 1.0-2.0*uCenter.y/uViewport.y);
        gl_Position = vec4(center*w+p.xy*uWidth*8.0/uViewport, -p.z*.6, w);
        vLocalNormal = aNormal;
        vLocalPosition = aPosition*2262.0;
        vRock = aRock;
        vPorous = aPorous;
      }`;
    const fragment = `${derivatives?'#extension GL_OES_standard_derivatives : enable\n':''}
      precision highp float;
      uniform float uStrength;
      uniform float uDetail;
      uniform float uAngle,uTilt,uTexelFootprint;
      uniform vec2 uLight;
      varying vec3 vLocalNormal;
      varying vec3 vLocalPosition;
      varying float vRock;
      varying float vPorous;
      float mineralHash(vec3 p){
        p=fract(p*.1031);p+=dot(p,p.yzx+33.33);
        return fract((p.x+p.y)*p.z);
      }
      // Value and analytic gradient share the same eight corner samples.
      vec4 mineralNoise(vec3 p){
        vec3 cell=floor(p),f=fract(p),u=f*f*(3.0-2.0*f),du=6.0*f*(1.0-f);
        float a=mineralHash(cell),b=mineralHash(cell+vec3(1,0,0));
        float c=mineralHash(cell+vec3(0,1,0)),d=mineralHash(cell+vec3(1,1,0));
        float e=mineralHash(cell+vec3(0,0,1)),g=mineralHash(cell+vec3(1,0,1));
        float h=mineralHash(cell+vec3(0,1,1)),j=mineralHash(cell+vec3(1,1,1));
        float ab=mix(a,b,u.x),cd=mix(c,d,u.x),eg=mix(e,g,u.x),hj=mix(h,j,u.x);
        float front=mix(ab,cd,u.y),back=mix(eg,hj,u.y);
        float gx=du.x*mix(mix(b-a,d-c,u.y),mix(g-e,j-h,u.y),u.z);
        float gy=du.y*mix(cd-ab,hj-eg,u.z),gz=du.z*(back-front);
        return vec4(mix(front,back,u.z),gx,gy,gz);
      }
      vec3 rotate(vec3 p){
        float c=cos(uAngle),s=sin(uAngle);p=vec3(c*p.x+s*p.z,p.y,-s*p.x+c*p.z);
        c=cos(uTilt);s=sin(uTilt);return vec3(p.x,c*p.y-s*p.z,s*p.y+c*p.z);
      }
      void main() {
        vec3 p=vLocalPosition;
        float footprint=${derivatives?'max(length(dFdx(p)),length(dFdy(p)))':'uTexelFootprint'};
        float grainWeight=1.0-smoothstep(.35,.9,footprint*1.7);
        float poreWeight=1.0-smoothstep(.35,.9,footprint*2.8);
        float dustWeight=1.0-smoothstep(.35,.9,footprint*5.1);
        vec4 strata=mineralNoise(p*.38),grain=vec4(.5,0,0,0),pores=vec4(.5,0,0,0),dust=vec4(.5,0,0,0);
        if(grainWeight>.001)grain=mineralNoise(p*1.7);
        if(poreWeight>.001)pores=mineralNoise(p*2.8);
        if(dustWeight>.001)dust=mineralNoise(p*5.1);
        float t=clamp((pores.x-.12)/.38,0.0,1.0);
        float pit=(1.0-t*t*(3.0-2.0*t))*poreWeight;
        float pitSlope=-6.0*t*(1.0-t)/.38*poreWeight;
        vec3 gradient=strata.yzw*.015*.38+grain.yzw*.035*1.7*grainWeight+dust.yzw*.015*5.1*dustWeight-pores.yzw*pitSlope*.07*2.8;
        float rock=smoothstep(.05,.85,vRock);
        vec4 beds=mineralNoise(p*vec3(.055,.012,.055));
        vec4 fractures=mineralNoise(p*.075);
        vec3 rockGradient=fractures.yzw*.08+beds.yzw*vec3(.035,.008,.035)+grain.yzw*.075*grainWeight-pores.yzw*pitSlope*.18*poreWeight;
        gradient=mix(gradient,rockGradient,rock);
        vec3 normal=normalize(vLocalNormal);
        normal=normalize(normal-(gradient-normal*dot(gradient,normal)));
        vec3 n=normalize(rotate(normal));
        vec3 key = normalize(vec3(-.72,1.05,.58));
        vec3 fill = normalize(vec3(.8,-.25,.6));
        vec3 eye = vec3(0.0,0.0,1.0);
        float diffuse = max(0.0,dot(n,key));
        float soft = max(0.0,dot(n,fill));
        float specular = pow(max(0.0,dot(n,normalize(key+eye))),9.0);
        float rim = pow(1.0-max(0.0,dot(n,eye)),3.0);
        vec3 stone=mix(vec3(.31,.325,.24),vec3(.53,.49,.35),strata.x);
        float mineral=1.0+(grain.x-.5)*.08*grainWeight+(dust.x-.5)*.05*dustWeight;
        float cavities=1.0-pit*.18;
        vec3 color=stone*mineral*cavities*(.34+.70*diffuse+.085*soft);
        color+=vec3(1.0)*specular*.018+stone*rim*.006;
        vec3 slate=mix(vec3(.37,.405,.37),vec3(.62,.64,.57),.25+beds.x*.35+fractures.x*.25);
        float quartz=smoothstep(.74,.90,grain.x)*grainWeight;
        slate=mix(slate,vec3(.60,.61,.63),quartz*.18);
        vec3 mineralColor=slate*(1.0+(grain.x-.5)*.25*grainWeight)*(1.0-pit*.36)*(.24+.83*diffuse+.08*soft);
        mineralColor+=vec3(.66,.68,.72)*specular*.025+slate*rim*.012;
        color=mix(color,mineralColor,rock);
        if(uDetail>.001&&vPorous>.001){
          vec2 q=p.xy*.62;q.x+=mod(floor(q.y),2.0)*.5;
          vec2 cell=floor(q),f=fract(q)-.5;
          f-=vec2(mineralHash(vec3(cell,2.0)),mineralHash(vec3(cell+17.0,3.0)))*.22-.11;
          float d=length(f),aa=${derivatives?'max(fwidth(d),.014)':'max(.014,uTexelFootprint*.62)'};
          float pore=1.0-smoothstep(.025+aa,.10+aa,d);
          vec3 porcelain=vec3(.955,.94,.885)*mineral*(.095+1.04*diffuse+.018*soft)*(1.0-pore*.25*grainWeight);
          color=mix(color,porcelain,vPorous*uDetail);
        }
        if(uDetail>.99&&rock>.95)discard;
        gl_FragColor = vec4(color,uStrength*(1.0-rock*uDetail));
      }`;
    function compile(type, source) {
      const shader = gl.createShader(type);
      gl.shaderSource(shader, source); gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error("ÑIRE fiber shader unavailable");
      return shader;
    }
    let program;
    try {
      program = gl.createProgram();
      gl.attachShader(program, compile(gl.VERTEX_SHADER, vertex));
      gl.attachShader(program, compile(gl.FRAGMENT_SHADER, fragment));
      gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return null;
    } catch (_) { return null; }
    const uniform = {}, attributes = {};
    ["uViewport","uCenter","uWidth","uAngle","uTilt","uStrength","uLight","uTexelFootprint","uDetail"].forEach(key => uniform[key] = gl.getUniformLocation(program,key));
    ["aPosition","aNormal","aRock","aPorous"].forEach(key => attributes[key] = gl.getAttribLocation(program,key));
    let loaded = false, loading = null;
    const batches = [];
    let pickData = new Float32Array(0);
    let pickKinds = new Uint8Array(0);
    const stats = { paths: 1, bodies: 1, vertices: 0, triangles: 0 };
    const stride = 11;
    const attributeCount = gl.getParameter(gl.MAX_VERTEX_ATTRIBS);
    function build(buffer) {
      const data = new DataView(buffer);
      if(data.byteLength<20 || data.getUint32(0,true)!==0x5652494e || data.getUint32(4,true)!==4)throw new Error("Invalid ÑIRE spatial surface");
      const width=data.getUint16(8,true),height=data.getUint16(10,true),count=data.getUint32(12,true);
      stats.bodies=data.getUint32(16,true);
      if(stats.bodies!==1)throw new Error("ÑIRE frame must be continuous");
      stats.paths=stats.bodies;
      const aspect=height/width;
      const picking=[],kinds=[];
      let offset=20;
      for(let batch=0;batch<count;batch++) {
        const vertexCount=data.getUint32(offset,true),indexCount=data.getUint32(offset+4,true);
        const bounds=[0,1,2,3].map(i=>data.getFloat32(offset+8+i*4,true));offset+=24;
        const vertices=new Float32Array(vertexCount*stride);
        for(let i=0;i<vertexCount;i++,offset+=28) {
          const x=data.getFloat32(offset,true),y=data.getFloat32(offset+4,true),h=data.getFloat32(offset+8,true);
          const u=x/width,v=y/height;
          const nx=data.getFloat32(offset+12,true),ny=data.getFloat32(offset+16,true),nz=data.getFloat32(offset+20,true);
          const normal=[nx,-ny,nz];
          const length=Math.hypot(...normal)||1;
          vertices.set([u-.5,(.5-v)*aspect,h/width,...normal.map(n=>n/length),data.getUint8(offset+24)/255,data.getUint8(offset+25)/255,data.getUint8(offset+26)/255,x*.7+y*.3,Math.atan2(nz,nx+ny)],i*stride);
          if(i%8===0){
            picking.push(vertices[i*stride],vertices[i*stride+1],vertices[i*stride+2],0);
            kinds.push(vertices[i*stride+6]>.5?1:0);
          }
        }
        const indices=new Uint16Array(buffer,offset,indexCount);offset+=indexCount*2;
        const vertexBuffer=gl.createBuffer(),indexBuffer=gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER,vertexBuffer);gl.bufferData(gl.ARRAY_BUFFER,vertices,gl.STATIC_DRAW);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,indexBuffer);gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,indices,gl.STATIC_DRAW);
        batches.push({vertexBuffer,indexBuffer,count:indexCount,bounds});
        stats.vertices+=vertexCount;stats.triangles+=indexCount/3;
      }
      if(offset!==buffer.byteLength)throw new Error("Incomplete ÑIRE vascular skin");
      pickData=new Float32Array(picking);
      pickKinds=new Uint8Array(kinds);
    }
    async function geometry() {
      const compressed=typeof DecompressionStream==="function";
      const response=await fetch(`assets/images/nire/filaments.bin${compressed?".gz":""}?v=18`);
      if(!response.ok)throw new Error("ÑIRE skin unavailable");
      const raw=await response.arrayBuffer();
      const header=new Uint8Array(raw,0,Math.min(2,raw.byteLength));
      if(header[0]===31&&header[1]===139) {
        return new Response(new Blob([raw]).stream().pipeThrough(new DecompressionStream("gzip"))).arrayBuffer();
      }
      return raw;
    }
    function load() {
      if(loading)return loading;
      loading=(async()=>{
        const buffer=await geometry();
        if(gl.isContextLost())return;
        build(buffer);
        loaded=true;changed(stats);
      })().catch(()=>{loaded=false;});
      return loading;
    }
    function draw(view,world,angle,tilt,strength,light,area,detail=0) {
      if(!loaded||strength<.001||gl.isContextLost())return;
      gl.useProgram(program);
      gl.uniform2f(uniform.uViewport,view.width,view.height);gl.uniform2f(uniform.uCenter,view.cx,view.cy);
      gl.uniform1f(uniform.uWidth,view.scale*world.width);gl.uniform1f(uniform.uAngle,angle);gl.uniform1f(uniform.uTilt,tilt);
      gl.uniform1f(uniform.uStrength,strength);gl.uniform2f(uniform.uLight,light.x,light.y);
      gl.uniform1f(uniform.uDetail,detail);
      gl.uniform1f(uniform.uTexelFootprint,2262/(view.scale*world.width*gl.drawingBufferWidth/view.width));
      gl.clear(gl.DEPTH_BUFFER_BIT);gl.enable(gl.DEPTH_TEST);gl.depthFunc(gl.LESS);
      for(let i=0;i<attributeCount;i++)gl.disableVertexAttribArray(i);
      for(const batch of batches) {
        const b=batch.bounds;
        if(area&&(b[2]<area.left-.06||b[0]>area.right+.06||b[3]<area.top-.06||b[1]>area.bottom+.06))continue;
        gl.bindBuffer(gl.ARRAY_BUFFER,batch.vertexBuffer);gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,batch.indexBuffer);
        [["aPosition",3,0],["aNormal",3,3],["aRock",1,6],["aPorous",1,7]].forEach(([name,size,offset])=>{
          gl.enableVertexAttribArray(attributes[name]);gl.vertexAttribPointer(attributes[name],size,gl.FLOAT,false,stride*4,offset*4);
        });
        gl.drawElements(gl.TRIANGLES,batch.count,gl.UNSIGNED_SHORT,0);
      }
      gl.disable(gl.DEPTH_TEST);
    }
    return {load,draw,ready:()=>loaded,stats,pickPoints:()=>[pickData],pickMaterials:()=>pickKinds};
  };
}());
