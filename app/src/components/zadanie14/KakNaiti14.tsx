import { Tex } from '@/components/ui/Tex';
import { PRAVILA_OK14 } from '@/content/okruzhnost14';

/**
 * Сворачиваемый блок под тренажёром окружности: как найти точку для
 * большого или отрицательного угла. Набирается на сервере.
 */
export function KakNaiti14({ teoriyaHref }: { teoriyaHref: string }) {
  return (
    <details className="ok14-spravka">
      <summary className="ok14-spravka__summary">Как найти точку для большого угла</summary>
      <div className="ok14-spravka__telo flow">
        {PRAVILA_OK14.map((p) => (
          <section key={p.title} className={`ok14-pravilo ok14-pravilo--${p.ton}`}>
            <h4 className="ok14-pravilo__title">
              <Tex text={p.title} zagolovok />
            </h4>
            <p>
              <Tex text={p.text} />
            </p>
            <ul className="ok14-pravilo__primery">
              {p.primery.map((t) => (
                <li key={t}>
                  <Tex text={t} />
                </li>
              ))}
            </ul>
          </section>
        ))}
        <p>
          Подробнее — в теории, пункт{' '}
          <a href={teoriyaHref}>3.1 «Единичная окружность, угол и радиан»</a>.
        </p>
      </div>
    </details>
  );
}
