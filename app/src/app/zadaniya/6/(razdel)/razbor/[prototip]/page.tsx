import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Razbor6 } from '@/components/tasks/zadanie6/Razbor6';
import { Uslovie6 } from '@/components/tasks/zadanie6/Uslovie6';
import { Tex } from '@/components/ui/Tex';
import { TEORIYA_6_DLYA_PROTOTIPA } from '@/content/teoriya6';
import { ZADANIE6, zadanie6Title } from '@/content/zadanie6';
import { podpisIstochnika, zadachiPrototipa } from '@/lib/zadanie6/bank/index';
import { kodNaSayte, PROTOTYPES, prototype } from '@/lib/zadanie6/prototypes';
import { ZADANIYA } from '@/lib/paths';

export function generateStaticParams() {
  return PROTOTYPES.map((p) => ({ prototip: p.id }));
}

export const dynamicParams = false;

export const metadata: Metadata = {
  title: zadanie6Title('Разобранный пример'),
};

/**
 * Разобранный пример прототипа — на него ведут карточки «О задании».
 * Задача — первая исходная задача прототипа, разбор и подсказки —
 * решателем банка.
 */
export default async function Razbor6Page({ params }: { params: Promise<{ prototip: string }> }) {
  const { prototip } = await params;
  const p = PROTOTYPES.find((x) => x.id === prototip);
  if (p === undefined) {
    notFound();
  }
  const { istochniki, analogi } = zadachiPrototipa(p.id);
  const z = istochniki[0] ?? analogi[0];
  if (z === undefined) {
    notFound();
  }
  const proto = prototype(p.id);
  const s = proto.solve(z.params);
  const ris = proto.ris(z.params);
  const base = `${ZADANIYA}/${ZADANIE6.slug}`;
  const teoriya = TEORIYA_6_DLYA_PROTOTIPA(p.id);
  return (
    <article className="z6-razbor-str">
      <p className="z6-razbor-str__nazad">
        <Link href={`${base}/`}>← О задании</Link>
      </p>
      <h2 className="t-h2">
        {kodNaSayte(p.id)}. <Tex text={p.title} />
      </h2>
      <section className="z6-zadacha">
        <p className="z6-zadacha__metka">
          {z.gde ? `${z.gde} · ` : ''}
          {podpisIstochnika(z)}
        </p>
        <Uslovie6
          u={{ text: z.text, ...(ris ? { ris } : {}), ...(z.posle ? { posle: z.posle } : {}) }}
        />
      </section>
      <h3 className="t-h3">Разбор</h3>
      <Razbor6 s={s} podskazki />
      <nav className="z6-razbor-str__dalshe">
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
