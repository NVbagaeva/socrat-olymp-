#!/usr/bin/env node
/* scripts/build-kotik.mjs — 3D-котик тренажёра окружности (№14), модель.

   Запуск: node scripts/build-kotik.mjs  →  public/models/kotik.glb

   Модель строится целиком скриптом, без внешних файлов и Blender:
   — формы — функции расстояния (SDF): сферы, эллипсоиды и капсулы,
     гладко слитые; поверхность — методом surface nets, нормали — по
     градиенту функции, поэтому формы мягкие и округлые;
   — части — отдельные меши: голова, уши, глаза, веки, нос, тело,
     передние лапы, хвост;
   — скелет: таз → позвоночник → грудь → шея → голова, хвост — 5 костей
     от таза. Тело и хвост — со скинингом; голова, уши, глаза, веки и
     нос — жёстко на кости головы, лапы — на кости груди;
   — веки — морф «закрыты» (моргание, прищур при поглаживании);
   — атрибут mekh (0…1, в файле _MEKH): где мех, где стекло; на теле — плавный
     переход по грудке и шее.

   Выход детерминирован: тот же скрипт — тот же файл (это проверяет
   scripts/check-kotik.mjs). */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as THREE from 'three';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';

const APP = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = process.argv[2] ?? path.join(APP, 'public/models/kotik.glb');

/* GLTFExporter в бинарном режиме читает Blob через FileReader. */
if (typeof globalThis.FileReader === 'undefined') {
  globalThis.FileReader = class {
    readAsArrayBuffer(blob) {
      blob.arrayBuffer().then((buf) => {
        this.result = buf;
        this.onloadend?.();
        this.onload?.({ target: this });
      });
    }
    readAsDataURL(blob) {
      blob.arrayBuffer().then((buf) => {
        this.result = `data:${blob.type || 'application/octet-stream'};base64,${Buffer.from(buf).toString('base64')}`;
        this.onloadend?.();
        this.onload?.({ target: this });
      });
    }
  };
}

/* ── SDF ─────────────────────────────────────────────────────────── */

