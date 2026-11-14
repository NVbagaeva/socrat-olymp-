#!/usr/bin/env node
/* scripts/check-dz-sborka.mjs — сборка ДЗ из трёх источников и печать.

   Запуск: pnpm test:dz-sborka (сборка сайта не нужна).

   Каталоги №7 и №8 (lib/dz/katalog/server.ts) → состав из двух наборов
   карточек, блока опорных и пяти задач тренажёра двух разделов →
   пункты (lib/dz/sborka) → листы ученика и учителя (lib/dz/print.ts):

     - «один набор на всех» — у всех одни и те же задачи (student_id нет),
       «каждому свои» — у каждого ученика свои, разные;
     - зерно записано в правило пункта, ответы — в нормальной записи ЕГЭ,
       в том, что видит ученик (условие и view), ответа нет;
     - «Без подсказок» на стороне сайта не нужен: его вырезает база (тест
       базы), а здесь — что подсказки вообще собраны;
     - печать: лист ученика и лист учителя — одни и те же задачи по
       порядку; карточки — отдельной страницей, на листе ученика без
       ответов и оборотов, на листе учителя — с ними.

   Данные тренажёра №7 браузер берёт файлами public/data/zadanie7 — здесь
   fetch читает их с диска. */

import fs from 'node:fs';
import path from 'node:path';
import { APP, requireSrc } from './lib/load-ts.mjs';

globalThis.fetch = async (url) => {
  const p = path.join(APP, 'public', String(url).split('?')[0]);
  if (!fs.existsSync(p)) return { ok: false, status: 404, json: async () => null };
  return { ok: true, status: 200, json: async () => JSON.parse(fs.readFileSync(p, 'utf8')) };
};

const { katalog } = requireSrc('lib/dz/katalog/server.ts');
const { sobratPunkty } = requireSrc('lib/dz/sborka/index.ts');
const { printSpec } = requireSrc('lib/dz/print.ts');
const { normalizeEge } = requireSrc('lib/otvet/proverkaDz.ts');

const failures = [];
let checks = 0;
function check(ok, what) {
  checks += 1;
  if (!ok) failures.push(what);
}

const k7 = katalog(7);
const k8 = katalog(8);
check(k7 !== null && k8 !== null, 'каталоги №7 и №8 собираются');
check(k8.kartochki === null, 'у №8 карточек нет');
const katalogi = new Map([
  [7, k7],
  [8, k8],
]);
const [t1, t2] = k7.kartochki;
const sostav = {
  v: 1,
  punkty: [
    { id: 'a', ist: 'kartochki', no: 7, podtema: t1.id, kartochki: null },
    { id: 'b', ist: 'kartochki', no: 7, podtema: t2.id, kartochki: t2.kartochki.slice(0, 3).map((k) => k.id) },
    { id: 'c', ist: 'opornye', no: 8, blok: k8.opornye[0].slug, zadachi: null, kazhdomu: true },
    { id: 'd', ist: 'trenazher', no: 8, tipy: ['8.A', '8.B'], skolko: 3, kazhdomu: false },
    { id: 'e', ist: 'trenazher', no: 7, tipy: [k7.trenazher[0].tipy[0].id], skolko: 2, kazhdomu: true },
    { id: 'f', ist: 'opornye', no: 7, blok: k7.opornye[0].slug, zadachi: null, kazhdomu: false },
  ],
  nastroyki: {},
};
const students = ['u1', 'u2', 'u3'];
const parts = await sobratPunkty(sostav, katalogi, students, 'zerno-testa');

check(parts.length === 6, `пунктов 6 (${parts.length})`);
check(
  parts.every((p) => typeof p.rule.zerno === 'string' || p.source === 'kartochki'),
  'зерно записано в правило каждого пункта с задачами',
);
check(parts[0].units.length === t1.kartochki.length, 'весь набор карточек — все карточки подтемы');
check(parts[1].units.length === 3, 'выбранные карточки — три');
check(
  parts.slice(0, 2).every((p) => p.units.every((u) => u.studentId === null)),
  'карточки — одни на всех',
);
check(
  parts[0].units.every((u) =>
    u.answerKind === 'self'
      ? u.answer === null && u.razbor === null
      : u.answerKind === 'verno'
        ? ['da', 'net'].includes(u.answer)
        : normalizeEge(u.answer) === u.answer,
  ),
  'карточки: самооценка без ключа, «верно/неверно» — da/net, вычисление — запись ЕГЭ',
);

