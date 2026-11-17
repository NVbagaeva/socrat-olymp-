"""
Самопроверка банка сборника — без генераторов, только по файлам:

    python3 -m tools.sbornik.check

Для каждой задачи app/src/data/sbornik/glava-*/tip-*.json:
  1. ответ пересчитан заново: исходное выражение (proverka.iskhod) и
     запись ответа (otvet.zapis) разобраны sympy и сверены в каждой
     точке проверки и с записанным значением; число — с точностью 1e-25;
  2. точки проверки лежат там, где исходное выражение определено,
     и выполнены условия на буквы (proverka.usloviya);
  3. дубли: одинаковое условие (текст + формула + дополнение) или одно
     и то же исходное выражение у двух задач;
  4. «плохие» числа: в ответе-числе огромные числители/знаменатели,
     длинные десятичные хвосты; в условии — запрещённые разметки ($$);
  5. формат: файл соответствует схеме app/src/data/sbornik/schema.json,
     id по порядку, уровень 1–3, 2–8 шагов.

KaTeX и движок проверки сайта — scripts/check-sbornik.mjs (pnpm
test:sbornik). Ненулевой код возврата — есть проблемы, они напечатаны.
"""

from __future__ import annotations

import glob
import json
import math
import os
import sys

import sympy as sp

from .core import SYM, finite_real

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
DATA = os.path.join(ROOT, 'app', 'src', 'data', 'sbornik')

LOCALS = {'root': sp.real_root, 'abs': sp.Abs, 'sqrt': sp.sqrt, **SYM}


def iz_zapisi(zapis: str):
    return sp.sympify(zapis.replace('^', '**'), locals=LOCALS)


def iz_srepr(s: str):
    return sp.parse_expr(s, local_dict={**{n: getattr(sp, n) for n in dir(sp) if not n.startswith('_')}})


def plohoe_chislo(val) -> str | None:
    val = sp.nsimplify(val)
    if val.is_Rational:
        if abs(val.p) > 10**6 or val.q > 1000:
            return f'неудобное число {val}'
    return None


def tochki_ok(src, kusok: dict, usloviya, problems: list[str], zid: str) -> None:
    ans = iz_zapisi(kusok['zapis'])
    if len(kusok['tochki']) < 4:
        problems.append(f'{zid}: мало точек проверки ({len(kusok["tochki"])})')
    for pt in kusok['tochki']:
        subs = {SYM[k]: sp.nsimplify(v, rational=True) for k, v in pt.items() if k != '='}
        for u in usloviya:
            if not bool(u.subs(subs)):
                problems.append(f'{zid}: точка {pt} нарушает условие {u}')
        s_val = finite_real(src, subs)
        a_val = finite_real(ans, subs)
        if s_val is None:
            problems.append(f'{zid}: исходное выражение не определено в точке {pt}')
            continue
        if a_val is None or abs(s_val - a_val) > 1e-9 * max(1.0, abs(s_val)):
            problems.append(f'{zid}: ответ не равен исходному в точке {pt}: {s_val} ≠ {a_val}')
        if abs(s_val - pt['=']) > 1e-9 * max(1.0, abs(s_val)):
            problems.append(f'{zid}: записанное значение в точке {pt} неверно')


