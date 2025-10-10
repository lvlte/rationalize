import { eps } from '@lvlte/ulp';
import { modf } from '@lvlte/modf';

const Int54 = (x: number): number => {
  if (Number.isSafeInteger(x)) {
    return x;
  }
  throw RangeError(`${x} is not a safe integer`);
};

const isInfinite = (x: number): x is 9e+999 | -9e+999 => {
  return x === Infinity || x === -Infinity;
};

/**
 * Represent a floating point number `x` as a rational number `[p, q]` where
 * `p/q ≈ x` and `|x - p/q| ≤ tol` (the result will differ from x by no more
 * than the given tolerance).
 */
export function rationalize(x: number, tol: number = eps(x)): [number, number] {
  if (!Number.isFinite(x)) {
    if (Number.isNaN(x)) {
      throw RangeError(`x must be a valid number (received NaN)`);
    }
    if (isInfinite(x)) {
      // ±Infinity is not a rational number obviously but we can represent it as
      // [±1, 0] (since float64 allows division by zero, and ±1/0 = ±Infinity),
      // which allows to carry it on through rational computations.
      return [Math.sign(x), 0];
    }
    throw TypeError(`x must be a number (received ${typeof x})`);
  }

  if (tol < 0) {
    throw RangeError(`Tolerance cannot be negative (tol=${tol})`);
  }

  if (Number.isInteger(x)) {
    return [Int54(x), 1];
  }

  const sign = Math.sign(x);
  x = Math.abs(x);

  // Compute [p, q] as the convergents of the regular continued fraction
  // representation of x. Return when |x - p/q| ≤ tol.

  let [a, r] = modf(x);
  let [pPrev, p] = [1, a];
  let [qPrev, q] = [0, 1];

  while (Math.abs(x - p/q) > tol) {
    [a, r] = modf(1/r);
    [pPrev, p] = [p, Int54(p*a + pPrev)];
    [qPrev, q] = [q, Int54(q*a + qPrev)];
  }

  return [sign*p, q];
}

