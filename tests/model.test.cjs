/**
 * Run locally: node --test tests/model.test.cjs
 * No dependencies, network access or GitHub Actions required.
 */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const model = require('../model.js');
const close = (actual, target, tolerance = 1e-8) =>
  assert.ok(Math.abs(actual - target) < tolerance, String(actual) + ' != ' + String(target));

test('anchors both verified records and birth at zero', () => {
  close(model.adjusted(0), 0);
  close(model.linear(0), 0);
  close(model.adjusted(model.CAT_MAX), model.HUMAN_MAX);
  close(model.linear(model.CAT_MAX), model.HUMAN_MAX);
});
test('two cat years use an explicitly illustrative teenage anchor', () => {
  close(model.adjusted(2), 17);
  close(model.linear(2), model.RATIO * 2);
});
test('older cats remain close to the record-percent baseline', () => {
  assert.ok(Math.abs(model.adjusted(15) - model.linear(15)) < 1.0);
  assert.ok(Math.abs(model.adjusted(20) - model.linear(20)) < 0.2);
  assert.ok(model.adjusted(15) > 48 && model.adjusted(15) < 50);
  assert.ok(model.adjusted(20) > 64 && model.adjusted(20) < 65);
});
test('smooth, bounded, always-increasing curve', () => {
  let previous = -1;
  for (let i = 0; i <= 3800; i++) {
    const age = model.CAT_MAX * i / 3800;
    const result = model.adjusted(age);
    assert.ok(result >= previous, 'must be nondecreasing at ' + age);
    assert.ok(result <= model.HUMAN_MAX + 1e-6);
    assert.ok(result >= model.linear(age) - 1e-6);
    previous = result;
  }
});
test('maturity boost is strongest early and fades near zero', () => {
  const extra = age => model.adjusted(age) - model.linear(age);
  assert.ok(extra(2) > 10);
  assert.ok(extra(5) < extra(2));
  assert.ok(extra(15) < extra(5));
  close(extra(model.CAT_MAX), 0);
});