const len = (x, y, z) => Math.sqrt(x * x + y * y + z * z);
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const smoothstep = (a, b, x) => {
  const t = clamp((x - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};

function sfera(p, c, r) {
  return len(p[0] - c[0], p[1] - c[1], p[2] - c[2]) - r;
}

/** Эллипсоид (приближённое расстояние, достаточно для сетки). */
function ellipsoid(p, c, r) {
  const x = (p[0] - c[0]) / r[0];
  const y = (p[1] - c[1]) / r[1];
  const z = (p[2] - c[2]) / r[2];
  const k0 = len(x, y, z);
  const k1 = len(x / r[0], y / r[1], z / r[2]);
  return k1 === 0 ? -Math.min(...r) : (k0 * (k0 - 1)) / k1;
}

/** Капсула с радиусом от ra к rb. */
function kapsula(p, a, b, ra, rb) {
  const pa = [p[0] - a[0], p[1] - a[1], p[2] - a[2]];
  const ba = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
  const h = clamp(
    (pa[0] * ba[0] + pa[1] * ba[1] + pa[2] * ba[2]) / (ba[0] ** 2 + ba[1] ** 2 + ba[2] ** 2),
    0,
    1,
  );
  return len(pa[0] - ba[0] * h, pa[1] - ba[1] * h, pa[2] - ba[2] * h) - (ra + (rb - ra) * h);
}

/** Гладкое объединение. */
function smin(a, b, k) {
  const h = Math.max(k - Math.abs(a - b), 0) / k;
  return Math.min(a, b) - (h * h * k) / 4;
}

/* ── Пропорции (единица — примерно 10 см; котик ≈ 2,4 в высоту) ── */

const GLAZ_R = 0.132;
const GLAZA = [
  [-0.2, 1.645, 0.505],
  [0.2, 1.645, 0.505],
];
const KOSTI = {
  taz: [0, 0.42, -0.1],
  pozvonochnik: [0, 0.76, -0.06],
  grud: [0, 1.02, 0.06],
  sheya: [0, 1.26, 0.1],
  golova: [0, 1.44, 0.14],
};
/* Центр головы — от него считаются щёки, мордочка, глаза. */
const GC = [0, 1.62, 0.16];

/* Хвост: от спины по полу вокруг левого бока к передним лапам. */
const HVOST = new THREE.CatmullRomCurve3(
  [
    [-0.05, 0.2, -0.62],
    [-0.5, 0.12, -0.56],
    [-0.76, 0.1, -0.12],
    [-0.66, 0.09, 0.34],
    [-0.36, 0.085, 0.66],
    [0.04, 0.08, 0.78],
    [0.34, 0.095, 0.7],
  ].map((p) => new THREE.Vector3(...p)),
  false,
  'catmullrom',
  0.5,
);

/* Тело: широкая устойчивая основа — крупные бёдра, плавная спина. */
function sdfTelo(p) {
  let d = ellipsoid(p, [0, 0.7, -0.12], [0.5, 0.58, 0.5]);
  d = smin(d, sfera(p, [-0.42, 0.42, -0.16], 0.44), 0.22);
  d = smin(d, sfera(p, [0.42, 0.42, -0.16], 0.44), 0.22);
  d = smin(d, ellipsoid(p, [0, 0.98, 0.04], [0.37, 0.36, 0.32]), 0.2);
  d = smin(d, kapsula(p, [0, 1.08, 0.06], [0, 1.4, 0.12], 0.27, 0.25), 0.14);
  return Math.max(d, 0.02 - p[1]);
}

/* Манишка: пышная светлая грудка от подбородка до лап. */
function sdfManishka(p) {
  let d = ellipsoid(p, [0, 0.9, 0.3], [0.34, 0.45, 0.22]);
  d = smin(d, ellipsoid(p, [0, 1.2, 0.26], [0.32, 0.24, 0.2]), 0.14);
  d = smin(d, ellipsoid(p, [0, 0.62, 0.36], [0.26, 0.16, 0.14]), 0.12);
  return d;
}

/* Голова не шар: лоб уже щёк, округлые щёчки, мягкий подбородок. */
function sdfGolova(p) {
  const c = GC;
  let d = ellipsoid(p, [c[0], c[1] + 0.05, c[2] - 0.02], [0.5, 0.45, 0.46]);
  d = smin(d, sfera(p, [-0.29, c[1] - 0.1, c[2] + 0.17], 0.29), 0.2);
  d = smin(d, sfera(p, [0.29, c[1] - 0.1, c[2] + 0.17], 0.29), 0.2);
  d = smin(d, sfera(p, [-0.075, c[1] - 0.15, c[2] + 0.44], 0.1), 0.09);
  d = smin(d, sfera(p, [0.075, c[1] - 0.15, c[2] + 0.44], 0.1), 0.09);
  d = smin(d, sfera(p, [0, c[1] - 0.24, c[2] + 0.34], 0.11), 0.1);
  for (const g of GLAZA) d = Math.max(d, -sfera(p, g, GLAZ_R + 0.004));
  return d;
}

/** Вислое ушко: плоское, сложено вперёд и вниз (как у вислоухого). */
function sdfUho(p, znak) {
  /* Плоский треугольник, лежит на голове: основание у макушки,
     кончик загнут вперёд и вниз. Плоскость уха — касательная к голове. */
  const n = [znak * 0.82, 0.5, 0.28];
  const nl = len(...n);
  const N = n.map((x) => x / nl);
  const S = [znak * 0.4, 1.95, 0.2];
  const B = [S[0] - znak * 0.035, S[1] + 0.07, S[2] - 0.09];
  const T = [S[0] + znak * 0.035, S[1] - 0.09, S[2] + 0.12];
  const konus = kapsula(p, B, T, 0.11, 0.025);
  const plast =
    Math.abs((p[0] - S[0]) * N[0] + (p[1] - S[1]) * N[1] + (p[2] - S[2]) * N[2]) - 0.022;
  return Math.max(konus, plast);
}

function sdfUshi(p) {
  return Math.min(sdfUho(p, -1), sdfUho(p, 1));
}

/* Передние лапы: короткие, вплотную; внизу — варежки с пальчиками. */
function sdfLapy(p) {
  let d = Infinity;
  for (const z of [-1, 1]) {
    const x = z * 0.105;
    let l = kapsula(p, [x, 0.64, 0.4], [x, 0.1, 0.46], 0.092, 0.088);
    l = smin(l, ellipsoid(p, [x, 0.066, 0.52], [0.105, 0.068, 0.125]), 0.07);
    for (const dx of [-0.045, 0, 0.045]) l = smin(l, sfera(p, [x + dx, 0.05, 0.615], 0.034), 0.025);
    d = Math.min(d, l);
  }
  return Math.max(d, 0.0 - p[1]);
}

/* Нос — розовый треугольник: широкий верх, узкий кончик вниз. */
function sdfNos(p) {
  const c = GC;
  const verh = ellipsoid(p, [0, c[1] - 0.075, c[2] + 0.555], [0.075, 0.032, 0.04]);
  const niz = kapsula(
    p,
    [0, c[1] - 0.08, c[2] + 0.555],
    [0, c[1] - 0.118, c[2] + 0.568],
    0.03,
    0.012,
  );
  return smin(verh, niz, 0.03);
}

/* ── Surface nets ────────────────────────────────────────────────── */

function gradient(sdf, p, e = 1e-3) {
  const g = [
    sdf([p[0] + e, p[1], p[2]]) - sdf([p[0] - e, p[1], p[2]]),
    sdf([p[0], p[1] + e, p[2]]) - sdf([p[0], p[1] - e, p[2]]),
    sdf([p[0], p[1], p[2] + e]) - sdf([p[0], p[1], p[2] - e]),
  ];
  const l = len(...g) || 1;
  return [g[0] / l, g[1] / l, g[2] / l];
}

/**
 * Сетка поверхности sdf = 0 в коробке [min; max] с шагом h: вершина —
 * в каждой ячейке со сменой знака, четырёхугольник — на каждом ребре
 * сетки со сменой знака. Вершины уточняются проекцией на поверхность.
 */
function surfaceNets(sdf, min, max, h) {
  const n = [0, 1, 2].map((i) => Math.ceil((max[i] - min[i]) / h) + 1);
  const idx = (i, j, k) => i + n[0] * (j + n[1] * k);
  const val = new Float32Array(n[0] * n[1] * n[2]);
  for (let k = 0; k < n[2]; k += 1)
    for (let j = 0; j < n[1]; j += 1)
      for (let i = 0; i < n[0]; i += 1)
        val[idx(i, j, k)] = sdf([min[0] + i * h, min[1] + j * h, min[2] + k * h]);
  const vert = new Int32Array(n[0] * n[1] * n[2]).fill(-1);
  const pos = [];
  const nor = [];
  for (let k = 0; k < n[2] - 1; k += 1)
    for (let j = 0; j < n[1] - 1; j += 1)
      for (let i = 0; i < n[0] - 1; i += 1) {
        let vnutri = 0;
        const c = [];
        for (let m = 0; m < 8; m += 1) {
          const v = val[idx(i + (m & 1), j + ((m >> 1) & 1), k + ((m >> 2) & 1))];
          c.push(v);
          if (v < 0) vnutri += 1;
        }
        if (vnutri === 0 || vnutri === 8) continue;
        /* Средняя точка пересечений рёбер ячейки. */
        let sx = 0;
        let sy = 0;
        let sz = 0;
        let cnt = 0;
        for (let m = 0; m < 8; m += 1)
          for (const b of [1, 2, 4]) {
            const m2 = m | b;
            if (m2 === m) continue;
            const a = c[m];
            const bb = c[m2];
            if (a < 0 === bb < 0) continue;
            const t = a / (a - bb);
            const p0 = [m & 1, (m >> 1) & 1, (m >> 2) & 1];
            const p1 = [m2 & 1, (m2 >> 1) & 1, (m2 >> 2) & 1];
            sx += p0[0] + (p1[0] - p0[0]) * t;
            sy += p0[1] + (p1[1] - p0[1]) * t;
            sz += p0[2] + (p1[2] - p0[2]) * t;
            cnt += 1;
          }
        let p = [
          min[0] + (i + sx / cnt) * h,
          min[1] + (j + sy / cnt) * h,
          min[2] + (k + sz / cnt) * h,
        ];
        /* Две проекции на поверхность по градиенту. */
        for (let s = 0; s < 2; s += 1) {
          const d = sdf(p);
          const g = gradient(sdf, p);
          p = [p[0] - g[0] * d, p[1] - g[1] * d, p[2] - g[2] * d];
        }
        vert[idx(i, j, k)] = pos.length / 3;
        pos.push(...p);
        nor.push(...gradient(sdf, p));
      }
  const index = [];
  const os = [
    [1, 0, 0],
    [0, 1, 0],
    [0, 0, 1],
  ];
  for (let k = 1; k < n[2] - 1; k += 1)
    for (let j = 1; j < n[1] - 1; j += 1)
      for (let i = 1; i < n[0] - 1; i += 1) {
        const a = val[idx(i, j, k)];
        for (let ax = 0; ax < 3; ax += 1) {
          const e = os[ax];
          const b = val[idx(i + e[0], j + e[1], k + e[2])];
          if (a < 0 === b < 0) continue;
          const u = os[(ax + 1) % 3];
          const v = os[(ax + 2) % 3];
          const yach = (du, dv) =>
            vert[
              idx(i - du * u[0] - dv * v[0], j - du * u[1] - dv * v[1], k - du * u[2] - dv * v[2])
            ];
          const q = [yach(1, 1), yach(0, 1), yach(0, 0), yach(1, 0)];
          if (q.some((x) => x < 0)) continue;
          if (a < 0) index.push(q[0], q[1], q[2], q[0], q[2], q[3]);
          else index.push(q[0], q[2], q[1], q[0], q[3], q[2]);
        }
      }
  /* Ориентация — наружу, по градиенту (на случай перепутанного обхода). */
  for (let t = 0; t < index.length; t += 3) {
    const [i0, i1, i2] = [index[t], index[t + 1], index[t + 2]];
    const P = (i) => [pos[i * 3], pos[i * 3 + 1], pos[i * 3 + 2]];
    const [p0, p1, p2] = [P(i0), P(i1), P(i2)];
    const e1 = [p1[0] - p0[0], p1[1] - p0[1], p1[2] - p0[2]];
    const e2 = [p2[0] - p0[0], p2[1] - p0[1], p2[2] - p0[2]];
    const nx = e1[1] * e2[2] - e1[2] * e2[1];
    const ny = e1[2] * e2[0] - e1[0] * e2[2];
    const nz = e1[0] * e2[1] - e1[1] * e2[0];
    const g = [
      nor[i0 * 3] + nor[i1 * 3] + nor[i2 * 3],
      nor[i0 * 3 + 1] + nor[i1 * 3 + 1] + nor[i2 * 3 + 1],
      nor[i0 * 3 + 2] + nor[i1 * 3 + 2] + nor[i2 * 3 + 2],
    ];
    if (nx * g[0] + ny * g[1] + nz * g[2] < 0) {
      index[t + 1] = i2;
      index[t + 2] = i1;
    }
  }
  return { pos, nor, index };
}

function geometriya({ pos, index }, sdvig = [0, 0, 0]) {
  const g = new THREE.BufferGeometry();
  const p = new Float32Array(pos.length);
  for (let i = 0; i < pos.length; i += 3) {
    p[i] = pos[i] - sdvig[0];
    p[i + 1] = pos[i + 1] - sdvig[1];
    p[i + 2] = pos[i + 2] - sdvig[2];
  }
  g.setAttribute('position', new THREE.BufferAttribute(p, 3));
  /* Нормали не пишем: на сетке surface nets они точно восстанавливаются
     в браузере (computeVertexNormals), а файл легче на треть. */
  const n = pos.length / 3;
  g.setIndex(
    new THREE.BufferAttribute(n < 65536 ? new Uint16Array(index) : new Uint32Array(index), 1),
  );
  return g;
}

function mekh(g, f) {
  const p = g.attributes.position;
  const m = new Float32Array(p.count);
  for (let i = 0; i < p.count; i += 1) m[i] = f(p.getX(i), p.getY(i), p.getZ(i));
  /* GLTFExporter пишет нестандартный атрибут как _MEKH, GLTFLoader читает его как _mekh. */
  g.setAttribute('mekh', new THREE.BufferAttribute(m, 1));
}

/* ── Части ───────────────────────────────────────────────────────── */

const H = 0.028;
/* Стекло гладкое — ему хватает сетки покрупнее. */
const telo = surfaceNets(sdfTelo, [-0.98, -0.02, -0.7], [0.98, 1.5, 0.52], H * 1.3);
const manishka = surfaceNets(sdfManishka, [-0.4, 0.4, 0.04], [0.4, 1.5, 0.6], H * 0.75);
const golova = surfaceNets(sdfGolova, [-0.66, 1.08, -0.36], [0.66, 2.16, 0.74], H * 0.78);
const ushi = surfaceNets(sdfUshi, [-0.62, 1.82, -0.18], [0.62, 2.28, 0.4], H * 0.55);
const lapy = surfaceNets(sdfLapy, [-0.27, -0.03, 0.24], [0.27, 0.78, 0.7], H * 0.6);
const nos = surfaceNets(sdfNos, [-0.1, 1.48, 0.66], [0.1, 1.58, 0.78], 0.007);

/* Хвост — трубка с радиусом от 0,13 у основания до 0,075 и круглым кончиком. */
function geomHvost() {
  const SEG = 72;
  const RAD = 16;
  const pos = [];
  const nor = [];
  const t = [];
  const index = [];
  const frames = HVOST.computeFrenetFrames(SEG, false);
  for (let i = 0; i <= SEG; i += 1) {
    const u = i / SEG;
    const c = HVOST.getPointAt(u);
    const r = 0.15 + (0.07 - 0.15) * Math.pow(u, 0.85);
    /* Кончик скругляется: последние 4 % радиус уходит в ноль по окружности. */
    const kon = u > 0.96 ? Math.sqrt(Math.max(0, 1 - ((u - 0.96) / 0.04) ** 2)) : 1;
    for (let j = 0; j <= RAD; j += 1) {
      const a = (j / RAD) * Math.PI * 2;
      const n = frames.normals[i]
        .clone()
        .multiplyScalar(Math.cos(a))
        .add(frames.binormals[i].clone().multiplyScalar(Math.sin(a)));
      pos.push(c.x + n.x * r * kon, Math.max(0.005, c.y + n.y * r * kon), c.z + n.z * r * kon);
      nor.push(n.x, n.y, n.z);
      t.push(u);
    }
  }
  for (let i = 0; i < SEG; i += 1)
    for (let j = 0; j < RAD; j += 1) {
      const a = i * (RAD + 1) + j;
      const b = a + RAD + 1;
      index.push(a, b, a + 1, b, b + 1, a + 1);
    }
  return { pos, nor, index, t };
}
const hvost = geomHvost();

/* Веко: часть сферы над глазом. Открыто — шапочка до 52°, закрыто — до 128°. */
function geomVeko() {
  /* Веко чуть больше глаза: закрытое — выпуклое, не проваливается. */
  const R = GLAZ_R + 0.018;
  const N = 18;
  const M = 28;
  const pos = [];
  const zakr = [];
  const nor = [];
  const uv = [];
  const index = [];
  const tochka = (polar, az) => {
    /* Полюс — вверх (+y), глаз смотрит вперёд (+z). */
    const s = Math.sin(polar);
    return [s * Math.cos(az), Math.cos(polar), s * Math.sin(az)];
  };
  for (let i = 0; i <= N; i += 1) {
    const u = i / N;
    for (let j = 0; j <= M; j += 1) {
      /* Только передняя половина: азимут от 0 до π (z ≥ 0). */
      const az = (j / M) * Math.PI;
      const o = tochka((u * (56 * Math.PI)) / 180, az);
      const z = tochka((u * (124 * Math.PI)) / 180, az);
      pos.push(o[0] * R, o[1] * R, o[2] * R);
      zakr.push(z[0] * R - o[0] * R, z[1] * R - o[1] * R, z[2] * R - o[2] * R);
      nor.push(...o);
      /* u — от макушки века к краю: у края рисуется тёмная линия. */
      uv.push(u, j / M);
    }
  }
  for (let i = 0; i < N; i += 1)
    for (let j = 0; j < M; j += 1) {
      const a = i * (M + 1) + j;
      const b = a + M + 1;
      index.push(a, a + 1, b, b, a + 1, b + 1);
    }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(index);
  g.morphAttributes.position = [new THREE.Float32BufferAttribute(zakr, 3)];
  g.morphTargetsRelative = true;
  return g;
}

/* ── Скелет ──────────────────────────────────────────────────────── */

const v3 = (p) => new THREE.Vector3(...p);
function kost(imya, mir, roditelMir) {
  const b = new THREE.Bone();
  /* Приставка k_: имя кости не совпадает с именем меша (иначе GLTF переименует меш). */
  b.name = `k_${imya}`;
  b.position.copy(v3(mir).sub(roditelMir ? v3(roditelMir) : new THREE.Vector3()));
  return b;
}
const bTaz = kost('taz', KOSTI.taz);
const bPozv = kost('pozvonochnik', KOSTI.pozvonochnik, KOSTI.taz);
const bGrud = kost('grud', KOSTI.grud, KOSTI.pozvonochnik);
const bSheya = kost('sheya', KOSTI.sheya, KOSTI.grud);
const bGolova = kost('golova', KOSTI.golova, KOSTI.sheya);
bTaz.add(bPozv);
bPozv.add(bGrud);
bGrud.add(bSheya);
bSheya.add(bGolova);
const HV_U = [0, 0.2, 0.4, 0.6, 0.8];
const hvKosti = [];
let prev = bTaz;
let prevMir = KOSTI.taz;
HV_U.forEach((u, i) => {
  const p = HVOST.getPointAt(u).toArray();
  const b = kost(`hvost${i + 1}`, p, prevMir);
  prev.add(b);
  hvKosti.push(b);
  prev = b;
  prevMir = p;
});
const kosti = [bTaz, bPozv, bGrud, bSheya, bGolova, ...hvKosti];
const skelet = new THREE.Skeleton(kosti);

/* Веса тела: по высоте между тазом, позвоночником, грудью и шеей. */
function vesaTela(g) {
  const p = g.attributes.position;
  const idx = new Uint8Array(p.count * 4);
  const w = new Uint8Array(p.count * 4);
  const ys = [KOSTI.taz[1], KOSTI.pozvonochnik[1], KOSTI.grud[1], KOSTI.sheya[1]];
  for (let i = 0; i < p.count; i += 1) {
    const y = p.getY(i);
    let a = 0;
    while (a < 2 && y > ys[a + 1]) a += 1;
    const t = clamp((y - ys[a]) / (ys[a + 1] - ys[a]), 0, 1);
    const s = t * t * (3 - 2 * t);
    idx[i * 4] = a;
    idx[i * 4 + 1] = a + 1;
    const w1 = Math.round(s * 255);
    w[i * 4] = 255 - w1;
    w[i * 4 + 1] = w1;
  }
  g.setAttribute('skinIndex', new THREE.BufferAttribute(idx, 4));
  g.setAttribute('skinWeight', new THREE.BufferAttribute(w, 4, true));
}

/* Веса хвоста: по параметру кривой между соседними костями хвоста. */
function vesaHvosta(g, tArr) {
  const n = tArr.length;
  const idx = new Uint8Array(n * 4);
  const w = new Uint8Array(n * 4);
  for (let i = 0; i < n; i += 1) {
    const u = tArr[i];
    let a = 0;
    while (a < HV_U.length - 1 && u > HV_U[a + 1]) a += 1;
    const b = Math.min(a + 1, HV_U.length - 1);
    const t = a === b ? 0 : clamp((u - HV_U[a]) / (HV_U[b] - HV_U[a]), 0, 1);
    idx[i * 4] = 5 + a;
    idx[i * 4 + 1] = 5 + b;
    const w1 = Math.round(t * 255);
    w[i * 4] = 255 - w1;
    w[i * 4 + 1] = w1;
  }
  g.setAttribute('skinIndex', new THREE.BufferAttribute(idx, 4));
  g.setAttribute('skinWeight', new THREE.BufferAttribute(w, 4, true));
}

/* ── Сборка сцены ────────────────────────────────────────────────── */

const scene = new THREE.Scene();
const kotik = new THREE.Group();
kotik.name = 'kotik';
scene.add(kotik);
kotik.add(bTaz);
bTaz.updateMatrixWorld(true);

const plain = (name) => new THREE.MeshStandardMaterial({ name });

/* Тело: мех на грудке и у шеи, стекло — спина, бока, задние лапы. */
const gTelo = geometriya(telo);
/* Мех на плечах и у шеи редеет и тает в стекле к бокам и спине. */
mekh(gTelo, (x, y, z) =>
  Math.max(
    smoothstep(-0.02, 0.24, z + 0.32 * (y - 0.9) - 0.22 * Math.abs(x)),
    smoothstep(1.16, 1.4, y + 0.12 * z),
  ),
);
vesaTela(gTelo);
const mTelo = new THREE.SkinnedMesh(gTelo, plain('telo'));
mTelo.name = 'telo';
kotik.add(mTelo);
mTelo.bind(skelet);

const gHvost = new THREE.BufferGeometry();
gHvost.setAttribute('position', new THREE.Float32BufferAttribute(hvost.pos, 3));
gHvost.setAttribute('normal', new THREE.Float32BufferAttribute(hvost.nor, 3));
gHvost.setIndex(hvost.index);
mekh(gHvost, () => 0);
vesaHvosta(gHvost, hvost.t);
const mHvost = new THREE.SkinnedMesh(gHvost, plain('hvost'));
mHvost.name = 'hvost';
kotik.add(mHvost);
mHvost.bind(skelet);

/* Жёсткие части — на костях, координаты — от кости. */
function naKosti(imya, geom, kost_, mir, mat) {
  const m = new THREE.Mesh(geom, plain(mat ?? imya));
  m.name = imya;
  kost_.add(m);
  return m;
}
const gGolova = geometriya(golova, KOSTI.golova);
mekh(gGolova, () => 1);
naKosti('golova', gGolova, bGolova);
const gUshi = geometriya(ushi, KOSTI.golova);
mekh(gUshi, () => 1);
naKosti('ushi', gUshi, bGolova);
const gNos = geometriya(nos, KOSTI.golova);
naKosti('nos', gNos, bGolova);
const gLapy = geometriya(lapy, KOSTI.grud);
/* Лапы — в коротком прилегающем меху. */
mekh(gLapy, () => 1);
naKosti('lapy', gLapy, bGrud);
const gManishka = geometriya(manishka, KOSTI.grud);
mekh(gManishka, () => 1);
naKosti('manishka', gManishka, bGrud);

/* Тонкая трубка вдоль кривой; uv.x — от корня к кончику. */
function trubka(tochki, r0, r1, seg = 24, rad = 6) {
  const kr = new THREE.CatmullRomCurve3(tochki.map((p) => new THREE.Vector3(...p)));
  const fr = kr.computeFrenetFrames(seg, false);
  const pos = [];
  const nor = [];
  const uv = [];
  const index = [];
  for (let i = 0; i <= seg; i += 1) {
    const u = i / seg;
    const c = kr.getPointAt(u);
    const r = r0 + (r1 - r0) * u;
    for (let j = 0; j <= rad; j += 1) {
      const a = (j / rad) * Math.PI * 2;
      const n = fr.normals[i]
        .clone()
        .multiplyScalar(Math.cos(a))
        .add(fr.binormals[i].clone().multiplyScalar(Math.sin(a)));
      pos.push(c.x + n.x * r, c.y + n.y * r, c.z + n.z * r);
      nor.push(n.x, n.y, n.z);
      uv.push(u, j / rad);
    }
  }
  for (let i = 0; i < seg; i += 1)
    for (let j = 0; j < rad; j += 1) {
      const a = i * (rad + 1) + j;
      const b = a + rad + 1;
      index.push(a, b, a + 1, b, b + 1, a + 1);
    }
  return { pos, nor, uv, index };
}
function sobrat(chasti, sdvig) {
  const pos = [];
  const nor = [];
  const uv = [];
  const index = [];
  for (const c of chasti) {
    const o = pos.length / 3;
    for (let i = 0; i < c.pos.length; i += 3)
      pos.push(c.pos[i] - sdvig[0], c.pos[i + 1] - sdvig[1], c.pos[i + 2] - sdvig[2]);
    nor.push(...c.nor);
    uv.push(...c.uv);
    index.push(...c.index.map((x) => x + o));
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(index);
  return g;
}

/* Рот «ипсилоном»: от кончика носа вниз и двумя дужками в стороны. */
{
  const [, cy, cz] = GC;
  const nizNosa = [0, cy - 0.122, cz + 0.566];
  const razvilka = [0, cy - 0.165, cz + 0.555];
  const chasti = [trubka([nizNosa, [0, cy - 0.145, cz + 0.562], razvilka], 0.0055, 0.005, 8, 6)];
  for (const z of [-1, 1]) {
    chasti.push(
      trubka(
        [razvilka, [z * 0.035, cy - 0.183, cz + 0.548], [z * 0.075, cy - 0.178, cz + 0.528]],
        0.005,
        0.0035,
        12,
        6,
      ),
    );
  }
  const gRot = sobrat(chasti, KOSTI.golova);
  naKosti('rot', gRot, bGolova);
}

/* Усы: по 5 с каждой стороны, слегка изогнуты вниз; бровные волоски — по 3. */
{
  const [, cy, cz] = GC;
  const chasti = [];
  for (const z of [-1, 1]) {
    for (let i = 0; i < 5; i += 1) {
      const koren = [z * (0.1 + 0.012 * i), cy - 0.13 - 0.018 * i, cz + 0.505 - 0.012 * i];
      const ugol = -0.18 + i * 0.1;
      const L = 0.6 - Math.abs(i - 2) * 0.05;
      const dx = Math.cos(ugol) * L;
      const dy = Math.sin(ugol) * L * 0.6;
      chasti.push(
        trubka(
          [
            koren,
            [koren[0] + z * dx * 0.5, koren[1] - dy * 0.3 + 0.01, koren[2] + 0.06],
            [koren[0] + z * dx, koren[1] - dy - 0.07, koren[2] + 0.02],
          ],
          0.0042,
          0.0012,
          24,
          5,
        ),
      );
    }
    for (let i = 0; i < 3; i += 1) {
      const koren = [z * (0.16 + 0.05 * i), cy + 0.13 + 0.01 * i, cz + 0.44 - 0.03 * i];
      chasti.push(
        trubka(
          [
            koren,
            [koren[0] + z * 0.08, koren[1] + 0.1, koren[2] + 0.06],
            [koren[0] + z * 0.18, koren[1] + 0.14, koren[2] + 0.04],
          ],
          0.0032,
          0.001,
          16,
          5,
        ),
      );
    }
  }
  const gUsy = sobrat(chasti, KOSTI.golova);
  naKosti('usy', gUsy, bGolova);
}

GLAZA.forEach((g, i) => {
  const s = i === 0 ? 'L' : 'P';
  const sferaGlaza = new THREE.SphereGeometry(GLAZ_R, 36, 24);
  sferaGlaza.deleteAttribute('uv');
  const glaz = new THREE.Mesh(sferaGlaza, plain('glaz'));
  glaz.name = `glaz${s}`;
  glaz.position.set(g[0] - KOSTI.golova[0], g[1] - KOSTI.golova[1], g[2] - KOSTI.golova[2]);
  /* Глаза чуть смотрят в стороны и вниз — грустный взгляд. */
  glaz.rotation.set(0.14, (i === 0 ? -1 : 1) * 0.12, 0);
  bGolova.add(glaz);
  const veko = new THREE.Mesh(geomVeko(), plain('veko'));
  veko.name = `veko${s}`;
  veko.morphTargetDictionary = { zakryto: 0 };
  veko.morphTargetInfluences = [0];
  veko.position.copy(glaz.position);
  /* Грустное веко: внешний край опущен. */
  veko.rotation.set(0.06, (i === 0 ? -1 : 1) * 0.12, (i === 0 ? 1 : -1) * 0.3);
  bGolova.add(veko);
});

/* ── Экспорт ─────────────────────────────────────────────────────── */

const exporter = new GLTFExporter();
const glb = await exporter.parseAsync(scene, { binary: true, onlyVisible: false });
fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, Buffer.from(glb));
const verts = [gTelo, gHvost, gGolova, gUshi, gNos, gLapy, gManishka].reduce(
  (s, g) => s + g.attributes.position.count,
  0,
);
console.log(
  `kotik.glb: ${(glb.byteLength / 1024).toFixed(0)} КБ, вершин ${verts} → ${path.relative(process.cwd(), OUT)}`,
);
