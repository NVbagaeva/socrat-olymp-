/**
 * Минимум линейной алгебры для сцены заставки: векторы-тройки и
 * матрицы 4×4 по столбцам (как ждёт WebGL). Своя мелочь вместо
 * библиотеки — нужно десяток функций.
 */

export type Vec3 = [number, number, number];
export type Mat4 = Float32Array;

export const add = (a: Vec3, b: Vec3): Vec3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
export const sub = (a: Vec3, b: Vec3): Vec3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
export const scale = (a: Vec3, k: number): Vec3 => [a[0] * k, a[1] * k, a[2] * k];
export const dot = (a: Vec3, b: Vec3): number => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
export const cross = (a: Vec3, b: Vec3): Vec3 => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];
export const length = (a: Vec3): number => Math.hypot(a[0], a[1], a[2]);
export const normalize = (a: Vec3): Vec3 => scale(a, 1 / (length(a) || 1));
/** a + b·k */
export const madd = (a: Vec3, b: Vec3, k: number): Vec3 => [
  a[0] + b[0] * k,
  a[1] + b[1] * k,
  a[2] + b[2] * k,
];

export function identity(): Mat4 {
  const m = new Float32Array(16);
  m[0] = m[5] = m[10] = m[15] = 1;
  return m;
}

export function multiply(a: Mat4, b: Mat4): Mat4 {
  const out = new Float32Array(16);
  for (let c = 0; c < 4; c += 1) {
    for (let r = 0; r < 4; r += 1) {
      let s = 0;
      for (let k = 0; k < 4; k += 1) s += a[k * 4 + r]! * b[c * 4 + k]!;
      out[c * 4 + r] = s;
    }
  }
  return out;
}

/** Матрица из базиса (столбцы x, y, z) и сдвига. */
export function basis(x: Vec3, y: Vec3, z: Vec3, t: Vec3 = [0, 0, 0]): Mat4 {
  // prettier-ignore
  return new Float32Array([
    x[0], x[1], x[2], 0,
    y[0], y[1], y[2], 0,
    z[0], z[1], z[2], 0,
    t[0], t[1], t[2], 1,
  ]);
}

export function translation(t: Vec3): Mat4 {
  return basis([1, 0, 0], [0, 1, 0], [0, 0, 1], t);
}

export function uniformScale(k: number): Mat4 {
  return basis([k, 0, 0], [0, k, 0], [0, 0, k]);
}

/** Поворот вокруг вертикали: +Z (к камере) уходит к +X. */
export function rotationY(a: number): Mat4 {
  const c = Math.cos(a);
  const s = Math.sin(a);
  return basis([c, 0, -s], [0, 1, 0], [s, 0, c]);
}

/** Поворот вокруг оси X: +Y наклоняется к +Z. */
export function rotationX(a: number): Mat4 {
  const c = Math.cos(a);
  const s = Math.sin(a);
  return basis([1, 0, 0], [0, c, s], [0, -s, c]);
}

export function transformPoint(m: Mat4, p: Vec3): Vec3 {
  return [
    m[0]! * p[0] + m[4]! * p[1] + m[8]! * p[2] + m[12]!,
    m[1]! * p[0] + m[5]! * p[1] + m[9]! * p[2] + m[13]!,
    m[2]! * p[0] + m[6]! * p[1] + m[10]! * p[2] + m[14]!,
  ];
}

/** Перспектива; shiftX/shiftY — сдвиг картинки в координатах NDC. */
export function perspective(
  fovY: number,
  aspect: number,
  near: number,
  far: number,
  shiftX = 0,
  shiftY = 0,
): Mat4 {
  const f = 1 / Math.tan(fovY / 2);
  const nf = 1 / (near - far);
  const m = new Float32Array(16);
  m[0] = f / aspect;
  m[5] = f;
  /* Сдвиг объектива: x_ndc += shiftX при любой глубине. */
  m[8] = -shiftX;
  m[9] = -shiftY;
  m[10] = (far + near) * nf;
  m[11] = -1;
  m[14] = 2 * far * near * nf;
  return m;
}

export function lookAt(eye: Vec3, target: Vec3, up: Vec3): Mat4 {
  const z = normalize(sub(eye, target));
  const x = normalize(cross(up, z));
  const y = cross(z, x);
  // prettier-ignore
  return new Float32Array([
    x[0], y[0], z[0], 0,
    x[1], y[1], z[1], 0,
    x[2], y[2], z[2], 0,
    -dot(x, eye), -dot(y, eye), -dot(z, eye), 1,
  ]);
}

/** Точка мира → NDC (x, y) и глубина по оси взгляда. */
export function project(viewProj: Mat4, p: Vec3): [number, number, number] {
  const x = viewProj[0]! * p[0] + viewProj[4]! * p[1] + viewProj[8]! * p[2] + viewProj[12]!;
  const y = viewProj[1]! * p[0] + viewProj[5]! * p[1] + viewProj[9]! * p[2] + viewProj[13]!;
  const w = viewProj[3]! * p[0] + viewProj[7]! * p[1] + viewProj[11]! * p[2] + viewProj[15]!;
  return [x / w, y / w, w];
}
