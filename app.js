(function(){
'use strict';
const {CAT_MAX,RATIO,BOOST,adjusted,linear}=globalThis.TrueCatYearsModel;
const es=document.documentElement?.lang?.toLowerCase().startsWith('es')||false;
const LIFE=[[7936,.039,11.74],[7627,.047,11.19],[7268,.041,10.72],[6968,.032,10.16],[6748,.036,9.48],[6506,.039,8.81],[6250,.039,8.15],[6005,.041,7.46],[5757,.049,6.76],[5474,.064,6.08],[5125,.069,5.46],[4770,.087,4.83],[4353,.109,4.24],[3878,.131,3.70],[3370,.170,3.17],[2797,.212,2.72],[2204,.246,2.31],[1662,.341,1.90],[1095,.404,1.63],[653,.492,1.40],[332,null,1.32]];
const $=id=>document.getElementById(id);
const clamp=n=>Math.max(0,Math.min(CAT_MAX,n));
const fmt=(n,d=1)=>Number(n).toFixed(d);
const display=(n,d=1)=>es?fmt(n,d).replace('.',','):fmt(n,d);
const vet=c=>c<=1?15*c:c<=2?15+9*(c-1):24+4*(c-2);
const stage=c=>es
 ?(c<1?'Cachorro':c<7?'Adulto joven':c<=10?'Adulto':'Sénior')
 :(c<1?'Kitten':c<7?'Young adult':c<=10?'Mature adult':'Senior');
const L=l=>LIFE[l];
const surv=c=>{const n=Math.floor(c),f=c-n;if(n>=20)return LIFE[20][0]/LIFE[0][0];return (L(n)[0]*(1-f)+L(n+1)[0]*f)/LIFE[0][0]};
let age=15,mode='adjusted';
const params=new URLSearchParams(location.search),fromQuery=Number(params.get('age'));
if(params.has('age')&&Number.isFinite(fromQuery))age=clamp(fromQuery);
if(params.get('method')==='linear')mode='linear';
function useAge(n){if(!Number.isFinite(n))return;age=clamp(n);render()}
function setInputs(){let full=Math.floor(age),m=Math.round((age-full)*12);if(m>=12){full++;m=0}if(age===CAT_MAX){full=38;m=0} $('years').value=String(full);$('months').value=String(m);$('age-slider').value=String(Math.min(38,age));}
function render(){
setInputs();
const human=mode==='adjusted'?adjusted(age):linear(age);
globalThis.TrueCatYearsCat?.setAge(age);
globalThis.TrueCatYearsTimelapse?.setAge(age);
globalThis.TrueCatYearsStorybook?.setAge(age);
$('portrait-stage').textContent=es
 ?(age<1?'Gatito en crecimiento':age<3?'Gato joven':age<10?'Gato adulto':age<20?'Gato sénior':'Gato muy longevo')
 :(age<1?'Growing kitten':age<3?'Young cat':age<10?'Adult cat':age<20?'Senior cat':'Long-lived elder');
$('result-years').textContent=display(human);$('record-share').textContent=display(age/CAT_MAX*100)+'%';$('stage').textContent=stage(age);$('progress-bar').style.width=fmt(age/CAT_MAX*100,2)+'%';
$('compare-seven').textContent=display(age*7);$('compare-vet').textContent=display(vet(age));$('compare-ours').textContent=display(adjusted(age));
$('ratio').textContent=display(RATIO,5);$('boost').textContent=display(BOOST,4);
$('mode-adjusted').classList.toggle('active',mode==='adjusted');$('mode-linear').classList.toggle('active',mode==='linear');
$('mode-adjusted').setAttribute('aria-pressed',String(mode==='adjusted'));$('mode-linear').setAttribute('aria-pressed',String(mode==='linear'));
$('mode-description').textContent=es
 ?(mode==='adjusted'?'Anclado en los récords, con un ajuste por maduración temprana. No es clínico.':'Compara el porcentaje de ambos récords. No refleja la maduración temprana.')
 :(mode==='adjusted'?'Record-anchored, with a boost for early maturity. Not clinical.':'Equal shares of each longevity record. Ignores early maturation.');
document.querySelectorAll('.presets [data-age]').forEach(b=>b.classList.toggle('active',Math.abs(Number(b.dataset.age)-age)<.04));
document.querySelectorAll('.life-story-strip .life-stage').forEach((b,i)=>{
  const active=[age<1,age>=1&&age<7,age>=7&&age<=10,age>10][i];
  b.classList.toggle('is-current',active);
  b.setAttribute('aria-pressed',String(active));
});
if(age<=20){const i=Math.floor(age),q=LIFE[Math.min(20,i)];$('survival-share').textContent=display(100*surv(age))+'%';$('death-risk').textContent=q[1]===null?'—':display(100*q[1])+'%';$('years-left').textContent=display(q[2],2)}else{$('survival-share').textContent='—';$('death-risk').textContent='—';$('years-left').textContent='—'}
drawCharts();
syncLanguageLinks();
}
// Keep age, method and portrait selection when switching languages.
function syncLanguageLinks(){
 document.querySelectorAll('[data-language-link]').forEach(link=>{
   const target=new URL(link.getAttribute('href'),location.href);
   target.searchParams.set('age',fmt(age,4));
   target.searchParams.set('method',mode);
   if($('portrait-3d')?.getAttribute('aria-pressed')==='true')target.searchParams.set('view','3d');
   else target.searchParams.delete('view');
   link.href=target.toString();
 });
}
function draw(tag,attrs,t){const el=document.createElementNS('http://www.w3.org/2000/svg',tag);Object.entries(attrs||{}).forEach(([k,v])=>el.setAttribute(k,v));if(t!=null)el.textContent=t;return el}
function baseGrid(el,maxX,maxY,xVals,yVals){const w=550,h=295,l=43,r=14,t=14,b=38;const x=v=>l+(w-l-r)*v/maxX,y=v=>h-b-(h-t-b)*v/maxY;el.replaceChildren();for(const v of yVals){el.append(draw('line',{x1:l,x2:w-r,y1:y(v),y2:y(v),stroke:'#e8dce8'}));el.append(draw('text',{x:l-8,y:y(v)+4,'font-size':'11',fill:'#85778c','text-anchor':'end'},v))}for(const v of xVals)el.append(draw('text',{x:x(v),y:h-11,'font-size':'11',fill:'#7e8b7e','text-anchor':'middle'},v));return{x,y}}
function points(fn,maxX,steps,x,y){let d='';for(let i=0;i<=steps;i++){const a=i*maxX/steps;d+=(i?'L':'M')+x(a).toFixed(2)+','+y(fn(a)).toFixed(2)}return d}
function drawCharts(){
 const el=$('age-chart'),g=baseGrid(el,38.1,270,[0,10,20,30,38],[0,60,120,180,240]);
 const curves=[[c=>7*c,'#b7bfc0',2,'5 5'],[linear,'#4c9893',2.6,'6 5'],[adjusted,'#d39a53',4,'']];
 for(const [fn,color,width,dash] of curves){const p=draw('path',{d:points(fn,CAT_MAX,180,g.x,g.y),stroke:color,'stroke-width':width,fill:'none','stroke-linecap':'round'});if(dash)p.setAttribute('stroke-dasharray',dash);el.append(p)}
 const v=mode==='adjusted'?adjusted(age):linear(age);
 el.append(draw('line',{x1:g.x(age),x2:g.x(age),y1:g.y(v),y2:g.y(0),stroke:'#829a9c','stroke-dasharray':'3 5'}));
 el.append(draw('circle',{cx:g.x(age),cy:g.y(v),r:6,fill:'#d39a53',stroke:'#fffdf7','stroke-width':2}));
 const chart=$('survival-chart'),c=baseGrid(chart,20,100,[0,5,10,15,20],[0,25,50,75,100]);
 const d=points(n=>100*surv(n),20,100,c.x,c.y);
 chart.append(draw('path',{d:d+'L'+c.x(20)+','+c.y(0)+'L'+c.x(0)+','+c.y(0)+'Z',fill:'#e2eeec'}));
 chart.append(draw('path',{d:d,fill:'none',stroke:'#4a9c9e','stroke-width':3.5,'stroke-linecap':'round'}));
 if(age<=20)chart.append(draw('circle',{cx:c.x(age),cy:c.y(100*surv(age)),r:6,fill:'#d97950',stroke:'#fff','stroke-width':2}));
}
$('years').addEventListener('change',()=>{const n=Number($('years').value);if(Number.isFinite(n))useAge(n+Number($('months').value)/12)});
$('months').addEventListener('change',()=>useAge(Number($('years').value)+Number($('months').value)/12));
$('age-slider').addEventListener('input',()=>useAge(Number($('age-slider').value)));
document.querySelectorAll('[data-age]').forEach(b=>b.addEventListener('click',()=>useAge(Number(b.dataset.age))));
$('mode-adjusted').addEventListener('click',()=>{mode='adjusted';render()});
$('mode-linear').addEventListener('click',()=>{mode='linear';render()});
$('reset-age').addEventListener('click',()=>{mode='adjusted';useAge(15)});
$('copy-link').addEventListener('click',async()=>{const u=new URL(location.href);u.searchParams.set('age',fmt(age,4));u.searchParams.set('method',mode);if(document.getElementById('portrait-3d')?.getAttribute('aria-pressed')==='true')u.searchParams.set('view','3d');else u.searchParams.delete('view');const b=$('copy-link');try{await navigator.clipboard.writeText(u.toString());b.textContent=es?'Enlace copiado ✓':'Link copied ✓';$('copy-status').textContent=es?'Enlace copiado al portapapeles.':'Link copied to clipboard.'}catch(e){b.textContent=es?'No se puede copiar':'Copy unavailable';$('copy-status').textContent=es?'No se ha podido copiar. Utiliza la dirección de la página.':'Copy is unavailable; use the page URL.'}setTimeout(()=>{b.innerHTML=(es?'Compartir':'Share')+' <span aria-hidden="true">↗</span>'},2000)});
// Keep the 3D character beside the slider on small screens. On desktop,
 // return it to the second grid column; WebGL resizes with its container.
 const mobile=matchMedia('(max-width:700px)');
 const character=document.querySelector('.scene-panel');
 const grid=document.querySelector('.experience-grid');
 const ageFields=document.querySelector('.experience-control .age-fields');
 const placeCharacter=()=>{
   if(!character||!grid||!ageFields)return;
   if(mobile.matches)ageFields.before(character);
   else grid.append(character);
 };
 placeCharacter();
 if(mobile.addEventListener)mobile.addEventListener('change',placeCharacter);
 else if(mobile.addListener)mobile.addListener(placeCharacter);
 const tbody=$('age-table');for(const y of [1,2,5,10,15,20,25,30,38]){const tr=document.createElement('tr');for(const v of [y,display(adjusted(y)),display(vet(y)),display(y*7)]){const td=document.createElement('td');td.textContent=v;tr.append(td)}tbody.append(tr)}
render();
})();