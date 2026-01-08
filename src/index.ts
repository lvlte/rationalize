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
 * Ceil division of x / y
 */
const cld = (x: number, y: number): number => Math.round(x/y - mod(x, -y)/y);

/**
 * Ceil division of (x + y) / z
 * for x,y,z such that x > 0, y ≤ 0, x+y > 0, z > 0
 */
const cld2 = ([x, y]: [number, number], z: number): number => {
  const r = ((x % z) + (y % z)) % z;
  return Math.round((x + (y - r))/z) + Number(r > 0);
}

/**
 * Remainder of x after floor division by y (modulo reduction).
 * Equivalent to `x - y*⌊x/y⌋` without intermediate rounding.
 */
function mod(x: number, y: number): number {
  const r = x % y;
  if (r === 0) {
    return Math.sign(y)*0;
  }
  if (r > 0 != y > 0) {
    return r + y;
  }
  return r;
}

const F64_VIEW = new DataView(new ArrayBuffer(8));

/**
 * Truncates the `nb` least significant bits of a Float64 (`nb` must be less
 * than or equal to 31).
 */
function truncbits(x: number, nb: number): number {
  // Reinterpret lo bits of x (32 least significant bits) as a 32 bits integer,
  // apply truncmask to it and write it back in the float64 buffer.
  F64_VIEW.setFloat64(0, x, true);
  const truncmask_i32 = -1 << nb; // all 32 bits set, left-shifted by nb bits.
  const x_lo = F64_VIEW.getInt32(0, true) & truncmask_i32;
  F64_VIEW.setInt32(0, x_lo, true);
  return F64_VIEW.getFloat64(0, true);
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

  const sign = Math.sign(x);
  x = Math.abs(x);

  let epsX = tol;
  if (arguments[1] !== undefined) {
    // Custom tolerance is given
    if (!(typeof tol === 'number' && tol >= 0)) {
      const Err = typeof tol === 'number' ? RangeError : TypeError;
      throw Err(`Tolerance must be a non-negative number`);
    }

    if (x <= tol) {
      return [sign*0, 1];
    }

    // Ensure `tol` has at least 4 bits "free" for later calculations to prevent
    // roundoff issues.
    tol = truncbits(tol, 4);
    epsX = eps(x);
  }

  if (Number.isInteger(x)) {
    return [sign*Int54(x), 1];
  }

  // Compute [p, q] as the convergents of the regular continued fraction
  // representation of x.
  // @see https://github.com/lvlte/rationalize/blob/main/rationale.md

  let n = 0;                  // convergent index

  let [p2, p1] = [0, 1]       // [pₙ₋₂, pₙ₋₁]
  let [q2, q1] = [1, 0]       // [qₙ₋₂, qₙ₋₁]

  let [t1, t] = [0, tol];     // [tₙ₋₁, tₙ]
  let [e1, e, a] = drq(x, 1); // [|eₙ₋₁|, |eₙ|, aₙ]

  while (e > t) {
    n++;
    [p2, p1] = [p1, Int54(p1*a + p2)];
    [q2, q1] = [q1, Int54(q1*a + q2)];

    [e1, e, a] = drq(e1, e);
    [t1, t] = [t, a*t + t1];
  }

  // Having n=0 at this point means tol is greater than the fractional part of x
  // and the current value of a is ⌊1/x⌋, which is fine given that tol.

  if (n > 0 && a > 1) {
    // There likely exists a semiconvergent between pₙ₋₁/qₙ₋₁ and pₙ/qₙ that
    // satisfies the tolerance. Find smallest `a` to minimize p and q.

    if (p1 === 0) {
      // We got an inverse 1/q : in this situation the difference of magnitude
      // between e1 and t1 is still very high and the floating-point addition
      // e1 + t1 is not accurate enough.
      if (t1 < epsX || t1 === epsX && a < Number.MAX_SAFE_INTEGER) {
        // We actually don't want to minimize `a` in this case. Since we have a
        // candidate [p, q] = [1, a] with a = ⌊1/x⌋, satisfying the tolerance, we
        // left `a` untouched except if the ceil div remainder is smaller than
        // the current error term for `a`.
        a = -mod(1, -e1) < e ? a + 1 : a;
      }
      else {
        // Prevent over-minimization.
        const t = t1 <= epsX*2 ? epsX : t1;
        a = Math.min(a, cld(1, e1 + t));
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
