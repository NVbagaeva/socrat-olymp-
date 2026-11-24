import type { Metadata } from 'next';
import { Generator13 } from '@/components/tasks/zadanie13/Generator13';
import { ZADANIE13 } from '@/content/zadanie13';
import { VariantFromSection } from '@/components/variant/VariantEntry';
import { zadanie13Zagolovok } from '@/lib/seo-razdely';

const VKLADKA = ZADANIE13.tabs.find((tab) => tab.id === 'generator')?.label ?? '';

export const metadata: Metadata = {
  title: zadanie13Zagolovok(VKLADKA),
};

/**
 * Вкладка «Генератор» задания №13: общий генератор (components/generator) с
 * конфигом раздела. Задачи и ответы считает движок в браузере.
 */
export default function Generator13Tab() {
  return (
    <>
      <VariantFromSection />
      <Generator13 />
    </>
  );
}
