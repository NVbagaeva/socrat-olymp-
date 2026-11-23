#!/usr/bin/env python3
"""Картинки-иллюстрации к сюжетам задач первой части.

Источник правды — tools/kartinki-zadach.json: на каждый сюжет номер
задания (ЕГЭ-2027), ключ сюжета, размер, сюжет промпта (по-английски)
и alt по-русски. План и журнал — docs/plans/kartinki-k-zadacham.md.

    python3 tools/kartinki_zadach.py gen <ключ> [<ключ> ...]   # сгенерировать (новая попытка)
    python3 tools/kartinki_zadach.py export <ключ> [...]       # проверить и выгрузить последнюю попытку
    python3 tools/kartinki_zadach.py lenta <файл.html> <ключ> [...]  # обзор лентой

Генерация: OpenAI Images API, /v1/images/edits; образцы стиля сайта
идут в image[] только как образец материала и света. Ключ API в
скрипте не используется и не читается: запросы идут через прокси
окружения, который подставляет ключ сам (или curl берёт заголовок из
OPENAI_API_KEY, если переменная задана — значение не печатается).

Выход:
  design-reference/zadachi/<номер>/<ключ>.png             — исходник 1024 (после выравнивания)
  design-reference/zadachi/<номер>/raw/<ключ>-<n>.png      — попытки как пришли из API
  app/public/images/zadachi/<номер>/<ключ>-560.webp, -280.webp
  design-reference/zadachi/zhurnal.jsonl                   — журнал запросов (usage, без ключа)
"""

from __future__ import annotations

import base64
import json
import os
import subprocess
import sys
import tempfile
import time
from pathlib import Path

from PIL import Image

KOREN = Path(__file__).resolve().parent.parent
SPEC = KOREN / 'tools' / 'kartinki-zadach.json'
PUBLIC = KOREN / 'app' / 'public' / 'images' / 'zadachi'
REF_OUT = KOREN / 'design-reference' / 'zadachi'
ZHURNAL = REF_OUT / 'zhurnal.jsonl'

MODEL = 'gpt-image-2.6-sunburst'
OBRAZCY = [
    'app/public/images/zadaniya/3/kub-shar-560.webp',
    'app/public/images/zadanie-04/shapka-veroyatnost-prostaya.webp',
    'app/public/images/zadanie-01/shapka-planimetriya-768.png',
]
STIL = (
    'Use the reference images ONLY as a style reference (material, lighting, palette, render '
    'quality) — do not copy their objects. Create a NEW 3D render in exactly the same style: clear '
    'pale icy-blue glass with soft refraction and smooth bevels, crisp bright edges with a soft blue '
    'glow, subtle warm amber rim highlights on a few edges, soft studio light from the top left, '
    'gentle inner glow, premium minimal product-render look, not cartoonish. Some objects may be '
    'realistic and colored (mixed materials look stylish), the rest is blue glass. Fully transparent '
    'background: no backdrop, no floor, no ground shadow, no frame. No text, no letters, no numbers, '
    'no logos. Single composition centered, filling about 80% of the square, three-quarter view from '
    'slightly above. Scene: '
)
DOLYA = 0.84  # какую долю квадрата занимает объект по большей стороне
KRAY = 6  # ширина полосы по краю, где не должно быть непрозрачных пикселей


def spec() -> dict[str, dict]:
    return {s['key']: s for s in json.loads(SPEC.read_text())}


def obrazcy_png(tmp: Path) -> list[Path]:
    out = []
    for i, f in enumerate(OBRAZCY):
        im = Image.open(KOREN / f).convert('RGBA')
        im.thumbnail((768, 768))
        p = tmp / f'obrazec-{i}.png'
        im.save(p)
        out.append(p)
    return out


def raw_dir(s: dict) -> Path:
    return REF_OUT / str(s['nomer']) / 'raw'


def popytki(s: dict) -> list[Path]:
    d = raw_dir(s)
    return sorted(d.glob(f"{s['key']}-*.png"), key=lambda p: int(p.stem.rsplit('-', 1)[1]))


