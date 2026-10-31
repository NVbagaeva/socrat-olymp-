"""Метод 2 «Геометрический способ»: окружности, расстояния, отрезки.

Окружность перебирается по углу θ ∈ [0; 2π): число общих точек — число
корней функции от θ. Прямая — по x. Отрезок и ромб — по параметру t.
"""

import math

import numpy as np

from obshchee import INF, chislo, korni

TH = (0.0, 2 * math.pi - 1e-9)


def na_okr(cx, cy, r, g, n=400_001):
    """Корни g(x, y) = 0 на окружности (cx; cy), r — по углу."""
    if r <= 0:
        return [] if abs(g(np.array([cx]), np.array([cy]))[0]) > 1e-9 else [0.0]
    k = korni(lambda t: g(cx + r * np.cos(t), cy + r * np.sin(t)), *TH, n=n, tochki=(0.0,))
    # θ = 0 и θ ≈ 2π — одна и та же точка окружности
    if k != INF and len(k) >= 2 and k[0] < 1e-4 and k[-1] > 2 * math.pi - 1e-4:
        k = k[:-1]
    return k


def na_otrezke(p, q, g, n=200_001):
    """Корни g(x, y) = 0 на отрезке pq — по t ∈ [0; 1]."""
    return korni(lambda t: g(p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t), 0, 1, n=n, tochki=(0, 1))


def tochki_xy(spisok, slit=1e-6):
    """Объединение точек (x; y): совпавшие — одна."""
    out = []
    for p in spisok:
        if not any(abs(p[0] - q[0]) < slit and abs(p[1] - q[1]) < slit for q in out):
            out.append(p)
    return out


# ── Разборы ─────────────────────────────────────────────────────────


def r1(a):  # 00 пр. 2: (x²+y²−6y)(√(36−x²) − y) = 0, x = a(y + 2): ровно два решения
    # Произведение равно нулю ⇔ нуль одного из множителей (при |x| ≤ 6): корни
    # каждого множителя ищем отдельно — два близких корня разных множителей
    # не теряются в одной клетке сетки.
    x = lambda y: a * (y + 2)
    obl = lambda y: np.where(36 - x(y) ** 2 >= 0, 1.0, np.nan)
    k1 = korni(lambda y: (x(y) ** 2 + y**2 - 6 * y) * obl(y), -40, 40, n=800_001)
    k2 = korni(lambda y: np.sqrt(36 - x(y) ** 2) - y, -40, 40, n=800_001)
    if k1 == INF or k2 == INF:
        return False
    vse = sorted(k1 + k2)
    out = [t for i, t in enumerate(vse) if i == 0 or t - vse[i - 1] > 1e-9]
    return len(out) == 2


def r2(a):  # 47 №4: 4|y − 3| = 12 − 3|x|, y² − a² = 3(2y − 3) − x²: ровно четыре решения
    g = lambda x, y: y**2 - a**2 - 3 * (2 * y - 3) + x**2
    v = [(4, 3), (0, 6), (-4, 3), (0, 0)]
    pts = []
    for i in range(4):
        p, q = v[i], v[(i + 1) % 4]
        r = na_otrezke(p, q, g)
        if r == INF:
            return False
        pts += [(p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t) for t in r]
    return len(tochki_xy(pts)) == 4


def r3(a):  # 04 №3: ((x−3)²+(y+4)²−17)((2x+7)²+(2y−9)²) ≤ 0, ax + y = 1: единственное решение
    g = lambda x: ((x - 3) ** 2 + (1 - a * x + 4) ** 2 - 17) * ((2 * x + 7) ** 2 + (2 * (1 - a * x) - 9) ** 2)
    x = np.linspace(-30, 30, 600_001)
    if (g(x) < -1e-9).sum() > 3:  # целый кусок прямой внутри круга
        return False
    return chislo(korni(g, -30, 30, n=600_001, tochki=(-3.5,))) == 1


# ── Опорные ─────────────────────────────────────────────────────────


def o1(a):  # 47 №1: (x−3)²+(y−2)²=9, (x−a)²+(y−2)²=1 — единственное решение
    return chislo(na_okr(3, 2, 3, lambda x, y: (x - a) ** 2 + (y - 2) ** 2 - 1)) == 1


def o2(a):  # 06 №23: x² + y² = 1, x + y = a — единственное решение
    return chislo(na_okr(0, 0, 1, lambda x, y: x + y - a)) == 1


def o3(a):  # 06 №22: x² + y² = 1, |x| + |y| = a — ровно четыре решения
    return chislo(na_okr(0, 0, 1, lambda x, y: np.abs(x) + np.abs(y) - a)) == 4


