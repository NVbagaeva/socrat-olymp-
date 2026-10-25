import fs from 'node:fs';
import path from 'node:path';
import Link from 'next/link';
import { Tex } from '@/components/ui/Tex';
import { GLAVY_15, GLAVY_3 } from '@/content/stereo/glavy';
import { O_ZADANII_15, O_ZADANII_STEREO, TIPY_15, TIPY_3 } from '@/content/stereo/tipy';
import { STEREO, type StereoNo } from '@/content/stereo/zadaniya';
import { assetUrl } from '@/lib/assetUrl';
import { ZADANIYA } from '@/lib/paths';
import { plural } from '@/lib/plural';
import { RAZBORY_3 } from '@/lib/stereo/razbory3';
import { RAZBORY_15 } from '@/lib/stereo/razbory15';

/** Разборы по заданиям: тип → есть ли у него страница разбора. */
const RAZBORY: Record<StereoNo, readonly { tip: string }[]> = { '3': RAZBORY_3, '15': RAZBORY_15 };

/**
 * Картинка «Что нужно уметь» — PNG автора (docs/stereometry-images.md).
 * Пока файла нет, блок держится на одном списке: пустой рамки на месте
 * картинки ученик не видит.
 */
function KartinkaUmet({ no }: { no: StereoNo }) {
  const rel = `/images/zadaniya/${no}/umet.png`;
  if (!fs.existsSync(path.join(process.cwd(), 'public', rel))) {
    return null;
  }
  return <img className="stereo-umet__img" src={assetUrl(rel)} alt="" width={1200} height={800} />;
}

/** №15: пункты а и б, критерии оценивания, типичные ошибки оформления. */
function Ustroystvo15() {
  const t = O_ZADANII_15;
  return (
    <>
      <section className="stereo-about" aria-labelledby="stereo-struktura">
        <h3 className="t-h3" id="stereo-struktura">
          {t.struktura.title}
        </h3>
        <div className="stereo-punkty">
          {[t.struktura.a, t.struktura.b].map((p) => (
            <div className="stereo-punkt" key={p.title}>
              <h4 className="stereo-punkt__title">{p.title}</h4>
              <p className="stereo-about__p">{p.text}</p>
            </div>
          ))}
        </div>
      </section>
      <section className="stereo-about" aria-labelledby="stereo-kriterii">
        <h3 className="t-h3" id="stereo-kriterii">
          {t.kriterii.title}
        </h3>
        <p className="stereo-about__p">{t.kriterii.lead}</p>
        <ul className="stereo-kriterii">
          {t.kriterii.stroki.map((k) => (
            <li className="stereo-kriterii__row" key={k.ball}>
              <span className="stereo-kriterii__ball">{k.ball}</span>
              <span>{k.text}</span>
            </li>
          ))}
        </ul>
      </section>
      <section className="stereo-about" aria-labelledby="stereo-oshibki">
        <h3 className="t-h3" id="stereo-oshibki">
          {t.oshibki.title}
        </h3>
        <ul className="stereo-oshibki">
          {t.oshibki.spisok.map((o) => (
            <li className="stereo-oshibka" key={o.oshibka}>
              <p className="stereo-oshibka__chto">
                <Tex text={o.oshibka} />
              </p>
              <p className="stereo-oshibka__kak">
                <Tex text={o.kak} />
              </p>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}

/**
 * Вкладка «О задании» стереометрии: что проверяет задание, что нужно
 * уметь и карточки типов задач открытого банка. Карточка открывает
 * разобранную задачу с живым чертежом (razbor/<тип>/); у типа без
 * разбора — главу теории.
 */
export function OZadaniiStereo({ no, vkladka }: { no: StereoNo; vkladka: string }) {
  const t = O_ZADANII_STEREO;
  const tipy = no === '3' ? TIPY_3 : TIPY_15;
  const glavy = no === '3' ? GLAVY_3 : GLAVY_15;
  const base = `${ZADANIYA}/${STEREO[no].slug}`;
  const sRazborom = new Set(RAZBORY[no].map((r) => r.tip));
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

      {no === '15' ? <Ustroystvo15 /> : null}

      <section className="stereo-umet" aria-labelledby={`stereo-umet-${no}`}>
        <h3 className="t-h3" id={`stereo-umet-${no}`}>
          {t.umet}
        </h3>
        <div className="stereo-umet__grid">
          <ul className="stereo-umet__list">
            {t.umetSpisok[no].map((item) => (
              <li key={item}>
                <Tex text={item} />
              </li>
            ))}
          </ul>
          <KartinkaUmet no={no} />
        </div>
      </section>

      <section className="stereo-tipy" id="tipy" aria-labelledby={`stereo-tipy-${no}`}>
        <h3 className="t-h3" id={`stereo-tipy-${no}`}>
          {t.tipy}
        </h3>
        <p className="stereo-tipy__lead">{t.tipyLead}</p>
        <ul className="stereo-tipy__grid">
          {tipy.map((tip) => {
            const glava = glavy.find((item) => item.id === tip.glava);
            const n = tip.prototipy?.length;
            const razbor = sRazborom.has(tip.id);
            return (
              <li key={tip.id}>
                <Link
                  className={razbor ? 'stereo-tip stereo-tip--razbor' : 'stereo-tip'}
                  href={
                    razbor ? `${base}/razbor/${tip.id}/` : `${base}/teoriya/#teoriya-${tip.glava}`
                  }
                >
                  <span className="stereo-tip__title">{tip.title}</span>
                  <span className="stereo-tip__meta">
                    {razbor ? <span className="stereo-tip__razbor">{t.razbor}</span> : null}
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
