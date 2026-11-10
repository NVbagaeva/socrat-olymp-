import type { Metadata } from 'next';
import { VARIANTY8 } from './demo8Data';
import './demo8.css';

/* Оглавление демо задания №8 — только для разработки (page.dev.tsx:
   маршрут есть лишь в `next dev` или со флагом GALEREYA=1). */

export const metadata: Metadata = {
  title: 'Демо оформления задания №8',
  robots: { index: false, follow: false },
};

export default function Demo8Index() {
  return (
    <main className="d8">
      <h1 className="d8-razdel">Задание №8: два варианта оформления</h1>
      <p className="d8-demo-lead">
        Вкладки «О задании» и «Тренажёр» на настоящих задачах и разборах генератора №8. Служебная
        страница: в меню не входит, в обычной сборке её нет.
      </p>
      <div className="d8-rezhimy">
        {VARIANTY8.map((item) => (
          <a
            className="d8-rezhim d8-glass"
            href={`/styleguide/zadanie-8/${item.id}/`}
            key={item.id}
          >
            <span className="d8-rezhim__ico">{item.bukva}</span>
            <span className="d8-rezhim__text">
              <b>
                Вариант {item.bukva} «{item.nazvanie}»
              </b>
              <span>{item.lead}</span>
            </span>
          </a>
        ))}
      </div>
    </main>
  );
}
