"""
Тип 1.4. Числовые выражения с вложенными радикалами: подкоренное
выражение A ± B√c — полный квадрат, полный куб или четвёртая степень
числа p ± q√c. В книге-ориентире это «проверьте равенство»; у нас —
«вычислите». Уровень ★ (квадратные корни) и ★★ (кубические корни,
дроби, суммы нескольких радикалов, корни четвёртой степени).
"""

from __future__ import annotations

import itertools
import random

import sympy as sp

from ..core import L, Shag, Zadacha, otvet_chislo, pick, root

TIP = '1.4'

CS = [2, 3, 5, 6, 7, 10, 11]


# ── Запись чисел вида p ± q√c ─────────────────────────────────────────


def sq(c: int, q: int = 1) -> str:
    """q√c без знака: «\\sqrt{3}», «2\\sqrt{3}»."""
    return f'{"" if q == 1 else q}\\sqrt{{{c}}}'


def ab(A: int, B: int, c: int, sign: int) -> str:
    """A + B√c или A − B√c."""
    return f'{A}{"+" if sign > 0 else "-"}{sq(c, B)}'


def pq(p: int, q: int, c: int, sign: int) -> str:
    """p + q√c или p − q√c."""
    return f'{p}{"+" if sign > 0 else "-"}{sq(c, q)}'


def qp(p: int, q: int, c: int) -> str:
    """q√c − p."""
    return f'{sq(c, q)}-{p}'


def kvadrat(p: int, q: int, c: int) -> tuple[int, int]:
    """(p + q√c)² = A + B√c."""
    return p * p + q * q * c, 2 * p * q


def kub(p: int, q: int, c: int) -> tuple[int, int]:
    """(p + q√c)³ = A + B√c."""
    return p**3 + 3 * p * q * q * c, 3 * p * p * q + q**3 * c


def bolshe(p: int, q: int, c: int) -> bool:
    """p > q√c."""
    return p * p > q * q * c


def sravnenie(p: int, q: int, c: int) -> str:
    """Шаг сравнения p и q√c через квадраты."""
    if bolshe(p, q, c):
        return f'{p}^2={p * p}>{q * q * c}=({sq(c, q)})^2,\\ \\text{{значит}}\\ {pq(p, q, c, -1)}>0'
    return f'{p}^2={p * p}<{q * q * c}=({sq(c, q)})^2,\\ \\text{{значит}}\\ {pq(p, q, c, -1)}<0'


def modul(p: int, q: int, c: int) -> str:
    """|p − q√c| раскрытый."""
    return pq(p, q, c, -1) if bolshe(p, q, c) else qp(p, q, c)


def kvadrat_shag(A, B, p, q, c, sign) -> Shag:
    return Shag(
        f'Ищем ${ab(A, B, c, sign)}$ в виде полного квадрата $(x{"+" if sign > 0 else "-"}y\\sqrt{{{c}}})^2'
        f'=x^2+{c}y^2{"+" if sign > 0 else "-"}2xy\\sqrt{{{c}}}$: подходят $x={p}$, $y={q}$',
        f'{ab(A, B, c, sign)}={p * p}+{q * q * c}{"+" if sign > 0 else "-"}2\\cdot{p}\\cdot{sq(c, q)}'
        f'=({pq(p, q, c, sign)})^2',
    )


def _pq_choice(rng, amax=90):
    for _ in range(100):
        c = pick(rng, CS)
        p = rng.randint(1, 7)
        q = rng.randint(1, 4)
        A, B = kvadrat(p, q, c)
        if A <= amax and p * p != q * q * c:
            return p, q, c, A, B
    raise ValueError('нет пары')


# ── Уровень 1 ─────────────────────────────────────────────────────────


