/**
 * Обложка раздела, нарисованная кодом: простая сцена в палитре сайта на
 * месте фотографии. Ставится там, где у раздела нет своей картинки.
 *
 * Мотив — предмет самого раздела: у векторов стрелки, у неравенства
 * числовая прямая, у производной касательная. Это знак раздела, а не
 * иллюстрация задачи: цифр и условий здесь нет, и выдумывать их нечем.
 *
 * Свечение и тень за обложкой даёт карточка шапки (stsena.css), поэтому
 * фон у рисунка прозрачный, как у куба №3.
 */

import { clsx } from 'clsx';
import type { ReactNode } from 'react';
import './risunok.css';

/** Холст общий у всех мотивов: тот же вытянутый кадр, что у куба №3. */
const W = 120;
const H = 130;

type Motiv = (key: string) => ReactNode;

/* Линии: синяя основа и тёплая засечка — как рёбра куба №3. */
const sin = 'rsz-sin';
const tepl = 'rsz-tepl';
const tonk = 'rsz-tonk';
const stek = 'rsz-stek';

/** №1 и №18 — планиметрия: треугольник с высотой и дугой угла. */
const planimetriya: Motiv = () => (
  <>
    <path className={stek} d="M18 104h84L60 26z" />
    <path className={sin} d="M18 104h84L60 26z" />
    <path className={tonk} d="M60 26v78" />
    <path className={tepl} d="M60 104h12M72 104v-12" />
    <circle className={tepl} cx="60" cy="26" r="3.5" />
  </>
);

/** №2 — векторы: две стрелки из одной точки и их сумма. */
const vektory: Motiv = () => (
  <>
    <path className={stek} d="M22 100 96 100 60 34z" />
    <path className={sin} d="M22 100h58" />
    <path className={sin} d="m72 93 10 7-10 7" />
    <path className={sin} d="M22 100 62 38" />
    <path className={sin} d="m55 40 8-5 1 9" />
    <path className={tepl} d="M22 100 96 46" />
    <path className={tepl} d="m87 44 10-1-4 9" />
    <circle className={tepl} cx="22" cy="100" r="3.5" />
  </>
);

/** №4 и №5 — вероятность: кость и монета. */
const veroyatnost: Motiv = () => (
  <>
    <rect className={stek} x="16" y="46" width="60" height="60" rx="12" />
    <rect className={sin} x="16" y="46" width="60" height="60" rx="12" />
    <circle className={sin} cx="33" cy="63" r="4" />
    <circle className={sin} cx="59" cy="89" r="4" />
    <circle className={tepl} cx="46" cy="76" r="4" />
    <circle className={stek} cx="84" cy="44" r="22" />
    <circle className={tepl} cx="84" cy="44" r="22" />
    <path className={tonk} d="M84 32v24M78 38h12" />
  </>
);

/** №6 — случайные величины: столбики распределения. */
const raspredelenie: Motiv = () => (
  <>
    <path className={tonk} d="M16 106h88" />
    <rect className={stek} x="22" y="84" width="16" height="22" rx="4" />
    <rect className={sin} x="22" y="84" width="16" height="22" rx="4" />
    <rect className={stek} x="44" y="62" width="16" height="44" rx="4" />
    <rect className={sin} x="44" y="62" width="16" height="44" rx="4" />
    <rect className={stek} x="66" y="40" width="16" height="66" rx="4" />
    <rect className={tepl} x="66" y="40" width="16" height="66" rx="4" />
    <rect className={stek} x="88" y="72" width="16" height="34" rx="4" />
    <rect className={sin} x="88" y="72" width="16" height="34" rx="4" />
  </>
);

