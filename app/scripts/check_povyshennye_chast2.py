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


def z17(p, kon):
    T = sp.Rational(str(p["T"]))
    tau = sp.symbols("tau", positive=True)
    nn = sp.Rational(3, 10)
    A2 = tau**4 / ((T**2 - tau**2) ** 2 + nn * tau**2 * T**2)
    krit = [r for r in sp.solve(sp.diff(A2, tau), tau) if r.is_positive]
    ok(len(krit) == 1 and sp.simplify(krit[0] - T * sp.sqrt(2 / (2 - nn))) == 0, "17: максимум (n = 0,3)", str(krit))


def b17(p, kon):
    R = sp.symbols("R", positive=True)
    E, r = sp.nsimplify(p["E"]), sp.nsimplify(p["r"])
    P = (E / (r + R)) ** 2 * R
    krit = [s_ for s_ in sp.solve(sp.diff(P, R), R) if s_.is_positive]
    ok(len(krit) == 1 and krit[0] == r, "b17: максимум при R = r")
    nado = r if p.get("vopros", "R") == "R" else P.subs(R, r)
    ok(near(nado, kon["otvet"]), "b17: ответ", f"{nado} {kon['otvet']}")


def c14(p, kon):
    A, B, C = p["a"], p["b"], p["c"]
    f = A * sp.sin(2 * x) + B * sp.cos(2 * x) - C
    for t in kon["t"]:
        tt = sp.nsimplify(t, rational=True)
        ok(sp.simplify(sp.expand_trig(f.subs(x, sp.atan(tt)))) == 0, "14: arctg t — корень", str(tt))
    otr = sp.Interval(sp.pi * p["lo"] / 2, sp.pi * (p["lo"] + 2) / 2)
    korni = sorted(float(r) for r in sp.solveset(sp.Eq(f, 0), x, otr))
    ok(len(korni) == 2 and all(near(u, v) for u, v in zip(korni, kon["korni"])), "14: корни на отрезке", f"{korni} {kon['korni']}")


OSN16 = {"0,5": sp.Rational(1, 2), "0,25": sp.Rational(1, 4), "0,2": sp.Rational(1, 5), "0,1": sp.Rational(1, 10), "0,04": sp.Rational(1, 25)}


def c17(p, kon):
    v, R, T, M = sp.symbols("v R T M", positive=True)
    f = 4 * sp.pi * v**2 * (M / (2 * sp.pi * R * T)) ** sp.Rational(3, 2) * sp.exp(-M * v**2 / (2 * R * T))
    krit = sp.solve(sp.diff(f, v), v)
    ok(len(krit) == 1 and sp.simplify(krit[0] - sp.sqrt(2 * R * T / M)) == 0, "17: точка максимума")
    Mv = sp.Rational([28, 4, 40, 20, 16, 44, 2][p["gaz"]], 1000)
    ok(2 * sp.Integer(p["T"]) / Mv == kon["K"], "17: 2T/M", f"{2 * p['T'] / Mv} {kon['K']}")


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


# ── Семьи G, H, J (варианты 13–18) ──────────────────────────────

from fractions import Fraction as Fr


def dr(v):
    return Fr(v[0], v[1])


def nuli_mp(f, a0, a1, shag):
    """Корни f на [a0; a1]: смена знака на сетке + уточнение findroot."""
    out = []
    t = mp.mpf(a0)
    ft = f(t)
    while t < a1:
        u = t + shag
        fu = f(u)
        if ft == 0:
            out.append(t)
        elif ft * fu < 0:
            out.append(mp.findroot(f, (t, u), solver="bisect"))
        t, ft = u, fu
    return out


def sravn_spiski(where, a, b, tol=1e-9):
    ok(len(a) == len(b) and all(abs(float(u) - float(v)) < tol for u, v in zip(sorted(a), sorted(b))), where, f"{[float(u) for u in a]} vs {b}")


def g14(p, kon):
    q, s, k = p["q"], p["sg"], p["k"]
    S, P = p["t1"] + p["t2"], p["t1"] * p["t2"]
    B1, B2, cc = mp.mpf(q) ** p["u1"], mp.mpf(q) ** p["u2"], mp.mpf(q) ** p["e"]
    f = lambda x: B1 ** ((p["e"] + 2 * s * k * x) / p["u1"]) / cc - S * B2 ** ((p["e"] + s * k * x) / p["u2"]) / cc + P
    korni = nuli_mp(f, -6, 6, mp.mpf(1) / 1024)
    sravn_spiski("g14: корни", korni, kon["korni"])
    sravn_spiski("g14: отбор", [r for r in korni if p["lo"] - 1e-12 <= r <= p["hi"] + 1e-12], kon["vybor"])


def g15(p, kon):
    a = mp.sqrt(p["a2"])
    t = mp.mpf(p["m"]) / (p["m"] + p["n"])
    h2 = p["a2"] * (mp.mpf(3) / 2 - t)
    ok(near(h2, kon["h2"]), "g15: h²")
    h = mp.sqrt(h2)
    V = lambda *c_: mp.matrix(list(c_))
    A, B, C, D = V(0, 0, 0), V(a, 0, 0), V(a, a, 0), V(0, a, 0)
    z = V(0, 0, h)
    A1, B1, C1, D1 = A + z, B + z, C + z, D + z
    kr = lambda u, v: V(u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0])
    dt = lambda u, v: sum(u[i] * v[i] for i in range(3))
    N = (A + B) / 2
    K = C1 + t * (D1 - C1)
    nrm = kr(K - N, D - B)
    ok(mp.norm(kr(nrm, A1 - C)) < 1e-20 * mp.norm(nrm) * mp.norm(A1 - C) + 1e-12, "g15: а) CA₁ ⊥ α")
    rebra = [(A, B), (B, C), (C, D), (D, A), (A1, B1), (B1, C1), (C1, D1), (D1, A1), (A, A1), (B, B1), (C, C1), (D, D1)]
    pts = []
    for X, Y in rebra:
        den = dt(nrm, Y - X)
        if abs(den) < 1e-20:
            continue
        lam = dt(nrm, N - X) / den
        if -1e-15 <= lam <= 1 + 1e-15:
            T = X + lam * (Y - X)
            if all(mp.norm(T - Q) > 1e-9 for Q in pts):
                pts.append(T)
    ok(len(pts) == 6, "g15: сечение — шестиугольник", str(len(pts)))
    c0 = sum(pts, V(0, 0, 0)) / len(pts)
    e1 = (pts[0] - c0) / mp.norm(pts[0] - c0)
    e2 = kr(nrm / mp.norm(nrm), e1)
    uv = sorted(((dt(T - c0, e1), dt(T - c0, e2)) for T in pts), key=lambda w: mp.atan2(w[1], w[0]))
    S = abs(sum(uv[i][0] * uv[(i + 1) % len(uv)][1] - uv[(i + 1) % len(uv)][0] * uv[i][1] for i in range(len(uv)))) / 2
    zP = [T[2] for T in pts if abs(T[0] - a) < 1e-12 and abs(T[1]) < 1e-12]
    ok(bool(zP) and near(zP[0], kon["zP"]), "g15: точка на BB₁")
    rho = abs(dt(nrm, C - N)) / mp.norm(nrm)
    otv = S if p["nado"] == "S" else S * rho / 3
    ok(near(otv, kon["otvet"]), f"g15: {p['nado']}", f"{otv} {kon['otvet']}")


def g16(p, kon):
    q, c, K = mp.mpf(p["q"]), p["c"], p["K"]

    def istina(x):
        if abs(x) <= c:
            return False
        v = p["sg"] * mp.log((x - c) / (x + c)) / mp.log(1 / q) + 2 * mp.log(x * x - c * c) / mp.log(q * q)
        return v >= K if p["znak"] == "ge" else v <= K

    sverka_setki(istina, kon["kuski"], -30, 30, mp.mpf("0.00731"), "g16: сетка")


def g18(p, kon):
    mu = mp.mpf(p["m"]) / (p["m"] + p["n"])
    s = mp.sqrt(p["s2"])

    def tochki(al):
        C = mp.matrix([0, 0])
        B = mp.matrix([s, 0])
        D = mp.matrix([s * mp.cos(al), s * mp.sin(al)])
        A = B + D
        M = B + mu * (C - B)
        return A, B, C, D, M

    def razn(al):
        A, B, C, D, M = tochki(al)
        return mp.norm(D - B) - mp.norm(D - M)

    al = mp.findroot(razn, (mp.mpf("0.01"), mp.pi / 2 - mp.mpf("1e-9")), solver="bisect")
    ok(near(mp.cos(al), kon["cos"]), "g18: косинус острого угла")
    A, B, C, D, M = tochki(al)
    d = M - D
    H = D + d * ((B - D).T * d)[0] / (d.T * d)[0]
    u = (H - B) / mp.norm(H - B)
    Pl = lambda lam: B + lam * u
    if p["vid"] == "vpis":
        lam = mp.findroot(lambda l: mp.norm(Pl(l) - B) - mp.norm(Pl(l) - D), (mp.mpf("1e-6"), 10 * s), solver="bisect")
        P = Pl(lam)
        pts = [A, B, P, D]
        S = abs(sum(pts[i][0] * pts[(i + 1) % 4][1] - pts[(i + 1) % 4][0] * pts[i][1] for i in range(4))) / 2
        otv = S / ((2 * s + mp.norm(P - B) + mp.norm(P - D)) / 2)
    else:
        # Окружность через A, B, D: вторая точка на прямой BH — с положительным параметром.
        O = mp.lu_solve(mp.matrix([[2 * (B[0] - A[0]), 2 * (B[1] - A[1])], [2 * (D[0] - A[0]), 2 * (D[1] - A[1])]]),
                        mp.matrix([B[0] ** 2 + B[1] ** 2 - A[0] ** 2 - A[1] ** 2, D[0] ** 2 + D[1] ** 2 - A[0] ** 2 - A[1] ** 2]))
        lam = 2 * ((O - B).T * u)[0]
        ok(lam > 0, "g18: P на луче BH")
        otv = mp.norm(O - A)
    ok(near(otv, kon["otvet"]), f"g18: {p['vid']}", f"{otv} {kon['otvet']}")


def kolvo_kusochno(fn, uzly):
    """Число корней непрерывной кусочно-линейной fn с изломами в uzly (−1 — бесконечно много)."""
    xs = sorted(set(uzly))
    korni = {u for u in xs if fn(u) == 0}
    for u, v in zip(xs, xs[1:]):
        fu, fv = fn(u), fn(v)
        if fu == 0 and fv == 0:
            return -1
        if fu * fv < 0:
            korni.add(u + (v - u) * fu / (fu - fv))
    # Лучи левее первого и правее последнего излома.
    for x1, x2 in ((xs[0], xs[0] - 1), (xs[-1], xs[-1] + 1)):
        f1, f2 = fn(x1), fn(x2)
        if f1 == f2:
            if f1 == 0:
                return -1
            continue
        z = x1 - f1 * (x2 - x1) / (f2 - f1)
        if (z - x1) * (x2 - x1) > 0:
            korni.add(z)
    return len(korni)


def g19(p, kon):
    k, sg = p["k"], p["sg"]
    c, beta, gamma = dr(p["c"]), dr(p["beta"]), sg * dr(p["g"])

    def chislo(a):
        a = Fr(a)
        fn = lambda x: abs(x - beta * a) + abs(k * x - k * gamma * a) - c - sg * a * x
        return kolvo_kusochno(fn, [beta * a, gamma * a])

    def istina(a):
        a = Fr(str(a)) if not isinstance(a, Fr) else a
        if (sg < 0 and a < 0) or (sg > 0 and a > 0) or (a == 0 and not p["nol"]):
            return False
        return chislo(a) == p["N"]

    znak = 1 if sg < 0 else -1
    konci = [v for i, v in enumerate(kon["kuski"]) if i % 4 < 2 and abs(v) < 1e9]
    kraj = max(konci) * 1.5 + 2
    plokho = []
    for i in range(0, int(kraj * 997)):
        a = Fr(i, 997) * znak
        if all(abs(float(a) - v) > 1e-6 for v in konci) and istina(a) != v_kuski(kon["kuski"], float(a)):
            plokho.append(float(a))
    ok(not plokho, "g19: сетка", str(plokho[:5]))
    for v in konci:
        a = Fr(v).limit_denominator(10000)
        ok(istina(a) == v_kuski(kon["kuski"], float(a)), f"g19: конец {v}")


def g20(p, kon):
    N, P, Q = p["N"], p["p"], p["q"]

    def goditsya(nab):
        s_ = sorted(nab)
        return len(s_) == N and len(set(s_)) == N and sum(s_[:P]) > sum(s_[-Q:])

    ok(goditsya(kon["primerA"]) and -p["X1"] in kon["primerA"], "g20: а) пример")
    if kon["mozhnoB"]:
        ok(goditsya(kon["primerB"]) and p["X2"] in kon["primerB"], "g20: б) пример")
    else:
        ok(Q - 1 == P, "g20: б) «нет» только при q − 1 = p")
    ok(goditsya(kon["primerV"]) and sum(kon["primerV"]) == kon["maks"], "g20: в) пример")
    # Оценка: a₁ и шаги g_j ≥ 1; условие линейно — перебираем распределения до 3 лишних единиц шага.
    cP = [max(0, P - j) for j in range(1, N)]
    cQ = [min(Q, N - j) for j in range(1, N)]
    best = None
    import itertools

    for extra in range(0, 4):
        for poz in itertools.combinations_with_replacement(range(N - 1), extra):
            g = [1] * (N - 1)
            for j in poz:
                g[j] += 1
            G = sum(g[j] * (cP[j] - cQ[j]) for j in range(N - 1))
            a1 = (G - 1) // (Q - P)
            tot = N * a1 + sum(g[j] * (N - 1 - j) for j in range(N - 1))
            best = tot if best is None else max(best, tot)
    ok(best == kon["maks"], "g20: в) перебор шагов", f"{best} {kon['maks']}")
    # Каждая лишняя единица шага уменьшает сумму (без учёта округления) — дальше перебор не нужен.
    ok(all((N - 1 - j) * (Q - P) + N * (cP[j] - cQ[j]) < 0 for j in range(N - 1)), "g20: шаг выгоден только минимальный")


def h14(p, kon):
    q, c = mp.mpf(p["q"]), p["c"]

    def chlen(ch, x):
        return mp.mpf(ch["A"][0]) / ch["A"][1] * (mp.log((x + c) ** ch["w"]) / mp.log(q ** (mp.mpf(ch["e"][0]) / ch["e"][1]))) ** ch["k"]

    def f(x):
        lev = sum((chlen(ch, x) for ch in p["chleny"] if not ch.get("prav")), mp.mpf(0)) + mp.mpf(p["Clev"][0]) / p["Clev"][1]
        prav = sum((chlen(ch, x) for ch in p["chleny"] if ch.get("prav")), mp.mpf(0)) + mp.mpf(p["Cprav"][0]) / p["Cprav"][1]
        return lev - prav

    # Сетка по t = log_q(x + c): x = q^t − c.
    korni = [q ** t - c for t in nuli_mp(lambda t: f(q ** t - c), -12, 12, mp.mpf(1) / 512)]
    sravn_spiski("h14: корни", korni, kon["korni"])
    lo = mp.log(dr(p["lo"]["y"])) / mp.log(dr(p["lo"]["b"]))
    hi = mp.log(dr(p["hi"]["y"])) / mp.log(dr(p["hi"]["b"]))
    ok(near(lo, kon["lo"]) and near(hi, kon["hi"]), "h14: концы отрезка")
    sravn_spiski("h14: отбор", [r for r in korni if lo - 1e-12 <= r <= hi + 1e-12], kon["vybor"])


