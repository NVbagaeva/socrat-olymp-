/**
 * Справочник по планиметрии (задание №1) для печати и PDF — через
 * конвейер листов генератора (lib/sheet): шапка, подвал с номерами
 * страниц и разбиение на страницы обмером в браузере (paginate.js).
 *
 * Содержание — те же данные, что у веб-страницы (content/spravochnik1),
 * формулы KaTeX и чертежи движка — готовой разметкой на сборке.
 * Лист A4 книжный в две колонки: каждая карточка — один неделимый
 * кусок потока, раздел начинается с новой страницы заголовком на всю
 * ширину и идёт сразу за предыдущим, на первой странице — содержание
 * с номерами страниц, за ним «Как пользоваться».
 *
 * Разборы — отдельные куски потока .spr1p-primer сразу за карточкой:
 * лист «без примеров» снимает их в браузере до раскладки
 * (components/tasks/planimetriya/spravochnik/SpravochnikPdf1.tsx).
 */

import {
  BLOKI_SPRAVOCHNIKA,
  KAK_POLZOVATSYA_1,
  RAZDELY_SPRAVOCHNIKA_1,
  SPRAVOCHNIK_1,
} from '../../content/spravochnik1';
import type { Primer, Razdel1, Tema1, Utverzhdenie } from '../../content/spravochnik1/tipy';
import { SHEET_1 } from '../../content/repetitory1';
import { katex } from '../graph/katex';
import sheet from '../sheet/sheet.js';
import { typeset } from '../tex';
import { renderPlan } from './render';
import { chertezhPrimera, chertezhTemy, type RisunokSpravochnika } from './spravochnik-chertezhi';
import { zadachaPrimera } from './spravochnik-zadachi';

const PDF = SPRAVOCHNIK_1.pdf;

function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * Формула отдельной строкой. Без \displaystyle (он делает из формулы
 * одну группу, и KaTeX не может перенести её в узкой колонке): дроби
 * крупные за счёт \dfrac, перенос — после знака верхнего уровня.
 * Ошибка TeX роняет сборку: в PDF формула обязана собраться.
 */
function formula(tex: string): string {
  return `<span class="spr1p-formula">${katex.renderToString(
    tex.replace(/\\frac(?![a-z])/g, '\\dfrac'),
    {
      throwOnError: true,
      displayMode: false,
      displayFrac: true,
    },
  )}</span>`;
}

function tekst(s: string): string {
  return typeset(s, true);
}

/**
 * Размер рисунка в миллиметрах: высота не больше vysota, ширина не
 * больше shirina; пропорции — по viewBox. Движок ставит SVG инлайновый
 * style="max-width:100%;height:auto" — он заменяется шириной в мм.
 */
function vRazmer(svg: string, vysota: number, shirina: number): string {
  const vb = /viewBox="([-0-9.]+) ([-0-9.]+) ([0-9.]+) ([0-9.]+)"/.exec(svg);
  if (vb === null) return svg;
  const w = Number(vb[3]);
  const h = Number(vb[4]);
  const mm = Math.min(shirina, (vysota * w) / h);
  return svg.replace(
    'style="max-width:100%;height:auto"',
    `style="width:${mm.toFixed(1)}mm;max-width:100%;height:auto"`,
  );
}

/*
 * Холст движка в пикселях на миллиметр печати. Подписи у движка одного
 * кегля в пикселях холста: холст чуть крупнее печатного размера, и
 * курсив подписей на бумаге выходит около 8 pt — как текст карточки.
 */
const PX_NA_MM = 3.78 * 1.05;

/** Рисунки листа с параметрами холста — для самопроверки (сбор по запросу). */
let sbor: { imya: string; risunok: RisunokSpravochnika }[] | null = null;

/** Чертёж: один рисунок или несколько рядом (по два в ряд). */
function chertezh(
  risunki: RisunokSpravochnika[],
  klass: string,
  mm: { vysota: number; shirina: number },
  imya: string,
): string {
  const n = risunki.length;
  const razmer =
    n > 1 ? { vysota: mm.vysota * (n > 2 ? 0.75 : 0.9), shirina: mm.shirina / 2 - 2 } : mm;
  const shirina = Math.round(razmer.shirina * PX_NA_MM);
  const v = Math.round(razmer.vysota * PX_NA_MM);
  return `<div class="spr1p-ris ${klass}${n > 1 ? ' spr1p-ris--neskolko' : ''}">${risunki
    .map((r, i) => {
      const optsii = { ...r.optsii, vysota: v, shirina };
      sbor?.push({ imya: `${klass} ${imya} [${i}]`, risunok: { scena: r.scena, optsii } });
      return `<span class="pl-wrap spr1p-ris__odin">${vRazmer(
        renderPlan(r.scena, optsii),
        razmer.vysota,
        razmer.shirina,
      )}</span>`;
    })
    .join('')}</div>`;
}

