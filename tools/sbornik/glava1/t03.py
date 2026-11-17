"""
Тип 1.3. Числовые выражения с радикалами разных степеней: внести
множитель под корень, привести корни к общему показателю, вынести
множитель и сложить подобные радикалы. Уровень ★.
"""

from __future__ import annotations

import itertools
import random
from functools import lru_cache

import sympy as sp

from ..core import Shag, Zadacha, otvet_chislo, pick, root

TIP = '1.3'

RADIKANDY = [2, 3, 5, 6, 7, 10]


# ── Запись ────────────────────────────────────────────────────────────


def frac_tex(val) -> str:
    """Рациональное число: целое или \\frac (без десятичных — под корнем так нагляднее)."""
    val = sp.Rational(val)
    if val.q == 1:
        return str(val.p)
    sign = '-' if val < 0 else ''
    return f'{sign}\\frac{{{abs(val.p)}}}{{{val.q}}}'


def rad(body: str, deg: int) -> str:
    return f'\\sqrt{{{body}}}' if deg == 2 else f'\\sqrt[{deg}]{{{body}}}'


def coef_rad(cf, deg: int, r: int, first: bool = True) -> str:
    """cf·ⁿ√r со знаком: «3\\sqrt[6]{2}», «-\\sqrt[6]{2}», «+\\frac{1}{2}\\sqrt[6]{2}»."""
    cf = sp.Rational(cf)
    sign = '-' if cf < 0 else ('' if first else '+')
    mag = abs(cf)
    mag_s = '' if mag == 1 else frac_tex(mag)
    return f'{sign}{mag_s}{rad(str(r), deg)}'


def nth_root_rational(val: sp.Rational, deg: int):
    """Рациональный корень степени deg из val, если он есть."""
    val = sp.Rational(val)
    if val <= 0:
        return None
    pn, okn = sp.integer_nthroot(int(val.p), deg)
    qn, okq = sp.integer_nthroot(int(val.q), deg)
    if okn and okq:
        return sp.Rational(pn, qn)
    return None


def is_power(val, deg: int) -> bool:
    return nth_root_rational(sp.Rational(val), deg) is not None


# ── Вложенные радикалы ⁿ√(A·ᵐ√B) = k·ᴺ√r ────────────────────────────


@lru_cache(maxsize=None)
def _vlozhennye() -> dict:
    """{(N, r): [(n, m, A, B, k)]} — ⁿ√(A·ᵐ√B) = k·ᴺ√r, N = n·m."""
    out: dict = {}
    fracs = sorted({sp.Rational(pp, qq) for qq in range(2, 10) for pp in range(1, 10)
                    if sp.gcd(pp, qq) == 1})
    bs = [sp.Integer(i) for i in range(2, 200)] + fracs
    for n_, m_ in [(2, 3), (3, 2), (2, 2)]:
        N = n_ * m_
        for A in range(2, 61):
            for B in bs:
                if is_power(B, m_) or is_power(A, n_):
                    continue
                V = sp.Integer(A) ** m_ * B
                for r in RADIKANDY:
                    kk = nth_root_rational(V / r, N)
                    if kk is None or kk.q > 3 or kk.p > 12 or V.p > 60000:
                        continue
                    out.setdefault((N, r), []).append((n_, m_, A, B, kk))
    return out


def vl_tex(n_, m_, A, B) -> str:
    return rad(f'{A}{rad(frac_tex(B), m_)}', n_)


def vl_expr(n_, m_, A, B):
    return root(A * root(B, m_), n_)


IMYA = {2: 'квадратного корня', 3: 'кубического корня'}


