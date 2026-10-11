#!/usr/bin/env node
/* scripts/build-bank-9.mjs — подбор банка задания №9: 20 аналогов на прототип.

   Запуск: pnpm build:bank-9            (BANK9_KANDIDATOV — сколько seed
                                         перебирать на прототип, по умолчанию 700)

   Главный критерий — непохожесть рисунков и условий
   (lib/proizvodnaya/bankPravila.ts, otpechatokRisunka.ts):
   — среди двадцати нет двух с одинаковым отпечатком рисунка: узлы
     кривой, метки, отрезок, касательная, закраска с точностью до сдвига
     и отражения (у задач без рисунка — подпись параметров);
   — форма кривой разная: один класс формы — не больше MAX_V_KLASSE задач;
   — рисунок чист во всех режимах: ученик, подсказка, учитель.
   Ответы:
   — задачи на подсчёт: встречаются все возможные значения (ответы,
     которые генератор даёт хотя бы в 1,5% случаев), ни одно не чаще
     четырёх раз;
   — остальные: не меньше двенадцати различных, ни один не чаще двух раз.

   Подбор идёт в три прохода по кандидатам в порядке seed «9.X.Y#1», …:
   по одной задаче на каждый возможный ответ (покрытие, редкие первыми),
   затем новые ответы, затем добор до двадцати с ограничением повторов.
   Прототип, который правилам не отвечает, попадает в отчёт — решение за
   автором (ISKLYUCHENIYA_BANKA).

   Результат — src/lib/proizvodnaya/bank.ts: только seed, ответов в
   файле нет. Скрипт — единственный, кто пишет этот файл. */

import fs from 'node:fs';
import path from 'node:path';
import { APP, requireSrc } from './lib/load-ts.mjs';

const { PROTOTYPES } = requireSrc('lib/proizvodnaya/prototypes/index');
const { generate } = requireSrc('lib/proizvodnaya/generate');
const { renderFigura, pustoyOtchet } = requireSrc('lib/proizvodnaya/render');
const { otpechatokZadachi, klassFormy } = requireSrc('lib/proizvodnaya/otpechatokRisunka');
const { V_BANKE, MAX_V_KLASSE, SCHETNYE, pravilaOtvetov, ISKLYUCHENIYA_BANKA } = requireSrc(
  'lib/proizvodnaya/bankPravila',
);
const { chislaOtvet } = requireSrc('lib/proizvodnaya/otvet');

const KANDIDATOV = Number(process.env.BANK9_KANDIDATOV ?? 700);
const MAX_SAME_VID = 6;
/* Классы формы считаются у гладких кривых (графики f, F и f′). У задач без
   рисунка, у ломаной и у параболы непохожесть даёт отпечаток. */
const KLASSY_RISUNKA = /^(?:f|F|fprime)\|/;
/** Ответ «возможен», если генератор даёт его хотя бы в такой доле случаев. */
const DOLYA_VOZMOZHNOGO = 0.015;

/** Проблемы рисунка во всех трёх режимах. */
function risunokProblems(fig) {
  const out = [];
  for (const rezhim of ['student', 'hint', 'teacher']) {
    const rep = pustoyOtchet();
    renderFigura(fig, { rezhim }, rep);
    out.push(...rep.problems);
  }
  return out;
}

/** Кандидаты прототипа: seed подряд, с ответом, отпечатком, классом формы. */
function kandidaty(prototype) {
  const out = [];
  for (let i = 1; i <= KANDIDATOV; i += 1) {
    const seed = `${prototype.id}#${i}`;
    let task;
    try {
      task = generate(prototype.id, seed);
    } catch {
      continue;
    }
    out.push({
      seed,
      otvet: chislaOtvet(task.otvet),
      otp: otpechatokZadachi(task),
      klass: klassFormy(task.risunok),
      vid: task.vid ?? '',
      uslovie: task.uslovie,
      risunok: task.risunok,
    });
  }
  return out;
}

