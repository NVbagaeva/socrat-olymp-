"""Общее для проверок задания №19: счёт решений перебором и разбор ответа.

Проверка не повторяет решение из текста. Для каждого значения параметра
уравнение (или система, сведённая подстановкой к одному уравнению)
решается численно на мелкой сетке по x, и число решений сравнивается
с тем, что обещает ответ. Значения параметра — равномерная сетка плюс
концы промежутков ответа, сами и в ±ε от них.
"""

import math
import re

import numpy as np

INF = math.inf


# ── Корни уравнения g(x) = 0 на отрезке ─────────────────────────────


def _utochnit(g, lo, hi, shagov=60):
    """Минимум |g| на [lo; hi] золотым сечением: касание сеткой не поймать."""
    f = lambda t: abs(g(t))
    r = (math.sqrt(5) - 1) / 2
    a, b = lo, hi
    c, d = b - r * (b - a), a + r * (b - a)
    for _ in range(shagov):
        if f(c) < f(d):
            b = d
        else:
            a = c
        c, d = b - r * (b - a), a + r * (b - a)
    t = (a + b) / 2
    return t, f(t)


def korni(g, lo, hi, n=200_001, tochki=(), dopusk=1e-9, slit=1e-4, setka=None):
    """Корни g(x) = 0 на [lo; hi]: список или INF (корней бесконечно много).

    g — функция numpy-массива; где g не определена, она возвращает nan.
    tochki — особые x (концы области, изломы), которые проверяются точно.
    setka — своя сетка x (например, логарифмическая для далёких корней).
    """
    x = np.linspace(lo, hi, n) if setka is None else np.asarray(setka, dtype=float)
    with np.errstate(all="ignore"):
        y = g(x)
    ok = np.isfinite(y)
    nuli = ok & (np.abs(y) < dopusk)
    # Бесконечно много решений: нули подряд на заметном куске сетки.
    if nuli.sum() > 50:
        beg = np.diff(np.concatenate(([0], nuli.astype(int), [0])))
        dlina = np.where(beg == -1)[0] - np.where(beg == 1)[0]
        if dlina.max() > 50:
            return INF
    nayd = [float(t) for t in x[nuli]]
    s = np.sign(y)
    for i in np.where(ok[:-1] & ok[1:] & (s[:-1] * s[1:] < 0))[0]:
        a, b = x[i], x[i + 1]
        for _ in range(80):
            m = (a + b) / 2
            if np.sign(g(np.array([m]))[0]) == np.sign(g(np.array([a]))[0]):
                a = m
            else:
                b = m
        nayd.append(float((a + b) / 2))
    ay = np.where(ok, np.abs(y), np.inf)
    for i in np.where((ay[1:-1] <= ay[:-2]) & (ay[1:-1] <= ay[2:]) & (ay[1:-1] < 1e-3))[0]:
        t, v = _utochnit(lambda u: g(np.array([u]))[0], x[i], x[i + 2])
        if v < dopusk:
            nayd.append(t)
    for t in tochki:
        if lo <= t <= hi:
            with np.errstate(all="ignore"):
                v = g(np.array([float(t)]))[0]
            if np.isfinite(v) and abs(v) < dopusk:
                nayd.append(float(t))
    nayd.sort()
    out = []
    posl = None
    for t in nayd:
        # Близкие находки склеиваются, только если между ними g ≈ 0:
        # это одно касание (полоса почти-нулей), а не два корня рядом.
        if posl is not None and t - posl <= slit:
            with np.errstate(all="ignore"):
                v = g(np.array([(t + posl) / 2]))[0]
            if (np.isfinite(v) and abs(v) < 10 * dopusk) or t - posl <= 1e-12:
                posl = t
                continue
        out.append(t)
        posl = t
    return out


def chislo(r):
    return r if r == INF else len(r)


def tochki_vmeste(*spiski, slit=1e-6):
    """Объединение решений системы (x; y): совпавшие точки — одна."""
    out = []
    for s in spiski:
        if s == INF:
            return INF
        for p in s:
            if not any(abs(p[0] - q[0]) < slit and abs(p[1] - q[1]) < slit for q in out):
                out.append(p)
    return out


