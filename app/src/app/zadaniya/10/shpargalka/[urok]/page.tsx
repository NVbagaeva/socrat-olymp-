import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Blok10 } from '@/components/tasks/zadanie10/Teoriya10';
import { PechatKnopka10 } from '@/components/tasks/zadanie10/PechatKnopka10';
import { Tex } from '@/components/ui/Tex';
import { bezSsylok, RAZDELY_TEORII_10, type BlokTeorii10 } from '@/content/teoriya10';
import { UROKI_10 } from '@/content/uroki10';
import { zadanie10Title } from '@/content/zadanie10';
import { kodNaSayte, prototype } from '@/lib/zadanie10/prototypes';
import 'katex/dist/katex.min.css';
import '@/components/tasks/zadanie10/razbor10.css';
import '../../zadanie10.css';
import './shpargalka.css';

export function generateStaticParams() {
  return UROKI_10.map((u) => ({ urok: String(u.no) }));
}

export const dynamicParams = false;

export const metadata: Metadata = {
  title: zadanie10Title('Шпаргалка к уроку'),
  robots: { index: false, follow: false },
};

/** В шпаргалку идут «короткие» рамки: формулы, таблицы, «Важно!», «Вывод». */
const KRATKIE: ReadonlySet<BlokTeorii10['vid']> = new Set([
  'formula',
  'tablica',
  'vazhno',
  'vyvod',
  'lovushka',
]);

/**
 * «Шпаргалка к уроку N»: печатный лист из тех же рамок теории — по
 * разделам, где встречаются прототипы урока, плюс формулы сюжетов.
 * Урок 9 (итоговый) — все разделы.
 */
export default async function Shpargalka10({ params }: { params: Promise<{ urok: string }> }) {
  const { urok } = await params;
  const u = UROKI_10.find((x) => String(x.no) === urok);
  if (u === undefined) {
    notFound();
  }
  const razdely = RAZDELY_TEORII_10.filter(
    (r) =>
      r.id === 'algoritm' ||
      r.id === 'lovushki' ||
      u.prototipy.length === 0 ||
      r.prototipy.some((p) => u.prototipy.includes(p)),
  );
  return (
    <main className="z10-shp">
      <header className="z10-shp__head">
        <p className="z10-shp__eyebrow">Задание №10 · Шпаргалка к уроку {u.no}</p>
        <h1>{u.title}</h1>
        <PechatKnopka10 />
      </header>
      {u.prototipy.length > 0 ? (
        <section className="z10-shp__formuly">
          <h2>Формулы урока</h2>
          <ul>
            {u.prototipy.map((id) => (
              <li key={id}>
                <b>
                  {kodNaSayte(id)} {prototype(id).title}:
                </b>{' '}
                <Tex text={`$${prototype(id).formula}$`} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      {razdely.map((r) => (
        <section key={r.id} className="z10-shp__razdel">
          <h2>{r.title}</h2>
          {r.bloki
            .filter((b) => KRATKIE.has(b.vid) || (r.id === 'algoritm' && b.vid === 'opredelenie'))
            .map((b, i) => (
              <Blok10 b={bezSsylok(b)} key={`${r.id}-${i}`} />
            ))}
        </section>
      ))}
    </main>
  );
}
