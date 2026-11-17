"""
Тип 1.9. Сложные иррациональные выражения: вложенные корни, дробные
степени, сопряжённые множители, выражения вида (A+B√(x²−k²))/(C+D√(x²−k²)),
условия на буквы; часть задач — с подстановкой числа или выражения.
Уровень ★★.
"""

from __future__ import annotations

import random

import sympy as sp

from ..core import (
    L, Shag, Zadacha, a, b, lin, num_tex, otvet_chislo, otvet_kusochnyi,
    otvet_vyrazhenie, pick, poly_tex, sample_points, term,
)

TIP = '1.9'
R = sp.Rational
Q_LIST = [R(1, 2), R(1, 3), R(2, 3), R(1, 4), R(3, 4), R(2, 5), R(3, 5), R(1, 5), R(4, 5)]


def S(name: str) -> sp.Symbol:
    return sp.Symbol(name)


def sq(e) -> str:
    return L(sp.sqrt(e))


def _vyr(rng, podtip, formula, expr, ans, ranges, usl, razbor, podskazki, klyuch,
         dop='', uslovie='Упростите выражение', forma=()) -> Zadacha:
    pts = sample_points([expr, ans], ranges, usl, seed=rng.randint(0, 10**6))
    return Zadacha(
        tip=TIP, uroven=2, podtip=podtip, uslovie=uslovie, formula=formula,
        dopolnenie=dop, otvet=otvet_vyrazhenie(ans, pts, forma=forma),
        razbor=razbor, podskazki=podskazki, iskhod=expr, usloviya=list(usl),
        klyuch=klyuch,
    )


def _chislo(podtip, formula, iskhod, value, razbor, podskazki, klyuch, dop='',
            uslovie='Упростите выражение') -> Zadacha:
    return Zadacha(
        tip=TIP, uroven=2, podtip=podtip, uslovie=uslovie, formula=formula,
        dopolnenie=dop, otvet=otvet_chislo(value), razbor=razbor,
        podskazki=podskazki, iskhod=iskhod, klyuch=klyuch,
    )


# ── 1. Сумма/разность дробей с сопряжёнными знаменателями ─────────────


def s_sopryazh(rng: random.Random, znachenie: bool = False) -> Zadacha:
    """(A+B)/(A−B) ± (A−B)/(A+B), A=√(v+k), B=√(v−k)."""
    vn = pick(rng, 'xcty')
    V = S(vn)
    k = rng.randint(1, 9)
    plus = False if znachenie else rng.random() < 0.5
    As, Bs = sp.sqrt(V + k), sp.sqrt(V - k)
    expr = (As + Bs) / (As - Bs) + (1 if plus else -1) * (As - Bs) / (As + Bs)
    ans = 2 * V / k if plus else 2 * sp.sqrt(V**2 - k**2) / k
    A, B = f'\\sqrt{{{vn}+{k}}}', f'\\sqrt{{{vn}-{k}}}'
    zn = '+' if plus else '-'
    formula = f'\\frac{{{A}+{B}}}{{{A}-{B}}}{zn}\\frac{{{A}-{B}}}{{{A}+{B}}}'
    razbor = [
        Shag('Общий знаменатель — произведение сопряжённых выражений, это разность квадратов',
             f'({A}-{B})({A}+{B})=({vn}+{k})-({vn}-{k})={2 * k}'),
    ]
    if plus:
        razbor.append(Shag('В числителе сумма квадратов суммы и разности — удвоенная сумма квадратов слагаемых',
                           f'({A}+{B})^2+({A}-{B})^2=2\\bigl(({vn}+{k})+({vn}-{k})\\bigr)=4{vn}'))
        razbor.append(Shag('Делим на общий знаменатель', f'\\frac{{4{vn}}}{{{2 * k}}}={L(ans)}'))
    else:
        razbor.append(Shag('В числителе разность квадратов суммы и разности — учетверённое произведение',
                           f'({A}+{B})^2-({A}-{B})^2=4{A}\\cdot{B}=4\\sqrt{{{vn}^2-{k * k}}}'))
        razbor.append(Shag(f'Делим на общий знаменатель (при ${vn}>{k}$ все корни определены)',
                           f'\\frac{{4\\sqrt{{{vn}^2-{k * k}}}}}{{{2 * k}}}={L(ans)}'))
    podskazki = [
        'Какой общий знаменатель у двух дробей и чему он равен?',
        'По какой формуле упрощается $(A+B)^2' + zn + '(A-B)^2$?',
        'Что останется после деления на общий знаменатель?',
    ]
    if not znachenie:
        return _vyr(rng, 'sopryazh-summa', formula, expr, ans, {V: (k, k + 20)}, [V > k],
                    razbor, podskazki, f'sp:{vn}:{k}:{plus}', dop=f'при ${vn}>{k}$.')
    q = pick(rng, Q_LIST)
    val = k * (1 + q**2) / (2 * q)
    value = sp.nsimplify(ans.subs(V, val))
    razbor.append(Shag(f'Подставляем ${vn}={num_tex(val)}$',
                       f'{vn}^2-{k * k}={num_tex(val**2 - k * k)},\\quad '
                       f'{num_tex(R(2, k))}\\cdot\\sqrt{{{num_tex(val**2 - k * k)}}}={num_tex(value)}'))
    return _chislo('sopryazh-summa-znachenie', formula, expr.subs(V, val), value, razbor,
                   podskazki + ['Удобнее подставлять число до упрощения или после?'],
                   f'spz:{vn}:{k}:{q}', dop=f'и найдите его значение при ${vn}={num_tex(val)}$.')


