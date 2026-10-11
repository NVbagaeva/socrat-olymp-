import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Opornye10 } from '@/components/tasks/zadanie10/Opornye10';
import { ZADANIE10, zadanie10Title } from '@/content/zadanie10';
import { kartinkiPrototipov } from '@/lib/zadanie10/illyustracii';
import { BLOKI_OPORNYH, blokPoSlugu, opornyeDlyaBrauzera } from '@/lib/zadanie10/opornye';
import { kodNaSayte, prototype } from '@/lib/zadanie10/prototypes';
import { ZADANIYA } from '@/lib/paths';

export function generateStaticParams() {
  return BLOKI_OPORNYH.map((b) => ({ blok: b.slug }));
}

export const dynamicParams = false;

export const metadata: Metadata = {
  title: zadanie10Title('Опорные задачи'),
};

export default async function Opornye10Blok({ params }: { params: Promise<{ blok: string }> }) {
  const { blok } = await params;
  const b = blokPoSlugu(blok);
  if (b === undefined) {
    notFound();
  }
  const base = `${ZADANIYA}/${ZADANIE10.slug}`;
  const kartinki = kartinkiPrototipov();
  const zadachi = opornyeDlyaBrauzera(b);
  const nuzhnye = new Set([
    ...b.prototipy,
    ...zadachi.flatMap((z) => (z.syuzhet ? [z.syuzhet] : [])),
  ]);
  const syuzhety: Record<string, { title: string; href: string }> = {};
  for (const id of nuzhnye) {
    syuzhety[id] = {
      title: `${kodNaSayte(id)}. ${prototype(id).title}`,
      href: `${base}/razbor/${id}/`,
    };
  }
  return (
    <div>
      <p className="z10-razbor-str__nazad">
        <Link href={`${base}/opornye-zadachi/`}>← Все блоки</Link>
      </p>
      <h2 className="t-h3">
        {b.no}. {b.nazvanie}
      </h2>
      <Opornye10 zapomni={b.zapomni} zadachi={zadachi} kartinki={kartinki} syuzhety={syuzhety} />
      <section className="z10-op__gde" aria-labelledby="z10-op-gde">
        <h3 id="z10-op-gde" className="t-h4">
          Где пригодится этот навык
        </h3>
        <ul className="z10-op__gde-spisok">
          {b.prototipy.map((id) => {
            const k = kartinki[id];
            const s = syuzhety[id];
            return s ? (
              <li key={id}>
                <Link href={s.href} className="z10-op__gde-karta">
                  {k ? (
                    <picture className="z10-ill">
                      <source type="image/webp" srcSet={k.webp} />
                      <img
                        src={k.png}
                        alt=""
                        width={k.width}
                        height={k.height}
                        loading="lazy"
                        decoding="async"
                      />
                    </picture>
                  ) : null}
                  <span>{s.title}</span>
                </Link>
              </li>
            ) : null;
          })}
        </ul>
      </section>
    </div>
  );
}
