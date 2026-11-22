/**
 * Живая фигура витрины главной — поведение поверх готовой разметки
 * (StereoChast рисует её на сборке). Модуль ленивый: его подгружает
 * StereoOzhivit, когда блок подъезжает к экрану; вместе с ним приезжает
 * движок рисунка lib/solid (тот же, что у чертежей раздела №3). React
 * здесь нет: первая загрузка главной от фигуры не растёт.
 *
 *   — Жест: палец вбок крутит фигуру, вверх-вниз листает страницу
 *     (touch-action: pan-y — как у кристалла первого экрана); мышь
 *     крутит в обе стороны; стрелки клавиатуры тоже.
 *   — Автоповорот при первом появлении: фигура качнётся на AVTO_RAZMAH
 *     и вернётся; при prefers-reduced-motion — нет.
 *   — Шаги разбора (кнопки [data-shag]) выделяют элементы шага на этой
 *     же фигуре.
 *   — Кадр перерисовывается только пока фигура движется.
 */

import type { Model } from '@/lib/solid/model';
import { orthoAt } from '@/lib/solid/project';
import { renderSolid } from '@/lib/solid/render';

export interface Opcii {
  model: Model;
  az: number;
  el: number;
  /** Шаг, открытый сначала (на нём нарисован первый кадр сервера). */
  nachalo: number;
}

