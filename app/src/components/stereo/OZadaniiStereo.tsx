import Link from 'next/link';
import { GLAVY_15, GLAVY_3 } from '@/content/stereo/glavy';
import { O_ZADANII_STEREO, TIPY_15, TIPY_3 } from '@/content/stereo/tipy';
import { STEREO, type StereoNo } from '@/content/stereo/zadaniya';
import { ZADANIYA } from '@/lib/paths';
import { plural } from '@/lib/plural';

/**
 * Вкладка «О задании» стереометрии на этапе каркаса: что проверяет
 * задание и карточки типов задач открытого банка. Карточка ведёт в
 * главу теории; разбор с интерактивным чертежом — этап 2 плана.
 */
export function OZadaniiStereo({ no, vkladka }: { no: StereoNo; vkladka: string }) {
  const t = O_ZADANII_STEREO;
  const tipy = no === '3' ? TIPY_3 : TIPY_15;
  const glavy = no === '3' ? GLAVY_3 : GLAVY_15;
  const base = `${ZADANIYA}/${STEREO[no].slug}`;
  return (
    <>
      <h2 className="t-h2 vtab__title">{vkladka}</h2>
      <section className="stereo-about">
        <h3 className="t-h3">{t[no].zagolovok}</h3>
        {t[no].text.map((para) => (
          <p className="stereo-about__p" key={para}>
            {para}
          </p>
        ))}
      </section>

      <section className="stereo-tipy" aria-labelledby={`stereo-tipy-${no}`}>
        <h3 className="t-h3" id={`stereo-tipy-${no}`}>
          {t.tipy}
        </h3>
        <p className="stereo-tipy__lead">{t.tipyLead}</p>
        <ul className="stereo-tipy__grid">
          {tipy.map((tip) => {
            const glava = glavy.find((item) => item.id === tip.glava);
            const n = tip.prototipy?.length;
            return (
              <li key={tip.id}>
                <Link className="stereo-tip" href={`${base}/teoriya/#teoriya-${tip.glava}`}>
                  <span className="stereo-tip__title">{tip.title}</span>
                  <span className="stereo-tip__meta">
                    {n === undefined ? null : (
                      <span>
                        {n} {plural(n, ...t.prototipov)}
                      </span>
                    )}
                    {glava === undefined ? null : (
                      <span>
                        {t.kGlave} {glava.nomer}
                      </span>
                    )}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>
    </>
  );
}
