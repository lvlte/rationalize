import { rationalize } from '../src/index';
import { eps } from '@lvlte/ulp';
import { Double } from 'double.js';

function randint(min: number = 0, max: number = 1e+8): number {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function gcd(x: number, y: number): number {
  if (x === 0) {
    return Math.abs(y);
  }
  while (y !== 0) {
    [x, y] = [y, x % y];
  }
  return Math.abs(x);
}

function divgcd(x: number, y: number): [number, number] {
  const d = gcd(x, y);
  return [x/d, y/d];
}

const N = 1000;
const X = [] as Array<[number, number]>;
let n = 0;
while (n++ < N) {
  const [a, b] = divgcd(randint(), randint());
  X.push(a < b ? [a, b] : [b, a]);
}

describe('rationalize(x ≤ 1, tol = eps(x))', () => {
  test.each(X)('±%s, ±%s', (a: number, b: number) => {
    const x = a/b;
    const [p, q] = rationalize(x);
    const ee = new Double(p).div(q).sub(x).abs();
    expect(ee.le(eps(x))).toBe(true);
  });
});

describe('rationalize(x ≥ 1, tol = eps(x))', () => {
  test.each(X)('±%s, ±%s', (b: number, a: number) => {
    const x = a/b;
    const [p, q] = rationalize(x);
    const ee = new Double(p).div(q).sub(x).abs();
    expect(ee.le(eps(x))).toBe(true);
  });
});

describe('Edge cases', () => {
  test('NaN', () => expect(() => rationalize(NaN)).toThrow(RangeError));
  test.each(['1', null, undefined, {}, []])('%s', (x) => {
    expect(() => rationalize(x as unknown as number)).toThrow(TypeError);
  });
  test('Invalid tolerance', () => {
    expect(() => rationalize(1, -1)).toThrow(RangeError);
    expect(() => rationalize(1, NaN)).toThrow(RangeError);
    expect(() => rationalize(1, '1' as unknown as number)).toThrow(TypeError);
    expect(() => rationalize(1, null as unknown as number)).toThrow(TypeError);
  });
});
