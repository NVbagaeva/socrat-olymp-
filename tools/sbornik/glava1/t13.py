"""
Тип 1.13. Упростить выражение и самому найти область определения:
вложенные корни √(x ± 2k√(x − k²)), дробные степени, модули,
многоэтажные дроби. Ответ — кусочный на всей ОДЗ. Уровень ★★★.
"""

from __future__ import annotations

import random

import sympy as sp

from ..core import (
    L, Shag, Zadacha, interval_tex, lin, num_tex, otvet_kusochnyi, pick, poly_tex,
    t, x, z,
)

TIP = '1.13'


# ── Общие помощники ──────────────────────────────────────────────────


def intervaly(lo, lo_closed: bool, tochki) -> list[tuple]:
    """
    Промежутки ОДЗ от lo до +∞. tochki — [(значение, 'cut' | 'excl')]:
    'cut' — граница кусков, сама точка входит в левый кусок;
    'excl' — выколотая точка.
    """
    res = []
    cur, cur_c = lo, lo_closed
    for val, kind in sorted(set(tochki), key=lambda tk: float(tk[0])):
        res.append((cur, val, cur_c, kind == 'cut'))
        cur, cur_c = val, False
    res.append((cur, sp.oo, cur_c, False))
    return res


def odz_tex(lo, lo_closed: bool, excl) -> str:
    """ОДЗ как объединение промежутков (только выколотые точки)."""
    pts = sorted(set(excl), key=float)
    parts = []
    cur, cur_c = lo, lo_closed
    for val in pts:
        parts.append(interval_tex(cur, val, cur_c, False))
        cur, cur_c = val, False
    parts.append(interval_tex(cur, sp.oo, cur_c, False))
    return '\\cup'.join(parts)


def _tochka(lo, hi):
    if lo == -sp.oo and hi == sp.oo:
        return sp.Integer(1)
    if lo == -sp.oo:
        return hi - 1
    if hi == sp.oo:
        return lo + 1
    return (lo + hi) / 2


def raskryt(U, lo, hi, var):
    """Раскрыть все модули в U по знаку подмодульных выражений на (lo; hi)."""
    pt = _tochka(lo, hi)

    def zamena(e):
        arg = e.args[0]
        return arg if sp.N(arg.subs(var, pt)) > 0 else -arg

    return U.replace(lambda e: isinstance(e, sp.Abs), zamena)


def kuski_iz(U, src, var, intervals, simp=None):
    simp = simp or (lambda e: sp.factor(sp.together(e)))
    return [(lo, hi, lc, hc, simp(raskryt(U, lo, hi, var)), src) for lo, hi, lc, hc in intervals]


def krasivo(e):
    """−A/(x−b) → A/(b−x): минус переносим в двучлен знаменателя."""
    n, d = sp.fraction(sp.together(e))
    if d == 1:
        return sp.expand(e)
    if not n.could_extract_minus_sign():
        return e
    for f in sp.Mul.make_args(d):
        if f.is_Add and _minusov(-f) <= _minusov(f):
            return sp.Mul(-n, sp.Pow(sp.Mul(d / f, sp.expand(-f)), -1))
    if n.is_Mul:
        for f in n.args:
            if f.is_Add and _minusov(-f) < _minusov(f):
                return sp.Mul(sp.cancel(-n / f), sp.expand(-f), sp.Pow(d, -1))
    if n.is_Add:
        return sp.Mul(-1, sp.expand(-n), sp.Pow(d, -1))
    return e


def _minusov(f) -> int:
    return sum(1 for a_ in sp.Add.make_args(sp.expand(f)) if a_.could_extract_minus_sign())


def oformit(kuski):
    return [(lo, hi, lc, hc, krasivo(e), src) for lo, hi, lc, hc, e, src in kuski]


def cases_tex(var, kuski) -> str:
    kuski = oformit(kuski)
    rows = [f'{L(e)}, & {var.name}\\in{interval_tex(lo, hi, lc, hc)}' for lo, hi, lc, hc, e, _ in kuski]
    return '\\begin{cases}' + '\\\\ '.join(rows) + '\\end{cases}'


def uslovie_odz(rng, var) -> str:
    return pick(rng, [
        'Упростите выражение и укажите, при каких значениях переменной оно определено',
        f'Упростите выражение и укажите, при каких значениях ${var.name}$ оно имеет смысл',
        'Упростите выражение; найдите, при каких значениях переменной оно определено',
    ])


def otvet(var, kuski, rng):
    return otvet_kusochnyi(var, oformit(kuski), seed=rng.randint(0, 10**6))


# ── Вложенные корни √(v ± K√(pv − k²)) = |s ± k|/√p, s = √(pv − k²) ──

