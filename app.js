(function(){
'use strict';
const {CAT_MAX,RATIO,BOOST,adjusted,linear}=globalThis.TrueCatYearsModel;
const LIFE=[[7936,.039,11.74],[7627,.047,11.19],[7268,.041,10.72],[6968,.032,10.16],[6748,.036,9.48],[6506,.039,8.81],[6250,.039,8.15],[6005,.041,7.46],[5757,.049,6.76],[5474,.064,6.08],[5125,.069,5.46],[4770,.087,4.83],[4353,.109,4.24],[3878,.131,3.70],[3370,.170,3.17],[2797,.212,2.72],[2204,.246,2.31],[1662,.341,1.90],[1095,.404,1.63],[653,.492,1.40],[332,null,1.32]];
const $=id=>document.getElementById(id);
const clamp=n=>Math.max(0,Math.min(CAT_MAX,n));
const fmt=(n,d=1)=>Number(n).toFixed(d);
const vet=c=>c<=1?15*c:c<=2?15+9*(c-1):24+4*(c-2);
const stage=c=>c<1?'Kitten':c<7?'Young adult':c<=10?'Mature adult':'Senior';
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
$('result-years').textContent=fmt(human);$('record-share').textContent=fmt(age/CAT_MAX*100)+'%';$('stage').textContent=stage(age);$('progress-bar').style.width=fmt(age/CAT_MAX*100,2)+'%';
$('compare-seven').textContent=fmt(age*7);$('compare-vet').textContent=fmt(vet(age));$('compare-ours').textContent=fmt(adjusted(age));
$('ratio').textContent=fmt(RATIO,5);$('boost').textContent=fmt(BOOST,4);
$('mode-adjusted').classList.toggle('active',mode==='adjusted');$('mode-linear').classList.toggle('active',mode==='linear');
$('mode-adjusted').setAttribute('aria-pressed',String(mode==='adjusted'));$('mode-linear').setAttribute('aria-pressed',String(mode==='linear'));
$('mode-description').textContent=mode==='adjusted'?'A teenage analogy at age two, then a fading early-maturity boost over the longevity-record baseline. Illustrative, not clinical.':'An equal percentage of each species’ record lifespan. Simple, but it does not reflect rapid early feline development.';
document.querySelectorAll('[data-age]').forEach(b=>b.classList.toggle('active',Math.abs(Number(b.dataset.age)-age)<.04));
if(age<=20){const i=Math.floor(age),q=LIFE[Math.min(20,i)];$('survival-share').textContent=fmt(100*surv(age))+'%';$('death-risk').textContent=q[1]===null?'—':fmt(100*q[1])+'%';$('years-left').textContent=fmt(q[2],2)}else{$('survival-share').textContent='—';$('death-risk').textContent='—';$('years-left').textContent='—'}
drawCharts();
}
function draw(tag,attrs,t){const el=document.createElementNS('http://www.w3.org/2000/svg',tag);Object.entries(attrs||{}).forEach(([k,v])=>el.setAttribute(k,v));if(t!=null)el.textContent=t;return el}
function baseGrid(el,maxX,maxY,xVals,yVals){const w=550,h=295,l=43,r=14,t=14,b=38;const x=v=>l+(w-l-r)*v/maxX,y=v=>h-b-(h-t-b)*v/maxY;el.replaceChildren();for(const v of yVals){el.append(draw('line',{x1:l,x2:w-r,y1:y(v),y2:y(v),stroke:'#dfe4db'}));el.append(draw('text',{x:l-8,y:y(v)+4,'font-size':'11',fill:'#7e8b7e','text-anchor':'end'},v))}for(const v of xVals)el.append(draw('text',{x:x(v),y:h-11,'font-size':'11',fill:'#7e8b7e','text-anchor':'middle'},v));return{x,y}}
function points(fn,maxX,steps,x,y){let d='';for(let i=0;i<=steps;i++){const a=i*maxX/steps;d+=(i?'L':'M')+x(a).toFixed(2)+','+y(fn(a)).toFixed(2)}return d}
function drawCharts(){
 const el=$('age-chart'),g=baseGrid(el,38.1,270,[0,10,20,30,38],[0,60,120,180,240]);
 const curves=[[c=>7*c,'#b8bcb1',2,'5 5'],[linear,'#608b74',2.6,'6 5'],[adjusted,'#d97950',4,'']];
 for(const [fn,color,width,dash] of curves){const p=draw('path',{d:points(fn,CAT_MAX,180,g.x,g.y),stroke:color,'stroke-width':width,fill:'none','stroke-linecap':'round'});if(dash)p.setAttribute('stroke-dasharray',dash);el.append(p)}
 const v=mode==='adjusted'?adjusted(age):linear(age);
 el.append(draw('line',{x1:g.x(age),x2:g.x(age),y1:g.y(v),y2:g.y(0),stroke:'#b5886a','stroke-dasharray':'3 5'}));
 el.append(draw('circle',{cx:g.x(age),cy:g.y(v),r:6,fill:'#d97950',stroke:'#fffdf7','stroke-width':2}));
 const chart=$('survival-chart'),c=baseGrid(chart,20,100,[0,5,10,15,20],[0,25,50,75,100]);
 const d=points(n=>100*surv(n),20,100,c.x,c.y);
 chart.append(draw('path',{d:d+'L'+c.x(20)+','+c.y(0)+'L'+c.x(0)+','+c.y(0)+'Z',fill:'#e7ece4'}));
 chart.append(draw('path',{d:d,fill:'none',stroke:'#537d61','stroke-width':3.5,'stroke-linecap':'round'}));
 if(age<=20)chart.append(draw('circle',{cx:c.x(age),cy:c.y(100*surv(age)),r:6,fill:'#d97950',stroke:'#fff','stroke-width':2}));
}
$('years').addEventListener('change',()=>{const n=Number($('years').value);if(Number.isFinite(n))useAge(n+Number($('months').value)/12)});
$('months').addEventListener('change',()=>useAge(Number($('years').value)+Number($('months').value)/12));
$('age-slider').addEventListener('input',()=>useAge(Number($('age-slider').value)));
document.querySelectorAll('[data-age]').forEach(b=>b.addEventListener('click',()=>useAge(Number(b.dataset.age))));
$('mode-adjusted').addEventListener('click',()=>{mode='adjusted';render()});
$('mode-linear').addEventListener('click',()=>{mode='linear';render()});
$('reset-age').addEventListener('click',()=>{mode='adjusted';useAge(15)});
$('copy-link').addEventListener('click',async()=>{const u=new URL(location.href);u.searchParams.set('age',fmt(age,4));u.searchParams.set('method',mode);const b=$('copy-link');try{await navigator.clipboard.writeText(u.toString());b.textContent='Link copied ✓';$('copy-status').textContent='Link copied to clipboard.'}catch(e){b.textContent='Copy unavailable';$('copy-status').textContent='Copy is unavailable; use the page URL.'}setTimeout(()=>{b.innerHTML='Copy shareable link <span aria-hidden="true">↗</span>'},2000)});
const tbody=$('age-table');for(const y of [1,2,5,10,15,20,25,30,38]){const tr=document.createElement('tr');for(const v of [y,fmt(adjusted(y)),fmt(vet(y)),fmt(y*7)]){const td=document.createElement('td');td.textContent=v;tr.append(td)}tbody.append(tr)}
render();
})();