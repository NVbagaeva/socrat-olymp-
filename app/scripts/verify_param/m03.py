"""Метод 3 «Метод областей и график в координатах (x; a)».

Уравнения — счёт корней по x. Неравенства — множество решений на сетке:
кусок ненулевой длины — бесконечно много решений; концы области и особые
точки проверяются точно.
"""

import math

import numpy as np

from obshchee import INF, chislo, korni


def nerav(ok, lo, hi, n=400_001, tochki=()):
    """Сколько x из [lo; hi] удовлетворяют ok: INF, если есть кусок; иначе — отдельные точки."""
    xs = np.linspace(lo, hi, n)
    with np.errstate(all="ignore"):
        m = ok(xs)
    m = np.where(np.isnan(m.astype(float)), False, m)
    beg = np.diff(np.concatenate(([0], m.astype(int), [0])))
    dlina = np.where(beg == -1)[0] - np.where(beg == 1)[0]
    if dlina.size and dlina.max() > 3:
        return INF
    pts = set()
    for t in tochki:
        with np.errstate(all="ignore"):
            v = ok(np.array([float(t)]))[0]
        if v:
            pts.add(round(float(t), 9))
    return len(pts)


# ── Разборы ─────────────────────────────────────────────────────────


def r1(a):  # 00 пр. 4: x²+y² ≤ x²y²+1, x²+y² ≤ 2, (x−a)²+(y−a)² = |a| — единственное решение
    r = math.sqrt(abs(a))
    f = lambda x, y: np.maximum(x**2 + y**2 - x**2 * y**2 - 1, x**2 + y**2 - 2)
    if r == 0:
        return f(np.array([a]), np.array([a]))[0] <= 1e-12
    th = np.linspace(0, 2 * math.pi, 400_001)[:-1]
    h = f(a + r * np.cos(th), a + r * np.sin(th))
    if (h < -1e-9).sum() > 3:
        return False
    k = korni(lambda t: f(a + r * np.cos(t), a + r * np.sin(t)), 0, 2 * math.pi - 1e-9, tochki=(math.pi / 4, 5 * math.pi / 4))
    if k != INF and len(k) >= 2 and k[0] < 1e-4 and k[-1] > 2 * math.pi - 1e-4:
        k = k[:-1]
    return chislo(k) == 1


def r2(a):  # 01 №2: (a − x − 1)(a + 3 − (x−2)²)/√(x − 1) = 0 — единственное решение
    obl = lambda x: np.where(x > 1, 1.0, np.nan)
    k1 = korni(lambda x: (a - x - 1) * obl(x), 1, 30, n=400_001)
    k2 = korni(lambda x: (a + 3 - (x - 2) ** 2) * obl(x), 1, 30, n=400_001)
    vse = sorted(set(round(t, 7) for t in k1 + k2 if t > 1 + 1e-9))
    return len(vse) == 1


def r3(a):  # 47 №7: |x² + a² − 6x − 4a| = 2x + 2a — ровно четыре решения
    return chislo(korni(lambda x: np.abs(x**2 + a * a - 6 * x - 4 * a) - 2 * x - 2 * a, -20, 20, n=800_001)) == 4


# ── Опорные ─────────────────────────────────────────────────────────


def o1(a):  # x² − 2x = a, ровно два решения на [0; 3]
    return chislo(korni(lambda x: x**2 - 2 * x - a, 0, 3, tochki=(0, 3, 1))) == 2


def o2(a):  # (x − a)(x + a − 4) = 0, ровно одно решение на [0; 1]
    k1 = [a] if 0 <= a <= 1 else []
    k2 = [4 - a] if 0 <= 4 - a <= 1 else []
    return len(set(k1 + k2)) == 1


def bez_vykolotyh(k, nuli):
    """Корни, не совпадающие с нулями знаменателя nuli."""
    return [t for t in k if all(abs(t - z) > 1e-7 for z in nuli)]


def o3(a):  # (x² − a)/(x − 1) = 0 — ровно одно решение
    k = korni(lambda x: x**2 - a, -10, 10, tochki=(0,))
    return len(bez_vykolotyh(k, [1])) == 1


def o4(a):  # точка (a; 1) удовлетворяет x²y − y²x − 2xy + 2y² ≤ 0
    x, y = a, 1.0
    return x * x * y - y * y * x - 2 * x * y + 2 * y * y <= 1e-12


# ── Тренировка ──────────────────────────────────────────────────────


def t1(a):  # 01 №3: √(9x⁴ + 4x²(5x + 2) − a(2x² − a)) = 3x² + 4x − a — ровно три корня
    g = lambda x: np.sqrt(9 * x**4 + 4 * x**2 * (5 * x + 2) - a * (2 * x**2 - a)) - (3 * x**2 + 4 * x - a)
    return chislo(korni(g, -10, 10, n=400_001, tochki=(0, -2, a))) == 3


def t2(a):  # 01 №5: (a + 6 − (x² + 2x))(a − cos x) ≤ 0, x² + 2x ≤ 3 — более одного решения
    n = nerav(lambda x: (a + 6 - (x**2 + 2 * x)) * (a - np.cos(x)) <= 1e-12, -3, 1, tochki=(-3, -1, 0, 1))
    return n == INF or n > 1


