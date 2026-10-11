/* scripts/lib/istochniki-1.mjs — следы сторонних источников в файлах
   задания №1.

   Сторонние материалы лежат только локально, в _sources/zadanie-1/
   (папка в .gitignore). Там же — список слов, которых не должно быть в
   наших файлах: имена авторов и названия сборников (zapret.txt). В
   репозитории этого списка нет — иначе он сам был бы упоминанием.

   Проверка проходит по файлам №1 (код, тексты, документы) и ищет эти
   слова без учёта регистра. Нет папки _sources (CI, чужая машина) —
   проверка пропускается и говорит об этом. */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const APP = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const ROOT = path.resolve(APP, '..');
export const SOURCES = path.join(ROOT, '_sources', 'zadanie-1');

/** Файлы задания №1: пути от корня репозитория. */
const MESTA = [
  'app/src/lib/planimetriya',
  'app/src/components/tasks/planimetriya',
  'app/src/app/zadaniya/1',
  'app/src/app/styleguide/planimetriya-1',
  'app/src/content/zadanie1.ts',
  'app/src/content/teoriya1.ts',
  'app/src/content/repetitory1.ts',
  'app/scripts/check-planimetria.mjs',
  'app/scripts/lib/istochniki-1.mjs',
  'docs/zadanie-1-otchet.md',
  'docs/zadanie-1-snimki',
];

function fajly(abs) {
  if (!fs.existsSync(abs)) return [];
  if (!fs.statSync(abs).isDirectory()) return [abs];
  return fs.readdirSync(abs).flatMap((n) => fajly(path.join(abs, n)));
}

export function fajlyZadaniya1() {
  return MESTA.flatMap((m) => fajly(path.join(ROOT, m))).filter((f) =>
    /\.(ts|tsx|js|mjs|css|md|json)$/.test(f),
  );
}

/** Запретные слова из zapret.txt или null, если источников на машине нет. */
export function zapretnyeSlova() {
  const f = path.join(SOURCES, 'zapret.txt');
  if (!fs.existsSync(f)) return null;
  return fs
    .readFileSync(f, 'utf8')
    .split('\n')
    .map((s) => s.trim().toLowerCase())
    .filter((s) => s !== '' && !s.startsWith('#'));
}

/** Нарушения: «файл: слово». */
export function proveritZapret() {
  const slova = zapretnyeSlova();
  if (slova === null) return null;
  const out = [];
  for (const f of fajlyZadaniya1()) {
    const t = fs.readFileSync(f, 'utf8').toLowerCase();
    for (const s of slova) {
      if (t.includes(s)) out.push(`${path.relative(ROOT, f)}: «${s}»`);
    }
  }
  return out;
}
