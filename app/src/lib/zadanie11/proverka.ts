/**
 * Данные служебной страницы «Проверка аналогов» №11: по разделам и
 * прототипам — исходная задача банка и 10 аналогов с ответом и
 * решением, уже свёрстанными KaTeX. Только для вычитки
 * преподавателем: страница noindex и в меню не стоит.
 */

import { typesetKrupno as typeset } from '../tex';
import { POOL_ANALOGOV } from './analogi';
import { BANK, RAZMINKA } from './bank';
import { strokaHtml } from './proporciya/html';
import { kodNaSayte } from './kod';
import { d, txt } from './num';
import { subtype } from './prototypes';
import { tablitsaHtml } from './sheet11';
import { SECTIONS } from './taxonomy';
import type { Solved } from './types';

export interface AnalogNaProverku {
  id: string;
  plotTag: string;
  ask: string;
  tekstHtml: string;
  otvetHtml: string;
  resheniyeHtml: string;
  /** Тот же аналог для отчёта в markdown. */
  md: string;
}

export interface PrototipNaProverku {
  id: string;
  kod: string;
  title: string;
  level: number;
  /** «Задача банка» или «Задача разминки» (РЗ — не открытый банк). */
  bankPodpis: string;
  bankHtml: string;
  bankOtvetHtml: string;
  analogi: AnalogNaProverku[];
}

export interface RazdelNaProverku {
  id: string;
  nazvanie: string;
  prototipy: PrototipNaProverku[];
}

function resheniye(s: Solved): string {
  const tab = (s.tables ?? []).map((t) => tablitsaHtml(t)).join('');
  const etapy = s.etapy
    .map(
      (e) =>
        `<li><b>${typeset(e.title)}.</b> ${e.lines.map((l) => strokaHtml(l, { typeset, praviloOtkryto: true })).join(' ')}</li>`,
    )
    .join('');
  return `${tab}<ol class="z11-pr__etapy">${etapy}</ol>`;
}

export function dannyeProverki(): RazdelNaProverku[] {
  return SECTIONS.map((sec) => ({
    id: sec.id,
    nazvanie: sec.nazvanie,
    prototipy: Object.entries(POOL_ANALOGOV)
      .filter(([id]) => subtype(id).section === sec.id)
      .map(([id, list]) => {
        const st = subtype(id);
        const b = [...BANK, ...RAZMINKA].find((x) => x.id === id);
        const bs = b === undefined ? null : st.solve(b.params);
        return {
          id,
          kod: kodNaSayte(id),
          title: st.title,
          level: st.level,
          bankPodpis: sec.id === 'RZ' ? 'Задача разминки' : 'Задача банка',
          bankHtml: bs === null ? '' : typeset(bs.uslovie),
          bankOtvetHtml: bs === null ? '' : typeset(`$${d(bs.answer)}$`),
          analogi: list.map((a) => {
            const s = st.solve(a.params);
            return {
              id: a.id,
              plotTag: a.plotTag,
              ask: a.ask,
              tekstHtml: typeset(a.text),
              otvetHtml: typeset(`$${d(a.answer)}$`),
              resheniyeHtml: resheniye(s),
              md: `### ${a.id} · ${a.plotTag} · вопрос: ${a.ask}\n\n${a.text}\n\n**Ответ:** ${txt(a.answer)}\n`,
            };
          }),
        };
      }),
  })).filter((r) => r.prototipy.length > 0);
}