def t3(a):  # 04 №5: (x² − 4x + a)/(5x² − 6ax + a²) = 0 — ровно два решения
    k = korni(lambda x: x**2 - 4 * x + a, -20, 20, n=400_001)
    # 5x² − 6ax + a² = (5x − a)(x − a): нули a/5 и a
    return len(bez_vykolotyh(k, [a / 5, a])) == 2


def t4(a):  # 04 №6: x² + a² + 2x − 4a = |4x + 2a| — более двух корней
    n = chislo(korni(lambda x: x**2 + a * a + 2 * x - 4 * a - np.abs(4 * x + 2 * a), -20, 20, n=800_001))
    return n == INF or n > 2


def t5(a):  # 04 №7: √(6+x−x²)/(x−2a) ≤ √(6+x−x²)/(2x−2a+4) — ровно два решения
    def ok(x):
        s = np.sqrt(6 + x - x**2)
        d1, d2 = x - 2 * a, 2 * x - 2 * a + 4
        good = (np.abs(d1) > 1e-12) & (np.abs(d2) > 1e-12) & np.isfinite(s)
        with np.errstate(all="ignore"):
            return good & (s / d1 <= s / d2 + 1e-15)

    return nerav(ok, -2, 3, tochki=(-2, 3)) == 2


def t6(a):  # 04 №8: |(x² + x − 2a)/(x + a) − 1| ≤ 2 не имеет решений на (1; 2)
    xs = np.linspace(1, 2, 400_001)[1:-1]
    with np.errstate(all="ignore"):
        v = (np.abs(xs + a) > 1e-12) & (np.abs((xs**2 + xs - 2 * a) / (xs + a) - 1) <= 2)
    return not v.any()


def t7(a):  # 03 №4: (x² + x + a)² = 2x⁴ + 2(x + a)² — единственное решение на [0; 2]
    # корни многочлена 4-й степени — точно (numpy.roots), с отбором по отрезку
    c = np.polynomial.polynomial.polysub(
        np.polynomial.polynomial.polypow([a, 1, 1], 2),
        np.polynomial.polynomial.polyadd([0, 0, 0, 0, 2], np.polynomial.polynomial.polymul([2], np.polynomial.polynomial.polypow([a, 1], 2))),
    )
    r = np.roots(c[::-1])
    # кратные корни численно расщепляются на ~1e-4: склеиваем близкие
    r = sorted(z.real for z in r if abs(z.imag) < 1e-3 and -1e-6 <= z.real <= 2 + 1e-6)
    out = [t for i, t in enumerate(r) if i == 0 or t - r[i - 1] > 1e-3]
    return len(out) == 1


def t8(a):  # 47 №10 (a > 0): решения (x − 2)/(ax² − (a²+1)x + a) ≥ 0 — луч
    if a <= 0:
        return False
    xs = np.linspace(-60, 60, 1_200_001)
    with np.errstate(all="ignore"):
        d = a * xs**2 - (a * a + 1) * xs + a
        m = (np.abs(d) > 1e-12) & ((xs - 2) / d >= 0)
    beg = np.diff(np.concatenate(([0], m.astype(int), [0])))
    s, e = np.where(beg == 1)[0], np.where(beg == -1)[0] - 1
    return len(s) == 1 and (s[0] == 0 or e[0] == len(xs) - 1)


def t9(a):  # √(x + 1)·(a − x²)(a − x − 2) = 0 — ровно два различных решения
    obl = lambda x: np.where(x >= -1, 1.0, np.nan)
    pts = {-1.0}
    for g in (lambda x: (a - x**2) * obl(x), lambda x: (a - x - 2) * obl(x)):
        k = korni(g, -1, 30, n=400_001, tochki=(-1,))
        pts |= set(round(t, 7) for t in k)
    return len(pts) == 2


ZADACHI = {
    "19-m03-r1": (r1, (-4, 4), (0.5, -0.5)),
    "19-m03-r2": (r2, (-6, 10), ()),
    "19-m03-r3": (r3, (-4, 10), (1 - math.sqrt(5), 1 + math.sqrt(5), -1, 0, 8, -2)),
    "19-m03-o1": (o1, (-3, 5), ()),
    "19-m03-o2": (o2, (-2, 6), ()),
    "19-m03-o3": (o3, (-3, 5), ()),
    "19-m03-o4": (o4, (-2, 5), ()),
    "19-m03-t1": (t1, (-6, 6), (0, 4)),
    "19-m03-t2": (t2, (-10, 4), ()),
    "19-m03-t3": (t3, (-8, 6), ()),
    "19-m03-t4": (t4, (-4, 8), (1 - math.sqrt(10), 3 + math.sqrt(10))),
    "19-m03-t5": (t5, (-4, 8), (1.5, 0)),
    "19-m03-t6": (t6, (-4, 12), (-1, -2)),
    "19-m03-t7": (t7, (-2, 4), ()),
    "19-m03-t8": (t8, (-1, 4), (2, 0.5)),
    "19-m03-t9": (t9, (-2, 7), ()),
}
