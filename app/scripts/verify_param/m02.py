"""Метод 2 «Геометрический способ»: проверка разборов, опорных и тренировочных задач.

У каждой задачи — условие «как в тексте задачи», без выкладок решения:
функция по a говорит, выполняется ли требование задачи. Система из
двух уравнений проверяется так: одна линия обходится по параметру
(окружность — по углу, прямая — подстановкой y через x), и на ней
численно ищутся точки, где выполняется второе уравнение. Совпавшие
точки (x; y) считаются одним решением.
"""

import math

import numpy as np

from obshchee import INF, chislo, korni, tochki_vmeste

# Сдвиг начала обхода окружности: особые точки задач (вершины, точки
# касания) не попадают на стык отрезка [t0; t0 + 2π].
T0 = 0.3137


def na_okruzhnosti(g, cx, cy, r, n=150_001):
    """Решения (x; y) уравнения g(x, y) = 0 на окружности с центром (cx; cy) радиуса r."""
    if r < 0:
        return []
    if r == 0:
        with np.errstate(all="ignore"):
            v = g(np.array([float(cx)]), np.array([float(cy)]))[0]
        return [(cx, cy)] if np.isfinite(v) and abs(v) < 1e-9 else []

    def h(t):
        return g(cx + r * np.cos(t), cy + r * np.sin(t))

    t = korni(h, T0, T0 + 2 * math.pi, n=n)
    if t == INF:
        return INF
    return tochki_vmeste([(cx + r * math.cos(s), cy + r * math.sin(s)) for s in t])


def na_pryamoy(g, y_ot_x, lo=-60.0, hi=60.0, n=600_001):
    """Решения (x; y) уравнения g(x, y) = 0 на линии y = y(x)."""
    t = korni(lambda x: g(x, y_ot_x(x)), lo, hi, n=n)
    if t == INF:
        return INF
    return [(s, float(y_ot_x(np.array([s]))[0])) for s in t]


# ── Разборы ─────────────────────────────────────────────────────────


def r1(a):  # |x| + |y| = 2, (x − 3)² + (y − 3)² = a: ровно два решения
    if a < 0:
        return False
    r = math.sqrt(a)
    return chislo(na_okruzhnosti(lambda x, y: np.abs(x) + np.abs(y) - 2, 3, 3, r)) == 2


def r2(a):  # 4y = 3|x|, x² + (y − a)² = 9: ровно два решения
    return chislo(na_okruzhnosti(lambda x, y: 4 * y - 3 * np.abs(x), 0, a, 3)) == 2


def r3(a):  # √(x² + 4x + 4 + y²) + √(x² − 4x + 4 + y²) = 4, (x − 1)² + (y − a)² = 4: ровно два
    def g(x, y):
        return np.sqrt(x**2 + 4 * x + 4 + y**2) + np.sqrt(x**2 - 4 * x + 4 + y**2) - 4

    return chislo(na_okruzhnosti(g, 1, a, 2)) == 2


# ── Опорные ─────────────────────────────────────────────────────────


def o1(a):  # x² + y² = 4, (x − 3a)² + (y − 4a)² = 9: ровно одно решение
    return chislo(na_okruzhnosti(lambda x, y: (x - 3 * a) ** 2 + (y - 4 * a) ** 2 - 9, 0, 0, 2)) == 1


def o2(b):  # (x − 1)² + (y − 2)² = 4, 3x + 4y = b: хотя бы одно решение
    r = na_okruzhnosti(lambda x, y: 3 * x + 4 * y - b, 1, 2, 2)
    return r == INF or len(r) >= 1


def o3(a):  # |x| + |y| = 2, x² + y² = a²: ровно четыре решения
    return chislo(na_okruzhnosti(lambda x, y: np.abs(x) + np.abs(y) - 2, 0, 0, abs(a))) == 4


def o4(a):  # √(x² + y²) + √((x − 6)² + (y − 8)²) = 10, y = a: есть решения
    def g(x, y):
        return np.sqrt(x**2 + y**2) + np.sqrt((x - 6) ** 2 + (y - 8) ** 2) - 10

    r = na_pryamoy(g, lambda x: 0 * x + a)
    return r == INF or len(r) >= 1


# ── Тренировка ──────────────────────────────────────────────────────


def t1(a):  # x² + y² = a², 3x + 4y = 10: ровно два решения
    r = na_pryamoy(lambda x, y: x**2 + y**2 - a**2, lambda x: (10 - 3 * x) / 4, -80, 80, 800_001)
    return chislo(r) == 2


