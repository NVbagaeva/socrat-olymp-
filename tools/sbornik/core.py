"""
Ядро генераторов «Интерактивного сборника для поступающих в вузы».

Каждая задача банка собирается генератором типа и сразу проверяется:
ответ считается sympy, а затем сверяется с исходным выражением
подстановкой в точках внутри области определения. Задача, не прошедшая
проверку, в банк не попадает.

Формат задачи (JSON, см. app/src/data/sbornik/schema.json):

    id        «1.2.017» — глава.тип.номер
    glava     1
    tip       «1.2»
    uroven    1 | 2 | 3   (★ / ★★ / ★★★)
    uslovie   текст, формулы в $…$ (без $$…$$ — сайт их не набирает)
    formula   выражение условия отдельной строкой, TeX без $ (необязательно)
    dopolnenie текст после формулы (необязательно)
    otvet     описание ответа для движка проверки (vid + данные)
    razbor    шаги решения [{chto, tex}] — подпись шага и выкладка
    podskazki вопросы к следующему шагу
    proverka  исходное выражение и переменные — для повторной проверки
              банка (tools/sbornik/check.py) без генераторов

Числа в TeX — с десятичной запятой «2{,}6».
"""

from __future__ import annotations

import json
import math
import random
from dataclasses import dataclass, field
from fractions import Fraction
from typing import Any, Callable, Iterable, Sequence

import sympy as sp

# ── Символы ───────────────────────────────────────────────────────────

a, b, c, d, m, n, p, q, t, u, v, x, y, z, k = sp.symbols('a b c d m n p q t u v x y z k')
SYM = {s.name: s for s in (a, b, c, d, m, n, p, q, t, u, v, x, y, z, k)}


def root(e, deg: int):
    """Арифметический корень степени deg; нечётная степень — и из отрицательного."""
    if deg % 2 == 1:
        return sp.real_root(e, deg)
    return sp.root(e, deg)


# ── TeX ───────────────────────────────────────────────────────────────


def num_tex(val) -> str:
    """Число для условия: целое, десятичная дробь с запятой или \\frac."""
    val = sp.nsimplify(val)
    if val.is_Integer:
        return str(int(val))
    if val.is_Rational:
        fr = Fraction(int(val.p), int(val.q))
        den = fr.denominator
        while den % 2 == 0:
            den //= 2
        while den % 5 == 0:
            den //= 5
        if den == 1:
            s = decimal_str(fr)
            return s.replace('.', '{,}')
        sign = '-' if fr < 0 else ''
        return f'{sign}\\frac{{{abs(fr.numerator)}}}{{{fr.denominator}}}'
    return L(val)


def decimal_str(fr: Fraction) -> str:
    """Конечная десятичная дробь без лишних нулей: 13/5 → «2.6»."""
    sign = '-' if fr < 0 else ''
    fr = abs(fr)
    whole = fr.numerator // fr.denominator
    rest = fr - whole
    digits = ''
    for _ in range(12):
        if rest == 0:
            break
        rest *= 10
        dgt = rest.numerator // rest.denominator
        digits += str(dgt)
        rest -= dgt
    return f'{sign}{whole}' + (f'.{digits}' if digits else '')


def L(e) -> str:
    """TeX выражения sympy в принятом на сайте виде."""
    s = sp.latex(e, ln_notation=True, decimal_separator='comma')
    s = s.replace('\\left(', '(').replace('\\right)', ')')
    s = s.replace('\\left|', '|').replace('\\right|', '|')
    s = s.replace('\\operatorname{tg}', '\\operatorname{tg}')
    return s


def plain(e) -> str:
    """Запись выражения для разбора на сайте (lib/chast2/vyrazhenie)."""
    s = sp.sstr(e)
    s = s.replace('**', '^')
    s = s.replace('Abs(', 'abs(')
    s = s.replace('real_root(', 'root(')
    return s


# ── Точки проверки ────────────────────────────────────────────────────


