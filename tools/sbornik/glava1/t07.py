"""
Тип 1.7. Приёмы с сопряжёнными и симметрическими выражениями: по
разности двух корней найти их сумму (и наоборот); выразить x³ + y³,
x/y + y/x, a³ + 1/a³ … через сумму и произведение; значение выражения
с x = ∛(A + √B) + ∛(A − √B) (x — корень кубического уравнения).
Ответ — число. Уровень ★.
"""

from __future__ import annotations

import itertools
import random

import sympy as sp

from ..core import Shag, Zadacha, num_tex, otvet_chislo, pick, root, term, y

TIP = '1.7'


def s_raznost_summa(rng: random.Random) -> Zadacha:
    """√(A − y) ∓ √(B − y) дано — найти √(A − y) ± √(B − y): произведение = A − B."""
    for _ in range(100):
        u_ = rng.randint(3, 9)
        v_ = rng.randint(1, u_ - 2)
        sdv = rng.randint(-12, 20)
        A_, B_ = u_ * u_ + sdv, v_ * v_ + sdv
        if A_ > 0 and B_ > 0 and sdv != 0 and A_ <= 100:
            break
    else:
        return None
    dano_raznost = pick(rng, [True, False])
    d_, s_ = u_ - v_, u_ + v_
    plus_y = pick(rng, [True, False])  # √(y + A) или √(A − y)
    if plus_y:
        # переменная со знаком плюс: √(y + A'), A' = A − 2·sdv, чтобы ответ не сменился
        A2, B2 = u_ * u_ - sdv, v_ * v_ - sdv
        if A2 <= 0 or B2 <= 0:
            plus_y = False
    if plus_y:
        U, V = sp.sqrt(y + A2), sp.sqrt(y + B2)
        ut, vt = f'\\sqrt{{y+{A2}}}', f'\\sqrt{{y+{B2}}}'
        rA, rB = A2, B2
        pod = f'(y+{A2})-(y+{B2})={A2 - B2}'
    else:
        U, V = sp.sqrt(A_ - y), sp.sqrt(B_ - y)
        ut, vt = f'\\sqrt{{{A_}-y}}', f'\\sqrt{{{B_}-y}}'
        rA, rB = A_, B_
        pod = f'({A_}-y)-({B_}-y)={A_ - B_}'
    dano_val, iskomoe = (d_, s_) if dano_raznost else (s_, d_)
    zd, zi = ('-', '+') if dano_raznost else ('+', '-')
    # независимая проверка: решаем уравнение относительно y
    resh = sp.solve(sp.Eq(U - V if dano_raznost else U + V, dano_val), y)
    if len(resh) != 1:
        return None
    y0 = resh[0]
    iskhod = (U + V if dano_raznost else U - V).subs(y, y0)
    return Zadacha(
        tip=TIP, uroven=1, podtip='raznost-summa',
        uslovie=f'Известно, что ${ut}{zd}{vt}={dano_val}$. Найдите значение выражения ${ut}{zi}{vt}$.',
        otvet=otvet_chislo(sp.Integer(iskomoe)),
        razbor=[
            Shag('Перемножаем сумму и разность корней — по формуле разности квадратов корни исчезают',
                 f'({ut}-{vt})({ut}+{vt})={pod}'),
            Shag('Одна скобка известна; делим', f'{ut}{zi}{vt}=\\frac{{{rA - rB}}}{{{dano_val}}}={iskomoe}'),
            Shag('Такое $y$ существует: из суммы и разности находим каждый корень, оба неотрицательны',
                 f'{ut}=\\frac{{{s_}+{d_}}}{{2}}={u_},\\quad {vt}=\\frac{{{s_}-{d_}}}{{2}}={v_}'),
        ],
        podskazki=[
            'Что получится, если перемножить сумму и разность этих корней?',
            'Зависит ли разность подкоренных выражений от $y$?',
            'Как теперь найти неизвестную скобку?',
        ],
        iskhod=iskhod,
        klyuch=f'rs:{rA}:{rB}:{dano_raznost}:{plus_y}',
    )


