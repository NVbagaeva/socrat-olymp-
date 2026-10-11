/* scripts/lib/legal-config.mjs — данные оператора в правовых документах.

   Политика, согласие и пользовательское соглашение (src/content/legal/*.md)
   содержат три подстановки: [ФИО], [ПОЧТА], [ДАТА]. Значения для них
   заполняются один раз в src/content/legal/operator.json — страницы,
   подвал и письмо родителю берут их оттуда.

   Пока хоть одно поле не заполнено, продакшен-сборка падает
   (next.config.ts): опубликовать документы с «[ФИО]» вместо имени
   оператора нельзя. Для превью и проверок в CI черновик разрешает
   переменная LEGAL_DRAFT=1 — деплой её не ставит. */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { legalConfigProblems } from '../../src/lib/legal/operatorProblems.mjs';

export { legalConfigProblems };

const APP = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
export const LEGAL_CONFIG_PATH = path.join(APP, 'src', 'content', 'legal', 'operator.json');

export function readLegalConfig() {
  return JSON.parse(fs.readFileSync(LEGAL_CONFIG_PATH, 'utf8'));
}

/** Текст ошибки для упавшей сборки. */
export function legalConfigError(problems) {
  return [
    '',
    'Сборка остановлена: в правовых документах не заполнены данные оператора.',
    `Заполните файл app/src/content/legal/operator.json:`,
    ...problems.map((p) => `  — ${p}`),
    'Это подставится в политику, согласие, соглашение, подвал и письмо родителю.',
    'Собрать черновик для просмотра можно с LEGAL_DRAFT=1 (на сайт такую сборку не выкладывать).',
    '',
  ].join('\n');
}
