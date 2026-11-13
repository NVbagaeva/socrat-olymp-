#!/usr/bin/env python3
"""Обвести контуры 20 островов «Карты ЕГЭ» по фоновой картинке.

Запуск из корня репозитория (нужны opencv-python-headless и numpy):

    python3 tools/karta/obvesti.py            # пишет app/src/content/karta/kontury.json
    python3 tools/karta/obvesti.py --snimok x.png   # и картинку с контурами для глаз

Когда фон меняется:
  • композиция та же, размер другой — запускать не нужно: контуры лежат
    в координатах 1586 × 992 и растягиваются вместе с картинкой;
  • острова сдвинулись — поправить зёрна в tools/karta/zerna.json (точка
    внутри каждого острова, в пикселях нового исходника, и его размер),
    запустить скрипт и проверить контуры на сайте в режиме ?debug=1.

Как это работает: водораздел (watershed) от зёрен. Вода — насыщенный
синий; боковые грани льдин темнее верхней плоскости и тоже отсекаются,
кроме островов из списка «v_teni», у которых сама плоскость в тени.
Затем узкие затёки срезаются, контур сглаживается и упрощается.
"""

import json
import sys
from pathlib import Path

import cv2
import numpy as np

KOREN = Path(__file__).resolve().parents[2]
FON = KOREN / "app/public/images/karta/fon-ishodnik.jpg"
ZERNA = Path(__file__).with_name("zerna.json")
KONTURY = KOREN / "app/src/content/karta/kontury.json"
VODA = 21  # метка «не остров»


def vodorazdel(im, zerna, rezat_grani):
    h, w = im.shape[:2]
    sat = cv2.GaussianBlur(cv2.cvtColor(im, cv2.COLOR_BGR2HSV)[..., 1], (0, 0), 1.5)
    if rezat_grani:
        svet = cv2.GaussianBlur(cv2.cvtColor(im, cv2.COLOR_BGR2LAB)[..., 0], (0, 0), 1.5)
        voda = ((sat > 135) | (svet < 197)).astype(np.uint8)
        voda = cv2.morphologyEx(voda, cv2.MORPH_OPEN, np.ones((3, 3), np.uint8))
        voda = cv2.erode(voda, np.ones((3, 3), np.uint8))
    else:
        voda = cv2.erode((sat > 135).astype(np.uint8), np.ones((5, 5), np.uint8))
    metki = np.zeros((h, w), np.int32)
    metki[voda > 0] = VODA
    metki[:3, :] = metki[-3:, :] = VODA
    metki[:, :3] = metki[:, -3:] = VODA
    for no, (x, y) in zerna.items():
        cv2.circle(metki, (int(x), int(y)), max(6, round(14 * w / 1586)), int(no), -1)
    return cv2.watershed(cv2.bilateralFilter(im, 9, 40, 9), metki)


def kontur(maska, masshtab):
    """Маска острова → сглаженный многоугольник, центр подписи и её радиус."""
    k = max(3, round(27 * masshtab) | 1)
    yadro = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (k, k))
    m = cv2.dilate(maska, np.ones((3, 3), np.uint8))
    m = cv2.morphologyEx(m, cv2.MORPH_OPEN, yadro)
    m = cv2.morphologyEx(m, cv2.MORPH_CLOSE, yadro)
    kontury, _ = cv2.findContours(m, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
    tochki = max(kontury, key=cv2.contourArea)[:, 0, :].astype(np.float32)
    okno = max(3, round(9 * masshtab))
    ves = cv2.getGaussianKernel(2 * okno + 1, okno / 3)[:, 0]
    po_krugu = np.concatenate([tochki[-okno:], tochki, tochki[:okno]])
    gladko = np.stack([np.convolve(po_krugu[:, i], ves, "valid") for i in (0, 1)], 1)
    prosto = cv2.approxPolyDP(gladko.reshape(-1, 1, 2).astype(np.float32), 0.6 * masshtab, True)
    rasst = cv2.distanceTransform(m, cv2.DIST_L2, 5)
    _, radius, _, centr = cv2.minMaxLoc(rasst)
    return prosto[:, 0, :], centr, radius


def main():
    dannye = json.loads(ZERNA.read_text(encoding="utf8"))
    im = cv2.imread(str(FON))
    h, w = im.shape[:2]
    # Зёрна заданы в пикселях исходника того размера, что записан рядом с ними.
    kx, ky = w / dannye["shirina"], h / dannye["vysota"]
    zerna = {int(no): (x * kx, y * ky) for no, (x, y) in dannye["zerna"].items()}
    s_granyami = vodorazdel(im, zerna, rezat_grani=False)
    bez_graney = vodorazdel(im, zerna, rezat_grani=True)

    ostrova = []
    for no in sorted(zerna):
        istochnik = s_granyami if no in dannye["v_teni"] else bez_graney
        tochki, centr, radius = kontur((istochnik == no).astype(np.uint8), kx)
        # В файл — в координатах 1586 × 992: от размера картинки контуры не зависят.
        tochki = tochki / [kx, ky]
        d = "M" + "L".join(f"{x:.1f} {y:.1f}" for x, y in tochki) + "Z"
        ostrova.append(
            {
                "no": no,
                "d": d,
                "centr": [round(centr[0] / kx), round(centr[1] / ky)],
                "radius": round(radius / kx),
            }
        )
        print(f"№{no}: {len(tochki)} точек, центр {ostrova[-1]['centr']}, радиус {ostrova[-1]['radius']}")

    KONTURY.write_text(
        json.dumps({"shirina": 1586, "vysota": 992, "ostrova": ostrova}, ensure_ascii=False, indent=1)
        + "\n",
        encoding="utf8",
    )
    print(f"Записано: {KONTURY.relative_to(KOREN)}")

    if "--snimok" in sys.argv:
        vis = cv2.resize(im, None, fx=2, fy=2, interpolation=cv2.INTER_LANCZOS4)
        for o in ostrova:
            pts = np.array(
                [[float(a) for a in p.split()] for p in o["d"][1:-1].split("L")], np.float32
            )
            pts = (pts * [kx * 2, ky * 2]).astype(np.int32)
            cv2.polylines(vis, [pts], True, (0, 60, 230), 2, cv2.LINE_AA)
        cv2.imwrite(sys.argv[sys.argv.index("--snimok") + 1], vis)


if __name__ == "__main__":
    main()
