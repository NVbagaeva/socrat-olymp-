"""
Тип 1.14. Разложение «трудных» многочленов на множители: круговые
(циклические) выражения, выделение полного квадрата (приём Софи Жермен),
многочлен восьмой степени — в произведение квадратных трёхчленов,
кубы с параметрами. Уровень ★★★.
"""

from __future__ import annotations

import random

import sympy as sp

from ..core import (
    L, SYM, Shag, Zadacha, otvet_vyrazhenie, pick, sample_points,
)

TIP = '1.14'
FORMA = ['proizvedenie']

BUKVY = [('a', 'b', 'c'), ('x', 'y', 'z'), ('m', 'n', 'p'), ('p', 'q', 't')]


def _pts(expr, syms, rng):
    return sample_points([expr], {s: (-5, 5) for s in syms}, seed=rng.randint(0, 10**6))


# ── Круговые выражения ───────────────────────────────────────────────

# (функция от a, b, c; TeX-шаблон; симметрический множитель Q)
KRUG = [
    (lambda a, b, c: a**3 * (b - c) + b**3 * (c - a) + c**3 * (a - b),
     '{a}^3({b}-{c})+{b}^3({c}-{a})+{c}^3({a}-{b})', 'lin'),
    (lambda a, b, c: a * (b - c)**3 + b * (c - a)**3 + c * (a - b)**3,
     '{a}({b}-{c})^3+{b}({c}-{a})^3+{c}({a}-{b})^3', 'lin'),
    (lambda a, b, c: a * b * (a - b) + b * c * (b - c) + c * a * (c - a),
     '{a}{b}({a}-{b})+{b}{c}({b}-{c})+{c}{a}({c}-{a})', 'one'),
    (lambda a, b, c: (b - c) * (b + c)**2 + (c - a) * (c + a)**2 + (a - b) * (a + b)**2,
     '({b}-{c})({b}+{c})^2+({c}-{a})({c}+{a})^2+({a}-{b})({a}+{b})^2', 'one'),
    (lambda a, b, c: b * c * (b**2 - c**2) + c * a * (c**2 - a**2) + a * b * (a**2 - b**2),
     '{b}{c}({b}^2-{c}^2)+{c}{a}({c}^2-{a}^2)+{a}{b}({a}^2-{b}^2)', 'lin'),
    (lambda a, b, c: (a + b)**3 * (a - b) + (b + c)**3 * (b - c) + (c + a)**3 * (c - a),
     '({a}+{b})^3({a}-{b})+({b}+{c})^3({b}-{c})+({c}+{a})^3({c}-{a})', 'lin'),
]


