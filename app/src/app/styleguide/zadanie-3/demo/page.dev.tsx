import type { Metadata } from 'next';
import '@/components/tasks/steklo/steklo.css';
import { VARIANTY3 } from './demo3Data';
import './demo3.css';

/* Оглавление демо задания №3 — только для разработки (page.dev.tsx:
   маршрут есть лишь в `next dev` или со флагом GALEREYA=1). Адрес
   /styleguide/zadanie-3/ занят витриной банка, поэтому демо — рядом,
   в /styleguide/zadanie-3/demo/. */

export const metadata: Metadata = {
  title: 'Демо оформления задания №3',
  robots: { index: false, follow: false },
};

export default function Demo3Index() {
  return (
    <main className="d3 d3--oglavlenie">
      <h1 className="d3-razdel__zag">Задание №3: два варианта оформления</h1>
      <p className="stk-lead">
        Вкладки «О задании», «Опорные задачи» и «Тренажёр» на настоящих задачах, чертежах и разборах
        банка №3. Служебная страница: в меню не входит, в обычной сборке её нет.
      </p>
      <div className="d3-varianty">
        {VARIANTY3.map((item) => (
          <a
            className="d3-variant stk-glass"
            href={`/styleguide/zadanie-3/demo/${item.id}/`}
            key={item.id}
          >
            <b>
              Вариант {item.bukva} · «{item.nazvanie}»
            </b>
            <span>{item.lead}</span>
          </a>
        ))}
      </div>
    </main>
  );
}
