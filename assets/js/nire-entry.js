(function () {
  "use strict";

  // Explore the actual spatial model; no flat drawing or photograph is shown.
  window.createNireEntrance = function (host) {
    const surface = document.getElementById("nire-detail-pan");
    const start = document.getElementById("nire-start");
    const pointers = new Map();
    let pinch = null, tap = null, magnification = 1;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    let active = false, moving = false, closing = false, focus = null, feature = null, featureCenter = null, featureSize = 1;
    let zoom = 1, progress = 0, raf = 0, drag = null;
    let resizeFrame=0;
    let animationEnd = null;
    let zoomFrame=0,zoomTarget=null,zoomPrevious=0,zoomMode=false,zoomAnchor=null,interactionTimer=0;
    let suppressClickUntil=0,overviewPinch=null;
    const overviewPointers=new Map();
    const lensLayer=document.createElement('div');
    lensLayer.className='nire-mist-fields';lensLayer.setAttribute('aria-live','polite');lensLayer.setAttribute('aria-atomic','true');surface.append(lensLayer);
    const lenses=[];

    function dismiss(){
      if(!lenses.length)return false;
      lenses.length=0;lensLayer.replaceChildren();surface.dataset.lenses='0';return true;
    }
    function holdInteraction(){
      clearTimeout(interactionTimer);host.scene()?.interact(true);
    }
    function releaseInteraction(){
      clearTimeout(interactionTimer);
      interactionTimer=setTimeout(()=>{
        if(!zoomFrame&&!pointers.size&&!overviewPointers.size)host.scene()?.interact(false);
      },160);
    }
    function stopZoom(){
      cancelAnimationFrame(zoomFrame);zoomFrame=0;zoomTarget=null;zoomPrevious=0;releaseInteraction();
    }

    function lensRadius(){
      const v=baseView();return Math.min(180,v.width*(v.width<600?.32:.18),v.height*.27);
    }
    function updateLenses(){
      const scene=host.scene();if(!scene)return;
      const v=baseView(),radius=lensRadius(),diameter=radius*2;
      for(const lens of lenses){
        const p=scene.projectPoint(lens.point);
        const x=Math.max(radius+12,Math.min(v.width-radius-12,p.x));
        const y=Math.max(radius+12,Math.min(v.height-radius-12,p.y));
        Object.assign(lens.node.style,{left:`${x}px`,top:`${y}px`,width:`${diameter}px`,height:`${diameter}px`});
      }
      surface.dataset.lenses=String(lenses.length);
    }
    function addLens(point){
      lenses.length=0;lensLayer.replaceChildren();
      const node=document.createElement('article');node.className='nire-mist-lens nire-rock-lens';
      const drawing=point.material==='drawing',bubble=point.material==='bubble',crystal=point.material==='crystal';
      const community=point.material==='community';
      if(drawing)node.classList.add('nire-drawing-lens');
      if(bubble)node.classList.add('nire-bubble-lens');
      if(crystal)node.classList.add('nire-crystal-lens');
      if(community)node.classList.add('nire-community-lens');
      const label=community?'communityFactLabel':drawing?'drawingFactLabel':bubble?'bubbleFactLabel':crystal?'crystalFactLabel':'rockFactLabel';
      node.dataset.nireLabel=label;node.setAttribute('aria-label',host.text(label));
      const content=document.createElement('div');content.className='nire-rock-copy';
      const stone=point.material==='boulder';
      const parts=community?[]:drawing||bubble?[[drawing?'drawingFact':'bubbleFact','p','nire-rock-fact']]:[[crystal?'crystalTitle':stone?'boulderTitle':'rockTitle','h2','nire-rock-title'],[crystal?'crystalFact':stone?'boulderFact':'rockFact','p','nire-rock-fact']];
      for(const[key,tag,name]of parts){
        const part=document.createElement(tag);part.className=name;part.dataset.nireCopy=key;part.textContent=host.text(key);
        content.append(part);
      }
      if(community){
        const part=document.createElement('p');part.className='nire-rock-fact nire-community-fact';part.textContent=point.message;content.append(part);
      }
      // Keep longer reflections readable inside the same circle. The scene's
      // touch-action:none requires handling a reading swipe locally.
      let reading=null,readingSwipe=false;
      content.addEventListener('wheel',event=>{if(content.scrollHeight>content.clientHeight+1)event.stopPropagation();},{passive:true});
      content.addEventListener('pointerdown',event=>{
        event.stopPropagation();readingSwipe=false;
        if(event.button!==0||event.pointerType==='mouse'||content.scrollHeight<=content.clientHeight+1)return;
        reading={id:event.pointerId,y:event.clientY,top:content.scrollTop};content.setPointerCapture(event.pointerId);
      });
      content.addEventListener('pointermove',event=>{
        if(reading?.id!==event.pointerId)return;event.stopPropagation();
        const distance=event.clientY-reading.y;
        if(Math.abs(distance)>4)readingSwipe=true;
        if(readingSwipe){event.preventDefault();content.scrollTop=reading.top-distance;}
      },{passive:false});
      const finishReading=event=>{
        event.stopPropagation();if(reading?.id!==event.pointerId)return;reading=null;
        if(content.hasPointerCapture(event.pointerId))content.releasePointerCapture(event.pointerId);
      };
      content.addEventListener('pointerup',finishReading);content.addEventListener('pointercancel',finishReading);content.addEventListener('lostpointercapture',finishReading);
      content.addEventListener('click',event=>{event.stopPropagation();if(readingSwipe){readingSwipe=false;return;}dismiss();});
      node.append(content);lensLayer.append(node);
      lenses.push({node,point:{...point}});updateLenses();
      if(!reduced.matches)node.animate([{opacity:0,transform:'translate(-50%,-50%) scale(.97)'},{opacity:1,transform:'translate(-50%,-50%) scale(1)'}],{duration:450,easing:'cubic-bezier(.22,1,.36,1)'});
    }
    function revealAt(x,y,keyboard=false){
      const scene=host.scene();if(!scene)return;
      if(dismiss())return;
      let point=scene.pickPoint(x,y,12);
      const readable=p=>p&&(['rock','boulder','drawing','bubble','crystal'].includes(p.material)||p.material==='community'&&Boolean(p.message?.trim()));
      // Fine line art and glass arches enclose open space. Their reflection is
      // also available inside the explored fragment and from its centre.
      if(!readable(point)&&(['elisaDrawing','poppyTear'].includes(feature)||feature?.startsWith('community:'))){
        const info=scene.featureInfo(feature);
        if(info){
          const center=scene.projectPoint(info.point),ratio=scene.view().scale/baseView().scale;
          if(keyboard||(Math.abs(x-center.x)<=info.screen.width*ratio/2&&Math.abs(y-center.y)<=info.screen.height*ratio/2))point=info.point;
        }
      }
      if(readable(point))addLens(point);
    }

    function hitTest(x,y,tolerance){
      const scene=host.scene();
      return Boolean(scene&&scene.modelVisible()&&scene.pickPoint(x,y,tolerance));
    }
    function baseView() { return host.scene() ? host.scene().baseView() : host.view(); }
    function minimumZoom() { return 1/(host.scene()?.overviewZoom()||1); }
    function targetZoom() {
      const v = baseView();
      const specimen=feature&&host.scene()?.featureInfo(feature);if(specimen)return specimen.zoom;
      return Math.max(1.4,6.2/(host.scene()?.overviewZoom()||1), v.width * 2.6 / (v.scale * host.world.width), v.height * 3 / (v.scale * host.world.height));
    }
    function pointAt(x,y){
      const scene=host.scene();
      return scene?scene.pointAt(x,y):host.pointAt(x,y);
    }
    function draw() {
      if (!active || !focus) return;
      const scene = host.scene();
      if(scene)scene.setFocus(focus,zoom,progress);
      surface.dataset.zoom = (zoom/targetZoom()).toFixed(3);
      surface.style.cursor=zoom>minimumZoom()*(1+1e-7)?"":"default";
      updateLenses();
    }
    function animate(fromZoom, toZoom, fromProgress, toProgress) {
      moving = true;
      const duration = reduced.matches ? 0 : 650;
      return new Promise(resolve => {
        animationEnd = resolve;
        const began = performance.now();
        const tick = now => {
          const t = duration ? Math.min(1, (now - began) / duration) : 1;
          const ease = t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
          zoom = Math.exp(Math.log(fromZoom)+(Math.log(toZoom)-Math.log(fromZoom))*ease);
          progress = fromProgress + (toProgress - fromProgress) * ease;
          draw();
          if (t < 1) raf = requestAnimationFrame(tick);
          else { raf = 0; moving = false; animationEnd = null; resolve(); }
        };
        raf = requestAnimationFrame(tick);
      });
    }
    async function open(origin) {
      stopZoom();dismiss();closing=false;
      const scene=host.scene();
      focus = scene&&scene.modelVisible()
        ? scene.pickPoint(origin.x,origin.y,32)||{x:host.world.width*.475,y:host.world.height*.397}
        : host.pointAt(origin.x, origin.y);
      feature=focus.feature||null;featureCenter=null;
      if(feature){const info=scene.featureInfo(feature);if(info){focus=info.point;featureCenter={...info.point};featureSize=info.size;}}
      active = true;
      magnification = 1;
      zoom = targetZoom(); progress = 1;
      // Keep the camera centered on the selected 3D point throughout the zoom.
      draw();
      zoom = 1; progress = 0; draw();
      await animate(1, targetZoom(), 0, 1);
      if(active&&!closing&&!pointers.size&&!zoomFrame&&feature?.startsWith('community:')){
        const point=scene.featureInfo(feature)?.point;
        if(point?.message?.trim())addLens(point);
      }
    }
    async function close() {
      stopZoom();dismiss();closing=true;
      host.scene()?.beginReturnToTree();
      await animate(zoom, 1, progress, 0);
      reset();
    }
    function reset() {
      stopZoom();
      active = moving = closing = false; drag = pinch = tap = null; pointers.clear();
      feature=featureCenter=null;
      lenses.length=0;lensLayer.replaceChildren();surface.dataset.lenses='0';
      cancelAnimationFrame(raf); raf = 0;
      cancelAnimationFrame(resizeFrame);resizeFrame=0;
      if (animationEnd) animationEnd();
      animationEnd = null;
      if(host.scene())host.scene().setFocus(null);
    }
    function center(point) {
      if (!active || moving) return;
      focus = { x: Math.max(0, Math.min(host.world.width, point.x)), y: Math.max(0, Math.min(host.world.height, point.y)) };
      if(Number.isFinite(point.z))focus.z=point.z;
      if(feature)focus.feature=feature;
      draw();
    }
    function shiftFocus(previous,next){
      if(zoom<=minimumZoom()*(1+1e-7))return;
      const point={x:focus.x+previous.x-next.x,y:focus.y+previous.y-next.y};
      if(Number.isFinite(previous.z)&&Number.isFinite(next.z)){
        const base=focus.z===undefined?window.NireTreeForm.depth(focus.x/host.world.width,focus.y/host.world.height)*host.world.width:focus.z;
        point.z=base+previous.z-next.z;
      }
      center(point);
    }
    function zoomAt(factor, x, y) {
      if (!active || moving) return;
      const before = pointAt(x, y);
      zoom = Math.max(minimumZoom(), Math.min(targetZoom()*80, zoom*factor));
      magnification = zoom/targetZoom();
      draw();
      const after = pointAt(x, y);
      shiftFocus(before,after);
    }
    function zoomCentered(factor) {
      const v = baseView();
      zoomAt(factor, v.width/2, v.height/2);
    }
    function interruptOpening(){
      if(!moving)return true;
      if(closing)return false;
      const v=baseView(),before=pointAt(v.width/2,v.height/2);
      cancelAnimationFrame(raf);raf=0;moving=false;progress=1;draw();
      shiftFocus(before,pointAt(v.width/2,v.height/2));
      magnification=zoom/targetZoom();
      const done=animationEnd;animationEnd=null;if(done)done();return true;
    }
    function queueZoom(logDelta,x,y){
      if(!host.scene()?.modelVisible()||!interruptOpening())return;
      dismiss();holdInteraction();
      const mode=active,current=mode?zoom:host.scene().overviewZoom();
      if(zoomTarget===null||zoomMode!==mode){zoomTarget=Math.log(current);zoomMode=mode;zoomPrevious=0;}
      const low=mode?minimumZoom():1,high=mode?targetZoom()*80:32;
      zoomTarget=Math.max(Math.log(low),Math.min(Math.log(high),zoomTarget+logDelta));
      zoomAnchor={x,y};
      if(zoomFrame)return;
      const tick=now=>{
        zoomFrame=0;
        if(active!==zoomMode||moving){stopZoom();return;}
        const current=active?zoom:host.scene().overviewZoom(),difference=zoomTarget-Math.log(current);
        const elapsed=zoomPrevious?Math.min(50,now-zoomPrevious):16.67;zoomPrevious=now;
        let next=Math.exp(Math.log(current)+difference*(1-Math.exp(-elapsed/42)));
        if(Math.abs(zoomTarget-Math.log(next))<=.0005)next=Math.exp(zoomTarget);
        if(active)zoomAt(next/current,zoomAnchor.x,zoomAnchor.y);
        else host.scene().zoomOverview(next/current,zoomAnchor.x,zoomAnchor.y);
        if(Math.abs(zoomTarget-Math.log(next))>.0005)zoomFrame=requestAnimationFrame(tick);
        else{zoomTarget=null;zoomPrevious=0;releaseInteraction();}
      };
      zoomFrame=requestAnimationFrame(tick);
    }
    for(const element of [start,surface]){
      let gestureScale=1,safariGesture=false;
      element.addEventListener('wheel',event=>{
        if(element===start?active:!active)return;
        if(!host.scene()?.modelVisible()||!interruptOpening())return;
        event.preventDefault();
        if(safariGesture)return;
        const unit=event.deltaMode===1?16:event.deltaMode===2?baseView().height:1;
        const dx=event.deltaX*unit,dy=event.deltaY*unit;
        if(!event.ctrlKey&&Math.abs(dx)>Math.abs(dy)*1.15){
          dismiss();stopZoom();holdInteraction();
          if(active){const previous=pointAt(event.clientX,event.clientY),next=pointAt(event.clientX-dx,event.clientY);shiftFocus(previous,next);}
          else host.scene().panOverview(-dx,0);
          releaseInteraction();return;
        }
        queueZoom(Math.max(-1.2,Math.min(1.2,-dy*(event.ctrlKey ? .012 : .005))),event.clientX,event.clientY);
      },{passive:false});
      element.addEventListener('gesturestart',event=>{
        if(element===start?active:!active)return;
        event.preventDefault();stopZoom();safariGesture=true;gestureScale=event.scale||1;holdInteraction();
      },{passive:false});
      element.addEventListener('gesturechange',event=>{
        if(element===start?active:!active)return;
        event.preventDefault();const scale=event.scale||1;
        queueZoom(Math.log(scale/gestureScale),event.clientX??baseView().width/2,event.clientY??baseView().height/2);gestureScale=scale;
      },{passive:false});
      element.addEventListener('gestureend',()=>{gestureScale=1;safariGesture=false;releaseInteraction();});
    }
    function pinchState() {
      const [a,b] = [...pointers.values()];
      return { x: (a.x+b.x)/2, y: (a.y+b.y)/2, distance: Math.hypot(a.x-b.x,a.y-b.y) };
    }
    surface.addEventListener("pointerdown", event => {
      if (!active || event.button !== 0 || !interruptOpening()) return;
      event.preventDefault();
      stopZoom();holdInteraction();
      pointers.set(event.pointerId,{x:event.clientX,y:event.clientY});
      surface.setPointerCapture(event.pointerId);
      if (pointers.size===1){
        drag = { id: event.pointerId, x: event.clientX, y: event.clientY };
        tap={id:event.pointerId,x:event.clientX,y:event.clientY,time:performance.now()};
      }else { tap = drag = null; pinch = pinchState(); }
      surface.classList.add("is-dragging");
    });
    surface.addEventListener("pointermove", event => {
      if (!active || moving) return;
      if (!pointers.has(event.pointerId)) return;
      pointers.set(event.pointerId,{x:event.clientX,y:event.clientY});
      if(tap&&Math.hypot(event.clientX-tap.x,event.clientY-tap.y)>6){tap=null;dismiss();}
      if (pointers.size>1) {
        dismiss();
        const next = pinchState();
        if (pinch && pinch.distance>4) {
          zoomAt(next.distance/pinch.distance,next.x,next.y);
          const previous=pointAt(pinch.x,pinch.y),current=pointAt(next.x,next.y);
          shiftFocus(previous,current);
        }
        pinch=next; return;
      }
      if (!drag || drag.id !== event.pointerId) return;
      const previous = pointAt(drag.x, drag.y), next = pointAt(event.clientX, event.clientY);
      shiftFocus(previous,next);
      drag.x = event.clientX; drag.y = event.clientY;
    });
    function release(event) {
      const clicked=event.type==='pointerup'&&tap&&tap.id===event.pointerId&&pointers.size===1&&performance.now()-tap.time<750;
      tap=null;
      pointers.delete(event.pointerId);
      pinch=null;
      if(pointers.size===1) {
        const [id,p]=pointers.entries().next().value;
        drag={id,x:p.x,y:p.y};
      } else { drag=null; surface.classList.remove("is-dragging"); }
      if(clicked)revealAt(event.clientX,event.clientY);
      if(!pointers.size)releaseInteraction();
    }
    surface.addEventListener("pointerup", release);
    surface.addEventListener("pointercancel", release);
    surface.addEventListener("lostpointercapture", release);
    surface.addEventListener("keydown", event => {
      if (!active || moving) return;
      if(event.key==='Enter'||event.key===' '){
        event.preventDefault();const v=baseView();revealAt(v.width/2,v.height/2,true);return;
      }
      if (["+","=","-","_"].includes(event.key)) {
        event.preventDefault(); zoomCentered(["+","="].includes(event.key)?1.3:1/1.3);return;
      }
      if (!event.key.startsWith("Arrow")) return;
      event.preventDefault();
      const middle = pointAt(baseView().width / 2, baseView().height / 2);
      const next = pointAt(baseView().width / 2 + ({ ArrowLeft: -80, ArrowRight: 80 }[event.key] || 0), baseView().height / 2 + ({ ArrowUp: -80, ArrowDown: 80 }[event.key] || 0));
      shiftFocus(next,middle);
    });
    function resizeDetail(){
      if (!active) return;
      stopZoom();
      cancelAnimationFrame(resizeFrame);
      resizeFrame=requestAnimationFrame(() => {
        resizeFrame=0;if (!active) return;
        if(feature&&featureCenter){
          const info=host.scene()?.featureInfo(feature);
          if(info){
            const ratio=info.size/featureSize;
            for(const a of ['x','y','z']){
              focus[a]=info.point[a]+(focus[a]-featureCenter[a])*ratio;
              for(const lens of lenses)if(lens.point.feature===feature)lens.point[a]=info.point[a]+(lens.point[a]-featureCenter[a])*ratio;
            }
            featureCenter={...info.point};featureSize=info.size;
          }
        }
        if (!moving) {
          zoom = zoom<=minimumZoom()*(1+1e-7)?minimumZoom():Math.max(minimumZoom(),targetZoom()*magnification);
          magnification = zoom/targetZoom();
        }
        draw();
      });
    }
    window.addEventListener('resize',resizeDetail);
    document.addEventListener('nire-scene-resize',resizeDetail);
    document.addEventListener("nire-scene-lost", () => { if (active) { draw(); } });
    document.addEventListener('click',event=>{
      if(active&&lenses.length&&!surface.contains(event.target))dismiss();
    },true);

    function overviewPinchState(){
      const [a,b]=[...overviewPointers.values()];
      return{x:(a.x+b.x)/2,y:(a.y+b.y)/2,distance:Math.hypot(a.x-b.x,a.y-b.y)};
    }
    start.addEventListener('pointerdown',event=>{
      if(active||event.button!==0||!host.scene()?.modelVisible())return;
      event.preventDefault();stopZoom();holdInteraction();
      if(!overviewPointers.size)suppressClickUntil=0;
      overviewPointers.set(event.pointerId,{x:event.clientX,y:event.clientY,startX:event.clientX,startY:event.clientY,moved:false});
      start.setPointerCapture(event.pointerId);
      if(overviewPointers.size>1){overviewPinch=overviewPinchState();suppressClickUntil=performance.now()+800;}
    });
    start.addEventListener('pointermove',event=>{
      const pointer=overviewPointers.get(event.pointerId);if(!pointer||active)return;
      const dx=event.clientX-pointer.x,dy=event.clientY-pointer.y;
      pointer.x=event.clientX;pointer.y=event.clientY;
      if(overviewPointers.size>1){
        const next=overviewPinchState();
        if(overviewPinch&&overviewPinch.distance>4){
          host.scene().zoomOverview(next.distance/overviewPinch.distance,next.x,next.y);
          host.scene().panOverview(next.x-overviewPinch.x,next.y-overviewPinch.y);
        }
        overviewPinch=next;suppressClickUntil=performance.now()+800;return;
      }
      if(!pointer.moved&&Math.hypot(pointer.x-pointer.startX,pointer.y-pointer.startY)<5)return;
      pointer.moved=true;suppressClickUntil=performance.now()+800;start.style.cursor=host.scene().overviewZoom()>1?'grabbing':'default';
      host.scene().panOverview(dx,dy);
    });
    const releaseOverview=event=>{
      const pointer=overviewPointers.get(event.pointerId);
      if(pointer?.moved||overviewPointers.size>1)suppressClickUntil=performance.now()+500;
      overviewPointers.delete(event.pointerId);overviewPinch=null;
      if(!overviewPointers.size){start.style.cursor=host.scene()?.overviewZoom()>1?'grab':'default';releaseInteraction();}
    };
    start.addEventListener('pointerup',releaseOverview);
    start.addEventListener('pointercancel',releaseOverview);
    start.addEventListener('lostpointercapture',releaseOverview);
    start.addEventListener('keydown',event=>{
      if(active||!host.scene()?.modelVisible())return;
      if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(event.key)){
        event.preventDefault();holdInteraction();
        const dx=event.key==='ArrowLeft' ? 80 : event.key==='ArrowRight' ? -80 : 0;
        const dy=event.key==='ArrowUp' ? 80 : event.key==='ArrowDown' ? -80 : 0;
        host.scene().panOverview(dx,dy);releaseInteraction();
      }else if(['+','=','-','_'].includes(event.key)){
        event.preventDefault();queueZoom(['+','='].includes(event.key) ? .25 : -.25,baseView().width/2,baseView().height/2);
      }
    });
    return { hitTest, open, close, reset, dismiss,
      isDragging:()=>overviewPointers.size>0,
      consumeClick(){const consume=performance.now()<suppressClickUntil;suppressClickUntil=0;return consume;}
    };
  };
}());
