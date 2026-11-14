/**
 * №3 в ДЗ (стереометрия). Тренажёр — банк задачника по вариантам, из
 * данных «Собрать вариант» (/variant/dannye/z03.json): условие открыто,
 * сценарий чертежа, шаги и ответ закрыты отпечатком ответа, как на
 * листе печати №3. Чертёж I–III рисуется из сценария (ученику без
 * построений, в решении — с построениями), IV–VIII — SVG движка solid/.
 * Ключ задачи — как в тренажёре: «P03-41#3».
 *
 * Опорные — задачи блоков без зерна: в ДЗ идёт сама задача; «нажми на
 * чертеже» и «выбери плоский чертёж» становятся выбором из вариантов
 * (katalog/server.ts).
 */

import { dataUrl } from '@/lib/dataUrl';
import { normalizeEge } from '@/lib/otvet/proverkaDz';
import { typeset } from '@/lib/tex';
import type { Dannye03, Zadacha03 } from '@/lib/variant/data/z03';
import { openText } from '@/lib/zadanie3/secret';
import type { ShagDz } from '../types';
import { opornayaBanka, opornyeBanka } from './bank';
import type { SborshchikRazdela } from './razdely';
import { sozdatSpisok, type ZadachaSpiska } from './spisok';

const OTVET = /^\s*\*{0,2}Ответ:/;

interface ZadachaDz3 extends ZadachaSpiska {
  z: Zadacha03;
  /** Чертёж IV–VIII (SVG solid/); у I–III — сценарий в самой задаче. */
  svg: string | null;
}

function risunok(svg: string): string {
  return `<div class="trn-risunok rdz-ch3">${svg}</div>`;
}

const spisok = sozdatSpisok<ZadachaDz3>({
  async zagruzit() {
    const res = await fetch(dataUrl('/variant/dannye/z03.json'));
    if (!res.ok) throw new Error(`нет данных №3: ${res.status}`);
    const d = (await res.json()) as Dannye03;
    return d.zadachi.map((z) => ({
      id: z.klyuch,
      tip: z.prototip,
      z,
      svg: d.svg[z.klyuch] ?? d.svg[z.prototip] ?? null,
    }));
  },
  async postroit({ z, svg }) {
    let uchenik = svg === null ? '' : risunok(svg);
    let uchitel = '';
    if (z.scena !== '') {
      const { chertezhLista } = await import('@/lib/zadanie3/pechat');
      const zp = { ...z, nazvanie: '' };
      uchenik = risunok(chertezhLista(zp, 'uchenik'));
      uchitel = risunok(chertezhLista(zp, 'uchitel'));
    }
    const otvet = openText(z.otvet, z.seal);
    const answer = normalizeEge(otvet);
    if (answer === null) throw new Error(`${z.klyuch}: ответ «${otvet}» не в записи ЕГЭ`);
    const shagi: ShagDz[] = openText(z.shagi, z.seal)
      .split('\n')
      .filter((t) => t.trim() !== '' && !OTVET.test(t))
      .map((t) => ({ chto: typeset(t), tex: '' }));
    if (uchitel !== '' && shagi[0] !== undefined) {
      shagi[0] = { ...shagi[0], chto: uchitel + shagi[0].chto };
    }
    return {
      answerKind: 'number',
      questionHtml: typeset(z.uslovie) + uchenik,
      view: { tekst: true },
      answer,
      razbor: { shagi, delimost: [] },
      source: z.ref === '' ? `прототип ${z.prototip}` : `прототип ${z.prototip} (${z.ref})`,
    };
  },
});

export const SBORSHCHIK_3: SborshchikRazdela = {
  opornyeIzZerna: false,
  trenazher: spisok.trenazher,
  zadacha: spisok.zadacha,
  analogZadachi: spisok.analogZadachi,
  opornye: (blok, ids) => opornyeBanka(blok, ids),
  analogOpornoy: (blok, kind, _ref, _zerno, student) => opornayaBanka(blok, kind, student),
};
