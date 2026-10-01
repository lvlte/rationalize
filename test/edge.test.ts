import { describe, expect, test } from '@jest/globals';
import { rationalize, eps } from '../src/index.js';

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
    [Math.PI, 1/12, 17/11, 134217728.125].forEach(x => {
      expect(rationalize(x, 1)).toEqual([Math.trunc(x), 1]);
      expect(rationalize(-x, 1)).toEqual([Math.trunc(-x), 1]);
    });
  });
  test('tol = 0', () => {
    expect(rationalize(0.25, 0)).toEqual([1, 4]);
    expect(rationalize(-0.75, 0)).toEqual([-3, 4]);
    expect(rationalize(0.8, 0)).toEqual([
      3602879701896397, //  1100110011001100110011001100110011001100110011001101
      4503599627370496, // 10000000000000000000000000000000000000000000000000000
    ]);
    expect(rationalize(456.7890123456789, 0)).toEqual([
      2008979322057555, //   111001000110010011111110010110110100011001101010011
      4398046511104,    //           1000000000000000000000000000000000000000000
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