# ── 2. (трёхчлен + двучлен·√(x²−k²)) / (…) ───────────────────────────


def s_kvadrat_pod_kornem(rng: random.Random, znachenie: bool = False) -> Zadacha:
    vn = pick(rng, 'xpcy')
    V = S(vn)
    while True:
        k = rng.randint(1, 6)
        s_ = rng.randint(1, 7)
        w = rng.randint(1, 7)
        if len({k, s_, w}) == 3:
            break
    val = None
    if znachenie:
        for _ in range(100):
            q = pick(rng, Q_LIST)
            cand = k * (1 + q**2) / (1 - q**2)
            if cand.q <= 3 and cand != s_:
                val = cand
                break
        if val is None:
            raise ValueError('нет удобного значения')
    kor = sp.sqrt(V**2 - k**2)
    N1, D1 = sp.expand((V - k) * (V - s_)), sp.expand((V + k) * (V + w))
    expr = (N1 + (V - s_) * kor) / (D1 + (V + w) * kor)
    ans = (V - s_) * sp.sqrt(V - k) / ((V + w) * sp.sqrt(V + k))
    kt = f'\\sqrt{{{vn}^2-{k * k}}}'
    formula = (f'\\frac{{{poly_tex(N1, V)}+({lin(vn, -s_)}){kt}}}'
               f'{{{poly_tex(D1, V)}+({lin(vn, w)}){kt}}}')
    rm, rp = f'\\sqrt{{{lin(vn, -k)}}}', f'\\sqrt{{{lin(vn, k)}}}'
    razbor = [
        Shag('Раскладываем квадратные трёхчлены на множители',
             f'{poly_tex(N1, V)}=({lin(vn, -k)})({lin(vn, -s_)}),\\quad '
             f'{poly_tex(D1, V)}=({lin(vn, k)})({lin(vn, w)})'),
        Shag(f'При ${vn}>{k}$ записываем ${lin(vn, -k)}=({rm})^2$ и ${kt}={rm}\\cdot{rp}$; '
             f'в числителе выносим $({lin(vn, -s_)}){rm}$',
             f'({lin(vn, -s_)}){rm}\\,({rm}+{rp})'),
        Shag(f'Так же в знаменателе выносим $({lin(vn, w)}){rp}$',
             f'({lin(vn, w)}){rp}\\,({rp}+{rm})'),
        Shag(f'Сокращаем на ${rm}+{rp}>0$',
             f'\\frac{{({lin(vn, -s_)}){rm}}}{{({lin(vn, w)}){rp}}}'),
    ]
    podskazki = [
        'На какие множители раскладываются трёхчлены без корня?',
        f'Как представить ${kt}$ в виде произведения двух корней?',
        'Какая одинаковая скобка с корнями появляется в числителе и знаменателе?',
    ]
    if not znachenie:
        return _vyr(rng, 'kvadrat-pod-kornem', formula, expr, ans, {V: (k, k + 15)}, [V > k],
                    razbor, podskazki, f'kk:{vn}:{k}:{s_}:{w}', dop=f'при ${vn}>{k}$.')
    value = sp.nsimplify(sp.radsimp(ans.subs(V, val)))
    ratio = (val - k) / (val + k)
    razbor.append(Shag(f'Подставляем ${vn}={num_tex(val)}$: под корнем получается квадрат',
                       f'\\sqrt{{\\frac{{{vn}-{k}}}{{{vn}+{k}}}}}=\\sqrt{{{num_tex(ratio)}}}={num_tex(sp.sqrt(ratio))},\\quad '
                       f'\\frac{{{num_tex(val - s_)}}}{{{num_tex(val + w)}}}\\cdot{num_tex(sp.sqrt(ratio))}={num_tex(value)}'))
    return _chislo('kvadrat-pod-kornem-znachenie', formula, expr.subs(V, val), value, razbor,
                   podskazki + ['Чему равно $\\frac{' + f'{vn}-{k}' + '}{' + f'{vn}+{k}' + '}$ при данном значении?'],
                   f'kkz:{vn}:{k}:{s_}:{w}:{val}', dop=f'и найдите его значение при ${vn}={num_tex(val)}$.')


# ── 3. Вложенный корень и разность (сумма) кубов ──────────────────────


