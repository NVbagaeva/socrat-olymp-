"""
Тип 1.10. Выражения с модулем: найти ОДЗ, нули подмодульных выражений,
раскрыть модули на каждом промежутке и сократить. Ответ кусочный.
Уровень ★★.

Здесь же — общий помощник `razobrat` для кусочных ответов: по выражению
с модулями (abs_form) находит промежутки, раскрывает модули, строит
ответ otvet_kusochnyi и шаги разбора по случаям. Им пользуется и t11.
"""

from __future__ import annotations

import math
import random

import sympy as sp

from ..core import (
    L, Shag, Zadacha, interval_tex, lin, nonzero, num_tex, otvet_kusochnyi,
    pick, poly_tex, t, term, u, x, y,
)

TIP = '1.10'


# ── Общий разбор по промежуткам ──────────────────────────────────────


def _ineq(v: str, lo, hi, lc: bool, hc: bool) -> str:
    if lo == -sp.oo and hi == sp.oo:
        return f'{v}\\in\\mathbb{{R}}'
    if lo == -sp.oo:
        return f'{v}{"\\le " if hc else "<"}{num_tex(hi)}'
    if hi == sp.oo:
        return f'{v}{"\\ge " if lc else ">"}{num_tex(lo)}'
    return f'{num_tex(lo)}{"\\le " if lc else "<"}{v}{"\\le " if hc else "<"}{num_tex(hi)}'


def _test_point(lo, hi, iskl):
    """Рациональная точка строго внутри (lo; hi), не из iskl."""
    if lo == -sp.oo and hi == sp.oo:
        cands = [sp.Rational(1, 3)]
    elif lo == -sp.oo:
        cands = [hi - 1, hi - sp.Rational(1, 3)]
    elif hi == sp.oo:
        cands = [lo + 1, lo + sp.Rational(1, 3)]
    else:
        cands = [lo + (hi - lo) * sp.Rational(k_, 7) for k_ in (3, 2, 4, 1, 5)]
    for c in cands:
        if c not in iskl:
            return c
    raise ValueError('нет пробной точки')


def _otkryt_tex(shablon: str, args_tex, signs, args, var) -> str:
    out = shablon
    for j, (atex, s, arg) in enumerate(zip(args_tex, signs, args)):
        if s > 0 and arg.is_Symbol:
            rep = atex
        else:
            rep = f'({L(sp.expand(s * arg))})'
        out = out.replace(f'@{j}', rep)
    return out


def zamenit_moduli(shablon: str, args_tex) -> str:
    out = shablon
    for j, atex in enumerate(args_tex):
        out = out.replace(f'@{j}', f'|{atex}|')
    return out


