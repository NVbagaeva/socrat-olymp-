"""Метод 7 «Метод инварианта»: проверка разборов, опорных и тренировочных задач.

У каждой задачи — условие «как в тексте задачи», без выкладок решения и
без подстановок метода: функция по параметру говорит, выполняется ли
требование «при всех x» или «при любом b». Проверка — перебором:

  * «при всех x» — на густой сетке по x и, кроме того, точно в особых
    точках: там, где неравенство обращается в равенство или нарушается
    сильнее всего (вершины парабол, изломы модулей, x = 0, π/2, π).
    Это не подсказка решения: на сетке они тоже есть, точная подстановка
    лишь снимает ошибку округления в точке касания;
  * «при любом b» — на сетке по b ∈ [−10; 10] с шагом 0,05 и в особых b;
    для каждого b уравнение решается отдельно: перебором по x (сетка плюс
    точная вершина параболы — там экстремум, по нему и видно, есть ли
    корень) или точно, если оно линейное;
  * «тождество», «не зависит от x», «чётная функция» — по сетке x:
    отклонение от нуля (разброс значений) меньше 10⁻⁹.

NEVERNYE — заведомо неверные ответы: кандидаты, которые дала одна
подстановка вместо двух, необходимые условия, принятые за ответ,
подстановка вне отрезка, потерянное значение. run.py требует, чтобы
перебор каждый из них опроверг.
"""

import math

import numpy as np

PI = math.pi
TOL = 1e-12
TOZHD = 1e-9

X_TRIG = np.concatenate((np.linspace(-2 * PI, 2 * PI, 40_001), [0.0, PI / 2, -PI / 2, PI, -PI]))
B_SETKA = np.concatenate((np.round(np.arange(-10, 10.0001, 0.05), 10), [0.5, -0.5, 1.0, 0.0]))


def setka(lo, hi, n=40_001, tochki=()):
    return np.concatenate((np.linspace(lo, hi, n), np.asarray(tochki, dtype=float)))


def vsegda(g, x, strogo=False):
    """g(x) > 0 (strogo) или g(x) ≥ 0 во всех точках x."""
    with np.errstate(all="ignore"):
        y = g(x)
    if not np.all(np.isfinite(y)):
        return False
    return bool(np.all(y > TOL)) if strogo else bool(np.all(y >= -TOL))


def tozhdestvo(g, x):
    """g(x) = 0 при всех x сетки."""
    with np.errstate(all="ignore"):
        y = g(x)
    return bool(np.all(np.isfinite(y)) and np.max(np.abs(y)) < TOZHD)


def postoyanno(g, x):
    """Значение g не зависит от x: разброс на сетке меньше 10⁻⁹."""
    with np.errstate(all="ignore"):
        y = g(x)
    return bool(np.all(np.isfinite(y)) and np.max(y) - np.min(y) < TOZHD)


def lin_reshimo(A, B):
    """Уравнение A·x = B имеет решение (точно: линейное)."""
    if abs(A) > 1e-12:
        return True
    return abs(B) < 1e-12


def kv_koren_est(A, B, C, X=100.0):
    """У A x² + B x + C = 0 есть корень: перебор по x и точная вершина.

    Многочлен непрерывен: корень есть, если на сетке (с вершиной —
    единственным экстремумом) есть значения обоих знаков или нуль.
    При A = 0 уравнение линейное — точно.
    """
    if abs(A) < 1e-12:
        return lin_reshimo(B, -C)
    x = np.concatenate((np.linspace(-X, X, 4_001), [-B / (2 * A)]))
    y = A * x * x + B * x + C
    return bool(np.min(y) <= TOL and np.max(y) >= -TOL)


# ── Разборы ─────────────────────────────────────────────────────────


def r1(a):  # a²x − 3a + 2 = b(ax − 1): x = 1 — корень при любом b
    return all(abs(a * a - 3 * a + 2 - b * (a - 1)) < TOZHD for b in B_SETKA)


def r2(a):  # sin²x + 2a cos x < a² + 3/4 при всех x
    return vsegda(lambda x: a * a + 0.75 - np.sin(x) ** 2 - 2 * a * np.cos(x), X_TRIG, strogo=True)


