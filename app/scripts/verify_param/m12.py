"""Метод 12 «Тригонометрические уравнения с параметром»: проверка разборов, опорных и тренировочных задач.

У каждой задачи — исходное уравнение «как в тексте задачи», без
замены t = sin x и без найденных в решении корней: функция по параметру
говорит, выполняется ли требование задачи. Корни считаются перебором по
x общим поиском (obshchee.korni, допуск нуля 10⁻¹²) — ровно на промежутке
из условия: смена знака на сетке, касание (локальный минимум |g|) и
точная подстановка в особых точках — концах промежутка и кратных π/12.

Почему это проверяет то, на чём строится метод:

  * концы промежутка: замкнутый конец лежит в сетке точно, у открытого
    сетка начинается на 10⁻⁴ внутри — корень в самом конце не считается,
    а двойной корень у открытого конца (tg x = −1 при x → −π/4: g ≈ δ²)
    не принимается за корень. Ближайший к открытому концу настоящий
    корень при значениях параметра из сетки лежит дальше 10⁻⁴;
  * t = ±1 даёт один корень: sin x = 1 — касание графика, корень x = π/2
    у (2 sin x − a)(sin x − 1) двойной; поиск минимума |g| находит его
    одной точкой (близкие находки склеиваются, только если между ними
    g ≈ 0);
  * совпадение корней t: совпавшие корни перебор находит одной точкой,
    поэтому в значении параметра, где корни t совпали, корней x на
    сколько-то меньше — как и должно быть;
  * сумма квадратов (метод оценки) равна нулю только в нулях обоих
    слагаемых — их находит поиск минимума |g|;
  * концы ответа и все особые значения параметра приходят в сетку a
    точно и в ±ε от них — число корней в самой точке считается, а не
    угадывается.

NEVERNYE — заведомо неверные ответы с типичными ошибками главы: забыто
|t| ≤ 1; корни x посчитаны по числу корней t без учёта промежутка;
t = ±1 посчитан за два корня; конец промежутка включён (или потерян);
совпавшие корни t посчитаны дважды. run.py требует, чтобы перебор
каждый из них опроверг.
"""

import math

import numpy as np

from m09 import setka
from obshchee import INF, korni

# Допуск нуля строже общего: у (cos x − 1)(cos x + a) при a ≈ −1 левая
# часть у x = 0 плоская (порядка x²·10⁻³), и с допуском 10⁻⁹ сотня
# соседних узлов сетки сошла бы за «бесконечно много корней».
DOPUSK = 1e-12


def schet(g, x):
    """Корни g на сетке x: список или INF."""
    return korni(g, float(x[0]), float(x[-1]), setka=x, dopusk=DOPUSK)


def rovno(g, x, n):
    r = schet(g, x)
    return r != INF and len(r) == n

PI = math.pi
# Открытый конец: сетка начинается на столько внутри промежутка.
OTSTUP = 1e-4


def promezhutok(lo, hi, lo_vkl=True, hi_vkl=True, n=300_001):
    """Сетка x по промежутку от lo до hi; открытый конец — на OTSTUP внутри.

    Особые точки — кратные π/12 внутри промежутка и замкнутые концы:
    там значения бывают ровно нулём (sin x = 1, cos x = −1, tg x = 0).
    """
    a = lo if lo_vkl else lo + OTSTUP
    b = hi if hi_vkl else hi - OTSTUP
    k0, k1 = math.ceil(a / (PI / 12)) - 1, math.floor(b / (PI / 12)) + 1
    tochki = [k * PI / 12 for k in range(k0, k1 + 1)] + [a, b]
    x = setka(a, b, n=n, tochki=tochki, daleko=False)
    return x[(x >= a) & (x <= b)]


def sin(x):
    return np.sin(x)


def cos(x):
    return np.cos(x)


def tg(x):
    return np.tan(x)


SQ3 = math.sqrt(3)


# ── Разборы ─────────────────────────────────────────────────────────


def r1(a):  # sin x = a: ровно два корня на [−π/6; 4π/3]
    return rovno(lambda x: sin(x) - a, promezhutok(-PI / 6, 4 * PI / 3), 2)


