/**
 * Слоты иллюстраций сюжетов задания №10.
 *
 * У каждого прототипа есть место под картинку сюжета:
 *   public/illustrations/zadanie-10/<id прототипа>.webp  — основной файл;
 *   public/illustrations/zadanie-10/<id прототипа>.png   — запасной.
 * Картинки рисует автор и кладёт в папку сам. Пока файла нет, слот
 * ничего не выводит: никаких заглушек «Иллюстрация готовится».
 * Пустые слоты перечисляет `pnpm test:illyustracii-10`.
 *
 * Модуль серверный (node:fs): наличие файлов проверяется при сборке.
 */

import fs from 'node:fs';
import path from 'node:path';
import { assetUrl } from '../assetUrl';
import { PROTOTYPES } from './prototypes';

export const PAPKA_ILLYUSTRACIY = '/illustrations/zadanie-10';

export interface Illyustraciya {
  id: string;
  webp: string;
  png: string;
  alt: string;
  width: number;
  height: number;
}

function publicDir(): string {
  return path.join(process.cwd(), 'public');
}

/** Ширина и высота PNG из заголовка IHDR. */
export function razmerPng(file: string): { width: number; height: number } | null {
  try {
    const buf = fs.readFileSync(file);
    if (buf.length < 24 || buf.toString('ascii', 1, 4) !== 'PNG') {
      return null;
    }
    return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
  } catch {
    return null;
  }
}

export function putiSlota(id: string): { webp: string; png: string } {
  return { webp: `${PAPKA_ILLYUSTRACIY}/${id}.webp`, png: `${PAPKA_ILLYUSTRACIY}/${id}.png` };
}

/** Иллюстрация прототипа или null, если картинку ещё не положили. */
export function illyustraciya(id: string): Illyustraciya | null {
  const proto = PROTOTYPES.find((p) => p.id === id);
  if (proto === undefined) {
    return null;
  }
  const { webp, png } = putiSlota(id);
  const fWebp = path.join(publicDir(), webp);
  const fPng = path.join(publicDir(), png);
  if (!fs.existsSync(fWebp) || !fs.existsSync(fPng)) {
    return null;
  }
  const r = razmerPng(fPng);
  if (r === null) {
    return null;
  }
  return { id, webp: assetUrl(webp), png: assetUrl(png), alt: proto.alt, ...r };
}

/** Слоты всех прототипов: заполнен ли каждый. */
export function slotyIllyustraciy(): { id: string; title: string; alt: string; est: boolean }[] {
  return PROTOTYPES.map((p) => ({
    id: p.id,
    title: p.title,
    alt: p.alt,
    est: illyustraciya(p.id) !== null,
  }));
}