def r3(a):  # x² + 2|x − a| ≥ a² при всех x
    x = setka(-10, 10, tochki=(a, 1, -1, 0))
    return vsegda(lambda x: x * x + 2 * np.abs(x - a) - a * a, x)


# ── Опорные ─────────────────────────────────────────────────────────


def o1(a):  # sin⁶x + cos⁶x + a sin²x cos²x не зависит от x
    return postoyanno(lambda x: np.sin(x) ** 6 + np.cos(x) ** 6 + a * (np.sin(x) * np.cos(x)) ** 2, X_TRIG)


def o2(a):  # x² − 2ax + 2a + 3 > 0 при всех x
    x = setka(-30, 30, tochki=(a,))
    return vsegda(lambda x: x * x - 2 * a * x + 2 * a + 3, x, strogo=True)


def o3(a):  # (a² − 4)x = b(a − 2) имеет решение при любом b
    return all(lin_reshimo(a * a - 4, b * (a - 2)) for b in B_SETKA)


def o4(a):  # f(x) = (a² + a)x³ + (a² − 1) sin x + cos x — чётная
    f = lambda x: (a * a + a) * x**3 + (a * a - 1) * np.sin(x) + np.cos(x)
    x = setka(-5, 5, n=4_001)
    return tozhdestvo(lambda x: f(x) - f(-x), x)


def o5(a):  # π — период f(x) = sin²x + (a − 1) cos x + (a² − 1)x
    f = lambda x: np.sin(x) ** 2 + (a - 1) * np.cos(x) + (a * a - 1) * x
    return tozhdestvo(lambda x: f(x + PI) - f(x), X_TRIG)


# ── Тренировка ──────────────────────────────────────────────────────


def t1(a):  # a² sin²x + (3a − 2) cos²x не зависит от x
    return postoyanno(lambda x: a * a * np.sin(x) ** 2 + (3 * a - 2) * np.cos(x) ** 2, X_TRIG)


def t2(a):  # ax² + b(x − a) = (a² − 2)x: x = 1 — корень при любом b
    return all(abs(a + b * (1 - a) - (a * a - 2)) < TOZHD for b in B_SETKA)


def t3(a):  # log_a(x² + 2) > 1 при всех x
    if a <= 0 or abs(a - 1) < 1e-12:
        return False
    x = setka(-20, 20, tochki=(0,))
    return vsegda(lambda x: np.log(x * x + 2) / math.log(a) - 1, x, strogo=True)


def t4(a):  # (2a² − 5a + 3) sin²x + 2(a − 1)² cos x = a² − a при всех x
    return tozhdestvo(
        lambda x: (2 * a * a - 5 * a + 3) * np.sin(x) ** 2 + 2 * (a - 1) ** 2 * np.cos(x) - (a * a - a),
        X_TRIG,
    )


def t5(a):  # sin(ax) = a sin x при всех x
    x = setka(-10, 10, n=4_001)
    return tozhdestvo(lambda x: np.sin(a * x) - a * np.sin(x), x)


def t6(a):  # x² − 2bx + a + b = 0 имеет корень при любом b
    return all(kv_koren_est(1.0, -2 * b, a + b) for b in B_SETKA)


def t7(a):  # x² − ax + 1 ≥ 0 при всех x ∈ [0; 2]
    x = setka(0, 2, n=20_001, tochki=(1,))
    return vsegda(lambda x: x * x - a * x + 1, x)


def t8(a):  # a sin x + b cos x = a² − 2 имеет решение при любом b
    c = a * a - 2
    for b in B_SETKA:
        # левая часть непрерывна и 2π-периодична: решение есть, если c между
        # её наименьшим и наибольшим значением; точки экстремума — точно
        x0 = math.atan2(a, b)
        x = np.concatenate((np.linspace(0, 2 * PI, 4_001), [x0, x0 + PI]))
        y = a * np.sin(x) + b * np.cos(x)
        if not (np.min(y) <= c + TOL and c - TOL <= np.max(y)):
            return False
    return True


def t9(a):  # b(x² − 1) = a − x имеет решение при любом b
    return all(kv_koren_est(b, 1.0, -b - a) for b in B_SETKA)


