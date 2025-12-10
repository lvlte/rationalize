## Finding the best rational approximation of a floating-point number, given some tolerance

Let $x$ be the absolute value of a given finite floating-point number, and $t$ the given tolerance (absolute error tolerated). We seek the best rational approximation $\frac{p}{q}$ for $x$ such that $\left|\frac{p}{q} - x\right| \leq t$.


### Convergents

A basic approach would be to compute the convergents $\frac{p_n}{q_n}$ of the [regular continued fraction](https://en.wikipedia.org/wiki/Simple_continued_fraction) representation of $x$ using the Euclidean algorithm ie.

- Initial conditions :

$$\begin{align*}
(p_{-2}, \text{ } p_{-1}) &= (0, \text{ } 1) \\
(q_{-2}, \text{ } q_{-1}) &= (1, \text{ } 0) \\ \\
x_0 &= x \\
a_0 &= \lfloor x_0 \rfloor \\
r_0 &= x_0 - a_0
\end{align*}$$

- Recursive step for $n > 0$ :

$$\begin{align*}
x_n &= \frac{1}{r_{n-1}} \\
a_n &= \lfloor x_n \rfloor \\
r_n &= x_n - a_n
\end{align*}$$

- Recurrence relation for $n \geq 0$ :

$$\begin{align*}
p_n &= a_n \cdot p_{n-1} + p_{n-2} \\
q_n &= a_n \cdot q_{n-1} + q_{n-2}
\end{align*}$$

- Predicate :

$$
\left|\frac{p_n}{q_n} - x\right| > t
$$

until we obtain a convergent $\frac{p_n}{q_n}$ that satisfies $\left|\frac{p_n}{q_n} - x\right| \leq t$.

However at this point, while standard continued fractions generate "best approximations of the second kind", $\frac{p_n}{q_n}$ is not necessarily the best rational approximation for $x$ **given $\boldsymbol{t}$**, that is, **the one satisfying the inequality that has the smallest denominator** (ie. any approximation with a larger denominator would be an unnecessary use of precision).


### Optimal Semiconvergent

Actually the best rational approximation we are after is one of the first kind, a semiconvergent $\frac{p}{q}$ such that $\left|\frac{p}{q} - x\right| \leq t$, with :

$$\begin{align*}
p_{n-1} < p \leq {p_n} \\
q_{n-1} < q \leq {q_n}
\end{align*}$$

where $q$ and $p$ are minimized, which amounts to find the smallest integer value $a$ such that $0 < a \leq a_n$ for which $\left|\frac{p}{q} - x\right| \leq t$, from the recurrence relation :

$$\begin{align*}
p &= a \cdot p_{n-1} + p_{n-2} \\
q &= a \cdot q_{n-1} + q_{n-2}
\end{align*}$$

The magnitude of the error of $\frac{p}{q}$ is :

$$\begin{align*}
\left| \frac{p}{q} - x \right| &= \left| \frac{a \cdot p_{n-1} + p_{n-2}}{a \cdot q_{n-1} + q_{n-2}} - x \right| \\ \\
\left| \frac{p - x \cdot q}{q} \right| &= \left| \frac{a \cdot p_{n-1} + p_{n-2} - x(a \cdot q_{n-1} + q_{n-2})}{a \cdot q_{n-1} + q_{n-2}} \right| \\ \\
\left| \frac{p - x \cdot q}{q} \right| &= \left| \frac{a \cdot (p_{n-1} - x \cdot q_{n-1}) + (p_{n-2} - x \cdot q_{n-2})}{a \cdot q_{n-1} + q_{n-2}} \right| \\ \\
\text{let } e_{n} &= p_{n} - x \cdot q_{n} \\ \\
\left| \frac{p - x \cdot q}{q} \right| &= \left| \frac{a \cdot e_{n-1} + e_{n-2}}{a \cdot q_{n-1} + q_{n-2}} \right| \\
\end{align*}$$

NB. $e_{n-1}$ and $e_{n-2}$ are the signed errors of the previous two convergents multiplied by their respective denominators. As ${a}$ increases, the denominator $a \cdot q_{n-1} + q_{n-2}$ increases and the absolute error decreases monotonically.

We want the smallest positive integer value $a$ for which the absolute error is less than or equal to $t$ :

$$\begin{align*}
\left| \frac{a \cdot e_{n-1} + e_{n-2}}{a \cdot q_{n-1} + q_{n-2}} \right| \leq t \\
\end{align*}$$

Let $m$ a positive number such that $\left| \frac{m \cdot e_{n-1} + e_{n-2}}{m \cdot q_{n-1} + q_{n-2}} \right| = t$. This equation has 2 solutions for $m$, one on each side of $x$ on the number line, where the error equals $\pm t$ :

$$\begin{align*}
\frac{m \cdot e_{n-1} + e_{n-2}}{m \cdot q_{n-1} + q_{n-2}} &= \pm t \\ \\
m \cdot e_{n-1} + e_{n-2} &= \pm t \cdot ( m \cdot q_{n-1} + q_{n-2} ) \\
m \cdot e_{n-1} &= -e_{n-2} \pm t \cdot m \cdot q_{n-1} \pm t \cdot q_{n-2} \\
m \cdot e_{n-1} \mp t \cdot m \cdot q_{n-1} &= -e_{n-2} \pm t \cdot q_{n-2} \\
m &= \frac{-e_{n-2} \pm t \cdot q_{n-2}}{\text{ }\text{ }\text{ }e_{n-1} \mp t \cdot q_{n-1}} \\
\end{align*}$$

Since $e_{n-1}$ and $e_{n-2}$ have opposite signs, we have :

$$\begin{align*}
m_1 = \frac{\left| e_{n-2} \right| - t \cdot q_{n-2}}{\left| e_{n-1} \right| + t \cdot q_{n-1}} \\ \\
m_2 = \frac{\left| e_{n-2} \right| + t \cdot q_{n-2}}{\left| e_{n-1} \right| - t \cdot q_{n-1}} \\
\end{align*}$$

Since $m_1 < m_2$, the smallest integer $a$ for which the absolute error of $\frac{p}{q}$ is less than or equal to $t$ equals $\lceil m_1 \rceil$ :

$$\begin{align*}
a = \left\lceil \frac{\left| e_{n-2} \right| - t \cdot q_{n-2}}{\left| e_{n-1} \right| + t \cdot q_{n-1}} \right\rceil \\
\end{align*}$$


### Floating-point arithmetic and precision issues

[Floating-point operations cannot accurately represent true arithmetic operations](https://en.wikipedia.org/wiki/Floating-point_arithmetic#Accuracy_problems), so implementing the recursive step mentioned above as it is using floating-point arithmetic would be inexact : as the result of $1/r_{n-1}$ is subject to roundoff error, $x_n = \frac{1}{r_{n-1}}$ translates to $x_n \approx \frac{1}{r_{n-1}}$, and $\lfloor x_n \rfloor$ could be off by $\pm 1$ (and thus the value of $a_n$ and $r_n$). For the same reason, the result of the ceil division used to find the smallest $a$ could be off as well, and the comparison between $\left|p_n/q_n - x\right|$ and $t$ might be wrong. In other words, we need to avoid floating-point division roundoff error, or at least be able to measure it.

There are two options to address this :
- use twice the precision of $x$ to represent the involved variables and for every operations (using Veltkamp/Dekker algorithms if $x$ cannot be represented with a higher precision number type in the language used for the implementation).
- or prevent intermediate rounding when computing $a_n$ and keep track of the corresponding error term $e_n$ at each step $n$.


### Preventing intermediate rounding

The error term also has a recurrence relation :

$$\begin{align*}
e_{n} &= p_{n} - x \cdot q_{n} \\
      &= a_n \cdot p_{n-1} + p_{n-2} - x \cdot (a_n \cdot q_{n-1} + q_{n-2}) \\
      &= a_n \cdot (p_{n-1} - x \cdot q_{n-1}) + p_{n-2} - x \cdot q_{n-2} \\ \\
e_{n} &= a_n \cdot e_{n-1} + e_{n-2}
\end{align*}$$

We can write this as $\text{ } e_{n-2} = -a_n \cdot e_{n-1} + e_{n} \text{ }$, which means, since $\left|e_{n}\right| < \left|e_{n-1}\right|$, that **$\boldsymbol{-a_n}$ and $\boldsymbol{e_{n}}$ are respectively the quotient and remainder of $\boldsymbol{\frac{e_{n-2}}{e_{n-1}}}$**.

So we can compute $e_{n}$ as the remainder of $\frac{e_{n-2}}{e_{n-1}}$ to obtain an error term which is coherent with the value of $a_n$, precisely because we now have $a_n = \left| \frac{e_{n-2} - e_{n}}{e_{n-1}} \right|$ which remains error-free using floating-point arithmetic. The same approach should be used to avoid intermediate rounding when calculating the smallest $a$.

Another advantage of doing this is that we can check if the error term matches the tolerance before even having to produce the corresponding convergents for $n$. In order to do that, we also need to maintain a tolerance term $t_n$ that is comparable to $e_n$. Since $\left|\frac{p_n}{q_n} - x\right| \leq t$ is equivalent to $\left|e_n \right| \leq t \cdot q_n$, we define $t_n = t \cdot q_n$ in the initial conditions and use the recurrence relation $t_n = a_n \cdot t_{n-1} + t_{n-2}$ in the next steps to avoid relying on $q_n$ for the comparison.

NB. The exactness of $t_n$ after some iterations depends on the precision required by $t$. Actually, inaccuracies can occur when the binary representation of $t$ occupies most of the bits of its mantissa. In practice, $t$ most likely is (should be) the [unit of least precision](https://en.wikipedia.org/wiki/Unit_in_the_last_place) of $x$, in which case $t_n$ remains exact.


### Best rational approximation

By maintaining an exact error term $e_n$ and a scaled tolerance $t_n$, we can eliminate floating-point roundoff errors and avoid maintaining the tail ($x_n$ and $r_n$) of the continued fraction. The optimized algorithm is based on the following :

- Initial conditions :

$$\begin{align*}
(p_{-2}, \text{ } p_{-1}) &= (0, \text{ } 1) \\
(q_{-2}, \text{ } q_{-1}) &= (1, \text{ } 0) \\ \\
(e_{-2}, \text{ } e_{-1}) &= (-x, \text{ } 1) \\
(t_{-2}, \text{ } t_{-1}) &= (t, \text{ } 0) \\
\end{align*}$$

- Recursive step for $n \geq 0$ :

$$\begin{align*}
e_n &= rem(e_{n-2}, \text{ } e_{n-1}) \\
a_n &= \left| \frac{e_{n-2} - e_{n}}{e_{n-1}} \right| \\
\end{align*}$$

- Recurrence relations for $n \geq 0$ :

$$\begin{align*}
p_n &= a_n \cdot p_{n-1} + p_{n-2} \\
q_n &= a_n \cdot q_{n-1} + q_{n-2} \\
t_n &= a_n \cdot t_{n-1} + t_{n-2}
\end{align*}$$

- Predicate :

$$
\left| e_n \right| > t_n
$$

where $rem(x, y)$ is a remainder function that takes the sign of $x$, for example :

- C : `fmod(x, y)`
- JavaScript : `x % y`
- Julia: `x % y`, `rem(x, y, RoundToZero)`
- Python: `math.fmod(x, y)` (`%` operator is fine if working with absolute values for $e_n$)

<br>

Once $|e_n| \leq t_n$, we know $\frac{p_n}{q_n}$ satisfies the tolerance.

If $a_n = 1$, then $\frac{p_n}{q_n}$ is already optimal. Otherwise, we find the optimal semi-convergent $\frac{p}{q}$ by calculating the smallest valid coefficient $a$ using the error and tolerance terms, then compute the final numerator and denominator :

$$\begin{align*}
a &= \left\lceil \frac{|e_{n-2}| - t_{n-2}}{|e_{n-1}| + t_{n-1}} \right\rceil \\ \\
p &= a \cdot p_{n-1} + p_{n-2} \\
q &= a \cdot q_{n-1} + q_{n-2}
\end{align*}$$
