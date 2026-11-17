"""
Тип 1.12. Разное: параметр, при котором трёхчлен — полный квадрат;
телескопические суммы; разложение на простейшие дроби; разложение
многочлена на множители. Уровень ★★.
"""

from __future__ import annotations

import random

import sympy as sp

from ..core import (
    L, Shag, Zadacha, a, b, c, lin, m, n, nonzero, num_tex, otvet_chisla, otvet_chislo,
    otvet_vyrazhenie, pick, poly_tex, sample_points, term, x, y,
)
from .t10 import ravnomerno

TIP = '1.12'


def s_polnyi_kvadrat(rng: random.Random) -> Zadacha:
    """x² + 2(m − p)x + (q m + r) — полный квадрат ⇔ (m − p)² = q m + r."""
    m1 = rng.randint(-6, 6)
    m2 = rng.randint(-6, 9)
    if m1 == m2:
        return None
    m1, m2 = sorted((m1, m2))
    pp = nonzero(rng, -5, 5)
    qq = m1 + m2 - 2 * pp
    rr = pp * pp - m1 * m2
    if qq == 0:
        return None
    coef = lin('m', -pp)
    svob = f'{"" if qq == 1 else ("-" if qq == -1 else qq)}m{term(rr)}'
    disc = sp.expand((m - pp)**2 - (qq * m + rr))
    resh = sorted(sp.solve(disc, m))
    return Zadacha(
        tip=TIP, uroven=2, podtip='polnyi-kvadrat',
        uslovie='При каких значениях параметра $m$ трёхчлен',
        formula=f'x^2+2({coef})x' + (svob if svob.startswith('-') else '+' + svob),
        dopolnenie='является полным квадратом двучлена? Укажите оба значения в порядке возрастания.',
        otvet=otvet_chisla([('m_1', m1), ('m_2', m2)]),
        razbor=[
            Shag('Трёхчлен $x^2+2Bx+C$ — квадрат двучлена $(x+B)^2$ ровно тогда, когда $C=B^2$',
                 f'x^2+2Bx+B^2=(x+B)^2,\\quad B={coef}'),
            Shag('Приравниваем свободный член к квадрату половины коэффициента при $x$',
                 f'({coef})^2={svob.lstrip("+")}'),
            Shag('Раскрываем скобки и переносим всё в левую часть',
                 f'{poly_tex(disc, m)}=0'),
            Shag('Решаем квадратное уравнение (по теореме Виета или через дискриминант)',
                 f'({lin("m", -m1)})({lin("m", -m2)})=0\\ \\Rightarrow\\ m_1={m1},\\ m_2={m2}'),
        ],
        podskazki=[
            'Как выглядит квадрат двучлена $(x+B)^2$ после раскрытия скобок?',
            'Каким должен быть свободный член, если коэффициент при $x$ равен $2B$?',
            'Какое уравнение относительно $m$ получается?',
        ],
        iskhod=sp.Tuple(*resh),
        klyuch=f'pk:{pp}:{qq}:{rr}',
    )


def _fr(val) -> str:
    val = sp.Rational(val)
    return str(val.p) if val.q == 1 else f'\\frac{{{val.p}}}{{{val.q}}}'


def _drob(p_, q_):
    return f'\\frac{{1}}{{{p_}\\cdot{q_}}}'


