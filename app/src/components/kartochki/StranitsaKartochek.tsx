import type { Metadata } from 'next';
import { VKLADKA_KARTOCHKI } from '@/content/kartochkiUi';
import { kolodaNomera } from '@/content/kartochki';
import { podgotovit } from '@/lib/kartochki/podgotovka';
import { ZADANIYA } from '@/lib/paths';
import { Kartochki } from './Kartochki';
import './kartochki.css';

/** Заголовок окна: «Карточки · Планиметрия — Будет на ЕГЭ», как у остальных вкладок. */
export function metadataKartochek(task: number): Metadata {
  return { title: `${VKLADKA_KARTOCHKI.label} · ${kolodaNomera(task).title} — Будет на ЕГЭ` };
}

/**
 * Вкладка «Карточки» номера. Страница серверная: формулы набирает
 * KaTeX, чертежи рисуют движки номеров на сборке, в браузер уходят
 * готовые HTML и SVG. Колода — content/kartochki/NN-*.ts.
 */
export function StranitsaKartochek({ task }: { task: number }) {
  const koloda = kolodaNomera(task);
  return <Kartochki koloda={podgotovit(koloda, `${ZADANIYA}/${koloda.slug}`)} />;
}