def s_summa_proizvedenie(rng: random.Random) -> Zadacha:
    """По x + y (или x − y) и xy найти x³ ± y³, x² + y², x/y + y/x."""
    for _ in range(100):
        s_ = rng.randint(-7, 9)
        p_ = rng.randint(-8, 12)
        if p_ != 0 and s_ != 0 and s_ * s_ > 4 * p_ and not sp.sqrt(s_ * s_ - 4 * p_).is_Integer:
            break
    else:
        return None
    vid = pick(rng, ['kuby', 'drob', 'raznost-kubov', 'chetvertye'])
    D = sp.sqrt(s_ * s_ - 4 * p_)
    if vid == 'raznost-kubov':
        # x − y = s, xy = p: x и −y — корни t² − s·t − p = 0
        d_ = s_
        if d_ * d_ + 4 * p_ <= 0 or sp.sqrt(d_ * d_ + 4 * p_).is_Integer:
            return None
        D2 = sp.sqrt(d_ * d_ + 4 * p_)
        x0, y0 = (d_ + D2) / 2, (-d_ + D2) / 2
        val = d_**3 + 3 * p_ * d_
        dano = f'$x-y={d_}$, $xy={p_}$'
        iskomoe = 'x^3-y^3'
        razbor = [
            Shag('Куб разности: $(x-y)^3=x^3-y^3-3xy(x-y)$, откуда',
                 'x^3-y^3=(x-y)^3+3xy(x-y)'),
            Shag('Подставляем известные значения',
                 f'x^3-y^3={_p(d_)}^3+3\\cdot{_p(p_)}\\cdot{_p(d_)}={d_**3}{term(3 * p_ * d_, "")}={val}'),
        ]
        iskhod = x0**3 - y0**3
    else:
        x0, y0 = (s_ + D) / 2, (s_ - D) / 2
        dano = f'$x+y={s_}$, $xy={p_}$'
        if vid == 'kuby':
            val = s_**3 - 3 * p_ * s_
            iskomoe = 'x^3+y^3'
            razbor = [
                Shag('Куб суммы: $(x+y)^3=x^3+y^3+3xy(x+y)$, откуда', 'x^3+y^3=(x+y)^3-3xy(x+y)'),
                Shag('Подставляем известные значения',
                     f'x^3+y^3={_p(s_)}^3-3\\cdot{_p(p_)}\\cdot{_p(s_)}={s_**3}{term(-3 * p_ * s_, "")}={val}'),
            ]
            iskhod = x0**3 + y0**3
        elif vid == 'drob':
            val = sp.Rational(s_ * s_ - 2 * p_, p_)
            iskomoe = '\\frac{x}{y}+\\frac{y}{x}'
            razbor = [
                Shag('Приводим к общему знаменателю', '\\frac{x}{y}+\\frac{y}{x}=\\frac{x^2+y^2}{xy}'),
                Shag('Сумму квадратов выражаем через сумму и произведение',
                     f'x^2+y^2=(x+y)^2-2xy={s_ * s_}{term(-2 * p_, "")}={s_ * s_ - 2 * p_}'),
                Shag('Делим', f'\\frac{{{s_ * s_ - 2 * p_}}}{{{p_}}}={num_tex(val)}'),
            ]
            iskhod = x0 / y0 + y0 / x0
        else:
            q2 = s_ * s_ - 2 * p_
            val = q2 * q2 - 2 * p_ * p_
            iskomoe = 'x^4+y^4'
            razbor = [
                Shag('Сначала сумма квадратов', f'x^2+y^2=(x+y)^2-2xy={s_ * s_}{term(-2 * p_, "")}={q2}'),
                Shag('Затем так же для квадратов: $x^4+y^4=(x^2+y^2)^2-2(xy)^2$',
                     f'x^4+y^4={q2}^2-2\\cdot{_p(p_)}^2={q2 * q2}-{2 * p_ * p_}={val}'),
            ]
            iskhod = x0**4 + y0**4
    razbor.append(Shag('Такие $x$ и $y$ существуют: это корни квадратного уравнения с положительным '
                       'дискриминантом, их можно не находить', f'{iskomoe}={num_tex(val)}'))
    return Zadacha(
        tip=TIP, uroven=1, podtip='summa-proizvedenie',
        uslovie=f'Известно, что {dano}. Найдите значение выражения ${iskomoe}$.',
        otvet=otvet_chislo(sp.nsimplify(val)),
        razbor=razbor,
        podskazki=[
            f'Через какую формулу сокращённого умножения выражается ${iskomoe}$?',
            'Как выразить нужное выражение только через данные сумму (разность) и произведение?',
            'Нужно ли находить сами числа $x$ и $y$?',
        ],
        iskhod=iskhod,
        klyuch=f'sp:{vid}:{s_}:{p_}',
    )


