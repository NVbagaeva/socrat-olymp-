import type { Metadata } from 'next';
import { Generator13 } from '@/components/tasks/zadanie13/Generator13';
import { ZADANIE13, zadanie13Title } from '@/content/zadanie13';
import { VariantFromSection } from '@/components/variant/VariantEntry';

const VKLADKA = ZADANIE13.tabs.find((tab) => tab.id === 'generator')?.label ?? '';

export const metadata: Metadata = {
  title: zadanie13Title(VKLADKA),
};

/**
 * Вкладка «Генератор» задания №13: общий экран generator-v2 с
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