def _rand_value(rng: random.Random, lo: float, hi: float) -> Fraction:
    """«Некруглое» рациональное число из (lo; hi)."""
    for _ in range(200):
        den = rng.choice([3, 4, 5, 7, 8, 9, 11, 13])
        val = Fraction(rng.randint(math.ceil(lo * den) + 1, math.floor(hi * den) - 1), den)
        if lo < val < hi and val.denominator > 1:
            return val
    return Fraction(lo + hi) / 2


def finite_real(e, subs: dict) -> float | None:
    """Значение выражения в точке, если оно определено и вещественно."""
    try:
        val = complex(sp.N(e.subs(subs), 30))
    except (TypeError, ValueError, ZeroDivisionError):
        return None
    if math.isnan(val.real) or math.isinf(val.real):
        return None
    if abs(val.imag) > 1e-12 * max(1.0, abs(val.real)):
        return None
    return val.real


def sample_points(
    exprs: Sequence[Any],
    ranges: dict,
    usloviya: Sequence[Any] = (),
    count: int = 8,
    seed: int = 0,
) -> list[dict]:
    """
    Точки, где все выражения определены и вещественны и выполнены условия.
    ranges: {символ: (lo, hi)}. Возвращает список {имя: float}.
    """
    rng = random.Random(seed)
    pts: list[dict] = []
    tries = 0
    while len(pts) < count and tries < 4000:
        tries += 1
        subs = {s: sp.Rational(_rand_value(rng, lo, hi)) for s, (lo, hi) in ranges.items()}
        if any(not bool(cond.subs(subs)) for cond in usloviya):
            continue
        if all(finite_real(e, subs) is not None for e in exprs):
            # знаменатели не должны быть почти нулевыми
            pts.append(subs)
    if len(pts) < count:
        raise ValueError(f'мало точек проверки: {len(pts)}')
    return pts


# ── Описания ответов ──────────────────────────────────────────────────


def otvet_chislo(val, tochno: bool = True) -> dict:
    val = sp.nsimplify(val) if not isinstance(val, sp.Basic) else val
    return {
        'vid': 'chislo',
        'tex': L(val) if not val.is_Rational else num_tex(val),
        'zapis': plain(val),
        'znachenie': float(sp.N(val, 20)),
        'tochno': tochno,
    }


def otvet_vyrazhenie(ans, pts: list[dict], forma: Sequence[str] = ()) -> dict:
    vars_ = sorted({s.name for s in ans.free_symbols} | {s.name for s in pts[0]})
    tochki = []
    for subs in pts:
        val = finite_real(ans, subs)
        if val is None:
            raise ValueError('ответ не определён в точке проверки')
        tochki.append({**{s.name: float(vv) for s, vv in subs.items()}, '=': val})
    out = {
        'vid': 'vyrazhenie',
        'tex': L(ans),
        'zapis': plain(ans),
        'peremennye': vars_,
        'tochki': tochki,
    }
    if forma:
        out['forma'] = list(forma)
    return out


def interval_tex(lo, hi, lo_closed=False, hi_closed=False) -> str:
    left = '[' if lo_closed else '('
    right = ']' if hi_closed else ')'
    lo_s = '-\\infty' if lo == -sp.oo else num_tex(lo)
    hi_s = '+\\infty' if hi == sp.oo else num_tex(hi)
    return f'{left}{lo_s};\\,{hi_s}{right}'


def otvet_kusochnyi(var, kuski: Sequence[tuple], seed: int = 0, extra_cond=()) -> dict:
    """
    kuski: [(lo, hi, lo_closed, hi_closed, выражение, исходное)] — на каждом
    промежутке ответ и исходное выражение (для точек).
    """
    out = []
    for i, (lo, hi, lc, hc, ans, src) in enumerate(kuski):
        lo_f = -50.0 if lo == -sp.oo else float(lo)
        hi_f = 50.0 if hi == sp.oo else float(hi)
        pts = sample_points([src, ans], {var: (lo_f, hi_f)}, extra_cond, count=6, seed=seed + i)
        piece = otvet_vyrazhenie(ans, pts)
        piece['oblast'] = {
            'lo': None if lo == -sp.oo else float(lo),
            'hi': None if hi == sp.oo else float(hi),
            'loZakr': bool(lc),
            'hiZakr': bool(hc),
            'tex': interval_tex(lo, hi, lc, hc),
        }
        out.append(piece)
    return {
        'vid': 'kusochnyi',
        'peremennaya': var.name,
        'kuski': out,
        'tex': ';\\ '.join(f"{k['tex']}\\ \\text{{при}}\\ {var.name}\\in{k['oblast']['tex']}" for k in out),
    }


