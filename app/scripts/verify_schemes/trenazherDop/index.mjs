#!/usr/bin/env node
/* scripts/verify_schemes/trenazherDop/index.mjs — перенесённые задачи
   тренажёра №18, проверка независимо от кода сайта.

   Для каждой задачи из content/zadanie18/trenazherDop (в банке TIPY_18 —
   тип с одним вариантом):
     • ответ пункта б) otvet(p) совпадает с ответом, вычисленным по
       данным б) в координатах — фигура строится здесь заново, без кода
       сайта; где ответ не должен зависеть от остальных параметров
       фигуры, она строится в нескольких формах;
     • поле ответа (отпечаток банка) принимает ответ в равносильных
       записях: целое, десятичная дробь через запятую и точку, обычная
       дробь — и не принимает соседние числа;
     • чертёж (lib/zadanie18/trenazher/dop) построен по данным б): ответ,
       посчитанный по его точкам, тот же, и утверждение а) на нём верно;
     • утверждение а) — на N случайных фигурах, построенных здесь
       (по умолчанию N = 1000);
     • подсказка: первый вопрос — про схему-чип задачи, у каждого вопроса
       три разных варианта, верный — одна из схем задачи.

   Банк целиком (отпечатки, группы подсветки на чертеже, экран, чипы)
   проверяет ../trenazher.mjs.

   Запуск: node scripts/verify_schemes/trenazherDop/index.mjs [N]
   (pnpm test:trenazher-18 — вместе с ../trenazher.mjs). */

import { requireSrc } from '../../lib/load-ts.mjs';
import { blizko, schetchik, zerno } from './obshchee.mjs';
import { ZADACHI as KASATELNYE } from './kasatelnye.mjs';
import { ZADACHI as OKRUZHNOST } from './okruzhnost.mjs';
import { ZADACHI as OTNOSHENIYA } from './otnosheniya.mjs';
import { ZADACHI as PLOSHCHADI } from './ploshchadi.mjs';
import { ZADACHI as TRAPECIYA } from './trapeciya.mjs';
import { ZADACHI as TREUGOLNIK } from './treugolnik.mjs';

export const PROVERKI = [
  ...TREUGOLNIK,
  ...OKRUZHNOST,
  ...KASATELNYE,
  ...TRAPECIYA,
  ...OTNOSHENIYA,
  ...PLOSHCHADI,
];

/** Равносильные записи ответа, как их набрал бы ученик. */
function zapisi(x) {
  const out = [];
  if (Number.isInteger(x)) out.push(String(x));
  const des = Math.round(x * 1e6) / 1e6;
  if (!Number.isInteger(x) && blizko(des, x, 1e-12))
    out.push(String(des), String(des).replace('.', ','));
  for (let q = 2; q <= 12; q += 1) {
    const p = Math.round(x * q);
    if (!Number.isInteger(x) && blizko(p / q, x, 1e-12)) {
      out.push(`${p}/${q}`);
      break;
    }
  }
  return out;
}

