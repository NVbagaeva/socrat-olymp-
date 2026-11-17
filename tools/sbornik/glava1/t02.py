"""
Тип 1.2. Корни и дробные показатели: вынесение множителя из-под корня,
сведение к одному показателю, полный квадрат под корнем, разность
квадратов и сумма/разность кубов с корнями, сокращение дробей,
сопряжённые множители, отрицательные дробные показатели. Часть задач —
с подстановкой чисел (ответ — число), несколько — с ответом по знаку.
Уровень ★.
"""

from __future__ import annotations

import random
from fractions import Fraction

import sympy as sp

from ..core import (
    L, Shag, Zadacha, a, b, m, n, num_tex, otvet_chislo, otvet_kusochnyi,
    otvet_vyrazhenie, p, pick, q, sample_points, u, v, x, y,
)

TIP = '1.2'
H = sp.Rational(1, 2)

PARY = [(a, b), (u, v), (m, n), (p, q), (x, y)]
ODNA = [a, b, x, y, m, p]


# ── Мелочи записи ─────────────────────────────────────────────────────


def R(fr: Fraction) -> sp.Rational:
    return sp.Rational(fr.numerator, fr.denominator)


def cf(k, body: str) -> str:
    """k·body: 1 → body, −1 → −body."""
    if k == 1:
        return body
    if k == -1:
        return f'-{body}'
    return f'{k}{body}'


def zn(s: int) -> str:
    return '+' if s > 0 else '-'


def sq(e: str) -> str:
    return f'\\sqrt{{{e}}}'


def rt(e: str, deg: int) -> str:
    return sq(e) if deg == 2 else f'\\sqrt[{deg}]{{{e}}}'


def fr_tex(r) -> str:
    r = sp.Rational(r)
    return str(r.p) if r.q == 1 else f'{r.p}/{r.q}'


def pw(name: str, r) -> str:
    r = sp.Rational(r)
    if r == 1:
        return name
    return f'{name}^{{{fr_tex(r)}}}'


def pts_for(exprs, syms, usl=(), lo=0.3, hi=9.0, rng=None):
    return sample_points(exprs, {s_: (lo, hi) for s_ in syms}, usl,
                         seed=rng.randint(0, 10**6) if rng else 0)


def vyr(ans, pts, tex: str | None = None) -> dict:
    out = otvet_vyrazhenie(ans, pts)
    if tex:
        out['tex'] = tex
    return out


def pol(name: str) -> str:
    return f'${name}>0$'


# ── 1. Квадрат суммы минус удвоенное произведение ─────────────────────


def s_kvadrat_summy(rng: random.Random) -> Zadacha:
    """((m√u + s k√v)² − 4smk√(uv)) / (m√u − s k√v) = m√u − s k√v."""
    S, T = pick(rng, PARY)
    sn, tn = S.name, T.name
    mm, kk = rng.randint(1, 4), rng.randint(1, 5)
    if mm == kk:
        return None
    s = pick(rng, [1, -1])
    A, B = cf(mm, sq(sn)), cf(kk, sq(tn))
    expr = ((mm * sp.sqrt(S) + s * kk * sp.sqrt(T))**2 - 4 * s * mm * kk * sp.sqrt(S * T)) / (
        mm * sp.sqrt(S) - s * kk * sp.sqrt(T))
    ans = mm * sp.sqrt(S) - s * kk * sp.sqrt(T)
    usl = [S > 0, T > 0]
    pts = pts_for([expr, ans], (S, T), usl, rng=rng)
    plus, minus = zn(s), zn(-s)
    mid = f'{2 * mm * kk}{sq(sn + tn)}'
    sq1, sq2 = cf(mm * mm, sn), cf(kk * kk, tn)
    return Zadacha(
        tip=TIP, uroven=1, podtip='kvadrat-summy',
        uslovie=f'Упростите выражение при {pol(sn)}, {pol(tn)}',
        formula=f'\\frac{{({A}{plus}{B})^2{minus}{4 * mm * kk}{sq(sn + tn)}}}{{{A}{minus}{B}}}',
        otvet=vyr(ans, pts, f'{A}{minus}{B}'),
        razbor=[
            Shag(f'Раскрываем квадрат {"суммы" if s > 0 else "разности"} в числителе',
                 f'({A}{plus}{B})^2={sq1}{plus}{mid}+{sq2}'),
            Shag('Приводим подобные: остаётся удвоенное произведение с другим знаком',
                 f'{sq1}{plus}{mid}{minus}{4 * mm * kk}{sq(sn + tn)}+{sq2}={sq1}{minus}{mid}+{sq2}'),
            Shag(f'Сворачиваем по формуле квадрата {"разности" if s > 0 else "суммы"}',
                 f'{sq1}{minus}{mid}+{sq2}=({A}{minus}{B})^2'),
            Shag(f'Сокращаем на ${A}{minus}{B}\\ne0$',
                 f'\\frac{{({A}{minus}{B})^2}}{{{A}{minus}{B}}}={A}{minus}{B}'),
        ],
        podskazki=[
            'Чему равен квадрат двучлена с корнями?',
            'Что останется от среднего члена после приведения подобных?',
            'Нельзя ли записать числитель как квадрат знаменателя?',
        ],
        iskhod=expr, usloviya=usl,
        klyuch=f'ks:{mm}:{kk}:{s}',
    )


# ── 2. Сумма/разность кубов в дробных степенях ────────────────────────


def s_kuby_stepeni(rng: random.Random) -> Zadacha:
    """(a^{3r} + s k³ b^{3r})/(a^r + s k b^r) + c·a^r b^r = (a^r + s'k b^r)²."""
    S, T = pick(rng, PARY)
    sn, tn = S.name, T.name
    r = pick(rng, [H, sp.Rational(1, 3), sp.Rational(1, 4), sp.Rational(2, 3), sp.Rational(1, 6)])
    kk = rng.randint(1, 3)
    s = pick(rng, [1, -1])
    s2 = pick(rng, [1, -1])
    cc = (2 * s2 + s) * kk  # добавка к a^{2r} − s k a^r b^r + k² b^{2r}
    ar, br = S**r, T**r
    expr = (S**(3 * r) + s * kk**3 * T**(3 * r)) / (ar + s * kk * br) + cc * ar * br
    ans = (ar + s2 * kk * br)**2
    usl = [S > 0, T > 0]
    pts = pts_for([expr, ans], (S, T), usl, rng=rng)
    A3, B3 = pw(sn, 3 * r), cf(kk**3, pw(tn, 3 * r))
    Ar, Br = pw(sn, r), pw(tn, r)
    kBr = cf(kk, Br)
    k2B2 = cf(kk * kk, pw(tn, 2 * r))
    AB = f'{Ar}{Br}'
    sq_tr = f'{pw(sn, 2 * r)}{zn(-s)}{cf(kk, AB)}+{k2B2}'
    cc_tex = ('+' if cc > 0 else '-') + cf(abs(cc), AB)
    fin_mid = 2 * kk
    formula = f'\\frac{{{A3}{zn(s)}{B3}}}{{{Ar}{zn(s)}{kBr}}}{cc_tex}'
    kub = 'сумму' if s > 0 else 'разность'
    ans_tex = f'({Ar}{zn(s2)}{kBr})^2'
    return Zadacha(
        tip=TIP, uroven=1, podtip='kuby-stepeni',
        uslovie=f'Упростите выражение при {pol(sn)}, {pol(tn)}',
        formula=formula,
        otvet=vyr(ans, pts, ans_tex),
        razbor=[
            Shag(f'Записываем числитель как {kub} кубов: ${A3}=({Ar})^3$, ${B3}=({kBr})^3$',
                 f'{A3}{zn(s)}{B3}=({Ar}{zn(s)}{kBr})({sq_tr})'),
            Shag(f'Сокращаем дробь на ${Ar}{zn(s)}{kBr}\\ne0$',
                 sq_tr),
            Shag('Приводим подобные с последним слагаемым',
                 f'{sq_tr}{cc_tex}={pw(sn, 2 * r)}{zn(s2)}{cf(fin_mid, AB)}+{k2B2}'),
            Shag('Узнаём квадрат двучлена', f'{pw(sn, 2 * r)}{zn(s2)}{cf(fin_mid, AB)}+{k2B2}={ans_tex}'),
        ],
        podskazki=[
            f'Кубом какого выражения является ${A3}$?',
            'По какой формуле раскладывается числитель?',
            'Что получится после сокращения и приведения подобных — нет ли там полного квадрата?',
        ],
        iskhod=expr, usloviya=usl,
        klyuch=f'kst:{r}:{kk}:{s}:{s2}',
    )


