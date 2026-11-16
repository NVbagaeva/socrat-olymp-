/**
 * Предпросмотр листа базы в общем генераторе: та же модель листа
 * (generatorBazy.ts) и те же куски (listBazy.ts), что у страницы печати.
 * Модуль грузится при первой сборке листа: банк раздела и решатели
 * прототипов приезжают вместе с ним.
 */

import type { ListHtml, SobratListHtml } from '@/lib/generator/obshchiy/bankEngine';
import type { GenConfig } from '@/lib/generator/obshchiy/types';
import { modelListaBazy, parseZaprosBazy, prototipyLista } from './generatorBazy';
import { otvetBazy, razborBazy, uslovieSRisunkom } from './listBazy';
import type { Resheno, ZadachaLite } from './types';

/** Задачи листа и решатель: в браузере — файлы раздела, в проверке — с диска. */
export interface ZadachiBazy {
  zadacha: (id: string) => ZadachaLite | undefined;
  reshit: (z: ZadachaLite) => Resheno;
}

export type DannyeBazy = (prototipy: readonly string[]) => Promise<ZadachiBazy>;

/** Банк раздела в браузере (lib/baza/dannye.ts): файлы прототипов и решатели. */
export function dannyeBrauzera(slug: string): DannyeBazy {
  return async (prototipy) => {
    const { brauzerRazdela } = await import('./dannye');
    const { zagruzka } = brauzerRazdela(slug);
    await zagruzka.zagruzit(prototipy);
    return {
      zadacha: (id) => zagruzka.izKesha(id),
      reshit(z) {
        const r = zagruzka.reshenie(z);
        if (r === null) throw new Error(`нет решателя для ${z.id}`);
        return r;
      },
    };
  };
}

export function sobratListBazy(config: GenConfig, dannye: DannyeBazy): SobratListHtml {
  return async (q) => {
    const z = parseZaprosBazy(q, config);
    if (z === null) return null;
    const model = modelListaBazy(z, config);
    const d = await dannye(prototipyLista(model));
    const l: ListHtml = {
      bloki: model.bloki,
      zadacha(id) {
        const x = d.zadacha(id);
        if (x === undefined) return null;
        const r = d.reshit(x);
        return {
          question: uslovieSRisunkom(x),
          answer: otvetBazy(r.otvet),
          solution: razborBazy(r.etapy),
          analog: true,
        };
      },
      pamyatka: () => '',
      primer: () => '',
    };
    return l;
  };
}
