'use client';

import { clsx } from 'clsx';
import { useState } from 'react';
import { Callout } from '@/components/ui';
import { Tex } from '@/components/ui/Tex';
import { BLOKI_14 } from '@/lib/zadanie14/opornye';
import { opornye14 } from '@/lib/zadanie14/progress';
import { PUSTOY_VVOD, proverit14, verno14, type Itog14, type Vvod14 } from '@/lib/zadanie14/proverkaZadachi';
import { Otvet14 } from './Otvet14';
import { Podskazki14 } from './Podskazki14';
import { Reshenie14 } from './Reshenie14';
import { Uslovie14 } from './Uslovie14';

/** Сколько задач блока решено верно (для карточек списка). */
export function ReshenoVBloke14({ ids }: { ids: string[] }) {
  const progress = opornye14.useProgress();
  const n = ids.filter((id) => progress.outcomes[id] === 'right').length;
  return (
    <span className="z14-op__progress">
      решено {n} из {ids.length}
    </span>
  );
}

interface Sostoyanie {
  vvod: Vvod14;
  itog: Itog14 | null;
  otkryto: number;
  mimo: number[];
  reshenie: boolean;
}

const NOVOE: Sostoyanie = { vvod: PUSTOY_VVOD, itog: null, otkryto: 0, mimo: [], reshenie: false };

/**
 * Экран блока опорных задач №14. Сверху — «Запомни» с примером. Задача
 * 1 — с полным разбором (решение открыто сразу), задачи 2–10 — сам
 * решаешь: ввод серий и корней, подсказка-вопросы с кнопками, полное
 * решение с окружностью после проверки или по кнопке.
 */
export function Opornye14({ slug }: { slug: string }) {
  const blok = BLOKI_14.find((b) => b.slug === slug);
  const [i, setI] = useState(0);
  const [sost, setSost] = useState<Record<string, Sostoyanie>>({});
  const progress = opornye14.useProgress();
  if (blok === undefined) return null;
  const z = blok.zadachi[i];
  if (z === undefined) return null;
  const s = sost[z.id] ?? NOVOE;
  const obnovit = (p: Partial<Sostoyanie>) => setSost({ ...sost, [z.id]: { ...s, ...p } });
  const razbor = i === 0;
  return (
    <div className="z14-op flow">
      <Callout tone="zapomni" primer={<Tex text={blok.primer} />}>
        <Tex text={blok.zapomni} />
      </Callout>
      <ol className="z14-tochki" aria-label="Задачи блока">
        {blok.zadachi.map((x, k) => {
          const it = progress.outcomes[x.id];
          return (
            <li key={x.id}>
              <button
                type="button"
                aria-current={k === i}
                aria-label={`Задача ${k + 1}${k === 0 ? ', разбор' : ''}`}
                className={clsx(
                  'z14-tochka',
                  it === 'right' ? 'is-verno' : it === undefined ? '' : 'is-neverno',
                )}
                onClick={() => setI(k)}
              >
                {k + 1}
              </button>
            </li>
          );
        })}
      </ol>
      <article className="z14-zadacha flow">
        <p className="z14-zadacha__metka">{razbor ? 'Разбор' : `Задача ${i + 1} из ${blok.zadachi.length}`}</p>
        <Uslovie14 z={z} />
        {razbor ? (
          <Reshenie14 z={z} />
        ) : (
          <>
            <Otvet14
              z={z}
              vvod={s.vvod}
              onVvod={(vvod) => obnovit({ vvod })}
              itog={s.itog}
              onProverit={() => {
                const itog = proverit14(z, s.vvod);
                const ok = verno14(itog);
                obnovit({ itog });
                opornye14.recordAttempt({
                  kind: blok.id,
                  taskId: z.id,
                  right: ok,
                  clean: ok && s.otkryto === 0,
                  seconds: 0,
                  itog: ok ? 'right' : 'wrong',
                });
              }}
            />
            <div className="z14-zadacha__dop">
              {s.otkryto === 0 ? (
                <button type="button" className="btn btn--secondary" onClick={() => obnovit({ otkryto: 1 })}>
                  Подсказка
                </button>
              ) : null}
              <button
                type="button"
                className="btn btn--ghost"
                onClick={() => obnovit({ reshenie: !s.reshenie })}
              >
                {s.reshenie ? 'Скрыть решение' : 'Показать решение'}
              </button>
              {i + 1 < blok.zadachi.length ? (
                <button type="button" className="btn btn--ghost" onClick={() => setI(i + 1)}>
                  Следующая
                </button>
              ) : null}
            </div>
            {s.otkryto > 0 ? (
              <Podskazki14
                shagi={z.podskazki}
                otkryto={s.otkryto}
                mimo={s.mimo}
                onVerno={() => obnovit({ otkryto: s.otkryto + 1, mimo: [] })}
                onMimo={(j) => obnovit({ mimo: [...s.mimo, j] })}
              />
            ) : null}
            {s.reshenie || (s.itog !== null && s.itog.a !== 'pusto') ? <Reshenie14 z={z} /> : null}
          </>
        )}
        {razbor && blok.zadachi.length > 1 ? (
          <button type="button" className="btn btn--primary" onClick={() => setI(1)}>
            К задаче 2
          </button>
        ) : null}
      </article>
    </div>
  );
}
