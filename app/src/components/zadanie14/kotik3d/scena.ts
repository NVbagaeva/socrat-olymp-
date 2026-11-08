/**
 * 3D-котик тренажёра окружности (№14): сцена на чистом three.js, без
 * React. Модель — public/models/kotik.glb (scripts/build-kotik.mjs).
 *
 * — Стекло: тело, хвост — MeshPhysicalMaterial с transmission. Чтобы
 *   прозрачный холст не превращал стекло в белое (three.js заливает
 *   «то, что за стеклом» белым, когда фон прозрачный), позади котика —
 *   «задник» в цвет фона страницы: его видит только проход
 *   преломления, на экране он не рисуется.
 * — Мех: голова, уши, манишка, лапы и плечи — оболочки (shell
 *   texturing). Ворс причёсан вниз и назад, пряди скучены, к кончикам
 *   тоньше и прозрачнее, по силуэту — реже: контур мягкий.
 * — Окружение — своё, собрано в коде: тёплый софтбокс слева,
 *   нейтральный сверху, тёмный «пол» — в стекле есть и блики, и тёмные
 *   отражения.
 * — Облако — мягкие частицы с шумом и внутренним свечением; тень и
 *   тёплые каустики на полу. Фон прозрачный.
 *
 * Модуль тянет three.js — импортируется только динамически.
 */

import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export interface KotikOpcii {
  /** Адрес модели. */
  model: string;
  /** Сколько оболочек меха (16 на телефоне, 24 на компьютере). */
  sloev?: number;
  /** Предел pixel ratio. */
  dpr?: number;
  /** Цвет фона под холстом — его «видит» стекло. */
  fon?: string;
}

export interface Kotik3d {
  /** Отрисовать кадр (время — в секундах). */
  kadr: (t: number) => void;
  razmer: (w: number, h: number) => void;
  /** Поворот камеры, градусы по горизонтали и вертикали (до ±8). */
  povorot: (az: number, el: number) => void;
  /** Насколько котика гладят (0…1) и где рука, в долях холста. */
  glazhu: (sila: number, ruka?: { x: number; y: number }) => void;
  /** Котик рад (баннер: окружность разложена верно). */
  rad: (sila: number) => void;
  /** Цвет фона под холстом (светлая или тёмная тема). */
  fon: (cvet: string) => void;
  /** Куда попал луч: голова, спина или мимо. */
  popal: (x: number, y: number) => 'golova' | 'spina' | null;
  ubrat: () => void;
  renderer: THREE.WebGLRenderer;
}

/* ── Шум для шейдеров ────────────────────────────────────────────── */

const SHUM = /* glsl */ `
  float hash13(vec3 p){ p = fract(p * 0.1031); p += dot(p, p.zyx + 31.32); return fract((p.x + p.y) * p.z); }
  vec3 hash33(vec3 p){ p = fract(p * vec3(0.1031, 0.1030, 0.0973)); p += dot(p, p.yxz + 33.33); return fract((p.xxy + p.yxx) * p.zyx); }
  float shum3(vec3 p){
    vec3 i = floor(p); vec3 f = fract(p); f = f * f * (3.0 - 2.0 * f);
    return mix(mix(mix(hash13(i), hash13(i + vec3(1,0,0)), f.x), mix(hash13(i + vec3(0,1,0)), hash13(i + vec3(1,1,0)), f.x), f.y),
               mix(mix(hash13(i + vec3(0,0,1)), hash13(i + vec3(1,0,1)), f.x), mix(hash13(i + vec3(0,1,1)), hash13(i + vec3(1,1,1)), f.x), f.y), f.z);
  }
  float fbm3(vec3 p){ return shum3(p) * 0.55 + shum3(p * 2.03 + 7.1) * 0.3 + shum3(p * 4.1 + 3.3) * 0.15; }
`;

/* ── Окружение ───────────────────────────────────────────────────── */

