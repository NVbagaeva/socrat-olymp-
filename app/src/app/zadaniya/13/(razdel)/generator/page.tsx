import type { Metadata } from 'next';
import { Generator13 } from '@/components/tasks/zadanie13/Generator13';
import { VariantFromSection } from '@/components/variant/VariantEntry';
import { metaVkladki } from '@/content/seo';
import { BlokRazdela } from '@/components/seo/BlokRazdela';

export const metadata: Metadata = metaVkladki(13, 'generator');

/**
 * Вкладка «Генератор» задания №13: общий генератор (components/generator) с
 * конфигом раздела. Задачи и ответы считает движок в браузере.
 */
export default function Generator13Tab() {
  return (
    <>
      <VariantFromSection />
      <Generator13 />
      <BlokRazdela no={13} vid="generator" />
    </>
  );
}
