# rationalize

[![](https://avatars.githubusercontent.com/u/743164?s=12&v=4)](#) _Inspired by Julia's [rationalize](https://docs.julialang.org/en/v1/base/math/#Base.rationalize)_ [![](https://avatars.githubusercontent.com/u/743164?s=12&v=4)](#)

> Represent a floating point number `x` as a rational number `[p, q]` where
> `|x - p/q| ≤ tol` (the result will differ from x by no more than the given
> tolerance).

```ts
function rationalize(x: number, tol: number = eps(x)): [number, number]
```

## Install

```sh
npm install @lvlte/rationalize
```

## Usage

```js
// ESM
import { rationalize } from '@lvlte/rationalize';
```
```js
// CJS
const { rationalize } = require('@lvlte/rationalize');
```
```js
const [p1, q1] = rationalize(0.1);            // [1, 10]
const [p2, q2] = rationalize(Math.PI);        // [165707065, 52746197]
const [p3, q3] = rationalize(Math.PI, 0.01);  // [22, 7]

// The sign of x always goes to the numerator
const [p4, q4] = rationalize(-13.78);         // [-689, 50]
const [p5, q5] = rationalize(-0);             // [-0, 1]
```

## Safe Integers

The output ratio's components are guaranteed to be safe integers (float64
integers in the range `[-2^53 + 1, +2^53 - 1]`). In case one of
the component goes out of this range, a `RangeError` is thrown, which does not
happen as long as the tolerance is set to a value greater than or equal to
`eps(x)` (default). The exception to this rule concerns absolute values of `x`
less than `1/(2^53 - 1)` or greater than `2^53 - 1`. To rationalize these
tiny/huge numbers with the best precision, the numerator and denominator needs
to be represented with `bigint` (coming soon).

## Tolerance

The default tolerance is the [ULP](https://github.com/lvlte/ulp) of `x`, which
allows the best accuracy knowing that most of the floating point numbers we are
using, such as `0.1`, are already approximations. In most cases, you don't need
to change that except if you want to reduce the precision of the output. In case
you want to increase it, note that **using a zero tolerance will yield the exact
(binary) representation of x as a decimal ratio**. One legitimate case of using
tolerance less than `eps(x)` exists though : ensuring the result of the floating
point division `p/q` equals `x`, in this case you need to set the tolerance to
`eps(x)/2` :

```js
import { rationalize, eps } from '@lvlte/rationalize';

let x = 0.8;    // 0.8000000000000000(444089209850062616169452667236328125)
const [p1, q1] = rationalize(x);          // [4, 5]
const [p2, q2] = rationalize(x, 0);       // [3602879701896397, 4503599627370496]

x = 0.1 + 0.2;  // 0.30000000000000004(44089209850062616169452667236328125)
const [p3, q3] = rationalize(x);            // [3, 10]
const [p4, q4] = rationalize(x, eps(x)/2);  // [415716888680356, 1385722962267853]
console.log(p3/q3 === x)                    // false
console.log(p4/q4 === x)                    // true
```