def o4(a):  # 3x + 4y = a касается окружности x² + y² = 4 (ровно одна общая точка)
    return chislo(na_okr(0, 0, 2, lambda x, y: 3 * x + 4 * y - a)) == 1


def o5(a):  # прямая y = a и множество √((x−3)²+(y−1)²) + √((x−6)²+(y−5)²) = 5: есть общие точки
    g = lambda x: np.sqrt((x - 3) ** 2 + (a - 1) ** 2) + np.sqrt((x - 6) ** 2 + (a - 5) ** 2) - 5
    r = korni(g, -10, 20, dopusk=1e-9)
    return r == INF or len(r) >= 1


# ── Тренировка ──────────────────────────────────────────────────────


def t1(a):  # 04 №4 (a ≥ 0): сумма расстояний = √(4 + a²), 5y = |6 − a²| — единственное решение
    if a < 0:
        return False
    y = abs(6 - a * a) / 5
    g = lambda x: np.sqrt((x + 2) ** 2 + y**2) + np.sqrt(x**2 + (y - a) ** 2) - np.sqrt(4 + a * a)
    return chislo(korni(g, -10, 10, dopusk=1e-10)) == 1


def t2(a):  # x² + y² = 4, y = x + a — ровно два решения
    return chislo(na_okr(0, 0, 2, lambda x, y: y - x - a)) == 2


def t3(a):  # x² + y² = 4, (x − 3)² + (y − 4)² = a² — единственное решение
    return chislo(na_okr(0, 0, 2, lambda x, y: (x - 3) ** 2 + (y - 4) ** 2 - a * a)) == 1


def t4(a):  # y² = x², (x − a)² + y² = 2 — ровно четыре решения
    # Пара прямых y = x и y = −x: точки на каждой, общая точка O — одна.
    r = math.sqrt(2)
    pts = []
    for zn in (1, -1):
        k = na_okr(a, 0, r, lambda x, y: y - zn * x)
        pts += [(a + r * math.cos(t), r * math.sin(t)) for t in k]
    return len(tochki_xy(pts, slit=1e-7)) == 4


def t5(a):  # x² + y² = 2(1 + a), (x + y)² = 14 — ровно два решения
    r2_ = 2 * (1 + a)
    if r2_ < 0:
        return False
    return chislo(na_okr(0, 0, math.sqrt(r2_), lambda x, y: (x + y) ** 2 - 14)) == 2


def t6(a):  # (x − a)² + y² = 1, y = |x| — ровно два решения
    return chislo(na_okr(a, 0, 1, lambda x, y: y - np.abs(x))) == 2


def t7(k):  # ((x−2)²+(y−1)²−5)((x+4)²+(y−3)²) ≤ 0, y = kx — единственное решение
    g = lambda x: ((x - 2) ** 2 + (k * x - 1) ** 2 - 5) * ((x + 4) ** 2 + (k * x - 3) ** 2)
    x = np.linspace(-30, 30, 600_001)
    if (g(x) < -1e-9).sum() > 3:
        return False
    return chislo(korni(g, -30, 30, n=600_001, tochki=(-4, 0))) == 1


def t8(a):  # x² + y² = a², |x| + 2|y| = 4 — ровно восемь решений
    return chislo(na_okr(0, 0, abs(a), lambda x, y: np.abs(x) + 2 * np.abs(y) - 4)) == 8


ZADACHI = {
    "19-m02-r1": (r1, (-3, 3), (0.75, -0.75, 0)),
    "19-m02-r2": (r2, (-6, 6), (2.4, -2.4, 3, -3, 4, -4)),
    "19-m02-r3": (r3, (-6, 3), (1, 0.25, -4)),
    "19-m02-o1": (o1, (-3, 9), ()),
    "19-m02-o2": (o2, (-3, 3), ()),
    "19-m02-o3": (o3, (0, 3), ()),
    "19-m02-o4": (o4, (-15, 15), ()),
    "19-m02-o5": (o5, (-2, 8), ()),
    "19-m02-t1": (t1, (-1, 8), (0,)),
    "19-m02-t2": (t2, (-4, 4), ()),
    "19-m02-t3": (t3, (-9, 9), ()),
    "19-m02-t4": (t4, (-3, 3), (math.sqrt(2), -math.sqrt(2))),
    "19-m02-t5": (t5, (-2, 8), ()),
    "19-m02-t6": (t6, (-3, 3), (1, -1)),
    "19-m02-t7": (t7, (-5, 3), (-2, -0.75, 0.5)),
    "19-m02-t8": (t8, (-4, 4), (math.sqrt(16 / 5), -math.sqrt(16 / 5), 2, -2)),
}
