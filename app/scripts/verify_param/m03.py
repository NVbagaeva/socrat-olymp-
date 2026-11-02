"""Метод 3 «Метод областей»: проверка разборов, опорных и тренировочных задач.

У каждой задачи — условие «как в тексте задачи», без выкладок решения.
Неравенства решаются перебором по x при каждом значении параметра:
границы множества решений — нули выражений условия (их ищет общий
поиск корней на мелкой сетке, касания — уточнением минимума) и точки,
где выражение не определено (нуль знаменателя из условия). В самих
границах условие проверяется точно, между ними — в середине куска:
между соседними нулями знак выражения не меняется. Так множество
решений получается кусками с правильными концами — отрезок, интервал,
отдельная точка, — а не «примерно по сетке».
"""

import math

import numpy as np

from obshchee import INF, chislo, korni

LO, HI = -30.0, 30.0
DOP = 1e-9


def _znach(g, x):
    with np.errstate(all="ignore"):
        return float(np.asarray(g(np.array([float(x)])))[0])


def _verno(usloviya, x):
    """Все условия (g, strogo) в точке x: g(x) ≤ 0 (или < 0); где g не определена — ложь."""
    for g, strogo in usloviya:
        v = _znach(g, x)
        if not math.isfinite(v):
            return False
        if strogo and v > -DOP:
            return False
        if not strogo and v > DOP:
            return False
    return True


def mnozhestvo_x(usloviya, lo=LO, hi=HI, tochki=(), n=120_001):
    """Множество решений системы неравенств g_j(x) ≤ 0 (< 0) на [lo; hi].

    usloviya — список (g, strogo); tochki — особые x из условия (нули
    знаменателей), где выражение не определено.
    Ответ — куски (l, r, l_vkl, r_vkl); отдельная точка — (p, p, True, True).
    """
    gr = {lo, hi}
    for g, _ in usloviya:
        r = korni(g, lo, hi, n=n, dopusk=1e-9)
        if r == INF:
            raise ValueError("выражение тождественно равно нулю на куске")
        gr.update(r)
    gr.update(t for t in tochki if lo <= t <= hi)
    gr = sorted(gr)
    # склеиваем почти совпавшие границы
    b = [gr[0]]
    for t in gr[1:]:
        if t - b[-1] > 1e-10:
            b.append(t)
    kuski = []
    for i, p in enumerate(b):
        if _verno(usloviya, p):
            kuski.append((p, p, True, True))
        if i + 1 < len(b) and _verno(usloviya, (p + b[i + 1]) / 2):
            kuski.append((p, b[i + 1], False, False))
    # слияние соседних кусков
    out = []
    for k in kuski:
        if out and abs(out[-1][1] - k[0]) < 1e-12 and (out[-1][3] or k[2]):
            l, _, lv, _ = out[-1]
            out[-1] = (l, k[1], lv, k[3])
        else:
            out.append(k)
    return out


def otrezok(kuski, lo=LO, hi=HI):
    """Длина, если множество — один отрезок [l; r], l < r, внутри [lo; hi]; иначе None."""
    if len(kuski) != 1:
        return None
    l, r, lv, rv = kuski[0]
    if not (lv and rv) or r - l < 1e-9 or l <= lo + 1e-9 or r >= hi - 1e-9:
        return None
    return r - l


def odna_tochka(kuski):
    return len(kuski) == 1 and kuski[0][1] - kuski[0][0] < 1e-9


def est_na(kuski, p, q):
    """Есть ли решение на отрезке [p; q]."""
    for l, r, lv, rv in kuski:
        if r < p or l > q:
            continue
        if (r == p and not rv) or (l == q and not lv):
            continue
        return True
    return False


def vse_na(usloviya, p, q, tochki=()):
    """Каждое x из [p; q] — решение."""
    kuski = mnozhestvo_x(usloviya, p, q, tochki=tochki, n=40_001)
    return len(kuski) == 1 and kuski[0][:2] == (p, q) and kuski[0][2] and kuski[0][3]


def celye(usloviya, lo=-40, hi=40):
    """Целые решения — проверка прямо в целых точках."""
    return [k for k in range(lo, hi + 1) if _verno(usloviya, k)]


# ── Разборы ─────────────────────────────────────────────────────────


def r1(a):  # (a − x²)(a − 2x − 3) ≤ 0: есть решение на [−2; 1]
    u = [(lambda x: (a - x**2) * (a - 2 * x - 3), False)]
    return est_na(mnozhestvo_x(u, -2, 1), -2, 1)


def r2(a):  # x² ≤ a, 4x + 5 ≥ a: множество решений — отрезок длины 2
    u = [(lambda x: x**2 - a, False), (lambda x: a - 4 * x - 5, False)]
    d = otrezok(mnozhestvo_x(u))
    return d is not None and abs(d - 2) < 1e-7


