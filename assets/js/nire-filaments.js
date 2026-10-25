(function () {
  "use strict";

  // One closed vascular skin, reconstructed from the connected drawing.
  window.createNireFilaments = function (gl, changed) {
    const vertex = `
      attribute vec3 aPosition;
      attribute vec3 aNormal;
      attribute vec3 aColor;
      attribute vec2 aSurface;
      uniform vec2 uViewport;
      uniform vec2 uCenter;
      uniform float uWidth;
      uniform float uAngle;
      uniform float uTilt;
      varying vec3 vNormal;
      varying vec3 vColor;
      varying vec2 vSurface;
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
        vNormal = rotate(aNormal);
        vColor = aColor;
        vSurface = aSurface;
      }`;
    const fragment = `
      precision highp float;
      uniform float uStrength;
      uniform vec2 uLight;
      varying vec3 vNormal;
      varying vec3 vColor;
      varying vec2 vSurface;
      float grain(vec2 p) { return fract(sin(dot(p, vec2(127.1,311.7)))*43758.5453); }
      void main() {
        vec3 n = normalize(vNormal);
        vec3 key = normalize(vec3(-.48+uLight.x*.45,.68-uLight.y*.4,1.0));
        vec3 fill = normalize(vec3(.8,-.25,.6));
        vec3 eye = vec3(0.0,0.0,1.0);
        // Fine longitudinal ridges and irregular pigment live on the tube surface.
        float rib = sin(vSurface.y*12.0 + vSurface.x*.035);
        float fiber = .965 + .025*rib + .018*(grain(floor(vSurface*vec2(3.0,90.0)))-.5);
        float diffuse = max(0.0,dot(n,key));
        float soft = max(0.0,dot(n,fill));
        float specular = pow(max(0.0,dot(n,normalize(key+eye))),64.0);
        float satin = pow(max(0.0,dot(n,normalize(fill+eye))),18.0);
        float rim = pow(1.0-max(0.0,dot(n,eye)),3.0);
        float peak = max(.025,max(max(vColor.r,vColor.g),vColor.b));
        vec3 pigment = mix(vec3(.56,.49,.6),vColor/peak,.8)*(.43+min(.38,peak));
        vec3 color = pigment*(.16+.78*diffuse+.22*soft)*fiber;
        color += mix(vec3(.85,.9,1.0),pigment,.18)*specular*.36;
        color += pigment*satin*.12 + vec3(.28,.18,.38)*rim*.18;
        gl_FragColor = vec4(color,uStrength);
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
    ["uViewport","uCenter","uWidth","uAngle","uTilt","uStrength","uLight"].forEach(key => uniform[key] = gl.getUniformLocation(program,key));
    ["aPosition","aNormal","aColor","aSurface"].forEach(key => attributes[key] = gl.getAttribLocation(program,key));
    const maskTexture = gl.createTexture();
    gl.activeTexture(gl.TEXTURE3); gl.bindTexture(gl.TEXTURE_2D,maskTexture);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,1,1,0,gl.RGBA,gl.UNSIGNED_BYTE,new Uint8Array([0,0,0,0]));
    let loaded = false, loading = null;
    const batches = [];
    const stats = { paths: 1, bodies: 1, vertices: 0, triangles: 0 };
    const stride = 11;
    const attributeCount = gl.getParameter(gl.MAX_VERTEX_ATTRIBS);
    function build(buffer) {
      const data = new DataView(buffer);
      if(data.byteLength<20 || data.getUint32(0,true)!==0x5652494e || data.getUint32(4,true)!==2)throw new Error("Invalid ÑIRE vascular skin");
      const width=data.getUint16(8,true),height=data.getUint16(10,true),count=data.getUint32(12,true);
      stats.bodies=data.getUint32(16,true);
      if(stats.bodies!==1)throw new Error("ÑIRE must be one continuous body");
      const aspect=height/width;
      let offset=20;
      for(let batch=0;batch<count;batch++) {
        const vertexCount=data.getUint32(offset,true),indexCount=data.getUint32(offset+4,true);
        const bounds=[0,1,2,3].map(i=>data.getFloat32(offset+8+i*4,true));offset+=24;
        const vertices=new Float32Array(vertexCount*stride);
        for(let i=0;i<vertexCount;i++,offset+=12) {
          const x=data.getInt16(offset,true)/8,y=data.getInt16(offset+2,true)/8,h=data.getInt16(offset+4,true)/8192;
          const u=x/width,v=y/height;
          const nx=data.getInt8(offset+6)/127,ny=data.getInt8(offset+7)/127,nz=data.getInt8(offset+8)/127;
          const a=u*6.8+v*3.2,b=v*9.5-u*2.8,c=u*51+v*37,d=u*113-v*71;
          const base=.105*Math.sin(a)+.045*Math.cos(b)+.009+.004*Math.sin(c)+.002*Math.sin(d);
          const dx=.105*6.8*Math.cos(a)+.045*2.8*Math.sin(b)+.004*51*Math.cos(c)+.002*113*Math.cos(d);
          const dy=.105*3.2*Math.cos(a)-.045*9.5*Math.sin(b)+.004*37*Math.cos(c)-.002*71*Math.cos(d);
          const normal=[nx-dx*nz,-ny+dy/aspect*nz,nz];
          const length=Math.hypot(...normal)||1;
          vertices.set([u-.5,(.5-v)*aspect,base+h/width,...normal.map(n=>n/length),data.getUint8(offset+9)/255,data.getUint8(offset+10)/255,data.getUint8(offset+11)/255,x*.7+y*.3,Math.atan2(nz,nx+ny)],i*stride);
        }
        const indices=new Uint16Array(buffer,offset,indexCount);offset+=indexCount*2;
        const vertexBuffer=gl.createBuffer(),indexBuffer=gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER,vertexBuffer);gl.bufferData(gl.ARRAY_BUFFER,vertices,gl.STATIC_DRAW);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,indexBuffer);gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,indices,gl.STATIC_DRAW);
        batches.push({vertexBuffer,indexBuffer,count:indexCount,bounds});
        stats.vertices+=vertexCount;stats.triangles+=indexCount/3;
      }
      if(offset!==buffer.byteLength)throw new Error("Incomplete ÑIRE vascular skin");
    }
    async function geometry() {
      const compressed=typeof DecompressionStream==="function";
      const response=await fetch(`assets/images/nire/filaments.bin${compressed?".gz":""}?v=4`);
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
        const mask=new Image();mask.decoding="async";
        const ready=new Promise((resolve,reject)=>{mask.onload=resolve;mask.onerror=reject;});
        mask.src="assets/images/nire/filament-mask.png?v=4";
        const [buffer]=await Promise.all([geometry(),ready]);
        if(gl.isContextLost())return;
        build(buffer);
        gl.activeTexture(gl.TEXTURE3);gl.bindTexture(gl.TEXTURE_2D,maskTexture);
        gl.texImage2D(gl.TEXTURE_2D,0,gl.LUMINANCE,gl.LUMINANCE,gl.UNSIGNED_BYTE,mask);
        loaded=true;changed(stats);
      })().catch(()=>{loaded=false;});
      return loading;
    }
    function draw(view,world,angle,tilt,strength,light,area) {
      if(!loaded||strength<.001||gl.isContextLost())return;
      gl.useProgram(program);
      gl.uniform2f(uniform.uViewport,view.width,view.height);gl.uniform2f(uniform.uCenter,view.cx,view.cy);
      gl.uniform1f(uniform.uWidth,view.scale*world.width);gl.uniform1f(uniform.uAngle,angle);gl.uniform1f(uniform.uTilt,tilt);
      gl.uniform1f(uniform.uStrength,strength);gl.uniform2f(uniform.uLight,light.x,light.y);
      gl.clear(gl.DEPTH_BUFFER_BIT);gl.enable(gl.DEPTH_TEST);gl.depthFunc(gl.LESS);
      for(let i=0;i<attributeCount;i++)gl.disableVertexAttribArray(i);
      for(const batch of batches) {
        const b=batch.bounds;
        if(area&&(b[2]<area.left-.06||b[0]>area.right+.06||b[3]<area.top-.06||b[1]>area.bottom+.06))continue;
        gl.bindBuffer(gl.ARRAY_BUFFER,batch.vertexBuffer);gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,batch.indexBuffer);
        [["aPosition",3,0],["aNormal",3,3],["aColor",3,6],["aSurface",2,9]].forEach(([name,size,offset])=>{
          gl.enableVertexAttribArray(attributes[name]);gl.vertexAttribPointer(attributes[name],size,gl.FLOAT,false,stride*4,offset*4);
        });
        gl.drawElements(gl.TRIANGLES,batch.count,gl.UNSIGNED_SHORT,0);
      }
      gl.disable(gl.DEPTH_TEST);
    }
    return {load,draw,ready:()=>loaded,maskTexture,stats};
  };
}());
