"""Метод 6 «Симметрия уравнений и систем»: проверка разборов, опорных и тренировочных задач.

У каждой задачи — условие «как в тексте задачи», без выкладок решения и
без опоры на симметрию: функция по параметру говорит, выполняется ли
требование задачи. Решения считаются точно там, где это возможно:

  * система «ломаная и окружность» и кусочно-квадратные уравнения —
    по кускам, где всё линейно или квадратично: на каждом куске корни
    квадратного уравнения по формуле, с относительным допуском на
    дискриминант (касание — один корень), концы кусков — общие у
    соседних кусков, совпавшие точки (x; y) — одна;
  * системы, сведённые подстановкой к многочлену от x, — по корням
    многочлена (numpy.roots): кратный корень (касание, решение на
    прямой y = x) — один корень, вещественными считаются корни с
    мнимой частью меньше 10⁻⁶; каждому корню x отвечает ровно одно
    решение системы (y выражен через x);
  * уравнения с корнями, синусами, показательной функцией — общим
    поиском (obshchee.korni); точка, вокруг которой «плоский» нуль
    (x = c при найденном значении), — точной подстановкой, а остальные
    корни ищутся у g(x)/|x − c|^p на [c − X; c − δ) и (c + δ; c + X], как
    в m05.py.

NEVERNYE — заведомо неверные ответы (отброшенные кандидаты, «все
кандидаты», потерянные куски): run.py требует, чтобы перебор каждый из
них опроверг.
"""

import math

import numpy as np

from obshchee import INF, chislo, korni

DELTA = 1e-5
EPS = 1e-9


# ── Точный счёт по кускам ───────────────────────────────────────────


def kv(A, B, C):
    """Вещественные корни Ax² + Bx + C = 0 (A = 0 — линейное; всё нулевое — INF)."""
    if abs(A) < 1e-12:
        if abs(B) < 1e-12:
            return INF if abs(C) < 1e-12 else []
        return [-C / B]
    D = B * B - 4 * A * C
    dop = 1e-9 * max(1.0, B * B, abs(4 * A * C))
    if D < -dop:
        return []
    if D <= dop:
        return [-B / (2 * A)]
    s = math.sqrt(D)
    return [(-B - s) / (2 * A), (-B + s) / (2 * A)]


def vmeste(tochki, slit=1e-7):
    """Совпавшие точки (числа или пары) — одна."""
    out = []
    for p in tochki:
        q = p if isinstance(p, tuple) else (p,)
        if not any(all(abs(u - v) < slit for u, v in zip(q, r)) for r in out):
            out.append(q)
    return out


def po_kuskam(kuski):
    """Корни кусочно-квадратного уравнения.

    kuski — список (lo, hi, (A, B, C)): на [lo; hi] уравнение Ax² + Bx + C = 0.
    Концы — включительно: соседние куски дают общий конец один раз.
    """
    out = []
    for lo, hi, (A, B, C) in kuski:
        r = kv(A, B, C)
        if r == INF:
            return INF
        out += [x for x in r if lo - EPS <= x <= hi + EPS]
    return vmeste(out)


def okr_lomanaya(cx, cy, r, vershiny):
    """Общие точки окружности и замкнутой ломаной: по звеньям, точно."""
    if r < 0:
        return []
    out = []
    n = len(vershiny)
    for i in range(n):
        px, py = vershiny[i]
        qx, qy = vershiny[(i + 1) % n]
        dx, dy = qx - px, qy - py
        fx, fy = px - cx, py - cy
        for t in kv(dx * dx + dy * dy, 2 * (fx * dx + fy * dy), fx * fx + fy * fy - r * r):
            if -EPS <= t <= 1 + EPS:
                out.append((px + t * dx, py + t * dy))
    return vmeste(out)


def mnogochlen(koef, isklyuchit=()):
    """Различные вещественные корни многочлена (коэффициенты — от старшего)."""
    koef = np.trim_zeros(np.asarray(koef, dtype=float), "f")
    if len(koef) == 0:
        return INF
    if len(koef) == 1:
        return []
    r = np.roots(koef)
    vesch = sorted(float(z.real) for z in r if abs(z.imag) < 1e-6)
    return [x for (x,) in vmeste(vesch, slit=1e-5) if all(abs(x - e) > 1e-9 for e in isklyuchit)]


# ── Поиск с «плоским» нулём в точке c ───────────────────────────────


def _v(g, x):
    with np.errstate(all="ignore"):
        v = g(np.array([float(x)]))[0]
    return bool(np.isfinite(v) and abs(v) < 1e-12)


def schet(g, c=0.0, X=20.0, p=2, tochki=(), n=200_001):
    """Число корней g(x) = 0 на [c − X; c + X] (INF — бесконечно много)."""

    def h(x):
        return g(x) / np.abs(x - c) ** p

    plus = korni(h, c + DELTA, c + X, n=n, tochki=[t for t in tochki if t > c + DELTA])
    minus = korni(h, c - X, c - DELTA, n=n, tochki=[t for t in tochki if t < c - DELTA])
    if plus == INF or minus == INF:
        return INF
    return int(_v(g, c)) + len(plus) + len(minus)


