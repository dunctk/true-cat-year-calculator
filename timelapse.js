/**
 * An age-scrubbed Parisian backdrop — no autoplay, timers, or RAF.
 * CSS keyframes are paused permanently. Setting their negative delay chooses
 * the exact illustrated moment as the user drags the age slider (either way).
 */
(function(root){
 'use strict';
 const scene=document.querySelector('.scene-panel');
 const daypart=document.getElementById('scene-daypart');
 const DURATION_SECONDS=42;
 const MAX_AGE=root.TrueCatYearsModel?.CAT_MAX || 38+3/365.2425;
 if(!scene)return;
 const clamp=v=>Math.min(1,Math.max(0,v));
 function labelFor(progress){
   if(progress<.17)return 'Morning';
   if(progress<.44)return 'Afternoon';
   if(progress<.64)return 'Golden hour';
   if(progress<.78)return 'Dusk';
   return 'Night';
 }
 function setAge(value){
   const numeric=Number(value);
   if(!Number.isFinite(numeric))return;
   const fraction=clamp(numeric/MAX_AGE);
   // At 100%, iteration-count=1 and fill-mode=both hold the NIGHT frame.
   scene.style.setProperty('--tl-delay',(-DURATION_SECONDS*fraction).toFixed(5)+'s');
   if(daypart)daypart.textContent=labelFor(fraction);
 }
 root.TrueCatYearsTimelapse=Object.freeze({setAge});
 // Match the default calculator state before app.js runs. app.js then handles
 // share links, year/month input, presets, reset, and every slider input.
 setAge(15);
})(globalThis);