VLOZH = [(1, kk) for kk in range(2, 5)] + [(2, 3), (2, 5)]


class Vlozh:
    def __init__(self, p: int, k: int, var):
        self.p, self.k, self.v = p, k, var
        self.s = sp.sqrt(p * var - k * k)
        self.K = 2 * k // p
        self.x0 = sp.Rational(k * k, p)
        self.xb = sp.Rational(2 * k * k, p)
        vn = var.name
        self.inner = f'{"" if p == 1 else p}{vn}-{k * k}'
        self.s_tex = f'\\sqrt{{{self.inner}}}'
        cf = '' if self.K == 1 else str(self.K)
        self.plus_tex = f'{vn}+{cf}\\sqrt{{{self.inner}}}'
        self.minus_tex = f'{vn}-{cf}\\sqrt{{{self.inner}}}'
        self.Ap = var + self.K * self.s
        self.Am = var - self.K * self.s

    def kv_tex(self) -> str:
        """x ± K s = (s ± k)²/p."""
        vn, k, p = self.v.name, self.k, self.p
        cf = '' if self.K == 1 else str(self.K)
        right = f'(s\\pm{k})^2' if p == 1 else f'\\frac{{(s\\pm{k})^2}}{{{p}}}'
        return f'{vn}=\\frac{{s^2+{k * k}}}{{{p}}},\\quad {vn}\\pm{cf}s={right}' if p != 1 else \
            f'{vn}=s^2+{k * k},\\quad {vn}\\pm{cf}s={right}'

    def koren_tex(self) -> str:
        k, p = self.k, self.p
        if p == 1:
            return f'\\sqrt{{{self.plus_tex}}}=s+{k},\\quad \\sqrt{{{self.minus_tex}}}=|s-{k}|'
        return (f'\\sqrt{{{self.plus_tex}}}=\\frac{{s+{k}}}{{\\sqrt{{{p}}}}},\\quad '
                f'\\sqrt{{{self.minus_tex}}}=\\frac{{|s-{k}|}}{{\\sqrt{{{p}}}}}')

    def oboznach(self) -> str:
        return f'Обозначим $s={self.s_tex}\\ge0$ и выразим ${self.v.name}$ через $s$: подкоренные выражения — полные квадраты'


def s_vlozh_drob(rng: random.Random) -> Zadacha:
    """(√A₊ ± √A₋)/√(1 − 2m/x + m²/x²)."""
    p, k = pick(rng, VLOZH)
    V = Vlozh(p, k, x)
    sig = pick(rng, [1, -1])
    lo_m = int(sp.ceiling(V.x0))
    m = rng.randint(lo_m, int(V.xb) + 4)
    if m == 0 or 0 < abs(m - V.xb) < 2 or 0 < m - V.x0 < 2:
        return None
    s = V.s
    num = sp.sqrt(V.Ap) + sig * sp.sqrt(V.Am)
    den = sp.sqrt(1 - 2 * m / x + sp.Integer(m * m) / x**2)
    src = num / den
    U = (s + k + sig * sp.Abs(s - k)) * x / (sp.sqrt(p) * sp.Abs(x - m))
    lo_closed = m != V.x0
    tochki = [(sp.Integer(m), 'excl')] if m != V.x0 else []
    if V.xb != m:
        tochki.append((V.xb, 'cut'))
    ints = intervaly(V.x0, lo_closed, tochki)
    kuski = kuski_iz(U, src, x, ints, simp=lambda e: sp.factor(sp.together(sp.simplify(e))))
    zn = '+' if sig > 0 else '-'
    formula = (f'\\frac{{\\sqrt{{{V.plus_tex}}}{zn}\\sqrt{{{V.minus_tex}}}}}'
               f'{{\\sqrt{{1-\\frac{{{2 * m}}}{{x}}+\\frac{{{m * m}}}{{x^2}}}}}}')
    small = L(sp.Integer(2 * k) / sp.sqrt(p))
    big = L(2 * s / sp.sqrt(p))
    xb = num_tex(V.xb)
    if sig > 0:
        chis = f'{small}\\ \\text{{при}}\\ x\\le{xb},\\qquad {big}\\ \\text{{при}}\\ x\\ge{xb}'
    else:
        chis = f'{big}\\ \\text{{при}}\\ x\\le{xb},\\qquad {small}\\ \\text{{при}}\\ x\\ge{xb}'
    return Zadacha(
        tip=TIP, uroven=3, podtip='vlozh-drob',
        uslovie=uslovie_odz(rng, x), formula=formula,
        otvet=otvet(x, kuski, rng),
        razbor=[
            Shag(f'ОДЗ: ${V.inner}\\ge0$, $x\\ne0$, знаменатель не равен нулю. '
                 f'Под корнем в знаменателе $\\left(1-\\frac{{{m}}}{{x}}\\right)^2$, он равен нулю при $x={m}$',
                 f'x\\in{odz_tex(V.x0, lo_closed, [m] if m != V.x0 else [])}'),
            Shag(V.oboznach(), V.kv_tex() + '\\\\ ' + V.koren_tex()),
            Shag('Знаменатель: корень из квадрата — модуль, а на ОДЗ $x>0$',
                 f'\\sqrt{{\\left(1-\\frac{{{m}}}{{x}}\\right)^2}}=\\frac{{|x-{m}|}}{{x}}'),
            Shag(f'Раскрываем $|s-{k}|$: $s\\ge{k}$ при $x\\ge{xb}$. Числитель равен', chis),
            Shag(f'Делим на $\\frac{{|x-{m}|}}{{x}}$ и раскрываем модуль на каждом промежутке ОДЗ',
                 cases_tex(x, kuski)),
        ],
        podskazki=[
            'Какие ограничения дают корни и знаменатель?',
            f'Что получится, если обозначить ${V.s_tex}=s$ и выразить $x$ через $s$?',
            f'Полным квадратом какого выражения является $1-\\frac{{{2 * m}}}{{x}}+\\frac{{{m * m}}}{{x^2}}$?',
            f'Где меняет знак $s-{k}$, а где — $x-{m}$?',
        ],
        iskhod=src,
        klyuch=f'vd:{p}:{k}:{m}:{sig}',
    )