def s_teleskop_n(rng: random.Random) -> Zadacha:
    """Σ_{k=1}^{n} 1/((dk+e)(dk+e+d)) = (1/d)(1/(d+e) − 1/(dn+d+e))."""
    d = pick(rng, [1, 2, 3, 4])
    e = rng.randint(0, 4) if d > 1 else rng.randint(1, 4)
    if e == 0 and d == 1:
        return None
    kk = sp.Symbol('k', integer=True, positive=True)
    f = 1 / ((d * kk + e) * (d * kk + e + d))
    summa = sp.Sum(f, (kk, 1, n)).doit()
    summa = sp.factor(sp.simplify(summa))
    if summa.has(sp.Sum) or summa.has(sp.polygamma) or summa.has(sp.harmonic):
        return None
    ans = sp.factor(sp.Rational(1, d) * (sp.Rational(1, d + e) - 1 / (d * n + d + e)))
    if sp.simplify(ans - summa) != 0:
        return None
    t1, t2, t3 = d + e, 2 * d + e, 3 * d + e
    last = f'({lin(f"{d if d > 1 else ""}n", e)})({lin(f"{d if d > 1 else ""}n", d + e)})'
    pts = sample_points([summa], {n: (1, 30)}, seed=rng.randint(0, 10**6))
    razn = f'\\frac{{1}}{{{d}}}\\left(' if d > 1 else '\\left('
    return Zadacha(
        tip=TIP, uroven=2, podtip='teleskop-n',
        uslovie='Найдите сумму',
        formula=f'{_drob(t1, t2)}+{_drob(t2, t3)}+\\ldots+\\frac{{1}}{{{last}}}',
        dopolnenie='как выражение от натурального $n$ (в сумме $n$ слагаемых).',
        otvet=otvet_vyrazhenie(ans, pts),
        razbor=[
            Shag(f'Каждое слагаемое — дробь вида $\\frac{{1}}{{A(A+{d})}}$; раскладываем её в разность',
                 f'\\frac{{1}}{{A(A+{d})}}={razn}\\frac{{1}}{{A}}-\\frac{{1}}{{A+{d}}}\\right)'),
            Shag('Записываем сумму через эти разности',
                 f'{razn}\\frac{{1}}{{{t1}}}-\\frac{{1}}{{{t2}}}+\\frac{{1}}{{{t2}}}-\\frac{{1}}{{{t3}}}+\\ldots'
                 f'-\\frac{{1}}{{{lin(f"{d if d > 1 else ""}n", d + e)}}}\\right)'),
            Shag('Все промежуточные дроби взаимно уничтожаются, остаются первая и последняя',
                 f'{razn}\\frac{{1}}{{{t1}}}-\\frac{{1}}{{{lin(f"{d if d > 1 else ""}n", d + e)}}}\\right)'),
            Shag('Приводим к общему знаменателю', L(ans)),
        ],
        podskazki=[
            f'Как записать $\\frac{{1}}{{A(A+{d})}}$ в виде разности двух дробей?',
            'Что происходит с соседними дробями при сложении таких разностей?',
            'Какие дроби остаются после сокращений?',
        ],
        iskhod=summa,
        klyuch=f'tn:{d}:{e}',
    )


def s_teleskop_chislo(rng: random.Random) -> Zadacha:
    """Конкретная сумма 1/(A(A+d)) от A=e до последнего множителя."""
    d = pick(rng, [2, 3, 4, 5])
    e = rng.randint(1, 6)
    cnt = rng.randint(8, 30)
    A = [e + d * i for i in range(cnt + 1)]
    iskhod = sp.Add(*[sp.Rational(1, A[i] * A[i + 1]) for i in range(cnt)])
    ans = sp.Rational(1, d) * (sp.Rational(1, A[0]) - sp.Rational(1, A[-1]))
    razn = f'\\frac{{1}}{{{d}}}\\left('
    return Zadacha(
        tip=TIP, uroven=2, podtip='teleskop-chislo',
        uslovie='Вычислите сумму',
        formula=f'{_drob(A[0], A[1])}+{_drob(A[1], A[2])}+{_drob(A[2], A[3])}+\\ldots+{_drob(A[-2], A[-1])}',
        otvet=otvet_chislo(ans),
        razbor=[
            Shag(f'Множители в каждом знаменателе отличаются на ${d}$; раскладываем слагаемое в разность',
                 f'\\frac{{1}}{{A(A+{d})}}={razn}\\frac{{1}}{{A}}-\\frac{{1}}{{A+{d}}}\\right)'),
            Shag('Записываем сумму через эти разности',
                 f'{razn}\\frac{{1}}{{{A[0]}}}-\\frac{{1}}{{{A[1]}}}+\\frac{{1}}{{{A[1]}}}-\\frac{{1}}{{{A[2]}}}'
                 f'+\\ldots+\\frac{{1}}{{{A[-2]}}}-\\frac{{1}}{{{A[-1]}}}\\right)'),
            Shag('Промежуточные дроби взаимно уничтожаются',
                 f'{razn}\\frac{{1}}{{{A[0]}}}-\\frac{{1}}{{{A[-1]}}}\\right)'
                 f'=\\frac{{1}}{{{d}}}\\cdot{_fr(sp.Rational(1, A[0]) - sp.Rational(1, A[-1]))}'
                 f'={_fr(ans)}'),
        ],
        podskazki=[
            'На сколько отличаются множители в знаменателе каждой дроби?',
            f'Как записать $\\frac{{1}}{{A(A+{d})}}$ в виде разности двух дробей?',
            'Какие слагаемые остаются после сокращения соседних дробей?',
        ],
        iskhod=iskhod,
        klyuch=f'tc:{d}:{e}:{cnt}',
    )