def vl_shag(cf, item, N, r, first: bool) -> Shag:
    n_, m_, A, B, kk = item
    V = sp.Integer(A) ** m_ * B
    a_m = f'{A}^{{{m_}}}'
    chto = f'Вносим ${A}$ под знак {IMYA[m_]} и объединяем корни'
    if first:
        chto += ': $\\sqrt[n]{\\sqrt[m]{X}}=\\sqrt[nm]{X}$'
    tail = f'={rad(frac_tex(V), N)}' if V != r else ''
    return Shag(
        chto,
        f'{rad(f"{A}{rad(frac_tex(B), m_)}", n_)}={rad(a_m + "\\cdot " + frac_tex(B), N)}'
        f'{tail}={coef_rad(kk, N, r)}',
    )


def _three(rng: random.Random, N: int, r: int, cnt: int):
    items = _vlozhennye().get((N, r), [])
    # не больше одного радикала с одинаковым внешним множителем
    if len(items) < cnt:
        raise ValueError('мало радикалов')
    for _ in range(50):
        pickd = rng.sample(items, cnt)
        if len({it[4] for it in pickd}) == cnt and (N == 4 or len({(it[0], it[1]) for it in pickd}) >= 2) \
                and all(it[2] <= 50 and (it[3].q > 1 or it[3] <= 100) for it in pickd):
            return pickd
    raise ValueError('не подобрались радикалы')


def s_podobnye(rng: random.Random) -> Zadacha:
    """c₁ⁿ√(A₁ᵐ√B₁) + c₂… − c₃… = C·ᴺ√r: три вложенных радикала, сводящиеся к одному."""
    N, r = pick(rng, [(6, 2), (6, 3), (6, 5), (6, 6), (4, 2), (4, 3), (4, 5), (4, 6)])
    items = _three(rng, N, r, 3)
    cfs = [pick(rng, [1, 2, 3, 4, 5, 6]) * pick(rng, [1, -1]) for _ in range(3)]
    cfs[0] = abs(cfs[0])
    total = sum(cf * it[4] for cf, it in zip(cfs, items))
    if total == 0 or not total.is_Integer:
        return None
    expr = sum(cf * vl_expr(*it[:4]) for cf, it in zip(cfs, items))
    ans = total * root(r, N)
    parts = []
    for i, (cf, it) in enumerate(zip(cfs, items)):
        parts.append(_term(cf, vl_tex(*it[:4]), first=i == 0))
    sum_tex = ''.join(coef_rad(cf * it[4], N, r, first=i == 0) for i, (cf, it) in enumerate(zip(cfs, items)))
    ans_tex = coef_rad(total, N, r)
    razbor = [vl_shag(cf, it, N, r, i == 0) for i, (cf, it) in enumerate(zip(cfs, items))]
    razbor.append(Shag('Подставляем и складываем подобные радикалы', f'{sum_tex}={ans_tex}'))
    otvet = otvet_chislo(ans)
    otvet['tex'] = ans_tex
    return Zadacha(
        tip=TIP, uroven=1, podtip='podobnye-radikaly',
        uslovie='Вычислите', formula=''.join(parts),
        otvet=otvet,
        razbor=razbor,
        podskazki=[
            'Как внести множитель, стоящий перед внутренним корнем, под этот корень?',
            'Чему равен корень из корня — какой у него показатель?',
            f'Какой множитель можно вынести из-под корня степени ${N}$?',
            'Какие радикалы получились подобными?',
        ],
        iskhod=expr,
        klyuch=f'pod:{N}:{r}:' + ';'.join(f'{cf}*{it[:4]}' for cf, it in sorted(zip(cfs, items), key=str)),
    )


def _term(cf, body, first=False):
    sign = '-' if cf < 0 else ('' if first else '+')
    mag = abs(cf)
    return f'{sign}{"" if mag == 1 else mag}{body}'


