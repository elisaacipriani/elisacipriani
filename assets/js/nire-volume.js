(function () {
  "use strict";

  window.createNireSculpture = function (gl) {
    const vertex = `
      attribute vec3 aPosition;
      attribute vec3 aNormal;
      attribute vec3 aMaterial;
      uniform vec2 uViewport, uCenter;
      uniform float uWidth, uAspect, uAngle, uTilt;
      varying vec3 vNormal;
      varying vec3 vMaterial;
      vec3 rotate(vec3 p) {
        float c=cos(uAngle),s=sin(uAngle);
        p=vec3(c*p.x+s*p.z,p.y,-s*p.x+c*p.z);
        c=cos(uTilt);s=sin(uTilt);
        return vec3(p.x,c*p.y-s*p.z,s*p.y+c*p.z);
      }
      void main() {
        float u=aPosition.x,v=aPosition.y;
        float a=u*6.8+v*3.2,b=v*9.5-u*2.8;
        float relief=.105*sin(a)+.045*cos(b);
        float dx=.105*6.8*cos(a)+.045*2.8*sin(b);
        float dy=(.105*3.2*cos(a)-.045*9.5*sin(b))/uAspect;
        vec3 p=rotate(vec3(u-.5,(.5-v)*uAspect,relief+aPosition.z));
        float w=4.0-p.z;
        vec2 center=vec2(2.0*uCenter.x/uViewport.x-1.0,1.0-2.0*uCenter.y/uViewport.y);
        gl_Position=vec4(center*w+p.xy*uWidth*8.0/uViewport,-p.z*.6,w);
        vNormal=rotate(vec3(aNormal.x-dx*aNormal.z,aNormal.y+dy*aNormal.z,aNormal.z));
        vMaterial=aMaterial;
      }`;
    const fragment = `
      precision highp float;
      uniform sampler2D uInk;
      varying vec3 vNormal;
      varying vec3 vMaterial;
      void main() {
        vec4 pigment=texture2D(uInk,vMaterial.xy);
        if(pigment.a<.012)discard;
        vec3 n=normalize(vNormal),light=normalize(vec3(-.55,.7,1.0));
        float diffuse=max(0.0,dot(n,light));
        float highlight=pow(max(0.0,dot(n,normalize(light+vec3(0.0,0.0,1.0)))),46.0);
        float wall=mix(1.0,.78,vMaterial.z);
        vec3 color=pigment.rgb*(.34+.73*diffuse)*wall+vec3(.85,.9,1.0)*highlight*.32;
        gl_FragColor=vec4(color,pigment.a);
      }`;
    function shader(type, source) {
      const result=gl.createShader(type);gl.shaderSource(result,source);gl.compileShader(result);
      if(!gl.getShaderParameter(result,gl.COMPILE_STATUS))throw new Error("Sculpture shader unavailable");
      return result;
    }
    let program;
    try {
      program=gl.createProgram();gl.attachShader(program,shader(gl.VERTEX_SHADER,vertex));gl.attachShader(program,shader(gl.FRAGMENT_SHADER,fragment));gl.linkProgram(program);
      if(!gl.getProgramParameter(program,gl.LINK_STATUS))return null;
    } catch (_) { return null; }
    const uniforms={},attributes={};
    ["uViewport","uCenter","uWidth","uAspect","uAngle","uTilt","uInk"].forEach(k=>uniforms[k]=gl.getUniformLocation(program,k));
    ["aPosition","aNormal","aMaterial"].forEach(k=>attributes[k]=gl.getAttribLocation(program,k));
    const mask=gl.createTexture();
    gl.activeTexture(gl.TEXTURE4);gl.bindTexture(gl.TEXTURE_2D,mask);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,1,1,0,gl.RGBA,gl.UNSIGNED_BYTE,new Uint8Array([0,0,0,0]));
    const maxAttributes=gl.getParameter(gl.MAX_VERTEX_ATTRIBS);
    let batches=[],bounds=[0,0,0,0],vertices=0;
    function set(model) {
      for(const b of batches){gl.deleteBuffer(b.vertices);gl.deleteBuffer(b.indices);}
      batches=[];vertices=0;bounds=[0,0,0,0];
      if(gl.isContextLost())return;
      gl.activeTexture(gl.TEXTURE4);gl.bindTexture(gl.TEXTURE_2D,mask);
      if(!model){gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,1,1,0,gl.RGBA,gl.UNSIGNED_BYTE,new Uint8Array([0,0,0,0]));return;}
      gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,model.mask);
      bounds=model.bounds;
      for(const part of model.batches){
        const v=gl.createBuffer(),i=gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER,v);gl.bufferData(gl.ARRAY_BUFFER,part.vertices,gl.STATIC_DRAW);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,i);gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,part.indices,gl.STATIC_DRAW);
        batches.push({vertices:v,indices:i,count:part.indices.length});vertices+=part.vertices.length/9;
      }
    }
    function draw(view,world,angle,tilt) {
      if(!batches.length||gl.isContextLost())return;
      gl.useProgram(program);gl.uniform1i(uniforms.uInk,1);
      gl.uniform2f(uniforms.uViewport,view.width,view.height);gl.uniform2f(uniforms.uCenter,view.cx,view.cy);
      gl.uniform1f(uniforms.uWidth,view.scale*world.width);gl.uniform1f(uniforms.uAspect,world.height/world.width);
      gl.uniform1f(uniforms.uAngle,angle);gl.uniform1f(uniforms.uTilt,tilt);
      gl.clear(gl.DEPTH_BUFFER_BIT);gl.enable(gl.DEPTH_TEST);
      for(let i=0;i<maxAttributes;i++)gl.disableVertexAttribArray(i);
      for(const b of batches){
        gl.bindBuffer(gl.ARRAY_BUFFER,b.vertices);gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,b.indices);
        ["aPosition","aNormal","aMaterial"].forEach((key,i)=>{gl.enableVertexAttribArray(attributes[key]);gl.vertexAttribPointer(attributes[key],3,gl.FLOAT,false,36,i*12);});
        gl.drawElements(gl.TRIANGLES,b.count,gl.UNSIGNED_SHORT,0);
      }
      gl.disable(gl.DEPTH_TEST);
    }
    return {set,draw,bounds:()=>bounds,active:()=>Boolean(batches.length),vertices:()=>vertices};
  };

  window.createNireVolume = function (host) {
    const $=id=>document.getElementById(id);
    const tool=$("nire-volume-tool"),panel=$("nire-volume-panel"),depth=$("nire-volume-depth"),output=$("nire-volume-depth-value");
    const apply=$("nire-volume-apply"),flatten=$("nire-volume-flatten"),selection=$("nire-volume-selection"),outline=$("nire-volume-outline"),message=$("nire-volume-message");
    const scratch=document.createElement("canvas"),ctx=scratch.getContext("2d",{willReadFrequently:true});
    let operations=[],region=null,drag=null,open=false,picking=false,source=null,timer=0,dirty=false,preview=false,applied=false;
    let language="es";
    const copy={
      es:{pick:"Elegir zona",picking:"Marcá una zona sobre tu dibujo.",cancel:"Cancelar",title:"Volumen 3D",tool:"Dar volumen a una zona de tu pieza",hint:"Marcá sobre el dibujo la zona que quieras llevar a 3D, o elegí toda la pieza.",all:"Toda la pieza",depth:"Profundidad",apply:"Aplicar 3D",flatten:"Volver a plano",close:"Cerrar volumen 3D",selected:"Zona seleccionada. Ajustá la profundidad para ver el resultado.",empty:"Dibujá o agregá un texto o una foto en esa zona.",done:"Volumen aplicado. Podés deshacerlo o volver a plano desde 3D.",flat:"La zona seleccionada vuelve a plano.",unsupported:"El volumen 3D no está disponible en este navegador."},
      en:{pick:"Choose area",picking:"Mark an area on your drawing.",cancel:"Cancel",title:"3D volume",tool:"Give part of your piece 3D volume",hint:"Mark the area you want to turn into 3D, or choose your entire piece.",all:"Entire piece",depth:"Depth",apply:"Apply 3D",flatten:"Make flat",close:"Close 3D volume",selected:"Area selected. Adjust the depth to preview the result.",empty:"Draw or add text or a photo in this area.",done:"Volume applied. Undo it or make the area flat from 3D.",flat:"The selected area is flat again.",unsupported:"3D volume is unavailable in this browser."}
    };
    const t=k=>copy[language][k]||k;
    function localize(){
      language=document.documentElement.lang==="en"?"en":"es";
      document.querySelectorAll("[data-volume-copy]").forEach(n=>n.textContent=t(n.dataset.volumeCopy));
      document.querySelectorAll("[data-volume-label]").forEach(n=>{n.setAttribute("aria-label",t(n.dataset.volumeLabel));});
      output.textContent=`${depth.value}%`;tool.disabled=!host.supported();
      if(!host.supported())tool.setAttribute("aria-label",t("unsupported"));
    }
    localize();new MutationObserver(localize).observe(document.documentElement,{attributes:true,attributeFilter:["lang"]});
    function syncSelection(){
      selection.toggleAttribute("hidden",!open||!region);
      panel.classList.toggle("has-region",Boolean(region));
      apply.disabled=flatten.disabled=!region||!host.supported();
      if(!open||!region)return;
      const v=host.view();selection.setAttribute("viewBox",`0 0 ${v.width} ${v.height}`);
      outline.setAttribute("points",[[region.x,region.y],[region.x+region.width,region.y],[region.x+region.width,region.y+region.height],[region.x,region.y+region.height]].map(([x,y])=>host.project({x,y})).map(p=>`${p.x},${p.y}`).join(" "));
    }
    function close(focus=false){
      open=false;picking=false;$("nire-volume-picking").hidden=true;drag=null;preview=false;panel.hidden=true;tool.setAttribute("aria-expanded","false");
      document.body.classList.remove("nire-volume-mode");syncSelection();host.hold();invalidate();
      if(focus)host.canvas.focus({preventScroll:true});
    }
    function invalidate(){dirty=true;host.render();}
    tool.addEventListener("click",()=>{
      if(!host.canEdit()||!host.supported())return;
      if(open){close(true);return;}
      host.finish();host.prepare();open=true;preview=false;panel.hidden=false;message.textContent="";
      tool.setAttribute("aria-expanded","true");document.body.classList.add("nire-volume-mode");
      document.dispatchEvent(new CustomEvent("nire-panel-open",{detail:"volume"}));host.hold();syncSelection();
    });
    function endPicking(){picking=false;$("nire-volume-picking").hidden=true;if(open)panel.hidden=false;}
    $("nire-volume-pick").addEventListener("click",()=>{picking=true;panel.hidden=true;$("nire-volume-picking").hidden=false;host.canvas.focus({preventScroll:true});});
    $("nire-volume-cancel-pick").addEventListener("click",endPicking);
    $("nire-volume-close").addEventListener("click",()=>close(true));
    document.addEventListener("nire-scene-lost",()=>{close(false);localize();});
    document.addEventListener("nire-panel-open",e=>{if(e.detail!=="volume"&&open)close(false);});
    document.addEventListener("keydown",e=>{if(e.key==="Escape"&&open){e.preventDefault();close(true);}});
    depth.addEventListener("input",()=>{output.textContent=`${depth.value}%`;preview=Boolean(region);invalidate();});
    function all(){
      if(!source)return;
      const s=.25;scratch.width=Math.max(1,Math.round(source.width*s));scratch.height=Math.max(1,Math.round(source.height*s));ctx.drawImage(source,0,0,scratch.width,scratch.height);
      const pixels=ctx.getImageData(0,0,scratch.width,scratch.height).data;
      let l=scratch.width,r=-1,top=scratch.height,bottom=-1;
      for(let y=0;y<scratch.height;y++)for(let x=0;x<scratch.width;x++)if(pixels[(y*scratch.width+x)*4+3]>8){l=Math.min(l,x);r=Math.max(r,x);top=Math.min(top,y);bottom=Math.max(bottom,y);}
      if(r<0){message.textContent=t("empty");return;}
      const bounds=host.inkBounds;
      region={x:bounds.x+(l/s-4)/bounds.scale,y:bounds.y+(top/s-4)/bounds.scale,width:((r-l+1)/s+8)/bounds.scale,height:((bottom-top+1)/s+8)/bounds.scale};
      endPicking();preview=true;message.textContent=t("selected");syncSelection();invalidate();
    }
    $("nire-volume-all").addEventListener("click",all);
    function commit(value){
      if(!region)return;
      preview=false;host.commit({type:"volume",region:{...region},depth:value});close(true);host.notify(t(value?"done":"flat"));
    }
    apply.addEventListener("click",()=>{if(!applied){message.textContent=t("empty");return;}commit(Number(depth.value)*1.2);});
    flatten.addEventListener("click",()=>commit(0));
    function point(event){return host.point(event.clientX,event.clientY);}
    function pointerDown(event){
      if(!open)return false;
      if(event.button!==0||!event.isPrimary)return true;
      event.preventDefault();host.canvas.setPointerCapture(event.pointerId);drag={id:event.pointerId,start:point(event)};region=null;preview=false;syncSelection();return true;
    }
    function pointerMove(event){
      if(!open)return false;
      if(!drag||drag.id!==event.pointerId)return true;
      const end=point(event);region={x:Math.min(drag.start.x,end.x),y:Math.min(drag.start.y,end.y),width:Math.abs(end.x-drag.start.x),height:Math.abs(end.y-drag.start.y)};
      syncSelection();return true;
    }
    function pointerUp(event){
      if(!open)return false;
      if(!drag||drag.id!==event.pointerId)return true;
      if(event.type!=="pointerup"){drag=null;region=null;preview=false;endPicking();syncSelection();invalidate();return true;}
      pointerMove(event);drag=null;
      if(host.canvas.hasPointerCapture(event.pointerId))host.canvas.releasePointerCapture(event.pointerId);
      if(!region||region.width*host.view().scale<5||region.height*host.view().scale<5){region=null;endPicking();syncSelection();return true;}
      endPicking();preview=true;message.textContent=t("selected");syncSelection();invalidate();return true;
    }

    function build(){
      clearTimeout(timer);timer=0;
      if(!dirty||!source)return;
      dirty=false;
      const regions=operations.concat(preview&&region?[{region,depth:Number(depth.value)*1.2}]:[]);
      const raised=regions.filter(op=>op.depth>0);
      if(!raised.length||!host.supported()){host.set(null);applied=false;return;}
      const ib=host.inkBounds,scale=ib.scale;
      const left=Math.max(0,Math.floor((Math.min(...raised.map(op=>op.region.x))-ib.x)*scale)-4);
      const top=Math.max(0,Math.floor((Math.min(...raised.map(op=>op.region.y))-ib.y)*scale)-4);
      const right=Math.min(source.width,Math.ceil((Math.max(...raised.map(op=>op.region.x+op.region.width))-ib.x)*scale)+4);
      const bottom=Math.min(source.height,Math.ceil((Math.max(...raised.map(op=>op.region.y+op.region.height))-ib.y)*scale)+4);
      if(right<=left||bottom<=top){host.set(null);applied=false;return;}
      const step=Math.max(1,Math.ceil(Math.sqrt((right-left)*(bottom-top)/100000)));
      const w=Math.ceil((right-left)/step),h=Math.ceil((bottom-top)/step),dx=(right-left)/w/scale,dy=(bottom-top)/h/scale;
      scratch.width=w;scratch.height=h;ctx.clearRect(0,0,w,h);ctx.drawImage(source,left,top,right-left,bottom-top,0,0,w,h);
      const pixels=ctx.getImageData(0,0,w,h).data,solid=new Uint8Array(w*h),heights=new Float32Array(w*h),dist=new Float32Array(w*h);
      const x0=ib.x+left/scale,y0=ib.y+top/scale;
      let count=0,selectedInk=false;
      for(let y=0;y<h;y++)for(let x=0;x<w;x++){
        const at=y*w+x,wx=x0+(x+.5)*dx,wy=y0+(y+.5)*dy;
        if(region&&wx>=region.x&&wx<=region.x+region.width&&wy>=region.y&&wy<=region.y+region.height&&pixels[at*4+3]>8)selectedInk=true;
        let amount=0;
        for(const op of regions){const r=op.region;if(wx>=r.x&&wx<=r.x+r.width&&wy>=r.y&&wy<=r.y+r.height)amount=op.depth;}
        if(amount>0&&pixels[at*4+3]>8){solid[at]=1;heights[at]=amount;dist[at]=10000;count++;}else dist[at]=0;
      }
      applied=selectedInk;
      if(!count){host.set(null);return;}
      const diagonal=Math.SQRT2;
      for(let y=0;y<h;y++)for(let x=0;x<w;x++){
        const i=y*w+x;if(!solid[i])continue;
        dist[i]=Math.min(dist[i],x?dist[i-1]+1:1,y?dist[i-w]+1:1,x&&y?dist[i-w-1]+diagonal:10000,x<w-1&&y?dist[i-w+1]+diagonal:10000);
      }
      for(let y=h-1;y>=0;y--)for(let x=w-1;x>=0;x--){
        const i=y*w+x;if(!solid[i])continue;
        dist[i]=Math.min(dist[i],x<w-1?dist[i+1]+1:1,y<h-1?dist[i+w]+1:1,x<w-1&&y<h-1?dist[i+w+1]+diagonal:10000,x&&y<h-1?dist[i+w-1]+diagonal:10000);
        const t=Math.min(1,dist[i]/Math.max(1.5,heights[i]/Math.min(dx,dy)*.45));
        heights[i]*=Math.sqrt(t*(2-t));
      }
      const cw=w+1,ch=h+1,corners=new Float32Array(cw*ch);
      for(let y=0;y<ch;y++)for(let x=0;x<cw;x++){
        let value=0,n=0;
        for(let yy=Math.max(0,y-1);yy<=Math.min(h-1,y);yy++)for(let xx=Math.max(0,x-1);xx<=Math.min(w-1,x);xx++){if(solid[yy*w+xx]){value+=heights[yy*w+xx];n++;}}
        corners[y*cw+x]=n?value/n*(n<4?.72:1):0;
      }
      const world=host.world,mask=document.createElement("canvas");mask.width=w;mask.height=h;
      const mc=mask.getContext("2d"),mp=mc.createImageData(w,h);
      for(let i=0;i<solid.length;i++){mp.data[i*4]=solid[i]?255:0;mp.data[i*4+3]=255;}mc.putImageData(mp,0,0);
      let verts=[],indices=[];const batches=[];
      function flush(){if(!indices.length)return;batches.push({vertices:new Float32Array(verts),indices:new Uint16Array(indices)});verts=[];indices=[];}
      function quad(points,normals,uvs,wall){
        if(verts.length/9+4>60000)flush();const start=verts.length/9;
        for(let i=0;i<4;i++)verts.push(points[i][0]/world.width,points[i][1]/world.height,points[i][2]/world.width,...normals[i],uvs[i][0],uvs[i][1],wall);
        indices.push(start,start+1,start+2,start,start+2,start+3);
      }
      function vertex(x,y){return[x0+x*dx,y0+y*dy,corners[y*cw+x]];}
      function normal(x,y){return[-(corners[y*cw+Math.min(w,x+1)]-corners[y*cw+Math.max(0,x-1)])/(dx*(x>0&&x<w?2:1)),(corners[Math.min(h,y+1)*cw+x]-corners[Math.max(0,y-1)*cw+x])/(dy*(y>0&&y<h?2:1)),1];}
      function uv(x,y){return[(left+x*(right-left)/w)/source.width,(top+y*(bottom-top)/h)/source.height];}
      for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(solid[y*w+x]){
        const p=[vertex(x,y),vertex(x+1,y),vertex(x+1,y+1),vertex(x,y+1)],n=[normal(x,y),normal(x+1,y),normal(x+1,y+1),normal(x,y+1)],u=[uv(x,y),uv(x+1,y),uv(x+1,y+1),uv(x,y+1)];
        quad(p,n,u,0);
        for(const [a,b,empty,normalWall]of[[0,1,y===0||!solid[(y-1)*w+x],[0,1,0]],[1,2,x===w-1||!solid[y*w+x+1],[1,0,0]],[2,3,y===h-1||!solid[(y+1)*w+x],[0,-1,0]],[3,0,x===0||!solid[y*w+x-1],[-1,0,0]]])if(empty){
          const inside=uv(x+.5,y+.5);
          quad([p[a],p[b],[p[b][0],p[b][1],0],[p[a][0],p[a][1],0]],Array(4).fill(normalWall),Array(4).fill(inside),1);
        }
      }
      flush();host.set({batches,mask,bounds:[x0/world.width,y0/world.height,(right-left)/scale/world.width,(bottom-top)/scale/world.height]});
    }
    return {
      reset(){operations=[];dirty=true;},
      apply(op){if(op.type!=="volume")return false;operations.push(op);dirty=true;return true;},
      update(image){
        source=image;dirty=true;syncSelection();clearTimeout(timer);
        if(!operations.some(op=>op.depth>0)&&!(preview&&region)){host.set(null);dirty=false;applied=false;return;}
        timer=setTimeout(build,90);
      },
      flush:build,close,holdsMotion:()=>open||Boolean(drag),active:()=>open,pointerDown,pointerMove,pointerUp,
      keyDown(event){if(!open)return false;if(event.key==="Enter"){all();event.preventDefault();}return true;}
    };
  };
}());
