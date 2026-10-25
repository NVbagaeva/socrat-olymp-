#!/usr/bin/env node
/* scripts/check-generator.mjs — общий генератор листов (components/generator/).

   Запуск: pnpm test:generator

   Проверяет логику и подключение разделов (№11, №1, №2, №8, №9, №6, №7, №10, №12) без браузера:
     1. Каждый пресет даёт годное состояние: есть задачи, не больше
        ограничений конфига, темы есть в выбранном источнике.
     2. Один seed — один лист: лист собирается дважды одинаково, листы
        ученика и учителя состоят из тех же задач в том же порядке.
     3. Лист ученика без ответов, решений и служебных пометок; лист
        учителя без пометок «банк»/«новая» у задач, источник — строкой.
     4. Ссылка на набор открывает то же состояние (план, источник,
        уровни, варианты, seed, замены).
     5. Изменения состава: степпер темы, смена уровней, источника,
        удаление задачи — ограничения соблюдаются, темы не пропадают.
     6. Задачи на местах: добавление темы, «Убрать», перестановка,
        «−» и «+», смена уровней не меняют остальные задачи; замены
        остаются у своих позиций; лист печати — тот же, что на экране.
     7. Старые адреса листов (прежний генератор) открываются тем же
        листом, что был напечатан.
     8. «Дополнительно»: рамка теории, примеры, QR-код, вид работы,
        дата и учитель попадают в ссылку и на оба листа; задачи от них
        не меняются, примеры не повторяют задачи листа.

   Ненулевой код возврата — проверка не прошла. */

import { requireSrc } from './lib/load-ts.mjs';

const { dannyeTrenazhera } = requireSrc('lib/zadanie11/trenazher/dannye.ts');
const G = requireSrc('lib/generator/obshchiy/state.ts');
const A = requireSrc('lib/zadanie11/generator11.ts');
const S11 = requireSrc('lib/zadanie11/sheet11.ts');
const { dannyeTrenazhera1 } = requireSrc('lib/planimetriya/trenazher/dannye.ts');
const A1 = requireSrc('lib/planimetriya/generator1.ts');
const S1 = requireSrc('lib/planimetriya/sheet1.ts');
const A2 = requireSrc('lib/vektory/generator2.ts');
const S2 = requireSrc('lib/vektory/sheet2.ts');
const A8 = requireSrc('lib/vychisleniya/generator8.ts');
const S8 = requireSrc('lib/vychisleniya/sheet8.ts');
const A9 = requireSrc('lib/proizvodnaya/generator9.ts');
const S9 = requireSrc('lib/proizvodnaya/sheet9.ts');
const typo = requireSrc('lib/sheet/typography.js');
const C12 = requireSrc('lib/ves12/generator12.ts');
const E12 = requireSrc('lib/ves12/engine12.ts');
const G12 = requireSrc('lib/generatorSheet.ts');
const { GEN_UI } = requireSrc('content/generatorUi.ts');
const fs = await import('node:fs');
const { createElement } = await import('react');
const { renderToStaticMarkup } = await import('react-dom/server');

let failed = 0;
let checks = 0;
function ok(cond, what) {
  checks += 1;
  if (!cond) {
    failed += 1;
    console.error(`  ✗ ${what}`);
  }
}
const okTop = ok;

const { razdely, bank } = dannyeTrenazhera();
const config = A.config11(razdely, '/zadaniya/11');
const engine = A.engine11(config, razdely, bank, '/zadaniya/11');
const SEEDS = ['7K3F', 'Q2M8', '0000', 'ZZZZ', 'A1B2'];

