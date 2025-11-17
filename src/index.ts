import { eps } from '@lvlte/ulp';
import { modf } from '@lvlte/modf';
import { Double } from 'double.js';

const Int54 = (x: number): number => {
  if (Number.isSafeInteger(x)) {
    return x;
  }
  throw RangeError(`${x} is not a safe integer`);
};

const isInfinite = (x: number): x is 9e+999 | -9e+999 => {
  return x === Infinity || x === -Infinity;
};

const ONE2 = new Double(1);

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

  if (!(typeof tol === 'number' && tol >= 0)) {
    const Err = typeof tol === 'number' ? RangeError : TypeError;
    throw Err(`Tolerance must be a non-negative number`);
  }

  if (Number.isInteger(x)) {
    return [Int54(x), 1];
  }

  const sign = Math.sign(x);
  x = Math.abs(x);

  // Compute [p, q] as the convergents of the regular continued fraction
  // representation of x.

  let [a, r] = modf(x);
  let [pPrev, p] = [1, a];
  let [qPrev, q] = [0, 1];

  const tt = new Double(tol);
  const xx = new Double(x);

  let rr = new Double(r);
  let ee = new Double(p).div(q).sub(xx).abs();

  while (ee.gt(tt)) {
    [a, rr] = _modf2(ONE2.div(rr));
    [pPrev, p] = [p, Int54(p * a + pPrev)];
    [qPrev, q] = [q, Int54(q * a + qPrev)];
    ee = new Double(p).div(q).sub(xx).abs();
  }

  if (a > 1) {
    // While |x - p/q| ≤ tol, there likely exists a semiconvergent between the
    // last two convergents that satisfies the tolerance (the "best" rational
    // approximation for `x` given `tol` is the one satisfying the inequality
    // that has the smallest denominator, ie. any approximation with a larger
    // denominator would be an unnecessary use of precision).

    const pPrev2 = p - pPrev*a;
    const qPrev2 = (q - qPrev*a) || +(pPrev2 === 0);

    const t1 = tt.mul(qPrev);
    const t2 = tt.mul(qPrev2);

    const e1 = new Double(pPrev).sub(xx.mul(qPrev)).abs();
    const e2 = new Double(pPrev2).sub(xx.mul(qPrev2)).abs();

    const aa = _ceil21(e2.sub(t2).div(e1.add(t1)));

    p = Int54(pPrev*aa + pPrev2);
    q = Int54(qPrev*aa + qPrev2);
  }

  return [sign*p, q];
}

function _ceil21(x: Double): number {
  const a = Math.ceil(x.hi);
  if (x.lo > 0 && a - x.hi < x.lo) {
    return a + 1;
  }
  if (x.lo < 0 && 1 - (a - x.hi) <= -x.lo) {
    return a - 1;
  }
  return a;
}

function _modf2(x: Double): [number, Double] {
  let a = Math.trunc(x.hi);
  let r = x.sub(a);
  if (r.lt(-x.lo)) {
    r = x.sub(--a);
  }
  else if (ONE2.sub(r).lt(x.lo)) {
    r = x.sub(++a);
  }
  return [a, r];
}
