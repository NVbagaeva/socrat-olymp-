"""Иллюстрации «Чем могу быть полезна»: фон был удалён «белое → прозрачное».
Возвращаем вид на белом, делаем силуэт непрозрачным, тень — настоящей.
python3 sdelat-neprozrachnoj.py src.webp out.webp[@WxH] ..."""
import sys, numpy as np
from PIL import Image
from scipy import ndimage as ndi
src = sys.argv[1]
im = np.array(Image.open(src).convert('RGBA')).astype(np.float32)
rgb, a = im[..., :3], im[..., 3:] / 255
# Картинка задумана на белом: «белое» ушло в прозрачность. Возвращаем цвет.
col = rgb * a + 255 * (1 - a)
a = a[..., 0]
sil = ndi.binary_fill_holes(ndi.binary_closing(a > 0.16, iterations=2))
sil = ndi.binary_opening(sil, iterations=1)
lab, n = ndi.label(sil)
sizes = ndi.sum(sil, lab, range(1, n + 1))
sil = np.isin(lab, 1 + np.flatnonzero(sizes >= 0.02 * sizes.max()))
# Мягкий край: силуэт, сжатый на 1 px и размытый.
core = ndi.binary_erosion(sil, iterations=1).astype(np.float32)
alpha = np.clip(ndi.gaussian_filter(core, 0.8) * 1.15, 0, 1) * sil
# Деконтаминация края: цвет пикселей у кромки — из глубины силуэта,
# иначе на тёмном фоне виден белёсый ободок от смешения с белым.
deep = ndi.binary_erosion(sil, iterations=3)
_, (iy, ix) = ndi.distance_transform_edt(~deep, return_indices=True)
d = ndi.distance_transform_edt(sil)
k = np.clip((3.5 - d) / 3.5, 0, 1)[..., None]
light = (col.mean(-1, keepdims=True) - col[iy, ix].mean(-1, keepdims=True) > 20)
col = np.where(light, col * (1 - k) + col[iy, ix] * k, col)
# Серая тень на белом у нижнего края → настоящая тень: тёмная и
# полупрозрачная, а не светлая плашка на тёмной карточке.
H = col.shape[0]
yy = np.arange(H)[:, None] * np.ones(col.shape[:2])
sat = col.max(-1) - col.min(-1); lum = col.mean(-1)
dout = ndi.distance_transform_edt(sil)
ten = sil & (dout < 14) & (yy > 0.7 * H) & (sat < 16) & (lum > 140)
ten = ndi.binary_opening(ten, iterations=1)
alpha = np.where(ten, alpha * np.clip((255 - lum) / 255 * 2.2, 0, 0.5), alpha)
col = np.where(ten[..., None], np.array([20, 24, 40.0]), col)
print('ten px', int(ten.sum()))
out = np.dstack([col, alpha * 255]).clip(0, 255).astype(np.uint8)
out[alpha == 0, :3] = 0
img = Image.fromarray(out, 'RGBA')
for dst in sys.argv[2:]:
    path, size = (dst.split('@') + [None])[:2]
    r = img if not size else img.resize(tuple(int(v) for v in size.split('x')), Image.LANCZOS)
    if path.endswith('.webp'): r.save(path, 'WEBP', quality=86, method=6, alpha_quality=92)
    else: r.save(path, optimize=True)