def s_vlozhennyi(rng: random.Random) -> Zadacha:
    vn = pick(rng, 'xay')
    V = S(vn)
    k = rng.randint(1, 9)
    c = pick(rng, [1, 2, 3, 6, 8, 18])
    plus = rng.random() < 0.5
    u, w = sp.sqrt(k + V), sp.sqrt(k - V)
    uv = sp.sqrt(k**2 - V**2)
    if plus:
        expr = sp.sqrt(c * (k + uv)) * (u**3 - w**3) / (2 * k + uv)
    else:
        expr = sp.sqrt(c * (k - uv)) * (u**3 + w**3) / (2 * k - uv)
    ans = sp.sqrt(2 * c) * V
    kt = f'\\sqrt{{{k * k}-{vn}^2}}'
    zn, zn2 = ('+', '-') if plus else ('-', '+')
    vnutri = f'{k}{zn}{kt}' if c == 1 else f'{c * k}{zn}{c}{kt}'
    formula = (f'\\frac{{\\sqrt{{{vnutri}}}\\,\\bigl(\\sqrt{{({k}+{vn})^3}}{zn2}\\sqrt{{({k}-{vn})^3}}\\bigr)}}'
               f'{{{2 * k}{zn}{kt}}}')
    half = sp.sqrt(R(c, 2))
    ht = '' if half == 1 else L(half)
    razbor = [
        Shag(f'Обозначим $u=\\sqrt{{{k}+{vn}}}$, $v=\\sqrt{{{k}-{vn}}}$; при $0<{vn}<{k}$ оба положительны и $u>v$',
             f'u^2+v^2={2 * k},\\quad uv={kt},\\quad u^2-v^2=2{vn}'),
        Shag('В скобке — ' + ('разность' if plus else 'сумма') + ' кубов; второй множитель совпадает со знаменателем',
             f'u^3{zn2}v^3=(u{zn2}v)(u^2{zn}uv+v^2)=(u{zn2}v)({2 * k}{zn}{kt})'),
        Shag(f'Подкоренное выражение — полный квадрат: ${k}=\\frac{{u^2+v^2}}{{2}}$',
             f'{c if c != 1 else ""}({k}{zn}uv)=\\frac{{{c}}}{{2}}(u{zn}v)^2\\ \\Rightarrow\\ '
             f'\\sqrt{{\\ldots}}={ht}(u{zn}v)'),
        Shag(f'Сокращаем на ${2 * k}{zn}{kt}\\ne0$ и перемножаем', f'{ht}(u+v)(u-v)={ht}(u^2-v^2)={L(ans)}'),
    ]
    return _vyr(rng, 'vlozhennyi-koren', formula, expr, ans, {V: (0, k)}, [V > 0, V < k], razbor, [
        f'Как обозначить $\\sqrt{{{k}+{vn}}}$ и $\\sqrt{{{k}-{vn}}}$, чтобы выражение стало короче?',
        f'По какой формуле раскладывается выражение в скобке? С чем совпадает его второй множитель?',
        'Не является ли выражение под внешним корнем полным квадратом?',
    ], f'vk:{vn}:{k}:{c}:{plus}', dop=f'при $0<{vn}<{k}$.')


# ── 4. Дробные степени 1/3: суммы и разности кубов ────────────────────


def s_drobnye_kuby(rng: random.Random, znachenie: bool = False) -> Zadacha:
    t = a ** R(1, 3)
    while True:
        r, s_ = rng.randint(1, 5), rng.randint(1, 5)
        if r != s_:
            break
    d = s_ - r
    expr = ((a - r**3) / (t**2 + r * t + r**2) + (a + s_**3) / (t**2 - s_ * t + s_**2)) / (4 * t**2 - d**2)
    ans = 1 / (2 * t - d)
    t23 = 'a^{2/3}'
    tt = 'a^{1/3}'
    z1 = f'{t23}{term(r, tt)}+{r * r}'
    z2 = f'{t23}{term(-s_, tt)}+{s_ * s_}'
    formula = (f'\\left(\\frac{{a-{r**3}}}{{{z1}}}+\\frac{{a+{s_**3}}}{{{z2}}}\\right):'
               f'\\left(4{t23}-{d * d}\\right)')
    razbor = [
        Shag(f'Обозначим $t={tt}$ ($a>0$, $t>0$). Числитель первой дроби — разность кубов',
             f'a-{r**3}=t^3-{r**3}=({lin("t", -r)})(t^2{term(r, "t")}+{r * r})'),
        Shag('Числитель второй дроби — сумма кубов',
             f'a+{s_**3}=t^3+{s_**3}=({lin("t", s_)})(t^2{term(-s_, "t")}+{s_ * s_})'),
        Shag('Сокращаем каждую дробь на неполный квадрат и складываем',
             f'({lin("t", -r)})+({lin("t", s_)})={lin("2t", d)}'),
        Shag('Делитель раскладываем как разность квадратов и сокращаем',
             f'\\frac{{{lin("2t", d)}}}{{4t^2-{d * d}}}=\\frac{{1}}{{{lin("2t", -d)}}}={L(ans)}'),
    ]
    podskazki = [
        f'Как записать $a$ через $t={tt}$?',
        f'Какие формулы сокращённого умножения видны в числителях $a-{r**3}$ и $a+{s_**3}$?',
        f'На какие множители раскладывается $4{t23}-{d * d}$?',
    ]
    if not znachenie:
        return _vyr(rng, 'drobnye-kuby', formula, expr, ans, {a: (0, 40)}, [a > 0], razbor,
                    podskazki, f'dk:{r}:{s_}', dop='при $a>0$.')
    mm = pick(rng, [2, 3, 5, 6, 7])
    if 4 * mm == d * d:
        raise ValueError
    aval = mm * sp.sqrt(mm)
    value = sp.radsimp(1 / (2 * sp.sqrt(mm) - d))
    razbor.append(Shag(f'При $a={L(aval)}=(\\sqrt{{{mm}}})^3$ получаем ${tt}=\\sqrt{{{mm}}}$; '
                       'избавляемся от иррациональности в знаменателе',
                       f'\\frac{{1}}{{{lin("2" + sq(mm), -d)}}}={L(value)}'))
    return _chislo('drobnye-kuby-znachenie', formula, expr.subs(a, aval), value, razbor,
                   podskazki + [f'Чему равен ${tt}$ при данном $a$?'],
                   f'dkz:{r}:{s_}:{mm}', dop=f'и найдите его значение при $a={L(aval)}$.')


