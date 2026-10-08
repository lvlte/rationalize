import { describe, expect, test } from '@jest/globals';
import { rationalize, rationalizeBig, eps } from '../src/index.js';

describe('Edge cases', () => {
  test('NaN', () => {
    expect(() => rationalize(NaN)).toThrow(RangeError);
    expect(() => rationalizeBig(NaN)).toThrow(RangeError);
  });
  test('Wrong type', () => {
    ['1', null, undefined, {}, []].forEach(x => {
      expect(() => rationalize(x as unknown as number)).toThrow(TypeError);
      expect(() => rationalizeBig(x as unknown as number)).toThrow(TypeError);
    });
  });
  test('±Infinity', () => {
    expect(rationalize(Infinity)).toEqual([1, 0]);
    expect(rationalize(-Infinity)).toEqual([-1, 0]);
    expect(rationalizeBig(Infinity)).toEqual([1n, 0n]);
    expect(rationalizeBig(-Infinity)).toEqual([-1n, 0n]);
  });
  test('±0', () => {
    expect(rationalize(0)).toEqual([0, 1]);
    expect(rationalize(-0)).toEqual([-0, 1]);
    expect(rationalizeBig(0)).toEqual([0n, 1n]);
    expect(rationalizeBig(-0)).toEqual([0n, 1n]);
  });
  test('tol >= |x|', () => {
    expect(rationalize(Math.PI, Math.PI)).toEqual([0, 1]);
    expect(rationalize(-Math.PI, Math.PI)).toEqual([-0, 1]);
    expect(rationalizeBig(Math.PI, Math.PI)).toEqual([0n, 1n]);
    expect(rationalizeBig(-Math.PI, Math.PI)).toEqual([0n, 1n]);
  });
  test('tol = 1', () => {
    [Math.PI, 1/12, 17/11, 134217728.125].forEach(x => {
      const xpt = Math.trunc(x);
      const xmt = Math.trunc(-x);
      expect(rationalize(x, 1)).toEqual([xpt, 1]);
      expect(rationalize(-x, 1)).toEqual([xmt, 1]);
      expect(rationalizeBig(x, 1)).toEqual([BigInt(xpt), 1n]);
      expect(rationalizeBig(-x, 1)).toEqual([BigInt(xmt), 1n]);
    });
  });
  test('tol = 0', () => {
    expect(rationalize(0.25, 0)).toEqual([1, 4]);
    expect(rationalize(-0.75, 0)).toEqual([-3, 4]);
    expect(rationalize(0.8, 0)).toEqual([3602879701896397, 4503599627370496]);
    expect(rationalize(456.7890123456789, 0)).toEqual([2008979322057555, 4398046511104]);
    expect(rationalizeBig(0.25, 0)).toEqual([1n, 4n]);
    expect(rationalizeBig(-0.75, 0)).toEqual([-3n, 4n]);
    expect(rationalizeBig(0.8, 0)).toEqual([3602879701896397n, 4503599627370496n]);
    expect(rationalizeBig(456.7890123456789, 0)).toEqual([2008979322057555n, 4398046511104n]);
    // 0.1 denominator is 2^55 (unsafe float int)
    expect(() => rationalize(0.1, 0)).toThrow(RangeError);
    expect(() => rationalize(-0.1, 0)).toThrow(RangeError);
    expect(rationalizeBig(0.1, 0)).toEqual([3602879701896397n, 36028797018963968n]);
    expect(rationalizeBig(-0.1, 0)).toEqual([-3602879701896397n, 36028797018963968n]);
  });
  test('Unsafe float64 integer', () => {
    const x1 = 1/9007199254740994;
    expect(() => rationalize(x1)).toThrow(RangeError);
    expect(rationalizeBig(x1)).toEqual([1n, 9007199254740994n]);
    const x2 = 1/9007199254740992;
    // denominator is minimized with default tolerance, not with eps(x)/2
    expect(rationalize(x2)).toEqual([1, 9007199254740991]);
    expect(() => rationalize(x2, eps(x2)/2)).toThrow(RangeError);
    expect(rationalizeBig(x2)).toEqual([1n, 9007199254740991n]);
    expect(rationalizeBig(x2, eps(x2)/2)).toEqual([1n, 9007199254740992n]);
  });
  test('Invalid tolerance', () => {
    expect(() => rationalize(1, -1)).toThrow(RangeError);
    expect(() => rationalize(1, NaN)).toThrow(RangeError);
    expect(() => rationalize(1, '1' as unknown as number)).toThrow(TypeError);
    expect(() => rationalize(1, null as unknown as number)).toThrow(TypeError);
    expect(() => rationalizeBig(1, -1)).toThrow(RangeError);
    expect(() => rationalizeBig(1, NaN)).toThrow(RangeError);
    expect(() => rationalizeBig(1, '1' as unknown as number)).toThrow(TypeError);
    expect(() => rationalizeBig(1, null as unknown as number)).toThrow(TypeError);
  });
});
