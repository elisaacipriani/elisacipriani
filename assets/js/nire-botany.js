(function(){
  'use strict';
  window.createNireBotany=function(gl,changed){
    const derivatives=gl.getExtension('OES_standard_derivatives');
    const vertex=`
      attribute vec3 aPosition,aNormal,aColor;
      attribute vec2 aUV;
      attribute float aAO;
      uniform vec2 uViewport,uCenter;
      uniform float uWidth,uAngle,uTilt;
      varying vec3 vNormal,vColor,vPosition,vView,vLocalNormal;
      varying vec2 vUV;
      varying float vAO;
      vec3 rotate(vec3 p){float c=cos(uAngle),s=sin(uAngle);p=vec3(c*p.x+s*p.z,p.y,-s*p.x+c*p.z);c=cos(uTilt);s=sin(uTilt);return vec3(p.x,c*p.y-s*p.z,s*p.y+c*p.z);}
      void main(){vec3 p=rotate(aPosition);float w=4.0-p.z;vec2 centre=vec2(2.0*uCenter.x/uViewport.x-1.0,1.0-2.0*uCenter.y/uViewport.y);gl_Position=vec4(centre*w+p.xy*uWidth*8.0/uViewport,-p.z*.6,w);vNormal=rotate(aNormal);vLocalNormal=aNormal;vColor=aColor;vPosition=aPosition*2262.0;vView=p;vUV=aUV;vAO=aAO;}`;
    const fragment=`${derivatives?'#extension GL_OES_standard_derivatives : enable\n':''}
      precision highp float;
      uniform float uKind,uStrength,uRefraction,uSphereRadius,uWidth,uDark,uAngle,uTilt;
      uniform vec3 uSphereCenter;
      uniform mat3 uSeedInverse;
      uniform vec2 uRenderSize,uViewport;
      uniform sampler2D uBehind,uSkin;
      varying vec3 vNormal,vColor,vPosition,vView,vLocalNormal;
      varying vec2 vUV;
      varying float vAO;
      vec3 unrotate(vec3 p){float c=cos(uTilt),s=sin(uTilt);p=vec3(p.x,c*p.y+s*p.z,-s*p.y+c*p.z);c=cos(uAngle);s=sin(uAngle);return vec3(c*p.x-s*p.z,p.y,s*p.x+c*p.z);}
      ${window.nireCoralMaterialGLSL(derivatives)}
      void main(){
        vec3 n=normalize(vNormal);if(!gl_FrontFacing)n=-n;
        vec3 key=normalize(vec3(-.72,1.05,.58)),eye=normalize(vec3(0,0,4)-vView);
        float diffuse=max(0.0,dot(n,key)),backlight=max(0.0,dot(-n,key));
        vec3 color=vColor*(.30+.78*diffuse);
        if(uKind>12.5){
          // Clear optical glass, separate from the coral fruit flesh. Refraction
          // follows the actual curved surface and samples the scene behind it.
          float facing=clamp(dot(n,eye),.001,1.0);
          float fresnel=.036+.964*pow(1.0-facing,5.0);
          // The camera is outside the crystal: the incident medium is air.
          vec3 ray=refract(-eye,n,1.0/1.47);
          float thickness=max(vAO,.000001)*(.3+1.7*facing);
          float projected=uWidth*4.0/(4.0-vView.z);
          vec2 bend=(ray.xy/max(.25,-ray.z)+eye.xy/max(.25,eye.z))*thickness*projected/uViewport;
          vec2 uv=gl_FragCoord.xy/uRenderSize+bend;
          vec3 through=background(uv,vec2(.20)/uViewport);
          // Very faint champagne absorption leaves the glass transparent.
          through*=exp(-vec3(.032,.020,.008)*(.25+1.4*facing));
          vec3 reflected=reflect(-eye,n);
          float panel=exp(-pow((reflected.x+.48)/.12,2.0)-pow((reflected.y-.35)/.84,2.0));
          float strip=exp(-pow((reflected.x-.62)/.045,2.0)-pow((reflected.y+.12)/.75,2.0));
          float ceiling=exp(-pow((reflected.y-.89)/.17,2.0));
          vec3 room=mix(vec3(.13,.16,.15),vec3(.34,.37,.40),uDark);
          room+=vec3(.97,.98,1.0)*(panel*.95+strip*.8+ceiling*.27);
          color=mix(through,room,fresnel);
          float glint=pow(max(0.0,dot(n,normalize(key+eye))),210.0);
          color+=vec3(1.0,.98,.93)*(glint*.38+panel*.09+strip*.035);
          color=mix(mix(vec3(.79,.82,.81),vec3(.11,.15,.17),uDark),color,uRefraction);
        }else if(uKind>11.5){
          vec3 local=uSeedInverse*(vPosition/2262.0-uSphereCenter)/uSphereRadius;
          color=coralMaterial(n,uSeedInverse*vLocalNormal,local,vView,uSphereRadius,normalize(uSeedInverse*unrotate(eye)));
        }
        gl_FragColor=vec4(color,uStrength);
      }`;
    function shader(type,src){const s=gl.createShader(type);gl.shaderSource(s,src);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(s));return s;}
    let program;try{program=gl.createProgram();gl.attachShader(program,shader(gl.VERTEX_SHADER,vertex));gl.attachShader(program,shader(gl.FRAGMENT_SHADER,fragment));gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(program));}catch(_){return null;}
    const attributes={},uniforms={},attributeCount=gl.getParameter(gl.MAX_VERTEX_ATTRIBS);
    for(const k of ['aPosition','aNormal','aColor','aUV','aAO'])attributes[k]=gl.getAttribLocation(program,k);
    for(const k of ['uViewport','uCenter','uWidth','uAngle','uTilt','uKind','uStrength','uRefraction','uRenderSize','uBehind','uSkin','uSphereCenter','uSphereRadius','uSeedInverse','uDark'])uniforms[k]=gl.getUniformLocation(program,k);
    const batches=[],surfaces=[],behind=gl.createTexture();let captureWidth=0,captureHeight=0,loaded=false,loading,stats=null,skinTexture,crystal=null;
    gl.activeTexture(gl.TEXTURE7);gl.bindTexture(gl.TEXTURE_2D,behind);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGB,1,1,0,gl.RGB,gl.UNSIGNED_BYTE,new Uint8Array([232,234,232]));
    function build(raw,meta,roots){
      const bubbleData=new Map(meta.bubbles.map(b=>[b.id,b]));
      const d=new DataView(raw);if(d.getUint32(0,true)!==0x5052494e||d.getUint32(4,true)!==2)throw new Error('Invalid bubble collection');let at=12;
      for(let b=0;b<d.getUint32(8,true);b++){
        const kind=d.getUint32(at,true),id=d.getUint32(at+4,true),nv=d.getUint32(at+8,true),ni=d.getUint32(at+12,true),center=[0,1,2].map(i=>d.getFloat32(at+16+i*4,true));at+=28;
        const vertices=new Float32Array(raw.slice(at,at+nv*48));at+=nv*48;const indices=new Uint16Array(raw.slice(at,at+ni*2));at+=ni*2;
        const vb=gl.createBuffer(),ib=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,vb);gl.bufferData(gl.ARRAY_BUFFER,vertices,gl.STATIC_DRAW);gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,ib);gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,indices,gl.STATIC_DRAW);
        const low=[Infinity,Infinity,Infinity],high=[-Infinity,-Infinity,-Infinity];for(let i=0;i<nv;i++)for(let j=0;j<3;j++){low[j]=Math.min(low[j],vertices[i*12+j]);high[j]=Math.max(high[j],vertices[i*12+j]);}
        const sphere=kind===12?bubbleData.get(id):null;if(kind===12&&!sphere)throw new Error('Missing bubble radius');
        batches.push({kind,id,vb,ib,count:ni,center,low,high,sphere});surfaces.push({kind,id,vertices,indices,low,high});
      }
      if(at!==raw.byteLength)throw new Error('Incomplete bubble collection');
      crystal=window.createNireCrystalGeometry(roots);
      for(const part of crystal.parts){
        const vb=gl.createBuffer(),ib=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,vb);gl.bufferData(gl.ARRAY_BUFFER,part.vertices,gl.STATIC_DRAW);gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,ib);gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,part.indices,gl.STATIC_DRAW);
        batches.push({...part,vb,ib,count:part.indices.length});surfaces.push(part);
      }
    }
    function image(path){return new Promise((resolve,reject)=>{const image=new Image();image.onload=()=>resolve(image);image.onerror=reject;image.src=path;});}
    function materialTexture(image,unit,repeat){
      const canvas=document.createElement('canvas');canvas.width=canvas.height=2048;canvas.getContext('2d').drawImage(image,0,0,2048,2048);
      const texture=gl.createTexture();gl.activeTexture(gl.TEXTURE0+unit);gl.bindTexture(gl.TEXTURE_2D,texture);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,false);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,canvas);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,repeat?gl.REPEAT:gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,repeat?gl.REPEAT:gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR_MIPMAP_LINEAR);gl.generateMipmap(gl.TEXTURE_2D);
      const anisotropy=gl.getExtension('EXT_texture_filter_anisotropic');if(anisotropy)gl.texParameterf(gl.TEXTURE_2D,anisotropy.TEXTURE_MAX_ANISOTROPY_EXT,Math.min(8,gl.getParameter(anisotropy.MAX_TEXTURE_MAX_ANISOTROPY_EXT)));return texture;
    }
    function load(){if(loading)return loading;loading=(async()=>{
      const compressed=typeof DecompressionStream==='function';
      const [response,meta,skin,rootResponse,rootMeta]=await Promise.all([
        fetch(`assets/images/nire/bubbles.bin${compressed?'.gz':''}?v=3`),
        fetch('assets/images/nire/bubbles.json?v=3').then(r=>r.json()),
        image('assets/images/nire/bubble-skin-v1.png'),
        fetch(`assets/images/nire/crystal-roots.bin${compressed?'.gz':''}?v=2`),
        fetch('assets/images/nire/crystal-roots.json?v=2').then(r=>{if(!r.ok)throw new Error('Root metadata unavailable');return r.json();})
      ]);
      if(!response.ok||!rootResponse.ok)throw new Error('Glass collection unavailable');
      async function unpack(response){
        const raw=await response.arrayBuffer(),head=new Uint8Array(raw,0,2);
        return head[0]===31&&head[1]===139?new Response(new Blob([raw]).stream().pipeThrough(new DecompressionStream('gzip'))).arrayBuffer():raw;
      }
      const [raw,rootRaw]=await Promise.all([unpack(response),unpack(rootResponse)]);
      if(gl.isContextLost())return;
      build(raw,meta,{raw:rootRaw,meta:rootMeta});skinTexture=materialTexture(skin,6,true);
      stats={...meta,crystal:{triangles:crystal.triangles,stems:crystal.stems,drops:crystal.drops.length,roots:crystal.primaryRoots,tips:crystal.rootTips}};loaded=true;changed(stats);
    })().catch(error=>{loaded=false;console.warn('Bubble collection unavailable',error)});return loading;}
    function draw(view,world,angle,tilt,strength){
      if(!loaded||strength<.001||gl.isContextLost())return;
      gl.useProgram(program);for(let i=0;i<attributeCount;i++)gl.disableVertexAttribArray(i);
      gl.uniform2f(uniforms.uViewport,view.width,view.height);gl.uniform2f(uniforms.uCenter,view.cx,view.cy);gl.uniform1f(uniforms.uWidth,view.scale*world.width);gl.uniform1f(uniforms.uAngle,angle);gl.uniform1f(uniforms.uTilt,tilt);gl.uniform1f(uniforms.uStrength,strength);gl.uniform1i(uniforms.uBehind,7);gl.uniform1i(uniforms.uSkin,6);gl.uniform1f(uniforms.uRefraction,0);gl.uniform2f(uniforms.uRenderSize,gl.drawingBufferWidth,gl.drawingBufferHeight);
      gl.uniform1f(uniforms.uDark,window.NireAppearance?.isDark()?1:0);
      gl.activeTexture(gl.TEXTURE6);gl.bindTexture(gl.TEXTURE_2D,skinTexture);
      gl.enable(gl.DEPTH_TEST);gl.depthFunc(gl.LESS);gl.depthMask(true);gl.disable(gl.CULL_FACE);
      function part(b){if(b.kind>=12){gl.enable(gl.CULL_FACE);gl.cullFace(gl.BACK);}else gl.disable(gl.CULL_FACE);gl.uniform1f(uniforms.uKind,b.kind);if(b.sphere){gl.uniform3fv(uniforms.uSphereCenter,b.sphere.center);gl.uniform1f(uniforms.uSphereRadius,b.sphere.radius);if(b.kind===12)gl.uniformMatrix3fv(uniforms.uSeedInverse,false,b.sphere.frame.flat());}gl.bindBuffer(gl.ARRAY_BUFFER,b.vb);gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,b.ib);for(const[name,size,offset]of [['aPosition',3,0],['aNormal',3,3],['aColor',3,6],['aUV',2,9],['aAO',1,11]]){if(attributes[name]<0)continue;gl.enableVertexAttribArray(attributes[name]);gl.vertexAttribPointer(attributes[name],size,gl.FLOAT,false,48,offset*4);}gl.drawElements(gl.TRIANGLES,b.count,gl.UNSIGNED_SHORT,0);}
      for(const b of batches)if(b.kind<12)part(b);
      gl.activeTexture(gl.TEXTURE7);gl.bindTexture(gl.TEXTURE_2D,behind);
      const width=gl.drawingBufferWidth,height=gl.drawingBufferHeight,max=gl.getParameter(gl.MAX_TEXTURE_SIZE);
      let captured=false;
      if(width<=max&&height<=max){
        if(captureWidth!==width||captureHeight!==height){gl.copyTexImage2D(gl.TEXTURE_2D,0,gl.RGB,0,0,width,height,0);captureWidth=width;captureHeight=height;}
        captured=true;
        gl.uniform1f(uniforms.uRefraction,1);
      }
      const depth=p=>Math.sin(tilt)*p[1]+Math.cos(tilt)*(-Math.sin(angle)*p[0]+Math.cos(angle)*p[2]);
      // All transparent objects share one depth sort and refract the already
      // drawn scene. Smaller arils keep their earlier physical radius.
      function captureRegion(b){
        if(!captured)return;
        let left=Infinity,right=-Infinity,top=Infinity,bottom=-Infinity;
        const c=Math.cos(angle),s=Math.sin(angle),ct=Math.cos(tilt),st=Math.sin(tilt);
        for(let i=0;i<8;i++){
          const p=[i&1?b.high[0]:b.low[0],i&2?b.high[1]:b.low[1],i&4?b.high[2]:b.low[2]],rx=c*p[0]+s*p[2],rz=-s*p[0]+c*p[2],ry=ct*p[1]-st*rz,z=st*p[1]+ct*rz;
          const f=view.scale*world.width*4/(4-z),x=view.cx+rx*f,y=view.cy-ry*f;
          left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);
        }
        const margin=b.kind===12?.30:.16,padding=Math.max(3,(right-left)*margin,(bottom-top)*margin),sx=width/view.width,sy=height/view.height;
        const x=Math.max(0,Math.floor((left-padding)*sx)),y=Math.max(0,Math.floor(height-(bottom+padding)*sy));
        const w=Math.min(width,Math.ceil((right+padding)*sx))-x,h=Math.min(height,Math.ceil(height-(top-padding)*sy))-y;
        if(w>0&&h>0)gl.copyTexSubImage2D(gl.TEXTURE_2D,0,x,y,x,y,w,h);
      }
      gl.depthMask(false);
      for(const b of batches.filter(b=>b.kind>=12).sort((a,b)=>depth(a.center)-depth(b.center))){captureRegion(b);part(b);}
      gl.depthMask(true);gl.disable(gl.CULL_FACE);gl.disable(gl.DEPTH_TEST);
    }
    function pickPoint(view,world,angle,tilt,x,y){
      if(!loaded)return null;const c=Math.cos(angle),s=Math.sin(angle),ct=Math.cos(tilt),st=Math.sin(tilt);
      const inverse=p=>{const yy=ct*p[1]+st*p[2],zz=-st*p[1]+ct*p[2];return[c*p[0]-s*zz,yy,s*p[0]+c*zz]};
      const origin=inverse([0,0,4]),direction=inverse([(x-view.cx)/(view.scale*world.width),-(y-view.cy)/(view.scale*world.width),-4]);let best=Infinity,id=null,kind=null;
      for(const b of surfaces){
        let lo=0,hi=best;for(let j=0;j<3;j++){if(Math.abs(direction[j])<1.e-12){if(origin[j]<b.low[j]||origin[j]>b.high[j])hi=-1;continue;}const t0=(b.low[j]-origin[j])/direction[j],t1=(b.high[j]-origin[j])/direction[j];lo=Math.max(lo,Math.min(t0,t1));hi=Math.min(hi,Math.max(t0,t1));}if(lo>hi)continue;
        const v=b.vertices,ix=b.indices,[dx,dy,dz]=direction;
        for(let i=0;i<ix.length;i+=3){const a=ix[i]*12,k=ix[i+1]*12,l=ix[i+2]*12,e1x=v[k]-v[a],e1y=v[k+1]-v[a+1],e1z=v[k+2]-v[a+2],e2x=v[l]-v[a],e2y=v[l+1]-v[a+1],e2z=v[l+2]-v[a+2],px=dy*e2z-dz*e2y,py=dz*e2x-dx*e2z,pz=dx*e2y-dy*e2x,det=e1x*px+e1y*py+e1z*pz;if(Math.abs(det)<1.e-12)continue;const tx=origin[0]-v[a],ty=origin[1]-v[a+1],tz=origin[2]-v[a+2],u=(tx*px+ty*py+tz*pz)/det;if(u<0||u>1)continue;const qx=ty*e1z-tz*e1y,qy=tz*e1x-tx*e1z,qz=tx*e1y-ty*e1x,w=(dx*qx+dy*qy+dz*qz)/det;if(w<0||u+w>1)continue;const t=(e2x*qx+e2y*qy+e2z*qz)/det;if(t>0&&t<best){best=t;id=b.id;kind=b.kind;}}
      }
      if(Number.isFinite(best)){
        const p=origin.map((v,i)=>v+direction[i]*best),rz=-s*p[0]+c*p[2];
        return{point:p,depth:st*p[1]+ct*rz,id,kind};
      }
      // Fine clear roots can be narrower than a CSS pixel in the overview.
      // A small hit margin prevents rounded click coordinates missing them.
      let nearby=null,margin=3*3;
      for(const b of surfaces){
        if(b.kind!==13)continue;
        const v=b.vertices;
        for(let i=0;i<v.length;i+=12*8){
          const px=v[i],py=v[i+1],pz=v[i+2],rx=c*px+s*pz,rz=-s*px+c*pz,ry=ct*py-st*rz,depth=st*py+ct*rz;
          const f=view.scale*world.width*4/(4-depth),dx=view.cx+rx*f-x,dy=view.cy-ry*f-y,distance=dx*dx+dy*dy;
          if(distance<margin){margin=distance;nearby={point:[px,py,pz],depth,id:b.id,kind:13};}
        }
      }
      return nearby;
    }
    return{load,draw,pickPoint,ready:()=>loaded,stats:()=>stats,waxTexture:()=>loaded?skinTexture:null,crystalFeature:(...args)=>loaded?crystal.feature(...args):null};
  };
}());
