"""Стиль «стекло» для иллюстраций-лабиринтов.

Здесь лежит всё, что повторяется от картинки к картинке: градиенты,
фильтры, символы звезды и паука, сборка контура стен из клеток и
разметка подписей. Сама иллюстрация задаётся только двумя списками —
`rects` (прямоугольники стен в клетках) и `labels` (подписи), — и
передаётся в `kartinka()`.

Пример нового рисунка в том же стиле:

    from glass_style import kartinka, P

    RECTS = [(0, 23, 0, 3), ...]
    LABELS = [('Вход', P(-1.2, 17), 'end'), ...]
    open('out.svg', 'w').write(kartinka(RECTS, LABELS, cols=54, rows=44))

Геометрия стен из `rects` ни во что не вмешивается: модуль только
обводит занятые клетки и раскрашивает получившийся контур.
"""

# ── Сетка ───────────────────────────────────────────────────────────
# U — сторона клетки в единицах SVG, OX/OY — поля вокруг сетки.
# От них зависит положение подписей, поэтому менять их нельзя без
# пересчёта координат в `labels`.
U = 12
OX = 130
OY = 80


def P(c, r):
    """Клетка сетки → точка в координатах SVG."""
    return (OX + c * U, OY + r * U)


# ── Контур стен ─────────────────────────────────────────────────────


def cells(rects):
    """Прямоугольники (c0, c1, r0, r1) включительно → множество клеток."""
    w = set()
    for c0, c1, r0, r1 in rects:
        for c in range(c0, c1 + 1):
            for r in range(r0, r1 + 1):
                w.add((c, r))
    return w


def boundary_loops(w):
    """Границы фигуры из клеток — набор замкнутых контуров.

    Каждая клетка обходится по часовой стрелке; внутренние рёбра
    встречаются дважды в противоположных направлениях и взаимно
    уничтожаются, остаются только рёбра на границе. Из них собираются
    циклы. Внешний контур и дырки внутри получаются разными циклами,
    поэтому заливать результат надо с `fill-rule="evenodd"`.
    """
    edges = {}
    for (c, r) in w:
        for a, b in (
            ((c, r), (c + 1, r)),
            ((c + 1, r), (c + 1, r + 1)),
            ((c + 1, r + 1), (c, r + 1)),
            ((c, r + 1), (c, r)),
        ):
            if (b, a) in edges:
                del edges[(b, a)]
            else:
                edges[(a, b)] = True
    nxt = {}
    for a, b in edges:
        nxt.setdefault(a, []).append(b)
    loops = []
    used = set()
    for e in list(edges):
        if e in used:
            continue
        a, b = e
        loop = [a]
        used.add(e)
        cur = b
        while cur != loop[0]:
            loop.append(cur)
            for n in nxt[cur]:
                if (cur, n) not in used:
                    used.add((cur, n))
                    cur = n
                    break
        loops.append(loop)
    return loops


def simplify(loop):
    """Выбрасывает точки на прямых участках, оставляя только углы."""
    out = []
    n = len(loop)
    for i in range(n):
        p, q, r = loop[i - 1], loop[i], loop[(i + 1) % n]
        if (q[0] - p[0], q[1] - p[1]) != (r[0] - q[0], r[1] - q[1]):
            out.append(q)
    return out


def path_d(loops):
    """Контуры в клетках → атрибут `d` одного SVG-пути."""
    d = []
    for lp in loops:
        pts = [P(*v) for v in simplify(lp)]
        d.append('M' + ' L'.join(f'{x},{y}' for x, y in pts) + ' Z')
    return ' '.join(d)


# ── Подписи ─────────────────────────────────────────────────────────

# Математические буквы набираются не Inter, а антиквой курсивом — как
# в учебнике и в условии задачи. Стек повторяет тот, что принят в
# проекте для формул.
FONT_MATH = 'Latin Modern Roman, Cambria Math, Times New Roman, serif'
FONT_SANS = 'Inter, Segoe UI, Arial, Helvetica, sans-serif'