/** №7 и №14 — уравнения: равновесие двух выражений. */
const uravnenie: Motiv = () => (
  <>
    <circle cx="60" cy="65" r="48" fill="#fff" fillOpacity=".22" />
    <ellipse cx="60" cy="116" rx="31" ry="5" fill="#8eaddd" fillOpacity=".2" />

    {/* Опора: мягкие голубые плоскости и золотой шарнир. */}
    <path d="M60 44v59" stroke="#8eafe7" strokeWidth="5" strokeLinecap="round" />
    <path d="M50 103h20l8 12H42z" fill="#dce7fb" />
    <path d="M47 114h26" stroke="#356bc5" strokeWidth="7" strokeLinecap="round" />
    <path d="M60 33v11" stroke="#e9a351" strokeWidth="3" strokeLinecap="round" />
    <circle cx="60" cy="31" r="10" fill="#f1a047" />
    <circle cx="60" cy="31" r="4.5" fill="#fff8ee" />

    {/* Ровная перекладина и подвесы. */}
    <path d="M23 45h74" stroke="#2f68c7" strokeWidth="6" strokeLinecap="round" />
    <path d="M60 42H23" stroke="#2f68c7" strokeWidth="6" strokeLinecap="round" />
    <path d="M60 42h37" stroke="#e58645" strokeWidth="6" strokeLinecap="round" />
    <circle cx="60" cy="42" r="8" fill="#fff" stroke="#e58645" strokeWidth="4" />
    <path d="M32 48v15m56-15v15" stroke="#8eafe7" strokeWidth="2.5" strokeLinecap="round" />

    {/* Чаши с выражениями делают мотив узнаваемым, а не абстрактной схемой. */}
    <path
      d="M19 64h26l-4 13c-2 6-5 9-9 9s-7-3-9-9z"
      fill="#e7efff"
      stroke="#3971d1"
      strokeWidth="2.5"
      strokeLinejoin="round"
    />
    <path
      d="M75 64h26l-4 13c-2 6-5 9-9 9s-7-3-9-9z"
      fill="#fff0e3"
      stroke="#e58645"
      strokeWidth="2.5"
      strokeLinejoin="round"
    />
    <path d="M23 67h18" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
    <path d="M79 67h18" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
    <text x="32" y="77" textAnchor="middle" fontSize="7" fontWeight="700" fill="#2856a0">
      x + 3
    </text>
    <text x="88" y="77" textAnchor="middle" fontSize="8" fontWeight="700" fill="#a9552c">
      7
    </text>

    {/* Лёгкие искры добавляют рисунку живости. */}
    <path
      d="M17 36v7m-3.5-3.5h7M103 58v6m-3-3h6"
      stroke="#e9a351"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <circle cx="101" cy="30" r="2" fill="#3971d1" />
  </>
);

/** №8 — вычисления: дробь и корень. */
const vychisleniya: Motiv = () => (
  <>
    <rect className={stek} x="18" y="34" width="84" height="62" rx="14" />
    <rect className={sin} x="18" y="34" width="84" height="62" rx="14" />
    <path className={sin} d="M34 65h30" />
    <path className={tonk} d="M40 48h18M40 82h18" />
    <path className={tepl} d="m74 66 5 10 11-26" />
    <path className={tonk} d="M90 50h10" />
  </>
);

/** №9 — производная: касательная к кривой. */
const proizvodnaya: Motiv = () => (
  <>
    <path d="M25 41h76M25 57h76M25 73h76M25 89h76" stroke="#8eafe7" strokeOpacity=".2" strokeWidth=".7" />
    <path d="M41 31v70M57 31v70M73 31v70M89 31v70" stroke="#8eafe7" strokeOpacity=".2" strokeWidth=".7" />
    <path className={tonk} d="M17 101h88M24 110V30" />
    <path d="m105 101-4-2v4zM24 30l-2 4h4z" fill="#8eafe7" />
    <path d="M24 89c13 0 19-8 26-22 5-11 8-24 18-27 12-4 18 11 22 25 4 14 8 25 17 25v9H24z" fill="url(#z9-curve-fill)" opacity=".62" />
    <defs>
      <linearGradient id="z9-curve-fill" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#3971d1" stopOpacity=".28" />
        <stop offset="1" stopColor="#3971d1" stopOpacity=".02" />
      </linearGradient>
    </defs>
    <path className={sin} strokeWidth="3.5" d="M24 89c13 0 19-8 26-22 5-11 8-24 18-27 12-4 18 11 22 25 4 14 8 25 17 25" />
    <path d="M68 40v61" stroke="#e58645" strokeOpacity=".62" strokeWidth="1.2" strokeDasharray="2.5 3" />
    <path className={tepl} strokeWidth="2.6" d="M48 47h40" />
    <circle cx="68" cy="47" r="5.6" fill="#fff8ee" stroke="#e58645" strokeWidth="2.8" />
    <circle cx="68" cy="47" r="1.7" fill="#e58645" />
    <text x="71" y="108" fill="#2856a0" fontSize="6" fontStyle="italic">x₀</text>
    <text x="30" y="39" fill="#2856a0" fontSize="6" fontStyle="italic">y = f(x)</text>
  </>
);

