import { Tex } from '@/components/ui/Tex';
import type { Solved } from '@/lib/zadanie10/types';

/**
 * Разбор задачи №10: таблица «Дано», подписанные этапы (Шаг 1. Что
 * дано … Шаг N. Проверка здравым смыслом) и раскрывающаяся панель
 * «Считаем с умом». Серверный компонент: формулы набираются KaTeX при
 * сборке. Тот же разбор — в тренажёре, на листе учителя и в галерее.
 */
export function Razbor10({ s, podskazki = false }: { s: Solved; podskazki?: boolean }) {
  const [pervyy, ...ostalnye] = s.etapy;
  return (
    <div className="z10-razbor">
      {pervyy ? (
        <section className="z10-razbor__etap">
          <h4 className="z10-razbor__title">{pervyy.title}</h4>
          <table className="z10-dano">
            <thead>
              <tr>
                <th scope="col">Величина</th>
                <th scope="col">Значение</th>
                <th scope="col">Что это</th>
              </tr>
            </thead>
            <tbody>
              {s.dano.map((r) => (
                <tr key={`${r.oboz}-${r.znach}`}>
                  <td>
                    <Tex text={`$${r.oboz}$`} />
                  </td>
                  <td>
                    <Tex text={`$${r.znach}$`} />
                    {r.ed ? <span className="z10-dano__ed"> {r.ed}</span> : null}
                  </td>
                  <td>
                    <Tex text={r.smysl} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ) : null}
      {ostalnye.map((e) => (
        <section className="z10-razbor__etap" key={e.title}>
          <h4 className="z10-razbor__title">{e.title}</h4>
          {e.lines.map((l) => (
            <p className="z10-razbor__line" key={l}>
              <Tex text={l} />
            </p>
          ))}
        </section>
      ))}
      {s.vychisleniya.length > 0 ? (
        <details className="z10-razbor__calc">
          <summary>Считаем с умом</summary>
          <ul>
            {s.vychisleniya.map((c) => (
              <li key={`${c.tekst}${c.tex ?? ''}`}>
                <Tex text={c.tekst} />
                {c.tex ? (
                  <span className="z10-razbor__calc-tex">
                    <Tex text={`$${c.tex}$`} />
                  </span>
                ) : null}
              </li>
            ))}
          </ul>
        </details>
      ) : null}
      {podskazki ? (
        <details className="z10-razbor__calc">
          <summary>Подсказки-вопросы</summary>
          <ol>
            {s.hints.map((h) => (
              <li key={h.question}>
                <Tex text={h.question} />{' '}
                {h.options.map((o, i) => (
                  <span key={o} className={i === h.correct ? 'z10-hint z10-hint--ok' : 'z10-hint'}>
                    <Tex text={o} />
                  </span>
                ))}
              </li>
            ))}
          </ol>
        </details>
      ) : null}
    </div>
  );
}
