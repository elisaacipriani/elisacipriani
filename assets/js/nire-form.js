(function(){
  'use strict';
  let pending=null,segments=[];
  function load(){
    if(pending)return pending;
    pending=fetch('assets/images/nire/form.json?v=2').then(r=>{if(!r.ok)throw new Error('Spatial tree unavailable');return r.json()}).then(data=>{
      for(const path of data.paths)for(let i=1;i<path.length;i++){
        const a=path[i-1],b=path[i],dx=b[0]-a[0],dy=-(b[1]-a[1]),dz=b[2]-a[2],length=Math.hypot(dx,dy);
        if(length<.0001)continue;
        const norm=Math.hypot(dx,dy,dz),along=[dx/length,dy/length,0],side=[-dy/length,dx/length,0],tangent=[dx/norm,dy/norm,dz/norm];
        const normal=[-dz/norm*dx/length,-dz/norm*dy/length,length/norm];
        segments.push({a:[a[0]/data.width-.5,(data.height*.5-a[1])/data.width,a[2]/data.width],dx:dx/data.width,dy:dy/data.width,dz:dz/data.width,length: length/data.width,along,side,tangent,normal});
      }
    });
    return pending;
  }
  function frame(u,v){
    const x=u-.5,y=(.5-v)*3200/2262;let best=null,score=Infinity;
    for(const s of segments){
      const t=Math.max(0,Math.min(1,((x-s.a[0])*s.dx+(y-s.a[1])*s.dy)/(s.length*s.length)));
      const px=s.a[0]+s.dx*t,py=s.a[1]+s.dy*t,d=(x-px)**2+(y-py)**2;
      if(d<score){score=d;best={...s,center:[px,py,s.a[2]+s.dz*t]};}
    }
    return best||{center:[x,y,0],along:[1,0,0],side:[0,1,0],tangent:[1,0,0],normal:[0,0,1]};
  }
  function point(f,u,v,h=0){
    const x=u-.5-f.center[0],y=(.5-v)*3200/2262-f.center[1];
    const a=x*f.along[0]+y*f.along[1],b=x*f.side[0]+y*f.side[1];
    return f.center.map((value,i)=>value+f.tangent[i]*a+f.side[i]*b+f.normal[i]*h);
  }
  function normal(f,n){
    const a=n[0]*f.along[0]+n[1]*f.along[1],b=n[0]*f.side[0]+n[1]*f.side[1];
    return f.tangent.map((_,i)=>f.tangent[i]*a+f.side[i]*b+f.normal[i]*n[2]);
  }
  window.NireTreeForm={load,frame,point,normal,depth:(u,v)=>point(frame(u,v),u,v)[2]};
}());
