(function(){
  "use strict";
  const limit=12,storageKey="ec-nire-element-draft-v1";
  const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
  const uuid=()=>{
    if(crypto.randomUUID)return crypto.randomUUID();
    const bytes=crypto.getRandomValues(new Uint8Array(16));bytes[6]=(bytes[6]&15)|64;bytes[8]=(bytes[8]&63)|128;
    const hex=Array.from(bytes,n=>n.toString(16).padStart(2,'0')).join('');
    return [hex.slice(0,8),hex.slice(8,12),hex.slice(12,16),hex.slice(16,20),hex.slice(20)].join('-');
  };
  window.createNireCommunity=function(host){
    const root=document.getElementById("nire-community");
    root.innerHTML=[
      '<section class="nire-element-editor" aria-label="Sumá tu elemento al ñire" data-element-label="title">',
      '<div class="nire-element-top"><button type="button" data-action="cancel" data-element-copy="back">← Volver al ñire</button></div>',
      '<div class="nire-element-tools" role="group" aria-label="Herramientas">',
      '<button type="button" class="nire-element-pencil" aria-pressed="true" data-element-label="pencil" aria-label="Lápiz"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 15 10-10 4 4L9 19l-5 1zM13 7l4 4"/></svg></button>',
      '<label class="nire-element-material"><span data-element-copy="material">Material</span><select id="nire-element-material"><option value="mineral" data-element-copy="mineral">Mineral</option><option value="porcelain" data-element-copy="porcelain">Porcelana</option><option value="glass" data-element-copy="glass">Cristal</option></select></label>',
      '<label class="nire-element-color"><input type="color" id="nire-element-color" value="#ed75ac" aria-label="Color del elemento"><span data-element-copy="color">Color</span></label>',
      '<span class="nire-element-tool-space"></span><button type="button" class="nire-element-icon" data-action="undo" data-element-label="undo" aria-label="Deshacer" disabled><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 5-5 5 5 5M4 10h10a6 6 0 0 1 0 12" transform="translate(0 -2)"/></svg></button><button type="button" class="nire-element-icon" data-action="clear" data-element-label="clear" aria-label="Borrar" disabled><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M9 7V4h6v3M6 7l1 14h10l1-14M10 11v6m4-6v6"/></svg></button></div>',
      '<div class="nire-element-panes"><section class="nire-element-pane"><h3>DRAW</h3><canvas id="nire-element-draw" tabindex="0" aria-label="Dibujá tu elemento"></canvas><p class="nire-element-empty" id="nire-element-draw-empty" data-element-copy="drawHint">Dibujá algo que pueda crecer acá.</p></section>',
      '<section class="nire-element-pane"><h3>VIEW</h3><canvas id="nire-element-view" tabindex="0" aria-label="Vista 3D del elemento"></canvas><p class="nire-element-empty" id="nire-element-view-empty" data-element-copy="viewHint">Tu trazo toma forma.</p><p class="nire-element-orbit" id="nire-element-orbit" data-element-copy="orbit" hidden>Arrastrá para girar. Acercá con el trackpad.</p></section></div>',
      '<div class="nire-element-story"><div><label for="nire-element-text" data-element-copy="textLabel">Mensaje</label><p id="nire-element-text-hint" data-element-copy="textHint">Se lee al tocar tu elemento en el ñire.</p></div><textarea id="nire-element-text" rows="2" maxlength="240" aria-describedby="nire-element-text-hint nire-element-text-count"></textarea><output id="nire-element-text-count" for="nire-element-text">0/240</output></div>',
      '<div class="nire-element-footer"><p id="nire-element-help" data-element-copy="hint">Levantá el lápiz para ver tu elemento en 3D.</p><button type="button" class="nire-element-primary" data-action="place" data-element-copy="add" disabled>AGREGAR AL ÑIRE</button></div></section>',
      '<section class="nire-element-placement" hidden aria-label="Ubicar tu elemento"><div id="nire-element-placement-surface" tabindex="0" role="region"></div>',
      '<button type="button" class="nire-element-edit-again" data-action="edit" data-element-copy="edit">← Volver al dibujo</button>',
      '<div class="nire-element-placement-actions"><p id="nire-element-placement-hint" data-element-copy="placeHint">Tocá una parte del ñire para elegir dónde va a crecer.</p><label class="nire-element-size" for="nire-element-scale"><span data-element-copy="size">Tamaño</span><output id="nire-element-scale-value" for="nire-element-scale">100%</output><input type="range" id="nire-element-scale" min="25" max="200" step="5" value="100"></label><button type="button" class="nire-element-primary" data-action="apply" disabled>APPLY</button></div></section>',
      '<p class="nire-element-message" id="nire-element-message" role="status" aria-live="polite"></p>'
    ].join("");
    const $=s=>root.querySelector(s),editor=$(".nire-element-editor"),placement=$(".nire-element-placement");
    const drawCanvas=$("#nire-element-draw"),ctx=drawCanvas.getContext("2d"),viewCanvas=$("#nire-element-view");
    let preview;try{preview=window.createNireElementPreview(viewCanvas);}catch(_){preview=null;}
    const surface=$("#nire-element-placement-surface"),material=$("#nire-element-material"),color=$("#nire-element-color"),message=$("#nire-element-message");
    const note=$("#nire-element-text"),noteCount=$("#nire-element-text-count"),size=$("#nire-element-scale"),sizeValue=$("#nire-element-scale-value");
    const add=$('[data-action="place"]'),apply=$('[data-action="apply"]'),undo=$('[data-action="undo"]'),clear=$('[data-action="clear"]');
    const elements=new Map(),origin=window.NireCommunityConfig?.apiOrigin?.replace(/\/$/,"");
    const local=["localhost","127.0.0.1","[::1]"].includes(location.hostname),endpoint=origin?origin+"/api/nire/elements":local?"/api/nire/elements":null;
    let cursor=0,loading=false,mode="closed",strokes=[],stroke=null,draftId=uuid(),choice=null,target=null,saving=false,failedSave=false,session=0;
    let drawPointer=null,placePointers=new Map(),placeDrag=null,placePinch=null,keyboardPoint=null,renderFrame=0,noticeTimer=0,loadError=false;
    const copy={
      es:{title:"SUMÁ TU ELEMENTO AL ÑIRE",back:"← Volver al ñire",size:"Tamaño",textLabel:"Mensaje",textHint:"Se lee al tocar tu elemento en el ñire.",textPlaceholder:"¿Qué querés que cuente tu elemento?",pencil:"Lápiz",material:"Material",mineral:"Mineral",porcelain:"Porcelana",glass:"Cristal",color:"Color",undo:"Deshacer",clear:"Borrar",drawHint:"Dibujá algo que pueda crecer acá.",viewHint:"Tu silueta toma volumen.",orbit:"Arrastrá para girar. Acercá con el trackpad.",hint:"Cerrá una forma y levantá el lápiz para verla con volumen.",add:"AGREGAR AL ÑIRE",edit:"← Volver al dibujo",placeHint:"Tocá una parte del ñire para elegir dónde va a crecer.",chosen:"Este es su lugar. Podés tocar otra parte antes de aplicar.",miss:"Elegí un lugar sobre el ñire.",limit:"Un elemento, hasta 12 trazos. Podés deshacer y seguir probando.",saved:"Tu elemento ya es parte del ñire.",saving:"GUARDANDO…",error:"No se pudo guardar. Tu elemento sigue acá; podés volver a intentar.",offline:"Sin conexión. Podés volver a intentar sin salir del editor.",unconfigured:"Los aportes compartidos todavía no están habilitados en esta versión.",unavailable:"La vista 3D no está disponible en este navegador.",daily:"Por hoy ya sumaste muchos elementos. Podés volver mañana.",drawLabel:"Dibujá tu elemento. Deshacé con Control o Comando y Z.",viewLabel:"Vista 3D. Arrastrá para girar y usá el trackpad para acercarte y alejarte. Las flechas giran y las teclas más y menos ajustan el zoom. Para desplazarte después de acercarte, mantené Shift mientras arrastrás o usás las flechas.",placeLabel:"Elegí un lugar sobre el ñire. Arrastrá para recorrer y usá el trackpad para acercarte. También podés mover el cursor con las flechas y elegir con Enter.",loading:"Estamos conectando con el ñire compartido…"},
      en:{title:"ADD YOUR ELEMENT TO THE ÑIRE",back:"← Back to the ñire",size:"Size",textLabel:"Message",textHint:"Read it by touching your element in the ñire.",textPlaceholder:"What would you like your element to say?",pencil:"Pencil",material:"Material",mineral:"Mineral",porcelain:"Porcelain",glass:"Glass",color:"Color",undo:"Undo",clear:"Clear",drawHint:"Draw something that could grow here.",viewHint:"Your outline becomes a solid.",orbit:"Drag to rotate. Zoom with your trackpad.",hint:"Close a shape and lift your pencil to see its volume.",add:"ADD TO THE ÑIRE",edit:"← Back to drawing",placeHint:"Tap a part of the ñire to choose where it will grow.",chosen:"This is its place. You can choose another spot before applying.",miss:"Choose a place on the ñire.",limit:"One element, up to 12 strokes. Undo and keep experimenting.",saved:"Your element is now part of the ñire.",saving:"SAVING…",error:"Could not save. Your element is still here; you can try again.",offline:"You’re offline. You can try again without leaving the editor.",unconfigured:"Shared contributions are not enabled in this version yet.",unavailable:"The 3D view is unavailable in this browser.",daily:"You’ve added many elements today. Come back tomorrow.",drawLabel:"Draw your element. Undo with Control or Command and Z.",viewLabel:"3D view. Drag to rotate and use your trackpad to zoom in and out. Arrow keys rotate; plus and minus adjust zoom. To pan after zooming in, hold Shift while dragging or using the arrow keys.",placeLabel:"Choose a spot on the ñire. Drag to explore and use your trackpad to zoom. You can also move with the arrow keys and choose with Enter.",loading:"Connecting to the shared ñire…"}
    };
    const t=k=>copy[document.documentElement.lang==="en"?"en":"es"][k]||k;
    function notify(key,sticky=false){clearTimeout(noticeTimer);message.textContent=t(key);message.hidden=false;if(!sticky)noticeTimer=setTimeout(()=>{message.hidden=true;},5000);}
    function localize(){
      root.setAttribute('aria-label',t('title'));
      root.querySelectorAll("[data-element-copy]").forEach(n=>{n.textContent=t(n.dataset.elementCopy);});
      root.querySelectorAll("[data-element-label]").forEach(n=>n.setAttribute("aria-label",t(n.dataset.elementLabel)));
      drawCanvas.setAttribute("aria-label",t("drawLabel"));viewCanvas.setAttribute("aria-label",t("viewLabel"));surface.setAttribute("aria-label",t("placeLabel"));color.setAttribute("aria-label",t("color"));
      note.placeholder=t("textPlaceholder");size.setAttribute("aria-label",t("size"));
      if(choice)$("#nire-element-placement-hint").textContent=t(endpoint?"chosen":"unconfigured");
    }
    function draft(){const text=note.value.trim();return {version:1,id:draftId,strokes,material:material.value,color:color.value,...(text?{message:text}:{})};}
    function saveChanged(){draftId=uuid();failedSave=false;update();}
    function drawingSpace(){
      // Use the whole pane, with one shared unit for both axes so a circle
      // keeps its proportions when its outline becomes a 3D body.
      const r=drawCanvas.getBoundingClientRect(),side=Math.max(1,r.width,r.height);
      return {width:r.width,height:r.height,side,left:(r.width-side)/2,top:(r.height-side)/2};
    }
    function paint(){
      renderFrame=0;const box=drawingSpace(),dpr=Math.min(devicePixelRatio||1,2);
      drawCanvas.width=Math.max(1,Math.round(box.width*dpr));drawCanvas.height=Math.max(1,Math.round(box.height*dpr));ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,box.width,box.height);
      ctx.strokeStyle=color.value;ctx.lineWidth=2.2;ctx.lineCap=ctx.lineJoin="round";
      for(const path of [...strokes,...(stroke?[stroke]:[])]){ctx.beginPath();path.forEach((p,i)=>{const x=box.left+p[0]*box.side,y=box.top+p[1]*box.side;i?ctx.lineTo(x,y):ctx.moveTo(x,y);});ctx.stroke();}
    }
    function schedule(){if(!renderFrame)renderFrame=requestAnimationFrame(paint);}
    function update(){
      const empty=!strokes.length;
      $("#nire-element-draw-empty").hidden=!empty||Boolean(stroke);$("#nire-element-view-empty").hidden=!empty;$("#nire-element-orbit").hidden=empty;
      add.disabled=empty||!preview?.available();undo.disabled=clear.disabled=empty;preview?.set(empty?null:draft());schedule();
      root.dataset.strokes=String(strokes.length);root.dataset.mode=mode;
      noteCount.textContent=note.value.length+"/240";sizeValue.textContent=size.value+"%";size.setAttribute("aria-valuetext",size.value+"%");
    }
    function resetEditor(){
      session++;
      const pointer=drawPointer,pointers=[...placePointers.keys()];
      strokes=[];stroke=null;drawPointer=null;placePointers.clear();placeDrag=placePinch=keyboardPoint=choice=target=null;
      if(pointer!==null&&drawCanvas.hasPointerCapture(pointer))drawCanvas.releasePointerCapture(pointer);
      for(const id of pointers)if(surface.hasPointerCapture(id))surface.releasePointerCapture(id);
      draftId=uuid();saving=failedSave=false;note.value="";material.value="mineral";color.value="#ed75ac";size.value="100";
      apply.disabled=true;apply.textContent="APPLY";size.disabled=false;$('[data-action="edit"]').disabled=false;
      clearTimeout(noticeTimer);message.hidden=true;message.textContent="";
      $("#nire-element-placement-hint").textContent=t(endpoint?"placeHint":"unconfigured");
      try{localStorage.removeItem(storageKey);}catch(_){}
      ctx.clearRect(0,0,drawCanvas.width,drawCanvas.height);preview?.reset();update();
    }
    function point(e){
      const r=drawCanvas.getBoundingClientRect(),box=drawingSpace();
      const x=clamp(e.clientX-r.left,0,box.width),y=clamp(e.clientY-r.top,0,box.height);
      return [(x-box.left)/box.side,(y-box.top)/box.side];
    }
    drawCanvas.addEventListener("pointerdown",e=>{
      if(mode!=="draw"||e.button!==0||drawPointer!==null)return;
      if(strokes.length>=limit){notify("limit");return;}
      e.preventDefault();drawPointer=e.pointerId;drawCanvas.setPointerCapture(e.pointerId);stroke=[point(e)];$("#nire-element-draw-empty").hidden=true;schedule();
    });
    drawCanvas.addEventListener("pointermove",e=>{
      if(e.pointerId!==drawPointer||!stroke)return;
      for(const event of e.getCoalescedEvents?.().length?e.getCoalescedEvents():[e]){
        const p=point(event),last=stroke.at(-1);if(Math.hypot(p[0]-last[0],p[1]-last[1])>.002)stroke.push(p);
      }schedule();
    });
    function finish(e){
      if(e.pointerId!==drawPointer||!stroke)return;
      if(e.type!=="pointercancel"){
        stroke.push(point(e));
        if(stroke.length>120){const source=stroke;stroke=Array.from({length:120},(_,i)=>source[Math.round(i*(source.length-1)/119)]);}
        if(Math.hypot(stroke[0][0]-stroke.at(-1)[0],stroke[0][1]-stroke.at(-1)[1])<.0001&&stroke.length===2)stroke[1]=[clamp(stroke[0][0]+.004,0,1),stroke[0][1]];
        stroke=stroke.map(p=>p.map(n=>Math.round(n*100000)/100000));
        strokes.push(stroke);draftId=uuid();failedSave=false;
      }
      stroke=null;drawPointer=null;update();
    }
    drawCanvas.addEventListener("pointerup",finish);drawCanvas.addEventListener("pointercancel",finish);drawCanvas.addEventListener("lostpointercapture",e=>{if(drawPointer===e.pointerId){drawPointer=null;stroke=null;update();}});
    function undoStroke(){if(mode!=="draw"||!strokes.length)return;strokes.pop();saveChanged();}
    undo.addEventListener("click",undoStroke);clear.addEventListener("click",()=>{strokes=[];saveChanged();});
    drawCanvas.addEventListener("keydown",e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==="z"){e.preventDefault();undoStroke();}});
    material.addEventListener("change",saveChanged);color.addEventListener("input",saveChanged);
    note.addEventListener("input",saveChanged);
    const stage=()=>host.scene();
    function sceneElements(){stage()?.setElements(Array.from(elements.values()));}
    async function load(){
      if(!endpoint||loading)return;
      loading=true;try{
        let more=true;
        while(more){
          const response=await fetch(endpoint+"?after="+cursor,{cache:"no-store",signal:AbortSignal.timeout(15000)});if(!response.ok)throw Error("Unavailable");
          const data=await response.json();if(!Array.isArray(data.elements)||!Number.isSafeInteger(data.cursor)||data.cursor<cursor)throw Error("Invalid response");
          for(const e of data.elements)elements.set(e.id,e);
          const next=data.cursor;more=Boolean(data.hasMore)&&next>cursor;cursor=next;
        }
        loadError=false;sceneElements();
      }catch(_){loadError=true;}finally{loading=false;}
    }
    function open(){
      if(mode!=="closed")return;
      clearTimeout(noticeTimer);
      root.hidden=false;editor.hidden=false;placement.hidden=true;mode="draw";root.dataset.mode=mode;message.hidden=true;
      document.body.classList.add("nire-element-editor-open");host.enter();update();preview?.update();
      if(!preview?.available())notify("unavailable",true);else if(!endpoint)notify("unconfigured",true);drawCanvas.focus({preventScroll:true});load();
    }
    function close(saved=false,force=false){
      if(saving&&!force)return;
      stage()?.previewElement(null);mode="closed";root.dataset.mode=mode;root.hidden=true;document.body.classList.remove("nire-element-editor-open","nire-element-placing");
      resetEditor();host.exit();if(saved){root.hidden=false;editor.hidden=placement.hidden=true;notify("saved");clearTimeout(noticeTimer);noticeTimer=setTimeout(()=>{if(mode==="closed"){root.hidden=true;message.hidden=true;}},5000);}
    }
    $('[data-action="cancel"]').addEventListener("click",()=>close());
    function placementBasis(){
      const v=stage().view(),c=Math.cos(v.angle),s=Math.sin(v.angle),ct=Math.cos(v.tilt),st=Math.sin(v.tilt);
      // Inverse camera rotation: the drawing faces the visitor at its chosen spot.
      return [c,0,s,s*st,ct,-c*st,-s*ct,st,c*ct];
    }
    function placementAt(hit,basis){
      const scale=.09*Number(size.value)/100,anchor={x:hit.x,y:hit.y,z:hit.z||0};
      const points=strokes.flat(),xs=points.map(p=>p[0]),ys=points.map(p=>p[1]);
      const height=Math.max(...ys)-Math.min(...ys),width=Math.max(...xs)-Math.min(...xs);
      const bounds=preview?.bounds(),base=Number.isFinite(bounds?.min[1])?-bounds.min[1]:height/Math.max(width,height,.12)/2+.013;
      const rise=base*scale*1600;
      // Let the lowest part of the element grow from the selected surface.
      anchor.x+=basis[3]*rise;anchor.y-=basis[4]*rise;anchor.z+=basis[5]*rise;
      anchor.x+=basis[6]*5;anchor.y-=basis[7]*5;anchor.z+=basis[8]*5;
      return {anchor,basis,scale};
    }
    function choose(x,y,commit=true){
      const hit=stage()?.pickPoint(x,y,28);if(!hit)return false;
      target={hit:{x:hit.x,y:hit.y,z:hit.z||0},basis:placementBasis()};
      const p=placementAt(target.hit,target.basis);
      if(commit){choice=p;apply.disabled=!endpoint;saving=false;$("#nire-element-placement-hint").textContent=t(endpoint?"chosen":"unconfigured");}
      stage().previewElement({...draft(),placement:p,opacity:commit?1:.65});return true;
    }
    size.addEventListener("input",()=>{
      if(saving)return;
      sizeValue.textContent=size.value+"%";size.setAttribute("aria-valuetext",size.value+"%");draftId=uuid();failedSave=false;
      if(mode==="place"&&target){
        const p=placementAt(target.hit,target.basis);if(choice)choice=p;
        stage()?.previewElement({...draft(),placement:p,opacity:choice?1:.65});
      }
    });
    add.addEventListener("click",()=>{
      if(!strokes.length||!preview?.available())return;
      if(!stage()){notify('unavailable',true);return;}
      choice=target=null;mode="place";root.dataset.mode=mode;editor.hidden=true;placement.hidden=false;apply.disabled=true;message.hidden=true;
      document.body.classList.remove("nire-element-editor-open");document.body.classList.add("nire-element-placing");
      stage().resetOverview();stage().hold(true);stage().previewElement(null);$("#nire-element-placement-hint").textContent=t(endpoint?"placeHint":"unconfigured");
      surface.focus({preventScroll:true});load();
    });
    $('[data-action="edit"]').addEventListener("click",()=>{
      if(saving)return;stage()?.previewElement(null);choice=target=null;mode="draw";root.dataset.mode=mode;editor.hidden=false;placement.hidden=true;
      document.body.classList.add("nire-element-editor-open");document.body.classList.remove("nire-element-placing");update();drawCanvas.focus({preventScroll:true});
    });
    surface.addEventListener("pointerdown",e=>{
      if(mode!=="place"||saving||e.button!==0)return;e.preventDefault();surface.setPointerCapture(e.pointerId);
      placePointers.set(e.pointerId,{x:e.clientX,y:e.clientY});placeDrag={id:e.pointerId,x:e.clientX,y:e.clientY,total:0};
      if(placePointers.size===2){const [a,b]=[...placePointers.values()];placePinch={distance:Math.hypot(a.x-b.x,a.y-b.y),x:(a.x+b.x)/2,y:(a.y+b.y)/2};}
    });
    surface.addEventListener("pointermove",e=>{
      if(mode!=="place"||saving)return;
      if(!placePointers.has(e.pointerId)){if(!choice&&e.pointerType==="mouse"){if(!choose(e.clientX,e.clientY,false))stage()?.previewElement(null);}return;}
      placePointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
      if(placePointers.size===2){
        const [a,b]=[...placePointers.values()],distance=Math.hypot(a.x-b.x,a.y-b.y),x=(a.x+b.x)/2,y=(a.y+b.y)/2;
        if(placePinch){stage().zoomOverview(distance/Math.max(1,placePinch.distance),x,y);stage().panOverview(x-placePinch.x,y-placePinch.y);}placePinch={distance,x,y};if(placeDrag)placeDrag.total=100;return;
      }
      if(placeDrag?.id===e.pointerId){
        const dx=e.clientX-placeDrag.x,dy=e.clientY-placeDrag.y;placeDrag.total+=Math.hypot(dx,dy);
        if(placeDrag.total>5)stage().panOverview(dx,dy);placeDrag.x=e.clientX;placeDrag.y=e.clientY;
      }
    });
    function release(e){
      if(!placePointers.has(e.pointerId))return;
      if(e.type==="pointerup"&&placeDrag?.id===e.pointerId&&placeDrag.total<6&&!placePinch){if(!choose(e.clientX,e.clientY))notify("miss");}
      placePointers.delete(e.pointerId);placePinch=null;
      if(!placePointers.size)placeDrag=null;else{const [id,p]=placePointers.entries().next().value;placeDrag={id,x:p.x,y:p.y,total:100};}
    }
    surface.addEventListener("pointerup",release);surface.addEventListener("pointercancel",release);surface.addEventListener("lostpointercapture",release);
    surface.addEventListener("wheel",e=>{
      if(mode!=="place"||saving)return;e.preventDefault();
      if(Math.abs(e.deltaX)>Math.abs(e.deltaY)&&!e.ctrlKey)stage().panOverview(-e.deltaX,0);
      else stage().zoomOverview(Math.exp(clamp(-e.deltaY*(e.ctrlKey ? .008 : .0025),-.65,.65)),e.clientX,e.clientY);
    },{passive:false});
    surface.addEventListener("keydown",e=>{
      if(mode!=="place"||saving)return;
      if(e.key.startsWith("Arrow")){
        e.preventDefault();keyboardPoint||={x:innerWidth/2,y:innerHeight/2};const d=e.shiftKey?50:12;if(e.key==="ArrowLeft")keyboardPoint.x-=d;if(e.key==="ArrowRight")keyboardPoint.x+=d;if(e.key==="ArrowUp")keyboardPoint.y-=d;if(e.key==="ArrowDown")keyboardPoint.y+=d;choose(keyboardPoint.x,keyboardPoint.y);
      }else if(e.key==="Enter"||e.key===" "){e.preventDefault();const p=keyboardPoint||{x:innerWidth/2,y:innerHeight/2};if(!choose(p.x,p.y))notify("miss");}
    });
    apply.addEventListener("click",async()=>{
      if(!choice||saving||!endpoint)return;
      if(!navigator.onLine){notify("offline",true);return;}
      saving=true;apply.disabled=true;size.disabled=true;apply.textContent=t("saving");$('[data-action="edit"]').disabled=true;
      const payload={...draft(),placement:choice},savingSession=session;
      try{
        const response=await fetch(endpoint,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload),signal:AbortSignal.timeout(15000)});
        if(!response.ok){const error=new Error(response.status===429?"daily":"error");throw error;}
        const data=await response.json();if(!data.element||data.element.id!==payload.id)throw Error("error");
        elements.set(data.element.id,data.element);sceneElements();
        if(session===savingSession){saving=false;close(true);}load();
      }catch(error){if(session===savingSession){failedSave=true;saving=false;apply.disabled=false;notify(error.message==="daily"?"daily":"error",true);}}
      finally{if(session===savingSession){apply.textContent="APPLY";size.disabled=false;$('[data-action="edit"]').disabled=false;}}
    });
    document.addEventListener("keydown",e=>{
      if(e.key==="Escape"&&mode!=="closed"&&!saving){e.preventDefault();if(mode==="place")$('[data-action="edit"]').click();else close();}
    });
    window.addEventListener("online",()=>{load();if(failedSave&&mode==="place")notify("chosen");});
    window.addEventListener("pagehide",()=>{if(mode!=="closed")close(false,true);else resetEditor();});
    window.addEventListener("focus",load);setInterval(()=>{if(!document.hidden)load();},30000);
    document.addEventListener("nire-appearance-change",schedule);new MutationObserver(localize).observe(document.documentElement,{attributes:true,attributeFilter:["lang"]});
    new ResizeObserver(()=>{if(mode==="draw"){schedule();preview?.update();}}).observe(drawCanvas);
    localize();resetEditor();load();
    return {open,active:()=>mode!=="closed",placing:()=>mode==="place",refresh:load,count:()=>elements.size};
  };
}());