def _p(n) -> str:
    """Число в скобках, если отрицательное."""
    return f'({n})' if n < 0 else str(n)


def s_obratnoe(rng: random.Random) -> Zadacha:
    """По a + 1/a или a − 1/a найти a² + 1/a², a³ + 1/a³, a⁴ + 1/a⁴."""
    vid = pick(rng, ['plus-kub', 'minus-chetvert', 'plus-chetvert', 'minus-kub'])
    s_ = rng.randint(3, 7) * pick(rng, [1, -1]) if vid.startswith('plus') else rng.randint(1, 6) * pick(rng, [1, -1])
    if vid.startswith('plus'):
        a0 = (s_ + sp.sqrt(s_ * s_ - 4)) / 2
        dano = f'a+\\frac{{1}}{{a}}={s_}'
    else:
        a0 = (s_ + sp.sqrt(s_ * s_ + 4)) / 2
        dano = f'a-\\frac{{1}}{{a}}={s_}'
    if vid == 'plus-kub':
        val = s_**3 - 3 * s_
        iskomoe = 'a^3+\\frac{1}{a^3}'
        razbor = [
            Shag('Возводим данное равенство в куб: $(a+\\frac{1}{a})^3=a^3+\\frac{1}{a^3}+3(a+\\frac{1}{a})$',
                 'a^3+\\frac{1}{a^3}=\\left(a+\\frac{1}{a}\\right)^3-3\\left(a+\\frac{1}{a}\\right)'),
            Shag('Подставляем', f'{_p(s_)}^3-3\\cdot{_p(s_)}={s_**3}{term(-3 * s_, "")}={val}'),
        ]
        iskhod = a0**3 + 1 / a0**3
    elif vid == 'minus-kub':
        val = s_**3 + 3 * s_
        iskomoe = 'a^3-\\frac{1}{a^3}'
        razbor = [
            Shag('Возводим данное равенство в куб: $(a-\\frac{1}{a})^3=a^3-\\frac{1}{a^3}-3(a-\\frac{1}{a})$',
                 'a^3-\\frac{1}{a^3}=\\left(a-\\frac{1}{a}\\right)^3+3\\left(a-\\frac{1}{a}\\right)'),
            Shag('Подставляем', f'{_p(s_)}^3+3\\cdot{_p(s_)}={s_**3}{term(3 * s_, "")}={val}'),
        ]
        iskhod = a0**3 - 1 / a0**3
    else:
        q2 = s_ * s_ - 2 if vid == 'plus-chetvert' else s_ * s_ + 2
        val = q2 * q2 - 2
        iskomoe = 'a^4+\\frac{1}{a^4}'
        zn = '-' if vid == 'plus-chetvert' else '+'
        razbor = [
            Shag('Возводим данное равенство в квадрат: удвоенное произведение $a\\cdot\\frac{1}{a}=1$',
                 f'a^2+\\frac{{1}}{{a^2}}={_p(s_)}^2{zn}2={q2}'),
            Shag('Ещё раз возводим в квадрат', f'a^4+\\frac{{1}}{{a^4}}={q2}^2-2={val}'),
        ]
        iskhod = a0**4 + 1 / a0**4
    kv = f'a^2{term(-s_, "a")}{"+" if vid.startswith("plus") else "-"}1=0'
    razbor.append(Shag(f'Такое $a$ существует: это корень уравнения ${kv}$ с положительным дискриминантом',
                       f'{iskomoe}={val}'))
    return Zadacha(
        tip=TIP, uroven=1, podtip='chislo-i-obratnoe',
        uslovie=f'Известно, что ${dano}$. Найдите значение выражения ${iskomoe}$.',
        otvet=otvet_chislo(sp.Integer(val)),
        razbor=razbor,
        podskazki=[
            'В какую степень возвести данное равенство?',
            'Чему равно произведение $a\\cdot\\frac{1}{a}$ — что оно даёт при возведении в степень?',
            'Какие слагаемые нужно перенести, чтобы осталось искомое выражение?',
        ],
        iskhod=iskhod,
        klyuch=f'ob:{vid}:{s_}',
    )


