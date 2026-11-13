#!/usr/bin/env node
/* scripts/build-karta-katalog.mjs — каталог областей «Карты ЕГЭ».

   Запуск: pnpm build:karta-katalog → src/content/karta/katalog.json.
   Что файл не устарел, проверяет pnpm test:karta.

   Для каждого из 20 заданий — группы тем с вкладки «О задании» и типы
   журнала попыток (kind), которые в них входят. Списки собираются из
   реестров прототипов разделов: многие из них серверные (генераторы,
   у №18 и №19 — открытые ответы), поэтому в браузер уходит только этот
   JSON — идентификаторы и названия, ничего больше. Правило «kind →
   группа» у каждого раздела своё и записано здесь же. */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { requireSrc } from './lib/load-ts.mjs';

const APP = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(APP, 'src', 'content', 'karta', 'katalog.json');

const { tasks } = requireSrc('content/tasks.ts');
const nazvanie = (no) => {
  const t = tasks.find((x) => Number(x.no) === no);
  return t.shortTitle ?? t.name;
};

/** Общий тренажёр с фильтрами: ?t=<id темы>. */
const T = (no, gruppa) => `/zadaniya/${no}/trenazher/?t=${gruppa}`;

const razdely = [];
const dobavit = (no, gruppy, trenazher, status = 'gotov') => {
  razdely.push({
    no,
    chast: no <= 13 ? 1 : 2,
    status,
    nazvanie: nazvanie(no),
    gruppy: gruppy.map((g) => ({
      id: g.id,
      nazvanie: g.nazvanie,
      tipy: g.tipy,
      /* Адрес тренажёра сразу с этой группой; null — предвыбора по ссылке нет. */
      trenazher: trenazher === null ? null : trenazher(g),
    })),
  });
};

/* №1: прототипы по блокам I…IX; тема в ссылке — блок. Блок X («ещё темы
   курса») на «О задании» не показывается — и на карту не идёт. */
{
  const { O_ZADANII_1 } = requireSrc('content/zadanie1.ts');
  const { PROTOTIPY } = requireSrc('lib/planimetriya/stseny/index.ts');
  const { klyuchProto } = requireSrc('lib/planimetriya/trenazher/sessiya.ts');
  dobavit(
    1,
    O_ZADANII_1.tipy
      .filter((t) => t.tolkoTrenazher !== true)
      .map((t) => ({
        id: t.blok,
        nazvanie: t.title,
        tipy: PROTOTIPY.filter((p) => p.blok === t.blok).map((p) => klyuchProto(p.id)),
      })),
    (g) => T(1, g.id),
  );
}

/* №2: прототипы A1…C2; группа — первая буква. Ссылкой — один прототип. */
{
  const { TIPY_2 } = requireSrc('content/oZadanii2.ts');
  const { PROTOTYPES } = requireSrc('lib/vektory/prototypes/index.ts');
  dobavit(
    2,
    TIPY_2.gruppy
      .filter((g) => ['A', 'B', 'C'].includes(g.id))
      .map((g) => ({
        id: g.id,
        nazvanie: g.title,
        tipy: PROTOTYPES.filter((p) => p.gruppa === g.id).map((p) => p.id),
      })),
    (g) => `/zadaniya/2/trenazher/?tip=${g.tipy[0]}`,
  );
}

/* №3: прототипы P03-NN по типам, типы по группам. Ссылкой — один тип. */
{
  const { GRUPPY3, prototipyTipa } = requireSrc('content/zadanie3/gruppy.ts');
  dobavit(
    3,
    GRUPPY3.map((g) => ({
      id: g.id,
      nazvanie: g.nazvanie,
      tipy: g.tipy.flatMap((tip) => prototipyTipa(tip)),
      pervyyTip: g.tipy[0],
    })),
    (g) => `/zadaniya/3/trenazher/?tip=${g.pervyyTip}`,
  );
}

/* №4, №5: kind — метод; группа = метод. Ссылка — маршрут метода. */
{
  const { navykiZadaniya } = requireSrc('components/tasks/veroyatnost/metody.ts');
  for (const no of [4, 5]) {
    dobavit(
      no,
      navykiZadaniya(no).map((m) => ({ id: m.id, nazvanie: m.nazvanie, tipy: [m.id] })),
      (g) => `/zadaniya/${no}/trenazher/${g.id}/`,
    );
  }
}

/* №6, №7, №10: прототипы P01… по группам I…V; ссылкой — список прототипов. */
for (const [no, modul] of [
  [6, 'zadanie6'],
  [7, 'zadanie7'],
  [10, 'zadanie10'],
]) {
  const { GROUPS, PROTOTYPES } = requireSrc(`lib/${modul}/prototypes/index.ts`);
  dobavit(
    no,
    GROUPS.map((g) => ({
      id: g.id,
      nazvanie: g.title,
      tipy: PROTOTYPES.filter((p) => p.group === g.id).map((p) => p.id),
    })),
    (g) => `/zadaniya/${no}/trenazher/?tipy=${g.tipy.join(',')}`,
  );
}

/* №8: прототипы 8.A… по группам. Ссылкой — один прототип. */
{
  const { GRUPPY8 } = requireSrc('content/vychisleniya8/gruppy.ts');
  dobavit(
    8,
    GRUPPY8.map((g) => ({ id: g.id, nazvanie: g.nazvanie, tipy: g.prototypes })),
    (g) => `/zadaniya/8/trenazher/?tip=${g.tipy[0]}`,
  );
}

