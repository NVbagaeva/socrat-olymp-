import type { Zadanie } from '@/content/veroyatnost';
import { METODY_KARTOCHKI } from '@/content/veroyatnost-metody';
import { METODY_5 } from '@/lib/veroyatnost/metody5';
import { typesetKrupno } from '@/lib/tex';
import { MetodyKartochki4 } from './MetodyKartochki4';
import { MetodyKartochki5 } from './MetodyKartochki5';

/**
 * Вкладка «Ключевые методы решения» заданий №4 и №5.
 *
 * У задания №4 пять методов списка А (lib/veroyatnost/metody4.ts), у
 * №5 — десять методов автора (lib/veroyatnost/metody5.ts). Карточка
 * целиком — ссылка на главу метода во вкладке «Теория»; в главе —
 * кнопки «Потренировать этот метод» и «Опорные задачи». Картинка
 * метода — в стеклянной плашке сверху (KartinkaMetodaImg).
 *
 * Формулы методов №5 набираются KaTeX здесь, на сервере: в браузер
 * уходит готовая вёрстка.
 */

export interface KlyuchevyeMetodyProps {
  zadanie: Zadanie;
}

export function KlyuchevyeMetody({ zadanie }: KlyuchevyeMetodyProps) {
  return (
    <div className="vmetody">
      <header className="vmetody__head">
        <h2 className="t-h2 vmetody__title">{METODY_KARTOCHKI.title}</h2>
      </header>
      {zadanie === 4 ? (
        <MetodyKartochki4 />
      ) : (
        <MetodyKartochki5
          formuly={Object.fromEntries(
            METODY_5.flatMap((m) =>
              m.formula === undefined ? [] : [[m.id, typesetKrupno(`$${m.formula}$`)]],
            ),
          )}
        />
      )}
    </div>
  );
}