def s_kvadrat_para(rng: random.Random) -> Zadacha:
    """√(A + B√c) ± √(A − B√c), A ± B√c = (p ± q√c)²."""
    p, q, c, A, B = _pq_choice(rng)
    znak = pick(rng, [1, -1])
    big = bolshe(p, q, c)
    expr = sp.sqrt(A + B * sp.sqrt(c)) + znak * sp.sqrt(A - B * sp.sqrt(c))
    if znak > 0:
        ans = 2 * p if big else 2 * q * sp.sqrt(c)
    else:
        ans = 2 * q * sp.sqrt(c) if big else 2 * p
    zn = '+' if znak > 0 else '-'
    m_ = modul(p, q, c)
    sobr = f'({pq(p, q, c, 1)}){zn}({m_})'
    return Zadacha(
        tip=TIP, uroven=1, podtip='kvadrat-para',
        uslovie='Вычислите',
        formula=f'\\sqrt{{{ab(A, B, c, 1)}}}{zn}\\sqrt{{{ab(A, B, c, -1)}}}',
        otvet=otvet_chislo(ans),
        razbor=[
            kvadrat_shag(A, B, p, q, c, 1),
            Shag('Так же второе подкоренное выражение', f'{ab(A, B, c, -1)}=({pq(p, q, c, -1)})^2'),
            Shag('Извлекаем корни: $\\sqrt{X^2}=|X|$. Определяем знак второго числа', sravnenie(p, q, c)),
            Shag('Раскрываем модуль и считаем',
                 f'\\sqrt{{({pq(p, q, c, 1)})^2}}{zn}\\sqrt{{({pq(p, q, c, -1)})^2}}={sobr}={L(ans)}'),
        ],
        podskazki=[
            f'Квадратом какого числа вида $x+y\\sqrt{{{c}}}$ может быть ${ab(A, B, c, 1)}$?',
            'Чему равен $\\sqrt{X^2}$, если знак $X$ неизвестен?',
            f'Что больше: ${p}$ или ${sq(c, q)}$?',
        ],
        iskhod=expr,
        klyuch=f'kp:{p}:{q}:{c}',
    )


def s_dva_kornya(rng: random.Random) -> Zadacha:
    """√(s + 2√k) ± √(s − 2√k), s = a + b, k = ab: (√a ± √b)²."""
    nonsq = [2, 3, 5, 6, 7, 10, 11, 13, 14, 15, 17]
    a_ = pick(rng, nonsq)
    b_ = pick(rng, [w for w in nonsq if w < a_ and sp.gcd(w, a_) == 1] or [0])
    if b_ == 0:
        return None
    s, k = a_ + b_, a_ * b_
    if sp.sqrt(k).is_Integer:
        return None
    znak = pick(rng, [1, -1])
    expr = sp.sqrt(s + 2 * sp.sqrt(k)) + znak * sp.sqrt(s - 2 * sp.sqrt(k))
    ans = 2 * sp.sqrt(a_) if znak > 0 else 2 * sp.sqrt(b_)
    zn = '+' if znak > 0 else '-'
    sobr = f'(\\sqrt{{{a_}}}+\\sqrt{{{b_}}}){zn}(\\sqrt{{{a_}}}-\\sqrt{{{b_}}})'
    otvet = otvet_chislo(ans)
    return Zadacha(
        tip=TIP, uroven=1, podtip='dva-kornya',
        uslovie='Вычислите',
        formula=f'\\sqrt{{{s}+2\\sqrt{{{k}}}}}{zn}\\sqrt{{{s}-2\\sqrt{{{k}}}}}',
        otvet=otvet,
        razbor=[
            Shag(f'Ищем числа с суммой ${s}$ и произведением ${k}$: это ${a_}$ и ${b_}$, '
                 f'тогда подкоренные выражения — полные квадраты',
                 f'{s}\\pm2\\sqrt{{{k}}}=(\\sqrt{{{a_}}})^2+(\\sqrt{{{b_}}})^2\\pm2\\sqrt{{{a_}}}\\sqrt{{{b_}}}'
                 f'=(\\sqrt{{{a_}}}\\pm\\sqrt{{{b_}}})^2'),
            Shag(f'Извлекаем корни: $\\sqrt{{X^2}}=|X|$, а $\\sqrt{{{a_}}}-\\sqrt{{{b_}}}>0$, '
                 f'потому что ${a_}>{b_}$',
                 f'\\sqrt{{{s}+2\\sqrt{{{k}}}}}=\\sqrt{{{a_}}}+\\sqrt{{{b_}}},\\quad '
                 f'\\sqrt{{{s}-2\\sqrt{{{k}}}}}=\\sqrt{{{a_}}}-\\sqrt{{{b_}}}'),
            Shag('Складываем' if znak > 0 else 'Вычитаем',
                 f'{sobr}=2\\sqrt{{{a_ if znak > 0 else b_}}}'
                 + (f'={L(ans)}' if L(ans) != f'2 \\sqrt{{{a_ if znak > 0 else b_}}}' else '')),
        ],
        podskazki=[
            f'Как записать ${s}+2\\sqrt{{{k}}}$ в виде $(\\sqrt{{u}}+\\sqrt{{v}})^2$? Чему равны $u+v$ и $uv$?',
            f'Какое из чисел больше: $\\sqrt{{{a_}}}$ или $\\sqrt{{{b_}}}$?',
            'Что останется после сложения (вычитания)?',
        ],
        iskhod=expr,
        klyuch=f'dk:{a_}:{b_}',
    )