/* «Каждому свои» — у каждого свои, разные; «один набор» — общий. */
const op8 = parts[2];
const perStudent = (p, s) => p.units.filter((u) => u.studentId === s);
check(op8.perStudent && students.every((s) => perStudent(op8, s).length === k8.opornye[0].zadachi.length), 'опорные №8 каждому — полный блок у каждого');
check(
  new Set(students.map((s) => perStudent(op8, s).map((u) => u.questionHtml).join('|'))).size === 3,
  'опорные №8 каждому — аналоги у учеников разные',
);
const tr8 = parts[3];
check(!tr8.perStudent && tr8.units.length === 3 && tr8.units.every((u) => u.studentId === null), 'тренажёр №8 один на всех — 3 общие задачи');
check(tr8.units.map((u) => u.kind).join(',') === '8.A,8.B,8.A', 'типы по кругу: 8.A, 8.B, 8.A');
const tr7 = parts[4];
check(tr7.perStudent && students.every((s) => perStudent(tr7, s).length === 2), 'тренажёр №7 каждому — по 2 задачи');
check(
  new Set(tr7.units.map((u) => u.ref)).size === tr7.units.length,
  'тренажёр №7 каждому — задачи банка без повторов, пока хватает',
);
const op7 = parts[5];
check(!op7.perStudent && op7.units.length === k7.opornye[0].zadachi.length, 'опорные №7 — сами задачи блока, одни на всех');
const vse = parts.flatMap((p) => p.units);
check(
  vse.filter((u) => u.answerKind !== 'self').every((u) => u.answer !== null && (u.answerKind === 'verno' || normalizeEge(u.answer) === u.answer)),
  'все ключи — в нормальной записи',
);
check(
  vse.every((u) => {
    /* Разобранный пример — своя задача с ответом, её ответ и показывают. */
    const { primer, ...rest } = u.view;
    void primer;
    return !JSON.stringify(rest).includes('"answer"') && !JSON.stringify(rest).includes('"otvet"');
  }),
  'в том, что видит ученик, ответа нет (кроме разобранного примера)',
);
check(tr7.units.some((u) => (u.view.voprosy ?? []).length > 0), 'у задач №7 — подсказки-вопросы');
check(tr8.units.some((u) => u.view.primer !== undefined), 'у задач №8 — разобранный пример (база вырежет, если выключен)');

/* Печать: те же строки, что получит база. */
let pos = 0;
const tasks = [];
const keys = new Map();
const partViews = parts.map((p, i) => ({ id: `p${i}`, source: p.source }));
const posOf = new Map();
parts.forEach((p, i) =>
  p.units.forEach((u, j) => {
    const k = u.studentId ?? '-';
    posOf.set(k, (posOf.get(k) ?? 0) + 1);
    const id = `t${(pos += 1)}`;
    tasks.push({ id, position: posOf.get(k), kind: u.kind, questionHtml: u.questionHtml, comment: null, studentId: u.studentId, partId: `p${i}`, answerKind: u.answerKind, view: u.view });
    if (u.answer !== null) keys.set(id, { taskId: id, ref: u.ref, answer: u.answer, razbor: u.razbor, source: u.source });
    void j;
  }),
);
const source = {
  hw: { title: 'Проверка', note: '', dueAt: null, taskNo: 7 },
  tasks,
  recipients: students.map((s) => ({ userId: s, name: s })),
  keys,
  parts: partViews,
};
const clean = (html) => html;
const uchenik = printSpec(source, { list: 'uchenik', grid: false, sanitize: clean, studentId: 'u1' });
const uchitel = printSpec(source, { list: 'uchitel', grid: false, sanitize: clean, studentId: 'u1' });
const zadachiU = uchenik.blocks[0].tasks.map((t) => t.id).join(',');
const zadachiT = uchitel.blocks[0].tasks.map((t) => t.id).join(',');
check(zadachiU === zadachiT && zadachiU !== '', 'лист ученика и лист учителя — одни и те же задачи по порядку');
const kartochnye = new Set(tasks.filter((t) => t.partId === 'p0' || t.partId === 'p1').map((t) => t.id));
check(!uchenik.blocks[0].tasks.some((t) => kartochnye.has(t.id)), 'карточек среди задач листа нет — они отдельной страницей');
const strU = uchenik.extraItems.join('');
const strT = uchitel.extraItems.join('');
check(/data-page-break="1"[^>]*>[\s\S]*Карточки/.test(strU), 'лист ученика: «Карточки» с новой страницы');
check(uchenik.blocks[0].tasks.every((t) => t.solutionHtml === null), 'лист ученика: решений нет');
const oborotSamoocenki = tasks.find((t) => t.answerKind === 'self' && kartochnye.has(t.id))?.view.kartochka?.back ?? '';
check(oborotSamoocenki === '' || !strU.includes(oborotSamoocenki), 'лист ученика: оборота карточки нет');
check(oborotSamoocenki === '' || strT.includes(oborotSamoocenki), 'лист учителя: оборот карточки есть');
check(/Ответы/.test(strT), 'лист учителя: раздел «Ответы»');

console.log(`Сборка ДЗ и печать: ${checks} проверок, не прошло ${failures.length}.`);
if (failures.length > 0) {
  for (const f of failures) console.error(`  НЕТ ${f}`);
  process.exit(1);
}
