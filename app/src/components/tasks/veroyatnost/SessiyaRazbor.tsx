'use client';

import { useMemo } from 'react';
import { uznaySlova, type Zadanie } from '@/content/veroyatnost';
import { otkrytRazbor, type Razbor } from '@/lib/veroyatnost/razbor';
import { openText } from '@/lib/veroyatnost/secret';
import { navykPoId } from './metody';
import type { SessiyaZadacha } from './sessiyaPayload';
import { VykladkaKlient } from './VykladkaKlient';

/**
 * Разбор задачи на экране итогов: верный ответ и решение по шагам,
 * те же, что открывает «Показать решение» во время тренировки. Ответ
 * запечатан, поэтому раскрывается только здесь, по нажатию ученика.
 */
export function SessiyaRazbor({ task }: { task: SessiyaZadacha }) {
  const razbor = useMemo<Razbor>(() => otkrytRazbor(task.steps, task.seal), [task]);
  return (
    <div className="tsum__answer">
      <p>
        Верный ответ: <b>{razbor.otvet}</b>
      </p>
      {razbor.metod === '' ? null : (
        <p>
          <b>Метод:</b> {razbor.metod}
        </p>
      )}
      <ol className="pc-steps">
        {razbor.shagi.map((shag, i) => (
          <li key={i} className="pc-step">
            <span className="pc-step__no" aria-hidden="true">
              {i + 1}
            </span>
            <div className="pc-step__body">
              <p className="pc-step__text">{shag.text}</p>
              {shag.vykladka === undefined ? null : (
                <VykladkaKlient className="pc-step__formula" vykladka={shag.vykladka} />
              )}
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

/** Разбор «Узнай метод»: верный метод и признаки, по которым он виден. */
export function UznayRazbor({
  task,
  zadanie,
  verny,
}: {
  task: SessiyaZadacha;
  zadanie: Zadanie;
  verny: string;
}) {
  const priznaki = useMemo(
    () => JSON.parse(openText(task.hints, task.metodSeal)) as string[],
    [task],
  );
  const slova = uznaySlova(zadanie);
  return (
    <div className="tsum__answer">
      <p>
        {slova.pravilnyy} <b>{navykPoId(zadanie, verny)?.nazvanie}</b>
      </p>
      <p>{slova.priznaki}</p>
      <ul className="z4-uznay__priznaki">
        {priznaki.map((p) => (
          <li key={p} dangerouslySetInnerHTML={{ __html: p }} />
        ))}
      </ul>
    </div>
  );
}