function blok(vid: string, label: string, telo: string): string {
  return `<section class="spr1p-blok spr1p-blok--${vid}"><span class="spr1p-blok__label">${esc(
    label,
  )}</span>${telo}</section>`;
}

function utverzhdeniya(spisok: readonly Utverzhdenie[]): string {
  return `<ul class="spr1p-list">${spisok
    .map((u) => `<li>${tekst(u.tekst)}${u.formula === undefined ? '' : formula(u.formula)}</li>`)
    .join('')}</ul>`;
}

function teoremy(t: Tema1): string {
  return `<ul class="spr1p-list">${(t.teoremy ?? [])
    .map(
      (th) =>
        `<li>${th.nazvanie === undefined ? '' : `<strong>${tekst(th.nazvanie)}.</strong> `}${tekst(
          th.slovami,
        )}${formula(th.formula)}${
          th.dop === undefined
            ? ''
            : `<span class="spr1p-dop">${tekst(th.dop.podpis)}:</span>${formula(th.dop.formula)}`
        }</li>`,
    )
    .join('')}</ul>`;
}

function tablica(t: Tema1): string {
  if (t.tablica === undefined) return '';
  const head = t.tablica.head.map((c) => `<th scope="col">${tekst(c)}</th>`).join('');
  const rows = t.tablica.rows
    .map(
      (row) =>
        `<tr>${row
          .map((c, i) => (i === 0 ? `<th scope="row">${tekst(c)}</th>` : `<td>${tekst(c)}</td>`))
          .join('')}</tr>`,
    )
    .join('');
  return `<table class="spr1p-tablica"><thead><tr>${head}</tr></thead><tbody>${rows}</tbody></table>`;
}

/**
 * Разбор компактной рамкой: условие, чертёж слева, шаги справа, ответ.
 * Отдельный кусок потока сразу за карточкой: в колонке он пристраивается
 * к карточке снизу, а если ушёл в следующую колонку — стоит сам по себе
 * со строкой «к теме …».
 */
function primer(t: Tema1, nomer: number, p: Primer): string {
  const temaId = t.id;
  const z = zadachaPrimera(p);
  const otkuda =
    'fipi' in p.istochnik ? SPRAVOCHNIK_1.fipi(p.istochnik.fipi) : SPRAVOCHNIK_1.neIzBanka;
  /* Длинная выкладка в правой колонке рамки (около 45 мм) не
     помещается: тогда чертёж над шагами, шаги во всю ширину. */
  const dlinnaya = p.shagi.some((s) =>
    (s.tex ?? []).some((f) => f.replace(/\\[a-zA-Z]+/g, 'x').replace(/[{}\s^_]/g, '').length > 22),
  );
  const shagi = p.shagi
    .map(
      (s) =>
        `<li><strong class="spr1p-primer__etap">${tekst(s.etap)}.</strong>${
          s.tekst === undefined ? '' : ` ${tekst(s.tekst)}`
        }${(s.tex ?? []).map((f) => formula(f)).join('')}</li>`,
    )
    .join('');
  return `<div class="sheet-item spr1p-pr" data-item-id="p-${esc(temaId)}-${nomer + 1}"><div class="spr1p-primer"><p class="spr1p-primer__tema">${esc(
    PDF.kTeme,
  )} ${tekst(t.title)}</p><p class="spr1p-primer__head"><span class="spr1p-primer__label">${esc(
    BLOKI_SPRAVOCHNIKA.primery,
  )} ${nomer + 1}</span> <strong>${tekst(p.title)}</strong> <span class="spr1p-primer__ist">${esc(
    otkuda,
  )}</span></p><p class="spr1p-primer__uslovie">${tekst(z.uslovie)}</p><div class="spr1p-primer__telo${
    dlinnaya ? ' spr1p-primer__telo--stolbik' : ''
  }">${chertezh(
    [chertezhPrimera(temaId, nomer, p)],
    'spr1p-primer__ris',
    { vysota: 26, shirina: 30 },
    `${temaId}:${nomer}`,
  )}<div class="spr1p-primer__reshenie"><ol class="spr1p-primer__shagi">${shagi}</ol><p class="spr1p-primer__otvet"><span>${esc(
    SPRAVOCHNIK_1.otvet,
  )}:</span> ${formula(p.otvet)}</p></div></div></div></div>`;
}

