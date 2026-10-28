#!/usr/bin/env python3
"""scripts/check_povyshennye.py — второй, независимый счёт ответов раздела
«Варианты повышенной сложности» на sympy.

Запуск:
    node scripts/check-povyshennye.mjs --json /tmp/pv.json
    python3 -I scripts/check_povyshennye.py /tmp/pv.json

Ответ каждой версии считается заново из параметров шаблона — точной
арифметикой, решением уравнений и подстановкой (sympy), без кода сайта —
и сравнивается с ответом, который собрал движок раздела в браузерном
коде. Плюс формат ответа ЕГЭ: целое или конечная десятичная дробь.
"""

import json
import sys
from fractions import Fraction as F

import sympy as sp

x, t, v = sp.symbols("x t v", real=True)


def R(a):
    return sp.Rational(str(a))


def z01(p):
    a = sp.sqrt(p["a"])
    return sp.Rational(1, 2) * a * a * sp.sin(sp.pi / 6)


def z02(p):
    u = sp.Matrix([p["ax"], p["ay"]]) * R(p["k"])
    w = sp.Matrix([p["bx"], p["by"]]) * R(p["m"])
    return u.dot(w)


def z03(p):
    # Шар радиуса r в цилиндре: V_цил = πr²·2r; V_шара = 4/3·πr³.
    r = sp.symbols("r", positive=True)
    rr = sp.solve(sp.Eq(sp.pi * r**2 * 2 * r, p["V"]), r)[0]
    return sp.simplify(sp.Rational(4, 3) * sp.pi * rr**3)


def z04(p):
    return R(p["p1"]) - R(p["p2"])


def z05(p):
    a = [(3, R(p["w1"])), (1, R(p["d1"])), (0, 1 - R(p["w1"]) - R(p["d1"]))]
    b = [(3, R(p["w2"])), (1, R(p["d2"])), (0, 1 - R(p["w2"]) - R(p["d2"]))]
    return sum(pa * pb for oa, pa in a for ob, pb in b if oa + ob >= 4)


def z06(p):
    xs = [0] + list(p["k"])
    ns = [p["n0"]] + list(p["n"])
    assert sum(ns) == 100, "частоты не дают 100"
    return sum(sp.Rational(xi * ni, 100) for xi, ni in zip(xs, ns))


def z07(p):
    # Показатель kx + b; по умолчанию b − x (вариант 1).
    k = p.get("k", -1)
    sol = sp.solve(sp.Eq(sp.Integer(p["c"]) ** (k * x + p["b"]), sp.sqrt(sp.Integer(p["a"]) ** p["m"])), x)
    assert len(sol) == 1, sol
    return sol[0]


def z08(p):
    a, b = sp.symbols("a b", positive=True)
    # log_b a = t  ⇒  a = b^t; подставляем и упрощаем log_a(b^m·√a).
    expr = sp.log(b ** p["m"] * sp.sqrt(b ** p["t"]), b ** p["t"])
    return sp.nsimplify(sp.simplify(sp.expand_log(expr, force=True)))


def z09(p):
    # Узлы f′: нули — узлы с y = 0; максимум f — смена знака с + на −.
    u = p["uzly"]
    best = []
    for i in range(1, len(u) - 1):
        if u[i][1] == 0 and p["p"] < u[i][0] < p["q"] and u[i - 1][1] > 0 and u[i + 1][1] < 0:
            best.append(u[i][0])
    assert len(best) == 1, best
    return sp.Integer(best[0])


def z10(p):
    h = R(p["h0"]) + p["v0"] * t - R(p["g2"]) * t**2
    r = sorted(sp.solve(sp.Eq(h, R(p["H"])), t))
    return r[1] - r[0]


def z11(p):
    sol = [s for s in sp.solve(sp.Eq(p["S"] / (v - p["dv"]) - p["S"] / v, sp.Rational(p["dt"], 60)), v) if s > p["dv"]]
    assert len(sol) == 1, sol
    return sol[0]


def z12(p):
    # f(x) = c·log_r x по точкам; решаем f(x) = y0.
    k = p["c"] / sp.log(p["r"])
    for m in p["marks"]:
        assert sp.simplify(k * sp.log(m)).is_integer, "точка не в узле"
    return sp.solve(sp.Eq(k * sp.log(x), p["y0"]), x)[0]


def z13(p):
    S = R(p["S"]) * 10**6
    d, total = S, 0
    for _ in range(p["n"]):
        total += d * R(p["r"]) / 100 + S / p["n"]
        d -= S / p["n"]
    return total


SCHET = {
    "z01.ravnobedr-koren": z01,
    "z02.skalyar-km": z02,
    "z03.shar-v-cilindre": z03,
    "z04.ne-menee": z04,
    "z05.dve-partii": z05,
    "z06.chastoty": z06,
    "z07.koren": z07,
    "z08.log-obratnyy": z08,
    "z09.max-na-otrezke": z09,
    "z10.vysota": z10,
    "z11.bystryy": z11,
    "z12.k-log": z12,
    "z13.dif-summa": z13,
}


# ── Партия 1 (варианты 2–6) ─────────────────────────────────────


def z01_150(p):
    a = sp.sqrt(p["a"])
    return sp.Rational(1, 2) * a * a * sp.sin(5 * sp.pi / 6)


def z01_menshiy(p):
    # Средние линии треугольников ABC и ACD — половины оснований.
    return sp.Rational(min(p["a"], p["b"]), 2)


def z01_diagonali(p):
    # Середины диагоналей в координатах: A(0,0), D(b,0), B(s,h), C(s+a,h).
    s_, h = sp.symbols("s h", positive=True)
    a, b = sorted([p["a"], p["b"]])
    A, B, C, D = sp.Matrix([0, 0]), sp.Matrix([s_, h]), sp.Matrix([s_ + a, h]), sp.Matrix([b, 0])
    d = (A + C) / 2 - (B + D) / 2
    return sp.simplify(sp.sqrt(d.dot(d)))


def z01_vneshnie(p):
    return sp.Integer(180) - (180 - p["a"]) - (180 - p["c"])


def z02_dlina(p):
    r = R(p.get("m", 1)) * sp.Matrix([p["ax"], p["ay"]]) + R(p["k"]) * sp.Matrix([p["bx"], p["by"]])
    return sp.sqrt(r.dot(r))


def z02_perp(p):
    u = sp.symbols("u")
    q = {k: (u if k == p["neizv"] else R(p[k])) for k in ("ax", "ay", "bx", "by")}
    return sp.solve(sp.Eq(q["ax"] * q["bx"] + q["ay"] * q["by"], 0), u)[0]


def z03_cilindr(p):
    r = sp.symbols("r", positive=True)
    rr = sp.solve(sp.Eq(sp.Rational(4, 3) * sp.pi * r**3, R(p["V"])), r)[0]
    return sp.simplify(sp.pi * rr**2 * 2 * rr)


def z03_prizma(p):
    r, h = R(p["r"]), R(p["h"])
    return 2 * (2 * r) ** 2 + 4 * (2 * r) * h


