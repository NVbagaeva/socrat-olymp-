"""
Тип 1.8. Рациональные дроби с многочленами 3–4-й степени: разложить
числитель и знаменатель (подбор целого корня по теореме Безу, деление,
группировка) и сократить; иногда затем найти значение. Уровень ★★.
"""

from __future__ import annotations

import random

import sympy as sp

from ..core import (
    L, Shag, Zadacha, lin, nonzero, num_tex, otvet_chislo, otvet_vyrazhenie,
    pick, poly_tex, sample_points, term,
)

TIP = '1.8'
BUKVY = 'xatpy'


def _bukva(rng: random.Random) -> sp.Symbol:
    return sp.Symbol(pick(rng, BUKVY))


def _znach_tex(poly, var, r: int) -> str:
    """P(r) по слагаемым: «-8-8-10+26=0»."""
    pl = sp.Poly(sp.expand(poly), var)
    parts = []
    for (deg,), cf in sorted(pl.terms(), key=lambda kv: -kv[0][0]):
        val = cf * sp.Integer(r) ** deg
        if val == 0:
            continue
        parts.append(term(val, first=not parts))
    return ''.join(parts) + f'={num_tex(pl.eval(r))}'


def _deliteli(n: int) -> str:
    n = abs(int(n))
    ds = [dd for dd in range(1, n + 1) if n % dd == 0]
    if len(ds) > 6:
        ds = ds[:5]
        return '\\pm' + ',\\ \\pm'.join(map(str, ds)) + ',\\ \\ldots'
    return '\\pm' + ',\\ \\pm'.join(map(str, ds))


