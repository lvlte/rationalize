import { exponent } from '@lvlte/ulp';
import { type RandomGenerator } from 'pure-rand/types/RandomGenerator';
import { uniformFloat64 } from 'pure-rand/distribution/uniformFloat64';
import { xoroshiro128plus } from 'pure-rand/generator/xoroshiro128plus';

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