def z03_konus(p):
    # Конус в шаре, r = R: высота R, V_кон = πR³/3, V_шара = 4πR³/3.
    r = sp.symbols("r", positive=True)
    rr = sp.solve(sp.Eq(sp.Rational(4, 3) * sp.pi * r**3, R(p["V"])), r)[0]
    return sp.simplify(sp.pi * rr**2 * rr / 3)


def z03_shar(p):
    r = sp.symbols("r", positive=True)
    rr = sp.solve(sp.Eq(sp.pi * r**3 / 3, R(p["V"])), r)[0]
    return sp.simplify(sp.Rational(4, 3) * sp.pi * rr**3)


def z04_delitsya(p):
    xs = range(p["a"], p["b"] + 1)
    return sp.Rational(sum(1 for n in xs if n % p["d"] == 0), len(xs))


def z04_prot(p):
    return 1 - R(p["p"])


def z05_mezhdu(p):
    return R(p["p1"]) + R(p["p2"]) - 1


def z05_kost(p):
    pary = [(a, b) for a in range(1, 7) for b in range(1, 7) if a + b != p["s"]]
    q = sp.Rational(sum(1 for a, b in pary if p["g"] in (a, b)), len(pary))
    return sp.Rational(round(q * 100), 100)


def z06_disp(p):
    ps = [sp.Rational(n, p["den"]) for n in p["ps"]]
    E = sum(x_ * q for x_, q in zip(p["xs"], ps))
    return sum((x_ - E) ** 2 * q for x_, q in zip(p["xs"], ps))


def z06_sigma(p):
    return sp.sqrt(z06_disp(p))


def z04_chastota(p):
    return sp.Abs(R(p["p"]) - sp.Rational(p["k"], p["N"]))


def z04_sootech(p):
    # Перебор: участник на следующем месте — любой из оставшихся n − 1.
    ostalnye = [1] * (p["m"] - 1) + [0] * (p["n"] - p["m"])
    return sp.Rational(sum(ostalnye), len(ostalnye))


def z04_bez_defekta(p):
    return 1 - sp.Rational(p["k"], p["N"])


def z05_misheni(p):
    a1, a2, b1, b2 = (R(p[k]) for k in ("a1", "a2", "b1", "b2"))
    dva = lambda x, y: 1 - (1 - x) * (1 - y)  # noqa: E731
    return sp.Max(dva(a1, a2) * b1, a1 * dva(b1, b2))


def z05_tsvet(p):
    n1 = p["a1"] + p["b1"]
    n2 = p["a2"] + p["b2"]
    return sp.Rational(p["a1"] * p["a2"] + p["b1"] * p["b2"], n1 * n2)


def z05_oba(p):
    # P(A) + P(B) − P(A ∪ B), P(A ∪ B) = 1 − P(ни в одном).
    AB = sp.symbols("AB")
    return sp.solve(sp.Eq(2 * R(p["p"]) - AB, 1 - R(p["r"])), AB)[0]


def z06_strahovka(p):
    c = sp.symbols("c")
    pr = sp.Rational(p["pn"], p["pden"])
    E = c * (1 - pr) + (c - R(p["V"])) * pr
    return sp.solve(sp.Eq(E, R(p["R"])), c)[0]


def z06_promezhutok(p):
    lo = (lambda x: x > p["a"]) if p["zl"] == "lt" else (lambda x: x >= p["a"])
    hi = (lambda x: x < p["b"]) if p["zr"] == "lt" else (lambda x: x <= p["b"])
    return sum(sp.Rational(n, p["den"]) for x_, n in zip(p["xs"], p["ps"]) if lo(x_) and hi(x_))


def z07_log_stepeni(p):
    a = sp.Integer(p["a"])
    e = p["k"] * x + p["b"]
    sol = sp.solve(sp.Eq(e * p["r"] * sp.log(a), p["m"] * p["j"] * sp.log(a)), x)
    assert len(sol) == 1, sol
    return sol[0]


def z07_postoronniy(p):
    c = R(p["c"])
    sol = [s_ for s_ in sp.solve(sp.Eq(c - x, x**2 - x), x) if (c - s_) > 0 and (s_**2 - s_) > 0]
    return max(sol)


def z08_pryamoy(p):
    b = sp.symbols("b", positive=True)
    a = b ** p["t"]
    expr = sp.log(a ** p["m"] * sp.sqrt(b), a)
    return sp.nsimplify(sp.simplify(sp.expand_log(expr, force=True)))


def z08_sin(p):
    xx = sp.Integer(p["x"]) * sp.pi / 180
    return sp.nsimplify(sp.simplify(2 * p["c"] * sp.sin(xx) * sp.cos(xx) / sp.sin(2 * sp.pi - 2 * xx)))


def z08_stepeni(p):
    b = sp.Integer(p["b"])
    return sp.simplify((b ** p["s1"]) ** R(p["x"]) / (b ** p["s2"]) ** R(p["y"]))


def nuli9(p):
    u = p["uzly"]
    return [(u[i][0], "max" if u[i - 1][1] > 0 else "min") for i in range(1, len(u) - 1) if u[i][1] == 0]


def z09_min(p):
    best = [x_ for x_, tip in nuli9(p) if tip == "min" and p["p"] < x_ < p["q"]]
    assert len(best) == 1, best
    return sp.Integer(best[0])


def z09_chislo(p):
    return sp.Integer(sum(1 for x_, tip in nuli9(p) if p["p"] <= x_ <= p["q"] and (p["tip"] == "extr" or tip == p["tip"])))


def z09_skorost(p):
    xt = R(p["a2"]) * t**2 + R(p["a1"]) * t + R(p["a0"])
    return sp.diff(xt, t).subs(t, p["t0"])


def z10_adiabata(p):
    V2 = sp.symbols("V2", positive=True)
    k = sp.Rational(7, 5)
    return sp.solve(sp.Eq(R(p["p1"]) * R(p["V1"]) ** k, R(p["p2"]) * V2**k), V2)[0]


def z10_motocikl(p):
    r = [s_ for s_ in sp.solve(sp.Eq(p["v0"] * t + R(p["a"]) * t**2 / 2, p["S"]), t) if s_ > 0]
    return r[0] * 60


def z11_sobstvennaya(p):
    c = R(p["c"])
    sol = [s_ for s_ in sp.solve(sp.Eq(p["S"] / (v + c) + p["S"] / (v - c), R(p["T"]) - R(p["st"])), v) if s_ > c]
    assert len(sol) == 1, sol
    return sol[0]


def z11_ocheredno(p):
    T = sp.symbols("T", positive=True)
    d1, d2 = R(p["d1"]), R(p["d2"])
    return sp.solve(sp.Eq(T / p["t"] + (T - d1) / p["t"] + (T - d1 - d2) / p["t"], 1), T)[0]


def z12_giperbola(p):
    (ax, ay), (px, py) = p["A"], p["P"]
    k = ax * ay
    m = sp.Rational(py - ay, px - ax)
    b = ay - m * ax
    sol = [s_ for s_ in sp.solve(sp.Eq(k / x, m * x + b), x) if s_ != ax]
    assert len(sol) == 1, sol
    return sol[0]