def _kv_nerazl(rng: random.Random) -> tuple[int, int]:
    """x²+px+q с отрицательным дискриминантом."""
    pp = rng.randint(-6, 6)
    qq = rng.randint(pp * pp // 4 + 1, pp * pp // 4 + 9)
    return pp, qq


def _kv_tex(var, pp, qq) -> str:
    return poly_tex(var**2 + pp * var + qq, var)


def _koren_shag(name: str, poly, var, r: int) -> Shag:
    cf0 = sp.Poly(poly, var).eval(0)
    return Shag(
        f'Ищем целый корень {name} среди делителей свободного члена ${_deliteli(cf0)}$',
        f'{var.name}={r}:\\quad {_znach_tex(poly, var, r)}',
    )


# ── Подтипы ───────────────────────────────────────────────────────────


def s_obshchii_kvadratnyi(rng: random.Random, znachenie: bool = False) -> Zadacha:
    """(x−r1)Q / ((x−r2)Q), Q — неразложимый квадратный трёхчлен."""
    v = _bukva(rng)
    r1 = nonzero(rng, -4, 4)
    r2 = nonzero(rng, -4, 4, exclude=[r1])
    pp, qq = _kv_nerazl(rng)
    Q = v**2 + pp * v + qq
    N, D = sp.expand((v - r1) * Q), sp.expand((v - r2) * Q)
    expr = N / D
    ans = (v - r1) / (v - r2)
    qt = _kv_tex(v, pp, qq)
    disc = pp * pp - 4 * qq
    razbor = [
        _koren_shag('числителя', N, v, r1),
        Shag(f'По теореме Безу числитель делится на ${lin(v.name, -r1)}$; делим (схемой Горнера)',
             f'{poly_tex(N, v)}=({lin(v.name, -r1)})({qt})'),
        _koren_shag('знаменателя', D, v, r2),
        Shag(f'Делим знаменатель на ${lin(v.name, -r2)}$ — частное то же',
             f'{poly_tex(D, v)}=({lin(v.name, -r2)})({qt})'),
        Shag(f'Трёхчлен ${qt}$ не обращается в нуль (дискриминант ${disc}<0$), сокращаем на него',
             f'\\frac{{({lin(v.name, -r1)})({qt})}}{{({lin(v.name, -r2)})({qt})}}={L(ans)}'),
    ]
    podskazki = [
        'Какие целые числа могут быть корнями числителя?',
        'На какой двучлен делится многочлен, если найден его корень?',
        'Нет ли у числителя и знаменателя общего квадратного множителя?',
    ]
    return _sobrat(rng, 'obshchii-kvadratnyi', v, expr, ans, N, D, razbor, podskazki,
                   f'ok:{v}:{r1}:{r2}:{pp}:{qq}', znachenie, r2)


def s_obshchii_lineinyi(rng: random.Random, znachenie: bool = False) -> Zadacha:
    """(x−r)(x−s)(x−t1) / ((x−r)(x−s)(x−t2)): после деления — трёхчлены по Виету."""
    v = _bukva(rng)
    while True:
        r, s, t1, t2 = (nonzero(rng, -5, 5) for _ in range(4))
        if len({r, s, t1, t2}) == 4 and s + t1 != 0 and s + t2 != 0:
            break
    Q1, Q2 = sp.expand((v - s) * (v - t1)), sp.expand((v - s) * (v - t2))
    N, D = sp.expand((v - r) * Q1), sp.expand((v - r) * Q2)
    expr = N / D
    ans = (v - t1) / (v - t2)
    nm = lambda c0: f'({lin(v.name, -c0)})'
    razbor = [
        _koren_shag('числителя', N, v, r),
        Shag(f'Делим числитель на ${lin(v.name, -r)}$ (теорема Безу), трёхчлен раскладываем по теореме Виета',
             f'{poly_tex(N, v)}={nm(r)}({poly_tex(Q1, v)})={nm(r)}{nm(s)}{nm(t1)}'),
        Shag(f'Знаменатель при ${v.name}={r}$ тоже равен нулю: ${_znach_tex(D, v, r)}$. Делим и раскладываем',
             f'{poly_tex(D, v)}={nm(r)}({poly_tex(Q2, v)})={nm(r)}{nm(s)}{nm(t2)}'),
        Shag(f'Сокращаем на ${nm(r)}{nm(s)}\\ne0$',
             f'\\frac{{{nm(r)}{nm(s)}{nm(t1)}}}{{{nm(r)}{nm(s)}{nm(t2)}}}={L(ans)}'),
    ]
    podskazki = [
        'Какой целый делитель свободного члена обращает числитель в нуль?',
        'Не обращается ли в нуль при том же значении знаменатель?',
        'Как разложить получившиеся квадратные трёхчлены?',
    ]
    return _sobrat(rng, 'obshchii-lineinyi', v, expr, ans, N, D, razbor, podskazki,
                   f'ol:{v}:{r}:{s}:{t1}:{t2}', znachenie, t2)


def s_gruppirovka(rng: random.Random) -> Zadacha:
    """(x²+k)(x²+αx+β) / ((x²+k)(x−r)) — группировка."""
    v = _bukva(rng)
    k = rng.randint(2, 9)
    r = nonzero(rng, -5, 5)
    while True:
        al = nonzero(rng, -6, 6)
        be = nonzero(rng, -9, 9)
        if be != k and be + k != 0 and r * r + al * r + be != 0 and al * al - 4 * be != 0:
            break
    Q = v**2 + al * v + be
    N, D = sp.expand((v**2 + k) * Q), sp.expand((v**2 + k) * (v - r))
    expr = N / D
    ans = Q / (v - r)
    vn = v.name
    qt = poly_tex(Q, v)
    kv = f'{vn}^2+{k}'
    raz_num = (f'{vn}^4{term(al, f"{vn}^3")}{term(be, f"{vn}^2")}{term(k, f"{vn}^2")}'
               f'{term(al * k, vn)}{term(k * be)}')
    gr_num = (f'{vn}^2({qt})+{k}({qt})')
    razbor = [
        Shag(f'В числителе разбиваем ${num_tex(be + k)}{vn}^2$ на ${num_tex(be)}{vn}^2$ и ${k}{vn}^2$',
             f'{poly_tex(N, v)}={raz_num}'),
        Shag('Группируем первые три и последние три слагаемых',
             f'{gr_num}=({kv})({qt})'),
        Shag('В знаменателе группируем попарно',
             f'{poly_tex(D, v)}={vn}^2({lin(vn, -r)})+{k}({lin(vn, -r)})=({kv})({lin(vn, -r)})'),
        Shag(f'Сокращаем на ${kv}>0$',
             f'\\frac{{({kv})({qt})}}{{({kv})({lin(vn, -r)})}}=\\frac{{{qt}}}{{{lin(vn, -r)}}}'),
    ]
    pts = sample_points([expr], {v: (-10, 10)}, seed=rng.randint(0, 10**6))
    return Zadacha(
        tip=TIP, uroven=2, podtip='gruppirovka',
        uslovie='Сократите дробь',
        formula=f'\\frac{{{poly_tex(N, v)}}}{{{poly_tex(D, v)}}}',
        otvet=otvet_vyrazhenie(ans, pts),
        razbor=razbor,
        podskazki=[
            'Нельзя ли сгруппировать слагаемые знаменателя попарно?',
            f'Какой множитель получился в знаменателе? Нет ли его в числителе?',
            f'Как разбить слагаемое с ${vn}^2$ в числителе, чтобы группировка сработала?',
        ],
        iskhod=expr,
        klyuch=f'gr:{v}:{k}:{r}:{al}:{be}',
    )


def _sobrat(rng, podtip, v, expr, ans, N, D, razbor, podskazki, klyuch, znachenie, polyus):
    formula = f'\\frac{{{poly_tex(N, v)}}}{{{poly_tex(D, v)}}}'
    if not znachenie:
        pts = sample_points([expr], {v: (-10, 10)}, seed=rng.randint(0, 10**6))
        return Zadacha(
            tip=TIP, uroven=2, podtip=podtip,
            uslovie='Сократите дробь', formula=formula,
            otvet=otvet_vyrazhenie(ans, pts),
            razbor=razbor, podskazki=podskazki, iskhod=expr, klyuch=klyuch,
        )
    # значение в точке polyus + √m: после сокращения считается в одну строку
    mm = pick(rng, [2, 3, 5, 6, 7])
    val0 = polyus + sp.sqrt(mm)
    value = sp.radsimp(sp.expand(ans.subs(v, val0)))
    value = sp.nsimplify(value) if value.is_Rational else sp.expand(value)
    num_ans = sp.expand(sp.numer(sp.together(ans)).subs(v, val0))
    razbor = razbor + [
        Shag(f'Подставляем ${v.name}={L(val0)}$ в сокращённую дробь',
             f'\\frac{{{L(num_ans)}}}{{\\sqrt{{{mm}}}}}={L(value)}'),
    ]
    return Zadacha(
        tip=TIP, uroven=2, podtip=podtip + '-znachenie',
        uslovie='Сократите дробь', formula=formula,
        dopolnenie=f'и найдите её значение при ${v.name}={L(val0)}$.',
        otvet=otvet_chislo(value),
        razbor=razbor,
        podskazki=podskazki + ['Куда удобнее подставлять число — в исходную дробь или в сокращённую?'],
        iskhod=expr.subs(v, val0),
        klyuch=klyuch + f':z{mm}',
    )


def _ok_z(rng):
    return s_obshchii_kvadratnyi(rng, znachenie=True)


def _ol_z(rng):
    return s_obshchii_lineinyi(rng, znachenie=True)


PODTIPY = [s_obshchii_kvadratnyi, s_obshchii_lineinyi, s_gruppirovka, _ok_z, _ol_z]
VESA = [3, 3, 2, 1, 1]


def generator(rng: random.Random) -> Zadacha:
    return rng.choices(PODTIPY, weights=VESA)[0](rng)
