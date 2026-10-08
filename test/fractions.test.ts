import { describe, expect, test } from '@jest/globals';
import { rationalize, eps } from '../src/index.js';
import { rationalizeTest } from './utils.js';

/**
 * Given the Farey pair a/b, c/d in the Farey sequence of order N, returns the
 * next fraction e/f in that sequence, represented as [e, f].
 */
function fareyNext(a: number, b: number, c: number, d: number, N: number): [number, number] {
  if (d <= 1) throw RangeError();
  const k = Math.floor((b + N)/d);
  return [k*c - a, k*d - b];
}

const N = 1000;
const fareyFractions: Array<[number, number, number]> = [];
const fareyInverses: Array<[number, number, number]> = [];

// Generate reduced fractions using Farey sequence of order N.
let [a, b] = [0, 1];
let [c, d] = [1, N];
fareyFractions.push([c/d, c, d]);
do {
  [a, b, c, d] = [c, d, ...fareyNext(a, b, c, d, N)];
  fareyFractions.push([c/d, c, d]);
  if (c > 1) { // exclude integers
    fareyInverses.push([d/c, d, c]);
  }
} while (d !== 1);

// Generic test function for Farey fractions
function rationalizeTestFarey(x: number, [n, d]: [number, number], tol: number = eps(x)) {
  const [p, q] = rationalize(x, tol);
  expect([p, q]).toEqual([n, d]);
}

// NB. We avoid test.each() to prevent logging every tested numbers.
//
// Jest is too slow: for the Farey sequence of order 1000, the avg time for one
// call+testing is 0.0025ms "manually" vs 0.0537ms via jest (~21.5 times slower)
// it should take no more than 4s but take ~95s instead.

describe(`Given a reduced fraction p/q from the Farey sequence of order ${N}`, () => {
  const fLen = fareyFractions.length;
  const fInvLen = fareyInverses.length;

  describe(`rationalize(x = p/q) should return [p, q] (${fLen} fractions tested)`, () => {
    test(`with tol = eps(x)`, () => {
      fareyFractions.forEach(([x, p, q]) => rationalizeTestFarey(x, [p, q]));
    });
    test(`with tol = eps(x)/2`, () => {
      fareyFractions.forEach(([x, p, q]) => rationalizeTestFarey(x, [p, q], eps(x)/2));
    });
    const tol = 1/N**2;
    test(`with tol = 1/order^2 (${tol})`, () => {
      fareyFractions.forEach(([x, p, q]) => rationalizeTestFarey(x, [p, q], tol));
    });
  });

  describe(`rationalize(x = q/p) should return [q, p] (${fInvLen} fractions tested)`, () => {
    test(`with tol = eps(x)`, () => {
      fareyInverses.forEach(([x, p, q]) => rationalizeTestFarey(x, [p, q]));
    });
    test(`with tol = eps(x)/2`, () => {
      fareyInverses.forEach(([x, p, q]) => rationalizeTestFarey(x, [p, q], eps(x)/2));
    });
    const tol = 1/N**2;
    test(`with tol = 1/order^2 (${tol})`, () => {
      fareyInverses.forEach(([x, p, q]) => rationalizeTestFarey(x, [p, q], tol));
    });
  });

  describe('With higher tolerance', () => {
    describe(`rationalize(x = p/q) should return [n, d] such that |x - n/d| ≤ tol (${fLen} fractions tested)`, () => {
      const tol1 = 1/N;
      test(`with tol = 1/order (${tol1})`, () => {
        fareyFractions.forEach(([x, p, q]) => rationalizeTest(x, tol1, false, q));
      });
      const tol2 = 10/N;
      test(`with tol = 10/order (${tol2})`, () => {
        fareyFractions.forEach(([x, p, q]) => rationalizeTest(x, tol2, false, q));
      });
    });

    describe(`rationalize(x = q/p) should return [n, d] such that |x - n/d| ≤ tol (${fInvLen} fractions tested)`, () => {
      const tol1 = 1/N;
      test(`with tol = 1/order (${tol1})`, () => {
        fareyInverses.forEach(([x, p, q]) => rationalizeTest(x, tol1, false, q));
      });
      const tol2 = 10/N;
      test(`with tol = 10/order (${tol2})`, () => {
        fareyInverses.forEach(([x, p, q]) => rationalizeTest(x, tol2, false, q));
      });
    });
  });
});
