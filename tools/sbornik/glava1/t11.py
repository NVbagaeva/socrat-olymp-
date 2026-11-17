"""
Тип 1.11. Корни из полных квадратов: √(x+c±2k√(x−h)), √((αx−β)²) и
подобные. Выделяем полный квадрат, пользуемся √(A²)=|A| и разбираем
случаи. Ответ кусочный. Уровень ★★.
"""

from __future__ import annotations

import random

import sympy as sp

from ..core import Shag, Zadacha, lin, nonzero, num_tex, pick, poly_tex, term, x
from .t10 import ravnomerno, razobrat, zamenit_moduli

TIP = '1.11'


def _vlozh(rng: random.Random):
    """Параметры √(x+c±2k√(x−h)): c = k² − h."""
    h = rng.randint(-4, 9)
    kk = rng.randint(1, 4)
    c = kk * kk - h
    w = sp.sqrt(x - h)
    wt = f'\\sqrt{{{lin("x", -h)}}}'
    dk = f'{2 * kk}'
    P = f'{lin("x", c)}+{dk}{wt}'
    M = f'{lin("x", c)}-{dk}{wt}'
    return h, kk, c, w, wt, P, M


def _vlozh_prep(h, kk, c, wt, odz_text):
    return Shag(
        f'{odz_text}. Подкоренные выражения — полные квадраты: ${lin("x", c)}=({lin("x", -h)})+{kk * kk}$',
        f'{lin("x", c)}\\pm{2 * kk}{wt}=({wt})^2\\pm2\\cdot{kk}{wt}+{kk * kk}=({wt}\\pm{kk})^2',
    )


def s_vlozh(rng: random.Random, sg: int) -> Zadacha:
    h, kk, c, w, wt, P, M = _vlozh(rng)
    zn = '+' if sg > 0 else '-'
    iskhod = sp.sqrt(x + c + 2 * kk * w) + sg * sp.sqrt(x + c - 2 * kk * w)
    shablon = f'@0{zn}@1'
    args = [w + kk, w - kk]
    args_tex = [f'{wt}+{kk}', f'{wt}-{kk}']
    abs_form = sp.Abs(w + kk) + sg * sp.Abs(w - kk)
    otvet, shagi = razobrat(x, abs_form, shablon, args, args_tex, (sp.Integer(h), sp.oo, True, False),
                            [], iskhod, rng.randint(0, 10**6))
    prep = [
        _vlozh_prep(h, kk, c, wt, f'ОДЗ: $x\\ge {h}$'),
        Shag('Извлекаем корни по правилу $\\sqrt{A^2}=|A|$',
             f'\\sqrt{{{P}}}{zn}\\sqrt{{{M}}}={zamenit_moduli(shablon, args_tex)}'),
    ]
    return Zadacha(
        tip=TIP, uroven=2, podtip='vlozhennyi-' + ('summa' if sg > 0 else 'raznost'),
        uslovie='Упростите выражение', formula=f'\\sqrt{{{P}}}{zn}\\sqrt{{{M}}}',
        otvet=otvet, razbor=prep + shagi,
        podskazki=[
            f'Как представить ${lin("x", c)}$ через $({wt})^2$?',
            'Квадратом какого двучлена является каждое подкоренное выражение?',
            f'При каких $x$ выражение ${wt}-{kk}$ отрицательно?',
        ],
        iskhod=iskhod, klyuch=f'vl:{sg}:{h}:{kk}',
    )


def s_vlozh_summa(rng):
    return s_vlozh(rng, 1)


def s_vlozh_raznost(rng):
    return s_vlozh(rng, -1)


