/*
 * A Cat Through Time: tiny, dependency-free WebGL 3D portrait.
 * Illustration only: fur colour, proportions and posture are NOT biomarkers.
 */
(function(root){
'use strict';
const canvas=document.getElementById('cat-canvas'),viewport=document.getElementById('cat-viewport');
if(!canvas||!viewport)return;
const CAT_MAX=root.TrueCatYearsModel.CAT_MAX;
const params=new URLSearchParams(location.search);
let target=params.has('age')?Number(params.get('age')):15;
target=Number.isFinite(target)?Math.max(0,Math.min(CAT_MAX,target)):15;
let age=target,yaw=.13,yawTarget=.13,raf=0,visible=true,failed=false,dragging=false,lastX=0;
const reduce=matchMedia('(prefers-reduced-motion: reduce)');
const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
const lerp=(a,b,t)=>a+(b-a)*t;
const smooth=(a,b,x)=>{let t=clamp((x-a)/(b-a));return t*t*(3-2*t)};
const color=h=>[0,2,4].map(i=>parseInt(h.slice(i+1,i+3),16)/255);
const blend=(a,b,t)=>a.map((v,i)=>lerp(v,b[i],t));
const fur=color('#b88e68'),silver=color('#929b95'),light=color('#f0d5b5');
const greyLight=color('#daddd5'),deep=color('#725b48'),nose=color('#cf897f');
const iris=color('#94ad77'),pupil=color('#263731'),white=color('#fff9e8');
let gl;
try{gl=canvas.getContext('webgl',{alpha:true,antialias:true,powerPreference:'low-power'});}catch(e){return}
if(!gl)return;
function shader(type,source){
 let s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);
 if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw new Error('shader');return s;
}
let program;
try{
 let v=shader(gl.VERTEX_SHADER,'attribute vec3 aPos;attribute vec3 aNorm;uniform mat4 uP;uniform mat4 uV;uniform mat4 uM;varying vec3 vN;void main(){vN=normalize(mat3(uM)*aNorm);gl_Position=uP*uV*uM*vec4(aPos,1.0);}');
 let f=shader(gl.FRAGMENT_SHADER,'precision mediump float;uniform vec3 uColor;varying vec3 vN;void main(){vec3 n=normalize(vN);float d=max(dot(n,normalize(vec3(-0.55,0.9,1.2))),0.0);float s=max(dot(n,normalize(vec3(0.8,0.4,-0.6))),0.0);float rim=pow(1.0-abs(n.z),2.0);gl_FragColor=vec4(uColor*(0.54+0.40*d+0.13*s)+vec3(0.10,0.09,0.07)*rim,1.0);}');
 program=gl.createProgram();gl.attachShader(program,v);gl.attachShader(program,f);gl.linkProgram(program);
 if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw new Error('link');
 gl.deleteShader(v);gl.deleteShader(f);
}catch(e){return}
gl.useProgram(program);gl.enable(gl.DEPTH_TEST);
const attr={p:gl.getAttribLocation(program,'aPos'),n:gl.getAttribLocation(program,'aNorm')};
const uniform={p:gl.getUniformLocation(program,'uP'),v:gl.getUniformLocation(program,'uV'),m:gl.getUniformLocation(program,'uM'),c:gl.getUniformLocation(program,'uColor')};
function makeMesh(vertices,normals,indices){
 const a=gl.createBuffer(),b=gl.createBuffer(),c=gl.createBuffer();
 gl.bindBuffer(gl.ARRAY_BUFFER,a);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(vertices),gl.STATIC_DRAW);
 gl.bindBuffer(gl.ARRAY_BUFFER,b);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(normals),gl.STATIC_DRAW);
 gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,c);gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,new Uint16Array(indices),gl.STATIC_DRAW);
 return {a,b,c,count:indices.length};
}
function sphere(){
 let v=[],n=[],ind=[],rings=20,sides=28;
 for(let i=0;i<=rings;i++){let p=Math.PI*i/rings;for(let j=0;j<=sides;j++){
 let a=Math.PI*2*j/sides,x=Math.sin(p)*Math.cos(a),y=Math.cos(p),z=Math.sin(p)*Math.sin(a);v.push(x,y,z);n.push(x,y,z)}}
 for(let i=0;i<rings;i++)for(let j=0;j<sides;j++){let a=i*(sides+1)+j,b=a+sides+1;ind.push(a,a+1,b,a+1,b+1,b)}
 return makeMesh(v,n,ind);
}
function cone(){
 let v=[],n=[],ind=[],s=24;
 for(let i=0;i<=s;i++){let t=Math.PI*2*i/s,x=Math.cos(t),z=Math.sin(t);v.push(x,-.5,z,0,.5,0);n.push(x*.72,.7,z*.72,x*.72,.7,z*.72)}
 for(let i=0;i<s;i++)ind.push(2*i,2*i+1,2*i+2);
 return makeMesh(v,n,ind);
}
function tailMesh(){
 const points=[[0,0,0,.19],[-.27,.05,0,.19],[-.53,.26,0,.18],[-.77,.51,0,.16],[-.92,.77,0,.14],[-.95,1.03,0,.12],[-.82,1.2,0,.1],[-.62,1.24,0,.07],[-.51,1.12,0,.015]];
 let v=[],n=[],ind=[],s=10;
 for(let i=0;i<points.length;i++){let p=points[i],a=points[Math.max(i-1,0)],b=points[Math.min(i+1,points.length-1)],dx=b[0]-a[0],dy=b[1]-a[1],l=Math.hypot(dx,dy)||1;
 for(let j=0;j<=s;j++){let t=2*Math.PI*j/s,nx=-dy/l*Math.cos(t),ny=dx/l*Math.cos(t),nz=Math.sin(t);v.push(p[0]+p[3]*nx,p[1]+p[3]*ny,p[2]+p[3]*nz);n.push(nx,ny,nz)}}
 for(let i=0;i<points.length-1;i++)for(let j=0;j<s;j++){let a=i*(s+1)+j,b=a+s+1;ind.push(a,a+1,b,a+1,b+1,b)}
 return makeMesh(v,n,ind);
}
const ball=sphere(),ear=cone(),tail=tailMesh();
const T=(x,y,z)=>[1,0,0,0,0,1,0,0,0,0,1,0,x,y,z,1];
const S=(x,y,z)=>[x,0,0,0,0,y,0,0,0,0,z,0,0,0,0,1];
const Y=a=>[Math.cos(a),0,-Math.sin(a),0,0,1,0,0,Math.sin(a),0,Math.cos(a),0,0,0,0,1];
const Z=a=>[Math.cos(a),Math.sin(a),0,0,-Math.sin(a),Math.cos(a),0,0,0,0,1,0,0,0,0,1];
function mul(a,b){let o=Array(16).fill(0);for(let c=0;c<4;c++)for(let r=0;r<4;r++)for(let k=0;k<4;k++)o[c*4+r]+=a[k*4+r]*b[c*4+k];return o}
let rootM=Y(yaw);
function draw(mesh,x,y,z,sx,sy,sz,col,turn=0,roll=0){
 const m=mul(rootM,mul(T(x,y,z),mul(Y(turn),mul(Z(roll),S(sx,sy,sz)))));
 gl.uniformMatrix4fv(uniform.m,false,new Float32Array(m));
 gl.uniform3fv(uniform.c,new Float32Array(col));
 gl.bindBuffer(gl.ARRAY_BUFFER,mesh.a);gl.enableVertexAttribArray(attr.p);gl.vertexAttribPointer(attr.p,3,gl.FLOAT,false,0,0);
 gl.bindBuffer(gl.ARRAY_BUFFER,mesh.b);gl.enableVertexAttribArray(attr.n);gl.vertexAttribPointer(attr.n,3,gl.FLOAT,false,0,0);
 gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,mesh.c);gl.drawElements(gl.TRIANGLES,mesh.count,gl.UNSIGNED_SHORT,0);
}
const orb=(x,y,z,a,b,c,col,turn=0,roll=0)=>draw(ball,x,y,z,a,b,c,col,turn,roll);
function resize(){
 let rect=canvas.getBoundingClientRect();if(!rect.width||!rect.height)return;
 let dpr=Math.min(root.devicePixelRatio||1,1.6),w=Math.max(1,Math.round(rect.width*dpr)),h=Math.max(1,Math.round(rect.height*dpr));
 if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h}
 gl.viewport(0,0,w,h);
 let f=1/Math.tan(.72/2),near=.1,far=40,rd=1/(near-far);
 let p=[f/(w/h),0,0,0,0,f,0,0,0,0,(far+near)*rd,-1,0,0,2*far*near*rd,0];
 gl.uniformMatrix4fv(uniform.p,false,new Float32Array(p));
 gl.uniformMatrix4fv(uniform.v,false,new Float32Array(T(0,-.03,-6.7)));
}
function paint(time){
 resize();
 gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
 const young=1-smooth(.3,4,age),senior=smooth(12,33,age),veryOld=smooth(20,CAT_MAX,age);
 const coat=blend(fur,silver,senior*.65+veryOld*.25),pale=blend(light,greyLight,senior*.84);
 const dark=blend(deep,color('#738078'),senior*.55);
 const head=1+.19*young-.045*senior,body=1-.17*young-.025*senior;
 const breathe=reduce.matches?0:Math.sin(time*.0013)*.014;
 const headY=.91-.11*senior+breathe;
 const blink=reduce.matches?0:Math.pow(clamp(1-Math.abs((time%6300)-3900)/150),2)*.94;
 const eye=1+.25*young-.06*senior,open=1-blink,zH=.32;
 rootM=Y(yaw+(reduce.matches?0:Math.sin(time*.0006)*.025));
 // Floor shadow and continuous curling tail.
 orb(0,-1.56,-.24,1.2,.03,.7,[.68,.71,.66]);
 draw(tail,-.73,-1.31,-.22,1,1,1,dark,.08+(reduce.matches?0:Math.sin(time*.0014)*.04));
 // Body, haunches, neck and bib.
 orb(0,-.60,0,.73*body,1.0*body+breathe,.62*body,coat);
 orb(0,-.64,.51,.52*body,.72*body,.19,pale);
 for(const sign of [-1,1])orb(sign*.59,-1.03,-.06,.36*body,.46*body,.4*body,coat);
 for(const sign of [-1,1]){
  orb(sign*.4,-1.03,.43,.215,.45,.22,coat);
  orb(sign*.415,-1.45,.63,.29,.14,.29,pale);
  for(let i=-1;i<=1;i++)orb(sign*.415+i*.11,-1.49,.82,.059,.029,.068,pale);
 }
 // Full 3D head, forehead tabby stripes.
 orb(0,headY,zH,.75*head,.65*head,.59*head,coat);
 for(const sign of [-1,1])orb(sign*.19*head,headY+.44*head,zH+.43*head,.052,.17,.026,dark,0,-sign*.32);
 orb(0,headY+.45*head,zH+.45*head,.055,.20,.025,dark);
 // Three-dimensional ears, with inset coral colouring.
 for(const sign of [-1,1]){
  let x=sign*.49*head,y=headY+.67*head+.21;
  draw(ear,x,y,zH-.04,.205*head,.52*head,.13,coat,0,-sign*.17);
  draw(ear,x,y-.015,zH+.06,.112*head,.35*head,.04,blend(nose,pale,senior*.3),0,-sign*.17);
 }
 // Large kitten eyes become more proportional as the cat grows up.
 for(const sign of [-1,1]){
  let x=sign*.288*head,y=headY+.12*head,z=zH+.516*head;
  orb(x,y,z,.162*eye,.19*eye*open,.077,pale);
  orb(x,y,z+.062,.12*eye,.158*eye*open,.052,iris);
  orb(x,y,z+.11,.038*eye,.132*eye*open,.022,pupil);
  orb(x-.03*eye,y+.054*open,z+.13,.027,.032*open+.001,.011,white);
  if(senior>.02)orb(sign*.61*head,headY-.13,zH+.28*head,.125*senior,.1*senior,.07*senior,greyLight);
 }
 // Cream muzzle, nose, mouth and six slender whiskers.
 orb(-.135,headY-.24,zH+.555*head,.215,.152,.14,pale);
 orb(.135,headY-.24,zH+.555*head,.215,.152,.14,pale);
 draw(ear,0,headY-.21,zH+.73*head,.09,.096,.055,nose,0,Math.PI);
 orb(-.08,headY-.35,zH+.68*head,.085,.01,.012,dark,0,-.15);
 orb(.08,headY-.35,zH+.68*head,.085,.01,.012,dark,0,.15);
 for(const sign of [-1,1])for(let i=-1;i<=1;i++)
  orb(sign*.46,headY-.265+i*.104,zH+.67*head,.27,.005,.006,blend(white,greyLight,senior*.25),0,sign*i*.16);
 orb(0,-.35,.693,.135,.16,.029,pale);
}
function tick(t){
 raf=0;if(failed||document.hidden||!visible)return;
 if(reduce.matches){age=target;yaw=yawTarget;}else{age=lerp(age,target,.11);if(Math.abs(target-age)<.005)age=target;yaw=lerp(yaw,yawTarget,.12)}
 try{paint(t)}catch(e){failed=true;viewport.classList.remove('webgl-ready');return}
 if(!reduce.matches)raf=requestAnimationFrame(tick);
}
function request(){if(!raf&&!document.hidden&&visible&&!failed)raf=requestAnimationFrame(tick)}
function setAge(value){const n=Number(value);if(!Number.isFinite(n))return;target=clamp(n,0,CAT_MAX);if(reduce.matches)age=target;request()}
root.TrueCatYearsCat={setAge};
canvas.addEventListener('pointerdown',e=>{if(e.button!==0)return;dragging=true;lastX=e.clientX;canvas.setPointerCapture(e.pointerId)});
canvas.addEventListener('pointermove',e=>{if(!dragging)return;yawTarget=clamp(yawTarget+(e.clientX-lastX)*.009,-.55,.55);lastX=e.clientX;request()});
for(const evt of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(evt,()=>{dragging=false});
canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();failed=true;cancelAnimationFrame(raf);raf=0;viewport.classList.remove('webgl-ready')});
canvas.addEventListener('webglcontextrestored',()=>{viewport.classList.remove('webgl-ready')});
document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelAnimationFrame(raf);raf=0}else request()});
if('IntersectionObserver' in root)new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(visible)request();else{cancelAnimationFrame(raf);raf=0}}).observe(viewport);
if('ResizeObserver' in root)new ResizeObserver(request).observe(viewport);else root.addEventListener('resize',request);
if(reduce.addEventListener)reduce.addEventListener('change',()=>{cancelAnimationFrame(raf);raf=0;request()});
try{paint(0);viewport.classList.add('webgl-ready');request()}catch(e){failed=true;viewport.classList.remove('webgl-ready')}
})(globalThis);
