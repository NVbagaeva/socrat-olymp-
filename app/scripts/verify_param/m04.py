"""Метод 4 «Условия касания»: проверка разборов, опорных и тренировочных задач.

У каждой задачи — условие «как в тексте задачи», без выкладок решения:
функция по параметру говорит, выполняется ли требование задачи. Корни
ищет общий поиск (obshchee.korni) на мелкой сетке по x: смена знака —
делением пополам, касание (корень без смены знака) — уточнением минимума
|g| золотым сечением, концы области и изломы модулей — точной
подстановкой (tochki). Поэтому касание при особом значении параметра
считается ровно одним корнем, а в ±ε от него — двумя или ни одним.

Корни, уходящие на бесконечность (прямая почти параллельна асимптоте
гиперболы), ищутся по логарифмической сетке до 10⁷. Система с
окружностью — обходом окружности по углу (m02.na_okruzhnosti).
"""

import math

import numpy as np

from obshchee import INF, chislo, korni
from m02 import na_okruzhnosti

# Сетка по всей прямой: мелкая около нуля, логарифмическая вдали.
DALEKO = np.concatenate(
    (
        -np.geomspace(1e7, 40, 40_000),
        np.linspace(-40, 40, 800_001),
        np.geomspace(40, 1e7, 40_000)[1:],
    )
)
# Положительная полуось: от 10⁻⁷ до 10⁷.
PLYUS = np.concatenate((np.geomspace(1e-7, 1e-2, 20_000), np.linspace(1e-2, 40, 400_001)[1:], np.geomspace(40, 1e7, 40_000)[1:]))


def po_setke(g, x, tochki=()):
    return korni(g, float(x[0]), float(x[-1]), n=len(x), tochki=tochki, setka=x)


def n_korney(g, x=DALEKO, tochki=()):
    return chislo(po_setke(g, x, tochki))


# ── Разборы ─────────────────────────────────────────────────────────


def r1(a):  # √(4 − x²) = x + a: ровно одно решение
    g = lambda x: np.sqrt(4 - x**2) - x - a
    return chislo(korni(g, -2, 2, tochki=(-2, 2))) == 1


def r2(a):  # ax = x² + 1: ровно один корень на [1/2; 3]
    g = lambda x: x**2 + 1 - a * x
    return chislo(korni(g, 0.5, 3, tochki=(0.5, 3))) == 1


def r3(k):  # 1/|x| = kx + 2: ровно три решения
    g = lambda x: 1 / np.abs(x) - k * x - 2
    return n_korney(g) == 3


# ── Опорные ─────────────────────────────────────────────────────────


def o1(b):  # y = x² − 4x + 7, y = 2x + b: ровно одно решение
    return n_korney(lambda x: x**2 - 4 * x + 7 - 2 * x - b) == 1


def o2(a):  # √x = x + a: ровно два решения
    g = lambda x: np.sqrt(x) - x - a
    return chislo(korni(g, 0, 60, n=600_001, tochki=(0,))) == 2


def o3(a):  # x² + y² = 1, (x − a)² + y² = 4: ровно одно решение
    return chislo(na_okruzhnosti(lambda x, y: (x - a) ** 2 + y**2 - 4, 0, 0, 1)) == 1


def o4(a):  # 1/x = a − x: ровно один положительный корень
    return n_korney(lambda x: 1 / x - a + x, PLYUS) == 1


# ── Тренировка ──────────────────────────────────────────────────────


def t1(b):  # y = x² + x, y = 3x + b: ровно два решения
    return n_korney(lambda x: x**2 + x - 3 * x - b) == 2


def t2(a):  # x² + y² = 2, y = x + a: ровно одно решение
    return n_korney(lambda x: x**2 + (x + a) ** 2 - 2) == 1


def t3(k):  # y = x² − 2x + 4, y = kx: ровно одно решение
    return n_korney(lambda x: x**2 - 2 * x + 4 - k * x) == 1


def t4(k):  # √(4 − x²) = kx + 2: ровно два решения
    g = lambda x: np.sqrt(4 - x**2) - k * x - 2
    return chislo(korni(g, -2, 2, tochki=(-2, 0, 2))) == 2


def t5(a):  # x² + 3 = a(x + 1): хотя бы одно решение на [0; 3]
    g = lambda x: x**2 + 3 - a * (x + 1)
    r = korni(g, 0, 3, tochki=(0, 3))
    return r == INF or len(r) >= 1


def t6(k):  # √(4 − x²) = k(x − 4): ровно два решения
    g = lambda x: np.sqrt(4 - x**2) - k * (x - 4)
    return chislo(korni(g, -2, 2, tochki=(-2, 2))) == 2


def t7(k):  # 1/x = k(x − 2): хотя бы один положительный корень
    r = po_setke(lambda x: 1 / x - k * (x - 2), PLYUS)
    return r == INF or len(r) >= 1


def t8(a):  # x² + a = 3|x − 1|: ровно четыре решения
    return n_korney(lambda x: x**2 + a - 3 * np.abs(x - 1), tochki=(1,)) == 4


def t9(a):  # |x² − 2x − 3| = a(x + 1): ровно два решения
    return n_korney(lambda x: np.abs(x**2 - 2 * x - 3) - a * (x + 1), tochki=(-1, 3)) == 2


S2, S3 = math.sqrt(2), math.sqrt(3)

ZADACHI = {
    "19-m04-r1": (r1, (-4, 4), (-2, 2, 2 * S2)),
    "19-m04-r2": (r2, (-3, 5), (-2, 2, 2.5, 10 / 3)),
    "19-m04-r3": (r3, (-3, 3), (-1, 0, 1)),
    "19-m04-o1": (o1, (-5, 2), (-2,)),
    "19-m04-o2": (o2, (-2, 1), (0, 0.25)),
    "19-m04-o3": (o3, (-5, 5), (-3, -1, 0, 1, 3)),
    "19-m04-o4": (o4, (-4, 6), (-2, 0, 2)),
    "19-m04-t1": (t1, (-4, 3), (-1,)),
    "19-m04-t2": (t2, (-4, 4), (-2, 2)),
    "19-m04-t3": (t3, (-9, 5), (-6, -2, 2)),
    "19-m04-t4": (t4, (-3, 3), (-1, 0, 1)),
    "19-m04-t5": (t5, (-8, 5), (-6, 2, 3)),
    "19-m04-t6": (t6, (-2, 1), (-1 / S3, 0)),
    "19-m04-t7": (t7, (-3, 3), (-1, 0)),
    "19-m04-t8": (t8, (-3, 6), (-1, -0.75, 5.25)),
    "19-m04-t9": (t9, (-7, 7), (-4, 0, 4)),
}
