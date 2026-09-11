import sharp from 'sharp';

/**
 * Кайма — это систематический сдвиг цвета контура в одну сторону:
 * светлый ореол или тёмная обводка. Разброс отдельных пикселей на мягком
 * градиенте даёт лоссовое сжатие, и сам по себе он ни о чём не говорит,
 * поэтому меряем среднее смещение со знаком, а не максимум модуля.
 */
/** Альфа в заведомо прозрачной области. */
export const ALPHA_LEAK = 4;
/** Доля протёкших пикселей, выше которой это уже ореол. */
export const LEAK_SHARE = 0.0005;
/** Среднее смещение яркости контура. Плюс — светлая кайма, минус — тёмная. */
export const EDGE_BIAS = 2;

export const kb = (bytes) => `${(bytes / 1024).toFixed(1)} КБ`;

export async function raw(input) {
  return sharp(input).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
}

export function encode(input, ext, quality) {
  const image = sharp(input);
  return ext === 'avif'
    ? image.avif({ quality, effort: 6, chromaSubsampling: '4:4:4' }).toBuffer()
    : image.webp({ quality, effort: 6, alphaQuality: 100 }).toBuffer();
}

/** Жмём, пока не влезет в бюджет; ниже floor не опускаемся. */
export async function encodeWithinBudget(input, target) {
  let last = null;
  for (let quality = target.start; quality >= target.floor; quality -= 5) {
    const buffer = await encode(input, target.ext, quality);
    last = { buffer, quality };
    if (buffer.length <= target.budget) return { ...last, withinBudget: true };
  }
  return { ...last, withinBudget: false };
}

/** Сравниваем альфу и яркость контура исходника и результата. */
export async function compareAlpha(source, encoded) {
  const a = await raw(source);
  const b = await raw(encoded);

  let transparent = 0;
  let leaked = 0;
  let maxLeak = 0;
  let edge = 0;
  let biasSum = 0;
  let absSum = 0;

  for (let i = 0; i < a.data.length; i += 4) {
    const srcAlpha = a.data[i + 3];

    if (srcAlpha === 0) {
      transparent++;
      const outAlpha = b.data[i + 3];
      if (outAlpha > ALPHA_LEAK) {
        leaked++;
        maxLeak = Math.max(maxLeak, outAlpha);
      }
      continue;
    }

    if (srcAlpha < 255) {
      edge++;
      // Яркость, умноженная на альфу: именно она видна на фоне страницы.
      const lum = (data, j, alpha) =>
        ((0.2126 * data[j] + 0.7152 * data[j + 1] + 0.0722 * data[j + 2]) * alpha) / 255;
      const delta = lum(b.data, i, b.data[i + 3]) - lum(a.data, i, srcAlpha);
      biasSum += delta;
      absSum += Math.abs(delta);
    }
  }

  const leakShare = transparent === 0 ? 0 : leaked / transparent;
  return {
    transparent,
    leaked,
    maxLeak,
    leakShare,
    edge,
    bias: edge === 0 ? 0 : biasSum / edge,
    spread: edge === 0 ? 0 : absSum / edge,
  };
}