def razobrat(var, abs_form, shablon: str, args, args_tex, dom, iskl, iskhod, seed: int,
             upr=sp.cancel):
    """
    var — переменная; abs_form — выражение sympy с Abs, равное исходному на ОДЗ;
    shablon — его TeX, где модули записаны как @0, @1 … (аргументы args/args_tex);
    dom = (lo, hi, lc, hc) — главный промежуток ОДЗ; iskl — выколотые точки;
    iskhod — исходное выражение (для проверки ответа по точкам).
    Возвращает (otvet, shagi): шаги — нули, случаи, ответ.
    """
    v = var.name
    lo0, hi0, lc0, hc0 = dom
    iskl = sorted(set(sp.Rational(p_) for p_ in iskl))
    # нули подмодульных выражений внутри ОДЗ
    nuli_po_arg = []
    zeros = set()
    for arg in args:
        zs = []
        for z_ in sp.solve(arg, var):
            if z_.is_real and z_.is_rational and lo0 < z_ < hi0:
                zs.append(sp.Rational(z_))
        zs.sort()
        nuli_po_arg.append(zs)
        zeros |= set(zs)
    zeros = sorted(zeros)
    if not zeros:
        raise ValueError('модули не меняют знак')
    bounds = [lo0] + zeros + [hi0]
    abs_atoms = list(abs_form.atoms(sp.Abs))

    cases = []  # (region, signs, opened, ans)
    for i in range(len(bounds) - 1):
        rlo, rhi = bounds[i], bounds[i + 1]
        rlc = lc0 if i == 0 else (rlo not in iskl)
        rhc = hc0 if i == len(bounds) - 2 else False
        inner_iskl = [p_ for p_ in iskl if rlo < p_ < rhi]
        tp = _test_point(rlo, rhi, inner_iskl)
        signs = [1 if arg.subs(var, tp) > 0 else -1 for arg in args]
        rep = {}
        for at in abs_atoms:
            val = at.args[0].subs(var, tp)
            rep[at] = at.args[0] if val > 0 else -at.args[0]
        opened = abs_form.xreplace(rep)
        ans = upr(opened)
        # подпромежутки, разрезанные выколотыми точками
        cuts = [rlo] + inner_iskl + [rhi]
        subs_ = []
        for jj in range(len(cuts) - 1):
            subs_.append([cuts[jj], cuts[jj + 1], rlc if jj == 0 else False,
                          rhc if jj == len(cuts) - 2 else False])
        cases.append(dict(lo=rlo, hi=rhi, lc=rlc, hc=rhc, iskl=inner_iskl, signs=signs,
                          opened=opened, ans=ans, subs=subs_))

    # куски ответа: склеиваем соседние с одинаковым выражением через нуль модуля
    kuski = []
    for cs in cases:
        for (slo, shi, slc, shc) in cs['subs']:
            if (kuski and kuski[-1][1] == slo and slo not in iskl
                    and sp.simplify(kuski[-1][4] - cs['ans']) == 0):
                kuski[-1][1] = shi
                kuski[-1][3] = shc
            else:
                kuski.append([slo, shi, slc, shc, cs['ans'], iskhod])
    otvet = otvet_kusochnyi(var, [tuple(k_) for k_ in kuski], seed=seed)

    # шаг «нули»
    parts = []
    for arg, atex, zs in zip(args, args_tex, nuli_po_arg):
        if zs and arg.is_Symbol:
            parts.append(f'{v}=0')
        elif zs:
            if len(zs) == 1:
                parts.append(f'{atex}=0\\ \\Leftrightarrow\\ {v}={num_tex(zs[0])}')
            else:
                parts.append(f'{atex}=0\\ \\Leftrightarrow\\ '
                             + '\\ \\text{или}\\ '.join(f'{v}={num_tex(z_)}' for z_ in zs))
        else:
            parts.append(f'{atex}>0')
    vne = [z_ for z_ in zeros if z_ in iskl]
    chto0 = 'Находим нули подмодульных выражений — они делят ОДЗ на промежутки'
    if vne:
        chto0 += ('; точка ' if len(vne) == 1 else '; точки ') + ', '.join(
            f'${v}={num_tex(z_)}$' for z_ in vne) + (' в ОДЗ не входит' if len(vne) == 1 else ' в ОДЗ не входят')
    shagi = [Shag(chto0, ';\\quad '.join(parts))]

    # шаги-случаи
    def opis(cs):
        s_ = _ineq(v, cs['lo'], cs['hi'], cs['lc'], cs['hc'])
        for p_ in cs['iskl']:
            s_ += f',\\ {v}\\ne{num_tex(p_)}'
        return s_

    def case_tex(cs):
        left = _otkryt_tex(shablon, args_tex, cs['signs'], args, var)
        out = left
        num_, den_ = sp.fraction(sp.together(cs['opened']))
        if den_ != 1:
            mid = f'\\frac{{{L(sp.factor(num_))}}}{{{L(sp.factor(den_))}}}'
            if mid != L(cs['ans']):
                out += '=' + mid
        out += '=' + L(cs['ans'])
        return out

    def raskr(cs):
        out = []
        for arg, atex, s in zip(args, args_tex, cs['signs']):
            out.append(f'${"|" + atex + "|"}={atex if s > 0 and arg.is_Symbol else L(sp.expand(s * arg))}$')
        return ', '.join(out)

    if len(cases) <= 3:
        for cs in cases:
            shagi.append(Shag(f'При ${opis(cs)}$: {raskr(cs)}', case_tex(cs)))
    else:
        rows = '\\\\'.join(f'{opis(cs)}:&\\ {case_tex(cs)}' for cs in cases)
        shagi.append(Shag('Раскрываем модули на каждом промежутке',
                          f'\\begin{{aligned}}{rows}\\end{{aligned}}'))
    rows = '\\\\'.join(f"{k_['tex']}, & {v}\\in{k_['oblast']['tex']}" for k_ in otvet['kuski'])
    shagi.append(Shag('Собираем ответ по промежуткам', f'\\begin{{cases}}{rows}\\end{{cases}}'))
    return otvet, shagi


