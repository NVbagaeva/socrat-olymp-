import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Trenazher } from '@/components/tasks/veroyatnost/Trenazher';
import { navykiMetodov, yarlyki } from '@/components/tasks/veroyatnost/navyki';
import { tasksPage } from '@/content/tasks';
import { veroyatnostFamily, veroyatnostTitle, vkladka } from '@/content/veroyatnost';
import { bank5Pool, uznayMetodPool } from '@/lib/veroyatnost/pool';

/* Адреса перечислимы на сборке: методы с задачами и два режима. */
export function generateStaticParams() {
  return yarlyki(bank5Pool(), 5).map((item) => ({ mode: item.id }));
}
export const dynamicParams = false;

type Params = Promise<{ mode: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { mode } = await params;
  const found = yarlyki(bank5Pool(), 5).find((item) => item.id === mode);
  return found === undefined ? {} : { title: veroyatnostTitle('5', `${found.title} · Тренажёр`) };
}

/**
 * Ярлык к конфигуратору задания №5 — как у задания №12: адрес режима
 * открывает ту же вкладку с уже выбранным методом или режимом.
 */
export default async function Page({ params }: { params: Params }) {
  const { mode } = await params;
  const pool = bank5Pool();
  const found = yarlyki(pool, 5).find((item) => item.id === mode);
  if (found === undefined) {
    notFound();
  }
  return (
    <>
      {/* Название вкладки — H2 панели: конфигуратор и подход — общие с №12 экраны без своего заголовка. */}
      <h2 className="t-h2 vtab__title">{vkladka('5', 'trenazher')}</h2>
      <Trenazher
        pool={pool}
        uznay={uznayMetodPool(5)}
        zadanie={5}
        base={`${tasksPage.href}/5/trenazher/`}
        family={veroyatnostFamily('5')}
        skills={navykiMetodov(pool, 5)}
        preset={{ skill: found.skill, mode: found.mode }}
      />
    </>
  );
}