def otvet_chisla(znacheniya: Sequence[tuple[str, Any]]) -> dict:
    """Несколько чисел с подписями: [('A', 2), ('B', -1)]."""
    return {
        'vid': 'chisla',
        'polya': [
            {'podpis': name, **{kk: vv for kk, vv in otvet_chislo(val).items() if kk != 'vid'}}
            for name, val in znacheniya
        ],
        'tex': ',\\ '.join(f'{name}={num_tex(val) if sp.nsimplify(val).is_Rational else L(val)}' for name, val in znacheniya),
    }


# ── Задача и проверка ─────────────────────────────────────────────────


@dataclass
class Shag:
    chto: str
    tex: str = ''

    def to_json(self) -> dict:
        out = {'chto': self.chto}
        if self.tex:
            out['tex'] = self.tex
        return out


@dataclass
class Zadacha:
    tip: str
    uroven: int
    uslovie: str
    otvet: dict
    razbor: list[Shag]
    podskazki: list[str]
    iskhod: Any  # исходное выражение sympy (или число)
    podtip: str = ''
    formula: str = ''  # выражение условия отдельной строкой (TeX без $)
    dopolnenie: str = ''  # текст после формулы: «и найдите значение при …»
    usloviya: list = field(default_factory=list)
    klyuch: str = ''  # подпись для поиска дублей

    def to_json(self, nomer: int) -> dict:
        return {
            'id': f'{self.tip}.{nomer:03d}',
            'glava': int(self.tip.split('.')[0]),
            'tip': self.tip,
            'podtip': self.podtip,
            'uroven': self.uroven,
            'uslovie': self.uslovie,
            **({'formula': self.formula} if self.formula else {}),
            **({'dopolnenie': self.dopolnenie} if self.dopolnenie else {}),
            'otvet': self.otvet,
            'razbor': [s.to_json() for s in self.razbor],
            'podskazki': self.podskazki,
            'proverka': {
                'iskhod': sp.srepr(self.iskhod),
                'usloviya': [sp.srepr(u_) for u_ in self.usloviya],
            },
        }


def proverit(z: Zadacha) -> None:
    """Ответ задачи совпадает с исходным выражением. Иначе — исключение."""
    ot = z.otvet
    if ot['vid'] == 'chislo':
        val = sp.sympify(ot['zapis'].replace('^', '**'), locals={'root': sp.real_root})
        diff = sp.N(z.iskhod - val, 40)
        if abs(complex(diff)) > 1e-25:
            raise AssertionError(f'{z.tip}: число не сходится: {z.iskhod} ≠ {val}')
    elif ot['vid'] == 'vyrazhenie':
        _check_points(z.iskhod, ot, z.tip)
    elif ot['vid'] == 'kusochnyi':
        for piece in ot['kuski']:
            _check_points(z.iskhod, piece, z.tip)
    elif ot['vid'] == 'chisla':
        # iskhod — sp.Tuple значений, найденных независимо (решением
        # уравнения, подстановкой); поля ответа должны с ними совпасть
        vals = list(z.iskhod)
        if len(vals) != len(ot['polya']):
            raise AssertionError(f'{z.tip}: число полей ответа не сходится')
        for want, pole in zip(vals, ot['polya']):
            got = sp.sympify(pole['zapis'].replace('^', '**'), locals={'root': sp.real_root})
            if abs(complex(sp.N(want - got, 40))) > 1e-25:
                raise AssertionError(f'{z.tip}: поле {pole["podpis"]}: {want} ≠ {got}')
    else:
        raise AssertionError(f'неизвестный вид ответа {ot["vid"]}')


