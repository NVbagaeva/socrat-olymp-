/**
 * Чертежи задания №3: сценарий → сцена → кадр → SVG.
 *
 *   scenariy.ts  — формат сценария (JSON), имена точек;
 *   geometriya.ts — тела: призмы, пирамиды, тетраэдр, составные;
 *   postroit.ts  — сценарий в пространстве: точки, элементы, тело ядра;
 *   kadr.ts      — кадр при данном ракурсе: видимость, подписи, подсветка;
 *   svg.ts       — кадр строкой SVG (лист, предпросмотр, первый кадр);
 *   validator.ts — проверка сценария.
 *
 * Видимость, проекция и раскладка подписей — в общем ядре lib/stereo,
 * на нём же работает чертёж задания №15.
 */

import { type Kadr, kadr } from './kadr';
import { postroit } from './postroit';
import { type Scenariy, imyaTex as imyaTexLocal } from './scenariy';
import { ED_PT_EKRAN, OFORMLENIE, kadrSvg } from './svg';

export * from './scenariy';
export { postroit, type Scena3 } from './postroit';
export { kadr, ocenkaRazmera, type Kadr, type OpciiKadra, type PodpisKadra } from './kadr';
export { ED_PT_EKRAN, OFORMLENIE, kadrSvg, stilLinii, texSvg } from './svg';
export { KAMERY, PRAVILA, metrikiVida, sVidom, vybratVid, type Metriki } from './vid';

export type Rezhim = 'uchenik' | 'uchitel';

export interface OpciiChertezha {
  /** Ученик — без вспомогательных построений; учитель — с ними. */
  rezhim: Rezhim;
  shirina?: number;
  kegl?: number;
  podsvetka?: readonly string[];
  tsveta?: 'tokeny' | 'fiks';
  katex?: (tex: string) => string;
  klass?: string;
  /**
   * Ширина рисунка на бумаге, мм: толщины и кегль считаются в pt под
   * неё (svg.ts, OFORMLENIE). Нет — рисунок для экрана, единица — пиксель.
   */
  pechatMm?: number;
}

/** Единиц рисунка шириной shirina в одном pt при ширине на бумаге mm. */
export function edPtPechati(shirina: number, mm: number): number {
  return (shirina / mm) * (25.4 / 72);
}

/** Статичный SVG по сценарию: лист ученика или учителя, предпросмотр. */
export function chertezhSvg(sc: Scenariy, o: OpciiChertezha): string {
  const shirina = o.shirina ?? 320;
  const edPt = o.pechatMm === undefined ? ED_PT_EKRAN : edPtPechati(shirina, o.pechatMm);
  /* Кегль — не меньше 10 pt на бумаге. */
  const kegl = Math.max(o.kegl ?? 15, Math.ceil(OFORMLENIE.kegl * edPt * 10) / 10);
  const k: Kadr = kadr(postroit(sc), {
    vspom: o.rezhim === 'uchitel',
    shirina,
    kegl,
    podsvetka: o.podsvetka ?? null,
  });
  return kadrSvg(k, {
    kegl,
    edPt,
    tsveta: o.tsveta,
    katex: o.katex,
    alt: sc.alt,
    klass: o.klass,
  });
}
export { validirovat, chisloPodpisi, chislaUsloviya, type KontekstProverki } from './validator';

/** Все TeX-подписи сценария: их верстают KaTeX на сборке. */
export function tekstyPodpisey(sc: Scenariy): string[] {
  const s = new Set<string>();
  sc.imena?.forEach((n) => n && s.add(imyaTexLocal(n)));
  sc.tochki?.forEach((t) => s.add(imyaTexLocal(t.imya)));
  sc.dannye?.forEach((d) => s.add(d.tekst));
  sc.elementy?.forEach((e) => e.podpis && s.add(e.podpis));
  return [...s];
}

/**
 * Сценарий для браузера: числа округлены до 4 знаков — чертежу
 * точнее не нужно, а JSON вдвое короче.
 */
export function szhat(sc: Scenariy): Scenariy {
  return JSON.parse(
    JSON.stringify(sc, (_k, v: unknown) => (typeof v === 'number' ? Math.round(v * 1e4) / 1e4 : v)),
  ) as Scenariy;
}
