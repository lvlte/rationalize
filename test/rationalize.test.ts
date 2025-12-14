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
    return Math.sin(n++);
  }
})();

const randomX: number[] = [];
const numPerExp = 150;
const nbits = 53;
let exp = -nbits;

do {
  for (let i=0; i<numPerExp; i++) {
    const s = random();
    const p = exp - exponent(s);
    const x = s * 2**p;
    if (!Number.isInteger(x)) {
      randomX.push(x);
    }
  }
} while (++exp < nbits);

// Generic test function
function rationalizeTest(x: number, tol: number = eps(x), f64DivEq: boolean = false, d?: number) {
  const [p, q] = rationalize(x, tol);
  const ee = new Double(p).div(q).sub(x).abs();
  expect(ee.le(tol)).toBe(true); // |x - p/q| ≤ tol holds mathematically
  // expect([x, p, q, ee.le(tol)]).toEqual([x, p, q, true]); // debug
  if (f64DivEq) {
    // float64 division of p/q should be exactly x (when tol <= eps(x)/2)
    expect(p/q).toEqual(x);
  }
  else if (d !== undefined) {
    // q should be minimized.
    tol > 1/d && d > 1 ? expect(q).toBeLessThan(d) : expect(q).toBeLessThanOrEqual(d);
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


describe(`Given a random number x in the range [2^-53, 2^+53) (${randomX.length} numbers tested)`, () => {

  describe(`rationalize(x) should return [p, q] such that |x - p/q| ≤ tol`, () => {
    test(`with tol = eps(x)`, () => {
      const EPSILON2 = Number.EPSILON/2;
      randomX.forEach(x => {
        if (Math.abs(x) <= EPSILON2) expect(() => rationalize(x)).toThrow(RangeError);
        else rationalizeTest(x);
      });
    });
    test(`with tol = eps(x)*2`, () => {
      randomX.forEach(x => rationalizeTest(x, eps(x)*2));
    });

    const tol1 = 0.01;
    test(`with tol = ${tol1}`, () => {
      randomX.forEach(x => rationalizeTest(x, tol1));
    });
    const tol2 = 0.1;
    test(`with tol = ${tol2}`, () => {
      randomX.forEach(x => rationalizeTest(x, tol2));
    });

    test(`with tol = eps(x)/2, also expect float64 division p/q = x`, () => {
      randomX.forEach(x => {
        // Some numbers can't be represented with safe integers given this
        // tolerance.
        try {
          rationalizeTest(x, eps(x)/2, true);
        }
        catch (e) {
          // @ts-ignore
          const str = e?.message ?? '';
          expect(e).toBeInstanceOf(RangeError);
          expect(str.endsWith('is not a safe integer')).toBe(true);
        }
      });
    });
  });
});

describe('Edge cases', () => {
  test('NaN', () => expect(() => rationalize(NaN)).toThrow(RangeError));
  test('Wrong type', () => {
    ['1', null, undefined, {}, []].forEach(x => {
      expect(() => rationalize(x as unknown as number)).toThrow(TypeError);
    });
  });
  test('±Infinity', () => {
    expect(rationalize(Infinity)).toEqual([1, 0]);
    expect(rationalize(-Infinity)).toEqual([-1, 0]);
  });
  test('±0', () => {
    expect(rationalize(0)).toEqual([0, 1]);
    expect(rationalize(-0)).toEqual([-0, 1]);
  });
  test('tol >= |x|', () => {
    expect(rationalize(Math.PI, Math.PI)).toEqual([0, 1]);
    expect(rationalize(-Math.PI, Math.PI)).toEqual([-0, 1]);
  });
  test('tol = 1', () => {
    [Math.PI, 1/12, 17/11, 134217728.125, ].forEach(x => {
      expect(rationalize(x, 1)).toEqual([Math.trunc(x), 1]);
      expect(rationalize(-x, 1)).toEqual([Math.trunc(-x), 1]);
    });
    expect(rationalize(Math.PI, 1)).toEqual([3, 1]);
    expect(rationalize(-Math.PI, 1)).toEqual([-3, 1]);
  });
  test('tol = 0', () => {
    expect(rationalize(0.25, 0)).toEqual([1, 4]);
    expect(rationalize(-0.75, 0)).toEqual([-3, 4]);
    expect(rationalize(0.8, 0)).toEqual([
      3602879701896397, //  1100110011001100110011001100110011001100110011001101
      4503599627370496, // 10000000000000000000000000000000000000000000000000000
    ]);
    // 0.1 denominator would be 2^55 (unsafe)
    expect(() => rationalize(0.1, 0)).toThrow(RangeError);
    expect(() => rationalize(-0.1, 0)).toThrow(RangeError);
  });
  test('Unsafe integer', () => {
    expect(() => rationalize(1/(2**53+2))).toThrow(RangeError);
    const x = 1/2**53;
    // denominator is minimized with default tolerance, not with eps(x)/2
    expect(rationalize(x)).toEqual([1, Number.MAX_SAFE_INTEGER]);
    expect(() => rationalize(x, eps(x)/2)).toThrow(RangeError);
  });
  test('Invalid tolerance', () => {
    expect(() => rationalize(1, -1)).toThrow(RangeError);
    expect(() => rationalize(1, NaN)).toThrow(RangeError);
    expect(() => rationalize(1, '1' as unknown as number)).toThrow(TypeError);
    expect(() => rationalize(1, null as unknown as number)).toThrow(TypeError);
  });
});
