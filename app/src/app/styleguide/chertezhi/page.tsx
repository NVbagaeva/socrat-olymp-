import type { Metadata } from 'next';
import { TIPY_18 } from '@/content/zadanie18/trenazher';
import { mnog, nepodvizhnaya, otr, tch, ug, vel, velOtr } from '@/lib/skhemy/dsl';
import { svgSkhemy } from '@/lib/skhemy/svg';
import { TEMA_CVET, TEMA_TOLSHCHINY, type VersiyaTemy } from '@/lib/skhemy/tema';
import { VID_ISHODNYY, type Element, type T2 } from '@/lib/skhemy/tipy';
import { scena18 } from '@/lib/zadanie18/trenazher/sceny';
import { chertezhSvg } from '@/lib/chertezh3';
import { katex } from '@/lib/graph/katex';
import { renderPlan } from '@/lib/planimetriya/render';
import { risunokTeorii } from '@/lib/planimetriya/teoriya';
import { RAZDELY } from '@/lib/zadanie3';
import { chertezhVarianta } from '@/lib/zadanie3/chertezhi';
import 'katex/dist/katex.min.css';
import './chertezhi.css';

/* Стильгайд темы чертежа движка схем (lib/skhemy/tema.ts): смысловые
   роли на примерах и все шаблоны генератора №18 — цветная версия
   (экран, цветной PDF) и печатная (лист по умолчанию) рядом. */
export const metadata: Metadata = {
  title: 'Будет на ЕГЭ — тема чертежа',
  robots: { index: false, follow: false },
};

const SOST = { lit: new Set<string>(), shag: null, podpisi: true };

function chertezh(
  elementy: (t: Record<string, T2>) => Element[],
  t: Record<string, T2>,
  versiya: VersiyaTemy,
  W = 220,
  H = 150,
): string {
  const sk = nepodvizhnaya('sg', t, (x) => elementy(x as Record<string, T2>));
  return svgSkhemy(sk, sk.nachalo, VID_ISHODNYY, SOST, {
    W,
    H,
    opisanie: '',
    samodostatochnyy: true,
    tema: versiya,
  });
}

/* Треугольник для образцов ролей. */
const T: Record<string, T2> = { A: [0, 0], B: [2.2, 3.4], C: [6, 0], K: [0.73, 1.13], M: [3, 0] };
const kontur = (t: Record<string, T2>) => [
  otr('AB', t.A!, t.B!, { rol: 'figure' }),
  otr('BC', t.B!, t.C!, { rol: 'figure' }),
  otr('CA', t.C!, t.A!, { rol: 'figure' }),
];
const tochki = (t: Record<string, T2>, imena: string[]) => imena.map((i) => tch(i, t[i]!));

const ROLI: { rol: string; opisanie: string; elementy: (t: Record<string, T2>) => Element[] }[] = [
  {
    rol: 'figure',
    opisanie: `Основная фигура: контур navy ${TEMA_CVET.navy}, ${TEMA_TOLSHCHINY.ekran.kontur} px; заливка синим ~7 %.`,
    elementy: (t) => [
      mnog('f', [t.A!, t.B!, t.C!], { skrytyy: false, rol: 'figure' }),
      ...kontur(t),
      ...tochki(t, ['A', 'B', 'C']),
    ],
  },
  {
    rol: 'region',
    opisanie: `Фигура, площадь которой дана или ищется: заливка терракотой ~18 %, подпись площади — терракотой внутри фигуры.`,
    elementy: (t) => [
      mnog('r', [t.A!, t.B!, t.C!], { skrytyy: false, rol: 'region' }),
      ...kontur(t),
      vel('s', 'S_ABC = 24', { vnutri: [2.7, 1.1] }, { rol: 'region' }),
      ...tochki(t, ['A', 'B', 'C']),
    ],
  },
  {
    rol: 'part-x · part-y',
    opisanie: `Части с подписями через x — синие, через y — терракотовые, ${TEMA_TOLSHCHINY.ekran.chast} px; подписи — тем же цветом.`,
    elementy: (t) => [
      ...kontur(t),
      otr('AK', t.A!, t.K!, { rol: 'part-x' }),
      otr('KB', t.K!, t.B!, { rol: 'part-x' }),
      otr('AM', t.A!, t.M!, { rol: 'part-y' }),
      otr('MC', t.M!, t.C!, { rol: 'part-y' }),
      velOtr('x', 'x', t.A!, t.K!, { rol: 'part-x' }),
      velOtr('2x', '2x', t.K!, t.B!, { rol: 'part-x' }),
      velOtr('y1', 'y', t.A!, t.M!, { rol: 'part-y' }),
      velOtr('y2', 'y', t.M!, t.C!, { rol: 'part-y' }),
      ...tochki(t, ['A', 'B', 'C', 'K', 'M']),
    ],
  },
  {
    rol: 'aux · construction',
    opisanie: `Вспомогательные отрезки и чевианы — navy ${TEMA_TOLSHCHINY.ekran.vspom} px; построения и продолжения — серо-синий пунктир ${TEMA_TOLSHCHINY.ekran.postroenie} px.`,
    elementy: (t) => [
      ...kontur(t),
      otr('BM', t.B!, t.M!, { rol: 'aux' }),
      otr('CK', t.C!, t.K!, { rol: 'aux' }),
      otr('BD', t.B!, [3.6, -2], { stil: 'punktir', rol: 'construction' }),
      ...tochki(t, ['A', 'B', 'C', 'K', 'M']),
    ],
  },
  {
    rol: 'equal-marks',
    opisanie: `Штрихи равенства — цвета своего отрезка, ${TEMA_TOLSHCHINY.ekran.shtrih} px.`,
    elementy: (t) => [
      otr('AB', t.A!, t.B!, { rol: 'figure' }),
      otr('BC', t.B!, t.C!, { rol: 'figure' }),
      otr('AM', t.A!, t.M!, { rol: 'part-y', shtrihi: 1 }),
      otr('MC', t.M!, t.C!, { rol: 'part-y', shtrihi: 1 }),
      otr('BM', t.B!, t.M!, { rol: 'aux' }),
      ...tochki(t, ['A', 'B', 'C', 'M']),
    ],
  },
  {
    rol: 'angle',
    opisanie: `Общий или данный угол: дуга ${TEMA_TOLSHCHINY.ekran.ugol} px и сектор тёплым оранжевым ~20 %.`,
    elementy: (t) => [
      ...kontur(t),
      ug('a', t.B!, t.A!, t.C!, { rol: 'angle' }),
      ...tochki(t, ['A', 'B', 'C']),
    ],
  },
  {
    rol: 'point · labels',
    opisanie:
      'Точки — navy, радиус 3 px, белая обводка 1 px. Подписи вершин — navy, курсив KaTeX, никогда не окрашиваются.',
    elementy: (t) => [
      ...kontur(t),
      otr('AK', t.A!, t.K!, { rol: 'part-x' }),
      otr('KB', t.K!, t.B!, { rol: 'part-x' }),
      ...tochki(t, ['A', 'B', 'C', 'K']),
    ],
  },
];

