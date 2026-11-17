"""
Сборка банка: из корня репозитория

    python3 -m tools.sbornik.build          # все типы
    python3 -m tools.sbornik.build 1.1 1.2  # выбранные

Пишет app/src/data/sbornik/glava-N/tip-*.json. Каждая задача перед
записью проверена (core.proverit): ответ сверен с исходным выражением.
"""

from __future__ import annotations

import importlib
import os
import sys

from .core import dump, nabrat

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
OUT = os.path.join(ROOT, 'app', 'src', 'data', 'sbornik')

# тип → (модуль, сколько задач в банке, зерно)
# Число задач — как в соответствующем блоке книги-ориентира: на каждую
# её задачу — своя. Словарь {уровень: n} — тип с задачами разных уровней.
GLAVY = {
    1: {
        '1.1': ('t01', 25, 101),
        '1.2': ('t02', 93, 102),
        '1.3': ('t03', 6, 103),
        '1.4': ('t04', {1: 10, 2: 15}, 104),
        '1.5': ('t05', 11, 105),
        '1.6': ('t06', 6, 106),
        '1.7': ('t07', 6, 107),
        '1.8': ('t08', 11, 108),
        '1.9': ('t09', 73, 109),
        '1.10': ('t10', 25, 110),
        '1.11': ('t11', 26, 111),
        '1.12': ('t12', 12, 112),
        '1.13': ('t13', 37, 113),
        '1.14': ('t14', 4, 114),
    },
}


def main(argv: list[str]) -> None:
    only = set(argv[1:])
    for glava, tipy in GLAVY.items():
        os.makedirs(os.path.join(OUT, f'glava-{glava}'), exist_ok=True)
        for tip, (mod, count, seed) in tipy.items():
            if only and tip not in only:
                continue
            module = importlib.import_module(f'tools.sbornik.glava{glava}.{mod}')
            used: set[str] = set()
            if isinstance(count, dict):
                items = []
                for lvl, cnt in count.items():
                    gen = lambda rng, lvl=lvl: (lambda zd: zd if zd is not None and zd.uroven == lvl else None)(
                        module.generator(rng))
                    items += nabrat(gen, cnt, seed + lvl, used)
            else:
                items = nabrat(module.generator, count, seed, used)
            data = [zd.to_json(i + 1) for i, zd in enumerate(items)]
            path = os.path.join(OUT, f'glava-{glava}', f'tip-{tip}.json')
            dump(path, data)
            print(f'{tip}: {len(data)} задач → {os.path.relpath(path, ROOT)}')


if __name__ == '__main__':
    main(sys.argv)
