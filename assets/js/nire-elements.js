(function(){
  "use strict";
  const TAU=Math.PI*2,clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
  const unit=v=>{const n=Math.hypot(...v);return n<1e-10?[1,0,0]:v.map(x=>x/n);};
  const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
  function paths(strokes){
    const all=strokes.flat();if(!all.length)return [];
    const xs=all.map(p=>p[0]),ys=all.map(p=>p[1]);
    const l=Math.min(...xs),r=Math.max(...xs),t=Math.min(...ys),b=Math.max(...ys),span=Math.max(r-l,b-t,.12);
    return strokes.filter(s=>s.length>1).map(s=>{
      const clean=s.filter((p,i)=>!i||Math.hypot(p[0]-s[i-1][0],p[1]-s[i-1][1])>.0001);
      const line=clean.map(p=>[(p[0]-(l+r)/2)/span,((t+b)/2-p[1])/span,0]);
      if(line.length===1)line.push([line[0][0]+.0001,line[0][1],0]);
      return line;
    });
  }
  function smooth(path,quality){
    const closed=path.length>8&&Math.hypot(path[0][0]-path.at(-1)[0],path[0][1]-path.at(-1)[1])<.045;
    const points=closed?path.slice(0,-1):path;
    const result=[],n=points.length,steps=quality?3:1;
    const at=i=>points[closed?(i+n)%n:clamp(i,0,n-1)];
    for(let i=0;i<(closed?n:n-1);i++){
      const a=at(i-1),b=at(i),c=at(i+1),d=at(i+2);
      for(let k=0;k<steps;k++){
        const t=k/steps;
        result.push(b.map((v,j)=>.5*((2*v)+(-a[j]+c[j])*t+(2*a[j]-5*v+4*c[j]-d[j])*t*t+(-a[j]+3*v-3*c[j]+d[j])*t*t*t)));
      }
    }
    if(!closed)result.push(points.at(-1));
    return {points:result,closed};
  }
  function simplify(points,tolerance=.004){
    if(points.length<3)return points;
    const a=points[0],b=points.at(-1),dx=b[0]-a[0],dy=b[1]-a[1],length=dx*dx+dy*dy;
    let far=0,index=0;
    for(let i=1;i<points.length-1;i++){
      const p=points[i],t=length?clamp(((p[0]-a[0])*dx+(p[1]-a[1])*dy)/length,0,1):0,d=Math.hypot(p[0]-a[0]-dx*t,p[1]-a[1]-dy*t);
      if(d>far){far=d;index=i;}
    }
    if(far<=tolerance)return [a,b];
    return [...simplify(points.slice(0,index+1),tolerance).slice(0,-1),...simplify(points.slice(index),tolerance)];
  }
  function mesh(strokes,quality=true){
    const batches=[],samples=[],lines=[];let triangles=0;
    const normalized=paths(strokes),shapes=window.NireInflate?window.NireInflate.contours(normalized):{loops:[],open:normalized};
    const bodies=window.NireInflate?window.NireInflate.build(shapes.loops,quality):[];
    for(const body of bodies){batches.push(body);triangles+=body.indices.length/3;}
    for(const path of shapes.open){
      const curve=smooth(path,quality),closed=curve.closed,points=quality?curve.points:simplify([...curve.points,...(closed?[curve.points[0]]:[])]);
      if(closed&&!quality)points.pop();
      const radial=quality?20:8,radius=.013;lines.push({points,closed});
      if(points.length<2)continue;
      const vertices=[],indices=[],rings=[],n=points.length;
      function ring(p,tangent,r,offset=0){
        const side=unit(cross(tangent,[0,0,1])),normal=unit(cross(side,tangent)),ids=[];
        for(let j=0;j<radial;j++){
          const a=j/radial*TAU,norm=unit(side.map((s,k)=>s*Math.cos(a)+normal[k]*Math.sin(a)));
          const cap=offset/radius,normalScale=r/radius;
          const vn=unit(norm.map((v,k)=>v*normalScale+tangent[k]*cap));
          ids.push(vertices.length/6);vertices.push(...p.map((v,k)=>v+norm[k]*r+tangent[k]*offset),...vn);
        }
        rings.push(ids);
      }
      const tangentAt=i=>{
        const a=points[closed?(i+n-1)%n:Math.max(0,i-1)],b=points[closed?(i+1)%n:Math.min(n-1,i+1)];
        return unit(b.map((v,k)=>v-a[k]));
      };
      if(!closed){
        const p=points[0],t=tangentAt(0);
        for(let k=0;k<4;k++){const a=-Math.PI/2+k/4*Math.PI/2;ring(p,t,Math.max(.00001,Math.cos(a)*radius),Math.sin(a)*radius);}
      }
      for(let i=0;i<n;i++){ring(points[i],tangentAt(i),radius);if(i%4===0)samples.push(points[i]);}
      if(!closed){
        const p=points.at(-1),t=tangentAt(n-1);
        for(let k=1;k<=4;k++){const a=k/4*Math.PI/2;ring(p,t,Math.max(.00001,Math.cos(a)*radius),Math.sin(a)*radius);}
      }
      const count=closed?rings.length:rings.length-1;
      for(let i=0;i<count;i++){
        const a=rings[i],b=rings[(i+1)%rings.length];
        for(let j=0;j<radial;j++){const k=(j+1)%radial;indices.push(a[j],b[j],a[k],a[k],b[j],b[k]);}
      }
      if(!closed){
        for(const [ring,point,tangent,sign] of [[rings[0],points[0],tangentAt(0),-1],[rings.at(-1),points.at(-1),tangentAt(n-1),1]]){
          const pole=vertices.length/6;vertices.push(...point.map((v,k)=>v+tangent[k]*radius*sign),...tangent.map(v=>v*sign));
          for(let j=0;j<radial;j++){const k=(j+1)%radial;if(sign<0)indices.push(pole,ring[k],ring[j]);else indices.push(pole,ring[j],ring[k]);}
        }
      }
      // Each stroke stays below Uint16's range, including the smooth end caps.
      batches.push({vertices:new Float32Array(vertices),indices:new Uint16Array(indices)});
      triangles+=indices.length/3;
    }
    return {batches,samples,lines,triangles,solids:bodies.length};
  }
  window.NireElementGeometry={mesh,paths};
  const vertex=[
    "attribute vec3 aPosition,aNormal;",
    "uniform vec2 uViewport,uCenter;",
    "uniform float uWidth,uAngle,uTilt,uScale;",
    "uniform mat3 uBasis;",
    "uniform vec3 uAnchor;",
    "varying vec3 vNormal,vLocalNormal,vPosition,vView;",
    "vec3 rotate(vec3 p){float c=cos(uAngle),s=sin(uAngle);p=vec3(c*p.x+s*p.z,p.y,-s*p.x+c*p.z);c=cos(uTilt);s=sin(uTilt);return vec3(p.x,c*p.y-s*p.z,s*p.y+c*p.z);}",
    "void main(){vec3 p=rotate(uAnchor+uBasis*aPosition*uScale);float w=4.0-p.z;vec2 c=vec2(2.0*uCenter.x/uViewport.x-1.0,1.0-2.0*uCenter.y/uViewport.y);gl_Position=vec4(c*w+p.xy*uWidth*8.0/uViewport,-p.z*.6,w);vNormal=rotate(uBasis*aNormal);vLocalNormal=aNormal;vPosition=aPosition;vView=p;}"
  ].join("\n");
  const fragment=derivatives=>[
    ...(derivatives?["#extension GL_OES_standard_derivatives : enable"]:[]),
    "precision highp float;",
    "uniform vec3 uColor;uniform float uMaterial,uOpacity,uDark;",
    "uniform sampler2D uSurface;uniform mat3 uBasis;uniform float uAngle,uTilt;",
    "varying vec3 vNormal,vLocalNormal,vPosition,vView;",
    "vec3 rotate(vec3 p){float c=cos(uAngle),s=sin(uAngle);p=vec3(c*p.x+s*p.z,p.y,-s*p.x+c*p.z);c=cos(uTilt);s=sin(uTilt);return vec3(p.x,c*p.y-s*p.z,s*p.y+c*p.z);}",
    "float hash(vec3 p){p=fract(p*.1031);p+=dot(p,p.yzx+33.33);return fract((p.x+p.y)*p.z);}",
    "vec4 noiseGradient(vec3 p){",
    "vec3 cell=floor(p),f=fract(p),u=f*f*f*(f*(f*6.0-15.0)+10.0),du=30.0*f*f*(f-1.0)*(f-1.0);",
    "float a=hash(cell),b=hash(cell+vec3(1,0,0)),c=hash(cell+vec3(0,1,0)),d=hash(cell+vec3(1,1,0));",
    "float e=hash(cell+vec3(0,0,1)),g=hash(cell+vec3(1,0,1)),h=hash(cell+vec3(0,1,1)),j=hash(cell+vec3(1,1,1));",
    "float ab=mix(a,b,u.x),cd=mix(c,d,u.x),eg=mix(e,g,u.x),hj=mix(h,j,u.x);",
    "return vec4(mix(mix(ab,cd,u.y),mix(eg,hj,u.y),u.z),du.x*mix(mix(b-a,d-c,u.y),mix(g-e,j-h,u.y),u.z),du.y*mix(cd-ab,hj-eg,u.z),du.z*(mix(eg,hj,u.y)-mix(ab,cd,u.y)));}",
    // Local projections preserve the photograph's proportions through bends
    // and around the back. Mirrored edges and mipmaps avoid stretched UVs.
    // Cubic reconstruction keeps the height gradient continuous across texels
    // when magnified. Four bilinear reads evaluate the 16 spline weights.
    "vec3 mineralSample(vec2 uv){vec2 size=vec2(1024.0,2048.0),p=uv*size-.5,cell=floor(p),f=fract(p),f2=f*f,f3=f2*f;vec2 a=(1.0-3.0*f+3.0*f2-f3)/6.0,b=(4.0-6.0*f2+3.0*f3)/6.0,c=(1.0+3.0*f+3.0*f2-3.0*f3)/6.0,d=f3/6.0,g0=a+b,g1=c+d;vec2 lo=(cell-.5+b/g0)/size,hi=(cell+1.5+d/g1)/size;return mix(mix(texture2D(uSurface,lo).rgb,texture2D(uSurface,vec2(hi.x,lo.y)).rgb,g1.x),mix(texture2D(uSurface,vec2(lo.x,hi.y)).rgb,texture2D(uSurface,hi).rgb,g1.x),g1.y);}",
    "vec3 mineralSurface(vec3 p,vec3 normal){vec3 w=pow(abs(normal),vec3(6.0));w/=w.x+w.y+w.z;vec2 size=vec2(.8,1.4222222);return mineralSample(p.zy/size+vec2(.17,.31))*w.x+mineralSample(p.xz/size+vec2(.41,.08))*w.y+mineralSample(p.xy/size+vec2(.57,.19))*w.z;}",
    "void main(){",
    "vec3 n=normalize(vNormal),eye=normalize(vec3(0.0,0.0,4.0)-vView),light=normalize(vec3(-.7,1.1,1.2));",
    "float diffuse=max(0.0,dot(n,light)),fill=max(0.0,dot(n,normalize(vec3(.8,.2,-.6))));",
    "float edge=pow(1.0-max(0.0,dot(n,eye)),3.0),spec=pow(max(0.0,dot(n,normalize(light+eye))),uMaterial>1.5?95.0:45.0);",
    "vec3 reflection=reflect(-eye,n);float windowLight=exp(-pow((reflection.x+.46)/.16,2.0))*smoothstep(-.8,-.45,reflection.y)*(1.0-smoothstep(.65,.98,reflection.y));float rimLight=exp(-pow((reflection.x-.65)/.055,2.0))*exp(-pow((reflection.y+.18)/.8,4.0));",
    "vec3 color=uColor*(.28+.72*diffuse+.13*fill);float alpha=uOpacity;",
    "if(uMaterial<.5){",
    "vec3 local=normalize(vLocalNormal),scan=mineralSurface(vPosition,local);float luminance=dot(scan,vec3(.2126,.7152,.0722));",
    "float height=(luminance-.72)*.005,footprint=.0025;",
    ...(derivatives?[
      "vec3 q0=dFdx(vPosition),q1=dFdy(vPosition),r1=cross(q1,local),r2=cross(local,q0);float determinant=dot(q0,r1);vec3 relief=(r1*dFdx(height)+r2*dFdy(height))*sign(determinant)/max(abs(determinant),1.e-12);local=normalize(local-relief);footprint=max(length(q0),length(q1));"
    ]:[]),
    // Uncorrelated powder relief reveals finer grains as the camera approaches;
    // each octave fades below one pixel instead of aliasing into woven lines.
    "float powderWeight=1.0-smoothstep(.25,.8,footprint*140.0),microWeight=1.0-smoothstep(.25,.8,footprint*650.0),fineWeight=1.0-smoothstep(.25,.8,footprint*2400.0);",
    "vec4 powder=vec4(.5,0,0,0),micro=vec4(.5,0,0,0),fine=vec4(.5,0,0,0);if(powderWeight>.001)powder=noiseGradient(vPosition*140.0);if(microWeight>.001)micro=noiseGradient(vPosition*650.0);if(fineWeight>.001)fine=noiseGradient(vPosition*2400.0);",
    "vec3 gradient=powder.yzw*.018*powderWeight+micro.yzw*.014*microWeight+fine.yzw*.011*fineWeight;local=normalize(local-(gradient-local*dot(gradient,local)));n=normalize(rotate(uBasis*local));",
    "vec3 key=normalize(vec3(-.72,1.05,.58));float lambert=max(0.0,dot(n,key)),sky=n.y*.5+.5;",
    "vec3 albedo=uColor*clamp(1.0+(luminance-.72)*.65,.75,1.12);albedo*=1.0+(powder.x-.5)*.025*powderWeight;",
    "float cavity=.88+.12*smoothstep(.25,.65,luminance),illumination=.25+.10*sky+1.0*lambert+.035*max(0.0,dot(n,normalize(vec3(.8,-.25,.6))));",
    "float sheen=pow(max(0.0,dot(n,normalize(key+eye))),8.0)*.0015;vec3 linear=pow(max(albedo,vec3(.0)),vec3(2.2))*cavity;",
    "color=pow(max(linear*illumination+vec3(sheen),vec3(0)),vec3(1.0/2.2));}",
    "else if(uMaterial<1.5){color+=vec3(.85,.91,1.0)*(spec*.42+windowLight*.25)+vec3(.07)*edge;}",
    "else{vec3 bg=mix(vec3(.91,.92,.91),vec3(.012),uDark);vec3 tint=mix(vec3(1.0),uColor,.7);color=mix(bg*tint,uColor*.4,.2)*(.83+.17*diffuse)+vec3(1.0,.98,.95)*(windowLight*.86+rimLight*.35+spec*.35+edge*.16);alpha*=.6+.35*edge;}",
    "gl_FragColor=vec4(color,alpha);}"
  ].join("\n");
  const identity=[1,0,0,0,1,0,0,0,1];
  function renderer(gl,changed=()=>{}){
    const derivatives=Boolean(gl.getExtension("OES_standard_derivatives"));
    function compile(type,source){const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));return s;}
    const program=gl.createProgram();gl.attachShader(program,compile(gl.VERTEX_SHADER,vertex));gl.attachShader(program,compile(gl.FRAGMENT_SHADER,fragment(derivatives)));gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error("Element renderer unavailable");
    const loc={},attr={};for(const k of ["uViewport","uCenter","uWidth","uAngle","uTilt","uScale","uBasis","uAnchor","uColor","uMaterial","uOpacity","uDark","uSurface"])loc[k]=gl.getUniformLocation(program,k);
    for(const k of ["aPosition","aNormal"])attr[k]=gl.getAttribLocation(program,k);
    const max=gl.getParameter(gl.MAX_VERTEX_ATTRIBS),models=new Map();let preview=null,surfaceLoaded=false,surfaceLoading=false,destroyed=false;
    const surface=gl.createTexture();
    function bindSurface(upload){
      const active=gl.getParameter(gl.ACTIVE_TEXTURE);gl.activeTexture(gl.TEXTURE0);const bound=gl.getParameter(gl.TEXTURE_BINDING_2D);
      gl.bindTexture(gl.TEXTURE_2D,surface);upload();gl.bindTexture(gl.TEXTURE_2D,bound);gl.activeTexture(active);
    }
    bindSurface(()=>{
      gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,1,1,0,gl.RGBA,gl.UNSIGNED_BYTE,new Uint8Array([184,184,184,255]));
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.MIRRORED_REPEAT);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.MIRRORED_REPEAT);
    });
    function loadSurface(){
      if(surfaceLoading||destroyed)return;surfaceLoading=true;
      const image=new Image();
      image.onload=()=>{
        if(destroyed||gl.isContextLost())return;
        const tile=document.createElement("canvas");tile.width=1024;tile.height=2048;
        const ctx=tile.getContext("2d");ctx.imageSmoothingQuality="high";ctx.drawImage(image,0,0,tile.width,tile.height);
        bindSurface(()=>{
          const flip=gl.getParameter(gl.UNPACK_FLIP_Y_WEBGL);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,false);
          gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,tile);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,flip);
          gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR_MIPMAP_LINEAR);gl.generateMipmap(gl.TEXTURE_2D);
          const anisotropy=gl.getExtension("EXT_texture_filter_anisotropic");
          if(anisotropy)gl.texParameterf(gl.TEXTURE_2D,anisotropy.TEXTURE_MAX_ANISOTROPY_EXT,Math.min(8,gl.getParameter(anisotropy.MAX_TEXTURE_MAX_ANISOTROPY_EXT)));
        });
        surfaceLoaded=true;changed(models.size);
      };
      image.src="assets/images/nire/element-mineral-surface-v1.png?v=1";
    }
    function dispose(m){if(m){for(const p of m.parts){gl.deleteBuffer(p.v);gl.deleteBuffer(p.i);}if(m.high)dispose(m.high);}}
    function build(element,quality){
      const geometry=mesh(element.strokes,quality),parts=[];
      for(const b of geometry.batches){
        const v=gl.createBuffer(),i=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,v);gl.bufferData(gl.ARRAY_BUFFER,b.vertices,gl.STATIC_DRAW);gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,i);gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,b.indices,gl.STATIC_DRAW);
        parts.push({v,i,count:b.indices.length});
      }
      const min=[Infinity,Infinity,Infinity],max=[-Infinity,-Infinity,-Infinity];
      for(const b of geometry.batches)for(let i=0;i<b.vertices.length;i+=6)for(let k=0;k<3;k++){min[k]=Math.min(min[k],b.vertices[i+k]);max[k]=Math.max(max[k],b.vertices[i+k]);}
      return {element,signature:JSON.stringify(element.strokes),parts,cpu:geometry.batches,bounds:{min,max},lines:geometry.lines,triangles:geometry.triangles,solids:geometry.solids};
    }
    function set(elements){
      const ids=new Set(elements.map(e=>e.id));
      for(const [id,m]of models)if(!ids.has(id)){dispose(m);models.delete(id);}
      for(const e of elements)if(!models.has(e.id))models.set(e.id,build(e,false));
      changed(models.size);
    }
    function setPreview(element){
      const signature=element?JSON.stringify(element.strokes):null;
      if((preview?.signature??null)!==signature){dispose(preview);preview=element?build(element,true):null;}else if(preview)preview.element=element;
      changed(models.size);
      return {triangles:preview?.triangles||0,solids:preview?.solids||0,bounds:preview?.bounds||null};
    }
    function draw(view,world,angle,tilt,dark){
      gl.useProgram(program);for(let i=0;i<max;i++)gl.disableVertexAttribArray(i);
      gl.uniform2f(loc.uViewport,view.width,view.height);gl.uniform2f(loc.uCenter,view.cx,view.cy);gl.uniform1f(loc.uWidth,view.scale*world.width);gl.uniform1f(loc.uAngle,angle);gl.uniform1f(loc.uTilt,tilt);gl.uniform1f(loc.uDark,dark?1:0);
      const active=gl.getParameter(gl.ACTIVE_TEXTURE);gl.activeTexture(gl.TEXTURE0);const bound=gl.getParameter(gl.TEXTURE_BINDING_2D);gl.bindTexture(gl.TEXTURE_2D,surface);gl.uniform1i(loc.uSurface,0);
      gl.enable(gl.DEPTH_TEST);gl.depthFunc(gl.LEQUAL);gl.disable(gl.CULL_FACE);gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);
      for(const low of [...models.values(),...(preview?[preview]:[])]){
        let m=low;
        if(low!==preview&&low.element.placement.scale*view.scale*world.width>150){low.high||=build(low.element,true);m=low.high;}
        const e=m.element,p=e.placement;if(!p)continue;if(e.material==="mineral")loadSurface();
        gl.uniform3fv(loc.uAnchor,[p.anchor.x/world.width-.5,(world.height*.5-p.anchor.y)/world.width,p.anchor.z/world.width]);
        gl.uniformMatrix3fv(loc.uBasis,false,p.basis||identity);gl.uniform1f(loc.uScale,p.scale);
        const color=e.color.match(/\w\w/g).map(x=>parseInt(x,16)/255);
        gl.uniform3fv(loc.uColor,color);gl.uniform1f(loc.uMaterial,["mineral","porcelain","glass"].indexOf(e.material));gl.uniform1f(loc.uOpacity,e.opacity??1);
        // A closed transparent body has one visible skin. Drawing both skins
        // with blending creates repeated bright seams between neighboring rings.
        gl.enable(gl.CULL_FACE);gl.cullFace(gl.BACK);gl.depthMask(e.material!=="glass");
        for(const p of m.parts){gl.bindBuffer(gl.ARRAY_BUFFER,p.v);gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,p.i);gl.enableVertexAttribArray(attr.aPosition);gl.vertexAttribPointer(attr.aPosition,3,gl.FLOAT,false,24,0);gl.enableVertexAttribArray(attr.aNormal);gl.vertexAttribPointer(attr.aNormal,3,gl.FLOAT,false,24,12);gl.drawElements(gl.TRIANGLES,p.count,gl.UNSIGNED_SHORT,0);}
      }
      gl.bindTexture(gl.TEXTURE_2D,bound);gl.activeTexture(active);
      gl.depthMask(true);gl.disable(gl.CULL_FACE);gl.disable(gl.DEPTH_TEST);
    }
    function point(e,p){
      const a=e.placement,b=a.basis||identity,s=a.scale;
      return {x:a.anchor.x+(b[0]*p[0]+b[3]*p[1]+b[6]*p[2])*s*1600,y:a.anchor.y-(b[1]*p[0]+b[4]*p[1]+b[7]*p[2])*s*1600,z:a.anchor.z+(b[2]*p[0]+b[5]*p[1]+b[8]*p[2])*s*1600};
    }
    function pick(x,y,project,view,world,angle,tilt){
      const c=Math.cos(angle),s=Math.sin(angle),ct=Math.cos(tilt),st=Math.sin(tilt);
      const inverse=v=>{const y=ct*v[1]+st*v[2],z=-st*v[1]+ct*v[2];return [c*v[0]-s*z,y,s*v[0]+c*z];};
      const origin=inverse([0,0,4]),direction=inverse([(x-view.cx)/(view.scale*world.width),(view.cy-y)/(view.scale*world.width),-4]);
      let nearest=null,nearestT=Infinity;
      for(const m of models.values()){
        if(!m.parts.length)continue;
        const p=m.element.placement,b=p.basis||identity,a=[p.anchor.x/world.width-.5,(world.height*.5-p.anchor.y)/world.width,p.anchor.z/world.width];
        const toLocal=v=>[0,1,2].map(k=>(v[0]*b[k*3]+v[1]*b[k*3+1]+v[2]*b[k*3+2])/p.scale);
        const o=toLocal(origin.map((v,k)=>v-a[k])),d=toLocal(direction);
        let near=0,far=nearestT;
        for(let k=0;k<3;k++){
          if(Math.abs(d[k])<1e-12){if(o[k]<m.bounds.min[k]||o[k]>m.bounds.max[k])far=-1;}
          else{const a=(m.bounds.min[k]-o[k])/d[k],b=(m.bounds.max[k]-o[k])/d[k];near=Math.max(near,Math.min(a,b));far=Math.min(far,Math.max(a,b));}
        }
        if(far<near)continue;
        for(const part of m.cpu){
          const v=part.vertices,indices=part.indices;
          for(let i=0;i<indices.length;i+=3){
            const a=indices[i]*6,b=indices[i+1]*6,c=indices[i+2]*6;
            const e1x=v[b]-v[a],e1y=v[b+1]-v[a+1],e1z=v[b+2]-v[a+2],e2x=v[c]-v[a],e2y=v[c+1]-v[a+1],e2z=v[c+2]-v[a+2];
            const hx=d[1]*e2z-d[2]*e2y,hy=d[2]*e2x-d[0]*e2z,hz=d[0]*e2y-d[1]*e2x,det=e1x*hx+e1y*hy+e1z*hz;
            if(Math.abs(det)<1e-12)continue;
            const sx=o[0]-v[a],sy=o[1]-v[a+1],sz=o[2]-v[a+2],u=(sx*hx+sy*hy+sz*hz)/det;if(u<0||u>1)continue;
            const qx=sy*e1z-sz*e1y,qy=sz*e1x-sx*e1z,qz=sx*e1y-sy*e1x,w=(d[0]*qx+d[1]*qy+d[2]*qz)/det;if(w<0||u+w>1)continue;
            const t=(e2x*qx+e2y*qy+e2z*qz)/det;
            if(t>0&&t<nearestT){nearestT=t;nearest={...point(m.element,o.map((v,k)=>v+d[k]*t)),material:'community',feature:'community:'+m.element.id,message:m.element.message||""};}
          }
        }
      }
      if(nearest)return nearest;
      let best=null,distance=14;
      for(const m of models.values())for(const line of m.lines){
        const points=line.points.map(p=>point(m.element,p)),count=line.closed?points.length:points.length-1;
        for(let i=0;i<count;i++){
          const a=points[i],b=points[(i+1)%points.length],p=project(a),q=project(b),dx=q.x-p.x,dy=q.y-p.y,length=dx*dx+dy*dy;
          const t=length?clamp(((x-p.x)*dx+(y-p.y)*dy)/length,0,1):0,d=Math.hypot(x-p.x-dx*t,y-p.y-dy*t);
          if(d<distance){distance=d;best={x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t,z:a.z+(b.z-a.z)*t,material:"community",feature:"community:"+m.element.id,message:m.element.message||""};}
        }
      }
      return best;
    }
    function feature(name){
      const m=models.get(name.slice(10));if(!m)return null;
      return {point:{...m.element.placement.anchor,material:"community",feature:name,message:m.element.message||""},size:m.element.placement.scale*1600};
    }
    return {set,setPreview,draw,pick,feature,count:()=>models.size,surfaceReady:()=>surfaceLoaded,destroy(){destroyed=true;for(const m of models.values())dispose(m);dispose(preview);gl.deleteTexture(surface);gl.deleteProgram(program);}};
  }
  window.createNireElements=renderer;
  window.createNireElementPreview=function(canvas){
    const gl=canvas.getContext("webgl",{alpha:false,antialias:true,preserveDrawingBuffer:true});if(!gl)return null;
    const model=renderer(gl,()=>update()),pointers=new Map(),camera={zoom:1,x:0,y:0};
    let angle=-.22,tilt=.12,raf=0,element=null,drag=null,pinch=null,bounds=null;
    let zoomFrame=0,zoomTarget=null,zoomPrevious=0,zoomAnchor={x:.5,y:.5},gestureScale=1,safariGesture=false;
    function constrain(){
      camera.zoom=clamp(camera.zoom,1,32);
      const travel=(camera.zoom-1)/2;
      camera.x=clamp(camera.x,-travel,travel);camera.y=clamp(camera.y,-travel,travel);
      canvas.dataset.zoomed=String(camera.zoom>1);
    }
    function stopZoom(){cancelAnimationFrame(zoomFrame);zoomFrame=0;zoomTarget=null;zoomPrevious=0;}
    function resetNavigation(){
      stopZoom();const ids=[...pointers.keys()];pointers.clear();drag=pinch=null;gestureScale=1;safariGesture=false;
      for(const id of ids)if(canvas.hasPointerCapture(id))canvas.releasePointerCapture(id);
      camera.zoom=1;camera.x=camera.y=0;angle=-.22;tilt=.12;constrain();
    }
    function draw(){
      raf=0;const rect=canvas.getBoundingClientRect(),dpr=Math.min(devicePixelRatio||1,2),dark=Boolean(window.NireAppearance?.isDark());
      if(!rect.width||!rect.height){stopZoom();return;}
      canvas.width=Math.max(1,Math.round(rect.width*dpr));canvas.height=Math.max(1,Math.round(rect.height*dpr));gl.viewport(0,0,canvas.width,canvas.height);
      gl.clearColor(dark ? .025 : 232/255,dark ? .025 : 234/255,dark ? .025 : 232/255,1);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
      model.draw({width:rect.width,height:rect.height,cx:rect.width*(.5+camera.x),cy:rect.height*(.5+camera.y),scale:Math.min(rect.width,rect.height)*.67/1600*camera.zoom},{width:1600,height:1600},angle,tilt,dark);
      canvas.dataset.mineralSurface=model.surfaceReady()?"ready":"pending";
    }
    const update=()=>{if(!raf)raf=requestAnimationFrame(draw);};
    function set(value){
      if(!value)resetNavigation();
      element=value;const stats=model.setPreview(value?{...value,placement:{anchor:{x:800,y:800,z:0},basis:identity,scale:1}}:null);
      bounds=stats.bounds;
      canvas.dataset.triangles=String(stats.triangles);canvas.dataset.filledBodies=String(stats.solids);update();
    }
    function reset(){
      set(null);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
    }
    function anchor(x,y){
      const r=canvas.getBoundingClientRect();
      return {x:clamp((x-r.left)/Math.max(1,r.width),0,1),y:clamp((y-r.top)/Math.max(1,r.height),0,1)};
    }
    function zoomAt(factor,point){
      const next=clamp(camera.zoom*factor,1,32),ratio=next/camera.zoom;
      camera.x=point.x-.5+(camera.x-point.x+.5)*ratio;camera.y=point.y-.5+(camera.y-point.y+.5)*ratio;
      camera.zoom=next;constrain();update();
    }
    function pan(x,y){
      if(camera.zoom<=1)return;
      const r=canvas.getBoundingClientRect();if(!r.width||!r.height)return;
      camera.x+=x/r.width;camera.y+=y/r.height;constrain();update();
    }
    function rotate(x,y){angle+=x*.009;tilt=clamp(tilt+y*.006,-1.35,1.35);update();}
    function queueZoom(delta,x,y){
      if(!element)return;
      if(zoomTarget===null){zoomTarget=Math.log(camera.zoom);zoomPrevious=0;}
      zoomTarget=clamp(zoomTarget+delta,0,Math.log(32));zoomAnchor=anchor(x,y);
      if(zoomFrame)return;
      function tick(now){
        zoomFrame=0;if(!element||!canvas.getClientRects().length){stopZoom();return;}
        const current=Math.log(camera.zoom),elapsed=zoomPrevious?Math.min(50,now-zoomPrevious):16.67;zoomPrevious=now;
        let next=current+(zoomTarget-current)*(1-Math.exp(-elapsed/42));
        if(Math.abs(zoomTarget-next)<=.0005)next=zoomTarget;
        zoomAt(Math.exp(next)/camera.zoom,zoomAnchor);
        if(next!==zoomTarget)zoomFrame=requestAnimationFrame(tick);else{zoomTarget=null;zoomPrevious=0;}
      }
      zoomFrame=requestAnimationFrame(tick);
    }
    canvas.addEventListener("wheel",e=>{
      e.preventDefault();e.stopPropagation();if(!element||safariGesture)return;
      const r=canvas.getBoundingClientRect(),unit=e.deltaMode===1?16:e.deltaMode===2?r.height:1,dx=e.deltaX*unit,dy=e.deltaY*unit;
      if(!e.ctrlKey&&Math.abs(dx)>Math.abs(dy)*1.15){stopZoom();pan(-dx,0);return;}
      queueZoom(clamp(-dy*(e.ctrlKey ? .012 : .005),-1.2,1.2),e.clientX,e.clientY);
    },{passive:false});
    canvas.addEventListener("gesturestart",e=>{e.preventDefault();stopZoom();safariGesture=true;gestureScale=e.scale||1;},{passive:false});
    canvas.addEventListener("gesturechange",e=>{
      e.preventDefault();const scale=e.scale||1,r=canvas.getBoundingClientRect();
      queueZoom(Math.log(scale/gestureScale),e.clientX??r.left+r.width/2,e.clientY??r.top+r.height/2);gestureScale=scale;
    },{passive:false});
    canvas.addEventListener("gestureend",e=>{e.preventDefault();gestureScale=1;safariGesture=false;},{passive:false});
    function pinchState(){const [a,b]=[...pointers.values()];return {x:(a.x+b.x)/2,y:(a.y+b.y)/2,distance:Math.hypot(a.x-b.x,a.y-b.y)};}
    canvas.addEventListener("pointerdown",e=>{
      if((e.button!==0&&e.button!==1)||!element)return;e.preventDefault();stopZoom();canvas.focus({preventScroll:true});canvas.setPointerCapture(e.pointerId);
      pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});drag={id:e.pointerId,x:e.clientX,y:e.clientY,pan:e.shiftKey||e.button===1};if(pointers.size===2)pinch=pinchState();
    });
    canvas.addEventListener("pointermove",e=>{
      if(!pointers.has(e.pointerId))return;pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
      if(pointers.size>=2){const next=pinchState();if(pinch){zoomAt(next.distance/Math.max(1,pinch.distance),anchor(pinch.x,pinch.y));pan(next.x-pinch.x,next.y-pinch.y);}pinch=next;return;}
      if(drag?.id===e.pointerId){
        const x=e.clientX-drag.x,y=e.clientY-drag.y;
        if(drag.pan)pan(x,y);else rotate(x,y);
        drag={...drag,x:e.clientX,y:e.clientY};
      }
    });
    function end(e){
      if(!pointers.delete(e.pointerId))return;
      pinch=pointers.size>=2?pinchState():null;
      const first=pointers.entries().next().value;drag=first?{id:first[0],...first[1],pan:drag?.pan||false}:null;
    }
    canvas.addEventListener("pointerup",end);canvas.addEventListener("pointercancel",end);canvas.addEventListener("lostpointercapture",end);
    canvas.addEventListener("keydown",e=>{
      if(!element||e.ctrlKey||e.metaKey||e.altKey)return;
      const r=canvas.getBoundingClientRect();
      if(["+","=","-","_"].includes(e.key)){e.preventDefault();queueZoom(Math.log(["-","_"].includes(e.key)?1/1.35:1.35),r.left+r.width/2,r.top+r.height/2);}
      else if(e.key.startsWith("Arrow")){
        e.preventDefault();stopZoom();const x=e.key==="ArrowLeft"?1:e.key==="ArrowRight"?-1:0,y=e.key==="ArrowUp"?1:e.key==="ArrowDown"?-1:0;
        if(e.shiftKey)pan(x*80,y*80);else rotate(x*20,y*20);
      }
      else if(e.key==="Home"){e.preventDefault();resetNavigation();update();}
    });
    constrain();
    new ResizeObserver(update).observe(canvas);document.addEventListener("nire-appearance-change",update);
    return {set,reset,update,available:()=>!gl.isContextLost(),bounds:()=>bounds,triangles:()=>Number(canvas.dataset.triangles||0)};
  };
}());