/** Контраст с белым по WCAG. */
function kontrast(hex: string): string {
  const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const l = c.map((x) => (x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4));
  const L = 0.2126 * l[0]! + 0.7152 * l[1]! + 0.0722 * l[2]!;
  return (1.05 / (L + 0.05)).toFixed(1).replace('.', ',');
}

const CVETA: { imya: string; hex: string; gde: string }[] = [
  { imya: 'navy', hex: TEMA_CVET.navy, gde: 'контуры фигур, вспомогательные отрезки' },
  { imya: 'синий', hex: TEMA_CVET.vershina, gde: 'вершины и точки — только они' },
  {
    imya: 'терракота',
    hex: TEMA_CVET.velichina,
    gde: 'величины, первая переменная (x, a), угол, площадь',
  },
  { imya: 'янтарь', hex: TEMA_CVET.velichina2, gde: 'вторая переменная (y, b)' },
  { imya: 'серо-синий', hex: TEMA_CVET.postroenie, gde: 'построения (пунктир)' },
];

const tex = (t: string) => katex.renderToString(t, { throwOnError: false });

/** Чертёж №3 листа по прототипу и номеру варианта; podmena — свой TeX первого данного. */
function chertezh3(pid: string, n: number, podmena?: string): string {
  const p = RAZDELY.flatMap((r) => r.prototipy).find((x) => x.id === pid);
  const v = p?.varianty.find((x) => x.n === n);
  if (p === undefined || v === undefined) return '';
  const ch = chertezhVarianta(p, v);
  if (ch === null) return '';
  const sc =
    podmena === undefined
      ? ch.scenariy
      : {
          ...ch.scenariy,
          dannye: (ch.scenariy.dannye ?? []).map((d, i) =>
            i === 0 ? { ...d, tekst: podmena } : d,
          ),
        };
  return chertezhSvg(sc, { rezhim: 'uchenik', shirina: 320, kegl: 15, pechatMm: 62, katex: tex });
}

function shablon18(id: string) {
  const t = TIPY_18.find((x) => x.id === id);
  if (t === undefined) return () => '';
  const sk = scena18(id, t.varianty[0]!);
  return (v: VersiyaTemy) =>
    svgSkhemy(sk, sk.nachalo, VID_ISHODNYY, SOST, {
      W: 360,
      H: 250,
      opisanie: t.nazvanie,
      samodostatochnyy: true,
      tema: v,
    });
}

/* Печать у №1 и №3 — ч/б тема листа (токены --chertezh-* чернеют,
   см. .sg-ch__pechat в chertezhi.css), у №18 — печатная версия темы. */