def s_vlozh_stepen(rng: random.Random) -> Zadacha:
    """A₊^(−1/2) ± A₋^(−1/2)."""
    p, k = pick(rng, VLOZH)
    V = Vlozh(p, k, x)
    sig = pick(rng, [1, -1])
    h = sp.Rational(-1, 2)
    src = V.Ap**h + sig * V.Am**h
    s = V.s
    rp = sp.sqrt(p)
    # k² − s² = p(xb − x)
    if sig > 0:
        lev, prav = 2 * k / (rp * (V.xb - x)), 2 * s / (rp * (x - V.xb))
    else:
        lev, prav = -2 * s / (rp * (V.xb - x)), -2 * k / (rp * (x - V.xb))
    ints = intervaly(V.x0, True, [(V.xb, 'excl')])
    kuski = [(*ints[0], lev, src), (*ints[1], prav, src)]
    zn = '+' if sig > 0 else '-'
    pw = '^{-\\frac{1}{2}}'
    formula = f'\\left({V.plus_tex}\\right){pw}{zn}\\left({V.minus_tex}\\right){pw}'
    xb = num_tex(V.xb)
    cp = '' if p == 1 else f'\\sqrt{{{p}}}'
    vstep = (f'\\left({V.plus_tex}\\right){pw}=\\frac{{{cp or 1}}}{{s+{k}}},\\quad '
             f'\\left({V.minus_tex}\\right){pw}=\\frac{{{cp or 1}}}{{|s-{k}|}}')
    if sig > 0:
        mal = f'\\frac{{1}}{{s+{k}}}+\\frac{{1}}{{{k}-s}}=\\frac{{{2 * k}}}{{{k * k}-s^2}}'
        bol = f'\\frac{{1}}{{s+{k}}}+\\frac{{1}}{{s-{k}}}=\\frac{{2s}}{{s^2-{k * k}}}'
    else:
        mal = f'\\frac{{1}}{{s+{k}}}-\\frac{{1}}{{{k}-s}}=\\frac{{-2s}}{{{k * k}-s^2}}'
        bol = f'\\frac{{1}}{{s+{k}}}-\\frac{{1}}{{s-{k}}}=\\frac{{-{2 * k}}}{{s^2-{k * k}}}'
    return Zadacha(
        tip=TIP, uroven=3, podtip='vlozh-stepen',
        uslovie=uslovie_odz(rng, x), formula=formula,
        otvet=otvet(x, kuski, rng),
        razbor=[
            Shag(f'ОДЗ: ${V.inner}\\ge0$, а основания степеней с показателем $-\\frac12$ должны быть положительны. '
                 f'Ниже увидим, что ${V.minus_tex}=' + (f'(s-{k})^2' if p == 1 else f'\\frac{{(s-{k})^2}}{{{p}}}')
                 + f'$, где $s={V.s_tex}$: оно обращается в ноль при $x={xb}$',
                 f'x\\in{odz_tex(V.x0, True, [V.xb])}'),
            Shag(V.oboznach(), V.kv_tex()),
            Shag('Степень $-\\frac12$ — это единица, делённая на арифметический корень', vstep),
            Shag(f'Раскрываем $|s-{k}|$: при $s<{k}$ и при $s>{k}$' + (f' и выносим $\\sqrt{{{p}}}$' if p != 1 else ''),
                 f's<{k}:\\ {mal};\\qquad s>{k}:\\ {bol}'),
            Shag(f'Возвращаемся к $x$: $s^2={V.inner}$, $s<{k}$ при $x<{xb}$', cases_tex(x, kuski)),
        ],
        podskazki=[
            'При каком условии определена степень с показателем $-\\frac12$?',
            f'Как выразить $x$ через $s={V.s_tex}$?',
            'Квадратами каких выражений оказываются основания степеней?',
            f'Какой знак у $s-{k}$ на каждом промежутке?',
        ],
        iskhod=src,
        klyuch=f'vs:{p}:{k}:{sig}',
    )