def h15(p, kon):
    a, h = sp.sqrt(p["a2"]), sp.sqrt(p["h2"])
    A, B, C, D = [sp.Matrix(v) for v in ([0, 0, 0], [a, 0, 0], [a, a, 0], [0, a, 0])]
    S = sp.Matrix([a / 2, a / 2, h])
    K = (S + B) / 2
    u, v = K - D, C - S
    nrm = u.cross(v)
    r2 = sp.simplify((D - S).dot(nrm) ** 2 / nrm.dot(nrm))
    cos2 = sp.simplify(u.dot(v) ** 2 / (u.dot(u) * v.dot(v)))
    ok(near(r2, kon["rasst2"]) and near(cos2, kon["cos2"]), "h15: ρ² и cos²", f"{r2} {cos2}")
    otv = sp.sqrt(r2) if p["nado"] == "rasst" else sp.acos(sp.sqrt(cos2))
    ok(near(otv, kon["otvet"]), "h15: ответ")


def h16(p, kon):
    B, x0 = mp.mpf(p["B"]), p["x0"]
    A = B ** (2 * p["e2"] - p["e1"])

    def istina(x):
        w = x0 - x if p["luch"] == "le" else x - x0
        if w < 0:
            return False
        zn = B ** (x * x - p["e1"]) - (A + 1) * B ** (x * x / 2 - p["e2"]) + 1
        if abs(zn) < mp.mpf("1e-30"):
            return False
        v = mp.sqrt(w) / zn
        return v <= 0 if p["znak"] == "le" else v >= 0

    sverka_setki(istina, kon["kuski"], -12, 12, mp.mpf("0.00731"), "h16: сетка")
    with mp.workdps(60):
        for i in range(0, len(kon["kuski"]), 4):
            for j in (0, 1):
                v = kon["kuski"][i + j]
                if abs(v) < 1e9:
                    tv = mp.sqrt(mp.mpf(round(v * v, 9))) * (1 if v > 0 else -1)
                    ok(istina(tv) == bool(kon["kuski"][i + 2 + j]), f"h16: конец {v}")


def h18(p, kon):
    # Угол θ при основании AD подбираем по отношению отрезков касательных CT : TD.
    m, n, L = p["m"], p["n"], mp.mpf(p["L"])
    th = mp.findroot(lambda t: mp.tan(t / 2) ** 2 - mp.mpf(m) / n, (mp.mpf("0.001"), mp.pi - mp.mpf("0.001")), solver="bisect")
    H = L * mp.sin(th)
    r = H / 2
    TD = r / mp.tan(th / 2)
    CT = r / mp.tan((mp.pi - th) / 2)
    ok(near(CT + TD, L) and near(CT / TD, mp.mpf(m) / n), "h18: отрезки касательных")
    # Окружности касаются друг друга: центры (±r; r), D = (r + TD; 0).
    Dx = r + TD
    Cx = Dx - L * mp.cos(th)
    ok(Cx > 0, "h18: трапеция существует")
    ok(near(r, kon["r"]) and near(Cx, kon["b"]) and near(Dx, kon["d"]), "h18: r и полуоснования", f"{r} {Cx} {Dx}")
    if p["nado"] == "S":
        otv = (Cx + Dx) * H
    elif p["nado"] == "AC":
        otv = mp.sqrt((Dx + Cx) ** 2 + H ** 2)
    else:
        y0 = (Cx ** 2 + H ** 2 - Dx ** 2) / (2 * H)
        otv = mp.sqrt(Dx ** 2 + y0 ** 2)
    ok(near(otv, kon["otvet"]), f"h18: {p['nado']}", f"{otv} {kon['otvet']}")


def h19(p, kon):
    al, be, ga, ka = (sp.Rational(*p[k_]) for k_ in ("alfa", "beta", "gamma", "kappa"))

    def chislo(av):
        X = x + al * av
        Y = av * x + ga * av + be * av
        pol = sp.Poly(sp.expand(X ** 4 - Y ** 4 - ka * av ** 2 * X ** 2 + ka * av ** 2 * Y ** 2), x)
        if pol.is_zero:
            return -1
        return len(set(pol.real_roots()))

    def istina(av):
        if (p["dom"] == "pol" and av <= 0) or (p["dom"] == "otr" and av >= 0):
            return False
        return chislo(av) == 4

    konci = [v for i, v in enumerate(kon["kuski"]) if i % 4 < 2 and abs(v) < 1e9]
    kraj = max(abs(v) for v in konci) + 2
    plokho = []
    for i in range(-int(kraj * 53), int(kraj * 53) + 1):
        av = sp.Rational(i, 53)
        if all(abs(float(av) - v) > 1e-6 for v in konci) and istina(av) != v_kuski(kon["kuski"], float(av)):
            plokho.append(float(av))
    ok(not plokho, "h19: сетка", str(plokho[:5]))
    for v in konci:
        for d_ in (sp.Rational(1, 10 ** 7), -sp.Rational(1, 10 ** 7)):
            av = sp.nsimplify(v, rational=True, tolerance=1e-12) + d_
            ok(istina(av) == v_kuski(kon["kuski"], float(av)), f"h19: около конца {v}")


H20_CIFRY = {
    "vse": lambda d: range(1, 10),
    "nechet": lambda d: range(1, 10, 2),
    "chet": lambda d: range(2, 10, 2),
    "ge": lambda d: range(d, 10),
    "le": lambda d: range(1, d + 1),
}


def h20(p, kon):
    D = list(H20_CIFRY[p["cifry"]](p.get("d")))
    otn = {}
    for a_ in D:
        for b_ in D:
            for c_ in D:
                otn[100 * a_ + 10 * b_ + c_] = Fr(100 * a_ + 10 * b_ + c_, a_ * b_ * c_)
    ok(any(v == p["k1"] for v in otn.values()) and otn.get(kon["p1"]) == p["k1"], "h20: а) да, пример")
    ok(any(v == p["k2"] for v in otn.values()) == bool(kon["daB"]), "h20: б)")
    vv = max(otn.values()) if p["nado"] == "max" else min(otn.values())
    ok(near(vv, kon["otvC"]), "h20: в)", f"{vv} {kon['otvC']}")


def j14(p, kon):
    X = x
    PLUS = [-sp.sin(2 * X - sp.pi / 2), sp.sin(2 * X + sp.pi / 2), -sp.cos(sp.pi - 2 * X), sp.sin(sp.pi / 2 - 2 * X)]
    MINUS = [sp.sin(3 * sp.pi / 2 + 2 * X), sp.sin(2 * X - sp.pi / 2), sp.cos(sp.pi - 2 * X), -sp.sin(sp.pi / 2 + 2 * X)]
    chisl = sp.sin(X) ** 4 + PLUS[p["zapis"]] - sp.cos(X) ** 2 if p["chisl"] == "sin" else sp.cos(X) ** 4 + MINUS[p["zapis"]] - sp.sin(X) ** 2
    ok(sp.simplify(sp.expand_trig(chisl + sp.sin(X) ** 2 * sp.cos(X) ** 2)) == 0, "j14: числитель = −sin²x cos²x")
    u = lambda mn: (-1 if mn else 1) * (X / 4 + p["fi"] * sp.pi / 8)
    znam = (2 * sp.sin(u(p["minus1"])) ** 2 + p["B"] * sp.cos(u(p["minus2"])) - 2) if p["znam"] == "cos" else (2 * sp.cos(u(p["minus1"])) ** 2 - p["B"] * sp.sin(u(p["minus2"])) - 2)
    e = sp.Rational(round(2 * kon["e"] / float(sp.pi)), 2) * sp.pi
    ok(abs(sp.N(znam.subs(X, e), 30)) < 1e-20, "j14: исключённая точка")
    vybor = [sp.pi * k_ / 2 for k_ in range(p["lo"], p["hi"] + 1) if abs(sp.N(znam.subs(X, sp.pi * k_ / 2), 30)) > 1e-20]
    sravn_spiski("j14: отбор", vybor, kon["vybor"])


def j15(p, kon):
    lam = sp.Rational(*p["lam"])
    A, C, B = sp.Matrix([0, 0, 0]), sp.Matrix([1, 0, 0]), sp.Matrix([sp.Rational(1, 2), sp.sqrt(3) / 2, 0])
    z = sp.Matrix([0, 0, lam])
    A1, B1, C1 = A + z, B + z, C + z
    n1 = (C - A).cross(B1 - A)
    na = (C1 - A1).cross(n1)
    tt = sp.simplify(-na.dot(B - A1) / na.dot(B1 - B))
    ok(near(tt, kon["tB"]), "j15: точка на BB₁", f"{tt}")
    e = sp.Matrix([0, 0, 1])
    N = {"BCC1": (C - B).cross(e), "ABB1": (B - A).cross(e), "ACC1": (C - A).cross(e), "ABC": e}[p["pl"]]
    cs = sp.simplify(abs(na.dot(N)) / (na.norm() * N.norm()))
    ok(near(cs, kon["cos"]) and near(sp.acos(cs), kon["ugol"]), "j15: угол")


def j16(p, kon):
    q = mp.mpf(p["p"] - p["r"]) ** 2 / 4

    def istina(xx):
        w = xx * xx - p["c"]
        if -mp.mpf("1e-40") < w < 0:
            w = mp.mpf(0)
        if w < 0:
            return False
        t = mp.sqrt(w)
        if abs(t - p["r"]) < mp.mpf("1e-30"):
            return False
        pr = p["p"] + q / (p["r"] - t)
        return t < pr if p["znak"] == "lt" else t > pr

    sverka_setki(istina, kon["kuski"], -20, 20, mp.mpf("0.00731"), "j16: сетка")
    with mp.workdps(60):
        for i in range(0, len(kon["kuski"]), 4):
            for j in (0, 1):
                v = kon["kuski"][i + j]
                if abs(v) < 1e9:
                    tv = mp.sqrt(mp.mpf(round(v * v, 9))) * (1 if v > 0 else -1)
                    ok(istina(tv) == bool(kon["kuski"][i + 2 + j]), f"j16: конец {v}")


def j18(p, kon):
    R = mp.sqrt(p["R2"])
    b = mp.radians(p["beta"])
    B = mp.matrix([0, -R / mp.sin(b / 2)])
    st = lambda zn: mp.matrix([zn * mp.sin(b / 2), mp.cos(b / 2)])
    kas = lambda zn: B + st(zn) * ((-B).T * st(zn))[0]
    A, C = kas(-1), kas(1)
    D, E = -C, -A

    def vtoraya(Q):
        d = Q - B
        aa, bb, cc = (d.T * d)[0], 2 * (B.T * d)[0], (B.T * B)[0] - R * R
        tt = (-bb - mp.sqrt(bb * bb - 4 * aa * cc)) / (2 * aa)
        return B + d * tt

    N, P = vtoraya(D), vtoraya(E)
    ok(near(mp.norm(N - B) / mp.norm(D - B), kon["k"]), "j18: BN : BD")
    if p["nado"] == "S":
        pts = [D, E, P, N]
        otv = abs(sum(pts[i][0] * pts[(i + 1) % 4][1] - pts[(i + 1) % 4][0] * pts[i][1] for i in range(4))) / 2
    else:
        otv = {"PN": mp.norm(P - N), "BN": mp.norm(B - N), "DN": mp.norm(D - N)}[p["nado"]]
    ok(near(otv, kon["otvet"]), f"j18: {p['nado']}", f"{otv} {kon['otvet']}")


def j19(p, kon):
    th = mp.acos(mp.mpf(str(p["C"])))
    ok(p["t1"] < th < p["t2"], "j19: оценка arccos")

    def kolvo(av):
        if av == 0:
            return 0
        L, R_ = sorted((av * p["m"] * mp.pi, av * p["n"] * mp.pi))
        k_ = 0
        for z0 in (th, -th):
            k_ += int(mp.floor((R_ - z0) / (2 * mp.pi)) - mp.ceil((L - z0) / (2 * mp.pi)) + 1)
        return k_

    kraj = max(abs(v) for v in kon["kuski"] if abs(v) < 1e9) + 1
    sverka_setki(lambda av: kolvo(av) == p["K"], kon["kuski"], -kraj, kraj, mp.mpf("0.000731"), "j19: сетка")
    for i in range(0, len(kon["kuski"]), 4):
        for j, sd in ((0, -1), (1, 1)):
            v = mp.mpf(kon["kuski"][i + j])
            ok((kolvo(v + sd * mp.mpf("1e-9")) == p["K"]) is False, f"j19: снаружи конца {float(v)}")
            ok((kolvo(v - sd * mp.mpf("1e-9")) == p["K"]), f"j19: внутри у конца {float(v)}")


def j20(p, kon):
    S = lambda n_: sum(map(int, str(n_)))
    n_, v_, t_ = kon["primer"]
    ok(v_ == p["lam"] * S(n_) and t_ == p["mu"] * S(v_) and n_ + v_ + t_ == p["A"] and len({n_, v_, t_}) == 3, "j20: а)")
    ok(not any(m_ + p["lam"] * S(m_) + p["mu"] * S(p["lam"] * S(m_)) == p["B"] and len({m_, p["lam"] * S(m_), p["mu"] * S(p["lam"] * S(m_))}) == 3 for m_ in range(1, p["B"] + 1)), "j20: б)")
    k_ = sum(1 for m_ in range(1000, 10000) if p["mu"] * S(p["lam"] * S(m_)) == p["T"] and len({m_, p["lam"] * S(m_), p["T"]}) == 3)
    ok(k_ == kon["itog"], "j20: в)", f"{k_} {kon['itog']}")


# ── Семьи K, L, M (варианты 19–24) ──────────────────────────────────


def korni_trig(f, a0, a1, shag=mp.mpf(1) / 256):
    """Корни f на [a0; a1]: смена знака и касания (минимум |f| около нуля), 50 знаков."""
    out = []
    with mp.workdps(50):
        t = mp.mpf(a0) - shag
        pts = []
        while t <= a1 + shag:
            pts.append((t, f(t)))
            t += shag
        for i in range(1, len(pts) - 1):
            (t0, f0), (t1, f1), (t2, f2) = pts[i - 1], pts[i], pts[i + 1]
            kand = None
            if abs(f1) < mp.mpf("1e-40"):
                kand = t1
            elif f0 * f1 < 0:
                kand = mp.findroot(f, (t0, t1), solver="bisect")
            elif f1 * f2 < 0:
                kand = mp.findroot(f, (t1, t2), solver="bisect")
            elif abs(f1) <= abs(f0) and abs(f1) <= abs(f2):
                l_, r_ = t0, t2
                for _ in range(200):
                    m1, m2 = l_ + (r_ - l_) * mp.mpf("0.382"), l_ + (r_ - l_) * mp.mpf("0.618")
                    if abs(f(m1)) < abs(f(m2)):
                        r_ = m2
                    else:
                        l_ = m1
                xm = (l_ + r_) / 2
                if abs(f(xm)) < mp.mpf("1e-30"):
                    kand = xm
            if kand is not None and a0 - mp.mpf("1e-12") <= kand <= a1 + mp.mpf("1e-12") and all(abs(kand - u) > 1e-9 for u in out):
                out.append(kand)
    return sorted(out)


