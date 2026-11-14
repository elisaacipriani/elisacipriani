(function(){
  'use strict';
  const $=s=>document.querySelector(s),baseItems=window.NireArchiveItems||[],shared=new Map();
  const labels={
    es:{spaceTitle:'Centro de experimentación e intercambio',spaceIntroduction:'Así imagino el diseño: una convivencia entre investigación, discusión, experimentación y comunicación. Un espacio para compartir preguntas, explorar elementos y aprender haciendo.',all:'Todo',alphabetLabel:'Filtrar por letra',readEntry:'Leer la ficha',entryLabel:'Ficha del objeto',referencesLabel:'Referencias visuales',references:'Referencias',reserved:'Por incorporar',objects:'objetos',object:'objeto',skip:'Ir a la colección',indexTitle:'Colección',enter:'Abrir la colección',drawingAlt:'Dibujo de Elisa Cipriani',backHome:'Volver al inicio',backArchive:'← Volver a la colección',collectionOptions:'Opciones de la colección',chance:'Abrir al azar',addPiece:'Sumar una pieza',empty:'Esta parte de la colección todavía está en blanco.',connections:'Se encuentra con',respond:'Sumar una asociación',newEntry:'UNA NUEVA FICHA',composerTitle:'Una pieza para conservar.',composerIntro:'Una imagen, un trazo, una palabra. Armá una estampita y contá por qué merece un lugar en esta colección.',image:'Imagen',imageSize:'Tamaño de imagen',removeImage:'Quitar imagen',stampHint:'El rectángulo es tu papel. Podés combinar una imagen propia, dibujo y una palabra.',pieceName:'Nombre de la pieza',pieceWord:'Una palabra para tu estampita',pieceStory:'Su pequeña historia',storyHint:'Algo que encontraste, recordaste, leíste o imaginaste.',pieceOrigin:'Se encuentra con',pieceAuthor:'Tu nombre (opcional)',savePiece:'Conservar en el archivo ↗',download:'Descargar estampita',publishHint:'Tu pieza y tu texto se suman a la colección compartida.',footer:'UN ARCHIVO EN CONSTRUCCIÓN. UNA COLECCIÓN QUE CONTINÚA.',indexLink:'ÍNDICE ↗',free:'Una asociación libre',piece:'pieza',pieces:'piezas',contribution:'Aporte a la colección',anonymous:'Sin firma',saved:'Tu pieza ya forma parte de la colección.',saving:'Conservando…',unconfigured:'La conservación compartida todavía no está habilitada en la web pública. Podés descargar tu estampita.',offline:'No hay conexión. Tu pieza sigue acá mientras permanecés en esta página.',saveError:'No se pudo conservar la pieza. Sigue acá para que vuelvas a intentarlo.',daily:'Por hoy ya se sumaron muchos aportes. Podés volver mañana.',artRequired:'Agregá una imagen o hacé un trazo para crear tu estampita.',imageError:'Elegí una imagen JPG, PNG o WebP de hasta 20 MB.',loading:'Conectando con la colección compartida…',loadError:'Los aportes compartidos no se pudieron cargar. Podés seguir recorriendo la colección.',stampLabel:'Tu estampita. Dibujá con el lápiz o seleccioná la flecha para mover la imagen.',draw:'Dibujar',move:'Mover imagen',undo:'Deshacer',clear:'Borrar dibujo',notFound:'Esa ficha todavía no está en la colección.'},
    en:{spaceTitle:'A center for experimentation and exchange',spaceIntroduction:'To me, design is a coexistence of research, discussion, experimentation and communication. A place to share questions, explore elements and learn by doing.',all:'All',alphabetLabel:'Filter by letter',readEntry:'Read the entry',entryLabel:'Object entry',referencesLabel:'Visual references',references:'References',reserved:'To be added',objects:'objects',object:'object',skip:'Skip to the collection',indexTitle:'Collection',enter:'Open the collection',drawingAlt:'Drawing by Elisa Cipriani',backHome:'Back to the entrance',backArchive:'← Back to the collection',collectionOptions:'Collection options',chance:'Open at random',addPiece:'Add a piece',empty:'This part of the collection is still blank.',connections:'Meets with',respond:'Add an association',newEntry:'A NEW ENTRY',composerTitle:'A piece to keep.',composerIntro:'An image, a line, a word. Make a small print and tell us why it deserves a place in this collection.',image:'Image',imageSize:'Image size',removeImage:'Remove image',stampHint:'The rectangle is your paper. Combine your own image, drawing and a word.',pieceName:'Name of the piece',pieceWord:'A word for your print',pieceStory:'Its small story',storyHint:'Something you found, remembered, read or imagined.',pieceOrigin:'Meets with',pieceAuthor:'Your name (optional)',savePiece:'Keep in the archive ↗',download:'Download print',publishHint:'Your piece and text will join the shared collection.',footer:'AN ARCHIVE IN THE MAKING. A COLLECTION THAT CONTINUES.',indexLink:'INDEX ↗',free:'A free association',piece:'piece',pieces:'pieces',contribution:'A contribution to the collection',anonymous:'Unsigned',saved:'Your piece is now part of the collection.',saving:'Keeping…',unconfigured:'Shared storage is not enabled on the public website yet. You can download your print.',offline:'You are offline. Your piece stays here while you remain on this page.',saveError:'The piece could not be saved. It is still here for you to try again.',daily:'Many contributions have already been added today. Come back tomorrow.',artRequired:'Add an image or make a mark to create your print.',imageError:'Choose a JPG, PNG or WebP image up to 20 MB.',loading:'Connecting with the shared collection…',loadError:'Shared contributions could not be loaded. You can still explore the collection.',stampLabel:'Your print. Draw with the pencil or select the arrow to move the image.',draw:'Draw',move:'Move image',undo:'Undo',clear:'Clear drawing',notFound:'This entry is not in the collection yet.'}
  };
  const manifestoCopy={
    es:{
      spaceTitleStart:'Centro de',spaceTitleEnd:'Experimentación e intercambio',
      spaceQuestions:'Un espacio para compartir preguntas',spaceSubjects:'Investigación. Discusión. Experimentación. Comunicación.',
      spaceExchange:'Intercambio',spaceElements:'Fotos, letras y dibujo.',
      spaceCommunication:'La comunicación también es algo que forma parte de este proyecto de arte y diseño.',
      spaceCulture:'Un espacio de intercambio, cultura y diseño, de archivo, de abecedario y de colección.',
      continueCollection:'Continuar a la colección'
    },
    en:{
      spaceTitleStart:'A center for',spaceTitleEnd:'Experimentation and exchange',
      spaceQuestions:'A place to share questions',spaceSubjects:'Research. Discussion. Experimentation. Communication.',
      spaceExchange:'Exchange',spaceElements:'Photographs, letters and drawing.',
      spaceCommunication:'Communication is also part of this art and design project.',
      spaceCulture:'A place for exchange, culture and design, for an archive, an alphabet and a collection.',
      continueCollection:'Continue to the collection'
    }
  };
  const lang=()=>document.documentElement.lang==='en'?'en':'es',t=key=>labels[lang()][key]||manifestoCopy[lang()][key]||key;
  const sequenceLabel=paused=>lang()==='en'?(paused?'Play sequence':'Pause sequence'):(paused?'Reproducir secuencia':'Pausar secuencia');
  function node(tag,cls,text){const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n;}
  function projectParagraph(text,formatting=[]){
    const paragraph=node('p','archive-project-paragraph');let cursor=0;
    const marks=formatting.map(mark=>({...mark,start:text.indexOf(mark.text)})).filter(mark=>mark.text&&mark.start>=0).sort((a,b)=>a.start-b.start);
    for(const mark of marks){
      if(mark.start<cursor)continue;
      paragraph.append(document.createTextNode(text.slice(cursor,mark.start)));
      const formatted=node(['strong','em'].includes(mark.tag)?mark.tag:'span','',mark.text);
      paragraph.append(formatted);
      cursor=mark.start+mark.text.length;
    }
    paragraph.append(document.createTextNode(text.slice(cursor)));return paragraph;
  }
  const origin=window.NireCommunityConfig?.apiOrigin?.replace(/\/$/,'');
  const local=['127.0.0.1','localhost','[::1]'].includes(location.hostname),endpoint=origin?origin+'/api/nire/archive':local?'/api/nire/archive':null;
  let route='home',selected=null,pendingSelection=null,cursor=0,loading=false,loadFailed=false,notice='',entryLetter='',indexScroll=0,previewKey='',previewReturnScroll=0;
  let objectSequence=null;
  // Each portal points to an existing letter in Elisa's writing, not a new heading.
  const letterPortals=[
    ['A','amapola','A veces'],['B','granada','boca'],['C','caballito','caballito'],
    ['D','dargelos','Dargelos'],['E','earrings-peggy-guggenheim','Alexander'],
    ['F','fernanda-laguna','Fernanda'],['G','la-lluvia','Borges'],['H','hermann-finsterlin','Hermann'],
    ['I','primera-piel','piel'],['J','flores-de-mama','jardín'],['K','fuck-me','Fuck'],
    ['L','liquenes','líquenes'],['M','las-metamorfosis','metamorfosis'],['N','angeles-de-mar','nexo'],
    ['Ñ','momento-de-refes','diseño'],['O','la-siesta','Joan'],['P','piedra','playa'],
    ['Q','bateria-popular','que'],['R','remedios-varo','Remedios'],['S','rollo-con-sales','sales'],
    ['T','the-singing-angels','The'],['U','buenos-aires','culpa'],['V','sistema-nervioso','Nervioso'],
    ['W','teatro-anatomico-leiden','Willem'],['X','si-queria','x Joaquín'],['Y','bed-in','Yoko'],
    ['Z','bang-hai-ja','luz']
  ].map(([letter,id,word])=>({letter,id,word}));
  const letterAlphabet=letterPortals.map(p=>p.letter);
  const normalizeLetter=character=>character.toLocaleUpperCase('es').replace(/[ÁÀÄÂ]/g,'A').replace(/[ÉÈËÊ]/g,'E').replace(/[ÍÌÏÎ]/g,'I').replace(/[ÓÒÖÔ]/g,'O').replace(/[ÚÙÜÛ]/g,'U');
  const readingText=c=>[...(c.paragraphs||[]),...(c.sections||[]).flatMap(s=>[...(s.paragraphs||[]),...(s.items||[])]),c.artworkCredit||''].filter(Boolean).join(' ')||c.title||'';
  const hasLetter=(text,letter)=>[...text].some(c=>normalizeLetter(c)===letter);
  const items=()=>[...baseItems,...shared.values()];
  const itemText=item=>item[lang()]||item.es;
  function letterForItem(item){
    if(!item)return '';
    const portal=letterPortals.find(p=>p.id===item.id);if(portal)return portal.letter;
    if(!item.raw)return '';
    const c=itemText(item),first=normalizeLetter(c.word.trim().charAt(0));
    return letterAlphabet.includes(first)&&hasLetter(readingText(c),first)?first:letterAlphabet.find(l=>hasLetter(readingText(c),l))||'';
  }
  function objectHref(id,letter=letterForItem(items().find(i=>i.id===id))){return '#objeto='+encodeURIComponent(id)+(letter?'&letra='+encodeURIComponent(letter):'');}
  const isBrowsing=()=>route==='index'||route==='object';
  const motionPreference=matchMedia('(prefers-reduced-motion: reduce)');
  function stopObjectMedia(){objectSequence?.destroy();objectSequence=null;}
  function paperChannelTable(whitePoint){
    // Normalize the paper color, then roll off highlights before the channel clips.
    const knee=0.83,headroom=1-knee,steps=32;
    return Array.from({length:steps+1},(_,step)=>{
      const level=step/steps*255/whitePoint;
      const tone=level<=knee?level:1-headroom*Math.exp((knee-level)/headroom);
      return tone.toFixed(5);
    }).join(' ');
  }
  function croppedImage(frame){
    const ns='http://www.w3.org/2000/svg';
    const svg=document.createElementNS(ns,'svg'),image=document.createElementNS(ns,'image');
    const [,,width,height]=frame.crop;
    svg.setAttribute('viewBox',frame.crop.join(' '));
    svg.style.width='calc(var(--strip-height) * '+width/height+')';
    svg.setAttribute('role','img');svg.setAttribute('aria-label',frame.alt);
    if(frame.drawing)svg.classList.add('is-drawing');
    image.setAttribute('href',frame.image);
    image.setAttribute('width',frame.width);image.setAttribute('height',frame.height);
    if(frame.transform)image.setAttribute('transform',frame.transform);
    svg.append(image);
    return svg;
  }
  function renderObjectSequence(item,display,content){
    const figure=node('figure','archive-object-sequence archive-object-hero-image'),viewport=node('div','archive-sequence-viewport'),toggle=node('button','archive-sequence-toggle');
    const sources=item.sequence,interval=Math.max(250,Math.min(3000,Number(item.sequenceInterval)||700));
    let position=0,paused=motionPreference.matches,inView=false,timer=null,run=0;
    figure.setAttribute('aria-label',content.sequenceAlt||content.title);figure.dataset.frames=String(sources.length);figure.dataset.frame='1';
    function frame(index){
      const source=sources[index],image=node('img');
      image.src=source.image||item.sequenceBase+source.file;
      image.alt=source[lang()]||source.es||content.sequenceAlt||content.title;
      image.dataset.object=item.id;image.decoding='async';
      return image;
    }
    async function loadFrame(index){const image=frame(index);try{await image.decode();}catch(_){}return image.complete&&image.naturalWidth?image:null;}
    function showFrame(index,image){
      const source=sources[index];
      if(source.whitePoint){
        const channels=document.querySelectorAll('#archive-paper-white feComponentTransfer > *');
        channels.forEach((channel,i)=>channel.setAttribute('tableValues',paperChannelTable(source.whitePoint[i])));
      }
      viewport.replaceChildren(source.crop?croppedImage({...source,image:image.src,alt:image.alt}):image);
      figure.dataset.frame=String(index+1);
    }
    const first=frame(0);first.fetchPriority='high';showFrame(0,first);
    let pending=loadFrame(1%sources.length);
    toggle.type='button';toggle.innerHTML='<svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.2" aria-hidden="true"><g class="archive-sequence-pause"><path d="M5 3v10M11 3v10"/></g><g class="archive-sequence-play"><path d="m5 3 8 5-8 5Z"/></g></svg>';
    function updateToggle(){figure.dataset.paused=String(paused);toggle.setAttribute('aria-pressed',String(paused));toggle.setAttribute('aria-label',sequenceLabel(paused));}
    function active(){return !paused&&inView&&!$('#archive-object-display').inert&&!document.hidden&&isBrowsing()&&selected===item.id&&display.contains(figure);}
    function cancel(){run++;if(timer!==null)clearTimeout(timer);timer=null;}
    async function tick(token){
      if(token!==run||!active())return;
      const image=await pending;
      if(token!==run||!active())return;
      position=(position+1)%sources.length;
      if(image)showFrame(position,image);
      pending=loadFrame((position+1)%sources.length);
      timer=setTimeout(()=>tick(token),interval);
    }
    function sync(){cancel();if(active()){const token=run;timer=setTimeout(()=>tick(token),interval);}}
    toggle.addEventListener('click',()=>{paused=!paused;updateToggle();sync();});
    figure.append(viewport,toggle);display.append(figure);updateToggle();
    const observer=new IntersectionObserver(entries=>{inView=entries[0].isIntersecting;sync();},{threshold:.1});observer.observe(figure);
    objectSequence={sync,destroy(){cancel();observer.disconnect();},motionChanged(){if(motionPreference.matches)paused=true;updateToggle();sync();}};
  }
  function renderObjectVideo(item,display,content){
    const video=node('video','archive-object-hero-image archive-object-video');
    let paused=motionPreference.matches,inView=false,suspended=true,destroyed=false;
    video.controls=false;video.disablePictureInPicture=true;video.loop=true;video.muted=true;video.defaultMuted=true;video.playsInline=true;video.preload='metadata';
    video.width=item.imageWidth;video.height=item.imageHeight;
    video.poster=item.image;video.src=item.video;video.dataset.object=item.id;video.setAttribute('aria-label',content.videoAlt||content.imageAlt||content.title);
    function active(){return inView&&!$('#archive-object-display').inert&&!document.hidden&&isBrowsing()&&selected===item.id&&display.contains(video);}
    function sync(){
      if(destroyed)return;
      if(active()&&!paused){suspended=false;video.play().catch(()=>{});}
      else{suspended=true;video.pause();}
    }
    // The picture itself can be played or paused, including when reduced motion is on.
    video.tabIndex=0;video.setAttribute('role','button');
    const actionLabel=()=>lang()==='en'?(paused?'Play video':'Pause video'):(paused?'Reproducir video':'Pausar video');
    const labelVideo=()=>video.setAttribute('aria-label',actionLabel()+' · '+content.title);
    function togglePlayback(){paused=!paused;labelVideo();sync();}
    video.addEventListener('click',togglePlayback);
    video.addEventListener('keydown',event=>{
      if(event.key==='Enter'||event.key===' '){event.preventDefault();togglePlayback();}
    });
    video.addEventListener('pause',()=>{if(!suspended)paused=true;labelVideo();});
    video.addEventListener('play',()=>{paused=false;labelVideo();});
    labelVideo();
    display.append(video);
    const observer=new IntersectionObserver(entries=>{inView=entries[0].isIntersecting;sync();},{threshold:.1});observer.observe(video);
    objectSequence={sync,destroy(){destroyed=true;suspended=true;observer.disconnect();video.pause();video.removeAttribute('src');video.load();},motionChanged(){if(motionPreference.matches)paused=true;labelVideo();sync();}};
    return video;
  }
  function renderReferences(item,display){
    if(!item.references?.length)return;
    const aside=node('aside','archive-reference-rail');
    aside.setAttribute('aria-label',t('referencesLabel'));
    for(const reference of item.references){
      const copy=reference[lang()]||reference.es;
      const figure=node('figure'),image=node('img'),caption=node('figcaption');
      image.src=reference.image;image.alt=copy.alt;image.decoding='async';
      for(const line of copy.lines||[])caption.append(node('p','',line));
      figure.append(image,caption);aside.append(figure);
    }
    display.append(aside);
  }
  function renderObjectGallery(item,display,content){
    const gallery=node('div','archive-object-gallery'),track=node('div','archive-gallery-track');
    const frames=item.gallery?.length?item.gallery.map(frame=>({...frame,image:(item.galleryBase||'')+frame.file,alt:frame[lang()]||frame.es})):[
      ...(item.image||item.video||item.sequence?.length?[{image:item.image,width:item.imageWidth,height:item.imageHeight,crop:item.imageCrop,video:item.video,sequence:item.sequence,alt:content.videoAlt||content.sequenceAlt||content.imageAlt||content.title,drawing:['original','scan'].includes(item.imageStatus)||/\.svg(?:\?|$)/.test(item.image||'')}]:[])
    ];
    frames.push(...(item.photographs||[]).map(photo=>({...photo,alt:(photo[lang()]||photo.es).alt})),
      ...(item.illustrations||[]).map(drawing=>({...drawing,drawing:true,alt:(drawing[lang()]||drawing.es).alt})));
    const controllers=[];
    gallery.tabIndex=0;gallery.setAttribute('role','region');gallery.setAttribute('aria-label',content.imageAlt||content.title);
    gallery.dataset.frames=String(frames.length);
    for(const [index,frame]of frames.entries()){
      const figure=node('figure','archive-gallery-piece'+(frame.drawing?' is-drawing':'')),media=node('div','archive-gallery-media');
      if(frame.crop){
        media.append(croppedImage(frame));
      }else if(frame.video||frame.sequence?.length){
        const source={...item,...frame};
        if(frame.video)renderObjectVideo(source,media,content);else renderObjectSequence(source,media,content);
        controllers.push(objectSequence);
      }else{
        const image=node('img');image.alt=frame.alt;image.loading='eager';image.decoding='async';image.draggable=false;
        image.dataset.object=item.id;if(index===0)image.fetchPriority='high';image.src=frame.image;media.append(image);
      }
      figure.append(media);
      track.append(figure);
    }
    gallery.append(track);display.append(gallery);renderReferences(item,display);
    objectSequence={sync(){controllers.forEach(c=>c?.sync());},destroy(){controllers.forEach(c=>c?.destroy());},motionChanged(){controllers.forEach(c=>c?.motionChanged());}};
    gallery.addEventListener('keydown',e=>{
      if(e.target!==gallery)return;
      const direction={ArrowLeft:-1,ArrowRight:1}[e.key];
      if(direction||e.key==='Home'||e.key==='End'){
        e.preventDefault();gallery.scrollTo({left:direction?gallery.scrollLeft+direction*gallery.clientWidth*.65:e.key==='Home'?0:gallery.scrollWidth,behavior:motionPreference.matches?'instant':'smooth'});
      }
    });
    let drag=null;
    gallery.addEventListener('pointerdown',e=>{if(e.pointerType!=='mouse'||e.button!==0||e.target.closest('video,button,a'))return;drag={id:e.pointerId,x:e.clientX,left:gallery.scrollLeft};gallery.setPointerCapture(e.pointerId);gallery.classList.add('is-dragging');e.preventDefault();gallery.focus({preventScroll:true});});
    gallery.addEventListener('pointermove',e=>{if(drag?.id===e.pointerId)gallery.scrollLeft=drag.left+drag.x-e.clientX;});
    const release=e=>{if(drag?.id!==e.pointerId)return;drag=null;gallery.classList.remove('is-dragging');if(gallery.hasPointerCapture(e.pointerId))gallery.releasePointerCapture(e.pointerId);};
    gallery.addEventListener('pointerup',release);gallery.addEventListener('pointercancel',release);gallery.addEventListener('lostpointercapture',()=>{drag=null;gallery.classList.remove('is-dragging');});
  }
  function normalizeContribution(raw){
    if(!raw||raw.version!==1||typeof raw.id!=='string'||typeof raw.title!=='string'||typeof raw.text!=='string'||!/^data:image\/(jpeg|png|webp);base64,/.test(raw.image||''))return null;
    const offset=Math.max(0,...baseItems.map(i=>Number(i.number)||0));
    return {id:raw.id,number:String(offset+raw.seq).padStart(2,'0'),image:raw.image,imageStatus:'contribution',sourceId:raw.sourceId||'',related:raw.sourceId?[raw.sourceId]:[],es:{word:raw.title,title:raw.title,medium:raw.author||t('anonymous'),imageNote:raw.author||t('anonymous'),tags:[],paragraphs:raw.text.split(/\n\s*\n/).filter(Boolean)},raw};
  }
  function renderAlphabet(){
    const collection=$('#archive-collection'),all=items();
    collection.setAttribute('aria-label',lang()==='en'?'The collection alphabet':'Abecedario de la colección');
    const buttons=letterPortals.map(portal=>{
      const item=all.find(i=>i.id===portal.id);
      const button=node('button','archive-letter-button');
      button.append(node('span','archive-letter-glyph',portal.letter));
      button.type='button';button.dataset.previewId=portal.id;button.dataset.entryLetter=portal.letter;
      button.setAttribute('aria-label',portal.letter+' — '+(item?itemText(item).title:t('reserved')));
      button.setAttribute('aria-controls','archive-object-view');button.disabled=!item;
      return button;
    });
    collection.replaceChildren(...buttons);
  }
  function renderCollection({refresh=false}={}){
    renderAlphabet();const all=items();
    if(pendingSelection&&all.some(item=>item.id===pendingSelection)){selected=pendingSelection;pendingSelection=null;}
    if(!all.some(item=>item.id===selected))selected=null;
    $('#archive-empty').hidden=Boolean(all.length);
    $('#archive-index-status').textContent=loadFailed?t('loadError'):all.length+' '+t(all.length===1?'object':'objects');
    $('#archive-object-view').hidden=!selected;
    $('.archive-index-preview').hidden=!selected;
    $('.archive-index-aside').hidden=Boolean(selected);
    $('.archive-index-layout').classList.toggle('has-preview',Boolean(selected));
    document.body.classList.toggle('archive-catalogue-open',isBrowsing()&&!selected);
    const nextKey=lang()+':'+selected+':'+entryLetter;
    if(selected&&(refresh||nextKey!==previewKey)){renderObject();$('#archive-object-view').scrollTop=0;$('#archive-object-notes').scrollTop=0;$('.archive-object-visuals').scrollTop=0;previewKey=nextKey;}
    if(!selected){stopObjectMedia();previewKey='';}
  }
  function renderObject(){
    stopObjectMedia();
    const item=items().find(i=>i.id===selected),display=$('#archive-object-display');
    const view=$('#archive-object-view');
    view.dataset.entryId=item?.id||'';
    view.classList.add('has-media-strip');
    display.replaceChildren();display.inert=false;
    if(!item){$('#archive-object-title').textContent=t(loading?'loading':'notFound');display.append(node('p','archive-object-missing',t(loading?'loading':'notFound')));$('#archive-object-folio').textContent='';$('#archive-object-notes').hidden=true;return;}
    entryLetter=entryLetter||letterForItem(item);
    let c=itemText(item);
    // Keep the original quotation if a translated version has no matching glyph (e.g. Ñ).
    if(entryLetter&&!hasLetter(readingText(c),entryLetter)&&hasLetter(readingText(item.es),entryLetter))c=item.es;
    const readingLanguage=c===item.es?'es':lang();
    $('#archive-object-text').lang=readingLanguage;
    $('#archive-object-title').textContent=c.title;$('#archive-object-folio').textContent='[ '+item.number+' / '+String(items().length).padStart(2,'0')+' ]';
    renderObjectGallery(item,display,c);
    $('#archive-object-note-number').textContent='[ '+item.number+' ]';$('#archive-object-note-title').textContent=c.title;$('#archive-object-note-title').hidden=true;
    const author=$('#archive-object-medium');author.textContent=item.raw?.author||c.artworkCredit||'';author.hidden=!author.textContent;
    $('#archive-object-text').replaceChildren(...c.paragraphs.map(text=>projectParagraph(text,item.raw?[]:c.formatting)));
    if(item.poem){
      const poem=node('blockquote','archive-poem');poem.lang='es';
      for(const stanza of item.poem)poem.append(node('p','',stanza));
      $('#archive-object-text').append(poem);
    }
    if(!item.raw)for(const section of c.sections||[]){
      const block=node('section','archive-project-section');
      for(const text of section.paragraphs||[])block.append(projectParagraph(text,c.formatting));
      if(section.items?.length){const list=node('ul');for(const text of section.items)list.append(node('li','',text));block.append(list);}
      $('#archive-object-text').append(block);
    }
    if(entryLetter&&!$('#archive-object-text').textContent&&!c.artworkCredit)$('#archive-object-text').append(projectParagraph(c.title));
    highlightEntryLetter(item);
    const siblings=items().filter(other=>letterForItem(other)===entryLetter);
    if(entryLetter&&siblings.length>1){
      const position=siblings.findIndex(other=>other.id===item.id),navigation=node('nav','archive-letter-siblings');
      navigation.setAttribute('aria-label',lang()==='en'?'More pieces under '+entryLetter:'Más piezas en la '+entryLetter);
      const previous=node('button','','←'),next=node('button','','→');
      for(const [button,offset]of [[previous,-1],[next,1]]){
        const neighbor=siblings[(position+offset+siblings.length)%siblings.length];button.type='button';button.dataset.previewId=neighbor.id;button.dataset.entryLetter=entryLetter;button.setAttribute('aria-label',itemText(neighbor).title);
      }
      navigation.append(previous,node('span','',entryLetter+' · '+(position+1)+' / '+siblings.length),next);$('#archive-object-text').append(navigation);
    }
    $('#archive-object-notes').hidden=false;
  }
  function highlightEntryLetter(item){
    if(!entryLetter)return;
    const preferred=letterPortals.find(p=>p.id===item.id&&p.letter===entryLetter)?.word;
    const roots=[$('#archive-object-text'),$('#archive-object-medium')],candidates=[];
    for(const root of roots){const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);let text;while((text=walker.nextNode()))candidates.push(text);}
    let chosen=null,index=-1;
    if(preferred)for(const text of candidates){
      const start=text.data.toLocaleLowerCase('es').indexOf(preferred.toLocaleLowerCase('es'));if(start<0)continue;
      const offset=[...preferred].findIndex(character=>normalizeLetter(character)===entryLetter);
      if(offset>=0){chosen=text;index=start+offset;break;}
    }
    if(!chosen)for(const text of candidates){
      const offset=[...text.data].findIndex(character=>normalizeLetter(character)===entryLetter);
      if(offset>=0){chosen=text;index=offset;break;}
    }
    if(!chosen)return;
    const character=chosen.splitText(index);character.splitText(1);
    const mark=node('mark','archive-letter-hit',character.data);mark.dataset.letter=entryLetter;character.replaceWith(mark);
  }
  const canvas=$('#archive-stamp'),ctx=canvas.getContext('2d'),form=$('#archive-piece-form');
  const fields={title:$('#archive-piece-name'),word:$('#archive-piece-word'),text:$('#archive-piece-story'),author:$('#archive-piece-author'),sourceId:$('#archive-piece-origin')};
  let paths=[],stroke=null,ink='#151515',tool='draw',photo=null,photoPosition={x:.5,y:.45},pointer=null,dirty=false,saving=false,session=0,draftId=crypto.randomUUID(),paintFrame=0,imageRequest=0;
  const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
  function status(key){notice=key;$('#archive-save-status').textContent=key?t(key):'';}
  function paint(){
    paintFrame=0;ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,600,800);ctx.fillStyle='#fff';ctx.fillRect(0,0,600,800);
    if(photo){const scale=Number($('#archive-image-size').value)/100,fit=Math.min(520/photo.width,610/photo.height)*scale,w=photo.width*fit,h=photo.height*fit;ctx.save();ctx.filter='grayscale(1)';ctx.drawImage(photo,photoPosition.x*600-w/2,photoPosition.y*800-h/2,w,h);ctx.restore();}
    ctx.lineCap=ctx.lineJoin='round';ctx.lineWidth=2.6;
    for(const path of [...paths,...(stroke?[stroke]:[])]){ctx.strokeStyle=path.ink;ctx.beginPath();for(const[p,i]of path.points.map((p,i)=>[p,i]))i?ctx.lineTo(p[0]*600,p[1]*800):ctx.moveTo(p[0]*600,p[1]*800);if(path.points.length===1){const p=path.points[0];ctx.lineTo(p[0]*600+.1,p[1]*800+.1);}ctx.stroke();}
    const word=fields.word.value.trim();if(word){ctx.fillStyle='#151515';ctx.font='300 38px Haas, sans-serif';ctx.fillText(word,35,731,530);}
    ctx.strokeStyle='#151515';ctx.lineWidth=.8;ctx.beginPath();ctx.moveTo(35,758);ctx.lineTo(85,758);ctx.stroke();ctx.fillStyle='#151515';ctx.font='400 12px Haas, Helvetica, Arial, sans-serif';ctx.fillText('COLECCIÓN / ARCHIVO DE OBJETOS',35,780);
    $('#archive-stamp-undo').disabled=!paths.length;$('#archive-stamp-clear').disabled=!paths.length;
  }
  function schedulePaint(){if(!paintFrame)paintFrame=requestAnimationFrame(paint);}
  function changed(){dirty=true;draftId=crypto.randomUUID();status('');schedulePaint();}
  function setTool(value){tool=value;canvas.dataset.tool=value;document.querySelectorAll('[data-stamp-tool]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.stampTool===value)));}
  function releasePointer(){const id=pointer?.id;pointer=null;stroke=null;if(id!==undefined&&canvas.hasPointerCapture(id))canvas.releasePointerCapture(id);}
  function resetComposer(){session++;imageRequest++;releasePointer();paths=[];photo=null;photoPosition={x:.5,y:.45};ink='#151515';dirty=false;saving=false;draftId=crypto.randomUUID();form.reset();status('');form.querySelectorAll('input,textarea,select,button').forEach(n=>n.disabled=false);$('#archive-save').disabled=false;$('#archive-save').textContent=t('savePiece');$('#archive-image-controls').hidden=true;document.querySelectorAll('[data-stamp-ink]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.stampInk===ink)));setTool('draw');schedulePaint();}
  function renderOrigin(){const value=fields.sourceId.value;const free=node('option','',t('free'));free.value='';const list=items().filter(item=>!item.placeholder&&item.image).map(item=>{const o=node('option','',itemText(item).word);o.value=item.id;return o;});fields.sourceId.replaceChildren(free,...list);fields.sourceId.value=value;}
  async function loadImage(url){return new Promise((resolve,reject)=>{const image=new Image();image.onload=()=>resolve(image);image.onerror=reject;image.src=url;});}
  async function useSource(id){const item=items().find(i=>i.id===id);if(!item||!item.image)return;fields.sourceId.value=id;const request=++imageRequest,current=session;try{const image=await loadImage(item.image);if(session!==current||request!==imageRequest||route!=='compose')return;photo=image;photoPosition={x:.5,y:.43};$('#archive-image-controls').hidden=false;setTool('move');changed();}catch(_){status('imageError');}}
  function currentPoint(e){const r=canvas.getBoundingClientRect();return[clamp((e.clientX-r.left)/r.width,0,1),clamp((e.clientY-r.top)/r.height,0,1)];}
  canvas.addEventListener('pointerdown',e=>{if(saving||pointer||e.button!==0)return;e.preventDefault();canvas.focus({preventScroll:true});canvas.setPointerCapture(e.pointerId);const p=currentPoint(e);pointer={id:e.pointerId,last:p};if(tool==='draw')stroke={ink,points:[p]};schedulePaint();});
  canvas.addEventListener('pointermove',e=>{if(pointer?.id!==e.pointerId)return;const p=currentPoint(e);if(stroke){const last=stroke.points.at(-1);if(Math.hypot((p[0]-last[0])*600,(p[1]-last[1])*800)>1)stroke.points.push(p);}else if(photo&&tool==='move'){photoPosition.x=clamp(photoPosition.x+p[0]-pointer.last[0],-.5,1.5);photoPosition.y=clamp(photoPosition.y+p[1]-pointer.last[1],-.5,1.5);}pointer.last=p;schedulePaint();});
  function finishStroke(e){if(pointer?.id!==e.pointerId)return;if(stroke&&e.type!=='pointercancel')paths.push(stroke);releasePointer();changed();}
  canvas.addEventListener('pointerup',finishStroke);canvas.addEventListener('pointercancel',finishStroke);canvas.addEventListener('lostpointercapture',e=>{if(pointer?.id===e.pointerId){pointer=null;stroke=null;schedulePaint();}});
  canvas.addEventListener('keydown',e=>{if(saving)return;if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==='z'){e.preventDefault();$('#archive-stamp-undo').click();}else if(tool==='move'&&photo&&e.key.startsWith('Arrow')){e.preventDefault();const d=e.shiftKey ? .05 : .01;photoPosition.x+=e.key==='ArrowRight'?d:e.key==='ArrowLeft'?-d:0;photoPosition.y+=e.key==='ArrowDown'?d:e.key==='ArrowUp'?-d:0;changed();}});
  document.querySelectorAll('[data-stamp-tool]').forEach(b=>b.addEventListener('click',()=>setTool(b.dataset.stampTool)));
  document.querySelectorAll('[data-stamp-ink]').forEach(b=>b.addEventListener('click',()=>{ink=b.dataset.stampInk;document.querySelectorAll('[data-stamp-ink]').forEach(n=>n.setAttribute('aria-pressed',String(n===b)));}));
  $('#archive-stamp-undo').addEventListener('click',()=>{if(saving)return;paths.pop();changed();});$('#archive-stamp-clear').addEventListener('click',()=>{if(saving)return;paths=[];changed();});
  Object.values(fields).forEach(field=>field.addEventListener('input',changed));
  $('#archive-image-size').addEventListener('input',changed);$('#archive-image-remove').addEventListener('click',()=>{if(saving)return;imageRequest++;photo=null;$('#archive-image-controls').hidden=true;$('#archive-stamp-file').value='';setTool('draw');changed();});
  $('#archive-stamp-file').addEventListener('change',async e=>{
    const file=e.target.files?.[0];if(!file||saving)return;
    if(!['image/png','image/jpeg','image/webp'].includes(file.type)||file.size>20*1024*1024){status('imageError');e.target.value='';return;}
    const url=URL.createObjectURL(file),request=++imageRequest,current=session;
    try{const image=await loadImage(url);if(current!==session||request!==imageRequest)return;const max=1600,ratio=Math.min(1,max/Math.max(image.width,image.height)),buffer=document.createElement('canvas');buffer.width=Math.max(1,Math.round(image.width*ratio));buffer.height=Math.max(1,Math.round(image.height*ratio));buffer.getContext('2d').drawImage(image,0,0,buffer.width,buffer.height);photo=buffer;photoPosition={x:.5,y:.43};$('#archive-image-size').value='85';$('#archive-image-controls').hidden=false;setTool('move');changed();}catch(_){status('imageError');}finally{URL.revokeObjectURL(url);}
  });
  function artwork(){paint();return canvas.toDataURL('image/jpeg',.9);}
  $('#archive-download').addEventListener('click',()=>{paint();const a=node('a');a.href=canvas.toDataURL('image/png');a.download=(fields.title.value.trim()||'coleccion-estampita').replace(/[^\p{L}\p{N}\- _]/gu,'').slice(0,80)+'.png';a.click();});
  form.addEventListener('submit',async e=>{
    e.preventDefault();if(saving)return;fields.title.value=fields.title.value.trim();fields.text.value=fields.text.value.trim();if(!form.reportValidity())return;
    if(!photo&&!paths.length){status('artRequired');canvas.focus();return;}if(!endpoint){status('unconfigured');return;}if(!navigator.onLine){status('offline');return;}
    const payload={version:1,id:draftId,title:fields.title.value.trim(),text:fields.text.value.trim(),author:fields.author.value.trim(),sourceId:fields.sourceId.value,image:artwork()},savedSession=session;
    if(!payload.title||!payload.text){form.reportValidity();return;}saving=true;form.querySelectorAll('input,textarea,select,button').forEach(n=>n.disabled=true);$('#archive-save').disabled=true;$('#archive-save').textContent=t('saving');status('saving');
    try{const response=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload),signal:AbortSignal.timeout(20000)});if(!response.ok)throw Error(response.status===429?'daily':'saveError');const data=await response.json(),item=normalizeContribution(data.entry);if(!item||item.id!==payload.id)throw Error('saveError');shared.set(item.id,item);if(session===savedSession){saving=false;resetComposer();location.hash=objectHref(item.id);$('#archive-announcement').textContent=t('saved');}loadShared();}
    catch(error){if(session===savedSession){saving=false;form.querySelectorAll('input,textarea,select,button').forEach(n=>n.disabled=false);$('#archive-save').disabled=false;$('#archive-save').textContent=t('savePiece');status(error.message==='daily'?'daily':'saveError');}}
  });
  async function loadShared(){
    if(!endpoint||loading)return;loading=true;const before=shared.size,failedBefore=loadFailed;
    try{let more=true;while(more){const response=await fetch(endpoint+'?after='+cursor,{cache:'no-store',signal:AbortSignal.timeout(15000)});if(!response.ok)throw Error();const data=await response.json();if(!Array.isArray(data.entries)||!Number.isSafeInteger(data.cursor)||data.cursor<cursor)throw Error();for(const raw of data.entries){const item=normalizeContribution(raw);if(item)shared.set(item.id,item);}const next=data.cursor;more=Boolean(data.hasMore)&&next>cursor;cursor=next;}loadFailed=false;}
    catch(_){loadFailed=true;}finally{loading=false;if(isBrowsing()&&(before!==shared.size||failedBefore!==loadFailed))renderCollection({refresh:before!==shared.size});}
  }
  function localize(){
    document.querySelectorAll('[data-archive-copy]').forEach(n=>n.textContent=t(n.dataset.archiveCopy));
    document.querySelectorAll('[data-archive-label]').forEach(n=>n.setAttribute('aria-label',t(n.dataset.archiveLabel)));
    document.querySelectorAll('[data-archive-alt]').forEach(n=>n.alt=t(n.dataset.archiveAlt));
    canvas.setAttribute('aria-label',t('stampLabel'));
    $('.archive-preview-close').setAttribute('aria-label',lang()==='en'?'Close preview':'Cerrar vista previa');
    for(const [selector,key]of [['[data-stamp-tool=draw]','draw'],['[data-stamp-tool=move]','move'],['#archive-stamp-undo','undo'],['#archive-stamp-clear','clear']])$(selector).setAttribute('aria-label',t(key));
    renderOrigin();if(notice)status(notice);if(saving)$('#archive-save').textContent=t('saving');if(isBrowsing())renderCollection({refresh:true});schedulePaint();
  }
  function showRoute(initial=false){
    const hash=location.hash.slice(1),old=route,wasBrowsing=isBrowsing();
    if(hash.startsWith('objeto=')){
      route='object';
      try{
        const parameters=new URLSearchParams(hash);selected=parameters.get('objeto');
        const requestedLetter=normalizeLetter(parameters.get('letra')||'');entryLetter=letterAlphabet.includes(requestedLetter)?requestedLetter:letterForItem(items().find(i=>i.id===selected));
        pendingSelection=selected;
        if(selected==='nire')route='index';
        if(selected==='dibujo-01'){selected=null;route='home';}
      }catch(_){route='index';}
    }else{pendingSelection=null;route=hash==='archivo'?'index':hash==='manifiesto'?'intro-text':hash.startsWith('sumar')?'index':'home';if(route==='index')selected=null;}
    if(!isBrowsing()){stopObjectMedia();previewKey='';}
    if(wasBrowsing&&!isBrowsing())indexScroll=window.scrollY;
    if(old==='compose'&&route!=='compose')resetComposer();
    if(route==='compose'&&old!=='compose'){resetComposer();renderOrigin();const sourceId=new URLSearchParams(hash.replace(/^sumar&?/,'' )).get('desde');if(sourceId)useSource(sourceId);}
    $('#archive-cover').hidden=route!=='home';$('#archive-index').hidden=!isBrowsing();$('#archive-object-view').hidden=!isBrowsing();$('#archive-composer').hidden=route!=='compose';
    $('#archive-manifesto').hidden=route!=='intro-text';
    $('.nire-header').hidden=route==='intro-text';$('.archive-footer').hidden=route==='intro-text';
    if(isBrowsing())renderCollection();document.body.dataset.archiveView=route;document.body.classList.toggle('archive-catalogue-open',isBrowsing()&&!selected);
    if(!initial&&!(wasBrowsing&&isBrowsing())){const expected=route;requestAnimationFrame(()=>{if(route!==expected)return;window.scrollTo({top:isBrowsing()?indexScroll:0,behavior:'instant'});const heading=$(isBrowsing()?'#archive-index-title':route==='compose'?'#archive-composer-title':route==='intro-text'?'#archive-intro-text':'#archive-title');heading.setAttribute('tabindex','-1');heading.focus({preventScroll:true});});}
    if(route==='compose')schedulePaint();
  }
  function openLetterPreview(e){
    const button=e.target.closest('[data-preview-id]');if(!button)return;
    if(!selected)previewReturnScroll=window.scrollY;
    pendingSelection=null;selected=button.dataset.previewId;entryLetter=button.dataset.entryLetter||letterForItem(items().find(i=>i.id===selected));
    history.replaceState(null,'',objectHref(selected,entryLetter));route='object';document.body.dataset.archiveView=route;renderCollection();
    $('#archive-object-title').focus({preventScroll:true});
    window.scrollTo({top:0,behavior:'instant'});
  }
  $('#archive-collection').addEventListener('click',openLetterPreview);
  $('#archive-object-text').addEventListener('click',openLetterPreview);
  $('#archive-collection').addEventListener('keydown',e=>{
    const directions={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]};
    if(!(e.key in directions||e.key==='Home'||e.key==='End')||e.altKey||e.ctrlKey||e.metaKey||!e.target.matches('.archive-letter-button'))return;
    e.preventDefault();
    const buttons=[...e.currentTarget.querySelectorAll('.archive-letter-button:enabled')];
    if(e.key==='Home'||e.key==='End'){
      (e.key==='Home'?buttons[0]:buttons.at(-1))?.focus();
      return;
    }
    const [dx,dy]=directions[e.key],origin=e.target.getBoundingClientRect();
    let nearest,score=Infinity;
    for(const button of buttons){
      const rect=button.getBoundingClientRect(),x=rect.x+rect.width/2-origin.x-origin.width/2,y=rect.y+rect.height/2-origin.y-origin.height/2;
      const forward=x*dx+y*dy,distance=Math.hypot(forward,2*(x*dy-y*dx));
      if(forward>1&&distance<score){nearest=button;score=distance;}
    }
    nearest?.focus();
  });
  function closePreview(){
    const previous=selected;selected=null;pendingSelection=null;route='index';history.replaceState(null,'','#archivo');document.body.dataset.archiveView=route;renderCollection();
    ($('#archive-collection').querySelector('[data-entry-letter="'+CSS.escape(entryLetter||'')+'"]')||$('#archive-collection').querySelector('[data-preview-id="'+CSS.escape(previous||'')+'"]'))?.focus({preventScroll:true});
    if(matchMedia('(max-width:650px)').matches)window.scrollTo({top:previewReturnScroll,behavior:'instant'});
  }
  $('.archive-preview-close').addEventListener('click',closePreview);
  window.addEventListener('hashchange',()=>showRoute());
  document.addEventListener('visibilitychange',()=>objectSequence?.sync());
  motionPreference.addEventListener('change',()=>objectSequence?.motionChanged());
  window.addEventListener('pagehide',stopObjectMedia);
  window.addEventListener('pageshow',e=>{if(e.persisted&&isBrowsing())renderCollection({refresh:true});});
  document.addEventListener('keydown',e=>{
    if(route==='intro-text'&&e.target.id==='archive-intro-text'&&(e.key==='Enter'||e.key===' ')){e.preventDefault();location.hash='archivo';return;}
    if(e.key==='Escape'&&route!=='home'){if(['INPUT','TEXTAREA','SELECT'].includes(e.target.tagName)&&route==='compose')return;if(isBrowsing()&&selected){closePreview();return;}location.hash=route==='intro-text'||route==='index'?'inicio':'archivo';}
  });
  window.addEventListener('pagehide',resetComposer);window.addEventListener('online',loadShared);window.addEventListener('focus',loadShared);setInterval(()=>{if(!document.hidden)loadShared();},30000);
  new MutationObserver(localize).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
  localize();loadShared();showRoute(true);
}());