def z12_koren(p):
    fx, fy = p["F"]
    a = sp.Rational(fy**2, fx)
    sol = [s_ for s_ in sp.solve(sp.Eq(a * x, x - p["b"]), x) if s_ >= 0]
    return sol[0]


def z13_stavka(p):
    k = sp.symbols("k", positive=True)
    kk = [s_ for s_ in sp.solve(sp.Eq((p["S"] * k + p["x"]) * k, R(p["Z"])), k) if s_ > 1]
    return (kk[0] - 1) * 100


def z13_posledniy(p):
    S = R(p["S"]) * 10**6
    return S * (1 - R(p["q"]) / 100) ** (p["n"] - 1) * (1 + R(p["r"]) / 100)


SCHET.update({
    "z01.ravnobedr-150": z01_150,
    "z01.trapeciya-menshiy": z01_menshiy,
    "z01.trapeciya-diagonali": z01_diagonali,
    "z01.vneshnie-ugly": z01_vneshnie,
    "z02.dlina-po-risunku": z02_dlina,
    "z02.perpendikulyar": z02_perp,
    "z03.cilindr-okolo-shara": z03_cilindr,
    "z03.prizma-okolo-cilindra": z03_prizma,
    "z03.konus-v-share": z03_konus,
    "z03.shar-okolo-konusa": z03_shar,
    "z04.bolshe": z04,
    "z04.delitsya": z04_delitsya,
    "z04.protivopolozhnoe": z04_prot,
    "z05.mezhdu": z05_mezhdu,
    "z05.kost-uslovie": z05_kost,
    "z06.dispersiya": z06_disp,
    "z06.otklonenie": z06_sigma,
    "z04.chastota": z04_chastota,
    "z04.sootechestvennik": z04_sootech,
    "z04.bez-defekta": z04_bez_defekta,
    "z04.ne-podtekaet": z04_bez_defekta,
    "z05.dve-misheni": z05_misheni,
    "z05.odin-tsvet": z05_tsvet,
    "z05.oba-zakonchilis": z05_oba,
    "z06.strahovka-tys": z06_strahovka,
    "z06.promezhutok": z06_promezhutok,
    "z07.log-stepeni": z07_log_stepeni,
    "z07.log-postoronniy": z07_postoronniy,
    "z08.log-pryamoy": z08_pryamoy,
    "z08.sin-dvoynoy": z08_sin,
    "z08.stepeni-chastnoe": z08_stepeni,
    "z09.min-na-otrezke": z09_min,
    "z09.chislo-na-otrezke": z09_chislo,
    "z09.skorost": z09_skorost,
    "z10.adiabata": z10_adiabata,
    "z10.motocikl": z10_motocikl,
    "z11.sobstvennaya": z11_sobstvennaya,
    "z11.ocheredno": z11_ocheredno,
    "z12.giperbola-pryamaya": z12_giperbola,
    "z12.koren-koren": z12_koren,
    "z13.stavka-vklada": z13_stavka,
    "z13.posledniy-platezh": z13_posledniy,
})


# ── Партия 2, группа g1 (варианты 7–12, №1–3) ───────────────────


def z01_trapeciya_radius(p):
    # Описанная: сумма боковых = P/2; меньшая боковая — высота = 2r.
    r = sp.symbols("r", positive=True)
    return sp.solve(sp.Eq(2 * r + p["c"], R(p["per"]) / 2), r)[0]


def z01_osnovanie_cos(p):
    # Теорема косинусов в ABC для угла A: BC² = AB² + AC² − 2·AB·AC·cos A, BC = AC.
    x = sp.symbols("x", positive=True)
    l = R(p["l"])
    return sp.solve(sp.Eq(l**2, x**2 + l**2 - 2 * x * l * R(p["c"])), x)[0]


def z01_bok_sin(p):
    # Угол при основании острый: cos A = +√(1 − sin²A); дальше теорема косинусов для AC = BC = y.
    y = sp.symbols("y", positive=True)
    c, cosA = R(p["c"]), sp.sqrt(1 - R(p["s"]) ** 2)
    return sp.solve(sp.Eq(y**2, c**2 + y**2 - 2 * c * y * cosA), y)[0]


def ugly_bissektrisa(p):
    # Координаты (40 знаков): A(0,0), C(1,0), B над серединой AC; F — где биссектриса из A
    # пересекает BC (делит BC в отношении AB : AC — свойство биссектрисы).
    import mpmath as mp

    mp.mp.dps = 40
    pri = (180 - mp.mpf(p["b"])) / 2 * mp.pi / 180
    A, C = mp.matrix([0, 0]), mp.matrix([1, 0])
    B = mp.matrix([mp.mpf(1) / 2, mp.tan(pri) / 2])
    AB = mp.norm(B - A)
    F = B + (C - B) * (AB / (AB + 1))

    def ugol(P, Q, Rr):
        u, w = P - Q, Rr - Q
        val = mp.acos((u[0] * w[0] + u[1] * w[1]) / (mp.norm(u) * mp.norm(w))) * 180 / mp.pi
        return sp.nsimplify(sp.Float(mp.nstr(val, 35), 35), tolerance=sp.Rational(1, 10**25), rational=True)

    return F, A, B, C, ugol


def z01_afc(p):
    F, A, B, C, ugol = ugly_bissektrisa(p)
    return ugol(A, F, C)


def z01_afb(p):
    F, A, B, C, ugol = ugly_bissektrisa(p)
    return ugol(A, F, B)


def z02_skalyar_ris(p):
    return (R(p["k"]) * sp.Matrix([p["ax"], p["ay"]])).dot(sp.Matrix([p["bx"], p["by"]]))


def z02_dlina_km(p):
    r = p["k"] * sp.Matrix([p["ax"], p["ay"]]) + p["m"] * sp.Matrix([p["bx"], p["by"]])
    return sp.sqrt(r.dot(r))


def z03_prizma_gip(p):
    q = sp.sqrt(p["q"])
    a, b = p["a"] * q, p["b"] * q
    c = sp.sqrt(a**2 + b**2)
    return sp.simplify(a * b + (a + b + c) * c)


def z03_bez_piramidy(p):
    # Наклонная призма по координатам: объём остатка — выпуклая оболочка A, B, A1, B1, C1.
    V = R(p["V"])
    h = sp.symbols("h", positive=True)
    A, B, C = sp.Matrix([0, 0, 0]), sp.Matrix([4, 0, 0]), sp.Matrix([1, 3, 0])
    s = sp.Matrix([1, 2, h])
    hh = sp.solve(sp.Eq(sp.Rational(1, 2) * 4 * 3 * h, V), h)[0]
    tet = lambda P, Q, Rr, S: abs((Q - P).dot((Rr - P).cross(S - P))) / 6
    A1, B1, C1 = A + s, B + s, C + s
    ost = tet(A, B, A1, C1) + tet(B, A1, B1, C1)
    return sp.simplify(ost.subs(h, hh))


