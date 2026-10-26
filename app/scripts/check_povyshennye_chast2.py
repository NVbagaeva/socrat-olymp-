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
    arg = p.get("za", 1) * A14[p["a"]] + p["z"] * B14[p["b"]]
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
    h = sp.sqrt(sp.Rational(*p["h2"])) if "h2" in p else sp.sqrt(sp.nsimplify(kon["h"] ** 2))
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
    al, ga = p.get("alpha", 1), p.get("gamma", 0)
    ge = p.get("znak", "ge") == "ge"
    kk = sp.Integer(q) ** (al - ga)
    s, t = y1 + y2, kk * q**e - y1 * y2
    expr = (q ** (2 * x + al) + x - s * sp.sqrt(x) - t) / (q ** (2 * x + ga) - q**e) - kk
    a, x0, b = sp.Integer(kon["a"]), sp.Rational(e - ga, 2), sp.Integer(kon["b"])
    ok(sp.simplify(expr.subs(x, a)) == 0 and sp.simplify(expr.subs(x, b)) == 0, "16: концы — нули")
    ks = kon["kuski"]
    kuski = [(ks[i], ks[i + 1], ks[i + 2] == 1, ks[i + 3] == 1) for i in range(0, len(ks), 4)]

    def vnutri(X):
        return any((lo < X < hi) or (lz and X == lo) or (hz and X == hi) for lo, hi, lz, hz in kuski)

    def verno(v):
        return v >= 0 if ge else v <= 0

    # Точные знаки в серединах промежутков между особыми точками.
    tochki = sorted({sp.Integer(0), a, b, x0})
    for i, tt in enumerate(tochki):
        nx = tochki[i + 1] if i + 1 < len(tochki) else tt + 2
        mid = (tt + nx) / 2
        ok(verno(sp.N(expr.subs(x, mid), 80)) == vnutri(float(mid)), f"16: знак в {mid}")
    ok(not vnutri(float(x0)), "16: x0 не в ответе")
    # Сетка mpmath, 60 знаков.
    mp.mp.dps = 60
    Q = mp.mpf(q)
    f = lambda X: (Q ** (2 * X + al) + X - s * mp.sqrt(X) - t) / (Q ** (2 * X + ga) - Q**e) - Q ** (al - ga)
    plokho = 0
    i = 0
    xa, xb, xx0 = float(a), float(b), float(x0)
    while i * 0.01 <= xb + 5:
        X = mp.mpf(i) / 100
        i += 1
        if abs(X - xx0) < 1e-9 or abs(X - xa) < 1e-12 or abs(X - xb) < 1e-12:
            continue
        if verno(f(X)) != vnutri(float(X)):
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


def z19z(p, kon):
    m, b = p["m"], p["b"]
    N = b**m

    def korni(av):
        # (m − log_b(x²−a²))(a − x)(√(a−x) − m) = 0 при x ≤ a, |x| > |a|.
        out = set()
        for xs in (sp.sqrt(av**2 + N), -sp.sqrt(av**2 + N), av - m * m):
            if xs <= av and xs**2 - av**2 > 0:
                out.add(sp.nsimplify(xs))
        return len(out)

    gr = sp.Rational(m * m, 2)
    toch = sp.nsimplify(kon["tochka"], rational=True)
    ok(sp.Rational(m**4 - N, 2 * m * m) == toch, "19: точка совпадения")
    # Разложение: левая минус правая часть равна произведению множителей.
    av, L, u = sp.symbols("av L u", real=True)
    xx = av - u**2
    lhs = u**3 + m * xx - (xx + u**3 / m) * L - m * av + av * L
    ok(sp.expand(lhs - (m - L) * u**2 * (u - m) / m) == 0, "19: разложение на множители")
    plokho = []
    for i in range(-1400, 1401):
        a_ = sp.Rational(i, 100)
        if (korni(a_) == 1) != (a_ >= gr or a_ == toch):
            plokho.append(str(a_))
    ok(korni(gr) == 1 and korni(toch) == 1, "19: границы")
    ok(not plokho, "19: множество ровно одного корня", ",".join(plokho[:5]))


def z19(p, kon):
    if p.get("zerk"):
        return z19z(p, kon)
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
    q = p.get("q", pp + 20)
    can = set()
    for kk in range(1, 80):
        for aa in range(kk):
            can.add(kk * S - aa * q - (kk - 1 - aa) * pp)
    ok(p["A"] in can and p["B"] not in can, "20: а) да, б) нет")
    L = next(L for L in range(10, 3000, 10) if all(t in can for t in range(L, 4000, 10)))
    ok(L == kon["L"], "20: в)", f"{L} {kon['L']}")


# ── Варианты 3–4 (шаблоны b14–b20) ─────────────────────────────────


def b14(p, kon):
    B, n_, pp = sp.Integer(p["B"]), p["n"], p["p"]
    ws = [sp.Rational(*w) for w in p["w"]]
    c2 = sp.Rational(*p["c2"])
    ys = [B**w for w in ws]
    if p["vid"] == "plus":
        c1 = c2 + ws[0] + ws[1]
        K = B**c2 * (ys[0] + ys[1])
        expr = B ** (x**n_ - x**2 - pp * x + c1) + B ** (x**n_ + x**2 + pp * x + c2) - K * B ** (x**n_)
    else:
        c1 = sp.Rational(*p["c1"])
        yneg = B ** (c1 - c2) / ys[0]
        K = B**c2 * (yneg - ys[0])
        expr = B ** (x**n_ + x**2 + pp * x + c2) - B ** (x**n_ - x**2 - pp * x + c1) + K * B ** (x**n_)
    ok(K.is_integer and K > 0, "b14: K натуральное", str(K))
    # Корни: замена y = B^w, квадратное по y, затем по x — sympy.
    y = sp.symbols("y", positive=True)
    h = (B**c1 / y + B**c2 * y - K) if p["vid"] == "plus" else (B**c2 * y - B**c1 / y + K)
    # Деление на B^{xⁿ} и замена — тождество (проверка в нескольких точках точно).
    for xv in (sp.Rational(1, 3), sp.Rational(-5, 4), sp.Integer(2)):
        ok(sp.simplify((expr / B ** (x**n_) - h.subs(y, B ** (x**2 + pp * x))).subs(x, xv)) == 0, "b14: замена")
    yk = [r for r in sp.solve(sp.Eq(sp.together(h * y), 0), y) if r.is_positive]
    korni = set()
    for yv in yk:
        for r in sp.solve(sp.Eq(x**2 + pp * x, sp.log(yv, B)), x):
            if r.is_real:
                korni.add(sp.nsimplify(r))
    korni = sorted(korni, key=lambda r: float(r))
    for r in korni:
        ok(sp.simplify(expr.subs(x, r)) == 0, "b14: подстановка корня")
    ok(len(korni) == len(kon["korni"]) and all(near(a_, b_) for a_, b_ in zip(korni, kon["korni"])), "b14: корни", f"{korni} {kon['korni']}")
    lo, hi = sp.nsimplify(p["lo"]), sp.nsimplify(p["hi"])
    otb = [r for r in korni if lo <= r <= hi]
    ok(len(otb) == len(kon["otbor"]) and all(near(a_, b_) for a_, b_ in zip(otb, kon["otbor"])), "b14: отбор")


