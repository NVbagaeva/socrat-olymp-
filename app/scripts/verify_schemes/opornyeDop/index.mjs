#!/usr/bin/env node
/* scripts/verify_schemes/opornyeDop/index.mjs — опорные задачи 7–15 №18,
   проверка независимо от кода сайта.

   Для каждой задачи из content/zadanie18/opornyeDop (в общем списке
   OPORNYE_18 — с 7-й):
     • ответ пункта б) из текста (TeX) и otvetChislo совпадают с ответом,
       вычисленным по данным б) в координатах — фигура строится здесь
       заново, без кода сайта; где ответ не должен зависеть от
       остальных параметров фигуры, она строится в нескольких формах;
     • чертёж (lib/zadanie18/opornyeDop) построен по данным пункта б):
       ответ, посчитанный по его точкам, тот же, и утверждение а) на нём
       верно;
     • утверждение а) — на N случайных фигурах, построенных здесь
       (по умолчанию N = 1000);
     • «Какие схемы здесь»: у каждой схемы есть пояснение.

   Согласованность с чертежом (группы подсветки, экран, ссылки на схемы)
   для всех опорных задач проверяет ../opornye.mjs.

   Запуск: node scripts/verify_schemes/opornyeDop/index.mjs [N]
   (pnpm test:opornye-18 — вместе с ../opornye.mjs). */

import { requireSrc } from '../../lib/load-ts.mjs';
import { ZADACHI as KASATELNYE } from './kasatelnye.mjs';
import { blizko, schetchik, texChislo, zerno } from './obshchee.mjs';
import { ZADACHI as OKRUZHNOST } from './okruzhnost.mjs';
import { ZADACHI as OTNOSHENIYA } from './otnosheniya.mjs';
import { ZADACHI as PLOSHCHADI } from './ploshchadi.mjs';
import { ZADACHI as TRAPECIYA } from './trapeciya.mjs';
import { ZADACHI as TREUGOLNIK } from './treugolnik.mjs';

const PROVERKI = [
  ...TREUGOLNIK,
  ...OKRUZHNOST,
  ...KASATELNYE,
  ...TRAPECIYA,
  ...OTNOSHENIYA,
  ...PLOSHCHADI,
];

export function proverit(N = 1000) {
  const { OPORNYE_18 } = requireSrc('content/zadanie18/opornye');
  const { OPORNYE_18_DOP } = requireSrc('content/zadanie18/opornyeDop/index');
  const { chertezhOpornoy18 } = requireSrc('lib/zadanie18/opornye');

  let plokho = 0;
  const svodka = [];
  const obshchie = schetchik('Опорные задачи 7–15 №18: список');
  const dopId = new Set(OPORNYE_18_DOP.map((o) => o.id));
  obshchie.fakt(
    'у каждой задачи 7–15 своя проверка, и наоборот',
    OPORNYE_18_DOP.length === PROVERKI.length &&
      OPORNYE_18_DOP.every((o) => PROVERKI.some((p) => p.id === o.id)),
    `задач ${OPORNYE_18_DOP.length}, проверок ${PROVERKI.length}`,
  );
  obshchie.fakt(
    'задачи 7–15 — в общем списке подряд за задачами 1–6, id не повторяются',
    OPORNYE_18.filter((o) => dopId.has(o.id)).every((o, i) => o.no === 7 + i) &&
      OPORNYE_18.findIndex((o) => dopId.has(o.id)) === 6 &&
      new Set(OPORNYE_18.map((o) => o.id)).size === OPORNYE_18.length,
  );
  plokho += obshchie.itog();

  for (const o of OPORNYE_18.filter((x) => dopId.has(x.id))) {
    const pr = PROVERKI.find((p) => p.id === o.id);
    const z = chertezhOpornoy18(o.id);
    const sch = schetchik(`№${o.no}. ${o.nazvanie}`);
    if (pr === undefined) {
      sch.fakt('есть проверка', false, o.id);
      plokho += sch.itog();
      continue;
    }

    /* Ответ из текста и числом. */
    let otvet = NaN;
    try {
      otvet = texChislo(o.otvet);
    } catch (e) {
      sch.fakt('ответ — число в TeX', false, String(e.message));
    }
    sch.fakt('ответ числом = ответ в TeX', blizko(otvet, o.otvetChislo, 1e-12), `${o.otvetChislo}`);
    const vychisleno = pr.b(sch);
    sch.fakt(
      `б) ответ ${o.otvet} = ${vychisleno.toFixed(6)}`,
      blizko(otvet, vychisleno, 1e-9),
      `в тексте ${otvet}, вычислено ${vychisleno}`,
    );
    const poChertezhu = pr.nachalo(z.nachalo, sch);
    sch.fakt(
      'чертёж построен по данным б): ответ по его точкам тот же',
      blizko(otvet, poChertezhu, 1e-9),
      `по чертежу ${poChertezhu}`,
    );
    pr.scena(z.nachalo, sch);

    /* Утверждение а): свои случайные фигуры. */
    const rnd = zerno(1800 + o.no);
    for (let i = 0; i < N; i += 1) pr.a(rnd, sch);

    sch.fakt(
      '«Какие схемы здесь»: у каждой схемы пояснение',
      o.zachem !== undefined &&
        o.zachem.length === o.skhemy.length &&
        o.zachem.every((s) => s.length > 0),
    );
    sch.fakt('решение а) и б) по шагам', o.reshenieA.length > 0 && o.reshenieB.length > 0);

    plokho += sch.itog();
    svodka.push(`  ${o.no}. ${o.nazvanie}: ${o.otvet}`);
  }

  console.log('\nОтветы пунктов б) задач 7–15:');
  console.log(svodka.join('\n'));
  return { plokho };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const { plokho } = proverit(Number(process.argv[2] ?? 1000));
  console.log(plokho === 0 ? '\nОпорные задачи 7–15 №18: всё верно.' : `\nПровалов: ${plokho}`);
  process.exit(plokho === 0 ? 0 : 1);
}
