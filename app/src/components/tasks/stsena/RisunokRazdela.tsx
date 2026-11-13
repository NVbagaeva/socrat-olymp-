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

/** №7 и №14 — уравнения: чаши весов в равновесии. */
const uravnenie: Motiv = () => (
  <>
    <path className={tonk} d="M60 34v62M34 106h52" />
    <path className={sin} d="M20 48h80" />
    <circle className={tepl} cx="60" cy="34" r="4" />
    <path className={stek} d="M8 48h24l-12 26z" />
    <path className={sin} d="M8 48h24l-12 26z" />
    <path className={stek} d="M88 48h24l-12 26z" />
    <path className={tepl} d="M88 48h24l-12 26z" />
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
    <path className={tonk} d="M16 106h88M22 112V34" />
    <path className={sin} d="M24 96c20 0 20-52 40-52s16 46 36 46" />
    <path className={tepl} d="M30 78h60" />
    <circle className={tepl} cx="60" cy="78" r="4" />
  </>
);

/** №10 — физический смысл: парабола пути со стрелкой движения. */
const fizika: Motiv = () => (
  <>
    <path className={tonk} d="M16 106h88M22 112V34" />
    <path className={sin} d="M26 104c14-54 54-54 72 0" />
    <path className={tepl} d="M44 62h28" />
    <path className={tepl} d="m66 56 8 6-8 6" />
    <circle className={tepl} cx="62" cy="48" r="4" />
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
  /** Номер задания без ведущего нуля: '2', '11', '19'. */
  no: string;
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
  const motiv = MOTIVY[no] ?? plitka;
  return (
    <div className={clsx('rsz', className)}>
      <svg
        className="rsz__holst"
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={label}
        focusable="false"
      >
        {motiv(no)}
      </svg>
    </div>
  );
}
