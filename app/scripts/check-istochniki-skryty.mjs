/* scripts/check-istochniki-skryty.mjs — источники задач №4 и №5 не видны.

   Задачи №4 и №5 собраны по сборнику задач и урокам автора. Откуда
   взят вариант, хранится в служебных полях банка (source, sourceNote,
   sourceRange, sourceRanges) и на экран не выводится: ни названия
   источников, ни номера задач в них.

   Проверка идёт по собранному сайту (out/): страницы заданий №4 и №5
   и данные роутера к ним (…/index.txt) — в них лежит всё, что
   браузер покажет без нового запроса, в том числе содержимое модалок
   и карточек тренажёра. Находит запретное слово или строку вида
   «задачи 45–48» — падает и называет файл и место.

   Запуск после pnpm build:  node scripts/check-istochniki-skryty.mjs */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const app = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(app, 'out');
const KORNI = ['zadaniya/4', 'zadaniya/5'].map((p) => path.join(OUT, p));

/* Слова и их латинские написания — латиницей источник попадает в
   данные как служебный ключ или имя файла. */
const ZAPRET = [
  { re: /задачник/i, chto: 'слово «задачник»' },
  { re: /ширяев/i, chto: 'фамилия автора сборника' },
  { re: /егэ\s*-?\s*проф/i, chto: 'название «ЕГЭпроф»' },
  { re: /конспект/i, chto: 'слово «конспект»' },
  { re: /zadachnik|shiryaev|egeprof|konspekt/i, chto: 'источник латиницей' },
  { re: /задачи\s+\d+\s*[–-]\s*\d+/i, chto: 'номера задач сборника' },
];

function files(dir, out = []) {
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    if (fs.statSync(full).isDirectory()) {
      files(full, out);
    } else if (name.endsWith('.html') || name.endsWith('.txt')) {
      out.push(full);
    }
  }
  return out;
}

for (const koren of KORNI) {
  if (!fs.existsSync(koren)) {
    console.error(`Нет ${path.relative(app, koren)}: сначала pnpm build.`);
    process.exit(1);
  }
}

const spisok = KORNI.flatMap((k) => files(k));
const oshibki = [];
for (const file of spisok) {
  const text = fs.readFileSync(file, 'utf8');
  for (const { re, chto } of ZAPRET) {
    const m = re.exec(text);
    if (m !== null) {
      const okolo = text.slice(Math.max(0, m.index - 40), m.index + m[0].length + 40);
      oshibki.push(`${path.relative(OUT, file)}: ${chto} — «…${okolo.replace(/\s+/g, ' ')}…»`);
    }
  }
}

if (oshibki.length > 0) {
  console.error(`Источники задач видны на страницах №4 и №5 (${oshibki.length}):`);
  oshibki.slice(0, 30).forEach((o) => console.error(`  ${o}`));
  process.exit(1);
}
console.log(`Источники скрыты: проверено файлов №4 и №5 — ${spisok.length}, запретных слов и номеров сборника нет.`);
