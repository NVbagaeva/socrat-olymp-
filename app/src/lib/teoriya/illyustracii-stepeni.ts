/**
 * Иллюстрации блока «Степени десяти» (общая теория единиц №10/№11).
 *
 * Файлы автора — прозрачные PNG в стеклянном стиле сайта:
 *   public/illustrations/teoriya/stepeni-<слот>.png        — запасной;
 *   public/illustrations/teoriya/stepeni-<слот>-<w>.webp   — основные,
 *     w = 480, 768, 1200 (делаются из PNG при добавлении картинки).
 * Пока PNG нет, слот ничего не выводит — никаких заглушек. Картинки
 * декоративные: alt="" и aria-hidden.
 *
 * Модуль серверный (node:fs): наличие файлов проверяется при сборке.
 */

import fs from 'node:fs';
import path from 'node:path';
import { assetUrl } from '../assetUrl';
import type { SlotStepeni } from '../../content/teoriya-edinicy';

export const PAPKA_STEPENI = '/illustrations/teoriya';
export const SHIRINY_STEPENI = [480, 768, 1200] as const;

export interface KartinkaStepeni {
  png: string;
  webp: string | null;
  width: number;
  height: number;
}

/** Ширина и высота PNG из заголовка IHDR. */
function razmerPng(file: string): { width: number; height: number } | null {
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

export function faylyStepeni(slot: SlotStepeni): { png: string; webp: string[] } {
  return {
    png: `stepeni-${slot}.png`,
    webp: SHIRINY_STEPENI.map((w) => `stepeni-${slot}-${w}.webp`),
  };
}

export function kartinkaStepeni(slot: SlotStepeni): KartinkaStepeni | null {
  const dir = path.join(process.cwd(), 'public', PAPKA_STEPENI);
  const f = faylyStepeni(slot);
  const razmer = razmerPng(path.join(dir, f.png));
  if (razmer === null) {
    return null;
  }
  const webp = SHIRINY_STEPENI.filter((_, i) => fs.existsSync(path.join(dir, f.webp[i] ?? '')));
  return {
    png: assetUrl(`${PAPKA_STEPENI}/${f.png}`),
    webp:
      webp.length === 0
        ? null
        : webp
            .map((w) => `${assetUrl(`${PAPKA_STEPENI}/stepeni-${slot}-${w}.webp`)} ${w}w`)
            .join(', '),
    ...razmer,
  };
}