/**
 * Карточка-тема: неделимый кусок потока одной колонки, за ней —
 * её разборы отдельными кусками.
 */
function kartochka(t: Tema1): string[] {
  const ch = chertezhTemy(t.id);
  const risunki = Array.isArray(ch) ? ch : [ch];
  const bloki = [
    t.opredeleniya === undefined
      ? ''
      : blok('def', BLOKI_SPRAVOCHNIKA.opredeleniya, utverzhdeniya(t.opredeleniya)),
    t.teoremy === undefined ? '' : blok('teo', BLOKI_SPRAVOCHNIKA.teoremy, teoremy(t)),
    t.svoystva === undefined
      ? ''
      : blok('svo', BLOKI_SPRAVOCHNIKA.svoystva, utverzhdeniya(t.svoystva)),
    t.priznaki === undefined
      ? ''
      : blok('pri', BLOKI_SPRAVOCHNIKA.priznaki, utverzhdeniya(t.priznaki)),
  ].join('');
  const niz = [
    t.primenenie === undefined
      ? ''
      : blok(
          'pri-men',
          BLOKI_SPRAVOCHNIKA.primenenie,
          `<ol class="spr1p-list spr1p-list--nomera">${t.primenenie.map((x) => `<li>${tekst(x)}</li>`).join('')}</ol>`,
        ),
    t.vazhno === undefined
      ? ''
      : blok(
          'vaz',
          BLOKI_SPRAVOCHNIKA.vazhno,
          `<ul class="spr1p-list">${t.vazhno.map((x) => `<li>${tekst(x)}</li>`).join('')}</ul>`,
        ),
  ].join('');
  const ege =
    t.prototipy.length === 0
      ? ''
      : `<p class="spr1p-ege">${esc(BLOKI_SPRAVOCHNIKA.prototipy)}: ${t.prototipy
          .map((n) => `№${n}`)
          .join(', ')}</p>`;
  /* Выше колонки (или широкая на сайте) — на всю ширину, блоки в две
     колонки внутри карточки (paginate.js, data-span). */
  const span = t.shirokaya === true ? 'all' : 'auto';
  const karta = `<div class="sheet-item spr1p-card" data-span="${span}" data-item-id="k-${esc(t.id)}"><h3 class="spr1p-card__title">${tekst(
    t.title,
  )}</h3>${bloki}${chertezh(risunki, 'spr1p-card__ris', { vysota: 27, shirina: 80 }, t.id)}${tablica(t)}${niz}${ege}</div>`;
  return [karta, ...(t.primery ?? []).map((p, i) => primer(t, i, p))];
}

/**
 * Заголовок раздела: на всю ширину над колонками и не отдельно от
 * первой карточки (data-keep-with-next) — если она не встаёт под ним,
 * заголовок уходит на новую страницу.
 */
function razdel(r: Razdel1): string {
  return `<div class="sheet-item spr1p-razdel" data-span="all" data-keep-with-next="1" data-item-id="r-${esc(
    r.id,
  )}" data-toc-id="${esc(r.id)}" id="r-${esc(r.id)}"><h2 class="spr1p-razdel__title"><span class="spr1p-razdel__no">${
    r.no
  }.</span> ${tekst(r.title)}</h2><p class="spr1p-razdel__lead">${tekst(r.lead)}</p></div>`;
}

/** Содержание первой страницы: разделы с номерами страниц и их темы. */
function soderzhanie(): string {
  const stroki = RAZDELY_SPRAVOCHNIKA_1.map(
    (r) =>
      `<li class="spr1p-toc__razdel"><a class="spr1p-toc__stroka" href="#r-${esc(r.id)}"><span class="spr1p-toc__no">${
        r.no
      }</span><span class="spr1p-toc__title">${tekst(r.title)}</span><span class="spr1p-toc__tochki"></span><span class="spr1p-toc__str" data-toc-ref="${esc(
        r.id,
      )}">—</span></a><span class="spr1p-toc__temy">${r.temy.map((t) => tekst(t.title)).join(' · ')}</span></li>`,
  ).join('');
  return `<div class="sheet-item spr1p-toc" data-span="all" data-item-id="soderzhanie"><h2 class="spr1p-toc__head">${esc(
    PDF.soderzhanie,
  )}</h2><ol class="spr1p-toc__list">${stroki}</ol></div>`;
}

