import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Trenazher } from '@/components/tasks/veroyatnost/Trenazher';
import { navykiMetodov, yarlyki } from '@/components/tasks/veroyatnost/navyki';
import { tasksPage } from '@/content/tasks';
import { veroyatnostBySlug, veroyatnostTitle } from '@/content/veroyatnost';
import { bank4Pool, uznayMetodPool } from '@/lib/veroyatnost/pool';

/* Адреса перечислимы на сборке: методы с задачами и два режима. */
export function generateStaticParams() {
  return yarlyki(bank4Pool(), 4).map((item) => ({ mode: item.id }));
}
export const dynamicParams = false;

type Params = Promise<{ mode: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { mode } = await params;
  const found = yarlyki(bank4Pool(), 4).find((item) => item.id === mode);
  return found === undefined ? {} : { title: veroyatnostTitle('4', `${found.title} · Тренажёр`) };
}

/**
 * Ярлык к конфигуратору — как у задания №12: адрес режима открывает
 * ту же вкладку с уже выбранным методом или режимом. Своих задач у
 * адреса нет — тренировка собирается там же, где и без него.
 */
export default async function Page({ params }: { params: Params }) {
  const { mode } = await params;
  const pool = bank4Pool();
  const found = yarlyki(pool, 4).find((item) => item.id === mode);
  if (found === undefined) {
    notFound();
  }
  return (
    <Trenazher
      pool={pool}
      uznay={uznayMetodPool(4)}
      zadanie={4}
      base={`${tasksPage.href}/4/trenazher/`}
      family={veroyatnostBySlug('4')?.title ?? ''}
      skills={navykiMetodov(pool, 4)}
      preset={{ skill: found.skill, mode: found.mode }}
    />
  );
}
