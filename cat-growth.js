/**
 * Design-only life-stage proportions for the WebGL character.
 * Physical size matures by ~2.5 cat years; later greying is subtle.
 * This is illustration data, NOT a veterinary developmental model.
 */
(function(root){
  'use strict';
  const maxAge=root.TrueCatYearsModel?.CAT_MAX||38+3/365.2425;
  const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
  const smooth=(a,b,v)=>{const t=clamp((v-a)/(b-a));return t*t*(3-2*t)};
  function pose(value){
    const age=clamp(Number(value)||0,0,maxAge);
    const growth=smooth(0,2.5,age);
    const kitten=1-smooth(.2,3.25,age);
    const adolescent=smooth(.5,4.0,age);
    const senior=smooth(12,33,age);
    const elder=smooth(20,maxAge,age);
    return Object.freeze({
      age,
      overallScale:.43+.57*growth,
      kitten, adolescent, senior, elder,
      headScale:1+.25*kitten-.035*senior,
      eyeScale:1+.13*kitten-.035*senior,
      earScale:1-.10*kitten,
      muzzleDepth:.86+.14*adolescent,
      legLength:.65+.35*adolescent,
      bodyWidth:.86+.14*adolescent,
      bodyHeight:.84+.16*adolescent,
      coatSilver:.44*senior+.26*elder,
      // The cat's lowest paw is modelled at -1.52 world units.
      // A scaled character gets translated back down so paws stay put.
      groundOffset:-1.52*(1-(.43+.57*growth))
    });
  }
  const api=Object.freeze({pose});
  if(typeof module==='object'&&module.exports)module.exports=api;
  root.TrueCatYearsGrowth=api;
})(typeof globalThis==='object'?globalThis:this);
