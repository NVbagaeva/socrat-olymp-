"""
Тип 1.5. Подставить данное выражение вместо переменной и упростить:
дробь от t при t = (a − rb)/(a + rb); выражения с √(1 + x²) и √(x² − 1)
при x — полусумме/полуразности √(a/b) и √(b/a); многочлен в точке
x = (√k − σ)/2. Ответ — выражение в параметрах (с условиями) или число.
Уровень ★.
"""

from __future__ import annotations

import itertools
import random

import sympy as sp

from ..core import (
    L, Shag, Zadacha, a, b, lin, nonzero, otvet_chislo, otvet_vyrazhenie, pick,
    poly_tex, sample_points, t, term, x,
)

TIP = '1.5'


def coef_sym(r: int, name: str) -> str:
    return name if r == 1 else f'{r}{name}'


# ── 1. Дробь от t, t = (a − rb)/(a + rb) ──────────────────────────────


def s_drob_t(rng: random.Random) -> Zadacha:
    r = pick(rng, [1, 2, 3])
    rb = coef_sym(r, 'b')
    sub = (a - r * b) / (a + r * b)
    r2b2 = f'{r * r}b^2' if r > 1 else 'b^2'
    # (1 − t²) = 4rab/(a+rb)², (1 + t²) = 2(a² + r²b²)/(a+rb)²
    varianty = [
        ('(1-t^2)/(1+t^2)', (1 - t**2) / (1 + t**2), '\\frac{1-t^2}{1+t^2}'),
        ('2t/(1+t^2)', 2 * t / (1 + t**2), '\\frac{2t}{1+t^2}'),
        ('(1+t^2)/(1-t^2)', (1 + t**2) / (1 - t**2), '\\frac{1+t^2}{1-t^2}'),
        ('t/(1-t^2)', t / (1 - t**2), '\\frac{t}{1-t^2}'),
    ]
    imya, f, f_tex = pick(rng, varianty)
    expr = f.subs(t, sub)
    ans = sp.factor(sp.cancel(expr))
    den = f'(a+{rb})^2'
    t2 = f'\\frac{{(a-{rb})^2}}{{{den}}}'
    one_minus = f'\\frac{{(a+{rb})^2-(a-{rb})^2}}{{{den}}}=\\frac{{{4 * r}ab}}{{{den}}}'
    one_plus = f'\\frac{{(a+{rb})^2+(a-{rb})^2}}{{{den}}}=\\frac{{2(a^2+{r2b2})}}{{{den}}}'
    pts = sample_points([expr, ans], {a: (-9, 9), b: (-9, 9)}, seed=rng.randint(0, 10**6))
    razbor = [
        Shag('Возводим $t$ в квадрат', f't^2={t2}'),
    ]
    if '1-t^2' in imya:
        razbor.append(Shag('Считаем $1-t^2$: приводим к общему знаменателю, в числителе — разность квадратов',
                           f'1-t^2={one_minus}'))
    if '1+t^2' in imya:
        razbor.append(Shag('Считаем $1+t^2$', f'1+t^2={one_plus}'))
    if imya == '(1-t^2)/(1+t^2)':
        fin = f'\\frac{{{4 * r}ab}}{{2(a^2+{r2b2})}}={L(ans)}'
    elif imya == '(1+t^2)/(1-t^2)':
        fin = f'\\frac{{2(a^2+{r2b2})}}{{{4 * r}ab}}={L(ans)}'
    elif imya == '2t/(1+t^2)':
        fin = (f'\\frac{{2(a-{rb})}}{{a+{rb}}}\\cdot\\frac{{{den}}}{{2(a^2+{r2b2})}}'
               f'=\\frac{{(a-{rb})(a+{rb})}}{{a^2+{r2b2}}}={L(ans)}')
    else:
        fin = (f'\\frac{{a-{rb}}}{{a+{rb}}}\\cdot\\frac{{{den}}}{{{4 * r}ab}}'
               f'=\\frac{{(a-{rb})(a+{rb})}}{{{4 * r}ab}}={L(ans)}')
    razbor.append(Shag('Делим дроби: знаменатели $' + den + '$ сокращаются', fin))
    return Zadacha(
        tip=TIP, uroven=1, podtip='drob-ot-t',
        uslovie=f'Подставьте $t=\\frac{{a-{rb}}}{{a+{rb}}}$ в выражение',
        formula=f_tex, dopolnenie='и упростите результат.',
        otvet=otvet_vyrazhenie(ans, pts),
        razbor=razbor,
        podskazki=[
            'Что удобнее сосчитать отдельно, прежде чем подставлять в дробь?',
            f'Какая формула получается в числителе $1-t^2$ после приведения к знаменателю ${den}$?',
            'Что сократится при делении дробей?',
        ],
        iskhod=expr,
        klyuch=f'dt:{imya}',
    )