def r2(a):  # 2sin²x − (a + 2) sin x + a = 0: ровно два корня на [0; 2π)
    g = lambda x: 2 * sin(x) ** 2 - (a + 2) * sin(x) + a
    return rovno(g, promezhutok(0, 2 * PI, hi_vkl=False), 2)


def r3(a):  # 4sin²x − 4a sin x + 1 = 0: ровно два корня на [0; π]
    g = lambda x: 4 * sin(x) ** 2 - 4 * a * sin(x) + 1
    return rovno(g, promezhutok(0, PI), 2)


def r4(a):  # sin x + √3 cos x = a: ровно два корня на [0; π]
    return rovno(lambda x: sin(x) + SQ3 * cos(x) - a, promezhutok(0, PI), 2)


def r5(a):  # (sin x − a)² + (cos 2x − a)² = 0: ровно два корня на [0; 2π)
    g = lambda x: (sin(x) - a) ** 2 + (cos(2 * x) - a) ** 2
    return rovno(g, promezhutok(0, 2 * PI, hi_vkl=False), 2)


def r6(a):  # a > 0, sin(ax) = 0: ровно один корень на [π; 2π]
    if a <= 0:
        return False
    x = promezhutok(PI, 2 * PI)
    x = np.unique(np.concatenate([x, [k * PI / a for k in range(0, 40) if PI <= k * PI / a <= 2 * PI]]))
    return rovno(lambda x: sin(a * x), x, 1)


# ── Опорные ─────────────────────────────────────────────────────────


def o1(a):  # cos x = a: ровно два корня на [0; 3π/2]
    return rovno(lambda x: cos(x) - a, promezhutok(0, 3 * PI / 2), 2)


def o2(a):  # tg x = a: ровно один корень на [0; π]
    x = promezhutok(0, PI)
    x = x[np.abs(x - PI / 2) > OTSTUP]  # tg не определён в π/2
    # Сетка разрезана у π/2: смена знака через полюс — не корень.
    lev, prav = x[x < PI / 2], x[x > PI / 2]
    r = schet(lambda t: tg(t) - a, lev) + schet(lambda t: tg(t) - a, prav)
    return len(r) == 1


def o3(a):  # cos²x + (a − 1) cos x − a = 0: ровно два корня на [0; π]
    g = lambda x: cos(x) ** 2 + (a - 1) * cos(x) - a
    return rovno(g, promezhutok(0, PI), 2)


def o4(a):  # tg²x − a tg x + 1 = 0: ровно два корня на (−π/2; π/2)
    g = lambda x: tg(x) ** 2 - a * tg(x) + 1
    return rovno(g, promezhutok(-PI / 2, PI / 2, False, False), 2)


def o5(a):  # sin x − cos x = a: ровно один корень на [0; π]
    return rovno(lambda x: sin(x) - cos(x) - a, promezhutok(0, PI), 1)


def o6(a):  # sin⁴x + cos⁴x = a: есть решение (период π/2 — хватает [0; π])
    r = schet(lambda x: sin(x) ** 4 + cos(x) ** 4 - a, promezhutok(0, PI))
    return len(r) > 0


def o7(a):  # a > 0, cos(ax) = 1: ровно три корня на [0; 2π]
    if a <= 0:
        return False
    x = promezhutok(0, 2 * PI)
    x = np.unique(np.concatenate([x, [2 * k * PI / a for k in range(0, 40) if 2 * k * PI / a <= 2 * PI]]))
    return rovno(lambda x: cos(a * x) - 1, x, 3)


# ── Тренировка ──────────────────────────────────────────────────────


def t1(a):  # sin x = a: ровно один корень на [0; π]
    return rovno(lambda x: sin(x) - a, promezhutok(0, PI), 1)


def t2(a):  # cos x = a: ровно два корня на [−π/3; π]
    return rovno(lambda x: cos(x) - a, promezhutok(-PI / 3, PI), 2)


def t3(a):  # 2cos²x − (2a + 1) cos x + a = 0: ровно три корня на [0; 2π)
    g = lambda x: 2 * cos(x) ** 2 - (2 * a + 1) * cos(x) + a
    return rovno(g, promezhutok(0, 2 * PI, hi_vkl=False), 3)


