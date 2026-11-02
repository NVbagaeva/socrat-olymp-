import type { ReactNode } from 'react';

/* Пиктограммы подтипов «Собрать вариант», холст 48×48.
   Классы (variant-steklo.css → .pikt): z — голубая заливка, a — заливка
   поярче, t — точка-узел, s — пунктир, n — подпись. Линия у всех одна:
   #0c3ebc, 1.6 — как у миниатюр разделов (public/images/task-01.svg). */

/** Оси координат: начало в (10, 38). */
const Osi = () => <path d="M6 38h36M10 42V6" />;
const T = ({ x, y }: { x: number; y: number }) => <circle className="t" cx={x} cy={y} r="1.8" />;
const N = ({ x, y, k, children }: { x: number; y: number; k?: number; children: string }) => (
  <text
    className="n"
    x={x}
    y={y}
    textAnchor="middle"
    style={k === undefined ? undefined : { fontSize: k }}
  >
    {children}
  </text>
);

/* ── Повторяющиеся рисунки ─────────────────────────────────────── */

const treugolnik = (
  <>
    <path className="z" d="M8 38 L24 10 L40 38 Z" />
    <T x={8} y={38} />
    <T x={24} y={10} />
    <T x={40} y={38} />
  </>
);
const kub = (
  <>
    <path className="z" d="M8 18h22v22H8z" />
    <path d="M8 18l10-8h22l-10 8M30 40l10-8V10" />
    <path className="s" d="M8 40l10-8h22M18 32V10" />
  </>
);
const krugi = (cx1: number, cx2: number, peresechenie: boolean) => (
  <>
    <circle className={peresechenie ? 'z' : 'z'} cx={cx1} cy="24" r="11" />
    <circle className="z" cx={cx2} cy="24" r="11" />
    {peresechenie ? (
      <path className="a" d="M24 15.2a11 11 0 0 1 0 17.6a11 11 0 0 1 0-17.6z" />
    ) : null}
  </>
);
const kolokol = (shirokiy: boolean) =>
  shirokiy ? (
    <path className="z" d="M4 38C14 38 16 14 24 14S34 38 44 38z" />
  ) : (
    <path className="z" d="M6 38C16 38 18 8 24 8S32 38 42 38z" />
  );
const stolbiki = (h: number[], krasnyy = -1) => (
  <>
    <path d="M6 40h36" />
    {h.map((v, i) => (
      <rect
        key={i}
        className={i === krasnyy ? 'a' : 'z'}
        x={8 + i * 8.5}
        y={40 - v}
        width="6"
        height={v}
        rx="1"
      />
    ))}
  </>
);

/** Пиктограммы разделов: запасные для подтипов без своей. */
export const RAZDELY: Record<number, ReactNode> = {
  1: (
    <>
      {treugolnik}
      <circle cx="24" cy="29" r="7.5" />
    </>
  ),
  2: (
    <>
      <path d="M10 38L34 14M34 14h-7M34 14v7" />
      <path d="M10 38h22M32 38l-5-3M32 38l-5 3" />
      <T x={10} y={38} />
    </>
  ),
  3: kub,
  4: (
    <>
      <rect className="z" x="10" y="10" width="28" height="28" rx="6" />
      <T x={17} y={17} />
      <T x={24} y={24} />
      <T x={31} y={31} />
    </>
  ),
  5: krugi(19, 29, true),
  6: stolbiki([8, 18, 26, 16, 6]),
  7: (
    <>
      <Osi />
      <path d="M12 8c4 30 14 30 28 6" />
      <path className="s" d="M8 24h34" />
    </>
  ),
  8: (
    <>
      <path d="M6 28l5-2 6 12 8-30h17" />
      <N x={33} y={30} k={13}>
        x²
      </N>
    </>
  ),
  9: (
    <>
      <Osi />
      <path d="M12 34c8-22 18-22 28-8" />
      <path d="M14 14l24 0" />
      <T x={24} y={17.5} />
    </>
  ),
  10: (
    <>
      <Osi />
      <path d="M10 38c6-26 22-26 30 0" className="s" />
      <circle className="z" cx="25" cy="16" r="3.5" />
    </>
  ),
  11: (
    <N x={24} y={32} k={22}>
      %
    </N>
  ),
  12: (
    <>
      <Osi />
      <path d="M12 34c6-4 10-22 28-26" />
    </>
  ),
  13: stolbiki([28, 24, 20, 16]),
};