# ── Подтипы ──────────────────────────────────────────────────────────


def _var(rng):
    return pick(rng, [x, x, x, t, u, y])


def s_lin_drob(rng: random.Random) -> Zadacha:
    """(k|v−r| + (v−r)(v+s)) / ((v−r)(v+w)) = (v+s±k)/(v+w)."""
    v = _var(rng)
    V = v.name
    r = nonzero(rng, -6, 8)
    s = rng.randint(-6, 6)
    kk = pick(rng, [1, 1, 2, 3])
    w = pick(rng, [s + kk, s - kk, rng.randint(-7, 7)])
    if w == -r or (v + s + kk) == (v - r) or (v + s - kk) == (v - r):
        return None
    num_p = sp.expand((v - r) * (v + s))
    den = sp.expand((v - r) * (v + w))
    ks = '' if kk == 1 else str(kk)
    shablon = f'\\frac{{{ks}@0+{poly_tex(num_p, v)}}}{{{poly_tex(den, v)}}}'
    args = [v - r]
    args_tex = [lin(V, -r)]
    abs_form = (kk * sp.Abs(v - r) + num_p) / den
    otvet, shagi = razobrat(v, abs_form, shablon, args, args_tex, (-sp.oo, sp.oo, False, False),
                            [r, -w], abs_form, rng.randint(0, 10**6))
    odz = Shag('ОДЗ: знаменатель не равен нулю — раскладываем его на множители',
               f'{poly_tex(den, v)}=({lin(V, -r)})({lin(V, w)})\\ne0\\ \\Rightarrow\\ '
               f'{V}\\ne{r},\\ {V}\\ne{-w}')
    return Zadacha(
        tip=TIP, uroven=2, podtip='lin-drob',
        uslovie='Упростите выражение', formula=zamenit_moduli(shablon, args_tex),
        otvet=otvet, razbor=[odz] + shagi,
        podskazki=[
            'При каких значениях переменной знаменатель обращается в нуль?',
            f'Где выражение ${lin(V, -r)}$ меняет знак?',
            'Какой общий множитель появляется в числителе после раскрытия модуля?',
        ],
        iskhod=abs_form, klyuch=f'ld:{r}:{s}:{kk}:{w}',
    )


def s_modul_trehchlena(rng: random.Random) -> Zadacha:
    """|(v−r)(v−s)|/(v−r) + c(v−s)."""
    v = _var(rng)
    V = v.name
    r = nonzero(rng, -6, 7)
    s = nonzero(rng, -6, 7)
    if r == s:
        return None
    c = pick(rng, [0, 1, -1, 2])
    tri = sp.expand((v - r) * (v - s))
    tail = '' if c == 0 else (term(c, f'({lin(V, -s)})') if c not in (1, -1) else
                              ('+' if c > 0 else '-') + (f'({lin(V, -s)})' if c < 0 else lin(V, -s)))
    shablon = f'\\frac{{@0}}{{{lin(V, -r)}}}{tail}'
    args = [tri]
    args_tex = [poly_tex(tri, v)]
    abs_form = sp.Abs(tri) / (v - r) + c * (v - s)
    otvet, shagi = razobrat(v, abs_form, shablon, args, args_tex, (-sp.oo, sp.oo, False, False),
                            [r], abs_form, rng.randint(0, 10**6))
    prep = Shag(f'ОДЗ: ${V}\\ne{r}$. Раскладываем трёхчлен под модулем на множители',
                f'{poly_tex(tri, v)}=({lin(V, -r)})({lin(V, -s)})')
    return Zadacha(
        tip=TIP, uroven=2, podtip='modul-trehchlena',
        uslovie='Упростите выражение', formula=zamenit_moduli(shablon, args_tex),
        otvet=otvet, razbor=[prep] + shagi,
        podskazki=[
            'На какие множители раскладывается трёхчлен под модулем?',
            'Где этот трёхчлен положителен, а где отрицателен?',
            'Какой множитель сокращается на каждом промежутке?',
        ],
        iskhod=abs_form, klyuch=f'mt:{r}:{s}:{c}',
    )


