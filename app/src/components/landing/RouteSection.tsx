import Link from 'next/link';
import { VkladkaIkonka } from '@/components/tasks/VkladkaIkonka';
import { landing } from '@/content/landing';
import { tutorsExampleBase } from '@/content/tasks';
import { href } from '@/lib/paths';

const { route } = landing;

/**
 * Маршрут подготовки: шесть шагов, каждый — вкладка раздела задания.
 *
 * Шаг — ссылка в задание-пример, значок тот же, что у вкладки в ленте
 * раздела: человек узнаёт его, когда откроет задание. Порядок шагов —
 * порядок вкладок в ленте.
 */
export function RouteSection() {
  return (
    <section className="band band--soft" id="route" aria-labelledby="route-title">
      <div className="wrap">
        <div className="band__head">
          <h2 id="route-title">{route.title}</h2>
          <p>{route.lead}</p>
        </div>

        <ol className="route">
          {route.steps.map((step) => (
            <li className="route__item" key={step.no}>
              <Link className="route__step" href={href(tutorsExampleBase, step.tail)}>
                <span className="route__no" aria-hidden="true">
                  {step.no}
                </span>
                <span className="route__body">
                  <span className="route__verb">
                    <span className="sr-only">Шаг {Number(step.no)}. </span>
                    {step.verb}
                  </span>
                  <span className="route__section">
                    <span className="route__ico" aria-hidden="true">
                      <VkladkaIkonka name={step.icon} />
                    </span>
                    {step.section}
                  </span>
                  <span className="route__text">{step.text}</span>
                </span>
              </Link>
            </li>
          ))}
        </ol>

        <p className="route__note">{route.note}</p>
      </div>
    </section>
  );
}
