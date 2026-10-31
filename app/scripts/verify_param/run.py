#!/usr/bin/env python3
"""scripts/verify_param/run.py — проверка ответов задания №19 перебором параметра.

Запуск (из app/):
    node scripts/verify_param/dump.mjs /tmp/z19.json
    python3 -I scripts/verify_param/run.py /tmp/z19.json

dump.mjs выгружает из контента раздела все задачи с ответами:
{id: {"otvet": TeX, "title": …}}. Для каждой задачи модуль метода
(m01.py, …) знает условие; ответ берётся из контента — так проверяется
ровно то, что видит ученик. Задача без проверки или проверка без
задачи — ошибка. Итог — таблица «задача — ответ — проверка».
"""

import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from obshchee import sverit  # noqa: E402
import m01  # noqa: E402
import m02  # noqa: E402
import m03  # noqa: E402

MODULI = [m01, m02, m03]


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
        uslovie, (lo, hi), osobye = proverki[zid]
        otvet = zadachi[zid]["otvet"]
        plohie = sverit(otvet, uslovie, lo, hi, osobye=osobye)
        if plohie:
            oshibki += 1
            print(f"РАСХОЖДЕНИЕ  {zid}  {otvet}")
            for a, p, o in plohie[:8]:
                print(f"     a = {a:.6f}: по перебору {'да' if p else 'нет'}, по ответу {'да' if o else 'нет'}")
        else:
            print(f"ок           {zid}  {otvet}")
    print(f"\nЗадач: {len(zadachi)}, расхождений и пропусков: {oshibki}")
    return 1 if oshibki else 0


if __name__ == "__main__":
    sys.exit(main())