def s_sokrashchenie(rng: random.Random) -> Zadacha:
    """√((p₁ − q√c)²) и √((p₂ + q√c)²): радикалы √c взаимно уничтожаются, ответ p₁ + p₂."""
    c = pick(rng, CS)
    q = rng.randint(1, 3)
    p1 = rng.randint(1, 8)
    p2 = rng.randint(1, 8)
    if p1 == p2 or p1 * p1 == q * q * c:
        return None
    A1, B1 = kvadrat(p1, q, c)
    A2, B2 = kvadrat(p2, q, c)
    if max(A1, A2) > 100:
        return None
    big = bolshe(p1, q, c)
    first, second = (ab(A1, B1, c, -1), ab(A2, B2, c, 1))
    if big:
        expr = sp.sqrt(A1 - B1 * sp.sqrt(c)) + sp.sqrt(A2 + B2 * sp.sqrt(c))
        formula = f'\\sqrt{{{first}}}+\\sqrt{{{second}}}'
        sobr = f'({pq(p1, q, c, -1)})+({pq(p2, q, c, 1)})'
    else:
        expr = sp.sqrt(A2 + B2 * sp.sqrt(c)) - sp.sqrt(A1 - B1 * sp.sqrt(c))
        formula = f'\\sqrt{{{second}}}-\\sqrt{{{first}}}'
        sobr = f'({pq(p2, q, c, 1)})-({qp(p1, q, c)})'
    ans = sp.Integer(p1 + p2)
    return Zadacha(
        tip=TIP, uroven=1, podtip='sokrashchenie',
        uslovie='Вычислите', formula=formula,
        otvet=otvet_chislo(ans),
        razbor=[
            kvadrat_shag(A2, B2, p2, q, c, 1),
            Shag('Так же второе подкоренное выражение', f'{first}=({pq(p1, q, c, -1)})^2'),
            Shag('Извлекаем корни: $\\sqrt{X^2}=|X|$. Знак числа под модулем', sravnenie(p1, q, c)),
            Shag(f'Раскрываем модуль, $\\sqrt{{{c}}}$ взаимно уничтожаются', f'{sobr}={p1 + p2}'),
        ],
        podskazki=[
            f'Квадратом какого числа вида $x\\pm y\\sqrt{{{c}}}$ является каждое подкоренное выражение?',
            f'Положительно ли число ${pq(p1, q, c, -1)}$?',
            'Как раскрыть $\\sqrt{X^2}$?',
        ],
        iskhod=expr,
        klyuch=f'so:{p1}:{p2}:{q}:{c}',
    )


