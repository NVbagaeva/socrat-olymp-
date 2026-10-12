"""Независимая проверка ответов ДЗ №9 (исходного и обновлённого) точными дробями.

Код не берёт ничего из шаблонов сайта: каждая задача пересчитана заново
по своей формуле. Запуск: python3 docs/zadanie-5-dz9-proverka.py
"""
from fractions import Fraction as F
from math import comb
from itertools import product

def p(x): return F(x) / 100
def rnd2(x):  # округление до сотых «половина вверх»
    return F(int(x * 100 + F(1, 2)), 100)
def fmt(x, digits=None):
    x = rnd2(x) if digits == 2 else x
    s = f"{float(x):.6f}".rstrip('0').rstrip('.')
    return s.replace('.', ',')

def hotya_by(*ps): 
    q = F(1)
    for x in ps: q *= 1 - x
    return 1 - q
def bern(n, k, x): return comb(n, k) * x**k * (1 - x)**(n - k)
def bayes_kost(S, m, k=1):
    # перебор всех последовательностей бросков с суммой S
    total = F(0); good = F(0)
    for n in range(1, S + 1):
        for seq in product(range(1, m + 1), repeat=n):
            if sum(seq) == S:
                pr = F(1, m) ** n
                total += pr
                if n == k: good += pr
    return good / total
def chetvero(ps, g):
    tolko = []
    for i in range(4):
        t = F(1)
        for j, x in enumerate(ps): t *= x if i == j else 1 - x
        tolko.append(t)
    return hotya_by(*ps), tolko[g] / sum(tolko)

def reshit(d):
    out = []
    out.append(fmt(hotya_by(F(d[1][0], d[1][1]), F(d[1][2], d[1][3]))))
    out.append(fmt(hotya_by(*map(p, d[2]))))
    n, pa, ka, pb, kb = d[3]
    out.append(fmt(bern(n, ka, F(pa, 10)) / bern(n, kb, F(pb, 10)), 2))
    x, fa, fb = d[4]
    out.append(fmt(p(x) * (1 - p(fa)) + (1 - p(x)) * (1 - p(fb))))
    N, n1, n2, a1, a2, a3 = d[5]
    h = [F(n1, N), F(n2, N), F(N - n1 - n2, N)]
    a = [p(a1), p(a2), p(a3)]
    pol = sum(hh * aa for hh, aa in zip(h, a))
    out.append(fmt(pol))
    out.append(fmt(h[2] * a[2] / pol, 2))
    v, s1, s2 = d[7]
    sv, sn = p(v) * p(s1), (1 - p(v)) * p(s2)
    out.append(f"а) нет; б) {fmt(sv + sn)}; в) {fmt(sv / (sv + sn), 2)}")
    hb, odin = chetvero([F(x, 10) for x in d[8]], 0)
    out.append(f"а) {fmt(hb)}; б) {fmt(odin, 2)}")
    x, f, e = d[9]
    hor, plo = (1 - p(x)) * (1 - p(e)), p(x) * (1 - p(f))
    out.append(fmt(hor / (hor + plo), 2))
    x, s, e = d[10]
    ist, lozh = p(x) * p(s), (1 - p(x)) * p(e)
    out.append(f"а) {fmt(ist + lozh)}; б) {fmt(ist / (ist + lozh), 2)}")
    s, t, R = d[11]  # x из уравнения s·x + (1−t)(1−x) = R
    x = (R - (1 - p(t))) / (p(s) - (1 - p(t)))
    out.append(fmt(p(s) * x / R, 2))
    out.append(fmt(bayes_kost(d[12], 6), 2))
    a, ab = d[13]
    out.append(fmt(F(ab, a + ab)))
    return out

ISHODNOE = {1: (40, 50, 10, 40), 2: (10, 20, 5), 3: (7, 8, 6, 4, 5), 4: (80, 4, 95),
            5: (100, 55, 35, 80, 60, 20), 7: (95, 1, 50), 8: (9, 7, 5, 4), 9: (75, 95, 1),
            10: (4, 90, 2), 11: (86, 94, F(1, 10)), 12: 4, 13: (4, 1)}
NOVOE = {1: (21, 30, 9, 20), 2: (15, 10, 20), 3: (6, 7, 4, 2, 3), 4: (75, 8, 70),
         5: (80, 40, 28, 90, 60, 20), 7: (90, 3, 25), 8: (8, 6, 5, 3), 9: (25, 92, 4),
         10: (5, 96, 3), 11: (90, 95, F(135, 1000)), 12: 5, 13: (6, 2)}
KLYUCH_AVTORA = ['0,85', '0,316', '4,74', '0,778', '0,67', '0,03', 'а) нет; б) 0,0345; в) 0,28',
                 'а) 0,991; б) 0,69', '0,87', 'а) 0,0552; б) 0,65', '0,43', '0,63', '0,2']

for name, d in (('Исходное ДЗ №9', ISHODNOE), ('Обновлённое ДЗ №9', NOVOE)):
    print(name)
    for i, o in enumerate(reshit(d), 1):
        print(f'  {i:2}. {o}')
print('Исходное совпадает с ключом автора:', reshit(ISHODNOE) == KLYUCH_AVTORA)
