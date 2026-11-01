#!/usr/bin/env node
/* scripts/verify_schemes/index.mjs — все проверки ключевых схем №18.

   Каждая схема — свой файл с proverit(N): N случайных невырожденных
   конфигураций (по умолчанию 1000), численная проверка каждого
   следствия и шага доказательства, плюс экранная раскладка. Факт,
   который не прошёл проверку, не публикуется: ненулевой код возврата.

   Плюс прогресс схем поверх общей колоды карточек (lib/zadanie18/progress).

   Запуск: pnpm test:skhemy-18 [N] */

import { requireSrc } from '../lib/load-ts.mjs';
import { zerno } from './obshchee.mjs';
import { proverit as bissektrisa } from './bissektrisa.mjs';
import { proverit as kasatelnye } from './kasatelnye.mjs';
import { proverit as mediana } from './mediana.mjs';
import { proverit as menelay } from './menelay.mjs';
import { proverit as opornye } from './opornye.mjs';
import { proverit as teoriya } from './teoriya.mjs';
import { proverit as trenazher } from './trenazher.mjs';
import { proverit as stepenTochki } from './stepenTochki.mjs';
import { proverit as trapecii } from './trapecii.mjs';
import { proverit as ploshchadi } from './ploshchadi.mjs';
import { proverit as pryamyeUgly } from './pryamyeUgly.mjs';
import { proverit as sredlin } from './sredlin.mjs';
import { proverit as trezubec } from './trezubec.mjs';
import { proverit as uglyDugi } from './uglyDugi.mjs';
import { proverit as vpisannyy } from './vpisannyy.mjs';
import { proverit as ravnyeUgly } from './ravnyeUgly.mjs';
import { proverit as sekushchie } from './sekushchie.mjs';
import { proverit as vysoty } from './vysoty.mjs';

const N = Number(process.argv[2] ?? 1000);
let plokho = 0;
for (const proverit of [
  vysoty,
  bissektrisa,
  mediana,
  sekushchie,
  ravnyeUgly,
  pryamyeUgly,
  trezubec,
  uglyDugi,
  vpisannyy,
  sredlin,
  kasatelnye,
  trapecii,
  menelay,
  ploshchadi,
  stepenTochki,
  opornye,
  teoriya,
  trenazher,
]) {
  plokho += proverit(N).plokho;
}

/* Тексты и чертежи согласованы: у каждой собранной схемы есть живой
   чертёж, каждая группа подсветки из следствий и шагов доказательства
   есть у элементов чертежа, шаги построения подписаны. */
const { SOBRANNYE } = requireSrc('content/zadanie18/spisok');
const { zhivayaSkhema18 } = requireSrc('lib/zadanie18/skhemy');
console.log('\nТексты ↔ чертежи');
for (const s of SOBRANNYE) {
  const z = zhivayaSkhema18(s.id);
  if (z === undefined) {
    console.log(`  ✗ ${s.id}: нет живого чертежа`);
    plokho += 1;
    continue;
  }
  const est = new Set();
  const povtorImen = new Set();
  const rnd = zerno(7);
  for (const t of [z.nachalo, ...Array.from({ length: 60 }, () => z.sluchaynaya(rnd))]) {
    /* У схемы с режимами (Менелай / Чева) группы собираются по всем режимам. */
    for (const rezhim of z.rezhimy?.map((m) => m.id) ?? [undefined]) {
      const elementy = z.postroit(t, rezhim).elementy;
      for (const el of elementy) for (const g of el.gruppy ?? []) est.add(g);
      const imena = elementy.filter((el) => el.vid === 'tochka' && el.imya).map((el) => el.imya);
      if (new Set(imena).size !== imena.length) povtorImen.add(rezhim ?? '—');
    }
  }
  const nuzhny = [...s.sledstviya, ...s.dokazatelstvo].flatMap((x) => x.gruppy);
  const net = [...new Set(nuzhny)].filter((g) => !est.has(g));
  const pustye = [...s.sledstviya, ...s.dokazatelstvo].filter((x) => x.gruppy.length === 0).length;
  /* Группа режима должна включать свой режим: иначе подсветка её не покажет. */
  const chuzhie = (z.rezhimy ?? []).flatMap((m) =>
    m.gruppy.filter(
      (g) => !z.postroit(z.nachalo, m.id).elementy.some((el) => el.gruppy?.includes(g)),
    ),
  );
  const ok =
    net.length === 0 &&
    pustye === 0 &&
    z.shagi.length > 0 &&
    povtorImen.size === 0 &&
    chuzhie.length === 0;
  console.log(
    `  ${ok ? '✓' : '✗'} ${s.no}. ${s.nazvanie}${net.length ? ` — нет групп: ${net.join(', ')}` : ''}${pustye ? ` — пунктов без подсветки: ${pustye}` : ''}${povtorImen.size ? ` — одна буква у двух точек в режиме ${[...povtorImen].join(', ')}` : ''}${chuzhie.length ? ` — группы режима не на его чертеже: ${chuzhie.join(', ')}` : ''}`,
  );
  if (!ok) plokho += 1;
}

/* Прогресс схем — поверх общей колоды карточек №18: статус схемы по
   двум её карточкам, подбор «на сегодня» и «незнакомые». Сама механика
   коробок и интервалов — pnpm test:kartochki. */
const { status18, korobkaSkhemy, kPovtoreniyu, neznakomyh } = requireSrc('lib/zadanie18/progress');
const { kartochkiSkhemy } = requireSrc('lib/zadanie18/kartochki');
const { KOLODY } = requireSrc('content/kartochki/index');
const koloda18 = KOLODY.find((k) => k.task === 18);
const vKolode = new Set((koloda18?.kartochki ?? []).map((k) => k.id));
const bezKartochek = SOBRANNYE.filter((s) => !kartochkiSkhemy(s.id).every((id) => vKolode.has(id)));
if (koloda18 === undefined || bezKartochek.length > 0 || vKolode.size !== SOBRANNYE.length * 2) {
  console.log(`✗ колода №18: нет карточек схем ${bezKartochek.map((s) => s.id).join(', ')}`);
  plokho += 1;
}
const DEN = 864e5;
const T0 = 1e12;
const [ch, sv] = kartochkiSkhemy('x');
const st = [
  status18({}, 'x'),
  status18({ [ch]: { b: 2, n: 1 } }, 'x'),
  status18({ [ch]: { b: 2, n: 1 }, [sv]: { b: 1, n: 1 } }, 'x'),
  status18({ [ch]: { b: 2, n: 1 }, [sv]: { b: 4, n: 3 } }, 'x'),
].join(',');
if (st !== 'new,learning,learning,known') {
  console.log(`✗ статусы схемы: ${st}`);
  plokho += 1;
}
if (korobkaSkhemy({ [ch]: { b: 3, n: 1 }, [sv]: { b: 2, n: 1 } }, 'x') !== 2) {
  console.log('✗ коробка схемы — младшая из двух');
  plokho += 1;
}
const pr = { [ch]: { b: 3, n: 1, t: T0 }, [sv]: { b: 1, n: 1, t: T0 } };
if (kPovtoreniyu(['x', 'y'], pr, T0 + DEN) !== 3 || neznakomyh(['x', 'y'], pr) !== 3) {
  console.log('✗ подбор карточек «на сегодня» / «незнакомые»');
  plokho += 1;
}
console.log(plokho === 0 ? '\nВсе проверки схем №18 пройдены.' : `\nПровалов: ${plokho}`);
process.exit(plokho === 0 ? 0 : 1);
