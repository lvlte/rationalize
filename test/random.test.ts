import { describe, expect, test } from '@jest/globals';
import { rationalize, eps } from '../src/index.js';
import { xoroshiro128plus } from 'pure-rand/generator/xoroshiro128plus';
import { randomFn, randomSign, rationalizeTest } from './utils.js';

// Generate pseudo-random numbers evenly spread in the float64 range 2^±53.
const rng = xoroshiro128plus(1234);
const random = randomFn(rng, true);

const randomX: number[] = [];
const numPerExp = 500;
const [emin, emax] = [-53, 50];
let exp = emin;

do {
  for (let i=0; i<numPerExp; i++) {
    const x = random(exp, randomSign(0.6));
    if (!Number.isInteger(x)) {
      randomX.push(x);
    }
  }
} while (++exp < emax);

describe(`Given a random number x in the range [2^-53, 2^+53) (${randomX.length} numbers tested)`, () => {
  describe(`rationalize(x) should return [p, q] such that |x - p/q| ≤ tol`, () => {
    test(`with tol = eps(x)`, () => {
      const EPSILON2 = Number.EPSILON/2;
      randomX.forEach(x => {
        if (Math.abs(x) <= EPSILON2) expect(() => rationalize(x)).toThrow(RangeError);
        else rationalizeTest(x);
      });
    });
    test(`with tol = eps(x)*2`, () => {
      randomX.forEach(x => rationalizeTest(x, eps(x)*2));
    });

    const tol1 = 0.01;
    test(`with tol = ${tol1}`, () => {
      randomX.forEach(x => rationalizeTest(x, tol1));
    });
    const tol2 = 0.1;
    test(`with tol = ${tol2}`, () => {
      randomX.forEach(x => rationalizeTest(x, tol2));
    });

    test(`with tol = eps(x)/2, also expect float64 division p/q = x`, () => {
      randomX.forEach(x => {
        // Some numbers can't be represented with safe integers given this
        // tolerance.
        try {
          rationalizeTest(x, eps(x)/2, true);
        }
        catch (e) {
          // @ts-ignore
          const str = e?.message ?? '';
          expect(e).toBeInstanceOf(RangeError);
          expect(str.endsWith('is not a safe integer')).toBe(true);
        }
      });
    });
  });
});
