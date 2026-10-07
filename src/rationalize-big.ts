/// <reference lib='es2020.bigint'/>

import { eps } from '@lvlte/ulp';
import { cld, cld2, drq, mod, truncbits } from './utils.js';
import { dyadicRationalBig, invceil, splitBig } from './utils-big.js';

/**
 * Represent a floating point number `x` as a rational number `[p, q]` where
 * `|x - p/q| ≤ tol` (the result will differ from x by no more than the given
 * tolerance).
 *
 * @param x The input number
 * @param tol The absolute tolerance (default: `eps(x)`)
 * @returns A `bigint` tuple `[p, q]` representing the rational number `p/q`
 */
export function rationalizeBig(x: number, tol: number = eps(x)): [bigint, bigint] {
  if (!Number.isFinite(x)) {
    if (Number.isNaN(x)) {
      throw RangeError('x must be a valid number (received NaN)');
    }
    if (Math.abs(x) === Infinity) {
      return [BigInt(Math.sign(x)), BigInt(0)];
    }
    throw TypeError(`x must be a number (received ${typeof x})`);
  }

  const sign = BigInt(Math.sign(x));
  x = Math.abs(x);

  let epsX: number | undefined;
  if (arguments[1] !== undefined) {
    if (!(typeof tol === 'number' && tol >= 0)) {
      const Err = typeof tol === 'number' ? RangeError : TypeError;
      throw Err('Tolerance must be a non-negative number');
    }

    if (x <= tol) {
      return [BigInt(0), BigInt(1)];
    }

    tol = truncbits(tol, 4);
  }
  else {
    epsX = tol;
  }

  if (Number.isInteger(x)) {
    return [sign*BigInt(x), BigInt(1)];
  }

  if (tol === 0) {
    const [p, q] = dyadicRationalBig(x);
    return [sign*p, q];
  }

  const u = 1.1102230246251565e-16;
  const ZERO = BigInt(0);
  const ONE = BigInt(1);

  let [p2, p1] = [ZERO, ONE];
  let [q2, q1] = [ONE, ZERO];

  let [t1, t] = [0, tol];
  let [e1, e, a] = drq(x, 1);

  if (e > t && e < u) {
    // Avoid unsafe float integer
    [p2, p1] = [p1, p2];
    [q2, q1] = [q1, q2];

    const [qq, pp] = dyadicRationalBig(e);
    const ia = pp / qq;

    [e1, e] = [e, e1 % e];
    [t1, t] = [t, splitBig(ia).map(an => an * t).reduce((s, x) => s += x, 0)];

    if (e <= t) {
      // Minimize and return
      let ia_min = ia;
      epsX ??= eps(x);
      if (t1 <= epsX && -mod(1, -e1) < e) {
        ia_min++;
      }
      else {
        t1 = t1 <= epsX*2 ? epsX : t1/2;
        const ca = invceil(e1 + t1);
        ia_min = ca < a ? ca : ia_min;
      }

      const p = p1*ia_min + p2;
      const q = q1*ia_min + q2;

      return [sign*p, q];
    }

    // Otherwise continue with next convergents
    [p2, p1] = [p1, p1*ia + p2];
    [q2, q1] = [q1, q1*ia + q2];

    // The next `a` are safe after the 1st iteration
    [e1, e, a] = drq(e1, e);
    [t1, t] = [t, a*t + t1];
  }

  while (e > t) {
    const ia = BigInt(a);
    [p2, p1] = [p1, p1*ia + p2];
    [q2, q1] = [q1, q1*ia + q2];

    [e1, e, a] = drq(e1, e);
    [t1, t] = [t, a*t + t1];
  }

  if (e1 < 1 && a > 1) {
    if (p1 === ZERO) {
      epsX ??= eps(x);
      if (t1 < epsX || t1 === epsX && a < Number.MAX_SAFE_INTEGER) {
        a = -mod(1, -e1) < e ? a + 1 : a;
      }
      else {
        t1 = t1 <= epsX*2 ? epsX : t1/2;
        a = Math.min(a, cld(1, e1 + t1));
      }
    }
    else {
      const e2 = a*e1 + e;
      const t2 = splitBig(q2).map(qn => qn * tol).reduce((s, x) => s += x, 0);
      a = cld2([e2, -t2], e1 + t1);
    }
  }

  const ia = BigInt(a);
  const p = p1*ia + p2;
  const q = q1*ia + q2;

  return [sign*p, q];
}

