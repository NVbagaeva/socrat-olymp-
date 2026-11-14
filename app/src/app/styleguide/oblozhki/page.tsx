import type { Metadata } from 'next';
import { RisunokRazdela } from '@/components/tasks/stsena';
import { tasks } from '@/content/tasks';
import './oblozhki.css';

/* Служебная витрина обложек разделов: мотивы, нарисованные кодом
   (components/tasks/stsena/RisunokRazdela.tsx), все разом и в том же
   стекле, что в шапке раздела. Страница в меню не входит и не
   индексируется. */

export const metadata: Metadata = {
  title: 'Обложки разделов — витрина',
  robots: { index: false, follow: false },
};

export default function OblozhkiPage() {
  return (
    <main className="sg-obl">
      <h1 className="t-h1">Обложки разделов</h1>
      <p className="sg-obl__lead">
        Здесь собраны все мотивы. Мотив рисуется кодом и ставится в шапку раздела там, где у задания
        нет своей картинки. У №3 на этом месте остаётся стеклянный куб, у №1, №4 и №12 — их прежние
        иллюстрации, поэтому их мотив в шапку не попадает.
      </p>
      <ul className="sg-obl__setka">
        {tasks.map((t) => (
          <li className="sg-obl__karta" key={t.no}>
            <div className="sg-obl__ramka">
              <RisunokRazdela no={t.slug} label={`Обложка раздела №${t.no}`} />
            </div>
            <p className="sg-obl__podpis">
              №{t.no} · {t.name}
            </p>
          </li>
        ))}
      </ul>
    </main>
  );
}
