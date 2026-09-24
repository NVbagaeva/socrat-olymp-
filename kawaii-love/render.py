#!/usr/bin/env python3
"""
Покадровый рендер мультика index.html в MP4 (H.264, 1080×1920, 30 fps).

Как это работает:
  1. Playwright открывает index.html?render=1 в headless-Chromium с окном 1080×1920.
  2. Для каждого кадра вызывается window.__anim.seek(t) — GSAP ставит анимацию
     ровно на время t, поэтому кадры не зависят от скорости машины.
  3. Скриншот кадра (PNG) отправляется в stdin ffmpeg, который собирает MP4.

Запуск:  python render.py                      # -> out.mp4 рядом со скриптом
         python render.py -o love.mp4 --crf 16 # другое имя и качество
"""
import argparse
import os
import shutil
import subprocess
import sys
import time
from pathlib import Path

from playwright.sync_api import sync_playwright

HERE = Path(__file__).resolve().parent


def find_ffmpeg(explicit: str | None) -> str:
    """ffmpeg из аргумента, из PATH или из пакета imageio-ffmpeg (запасной вариант)."""
    if explicit:
        return explicit
    found = shutil.which("ffmpeg")
    if found:
        return found
    try:
        import imageio_ffmpeg  # pip install imageio-ffmpeg
        return imageio_ffmpeg.get_ffmpeg_exe()
    except ImportError:
        sys.exit("ffmpeg не найден. Установите ffmpeg или выполните: pip install imageio-ffmpeg")


def main() -> None:
    ap = argparse.ArgumentParser(description="Рендер index.html в MP4 через Playwright + ffmpeg")
    ap.add_argument("--html", default=str(HERE / "index.html"), help="путь к index.html")
    ap.add_argument("-o", "--out", default=str(HERE / "out.mp4"), help="итоговый MP4")
    ap.add_argument("--fps", type=int, default=30, help="частота кадров видео")
    ap.add_argument("--width", type=int, default=1080)
    ap.add_argument("--height", type=int, default=1920)
    ap.add_argument("--crf", type=int, default=18, help="качество H.264 (меньше = лучше, 18 — почти без потерь)")
    ap.add_argument("--duration", type=float, default=None, help="принудительная длительность, с (по умолчанию — из анимации)")
    ap.add_argument("--ffmpeg", default=None, help="путь к ffmpeg (по умолчанию ищется в PATH)")
    ap.add_argument("--warmup", type=float, default=1.5, help="секунды ожидания загрузки шрифтов и GSAP")
    ap.add_argument("--chromium", default=None, help="путь к своему Chromium/Chrome (по умолчанию браузер Playwright)")
    args = ap.parse_args()

    html = Path(args.html).resolve()
    if not html.exists():
        sys.exit(f"Файл не найден: {html}")
    ffmpeg = find_ffmpeg(args.ffmpeg)
    out = Path(args.out).resolve()

    with sync_playwright() as p:
        browser = p.chromium.launch(executable_path=args.chromium) if args.chromium else p.chromium.launch()
        page = browser.new_page(viewport={"width": args.width, "height": args.height}, device_scale_factor=1)
        page.goto(html.as_uri() + "?render=1", wait_until="load")
        # ждём GSAP, шрифты и первый кадр
        page.wait_for_function("window.__anim !== undefined", timeout=30_000)
        duration = page.evaluate("window.__anim.ready.then(() => window.__anim.duration())")
        time.sleep(args.warmup)
        if args.duration:
            duration = args.duration
        total = int(round(duration * args.fps))
        print(f"Длительность {duration:.2f} с, {total} кадров при {args.fps} fps -> {out}")

        cmd = [
            ffmpeg, "-y", "-loglevel", "error", "-stats",
            "-f", "image2pipe", "-framerate", str(args.fps), "-i", "-",
            "-c:v", "libx264", "-preset", "medium", "-crf", str(args.crf),
            "-pix_fmt", "yuv420p", "-movflags", "+faststart",
            "-vf", f"scale={args.width}:{args.height}",
            str(out),
        ]
        proc = subprocess.Popen(cmd, stdin=subprocess.PIPE)
        started = time.time()
        try:
            for i in range(total):
                t = i / args.fps
                page.evaluate("t => window.__anim.seek(t)", t)
                proc.stdin.write(page.screenshot(type="png"))
                if i % args.fps == 0 or i == total - 1:
                    done = (i + 1) / total
                    eta = (time.time() - started) / done * (1 - done)
                    print(f"\r  кадр {i + 1}/{total}  ({done * 100:5.1f}%)  осталось ~{eta:4.0f} с", end="", flush=True)
        finally:
            proc.stdin.close()
            code = proc.wait()
            browser.close()
        print()
        if code != 0:
            sys.exit(f"ffmpeg завершился с ошибкой {code}")
        print(f"Готово: {out}  ({os.path.getsize(out) / 1e6:.1f} МБ)")


if __name__ == "__main__":
    main()