def s_krug(rng: random.Random) -> Zadacha:
    i = rng.randrange(len(KRUG))
    f, shablon, vid = KRUG[i]
    names = pick(rng, BUKVY)
    A, B, C = (SYM[nm] for nm in names)
    na, nb, nc = names
    E = f(A, B, C)
    tex = shablon.format(a=na, b=nb, c=nc)
    deg = sp.Poly(sp.expand(E), A, B, C).total_degree()
    V = (A - B) * (B - C) * (C - A)
    Q = A + B + C if vid == 'lin' else sp.Integer(1)
    kk = sp.cancel(sp.expand(E) / sp.expand(V * Q))
    assert kk.is_number
    ans = sp.factor(sp.expand(E))
    vt = f'({na}-{nb})({nb}-{nc})({nc}-{na})'
    vals = {A: 0, B: 1, C: 2}
    e_val = E.subs(vals)
    v_val = V.subs(vals)
    if vid == 'lin':
        q_val = 3
        ostatok = (f'Степень выражения ${deg}$, а у произведения — $3$; значит, остаётся симметрический '
                   f'множитель первой степени, то есть $k({na}+{nb}+{nc})$')
        vid_tex = f'{tex}=k\\,{vt}({na}+{nb}+{nc})'
        koef = f'{e_val}=k\\cdot({v_val})\\cdot{q_val}\\ \\Rightarrow\\ k={L(kk)}'
    else:
        q_val = 1
        ostatok = f'Степень выражения ${deg}$ — такая же, как у произведения, поэтому остаётся только числовой множитель $k$'
        vid_tex = f'{tex}=k\\,{vt}'
        koef = f'{e_val}=k\\cdot({v_val})\\ \\Rightarrow\\ k={L(kk)}'
    kt = '' if kk == 1 else ('-' if kk == -1 else L(kk))
    itog = f'{kt}{vt}' + (f'({na}+{nb}+{nc})' if vid == 'lin' else '')
    return Zadacha(
        tip=TIP, uroven=3, podtip='krugovoe',
        uslovie='Разложите на множители', formula=tex,
        otvet=otvet_vyrazhenie(ans, _pts(E, (A, B, C), rng), forma=FORMA),
        razbor=[
            Shag(f'Считаем выражение многочленом от ${na}$. При ${na}={nb}$ оно обращается в ноль, '
                 f'значит, делится на ${na}-{nb}$; при круговой замене ${na}\\to {nb}\\to {nc}\\to {na}$ '
                 f'выражение не меняется, поэтому оно делится и на ${nb}-{nc}$, ${nc}-{na}$',
                 f'{tex}\\Big|_{{{na}={nb}}}=0'),
            Shag(ostatok, vid_tex),
            Shag(f'Находим $k$, подставив удобные значения ${na}=0$, ${nb}=1$, ${nc}=2$', koef),
            Shag('Записываем разложение', f'{tex}={itog}'),
        ],
        podskazki=[
            f'Чему равно выражение при ${na}={nb}$? Что это говорит о делимости?',
            'Какие ещё множители дают круговые перестановки букв?',
            'Сравните степени: что может остаться после деления на три разности?',
            'Какие значения букв удобно подставить, чтобы найти числовой коэффициент?',
        ],
        iskhod=E,
        klyuch=f'kr:{i}',
    )


# ── Софи Жермен: (Au²)² + (Bv²)², 2AB — полный квадрат ────────────────

SOFI = [(1, 8), (8, 1), (2, 9), (9, 2), (1, 18), (18, 1), (8, 9), (9, 8), (2, 25), (25, 2)]


def _mono(cf: int, body: str) -> str:
    return body if cf == 1 else f'{cf}{body}'


def s_sofi(rng: random.Random) -> Zadacha:
    A, B = pick(rng, SOFI)
    s_ = int(sp.sqrt(2 * A * B))
    two = rng.random() < 0.5 and A * A <= 81 and B * B <= 81
    u = SYM['x']
    v = SYM['y'] if two else sp.Integer(1)
    E = A**2 * u**4 + B**2 * v**4
    ans = sp.factor(E)
    pts = _pts(E, [u] + ([v] if two else []), rng)
    xv = 'xy' if two else 'x'
    y2 = 'y^2' if two else ''
    y4 = 'y^4' if two else ''
    Bt = (_mono(B, 'y^2') if two else str(B))
    tex = f'{_mono(A * A, "x^4")}+' + (_mono(B * B, y4) if two else str(B * B))
    kv = f'{_mono(A, "x^2")}+{Bt}'
    return Zadacha(
        tip=TIP, uroven=3, podtip='polnyi-kvadrat',
        uslovie='Разложите на множители', formula=tex,
        otvet=otvet_vyrazhenie(ans, pts, forma=FORMA),
        razbor=[
            Shag(f'Слагаемые — квадраты: ${_mono(A * A, "x^4")}=({_mono(A, "x^2")})^2$, '
                 f'${(_mono(B * B, y4) if two else B * B)}=({Bt})^2$. Дополняем до квадрата суммы: '
                 f'добавляем и вычитаем удвоенное произведение ${2 * A * B}x^2{y2}$',
                 f'{tex}=({kv})^2-{2 * A * B}x^2{y2}'),
            Shag(f'Вычитаемое — тоже полный квадрат: ${2 * A * B}x^2{y2}=({s_}{xv})^2$; '
                 'применяем формулу разности квадратов',
                 f'({kv})^2-({s_}{xv})^2=({kv}-{s_}{xv})({kv}+{s_}{xv})'),
            Shag('Каждый трёхчлен дальше не раскладывается: дискриминант по $x$ отрицателен',
                 f'{tex}=({_mono(A, "x^2")}-{s_}{xv}+{Bt})({_mono(A, "x^2")}+{s_}{xv}+{Bt})'),
        ],
        podskazki=[
            'Квадратами каких выражений являются слагаемые?',
            'Чего не хватает до квадрата суммы? Что, если его прибавить и вычесть?',
            'Является ли вычитаемое полным квадратом? Какая формула тогда применима?',
        ],
        iskhod=E,
        klyuch=f'sf:{A}:{B}:{int(two)}',
    )