/* Разделы на общем генераторе: адаптер, лист и что у них своё. */
const d1 = dannyeTrenazhera1();
const config1 = A1.config1(d1.razdely, '/zadaniya/1');
const RAZDELY = [
  {
    name: '№11',
    config,
    engine,
    params: (st) => A.paramsIzSostoyaniya(st, config),
    parse: (q) => S11.parseSheetQuery11(q),
    query: (p) => S11.sheetQuery11(p),
    sobrat: (p) => S11.sobratList(p, bank),
    spec: (p, list, vid, qr) => S11.sheetSpec11(p, list, vid, qr),
    primery: (p, list) =>
      Object.values(list.primery ?? {})
        .flat()
        .map((x) => x.questionHtml),
    badge: 'z11-sheet-badge',
    ist: 'z11-sheet-istochnik',
    old: 'm=v&i=m&s=PR-04:2,VD-05:1&v=3&seed=K7Q2&z=2.1:1',
    oldIds: 'PR-04,PR-04,VD-05',
    urok: 'm=r&r=2',
  },
  {
    name: '№1',
    config: config1,
    engine: A1.engine1(config1, d1.razdely, d1.bank, '/zadaniya/1'),
    params: (st) => A1.paramsIzSostoyaniya(st, config1),
    parse: (q) => S1.parseSheetQuery1(q),
    query: (p) => S1.sheetQuery1(p),
    sobrat: (p) => S1.sobratList(p, d1.bank),
    spec: (p, list, vid, qr) => S1.sheetSpec1(p, list, vid, qr),
    primery: (p, list) =>
      [...S1.ramkiLista(p, list).values()].flatMap((r) => r.primery.map((x) => x.conditionHtml)),
    badge: 'z1-sheet-badge',
    ist: 'z1-sheet-istochnik',
    /* Прежний генератор №1: рамка теории с одним примером (f=1). */
    old: 'm=v&i=m&s=p01:2,p05:1&v=3&seed=K7Q2&z=2.1:1&f=1',
    oldIds: 'p01,p01,p05',
    urok: 'm=u&i=m&u=2&k=K7Q2AA&seed=K7Q2',
  },
  (() => {
    const config2 = A2.config2('/zadaniya/2');
    /* У №2 нет «сборки» — лист строится по вариантам; задачи только генерируются. */
    const sobrat = (p) => ({
      poVariantam: S2.sheetVariants2(p, true).map((blocks) => blocks.flatMap((b) => b.tasks)),
    });
    return {
      name: '№2',
      config: config2,
      engine: A2.engine2(config2, '/zadaniya/2'),
      params: (st) => A2.paramsIzSostoyaniya(st, config2),
      parse: (q) => S2.parseSheetQuery2(q),
      query: (p) => S2.sheetQuery2(p),
      sobrat,
      spec: (p, list, vid, qr) => S2.sheetSpec2(p, vid !== 'uchenik', qr),
      primery: () => [],
      badge: 'z2-sheet-badge',
      ist: null,
      ramka: false,
      old: 's=A1,B3&n=5&v=3&seed=K7Q2&t=color&c=1&k=%D0%94%D0%BE%D0%BC%D0%B0%D1%88%D0%BD%D1%8F%D1%8F+%D1%80%D0%B0%D0%B1%D0%BE%D1%82%D0%B0',
      oldIds: 'A1,A1,A1,B3,B3',
      urok: 's=A1,B2&bank=1&t=color&c=1',
    };
  })(),
  (() => {
    const config8 = A8.config8('/zadaniya/8');
    const sobrat = (p) => ({
      poVariantam: S8.sheetVariants8(p, true).map((blocks) => blocks.flatMap((b) => b.tasks)),
    });
    return {
      name: '№8',
      config: config8,
      engine: A8.engine8(config8, '/zadaniya/8'),
      params: (st) => A8.paramsIzSostoyaniya(st, config8),
      parse: (q) => S8.parseSheetQuery8(q),
      query: (p) => S8.sheetQuery8(p),
      sobrat,
      spec: (p, list, vid, qr) => S8.sheetSpec8(p, vid !== 'uchenik', qr),
      primery: () => [],
      badge: 'z8-sheet-badge',
      ist: null,
      ramka: false,
      /* Уровень — параметр генерации на весь лист: его смена меняет задачи. */
      urovenNaList: true,
      /* У прежнего листа №8 вариантов не было. */
      old: 's=S1,S5&n=5&l=base&seed=K7Q2&t=color&c=1',
      oldIds: '8.A,8.C,8.D,8.M,8.N',
      oldVariants: 1,
      urok: null,
    };
  })(),
  (() => {
    const config9 = A9.config9('/zadaniya/9');
    const sobrat = (p) => ({
      poVariantam: S9.sheetVariants9(p, true).map((blocks) => blocks.flatMap((b) => b.tasks)),
    });
    return {
      name: '№9',
      config: config9,
      engine: A9.engine9(config9, '/zadaniya/9'),
      params: (st) => A9.paramsIzSostoyaniya(st, config9),
      parse: (q) => S9.parseSheetQuery9(q),
      query: (p) => S9.sheetQuery9(p),
      sobrat,
      spec: (p, list, vid, qr) => S9.sheetSpec9(p, vid !== 'uchenik', qr),
      /* Примеры — в записи листа (заглушки формул), как и задачи листа. */
      primery: (p) =>
        p.groups.flatMap((g) =>
          S9.ramkiGruppy9(g, p).primery.map((x) => typo.mathText(x.uslovie) + (x.figureSvg ?? '')),
        ),
      /* Задачи «по рисунку» с одним текстом различаются рисунком (учителя — как у примера). */
      primerKey: (z) => z.questionHtml + (z.figureSvg ?? ''),
      badge: 'z9-sheet-badge',
      ist: null,
      /* Рамка «Запомни» и примеры — куски потока блока, а не recap. */
      ramkaNaListe: (blocks) =>
        blocks.some((x) => (x.leadItems ?? []).some((i) => i.includes('sheet-zapomni'))) &&
        blocks.some((x) => (x.leadItems ?? []).some((i) => i.includes('sheet-example'))),
      /* Формулы листа — заглушки; на экране они набраны KaTeX, рисунок — ученика. */
      vopros: (t) => A9.nabrat(t.questionHtml),
      figura: (t) => t.figureCondition ?? '',
      old: 'g=I,IV&n=4&seed=K7Q2&t=color&c=1&r=2',
      oldIds: '9.1.1,9.1.2,9.4.1,9.4.2',
      oldVariants: 1,
      urok: null,
    };
  })(),
  /* №6, №7, №10: банк готовых задач, лист печати — React (List6, List7,
     List10). Лист для проверки собирается из той же модели (sborka.ts),
     что рисует страница: задачи, памятка, примеры и шапка. */
  ...['6', '7', '10'].map((z) => {
    const C = requireSrc(`lib/zadanie${z}/generator${z}.ts`);
    const E = requireSrc(`lib/zadanie${z}/engine${z}.ts`);
    const P = requireSrc(`lib/zadanie${z}/protoInfo.ts`);
    const S = requireSrc(`lib/zadanie${z}/sborka.ts`);
    const M = requireSrc(`lib/zadanie${z}/prototypes/index.ts`);
    const T = requireSrc(`content/generator${z}.ts`)[`GENERATOR${z}_TEXTS`];
    const S10 = z === '10' ? requireSrc('lib/zadanie10/sheet10.ts') : null;
    const PR10 = z === '10' ? requireSrc('lib/zadanie10/predprosmotr10.tsx') : null;
    /* Куски листа №10 (sheet10.ts) — без модели: условие и разбор от неё не зависят. */
    const o10 = (kartinki) => ({ proto: M.prototype, ill, kartinki });
    /* Разбор №10 — чертёж моста учителя и шаги, как на листе и в предпросмотре. */
    const Razbor =
      S10 === null
        ? requireSrc(`components/tasks/zadanie${z}/Razbor${z}.tsx`)[`Razbor${z}`]
        : ({ x }) =>
            createElement('div', {
              dangerouslySetInnerHTML: { __html: S10.razbor10(o10(false), x).join('') },
            });
    const Uslovie =
      z === '6' ? requireSrc('components/tasks/zadanie6/Uslovie6.tsx').Uslovie6 : null;
    const ill = z === '10' ? requireSrc('lib/zadanie10/illyustracii.ts').kartinkiPrototipov() : {};
    const { typeset } = requireSrc('lib/tex.ts');
    const dir = new URL(`../public/data/zadanie${z}/`, import.meta.url);
    const indeks = JSON.parse(fs.readFileSync(new URL('indeks.json', dir), 'utf8'));
    const vse = new Map();
    for (const pr of [...new Set(indeks.map((x) => x.p))])
      for (const x of JSON.parse(fs.readFileSync(new URL(`${pr}.json`, dir), 'utf8')))
        vse.set(x.id, x);
    const dannye = {
      indeks: async () => indeks,
      zadachi: async (ps) => new Map([...vse].filter(([, x]) => ps.includes(x.prototypeId))),
    };
    const base = `/zadaniya/${z}`;
    const config = C[`config${z}`](base, P[`protoInfo${z}`](), P[`gruppy${z}`](), indeks);
    const engine =
      z === '10' ? E.engine10(config, base, ill, dannye) : E[`engine${z}`](config, base, dannye);
    /* Условие так же, как в предпросмотре и на листе. */
    const vopros = (x, kartinki = false) => {
      if (PR10 !== null) return PR10.vopros10(o10(kartinki), x);
      if (Uslovie === null) return `<p class="z7-list__uslovie">${typeset(x.text)}</p>`;
      const ris = M.prototype(x.prototypeId).ris(x.params);
      const u = { text: x.text, ...(ris ? { ris } : {}), ...(x.posle ? { posle: x.posle } : {}) };
      return renderToStaticMarkup(createElement(Uslovie, { u }));
    };
    const parse = (q) => {
      const zk = S.parseZaprosKlyuchi(q);
      return zk !== null ? { ...zk, poKlyucham: true } : { ...S.parseZapros(q), poKlyucham: false };
    };
    const model = (p) => (p.poKlyucham ? S.sobratListKlyuchi(p, indeks) : S.sobratList(p, indeks));
    const sobrat = (p) => {
      const m = model(p);
      const zadachi = m.bloki.find((b) => b.id === 'zadachi');
      return {
        model: m,
        poVariantam: zadachi.spiski.map((ids) =>
          ids.map((id) => ({ id, questionHtml: vopros(vse.get(id), m.kartinki === true) })),
        ),
      };
    };
    const den = (iso) => iso.split('-').reverse().join('.');
    return {
      name: `№${z}`,
      config,
      engine,
      params: (st) => parse(new URLSearchParams(engine.hrefs(st).student.split('?')[1])),
      parse,
      query: (p) => (p.poKlyucham ? null : S.zaprosQuery(p)),
      sobrat,
      spec: (p, list, vid, qr) => {
        const m = list.model;
        const teoriya = m.bloki.find((b) => b.id === 'teoriya');
        /* Шапка — из параметров листа: «без QR» проверяется на тех же задачах. */
        const sh = p.poKlyucham ? model(p).shapka : undefined;
        const title = {
          subtitle: sh?.kind ? sh.kind : T.sheet.title,
          ...(sh?.qr ? { qr } : {}),
        };
        const variants = list.poVariantam.map((v) => ({
          title,
          blocks: [
            {
              ...(teoriya?.teoriya ? { recap: { items: teoriya.teoriya } } : {}),
              leadItems: (teoriya?.primery ?? []).map((id) => vopros(vse.get(id), m.kartinki)),
              tasks: v.map((t, i) => ({
                id: t.id,
                no: i + 1,
                questionHtml: t.questionHtml,
                solutionHtml:
                  vid === 'uchenik'
                    ? null
                    : renderToStaticMarkup(
                        createElement(Razbor, {
                          s: M.prototype(vse.get(t.id).prototypeId).solve(vse.get(t.id).params),
                          x: vse.get(t.id),
                        }),
                      ),
              })),
            },
          ],
        }));
        return {
          variants,
          extraItems: [],
          fields: { date: sh?.date ? den(sh.date) : '' },
          head: { author: sh?.uchitel ?? T.sheet.teacher },
        };
      },
      primery: (p, list) =>
        (list.model.bloki.find((b) => b.id === 'teoriya')?.primery ?? []).map((id) =>
          vopros(vse.get(id), list.model.kartinki),
        ),
      badge: `z${z}-sheet-badge`,
      ist: null,
      ramkaNaListe: (blocks) =>
        blocks.some((x) => (x.recap?.items ?? []).length > 0) &&
        blocks.some((x) => (x.leadItems ?? []).length > 0),
      old: {
        6: 't=P01:2,P04:1&i=m&v=3&e=1&st=v&seed=K7Q2',
        7: 't=P01:2,P11:1&i=f&v=3&e=1&seed=K7Q2',
        /* У №10 seed — в «s», картинки сюжетов — «k». */
        10: 'm=g&l=uchitel&t=P01:2,P11:1&i=f&v=3&e=1&k=1&s=K7Q2',
      }[z],
      oldIds: z === '6' ? 'P01,P01,P04' : 'P01,P01,P11',
      urok: z === '10' ? 'm=u&kod=K7Q2AB&u=1' : `kod=K${z}Q2AB&u=1`,
    };
  }),
  /* №12: генератор по всем типам и вкладка подтемы — один адаптер, разные конфиги. */
  ...[
    {
      name: '№12 все типы',
      base: '/zadaniya/12/generator',
      config: C12.config12('/zadaniya/12/generator'),
      title: 'Графики функций',
      old: 's=12.A,12Q.A&n=2&v=3&seed=K7Q2&t=color&c=1&o=types&th=1&pr=1&pp=12.A:1,12Q.A:1',
      oldIds: '12.A,12Q.A',
    },
    {
      name: '№12 подтема',
      base: '/zadaniya/12/quadratic',
      config: C12.config12('/zadaniya/12/quadratic', {
        tip: 'quadratic',
        title: 'Квадратичная функция',
      }),
      title: 'Квадратичная функция',
      old: 's=12Q.A,12Q.B&n=4&l=lucky&v=3&seed=K7Q2&t=color&c=1',
      oldIds: '12Q.A,12Q.A,12Q.B,12Q.B',
    },
  ].map(({ name, base, config: c, title, old, oldIds }) => {
    const spec = (p, withAnswers, qr) => G12.sheetSpec(p, withAnswers, title, qr);
    const sobrat = (p) => {
      const sp = spec(p, true);
      return {
        poVariantam: (sp.variants ?? [{ blocks: sp.blocks }]).map((v) =>
          v.blocks.flatMap((b) => b.tasks),
        ),
      };
    };
    return {
      name,
      config: c,
      engine: E12.engine12(c, base, (q) => `${base}/?${q}`),
      params: (st) => E12.paramsIzSostoyaniya(st, c),
      parse: (q) => G12.parseSheetQuery(q),
      query: (p) => G12.sheetQuery(p),
      sobrat,
      spec: (p, list, vid, qr) => spec(p, vid !== 'uchenik', qr),
      /* Примеры №12 «по рисунку» с одним текстом: сверка условий с задачами
         листа без рисунка давала бы ложные совпадения — её нет. */
      primery: () => [],
      bezSverkiPrimerov: true,
      seeds: ['7K3F', '0000'],
      badge: 'z12-sheet-badge',
      ist: null,
      urovenNaList: true,
      vopros: (t) => E12.voprosPredprosmotra(t),
      old,
      oldIds,
      urok: null,
    };
  }),
];