ZADACHI = {
    "19-m07-r1": (r1, (-3, 4), (1, 2)),
    "19-m07-r2": (r2, (-3, 3), (-1.5, -0.5, 0.5, 1.5)),
    "19-m07-r3": (r3, (-3, 3), (-2, -1, 1, 2)),
    "19-m07-o1": (o1, (-2, 6), (3,)),
    "19-m07-o2": (o2, (-4, 6), (-1.5, -1, 3)),
    "19-m07-o3": (o3, (-4, 4), (-2, 2)),
    "19-m07-o4": (o4, (-3, 3), (-1, 0, 1)),
    "19-m07-o5": (o5, (-3, 3), (-1, 1)),
    "19-m07-t1": (t1, (-2, 4), (1, 2)),
    "19-m07-t2": (t2, (-3, 3), (-1, 1, 2, math.sqrt(3), -math.sqrt(3))),
    "19-m07-t3": (t3, (-1, 4), (0, 1, 2)),
    "19-m07-t4": (t4, (-2, 4), (1, 1.5, 2, 3, 2 / 3, 0)),
    "19-m07-t5": (t5, (-4, 4), (-3, -2, -1, 0, 1, 2, 3)),
    "19-m07-t6": (t6, (-3, 2), (-0.25, 0)),
    "19-m07-t7": (t7, (-4, 4), (-2.5, -2, 2)),
    "19-m07-t8": (t8, (-3, 3), (-2, -1, 0, 1, 2)),
    "19-m07-t9": (t9, (-3, 3), (-1, 1)),
}

# Неверные ответы: одна подстановка вместо нескольких, необходимое условие
# за ответ, подстановка вне отрезка, потерянное или лишнее значение.
NEVERNYE = {
    "19-m07-r1": ["\\{1;\\,2\\}", "\\{2\\}", "\\{1;\\,3\\}"],
    "19-m07-r2": [
        "\\left(-\\infty;\\,-\\frac32\\right)\\cup\\left(-\\frac12;\\,\\frac12\\right)\\cup\\left(\\frac32;\\,+\\infty\\right)",
        "\\left(-\\infty;\\,-\\frac12\\right)\\cup\\left(\\frac12;\\,+\\infty\\right)",
        "\\left(-\\infty;\\,-\\frac32\\right]\\cup\\left[\\frac32;\\,+\\infty\\right)",
    ],
    "19-m07-r3": ["[-2;\\,2]", "(-1;\\,1)", "\\{0\\}"],
    "19-m07-o1": ["\\{0\\}", "\\{-3;\\,3\\}"],
    "19-m07-o2": ["\\left(-\\frac32;\\,+\\infty\\right)", "[-1;\\,3]", "\\left(-\\frac32;\\,3\\right)"],
    "19-m07-o3": ["(-\\infty;\\,-2)\\cup(-2;\\,2)\\cup(2;\\,+\\infty)", "(-\\infty;\\,+\\infty)"],
    "19-m07-o4": ["\\{-1;\\,0\\}", "\\{-1;\\,1\\}"],
    "19-m07-o5": ["\\{-1;\\,1\\}", "\\{-1\\}"],
    "19-m07-t1": ["\\{1\\}", "\\{2\\}"],
    "19-m07-t2": ["\\{-1;\\,2\\}", "\\{1\\}"],
    "19-m07-t3": ["(1;\\,+\\infty)", "(0;\\,1)\\cup(1;\\,2)", "(1;\\,2]"],
    "19-m07-t4": ["\\{1;\\,2\\}", "\\{1;\\,3\\}", "\\left\\{1;\\,\\frac32\\right\\}"],
    "19-m07-t5": ["\\{-1;\\,1\\}", "\\{1\\}", "\\{0;\\,1\\}"],
    "19-m07-t6": ["(-\\infty;\\,0]", "\\left(-\\infty;\\,-\\frac14\\right)"],
    "19-m07-t7": ["\\left[-\\frac52;\\,2\\right]", "(-\\infty;\\,2)", "(-2;\\,2)"],
    "19-m07-t8": ["[-2;\\,2]", "[1;\\,2]", "(-2;\\,-1)\\cup(1;\\,2)"],
    "19-m07-t9": ["(-\\infty;\\,+\\infty)", "(-1;\\,1)", "\\{0\\}"],
}