def s_modul_x(rng: random.Random) -> Zadacha:
    """(k²v² − r²)/(k|v| − r) + m v."""
    v = _var(rng)
    V = v.name
    kk = pick(rng, [1, 1, 2, 3])
    r = rng.randint(1, 9)
    if math.gcd(kk, r) != 1:
        return None
    m = pick(rng, [0, kk, -kk, nonzero(rng, -3, 3)])
    ks = '' if kk == 1 else str(kk)
    shablon = f'\\frac{{{kk * kk if kk > 1 else ""}{V}^2-{r * r}}}{{{ks}@0-{r}}}{term(m, V)}'
    args = [v]
    args_tex = [V]
    abs_form = (kk**2 * v**2 - r**2) / (kk * sp.Abs(v) - r) + m * v
    rk = sp.Rational(r, kk)
    otvet, shagi = razobrat(v, abs_form, shablon, args, args_tex, (-sp.oo, sp.oo, False, False),
                            [rk, -rk], abs_form, rng.randint(0, 10**6))
    prep = Shag('ОДЗ: знаменатель не равен нулю',
                f'{ks}|{V}|\\ne{r}\\ \\Rightarrow\\ {V}\\ne\\pm{num_tex(rk)}')
    return Zadacha(
        tip=TIP, uroven=2, podtip='modul-x',
        uslovie='Упростите выражение', formula=zamenit_moduli(shablon, args_tex),
        otvet=otvet, razbor=[prep] + shagi,
        podskazki=[
            f'Чему равен $|{V}|$ при ${V}\\ge0$ и при ${V}<0$?',
            'Какую формулу сокращённого умножения видно в числителе?',
            'На что сокращается дробь в каждом случае?',
        ],
        iskhod=abs_form, klyuch=f'mx:{kk}:{r}:{m}',
    )


def s_dva_modulya(rng: random.Random) -> Zadacha:
    """(|v−r| ± |v−s|)/(2v − r − s)."""
    v = _var(rng)
    V = v.name
    r = rng.randint(-7, 5)
    s = r + rng.randint(1, 7)
    sg = pick(rng, [1, -1])
    den = 2 * v - r - s
    shablon = f'\\frac{{@0{"+" if sg > 0 else "-"}@1}}{{{poly_tex(den, v)}}}'
    args = [v - r, v - s]
    args_tex = [lin(V, -r), lin(V, -s)]
    abs_form = (sp.Abs(v - r) + sg * sp.Abs(v - s)) / den
    mid = sp.Rational(r + s, 2)
    otvet, shagi = razobrat(v, abs_form, shablon, args, args_tex, (-sp.oo, sp.oo, False, False),
                            [mid], abs_form, rng.randint(0, 10**6))
    prep = Shag('ОДЗ: знаменатель не равен нулю', f'{poly_tex(den, v)}\\ne0\\ \\Rightarrow\\ {V}\\ne{num_tex(mid)}')
    return Zadacha(
        tip=TIP, uroven=2, podtip='dva-modulya-' + ('summa' if sg > 0 else 'raznost'),
        uslovie='Упростите выражение', formula=zamenit_moduli(shablon, args_tex),
        otvet=otvet, razbor=[prep] + shagi,
        podskazki=[
            'В каких точках меняют знак выражения под модулями?',
            'На сколько промежутков эти точки делят числовую прямую?',
            'Что получается в числителе на каждом промежутке — нет ли там знаменателя?',
        ],
        iskhod=abs_form, klyuch=f'dm:{r}:{s}:{sg}',
    )


