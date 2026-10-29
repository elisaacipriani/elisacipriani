(function(){
  'use strict';
  // Elisa's selected pencil fragment, fused into a closed mineral body.
  window.createNireArtistDrawing=function(gl,changed){
    const derivatives=gl.getExtension('OES_standard_derivatives');
    const vertex=`
      attribute vec3 aPosition,aNormal;
      attribute float aDensity;
      uniform vec2 uViewport,uCenter;
      uniform float uWidth,uAngle,uTilt;
      varying vec3 vNormal,vView,vPosition;
      varying float vDensity;
      vec3 rotate(vec3 p){float c=cos(uAngle),s=sin(uAngle);p=vec3(c*p.x+s*p.z,p.y,-s*p.x+c*p.z);c=cos(uTilt);s=sin(uTilt);return vec3(p.x,c*p.y-s*p.z,s*p.y+c*p.z);}
      void main(){vec3 p=rotate(aPosition);float w=4.0-p.z;vec2 centre=vec2(2.0*uCenter.x/uViewport.x-1.0,1.0-2.0*uCenter.y/uViewport.y);gl_Position=vec4(centre*w+p.xy*uWidth*8.0/uViewport,-p.z*.6,w);vNormal=aNormal;vView=p;vPosition=aPosition*2262.0;vDensity=aDensity;}`;
    const fragment=`${derivatives?'#extension GL_OES_standard_derivatives : enable\n':''}
      precision highp float;
      uniform sampler2D uSurface;
      uniform float uStrength,uAngle,uTilt,uTexelFootprint;
      varying vec3 vNormal,vView,vPosition;
      varying float vDensity;
      float hash(vec3 p){p=fract(p*.1031);p+=dot(p,p.yzx+33.33);return fract((p.x+p.y)*p.z);}
      // Continuous value noise with its analytic gradient; no raster texels.
      // Fine relief fades below a pixel instead of turning into speckle.
      vec4 noiseGradient(vec3 p){
        vec3 cell=floor(p),f=fract(p),u=f*f*f*(f*(f*6.0-15.0)+10.0),du=30.0*f*f*(f-1.0)*(f-1.0);
        float a=hash(cell),b=hash(cell+vec3(1,0,0)),c=hash(cell+vec3(0,1,0)),d=hash(cell+vec3(1,1,0));
        float e=hash(cell+vec3(0,0,1)),g=hash(cell+vec3(1,0,1)),h=hash(cell+vec3(0,1,1)),j=hash(cell+vec3(1,1,1));
        float ab=mix(a,b,u.x),cd=mix(c,d,u.x),eg=mix(e,g,u.x),hj=mix(h,j,u.x);
        return vec4(mix(mix(ab,cd,u.y),mix(eg,hj,u.y),u.z),
          du.x*mix(mix(b-a,d-c,u.y),mix(g-e,j-h,u.y),u.z),
          du.y*mix(cd-ab,hj-eg,u.z),du.z*(mix(eg,hj,u.y)-mix(ab,cd,u.y)));
      }
      // Project the supplied photograph along three local axes. The original
      // image aspect and mirrored edges preserve its pores without UV stretch.
      vec3 layeredSurface(vec3 p){
        vec3 w=pow(abs(normalize(vNormal)),vec3(6.0));w/=w.x+w.y+w.z;
        vec2 size=vec2(6.0,12.342857);
        return texture2D(uSurface,p.zy/size+vec2(.17,.31)).rgb*w.x
          +texture2D(uSurface,p.xz/size+vec2(.41,.08)).rgb*w.y
          +texture2D(uSurface,p.xy/size+vec2(.57,.19)).rgb*w.z;
      }
      vec3 rotate(vec3 p){float c=cos(uAngle),s=sin(uAngle);p=vec3(c*p.x+s*p.z,p.y,-s*p.x+c*p.z);c=cos(uTilt);s=sin(uTilt);return vec3(p.x,c*p.y-s*p.z,s*p.y+c*p.z);}
      void main(){
        if(uStrength<.025)discard;
        vec3 p=vPosition;
        float facing=max(.15,abs(dot(normalize(rotate(vNormal)),normalize(vec3(0,0,4)-vView))));
        float footprint=uTexelFootprint/facing;
        vec3 scan=layeredSurface(p);
        float luminance=dot(scan,vec3(.2126,.7152,.0722));
        vec3 local=normalize(vNormal);
        // Luminance supplies the shallow pores and raised plate edges from the
        // reference; the existing closed geometry and silhouette stay intact.
        float height=(luminance-.5)*.085;
        ${derivatives?`vec3 q0=dFdx(p),q1=dFdy(p),r1=cross(q1,local),r2=cross(local,q0);float determinant=dot(q0,r1);vec3 relief=(r1*dFdx(height)+r2*dFdy(height))*sign(determinant)/max(abs(determinant),1.e-12);local=normalize(local-relief);`:''}
        float powderWeight=1.0-smoothstep(.3,.9,footprint*18.0);
        float microWeight=1.0-smoothstep(.3,.9,footprint*90.0);
        vec4 powder=vec4(.5,0,0,0),micro=vec4(.5,0,0,0);
        if(powderWeight>.001)powder=noiseGradient(p*18.0);
        if(microWeight>.001)micro=noiseGradient(p*90.0);
        vec3 gradient=powder.yzw*.0012*18.0*powderWeight+micro.yzw*.00024*90.0*microWeight;
        local=normalize(local-(gradient-local*dot(gradient,local)));
        vec3 n=normalize(rotate(local)),eye=normalize(vec3(0,0,4)-vView);
        vec3 key=normalize(vec3(-.72,1.05,.58)),fill=normalize(vec3(.8,-.25,.6));
        float diffuse=max(0.0,dot(n,key)),sky=n.y*.5+.5;
        vec3 ivory=mix(scan,vec3(luminance)*vec3(1.018,1.003,.977),.25);
        vec3 albedo=clamp(ivory*1.14,vec3(.025),vec3(.975));
        albedo*=1.0+(powder.x-.5)*.025*powderWeight+(vDensity-.5)*.008;
        float cavity=.88+.12*smoothstep(.18,.58,luminance);
        vec3 linear=pow(albedo,vec3(2.2))*cavity;
        float light=.36+.08*sky+1.10*diffuse+.04*max(0.0,dot(n,fill));
        float sheen=pow(max(0.0,dot(n,normalize(key+eye))),9.0)*.0012;
        vec3 color=pow(max(linear*light+vec3(sheen),vec3(0)),vec3(1.0/2.2));
        // The closed body is opaque. Per-triangle alpha during the scene's
        // arrival would reveal its back faces as a patchwork of polygons.
        gl_FragColor=vec4(color,1.0);
      }`;
    function shader(type,source){const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(s));return s;}
    let program;try{program=gl.createProgram();gl.attachShader(program,shader(gl.VERTEX_SHADER,vertex));gl.attachShader(program,shader(gl.FRAGMENT_SHADER,fragment));gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(program));}catch(error){console.warn('Artist drawing unavailable',error);return null;}
    const attributes={},uniforms={},attributeCount=gl.getParameter(gl.MAX_VERTEX_ATTRIBS),batches=[];
    for(const name of ['aPosition','aNormal','aDensity'])attributes[name]=gl.getAttribLocation(program,name);
    for(const name of ['uViewport','uCenter','uWidth','uAngle','uTilt','uStrength','uTexelFootprint','uSurface'])uniforms[name]=gl.getUniformLocation(program,name);
    let loaded=false,loading,meta=null,surfaceTexture=null;
    function build(raw){
      const d=new DataView(raw);if(d.getUint32(0,true)!==0x4452494e||d.getUint32(4,true)!==1)throw new Error('Invalid artist drawing');
      let at=12;
      for(let i=0;i<d.getUint32(8,true);i++){
        const nv=d.getUint32(at,true),ni=d.getUint32(at+4,true);at+=8;
        const vertices=new Float32Array(raw.slice(at,at+nv*28));at+=nv*28;
        const indices=new Uint16Array(raw.slice(at,at+ni*2));at+=ni*2;
        const vb=gl.createBuffer(),ib=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,vb);gl.bufferData(gl.ARRAY_BUFFER,vertices,gl.STATIC_DRAW);gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,ib);gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,indices,gl.STATIC_DRAW);
        batches.push({vb,ib,count:ni});
      }
      if(at!==raw.byteLength)throw new Error('Incomplete artist drawing');
    }
    function load(){if(loading)return loading;loading=(async()=>{
      const compressed=typeof DecompressionStream==='function';
      const image=new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=()=>reject(new Error('White layered material unavailable'));img.src='assets/images/nire/elisa-drawing-white-layers-v1.png?v=1';});
      const [response,info,surface]=await Promise.all([fetch(`assets/images/nire/elisa-top-drawing.bin${compressed?'.gz':''}?v=4`),fetch('assets/images/nire/elisa-top-drawing.json?v=5').then(r=>{if(!r.ok)throw new Error('Artist drawing metadata unavailable');return r.json()}),image]);
      if(!response.ok)throw new Error('Artist drawing geometry unavailable');
      if(info.components!==1||!info.closed||info.openEdges!==0)throw new Error('Artist drawing must be one closed body');
      let raw=await response.arrayBuffer();const header=new Uint8Array(raw,0,2);if(header[0]===31&&header[1]===139)raw=await new Response(new Blob([raw]).stream().pipeThrough(new DecompressionStream('gzip'))).arrayBuffer();
      if(gl.isContextLost())return;
      const tile=document.createElement('canvas');tile.width=1024;tile.height=2048;
      const ctx=tile.getContext('2d');ctx.imageSmoothingQuality='high';ctx.drawImage(surface,0,0,tile.width,tile.height);
      surfaceTexture=gl.createTexture();gl.activeTexture(gl.TEXTURE3);gl.bindTexture(gl.TEXTURE_2D,surfaceTexture);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,false);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,tile);
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.MIRRORED_REPEAT);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.MIRRORED_REPEAT);
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR_MIPMAP_LINEAR);gl.generateMipmap(gl.TEXTURE_2D);
      const anisotropy=gl.getExtension('EXT_texture_filter_anisotropic');
      if(anisotropy)gl.texParameterf(gl.TEXTURE_2D,anisotropy.TEXTURE_MAX_ANISOTROPY_EXT,Math.min(8,gl.getParameter(anisotropy.MAX_TEXTURE_MAX_ANISOTROPY_EXT)));
      build(raw);meta=info;loaded=true;changed(meta);
    })().catch(error=>{loaded=false;console.warn('Artist drawing unavailable',error)});return loading;}
    function rotate(p,angle,tilt){const c=Math.cos(angle),s=Math.sin(angle),ct=Math.cos(tilt),st=Math.sin(tilt),x=c*p[0]+s*p[2],z=-s*p[0]+c*p[2];return[x,ct*p[1]-st*z,st*p[1]+ct*z];}
    function project(p,view,world,angle,tilt){const q=rotate(p,angle,tilt),f=view.scale*world.width*4/(4-q[2]);return{x:view.cx+q[0]*f,y:view.cy-q[1]*f,depth:q[2],scale:f};}
    function draw(view,world,angle,tilt,strength){
      if(!loaded||strength<.001||gl.isContextLost())return;
      gl.useProgram(program);for(let i=0;i<attributeCount;i++)gl.disableVertexAttribArray(i);
      gl.uniform2f(uniforms.uViewport,view.width,view.height);gl.uniform2f(uniforms.uCenter,view.cx,view.cy);gl.uniform1f(uniforms.uWidth,view.scale*world.width);gl.uniform1f(uniforms.uAngle,angle);gl.uniform1f(uniforms.uTilt,tilt);gl.uniform1f(uniforms.uStrength,strength);gl.uniform1f(uniforms.uTexelFootprint,2262/(view.scale*world.width*gl.drawingBufferWidth/view.width));
      gl.uniform1i(uniforms.uSurface,3);gl.activeTexture(gl.TEXTURE3);gl.bindTexture(gl.TEXTURE_2D,surfaceTexture);
      gl.enable(gl.DEPTH_TEST);gl.depthFunc(gl.LESS);gl.depthMask(true);gl.disable(gl.CULL_FACE);
      for(const b of batches){gl.bindBuffer(gl.ARRAY_BUFFER,b.vb);gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,b.ib);for(const [name,size,offset]of [['aPosition',3,0],['aNormal',3,3],['aDensity',1,6]]){gl.enableVertexAttribArray(attributes[name]);gl.vertexAttribPointer(attributes[name],size,gl.FLOAT,false,28,offset*4);}gl.drawElements(gl.TRIANGLES,b.count,gl.UNSIGNED_SHORT,0);}
      gl.disable(gl.DEPTH_TEST);
    }
    function pickPoint(view,world,angle,tilt,x,y,tolerance){
      if(!loaded)return null;
      const [low,high]=meta.bounds;let left=Infinity,right=-Infinity,top=Infinity,bottom=-Infinity;
      for(let i=0;i<8;i++){
        const q=project([i&1?high[0]:low[0],i&2?high[1]:low[1],i&4?high[2]:low[2]],view,world,angle,tilt);
        left=Math.min(left,q.x);right=Math.max(right,q.x);top=Math.min(top,q.y);bottom=Math.max(bottom,q.y);
      }
      if(x<left-tolerance||x>right+tolerance||y<top-tolerance||y>bottom+tolerance)return null;
      let nearest=null,best=tolerance*tolerance;
      const c=Math.cos(angle),s=Math.sin(angle),ct=Math.cos(tilt),st=Math.sin(tilt),width=view.scale*world.width;
      const screen=p=>{const rx=c*p[0]+s*p[2],rz=-s*p[0]+c*p[2],ry=ct*p[1]-st*rz,depth=st*p[1]+ct*rz,f=width*4/(4-depth);return{x:view.cx+rx*f,y:view.cy-ry*f,depth,scale:f}};
      for(const path of meta.paths){
        for(let i=1;i<path.length;i++){
          const a=path[i-1],b=path[i],p=screen(a),q=screen(b),dx=q.x-p.x,dy=q.y-p.y;
          const t=Math.max(0,Math.min(1,((x-p.x)*dx+(y-p.y)*dy)/Math.max(.0001,dx*dx+dy*dy)));
          const radius=(a[3]*(1-t)+b[3]*t)*(p.scale*(1-t)+q.scale*t);
          const distance=Math.max(0,Math.hypot(x-p.x-dx*t,y-p.y-dy*t)-radius)**2;
          const depth=p.depth*(1-t)+q.depth*t;
          if(distance<best||(distance===best&&depth>(nearest?.depth??-Infinity))){best=distance;nearest={point:a.slice(0,3).map((v,j)=>v+(b[j]-v)*t),depth,distance};}
        }
      }
      return nearest;
    }
    function feature(base,world,angle,tilt){
      if(!loaded)return null;
      const [low,high]=meta.bounds;
      let left=Infinity,right=-Infinity,top=Infinity,bottom=-Infinity;
      for(let i=0;i<8;i++){
        const p=[i&1?high[0]:low[0],i&2?high[1]:low[1],i&4?high[2]:low[2]],q=project(p,base,world,angle,tilt);
        left=Math.min(left,q.x);right=Math.max(right,q.x);top=Math.min(top,q.y);bottom=Math.max(bottom,q.y);
      }
      const p=meta.center,aspect=world.height/world.width;
      const zoom=Math.max(1.5,Math.min(6.2,base.width*.80/Math.max(1,right-left),base.height*.60/Math.max(1,bottom-top)));
      return{point:{x:(p[0]+.5)*world.width,y:(aspect*.5-p[1])*world.width,z:p[2]*world.width,feature:'elisaDrawing',material:'drawing'},zoom,screen:{...project(p,base,world,angle,tilt),width:right-left,height:bottom-top},size:Math.max(...high.map((v,i)=>v-low[i]))};
    }
    return{load,draw,pickPoint,feature,ready:()=>loaded};
  };
}());