# ── Ответ: TeX-запись множества ─────────────────────────────────────


def _chislo_tex(s):
    s = s.strip().replace("\\,", "").replace(" ", "").replace("−", "-")
    s = s.replace("\\dfrac", "\\frac").replace("\\tfrac", "\\frac")
    if s in ("+\\infty", "\\infty"):
        return INF
    if s == "-\\infty":
        return -INF
    s = s.replace("{,}", ".").replace(",", ".")
    # \frac15, \frac9{16}, \frac{9}2 — короткие записи KaTeX: к виду со скобками
    s = re.sub(r"\\frac(\d)", r"\\frac{\1}", s)
    s = re.sub(r"\\frac(\{[^{}]*\})(\d)", r"\\frac\1{\2}", s)
    s = re.sub(r"\\frac\{([^{}]*(?:\{[^{}]*\}[^{}]*)*)\}\{([^{}]*(?:\{[^{}]*\}[^{}]*)*)\}", r"((\1)/(\2))", s)
    s = re.sub(r"\\sqrt\{([^{}]*)\}", r"sqrt(\1)", s)
    s = re.sub(r"(\d|\))(sqrt|\()", r"\1*\2", s)
    s = s.replace("\\pi", "pi")
    s = re.sub(r"(\d|\))pi", r"\1*pi", s)
    return float(eval(s, {"__builtins__": {}}, {"sqrt": math.sqrt, "pi": math.pi}))


def _razbit(s, sep):
    """Разбить по sep на верхнем уровне скобок."""
    out, glub, cur = [], 0, ""
    i = 0
    while i < len(s):
        if s.startswith(sep, i) and glub == 0:
            out.append(cur)
            cur = ""
            i += len(sep)
            continue
        ch = s[i]
        if ch in "({[":
            glub += 1
        elif ch in ")}]":
            glub -= 1
        cur += ch
        i += 1
    out.append(cur)
    return out


def mnozhestvo(tex):
    """Множество из ответа: список кусков (lo, hi, lo_vkl, hi_vkl)."""
    s = tex.replace("\\left", "").replace("\\right", "").replace(" ", "")
    s = re.sub(r"^[a-zA-Z]\\in", "", s)
    if s in ("\\varnothing", "\\emptyset"):
        return []
    kuski = []
    for chast in _razbit(s, "\\cup"):
        if chast.startswith("\\{"):
            for t in _razbit(chast[2:-2], ";"):
                v = _chislo_tex(t)
                kuski.append((v, v, True, True))
            continue
        lo_vkl = chast[0] == "["
        hi_vkl = chast[-1] == "]"
        lo, hi = _razbit(chast[1:-1], ";")
        kuski.append((_chislo_tex(lo), _chislo_tex(hi), lo_vkl, hi_vkl))
    return kuski


def prinadlezhit(a, kuski, eps=1e-12):
    for lo, hi, lv, hv in kuski:
        if (a > lo + eps or (lv and abs(a - lo) <= eps)) and (a < hi - eps or (hv and abs(a - hi) <= eps)):
            return True
    return False


def kontsy(kuski):
    return sorted({v for k in kuski for v in k[:2] if math.isfinite(v)})


# ── Сверка ответа ───────────────────────────────────────────────────


def sverit(otvet_tex, uslovie, a_lo, a_hi, shag=0.02, osobye=(), epsy=(1e-2, 1e-3)):
    """Сравнить ответ с перебором параметра.

    uslovie(a) -> bool: выполняется ли условие задачи при этом a.
    Возвращает список расхождений: (a, по_перебору, по_ответу).
    """
    kuski = mnozhestvo(otvet_tex)
    znach = set(np.round(np.arange(a_lo, a_hi + shag / 2, shag), 10))
    for v in list(kontsy(kuski)) + list(osobye):
        znach.add(v)
        for e in epsy:
            znach.update((v - e, v + e))
    plohie = []
    for a in sorted(znach):
        p = bool(uslovie(a))
        o = prinadlezhit(a, kuski)
        if p != o:
            plohie.append((a, p, o))
    return plohie
