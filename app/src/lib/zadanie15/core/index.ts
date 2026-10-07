/**
 * Геометрическое ядро задания №15 (сечения многогранников).
 * Чистый TypeScript: без графики, без React, без float в решениях.
 */

export * from './rational';
export * from './surd';
export {
  type V3,
  type Line3,
  type Plane,
  v3,
  v3n,
  lineThrough as line3,
  planeThrough,
  intersectLines,
  intersectLinePlane,
  intersectPlanes,
  type PlanesMeet,
  samePlane,
  paramOn,
  coplanarLines,
  parallelLines,
  sameLine,
  onPlane,
  onLine,
  veq,
  toArray,
} from './vec';
export * from './polyhedron';
export * from './section';
export * from './measure';
export * from './construction';