function okruzhenie(renderer: THREE.WebGLRenderer): THREE.Texture {
  const scena = new THREE.Scene();
  scena.add(
    new THREE.Mesh(
      new THREE.SphereGeometry(10, 48, 24),
      new THREE.ShaderMaterial({
        side: THREE.BackSide,
        depthWrite: false,
        vertexShader: `varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.); }`,
        fragmentShader: `varying vec3 vP;
          void main(){
            float y = vP.y;
            vec3 verh = vec3(0.95, 0.9, 0.86);
            vec3 gorizont = vec3(0.9, 0.72, 0.62);
            /* Тёмный «пол» — тёмные отражения в стекле. */
            vec3 pol = vec3(0.16, 0.09, 0.06);
            vec3 c = y > 0.0 ? mix(gorizont, verh, smoothstep(0.0, 0.6, y)) : mix(gorizont, pol, smoothstep(0.0, 0.18, -y));
            gl_FragColor = vec4(c * 0.62, 1.0);
          }`,
      }),
    ),
  );
  const softboks = (
    w: number,
    h: number,
    c: number,
    sila: number,
    pos: [number, number, number],
  ) => {
    const m = new THREE.Mesh(
      new THREE.PlaneGeometry(w, h),
      new THREE.MeshBasicMaterial({
        color: new THREE.Color(c).multiplyScalar(sila),
        side: THREE.DoubleSide,
      }),
    );
    m.position.set(...pos);
    m.lookAt(0, 1.0, 0);
    scena.add(m);
  };
  /* Тёплый слева, нейтральный сверху, тёплый контровой сзади справа. */
  softboks(3, 4.5, 0xffd2a8, 9, [-6, 3.5, 3]);
  softboks(5, 2.2, 0xfff6ee, 7, [0.5, 8, 1.5]);
  softboks(2.2, 3.5, 0xffb48a, 5, [6, 2.5, -4]);
  softboks(1.2, 1.2, 0xffffff, 10, [3.5, 4, 5]);
  const pmrem = new THREE.PMREMGenerator(renderer);
  const tex = pmrem.fromScene(scena, 0.02).texture;
  pmrem.dispose();
  scena.traverse((o) => {
    if (o instanceof THREE.Mesh) {
      o.geometry.dispose();
      (o.material as THREE.Material).dispose();
    }
  });
  return tex;
}

/**
 * Задник для стекла: сфера в цвет фона страницы с тёплыми пятнами
 * света и чуть более тёмным полом. Рисуется только в проход
 * преломления (когда рендер идёт в текстуру), на экран — нет.
 */
function zadnik(): { mesh: THREE.Mesh; fon: THREE.Color } {
  const fon = new THREE.Color(0xf7efe8);
  const mesh = new THREE.Mesh(
    new THREE.SphereGeometry(18, 48, 24),
    new THREE.ShaderMaterial({
      side: THREE.BackSide,
      uniforms: { uFon: { value: fon } },
      vertexShader: `varying vec3 vP; void main(){ vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.); }`,
      fragmentShader: `uniform vec3 uFon; varying vec3 vP;
        ${SHUM}
        void main(){
          vec3 n = normalize(vP);
          vec3 c = uFon;
          float svet = dot(uFon, vec3(0.333));
          c = mix(c, c * vec3(0.96, 0.88, 0.8), smoothstep(0.02, -0.25, n.y));
          c += vec3(1.0, 0.82, 0.66) * 0.18 * smoothstep(0.55, 0.95, fbm3(n * 3.0)) * (1.2 - svet);
          gl_FragColor = vec4(c, 1.0);
        }`,
    }),
  );
  mesh.frustumCulled = false;
  mesh.onBeforeRender = (renderer, _s, _c, geometry) => {
    geometry.setDrawRange(0, renderer.getRenderTarget() === null ? 0 : Infinity);
  };
  return { mesh, fon };
}

/* ── Мех ─────────────────────────────────────────────────────────── */

export interface ParametryMekha {
  /** Длина ворса. */
  dlina: number;
  /** Густота прядей (клеток на единицу). */
  gustota: number;
  /** Насколько ворс зачёсан вниз-назад (0 — торчит по нормали). */
  zaches: number;
  /** Тон окраса: 0 — табби головы и плеч, 1 — светлая манишка и лапы. */
  ton: number;
  /** Положение кости в модели: окрас — в координатах модели. */
  sdvig: THREE.Vector3;
}