const NA_PIKSEL = 0.5;
const SDVIG = 6;
const PODYOM_MIN = 5;
const PODYOM_MAX = 85;
const ZATUKHANIE = 0.9;
const STOP = 0.004;
const NA_KLAVISHU = 10;
const AVTO_RAZMAH = 28;
const AVTO_MS = 1800;

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const tikho = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Оживить часть витрины; возвращает уборку. */
export function ozhivit(
  koren: HTMLElement,
  { model, az: az0, el: el0, nachalo }: Opcii,
): () => void {
  const oblast = koren.querySelector<HTMLElement>('.vst-oblast');
  const kholst = koren.querySelector<HTMLElement>('.vst-kholst');
  const zhest = koren.querySelector<HTMLElement>('.vst-zhest');
  const sbros = koren.querySelector<HTMLButtonElement>('.vst-sbros');
  const knopkiShagov = [...koren.querySelectorAll<HTMLButtonElement>('[data-shag]')];
  if (oblast === null || kholst === null) return () => undefined;

  let vid = { az: az0, el: el0 };
  let shag = nachalo;
  const pamyat = new Map<string, number>();
  let kadr = 0;
  let dvizhenie = 0;

  const narisovat = () => {
    if (kadr !== 0) return;
    kadr = requestAnimationFrame(() => {
      kadr = 0;
      kholst.innerHTML = renderSolid(model, {
        view: orthoAt(vid.az, vid.el),
        ustoychivo: true,
        tema: 'ekran',
        shag,
        pamyatPodpisey: pamyat,
      });
    });
  };
  const postavit = (az: number, el: number) => {
    vid = { az: ((((az + 180) % 360) + 360) % 360) - 180, el: clamp(el, PODYOM_MIN, PODYOM_MAX) };
    narisovat();
  };
  const ostanovit = () => {
    cancelAnimationFrame(dvizhenie);
    dvizhenie = 0;
  };
  const rukami = () => {
    zhest?.classList.add('is-skryt');
    if (sbros !== null) sbros.hidden = false;
  };

  /* ── Автоповорот при первом появлении ── */
  const vidno = new IntersectionObserver(
    (es) => {
      if (!es.some((e) => e.isIntersecting)) return;
      vidno.disconnect();
      if (tikho() || dvizhenie !== 0 || vid.az !== az0 || vid.el !== el0) return;
      const t0 = performance.now();
      const tik = (now: number) => {
        const t = Math.min(1, (now - t0) / AVTO_MS);
        const e = t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2;
        postavit(az0 + AVTO_RAZMAH * Math.sin(Math.PI * e), el0);
        dvizhenie = t < 1 ? requestAnimationFrame(tik) : 0;
      };
      dvizhenie = requestAnimationFrame(tik);
    },
    { threshold: 0.5 },
  );
  vidno.observe(oblast);

  /* ── Жесты ── */
  let start: { id: number; x: number; y: number; palec: boolean } | null = null;
  let tyanem = false;
  let proshloe = { t: 0, x: 0, y: 0 };
  let skorost = { az: 0, el: 0 };

  const down = (e: PointerEvent) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    if (start !== null) return;
    ostanovit();
    start = { id: e.pointerId, x: e.clientX, y: e.clientY, palec: e.pointerType !== 'mouse' };
    tyanem = false;
    skorost = { az: 0, el: 0 };
    proshloe = { t: e.timeStamp, x: e.clientX, y: e.clientY };
  };
  const move = (e: PointerEvent) => {
    if (start === null || e.pointerId !== start.id) return;
    if (!tyanem) {
      const dx = e.clientX - start.x;
      const dy = e.clientY - start.y;
      if (Math.hypot(dx, dy) < SDVIG) return;
      /* Палец вверх-вниз — это страница: её листает браузер (pan-y). */
      if (start.palec && Math.abs(dy) > Math.abs(dx)) {
        start = null;
        return;
      }
      tyanem = true;
      rukami();
      try {
        oblast.setPointerCapture(e.pointerId);
      } catch {
        /* указатель уже ушёл */
      }
    }
    e.preventDefault();
    const dt = Math.max(1, e.timeStamp - proshloe.t);
    const dAz = -(e.clientX - proshloe.x) * NA_PIKSEL;
    /* Палец двигает только вбок: наклон — мышью и стрелками. */
    const dEl = start.palec ? 0 : (e.clientY - proshloe.y) * NA_PIKSEL;
    proshloe = { t: e.timeStamp, x: e.clientX, y: e.clientY };
    skorost = {
      az: skorost.az * 0.5 + (dAz / dt) * 0.5,
      el: skorost.el * 0.5 + (dEl / dt) * 0.5,
    };
    postavit(vid.az + dAz, vid.el + dEl);
  };
  const up = (e: PointerEvent) => {
    if (start === null || e.pointerId !== start.id) return;
    start = null;
    if (!tyanem) return;
    tyanem = false;
    if (e.timeStamp - proshloe.t > 80 || tikho()) return;
    let v = { ...skorost };
    let t = performance.now();
    const tik = (now: number) => {
      const dt = Math.min(48, now - t);
      t = now;
      v = { az: v.az * ZATUKHANIE ** (dt / 16), el: v.el * ZATUKHANIE ** (dt / 16) };
      if (Math.abs(v.az) < STOP && Math.abs(v.el) < STOP) {
        dvizhenie = 0;
        return;
      }
      postavit(vid.az + v.az * dt, vid.el + v.el * dt);
      dvizhenie = requestAnimationFrame(tik);
    };
    dvizhenie = requestAnimationFrame(tik);
  };
  const klavisha = (e: KeyboardEvent) => {
    const d: Record<string, [number, number]> = {
      ArrowLeft: [NA_KLAVISHU, 0],
      ArrowRight: [-NA_KLAVISHU, 0],
      ArrowUp: [0, NA_KLAVISHU],
      ArrowDown: [0, -NA_KLAVISHU],
    };
    const s = d[e.key];
    if (s === undefined) return;
    e.preventDefault();
    ostanovit();
    rukami();
    postavit(vid.az + s[0], vid.el + s[1]);
  };
  const sbrosit = () => {
    ostanovit();
    pamyat.clear();
    if (sbros !== null) sbros.hidden = true;
    postavit(az0, el0);
  };
  const naShag = (e: Event) => {
    const k = Number((e.currentTarget as HTMLElement).dataset['shag']);
    if (!Number.isFinite(k)) return;
    shag = k;
    for (const b of knopkiShagov) {
      const on = b === e.currentTarget;
      b.classList.toggle('is-aktivnyy', on);
      b.setAttribute('aria-pressed', String(on));
    }
    narisovat();
  };

  oblast.addEventListener('pointerdown', down);
  oblast.addEventListener('pointermove', move, { passive: false });
  oblast.addEventListener('pointerup', up);
  oblast.addEventListener('pointercancel', up);
  oblast.addEventListener('keydown', klavisha);
  sbros?.addEventListener('click', sbrosit);
  for (const b of knopkiShagov) b.addEventListener('click', naShag);
  koren.dataset['zhivaya'] = '1';

  return () => {
    vidno.disconnect();
    ostanovit();
    cancelAnimationFrame(kadr);
    oblast.removeEventListener('pointerdown', down);
    oblast.removeEventListener('pointermove', move);
    oblast.removeEventListener('pointerup', up);
    oblast.removeEventListener('pointercancel', up);
    oblast.removeEventListener('keydown', klavisha);
    sbros?.removeEventListener('click', sbrosit);
    for (const b of knopkiShagov) b.removeEventListener('click', naShag);
    delete koren.dataset['zhivaya'];
  };
}