/** Пиктограммы подтипов: ключ «номер:id подтипа». */
export const PIKTOGRAMMY: Record<string, ReactNode> = {
  /* ── №1. Планиметрия ── */
  '1:I': (
    <>
      {treugolnik}
      <path d="M13 38a6 6 0 0 0-2.4-5" />
      <path d="M35 38a6 6 0 0 1 2.4-5" />
    </>
  ),
  '1:II': (
    <>
      <path className="z" d="M10 36L14 12H38L34 36Z" />
      <path d="M10 36L38 12M14 12L34 36" />
      <T x={24} y={24} />
    </>
  ),
  '1:III': (
    <>
      <path className="z" d="M10 38V12L38 38Z" />
      <path d="M10 33h5v5" />
      <T x={10} y={12} />
      <T x={38} y={38} />
    </>
  ),
  '1:IV': (
    <>
      {treugolnik}
      <path d="M16 24h16" />
      <T x={16} y={24} />
      <T x={32} y={24} />
    </>
  ),
  '1:V': (
    <>
      <path className="z" d="M8 38H40V14Z" />
      <path d="M35 38v-5h5" />
      <path d="M16 38a8 8 0 0 0-1.6-4.6" />
      <N x={20} y={34}>
        α
      </N>
    </>
  ),
  '1:VI': (
    <>
      <circle className="z" cx="24" cy="24" r="15" />
      <path d="M12 33L24 24L36 33M12 33L24 9L36 33" />
      <T x={24} y={24} />
    </>
  ),
  '1:VII': (
    <>
      {treugolnik}
      <circle cx="24" cy="29" r="7.5" />
      <T x={24} y={29} />
    </>
  ),
  '1:VIII': (
    <>
      <circle cx="24" cy="25" r="16" />
      <path className="z" d="M10 33L24 9L38 33Z" />
      <T x={24} y={25} />
    </>
  ),
  '1:IX': (
    <>
      <circle className="z" cx="24" cy="24" r="15" />
      <path d="M11 31.5L37 31.5L28 9.6Z" />
      <path className="s" d="M24 24L37 31.5" />
      <N x={31} y={25}>
        R
      </N>
    </>
  ),

  /* ── №2. Векторы ── */
  '2:A': (
    <>
      <path d="M10 34L36 14M36 14h-7M36 14v7" />
      <path className="s" d="M8 40l28-22" />
      <T x={10} y={34} />
    </>
  ),
  '2:B': (
    <>
      <path d="M10 36L36 12M36 12h-7M36 12v7M10 36h28M38 36l-5-3M38 36l-5 3" />
      <N x={28} y={30}>
        ·
      </N>
      <T x={10} y={36} />
    </>
  ),
  '2:C': (
    <>
      <path d="M10 36L34 12M34 12h-7M34 12v7M10 36h28M38 36l-5-3M38 36l-5 3" />
      <path className="z" d="M10 36L20 36A10 10 0 0 0 17 29Z" />
      <T x={10} y={36} />
    </>
  ),

  /* ── №3. Стереометрия ── */
  '3:I': kub,
  '3:II': (
    <>
      <path className="z" d="M8 40L20 30L32 40Z" />
      <path d="M8 40V14M32 40V14M8 14L20 6L32 14Z" />
      <path className="s" d="M20 30V6" />
    </>
  ),
  '3:III': (
    <>
      <path className="z" d="M8 36L28 40L40 30L24 8Z" />
      <path d="M8 36L24 8L28 40M24 8L40 30" />
      <path className="s" d="M8 36L20 28L40 30M20 28L24 8" />
    </>
  ),
  '3:IV': (
    <>
      <path className="z" d="M10 34L24 8L38 34" />
      <ellipse cx="24" cy="34" rx="14" ry="5" />
      <path className="s" d="M24 8V34H38" />
    </>
  ),
  '3:V': (
    <>
      <path className="z" d="M10 12V36A14 5 0 0 0 38 36V12" />
      <ellipse cx="24" cy="12" rx="14" ry="5" />
      <path d="M10 12V36M38 12V36M10 36A14 5 0 0 0 38 36" />
      <path className="s" d="M10 36A14 5 0 0 1 38 36" />
    </>
  ),
  '3:VI': (
    <>
      <circle className="z" cx="24" cy="24" r="15" />
      <ellipse className="s" cx="24" cy="24" rx="15" ry="5" />
      <T x={24} y={24} />
    </>
  ),
  '3:VII': (
    <>
      <path d="M8 12h32v28H8z" />
      <path className="z" d="M12 16V36A12 3.5 0 0 0 36 36V16" />
      <ellipse cx="24" cy="16" rx="12" ry="3.5" />
    </>
  ),
  '3:VIII': (
    <>
      <path d="M8 18h22v22H8zM8 18l10-8h22v22l-10 8M30 18l10-8" />
      <circle className="z" cx="22" cy="26" r="10" />
    </>
  ),

  /* ── №4. Начала теории вероятностей ── */
  '4:klassicheskaya': (
    <>
      {[0, 1, 2, 3].map((r) =>
        [0, 1, 2, 3].map((c) => (
          <circle
            key={`${r}${c}`}
            className={r * 4 + c < 5 ? 't' : undefined}
            cx={12 + c * 8}
            cy={12 + r * 8}
            r="2.4"
          />
        )),
      )}
    </>
  ),
  '4:kubiki': (
    <>
      <rect className="z" x="6" y="14" width="18" height="18" rx="4" />
      <rect
        className="z"
        x="24"
        y="20"
        width="18"
        height="18"
        rx="4"
        transform="rotate(10 33 29)"
      />
      <T x={11} y={19} />
      <T x={19} y={27} />
      <T x={33} y={29} />
    </>
  ),
  '4:monety': (
    <>
      <circle className="z" cx="24" cy="24" r="14" />
      <circle cx="24" cy="24" r="10" />
      <N x={24} y={27.5}>
        Р
      </N>
    </>
  ),
  '4:kruglyy-stol': (
    <>
      <circle className="z" cx="24" cy="24" r="10" />
      {[0, 60, 120, 180, 240, 300].map((g) => (
        <circle
          key={g}
          className={g === 0 ? 't' : undefined}
          cx={24 + 16 * Math.cos((g * Math.PI) / 180)}
          cy={24 + 16 * Math.sin((g * Math.PI) / 180)}
          r="2.6"
        />
      ))}
    </>
  ),
  '4:protivopolozhnye': (
    <>
      <rect className="z" x="6" y="10" width="36" height="28" rx="3" />
      <circle cx="20" cy="24" r="9" fill="#fff" />
      <N x={20} y={27.5}>
        A
      </N>
      <N x={34} y={20}>
        Ā
      </N>
    </>
  ),
  '4:geometricheskoe': (
    <>
      <rect x="8" y="8" width="32" height="32" rx="2" />
      <path className="z" d="M8 40L40 8V40Z" />
      <T x={30} y={30} />
    </>
  ),
  '4:statisticheskoe': stolbiki([10, 22, 30, 18]),

  /* ── №5. Вероятности сложных событий ── */
  '5:nesovmestnye': krugi(14, 34, false),
  '5:protivopolozhnoe': (
    <>
      <rect className="z" x="6" y="10" width="36" height="28" rx="3" />
      <circle cx="24" cy="24" r="9" fill="#fff" />
    </>
  ),
  '5:koordinatnaya': (
    <>
      <path d="M4 26h40M44 26l-4-3M44 26l-4 3" />
      <path className="a" d="M14 22h16v8H14z" />
      <T x={14} y={26} />
      <T x={30} y={26} />
    </>
  ),
  '5:sovmestnye': krugi(18, 30, true),
  '5:uslovnaya': (
    <>
      {krugi(18, 30, true)}
      <circle cx="30" cy="24" r="11" strokeWidth="2.6" />
    </>
  ),
  '5:nezavisimye': (
    <>
      <circle className="z" cx="12" cy="24" r="7" />
      <circle className="z" cx="36" cy="24" r="7" />
      <path d="M21 20l6 8M27 20l-6 8" />
    </>
  ),
  '5:hotya-by': (
    <>
      <circle cx="12" cy="24" r="5" />
      <circle className="t" cx="24" cy="24" r="5" />
      <circle cx="36" cy="24" r="5" />
      <path d="M8 36h32" className="s" />
    </>
  ),
  '5:dva-predmeta': (
    <>
      <path className="z" d="M12 14h24l-3 24H15z" />
      <circle className="t" cx="20" cy="30" r="3" />
      <circle cx="28" cy="27" r="3" />
      <path d="M26 10l6-6M32 4v5M32 4h-5" />
    </>
  ),
  '5:polnaya': (
    <>
      <path d="M8 24L22 12M8 24L22 36M22 12L38 8M22 12L38 18M22 36L38 30M22 36L38 40" />
      <T x={8} y={24} />
      <T x={22} y={12} />
      <T x={22} y={36} />
    </>
  ),
  '5:do-uspeha': (
    <>
      <path d="M6 24h30" className="s" />
      <circle cx="8" cy="24" r="3" />
      <circle cx="18" cy="24" r="3" />
      <circle cx="28" cy="24" r="3" />
      <circle className="z" cx="39" cy="24" r="5" />
      <path d="M36.5 24l2 2 3-4" />
    </>
  ),

  /* ── №6. Случайные величины ── */
  '6:I': (
    <>
      <rect x="4" y="10" width="40" height="28" rx="3" />
      {krugi(19, 29, true)}
    </>
  ),
  '6:II': (
    <>
      <circle className="z" cx="22" cy="24" r="15" />
      <circle className="a" cx="27" cy="27" r="7" />
    </>
  ),
  '6:III': (
    <>
      {stolbiki([10, 22, 30, 18])}
      <path className="s" d="M24 6v36" />
    </>
  ),
  '6:IV': (
    <>
      <path d="M4 38h40" />
      {kolokol(false)}
      <path className="a" d="M30 25C32 34 36 38 42 38H30z" />
    </>
  ),
  '6:V': (
    <>
      <path d="M4 38h40" />
      {kolokol(true)}
      <path d="M14 28h20M14 28l3-2M14 28l3 2M34 28l-3-2M34 28l-3 2" />
    </>
  ),

  /* ── №7. Простейшие уравнения ── */
  '7:I': (
    <>
      <Osi />
      <path d="M8 40L40 10" />
      <T x={20} y={28.8} />
    </>
  ),
  '7:II': (
    <>
      <Osi />
      <path d="M12 38c0-14 10-22 28-24" />
      <path className="s" d="M8 22h34" />
      <T x={17} y={22} />
    </>
  ),
  '7:III': (
    <>
      <Osi />
      <path d="M8 36c14 0 24-4 32-28" />
      <path className="s" d="M8 22h34" />
      <T x={33} y={22} />
    </>
  ),
  '7:IV': (
    <>
      <Osi />
      <path d="M12 42c2-18 8-24 28-28" />
      <path className="s" d="M8 24h34" />
      <T x={19} y={24} />
    </>
  ),
  '7:V': (
    <>
      <path d="M4 24h40" />
      <path d="M4 24c4-12 8-12 12 0s8 12 12 0 8-12 12 0" />
      <T x={16} y={24} />
      <T x={28} y={24} />
    </>
  ),

  /* ── №8. Вычисления и преобразования ── */
  '8:I': (
    <>
      <path d="M6 28l4-2 5 10 7-24h20" />
      <N x={33} y={30} k={13}>
        aⁿ
      </N>
    </>
  ),
  '8:II': (
    <N x={24} y={30} k={15}>
      log
    </N>
  ),
  '8:III': (
    <>
      <path d="M4 24h40M24 4v40" />
      <circle cx="24" cy="24" r="14" />
      <path className="z" d="M24 24H38A14 14 0 0 0 24 10Z" />
    </>
  ),
  '8:IV': (
    <>
      <path d="M4 24h40M24 4v40" />
      <circle cx="24" cy="24" r="14" />
      <path d="M24 24L34 14" />
      <path className="z" d="M24 24h6a6 6 0 0 0-1.8-4.2Z" />
      <T x={34} y={14} />
    </>
  ),
  '8:V': (
    <N x={24} y={30} k={14}>
      a+b
    </N>
  ),

  /* ── №9. Производная и первообразная ── */
  '9:I': (
    <>
      <Osi />
      <path d="M10 38c10-2 18-12 30-30" />
      <path d="M24 30l10-12M34 18h-5M34 18v5" />
      <T x={24} y={30} />
    </>
  ),
  '9:II': (
    <>
      <Osi />
      <path d="M12 36c8-22 18-26 28-26" />
      <path d="M8 34L40 14" className="s" />
      <T x={20} y={24.5} />
    </>
  ),
  '9:III': (
    <>
      <Osi />
      <path d="M10 34c6-28 14-28 18-10s8 14 12 0" />
      <T x={20} y={14} />
    </>
  ),
  '9:IV': (
    <>
      <Osi />
      <path d="M10 14c8 0 10 30 18 30" className="s" />
      <path d="M8 26h34" />
      <path d="M12 16c6 0 10 20 28 20" />
      <T x={22} y={26} />
    </>
  ),
  '9:V': (
    <>
      <Osi />
      <path className="z" d="M16 38V26c6-10 14-10 20-14V38Z" />
      <path d="M10 30c8-8 18-12 30-20" />
    </>
  ),

  /* ── №10. Прикладные задачи ── */
  '10:I': (
    <>
      <path d="M6 36h36M24 36V30M10 30h28" />
      <path className="z" d="M10 30l-4-8h10zM38 30l4-8H32z" />
      <T x={24} y={30} />
    </>
  ),
  '10:II': (
    <>
      <path d="M4 40h40" />
      <path className="s" d="M8 40c6-36 26-36 32 0" />
      <circle className="z" cx="16" cy="18" r="3.5" />
    </>
  ),
  '10:III': (
    <>
      <Osi />
      <path d="M10 38c0-14 10-24 30-26" />
      <N x={32} y={34}>
        √
      </N>
    </>
  ),
  '10:IV': (
    <>
      <Osi />
      <path d="M10 10c6 20 14 26 30 26" />
      <T x={20} y={27} />
    </>
  ),
  '10:V': (
    <>
      <path d="M24 6v4" />
      <path d="M24 10L14 32" />
      <circle className="z" cx="14" cy="34" r="4" />
      <path className="s" d="M10 36c8 4 20 4 28 0" />
    </>
  ),

  /* ── №11. Текстовые задачи ── */
  '11:PR': (
    <N x={24} y={32} k={22}>
      %
    </N>
  ),
  '11:SM': (
    <>
      <path d="M16 6v12L8 38h32L32 18V6" />
      <path className="z" d="M11 31h26l3 7H8z" />
      <path d="M14 6h20" />
    </>
  ),
  '11:DP': (
    <>
      <path d="M4 34h40" />
      <rect className="z" x="6" y="24" width="12" height="8" rx="2" />
      <rect className="z" x="30" y="24" width="12" height="8" rx="2" />
      <path d="M20 18h8M28 18l-3-2M28 18l-3 2M28 14h-8M20 14l3-2M20 14l3 2" />
    </>
  ),
  '11:PT': (
    <>
      <path d="M4 34h40" />
      <rect className="z" x="8" y="22" width="22" height="10" rx="2" />
      <path d="M8 18h22M8 16v4M30 16v4" />
      <circle cx="13" cy="34" r="2" />
      <circle cx="25" cy="34" r="2" />
    </>
  ),
  '11:VD': (
    <>
      <path className="z" d="M10 26h28l-5 8H15z" />
      <path d="M24 26V12l8 10h-8" />
      <path d="M4 38c4-3 8-3 12 0s8 3 12 0 8-3 12 0" />
    </>
  ),
  '11:OK': (
    <>
      <circle cx="24" cy="24" r="15" />
      <circle cx="24" cy="24" r="10" className="s" />
      <circle className="z" cx="39" cy="24" r="3" />
      <path d="M36 12l3-1-1 3" />
    </>
  ),
  '11:RB': (
    <>
      <path d="M6 10h12v6M42 10H30v6" />
      <path className="z" d="M10 28h28v12H10z" />
      <path d="M10 18h28v22H10z" />
      <path className="s" d="M18 16v10M30 16v10" />
    </>
  ),
  '11:PG': (
    <>
      <path className="z" d="M6 40V34h8v-6h8v-6h8v-6h8v24z" />
      <T x={10} y={34} />
      <T x={18} y={28} />
      <T x={26} y={22} />
      <T x={34} y={16} />
    </>
  ),

  /* ── №12. Графики функций ── */
  '12:linear': (
    <>
      <Osi />
      <path d="M8 40L40 10" />
      <T x={18} y={30.6} />
    </>
  ),
  '12:quadratic': (
    <>
      <Osi />
      <path d="M12 8c4 30 20 30 26 0" />
      <T x={25} y={30} />
    </>
  ),
  '12:rational': (
    <>
      <Osi />
      <path d="M14 8c0 14 4 18 28 18" />
      <path d="M6 30c10 0 14 4 14 12" className="s" />
    </>
  ),
  '12:irrational': (
    <>
      <Osi />
      <path d="M14 38c0-12 8-22 28-24" />
      <T x={14} y={38} />
    </>
  ),
  '12:exponential': (
    <>
      <Osi />
      <path d="M6 36c16 0 26-6 34-28" />
    </>
  ),
  '12:logarithmic': (
    <>
      <Osi />
      <path d="M12 42c2-18 8-24 30-28" />
    </>
  ),
  '12:trigonometric': (
    <>
      <path d="M4 24h40M10 8v32" />
      <path d="M4 24c4-12 8-12 12 0s8 12 12 0 8-12 12 0" />
    </>
  ),

  /* ── №13. Экономические задачи ── */
  '13:A': stolbiki([30, 26, 22, 18]),
  '13:B': stolbiki([30, 26, 12, 22], 2),
  '13:C': stolbiki([22, 22, 22, 22]),
  '13:D': (
    <>
      {stolbiki([10, 16, 22, 30])}
      <circle className="a" cx="38" cy="8" r="4" />
    </>
  ),
};
