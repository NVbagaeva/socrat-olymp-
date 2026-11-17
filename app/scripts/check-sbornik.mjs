#!/usr/bin/env node
/* scripts/check-sbornik.mjs — банк «Сборника для вузов» глазами сайта.

   Запуск: pnpm test:sbornik (сборка не нужна).

   Ответы банка пересчитывает sympy (python3 -m tools.sbornik.check);
   здесь — то, что видит ученик:
     1. каждая формула набирается KaTeX без ошибки: условие и текст в $…$,
        формула условия, шаги решения, подсказки, ответ;
     2. движок проверки сайта (lib/sbornik/proverka.ts) по закрытым
        данным, которые уходят в браузер (bank.ts → vKlient), принимает
        верный ответ банка в записи для разбора и в TeX-записи ответа,
        а заведомо неверный (ответ + 1) — отклоняет;
     2а. в данных для браузера нет ни записи ответа, ни верных значений,
        ни текста решения: решение открывается ключом задачи;
     3. у каждого типа главы (content/sbornik.ts) есть файл банка.

   Ненулевой код возврата — расхождение, оно печатается. */

import fs from 'node:fs';
import path from 'node:path';
import katex from 'katex';
import { APP, requireSrc } from './lib/load-ts.mjs';

const { proverit } = requireSrc('lib/sbornik/proverka.ts');
const { vKlient } = requireSrc('lib/sbornik/bank.ts');
const { otkryt } = requireSrc('lib/sbornik/zamok.ts');
const { TIPY } = requireSrc('content/sbornik.ts');

const DATA = path.join(APP, 'src', 'data', 'sbornik');
const failures = [];
let formul = 0;
let otvetov = 0;

function tex(src, where) {
  formul += 1;
  try {
    katex.renderToString(src, { throwOnError: true, strict: 'ignore' });
  } catch (e) {
    failures.push(`${where}: KaTeX: ${e.message.split('\n')[0]}`);
  }
}

function text(s, where) {
  const parts = s.split('$');
  if (parts.length % 2 === 0) failures.push(`${where}: непарный $`);
  for (let i = 1; i < parts.length; i += 2) tex(parts[i], where);
}

/** Ввод ученика из верного ответа: запись для разбора или TeX. */
function vvod(otvet, pole) {
  switch (otvet.vid) {
    case 'chislo':
    case 'vyrazhenie':
      return { vid: 'odno', tex: otvet[pole] };
    case 'kusochnyi':
      return { vid: 'kuski', kuski: otvet.kuski.map((k) => ({ oblast: k.oblast.tex, tex: k[pole] })) };
    case 'chisla':
      return { vid: 'polya', polya: otvet.polya.map((p) => p[pole]) };
    default:
      return null;
  }
}

function isporchennyy(otvet) {
  const plus = (s) => `(${s})+1`;
  switch (otvet.vid) {
    case 'chislo':
    case 'vyrazhenie':
      return { vid: 'odno', tex: plus(otvet.zapis) };
    case 'kusochnyi':
      return {
        vid: 'kuski',
        kuski: otvet.kuski.map((k, i) => ({ oblast: k.oblast.tex, tex: i === 0 ? plus(k.zapis) : k.zapis })),
      };
    case 'chisla':
      return { vid: 'polya', polya: otvet.polya.map((p, i) => (i === 0 ? plus(p.zapis) : p.zapis)) };
    default:
      return null;
  }
}

