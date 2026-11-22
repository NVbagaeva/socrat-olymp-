/**
 * Подсказка задания №1 — сценарий вопросов, записанный данными.
 *
 * Подсказка учит рассуждать, а не подсовывает формулу: это цепочка
 * вопросов, которые ученик должен научиться задавать себе сам. Опорные
 * вопросы повторяются от задачи к задаче: «Что дано и что нужно
 * найти?» → «Как использовать это данное?» → «Как обозначить равные или
 * неизвестные величины?» → «Что мы ещё знаем про эти углы, отрезки,
 * площади?» → «Составь уравнение» → «Это уже ответ?» → «Проверка по
 * чертежу».
 *
 * Шаг — вопрос и 2–4 кнопки. Верный ответ: «Да, потому что…» словами,
 * затем формула, и на чертеже появляется то, о чём шаг (слой сцены).
 * Неверный ответ: правильный сразу не показывается — уточнение
 * (мини-объяснение или уточняющие вопросы), и ученик возвращается к
 * тому же вопросу. Правильный ответ с объяснением — после второй ошибки.
 *
 * У задачи может быть несколько способов: подсказка начинается с
 * выбора, после одного способа можно посмотреть другой. В конце —
 * плашка «Приём» со ссылкой на его карточку в теории.
 *
 * Здесь — данные и их сборка в HTML с чертежами шагов. Показ — общий
 * компонент components/tasks/planimetriya/Scenariy1.tsx: тренажёр,
 * опорные задачи, разборы.
 */

import { nazvanieFakta1 } from '../../content/spravochnik1/fakty';
import { typesetKrupno as typeset } from '../tex';
import { katex } from '../graph/katex';
import { renderPlan } from './render';
import type { Optsii, Rezhim, Scena } from './types';

/* ── Данные ──────────────────────────────────────────────────────── */

export interface ShagScenariya {
  /** Перед вопросом: новая точка или величина вводится словами — «Обозначим…». */
  vvod?: string;
  /** Вопрос. Формулы в $…$. */
  vopros: string;
  /** 2–4 кнопки-ответа. */
  knopki: readonly string[];
  verno: number;
  /** После верного ответа: «Да, потому что…» — русскими словами. */
  da: string;
  /** Затем формулы (TeX без $), по строке. */
  formuly?: readonly string[];
  /**
   * После первой ошибки: мини-объяснение. Правильный ответ в нём не
   * называется — ученик возвращается к тому же вопросу.
   */
  utochnenie?: string;
  /** После первой ошибки: уточняющие вопросы, затем снова этот вопрос. */
  podvoprosy?: readonly ShagScenariya[];
  /** Слой сцены, который появляется после верного ответа. */
  sloy?: number;
  /**
   * Слой шага виден уже во время вопроса (подсвечен, без чисел): вопрос
   * про элемент на чертеже — «какой это угол?». По умолчанию слой
   * появляется только после верного ответа.
   */
  pokazatDo?: boolean;
  /** Факт реестра: кнопка «Показать свойство» под шагом. */
  fakt?: string | null;
  /** «В нашей задаче»: факт на буквах этой задачи. */
  vNashey?: string;
}

export interface SposobScenariya {
  /** «Дополнительное построение», «Диагональ и медиана». */
  nazvanie: string;
  /**
   * Кнопка в первом вопросе (Scenariy.vybor): что именно сделать —
   * «Провести через $E$ прямую, параллельную $AD$». Нет — название.
   */
  knopka?: string;
  /** После выбора: «Да, потому что…» — зачем это построение. */
  zachem?: string;
  shagi: readonly ShagScenariya[];
  /** Короткий вывод после способа. */
  vyvod?: string;
}

export interface Scenariy {
  sposoby: readonly SposobScenariya[];
  /**
   * Первый вопрос — выбор хода, а не готовый факт: «Какое
   * дополнительное построение поможет?». Кнопки — построения способов и
   * неудачные варианты; неудачный объясняется, и ученик выбирает снова.
   */
  vybor?: {
    vopros: string;
    nevernye?: readonly { knopka: string; pochemu: string }[];
    /** Слой сцены, который подсвечивается на вопросе (данное: середина). */
    sloy?: number;
  };
  /** Плашка «Приём» в конце: название и карточка теории (id реестра фактов). */
  priem?: { nazvanie: string; fakt: string };
}

/* ── Собранный сценарий: HTML и чертежи ───────────────────────────── */

export interface FaktHtml {
  id: string;
  nazvanieHtml: string;
  vNasheyHtml: string;
}

export interface ShagScenariyaHtml {
  vvodHtml: string;
  voprosHtml: string;
  knopkiHtml: string[];
  verno: number;
  daHtml: string;
  formulyHtml: string[];
  utochnenieHtml: string;
  podvoprosy: ShagScenariyaHtml[];
  /** Чертёж, пока вопрос не решён: построения прежних шагов. */
  risunokDo: string | null;
  /** Чертёж после верного ответа: появилось то, о чём шаг. */
  risunokPosle: string | null;
  fakt: FaktHtml | null;
}