def s_proizvedenie(rng: random.Random) -> Zadacha:
    """(p + q√c)·√(A − B√c) = (p + q√c)·|p − q√c| = ±(p² − q²c)."""
    p, q, c, A, B = _pq_choice(rng, amax=80)
    big = bolshe(p, q, c)
    expr = (p + q * sp.sqrt(c)) * sp.sqrt(A - B * sp.sqrt(c))
    diff = p * p - q * q * c
    ans = sp.Integer(abs(diff))
    m_ = modul(p, q, c)
    return Zadacha(
        tip=TIP, uroven=1, podtip='proizvedenie',
        uslovie='Вычислите',
        formula=f'({pq(p, q, c, 1)})\\cdot\\sqrt{{{ab(A, B, c, -1)}}}',
        otvet=otvet_chislo(ans),
        razbor=[
            kvadrat_shag(A, B, p, q, c, -1),
            Shag('Извлекаем корень: $\\sqrt{X^2}=|X|$. Знак числа под модулем', sravnenie(p, q, c)),
            Shag('Раскрываем модуль', f'\\sqrt{{{ab(A, B, c, -1)}}}={m_}'),
            Shag('Перемножаем по формуле разности квадратов',
                 f'({pq(p, q, c, 1)})({m_})=' + (f'{p * p}-{q * q * c}' if big else f'-({p * p}-{q * q * c})')
                 + f'={ans}'),
        ],
        podskazki=[
            f'Квадратом какого числа вида $x-y\\sqrt{{{c}}}$ является ${ab(A, B, c, -1)}$?',
            f'Что больше: ${p}$ или ${sq(c, q)}$?',
            'Какая формула сокращённого умножения получится при перемножении?',
        ],
        iskhod=expr,
        klyuch=f'pr:{p}:{q}:{c}',
    )


# ── Уровень 2 ─────────────────────────────────────────────────────────


def _kub_choice(rng, amax=160):
    for _ in range(100):
        c = pick(rng, [2, 3, 5, 6, 7])
        p = rng.randint(1, 4)
        q = rng.randint(1, 2)
        A, B = kub(p, q, c)
        if A <= amax and p * p != q * q * c and (p, q, c) != (1, 1, 2):
            return p, q, c, A, B
    raise ValueError('нет тройки')


def kub_shag(A, B, p, q, c) -> Shag:
    return Shag(
        f'Ищем ${ab(A, B, c, 1)}$ в виде куба $(x+y\\sqrt{{{c}}})^3=x^3+{3 * c}xy^2+(3x^2y+{c}y^3)\\sqrt{{{c}}}$: '
        f'подходят $x={p}$, $y={q}$',
        f'({pq(p, q, c, 1)})^3={p**3}+{3 * p * q * q * c}+({3 * p * p * q}+{q**3 * c})\\sqrt{{{c}}}={ab(A, B, c, 1)}',
    )


def s_kub_summa(rng: random.Random) -> Zadacha:
    """∛(A + B√c) + ∛(A − B√c) = 2p — через кубическое уравнение."""
    p, q, c, A, B = _kub_choice(rng)
    kk = p * p - q * q * c
    expr = root(A + B * sp.sqrt(c), 3) + root(A - B * sp.sqrt(c), 3)
    ans = sp.Integer(2 * p)
    pr_tex = f'{A}^2-{B}^2\\cdot{c}' if B != 1 else f'{A}^2-{c}'
    k_tex = str(kk)
    return Zadacha(
        tip=TIP, uroven=2, podtip='kub-summa',
        uslovie='Вычислите',
        formula=f'\\sqrt[3]{{{ab(A, B, c, 1)}}}+\\sqrt[3]{{{ab(A, B, c, -1)}}}',
        otvet=otvet_chislo(ans),
        razbor=[
            Shag('Обозначим сумму через $s$ и возведём в куб: $(u+v)^3=u^3+v^3+3uv(u+v)$',
                 f's^3={2 * A}+3\\sqrt[3]{{({ab(A, B, c, 1)})({ab(A, B, c, -1)})}}\\cdot s'),
            Shag('Под корнем — разность квадратов',
                 f'\\sqrt[3]{{{pr_tex}}}=\\sqrt[3]{{{A * A - B * B * c}}}={k_tex}'),
            Shag('Получаем кубическое уравнение для $s$; подбором находим корень $s=' + str(2 * p) + '$',
                 f's^3{"-" if kk > 0 else "+"}{abs(3 * kk)}s-{2 * A}=0\\ \\Rightarrow\\ '
                 f'(s-{2 * p})(s^2+{2 * p}s+{p * p + 3 * q * q * c})=0'),
            Shag('У квадратного множителя дискриминант отрицателен, значит других корней нет',
                 f'D={4 * p * p}-4\\cdot{p * p + 3 * q * q * c}<0\\ \\Rightarrow\\ s={2 * p}'),
        ],
        podskazki=[
            'Что получится, если обозначить сумму через $s$ и возвести её в куб?',
            'Чему равно произведение подкоренных выражений?',
            'Какой целый корень у получившегося кубического уравнения?',
        ],
        iskhod=expr,
        klyuch=f'ks:{p}:{q}:{c}',
    )


