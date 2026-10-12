import type { Metadata } from 'next';
import { DomashnyayaRabota } from '@/components/tasks/veroyatnost/dz5/DomashnyayaRabota';
import { veroyatnostTitle, vkladka } from '@/content/veroyatnost';
import { ZADANIYA } from '@/lib/paths';
import '@/components/tasks/veroyatnost/dz5/dz5.css';

export const metadata: Metadata = {
  title: veroyatnostTitle('5', vkladka('5', 'dz')),
};

/**
 * Вкладка «Домашняя работа» задания №5: выдать готовое ДЗ или собрать
 * его из генератора. Экран — клиентский: задачи считаются в браузере
 * теми же шаблонами, что и листы печати (lib/veroyatnost/dz5).
 */
export default function DomashnyayaRabota5Tab() {
  return (
    <>
      {/* Название вкладки — H2 панели; у экрана свой заголовок ниже. */}
      <h2 className="t-h2 vtab__title">{vkladka('5', 'dz')}</h2>
      <DomashnyayaRabota base={`${ZADANIYA}/5`} />
    </>
  );
}