# ── 2. x = ½(√(a/b) ∓ √(b/a)), выражения с √(1 + x²) или √(x² − 1) ──


def s_polusumma(rng: random.Random) -> Zadacha:
    plus = pick(rng, [False, True])  # True: x = ½(√(a/b) + √(b/a)), под корнем x² − 1
    big = pick(rng, [True, False])  # для x² − 1: a > b или b > a
    sab = sp.sqrt(a * b)
    xv = (a + b) / (2 * sab) if plus else (a - b) / (2 * sab)
    if plus:
        usl = [b > 0, a > b] if big else [a > 0, b > a]
        usl_tex = '$a>b>0$' if big else '$b>a>0$'
        R = sp.sqrt(x**2 - 1)
        R_tex = '\\sqrt{x^2-1}'
        (a - b) / (2 * sab) if big else (b - a) / (2 * sab)
        R_val_tex = '\\frac{a-b}{2\\sqrt{ab}}' if big else '\\frac{b-a}{2\\sqrt{ab}}'
        pod = '\\frac{(a+b)^2}{4ab}-1=\\frac{(a-b)^2}{4ab}'
        mod_tex = f'|a-b|={"a-b" if big else "b-a"}'
    else:
        usl = [a > 0, b > 0]
        usl_tex = '$a>0$, $b>0$'
        R = sp.sqrt(1 + x**2)
        R_tex = '\\sqrt{1+x^2}'
        (a + b) / (2 * sab)
        R_val_tex = '\\frac{a+b}{2\\sqrt{ab}}'
        pod = '1+\\frac{(a-b)^2}{4ab}=\\frac{(a+b)^2}{4ab}'
        mod_tex = 'a+b>0'
    xs = '+' if plus else '-'
    varianty = [
        ('ratio', (x - R) / (x + R), f'\\frac{{x-{R_tex}}}{{x+{R_tex}}}'),
        ('sum', x + R, f'x+{R_tex}'),
        ('quot', x / R, f'\\frac{{x}}{{{R_tex}}}'),
        ('diff', R - x, f'{R_tex}-x'),
    ]
    if plus:
        varianty[2] = ('quot', R / x, f'\\frac{{{R_tex}}}{{x}}')
    imya, f, f_tex = pick(rng, varianty)
    expr = f.subs(x, xv)
    xv_tex = f'\\frac{{a{xs}b}}{{2\\sqrt{{ab}}}}'
    # значения через u = √a, v = √b: x = (u² ± v²)/(2uv), корень = (…)/(2uv)
    num_x = f'a{xs}b'
    num_R = ('a-b' if big else 'b-a') if plus else 'a+b'
    zn = {
        'ratio': (f'\\frac{{({num_x})-({num_R})}}{{({num_x})+({num_R})}}', None),
        'sum': (f'\\frac{{({num_x})+({num_R})}}{{2\\sqrt{{ab}}}}', None),
        'quot': ((f'\\frac{{{num_R}}}{{{num_x}}}' if plus else f'\\frac{{{num_x}}}{{{num_R}}}'), None),
        'diff': (f'\\frac{{({num_R})-({num_x})}}{{2\\sqrt{{ab}}}}', None),
    }[imya][0]
    ans, ans_tex = _ans_polusumma(imya, plus, big)
    pts = sample_points([expr, ans], {a: (0, 12), b: (0, 12)}, usl, seed=rng.randint(0, 10**6))
    otvet = otvet_vyrazhenie(ans, pts)
    otvet['tex'] = ans_tex
    razbor = [
        Shag(('Возводим $x$ в квадрат и вычитаем $1$' if plus else 'Возводим $x$ в квадрат и прибавляем $1$')
             + ': получается полный квадрат',
             f'{"x^2-1" if plus else "1+x^2"}={pod}'),
        Shag('Извлекаем корень: $\\sqrt{X^2}=|X|$, ' + (f'а при {usl_tex} ' if plus else 'а ')
             + f'${mod_tex}$', f'{R_tex}={R_val_tex}'),
    ]
    if zn == ans_tex:
        razbor.append(Shag('Подставляем: общий знаменатель $2\\sqrt{ab}$ сокращается', zn))
    else:
        razbor.append(Shag('Подставляем: у $x$ и корня общий знаменатель $2\\sqrt{ab}$', zn))
        if imya in ('sum', 'diff'):
            hi_, lo_ = ('a', 'b') if (big or not plus) else ('b', 'a')
            mid = {('sum', True): f'2{hi_}', ('diff', True): f'-2{lo_}',
                   ('sum', False): '2a', ('diff', False): '2b'}[(imya, plus)]
            razbor.append(Shag('Упрощаем: $\\sqrt{ab}=\\sqrt{a}\\cdot\\sqrt{b}$',
                               f'{zn}=\\frac{{{mid}}}{{2\\sqrt{{ab}}}}={ans_tex}'))
        else:
            razbor.append(Shag('Упрощаем', f'{zn}={ans_tex}'))
    return Zadacha(
        tip=TIP, uroven=1, podtip='polusumma-kornei',
        uslovie=f'Подставьте $x={xv_tex}$ в выражение',
        formula=f_tex, dopolnenie=f'и упростите результат при {usl_tex}.',
        otvet=otvet,
        razbor=razbor,
        podskazki=[
            f'Что получится, если $x^2$ {"уменьшить" if plus else "увеличить"} на $1$ и привести к общему знаменателю?',
            'Как извлечь корень из полного квадрата, не потеряв знак?',
            'Какой общий знаменатель у $x$ и корня?',
        ],
        iskhod=expr,
        klyuch=f'ps:{imya}:{plus}:{big if plus else ""}',
    )


