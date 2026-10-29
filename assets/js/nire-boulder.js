(function(){
  'use strict';
  // A small, closed mineral specimen replaces one source mark in its actual
  // branch frame. It shares the tree's world, scale and complete rotation.
  window.createNireBoulder=function(gl,changed){
    const derivatives=gl.getExtension('OES_standard_derivatives');
    const vertex=`
      attribute vec3 aPosition,aNormal;
      uniform vec2 uViewport,uCenter;
      uniform vec3 uOrigin;
      uniform mat3 uFrame;
      uniform float uWidth,uAngle,uTilt,uSize;
      varying vec3 vLocal,vNormal,vView,vLocalNormal;
      vec3 rotate(vec3 p){float c=cos(uAngle),s=sin(uAngle);p=vec3(c*p.x+s*p.z,p.y,-s*p.x+c*p.z);c=cos(uTilt);s=sin(uTilt);return vec3(p.x,c*p.y-s*p.z,s*p.y+c*p.z);}
      void main(){vec3 p=rotate(uFrame*(aPosition*uSize)+uOrigin);float w=4.0-p.z;vec2 centre=vec2(2.0*uCenter.x/uViewport.x-1.0,1.0-2.0*uCenter.y/uViewport.y);gl_Position=vec4(centre*w+p.xy*uWidth*8.0/uViewport,-p.z*.6,w);vLocal=aPosition;vLocalNormal=aNormal;vNormal=rotate(uFrame*aNormal);vView=p;}`;
    const fragment=`${derivatives?'#extension GL_OES_standard_derivatives : enable\n':''}
      precision highp float;
      uniform sampler2D uStone,uLichen;
      uniform float uStrength,uSize;
      varying vec3 vLocal,vNormal,vView,vLocalNormal;
      vec3 material(vec3 p){
        vec3 w=pow(abs(normalize(vLocalNormal)),vec3(6.0));w/=w.x+w.y+w.z;
        return texture2D(uStone,p.yz*1.45+.37).rgb*w.x+texture2D(uStone,p.zx*1.45+.17).rgb*w.y+texture2D(uStone,p.xy*1.45+.52).rgb*w.z;
      }
      vec4 growth(vec3 p){
        // The colony follows the rock in local space, through the whole orbit.
        // Premultiplied sampling keeps the fine transparent edges clean where
        // neighbouring projections meet on a fractured face.
        vec3 w=pow(abs(normalize(vLocalNormal)),vec3(6.0));w/=w.x+w.y+w.z;
        vec4 x=texture2D(uLichen,clamp(vec2(p.z*1.80+.50,-p.y*.94+.49),vec2(.001),vec2(.999)));
        vec4 y=texture2D(uLichen,clamp(vec2(p.x*1.25+.50,-p.z*1.80+.50),vec2(.001),vec2(.999)));
        vec4 z=texture2D(uLichen,clamp(vec2(p.x*1.25+.50,-p.y*.94+.49),vec2(.001),vec2(.999)));
        float a=dot(vec3(x.a,y.a,z.a),w);
        vec3 color=(x.rgb*x.a*w.x+y.rgb*y.a*w.y+z.rgb*z.a*w.z)/max(a,.0001);
        return vec4(color,a);
      }
      void main(){
        vec3 map=material(vLocal),n=normalize(vNormal);
        vec4 lichen=growth(vLocal);
        float colony=smoothstep(.16,.76,lichen.a);
        float crustGrain=dot(lichen.rgb,vec3(.2126,.7152,.0722));
        float luminance=dot(map,vec3(.2126,.7152,.0722));
        float height=(luminance-.4)*uSize*.0025+colony*uSize*(.0018+crustGrain*.0014);
        ${derivatives?`vec3 q0=dFdx(vView),q1=dFdy(vView),r1=cross(q1,n),r2=cross(n,q0);float determinant=dot(q0,r1);vec3 gradient=(r1*dFdx(height)+r2*dFdy(height))*sign(determinant)/max(abs(determinant),1.e-12);n=normalize(n-gradient);`:''}
        // Strong raking light describes the fractured faces. The material is
        // matte; no glossy plastic rim or internally glowing translucent shell.
        vec3 key=normalize(vec3(-.72,1.05,.58)),eye=normalize(vec3(0,0,4)-vView);
        float diffuse=max(0.0,dot(n,key));
        float fill=max(0.0,dot(n,normalize(vec3(.6,.1,-.7))));
        float sky=max(0.0,n.y*.5+.5);
        float crust=smoothstep(-.20,.27,vLocal.y-vLocal.x*.5);
        // Keep the photographed relief and mineral grain, with a cooler grey
        // palette. Only the saturated olive growth becomes pale aqua lichen.
        float saturation=(max(max(map.r,map.g),map.b)-min(min(map.r,map.g),map.b))/max(max(max(map.r,map.g),map.b),.001);
        float green=smoothstep(.16,.36,saturation)*smoothstep(.86,.98,map.g/max(map.r,.001))*smoothstep(.025,.10,map.g-map.b);
        vec3 mineral=mix(vec3(luminance)*vec3(.95,1.0,1.08),map,.06);
        vec3 aqua=vec3(.78,1.04,1.03)*(.32+.85*luminance);
        map=mix(mineral,aqua,green);
        vec3 bare=mix(vec3(.098,.103,.108),map*.55,.50);
        vec3 albedo=mix(bare,map,crust*.87+.07);
        float weather=smoothstep(.05,.4,-vLocal.x)*smoothstep(-.4,-.04,vLocal.y);
        albedo=mix(albedo,albedo*vec3(.99,1.0,1.025),weather*.6);
        vec3 carbon=mix(vec3(.012,.014,.013),lichen.rgb*.50,.65);
        albedo=mix(albedo,carbon,colony*.97);
        vec3 linear=pow(max(albedo,vec3(.0)),vec3(2.2));
        vec3 light=vec3(.026+.014*sky)+vec3(2.05,2.00,1.85)*diffuse+vec3(.035,.041,.045)*fill;
        float spec=pow(max(0.0,dot(n,normalize(key+eye))),26.0)*.008*mix(1.0,.32,colony);
        vec3 color=pow(max(linear*light+vec3(spec),vec3(0)),vec3(1.0/2.2));
        gl_FragColor=vec4(color,uStrength);
      }`;
    function shader(type,src){const s=gl.createShader(type);gl.shaderSource(s,src);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(s));return s;}
    let program;try{program=gl.createProgram();gl.attachShader(program,shader(gl.VERTEX_SHADER,vertex));gl.attachShader(program,shader(gl.FRAGMENT_SHADER,fragment));gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(program));}catch(_){return null;}
    const attributes={};for(const key of ['aPosition','aNormal'])attributes[key]=gl.getAttribLocation(program,key);
    const uniforms={};for(const key of ['uViewport','uCenter','uOrigin','uFrame','uWidth','uAngle','uTilt','uSize','uStrength','uStone','uLichen'])uniforms[key]=gl.getUniformLocation(program,key);
    const attributeCount=gl.getParameter(gl.MAX_VERTEX_ATTRIBS),batches=[];
    let texture,lichenTexture,loading,ready=false,triangleCount=0,attachment=null;
    function inverse(p,angle,tilt){const c=Math.cos(angle),s=Math.sin(angle),ct=Math.cos(tilt),st=Math.sin(tilt),y=ct*p[1]+st*p[2],z=-st*p[1]+ct*p[2];return[c*p[0]-s*z,y,s*p[0]+c*z];}
    function rotate(p,angle,tilt){const c=Math.cos(angle),s=Math.sin(angle),ct=Math.cos(tilt),st=Math.sin(tilt),x=c*p[0]+s*p[2],z=-s*p[0]+c*p[2];return[x,ct*p[1]-st*z,st*p[1]+ct*z];}
    function frame(p){return attachment.frame.map(row=>row.reduce((sum,v,i)=>sum+v*p[i],0));}
    function unframe(p){return p.map((_,i)=>attachment.frame.reduce((sum,row,j)=>sum+row[i]*p[j],0));}
    function pose(){return{center:attachment.center,size:attachment.heightInSourcePixels/2262};}
    function columnMajorFrame(){return[0,1,2].flatMap(i=>attachment.frame.map(row=>row[i]));}
    function screenPoint(p,base,world,angle,tilt){const q=rotate(p,angle,tilt),f=base.scale*world.width*4/(4-q[2]);return{x:base.cx+q[0]*f,y:base.cy-q[1]*f};}
    function screen(base,world,angle,tilt){
      const p=pose(),center=screenPoint(p.center,base,world,angle,tilt),ends=[-.5,.5].map(y=>screenPoint(frame([0,y*p.size,0]).map((v,i)=>v+p.center[i]),base,world,angle,tilt));
      return{...center,height:Math.hypot(ends[0].x-ends[1].x,ends[0].y-ends[1].y)};
    }
    function feature(base,world,angle,tilt){
      const p=pose(),center=p.center;
      const aspect=world.height/world.width;
      // Use the same inspection scale as the nearby elements of the universe.
      const zoom=Math.max(6.2,base.width*2.6/(base.scale*world.width),base.height*3/(base.scale*world.height));
      return{point:{x:(center[0]+.5)*world.width,y:(aspect*.5-center[1])*world.width,z:center[2]*world.width,feature:'boulder',material:'boulder'},zoom,size:p.size,screen:screen(base,world,angle,tilt)};
    }
    function build(buffer){
      const d=new DataView(buffer);if(d.getUint32(0,true)!==0x4252494e||d.getUint32(4,true)!==1)throw new Error('Invalid boulder');
      const count=d.getUint32(8,true);let at=12;
      for(let b=0;b<count;b++){
        const nv=d.getUint32(at,true),ni=d.getUint32(at+4,true);at+=8;
        const vertices=new Float32Array(buffer.slice(at,at+nv*24));at+=nv*24;
        const indices=new Uint16Array(buffer.slice(at,at+ni*2));at+=ni*2;
        const vb=gl.createBuffer(),ib=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,vb);gl.bufferData(gl.ARRAY_BUFFER,vertices,gl.STATIC_DRAW);gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,ib);gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,indices,gl.STATIC_DRAW);
        const low=[Infinity,Infinity,Infinity],high=[-Infinity,-Infinity,-Infinity];
        for(let i=0;i<nv;i++)for(let a=0;a<3;a++){low[a]=Math.min(low[a],vertices[i*6+a]);high[a]=Math.max(high[a],vertices[i*6+a]);}
        batches.push({vb,ib,vertices,indices,low,high});triangleCount+=ni/3;
      }
      if(at!==buffer.byteLength)throw new Error('Incomplete boulder');
    }
    function load(){if(loading)return loading;loading=(async()=>{
      const compressed=typeof DecompressionStream==='function';
      function image(path){return new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=reject;img.src=path;});}
      const [response,img,lichen,meta]=await Promise.all([fetch(`assets/images/nire/boulder.bin${compressed?'.gz':''}?v=1`),image('assets/images/nire/boulder-albedo-v1.png'),image('assets/images/nire/boulder-black-lichen-v1.png'),fetch('assets/images/nire/boulder.json?v=2').then(r=>{if(!r.ok)throw new Error('Boulder attachment unavailable');return r.json();})]);
      if(!response.ok)throw new Error('Boulder unavailable');let raw=await response.arrayBuffer();const head=new Uint8Array(raw,0,2);
      if(head[0]===31&&head[1]===139)raw=await new Response(new Blob([raw]).stream().pipeThrough(new DecompressionStream('gzip'))).arrayBuffer();
      if(gl.isContextLost())return;attachment=meta.attachment;if(!attachment||attachment.center?.length!==3||attachment.frame?.length!==3||!(attachment.heightInSourcePixels>0))throw new Error('Invalid boulder attachment');build(raw);
      // Power-of-two upload permits proper mipmaps and repeat in WebGL 1.
      const tile=document.createElement('canvas');tile.width=tile.height=2048;tile.getContext('2d').drawImage(img,0,0,2048,2048);
      texture=gl.createTexture();gl.activeTexture(gl.TEXTURE5);gl.bindTexture(gl.TEXTURE_2D,texture);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,false);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,tile);
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.REPEAT);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.REPEAT);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR_MIPMAP_LINEAR);gl.generateMipmap(gl.TEXTURE_2D);
      const anisotropy=gl.getExtension('EXT_texture_filter_anisotropic');if(anisotropy)gl.texParameterf(gl.TEXTURE_2D,anisotropy.TEXTURE_MAX_ANISOTROPY_EXT,Math.min(8,gl.getParameter(anisotropy.MAX_TEXTURE_MAX_ANISOTROPY_EXT)));
      const colony=document.createElement('canvas');colony.width=colony.height=2048;colony.getContext('2d').drawImage(lichen,0,0,2048,2048);
      lichenTexture=gl.createTexture();gl.activeTexture(gl.TEXTURE2);gl.bindTexture(gl.TEXTURE_2D,lichenTexture);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,false);gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL,false);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,colony);
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR_MIPMAP_LINEAR);gl.generateMipmap(gl.TEXTURE_2D);
      if(anisotropy)gl.texParameterf(gl.TEXTURE_2D,anisotropy.TEXTURE_MAX_ANISOTROPY_EXT,Math.min(8,gl.getParameter(anisotropy.MAX_TEXTURE_MAX_ANISOTROPY_EXT)));
      ready=true;changed({triangles:triangleCount});
    })().catch(error=>{ready=false;console.warn('Boulder material unavailable',error);});return loading;}
    function draw(view,base,world,angle,tilt,strength){
      if(!ready||strength<.001||gl.isContextLost())return;
      const p=pose();gl.useProgram(program);
      for(let i=0;i<attributeCount;i++)gl.disableVertexAttribArray(i);
      gl.uniform2f(uniforms.uViewport,view.width,view.height);gl.uniform2f(uniforms.uCenter,view.cx,view.cy);gl.uniform3fv(uniforms.uOrigin,p.center);gl.uniformMatrix3fv(uniforms.uFrame,false,columnMajorFrame());gl.uniform1f(uniforms.uWidth,view.scale*world.width);gl.uniform1f(uniforms.uAngle,angle);gl.uniform1f(uniforms.uTilt,tilt);gl.uniform1f(uniforms.uSize,p.size);gl.uniform1f(uniforms.uStrength,strength);gl.uniform1i(uniforms.uStone,5);gl.uniform1i(uniforms.uLichen,2);
      gl.activeTexture(gl.TEXTURE2);gl.bindTexture(gl.TEXTURE_2D,lichenTexture);
      gl.activeTexture(gl.TEXTURE5);gl.bindTexture(gl.TEXTURE_2D,texture);gl.enable(gl.DEPTH_TEST);gl.depthMask(true);gl.depthFunc(gl.LESS);gl.disable(gl.CULL_FACE);
      for(const b of batches){gl.bindBuffer(gl.ARRAY_BUFFER,b.vb);gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,b.ib);for(const[name,offset]of [['aPosition',0],['aNormal',12]]){gl.enableVertexAttribArray(attributes[name]);gl.vertexAttribPointer(attributes[name],3,gl.FLOAT,false,24,offset);}gl.drawElements(gl.TRIANGLES,b.indices.length,gl.UNSIGNED_SHORT,0);}
      gl.disable(gl.DEPTH_TEST);
    }
    function pickPoint(view,base,world,angle,tilt,x,y){
      if(!ready)return null;const p=pose(),scale=view.scale*world.width;
      const origin=unframe(inverse([0,0,4],angle,tilt).map((v,i)=>v-p.center[i])).map(v=>v/p.size);
      const direction=unframe(inverse([(x-view.cx)/scale,-(y-view.cy)/scale,-4],angle,tilt)).map(v=>v/p.size);
      let best=Infinity;
      for(const b of batches){
        let lo=0,hi=best;
        for(let a=0;a<3;a++){
          if(Math.abs(direction[a])<1.e-12){if(origin[a]<b.low[a]||origin[a]>b.high[a])hi=-1;continue;}
          const t0=(b.low[a]-origin[a])/direction[a],t1=(b.high[a]-origin[a])/direction[a];lo=Math.max(lo,Math.min(t0,t1));hi=Math.min(hi,Math.max(t0,t1));
        }
        if(lo>hi)continue;const v=b.vertices,ix=b.indices,[dx,dy,dz]=direction;
        for(let i=0;i<ix.length;i+=3){
          const a=ix[i]*6,b=ix[i+1]*6,c=ix[i+2]*6;
          const e1x=v[b]-v[a],e1y=v[b+1]-v[a+1],e1z=v[b+2]-v[a+2],e2x=v[c]-v[a],e2y=v[c+1]-v[a+1],e2z=v[c+2]-v[a+2];
          const px=dy*e2z-dz*e2y,py=dz*e2x-dx*e2z,pz=dx*e2y-dy*e2x,det=e1x*px+e1y*py+e1z*pz;if(Math.abs(det)<1.e-12)continue;
          const tx=origin[0]-v[a],ty=origin[1]-v[a+1],tz=origin[2]-v[a+2],u=(tx*px+ty*py+tz*pz)/det;if(u<0||u>1)continue;
          const qx=ty*e1z-tz*e1y,qy=tz*e1x-tx*e1z,qz=tx*e1y-ty*e1x,w=(dx*qx+dy*qy+dz*qz)/det;if(w<0||u+w>1)continue;
          const t=(e2x*qx+e2y*qy+e2z*qz)/det;if(t>0&&t<best)best=t;
        }
      }
      if(!Number.isFinite(best))return null;
      const local=origin.map((v,i)=>(v+direction[i]*best)*p.size),point=frame(local).map((v,i)=>v+p.center[i]),camera=rotate(point,angle,tilt);
      return{point,depth:camera[2]};
    }
    return{load,draw,pickPoint,feature,ready:()=>ready};
  };
}());
