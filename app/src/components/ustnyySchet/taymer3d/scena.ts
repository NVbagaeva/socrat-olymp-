/**
 * 3D-кольцо таймера на three.js: стеклянная трубка из синего
 * полупрозрачного стекла с тёплой оранжевой подсветкой сзади — в стиле
 * иллюстраций сайта (как кристалл главной, components/landing/kristall).
 *
 * Модуль тяжёлый (three.js) и грузится только динамическим import()
 * на экране тренировки (Taymer3d.tsx) — в первую загрузку страниц он
 * не попадает.
 *
 * Кадр рисуется только по вызову kadr(): своего цикла анимации нет.
 * Что рисовать, решает время (lib/ustnyySchet/taymer.ts), а не число
 * кадров; скрытая вкладка кадров не просит — рендер стоит.
 *
 * Кольцо «тает» без пересборки геометрии: трубка вдоль окружности
 * строится один раз, а видимая дуга — это диапазон индексов
 * (setDrawRange): у TubeGeometry треугольники идут вдоль пути.
 */

import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import type { TaymerKadr } from '@/lib/ustnyySchet/taymer';

export interface Kolco3d {
  /** Нарисовать кадр; vspyshka — сила вспышки на нуле, 0…1. */
  kadr: (k: TaymerKadr, vspyshka: number) => void;
  /** Размер холста в CSS-пикселях. */
  razmer: (px: number) => void;
  ubrat: () => void;
}

const R = 1;
const TRUBKA = 0.17;
const DUGA = 192;
const SECHENIE = 20;

const SINIY = new THREE.Color(0x0b46d8);
const TYOPLYY = new THREE.Color(0xe07a2f);

/** Окружность в плоскости XY: от верхней точки по часовой стрелке. */
class Okruzhnost extends THREE.Curve<THREE.Vector3> {
  /* У Curve конструктор защищённый — открываем. */
  constructor() {
    super();
  }

  override getPoint(t: number, target = new THREE.Vector3()): THREE.Vector3 {
    const a = Math.PI / 2 - t * 2 * Math.PI;
    return target.set(R * Math.cos(a), R * Math.sin(a), 0);
  }
}

