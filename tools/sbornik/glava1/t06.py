"""
Тип 1.6. Освободиться от иррациональности в знаменателе: сумма трёх
квадратных корней, корни четвёртой степени (два сопряжённых множителя),
кубические корни — через формулы суммы и разности кубов. Ответ — число
без корней в знаменателе. Уровень ★.
"""

from __future__ import annotations

import itertools
import random

import sympy as sp

from ..core import L, Shag, Zadacha, otvet_chislo, pick, root

TIP = '1.6'

FORMA = ['bez-kornya-v-znamenatele']


def bezkv(n: int) -> bool:
    """n свободно от квадратов (и не 1)."""
    return n > 1 and all(e == 1 for e in sp.factorint(n).values())


def koef_tex(cf: sp.Rational, body: str) -> str:
    """cf·(body): «(…)», «3(…)», «\\frac{2}{5}(…)»."""
    cf = sp.Rational(cf)
    if cf == 1:
        return body
    sign = '-' if cf < 0 else ''
    mag = abs(cf)
    mag_s = str(mag.p) if mag.q == 1 else f'\\frac{{{mag.p}}}{{{mag.q}}}'
    return f'{sign}{mag_s}({body})' if mag != 1 else f'{sign}({body})'


def koef_tex_skobki(cf: sp.Rational, body: str) -> str:
    """cf·body, где body уже в скобках."""
    cf = sp.Rational(cf)
    if cf == 1:
        return body
    mag_s = str(cf.p) if cf.q == 1 else f'\\frac{{{cf.p}}}{{{cf.q}}}'
    return f'{mag_s}{body}'


def r3(n: int) -> str:
    kub, tochno = sp.integer_nthroot(n, 3)
    return str(kub) if tochno else f'\\sqrt[3]{{{n}}}'


def otvet(val, tex: str) -> dict:
    out = otvet_chislo(val)
    out['tex'] = tex
    out['forma'] = list(FORMA)
    return out


def chislitel(rng: random.Random, den: int) -> int:
    """Числитель, который хорошо сокращается со знаменателем после рационализации."""
    divs = [d_ for d_ in sp.divisors(den) if d_ <= 12]
    return pick(rng, divs) * pick(rng, [1, 1, 2, 3])


# ── 1. Сумма трёх квадратных корней, c = a + b ───────────────────────