def s_kub_raznost(rng: random.Random) -> Zadacha:
    """∛(A + B√c) − ∛(A − B√c) = 2q√c — подкоренные выражения — точные кубы."""
    p, q, c, A, B = _kub_choice(rng)
    expr = root(A + B * sp.sqrt(c), 3) - root(A - B * sp.sqrt(c), 3)
    ans = 2 * q * sp.sqrt(c)
    return Zadacha(
        tip=TIP, uroven=2, podtip='kub-raznost',
        uslovie='Вычислите',
        formula=f'\\sqrt[3]{{{ab(A, B, c, 1)}}}-\\sqrt[3]{{{ab(A, B, c, -1)}}}',
        otvet=otvet_chislo(ans),
        razbor=[
            kub_shag(A, B, p, q, c),
            Shag('Меняя знак у $\\sqrt{' + str(c) + '}$, получаем второй куб',
                 f'({pq(p, q, c, -1)})^3={ab(A, B, c, -1)}'),
            Shag('Кубический корень из куба числа равен самому числу, даже отрицательному',
                 f'\\sqrt[3]{{{ab(A, B, c, 1)}}}={pq(p, q, c, 1)},\\quad \\sqrt[3]{{{ab(A, B, c, -1)}}}={pq(p, q, c, -1)}'),
            Shag('Вычитаем', f'({pq(p, q, c, 1)})-({pq(p, q, c, -1)})={L(ans)}'),
        ],
        podskazki=[
            f'Кубом какого числа вида $x+y\\sqrt{{{c}}}$ может быть ${ab(A, B, c, 1)}$?',
            'Как получить второй куб из первого?',
            'Нужно ли следить за знаком при извлечении кубического корня?',
        ],
        iskhod=expr,
        klyuch=f'kr:{p}:{q}:{c}',
    )


def s_kub_drob(rng: random.Random) -> Zadacha:
    """[∛(A+B√c) + ∛(A−B√c)] / [√(A'+B'√c') ± √(A'−B'√c')] — оба сводятся к целым."""
    p, q, c, A, B = _kub_choice(rng)
    p2, q2, c2, A2, B2 = _pq_choice(rng, amax=70)
    big = bolshe(p2, q2, c2)
    # в знаменателе: сумма при p₂ > q₂√c₂, разность при p₂ < q₂√c₂ — тогда целое 2p₂
    zn = 1 if big else -1
    top = root(A + B * sp.sqrt(c), 3) + root(A - B * sp.sqrt(c), 3)
    bot = sp.sqrt(A2 + B2 * sp.sqrt(c2)) + zn * sp.sqrt(A2 - B2 * sp.sqrt(c2))
    expr = top / bot
    ans = sp.Rational(2 * p, 2 * p2)
    if ans == 1:
        return None
    m_ = modul(p2, q2, c2)
    zs = '+' if zn > 0 else '-'
    return Zadacha(
        tip=TIP, uroven=2, podtip='kub-drob',
        uslovie='Вычислите',
        formula=(f'\\frac{{\\sqrt[3]{{{ab(A, B, c, 1)}}}+\\sqrt[3]{{{ab(A, B, c, -1)}}}}}'
                 f'{{\\sqrt{{{ab(A2, B2, c2, 1)}}}{zs}\\sqrt{{{ab(A2, B2, c2, -1)}}}}}'),
        otvet=otvet_chislo(ans),
        razbor=[
            kub_shag(A, B, p, q, c),
            Shag('Второй куб — с другим знаком; числитель равен',
                 f'({pq(p, q, c, 1)})+({pq(p, q, c, -1)})={2 * p}'),
            kvadrat_shag(A2, B2, p2, q2, c2, 1),
            Shag('Второе подкоренное выражение знаменателя — $(' + pq(p2, q2, c2, -1) + ')^2$; '
                 '$\\sqrt{X^2}=|X|$, знак числа под модулем', sravnenie(p2, q2, c2)),
            Shag('Знаменатель и ответ',
                 f'({pq(p2, q2, c2, 1)}){zs}({m_})={2 * p2},\\quad \\frac{{{2 * p}}}{{{2 * p2}}}={L(ans)}'),
        ],
        podskazki=[
            f'Кубом какого числа вида $x+y\\sqrt{{{c}}}$ является ${ab(A, B, c, 1)}$?',
            f'Квадратом какого числа является ${ab(A2, B2, c2, 1)}$?',
            f'Какой знак у числа ${pq(p2, q2, c2, -1)}$?',
        ],
        iskhod=expr,
        klyuch=f'kd:{p}:{q}:{c}:{p2}:{q2}:{c2}',
    )


