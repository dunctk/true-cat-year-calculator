/**
 * True Cat Years: interactive fast-forward Paris timelapse.
 *
 * Each two CAT YEARS advances the illustration through one complete
 * day → sunset → night → dawn cycle. Ages scrub the scene directly; when the
 * user stops moving a control, time stops. There are no timers, autoplay,
 * running animations or network resources.
 */
(function(root){
 'use strict';
 const scene=document.querySelector('.scene-panel');
 const daypart=document.getElementById('scene-daypart');
 const MAX_AGE=root.TrueCatYearsModel?.CAT_MAX || 38+3/365.2425;
 const es=document.documentElement?.lang?.toLowerCase().startsWith('es')||false;
 const SECONDS_IN_STORYBOARD=42; // CSS sampling domain, NOT elapsed time.
 const YEARS_PER_ILLUSTRATED_DAY=2;
 if(!scene)return;
 function frameForAge(value){
   const age=Number(value);
   if(!Number.isFinite(age))return null;
   const clamped=Math.min(MAX_AGE,Math.max(0,age));
   const elapsedDays=clamped/YEARS_PER_ILLUSTRATED_DAY;
   const progress=elapsedDays-Math.floor(elapsedDays);
   return Object.freeze({age:clamped,progress,days:elapsedDays,
     delay:(-SECONDS_IN_STORYBOARD*progress).toFixed(5)+'s'});
 }
 function daypartFor(progress){
   if(progress<.14 || progress>=.94)return es?'Amanecer':'Sunrise';
   if(progress<.40)return es?'Día':'Daylight';
   if(progress<.60)return es?'Hora dorada':'Golden hour';
   if(progress<.72)return es?'Atardecer':'Sunset';
   return es?'Noche estrellada':'Starry night';
 }
 function setAge(value){
   const frame=frameForAge(value);
   if(!frame)return;
   scene.style.setProperty('--tl-delay',frame.delay);
   if(daypart)daypart.textContent=daypartFor(frame.progress);
 }
 root.TrueCatYearsTimelapse=Object.freeze({setAge,frameForAge,daypartFor});
 // Start in the same state as the initial calculator display. app.js will
 // immediately sync the state to ?age=... and all subsequent user inputs.
 setAge(15);
})(globalThis);
