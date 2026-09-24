#!/usr/bin/env python3
"""
Покадровый детерминированный рендер 3D-мультика index.html в MP4.

Для каждого кадра k вызывается window.renderFrame(k / fps): страница выставляет
всю сцену (позы, камеру, частицы, облачка) ровно на это время и рисует кадр.
Скриншот 1080×1920 уходит в ffmpeg → H.264, CRF 18, 30 fps. Ни один кадр не
пропускается и не зависит от скорости компьютера.

Примеры:
  python render.py                          # весь мультик → out.mp4
  python render.py --workers 3              # параллельно в 3 браузерах (быстрее на многоядерных CPU)
  python render.py --start 8 --end 12 -o test.mp4   # только кусок, для проверки
  python render.py --gpu                    # окно браузера с видеокартой (намного быстрее)
"""
import argparse
import math
import os
import shutil
import subprocess
import sys
import tempfile
import time
from multiprocessing import Process
from pathlib import Path

from playwright.sync_api import sync_playwright

HERE = Path(__file__).resolve().parent
W, H = 1080, 1920


def find_ffmpeg(explicit):
    if explicit:
        return explicit
    if shutil.which("ffmpeg"):
        return shutil.which("ffmpeg")
    try:
        import imageio_ffmpeg
        return imageio_ffmpeg.get_ffmpeg_exe()
    except ImportError:
        sys.exit("ffmpeg не найден: установите ffmpeg или выполните  pip install imageio-ffmpeg")


def open_page(p, args):
    """Открывает мультик в режиме рендера (?render=1) и ждёт загрузки шрифтов и шейдеров."""
    flags = ["--ignore-gpu-blocklist", "--enable-unsafe-swiftshader"]
    if args.gpu:
        flags += ["--enable-gpu", "--use-angle=default"]
    launch = dict(headless=not args.gpu, args=flags)
    if args.chromium:
        launch["executable_path"] = args.chromium
    browser = p.chromium.launch(**launch)
    page = browser.new_page(viewport={"width": W, "height": H}, device_scale_factor=1)
    errors = []
    page.on("pageerror", lambda e: errors.append(str(e)))
    url = args.url or (Path(args.html).resolve().as_uri())
    page.goto(url + ("&" if "?" in url else "?") + "render=1", wait_until="load", timeout=120_000)
    page.wait_for_function("window.__ready !== undefined", timeout=120_000)
    page.evaluate("window.__ready")
    if errors:
        sys.exit("Ошибка на странице: " + errors[0])
    return browser, page


def grab(page, t):
    """Выставить сцену на время t, дождаться, пока кадр попадёт на экран, и снять его."""
    page.evaluate(
        "async t => { window.renderFrame(t); await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))); }",
        t,
    )
    return page.screenshot(type="png", clip={"x": 0, "y": 0, "width": W, "height": H})


def worker(args, frames, outdir, wid):
    """Отдельный браузер рендерит свою часть кадров в PNG (для --workers > 1)."""
    with sync_playwright() as p:
        browser, page = open_page(p, args)
        for n, k in enumerate(frames):
            (outdir / f"{k:05d}.png").write_bytes(grab(page, k / args.fps))
            if wid == 0 and n % 10 == 0:
                done = len(list(outdir.glob("*.png")))
                print(f"\r  готово кадров: {done}", end="", flush=True)
        browser.close()


def main():
    ap = argparse.ArgumentParser(description="Рендер 3D-мультика в MP4 (Playwright + ffmpeg)")
    ap.add_argument("--html", default=str(HERE / "index.html"), help="путь к index.html")
    ap.add_argument("--url", default=None, help="вместо --html: адрес страницы (например, с локального сервера)")
    ap.add_argument("-o", "--out", default=str(HERE / "out.mp4"), help="итоговый MP4")
    ap.add_argument("--fps", type=int, default=30)
    ap.add_argument("--crf", type=int, default=18)
    ap.add_argument("--start", type=float, default=0.0, help="с какой секунды")
    ap.add_argument("--end", type=float, default=None, help="до какой секунды (по умолчанию — до конца)")
    ap.add_argument("--workers", type=int, default=1, help="сколько браузеров рендерят параллельно")
    ap.add_argument("--gpu", action="store_true", help="рендер в окне браузера с аппаратной видеокартой")
    ap.add_argument("--chromium", default=None, help="путь к своему Chrome/Chromium")
    ap.add_argument("--ffmpeg", default=None, help="путь к ffmpeg")
    args = ap.parse_args()

    ffmpeg = find_ffmpeg(args.ffmpeg)
    out = Path(args.out).resolve()

    with sync_playwright() as p:
        browser, page = open_page(p, args)
        duration = page.evaluate("window.DURATION")
        end = min(args.end or duration, duration)
        frames = list(range(math.floor(args.start * args.fps), math.ceil(end * args.fps)))
        print(f"Мультик {duration:.1f} с → кадры {frames[0]}…{frames[-1]} ({len(frames)} шт., {args.fps} fps) → {out}")
        encode = [ffmpeg, "-y", "-loglevel", "error", "-framerate", str(args.fps)]
        tail = ["-c:v", "libx264", "-preset", "slow", "-crf", str(args.crf), "-pix_fmt", "yuv420p", "-movflags", "+faststart", str(out)]
        started = time.time()

        if args.workers <= 1:
            # один браузер: PNG сразу по трубе в ffmpeg
            proc = subprocess.Popen(encode + ["-f", "image2pipe", "-i", "-"] + tail, stdin=subprocess.PIPE)
            try:
                for n, k in enumerate(frames):
                    proc.stdin.write(grab(page, k / args.fps))
                    el = time.time() - started
                    eta = el / (n + 1) * (len(frames) - n - 1)
                    print(f"\r  кадр {n + 1}/{len(frames)}  {el / (n + 1):.2f} с/кадр  осталось ~{eta / 60:.0f} мин", end="", flush=True)
            finally:
                proc.stdin.close()
                code = proc.wait()
                browser.close()
        else:
            browser.close()
            tmp = Path(tempfile.mkdtemp(prefix="kawaii3d_"))
            procs = [Process(target=worker, args=(args, frames[i::args.workers], tmp, i)) for i in range(args.workers)]
            [pr.start() for pr in procs]
            [pr.join() for pr in procs]
            got = sorted(tmp.glob("*.png"))
            if len(got) != len(frames):
                sys.exit(f"Отрендерено {len(got)} кадров из {len(frames)} — что-то пошло не так, файлы в {tmp}")
            code = subprocess.call(encode + ["-start_number", str(frames[0]), "-i", str(tmp / "%05d.png")] + tail)
            shutil.rmtree(tmp, ignore_errors=True)
    print()
    if code != 0:
        sys.exit(f"ffmpeg завершился с ошибкой {code}")
    print(f"Готово за {(time.time() - started) / 60:.1f} мин: {out} ({os.path.getsize(out) / 1e6:.1f} МБ)")


if __name__ == "__main__":
    main()