# ── 5. Степени 1/4 ────────────────────────────────────────────────────

PARY = [('a', 'b'), ('x', 'y'), ('m', 'n'), ('p', 'q'), ('u', 'v')]


def s_chetvertye(rng: random.Random, znachenie: bool = False) -> Zadacha:
    an, bn = pick(rng, PARY)
    A, B = S(an), S(bn)
    al, be = A ** R(1, 4), B ** R(1, 4)
    var = rng.randint(1, 3)
    swap = rng.random() < 0.5
    if var == 1:
        f1_den, f1_tex = al * (al**2 + be**2), f'{an}^{{3/4}}+{an}^{{1/4}}{bn}^{{1/2}}'
        f2 = (sp.sqrt(A) - sp.sqrt(B)) / (al + be)
        f2_tex, f2_val = f'{an}^{{1/4}}+{bn}^{{1/4}}', '\\alpha-\\beta'
        f1_val = '\\frac{(\\alpha-\\beta)(\\alpha+\\beta)}{\\alpha}'
        res, res_t = (al - be) * be / al, '\\frac{(\\alpha-\\beta)\\beta}{\\alpha}'
        f1_den_t = '\\alpha(\\alpha^2+\\beta^2)'
    elif var == 2:
        f1_den, f1_tex = al * (al**2 + be**2), f'{an}^{{3/4}}+{an}^{{1/4}}{bn}^{{1/2}}'
        f2 = (sp.sqrt(A) - sp.sqrt(B)) / (al - be)
        f2_tex, f2_val = f'{an}^{{1/4}}-{bn}^{{1/4}}', '\\alpha+\\beta'
        f1_val = '\\frac{(\\alpha-\\beta)(\\alpha+\\beta)}{\\alpha}'
        res, res_t = -(al + be) * be / al, '-\\frac{(\\alpha+\\beta)\\beta}{\\alpha}'
        f1_den_t = '\\alpha(\\alpha^2+\\beta^2)'
    else:
        f1_den, f1_tex = al**2 * (al + be), f'{an}^{{3/4}}+{an}^{{1/2}}{bn}^{{1/4}}'
        f2 = (sp.sqrt(A) - sp.sqrt(B)) / (al + be)
        f2_tex, f2_val = f'{an}^{{1/4}}+{bn}^{{1/4}}', '\\alpha-\\beta'
        f1_val = '\\frac{(\\alpha-\\beta)(\\alpha^2+\\beta^2)}{\\alpha^2}'
        res, res_t = (al - be) * be**2 / al**2, '\\frac{(\\alpha-\\beta)\\beta^2}{\\alpha^2}'
        f1_den_t = '\\alpha^2(\\alpha+\\beta)'
    f1 = (A - B) / f1_den
    f2_ab = f2_tex.replace(an + '^{1/4}', '\\alpha').replace(bn + '^{1/4}', '\\beta')
    expr = f2 - f1 if swap else f1 - f2
    ans = -res if swap else res
    if swap:
        res_t = res_t[1:] if res_t.startswith('-') else '-' + res_t
    ans_t = res_t.replace('\\alpha^2', f'\\sqrt{{{an}}}').replace('\\beta^2', f'\\sqrt{{{bn}}}')
    ans_t = ans_t.replace('\\alpha', f'\\sqrt[4]{{{an}}}').replace('\\beta', f'\\sqrt[4]{{{bn}}}')
    t1 = f'\\frac{{{an}-{bn}}}{{{f1_tex}}}'
    t2 = f'\\frac{{\\sqrt{{{an}}}-\\sqrt{{{bn}}}}}{{{f2_tex}}}'
    formula = f'{t2}-{t1}' if swap else f'{t1}-{t2}'
    razbor = [
        Shag(f'Обозначим $\\alpha={an}^{{1/4}}$, $\\beta={bn}^{{1/4}}$ (при ${an}>0$, ${bn}>0$). '
             'Тогда разность в числителе раскладывается до конца',
             f'{an}-{bn}=\\alpha^4-\\beta^4=(\\alpha-\\beta)(\\alpha+\\beta)(\\alpha^2+\\beta^2)'),
        Shag(f'Дробь с числителем ${an}-{bn}$: в знаменателе выносим общий множитель и сокращаем',
             f'\\frac{{(\\alpha-\\beta)(\\alpha+\\beta)(\\alpha^2+\\beta^2)}}{{{f1_den_t}}}={f1_val}'),
        Shag('Дробь с корнями: числитель — разность квадратов $\\alpha^2-\\beta^2$',
             f'\\frac{{\\alpha^2-\\beta^2}}{{{f2_ab}}}={f2_val}'),
        Shag('Вычитаем, вынося общий множитель', res_t),
        Shag('Возвращаемся к исходным буквам', ans_t),
    ]
    podskazki = [
        f'Как записать ${an}$, $\\sqrt{{{an}}}$ и ${an}^{{3/4}}$ через $\\alpha={an}^{{1/4}}$?',
        f'На сколько множителей раскладывается ${an}-{bn}$?',
        'Какой общий множитель удобно вынести после сокращения обеих дробей?',
    ]
    usl = [A > 0, B > 0, sp.Ne(A, B)]
    if not znachenie:
        zd = _vyr(rng, 'chetvertye-stepeni', formula, expr, ans, {A: (0, 30), B: (0, 30)}, usl,
                    razbor, podskazki, f'ch:{an}:{var}:{swap}',
                    dop=f'при ${an}>0$, ${bn}>0$, ${an}\\ne {bn}$.')
        zd.otvet['tex'] = ans_t
        return zd
    p1, p2 = rng.sample([1, 2, 3, 4, 5], 2)
    subs = {A: p1**4, B: p2**4}
    value = sp.nsimplify(ans.subs(subs))
    razbor[-1] = Shag(f'Подставляем $\\alpha={p1}$, $\\beta={p2}$ в упрощённое выражение', num_tex(value))
    return _chislo('chetvertye-stepeni-znachenie', formula, expr.subs(subs), value, razbor,
                   podskazki + [f'Чему равны ${an}^{{1/4}}$ и ${bn}^{{1/4}}$ при данных значениях?'],
                   f'chz:{an}:{var}:{swap}:{p1}:{p2}',
                   dop=f'и найдите его значение при ${an}={p1**4}$, ${bn}={p2**4}$.')