/** №10 — физический смысл: траектория тела и вектор скорости. */
const fizika: Motiv = () => (
  <>
    {/* Мягкая подложка повторяет дугу полёта и отделяет её от осей. */}
    <ellipse cx="63" cy="112" rx="39" ry="5" fill="#8eaddd" fillOpacity=".18" />
    <path className={stek} d="M24 101c13-42 27-60 43-60s29 18 42 60z" />

    {/* Координатная сетка, оси со стрелками и деления времени. */}
    <path
      d="M38 50v52M53 43v59M80 43v59M95 50v52"
      stroke="#bfd3f4"
      strokeWidth="1"
      strokeDasharray="2 5"
    />
    <path className={tonk} d="M16 102h88m-4-4 4 4-4 4M22 110V28m-4 4 4-4 4 4" />
    <path
      d="M38 99v6m15-6v6m27-6v6m15-6v6"
      stroke="#8eafe7"
      strokeWidth="1.5"
      strokeLinecap="round"
    />

    {/* Траектория и пунктирная проекция положения на ось времени. */}
    <path className={sin} d="M24 101c13-42 27-60 43-60s29 18 42 60" />
    <path
      d="M67 47v53"
      stroke="#8eafe7"
      strokeWidth="1.7"
      strokeDasharray="3 4"
      strokeLinecap="round"
    />

    {/* Тело в полёте: стеклянный шар с тёплым бликом и вектор скорости. */}
    <circle cx="67" cy="41" r="10" fill="#e58645" fillOpacity=".14" />
    <path className={tepl} d="M67 41h22m-7-7 8 7-8 7" />
    <circle cx="67" cy="41" r="6" fill="#fff8ee" stroke="#e58645" strokeWidth="3" />
    <circle cx="65" cy="39" r="1.4" fill="#fff" />

    {/* Короткие подписи превращают знак в понятный график движения. */}
    <text x="13" y="27" fontSize="7" fontWeight="700" fill="#5579b8">
      s
    </text>
    <text x="106" y="108" fontSize="7" fontWeight="700" fill="#5579b8">
      t
    </text>
    <path
      d="M31 31v5m-2.5-2.5h5M98 39v4m-2-2h4"
      stroke="#e9a351"
      strokeWidth="1.8"
      strokeLinecap="round"
    />
  </>
);

/** №11 — текстовые задачи: две дорожки и встречное движение. */
const dvizhenie: Motiv = () => (
  <>
    <rect className={stek} x="14" y="48" width="92" height="20" rx="10" />
    <rect className={sin} x="14" y="48" width="92" height="20" rx="10" />
    <rect className={stek} x="14" y="80" width="92" height="20" rx="10" />
    <rect className={sin} x="14" y="80" width="92" height="20" rx="10" />
    <path className={tepl} d="M26 58h34m0 0-8-5m8 5-8 5" />
    <path className={tepl} d="M94 90H60m0 0 8-5m-8 5 8 5" />
  </>
);

/** №13 — финансовая грамотность: рост вклада и процент. */
const finansy: Motiv = () => (
  <>
    <path className={tonk} d="M16 106h88" />
    <rect className={stek} x="24" y="82" width="18" height="24" rx="5" />
    <rect className={sin} x="24" y="82" width="18" height="24" rx="5" />
    <rect className={stek} x="50" y="64" width="18" height="42" rx="5" />
    <rect className={sin} x="50" y="64" width="18" height="42" rx="5" />
    <rect className={stek} x="76" y="42" width="18" height="64" rx="5" />
    <rect className={tepl} x="76" y="42" width="18" height="64" rx="5" />
    <circle className={tepl} cx="34" cy="34" r="7" />
    <circle className={tepl} cx="58" cy="34" r="7" />
    <path className={tepl} d="m28 42 36-16" />
  </>
);