/* №9: прототипы 9.N.M по группам I…V; ссылкой — группа. */
{
  const { GRUPPY, prototypesOfGroup } = requireSrc('lib/proizvodnaya/skills.ts');
  dobavit(
    9,
    GRUPPY.map((g) => ({
      id: g.id,
      nazvanie: g.nazvanie,
      tipy: prototypesOfGroup(g.id).map((p) => p.id),
    })),
    (g) => `/zadaniya/9/trenazher/?g=${g.id}`,
  );
}

/* №11: подтипы РЗ-01… по разделам; разминка в ЕГЭ не входит и на карту не идёт. */
{
  const { SECTIONS } = requireSrc('lib/zadanie11/taxonomy.ts');
  const { SUBTYPES } = requireSrc('lib/zadanie11/prototypes/index.ts');
  dobavit(
    11,
    SECTIONS.filter((s) => s.razminka !== true).map((s) => ({
      id: s.id,
      nazvanie: s.nazvanie,
      tipy: SUBTYPES.filter((p) => p.id.startsWith(`${s.id}-`)).map((p) => p.id),
    })),
    (g) => T(11, g.id),
  );
}

/* №12: наборы 12Q.A… по типам функций. */
{
  const { functionTypes } = requireSrc('data/functionTypes.ts');
  dobavit(
    12,
    functionTypes.map((t) => ({ id: t.id, nazvanie: t.title, tipy: t.bank.prototypes })),
    (g) => `/zadaniya/12/${g.id}/trenazher/`,
  );
}

/* №13: прототипы A-01… по схемам A…D (P-… тренажёр не даёт). */
{
  const { O_ZADANII_13 } = requireSrc('content/zadanie13.ts');
  const { TYPE_NAMES } = requireSrc('lib/zadanie13/types.ts');
  const { PROTOTYPES } = requireSrc('lib/zadanie13/proto/index.ts');
  dobavit(
    13,
    O_ZADANII_13.tipy.map((t) => ({
      id: t.type,
      nazvanie: TYPE_NAMES[t.type],
      tipy: PROTOTYPES.filter((p) => p.type === t.type && /^[A-D]-\d{2}$/.test(p.id)).map(
        (p) => p.id,
      ),
    })),
    (g) => T(13, g.id),
  );
}

/* №14: kind — метод; группы — методы. Предвыбора по ссылке нет. */
{
  const { METODY_14 } = requireSrc('lib/zadanie14/trenazher.ts');
  dobavit(
    14,
    METODY_14.map((m) => ({ id: m.id, nazvanie: m.title, tipy: [m.id] })),
    null,
  );
}

/* №15, №16: раздел есть, тренажёр — заглушка. */
dobavit(15, [], null, 'pozzhe');
dobavit(16, [], null, 'pozzhe');
/* №17, №20: раздела ещё нет. */
dobavit(17, [], null, 'skoro');

/* №18: kind — тип задачи → схема → группа; ссылкой — группа. */
{
  const { GRUPPY_18 } = requireSrc('content/zadanie18/tipy.ts');
  const { TIPY_18 } = requireSrc('content/zadanie18/trenazher.ts');
  const { SPISOK_SKHEM } = requireSrc('content/zadanie18/spisok.ts');
  const gruppaSkhemy = new Map(SPISOK_SKHEM.map((s) => [s.id, s.gruppa]));
  dobavit(
    18,
    GRUPPY_18.map((g) => ({
      id: g.id,
      nazvanie: g.title,
      tipy: TIPY_18.filter((t) => gruppaSkhemy.get(t.skhema) === g.id).map((t) => t.id),
    })),
    (g) => T(18, g.id),
  );
}

/* №19: kind — метод m1…m14; группы — методы. Предвыбора по ссылке нет. */
{
  const { METODY_19 } = requireSrc('content/teoriya19/index.ts');
  const { kind19 } = requireSrc('lib/zadanie19/progress.ts');
  dobavit(
    19,
    METODY_19.map((title, i) => ({ id: kind19(i + 1), nazvanie: title, tipy: [kind19(i + 1)] })),
    null,
  );
}

dobavit(20, [], null, 'skoro');

razdely.sort((a, b) => a.no - b.no);
for (const r of razdely) {
  for (const g of r.gruppy) delete g.pervyyTip;
  const tipy = r.gruppy.flatMap((g) => g.tipy);
  if (r.status === 'gotov' && (r.gruppy.length === 0 || tipy.length === 0)) {
    throw new Error(`№${r.no}: группы или типы пусты`);
  }
  if (new Set(tipy).size !== tipy.length) throw new Error(`№${r.no}: тип в двух группах`);
}

const json = JSON.stringify({ razdely }, null, 1) + '\n';
const bylo = fs.existsSync(OUT) ? fs.readFileSync(OUT, 'utf8') : null;
if (process.argv.includes('--check')) {
  if (bylo !== json) {
    console.error('src/content/karta/katalog.json устарел: pnpm build:karta-katalog');
    process.exit(1);
  }
  console.log('Каталог карты свежий.');
} else {
  fs.writeFileSync(OUT, json);
  for (const r of razdely) {
    console.log(
      `№${r.no} ${r.nazvanie}: ${r.status}, групп ${r.gruppy.length}, типов ${r.gruppy.flatMap((g) => g.tipy).length}`,
    );
  }
}