def s_vlozh_otnoshenie(rng: random.Random) -> Zadacha:
    """(√A₊ + √A₋)/(√A₊ − √A₋) или обратная дробь, иногда умноженная на s."""
    p, k = pick(rng, VLOZH)
    var = t
    V = Vlozh(p, k, var)
    inv = rng.random() < 0.5
    mult = rng.random() < 0.5
    s = V.s
    sp_, sm = sp.sqrt(V.Ap), sp.sqrt(V.Am)
    R = (sp_ - sm) / (sp_ + sm) if inv else (sp_ + sm) / (sp_ - sm)
    src = R * s if mult else R
    small, big = (s / k, k / s) if inv else (k / s, s / k)
    if mult:
        small, big = sp.expand(small * s), sp.expand(big * s)
    lo_closed = inv
    ints = intervaly(V.x0, lo_closed, [(V.xb, 'cut')])
    kuski = [(*ints[0], small, src), (*ints[1], big, src)]
    vn = var.name
    num_t = f'\\sqrt{{{V.plus_tex}}}+\\sqrt{{{V.minus_tex}}}'
    den_t = f'\\sqrt{{{V.plus_tex}}}-\\sqrt{{{V.minus_tex}}}'
    if inv:
        num_t, den_t = den_t, num_t
    formula = f'\\frac{{{num_t}}}{{{den_t}}}' + (f'\\cdot{V.s_tex}' if mult else '')
    xb = num_tex(V.xb)
    if inv:
        odz_chto = (f'ОДЗ: ${V.inner}\\ge0$; оба подкоренных выражения неотрицательны (ниже это видно), '
                    'а знаменатель — сумма корней — обращается в ноль, только если оба корня равны нулю, чего не бывает')
        mal = f'\\frac{{(s+{k})-({k}-s)}}{{(s+{k})+({k}-s)}}=\\frac{{s}}{{{k}}}'
        bol = f'\\frac{{(s+{k})-(s-{k})}}{{(s+{k})+(s-{k})}}=\\frac{{{k}}}{{s}}'
    else:
        odz_chto = (f'ОДЗ: ${V.inner}\\ge0$ и знаменатель не ноль: корни равны, только когда '
                    f'${V.plus_tex}={V.minus_tex}$, то есть $s={V.s_tex}=0$, $' + f'{vn}={num_tex(V.x0)}$')
        mal = f'\\frac{{(s+{k})+({k}-s)}}{{(s+{k})-({k}-s)}}=\\frac{{{k}}}{{s}}'
        bol = f'\\frac{{(s+{k})+(s-{k})}}{{(s+{k})-(s-{k})}}=\\frac{{s}}{{{k}}}'
    shagi = [
        Shag(odz_chto, f'{vn}\\in{interval_tex(V.x0, sp.oo, lo_closed, False)}'),
        Shag(V.oboznach(), V.kv_tex() + '\\\\ ' + V.koren_tex()),
        Shag(f'Подставляем' + (f' (множитель $\\frac{{1}}{{\\sqrt{{{p}}}}}$ сокращается)' if p != 1 else '')
             + f' и раскрываем $|s-{k}|$: $s\\le{k}$ при ${vn}\\le{xb}$',
             f's\\le{k}:\\ {mal};\\qquad s>{k}:\\ {bol}'),
    ]
    if mult:
        shagi.append(Shag(f'Умножаем на $s$ и учитываем, что $s^2={V.inner}$', cases_tex(var, kuski)))
    else:
        shagi.append(Shag(f'Возвращаемся к ${vn}$', cases_tex(var, kuski)))
    return Zadacha(
        tip=TIP, uroven=3, podtip='vlozh-otnoshenie',
        uslovie=uslovie_odz(rng, var), formula=formula,
        otvet=otvet(var, kuski, rng),
        razbor=shagi,
        podskazki=[
            'Когда знаменатель дроби обращается в ноль?',
            f'Что получится под корнями, если обозначить ${V.s_tex}=s$?',
            f'Чему равен $|s-{k}|$ при $s\\le{k}$ и при $s>{k}$?',
        ],
        iskhod=src,
        klyuch=f'vo:{p}:{k}:{int(inv)}:{int(mult)}',
    )


