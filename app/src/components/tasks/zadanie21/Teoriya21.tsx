import Link from 'next/link';
import { ZhivoyOtrezok12 } from '@/components/zhivye/otrezok12/Otrezok12';
import type { ReactNode } from 'react';
import {
  RamkaFormula,
  RamkaOpredelenie,
  RamkaPrimer,
  RamkaVazhno,
  RamkaVyvod,
} from '@/components/teoriya/Ramki';
import { TeoriyaShell } from '@/components/tasks/teoriya/TeoriyaShell';
import { Tex } from '@/components/ui/Tex';
import {
  RAZDELY_TEORII_21,
  type BlokTeorii21,
  type Kartinka21,
  type RazdelTeorii21,
  type SignChart21,
} from '@/content/teoriya21';
import { Illustration } from '@/components/ui/Illustration';
import { assetUrl } from '@/lib/assetUrl';
import '../teoriya/teoriya-steklo.css';

function Abzacy({ paras }: { paras: readonly string[] }) {
  return (
    <>
      {paras.map((p) => (
        <p className="ramka__p" key={p}>
          <Tex text={p} />
        </p>
      ))}
    </>
  );
}

const PAPKA = '/images/zadanie-21';

/**
 * Картинка на белой карточке: WebP нескольких ширин и запасной JPEG.
 * Размер — норма Illustration section (до 280).
 */
function Kartinka({ k, sizes }: { k: Kartinka21; sizes: string }) {
  const src = (w: number, ext: string) => assetUrl(`${PAPKA}/${k.imya}-${w}.${ext}`);
  return (
    <Illustration
      variant="section"
      className="z21-kart__ramka"
      src={src(k.shiriny[0] ?? k.w, 'jpg')}
      sources={[
        { type: 'image/webp', srcSet: k.shiriny.map((w) => `${src(w, 'webp')} ${w}w`).join(', ') },
      ]}
      sizes={sizes}
      alt={k.alt}
      width={k.w}
      height={k.h}
    />
  );
}

/** Цвета кукол по порядку слоёв: синий, голубой, оранжевый (у двух слоёв — без голубого). */
const cvetaSloev = (n: number): string[] =>
  n === 2 ? ['siniy', 'oranzh'] : ['siniy', 'goluboy', 'oranzh'];

/** Подписи цветов кукол: кружок цвета и текст. */
function Legenda({ punkty }: { punkty: readonly string[] }) {
  const cveta = cvetaSloev(punkty.length);
  return (
    <ul className="z21-legenda">
      {punkty.map((t, i) => (
        <li key={t}>
          <span
            className={`z21-legenda__krug z21-cvet--${cveta[i] ?? 'siniy'}`}
            aria-hidden="true"
          />
          <Tex text={t} />
        </li>
      ))}
    </ul>
  );
}

const ROLI: Record<number, string[]> = {
  2: ['внешняя', 'внутренняя'],
  3: ['внешняя', 'средняя', 'внутренняя'],
};