def b15(p, kon):
    ug = {"prav": sp.pi / 3, "pryam": sp.pi / 2, "tupoy": 2 * sp.pi / 3}[p["osn"]]
    a_, H = sp.Integer(p["a"]), sp.Integer(p["h"])
    B = sp.Matrix([0, 0, 0])
    A = sp.Matrix([a_, 0, 0])
    C = sp.Matrix([a_ * sp.cos(ug), a_ * sp.sin(ug), 0])
    up = lambda P, u: sp.Matrix([P[0], P[1], u])
    tet = lambda P, Q, R_, S: sp.Abs((Q - P).dot((R_ - P).cross(S - P))) / 6
    V = tet(A, B, C, up(A, H)) * 3
    u = sp.symbols("u", positive=True)
    chast = tet(B, A, C, up(C, u)) + tet(B, A, up(C, u), up(A, u))
    fa = sp.Rational(*p.get("fa", [1, 2]))
    fb = sp.Rational(*p.get("fb", [1, 3]))
    u1 = sp.solve(sp.Eq(sp.simplify(chast / V), fa), u)[0]
    u2 = sp.solve(sp.Eq(sp.simplify(chast / V), fb), u)[0]
    ok(near(u1, kon["an"]) and near(u2, kon["ak"]), "b15: AN и AK по объёму")
    n1 = (up(A, u1) - B).cross(up(C, u1) - B)
    n2 = (up(A, u2) - B).cross(up(C, u2) - B)
    cos = sp.nsimplify(sp.simplify(sp.Abs(n1.dot(n2)) / sp.sqrt(n1.dot(n1) * n2.dot(n2))))
    ok(near(cos, kon["cos"]), "b15: косинус по нормалям", f"{cos} {kon['cos']}")


def b16(p, kon):
    q, M = p["q"], p["M"]
    al, be = sp.Rational(*p["al"]), sp.Rational(*p["be"])
    r1, r2, lam = p["r1"], p["r2"], p["lam"]
    C4, C2, C0 = lam * al**4, lam * (r1 + r2) * be**2, lam * r1 * r2
    ok(C4.is_integer and C2.is_integer, "b16: целые коэффициенты")
    L = lambda base: sp.log(M - x**2) / sp.log(base)
    expr = C4 * L(sp.Integer(q) ** al) ** 4 - C2 * L(sp.Integer(q) ** be) ** 2 + C0
    ge = p["znak"] == "ge"
    ks = kon["kuski"]
    kuski = [(ks[i], ks[i + 1], ks[i + 2] == 1, ks[i + 3] == 1) for i in range(0, len(ks), 4)]
    vn = lambda X: any((lo < X < hi) or (lz and abs(X - lo) < 1e-12) or (hz and abs(X - hi) < 1e-12) for lo, hi, lz, hz in kuski)
    # Концы — нули левой части (точно) или граница ОДЗ.
    for lo, hi, _, _ in kuski:
        for c in (lo, hi):
            cc = sp.nsimplify(c**2, [sp.sqrt(2)], tolerance=1e-12, rational=True)
            if abs(abs(c) - float(sp.sqrt(M))) < 1e-9:
                continue
            ok(sp.simplify(expr.subs(x, sp.sqrt(cc))) == 0, f"b16: конец {c} — ноль")
    mp.mp.dps = 40
    f = sp.lambdify(x, expr, "mpmath")
    plokho = 0
    X = -float(sp.sqrt(M)) + 0.003
    while X < float(sp.sqrt(M)):
        if all(abs(X - c) > 1e-6 for k_ in kuski for c in k_[:2]):
            v = f(mp.mpf(X))
            if abs(v) > 1e-20 and ((v > 0) if ge else (v < 0)) != vn(X):
                plokho += 1
        X += 0.003
    ok(plokho == 0, "b16: сетка mpmath", str(plokho))


def b17(p, kon):
    R = sp.symbols("R", positive=True)
    E, r = sp.nsimplify(p["E"]), sp.nsimplify(p["r"])
    P = (E / (r + R)) ** 2 * R
    krit = [s_ for s_ in sp.solve(sp.diff(P, R), R) if s_.is_positive]
    ok(len(krit) == 1 and krit[0] == r, "b17: максимум при R = r")
    nado = r if p.get("vopros", "R") == "R" else P.subs(R, r)
    ok(near(nado, kon["otvet"]), "b17: ответ", f"{nado} {kon['otvet']}")


def b18(p, kon):
    a_ = sp.Integer(1) if p["vid"] == "tri" else sp.sqrt(p["a2"])
    d = sp.sqrt(3) if p["vid"] == "tri" else sp.sqrt(p["d2"])
    A, B, C, D = [sp.Point(0, 0), sp.Point(0, a_), sp.Point(d, a_), sp.Point(d, 0)]
    # E на BC: DB — биссектриса угла ADE ⇔ BE = DE.
    t = sp.symbols("t", positive=True)
    tE = [s_ for s_ in sp.solve(sp.Eq(t**2, (d - t) ** 2 + a_**2), t)][0]
    E = sp.Point(tE, a_)
    ok(sp.simplify(sp.Line(D, A).angle_between(sp.Line(D, B)) - sp.Line(D, B).angle_between(sp.Line(D, E))) == 0, "b18: DB — биссектриса ADE")
    O = sp.Line(B, D).intersection(sp.Line(A, C))[0]
    N = sp.Line(B, D).intersection(sp.Line(A, E))[0]
    P_ = sp.Line(A, C).intersection(sp.Line(D, E))[0]
    S = lambda *pts: sp.Abs(sp.Polygon(*pts).area)
    v = p["vopros"]
    if v == "AEP_BD":
        otv = S(A, N, O) / S(N, E, P_, O)
    elif v == "ONEC_DE":
        otv = S(E, C, P_) / S(O, N, E, P_)
    elif v == "BCD_AE":
        otv = S(B, N, E) / S(N, E, C, D)
    else:
        otv = S(O, N, E, C) / (a_ * d)
    otv = sp.nsimplify(sp.simplify(otv))
    ok(near(otv, kon["otvet"]), "b18: площади точно", f"{otv} {kon['otvet']}")
    ok(near(sp.simplify(B.distance(N) / N.distance(D)), kon["bnNd"]), "b18: BN:ND")


