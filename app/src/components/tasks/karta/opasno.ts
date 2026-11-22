/**
 * Пункт «Чем опасно» с формулой и коротким разбором — исходник (TeX
 * строками) и набор в HTML на сборке.
 *
 * Обычный пункт — строка текста с $…$. Если в пункте есть уравнение,
 * оно не втискивается в строку: выносится отдельной формулой по центру
 * (выключка KaTeX), а под ним может идти разбор по шагам — сначала
 * словами, что делаем и зачем, потом формула своей строкой.
 */

import { katex } from '@/lib/graph/katex';
import { typeset } from '@/lib/tex';

export interface OpasnoShagIstochnik {
  /** Что делаем и зачем — текст с $…$. */
  tekst: string;
  /** Формулы шага, каждая своей строкой (TeX без долларов). */
  formuly?: string[];
}

export interface OpasnoIstochnik {
  /** Сам пункт списка — текст с $…$. */
  tekst: string;
  /** Уравнение примера — отдельной строкой по центру (TeX). */
  formula?: string;
  razbor?: {
    shagi: OpasnoShagIstochnik[];
    /** Ответ примера — TeX без долларов. */
    otvet?: string;
    /** Акцентная пометка последней строкой блока: текст и формулы. */
    vyvod?: OpasnoShagIstochnik[];
  };
}

/** Пункт, уже набранный: HTML текста и выключек. */
export interface OpasnoPunkt {
  html: string;
  formulaHtml?: string;
  razbor?: {
    shagi: { html: string; formuly: string[] }[];
    otvetHtml?: string;
    vyvod?: { html: string; formuly: string[] }[];
  };
}

/** Формула своей строкой: выключка KaTeX. */
export function vynos(tex: string): string {
  return katex.renderToString(tex, { throwOnError: true, displayMode: true });
}

/** Строчная формула без выключки (ответ в плашке). */
function stroka(tex: string): string {
  return katex.renderToString(tex, { throwOnError: true });
}

function nabratShag(s: OpasnoShagIstochnik): { html: string; formuly: string[] } {
  return { html: typeset(s.tekst), formuly: (s.formuly ?? []).map(vynos) };
}

export function nabratOpasno(p: string | OpasnoIstochnik): string | OpasnoPunkt {
  if (typeof p === 'string') {
    return typeset(p);
  }
  const { razbor } = p;
  const v = razbor?.vyvod;
  return {
    html: typeset(p.tekst),
    ...(p.formula === undefined ? {} : { formulaHtml: vynos(p.formula) }),
    ...(razbor === undefined
      ? {}
      : {
          razbor: {
            shagi: razbor.shagi.map(nabratShag),
            ...(razbor.otvet === undefined ? {} : { otvetHtml: stroka(razbor.otvet) }),
            ...(v === undefined ? {} : { vyvod: v.map(nabratShag) }),
          },
        }),
  };
}
