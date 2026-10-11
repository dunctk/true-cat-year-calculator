/*
 * Background timelapse control: pause/play only the scenery, not the cat.
 * CSS supplies all visual frames and automatically disables animations for
 * users requesting reduced motion. Offscreen/background-tab scenes are paused.
 */
(function(){
 'use strict';
 const scene=document.querySelector('.scene-panel');
 const toggle=document.getElementById('timelapse-toggle');
 if(!scene||!toggle)return;
 let userPaused=false;
 const sync=()=>{
  scene.classList.toggle('is-timelapse-paused',userPaused);
  toggle.setAttribute('aria-pressed',String(userPaused));
  toggle.setAttribute('aria-label',userPaused?'Play background timelapse':'Pause background timelapse');
  toggle.title=userPaused?'Play background timelapse':'Pause background timelapse';
  const symbol=toggle.querySelector('span');
  if(symbol)symbol.textContent=userPaused?'▶':'❚❚';
 };
 toggle.addEventListener('click',()=>{userPaused=!userPaused;sync()});
 const offscreen=hidden=>scene.classList.toggle('is-timelapse-offscreen',hidden);
 document.addEventListener('visibilitychange',()=>offscreen(document.hidden));
 if('IntersectionObserver' in window){
  new IntersectionObserver(entries=>offscreen(!entries[0].isIntersecting),{threshold:0}).observe(scene);
 }
 sync();
})();