def z03_delit(p):
    V, m, n = R(p["V"]), p["m"], p["n"]
    h = sp.symbols("h", positive=True)
    A, B, C = sp.Matrix([0, 0, 0]), sp.Matrix([6, 0, 0]), sp.Matrix([2, 5, 0])
    S = sp.Matrix([1, 1, h])
    hh = sp.solve(sp.Eq(sp.Rational(1, 3) * 15 * h, V), h)[0]
    M = S + sp.Rational(m, m + n) * (C - S)
    tet = lambda P, Q, Rr, T: abs((Q - P).dot((Rr - P).cross(T - P))) / 6
    return sp.simplify(sp.Min(tet(S, A, B, M), tet(M, A, B, C)).subs(h, hh))


def z03_cilindry(p):
    r, h = sp.symbols("r h", positive=True)
    V1 = sp.pi * r**2 * h
    V2 = sp.pi * (r / R(p["b"])) ** 2 * (h * R(p["a"]))
    return sp.simplify(V2 / V1 * R(p["V"]))


def z03_kruzhki(p):
    d, h = sp.symbols("d h", positive=True)
    V1 = sp.pi * (d / 2) ** 2 * (h * R(p["hk"]))
    V2 = sp.pi * (d * R(p["wk"]) / 2) ** 2 * h
    return sp.simplify(V2 / V1)


SCHET.update({
    "z01.trapeciya-radius": z01_trapeciya_radius,
    "z01.ravnobedr-osnovanie-cos": z01_osnovanie_cos,
    "z01.ravnobedr-bok-sin": z01_bok_sin,
    "z01.bissektrisa-afc": z01_afc,
    "z01.bissektrisa-afb": z01_afb,
    "z02.skalyar-po-risunku": z02_skalyar_ris,
    "z02.dlina-km": z02_dlina_km,
    "z03.prizma-gipotenuza": z03_prizma_gip,
    "z03.prizma-bez-piramidy": z03_bez_piramidy,
    "z03.piramida-delit-rebro": z03_delit,
    "z03.dva-cilindra-vyshe": z03_cilindry,
    "z03.dve-kruzhki": z03_kruzhki,
})


# ── Партия 2: №7, №8, №12 вариантов 7–12 ─────────────────────────


def z07_kub(p):
    sol = [s_ for s_ in sp.solve(sp.Eq((1 / x + p["c"]) ** 3, p["d"]), x) if s_.is_real]
    assert len(sol) == 1, sol
    return sol[0]


def z07_x2(p):
    a, b = R(p["a"]), R(p["b"])
    sol = [s_ for s_ in sp.solve(sp.Eq(a * x**2 - b, x**4), x) if s_.is_real and a * s_**2 - b >= 0]
    return min(sol)


def z07_smesh(p):
    c = p["w"] + sp.Rational(p["n"], p["m"])
    sol = [s_ for s_ in sp.solve(sp.Eq(p["k"] * x, (c * x) ** 2), x) if s_ >= 0]
    assert 0 in sol, sol
    return max(sol)


def z08_chastnoe(p):
    A, B = sp.Integer(p["a"]) ** p["i"], sp.Integer(p["b"]) ** p["j"]
    C, D = sp.Integer(p["a"]) ** p["k"], sp.Integer(p["b"]) ** p["l"]
    return sp.nsimplify(sp.simplify(sp.log(B, A) / sp.log(D, C)))


def z08_trig(p):
    fns = {"sin": sp.sin, "cos": sp.cos, "tg": sp.tan}
    val = lambda u: fns[u[0]](sp.Rational(u[1], u[2]) * sp.pi)
    e = p["k"] * sp.sqrt(p["r"])
    for u in p["f"]:
        e *= val(u)
    return sp.nsimplify(sp.simplify(e / val(p["g"])))


def z08_ambn(p):
    a, b = sp.symbols("a b", positive=True)
    L = R(p["t"]) if p["dano"] == "ab" else 1 / R(p["t"])
    arg = a ** p["m"] * b ** p["n"] if p["op"] == "umn" else a ** p["m"] / b ** p["n"]
    e = sp.expand_log(sp.log(arg) / sp.log(a), force=True)
    return sp.simplify(e.subs(sp.log(b), L * sp.log(a)))


def z12_parabola_b(p):
    a = sp.symbols("a")
    b, c = R(p["b"]), R(p["c"])
    qx, qy = p["Q"]
    aa = sp.solve(sp.Eq(a * qx**2 + b * qx + c, qy), a)[0]
    return aa * p["x0"] ** 2 + b * p["x0"] + c


def z12_pokaz(p):
    px, py = p["P"]
    a = sp.Integer(py) ** sp.Rational(1, px)
    return sp.simplify(a ** p["m"] / a ** p["n"])


def z12_korni(p):
    a, b, c = sp.symbols("a b c")
    s = sp.solve([a * p["x1"] ** 2 + b * p["x1"] + c, a * p["x2"] ** 2 + b * p["x2"] + c, c - p["c"]], [a, b, c])
    return s[a] * p["x0"] ** 2 + s[b] * p["x0"] + s[c]


SCHET.update({
    "z07.kub-obratnoe": z07_kub,
    "z07.koren-x2": z07_x2,
    "z07.koren-smeshannoe": z07_smesh,
    "z08.log-chastnoe-stepeney": z08_chastnoe,
    "z08.trig-privedenie": z08_trig,
    "z08.log-am-bn": z08_ambn,
    "z12.parabola-b": z12_parabola_b,
    "z12.pokazatelnaya-otnoshenie": z12_pokaz,
    "z12.parabola-korni": z12_korni,
})


# ── Партия 2 (варианты 7–12) ────────────────────────────────────


def z09_kasat(p):
    # Наклон прямой через два узла; узел касания лежит на ней.
    (ax, ay), (bx, by) = p["A"], p["B"]
    k = sp.Rational(by - ay, bx - ax)
    y0 = dict((u[0], u[1]) for u in p["uzly"])[p["x0"]]
    assert ay + k * (p["x0"] - ax) == y0, "касательная мимо узла"
    return k


def z09_znak(p):
    # Знак f′ в целой точке: по участку монотонности между узлами-экстремумами.
    u = p["uzly"]
    ext = [u[0][0]] + [u[i][0] for i in range(1, len(u) - 1) if (u[i][1] - u[i - 1][1]) * (u[i + 1][1] - u[i][1]) < 0] + [u[-1][0]]
    val = dict((a, b) for a, b in u)
    n = 0
    for m in p["metki"]:
        assert m not in ext[1:-1], "точка в вершине"
        lo = max(e for e in ext if e < m)
        hi = min(e for e in ext if e > m)
        s = 1 if val[hi] > val[lo] else -1
        n += s == p["znak"]
    return sp.Integer(n)


def z10_linza(p, naib=False):
    d1, d2 = sp.symbols("d1 d2", positive=True)
    f = p["f"]
    kr = [sp.solve(sp.Eq(1 / d1 + 1 / R(p[k]), sp.Rational(1, f)), d1)[0] for k in ("d2max", "d2min")]
    lo, hi = max(R(p["d1min"]), min(kr)), min(R(p["d1max"]), max(kr))
    assert lo <= hi
    return hi if naib else lo


