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
}

rows = json.load(open(sys.argv[1], encoding="utf-8"))
for row in rows:
    before = fails
    F[row["s"]](row["p"], row["kontrol"])
    print(f"  {'✓' if fails == before else '✗'} {row['v']} {row['s']}")
print(f"\nПроверок: {checks}, ошибок: {fails}")
sys.exit(1 if fails else 0)
