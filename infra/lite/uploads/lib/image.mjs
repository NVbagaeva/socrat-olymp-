/* Фото решения: тип — по содержимому, а не по расширению; затем
   изображение раскодируется и кодируется заново. Повторное кодирование
   гарантирует, что в бакет уходит именно картинка, и снимает все
   метаданные (EXIF, геолокацию, XMP): sharp их не переносит, если не
   попросить. Ориентация из EXIF применяется к пикселям до этого. */

import sharp from 'sharp';

export const MAX_INPUT_BYTES = 4 * 1024 * 1024;
export const MAX_SIDE = 2000;
export const TARGET_BYTES = 1_100_000;

/** Тип по первым байтам: jpeg, png, webp, heic или null. */
export function sniff(buf) {
  if (buf.length < 12) return null;
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'jpeg';
  if (buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'png';
  if (buf.subarray(0, 4).toString('latin1') === 'RIFF' && buf.subarray(8, 12).toString('latin1') === 'WEBP') return 'webp';
  const brand = buf.subarray(4, 12).toString('latin1');
  if (/^ftyp(heic|heix|hevc|mif1|msf1)/.test(brand)) return 'heic';
  return null;
}

export class ImageError extends Error {
  constructor(status, code, message) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

/** Проверить и перекодировать: JPEG не больше MAX_SIDE по длинной стороне, около 1 МБ. */
export async function prepare(buf) {
  if (buf.length > MAX_INPUT_BYTES) throw new ImageError(413, 'too_big', 'Файл больше 4 МБ');
  const kind = sniff(buf);
  if (kind === 'heic') {
    throw new ImageError(415, 'heic', 'HEIC переводится в JPEG на устройстве — обновите страницу');
  }
  if (kind === null) throw new ImageError(415, 'not_image', 'Это не изображение');
  let meta;
  try {
    meta = await sharp(buf, { failOn: 'error', limitInputPixels: 60_000_000 }).metadata();
  } catch {
    throw new ImageError(415, 'broken', 'Изображение повреждено');
  }
  if (!meta.width || !meta.height) throw new ImageError(415, 'broken', 'Изображение повреждено');
  let quality = 84;
  for (;;) {
    const { data, info } = await sharp(buf, { failOn: 'error', limitInputPixels: 60_000_000 })
      .rotate()
      .resize({ width: MAX_SIDE, height: MAX_SIDE, fit: 'inside', withoutEnlargement: true })
      .flatten({ background: '#ffffff' })
      .jpeg({ quality, mozjpeg: true })
      .toBuffer({ resolveWithObject: true });
    if (data.length <= TARGET_BYTES || quality <= 55) {
      return { data, width: info.width, height: info.height, bytes: data.length };
    }
    quality -= 8;
  }
}