def z10_dolya(p):
    A = p["ak"] * sp.sqrt(p["am"])
    tau = R(p["tau"])
    reg = sp.solveset(A * sp.sin(sp.pi * t / p["T"]) <= p["c"], t, sp.Interval(0, tau))
    return sp.nsimplify(reg.measure / tau)


def z10_raspad(p):
    return sp.solve(sp.Eq(p["m0"] * 2 ** (-t / sp.Integer(p["T"])), p["m"]), t)[0]


def z11_tri(p):
    X, Y = sp.symbols("X Y", positive=True)
    a, b, c = p["a"], p["b"], p["c"]
    e1 = sp.Eq(a * X + b * Y + c * p["m1"], p["p1"] * (X + Y + p["m1"]))
    e2 = sp.Eq(a * X + b * Y + c * p["m2"], p["p2"] * (X + Y + p["m2"]))
    s = sp.solve([e1, e2], [X, Y], dict=True)[0]
    return s[X] if p["ask"] == "a" else s[Y]


def z11_suda(p):
    return sp.solve(sp.Eq(v * sp.Rational(p["t"], 60), sp.Rational(p["a"] + p["L1"] + p["L2"] + p["b"], 1000)), v)[0]


def z11_put(p):
    S = sp.symbols("S", positive=True)
    s = sp.solve(sp.Eq(S / (p["v"] + p["c"]) + S / (p["v"] - p["c"]), p["T"] - p["st"]), S)[0]
    return 2 * s


def z13_dif_stavka(p):
    r = sp.symbols("r", positive=True)
    S, n = p["S"], p["n"]
    total = sum((S - i * sp.Rational(S, n)) * r / 100 + sp.Rational(S, n) for i in range(n))
    return sp.solve(sp.Eq(total, p["T"]), r)[0]


def z13_popolneniya(p):
    X = sp.symbols("X", positive=True)
    k = 1 + R(p["r"]) / 100
    return sp.solve(sp.Eq(((p["S"] * k + X) * k + X) * k, p["Z"]), X)[0]


def z13_summa_ub(p):
    S = R(p["S"]) * 10**6
    k = 1 + R(p["r"]) / 100
    m = 1 - R(p["q"]) / 100
    dolgi = [S * m**i for i in range(p["n"])] + [0]
    return sum(dolgi[i] * k - dolgi[i + 1] for i in range(p["n"]))


SCHET.update({
    "z09.kasatelnaya": z09_kasat,
    "z09.znak-v-tochkah": z09_znak,
    "z10.linza": z10_linza,
    "z10.linza-max": lambda p: z10_linza(p, True),
    "z10.dolya-vremeni": z10_dolya,
    "z10.raspad": z10_raspad,
    "z11.tri-rastvora": z11_tri,
    "z11.suhogruzy": z11_suda,
    "z11.ves-put": z11_put,
    "z13.dif-stavka": z13_dif_stavka,
    "z13.ravnye-popolneniya": z13_popolneniya,
    "z13.summa-ubyvanie": z13_summa_ub,
})


# ── Партия 3: варианты 13–18 ─────────────────────────────────────


def okr2(q):
    return sp.Rational(round(q * 100), 100)


def p3_par_bis(p):
    # AB = AK (накрест лежащие углы), AD = AK + KD, периметр — система.
    ab, ad, tt = sp.symbols("ab ad tt", positive=True)
    s = sp.solve([sp.Eq(ab, p["m"] * tt), sp.Eq(ad, (p["m"] + p["n"]) * tt), sp.Eq(2 * (ab + ad), p["per"])], [ab, ad, tt])
    return s[ad]


def p3_dve_bis(p):
    ab = sp.symbols("ab", positive=True)
    a = sp.solve(sp.Eq(2 * (ab + 2 * ab), p["per"]), ab)[0]
    return 2 * a if p["k"] else a


def p3_vys_sin(p):
    # Основание AC = a, высота к боковой стороне h: sin C = h / a.
    return R(p["h"]) / p["a"]


def p3_vys_cos(p):
    return sp.sqrt(p["a"] ** 2 - p["h"] ** 2 * p["m"]) / p["a"]


def p3_vpis(p):
    ost = [180 - p["a"], 180 - p["b"]]
    return max(ost) if p["k"] else min(ost)


def p3_cos(p):
    a = sp.Matrix([p["ax"], p["ay"]])
    b = sp.Matrix([p["bx"], p["by"]])
    return sp.nsimplify(a.dot(b) / (a.norm() * b.norm()))


def p3_konus(p):
    r, l = sp.symbols("r l", positive=True)
    kr = R(p["r"]) if p["rv"] else 1 / R(p["r"])
    kl = R(p["l"]) if p["lv"] else 1 / R(p["l"])
    q = sp.simplify(sp.pi * kr * r * kl * l / (sp.pi * r * l))
    return q if q > 1 else 1 / q


def p3_kub(p):
    a = sp.symbols("a", positive=True)
    return sp.solve(sp.Eq(a * sp.sqrt(3), 2 * R(p["k"]) * sp.sqrt(3)), a)[0] ** 3


def p3_sfera(p):
    return 6 * (2 * R(p["r"])) ** 2


def p3_piramida(p):
    return sp.Rational(1, 3) * p["a"] * p["c"] * p["b"]


def p3_tetraedr(p):
    return sp.Rational(1, 3) * sp.Rational(1, 2) * p["a"] * p["b"] * p["c"]


def p3_pary(p):
    return sp.Rational(p["m"] - 1, p["n"] - 1)


def p3_tri(p):
    return R(p["p1"]) + R(p["p2"]) - 1


def p3_taksi(p):
    m = p["n"] - p["k"] if p["vtoroy"] == 1 else p["k"]
    return sp.Rational(m, p["n"])


def p3_odna(p):
    n = p["n"]
    g = n // 2
    q = sp.Rational(2 * sp.binomial(n - 3, g - 3), sp.binomial(n, g))
    return okr2(q) if p["okr"] == 2 else q


def p3_dve(p):
    n = p["n"]
    g = n // 3
    vse = sp.binomial(n, g) * sp.binomial(n - g, g)
    razn = 6 * sp.binomial(n - 3, g - 1) * sp.binomial(n - 3 - (g - 1), g - 1)
    return okr2(1 - sp.Rational(razn, vse))


def p3_summa(p):
    import itertools

    vse = 0
    bl = 0
    for n in range(1, p["s"] + 1):
        for seq in itertools.product(range(1, 7), repeat=n):
            if sum(seq) == p["s"]:
                vse += sp.Rational(1, 6**n)
                if n == p["k"]:
                    bl += sp.Rational(1, 6**n)
    return okr2(bl / vse)


def p3_bern(p):
    q = R(p["p"])
    return okr2(sp.binomial(p["n"], p["k"]) * q ** p["k"] * (1 - q) ** (p["n"] - p["k"]))


def p3_lot(p):
    return sp.Rational(sum(a * b for a, b in zip(p["w"], p["c"])), p["N"])