# ── Модули из полных квадратов в дробях ──────────────────────────────


def s_modul_kvadraty(rng: random.Random) -> Zadacha:
    """√(((x²−c²)/(cx))² + 4) ± √(1 + 2d/x + d²/x²)."""
    c = pick(rng, [1, 3, 4, 5])
    d = pick(rng, [v for v in range(-6, 7) if v != 0])
    sig = pick(rng, [1, -1])
    src = (sp.sqrt(((x**2 - c * c) / (c * x))**2 + 4)
           + sig * sp.sqrt(1 + sp.Integer(2 * d) / x + sp.Integer(d * d) / x**2))
    U = (x**2 + c * c) / (c * sp.Abs(x)) + sig * sp.Abs(x + d) / sp.Abs(x)
    ints = intervaly(-sp.oo, False, [(sp.Integer(0), 'excl'), (sp.Integer(-d), 'cut')])
    kuski = kuski_iz(U, src, x, ints)
    cx = 'x' if c == 1 else f'{c}x'
    first = f'\\sqrt{{\\left(\\frac{{x^2-{c * c}}}{{{cx}}}\\right)^2+4}}'
    second = (f'\\sqrt{{1{"+" if d > 0 else "-"}\\frac{{{2 * abs(d)}}}{{x}}+\\frac{{{d * d}}}{{x^2}}}}')
    formula = first + ('+' if sig > 0 else '-') + second
    cc = '' if c == 1 else str(c * c)
    return Zadacha(
        tip=TIP, uroven=3, podtip='modul-kvadraty',
        uslovie=uslovie_odz(rng, x), formula=formula,
        otvet=otvet(x, kuski, rng),
        razbor=[
            Shag('ОДЗ: $x\\ne0$. Первое подкоренное выражение не меньше $4$, второе — квадрат '
                 f'$\\left(1{"+" if d > 0 else "-"}\\frac{{{abs(d)}}}{{x}}\\right)^2\\ge0$, так что других ограничений нет',
                 f'x\\in{odz_tex(-sp.oo, False, [0])}'),
            Shag('Первое подкоренное выражение приводим к общему знаменателю — в числителе полный квадрат',
                 f'\\frac{{(x^2-{c * c})^2+{4 * c * c}x^2}}{{{cc}x^2}}=\\frac{{(x^2+{c * c})^2}}{{{cc}x^2}}'
                 f'\\ \\Rightarrow\\ \\sqrt{{\\ldots}}=\\frac{{x^2+{c * c}}}{{{"" if c == 1 else c}|x|}}'),
            Shag('Второе — квадрат двучлена, корень из квадрата равен модулю',
                 f'\\sqrt{{\\left(\\frac{{{lin("x", d)}}}{{x}}\\right)^2}}=\\frac{{|{lin("x", d)}|}}{{|x|}}'),
            Shag(f'Точки $x=0$ и $x={-d}$ делят ОДЗ на промежутки; раскрываем модули на каждом и приводим к общему знаменателю',
                 cases_tex(x, kuski)),
        ],
        podskazki=[
            'Какие значения $x$ запрещены? Могут ли подкоренные выражения быть отрицательными?',
            f'Что получится в числителе, если раскрыть $(x^2-{c * c})^2+{4 * c * c}x^2$?',
            'Чему равен $\\sqrt{A^2}$?',
            'На какие промежутки делят ось нули подмодульных выражений?',
        ],
        iskhod=src,
        klyuch=f'mk:{c}:{d}:{sig}',
    )


