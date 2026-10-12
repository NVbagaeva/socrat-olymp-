import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Razbor7 } from '@/components/tasks/zadanie7/Razbor7';
import { Tex } from '@/components/ui/Tex';
import { TEORIYA_7_DLYA_PROTOTIPA } from '@/content/teoriya7';
import { ZADANIE7, zadanie7Title } from '@/content/zadanie7';
import { zadachiPrototipa } from '@/lib/zadanie7/bank/index';
import { kodNaSayte, PROTOTYPES, prototype } from '@/lib/zadanie7/prototypes';
import { ZADANIYA } from '@/lib/paths';

export function generateStaticParams() {
  return PROTOTYPES.map((p) => ({ prototip: p.id }));
}

export const dynamicParams = false;

export const metadata: Metadata = {
  title: zadanie7Title('Разобранный пример'),
};

/**
 * Разобранный пример прототипа — на него ведут карточки «О задании».
 * Задача — первая задача ФИПИ прототипа (если ФИПИ нет — первый
 * аналог), разбор и подсказки — решателем банка.
 */
export default async function Razbor7Page({ params }: { params: Promise<{ prototip: string }> }) {
  const { prototip } = await params;
  const p = PROTOTYPES.find((x) => x.id === prototip);
  if (p === undefined) {
    notFound();
  }
  const { fipi, analogi } = zadachiPrototipa(p.id);
  const z = fipi[0] ?? analogi[0];
  if (z === undefined) {
    notFound();
  }
  const s = prototype(p.id).solve(z.params);
  const base = `${ZADANIYA}/${ZADANIE7.slug}`;
  const teoriya = TEORIYA_7_DLYA_PROTOTIPA(p.id);
  return (
    <article className="z7-razbor-str">
      <p className="z7-razbor-str__nazad">
        <Link href={`${base}/`}>← О задании</Link>
      </p>
      <h2 className="t-h2">
        {kodNaSayte(p.id)}. <Tex text={p.title} />
      </h2>
      <section className="z7-uslovie">
        <p className="z7-uslovie__metka">
          {z.source === 'fipi' ? 'Задача открытого банка ФИПИ' : 'Не из открытого банка'}
        </p>
        <p className="z7-uslovie__text">
          <Tex text={z.text} />
        </p>
      </section>
      <h3 className="t-h3">Разбор</h3>
      <Razbor7 s={s} podskazki />
      <nav className="z7-razbor-str__dalshe">
        <Link className="btn btn--primary" href={`${base}/trenazher/?tipy=${p.id}`}>
          Решать такие задачи
        </Link>
        {teoriya ? (
          <Link className="btn btn--secondary" href={`${base}/teoriya/#k-${teoriya.kartochka}`}>
            Теория
          </Link>
        ) : null}
      </nav>
    </article>
  );
}
