/**
 * True Cat Years model — an illustrative age analogy, not clinical advice.
 * The life-record percentage is the baseline. A temporary early-maturity
 * premium is positive after birth, fades as cats age, and is zero at the record.
 * H(2)=17 is an intentionally chosen teenage analogy, NOT a clinical conversion.
 */
(function (root) {
  'use strict';
  const CAT_MAX = 38 + 3 / 365.2425;        // Creme Puff
  const HUMAN_MAX = 122 + 164 / 365.2425;   // Jeanne Calment
  const RATIO = HUMAN_MAX / CAT_MAX;
  const EARLY_TARGET_CAT = 2;
  const EARLY_TARGET_HUMAN = 17;
  const DECAY_YEARS = 3;
  // H(C) = RATIO*C + BOOST*C*exp(-C/3)*(1-C/CAT_MAX).
  // Solve the coefficient from the illustrative H(2)=17 anchor.
  const BOOST = (EARLY_TARGET_HUMAN - RATIO * EARLY_TARGET_CAT) /
    (EARLY_TARGET_CAT * Math.exp(-EARLY_TARGET_CAT / DECAY_YEARS) *
      (1 - EARLY_TARGET_CAT / CAT_MAX));
  const clamp = age => Math.max(0, Math.min(CAT_MAX, age));
  const linear = age => RATIO * clamp(age);
  const adjusted = age => {
    const c = clamp(age);
    return RATIO * c +
      BOOST * c * Math.exp(-c / DECAY_YEARS) * (1 - c / CAT_MAX);
  };
  const model = Object.freeze({
    CAT_MAX, HUMAN_MAX, RATIO, EARLY_TARGET_CAT, EARLY_TARGET_HUMAN,
    DECAY_YEARS, BOOST, linear, adjusted
  });
  if (typeof module === 'object' && module.exports) module.exports = model;
  root.TrueCatYearsModel = model;
})(typeof globalThis === 'object' ? globalThis : this);
