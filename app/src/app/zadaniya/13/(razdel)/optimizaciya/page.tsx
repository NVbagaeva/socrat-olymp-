import type { Metadata } from 'next';
import { TabScrollOnMount } from '@/components/tasks/TabScroll';
import { Optimizaciya13 } from '@/components/tasks/zadanie13/Optimizaciya13';
import { OPTIMIZACIYA13 } from '@/content/ekonomicheskie13';
import { zadanie13Zagolovok } from '@/lib/seo-razdely';

export const metadata: Metadata = {
  title: zadanie13Zagolovok(OPTIMIZACIYA13.title),
};

/**
 * Вкладка «На оптимизацию» №13 (в ЕГЭ-2027 — второй вид задач задания
 * №16). Каталог задач собирается на сборке, задачи — в браузере.
 */
export default function Optimizaciya13Page() {
  return (
    <>
      <TabScrollOnMount />
      <Optimizaciya13 />
    </>
  );
}
