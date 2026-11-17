import { nomerRazdela } from '@/content/struktura';
import { VITRINA_STEREO as T } from '@/content/vitrinaStereo';
import { href, ZADANIYA } from '@/lib/paths';
import { ORTHO_AZIMUTH, ORTHO_ELEVATION, orthoAt } from '@/lib/solid/project';
import { renderSolid } from '@/lib/solid/render';
import { razbor3 } from '@/lib/stereo/razbory3';
import { razbor15 } from '@/lib/stereo/razbory15';
import { texPlain } from '@/lib/texPlain';
import { BANK } from '@/lib/zadanie3';
import { RAZDEL3, tipHref3 } from '@/lib/zadanie3/links';
import { StereoZhivaya } from './StereoZhivaya';
import './stereo-vitrina.css';

/** Разбор, который живёт на главной: тот же, что на вкладке «О задании». */
const TIP_GLAVNOY = 'diagonali';

/** Индексы вершин знаками Юникода: A_1, A_{1} → A₁ (texPlain их не трогает). */
const INDEKS = '₀₁₂₃₄₅₆₇₈₉';
function sIndeksami(tex: string): string {
  return texPlain(tex.replace(/_\{?(\d)\}?/g, (_m, d: string) => INDEKS[Number(d)] ?? d));
}

/** Последний шаг модели: на нём выделен рабочий треугольник. */
function shagovModeli(shagi: readonly { shag: number }[]): number {
  return Math.max(...shagi.map((s) => s.shag));
}

/** Неподвижная миниатюра: тот же движок, финальный шаг разбора, без подписей. */
function miniSvg(model: Parameters<typeof renderSolid>[0], shag: number): string {
  return renderSolid(model, { tema: 'ekran', shag, ustoychivo: true, bezPodpisey: true });
}

/**
 * Витрина на главной, третья часть: настоящий чертёж задания 3 — его
 * можно вращать. Серверная часть: первый кадр SVG и миниатюры рисуются
 * на сборке (lib/solid), число задач — из банка. Движок для вращения
 * приезжает в браузер, только когда блок подъезжает к экрану
 * (StereoZhivaya). WebGL нет: чертёж — SVG, с кристаллом первого экрана
 * (three.js) не делит ни контекст, ни цикл кадров.
 */
export function StereoChast() {
  const razbor = razbor3(TIP_GLAVNOY);
  const cilindr = razbor3('cilindr-komb');
  const kubiki = razbor3('kubiki');
  const sechenie = razbor15('ploshchad-secheniya');
  if (!razbor || !cilindr || !kubiki || !sechenie) {
    throw new Error('StereoChast: нет разбора для витрины');
  }
  const model = razbor.model();
  const az = model.rakurs?.azimuth ?? ORTHO_AZIMUTH;
  const el = model.rakurs?.elevation ?? ORTHO_ELEVATION;
  const nachalo = shagovModeli(T.shagi);
  const svg = renderSolid(model, {
    view: orthoAt(az, el),
    ustoychivo: true,
    tema: 'ekran',
    shag: nachalo,
  });
  const zadach = BANK.reduce((sum, p) => sum + p.varianty.length, 0);
  const nomer15 = nomerRazdela(15);

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
      podpis: T.mini.sechenie(nomer15),
      svg: miniSvg(sechenie.model(), sechenie.shagi.length),
    },
  ];

  return (
    <StereoZhivaya
      model={model}
      svg={svg}
      az={az}
      el={el}
      nachalo={nachalo}
      lid={T.lid(zadach)}
      uslovie={sIndeksami(razbor.uslovie)}
      knopkaHref={RAZDEL3}
      mini={mini}
    />
  );
}
