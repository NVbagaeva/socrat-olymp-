#!/usr/bin/env python3
"""Стеклянные картинки к главам ключевых методов задания №4.

Генерация (OpenAI, /v1/images/edits) → проверка прозрачности →
обрезка по контуру → экспорт WebP.

    python3 tools/metody4/gen_images.py            # все, у кого нет исходника
    python3 tools/metody4/gen_images.py metod-2    # одна, новая попытка
    python3 tools/metody4/gen_images.py --export   # только пересобрать WebP

Ключ API подставляет прокси сессии (network secret на api.openai.com):
заголовок Authorization скрипт не отправляет. Если запускать вне сессии,
задайте OPENAI_API_KEY — тогда заголовок добавится.

Образцы стиля (image[]): шапка №4, «куб и шар» №3, шапка №5 — переводятся
в PNG во временную папку. Сцены — scenes.json рядом.

Исходники PNG 1024×1024 — design-reference/zadanie-04/<имя>.png.
Экспорт:
  задачи    app/public/images/zadanie-04/primery/<имя>-360.webp, -180.webp
Картинки карточек (metod-N) здесь не экспортируются: исходник копируется
в app/assets/zadanie-04/metod-<id>.png, файлы собирает
app/scripts/build-shapka.mjs (как у карточек №5).
Журнал попыток — tools/metody4/zhurnal.json (переносится в
docs/plans/zadanie-04-metody.md).

Автоматически проверяется только прозрачность краёв. Нет ли на картинке
букв и цифр и соответствует ли сцена задаче — смотрится глазами; неудачную
перегенерировать: не больше 3 попыток на картинку.
"""

from __future__ import annotations

import base64
import json
import os
import subprocess
import sys
import tempfile
import threading
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
HERE = Path(__file__).resolve().parent
PUBLIC = ROOT / 'app' / 'public' / 'images'
SRC_DIR = ROOT / 'design-reference' / 'zadanie-04'
ZHURNAL = HERE / 'zhurnal.json'

MODEL = 'gpt-image-2.6-sunburst'
MAX_POPYTOK = 3
ZAPOLNENIE = 0.84  # доля стороны квадрата под объектом

STYLE = (
    'Use the reference images ONLY as a style reference (material, lighting, palette, render '
    'quality) — do not copy their objects. Create a NEW 3D render in exactly the same style: '
    'clear pale icy-blue glass with soft refraction and smooth bevels, crisp bright edges with a '
    'soft blue glow, subtle warm amber rim highlights on a few edges, soft studio light from the '
    'top left, gentle inner glow, premium minimal product-render look, not cartoonish. Some '
    'objects may be realistic and colored (mixed materials look stylish), the rest is blue glass. '
    'Fully transparent background: no backdrop, no floor, no ground shadow, no frame. No text, no '
    'letters, no numbers, no logos. Single composition centered, filling about 80% of the square, '
    'three-quarter view from slightly above. Scene: '
)

REFS = [
    ('worktree', 'app/public/images/zadanie-04/shapka-veroyatnost-prostaya.webp'),
    ('worktree', 'app/public/images/zadaniya/3/kub-shar-560.webp'),
    # Шапка №5 — в ветке claude/shapki-steklo-kartinki, пока её нет в main.
    ('branch', 'app/public/images/shapki/zadanie-05-560.webp'),
]
REF_BRANCH = 'origin/claude/shapki-steklo-kartinki'


def refs_png(tmp: Path) -> list[Path]:
    out = []
    for i, (where, rel) in enumerate(REFS):
        src = ROOT / rel
        if not src.exists() and where == 'branch':
            data = subprocess.run(
                ['git', '-C', str(ROOT), 'show', f'{REF_BRANCH}:{rel}'],
                check=True, capture_output=True,
            ).stdout
            src = tmp / f'ref{i}.webp'
            src.write_bytes(data)
        png = tmp / f'ref{i}.png'
        Image.open(src).convert('RGBA').save(png)
        out.append(png)
    return out