def s_kubicheskoe(rng: random.Random) -> Zadacha:
    """x = ∛(A + √B) + ∛(A − √B), A² − B = m³: x³ − 3mx = 2A."""
    for _ in range(100):
        m_ = pick(rng, [-3, -2, -1, 1, 2, 3])
        A_ = rng.randint(1, 14)
        B_ = A_ * A_ - m_**3
        if B_ > 1 and all(e == 1 for e in sp.factorint(B_).values()) and (A_, B_) != (2, 5):
            break
    else:
        return None
    beta = rng.randint(-9, 9)
    xv = root(A_ + sp.sqrt(B_), 3) + root(A_ - sp.sqrt(B_), 3)
    al = -3 * m_
    iskhod = xv**3 + al * xv + beta
    val = 2 * A_ + beta
    if val == 0:
        return None
    vyr = f'x^3{term(al, "x")}{term(beta, "")}'
    return Zadacha(
        tip=TIP, uroven=1, podtip='kubicheskoe-uravnenie',
        uslovie=(f'Пусть $x=\\sqrt[3]{{{A_}+\\sqrt{{{B_}}}}}+\\sqrt[3]{{{A_}-\\sqrt{{{B_}}}}}$. '
                 f'Найдите значение выражения ${vyr}$.'),
        otvet=otvet_chislo(sp.Integer(val)),
        razbor=[
            Shag('Обозначим слагаемые $u$ и $v$ и возведём $x=u+v$ в куб',
                 'x^3=u^3+v^3+3uv(u+v)=u^3+v^3+3uv\\cdot x'),
            Shag('Сумма кубов: корни исчезают', f'u^3+v^3=({A_}+\\sqrt{{{B_}}})+({A_}-\\sqrt{{{B_}}})={2 * A_}'),
            Shag('Произведение: под корнем разность квадратов',
                 f'uv=\\sqrt[3]{{{A_}^2-{B_}}}=\\sqrt[3]{{{A_ * A_ - B_}}}={m_}'),
            Shag('Получаем равенство для $x$ и подставляем в искомое выражение',
                 f'x^3={2 * A_}{term(3 * m_, "x")}\\ \\Rightarrow\\ {vyr}={2 * A_}{term(beta, "")}={val}'),
        ],
        podskazki=[
            'Что получится, если возвести $x$ в куб по формуле куба суммы?',
            'Чему равны сумма кубов и произведение двух кубических корней?',
            'Какое равенство связывает $x^3$ и $x$?',
        ],
        iskhod=iskhod,
        klyuch=f'ku:{A_}:{B_}:{beta}',
    )


PODTIPY = [s_raznost_summa, s_summa_proizvedenie, s_kubicheskoe, s_obratnoe]

_OCHERED = itertools.count()


def generator(rng: random.Random) -> Zadacha | None:
    # подтипы по кругу — в банке из шести задач все представлены
    podtip = PODTIPY[next(_OCHERED) % len(PODTIPY)]
    for _ in range(50):
        zd = podtip(rng)
        if zd is not None:
            return zd
    return None
