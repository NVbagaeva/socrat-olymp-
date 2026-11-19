/* scripts/lib/planimetry-hints-otchet.mjs — отчёт аудита подсказок №1
   (docs/audit/planimetry-hints.md): находки «до правок» с пометкой
   «что сделано», находки сейчас и опись обозначений по шагам. */

import { requireSrc } from './load-ts.mjs';
import {
  oboznacheniya,
  opornyeZadachi,
  planyTrenazhera,
  podpisi,
  zadachaTrenazhera,
} from './planimetry-hints.mjs';

const { fakt1, FAKTY_1, VID_FAKTA } = requireSrc('content/spravochnik1/fakty');

const esc = (t) => String(t).replace(/\|/g, '\\|').replace(/\n/g, ' ');
const stroka = (yacheyki) => `| ${yacheyki.map(esc).join(' | ')} |`;

function tablica(shapka, stroki) {
  return [stroka(shapka), stroka(shapka.map(() => '---')), ...stroki.map(stroka)].join('\n');
}

const poryadok = (a, b) =>
  a.razdel.localeCompare(b.razdel) ||
  String(a.gruppa).localeCompare(String(b.gruppa), 'ru', { numeric: true }) ||
  a.shag.localeCompare(b.shag, 'ru', { numeric: true });

const imyaFakta = (id) => {
  const f = fakt1(id);
  return f === undefined ? `нет в реестре: ${id}` : `${VID_FAKTA[f.vid]}: ${f.nazvanie}`;
};

const spisok = (...chasti) => chasti.flat().join(' ') || '—';

/** Опись прототипа: по шагам — обозначения, подписи, новые точки, факт. */
function opisTrenazhera(PROTOTIPY) {
  const plany = planyTrenazhera(0);
  const stroki = [];
  for (const p of PROTOTIPY) {
    const plan = plany.find((x) => x.id === `p${String(p.id).padStart(2, '0')}`);
    if (plan === undefined) continue;
    const z = zadachaTrenazhera(plan);
    const opts = { tochkiSceny: z.tochkiSceny };
    const usl = oboznacheniya(z.uslovie, opts);
    const pu = podpisi(z.scena, z.risunokUsloviya);
    stroki.push([
      z.kod,
      p.id,
      'условие',
      spisok(usl.tochki, usl.velichiny),
      spisok(pu.bukvy),
      '—',
      '—',
    ]);
    const znakomye = new Set(usl.tochki);
    z.voprosy.forEach((v, i) => {
      const o = oboznacheniya([v.vvod ?? '', v.vopros, ...v.knopki, v.poyasnenie].join(' '), opts);
      const pp = podpisi(z.scena, v.optsii);
      const novye = o.tochki.filter((b) => !znakomye.has(b));
      o.tochki.forEach((b) => znakomye.add(b));
      stroki.push([
        z.kod,
        p.id,
        `подсказка ${i + 1}`,
        spisok(o.tochki, o.velichiny),
        spisok(pp.bukvy, pp.znacheniya),
        spisok(novye),
        typeof v.fakt === 'string' ? imyaFakta(v.fakt) : 'без факта',
      ]);
    });
    const pr = podpisi(z.scena, z.risunokResheniya);
    z.shagi.forEach((s, i) => {
      const tekst = [s.zagolovok, ...s.tekst, ...s.formuly.map((f) => `$${f}$`)].join(' ');
      const o = oboznacheniya(tekst, opts);
      stroki.push([
        z.kod,
        p.id,
        `решение ${i + 1}`,
        spisok(o.tochki, o.velichiny),
        spisok(pr.bukvy, pr.znacheniya),
        '—',
        s.fakty.map(imyaFakta).join('; ') || '—',
      ]);
    });
  }
  return stroki;
}

function opisOpornyh() {
  return opornyeZadachi(0).map((t) => {
    const pu = t.g.risunok === null ? null : podpisi(t.g.risunok, { chisla: true });
    const podskazka = t.m.podskazka ?? `$${t.m.formula}$`;
    const o = oboznacheniya(podskazka);
    return [
      t.m.id,
      t.m.nazvanie,
      spisok(o.tochki, o.velichiny),
      pu === null ? 'чертежа нет' : spisok(pu.bukvy, pu.znacheniya),
      typeof t.m.fakt === 'string' ? imyaFakta(t.m.fakt) : 'без факта',
    ];
  });
}

function stolbcyNahodki(x) {
  return [
    x.razdel,
    x.primer,
    x.gruppa,
    x.shag,
    `${x.problema}${x.podrobno ? `: ${x.podrobno}` : ''}`,
    x.zadach,
  ];
}

