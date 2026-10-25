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
    r = sp.Matrix([p["ax"], p["ay"]]) + R(p["k"]) * sp.Matrix([p["bx"], p["by"]])
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
    return sp.Integer(sum(1 for x_, tip in nuli9(p) if p["p"] <= x_ <= p["q"] and (p["tip"] == "extr" or tip == "max")))


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
