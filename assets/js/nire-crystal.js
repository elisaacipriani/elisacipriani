(function(){
  'use strict';

  // Each fine glass arch flows into its terminal drop as one closed surface.
  window.createNireCrystalGeometry=function(rootData=null){
    const sourceWidth=2262,sides=64,curveSteps=64,dropSteps=32;
    const anchor=[1379.1056-1131,1600-1195.3345,169.4764];
    const add=(a,b)=>a.map((v,i)=>v+b[i]),sub=(a,b)=>a.map((v,i)=>v-b[i]);
    const mul=(a,n)=>a.map(v=>v*n),dot=(a,b)=>a.reduce((s,v,i)=>s+v*b[i],0);
    const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
    const unit=a=>mul(a,1/Math.max(1.e-12,Math.hypot(...a)));
    const smooth=t=>t*t*(3-2*t);
    function bezier(p,t){
      const a=1-t;
      return p[0].map((_,i)=>a*a*a*p[0][i]+3*a*a*t*p[1][i]+3*a*t*t*p[2][i]+t*t*t*p[3][i]);
    }
    function tangent(p,t){
      const a=1-t;
      return p[0].map((_,i)=>3*a*a*(p[1][i]-p[0][i])+6*a*t*(p[2][i]-p[1][i])+3*t*t*(p[3][i]-p[2][i]));
    }
    const designs=[
      {scale:1,curves:[
        [[0,0,0],[12,72,8],[51,122,15],[83,123,20]],
        [[83,123,20],[115,124,25],[139,103,30],[136,72,32]],
        [[136,72,32],[133,41,34],[132,-6,34],[132,-31,34]]
      ]},
      {scale:.84,curves:[
        [[2,-1,-1],[4,35,-6],[35,83,-17],[65,88,-22]],
        [[65,88,-22],[95,93,-27],[118,67,-34],[115,41,-38]],
        [[115,41,-38],[112,15,-42],[109,-24,-42],[109,-50,-42]]
      ]}
    ];
    const low=[Infinity,Infinity,Infinity],high=[-Infinity,-Infinity,-Infinity],drops=[];
    function build(design,id){
      const rings=[],last=design.curves.at(-1).at(-1),scale=design.scale,neck=.66*scale;
      design.curves.forEach((curve,segment)=>{
        for(let k=segment?1:0;k<=curveSteps;k++){
          const t=k/curveSteps,u=(segment+t)/design.curves.length;
          rings.push({p:bezier(curve,t),t:unit(tangent(curve,t)),r:scale*(1.12-.46*smooth(u))});
        }
      });
      // The neck matches the stem's radius and tangent; there is no separate pendant.
      const profile=[
        [[neck,0],[neck,-4*scale],[1.7*scale,-7*scale],[3.9*scale,-11*scale]],
        [[3.9*scale,-11*scale],[6.1*scale,-15*scale],[7.8*scale,-17.3*scale],[7.8*scale,-21*scale]],
        [[7.8*scale,-21*scale],[7.8*scale,-25.8*scale],[4.2*scale,-28.5*scale],[0,-28.5*scale]]
      ];
      profile.forEach((curve,segment)=>{
        for(let k=1;k<=dropSteps;k++){
          if(segment===profile.length-1&&k===dropSteps)continue;
          const q=bezier(curve,k/dropSteps);
          rings.push({p:add(last,[0,q[1],0]),t:[0,-1,0],r:q[0]});
        }
      });
      let normal=unit(cross(rings[0].t,[0,0,1]));
      const positions=[],frames=[];
      for(const ring of rings){
        // Parallel transport avoids twists at the apex of the arch.
        normal=unit(sub(normal,mul(ring.t,dot(normal,ring.t))));
        const binormal=unit(cross(ring.t,normal));frames.push([normal,binormal]);
        const row=[];
        for(let j=0;j<sides;j++){
          const theta=j*Math.PI*2/sides;
          row.push(add(ring.p,mul(add(mul(normal,Math.cos(theta)),mul(binormal,Math.sin(theta))),ring.r)));
        }
        positions.push(row);
      }
      const vertices=[],indices=[],partLow=[Infinity,Infinity,Infinity],partHigh=[-Infinity,-Infinity,-Infinity];
      function vertex(p,n,u,v,r){
        const q=add(p,anchor).map(x=>x/sourceWidth);
        // The AO slot carries local optical radius for glass: a fine stem must
        // refract less strongly than the much thicker drop at its end.
        vertices.push(...q,...n,1,1,1,u,v,r/sourceWidth);
        q.forEach((x,i)=>{partLow[i]=Math.min(partLow[i],x);partHigh[i]=Math.max(partHigh[i],x);low[i]=Math.min(low[i],x);high[i]=Math.max(high[i],x);});
      }
      const root=rings[0];vertex(sub(root.p,mul(root.t,root.r*.5)),mul(root.t,-1),0,0,root.r);
      positions.forEach((row,i)=>{
        for(let j=0;j<sides;j++){
          const theta=j*Math.PI*2/sides;
          const circumference=add(mul(frames[i][0],-Math.sin(theta)),mul(frames[i][1],Math.cos(theta)));
          let length;
          if(i===0)length=sub(positions[1][j],row[j]);
          else if(i===positions.length-1)length=sub(add(last,[0,-28.5*scale,0]),positions[i-1][j]);
          else length=sub(positions[i+1][j],positions[i-1][j]);
          vertex(row[j],unit(cross(circumference,length)),j/sides,i/(rings.length-1),rings[i].r);
        }
      });
      for(let j=0;j<sides;j++)indices.push(0,1+(j+1)%sides,1+j);
      for(let ring=0;ring<rings.length-1;ring++)for(let j=0;j<sides;j++){
        const a=1+ring*sides+j,b=1+ring*sides+(j+1)%sides;
        indices.push(a,b,a+sides,b,b+sides,a+sides);
      }
      const bottom=vertices.length/12;vertex(add(last,[0,-28.5*scale,0]),[0,-1,0],0,1,0);
      for(let j=0;j<sides;j++)indices.push(bottom,1+(rings.length-1)*sides+j,1+(rings.length-1)*sides+(j+1)%sides);
      const center=partLow.map((x,i)=>(x+partHigh[i])/2);
      drops.push(add(add(last,[0,-19*scale,0]),anchor).map(v=>v/sourceWidth));
      return{kind:13,id,vertices:new Float32Array(vertices),indices:new Uint16Array(indices),low:partLow,high:partHigh,center,sphere:{center,radius:7.8*scale/sourceWidth}};
    }
    const parts=designs.map((design,i)=>build(design,200+i));
    // The roots share one fused crown, instead of overlapping tube ends at
    // every fork. Its native glass surface uses the same vertex format.
    if(rootData){
      const raw=rootData.raw,d=new DataView(raw);
      if(d.getUint32(0,true)!==0x5052494e||d.getUint32(4,true)!==2)throw new Error('Invalid crystal roots');
      let at=12;
      for(let i=0;i<d.getUint32(8,true);i++){
        const kind=d.getUint32(at,true),id=d.getUint32(at+4,true),nv=d.getUint32(at+8,true),ni=d.getUint32(at+12,true),center=[0,1,2].map(j=>d.getFloat32(at+16+j*4,true));at+=28;
        if(kind!==13)throw new Error('Invalid root material');
        const vertices=new Float32Array(raw.slice(at,at+nv*48));at+=nv*48;
        const indices=new Uint16Array(raw.slice(at,at+ni*2));at+=ni*2;
        const partLow=[Infinity,Infinity,Infinity],partHigh=[-Infinity,-Infinity,-Infinity];let radius=0;
        for(let j=0;j<nv;j++){
          for(let k=0;k<3;k++){const v=vertices[j*12+k];partLow[k]=Math.min(partLow[k],v);partHigh[k]=Math.max(partHigh[k],v);low[k]=Math.min(low[k],v);high[k]=Math.max(high[k],v);}
          radius=Math.max(radius,vertices[j*12+11]);
        }
        parts.push({kind,id,vertices,indices,low:partLow,high:partHigh,center,sphere:{center,radius},root:true});
      }
      if(at!==raw.byteLength)throw new Error('Incomplete crystal roots');
    }
    const rootPoints=rootData?.meta.landmarks||[];
    const center=low.map((x,i)=>(x+high[i])/2),size=high.map((x,i)=>x-low[i]);
    return{
      parts,low,high,center,size,drops,rootPoints,stems:designs.length,
      primaryRoots:rootData?.meta.primaryRoots||0,rootTips:rootData?.meta.tips||0,
      triangles:parts.reduce((sum,p)=>sum+p.indices.length/3,0),
      feature(base,world,angle,tilt){
        const c=Math.cos(angle),s=Math.sin(angle),ct=Math.cos(tilt),st=Math.sin(tilt);
        const project=p=>{const x=c*p[0]+s*p[2],z=-s*p[0]+c*p[2],y=ct*p[1]-st*z,depth=st*p[1]+ct*z,f=base.scale*world.width*4/(4-depth);return{x:base.cx+x*f,y:base.cy-y*f,depth};};
        const box=Array.from({length:8},(_,i)=>project([i&1?high[0]:low[0],i&2?high[1]:low[1],i&4?high[2]:low[2]]));
        const width=Math.max(...box.map(p=>p.x))-Math.min(...box.map(p=>p.x)),height=Math.max(...box.map(p=>p.y))-Math.min(...box.map(p=>p.y));
        const point=p=>({x:(p[0]+.5)*world.width,y:(world.height/world.width*.5-p[1])*world.width,z:p[2]*world.width,feature:'poppyTear',material:'crystal'});
        return{
          point:point(center),drops:drops.map(point),roots:rootPoints.map(point),
          zoom:Math.max(1.6,Math.min(18,base.height*.54/height,base.width*.70/width)),
          size:Math.max(...size),screen:{...project(center),width,height}
        };
      }
    };
  };
}());