def t4(a):  # tg²x − a tg x + 1 = 0: ровно один корень на (−π/4; π/2)
    g = lambda x: tg(x) ** 2 - a * tg(x) + 1
    return rovno(g, promezhutok(-PI / 4, PI / 2, False, False), 1)


def t5(a):  # sin x − √3 cos x = a: ровно один корень на [0; π]
    return rovno(lambda x: sin(x) - SQ3 * cos(x) - a, promezhutok(0, PI), 1)


def t6(a):  # (cos x − a)² + sin²2x = 0: ровно один корень на [0; 2π)
    g = lambda x: (cos(x) - a) ** 2 + sin(2 * x) ** 2
    return rovno(g, promezhutok(0, 2 * PI, hi_vkl=False), 1)


def t7(a):  # a > 0, sin(ax) = 1: ровно один корень на [0; π]
    if a <= 0:
        return False
    x = promezhutok(0, PI)
    x = np.unique(
        np.concatenate([x, [(PI / 2 + 2 * k * PI) / a for k in range(0, 40) if (PI / 2 + 2 * k * PI) / a <= PI]])
    )
    return rovno(lambda x: sin(a * x) - 1, x, 1)


def t8(a):  # cos 2x + a sin x = 0: ровно два корня на [0; 2π)
    g = lambda x: cos(2 * x) + a * sin(x)
    return rovno(g, promezhutok(0, 2 * PI, hi_vkl=False), 2)


def t9(a):  # sin²x − 2a sin x + a = 0: ровно два корня на [0; π]
    g = lambda x: sin(x) ** 2 - 2 * a * sin(x) + a
    return rovno(g, promezhutok(0, PI), 2)


def t10(a):  # cos 2x − 2a cos x + 2a − 1 = 0: ровно два корня на [0; 3π/2)
    g = lambda x: cos(2 * x) - 2 * a * cos(x) + 2 * a - 1
    return rovno(g, promezhutok(0, 3 * PI / 2, hi_vkl=False), 2)


ZADACHI = {
    "19-m12-r1": (r1, (-2, 2), (-1, -SQ3 / 2, -0.5, 0, 1)),
    "19-m12-r2": (r2, (-4, 4), (-2, 0, 2)),
    "19-m12-r3": (r3, (-3, 4), (-1, 1, 1.25)),
    "19-m12-r4": (r4, (-3, 3), (-2, -SQ3, SQ3, 2)),
    "19-m12-r5": (r5, (-2, 2), (-1, 0.5, 1)),
    "19-m12-r6": (r6, (-1, 4), (0, 0.5, 1, 1.5, 2, 2.5)),
    "19-m12-o1": (o1, (-2, 2), (-1, 0, 1)),
    "19-m12-o2": (o2, (-3, 3), (0,)),
    "19-m12-o3": (o3, (-3, 3), (-1, 1)),
    "19-m12-o4": (o4, (-5, 5), (-2, 2)),
    "19-m12-o5": (o5, (-2, 2), (-1, 1, math.sqrt(2))),
    "19-m12-o6": (o6, (-1, 2), (0.5, 1)),
    "19-m12-o7": (o7, (-1, 5), (1, 2, 3, 4)),
    "19-m12-t1": (t1, (-2, 2), (-1, 0, 1)),
    "19-m12-t2": (t2, (-2, 2), (-1, 0.5, 1)),
    "19-m12-t3": (t3, (-2, 2), (-1, 0.5, 1)),
    "19-m12-t4": (t4, (-5, 5), (-2, 2)),
    "19-m12-t5": (t5, (-3, 3), (-2, -SQ3, SQ3, 2)),
    "19-m12-t6": (t6, (-2, 2), (-1, 0, 1)),
    "19-m12-t7": (t7, (-1, 4), (0.5, 2.5)),
    "19-m12-t8": (t8, (-4, 4), (-1, 1)),
    "19-m12-t9": (t9, (-3, 3), (0, 1)),
    "19-m12-t10": (t10, (-2, 3), (0, 1, 2)),
}