def s_vlozh_drob(rng: random.Random) -> Zadacha:
    """(√P − √M)/(√P + √M) или наоборот."""
    h, kk, c, w, wt, P, M = _vlozh(rng)
    sP = sp.sqrt(x + c + 2 * kk * w)
    sM = sp.sqrt(x + c - 2 * kk * w)
    obr = rng.random() < 0.5
    if obr:
        iskhod = (sP + sM) / (sP - sM)
        shablon = '\\frac{@0+@1}{@0-@1}'
        formula = f'\\frac{{\\sqrt{{{P}}}+\\sqrt{{{M}}}}}{{\\sqrt{{{P}}}-\\sqrt{{{M}}}}}'
        dom = (sp.Integer(h), sp.oo, False, False)
        odz = f'ОДЗ: $x\\ge {h}$, а знаменатель обращается в нуль при $x={h}$, поэтому $x>{h}$'
    else:
        iskhod = (sP - sM) / (sP + sM)
        shablon = '\\frac{@0-@1}{@0+@1}'
        formula = f'\\frac{{\\sqrt{{{P}}}-\\sqrt{{{M}}}}}{{\\sqrt{{{P}}}+\\sqrt{{{M}}}}}'
        dom = (sp.Integer(h), sp.oo, True, False)
        odz = f'ОДЗ: $x\\ge {h}$'
    args = [w + kk, w - kk]
    args_tex = [f'{wt}+{kk}', f'{wt}-{kk}']
    a0, a1 = sp.Abs(w + kk), sp.Abs(w - kk)
    abs_form = (a0 + a1) / (a0 - a1) if obr else (a0 - a1) / (a0 + a1)
    otvet, shagi = razobrat(x, abs_form, shablon, args, args_tex, dom, [], iskhod, rng.randint(0, 10**6))
    prep = [
        _vlozh_prep(h, kk, c, wt, odz),
        Shag('Извлекаем корни: $\\sqrt{A^2}=|A|$', zamenit_moduli(shablon, args_tex)),
    ]
    return Zadacha(
        tip=TIP, uroven=2, podtip='vlozhennyi-drob',
        uslovie='Упростите выражение', formula=formula,
        otvet=otvet, razbor=prep + shagi,
        podskazki=[
            'Нельзя ли записать каждое подкоренное выражение как квадрат двучлена?',
            'Чему равен $\\sqrt{A^2}$?',
            f'Где меняет знак выражение ${wt}-{kk}$?',
        ],
        iskhod=iskhod, klyuch=f'vd:{int(obr)}:{h}:{kk}',
    )


def s_kvadraty_dvuchlenov(rng: random.Random) -> Zadacha:
    """√((αx−β)²) ± √((x−γ)²) в раскрытом виде."""
    al = pick(rng, [1, 2, 2, 3])
    be = nonzero(rng, -7, 7)
    ga = nonzero(rng, -6, 6)
    if sp.Rational(be, al) == ga or (al > 1 and be % al == 0):
        return None
    sg = pick(rng, [1, -1])
    q1 = sp.expand((al * x - be)**2)
    q2 = sp.expand((x - ga)**2)
    zn = '+' if sg > 0 else '-'
    iskhod = sp.sqrt(q1) + sg * sp.sqrt(q2)
    shablon = f'@0{zn}@1'
    a1t = f'{al if al > 1 else ""}x{term(-be)}'
    args = [al * x - be, x - ga]
    args_tex = [a1t, lin('x', -ga)]
    abs_form = sp.Abs(al * x - be) + sg * sp.Abs(x - ga)
    otvet, shagi = razobrat(x, abs_form, shablon, args, args_tex, (-sp.oo, sp.oo, False, False),
                            [], iskhod, rng.randint(0, 10**6))
    prep = Shag('Под корнями — полные квадраты; извлекаем: $\\sqrt{A^2}=|A|$',
                f'\\sqrt{{({a1t})^2}}{zn}\\sqrt{{({lin("x", -ga)})^2}}={zamenit_moduli(shablon, args_tex)}')
    return Zadacha(
        tip=TIP, uroven=2, podtip='kvadraty-dvuchlenov',
        uslovie='Упростите выражение',
        formula=f'\\sqrt{{{poly_tex(q1, x)}}}{zn}\\sqrt{{{poly_tex(q2, x)}}}',
        otvet=otvet, razbor=[prep] + shagi,
        podskazki=[
            'Квадратом какого двучлена является каждое подкоренное выражение?',
            'Чему равен $\\sqrt{A^2}$ — $A$ или $|A|$?',
            'На какие промежутки делят прямую нули выражений под модулями?',
        ],
        iskhod=iskhod, klyuch=f'kd:{al}:{be}:{ga}:{sg}',
    )