# ── 3. Сумма/разность кубов с квадратными корнями ─────────────────────


def s_kuby_korni(rng: random.Random) -> Zadacha:
    """[(a√a + s k³ b√b)/(√a + s k√b) − s k√(ab)] : (√a − s k√b)  или  : (a − k²b)."""
    S, T = pick(rng, PARY)
    sn, tn = S.name, T.name
    kk = rng.randint(1, 4)
    s = pick(rng, [1, -1])
    var = rng.randint(0, 1)
    sA, sB = sp.sqrt(S), sp.sqrt(T)
    inner = (S * sA + s * kk**3 * T * sB) / (sA + s * kk * sB) - s * kk * sp.sqrt(S * T)
    A, kB = sq(sn), cf(kk, sq(tn))
    lin_m = f'{A}{zn(-s)}{kB}'
    lin_p = f'{A}{zn(s)}{kB}'
    if var == 0:
        expr = inner / (sA - s * kk * sB)
        ans = sA - s * kk * sB
        tail = f':\\left({lin_m}\\right)'
        last = Shag(f'Делим на ${lin_m}\\ne0$', f'\\frac{{({lin_m})^2}}{{{lin_m}}}={lin_m}')
        ans_tex = lin_m
    else:
        expr = inner / (S - kk**2 * T)
        ans = (sA - s * kk * sB) / (sA + s * kk * sB)
        tail = f'\\cdot\\frac{{1}}{{{sn}-{cf(kk * kk, tn)}}}'
        ans_tex = f'\\frac{{{lin_m}}}{{{lin_p}}}'
        last = Shag(f'Раскладываем ${sn}-{cf(kk * kk, tn)}=({lin_m})({lin_p})$ и сокращаем на ${lin_m}\\ne0$',
                    f'\\frac{{({lin_m})^2}}{{({lin_m})({lin_p})}}={ans_tex}')
    usl = [S > 0, T > 0]
    pts = pts_for([expr, ans], (S, T), usl, rng=rng)
    num = f'{sn}{sq(sn)}{zn(s)}{cf(kk**3, tn + sq(tn))}'
    tri = f'{sn}{zn(-s)}{cf(kk, sq(sn + tn))}+{cf(kk * kk, tn)}'
    kub = 'сумма' if s > 0 else 'разность'
    return Zadacha(
        tip=TIP, uroven=1, podtip='kuby-korni',
        uslovie=f'Упростите выражение при {pol(sn)}, {pol(tn)}',
        formula=f'\\left(\\frac{{{num}}}{{{lin_p}}}{zn(-s)}{cf(kk, sq(sn + tn))}\\right){tail}',
        otvet=vyr(ans, pts, ans_tex),
        razbor=[
            Shag(f'Числитель — {kub} кубов: ${sn}{sq(sn)}=({A})^3$, ${cf(kk**3, tn + sq(tn))}=({kB})^3$',
                 f'{num}=({lin_p})({tri})'),
            Shag(f'Сокращаем на ${lin_p}\\ne0$ и приводим подобные в скобках',
                 f'{tri}{zn(-s)}{cf(kk, sq(sn + tn))}={sn}{zn(-s)}{cf(2 * kk, sq(sn + tn))}+{cf(kk * kk, tn)}'),
            Shag('Сворачиваем полный квадрат', f'{sn}{zn(-s)}{cf(2 * kk, sq(sn + tn))}+{cf(kk * kk, tn)}=({lin_m})^2'),
            last,
        ],
        podskazki=[
            f'Кубом чего является ${sn}{sq(sn)}$?',
            'Какой неполный квадрат получится после сокращения дроби?',
            'Что даёт приведение подобных в скобках — нет ли полного квадрата?',
        ],
        iskhod=expr, usloviya=usl,
        klyuch=f'kk:{kk}:{s}:{var}',
    )


# ── 4. Вынесение множителя из-под корня ───────────────────────────────


def s_vynesenie(rng: random.Random) -> Zadacha:
    """Три слагаемых, каждое сводится к c·m·a·ⁿ√(sa)."""
    S = pick(rng, ODNA)
    sn = S.name
    deg = pick(rng, [2, 2, 3])
    base = pick(rng, [2, 3, 5, 6, 7] if deg == 2 else [2, 3, 4, 5])
    vids = rng.sample([0, 1, 2], 3)
    parts, steps, total, shagi = [], [], 0, []
    mp = f'{sn}^{{{deg}}}' if deg > 1 else sn
    expr = sp.Integer(0)
    Rt = rt(f'{base}{sn}', deg)
    for i, vid in enumerate(vids):
        mm = rng.randint(1, 4 if deg == 2 else 3)
        if i > 0 and mm == 1:
            mm = 2
        c = rng.choice([-3, -2, -1, 1, 2, 3])
        if i == 0:
            c = abs(c)
        inner_num = mm**deg * base
        if vid == 0:
            e = c * root_n(inner_num * S**(deg + 1), deg)
            body = rt(f'{inner_num}{sn}^{{{deg + 1}}}', deg)
            raz = f'{body}={rt(f"{mm}^{deg}\\cdot{base}\\cdot {mp}\\cdot {sn}", deg)}={cf(mm, sn + Rt)}'
        elif vid == 1:
            e = c * S * root_n(inner_num * S, deg)
            body = f'{sn}{rt(f"{inner_num}{sn}", deg)}'
            raz = f'{body}={sn}{rt(f"{mm}^{deg}\\cdot{base}{sn}", deg)}={cf(mm, sn + Rt)}'
        else:
            e = c * S**2 * root_n(inner_num / S**(deg - 1), deg)
            den = sn if deg == 2 else f'{sn}^{{{deg - 1}}}'
            body = f'{sn}^2{rt(f"\\frac{{{inner_num}}}{{{den}}}", deg)}'
            raz = (f'{body}={sn}^2{rt(f"\\frac{{{mm}^{deg}\\cdot{base}{sn}}}{{{mp}}}", deg)}'
                   f'={sn}^2\\cdot\\frac{{{mm}}}{{{sn}}}{Rt}={cf(mm, sn + Rt)}')
        expr += e
        shagi.append(raz)
        total += c * mm
        sgn = '' if i == 0 else zn(c)
        parts.append(f'{sgn}{cf(abs(c), body)}' if abs(c) != 1 else f'{sgn}{body}')
        steps.append(f'{cf(c * mm, sn + Rt)}' if i == 0 else f'{zn(c)}{cf(abs(c * mm), sn + Rt)}')
    if total == 0:
        return None
    ans = total * S * root_n(base * S, deg)
    usl = [S > 0]
    pts = pts_for([expr, ans], (S,), usl, rng=rng)
    ans_tex = cf(total, sn + Rt)
    kor = 'квадратного' if deg == 2 else 'кубического'
    return Zadacha(
        tip=TIP, uroven=1, podtip='vynesenie-mnozhitelya',
        uslovie=f'Упростите выражение при {pol(sn)}',
        formula=''.join(parts),
        otvet=vyr(ans, pts, ans_tex),
        razbor=[
            Shag(f'Первое слагаемое: выделяем под знаком {kor} корня точную '
                 f'{"квадратную" if deg == 2 else "кубическую"} степень и выносим её; ${sn}>0$, поэтому модули не нужны',
                 shagi[0]),
            Shag('Так же преобразуем второе слагаемое', shagi[1]),
            Shag('И третье', shagi[2]),
            Shag(f'Все слагаемые подобны: общий множитель ${sn}{Rt}$. Складываем коэффициенты',
                 f'{"".join(steps)}={ans_tex}'),
        ],
        podskazki=[
            f'Какой множитель под корнем является точной {"квадратной" if deg == 2 else "кубической"} степенью?',
            f'Как внести ${sn}^2$ под корень или вынести из-под него при ${sn}>0$?',
            'Какие слагаемые получились подобными?',
        ],
        iskhod=expr, usloviya=usl,
        klyuch='vy:' + ''.join(parts).replace(sn, '#'),
    )