def _podpis(t):
    """«Выход D» → «Выход» гротеском и «D» математическим курсивом.

    Делится по последнему пробелу: слева слово русского текста, справа
    обозначение. Подпись без пробела («Вход») остаётся как есть.
    """
    if ' ' in t:
        w, l = t.rsplit(' ', 1)
        return (
            f'{w} <tspan font-family="{FONT_MATH}" font-style="italic" '
            f'font-weight="400" font-size="26">{l}</tspan>'
        )
    return t


# ── Сборка картинки ─────────────────────────────────────────────────


def _chastitsy(cols, rows, seed):
    """Тёплая и холодная пыль вокруг лабиринта."""
    import random

    random.seed(seed)
    parts = []
    for _ in range(60):
        x = random.uniform(OX - 30, OX + cols * U + 30)
        y = random.uniform(OY - 30, OY + rows * U + 30)
        if random.random() < 0.5:
            parts.append(
                f'<circle cx="{x:.0f}" cy="{y:.0f}" r="{random.uniform(1.2, 3.2):.1f}" '
                f'fill="#ffb14a" opacity="{random.uniform(.4, .9):.2f}" filter="url(#soft)"/>'
            )
        else:
            parts.append(
                f'<circle cx="{x:.0f}" cy="{y:.0f}" r="{random.uniform(1, 2.5):.1f}" '
                f'fill="#bfe0ff" opacity="{random.uniform(.5, 1):.2f}" filter="url(#soft)"/>'
            )
    return ''.join(parts)


def _nogi():
    """Восемь лап паука — путь внутри символа."""
    return ''.join(
        f'<path d="M0,0 q{dx * 0.5:.1f},{dy * 0.5 - 4:.1f} {dx},{dy}" />'
        for dx, dy in [
            (-14, -9), (-15, -2), (-14, 6), (-11, 12),
            (14, -9), (15, -2), (14, 6), (11, 12),
        ]
    )


def defs():
    """Градиенты, фильтры и символы — общая часть всех картинок стиля.

    `clipwall` подставляется вызывающим кодом: он зависит от контура
    конкретной картинки, поэтому здесь оставлено место под `{d}`.
    """
    return f'''  <linearGradient id="glass" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="#7fb4f4"/>
    <stop offset="0.3" stop-color="#4a8ceb"/>
    <stop offset="0.55" stop-color="#2f6fd8"/>
    <stop offset="0.8" stop-color="#2358bd"/>
    <stop offset="1" stop-color="#4d8fe8"/>
  </linearGradient>
  <linearGradient id="sheen" x1="0" y1="0" x2="1" y2="0.3">
    <stop offset="0" stop-color="#ffffff" stop-opacity="0.22"/>
    <stop offset="0.5" stop-color="#ffffff" stop-opacity="0"/>
    <stop offset="1" stop-color="#ffffff" stop-opacity="0.15"/>
  </linearGradient>
  <radialGradient id="warm" cx="0.5" cy="0.5" r="0.5">
    <stop offset="0" stop-color="#ffb347" stop-opacity="0.9"/>
    <stop offset="1" stop-color="#ff8c1a" stop-opacity="0"/>
  </radialGradient>
  <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
    <feGaussianBlur stdDeviation="3.5" result="b"/>
    <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
  </filter>
  <filter id="bigglow" x="-30%" y="-30%" width="160%" height="160%">
    <feGaussianBlur stdDeviation="9"/>
  </filter>
  <filter id="soft"><feGaussianBlur stdDeviation="0.8"/></filter>
  <filter id="inner" x="-10%" y="-10%" width="120%" height="120%">
    <feGaussianBlur stdDeviation="6"/>
  </filter>'''


def simvoly():
    """Символы `star` и `spider` — их вставляют через `<use>`."""
    return f'''  <symbol id="star" overflow="visible">
    <g fill="#fff3d6" filter="url(#glow)">
      <path d="M0,-11 L2,-2 L11,0 L2,2 L0,11 L-2,2 L-11,0 L-2,-2 Z" fill="#fff8e8"/>
      <circle r="2.2" fill="#ffd28a"/>
    </g>
  </symbol>
  <symbol id="spider" overflow="visible">
    <g stroke="#ff9a2e" stroke-width="2.2" fill="none" stroke-linecap="round" filter="url(#glow)">{_nogi()}</g>
    <ellipse rx="7.5" ry="8.5" fill="#ff8c1a" filter="url(#glow)"/>
    <ellipse cx="-1" cy="-3" rx="3" ry="3.2" fill="#ffe0b0" opacity="0.8"/>
    <circle cy="-11" r="4" fill="#ff8c1a" filter="url(#glow)"/>
  </symbol>'''


