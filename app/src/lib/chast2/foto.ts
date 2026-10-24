/**
 * Фото решения в браузере: открыть (HEIC → JPEG, поворот по EXIF),
 * поправить (поворот на 90°, выпрямление ±15°, обрезка, «как скан») и
 * сжать в JPEG ≤ 2000 px по длинной стороне и около 1 МБ. Новый JPEG
 * собирается из пикселей холста — метаданных (EXIF, геометки) в нём нет.
 *
 * Сервис загрузки всё равно перекодирует файл и проверяет содержимое:
 * здесь — чтобы на телефоне не гонять по сети 5–10 МБ.
 */

export const MAX_SIDE = 2000;
export const TARGET_BYTES = 1_000_000;
/** Предел до перекодирования: больше — не открываем (память телефона). */
export const MAX_INPUT_BYTES = 40_000_000;

/** Правка фото. Обрезка — доли сторон после поворота и выпрямления. */
export interface Pravka {
  rot90: 0 | 1 | 2 | 3;
  /** Выпрямление, градусы: −15…15. */
  angle: number;
  crop: { x: number; y: number; w: number; h: number };
  scan: boolean;
}

export const BEZ_PRAVKI: Pravka = {
  rot90: 0,
  angle: 0,
  crop: { x: 0, y: 0, w: 1, h: 1 },
  scan: false,
};

/* ── Тип файла по содержимому ───────────────────────────────────── */

export type Vid = 'jpeg' | 'png' | 'webp' | 'heic' | 'other';

export async function vidFayla(file: Blob): Promise<Vid> {
  const b = new Uint8Array(await file.slice(0, 16).arrayBuffer());
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return 'jpeg';
  if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return 'png';
  const ascii = (from: number, to: number) => String.fromCharCode(...b.slice(from, to));
  if (ascii(0, 4) === 'RIFF' && ascii(8, 12) === 'WEBP') return 'webp';
  /* ISO BMFF: «ftyp» и бренд HEIF/HEIC. */
  if (ascii(4, 8) === 'ftyp' && /^(heic|heix|hevc|hevx|heim|heis|mif1|msf1)$/.test(ascii(8, 12))) {
    return 'heic';
  }
  return 'other';
}

/* ── Открыть ────────────────────────────────────────────────────── */

export class FotoError extends Error {
  constructor(
    readonly code: 'not_image' | 'too_big' | 'decode',
    message: string,
  ) {
    super(message);
  }
}

function loadImage(blob: Blob): Promise<HTMLImageElement> {
  const url = URL.createObjectURL(blob);
  const img = new Image();
  img.decoding = 'async';
  return new Promise<HTMLImageElement>((resolve, reject) => {
    img.onload = () => resolve(img);
    img.onerror = () => reject(new FotoError('decode', 'Не получилось открыть фото'));
    img.src = url;
  }).finally(() => {
    /* Пиксели уже в картинке: ссылка больше не нужна. */
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
  });
}

/**
 * Файл с камеры или из галереи → картинка, повёрнутая как на экране
 * телефона. Браузер сам применяет поворот из EXIF (image-orientation:
 * from-image — поведение по умолчанию), HEIC сначала переводится в JPEG.
 */
export async function otkryt(file: Blob): Promise<HTMLImageElement> {
  if (file.size > MAX_INPUT_BYTES) throw new FotoError('too_big', 'Файл слишком большой');
  const vid = await vidFayla(file);
  if (vid === 'other') throw new FotoError('not_image', 'Это не фотография');
  let blob = file;
  if (vid === 'heic') {
    const { default: heic2any } = await import('heic2any');
    const out = await heic2any({ blob: file, toType: 'image/jpeg', quality: 0.92 });
    blob = Array.isArray(out) ? out[0]! : out;
  }
  return loadImage(blob);
}

/* ── Поправить ──────────────────────────────────────────────────── */

type Src = CanvasImageSource & { width: number; height: number };

function canvas(w: number, h: number): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.round(w));
  c.height = Math.max(1, Math.round(h));
  return c;
}

/**
 * Во сколько раз увеличить картинку, повёрнутую на угол, чтобы она
 * закрыла рамку того же размера без пустых углов.
 */
export function masshtabVypryamleniya(w: number, h: number, deg: number): number {
  const t = Math.abs((deg * Math.PI) / 180);
  const c = Math.cos(t);
  const s = Math.sin(t);
  return Math.max((w * c + h * s) / w, (w * s + h * c) / h);
}

