import { describe, expect, test } from '@jest/globals';
import { rationalizeBig, eps } from '../src/index.js';
import { abs, le, sub, type TwoF64 } from 'twofloat';
import { dyadicRationalBig } from '../src/utils-big.js';
import { xoroshiro128plus } from 'pure-rand/generator/xoroshiro128plus';
import { randomFn, randomSign } from './utils.js';

// Generate pseudo-random numbers evenly spread in the float64 range 2^±53.
const rng = xoroshiro128plus(42);
const random = randomFn(rng, true);

const randomX: number[] = [];
const numPerExp = 500;
const [emin, emax] = [-1024, 50];
let exp = emin;

do {
  for (let i=0; i<numPerExp; i++) {
    const x = random(exp, randomSign(0.6));
    if (!Number.isInteger(x)) {
      randomX.push(x);
    }
  }
} while (++exp < emax);

// Generic test function
function rationalizeTest(x: number, tol: number = eps(x), f64DivEq: boolean = false, den?: number) {
  const [p, q] = rationalizeBig(x, tol);
  const pq = rationalToTwoF64(p, q);
  const ee = abs(sub(pq, x));
  expect(le(ee, tol)).toBe(true); // |x - p/q| ≤ tol holds mathematically
  if (f64DivEq) {
    // float64 division of p/q should be exactly x (when tol <= eps(x)/2)
    expect(pq[0]).toEqual(x);
  }
  else if (den !== undefined) {
    // q should be minimized.
    tol > 1/den && den > 1 ? expect(q).toBeLessThan(den) : expect(q).toBeLessThanOrEqual(den);
  }
}

/**
 * Returns the closest IEEE 754 Float64 to the exact rational `p/q`, assuming
 * `q > 0`.
 *
 * @TODO need tests: implement in twofloat module and test using julia's BigFloat
 */
function rationalToF64(p: bigint, q: bigint): number {
  if (p === 0n) {
    return 0;
  }

  if (q === 1n) {
    return Number(p);
  }

  const pf = Number(p);
  const qf = Number(q);
  // @ts-expect-error - comparison is intentional
  if (pf == p && qf == q) {
    return pf/qf;
  }

  let sign: number;
  [sign, p] = p < 0n ? [-1, -p] : [1, p];

  // We want to scale p/q by 2^k so that (p * 2^k)/q is a 53-bit integer.
  const d = p.toString(2).length - q.toString(2).length; /** @TODO perf */
  let k = Math.min(52 - d, 1074); // maximum subnormal shift limit

  let m: bigint; // mantissa
  let r: bigint; // remainder

  let pp = p;
  let qq = q;

  k >= 0 ? pp = p << BigInt(k) : qq = q << BigInt(-k);
  m = pp/qq;

  // Align the fraction to exactly 53 bits (or max subnormal)

  if (m < 0x10000000000000n && k < 1074) {
    k++;
    pp <<= 1n;
    m = pp/qq;
  }

  r = pp % qq;

  // IEEE 754 rounding (tie to even)
  const twiceR = r * 2n;
  if (twiceR > qq || twiceR === qq && (m & 1n) === 1n) {
    m++;
  }

  return sign * Number(m) * 2**-k;
}

/**
 * Returns the closest TwoF64 (Double-Double) approximation [hi, lo]
 * of the exact mathematical division p / q.
 *
 * @TODO need tests: implement in twofloat module and test using julia's BigFloat
 */
function rationalToTwoF64(p: bigint, q: bigint): TwoF64 {
  const hi = rationalToF64(p, q);

  if (!Number.isFinite(hi)) {
    throw RangeError() // should not happen in this test
  }

  if (hi === 0) {
    return [hi, 0];
  }

  const [p_hi, q_hi] = dyadicRationalBig(hi);

  const p_rem = p*q_hi - p_hi*q;
  const q_rem = q*q_hi;
  const lo = rationalToF64(p_rem, q_rem);

  return [hi, lo];
}

describe(`Given a random number x in the range [2^-1024, 2^+53) (${randomX.length} numbers tested)`, () => {
  describe(`rationalizeBig(x) should return [p, q] such that |x - p/q| ≤ tol`, () => {
    test(`with tol = eps(x)`, () => {
      randomX.forEach(x => rationalizeTest(x));
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
        rationalizeTest(x, eps(x)/2, true);
      });
    });
  });
});