/** Условие и рисунок задачи листа печати — в записи экрана генератора. */
const voprosOf = (R, t) => (R.vopros ? R.vopros(t) : t.questionHtml);
const figuraOf = (R, t) => (R.figura ? R.figura(t) : (t.figureSvg ?? ''));

function specOf(R, state, vid) {
  const p = R.params(state);
  return R.spec(p, R.sobrat(p), vid);
}
function tasksOf(spec) {
  const blocks = spec.variants ? spec.variants.flatMap((v) => v.blocks) : spec.blocks;
  return blocks.flatMap((b) => b.tasks);
}
const stripTags = (html) => html.replace(/<[^>]+>/g, '');
/** Задачи листа: ключ позиции → условие. */
function byPos(sheet) {
  const out = {};
  /* Задача — условие и рисунок: у задач «по рисунку» текст бывает один. */
  for (const v of sheet.variants)
    for (const t of v) out[t.pos] = t.questionHtml + (t.figureSvg ?? '');
  return out;
}
/** Позиции, что есть в обоих листах, но с разными задачами. */
function diffTasks(a, b) {
  const x = byPos(a);
  const y = byPos(b);
  return Object.keys(x).filter((k) => k in y && x[k] !== y[k]);
}

async function proverit(R) {
  const { config, engine } = R;
  /* №12 — листы с графиками считаются долго: seed меньше, проверки те же. */
  const seeds = R.seeds ?? SEEDS;
  const ok = (cond, what) => okTop(cond, `${R.name} ${what}`);
  /* ── 1–4. Пресеты ──────────────────────────────────────────────── */
  console.log(`Пресеты ${R.name}`);
  for (const preset of config.presets) {
    for (const source of config.sources.map((s) => s.id)) {
      const base = G.stateFromPreset(config, preset, source);
      const label = `${preset.id}/${source}`;
      ok(
        G.problems(config, base).length === 0,
        `${label}: годное состояние (${G.problems(config, base).join(', ')})`,
      );
      ok(G.matchPreset(config, base) === preset.id, `${label}: пресет узнаётся по состоянию`);
      for (const seed of seeds) {
        const state = { ...base, seed };
        const sheet = await engine.build(state);
        const again = await engine.build(state);
        ok(
          sheet.variants.length === state.variants,
          `${label}/${seed}: вариантов ${state.variants}`,
        );
        ok(
          sheet.variants.every((v) => v.length === state.plan.length),
          `${label}/${seed}: задач в варианте ${state.plan.length}`,
        );
        ok(
          JSON.stringify(sheet) === JSON.stringify(again),
          `${label}/${seed}: один seed — один лист`,
        );

        const uch = tasksOf(specOf(R, state, 'uchenik'));
        const tea = tasksOf(specOf(R, state, 'uchitel'));
        ok(uch.length === tea.length, `${label}/${seed}: у ученика и учителя одно число задач`);
        ok(
          uch.every(
            (t, i) =>
              tea[i] !== undefined && t.id === tea[i].id && t.questionHtml === tea[i].questionHtml,
          ),
          `${label}/${seed}: лист ученика и лист учителя — те же задачи в том же порядке`,
        );
        const uchHtml = JSON.stringify(specOf(R, state, 'uchenik'));
        ok(
          uch.every((t) => (t.solutionHtml ?? null) === null) &&
            !new RegExp(`sheet-task-answer|${R.badge}${R.ist === null ? '' : `|${R.ist}`}`).test(
              uchHtml,
            ),
          `${label}/${seed}: на листе ученика нет ответов, решений и пометок`,
        );
        const teaSpec = specOf(R, state, 'uchitel');
        ok(
          !JSON.stringify(teaSpec).includes(R.badge),
          `${label}/${seed}: у задач учителя нет плашек «банк»/«новая»`,
        );
        /* Строка источника — у разделов с открытым банком. */
        if (R.ist !== null)
          ok(
            teaSpec.extraItems.filter((x) => x.includes(R.ist)).length === state.variants,
            `${label}/${seed}: строка источника у каждого варианта`,
          );
        const bankNos = sheet.variants[0].filter((t) => t.fromBank).map((t) => t.no);
        const line = teaSpec.extraItems.find((x) => x.includes(R.ist)) ?? '';
        if (R.ist !== null)
          ok(
            stripTags(line) === GEN_UI.istochnikStroka(bankNos, state.plan.length),
            `${label}/${seed}: строка источника совпадает с задачами банка (${stripTags(line)})`,
          );

        const zameny = {
          [G.posKey(1, state.plan[0])]: 2,
          [G.posKey(state.variants, state.plan[state.plan.length - 1])]: 1,
        };
        const withZ = { ...state, zameny };
        const link = engine.hrefs(withZ).link;
        const back = engine.parse(new URLSearchParams(link.split('?')[1]));
        ok(
          back !== null &&
            JSON.stringify(back.plan) === JSON.stringify(withZ.plan) &&
            back.source === withZ.source &&
            back.variants === withZ.variants &&
            back.seed === withZ.seed &&
            JSON.stringify([...back.levels].sort()) === JSON.stringify([...withZ.levels].sort()) &&
            JSON.stringify(back.zameny) === JSON.stringify(zameny),
          `${label}/${seed}: ссылка на набор открывает то же состояние`,
        );
        const replaced = await engine.build(withZ);
        const changed = diffTasks(sheet, replaced);
        ok(
          changed.every((pos) => pos in zameny) && changed.includes(G.posKey(1, state.plan[0])),
          `${label}/${seed}: замена меняет только заменённые задачи (${changed.join(' ')})`,
        );
        ok(
          (specOf(R, state, 'uchenik').variants ?? [specOf(R, state, 'uchenik')]).every((v) =>
            v.blocks.flatMap((b) => b.tasks).every((t, i) => t.no === i + 1),
          ),
          `${label}/${seed}: номера на листе печати идут по порядку`,
        );
      }
    }
  }

  /* ── 6. Задачи на местах ────────────────────────────────────────── */
  console.log(`Задачи на местах ${R.name}`);
  for (const preset of config.presets) {
    for (const source of config.sources.map((s) => s.id)) {
      for (const seed of seeds.slice(0, 3)) {
        const label = `${preset.id}/${source}/${seed}`;
        const base = { ...G.stateFromPreset(config, preset, source), seed };
        if (preset.pickTopic !== undefined) base.variants = 2;
        const a = await engine.build(base);
        const same = async (plan, what) => {
          const b = await engine.build({ ...base, plan });
          const d = diffTasks(a, b);
          ok(d.length === 0, `${label}: ${what} — остальные задачи на месте (${d.join(' ')})`);
          return b;
        };
        const other = config.topics.find(
          (t) =>
            G.topicAllowed(t, source) &&
            !base.plan.some((s) => G.topicOfSubtype(config, s.id) === t),
        );
        const plus =
          other === undefined
            ? base.plan
            : G.setTopicCount(config, base.plan, other.id, 1, base.levels);
        await same(plus, 'тема добавлена');
        const mid = Math.floor(base.plan.length / 2);
        await same(G.removeAt(base.plan, mid), '«Убрать»');
        const b = await same(G.moveSlot(base.plan, 0, base.plan.length - 1), 'перестановка');
        ok(
          b.variants[0][base.plan.length - 1]?.questionHtml === a.variants[0][0]?.questionHtml,
          `${label}: задача едет вместе с позицией`,
        );
        const lv = G.relayout(config, base.plan, [1]);
        /* У №8 уровень задаёт генерацию всего листа: прежние задачи — только при том же уровне. */
        const kept =
          R.urovenNaList === true && base.levels.join() !== '1'
            ? new Set()
            : new Set(lv.filter((s, i) => G.slotKey(s) === G.slotKey(base.plan[i])).map(G.slotKey));
        const c = await engine.build({
          ...base,
          plan: lv,
          levels: R.urovenNaList ? [1] : base.levels,
        });
        const d = diffTasks(a, c).filter((pos) => kept.has(pos.slice(pos.indexOf('.') + 1)));
        ok(d.length === 0, `${label}: смена уровней не трогает позиции с прежним подтипом`);

        if (base.variants < config.limits.variantsMax) {
          const more = await engine.build({ ...base, variants: base.variants + 1 });
          const dv = diffTasks(a, more);
          ok(dv.length === 0, `${label}: ещё один вариант не меняет прежние (${dv.join(' ')})`);
        }

        /* Замены остаются у своих позиций после правки состава. */
        const pos = G.posKey(base.variants, base.plan[mid]);
        const z1 = { ...base, zameny: { [pos]: 1 } };
        const r1 = byPos(await engine.build(z1));
        const r1plus = byPos(await engine.build({ ...z1, plan: plus }));
        ok(r1plus[pos] === r1[pos], `${label}: замена остаётся после добавления темы`);
        const r2 = byPos(await engine.build({ ...base, zameny: { [pos]: 2 } }));
        ok(
          r1[pos] !== byPos(a)[pos] && r2[pos] !== r1[pos] && r2[pos] !== byPos(a)[pos],
          `${label}: каждая замена даёт новую задачу`,
        );

        /* Лист печати по ссылке — тот же, что на экране. */
        const link = engine.hrefs(z1).link.split('?')[1];
        const p = R.parse(new URLSearchParams(link));
        const printed = R.sobrat(p).poVariantam.flatMap((v) =>
          v.map((t) => voprosOf(R, t) + figuraOf(R, t)),
        );
        const shown = Object.values(r1);
        ok(
          p.poKlyucham === true && JSON.stringify(printed) === JSON.stringify(shown),
          `${label}: лист печати по ссылке совпадает с экраном`,
        );
      }
    }
  }

  /* ── 7. Старые адреса ───────────────────────────────────────────── */
  console.log(`Прежние адреса листов ${R.name}`);
  {
    const q = R.query(R.parse(new URLSearchParams(R.old)));
    const st = engine.parse(new URLSearchParams(q));
    ok(
      st !== null &&
        st.legacy !== undefined &&
        st.plan.map((s) => s.id).join() === R.oldIds &&
        st.variants === (R.oldVariants ?? 3) &&
        st.seed === 'K7Q2',
      'адрес листа прежнего генератора открывается',
    );
    ok(
      st !== null && (config.levels.length === 0 || st.levels.length > 0),
      'уровни выводятся из подтипов, если в адресе их нет',
    );
    const was = R.sobrat(R.parse(new URLSearchParams(q))).poVariantam.flatMap((v) =>
      v.map((t) => voprosOf(R, t)),
    );
    const now =
      st === null
        ? []
        : (await engine.build(st)).variants.flatMap((v) => v.map((t) => t.questionHtml));
    ok(
      JSON.stringify(was) === JSON.stringify(now),
      'прежний адрес в генераторе — тот же лист, что был напечатан',
    );
    if (st !== null) {
      const pOld = R.parse(new URLSearchParams(q));
      const pNow = R.params(st);
      ok(
        JSON.stringify(R.spec(pOld, R.sobrat(pOld), 'uchitel')) ===
          JSON.stringify(R.spec(pNow, R.sobrat(pNow), 'uchitel')),
        'прежний адрес: лист учителя целиком тот же — режим, блоки, рамка',
      );
    }
    ok(
      st !== null && engine.hrefs(st).student.split('?')[1] === q,
      'прежний адрес до правки остаётся прежним',
    );
    if (R.urok !== null)
      ok(
        engine.parse(new URLSearchParams(R.urok)) === null,
        'урок серии генератор не перехватывает',
      );
  }

  /* ── 8. «Дополнительно» ─────────────────────────────────────────── */
  console.log(`«Дополнительно» ${R.name}`);
  {
    const blocksOf = (spec) =>
      spec.variants ? spec.variants.flatMap((v) => v.blocks) : spec.blocks;
    for (const preset of config.presets) {
      for (const seed of SEEDS.slice(0, 2)) {
        const label = `${preset.id}/${seed}`;
        const base = { ...G.stateFromPreset(config, preset, 'mix'), seed };
        const extras = {
          /* У №2 рамок и примеров нет: только вид работы, дата, учитель, QR. */
          theory: R.ramka !== false,
          examples: R.ramka === false ? 0 : 2,
          qr: true,
          kind: 'kr',
          date: '2026-10-24',
          teacher: 'Иванова А.А.',
          urok: 0,
        };
        const st = { ...base, extras };
        const back = engine.parse(new URLSearchParams(engine.hrefs(st).link.split('?')[1]));
        ok(
          back !== null && JSON.stringify(back.extras) === JSON.stringify(extras),
          `${label}: «Дополнительно» в ссылке на набор`,
        );
        /* Пресет может задать вид работы; без «Дополнительно» вовсе — прежний адрес. */
        const plain = { ...base, extras: G.defaultExtras(config) };
        const plainLink = engine.hrefs(plain).link;
        ok(
          engine.parse(new URLSearchParams(plainLink.split('?')[1]))?.extras.theory === false &&
            !/[?&](tr|pr|qr|vr|d|uch)=/.test(plainLink),
          `${label}: без «Дополнительно» адрес прежний`,
        );
        const a = await engine.build(base);
        const b = await engine.build(st);
        ok(diffTasks(a, b).length === 0, `${label}: задачи от «Дополнительно» не меняются`);
        if (R.ramka !== false)
          ok(
            b.variants.every(
              (v) => v[0]?.lead?.includes('gen-recap') && v[0].lead.includes('gen-example'),
            ),
            `${label}: в предпросмотре рамка и примеры перед задачами`,
          );
        const p = R.params(st);
        const list = R.sobrat(p);
        for (const vid of ['uchenik', 'uchitel']) {
          const spec = R.spec(p, list, vid, '<svg></svg>');
          const blocks = blocksOf(spec);
          const titles = spec.variants ? spec.variants.map((v) => v.title) : [spec.title];
          if (R.ramka !== false)
            ok(
              R.ramkaNaListe
                ? R.ramkaNaListe(blocks)
                : blocks.some((x) => x.recap?.items.length > 0) &&
                    blocks.some((x) => (x.leadItems ?? []).length > 0),
              `${label}/${vid}: рамка и примеры на листе`,
            );
          ok(
            titles.every(
              (t) => t.qr === '<svg></svg>' && t.subtitle.startsWith('Контрольная работа'),
            ),
            `${label}/${vid}: QR-код и вид работы в шапке`,
          );
          ok(
            spec.fields.date === '24.10.2026' && spec.head.author === 'Иванова А.А.',
            `${label}/${vid}: дата и учитель`,
          );
          if (vid === 'uchenik')
            ok(
              blocks.flatMap((x) => x.tasks).every((t) => (t.solutionHtml ?? null) === null),
              `${label}: у задач ученика по-прежнему нет решений`,
            );
        }
        const primery = R.primery(p, list);
        const zadachi = new Set(
          list.poVariantam.flat().map((z) => (R.primerKey ? R.primerKey(z) : z.questionHtml)),
        );
        if (R.ramka !== false && R.bezSverkiPrimerov !== true)
          ok(
            primery.length > 0 && primery.every((x) => !zadachi.has(x)),
            `${label}: примеры не повторяют задачи листа (${primery.length})`,
          );
        const noQr = R.spec(
          R.params({ ...st, extras: { ...extras, qr: false } }),
          list,
          'uchenik',
          '<svg></svg>',
        );
        ok(
          (noQr.variants ?? [noQr]).every((v) => (v.title ?? noQr.title).qr === undefined),
          `${label}: без галочки QR-кода нет`,
        );
      }
    }
  }

  /* ── 9. Памятка и пример по виду работы ─────────────────────────── */
  console.log(`Памятка по виду работы ${R.name}`);
  {
    const dop = config.extras;
    const ramka = dop !== undefined && dop.theory !== false;
    const primery = dop !== undefined && dop.examples !== false;
    const BEZ = ['sr', 'pv', 'kr', 'dg', 'zc', 'pe', 'tv'];
    const base = G.stateFromPreset(config, config.presets[0], 'mix');
    for (const kind of Object.keys(GEN_UI.vidyRaboty)) {
      const on = !BEZ.includes(kind);
      const e = G.umolchaniyaPoTipu(config, { ...G.defaultExtras(config), kind }, false);
      ok(
        e.theory === (ramka && on) && e.examples === (primery && on ? 1 : 0),
        `${kind}: памятка и пример по умолчанию ${on ? 'включены' : 'выключены'}`,
      );
      /* Выбор учителя переживает смену вида работы — в обе стороны. */
      const sam = { ...G.defaultExtras(config), kind, theory: !on, examples: on ? 0 : 2 };
      const keep = G.umolchaniyaPoTipu(config, sam, false, { theory: true, examples: true });
      ok(
        keep.theory === !on && keep.examples === (on ? 0 : 2),
        `${kind}: переключённое руками вид работы не меняет`,
      );
      const half = G.umolchaniyaPoTipu(config, sam, false, { theory: true });
      ok(
        half.theory === !on && half.examples === (primery ? (on ? 1 : 0) : sam.examples),
        `${kind}: руками — только памятка, пример по виду работы`,
      );
    }
    /* «По составу»: вариант ЕГЭ — без памятки, «Задания для отработки» — с ней. */
    const ege = G.umolchaniyaPoTipu(config, G.defaultExtras(config), true);
    const otr = G.umolchaniyaPoTipu(config, G.defaultExtras(config), false);
    ok(!ege.theory && ege.examples === 0, 'по составу, вариант ЕГЭ: без памятки и примера');
    ok(otr.theory === ramka, 'по составу, отработка: памятка по умолчанию');
    if (engine.formatEge !== undefined) {
      const odin = config.presets.find((x) => x.pickTopic !== undefined);
      ok(engine.formatEge(base), `${config.presets[0].id}: лист в формате варианта ЕГЭ`);
      if (odin !== undefined)
        ok(
          !engine.formatEge(G.stateFromPreset(config, odin, 'mix')),
          `${odin.id}: одна тема — не вариант ЕГЭ`,
        );
    }
    /* Один код набора: «Контрольная» без памятки, «Домашняя» с ней, задачи те же. */
    const seed = SEEDS[0];
    const kr = {
      ...base,
      seed,
      extras: G.umolchaniyaPoTipu(config, { ...base.extras, kind: 'kr' }, false),
    };
    const dz = {
      ...base,
      seed,
      extras: G.umolchaniyaPoTipu(config, { ...base.extras, kind: 'dz' }, false),
    };
    const a = await engine.build(kr);
    const b = await engine.build(dz);
    ok(diffTasks(a, b).length === 0, 'КР и ДЗ с одним кодом: задачи те же');
    if (ramka) {
      ok(
        a.variants.every((v) => v.every((t) => !t.lead?.includes('gen-recap'))),
        'КР: памятки на листе нет',
      );
      ok(
        b.variants.every((v) => v[0]?.lead?.includes('gen-recap')),
        'ДЗ: памятка на листе есть',
      );
    }
    /* Настройки — вместе с кодом: ссылка на набор возвращает их. */
    const back = engine.parse(new URLSearchParams(engine.hrefs(dz).link.split('?')[1]));
    ok(
      back !== null &&
        back.extras.theory === dz.extras.theory &&
        back.extras.examples === dz.extras.examples,
      'ДЗ: памятка и пример в ссылке на набор',
    );
  }
}