function materialMekha(sloy: number, p: ParametryMekha): THREE.MeshStandardMaterial {
  const m = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.95,
    metalness: 0,
    envMapIntensity: 0.55,
  });
  const u = {
    uSloy: { value: sloy },
    uDlina: { value: p.dlina },
    uGust: { value: p.gustota },
    uZaches: { value: p.zaches },
    uTon: { value: p.ton },
    uSdvig: { value: p.sdvig },
  };
  m.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, u);
    sh.vertexShader = sh.vertexShader
      .replace(
        '#include <common>',
        `#include <common>
         attribute float _mekh;
         uniform float uSloy; uniform float uDlina; uniform float uZaches; uniform vec3 uSdvig;
         varying vec3 vMod; varying float vMekh;`,
      )
      .replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
         vMekh = _mekh;
         vMod = position + uSdvig;
         float dl = uDlina * smoothstep(0.25, 0.85, _mekh);
         /* Причёсан: к кончику ворс ложится вниз и назад по поверхности. */
         vec3 g = vec3(0.0, -1.0, -0.4);
         vec3 kas = g - normal * dot(g, normal);
         float h = uSloy;
         transformed += normal * h * dl + kas * pow(h, 1.6) * dl * uZaches;`,
      );
    sh.fragmentShader = sh.fragmentShader
      .replace(
        '#include <common>',
        `#include <common>
         uniform float uSloy; uniform float uGust; uniform float uTon;
         varying vec3 vMod; varying float vMekh;
         ${SHUM}`,
      )
      .replace(
        '#include <color_fragment>',
        `#include <color_fragment>
         vec3 V = normalize(vViewPosition);
         float grazh = 1.0 - clamp(abs(dot(normalize(vNormal), V)), 0.0, 1.0);
         /* Где мех кончается — стекло: ворс редеет и тает. */
         float porog = vMekh + (fbm3(vMod * 18.0) - 0.5) * 0.5;
         if (porog < 0.5) discard;
         float ton = 1.0;
         if (uSloy > 0.0) {
           /* Скучивание: пряди тянутся к центрам пучков. */
           vec3 q = vMod * uGust;
           vec3 kl = floor(q / 3.0);
           vec3 kc = (kl + hash33(kl)) * 3.0;
           q = mix(q, kc, uSloy * 0.35);
           vec3 c = floor(q);
           vec3 f = fract(q) - hash33(c);
           float tolshina = pow(1.0 - uSloy, 1.15) * (0.55 + 0.3 * hash13(c + 7.0));
           /* По силуэту — реже: контур мягкий, без взъерошенности. */
           tolshina *= mix(1.0, 0.55, grazh * grazh * uSloy);
           tolshina *= smoothstep(0.5, 0.75, porog);
           if (length(f) > tolshina) discard;
           ton = 0.9 + 0.2 * hash13(c + 3.0);
         }
         vec3 svetlyi = vec3(1.0, 0.95, 0.89);
         vec3 okras;
         if (uTon > 0.5) {
           /* Манишка и лапы — светлые, кремовые. */
           okras = mix(svetlyi, vec3(0.86, 0.79, 0.73), smoothstep(1.15, 1.45, vMod.y) * 0.5);
           okras *= 0.94 + 0.08 * fbm3(vMod * 20.0);
         } else {
           /* Голова: серо-кремовый табби. p — от центра головы. */
           vec3 p = vMod - vec3(0.0, 1.62, 0.16);
           float n1 = fbm3(vMod * 5.0);
           vec3 osnova = vec3(0.54, 0.45, 0.38);
           vec3 temnyi = vec3(0.27, 0.19, 0.15);
           /* Лоб: полоски веером, разной ширины, буквой «М». */
           float ugol = atan(p.x, p.y + 0.42);
           float veer = sin(ugol * 15.0 + n1 * 2.6 + sin(p.y * 9.0) * 0.6);
           float lob = smoothstep(0.02, 0.16, p.y) * smoothstep(0.1, 0.32, p.z) * (1.0 - smoothstep(0.22, 0.42, abs(p.x)));
           float polosy = smoothstep(0.2 + 0.25 * n1, 0.9, veer) * lob;
           /* Темя и затылок: поперечные мягкие полосы. */
           float temya = smoothstep(0.38, 0.95, sin(p.z * 17.0 - p.y * 5.0 + n1 * 3.0)) * smoothstep(0.18, 0.4, p.y) * (1.0 - lob);
           /* Щёки: тонкие изогнутые полоски. */
           float shcheki = smoothstep(0.82, 0.97, sin(p.y * 46.0 + p.z * 14.0 + n1 * 2.0)) * smoothstep(0.3, 0.42, abs(p.x)) * smoothstep(0.0, 0.2, p.z) * (1.0 - smoothstep(-0.02, 0.1, p.y));
           /* Спина и плечи — тоже табби. */
           float spina = smoothstep(0.45, 0.95, sin(vMod.y * 14.0 + vMod.x * 4.0 + n1 * 3.5)) * (1.0 - smoothstep(1.1, 1.3, vMod.y));
           float temn = max(max(polosy, temya), max(shcheki * 0.7, spina * 0.7));
           okras = mix(osnova, temnyi, temn * 0.92);
           /* Светлая мордочка, щёчки и подбородок. */
           float morda = smoothstep(0.34, 0.48, p.z) * (1.0 - smoothstep(-0.08, 0.02, p.y)) * (1.0 - smoothstep(0.14, 0.26, abs(p.x)));
           float podborodok = (1.0 - smoothstep(-0.3, -0.14, p.y)) * smoothstep(0.1, 0.3, p.z);
           okras = mix(okras, svetlyi, clamp(max(morda, podborodok), 0.0, 1.0));
           okras *= 0.93 + 0.12 * fbm3(vMod * 28.0);
         }
         /* Глубокие слои чуть темнее — объём без резких тёмных прядей. */
         okras *= mix(0.76, 1.06, uSloy) * ton;
         diffuseColor.rgb *= okras;`,
      )
      .replace(
        '#include <emissivemap_fragment>',
        `#include <emissivemap_fragment>
         /* Мягкий тёплый контровой свет. */
         float rim = pow(1.0 - clamp(abs(dot(normalize(vNormal), normalize(vViewPosition))), 0.0, 1.0), 2.2);
         totalEmissiveRadiance += vec3(1.0, 0.76, 0.58) * rim * (0.22 + 0.4 * uSloy);`,
      );
  };
  m.customProgramCacheKey = () => 'kotik-mekh';
  return m;
}

/* ── Стекло ──────────────────────────────────────────────────────── */

function materialStekla(): THREE.MeshPhysicalMaterial {
  const m = new THREE.MeshPhysicalMaterial({
    color: 0xffeadc,
    metalness: 0,
    roughness: 0.05,
    transmission: 1,
    thickness: 1.0,
    ior: 1.5,
    iridescence: 0.25,
    iridescenceIOR: 1.3,
    iridescenceThicknessRange: [220, 480],
    attenuationColor: new THREE.Color(0xffd6bc),
    attenuationDistance: 2.6,
    specularIntensity: 1,
    specularColor: new THREE.Color(0xffffff),
    clearcoat: 0.6,
    clearcoatRoughness: 0.04,
    envMapIntensity: 1.6,
    side: THREE.DoubleSide,
  });
  m.onBeforeCompile = (sh) => {
    sh.fragmentShader = sh.fragmentShader.replace(
      '#include <dithering_fragment>',
      `#include <dithering_fragment>
       /* Тонкая тёплая терракотовая кромка по краю стекла. */
       float fr = pow(1.0 - clamp(abs(dot(normalize(vNormal), normalize(vViewPosition))), 0.0, 1.0), 3.0);
       gl_FragColor.rgb = mix(gl_FragColor.rgb, vec3(0.62, 0.36, 0.24), fr * 0.4);`,
    );
  };
  m.customProgramCacheKey = () => 'kotik-steklo';
  return m;
}

/* ── Веко, глаз, усы ─────────────────────────────────────────────── */

function materialVeka(): THREE.MeshStandardMaterial {
  const m = new THREE.MeshStandardMaterial({
    color: 0x9b8576,
    roughness: 0.95,
    envMapIntensity: 0.5,
  });
  /* vUv нужен без карты — включаем его вручную. */
  Object.assign(m, { defines: { USE_UV: '' } });
  m.onBeforeCompile = (sh) => {
    sh.fragmentShader = sh.fragmentShader.replace(
      '#include <color_fragment>',
      `#include <color_fragment>
       /* Изогнутая линия-«улыбка»: у закрытого века — посередине
          глаза, у открытого — складка над глазом; плюс тёмный край. */
       float u0 = 0.72 + 0.07 * sin(vUv.y * 3.14159);
       float liniya = 1.0 - smoothstep(0.015, 0.04, abs(vUv.x - u0));
       float kray = smoothstep(0.9, 0.99, vUv.x);
       diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.14, 0.09, 0.07), max(liniya, kray));`,
    );
  };
  m.customProgramCacheKey = () => 'kotik-veko';
  return m;
}

function materialGlaza(r: number): THREE.MeshPhysicalMaterial {
  const m = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    roughness: 0.2,
    clearcoat: 1,
    clearcoatRoughness: 0.02,
    envMapIntensity: 1.5,
  });
  m.onBeforeCompile = (sh) => {
    sh.uniforms['uR'] = { value: r };
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vLok;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvLok = position;');
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', '#include <common>\nuniform float uR; varying vec3 vLok;')
      .replace(
        '#include <color_fragment>',
        `#include <color_fragment>
         vec2 d = vLok.xy / uR;
         float rr = length(vec2(d.x * 1.3, d.y));
         float pered = smoothstep(-0.1, 0.25, vLok.z / uR);
         vec3 yantar = mix(vec3(0.96, 0.66, 0.2), vec3(0.66, 0.34, 0.08), smoothstep(0.18, 0.66, rr));
         yantar = mix(yantar, vec3(0.28, 0.15, 0.06), smoothstep(0.64, 0.74, rr));
         vec3 c = mix(vec3(0.1, 0.06, 0.04), yantar, pered);
         c = mix(c, vec3(0.03, 0.02, 0.02), (1.0 - smoothstep(0.27, 0.33, rr)) * pered);
         diffuseColor.rgb = c;`,
      )
      .replace(
        '#include <emissivemap_fragment>',
        `#include <emissivemap_fragment>
         float b1 = 1.0 - smoothstep(0.08, 0.13, length(vLok.xy / uR - vec2(-0.28, 0.32)));
         float b2 = 1.0 - smoothstep(0.03, 0.06, length(vLok.xy / uR - vec2(0.22, -0.2)));
         totalEmissiveRadiance += vec3(1.0) * (b1 * 1.6 + b2 * 0.8) * step(0.0, vLok.z);`,
      );
  };
  m.customProgramCacheKey = () => 'kotik-glaz';
  return m;
}

function materialUsov(): THREE.MeshBasicMaterial {
  const m = new THREE.MeshBasicMaterial({ color: 0xfffaf4, transparent: true, depthWrite: false });
  /* vUv нужен без карты — включаем его вручную. */
  Object.assign(m, { defines: { USE_UV: '' } });
  m.onBeforeCompile = (sh) => {
    sh.fragmentShader = sh.fragmentShader.replace(
      '#include <color_fragment>',
      `#include <color_fragment>
       /* К кончику — прозрачнее; тонкая тёплая тень по краю — видны и на светлом фоне. */
       float krai = abs(vUv.y - 0.5) * 2.0;
       diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.62, 0.52, 0.46), smoothstep(0.55, 1.0, krai) * 0.6);
       diffuseColor.a *= (1.0 - smoothstep(0.55, 1.0, vUv.x)) * 0.95;`,
    );
  };
  m.customProgramCacheKey = () => 'kotik-usy';
  return m;
}

/* ── Облако: мягкие частицы ──────────────────────────────────────── */

function oblako(): { gruppa: THREE.Group; u: { uT: { value: number }; uSvet: { value: number } } } {
  const u = { uT: { value: 0 }, uSvet: { value: 0 } };
  const N = 150;
  const geom = new THREE.InstancedBufferGeometry();
  const kvad = new THREE.PlaneGeometry(1, 1);
  geom.index = kvad.index;
  geom.setAttribute('position', kvad.attributes['position']!);
  geom.setAttribute('uv', kvad.attributes['uv']!);
  const smesh = new Float32Array(N * 3);
  const razmer = new Float32Array(N);
  const zerno = new Float32Array(N);
  let s = 7;
  const rnd = () => {
    s = (s * 16807) % 2147483647;
    return s / 2147483647;
  };
  for (let i = 0; i < N; i += 1) {
    /* Форма облака: широкий приплюснутый эллипсоид, низ плоский. */
    const a = rnd() * Math.PI * 2;
    const r = Math.sqrt(rnd());
    const x = Math.cos(a) * r * 1.05;
    const z = Math.sin(a) * r * 0.42;
    const verh = (1 - r * r) * 0.38;
    const y = -0.12 + rnd() * verh;
    smesh.set([x, y, z], i * 3);
    razmer[i] = 0.2 + rnd() * 0.26 * (1 - r * 0.4);
    zerno[i] = rnd() * 100;
  }
  geom.setAttribute('aSmesh', new THREE.InstancedBufferAttribute(smesh, 3));
  geom.setAttribute('aRazmer', new THREE.InstancedBufferAttribute(razmer, 1));
  geom.setAttribute('aZerno', new THREE.InstancedBufferAttribute(zerno, 1));
  geom.instanceCount = N;
  const mat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms: u,
    /* Предумноженная альфа: облако светится и на тёмном фоне. */
    blending: THREE.CustomBlending,
    blendSrc: THREE.OneFactor,
    blendDst: THREE.OneMinusSrcAlphaFactor,
    vertexShader: `uniform float uT; attribute vec3 aSmesh; attribute float aRazmer; attribute float aZerno;
      varying vec2 vUv; varying float vZ; varying float vY;
      void main(){
        vec3 c = aSmesh;
        c.x += sin(uT * 0.21 + aZerno) * 0.04;
        c.y += sin(uT * 0.33 + aZerno * 1.7) * 0.025;
        float dyh = 1.0 + sin(uT * 0.5 + aZerno * 0.3) * 0.05;
        vec4 mv = modelViewMatrix * vec4(c, 1.0);
        mv.xy += position.xy * aRazmer * dyh;
        vUv = uv; vZ = aZerno; vY = aSmesh.y;
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: `uniform float uT; uniform float uSvet; varying vec2 vUv; varying float vZ; varying float vY;
      ${SHUM}
      void main(){
        /* Каждая частица — пушистый клубок: шар со светом сверху и
           рваным шумом краем. */
        vec2 d = (vUv - 0.5) * 2.0;
        float r2 = dot(d, d);
        if (r2 > 1.0) discard;
        float r = sqrt(r2);
        float n = fbm3(vec3(vUv * 4.0, vZ + uT * 0.05));
        float a = 1.0 - smoothstep(0.45, 1.0, r + (n - 0.5) * 0.55);
        if (a <= 0.001) discard;
        vec3 N = normalize(vec3(d, sqrt(max(0.0, 1.0 - r2))));
        float svet = clamp(dot(N, normalize(vec3(-0.35, 0.85, 0.45))), 0.0, 1.0);
        vec3 pudra = vec3(0.99, 0.84, 0.84);
        vec3 terra = vec3(0.9, 0.58, 0.52);
        vec3 c = mix(terra, pudra, 0.3 + 0.7 * svet);
        /* Низ облака теплее и светлее, внутри — терракотовое свечение. */
        c = mix(c, vec3(1.0, 0.8, 0.68), smoothstep(0.05, -0.15, vY) * 0.35);
        c = mix(c, vec3(1.0, 0.96, 0.93), uSvet * 0.4);
        a *= 0.8;
        vec3 svechenie = vec3(1.0, 0.66, 0.5) * (1.0 - r) * 0.05 * (1.0 + uSvet);
        gl_FragColor = vec4(c * a + svechenie, a);
      }`,
  });
  const mesh = new THREE.Mesh(geom, mat);
  mesh.frustumCulled = false;
  mesh.renderOrder = 5;
  const gruppa = new THREE.Group();
  gruppa.add(mesh);
  gruppa.position.set(0, 2.75, 0.05);
  return { gruppa, u };
}

