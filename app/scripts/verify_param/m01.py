"""Метод 1 «Графический способ»: проверка разборов, опорных и тренировочных задач.

У каждой задачи — условие «как в тексте задачи», без выкладок решения:
функция по a говорит, выполняется ли требование задачи. Системы сводятся
к одному уравнению только подстановкой второго уравнения в первое.
"""

import numpy as np

from obshchee import INF, chislo, korni, tochki_vmeste

DALEKO = np.concatenate((-np.geomspace(1e7, 40, 40_000), np.linspace(-40, 40, 400_001), np.geomspace(40, 1e7, 40_000)))


def kl(f, kinks):
    """Корни кусочно-линейной функции f точно: на каждом куске — линейное уравнение."""
    t = sorted(set(kinks))
    granicy = [-INF] + t + [INF]
    out = []
    for lo, hi in zip(granicy[:-1], granicy[1:]):
        p = lo + 1 if hi == INF else (hi - 1 if lo == -INF else (lo + hi) / 2)
        q = p + 0.5 if hi == INF else p - 0.5 if lo == -INF else (lo + 3 * hi) / 4
        if lo == -INF and hi == INF:
            p, q = 0.0, 1.0
        k = (f(q) - f(p)) / (q - p)
        b = f(p) - k * p
        if abs(k) < 1e-12:
            if abs(b) < 1e-12:
                return INF
            continue
        x = -b / k
        if (lo == -INF or x >= lo - 1e-12) and (hi == INF or x <= hi + 1e-12):
            if not any(abs(x - y) < 1e-9 for y in out):
                out.append(x)
    return out


def po_setke(g, x=DALEKO, tochki=()):
    """Корни по готовой сетке x (далёкие корни — по логарифмической сетке)."""
    return korni(g, float(x[0]), float(x[-1]), n=len(x), tochki=tochki, setka=x)


# ── Разборы ─────────────────────────────────────────────────────────


def r1(a):  # 00 пр. 1: ||x| − 2| = a(x − 8) + 2, ровно два решения
    return chislo(kl(lambda x: abs(abs(x) - 2) - a * (x - 8) - 2, [-2, 0, 2])) == 2


def r2(k):  # 01 №1: |x − 2| + |x + 1| = kx + 1, более одного решения
    n = chislo(kl(lambda x: abs(x - 2) + abs(x + 1) - k * x - 1, [-1, 2]))
    return n == INF or n > 1


def r3(a):  # 47 №2: система с √(x + 2)/√(6 − x) и прямой x + y = a, ровно два решения
    def g(x):
        y = a - x
        return (y**2 - x * y - y + 3 * x - 6) * np.sqrt(x + 2) / np.sqrt(6 - x)

    return chislo(korni(g, -2, 6 - 1e-9, tochki=(-2,))) == 2


# ── Опорные ─────────────────────────────────────────────────────────


def o1(k):  # прямая y = kx + 1 и отрезок A(2; 3), B(4; 1): есть общие точки
    r = korni(lambda t: 3 - 2 * t - k * (2 + 2 * t) - 1, 0, 1, tochki=(0, 1))
    return r == INF or len(r) >= 1


def o2(a):  # |x| = x + a, ровно одно решение
    return chislo(kl(lambda x: abs(x) - x - a, [0])) == 1


def o3(a):  # |x − a| = 1 − x/2, ровно одно решение
    return chislo(kl(lambda x: abs(x - a) - 1 + x / 2, [a])) == 1


def o4(a):  # |x − 1| + |x + 2| = a, ровно два решения
    return chislo(kl(lambda x: abs(x - 1) + abs(x + 2) - a, [-2, 1])) == 2


# ── Тренировка ──────────────────────────────────────────────────────


def t1(a):  # 03 №1: y = |x − a| − 1, |y| + x² − 2x = 0, четыре решения
    def g(x):
        y = np.abs(x - a) - 1
        return np.abs(y) + x**2 - 2 * x

    return chislo(korni(g, -1, 3, n=400_001, tochki=(0, 2, a))) == 4


def t2(a):  # 04 №1: −ax + √(3 − 2x − x²) = 8a + 2, единственный корень
    g = lambda x: -a * x + np.sqrt(3 - 2 * x - x**2) - 8 * a - 2
    return chislo(korni(g, -3, 1, tochki=(-3, 1, -1))) == 1


def t3(a):  # 04 №2: (xy² − 3xy − 3y + 9)/√(x + 3) = 0, y = ax, ровно два решения
    def g(x):
        y = a * x
        return (x * y**2 - 3 * x * y - 3 * y + 9) / np.sqrt(x + 3)

    x = DALEKO[DALEKO > -3 + 1e-9]
    return chislo(po_setke(g, x)) == 2


