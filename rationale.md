## Finding the best rational approximation of a floating-point number $x$, given some tolerance $t$.

The base idea is to compute the convergents $\frac{p_n}{q_n}$ of the regular continued fraction representation of $|x|$ using the Euclidean algorithm, ie.

Initial conditions :

$$\begin{align*}
(p_{-2}, \text{ } q_{-2}) &= (0, \text{ } 1) \\
(p_{-1}, \text{ } q_{-1}) &= (1, \text{ } 0) \\ \\

x_0 &= |x| \\
a_0 &= [x_0] \\
r_0 &= x_0 - a_0
\end{align*}$$

Recursive step for $n > 0$ :

$$\begin{align*}
x_n &= \frac{1}{r_{n-1}} \\
a_n &= [x_n] \\
r_n &= x_n - a_n
\end{align*}$$

Recurrence relation :

$$\begin{align*}
p_n &= a_n \cdot p_{n-1} + p_{n-2} \\
q_n &= a_n \cdot q_{n-1} + q_{n-2}
\end{align*}$$

until we obtain a convergent $\frac{p_n}{q_n}$ that satisfies $\left|\frac{p_n}{q_n} - x\right| \leq t$.

However at this point, while every convergent is known as a "best approximation of the second kind" for $x$, $\frac{p_n}{q_n}$ doesn't necessarily produce the best rational approximation for $x$ **given $t$, that is, the one satisfying the inequality that has the smallest denominator** (ie. any approximation with a larger denominator would be an unnecessary use of precision/complexity).

Actually the best rational approximation we are after is one of the first kind, a semiconvergent $\frac{pp}{qq}$ such that $\left|\frac{pp}{qq} - x\right| \leq t$, with :

$$
p_{n-1} < pp \leq {p_n} \\
q_{n-1} < qq \leq {q_n}
$$

where $qq$ and $pp$ are minimized, which amounts to find the smallest integer value $a$ such that $0 < a \leq a_n$ for which $\left|\frac{pp}{qq} - x\right| \leq t$, from the recurrence relation :

$$\begin{align*}
pp &= a \cdot p_{n-1} + p_{n-2} \\
qq &= a \cdot q_{n-1} + q_{n-2}
\end{align*}$$

The magnitude of the error of $\frac{pp}{qq}$ is :
$$\begin{align*}
\left| \frac{pp}{qq} - x \right| &= \left| \frac{a \cdot p_{n-1} + p_{n-2}}{a \cdot q_{n-1} + q_{n-2}} - x \right| \\ \\
\left| \frac{pp - x \cdot qq}{qq} \right| &= \left| \frac{a \cdot p_{n-1} + p_{n-2} - x(a \cdot q_{n-1} + q_{n-2})}{a \cdot q_{n-1} + q_{n-2}} \right| \\ \\
\left| \frac{pp - x \cdot qq}{qq} \right| &= \left| \frac{a \cdot (p_{n-1} - x \cdot q_{n-1}) + (p_{n-2} - x \cdot q_{n-2})}{a \cdot q_{n-1} + q_{n-2}} \right| \\ \\

\text{let } e_{n} &= p_{n} - x \cdot q_{n} \\ \\

\left| \frac{pp - x \cdot qq}{qq} \right| &= \left| \frac{a \cdot e_{n-1} + e_{n-2}}{a \cdot q_{n-1} + q_{n-2}} \right| \\
\end{align*}$$

NB. $e_{n-1}$ and $e_{n-2}$ are the signed errors of the previous two convergents multiplied by their respective denominators. As ${n}$ increases, the denominator $a \cdot q_{n-1} + q_{n-2}$ increases and the error decreases monotonically.

We want the smallest integer value $a$ for which the absolute error is less than or equal to $t$ :

$$\begin{align*}
\left| \frac{a \cdot e_{n-1} + e_{n-2}}{a \cdot q_{n-1} + q_{n-2}} \right| \leq t \\
\end{align*}$$

Let $m$ a positive number such that $\left| \frac{m \cdot e_{n-1} + e_{n-2}}{m \cdot q_{n-1} + q_{n-2}} \right| = t$. This equation has 2 solutions for $m$, one on each side of $x$ on the number line, where the error equals $±t$ :

$$\begin{align*}
\frac{m \cdot e_{n-1} + e_{n-2}}{m \cdot q_{n-1} + q_{n-2}} &= ±t \\ \\
m \cdot e_{n-1} + e_{n-2} &= ±t \cdot ( m \cdot q_{n-1} + q_{n-2} ) \\

m \cdot e_{n-1} &= -e_{n-2} ±t \cdot m \cdot q_{n-1} ±t \cdot q_{n-2} \\
m \cdot e_{n-1} ∓t \cdot m \cdot q_{n-1} &= -e_{n-2} ±t \cdot q_{n-2} \\
m &= \frac{-e_{n-2} ±t \cdot q_{n-2}}{\text{ }\text{ }\text{ }e_{n-1} ∓t \cdot q_{n-1}} \\
\end{align*}$$

Since $e_{n-1}$ and $e_{n-2}$ have opposite signs, we got :

$$\begin{align*}
m_1 = \frac{\left| e_{n-2} \right| - t \cdot q_{n-2}}{\left| e_{n-1} \right| + t \cdot q_{n-1}} \\ \\
m_2 = \frac{\left| e_{n-2} \right| + t \cdot q_{n-2}}{\left| e_{n-1} \right| - t \cdot q_{n-1}} \\
\end{align*}$$

Since $m_1 < m_2$, the smallest integer $a$ for which the absolute error of $\frac{pp}{qq}$ is less than or equal to $t$ equals $\lceil m_1 \rceil$ :

$$\begin{align*}
a = \left\lceil \frac{\left| e_{n-2} \right| - t \cdot q_{n-2}}{\left| e_{n-1} \right| + t \cdot q_{n-1}} \right\rceil \\
\end{align*}$$

