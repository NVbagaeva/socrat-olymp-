/**
 * Тема чертежа движка схем: цвет и толщина элемента — по его смысловой
 * роли (Element.rol, lib/skhemy/tipy.ts), а не по шаблону. Шаблон только
 * помечает роли — все шаблоны (и будущие) получают одно оформление.
 *
 * Один источник: CSS темы собирается здесь и встраивается в SVG —
 * в живой чертёж (components/skhemy/ChertezhSkhemy.tsx) и в чертёж
 * строкой для листов (lib/skhemy/svg.ts). Две версии:
 *   • cvet — фирменные цвета сайта: на экране всегда, на листе — по
 *     переключателю «Цветные чертежи»;
 *   • pechat — монохромная для печати (по умолчанию на листах и в PDF):
 *     всё чёрное, площадь и угол — серой заливкой.
 *
 * Толщины — в пикселях экрана (vector-effect: non-scaling-stroke): при
 * любом масштабе SVG линии одинаковые, на телефоне чертёж не
 * «волосяной». На бумаге 1 px = 0,75 pt: контур 1,2 pt = 1,6 px, части
 * 2 pt ≈ 2,67 px.
 *
 * Цвета (вторая редакция): контуры — navy; вершины и точки — синие,
 * полужирный курсив, крупнее; величины — тёплые: числа и первая
 * переменная (x, a) — терракота, вторая (y, b) — янтарь; отрезок с
 * подписью — тем же цветом (part-x, part-y), угол — дуга, сектор и
 * подпись одним цветом. Синий на чертеже — только у вершин и точек.
 *
 * Доступность: цвет не единственный носитель смысла — все подписи на
 * месте; синий и тёплые различимы при дальтонизме. Контраст на белом:
 * синий 5,8 : 1, янтарь 4,9 : 1; терракота величин — 3,0 : 1 (цвет
 * задан явно; для текста это ниже 4,5 — см. стильгайд).
 */

/** Цвета темы: фирменные (на экране и в цветном PDF). */
export const TEMA_CVET = {
  /** Контуры фигур. */
  navy: '#0E2350',
  /** Вершины и точки — единственный синий на чертеже. */
  vershina: '#1F5FD0',
  /** Величины (числа и выражения), первая переменная (x, a), угол, площадь. */
  velichina: '#E07A2F',
  /** Вторая переменная (y, b): янтарь палитры сайта (--amber-700), 4,9 : 1. */
  velichina2: '#A85F06',
  /** Построения: серо-синий. */
  postroenie: '#6B7A99',
} as const;

/** Подписи вершин: на 12 % крупнее прежних 17 px, полужирный курсив. */
export const KEGL_VERSHINY = 19;

/** Толщины, px экрана. */
export const TEMA_TOLSHCHINY = {
  ekran: { kontur: 2.25, chast: 3.5, vspom: 1.75, postroenie: 1.25, shtrih: 2, ugol: 2 },
  /* Печать: контур 1,2 pt, части 2 pt, остальное — тоньше контура. */
  pechat: { kontur: 1.6, chast: 2.67, vspom: 1.2, postroenie: 1, shtrih: 1.33, ugol: 1.33 },
} as const;

export type VersiyaTemy = 'cvet' | 'pechat';

/**
 * CSS темы для чертежей внутри `.skh--tema` (класс корня SVG). Печать —
 * дополнительный класс `.skh--pechat`. Правила подсветки (is-lit) идут
 * после ролей: подсветка шагов разбора по-прежнему видна.
 *
 * Цвета берутся из токенов чертежей (--chertezh-*: styles/tokens.css и
 * темы листов lib/sheet/theme.css), запасное значение — фирменный цвет:
 * чертёж строкой вне сайта (файл, PDF) выглядит так же.
 */