def _ans_polusumma(imya: str, plus: bool, big: bool):
    """Ответ и его запись в TeX."""
    if not plus:
        # x = (a−b)/(2√ab), R = (a+b)/(2√ab)
        return {
            'ratio': (-b / a, '-\\frac{b}{a}'),
            'sum': (sp.sqrt(a / b), '\\sqrt{\\frac{a}{b}}'),
            'quot': ((a - b) / (a + b), '\\frac{a-b}{a+b}'),
            'diff': (sp.sqrt(b / a), '\\sqrt{\\frac{b}{a}}'),
        }[imya]
    # x = (a+b)/(2√ab), R = |a−b|/(2√ab)
    hi, lo = ('a', 'b') if big else ('b', 'a')
    H, Lo = sp.Symbol(hi), sp.Symbol(lo)
    return {
        'ratio': (Lo / H, f'\\frac{{{lo}}}{{{hi}}}'),
        'sum': (sp.sqrt(H / Lo), f'\\sqrt{{\\frac{{{hi}}}{{{lo}}}}}'),
        'quot': ((H - Lo) / (a + b), f'\\frac{{{hi}-{lo}}}{{a+b}}'),
        'diff': (-sp.sqrt(Lo / H), f'-\\sqrt{{\\frac{{{lo}}}{{{hi}}}}}'),
    }[imya]


# ── 3. Произведение четырёх скобок при x = (√k − σ)/2 ─────────────────


def _x_root(rng):
    """σ, s, k: x = (√k − σ)/2 — корень x² + σx − s = 0."""
    for _ in range(100):
        sigma = pick(rng, [1, 3, 5, 7])
        s = nonzero(rng, -3, 8)
        k = 4 * s + sigma * sigma
        if k > 1 and all(e == 1 for e in sp.factorint(k).values()):
            return sigma, s, k
    raise ValueError('нет k')


def br(c0: int) -> str:
    """Скобка x + c0 в произведении: «x» без скобок."""
    return 'x' if c0 == 0 else f'({lin("x", c0)})'


def sk_val(s: int, c0: int) -> str:
    return f'({s}{term(c0, "")})' if c0 else f'{"(" if s < 0 else ""}{s}{")" if s < 0 else ""}'


