'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const script=fs.readFileSync(path.join(__dirname,'..','storybook.js'),'utf8');

function load({webgl=true,search=''}={}){
  const els=new Map();
  const make=(id)=>{
    const classes=new Set(id==='cat-viewport'&&webgl?['webgl-ready']:[]);
    const attrs={};
    return {
      disabled:false,textContent:'',title:'',attrs,events:{},
      classList:{
        contains(name){return classes.has(name)},
        toggle(name,on){if(on)classes.add(name);else classes.delete(name)},
        add(name){classes.add(name)},remove(name){classes.delete(name)}
      },
      setAttribute(name,value){attrs[name]=String(value)},
      getAttribute(name){return attrs[name]},
      addEventListener(name,cb){this.events[name]=cb}
    };
  };
  const ids=['cat-viewport','anime-whole','anime-head','anime-silver','portrait-anime','portrait-3d','scene-story','story-chapter'];
  ids.forEach(id=>els.set(id,make(id)));
  const actions=[];
  const root={
    location:{search},
    TrueCatYearsModel:{CAT_MAX:38+3/365.2425},
    TrueCatYearsGrowth:{pose(age){
      return {overallScale:age<2?.43:1,kitten:age<1?1:0,senior:age>12?1:0,coatSilver:age>20?.6:0};
    }},
    TrueCatYearsCat:{
      setActive(value){actions.push(['active',value])},
      setAge(value){actions.push(['age',value])}
    }
  };
  vm.runInNewContext(script,{globalThis:root,document:{getElementById:id=>els.get(id)},URLSearchParams});
  return {root,els,actions};
}

test('illustration is the default and WebGL sleeps',()=>{
  const f=load();
  assert.equal(f.els.get('cat-viewport').classList.contains('storybook-mode'),true);
  assert.equal(f.els.get('portrait-anime').getAttribute('aria-pressed'),'true');
  assert.deepEqual(f.actions,[['active',false]]);
});

test('kitten and elder chapters and silhouette evolve with age',()=>{
  const f=load();
  f.root.TrueCatYearsStorybook.setAge(.5);
  assert.match(f.els.get('story-chapter').textContent,/CHAPTER I/);
  assert.match(f.els.get('anime-whole').getAttribute('transform'),/scale\(0\.5800\)/);
  f.root.TrueCatYearsStorybook.setAge(35);
  assert.match(f.els.get('story-chapter').textContent,/CHAPTER V/);
  assert.equal(f.els.get('anime-silver').getAttribute('opacity'),'0.510');
});

test('explicit 3D URL links and mode button wake WebGL',()=>{
  const f=load({search:'?age=15&view=3d'});
  assert.equal(f.els.get('cat-viewport').classList.contains('storybook-mode'),false);
  assert.equal(f.els.get('portrait-3d').getAttribute('aria-pressed'),'true');
  f.els.get('portrait-anime').events.click();
  assert.equal(f.els.get('cat-viewport').classList.contains('storybook-mode'),true);
  f.els.get('portrait-3d').events.click();
  assert.equal(f.els.get('cat-viewport').classList.contains('storybook-mode'),false);
  assert.ok(f.actions.some(a=>a[0]==='active'&&a[1]===true));
});

test('unsupported WebGL disables 3D and retains illustration even if requested',()=>{
  const f=load({webgl:false,search:'?view=3d'});
  assert.equal(f.els.get('portrait-3d').disabled,true);
  assert.equal(f.els.get('cat-viewport').classList.contains('storybook-mode'),true);
  f.root.TrueCatYearsStorybook.setMode('3d');
  assert.equal(f.els.get('cat-viewport').classList.contains('storybook-mode'),true);
});

test('nonsensical ages cannot replace the scene caption',()=>{
  const f=load();
  const before=f.els.get('story-chapter').textContent;
  f.root.TrueCatYearsStorybook.setAge(NaN);
  assert.equal(f.els.get('story-chapter').textContent,before);
});