export function cssTemy(): string {
  const c = TEMA_CVET;
  const e = TEMA_TOLSHCHINY.ekran;
  const p = TEMA_TOLSHCHINY.pechat;
  const S = '.skh--tema';
  const P = '.skh--tema.skh--pechat';
  return [
    `${S}{--t-navy:${c.navy};--t-v:var(--chertezh-vershina,${c.vershina});--t-x:var(--chertezh-velichina,${c.velichina});--t-y:var(--chertezh-velichina-2,${c.velichina2});--t-fig:${c.vershina};--t-fig-a:.07;--t-reg-a:.18;--t-post:${c.postroenie};--t-ugol-a:.2}`,
    `${P}{--t-navy:#000;--t-v:#000;--t-x:#000;--t-y:#000;--t-fig-a:0;--t-reg-a:.15;--t-post:#000;--t-ugol-a:.18}`,
    /* Толщины в пикселях экрана при любом масштабе SVG. */
    `${S} line,${S} path,${S} circle,${S} polygon{vector-effect:non-scaling-stroke}`,
    `${S} line,${S} path{stroke-linecap:round;stroke-linejoin:round}`,
    /* Линии без роли и засечки — navy (контур). */
    `${S} .skh-liniya line,${S} .skh-okr,${S} .skh-ugol{stroke:var(--t-navy)}`,
    `${S} .skh-shtrih{stroke:var(--t-navy);stroke-width:${e.shtrih}px}`,
    /* figure: контур navy и лёгкая заливка. */
    `${S} .skh-r-figure line,${S} .skh-okr.skh-r-figure{stroke:var(--t-navy);stroke-width:${e.kontur}px}`,
    `${S} .skh-mnog.skh-r-figure{fill:var(--t-fig);fill-opacity:var(--t-fig-a)}`,
    /* region: площадь дана или ищется — терракота, подпись тем же цветом. */
    `${S} .skh-mnog.skh-r-region{fill:var(--t-x);fill-opacity:var(--t-reg-a)}`,
    /* part-x — терракота, part-y — янтарь; засечки и подписи — того же цвета. */
    `${S} .skh-r-part-x line{stroke:var(--t-x);stroke-width:${e.chast}px}`,
    `${S} .skh-r-part-x .skh-shtrih{stroke:var(--t-x)}`,
    `${S} .skh-r-part-y line{stroke:var(--t-y);stroke-width:${e.chast}px}`,
    `${S} .skh-r-part-y .skh-shtrih{stroke:var(--t-y)}`,
    /* aux: вспомогательные отрезки и чевианы. */
    `${S} .skh-r-aux line,${S} .skh-okr.skh-r-aux{stroke:var(--t-navy);stroke-width:${e.vspom}px}`,
    /* construction: продолжения и построения — пунктир. */
    `${S} .skh-r-construction line,${S} .skh-okr.skh-r-construction{stroke:var(--t-post);stroke-width:${e.postroenie}px;stroke-dasharray:5 4}`,
    /* angle: дуга и сектор — цветом величин; подпись угла того же цвета. */
    `${S} .skh-ugol.skh-r-angle{stroke:var(--t-x);stroke-width:${e.ugol}px}`,
    `${S} .skh-sektor.skh-r-angle{fill:var(--t-x);fill-opacity:var(--t-ugol-a)}`,
    /* Точки — синие, белая обводка: точка не тонет в цветной линии. */
    `${S} .skh-tochka,${S} .skh-tochka.is-lit{fill:var(--t-v);stroke:#fff;stroke-width:1px}`,
    /* Подписи вершин — синий полужирный курсив, на 12 % крупнее; не перекрашиваются подсветкой. */
    `${S} .skh-podpis,${S} .skh-podpis.is-lit{fill:var(--t-v);font-weight:700;font-size:${KEGL_VERSHINY}px}`,
    /* Величины — тёплые: первая переменная и числа — терракота, вторая — янтарь. */
    `${S} .skh-velichina,${S} .skh-velichina.is-lit{fill:var(--t-x);font-weight:400}`,
    `${S} .skh-velichina.skh-r-part-y{fill:var(--t-y)}`,
    `${S} .skh-koren{stroke:var(--t-x)}`,
    `${S} .skh-koren.skh-r-part-y{stroke:var(--t-y)}`,
    /* Печать: толщины в pt. */
    `${P} .skh-shtrih{stroke-width:${p.shtrih}px}`,
    `${P} .skh-r-figure line,${P} .skh-okr.skh-r-figure{stroke-width:${p.kontur}px}`,
    `${P} .skh-r-part-x line,${P} .skh-r-part-y line{stroke-width:${p.chast}px}`,
    `${P} .skh-r-aux line,${P} .skh-okr.skh-r-aux{stroke-width:${p.vspom}px}`,
    `${P} .skh-r-construction line,${P} .skh-okr.skh-r-construction{stroke-width:${p.postroenie}px}`,
    `${P} .skh-ugol.skh-r-angle{stroke-width:${p.ugol}px}`,
    /* Подсветка шагов разбора — поверх ролей (линии, окружности, дуги углов). */
    `${S} .skh-liniya.is-lit line,${S} .skh-liniya.is-lit .skh-shtrih,${S} .skh-okr.is-lit,${S} .skh-ugol.is-lit{stroke:var(--skh-cvet,var(--t-x))}`,
  ].join('');
}

/** Классы корня SVG для чертежа в теме. */
export function klassTemy(versiya: VersiyaTemy): string {
  return versiya === 'pechat' ? 'skh--tema skh--pechat' : 'skh--tema';
}