def s_teleskop(rng: random.Random) -> Zadacha:
    return (s_teleskop_n if rng.random() < 0.5 else s_teleskop_chislo)(rng)


def s_prosteishie(rng: random.Random) -> Zadacha:
    """Числитель/((x−p)²(x−q)) = A/(x−q) + B/(x−p)² + C/(x−p)  или три разных множителя."""
    A_, B_, C_ = sp.symbols('A B C')
    kratnyi = rng.random() < 0.5
    p = nonzero(rng, -5, 5)
    q = nonzero(rng, -5, 5, exclude=[p])
    va, vb, vc = nonzero(rng, -4, 4), nonzero(rng, -4, 4), nonzero(rng, -4, 4)
    if kratnyi:
        den = (x - p)**2 * (x - q)
        num = sp.expand(va * (x - p)**2 + vb * (x - q) + vc * (x - p) * (x - q))
        shape = (A_ / (x - q) + B_ / (x - p)**2 + C_ / (x - p))
        den_tex = f'({lin("x", -p)})^2({lin("x", -q)})'
        right = (f'\\frac{{A}}{{{lin("x", -q)}}}+\\frac{{B}}{{({lin("x", -p)})^2}}'
                 f'+\\frac{{C}}{{{lin("x", -p)}}}')
        tozh = (f'{L(num)}=A({lin("x", -p)})^2+B({lin("x", -q)})+C({lin("x", -p)})({lin("x", -q)})')
        podst = [
            (f'x={p}', f'{L(num.subs(x, p))}=B\\cdot{num_tex(p - q) if p - q > 0 else f"({p - q})"}'
                       f'\\ \\Rightarrow\\ B={vb}'),
            (f'x={q}', f'{L(num.subs(x, q))}=A\\cdot{(q - p)**2}\\ \\Rightarrow\\ A={va}'),
        ]
        tret = ('Сравниваем коэффициенты при $x^2$', f'{L(sp.Poly(num, x).coeff_monomial(x**2))}=A+C'
                f'\\ \\Rightarrow\\ C={vc}')
    else:
        r = nonzero(rng, -5, 5, exclude=[p, q])
        den = (x - p) * (x - q) * (x - r)
        num = sp.expand(va * (x - q) * (x - r) + vb * (x - p) * (x - r) + vc * (x - p) * (x - q))
        shape = A_ / (x - p) + B_ / (x - q) + C_ / (x - r)
        den_tex = f'({lin("x", -p)})({lin("x", -q)})({lin("x", -r)})'
        right = (f'\\frac{{A}}{{{lin("x", -p)}}}+\\frac{{B}}{{{lin("x", -q)}}}'
                 f'+\\frac{{C}}{{{lin("x", -r)}}}')
        tozh = (f'{L(num)}=A({lin("x", -q)})({lin("x", -r)})+B({lin("x", -p)})({lin("x", -r)})'
                f'+C({lin("x", -p)})({lin("x", -q)})')

        def pr(z1, z2):
            return f'({z1})\\cdot({z2})'
        podst = [
            (f'x={p}', f'{L(num.subs(x, p))}=A\\cdot{pr(p - q, p - r)}\\ \\Rightarrow\\ A={va}'),
            (f'x={q}', f'{L(num.subs(x, q))}=B\\cdot{pr(q - p, q - r)}\\ \\Rightarrow\\ B={vb}'),
        ]
        tret = (f'Подставляем $x={r}$',
                f'{L(num.subs(x, r))}=C\\cdot{pr(r - p, r - q)}\\ \\Rightarrow\\ C={vc}')
    if sp.Poly(num, x).degree() < 1 or sp.gcd(num, den) != 1:
        return None
    # независимое решение: сравнение коэффициентов числителей
    eqs = sp.Poly(sp.expand(sp.cancel(shape * den)) - num, x).coeffs()
    sol = sp.solve(eqs, [A_, B_, C_], dict=True)[0]
    return Zadacha(
        tip=TIP, uroven=2, podtip='prosteishie-' + ('kratnyi' if kratnyi else 'tri'),
        uslovie='Найдите числа $A$, $B$, $C$, при которых равенство',
        formula=f'\\frac{{{poly_tex(num, x)}}}{{{den_tex}}}={right}',
        dopolnenie='верно при всех допустимых $x$.',
        otvet=otvet_chisla([('A', va), ('B', vb), ('C', vc)]),
        razbor=[
            Shag('Приводим правую часть к общему знаменателю и приравниваем числители', tozh),
            Shag(f'Подставляем ${podst[0][0]}$ — часть слагаемых обнуляется', podst[0][1]),
            Shag(f'Подставляем ${podst[1][0]}$', podst[1][1]),
            Shag(tret[0], tret[1] + f';\\quad A={va},\\ B={vb},\\ C={vc}'),
        ],
        podskazki=[
            'Что получится, если умножить обе части равенства на общий знаменатель?',
            'Какие значения $x$ удобно подставить, чтобы обнулить часть слагаемых?',
            'Если подстановок не хватает, какие коэффициенты многочленов можно сравнить?',
        ],
        iskhod=sp.Tuple(sol[A_], sol[B_], sol[C_]),
        klyuch=f'pd:{int(kratnyi)}:{p}:{q}:{va}:{vb}:{vc}',
    )


