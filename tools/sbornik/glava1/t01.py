"""
Тип 1.1. Дробно-рациональные выражения: общий знаменатель,
многоэтажные дроби, отрицательные степени, формулы сокращённого
умножения. Уровень ★.
"""

from __future__ import annotations

import random
from fractions import Fraction

import sympy as sp

from ..core import (
    L, Shag, Zadacha, a, b, lin, nonzero, num_tex, otvet_chislo,
    otvet_vyrazhenie, pick, poly_tex, sample_points, term, x,
)

TIP = '1.1'


def R(fr: Fraction) -> sp.Rational:
    return sp.Rational(fr.numerator, fr.denominator)


def s_kvadraty(rng: random.Random) -> Zadacha:
    """α/(x−β) − γ/(x+β) + δx/(x²−β²); δ = −2α, тогда дробь сокращается."""
    beta = rng.randint(2, 9)
    alpha = nonzero(rng, -6, 7)
    gamma = nonzero(rng, -6, 7, exclude=[-alpha])
    delta = -2 * alpha
    expr = alpha / (x - beta) - gamma / (x + beta) + delta * x / (x**2 - beta**2)
    ans = -(alpha + gamma) / (x + beta)
    num = alpha * (x + beta) - gamma * (x - beta) + delta * x
    uslovie_tex = (
        f'\\frac{{{alpha}}}{{{lin("x", -beta)}}}'
        f'{"-" if gamma > 0 else "+"}\\frac{{{abs(gamma)}}}{{{lin("x", beta)}}}'
        f'{"+" if delta > 0 else "-"}\\frac{{{abs(delta)}x}}{{x^2-{beta * beta}}}'
    )
    num_raw = (
        term(alpha, f'({lin("x", beta)})', first=True)
        + term(-gamma, f'({lin("x", -beta)})')
        + term(delta, 'x')
    )
    s = -(alpha + gamma)
    den = f'({lin("x", -beta)})({lin("x", beta)})'
    pts = sample_points([expr], {x: (-12, 12)}, seed=rng.randint(0, 10**6))
    return Zadacha(
        tip=TIP, uroven=1, podtip='kvadraty',
        uslovie='Упростите выражение', formula=uslovie_tex,
        otvet=otvet_vyrazhenie(ans, pts),
        razbor=[
            Shag('Раскладываем знаменатель третьей дроби по формуле разности квадратов',
                 f'x^2-{beta * beta}={den}'),
            Shag(f'Приводим дроби к общему знаменателю ${den}$', f'\\frac{{{num_raw}}}{{{den}}}'),
            Shag('Раскрываем скобки и приводим подобные в числителе',
                 f'\\frac{{{poly_tex(num, x)}}}{{{den}}}'),
            Shag((f'Выносим ${num_tex(s)}$ за скобки и сокращаем' if abs(s) != 1 else 'Сокращаем')
                 + f' на ${lin("x", -beta)}\\ne0$',
                 f'\\frac{{{"-" if s == -1 else ("" if s == 1 else num_tex(s))}({lin("x", -beta)})}}{{{den}}}={L(ans)}'),
        ],
        podskazki=[
            f'На какие множители раскладывается $x^2-{beta * beta}$?',
            'Какой знаменатель будет общим для всех трёх дробей?',
            f'Что получилось в числителе? Нет ли там множителя ${lin("x", -beta)}$?',
        ],
        iskhod=expr,
        klyuch=f'kv:{alpha}:{gamma}:{beta}',
    )


def _decimal_pairs():
    out = []
    for a10 in range(2, 40):
        for b10 in range(2, 60):
            if a10 == b10 or a10 % 10 == 0 or b10 % 10 == 0:
                continue
            fa, fb = Fraction(a10, 10), Fraction(b10, 10)
            val = fa * fb / (fa + fb)
            if (val * 100).denominator == 1:
                out.append((fa, fb, val))
    return out


_PAIRS = _decimal_pairs()


def s_mnogoetazhnaya(rng: random.Random) -> Zadacha:
    """(k/a − k/b) / (1/a² − 1/b²) = k·ab/(a+b), затем значение."""
    kk = rng.randint(2, 9)
    fa, fb, val = pick(rng, _PAIRS)
    expr = (kk / a - kk / b) / (1 / a**2 - 1 / b**2)
    value = sp.Rational(kk) * R(val)
    ta, tb = num_tex(R(fa)), num_tex(R(fb))
    sab, pab = num_tex(R(fa + fb)), num_tex(R(fa * fb))
    return Zadacha(
        tip=TIP, uroven=1, podtip='mnogoetazhnaya',
        uslovie='Упростите выражение',
        formula=(f'\\frac{{\\frac{{{kk}}}{{a}}-\\frac{{{kk}}}{{b}}}}'
                 f'{{\\frac{{1}}{{a^2}}-\\frac{{1}}{{b^2}}}}'),
        dopolnenie=f'и найдите его значение при $a={ta}$, $b={tb}$.',
        otvet=otvet_chislo(value),
        razbor=[
            Shag('Числитель: приводим к общему знаменателю $ab$',
                 f'\\frac{{{kk}}}{{a}}-\\frac{{{kk}}}{{b}}=\\frac{{{kk}(b-a)}}{{ab}}'),
            Shag('Знаменатель: общий знаменатель $a^2b^2$, в числителе — разность квадратов',
                 '\\frac{1}{a^2}-\\frac{1}{b^2}=\\frac{b^2-a^2}{a^2b^2}=\\frac{(b-a)(b+a)}{a^2b^2}'),
            Shag('Делим дроби: умножаем на перевёрнутую и сокращаем на $b-a$ и $ab$',
                 f'\\frac{{{kk}(b-a)}}{{ab}}\\cdot\\frac{{a^2b^2}}{{(b-a)(b+a)}}=\\frac{{{kk}ab}}{{a+b}}'),
            Shag('Подставляем значения: сначала сумма и произведение', f'a+b={sab},\\quad ab={pab}'),
            Shag('Считаем значение', f'\\frac{{{kk}\\cdot{pab}}}{{{sab}}}={num_tex(value)}'),
        ],
        podskazki=[
            'К какому общему знаменателю удобно привести разность в числителе?',
            'Какая формула видна в числителе знаменателя после приведения?',
            'Что сокращается после деления дробей?',
            'Куда удобнее подставлять числа — в исходное выражение или в упрощённое?',
        ],
        iskhod=expr.subs({a: R(fa), b: R(fb)}),
        klyuch=f'me:{kk}:{fa}:{fb}',
    )