def root_n(e, deg: int):
    return sp.sqrt(e) if deg == 2 else e**sp.Rational(1, deg)


# ── 5. Сведение к одному показателю ───────────────────────────────────


def s_odin_pokazatel(rng: random.Random) -> Zadacha:
    """ⁿ¹√(a^p1 b^q1 · ⁿ²√(a^p2 b^q2)) : ⁿ³√(a^p3 b^q3) = a^α b^β."""
    S, T = pick(rng, PARY)
    sn, tn = S.name, T.name
    n1, n2, n3 = pick(rng, [2, 3, 4]), pick(rng, [2, 3]), pick(rng, [3, 4, 6])
    p1, q1, p2, q2 = rng.randint(1, 3), rng.randint(0, 2), rng.randint(1, 3), rng.randint(0, 3)
    p3, q3 = rng.randint(1, 5), rng.randint(0, 4)
    op = pick(rng, [1, -1])
    ea = (sp.Rational(p1) + sp.Rational(p2, n2)) / n1 + op * sp.Rational(p3, n3)
    eb = (sp.Rational(q1) + sp.Rational(q2, n2)) / n1 + op * sp.Rational(q3, n3)
    if ea == 0 or eb == 0 or ea.q > 12 or eb.q > 12 or abs(ea) > 3 or abs(eb) > 3:
        return None
    if q1 == q2 == q3 == 0:
        return None

    def mon(pa, qb):
        s_ = ''
        if pa:
            s_ += sn if pa == 1 else f'{sn}^{{{pa}}}'
        if qb:
            s_ += tn if qb == 1 else f'{tn}^{{{qb}}}'
        return s_ or '1'

    inner = sp.root(S**p2 * T**q2, n2)
    expr = sp.root(S**p1 * T**q1 * inner, n1) * (sp.root(S**p3 * T**q3, n3))**op
    ans = S**ea * T**eb
    usl = [S > 0, T > 0]
    pts = pts_for([expr, ans], (S, T), usl, rng=rng)
    big = rt(f'{mon(p1, q1)}{rt(mon(p2, q2), n2)}', n1)
    small = rt(mon(p3, q3), n3)
    formula = f'{big}\\cdot{small}' if op > 0 else f'\\frac{{{big}}}{{{small}}}'
    ia = sp.Rational(p1) + sp.Rational(p2, n2)
    ib = sp.Rational(q1) + sp.Rational(q2, n2)

    def pp(name, r):
        return '' if r == 0 else pw(name, r)

    ans_tex = f'{pw(sn, ea)}{pw(tn, eb)}'
    sgn = '+' if op > 0 else '-'
    return Zadacha(
        tip=TIP, uroven=1, podtip='odin-pokazatel',
        uslovie=f'Упростите выражение при {pol(sn)}, {pol(tn)}; ответ запишите в виде степеней',
        formula=formula,
        otvet=vyr(ans, pts, ans_tex),
        razbor=[
            Shag('Переходим к дробным показателям: $\\sqrt[n]{c^k}=c^{k/n}$; внутренний корень',
                 f'{rt(mon(p2, q2), n2)}={pp(sn, sp.Rational(p2, n2))}{pp(tn, sp.Rational(q2, n2))}'),
            Shag('Перемножаем степени под внешним корнем — показатели складываются',
                 f'{mon(p1, q1)}{rt(mon(p2, q2), n2)}={pp(sn, ia)}{pp(tn, ib)}'),
            Shag(f'Извлекаем корень степени ${n1}$ — показатели делим на ${n1}$',
                 f'{big}={pp(sn, ia / n1)}{pp(tn, ib / n1)}'),
            Shag('Второй множитель тоже записываем степенью и '
                 + ('умножаем: показатели складываются' if op > 0 else 'делим: показатели вычитаются'),
                 f'{small}={pp(sn, sp.Rational(p3, n3))}{pp(tn, sp.Rational(q3, n3))},\\quad '
                 f'{pp(sn, ia / n1)}{pp(tn, ib / n1)}{"\\cdot " if op > 0 else ":"}'
                 f'{pp(sn, sp.Rational(p3, n3))}{pp(tn, sp.Rational(q3, n3))}={pw(sn, ea)}{pw(tn, eb)}'),
        ],
        podskazki=[
            'Как записать корень $n$-й степени в виде степени с дробным показателем?',
            'Что происходит с показателями при умножении степеней с одинаковым основанием?',
            f'На что делятся показатели при извлечении корня степени ${n1}$?',
        ],
        iskhod=expr, usloviya=usl,
        klyuch=f'op:{n1}{n2}{n3}:{p1}{q1}{p2}{q2}{p3}{q3}:{op}',
    )


# ── 6. Полный квадрат под корнем (при условии) ────────────────────────


