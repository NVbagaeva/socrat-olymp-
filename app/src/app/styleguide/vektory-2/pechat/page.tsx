'use client';

import { useEffect } from 'react';
import { Risunok } from '@/components/tasks/vektory/Risunok';
import { OBRAZTSY } from '@/lib/vektory/obraztsy';
import '@/lib/sheet/theme.css';
import '@/lib/vektory/vektory.css';
import '../vektory-2.css';

/* Витрина движка №2 в ч/б теме печати.

   Тема печатного листа выбирается атрибутом на <html>, как это
   делает SheetPage8: своих «печатных» цветов у движка нет, векторы
   чернеют через тот же токен --color-primary, что и графики №12.
   Страница клиентская, потому что атрибут ставится в браузере;
   в меню её нет. */

const POKAZAT = ['tri', 'podskazka', 'bez-setki', 'cherez-osi'];

export default function VektoryPechatPage() {
  useEffect(() => {
    const root = document.documentElement;
    const prev = root.dataset.sheetTheme;
    root.dataset.sheetTheme = 'print';
    return () => {
      if (prev === undefined) delete root.dataset.sheetTheme;
      else root.dataset.sheetTheme = prev;
    };
  }, []);

  return (
    <main className="v2">
      <header className="v2__head">
        <h1 className="t-h1">Рисунки задания №2 — ч/б печать</h1>
        <p className="v2__lead">
          Те же образцы в теме печати (data-sheet-theme=&quot;print&quot;): векторы и оси чёрные,
          сетка серая, катеты подсказки тоже чёрные.
        </p>
      </header>
      <section className="v2__section" id="pechat">
        <div className="v2__grid">
          {OBRAZTSY.filter((o) => POKAZAT.includes(o.id)).map((o) => (
            <figure className="v2__card" key={o.id} id={o.id}>
              <Risunok config={o.config} />
              <figcaption className="t-sm">
                {o.id} · {o.title}
              </figcaption>
            </figure>
          ))}
        </div>
      </section>
    </main>
  );
}
