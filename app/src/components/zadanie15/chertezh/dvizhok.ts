/**
 * Движок чертежа задания №15: three.js + рисунок линий поверх.
 *
 * Модуль тяжёлый (three.js, KaTeX, ядро) и грузится отдельным файлом
 * через import() только на страницах /zadaniya/15/…: на остальных
 * страницах сайта его нет.
 *
 * Как устроен кадр:
 *   — камера и OrbitControls (инерция, масштаб, сдвиг) — three.js;
 *   — «Школьный чертёж»: камера всегда параллельная (ортографическая),
 *     параллельные рёбра и следы в параллельных гранях остаются
 *     параллельными на экране; фон белый, рёбра тонкие чёрные;
 *   — «3D»: центральная проекция, мягкий свет, полупрозрачные грани
 *     (WebGL со сглаживанием);
 *   — все линии (рёбра, стороны сечения, вспомогательные прямые и их
 *     продолжения) рисуются в SVG поверх холста: видимость считается
 *     на каждом повороте (lib/zadanie15/render/vidimost), невидимые
 *     куски — штрихом. Так штрих точный и одинаковый в обоих режимах;
 *   — подписи — HTML с KaTeX, всегда лицом к зрителю, раскладываются
 *     заново на каждом кадре, чтобы не налезать на линии и друг на друга.
 *
 * Кадр рисуется только когда что-то меняется (вращение, инерция,
 * анимация): в покое движок ничего не считает.
 *
 * Инструмент «Сечение по трём точкам» (lib/zadanie15/render/instrument):
 * короткое нажатие без сдвига (щелчок, тап) — выбор точки: имеющейся
 * (вершина, поставленная точка), новой на ребре или на лицевой грани.
 * Вращение пальцем или мышью выбором не считается.
 */

import katex from 'katex';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import {
  type P2,
  type V,
  add,
  centroid,
  dot,
  lerp,
  norm,
  scale,
  sub,
} from '@/lib/zadanie15/render/geom';
import { type Polyhedron, box, cube, toArray } from '@/lib/zadanie15/core';
import { chertezhSvg, naturalnayaSvg } from '@/lib/zadanie15/render/eksport';
import { type Soobshchenie, SechenieTryokhTochek } from '@/lib/zadanie15/render/instrument';
import { razlozhit } from '@/lib/zadanie15/render/metki';
import { type Naturalnaya, naturalnaya } from '@/lib/zadanie15/render/naturalnaya';
import { PRIMERY, primer } from '@/lib/zadanie15/render/primery';
import { type Chasti, razrezat } from '@/lib/zadanie15/render/razrez';
import {
  type Gran,
  type Otrezok,
  type Scena,
  type Telo,
  shkolnyyRakurs,
  teloIzMnogogrannika,
  vTele,
} from '@/lib/zadanie15/render/scena';
import { type Kamera, type Liniya, licom, linii } from '@/lib/zadanie15/render/vidimost';

export { PRIMERY };

export type Rezhim = 'shkola' | '3d';
export type StandartnyyVid = 'shkola' | 'speredi' | 'sverhu' | 'sboku';

/** Школьный ракурс: чуть справа и сверху, грань AA_1B_1B — спереди. */
const VIDY: Record<StandartnyyVid, V> = {
  shkola: norm([0.42, -1, 0.5]),
  speredi: norm([0, -1, 0.0001]),
  sverhu: norm([0.0001, -0.002, 1]),
  sboku: norm([1, 0, 0.0001]),
};
const FOV = 35;
/** «Почти параллельная» центральная проекция — начало и конец перехода. */
const FOV_MIN = 1.5;
const SVG_NS = 'http://www.w3.org/2000/svg';

const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
const v3 = (v: V) => new THREE.Vector3(v[0], v[1], v[2]);
const arr = (v: THREE.Vector3): V => [v.x, v.y, v.z];

interface Anim {
  start: number;
  dur: number;
  step: (t: number) => void;
  done?: () => void;
}

interface Podpis {
  el: HTMLElement;
  w: number;
  h: number;
  dir?: number;
}

export interface Tsveta {
  liniya: string;
  liniya3d: string;
  sechenie: string;
  vspom: string;
  ploskost: string;
  gran: string;
}

/** Фигуры инструмента «Сечение по трём точкам». */
export type Figura = 'kub' | 'parallelepiped';
const FIGURY: Record<Figura, () => Polyhedron> = {
  kub: () => cube(6),
  parallelepiped: () => box(4, 6, 3),
};

/** Состояние инструмента для панели (тексты уже набраны KaTeX). */
export interface SostoyanieInstrumenta {
  schyot: number;
  podskazkaHtml: string;
  soobshchenie: { vid: Soobshchenie['vid']; html: string } | null;
  gotovo: boolean;
}

/** Текст с формулами в $…$ → HTML (KaTeX). */
export function texHtml(s: string): string {
  return s
    .split(/(\$[^$]+\$)/)
    .map((part) =>
      part.startsWith('$') && part.endsWith('$') && part.length > 1
        ? katex.renderToString(part.slice(1, -1), { throwOnError: false })
        : part.replace(/&/g, '&amp;').replace(/</g, '&lt;'),
    )
    .join('');
}