/* ── Тень и каустики ─────────────────────────────────────────────── */

function pol(): THREE.Group {
  const g = new THREE.Group();
  const ten = new THREE.Mesh(
    new THREE.PlaneGeometry(3.2, 2.6),
    new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      vertexShader: `varying vec2 vU; void main(){ vU = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.); }`,
      fragmentShader: `varying vec2 vU;
        void main(){
          vec2 d = (vU - vec2(0.5, 0.5)) * vec2(1.0, 1.25);
          float a = 1.0 - smoothstep(0.0, 0.48, length(d));
          float yadro = 1.0 - smoothstep(0.0, 0.22, length(d));
          gl_FragColor = vec4(vec3(0.45, 0.24, 0.15), a * a * 0.28 + yadro * 0.12);
        }`,
    }),
  );
  ten.rotation.x = -Math.PI / 2;
  ten.position.set(0, 0.004, 0);
  ten.renderOrder = -2;
  g.add(ten);
  /* Каустики: светлые тёплые пятна у основания стекла. */
  const kaust = new THREE.Mesh(
    new THREE.PlaneGeometry(2.6, 2.2),
    new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      /* Свет добавляется к цвету, альфа холста не трогается: на прозрачном
         холсте пятна ложатся светом поверх страницы, без чёрной подложки. */
      blending: THREE.CustomBlending,
      blendEquation: THREE.AddEquation,
      blendSrc: THREE.OneFactor,
      blendDst: THREE.OneFactor,
      blendSrcAlpha: THREE.ZeroFactor,
      blendDstAlpha: THREE.OneFactor,
      vertexShader: `varying vec2 vU; void main(){ vU = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.); }`,
      fragmentShader: `varying vec2 vU;
        ${SHUM}
        void main(){
          vec2 p = (vU - 0.5) * vec2(2.6, 2.2);
          float s = 0.0;
          s += exp(-pow(length((p - vec2(0.62, 0.42)) * vec2(1.4, 2.6)), 2.0) * 3.0);
          s += exp(-pow(length((p - vec2(-0.7, 0.36)) * vec2(1.6, 2.8)), 2.0) * 3.0) * 0.8;
          s += exp(-pow(length((p - vec2(0.05, 0.86)) * vec2(2.4, 4.0)), 2.0) * 3.0) * 0.6;
          float n = smoothstep(0.35, 0.9, fbm3(vec3(p * 6.0, 1.0)));
          gl_FragColor = vec4(vec3(1.0, 0.8, 0.6) * s * (0.25 + 0.6 * n) * 0.35, 0.0);
        }`,
    }),
  );
  kaust.rotation.x = -Math.PI / 2;
  kaust.position.set(0, 0.006, 0.05);
  kaust.renderOrder = -1;
  g.add(kaust);
  return g;
}

