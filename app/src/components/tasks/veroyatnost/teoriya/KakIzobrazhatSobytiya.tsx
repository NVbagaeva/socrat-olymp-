import { clsx } from 'clsx';
import { CoordinateLine, type Promezhutok } from '@/components/probability';
import { IZOBRAZHENIE, type IzobrazhenieStroka } from '@/content/veroyatnost-teoriya';
import { plain } from '@/lib/tex';
import { Tex } from '../Tex';

/**
 * Раздел теории «Как изображать события» задания №4.
 *
 * Таблица-сопоставление: событие, его диаграмма Эйлера и оно же на
 * числовой прямой — пять строк по спецификации автора. Диаграммы
 * Эйлера рисуются здесь кругами и прямоугольником на токенах;
 * числовую прямую рисует CoordinateLine из тренажёра, в режиме
 * событий-промежутков. На узкой карточке таблица рассыпается на
 * карточки: событие — заголовок, под ним два рисунка с подписями.
 * Тексты — из content/veroyatnost-teoriya; задач в разделе нет.
 */

type Vid = IzobrazhenieStroka['id'];

/* ── Диаграмма Эйлера ─────────────────────────────────────────────── */

/* Геометрия в единицах viewBox: прямоугольник — всё пространство
   исходов, круги — события. */
const E = { w: 220, h: 140, pole: 6, r: 38, cy: 70 };

/** Имя события в кружке: курсивом математического шрифта. */
function Imya({
  x,
  y,
  cherta,
  children,
}: {
  x: number;
  y: number;
  cherta?: boolean;
  children: string;
}) {
  return (
    <text
      className={clsx('pr-math vteor-eyler__imya', cherta && 'vteor-eyler__imya--cherta')}
      x={x}
      y={y}
      textAnchor="middle"
    >
      <tspan className="pr-var">{children}</tspan>
    </text>
  );
}

/**
 * Диаграмма Эйлера одного из пяти видов. Закраска — полупрозрачные
 * заливки цвета оси и акцента; общая часть двух кругов вырезается
 * маской, чтобы закрасить только её.
 */
function Eyler({ vid, alt }: { vid: Vid; alt: string }) {
  const pole = { x: E.pole, y: E.pole, width: E.w - 2 * E.pole, height: E.h - 2 * E.pole };
  const levyy = vid === 'nesovmestnye' ? 62 : 84;
  const pravyy = vid === 'nesovmestnye' ? 158 : 136;
  const klipId = `eyler-${vid}`;
  return (
    <svg
      className="vteor-eyler"
      viewBox={`0 0 ${E.w} ${E.h}`}
      width={E.w}
      height={E.h}
      role="img"
      aria-label={alt}
    >
      <rect
        className={clsx('vteor-eyler__pole', vid === 'dostovernoe' && 'is-zakrasheno')}
        {...pole}
        rx="8"
      />

      {vid === 'protivopolozhnoe' ? (
        <>
          {/* Всё, кроме круга A, — это Ā: закрашен прямоугольник
              вторым цветом, а круг поверх — первым, без прозрачности
              под ним. */}
          <rect className="vteor-eyler__zalivka vteor-eyler__zalivka--b" {...pole} rx="8" />
          <circle
            className="vteor-eyler__krug vteor-eyler__krug--fon"
            cx={E.w / 2}
            cy={E.cy}
            r={E.r}
          />
          <circle className="vteor-eyler__krug is-zakrasheno" cx={E.w / 2} cy={E.cy} r={E.r} />
          <Imya x={E.w / 2} y={E.cy + 7}>
            A
          </Imya>
          <Imya x={E.w - 30} y={E.h - 20} cherta>
            A
          </Imya>
        </>
      ) : null}

      {vid === 'nesovmestnye' || vid === 'peresechenie' || vid === 'obedinenie' ? (
        <>
          {vid === 'peresechenie' ? (
            <>
              <clipPath id={klipId}>
                <circle cx={levyy} cy={E.cy} r={E.r} />
              </clipPath>
              {/* Общая часть: круг B, обрезанный кругом A. */}
              <circle
                className="vteor-eyler__krug is-zakrasheno is-obshchee"
                cx={pravyy}
                cy={E.cy}
                r={E.r}
                clipPath={`url(#${klipId})`}
              />
            </>
          ) : null}
          <circle
            className={clsx('vteor-eyler__krug', vid !== 'peresechenie' && 'is-zakrasheno')}
            cx={levyy}
            cy={E.cy}
            r={E.r}
          />
          <circle
            className={clsx(
              'vteor-eyler__krug vteor-eyler__krug--b',
              vid !== 'peresechenie' && 'is-zakrasheno',
            )}
            cx={pravyy}
            cy={E.cy}
            r={E.r}
          />
          <Imya x={levyy - (vid === 'nesovmestnye' ? 0 : 16)} y={E.cy + 7}>
            A
          </Imya>
          <Imya x={pravyy + (vid === 'nesovmestnye' ? 0 : 16)} y={E.cy + 7}>
            B
          </Imya>
        </>
      ) : null}
    </svg>
  );
}