def s_drob_kvadrat(rng: random.Random) -> Zadacha:
    """(αx−β)(x+s)/√((αx−β)²) + c·x."""
    al = pick(rng, [1, 1, 2, 3])
    be = nonzero(rng, -7, 7)
    if al > 1 and be % al == 0:
        return None
    s = nonzero(rng, -6, 6)
    c = pick(rng, [0, 0, 1, -1])
    num = sp.expand((al * x - be) * (x + s))
    q = sp.expand((al * x - be)**2)
    iskhod = num / sp.sqrt(q) + c * x
    a1t = f'{al if al > 1 else ""}x{term(-be)}'
    shablon = f'\\frac{{{poly_tex(num, x)}}}{{@0}}{term(c, "x")}'
    args = [al * x - be]
    args_tex = [a1t]
    abs_form = num / sp.Abs(al * x - be) + c * x
    zero = sp.Rational(be, al)
    otvet, shagi = razobrat(x, abs_form, shablon, args, args_tex, (-sp.oo, sp.oo, False, False),
                            [zero], iskhod, rng.randint(0, 10**6))
    prep = Shag(f'Под корнем — полный квадрат; ОДЗ: ${a1t}\\ne0$, то есть $x\\ne{num_tex(zero)}$',
                f'\\sqrt{{{poly_tex(q, x)}}}=\\sqrt{{({a1t})^2}}=|{a1t}|,\\qquad '
                f'{poly_tex(num, x)}=({a1t})({lin("x", s)})')
    return Zadacha(
        tip=TIP, uroven=2, podtip='drob-kvadrat',
        uslovie='Упростите выражение',
        formula=f'\\frac{{{poly_tex(num, x)}}}{{\\sqrt{{{poly_tex(q, x)}}}}}{term(c, "x")}',
        otvet=otvet, razbor=[prep] + shagi,
        podskazki=[
            'Квадратом какого двучлена является выражение под корнем?',
            'Нет ли этого двучлена множителем в числителе?',
            f'Каков знак ${a1t}$ слева и справа от его нуля?',
        ],
        iskhod=iskhod, klyuch=f'dk:{al}:{be}:{s}:{c}',
    )


def s_drob_s_x(rng: random.Random) -> Zadacha:
    """x·√(x² − 2s² + s⁴/x²)/(x − s) = x|x² − s²|/(|x|(x − s))."""
    s = rng.randint(1, 6)
    sg = pick(rng, [1, -1])  # знаменатель x − s или x + s
    den = x - sg * s
    iskhod = x * sp.sqrt(x**2 - 2 * s**2 + sp.Integer(s**4) / x**2) / den
    dt = lin('x', -sg * s)
    shablon = f'\\frac{{x\\,@0}}{{@1\\,({dt})}}'
    args = [x**2 - s**2, x]
    args_tex = [f'x^2-{s * s}', 'x']
    abs_form = x * sp.Abs(x**2 - s**2) / (sp.Abs(x) * den)
    otvet, shagi = razobrat(x, abs_form, shablon, args, args_tex, (-sp.oo, sp.oo, False, False),
                            [0, sg * s], iskhod, rng.randint(0, 10**6))
    prep = [
        Shag(f'ОДЗ: $x\\ne0$, $x\\ne{sg * s}$. Под корнем — квадрат разности',
             f'x^2-{2 * s * s}+\\frac{{{s**4}}}{{x^2}}=\\left(x-\\frac{{{s * s}}}{{x}}\\right)^2'
             f'=\\frac{{(x^2-{s * s})^2}}{{x^2}}'),
        Shag('Извлекаем корень: $\\sqrt{A^2}=|A|$',
             f'\\sqrt{{\\frac{{(x^2-{s * s})^2}}{{x^2}}}}=\\frac{{|x^2-{s * s}|}}{{|x|}}'),
    ]
    return Zadacha(
        tip=TIP, uroven=2, podtip='drob-s-x',
        uslovie='Упростите выражение',
        formula=f'\\frac{{x\\sqrt{{x^2-{2 * s * s}+\\frac{{{s**4}}}{{x^2}}}}}}{{{dt}}}',
        otvet=otvet, razbor=prep + shagi,
        podskazki=[
            f'Квадратом какой разности является $x^2-{2 * s * s}+\\frac{{{s**4}}}{{x^2}}$?',
            'Как извлечь корень из квадрата дроби?',
            f'Каковы знаки $x$ и $x^2-{s * s}$ на каждом промежутке?',
        ],
        iskhod=iskhod, klyuch=f'dx:{s}:{sg}',
    )


PODTIPY = [s_vlozh_summa, s_vlozh_raznost, s_vlozh_drob, s_kvadraty_dvuchlenov, s_drob_kvadrat,
           s_drob_s_x]


def generator(rng: random.Random) -> Zadacha:
    return ravnomerno(rng, PODTIPY)
