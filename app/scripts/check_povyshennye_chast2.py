#!/usr/bin/env python3
"""scripts/check_povyshennye_chast2.py — второй, независимый счёт ответов
части 2 (задания 14–20) раздела «Варианты повышенной сложности» на sympy.

Запуск:
    node scripts/check-povyshennye-chast2.mjs --json /tmp/c2.json
    python3 -I scripts/check_povyshennye_chast2.py /tmp/c2.json

Ответ каждой версии считается заново из параметров шаблона — точно, без
кода сайта — и сравнивается с числами, которые посчитал шаблон:
  14 — решение тригонометрического уравнения sympy на отрезке;
  15 — расстояние между прямыми в координатах, точно;
  16 — решение неравенства sympy + сетка mpmath с 60 знаками;
  17 — точка максимума через производную;
  18 — площадь построенного пятиугольника, точно;
  19 — число корней по множителям для точных значений a на сетке;
  20 — перебор длин.
"""

import json
import sys

import mpmath as mp
import sympy as sp

x, a, k, n, c = sp.symbols("x a k n c", real=True)
fails = 0
checks = 0


def ok(cond, where, msg=""):
    global fails, checks
    checks += 1
    if not cond:
        fails += 1
        print(f"  ✗ {where} {msg}")


def near(u, v, tol=1e-9):
    return abs(float(u) - float(v)) <= tol * max(1, abs(float(u)), abs(float(v)))


A14 = {
    "c-": sp.sqrt(2) * sp.cos(x - sp.pi / 2),
    "c+": sp.sqrt(2) * sp.cos(x + sp.pi / 2),
    "s+": sp.sqrt(2) * sp.sin(x + sp.pi / 2),
    "s-": sp.sqrt(2) * sp.sin(x - sp.pi / 2),
    "spi": sp.sqrt(2) * sp.sin(sp.pi - x),
    "cpi": sp.sqrt(2) * sp.cos(sp.pi - x),
    "c32": sp.sqrt(2) * sp.cos(3 * sp.pi / 2 - x),
    "s32": sp.sqrt(2) * sp.sin(3 * sp.pi / 2 + x),
}
B14 = {
    "c-4": sp.cos(x - sp.pi / 4),
    "c+4": sp.cos(x + sp.pi / 4),
    "s+4": sp.sin(x + sp.pi / 4),
    "s-4": sp.sin(x - sp.pi / 4),
}
LOG14 = {
    "2": (2, sp.Rational(-1, 2)),
    "4": (4, sp.Rational(-1, 4)),
    "0,5": (sp.Rational(1, 2), sp.Rational(1, 2)),
    "0,25": (sp.Rational(1, 4), sp.Rational(1, 4)),
    "r2": (sp.sqrt(2), -1),
}


def z14(p, kon):
    osn, prav = LOG14[p["log"]]
    arg = A14[p["a"]] + p["z"] * B14[p["b"]]
    # Аргумент равен osn^prav; область — аргумент > 0 выполнена сама.
    znach = sp.nsimplify(osn**prav)
    ok(sp.simplify(znach - 1 / sp.sqrt(2)) == 0, "14: osn^prav = 1/√2")
    otr = sp.Interval(sp.pi * p["lo"] / 2, sp.pi * p["hi"] / 2)
    korni = sp.solveset(sp.Eq(sp.expand_trig(arg), znach), x, otr)
    korni = sorted(float(r) for r in korni)
    ok(len(korni) == 2, "14: два корня на отрезке", str(korni))
    ok(all(near(u, v) for u, v in zip(korni, kon["korni"])), "14: корни", f"{korni} {kon['korni']}")


def z15(p, kon):
    a2 = sp.Integer(p["a2"])
    tg2 = {30: sp.Rational(1, 3), 45: 1, 60: 3}[p["phi"]]
    # Ромб ABCD с ∠ABC = 120°: B в начале, BA по оси x.
    s = sp.sqrt(a2)
    B = sp.Matrix([0, 0, 0])
    A = sp.Matrix([s, 0, 0])
    C = sp.Matrix([s * sp.cos(2 * sp.pi / 3), s * sp.sin(2 * sp.pi / 3), 0])
    D = A + C - B
    O = (A + C) / 2
    h = sp.sqrt(sp.nsimplify(kon["h"] ** 2))
    S = O + sp.Matrix([0, 0, h])
    K = C + k * (S - C)
    v = K - D
    # tg² угла DK с основанием: z² / (x² + y²) = tg²φ.
    sol = [r for r in sp.solve(sp.Eq(v[2] ** 2, tg2 * (v[0] ** 2 + v[1] ** 2)), k) if 0 < r < 1]
    ok(len(sol) == 1, "15: точка K на ребре одна", str(sol))
    kk = sol[0]
    ok(near(kk, kon["k"]), "15: CK/CS", f"{kk} {kon['k']}")
    Kk = K.subs(k, kk)
    u = Kk - D
    w = C - B
    nn = u.cross(w)
    d = sp.simplify(sp.Abs((B - D).dot(nn)) / sp.sqrt(nn.dot(nn)))
    ok(near(d, kon["otvet"]), "15: расстояние DK и BC", f"{sp.nsimplify(d)} {kon['otvet']}")


