/**
 * Предпросмотр листа №10 в общем генераторе: та же модель листа и те же
 * куски разметки, что у листа печати (sheet10.ts), — условие, разбор,
 * рамки теории. Модуль грузится при первой сборке листа вместе с банком
 * и решателями.
 */

import type { IllInfo } from '@/components/tasks/zadanie10/Zadacha10';
import { GEN_UI } from '@/content/generatorUi';
import type { ListHtml, SobratListHtml } from '@/lib/generator/obshchiy/bankEngine';
import { typeset } from '@/lib/tex';
import { zagruzitIndeks, zagruzitZadachi, type IndeksZadachi, type ZadachaLite } from './dannye';
import { parseZapros, parseZaprosKlyuchi, sobratList, sobratListKlyuchi } from './sborka';
import { otvetText10, ramkiTeorii10, razbor10, uslovie10, type Sborka10 } from './sheet10';

/** Откуда брать банк: в браузере — файлы public/data, в проверке — с диска. */
export interface Dannye10 {
  indeks: () => Promise<IndeksZadachi[]>;
  zadachi: (protos: string[]) => Promise<Map<string, ZadachaLite>>;
}

const BRAUZER: Dannye10 = { indeks: zagruzitIndeks, zadachi: zagruzitZadachi };

/** Условие ученика: текст, картинка сюжета и чертёж моста. */
export function vopros10(o: Sborka10, z: ZadachaLite): string {
  const u = uslovie10(o, z, 'uchenik');
  return u.html + (u.figure === null ? '' : `<div class="z10-list__most">${u.figure.svg}</div>`);
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
    const o: Sborka10 = { model, zadachi, proto: mod.prototype, ill, kartinki: model.kartinki };
    const otvet = (x: ZadachaLite) =>
      typeset(otvetText10(mod.prototype(x.prototypeId).solve(x.params).answer));
    const l: ListHtml = {
      bloki: model.bloki,
      zadacha(id) {
        const x = zadachi.get(id);
        if (x === undefined) return null;
        return {
          question: vopros10(o, x),
          answer: otvet(x),
          solution: razbor10(o, x).join(''),
          analog: x.source === 'analog',
        };
      },
      pamyatka: (p) =>
        `<div class="gen-recap"><b>${model.bloki[0]?.title ?? ''}</b>${ramkiTeorii10(o, p).join('')}</div>`,
      primer(id) {
        const x = zadachi.get(id);
        if (x === undefined) return '';
        return (
          `<div class="gen-example"><span class="gen-example__label">${GEN_UI.primer}</span>` +
          `<p class="gen-example__title">${typeset(mod.prototype(x.prototypeId).title)}</p>` +
          `<div class="gen-example__q">${vopros10(o, x)}</div>` +
          `<div class="gen-example__sol">${razbor10(o, x).join('')}` +
          `<p>Ответ: <b>${otvet(x)}</b></p></div></div>`
        );
      },
    };
    return l;
  };
}