export function proverit(N = 1000) {
  const { TIPY_18 } = requireSrc('content/zadanie18/trenazher');
  const { ZADACHI_DOP_18 } = requireSrc('content/zadanie18/trenazherDop/index');
  const { SOBRANNYE } = requireSrc('content/zadanie18/spisok');
  const { scena18 } = requireSrc('lib/zadanie18/trenazher/sceny');
  const { bank18 } = requireSrc('lib/zadanie18/trenazher/bank');
  const { otvetVeren18 } = requireSrc('lib/zadanie18/trenazher/otvet');
  const { typeset } = requireSrc('lib/tex');

  let plokho = 0;
  const svodka = [];
  const dop = new Map(ZADACHI_DOP_18.map((z) => [z.id, z]));
  const tipy = TIPY_18.filter((t) => dop.has(t.id));
  const bank = new Map(bank18(typeset).map((z) => [z.key, z]));

  const obshchie = schetchik('Перенесённые задачи тренажёра №18: список');
  obshchie.fakt(
    'у каждой перенесённой задачи своя проверка, и наоборот',
    tipy.length === ZADACHI_DOP_18.length &&
      PROVERKI.length === tipy.length &&
      tipy.every((t) => PROVERKI.some((p) => p.id === t.id)),
    `задач ${tipy.length}, проверок ${PROVERKI.length}`,
  );
  obshchie.fakt(
    'id типов банка не повторяются',
    new Set(TIPY_18.map((t) => t.id)).size === TIPY_18.length,
  );
  obshchie.fakt(
    'пункт а) — «Докажите», пункт б) — «Найдите»',
    tipy.every((t) => {
      const tx = t.tekst(t.varianty[0]);
      return tx.a.startsWith('Докажите') && tx.b.startsWith('Найдите');
    }),
  );
  plokho += obshchie.itog();

  for (const t of tipy) {
    const z = dop.get(t.id);
    const pr = PROVERKI.find((x) => x.id === t.id);
    const sch = schetchik(`${t.id}. ${z.nazvanie} (★${t.uroven})`);
    if (pr === undefined) {
      sch.fakt('есть проверка', false, t.id);
      plokho += sch.itog();
      continue;
    }
    sch.fakt('один набор чисел', t.varianty.length === 1);
    const p = t.varianty[0];
    const otvet = t.otvet(p);

    const vychisleno = pr.b(sch, zerno(1880));
    sch.fakt(
      `б) ответ ${otvet} = ${vychisleno.toFixed(6)}`,
      blizko(otvet, vychisleno, 1e-9),
      `в задаче ${otvet}, вычислено ${vychisleno}`,
    );

    const kartochka = bank.get(`${t.id}#1`);
    const formy = zapisi(otvet);
    sch.fakt(
      `поле ответа принимает: ${formy.join(' | ')}`,
      kartochka !== undefined &&
        formy.length > 0 &&
        formy.every((s) => otvetVeren18(kartochka.key, s, kartochka.seal)),
    );
    sch.fakt(
      'поле ответа не принимает соседние числа',
      kartochka !== undefined &&
        [otvet + 1, otvet * 1.01, -otvet].every(
          (x) => !otvetVeren18(kartochka.key, String(x).replace('.', ','), kartochka.seal),
        ),
    );

    const sc = scena18(t.id, p);
    const poChertezhu = pr.nachalo(sc.nachalo, sch);
    sch.fakt(
      'чертёж построен по данным б): ответ по его точкам тот же',
      blizko(otvet, poChertezhu, 1e-9),
      `по чертежу ${poChertezhu}`,
    );
    pr.scena(sc.nachalo, sch);

    const rnd = zerno(1880 + tipy.indexOf(t) + 1);
    for (let i = 0; i < N; i += 1) pr.a(rnd, sch);

    const voprosy = t.podskazka(p);
    const svoi = z.skhemy.map((s) => SOBRANNYE.find((x) => x.id === s.id)?.nazvanie);
    sch.fakt(
      'подсказка: вопрос на каждую схему, первый — про схему-чип, варианты разные',
      voprosy.length === z.skhemy.length &&
        voprosy[0].options[voprosy[0].correct] ===
          SOBRANNYE.find((x) => x.id === t.skhema)?.nazvanie &&
        voprosy.every(
          (v, i) =>
            v.options.length === 3 &&
            new Set(v.options).size === 3 &&
            v.options[v.correct] === svoi[i] &&
            v.options.filter((o) => svoi.includes(o)).length === 1,
        ),
    );
    sch.fakt(
      'есть доказательство а) и решение б)',
      t.reshenieA(p).length > 0 && t.reshenieB(p).length > 0,
    );

    plokho += sch.itog();
    svodka.push(`  ${t.id} [★${t.uroven}] ${z.nazvanie}: ${otvet}`);
  }

  console.log('\nОтветы пунктов б) перенесённых задач:');
  console.log(svodka.join('\n'));
  return { plokho };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const { plokho } = proverit(Number(process.argv[2] ?? 1000));
  console.log(
    plokho === 0 ? '\nПеренесённые задачи тренажёра №18: всё верно.' : `\nПровалов: ${plokho}`,
  );
  process.exit(plokho === 0 ? 0 : 1);
}