# ── 6. Сумма (разность) кубов корней ──────────────────────────────────


def s_dva_kornya(rng: random.Random, znachenie: bool = False) -> Zadacha:
    vn = pick(rng, 'xatm')
    V = S(vn)
    k = pick(rng, [2, 3, 5, 6, 7, 4, 9])
    var = rng.randint(1, 4)
    rk, rv = sp.sqrt(k), sp.sqrt(V)
    kv_ = int(sp.sqrt(k)) if sp.sqrt(k).is_Integer else None
    rk_t = str(kv_) if kv_ else f'\\sqrt{{{k}}}'
    kk_t = str(k * kv_) if kv_ else f'{k}\\sqrt{{{k}}}'
    kx_t = f'{kv_}\\sqrt{{{vn}}}' if kv_ else f'\\sqrt{{{k}{vn}}}'
    rvt = f'\\sqrt{{{vn}}}'
    kx2_t = f'{2 * kv_}\\sqrt{{{vn}}}' if kv_ else f'2\\sqrt{{{k}{vn}}}'
    plus = var in (1, 3)
    zn, mn = ('+', '-') if plus else ('-', '+')
    vnutr = (rv**3 + rk**3) / (rv + rk) - rk * rv if plus else (rv**3 - rk**3) / (rv - rk) + rk * rv
    in_t = (f'\\frac{{{vn}\\sqrt{{{vn}}}{zn}{kk_t}}}{{{rvt}{zn}{rk_t}}}{mn}{kx_t}')
    if var <= 2:
        expr = vnutr / (V - k)
        ans = (rv - rk) / (rv + rk) if plus else (rv + rk) / (rv - rk)
        formula = f'\\left({in_t}\\right):({vn}-{k})'
        last = Shag(f'Раскладываем ${vn}-{k}$ как разность квадратов и сокращаем на ${rvt}{mn}{rk_t}\\ne0$',
                    f'\\frac{{({rvt}{mn}{rk_t})^2}}{{({rvt}-{rk_t})({rvt}+{rk_t})}}={L(ans)}')
    else:
        expr = vnutr * (rv + (rk if plus else -rk)) / (V - k)
        ans = rv - rk if plus else rv + rk
        formula = f'\\left({in_t}\\right)\\cdot\\frac{{{rvt}{zn}{rk_t}}}{{{vn}-{k}}}'
        last = Shag(f'Раскладываем ${vn}-{k}$ как разность квадратов и сокращаем',
                    f'\\frac{{({rvt}{mn}{rk_t})^2({rvt}{zn}{rk_t})}}{{({rvt}-{rk_t})({rvt}+{rk_t})}}={L(ans)}')
    razbor = [
        Shag(f'Числитель дроби — {"сумма" if plus else "разность"} кубов ${rvt}$ и ${rk_t}$',
             f'{vn}\\sqrt{{{vn}}}{zn}{kk_t}=({rvt}{zn}{rk_t})({vn}{mn}{kx_t}+{k})'),
        Shag(f'Сокращаем на ${rvt}{zn}{rk_t}\\ne0$ и приводим подобные — получается полный квадрат',
             f'{vn}{mn}{kx_t}+{k}{mn}{kx_t}={vn}{mn}{kx2_t}+{k}=({rvt}{mn}{rk_t})^2'),
        last,
    ]
    podskazki = [
        f'Как записать ${vn}\\sqrt{{{vn}}}$ в виде куба?',
        'Какую формулу сокращённого умножения напоминает выражение после сокращения?',
        f'На какие множители раскладывается ${vn}-{k}$?',
    ]
    usl = [V > 0, sp.Ne(V, k)]
    if not znachenie:
        return _vyr(rng, 'summa-kubov-kornei', formula, expr, ans, {V: (0, 30)}, usl, razbor, podskazki,
                    f'dk:{vn}:{k}:{var}', dop=f'при ${vn}>0$, ${vn}\\ne{k}$.')
    mm = pick(rng, [2, 3, 4, 5, R(1, 4), R(1, 9)])
    val = k * mm**2
    value = sp.nsimplify(sp.radsimp(ans.subs(V, val)))
    zam = sp.Symbol('ZAM')
    podst = L(ans.subs(rv, zam)).replace('ZAM', L(sp.sqrt(val)))
    razbor.append(Shag(f'Подставляем ${vn}={num_tex(val)}$, тогда ${rvt}={L(sp.sqrt(val))}$', f'{podst}={L(value)}'))
    return _chislo('summa-kubov-kornei-znachenie', formula, expr.subs(V, val), value, razbor,
                   podskazki + [f'Чему равен ${rvt}$ при данном значении?'],
                   f'dkz:{vn}:{k}:{var}:{mm}', dop=f'и найдите его значение при ${vn}={num_tex(val)}$.')