def gen(s: dict) -> Path:
    n = len(popytki(s)) + 1
    raw_dir(s).mkdir(parents=True, exist_ok=True)
    out = raw_dir(s) / f"{s['key']}-{n}.png"
    prompt = STIL + s['scene']
    with tempfile.TemporaryDirectory() as t:
        tmp = Path(t)
        cmd = ['curl', '-sS', '--max-time', '600', 'https://api.openai.com/v1/images/edits']
        key = os.environ.get('OPENAI_API_KEY')
        if key:
            hdr = tmp / 'h'
            hdr.write_text(f'Authorization: Bearer {key}\n')
            cmd += ['-H', f'@{hdr}']
        cmd += ['--form-string', f'model={MODEL}', '--form-string', f'prompt={prompt}']
        for p in obrazcy_png(tmp):
            cmd += ['-F', f'image[]=@{p};type=image/png']
        for k, v in [('size', s.get('size', '1024x1024')), ('quality', 'high'),
                     ('background', 'transparent'), ('output_format', 'png'), ('n', '1')]:
            cmd += ['--form-string', f'{k}={v}']
        t0 = time.time()
        r = subprocess.run(cmd, capture_output=True, text=True)
    try:
        d = json.loads(r.stdout)
    except json.JSONDecodeError:
        raise SystemExit(f"{s['key']}: не JSON: {r.stdout[:300]} {r.stderr[:300]}")
    if 'data' not in d:
        raise SystemExit(f"{s['key']}: ошибка API: {json.dumps(d.get('error'), ensure_ascii=False)}")
    out.write_bytes(base64.b64decode(d['data'][0]['b64_json']))
    ZHURNAL.parent.mkdir(parents=True, exist_ok=True)
    with ZHURNAL.open('a') as f:
        f.write(json.dumps({'key': s['key'], 'nomer': s['nomer'], 'popytka': n, 'fayl': str(out.relative_to(KOREN)),
                            'model': MODEL, 'size': s.get('size', '1024x1024'), 'sek': round(time.time() - t0),
                            'usage': d.get('usage'), 'scene': s['scene']}, ensure_ascii=False) + '\n')
    print(f"{s['key']}: попытка {n} → {out.relative_to(KOREN)}  usage={d.get('usage')}")
    return out


def proverka(im: Image.Image) -> list[str]:
    """Проблемы картинки, пришедшей из API: непрозрачный фон по краям."""
    a = im.getchannel('A')
    w, h = im.size
    bad = []
    polosy = [(0, 0, w, KRAY), (0, h - KRAY, w, h), (0, 0, KRAY, h), (w - KRAY, 0, w, h)]
    nepr = sum(sum(1 for v in a.crop(b).tobytes() if v > 40) for b in polosy)
    if nepr > 0:
        bad.append(f'по краям {nepr} непрозрачных пикселей')
    if a.getextrema()[0] > 40:
        bad.append('фон непрозрачный')
    return bad


def vyrovnyat(im: Image.Image, storona: int = 1024) -> Image.Image:
    a = im.getchannel('A').point(lambda v: 255 if v > 8 else 0)
    bbox = a.getbbox()
    obj = im.crop(bbox)
    k = storona * DOLYA / max(obj.size)
    obj = obj.resize((max(1, round(obj.width * k)), max(1, round(obj.height * k))), Image.LANCZOS)
    kv = Image.new('RGBA', (storona, storona), (0, 0, 0, 0))
    kv.alpha_composite(obj, ((storona - obj.width) // 2, (storona - obj.height) // 2))
    return kv


def export(s: dict, fayl: Path | None = None) -> list[str]:
    p = fayl or popytki(s)[-1]
    im = Image.open(p).convert('RGBA')
    bad = proverka(im)
    kv = vyrovnyat(im)
    (REF_OUT / str(s['nomer'])).mkdir(parents=True, exist_ok=True)
    kv.save(REF_OUT / str(s['nomer']) / f"{s['key']}.png", optimize=True)
    pub = PUBLIC / str(s['nomer'])
    pub.mkdir(parents=True, exist_ok=True)
    for r in (560, 280):
        kv.resize((r, r), Image.LANCZOS).save(pub / f"{s['key']}-{r}.webp", 'WEBP', quality=86, method=6)
    print(f"{s['key']}: {p.name} → {pub.relative_to(KOREN)}/{s['key']}-560|280.webp" + (f'  ПРОБЛЕМЫ: {bad}' if bad else '  ок'))
    return bad


def lenta(html: Path, keys: list[str]) -> None:
    sp = spec()
    obr = ''.join(f'<figure><img src="{KOREN / f}"><figcaption>образец</figcaption></figure>' for f in OBRAZCY)
    kart = ''.join(
        f'<figure><img src="{PUBLIC / str(sp[k]["nomer"]) / (k + "-560.webp")}">'
        f'<figcaption>№{sp[k]["nomer"]} · {k}<br>{sp[k]["alt"]}</figcaption></figure>' for k in keys)
    css = ('body{margin:0;font:14px system-ui}section{display:flex;flex-wrap:wrap;gap:16px;padding:20px}'
           'figure{margin:0;width:240px}img{width:240px;height:240px;object-fit:contain;border-radius:12px;'
           'outline:1px dashed rgba(127,127,127,.3)}figcaption{font-size:12px;margin-top:6px}'
           '.svet{background:#f6f8fb;color:#123}.tma{background:#0e1420;color:#dfe8f5}h2{margin:0;padding:16px 20px 0}')
    html.write_text(f'<!doctype html><meta charset=utf-8><style>{css}</style>'
                    f'<div class=svet><h2>Светлый фон</h2><section>{obr}{kart}</section></div>'
                    f'<div class=tma><h2>Тёмный фон</h2><section>{obr}{kart}</section></div>')


def main() -> None:
    cmd, *rest = sys.argv[1:]
    sp = spec()
    if cmd == 'gen':
        for k in rest:
            gen(sp[k])
    elif cmd == 'export':
        for k in rest:
            export(sp[k])
    elif cmd == 'lenta':
        lenta(Path(rest[0]), rest[1:])
    else:
        raise SystemExit(__doc__)


if __name__ == '__main__':
    main()