def s_otric_stepeni(rng: random.Random) -> Zadacha:
    """(r²a⁻² − b⁻²)/(r a⁻¹ + b⁻¹) = (r b − a)/(ab)."""
    r = rng.randint(2, 9)
    sgn = pick(rng, [1, -1])
    # sgn = −1: (r²a⁻² − b⁻²)/(r a⁻¹ − b⁻¹) = (r b + a)/(ab)
    expr = (r**2 * a**-2 - b**-2) / (r * a**-1 + sgn * b**-1)
    ans = (r * b - sgn * a) / (a * b)
    pts = sample_points([expr], {a: (-9, 9), b: (-9, 9)}, seed=rng.randint(0, 10**6))
    zn = '+' if sgn > 0 else '-'
    other = '-' if sgn > 0 else '+'
    return Zadacha(
        tip=TIP, uroven=1, podtip='otric-stepeni',
        uslovie='Упростите выражение',
        formula=f'\\frac{{{r * r}a^{{-2}}-b^{{-2}}}}{{{r}a^{{-1}}{zn}b^{{-1}}}}',
        otvet=otvet_vyrazhenie(ans, pts),
        razbor=[
            Shag('Заменяем степени с отрицательным показателем дробями: $a^{-n}=\\frac{1}{a^n}$',
                 f'\\frac{{\\frac{{{r * r}}}{{a^2}}-\\frac{{1}}{{b^2}}}}{{\\frac{{{r}}}{{a}}{zn}\\frac{{1}}{{b}}}}'),
            Shag('Приводим к общим знаменателям: $a^2b^2$ сверху, $ab$ снизу',
                 f'\\frac{{{r * r}b^2-a^2}}{{a^2b^2}}:\\frac{{{r}b{zn}a}}{{ab}}'),
            Shag('Раскладываем разность квадратов', f'{r * r}b^2-a^2=({r}b-a)({r}b+a)'),
            Shag(f'Делим и сокращаем на ${r}b{zn}a$ и на $ab$',
                 f'\\frac{{({r}b-a)({r}b+a)}}{{a^2b^2}}\\cdot\\frac{{ab}}{{{r}b{zn}a}}=\\frac{{{r}b{other}a}}{{ab}}'),
        ],
        podskazki=[
            'Как записать $a^{-2}$ и $a^{-1}$ обычными дробями?',
            'Какой общий знаменатель у дробей в числителе? А в знаменателе?',
            f'Как разложить ${r * r}b^2-a^2$?',
        ],
        iskhod=expr,
        klyuch=f'os:{r}:{sgn}',
    )


def s_kuby(rng: random.Random) -> Zadacha:
    """(a³+r³)/(a²−r²) : (a²−ar+r²)/(a+s) = (a+s)/(a−r)."""
    r = rng.randint(1, 6)
    s = nonzero(rng, -7, 7, exclude=[r, -r])
    expr = ((a**3 + r**3) / (a**2 - r**2)) / ((a**2 - r * a + r**2) / (a + s))
    ans = (a + s) / (a - r)
    pts = sample_points([expr], {a: (-10, 10)}, seed=rng.randint(0, 10**6))
    rr = '' if r == 1 else str(r)
    sq = f'a^2-{rr}a+{r * r}'
    return Zadacha(
        tip=TIP, uroven=1, podtip='kuby',
        uslovie='Упростите выражение',
        formula=f'\\frac{{a^3+{r**3}}}{{a^2-{r * r}}}:\\frac{{{sq}}}{{{lin("a", s)}}}',
        otvet=otvet_vyrazhenie(ans, pts),
        razbor=[
            Shag('Раскладываем сумму кубов', f'a^3+{r**3}=({lin("a", r)})({sq})'),
            Shag('Раскладываем разность квадратов', f'a^2-{r * r}=({lin("a", -r)})({lin("a", r)})'),
            Shag('Деление заменяем умножением на перевёрнутую дробь',
                 f'\\frac{{({lin("a", r)})({sq})}}{{({lin("a", -r)})({lin("a", r)})}}'
                 f'\\cdot\\frac{{{lin("a", s)}}}{{{sq}}}'),
            Shag(f'Сокращаем на ${lin("a", r)}$ и на неполный квадрат', f'\\frac{{{lin("a", s)}}}{{{lin("a", -r)}}}'),
        ],
        podskazki=[
            f'По какой формуле раскладывается $a^3+{r**3}$?',
            'Что получится, если деление заменить умножением?',
            'Какие одинаковые множители есть сверху и снизу?',
        ],
        iskhod=expr,
        klyuch=f'ku:{r}:{s}',
    )


PODTIPY = [s_kvadraty, s_mnogoetazhnaya, s_otric_stepeni, s_kuby]


def generator(rng: random.Random) -> Zadacha:
    return pick(rng, PODTIPY)(rng)