export function sozdatKolco(host: HTMLElement, onPoteryan: () => void): Kolco3d {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  const canvas = renderer.domElement;
  canvas.setAttribute('aria-hidden', 'true');
  canvas.className = 'us-taymer__canvas';
  host.appendChild(canvas);

  const poteryan = (e: Event) => {
    e.preventDefault();
    onPoteryan();
  };
  canvas.addEventListener('webglcontextlost', poteryan);

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  const okruzhenie = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environment = okruzhenie;

  const kamera = new THREE.PerspectiveCamera(30, 1, 0.1, 20);
  kamera.position.set(0, 0, 5);
  kamera.lookAt(0, 0, 0);

  /* Лёгкий наклон: кольцо читается объёмным, но остаётся кругом. */
  const gruppa = new THREE.Group();
  gruppa.rotation.x = -0.32;
  gruppa.rotation.y = 0.18;
  scene.add(gruppa);

  /* Дорожка — весь круг, едва заметное стекло. */
  const dorozhkaGeo = new THREE.TorusGeometry(R, TRUBKA * 0.55, 12, 96);
  const dorozhkaMat = new THREE.MeshPhysicalMaterial({
    color: 0x9bc0f2,
    roughness: 0.3,
    transparent: true,
    opacity: 0.22,
    depthWrite: false,
  });
  const dorozhka = new THREE.Mesh(dorozhkaGeo, dorozhkaMat);
  dorozhka.renderOrder = 0;
  gruppa.add(dorozhka);

  /* Кольцо: два прохода, как у кристалла — дальние грани тёмным,
     ближние прозрачным синим с лаком. */
  const geo = new THREE.TubeGeometry(new Okruzhnost(), DUGA, TRUBKA, SECHENIE, false);
  const zadMat = new THREE.MeshPhysicalMaterial({
    color: 0x05207a,
    roughness: 0.1,
    transparent: true,
    opacity: 0.85,
    side: THREE.BackSide,
    envMapIntensity: 0.3,
  });
  const peredMat = new THREE.MeshPhysicalMaterial({
    color: SINIY.clone(),
    emissive: TYOPLYY.clone(),
    emissiveIntensity: 0.05,
    roughness: 0.03,
    clearcoat: 1,
    clearcoatRoughness: 0.03,
    transparent: true,
    opacity: 0.82,
    envMapIntensity: 0.45,
  });
  const zad = new THREE.Mesh(geo, zadMat);
  zad.renderOrder = 1;
  const pered = new THREE.Mesh(geo, peredMat);
  pered.renderOrder = 2;
  const duga = new THREE.Group();
  duga.add(zad, pered);
  gruppa.add(duga);

  /* Торцы дуги — полусферы того же стекла, чтобы не было видно дыр. */
  const torecGeo = new THREE.SphereGeometry(TRUBKA, 20, 12);
  const torecA = new THREE.Mesh(torecGeo, peredMat);
  const torecB = new THREE.Mesh(torecGeo, peredMat);
  torecA.renderOrder = 2;
  torecB.renderOrder = 2;
  duga.add(torecA, torecB);

  /* Свет: тёплый сзади справа (подсветка), белый ключевой, голубой фон. */
  const tyoplyySvet = new THREE.DirectionalLight(0xff9a4a, 2.2);
  tyoplyySvet.position.set(3, 1.5, -2);
  const klyuchevoy = new THREE.DirectionalLight(0xffffff, 1.2);
  klyuchevoy.position.set(-2, 3, 3);
  const fon = new THREE.AmbientLight(0x9bc0f2, 0.45);
  scene.add(tyoplyySvet, klyuchevoy, fon);

  const pointOn = new Okruzhnost();
  const tochka = new THREE.Vector3();
  const vsego = geo.index?.count ?? 0;
  const naSegment = vsego / DUGA;
  let kadrov = 0;

  return {
    kadr(k, vsp) {
      const segmentov = Math.round(k.dolya * DUGA);
      geo.setDrawRange(0, segmentov * naSegment);
      const vidno = segmentov > 0;
      torecA.visible = vidno;
      torecB.visible = vidno;
      torecA.position.copy(pointOn.getPoint(0, tochka));
      torecB.position.copy(pointOn.getPoint(segmentov / DUGA, tochka));
      /* Секундомер медленно вращается; таймер на время стоит. */
      duga.rotation.z = (-k.oborot * Math.PI) / 180;

      const teplo = Math.min(1, k.teplo * (0.65 + 0.35 * k.puls) + vsp);
      peredMat.color.copy(SINIY).lerp(TYOPLYY, teplo * 0.75);
      peredMat.emissiveIntensity = 0.05 + teplo * (0.25 + 0.35 * k.puls) + vsp * 1.4;
      tyoplyySvet.intensity = 2.2 * (1 + k.teplo * 0.6 * k.puls) + vsp * 4;
      renderer.render(scene, kamera);
      /* Счётчик кадров — для проверки «на скрытой вкладке рендер стоит». */
      kadrov += 1;
      canvas.dataset.kadrov = String(kadrov);
    },
    razmer(px) {
      const s = Math.max(1, Math.round(px));
      renderer.setSize(s, s, false);
      kamera.aspect = 1;
      kamera.updateProjectionMatrix();
    },
    ubrat() {
      canvas.removeEventListener('webglcontextlost', poteryan);
      for (const g of [dorozhkaGeo, geo, torecGeo]) g.dispose();
      for (const m of [dorozhkaMat, zadMat, peredMat]) m.dispose();
      okruzhenie.dispose();
      pmrem.dispose();
      renderer.dispose();
      canvas.remove();
    },
  };
}
