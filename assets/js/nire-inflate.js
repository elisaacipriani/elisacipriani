(function(){
  "use strict";
  const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
  const distance=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]);
  function bounds(path){
    let left=Infinity,right=-Infinity,bottom=Infinity,top=-Infinity;
    for(const p of path){left=Math.min(left,p[0]);right=Math.max(right,p[0]);bottom=Math.min(bottom,p[1]);top=Math.max(top,p[1]);}
    return {left,right,bottom,top,width:right-left,height:top-bottom};
  }
  function closed(path){
    if(path.length<4)return false;
    const b=bounds(path),diagonal=Math.hypot(b.width,b.height);
    if(Math.min(b.width,b.height)<.006)return false;
    const length=path.slice(1).reduce((n,p,i)=>n+distance(p,path[i]),0);
    return distance(path[0],path.at(-1))<diagonal*.28&&length>diagonal*1.6;
  }
  function resample(path,spacing){
    const result=[path[0]];let carry=0;
    for(let i=1;i<path.length;i++){
      let a=path[i-1],b=path[i],length=distance(a,b);
      while(carry+length>=spacing&&length>1e-10){
        const t=(spacing-carry)/length,p=[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,0];
        result.push(p);a=p;length=distance(a,b);carry=0;
      }
      carry+=length;
    }
    return result;
  }
  function round(path){
    let line=path.slice();
    if(distance(line[0],line.at(-1))<.0002)line.pop();
    line=resample([...line,line[0]],.012);
    // Smooth small hand jitter while retaining the drawn silhouette and tip.
    for(let pass=0;pass<2;pass++){
      const next=[];
      for(let i=0;i<line.length;i++){
        const a=line[i],b=line[(i+1)%line.length];
        next.push([a[0]*.75+b[0]*.25,a[1]*.75+b[1]*.25,0],[a[0]*.25+b[0]*.75,a[1]*.25+b[1]*.75,0]);
      }
      line=next;
    }
    return resample([...line,line[0]],.009);
  }
  function contours(paths){
    const pending=paths.map(p=>p.slice()),loops=[],open=[];
    while(pending.length){
      let path=pending.shift(),joined=true;
      while(!closed(path)&&joined){
        joined=false;let match=null,best=.06;
        for(let i=0;i<pending.length;i++)for(const a of [0,1])for(const b of [0,1]){
          if(closed(pending[i]))continue;
          const d=distance(path[a?path.length-1:0],pending[i][b?pending[i].length-1:0]);
          if(d<best){best=d;match={i,a,b};}
        }
        if(match){
          const other=pending.splice(match.i,1)[0];
          if(!match.a)path.reverse();if(match.b)other.reverse();
          path=path.concat(other);joined=true;
        }
      }
      if(closed(path))loops.push(round(path));else open.push(path);
    }
    return {loops,open};
  }
  function groups(loops){
    const result=loops.map(p=>({paths:[p],box:bounds(p)}));
    for(let i=0;i<result.length;i++)for(let j=i+1;j<result.length;){
      const a=result[i].box,b=result[j].box;
      if(a.left<=b.right&&a.right>=b.left&&a.bottom<=b.top&&a.top>=b.bottom){
        result[i].paths.push(...result[j].paths);result[i].box=bounds(result[i].paths.flat());result.splice(j,1);i=-1;break;
      }else j++;
    }
    return result;
  }
  function polygon(path){
    const edges=[];
    for(let i=0;i<path.length;i++){
      const a=path[i],b=path[(i+1)%path.length],dx=b[0]-a[0],dy=b[1]-a[1],length=dx*dx+dy*dy;
      if(length>1e-16)edges.push([a[0],a[1],b[0],b[1],dx,dy,length]);
    }
    return edges;
  }
  function fieldFor(paths){
    const polygons=paths.map(polygon);
    return (x,y)=>{
      let union=-Infinity;
      for(const edges of polygons){
        let inside=false,nearest=Infinity;
        for(const [ax,ay,bx,by,dx,dy,length]of edges){
          const t=clamp(((x-ax)*dx+(y-ay)*dy)/length,0,1);
          const d=(x-ax-dx*t)**2+(y-ay-dy*t)**2;if(d<nearest)nearest=d;
          if((ay>y)!==(by>y)&&x<(bx-ax)*(y-ay)/(by-ay)+ax)inside=!inside;
        }
        union=Math.max(union,Math.sqrt(nearest)*(inside?1:-1));
      }
      return union;
    };
  }
  function inflate(group,quality){
    const box=group.box,resolution=quality?128:40,h=Math.min(Math.max(box.width,box.height)/resolution,Math.min(box.width,box.height)/8);
    const nx=Math.ceil(box.width/h)+3,ny=Math.ceil(box.height/h)+3,count=nx*ny,x0=box.left-h,y0=box.bottom-h;
    const distanceField=new Float64Array(count),u=new Float64Array(count),gradientX=new Float64Array(count),gradientY=new Float64Array(count);
    const weight=new Float64Array(count*4),alpha=new Float64Array(count*4),diagonal=new Float64Array(count),active=[],sdf=fieldFor(group.paths);
    let deepest=0;
    for(let y=0;y<ny;y++)for(let x=0;x<nx;x++){
      const i=y*nx+x,d=sdf(x0+x*h,y0+y*h);
      distanceField[i]=Math.abs(d)<1e-10?-1e-10:d;
      if(distanceField[i]>0){active.push(i);deepest=Math.max(deepest,d);}
    }
    if(!active.length)return null;
    const offsets=[-1,1,-nx,nx],hsq=h*h;
    for(const i of active){
      const d=distanceField[i];u[i]=d*(2*deepest-d)/4;
      for(let k=0;k<4;k++){
        const other=distanceField[i+offsets[k]];
        alpha[i*4+k]=other>0?1:Math.max(1e-5,d/(d-other));
      }
      const a=i*4;
      weight[a]=2/(alpha[a]+alpha[a+1])/alpha[a];weight[a+1]=2/(alpha[a]+alpha[a+1])/alpha[a+1];
      weight[a+2]=2/(alpha[a+2]+alpha[a+3])/alpha[a+2];weight[a+3]=2/(alpha[a+2]+alpha[a+3])/alpha[a+3];
      diagonal[i]=weight[a]+weight[a+1]+weight[a+2]+weight[a+3];
    }
    // A pressure field inside the silhouette produces a smooth rounded body.
    // The actual contour supplies subcell boundary positions, avoiding a pixel edge.
    for(let iteration=0;iteration<(quality?280:100);iteration++){
      let change=0;
      for(const i of active){
        const a=i*4;
        const next=(hsq+u[i-1]*weight[a]+u[i+1]*weight[a+1]+u[i-nx]*weight[a+2]+u[i+nx]*weight[a+3])/diagonal[i];
        const delta=(next-u[i])*1.8;u[i]+=delta;change=Math.max(change,Math.abs(delta));
      }
      if(change<hsq*.0005)break;
    }
    let maximum=0;for(const i of active)maximum=Math.max(maximum,u[i]);
    if(maximum<=0)return null;
    const depth=Math.min(box.width,box.height)*.46,factor=depth/Math.sqrt(maximum),factor2=factor*factor;
    for(const i of active){
      const a=i*4,l=alpha[a],r=alpha[a+1],b=alpha[a+2],t=alpha[a+3],v=u[i];
      gradientX[i]=(l*l*u[i+1]-r*r*u[i-1]+(r*r-l*l)*v)/(h*l*r*(l+r));
      gradientY[i]=(b*b*u[i+nx]-t*t*u[i-nx]+(t*t-b*b)*v)/(h*b*t*(b+t));
    }
    const positions=[],indices=[],nodes=new Map(),edges=new Map();
    function vertex(x,y,z,nx,ny,nz){
      const n=Math.hypot(nx,ny,nz)||1,index=positions.length/6;
      positions.push(x,y,z,nx/n,ny/n,nz/n);return index;
    }
    function node(i){
      if(nodes.has(i))return nodes.get(i);
      const x=x0+(i%nx)*h,y=y0+Math.floor(i/nx)*h,z=Math.sqrt(Math.max(0,u[i]))*factor;
      const gx=-factor2*gradientX[i],gy=-factor2*gradientY[i];
      const pair=[vertex(x,y,z,gx,gy,2*z),vertex(x,y,-z,gx,gy,-2*z)];nodes.set(i,pair);return pair;
    }
    function edge(a,b){
      const key=a<b?a*count+b:b*count+a;if(edges.has(key))return edges.get(key);
      const t=distanceField[a]/(distanceField[a]-distanceField[b]),ax=a%nx,ay=Math.floor(a/nx),bx=b%nx,by=Math.floor(b/nx);
      const x=x0+(ax+(bx-ax)*t)*h,y=y0+(ay+(by-ay)*t)*h,epsilon=h*.16;
      const gx=sdf(x+epsilon,y)-sdf(x-epsilon,y),gy=sdf(x,y+epsilon)-sdf(x,y-epsilon);
      const id=vertex(x,y,0,-gx,-gy,0),pair=[id,id];edges.set(key,pair);return pair;
    }
    function triangle(a,b,c){
      const input=[a,b,c],clipped=[];
      for(let k=0;k<3;k++){
        const current=input[k],previous=input[(k+2)%3],inside=distanceField[current]>0,wasInside=distanceField[previous]>0;
        if(inside!==wasInside)clipped.push(edge(previous,current));
        if(inside)clipped.push(node(current));
      }
      for(let k=1;k<clipped.length-1;k++){
        const a=clipped[0],b=clipped[k],c=clipped[k+1];
        indices.push(a[0],b[0],c[0],a[1],c[1],b[1]);
      }
    }
    for(let y=0;y<ny-1;y++)for(let x=0;x<nx-1;x++){
      const a=y*nx+x,b=a+1,c=a+nx,d=c+1;
      triangle(a,b,d);triangle(a,d,c);
    }
    if(positions.length/6>=65536)throw Error("Element surface exceeds index budget");
    return {vertices:new Float32Array(positions),indices:new Uint16Array(indices),bounds:{min:[box.left,box.bottom,-depth],max:[box.right,box.top,depth]},solid:true};
  }
  function build(loops,quality){
    const batches=[];
    for(const group of groups(loops)){const part=inflate(group,quality);if(part)batches.push(part);}
    return batches;
  }
  window.NireInflate={contours,build};
}());