def p3_ozh(p):
    return sum(sp.Rational(a * b, p["den"]) for a, b in zip(p["xs"], p["ps"]))


def p3_step(p):
    return [r for r in sp.solve((x + p["a"]) ** p["n"] - p["b"], x) if r.is_real][0]


def p3_pokaz(p):
    a = p["a"]
    return sp.solve(sp.Eq((a ** p["s"]) ** (p["k"] * x + p["b"]), (a ** p["r"]) ** (p["m"] * x + p["c"])), x)[0]


def p3_logkv(p):
    a = p["a"]
    eq = sp.Eq(a * (p["p"] * x + p["q"]), (x + p["e"]) ** 2)
    good = [r for r in sp.solve(eq, x) if p["p"] * r + p["q"] > 0 and r + p["e"] > 0]
    return min(good)


def p3_cos2(p):
    a = p["n"] * sp.pi / p["den"]
    A = p["A"]
    if p["vid"] == "raznost":
        return sp.nsimplify(sp.simplify(sp.sqrt(A) * sp.cos(a) ** 2 - sp.sqrt(A) * sp.sin(a) ** 2))
    return sp.nsimplify(sp.simplify(sp.sqrt(4 * A) * sp.cos(a) ** 2 - sp.sqrt(A)))


def p3_steplog(p):
    return sp.simplify(sp.Integer(p["a"]) ** (p["n"] + sp.log(p["b"], p["a"])))


def p3_tg(p):
    v = p["sign"] * p["a"] * sp.sqrt(p["r"]) / (p["b"] * sp.sqrt(p["s"]))
    lo, hi = {1: (0, sp.pi / 2), 2: (sp.pi / 2, sp.pi), 3: (sp.pi, 3 * sp.pi / 2), 4: (3 * sp.pi / 2, 2 * sp.pi)}[p["q"]]
    al = sp.symbols("al")
    f = sp.cos if p["f"] == "cos" else sp.sin
    for r in sp.solve(sp.Eq(f(al), v), al) + [2 * sp.pi + r for r in sp.solve(sp.Eq(f(al), v), al)]:
        if lo < r.evalf() < hi:
            return sp.nsimplify(sp.simplify(sp.tan(r)))
    raise ValueError("угол не в четверти")


def p3_skorost(p):
    xt = sum(sp.Rational(n, d) * t**k for n, d, k in p["chleny"])
    return sp.diff(xt, t).subs(t, p["t0"])


def p3_gor(p):
    h = sp.symbols("h", positive=True)
    h1 = sp.solve(sp.Eq(sp.sqrt(2 * p["R"] * h), p["l1"]), h)[0]
    h2 = sp.solve(sp.Eq(sp.sqrt(2 * p["R"] * h), p["l2"]), h)[0]
    return (h2 - h1) * 1000


def p3_pruzh(p):
    vv = R(p["v0"]) * sp.sin(2 * sp.pi * R(p["t"]) / p["T"])
    return sp.nsimplify(R(p["m"]) * vv**2 / 2)


def p3_kpd(p):
    T1 = sp.symbols("T1", positive=True)
    return sp.solve(sp.Eq((T1 - p["T2"]) / T1 * 100, p["eta"]), T1)[0]


def p3_truby(p):
    T = sp.symbols("T", positive=True)
    return sp.solve(sp.Eq(R(p["d"]) / p["t"] + 2 * (T - p["d"]) / p["t"], 1), T)[0]


def p3_voda(p):
    X, Y = sp.symbols("X Y", positive=True)
    s = sp.solve([sp.Eq(R(p["a"]) * X + R(p["b"]) * Y, R(p["p1"]) * (X + Y)), sp.Eq(R(p["p1"]) * (X + Y), R(p["p2"]) * (X + Y + p["m"]))], [X, Y])
    return s[X] if p["ask"] == "a" else s[Y]


def p3_avt(p):
    d, u = sp.symbols("d u", positive=True)
    s = sp.solve([sp.Eq(d / u, R(p["t0"]) + d / p["v"]), sp.Eq(p["S"] / u, R(p["t0"]) + 2 * d / p["v"])], [d, u], dict=True)
    return [r[d] for r in s if 0 < r[d] < p["S"]][0]


def p3_giper(p):
    k, b = sp.symbols("k b")
    s = sp.solve([sp.Eq(k / p["A"][0] + b, p["A"][1]), sp.Eq(k / p["B"][0] + b, p["B"][1])], [k, b])
    return s[k] / p["x0"] + s[b]


def p3_kor_pr(p):
    gx, gy = p["G"]
    lx, ly = p["L"]
    pp = gy / sp.sqrt(gx)
    k = sp.Rational(ly, lx)
    return [r for r in sp.solve(sp.Eq(pp * sp.sqrt(x), k * x), x) if r != 0][0]


def p3_par_pr(p):
    a, bb = sp.symbols("a bb")
    qx, qy = p["Q"]
    s = sp.solve([sp.Eq(a * p["r"] ** 2 + bb * p["r"], 0), sp.Eq(a * qx**2 + bb * qx, qy)], [a, bb])
    k = sp.Rational(p["L"][1], p["L"][0])
    return [r for r in sp.solve(sp.Eq(s[a] * x**2 + s[bb] * x, k * x), x) if r != 0][0]


def p3_ann_summa(p):
    X = sp.symbols("X")
    k = 1 + R(p["r"]) / 100
    S = R(p["S"]) * 1000
    return 2 * sp.solve(sp.Eq((S * k - X) * k - X, 0), X)[0]


def p3_ann_stavka(p):
    k = sp.symbols("k", positive=True)
    S, X = R(p["S"]), R(p["x"])
    return ([r for r in sp.solve(sp.Eq((S * k - X) * k - X, 0), k) if r > 1][0] - 1) * 100


def p3_vklad(p):
    S = sp.symbols("S")
    k = 1 + R(p["r"]) / 100
    return sp.solve(sp.Eq(((100 * S * k + p["x"]) * k + p["x"]) * k, R(p["Z"])), S)[0]


