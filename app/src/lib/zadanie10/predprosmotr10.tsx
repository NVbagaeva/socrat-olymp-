/**
 * Предпросмотр листа №10 в общем генераторе: та же модель листа и те же
 * куски, что у страницы печати (List10), — в строку HTML. Модуль
 * грузится при первой сборке листа вместе с банком и решателями.
 */

import { renderToStaticMarkup } from 'react-dom/server';
import { RamkiTeorii10, Shagi10, Uslovie10 } from '@/components/tasks/zadanie10/ChastiLista10';
import { Most10 } from '@/components/tasks/zadanie10/Most10';
import type { IllInfo } from '@/components/tasks/zadanie10/Zadacha10';
import { GEN_UI } from '@/content/generatorUi';
import type { ListHtml, SobratListHtml } from '@/lib/generator/obshchiy/bankEngine';
import { typeset } from '@/lib/tex';
import { zagruzitIndeks, zagruzitZadachi, type IndeksZadachi, type ZadachaLite } from './dannye';
import { parseZapros, parseZaprosKlyuchi, sobratList, sobratListKlyuchi } from './sborka';

/** Откуда брать банк: в браузере — файлы public/data, в проверке — с диска. */
export interface Dannye10 {
  indeks: () => Promise<IndeksZadachi[]>;
  zadachi: (protos: string[]) => Promise<Map<string, ZadachaLite>>;
}

const BRAUZER: Dannye10 = { indeks: zagruzitIndeks, zadachi: zagruzitZadachi };

function otvetText(x: number | string): string {
  return String(x).replace('.', ',');
}

/** ill — картинки сюжетов по прототипам (страница генератора, на сервере). */
export function sobratList10(
  ill: Record<string, IllInfo>,
  dannye: Dannye10 = BRAUZER,
): SobratListHtml {
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
    const uslovie = (x: ZadachaLite) =>
      renderToStaticMarkup(
        <Uslovie10
          z={x}
          vid="uchenik"
          kartinki={model.kartinki}
          {...(ill[x.prototypeId] ? { ill: ill[x.prototypeId] } : {})}
        />,
      );
    const razbor = (x: ZadachaLite) =>
      renderToStaticMarkup(
        <>
          {x.prototypeId === 'P01' ? <Most10 params={x.params} rezhim="uchitel" /> : null}
          <Shagi10 s={mod.prototype(x.prototypeId).solve(x.params)} />
        </>,
      );
    const l: ListHtml = {
      bloki: model.bloki,
      zadacha(id) {
        const x = zadachi.get(id);
        if (x === undefined) return null;
        return {
          question: uslovie(x),
          answer: typeset(otvetText(mod.prototype(x.prototypeId).solve(x.params).answer)),
          solution: razbor(x),
          analog: x.source === 'analog',
        };
      },
      pamyatka: (p) =>
        `<div class="gen-recap"><b>${model.bloki[0]?.title ?? ''}</b>${renderToStaticMarkup(
          <RamkiTeorii10 prototipy={p} proto={mod.prototype} />,
        )}</div>`,
      primer(id) {
        const x = zadachi.get(id);
        if (x === undefined) return '';
        const s = mod.prototype(x.prototypeId).solve(x.params);
        return (
          `<div class="gen-example"><span class="gen-example__label">${GEN_UI.primer}</span>` +
          `<p class="gen-example__title">${typeset(mod.prototype(x.prototypeId).title)}</p>` +
          `<div class="gen-example__q">${uslovie(x)}</div>` +
          `<div class="gen-example__sol">${razbor(x)}` +
          `<p>Ответ: <b>${typeset(otvetText(s.answer))}</b></p></div></div>`
        );
      },
    };
    return l;
  };
}