def s_chetvertaya(rng: random.Random) -> Zadacha:
    """((z² + c²/z²)² − 4c(z + c/z)² + 12c²)^(1/4), делённое на что-то или умноженное на z."""
    rezhim = pick(rng, ['lin', 'kv', 'umn'])
    if rezhim == 'lin':
        c = pick(rng, [4, 9])
        r = int(sp.sqrt(c))
        eps = pick(rng, [1, -1])
    elif rezhim == 'kv':
        c = pick(rng, [2, 3, 5, 6, 7])
    else:
        c = pick(rng, [2, 3, 4, 5, 9])
    rc = sp.sqrt(c)
    inner = (z**2 + sp.Integer(c * c) / z**2)**2 - 4 * c * (z + sp.Integer(c) / z)**2 + 12 * c * c
    root4 = inner**sp.Rational(1, 4)
    modz = sp.Abs(z**2 - c) / sp.Abs(z)
    inner_tex = (f'\\left(\\left(z^2+\\frac{{{c * c}}}{{z^2}}\\right)^2-{4 * c}\\left(z+\\frac{{{c}}}{{z}}\\right)^2'
                 f'+{12 * c * c}\\right)^{{\\frac{{1}}{{4}}}}')
    if rezhim == 'lin':
        delit = z - eps * r
        src, U = root4 / delit, modz / delit
        excl = [0, eps * r]
        tochki = [(sp.Integer(0), 'excl'), (sp.Integer(eps * r), 'excl'), (sp.Integer(-eps * r), 'cut')]
        formula = f'{inner_tex}:({lin("z", -eps * r)})'
        odz_dop = f', $z\\ne{eps * r}$ (делитель)'
    elif rezhim == 'kv':
        delit = z**2 - c
        src, U = root4 / delit, modz / delit
        excl = [0, rc, -rc]
        tochki = [(sp.Integer(0), 'excl'), (rc, 'excl'), (-rc, 'excl')]
        formula = f'\\frac{{{inner_tex}}}{{z^2-{c}}}'
        odz_dop = f', $z\\ne\\pm\\sqrt{{{c}}}$ (знаменатель)'
    else:
        src, U = root4 * z, modz * z
        excl = [0]
        tochki = [(sp.Integer(0), 'excl'), (rc, 'cut'), (-rc, 'cut')]
        formula = f'z\\cdot{inner_tex}'
        odz_dop = ''
    excl = [sp.sympify(e) for e in excl]
    ints = intervaly(-sp.oo, False, tochki)
    kuski = kuski_iz(U, src, z, ints)
    return Zadacha(
        tip=TIP, uroven=3, podtip='chetvertaya-stepen',
        uslovie=uslovie_odz(rng, z), formula=formula,
        otvet=otvet(z, kuski, rng),
        razbor=[
            Shag(f'ОДЗ: $z\\ne0${odz_dop}; кроме того, под корнем чётной степени должно быть неотрицательное '
                 'выражение — ниже увидим, что это четвёртая степень, так что других ограничений нет',
                 f'z\\in{odz_tex(-sp.oo, False, excl)}'),
            Shag(f'Обозначим $w=z+\\frac{{{c}}}{{z}}$; тогда $z^2+\\frac{{{c * c}}}{{z^2}}=w^2-{2 * c}$',
                 f'(w^2-{2 * c})^2-{4 * c}w^2+{12 * c * c}=w^4-{8 * c}w^2+{16 * c * c}=(w^2-{4 * c})^2'),
            Shag(f'Но $w^2-{4 * c}=\\left(z-\\frac{{{c}}}{{z}}\\right)^2$, значит, под корнем четвёртая степень',
                 f'\\left(\\left(z-\\frac{{{c}}}{{z}}\\right)^4\\right)^{{\\frac{{1}}{{4}}}}'
                 f'=\\left|z-\\frac{{{c}}}{{z}}\\right|=\\frac{{|z^2-{c}|}}{{|z|}}'),
            Shag('Раскрываем модули на промежутках ОДЗ и упрощаем', cases_tex(z, kuski)),
        ],
        podskazki=[
            'Какие значения $z$ сразу запрещены?',
            f'Как выразить $z^2+\\frac{{{c * c}}}{{z^2}}$ через $w=z+\\frac{{{c}}}{{z}}$?',
            f'Полным квадратом какого выражения является $w^2-{4 * c}$?',
            'Чему равен корень четвёртой степени из четвёртой степени?',
        ],
        iskhod=src,
        klyuch=f'ch:{rezhim}:{c}:{eps if rezhim == "lin" else 0}',
    )


def _kv_tex(c: int, sgn: int) -> str:
    """x² ± cx + c²."""
    cx = 'x' if c == 1 else f'{c}x'
    return f'x^2{"+" if sgn > 0 else "-"}{cx}+{c * c}'