# ── Разборы ─────────────────────────────────────────────────────────

ROMB = lambda c: [(c, 0), (0, c), (-c, 0), (0, -c)]  # noqa: E731


def r1(a):  # |x| + |y| = 2, (x − a)² + (y − a)² = 2: ровно одно решение
    return chislo(okr_lomanaya(a, a, math.sqrt(2), ROMB(2))) == 1


def r2_korni(a):  # x² − 4x + a(|x − 1| + |x − 3|) = a² + 3a − 6
    C = -(a * a + 3 * a - 6)
    return po_kuskam(
        [
            (-INF, 1, (1, -4 - 2 * a, 4 * a + C)),  # |x−1| + |x−3| = 4 − 2x
            (1, 3, (1, -4, 2 * a + C)),  # = 2
            (3, INF, (1, -4 + 2 * a, -4 * a + C)),  # = 2x − 4
        ]
    )


def r2(a):
    return chislo(r2_korni(a)) == 1


def r3(a):  # x² + y² = a, x + y + xy = 3: ровно одно решение
    # y = (3 − x)/(1 + x), x ≠ −1 (при x = −1 второе уравнение даёт −1 = 3);
    # x²(1 + x)² + (3 − x)² − a(1 + x)² = 0
    return chislo(mnogochlen([1, 2, 2 - a, -(6 + 2 * a), 9 - a], isklyuchit=(-1,))) == 1


# ── Опорные ─────────────────────────────────────────────────────────


def o1(a):  # 2^x + 2^(2 − x) = a: ровно одно решение (u = 2^x > 0, u² − au + 4 = 0)
    r = kv(1, -a, 4)
    return chislo([u for u in r if u > 0]) == 1


def o2(a):  # x² + y = a, y² + x = a: ровно одно решение (y = a − x², (a − x²)² + x − a = 0)
    return chislo(mnogochlen([1, 0, -2 * a, 1, a * a - a])) == 1


def o3(a):  # √x + √(4 − x) = a: ровно одно решение
    g = lambda x: np.sqrt(x) + np.sqrt(4 - x) - a
    return chislo(korni(g, 0, 4, tochki=(0, 2, 4))) == 1


def o4(a):  # |x| + |y| = 2, x² + y² = a: ровно одно решение
    if a < 0:
        return False
    return chislo(okr_lomanaya(0, 0, math.sqrt(a), ROMB(2))) == 1


def o5(a):  # √x + √(5 − x) = a на отрезке [1; 5]: ровно одно решение
    g = lambda x: np.sqrt(x) + np.sqrt(5 - x) - a
    return chislo(korni(g, 1, 5, tochki=(1, 2.5, 4, 5))) == 1


# ── Тренировка ──────────────────────────────────────────────────────


def t1(a):  # x + y = a, xy = 1: ровно одно решение (y = a − x)
    return chislo(kv(1, -a, 1)) == 1


def t2(a):  # log₂ x + log₂(4 − x) = a: ровно одно решение
    g = lambda x: np.log2(x) + np.log2(4 - x) - a
    return chislo(korni(g, 1e-12, 4 - 1e-12, tochki=(2,))) == 1


def t3(a):  # |x² − 4x + 3| = a: ровно три решения
    if a < 0:
        return False
    r1_ = kv(1, -4, 3 - a)
    r2_ = kv(1, -4, 3 + a)
    if r1_ == INF or r2_ == INF:
        return False
    return chislo(vmeste(r1_ + r2_)) == 3


def t4(a):  # |x − 1| + |x − 3| = a(x − 2)² + a² − a + 2: ровно одно решение
    C = a * a - a + 2
    # a(x − 2)² + C − (|x − 1| + |x − 3|) = 0 по кускам
    return chislo(
        po_kuskam(
            [
                (-INF, 1, (a, -4 * a + 2, 4 * a + C - 4)),
                (1, 3, (a, -4 * a, 4 * a + C - 2)),
                (3, INF, (a, -4 * a - 2, 4 * a + C + 4)),
            ]
        )
    ) == 1


def t5(a):  # xy = 4, (x − a)² + (y − a)² = 2: ровно одно решение
    # y = 4/x: x⁴ − 2a x³ + (2a² − 2) x² − 8a x + 16 = 0, x ≠ 0
    return chislo(mnogochlen([1, -2 * a, 2 * a * a - 2, -8 * a, 16], isklyuchit=(0,))) == 1


def t6(a):  # (x − 2)² = a(1 + cos(πx/2)) + a² − 4: ровно одно решение
    # 1 + cos(πx/2) = 2 sin²(π(x − 2)/4) — тождество, для точности около x = 2
    g = lambda x: (x - 2) ** 2 - 2 * a * np.sin(np.pi * (x - 2) / 4) ** 2 - (a * a - 4)
    return schet(g, c=2.0, X=12.0, tochki=(0, 4)) == 1