/* GEN_RAZDEL=№12 — только разделы с этим началом имени (отладка; в CI — все). */
const FILTR = process.env.GEN_RAZDEL ?? '';
for (const R of RAZDELY.filter((x) => x.name.startsWith(FILTR))) await proverit(R);

/* ── №8: уровень листа и повторы ────────────────────────────────── */
console.log('№8: уровень и повторы');
{
  const config8 = A8.config8('/zadaniya/8');
  const G8 = requireSrc('lib/vychisleniya/generate.ts');
  const P8 = requireSrc('lib/vychisleniya/prototypes/index.ts');
  const { typeset } = requireSrc('lib/tex.ts');
  const one = config8.presets.find((p) => p.id === 'one');
  for (const [levels, want] of [
    [[1], 'base'],
    [[2], 'advanced'],
    [[1, 2], null],
  ]) {
    const st = { ...G.stateFromPreset(config8, one, 'new'), levels, seed: 'K7Q2' };
    const p = A8.paramsIzSostoyaniya(st, config8);
    okTop(p.level === want, `№8 уровни ${levels.join()} → лист «${want ?? 'любой'}»`);
    const back = A8.engine8(config8, '/zadaniya/8').parse(new URLSearchParams(S8.sheetQuery8(p)));
    okTop(back?.levels.join() === levels.join(), `№8 уровни ${levels.join()} в ссылке на набор`);
  }
  /* Шесть задач одного прототипа в варианте — без одинаковых условий. */
  let dup = 0;
  for (const proto of P8.PROTOTYPES) {
    for (const l of ['base', 'advanced']) {
      for (const seed of SEEDS) {
        const p = S8.parseSheetQuery8(
          new URLSearchParams(`ps=2&s=${proto.id}:6&v=2&l=${l}&seed=${seed}`),
        );
        for (const blocks of S8.sheetVariants8(p, false)) {
          const q = blocks.flatMap((b) => b.tasks).map((t) => t.questionHtml);
          dup += q.length - new Set(q).size;
        }
        /* Уровень доходит до движка: задача позиции — та, что движок даёт на этом уровне. */
        const t = S8.sheetVariants8(p, false)[0][0].tasks[0];
        const g = G8.generate(proto.id, t.id.split('|').slice(1).join('|'), l);
        okTop(
          t.questionHtml === typeset(g.uslovie) && (!G8.hasLevel(proto, l) || g.level === l),
          `№8 ${proto.id}/${l}/${seed}: задача нужного уровня`,
        );
      }
    }
  }
  okTop(dup === 0, `№8: условия одного прототипа в варианте не повторяются (повторов ${dup})`);
}

