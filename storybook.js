/**
 * Original anime storybook portrait. The illustrated cat is the default;
 * native WebGL remains an opt-in alternative. No assets or network calls.
 * The visual age progression is an artistic metaphor, not a medical claim.
 */
(function(root){
  'use strict';
  const viewport=document.getElementById('cat-viewport');
  const whole=document.getElementById('anime-whole');
  const head=document.getElementById('anime-head');
  const silver=document.getElementById('anime-silver');
  const animeBtn=document.getElementById('portrait-anime');
  const threeDBtn=document.getElementById('portrait-3d');
  const story=document.getElementById('scene-story');
  const chapter=document.getElementById('story-chapter');
  if(!viewport||!whole||!head||!animeBtn||!threeDBtn)return;
  const maxAge=root.TrueCatYearsModel.CAT_MAX;
  const clamp=(n,a,b)=>Math.min(b,Math.max(a,n));
  const stories=[
    {max:1,title:'01 / KITTEN',text:'Kitten · under 1 year'},
    {max:3,title:'02 / YOUNG',text:'Young · 1–2 years'},
    {max:10,title:'03 / ADULT',text:'Adult · 3–9 years'},
    {max:20,title:'04 / SENIOR',text:'Senior · 10–19 years'},
    {max:Infinity,title:'05 / LONG-LIVED',text:'Long-lived · 20+ years'}
  ];
  let age=15;
  let mode='anime';
  const supports3D=viewport.classList.contains('webgl-ready');
  threeDBtn.disabled=!supports3D;
  if(!supports3D)threeDBtn.title='3D is unavailable in this browser';
  function setMode(next){
    if(next==='3d'&&!viewport.classList.contains('webgl-ready'))return;
    mode=next==='3d'?'3d':'anime';
    viewport.classList.toggle('storybook-mode',mode==='anime');
    animeBtn.classList.toggle('active',mode==='anime');
    threeDBtn.classList.toggle('active',mode==='3d');
    animeBtn.setAttribute('aria-pressed',String(mode==='anime'));
    threeDBtn.setAttribute('aria-pressed',String(mode==='3d'));
    root.TrueCatYearsCat?.setActive?.(mode==='3d');
    if(mode==='3d')root.TrueCatYearsCat?.setAge(age);
  }
  function setAge(value){
    const next=Number(value);
    if(!Number.isFinite(next))return;
    age=clamp(next,0,maxAge);
    const p=root.TrueCatYearsGrowth.pose(age);
    // Illustration uses a gentler 58–100% growth for character legibility;
    // this does NOT modify the physical growth model or the age conversion.
    const size=.58+.42*(p.overallScale-.43)/.57;
    whole.setAttribute('transform',`translate(263 456) scale(${size.toFixed(4)}) translate(-263 -456)`);
    const headSize=1+.14*p.kitten-.025*p.senior;
    head.setAttribute('transform',`translate(263 207) scale(${headSize.toFixed(4)}) translate(-263 -207)`);
    silver.setAttribute('opacity',(p.coatSilver*.85).toFixed(3));
    const scene=stories.find(item=>age<item.max);
    if(chapter)chapter.textContent=scene.title;
    if(story)story.textContent=scene.text;
  }
  animeBtn.addEventListener('click',()=>setMode('anime'));
  threeDBtn.addEventListener('click',()=>setMode('3d'));
  root.TrueCatYearsStorybook=Object.freeze({setAge,setMode});
  const requested3D=new URLSearchParams(root.location?.search||'').get('view')==='3d';
  setMode(requested3D&&supports3D?'3d':'anime');
  setAge(15);
})(globalThis);