/** Поворот на 90° и выпрямление: холст размером повёрнутой картинки. */
export function povernut(
  src: Src,
  rot90: Pravka['rot90'],
  angle: number,
  scale = 1,
): HTMLCanvasElement {
  const sw = src.width * scale;
  const sh = src.height * scale;
  const swap = rot90 % 2 === 1;
  const w = swap ? sh : sw;
  const h = swap ? sw : sh;
  const c = canvas(w, h);
  const ctx = c.getContext('2d')!;
  ctx.imageSmoothingQuality = 'high';
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, c.width, c.height);
  ctx.translate(c.width / 2, c.height / 2);
  ctx.rotate(((rot90 * 90 + angle) * Math.PI) / 180);
  const k = angle === 0 ? 1 : masshtabVypryamleniya(w, h, angle);
  ctx.scale(k, k);
  ctx.drawImage(src, -sw / 2, -sh / 2, sw, sh);
  return c;
}

/** Фильтр «как скан»: серый, бумага — белая, чернила — темнее. */
export function kakSkan(c: HTMLCanvasElement): void {
  const ctx = c.getContext('2d')!;
  const img = ctx.getImageData(0, 0, c.width, c.height);
  const d = img.data;
  const hist = new Uint32Array(256);
  const lum = new Uint8ClampedArray(d.length / 4);
  for (let i = 0, j = 0; i < d.length; i += 4, j += 1) {
    const l = (d[i]! * 299 + d[i + 1]! * 587 + d[i + 2]! * 114) / 1000;
    lum[j] = l;
    hist[lum[j]!]! += 1;
  }
  /* Чернила — нижние 2 %, бумага — около 60-го процентиля и светлее. */
  const total = lum.length;
  const pct = (p: number) => {
    let acc = 0;
    for (let v = 0; v < 256; v += 1) {
      acc += hist[v]!;
      if (acc >= total * p) return v;
    }
    return 255;
  };
  const black = pct(0.02);
  const white = Math.max(black + 30, pct(0.6) - 8);
  const span = white - black;
  for (let i = 0, j = 0; i < d.length; i += 4, j += 1) {
    const t = Math.min(1, Math.max(0, (lum[j]! - black) / span));
    /* Кривая с подъёмом середины: фон уходит в белый, линии остаются. */
    const v = 255 * Math.pow(t, 1.6);
    d[i] = v;
    d[i + 1] = v;
    d[i + 2] = v;
    d[i + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
}

/**
 * Применить правку. `maxSide` — предел длинной стороны результата:
 * 2000 для отправки, меньше — для предпросмотра.
 */
export function primenit(src: Src, p: Pravka, maxSide = MAX_SIDE): HTMLCanvasElement {
  /* Сначала уменьшаем исходник: дальше работаем с меньшим холстом.
     Запас — на обрезку: после неё сторона не меньше maxSide, если хватает пикселей. */
  const long = Math.max(src.width, src.height);
  const cropShare = Math.max(0.05, Math.max(p.crop.w, p.crop.h));
  const scale = Math.min(1, maxSide / (long * cropShare));
  const turned = povernut(src, p.rot90, p.angle, scale);
  const cx = Math.round(p.crop.x * turned.width);
  const cy = Math.round(p.crop.y * turned.height);
  const cw = Math.max(1, Math.round(p.crop.w * turned.width));
  const ch = Math.max(1, Math.round(p.crop.h * turned.height));
  const k = Math.min(1, maxSide / Math.max(cw, ch));
  const out = canvas(cw * k, ch * k);
  const ctx = out.getContext('2d')!;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(turned, cx, cy, cw, ch, 0, 0, out.width, out.height);
  if (p.scan) kakSkan(out);
  return out;
}

/* ── Сжать ──────────────────────────────────────────────────────── */

function toBlob(c: HTMLCanvasElement, q: number): Promise<Blob> {
  return new Promise((resolve, reject) =>
    c.toBlob(
      (b) => (b ? resolve(b) : reject(new FotoError('decode', 'Не получилось сохранить фото'))),
      'image/jpeg',
      q,
    ),
  );
}

export interface Gotovo {
  blob: Blob;
  width: number;
  height: number;
}

/** Холст → JPEG около 1 МБ: сначала качество, потом размер. */
export async function szhat(c: HTMLCanvasElement, target = TARGET_BYTES): Promise<Gotovo> {
  let cur = c;
  for (let round = 0; round < 6; round += 1) {
    for (const q of [0.85, 0.75, 0.65, 0.55]) {
      const b = await toBlob(cur, q);
      if (b.size <= target) return { blob: b, width: cur.width, height: cur.height };
    }
    const next = canvas(cur.width * 0.8, cur.height * 0.8);
    next.getContext('2d')!.drawImage(cur, 0, 0, next.width, next.height);
    cur = next;
  }
  const b = await toBlob(cur, 0.5);
  return { blob: b, width: cur.width, height: cur.height };
}

/** Всё вместе: файл → правка → JPEG для отправки. */
export async function gotovoDlyaOtpravki(img: Src, p: Pravka): Promise<Gotovo> {
  return szhat(primenit(img, p));
}