export function otchet({ do_, posle, PROBLEMY, SDELANO, obshchee, PROTOTIPY, NOVYH, dopolneniya }) {
  const out = [];
  const zadach = posle.zadachTrenazhera + posle.zadachOpornyh;
  const sProblemoy = (x) => ({ ...x, problema: PROBLEMY[x.kod] ?? x.kod });
  out.push('# Аудит подсказок: задание №1 (планиметрия), «Тренажёр» и «Опорные задачи»');
  out.push('');
  out.push(
    'Файл собирает `pnpm audit:planimetry-hints` (scripts/audit-planimetry-hints.mjs). Находки «до правок» — снимок `planimetry-hints-do.json`, снятый до первой правки. Та же проверка без отчёта — `pnpm test:planimetry-hints`: она идёт перед сборкой и в CI.',
  );
  out.push('');
  out.push('## Итог');
  out.push('');
  out.push(
    `- Проверено задач: **${zadach}** — тренажёр ${posle.zadachTrenazhera} (все задачи открытого банка, все аналоги и по ${NOVYH} новые задачи генератора на каждый из ${PROTOTIPY.length} прототипов), опорные задачи ${posle.zadachOpornyh} (90 навыков: зафиксированный вариант и по ${NOVYH} «Ещё вариант»). Буквы сверялись после подстановки варианта (переименование точек, поворот, отражение).`,
  );
  if (do_ !== null) {
    const grupp = new Set(do_.nahodki.map((x) => `${x.razdel}¦${x.gruppa}`)).size;
    out.push(
      `- До правок: **${do_.nahodki.length}** находок (строка — прототип или навык, шаг и вид проблемы) в ${grupp} прототипах и навыках из ${PROTOTIPY.length + 90}.`,
    );
  }
  out.push(`- Сейчас: **${posle.nahodki.length}** находок.`);
  out.push(`- Фактов в реестре: **${Object.keys(FAKTY_1).length}**.`);
  out.push('');
  out.push('### Что сделано в целом');
  out.push('');
  for (const x of obshchee) out.push(`- ${x}`);
  out.push('');
  for (const d of dopolneniya ?? []) {
    out.push(d);
    out.push('');
  }

  if (do_ !== null) {
    out.push('## Находки до правок');
    out.push('');
    const poVidam = new Map();
    for (const x of do_.nahodki) poVidam.set(x.kod, (poVidam.get(x.kod) ?? 0) + 1);
    out.push(
      tablica(
        ['Проблема', 'Строк'],
        [...poVidam].map(([kod, n]) => [PROBLEMY[kod] ?? kod, n]),
      ),
    );
    out.push('');
    out.push(
      'Столбец «Задач» — у скольких проверенных задач прототипа (навыка) находка повторилась; «Задача» — одна из них.',
    );
    out.push('');
    out.push(
      tablica(
        ['Раздел', 'Задача', 'Прототип / навык', 'Шаг', 'Проблема', 'Задач', 'Что сделано'],
        [...do_.nahodki]
          .sort(poryadok)
          .map((x) => [...stolbcyNahodki(sProblemoy(x)), SDELANO(x)]),
      ),
    );
    out.push('');
  }

  out.push('## Находки сейчас');
  out.push('');
  if (posle.nahodki.length === 0) out.push('Находок нет.');
  else {
    out.push(
      tablica(
        ['Раздел', 'Задача', 'Прототип / навык', 'Шаг', 'Проблема', 'Задач'],
        [...posle.nahodki].sort(poryadok).map((x) => stolbcyNahodki(sProblemoy(x))),
      ),
    );
  }
  out.push('');

  out.push('## Опись по шагам: тренажёр');
  out.push('');
  out.push(
    'По одной задаче каждого прототипа (первая в банке или первый аналог): обозначения в тексте шага, подписи на чертеже этого шага, новые точки, которые вводит подсказка, и факт, на который шаг опирается.',
  );
  out.push('');
  out.push(
    tablica(
      [
        'Задача',
        'Прототип',
        'Шаг',
        'Обозначения в тексте',
        'Подписи на чертеже шага',
        'Новые точки',
        'Факт',
      ],
      opisTrenazhera(PROTOTIPY),
    ),
  );
  out.push('');
  out.push('## Опись: опорные задачи');
  out.push('');
  out.push(
    tablica(
      ['Навык', 'Название', 'Обозначения в подсказке', 'Подписи на чертеже', 'Факт'],
      opisOpornyh(),
    ),
  );
  out.push('');
  return `${out.join('\n')}\n`;
}