def s_drob(rng: random.Random) -> Zadacha:
    """(c₁X₁ + c₂X₂)/(c₃X₃ + c₄X₄), все Xᵢ = kᵢ·ᴺ√r — ответ рациональный."""
    N, r = pick(rng, [(6, 2), (6, 3), (6, 5), (6, 6), (4, 2), (4, 3), (4, 5)])
    items = _three(rng, N, r, 4)
    cfs = [pick(rng, [1, 1, 2, 3, 4, 5]) * pick(rng, [1, 1, -1]) for _ in range(4)]
    cfs[0], cfs[2] = abs(cfs[0]), abs(cfs[2])
    top = cfs[0] * items[0][4] + cfs[1] * items[1][4]
    bot = cfs[2] * items[2][4] + cfs[3] * items[3][4]
    if top == 0 or bot == 0:
        return None
    val = top / bot
    if val.q > 4 or abs(val.p) > 20 or abs(val) == 1:
        return None
    expr = (cfs[0] * vl_expr(*items[0][:4]) + cfs[1] * vl_expr(*items[1][:4])) / \
           (cfs[2] * vl_expr(*items[2][:4]) + cfs[3] * vl_expr(*items[3][:4]))
    num_t = _term(cfs[0], vl_tex(*items[0][:4]), True) + _term(cfs[1], vl_tex(*items[1][:4]))
    den_t = _term(cfs[2], vl_tex(*items[2][:4]), True) + _term(cfs[3], vl_tex(*items[3][:4]))
    razbor = [vl_shag(cf, it, N, r, i == 0) for i, (cf, it) in enumerate(zip(cfs, items))]
    top_t = coef_rad(cfs[0] * items[0][4], N, r) + coef_rad(cfs[1] * items[1][4], N, r, first=False)
    bot_t = coef_rad(cfs[2] * items[2][4], N, r) + coef_rad(cfs[3] * items[3][4], N, r, first=False)
    razbor.append(Shag(f'Приводим подобные в числителе и знаменателе и сокращаем на ${rad(str(r), N)}$',
                       f'\\frac{{{top_t}}}{{{bot_t}}}=\\frac{{{coef_rad(top, N, r)}}}{{{coef_rad(bot, N, r)}}}'
                       f'={frac_tex(val)}'))
    otvet = otvet_chislo(val)
    otvet['tex'] = frac_tex(val)
    return Zadacha(
        tip=TIP, uroven=1, podtip='drob-radikalov',
        uslovie='Вычислите', formula=f'\\frac{{{num_t}}}{{{den_t}}}',
        otvet=otvet,
        razbor=razbor,
        podskazki=[
            'Как записать корень из корня одним радикалом?',
            'К какому одному радикалу сводится каждое слагаемое?',
            'Что можно сократить после приведения подобных?',
        ],
        iskhod=expr,
        klyuch=f'dr:{N}:{r}:' + ';'.join(f'{cf}*{it[:4]}' for cf, it in zip(cfs, items)),
    )


@lru_cache(maxsize=None)
def _proizvedeniya() -> list:
    """(n1, n2, n3, X, Y, Z, значение): ⁿ¹√X·ⁿ²√Y : ⁿ³√Z — целое число."""
    out = []
    for n1, n2, n3 in [(6, 3, 2), (4, 8, 2), (12, 4, 3), (6, 2, 3), (10, 5, 2), (4, 6, 12), (3, 4, 12), (8, 4, 2)]:
        for p1, p2 in [(2, 3), (2, 5), (3, 5), (2, 7)]:
            per = {}
            for pr in (p1, p2):
                per[pr] = []
                for e1 in range(n1):
                    for e2 in range(n2):
                        tot = sp.Rational(e1, n1) + sp.Rational(e2, n2)
                        for tgt in (0, 1, 2):
                            e3 = (tot - tgt) * n3
                            if e3.is_Integer and 0 <= e3 < n3:
                                per[pr].append((e1, e2, int(e3), tgt))
            for o1 in per[p1]:
                for o2 in per[p2]:
                    X, Y, Z, val = (p1 ** o1[i] * p2 ** o2[i] for i in range(4))
                    if min(X, Y, Z) < 2 or max(X, Y, Z) > 400 or not 2 <= val <= 30:
                        continue
                    if any(is_power(w, nn) for w, nn in ((X, n1), (Y, n2), (Z, n3))):
                        continue
                    if o1[3] == 0 and o2[3] == 0:
                        continue
                    out.append((n1, n2, n3, X, Y, Z, val))
    return out


