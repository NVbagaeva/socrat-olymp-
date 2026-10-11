import type { Metadata } from 'next';
import { Blok7 } from '@/components/tasks/zadanie7/Teoriya7';
import { PechatKnopka7 } from '@/components/tasks/zadanie7/PechatKnopka7';
import { Tex } from '@/components/ui/Tex';
import {
  RAZDELY_TEORII_7,
  SHPARGALKA_7,
  type BlokTeorii7,
  type Kartochka7,
} from '@/content/teoriya7';
import { zadanie7Title } from '@/content/zadanie7';
import 'katex/dist/katex.min.css';
import '@/components/tasks/zadanie7/razbor7.css';
import '../zadanie7.css';
import './shpargalka7.css';

export const metadata: Metadata = {
  title: zadanie7Title('Шпаргалка'),
  robots: { index: false, follow: false },
};

/** В шпаргалку идут «короткие» рамки: формулы и таблицы; карточки — сжато. */
const KRATKIE: ReadonlySet<BlokTeorii7['vid']> = new Set(['formula', 'tablica']);

/**
 * Карточка в шпаргалке — одна строка: название и формулы блоков
 * «Теорема» / «Свойство» (без «Важно» и примеров), иначе первая фраза.
 */
function KratkayaKartochka({ k }: { k: Kartochka7 }) {
  const formuly = k.bloki.filter((b) => b.vid !== 'vazhno' && b.formula).map((b) => b.formula);
  const tekst = k.bloki.find((b) => b.vid !== 'vazhno')?.tekst[0] ?? '';
  return (
    <li className="z7-shp__k">
      <b>
        <Tex text={k.title} />.
      </b>{' '}
      {formuly.length > 0 ? (
        formuly.map((f) => <Tex className="z7-shp__f" text={`$${f}$`} key={f} />)
      ) : (
        <Tex text={tekst} />
      )}
    </li>
  );
}

/**
 * «Шпаргалка по №7»: лист A4 на две страницы из тех же рамок и
 * карточек теории — алгоритм, свойства степеней и логарифмов, корни,
 * решения тригонометрических уравнений и таблица значений. Колонки
 * — только на печати и на широком экране.
 */
export default function Shpargalka7() {
  const razdely = RAZDELY_TEORII_7.filter((r) =>
    (SHPARGALKA_7.razdely as readonly string[]).includes(r.id),
  );
  return (
    <main className="z7-shp">
      <header className="z7-shp__head">
        <p className="z7-shp__eyebrow">Задание №7 · {SHPARGALKA_7.podzagolovok}</p>
        <h1>{SHPARGALKA_7.title}</h1>
        <PechatKnopka7 />
      </header>
      <section className="z7-shp__algoritm">
        <h2>Любое уравнение — за шесть шагов</h2>
        <ol>
          {SHPARGALKA_7.algoritm.map((s) => (
            <li key={s}>
              <Tex text={s} />
            </li>
          ))}
        </ol>
      </section>
      <div className="z7-shp__kolonki">
        {razdely.map((r) => (
          <section key={r.id} className="z7-shp__razdel">
            <h2>{r.title}</h2>
            {r.bloki
              .filter((b) => KRATKIE.has(b.vid))
              .map((b, i) => (
                <Blok7 b={b} bezPrimerov key={`${r.id}-${i}`} />
              ))}
            <ul className="z7-shp__kartochki">
              {r.bloki
                .flatMap((b) => (b.vid === 'kartochki' ? b.kartochki : []))
                .map((k) => (
                  <KratkayaKartochka k={k} key={k.id} />
                ))}
            </ul>
          </section>
        ))}
      </div>
    </main>
  );
}