function tsvetaIzCss(el: HTMLElement): Tsveta {
  const cs = getComputedStyle(el);
  const v = (name: string, def: string) => cs.getPropertyValue(name).trim() || def;
  return {
    liniya: v('--z15-liniya', '#1b1f24'),
    liniya3d: v('--z15-liniya-3d', '#24324a'),
    sechenie: v('--color-accent', '#e07a2f'),
    vspom: v('--color-primary', '#1f5fd0'),
    ploskost: v('--color-primary', '#1f5fd0'),
    gran: v('--z15-gran', '#9dbcf0'),
  };
}

export class Dvizhok {
  private host: HTMLElement;
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private orto: THREE.OrthographicCamera;
  private persp: THREE.PerspectiveCamera;
  private cam: THREE.OrthographicCamera | THREE.PerspectiveCamera;
  private controls: OrbitControls;
  private svg: SVGSVGElement;
  private gFill: SVGGElement;
  private gLines: SVGGElement;
  private gDots: SVGGElement;
  private labels: HTMLDivElement;
  private tsveta: Tsveta;

  private sc: Scena | null = null;
  private chasti: Chasti | null = null;
  private podpisi: Podpis[] = [];
  private meshes: THREE.Mesh[] = [];
  private faceMat: THREE.MeshStandardMaterial;

  private rezhimTek: Rezhim = 'shkola';
  private perehod = false;
  /** Холст очищен и в школьном режиме не перерисовывается. */
  private pustoy = false;
  /** 0 — школьный чертёж, 1 — 3D (во время перехода — между). */
  private smes = 0;
  /** Раздвижка частей при разрезе, доля от размера тела. */
  private razdvig = 0;
  /** Сечение «нарисовано» на долю периметра (анимация появления). */
  private poyavlenie = 1;

  private anims: Anim[] = [];
  private raf = 0;
  private W = 1;
  private H = 1;
  private ro: ResizeObserver;
  private kadrov = 0;
  private fpsT = 0;
  private prosh = 0;
  onFps: ((fps: number) => void) | null = null;

  /** Инструмент «Сечение по трём точкам» (null — выключен). */
  private instr: SechenieTryokhTochek | null = null;
  private pokazPloskosti = true;
  /** Нажатие на холсте: где и когда началось (для отличия тапа от поворота). */
  private nazhatie: { x: number; y: number; t: number; id: number; tip: string } | null = null;
  private pal = 0;
  onInstrument: ((s: SostoyanieInstrumenta) => void) | null = null;

  constructor(host: HTMLElement) {
    this.host = host;
    this.tsveta = tsvetaIzCss(host);
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.setClearColor(0xffffff, 0);
    const canvas = this.renderer.domElement;
    canvas.className = 'z15-ch__canvas';
    host.appendChild(canvas);

    this.svg = document.createElementNS(SVG_NS, 'svg');
    this.svg.setAttribute('class', 'z15-ch__svg');
    this.svg.setAttribute('aria-hidden', 'true');
    this.gFill = document.createElementNS(SVG_NS, 'g');
    this.gLines = document.createElementNS(SVG_NS, 'g');
    this.gDots = document.createElementNS(SVG_NS, 'g');
    this.svg.append(this.gFill, this.gLines, this.gDots);
    host.appendChild(this.svg);

    this.labels = document.createElement('div');
    this.labels.className = 'z15-ch__labels';
    host.appendChild(this.labels);

    this.orto = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.01, 1000);
    this.persp = new THREE.PerspectiveCamera(FOV, 1, 0.01, 2000);
    this.orto.up.set(0, 0, 1);
    this.persp.up.set(0, 0, 1);
    this.cam = this.orto;

    this.controls = new OrbitControls(this.cam, canvas);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.09;
    this.controls.rotateSpeed = 0.9;
    this.controls.zoomSpeed = 0.9;
    this.controls.screenSpacePanning = true;
    this.controls.addEventListener('change', () => this.zapustit());
    this.controls.addEventListener('start', () => this.zapustit());
    canvas.addEventListener('pointerdown', this.naNazhatie);
    canvas.addEventListener('pointerup', this.naOtpuskanie);
    canvas.addEventListener('pointercancel', this.naOtmenuNazhatiya);

