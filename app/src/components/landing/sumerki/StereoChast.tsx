import Link from 'next/link';
import { nomerRazdela } from '@/content/struktura';
import { VITRINA_STEREO as T } from '@/content/vitrinaStereo';
import { href, ZADANIYA } from '@/lib/paths';
import type { Model } from '@/lib/solid/model';
import { ORTHO_AZIMUTH, ORTHO_ELEVATION, orthoAt } from '@/lib/solid/project';
import { renderSolid } from '@/lib/solid/render';
import { razbor3 } from '@/lib/stereo/razbory3';
import { razbor15 } from '@/lib/stereo/razbory15';
import { texPlain } from '@/lib/texPlain';
import { BANK } from '@/lib/zadanie3';
import { RAZDEL3, tipHref3 } from '@/lib/zadanie3/links';
import { StereoOzhivit } from './StereoOzhivit';
import './stereo-vitrina.css';

/** Разбор, который живёт на главной: тот же, что на вкладке «О задании». */
const TIP_GLAVNOY = 'diagonali';

/** Индексы вершин знаками Юникода: A_1, A_{1} → A₁ (texPlain их не трогает). */
const INDEKS = '₀₁₂₃₄₅₆₇₈₉';
function sIndeksami(tex: string): string {
  return texPlain(tex.replace(/_\{?(\d)\}?/g, (_m, d: string) => INDEKS[Number(d)] ?? d));
}

/** Неподвижная миниатюра: тот же движок, финальный шаг разбора, без подписей. */
function miniSvg(model: Model, shag: number): string {
  return renderSolid(model, { tema: 'ekran', shag, ustoychivo: true, bezPodpisey: true });
}

function razborIli<R>(r: R | undefined, tip: string): R {
  if (r === undefined) throw new Error(`StereoChast: нет разбора «${tip}»`);
  return r;
}

/**
 * Витрина на главной, третья часть: настоящий чертёж задания 3 — его
 * можно вращать рукой. Вся разметка — на сборке: первый кадр SVG и
 * миниатюры рисует движок lib/solid, число задач — из банка. В браузер
 * в первую загрузку идёт только StereoOzhivit; поведение и движок
 * приезжают, когда блок подъезжает к экрану (stereoOzhivlenie).
 * WebGL нет: чертёж — SVG, с кристаллом первого экрана (three.js) он
 * не делит ни контекст, ни цикл кадров.
 */