# ── x⁸: (hx² ± ax + g)(hx² ± cx + g), 4hg = a² + c² ───────────────────

VOSEM = [(1, 5, 2, 4), (5, 1, 2, 4), (1, 10, 2, 6), (2, 5, 2, 6), (5, 2, 2, 6), (10, 1, 2, 6), (5, 5, 6, 8)]


def _tri(h, mid_sign, mid, g, two) -> str:
    """hx² ± mid·x(y) + g(y²)."""
    xs = 'xy' if two else 'x'
    gs = _mono(g, 'y^2') if two else str(g)
    return f'{_mono(h, "x^2")}{mid_sign}{_mono(mid, xs)}+{gs}'


def s_vosem(rng: random.Random) -> Zadacha:
    h, g, a_, c_ = pick(rng, VOSEM)
    two = rng.random() < 0.5
    X = SYM['x']
    Y = SYM['y'] if two else sp.Integer(1)
    M = a_ * a_ * c_ * c_ - 2 * h * h * g * g
    E = h**4 * X**8 + M * X**4 * Y**4 + g**4 * Y**8
    ans = sp.factor(E)
    pts = _pts(E, [X] + ([Y] if two else []), rng)
    K = (c_ * c_ - a_ * a_) // 2
    y4, y8, y2 = ('y^4', 'y^8', 'y^2') if two else ('', '', '')
    mid = '' if M == 0 else (f'+{M}x^4{y4}' if M > 0 else f'-{-M}x^4{y4}')
    tex = f'{_mono(h ** 4, "x^8")}{mid}+' + (_mono(g**4, y8) if two else str(g**4))
    sq = f'{_mono(h * h, "x^4")}+' + (_mono(g * g, y4) if two else str(g * g))
    lin2 = f'{_mono(h, "x^2")}+' + (_mono(g, y2) if two else str(g))
    xs = 'xy' if two else 'x'
    x2y2 = f'x^2{y2}'
    raz = 2 * h * h * g * g - M
    return Zadacha(
        tip=TIP, uroven=3, podtip='vosmaya-stepen',
        uslovie='Разложите многочлен в произведение квадратных трёхчленов', formula=tex,
        otvet=otvet_vyrazhenie(ans, pts, forma=FORMA),
        razbor=[
            Shag('Крайние слагаемые — квадраты; выделяем квадрат суммы, недостающее вычитаем',
                 f'{tex}=({sq})^2-{raz}x^4{y4}'),
            Shag(f'${raz}x^4{y4}=({K}{x2y2})^2$ — полный квадрат; раскладываем разность квадратов',
                 f'({sq}-{K}{x2y2})({sq}+{K}{x2y2})'),
            Shag(f'Каждый множитель снова дополняем до квадрата $({lin2})^2$, в котором средний член '
                 f'${_mono(2 * h * g, x2y2)}$',
                 f'{sq}-{K}{x2y2}=({lin2})^2-({_mono(c_, xs)})^2,\\quad '
                 f'{sq}+{K}{x2y2}=({lin2})^2-({_mono(a_, xs)})^2'),
            Shag('Ещё раз применяем разность квадратов; у полученных трёхчленов дискриминант отрицателен',
                 f'{tex}=({_tri(h, "-", a_, g, two)})({_tri(h, "+", a_, g, two)})'
                 f'({_tri(h, "-", c_, g, two)})({_tri(h, "+", c_, g, two)})'),
        ],
        podskazki=[
            'Квадратом какого выражения дополняются крайние слагаемые?',
            'Является ли недостающая часть полным квадратом?',
            'Можно ли каждый из двух множителей четвёртой степени снова дополнить до полного квадрата?',
        ],
        iskhod=E,
        klyuch=f'vs:{h}:{g}:{a_}:{int(two)}',
    )