def _check_points(src, ot: dict, tip: str) -> None:
    ans = sp.sympify(ot['zapis'].replace('^', '**'), locals={'root': sp.real_root, 'abs': sp.Abs, **SYM})
    for pt in ot['tochki']:
        subs = {SYM[k_]: sp.nsimplify(v_, rational=True) for k_, v_ in pt.items() if k_ != '='}
        s_val = finite_real(src, subs)
        a_val = finite_real(ans, subs)
        if s_val is None or a_val is None:
            raise AssertionError(f'{tip}: выражение не определено в точке {pt}')
        if abs(s_val - a_val) > 1e-9 * max(1.0, abs(s_val)):
            raise AssertionError(f'{tip}: в точке {pt}: исходное {s_val}, ответ {a_val}')
        if abs(a_val - pt['=']) > 1e-9 * max(1.0, abs(a_val)):
            raise AssertionError(f'{tip}: записанное значение в точке {pt} неверно')


# ── Сборка банка типа ─────────────────────────────────────────────────


Generator = Callable[[random.Random], Zadacha | None]


def nabrat(gen: Generator, count: int, seed: int, used: set[str]) -> list[Zadacha]:
    """count разных задач от генератора; дубли по ключу отбрасываются."""
    rng = random.Random(seed)
    out: list[Zadacha] = []
    tries = 0
    while len(out) < count:
        tries += 1
        if tries > count * 400:
            raise RuntimeError(f'генератор не набрал {count} задач (есть {len(out)})')
        try:
            zd = gen(rng)
        except (ValueError, ZeroDivisionError):
            continue
        if zd is None:
            continue
        key = zd.klyuch or zd.uslovie
        if key in used:
            continue
        proverit(zd)
        used.add(key)
        out.append(zd)
    return out


def pick(rng: random.Random, seq: Iterable):
    seq = list(seq)
    return seq[rng.randrange(len(seq))]


def nonzero(rng: random.Random, lo: int, hi: int, exclude: Iterable[int] = ()) -> int:
    ex = set(exclude) | {0}
    while True:
        val = rng.randint(lo, hi)
        if val not in ex:
            return val


def dump(path: str, data: Any) -> None:
    with open(path, 'w', encoding='utf-8') as fh:
        json.dump(data, fh, ensure_ascii=False, indent=1)
        fh.write('\n')


# ── Мелочи записи ─────────────────────────────────────────────────────


def lin(name: str, c0: int) -> str:
    """«x+3», «x-3», «x» — двучлен вида name + c0."""
    if c0 == 0:
        return name
    return f'{name}+{c0}' if c0 > 0 else f'{name}-{-c0}'


def term(coef, body: str = '', first: bool = False) -> str:
    """
    Слагаемое coef·body со знаком: term(3,'x') → «+3x», term(-1,'(x+2)') →
    «-(x+2)», term(5) → «+5»; first=True — без плюса впереди.
    """
    coef = sp.nsimplify(coef)
    if coef == 0:
        return ''
    neg = coef < 0
    mag = -coef if neg else coef
    if body:
        mag_s = '' if mag == 1 else num_tex(mag)
    else:
        mag_s = num_tex(mag)
    sign = '-' if neg else ('' if first else '+')
    return f'{sign}{mag_s}{body}'


def poly_tex(expr, var) -> str:
    """Многочлен по убыванию степеней: 3x^2-5x+2."""
    poly = sp.Poly(sp.expand(expr), var)
    parts = []
    for (deg,), cf in sorted(poly.terms(), key=lambda kv: -kv[0][0]):
        body = '' if deg == 0 else (var.name if deg == 1 else f'{var.name}^{{{deg}}}')
        parts.append(term(cf, body, first=not parts))
    return ''.join(parts) or '0'
