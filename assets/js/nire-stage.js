(function(){
  'use strict';
  // A softly lit, pale photographic backdrop and a very quiet glass horizon.
  window.createNireStage=function(gl){
    const vertex='attribute vec2 aPosition;varying vec2 vUV;void main(){vUV=aPosition*.5+.5;gl_Position=vec4(aPosition,1,1);}';
    const fragment=`precision highp float;varying vec2 vUV;uniform vec2 uViewport,uRoot;uniform float uScene,uDark;
      float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
      void main(){
        vec2 uv=vec2(vUV.x,1.0-vUV.y),pixel=uv*uViewport;
        vec3 plain=vec3(232.0,234.0,232.0)/255.0;
        vec3 wall=vec3(.884,.901,.897)+vec3(.062)*exp(-dot((uv-vec2(.31,.22))*vec2(.93,.78),(uv-vec2(.31,.22))*vec2(.93,.78))*2.2);
        wall-=vec3(.013)*pow(abs(uv.x-.46)*1.5,2.0);
        float ground=smoothstep(uRoot.y-.9,uRoot.y+1.8,pixel.y);
        float drop=max(0.0,pixel.y-uRoot.y)/max(1.0,uViewport.y*.13);
        vec3 glass=vec3(.849,.887,.878)+vec3(.049)*exp(-drop*1.6);
        vec3 color=mix(wall,glass,ground*.63);
        float contact=exp(-pow((pixel.x-uRoot.x)/(uViewport.x*.13),2.0)-pow((pixel.y-uRoot.y-3.0)/8.0,2.0));
        color-=vec3(.045)*contact*ground;
        color-=vec3(.016,.002,.003)*exp(-pow((pixel.y-uRoot.y)/1.3,2.0));
        color+=(hash(floor(gl_FragCoord.xy))-.5)*.0017;
        gl_FragColor=vec4(mix(mix(plain,color,uScene),vec3(0),uDark),1.0);
      }`;
    function shader(type,src){const s=gl.createShader(type);gl.shaderSource(s,src);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(s));return s;}
    let program;try{program=gl.createProgram();gl.attachShader(program,shader(gl.VERTEX_SHADER,vertex));gl.attachShader(program,shader(gl.FRAGMENT_SHADER,fragment));gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))return null;}catch(_){return null;}
    const a=gl.getAttribLocation(program,'aPosition'),viewport=gl.getUniformLocation(program,'uViewport'),root=gl.getUniformLocation(program,'uRoot'),scene=gl.getUniformLocation(program,'uScene'),dark=gl.getUniformLocation(program,'uDark'),buffer=gl.createBuffer(),count=gl.getParameter(gl.MAX_VERTEX_ATTRIBS);
    gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);
    return{draw(view,world,active,isDark){
      gl.useProgram(program);for(let i=0;i<count;i++)gl.disableVertexAttribArray(i);gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.enableVertexAttribArray(a);gl.vertexAttribPointer(a,2,gl.FLOAT,false,0,0);gl.uniform2f(viewport,view.width,view.height);gl.uniform2f(root,view.cx,view.cy+.353*view.scale*world.width);gl.uniform1f(scene,active?1:0);gl.uniform1f(dark,isDark?1:0);gl.disable(gl.DEPTH_TEST);gl.depthMask(false);gl.drawArrays(gl.TRIANGLES,0,6);gl.depthMask(true);
    }};
  };
}());
