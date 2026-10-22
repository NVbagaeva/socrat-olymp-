import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Illyustraciya10 } from '@/components/tasks/zadanie10/Illyustraciya10';
import { Most10 } from '@/components/tasks/zadanie10/Most10';
import { Razbor10 } from '@/components/tasks/zadanie10/Razbor10';
import { Tex } from '@/components/ui/Tex';
import { YAKOR_TEORII_10 } from '@/content/teoriya10';
import { ZADANIE10, zadanie10Title } from '@/content/zadanie10';
import { zadachiPrototipa } from '@/lib/zadanie10/bank/index';
import { kodNaSayte, PROTOTYPES, prototype } from '@/lib/zadanie10/prototypes';
import { ZADANIYA } from '@/lib/paths';

export function generateStaticParams() {
  return PROTOTYPES.map((p) => ({ prototip: p.id }));
}

export const dynamicParams = false;

export const metadata: Metadata = {
  title: zadanie10Title('Разобранный пример'),
};

/**
 * Разобранный пример прототипа — на него ведут карточки «О задании».
 * Задача — первая задача ФИПИ прототипа (у прототипов из курса — первый
 * аналог), разбор и подсказки — решателем банка.
 */
export default async function Razbor10Page({ params }: { params: Promise<{ prototip: string }> }) {
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
  const base = `${ZADANIYA}/${ZADANIE10.slug}`;
  const teoriya = YAKOR_TEORII_10(p.id);
  return (
    <article className="z10-razbor-str">
      <p className="z10-razbor-str__nazad">
        <Link href={`${base}/`}>← О задании</Link>
      </p>
      <h2 className="t-h2">
        {kodNaSayte(p.id)}. {p.title}
      </h2>
      <Illyustraciya10 id={p.id} className="z10-razbor-str__ill" />
      <section className="z10-uslovie">
        <p className="z10-uslovie__metka">
          {z.source === 'fipi' ? `Задача открытого банка ФИПИ` : 'Не из открытого банка'}
        </p>
        <p className="z10-uslovie__text">
          <Tex text={z.text} />
        </p>
        {p.id === 'P01' ? <Most10 params={z.params} rezhim="uchenik" /> : null}
      </section>
      <h3 className="t-h3">Разбор</h3>
      <Razbor10 s={s} podskazki />
      <nav className="z10-razbor-str__dalshe">
        <Link className="btn btn--primary" href={`${base}/trenazher/?tipy=${p.id}`}>
          Решать такие задачи
        </Link>
        {teoriya ? (
          <Link className="btn btn--secondary" href={`${base}/teoriya/#${teoriya}`}>
            Теория
          </Link>
        ) : null}
      </nav>
    </article>
  );
}
