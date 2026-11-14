import type { Shag } from '../steklo';
import type { VoprosPodskazki } from '../trening';
import type { Razbor11 } from '@/lib/zadanie11/trening/reshatel';
import type { Tablitsa } from '@/lib/zadanie11/types';
import { Tablitsa11 } from './Tablitsa11';

/**
 * Решение задачи №11 шагами «Стеклянной сцены». Этапы разбора — шаги
 * (строки дословно: пропорции, краткая запись процентов — как в
 * прежнем разборе), таблица модели — рисунок шага «Таблица» (нет такого
 * шага — первого). «ОДЗ» и «Отбор корней» выделены цветом, как у №7.
 */

function tonEtapa(zag: string): Shag['ton'] {
  if (/^ОДЗ/.test(zag)) return 'odz';
  if (/^Отбор/.test(zag)) return 'otbor';
  return undefined;
}

export function Tablitsy11({ tables }: { tables: readonly Tablitsa[] }) {
  return (
    <div className="z11-tablitsy">
      {tables.map((t, i) => (
        <Tablitsa11 key={i} table={t} />
      ))}
    </div>
  );
}

export function shagi11(r: Razbor11): Shag[] {
  const sTablitsey =
    r.tables.length === 0
      ? -1
      : Math.max(
          0,
          r.etapy.findIndex((e) => /табл/i.test(e.zag)),
        );
  return r.etapy.map((e, i) => {
    const ton = tonEtapa(e.zag);
    return {
      zagolovok: e.zag,
      ...(e.zag.includes('$') ? { zagolovokHtml: e.zagHtml } : {}),
      chtoHtml: e.stroki.map((html) => `<div class="z11-stroka">${html}</div>`).join(''),
      formulaHtml: '',
      ...(ton === undefined ? {} : { ton }),
      ...(i === sTablitsey ? { risunok: <Tablitsy11 tables={r.tables} /> } : {}),
    };
  });
}

/** Подсказки-вопросы разбора — в общем виде. */
export function voprosy11(r: Razbor11): VoprosPodskazki[] {
  return r.voprosy.map((v) => ({
    voprosHtml: v.vopros,
    variantyHtml: v.varianty,
    verno: v.verno,
    ...(v.kommentariy === undefined ? {} : { kommentariyHtml: v.kommentariy }),
  }));
}

/** Ответ для бланка: запятая и настоящий минус. */
export function otvet11(r: Razbor11): string {
  return String(r.answer).replace('.', ',').replace('-', '−');
}