def s_polnyi_kvadrat(rng: random.Random) -> Zadacha:
    """√(m²a ∓ 2mk√(ab) + k²b) при m²a > k²b — это m√a ∓ k√b."""
    S, T = pick(rng, PARY)
    sn, tn = S.name, T.name
    mm, kk = rng.randint(1, 3), rng.randint(1, 4)
    if mm == kk:
        return None
    var = rng.randint(0, 2)
    sA, sB = sp.sqrt(S), sp.sqrt(T)
    P = sp.sqrt(mm**2 * S + 2 * mm * kk * sp.sqrt(S * T) + kk**2 * T)
    M = sp.sqrt(mm**2 * S - 2 * mm * kk * sp.sqrt(S * T) + kk**2 * T)
    A, B = cf(mm, sq(sn)), cf(kk, sq(tn))
    a2, b2 = cf(mm * mm, sn), cf(kk * kk, tn)
    mid = f'{2 * mm * kk}{sq(sn + tn)}'
    Pt, Mt = sq(f'{a2}+{mid}+{b2}'), sq(f'{a2}-{mid}+{b2}')
    usl = [mm**2 * S > kk**2 * T, T > 0]
    g = sp.gcd(mm * mm, kk * kk)
    a2r, b2r = cf(mm * mm // g, sn), cf(kk * kk // g, tn)
    usl_tex = f'${a2r}>{b2r}>0$'
    common = [
        Shag('Подкоренные выражения — полные квадраты',
             f'{a2}\\pm{mid}+{b2}=({A}\\pm{B})^2'),
        Shag(f'$\\sqrt{{c^2}}=|c|$. При ${a2r}>{b2r}$ имеем ${A}>{B}$, поэтому ${A}-{B}>0$ и модули снимаются без смены знака',
             f'{Pt}={A}+{B},\\quad {Mt}={A}-{B}'),
    ]
    if var == 0:
        expr, ans = P + M, 2 * mm * sA
        formula = f'{Pt}+{Mt}'
        fin = Shag('Складываем', f'({A}+{B})+({A}-{B})={cf(2 * mm, sq(sn))}')
        ans_tex = cf(2 * mm, sq(sn))
    elif var == 1:
        expr, ans = P - M, 2 * kk * sB
        formula = f'{Pt}-{Mt}'
        fin = Shag('Вычитаем', f'({A}+{B})-({A}-{B})={cf(2 * kk, sq(tn))}')
        ans_tex = cf(2 * kk, sq(tn))
    else:
        expr, ans = M / (mm**2 * S - kk**2 * T), 1 / (mm * sA + kk * sB)
        formula = f'\\frac{{{Mt}}}{{{a2}-{b2}}}'
        ans_tex = f'\\frac{{1}}{{{A}+{B}}}'
        fin = Shag(f'Знаменатель — разность квадратов: ${a2}-{b2}=({A}-{B})({A}+{B})$; сокращаем на ${A}-{B}\\ne0$',
                   f'\\frac{{{A}-{B}}}{{({A}-{B})({A}+{B})}}={ans_tex}')
    pts = pts_for([expr, ans], (S, T), usl, rng=rng)
    return Zadacha(
        tip=TIP, uroven=1, podtip='polnyi-kvadrat',
        uslovie=f'Упростите выражение при {usl_tex}',
        formula=formula,
        otvet=vyr(ans, pts, ans_tex),
        razbor=common + [fin],
        podskazki=[
            f'Квадратом какого двучлена является ${a2}-{mid}+{b2}$?',
            'Чему равен $\\sqrt{c^2}$ — и когда модуль можно снять без смены знака?',
            'Какой знак у разности корней при данном условии?',
        ],
        iskhod=expr, usloviya=usl,
        klyuch=f'pk:{mm}:{kk}:{var}',
    )


# ── 7. Ответ по знаку (кусочный) ──────────────────────────────────────


def s_kusochnyi(rng: random.Random) -> Zadacha:
    var = _STATE['kus'] % 3
    S = pick(rng, [x, y, a])
    sn = S.name
    kk = rng.randint(2, 7)
    s = sp.sqrt(S)
    Sx = sq(sn)
    M = sq(f'{sn}-{2 * kk}{Sx}+{kk * kk}')
    if var == 0:
        expr = (S - kk**2) / sp.sqrt(S - 2 * kk * s + kk**2)
        k1, k2 = -(s + kk), s + kk
        formula = f'\\frac{{{sn}-{kk * kk}}}{{{M}}}'
        brk = kk * kk
        kuski = [(0, brk, True, False, k1, expr), (brk, sp.oo, False, False, k2, expr)]
        razbor = [
            Shag('Под корнем в знаменателе — полный квадрат', f'{sn}-{2 * kk}{Sx}+{kk * kk}=({Sx}-{kk})^2'),
            Shag(f'$\\sqrt{{c^2}}=|c|$; числитель — разность квадратов', f'\\frac{{({Sx}-{kk})({Sx}+{kk})}}{{|{Sx}-{kk}|}}'),
            Shag(f'При $0\\le {sn}<{brk}$ имеем ${Sx}-{kk}<0$, модуль равен $-({Sx}-{kk})$', f'-({Sx}+{kk})'),
            Shag(f'При ${sn}>{brk}$ модуль снимается без смены знака', f'{Sx}+{kk}'),
        ]
        hint = f'Квадратом какого двучлена является ${sn}-{2 * kk}{Sx}+{kk * kk}$?'
    elif var == 1:
        expr = s * sp.sqrt((s + kk / s)**2 - 4 * kk)
        formula = f'{Sx}\\cdot{sq(f"\\left({Sx}+\\frac{{{kk}}}{{{Sx}}}\\right)^2-{4 * kk}")}'
        brk = kk
        kuski = [(0, brk, False, True, kk - S, expr), (brk, sp.oo, False, False, S - kk, expr)]
        razbor = [
            Shag('Раскрываем квадрат: удвоенное произведение равно константе',
                 f'\\left({Sx}+\\frac{{{kk}}}{{{Sx}}}\\right)^2-{4 * kk}={sn}+{2 * kk}+\\frac{{{kk * kk}}}{{{sn}}}-{4 * kk}'
                 f'=\\left({Sx}-\\frac{{{kk}}}{{{Sx}}}\\right)^2'),
            Shag('$\\sqrt{c^2}=|c|$; вносим множитель $' + Sx + '>0$ под модуль',
                 f'{Sx}\\cdot\\left|{Sx}-\\frac{{{kk}}}{{{Sx}}}\\right|=|{sn}-{kk}|'),
            Shag(f'При $0<{sn}\\le{kk}$ выражение под модулем неположительно', f'{kk}-{sn}'),
            Shag(f'При ${sn}>{kk}$ — положительно', f'{sn}-{kk}'),
        ]
        hint = f'Чему равно удвоенное произведение $2\\cdot{Sx}\\cdot\\frac{{{kk}}}{{{Sx}}}$?'
    else:
        P = sq(f'{sn}+{2 * kk}{Sx}+{kk * kk}')
        expr = sp.sqrt(S + 2 * kk * s + kk**2) + sp.sqrt(S - 2 * kk * s + kk**2)
        formula = f'{P}+{M}'
        brk = kk * kk
        kuski = [(0, brk, True, False, sp.Integer(2 * kk), expr), (brk, sp.oo, True, False, 2 * s, expr)]
        razbor = [
            Shag('Оба подкоренных выражения — полные квадраты',
                 f'{sn}\\pm{2 * kk}{Sx}+{kk * kk}=({Sx}\\pm{kk})^2'),
            Shag('$\\sqrt{c^2}=|c|$; первый модуль раскрывается сразу, так как ' + f'${Sx}+{kk}>0$',
                 f'{Sx}+{kk}+|{Sx}-{kk}|'),
            Shag(f'При $0\\le {sn}<{brk}$: $|{Sx}-{kk}|={kk}-{Sx}$', f'{Sx}+{kk}+{kk}-{Sx}={2 * kk}'),
            Shag(f'При ${sn}\\ge{brk}$: $|{Sx}-{kk}|={Sx}-{kk}$', f'{Sx}+{kk}+{Sx}-{kk}=2{Sx}'),
        ]
        hint = 'Квадратами каких двучленов являются подкоренные выражения?'
    ot = otvet_kusochnyi(S, kuski, seed=rng.randint(0, 10**6))
    return Zadacha(
        tip=TIP, uroven=1, podtip='modul-po-znaku',
        uslovie='Упростите выражение',
        formula=formula,
        dopolnenie='Ответ запишите отдельно для каждого промежутка.',
        otvet=ot,
        razbor=razbor,
        podskazki=[
            hint,
            'Чему равен $\\sqrt{c^2}$?',
            'При каких значениях переменной выражение под модулем меняет знак?',
        ],
        iskhod=expr,
        klyuch=f'mz:{var}:{kk}',
    )


# ── 8. Сокращение дробей с корнями ────────────────────────────────────


def s_sokrashchenie(rng: random.Random) -> Zadacha:
    S, T = pick(rng, PARY)
    sn, tn = S.name, T.name
    sA, sB = sp.sqrt(S), sp.sqrt(T)
    A, B = sq(sn), sq(tn)
    AB = sq(sn + tn)
    var = rng.randint(0, 3)
    kk = rng.randint(1, 5)
    mm = rng.randint(1, 5)
    if var == 0:
        if kk == mm:
            return None
        expr = (kk * S * sB + mm * T * sA) / (kk * sA + mm * sB)
        ans = sp.sqrt(S * T)
        formula = f'\\frac{{{cf(kk, sn + B)}+{cf(mm, tn + A)}}}{{{cf(kk, A)}+{cf(mm, B)}}}'
        ans_tex = AB
        razbor = [
            Shag(f'Записываем ${sn}={A}\\cdot{A}$, ${tn}={B}\\cdot{B}$: в обоих слагаемых числителя есть ${A}\\cdot{B}={AB}$',
                 f'{sn}{B}={A}\\cdot{AB},\\quad {tn}{A}={B}\\cdot{AB}'),
            Shag(f'Выносим в числителе общий множитель ${AB}$',
                 f'{cf(kk, sn + B)}+{cf(mm, tn + A)}={AB}\\,({cf(kk, A)}+{cf(mm, B)})'),
            Shag(f'Сокращаем на ${cf(kk, A)}+{cf(mm, B)}>0$', AB),
        ]
        key = (kk, mm)
    elif var == 1:
        expr = (S - kk * sp.sqrt(S * T)) / (kk * sp.sqrt(S * T) - kk**2 * T)
        ans = sA / (kk * sB)
        kB = cf(kk, B)
        formula = f'\\frac{{{sn}-{cf(kk, AB)}}}{{{cf(kk, AB)}-{cf(kk * kk, tn)}}}'
        ans_tex = f'\\frac{{{A}}}{{{kB}}}'
        razbor = [
            Shag(f'В числителе выносим ${A}$', f'{sn}-{cf(kk, AB)}={A}\\,({A}-{kB})'),
            Shag(f'В знаменателе выносим ${kB}$', f'{cf(kk, AB)}-{cf(kk * kk, tn)}={kB}\\,({A}-{kB})'),
            Shag(f'Сокращаем на ${A}-{kB}\\ne0$', ans_tex),
        ]
        key = (kk,)
    elif var == 2:
        expr = (S - kk**2 * T) / (S + kk * sp.sqrt(S * T))
        ans = (sA - kk * sB) / sA
        kB = cf(kk, B)
        formula = f'\\frac{{{sn}-{cf(kk * kk, tn)}}}{{{sn}+{cf(kk, AB)}}}'
        ans_tex = f'\\frac{{{A}-{kB}}}{{{A}}}'
        razbor = [
            Shag('Числитель раскладываем как разность квадратов', f'{sn}-{cf(kk * kk, tn)}=({A}-{kB})({A}+{kB})'),
            Shag(f'В знаменателе выносим ${A}$', f'{sn}+{cf(kk, AB)}={A}\\,({A}+{kB})'),
            Shag(f'Сокращаем на ${A}+{kB}>0$', ans_tex),
        ]
        key = (kk,)
    else:
        expr = (kk * S * sB - kk * T * sA) / (S - 2 * sp.sqrt(S * T) + T)
        ans = kk * sp.sqrt(S * T) / (sA - sB)
        formula = f'\\frac{{{cf(kk, sn + B)}-{cf(kk, tn + A)}}}{{{sn}-2{AB}+{tn}}}'
        ans_tex = f'\\frac{{{cf(kk, AB)}}}{{{A}-{B}}}'
        razbor = [
            Shag(f'В числителе выносим ${cf(kk, AB)}$', f'{cf(kk, sn + B)}-{cf(kk, tn + A)}={cf(kk, AB)}\\,({A}-{B})'),
            Shag('Знаменатель — квадрат разности', f'{sn}-2{AB}+{tn}=({A}-{B})^2'),
            Shag(f'Сокращаем на ${A}-{B}\\ne0$', ans_tex),
        ]
        key = (kk,)
    usl = [S > 0, T > 0]
    pts = pts_for([expr, ans], (S, T), usl, rng=rng)
    return Zadacha(
        tip=TIP, uroven=1, podtip='sokrashchenie-drobi',
        uslovie=f'Сократите дробь ($ {sn}>0$, ${tn}>0$)'.replace('$ ', '$'),
        formula=formula,
        otvet=vyr(ans, pts, ans_tex),
        razbor=razbor,
        podskazki=[
            f'Как записать ${sn}$ через ${A}$?',
            'Какой общий множитель можно вынести в числителе и в знаменателе?',
            'Нет ли в числителе или знаменателе формулы сокращённого умножения?',
        ],
        iskhod=expr, usloviya=usl,
        klyuch=f'sd:{var}:{key}',
    )


# ── 9. Значение дроби с корнями (число) ───────────────────────────────


_DEC_SQ = [Fraction(w, 10) for w in (5, 15, 25, 35, 45, 12, 16, 18, 24, 32, 36, 45, 64)] + \
    [Fraction(1, 3), Fraction(2, 3), Fraction(4, 3), Fraction(5, 4), Fraction(7, 4), Fraction(3, 7)]


def s_znachenie_drobi(rng: random.Random) -> Zadacha:
    """(√x+k)/(√x−k) ± (√x−k)/(√x+k) при данном x."""
    S = pick(rng, [x, a, y])
    sn = S.name
    kk = rng.randint(1, 4)
    s = pick(rng, [1, -1])
    Sx = sq(sn)
    sx = sp.sqrt(S)
    expr = (sx + kk) / (sx - kk) + s * (sx - kk) / (sx + kk)
    if s > 0:
        val = R(Fraction(rng.randint(2, 40), pick(rng, [1, 2, 4, 5])))
        if val == kk**2 or val.q == 1 and sp.sqrt(val).is_Rational:
            return None
        simp = 2 * (S + kk**2) / (S - kk**2)
        simp_tex = f'\\frac{{2({sn}+{kk * kk})}}{{{sn}-{kk * kk}}}'
        num_tex_ = f'({Sx}+{kk})^2+({Sx}-{kk})^2=2{sn}+{2 * kk * kk}'
    else:
        w = R(pick(rng, _DEC_SQ))
        val = w * w
        if val == kk**2:
            return None
        simp = 4 * kk * sx / (S - kk**2)
        simp_tex = f'\\frac{{{4 * kk}{Sx}}}{{{sn}-{kk * kk}}}'
        num_tex_ = f'({Sx}+{kk})^2-({Sx}-{kk})^2={4 * kk}{Sx}'
    value = sp.nsimplify(simp.subs(S, val))
    sh_val = num_tex(val)
    subs_step = (f'\\frac{{2({sh_val}+{kk * kk})}}{{{sh_val}-{kk * kk}}}' if s > 0
                 else f'{Sx}={num_tex(sp.sqrt(val))},\\quad \\frac{{{4 * kk}\\cdot{num_tex(sp.sqrt(val))}}}{{{sh_val}-{kk * kk}}}')
    return Zadacha(
        tip=TIP, uroven=1, podtip='znachenie-drobi',
        uslovie='Упростите выражение',
        formula=f'\\frac{{{Sx}+{kk}}}{{{Sx}-{kk}}}{zn(s)}\\frac{{{Sx}-{kk}}}{{{Sx}+{kk}}}',
        dopolnenie=f'и найдите его значение при ${sn}={sh_val}$.',
        otvet=otvet_chislo(value),
        razbor=[
            Shag(f'Общий знаменатель — произведение сопряжённых: $({Sx}-{kk})({Sx}+{kk})={sn}-{kk * kk}$',
                 f'\\frac{{({Sx}+{kk})^2{zn(s)}({Sx}-{kk})^2}}{{{sn}-{kk * kk}}}'),
            Shag('Раскрываем квадраты в числителе: слагаемые с корнем ' + ('сокращаются' if s > 0 else 'складываются, остальное сокращается'),
                 num_tex_),
            Shag('Упрощённое выражение', simp_tex),
            Shag('Подставляем значение', f'{subs_step}={num_tex(value)}'),
        ],
        podskazki=[
            'Какой общий знаменатель у двух дробей?',
            'Что останется в числителе после раскрытия квадратов?',
            'Куда удобнее подставлять число — в исходное выражение или в упрощённое?',
        ],
        iskhod=expr.subs(S, val),
        klyuch=f'zd:{kk}:{s}:{val}',
    )


# ── 10. Значение выражения с дробными степенями (число) ───────────────


def s_znachenie_stepeni(rng: random.Random) -> Zadacha:
    S, T = pick(rng, [(a, b), (x, y), (m, n)])
    sn, tn = S.name, T.name
    var = rng.randint(0, 1)
    if var == 0:
        # ((a^{3/2}+b^{3/2})/(a^{1/2}+b^{1/2}) − (ab)^{1/2}) : (a − b) = (√a−√b)/(√a+√b)
        rr = R(pick(rng, [Fraction(3), Fraction(2), Fraction(4), Fraction(5), Fraction(3, 2),
                          Fraction(5, 2), Fraction(1, 3), Fraction(2, 3), Fraction(4, 3), Fraction(1, 4)]))
        d = R(pick(rng, [Fraction(w, 10) for w in (2, 3, 5, 6, 7, 12)] + [Fraction(1, 5), Fraction(3, 8)]))
        vb = d
        va = rr**2 * d
        if va.q > 100 or va > 60:
            return None
        expr = ((S**sp.Rational(3, 2) + T**sp.Rational(3, 2)) / (S**H + T**H) - (S * T)**H) / (S - T)
        simp = (sp.sqrt(S) - sp.sqrt(T)) / (sp.sqrt(S) + sp.sqrt(T))
        value = sp.nsimplify((rr - 1) / (rr + 1))
        formula = (f'\\left(\\frac{{{sn}^{{3/2}}+{tn}^{{3/2}}}}{{{sn}^{{1/2}}+{tn}^{{1/2}}}}-({sn}{tn})^{{1/2}}\\right)'
                   f':({sn}-{tn})')
        razbor = [
            Shag(f'Числитель первой дроби — сумма кубов величин ${sn}^{{1/2}}$ и ${tn}^{{1/2}}$; сокращаем',
                 f'\\frac{{{sn}^{{3/2}}+{tn}^{{3/2}}}}{{{sn}^{{1/2}}+{tn}^{{1/2}}}}={sn}-({sn}{tn})^{{1/2}}+{tn}'),
            Shag('Вычитаем $(' + sn + tn + ')^{1/2}$ и сворачиваем квадрат разности',
                 f'{sn}-2({sn}{tn})^{{1/2}}+{tn}=({sn}^{{1/2}}-{tn}^{{1/2}})^2'),
            Shag(f'Делим на ${sn}-{tn}=({sn}^{{1/2}}-{tn}^{{1/2}})({sn}^{{1/2}}+{tn}^{{1/2}})$',
                 f'\\frac{{{sq(sn)}-{sq(tn)}}}{{{sq(sn)}+{sq(tn)}}}'),
            Shag(f'Делим числитель и знаменатель на ${sq(tn)}$: удобно, что $\\sqrt{{{sn}/{tn}}}={num_tex(rr)}$',
                 f'\\frac{{{num_tex(rr)}-1}}{{{num_tex(rr)}+1}}={num_tex(value)}'),
        ]
        hints = [
            f'Кубами каких выражений являются ${sn}^{{3/2}}$ и ${tn}^{{3/2}}$?',
            'Что получится после вычитания — нет ли полного квадрата?',
            f'Чему равно отношение ${sn}:{tn}$ при данных значениях?',
        ]
        key = f'{rr}:{d}'
    else:
        kk = rng.randint(1, 2)
        s = pick(rng, [1, -1])
        va = R(Fraction(rng.randint(11, 99), 10))
        vb = R(Fraction(rng.randint(11, 99), 10))
        if va == vb:
            return None
        A, Bt = S**sp.Rational(1, 3), T**sp.Rational(1, 3)
        expr = ((A + s * kk * Bt)**2 - 3 * s * kk * A * Bt) * (A + s * kk * Bt)
        simp = S + s * kk**3 * T
        value = va + s * kk**3 * vb
        A_, kB = pw(sn, sp.Rational(1, 3)), cf(kk, pw(tn, sp.Rational(1, 3)))
        AB = f'{pw(sn, sp.Rational(1, 3))}{pw(tn, sp.Rational(1, 3))}'
        formula = f'\\left(({A_}{zn(s)}{kB})^2{zn(-s)}{cf(3 * kk, AB)}\\right)({A_}{zn(s)}{kB})'
        tri = f'{pw(sn, sp.Rational(2, 3))}{zn(-s)}{cf(kk, AB)}+{cf(kk * kk, pw(tn, sp.Rational(2, 3)))}'
        formula_simp = f'{sn}{zn(s)}{cf(kk**3, tn)}'
        razbor = [
            Shag('Раскрываем квадрат и приводим подобные в первой скобке',
                 f'({A_}{zn(s)}{kB})^2{zn(-s)}{cf(3 * kk, AB)}={tri}'),
            Shag('Получили неполный квадрат; по формуле ' + ('суммы' if s > 0 else 'разности') + ' кубов',
                 f'({tri})({A_}{zn(s)}{kB})={formula_simp}'),
            Shag('Подставляем значения — кубические корни больше не нужны',
                 f'{num_tex(va)}{zn(s)}{"" if kk == 1 else str(kk**3) + "\\cdot"}{num_tex(vb)}={num_tex(value)}'),
        ]
        hints = [
            'Что получится в первой скобке после раскрытия квадрата?',
            'Какую формулу сокращённого умножения напоминает произведение?',
            'Нужно ли извлекать кубические корни из данных чисел?',
        ]
        key = f'k:{kk}:{s}:{va}:{vb}'
    return Zadacha(
        tip=TIP, uroven=1, podtip='znachenie-stepeni',
        uslovie='Упростите выражение',
        formula=formula,
        dopolnenie=f'и найдите его значение при ${sn}={num_tex(va)}$, ${tn}={num_tex(vb)}$.',
        otvet=otvet_chislo(value),
        razbor=razbor,
        podskazki=hints,
        iskhod=expr.subs({S: va, T: vb}),
        klyuch=f'zs:{var}:{key}',
    ) if sp.simplify(simp.subs({S: va, T: vb}) - value) == 0 else None


# ── 11. Сопряжённые множители ─────────────────────────────────────────


def s_sopryazhennye(rng: random.Random) -> Zadacha:
    """A=√(x+k1), B=√(x−k2): (A+B)/(A−B) ± (A−B)/(A+B)."""
    S = pick(rng, [x, a, m, y])
    sn = S.name
    k1, k2 = rng.randint(0, 7), rng.randint(0, 7)
    if k1 + k2 == 0 or k1 == k2 == 0:
        return None
    s = pick(rng, [1, -1])

    def lin_(c):
        return sn if c == 0 else (f'{sn}+{c}' if c > 0 else f'{sn}-{-c}')

    At, Bt = sq(lin_(k1)), sq(lin_(-k2))

    def par(c):
        return sn if c == 0 else f'({lin_(c)})'
    A, B = sp.sqrt(S + k1), sp.sqrt(S - k2)
    expr = (A + B) / (A - B) + s * (A - B) / (A + B)
    K = k1 + k2
    usl = [S > k2]
    if s > 0:
        ans = 2 * (2 * S + k1 - k2) / K
        cst = k1 - k2
        top = f'2{sn}' + ('' if cst == 0 else (f'+{cst}' if cst > 0 else f'-{-cst}'))
        num_step = f'2({par(k1)}+{par(-k2)})=2({top})'
        g4 = sp.gcd(sp.gcd(4, 2 * cst), K)
        c1, c0, kd = 4 // g4, 2 * cst // g4, K // g4
        top_r = cf(c1, sn) + ('' if c0 == 0 else (f'+{c0}' if c0 > 0 else f'-{-c0}'))
        ans_tex = top_r if kd == 1 else f'\\frac{{{top_r}}}{{{kd}}}'
    else:
        ans = 4 * sp.sqrt((S + k1) * (S - k2)) / K
        if k1 == 0:
            prod = f'{sn}({lin_(-k2)})'
        elif k2 == 0:
            prod = f'{sn}({lin_(k1)})'
        else:
            prod = f'({lin_(k1)})({lin_(-k2)})'
        num_step = f'4{At}{Bt}=4{sq(prod)}'
        g4 = sp.gcd(4, K)
        c4, kd = 4 // g4, K // g4
        ans_tex = (f'\\frac{{{cf(c4, sq(prod))}}}{{{kd}}}' if kd != 1 else cf(c4, sq(prod)))
    hi = max(30, k2 + 20)
    pts = sample_points([expr, ans], {S: (k2, hi)}, usl, seed=rng.randint(0, 10**6))
    return Zadacha(
        tip=TIP, uroven=1, podtip='sopryazhennye',
        uslovie=f'Упростите выражение при ${sn}>{k2}$',
        formula=f'\\frac{{{At}+{Bt}}}{{{At}-{Bt}}}{zn(s)}\\frac{{{At}-{Bt}}}{{{At}+{Bt}}}',
        otvet=vyr(ans, pts, ans_tex),
        razbor=[
            Shag('Общий знаменатель — произведение сопряжённых выражений; это разность квадратов, корни исчезают',
                 f'({At}-{Bt})({At}+{Bt})={par(k1)}-{par(-k2)}={K}'),
            Shag('Числитель после приведения к общему знаменателю',
                 f'({At}+{Bt})^2{zn(s)}({At}-{Bt})^2'),
            Shag('Раскрываем квадраты: ' + ('удвоенные произведения сокращаются' if s > 0 else 'остаются только удвоенные произведения'),
                 num_step),
            Shag('Делим на общий знаменатель', ans_tex),
        ],
        podskazki=[
            'Чему равно произведение $(A-B)(A+B)$, если $A$ и $B$ — квадратные корни?',
            'Что остаётся от суммы (разности) квадратов $(A+B)^2$ и $(A-B)^2$?',
            'Чему равны $A^2$ и $B^2$ здесь?',
        ],
        iskhod=expr, usloviya=usl,
        klyuch=f'sp:{k1}:{k2}:{s}',
    )


# ── 12. Кубические корни ──────────────────────────────────────────────


def s_kubicheskie(rng: random.Random) -> Zadacha:
    S, T = pick(rng, PARY)
    sn, tn = S.name, T.name
    kk = rng.randint(1, 4)
    s = pick(rng, [1, -1])
    var = rng.randint(0, 1)
    A, Bv = S**sp.Rational(1, 3), T**sp.Rational(1, 3)
    At, Bt = rt(sn, 3), rt(tn, 3)
    kB = cf(kk, Bt)
    tri = f'{rt(sn + "^2", 3)}{zn(-s)}{cf(kk, rt(sn + tn, 3))}+{cf(kk * kk, rt(tn + "^2", 3))}'
    tri_e = A**2 - s * kk * A * Bv + kk**2 * Bv**2
    kub = 'суммы' if s > 0 else 'разности'
    usl = [S > 0, T > 0]
    if var == 0:
        expr = (S + s * kk**3 * T) / tri_e - A
        ans = s * kk * Bv
        formula = f'\\frac{{{sn}{zn(s)}{cf(kk**3, tn)}}}{{{tri}}}-{At}'
        ans_tex = ('' if s > 0 else '-') + kB
        razbor = [
            Shag(f'Числитель — {kub[:-1] + "а"} кубов: ${sn}=({At})^3$, ${cf(kk**3, tn)}=({kB})^3$',
                 f'{sn}{zn(s)}{cf(kk**3, tn)}=({At}{zn(s)}{kB})({tri})'),
            Shag('Знаменатель совпадает со второй скобкой (неполный квадрат) — сокращаем, он положителен',
                 f'{At}{zn(s)}{kB}'),
            Shag(f'Вычитаем ${At}$', f'{At}{zn(s)}{kB}-{At}={ans_tex}'),
        ]
    else:
        expr = (sp.root(S**4, 3) + s * kk**3 * sp.root(S * T**3, 3)) / tri_e
        ans = A**2 + s * kk * (S * T)**sp.Rational(1, 3)
        formula = f'\\frac{{{rt(sn + "^4", 3)}{zn(s)}{cf(kk**3, rt(sn + tn + "^3", 3))}}}{{{tri}}}'
        ans_tex = f'{rt(sn + "^2", 3)}{zn(s)}{cf(kk, rt(sn + tn, 3))}'
        razbor = [
            Shag(f'В числителе выносим ${At}$: ${rt(sn + "^4", 3)}={sn}{At}$, ${rt(sn + tn + "^3", 3)}={tn}{At}$',
                 f'{At}\\,({sn}{zn(s)}{cf(kk**3, tn)})'),
            Shag(f'Раскладываем скобку по формуле {kub} кубов',
                 f'{sn}{zn(s)}{cf(kk**3, tn)}=({At}{zn(s)}{kB})({tri})'),
            Shag('Сокращаем на неполный квадрат (он положителен) и раскрываем скобки',
                 f'{At}({At}{zn(s)}{kB})={ans_tex}'),
        ]
    pts = pts_for([expr, ans], (S, T), usl, rng=rng)
    return Zadacha(
        tip=TIP, uroven=1, podtip='kubicheskie-korni',
        uslovie=f'Упростите выражение при {pol(sn)}, {pol(tn)}',
        formula=formula,
        otvet=vyr(ans, pts, ans_tex),
        razbor=razbor,
        podskazki=[
            f'Кубом чего являются ${sn}$ и ${cf(kk**3, tn)}$?',
            f'Какая формула {kub} кубов содержит знаменатель как множитель?',
            'Что можно сократить?',
        ],
        iskhod=expr, usloviya=usl,
        klyuch=f'kb:{kk}:{s}:{var}',
    )


# ── 13. Корни 4-й и 6-й степени: разность квадратов дважды ────────────


def s_chetvertye(rng: random.Random) -> Zadacha:
    S, T = pick(rng, PARY)
    sn, tn = S.name, T.name
    kk = rng.randint(1, 3)
    s = pick(rng, [1, -1])
    var = rng.randint(0, 1)
    usl = [S > 0, T > 0]
    if var == 0:
        A4, B4 = rt(sn, 4), cf(kk, rt(tn, 4))
        A2, B2 = sq(sn), cf(kk * kk, sq(tn))
        expr = (S - kk**4 * T) / ((sp.sqrt(S) + kk**2 * sp.sqrt(T)) * (S**sp.Rational(1, 4) + s * kk * T**sp.Rational(1, 4)))
        ans = S**sp.Rational(1, 4) - s * kk * T**sp.Rational(1, 4)
        formula = f'\\frac{{{sn}-{cf(kk**4, tn)}}}{{({A2}+{B2})({A4}{zn(s)}{B4})}}'
        ans_tex = f'{A4}{zn(-s)}{B4}'
        razbor = [
            Shag('Числитель — разность квадратов', f'{sn}-{cf(kk**4, tn)}=({A2}-{B2})({A2}+{B2})'),
            Shag(f'Сокращаем на ${A2}+{B2}>0$', f'\\frac{{{A2}-{B2}}}{{{A4}{zn(s)}{B4}}}'),
            Shag('Снова разность квадратов: $' + A2 + '=(' + A4 + ')^2$',
                 f'{A2}-{B2}=({A4}-{B4})({A4}+{B4})'),
            Shag(f'Сокращаем на ${A4}{zn(s)}{B4}\\ne0$', ans_tex),
        ]
        hints = [
            f'Как разложить ${sn}-{cf(kk**4, tn)}$ на множители?',
            f'Квадратом чего является ${A2}$?',
            'Какой множитель числителя совпадает со вторым множителем знаменателя?',
        ]
    else:
        A6, B6 = rt(sn, 6), cf(kk, rt(tn, 6))
        A3, B3 = rt(sn, 3), cf(kk * kk, rt(tn, 3))
        expr = (S**sp.Rational(1, 3) - kk**2 * T**sp.Rational(1, 3)) / (S**sp.Rational(1, 6) + s * kk * T**sp.Rational(1, 6))
        ans = S**sp.Rational(1, 6) - s * kk * T**sp.Rational(1, 6)
        formula = f'\\frac{{{A3}-{B3}}}{{{A6}{zn(s)}{B6}}}'
        ans_tex = f'{A6}{zn(-s)}{B6}'
        razbor = [
            Shag('Сводим к корням шестой степени: $\\sqrt[3]{c}=\\sqrt[6]{c^2}=(\\sqrt[6]{c})^2$',
                 f'{A3}=({A6})^2,\\quad {B3}=({B6})^2'),
            Shag('Числитель — разность квадратов', f'{A3}-{B3}=({A6}-{B6})({A6}+{B6})'),
            Shag(f'Сокращаем на ${A6}{zn(s)}{B6}\\ne0$', ans_tex),
        ]
        hints = [
            f'Квадратом какого корня является ${A3}$?',
            'Какая формула видна в числителе?',
            'Что сократится со знаменателем?',
        ]
    pts = pts_for([expr, ans], (S, T), usl, rng=rng)
    return Zadacha(
        tip=TIP, uroven=1, podtip='korni-vysshih-stepenei',
        uslovie=f'Упростите выражение при {pol(sn)}, {pol(tn)}',
        formula=formula,
        otvet=vyr(ans, pts, ans_tex),
        razbor=razbor,
        podskazki=hints,
        iskhod=expr, usloviya=usl,
        klyuch=f'ch:{kk}:{s}:{var}',
    )


# ── 14. Отрицательные дробные показатели ──────────────────────────────


def s_otric_pokazateli(rng: random.Random) -> Zadacha:
    S, T = pick(rng, PARY)
    sn, tn = S.name, T.name
    var = rng.randint(0, 1)
    usl = [S > 0, T > 0]
    mh = sp.Rational(-1, 2)
    if var == 0:
        kk, mm = rng.randint(1, 5), rng.randint(1, 5)
        if kk == mm and kk > 1:
            return None
        expr = (kk * S**H + mm * T**H) / (mm * S**mh + kk * T**mh)
        ans = (S * T)**H
        formula = (f'\\frac{{{cf(kk, pw(sn, H))}+{cf(mm, pw(tn, H))}}}'
                   f'{{{cf(mm, pw(sn, mh))}+{cf(kk, pw(tn, mh))}}}')
        ans_tex = f'({sn}{tn})^{{1/2}}'
        razbor = [
            Shag('Записываем степени с отрицательным показателем дробями: $c^{-1/2}=\\frac{1}{c^{1/2}}$',
                 f'{cf(mm, pw(sn, mh))}+{cf(kk, pw(tn, mh))}=\\frac{{{mm}}}{{{pw(sn, H)}}}+\\frac{{{kk}}}{{{pw(tn, H)}}}'
                 f'=\\frac{{{cf(mm, pw(tn, H))}+{cf(kk, pw(sn, H))}}}{{({sn}{tn})^{{1/2}}}}'),
            Shag('Числитель знаменателя совпадает с числителем всей дроби; деление на дробь — умножение на перевёрнутую',
                 f'({cf(kk, pw(sn, H))}+{cf(mm, pw(tn, H))})\\cdot'
                 f'\\frac{{({sn}{tn})^{{1/2}}}}{{{cf(kk, pw(sn, H))}+{cf(mm, pw(tn, H))}}}'),
            Shag('Сокращаем на положительное выражение', ans_tex),
        ]
        key = f'{kk}:{mm}'
    else:
        kk = rng.randint(1, 6)
        s = pick(rng, [1, -1])
        expr = (S**-1 - kk**2 * T**-1) / (S**mh + s * kk * T**mh)
        ans = S**mh - s * kk * T**mh
        formula = f'\\frac{{{sn}^{{-1}}-{cf(kk * kk, tn + "^{-1}")}}}{{{pw(sn, mh)}{zn(s)}{cf(kk, pw(tn, mh))}}}'
        ans_tex = f'\\frac{{1}}{{{sq(sn)}}}{zn(-s)}\\frac{{{kk}}}{{{sq(tn)}}}'
        razbor = [
            Shag('Замечаем: $' + sn + '^{-1}=(' + pw(sn, mh) + ')^2$ — числитель является разностью квадратов',
                 f'{sn}^{{-1}}-{cf(kk * kk, tn + "^{-1}")}=({pw(sn, mh)}-{cf(kk, pw(tn, mh))})({pw(sn, mh)}+{cf(kk, pw(tn, mh))})'),
            Shag(f'Сокращаем на ${pw(sn, mh)}{zn(s)}{cf(kk, pw(tn, mh))}\\ne0$',
                 f'{pw(sn, mh)}{zn(-s)}{cf(kk, pw(tn, mh))}'),
            Shag('Записываем без отрицательных показателей', ans_tex),
        ]
        key = f'{kk}:{s}'
    pts = pts_for([expr, ans], (S, T), usl, rng=rng)
    return Zadacha(
        tip=TIP, uroven=1, podtip='otricatelnye-pokazateli',
        uslovie=f'Упростите выражение при {pol(sn)}, {pol(tn)}',
        formula=formula,
        otvet=vyr(ans, pts, ans_tex),
        razbor=razbor,
        podskazki=[
            'Как записать степень с отрицательным показателем в виде дроби?',
            'Нет ли в числителе формулы сокращённого умножения?',
            'Какой множитель сокращается?',
        ],
        iskhod=expr, usloviya=usl,
        klyuch=f'ot:{var}:{key}',
    )


# ── Расписание подтипов ───────────────────────────────────────────────

KVOTY = [
    (s_kvadrat_summy, 7), (s_kuby_stepeni, 7), (s_kuby_korni, 7), (s_vynesenie, 8),
    (s_odin_pokazatel, 8), (s_polnyi_kvadrat, 7), (s_kusochnyi, 3), (s_sokrashchenie, 7),
    (s_znachenie_drobi, 6), (s_znachenie_stepeni, 6), (s_sopryazhennye, 7),
    (s_kubicheskie, 6), (s_chetvertye, 7), (s_otric_pokazateli, 7),
]
PODTIPY = [f for f, _ in KVOTY]

_SCHED = [f for f, cnt in KVOTY for _ in range(cnt)]
random.Random(1202).shuffle(_SCHED)
_STATE = {'i': 0, 'keys': set(), 'kus': 0}


def generator(rng: random.Random) -> Zadacha:
    """Подтипы по квотам: каждая новая задача — следующий подтип расписания."""
    f = _SCHED[_STATE['i'] % len(_SCHED)]
    for _ in range(500):
        try:
            zd = f(rng)
        except (ValueError, ZeroDivisionError):
            continue
        if zd is None or zd.klyuch in _STATE['keys']:
            continue
        _STATE['keys'].add(zd.klyuch)
        if zd.podtip == 'modul-po-znaku':
            _STATE['kus'] += 1
        _STATE['i'] += 1
        return zd
    raise RuntimeError(f'подтип {f.__name__} не даёт новых задач')