# ── 7. Степени ±1/2 от квадратных трёхчленов ──────────────────────────


def s_kvadratnye_stepeni(rng: random.Random) -> Zadacha:
    vn = pick(rng, 'xty')
    V = S(vn)
    r, s_ = sorted(rng.sample(range(1, 7), 2))
    if (r, s_) == (1, 2):
        raise ValueError('слишком привычные числа')
    kk, cc = r + s_, r * s_
    neg = rng.random() < 0.5
    Ap, Bp = V**2 + kk * V + cc, V**2 - kk * V + cc
    e = R(-1, 2) if neg else R(1, 2)
    P, M = Ap**e, Bp**e
    expr = (P + M) / (P - M) + (P - M) / (P + M)
    g = 2 if kk % 2 == 0 else 1
    ans = (-1 if neg else 1) * (2 // g) * (V**2 + cc) / ((kk // g) * V)
    At, Bt = poly_tex(Ap, V), poly_tex(Bp, V)
    et = '-1/2' if neg else '1/2'
    Pt, Mt = f'({At})^{{{et}}}', f'({Bt})^{{{et}}}'
    formula = f'\\frac{{{Pt}+{Mt}}}{{{Pt}-{Mt}}}+\\frac{{{Pt}-{Mt}}}{{{Pt}+{Mt}}}'
    razbor = [
        Shag(f'Обозначим $A={At}$, $B={Bt}$; при ${vn}>{s_}$ оба трёхчлена положительны',
             f'A=({lin(vn, r)})({lin(vn, s_)}),\\quad B=({lin(vn, -r)})({lin(vn, -s_)})'),
    ]
    if neg:
        razbor.append(Shag('Умножаем числитель и знаменатель каждой дроби на $\\sqrt{A}\\sqrt{B}$',
                           '\\frac{\\sqrt{B}+\\sqrt{A}}{\\sqrt{B}-\\sqrt{A}}+\\frac{\\sqrt{B}-\\sqrt{A}}{\\sqrt{B}+\\sqrt{A}}'))
        x1, x2 = '\\sqrt{B}', '\\sqrt{A}'
        razn, razn_v = 'B-A', f'-{2 * kk}{vn}'
    else:
        x1, x2 = '\\sqrt{A}', '\\sqrt{B}'
        razn, razn_v = 'A-B', f'{2 * kk}{vn}'
    razbor += [
        Shag('Приводим к общему знаменателю — разности квадратов',
             f'({x1}-{x2})({x1}+{x2})={razn}={razn_v}'),
        Shag('Числитель: сумма квадратов суммы и разности',
             f'({x1}+{x2})^2+({x1}-{x2})^2=2(A+B)=4({vn}^2+{cc})'),
        Shag('Делим', f'\\frac{{4({vn}^2+{cc})}}{{{razn_v}}}={L(ans)}'),
    ]
    return _vyr(rng, 'kvadratnye-stepeni', formula, expr, ans, {V: (s_, s_ + 15)}, [V > s_], razbor, [
        f'Как записать ${et}$-ю степень через корень?',
        'Какой общий знаменатель у двух дробей?',
        'Чему равна сумма $(X+Y)^2+(X-Y)^2$?',
    ], f'ks:{vn}:{r}:{s_}:{neg}', dop=f'при ${vn}>{s_}$.')


# ── 8. Подстановка x = ½(√(a/b)+√(b/a)) ───────────────────────────────


def s_podstanovka(rng: random.Random) -> Zadacha:
    an, bn = pick(rng, [('a', 'b'), ('m', 'n'), ('p', 'q')])
    A, B = S(an), S(bn)
    xn = pick(rng, 'xtz')
    X = S(xn)
    a_bolshe = rng.random() < 0.5
    forma_x = rng.randint(1, 2)
    F = rng.randint(1, 3)
    kor = sp.sqrt(X**2 - 1)
    funcs = {1: (X - kor) / (X + kor), 2: 2 * kor / (X + kor), 3: kor / X}
    ftex = {
        1: f'\\frac{{{xn}-\\sqrt{{{xn}^2-1}}}}{{{xn}+\\sqrt{{{xn}^2-1}}}}',
        2: f'\\frac{{2\\sqrt{{{xn}^2-1}}}}{{{xn}+\\sqrt{{{xn}^2-1}}}}',
        3: f'\\frac{{\\sqrt{{{xn}^2-1}}}}{{{xn}}}',
    }
    xval = (sp.sqrt(A / B) + sp.sqrt(B / A)) / 2 if forma_x == 1 else (A + B) / (2 * sp.sqrt(A * B))
    xt = (f'\\frac{{1}}{{2}}\\left(\\sqrt{{\\frac{{{an}}}{{{bn}}}}}+\\sqrt{{\\frac{{{bn}}}{{{an}}}}}\\right)'
          if forma_x == 1 else f'\\frac{{{an}+{bn}}}{{2\\sqrt{{{an}{bn}}}}}')
    G, M = (A, B) if a_bolshe else (B, A)
    gn, mn = (an, bn) if a_bolshe else (bn, an)
    ans = {1: M / G, 2: (G - M) / G, 3: (G - M) / (A + B)}[F]
    expr = funcs[F].subs(X, xval)
    usl = [A > B, B > 0] if a_bolshe else [B > A, A > 0]
    usl_t = f'${an}>{bn}>0$' if a_bolshe else f'${bn}>{an}>0$'
    razbor = [
        Shag(f'Приводим ${xn}$ к одной дроби', f'{xn}=\\frac{{{an}+{bn}}}{{2\\sqrt{{{an}{bn}}}}}')
        if forma_x == 1 else Shag(f'Возводим ${xn}$ в квадрат', f'{xn}^2=\\frac{{({an}+{bn})^2}}{{4{an}{bn}}}'),
        Shag(f'Находим ${xn}^2-1$ — получается полный квадрат',
             f'{xn}^2-1=\\frac{{({an}+{bn})^2-4{an}{bn}}}{{4{an}{bn}}}=\\frac{{({an}-{bn})^2}}{{4{an}{bn}}}'),
        Shag(f'Извлекаем корень: $\\sqrt{{A^2}}=|A|$, а при {usl_t} модуль раскрывается так',
             f'\\sqrt{{{xn}^2-1}}=\\frac{{|{an}-{bn}|}}{{2\\sqrt{{{an}{bn}}}}}=\\frac{{{gn}-{mn}}}{{2\\sqrt{{{an}{bn}}}}}'),
    ]
    plus_t = f'{xn}+\\sqrt{{{xn}^2-1}}=\\frac{{{gn}}}{{\\sqrt{{{an}{bn}}}}}'
    if F == 1:
        razbor.append(Shag('Сумма и разность', f'{plus_t},\\quad {xn}-\\sqrt{{{xn}^2-1}}=\\frac{{{mn}}}{{\\sqrt{{{an}{bn}}}}}'))
    elif F == 2:
        razbor.append(Shag('Знаменатель', plus_t))
    razbor.append(Shag('Подставляем и сокращаем на $\\sqrt{' + an + bn + '}$', L(ans)))
    return _vyr(rng, 'podstanovka', ftex[F], expr, ans, {A: (0, 20), B: (0, 20)}, usl, razbor, [
        f'Чему равно ${xn}^2-1$? Не полный ли это квадрат?',
        f'Как раскрыть модуль при {usl_t}?',
        f'Чему равны ${xn}+\\sqrt{{{xn}^2-1}}$ и ${xn}-\\sqrt{{{xn}^2-1}}$?',
    ], f'po:{a_bolshe}:{forma_x}:{F}',
        uslovie='Подставьте в выражение',
        dop=f'значение ${xn}={xt}$ и упростите результат при {usl_t}.')


# ── 9. Подстановка x = ½(a/k + k/a): ответ по промежуткам ─────────────


def s_podstanovka_kusochno(rng: random.Random) -> Zadacha:
    k = rng.randint(1, 4)
    xn = pick(rng, 'xt')
    X = S(xn)
    F = rng.randint(1, 2)
    kor = sp.sqrt(X**2 - 1)
    xval = (a / k + k / a) / 2
    if F == 1:
        f = kor / (X + kor)
        ftex = f'\\frac{{\\sqrt{{{xn}^2-1}}}}{{{xn}+\\sqrt{{{xn}^2-1}}}}'
        hi_ans, lo_ans = (a**2 - k**2) / (2 * a**2), (k**2 - a**2) / (2 * k**2)
    else:
        f = a * (X - kor)
        ftex = f'a\\left({xn}-\\sqrt{{{xn}^2-1}}\\right)'
        hi_ans, lo_ans = sp.Integer(k), a**2 / k
    expr = f.subs(X, xval)
    xt = (f'\\frac{{1}}{{2}}\\left(a+\\frac{{1}}{{a}}\\right)' if k == 1
          else f'\\frac{{1}}{{2}}\\left(\\frac{{a}}{{{k}}}+\\frac{{{k}}}{{a}}\\right)')
    k2 = k * k
    seed = rng.randint(0, 10**6)
    otvet = otvet_kusochnyi(a, [
        (0, k, False, False, lo_ans, expr),
        (k, sp.oo, True, False, hi_ans, expr),
    ], seed=seed)
    razbor = [
        Shag(f'Находим ${xn}^2-1$ — это полный квадрат',
             f'{xn}^2-1=\\frac{{(a^2+{k2})^2}}{{{4 * k2}a^2}}-1=\\frac{{(a^2-{k2})^2}}{{{4 * k2}a^2}}'),
        Shag('При $a>0$ корень равен модулю', f'\\sqrt{{{xn}^2-1}}=\\frac{{|a^2-{k2}|}}{{{2 * k}a}}'),
        Shag(f'При $a\\ge{k}$: ${xn}+\\sqrt{{{xn}^2-1}}={L(a / k)}$, ${xn}-\\sqrt{{{xn}^2-1}}={L(k / a)}$; подставляем',
             L(hi_ans)),
        Shag(f'При $0<a<{k}$ модуль меняет знак: ${xn}+\\sqrt{{{xn}^2-1}}={L(k / a)}$, '
             f'${xn}-\\sqrt{{{xn}^2-1}}={L(a / k)}$',
             L(lo_ans)),
        Shag('Записываем ответ по промежуткам', otvet['tex']),
    ]
    return Zadacha(
        tip=TIP, uroven=2, podtip='podstanovka-kusochno',
        uslovie='Подставьте в выражение', formula=ftex,
        dopolnenie=f'значение ${xn}={xt}$, где $a>0$, и упростите результат.',
        otvet=otvet, razbor=razbor,
        podskazki=[
            f'Чему равно ${xn}^2-1$ после приведения к общему знаменателю?',
            f'Чему равен $\\sqrt{{A^2}}$? При каких $a$ меняется знак выражения $a^2-{k2}$?',
            'Сколько промежутков получится в ответе?',
        ],
        iskhod=expr, usloviya=[a > 0], klyuch=f'pk:{k}:{xn}:{F}',
    )


# ── 10. Числовые выражения с вложенными корнями ───────────────────────


def s_chislovoe(rng: random.Random, summa: bool = False) -> Zadacha:
    if not summa:
        kk = pick(rng, [4, 6, 8])
        m = kk * kk // 2
        s_ = rng.randint(1, m - 1)
        n = m * m - s_ * s_
        if sp.sqrt(n).is_Integer:
            raise ValueError
        X = sp.sqrt(m + sp.sqrt(n))
        iskhod = X * sp.sqrt(kk + X) * sp.sqrt(kk - X)
        Xt = f'\\sqrt{{{m}+{sq(n)}}}'
        formula = f'{Xt}\\cdot\\sqrt{{{kk}+{Xt}}}\\cdot\\sqrt{{{kk}-{Xt}}}'
        razbor = [
            Shag('Перемножаем два последних корня — под корнем разность квадратов',
                 f'\\sqrt{{{kk}+{Xt}}}\\cdot\\sqrt{{{kk}-{Xt}}}=\\sqrt{{{kk * kk}-({m}+{sq(n)})}}=\\sqrt{{{m}-{sq(n)}}}'),
            Shag('Ещё раз разность квадратов', f'\\sqrt{{{m}+{sq(n)}}}\\cdot\\sqrt{{{m}-{sq(n)}}}=\\sqrt{{{m * m}-{n}}}'),
            Shag('Извлекаем корень', f'\\sqrt{{{s_ * s_}}}={s_}'),
        ]
        return _chislo('chislovoe-proizvedenie', formula, iskhod, sp.Integer(s_), razbor, [
            'Какие два множителя удобно перемножить первыми?',
            'Какая формула получается под корнем при умножении $\\sqrt{c+d}\\cdot\\sqrt{c-d}$?',
            f'Чему равно ${kk}^2-{m}$?',
        ], f'cp:{kk}:{s_}', uslovie='Вычислите без приближённых вычислений')
    # √(p+√q) ± √(p−√q), p² − q = s²
    minus = rng.random() < 0.5
    w = rng.randint(2, 6)
    tot = 2 * w * w  # p ± s = 2w²... подбираем p, s
    s_ = rng.randint(1, w * w - 1) if not minus else rng.randint(1, 20)
    p = tot - s_ if not minus else tot + s_
    q = p * p - s_ * s_
    if q <= 0 or sp.sqrt(q).is_Integer or s_ >= p:
        raise ValueError
    zn = '-' if minus else '+'
    iskhod = sp.sqrt(p + sp.sqrt(q)) + (-1 if minus else 1) * sp.sqrt(p - sp.sqrt(q))
    value = sp.Integer(2 * w)
    formula = f'\\sqrt{{{p}+{sq(q)}}}{zn}\\sqrt{{{p}-{sq(q)}}}'
    razbor = [
        Shag('Обозначим значение через $N$; оно положительно. Возведём в квадрат',
             f'N^2=({p}+{sq(q)})+({p}-{sq(q)}){zn}2\\sqrt{{{p}^2-{q}}}'),
        Shag('Под корнем — разность квадратов', f'{p}^2-{q}={p * p - q}={s_}^2'),
        Shag('Получаем квадрат значения и извлекаем корень',
             f'N^2={2 * p}{zn}{2 * s_}={4 * w * w},\\quad N={2 * w}'),
    ]
    return _chislo('chislovoe-summa', formula, iskhod, value, razbor, [
        'Что получится, если возвести выражение в квадрат?',
        'Чему равно произведение $\\sqrt{c+d}\\cdot\\sqrt{c-d}$?',
        'Какой знак у исходного выражения?',
    ], f'cs:{p}:{q}:{minus}', uslovie='Вычислите без приближённых вычислений')


# ── Генератор ─────────────────────────────────────────────────────────


def _z(f):
    return lambda rng: f(rng, znachenie=True)


PODTIPY = [
    (s_sopryazh, 6), (_z(s_sopryazh), 3),
    (s_kvadrat_pod_kornem, 6), (_z(s_kvadrat_pod_kornem), 3),
    (s_vlozhennyi, 8),
    (s_drobnye_kuby, 6), (_z(s_drobnye_kuby), 3),
    (s_chetvertye, 5), (_z(s_chetvertye), 3),
    (s_dva_kornya, 6), (_z(s_dva_kornya), 3),
    (s_kvadratnye_stepeni, 7),
    (s_podstanovka, 3), (s_podstanovka_kusochno, 2),
    (s_chislovoe, 3), (lambda rng: s_chislovoe(rng, summa=True), 2),
]


def generator(rng: random.Random) -> Zadacha:
    f = rng.choices([p_[0] for p_ in PODTIPY], weights=[p_[1] for p_ in PODTIPY])[0]
    return f(rng)
