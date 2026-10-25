/**
 * Предпросмотр листа №6 в общем генераторе: та же модель листа и те же
 * компоненты, что у страницы печати (List6), — в строку HTML. Модуль
 * грузится при первой сборке листа вместе с банком и решателями.
 */

import { renderToStaticMarkup } from 'react-dom/server';
import { RamkiTeorii6 } from '@/components/tasks/zadanie6/RamkiTeorii6';
import { Razbor6 } from '@/components/tasks/zadanie6/Razbor6';
import { Uslovie6 } from '@/components/tasks/zadanie6/Uslovie6';
import { GEN_UI } from '@/content/generatorUi';
import { TEORIYA_6_DLYA_PROTOTIPA } from '@/content/teoriya6';
import type { ListHtml, SobratListHtml } from '@/lib/generator/obshchiy/bankEngine';
import { typeset } from '@/lib/tex';
import { zagruzitIndeks, zagruzitZadachi, type IndeksZadachi, type ZadachaLite } from './dannye';
import { parseZapros, parseZaprosKlyuchi, sobratList, sobratListKlyuchi } from './sborka';

/** Откуда брать банк: в браузере — файлы public/data, в проверке — с диска. */
export interface Dannye6 {
  indeks: () => Promise<IndeksZadachi[]>;
  zadachi: (protos: string[]) => Promise<Map<string, ZadachaLite>>;
}

const BRAUZER: Dannye6 = { indeks: zagruzitIndeks, zadachi: zagruzitZadachi };

function otvetText(x: number): string {
  return String(x).replace('.', ',').replace('-', '−');
}

export function sobratList6(dannye: Dannye6 = BRAUZER): SobratListHtml {
  return async (q) => {
    const indeks = await dannye.indeks();
    const zk = parseZaprosKlyuchi(q);
    const z = zk === null ? parseZapros(q) : null;
    const model =
      zk !== null ? sobratListKlyuchi(zk, indeks) : z !== null ? sobratList(z, indeks) : null;
    if (model === null) return null;
    const ids = model.bloki.flatMap((b) => [...b.spiski.flat(), ...(b.primery ?? [])]);
    const protos = [...new Set(indeks.filter((x) => ids.includes(x.id)).map((x) => x.p))];
    const [zadachi, mod] = await Promise.all([dannye.zadachi(protos), import('./prototypes')]);
    const uslovie = (x: ZadachaLite) => {
      const ris = mod.prototype(x.prototypeId).ris(x.params);
      return { text: x.text, ...(ris ? { ris } : {}), ...(x.posle ? { posle: x.posle } : {}) };
    };
    const l: ListHtml = {
      bloki: model.bloki,
      zadacha(id) {
        const x = zadachi.get(id);
        if (x === undefined) return null;
        const s = mod.prototype(x.prototypeId).solve(x.params);
        return {
          question: renderToStaticMarkup(<Uslovie6 u={uslovie(x)} />),
          answer: typeset(otvetText(s.answer)),
          solution: renderToStaticMarkup(<Razbor6 s={s} />),
          analog: x.source === 'analog',
        };
      },
      pamyatka: (p) =>
        `<div class="gen-recap"><b>${model.bloki[0]?.title ?? ''}</b>${renderToStaticMarkup(
          <RamkiTeorii6 prototipy={p} />,
        )}</div>`,
      primer(id) {
        const x = zadachi.get(id);
        if (x === undefined) return '';
        const s = mod.prototype(x.prototypeId).solve(x.params);
        const title = TEORIYA_6_DLYA_PROTOTIPA(x.prototypeId)?.title ?? '';
        return (
          `<div class="gen-example"><span class="gen-example__label">${GEN_UI.primer}</span>` +
          `<p class="gen-example__title">${typeset(title)}</p>` +
          `<div class="gen-example__q">${renderToStaticMarkup(<Uslovie6 u={uslovie(x)} />)}</div>` +
          `<div class="gen-example__sol">${renderToStaticMarkup(<Razbor6 s={s} />)}` +
          `<p>Ответ: <b>${typeset(otvetText(s.answer))}</b></p></div></div>`
        );
      },
    };
    return l;
  };
}
