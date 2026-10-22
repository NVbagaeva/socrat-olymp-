import type { Metadata } from 'next';
import { PechatKnopka6 } from '@/components/tasks/zadanie6/PechatKnopka6';
import { Tex } from '@/components/ui/Tex';
import {
  RAZDELY_TEORII_6,
  SHPARGALKA_6,
  kartochkiBloka6,
  type Kartochka6,
} from '@/content/teoriya6';
import { zadanie6Title } from '@/content/zadanie6';
import 'katex/dist/katex.min.css';
import '../zadanie6.css';
import './shpargalka6.css';

export const metadata: Metadata = {
  title: zadanie6Title('Шпаргалка'),
  robots: { index: false, follow: false },
};

/** Карточка в шпаргалке — одна строка: название и формулы блоков (без примеров и «Важно»). */
function KratkayaKartochka({ k }: { k: Kartochka6 }) {
  const formuly = k.bloki
    .filter((b) => b.vid !== 'vazhno' && b.formula)
    .map((b) => b.formula as string);
  const tekst = k.bloki.find((b) => b.vid !== 'vazhno')?.tekst[0] ?? '';
  return (
    <li className="z6-shp__k">
      <b>
        <Tex text={k.title} />.
      </b>{' '}
      {formuly.length > 0 ? (
        formuly.map((f) => <Tex className="z6-shp__f" text={`$${f}$`} key={f} />)
      ) : (
        <Tex text={tekst} />
      )}
    </li>
  );
}

/**
 * «Шпаргалка по №6»: лист A4 из тех же карточек теории — главное
 * одним списком, формулы по разделам и ловушки. На печати и широком
 * экране — две колонки.
 */
export default function Shpargalka6() {
  const razdely = RAZDELY_TEORII_6.filter((r) =>
    (SHPARGALKA_6.razdely as readonly string[]).includes(r.id),
  );
  const lovushki = RAZDELY_TEORII_6.find((r) => r.id === 'lovushki')?.bloki ?? [];
  return (
    <main className="z6-shp">
      <header className="z6-shp__head">
        <p className="z6-shp__eyebrow">Задание №6 · {SHPARGALKA_6.podzagolovok}</p>
        <h1>{SHPARGALKA_6.title}</h1>
        <PechatKnopka6 />
      </header>
      <section className="z6-shp__glavnoe">
        <h2>Главное</h2>
        <ul>
          {SHPARGALKA_6.glavnoe.map((s) => (
            <li key={s}>
              <Tex text={s} />
            </li>
          ))}
        </ul>
      </section>
      <div className="z6-shp__kolonki">
        {razdely.map((r) => (
          <section key={r.id} className="z6-shp__razdel">
            <h2>{r.title}</h2>
            <ul className="z6-shp__kartochki">
              {r.bloki.flatMap(kartochkiBloka6).map((k) => (
                <KratkayaKartochka k={k} key={k.id} />
              ))}
            </ul>
          </section>
        ))}
        <section className="z6-shp__razdel">
          <h2>Ловушки</h2>
          <ul className="z6-shp__lovushki">
            {lovushki.map((b) =>
              b.vid === 'lovushka' ? (
                <li key={b.title}>
                  <b>
                    <Tex text={b.title} />.
                  </b>{' '}
                  <Tex text={b.pravilno} />
                </li>
              ) : null,
            )}
          </ul>
        </section>
      </div>
    </main>
  );
}
