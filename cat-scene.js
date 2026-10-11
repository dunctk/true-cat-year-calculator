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
// The original anime-storybook cat keeps the same 3D geometry and growth model.
// Quiet, ink-and-watercolour anime tones. Avoid high-contrast robotic eyeballs.
const fur=color('#ead8c5'),silver=color('#aeb7b8'),light=color('#fff2e3');
const greyLight=color('#e0e2de'),deep=color('#7c7688'),nose=color('#d68b9e');
const iris=color('#8cbaa9'),pupil=color('#2f4550'),white=color('#fff9ea');
const ribbon=color('#b67894'),ribbonDark=color('#a96f8c'),gold=color('#d8b37b');
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
 let f=shader(gl.FRAGMENT_SHADER,'precision mediump float;uniform vec3 uColor;varying vec3 vN;void main(){vec3 n=normalize(vN);float d=dot(n,normalize(vec3(-0.60,0.95,1.15)));float shade=0.78+0.17*smoothstep(-0.08,0.50,d)+0.05*smoothstep(0.50,0.93,d);gl_FragColor=vec4(uColor*shade,1.0);}');
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
// Ears are triangular prism meshes, not pointed cones.
function triangleEar(){
  const v=[-.19,-.12,.045,.19,-.12,.045,-.03,.43,0,-.17,-.12,-.12,.17,-.12,-.12,-.03,.43,-.11];
  const n=[0,0,1,0,0,1,0,0,1,0,0,-1,0,0,-1,0,0,-1];
  return makeMesh(v,n,[0,1,2,5,4,3,0,3,4,0,4,1,1,4,5,1,5,2,2,5,3,2,3,0]);
}
function innerEar(){
  return makeMesh([-.12,-.085,.067,.12,-.085,.067,-.028,.293,.073],[0,0,1,0,0,1,0,0,1],[0,1,2]);
}
function triangleNose(){
  return makeMesh([-.066,0,0,.066,0,0,0,-.074,.002],[0,0,1,0,0,1,0,0,1],[0,1,2]);
}
function smoothPath(points,sections=6){
  const out=[];
  for(let i=0;i<points.length-1;i++){
    const a=points[Math.max(0,i-1)],b=points[i],c=points[i+1],d=points[Math.min(points.length-1,i+2)];
    for(let j=0;j<sections;j++){
      const t=j/sections,t2=t*t,t3=t2*t;
      out.push(b.map((v,k)=>.5*((2*v)+(-a[k]+c[k])*t+(2*a[k]-5*v+4*c[k]-d[k])*t2+(-a[k]+3*v-3*c[k]+d[k])*t3)));
    }
  }
  out.push(points[points.length-1]);
  return out;
}
function tube(points,side=9){
 const verts=[],norms=[],inds=[];
 for(let i=0;i<points.length;i++){
  const p=points[i],a=points[Math.max(i-1,0)],b=points[Math.min(i+1,points.length-1)],dx=b[0]-a[0],dy=b[1]-a[1],len=Math.hypot(dx,dy)||1;
  for(let j=0;j<=side;j++){
   const t=2*Math.PI*j/side,nx=-dy/len*Math.cos(t),ny=dx/len*Math.cos(t),nz=Math.sin(t);
   verts.push(p[0]+p[3]*nx,p[1]+p[3]*ny,p[2]+p[3]*nz);norms.push(nx,ny,nz);
  }
 }
 for(let i=0;i<points.length-1;i++)for(let j=0;j<side;j++){
   const a=i*(side+1)+j,b=a+side+1;inds.push(a,a+1,b,b,a+1,b+1);
 }
 return makeMesh(verts,norms,inds);
}
const ball=sphere(),ear=triangleEar(),earPink=innerEar(),noseShape=triangleNose();
const tail=tube(smoothPath([[-.43,-1.20,-.30,.14],[-.74,-1.21,-.36,.135],[-.99,-1.03,-.35,.115],[-1.10,-.68,-.34,.10],[-1.05,-.34,-.33,.09],[-.88,-.23,-.34,.075],[-.76,-.31,-.36,.008]]));
const whisker=tube(smoothPath([[0,0,0,.010],[.12,.01,0,.008],[.28,.055,-.015,.005],[.42,.13,-.035,.002]],4),6);
const mouthCurve=tube([[0,0,0,.007],[.046,-.024,.005,.006],[.085,-.015,0,.002]],6);
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
 resize();gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
 const p=root.TrueCatYearsGrowth.pose(age);
 const kitten=p.kitten,senior=p.senior,ratio=p.overallScale;
 const coat=blend(fur,silver,p.coatSilver*.8),warm=blend(color('#f5e9d9'),silver,p.coatSilver*.38),pale=blend(light,silver,p.coatSilver*.3);
 const ink=blend(deep,silver,senior*.26);
 const breathe=reduce.matches?0:Math.sin(time*.0014)*.006;
 const blink=reduce.matches?0:Math.pow(clamp(1-Math.abs((time%6700)-3420)/115),2);
 const headScale=1+.18*kitten-.01*senior,headY=.72-.12*kitten-.04*senior;
 const rotation=Y(yaw+(reduce.matches?0:Math.sin(time*.00055)*.008));
 // Shadow is independent from the root growth scale.
 rootM=rotation;
 orb(0,-1.545,-.32,Math.max(.45,.93*ratio),.02,.45*ratio,color('#d5bbc0'));
 // Preserve the existing life-stage growth system and grounded feet.
 rootM=mul(rotation,mul(T(0,p.groundOffset,0),S(ratio,ratio,ratio)));
 // Tapered curved tail behind the silhouette (not a stiff hooked stick).
 draw(tail,0,0,0,1,1,1,blend(coat,ink,.09),0,reduce.matches?0:Math.sin(time*.001)*.045);
 // Quiet, unified sitting-cat silhouette with tucked hips and narrow forelegs.
 orb(0,-.62,0,.55*p.bodyWidth,.87*p.bodyHeight+breathe,.47*p.bodyWidth,coat);
 orb(0,-.63,.30,.39*p.bodyWidth,.70*p.bodyHeight,.22,warm);
 for(const sign of [-1,1]){
   orb(sign*.435,-1.075,-.11,.27,.37,.29,coat);
   const h=.42*p.legLength;
   orb(sign*.335,-1.41+h,.385,.145,h,.17,coat);
   orb(sign*.335,-1.46,.535,.20,.094,.225,coat);
   // Just two toe hints; no disconnected button toes.
   orb(sign*.335-.067,-1.505,.716,.006,.015,.015,ink);
   orb(sign*.335+.067,-1.505,.716,.006,.015,.015,ink);
 }
 orb(0,.05,.05,.315,.43,.295,coat);
 // A smaller head with a feline muzzle; no oversized round robot mask.
 const headZ=.265;
 orb(0,headY,headZ,.555*headScale,.495*headScale,.440*headScale,coat);
 // Bespoke triangular ears, painted inner panels.
 for(const sign of [-1,1]){
   const x=sign*.350*headScale,y=headY+.427*headScale;
   draw(ear,x,y,headZ-.08,.85*headScale,.86*headScale,.85*headScale,coat,0,sign*-.15);
   draw(earPink,x,y,headZ-.012,.85*headScale,.79*headScale,.85*headScale,color('#dba6ae'),0,sign*-.15);
 }
 // Embedded almond eyes, no protruding bulbs, eyeliner or uncanny smile.
 const open=1-.98*blink;
 for(const sign of [-1,1]){
   const ex=sign*.217*headScale,ey=headY+.008*headScale,ez=headZ+.440*headScale;
   orb(ex,ey,ez,.113*headScale,.105*headScale*open,.018,ink,0,sign*-.07);
   orb(ex,ey,ez+.012,.101*headScale,.090*headScale*open,.015,light,0,sign*-.07);
   orb(ex-sign*.011,ey-.003,ez+.027,.069*headScale,.086*headScale*open,.009,iris);
   orb(ex-sign*.011,ey-.003,ez+.038,.027*headScale,.070*headScale*open,.007,pupil);
   orb(ex-sign*.033,ey+.023*open,ez+.045,.018,.022*open+.001,.005,white);
 }
 // Short flat cheeks, actual triangular nose and only the hint of a mouth.
 const muzzleZ=headZ+.390*headScale;
 orb(-.108*headScale,headY-.209*headScale,muzzleZ,.16*headScale,.082*headScale,.055,pale);
 orb(.108*headScale,headY-.209*headScale,muzzleZ,.16*headScale,.082*headScale,.055,pale);
 draw(noseShape,0,headY-.170*headScale,muzzleZ+.065,headScale,headScale,headScale,nose);
 orb(0,headY-.253*headScale,muzzleZ+.063,.008,.052,.007,ink);
 for(const sign of [-1,1]){
   draw(mouthCurve,sign*.01,headY-.295*headScale,muzzleZ+.073,sign,.9,1,ink,0,sign*-.08);
   for(let i=0;i<2;i++){
     draw(whisker,sign*.19,headY-.195-i*.073,muzzleZ+.018,sign*(.72+i*.05),.65,1,blend(light,ink,.4),0,-sign*(.20+i*.15));
   }
 }
 // Very small silk bow, integrated into neck.
 orb(0,.16,.340,.31,.047,.060,ribbon);
 for(const sign of [-1,1])orb(sign*.100,.13,.407,.108,.063,.028,ribbon,0,sign*.17);
 orb(0,.115,.444,.035,.036,.025,gold);
 // Gentle silver cheek patches only for late life, without implying disease.
 if(senior>.02)for(const sign of [-1,1]){
   orb(sign*.42*headScale,headY-.194,headZ+.220*headScale,.062*senior,.055*senior,.018,blend(warm,silver,.5));
 }
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
