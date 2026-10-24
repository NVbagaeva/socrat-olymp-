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
    sol = sp.solve(sp.Eq(sp.Integer(p["c"]) ** (p["b"] - x), sp.sqrt(sp.Integer(p["a"]) ** p["m"])), x)
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
