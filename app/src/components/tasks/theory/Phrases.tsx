import type { Phrase } from '@/content/theoryLinear';
import { katex } from '@/lib/graph/katex';

/**
 * Куски текста из конфига: обычные, полужирные и математические.
 *
 * Переменные набирает KaTeX прямо на сборке, поэтому в браузер уходит
 * готовая разметка. В полужирном обороте переменная тоже полужирная —
 * иначе она выпадала бы из строки по весу.
 *
 * Куски обёрнуты одним строчным контейнером: заголовки карточек —
 * flex (рядом иконка), и без обёртки каждый кусок и каждая формула
 * становились отдельным flex-элементом — «Сдвиги по асимптотам, k по
 * точке» рассыпался на столбики. Обёртка — один элемент, внутри
 * которого текст и формулы идут обычной строкой.
 */
export function Phrases({ parts }: { parts: Phrase[] }) {
  return (
    <span className="phrases">
      {parts.map((part, index) => {
        if (part.math === true) {
          const tex = part.strong === true ? `\\boldsymbol{${part.text}}` : part.text;
          return (
            <span
              key={index}
              className="math"
              /* Разметка своя, из конфига проекта: KaTeX собирает её
                 на сборке и сам кладёт внутрь MathML для скринридера. */
              dangerouslySetInnerHTML={{
                __html: katex.renderToString(tex, { throwOnError: false, displayMode: false }),
              }}
            />
          );
        }
        return part.strong === true ? (
          <strong key={index}>{part.text}</strong>
        ) : (
          <span key={index}>{part.text}</span>
        );
      })}
    </span>
  );
}
