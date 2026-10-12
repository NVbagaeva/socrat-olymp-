#!/usr/bin/env node
/* scripts/check-proverka-edinic.mjs — «Проверь себя» в теории единиц
   (№10 и №11): генератор задач и закрытые экземпляры страницы.

   Запуск: pnpm test:proverka-edinic

   На каждый шаблон — 500 экземпляров (seed 0 — числа теории):
   - ровно один верный вариант, четыре варианта, все подписи разные;
   - верный ответ пересчитан независимо: «Сколько минут в 5 ч?» —
     значение условия и верного варианта совпадают с учётом единиц
     (scripts/lib/schet-edinic.mjs), у степеней — значения выражений;
     ни один неверный вариант не равен верному значению;
   - верный ответ «красивый»: целое или конечная дробь, не длиннее
     5 значащих цифр;
   - форматирование: десятичная запятая ({,}), тысячи с тонким
     пробелом (\,) у чисел от 10 000, единицы внутри формулы;
   - у каждого неверного варианта своя подсказка, без верного числа;
   - KaTeX в строгом режиме собирает условие, варианты, подсказки,
     разбор; цепочки разбора пересчитаны;
   - верный вариант не всегда на одном месте.
   Экземпляры страницы: отпечаток совпадает ровно с одним вариантом,
   подсказки и разбор раскрываются. */

import { createRequire } from 'node:module';
import { requireSrc } from './lib/load-ts.mjs';
import { formulyStroki, proveritFormulu, schitat } from './lib/schet-edinic.mjs';

const require = createRequire(import.meta.url);
const katex = require('katex');
const { NABORY_PROVERKI, krasivoe } = requireSrc('lib/teoriya/proverka-edinic');
const { rngOf } = requireSrc('lib/vychisleniya/rng');
const { zadachiProverki, EKZEMPLYAROV } = requireSrc('lib/teoriya/proverka-server');
const { vernyVariant, otkryt } = requireSrc('lib/teoriya/proverka-seal');

const problems = [];
const add = (w, s) => problems.push(`${w}: ${s}`);
const N = 500;

function tex(w, s) {
  for (const f of formulyStroki(s)) {
    try {
      katex.renderToString(f, { throwOnError: true, strict: 'error' });
    } catch (e) {
      add(w, `KaTeX: ${e.message.split('\n')[0]} в «${f}»`);
    }
  }
}

/** Значение подписи варианта / выражения условия в СИ. */
function znach(s) {
  const f = formulyStroki(s);
  if (f.length !== 1) return null;
  const r = schitat(f[0].replace(/=\\;\?$/, ''));
  return r === null ? null : r.v;
}

const blizko = (a, b) => Math.abs(a - b) <= 1e-9 * Math.max(Math.abs(a), Math.abs(b), 1e-300);