def r3(a):  # |x − a| + 2|x − 3| ≤ 2: множество решений — отрезок длины 1
    u = [(lambda x: np.abs(x - a) + 2 * np.abs(x - 3) - 2, False)]
    d = otrezok(mnozhestvo_x(u))
    return d is not None and abs(d - 1) < 1e-7


# ── Опорные ─────────────────────────────────────────────────────────


def o1(a):  # (a − x)(a + x − 4) ≥ 0 при всех x из [1; 3]
    return vse_na([(lambda x: -(a - x) * (a + x - 4), False)], 1, 3)


def o2(a):  # x² − 2x ≤ a при всех x из [0; 3]
    return vse_na([(lambda x: x**2 - 2 * x - a, False)], 0, 3)


def o3(a):  # (x − a)/(x − 2) ≤ 0: ровно одно целое решение
    return len(celye([(lambda x: (x - a) / (x - 2), False)])) == 1


def o4(a):  # |x − a| ≤ 1: есть решение на [0; 2]
    u = [(lambda x: np.abs(x - a) - 1, False)]
    return est_na(mnozhestvo_x(u, 0, 2), 0, 2)


# ── Тренировка ──────────────────────────────────────────────────────


def t1(a):  # −x² + 4x ≥ a: есть решение на [3; 5]
    u = [(lambda x: a + x**2 - 4 * x, False)]
    return est_na(mnozhestvo_x(u, 3, 5), 3, 5)


def t2(a):  # x ≥ a, x ≤ 2a + 1: есть решения
    u = [(lambda x: a - x, False), (lambda x: x - 2 * a - 1, False)]
    return len(mnozhestvo_x(u)) > 0


def t3(a):  # (x − a)(x + a) ≤ 0: множество решений содержит [1; 2]
    return vse_na([(lambda x: (x - a) * (x + a), False)], 1, 2)


def t4(a):  # a ≥ x² − 4x, a ≤ −x: ровно одно решение
    u = [(lambda x: x**2 - 4 * x - a, False), (lambda x: a + x, False)]
    return odna_tochka(mnozhestvo_x(u))


def t5(a):  # x² + |x − a| ≤ 2: ровно одно решение
    u = [(lambda x: x**2 + np.abs(x - a) - 2, False)]
    return odna_tochka(mnozhestvo_x(u))


def t6(a):  # |x² − 2x − a| = |x + a|: ровно три различных корня
    g = lambda x: np.abs(x**2 - 2 * x - a) - np.abs(x + a)
    return chislo(korni(g, LO, HI, n=600_001, tochki=(0, 1))) == 3


def t7(a):  # (a − x²)/(a − x − 2) ≤ 0 при всех x из [0; 1]
    # Знаменатель — нуль при x = a − 2: точка из условия, где дробь не определена.
    def g(x):
        with np.errstate(all="ignore"):
            return (a - x**2) / (a - x - 2)

    return vse_na([(g, False)], 0, 1, tochki=(a - 2,))


def t8(a):  # x² ≤ a, 2x + 3 ≥ a: ровно два целых решения
    u = [(lambda x: x**2 - a, False), (lambda x: a - 2 * x - 3, False)]
    return len(celye(u)) == 2


def t9(a):  # x² + a² ≤ 25, |x| ≤ a − 1: множество решений — отрезок длины 4
    u = [(lambda x: x**2 + a**2 - 25, False), (lambda x: np.abs(x) - a + 1, False)]
    d = otrezok(mnozhestvo_x(u))
    return d is not None and abs(d - 4) < 1e-7


S21 = math.sqrt(21)

ZADACHI = {
    "19-m03-r1": (r1, (-4, 8), (-1, 0, 1, 4, 5)),
    "19-m03-r2": (r2, (-2, 12), (0, 1, 4, 9), 0.05),
    "19-m03-r3": (r3, (-1, 7), (1, 1.75, 2, 4, 4.25, 5)),
    "19-m03-o1": (o1, (-2, 6), (1, 2, 3)),
    "19-m03-o2": (o2, (-3, 6), (-1, 3)),
    "19-m03-o3": (o3, (-2, 6), (0, 1, 2, 3, 4)),
    "19-m03-o4": (o4, (-3, 5), (-1, 3)),
    "19-m03-t1": (t1, (-8, 6), (-5, 3, 4)),
    "19-m03-t2": (t2, (-4, 4), (-1,)),
    "19-m03-t3": (t3, (-4, 4), (-2, -1, 0, 1, 2)),
    "19-m03-t4": (t4, (-6, 3), (-4, -3, 0)),
    "19-m03-t5": (t5, (-4, 4), (-2.25, 2.25)),
    "19-m03-t6": (t6, (-3, 3), (-9 / 8, -1, 0)),
    "19-m03-t7": (t7, (-1, 5), (1, 2, 3)),
    "19-m03-t8": (t8, (-2, 11), (0, 1, 3, 4, 5, 7, 9), 0.05),
    "19-m03-t9": (t9, (-6, 6), (1, 3, 4, S21, 5)),
}
