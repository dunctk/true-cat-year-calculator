const {test}=require('node:test');
const assert=require('node:assert/strict');
const {pose}=require('../cat-growth.js');
const near=(a,b,tol=1e-9)=>assert.ok(Math.abs(a-b)<tol, String(a)+' ≠ '+String(b));
test('kitten visibly grows to adult size and then remains adult-sized',()=>{
  near(pose(0).overallScale,.43);
  assert.ok(pose(.5).overallScale<pose(1).overallScale);
  assert.ok(pose(1).overallScale<pose(2).overallScale);
  near(pose(2.5).overallScale,1);
  near(pose(5).overallScale,1);
  near(pose(20).overallScale,1);
  near(pose(38).overallScale,1);
});
test('continuous monotonic growth, planted paws and bounded proportions',()=>{
  let last=0;
  for(let i=0;i<=3800;i++){
    const x=38*i/3800;
    const p=pose(x);
    assert.ok(p.overallScale+1e-12>=last);
    near(p.groundOffset+p.overallScale*(-1.52),-1.52);
    assert.ok(p.headScale>0&&p.bodyHeight>0&&p.legLength>0);
    last=p.overallScale;
  }
});
test('juveniles have bigger relative heads, shorter legs and flatter muzzles',()=>{
  const kitten=pose(.25),adult=pose(5);
  assert.ok(kitten.headScale>adult.headScale);
  assert.ok(kitten.eyeScale>adult.eyeScale);
  assert.ok(kitten.legLength<adult.legLength);
  assert.ok(kitten.bodyHeight<adult.bodyHeight);
  assert.ok(kitten.muzzleDepth<adult.muzzleDepth);
});
test('silvering is a gradual senior-stage illustration, not young-age greying',()=>{
  near(pose(2).coatSilver,0);
  assert.ok(pose(20).coatSilver>pose(10).coatSilver);
  assert.ok(pose(38).coatSilver>pose(20).coatSilver);
});
test('bad values are clamped safely',()=>{near(pose(-2).overallScale,pose(0).overallScale);near(pose(100).overallScale,1);near(pose(NaN).overallScale,.43)});
