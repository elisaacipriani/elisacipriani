(function(){
  'use strict';
  // The large arils and miniature source marks share the same flesh, kernel,
  // refraction and coral pigments. Their scale is the only material difference.
  window.nireCoralMaterialGLSL=function(derivatives){return `
    vec3 coralSkin(vec3 p,vec3 localNormal){
      vec3 w=pow(abs(normalize(localNormal)),vec3(5.0));w/=w.x+w.y+w.z;
      return texture2D(uSkin,p.yz*.42+.17).rgb*w.x+
        texture2D(uSkin,p.zx*.42+.31).rgb*w.y+
        texture2D(uSkin,p.xy*.42+.52).rgb*w.z;
    }
    vec3 background(vec2 uv,vec2 blur){
      vec2 lo=vec2(.001),hi=vec2(.999);
      vec3 c=texture2D(uBehind,clamp(uv,lo,hi)).rgb*.50;
      c+=texture2D(uBehind,clamp(uv+vec2(blur.x,blur.y),lo,hi)).rgb*.125;
      c+=texture2D(uBehind,clamp(uv+vec2(-blur.x,blur.y),lo,hi)).rgb*.125;
      c+=texture2D(uBehind,clamp(uv+vec2(blur.x,-blur.y),lo,hi)).rgb*.125;
      c+=texture2D(uBehind,clamp(uv-blur,lo,hi)).rgb*.125;
      return c;
    }
    vec2 arilInterval(vec3 origin,vec3 ray,vec3 axes){
      vec3 p=origin/axes,d=ray/axes;
      float a=dot(d,d),b=dot(p,d),c=dot(p,p)-1.0,disc=b*b-a*c;
      if(disc<0.0)return vec2(-1.0);
      float root=sqrt(disc);return vec2((-b-root)/a,(-b+root)/a);
    }
    vec3 arilCorePoint(vec3 p){
      float y=(p.y+.08)/.75,taper=.90+.20*y;
      return vec3((p.x-.035-.07*y)/(.49*taper),y,(p.z+.07)/(.34*taper));
    }
    float arilCore(vec3 p){vec3 q=abs(arilCorePoint(p));return dot(q*q,sqrt(q))-1.0;}
    vec3 arilCoreNormal(vec3 p){
      vec3 q=arilCorePoint(p),g=q*sqrt(abs(q));float taper=.90+.20*q.y;
      return normalize(vec3(g.x/(.49*taper),
        (g.y+g.x*(-.07/(.49*taper)-q.x*.20/taper)-g.z*q.z*.20/taper)/.75,
        g.z/(.34*taper)));
    }
    vec3 coralMaterial(vec3 n,vec3 localNormal,vec3 localPosition,vec3 viewPoint,float radius,vec3 bodyEye){
      vec3 coat=coralSkin(localPosition,localNormal);
      float grain=dot(coat,vec3(.2126,.7152,.0722));
      float height=(grain-.60)*radius*.00025;
      ${derivatives?`vec3 q0=dFdx(viewPoint),q1=dFdy(viewPoint),r1=cross(q1,n),r2=cross(n,q0);float determinant=dot(q0,r1);vec3 gradient=(r1*dFdx(height)+r2*dFdy(height))*sign(determinant)/max(abs(determinant),1.e-12);n=normalize(n-gradient);`:''}
      vec3 key=normalize(vec3(-.72,1.05,.58)),eye=normalize(vec3(0,0,4)-viewPoint);
      float diffuse=max(0.0,dot(n,key)),backlight=max(0.0,dot(-n,key));
      float facing=clamp(dot(n,eye),0.0,1.0),fresnel=.026+.974*pow(1.0-facing,5.0);
      // Preserve the accepted coral base, photographic skin and absorption RGB.
      vec3 albedo=mix(vec3(.99,.57,.46),coat,.52);
      vec3 body=albedo*(.50+.47*diffuse+.26*backlight);
      vec3 ray=refract(-normalize(bodyEye),normalize(localNormal),1.0/1.36);
      vec2 shell=arilInterval(localPosition-vec3(.07,0,0),ray,vec3(.98,1.08,.77));
      float thickness=clamp(shell.y,.08,2.5),optical=.20+1.45*clamp(thickness/1.35,0.0,1.3);
      vec3 transmission=exp(-vec3(.035,.39,.49)*optical);
      float pixels=radius*uWidth*4.0/(4.0-viewPoint.z);
      vec3 viewRay=refract(-eye,n,1.0/1.36);
      vec2 offset=(viewRay.xy/max(.3,-viewRay.z)+eye.xy/max(.3,eye.z))*pixels*thickness*.55/uViewport;
      vec2 blur=vec2(.12+pixels*.002)/uViewport;
      vec3 behind=background(gl_FragCoord.xy/uRenderSize+offset,blur);
      float flesh=.26+.28*(1.0-exp(-thickness*1.8));
      vec3 color=mix(behind*transmission,body,flesh);
      // A real ray through the volume reaches a separate elongated inner seed.
      // Its curved front, thickness and occlusion remain visible through pulp.
      vec2 core=arilInterval(localPosition-vec3(.035,-.08,-.07),ray,vec3(.72,.84,.52));
      float begin=max(.0,core.x),end=min(thickness,core.y);
      if(end>begin){
        float step=(end-begin)/12.0,first=end+1.0,last=begin-1.0;
        for(int i=0;i<=12;i++){
          float t=begin+float(i)*step;
          if(arilCore(localPosition+ray*t)<0.0){first=min(first,t);last=max(last,t);}
        }
        if(first<=last){
          float low=max(begin,first-step),high=first;
          for(int i=0;i<6;i++){float middle=(low+high)*.5;if(arilCore(localPosition+ray*middle)>0.0)low=middle;else high=middle;}
          float entry=(low+high)*.5,coreLength=max(.0,last+step-entry);
          vec3 p=localPosition+ray*entry,cn=arilCoreNormal(p);
          float light=.65+.32*max(.0,dot(cn,normalize(bodyEye+vec3(-.45,.65,.15))));
          float angle=atan(p.x-.035,p.z+.07);
          float fiber=pow(.5+.5*sin(angle*13.0+p.y*2.0+.7*sin(p.y*4.0)),28.0);
          float tissue=dot(coralSkin(p*2.8,cn),vec3(.2126,.7152,.0722));
          vec3 kernel=mix(albedo,vec3(1.0,.93,.86),.10)*light*(.95+.07*tissue);
          kernel=mix(kernel,mix(albedo,vec3(1.0,.87,.77),.18),fiber*.07);
          kernel*=exp(-vec3(.035,.39,.49)*entry*.48);
          float presence=(1.0-exp(-coreLength*7.0))*.65;
          color=mix(color,kernel,presence);
        }
      }
      // Fine pulp membranes sit inside the clear wet envelope, rather than
      // being printed as a flat mark on the outside of a bubble.
      vec3 middle=localPosition+ray*min(thickness*.42,.7);
      float meridian=atan(middle.x-.03,middle.z);
      float membrane=pow(.5+.5*sin(meridian*11.0+middle.y*1.8+.35*sin(middle.y*4.0)),38.0);
      color=mix(color,mix(albedo,vec3(1.0,.88,.77),.25),membrane*.025*(1.0-fresnel));
      vec3 reflected=reflect(-eye,n);
      float panel=exp(-pow(abs((reflected.x+.46)/.12),6.0)-pow(abs((reflected.y-.40)/.48),6.0));
      float strip=exp(-pow(abs((reflected.x-.63)/.032),2.0)-pow(abs((reflected.y+.12)/.42),2.0));
      float shine=pow(max(0.0,dot(n,normalize(key+eye))),150.0);
      color=mix(color,vec3(.92,.89,.82),fresnel*.38);
      color+=vec3(1.0,.95,.84)*(panel*.24+strip*.07+shine*.19);
      return mix(body,color,uRefraction);
    }
  `;};
}());
