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
 *   • pechat — чёрно-белая для печати (по умолчанию на листах и в PDF):
 *     всё чёрное, БЕЗ ЗАЛИВОК — ни фигур, ни данных площадей, ни
 *     секторов углов. Углы — только дугами (одна, две, три), равенства —
 *     засечками. Искомая площадь — штриховка 45° и толстый контур.
 *
 * Толщины — в пикселях экрана (vector-effect: non-scaling-stroke): при
 * любом масштабе SVG линии одинаковые, на телефоне чертёж не
 * «волосяной». На бумаге 1 px = 0,75 pt: контур 1,2 pt = 1,6 px, части
 * 2 pt ≈ 2,67 px.
 *
 * Цвета (вторая редакция): контуры — navy; вершины и точки — синие,
 * полужирный курсив, крупнее; величины — тёплые: числа и первая
 * переменная (x, a) — терракота, вторая (y, b) — янтарь; угол — дуга,
 * сектор и подпись одним цветом.
 *
 * Цвет линии — только у смысловых связей:
 *   • части через переменные (part-x, part-y) — отрезок цветом своей
 *     семьи. Отрезок с конкретным числом (AB = 15, хорда) — navy,
 *     цветная только подпись;
 *   • равные отрезки — всегда одного цвета и с одинаковыми засечками
 *     (засечки — цвета отрезка). Равный отрезок на стороне — сторона
 *     разбита в точке, участок красится как его равный.
 * Проверка — scripts/verify_schemes/geometriya.mjs.
 *
 * Заливки (третья редакция): одна область — одна заливка, все
 * НЕПРОЗРАЧНЫЕ (тон заранее смешан с белым) — наложений полупрозрачных
 * слоёв нет; большая заливка ниже, меньшая поверх (lib/skhemy/ekran.ts).
 *   • основная фигura (figure) — светлый голубой тон сайта; если
 *     многоугольника нет — заливается круг;
 *   • «дано» (region, площадь известна) — светлый тёплый тон;
 *   • «найти» (region-sought) — насыщенный оранжевый тон поверх всех
 *     заливок и толстый сплошной контур терракотой поверх сторон (без
 *     пунктира: пунктир — только у вспомогательных построений).
 * Подписи площадей — под чертежом (ekran.ts, podpisiPloshchadey).
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

/**
 * Величины (числа, «S = ?», углы): не мельче букв вершин — на листе A4
 * в две колонки читаются так же. Раскладка (ekran.ts, SK.keglVel)
 * считает ширины записей этим кеглем.
 */
export const KEGL_VELICHINY = 19;

/** Заливки: непрозрачные тона (цвет, смешанный с белым). */
export const TEMA_ZALIVKI = {
  /** Основная фигура: светлый голубой тон сайта. */
  figura: '#EAF1FC',
  /** Данная площадь: светлый тёплый тон. */
  dano: '#FCEBDD',
  /** Искомая площадь: насыщенный оранжевый тон. */
  iskomaya: '#F6BC8C',
  /** Сектор угла. */
  ugol: '#F9D6BB',
} as const;

/** Узор штриховки 45° для искомой площади в ч/б: шаг 6 px. */
export function uzorShtrihovki(id: string): string {
  return `<pattern id="${id}" patternUnits="userSpaceOnUse" width="6" height="6" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="6" stroke="#000" stroke-width="1.1"/></pattern>`;
}

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
  const z = TEMA_ZALIVKI;
  const e = TEMA_TOLSHCHINY.ekran;
  const p = TEMA_TOLSHCHINY.pechat;
  const S = '.skh--tema';
  const P = '.skh--tema.skh--pechat';
  return [
    `${S}{--t-navy:${c.navy};--t-v:var(--chertezh-vershina,${c.vershina});--t-x:var(--chertezh-velichina,${c.velichina});--t-y:var(--chertezh-velichina-2,${c.velichina2});--t-post:${c.postroenie};--t-z-fig:var(--chertezh-zalivka,${z.figura});--t-z-dano:var(--chertezh-zalivka-dano,${z.dano});--t-z-isk:var(--chertezh-zalivka-iskomaya,${z.iskomaya});--t-z-ugol:${z.ugol}}`,
    `${P}{--t-navy:#000;--t-v:#000;--t-x:#000;--t-y:#000;--t-post:#000}`,
    /* Толщины в пикселях экрана при любом масштабе SVG. */
    `${S} line,${S} path,${S} circle,${S} polygon{vector-effect:non-scaling-stroke}`,
    `${S} line,${S} path{stroke-linecap:round;stroke-linejoin:round}`,
    /* Линии без роли и засечки — navy (контур). */
    `${S} .skh-liniya line,${S} .skh-okr,${S} .skh-ugol{stroke:var(--t-navy)}`,
    `${S} .skh-shtrih{stroke:var(--t-navy);stroke-width:${e.shtrih}px}`,
    /* figure: контур navy, заливка — светлый голубой тон (непрозрачный). */
    `${S} .skh-r-figure line,${S} .skh-okr.skh-r-figure{stroke:var(--t-navy);stroke-width:${e.kontur}px}`,
    `${S} .skh-mnog.skh-r-figure,${S} .skh-zalivka-okr{fill:var(--t-z-fig);stroke:none}`,
    /* region: площадь дана — светлый тёплый тон. */
    `${S} .skh-mnog.skh-r-region{fill:var(--t-z-dano)}`,
    /* region-sought: площадь ищется — оранжевый тон и толстый сплошной контур поверх сторон. */
    `${S} .skh-mnog.skh-r-region-sought{fill:var(--t-z-isk)}`,
    `${S} .skh-kontur-isk{fill:none;stroke:var(--t-x);stroke-width:${e.chast}px;stroke-linejoin:round}`,
    `${S} .skh-shtrihovka{display:none}`,
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
    `${S} .skh-sektor.skh-r-angle{fill:var(--t-z-ugol)}`,
    /* Точки — синие, белая обводка: точка не тонет в цветной линии. */
    `${S} .skh-tochka,${S} .skh-tochka.is-lit{fill:var(--t-v);stroke:#fff;stroke-width:1px}`,
    /* Подписи вершин — синий полужирный курсив, на 12 % крупнее; не перекрашиваются подсветкой. */
    `${S} .skh-podpis,${S} .skh-podpis.is-lit{fill:var(--t-v);font-weight:700;font-size:${KEGL_VERSHINY}px}`,
    /* Величины — тёплые: первая переменная и числа — терракота, вторая — янтарь. */
    `${S} .skh-velichina,${S} .skh-velichina.is-lit{fill:var(--t-x);font-weight:400;font-size:${KEGL_VELICHINY}px}`,
    `${S} .skh-velichina.skh-r-part-y{fill:var(--t-y)}`,
    `${S} .skh-koren{stroke:var(--t-x)}`,
    `${S} .skh-koren.skh-r-part-y{stroke:var(--t-y)}`,
    /* Печать: без заливок — ни фигур, ни данных площадей, ни секторов
       углов, ни подсветки. Искомая площадь — штриховка 45° и толстый контур. */
    `${P} .skh-mnog:not(.skh-r-region),${P} .skh-sektor,${P} .skh-zalivka-okr{display:none}`,
    /* Данная площадь внутри искомой — белая поверх штриховки: «вычитается»
       из искомой, как в цвете; на белом листе её не видно. */
    `${P} .skh-mnog.skh-r-region{fill:#fff}`,
    `${P} .skh-shtrihovka{display:inline;stroke:none}`,
    `${P} .skh-kontur-isk{stroke-width:${p.chast}px}`,
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
