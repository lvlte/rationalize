import { rationalize, eps } from '../src/index';
import { exponent } from '@lvlte/ulp';
import { Double } from 'double.js';

/**
 * Given the Farey pair a/b, c/d in the Farey sequence of order N, returns the
 * next fraction e/f in that sequence, represented as [e, f].
 */
function fareyNext(a: number, b: number, c: number, d: number, N: number): [number, number] {
  if (d <= 1) throw RangeError();
  const k = Math.floor((b + N)/d);
  return [k*c - a, k*d - b];
}

// Generate reduced fractions using Farey sequence of order N.
const N = 1000;
let [a, b] = [0, 1];
let [c, d] = [1, N];
const fareyFractions: Array<[number, number, number]> = [[c/d, c, d]];
const fareyInverses: Array<[number, number, number]> = [];
do {
  [a, b, c, d] = [c, d, ...fareyNext(a, b, c, d, N)];
  fareyFractions.push([c/d, c, d]);
  if (c > 1) { // exclude integers
    fareyInverses.push([d/c, d, c]);
  }
} while (d !== 1);


// Generate pseudo-random numbers evenly spread in the float64 range 2^±53

const SEED = Math.sqrt(2);
const random = (function () {
  let n = SEED;
  return function(): number {
    const x = Math.sin(n++);
    return x - Math.floor(x);
  }
})();

const randomX: number[] = [];
const numPerExp = 10;
const nbits = 53;
let exp = -nbits;

do {
  for (let i=0; i<numPerExp; i++) {
    const x = random();
    const p = exp - exponent(x);
    randomX.push(x * 2**p);
  }
} while (++exp < nbits);

// Generic test function
function rationalizeTest(x: number, tol: number = eps(x), f64DivEq: boolean = false) {
  const [p, q] = rationalize(x, tol);
  const ee = new Double(p).div(q).sub(x).abs();
  expect(ee.le(tol)).toBe(true); // |x - p/q| ≤ tol holds mathematically
  // expect([x, p, q, ee.le(tol)]).toEqual([x, p, q, true]); // debug
  if (f64DivEq) {
    // float64 division of p/q should be exactly x (when tol <= eps(x)/2)
    expect(p/q).toEqual(x);
  }
}

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

  describe(`rationalize(x = p/q) should return [p, q] (${fareyFractions.length} fractions tested)`, () => {
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

  describe(`rationalize(x = q/p) should return [q, p] (${fareyInverses.length} fractions tested)`, () => {
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
});


describe(`Given a random number x in the range [2^-53, 2^+53) (${randomX.length} numbers tested)`, () => {

  describe(`rationalize(x) should return [p, q] such that |x - p/q| ≤ tol`, () => {
    test(`with tol = eps(x)`, () => {
      const EPSILON2 = Number.EPSILON/2;
      randomX.forEach(x => {
        if (x <= EPSILON2) expect(() => rationalize(x)).toThrow(RangeError);
        else rationalizeTest(x);
      });
    });
    test(`with tol = eps(x)*2`, () => {
      randomX.forEach(x => rationalizeTest(x, eps(x)*2));
    });
    const tol = 0.01;
    test(`with tol = ${tol}`, () => {
      randomX.forEach(x => rationalizeTest(x, tol));
    });
    test(`with tol = eps(x)/2, also expect float64 division p/q = x`, () => {
      randomX.forEach(x => {
        if (x < Number.EPSILON) {
          // Most of the |x|'s below Number.EPSILON can't be represented with
          // safe integers given this tolerance, but not all of them.
          try {
            rationalizeTest(x, eps(x)/2, true);
          }
          catch (e) {
            // @ts-ignore
            const str = e?.message ?? '';
            expect(e).toBeInstanceOf(RangeError);
            expect(str.endsWith('is not a safe integer')).toBe(true);
          }
        }
      });
    });
  });
});

describe('Edge cases', () => {
  test('NaN', () => expect(() => rationalize(NaN)).toThrow(RangeError));
  test.each(['1', null, undefined, {}, []])('%s', (x) => {
    expect(() => rationalize(x as unknown as number)).toThrow(TypeError);
  });
  test('±Infinity', () => {
    expect(rationalize(Infinity)).toEqual([1, 0]);
    expect(rationalize(-Infinity)).toEqual([-1, 0]);
  });
  test('±0', () => {
    expect(rationalize(0)).toEqual([0, 1]);
    expect(rationalize(-0)).toEqual([-0, 1]);
  });
  test('Unsafe integer (numerator)', () => expect(() => rationalize(2**53)).toThrow(RangeError));
  test('Unsafe integer (denominator)', () => expect(() => rationalize(1/(2**53+2))).toThrow(RangeError));
  test('Invalid tolerance', () => {
    expect(() => rationalize(1, -1)).toThrow(RangeError);
    expect(() => rationalize(1, NaN)).toThrow(RangeError);
    expect(() => rationalize(1, '1' as unknown as number)).toThrow(TypeError);
    expect(() => rationalize(1, null as unknown as number)).toThrow(TypeError);
  });
});
