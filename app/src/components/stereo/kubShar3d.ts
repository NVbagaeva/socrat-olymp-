/**
 * Обложка №3 — живая модель: стеклянный куб с вписанным шаром, как на
 * картинке public/images/zadaniya/3/kub-shar-*.webp (синие рёбра,
 * тёплая кромка справа и сверху, бесцветный шар внутри).
 *
 * Модуль тянет three.js, поэтому импортируется только динамически — по
 * первому касанию обложки (ObjomnayaOblozhka). На первую загрузку
 * страницы он не влияет.
 */

import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import type { Model3d } from '@/components/tasks/stsena';

/** Ребро куба и радиус вписанного шара. */
const A = 1;
const R = A / 2;
/** Угол обзора и расстояние камеры — подобраны под картинку. */
const FOV = 24;
const DIST = 4.75;

export function sozdat(host: HTMLElement, az: number, el: number): Model3d {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  /* Холст прозрачный: за ним свечение карточки (stsena.css). */
  renderer.setClearColor(0x000000, 0);
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.toneMappingExposure = 1.15;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.domElement.setAttribute('aria-hidden', 'true');
  host.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  const okruzhenie = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environment = okruzhenie;

  const kamera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 50);
  const gruppa = new THREE.Group();

  /* Грани куба: дальние — чуть плотнее синим, ближние — почти прозрачным
     голубым с лаком. Так стекло читается объёмным на светлом фоне. */
  const kub = new THREE.BoxGeometry(A, A, A);
  const zad = new THREE.MeshPhysicalMaterial({
    color: 0x1f5fd0,
    roughness: 0.08,
    transparent: true,
    opacity: 0.12,
    side: THREE.BackSide,
    envMapIntensity: 0.4,
    depthWrite: false,
  });
  const pered = new THREE.MeshPhysicalMaterial({
    color: 0xdbe8ff,
    roughness: 0.02,
    clearcoat: 1,
    clearcoatRoughness: 0.03,
    transparent: true,
    opacity: 0.16,
    side: THREE.FrontSide,
    envMapIntensity: 0.5,
    depthWrite: false,
  });
  const meshZad = new THREE.Mesh(kub, zad);
  meshZad.renderOrder = 1;
  const meshPered = new THREE.Mesh(kub, pered);
  meshPered.renderOrder = 4;
  gruppa.add(meshZad, meshPered);

  /* Шар: бесцветное стекло с бликом; задняя половина — тонкой голубой
     подкладкой, чтобы шар не терялся. */
  const sharForma = new THREE.SphereGeometry(R, 64, 48);
  const sharZad = new THREE.MeshPhysicalMaterial({
    color: 0x3d79e0,
    roughness: 0.1,
    transparent: true,
    opacity: 0.22,
    side: THREE.BackSide,
    envMapIntensity: 0.5,
    depthWrite: false,
  });
  const sharPered = new THREE.MeshPhysicalMaterial({
    color: 0xeaf2ff,
    roughness: 0.02,
    metalness: 0,
    transmission: 1,
    thickness: 0.3,
    ior: 1.4,
    attenuationColor: new THREE.Color(0x5d8ce8),
    attenuationDistance: 0.9,
    clearcoat: 1,
    clearcoatRoughness: 0,
    envMapIntensity: 0.9,
    side: THREE.FrontSide,
  });
  const meshSharZad = new THREE.Mesh(sharForma, sharZad);
  meshSharZad.renderOrder = 2;
  const meshSharPered = new THREE.Mesh(sharForma, sharPered);
  meshSharPered.renderOrder = 3;
  gruppa.add(meshSharZad, meshSharPered);

  /* Рёбра — трубками: синие, а справа и сверху — тёплая кромка, как
     подсветка на картинке. */
  const ryobra = new THREE.EdgesGeometry(kub, 1);
  const sinyaya = new THREE.MeshPhysicalMaterial({
    color: 0x1a4fb0,
    emissive: 0x0b46d8,
    emissiveIntensity: 0.3,
    roughness: 0.55,
    metalness: 0,
    clearcoat: 0.6,
    envMapIntensity: 0.15,
  });
  const tyoplaya = new THREE.MeshPhysicalMaterial({
    color: 0xe8863a,
    emissive: 0xe07a2f,
    emissiveIntensity: 0.6,
    roughness: 0.55,
    clearcoat: 0.6,
    envMapIntensity: 0.15,
  });
  const vverkh = new THREE.Vector3(0, 1, 0);
  const pos = ryobra.attributes.position as THREE.BufferAttribute;
  const truby: THREE.BufferGeometry[] = [];
  for (let i = 0; i < pos.count; i += 2) {
    const a = new THREE.Vector3().fromBufferAttribute(pos, i);
    const b = new THREE.Vector3().fromBufferAttribute(pos, i + 1);
    const truba = new THREE.CylinderGeometry(0.026, 0.026, a.distanceTo(b), 12, 1, true);
    truby.push(truba);
    const sered = a.clone().add(b).multiplyScalar(0.5);
    /* Тёплые — дальние рёбра справа и сверху: верхнее правое, верхнее
       заднее, правое заднее вертикальное и нижнее правое — как подсветка
       на картинке. */
    const tyoploe =
      (sered.x > 0.4 && Math.abs(sered.y) > 0.4) ||
      (sered.y > 0.4 && sered.z < -0.4) ||
      (sered.x > 0.4 && sered.z < -0.4);
    const m = new THREE.Mesh(truba, tyoploe ? tyoplaya : sinyaya);
    m.position.copy(sered);
    m.quaternion.setFromUnitVectors(vverkh, b.clone().sub(a).normalize());
    m.renderOrder = 5;
    gruppa.add(m);
  }
  /* Белая нить блика вдоль каждой трубки — глянец стекла, как на картинке. */
  const blikLinii = new THREE.LineSegments(
    ryobra,
    new THREE.LineBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.45,
      depthTest: false,
    }),
  );
  blikLinii.renderOrder = 6;
  gruppa.add(blikLinii);
  scene.add(gruppa);

  const tyoplyySvet = new THREE.DirectionalLight(0xff9a4a, 1.6);
  tyoplyySvet.position.set(3, 2.5, -1);
  const klyuchevoy = new THREE.DirectionalLight(0xffffff, 1.6);
  klyuchevoy.position.set(-2, 3, 3);
  /* Точечный блик — яркое пятно на шаре, как на картинке. */
  const blik = new THREE.PointLight(0xffffff, 40, 0, 2);
  blik.position.set(-1.6, 2.6, 2.2);
  scene.add(tyoplyySvet, klyuchevoy, blik, new THREE.AmbientLight(0xdbe8ff, 0.35));

  let AZ = az;
  let EL = el;
  const narisovat = () => {
    const a = (AZ * Math.PI) / 180;
    const e = (EL * Math.PI) / 180;
    kamera.position.set(
      DIST * Math.sin(a) * Math.cos(e),
      DIST * Math.sin(e),
      DIST * Math.cos(a) * Math.cos(e),
    );
    kamera.lookAt(0, 0, 0);
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
      AZ = az2;
      EL = el2;
      narisovat();
    },
    razmer,
    ubrat() {
      for (const g of [kub, sharForma, ryobra, ...truby]) g.dispose();
      for (const m of [zad, pered, sharZad, sharPered, sinyaya, tyoplaya]) m.dispose();
      blikLinii.material.dispose();
      okruzhenie.dispose();
      pmrem.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    },
  };
}