def t2(a):  # |x| + |y| = a, x² + y² = 4: ровно восемь решений
    return chislo(na_okruzhnosti(lambda x, y: np.abs(x) + np.abs(y) - a, 0, 0, 2)) == 8


def t3(a):  # √(x² + y²) + √((x − 3)² + (y − 4)²) = 5, y = a(x − 4): есть решения
    def g(x, y):
        return np.sqrt(x**2 + y**2) + np.sqrt((x - 3) ** 2 + (y - 4) ** 2) - 5

    r = na_pryamoy(g, lambda x: a * (x - 4))
    return r == INF or len(r) >= 1


def t4(a):  # x² + y² = 2ax, 3|x| + 4|y| = 12: ровно два решения
    g = lambda x, y: 3 * np.abs(x) + 4 * np.abs(y) - 12
    # x² + y² = 2ax ⇔ (x − a)² + y² = a²: подстановка без выкладок решения
    return chislo(na_okruzhnosti(g, a, 0, abs(a))) == 2


def t5(a):  # xy = 0, (x − a)² + (y − 2a)² = 4: ровно четыре решения
    return chislo(na_okruzhnosti(lambda x, y: x * y, a, 2 * a, 2)) == 4


def t6(a):  # (|x| − 4)² + (|y| − 3)² = 4, x² + y² = a²: ровно четыре решения
    g = lambda x, y: (np.abs(x) - 4) ** 2 + (np.abs(y) - 3) ** 2 - 4
    return chislo(na_okruzhnosti(g, 0, 0, abs(a))) == 4


def t7(a):  # (x − 4)² + (y − 2)² = 4, y = a|x|: ровно два решения
    return chislo(na_okruzhnosti(lambda x, y: y - a * np.abs(x), 4, 2, 2)) == 2


def t8(a):  # x² + y² = 9, 3|x − a| + 4|y| = 12: ровно восемь решений
    # При малых |a| две точки у вершины (a; 3) ближе шага сетки по углу,
    # поэтому здесь иначе: второе уравнение решаем относительно x,
    # x = a ± (12 − 4|y|)/3 при |y| ≤ 3, и подставляем в первое.
    tochki = []
    for znak in (1, -1):
        def h(y, znak=znak):
            x = a + znak * (12 - 4 * np.abs(y)) / 3
            return x**2 + y**2 - 9

        r = korni(h, -3, 3, tochki=(-3, 0, 3))
        if r == INF:
            return False
        tochki.append([(a + znak * (12 - 4 * abs(y)) / 3, y) for y in r])
    return chislo(tochki_vmeste(*tochki, slit=1e-12)) == 8


def t9(a):  # (|x| − 4)² + (y − 3)² = 9, (x − 4)² + (y + 3)² = a: ровно три решения
    if a < 0:
        return False
    g = lambda x, y: (np.abs(x) - 4) ** 2 + (y - 3) ** 2 - 9
    return chislo(na_okruzhnosti(g, 4, -3, math.sqrt(a))) == 3


S2, S3 = math.sqrt(2), math.sqrt(3)

ZADACHI = {
    "19-m02-r1": (r1, (-2, 40), (0, 8, 10, 32, 34), 0.05),
    "19-m02-r2": (r2, (-6, 6), (-3, 3, 15 / 4)),
    "19-m02-r3": (r3, (-3, 3), (-2, -S3, 0, S3, 2)),
    "19-m02-o1": (o1, (-2, 2), (-1, -0.2, 0, 0.2, 1)),
    "19-m02-o2": (o2, (-4, 26), (1, 11, 21), 0.05),
    "19-m02-o3": (o3, (-3, 3), (-2, -S2, 0, S2, 2)),
    "19-m02-o4": (o4, (-3, 11), (0, 8)),
    "19-m02-t1": (t1, (-4, 4), (-2, 0, 2)),
    "19-m02-t2": (t2, (-1, 4), (2, 2 * S2)),
    "19-m02-t3": (t3, (-7, 3), (-4, 0)),
    "19-m02-t4": (t4, (-4, 4), (-2, -1.5, 0, 1.5, 2)),
    "19-m02-t5": (t5, (-3, 3), (-2, -1, -2 / math.sqrt(5), 0, 2 / math.sqrt(5), 1, 2)),
    "19-m02-t6": (t6, (-9, 9), (-7, -3, 0, 3, 7)),
    "19-m02-t7": (t7, (-2, 3), (0, 4 / 3)),
    "19-m02-t8": (t8, (-9, 9), (-7, -1, 0, 1, 7)),
    "19-m02-t9": (t9, (-2, 150), (0, 9, 49, 81, 169), 0.25),
}