def s_tri_kornya(rng: random.Random) -> Zadacha:
    pool = [2, 3, 5, 6, 7, 10, 11, 13]
    a_, b_ = sorted(rng.sample(pool, 2))
    c_ = a_ + b_
    if not bezkv(c_) or (a_, b_) == (2, 3) or not bezkv(a_ * b_) or a_ * b_ * c_ > 300:
        return None
    znak = pick(rng, [1, -1])  # √a + √b + √c или √a + √b − √c
    dobry = [q_ for q_ in sp.divisors(2 * a_ * b_) if q_ <= 6 and 2 * a_ * b_ // q_ <= 60]
    k_ = 2 * a_ * b_ // pick(rng, dobry) if dobry else chislitel(rng, 2 * a_ * b_)
    sa, sb, sc = sp.sqrt(a_), sp.sqrt(b_), sp.sqrt(c_)
    expr = k_ / (sa + sb + znak * sc)
    # (√a + √b + ε√c)(√a + √b − ε√c) = 2√(ab); затем умножаем на √(ab)
    cf = sp.Rational(k_, 2 * a_ * b_)
    zc = '-' if znak > 0 else '+'
    t1, t2, t3 = L(a_ * sp.sqrt(b_)), L(b_ * sp.sqrt(a_)), L(sp.sqrt(a_ * b_ * c_))
    body = f'{t1}+{t2}{zc}{t3}'
    ans_tex = koef_tex(cf, body)
    ans = cf * (a_ * sb + b_ * sa - znak * sp.sqrt(a_ * b_ * c_))
    zs = '+' if znak > 0 else '-'
    sopr = f'\\sqrt{{{a_}}}+\\sqrt{{{b_}}}{zc}\\sqrt{{{c_}}}'
    return Zadacha(
        tip=TIP, uroven=1, podtip='tri-kornya',
        uslovie='Освободитесь от иррациональности в знаменателе дроби',
        formula=f'\\frac{{{k_}}}{{\\sqrt{{{a_}}}+\\sqrt{{{b_}}}{zs}\\sqrt{{{c_}}}}}',
        otvet=otvet(ans, ans_tex),
        razbor=[
            Shag(f'Объединяем $\\sqrt{{{a_}}}+\\sqrt{{{b_}}}$ в одно слагаемое и умножаем дробь '
                 f'на сопряжённое ${sopr}$; учитываем, что ${a_}+{b_}={c_}$',
                 f'(\\sqrt{{{a_}}}+\\sqrt{{{b_}}})^2-{c_}={a_}+{b_}+2\\sqrt{{{a_ * b_}}}-{c_}=2\\sqrt{{{a_ * b_}}}'),
            Shag(f'Получили дробь со знаменателем $2\\sqrt{{{a_ * b_}}}$; умножаем ещё на $\\sqrt{{{a_ * b_}}}$',
                 f'\\frac{{{k_}({sopr})}}{{2\\sqrt{{{a_ * b_}}}}}=\\frac{{{k_}({sopr})\\sqrt{{{a_ * b_}}}}}{{{2 * a_ * b_}}}'),
            Shag(f'Раскрываем скобки: $\\sqrt{{{a_}}}\\cdot\\sqrt{{{a_ * b_}}}={t1}$, '
                 f'$\\sqrt{{{b_}}}\\cdot\\sqrt{{{a_ * b_}}}={t2}$, и сокращаем',
                 f'\\frac{{{k_}({body})}}{{{2 * a_ * b_}}}={ans_tex}'),
        ],
        podskazki=[
            'Какие два слагаемых знаменателя удобно объединить в одно?',
            'На что умножить, чтобы применить формулу разности квадратов?',
            'Какой корень остался в знаменателе и как от него избавиться?',
        ],
        iskhod=expr,
        klyuch=f'tk:{a_}:{b_}',
    )


# ── 2. Корни четвёртой степени ────────────────────────────────────────


def s_chetvertaya(rng: random.Random) -> Zadacha:
    a_ = pick(rng, [2, 3, 5, 6, 7, 10, 11])
    b_ = pick(rng, [w for w in [1, 2, 3, 5, 6, 7] if w < a_])
    znak = pick(rng, [1, -1])  # ⁴√a − ⁴√b (знак −) или ⁴√a + ⁴√b
    d_ = a_ - b_
    k_ = chislitel(rng, d_)
    fa, fb = root(a_, 4), root(b_, 4)
    expr = k_ / (fa - fb) if znak < 0 else k_ / (fa + fb)
    cf = sp.Rational(k_, d_)
    rb4 = '1' if b_ == 1 else f'\\sqrt[4]{{{b_}}}'
    rb2 = '1' if b_ == 1 else f'\\sqrt{{{b_}}}'
    ra4, ra2 = f'\\sqrt[4]{{{a_}}}', f'\\sqrt{{{a_}}}'
    zs, zc = ('-', '+') if znak < 0 else ('+', '-')
    sopr1 = f'{ra4}{zc}{rb4}'
    den1 = f'{ra2}-{rb2}'
    body = f'({sopr1})({ra2}+{rb2})'
    ans_tex = koef_tex_skobki(cf, body)
    ans = cf * (fa + (fb if znak < 0 else -fb)) * (sp.sqrt(a_) + sp.sqrt(b_))
    return Zadacha(
        tip=TIP, uroven=1, podtip='chetvertaya-stepen',
        uslovie='Освободитесь от иррациональности в знаменателе дроби',
        formula=f'\\frac{{{k_}}}{{{ra4}{zs}{rb4}}}',
        otvet=otvet(ans, ans_tex),
        razbor=[
            Shag(f'Умножаем числитель и знаменатель на ${sopr1}$: $(u{zs}v)(u{zc}v)=u^2-v^2$, '
                 f'а $(\\sqrt[4]{{X}})^2=\\sqrt{{X}}$',
                 f'({ra4}{zs}{rb4})({sopr1})={den1}'),
            Shag(f'В знаменателе остались квадратные корни; умножаем ещё на ${ra2}+{rb2}$',
                 f'({ra2}-{rb2})({ra2}+{rb2})={a_}-{b_}={d_}'),
            Shag('Записываем результат и сокращаем', f'\\frac{{{k_}{body}}}{{{d_}}}={ans_tex}'),
        ],
        podskazki=[
            f'На что умножить ${ra4}{zs}{rb4}$, чтобы корни четвёртой степени превратились в квадратные?',
            'Какой множитель уберёт оставшиеся квадратные корни?',
            'Что получится в знаменателе после двух умножений?',
        ],
        iskhod=expr,
        klyuch=f'ch:{a_}:{b_}',
    )


# ── 3. Кубические корни: сумма и разность кубов ───────────────────────


def s_kuby(rng: random.Random) -> Zadacha:
    a_ = pick(rng, [2, 3, 5, 6, 7, 10, 11])
    b_ = pick(rng, [w for w in [1, 2, 3, 5, 6, 7] if w < a_ and sp.gcd(w, a_) == 1] or [0])
    if b_ == 0:
        return None
    znak = pick(rng, [1, -1])  # ∛a + ∛b или ∛a − ∛b
    d_ = a_ + b_ if znak > 0 else a_ - b_
    k_ = chislitel(rng, d_)
    ca, cb = root(a_, 3), root(b_, 3)
    expr = k_ / (ca + znak * cb)
    cf = sp.Rational(k_, d_)
    zs, zm = ('+', '-') if znak > 0 else ('-', '+')
    sopr = f'{r3(a_ * a_)}{zm}{r3(a_ * b_)}+{r3(b_ * b_)}'
    ans = cf * (root(a_ * a_, 3) - znak * root(a_ * b_, 3) + root(b_ * b_, 3))
    ans_tex = koef_tex(cf, sopr)
    formula_kub = 'u^3+v^3=(u+v)(u^2-uv+v^2)' if znak > 0 else 'u^3-v^3=(u-v)(u^2+uv+v^2)'
    return Zadacha(
        tip=TIP, uroven=1, podtip='kubicheskie-korni',
        uslovie='Освободитесь от иррациональности в знаменателе дроби',
        formula=f'\\frac{{{k_}}}{{{r3(a_)}{zs}{r3(b_)}}}',
        otvet=otvet(ans, ans_tex),
        razbor=[
            Shag(f'Знаменатель — это $u{zs}v$ при $u={r3(a_)}$, $v={r3(b_)}$; дополняем его до '
                 f'{"суммы" if znak > 0 else "разности"} кубов', formula_kub),
            Shag(f'Умножаем числитель и знаменатель на неполный квадрат ${sopr}$',
                 f'({r3(a_)}{zs}{r3(b_)})({sopr})={a_}{zs}{b_}={d_}'),
            Shag('Записываем результат и сокращаем', f'\\frac{{{k_}({sopr})}}{{{d_}}}={ans_tex}'),
        ],
        podskazki=[
            'Какую формулу сокращённого умножения напоминает знаменатель, если возвести корни в куб?',
            f'Какой множитель дополнит ${r3(a_)}{zs}{r3(b_)}$ до {"суммы" if znak > 0 else "разности"} кубов?',
            'Чему равно $(\\sqrt[3]{X})^3$?',
        ],
        iskhod=expr,
        klyuch=f'ku:{a_}:{b_}',
    )


def s_nepolnyi_kvadrat(rng: random.Random) -> Zadacha:
    """k/(∛a² ± ∛(ab) + ∛b²): знаменатель — неполный квадрат, домножаем на ∛a ∓ ∛b."""
    a_ = pick(rng, [2, 3, 5, 6, 7, 10, 11])
    b_ = pick(rng, [1, 1, 1, 2, 3, 5])
    if b_ >= a_ or sp.gcd(a_, b_) != 1:
        return None
    znak = pick(rng, [1, -1])  # знак среднего члена: + → разность кубов, − → сумма
    d_ = a_ - b_ if znak > 0 else a_ + b_
    k_ = chislitel(rng, d_)
    ca, cb = root(a_, 3), root(b_, 3)
    den = root(a_ * a_, 3) + znak * root(a_ * b_, 3) + root(b_ * b_, 3)
    expr = k_ / den
    cf = sp.Rational(k_, d_)
    zm = '+' if znak > 0 else '-'
    zl = '-' if znak > 0 else '+'

    def r3b(n):
        return '1' if n == 1 else r3(n)

    den_tex = f'{r3(a_ * a_)}{zm}{r3b(a_ * b_)}+{r3b(b_ * b_)}'
    mn = f'{r3(a_)}{zl}{r3b(b_)}'
    ans = cf * (ca - znak * cb)
    ans_tex = koef_tex(cf, mn)
    formula_kub = 'u^3-v^3=(u-v)(u^2+uv+v^2)' if znak > 0 else 'u^3+v^3=(u+v)(u^2-uv+v^2)'
    return Zadacha(
        tip=TIP, uroven=1, podtip='nepolnyi-kvadrat',
        uslovie='Освободитесь от иррациональности в знаменателе дроби',
        formula=f'\\frac{{{k_}}}{{{den_tex}}}',
        otvet=otvet(ans, ans_tex),
        razbor=[
            Shag(f'Знаменатель — неполный квадрат $u^2{zm}uv+v^2$ при $u={r3(a_)}$, $v={r3b(b_)}$',
                 formula_kub),
            Shag(f'Умножаем числитель и знаменатель на ${mn}$',
                 f'({mn})({den_tex})={a_}{zl}{b_}={d_}'),
            Shag('Записываем результат и сокращаем', f'\\frac{{{k_}({mn})}}{{{d_}}}={ans_tex}'),
        ],
        podskazki=[
            f'Как записать ${r3(a_ * a_)}$ через ${r3(a_)}$?',
            'Неполным квадратом какой разности (суммы) является знаменатель?',
            'На что нужно умножить, чтобы получить разность (сумму) кубов?',
        ],
        iskhod=expr,
        klyuch=f'nk:{a_}:{b_}',
    )


PODTIPY = [s_tri_kornya, s_chetvertaya, s_kuby, s_nepolnyi_kvadrat]

_OCHERED = itertools.count()


def generator(rng: random.Random) -> Zadacha | None:
    # подтипы по кругу — в банке из шести задач все представлены
    podtip = PODTIPY[next(_OCHERED) % len(PODTIPY)]
    for _ in range(50):
        zd = podtip(rng)
        if zd is not None:
            return zd
    return None