def proverit_zadachu(z: dict, problems: list[str]) -> None:
    zid = z['id']
    try:
        src = iz_srepr(z['proverka']['iskhod'])
        usloviya = [iz_srepr(u) for u in z['proverka'].get('usloviya', [])]
    except Exception as e:  # noqa: BLE001 — любая ошибка разбора — проблема банка
        problems.append(f'{zid}: не разобралось исходное выражение: {e}')
        return
    ot = z['otvet']
    vid = ot['vid']
    if vid == 'chislo':
        val = iz_zapisi(ot['zapis'])
        if abs(complex(sp.N(src - val, 40))) > 1e-25:
            problems.append(f'{zid}: число не сходится: {src} ≠ {val}')
        if not math.isclose(float(sp.N(val)), ot['znachenie'], rel_tol=1e-12, abs_tol=1e-12):
            problems.append(f'{zid}: значение ответа записано неверно')
        bad = plohoe_chislo(val)
        if bad:
            problems.append(f'{zid}: {bad}')
    elif vid == 'vyrazhenie':
        tochki_ok(src, ot, usloviya, problems, zid)
    elif vid == 'kusochnyi':
        if len(ot['kuski']) < 2:
            problems.append(f'{zid}: ответ по случаям из одного куска')
        for k in ot['kuski']:
            tochki_ok(src, k, usloviya, problems, zid)
            o = k['oblast']
            v = ot['peremennaya']
            for pt in k['tochki']:
                xv = pt[v]
                if (o['lo'] is not None and xv < o['lo']) or (o['hi'] is not None and xv > o['hi']):
                    problems.append(f'{zid}: точка {xv} вне своего промежутка {o["tex"]}')
    elif vid == 'chisla':
        vals = list(src)
        if len(vals) != len(ot['polya']):
            problems.append(f'{zid}: число полей не совпадает с проверкой')
        for want, pole in zip(vals, ot['polya']):
            got = iz_zapisi(pole['zapis'])
            if abs(complex(sp.N(want - got, 40))) > 1e-25:
                problems.append(f'{zid}: поле {pole["podpis"]}: {want} ≠ {got}')
    else:
        problems.append(f'{zid}: неизвестный вид ответа {vid}')


def main() -> int:
    problems: list[str] = []
    uslovia: dict[str, str] = {}
    iskhodnye: dict[str, str] = {}
    vsego = 0
    import jsonschema

    with open(os.path.join(DATA, 'schema.json'), encoding='utf-8') as fh:
        validator = jsonschema.Draft202012Validator(json.load(fh))
    for path in sorted(glob.glob(os.path.join(DATA, 'glava-*', 'tip-*.json'))):
        tip = os.path.basename(path)[4:-5]
        with open(path, encoding='utf-8') as fh:
            data = json.load(fh)
        for err in list(validator.iter_errors(data))[:5]:
            where = '/'.join(str(p) for p in err.absolute_path)
            problems.append(f'{tip}: схема: {where}: {err.message[:160]}')
        for i, z in enumerate(data, 1):
            vsego += 1
            zid = z.get('id', '?')
            if zid != f'{tip}.{i:03d}':
                problems.append(f'{zid}: номер не по порядку (ждали {tip}.{i:03d})')
            if z.get('tip') != tip:
                problems.append(f'{zid}: тип {z.get("tip")} в файле {tip}')
            if z.get('uroven') not in (1, 2, 3):
                problems.append(f'{zid}: уровень {z.get("uroven")}')
            if not 2 <= len(z.get('razbor', [])) <= 8:
                problems.append(f'{zid}: шагов решения {len(z.get("razbor", []))}')
            if not z.get('podskazki'):
                problems.append(f'{zid}: нет подсказок')
            for txt in [z['uslovie'], z.get('dopolnenie', ''), *(s['chto'] for s in z['razbor']), *z['podskazki']]:
                if '$$' in txt:
                    problems.append(f'{zid}: $$ в тексте — сайт их не набирает')
                if txt.count('$') % 2:
                    problems.append(f'{zid}: непарный $ в «{txt[:40]}…»')
            key = '|'.join([z['uslovie'], z.get('formula', ''), z.get('dopolnenie', '')])
            if key in uslovia:
                problems.append(f'{zid}: то же условие, что у {uslovia[key]}')
            uslovia[key] = zid
            ish = z['proverka']['iskhod']
            if ish in iskhodnye and z['otvet']['vid'] != 'chislo':
                problems.append(f'{zid}: то же исходное выражение, что у {iskhodnye[ish]}')
            iskhodnye.setdefault(ish, zid)
            proverit_zadachu(z, problems)
    for p in problems:
        print(p)
    print(f'Банк сборника: задач {vsego}, проблем {len(problems)}.')
    return 1 if problems else 0


if __name__ == '__main__':
    sys.exit(main())
