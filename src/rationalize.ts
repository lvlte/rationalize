import { eps } from '@lvlte/ulp';
import { cld, cld2, drq, dyadicRational, Int54, mod, truncbits } from './utils.js';

/**
 * Represent a floating point number `x` as a rational number `[p, q]` where
 * `|x - p/q| ≤ tol` (the result will differ from x by no more than the given
 * tolerance).
 *
 * @param x The input number
 * @param tol The absolute tolerance (default: `eps(x)`)
 * @returns A tuple `[p, q]` representing the rational number `p/q`
 */
function rationalize(x: number, tol: number = eps(x)): [number, number] {
  if (!Number.isFinite(x)) {
    if (Number.isNaN(x)) {
      throw RangeError('x must be a valid number (received NaN)');
    }
    if (Math.abs(x) === Infinity) {
      // ±Infinity is not a rational number obviously but we can represent it as
      // [±1, 0] (since float64 allows division by zero, and ±1/0 = ±Infinity),
      // which allows to carry it on through rational computations.
      return [Math.sign(x), 0];
    }
    throw TypeError(`x must be a number (received ${typeof x})`);
  }

  const sign = Math.sign(x);
  x = Math.abs(x);

  let epsX: number | undefined;
  if (arguments[1] !== undefined) {
    // Custom tolerance is given
    if (!(typeof tol === 'number' && tol >= 0)) {
      const Err = typeof tol === 'number' ? RangeError : TypeError;
      throw Err('Tolerance must be a non-negative number');
    }

    if (x <= tol) {
      return [sign*0, 1];
    }

    // Ensure `tol` has at least 4 bits "free" for later calculations to prevent
    // roundoff issues.
    tol = truncbits(tol, 4);
  }
  else {
    epsX = tol;
  }

  if (Number.isInteger(x)) {
    return [sign*Int54(x), 1];
  }

  if (tol === 0) {
    const [p, q] = dyadicRational(x);
    return [sign*Int54(p), Int54(q)];
  }

  // Compute [p, q] as the convergents of the regular continued fraction
  // representation of x.
  // @see https://github.com/lvlte/rationalize/blob/main/rationale.md

  let [p2, p1] = [0, 1];      // [pₙ₋₂, pₙ₋₁]
  let [q2, q1] = [1, 0];      // [qₙ₋₂, qₙ₋₁]

  let [t1, t] = [0, tol];     // [tₙ₋₁, tₙ]
  let [e1, e, a] = drq(x, 1); // [|eₙ₋₁|, |eₙ|, aₙ]

  while (e > t) {
    [p2, p1] = [p1, Int54(p1*a + p2)];
    [q2, q1] = [q1, Int54(q1*a + q2)];

    [e1, e, a] = drq(e1, e);
    [t1, t] = [t, a*t + t1];
  }

  // Having e1=1 at this point means tol is greater than the fractional part of
  // x and the current value of a is ⌊1/x⌋, which is fine given that tol.

  if (e1 < 1 && a > 1) {
    // There likely exists a semiconvergent between pₙ₋₁/qₙ₋₁ and pₙ/qₙ that
    // satisfies the tolerance. Find smallest `a` to minimize p and q.
    if (p1 === 0) {
      // We got an inverse 1/q : in this situation the difference of magnitude
      // between e1 and t1 is still very high and the floating-point addition
      // e1 + t1 is not accurate enough.
      epsX ??= eps(x);
      if (t1 < epsX || t1 === epsX && a < Number.MAX_SAFE_INTEGER) {
        // We actually don't want to minimize `a` in this case. Since we have a
        // candidate [p, q] = [1, a] with a = ⌊1/x⌋, satisfying the tolerance, we
        // left `a` untouched except if the ceil div remainder is smaller than
        // the current error term for `a`.
        a = -mod(1, -e1) < e ? a + 1 : a;
      }
      else {
        // Prevent over-minimization.
        t1 = t1 <= epsX*2 ? epsX : t1/2;
        a = Math.min(a, cld(1, e1 + t1));
      }
    }
    else {
      const e2 = a*e1 + e;
      const t2 = tol*q2;
      a = cld2([e2, -t2], e1 + t1);
    }
  }

  const p = Int54(p1*a + p2);
  const q = Int54(q1*a + q2);

  return [sign*p, q];
}

export { rationalize, eps };
