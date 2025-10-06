import { eps } from '@lvlte/ulp';
import { modf, ipart, fpart } from '@lvlte/modf';

/**
 * Represent a floating point number `x` as a rational number `[p, q]` where
 * `p/q ≈ x` and `|x - p/q| ≤ tol` (the result will differ from x by no more
 * than the given tolerance).
 */
export function rationalize(x: number, tol: number = eps(x)): [number, number] {
  if (!Number.isFinite(x)) {
    throw RangeError(`x must be a finite number (x=${x})`);
  }

  if (tol < 0) {
    throw RangeError(`Tolerance cannot be negative (tol=${tol})`);
  }

  if (Number.isInteger(x)) {
    return [x, 1];
  }

  const sign = Math.sign(x);
  x = Math.abs(x);

  // Compute [p, q] as the convergents of the regular continued fraction
  // representation of x. Return when |x - p/q| ≤ tol.

  let [a, r] = modf(x);
  let [pPrev, p] = [1, a];
  let [qPrev, q] = [0, 1];

  while (Math.abs(x - p/q)> tol) {
    [a, r] = modf(1/r);
    [pPrev, p] = [p, p*a + pPrev];
    [qPrev, q] = [q, q*a + qPrev];
  }

  return [sign*p, q];
}