/* ── №10: «Картинки сюжетов» ──────────────────────────────────── */
console.log('№10: картинки сюжетов');
{
  const R = RAZDELY.find((x) => x.name === '№10');
  const preset = R.config.presets[0];
  for (const seed of SEEDS.slice(0, 3)) {
    const base = { ...G.stateFromPreset(R.config, preset, 'mix'), seed };
    const on = { ...base, extras: { ...base.extras, flag: true } };
    const link = R.engine.hrefs(on).link.split('?')[1];
    const back = R.engine.parse(new URLSearchParams(link));
    okTop(
      new URLSearchParams(link).get('fl') === '1' && back?.extras.flag === true,
      `№10 ${seed}: переключатель в ссылке на набор`,
    );
    okTop(
      R.parse(new URLSearchParams(link)).flag === true &&
        R.sobrat(R.parse(new URLSearchParams(link))).model.kartinki === true &&
        R.sobrat(R.params(base)).model.kartinki === false,
      `№10 ${seed}: картинки на листе только с переключателем`,
    );
    const a = (await R.engine.build(base)).variants.flatMap((v) => v.map((t) => t.solutionHtml));
    const b = (await R.engine.build(on)).variants.flatMap((v) => v.map((t) => t.solutionHtml));
    okTop(
      JSON.stringify(a) === JSON.stringify(b),
      `№10 ${seed}: задачи от переключателя не меняются`,
    );
    okTop(
      (await R.engine.build(on)).variants.some((v) =>
        v.some((t) => t.questionHtml.includes('<picture')),
      ),
      `№10 ${seed}: в предпросмотре есть картинки сюжетов`,
    );
  }
}

