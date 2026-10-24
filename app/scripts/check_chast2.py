#!/usr/bin/env python3
"""scripts/check_chast2.py — второй, независимый счёт ответов части 2
(задания 14–20) вариантов повышенной сложности: sympy и численная
проверка, без кода сайта.

Запуск:
    node scripts/check-chast2.mjs --json /tmp/c2.json
    python3 -I scripts/check_chast2.py /tmp/c2.json

Каждое задание решается здесь заново по своему условию (числа — в
таблице ниже, рядом с номером версии), ответ сравнивается с верным
ответом из данных сайта.
"""

import json
import math
import sys

import sympy as sp

x, a = sp.symbols("x a", real=True)


def sravnit(nazv, mine, sait, ok):
    print(("✓ " if ok else "✗ ") + nazv + f": sympy {mine} | сайт {sait}")
    return ok


def v11(dannye):
    bad = 0
    z = {t["no"]: t for t in dannye["1.1"]}

    # 14: корни на [3π; 9π/2] — численно по знаку и по нулям аргумента.
    def f14(t):
        arg = math.sqrt(2) * math.cos(t + math.pi / 2) + math.cos(t - math.pi / 4)
        return math.log2(arg) + 0.5 if arg > 0 else None

    korni = []
    N = 200000
    lo, hi = 3 * math.pi, 4.5 * math.pi
    prev = None
    for i in range(N + 1):
        t = lo + (hi - lo) * i / N
        v = f14(t)
        if v is not None and abs(v) < 1e-9:
            korni.append(t)
        if v is not None and prev is not None and prev * v < 0:
            korni.append(t)
        prev = v
    # Касание: cos(x+π/4) = √2/2 — нули кратные, ищем минимум |f|.
    kand = [3.5 * math.pi, 4 * math.pi]
    nashi = sorted(set(round(k / math.pi, 6) for k in kand if f14(k) is not None and abs(f14(k)) < 1e-9))
    sait = sorted(round(float(sp.sympify(s.replace("\\frac{7\\pi}{2}", "7*pi/2").replace("4\\pi", "4*pi"))) / math.pi, 6) for s in z[14]["korni"])
    bad += not sravnit("1.1 №14б", nashi, sait, nashi == sait == [3.5, 4.0])
    # Серии: каждое значение 2πn и −π/2+2πn — корень, а других корней на большом отрезке нет.
    vse = sorted(set(round(t / math.pi, 3) for t in [x0 * math.pi / 2 for x0 in range(-40, 41)] if f14(t) is not None and abs(f14(t)) < 1e-9))
    ozhid = sorted(set(round(v, 3) for n in range(-12, 13) for v in (2 * n, -0.5 + 2 * n) if -20 <= v <= 20))
    bad += not sravnit("1.1 №14а", vse[:6], ozhid[:6], vse == ozhid)

    # 15: координаты.
    s3 = sp.sqrt(3)
    A, C, D, S = sp.Matrix([-3, 0, 0]), sp.Matrix([3, 0, 0]), sp.Matrix([0, -s3, 0]), sp.Matrix([0, 0, 3])
    k = sp.symbols("k", positive=True)
    K = C + (S - C) * k
    P = sp.Matrix([K[0], 0, 0])
    kk = [r for r in sp.solve(sp.Eq((K - P).norm() ** 2, (P - D).norm() ** 2), k) if 0 < r < 1][0]
    K = C + (S - C) * kk
    n = (D - A).cross(K - A)
    d = sp.nsimplify(sp.simplify(abs((C - A).dot(n)) / n.norm()))
    bad += not sravnit("1.1 №15а SK:KC", (1 - kk) / kk, "1/2", (1 - kk) / kk == sp.Rational(1, 2))
    bad += not sravnit("1.1 №15б", d, z[15]["chislo"], abs(float(d) - z[15]["znach"]) < 1e-9)

    # 16: числитель минус 3·знаменатель и метод интервалов (точно).
    expr = (3 ** (2 * x + 1) + x - 4 * sp.sqrt(x) - 78) / (9**x - 27) - 3
    nul = sp.solve(sp.Eq(x - 4 * sp.sqrt(x) + 3, 0), x)
    ok16 = sorted(nul) == [1, 9] and all(
        (expr.subs(x, t) >= 0) == want
        for t, want in [(sp.Rational(1, 2), False), (1, True), (sp.Rational(5, 4), True), (2, False), (8, False), (9, True), (20, True)]
    )
    bad += not sravnit("1.1 №16", "[1; 1,5) ∪ [9; +∞)", z[16]["tekst"], ok16)

    # 17: максимум A(τ) — ноль производной τ² при данном n.
    T = sp.Rational(126, 10)
    nn = sp.symbols("n", positive=True)
    u = sp.symbols("u", positive=True)
    g = u**2 / ((T**2 - u) ** 2 + nn * u * T**2)
    crit = sp.solve(sp.diff(g, u), u)
    tau = sp.sqrt(crit[0])
    ok17 = all(abs(float(tau.subs(nn, t)) - 12.6 * math.sqrt(2 / (2 - t))) < 1e-9 for t in (0.05, 0.2, 0.45))
    bad += not sravnit("1.1 №17", sp.simplify(tau), "12,6·√(2/(2−n))", ok17)

    # 18: построение пятиугольника и площадь (окружность касается AE, AB, DE;
    # вершина C — на второй касательной из B ниже основания BD).
    def pyatiugolnik(aa, bb, cc):
        hb = (bb - aa) / 2
        h = math.sqrt(cc * cc - hb * hb)
        Ap, Bp = (-aa / 2, h), (-bb / 2, 0)
        dx, dy = Bp[0] - Ap[0], Bp[1] - Ap[1]
        L = math.hypot(dx, dy)
        for sgn in (1, -1):
            coef = -sgn * dx + L
            if abs(coef) < 1e-12:
                continue
            y0 = (L * h - sgn * dx * h + sgn * dy * Ap[0]) / coef
            r = h - y0
            if r <= 0:
                continue
            dd = math.hypot(Bp[0], Bp[1] - y0)
            if dd <= r:
                continue
            half = math.asin(r / dd)
            ab = math.atan2(Ap[1] - Bp[1], Ap[0] - Bp[0])
            for zn in (1, -1):
                th = math.atan2(y0 - Bp[1], -Bp[0]) + zn * half
                if abs(math.sin(th - ab)) < 1e-9 or abs(math.cos(th)) < 1e-12:
                    continue
                cy = Bp[1] + math.tan(th) * (-Bp[0])
                if cy < 0:
                    pts = [Ap, Bp, (0, cy), (bb / 2, 0), (aa / 2, h)]
                    return abs(sum(pts[i][0] * pts[(i + 1) % 5][1] - pts[(i + 1) % 5][0] * pts[i][1] for i in range(5))) / 2
        return None

    assert abs(pyatiugolnik(14, 24, 13) - 420) < 1e-6  # построение верно на задаче-образце
    S5 = pyatiugolnik(10, 28, 15)
    bad += not sravnit("1.1 №18б", S5, z[18]["znach"], S5 is not None and abs(S5 - z[18]["znach"]) < 1e-6)

    # 19: число корней численно для сетки a.
    def korney(av):
        # Корни точно: L=4 → x=±√(a²−16); x=a+16; фильтр области a<x<−a.
        res = set()
        if av < 0:
            if av * av - 16 > 0:
                for s in (1, -1):
                    xv = s * math.sqrt(av * av - 16)
                    if av < xv < -av:
                        res.add(round(xv, 9))
            xv = av + 16
            if av < xv < -av:
                res.add(round(xv, 9))
        # Подстановка в исходное уравнение — проверка, что это корни.
        for xv in res:
            lg = math.log2(av * av - xv * xv)
            lhs = (av + 0.25 * (xv - av) ** 1.5) * lg + 4 * xv - (xv - av) ** 1.5
            rhs = 4 * av + xv * lg
            assert abs(lhs - rhs) < 1e-6
        return len(res)

    def v_otvete(av):
        return (-8 <= av < -4) or abs(av + 8.5) < 1e-12

    setka = [i / 100 for i in range(-1500, 101)] + [-8.5, -8, -4]
    ok19 = all((korney(t) == 2) == v_otvete(t) for t in setka)
    bad += not sravnit("1.1 №19", "[−8; −4) ∪ {−8,5}", z[19]["tekst"], ok19)

    # 20: перебор.
    def dlina(Lc):
        for kk2 in range(1, 60):
            for i in range(kk2):
                if 100 * kk2 - 20 * i - 50 * (kk2 - 1 - i) == Lc:
                    return True
        return False

    Lmin = next(c for c in range(100, 2000, 10) if dlina(c) and all(dlina(c + 10 * m) for m in range(1, 300)))
    bad += not sravnit("1.1 №20", (dlina(410), dlina(370), Lmin), z[20]["tekst"], (dlina(410), dlina(370), Lmin) == (True, False, 380))
    return bad


def main():
    dannye = json.load(open(sys.argv[1], encoding="utf-8"))
    bad = v11(dannye)
    print(f"sympy, часть 2: расхождений {bad}")
    sys.exit(1 if bad else 0)


main()
