import type { Metadata } from 'next';
import { Vitrina15 } from '@/components/zadanie15/Vitrina15';
import { PRIMERY } from '@/lib/zadanie15/render/primery';
import { typeset } from '@/lib/tex';
import 'katex/dist/katex.min.css';
import './vitrina.css';

export const metadata: Metadata = {
  title: 'Витрина чертежа · Задание 15 — Будет на ЕГЭ',
  robots: { index: false, follow: false },
};

/**
 * Служебная страница: витрина движка чертежа задания №15 для ручной
 * проверки. noindex, ссылок на неё из меню и сайдбара нет. Сам движок
 * (three.js) грузится только здесь и только после открытия страницы.
 */
export default function Vitrina15Page() {
  const primery = PRIMERY.map((p) => ({ id: p.id, titleHtml: typeset(p.title) }));
  return (
    <main className="z15-vit-page">
      <h1 className="z15-vit-page__title">Витрина чертежа · задание 15</h1>
      <p className="z15-vit-page__lead">
        Служебная страница. Вращайте фигуру мышью или пальцем, колесо и щипок — масштаб, правая
        кнопка или два пальца — сдвиг.
      </p>
      <Vitrina15 primery={primery} />
    </main>
  );
}