def v_kuski_tol(q, t, tol=1e-9):
    """Как v_kuski, но конец, совпадающий с t до tol, решает включённость сам."""
    for i in range(0, len(q), 4):
        lo, hi, lz, hz = q[i : i + 4]
        if abs(t - lo) < tol:
            if lz:
                return True
            continue
        if abs(t - hi) < tol:
            if hz:
                return True
            continue
        if v_kuski([lo, hi, 0, 0], t):
            return True
    return False


def k14(p, kon):
    fi = sp.pi / p["fi"]
    A = p["sg"] * sp.cos(fi) / sp.sin(sp.pi / p["u"])
    ok(near(A, kon["A"]), "k14: коэффициент")
    Am = mp.mpf(sp.N(A, 60))
    fim = mp.pi / p["fi"]
    f = lambda t: mp.cos(t - fim) + mp.cos(t + fim) - Am * mp.sin(2 * t)
    sravn_spiski("k14: отбор", korni_trig(f, p["lo"] * mp.pi / 2, p["hi"] * mp.pi / 2), kon["vybor"])


def piramida4(a2, h2):
    a, h = sp.sqrt(a2), sp.sqrt(h2)
    A, B, C, D = [sp.Matrix(v) for v in ([-a / 2, -a / 2, 0], [a / 2, -a / 2, 0], [a / 2, a / 2, 0], [-a / 2, a / 2, 0])]
    return A, B, C, D, sp.Matrix([0, 0, h])


def k15(p, kon):
    h2 = sp.Rational(p["a2"] * p["m"], 2 * p["n"])
    ok(near(h2, kon["h2"]), "k15: высота")
    A, B, C, D, S = piramida4(p["a2"], h2)
    M = S + (C - S) * sp.Rational(p["m"], p["m"] + p["n"])
    ok(sp.simplify((C - S).dot(D - B)) == 0 and sp.simplify((C - S).dot(M - B)) == 0, "k15: а) SC ⊥ (BMD)")
    nrm = (M - B).cross(D - B)
    otv = sp.acos(sp.Abs(nrm[2]) / nrm.norm()) if p["nado"] == "ugol" else nrm.norm() / 2
    ok(near(sp.N(otv, 30), kon["otvet"]), "k15: ответ", f"{sp.nsimplify(otv)}")


def k16(p, kon):
    q, al, be, d = p["q"], p["al"], p["be"], p["d"]

    def istina(t):
        if t <= 0 or abs(t - d) < mp.mpf("1e-40"):
            return False
        L = mp.log(t) / mp.log(q)
        v = (L * L - (al + be) * L + al * be) / (t - d)
        return v <= mp.mpf("1e-40") if p["znak"] == "le" else v >= -mp.mpf("1e-40")

    with mp.workdps(60):
        sverka_setki(istina, kon["kuski"], -2, 2 * max(d, q**be) + 3, mp.mpf("0.00731"), "k16: сетка")
        for i in range(0, len(kon["kuski"]), 4):
            for j in (0, 1):
                v = kon["kuski"][i + j]
                if 0 < abs(v) < 1e9:
                    tv = mp.mpf(sp.N(sp.nsimplify(v), 60))
                    ok(istina(tv) == bool(kon["kuski"][i + 2 + j]), f"k16: конец {v}")


def k17(p, kon):
    h = sp.symbols("h", positive=True)
    R2 = 2 * p["k"] ** 2
    E = p["I"] * h / (h**2 + R2) ** sp.Rational(3, 2)
    kr = sp.solve(sp.diff(E, h), h)
    ok(len(kr) == 1 and sp.diff(E, h, 2).subs(h, kr[0]) < 0, "k17: одна точка максимума")
    otv = kr[0] if p["vopros"] == "h" else E.subs(h, kr[0])
    ok(near(otv, kon["otvet"]), "k17: ответ", str(sp.simplify(otv)))


def k18(p, kon):
    a_, b_, c_ = p["a"], p["b"], p["c"]
    B, C = sp.Matrix([0, 0]), sp.Matrix([a_, 0])
    xA = sp.Rational(a_ * a_ + c_ * c_ - b_ * b_, 2 * a_)
    A = sp.Matrix([xA, sp.sqrt(c_ * c_ - xA * xA)])
    H = A + (C - A) * ((B - A).dot(C - A) / (C - A).dot(C - A))
    L = A + (C - A) * sp.Rational(c_, c_ + a_)  # AL : LC = AB : BC
    ok(sp.simplify((L - B).dot(A - B) / c_ - (L - B).dot(C - B) / a_) == 0, "k18: BL — биссектриса")
    s = lambda U, V: sp.sqrt((U - V).dot(U - V))
    a1, b1, c1 = s(H, L), s(B, L), s(B, H)
    pl = sp.Abs((H - B)[0] * (L - B)[1] - (H - B)[1] * (L - B)[0]) / 2
    R = sp.simplify(a1 * b1 * c1 / (4 * pl))
    ok(near(R, kon["otvet"]), "k18: радиус", str(R))


def k19(p, kon):
    s = mp.sqrt(p["s2"])
    V = [(s, 0), (0, s), (-s, 0), (0, -s)]

    def kolvo(av):
        R = abs(av)
        tochki = []
        for i in range(4):
            (x1, y1), (x2, y2) = V[i], V[(i + 1) % 4]
            dx, dy = x2 - x1, y2 - y1
            # |P + t·d|² = R², t ∈ [0; 1]
            A_, B_, C_ = dx * dx + dy * dy, 2 * (x1 * dx + y1 * dy), x1 * x1 + y1 * y1 - R * R
            D_ = B_ * B_ - 4 * A_ * C_
            if D_ < -mp.mpf("1e-30"):
                continue
            D_ = D_ if D_ > mp.mpf("1e-30") else mp.mpf(0)
            for t in ((-B_ - mp.sqrt(D_)) / (2 * A_), (-B_ + mp.sqrt(D_)) / (2 * A_)):
                if -mp.mpf("1e-40") <= t <= 1 + mp.mpf("1e-40"):
                    P = (x1 + t * dx, y1 + t * dy)
                    if all(abs(P[0] - u) + abs(P[1] - v) > mp.mpf("1e-30") for u, v in tochki):
                        tochki.append(P)
        return len(tochki)

    istina = lambda av: kolvo(av) >= 1 if p["nado"] == "est" else kolvo(av) == p["nado"]
    with mp.workdps(50):
        sverka_setki(istina, kon["kuski"], -s - 1, s + 1, mp.mpf("0.00731"), "k19: сетка")
        for v in (s, s / mp.sqrt(2), -s, -s / mp.sqrt(2)):
            vnutri = v_kuski_tol(kon["kuski"], float(v))
            ok(istina(v) == vnutri, f"k19: точка {float(v)}")


