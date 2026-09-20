import { tasksPage } from '@/content/tasks';
import type { Zadanie } from '@/content/veroyatnost';
import { METODY_KARTOCHKI } from '@/content/veroyatnost-metody';
import { KLYUCHEVYE_4 } from '@/lib/veroyatnost/metody4';
import { METODY_5 } from '@/lib/veroyatnost/metody5';
import { bank4Pool, bank5Pool } from '@/lib/veroyatnost/pool';
import { zadachVBanke, type Metod } from '@/lib/veroyatnost/tipologiya';
import { MetodyKartochki, type KartochkaMetoda } from './MetodyKartochki';
import { yarlyki } from './navyki';
import { Tex } from './Tex';

/**
 * Вкладка «Ключевые методы решения» заданий №4 и №5.
 *
 * У задания №4 пять методов списка А (lib/veroyatnost/metody4.ts) —
 * карта банка ФИПИ; у задания №5 десять методов автора
 * (lib/veroyatnost/metody5.ts). Карточки одни и те же: номер в кружке,
 * название, подпись, формула в плашке там, где она есть. Карточка
 * открывает модалку (MetodyKartochki).
 *
 * Счётчик «задач в банке» — число задач задачника, отнесённых к методу
 * (диапазоны из конфига); сгенерированные варианты не считаются.
 * Ссылка «Потренироваться» ведёт на тренажёр с уже выбранным методом,
 * если у тренажёра есть такой ярлык, иначе на вкладку тренажёра.
 *
 * Формулы набираются KaTeX здесь, на сервере: в браузер уходит
 * готовая вёрстка, а банк с ответами — нет.
 */

export interface KlyuchevyeMetodyProps {
  zadanie: Zadanie;
}

function kartochki(zadanie: Zadanie): KartochkaMetoda[] {
  const metody: readonly Metod[] = zadanie === 4 ? KLYUCHEVYE_4 : METODY_5;
  const pool = zadanie === 4 ? bank4Pool() : bank5Pool();
  const trenazher = `${tasksPage.href}/${zadanie}/trenazher/`;
  const presety = new Set(yarlyki(pool, zadanie).map((y) => y.id));
  return metody.map((m) => ({
    id: m.id,
    nomer: m.nomer,
    nazvanie: m.nazvanie,
    opisanie: m.opisanie,
    formula: m.formula === undefined ? null : <Tex text={`$${m.formula}$`} />,
    schet: METODY_KARTOCHKI.modal.vBanke(zadachVBanke(m)),
    href: presety.has(m.id) ? `${trenazher}${m.id}/` : trenazher,
  }));
}

export function KlyuchevyeMetody({ zadanie }: KlyuchevyeMetodyProps) {
  return (
    <div className="vmetody">
      <header className="vmetody__head">
        <h2 className="t-h2 vmetody__title">{METODY_KARTOCHKI.title}</h2>
      </header>
      <MetodyKartochki items={kartochki(zadanie)} />
    </div>
  );
}