const OBRAZCY: { imya: string; svg: (v: VersiyaTemy) => string }[] = [
  {
    imya: '№1 · прямоугольный треугольник 30°, 60°, 90°',
    svg: () => {
      const r = risunokTeorii('30-60-90');
      return renderPlan(r.scena, r.optsii);
    },
  },
  { imya: '№3 · пирамида P03-47', svg: () => chertezh3('P03-47', 1) },
  { imya: '№3 · куб P03-02', svg: () => chertezh3('P03-02', 1) },
  {
    imya: '№3 · куб P03-02, дробь на диагонали (проверка)',
    svg: () => chertezh3('P03-02', 1, '\\dfrac{\\sqrt{3}}{2}'),
  },
  { imya: '№18 · menelay-pl — две переменные', svg: shablon18('menelay-pl') },
  { imya: '№18 · obshchiy-ugol', svg: shablon18('obshchiy-ugol') },
];

export default function Page() {
  return (
    <main className="sg-ch">
      <h1>Тема чертежа</h1>
      <p className="sg-ch__lead">
        Цвет и толщина элемента — по его смысловой роли, а не по шаблону. Шаблон помечает роли (
        <code>rol</code> в lib/skhemy), тема (lib/skhemy/tema.ts) задаёт оформление — его получают
        все шаблоны. На экране — всегда цветная версия; на листах и в PDF по умолчанию печатная,
        цветная — по переключателю «Цветные чертежи». Толщины — в пикселях экрана
        (non-scaling-stroke), на бумаге контур 1,2 pt, части 2 pt.
      </p>

      <h2>Образцы: три движка в одной теме</h2>
      <p className="sg-ch__note">
        Вершины и точки — синие, полужирный курсив, на 12 % крупнее; величины — тёплые (числа и
        первая переменная — терракота, вторая — янтарь), отрезок с подписью — тем же цветом; контуры
        — navy. Печать: вершины — чёрный полужирный, величины — чёрный обычный.
      </p>
      <div className="sg-ch__shablony">
        {OBRAZCY.map((o) => (
          <section key={o.imya} className="sg-ch__shablon">
            <h3>{o.imya}</h3>
            <div className="sg-ch__para">
              <figure>
                <div dangerouslySetInnerHTML={{ __html: o.svg('cvet') }} />
                <figcaption>цветная (экран, цветной PDF)</figcaption>
              </figure>
              <figure className="sg-ch__pechat">
                <div dangerouslySetInnerHTML={{ __html: o.svg('pechat') }} />
                <figcaption>печать</figcaption>
              </figure>
            </div>
          </section>
        ))}
      </div>

      <h2>Роли</h2>
      <div className="sg-ch__roli">
        {ROLI.map((r) => (
          <section key={r.rol} className="sg-ch__rol">
            <h3>
              <code>{r.rol}</code>
            </h3>
            <p>{r.opisanie}</p>
            <div className="sg-ch__para">
              <figure>
                <div dangerouslySetInnerHTML={{ __html: chertezh(r.elementy, T, 'cvet') }} />
                <figcaption>цветная</figcaption>
              </figure>
              <figure>
                <div dangerouslySetInnerHTML={{ __html: chertezh(r.elementy, T, 'pechat') }} />
                <figcaption>печать</figcaption>
              </figure>
            </div>
          </section>
        ))}
      </div>

      <h2>Цвета и контраст на белом</h2>
      <table className="sg-ch__cveta">
        <tbody>
          {CVETA.map((c) => (
            <tr key={c.imya}>
              <td>
                <span className="sg-ch__plashka" style={{ background: c.hex }} />
              </td>
              <td>{c.imya}</td>
              <td>
                <code>{c.hex}</code>
              </td>
              <td>{kontrast(c.hex)} : 1</td>
              <td>{c.gde}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="sg-ch__note">
        Подписи — не ниже 4,5 : 1. Фирменная терракота (3,0 : 1) — только для линий и заливок
        (графике достаточно 3 : 1); подписи в её ролях — тёмным оттенком того же тона. Синий и
        оранжевый различимы при дальтонизме; цвет не единственный носитель смысла — все подписи на
        месте.
      </p>

      <h2>Шаблоны генератора №18</h2>
      <div className="sg-ch__shablony">
        {TIPY_18.map((t) => {
          const sk = scena18(t.id, t.varianty[0]!);
          const svg = (v: VersiyaTemy) =>
            svgSkhemy(sk, sk.nachalo, VID_ISHODNYY, SOST, {
              W: 360,
              H: 250,
              opisanie: t.nazvanie,
              samodostatochnyy: true,
              tema: v,
            });
          return (
            <section key={t.id} className="sg-ch__shablon">
              <h3>
                {t.nazvanie} <code>{t.id}</code>
              </h3>
              <div className="sg-ch__para">
                <figure>
                  <div dangerouslySetInnerHTML={{ __html: svg('cvet') }} />
                  <figcaption>цветная (экран, цветной PDF)</figcaption>
                </figure>
                <figure>
                  <div dangerouslySetInnerHTML={{ __html: svg('pechat') }} />
                  <figcaption>печать (лист по умолчанию)</figcaption>
                </figure>
              </div>
            </section>
          );
        })}
      </div>
    </main>
  );
}