def t4(a):  # 03 №5: 5/x + 3 − y = |y − 2 + 3/x|, 2y(y − 4) + 3x(ax + 4) = xy(2a + 3), больше трёх решений
    def perv(x, y):
        return 5 / x + 3 - y - np.abs(y - 2 + 3 / x)

    # второе уравнение (2y − 3x)(y − ax − 4) = 0 — проверяем разложение и берём прямые
    for x0, y0 in ((1.3, 0.7), (-2.1, 5.2)):
        lev = 2 * y0 * (y0 - 4) + 3 * x0 * (a * x0 + 4) - x0 * y0 * (2 * a + 3)
        assert abs(lev - (2 * y0 - 3 * x0) * (y0 - a * x0 - 4)) < 1e-9
    x = DALEKO
    reshenia = []
    for pr in (lambda t: 1.5 * t, lambda t: a * t + 4):
        r = po_setke(lambda t: perv(t, pr(t)), x)
        if r == INF:
            return False
        reshenia.append([(t, pr(t)) for t in r])
    # x = −8 на первом уравнении выполняется на целом луче: точку луча с прямой ищем точно
    for pr, sp in ((lambda t: 1.5 * t, reshenia[0]), (lambda t: a * t + 4, reshenia[1])):
        y = pr(-8.0)
        if abs(perv(np.array([-8.0]), np.array([y]))[0]) < 1e-9 and not any(abs(p[0] + 8) < 1e-6 for p in sp):
            sp.append((-8.0, y))
    vse = tochki_vmeste(*reshenia)
    return len(vse) > 3


def t5(a):  # 47 №3: y² + xy − 4x − 9y + 20 = 0, y = ax + 1, x > 2, единственное решение
    def g(x):
        y = a * x + 1
        return y**2 + x * y - 4 * x - 9 * y + 20

    x = DALEKO[DALEKO > 2 + 1e-9]
    r = po_setke(g, x)
    return chislo(r) == 1


def t6(a):  # 47 №6: (3|x| + x − a)² = 18x² + 2(x − a)², единственное решение на (−1; 1)
    g = lambda x: (3 * np.abs(x) + x - a) ** 2 - 18 * x**2 - 2 * (x - a) ** 2
    # интервал открытый: концы отступаем, ε по a берётся крупнее отступа
    r = korni(g, -1 + 1e-4, 1 - 1e-4, tochki=(0,))
    return chislo(r) == 1


def t7(a):  # |x − 2| = a(x + 1), ровно два решения
    return chislo(kl(lambda x: abs(x - 2) - a * (x + 1), [2])) == 2


def t8(a):  # y = |x − a|, |x| + |y| = 2, ровно два решения
    return chislo(kl(lambda x: abs(x) + abs(x - a) - 2, [0, a])) == 2


def t9(a):  # (y² − xy − 3y + 2x + 2)·√(x + 3)/√(5 − x) = 0, y = ax, ровно два решения
    def g(x):
        y = a * x
        return (y**2 - x * y - 3 * y + 2 * x + 2) * np.sqrt(x + 3) / np.sqrt(5 - x)

    return chislo(korni(g, -3, 5 - 1e-9, tochki=(-3,))) == 2


ZADACHI = {
    "19-m01-r1": (r1, (-3, 2), ()),
    "19-m01-r2": (r2, (-4, 4), ()),
    "19-m01-r3": (r3, (-10, 14), ()),
    "19-m01-o1": (o1, (-2, 3), ()),
    "19-m01-o2": (o2, (-3, 3), ()),
    "19-m01-o3": (o3, (-3, 5), ()),
    "19-m01-o4": (o4, (-2, 8), ()),
    "19-m01-t1": (t1, (-2, 4), (1,)),
    "19-m01-t2": (t2, (-1.5, 1), ()),
    "19-m01-t3": (t3, (-3, 5), (0, 1 / 3, 3)),
    "19-m01-t4": (t4, (-2, 4), (0, 13 / 64, -9 / 16, -0.5, 2)),
    "19-m01-t5": (t5, (-3, 3), (-1, 0, 1, 1.5)),
    "19-m01-t6": (t6, (-6, 2), (-4, -2, 0)),
    "19-m01-t7": (t7, (-3, 3), (-1, 0, 1)),
    "19-m01-t8": (t8, (-4, 4), (-2, 2)),
    "19-m01-t9": (t9, (-3, 4), (-2 / 3, 2 / 5, 2 / 3, 1, 6 / 5, 2)),
}