/** Подбор двадцати по правилам; возвращает выбранные и описание нарушений. */
function podobrat(prototype, list) {
  const pravila = pravilaOtvetov(prototype.id);
  const chastota = new Map();
  for (const k of list) {
    chastota.set(k.otvet, (chastota.get(k.otvet) ?? 0) + 1);
  }
  const vozmozhnye = [...chastota.entries()]
    .filter(([, n]) => n / list.length >= DOLYA_VOZMOZHNOGO)
    .sort((a, b) => a[1] - b[1])
    .map(([o]) => o);

  const chosen = [];
  const otp = new Set();
  const usloviya = new Set();
  const klassy = new Map();
  const vidy = new Map();
  const otvety = new Map();
  const chistye = new Map();

  const goden = (k, maxPovtor) => {
    if (otp.has(k.otp)) return false;
    if (k.risunok === null && usloviya.has(k.uslovie)) return false;
    if (KLASSY_RISUNKA.test(k.klass) && (klassy.get(k.klass) ?? 0) >= MAX_V_KLASSE) return false;
    if (k.vid !== '' && (vidy.get(k.vid) ?? 0) >= MAX_SAME_VID) return false;
    if ((otvety.get(k.otvet) ?? 0) >= maxPovtor) return false;
    if (k.risunok !== null) {
      if (!chistye.has(k.seed)) chistye.set(k.seed, risunokProblems(k.risunok).length === 0);
      if (!chistye.get(k.seed)) return false;
    }
    return true;
  };
  const vzyat = (k) => {
    chosen.push(k);
    otp.add(k.otp);
    usloviya.add(k.uslovie);
    klassy.set(k.klass, (klassy.get(k.klass) ?? 0) + 1);
    if (k.vid !== '') vidy.set(k.vid, (vidy.get(k.vid) ?? 0) + 1);
    otvety.set(k.otvet, (otvety.get(k.otvet) ?? 0) + 1);
  };

  /* Проход 1: покрытие — по одной задаче на каждый возможный ответ, редкие первыми. */
  for (const o of vozmozhnye) {
    if (chosen.length >= V_BANKE) break;
    const k = list.find((c) => c.otvet === o && goden(c, 1));
    if (k !== undefined) vzyat(k);
  }
  /* Проход 2: новые ответы, пока есть. */
  for (const k of list) {
    if (chosen.length >= V_BANKE) break;
    if (!otvety.has(k.otvet) && goden(k, 1)) vzyat(k);
  }
  /* Проход 3: добор до двадцати с ограничением повторов. */
  for (const k of list) {
    if (chosen.length >= V_BANKE) break;
    if (!chosen.includes(k) && goden(k, pravila.maxPovtor)) vzyat(k);
  }

  const narusheniya = [];
  if (chosen.length < V_BANKE) narusheniya.push(`набрано ${chosen.length} из ${V_BANKE}`);
  const raznyh = otvety.size;
  if (SCHETNYE.has(prototype.id)) {
    const net = vozmozhnye.filter((o) => !otvety.has(o));
    if (net.length > 0) narusheniya.push(`не покрыты ответы ${net.join(', ')}`);
    if (vozmozhnye.length < 6)
      narusheniya.push(`возможных ответов всего ${vozmozhnye.length} (нужно 6–8)`);
  } else if (raznyh < pravila.minRaznyh) {
    narusheniya.push(`различных ответов ${raznyh} (нужно ≥ ${pravila.minRaznyh})`);
  }
  const maxPovtor = Math.max(0, ...otvety.values());
  if (maxPovtor > pravila.maxPovtor) narusheniya.push(`ответ повторяется ${maxPovtor} раз`);
  return {
    chosen,
    narusheniya,
    svodka: `ответов ${raznyh} (возможных ${vozmozhnye.length}), повтор ≤ ${maxPovtor}, классов формы ${klassy.size}`,
  };
}

const started = Date.now();
const entries = [];
const otchet = [];
let bad = 0;
for (const prototype of PROTOTYPES) {
  const list = kandidaty(prototype);
  const { chosen, narusheniya, svodka } = podobrat(prototype, list);
  entries.push({
    prototype: prototype.id,
    variants: chosen.map((k, i) => ({ n: i + 1, seed: k.seed })),
  });
  const isk = ISKLYUCHENIYA_BANKA[prototype.id];
  const status =
    narusheniya.length === 0
      ? 'ок'
      : isk
        ? `исключение: ${isk.prichina}`
        : `НАРУШЕНО: ${narusheniya.join('; ')}`;
  if (narusheniya.length > 0 && !isk) bad += 1;
  otchet.push(`  ${prototype.id}: ${chosen.length} · ${svodka} · ${status}`);
  console.error(`  ${prototype.id}: ${((Date.now() - started) / 1000).toFixed(0)} с`);
}

const lines = [
  '/**',
  ` * Банк задания №9: ${V_BANKE} зафиксированных вариантов на прототип.`,
  ' *',
  ' * Файл собирается скриптом scripts/build-bank-9.mjs (pnpm build:bank-9)',
  ' * и правится только им. Здесь только seed: ответов нет, задача',
  ' * воспроизводится как generate(prototype, seed). Правила подбора —',
  ' * lib/proizvodnaya/bankPravila.ts.',
  ' */',
  '',
  'export interface BankVariant {',
  `  /** Номер варианта: 1…${V_BANKE}. */`,
  '  n: number;',
  '  seed: string;',
  '}',
  '',
  'export interface BankEntry {',
  '  prototype: string;',
  '  variants: BankVariant[];',
  '}',
  '',
  'export const BANK: BankEntry[] = [',
];
for (const entry of entries) {
  lines.push('  {', `    prototype: '${entry.prototype}',`, '    variants: [');
  for (const v of entry.variants) {
    lines.push(`      { n: ${v.n}, seed: '${v.seed}' },`);
  }
  lines.push('    ],', '  },');
}
lines.push('];', '');

const bankPath = path.join(APP, 'src', 'lib', 'proizvodnaya', 'bank.ts');
fs.writeFileSync(bankPath, lines.join('\n'));

const total = entries.reduce((sum, e) => sum + e.variants.length, 0);
console.log(
  `банк №9: ${entries.length} прототипов, ${total} вариантов → ${path.relative(APP, bankPath)}`,
);
console.log(otchet.join('\n'));
if (bad > 0) {
  console.error(`! правилам банка не отвечают ${bad} прототипов (см. выше)`);
  process.exitCode = 1;
}
