'use client';

import { useState } from 'react';
import { ProblemCard } from '@/components/tasks/card';
import { PODGOTOVKA_4_SLOVA } from '@/content/veroyatnost';
import { METODY } from '@/lib/veroyatnost/model';
import type { PrepPoolBlok, PrepPoolZadacha } from '@/lib/veroyatnost/pool';

export interface PodgotovkaProps {
  bloki: PrepPoolBlok[];
}

/**
 * Подготовительные задачи заданий №4 и №5 на карточке ProblemCard.
 *
 * Ни подхода, ни перемешивания: это конспект автора, задачи идут в
 * его порядке и разложены по его же заголовкам. Метод в шапке
 * показан, если у задачи есть модель, — конспект и есть отработка,
 * узнавать структуру здесь не просят. У подготовки №5 модели пока
 * нет: карточка без рисунка, картинка к условию — по манифесту
 * картинок (pool.ts), чертёж лабиринта — готовой разметкой. Ученик
 * решает подряд и видит, сколько в блоке уже сошлось.
 *
 * Ответы уехали вниз отпечатками, разборы закрытыми: в разметке
 * верного ответа нет ни у одной задачи.
 */
export function Podgotovka({ bloki }: PodgotovkaProps) {
  const [resheno, setResheno] = useState<Record<string, boolean>>({});

  function otmetit(zadacha: PrepPoolZadacha, right: boolean): void {
    if (right) {
      setResheno((was) => ({ ...was, [zadacha.id]: true }));
    }
  }

  return (
    <div className="vprep">
      {bloki.map((blok) => {
        const schet = blok.zadachi.filter((zadacha) => resheno[zadacha.id] === true).length;
        return (
          <section className="vprep__blok" key={blok.id}>
            <header className="vprep__blok-head">
              <h2 className="t-h3 vprep__blok-title">{blok.nazvanie}</h2>
              <p className="vprep__blok-tip">{blok.tip}</p>
              <p className="vprep__blok-count">
                {PODGOTOVKA_4_SLOVA.resheno(schet, blok.zadachi.length)}
              </p>
            </header>

            <ol className="vprep__list">
              {blok.zadachi.map((zadacha) => {
                const metod = METODY.find((m) => m.id === zadacha.model?.method);
                return (
                  <li className="vprep__item" key={zadacha.id}>
                    <ProblemCard
                      zadacha={{
                        id: zadacha.id,
                        uslovie: zadacha.uslovie,
                        seal: zadacha.seal,
                        steps: zadacha.steps,
                        ...(zadacha.model === undefined ? {} : { model: zadacha.model }),
                        ...(zadacha.illustration === undefined
                          ? {}
                          : { illustration: zadacha.illustration }),
                        ...(zadacha.risunok === undefined ? {} : { risunok: zadacha.risunok }),
                      }}
                      nomer={zadacha.nomer}
                      {...(metod === undefined ? {} : { metodLabel: metod.nazvanie })}
                      istochnik={PODGOTOVKA_4_SLOVA.istochnik}
                      onResult={(right) => otmetit(zadacha, right)}
                    />
                  </li>
                );
              })}
            </ol>
          </section>
        );
      })}
    </div>
  );
}
