"""Считает вероятности выходов прямо по стенам из `gen_maze.py`.

Ответ задачи про паука зависит от геометрии лабиринта, а геометрия
задана списком прямоугольников. Между одним и другим — десяток
проёмов, которые глазами не проверишь. Этот скрипт проходит путь
целиком: клетки → решётка коридоров → дерево → вероятности.

    python3 tools/check_maze.py

Ничего не меняет, только печатает.
"""

import sys
from fractions import Fraction
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from gen_maze import COLS, RECTS, ROWS  # noqa: E402
from glass_style import cells  # noqa: E402

STENY = cells(RECTS)

# Шаг решётки 10 клеток: стена 4 клетки, коридор 6. Отсюда левые/верхние
# края коридоров.
SHAG, TOLSHCHINA = 10, 4
SHIRINA = SHAG - TOLSHCHINA
STOLBTSY = list(range(TOLSHCHINA, COLS, SHAG))
RYADY = list(range(TOLSHCHINA, ROWS, SHAG))

# Какой проём в рамке какой выход. Ключ — (сторона, номер коридора).
VYHODY = {('left', 0): 'B', ('right', 0): 'A', ('top', 2): 'D', ('bottom', 4): 'C'}
VHOD = ('left', 1)


def svobodno(kletki):
    return all(
        0 <= c < COLS and 0 <= r < ROWS and (c, r) not in STENY for c, r in kletki
    )


def pryamougolnik(c0, c1, r0, r1):
    return [(c, r) for c in range(c0, c1) for r in range(r0, r1)]


def sobrat():
    """Решётка коридоров: узлы, рёбра между ними и проёмы в рамке."""
    rebra = set()
    for i in range(len(STOLBTSY) - 1):
        for j, r0 in enumerate(RYADY):
            most = pryamougolnik(STOLBTSY[i] + SHIRINA, STOLBTSY[i + 1], r0, r0 + SHIRINA)
            if svobodno(most):
                rebra.add(((i, j), (i + 1, j)))
    for i, c0 in enumerate(STOLBTSY):
        for j in range(len(RYADY) - 1):
            most = pryamougolnik(c0, c0 + SHIRINA, RYADY[j] + SHIRINA, RYADY[j + 1])
            if svobodno(most):
                rebra.add(((i, j), (i, j + 1)))

    proemy = {}
    for j, r0 in enumerate(RYADY):
        if svobodno(pryamougolnik(0, STOLBTSY[0], r0, r0 + SHIRINA)):
            proemy[('left', j)] = (0, j)
        if svobodno(pryamougolnik(STOLBTSY[-1] + SHIRINA, COLS, r0, r0 + SHIRINA)):
            proemy[('right', j)] = (len(STOLBTSY) - 1, j)
    for i, c0 in enumerate(STOLBTSY):
        if svobodno(pryamougolnik(c0, c0 + SHIRINA, 0, RYADY[0])):
            proemy[('top', i)] = (i, 0)
        if svobodno(pryamougolnik(c0, c0 + SHIRINA, RYADY[-1] + SHIRINA, ROWS)):
            proemy[('bottom', i)] = (i, len(RYADY) - 1)
    return rebra, proemy


def veroyatnosti(rebra, proemy):
    """Паук идёт от входа и на каждой развилке делит вероятность поровну.

    Назад он не поворачивает, поэтому в тупике застревает: такая доля
    вероятности не доходит никуда и считается отдельно.
    """
    napravleniya = {}
    for a, b in rebra:
        napravleniya.setdefault(a, set()).add(b)
        napravleniya.setdefault(b, set()).add(a)
    for storona, uzel in proemy.items():
        if storona in VYHODY:
            napravleniya.setdefault(uzel, set()).add(('выход', VYHODY[storona]))

    itog = {}
    tupiki = {}

    def idti(uzel, otkuda, p):
        dalshe = sorted(napravleniya[uzel] - {otkuda}, key=str)
        if not dalshe:
            tupiki[uzel] = tupiki.get(uzel, Fraction(0)) + p
            return
        for sled in dalshe:
            dolya = p / len(dalshe)
            if isinstance(sled, tuple) and sled[0] == 'выход':
                itog[sled[1]] = itog.get(sled[1], Fraction(0)) + dolya
            else:
                idti(sled, uzel, dolya)

    idti(proemy[VHOD], ('вход',), Fraction(1))
    return itog, tupiki


def schema(rebra, proemy):
    """Решётка коридоров в виде текстовой схемы."""
    stroki = []
    for j in range(len(RYADY)):
        ryad = ''
        for i in range(len(STOLBTSY)):
            ryad += 'O' + ('────' if ((i, j), (i + 1, j)) in rebra else '    ')
        sleva = proemy.get(('left', j))
        sprava = proemy.get(('right', j))
        metka = lambda s: VYHODY.get(s, 'ВХ' if s == VHOD else '??')  # noqa: E731
        # Слева поле в три знака, чтобы «ВХ─» и «B─» не сдвигали ряд.
        stroki.append(
            f'{(metka(("left", j)) + "─").rjust(3) if sleva else "   "}{ryad.rstrip()}'
            f'{"─" + metka(("right", j)) if sprava else ""}'
        )
        if j < len(RYADY) - 1:
            stroki.append(
                '   ' + ''.join(
                    ('│' if ((i, j), (i, j + 1)) in rebra else ' ') + '    '
                    for i in range(len(STOLBTSY))
                ).rstrip()
            )
    kraya = lambda storona: '   ' + ''.join(  # noqa: E731
        (VYHODY.get((storona, i), '?') if (storona, i) in proemy else ' ') + '    '
        for i in range(len(STOLBTSY))
    )
    return '\n'.join([kraya('top').rstrip()] + stroki + [kraya('bottom').rstrip()])


def main():
    rebra, proemy = sobrat()
    uzlov = len(STOLBTSY) * len(RYADY)
    print(f'сетка {COLS}×{ROWS} клеток, узлов {uzlov}, коридоров {len(rebra)}')
    print(f'проёмов в рамке: {len(proemy)} — {sorted(proemy)}')
    # В дереве рёбер на одно меньше, чем узлов. Если это не так, где-то
    # петля, и «на каждой развилке новый путь» перестаёт быть деревом.
    print(f'связный граф без петель: {len(rebra) == uzlov - 1}')
    print()
    print(schema(rebra, proemy))
    print()

    itog, tupiki = veroyatnosti(rebra, proemy)
    for v in sorted(itog):
        print(f'  выход {v}: {itog[v]} = {float(itog[v])}')
    zastryal = sum(tupiki.values())
    print(f'  застрял в тупике: {zastryal} = {float(zastryal)}')
    if tupiki:
        print(f'  тупиковые узлы: {sorted(tupiki)}')
    print(f'  сумма: {sum(itog.values()) + zastryal}')


if __name__ == '__main__':
    main()
