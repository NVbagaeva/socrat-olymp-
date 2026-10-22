import { Tex } from '@/components/ui/Tex';
import type { Solved } from '@/lib/zadanie6/types';
import { Ris6 } from './Ris6';
import { Tablica6 } from './Tablica6';

/**
 * Разбор задачи №6: подписанные этапы («Шаг 1. …»), таблица решения
 * (строки $x_ip_i$, $x_i^2p_i$, добавленный столбец «без выигрыша») и
 * рисунок с выделениями прямо в этапе, раскрывающаяся панель «Считаем с
 * умом» с признаками делимости и — в галерее — подсказки-вопросы с
 * верной кнопкой. Серверный компонент: формулы набираются при сборке.
 */
export function Razbor6({ s, podskazki = false }: { s: Solved; podskazki?: boolean }) {
  return (
    <div className="z6-razbor">
      {s.etapy.map((e) => (
        <section className="z6-razbor__etap" key={e.title}>
          <h4 className="z6-razbor__title">
            <Tex text={e.title} />
          </h4>
          {e.lines.map((l) => (
            <p className="z6-razbor__line" key={l}>
              <Tex text={l} />
            </p>
          ))}
          {e.tablica ? <Tablica6 t={e.tablica} /> : null}
          {e.ris ? <Ris6 ris={e.ris} /> : null}
        </section>
      ))}
      {s.vychisleniya.length > 0 ? (
        <details className="z6-razbor__calc">
          <summary>Считаем с умом</summary>
          <ul>
            {s.vychisleniya.map((c) => (
              <li key={`${c.tekst}${c.tex ?? ''}`}>
                <Tex text={c.tekst} />
                {c.tex ? (
                  <span className="z6-razbor__calc-tex">
                    <Tex text={`$${c.tex}$`} />
                  </span>
                ) : null}
              </li>
            ))}
          </ul>
        </details>
      ) : null}
      {podskazki ? (
        <details className="z6-razbor__calc">
          <summary>Подсказки-вопросы</summary>
          <ol>
            {s.hints.map((h) => (
              <li key={h.question}>
                <Tex text={h.question} />{' '}
                {h.options.map((o, i) => (
                  <span key={o} className={i === h.correct ? 'z6-hint z6-hint--ok' : 'z6-hint'}>
                    <Tex text={o} />
                  </span>
                ))}
                {h.comment ? (
                  <span className="z6-hint__comment">
                    {' '}
                    <Tex text={h.comment} />
                  </span>
                ) : null}
              </li>
            ))}
          </ol>
        </details>
      ) : null}
    </div>
  );
}
