import type { Metadata } from 'next';
import { Trenazher18 } from '@/components/zadanie18/Trenazher18';
import { ZADANIE18, vkladka18, zadanie18Title } from '@/content/zadanie18';
import { ZADANIYA } from '@/lib/paths';
/* Выбор тренировки и экран задания — общие слои тренажёров (№8, №12, №19). */
import '../../../[task]/[type]/configurator.css';
import '../../../[task]/[type]/trainer.css';
import '../../../[task]/[type]/prep.css';

const VKLADKA = vkladka18('trenazher');

export const metadata: Metadata = {
  title: zadanie18Title(VKLADKA),
};

/** Вкладка «Тренажёр» №18: тренировка на общей сессии — тема, уровень и число задач. */
export default function Trenazher18Tab() {
  return <Trenazher18 vkladka={VKLADKA} base={`${ZADANIYA}/${ZADANIE18.slug}`} />;
}