def z16(p, kon):
    q, e, y1, y2 = p["q"], p["e"], p["y1"], p["y2"]
    s, t = y1 + y2, q ** (e + 1) - y1 * y2
    expr = (q ** (2 * x + 1) + x - s * sp.sqrt(x) - t) / (q ** (2 * x) - q**e) - q
    # sympy: преобразованное неравенство по знакам множителей — проверяем
    # концы и знаки в точках между ними точно.
    a, x0, b = sp.Integer(kon["a"]), sp.Rational(e, 2), sp.Integer(kon["b"])
    ok(sp.simplify(expr.subs(x, a)) == 0 and sp.simplify(expr.subs(x, b)) == 0, "16: концы — нули")
    for tt, verno in [(a / 2, False), ((a + x0) / 2, True), ((x0 + b) / 2, False), (b + 1, True), (b * 3, True)]:
        ok((sp.N(expr.subs(x, tt), 80) >= 0) == verno, f"16: знак в {tt}")
    # Сетка mpmath, 60 знаков.
    mp.mp.dps = 60
    f = lambda X: (mp.mpf(q) ** (2 * X + 1) + X - s * mp.sqrt(X) - t) / (mp.mpf(q) ** (2 * X) - mp.mpf(q) ** e) - q
    plokho = 0
    i = 0
    xa, xb, xx0 = float(a), float(b), float(x0)
    while i * 0.01 <= xb + 5:
        X = mp.mpf(i) / 100
        i += 1
        if abs(X - xx0) < 1e-9:
            continue
        v = f(X)
        vnutri = (xa <= X < xx0) or X >= xb
        if abs(X - xa) < 1e-12 or abs(X - xb) < 1e-12:
            continue
        if (v >= 0) != vnutri:
            plokho += 1
    ok(plokho == 0, "16: сетка mpmath", str(plokho))


def z17(p, kon):
    T = sp.Rational(str(p["T"]))
    tau = sp.symbols("tau", positive=True)
    nn = sp.Rational(3, 10)
    A2 = tau**4 / ((T**2 - tau**2) ** 2 + nn * tau**2 * T**2)
    krit = [r for r in sp.solve(sp.diff(A2, tau), tau) if r.is_positive]
    ok(len(krit) == 1 and sp.simplify(krit[0] - T * sp.sqrt(2 / (2 - nn))) == 0, "17: максимум (n = 0,3)", str(krit))


def z18(p, kon):
    e, b, l = p["e"], p["b"], p["l"]
    d = b - e
    h = sp.sqrt(l * l - d * d)
    r = sp.symbols("r", positive=True)
    A = sp.Matrix([-e, 0])
    B = sp.Matrix([-b, h])

    def dist(P, Q, X):
        return sp.Abs((Q[0] - P[0]) * (X[1] - P[1]) - (Q[1] - P[1]) * (X[0] - P[0])) / sp.sqrt((Q - P).dot(Q - P))

    rr = [s for s in sp.solve(sp.Eq(dist(A, B, sp.Matrix([0, r])) ** 2, r**2), r) if s < h]
    ok(len(rr) == 1, "18: радиус", str(rr))
    r0 = rr[0]
    cc = sp.symbols("cc", positive=True)
    cs = [s for s in sp.solve(sp.Eq(dist(B, sp.Matrix([0, cc]), sp.Matrix([0, r0])) ** 2, r0**2), cc) if s > h]
    ok(len(cs) == 1, "18: вершина C", str(cs))
    P = [A, B, sp.Matrix([0, cs[0]]), sp.Matrix([b, h]), sp.Matrix([e, 0])]
    S = sp.Abs(sum(P[i][0] * P[(i + 1) % 5][1] - P[(i + 1) % 5][0] * P[i][1] for i in range(5))) / 2
    ok(near(S, kon["S"]), "18: площадь", f"{sp.nsimplify(S)} {kon['S']}")


def z19(p, kon):
    m, b, cc = p["m"], p["b"], p["c"]
    N = b**cc

    def korni(av):
        # Корни уравнения (log_b(a²−x²) − c)(x − a)(√(x−a) − m) = 0
        # при x > a, a² − x² > 0 — по множителям, точно.
        out = set()
        if av**2 - N >= 0:
            for xs in (sp.sqrt(av**2 - N), -sp.sqrt(av**2 - N)):
                if xs > av and av**2 - xs**2 > 0:
                    out.add(sp.nsimplify(xs))
        xs = av + m * m
        if av**2 - xs**2 > 0:
            out.add(xs)
        return len(out)

    lev = sp.nsimplify(kon["levyy"])
    toch = sp.nsimplify(kon["tochka"], rational=True)
    prav = -sp.sqrt(N)
    plokho = []
    for i in range(-1400, 301):
        av = sp.Rational(i, 100)
        v = (lev <= av < prav) or av == toch
        if (korni(av) == 2) != v:
            plokho.append(str(av))
    ok(korni(toch) == 2 and korni(lev) == 2 and korni(prav) != 2, "19: границы")
    ok(not plokho, "19: множество ровно двух корней", ",".join(plokho[:5]))


def z20(p, kon):
    S, pp = p["S"], p["p"]
    q = pp + 20
    can = set()
    for kk in range(1, 80):
        for aa in range(kk):
            can.add(kk * S - aa * q - (kk - 1 - aa) * pp)
    ok(p["A"] in can and p["B"] not in can, "20: а) да, б) нет")
    L = next(L for L in range(10, 3000, 10) if all(t in can for t in range(L, 4000, 10)))
    ok(L == kon["L"], "20: в)", f"{L} {kon['L']}")


F = {
    "z14.logTrig": z14,
    "z15.rombPiramida": z15,
    "z16.pokazKoren": z16,
    "z17.kachka": z17,
    "z18.pyatiugolnik": z18,
    "z19.logKoren": z19,
    "z20.zabor": z20,
}

rows = json.load(open(sys.argv[1], encoding="utf-8"))
for row in rows:
    before = fails
    F[row["s"]](row["p"], row["kontrol"])
    print(f"  {'✓' if fails == before else '✗'} {row['v']} {row['s']}")
print(f"\nПроверок: {checks}, ошибок: {fails}")
sys.exit(1 if fails else 0)
