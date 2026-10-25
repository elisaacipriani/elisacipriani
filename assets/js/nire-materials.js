(function () {
  "use strict";

  // Painted grains, rose gel and copper bodies retain their own scale and skin.
  window.createNireMaterials = function (gl, changed) {
    const vertex=`
      attribute vec3 aPosition, aNormal, aColor;
      attribute vec2 aUV;
      uniform vec2 uViewport, uCenter;
      uniform float uWidth,uAngle,uTilt;
      varying vec3 vNormal,vColor;
      varying vec2 vUV;
      vec3 rotate(vec3 p){
        float c=cos(uAngle),s=sin(uAngle);p=vec3(c*p.x+s*p.z,p.y,-s*p.x+c*p.z);
        c=cos(uTilt);s=sin(uTilt);return vec3(p.x,c*p.y-s*p.z,s*p.y+c*p.z);
      }
      void main(){
        vec3 p=rotate(aPosition);float w=4.0-p.z;
        vec2 center=vec2(2.0*uCenter.x/uViewport.x-1.0,1.0-2.0*uCenter.y/uViewport.y);
        gl_Position=vec4(center*w+p.xy*uWidth*8.0/uViewport,-p.z*.6,w);
        vNormal=rotate(aNormal);vColor=aColor;vUV=aUV;
      }`;
    const fragment=`
      precision highp float;
      uniform sampler2D uPhoto,uDetail;
      uniform vec4 uDetailBounds;
      uniform vec2 uLight;
      uniform float uStrength,uKind,uBack;
      varying vec3 vNormal,vColor;
      varying vec2 vUV;
      vec3 source(vec2 uv){
        vec2 local=(uv-uDetailBounds.xy)/max(uDetailBounds.zw,vec2(.00001));
        if(uDetailBounds.z>0.0&&local.x>=0.0&&local.x<=1.0&&local.y>=0.0&&local.y<=1.0)return texture2D(uDetail,local).rgb;
        return texture2D(uPhoto,uv).rgb;
      }
      float brightness(vec2 uv){return dot(source(uv),vec3(.299,.587,.114));}
      float grain(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
      void main(){
        vec3 n=normalize(vNormal),key=normalize(vec3(-.48+uLight.x*.45,.68-uLight.y*.4,1.0)),eye=vec3(0.0,0.0,1.0);
        vec3 original=source(vUV);
        if(uKind>2.5){
          vec2 step=vec2(1.0/7020.0,1.0/9928.0);
          vec2 slope=vec2(brightness(vUV-step*vec2(1.0,0.0))-brightness(vUV+step*vec2(1.0,0.0)),brightness(vUV+step*vec2(0.0,1.0))-brightness(vUV-step*vec2(0.0,1.0)));
          n=normalize(n+vec3(slope*.7,0.0));
        }
        float diffuse=max(0.0,dot(n,key)),rim=pow(1.0-max(0.0,dot(n,eye)),3.0);
        float shine=pow(max(0.0,dot(n,normalize(key+eye))),uKind<1.5?86.0:uKind<2.5?72.0:28.0);
        vec3 color;float alpha=1.0;
        if(uKind<1.5){
          float peak=max(.04,max(max(vColor.r,vColor.g),vColor.b));
          vec3 pigment=mix(vec3(.92,.79,.25),vColor/peak,.72);
          color=pigment*(.22+.83*diffuse)+vec3(1.0,.98,.75)*shine*.78+pigment*rim*.14;
          color*=.985+.015*grain(vUV*vec2(88000.0,120000.0));
        }else if(uKind<2.5){
          float hot=smoothstep(.15,.46,original.r-original.g);
          vec3 rose=mix(vec3(.91,.62,.79),vec3(.95,.28,.60),hot);
          color=rose*(.44+.72*diffuse)+vec3(1.0,.88,.95)*shine*.58+rose*rim*.24;
          alpha=mix(.73,.90,rim);
          if(uBack>.5){color=rose*.75;alpha=.18;}
        }else{
          float light=dot(original,vec3(.299,.587,.114));
          float crack=1.0-smoothstep(.02,.25,light);
          vec3 copper=mix(vColor,vec3(.48,.20,.10),crack*.45);
          float roughness=.965+.035*grain(vUV*vec2(64000.0,84000.0));
          color=copper*(.28+.85*diffuse)*roughness+vec3(1.0,.75,.4)*shine*.26;
        }
        gl_FragColor=vec4(color,alpha*uStrength);
      }`;
    function shader(type,source){const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw new Error('ÑIRE material shader unavailable');return s;}
    let program;
    try{program=gl.createProgram();gl.attachShader(program,shader(gl.VERTEX_SHADER,vertex));gl.attachShader(program,shader(gl.FRAGMENT_SHADER,fragment));gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))return null;}catch(_){return null;}
    const uniforms={},attributes={};
    ['uViewport','uCenter','uWidth','uAngle','uTilt','uStrength','uLight','uKind','uBack','uPhoto','uDetail','uDetailBounds'].forEach(k=>uniforms[k]=gl.getUniformLocation(program,k));
    ['aPosition','aNormal','aColor','aUV'].forEach(k=>attributes[k]=gl.getAttribLocation(program,k));
    const mask=gl.createTexture();gl.activeTexture(gl.TEXTURE5);gl.bindTexture(gl.TEXTURE_2D,mask);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,1,1,0,gl.RGBA,gl.UNSIGNED_BYTE,new Uint8Array([0,0,0,0]));
    const countAttributes=gl.getParameter(gl.MAX_VERTEX_ATTRIBS),batches=[];
    let ready=false,loading=null;
    const stats={yellow:0,pink:0,orange:0};
    function build(buffer){
      const data=new DataView(buffer);
      if(data.byteLength<16||data.getUint32(0,true)!==0x4d52494e||data.getUint32(4,true)!==1)throw new Error('Invalid ÑIRE materials');
      const width=data.getUint16(8,true),height=data.getUint16(10,true),count=data.getUint32(12,true),aspect=height/width;let at=16;
      for(let b=0;b<count;b++){
        const kind=data.getUint32(at,true),nv=data.getUint32(at+4,true),ni=data.getUint32(at+8,true),bounds=[0,1,2,3].map(i=>data.getFloat32(at+12+i*4,true));at+=28;
        const vertices=new Float32Array(nv*11);
        for(let i=0;i<nv;i++,at+=12){
          const x=data.getInt16(at,true)/8,y=data.getInt16(at+2,true)/8,z=data.getInt16(at+4,true)/256,u=x/width,v=y/height;
          const nx=data.getInt8(at+6)/127,ny=data.getInt8(at+7)/127,nz=data.getInt8(at+8)/127;
          const a=u*6.8+v*3.2,b=v*9.5-u*2.8,base=.105*Math.sin(a)+.045*Math.cos(b)+.013;
          const dx=.105*6.8*Math.cos(a)+.045*2.8*Math.sin(b),dy=(.105*3.2*Math.cos(a)-.045*9.5*Math.sin(b))/aspect;
          const normal=[nx-dx*nz,-ny+dy*nz,nz],length=Math.hypot(...normal)||1;
          vertices.set([u-.5,(.5-v)*aspect,base+z/width,...normal.map(n=>n/length),data.getUint8(at+9)/255,data.getUint8(at+10)/255,data.getUint8(at+11)/255,u,v],i*11);
        }
        const indices=new Uint16Array(buffer,at,ni);at+=ni*2;
        const vb=gl.createBuffer(),ib=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,vb);gl.bufferData(gl.ARRAY_BUFFER,vertices,gl.STATIC_DRAW);gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,ib);gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,indices,gl.STATIC_DRAW);
        batches.push({kind,vertices:vb,indices:ib,count:ni,bounds});stats[kind===1?'yellow':kind===2?'pink':'orange']+=ni/3;
      }
      if(at!==buffer.byteLength)throw new Error('Incomplete ÑIRE materials');
    }
    async function load(){
      if(loading)return loading;
      loading=(async()=>{
        const picture=new Image();picture.decoding='async';const imageReady=new Promise((resolve,reject)=>{picture.onload=resolve;picture.onerror=reject;});picture.src='assets/images/nire/material-mask.png?v=2';
        const atlasReady=imageReady.then(()=>{if(gl.isContextLost())return;gl.activeTexture(gl.TEXTURE5);gl.bindTexture(gl.TEXTURE_2D,mask);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,picture);changed(null);});
        const geometry=(async()=>{const compressed=typeof DecompressionStream==='function';const r=await fetch(`assets/images/nire/materials.bin${compressed?'.gz':''}?v=2`);if(!r.ok)throw new Error('ÑIRE materials unavailable');const raw=await r.arrayBuffer(),header=new Uint8Array(raw,0,2);return header[0]===31&&header[1]===139?new Response(new Blob([raw]).stream().pipeThrough(new DecompressionStream('gzip'))).arrayBuffer():raw;})();
        const [buffer]=await Promise.all([geometry,atlasReady]);if(gl.isContextLost())return;
        build(buffer);ready=true;changed(stats);
      })().catch(()=>{ready=false;});return loading;
    }
    function draw(view,world,angle,tilt,strength,light,area,detailBounds){
      if(!ready||strength<.001||gl.isContextLost())return;
      gl.useProgram(program);gl.uniform2f(uniforms.uViewport,view.width,view.height);gl.uniform2f(uniforms.uCenter,view.cx,view.cy);gl.uniform1f(uniforms.uWidth,view.scale*world.width);gl.uniform1f(uniforms.uAngle,angle);gl.uniform1f(uniforms.uTilt,tilt);gl.uniform1f(uniforms.uStrength,strength);gl.uniform2f(uniforms.uLight,light.x,light.y);gl.uniform1i(uniforms.uPhoto,0);gl.uniform1i(uniforms.uDetail,2);gl.uniform4fv(uniforms.uDetailBounds,detailBounds);
      gl.enable(gl.DEPTH_TEST);gl.depthFunc(gl.LESS);
      for(let i=0;i<countAttributes;i++)gl.disableVertexAttribArray(i);
      function part(batch){
        const b=batch.bounds;if(area&&(b[2]<area.left-.06||b[0]>area.right+.06||b[3]<area.top-.06||b[1]>area.bottom+.06))return;
        gl.uniform1f(uniforms.uKind,batch.kind);gl.bindBuffer(gl.ARRAY_BUFFER,batch.vertices);gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,batch.indices);
        [['aPosition',3,0],['aNormal',3,3],['aColor',3,6],['aUV',2,9]].forEach(([name,size,offset])=>{gl.enableVertexAttribArray(attributes[name]);gl.vertexAttribPointer(attributes[name],size,gl.FLOAT,false,44,offset*4);});gl.drawElements(gl.TRIANGLES,batch.count,gl.UNSIGNED_SHORT,0);
      }
      gl.uniform1f(uniforms.uBack,0);for(const b of batches)if(b.kind!==2)part(b);
      // A shallow back skin and a translucent front give the rose body thickness.
      gl.enable(gl.CULL_FACE);gl.depthMask(false);gl.cullFace(gl.FRONT);gl.uniform1f(uniforms.uBack,1);for(const b of batches)if(b.kind===2)part(b);
      gl.cullFace(gl.BACK);gl.uniform1f(uniforms.uBack,0);for(const b of batches)if(b.kind===2)part(b);
      gl.depthMask(true);gl.disable(gl.CULL_FACE);gl.disable(gl.DEPTH_TEST);
    }
    return{load,draw,ready:()=>ready,stats};
  };
}());
