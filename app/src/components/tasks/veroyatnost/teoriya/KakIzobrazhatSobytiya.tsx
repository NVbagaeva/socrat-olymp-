import fs from 'node:fs';
import path from 'node:path';
import Image from 'next/image';
import { clsx } from 'clsx';
import { CoordinateLine, type Promezhutok, type Tochka } from '@/components/probability';
import { Details, EmptyState, HandNote } from '@/components/ui';
import { IZOBRAZHENIE, type IzobrazhenieStroka } from '@/content/veroyatnost-teoriya';
import { plain } from '@/lib/tex';
import { HintIcon } from '../../prep/PrepIcons';
import { Tex } from '../Tex';

/**
 * Раздел теории «Как изображать события» задания №4 — по макету
 * design-reference/mockups/zadanie-04/teoriya-kak-izobrazhat-sobytiya-1440.png.
 *
 * Сверху вниз: лид → две карточки способов → блок про Эйлера →
 * строка-связка → таблица-сопоставление → «Разберём на примере» →
 * две итоговые плашки. Диаграммы Эйлера рисуются здесь кругами и
 * прямоугольником на токенах; числовую прямую рисует CoordinateLine
 * из тренажёра в режиме событий-промежутков и точек-исходов.
 * Тексты — в content/veroyatnost-teoriya; задач в разделе нет.
 *
 * Два отступления от макета — по указанию автора: блок про Эйлера
 * короче (в плашке только сам факт, остальное под «Ещё один факт»),
 * а кегль текста в нём не мельче основного.
 */

type Vid = IzobrazhenieStroka['id'];

/** Портрет лежит в public: нет файла — пустое место, а не чужая картинка. */
function portretEst(): boolean {
  try {
    return fs.statSync(path.join(process.cwd(), 'public', IZOBRAZHENIE.eyler.portret.src)).isFile();
  } catch {
    return false;
  }
}

/** Текст с выделениями между двойными звёздочками — как на макете. */
function Zhirnym({ text }: { text: string }) {
  return (
    <>
      {text
        .split(/\*\*(.+?)\*\*/)
        .map((kusok, i) => (i % 2 === 1 ? <b key={i}>{kusok}</b> : kusok))}
    </>
  );
}

/* ── Диаграммы Эйлера ─────────────────────────────────────────────── */

/* Геометрия в единицах viewBox: прямоугольник — всё пространство
   исходов, круги — события. */
const E = { w: 220, h: 124, pole: 6, r: 36, cy: 62 };

/** Имя события: курсивом математического шрифта, как в формулах. */
function Imya({
  x,
  y,
  cherta,
  pryamoy,
  children,
}: {
  x: number;
  y: number;
  cherta?: boolean;
  /** Прямое начертание — для Ω: курсивного омикрона в шрифте формул нет. */
  pryamoy?: boolean;
  children: string;
}) {
  return (
    <text
      className={clsx(
        'pr-math vizo-eyler__imya',
        cherta && 'vizo-eyler__imya--cherta',
        pryamoy && 'vizo-eyler__imya--pryamoy',
      )}
      x={x}
      y={y}
      textAnchor="middle"
    >
      {pryamoy ? children : <tspan className="pr-var">{children}</tspan>}
    </text>
  );
}

/** Два круга таблицы: несовместные — врозь, остальные — с общей частью. */
function tsentry(vid: Vid): [number, number] {
  return vid === 'nesovmestnye' ? [62, 158] : [84, 136];
}

/**
 * Диаграмма Эйлера одного из пяти видов. Закраска — полупрозрачные
 * заливки цвета оси и акцента; общая часть двух кругов вырезается
 * маской, чтобы закрасить только её.
 */