    this.scene.add(new THREE.HemisphereLight(0xffffff, 0xdbe4f2, 1.1));
    const sun = new THREE.DirectionalLight(0xffffff, 1.2);
    sun.position.set(4, -6, 9);
    this.scene.add(sun);
    this.faceMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(this.tsveta.gran),
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
      depthWrite: false,
      roughness: 0.85,
      metalness: 0,
    });

    this.ro = new ResizeObserver(() => this.razmerOkna());
    this.ro.observe(host);
    this.razmerOkna();
  }

  /* ── Сцена ────────────────────────────────────────────── */

  zadatPrimer(id: string): void {
    this.zadatScenu(primer(id).build());
  }

  zadatScenu(sc: Scena): void {
    this.sc = sc;
    this.chasti = sc.sechenie ? razrezat(sc.tela[0] as Telo, sc.sechenie, sc.razmer) : null;
    this.razdvig = 0;
    this.sobratPodpisi();
    this.sobratMeshi();
    this.razmerOkna();
    this.sbros(false);
    this.pokazatSechenie();
  }

  /** Анимация появления сечения: стороны «прорисовываются» по периметру. */
  pokazatSechenie(): void {
    this.anim(900, (t) => {
      this.poyavlenie = t;
    });
  }

  /** Разрезать тело по сечению: части раздвигаются вдоль нормали. */
  razrezat(on: boolean): void {
    if (!this.chasti) return;
    const from = this.razdvig;
    const to = on ? 0.16 : 0;
    this.anim(700, (t) => {
      this.razdvig = from + (to - from) * t;
      this.polozhitMeshi();
    });
  }

  naturalnaya(): Naturalnaya | null {
    return this.sc?.sechenie ? naturalnaya(this.sc.sechenie) : null;
  }

  /** Сечение в натуральную величину — готовый SVG для панели. */
  naturalnayaSvg(): string {
    const nv = this.naturalnaya();
    return nv ? naturalnayaSvg(nv) : '';
  }

  /* ── Сечение по трём точкам ───────────────────────────── */

  /** Включить инструмент на фигуре: выбор начинается заново. */
  vklyuchitSechenie(figura: Figura): void {
    this.instr = new SechenieTryokhTochek(FIGURY[figura]());
    this.razdvig = 0;
    this.primenitInstrument(true);
  }

  /** Выключить инструмент (сцену затем задаёт страница). */
  vyklyuchitSechenie(): void {
    this.instr = null;
  }

  get instrument(): SechenieTryokhTochek | null {
    return this.instr;
  }

  otmenitTochku(): void {
    if (!this.instr) return;
    this.instr.otmenit();
    this.primenitInstrument(false);
  }

  sbrositTochki(): void {
    if (!this.instr) return;
    this.instr.sbrosit();
    this.primenitInstrument(false);
  }

  /** Показать или скрыть секущую плоскость; сечение остаётся. */
  pokazatPloskost(on: boolean): void {
    this.pokazPloskosti = on;
    this.zapustit();
  }

  /**
   * Выбор точки в точке экрана (px от левого верхнего угла окна).
   * Порядок: имеющаяся точка рядом → ребро рядом → лицевая грань.
   * true — что-то изменилось.
   */
  vybratVTochke(x: number, y: number, palec = false): boolean {
    const ins = this.instr;
    if (!ins) return false;
    const R = palec ? 22 : 12;
    const was = ins.schyot;
    const hadItog = ins.itog !== null;
    // 1. Имеющиеся точки.
    let best: { id: string; d: number } | null = null;
    for (const t of ins.tochki()) {
      const q = this.ekran(t.p);
      const d = Math.hypot(q[0] - x, q[1] - y);
      if (d < R && (best === null || d < best.d)) best = { id: t.id, d };
    }
    if (best) {
      ins.vzyat(best.id);
    } else if (!this.vybratNaRebre(ins, x, y, R * 0.8)) {
      this.vybratNaGrani(ins, x, y);
    }
    const changed = ins.schyot !== was || (ins.itog !== null) !== hadItog;
    this.primenitInstrument(false, !hadItog && ins.itog !== null);
    return changed;
  }

  /* ── Режимы и виды ────────────────────────────────────── */

  get rezhim(): Rezhim {
    return this.rezhimTek;
  }

  /**
   * Плавный переход между режимами без сброса ракурса: «наезд с
   * зумом» — угол обзора растёт от почти нуля (почти параллельная
   * проекция) до 35°, а камера отъезжает так, что размер фигуры на
   * экране не меняется. Обратно — то же в обратную сторону, в конце
   * — снова точная параллельная проекция.
   */
  ustanovitRezhim(r: Rezhim): void {
    if (r === this.rezhimTek || this.perehod) return;
    this.rezhimTek = r;
    this.perehod = true;
    const target = this.controls.target.clone();
    const dir = this.cam.position.clone().sub(target).normalize();
    const halfH = this.vidimayaPolovina();
    const [f0, f1] = r === '3d' ? [FOV_MIN, FOV] : [FOV, FOV_MIN];
    this.controls.enabled = false;
    this.ustanovitKameru(this.persp);
    this.anim(
      650,
      (t) => {
        const fov = f0 + (f1 - f0) * t;
        this.persp.fov = fov;
        const d = halfH / Math.tan(THREE.MathUtils.degToRad(fov / 2));
        this.persp.position.copy(target).addScaledVector(dir, d);
        this.persp.near = Math.max(d / 100, 0.01);
        this.persp.far = d * 10;
        this.persp.updateProjectionMatrix();
        this.smes = r === '3d' ? t : 1 - t;
        this.faceMat.opacity = 0.3 * this.smes;
      },
      () => {
        if (r === 'shkola') {
          this.ustanovitKameru(this.orto);
          this.orto.zoom = this.orto.top / halfH;
          this.orto.position.copy(target).addScaledVector(dir, this.sc ? this.sc.razmer * 6 : 10);
          this.orto.updateProjectionMatrix();
        }
        this.controls.enabled = true;
        this.perehod = false;
        this.controls.update();
      },
    );
  }

  /** Стандартный вид: поворот к нему за 0,45 с; масштаб и центр — прежние. */
  vid(v: StandartnyyVid): void {
    const target = this.controls.target.clone();
    const from = this.cam.position.clone().sub(target);
    const r = from.length();
    const a = from.clone().normalize();
    const b = v3(v === 'shkola' && this.sc ? shkolnyyRakurs(this.sc) : VIDY[v]);
    this.anim(450, (t) => {
      const d = new THREE.Vector3().lerpVectors(a, b, t).normalize();
      this.cam.position.copy(target).addScaledVector(d, r);
      this.cam.lookAt(target);
    });
  }

  /** Сбросить вид: школьный ракурс, фигура по центру и целиком. */
  sbros(animirovat = true): void {
    if (!this.sc) return;
    const sc = this.sc;
    const target = v3(sc.centr);
    const halfH = sc.razmer * 0.62;
    const k = v3(shkolnyyRakurs(sc));
    const set = () => {
      this.controls.target.copy(target);
      if (this.cam === this.orto) {
        this.orto.zoom = this.orto.top / halfH;
        this.orto.position.copy(target).addScaledVector(k, sc.razmer * 6);
        this.orto.updateProjectionMatrix();
      } else {
        const d = halfH / Math.tan(THREE.MathUtils.degToRad(this.persp.fov / 2));
        this.persp.position.copy(target).addScaledVector(k, d);
      }
      this.cam.lookAt(target);
      this.controls.update();
    };
    if (!animirovat) {
      set();
      this.zapustit();
      return;
    }
    const p0 = this.cam.position.clone();
    const t0 = this.controls.target.clone();
    const z0 = this.orto.zoom;
    set();
    const p1 = this.cam.position.clone();
    const z1 = this.orto.zoom;
    this.anim(450, (t) => {
      this.controls.target.lerpVectors(t0, target, t);
      this.cam.position.lerpVectors(p0, p1, t);
      if (this.cam === this.orto) {
        this.orto.zoom = z0 + (z1 - z0) * t;
        this.orto.updateProjectionMatrix();
      }
      this.cam.lookAt(this.controls.target);
    });
  }

  /* ── Экспорт ──────────────────────────────────────────── */

  /** Чертёж в параллельной проекции текущего ракурса, SVG. */
  eksportSvg(): string {
    if (!this.sc) return '';
    const k = arr(this.cam.position.clone().sub(this.controls.target).normalize());
    const up = arr(new THREE.Vector3(0, 1, 0).applyQuaternion(this.cam.quaternion));
    return chertezhSvg(this.sc, k, up, { shirina: 900, kegl: 22 });
  }

  async eksportPng(): Promise<Blob | null> {
    const svg = this.eksportSvg();
    const m = /width="(\d+)" height="(\d+)"/.exec(svg);
    const w = Number(m?.[1] ?? 900);
    const h = Number(m?.[2] ?? 700);
    const img = new Image();
    img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
    await img.decode();
    const canvas = document.createElement('canvas');
    canvas.width = w * 2;
    canvas.height = h * 2;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.scale(2, 2);
    ctx.drawImage(img, 0, 0, w, h);
    return new Promise((resolve) => canvas.toBlob((b) => resolve(b), 'image/png'));
  }

  dispose(): void {
    cancelAnimationFrame(this.raf);
    const canvas = this.renderer.domElement;
    canvas.removeEventListener('pointerdown', this.naNazhatie);
    canvas.removeEventListener('pointerup', this.naOtpuskanie);
    canvas.removeEventListener('pointercancel', this.naOtmenuNazhatiya);
    this.ro.disconnect();
    this.controls.dispose();
    for (const m of this.meshes) {
      m.geometry.dispose();
    }
    this.faceMat.dispose();
    this.renderer.dispose();
    this.host.replaceChildren();
  }

  /* ── Внутреннее ───────────────────────────────────────── */

  /** Сцена из инструмента: без сброса вида (кроме первого раза). */
  private primenitInstrument(novyy: boolean, poyavilos = false): void {
    const ins = this.instr;
    if (!ins) return;
    const sc = ins.scena();
    this.sc = sc;
    this.chasti = sc.sechenie ? razrezat(sc.tela[0] as Telo, sc.sechenie, sc.razmer) : null;
    this.razdvig = 0;
    this.sobratPodpisi();
    this.sobratMeshi();
    if (novyy) {
      this.razmerOkna();
      this.sbros(false);
    }
    if (poyavilos) {
      this.pokazatSechenie();
      // Сечение смотрит на зрителя почти ребром — повернуть к школьному
      // ракурсу, где его видно шире всего.
      const k = arr(this.cam.position.clone().sub(this.controls.target).normalize());
      if (sc.sechenie && Math.abs(dot(k, sc.sechenie.n)) < 0.3) this.vid('shkola');
    } else {
      this.poyavlenie = 1;
    }
    this.zapustit();
    this.onInstrument?.({
      schyot: ins.schyot,
      podskazkaHtml: texHtml(ins.podskazka),
      soobshchenie: ins.soobshchenie
        ? { vid: ins.soobshchenie.vid, html: texHtml(ins.soobshchenie.text) }
        : null,
      gotovo: ins.itog !== null,
    });
  }

  private naNazhatie = (e: PointerEvent): void => {
    this.pal += 1;
    this.nazhatie =
      this.pal === 1
        ? { x: e.clientX, y: e.clientY, t: performance.now(), id: e.pointerId, tip: e.pointerType }
        : null; // второй палец — щипок, не выбор
  };

  private naOtpuskanie = (e: PointerEvent): void => {
    this.pal = Math.max(0, this.pal - 1);
    const n = this.nazhatie;
    if (!n || n.id !== e.pointerId) return;
    this.nazhatie = null;
    if (!this.instr || e.button > 0) return;
    const sdvig = Math.hypot(e.clientX - n.x, e.clientY - n.y);
    if (sdvig > 6 || performance.now() - n.t > 600) return;
    const r = this.host.getBoundingClientRect();
    this.vybratVTochke(e.clientX - r.left, e.clientY - r.top, n.tip !== 'mouse');
  };

  private naOtmenuNazhatiya = (): void => {
    this.pal = Math.max(0, this.pal - 1);
    this.nazhatie = null;
  };

  /** Луч камеры через точку экрана. */
  private luch(x: number, y: number): { o: V; d: V } {
    const rc = new THREE.Raycaster();
    rc.setFromCamera(new THREE.Vector2((x / this.W) * 2 - 1, 1 - (y / this.H) * 2), this.cam);
    return { o: arr(rc.ray.origin), d: arr(rc.ray.direction) };
  }

  /** Новая точка на ребре рядом с нажатием (видимые рёбра — в приоритете). */
  private vybratNaRebre(ins: SechenieTryokhTochek, x: number, y: number, R: number): boolean {
    const poly = ins.poly;
    const telo = teloIzMnogogrannika(poly);
    const kam = this.kamera();
    const lic = telo.grani.map((g) => licom(g, kam));
    const pts = poly.vertices.map((v) => toArray(v.p) as V);
    let best: { e: number; d: number } | null = null;
    poly.edges.forEach((e, ei) => {
      const a = this.ekran(pts[e.a] as V);
      const b = this.ekran(pts[e.b] as V);
      const ab: P2 = [b[0] - a[0], b[1] - a[1]];
      const l2 = ab[0] ** 2 + ab[1] ** 2 || 1;
      const t = Math.min(1, Math.max(0, ((x - a[0]) * ab[0] + (y - a[1]) * ab[1]) / l2));
      const d = Math.hypot(a[0] + t * ab[0] - x, a[1] + t * ab[1] - y);
      const vidno = lic[e.faces[0]] || lic[e.faces[1]];
      const cost = d + (vidno ? 0 : 4);
      if (d < R && (best === null || cost < best.d)) best = { e: ei, d: cost };
    });
    if (best === null) return false;
    const ei = (best as { e: number }).e;
    const e = poly.edges[ei];
    if (!e) return false;
    // Параметр на ребре — ближайшая к лучу точка ребра (и для центральной проекции).
    const A = pts[e.a] as V;
    const d1 = sub(pts[e.b] as V, A);
    const { o, d: d2 } = this.luch(x, y);
    const w = sub(A, o);
    const a = dot(d1, d1);
    const b = dot(d1, d2);
    const c = dot(d2, d2);
    const den = a * c - b * b;
    const t = den < 1e-12 ? 0.5 : (b * dot(d2, w) - c * dot(d1, w)) / den;
    ins.naRebre(ei, Math.min(1, Math.max(0, t)));
    return true;
  }

  /** Новая точка на лицевой грани под нажатием. */
  private vybratNaGrani(ins: SechenieTryokhTochek, x: number, y: number): boolean {
    const poly = ins.poly;
    const telo = teloIzMnogogrannika(poly);
    const kam = this.kamera();
    const { o, d } = this.luch(x, y);
    let best: { f: number; s: number; p: V } | null = null;
    telo.grani.forEach((g, fi) => {
      if (!licom(g, kam)) return;
      const den = dot(g.n, d);
      if (Math.abs(den) < 1e-12) return;
      const s = (g.c - dot(g.n, o)) / den;
      const p = add(o, scale(d, s));
      const inside = g.pts.every((q, i) => {
        const r = g.pts[(i + 1) % g.pts.length] as V;
        const e = sub(r, q);
        const v = sub(p, q);
        const cr: V = [
          e[1] * v[2] - e[2] * v[1],
          e[2] * v[0] - e[0] * v[2],
          e[0] * v[1] - e[1] * v[0],
        ];
        return dot(cr, g.n) >= -1e-9;
      });
      if (inside && (best === null || s < best.s)) best = { f: fi, s, p };
    });
    if (best === null) return false;
    const { f, p } = best as { f: number; p: V };
    const g = telo.grani[f] as Gran;
    // Координаты в грани-параллелограмме: вдоль первой и последней стороны.
    const V0 = g.pts[0] as V;
    const u = sub(g.pts[1] as V, V0);
    const w = sub(g.pts[g.pts.length - 1] as V, V0);
    ins.naGrani(f, dot(sub(p, V0), u) / dot(u, u), dot(sub(p, V0), w) / dot(w, w));
    return true;
  }

  private ustanovitKameru(c: THREE.OrthographicCamera | THREE.PerspectiveCamera): void {
    if (c === this.cam) return;
    c.position.copy(this.cam.position);
    c.quaternion.copy(this.cam.quaternion);
    this.cam = c;
    this.controls.object = c;
  }

  /** Половина высоты видимой области в плоскости центра, ед. длины. */
  private vidimayaPolovina(): number {
    if (this.cam === this.orto) {
      return this.orto.top / this.orto.zoom;
    }
    const d = this.persp.position.distanceTo(this.controls.target);
    return d * Math.tan(THREE.MathUtils.degToRad(this.persp.fov / 2));
  }

  private razmerOkna(): void {
    const r = this.host.getBoundingClientRect();
    this.W = Math.max(1, Math.round(r.width));
    this.H = Math.max(1, Math.round(r.height));
    this.renderer.setSize(this.W, this.H, false);
    this.svg.setAttribute('viewBox', `0 0 ${this.W} ${this.H}`);
    const aspect = this.W / this.H;
    const half = this.sc ? this.sc.razmer : 6;
    this.orto.top = half;
    this.orto.bottom = -half;
    this.orto.left = -half * aspect;
    this.orto.right = half * aspect;
    this.orto.updateProjectionMatrix();
    this.persp.aspect = aspect;
    this.persp.updateProjectionMatrix();
    this.zapustit();
  }

  private sobratPodpisi(): void {
    this.labels.replaceChildren();
    this.podpisi = (this.sc?.metki ?? []).map((m) => {
      const el = document.createElement('span');
      el.className = clsxLabel(m.vid === 'tochka', m.vybrana === true);
      el.innerHTML = katex.renderToString(m.name, { throwOnError: false });
      el.dataset.name = m.name;
      this.labels.appendChild(el);
      const r = el.getBoundingClientRect();
      return { el, w: Math.max(r.width, 8), h: Math.max(r.height, 12) };
    });
  }

  private sobratMeshi(): void {
    for (const m of this.meshes) {
      this.scene.remove(m);
      m.geometry.dispose();
    }
    this.meshes = [];
    if (!this.sc) return;
    // Целое тело, затем две части разреза (видны, только когда раздвинуты).
    const tela = [
      this.sc.tela[0] as Telo,
      ...(this.chasti ? [this.chasti.plyus, this.chasti.minus] : []),
    ];
    for (const t of tela) {
      const pos: number[] = [];
      for (const g of t.grani) {
        for (let i = 1; i + 1 < g.pts.length; i += 1) {
          for (const p of [g.pts[0], g.pts[i], g.pts[i + 1]] as V[]) {
            pos.push(p[0], p[1], p[2]);
          }
        }
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
      geo.computeVertexNormals();
      const mesh = new THREE.Mesh(geo, this.faceMat);
      this.scene.add(mesh);
      this.meshes.push(mesh);
    }
    this.polozhitMeshi();
  }

  private sdvigi(): V[] | undefined {
    if (!this.sc?.sechenie || !this.chasti || this.razdvig === 0) return undefined;
    const d = scale(this.sc.sechenie.n, this.razdvig * this.sc.razmer);
    return [d, scale(d, -1)];
  }

  private polozhitMeshi(): void {
    const s = this.sdvigi() ?? [
      [0, 0, 0],
      [0, 0, 0],
    ];
    const cut = this.razdvig > 0;
    this.meshes.forEach((m, i) => {
      m.visible = i === 0 ? !cut : cut;
      const v = i === 0 ? ([0, 0, 0] as V) : (s[i - 1] ?? [0, 0, 0]);
      m.position.set(v[0], v[1], v[2]);
    });
  }

  private anim(dur: number, step: (t: number) => void, done?: () => void): void {
    this.anims.push({ start: performance.now(), dur, step, done });
    this.zapustit();
  }

  private zapustit(): void {
    if (this.raf === 0) {
      this.raf = requestAnimationFrame((t) => this.kadr(t));
    }
  }

  private kadr(now: number): void {
    this.raf = 0;
    for (const a of [...this.anims]) {
      const t = Math.min(1, (now - a.start) / a.dur);
      a.step(ease(t));
      if (t >= 1) {
        this.anims.splice(this.anims.indexOf(a), 1);
        a.done?.();
      }
    }
    const moving = this.controls.update();
    // В школьном чертеже холст пуст (граней нет) — WebGL не рисует
    // вовсе, кадр — только линии SVG: телефону легче.
    if (this.smes > 0) {
      this.renderer.render(this.scene, this.cam);
      this.pustoy = false;
    } else if (!this.pustoy) {
      this.renderer.clear();
      this.pustoy = true;
    }
    this.narisovat();
    this.schitatFps(now);
    if (moving || this.anims.length > 0) {
      this.zapustit();
    }
  }

  private schitatFps(now: number): void {
    // После простоя счёт начинается заново: паузы — не медленные кадры.
    if (now - this.prosh > 120) {
      this.kadrov = 0;
      this.fpsT = now;
    }
    this.prosh = now;
    this.kadrov += 1;
    if (now - this.fpsT > 500) {
      this.onFps?.(Math.round((this.kadrov * 1000) / (now - this.fpsT)));
      this.kadrov = 0;
      this.fpsT = now;
    }
  }

  private kamera(): Kamera {
    if (this.cam === this.orto) {
      return {
        vid: 'orto',
        k: arr(this.cam.position.clone().sub(this.controls.target).normalize()),
      };
    }
    return { vid: 'persp', glaz: arr(this.cam.position) };
  }

  private v = new THREE.Vector3();
  private ekran(p: V): P2 {
    this.v.set(p[0], p[1], p[2]).project(this.cam);
    return [((this.v.x + 1) / 2) * this.W, ((1 - this.v.y) / 2) * this.H];
  }

  /** Линии кадра: при разрезе — части, иначе тело, сечение и построение. */
  private liniiKadra(): { ls: Liniya[]; fill: V[][]; ploskost: V[] | null } {
    const sc = this.sc as Scena;
    const kam = this.kamera();
    const s = sc.sechenie;
    const sdv = this.sdvigi();
    if (sdv && this.chasti && s) {
      const tela = [this.chasti.plyus, this.chasti.minus];
      const ls = linii({ ...sc, tela, otrezki: [], ploskost: null }, kam, sdv);
      return { ls, fill: sdv.map((d) => s.pts.map((p) => add(p, d))), ploskost: null };
    }
    // Появление: стороны сечения — на долю периметра.
    const otrezki: Otrezok[] = [];
    const storony = sc.otrezki.filter((o) => o.vid === 'sechenie');
    const per = storony.reduce((acc, o) => acc + Math.hypot(...sub(o.b, o.a)), 0);
    let ostatok = this.poyavlenie * per;
    for (const o of storony) {
      const l = Math.hypot(...sub(o.b, o.a));
      if (ostatok <= 0) break;
      otrezki.push(ostatok >= l ? o : { ...o, b: lerp(o.a, o.b, ostatok / l) });
      ostatok -= l;
    }
    otrezki.push(...sc.otrezki.filter((o) => o.vid !== 'sechenie'));
    const ploskost = this.pokazPloskosti && this.poyavlenie > 0.6 ? (sc.ploskost ?? null) : null;
    const ls = linii({ ...sc, otrezki, ploskost }, kam);
    return { ls, fill: s && this.poyavlenie > 0.6 ? [s.pts] : [], ploskost };
  }

  private narisovat(): void {
    if (!this.sc) return;
    const sc = this.sc;
    const { ls, fill, ploskost } = this.liniiKadra();
    const tri = this.smes;
    const tsv = this.tsveta;

    // Заливки: секущая плоскость, затем сечение; линии — поверх них.
    const vyh = Math.max(0, (this.poyavlenie - 0.6) / 0.4);
    const zalivki = [
      ...(ploskost ? [{ pts: ploskost, color: tsv.ploskost, op: 0.09 * vyh }] : []),
      ...fill.map((pts) => ({ pts, color: tsv.sechenie, op: (0.24 + 0.08 * tri) * vyh })),
    ];
    pool(this.gFill, 'polygon', zalivki.length, (el, i) => {
      const z = zalivki[i] as { pts: V[]; color: string; op: number };
      const pts = z.pts.map((p) =>
        this.ekran(p)
          .map((x) => x.toFixed(1))
          .join(','),
      );
      el.setAttribute('points', pts.join(' '));
      el.setAttribute('fill', z.color);
      el.setAttribute('fill-opacity', z.op.toFixed(3));
    });

    // Линии: сначала невидимые, потом видимые — видимые поверх;
    // внутри — плоскость, построение, рёбра, сечение.
    const RANG = { ploskost: 0, vspom: 1, rebro: 2, sechenie: 3 } as const;
    const order = [...ls].sort(
      (a, b) => Number(a.vidno) - Number(b.vidno) || RANG[a.vid] - RANG[b.vid],
    );
    const ekr: (readonly [P2, P2])[] = [];
    pool(this.gLines, 'line', order.length, (el, i) => {
      const l = order[i] as Liniya;
      const a = this.ekran(l.a);
      const b = this.ekran(l.b);
      ekr.push([a, b]);
      el.setAttribute('x1', a[0].toFixed(1));
      el.setAttribute('y1', a[1].toFixed(1));
      el.setAttribute('x2', b[0].toFixed(1));
      el.setAttribute('y2', b[1].toFixed(1));
      const color =
        l.vid === 'sechenie'
          ? tsv.sechenie
          : l.vid === 'vspom'
            ? tsv.vspom
            : l.vid === 'ploskost'
              ? tsv.ploskost
              : tri > 0.5
                ? tsv.liniya3d
                : tsv.liniya;
      el.setAttribute('stroke', color);
      el.setAttribute(
        'stroke-width',
        l.vid === 'sechenie' ? '2.8' : l.vid === 'rebro' ? '1.4' : l.vid === 'vspom' ? '1.2' : '1',
      );
      el.setAttribute('stroke-linecap', 'round');
      el.setAttribute('stroke-dasharray', l.vidno ? '' : l.vid === 'sechenie' ? '7 5' : '5 4');
      el.setAttribute(
        'stroke-opacity',
        l.vid === 'ploskost'
          ? l.vidno
            ? '0.75'
            : '0.5'
          : l.vidno
            ? '1'
            : (0.85 - 0.3 * tri).toFixed(2),
      );
      el.setAttribute('data-vid', l.vid);
      el.setAttribute('data-vidno', l.vidno ? '1' : '0');
    });

    // При разрезе подписи едут вместе со своей частью; точки построения
    // вне плоскости сечения прячутся вместе с построением.
    const sdv = this.sdvigi();
    const s = sc.sechenie;
    const gde = sc.metki.map((m): V | null => {
      if (!sdv || !s) return [0, 0, 0];
      const d = dot(s.n, sub(m.p, s.pts[0] as V));
      const eps = sc.razmer * 1e-6;
      // Точки построения вне тела прячутся вместе с построением.
      if (m.vid === 'tochka' && !vTele(sc.tela[0] as Telo, m.p, eps)) return null;
      if (Math.abs(d) <= eps) return sdv[0] as V;
      return (d > 0 ? sdv[0] : sdv[1]) as V;
    });
    const tochkaP = (i: number): V => add(sc.metki[i]?.p as V, gde[i] ?? [0, 0, 0]);

    // Точки построения; выбранные инструментом — крупнее, цветом сечения.
    const dots = sc.metki
      .map((_, i) => i)
      .filter((i) => (sc.metki[i]?.vid === 'tochka' || sc.metki[i]?.vybrana) && gde[i] !== null)
      .sort(
        (a, b) => Number(sc.metki[a]?.vybrana ?? false) - Number(sc.metki[b]?.vybrana ?? false),
      );
    pool(this.gDots, 'circle', dots.length, (el, i) => {
      const m = sc.metki[dots[i] as number];
      const p = this.ekran(tochkaP(dots[i] as number));
      el.setAttribute('cx', p[0].toFixed(1));
      el.setAttribute('cy', p[1].toFixed(1));
      if (m?.vybrana) {
        el.setAttribute('r', '5.5');
        el.setAttribute('fill', tsv.sechenie);
        el.setAttribute('stroke', '#fff');
        el.setAttribute('stroke-width', '2');
        el.setAttribute('data-vybrana', '1');
      } else {
        el.setAttribute('r', '3');
        el.setAttribute('fill', tsv.liniya);
        el.setAttribute('stroke', 'none');
        el.removeAttribute('data-vybrana');
      }
    });

    // Подписи.
    const anchors = sc.metki.map((_, i) => this.ekran(tochkaP(i)));
    const c = this.ekran(centroid(sc.metki.map((m) => m.p)));
    const pos = razlozhit(
      this.podpisi.map((p, i) => ({ p: anchors[i] as P2, w: p.w, h: p.h })),
      ekr,
      c,
      this.podpisi.map((p) => p.dir),
      sc.metki.some((m) => m.vybrana) ? 7 : 5,
    );
    this.podpisi.forEach((p, i) => {
      const q = pos[i];
      p.el.style.visibility = gde[i] === null ? 'hidden' : '';
      if (!q) return;
      // Якорь подписи — точка на экране (для проверок на сайте).
      const a = anchors[i] as P2;
      p.el.dataset.x = a[0].toFixed(1);
      p.el.dataset.y = a[1].toFixed(1);
      p.dir = q.dir;
      p.el.style.transform = `translate(${q.x.toFixed(1)}px, ${q.y.toFixed(1)}px)`;
    });
  }
}

const clsxLabel = (tochka: boolean, vybrana: boolean): string =>
  ['z15-ch__label', tochka ? 'z15-ch__label--tochka' : '', vybrana ? 'z15-ch__label--vybrana' : '']
    .filter(Boolean)
    .join(' ');

/** Переиспользовать элементы SVG: столько, сколько нужно в кадре. */
function pool<K extends 'line' | 'polygon' | 'circle'>(
  g: SVGGElement,
  tag: K,
  n: number,
  set: (el: SVGElementTagNameMap[K], i: number) => void,
): void {
  while (g.childElementCount < n) {
    g.appendChild(document.createElementNS(SVG_NS, tag));
  }
  while (g.childElementCount > n) {
    g.lastElementChild?.remove();
  }
  for (let i = 0; i < n; i += 1) {
    set(g.children[i] as SVGElementTagNameMap[K], i);
  }
}

export function sozdat(host: HTMLElement): Dvizhok {
  return new Dvizhok(host);
}