/** Координатная прямая: нули/исключённые точки, знак y′ и поведение y. */
function ZnakovayaPryamaya({ parts }: { parts: SignChart21['parts'] }) {
  return (
    <figure className="z21-znaki no-math-check">
      <figcaption>Координатная прямая: знак производной и поведение функции</figcaption>
      <div
        className="z21-znaki__table"
        role="table"
        aria-label="Знак производной и поведение функции"
      >
        {(
          [
            ['x', 'number'],
            ['y′', 'sign'],
            ['y', 'move'],
          ] as const
        ).map(([label, row]) => (
          <div className={`z21-znaki__row z21-znaki__row--${row}`} role="row" key={row}>
            <span className="z21-znaki__label" role="rowheader">
              {label}
            </span>
            <div
              className="z21-znaki__parts"
              style={{ gridTemplateColumns: `repeat(${parts.length}, minmax(92px, 1fr))` }}
            >
              {parts.map((part, i) => (
                <span
                  className={`z21-znaki__part z21-znaki__part--${part.kind}`}
                  role="cell"
                  key={`${part.label}-${i}`}
                >
                  {row === 'number' ? (
                    part.kind === 'point' ? (
                      <>
                        <span
                          className={`z21-znaki__marker${part.sign === 'не определена' ? 'is-open' : ''}`}
                          aria-hidden="true"
                        />
                        <span className="z21-znaki__value">{part.label}</span>
                        {part.note ? <small>{part.note}</small> : null}
                      </>
                    ) : (
                      <>
                        <span className="z21-znaki__axis" aria-hidden="true" />
                        <span className="z21-znaki__value">{part.label}</span>
                      </>
                    )
                  ) : row === 'sign' ? (
                    <span
                      className={
                        part.sign === '+'
                          ? 'is-positive'
                          : part.sign === '-'
                            ? 'is-negative'
                            : 'is-point-value'
                      }
                    >
                      {part.sign ?? ' '}
                    </span>
                  ) : (
                    <span
                      className={
                        part.move === '↗'
                          ? 'is-positive'
                          : part.move === '↘'
                            ? 'is-negative'
                            : 'is-point-value'
                      }
                    >
                      {part.kind === 'interval'
                        ? `${part.move ?? '—'} ${part.move === '↗' ? 'возрастает' : part.move === '↘' ? 'убывает' : ''}`
                        : '—'}
                    </span>
                  )}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </figure>
  );
}

function SkhemaVozrastaniya() {
  return (
    <figure className="z21-monotonnost__graph">
      <svg
        viewBox="0 0 640 250"
        role="img"
        aria-label="Схематичный график строго возрастающей функции: слева направо кривая идёт вверх"
      >
        <defs>
          <linearGradient id="z21-monotonic-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#2b67d8" stopOpacity=".18" />
            <stop offset="1" stopColor="#2b67d8" stopOpacity="0" />
          </linearGradient>
          <marker
            id="z21-monotonic-arrow"
            markerWidth="8"
            markerHeight="8"
            refX="6"
            refY="4"
            orient="auto"
          >
            <path d="M0 0 8 4 0 8z" fill="#2856a0" />
          </marker>
        </defs>
        <path
          d="M72 26v178h520"
          fill="none"
          stroke="#a9c5f0"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <path
          d="M72 67h520M72 108h520M72 149h520M180 26v178M288 26v178M396 26v178M504 26v178"
          stroke="#dbe7f7"
          strokeWidth="1"
        />
        <path
          d="M90 184C172 178 210 164 278 144s108-43 161-67 82-31 129-42v169H90z"
          fill="url(#z21-monotonic-fill)"
        />
        <path
          d="M90 184C172 178 210 164 278 144s108-43 161-67 82-31 129-42"
          fill="none"
          stroke="#285fca"
          strokeWidth="5"
          strokeLinecap="round"
        />
        <path
          d="M145 174c45-5 80-14 119-25"
          fill="none"
          stroke="#2856a0"
          strokeWidth="2.5"
          markerEnd="url(#z21-monotonic-arrow)"
        />
        <circle cx="90" cy="184" r="6" fill="#fff" stroke="#285fca" strokeWidth="3" />
        <circle cx="568" cy="35" r="6" fill="#fff" stroke="#285fca" strokeWidth="3" />
        <text x="51" y="36" fill="#172b50" fontSize="19" fontStyle="italic">
          y
        </text>
        <text x="594" y="211" fill="#172b50" fontSize="19" fontStyle="italic">
          x
        </text>
        <text x="80" y="226" fill="#516783" fontSize="16">
          a
        </text>
        <text x="562" y="226" fill="#516783" fontSize="16">
          b
        </text>
        <text x="277" y="221" fill="#2856a0" fontSize="16" fontWeight="600">
          возрастает
        </text>
      </svg>
      <figcaption>
        <Tex text="При $x$ от $a$ к $b$ функция возрастает: $y(a)<y(b)$." />
      </figcaption>
    </figure>
  );
}

/** Слои матрёшки: вложенные рамки цветов кукол, в каждой — функция и её производная. */
function SkhemaMonotonnoyVneshneyFunktsii() {
  return (
    <figure className="z21-monotonic-composition">
      <div className="z21-monotonic-composition__panels">
        <div className="z21-monotonic-composition__panel">
          <p className="z21-monotonic-composition__title">1. Находим минимум внутри</p>
          <svg
            viewBox="0 0 340 200"
            role="img"
            aria-label="Парабола t(x) имеет минимум t равно 1 при x равно минус 11"
          >
            <path
              d="M38 20v140h270"
              fill="none"
              stroke="#a9c5f0"
              strokeWidth="3"
              strokeLinecap="round"
            />
            <path
              d="M38 118h270M104 20v140M170 20v140M236 20v140"
              stroke="#dbe7f7"
              strokeWidth="1"
            />
            <path
              d="M62 44C105 90 132 132 174 137s70-44 112-93"
              fill="none"
              stroke="#285fca"
              strokeWidth="5"
              strokeLinecap="round"
            />
            <circle cx="174" cy="137" r="7" fill="#fff" stroke="#e87524" strokeWidth="4" />
            <text x="46" y="31" fill="#172b50" fontSize="17" fontStyle="italic">
              t
            </text>
            <text x="311" y="166" fill="#172b50" fontSize="17" fontStyle="italic">
              x
            </text>
            <text x="154" y="159" fill="#ad4b0b" fontSize="14" fontWeight="600">
              x₀ = −11
            </text>
            <text x="180" y="130" fill="#ad4b0b" fontSize="14" fontWeight="600">
              tмин = 1
            </text>
          </svg>
        </div>
        <div className="z21-monotonic-composition__panel">
          <p className="z21-monotonic-composition__title">2. Корень сохраняет порядок</p>
          <svg
            viewBox="0 0 340 200"
            role="img"
            aria-label="График y равно корень из t возрастает; значение t равно 1 переходит в y равно 1"
          >
            <path
              d="M38 20v140h270"
              fill="none"
              stroke="#a9c5f0"
              strokeWidth="3"
              strokeLinecap="round"
            />
            <path
              d="M38 116h270M104 20v140M170 20v140M236 20v140"
              stroke="#dbe7f7"
              strokeWidth="1"
            />
            <path
              d="M48 151C70 121 104 101 143 83S225 49 296 28"
              fill="none"
              stroke="#285fca"
              strokeWidth="5"
              strokeLinecap="round"
            />
            <circle cx="104" cy="111" r="7" fill="#fff" stroke="#e87524" strokeWidth="4" />
            <path
              d="M104 111v49M38 111h66"
              stroke="#e87524"
              strokeWidth="2"
              strokeDasharray="5 5"
            />
            <text x="46" y="31" fill="#172b50" fontSize="17" fontStyle="italic">
              y = √t
            </text>
            <text x="311" y="166" fill="#172b50" fontSize="17" fontStyle="italic">
              t
            </text>
            <text x="92" y="180" fill="#ad4b0b" fontSize="14" fontWeight="600">
              t = 1
            </text>
            <text x="44" y="105" fill="#ad4b0b" fontSize="14" fontWeight="600">
              y = 1
            </text>
          </svg>
        </div>
      </div>
      <figcaption>
        Минимум внутреннего выражения переходит в минимум функции, потому что внешний корень
        возрастает.
      </figcaption>
    </figure>
  );
}

function Sloi({ sloi }: { sloi: readonly { tex: string; proizv: string }[] }) {
  const roli = ROLI[sloi.length] ?? sloi.map(() => '');
  const cveta = cvetaSloev(sloi.length);
  const sloy = (i: number): ReactNode => {
    const s = sloi[i];
    if (s === undefined) return null;
    return (
      <div className={`z21-mat__sloy z21-cvet--${cveta[i] ?? 'siniy'}`}>
        <p className="z21-mat__shapka">
          <span className="z21-mat__rol">{roli[i]}</span>
          <Tex text={`$${s.tex}$`} />
          <Tex className="z21-mat__d" text={`$${s.proizv}$`} />
        </p>
        {sloy(i + 1)}
      </div>
    );
  };
  return <div className="z21-mat__sloi">{sloy(0)}</div>;
}

function Blok21({ b }: { b: BlokTeorii21 }): ReactNode {
  switch (b.vid) {
    case 'opredelenie':
      return (
        <RamkaOpredelenie
          title={b.title ?? 'Определение'}
          {...(b.formula ? { formula: b.formula } : {})}
        >
          <Abzacy paras={b.paras} />
          {b.diagram === 'outer-monotonic' ? <SkhemaMonotonnoyVneshneyFunktsii /> : null}
        </RamkaOpredelenie>
      );
    case 'formula':
      return <RamkaFormula formula={b.formula} {...(b.podpis ? { podpis: b.podpis } : {})} />;
    case 'tablica-proizvodnyh':
      return (
        <section className="ramka z21-tablica-proizvodnyh" aria-label={b.title}>
          <h3 className="z21-tablica-proizvodnyh__title">{b.title}</h3>
          <div
            className="z21-tablica-proizvodnyh__scroll"
            role="region"
            aria-label="Таблица производных"
            tabIndex={0}
          >
            <table>
              <thead>
                <tr>
                  <th scope="col">Функция</th>
                  <th scope="col">Производная</th>
                  <th scope="col">Правило словами</th>
                  <th scope="col">Как применять</th>
                </tr>
              </thead>
              <tbody>
                {b.rows.map((row) => (
                  <tr key={row.formula}>
                    <td>
                      <Tex text={`$${row.formula.split('=')[0]}$`} />
                    </td>
                    <td>
                      <Tex text={`$${row.formula}$`} />
                    </td>
                    <td>
                      <span className="no-math-check">
                        <Tex text={row.rule} />
                      </span>
                    </td>
                    <td>
                      <details className="z21-tablica-proizvodnyh__details">
                        <summary>Пояснение</summary>
                        <div>
                          {row.details.map((line) => (
                            <p key={line}>
                              <Tex text={line} />
                            </p>
                          ))}
                        </div>
                      </details>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      );
    case 'vazhno':
      return (
        <RamkaVazhno title={b.title ?? 'Важно!'}>
          <Abzacy paras={b.paras} />
        </RamkaVazhno>
      );
    case 'vyvod':
      return (
        <RamkaVyvod title={b.title ?? 'Вывод'}>
          <Abzacy paras={b.paras} />
        </RamkaVyvod>
      );
    case 'spisok':
      return (
        <RamkaOpredelenie title={b.title}>
          <ol className="z21-spisok">
            {b.punkty.map((s) => (
              <li key={s}>
                <Tex text={s} />
              </li>
            ))}
          </ol>
        </RamkaOpredelenie>
      );
    case 'primer':
      return (
        <RamkaPrimer
          title={b.title}
          uslovie={b.uslovie}
          shagi={b.shagi.map(({ signChart, link, ...shag }) => ({
            ...shag,
            ...(signChart || link
              ? {
                  posle: (
                    <>
                      {signChart ? <ZnakovayaPryamaya parts={signChart.parts} /> : null}
                      {link ? (
                        <p className="ramka__p z21-property-link">
                          <Link href={link.href}>{link.label} →</Link>
                        </p>
                      ) : null}
                    </>
                  ),
                }
              : {}),
          }))}
          otvet={b.otvet}
        />
      );
    case 'monotonnost':
      return (
        <section className="ramka z21-monotonnost">
          <h3 className="z21-monotonnost__title">{b.title}</h3>
          <Abzacy paras={b.paras} />
          <SkhemaVozrastaniya />
        </section>
      );
    case 'lovushka':
      return (
        <RamkaVazhno title={b.title}>
          <p className="ramka__p">
            <Tex text={`**Ошибка.** ${b.oshibka}`} />
          </p>
          <p className="ramka__p">
            <Tex text={`**Правильно.** ${b.pravilno}`} />
          </p>
        </RamkaVazhno>
      );
    case 'kartinka':
      return (
        <figure className="z21-kart">
          <Kartinka k={b.kartinka} sizes="280px" />
          <figcaption className="z21-kart__podpis">
            <Legenda punkty={b.legenda} />
            <span className="z21-kart__tekst">
              <Tex text={b.podpis} />
            </span>
          </figcaption>
        </figure>
      );
    case 'matreshka':
      return (
        <section className={b.kartinka ? 'ramka z21-mat z21-mat--s-kartinkoy' : 'ramka z21-mat'}>
          <h4 className="z21-mat__title">
            <Tex text={b.title} />
          </h4>
          <div className="z21-mat__telo">
            {b.kartinka ? (
              <figure className="z21-mat__kart">
                <Kartinka k={b.kartinka} sizes="200px" />
                {b.legenda ? (
                  <figcaption>
                    <Legenda punkty={b.legenda} />
                  </figcaption>
                ) : null}
              </figure>
            ) : null}
            <Sloi sloi={b.sloi} />
          </div>
          <p className="z21-mat__itog">
            <Tex text={`$${b.itog}$`} />
          </p>
          {b.poyasnenie ? (
            <p className="ramka__p z21-mat__poyasnenie">
              <Tex text={b.poyasnenie} />
            </p>
          ) : null}
        </section>
      );
    default:
      return null;
  }
}

function Telo({ r }: { r: RazdelTeorii21 }) {
  return (
    <div className="z21-teoriya teor-steklo">
      <p className="z21-teoriya__lead">
        <Tex text={r.lead} />
      </p>
      {r.bloki.map((b, i) => (
        <Blok21 b={b} key={`${r.id}-${i}`} />
      ))}
      {/* Живая сцена — после алгоритма и примеров про отрезок. */}
      {r.id === 'otrezok' ? <ZhivoyOtrezok12 /> : null}
    </div>
  );
}

/** Вкладка «Теория»: разделы подряд, содержание рядом (оболочка теории №4/№7). */
export function Teoriya21({ vkladka }: { vkladka: string }) {
  const tela = Object.fromEntries(RAZDELY_TEORII_21.map((r) => [r.id, <Telo r={r} key={r.id} />]));
  return (
    <TeoriyaShell
      vkladka={vkladka}
      razdely={RAZDELY_TEORII_21.map((r) => ({ id: r.id, title: r.title }))}
      tela={tela}
      dekor={{
        kartinka: (
          <span className="z21-dekor">
            <Tex text="$y'\colon\ +\ \to\ -$" />
          </span>
        ),
        note: 'Производная → нули → знаки → точка или значение',
      }}
      trackKey="21"
    />
  );
}