def s_drob_kuby(rng: random.Random) -> Zadacha:
    """(F1 : F2)^(∓1/2), F1 : F2 = x²/(x ± c)²."""
    c = rng.randint(1, 6)
    tau = pick(rng, [1, -1])
    h = pick(rng, [sp.Rational(-1, 2), sp.Rational(1, 2)])
    if c == 1 and tau == 1 and h < 0:
        return None
    C3 = c**3
    if tau == 1:
        F1 = (x**3 - C3) / (x + c) * x / (x**3 + C3)
        F2 = ((x + c)**2 - c * x) / ((x - c)**2 + c * x) * (1 - sp.Integer(c) / x)
    else:
        F1 = (x**3 + C3) / (x - c) * x / (x**3 - C3)
        F2 = ((x - c)**2 + c * x) / ((x + c)**2 - c * x) * (1 + sp.Integer(c) / x)
    src = (F1 / F2)**h
    xc = lin('x', tau * c)
    U = sp.Abs(x + tau * c) / sp.Abs(x)
    if h > 0:
        U = 1 / U
    excl = [sp.Integer(-c), sp.Integer(0), sp.Integer(c)]
    ints = intervaly(-sp.oo, False, [(e, 'excl') for e in excl])
    kuski = kuski_iz(U, src, x, ints)
    cx = 'x' if c == 1 else f'{c}x'
    pl, mi = _kv_tex(c, 1), _kv_tex(c, -1)
    if tau == 1:
        f1 = f'\\frac{{x^3-{C3}}}{{{lin("x", c)}}}\\cdot\\frac{{x}}{{x^3+{C3}}}'
        f2 = (f'\\frac{{({lin("x", c)})^2-{cx}}}{{({lin("x", -c)})^2+{cx}}}'
              f'\\cdot\\left(1-\\frac{{{c}}}{{x}}\\right)')
        razl = (f'x^3-{C3}=({lin("x", -c)})({pl}),\\quad x^3+{C3}=({lin("x", c)})({mi}),\\\\ '
                f'({lin("x", c)})^2-{cx}={pl},\\quad ({lin("x", -c)})^2+{cx}={mi}')
        delen = (f'\\frac{{({lin("x", -c)})({pl})\\,x}}{{({lin("x", c)})^2({mi})}}\\cdot'
                 f'\\frac{{({mi})\\,x}}{{({pl})({lin("x", -c)})}}=\\frac{{x^2}}{{({xc})^2}}')
        zap = f'знаменатели $x{"+"}{c}$, $x^3+{C3}$, $x$ не равны нулю, а делитель обращается в ноль при $1-\\frac{{{c}}}{{x}}=0$'
    else:
        f1 = f'\\frac{{x^3+{C3}}}{{{lin("x", -c)}}}\\cdot\\frac{{x}}{{x^3-{C3}}}'
        f2 = (f'\\frac{{({lin("x", -c)})^2+{cx}}}{{({lin("x", c)})^2-{cx}}}'
              f'\\cdot\\left(1+\\frac{{{c}}}{{x}}\\right)')
        razl = (f'x^3+{C3}=({lin("x", c)})({mi}),\\quad x^3-{C3}=({lin("x", -c)})({pl}),\\\\ '
                f'({lin("x", -c)})^2+{cx}={mi},\\quad ({lin("x", c)})^2-{cx}={pl}')
        delen = (f'\\frac{{({lin("x", c)})({mi})\\,x}}{{({lin("x", -c)})^2({pl})}}\\cdot'
                 f'\\frac{{({pl})\\,x}}{{({mi})({lin("x", c)})}}=\\frac{{x^2}}{{({xc})^2}}')
        zap = f'знаменатели $x-{c}$, $x^3-{C3}$, $x$ не равны нулю, а делитель обращается в ноль при $1+\\frac{{{c}}}{{x}}=0$'
    pw = '-\\frac{1}{2}' if h < 0 else '\\frac{1}{2}'
    formula = f'\\left(\\frac{{{f1}}}{{{f2}}}\\right)^{{{pw}}}'
    stepen = (f'\\left(\\frac{{x^2}}{{({xc})^2}}\\right)^{{{pw}}}='
              + (f'\\frac{{|{xc}|}}{{|x|}}' if h < 0 else f'\\frac{{|x|}}{{|{xc}|}}'))
    return Zadacha(
        tip=TIP, uroven=3, podtip='drob-kuby',
        uslovie=uslovie_odz(rng, x), formula=formula,
        otvet=otvet(x, kuski, rng),
        razbor=[
            Shag(f'ОДЗ: {zap}; трёхчлены ${pl}$ и ${mi}$ положительны. '
                 'Основание степени окажется квадратом, отличным от нуля, — других ограничений нет',
                 f'x\\in{odz_tex(-sp.oo, False, excl)}'),
            Shag('Раскладываем на множители сумму и разность кубов; выражения со скобками в квадрате — это неполные квадраты',
                 razl),
            Shag('Деление заменяем умножением на перевёрнутую дробь и сокращаем', delen),
            Shag(f'Степень с показателем ${pw}$ от квадрата: корень из квадрата — модуль', stepen),
            Shag(f'Раскрываем модули на промежутках ОДЗ', cases_tex(x, kuski)),
        ],
        podskazki=[
            'Какие множители стоят в знаменателях и в делителе? Когда они равны нулю?',
            f'Как раскладываются $x^3-{C3}$ и $x^3+{C3}$?',
            'Что останется после сокращения одинаковых множителей?',
            'Чему равен $\\sqrt{A^2}$?',
        ],
        iskhod=src,
        klyuch=f'dk:{c}:{tau}:{h}',
    )


