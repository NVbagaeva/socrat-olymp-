/**
 * Предпросмотр листа №4 и №5 в общем генераторе: те же задачи, что у
 * листа печати (sheet4.ts, idsLista45), — по данным маршрута
 * /variant/dannye/z0N.json: условие, закрытый отпечатком разбор и
 * ответ. Условие — той же разметкой, что на листе; решение учителя —
 * шаги разбора, как в «Собрать вариант». Модуль грузится при первой
 * сборке листа.
 */

import { nabratFormuly } from '@/lib/generator/nabrat';
import type { ListHtml, SobratListHtml } from '@/lib/generator/obshchiy/bankEngine';
import { dataUrl } from '@/lib/dataUrl';
import typo from '@/lib/sheet/typography.js';
import { typesetText } from '@/lib/tex';
import {
  teacherHtml,
  type Dannye45,
  type Razbor45,
} from '@/lib/variant/adapters/z04/veroyatnost';
import { openText } from './secret';
import { idsLista45, idZadachi45 } from './sheet4';

/** Данные задания: в браузере — маршрут, в проверке — с сервера. */
export type Zagruzka45 = () => Promise<Dannye45>;

function marshrut(zadanie: 4 | 5): Zagruzka45 {
  return () =>
    fetch(dataUrl(`/variant/dannye/z0${zadanie}.json`)).then((r) => {
      if (!r.ok) throw new Error(`нет данных №${zadanie}: ${r.status}`);
      return r.json() as Promise<Dannye45>;
    });
}

/** Условие той же разметкой, что на листе печати (sheet4.ts), с набранными формулами. */
export function vopros45(uslovie: string): string {
  return nabratFormuly(typo.mathText(typesetText(uslovie)));
}

export function sobratList45(zadanie: 4 | 5, zagruzka?: Zagruzka45): SobratListHtml {
  const dannye = zagruzka ?? marshrut(zadanie);
  return async (q) => {
    const d = await dannye();
    const ids = idsLista45(d.kinds, q, zadanie);
    if (ids === null) return null;
    const poId = new Map(
      d.kinds.flatMap((kind) =>
        kind.variants.map((variant) => [idZadachi45(kind.id, variant.n), variant] as const),
      ),
    );
    const l: ListHtml = {
      bloki: [
        {
          id: 'zadachi',
          title: 'Задачи',
          spiski: ids.spiski,
          ...(ids.pozicii === undefined ? {} : { pozicii: ids.pozicii }),
        },
      ],
      zadacha(id) {
        const v = poId.get(id);
        if (v === undefined) return null;
        const r = JSON.parse(openText(v.razbor, v.seal)) as Razbor45;
        return {
          question: vopros45(v.uslovie),
          answer: typo.escape(r.otvet.replace('.', ',').replace('-', '−')),
          solution: nabratFormuly(teacherHtml(r)),
          analog: false,
        };
      },
      pamyatka: () => '',
      primer: () => '',
    };
    return l;
  };
}
