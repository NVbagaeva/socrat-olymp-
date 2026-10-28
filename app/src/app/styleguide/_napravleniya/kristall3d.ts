/**
 * Стеклянный кристалл героя — живая модель для демо направлений
 * (/styleguide/steklo, /styleguide/chertyozh).
 *
 * Та же фигура, что на рендере героя: правильная шестиугольная усечённая
 * пирамида, синее стекло, светлые рёбра, тёплая кромка справа, внутри —
 * высота пунктиром, апофема основания и прямой угол между ними.
 *
 * Модуль тянет three.js, поэтому импортируется только динамически — по
 * первому касанию кристалла (Kristall.tsx). На первую загрузку страницы
 * он не влияет.
 */

import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

/** Радиус нижнего основания, верхнего и высота — в долях нижнего. */
const R = 1;
const r = 0.47;
const H = 1.12;

/** Точки фигуры, к которым крепятся подписи. */
export type TochkaId = 'h' | 'a' | 'ugol';

export interface Kristall3d {
  /** Ракурс: азимут и подъём взгляда, градусы. */
  vid: (az: number, el: number) => void;
  /** Экранные координаты точек подписей, доли ширины и высоты холста. */
  tochki: () => Record<TochkaId, { x: number; y: number }>;
  razmer: () => void;
  ubrat: () => void;
}