def s_skobki(rng: random.Random) -> Zadacha:
    sigma, s, k = _x_root(rng)
    pary = [(i, sigma - i) for i in range(0, sigma // 2 + 1)] + [(-1, sigma + 1), (-2, sigma + 2)]
    p1, p2 = rng.sample(pary, 2)
    al, de = p1
    be, ga = p2
    xv = (sp.sqrt(k) - sigma) / 2
    expr_x = (x + al) * (x + be) * (x + ga) * (x + de)
    expr = expr_x.subs(x, xv)
    val = (s + al * de) * (s + be * ga)
    if sorted((al, be, ga, de)) in ([1, 2, 3, 4], [0, 1, 2, 3]):
        return None  # слишком заезженное произведение
    if val == 0:
        return None
    prod = ''.join(br(w) for w in (al, be, ga, de))
    q1 = f'x^2+{sigma if sigma > 1 else ""}x' + term(al * de, '')
    q2 = f'x^2+{sigma if sigma > 1 else ""}x' + term(be * ga, '')
    sx = f'x^2+{sigma if sigma > 1 else ""}x'
    return Zadacha(
        tip=TIP, uroven=1, podtip='chetyre-skobki',
        uslovie=f'Подставьте $x=\\frac{{\\sqrt{{{k}}}-{sigma}}}{{2}}$ в выражение',
        formula=prod, dopolnenie='и найдите его значение.',
        otvet=otvet_chislo(sp.Integer(val)),
        razbor=[
            Shag(f'Группируем скобки так, чтобы в каждой паре сумма свободных членов была ${sigma}$',
                 f'[{br(al)}{br(de)}]\\cdot[{br(be)}{br(ga)}]'
                 f'=({q1})({q2})'),
            Shag('Из $2x+' + str(sigma) + f'=\\sqrt{{{k}}}$ возводим в квадрат и находим ${sx}$',
                 f'4x^2+{4 * sigma}x+{sigma * sigma}={k}\\ \\Rightarrow\\ {sx}={s}'),
            Shag('Подставляем в каждую скобку',
                 f'{sk_val(s, al * de)}{sk_val(s, be * ga)}={s + al * de}\\cdot{"(" if s + be * ga < 0 else ""}'
                 f'{s + be * ga}{")" if s + be * ga < 0 else ""}={val}'),
        ],
        podskazki=[
            'Какие скобки удобно перемножить попарно, чтобы появилось одно и то же выражение?',
            f'Чему равно $x^2+{sigma}x$ при данном $x$, если не подставлять корень напрямую?',
            'Что остаётся посчитать после замены?',
        ],
        iskhod=expr,
        klyuch=f'sk:{sigma}:{s}:{sorted([p1, p2])}',
    )


def s_mnogochlen(rng: random.Random) -> Zadacha:
    sigma, s, k = _x_root(rng)
    tri = x**2 + sigma * x - s
    Q = x**2 + rng.randint(-4, 4) * x + rng.randint(-5, 5) if rng.random() < 0.6 else x + rng.randint(-5, 5)
    r1 = pick(rng, [0, 0, 2, -2])
    r0 = rng.randint(-9, 9)
    P = sp.expand(Q * tri + r1 * x + r0)
    xv = (sp.sqrt(k) - sigma) / 2
    expr = P.subs(x, xv)
    ans = sp.expand(r0 + r1 * xv)
    if ans == 0:
        return None
    tri_tex = poly_tex(tri, x)
    ost = poly_tex(r1 * x + r0, x)
    razbor = [
        Shag(f'Число $x$ — корень квадратного трёхчлена: из $2x+{sigma}=\\sqrt{{{k}}}$ возводим в квадрат',
             f'4x^2+{4 * sigma}x+{sigma * sigma}={k}\\ \\Rightarrow\\ {tri_tex}=0'),
        Shag('Делим многочлен на этот трёхчлен с остатком',
             f'{poly_tex(P, x)}={"x" if Q == x else "(" + poly_tex(Q, x) + ")"}({tri_tex}){term(r1, "x") if r1 else ""}{term(r0, "") if r0 else ""}'),
        Shag('Первое слагаемое равно нулю, остаётся остаток', f'P(x)={ost}'),
    ]
    if r1:
        razbor.append(Shag(f'Подставляем ${r1}x={"" if r1 > 0 else "-"}(\\sqrt{{{k}}}-{sigma})$',
                           f'{ost}={L(ans)}'))
    return Zadacha(
        tip=TIP, uroven=1, podtip='mnogochlen-v-tochke',
        uslovie=f'Найдите значение многочлена $P(x)$ при $x=\\frac{{\\sqrt{{{k}}}-{sigma}}}{{2}}$',
        formula=f'P(x)={poly_tex(P, x)}',
        otvet=otvet_chislo(ans),
        razbor=razbor,
        podskazki=[
            f'Какому квадратному уравнению с целыми коэффициентами удовлетворяет $x=\\frac{{\\sqrt{{{k}}}-{sigma}}}{{2}}$?',
            'Что получится, если разделить $P(x)$ на этот трёхчлен с остатком?',
            'Чему равен остаток при данном $x$?',
        ],
        iskhod=expr,
        klyuch=f'mn:{sp.srepr(P)}:{k}',
    )


# ── 5. (√(1+t) ± √(1−t)) при t = 2rab/(a² + r²b²) ─────────────────────


def s_koren_t(rng: random.Random) -> Zadacha:
    r = pick(rng, [1, 2, 3])
    big = pick(rng, [True, False])  # a > rb или a < rb
    rb = coef_sym(r, 'b')
    r2b2 = f'{r * r}b^2' if r > 1 else 'b^2'
    sub = 2 * r * a * b / (a**2 + r**2 * b**2)
    plus_ratio = pick(rng, [True, False])
    if plus_ratio:
        f = (sp.sqrt(1 + t) + sp.sqrt(1 - t)) / (sp.sqrt(1 + t) - sp.sqrt(1 - t))
        f_tex = '\\frac{\\sqrt{1+t}+\\sqrt{1-t}}{\\sqrt{1+t}-\\sqrt{1-t}}'
    else:
        f = (sp.sqrt(1 + t) - sp.sqrt(1 - t)) / (sp.sqrt(1 + t) + sp.sqrt(1 - t))
        f_tex = '\\frac{\\sqrt{1+t}-\\sqrt{1-t}}{\\sqrt{1+t}+\\sqrt{1-t}}'
    expr = f.subs(t, sub)
    usl = [b > 0, a > r * b] if big else [a > 0, a < r * b]
    usl_tex = f'$a>{rb}>0$' if big else f'$0<a<{rb}$'
    mod = f'a-{rb}' if big else f'{rb}-a'
    # √(1±t) = (a ± rb)/√(a²+r²b²) — числители: P = a + rb, M = |a − rb|
    if big:
        sum_pm, diff_pm = '2a', f'{2 * r}b'
        ans = a / (r * b) if plus_ratio else r * b / a
    else:
        sum_pm, diff_pm = f'{2 * r}b', '2a'
        ans = r * b / a if plus_ratio else a / (r * b)
    top, bot = (sum_pm, diff_pm) if plus_ratio else (diff_pm, sum_pm)
    zn1, zn2 = ('+', '-') if plus_ratio else ('-', '+')
    pts = sample_points([expr, ans], {a: (0, 12), b: (0, 6)}, usl, seed=rng.randint(0, 10**6))
    return Zadacha(
        tip=TIP, uroven=1, podtip='koren-ot-t',
        uslovie=f'Подставьте $t=\\frac{{{2 * r}ab}}{{a^2+{r2b2}}}$ в выражение',
        formula=f_tex, dopolnenie=f'и упростите результат при {usl_tex}.',
        otvet=otvet_vyrazhenie(ans, pts),
        razbor=[
            Shag('Считаем $1+t$ и $1-t$: в числителях — полные квадраты',
                 f'1\\pm t=\\frac{{a^2+{r2b2}\\pm{2 * r}ab}}{{a^2+{r2b2}}}=\\frac{{(a\\pm {rb})^2}}{{a^2+{r2b2}}}'),
            Shag(f'Извлекаем корни: $\\sqrt{{X^2}}=|X|$, при {usl_tex} $|a-{rb}|={mod}$',
                 f'\\sqrt{{1+t}}=\\frac{{a+{rb}}}{{\\sqrt{{a^2+{r2b2}}}}},\\quad '
                 f'\\sqrt{{1-t}}=\\frac{{{mod}}}{{\\sqrt{{a^2+{r2b2}}}}}'),
            Shag(f'Подставляем; общий знаменатель $\\sqrt{{a^2+{r2b2}}}$ сокращается',
                 f'\\frac{{(a+{rb}){zn1}({mod})}}{{(a+{rb}){zn2}({mod})}}=\\frac{{{top}}}{{{bot}}}={L(ans)}'),
        ],
        podskazki=[
            'Что получится в числителе $1+t$ после приведения к общему знаменателю?',
            f'Какой знак у $a-{rb}$ при данном условии?',
            'Что сократится после подстановки корней в дробь?',
        ],
        iskhod=expr,
        klyuch=f'kt:{r}',
    )


PODTIPY = [s_drob_t, s_polusumma, s_skobki, s_mnogochlen, s_koren_t]

_OCHERED = itertools.count()


def generator(rng: random.Random) -> Zadacha | None:
    # подтипы по кругу — каждый представлен примерно поровну
    podtip = PODTIPY[next(_OCHERED) % len(PODTIPY)]
    for _ in range(50):
        zd = podtip(rng)
        if zd is not None:
            return zd
    return None
