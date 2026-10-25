(function () {
  "use strict";

  // The broad source marks are part of the unified tree mesh. Only the small
  // original dots are rendered here, as exact white spheres in the same scene.
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
        vEdge=w/max(1.0,aRadius*uWidth*4.0);
      }`;
    const fragment=`${depthExtension?'#extension GL_EXT_frag_depth : enable\n':''}${derivatives?'#extension GL_OES_standard_derivatives : enable\n':''}
      precision highp float;
      uniform float uStrength;
      uniform vec2 uLight;
      varying vec2 vDisc;
      varying float vDepth,vRadius,vEdge;
      void main(){
        float r2=dot(vDisc,vDisc);
        float aa=${derivatives?'max(fwidth(r2),.00001)':'max(vEdge*2.0,.00001)'};
        if(r2>1.0+aa)discard;
        float coverage=1.0-smoothstep(1.0-aa,1.0+aa,r2);
        vec3 n=normalize(vec3(vDisc,sqrt(max(0.0,1.0-r2))));
        vec3 key=normalize(vec3(-.48+uLight.x*.18,.68-uLight.y*.16,1.0));
        vec3 fill=normalize(vec3(.8,-.25,.6)),eye=vec3(0.0,0.0,1.0);
        float diffuse=max(0.0,dot(n,key)),soft=max(0.0,dot(n,fill));
        float shine=pow(max(0.0,dot(n,normalize(key+eye))),48.0);
        vec3 color=vec3(.94)*(.40+.62*diffuse+.10*soft)+vec3(shine*.06);
        ${depthExtension?'float z=vDepth+vRadius*n.z;gl_FragDepthEXT=.5-.3*z/(4.0-z);':''}
        gl_FragColor=vec4(color,coverage*uStrength);
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
    ['uViewport','uCenter','uWidth','uAngle','uTilt','uStrength','uLight'].forEach(k=>uniforms[k]=gl.getUniformLocation(program,k));
    ['aCenter','aCorner','aRadius'].forEach(k=>attributes[k]=gl.getAttribLocation(program,k));
    const buffer=gl.createBuffer(),attributeCount=gl.getParameter(gl.MAX_VERTEX_ATTRIBS);
    let ready=false,loading=null,count=0,pickData=new Float32Array(0);
    const stats={spheres:0,triangles:0};
    function build(data){
      const vertices=[],picking=[],corners=[[-1,-1],[1,-1],[-1,1],[-1,1],[1,-1],[1,1]];
      for(const[x,y,r]of data.beads){
        const u=x/data.width,v=y/data.height,frame=window.NireTreeForm.frame(u,v);
        const position=window.NireTreeForm.point(frame,u,v,r*.25/data.width),radius=r/data.width;
        picking.push(...position,radius);
        for(const corner of corners)vertices.push(...position,...corner,radius);
      }
      gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(vertices),gl.STATIC_DRAW);
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
    function draw(view,world,angle,tilt,strength,light){
      if(!ready||strength<.001||gl.isContextLost())return;
      gl.useProgram(program);gl.uniform2f(uniforms.uViewport,view.width,view.height);gl.uniform2f(uniforms.uCenter,view.cx,view.cy);
      gl.uniform1f(uniforms.uWidth,view.scale*world.width);gl.uniform1f(uniforms.uAngle,angle);gl.uniform1f(uniforms.uTilt,tilt);gl.uniform1f(uniforms.uStrength,strength);gl.uniform2f(uniforms.uLight,light.x,light.y);
      gl.enable(gl.DEPTH_TEST);gl.depthFunc(gl.LESS);
      for(let i=0;i<attributeCount;i++)gl.disableVertexAttribArray(i);
      gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
      [['aCenter',3,0],['aCorner',2,3],['aRadius',1,5]].forEach(([name,size,offset])=>{gl.enableVertexAttribArray(attributes[name]);gl.vertexAttribPointer(attributes[name],size,gl.FLOAT,false,24,offset*4);});
      gl.drawArrays(gl.TRIANGLES,0,count);gl.disable(gl.DEPTH_TEST);
    }
    return{load,draw,ready:()=>ready,stats,pickPoints:()=>[pickData]};
  };
}());