def s_tri_radikala(rng: random.Random) -> Zadacha:
    """ε₁√((p₁ ± q₁√c)²) + ε₂… + ε₃… — радикалы √c взаимно уничтожаются."""
    c = pick(rng, CS)
    items = []
    for _ in range(3):
        p_ = rng.randint(1, 8)
        q_ = rng.randint(1, 3)
        s_ = pick(rng, [1, -1])
        if p_ * p_ == q_ * q_ * c:
            return None
        A_, B_ = kvadrat(p_, q_, c)
        if A_ > 110:
            return None
        # |p + s q√c| = α + β√c
        if s_ > 0 or bolshe(p_, q_, c):
            al, be = p_, s_ * q_
        else:
            al, be = -p_, q_
        items.append((p_, q_, s_, A_, B_, al, be))
    if len({(it[0], it[1], it[2]) for it in items}) < 3:
        return None
    eps = None
    for e in [(1, 1, 1), (1, 1, -1), (1, -1, 1), (1, -1, -1)]:
        if sum(ei * it[6] for ei, it in zip(e, items)) == 0 and sum(ei * it[5] for ei, it in zip(e, items)) != 0:
            eps = e
            break
    if eps is None:
        return None
    total = sum(ei * it[5] for ei, it in zip(eps, items))
    expr = sum(ei * sp.sqrt(it[3] + it[2] * it[4] * sp.sqrt(c)) for ei, it in zip(eps, items))
    formula = ''.join(
        ('' if i == 0 else ('+' if ei > 0 else '-')) + f'\\sqrt{{{ab(it[3], it[4], c, it[2])}}}'
        for i, (ei, it) in enumerate(zip(eps, items)))
    kv = ',\\quad '.join(f'{ab(it[3], it[4], c, it[2])}=({pq(it[0], it[1], c, it[2])})^2' for it in items)
    mods = []
    for it in items:
        if it[2] > 0:
            mods.append(pq(it[0], it[1], c, 1))
        else:
            mods.append(modul(it[0], it[1], c))
    znaki = [sravnenie(it[0], it[1], c) for it in items if it[2] < 0]
    sobr = ''.join(('' if i == 0 else ('+' if ei > 0 else '-')) + f'({m_})' for i, (ei, m_) in enumerate(zip(eps, mods)))
    razbor = [
        Shag(f'Каждое подкоренное выражение — полный квадрат вида $(x\\pm y\\sqrt{{{c}}})^2=x^2+{c}y^2\\pm2xy\\sqrt{{{c}}}$', kv),
    ]
    if znaki:
        razbor.append(Shag('Извлекаем корни: $\\sqrt{X^2}=|X|$. Определяем знаки чисел с минусом',
                           ';\\quad '.join(znaki)))
    razbor.append(Shag('Раскрываем модули и складываем: радикалы взаимно уничтожаются', f'{sobr}={total}'))
    return Zadacha(
        tip=TIP, uroven=2, podtip='tri-radikala',
        uslovie='Вычислите', formula=formula,
        otvet=otvet_chislo(sp.Integer(total)),
        razbor=razbor,
        podskazki=[
            f'Квадратом какого числа вида $x\\pm y\\sqrt{{{c}}}$ является каждое подкоренное выражение?',
            'Чему равен $\\sqrt{X^2}$, если $X<0$?',
            f'Что происходит со слагаемыми, содержащими $\\sqrt{{{c}}}$?',
        ],
        iskhod=expr,
        klyuch=f'tr:{c}:' + ';'.join(str(it[:3]) for it in sorted(items)) + str(eps),
    )


