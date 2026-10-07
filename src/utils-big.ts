/// <reference lib="es2020.bigint" />

import { FLOAT64_EMAX } from '@lvlte/ulp';
import { mod } from './utils.js';

/**
 * Returns the dyadic rational representation of `x` (error-free transform).
 */
export function dyadicRationalBig(x: number): [bigint, bigint] {
  const k = x.toString(2).split('.')[1]?.length ?? 0;

  if (k > FLOAT64_EMAX) {
    // prevent spurious overflow
    const m = k - FLOAT64_EMAX;
    const p = BigInt(x * 2**FLOAT64_EMAX * 2**m);
    const q = BigInt(2)**BigInt(k);
    return [p, q];
  }

  const q = 2**k;
  const p = x*q;

  return [BigInt(p), BigInt(q)];
}

/**
 * Ceil division of `1/x` where `0 < x < 1`
 */
export function invceil(x: number): bigint {
  const xinv = 1/x;
  if (xinv <= Number.MAX_SAFE_INTEGER) {
    return BigInt(Math.round(xinv - mod(1, -x)/x));
  }

  const [p, q] = dyadicRationalBig(x);
  return (q - modbig(q, -p)) / p;
}

/**
 * Remainder of x after floor division by y (modulo reduction).
 */
export function modbig(x: bigint, y: bigint): bigint {
  const r = x % y;
  const ZERO = BigInt(0);

  if (r === ZERO) {
    return ZERO;
  }

  return (r > 0) === (y > 0) ? r : r + y;
}

/**
 * Split a given bigint `x` into a floating-point expansion `[x1, x2, ..., xn]`
 * ordered by magnitude (`x1` smallest), where `x = x1 + x2 + ... + xn`
 * (error-free transform).
 */
export function splitBig(x: bigint): number[] {
  const ZERO = BigInt(0);
  if (x === ZERO) {
    return [Number(x)];
  }

  const result: number[] = [];
  const m = BigInt(9007199254740992);
  let n = BigInt(1);

  while (x !== ZERO) {
    const r = x % m;
    x = (x - r) / m;
    result.push(Number(r * n));
    n *= m;
  }

  return result;
}
