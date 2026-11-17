import type { Metadata } from 'next';
import Link from 'next/link';
import { FiltrSpiska, MetkaIshoda, OtkrytZadachu } from '@/components/sbornik/SpisokKlient';
import { SchyotTipa } from '@/components/sbornik/Progress';
import { UslovieZadachi } from '@/components/sbornik/ZadachaSbornika';
import { TIPY, UROVNI, sbornikTitle } from '@/content/sbornik';
import { href, SBORNIK, SBORNIK_TAIL } from '@/lib/paths';
import { formulaHtml, formulaUsloviyaHtml, nomerZadachi, zadachiTipa } from '@/lib/sbornik/bank';
import { nomerGlavy, staticTipy, tipPoSlug } from '@/lib/sbornik/marshrut';
import { typeset } from '@/lib/tex';

export const dynamicParams = false;

export function generateStaticParams(): { glava: string; tip: string }[] {
  return staticTipy();
}

type Params = Promise<{ glava: string; tip: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { glava, tip } = await params;
  const n = nomerGlavy(glava);
  const t = TIPY[n]!.find((item) => item.id === tipPoSlug(n, tip))!;
  return { title: sbornikTitle(`${t.id}. ${t.nazvanie}`, `Глава ${n}`) };
}

const ZVEZDY = ['', '★', '★★', '★★★'];

/**
 * Задачи одного типа: условия списком (набраны на сборке), под каждым —
 * «Решать». Фильтр по уровню и по исходу.
 */
export default async function TipZadach({ params }: { params: Params }) {
  const { glava: slug, tip: tipS } = await params;
  const n = nomerGlavy(slug);
  const tip = tipPoSlug(n, tipS);
  const t = TIPY[n]!.find((item) => item.id === tip)!;
  const zadachi = zadachiTipa(tip);
  const poUrovnyam = UROVNI.map((u) => zadachi.filter((z) => z.uroven === u.id).length);
  const spisokId = `sb-spisok-${tip.replace('.', '-')}`;
  return (
    <div className="sb-tip-stranica">
      <nav className="sb-nazad">
        <Link href={href(SBORNIK, slug)}>← Все типы главы {n}</Link>
      </nav>
      <header className="sb-tip-shapka stk-glass">
        <span className="sb-tip__znak" dangerouslySetInnerHTML={{ __html: formulaHtml(t.znak) }} />
        <div>
          <h2 className="sb-tip-shapka__zag">
            {t.id}. {t.nazvanie}
          </h2>
          <p className="sb-tip-shapka__opisanie" dangerouslySetInnerHTML={{ __html: typeset(t.opisanie) }} />
          <SchyotTipa tip={tip} iz={zadachi.length} />
          <p className="sb-tip-shapka__ssylki">
            <Link href={href(SBORNIK, slug, SBORNIK_TAIL.trenazher, `?tip=${tip}`)}>
              Тренироваться на этом типе
            </Link>
            {' · '}
            <Link href={href(SBORNIK, slug, SBORNIK_TAIL.teoriya)}>Теория главы</Link>
          </p>
        </div>
      </header>

      <FiltrSpiska spisokId={spisokId} poUrovnyam={poUrovnyam} />

      <ol className="sb-spisok" id={spisokId} data-uroven="0" data-ishod="vse">
        {zadachi.map((z) => {
          const nomer = nomerZadachi(z.id);
          return (
            <li key={z.id} className="sb-punkt stk-glass" data-zadacha={z.id} data-uroven={z.uroven} id={`z-${z.id.replace(/\./g, '-')}`}>
              <header className="sb-zadacha__shapka">
                <span className="sb-zadacha__nomer">{nomer}</span>
                <span className="sb-zadacha__uroven" aria-label={`Уровень ${z.uroven} из 3`}>
                  {ZVEZDY[z.uroven]}
                </span>
                <MetkaIshoda id={z.id} />
              </header>
              <UslovieZadachi
                z={{
                  uslovieHtml: typeset(z.uslovie),
                  ...(z.formula === undefined ? {} : { formulaHtml: formulaUsloviyaHtml(z.formula) }),
                  ...(z.dopolnenie === undefined ? {} : { dopolnenieHtml: typeset(z.dopolnenie) }),
                }}
              />
              <OtkrytZadachu id={z.id} nomer={nomer} />
            </li>
          );
        })}
      </ol>
      {zadachi.length === 0 ? <p className="sb-vvodnaya">Задачи этого типа готовятся.</p> : null}
    </div>
  );
}
