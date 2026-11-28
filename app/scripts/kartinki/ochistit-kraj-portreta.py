"""Чистка края вырезанного портрета: светлая кайма старого фона.
python3 defringe.py src.webp out.webp[@WxH] ..."""
import sys, numpy as np
from PIL import Image
from scipy import ndimage as ndi
im = np.array(Image.open(sys.argv[1]).convert('RGBA')).astype(np.float32)
rgb, a = im[..., :3], im[..., 3] / 255

# 1) Маска: убрать отдельные островки и крошки (< 40 px).
m = a > 0.5
lab, n = ndi.label(m)
sizes = ndi.sum(m, lab, range(1, n + 1))
keep = np.isin(lab, 1 + np.flatnonzero(sizes >= 40))
a = a * ndi.binary_dilation(keep, iterations=2)

# 2) Сжать край ~2 px и сгладить: мягкий, не «рваный» контур.
a = ndi.grey_erosion(a, size=(5, 5))
a = ndi.gaussian_filter(a, 1.1)
a = np.clip((a - 0.12) / 0.8, 0, 1)
a = a * a * (3 - 2 * a)  # smoothstep — плотнее внутри, мягче на кромке

# 3) Цвет кромки — из глубины силуэта (≥ 7 px от края).
inside = a > 0.98
deep = ndi.binary_erosion(inside, iterations=7)
_, (dy, dx) = ndi.distance_transform_edt(~deep, return_indices=True)
deepc = ndi.uniform_filter(rgb, size=(5, 5, 1))[dy, dx]
d_in = ndi.distance_transform_edt(inside)
# 0–3 px от края: цвет целиком из глубины; 3–14 px: только светлые
# малонасыщенные пиксели (серо-голубые остатки фона).
w_full = np.clip((3.5 - d_in) / 3.5, 0, 1)
lum, dlum = rgb.mean(-1), deepc.mean(-1)
sat = rgb.max(-1) - rgb.min(-1)
light = np.clip((lum - dlum - 20) / 40, 0, 1) * (sat < 90) * (d_in < 14)
k = np.maximum(w_full, light)[..., None]
rgb = rgb * (1 - k) + deepc * k

out = np.dstack([rgb, a * 255]).clip(0, 255).astype(np.uint8)
out[a == 0, :3] = 0
img = Image.fromarray(out, 'RGBA')
for dst in sys.argv[2:]:
    path, size = (dst.split('@') + [None])[:2]
    r = img if not size else img.resize(tuple(int(v) for v in size.split('x')), Image.LANCZOS)
    if path.endswith('.webp'): r.save(path, 'WEBP', quality=88, method=6, alpha_quality=100)
    else: r.save(path, optimize=True)
