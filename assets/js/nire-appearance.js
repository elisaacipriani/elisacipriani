(function(){
  'use strict';
  const root=document.documentElement,button=document.getElementById('nire-background-toggle');
  const storageKey='ec-nire-appearance';
  let dark=root.dataset.nireTheme==='dark';
  const background=()=>dark?'#000000':'#e8eae8';
  function update(){
    root.dataset.nireTheme=dark?'dark':'light';
    const en=root.lang==='en',label=en?(dark?'Use a light background':'Use a black background'):(dark?'Cambiar a fondo claro':'Cambiar a fondo negro');
    if(button){button.setAttribute('aria-label',label);button.title=label;button.setAttribute('aria-pressed',String(dark));}
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content',background());
    const color=document.getElementById('nire-text-color');
    if(color&&['#30392f','#f3efe9'].includes(color.value))color.value=dark?'#f3efe9':'#30392f';
  }
  function setDark(value){
    dark=Boolean(value);update();
    try{localStorage.setItem(storageKey,dark?'dark':'light');}catch(_){/* The control also works without storage. */}
    document.dispatchEvent(new CustomEvent('nire-appearance-change',{detail:{dark,background:background()}}));
  }
  window.NireAppearance={isDark:()=>dark,background,setDark};
  button?.addEventListener('pointerdown',event=>event.stopPropagation());
  button?.addEventListener('click',event=>{event.stopPropagation();setDark(!dark);});
  new MutationObserver(update).observe(root,{attributes:true,attributeFilter:['lang']});
  update();
}());