# Неверные ответы: t = ±1 (касание) посчитан за два корня; конец
# промежутка включён или потерян; корни x посчитаны по числу корней t,
# без промежутка; забыто |t| ≤ 1; совпавшие корни t посчитаны дважды.
NEVERNYE = {
    "19-m12-r1": [
        "\\left[-\\frac12;\\,1\\right]",
        "\\left(-\\frac12;\\,1\\right)",
        "(-1;\\,1)",
        "\\left[-\\frac{\\sqrt3}2;\\,1\\right)",
    ],
    "19-m12-r2": [
        "(-2;\\,2)",
        "\\{-2;\\,2\\}",
        "(-\\infty;\\,-2)\\cup(2;\\,+\\infty)",
    ],
    "19-m12-r3": [
        "\\left(\\frac54;\\,+\\infty\\right)",
        "\\{1\\}\\cup\\left[\\frac54;\\,+\\infty\\right)",
        "[1;\\,+\\infty)",
    ],
    "19-m12-r4": ["[\\sqrt3;\\,2]", "(\\sqrt3;\\,2)", "(-2;\\,2)"],
    "19-m12-r5": ["\\left\\{-1;\\,\\frac12\\right\\}", "\\{-1\\}"],
    "19-m12-r6": [
        "\\left[\\frac12;\\,\\frac32\\right)",
        "\\left(\\frac12;\\,1\\right)\\cup\\left(1;\\,\\frac32\\right)",
        "\\left[\\frac12;\\,1\\right)\\cup\\left(1;\\,\\frac32\\right]",
    ],
    "19-m12-o1": ["(-1;\\,0)", "[-1;\\,0]", "(-1;\\,1)"],
    "19-m12-o2": ["(-\\infty;\\,+\\infty)", "\\{0\\}"],
    "19-m12-o3": ["[-1;\\,1]", "(-1;\\,1)"],
    "19-m12-o4": ["(-\\infty;\\,-2]\\cup[2;\\,+\\infty)", "(2;\\,+\\infty)"],
    "19-m12-o5": [
        "[-1;\\,1]\\cup\\{\\sqrt2\\}",
        "[-1;\\,1)",
        "(-1;\\,1)\\cup\\{\\sqrt2\\}",
    ],
    "19-m12-o6": ["[0;\\,1]", "\\left(\\frac12;\\,1\\right]"],
    "19-m12-o7": ["(2;\\,3]", "[2;\\,3]"],
    "19-m12-t1": ["\\{0;\\,1\\}", "[0;\\,1]"],
    "19-m12-t2": ["\\left(\\frac12;\\,1\\right)", "\\left[\\frac12;\\,1\\right]"],
    "19-m12-t3": ["\\left\\{-1;\\,\\frac12;\\,1\\right\\}", "(-1;\\,1)"],
    "19-m12-t4": [
        "(-\\infty;\\,-2]\\cup\\{2\\}",
        "(-\\infty;\\,-2)",
        "(-\\infty;\\,-2)\\cup[2;\\,+\\infty)",
    ],
    "19-m12-t5": [
        "[-\\sqrt3;\\,\\sqrt3]\\cup\\{2\\}",
        "[-\\sqrt3;\\,\\sqrt3)",
        "(-\\sqrt3;\\,\\sqrt3)\\cup\\{2\\}",
    ],
    "19-m12-t6": ["\\{-1;\\,0;\\,1\\}", "\\{0\\}"],
    "19-m12-t7": [
        "\\left(\\frac12;\\,\\frac52\\right)",
        "\\left[\\frac12;\\,\\frac52\\right]",
    ],
    "19-m12-t8": ["(-\\infty;\\,-1]\\cup[1;\\,+\\infty)", "(-1;\\,1)"],
    "19-m12-t9": ["(-\\infty;\\,0)\\cup(1;\\,+\\infty)", "(-\\infty;\\,0]\\cup[1;\\,+\\infty)"],
    "19-m12-t10": ["[1;\\,2)", "\\{0\\}\\cup(1;\\,2)", "\\{0\\}\\cup[1;\\,2]"],
}