def s_zamena_modulya(rng: random.Random) -> Zadacha:
    """(v² − (r+q)|v| + rq)/(|v| − r) = |v| − q."""
    v = _var(rng)
    V = v.name
    r = rng.randint(1, 8)
    q = nonzero(rng, -8, 8, exclude=[r])
    num = v**2 - (r + q) * sp.Abs(v) + r * q
    shablon = f'\\frac{{{V}^2{term(-(r + q), "@0")}{term(r * q)}}}{{@0-{r}}}'
    args = [v]
    args_tex = [V]
    abs_form = num / (sp.Abs(v) - r)
    otvet, shagi = razobrat(v, abs_form, shablon, args, args_tex, (-sp.oo, sp.oo, False, False),
                            [r, -r], abs_form, rng.randint(0, 10**6))
    prep = [
        Shag('ОДЗ: знаменатель не равен нулю', f'|{V}|\\ne{r}\\ \\Rightarrow\\ {V}\\ne\\pm{r}'),
        Shag(f'Так как ${V}^2=|{V}|^2$, числитель — квадратный трёхчлен относительно $|{V}|$',
             f'|{V}|^2{term(-(r + q), f"|{V}|")}{term(r * q)}=(|{V}|-{r})({lin(f"|{V}|", -q)})'),
    ]
    return Zadacha(
        tip=TIP, uroven=2, podtip='zamena-modulya',
        uslovie='Упростите выражение', formula=zamenit_moduli(shablon, args_tex),
        otvet=otvet, razbor=prep + shagi,
        podskazki=[
            f'Как записать ${V}^2$ через $|{V}|$?',
            f'На какие множители раскладывается числитель как трёхчлен от $|{V}|$?',
            f'Чему равен $|{V}|$ при ${V}\\ge0$ и при ${V}<0$?',
        ],
        iskhod=abs_form, klyuch=f'zm:{r}:{q}',
    )


def s_modul_sokrashchenie(rng: random.Random) -> Zadacha:
    """|v−r|(v² − s²)/((v−r)(v−s)) = ±(v+s)."""
    v = _var(rng)
    V = v.name
    s = rng.randint(1, 9)
    r = nonzero(rng, -8, 8, exclude=[s, -s])
    den = sp.expand((v - r) * (v - s))
    shablon = f'\\frac{{@0\\,({V}^2-{s * s})}}{{{poly_tex(den, v)}}}'
    args = [v - r]
    args_tex = [lin(V, -r)]
    abs_form = sp.Abs(v - r) * (v**2 - s**2) / den
    otvet, shagi = razobrat(v, abs_form, shablon, args, args_tex, (-sp.oo, sp.oo, False, False),
                            [r, s], abs_form, rng.randint(0, 10**6))
    prep = Shag('ОДЗ: раскладываем знаменатель на множители',
                f'{poly_tex(den, v)}=({lin(V, -r)})({lin(V, -s)})\\ne0\\ \\Rightarrow\\ {V}\\ne{r},\\ {V}\\ne{s}')
    return Zadacha(
        tip=TIP, uroven=2, podtip='modul-sokrashchenie',
        uslovie='Упростите выражение', formula=zamenit_moduli(shablon, args_tex),
        otvet=otvet, razbor=[prep] + shagi,
        podskazki=[
            'На какие множители раскладываются числитель и знаменатель?',
            f'Где выражение ${lin(V, -r)}$ положительно, а где отрицательно?',
            'Что останется после сокращения в каждом случае?',
        ],
        iskhod=abs_form, klyuch=f'ms:{r}:{s}',
    )


PODTIPY = [s_lin_drob, s_modul_trehchlena, s_modul_x, s_dva_modulya, s_zamena_modulya,
           s_modul_sokrashchenie]


_SCHET: dict = {}


def ravnomerno(rng: random.Random, podtipy):
    """Подтип, который до сих пор выпадал реже всех (поровну по подтипам)."""
    low = min(_SCHET.get(f.__qualname__ + f.__module__, 0) for f in podtipy)
    f = pick(rng, [f for f in podtipy if _SCHET.get(f.__qualname__ + f.__module__, 0) == low])
    zd = f(rng)
    if zd is not None:
        _SCHET[f.__qualname__ + f.__module__] = _SCHET.get(f.__qualname__ + f.__module__, 0) + 1
    return zd


def generator(rng: random.Random) -> Zadacha:
    return ravnomerno(rng, PODTIPY)