/* ── Числовая прямая ──────────────────────────────────────────────── */

/** События-промежутки каждой строки на оси от 0 до 10. */
const PROMEZHUTKI: Record<
  Vid,
  { promezhutki: Promezhutok[]; vydelit?: { from: number; to: number } }
> = {
  dostovernoe: { promezhutki: [{}] },
  protivopolozhnoe: {
    promezhutki: [
      { from: 5, label: 'A' },
      { to: 5, label: 'A', cherta: true, ton: 'b' },
    ],
  },
  nesovmestnye: {
    promezhutki: [
      { from: 1, to: 4, label: 'A' },
      { from: 6, to: 9, label: 'B', ton: 'b' },
    ],
  },
  peresechenie: {
    promezhutki: [
      { from: 1, to: 6, label: 'A' },
      { from: 4, to: 9, label: 'B', ton: 'b' },
    ],
    vydelit: { from: 4, to: 6 },
  },
  obedinenie: {
    promezhutki: [
      { from: 1, to: 6, label: 'A' },
      { from: 4, to: 9, label: 'B', ton: 'b' },
    ],
    vydelit: { from: 1, to: 9 },
  },
};

function Pryamaya({ vid, alt }: { vid: Vid; alt: string }) {
  const { promezhutki, vydelit } = PROMEZHUTKI[vid];
  return (
    <CoordinateLine
      className="vteor-izobr__pryamaya"
      min={0}
      max={10}
      promezhutki={promezhutki}
      {...(vydelit === undefined ? {} : { vydelit })}
      alt={alt}
    />
  );
}

/* ── Раздел ───────────────────────────────────────────────────────── */

export function KakIzobrazhatSobytiya() {
  const { lead, kolonki, stroki, plashka, formula } = IZOBRAZHENIE;

  return (
    <>
      <p className="vteor-blok__lead">{lead}</p>

      <div
        className="vteor-izobr"
        role="table"
        aria-label={`${kolonki.sobytie}: ${kolonki.eyler} и ${kolonki.pryamaya}`}
      >
        <div className="vteor-izobr__shapka" role="row">
          <span role="columnheader">{kolonki.sobytie}</span>
          <span role="columnheader">{kolonki.eyler}</span>
          <span role="columnheader">{kolonki.pryamaya}</span>
        </div>
        {stroki.map((stroka) => (
          <div key={stroka.id} className="vteor-izobr__ryad" role="row">
            <h3 className="vteor-izobr__sobytie" role="rowheader">
              <Tex text={stroka.sobytie} />
            </h3>
            <figure className="vteor-izobr__yacheyka" role="cell">
              <Eyler vid={stroka.id} alt={`${kolonki.eyler}: ${plain(stroka.eyler)}`} />
              <figcaption className="vteor-izobr__podpis">
                <span className="vteor-izobr__kolonka">{kolonki.eyler}: </span>
                <Tex text={stroka.eyler} />
              </figcaption>
            </figure>
            <figure className="vteor-izobr__yacheyka vteor-shema" role="cell">
              <Pryamaya vid={stroka.id} alt={`${kolonki.pryamaya}: ${plain(stroka.pryamaya)}`} />
              <figcaption className="vteor-izobr__podpis">
                <span className="vteor-izobr__kolonka">{kolonki.pryamaya}: </span>
                <Tex text={stroka.pryamaya} />
              </figcaption>
            </figure>
          </div>
        ))}
      </div>

      <p className="vteor-izobr__plashka">{plashka}</p>
      <p className="vteor-izobr__plashka vteor-izobr__plashka--formula">
        <Tex text={formula.text} /> <Tex className="vteor-izobr__formula" text={formula.tex} />
      </p>
    </>
  );
}