SCHET.update({
    "z01.parallelogramm-bissektrisa": p3_par_bis,
    "z01.parallelogramm-dve-bissektrisy": p3_dve_bis,
    "z01.ravnobedr-vysota-sin": p3_vys_sin,
    "z01.ravnobedr-vysota-cos": p3_vys_cos,
    "z01.vpisannyy-dva-ugla": p3_vpis,
    "z02.kosinus-km": p3_cos,
    "z02.kosinus-po-risunku": p3_cos,
    "z03.konus-bokovaya": p3_konus,
    "z03.kub-v-share": p3_kub,
    "z03.okolo-sfery-poverhnost": p3_sfera,
    "z03.piramida-v-parallelepipede": p3_piramida,
    "z03.tetraedr-v-parallelepipede": p3_tetraedr,
    "z04.pary": p3_pary,
    "z04.tri-tsveta": p3_tri,
    "z04.taksi": p3_taksi,
    "z05.odna-gruppa": p3_odna,
    "z05.hotya-by-dve": p3_dve,
    "z05.summa-ochkov": p3_summa,
    "z05.bernulli": p3_bern,
    "z06.lotereya": p3_lot,
    "z06.ozhidanie": p3_ozh,
    "z07.nechetnaya-stepen": p3_step,
    "z07.pokazatelnoe-osnovaniya": p3_pokaz,
    "z07.log-kvadratnoe": p3_logkv,
    "z08.cos-dvoynoy": p3_cos2,
    "z08.stepen-s-log": p3_steplog,
    "z08.tg-po-znacheniyu": p3_tg,
    "z09.skorost-mnogochlen": p3_skorost,
    "z10.gorizont": p3_gor,
    "z10.pruzhina": p3_pruzh,
    "z10.kpd": p3_kpd,
    "z11.dve-truby": p3_truby,
    "z11.rastvor-i-voda": p3_voda,
    "z11.avtobus-avtomobil": p3_avt,
    "z12.giperbola-kb": p3_giper,
    "z12.koren-pryamaya": p3_kor_pr,
    "z12.parabola-pryamaya": p3_par_pr,
    "z13.dva-ravnyh-summa": p3_ann_summa,
    "z13.dva-ravnyh-stavka": p3_ann_stavka,
    "z13.vklad-nachalnyy": p3_vklad,
})


def p3_kas_nach(p):
    # Касательная через O(0; 0) и узел касания: k = y0 / x0.
    y0 = dict((u[0], u[1]) for u in p["uzly"])[p["x0"]]
    return sp.Rational(y0, p["x0"])


def p3_metka(p):
    # Наклон в точке — по хорде участка между соседними узлами (кривая монотонна на нём).
    u = p["uzly"]
    nakl = []
    for m in p["metki"]:
        i = max(j for j in range(len(u) - 1) if u[j][0] <= m)
        nakl.append(sp.Rational(u[i + 1][1] - u[i][1], u[i + 1][0] - u[i][0]))
    cel = max(nakl) if p["naib"] == 1 else min(nakl)
    # Ответ — абсцисса точки (точки подписаны числами), а не её номер.
    return sp.Integer(p["metki"][nakl.index(cel)])


SCHET.update({
    "z09.kasatelnaya-nachalo": p3_kas_nach,
    "z09.naib-naim-metka": p3_metka,
})


# ── Партия 4 (варианты 19–24) ──


def p4_aob(p):
    # Сумма углов треугольника AOB: 180 − A/2 − B/2.
    return 180 - sp.Rational(p["a"], 2) - sp.Rational(180 - p["c"] - p["a"], 2)


def p4_vys_bis(p):
    # Угол между высотой и биссектрисой из прямого угла: |B − 45°| = 45° − A, A < 45°.
    a = sp.symbols("a", positive=True)
    return sp.solve(sp.Eq(45 - a, R(p["f"])), a)[0]


def p4_bis_med(p):
    # Медиана к гипотенузе: угол MCB = B; биссектриса — 45° от катета.
    return abs(45 - sp.Integer(p["b"]))


def p4_trap(p):
    x, y = sp.symbols("x y", positive=True)
    sol = sp.solve([sp.Eq(x + y, 2 * R(p["m"])), sp.Eq(x * p["q"], y * p["p"])], [x, y], dict=True)[0]
    return max(sol[x], sol[y]) if p["k"] else min(sol[x], sol[y])


def p4_piramida(p):
    a = R(p["a"])
    f = sp.sqrt(R(p["b"]) ** 2 - (a / 2) ** 2) if p["vid"] == 0 else sp.sqrt(R(p["h"]) ** 2 + (a / 2) ** 2)
    return a**2 + 4 * a * f / 2


def p4_cil_kon(p):
    S, h = sp.symbols("S h", positive=True)
    kon, cil = S * h / 3, S * h
    return sp.simplify(R(p["V"]) * (kon / cil if p["vid"] == 0 else cil / kon))


def p4_shar(p):
    r = sp.symbols("r", positive=True)
    if p["vid"] == 0:
        return R(p["S"]) * (4 * sp.pi * r**2) / (sp.pi * r**2)
    return (4 * sp.pi * (R(p["k"]) * r) ** 2) / (4 * sp.pi * r**2)


def okr2(x):
    # До сотых, если дробь длиннее двух знаков.
    x = sp.Rational(x)
    return x if (x * 100).is_integer else sp.floor(x * 100 + sp.Rational(1, 2)) / 100


