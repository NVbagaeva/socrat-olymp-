import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Opornye11Screen } from '@/components/tasks/zadanie11/Opornye11Screen';
import { Opornye11Shell } from '@/components/tasks/zadanie11/Opornye11Shell';
import { OPORNYE } from '@/content/opornye';
import { O_ZADANII_11, ZADANIE11, zadanie11Title } from '@/content/zadanie11';
import { BLOKI, blokBySlug } from '@/lib/zadanie11/prep/bloki';
import { prepPool11 } from '@/lib/zadanie11/prep/pool';
import { SUBTYPES } from '@/lib/zadanie11/prototypes';
import { SECTIONS } from '@/lib/zadanie11/taxonomy';
import { typeset } from '@/lib/tex';
import { ZADANIYA } from '@/lib/paths';

/* Статический экспорт: адреса блоков известны до сборки. */
export function generateStaticParams() {
  return BLOKI.map((b) => ({ blok: b.slug }));
}
export const dynamicParams = false;

type Params = Promise<{ blok: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { blok } = await params;
  const found = blokBySlug(blok);
  return { title: zadanie11Title(found === undefined ? OPORNYE.title : found.nazvanie) };
}

/**
 * Блок «Опорных задач» №11: десять микрозадач в закрытом виде. Пул
 * собран на сборке — в разметку уходят условия, таблицы с «?»,
 * отпечатки, закрытые подсказки и разборы.
 */
export default async function Opornye11BlokPage({ params }: { params: Params }) {
  const { blok } = await params;
  const found = prepPool11().find((item) => item.slug === blok);
  if (found === undefined) {
    notFound();
  }
  const base = `${ZADANIYA}/${ZADANIE11.slug}`;
  const listHref = `${base}/${OPORNYE.tail}`;
  /* Куда дальше после 10/10: теория раздела, следующий блок, задачи
     ЕГЭ раздела — своего или первого, перед которым этот блок нужен. */
  const index = BLOKI.findIndex((b) => b.id === found.id);
  const sled = BLOKI[index + 1];
  const razdel =
    SECTIONS.find((s) => s.id === found.razdel) ??
    SECTIONS.find((s) => (O_ZADANII_11.pered[s.id] ?? []).includes(found.nazvanie));
  const tipy = razdel === undefined ? [] : SUBTYPES.filter((st) => st.section === razdel.id);
  return (
    <Opornye11Shell
      listHref={listHref}
      totals={BLOKI.map((b) => ({ id: b.id, total: b.zadachi.length }))}
      vBloke
    >
      <Opornye11Screen
        blockId={found.id}
        razdel={found.razdel}
        title={found.nazvanie}
        zachem={typeset(found.zachem)}
        teoriyaHtml={found.teoriyaHtml}
        tasks={found.zadachi}
        zapomniHtml={found.zapomniHtml}
        listHref={listHref}
        dalee={{
          teoriyaHref: `${base}/teoriya/#teoriya-${found.teoriyaRazdel}`,
          sled:
            sled === undefined
              ? null
              : { href: `${listHref}${sled.slug}/`, nazvanie: sled.nazvanie },
          trenazher:
            razdel === undefined || tipy.length === 0
              ? null
              : {
                  href: `${base}/trenazher/?tipy=${tipy.map((st) => st.id).join(',')}`,
                  razdel: razdel.nazvanie,
                },
        }}
      />
    </Opornye11Shell>
  );
}
