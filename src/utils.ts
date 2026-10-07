import { FLOAT64_EMAX } from '@lvlte/ulp';

/**
 * Return x if it's a safe integer, throw otherwise.
 */
export const Int54 = (x: number): number => {
  if (Number.isSafeInteger(x)) {
    return x;
  }
  throw RangeError(`${x} is not a safe integer`);
};

/**
 * Denominator, remainder and quotient of the euclidean division n/d.
 */
export const drq = (n: number, d: number): [number, number, number] => {
  const r = n % d;
  return [d, r, Math.round(n/d - r/d)];
};

/**
 * Ceil division of x / y
 */
export const cld = (x: number, y: number): number => Math.round(x/y - mod(x, -y)/y);

/**
 * Ceil division of (x + y) / z
 * for x,y,z such that x > 0, y ≤ 0, and 0 < z ≤ x+y
 */
export const cld2 = ([x, y]: [number, number], z: number): number => {
  const r = x % z + y % z;
  return Math.round((x + (y - r))/z) + Number(r > 0);
};

/**
 * Remainder of x after floor division by y (modulo reduction).
 * Equivalent to `x - y*⌊x/y⌋` without intermediate rounding.
 */
export function mod(x: number, y: number): number {
  const r = x % y;
  if (r === 0) {
    return Math.sign(y)*0;
  }
  return (r > 0) === (y > 0) ? r : r + y;
}

const F64_VIEW = new DataView(new ArrayBuffer(8));

/**
 * Truncates the `nb` least significant bits of a Float64 (`nb` must be less
 * than or equal to 31).
 */
export function truncbits(x: number, nb: number): number {
  // Reinterpret lo bits of x (32 least significant bits) as a 32 bits integer,
  // apply truncmask to it and write it back in the float64 buffer.
  F64_VIEW.setFloat64(0, x, true);
  const truncmask_i32 = -1 << nb; // all 32 bits set, left-shifted by nb bits.
  const x_lo = F64_VIEW.getInt32(0, true) & truncmask_i32;
  F64_VIEW.setInt32(0, x_lo, true);
  return F64_VIEW.getFloat64(0, true);
}

/**
 * Returns the dyadic rational representation of `x` (error-free transform).
 *
 * If `x` is non-finite (`NaN` or `±Infinity`), return `[x, 1]`.
 *
 * NB. Subnormal numbers such that `|x| < 2^-1023` cannot be represented exactly
 * using the `number` type (f64) as their denominator overflows to `Infinity`.
 */
export function dyadicRational(x: number): [number, number] {
  const k = x.toString(2).split('.')[1]?.length ?? 0;

  if (k > FLOAT64_EMAX) {
    const m = k - FLOAT64_EMAX;
    return [x * 2**FLOAT64_EMAX * 2**m, Infinity];
  }

  const q = 2**k;
  const p = x*q;

  return [p, q];
}
