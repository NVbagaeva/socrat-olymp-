import type { Model } from './model';
import { renderSolid } from './render';
import { vybratVidSolid } from './vid';

export { renderSolid };
export { metrikiSolid, szhatModel, vybratVidSolid, type MetrikiSolid } from './vid';

/** Чертёж банка №3: вид выбран по метрикам читаемости (vid.ts). */
export function chertezhBanka(model: Model): string {
  return renderSolid(vybratVidSolid(model).model);
}
export type {
  Body,
  Cone,
  Cylinder,
  Line,
  Mark,
  Measure,
  Model,
  Polyhedron,
  RightAngle,
  Section,
  Sphere,
} from './model';
export { CATALOG, type CatalogEntry } from './catalog';
export * as figures from './figures';