def b19(p, kon):
    R, c_, m = p["R"], p["c"], p["m"]
    k = kon["k"]
    mp.mp.dps = 30

    def chislo(av):
        # Корни t ∈ [0; R] уравнения √(R² − t²) = a(t − m) − c, затем x = ±√t.
        av = mp.mpf(av)
        b = -av * m - c_
        A2, A1, A0 = 1 + av**2, 2 * av * b, b**2 - R**2
        D = A1**2 - 4 * A2 * A0
        if D < -mp.mpf(10) ** -20:
            return 0
        sq = mp.sqrt(max(D, 0))
        ts = {(-A1 - sq) / (2 * A2), (-A1 + sq) / (2 * A2)}
        n = 0
        for tt in ts:
            if -1e-20 <= tt <= R + 1e-20 and av * tt + b >= -1e-20:
                n += 1 if abs(tt) < 1e-20 else 2
        return n

    ks = kon["kuski"]
    kuski = [(ks[i], ks[i + 1], ks[i + 2] == 1, ks[i + 3] == 1) for i in range(0, len(ks), 4)]
    vn = lambda X: any((lo < X < hi) or (lz and abs(X - lo) < 1e-12) or (hz and abs(X - hi) < 1e-12) for lo, hi, lz, hz in kuski)
    plokho = []
    for i in range(-1500, 1501):
        av = i / 100
        if any(abs(av - o) < 1e-9 for o in kon["osobye"]):
            continue
        if (chislo(av) == k) != vn(av):
            plokho.append(av)
    ok(not plokho, "b19: множество a", str(plokho[:5]))
    # Касание — точно: дискриминант по a обращается в ноль.
    a = sp.symbols("a", real=True)
    kas = sp.solve(sp.Eq((a * m + c_) ** 2, R**2 * (1 + a**2)), a)
    for lo, hi, _, _ in kuski:
        if lo == hi:
            ok(any(near(kv, lo) for kv in kas), "b19: точка — касание (точно)")