def s_koren_mnogochlen(rng: random.Random) -> Zadacha:
    """(√((x²−c²)(x²+d)) ∓ x√(x²+d)/√(1 − c²/x²))·√(x²−c²)/√(x²+d)."""
    c = rng.randint(1, 6)
    d = rng.randint(1, 9)
    sig = pick(rng, [1, -1])
    C2 = c * c
    quart = sp.expand((x**2 - C2) * (x**2 + d))
    src = ((sp.sqrt(quart) - sig * x * sp.sqrt(x**2 + d) / sp.sqrt(1 - sp.Integer(C2) / x**2))
           * sp.sqrt(x**2 - C2) / sp.sqrt(x**2 + d))
    U = x**2 - C2 - sig * x * sp.Abs(x)
    kuski = [
        (-sp.oo, sp.Integer(-c), False, False, sp.expand(raskryt(U, -sp.oo, -c, x)), src),
        (sp.Integer(c), sp.oo, False, False, sp.expand(raskryt(U, c, sp.oo, x)), src),
    ]
    zn = '-' if sig > 0 else '+'
    formula = (f'\\left(\\sqrt{{{poly_tex(quart, x)}}}{zn}\\frac{{x\\sqrt{{x^2+{d}}}}}'
               f'{{\\sqrt{{1-\\frac{{{C2}}}{{x^2}}}}}}\\right)\\cdot\\frac{{\\sqrt{{x^2-{C2}}}}}{{\\sqrt{{x^2+{d}}}}}')
    return Zadacha(
        tip=TIP, uroven=3, podtip='koren-mnogochlen',
        uslovie=uslovie_odz(rng, x), formula=formula,
        otvet=otvet(x, kuski, rng),
        razbor=[
            Shag(f'ОДЗ: $x^2-{C2}\\ge0$ и $1-\\frac{{{C2}}}{{x^2}}>0$ (корень в знаменателе), то есть $x^2>{C2}$; '
                 'первое подкоренное выражение при этом тоже неотрицательно (см. разложение)',
                 f'x\\in(-\\infty;\\,{-c})\\cup({c};\\,+\\infty)'),
            Shag('Первое подкоренное выражение — квадратный трёхчлен относительно $x^2$; раскладываем по корням',
                 f'{poly_tex(quart, x)}=(x^2-{C2})(x^2+{d}),\\quad \\sqrt{{(x^2-{C2})(x^2+{d})}}='
                 f'\\sqrt{{x^2-{C2}}}\\,\\sqrt{{x^2+{d}}}'),
            Shag('Корень в знаменателе: приводим к общему знаменателю, $\\sqrt{x^2}=|x|$',
                 f'\\sqrt{{1-\\frac{{{C2}}}{{x^2}}}}=\\frac{{\\sqrt{{x^2-{C2}}}}}{{|x|}}\\ \\Rightarrow\\ '
                 f'\\frac{{x\\sqrt{{x^2+{d}}}}}{{\\sqrt{{1-\\frac{{{C2}}}{{x^2}}}}}}=\\frac{{x|x|\\sqrt{{x^2+{d}}}}}{{\\sqrt{{x^2-{C2}}}}}'),
            Shag('Выносим $\\frac{\\sqrt{x^2+' + str(d) + '}}{\\sqrt{x^2-' + str(C2) + '}}$ из скобки и умножаем на последний множитель',
                 f'\\frac{{\\sqrt{{x^2+{d}}}}}{{\\sqrt{{x^2-{C2}}}}}\\left(x^2-{C2}{zn}x|x|\\right)\\cdot'
                 f'\\frac{{\\sqrt{{x^2-{C2}}}}}{{\\sqrt{{x^2+{d}}}}}=x^2-{C2}{zn}x|x|'),
            Shag('Раскрываем $|x|$: при $x<' + str(-c) + '$ он равен $-x$, при $x>' + str(c) + '$ равен $x$',
                 cases_tex(x, kuski)),
        ],
        podskazki=[
            'При каких $x$ определён корень в знаменателе и не равен нулю?',
            f'Как разложить ${poly_tex(quart, x)}$, если считать переменной $x^2$?',
            f'Как записать $\\sqrt{{1-\\frac{{{C2}}}{{x^2}}}}$ одной дробью?',
            'Чему равен $x|x|$ при $x>0$ и при $x<0$?',
        ],
        iskhod=src,
        klyuch=f'km:{c}:{d}:{sig}',
    )


PODTIPY = [s_vlozh_drob, s_vlozh_stepen, s_vlozh_otnoshenie, s_modul_kvadraty,
           s_chetvertaya, s_drob_kuby, s_koren_mnogochlen]

_schet = [0]


def generator(rng: random.Random) -> Zadacha | None:
    # по кругу — чтобы подтипы распределились ровно
    gen = PODTIPY[_schet[0] % len(PODTIPY)]
    _schet[0] += 1
    return gen(rng)
