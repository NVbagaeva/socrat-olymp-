import { Tex } from '@/components/ui/Tex';
import type { Etap, Solved } from '@/lib/zadanie7/types';

/**
 * Разбор уравнения №7: подписанные этапы (Шаг 1. Тип уравнения и план …
 * Шаг N. Проверка подстановкой), раскрывающаяся панель «Считаем с умом»
 * с признаками делимости и — в галерее — подсказки-вопросы с верной
 * кнопкой. Этапы «ОДЗ» и «Отбор корней» выделены цветом: на листе
 * учителя и в тренажёре они должны быть видны сразу. Серверный
 * компонент: формулы набираются KaTeX при сборке.
 */

function vid(e: Etap): string {
  if (e.title.endsWith('ОДЗ')) {
    return 'z7-razbor__etap z7-razbor__etap--odz';
  }
  if (e.title.endsWith('Отбор корней')) {
    return 'z7-razbor__etap z7-razbor__etap--otbor';
  }
  return 'z7-razbor__etap';
}

export function Razbor7({ s, podskazki = false }: { s: Solved; podskazki?: boolean }) {
  return (
    <div className="z7-razbor">
      {s.etapy.map((e) => (
        <section className={vid(e)} key={e.title}>
          <h4 className="z7-razbor__title">{e.title}</h4>
          {e.lines.map((l) => (
            <p className="z7-razbor__line" key={l}>
              <Tex text={l} />
            </p>
          ))}
        </section>
      ))}
      {s.vychisleniya.length > 0 ? (
        <details className="z7-razbor__calc">
          <summary>Считаем с умом</summary>
          <ul>
            {s.vychisleniya.map((c) => (
              <li key={`${c.tekst}${c.tex ?? ''}`}>
                <Tex text={c.tekst} />
                {c.tex ? (
                  <span className="z7-razbor__calc-tex">
                    <Tex text={`$${c.tex}$`} />
                  </span>
                ) : null}
              </li>
            ))}
          </ul>
        </details>
      ) : null}
      {podskazki ? (
        <details className="z7-razbor__calc">
          <summary>Подсказки-вопросы</summary>
          <ol>
            {s.hints.map((h) => (
              <li key={h.question}>
                <Tex text={h.question} />{' '}
                {h.options.map((o, i) => (
                  <span key={o} className={i === h.correct ? 'z7-hint z7-hint--ok' : 'z7-hint'}>
                    <Tex text={o} />
                  </span>
                ))}
                {h.comment ? (
                  <span className="z7-hint__comment">
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
