(function(){
  'use strict';
  // The original miniature marks use the same closed aril mesh and optical
  // interior as the larger clusters. No camera-facing sphere approximation.
  window.createNireMaterials=function(gl,changed){
    const derivatives=gl.getExtension('OES_standard_derivatives');
    const instancing=gl.getExtension('ANGLE_instanced_arrays');
    const vertex=`
      attribute vec3 aPosition,aNormal,aCenter;
      attribute float aRadius;
      attribute vec2 aAngles;
      uniform vec2 uViewport,uCenter;
      uniform float uWidth,uAngle,uTilt;
      varying vec3 vNormal,vBodyNormal,vBodyPosition,vView;
      varying vec2 vAngles;
      varying float vRadius;
      vec3 rotate(vec3 p){float c=cos(uAngle),s=sin(uAngle);p=vec3(c*p.x+s*p.z,p.y,-s*p.x+c*p.z);c=cos(uTilt);s=sin(uTilt);return vec3(p.x,c*p.y-s*p.z,s*p.y+c*p.z);}
      vec3 seed(vec3 p){float c=cos(aAngles.x),s=sin(aAngles.x);p=vec3(c*p.x-s*p.y,s*p.x+c*p.y,p.z);c=cos(aAngles.y);s=sin(aAngles.y);return vec3(c*p.x+s*p.z,p.y,-s*p.x+c*p.z);}
      void main(){
        vec3 p=rotate(aCenter+seed(aPosition)*aRadius);float w=4.0-p.z;
        vec2 center=vec2(2.0*uCenter.x/uViewport.x-1.0,1.0-2.0*uCenter.y/uViewport.y);
        gl_Position=vec4(center*w+p.xy*uWidth*8.0/uViewport,-p.z*.6,w);
        vNormal=rotate(seed(aNormal));vBodyNormal=aNormal;vBodyPosition=aPosition;
        vView=p;vRadius=aRadius;vAngles=aAngles;
      }`;
    const fragment=`${derivatives?'#extension GL_OES_standard_derivatives : enable\n':''}
      precision highp float;
      uniform float uStrength,uAngle,uTilt,uWidth,uRefraction;
      uniform sampler2D uSkin,uBehind;
      uniform vec2 uViewport,uRenderSize;
      varying vec3 vNormal,vBodyNormal,vBodyPosition,vView;
      varying vec2 vAngles;
      varying float vRadius;
      vec3 unrotate(vec3 p){float c=cos(uTilt),s=sin(uTilt);p=vec3(p.x,c*p.y+s*p.z,-s*p.y+c*p.z);c=cos(uAngle);s=sin(uAngle);return vec3(c*p.x-s*p.z,p.y,s*p.x+c*p.z);}
      vec3 unseed(vec3 p){float c=cos(vAngles.y),s=sin(vAngles.y);p=vec3(c*p.x-s*p.z,p.y,s*p.x+c*p.z);c=cos(vAngles.x);s=sin(vAngles.x);return vec3(c*p.x+s*p.y,-s*p.x+c*p.y,p.z);}
      ${window.nireCoralMaterialGLSL(derivatives)}
      void main(){
        vec3 eye=normalize(vec3(0,0,4)-vView);
        vec3 color=coralMaterial(normalize(vNormal),vBodyNormal,vBodyPosition,vView,vRadius,normalize(unseed(unrotate(eye))));
        gl_FragColor=vec4(color,uStrength);
      }`;
    function shader(type,source){const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(s));return s;}
    let program;
    try{program=gl.createProgram();gl.attachShader(program,shader(gl.VERTEX_SHADER,vertex));gl.attachShader(program,shader(gl.FRAGMENT_SHADER,fragment));gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(program));}
    catch(error){console.warn('Miniature arils unavailable',error);return null;}
    const uniforms={},attributes={},attributeCount=gl.getParameter(gl.MAX_VERTEX_ATTRIBS);
    for(const k of ['uViewport','uCenter','uWidth','uAngle','uTilt','uStrength','uSkin','uBehind','uRenderSize','uRefraction'])uniforms[k]=gl.getUniformLocation(program,k);
    for(const k of ['aPosition','aNormal','aCenter','aRadius','aAngles'])attributes[k]=gl.getAttribLocation(program,k);
    const meshBuffer=gl.createBuffer(),indexBuffer=gl.createBuffer(),lowMeshBuffer=gl.createBuffer(),lowIndexBuffer=gl.createBuffer(),instanceBuffer=gl.createBuffer();
    const fallback=gl.createTexture();gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,fallback);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,1,1,0,gl.RGBA,gl.UNSIGNED_BYTE,new Uint8Array([251,145,118,255]));
    const behind=gl.createTexture();let captureWidth=0,captureHeight=0;
    gl.activeTexture(gl.TEXTURE7);gl.bindTexture(gl.TEXTURE_2D,behind);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGB,1,1,0,gl.RGB,gl.UNSIGNED_BYTE,new Uint8Array([232,234,232]));
    let ready=false,loading=null,indexCount=0,lowIndexCount=0,maxRadius=0,pickData=new Float32Array(0),sourceInstances,sortedInstances,lastAngle=null,lastTilt=null;
    const stats={spheres:0,triangles:0};
    function build(data,raw,lowRaw){
      const d=new DataView(raw);if(d.getUint32(0,true)!==0x4152494e||d.getUint32(4,true)!==1)throw new Error('Invalid aril surface');
      const nv=d.getUint32(8,true),ni=d.getUint32(12,true);
      if(16+nv*24+ni*2!==raw.byteLength)throw new Error('Incomplete aril surface');
      gl.bindBuffer(gl.ARRAY_BUFFER,meshBuffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(raw.slice(16,16+nv*24)),gl.STATIC_DRAW);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,indexBuffer);gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,new Uint16Array(raw.slice(16+nv*24)),gl.STATIC_DRAW);indexCount=ni;
      const ld=new DataView(lowRaw),ln=ld.getUint32(8,true),li=ld.getUint32(12,true);
      if(ld.getUint32(0,true)!==0x4152494e||16+ln*24+li*2!==lowRaw.byteLength)throw new Error('Invalid distant aril surface');
      gl.bindBuffer(gl.ARRAY_BUFFER,lowMeshBuffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(lowRaw.slice(16,16+ln*24)),gl.STATIC_DRAW);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,lowIndexBuffer);gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,new Uint16Array(lowRaw.slice(16+ln*24)),gl.STATIC_DRAW);lowIndexCount=li;
      const instances=[],picking=[];
      data.beads.forEach(([x,y,r],i)=>{
        const u=x/data.width,v=y/data.height,frame=window.NireTreeForm.frame(u,v);
        const center=window.NireTreeForm.point(frame,u,v,r*.25/data.width),radius=r/data.width;
        picking.push(...center,radius*1.15);maxRadius=Math.max(maxRadius,radius);
        instances.push(...center,radius,.48*Math.sin(i*2.39996+.4),.52*Math.sin(i*1.73+.8));
      });
      sourceInstances=new Float32Array(instances);sortedInstances=new Float32Array(instances.length);pickData=new Float32Array(picking);
      gl.bindBuffer(gl.ARRAY_BUFFER,instanceBuffer);gl.bufferData(gl.ARRAY_BUFFER,sourceInstances,gl.DYNAMIC_DRAW);
      stats.spheres=data.beads.length;stats.triangles=indexCount/3*stats.spheres;
    }
    function load(){if(loading)return loading;loading=(async()=>{
      const compressed=typeof DecompressionStream==='function';
      const [data,response,lowResponse]=await Promise.all([
        fetch('assets/images/nire/beads.json?v=2').then(r=>{if(!r.ok)throw new Error('Miniature marks unavailable');return r.json();}),
        fetch(`assets/images/nire/aril-mesh.bin${compressed?'.gz':''}?v=1`),fetch(`assets/images/nire/aril-mesh-low.bin${compressed?'.gz':''}?v=1`),window.NireTreeForm.load()
      ]);
      if(!response.ok||!lowResponse.ok)throw new Error('Aril surface unavailable');
      async function unpack(response){let raw=await response.arrayBuffer(),head=new Uint8Array(raw,0,2);return head[0]===31&&head[1]===139?new Response(new Blob([raw]).stream().pipeThrough(new DecompressionStream('gzip'))).arrayBuffer():raw;}
      const [raw,lowRaw]=await Promise.all([unpack(response),unpack(lowResponse)]);
      if(gl.isContextLost())return;build(data,raw,lowRaw);ready=true;changed(stats);
    })().catch(error=>{ready=false;console.warn('Miniature arils unavailable',error)});return loading;}
    function draw(view,world,angle,tilt,strength,light,detail=0,wax=null){
      if(!ready||strength<.001||gl.isContextLost())return;
      gl.useProgram(program);gl.uniform2f(uniforms.uViewport,view.width,view.height);gl.uniform2f(uniforms.uCenter,view.cx,view.cy);gl.uniform1f(uniforms.uWidth,view.scale*world.width);gl.uniform1f(uniforms.uAngle,angle);gl.uniform1f(uniforms.uTilt,tilt);gl.uniform1f(uniforms.uStrength,strength);
      gl.uniform1i(uniforms.uSkin,0);gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,wax||fallback);
      gl.uniform1i(uniforms.uBehind,7);gl.activeTexture(gl.TEXTURE7);gl.bindTexture(gl.TEXTURE_2D,behind);
      const width=gl.drawingBufferWidth,height=gl.drawingBufferHeight,max=gl.getParameter(gl.MAX_TEXTURE_SIZE);let captured=false;
      if(width<=max&&height<=max){if(width!==captureWidth||height!==captureHeight){gl.copyTexImage2D(gl.TEXTURE_2D,0,gl.RGB,0,0,width,height,0);captureWidth=width;captureHeight=height;}else gl.copyTexSubImage2D(gl.TEXTURE_2D,0,0,0,0,0,width,height);captured=true;}
      gl.uniform1f(uniforms.uRefraction,captured?1:0);gl.uniform2f(uniforms.uRenderSize,width,height);
      if(angle!==lastAngle||tilt!==lastTilt){
        const c=Math.cos(angle),s=Math.sin(angle),ct=Math.cos(tilt),st=Math.sin(tilt),depth=i=>st*sourceInstances[i*6+1]+ct*(-s*sourceInstances[i*6]+c*sourceInstances[i*6+2]);
        const order=Array.from({length:stats.spheres},(_,i)=>i).sort((a,b)=>depth(a)-depth(b));
        order.forEach((id,i)=>sortedInstances.set(sourceInstances.subarray(id*6,id*6+6),i*6));
        gl.bindBuffer(gl.ARRAY_BUFFER,instanceBuffer);gl.bufferSubData(gl.ARRAY_BUFFER,0,sortedInstances);lastAngle=angle;lastTilt=tilt;
      }
      for(let i=0;i<attributeCount;i++)gl.disableVertexAttribArray(i);
      const coarse=maxRadius*view.scale*world.width<18,drawCount=coarse?lowIndexCount:indexCount;
      gl.bindBuffer(gl.ARRAY_BUFFER,coarse?lowMeshBuffer:meshBuffer);gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,coarse?lowIndexBuffer:indexBuffer);
      for(const [name,offset]of [['aPosition',0],['aNormal',3]]){gl.enableVertexAttribArray(attributes[name]);gl.vertexAttribPointer(attributes[name],3,gl.FLOAT,false,24,offset*4);}
      gl.enable(gl.DEPTH_TEST);gl.depthFunc(gl.LESS);gl.depthMask(false);gl.enable(gl.CULL_FACE);gl.cullFace(gl.BACK);
      if(instancing){
        gl.bindBuffer(gl.ARRAY_BUFFER,instanceBuffer);
        for(const [name,size,offset]of [['aCenter',3,0],['aRadius',1,3],['aAngles',2,4]]){gl.enableVertexAttribArray(attributes[name]);gl.vertexAttribPointer(attributes[name],size,gl.FLOAT,false,24,offset*4);instancing.vertexAttribDivisorANGLE(attributes[name],1);}
        instancing.drawElementsInstancedANGLE(gl.TRIANGLES,drawCount,gl.UNSIGNED_SHORT,0,stats.spheres);
        for(const name of ['aCenter','aRadius','aAngles'])instancing.vertexAttribDivisorANGLE(attributes[name],0);
      }else{
        for(let i=0;i<stats.spheres;i++){
          const at=i*6;gl.vertexAttrib3f(attributes.aCenter,...sortedInstances.subarray(at,at+3));gl.vertexAttrib1f(attributes.aRadius,sortedInstances[at+3]);gl.vertexAttrib2f(attributes.aAngles,sortedInstances[at+4],sortedInstances[at+5]);gl.drawElements(gl.TRIANGLES,drawCount,gl.UNSIGNED_SHORT,0);
        }
      }
      gl.depthMask(true);gl.disable(gl.CULL_FACE);gl.disable(gl.DEPTH_TEST);
    }
    return{load,draw,ready:()=>ready,stats,pickPoints:()=>[pickData]};
  };
}());