# ── Кубы: (u+v)³ − u³ − v³ = 3uv(u+v) ─────────────────────────────────


def _lin_tex(cfs: dict) -> str:
    out = ''
    for nm, cf in cfs.items():
        if cf == 0:
            continue
        mag = '' if abs(cf) == 1 else str(abs(cf))
        sign = '-' if cf < 0 else ('+' if out else '')
        out += f'{sign}{mag}{nm}'
    return out


def s_kuby(rng: random.Random) -> Zadacha:
    names = pick(rng, BUKVY)
    na, nb, nc = names
    A, B, C = (SYM[nm] for nm in names)
    # u = α·a + β·b, v = −β·b + γ·c (b сокращается в u + v) или u, v от двух букв
    al = pick(rng, [1, 2, 3])
    be = pick(rng, [-1, -2, -3])
    ga = pick(rng, [1, 2, 3, -1, -2])
    if (al, be, ga) == (1, 1, 1):
        return None
    u = {na: al, nb: be, nc: 0}
    v = {na: 0, nb: -be, nc: ga}
    w = {na: al, nb: 0, nc: ga}
    U = al * A + be * B
    Vv = -be * B + ga * C
    E = (U + Vv)**3 - U**3 - Vv**3
    ans = sp.factor(sp.expand(E))
    ut, vt, wt = _lin_tex(u), _lin_tex(v), _lin_tex(w)
    poryadok = rng.random() < 0.5
    if poryadok:
        tex = f'({wt})^3-({ut})^3-({vt})^3'
    else:
        tex = f'-({ut})^3+({wt})^3-({vt})^3'
    return Zadacha(
        tip=TIP, uroven=3, podtip='kuby',
        uslovie='Разложите на множители', formula=tex,
        otvet=otvet_vyrazhenie(ans, _pts(E, (A, B, C), rng), forma=FORMA),
        razbor=[
            Shag(f'Обозначим $u={ut}$, $v={vt}$; тогда $u+v={wt}$, и выражение имеет вид',
                 '(u+v)^3-u^3-v^3'),
            Shag('Раскрываем куб суммы: кубы сокращаются, остаётся $3u^2v+3uv^2$',
                 '(u+v)^3-u^3-v^3=3u^2v+3uv^2=3uv(u+v)'),
            Shag('Возвращаемся к исходным буквам', f'{tex}=3({ut})({vt})({wt})'),
        ],
        podskazki=[
            'Как связаны между собой основания трёх кубов?',
            'Что останется от $(u+v)^3$, если вычесть $u^3$ и $v^3$?',
            'Какой общий множитель можно вынести из $3u^2v+3uv^2$?',
        ],
        iskhod=E,
        klyuch=f'ku:{al}:{be}:{ga}',
    )


PODTIPY = [s_krug, s_sofi, s_vosem, s_kuby]

_schet = [0]


def generator(rng: random.Random) -> Zadacha | None:
    gen = PODTIPY[_schet[0] % len(PODTIPY)]
    _schet[0] += 1
    return gen(rng)