def s_proizvedenie(rng: random.Random) -> Zadacha:
    """ⁿ¹√X·ⁿ²√Y : ⁿ³√Z — к общему показателю; ответ — целое число."""
    stepeni = pick(rng, sorted({it[:3] for it in _proizvedeniya()}))
    n1, n2, n3, X, Y, Z, val = pick(rng, [it for it in _proizvedeniya() if it[:3] == stepeni])
    Lc = sp.ilcm(n1, n2, n3)
    expr = root(X, n1) * root(Y, n2) / root(Z, n3)
    k1, k2, k3 = Lc // n1, Lc // n2, Lc // n3

    def pw(base, e):
        return str(base) if e == 1 else f'{base}^{{{e}}}'

    def fac(w):
        f = sp.factorint(w)
        return '\\cdot '.join(pw(pp, ee) for pp, ee in sorted(f.items()))

    def fac_pow(w, kk):
        f = sp.factorint(w)
        return '\\cdot '.join(pw(pp, ee * kk) for pp, ee in sorted(f.items()))

    f_val = sp.factorint(int(val))
    razl = ',\\quad '.join(f'{w}={fac(w)}' for w in (X, Y, Z) if not sp.isprime(w))
    otvet = otvet_chislo(sp.Integer(val))
    return Zadacha(
        tip=TIP, uroven=1, podtip='obshchii-pokazatel',
        uslovie='Вычислите',
        formula=f'\\frac{{{rad(str(X), n1)}\\cdot{rad(str(Y), n2)}}}{{{rad(str(Z), n3)}}}',
        otvet=otvet,
        razbor=[
            *([Shag('Раскладываем подкоренные числа на простые множители', razl)] if razl else []),
            Shag(f'Приводим корни к общему показателю ${Lc}$: $\\sqrt[n]{{X}}=\\sqrt[nk]{{X^k}}$',
                 f'{rad(str(X), n1)}={rad(fac_pow(X, k1), Lc)},\\quad '
                 f'{rad(str(Y), n2)}={rad(fac_pow(Y, k2), Lc)},\\quad '
                 f'{rad(str(Z), n3)}={rad(fac_pow(Z, k3), Lc)}'),
            Shag('Записываем всё под одним корнем и складываем показатели степеней',
                 f'{rad(f"\\frac{{{fac_pow(X, k1)}\\cdot {fac_pow(Y, k2)}}}{{{fac_pow(Z, k3)}}}", Lc)}'
                 f'={rad(fac_pow(int(val), Lc), Lc)}'),
            Shag('Извлекаем корень', f'{rad(fac_pow(int(val), Lc), Lc)}=' + (f'{fac(int(val))}=' if len(f_val) > 1 or max(f_val.values()) > 1 else '') + f'{val}'),
        ],
        podskazki=[
            'На какие простые множители раскладываются подкоренные числа?',
            'Какой общий показатель у корней степеней ' + f'${n1}$, ${n2}$ и ${n3}$?',
            'Что останется под общим корнем после сокращения степеней?',
        ],
        iskhod=expr,
        klyuch=f'pr:{n1}:{n2}:{n3}:{X}:{Y}:{Z}',
    )


PODTIPY = [s_podobnye, s_drob, s_proizvedenie]


_OCHERED = itertools.count()


def generator(rng: random.Random) -> Zadacha | None:
    # подтипы по кругу — в банке из шести задач каждый представлен поровну
    podtip = PODTIPY[next(_OCHERED) % len(PODTIPY)]
    for _ in range(50):
        zd = podtip(rng)
        if zd is not None:
            return zd
    return None