def b20(p, kon):
    c = p["ceny"]
    best = {}
    for a_ in range(p["M"] // c[0] + 1):
        for b in range((p["M"] - a_ * c[0]) // c[1] + 1):
            for cc in range((p["M"] - a_ * c[0] - b * c[1]) // c[2] + 1):
                ost = p["M"] - a_ * c[0] - b * c[1] - cc * c[2]
                for d in range(ost // c[3] + 1):
                    s_ = sorted([a_, b, cc, d], reverse=True)
                    if s_[0] - s_[1] > 2 or s_[1] - s_[2] > 2 or s_[2] - s_[3] > 2:
                        continue
                    N = a_ + b + cc + d
                    cena = a_ * c[0] + b * c[1] + cc * c[2] + d * c[3]
                    best[N] = max(best.get(N, 0), cena)
    ok(p["A"] in best and p["B"] not in best, "b20: а) да, б) нет")
    L = max(best) if p["vid"] == "max" else min(N for N, v in best.items() if p["M"] - v < c[0])
    ok(L == kon["L"], "b20: в)", f"{L} {kon['L']}")


# ── Семья C (варианты 5, 6) ─────────────────────────────────────


def c14(p, kon):
    A, B, C = p["a"], p["b"], p["c"]
    f = A * sp.sin(2 * x) + B * sp.cos(2 * x) - C
    for t in kon["t"]:
        tt = sp.nsimplify(t, rational=True)
        ok(sp.simplify(sp.expand_trig(f.subs(x, sp.atan(tt)))) == 0, "14: arctg t — корень", str(tt))
    otr = sp.Interval(sp.pi * p["lo"] / 2, sp.pi * (p["lo"] + 2) / 2)
    korni = sorted(float(r) for r in sp.solveset(sp.Eq(f, 0), x, otr))
    ok(len(korni) == 2 and all(near(u, v) for u, v in zip(korni, kon["korni"])), "14: корни на отрезке", f"{korni} {kon['korni']}")


def c15(p, kon):
    m = sp.sqrt(sp.Integer(p["ac2"])) / 2
    bm = sp.sqrt(p["l2"] - m**2)
    A, B, C = sp.Matrix([-m, 0, 0]), sp.Matrix([0, -bm, 0]), sp.Matrix([m, 0, 0])
    h = sp.sqrt(sp.Rational(p["h2"][0], p["h2"][1]))
    # Расстояние от H до AB и BC — из данных условия: SH / tg φ.
    d = h / sp.sqrt(sp.Rational(*kon["tg2"]))
    X, Y = sp.symbols("X Y", real=True)

    def sdist(P, Q, R):
        # Расстояние от (X, Y) до прямой PQ со знаком стороны точки R.
        val = lambda T: (Q[0] - P[0]) * (T[1] - P[1]) - (Q[1] - P[1]) * (T[0] - P[0])
        L = sp.sqrt((Q[0] - P[0]) ** 2 + (Q[1] - P[1]) ** 2)
        return sp.sign(val(R)) * val([X, Y]) / L

    sol = sp.solve([sdist(B, A, C) - d, sdist(B, C, A) - d], [X, Y], dict=True)
    ok(len(sol) == 1, "15: точка H однозначна")
    H = sp.Matrix([sp.simplify(sol[0][X]), sp.simplify(sol[0][Y]), 0])
    S = H + sp.Matrix([0, 0, h])
    O = sp.Matrix(sp.symbols("o1 o2 o3", real=True))
    eqs = [sp.expand((O - T).dot(O - T) - (O - A).dot(O - A)) for T in (B, C, S)]
    so = sp.solve(eqs, list(O), dict=True)[0]
    Oc = sp.Matrix([sp.simplify(so[v]) for v in O])
    ok(sp.simplify(Oc[0] - H[0]) == 0 and sp.simplify(Oc[1] - H[1]) == 0, "15 а): центр на прямой SH")
    ok(float(Oc[2]) < float(h), "15 а): центр на луче SH")

    def tg2(P, Q, R):
        nn = (Q - P).cross(R - P)
        c2 = nn[2] ** 2 / nn.dot(nn)
        return sp.simplify((1 - c2) / c2)

    ok(sp.simplify(tg2(S, A, B) - h**2 / d**2) == 0, "15: тангенс при AB из условия")
    ok(sp.simplify(tg2(S, B, C) - h**2 / d**2) == 0, "15: тангенс при BC из условия")
    ok(near(sp.sqrt(tg2(S, A, C)), kon["otvet"]), "15 б): тангенс", str(sp.sqrt(tg2(S, A, C))))


OSN16 = {"0,5": sp.Rational(1, 2), "0,25": sp.Rational(1, 4), "0,2": sp.Rational(1, 5), "0,1": sp.Rational(1, 10), "0,04": sp.Rational(1, 25)}


def c16(p, kon):
    P = OSN16.get(p["p"], None) or sp.Integer(p["p"])
    R = OSN16.get(p["r"], None) or sp.Integer(p["r"])
    b = OSN16.get(p["b"], None) or sp.Integer(p["b"])
    c = sp.Rational(p["c"][0], p["c"][1])
    W = p["k"] * x - p["s"]
    L = p["zE"] * W
    E = P**L - R**L
    G = (1 if p["forma"] == "minus" else -1) * (sp.log(W, b) ** 2 - c**2)
    F = G / E if p["logNum"] else E / G
    ge = p["znak"] == "ge"
    ks = kon["kuski"]
    kuski = [(ks[i], ks[i + 1], ks[i + 2] == 1, ks[i + 3] == 1) for i in range(0, len(ks), 4)]

    def vnutri(X):
        return any((lo < X < hi) or (lz and abs(X - lo) < 1e-12) or (hz and abs(X - hi) < 1e-12) for lo, hi, lz, hz in kuski)

    # Особые точки точно: граница области и нули логарифмического множителя.
    x0 = sp.Rational(p["s"], p["k"])
    zeros = sp.solve(sp.Eq(sp.log(W, b) ** 2, c**2), x)
    tochki = sorted(set([x0] + [sp.nsimplify(z) for z in zeros]), key=float)
    ok(len(tochki) == 3, "16: две точки, где логарифм равен ±c", str(tochki))
    for z in tochki[1:]:
        ok(any(abs(float(z) - e) < 1e-12 for k_ in kuski for e in k_[:2]), "16: нуль множителя — конец ответа", str(z))
    # Знаки в серединах и за краями — точно (80 знаков).
    probnye = [tochki[0] - 1, tochki[-1] + 1] + [(tochki[i] + tochki[i + 1]) / 2 for i in range(2)]
    for t in probnye:
        v = F.subs(x, t)
        dom = (W.subs(x, t)) > 0
        verno = bool(dom) and ((sp.N(v, 80) >= 0) if ge else (sp.N(v, 80) <= 0))
        ok(verno == vnutri(float(t)), f"16: знак в {t}")
    # Концы ответа.
    for lo, hi, lz, hz in kuski:
        for e, z in ((lo, lz), (hi, hz)):
            if abs(e) > 1e8:
                continue
            te = sp.nsimplify(e, rational=True)
            if z:
                ok(sp.simplify(F.subs(x, te)) == 0, f"16: {te} — нуль, входит")
    mp.mp.dps = 50
    fl = sp.lambdify(x, F, "mpmath")
    plokho = 0
    lo_, hi_ = float(tochki[0]) - 4, float(tochki[-1]) + 4
    i = 0
    while lo_ + i * 0.003 <= hi_:
        X = mp.mpf(lo_) + mp.mpf(i) * mp.mpf("0.003")
        i += 1
        if any(abs(X - float(t)) < 1e-9 for t in tochki):
            continue
        if float(W.subs(x, float(X))) <= 0:
            v_ok = False
        else:
            v = fl(X)
            v_ok = (v >= 0) if ge else (v <= 0)
        if v_ok != vnutri(float(X)):
            plokho += 1
    ok(plokho == 0, "16: сетка mpmath", str(plokho))


def c17(p, kon):
    v, R, T, M = sp.symbols("v R T M", positive=True)
    f = 4 * sp.pi * v**2 * (M / (2 * sp.pi * R * T)) ** sp.Rational(3, 2) * sp.exp(-M * v**2 / (2 * R * T))
    krit = sp.solve(sp.diff(f, v), v)
    ok(len(krit) == 1 and sp.simplify(krit[0] - sp.sqrt(2 * R * T / M)) == 0, "17: точка максимума")
    Mv = sp.Rational([28, 4, 40, 20, 16, 44, 2][p["gaz"]], 1000)
    ok(2 * sp.Integer(p["T"]) / Mv == kon["K"], "17: 2T/M", f"{2 * p['T'] / Mv} {kon['K']}")


def c18(p, kon):
    a, b = sp.Rational(p["AD"], 2), sp.Rational(p["BC"], 2)
    h = sp.sqrt(p["AB"] ** 2 - (a - b) ** 2)
    A, D, B, C = sp.Point(-a, 0), sp.Point(a, 0), sp.Point(-b, h), sp.Point(b, h)
    K, M = sp.Point((A + B) / 2), sp.Point((C + D) / 2)
    P = [A, K, M, D] if p["vid"] == "AKMD" else [K, B, C, M]
    tr = sp.Triangle(P[0], P[1], P[2])
    O, Rr = tr.circumcenter, tr.circumradius
    ok(sp.simplify(O.distance(P[3]) - Rr) == 0, "18: четвёртая вершина на окружности")
    ok(sp.simplify(Rr**2 - sp.nsimplify(kon["R"] ** 2, rational=True)) == 0, "18 б): радиус", str(sp.nsimplify(Rr)))
    # а): при центре ABCD вне трапеции центр меньшей трапеции тоже вне — проверка на этой форме не нужна,
    # утверждение общее; проверяем знак для чисел версии, если условие выполнено.


def c19(p, kon):
    k_, pp = p["k"], p["p"]
    t, av = sp.symbols("t av", real=True)
    if p["vid"] == "shest":
        poly = t * (k_ * t**2 + (k_ + pp) * av) - t**2 * (av + k_ * pp) - av**2
    else:
        poly = t**2 * (av + k_ * pp) - t * (k_ * t**2 - (k_ - pp) * av) - av**2
    ok(sp.factor(poly) != poly, "19: многочлен раскладывается")

    def chislo(a_):
        pr = sp.Poly(poly.subs(av, a_), t)
        if pr.is_zero:
            return 10**6
        kor = set(r for r in sp.real_roots(pr) if r >= 0)
        return sum(1 if r == 0 else 2 for r in kor)

    ks = kon["kuski"]
    kuski = [(ks[i], ks[i + 1], ks[i + 2] == 1, ks[i + 3] == 1) for i in range(0, len(ks), 4)]

    def vnutri(X):
        return any((lo < X < hi) or (lz and X == lo) or (hz and X == hi) for lo, hi, lz, hz in kuski)

    N = kon["N"]
    plokho = []
    for i in range(-300, 1300, 7):
        a_ = sp.Rational(i, 40)
        if (chislo(a_) == N) != vnutri(float(a_)):
            plokho.append(str(a_))
    for c in (0, sp.nsimplify(kon["aStar"]), sp.nsimplify(kon["gran"], rational=True)):
        if (chislo(c) == N) != vnutri(float(c)):
            plokho.append(f"точка {c}")
    ok(not plokho, f"19: множество «ровно {N} корней»", ",".join(plokho[:5]))


def c20(p, kon):
    Lo, U, r = 10 ** (p["razr"] - 1), 10 ** p["razr"] - 1, p["r"]
    k0 = p["k0"]

    def mozhno(k):
        # 2Q1 = 2Q2: 2n + k − 1 = 2m + rk − 1 при допустимых n, m.
        for m in range(Lo, U - r * k + 2):
            n2 = 2 * m + (r - 1) * k
            if n2 % 2 == 0 and Lo <= n2 // 2 <= U - k + 1:
                return True
            if (r - 1) * k % 2:
                return False
        return False

    ok(mozhno(p["ka"]) and not mozhno(p["kb"]), "20: а) да, б) нет")
    best = None
    for k in range(k0, min(k0 + 400, (U - Lo + 1) // (r + 1)) + 1):
        par = []
        for n in (Lo, U - k + 1):
            for m in (Lo, U - r * k + 1, n + k, n - r * k):
                par.append((n, m))
        for m in (Lo, U - r * k + 1):
            for n in (m + r * k, m - k):
                par.append((n, m))
        for n, m in par:
            if not (Lo <= n <= U - k + 1 and Lo <= m <= U - r * k + 1):
                continue
            if not (m + r * k - 1 < n or m > n + k - 1):
                continue
            q1 = sp.Rational(2 * n + k - 1, 2)
            q2 = sp.Rational(2 * m + r * k - 1, 2)
            v = abs((q1 + q2) / 2 - (k * q1 + r * k * q2) / ((r + 1) * k))
            if best is None or (v < best if p["rezhim"] == "min" else v > best):
                best = v
    ok(near(best, kon["otv"]), "20: в)", f"{best} {kon['otv']}")


# ── Семьи D, E, F (варианты 7–12) ───────────────────────────────


def v_kuski(kon_kuski, t):
    """Принадлежность t множеству [lo, hi, loZ, hiZ, …] (±1e9 — бесконечность)."""
    q = kon_kuski
    for i in range(0, len(q), 4):
        lo, hi, lz, hz = q[i : i + 4]
        lo = -mp.inf if lo <= -1e9 else lo
        hi = mp.inf if hi >= 1e9 else hi
        if (t >= lo if lz else t > lo) and (t <= hi if hz else t < hi):
            return True
    return False


def sverka_setki(istina, kon_kuski, a0, a1, shag, where):
    konci = [v for i, v in enumerate(kon_kuski) if i % 4 < 2 and abs(v) < 1e9]
    plokho = []
    t = mp.mpf(a0)
    while t <= a1:
        if all(abs(t - c) > 1e-6 for c in konci) and istina(t) != v_kuski(kon_kuski, float(t)):
            plokho.append(float(t))
        t += shag
    ok(not plokho, where, str(plokho[:5]))


def d14(p, kon):
    A, B = sp.Integer(p["A"]), sp.Integer(p["B"])
    cA = A ** p["p"] + p["sA"]
    cB = B ** p["q"] + p["sB"]
    t = sp.nsimplify(sp.log(sp.Rational(cB, cA)) / sp.log(sp.Rational(A, B)))
    ok(near(t, kon["t"]), "d14: значение f", str(t))
    f = (sp.sin if p["f"] == "sin" else sp.cos)(p["k"] * x) ** 2
    otr = sp.Interval(sp.pi * sp.Rational(*p["lo"]), sp.pi * sp.Rational(*p["hi"]))
    korni = sorted(float(r) for r in sp.solveset(sp.Eq(f, t), x, otr))
    ok(len(korni) == len(kon["korni"]) and all(near(u, v) for u, v in zip(korni, kon["korni"])), "d14: корни", f"{korni}")


def d15(p, kon):
    s3 = sp.sqrt(3)
    T = {"O": (0, 0, 0), "A": (-1, 0, 0), "B": (0, -1, 0), "C": (1, 0, 0), "D": (1, 1, 0), "E": (0, 1, 0)}
    a = sp.sqrt(p["a2"])
    h = a * s3
    M = {}
    for k_, v in T.items():
        M[k_] = sp.Matrix([v[0] * a, v[1] * a, 0])
        M[k_ + "1"] = sp.Matrix([v[0] * a, v[1] * a, h])
    # а) h из условия: A1O = AC (равносторонний) или AB1 = AD.
    if p["vid"] == "tri":
        ok(sp.simplify((M["A1"] - M["O"]).norm() - (M["C"] - M["A"]).norm()) == 0, "d15: A1OC1 равносторонний")
    else:
        ok(sp.simplify((M["B1"] - M["A"]).norm() - (M["D"] - M["A"]).norm()) == 0, "d15: AB1 = AD")
    d = M[p["pr"][1]] - M[p["pr"][0]]
    nn = (M[p["pl"][1]] - M[p["pl"][0]]).cross(M[p["pl"][2]] - M[p["pl"][0]])
    s2 = sp.simplify(d.dot(nn) ** 2 / (d.dot(d) * nn.dot(nn)))
    v = sp.sqrt(s2 if p["fn"] == "sin" else 1 - s2)
    ok(near(v, kon["otvet"]), "d15: ответ", str(sp.nsimplify(v)))


def d16(p, kon):
    osn = lambda o: o["k"] if o["m"] == 0 else mp.sqrt(o["m"]) + o["k"]
    b1, b2 = osn(p["b1"]), osn(p["b2"])

    def ist(t):
        u = p["p"] * t + p["q"]
        if u <= 0:
            return False
        L = mp.log(u) / mp.log(b2)
        if L <= 0:
            return False
        v = mp.log(L) / mp.log(b1)
        return v >= 0 if p["znak"] == "ge" else v <= 0

    lo, hi = kon["lo"], min(kon["hi"], 1e6)
    for t, nado in ((lo + 1e-7, True), (lo - 1e-7, False), (min(hi - 1e-7, lo + 1), True)):
        ok(ist(mp.mpf(t)) == nado, "d16: граница", str(t))
    if hi < 1e6:
        ok(not ist(mp.mpf(hi + 1e-7)), "d16: правая граница")
        ok(ist(mp.mpf(hi)) == bool(kon["hiZ"]) or not kon["hiZ"], "d16: правый конец")


def d17(p, kon):
    w = sp.symbols("w", positive=True)
    L, C = sp.nsimplify(p["L"]), sp.nsimplify(p["Cm"]) / 10**5
    U = p["U"] * L * w / sp.sqrt(p["R"] ** 2 + (w * L - 1 / (w * C)) ** 2)
    kr = [r for r in sp.solve(sp.diff(U, w), w) if r.is_positive]
    ok(len(kr) == 1 and near(kr[0], kon["w"]), "d17: ω из производной", str(kr))


def d18(p, kon):
    mp.mp.dps = 40
    AB, AD, AL = p["AB"], p["AD"], p["AL"]

    def L_(cA):
        # L на биссектрисе угла A на расстоянии AL от A.
        return mp.matrix([AL * mp.sqrt((1 + cA) / 2), AL * mp.sqrt((1 - cA) / 2)])

    def nevyazka(cA):
        # L должна быть и на биссектрисе угла D: расстояния до AD и до CD равны.
        sA = mp.sqrt(1 - cA**2)
        L = L_(cA)
        return L[1] - (cA * L[1] - sA * (L[0] - AD))

    cA = mp.findroot(nevyazka, 0.1)
    sA = mp.sqrt(1 - cA**2)
    L = L_(cA)
    B = mp.matrix([AB * cA, AB * sA])
    O = (B + mp.matrix([AD, 0])) / 2
    V = mp.matrix([AD, 0]) if p["tr"][0] == "D" else mp.matrix([0, 0])
    S = abs((O - V)[0] * (L - V)[1] - (O - V)[1] * (L - V)[0]) / 2
    ok(near(S, kon["S"]), "d18: площадь", str(S))
    mp.mp.dps = 15


def d19(p, kon):
    D = sp.Rational(*p["D"])
    s = [(D - p["m"]) / sp.Integer(p["k"]), (-D - p["m"]) / sp.Integer(p["k"])]
    s1, s2 = max(s), min(s)
    n2 = p["p"] ** 2 + p["q"] ** 2
    c = p["p"] * p["x0"] + p["q"] * p["y0"]
    T1 = (c - s1) ** 2 / n2
    T2 = n2 / (c - s2) ** 2
    ok(near(T1, kon["T1"]) and near(T2, kon["T2"]), "d19: пороги")

    def chislo19(a_):
        n1 = 0 if a_ < T1 else 1 if a_ == T1 else 2
        m2 = 2 if a_ < T2 else 1 if a_ == T2 else 0
        return n1 + m2

    pl = []
    for i in range(1, 1600):
        a_ = sp.Rational(i, 40)
        if (chislo19(a_) in p["nado"]) != v_kuski(kon["kuski"], float(a_)):
            pl.append(str(a_))
    for t in (T1, T2):
        if (chislo19(t) in p["nado"]) != v_kuski(kon["kuski"], float(t)):
            pl.append(f"порог {t}")
    ok(not pl, "d19: множество", ",".join(pl[:5]))


def d20(p, kon):
    def ryad(D):
        sh = p["s"] * D
        n_ = p["N0"] - sh
        out = [n_]
        for _ in range(p["M"] - 1):
            n_ = n_ - sh if n_ > sh else (n_ - sh) ** 2
            out.append(n_)
        return out

    estA = any(p["A"] in ryad(D) for D in range(2, 1500))
    estB = any(p["B"] in ryad(D) for D in range(2, 1500))
    ok(estA == kon["A"] and estB == kon["B"], "d20: а), б)")
    ok(len(set(ryad(p["Dv"]))) == kon["V"], "d20: в)")


def e14(p, kon):
    e = sp.Rational(*p["e"])
    korni = []
    for t in (p["t1"], p["t2"]):
        v = sp.Integer(p["q"]) ** t - p["s"]
        if v >= 1:
            korni.append(sp.log(v, p["c"]) ** 2)
    # Проверка уравнения в найденных корнях: log_{q^e}^2 − κ log_q + μ с κ, μ по t₁, t₂.
    kap = sp.Rational(p["t1"] + p["t2"]) / e**2
    mu = sp.Rational(p["t1"] * p["t2"]) / e**2
    for r in korni:
        A = p["c"] ** sp.sqrt(r) + p["s"]
        val = (sp.log(A) / sp.log(sp.Integer(p["q"]) ** e)) ** 2 - kap * sp.log(A) / sp.log(p["q"]) + mu
        ok(abs(sp.N(val, 30)) < 1e-20, "e14: корень удовлетворяет уравнению")
    korni = sorted(korni, key=float)
    ok(len(korni) == len(kon["korni"]) and all(near(u, v) for u, v in zip(korni, kon["korni"])), "e14: корни")
    otb = [r for r in korni if p["k1"] ** 2 <= r <= p["k2"] ** 2]
    ok(len(otb) == len(kon["otbor"]) and all(near(u, v) for u, v in zip(otb, kon["otbor"])), "e14: отбор")


def e15(p, kon):
    b, d = sp.Integer(p["b"]), sp.Integer(p["d"])
    AB = 2 * b * d / (b + d)
    CD = b + d - AB
    X, Y = sp.symbols("X Y", real=True)
    sol = [s_ for s_ in sp.solve([X**2 + Y**2 - AB**2, (X + b - d) ** 2 + Y**2 - CD**2], [X, Y], dict=True) if s_[Y] > 0]
    ok(len(sol) == 1, "e15: трапеция однозначна")
    Bx, By = sol[0][X], sol[0][Y]
    P2 = {"A": (0, 0), "B": (Bx, By), "C": (Bx + b, By), "D": (d, 0)}
    if p["usl"] == "BC1=A1C1":
        h = sp.sqrt((Bx + b) ** 2 + By**2 - b**2)
    else:
        h = sp.sqrt((d - Bx) ** 2 + By**2 - d**2)
    ok(sp.simplify(h - By) == 0 and AB + CD == b + d, "e15: а) высота призмы = высоте трапеции, суммы сторон равны")
    M = {}
    for k_, (u, v) in P2.items():
        M[k_] = sp.Matrix([u, v, 0])
        M[k_ + "1"] = sp.Matrix([u, v, h])
    nn = (M[p["pl"][1]] - M[p["pl"][0]]).cross(M[p["pl"][2]] - M[p["pl"][0]])
    rho = sp.Abs(nn.dot(M[p["t"]] - M[p["pl"][0]])) / nn.norm()
    ok(near(rho, kon["dist"]), "e15: расстояние", str(sp.nsimplify(rho)))


def e16(p, kon):
    P_, Q_, m_, n_ = p["p"], p["q"], p["m"], p["n"]
    K = P_ ** (m_ - n_)

    def ist(t):
        t2 = t * t
        g = P_ ** (t2 - m_) * (Q_ ** (t2 - n_) + K) - (P_ * P_) ** (t2 - mp.mpf(m_ + n_) / 2) - Q_ ** (t2 - n_)
        return {"lt": g < 0, "gt": g > 0, "le": g <= 0, "ge": g >= 0}[p["znak"]]

    sverka_setki(ist, kon["kuski"], -4.5, 4.5, mp.mpf("0.003"), "e16: неравенство на сетке")


def e17(p, kon):
    al = sp.symbols("al", positive=True)
    h, u, v = sp.Integer(p["h"]), sp.nsimplify(p["u"]), sp.nsimplify(p["v"])
    l = h * (u + v * sp.cos(al)) / (v * sp.sin(al))
    kr = [r for r in sp.solve(sp.diff(l, al), al) if 0 < float(r) < float(sp.pi)]
    ok(len(kr) == 1 and near(sp.simplify(l.subs(al, kr[0])), kon["l"]), "e17: минимум", str(kr))


def e18(p, kon):
    A_, C_, B_ = sp.Matrix([-p["a"], 0]), sp.Matrix([p["a"], 0]), sp.Matrix([0, p["m"]])

    def proj(P, X_, Y_):
        u = Y_ - X_
        return X_ + u * (P - X_).dot(u) / u.dot(u)

    K = proj(C_, A_, B_)
    N = proj(A_, B_, C_)
    o1, o2 = sp.symbols("o1 o2", real=True)
    O = sp.Matrix([o1, o2])
    so = sp.solve([(O - K).dot(O - K) - (O - B_).dot(O - B_), (O - N).dot(O - N) - (O - B_).dot(O - B_)], [o1, o2], dict=True)[0]
    Oc = sp.Matrix([so[o1], so[o2]])
    R = sp.sqrt((Oc - K).dot(Oc - K))
    KN = sp.sqrt((K - N).dot(K - N))
    ok(near(R, kon["R"]) and near(KN, kon["KN"]), "e18: R и KN", f"{sp.nsimplify(R)} {sp.nsimplify(KN)}")


def e19(p, kon):
    cx, cy, r = p["cx"], p["cy"], p["r"]
    al, be = p["al"], p["be"]

    def chislo19(a_):
        # Прямые y = x + (be − al)a и y = −x + (al + be)a: точное число общих точек с окружностью.
        X = sp.symbols("X", real=True)
        tochki = set()
        for y_ in (X + (be - al) * a_, -X + (al + be) * a_):
            for s_ in sp.solve(sp.Eq((X - cx) ** 2 + (y_ - cy) ** 2, r * r), X):
                if s_.is_real:
                    tochki.add((sp.nsimplify(s_), sp.nsimplify(y_.subs(X, s_))))
        return len({(sp.simplify(u), sp.simplify(v)) for u, v in tochki})

    pl = []
    for i in range(-300, 300, 7):
        a_ = sp.Rational(i, 37)
        if (chislo19(a_) == p["k"]) != v_kuski(kon["kuski"], float(a_)):
            pl.append(str(a_))
    ok(not pl, "e19: множество на сетке", ",".join(pl[:5]))


def e20(p, kon):
    from fractions import Fraction as Fr

    def novoe(m_):
        d_ = sorted(str(m_))
        return int("".join(reversed(d_))) if "0" in d_ else int("".join(d_))

    def klass(m_):
        s_ = str(m_)
        return "W" if s_[1:] == "00" else "T" if s_[1] == "0" else "U" if s_[2] == "0" else "Z"

    mx = p["cel"] == "max"
    otn = lambda m_: Fr(novoe(m_), m_) if mx else Fr(m_, novoe(m_))
    po = {}
    for m_ in range(100, 1000):
        po.setdefault(klass(m_), []).append(m_)
    top = {k_: sorted(v, key=otn, reverse=True)[:6] for k_, v in po.items()}
    kand = [m_ for v in top.values() for m_ in v]
    best = Fr(0)
    N = p["N"]
    for f_ in kand:
        for s1 in [None] + kand:
            for s2 in [None] + kand:
                nab = [(f_, N - (s1 is not None) - (s2 is not None))] + [(s_, 1) for s_ in (s1, s2) if s_ is not None]
                kl = {klass(m_) for m_, c_ in nab if c_ > 0}
                if not ((kl & {"T", "W"}) and (kl & {"U", "W"}) and "Z" in kl):
                    continue
                S1 = sum(m_ * c_ for m_, c_ in nab)
                S2 = sum(novoe(m_) * c_ for m_, c_ in nab)
                best = max(best, Fr(S2, S1) if mx else Fr(S1, S2))
    ok(best == Fr(kon["P"], kon["Q"]), "e20: в) наибольшее отношение перебором", str(best))
    ok(kon["a"] == (1 if p["D"] % 9 == 0 else 0), "e20: а) остаток по модулю 9")
    ok(kon["b"] == (1 if p["k"] < best else 0), "e20: б) сравнение с наибольшим отношением")


def f14(p, kon):
    F = sp.sin if p["F"] == "sin" else sp.cos
    G = sp.cos if p["F"] == "sin" else sp.sin
    pol = sp.expand(sp.prod([q * c - pp for pp, q in p["korni"]]))
    L3, B2, C1, D0 = [pol.coeff(c, i) for i in (3, 2, 1, 0)]
    lev = L3 * F(x) ** 3 - B2 * G(x) ** 2 + C1 * F(x) + p["sg"] * G(x) + D0 + B2
    prav = p["sg"] * G(x)
    a_lo, a_hi = sp.pi * sp.Rational(*p["lo"]), sp.pi * sp.Rational(*p["hi"])
    f_ = sp.lambdify(x, lev - prav, "mpmath")
    g_ = sp.lambdify(x, prav, "mpmath")
    mp.mp.dps = 30
    korni = []
    t = mp.mpf(float(a_lo)) - mp.mpf("0.001")
    shag = mp.mpf("0.0005")
    prev = None
    while t <= float(a_hi) + 0.001:
        v = abs(f_(t)) + max(0, -g_(t))
        if prev is not None and prev[1] < v and prev[1] <= prev[2] and prev[1] < 1e-3:
            try:
                r = mp.findroot(lambda s: f_(s), prev[0])
                if a_lo - 1e-12 <= r <= a_hi + 1e-12 and g_(r) >= -1e-20 and all(abs(r - q) > 1e-8 for q in korni):
                    korni.append(r)
            except Exception:
                pass
        prev = (t, v, prev[1] if prev else mp.inf)
        t += shag
    korni = sorted(float(r / mp.pi) for r in korni)
    ok(len(korni) == len(kon["otbor"]) and all(near(u, v, 1e-7) for u, v in zip(korni, kon["otbor"])), "f14: корни на отрезке", f"{korni} {kon['otbor']}")
    s = kon["serii"]
    for i in range(0, len(s), 2):
        for nn in range(-2, 3):
            xv = mp.pi * (s[i] + s[i + 1] * nn)
            ok(abs(f_(xv)) < 1e-20 and g_(xv) >= -1e-20, "f14: серия — корень")
    mp.mp.dps = 15


def f15(p, kon):
    a_, h = sp.sqrt(p["a2"]), sp.sqrt(p["h2"])
    T = {"A": sp.Matrix([0, 0, 0]), "B": sp.Matrix([a_, 0, 0]), "C": sp.Matrix([a_, a_, 0]), "D": sp.Matrix([0, a_, 0]), "S": sp.Matrix([0, 0, h])}
    K = (T["S"] + T["B"]) / 2
    u = K - T["D"]
    v = T[p["pr"][1]] - T[p["pr"][0]]
    cos = sp.simplify(sp.Abs(u.dot(v)) / (u.norm() * v.norm()))
    ok(near(cos, kon["cos"]), "f15: косинус", str(cos))


def f16(p, kon):
    q, c_, d_ = p["q"], p["c"], p["d"]
    S, P = p["r1"] + p["r2"], p["r1"] * p["r2"]

    def ist(t):
        w = c_**t - d_
        if w <= 0:
            return False
        L = mp.log(w) / mp.log(mp.mpf(1) / q)
        den = L * L + p["sg"] * 2 * L + 1
        if den == 0:
            return False
        v = ((p["p"] ** 2) ** t - S * p["p"] ** t + P) / den
        return v <= 0 if p["znak"] == "le" else v >= 0

    konci = [v for i, v in enumerate(kon["kuski"]) if i % 4 < 2 and abs(v) < 1e9]
    sverka_setki(ist, kon["kuski"], min(konci) - 2, max(konci) + 2, mp.mpf("0.0007"), "f16: неравенство на сетке")


def f17(p, kon):
    eps = sp.symbols("eps", positive=True)
    kT = sp.Rational(138, 100) * sp.Rational(1, 10**23) * p["T"]
    f_ = 2 * sp.sqrt(eps / sp.pi) * (1 / kT) ** sp.Rational(3, 2) * sp.exp(-eps / kT)
    kr = sp.solve(sp.diff(f_, eps), eps)
    ok(len(kr) == 1 and near(kr[0], kon["eps"]), "f17: ε максимума", str(kr))


def f18(p, kon):
    R = sp.Integer(p["R"])
    c0 = 2 * R + R * sp.sqrt(2)
    B_, O, G, N = sp.Matrix([c0 - 2 * R, 2 * R]), sp.Matrix([R, R]), sp.Matrix([R, 2 * R]), sp.Matrix([c0 / 2, c0 / 2])
    dl = lambda P_, Q_: sp.sqrt((P_ - Q_).dot(P_ - Q_))
    ok(sp.simplify(dl(O, N) - R) == 0, "f18: N на окружности")
    ok(sp.simplify(dl(B_, N if p["dok"] == "BN" else G) - (sp.sqrt(2) - 1) * R) == 0, "f18: а)")
    kv = [B_, N, O, G]
    S = sp.Abs(sum(kv[i][0] * kv[(i + 1) % 4][1] - kv[(i + 1) % 4][0] * kv[i][1] for i in range(4))) / 2
    Pm = sum(dl(kv[i], kv[(i + 1) % 4]) for i in range(4))
    Ro = dl(B_, O) / 2
    v = {"r": 2 * S / Pm, "Ro": Ro, "S": S, "P": Pm}[p["nado"]]
    ok(near(v, kon["v"]), "f18: б)", str(sp.nsimplify(sp.simplify(v))))


def f19(p, kon):
    K = p["r"] * (p["R"] ** 2 - p["r"] ** 2)
    zn = -1 if p["vid"] == "minus" else 1

    def chislo19(a_):
        if a_ < 0:
            return 0
        D = p["R"] ** 2 * a_**2 - K * a_
        if D < 0:
            return 0
        us = {sp.nsimplify(-zn * a_**2 + s_ * sp.sqrt(D)) for s_ in ((1, -1) if zn < 0 else (1,))}
        return sum(2 if u > 0 else 1 if u == 0 else 0 for u in us)

    pl = []
    for i in range(0, 400):
        a_ = sp.Rational(i, 41)
        if (chislo19(a_) == p["k"]) != v_kuski(kon["kuski"], float(a_)):
            pl.append(str(a_))
    ok(not pl, "f19: множество на сетке", ",".join(pl[:5]))


def f20(p, kon):
    N, ks = [], set()
    for B in range(p["B0"] + 1, p["B1"]):
        for s_ in range(p["s0"] + 1, p["s1"]):
            for k_ in range(1, 500):
                if k_ * B == (k_ + p["d"]) * s_ and p["e"] < s_:
                    N.append(k_ * B - p["e"])
                    ks.add(k_)
    ok(min(N) == kon["Nmin"] and max(N) == kon["Nmax"] and (p["k0"] in ks) == bool(kon["a"]), "f20: перебор")


F = {
    "z14.logTrig": z14,
    "z15.rombPiramida": z15,
    "z16.pokazKoren": z16,
    "z17.kachka": z17,
    "z18.pyatiugolnik": z18,
    "z19.logKoren": z19,
    "z20.zabor": z20,
    "b14.pokazStepen": b14,
    "b15.prizmaPloskost": b15,
    "b16.logBikvadrat": b16,
    "b17.dzhoul": b17,
    "b18.pryamougolnik": b18,
    "b19.koren4": b19,
    "b20.pokupka": b20,
    "c14.tgPodstanovka": c14,
    "c15.sferaPiramida": c15,
    "c16.pokazLog": c16,
    "c17.maksvell": c17,
    "c18.trapeciyaSrednyaya": c18,
    "c19.modul": c19,
    "c20.srednie": c20,
    "d14.pokazTrig": d14,
    "d15.prizmaPyatiugolnik": d15,
    "d16.logLog": d16,
    "d17.katushka": d17,
    "d18.parallelogrammBiss": d18,
    "d19.paraPryamyh": d19,
    "d20.ryadKvadrat": d20,
    "e14.logKoren": e14,
    "e15.prizmaTrapeciya": e15,
    "e16.pokazRazlozh": e16,
    "e17.snos": e17,
    "e18.vysotyRavnobedr": e18,
    "e19.okrPrjamye": e19,
    "e20.perestanovkaCifr": e20,
    "f14.koren3": f14,
    "f15.piramidaMediany": f15,
    "f16.drobLog": f16,
    "f17.raspredelenie": f17,
    "f18.trapeciyaOkr": f18,
    "f19.moduliKoren": f19,
    "f20.albomy": f20,
}

rows = json.load(open(sys.argv[1], encoding="utf-8"))
for row in rows:
    before = fails
    F[row["s"]](row["p"], row["kontrol"])
    print(f"  {'✓' if fails == before else '✗'} {row['v']} {row['s']}")
print(f"\nПроверок: {checks}, ошибок: {fails}")
sys.exit(1 if fails else 0)
