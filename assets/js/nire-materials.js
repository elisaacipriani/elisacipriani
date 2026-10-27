(function () {
  "use strict";

  // The broad source marks are part of the unified tree mesh. Only the small
  // original dots stay exact spheres, now with the same translucent coral skin.
  window.createNireMaterials = function (gl, changed) {
    const derivatives=gl.getExtension('OES_standard_derivatives');
    const depthExtension=gl.getExtension('EXT_frag_depth');
    const vertex=`
      attribute vec3 aCenter;
      attribute vec2 aCorner;
      attribute float aRadius;
      uniform vec2 uViewport,uCenter;
      uniform float uWidth,uAngle,uTilt;
      varying vec2 vDisc;
      varying float vDepth,vRadius,vEdge;
      varying vec3 vSeed;
      vec3 rotate(vec3 p){
        float c=cos(uAngle),s=sin(uAngle);p=vec3(c*p.x+s*p.z,p.y,-s*p.x+c*p.z);
        c=cos(uTilt);s=sin(uTilt);return vec3(p.x,c*p.y-s*p.z,s*p.y+c*p.z);
      }
      void main(){
        vec3 p=rotate(aCenter);float w=4.0-p.z;
        vec2 center=vec2(2.0*uCenter.x/uViewport.x-1.0,1.0-2.0*uCenter.y/uViewport.y);
        float pixels=aRadius*uWidth*4.0/w;
        float margin=1.0+1.25/max(1.0,pixels);
        gl_Position=vec4(center*w+(p.xy+aCorner*aRadius*margin)*uWidth*8.0/uViewport,-(p.z+aRadius)*.6,w);
        vDisc=aCorner*margin;vDepth=p.z;vRadius=aRadius;
        vSeed=aCenter*17.0;
        vEdge=w/max(1.0,aRadius*uWidth*4.0);
      }`;
    const fragment=`${depthExtension?'#extension GL_EXT_frag_depth : enable\n':''}${derivatives?'#extension GL_OES_standard_derivatives : enable\n':''}
      precision highp float;
      uniform float uStrength,uDetail;
      uniform float uAngle,uTilt,uHasWax;
      uniform sampler2D uWax;
      uniform vec2 uLight;
      varying vec2 vDisc;
      varying float vDepth,vRadius,vEdge;
      varying vec3 vSeed;
      vec3 unrotate(vec3 p){float c=cos(uTilt),s=sin(uTilt);p=vec3(p.x,c*p.y+s*p.z,-s*p.y+c*p.z);c=cos(uAngle);s=sin(uAngle);return vec3(c*p.x-s*p.z,p.y,s*p.x+c*p.z);}
      void main(){
        float r2=dot(vDisc,vDisc);
        float aa=${derivatives?'max(fwidth(r2),.00001)':'max(vEdge*2.0,.00001)'};
        if(r2>1.0+aa)discard;
        float coverage=1.0-smoothstep(1.0-aa,1.0+aa,r2);
        vec3 n=normalize(vec3(vDisc,sqrt(max(0.0,1.0-r2))));
        vec3 key=normalize(vec3(-.72,1.05,.58));
        vec3 fill=normalize(vec3(.8,-.25,.6)),eye=vec3(0.0,0.0,1.0);
        float diffuse=max(0.0,dot(n,key)),soft=max(0.0,dot(n,fill));
        float shine=pow(max(0.0,dot(n,normalize(key+eye))),48.0);
        vec3 pearl=vec3(.99,.59,.49);
        if(uHasWax>.5){
          vec3 local=unrotate(n),p=local*.40+vSeed,w=pow(abs(local),vec3(5.0));w/=w.x+w.y+w.z;
          vec3 coat=texture2D(uWax,p.yz+.17).rgb*w.x+texture2D(uWax,p.zx+.31).rgb*w.y+texture2D(uWax,p.xy+.52).rgb*w.z;
          pearl=mix(pearl,coat,.52);
        }
        vec3 color=pearl*(.68+.30*diffuse+.13*soft)+vec3(1.0,.95,.86)*shine*.055;
        float rim=pow(1.0-n.z,5.0);
        color=mix(color,vec3(.96,.87,.79),rim*.24);
        ${depthExtension?'float z=vDepth+vRadius*n.z;gl_FragDepthEXT=.5-.3*z/(4.0-z);':''}
        gl_FragColor=vec4(color,coverage*uStrength*(.52+.27*n.z));
      }`;
    function shader(type,source){
      const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);
      if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw new Error('ÑIRE sphere shader unavailable');
      return s;
    }
    let program;
    try{
      program=gl.createProgram();gl.attachShader(program,shader(gl.VERTEX_SHADER,vertex));gl.attachShader(program,shader(gl.FRAGMENT_SHADER,fragment));gl.linkProgram(program);
      if(!gl.getProgramParameter(program,gl.LINK_STATUS))return null;
    }catch(_){return null;}
    const uniforms={},attributes={};
    ['uViewport','uCenter','uWidth','uAngle','uTilt','uStrength','uLight','uDetail','uWax','uHasWax'].forEach(k=>uniforms[k]=gl.getUniformLocation(program,k));
    ['aCenter','aCorner','aRadius'].forEach(k=>attributes[k]=gl.getAttribLocation(program,k));
    const buffer=gl.createBuffer(),attributeCount=gl.getParameter(gl.MAX_VERTEX_ATTRIBS);
    const fallback=gl.createTexture();gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,fallback);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,1,1,0,gl.RGBA,gl.UNSIGNED_BYTE,new Uint8Array([175,185,170,255]));
    let ready=false,loading=null,count=0,pickData=new Float32Array(0),sourceVertices,sortedVertices,lastAngle=null,lastTilt=null;
    const stats={spheres:0,triangles:0};
    function build(data){
      const vertices=[],picking=[],corners=[[-1,-1],[1,-1],[-1,1],[-1,1],[1,-1],[1,1]];
      for(const[x,y,r]of data.beads){
        const u=x/data.width,v=y/data.height,frame=window.NireTreeForm.frame(u,v);
        const position=window.NireTreeForm.point(frame,u,v,r*.25/data.width),radius=r/data.width;
        picking.push(...position,radius);
        for(const corner of corners)vertices.push(...position,...corner,radius);
      }
      sourceVertices=new Float32Array(vertices);sortedVertices=new Float32Array(vertices.length);
      gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,sourceVertices,gl.DYNAMIC_DRAW);
      count=data.beads.length*6;stats.spheres=data.beads.length;stats.triangles=count/3;pickData=new Float32Array(picking);
    }
    function load(){
      if(loading)return loading;
      loading=(async()=>{
        const spheres=fetch('assets/images/nire/beads.json?v=2').then(r=>{if(!r.ok)throw new Error('ÑIRE spheres unavailable');return r.json();});
        const[data]=await Promise.all([spheres,window.NireTreeForm.load()]);if(gl.isContextLost())return;
        build(data);ready=true;changed(stats);
      })().catch(()=>{ready=false;});return loading;
    }
    function draw(view,world,angle,tilt,strength,light,detail=0,wax=null){
      if(!ready||strength<.001||gl.isContextLost())return;
      gl.useProgram(program);gl.uniform2f(uniforms.uViewport,view.width,view.height);gl.uniform2f(uniforms.uCenter,view.cx,view.cy);
      gl.uniform1f(uniforms.uWidth,view.scale*world.width);gl.uniform1f(uniforms.uAngle,angle);gl.uniform1f(uniforms.uTilt,tilt);gl.uniform1f(uniforms.uStrength,strength);gl.uniform2f(uniforms.uLight,light.x,light.y);
      gl.uniform1f(uniforms.uDetail,detail);
      gl.uniform1i(uniforms.uWax,0);gl.uniform1f(uniforms.uHasWax,wax?1:0);gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,wax||fallback);
      gl.enable(gl.DEPTH_TEST);gl.depthFunc(gl.LESS);gl.depthMask(false);
      for(let i=0;i<attributeCount;i++)gl.disableVertexAttribArray(i);
      gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
      if(angle!==lastAngle||tilt!==lastTilt){
        const c=Math.cos(angle),s=Math.sin(angle),ct=Math.cos(tilt),st=Math.sin(tilt);
        const depth=i=>st*pickData[i*4+1]+ct*(-s*pickData[i*4]+c*pickData[i*4+2]);
        const order=Array.from({length:stats.spheres},(_,i)=>i).sort((a,b)=>depth(a)-depth(b));
        order.forEach((id,i)=>sortedVertices.set(sourceVertices.subarray(id*36,id*36+36),i*36));
        gl.bufferSubData(gl.ARRAY_BUFFER,0,sortedVertices);lastAngle=angle;lastTilt=tilt;
      }
      [['aCenter',3,0],['aCorner',2,3],['aRadius',1,5]].forEach(([name,size,offset])=>{gl.enableVertexAttribArray(attributes[name]);gl.vertexAttribPointer(attributes[name],size,gl.FLOAT,false,24,offset*4);});
      gl.drawArrays(gl.TRIANGLES,0,count);gl.depthMask(true);gl.disable(gl.DEPTH_TEST);
    }
    return{load,draw,ready:()=>ready,stats,pickPoints:()=>[pickData]};
  };
}());