/** №15 — стереометрия части 2: призма. */
const prizma: Motiv = () => (
  <>
    <path className={stek} d="M24 96V46l36-16 36 16v50l-36 16z" />
    <path className={sin} d="M24 46 60 30l36 16-36 16z" />
    <path className={sin} d="M24 46v50l36 16V62z" />
    <path className={tepl} d="M96 46v50l-36 16V62z" />
    <path className={tonk} d="M60 62v50" />
  </>
);

/** №16 — неравенство: числовая прямая с промежутком. */
const neravenstvo: Motiv = () => (
  <>
    <path className={tonk} d="M12 70h96" />
    <path className={tepl} d="M38 70h44" />
    <circle className={sin} cx="38" cy="70" r="7" />
    <circle className={tepl} cx="82" cy="70" r="7" />
    <path className={tonk} d="M38 82v10M82 82v10" />
  </>
);

/** №17 — оптимизация: минимум кривой. */
const optimizatsiya: Motiv = () => (
  <>
    <path className={tonk} d="M16 106h88M22 112V34" />
    <path className={sin} d="M28 40c8 46 20 56 32 56s24-10 32-56" />
    <path className={tepl} d="M34 96h52" />
    <circle className={tepl} cx="60" cy="96" r="4" />
  </>
);

/** №19 — задача с параметром: семейство прямых через узел. */
const parametr: Motiv = () => (
  <>
    <path className={tonk} d="M16 70h88M60 114V26" />
    <path className={sin} d="M20 96 100 44" />
    <path className={sin} d="M20 44 100 96" />
    <path className={tepl} d="M26 108 94 32" />
    <circle className={tepl} cx="60" cy="70" r="5" />
  </>
);

/** Задание без своего мотива: стеклянная плитка с номером раздела. */
const plitka: Motiv = () => (
  <>
    <rect className={stek} x="20" y="30" width="80" height="80" rx="20" />
    <rect className={sin} x="20" y="30" width="80" height="80" rx="20" />
    <path className={tepl} d="M40 70h40" />
    <path className={tonk} d="M40 54h40M40 86h24" />
  </>
);

/** Мотив на каждый номер задания. Нет в списке — стеклянная плитка. */
const MOTIVY: Record<string, Motiv> = {
  '1': planimetriya,
  '2': vektory,
  '4': veroyatnost,
  '5': veroyatnost,
  '6': raspredelenie,
  '7': uravnenie,
  '8': vychisleniya,
  '9': proizvodnaya,
  '10': fizika,
  '11': dvizhenie,
  '13': finansy,
  '14': uravnenie,
  '15': prizma,
  '16': neravenstvo,
  '17': optimizatsiya,
  '18': planimetriya,
  '19': parametr,
};

export interface RisunokRazdelaProps {
  /**
   * Номер хранения раздела профиля — тот, что в адресе (slug): '2', '11',
   * '19'. Не номер ЕГЭ: после смены структуры экзамена они разошлись, и
   * №17 «Планиметрия» получал параболу «Наибольшего и наименьшего»
   * (docs/audit-prodazhi.md, E5). Не задан
   * или без своего мотива — общая стеклянная плитка. Номера базовой
   * математики сюда не подходят: за ними другие темы.
   */
  no?: string;
  /** Описание для скринридера: чем занят раздел. */
  label: string;
  className?: string;
}

/** Есть ли у номера свой мотив (а не общая плитка). */
export function estMotivRazdela(no: string): boolean {
  return MOTIVY[no] !== undefined;
}

/**
 * Нарисованная обложка раздела. Подставляется в слот media шапки
 * «Стеклянная сцена» вместо фотографии.
 */
export function RisunokRazdela({ no, label, className }: RisunokRazdelaProps) {
  const motiv = (no === undefined ? undefined : MOTIVY[no]) ?? plitka;
  return (
    <div className={clsx('rsz', className)}>
      <svg
        className="rsz__holst"
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={label}
        focusable="false"
      >
        {motiv(no ?? '')}
      </svg>
    </div>
  );
}
