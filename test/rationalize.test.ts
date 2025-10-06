import { rationalize } from '../src/index';
import { eps, exponent } from '@lvlte/ulp';

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

const N = 100;
const X = [] as Array<[number, number]>;
let n = 0;
while (n++ < N) {
  const [a, b] = divgcd(randint(), randint());
  // const [a, b] = divgcd(randint(1, 100), randint());
  X.push(a < b ? [a, b] : [b, a]);
  // X.push([a, b]);
}

describe('rationalize(x < 1) ', () => {
  test.each(X)('±%s, ±%s', (a: number, b: number) => {
    const x = a/b;
    const [p, q] = rationalize(x);
    const xx = p/q;
    expect(Math.abs(x - xx)).toBeLessThanOrEqual(eps(x));
    // expect([p, q]).toStrictEqual([a, b]);
  });
});

describe('rationalize(x >= 1) ', () => {
  test.each(X)('±%s, ±%s', (b: number, a: number) => {
    const x = a/b;
    const [p, q] = rationalize(x);
    const xx = p/q;
    expect(Math.abs(x - xx)).toBeLessThanOrEqual(eps(x));
    // expect([p, q]).toStrictEqual([a, b]);
  });
});