def p4_poryadok(p):
    m = len([k for k in p if k.startswith("i") and k[1:].isdigit()])
    vid = p["vid"]
    x = {"posle": sp.Rational(1, m), "cepochka": sp.Rational(1, sp.factorial(m)), "mezhdu": sp.Rational(1, 3)}.get(
        vid, sp.Rational(1, 2 ** (m // 2))
    )
    return okr2(x)


def p4_tri(p):
    return 1 - R(p["p1"]) - R(p["p2"])


def p4_druga(p):
    n, g = p["n"], p["g"]
    k = n // g
    v = sp.Rational(g * sp.binomial(n - 2, k - 2), sp.binomial(n, k))
    return okr2(v if p["vmeste"] == 1 else 1 - v)


def p4_bern_otn(p):
    n, k, q = p["n"], p["k"], R(p["p"])
    a = sp.binomial(n, k) * q**k * (1 - q) ** (n - k)
    b = sp.binomial(n, k - 1) * q ** (k - 1) * (1 - q) ** (n - k + 1)
    return okr2(a / b)


def p4_misheni(p):
    q = R(p["p1"]) + (1 - R(p["p1"])) * R(p["p2"])
    return sp.binomial(p["N"], p["k"]) * q ** p["k"] * (1 - q) ** (p["N"] - p["k"])


def p4_bilety(p):
    d = sp.Rational(1, p["m"]) if p["vid"] == "kazhdyy" else (1 - sp.Rational(p["q"], 100)) / (2 - sp.Rational(p["q"], 100))
    n = 1
    while not (1 - (1 - d) ** n > R(p["P"])):
        n += 1
    return sp.Integer(n)


def p4_kor_post(p):
    eq = sp.Eq(p["b"] - x, (x + p["c"]) ** 2)
    good = [r for r in sp.solve(eq, x) if r + p["c"] >= 0 and p["b"] - r >= 0]
    return min(good)


def p4_step_kv(p):
    good = [r for r in sp.solve(sp.Eq((p["c"] - x**2) ** p["n"], p["D"]), x) if r.is_real]
    return min(good)


def p4_st3(p):
    a, b = sp.Integer(p["a"]), sp.Integer(p["b"])
    X, Y, Z = R(p["x"]), R(p["y"]), R(p["z"])
    if p["vid"] == "ab":
        return sp.simplify(a**X * b**Y / (a * b) ** Z)
    return sp.simplify((a * b) ** X * b**Y / a**Z)


def p4_logr(p):
    c = R(p["c"])
    v = sp.log(R(p["x"]), c) + (1 if p["znak"] > 0 else -1) * sp.log(R(p["y"]), c)
    return sp.nsimplify(sp.simplify(v))


def p4_korni(p):
    A = sp.Integer(p["A"])
    return sp.simplify(p["k"] * sp.root(A, p["n"]) * sp.root(A, p["m"]))


def p4_kas(p):
    k, m, f = R(p["k"]), R(p["m"]), [R(c) for c in p["f"]]
    if p["vid"] in ("abscissa", "parallel"):
        F = sum(c * x ** (len(f) - 1 - i) for i, c in enumerate(f))
        xs = sp.solve(sp.Eq(sp.diff(F, x), k), x)
        if p["vid"] == "abscissa":
            xs = [r for r in xs if sp.simplify(F.subs(x, r) - (k * r + m)) == 0]
        assert len(xs) == 1, xs
        return xs[0]
    a_, c_ = sp.symbols("a_ c_")
    if p["vid"] == "koefA":
        b, c = f
        # Касание: ax² + (b − k)x + (c − m) = 0 с нулевым дискриминантом.
        return sp.solve(sp.Eq((b - k) ** 2 - 4 * a_ * (c - m), 0), a_)[0]
    a, b = f
    return sp.solve(sp.Eq((b - k) ** 2 - 4 * a * (c_ - m), 0), c_)[0]


def p4_radiator(p):
    T = sp.symbols("T", positive=True)
    K = R(p["alpha"]) * R(p["c"]) * R(p["m"]) / R(p["gamma"])
    return sp.solve(sp.Eq(K * sp.log((R(p["Tv"]) - R(p["Tp"])) / (T - R(p["Tp"])), 2), R(p["x"])), T)[0]


def p4_razgon(p):
    u = sp.symbols("u", positive=True)
    if p["vid"] == "l":
        return sp.solve(sp.Eq(sp.sqrt(2 * u * R(p["a"])), R(p["v"])), u)[0]
    return sp.solve(sp.Eq(sp.sqrt(2 * R(p["l"]) * u), R(p["v"])), u)[0]


def p4_kolokol(p):
    u = sp.symbols("u", positive=True)
    K = R(p["alpha"]) * R(p["nu"]) * R(p["T"])
    if p["vid"] == "p":
        return sp.solve(sp.Eq(K * sp.log(u / R(p["p1"]), 2), R(p["A"])), u)[0]
    return sp.solve(sp.Eq(K * sp.log(R(p["V1"]) / u, 2), R(p["A"])), u)[0]


def p4_mastera(p):
    y = sp.symbols("y", positive=True)
    sol = [r for r in sp.solve(sp.Eq(p["N1"] / (y - p["r"]) - p["N2"] / y, sp.Rational(p["tm"], 60)), y) if r > p["r"]]
    return sol[0] if p["ask"] == "vtoroy" else sol[0] - p["r"]


def p4_plot(p):
    v = sp.symbols("v", positive=True)
    T = R(p["R"]) / R(p["vt"]) - R(p["z"])
    sol = [r for r in sp.solve(sp.Eq(p["S"] / (v + p["vt"]) + p["S"] / (v - p["vt"]), T), v) if r > p["vt"]]
    return sol[0]


def p4_brigady(p):
    T = sp.symbols("T", positive=True)
    return sp.solve(sp.Eq(p["n1"] * p["d"] + (p["n1"] + p["k"]) * (T - p["d"]), p["n2"] * p["d"] + (p["n2"] - p["k"]) * (T - p["d"])), T)[0]


def p4_dva_uzla(p):
    a, b, k = sp.symbols("a b k")
    (ax, ay), (bx, by) = [[R(u) for u in t] for t in (p["A"], p["B"])]
    vid = p["vid"]
    if vid == "pokazSdvig":
        f = a ** (x + b)
        sol = sp.solve([sp.Eq(f.subs(x, ax), ay), sp.Eq(f.subs(x, bx), by)], [a, b], dict=True)
    elif vid == "logSdvig":
        f = sp.log(x + b) / sp.log(a)
        sol = [{b: 1 - ax, a: (bx + 1 - ax) ** (1 / by)}]
    elif vid == "giperbolaA":
        f = k / (x + a)
        sol = sp.solve([sp.Eq(f.subs(x, ax), ay), sp.Eq(f.subs(x, bx), by)], [a, k], dict=True)
    else:
        f = a**x + b
        sol = [{b: ay - 1, a: (by - ay + 1) ** (1 / bx)}]
    sol = [s for s in sol if all(v.is_real for v in s.values()) and (vid == "giperbolaA" or s[a] > 0)]
    F = f.subs(sol[0])
    if "x0" in p:
        return sp.nsimplify(sp.simplify(F.subs(x, R(p["x0"]))))
    r = [t for t in sp.solve(sp.Eq(F, R(p["y0"])), x) if t.is_real]
    return sp.nsimplify(sp.simplify(r[0]))


SCHET.update({
    "z01.bissektrisy-aob": p4_aob,
    "z01.vysota-bissektrisa": p4_vys_bis,
    "z01.bissektrisa-mediana": p4_bis_med,
    "z01.trapeciya-osnovanie": p4_trap,
    "z03.piramida-poverhnost": p4_piramida,
    "z03.cilindr-konus": p4_cil_kon,
    "z03.shar-poverhnost": p4_shar,
    "z04.poryadok": p4_poryadok,
    "z04.tri-ishoda": p4_tri,
    "z04.dva-druga": p4_druga,
    "z05.bernulli-otnoshenie": p4_bern_otn,
    "z05.misheni-dva-vystrela": p4_misheni,
    "z05.bilety": p4_bilety,
    "z07.koren-postoronniy": p4_kor_post,
    "z07.stepen-kvadrata": p4_step_kv,
    "z08.stepeni-tri-osnovaniya": p4_st3,
    "z08.log-raznost": p4_logr,
    "z08.korni-proizvedenie": p4_korni,
    "z09.kasatelnaya-formula": p4_kas,
    "z10.radiator": p4_radiator,
    "z10.razgon": p4_razgon,
    "z10.kolokol": p4_kolokol,
    "z11.mastera": p4_mastera,
    "z11.plot-yahta": p4_plot,
    "z11.brigady": p4_brigady,
    "z12.dva-uzla": p4_dva_uzla,
    # P4-END
})


def konechnaya(q):
    q = F(q)
    d = q.denominator
    for pr in (2, 5):
        while d % pr == 0:
            d //= pr
    return d == 1


def main():
    rows = json.load(open(sys.argv[1], encoding="utf-8"))
    bad = 0
    for r in rows:
        val = sp.nsimplify(SCHET[r["s"]](r["p"]))
        if not val.is_rational:
            print(f"✗ {r['kv']} №{r['ege']}: ответ {val} не рационален")
            bad += 1
            continue
        q = F(int(val.p), int(val.q))
        if not konechnaya(q):
            print(f"✗ {r['kv']} №{r['ege']}: {q} — бесконечная дробь")
            bad += 1
        if abs(float(q) - r["answer"]) > 1e-9 * max(1, abs(r["answer"])):
            print(f"✗ {r['kv']} №{r['ege']}: sympy {q} ≠ движок {r['answer']}")
            bad += 1
    print(f"sympy: {len(rows)} задач, расхождений {bad}")
    sys.exit(1 if bad else 0)


main()
