import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Trenazher45Tab } from '@/components/tasks/veroyatnost/trening/Trenazher45Tab';
import { yarlyki } from '@/components/tasks/veroyatnost/navyki';
import { veroyatnostTitle, vkladka } from '@/content/veroyatnost';
import { bank5Pool } from '@/lib/veroyatnost/pool';

/* Адреса перечислимы на сборке: методы с задачами и два режима. */
export function generateStaticParams() {
  return yarlyki(bank5Pool(), 5).map((item) => ({ mode: item.id }));
}
export const dynamicParams = false;

type Params = Promise<{ mode: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { mode } = await params;
  const found = yarlyki(bank5Pool(), 5).find((item) => item.id === mode);
  return found === undefined
    ? {}
    : { title: veroyatnostTitle('5', `${found.title} · ${vkladka('5', 'trenazher')}`) };
}

/**
 * Ярлык тренажёра — прежний адрес режима: метод открывает выбор тем с
 * типами этого метода, «вперемешку» и «Узнай метод» — сразу тренировку.
 * Своих задач у адреса нет — тренировка собирается там же, где и без него.
 */
export default async function Page({ params }: { params: Params }) {
  const { mode } = await params;
  const found = yarlyki(bank5Pool(), 5).find((item) => item.id === mode);
  if (found === undefined) {
    notFound();
  }
  return (
    <Trenazher45Tab
      zadanie={5}
      preset={
        found.skill !== null
          ? { metod: found.skill }
          : { rezhim: found.mode === 'uznay' ? 'uznay' : 'mix' }
      }
    />
  );
}