export interface SposobScenariyaHtml {
  nazvanieHtml: string;
  knopkaHtml: string;
  zachemHtml: string;
  shagi: ShagScenariyaHtml[];
  vyvodHtml: string;
}

export interface ScenariyHtml {
  sposoby: SposobScenariyaHtml[];
  /** Первый вопрос — выбор хода; null — «Способ 1 / Способ 2». */
  vybor: {
    voprosHtml: string;
    nevernye: { knopkaHtml: string; pochemuHtml: string }[];
    risunok: string | null;
  } | null;
  priem: { nazvanieHtml: string; fakt: FaktHtml } | null;
}

function display(tex: string): string {
  return katex.renderToString(`\\displaystyle ${tex}`, { throwOnError: false, displayMode: false });
}

export interface ChertezhScenariya {
  scena: Scena;
  /** Вариант, alt, размер: как у остальных чертежей задачи. */
  optsii?: Omit<Optsii, 'rezhim' | 'sposob'>;
}

/**
 * Собрать сценарий: тексты набрать KaTeX (ren — переименование букв
 * варианта), для каждого шага построить чертёж до и после ответа.
 * Чертёж шага — слои сцены до слоя шага в своём способе.
 */
export function sobratScenariy(
  sc: Scenariy,
  chertezh: ChertezhScenariya | null,
  ren: (t: string) => string = (t) => t,
): ScenariyHtml {
  const fakt = (id: string, vNashey?: string): FaktHtml => ({
    id,
    nazvanieHtml: typeset(nazvanieFakta1(id)),
    vNasheyHtml: vNashey === undefined ? '' : typeset(ren(vNashey)),
  });
  const kesh = new Map<string, string>();
  const risunok = (sloy: number, sposob: number, vopros = false): string | null => {
    if (chertezh === null) return null;
    const k = `${sloy}|${sposob}|${vopros}`;
    const est = kesh.get(k);
    if (est !== undefined) return est;
    const rezhim: Rezhim =
      sloy <= 0
        ? { rezhim: 'uchenik' }
        : vopros
          ? { rezhim: 'podskazka', shag: sloy, vopros: true }
          : { rezhim: 'podskazka', shag: sloy };
    const svg = renderPlan(chertezh.scena, {
      ...chertezh.optsii,
      rezhim,
      sposob,
      chisla: true,
    });
    kesh.set(k, svg);
    return svg;
  };
  const shag = (
    s: ShagScenariya,
    do_: number,
    posle: number,
    sposob: number,
  ): ShagScenariyaHtml => ({
    vvodHtml: s.vvod === undefined ? '' : typeset(ren(s.vvod)),
    voprosHtml: typeset(ren(s.vopros)),
    knopkiHtml: s.knopki.map((k) => typeset(ren(k))),
    verno: s.verno,
    daHtml: typeset(ren(s.da)),
    formulyHtml: (s.formuly ?? []).map((f) => display(ren(f))),
    utochnenieHtml: s.utochnenie === undefined ? '' : typeset(ren(s.utochnenie)),
    podvoprosy: (s.podvoprosy ?? []).map((p) => shag(p, do_, p.sloy ?? do_, sposob)),
    risunokDo: s.pokazatDo === true ? risunok(posle, sposob, true) : risunok(do_, sposob),
    risunokPosle: risunok(posle, sposob),
    fakt: typeof s.fakt === 'string' ? fakt(s.fakt, s.vNashey) : null,
  });
  return {
    sposoby: sc.sposoby.map((sp, i) => {
      let tekushchiy = 0;
      return {
        nazvanieHtml: typeset(ren(sp.nazvanie)),
        knopkaHtml: typeset(ren(sp.knopka ?? sp.nazvanie)),
        zachemHtml: sp.zachem === undefined ? '' : typeset(ren(sp.zachem)),
        shagi: sp.shagi.map((s) => {
          const do_ = tekushchiy;
          tekushchiy = Math.max(tekushchiy, s.sloy ?? tekushchiy);
          return shag(s, do_, tekushchiy, i + 1);
        }),
        vyvodHtml: sp.vyvod === undefined ? '' : typeset(ren(sp.vyvod)),
      };
    }),
    vybor:
      sc.vybor === undefined
        ? null
        : {
            voprosHtml: typeset(ren(sc.vybor.vopros)),
            nevernye: (sc.vybor.nevernye ?? []).map((n) => ({
              knopkaHtml: typeset(ren(n.knopka)),
              pochemuHtml: typeset(ren(n.pochemu)),
            })),
            risunok: sc.vybor.sloy === undefined ? risunok(0, 1) : risunok(sc.vybor.sloy, 1, true),
          },
    priem:
      sc.priem === undefined
        ? null
        : { nazvanieHtml: typeset(ren(sc.priem.nazvanie)), fakt: fakt(sc.priem.fakt) },
  };
}