function Eyler({ vid, alt }: { vid: Vid; alt: string }) {
  const pole = { x: E.pole, y: E.pole, width: E.w - 2 * E.pole, height: E.h - 2 * E.pole };
  const [levyy, pravyy] = tsentry(vid);
  const klipId = `eyler-${vid}`;
  return (
    <svg
      className="vizo-eyler"
      viewBox={`0 0 ${E.w} ${E.h}`}
      width={E.w}
      height={E.h}
      role="img"
      aria-label={alt}
    >
      <rect
        className={clsx('vizo-eyler__pole', vid === 'dostovernoe' && 'is-zakrasheno')}
        {...pole}
        rx="8"
      />
      {vid === 'dostovernoe' ? (
        <Imya x={E.w / 2} y={E.cy + 9} pryamoy>
          Ω
        </Imya>
      ) : null}

      {vid === 'protivopolozhnoe' ? (
        <>
          {/* Всё, кроме круга A, — это Ā: прямоугольник закрашен вторым
              цветом, круг поверх — первым, без прозрачности под ним. */}
          <rect className="vizo-eyler__zalivka vizo-eyler__zalivka--b" {...pole} rx="8" />
          <circle className="vizo-eyler__krug vizo-eyler__krug--fon" cx={80} cy={E.cy} r={E.r} />
          <circle className="vizo-eyler__krug is-zakrasheno" cx={80} cy={E.cy} r={E.r} />
          <Imya x={80} y={E.cy + 7}>
            A
          </Imya>
          <Imya x={170} y={E.cy + 7} cherta>
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
                className="vizo-eyler__krug is-zakrasheno is-obshchee"
                cx={pravyy}
                cy={E.cy}
                r={E.r}
                clipPath={`url(#${klipId})`}
              />
            </>
          ) : null}
          <circle
            className={clsx('vizo-eyler__krug', vid !== 'peresechenie' && 'is-zakrasheno')}
            cx={levyy}
            cy={E.cy}
            r={E.r}
          />
          <circle
            className={clsx(
              'vizo-eyler__krug vizo-eyler__krug--b',
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

/** Мини-рисунок карточки способа: два пересекающихся круга контуром. */
function EylerMini() {
  return (
    <svg
      className="vizo-sposob__risunok"
      viewBox="0 0 96 56"
      width="96"
      height="56"
      aria-hidden="true"
    >
      <circle className="vizo-eyler__krug" cx={34} cy={28} r={22} />
      <clipPath id="vizo-mini-lens">
        <circle cx={34} cy={28} r={22} />
      </clipPath>
      <circle
        className="vizo-eyler__krug is-zakrasheno is-obshchee"
        cx={62}
        cy={28}
        r={22}
        clipPath="url(#vizo-mini-lens)"
      />
      <circle className="vizo-eyler__krug" cx={62} cy={28} r={22} />
    </svg>
  );
}

/** Мини-рисунок карточки способа: отрезок от a до b на оси x. */
function PryamayaMini() {
  return (
    <svg
      className="vizo-sposob__risunok vizo-mini"
      viewBox="0 0 120 56"
      width="120"
      height="56"
      aria-hidden="true"
    >
      <rect className="vizo-mini__polosa" x={32} y={12} width={52} height={16} rx="3" />
      <line className="vizo-mini__os" x1={4} y1={28} x2={106} y2={28} />
      <path className="vizo-mini__strelka" d="M106 28 l-7 -4 v8 z" />
      <circle className="vizo-mini__tochka" cx={32} cy={28} r={4} />
      <circle className="vizo-mini__tochka" cx={84} cy={28} r={4} />
      <text className="pr-math vizo-mini__podpis" x={32} y={48} textAnchor="middle">
        <tspan className="pr-var">a</tspan>
      </text>
      <text className="pr-math vizo-mini__podpis" x={84} y={48} textAnchor="middle">
        <tspan className="pr-var">b</tspan>
      </text>
      <text className="pr-math vizo-mini__podpis" x={114} y={32} textAnchor="middle">
        <tspan className="pr-var">x</tspan>
      </text>
    </svg>
  );
}

/**
 * Диаграмма примера с костью: исходы вписаны в свои области. В
 * кругах — исходы событий, в общей части — исходы обоих, в углах
 * прямоугольника — те, что не попали никуда.
 */
function EylerPrimer({ alt }: { alt: string }) {
  const vse: readonly number[] = IZOBRAZHENIE.primer.ishody.vse;
  const a: readonly number[] = IZOBRAZHENIE.primer.ishody.a;
  const b: readonly number[] = IZOBRAZHENIE.primer.ishody.b;
  const obshchie = a.filter((x) => b.includes(x));
  const tolkoA = a.filter((x) => !obshchie.includes(x));
  const tolkoB = b.filter((x) => !obshchie.includes(x));
  const vne = vse.filter((x) => !a.includes(x) && !b.includes(x));

  const [levyy, pravyy] = [88, 152];
  const r = 46;
  const chislo = (x: number, y: number, n: number, key: string) => (
    <text key={key} className="vizo-eyler__chislo" x={x} y={y} textAnchor="middle">
      {n}
    </text>
  );
  return (
    <svg
      className="vizo-eyler vizo-eyler--primer"
      viewBox="0 0 240 150"
      width="240"
      height="150"
      role="img"
      aria-label={alt}
    >
      <rect className="vizo-eyler__pole" x={6} y={6} width={228} height={138} rx="8" />
      <clipPath id="vizo-primer-lens">
        <circle cx={levyy} cy={75} r={r} />
      </clipPath>
      <circle
        className="vizo-eyler__krug is-zakrasheno is-obshchee"
        cx={pravyy}
        cy={75}
        r={r}
        clipPath="url(#vizo-primer-lens)"
      />
      <circle className="vizo-eyler__krug" cx={levyy} cy={75} r={r} />
      <circle className="vizo-eyler__krug vizo-eyler__krug--b" cx={pravyy} cy={75} r={r} />
      <Imya x={levyy - 18} y={34}>
        A
      </Imya>
      <Imya x={pravyy + 18} y={34}>
        B
      </Imya>
      {/* Исходы: только A — слева, только B — справа, общие — в
          линзе, остальные — по углам. */}
      {tolkoA.map((n, i) => chislo(levyy - 22, 62 + i * 30, n, `a${n}`))}
      {tolkoB.map((n, i) => chislo(pravyy + 22, 62 + i * 30, n, `b${n}`))}
      {obshchie.map((n, i) => chislo((levyy + pravyy) / 2, 62 + i * 30, n, `ab${n}`))}
      {vne.map((n, i) => chislo(24 + i * 192, 132, n, `v${n}`))}
    </svg>
  );
}

/* ── Числовые прямые ──────────────────────────────────────────────── */

/** События-промежутки каждой строки на оси от 0 до 10. */
const PROMEZHUTKI: Record<
  Vid,
  { promezhutki: Promezhutok[]; vydelit?: { from: number; to: number } }
> = {
  dostovernoe: { promezhutki: [{}] },
  /* Точка раздела одна и принадлежит A: у A граница нестрогая, у Ā
     строгая, поэтому точка закрашена. Порядок лучей — как на макете. */
  protivopolozhnoe: {
    promezhutki: [
      { to: 5, label: 'A' },
      { from: 5, label: 'A', cherta: true, ton: 'b', fromBoundary: 'strict' },
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
      className="vizo-pryamaya"
      min={0}
      max={10}
      promezhutki={promezhutki}
      {...(vydelit === undefined ? {} : { vydelit })}
      alt={alt}
    />
  );
}

/** Прямая примера: исходы 1–6 точками, цвет — чьё событие. */
function PryamayaPrimer({ alt }: { alt: string }) {
  const vse: readonly number[] = IZOBRAZHENIE.primer.ishody.vse;
  const a: readonly number[] = IZOBRAZHENIE.primer.ishody.a;
  const b: readonly number[] = IZOBRAZHENIE.primer.ishody.b;
  const tochki: Tochka[] = vse.map((n) => {
    const vA = a.includes(n);
    const vB = b.includes(n);
    if (vA && vB) {
      return { value: n, ton: 'obshchee' };
    }
    if (vA) {
      return { value: n, ton: 'a' };
    }
    return vB ? { value: n, ton: 'b' } : { value: n };
  });
  return <CoordinateLine className="vizo-pryamaya" min={0} max={7} tochki={tochki} alt={alt} />;
}

/* ── Раздел ───────────────────────────────────────────────────────── */

export function KakIzobrazhatSobytiya() {
  const { lead, sposoby, eyler, svyazka, kolonki, stroki, primer, plashka, formula } = IZOBRAZHENIE;

  return (
    <div className="vizo">
      <p className="vteor-blok__lead">{lead}</p>

      {/* Две карточки способов. */}
      <ul className="vizo-sposoby">
        {sposoby.map((sposob) => (
          <li key={sposob.id} className="vizo-sposob">
            {sposob.id === 'eyler' ? <EylerMini /> : <PryamayaMini />}
            <div className="vizo-sposob__text">
              <h4 className="vizo-sposob__title">{sposob.title}</h4>
              <p>{sposob.text}</p>
            </div>
          </li>
        ))}
      </ul>

      {/* Блок про Эйлера: портрет с рукописной подписью и реплика
          слева, плашка с фактом справа. */}
      <section className="vizo-eylerblok">
        <div className="vizo-eylerblok__levo">
          <figure className="vizo-eylerblok__figura">
            <HandNote className="vizo-eylerblok__ruka">
              {eyler.tsitata}
              <span className="vizo-eylerblok__avtor">{eyler.avtor}</span>
            </HandNote>
            {portretEst() ? (
              <Image
                className="vizo-eylerblok__portret"
                src={eyler.portret.src}
                alt={eyler.portret.alt}
                width={eyler.portret.width}
                height={eyler.portret.height}
              />
            ) : (
              <EmptyState
                className="vizo-eylerblok__pusto"
                title={eyler.portret.pusto.title}
                description={eyler.portret.pusto.description}
              />
            )}
          </figure>
          <div className="vizo-eylerblok__text">
            <h4 className="vizo-eylerblok__title">{eyler.title}</h4>
            {eyler.abzatsy.map((abzats) => (
              <p key={abzats}>
                <Zhirnym text={abzats} />
              </p>
            ))}
          </div>
        </div>
        <aside className="vizo-fakt">
          <h4 className="vizo-fakt__title">
            <span className="vizo-fakt__znak" aria-hidden="true">
              <HintIcon />
            </span>
            {eyler.fakt.title}
          </h4>
          <p className="vizo-fakt__text">{eyler.fakt.text}</p>
          <p className="vizo-fakt__pripiska">
            <HandNote>{eyler.fakt.pripiska}</HandNote>
            <span aria-hidden="true">🤯</span>
          </p>
          <Details title={eyler.fakt.eshche.title}>
            <p className="vizo-fakt__eshche">{eyler.fakt.eshche.text}</p>
          </Details>
        </aside>
      </section>

      <p className="vizo-svyazka">{svyazka}</p>

      {/* Таблица-сопоставление: событие, формула, два рисунка. */}
      <div
        className="vizo-tabl"
        role="table"
        aria-label={`${kolonki.sobytie}: ${kolonki.eyler} и ${kolonki.pryamaya}`}
      >
        <div className="vizo-tabl__shapka" role="row">
          <span className="vizo-tabl__kolonka vizo-tabl__kolonka--sobytie" role="columnheader">
            {kolonki.sobytie}
          </span>
          <span className="vizo-tabl__kolonka" role="columnheader">
            {kolonki.eyler}
          </span>
          <span className="vizo-tabl__kolonka" role="columnheader">
            {kolonki.pryamaya}
          </span>
        </div>
        {stroki.map((stroka) => (
          <div key={stroka.id} className="vizo-tabl__ryad" role="row">
            <div className="vizo-tabl__sobytie" role="rowheader">
              <h4 className="vizo-tabl__title">
                <Tex text={stroka.sobytie} />
              </h4>
              <p className="vizo-tabl__opisanie">
                <Tex text={stroka.opisanie} />
              </p>
            </div>
            <p className="vizo-tabl__formula" role="cell">
              <Tex text={stroka.formula} />
            </p>
            <figure className="vizo-tabl__risunok" role="cell">
              <Eyler vid={stroka.id} alt={`${kolonki.eyler}: ${plain(stroka.eyler)}`} />
              <figcaption className="vizo-tabl__podpis">
                <span className="vizo-tabl__imya-kolonki">{kolonki.eyler}: </span>
                <Tex text={stroka.eyler} />
              </figcaption>
            </figure>
            <figure className="vizo-tabl__risunok vteor-shema" role="cell">
              <Pryamaya vid={stroka.id} alt={`${kolonki.pryamaya}: ${plain(stroka.pryamaya)}`} />
              <figcaption className="vizo-tabl__podpis">
                <span className="vizo-tabl__imya-kolonki">{kolonki.pryamaya}: </span>
                <Tex text={stroka.pryamaya} />
              </figcaption>
            </figure>
          </div>
        ))}
      </div>

      {/* Разберём на примере: одна кость, два события, оба рисунка и
          три строки формул. */}
      <section className="vizo-primer">
        <h4 className="vizo-primer__title">{primer.title}</h4>
        <p className="vizo-primer__text">
          <Tex text={primer.text} />
        </p>
        <div className="vizo-primer__risunki">
          <figure className="vizo-primer__risunok">
            <EylerPrimer alt={plain(primer.podpisi.eyler)} />
          </figure>
          <figure className="vizo-primer__risunok vteor-shema">
            <PryamayaPrimer alt={plain(primer.podpisi.pryamaya)} />
          </figure>
        </div>
        <div className="vizo-primer__formuly">
          {primer.formuly.map((stroka) => (
            <p key={stroka[0]} className="vizo-primer__formula">
              {stroka.map((tex) => (
                <Tex key={tex} text={`$${tex}$`} />
              ))}
            </p>
          ))}
        </div>
      </section>

      <p className="vizo-plashka">{plashka}</p>
      <p className="vizo-plashka vizo-plashka--formula">
        <Tex text={formula.text} /> <Tex className="vizo-plashka__formula" text={formula.tex} />
      </p>
    </div>
  );
}
