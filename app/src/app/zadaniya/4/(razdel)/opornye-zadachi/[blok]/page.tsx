import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { TabScrollOnMount } from '@/components/tasks/TabScroll';
import { Opornye45Blok } from '@/components/tasks/veroyatnost/opornye/Opornye45Blok';
import { navykKind } from '@/components/tasks/veroyatnost/metody';
import { OPORNYE } from '@/content/opornye';
import { veroyatnostTitle } from '@/content/veroyatnost';
import { OPORNYE4_LEAD } from '@/content/veroyatnost4';
import { tekstyOpornyh45 } from '@/content/veroyatnost45';
import { assetUrl } from '@/lib/assetUrl';
import { typesetText } from '@/lib/tex';
import { bank4Pool, prep4Pool } from '@/lib/veroyatnost/pool';
import { opornyeHref45, tipHref45 } from '@/lib/veroyatnost/trening/links';
import '@/components/tasks/veroyatnost/opornye/opornye45.css';

/* Статический экспорт: адреса блоков известны до сборки. */
export function generateStaticParams() {
  return prep4Pool().map((blok) => ({ blok: blok.id }));
}
export const dynamicParams = false;

type Params = Promise<{ blok: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { blok } = await params;
  const found = prep4Pool().find((item) => item.id === blok);
  return {
    title: veroyatnostTitle('4', found === undefined ? OPORNYE.title : found.nazvanie),
  };
}

const T = tekstyOpornyh45(OPORNYE4_LEAD);

/**
 * Блок опорных задач №4 на общем экране блока: «Запомни» с картинкой
 * блока (как есть) и задачей, которая на ней нарисована, задачи одна за
 * другой, точки-номера; ниже — типы банка с тем же методом.
 */
export default async function Opornye4BlokPage({ params }: { params: Params }) {
  const { blok } = await params;
  const found = prep4Pool().find((item) => item.id === blok);
  if (found === undefined) {
    notFound();
  }
  const tipy =
    found.metod === undefined ? [] : bank4Pool().kinds.filter((k) => navykKind(k) === found.metod);
  return (
    <section className="prep z45-opornye" aria-labelledby="z4-opornye-blok-title">
      <Link className="z45-op__nazad" href={opornyeHref45(4)} scroll={false}>
        {T.kListu}
      </Link>
      <h2 className="stk-h3" id="z4-opornye-blok-title">
        {found.nazvanie}
      </h2>
      <TabScrollOnMount />
      <Opornye45Blok
        zadanie={4}
        zadachi={found.zadachi}
        zapomni={
          <div
            className={
              found.kartinka === undefined
                ? 'z45-op__zapomni'
                : 'z45-op__zapomni z45-op__zapomni--s-kartinkoy'
            }
          >
            <p>
              <b>{T.zapomni}</b> {found.tip}
            </p>
            {found.kartinka === undefined ? null : (
              <>
                {/* Картинка блока — как есть, целиком. */}
                <img
                  className="z45-op__kartinka"
                  src={assetUrl(found.kartinka.src)}
                  alt={found.kartinka.alt}
                  decoding="async"
                />
                <p
                  className="z45-op__primer"
                  dangerouslySetInnerHTML={{ __html: found.kartinka.primer }}
                />
              </>
            )}
          </div>
        }
      />
      {tipy.length === 0 ? null : (
        <section className="z45-op__gde" aria-labelledby="z4-op-gde">
          <h3 id="z4-op-gde" className="stk-h4">
            {T.gde}
          </h3>
          <ul className="z45-op__gde-spisok">
            {tipy.map((k) => (
              <li key={k.id}>
                <Link
                  href={tipHref45(4, k.id)}
                  className="z45-op__chip"
                  dangerouslySetInnerHTML={{ __html: typesetText(k.title) }}
                />
              </li>
            ))}
          </ul>
        </section>
      )}
    </section>
  );
}
