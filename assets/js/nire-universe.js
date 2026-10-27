(function(){
  'use strict';
  // A collection that exists at the scale of a close-up: mineral basins, clear
  // water and thin porous relics, all placed in the tree's original 3D frames.
  window.createNireUniverse=function(gl,changed){
    const derivatives=gl.getExtension('OES_standard_derivatives');
    const vertex=`
      attribute vec3 aPosition,aNormal,aLocal,aMeta;
      uniform vec2 uViewport,uCenter;
      uniform float uWidth,uAngle,uTilt;
      varying vec3 vNormal,vLocal,vMeta,vView;
      vec3 rotate(vec3 p){float c=cos(uAngle),s=sin(uAngle);p=vec3(c*p.x+s*p.z,p.y,-s*p.x+c*p.z);c=cos(uTilt);s=sin(uTilt);return vec3(p.x,c*p.y-s*p.z,s*p.y+c*p.z);}
      void main(){vec3 p=rotate(aPosition);float w=4.0-p.z;vec2 center=vec2(2.0*uCenter.x/uViewport.x-1.0,1.0-2.0*uCenter.y/uViewport.y);gl_Position=vec4(center*w+p.xy*uWidth*8.0/uViewport,-p.z*.6,w);vNormal=rotate(aNormal);vLocal=aLocal;vMeta=aMeta;vView=p;}`;
    const fragment=`${derivatives?'#extension GL_OES_standard_derivatives : enable\n':''}
      precision highp float;
      uniform float uStrength,uFootprint;
      uniform vec2 uLight;
      varying vec3 vNormal,vLocal,vMeta,vView;
      float hash(vec3 p){p=fract(p*.1031);p+=dot(p,p.yzx+33.33);return fract((p.x+p.y)*p.z);}
      float noise(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);return mix(mix(mix(hash(i),hash(i+vec3(1,0,0)),f.x),mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x),f.y),mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x),mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),f.x),f.y),f.z);}
      void main(){
        vec3 n=normalize(vNormal),p=vLocal,eye=vec3(0,0,1);
        if(!gl_FrontFacing)n=-n;
        vec3 key=normalize(vec3(-.72,1.05,.58)),fill=normalize(vec3(.8,-.25,.6));
        float footprint=${derivatives?'max(length(dFdx(p)),length(dFdy(p)))':'uFootprint'};
        float fineWeight=1.0-smoothstep(.35,.95,footprint*2.6);
        float broad=noise(p*.065),grain=mix(.5,noise(p*2.6),fineWeight);
        float height=(grain-.5)*.000040;
        if(vMeta.x>.5&&vMeta.x<1.5)height=(sin(p.x*.20+p.y*.13)+cos(p.y*.23-p.x*.06))*.000022;
        ${derivatives?`vec3 q0=dFdx(vView),q1=dFdy(vView),r1=cross(q1,n),r2=cross(n,q0);float determinant=dot(q0,r1);vec3 gradient=(r1*dFdx(height)+r2*dFdy(height))*sign(determinant)/max(abs(determinant),1.e-12);n=normalize(n-gradient);`:''}
        float diffuse=max(0.0,dot(n,key)),soft=max(0.0,dot(n,fill));
        float facing=max(0.0,dot(n,eye)),fresnel=.025+.975*pow(1.0-facing,5.0);
        float spec=pow(max(0.0,dot(n,normalize(key+eye))),92.0);
        float panel=exp(-pow((reflect(-eye,n).x+.48)/.22,2.0)-pow((reflect(-eye,n).y-.32)/.75,2.0));
        vec3 color;float alpha=1.0;
        if(vMeta.x<.5){
          vec3 chalk=mix(vec3(.76,.73,.67),vec3(.98,.955,.90),broad*.45+.48);
          chalk=mix(chalk,vec3(.68,.70,.64),vMeta.y*.12);
          float pores=1.0-smoothstep(.08,.29,grain);
          color=chalk*(.35+.62*diffuse+.08*soft)*(1.0-pores*.20*fineWeight)+(grain-.5)*.02*fineWeight;
          color+=vec3(.98,.96,.91)*pow(max(0.0,dot(n,normalize(key+eye))),13.0)*.025;
        }else if(vMeta.x<1.5){
          float depth=clamp(vMeta.y,0.0,1.0);
          vec3 water=mix(vec3(.66,.83,.82),vec3(.21,.59,.65),depth*.76);
          color=water*(.50+.35*diffuse+.05*soft)+vec3(.95,.98,.94)*(panel*.15+spec*.30+fresnel*.16);
          alpha=(.20+depth*.40+fresnel*.22)*smoothstep(.01,.14,depth);
        }else{
          vec2 q=p.xy*.72;vec2 cell=floor(q),f=fract(q)-.5;
          f-=vec2(hash(vec3(cell,vMeta.z)),hash(vec3(cell+11.0,vMeta.z)))*.24-.12;
          float d=length(f),aa=${derivatives?'max(fwidth(d),.015)':'max(.015,uFootprint*.72)'};
          float hole=1.0-smoothstep(.055-aa,.055+aa,d);
          float rim=1.0-smoothstep(.06,.15,d);
          vec3 pearl=mix(vec3(.92,.93,.84),vec3(.73,.86,.88),pow(1.0-facing,2.0)*.35);
          color=pearl*(.16+.77*diffuse+.04*soft)+vec3(.95,.98,.95)*(panel*.35+spec*.18)-rim*.045*fineWeight;
          alpha=(.23+fresnel*.40+broad*.08)*(1.0-hole*.80*fineWeight);
        }
        gl_FragColor=vec4(color,alpha*uStrength);
      }`;
    function shader(type,source){const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(s));return s;}
    let program;
    try{program=gl.createProgram();gl.attachShader(program,shader(gl.VERTEX_SHADER,vertex));gl.attachShader(program,shader(gl.FRAGMENT_SHADER,fragment));gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))return null;}catch(_){return null;}
    const uniforms={},attributes={},batches=[],surfaces=[],attributeCount=gl.getParameter(gl.MAX_VERTEX_ATTRIBS);
    ['uViewport','uCenter','uWidth','uAngle','uTilt','uStrength','uFootprint','uLight'].forEach(k=>uniforms[k]=gl.getUniformLocation(program,k));
    ['aPosition','aNormal','aLocal','aMeta'].forEach(k=>attributes[k]=gl.getAttribLocation(program,k));
    let ready=false,loading=null,pickData=new Float32Array(0);
    const stats={triangles:0,basins:0,membranes:0};
    function build(buffer){
      const data=new DataView(buffer);if(data.getUint32(0,true)!==0x5552494e||data.getUint32(4,true)!==1)throw new Error('Invalid mineral universe');
      const count=data.getUint32(12,true);let at=16;const picking=[];
      for(let b=0;b<count;b++){
        const kind=data.getUint32(at,true),nv=data.getUint32(at+4,true),ni=data.getUint32(at+8,true),center=[0,1,2].map(i=>data.getFloat32(at+12+i*4,true));at+=24;
        const vertices=new Float32Array(buffer.slice(at,at+nv*48));at+=nv*48;const indices=new Uint16Array(buffer,at,ni);at+=ni*2;
        const vb=gl.createBuffer(),ib=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,vb);gl.bufferData(gl.ARRAY_BUFFER,vertices,gl.STATIC_DRAW);gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,ib);gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,indices,gl.STATIC_DRAW);
        batches.push({kind,center,vertices:vb,indices:ib,count:ni});stats.triangles+=ni/3;
        if(kind<2){
          const low=[Infinity,Infinity,Infinity],high=[-Infinity,-Infinity,-Infinity];
          for(let i=0;i<nv;i++)for(let a=0;a<3;a++){const v=vertices[i*12+a];low[a]=Math.min(low[a],v);high[a]=Math.max(high[a],v);}
          surfaces.push({vertices,indices,low,high});
        }
        if(kind<2)for(let i=0;i<nv;i+=7)picking.push(vertices[i*12],vertices[i*12+1],vertices[i*12+2],0);
      }
      if(at!==buffer.byteLength)throw new Error('Incomplete mineral universe');pickData=new Float32Array(picking);
    }
    function pickPoint(view,world,angle,tilt,x,y){
      if(!ready)return null;
      const c=Math.cos(angle),s=Math.sin(angle),ct=Math.cos(tilt),st=Math.sin(tilt);
      const inverse=p=>{const yy=ct*p[1]+st*p[2],zz=-st*p[1]+ct*p[2];return[c*p[0]-s*zz,yy,s*p[0]+c*zz]};
      const origin=inverse([0,0,4]),direction=inverse([(x-view.cx)/(view.scale*world.width),-(y-view.cy)/(view.scale*world.width),-4]);
      let best=Infinity;
      for(const surface of surfaces){
        let lo=0,hi=best;
        for(let a=0;a<3;a++){
          if(Math.abs(direction[a])<1.e-12){if(origin[a]<surface.low[a]||origin[a]>surface.high[a])hi=-1;continue;}
          const t0=(surface.low[a]-origin[a])/direction[a],t1=(surface.high[a]-origin[a])/direction[a];lo=Math.max(lo,Math.min(t0,t1));hi=Math.min(hi,Math.max(t0,t1));
        }
        if(lo>hi)continue;
        const v=surface.vertices,ix=surface.indices,dx=direction[0],dy=direction[1],dz=direction[2];
        for(let i=0;i<ix.length;i+=3){
          const a=ix[i]*12,b=ix[i+1]*12,d=ix[i+2]*12;
          const e1x=v[b]-v[a],e1y=v[b+1]-v[a+1],e1z=v[b+2]-v[a+2],e2x=v[d]-v[a],e2y=v[d+1]-v[a+1],e2z=v[d+2]-v[a+2];
          const px=dy*e2z-dz*e2y,py=dz*e2x-dx*e2z,pz=dx*e2y-dy*e2x,det=e1x*px+e1y*py+e1z*pz;
          if(Math.abs(det)<1.e-12)continue;
          const tx=origin[0]-v[a],ty=origin[1]-v[a+1],tz=origin[2]-v[a+2],u=(tx*px+ty*py+tz*pz)/det;
          if(u<0||u>1)continue;
          const qx=ty*e1z-tz*e1y,qy=tz*e1x-tx*e1z,qz=tx*e1y-ty*e1x,w=(dx*qx+dy*qy+dz*qz)/det;
          if(w<0||u+w>1)continue;
          const t=(e2x*qx+e2y*qy+e2z*qz)/det;if(t>0&&t<best)best=t;
        }
      }
      if(!Number.isFinite(best))return null;
      const p=origin.map((v,i)=>v+direction[i]*best),z=-s*p[0]+c*p[2];
      return{point:p,depth:st*p[1]+ct*z};
    }
    function load(){if(loading)return loading;loading=(async()=>{
      const compressed=typeof DecompressionStream==='function';const response=await fetch(`assets/images/nire/universe.bin${compressed?'.gz':''}?v=3`);if(!response.ok)throw new Error('Mineral universe unavailable');
      let raw=await response.arrayBuffer();const head=new Uint8Array(raw,0,2);if(head[0]===31&&head[1]===139)raw=await new Response(new Blob([raw]).stream().pipeThrough(new DecompressionStream('gzip'))).arrayBuffer();
      const meta=await fetch('assets/images/nire/universe.json?v=3').then(r=>r.json());if(gl.isContextLost())return;build(raw);stats.basins=meta.basins;stats.membranes=meta.membraneFaces;ready=true;changed(stats);
    })().catch(()=>{ready=false;});return loading;}
    function draw(view,world,angle,tilt,strength,light){
      if(!ready||strength<.001||gl.isContextLost())return;
      gl.useProgram(program);gl.uniform2f(uniforms.uViewport,view.width,view.height);gl.uniform2f(uniforms.uCenter,view.cx,view.cy);gl.uniform1f(uniforms.uWidth,view.scale*world.width);gl.uniform1f(uniforms.uAngle,angle);gl.uniform1f(uniforms.uTilt,tilt);gl.uniform1f(uniforms.uStrength,strength);gl.uniform1f(uniforms.uFootprint,2262/(view.scale*world.width*gl.drawingBufferWidth/view.width));gl.uniform2f(uniforms.uLight,light.x,light.y);
      for(let i=0;i<attributeCount;i++)gl.disableVertexAttribArray(i);
      gl.enable(gl.DEPTH_TEST);gl.depthFunc(gl.LEQUAL);gl.depthMask(true);gl.disable(gl.CULL_FACE);
      function part(b){gl.bindBuffer(gl.ARRAY_BUFFER,b.vertices);gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,b.indices);[['aPosition',0],['aNormal',3],['aLocal',6],['aMeta',9]].forEach(([name,offset])=>{gl.enableVertexAttribArray(attributes[name]);gl.vertexAttribPointer(attributes[name],3,gl.FLOAT,false,48,offset*4)});gl.drawElements(gl.TRIANGLES,b.count,gl.UNSIGNED_SHORT,0);}
      for(const b of batches)if(b.kind===0)part(b);
      const depth=p=>{const z=-Math.sin(angle)*p[0]+Math.cos(angle)*p[2];return Math.sin(tilt)*p[1]+Math.cos(tilt)*z};
      gl.depthMask(false);for(const b of batches.filter(b=>b.kind>0).sort((a,b)=>depth(a.center)-depth(b.center)))part(b);
      gl.depthMask(true);gl.depthFunc(gl.LESS);gl.disable(gl.DEPTH_TEST);
    }
    return{load,draw,pickPoint,ready:()=>ready,stats,pickPoints:()=>pickData};
  };
}());