def kartinka(rects, labels, cols, rows, sparks=(), spider=None, seed=7):
    """Собирает готовый SVG.

    rects   — стены в клетках, (c0, c1, r0, r1) включительно;
    labels  — подписи, (текст, точка, text-anchor);
    cols/rows — размер сетки в клетках;
    sparks  — клетки, где стоят блёстки;
    spider  — клетка с пауком или None;
    seed    — зерно для пыли, чтобы картинка была воспроизводима.
    """
    d = path_d(boundary_loops(cells(rects)))
    w = OX * 2 + cols * U
    h = OY * 2 + rows * U

    bleski = ''.join(f'<use href="#star" x="{x}" y="{y}"/>' for x, y in (P(*s) for s in sparks))
    pauk = ''
    if spider is not None:
        sx, sy = P(*spider)
        pauk = f'<use href="#spider" x="{sx:.0f}" y="{sy:.0f}"/>'
    lab = ''.join(
        f'<text x="{x:.0f}" y="{y:.0f}" text-anchor="{a}" '
        f'dominant-baseline="middle">{_podpis(t)}</text>'
        for t, (x, y), a in labels
    )

    return f'''<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 {w} {h}" width="{w}" height="{h}" font-family="{FONT_SANS}">
<defs>
{defs()}
  <clipPath id="clipwall"><path d="{d}" clip-rule="evenodd"/></clipPath>
{simvoly()}
</defs>

<!-- ambient warm glow behind the maze -->


<!-- particles -->
<g>{_chastitsy(cols, rows, seed)}</g>

<!-- outer orange halo of walls -->
<path d="{d}" fill="none" stroke="#ffa53a" stroke-width="6" stroke-linejoin="round" opacity="0.45" filter="url(#bigglow)" fill-rule="evenodd"/>

<!-- glass body -->
<path d="{d}" fill="url(#glass)" fill-rule="evenodd" stroke="none"/>

<!-- inner bevel: light sheen on inside edges -->
<g clip-path="url(#clipwall)">
  <path d="{d}" fill="none" stroke="#123c8f" stroke-width="10" opacity="0.35" filter="url(#inner)" fill-rule="evenodd" transform="translate(3,3)"/>
  <ellipse cx="{OX + cols * U * 0.3:.0f}" cy="{OY + rows * U * 0.25:.0f}" rx="{cols * U * 0.35:.0f}" ry="{rows * U * 0.3:.0f}" fill="#ffffff" opacity="0.10" filter="url(#bigglow)"/>
  <ellipse cx="{OX + cols * U * 0.75:.0f}" cy="{OY + rows * U * 0.8:.0f}" rx="{cols * U * 0.25:.0f}" ry="{rows * U * 0.25:.0f}" fill="#ffc37a" opacity="0.14" filter="url(#bigglow)"/>
  <path d="{d}" fill="none" stroke="#ffffff" stroke-width="9" opacity="0.16" filter="url(#inner)" fill-rule="evenodd"/>
  <path d="{d}" fill="url(#sheen)" fill-rule="evenodd"/>
  <path d="{d}" fill="none" stroke="#ffffff" stroke-width="2" opacity="0.5" stroke-linejoin="round" fill-rule="evenodd"
        style="stroke-dasharray:0" transform="translate(1.2,1.2)"/>
</g>

<!-- warm rim light -->
<path d="{d}" fill="none" stroke="#ffb347" stroke-width="2.4" stroke-linejoin="round" filter="url(#glow)" fill-rule="evenodd"/>
<path d="{d}" fill="none" stroke="#fff1d6" stroke-width="0.8" stroke-linejoin="round" opacity="0.9" fill-rule="evenodd"/>

<!-- sparkles -->
<g>{bleski}</g>

<!-- spider at the entrance -->
{pauk}

<!-- labels -->
<g font-size="22" font-weight="500" fill="#000000">{lab}</g>
</svg>'''