def t7(a):  # 3^|x| + 2|x| = y + x² + a, x² + y² = 1: ровно одно решение
    # y = 3^|x| + 2|x| − x² − a, на окружности |x| ≤ 1
    def g(x):
        y = 3 ** np.abs(x) + 2 * np.abs(x) - x**2 - a
        return np.where(np.abs(x) <= 1, x**2 + y**2 - 1, np.nan)

    return schet(g, c=0.0, X=1.0, p=1, tochki=(-1, 1)) == 1


def t8(a):  # y = x³ + (a − 2)x, x = y³ + (a − 2)y: ровно одно решение
    k = a - 2
    g = lambda x: (x**3 + k * x) ** 3 + k * (x**3 + k * x) - x
    return schet(g, c=0.0, X=6.0, p=3, n=100_001) == 1


def t9(a):  # y = |x| + |x − 2| + a, (x − 1)² + y² = 4: ровно одно решение
    # (x − 1)² + (y(x))² − 4 = 0 по кускам, y = kx + m на куске
    def kusok(lo, hi, k, m):
        # (x − 1)² + (kx + m)² − 4
        return (lo, hi, (1 + k * k, -2 + 2 * k * m, 1 + m * m - 4))

    return chislo(
        po_kuskam(
            [
                kusok(-INF, 0, -2, 2 + a),
                kusok(0, 2, 0, 2 + a),
                kusok(2, INF, 2, -2 + a),
            ]
        )
    ) == 1


S2, S5, S10 = math.sqrt(2), math.sqrt(5), math.sqrt(10)

ZADACHI = {
    "19-m06-r1": (r1, (-4, 4), (-2, 0, 2, -2 - S2, 2 + S2)),
    "19-m06-r2": (r2, (-4, 4), (-2, 1)),
    "19-m06-r3": (r3, (-2, 24), (2, 18)),
    "19-m06-o1": (o1, (-2, 8), (4,)),
    "19-m06-o2": (o2, (-2, 3), (-0.25, 0.75)),
    "19-m06-o3": (o3, (-1, 4), (2, 2 * S2)),
    "19-m06-o4": (o4, (-1, 6), (0, 2, 4)),
    "19-m06-o5": (o5, (0, 4), (S5, 3, S10)),
    "19-m06-t1": (t1, (-4, 4), (-2, 2)),
    "19-m06-t2": (t2, (-4, 4), (2,)),
    "19-m06-t3": (t3, (-1, 3), (0, 1)),
    "19-m06-t4": (t4, (-3, 3), (0, 1)),
    "19-m06-t5": (t5, (-6, 6), (-3, -1, 1, 3)),
    "19-m06-t6": (t6, (-4, 4), (-2, 2)),
    "19-m06-t7": (t7, (-2, 4), (0, 2)),
    "19-m06-t8": (t8, (-3, 7), (1, 3)),
    "19-m06-t9": (t9, (-6, 3), (-4, 0)),
}

# Неверные ответы: отброшенные кандидаты, «все кандидаты», потерянные куски.
NEVERNYE = {
    "19-m06-r1": ["\\{-2;\\,0;\\,2\\}", "\\{0\\}", "\\{2\\}"],
    "19-m06-r2": ["\\{-2;\\,1\\}", "\\{-2\\}"],
    "19-m06-r3": ["\\{2;\\,18\\}", "\\{18\\}"],
    "19-m06-o1": ["[4;\\,+\\infty)", "(4;\\,+\\infty)"],
    "19-m06-o2": ["\\left[-\\frac14;\\,+\\infty\\right)", "\\left\\{-\\frac14;\\,\\frac34\\right\\}"],
    "19-m06-o3": ["\\{2\\}", "[2;\\,2\\sqrt2]"],
    "19-m06-o4": ["\\{2\\}", "\\{4\\}"],
    "19-m06-o5": [
        "\\{\\sqrt{10}\\}",
        "\\left[\\sqrt5;\\,3\\right]\\cup\\{\\sqrt{10}\\}",
        "\\left(\\sqrt5;\\,3\\right)\\cup\\{\\sqrt{10}\\}",
    ],
    "19-m06-t1": ["\\{2\\}", "(-2;\\,2)"],
    "19-m06-t2": ["\\{4\\}", "(-\\infty;\\,2)"],
    "19-m06-t3": ["\\{0\\}", "(0;\\,1)"],
    "19-m06-t4": ["\\{0;\\,1\\}", "\\{0\\}"],
    "19-m06-t5": ["\\{1;\\,3\\}", "\\{-3;\\,3\\}"],
    "19-m06-t6": ["\\{-2;\\,2\\}", "\\{2\\}"],
    "19-m06-t7": ["\\{0;\\,2\\}", "\\{2\\}"],
    "19-m06-t8": ["(3;\\,+\\infty)", "(1;\\,+\\infty)", "\\{3\\}"],
    "19-m06-t9": ["\\{-4;\\,0\\}", "\\{-4\\}"],
}