export function sozdatKristall(host: HTMLElement, az: number, el: number): Kristall3d {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.domElement.setAttribute('aria-hidden', 'true');
  host.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  const okruzhenie = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environment = okruzhenie;

  const kamera = new THREE.PerspectiveCamera(28, 1, 0.1, 50);

  const forma = new THREE.CylinderGeometry(r, R, H, 6, 1, false);
  /* Грань, а не ребро, смотрит на зрителя — как на рендере. */
  forma.rotateY(Math.PI / 6);
  const grani = forma.toNonIndexed();
  grani.computeVertexNormals();

  /* Стекло в два прохода: сначала дальние грани тёмным, потом ближние
     прозрачным синим с лаком — так стекло читается объёмным и на светлом
     фоне не выцветает. */
  const zad = new THREE.MeshPhysicalMaterial({
    color: 0x05207a,
    roughness: 0.1,
    transparent: true,
    opacity: 1,
    side: THREE.BackSide,
    envMapIntensity: 0.3,
  });
  const pered = new THREE.MeshPhysicalMaterial({
    color: 0x0b46d8,
    roughness: 0.02,
    clearcoat: 1,
    clearcoatRoughness: 0.02,
    transparent: true,
    opacity: 0.8,
    side: THREE.FrontSide,
    envMapIntensity: 0.35,
  });
  const gruppa = new THREE.Group();
  const meshZad = new THREE.Mesh(grani, zad);
  meshZad.renderOrder = 1;
  const meshPered = new THREE.Mesh(grani, pered);
  meshPered.renderOrder = 3;
  gruppa.add(meshZad, meshPered);

  /* Рёбра сквозь стекло — тонко, и фаски поверх — трубками. */
  const ryobra = new THREE.EdgesGeometry(forma, 10);
  const linii = new THREE.LineSegments(
    ryobra,
    new THREE.LineBasicMaterial({
      color: 0x9bc0f2,
      transparent: true,
      opacity: 0.45,
      depthTest: false,
    }),
  );
  linii.renderOrder = 4;
  gruppa.add(linii);

  const faska = new THREE.MeshPhysicalMaterial({
    color: 0x9bc0f2,
    emissive: 0x3d79e0,
    emissiveIntensity: 0.4,
    roughness: 0.05,
    clearcoat: 1,
    transparent: true,
    opacity: 0.75,
    envMapIntensity: 1.2,
  });
  const tyoplaya = new THREE.MeshPhysicalMaterial({
    color: 0xffb070,
    emissive: 0xe07a2f,
    emissiveIntensity: 0.9,
    roughness: 0.1,
    transparent: true,
    opacity: 0.95,
  });
  const vverkh = new THREE.Vector3(0, 1, 0);
  const pos = ryobra.attributes.position as THREE.BufferAttribute;
  const truby: THREE.BufferGeometry[] = [];
  for (let i = 0; i < pos.count; i += 2) {
    const a = new THREE.Vector3().fromBufferAttribute(pos, i);
    const b = new THREE.Vector3().fromBufferAttribute(pos, i + 1);
    const truba = new THREE.CylinderGeometry(0.009, 0.009, a.distanceTo(b), 8, 1, true);
    truby.push(truba);
    /* Тёплая кромка — боковые рёбра справа, как подсветка на рендере. */
    const bokovoeSprava = a.x > 0.3 && b.x > 0.3 && Math.abs(a.y - b.y) > 0.5;
    const m = new THREE.Mesh(truba, bokovoeSprava ? tyoplaya : faska);
    m.position.copy(a).add(b).multiplyScalar(0.5);
    m.quaternion.setFromUnitVectors(vverkh, b.clone().sub(a).normalize());
    m.renderOrder = 4;
    gruppa.add(m);
  }

  /* Построение внутри: высота, апофема основания, прямой угол. */
  const shtrikh = new THREE.LineDashedMaterial({
    color: 0xffffff,
    dashSize: 0.05,
    gapSize: 0.035,
    transparent: true,
    opacity: 0.9,
    depthTest: false,
  });
  const niz = -H / 2;
  /* Апофема — к середине правой передней стороны основания: на рендере
     пунктир уходит туда же. */
  const apofema = new THREE.Vector3(Math.sin(Math.PI / 3), 0, Math.cos(Math.PI / 3)).multiplyScalar(
    R * Math.cos(Math.PI / 6),
  );
  const otrezok = (tochki: THREE.Vector3[], mat: THREE.Material) => {
    const g = new THREE.BufferGeometry().setFromPoints(tochki);
    const l = new THREE.Line(g, mat);
    l.computeLineDistances();
    l.renderOrder = 2;
    gruppa.add(l);
    return g;
  };
  const s = 0.09;
  const ugolMat = new THREE.LineBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.9,
    depthTest: false,
  });
  const postroenie = [
    otrezok([new THREE.Vector3(0, H / 2, 0), new THREE.Vector3(0, niz, 0)], shtrikh),
    otrezok([new THREE.Vector3(0, niz, 0), apofema.clone().setY(niz)], shtrikh),
    otrezok(
      [
        apofema.clone().setLength(s).setY(niz),
        apofema
          .clone()
          .setLength(s)
          .setY(niz + s),
        new THREE.Vector3(0, niz + s, 0),
      ],
      ugolMat,
    ),
  ];
  scene.add(gruppa);

  const tyoplyySvet = new THREE.DirectionalLight(0xff9a4a, 2.2);
  tyoplyySvet.position.set(3, 1.5, -2);
  const klyuchevoy = new THREE.DirectionalLight(0xffffff, 1.2);
  klyuchevoy.position.set(-2, 3, 3);
  scene.add(tyoplyySvet, klyuchevoy, new THREE.AmbientLight(0x9bc0f2, 0.4));

  /* Точки подписей в координатах фигуры. */
  const TOCHKI: Record<TochkaId, THREE.Vector3> = {
    h: new THREE.Vector3(0, 0.12, 0),
    a: apofema.clone().setY(niz),
    ugol: new THREE.Vector3(0, niz, 0),
  };

  let A = az;
  let E = el;
  const narisovat = () => {
    const d = 5.2;
    const a = (A * Math.PI) / 180;
    const e = (E * Math.PI) / 180;
    kamera.position.set(
      d * Math.sin(a) * Math.cos(e),
      d * Math.sin(e),
      d * Math.cos(a) * Math.cos(e),
    );
    kamera.lookAt(0, -0.16, 0);
    renderer.render(scene, kamera);
  };
  const razmer = () => {
    const w = Math.max(1, host.clientWidth);
    const h = Math.max(1, host.clientHeight);
    renderer.setSize(w, h, false);
    kamera.aspect = w / h;
    kamera.updateProjectionMatrix();
    narisovat();
  };
  razmer();

  return {
    vid(az2, el2) {
      A = az2;
      E = el2;
      narisovat();
    },
    tochki() {
      const v = new THREE.Vector3();
      const out = {} as Record<TochkaId, { x: number; y: number }>;
      for (const id of Object.keys(TOCHKI) as TochkaId[]) {
        v.copy(TOCHKI[id]).project(kamera);
        out[id] = { x: (v.x + 1) / 2, y: (1 - v.y) / 2 };
      }
      return out;
    },
    razmer,
    ubrat() {
      for (const g of [forma, grani, ryobra, ...truby, ...postroenie]) g.dispose();
      for (const m of [zad, pered, faska, tyoplaya, shtrikh, ugolMat, linii.material]) {
        (m as THREE.Material).dispose();
      }
      okruzhenie.dispose();
      pmrem.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    },
  };
}
