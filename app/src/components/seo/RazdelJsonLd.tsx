import { seoVkladki, temaZadaniya, temyRazdela } from '@/content/seo';
import { learningResourceLd } from '@/lib/schema';
import { JsonLd } from './JsonLd';

/**
 * Раздел задания для поиска: LearningResource (lib/schema.ts). Ставится
 * в оболочку раздела рядом с шапкой — один на каждой странице раздела.
 */
export function RazdelJsonLd({ no, slug }: { no: number; slug: string }) {
  const { description } = seoVkladki(no, 'o-zadanii');
  return (
    <JsonLd
      data={learningResourceLd({
        no,
        name: `Задание ${no} ЕГЭ по профильной математике: ${temaZadaniya(no)}`,
        description,
        href: `/zadaniya/${slug}/`,
        teaches: temyRazdela(no),
      })}
    />
  );
}
