/**
 * №4 и №5 в ДЗ (теория вероятностей). Тренажёр — банк прототипов по
 * вариантам, из данных «Собрать вариант» (/variant/dannye/z04.json,
 * z05.json): условие, отпечаток ответа и закрытый разбор — тот же, что
 * у тренажёра, без вёрстки выкладок. Ответ — запись разбора («0,25»).
 * Ключ задачи — как в тренажёре: «p4-01#3».
 *
 * Опорные — задачи конспекта без зерна: в ДЗ идёт сама задача, ответ,
 * разбор и подсказка-вопросы закрыты в каталоге (katalog/server.ts).
 *
 * Рисунков в условии тренажёра нет — как на ЕГЭ и на листе генератора.
 */

import { dataUrl } from '@/lib/dataUrl';
import { normalizeEge } from '@/lib/otvet/proverkaDz';
import { typeset, typesetText } from '@/lib/tex';
import type { Dannye45, Razbor45 } from '@/lib/variant/adapters/z04/veroyatnost';
import { openText } from '@/lib/veroyatnost/secret';
import type { RazborDz, ShagDz } from '../types';
import { opornayaBanka, opornyeBanka } from './bank';
import type { SborshchikRazdela } from './razdely';
import { sozdatSpisok, type ZadachaSpiska } from './spisok';

/** Разбор тренажёра (метод и шаги с формулой) → решение ДЗ. */
export function razborVeroyatnosti(r: {
  metod: string;
  shagi: readonly { etap: string; text: string; tex?: string }[];
}): RazborDz {
  const shagi: ShagDz[] = r.shagi.map((s) => ({
    zag: typesetText(s.etap),
    chto: typesetText(s.text),
    tex: s.tex === undefined ? '' : typeset(`$${s.tex}$`),
  }));
  if (r.metod !== '') {
    shagi.unshift({ zag: 'Метод', chto: typesetText(r.metod), tex: '' });
  }
  return { shagi, delimost: [] };
}

/** Ответ разбора («0,25», «−3») → запись ЕГЭ. */
export function otvetVeroyatnosti(otvet: string): string {
  const norm = normalizeEge(otvet);
  if (norm === null) throw new Error(`ответ «${otvet}» не в записи ЕГЭ`);
  return norm;
}

interface Zadacha45 extends ZadachaSpiska {
  n: number;
  uslovie: string;
  seal: string;
  razbor: string;
}

function sborshchik(no: 4 | 5): SborshchikRazdela {
  const spisok = sozdatSpisok<Zadacha45>({
    async zagruzit() {
      const res = await fetch(dataUrl(`/variant/dannye/z0${no}.json`));
      if (!res.ok) throw new Error(`нет данных №${no}: ${res.status}`);
      const d = (await res.json()) as Dannye45;
      return d.kinds.flatMap((kind) =>
        kind.variants.map((v) => ({
          id: `${kind.id}#${v.n}`,
          tip: kind.id,
          n: v.n,
          uslovie: v.uslovie,
          seal: v.seal,
          razbor: v.razbor,
        })),
      );
    },
    async postroit(z) {
      const r = JSON.parse(openText(z.razbor, z.seal)) as Razbor45;
      return {
        answerKind: 'number',
        questionHtml: `<p>${typesetText(z.uslovie)}</p>`,
        view: { tekst: true },
        answer: otvetVeroyatnosti(r.otvet),
        razbor: razborVeroyatnosti(r),
        source: `прототип ${z.tip}, вариант ${z.n}`,
      };
    },
  });
  return {
    opornyeIzZerna: false,
    trenazher: spisok.trenazher,
    zadacha: spisok.zadacha,
    analogZadachi: spisok.analogZadachi,
    opornye: (blok, ids) => opornyeBanka(blok, ids),
    analogOpornoy: (blok, kind, _ref, _zerno, student) => opornayaBanka(blok, kind, student),
  };
}

export const SBORSHCHIK_4 = sborshchik(4);
export const SBORSHCHIK_5 = sborshchik(5);