let ekz = 0;
for (const [nabor, list] of Object.entries(NABORY_PROVERKI)) {
  for (const sh of list) {
    const mesta = new Set();
    for (let n = 0; n < N; n += 1) {
      const w = `${nabor}/${sh.id} #${n}`;
      let z;
      try {
        z = sh.sozdat(rngOf(`test|${sh.id}|${n}`), n);
      } catch (e) {
        add(w, `не собирается: ${e.message}`);
        continue;
      }
      ekz += 1;
      const verny = z.varianty.filter((v) => v.verno);
      if (z.varianty.length !== 4) add(w, `вариантов ${z.varianty.length}, нужно 4`);
      if (verny.length !== 1) add(w, `верных вариантов ${verny.length}`);
      const podpisi = z.varianty.map((v) => v.tekst);
      if (new Set(podpisi).size !== podpisi.length)
        add(w, `варианты повторяются: ${podpisi.join(' | ')}`);
      mesta.add(z.varianty.findIndex((v) => v.verno));
      tex(w, z.uslovie);
      z.razbor.forEach((r) => {
        tex(w, r);
        for (const f of formulyStroki(r))
          proveritFormulu(f).oshibki.forEach((o) => add(w, `разбор: ${o}`));
      });
      for (const v of z.varianty) {
        tex(w, v.tekst);
        if (/\d\.\d/.test(v.tekst)) add(w, `точка вместо запятой: ${v.tekst}`);
        /* Целая часть от 10 000 — с тонким пробелом по разрядам. */
        if (/\d{5,}/.test(v.tekst.replace(/\{,\}\d+/g, '')))
          add(w, `тысячи без пробела: ${v.tekst}`);
        if (/\d \S*(км|мин|ч|с|м|г|кг)\b/.test(v.tekst.replace(/\$[^$]*\$/g, ''))) {
          add(w, `единица вне формулы: ${v.tekst}`);
        }
        if (!v.verno) {
          if (!v.podskazka) add(w, `нет подсказки к «${v.tekst}»`);
          else {
            tex(w, v.podskazka);
            const otvet = verny[0]?.tekst.match(/\$([^$]*)\$/)?.[1];
            if (sh.tip === 'skolko' && otvet && formulyStroki(v.podskazka).includes(otvet)) {
              add(w, `подсказка выдаёт ответ: ${v.podskazka}`);
            }
          }
        }
      }
      /* Независимый пересчёт. */
      if (sh.tip === 'skolko' && verny[0]) {
        const vz = znach(verny[0].tekst);
        let uz = null;
        const m = z.uslovie.match(/\$([^$]*)\$/g) ?? [];
        if (nabor === 'stepeni') uz = znach(m[0] ?? '');
        else uz = znach(m[0] ?? '');
        if (vz === null || uz === null) add(w, `не пересчитать: ${z.uslovie} → ${verny[0].tekst}`);
        else {
          if (!blizko(vz, uz))
            add(w, `неверный «верный»: ${z.uslovie} → ${verny[0].tekst} (${uz} ≠ ${vz})`);
          for (const v of z.varianty.filter((x) => !x.verno)) {
            const x = znach(v.tekst);
            if (x !== null && blizko(x, vz)) add(w, `неверный вариант равен верному: ${v.tekst}`);
          }
        }
        if (z.znachenie !== undefined && !krasivoe(z.znachenie))
          add(w, `ответ не «красивый»: ${z.znachenie}`);
      }
      if (sh.tip === 'deystvie' && verny[0]) {
        /* «Что делаем?»: верное действие согласно разбору. */
        const umnozh = /умножаем/.test(z.razbor[0] ?? '');
        if (umnozh !== verny[0].tekst.startsWith('умножить'))
          add(w, `действие не совпадает с разбором`);
      }
    }
    if (mesta.size < 3)
      add(`${nabor}/${sh.id}`, `верный вариант почти всегда на одном месте: ${[...mesta]}`);
  }
}

/* Экземпляры страницы: отпечаток и закрытые тексты. */
let stranic = 0;
for (const nabor of Object.keys(NABORY_PROVERKI)) {
  for (const z of zadachiProverki(nabor)) {
    if (z.ekzemplyary.length < 4 || z.ekzemplyary.length > EKZEMPLYAROV) {
      add(z.id, `экземпляров ${z.ekzemplyary.length}: для «Ещё такое же» мало`);
    }
    const usloviya = new Set();
    for (const e of z.ekzemplyary) {
      stranic += 1;
      usloviya.add(e.uslovie);
      const verno = e.varianty.filter((v) => vernyVariant(e, v.id));
      if (verno.length !== 1) add(e.klyuch, `отпечаток совпал с ${verno.length} вариантами`);
      if (!otkryt(e.razbor, e).includes('prv-itog__p')) add(e.klyuch, 'разбор не раскрывается');
      for (const v of e.varianty) {
        if (!otkryt(v.otklik, e, v.id).includes('prv-itog__p'))
          add(e.klyuch, `отклик ${v.id} не раскрывается`);
      }
    }
    if (usloviya.size !== z.ekzemplyary.length) {
      add(
        z.id,
        `«Ещё такое же» повторяет числа: ${usloviya.size} разных из ${z.ekzemplyary.length}`,
      );
    }
  }
}

console.log(
  `Шаблонов: ${Object.values(NABORY_PROVERKI).flat().length}, экземпляров проверено: ${ekz}.`,
);
console.log(`Экземпляров страницы: ${stranic}, отпечатки и закрытые тексты в порядке.`);
if (problems.length > 0) {
  console.error(`\nПроблем: ${problems.length}`);
  problems.slice(0, Number(process.env.VSE ?? 60)).forEach((p) => console.error(`  ${p}`));
  process.exit(1);
}
console.log('«Проверь себя»: все проверки пройдены.');