for (const [glava, tipy] of Object.entries(TIPY)) {
  for (const t of tipy) {
    const file = path.join(DATA, `glava-${glava}`, `tip-${t.id}.json`);
    if (!fs.existsSync(file)) {
      failures.push(`тип ${t.id}: нет файла банка ${path.relative(APP, file)}`);
      continue;
    }
    const list = JSON.parse(fs.readFileSync(file, 'utf8'));
    for (const z of list) {
      const w = z.id;
      text(z.uslovie, `${w} условие`);
      if (z.formula) tex(z.formula, `${w} формула`);
      if (z.dopolnenie) text(z.dopolnenie, `${w} дополнение`);
      z.razbor.forEach((s, i) => {
        text(s.chto, `${w} шаг ${i + 1}`);
        if (s.tex) tex(s.tex, `${w} шаг ${i + 1}`);
      });
      z.podskazki.forEach((p, i) => text(p, `${w} подсказка ${i + 1}`));
      tex(z.otvet.tex, `${w} ответ`);
      if (z.otvet.vid === 'kusochnyi') z.otvet.kuski.forEach((k) => tex(k.oblast.tex, `${w} промежуток`));

      otvetov += 1;
      let k;
      try {
        k = vKlient(z);
      } catch (e) {
        failures.push(`${w}: ${e.message}`);
        continue;
      }
      /* Условие и подсказки открыты и так; смотрим проверку и закрытое. */
      const json = JSON.stringify({ proverka: k.proverka, zakryto: k.zakryto });
      const utechki = [];
      if (/"(zapis|znachenie|tex|razbor|otvet)"/.test(json)) utechki.push('служебное поле');
      for (const s of z.razbor) if (s.tex && s.tex.length > 8 && json.includes(JSON.stringify(s.tex).slice(1, -1))) utechki.push('выкладка решения');
      if (z.otvet.zapis && z.otvet.zapis.length > 3 && json.includes(z.otvet.zapis)) utechki.push('запись ответа');
      if (utechki.length > 0) failures.push(`${w}: в данных для браузера видно: ${utechki.join(', ')}`);
      const otkr = JSON.parse(otkryt(k.zakryto, k.id));
      if (otkr.shagi.length !== z.razbor.length || otkr.otvetTex !== z.otvet.tex) {
        failures.push(`${w}: закрытое решение не открывается`);
      }
      for (const pole of ['zapis', 'tex']) {
        const itog = proverit(vvod(z.otvet, pole), k.proverka);
        if (itog.kind !== 'verno') {
          failures.push(`${w}: верный ответ (${pole}) не принят: ${JSON.stringify(itog)}`);
        }
      }
      if (z.otvet.vid === 'kusochnyi') {
        /* Как показывает сайт: соседние одинаковые куски — объединением. */
        const slito = [];
        for (const k of z.otvet.kuski) {
          const last = slito[slito.length - 1];
          if (last && last.zapis === k.zapis) last.oblast += `\\cup${k.oblast.tex}`;
          else slito.push({ zapis: k.zapis, oblast: k.oblast.tex });
        }
        const itog = proverit({ vid: 'kuski', kuski: slito.map((x) => ({ oblast: x.oblast, tex: x.zapis })) }, k.proverka);
        if (itog.kind !== 'verno') failures.push(`${w}: ответ объединением не принят: ${JSON.stringify(itog)}`);
      }
      const plohoy = proverit(isporchennyy(z.otvet), k.proverka);
      if (plohoy.kind === 'verno') failures.push(`${w}: неверный ответ принят`);
    }
  }
}

/* Разбор промежутков и выколотые точки — по таблице. */
const { razobratPromezhutok } = requireSrc('lib/sbornik/proverka.ts');
const PROMEZHUTKI = [
  ['(-\\infty;3)', { lo: -Infinity, hi: 3, loZakr: false, hiZakr: false }],
  ['\\left[1;5\\right)', { lo: 1, hi: 5, loZakr: true, hiZakr: false }],
  ['(2;+∞)', { lo: 2, hi: Infinity, loZakr: false, hiZakr: false }],
  ['x\\le-1', { lo: -Infinity, hi: -1, loZakr: false, hiZakr: true }],
  ['0<x\\leq\\frac{1}{2}', { lo: 0, hi: 0.5, loZakr: false, hiZakr: true }],
  ['[\\sqrt{2};3]', { lo: Math.SQRT2, hi: 3, loZakr: true, hiZakr: true }],
];
for (const [src, want] of PROMEZHUTKI) {
  const got = razobratPromezhutok(src, 'x');
  if (JSON.stringify(got) !== JSON.stringify(want)) {
    failures.push(`промежуток «${src}»: ${JSON.stringify(got)}, ждали ${JSON.stringify(want)}`);
  }
}

/* Лист генератора собирается шаблоном печати: два варианта, лист учителя.
   Задачи — как их отдаёт файл данных: решение лист открывает сам. */
{
  const { razobratZapros, sobratVarianty, specLista } = requireSrc('lib/sbornik/list.ts');
  const { buildDocument } = requireSrc('lib/sheet/sheet.js');
  const p = razobratZapros(1, new URLSearchParams('t=1.1:2,1.10:1&u=123&v=2&s=proverka'));
  const poTipam = new Map();
  for (const tip of ['1.1', '1.10']) {
    const list = JSON.parse(fs.readFileSync(path.join(DATA, 'glava-1', `tip-${tip}.json`), 'utf8'));
    poTipam.set(
      tip,
      list.map((z) => vKlient(z)),
    );
  }
  const varianty = sobratVarianty(p, poTipam);
  const id1 = varianty[0].flatMap((b) => b.tasks.map((t) => t.id));
  const id2 = varianty[1].flatMap((b) => b.tasks.map((t) => t.id));
  if (id1.length !== 3 || id2.length !== 3) failures.push(`лист: в вариантах ${id1.length} и ${id2.length} задач, ждали 3`);
  if (id1.some((id) => id2.includes(id))) failures.push('лист: задачи вариантов повторяются');
  for (const sOtvetami of [false, true]) {
    try {
      buildDocument(specLista(p, varianty, sOtvetami), {});
    } catch (e) {
      failures.push(`лист ${sOtvetami ? 'учителя' : 'ученика'}: ${e.message}`);
    }
  }
}

for (const f of failures) console.log(f);
console.log(`Сборник: формул ${formul}, ответов ${otvetov}, проблем ${failures.length}.`);
process.exit(failures.length === 0 ? 0 : 1);
