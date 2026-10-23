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
    {max:1,title:'CHAPTER I · THE FIRST WONDER',text:'A little paw, a big world. Every day is a new discovery.'},
    {max:3,title:'CHAPTER II · CURIOUS BEGINNINGS',text:'Growing into those ears, and into a hundred little adventures.'},
    {max:10,title:'CHAPTER III · THE PARIS EXPLORER',text:'Every rooftop, window and sunbeam belongs to our curious companion.'},
    {max:20,title:'CHAPTER IV · THE WISE COMPANION',text:'A little more wisdom, a little more charm, and so many stories.'},
    {max:Infinity,title:'CHAPTER V · A LIVING LEGEND',text:'Some extraordinary companions keep turning the pages.'}
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
  setMode('anime');
  setAge(15);
})(globalThis);
