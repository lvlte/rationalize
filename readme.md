# rationalize

> Represent a floating point number `x` as a rational number `[p, q]` where
> `|x - p/q| ≤ tol` mathematically (the result will differ from x by no more 
> than the given tolerance).

```ts
function rationalize(x: number, tol: number = eps(x)): [number, number]
function rationalizeBig(x: number, tol: number = eps(x)): [bigint, bigint]
```

## Install

```sh
npm install @lvlte/rationalize
```

Or load from a CDN:

- [jsdelivr](https://www.jsdelivr.com/package/npm/@lvlte/rationalize)
- [unpkg](https://unpkg.com)
- [esm.sh](https://esm.sh/#docs)

## Usage

```ts
import { rationalize } from '@lvlte/rationalize';
// NB. You can also use CJS:
// const { rationalize } = require('@lvlte/rationalize');

const [p1, q1] = rationalize(0.1);            // [1, 10]
const [p2, q2] = rationalize(Math.PI);        // [165707065, 52746197]
const [p3, q3] = rationalize(Math.PI, 0.01);  // [22, 7]

// The sign of x always goes to the numerator
const [p4, q4] = rationalize(-13.78);         // [-689, 50]
const [p5, q5] = rationalize(-0);             // [-0, 1]
```

## Safe Integers

- `rationalize` output ratio's components are guaranteed to be [safe Float64
integers](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/isSafeInteger#description) (in the range `[-2^53 + 1, +2^53 - 1]`) as long as `|x|`
is in the range `[1/(2^53 - 1), 2^53 - 1]` and `tol ≥ eps(x)` (see [Tolerance](#tolerance)).
If one of the component cannot be represented as a safe integer, the function
throws a `RangeError`.
- `rationalizeBig` has no restriction on its output range since it works with
`bigint`, it can represent tiny/huge numbers with arbitrary precision depending 
on the given tolerance.

```ts
import { rationalize, rationalizeBig } from '@lvlte/rationalize';

const x = 4.613769870922415e-18;
const [pF64, qF64] = rationalize(x);    // RangeError: 216742496478280860 is not a safe integer
const [pInt, qInt] = rationalizeBig(x); // [1n, 216742496478280893n]
```

## Tolerance

The default tolerance is `eps(x)` (the [ULP](https://github.com/lvlte/ulp) of
`x`), which allows the best accuracy knowing that most of the floating point
numbers we are using, such as `0.1`, are already approximations. In most cases
we don't need to change that, except if we want to ensure the result of the
floating-point division `p/q` strictly equals `x`, in which case we need to set
the tolerance to `eps(x)/2`. Note that **using a zero tolerance will yield the
[dyadic rational](https://en.wikipedia.org/wiki/Dyadic_rational) representation
of `x`** (exact binary representation as a decimal ratio):
```js
import { rationalize, eps } from '@lvlte/rationalize';

// Reminder ☝️
// 
// 1/3  = 0.(3)           non-terminating: 3 repeats forever
// 1/10 = 0.1             terminating
// 1/10 = 0.0001(1001)₂   non-terminating in base 2: 1001 repeats forever
//
// As for many other terminating decimals, the IEEE 754 Float64 representation 
// of `0.1` is not exact (53 bits of precision):                     ulp
//                                                                    v
// f64(0.1) = 0.0001100110011001100110011001100110011001100110011001101₂
//          = 0.1000000000000000055511151231257827021181583404541015625
//
// Everytime we write `0.1` or see it in our console, the exact value used
// internally is `0.10000000000000000[55511151231257827021181583404541015625]`.
// 
// The portion of decimals less than half ulp (wrapped in square brackets) are
// hidden to preserve our sanity, but that roundoff error can grow and show up
// after some calculations. The most explicit example is probably `0.1 + 0.2`.

x = 0.1 + 0.2;  // 0.30000000000000004[44089209850062616169452667236328125]
const [p1, q1] = rationalize(x, eps(x));    // [3, 10]
const [p2, q2] = rationalize(x, eps(x)/2);  // [ 415716888680356, 1385722962267853]
const [p3, q3] = rationalize(x, 0;          // [1351079888211149, 4503599627370496]
console.log(p1/q1 === x)                    // false
console.log(p2/q2 === x)                    // true   (after rounding)
console.log(p3/q3 === x)                    // true   (mathematically)
```
