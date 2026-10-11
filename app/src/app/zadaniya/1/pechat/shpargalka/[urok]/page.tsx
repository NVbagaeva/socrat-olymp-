import type { Metadata } from 'next';
import { PechatKnopka1 } from '@/components/tasks/planimetriya/PechatKnopka1';
import { SHPARGALKI_1 } from '@/content/teoriya1';
import { zadanie1Title } from '@/content/zadanie1';
import { shpargalkaHtml } from '@/lib/planimetriya/spravochnik';
import 'katex/dist/katex.min.css';
import '@/lib/planimetriya/planimetriya.css';
import '../../pechat1.css';

export function generateStaticParams() {
  return Object.keys(SHPARGALKI_1).map((urok) => ({ urok }));
}
export const dynamicParams = false;

type Params = Promise<{ urok: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { urok } = await params;
  return { title: zadanie1Title(`Шпаргалка к уроку ${urok}`), robots: { index: false } };
}

/**
 * «Шпаргалка к уроку N»: карточки урока плиткой справочника. Тот же
 * HTML встаёт в начало листа ученика урока «Для репетиторов».
 */
export default async function Shpargalka1Page({ params }: { params: Params }) {
  const { urok } = await params;
  const kartochki = SHPARGALKI_1[Number(urok)] ?? [];
  return (
    <>
      <PechatKnopka1
        label="Скачать PDF / Печать"
        lead="В окне печати выберите «Сохранить как PDF»."
      />
      <main
        className="spr spr--shp"
        dangerouslySetInnerHTML={{ __html: shpargalkaHtml(kartochki, `Шпаргалка к уроку ${urok}`) }}
      />
    </>
  );
}
