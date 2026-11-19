/**
 * Карточка факта планиметрии — та же, что в справочнике: формулировка,
 * формула, чистый чертёж темы и разбор-пример. Собирается из реестра
 * фактов (content/spravochnik1/fakty.ts), то есть из тех же записей,
 * что и страница справочника: копий текста нет.
 *
 * Модуль тяжёлый (справочник, движок чертежей, KaTeX): кнопка
 * «Показать свойство» подгружает его по первому нажатию.
 */

import { FAKT1 } from '../../content/fakty1';
import { VID_FAKTA, fakt1, type VidFakta } from '../../content/spravochnik1/fakty';
import { katex } from '../graph/katex';
import { typeset } from '../tex';
import { renderPlan } from './render';
import { chertezhPrimera, chertezhTemy } from './spravochnik-chertezhi';
import { zadachaPrimera } from './spravochnik-zadachi';
import { vyvodHtml, type ShagVyvodaHtml } from './vyvod';

/** Вид блока → класс цвета рамки (spravochnik1-web.css). */
const KLASS: Record<VidFakta, 'def' | 'svo' | 'pri' | 'teo' | 'prm'> = {
  opredeleniya: 'def',
  svoystva: 'svo',
  priznaki: 'pri',
  teoremy: 'teo',
  priemy: 'prm',
};

export interface PrimerFakta {
  titleHtml: string;
  uslovieHtml: string;
  risunokSvg: string;
  shagi: { etapHtml: string; tekstHtml: string; tex: string[] }[];
  otvetHtml: string;
}

export interface KartochkaFakta1 {
  id: string;
  /** «Определение», «Свойство», «Признак», «Теорема» («Формула», «Таблица»). */
  vid: string;
  klass: 'def' | 'svo' | 'pri' | 'teo' | 'prm';
  /** Почему так: обоснование; пусто — нет. */
  obosnovanieHtml: string;
  /** Вывод вопросами (если у темы есть): свойство — его итог. */
  vyvod: ShagVyvodaHtml[];
  nazvanieHtml: string;
  tekstHtml: string;
  formulaHtml: string;
  dop: { podpisHtml: string; formulaHtml: string } | null;
  /** Чертёж темы: без чисел, только обозначения. */
  risunki: string[];
  primer: PrimerFakta | null;
  /** Тема справочника: «Все свойства → справочник». */
  temaHtml: string;
  temaHref: string;
}

function display(tex: string): string {
  return katex.renderToString(`\\displaystyle ${tex}`, { throwOnError: false, displayMode: false });
}

function podpisVida(vid: VidFakta, nazvanie: string): string {
  if (vid !== 'teoremy') return VID_FAKTA[vid];
  if (nazvanie.startsWith('Формул')) return FAKT1.formula;
  if (nazvanie.startsWith('Таблица')) return FAKT1.tablica;
  return VID_FAKTA.teoremy;
}

/** Карточка факта по id реестра; неизвестный id — null. */
export function kartochkaFakta1(id: string): KartochkaFakta1 | null {
  const f = fakt1(id);
  if (f === undefined) return null;
  const ch = chertezhTemy(f.tema.id);
  const risunki = (Array.isArray(ch) ? ch : [ch]).map((r) =>
    renderPlan(r.scena, { ...r.optsii, shirina: 300, vysota: 190 }),
  );
  const p = f.tema.primery?.[f.primer] ?? f.tema.primery?.[0];
  const nomer = p === undefined ? -1 : (f.tema.primery ?? []).indexOf(p);
  let primer: PrimerFakta | null = null;
  if (p !== undefined) {
    const r = chertezhPrimera(f.tema.id, nomer, p);
    primer = {
      titleHtml: typeset(p.title),
      uslovieHtml: typeset(zadachaPrimera(p).uslovie),
      risunokSvg: renderPlan(r.scena, { ...r.optsii, shirina: 260, vysota: 170 }),
      shagi: p.shagi.map((s) => ({
        etapHtml: typeset(s.etap),
        tekstHtml: s.tekst === undefined ? '' : typeset(s.tekst),
        tex: (s.tex ?? []).map(display),
      })),
      otvetHtml: display(p.otvet),
    };
  }
  return {
    id,
    vid: podpisVida(f.vid, f.nazvanie),
    klass: KLASS[f.vid],
    nazvanieHtml: typeset(f.nazvanie),
    tekstHtml: typeset(f.tekst),
    obosnovanieHtml: f.obosnovanie === undefined ? '' : typeset(f.obosnovanie),
    vyvod: vyvodHtml(f.tema),
    formulaHtml: f.formula === undefined ? '' : display(f.formula),
    dop:
      f.dop === undefined
        ? null
        : { podpisHtml: typeset(f.dop.podpis), formulaHtml: display(f.dop.formula) },
    risunki,
    primer,
    temaHtml: typeset(f.tema.title),
    temaHref: FAKT1.href(f.tema.id),
  };
}