/* ── №9: серия уроков по одному коду ───────────────────────────── */
console.log('№9: серия уроков');
{
  const config9 = A9.config9('/zadaniya/9');
  const engine9 = A9.engine9(config9, '/zadaniya/9');
  for (const preset of config9.presets) {
    for (const seed of SEEDS.slice(0, 2)) {
      const base = { ...G.stateFromPreset(config9, preset, 'new'), seed };
      const uroki = [];
      for (let u = 0; u < 3; u += 1) {
        const st = { ...base, extras: { ...base.extras, urok: u } };
        const back = engine9.parse(new URLSearchParams(engine9.hrefs(st).link.split('?')[1]));
        okTop(back?.extras.urok === u, `№9 ${preset.id}/${seed}: урок ${u + 1} в ссылке на набор`);
        uroki.push(Object.values(byPos(await engine9.build(st))));
      }
      /* Банка (20 вариантов на прототип) хватает на три урока пресета. */
      const vse = uroki.flat();
      okTop(
        new Set(vse).size === vse.length,
        `№9 ${preset.id}/${seed}: уроки 1–3 серии не повторяют задачи`,
      );
    }
  }
}

/* ── 5. Изменения состава ───────────────────────────────────────── */
console.log('Изменения состава');
const ege = G.stateFromPreset(config, config.presets[0], 'mix');
{
  let plan = ege.plan;
  for (let i = 0; i < 10; i += 1) plan = G.setTopicCount(config, plan, 'VD', i + 2, ege.levels);
  ok(
    G.countsByTopic(config, plan).VD === config.limits.maxPerTopic,
    'степпер темы не выходит за предел на тип',
  );
  ok(G.problems(config, { ...ege, plan }).length === 0, 'состав в пределах после степпера');
  let big = [];
  for (const t of config.topics)
    big = G.setTopicCount(config, big, t.id, config.limits.maxPerTopic, [1, 2, 3]);
  ok(big.length <= config.limits.maxTasks, `всего задач не больше ${config.limits.maxTasks}`);

  const only3 = G.relayout(config, ege.plan, [3]);
  const c0 = G.countsByTopic(config, ege.plan);
  const c3 = G.countsByTopic(config, only3);
  ok(
    Object.keys(c0).every((k) => c0[k] === c3[k]),
    'смена уровня не выкидывает темы из состава',
  );
  ok(
    only3.every((s) => G.subtypeById(config, s.id) !== undefined),
    'подтипы после смены уровня существуют',
  );

  const bankPlan = G.filterBySource(
    config,
    G.setTopicCount(config, ege.plan, 'RZ', 2, ege.levels),
    'bank',
  );
  ok(!bankPlan.some((s) => s.id.startsWith('RZ-')), 'разминка уходит из состава при «только банк»');

  const removed = G.removeAt(ege.plan, 2);
  ok(removed.length === ege.plan.length - 1, 'удаление убирает одну позицию');
  const gone = G.slotKey(ege.plan[2]);
  const keep = G.slotKey(ege.plan[3]);
  const z = G.pruneZameny({ [`1.${gone}`]: 1, [`1.${keep}`]: 2, [`9.${keep}`]: 1 }, removed, 4);
  ok(
    JSON.stringify(z) === JSON.stringify({ [`1.${keep}`]: 2 }),
    'замены убранной позиции и лишних вариантов уходят, остальные остаются',
  );
  const moved = G.moveSlot(ege.plan, 0, 3);
  ok(
    moved.length === ege.plan.length &&
      G.slotKey(moved[3]) === G.slotKey(ege.plan[0]) &&
      G.slotKey(moved[0]) === G.slotKey(ege.plan[1]),
    'перестановка двигает одну позицию',
  );
  const three = G.setTopicCount(config, ege.plan, 'VD', 3, ege.levels);
  const down = G.setTopicCount(config, three, 'VD', 2, ege.levels);
  const up = G.setTopicCount(config, down, 'VD', 3, ege.levels);
  ok(JSON.stringify(up) === JSON.stringify(three), '«−» и «+» возвращают ту же позицию');
  let many = ege.plan;
  for (let i = 0; i < 4; i += 1) many = G.setSubtypeCount(config, many, 'VD-05', i + 1);
  ok(
    G.problems(config, { ...ege, plan: many }).length === 0 &&
      many
        .filter((s) => s.id === 'VD-05')
        .every((s, i, a) => i === 0 || many.indexOf(a[i - 1]) + 1 === many.indexOf(s)),
    'задачи одного подтипа добавляются подряд, ключи не повторяются',
  );

  const lv = G.changeLevelAt(config, ege.plan, 0, 1);
  ok(
    lv.length === ege.plan.length &&
      G.topicOfSubtype(config, lv[0].id)?.id === G.topicOfSubtype(config, ege.plan[0].id)?.id,
    '«другой уровень» остаётся в той же теме',
  );
  ok(
    G.levelsText([1, 2, 3]) === '★–★★★' &&
      G.levelsText([1, 3]) === '★ и ★★★' &&
      G.levelsText([2]) === '★★',
    'уровни словами',
  );
}

console.log(`\n${checks - failed}/${checks} проверок прошли.`);
if (failed > 0) process.exit(1);
