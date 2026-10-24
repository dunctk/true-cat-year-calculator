'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const file=name=>fs.readFileSync(path.join(root,name),'utf8');
const en=file('index.html'),es=file('es/index.html');

test('both languages have self-canonicals, reciprocal hreflang and switches',()=>{
  for(const [text,locale,url] of [[en,'en','https://catyear.pages.dev/'],[es,'es','https://catyear.pages.dev/es/']]){
    assert.match(text,new RegExp('<html lang="'+locale+'">'));
    assert.ok(text.includes('<link rel="canonical" href="'+url+'">'));
    assert.ok(text.includes('hreflang="en" href="https://catyear.pages.dev/"'));
    assert.ok(text.includes('hreflang="es" href="https://catyear.pages.dev/es/"'));
    assert.ok(text.includes('data-language-link'));
    assert.equal((text.match(/<link rel="canonical"/g)||[]).length,1);
  }
});
test('a short, factual record-scale explanation appears above both calculators',()=>{
  for(const [page,heading,lead,ratio] of [
    [en,'Cat years.','The 7× rule doesn\'t add up.','3.2×'],
    [es,'Años de gato.','La regla de multiplicar por 7 no cuadra.','3,2×']
  ]){
    const headline=page.indexOf('id="calc-heading"');
    const intro=page.indexOf('class="age-scale-note"');
    const calculator=page.indexOf('class="calc-grid experience-grid"');
    assert.ok(headline!==-1&&intro>headline&&calculator>intro,'intro must precede calculator');
    assert.ok(page.includes(heading));
    assert.ok(page.includes(lead));
    assert.ok(page.includes('<strong>'+ratio+'</strong>'));
    const snippet=page.slice(intro,calculator);
    assert.ok(snippet.includes('38')&&snippet.includes('122'));
    assert.ok(snippet.includes('https://www.guinnessworldrecords.com/world-records/oldest-cat-ever'));
    assert.ok(snippet.includes('https://www.guinnessworldrecords.com/world-records/oldest-person'));
    assert.ok(!/\b34\b/.test(snippet),'verified cat record is 38, not 34');
  }
});

test('Spanish static page references existing shared assets from its subdirectory',()=>{
  for(const asset of ['favicon.svg','styles.css','storyboard.css','model.js','cat-growth.js','cat-scene.js','timelapse.js','storybook.js','app.js']){
    assert.ok(es.includes('../'+asset),'missing ../'+asset);
    assert.ok(fs.existsSync(path.join(root,asset)),asset+' must exist');
  }
  assert.ok(es.includes('<title>Calculadora de años de gato a años humanos'));
  assert.ok(es.includes('Porcentaje')||es.includes('porcentaje'));
  assert.ok(es.includes('No predice la salud'));
  assert.ok(!es.includes('>Years</label>'));
  assert.ok(!es.includes('>Share ↗</button>'));
});

function runApp(lang,viewHref){
  const model=require('../model.js');
  const elements=new Map();
  const make=()=>({
    value:'',textContent:'',innerHTML:'',style:{},attributes:{},children:[],listeners:{},
    classList:{toggle(){}},
    getAttribute(n){return this.attributes[n]||null},
    setAttribute(n,v){this.attributes[n]=String(v)},
    addEventListener(n,fn){this.listeners[n]=fn},
    append(...items){this.children.push(...items)},
    replaceChildren(){this.children=[]},
  });
  const el=id=>{if(!elements.has(id))elements.set(id,make());return elements.get(id)};
  const langLink={original:viewHref,href:viewHref,getAttribute(n){return n==='href'?this.href:null}};
  const doc={
    documentElement:{lang},
    getElementById:el,
    querySelector(){return null},
    querySelectorAll(sel){return sel==='[data-language-link]'?[langLink]:[]},
    createElement:()=>make(),
    createElementNS:()=>make(),
  };
  const location={search:'?age=15',href:lang==='es'?'https://catyear.pages.dev/es/':'https://catyear.pages.dev/'};
  vm.runInNewContext(file('app.js'),{
    document:doc,location,URL,URLSearchParams,
    globalThis:{TrueCatYearsModel:model},matchMedia:()=>({matches:false,addEventListener(){}})
  });
  return {el,langLink};
}
test('Spanish calculator renders comma decimals without breaking CSS or language URLs',()=>{
 const {el,langLink}=runApp('es','/');
 assert.equal(el('result-years').textContent,'49,0');
 assert.equal(el('ratio').textContent,'3,22165');
 assert.match(el('progress-bar').style.width,/^39\.\d+%$/);
 const url=new URL(langLink.href);
 assert.equal(url.pathname,'/');
 assert.equal(url.searchParams.get('method'),'adjusted');
 assert.equal(url.searchParams.get('age'),'15.0000');
 assert.equal(el('mode-description').textContent.startsWith('Anclado'),true);
 el('mode-linear').listeners.click();
 assert.equal(el('mode-description').textContent.startsWith('Compara'),true);
 assert.equal(new URL(langLink.href).searchParams.get('method'),'linear');
});
test('language switch preserves latest age, method and 3D selection',()=>{
 const f=runApp('en','/es/');
 f.el('portrait-3d').setAttribute('aria-pressed','true');
 f.el('age-slider').value='2';
 f.el('age-slider').listeners.input();
 const selected=new URL(f.langLink.href);
 assert.equal(selected.searchParams.get('age'),'2.0000');
 assert.equal(selected.searchParams.get('view'),'3d');
 f.el('portrait-3d').setAttribute('aria-pressed','false');
 f.el('age-slider').value='5';
 f.el('age-slider').listeners.input();
 const switched=new URL(f.langLink.href);
 assert.equal(switched.searchParams.get('age'),'5.0000');
 assert.equal(switched.searchParams.has('view'),false);
});
test('English calculator remains unchanged in numeric formatting',()=>{
 const {el,langLink}=runApp('en','/es/');
 assert.equal(el('result-years').textContent,'49.0');
 assert.equal(el('ratio').textContent,'3.22165');
 assert.equal(new URL(langLink.href).pathname,'/es/');
});
function scene(lang){
 const els={};
 for(const id of ['cat-viewport','anime-whole','anime-head','anime-silver','portrait-anime','portrait-3d','scene-story','story-chapter','scene-daypart']){
   els[id]={classList:{contains(){return false},toggle(){}},style:{setProperty(){}},setAttribute(){},addEventListener(){}};
 }
 const doc={documentElement:{lang},getElementById:id=>els[id],querySelector:()=>els['cat-viewport']};
 const model=require('../model.js'),growth=require('../cat-growth.js');
 const globalThis={TrueCatYearsModel:model,TrueCatYearsGrowth:growth,location:{search:''}};
 vm.runInNewContext(file('storybook.js'),{document:doc,globalThis,URLSearchParams});
 vm.runInNewContext(file('timelapse.js'),{document:doc,globalThis});
 globalThis.TrueCatYearsStorybook.setAge(20);
 return {chapter:els['story-chapter'].textContent,daypart:globalThis.TrueCatYearsTimelapse.daypartFor(.8)};
}
test('Spanish story chapters and dayparts translate while English persists',()=>{
 assert.equal(scene('es').chapter,'05 / MUY LONGEVO');
 assert.equal(scene('es').daypart,'Noche estrellada');
 assert.equal(scene('en').chapter,'05 / LONG-LIVED');
 assert.equal(scene('en').daypart,'Starry night');
});