def s_chetvertaya(rng: random.Random) -> Zadacha:
    """⁴√(A + B√c) ± ⁴√(A − B√c), A ± B√c = (p ± q√c)⁴."""
    for _ in range(50):
        c = pick(rng, [2, 3, 5, 6, 7])
        p = rng.randint(1, 3)
        q = rng.randint(1, 2)
        u, v = kvadrat(p, q, c)
        A, B = kvadrat(u, v, c)
        if A <= 250 and (p, q, c) != (1, 1, 2) and p * p != q * q * c:
            break
    else:
        return None
    big = bolshe(p, q, c)
    znak = pick(rng, [1, -1])
    expr = root(A + B * sp.sqrt(c), 4) + znak * root(A - B * sp.sqrt(c), 4)
    if znak > 0:
        ans = sp.Integer(2 * p) if big else 2 * q * sp.sqrt(c)
    else:
        ans = 2 * q * sp.sqrt(c) if big else sp.Integer(2 * p)
    zs = '+' if znak > 0 else '-'
    m_ = modul(p, q, c)
    return Zadacha(
        tip=TIP, uroven=2, podtip='chetvertaya-stepen',
        uslovie='Вычислите',
        formula=f'\\sqrt[4]{{{ab(A, B, c, 1)}}}{zs}\\sqrt[4]{{{ab(A, B, c, -1)}}}',
        otvet=otvet_chislo(ans),
        razbor=[
            Shag(f'$\\sqrt[4]{{X}}=\\sqrt{{\\sqrt{{X}}}}$. Сначала ищем ${ab(A, B, c, 1)}$ в виде полного квадрата',
                 f'{ab(A, B, c, 1)}={u * u}+{v * v * c}+2\\cdot{u}\\cdot{sq(c, v)}=({pq(u, v, c, 1)})^2'),
            Shag(f'Число ${pq(u, v, c, 1)}$ — тоже полный квадрат',
                 f'{pq(u, v, c, 1)}={p * p}+{q * q * c}+2\\cdot{p}\\cdot{sq(c, q)}=({pq(p, q, c, 1)})^2'),
            Shag('Значит, оба подкоренных выражения — четвёртые степени',
                 f'{ab(A, B, c, 1)}=({pq(p, q, c, 1)})^4,\\quad {ab(A, B, c, -1)}=({pq(p, q, c, -1)})^4'),
            Shag('Корень чётной степени: $\\sqrt[4]{X^4}=|X|$. Знак второго числа', sravnenie(p, q, c)),
            Shag('Раскрываем модуль и считаем', f'({pq(p, q, c, 1)}){zs}({m_})={L(ans)}'),
        ],
        podskazki=[
            'Как записать корень четвёртой степени через квадратные корни?',
            f'Квадратом какого числа вида $x+y\\sqrt{{{c}}}$ является ${ab(A, B, c, 1)}$?',
            'Чему равен $\\sqrt[4]{X^4}$ при отрицательном $X$?',
        ],
        iskhod=expr,
        klyuch=f'ch:{p}:{q}:{c}',
    )


UROVEN1 = [s_kvadrat_para, s_dva_kornya, s_sokrashchenie, s_proizvedenie]
UROVEN2 = [s_kub_summa, s_kub_raznost, s_kub_drob, s_tri_radikala, s_chetvertaya]


_OCHERED = itertools.count()


def generator(rng: random.Random) -> Zadacha | None:
    # подтипы по кругу — в небольшом банке каждый представлен поровну
    vse = UROVEN1 + UROVEN2
    podtip = vse[next(_OCHERED) % len(vse)]
    for _ in range(50):
        zd = podtip(rng)
        if zd is not None:
            return zd
    return None
