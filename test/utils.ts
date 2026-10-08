import { exponent } from '@lvlte/ulp';
import { type RandomGenerator } from 'pure-rand/types/RandomGenerator';
import { uniformFloat64 } from 'pure-rand/distribution/uniformFloat64';
import { xoroshiro128plus } from 'pure-rand/generator/xoroshiro128plus';
import { abs, div, le, sub, type TwoF64 } from 'twofloat';
import { expect } from '@jest/globals';
import { rationalize, rationalizeBig, eps } from '../src/index.js';
import { dyadicRationalBig } from '../src/utils-big.js';

export type Sign = -1 | 1;

type RandomFnDefault = () => number;
type RandomFnWithRangeOpt = (exp: number, sign?: Sign) => number;
type RandomFn<T extends boolean> = T extends false
  ? RandomFnDefault
  : T extends true
    ? RandomFnWithRangeOpt
    : never;

/**
 * Return a function that generates pseudo-random `f64` numbers using the given
 * `rng`.
 * - if `rangeOpt` is `true`, the generator expects two arguments `exp` and
 *   optionally `sign` that define its output range `[sign*2^exp, sign*2^(exp+1)]`
 * - otherwise the generated numbers are in the range `[0, 1)`.
 */
export function randomFn<T extends boolean>(rng: RandomGenerator, rangeOpt: T): RandomFn<T> {
  if (rangeOpt) {
    return function (exp: number, sign: Sign = 1): number {
      const x = uniformFloat64(rng);
      const p = exp - exponent(x);
      return sign * x * 2**p;
    } as RandomFn<T>;
  }

  return function (): number {
    return uniformFloat64(rng);
  } as RandomFn<T>;
}

const srng = xoroshiro128plus(123);

/**
 * Return `-1` or `1` randomly. `p` can be set to adjust the probabilty of
 * returning `1` rather than `-1`.
 */
export function randomSign(p: number = 0.5): Sign {
  const x = uniformFloat64(srng);
  return x < p ? 1 : -1;
}

export function rationalizeTest(x: number, tol: number = eps(x), f64DivEq: boolean = false, den?: number) {
  const [p, q] = rationalize(x, tol);
  const ee = abs(sub(div(p, q), x));
  expect(le(ee, tol)).toBe(true); // |x - p/q| ≤ tol holds mathematically
  if (f64DivEq) {
    // float64 division of p/q should be exactly x (when tol <= eps(x)/2)
    expect(p/q).toEqual(x);
  }
  else if (den !== undefined) {
    // q should be minimized.
    tol > 1/den && den > 1 ? expect(q).toBeLessThan(den) : expect(q).toBeLessThanOrEqual(den);
  }
}

export function rationalizeBigTest(x: number, tol: number = eps(x), f64DivEq: boolean = false, den?: number) {
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
