import type { Metadata } from 'next';
import { chertezhSvg, tekstyPodpisey } from '@/lib/chertezh3';
import { katex } from '@/lib/graph/katex';
import { RAZDELY } from '@/lib/zadanie3';
import { chertezhVarianta, estScenariy, spisokNaProverku } from '@/lib/zadanie3/chertezhi';
import { typeset } from '@/lib/tex';
import { Demo3 } from './Demo3';
import 'katex/dist/katex.min.css';
import './chertezhi-3.css';

export const metadata: Metadata = {
  title: 'Чертежи №3 — предпросмотр',
  robots: { index: false, follow: false },
};

/**
 * Служебная страница: все чертежи задания №3 на многогранники сеткой.
 * Только для разработки (page.dev.tsx): в обычной сборке маршрута нет.
 *
 * Сверху — список «на проверку» (неоднозначные чертежи с пояснением)
 * и несколько интерактивных чертежей для ручной проверки вращения и
 * подсветки. Ниже — каждый вариант: лист ученика и лист учителя.
 * Чертёж, не прошедший валидатор, обведён красным, ошибки под ним.
 */
export default function Chertezhi3Page() {
  const spisok = spisokNaProverku();
  const razdely = RAZDELY.filter((r) => r.prototipy.some(estScenariy));
  const demo = ['P03-01', 'P03-05', 'P03-35', 'P03-41', 'P03-12'].flatMap((id) => {
    const p = razdely.flatMap((r) => r.prototipy).find((x) => x.id === id);
    const v = p?.varianty[0];
    const ch = p && v ? chertezhVarianta(p, v) : null;
    if (!p || !v || !ch) return [];
    return [
      {
        id,
        uslovieHtml: typeset(p.uslovie(v.params)),
        shagi: p.shagi(v.params).map((s) => typeset(s.text)),
        refs: ch.shagi,
        scenariy: ch.scenariy,
        podpisiHtml: Object.fromEntries(
          tekstyPodpisey(ch.scenariy).map((t) => [t, katex.renderToString(t)]),
        ),
      },
    ];
  });
  return (
    <main className="ch3p">
      <h1 className="ch3p__title">Чертежи задания №3 · многогранники</h1>
      <p className="ch3p__lead">
        Служебная страница. Сценарии собраны по тексту условий (lib/zadanie3/chertezhi), проверены
        валидатором (lib/chertezh3/validator). Красная рамка — сценарий с ошибкой.
      </p>

      <section className="ch3p__review">
        <h2>На проверку: {spisok.length}</h2>
        <ul>
          {spisok.map((x) => (
            <li key={x.id}>
              <a href={`#${x.id}`}>
                <b>{x.id}</b>
              </a>{' '}
              <span dangerouslySetInnerHTML={{ __html: typeset(x.nazvanie) }} />
              <ul>
                {x.prichiny.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2>Интерактив</h2>
        <Demo3 zadachi={demo} />
      </section>

      {razdely.map((r) => (
        <section key={r.nomer}>
          <h2>
            Раздел {r.nomer}. {r.nazvanie}
          </h2>
          {r.prototipy.filter(estScenariy).map((p) => (
            <div key={p.id} id={p.id} className="ch3p__proto">
              <h3>
                {p.id} <span dangerouslySetInnerHTML={{ __html: typeset(p.nazvanie) }} />
              </h3>
              <div className="ch3p__grid">
                {p.varianty.map((v) => {
                  const ch = chertezhVarianta(p, v);
                  if (ch === null) return null;
                  return (
                    <figure
                      key={v.n}
                      className={ch.oshibki.length > 0 ? 'ch3p__cell is-bad' : 'ch3p__cell'}
                    >
                      <div className="ch3p__pair">
                        <span
                          dangerouslySetInnerHTML={{
                            __html: chertezhSvg(ch.scenariy, {
                              rezhim: 'uchenik',
                              shirina: 200,
                              kegl: 12,
                            }),
                          }}
                        />
                        <span
                          dangerouslySetInnerHTML={{
                            __html: chertezhSvg(ch.scenariy, {
                              rezhim: 'uchitel',
                              shirina: 200,
                              kegl: 12,
                            }),
                          }}
                        />
                      </div>
                      <figcaption>
                        №{v.n}
                        {ch.somneniya.length > 0 ? ' · ' + ch.somneniya.join('; ') : ''}
                        {ch.oshibki.map((e) => (
                          <span key={e} className="ch3p__err">
                            {e}
                          </span>
                        ))}
                      </figcaption>
                    </figure>
                  );
                })}
              </div>
            </div>
          ))}
        </section>
      ))}
    </main>
  );
}