def generate(name: str, scene: str, refs: list[Path], out: Path) -> None:
    cmd = [
        'curl', '-sS', '--max-time', '580', 'https://api.openai.com/v1/images/edits',
        '-F', f'model={MODEL}',
        '--form-string', f'prompt={STYLE}{scene}',
        '-F', 'size=1024x1024', '-F', 'quality=high',
        '-F', 'background=transparent', '-F', 'output_format=png',
    ]
    key = os.environ.get('OPENAI_API_KEY')
    if key:
        cmd += ['-H', f'Authorization: Bearer {key}']
    for r in refs:
        cmd += ['-F', f'image[]=@{r}']
    res = subprocess.run(cmd, capture_output=True, text=True)
    try:
        data = json.loads(res.stdout)
        out.write_bytes(base64.b64decode(data['data'][0]['b64_json']))
    except (KeyError, IndexError, json.JSONDecodeError) as err:
        raise RuntimeError(f'{name}: {res.stdout[:300]} {res.stderr[:200]}') from err


def kraya_prozrachny(im: Image.Image, polosa: int = 4, porog: int = 8) -> bool:
    """По краям квадрата нет непрозрачных пикселей."""
    a = im.getchannel('A')
    w, h = a.size
    for box in ((0, 0, w, polosa), (0, h - polosa, w, h), (0, 0, polosa, h), (w - polosa, 0, w, h)):
        if a.crop(box).getextrema()[1] > porog:
            return False
    return True


def obrezat(im: Image.Image) -> Image.Image:
    """Обрезка по контуру и квадрат, где объект занимает ~84 % стороны, по центру."""
    a = im.getchannel('A').point(lambda v: 255 if v > 8 else 0)
    bbox = a.getbbox()
    if bbox is None:
        raise RuntimeError('пустая картинка')
    obj = im.crop(bbox)
    side = round(max(obj.size) / ZAPOLNENIE)
    canvas = Image.new('RGBA', (side, side), (0, 0, 0, 0))
    canvas.paste(obj, ((side - obj.width) // 2, (side - obj.height) // 2))
    return canvas


def export(name: str) -> None:
    if name.startswith('metod-'):
        # Карточки методов собирает app/scripts/build-shapka.mjs.
        print(f'{name}: скопируйте исходник в app/assets/zadanie-04/ и запустите pnpm build:shapka')
        return
    src = SRC_DIR / f'{name}.png'
    im = obrezat(Image.open(src).convert('RGBA'))
    folder, sizes = PUBLIC / 'zadanie-04' / 'primery', (360, 180)
    folder.mkdir(parents=True, exist_ok=True)
    for s in sizes:
        im.resize((s, s), Image.LANCZOS).save(
            folder / f'{name}-{s}.webp', 'WEBP', quality=90, method=6, exact=True,
        )


def main(argv: list[str]) -> int:
    scenes: dict[str, str] = json.loads((HERE / 'scenes.json').read_text())
    zhurnal: dict = json.loads(ZHURNAL.read_text()) if ZHURNAL.exists() else {}
    SRC_DIR.mkdir(parents=True, exist_ok=True)

    if argv[:1] == ['--export']:
        for name in scenes:
            if (SRC_DIR / f'{name}.png').exists():
                export(name)
        return 0

    names = argv or [n for n in scenes if not (SRC_DIR / f'{n}.png').exists()]
    lock = threading.Lock()

    def odna(name: str, refs: list[Path], tmp: str) -> None:
        with lock:
            rec = zhurnal.setdefault(name, {'prompt': STYLE + scenes[name], 'popytok': 0})
        while rec['popytok'] < MAX_POPYTOK:
            with lock:
                rec['popytok'] += 1
                k = rec['popytok']
            out = Path(tmp) / f'{name}-{k}.png'
            try:
                generate(name, scenes[name], refs, out)
            except RuntimeError as err:
                print(f'{name}: ошибка запроса — {err}', flush=True)
                continue
            im = Image.open(out).convert('RGBA')
            if kraya_prozrachny(im):
                im.save(SRC_DIR / f'{name}.png')
                export(name)
                print(f'{name}: готово с попытки {k}', flush=True)
                break
            print(f'{name}: по краям непрозрачные пиксели, ещё попытка', flush=True)
        else:
            print(f'{name}: {MAX_POPYTOK} попытки не прошли проверку', flush=True)
        with lock:
            ZHURNAL.write_text(json.dumps(zhurnal, ensure_ascii=False, indent=1))

    with tempfile.TemporaryDirectory() as tmp:
        refs = refs_png(Path(tmp))
        # Запросы идут параллельно: одна картинка генерируется минуту-две.
        with ThreadPoolExecutor(max_workers=5) as pool:
            list(pool.map(lambda n: odna(n, refs, tmp), names))
    return 0


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
