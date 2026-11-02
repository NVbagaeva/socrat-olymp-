#!/usr/bin/env python3
"""scripts/verify_param/run.py — проверка ответов задания №19 перебором параметра.

Запуск (из app/):
    node scripts/verify_param/dump.mjs /tmp/z19.json
    python3 -I scripts/verify_param/run.py /tmp/z19.json

dump.mjs выгружает из контента раздела все задачи с ответами:
{id: {"otvet": TeX, "title": …}}. Для каждой задачи модуль метода
(m01.py … m13.py, …) знает условие; ответ берётся из контента — так проверяется
ровно то, что видит ученик. Задача без проверки или проверка без
задачи — ошибка. Итог — таблица «задача — ответ — проверка».

У модуля может быть словарь NEVERNYE {id: [неверные ответы]}: каждый из
них перебор обязан опровергнуть — так видно, что проверка различает
ответ и, например, отброшенного кандидата.
"""

import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from obshchee import sverit  # noqa: E402
import m01  # noqa: E402
import m02  # noqa: E402
import m03  # noqa: E402
import m04  # noqa: E402
import m05  # noqa: E402
import m06  # noqa: E402
import m07  # noqa: E402
import m08  # noqa: E402
import m09  # noqa: E402
import m10  # noqa: E402
import m11  # noqa: E402
import m12  # noqa: E402
import m13  # noqa: E402

MODULI = [m01, m02, m03, m04, m05, m06, m07, m08, m09, m10, m11, m12, m13]


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        return 2
    with open(sys.argv[1], encoding="utf-8") as f:
        zadachi = json.load(f)
    proverki = {}
    for m in MODULI:
        proverki.update(m.ZADACHI)
    oshibki = 0
    for zid in sorted(set(zadachi) | set(proverki)):
        if zid not in proverki:
            print(f"НЕТ ПРОВЕРКИ  {zid}")
            oshibki += 1
            continue
        if zid not in zadachi:
            print(f"НЕТ ЗАДАЧИ    {zid}")
            oshibki += 1
            continue
        # Четвёртое поле — свой шаг сетки по параметру (широкий промежуток).
        uslovie, (lo, hi), osobye, *shag = proverki[zid]
        otvet = zadachi[zid]["otvet"]
        plohie = sverit(otvet, uslovie, lo, hi, osobye=osobye, **({"shag": shag[0]} if shag else {}))
        if plohie:
            oshibki += 1
            print(f"РАСХОЖДЕНИЕ  {zid}  {otvet}")
            for a, p, o in plohie[:8]:
                print(f"     a = {a:.6f}: по перебору {'да' if p else 'нет'}, по ответу {'да' if o else 'нет'}")
        else:
            print(f"ок           {zid}  {otvet}")
    nevernye = {}
    for m in MODULI:
        nevernye.update(getattr(m, "NEVERNYE", {}))
    for zid in sorted(nevernye):
        if zid not in proverki:
            print(f"НЕТ ПРОВЕРКИ  {zid} (неверные ответы)")
            oshibki += 1
            continue
        uslovie, (lo, hi), osobye, *shag = proverki[zid]
        for neverno in nevernye[zid]:
            kw = {"shag": shag[0]} if shag else {}
            if sverit(neverno, uslovie, lo, hi, osobye=osobye, do_pervogo=True, **kw):
                print(f"отвергнут    {zid}  {neverno}")
            else:
                oshibki += 1
                print(f"НЕ ОТВЕРГНУТ {zid}  {neverno}")
    n_nev = sum(len(v) for v in nevernye.values())
    print(f"\nЗадач: {len(zadachi)}, неверных ответов на опровержение: {n_nev}, расхождений и пропусков: {oshibki}")
    return 1 if oshibki else 0


if __name__ == "__main__":
    sys.exit(main())