def s_razlozhenie(rng: random.Random) -> Zadacha:
    vid = pick(rng, ['gruppa', 'kvadrat-raznost', 'zamena'])
    if vid == 'gruppa':
        # x³ + p x² − q² x − p q² = (x + p)(x − q)(x + q)
        pp = nonzero(rng, -7, 7)
        qq = rng.randint(1, 6)
        if abs(pp) == qq:
            return None
        poly = sp.expand((x + pp) * (x**2 - qq**2))
        ans = (x + pp) * (x - qq) * (x + qq)
        vars_ = {x: (-9, 9)}
        razbor = [
            Shag('Группируем первые два и последние два слагаемых',
                 f'(x^3{term(pp, "x^2")})-({qq * qq}x{term(pp * qq * qq)})'),
            Shag('Выносим общие множители из каждой группы',
                 f'x^2({lin("x", pp)})-{qq * qq}({lin("x", pp)})'),
            Shag(f'Выносим ${lin("x", pp)}$ и раскладываем разность квадратов',
                 f'({lin("x", pp)})(x^2-{qq * qq})={L(ans)}'),
        ]
        hints = ['Какие слагаемые удобно объединить в группы?',
                 'Какой общий множитель появляется у групп?',
                 f'Как разложить $x^2-{qq * qq}$?']
        klyuch = f'rg:{pp}:{qq}'
    elif vid == 'kvadrat-raznost':
        # a² ∓ 2kab + k²b² − s²c² = (a ∓ kb − sc)(a ∓ kb + sc)
        kk = rng.randint(1, 4)
        ss = rng.randint(1, 5)
        sg = pick(rng, [1, -1])
        inner = a + sg * kk * b
        poly = sp.expand(inner**2 - ss**2 * c**2)
        ans = (inner - ss * c) * (inner + ss * c)
        vars_ = {a: (-5, 5), b: (-5, 5), c: (-5, 5)}
        it = f'a{term(sg * kk, "b")}'
        sc = f'{ss if ss > 1 else ""}c'
        razbor = [
            Shag('Первые три слагаемых — полный квадрат', f'{L(sp.expand(inner**2))}=({it})^2'),
            Shag('Получаем разность квадратов', f'({it})^2-({sc})^2'),
            Shag('Раскладываем по формуле $A^2-B^2=(A-B)(A+B)$', f'({it}-{sc})({it}+{sc})'),
        ]
        hints = ['Какие три слагаемых образуют полный квадрат?',
                 f'Квадратом какого одночлена является ${ss * ss if ss > 1 else ""}c^2$?',
                 'По какой формуле раскладывается разность квадратов?']
        klyuch = f'rk:{kk}:{ss}:{sg}'
    else:
        # (x² + βx)² + s(x² + βx) + t: замена y = x² + βx
        beta = nonzero(rng, -5, 5)
        r1, r3 = rng.sample([i for i in range(-6, 7) if i != 0 and -beta - i != 0], 2)
        r2, r4 = -beta - r1, -beta - r3
        if len({r1, r2, r3, r4}) < 4:
            return None
        u1, u2 = -r1 * r2, -r3 * r4  # x² + βx − u = (x − r1)(x − r2)
        s_ = -(u1 + u2)
        t_ = u1 * u2
        z = x**2 + beta * x
        poly = sp.expand(z**2 + s_ * z + t_)
        ans = (x - r1) * (x - r2) * (x - r3) * (x - r4)
        vars_ = {x: (-8, 8)}
        zt = f'x^2{term(beta, "x")}'
        razbor = [
            Shag(f'Замечаем, что многочлен записывается через $y={zt}$',
                 f'({zt})^2{term(s_, f"({zt})")}{term(t_)}=y^2{term(s_, "y")}{term(t_)}'),
            Shag('Раскладываем квадратный трёхчлен относительно $y$',
                 f'y^2{term(s_, "y")}{term(t_)}=({lin("y", -u1)})({lin("y", -u2)})'),
            Shag('Возвращаемся к $x$ и раскладываем каждый трёхчлен',
                 f'({zt}{term(-u1)})({zt}{term(-u2)})={L(ans)}'),
        ]
        hints = [f'Какое выражение повторяется в многочлене?',
                 'Как разложить получившийся квадратный трёхчлен относительно новой переменной?',
                 'Раскладываются ли дальше трёхчлены после обратной замены?']
        klyuch = f'rz:{beta}:{sorted([r1, r2, r3, r4])}'
        # условие даём в виде через скобки
        formula = f'({zt})^2{term(s_, f"({zt})")}{term(t_)}'
    if vid != 'zamena':
        formula = L(poly) if vid == 'kvadrat-raznost' else poly_tex(poly, x)
    pts = sample_points([poly], vars_, seed=rng.randint(0, 10**6))
    return Zadacha(
        tip=TIP, uroven=2, podtip='razlozhenie-' + vid,
        uslovie='Разложите на множители', formula=formula,
        otvet=otvet_vyrazhenie(ans, pts, forma=['proizvedenie']),
        razbor=razbor, podskazki=hints,
        iskhod=poly, klyuch=klyuch,
    )


PODTIPY = [s_polnyi_kvadrat, s_teleskop, s_prosteishie, s_razlozhenie]


def generator(rng: random.Random) -> Zadacha:
    return ravnomerno(rng, PODTIPY)
