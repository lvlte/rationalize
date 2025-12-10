import { eps } from '@lvlte/ulp';

/**
 * Return x if it's a safe integer, throw otherwise.
 */
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
 * Denominator, remainder and quotient of the euclidean division n/d.
 */
const drq = (n: number, d: number): [number, number, number] => {
  const r = n % d;
  return [d, r, (n - r) / d];
}

/**
 * Ceil division of (x + y) / z (x+y and z both positive)
 */
const cld = ([x, y]: [number, number], z: number): number => {
  const r = ((x % z) + (y % z)) % z;
  return Math.round((x + y - r)/z) + Number(r > 0);
}

/**
 * Represent a floating point number `x` as a rational number `[p, q]` where
 * `|x - p/q| ≤ tol` (the result will differ from x by no more than the given
 * tolerance).
 *
 * @param x The input number
 * @param tol The absolute tolerance (default: eps(x))
 * @returns A tuple `[p, q]` representing the rational number p/q
 */
function rationalize(x: number, tol: number = eps(x)): [number, number] {
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
  // @see https://github.com/lvlte/rationalize/blob/main/rationale.md

  let [p2, p1] = [0, 1]       // [pₙ₋₂, pₙ₋₁]
  let [q2, q1] = [1, 0]       // [qₙ₋₂, qₙ₋₁]

  let [t1, t] = [0, tol];     // [tₙ₋₁, tₙ]
  let [e1, e, a] = drq(x, 1); // [|eₙ₋₁|, |eₙ|, aₙ]

  while (e > t) {
    [p2, p1] = [p1, Int54(p1*a + p2)];
    [q2, q1] = [q1, Int54(q1*a + q2)];

    [e1, e, a] = drq(e1, e);
    [t1, t] = [t, a*t + t1];
  }

  if (a > 1) {
    // There likely exists a semiconvergent between pₙ₋₁/qₙ₋₁ and pₙ/qₙ that
    // satisfies the tolerance. Find smallest `a` to minimize p and q.
    const e2 = a*e1 + e;
    const t2 = tol*q2;
    a = cld([e2, -t2], e1 + t1);
  }

  const p = Int54(p1*a + p2);
  const q = Int54(q1*a + q2);

  return [sign*p, q];
}

export { rationalize, eps };
