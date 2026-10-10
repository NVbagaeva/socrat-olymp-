import type { Zadanie } from '@/content/veroyatnost';
import { OPORNYE } from '@/content/opornye';
import { METODY_KARTOCHKI } from '@/content/veroyatnost-metody';
import { KLYUCHEVYE_4 } from '@/lib/veroyatnost/metody4';
import { METODY_5 } from '@/lib/veroyatnost/metody5';
import { bank4Pool, bank5Pool, prep4Pool, prep5Pool } from '@/lib/veroyatnost/pool';
import { zadachVBanke, type Metod } from '@/lib/veroyatnost/tipologiya';
import { MetodyKartochki, type KartochkaMetoda } from './MetodyKartochki';
import { yarlyki } from './navyki';
import { Tex } from './Tex';
import { ZADANIYA } from '@/lib/paths';

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
 * Исключение — методы из OPORNYE_VMESTO_TRENAZHERA: их ссылка ведёт
 * на блок опорных задач этого метода, и счётчик там — задачи блока.
 *
 * Формулы набираются KaTeX здесь, на сервере: в браузер уходит
 * готовая вёрстка, а банк с ответами — нет.
 */

/**
 * Метод → блок опорных задач, куда ведёт «Потренироваться» вместо
 * тренажёра. Задание №5, метод 7 «хотя бы»: у него в опорных задачах
 * свой блок из десяти задач от простой к сложной.
 */
const OPORNYE_VMESTO_TRENAZHERA: Record<Zadanie, Partial<Record<string, string>>> = {
  4: {},
  5: { 'hotya-by': 'hotya-by' },
};

export interface KlyuchevyeMetodyProps {
  zadanie: Zadanie;
}

function kartochki(zadanie: Zadanie): KartochkaMetoda[] {
  const metody: readonly Metod[] = zadanie === 4 ? KLYUCHEVYE_4 : METODY_5;
  const pool = zadanie === 4 ? bank4Pool() : bank5Pool();
  const trenazher = `${ZADANIYA}/${zadanie}/trenazher/`;
  const presety = new Set(yarlyki(pool, zadanie).map((y) => y.id));
  const opornye = zadanie === 4 ? prep4Pool() : prep5Pool();
  return metody.map((m) => {
    const blokId = OPORNYE_VMESTO_TRENAZHERA[zadanie][m.id];
    const blok = blokId === undefined ? undefined : opornye.find((b) => b.id === blokId);
    return {
      id: m.id,
      nomer: m.nomer,
      nazvanie: m.nazvanie,
      opisanie: m.opisanie,
      formula: m.formula === undefined ? null : <Tex text={`$${m.formula}$`} />,
      /* Тренировка у метода вероятности одна: тренажёр с выбранным
       методом. Подвал окна с одной тренировкой выглядит как раньше. */
      trenirovki: [
        blok === undefined
          ? {
              schet: METODY_KARTOCHKI.modal.vBanke(zadachVBanke(m)),
              href: presety.has(m.id) ? `${trenazher}${m.id}/` : trenazher,
            }
          : {
              schet: METODY_KARTOCHKI.modal.vOpornyh(blok.zadachi.length),
              href: `${ZADANIYA}/${zadanie}/${OPORNYE.tail}${blok.id}/`,
            },
      ],
    };
  });
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