/* ── Сцена ───────────────────────────────────────────────────────── */

/** Только треугольники, где есть мех: оболочки не тратят вершины на стекло. */
function tolkoMekh(geom: THREE.BufferGeometry, porog = 0.2): THREE.BufferGeometry {
  const mekh = geom.attributes['_mekh'];
  const index = geom.index;
  if (!mekh || !index) return geom;
  const out: number[] = [];
  for (let i = 0; i < index.count; i += 3) {
    const a = index.getX(i);
    const b = index.getX(i + 1);
    const c = index.getX(i + 2);
    if (Math.max(mekh.getX(a), mekh.getX(b), mekh.getX(c)) > porog) out.push(a, b, c);
  }
  const g = geom.clone();
  g.setIndex(out);
  return g;
}

export async function sozdatKotika(canvas: HTMLCanvasElement, opcii: KotikOpcii): Promise<Kotik3d> {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
    powerPreference: 'low-power',
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, opcii.dpr ?? 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.setClearColor(0x000000, 0);

  const scena = new THREE.Scene();
  scena.environment = okruzhenie(renderer);
  const zad = zadnik();
  if (opcii.fon) zad.fon.set(opcii.fon);
  scena.add(zad.mesh);

  const kamera = new THREE.PerspectiveCamera(26, 1, 0.1, 60);
  const cel = new THREE.Vector3(0, 1.3, 0);

  const klyuch = new THREE.DirectionalLight(0xfff0e0, 1.1);
  klyuch.position.set(-3, 6, 4);
  scena.add(klyuch);
  scena.add(new THREE.HemisphereLight(0xfff3e8, 0xc98a6a, 0.35));

  const gltf = await new GLTFLoader().loadAsync(opcii.model);
  const kotik = gltf.scene;
  /* Нормали в модели не хранятся (файл легче) — считаем при загрузке. */
  kotik.traverse((o) => {
    if (o instanceof THREE.Mesh && !o.geometry.attributes['normal'])
      o.geometry.computeVertexNormals();
  });
  /* Три четверти: тело повёрнуто к камере боком на ~28°. */
  const POVOROT_TELA = THREE.MathUtils.degToRad(28);
  kotik.rotation.y = POVOROT_TELA;
  scena.add(kotik);

  const kosti: Record<string, THREE.Bone> = {};
  kotik.traverse((o) => {
    if ((o as THREE.Bone).isBone) kosti[o.name.replace(/^k_/, '')] = o as THREE.Bone;
  });
  const pokoy = new Map<string, THREE.Euler>();
  for (const [k, b] of Object.entries(kosti)) pokoy.set(k, b.rotation.clone());

  const steklo = materialStekla();
  /* Хвост тонкий: чтобы стекло читалось тёплым, а не серебром, —
     сильнее тон и слабее зеркальность. */
  const stekloHvosta = materialStekla();
  stekloHvosta.attenuationDistance = 0.45;
  stekloHvosta.attenuationColor.set(0xffc9a6);
  stekloHvosta.envMapIntensity = 0.9;
  stekloHvosta.thickness = 0.5;
  stekloHvosta.color.set(0xffc8a8);
  const sloev = opcii.sloev ?? 24;
  const MEKH: Record<string, Omit<ParametryMekha, 'sdvig'>> = {
    golova: { dlina: 0.05, gustota: 105, zaches: 0.7, ton: 0 },
    ushi: { dlina: 0.018, gustota: 140, zaches: 0.3, ton: 0 },
    manishka: { dlina: 0.085, gustota: 85, zaches: 1.3, ton: 1 },
    lapy: { dlina: 0.02, gustota: 130, zaches: 0.6, ton: 1 },
    telo: { dlina: 0.045, gustota: 105, zaches: 0.8, ton: 0 },
  };
  const mekhovye: THREE.Mesh[] = [];
  const veki: THREE.Mesh[] = [];
  const rabota: { m: THREE.Mesh; mat: THREE.Material }[] = [];
  kotik.traverse((o) => {
    if (!(o instanceof THREE.Mesh)) return;
    const imya = o.name;
    if (imya === 'telo') rabota.push({ m: o, mat: steklo });
    else if (imya === 'hvost') rabota.push({ m: o, mat: stekloHvosta });
    else if (imya.startsWith('glaz')) rabota.push({ m: o, mat: materialGlaza(0.132) });
    else if (imya === 'nos')
      rabota.push({
        m: o,
        mat: new THREE.MeshPhysicalMaterial({ color: 0xe8939a, roughness: 0.35, clearcoat: 0.4 }),
      });
    else if (imya === 'rot')
      rabota.push({
        m: o,
        mat: new THREE.MeshStandardMaterial({ color: 0x5a3c34, roughness: 0.8 }),
      });
    else if (imya === 'usy') {
      o.renderOrder = 6;
      rabota.push({ m: o, mat: materialUsov() });
    } else if (imya.startsWith('veko')) {
      veki.push(o);
      rabota.push({ m: o, mat: materialVeka() });
    }
    if (imya in MEKH) mekhovye.push(o);
  });
  for (const { m, mat } of rabota) m.material = mat;

  /* Оболочки меха: основа + sloev слоёв ворса. */
  for (const m of mekhovye) {
    m.updateWorldMatrix(true, false);
    let sdvig = new THREE.Vector3();
    if (!(m instanceof THREE.SkinnedMesh)) {
      /* Сдвиг — в координатах модели (без поворота котика). */
      sdvig = m
        .getWorldPosition(new THREE.Vector3())
        .applyAxisAngle(new THREE.Vector3(0, 1, 0), -POVOROT_TELA);
    }
    const par = { ...(MEKH[m.name] as Omit<ParametryMekha, 'sdvig'>), sdvig };
    const geom = m.name === 'telo' ? tolkoMekh(m.geometry) : m.geometry;
    for (let i = 0; i <= sloev; i += 1) {
      const mat = materialMekha(i / sloev, par);
      let sloy: THREE.Mesh;
      if (m instanceof THREE.SkinnedMesh) {
        const s = new THREE.SkinnedMesh(geom, mat);
        s.bind(m.skeleton, m.bindMatrix);
        sloy = s;
      } else {
        sloy = new THREE.Mesh(geom, mat);
        sloy.position.copy(m.position);
        sloy.rotation.copy(m.rotation);
      }
      sloy.name = `${m.name}-sloy${i}`;
      sloy.renderOrder = 1;
      m.parent!.add(sloy);
    }
    if (m.name !== 'telo') m.visible = false;
  }

  const obl = oblako();
  scena.add(obl.gruppa);
  scena.add(pol());

  /* ── Позы ── */
  let az = 0;
  let el = 0;
  let glad = 0;
  let gladCel = 0;
  let radost = 0;
  let radostCel = 0;
  let ruka = { x: 0.5, y: 0.4 };
  let morganie = 0;
  let sleduyusheeMorganie = 2.5;
  const kost = (k: string) => kosti[k];

  function poza(t: number, dt: number) {
    glad += (gladCel - glad) * Math.min(1, dt * 4);
    radost += (radostCel - radost) * Math.min(1, dt * 5);
    const vverh = Math.max(glad, radost);
    for (const [k, b] of Object.entries(kosti)) {
      const p = pokoy.get(k);
      if (p) b.rotation.copy(p);
    }
    const dyh = Math.sin(t * 1.6);
    const grud = kost('grud');
    if (grud) grud.scale.setScalar(1 + dyh * 0.01);
    const pozv = kost('pozvonochnik');
    if (pozv) pozv.rotation.x += dyh * 0.008;
    /* Голова повёрнута к зрителю; грустно наклонена вниз и вбок.
       При ласке — чуть вверх и к руке, ушки остаются сложенными. */
    const golova = kost('golova');
    const sheya = kost('sheya');
    const kRuke = (ruka.x - 0.5) * 2;
    if (golova) {
      /* Голова — тоже на три четверти, чуть ближе к зрителю, чем тело. */
      golova.rotation.y += -POVOROT_TELA * 0.3 + kRuke * 0.12 * glad;
      golova.rotation.x += 0.2 * (1 - vverh) - 0.1 * vverh + Math.sin(t * 0.7) * 0.012;
      golova.rotation.z += 0.14 * (1 - vverh) - kRuke * 0.12 * glad + Math.sin(t * 0.5) * 0.015;
    }
    if (sheya) sheya.rotation.x += 0.06 * (1 - vverh) - 0.05 * vverh;
    for (let i = 1; i <= 5; i += 1) {
      const b = kost(`hvost${i}`);
      if (!b) continue;
      b.rotation.y += Math.sin(t * 0.8 - i * 0.6) * 0.03 * (i / 5) - glad * 0.015 * i;
      b.rotation.x += Math.sin(t * 0.6 - i * 0.5) * 0.012 * (i / 5);
    }
    if (t > sleduyusheeMorganie) {
      morganie = 1;
      sleduyusheeMorganie = t + 3 + Math.random() * 3;
    }
    morganie = Math.max(0, morganie - dt * 7);
    const zakryto = Math.max(Math.sin(morganie * Math.PI), glad * 0.94, radost * 0.85);
    for (const v of veki) if (v.morphTargetInfluences) v.morphTargetInfluences[0] = zakryto;
    obl.u.uT.value = t;
    obl.u.uSvet.value = Math.max(glad, radost);
    obl.gruppa.position.y = 2.75 + Math.sin(t * 0.4) * 0.04;
  }

  function kameraNaMesto() {
    const r = 9.2;
    const a = THREE.MathUtils.degToRad(az);
    const e = THREE.MathUtils.degToRad(12 + el);
    kamera.position.set(
      cel.x + r * Math.sin(a) * Math.cos(e),
      cel.y + r * Math.sin(e),
      cel.z + r * Math.cos(a) * Math.cos(e),
    );
    kamera.lookAt(cel);
  }

  let proshloe = 0;
  const raycaster = new THREE.Raycaster();
  return {
    renderer,
    kadr(t) {
      const dt = proshloe === 0 ? 0.016 : Math.min(0.1, t - proshloe);
      proshloe = t;
      poza(t, dt);
      kameraNaMesto();
      renderer.render(scena, kamera);
    },
    razmer(w, h) {
      renderer.setSize(w, h, false);
      kamera.aspect = w / h;
      kamera.updateProjectionMatrix();
    },
    povorot(a, e) {
      az = THREE.MathUtils.clamp(a, -8, 8);
      el = THREE.MathUtils.clamp(e, -8, 8);
    },
    glazhu(sila, r) {
      gladCel = THREE.MathUtils.clamp(sila, 0, 1);
      if (r) ruka = r;
    },
    rad(sila) {
      radostCel = THREE.MathUtils.clamp(sila, 0, 1);
    },
    fon(cvet) {
      zad.fon.set(cvet);
    },
    popal(x, y) {
      raycaster.setFromCamera(new THREE.Vector2(x * 2 - 1, -(y * 2 - 1)), kamera);
      const hits = raycaster.intersectObjects(kotik.children, true);
      for (const h of hits) {
        const n = h.object.name;
        if (n.startsWith('golova') || n.startsWith('ushi')) return 'golova';
        if (n.startsWith('telo') || n.startsWith('manishka')) return 'spina';
      }
      return null;
    },
    ubrat() {
      renderer.dispose();
      scena.traverse((o) => {
        if (o instanceof THREE.Mesh) {
          o.geometry.dispose();
          const m = o.material as THREE.Material | THREE.Material[];
          (Array.isArray(m) ? m : [m]).forEach((x) => x.dispose());
        }
      });
    },
  };
}