export function StereoChast() {
  const razbor = razborIli(razbor3(TIP_GLAVNOY), TIP_GLAVNOY);
  if (razbor.otvet !== T.otvet) {
    throw new Error(`StereoChast: ответ на главной ${T.otvet}, в разборе ${razbor.otvet}`);
  }
  const cilindr = razborIli(razbor3('cilindr-komb'), 'cilindr-komb');
  const kubiki = razborIli(razbor3('kubiki'), 'kubiki');
  const sechenie = razborIli(razbor15('ploshchad-secheniya'), 'ploshchad-secheniya');

  const model = razbor.model();
  const az = model.rakurs?.azimuth ?? ORTHO_AZIMUTH;
  const el = model.rakurs?.elevation ?? ORTHO_ELEVATION;
  const nachalo = Math.max(...T.shagi.map((s) => s.shag));
  const svg = renderSolid(model, {
    view: orthoAt(az, el),
    ustoychivo: true,
    tema: 'ekran',
    shag: nachalo,
  });
  const zadach = BANK.reduce((sum, p) => sum + p.varianty.length, 0);

  const mini = [
    {
      id: 'cilindr',
      href: tipHref3('cilindr-komb'),
      podpis: T.mini.cilindr,
      svg: miniSvg(cilindr.model(), cilindr.shagi.length),
    },
    {
      id: 'kubiki',
      href: tipHref3('kubiki'),
      podpis: T.mini.kubiki,
      svg: miniSvg(kubiki.model(), kubiki.shagi.length),
    },
    {
      id: 'sechenie',
      href: href(ZADANIYA, 15, 'razbor', 'ploshchad-secheniya'),
      podpis: T.mini.sechenie(nomerRazdela(15)),
      svg: miniSvg(sechenie.model(), sechenie.shagi.length),
    },
  ];

  const i = T.zagolovok.indexOf(T.akcent);
  return (
    <section className="vit-chast vit-chast--stereo" aria-labelledby="vit-stereo">
      <div className="vit-chast__tekst">
        <p className="vit-metka-chasti">{T.metka}</p>
        <h3 id="vit-stereo" className="vit-chast__z">
          {T.zagolovok.slice(0, i)}
          <span className="vit-akcent">{T.akcent}</span>
          {T.zagolovok.slice(i + T.akcent.length)}
        </h3>
        <p className="vit-chast__lid">{T.lid(zadach)}</p>
      </div>

      <div className="vit-chast__scena">
        <div className="vst-scena">
          <div
            className="vst-oblast"
            role="img"
            tabIndex={0}
            aria-label={`${model.alt}. ${T.oblast}`}
          >
            <div className="vst-kholst" dangerouslySetInnerHTML={{ __html: svg }} />
          </div>
          <span className="vst-pol" aria-hidden="true" />
          <p className="vst-zhest" aria-hidden="true">
            <svg viewBox="0 0 24 24" className="vst-zhest__ruka" focusable="false">
              <path d="M9 11V5.5a1.5 1.5 0 0 1 3 0V10m0-1.5a1.5 1.5 0 0 1 3 0V11m0-1a1.5 1.5 0 0 1 3 0v4.5a6 6 0 0 1-6 6h-.6a6 6 0 0 1-4.6-2.2L4.5 15.4a1.6 1.6 0 0 1 2.4-2.1L9 15" />
            </svg>
            <span className="vst-zhest__t vst-zhest__t--palec">↔ {T.zhest.palcem}</span>
            <span className="vst-zhest__t vst-zhest__t--mysh">↔ {T.zhest.myshyu}</span>
          </p>
          <button type="button" className="vst-sbros" hidden>
            {T.sbrosit}
          </button>
        </div>
        <p className="vst-podpis">{T.podpis}</p>
      </div>

      <div className="vst-razbor">
        <p className="vst-zadacha">
          <span className="vst-zadacha__m">{T.zadacha}</span>
          {sIndeksami(razbor.uslovie)}
        </p>
        <p className="vst-shagi-z">{T.shagiZ}</p>
        <ol className="vit-punkty vst-shagi">
          {T.shagi.map((s, k) => (
            <li key={s.shag}>
              <button
                type="button"
                className={s.shag === nachalo ? 'vit-punkt is-aktivnyy' : 'vit-punkt'}
                aria-pressed={s.shag === nachalo}
                data-shag={s.shag}
              >
                <span className="vit-punkt__no">{String(k + 1).padStart(2, '0')}</span>
                <span className="vit-punkt__tekst">
                  <span className="vit-punkt__z">{s.z}</span>
                  <span className="vst-formula">{s.f}</span>
                </span>
              </button>
            </li>
          ))}
        </ol>
      </div>

      <div className="vit-knopki">
        <Link className="vit-knopka vit-knopka--zalitaya" href={RAZDEL3}>
          {T.knopka}
          <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path d="M5 12h13M12 6l6 6-6 6" />
          </svg>
        </Link>
      </div>

      <div className="vst-mini-blok">
        <p className="vst-mini-z">{T.minZ}</p>
        <ul className="vst-mini">
          {mini.map((m) => (
            <li key={m.id}>
              <Link className="vst-mini__k" href={m.href}>
                <span
                  className="vst-mini__ris"
                  aria-hidden="true"
                  dangerouslySetInnerHTML={{ __html: m.svg }}
                />
                <span className="vst-mini__p">{m.podpis}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>

      <StereoOzhivit model={model} az={az} el={el} nachalo={nachalo} />
    </section>
  );
}