def k20(p, kon):
    n_, S = p["n"], p["n"] * p["M"]

    def mozhno(c_, summa, chisla):
        """Можно ли выбрать c_ различных чисел из списка с данной суммой (битовые множества)."""
        dp = [0] * (c_ + 1)
        dp[0] = 1
        for v in chisla:
            for j in range(c_, 0, -1):
                dp[j] |= dp[j - 1] << v
        return summa >= 0 and (dp[c_] >> summa) & 1 == 1

    ok(mozhno(n_ - 1, S - p["X"], range(1, p["X"])) == kon["a"], "k20: а)")
    ok(mozhno(n_ - 1, S - p["Y"], range(p["Y"] + 1, S + 1)) == kon["b"], "k20: б)")
    v = kon["v"]
    ok(mozhno(n_ - 1, S - v, range(1, v)) and S - (v + 1) < n_ * (n_ - 1) // 2, "k20: в)")


def l14(p, kon):
    A = 1 - mp.mpf(p["K4"]) / 8
    f = lambda t: mp.sin(t) ** 4 + mp.cos(t) ** 4 - A
    sravn_spiski("l14: отбор", korni_trig(f, p["lo"] * mp.pi / 4, p["hi"] * mp.pi / 4), kon["vybor"])


def l15(p, kon):
    R = sp.Rational
    A, B, C, S = sp.Matrix([0, 0, 0]), sp.Matrix([1, 0, 0]), sp.Matrix([R(1, 5), 1, 0]), sp.Matrix([R(1, 3), R(1, 4), 1])
    K = S + (A - S) * R(p["m1"], p["m1"] + p["n1"])
    L = S + (B - S) * R(p["m2"], p["m2"] + p["n2"])
    M = B + (C - B) * R(p["m3"], p["m3"] + p["n3"])
    nrm = (L - K).cross(M - K)
    u = nrm.dot(K - A) / nrm.dot(C - A)
    ok(0 < u < 1, "l15: N на ребре AC")
    otn = u / (1 - u)
    ok(near(otn, kon["otvet"]), "l15: AN : NC", str(otn))
    N = A + (C - A) * u
    s = -K[2] / (L - K)[2]
    T = K + (L - K) * s
    ok(T[1] == 0 and T[2] == 0 and (T - M).cross(N - M) == sp.zeros(3, 1), "l15: а) T = KL ∩ AB на MN")


def l16(p, kon):
    A, B, C = kon["A"], kon["B"], kon["C"]
    t = sp.symbols("t", positive=True)
    r = sp.Rational(p["p"], p["q"])
    ok(sp.expand(A * t**2 - B * t + C - A * (t - r ** p["e1"]) * (t - r ** p["e2"])) == 0, "l16: корни квадратного трёхчлена")

    def istina(xx):
        v = A * mp.mpf(p["p"] ** 2) ** xx - B * mp.mpf(p["p"] * p["q"]) ** xx + C * mp.mpf(p["q"] ** 2) ** xx
        return v <= mp.mpf("1e-40") if p["znak"] == "le" else v >= -mp.mpf("1e-40")

    with mp.workdps(60):
        sverka_setki(istina, kon["kuski"], p["e1"] - 6, p["e2"] + 6, mp.mpf("0.00731"), "l16: сетка")
        for e in (p["e1"], p["e2"]):
            ok(istina(mp.mpf(e)) and v_kuski(kon["kuski"], e), f"l16: конец {e}")


def l17(p, kon):
    X = sp.symbols("X", real=True)
    T = X / p["v1"] + sp.sqrt((p["L"] - X) ** 2 + p["d"] ** 2) / p["v2"]
    kr = [r for r in sp.solve(sp.diff(T, X), X) if 0 <= r <= p["L"]]
    ok(len(kr) == 1, "l17: критическая точка на отрезке")
    xs = min([0, p["L"], *kr], key=lambda r: T.subs(X, r))
    otv = xs if p["vopros"] == "AX" else T.subs(X, xs)
    ok(near(otv, kon["otvet"]), "l17: ответ", str(sp.nsimplify(otv)))


def l18(p, kon):
    R = sp.Rational
    cs, sn = R(p["c1"], p["c2"]), R(p["s1"], p["c2"])
    A, B, D = sp.Matrix([0, 0]), sp.Matrix([p["s"], 0]), sp.Matrix([p["s"] * cs, p["s"] * sn])
    C = B + D
    O = (A + C) / 2
    proj = lambda U, V: U + (V - U) * ((O - U).dot(V - U) / (V - U).dot(V - U))
    P, Q, Rr, T = proj(A, B), proj(B, C), proj(C, D), proj(D, A)
    ok((Q - P).dot(T - P) == 0 and (P - Q).dot(Rr - Q) == 0 and P + Rr == Q + T, "l18: а) прямоугольник")
    pts = [P, Q, Rr, T]
    S = sp.Abs(sum(pts[i][0] * pts[(i + 1) % 4][1] - pts[(i + 1) % 4][0] * pts[i][1] for i in range(4))) / 2
    otv = S if p["nado"] == "S" else S / (p["s"] ** 2 * sn)
    ok(near(otv, kon["otvet"]), "l18: ответ", str(otv))


def l19(p, kon):
    a_ = sp.symbols("a", positive=True)
    xx = sp.symbols("xx", real=True)
    b = p["b"]
    # При a > 2b: фигура между y = a и графиком на [−a/2; a/2].
    S = sp.integrate(a_ - (-2 * xx), (xx, -a_ / 2, -b)) + sp.integrate(a_ - 2 * b, (xx, -b, b)) + sp.integrate(a_ - 2 * xx, (xx, b, a_ / 2))
    S = sp.expand(S)
    lo = [r for r in sp.solve(sp.Eq(S, p["S1"]), a_) if r > 2 * b]
    hi = [r for r in sp.solve(sp.Eq(S, p["S2"]), a_) if r > 2 * b]
    q = kon["kuski"]
    ok(len(q) == 4 and near(lo[0], q[0]) and near(hi[0], q[1]), "l19: концы", f"{lo} {hi}")
    ok(bool(q[2]) == (p["n1"] == "ge") and bool(q[3]) == (p["n2"] == "le"), "l19: включение концов")


def l20(p, kon):
    a_, b_ = p["a"], p["b"]
    poz = {0}
    for _ in range(p["N"]):
        poz = {u + a_ for u in poz} | {u - b_ for u in poz}
    ok((p["T1"] in poz) == kon["a"], "l20: а)")
    best = min((x_ + y_ for x_ in range(0, 300) for y_ in range(0, 300) if a_ * x_ - b_ * y_ == p["T2"]), default=None)
    ok(best == kon["b"], "l20: б)", str(best))
    # в) чередование: после k ходов — ⌊k/2⌋(a − b) плюс первый ход при нечётном k.
    k_ = next(k_ for k_ in range(1, 1000) if any(sum((a_ if (i % 2 == 0) == pervyy else -b_) for i in range(k_)) == p["T3"] for pervyy in (True, False)))
    ok(k_ == kon["v"], "l20: в)", str(k_))


def m14(p, kon):
    f = lambda t: p["k"] * mp.sin(t) ** 2 * mp.cos(t) ** 2 - p["m"] * mp.cos(2 * t) ** 2
    sravn_spiski("m14: отбор", korni_trig(f, p["lo"] * mp.pi / 4, p["hi"] * mp.pi / 4), kon["vybor"])


def m15(p, kon):
    a, H = sp.sqrt(p["a2"]), sp.sqrt(p["h2"])
    A, B, C = sp.Matrix([0, 0, 0]), sp.Matrix([a, 0, 0]), sp.Matrix([a / 2, a * sp.sqrt(3) / 2, 0])
    K = C + sp.Matrix([0, 0, H * sp.Rational(p["m"], p["m"] + p["n"])])
    M = (A + B) / 2
    ok(sp.simplify((K - M).dot(B - A)) == 0, "m15: а) KM ⊥ AB")
    nrm = (B - A).cross(K - A)
    otv = sp.acos(sp.Abs(nrm[2]) / nrm.norm()) if p["nado"] == "ugol" else nrm.norm() / 2
    ok(near(sp.N(otv, 30), kon["otvet"]), "m15: ответ", str(sp.nsimplify(otv)))


def m16(p, kon):
    c_ = p["q"] ** p["e"]
    ok(c_ == kon["c"], "m16: коэффициент")

    def istina(t):
        if t <= 0:
            return False
        L = mp.log(t) / mp.log(p["p"])
        v = (mp.mpf(p["q"]) ** t - c_) * (L - p["d"])
        return v <= mp.mpf("1e-40") if p["znak"] == "le" else v >= -mp.mpf("1e-40")

    with mp.workdps(60):
        sverka_setki(istina, kon["kuski"], -2, max(p["e"], p["p"] ** p["d"]) + 4, mp.mpf("0.00731"), "m16: сетка")
        for i in range(0, len(kon["kuski"]), 4):
            for j in (0, 1):
                v = kon["kuski"][i + j]
                if 0 < abs(v) < 1e9:
                    ok(istina(mp.mpf(sp.N(sp.nsimplify(v), 60))) == bool(kon["kuski"][i + 2 + j]), f"m16: конец {v}")


def m17(p, kon):
    v = sp.symbols("v", positive=True)
    Y = p["D"] / v * (p["k"] * v**2 + p["C"])
    kr = sp.solve(sp.diff(Y, v), v)
    ok(len(kr) == 1, "m17: одна критическая точка")
    otv = kr[0] if p["vopros"] == "v" else Y.subs(v, kr[0])
    ok(near(otv, kon["otvet"]), "m17: ответ", str(otv))


def m18(p, kon):
    R = sp.Rational
    cs, sn = R(p["c1"], p["c2"]), R(p["s1"], p["c2"])
    b, c_ = p["b"], p["c"]
    A, D, B = sp.Matrix([0, 0]), sp.Matrix([b, 0]), sp.Matrix([c_ * cs, c_ * sn])
    C = B + D
    # Биссектриса угла A: точка M на BC с BM = AB (равнобедренный ABM) — проверяем равенство углов.
    ed = lambda U: U / sp.sqrt(U.dot(U))
    uA, uD = ed(B - A) + ed(D - A), ed(A - D) + ed(C - D)
    tM = (B[1] - A[1]) / uA[1]
    tN = (B[1] - D[1]) / uD[1]
    M, N = A + uA * tM, D + uD * tN
    t_, s_ = sp.symbols("t_ s_")
    rs = sp.solve(list(A + uA * t_ - D - uD * s_), [t_, s_])
    K = A + uA * rs[t_]
    ok(sp.simplify((A - K).dot(D - K)) == 0, "m18: а) ∠AKD = 90°")
    otv = sp.sqrt((M - N).dot(M - N)) if p["nado"] == "MN" else sp.Abs((D - A)[0] * (K - A)[1] - (D - A)[1] * (K - A)[0]) / 2
    ok(near(sp.simplify(otv), kon["otvet"]), "m18: ответ", str(sp.simplify(otv)))


def m19(p, kon):
    k_, r = p["k"], p["r"]

    def kolvo(av):
        sol = set()
        for sg in (1, -1):
            # x = sg·u, u ≥ 0: r² − u² = (k u + a)², k u + a ≥ 0.
            A_, B_, C_ = 1 + k_ * k_, 2 * k_ * av, av * av - r * r
            D_ = B_ * B_ - 4 * A_ * C_
            if D_ < 0:
                continue
            for s in (1, -1):
                u = (-B_ + s * mp.sqrt(D_)) / (2 * A_)
                if u >= -mp.mpf("1e-40") and k_ * u + av >= -mp.mpf("1e-40"):
                    sol.add((mp.nstr(sg * u if abs(u) > 1e-40 else 0, 20)))
        return len(sol)

    istina = lambda av: kolvo(av) >= 1 if p["nado"] == "est" else kolvo(av) == p["nado"]
    with mp.workdps(50):
        kraj = (k_ + 1) * r + 1
        sverka_setki(istina, kon["kuski"], -kraj, kraj, mp.mpf("0.00731"), "m19: сетка")
        for v in (-k_ * r, r):
            ok(istina(mp.mpf(v)) == v_kuski_tol(kon["kuski"], v), f"m19: точка {v}")


def m20(p, kon):
    N_, k_ = p["N"], p["k"]
    from itertools import combinations

    # Классы остатков: внутри класса r и k − r — полный перебор допустимых пар.
    def naib(chisla):
        best = 0
        for m_ in range(len(chisla), 0, -1):
            for nab in combinations(chisla, m_):
                if all((u + v) % k_ for u, v in combinations(nab, 2)):
                    return m_
        return best

    klassy = {}
    for v in range(1, N_ + 1):
        r = v % k_
        klassy.setdefault(min(r, (k_ - r) % k_), []).append(v)
    # Внутри каждой «пары классов» перебор по числу взятых из каждого класса.
    itog = 0
    for r, chisla in klassy.items():
        odin = [v for v in chisla if v % k_ == r]
        dva = [v for v in chisla if v % k_ != r]
        if r == 0 or 2 * r == k_:
            itog += 1 if chisla else 0
            ok(naib(chisla[:4]) == min(1, len(chisla)), f"m20: класс {r} — одно число")
        else:
            itog += max(len(odin), len(dva))
            ok(not any((u + v) % k_ for u in odin[:3] for v in dva[:3]), f"m20: классы {r} и {k_ - r} несовместны")
    ok(itog == kon["v"], "m20: в)", str(itog))
    ok((p["X"] <= itog) == kon["a"], "m20: а)")
    rt = p["t"] % k_
    tm = min(rt, (k_ - rt) % k_)
    ch = klassy[tm]
    moy = sum(1 for v in ch if v % k_ == rt)
    drug = len(ch) - moy
    ok((rt == 0 or 2 * rt == k_ or moy >= drug) == kon["b"], "m20: б)")
# ── Семьи N, P, Q (варианты 25–30) ──────────────────────────────


def kuski_mp(f, znak):
    """Истинность f ⋚ 0 (f — None вне ОДЗ) для sverka_setki."""

    def istina(t):
        v = f(t)
        if v is None:
            return False
        e = mp.mpf(10) ** -30
        return {"le": v <= e, "ge": v >= -e, "lt": v < -e, "gt": v > e}[znak]

    return istina


def koncy_kuskov(where, istina, kon_kuski):
    for i in range(0, len(kon_kuski), 4):
        for v, z in ((kon_kuski[i], kon_kuski[i + 2]), (kon_kuski[i + 1], kon_kuski[i + 3])):
            if abs(v) < 1e9:
                ok(istina(mp.mpf(v)) == bool(z), f"{where}: конец {v}")


def vec3(*c_):
    return sp.Matrix(c_)


def n14(p, kon):
    mp.mp.dps = 40
    q, s = p["q"], p["s"]
    A = -(p["t1"] + p["t2"]) - 2 * s
    B = p["t1"] * p["t2"] - s * s
    M = mp.mpf(q) ** s
    lq = lambda t: mp.log(t) / mp.log(q)
    f = lambda u: lq(M * mp.e**u) ** 2 + A * lq(mp.e**u) + B
    korni = [mp.e**u for u in nuli_mp(f, -15, 15, mp.mpf(1) / 512)]
    sravn_spiski("n14: корни", korni, kon["korni"])
    sravn_spiski("n14: отбор", [r for r in korni if p["lo"] - 1e-12 <= r <= p["hi"] + 1e-12], kon["vybor"])


def n15(p, kon):
    a = sp.sqrt(p["a2"])
    h = sp.sqrt(sp.Rational(p["b2"]) - sp.Rational(p["a2"], 2))
    A, B, C, D = vec3(0, 0, 0), vec3(a, 0, 0), vec3(a, a, 0), vec3(0, a, 0)
    S = vec3(a / 2, a / 2, h)
    M = (S + C) / 2
    n1 = (D - B).cross(M - B)
    n2 = (S - A).cross(C - A)
    ok(sp.simplify(n1.dot(n2)) == 0, "n15: а) (BDM) ⊥ (ASC)")
    otv = (D - B).cross(M - B).norm() / 2 if p["nado"] == "S" else abs((B - M).dot((C - M).cross(D - M))) / 6
    otv = sp.nsimplify(sp.simplify(otv))
    ok(near(otv, kon["otvet"]), f"n15: {p['nado']}", f"{otv} {kon['otvet']}")
    ok(near(h**2, kon["h2"]), "n15: h²")


def n16(p, kon):
    mp.mp.dps = 30
    q = mp.mpf(p["q"])
    u, v, w = q ** p["e1"], q ** p["e2"], q ** p["e3"]

    def f(t):
        den = q**t - w
        if abs(den) < mp.mpf(10) ** -25:
            return None
        return (q ** (2 * t) - (u + v) * q**t + u * v) / den

    ist = kuski_mp(f, p["znak"])
    sverka_setki(ist, kon["kuski"], -12, 12, mp.mpf("0.00731"), "n16: сетка")
    koncy_kuskov("n16", ist, kon["kuski"])


def n17(p, kon):
    t = sp.symbols("t", positive=True)
    T2 = sp.Integer(p["T2"])
    T1 = p["r"] * T2
    C = 2 ** (-t / T1) - 2 ** (-t / T2)
    kr = sp.solve(sp.diff(C, t), t)
    ok(len(kr) == 1, "n17: одна критическая точка", str(kr))
    t0 = sp.nsimplify(sp.simplify(kr[0]))
    ok(sp.diff(C, t, 2).subs(t, t0) < 0, "n17: максимум")
    ok(near(t0, kon["t"]), "n17: t*", f"{t0} {kon['t']}")
    ok(near(T1, kon["T1"]), "n17: T₁")


def n18(p, kon):
    a, m, nn = p["a"], p["m"], p["n"]
    kk = sp.sqrt(m * m + nn * nn)
    ch = sp.Rational(m) / kk  # cos(α/2)
    sh = sp.Rational(nn) / kk
    ca, sa = 2 * ch**2 - 1, 2 * sh * ch
    A, D = sp.Matrix([0, 0]), sp.Matrix([2 * a, 0])
    B = sp.Matrix([a * ca, a * sa])
    C = B + D
    # K: биссектриса угла A пересекает прямую BC (y = a·sin α).
    K = sp.Matrix([B[1] * ch / sh, B[1]])
    ok(sp.simplify(K[0] - B[0]) >= 0 and sp.simplify(C[0] - K[0]) >= 0, "n18: K на BC")
    ug = lambda P, Q, R: sp.simplify(((P - Q).dot(R - Q)) / ((P - Q).norm() * (R - Q).norm()))
    ok(sp.simplify(ug(A, D, K) - ug(K, D, C)) == 0, "n18: DK — биссектриса угла D")
    AK, KD = sp.simplify(K.norm()), sp.simplify((D - K).norm())
    ok(sp.simplify(AK / KD - sp.Rational(m, nn)) == 0, "n18: AK:KD")
    otv = AK * KD / (AK + KD + 2 * a) if p["nado"] == "r" else abs(B[0] * D[1] - B[1] * D[0])
    otv = sp.simplify(otv)
    ok(near(otv, kon["otvet"]), f"n18: {p['nado']}", f"{otv} {kon['otvet']}")


def n19(p, kon):
    c, R = p["c"], p["R"]
    xx, yy = sp.symbols("xx yy", real=True)

    def kolvo(av):
        tochki = set()
        for sx in (1, -1):
            for sy in (1, -1):
                for r in sp.solve([sx * xx + sy * yy - c, (xx - av) ** 2 + yy**2 - R * R], [xx, yy], dict=True):
                    X, Y = sp.nsimplify(r[xx]), sp.nsimplify(r[yy])
                    if X.is_real and Y.is_real and sx * X >= 0 and sy * Y >= 0:
                        tochki.add((round(float(X), 9), round(float(Y), 9)))
        return len(tochki)

    q = kon["kuski"]

    def v_otvete(av):
        for i in range(0, len(q), 3):
            lo, hi, t = q[i : i + 3]
            if t and abs(av - lo) < 1e-9:
                return True
            if not t and lo + 1e-9 < av < hi - 1e-9:
                return True
        return False

    tochki_a = [sp.Rational(i, 4) for i in range(-4 * (c + R + 1), 4 * (c + R + 1) + 1)]
    gran = [c - R * sp.sqrt(2), c - R, c + R]
    tochki_a += gran + [-g for g in gran]
    plokho = [str(av) for av in tochki_a if (kolvo(av) == p["N"]) != v_otvete(float(av))]
    ok(not plokho, "n19: число решений по точным a", str(plokho[:5]))
    ok(near(kon["A"], c - R * sp.sqrt(2)) and near(kon["B"], c - R) and near(kon["C"], c + R), "n19: границы")


def n20(p, kon):
    def zapisi(S):
        out = []
        for L in range(2, 2 * S + 1):
            if (2 * S) % L:
                continue
            ost = 2 * S // L - L + 1
            if ost > 0 and ost % 2 == 0:
                out.append(L)
        return out

    ok(bool(zapisi(p["S1"])) == kon["a"], "n20: а)")
    ok((p["L2"] in zapisi(p["S2"])) == kon["b"], "n20: б)")
    ok(max(zapisi(p["S3"])) == kon["v"], "n20: в)", f"{zapisi(p['S3'])} {kon['v']}")


def p14(p, kon):
    A, B = kon["A"], kon["B"]
    s2 = p["s2"]
    s1 = sp.Rational(p["sg"], 2)
    ok(sp.expand(A - sp.cos(2 * x) + B * sp.sin(x) - 2 * (sp.sin(x) - s1) * (sp.sin(x) - s2)).rewrite(sp.sin).simplify() == 0, "p14: разложение числителя")
    znam = 2 * sp.cos(x) + (-sp.sqrt(3) if p["ubrat"] == "plus" else sp.sqrt(3))
    lo = sp.Rational(*p["lo"]) * sp.pi
    hi = sp.Rational(*p["hi"]) * sp.pi
    nul = sp.solveset(A - sp.cos(2 * x) + B * sp.sin(x), x, sp.Interval(lo, hi))
    korni = sorted(r for r in nul if sp.simplify(znam.subs(x, r)) != 0)
    sravn_spiski("p14: отбор", korni, kon["vybor"])
    x0 = sp.nsimplify(kon["x0"] / mp.pi) * sp.pi
    ok(sp.simplify((A - sp.cos(2 * x) + B * sp.sin(x)).subs(x, x0)) == 0 and sp.simplify(znam.subs(x, x0)) != 0, "p14: x₀ — корень дроби")


def p15(p, kon):
    a = sp.sqrt(p["a2"])
    h = sp.Integer(p["h"])
    A, B = vec3(0, 0, 0), vec3(a, 0, 0)
    C = vec3(a / 2, a * sp.sqrt(3) / 2, 0)
    C1 = C + vec3(0, 0, h)
    D = (A + B) / 2
    M = C + vec3(0, 0, h * sp.Rational(p["m"], p["m"] + p["n"]))
    nABM = (B - A).cross(M - A)
    nCCD = (C1 - C).cross(D - C)
    ok(sp.simplify(nABM.dot(nCCD)) == 0, "p15: а) (ABM) ⊥ (CC₁D)")
    T = C if p["ot"] == "C" else C1
    d = sp.simplify(abs((T - A).dot(nABM)) / nABM.norm())
    ok(near(d, kon["otvet"]), "p15: расстояние", f"{d} {kon['otvet']}")


def p16(p, kon):
    mp.mp.dps = 30

    def f(t):
        if t + p["p"] < 0:
            return None
        den = t * t - p["q"] ** 2
        if den == 0:
            return None
        return (mp.sqrt(t + p["p"]) - p["d"]) / den

    ist = kuski_mp(f, p["znak"])
    sverka_setki(ist, kon["kuski"], -p["p"] - 3, 60, mp.mpf("0.00731"), "p16: сетка")
    koncy_kuskov("p16", ist, kon["kuski"])


def p17(p, kon):
    a_, b_ = p["a"], p["b"]
    V = x * (a_ - 2 * x) * (b_ - 2 * x)
    kr = [r for r in sp.solve(sp.diff(V, x), x) if 0 < r < sp.Rational(b_, 2)]
    ok(len(kr) == 1 and sp.diff(V, x, 2).subs(x, kr[0]) < 0, "p17: одна точка максимума", str(kr))
    ok(near(kr[0], kon["x"]) and near(V.subs(x, kr[0]), kon["V"]), "p17: x и V", f"{kr} {kon}")


def p18(p, kon):
    a_, b_, c_ = (sp.Integer(p[k_]) for k_ in ("a", "b", "c"))
    A, C = sp.Matrix([0, 0]), sp.Matrix([b_, 0])
    Bx = (c_**2 - a_**2 + b_**2) / (2 * b_)
    B = sp.Matrix([Bx, sp.sqrt(c_**2 - Bx**2)])
    S = b_ * B[1] / 2
    r = S / ((a_ + b_ + c_) / 2)
    y0 = 2 * r
    M = A + (B - A) * (y0 / B[1])
    N = C + (B - C) * (y0 / B[1])
    per = sp.simplify((M - B).norm() + (N - B).norm() + (M - N).norm())
    ok(sp.simplify(per - (a_ + c_ - b_)) == 0, "p18: а) P(MBN)")
    if p["nado"] == "MN":
        otv = sp.simplify((M - N).norm())
    else:
        pts = [A, M, N, C]
        otv = sp.simplify(abs(sum(pts[i][0] * pts[(i + 1) % 4][1] - pts[(i + 1) % 4][0] * pts[i][1] for i in range(4))) / 2)
    ok(near(otv, kon["otvet"]), f"p18: {p['nado']}", f"{otv} {kon['otvet']}")


def p19(p, kon):
    d = sp.sqrt(p["u"] ** 2 + p["w"] ** 2)
    ok(d.is_integer and near(d, kon["d"]), "p19: d")
    t = sp.symbols("t", positive=True)
    r = sp.solve(sp.Eq(d * t, p["R"] + p["m"] * t), t)
    ok(len(r) == 1 and near(r[0], kon["a"]), "p19: |a| касания", f"{r} {kon['a']}")


def p20(p, kon):
    def mozhno(n_, k_):
        S = n_ * (n_ + 1) // 2
        if S % k_:
            return False
        T = S // k_
        if T < n_:
            return False
        ves = list(range(n_, 0, -1))
        zan = [False] * n_

        def gruppa(g):
            if g == 0:
                return True
            i = zan.index(False)
            zan[i] = True
            if dobor(g, T - ves[i], i + 1):
                return True
            zan[i] = False
            return False

        def dobor(g, ost, ot):
            if ost == 0:
                return gruppa(g - 1)
            for j in range(ot, n_):
                if not zan[j] and ves[j] <= ost:
                    zan[j] = True
                    if dobor(g, ost - ves[j], j + 1):
                        return True
                    zan[j] = False
            return False

        return gruppa(k_)

    ok(mozhno(p["n1"], p["k1"]) == kon["a"], "p20: а)")
    ok(mozhno(p["n2"], p["k2"]) == kon["b"], "p20: б)")
    best = max(k_ for k_ in range(1, p["n3"] + 1) if mozhno(p["n3"], k_))
    ok(best == kon["v"], "p20: в)", f"{best} {kon['v']}")


def q14(p, kon):
    q = sp.Integer(p["q"])
    u, v = q ** p["e1"], q ** p["e2"]
    nul = sp.solveset(q ** (2 * x) - (u + v) * q**x + u * v, x, sp.Reals)
    pod = (p["c"] - x) if p["vid"] == "leq" else (x - p["c"])
    kand = set(nul) | {sp.Integer(p["c"])}
    korni = sorted(r for r in kand if pod.subs(x, r) >= 0)
    ok(len(korni) < len(kand), "q14: есть посторонний корень")
    sravn_spiski("q14: корни", korni, kon["korni"])
    sravn_spiski("q14: отбор", [r for r in korni if p["lo"] <= r <= p["hi"]], kon["vybor"])


def q15(p, kon):
    a = sp.sqrt(p["a2"])
    A, B = vec3(0, 0, 0), vec3(a, 0, 0)
    C = vec3(a / 2, a * sp.sqrt(3) / 2, 0)
    O = (A + B + C) / 3
    h = sp.sqrt(p["b2"] - O.dot(O))
    S = O + vec3(0, 0, h)
    ok(sp.simplify((S - A).dot(C - B)) == 0, "q15: а) SA ⊥ BC")
    Dm = (B + C) / 2
    sa = A - S
    t = sp.simplify((Dm - S).dot(sa) / sa.dot(sa))
    H = S + t * sa
    ok(sp.simplify((B - H).dot(sa)) == 0 and sp.simplify((C - H).dot(sa)) == 0, "q15: (BCH) ⊥ SA")
    ok(near(t, kon["dolya"]), "q15: SH:SA")
    otv = abs((B - S).dot((C - S).cross(H - S))) / 6 if p["nado"] == "V" else (B - H).cross(C - H).norm() / 2
    otv = sp.simplify(otv)
    ok(near(otv, kon["otvet"]), f"q15: {p['nado']}", f"{otv} {kon['otvet']}")


def q16(p, kon):
    mp.mp.dps = 30
    q = mp.mpf(p["qn"]) / p["qd"]

    def f(t):
        if t + p["c"] <= 0:
            return None
        return (t - p["s"]) * (t - p["t"]) * mp.log(t + p["c"]) / mp.log(q)

    ist = kuski_mp(f, p["znak"])
    sverka_setki(ist, kon["kuski"], -p["c"] - 2, 40, mp.mpf("0.00731"), "q16: сетка")
    koncy_kuskov("q16", ist, kon["kuski"])


def q17(p, kon):
    N = p["A"] * sp.exp(-x / p["k"])
    F = (x - p["c"]) * N if p["vopros"] == "pribyl" else x * N
    kr = sp.solve(sp.diff(F, x), x)
    ok(len(kr) == 1 and sp.diff(F, x, 2).subs(x, kr[0]) < 0, "q17: одна точка максимума", str(kr))
    ok(near(kr[0], kon["opt"]), "q17: цена", f"{kr} {kon['opt']}")


def q18(p, kon):
    t = sp.Rational(p["u"], p["w"])
    A, B, C, D = (sp.Matrix(v_) for v_ in ([0, 0], [0, 1], [1, 1], [1, 0]))
    M, N = sp.Matrix([t, 1]), sp.Matrix([1, 1 - t])
    ok((M - A).dot(N - B) == 0, "q18: а) AM ⊥ BN")
    lam, mu = sp.symbols("lam mu")
    r = sp.solve(list(A + lam * (M - A) - B - mu * (N - B)), [lam, mu])
    P = A + r[lam] * (M - A)
    pts = [P, M, C, N] if p["nado"] == "PMCN" else [A, P, N, D]
    otv = abs(sum(pts[i][0] * pts[(i + 1) % 4][1] - pts[(i + 1) % 4][0] * pts[i][1] for i in range(4))) / 2
    ok(near(otv, kon["otvet"]), f"q18: {p['nado']}", f"{otv} {kon['otvet']}")


def q19(p, kon):
    R = sp.Rational(p["Rn"], p["Rd"])
    yv = sp.symbols("yv")

    def kolvo(av):
        # y ≥ 0, x = y² − a: (y² − a)² + y² = R² — число корней y ≥ 0.
        P = sp.Poly(sp.expand((yv**2 - av) ** 2 + yv**2 - R**2), yv)
        return len({r for r in sp.real_roots(P) if r >= 0})

    top = R**2 + sp.Rational(1, 4)
    ok(near(top, kon["top"]) and near(R, kon["R"]), "q19: границы")

    def v_otvete(av):
        return (R <= av < top) if p["N"] == 2 else (-R <= av < R or av == top)

    tochki_a = [sp.Rational(i, 8) for i in range(int(-8 * (R + 3)), int(8 * (top + 3)) + 1)]
    tochki_a += [R, -R, top]
    plokho = [str(av) for av in tochki_a if (kolvo(av) == p["N"]) != v_otvete(av)]
    ok(not plokho, "q19: число решений по точным a", str(plokho[:5]))


def q20(p, kon):
    def dost(nabor):
        # bity[n] — суммы n различных чисел из набора (битовая маска).
        bity = [0] * (len(nabor) + 1)
        bity[0] = 1
        for v_ in nabor:
            for n_ in range(len(nabor), 0, -1):
                bity[n_] |= bity[n_ - 1] << v_
        return bity

    vse = list(range(1, p["M"] + 1))
    dv = dost(vse)
    dn = dost([v_ for v_ in vse if v_ % 2])
    est = lambda b_, n_, s_: n_ < len(b_) and (b_[n_] >> s_) & 1 == 1
    ok(est(dv, p["k1"], p["k1"] * p["A"]) == kon["a"], "q20: а)")
    ok(est(dn, p["k2"], p["k2"] * p["A"]) == kon["b"], "q20: б)")
    best = max(n_ for n_ in range(2, p["M"] + 1) if est(dv, n_, n_ * p["A"]))
    ok(best == kon["v"], "q20: в)", f"{best} {kon['v']}")
# ── Семья R: варианты 31–36, свои задачи раздела ─────────────────────
def r14(p, kt):
    X = sp.Symbol("X", real=True)
    lo = sp.pi * p["lo"] / 2
    hi = sp.pi * p["hi"] / 2
    I = sp.Interval(lo, hi)
    if p["vid"] in ("kvSin", "kvCos"):
        A = sp.Integer(p["A"])
        c1 = sp.Rational(*p["c1"])
        c2 = sp.Rational(*p["c2"])
        t = sp.sin(X) if p["vid"] == "kvSin" else sp.cos(X)
        # A·cos2x + B·t + C: многочлен по t с корнями c1, c2 (sin: −2A(t−c1)(t−c2) = A(1−2t²) + Bt + C).
        poly = sp.expand(-2 * A * (sp.Symbol("t") - c1) * (sp.Symbol("t") - c2)) if p["vid"] == "kvSin" else sp.expand(2 * A * (sp.Symbol("t") - c1) * (sp.Symbol("t") - c2))
        T = sp.Symbol("t")
        B = poly.coeff(T, 1)
        C = poly.coeff(T, 0) - A if p["vid"] == "kvSin" else poly.coeff(T, 0) + A
        expr = A * sp.cos(2 * X) + B * t + C
        sol = [s_ for s_ in sp.solveset(expr, X, I)]
    elif p["vid"] == "odnor":
        TG = {"1": 1, "-1": -1, "k3": sp.sqrt(3), "-k3": -sp.sqrt(3), "k3/3": sp.sqrt(3) / 3, "-k3/3": -sp.sqrt(3) / 3}
        t1, t2 = TG[p["t1"]], TG[p["t2"]]
        sol = []
        for tt in (t1, t2):
            base = sp.atan(tt)
            for kk in range(-8, 9):
                xv = base + kk * sp.pi
                if lo <= xv <= hi:
                    sol.append(xv)
    else:
        f = sp.sin if p["f"] == "sin" else sp.cos
        g = sp.cos if p["f"] == "sin" else sp.sin
        sol = list(sp.solveset(g(X), X, I))
        for s_ in sp.solveset(2 * f(X) - p["m"], X, I):
            if p["sigma"] * g(s_) >= 0:
                sol.append(s_)
    sol = sorted(set(float(s_) for s_ in sol))
    ok(len(sol) == len(kt["vybor"]) and all(near(u, v) for u, v in zip(sol, kt["vybor"])), "r14", f"{sol} vs {kt['vybor']}")


def r15(p, kt):
    a = sp.Integer(p["a"])
    h = sp.Rational(p["hN"], p["hD"])
    M3 = sp.Matrix
    if p["vid"] == "kvPrizma":
        B, D, M = M3([a, 0, 0]), M3([0, a, 0]), M3([a, a, h / 2])
        v = (D - B).cross(M - B).norm() / 2
    elif p["vid"] == "piramida":
        B, D, S = M3([a, 0, 0]), M3([0, a, 0]), M3([a / 2, a / 2, h])
        M = (S + M3([a, a, 0])) / 2
        nrm = (D - B).cross(M - B)
        v = sp.acos(sp.Abs(nrm[2]) / nrm.norm())
    else:
        A, B, C = M3([0, 0, 0]), M3([a, 0, 0]), M3([a / 2, a * sp.sqrt(3) / 2, 0])
        M = M3([C[0], C[1], h / 2])
        nrm = (B - A).cross(M - A)
        v = sp.Abs(nrm.dot(C - A)) / nrm.norm()
    ok(near(sp.N(v, 30), kt["otv"]), "r15", f"{sp.nsimplify(v)} vs {kt['otv']}")


def kuski_iz(kt):
    ks = kt["kuski"]
    return [ks[i:i + 4] for i in range(0, len(ks), 4)]


def r16(p, kt):
    X = sp.Symbol("X", real=True)
    if p["vid"] == "pokazDrob":
        t = sp.Integer(p["b"]) ** X
        e = (t - p["b"] ** p["al"]) * (t - p["b"] ** p["be"]) / (t - sp.Integer(p["b"]) ** p["ga"])
        rel = e <= 0 if p["znak"] == "le" else e >= 0
    elif p["vid"] == "logKvadrat":
        y = sp.log(X + p["s"], p["b"])
        e = (y - p["al"]) * (y - p["be"])
        rel = sp.And(X + p["s"] > 0, e <= 0 if p["znak"] == "le" else e >= 0)
    else:
        w2 = p["u1"] + p["u2"] + 1 - p["w1"]
        r = p["u1"] * p["u2"] - p["w1"] * w2
        q = sp.Rational(*p["q"])
        A = (X - p["u1"]) * (X - p["u2"])
        B = X + r
        rel = sp.And(A > 0, B > 0, (A <= B) if q > 1 else (A >= B))
    sol = sp.solveset(rel, X, sp.S.Reals) if not isinstance(rel, sp.And) else sp.reduce_inequalities(list(rel.args), X).as_set()
    # Сравниваем на сетке mpmath точек и в концах ответа.
    def v_otvete(xv):
        for lo, hi, lz, hz in kuski_iz(kt):
            if (xv > lo or (lz and abs(xv - lo) < 1e-12)) and (xv < hi or (hz and abs(xv - hi) < 1e-12)):
                return True
        return False
    bad = 0
    tochki = [i / 37.0 for i in range(-30 * 37, 60 * 37)]
    for lo, hi, lz, hz in kuski_iz(kt):
        for c_ in (lo, hi):
            if abs(c_) < 1e8:
                tochki += [c_, c_ - 1e-6, c_ + 1e-6]
    for xv in tochki:
        if (sp.Float(xv) in sol) != v_otvete(xv):
            bad += 1
    ok(bad == 0, "r16", f"несовпадений {bad}")


def r17(p, kt):
    X = sp.Symbol("X", positive=True)
    if p["vid"] == "korobka":
        f = X * (p["a"] - 2 * X) * (p["b"] - 2 * X)
        kr = [c_ for c_ in sp.solve(sp.diff(f, X), X) if 0 < c_ < sp.Rational(p["b"], 2)]
        xs = kr[0]
        v = f.subs(X, xs) if p["vopros"] == "V" else xs
    elif p["vid"] == "pribyl":
        f = (X - p["c"]) * (p["A"] - X**2)
        kr = [c_ for c_ in sp.solve(sp.diff(f, X), X) if c_ > p["c"]]
        v = f.subs(X, kr[0]) if p["vopros"] == "P" else kr[0]
    else:
        f = (p["L"] - X) / sp.Integer(p["v1"]) + sp.sqrt(X**2 + p["d"] ** 2) / p["v2"]
        kr = [c_ for c_ in sp.solve(sp.diff(f, X), X) if 0 <= c_ <= p["L"]]
        v = f.subs(X, kr[0]) if p["vopros"] == "T" else p["L"] - kr[0]
    ok(near(sp.N(v, 30), kt["otv"]), "r17", f"{sp.nsimplify(v)} vs {kt['otv']}")


def r18(p, kt):
    if p["vid"] == "rombMediana":
        A = sp.Matrix([-sp.Rational(p["d1"], 2), 0])
        M = sp.Matrix([sp.Rational(p["d1"], 4), sp.Rational(p["d2"], 4)])
        tpar = -A[0] / (M[0] - A[0])
        K = A + tpar * (M - A)
        v = (K - A).norm()
    elif p["vid"] == "vpisPryam":
        r = sp.Symbol("r", positive=True)
        v = [s_ for s_ in sp.solve((p["m"] + r) ** 2 + (p["n"] + r) ** 2 - (p["m"] + p["n"]) ** 2, r) if s_ > 0][0]
    else:
        AB = sp.sqrt(p["p"] ** 2 + p["q"] ** 2)
        v = 2 * p["p"] * p["q"] / AB
    ok(near(sp.N(v, 30), kt["otv"]), "r18", f"{sp.nsimplify(v)} vs {kt['otv']}")


def r19(p, kt):
    # Критические значения параметра — точно; ответ из kontrol сравнивается с ними.
    if p["vid"] == "polukrug":
        k = sp.Rational(p["kn"], p["kd"])
        R = p["R"]
        kR, mR = k * R, R * sp.sqrt(1 + k**2)
        nado = [[float(kR), float(mR), 1, 0]] if p["kol"] == 2 else [[float(-kR), float(kR), 1, 0], [float(mR), float(mR), 1, 1]]
    elif p["vid"] == "okrModul":
        R = p["R"]
        r2 = float(-R * sp.sqrt(2))
        nado = {2: [[r2, r2, 1, 1], [-R, R, 0, 0]], 3: [[-R, -R, 1, 1]], 4: [[r2, -R, 0, 0]]}[p["kol"]]
    else:
        s_ = p["s"]
        at, am = (s_ - 1) ** 2, -((s_ + 1) ** 2)
        nado = {2: [[-1e9, am, 0, 0], [0, 0, 1, 1], [at, 1e9, 0, 0]], 3: [[at, at, 1, 1]], 4: [[0, at, 0, 0]]}[p["kol"]]
    est = kuski_iz(kt)
    ok(len(est) == len(nado) and all(near(u, v) for a_, b_ in zip(est, nado) for u, v in zip(a_, b_)), "r19", f"{est} vs {nado}")


def r20(p, kt):
    from math import gcd
    def cep(P, q):
        a_ = P * (100 + q)
        if a_ % 100:
            return None
        b_ = a_ // 100 * (100 - q)
        if b_ % 100:
            return None
        return (a_ // 100, b_ // 100)
    if p["vid"] == "ceny":
        A = any((P - c_[1] == p["D"]) if p["aTip"] == "D" else (c_[1] == P) for P in range(1, 3001) for q in range(1, 100) for c_ in [cep(P, q)] if c_)
        B = any(cep(p["P0"], q) for q in range(1, 100))
        V = next(P for P in range(1, 100000) if cep(P, p["p0"]))
    elif p["vid"] == "deliteli":
        def tau(N):
            return sp.divisor_count(N)
        A = p["k"] % 2 == 1
        V = next(N for N in range(1, 10**6) if tau(N) == p["k"])
        f = sp.factorint(p["k"])
        B = sum(f.values()) >= 3
    else:
        N = p["N"]
        a1 = sp.Rational(*p["A1"])
        A = any((n * a1).q == 1 and n * (n + 1) / 2 <= n * a1 <= n * (2 * N - n + 1) / 2 for n in range(2, N + 1))
        # б): B = S/n + D(n + 1) — существует ли набор (перебор n ≤ 3 по суммам).
        from itertools import combinations
        B = False
        for n in (2, 3):
            for comb in combinations(range(1, N + 1), n):
                S = sum(comb)
                Bv = sp.Rational(S, n) + p["D"] * (n + 1)
                if Bv.q == 1 and Bv <= N and int(Bv) not in comb:
                    B = True
                    break
            if B:
                break
        V = max(n for n in range(2, N + 1) if n * (n + 1) / 2 <= n * p["A2"] <= n * (2 * N - n + 1) / 2)
    ok(A == kt["a"] and B == kt["b"] and V == kt["v"], "r20", f"{A},{B},{V} vs {kt['a']},{kt['b']},{kt['v']}")


# ── Семьи U, V, W (варианты 1–6) ────────────────────────────────────

TG_U = {"1": sp.Integer(1), "-1": sp.Integer(-1), "r3": sp.sqrt(3), "-r3": -sp.sqrt(3), "ir3": sp.sqrt(3) / 3, "-ir3": -sp.sqrt(3) / 3}


def drob_s(s):
    a, _, b = s.partition("/")
    return sp.Rational(int(a), int(b or 1))


def tochki_kuskov(q):
    ends = sorted({v for i in range(0, len(q), 4) for v in q[i : i + 2] if abs(v) < 1e8})
    pts = list(ends) + [(ends[0] if ends else 0) - sp.Rational(73, 10), (ends[-1] if ends else 0) + sp.Rational(73, 10)]
    pts += [(ends[i] + ends[i + 1]) / 2 for i in range(len(ends) - 1)]
    return pts


def u14(p, kon):
    x = sp.symbols("x")
    t1, t2 = TG_U[p["t1"]], TG_U[p["t2"]]
    c, d = sp.simplify(t1 * t2), sp.simplify(t1 + t2)
    lo, hi = drob_s(p["lo"]) * sp.pi, drob_s(p["hi"]) * sp.pi
    korni = set()
    for t in (t1, t2):
        base = sp.atan(t)
        for n in range(-12, 13):
            r = base + n * sp.pi
            if lo <= r <= hi:
                ok(sp.simplify(sp.tan(r) + c / sp.tan(r) - d) == 0, "u14: подстановка")
                korni.add(sp.nsimplify(r / sp.pi))
    vern = sorted(korni)
    ok(len(vern) == len(kon["korni"]) and all(near(float(a_), b_) for a_, b_ in zip(vern, kon["korni"])), "u14: корни")


def u15(p, kon):
    a = sp.Integer(p["a"])
    h = a * sp.Rational(p["m"], p["m"] + p["n"])
    B, C, D, M = sp.Matrix([a, 0, 0]), sp.Matrix([a, a, 0]), sp.Matrix([0, a, 0]), sp.Matrix([a, a, h])
    n = (D - B).cross(M - B)
    d = sp.simplify(abs(n.dot(C - B)) / n.norm())
    ok(near(d, kon["otvet"]), "u15: расстояние", str(d))


def u16(p, kon):
    x = sp.symbols("x", real=True)
    f = (sp.Integer(p["q"]) ** x - sp.Integer(p["q"]) ** p["b"]) * sp.Abs(x - p["a"])
    for t in tochki_kuskov(kon["kuski"]):
        v = f.subs(x, t)
        ist = bool(v >= 0) if p["znak"] == "ge" else bool(v <= 0)
        ok(ist == v_kuski(kon["kuski"], t), "u16: точка", str(t))


def u17(p, kon):
    X = sp.symbols("X")
    k = 1 + sp.Rational(p["r"], 100)
    Xv = sp.solve((p["S"] * k - X) * k - X, X)[0]
    otv = Xv if p["vopros"] == "X" else 2 * Xv - p["S"]
    ok(near(otv, kon["otvet"]), "u17: ответ", str(otv))


def u18(p, kon):
    R, r = sp.Integer(p["R"]), sp.Integer(p["r"])
    O1, O2 = sp.Matrix([0, R]), sp.Matrix([2 * sp.sqrt(R * r), r])
    K = O1 + (O2 - O1) * R / (R + r)
    ok(sp.simplify((O2 - O1).norm() - (R + r)) == 0, "u18: касание")
    ok(near(sp.simplify(K[1]), kon["otvet"]), "u18: расстояние", str(sp.simplify(K[1])))


def u19(p, kon):
    x = sp.symbols("x", real=True)
    def chislo(a):
        rr = {sp.nsimplify(p["b"])}
        for r_ in sp.solve(x**2 - 2 * p["m"] * x + a, x):
            if r_.is_real and r_ >= p["b"]:
                rr.add(sp.nsimplify(r_))
        return len(rr)
    for t in tochki_kuskov(kon["kuski"]):
        ok((chislo(sp.nsimplify(t)) == 2) == v_kuski(kon["kuski"], t), "u19: число корней", str(t))


def u20(p, kon):
    n = p["n"]
    nech = len(range(1, n + 1, 2))
    verh = list(range(n // 2 + 1, n + 1))
    ok(all(y % x for x in verh for y in verh if x < y), "u20: пример")
    ok(kon["maks"] == nech and kon["summa"] == sum(verh), "u20: ответы")


def v14(p, kon):
    x = sp.symbols("x")
    K = {"1": sp.Integer(1), "r2": sp.sqrt(2), "r3": sp.sqrt(3), "-1": sp.Integer(-1), "-r2": -sp.sqrt(2), "-r3": -sp.sqrt(3)}[p["k"]]
    lo, hi = drob_s(p["lo"]) * sp.pi, drob_s(p["hi"]) * sp.pi
    kand = set()
    al = sp.acos(K / 2)
    for n in range(-12, 13):
        for r in (n * sp.pi, al + 2 * n * sp.pi, -al + 2 * n * sp.pi):
            if lo <= r <= hi and p["s"] * sp.sin(r) >= 0:
                if sp.simplify((2 * sp.cos(r) - K) * sp.sin(r)) == 0:
                    kand.add(sp.nsimplify(r / sp.pi))
    vern = sorted(kand)
    ok(len(vern) == len(kon["korni"]) and all(near(float(a_), b_) for a_, b_ in zip(vern, kon["korni"])), "v14: корни")


def v15(p, kon):
    a, h = sp.sqrt(p["a2"]), sp.sqrt(p["h2"])
    C1, M, M1 = sp.Matrix([a / 2, a * sp.sqrt(3) / 2, h]), sp.Matrix([a / 2, 0, 0]), sp.Matrix([a / 2, 0, h])
    ug = sp.atan(sp.simplify((C1 - M1).norm() / (M1 - M).norm()))
    ok(near(ug, kon["otvet"]), "v15: угол")


def v16(p, kon):
    for t in tochki_kuskov(kon["kuski"]):
        t = sp.nsimplify(t)
        if t < p["a"] or t <= 0:
            ist = False
        else:
            v = sp.sqrt(t - p["a"]) * (sp.log(t, p["q"]) - p["c"])
            ist = bool(sp.N(v) >= -1e-12) if p["znak"] == "ge" else bool(sp.N(v) <= 1e-12)
        ok(ist == v_kuski(kon["kuski"], float(t)), "v16: точка", str(t))


def v18(p, kon):
    cd = 2 * sp.sqrt(p["AH"] * p["HB"])
    ok(near(cd, kon["otvet"]), "v18: хорда")


def v19(p, kon):
    x = sp.symbols("x")
    for t in tochki_kuskov(kon["kuski"]):
        a = sp.nsimplify(t)
        rr = {r_ for r_ in sp.solve(x**2 - (a + p["r"]) * x + a * p["r"], x) if p["L"] <= r_ <= p["H"]}
        ok((len(rr) == 1) == v_kuski(kon["kuski"], t), "v19: число корней", str(t))


def v20(p, kon):
    da = p["k"] <= p["N1"] <= 2 ** (p["k"] - 1)
    n = 1
    while 2 ** (n - 1) < p["N2"]:
        n += 1
    ok(kon["daA"] == int(da) and kon["n"] == n and kon["summa"] == 2 ** p["m"] - 1, "v20: ответы")


def w15(p, kon):
    a = sp.sqrt(p["a2"])
    A, B = sp.Matrix([0, 0, 0]), sp.Matrix([a, 0, 0])
    C = sp.Matrix([a / 2, a * sp.sqrt(3) / 2, 0])
    D = sp.Matrix([a / 2, a * sp.sqrt(3) / 6, a * sp.sqrt(sp.Rational(2, 3))])
    n = (B - A).cross(D - C)
    d = sp.simplify(abs(n.dot(C - A)) / n.norm())
    ok(near(d, kon["otvet"]), "w15: расстояние", str(d))


def w16(p, kon):
    for t in tochki_kuskov(kon["kuski"]):
        t = sp.nsimplify(t)
        if t == p["a"]:
            ist = False
        else:
            v = sp.log(abs(t - p["a"]), p["q"])
            ist = bool(sp.N(v - p["k"]) <= 1e-12) if p["znak"] == "le" else bool(sp.N(v - p["k"]) >= -1e-12)
        ok(ist == v_kuski(kon["kuski"], float(t)), "w16: точка", str(t))


def w17(p, kon):
    x = sp.symbols("x", positive=True)
    S = 2 * p["t"] ** 2
    L = 2 * x + S / x
    kr = sp.solve(sp.diff(L, x), x)
    Lm = L.subs(x, kr[0])
    otv = Lm if p["vopros"] == "L" else Lm * p["c"]
    ok(len(kr) == 1 and near(otv, kon["otvet"]), "w17: минимум")


def w18(p, kon):
    a, b = sp.Integer(p["a"]), sp.Integer(p["b"])
    h = sp.symbols("h", positive=True)
    A, D = sp.Matrix([0, 0]), sp.Matrix([a, 0])
    B, C = sp.Matrix([(a - b) / 2, h]), sp.Matrix([(a + b) / 2, h])
    hs = sp.solve((C - A).dot(D - B), h)
    S = (a + b) / 2 * hs[0]
    ok(len(hs) == 1 and near(S, kon["otvet"]), "w18: площадь")


def w19(p, kon):
    x = sp.symbols("x", real=True)
    def chislo(a):
        rr = set()
        for r_ in sp.solve(x**2 - p["s"] * x + p["t"] - a, x):
            if r_.is_real and r_ >= 0:
                rr.add(sp.nsimplify(r_))
                rr.add(sp.nsimplify(-r_))
        return len(rr)
    for t in tochki_kuskov(kon["kuski"]):
        ok((chislo(sp.nsimplify(t)) == p["N"]) == v_kuski(kon["kuski"], t), "w19: число решений", str(t))


def w20(p, kon):
    m = p["k"] + 1
    b = (p["M"] // m + 1) * m
    ok(kon["daA"] == int(p["n1"] % m != 0) and kon["b"] == b and kon["v"] == p["N"] // m, "w20: ответы")

# ── Семьи X, Y, A (варианты 7–12): свои задачи ───────────────────


def _kv_korni(B, C):
    x = sp.symbols("x")
    return sorted(set(sp.solve(sp.Eq(x**2 + B * x + C, 0), x)), key=lambda r: float(r))


def x14(p, kon):
    x = sp.symbols("x")
    s = kon["s"]
    # Отобранные корни — решения tg x + ctg x = s, и других на отрезке нет.
    for v in kon["vybor"]:
        ok(abs(mp.tan(v) + 1 / mp.tan(v) - s) < 1e-9, "x14: корень", str(v))
    lo, hi = p["lo"] * sp.pi / 4, p["hi"] * sp.pi / 4
    sol = sp.solveset(sp.Eq(sp.sin(2 * x), sp.nsimplify(2 / s)), x, sp.Interval(lo, hi))
    ok(len(sol) == len(kon["vybor"]), "x14: число корней на отрезке", f"{sol} {kon['vybor']}")


def x15(p, kon):
    a = sp.sqrt(p["a2"])
    cm = sp.Rational(p["h"] * p["m"], p["m"] + p["n"])
    A, B, D, M = sp.Matrix([0, 0, 0]), sp.Matrix([a, 0, 0]), sp.Matrix([0, a, 0]), sp.Matrix([a, a, cm])
    ok(sp.simplify((D - B).dot(M - A)) == 0, "x15: а) BD ⊥ AM")
    ok(near(sp.N(sp.atan(cm / (a * sp.sqrt(2))), 30), kon["otvet"]), "x15: угол")


def x16(p, kon):
    x = sp.symbols("x", real=True)
    L = max(-p["p"], -p["q"])
    rel = (x + p["p"]) * (x + p["q"]) <= p["b"] ** p["c"] if p["znak"] == "le" else (x + p["p"]) * (x + p["q"]) >= p["b"] ** p["c"]
    reshenie = sp.solve_univariate_inequality(rel, x, relational=False).intersect(sp.Interval.open(L, sp.oo))
    ok(near(sp.N(reshenie.sup if p["znak"] == "le" else reshenie.inf), kon["r2"]), "x16: конец", str(reshenie))


def x17(p, kon):
    x = sp.symbols("x", positive=True)
    S = x * (p["B"] - 2 * p["k2"] * x) / p["k1"]
    xs = sp.solve(sp.diff(S, x), x)[0]
    otv = S.subs(x, xs) if p["vopros"] == "S" else (p["B"] - 2 * p["k2"] * xs) / p["k1"]
    ok(near(otv, kon["otvet"]), "x17: ответ", str(otv))


def x18(p, kon):
    a, b, c = p["a"], p["b"], p["c"]
    r = sp.Rational(a + b - c, 2)
    AH, BH, CH = sp.Rational(b * b, c), sp.Rational(a * a, c), sp.Rational(a * b, c)
    r1, r2 = (AH + CH - b) / 2, (BH + CH - a) / 2
    ok(r + r1 + r2 == CH, "x18: а)")
    ok(near(r1 if p["nado"] == "r1" else r2, kon["otvet"]), "x18: радиус")


def _chislo_modul(b, c, av):
    sol = set()
    for sg in (1, -1):
        D = 4 * b * b + 4 * (c + sg * av)
        if D < 0:
            continue
        for s in (1, -1):
            sol.add(mp.nstr(b + s * mp.sqrt(D) / 2, 20))
    return len(sol)


def x19(p, kon):
    nado = {"dva": lambda n: n == 2, "chetyre": lambda n: n == 4, "ne_menee3": lambda n: n >= 3}[p["vopros"]]
    with mp.workdps(40):
        istina = lambda av: av >= 0 and nado(_chislo_modul(p["b"], p["c"], av))
        sverka_setki(istina, kon["kuski"], -5, kon["D"] + 10, mp.mpf("0.00731"), "x19: сетка")
        for v in (0, kon["D"]):
            ok(istina(mp.mpf(v)) == v_kuski_tol(kon["kuski"], v), f"x19: точка {v}")


def x20(p, kon):
    cif = lambda N: [N // 100, N // 10 % 10, N % 10]
    est = lambda k: any(N == k * sum(cif(N)) for N in range(100, 1000))
    ok(est(p["k1"]) == kon["a"] and est(p["k2"]) == kon["b"], "x20: а), б)")
    ogr = {"vse": lambda c: True, "raznye": lambda c: len(set(c)) == 3, "bez0": lambda c: 0 not in c}[p["ogr"]]
    m = min(Fr(N, sum(cif(N))) for N in range(100, 1000) if ogr(cif(N)))
    ok(near(float(m), kon["min"]), "x20: в)", str(m))


def y14(p, kon):
    x = sp.symbols("x", real=True)
    q, c = p["q"], p["e1"] + p["e2"]
    sol = sorted(sp.solveset(sp.Eq(q**x + q ** (c - x), q ** p["e1"] + q ** p["e2"]), x, sp.S.Reals), key=float)
    ok(len(sol) == len(kon["korni"]) and all(near(s_, k_) for s_, k_ in zip(sol, kon["korni"])), "y14: корни", str(sol))
    lo, hi = sp.log(p["u"], q), sp.log(p["v"], q)
    otb = [s_ for s_ in sol if float(lo) - 1e-12 <= float(s_) <= float(hi) + 1e-12]
    ok(len(otb) == len(kon["vybor"]) and all(near(s_, k_) for s_, k_ in zip(otb, kon["vybor"])), "y14: отбор")


def y15(p, kon):
    a = sp.sqrt(p["a2"])
    B, D, C1 = sp.Matrix([a, 0, 0]), sp.Matrix([0, a, 0]), sp.Matrix([a, a, a])
    A1, C = sp.Matrix([0, 0, a]), sp.Matrix([a, a, 0])
    n = (D - B).cross(C1 - B)
    ok(sp.simplify(n.cross(C - A1)) == sp.zeros(3, 1), "y15: а) A₁C ∥ нормали")
    T = A1 if p["ot"] == "A1" else sp.Matrix([0, 0, 0])
    d = sp.Abs(n.dot(T - B)) / n.norm()
    ok(near(sp.N(d, 30), kon["otvet"]), "y15: расстояние", str(sp.simplify(d)))


def y16(p, kon):
    x = sp.symbols("x", real=True)
    f = (x - p["r1"]) * (x - p["r2"])
    reshenie = sp.solve_univariate_inequality(f > 0, x, relational=False).intersect(
        sp.solve_univariate_inequality(f <= 2 ** p["k"], x, relational=False)
    )
    ok(all(v_kuski_tol(kon["kuski"], float(t)) for t in (reshenie.inf, reshenie.sup)), "y16: концы", str(reshenie))
    with mp.workdps(30):
        istina = lambda t: f.subs(x, t) > 0 and f.subs(x, t) <= 2 ** p["k"]
        sverka_setki(lambda t: bool(istina(sp.Float(t, 30))), kon["kuski"], p["r1"] - 20, p["r2"] + 20, mp.mpf("0.0371"), "y16: сетка")


def y17(p, kon):
    X = sp.symbols("X")
    q = 1 + sp.Rational(p["r"], 100)
    Xv = sp.solve(sp.Eq((p["S"] * q - X) * q - X, 0), X)[0]
    otv = Xv if p["vopros"] == "X" else 2 * Xv - p["S"]
    ok(near(otv, kon["otvet"]), "y17: ответ", str(otv))


def y18(p, kon):
    u, w = p["u"], p["w"]
    otv = (u + w) ** 2 if p["nado"] == "S" else u * w
    ok(near(otv, kon["otvet"]), "y18: ответ")


def y19(p, kon):
    nado = {"dva": lambda n: n == 2, "chetyre": lambda n: n == 4, "ne_menee3": lambda n: n >= 3}[p["vopros"]]

    def kolvo(av):
        sol = set()
        for sg in (1, -1):
            D = 4 * p["b"] ** 2 - 4 * (p["c"] - av)
            if D < 0:
                continue
            for s in (1, -1):
                u = (2 * p["b"] + s * mp.sqrt(D)) / 2
                if u >= -mp.mpf("1e-30"):
                    sol.add(mp.nstr(sg * u if abs(u) > 1e-30 else 0, 20))
        return len(sol)

    with mp.workdps(40):
        istina = lambda av: nado(kolvo(av))
        sverka_setki(istina, kon["kuski"], kon["m"] - 5, p["c"] + 10, mp.mpf("0.00731"), "y19: сетка")
        for v in (kon["m"], p["c"]):
            ok(istina(mp.mpf(v)) == v_kuski_tol(kon["kuski"], v), f"y19: точка {v}")


def y20(p, kon):
    from math import prod

    cif = lambda N: [int(c) for c in str(N)]
    ok(any(prod(cif(N)) == p["P1"] for N in range(10, 100)) == kon["a"], "y20: а)")
    ok(any(prod(cif(N)) == p["P2"] and sum(cif(N)) == p["S2"] for N in range(100, 1000)) == kon["b"], "y20: б)")
    ok(prod(cif(kon["v"])) == p["P3"], "y20: в) произведение")
    n = len(str(kon["v"]))
    ok(not any(prod(cif(N)) == p["P3"] for N in range(10 ** (n - 1), kon["v"])), "y20: в) меньших нет среди той же длины")


def a14(p, kon):
    # Корни на отрезке — сканированием знака и уточнением mpmath (solveset теряет часть корней).
    k = mp.mpf(kon["k"])
    f = lambda t: mp.cos(2 * t) - k * (mp.cos(t) - mp.sin(t))
    with mp.workdps(30):
        lo, hi = p["lo"] * mp.pi / 4, p["hi"] * mp.pi / 4
        n = 20000
        korni = []
        for i in range(n + 1):
            t = lo + (hi - lo) * i / n
            if abs(f(t)) < mp.mpf("1e-20"):
                korni.append(t)
            elif i < n:
                t2 = lo + (hi - lo) * (i + 1) / n
                if f(t) * f(t2) < 0:
                    korni.append(mp.findroot(f, (t, t2), solver="bisect"))
        # Касания (двойные корни) — по минимуму |f|.
        for v in kon["vybor"]:
            if abs(f(mp.mpf(v))) < mp.mpf("1e-12") and not any(abs(r - v) < 1e-6 for r in korni):
                korni.append(mp.mpf(v))
        vals = sorted(float(r) for r in korni)
        ded = [x for i, x in enumerate(vals) if i == 0 or abs(x - vals[i - 1]) > 1e-7]
    ok(len(ded) == len(kon["vybor"]) and all(abs(u - v) < 1e-9 for u, v in zip(ded, kon["vybor"])), "a14: корни на отрезке", f"{ded} {kon['vybor']}")


def a15(p, kon):
    ok(near(sp.N(sp.acos(sp.Rational(p["a"], 2 * p["b"])), 30), kon["otvet"]), "a15: угол")


def a16(p, kon):
    x = sp.symbols("x", real=True)
    b, c = p["r1"] + p["r2"], p["r1"] * p["r2"]
    odz = sp.Interval.open(sp.Rational(c, b), sp.oo)
    rel = b * x - c <= x**2 if p["znak"] == "le" else b * x - c >= x**2
    reshenie = sp.solve_univariate_inequality(rel, x, relational=False).intersect(odz)
    for t in (reshenie.inf, reshenie.sup):
        if t.is_finite:
            ok(abs(float(t) - min((v for i, v in enumerate(kon["kuski"]) if i % 4 < 2), key=lambda v: abs(v - float(t)))) < 1e-9, "a16: конец", str(t))


def a17(p, kon):
    t = sp.symbols("t")
    rho2 = (p["d1"] - p["v1"] * t) ** 2 + (p["d2"] - p["v2"] * t) ** 2
    ts = sp.solve(sp.diff(rho2, t), t)[0]
    otv = sp.sqrt(rho2.subs(t, ts)) if p["vopros"] == "rho" else 60 * ts
    ok(near(otv, kon["otvet"]), "a17: ответ", str(otv))


def a18(p, kon):
    ox, oy = sp.symbols("ox oy")
    A, B, C = (-p["p"], 0), (p["q"], 0), (0, p["s"])
    d2 = lambda P: (ox - P[0]) ** 2 + (oy - P[1]) ** 2
    o = sp.solve([sp.Eq(d2(A), d2(B)), sp.Eq(d2(A), d2(C))], [ox, oy])
    R = sp.sqrt(d2(A).subs(o))
    ok(near(R if p["nado"] == "R" else 2 * R, kon["otvet"]), "a18: ответ", str(R))


def a19(p, kon):
    a = sp.symbols("a")
    a0 = sp.solve(sp.Eq((a + p["m"]) ** 2 - a * (a + p["n"]), 0), a)
    ok(len(a0) == 1 and near(a0[0], kon["a0"]), "a19: D = 0", str(a0))


def a20(p, kon):
    mozhno = lambda S: any((S - x * p["p"]) % p["q"] == 0 for x in range(S // p["p"] + 1))
    ok(mozhno(p["S1"]) == kon["a"] and mozhno(p["S2"]) == kon["b"], "a20: а), б)")
    F = max(S for S in range(1, 3 * p["p"] * p["q"]) if not mozhno(S))
    ok(F == kon["F"], "a20: в)", str(F))

# ── Семьи O, I, AE (варианты 13–18, свои задачи) ─────────────────────

def otbor_trig(f, lo, hi):
    return [float(r) for r in korni_trig(f, lo, hi)]


def o14(p, kon):
    r = {4: 2, 9: 3, 16: 4, 25: 5}[p["b"]]
    t1 = sp.Rational(r) ** p["c1"]
    t2 = sp.Rational(r) ** p["c2"]
    ok(near(t1 + t2, kon["S"]) and near(t1 * t2, kon["P"]), "o14: коэффициенты")
    T = sp.symbols("T", positive=True)
    tt = sp.solve(T**2 - (t1 + t2) * T + t1 * t2, T)
    otr = sp.Interval(sp.pi * sp.Rational(p["lo"], 2), sp.pi * sp.Rational(p["hi"], 2))
    korni = set()
    for t_ in tt:
        cv = sp.nsimplify(sp.log(t_) / sp.log(p["b"]))
        korni |= set(sp.solveset(sp.Eq(sp.cos(x), cv), x, otr))
    sravn_spiski("o14: отбор", sorted(float(k_) for k_ in korni), kon["vybor"])


def o15(p, kon):
    a_, h_ = sp.sqrt(p["a2"]), sp.sqrt(p["h2"])
    A, B, C = sp.Matrix([0, 0, 0]), sp.Matrix([a_, 0, 0]), sp.Matrix([a_ / 2, a_ * sp.sqrt(3) / 2, 0])
    O = (A + B + C) / 3
    S = O + sp.Matrix([0, 0, h_])
    nrm = (B - S).cross(C - S)
    d = sp.Abs(nrm.dot(A - S)) / nrm.norm()
    ok(near(sp.N(d, 30), kon["otvet"]), "o15: расстояние", str(sp.nsimplify(d)))


def o16(p, kon):
    def istina(t):
        den = t * t - p["c"] ** 2
        if abs(den) < mp.mpf("1e-30"):
            return False
        v = (abs(t - p["a"]) - p["b"]) / den
        return v <= mp.mpf("1e-30") if p["znak"] == "le" else v >= -mp.mpf("1e-30")
    sverka_setki(istina, kon["kuski"], -20, 20, mp.mpf("0.00731"), "o16: сетка")


def o18(p, kon):
    A, B, C = sp.Matrix([0, p["b"]]), sp.Matrix([p["a"], 0]), sp.Matrix([0, 0])
    H = A + (B - A) * ((C - A).dot(B - A) / (B - A).dot(B - A))
    L = A + (B - A) * sp.Rational(p["b"], p["a"] + p["b"])
    M = (A + B) / 2
    d = lambda U, V: sp.sqrt((U - V).dot(U - V))
    otv = d(H, L) if p["nado"] == "HL" else d(H, M)
    ok(near(otv, kon["otvet"]), "o18: ответ", str(sp.nsimplify(otv)))


def o19(p, kon):
    def istina(t):
        av = mp.mpf(t)
        rr = {mp.mpf(-p["c"])}
        for sgn in (1, -1):  # x ≥ 0: x² − 2x − a = 0; x < 0: x² + 2x − a = 0
            for r in mp.polyroots([1, -2 * sgn, -av]):
                if abs(mp.im(r)) < mp.mpf("1e-20"):
                    r = mp.re(r)
                    if (r >= 0 if sgn == 1 else r < 0) and r > -p["c"]:
                        rr.add(mp.nstr(r, 15))
        return len({mp.nstr(v, 15) if not isinstance(v, str) else v for v in rr}) == p["n"]
    sverka_setki(istina, kon["kuski"], -3, p["c"] ** 2 + 4, mp.mpf("0.0371"), "o19: сетка")


def o20(p, kon):
    L = p["d"] * p["m"]
    summy = {a_ + b_ for a_ in range(p["d"], L + 1, p["d"]) for b_ in range(a_, L + 1, p["d"])
             if sp.gcd(a_, b_) == p["d"] and sp.ilcm(a_, b_) == L}
    ok((p["X"] in summy) == kon["daA"] and (p["Y"] in summy) == kon["daB"] and min(summy) == kon["min"], "o20")


def i14(p, kon):
    cc = p["sg"] * 2 * sp.cos(sp.pi / p["u"])
    ok(near(cc, kon["c"]), "i14: коэффициент")
    cm = mp.mpf(sp.N(cc, 60))
    f = lambda t: mp.cos(3 * t) + mp.cos(t) - cm * mp.cos(2 * t)
    sravn_spiski("i14: отбор", otbor_trig(f, p["lo"] * mp.pi / 2, p["hi"] * mp.pi / 2), kon["vybor"])


def i15(p, kon):
    a_, h_ = sp.sqrt(p["a2"]), sp.sqrt(p["h2"])
    A, B, C, D = (sp.Matrix(v) for v in ([0, 0, 0], [a_, 0, 0], [a_, a_, 0], [0, a_, 0]))
    B1, C1 = B + sp.Matrix([0, 0, h_]), C + sp.Matrix([0, 0, h_])
    ok(sp.simplify((D - B1).dot(C - A)) == 0, "i15: а)")
    nrm = (C - B).cross(C1 - B)
    v = D - B1
    ug = sp.asin(sp.Abs(nrm.dot(v)) / (nrm.norm() * v.norm()))
    ok(near(sp.N(ug, 30), kon["otvet"]), "i15: угол")


def i16(p, kon):
    r1 = sp.Rational(p["n1"], p["d1"])
    P, Q = r1 + p["r2"], -r1 * p["r2"]
    def istina(t):
        if t <= 0 or abs(t - 1) < mp.mpf("1e-30"):
            return False
        y = mp.mpf(sp.N(P, 30)) * t + mp.mpf(sp.N(Q, 30))
        if y <= 0:
            return False
        v = mp.log(y) / mp.log(t)
        return v <= 2 + mp.mpf("1e-20") if p["znak"] == "le" else v >= 2 - mp.mpf("1e-20")
    sverka_setki(istina, kon["kuski"], -3, 3 * p["r2"] + 5, mp.mpf("0.00731"), "i16: сетка")


def i17(p, kon):
    t = sp.symbols("t", positive=True)
    S = 2 * p["k"] ** 2
    L = 2 * t + S / t
    kr = sp.solve(sp.diff(L, t), t)
    ok(len(kr) == 1, "i17: одна критическая точка")
    otv = {"L": L.subs(t, kr[0]), "x": kr[0], "y": S / kr[0]}[p["vopros"]]
    ok(near(otv, kon["otvet"]), "i17: ответ")


def i18(p, kon):
    AB = sp.sqrt((p["r"] + p["R"]) ** 2 - (p["R"] - p["r"]) ** 2)
    otv = AB if p["nado"] == "AB" else AB / 2
    ok(near(otv, kon["otvet"]), "i18: ответ")


def i19(p, kon):
    def istina(t):
        rr = set()
        for r in mp.polyroots([1, 0, -3, -mp.mpf(t)], maxsteps=200, extraprec=60):
            if abs(mp.im(r)) < mp.mpf("1e-15") and p["lo"] - mp.mpf("1e-15") <= mp.re(r) <= p["hi"] + mp.mpf("1e-15"):
                rr.add(mp.nstr(mp.re(r), 9))
        return len(rr) == p["n"]
    sverka_setki(istina, kon["kuski"], -60, 60, mp.mpf("0.0731"), "i19: сетка")


def i20(p, kon):
    sc = lambda m: sum(int(ch) for ch in str(m))
    tri = any(sc(m) == p["S"] and m % p["d"] == 0 for m in range(100, 1000))
    mn = next(m for m in range(1, 10**7) if sc(m) == p["S"] and m % p["d"] == 0)
    ok((p["S"] % 9 == 0) == kon["daA"] and tri == kon["daB"] and mn == kon["min"], "i20")


def ae14(p, kon):
    t = sp.symbols("t")
    ts = sp.solve(sp.Eq(t + p["t1"] * p["t2"] / t, p["t1"] + p["t2"]), t)
    korni = sorted(float(sp.Integer(p["b"]) ** r) for r in ts)
    sravn_spiski("ae14: корни", korni, kon["korni"])
    sravn_spiski("ae14: отбор", [r for r in korni if p["lo"] <= r <= p["hi"]], kon["vybor"])


def ae15(p, kon):
    a_ = sp.sqrt(p["a2"])
    V = lambda k_: sp.Matrix([a_ * sp.cos(sp.pi * k_ / 3), a_ * sp.sin(sp.pi * k_ / 3), 0])
    A, B, D, F_ = V(0), V(1), V(3), V(5)
    S = sp.Matrix([0, 0, sp.sqrt(p["l2"] - p["a2"])])
    ok(sp.simplify((F_ - B).dot(D - A)) == 0, "ae15: а)")
    nrm = (A - S).cross(D - S)
    v = B - S
    ug = sp.asin(sp.Abs(nrm.dot(v)) / (nrm.norm() * v.norm()))
    ok(near(sp.N(ug, 30), kon["otvet"]), "ae15: угол")


def ae16(p, kon):
    def istina(t):
        if t < -p["a"]:
            return False
        v = (t - p["r1"]) * (t - p["r2"]) * mp.sqrt(t + p["a"])
        return v <= mp.mpf("1e-30") if p["znak"] == "le" else v >= -mp.mpf("1e-30")
    sverka_setki(istina, kon["kuski"], -12, 15, mp.mpf("0.00731"), "ae16: сетка")


def ae17(p, kon):
    t = sp.symbols("t", positive=True)
    R2 = 2 * p["k"] ** 2
    Sx = 2 * t * sp.sqrt(R2 - t**2)
    kr = [r for r in sp.solve(sp.diff(Sx, t), t) if r.is_positive]
    tt = kr[0]
    h = sp.sqrt(R2 - tt**2)
    otv = {"S": Sx.subs(t, tt), "dlina": 2 * tt, "P": 4 * tt + 2 * h}[p["vopros"]]
    ok(near(otv, kon["otvet"]), "ae17: ответ")


def ae18(p, kon):
    a_, b_, c_ = p["a"], p["b"], p["c"]
    pp = sp.Rational(a_ + b_ + c_, 2)
    otv = abs(b_ - c_) if p["nado"] == "KL" else pp - c_
    ok(near(otv, kon["otvet"]), "ae18: ответ")


def ae19(p, kon):
    def istina(t):
        av = mp.mpf(t)
        f = lambda s: mp.mpf(p["b"]) ** (2 * s) - (av + p["c"]) * mp.mpf(p["b"]) ** s + p["c"] * av
        rr = set()
        for tt in (p["c"], av):
            if tt > 0:
                s = mp.log(tt) / mp.log(p["b"])
                if p["lo"] - mp.mpf("1e-20") <= s <= p["hi"] + mp.mpf("1e-20") and abs(f(s)) < mp.mpf("1e-10"):
                    rr.add(round(float(s), 12))
        return len(rr) == p["n"]
    sverka_setki(istina, kon["kuski"], -2, p["b"] ** p["hi"] + 3, mp.mpf("0.0371"), "ae19: сетка")


def ae20(p, kon):
    S = p["S"]
    def mozhno(m):
        return any((S - d_ * m * (m - 1) // 2) > 0 and (S - d_ * m * (m - 1) // 2) % m == 0
                   for d_ in range(1, S + 1) if d_ * m * (m - 1) // 2 < S)
    nmax = max(m for m in range(1, S + 1) if m == 1 or mozhno(m))
    ok(mozhno(p["n1"]) == kon["daA"] and mozhno(p["n2"]) == kon["daB"] and nmax == kon["nMax"], "ae20")


F = {
    "z17.kachka": z17,
    "b17.dzhoul": b17,
    "c14.tgPodstanovka": c14,
    "c17.maksvell": c17,
    "k14.kosSumma": k14,
    "k15.piramidaPerp": k15,
    "k16.logDrob": k16,
    "k17.lampa": k17,
    "k18.vysotaBiss": k18,
    "k19.kvadratOkr": k19,
    "k20.srednee": k20,
    "l14.chetvertye": l14,
    "l15.menelay": l15,
    "l16.odnorodnoe": l16,
    "l17.spasatel": l17,
    "l18.rombKasanie": l18,
    "l19.koryto": l19,
    "l20.fishka": l20,
    "m14.kvadraty": m14,
    "m15.prizmaUgol": m15,
    "m16.gruppirovka": m16,
    "m17.sudno": m17,
    "m18.bissektrisy": m18,
    "m19.galochka": m19,
    "m20.ostatki": m20,
    "n14.logKvadrat": n14,
    "n15.piramidaSeredina": n15,
    "n16.pokazDrob": n16,
    "n17.koncentraciya": n17,
    "n18.parallBiss": n18,
    "n19.kvadratOkr": n19,
    "n20.podryad": n20,
    "p14.trigDrobSin": p14,
    "p15.prizmaABM": p15,
    "p16.korenDrob": p16,
    "p17.korobka": p17,
    "p18.kasatelnayaParallel": p18,
    "p19.dvaKruga": p19,
    "p20.giri": p20,
    "q14.korenPokaz": q14,
    "q15.piramidaPerp": q15,
    "q16.logMnozhitel": q16,
    "q17.cenaSpros": q17,
    "q18.kvadratPerp": q18,
    "q19.okrKoren": q19,
    "q20.sredneeNabora": q20,
    "r14.trig": r14,
    "r15.stereo": r15,
    "r16.neravenstvo": r16,
    "r17.ekstremum": r17,
    "r18.planimetriya": r18,
    "r19.parametr": r19,
    "r20.teoriyaChisel": r20,
    "u14.tgCtg": u14,
    "u15.kubPlosk": u15,
    "u16.pokazModul": u16,
    "u17.kredit2": u17,
    "u18.dveOkrKasat": u18,
    "u19.trehchlenKoren": u19,
    "u20.nedelimye": u20,
    "v14.kosKoren": v14,
    "v15.prizmaMediana": v15,
    "v16.korenLog": v16,
    "v18.diametrHorda": v18,
    "v19.dvaKornya": v19,
    "v20.udvoenie": v20,
    "w15.tetraedr": w15,
    "w16.logModul": w16,
    "w17.zaborStena": w17,
    "w18.trapeciyaPerp": w18,
    "w19.vGrafik": w19,
    "w20.kamni": w20,
    "x14.tgCtg": x14,
    "x15.prizmaBD": x15,
    "x16.summaLog": x16,
    "x17.uchastok": x17,
    "x18.trivpisannye": x18,
    "x19.modulParaboly": x19,
    "x20.summaCifr": x20,
    "y14.pokazSimm": y14,
    "y15.kubDiagonal": y15,
    "y16.logPolovina": y16,
    "y17.kreditDvaGoda": y17,
    "y18.trapeciyaDiagonali": y18,
    "y19.modulVnutri": y19,
    "y20.proizvCifr": y20,
    "a14.cosRazn": a14,
    "a15.piramidaSkreshch": a15,
    "a16.logOsnovanieX": a16,
    "a17.perekrestok": a17,
    "a18.perpHordy": a18,
    "a19.kvadratParametr": a19,
    "a20.monety": a20,
    "o14.pokazKos": o14,
    "o15.piramidaRasst": o15,
    "o16.modulDrob": o16,
    "o18.bissVysotaMediana": o18,
    "o19.wKoren": o19,
    "o20.nodNok": o20,
    "i14.kosTroynoy": i14,
    "i15.prizmaDiag": i15,
    "i16.logOsnovanie": i16,
    "i17.uchastok": i17,
    "i18.dveOkrKasanie": i18,
    "i19.kubOtrezok": i19,
    "i20.summaCifr": i20,
    "ae14.logObratnyy": ae14,
    "ae15.shestiugPiramida": ae15,
    "ae16.korenTrehchlen": ae16,
    "ae17.polukrug": ae17,
    "ae18.vnevpisannaya": ae18,
    "ae19.pokazOtrezok": ae19,
    "ae20.progressiya": ae20,
}

rows = json.load(open(sys.argv[1], encoding="utf-8"))
for row in rows:
    before = fails
    F[row["s"]](row["p"], row["kontrol"])
    print(f"  {'✓' if fails == before else '✗'} {row['v']} {row['s']}")
print(f"\nПроверок: {checks}, ошибок: {fails}")
sys.exit(1 if fails else 0)