const VID: Record<string, string> = {
  opredeleniya: 'def',
  svoystva: 'svo',
  priznaki: 'pri',
  teoremy: 'teo',
  vazhno: 'vaz',
  primery: 'primer',
};

/** «Как пользоваться»: легенда цветов блоков и обозначения. */
function kakPolzovatsya(): string {
  const legenda = KAK_POLZOVATSYA_1.legenda
    .map(
      (l) =>
        `<li><span class="spr1p-blok__label spr1p-kak__label spr1p-kak__label--${VID[l.blok]}">${esc(
          BLOKI_SPRAVOCHNIKA[l.blok],
        )}</span> ${tekst(l.tekst)}</li>`,
    )
    .join('');
  return `<div class="sheet-item spr1p-kak" data-span="all" data-item-id="kak-polzovatsya"><h2 class="spr1p-kak__head">${esc(
    KAK_POLZOVATSYA_1.title,
  )}</h2><ul class="spr1p-kak__legenda">${legenda}</ul><p class="spr1p-kak__oboznacheniya"><strong>${esc(
    KAK_POLZOVATSYA_1.oboznacheniya.title,
  )}.</strong> ${tekst(KAK_POLZOVATSYA_1.oboznacheniya.tekst)}</p></div>`;
}

function specIz(html: string): Record<string, unknown> {
  const open = html.indexOf('<script type="application/json" id="sheet-spec">');
  const start = html.indexOf('>', open) + 1;
  const end = html.indexOf('</script>', start);
  return JSON.parse(html.slice(start, end)) as Record<string, unknown>;
}

/** Куски потока по порядку: содержание, легенда, разделы и карточки. */
export function kuskiSpravochnika1(): string[] {
  return [
    soderzhanie(),
    kakPolzovatsya(),
    ...RAZDELY_SPRAVOCHNIKA_1.flatMap((r) => [razdel(r), ...r.temy.flatMap(kartochka)]),
  ];
}

/**
 * Все рисунки печатного справочника с холстом, на котором их рисует
 * лист: самопроверка (spravochnik-selftest.ts) смотрит подписи при
 * печатном размере, а не только при веб-размере.
 */
export function risunkiPechati1(): { imya: string; risunok: RisunokSpravochnika }[] {
  sbor = [];
  try {
    kuskiSpravochnika1();
    return sbor;
  } finally {
    sbor = null;
  }
}

/**
 * Описание листа для paginate.js (то, что buildDocument кладёт в
 * <script id="sheet-spec">) строкой JSON, две колонки. Шапка первой
 * страницы — полная, следующих — в строку: «Справочник по
 * планиметрии · Задание №1 ЕГЭ».
 */
export function specSpravochnika1(): string {
  const head = { ...SHEET_1.head, course: PDF.shapka };
  const html = sheet.buildDocument(
    {
      theme: 'color',
      layout: 'single',
      documentTitle: `${SPRAVOCHNIK_1.title} · ${SHEET_1.title.chip}`,
      head,
      runner: SPRAVOCHNIK_1.title,
      title: { chip: SHEET_1.title.chip, text: SPRAVOCHNIK_1.title, subtitle: SPRAVOCHNIK_1.lead },
      recap: null,
      leadItems: kuskiSpravochnika1(),
      blocks: [],
      foot: SHEET_1.foot,
    },
    {},
  );
  const spec = specIz(html);
  /* Строка шапки следующих страниц: «<b>runner</b> · course». */
  const stroka = specIz(
    sheet.buildDocument(
      {
        theme: 'color',
        layout: 'single',
        head: { ...SHEET_1.head, course: PDF.zadanie },
        runner: SPRAVOCHNIK_1.title,
        title: { chip: '', text: SPRAVOCHNIK_1.title },
        blocks: [],
        foot: SHEET_1.foot,
      },
      {},
    ),
  );
  return JSON.stringify({ ...spec, compactHead: stroka.compactHead, columns: 2 }).replace(
    /<\//g,
    '<\\/',
  );
}
