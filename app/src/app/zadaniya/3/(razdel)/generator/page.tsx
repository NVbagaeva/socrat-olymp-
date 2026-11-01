import type { Metadata } from 'next';
import { Generator3 } from '@/components/tasks/solid3/Generator3';
import { VariantFromSection } from '@/components/variant/VariantEntry';
import { info3 } from '@/lib/zadanie3/gen/info';
import { ZADANIYA } from '@/lib/paths';
import { metaVkladki } from '@/content/seo';
import { BlokRazdela } from '@/components/seo/BlokRazdela';

export const metadata: Metadata = metaVkladki(3, 'generator');

/**
 * Вкладка «Генератор» задания №3: лист ученика и лист учителя из одного
 * набора, варианты, PDF. Разделы и прототипы — на сборке, задачи и
 * чертежи — в браузере, по первому «Сгенерировать».
 */
export default function Page() {
  return (
    <>
      <VariantFromSection />
      <Generator3 razdely={info3()} base={`${ZADANIYA}/3`} />
      <BlokRazdela no={3} vid="generator" />
    </>
  );
}
