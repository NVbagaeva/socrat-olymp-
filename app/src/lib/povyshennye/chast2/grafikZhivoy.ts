/**
 * Живой рисунок №19 (оформление «касание», b19kasanie.ts): прямая
 * y = a(t − m) − c вращается вокруг точки A(m; −c). Её можно тянуть за
 * кружок-ручку или двигать ползунком; на рисунке видны общие точки с
 * дугой, под ним — значение a и число решений. Кнопка возвращает прямую
 * в положение касания.
 *
 * Разметку (svg.c2-graf с data-*, панель .c2-graf-panel) строит шаблон;
 * без этого скрипта — на печати, в PDF — остаётся обычный рисунок с
 * касательной, а панель скрыта (атрибут hidden).
 */

import { chisloResheniy, tochkiDugi } from './b19geom';

/** Ближе этого к особому a прямая «прилипает» к нему при перетаскивании. */
const PRILIPANIE = 0.04;
const MINUS = '−';

const fmt = (a: number) => `${a < 0 ? MINUS : ''}${Math.abs(a).toFixed(2).replace('.', ',')}`;
const resheniy = (n: number) =>
  `${n} ${n === 1 ? 'решение' : n >= 2 && n <= 4 ? 'решения' : 'решений'}`;
const blizko = (x: number, y: number) => Math.abs(x - y) < 1e-9;

function ozhivit(svg: SVGSVGElement): (() => void) | null {
  const d = svg.dataset;
  const num = (k: string) => Number(d[k]);
  const R = num('r');
  const c = num('c');
  const m = num('m');
  const u = num('u');
  const t0 = num('t0');
  const y1 = num('y1');
  const yh = num('yh');
  const aKas = num('akas');
  const aB = num('ab');
  const aA = num('aa');
  const amin = num('amin');
  const amax = num('amax');
  if ([R, c, m, u, t0, y1, yh, aKas, aB, aA, amin, amax].some((x) => !Number.isFinite(x)))
    return null;

  const panel = svg.parentElement?.querySelector<HTMLElement>('.c2-graf-panel') ?? null;
  const linia = svg.querySelector<SVGLineElement>('.c2-graf__pryamaya');
  const hit = svg.querySelector<SVGLineElement>('.c2-graf__hit');
  const ruchka = svg.querySelector<SVGCircleElement>('.c2-graf__ruchka');
  const tochki = [...svg.querySelectorAll<SVGCircleElement>('.c2-graf__obshchaya')];
  const slider = panel?.querySelector<HTMLInputElement>('.c2-graf-panel__range') ?? null;
  const status = panel?.querySelector<HTMLElement>('.c2-graf-panel__status') ?? null;
  const reset = panel?.querySelector<HTMLButtonElement>('.c2-graf-panel__reset') ?? null;
  if (!panel || !linia || !hit || !ruchka || !slider || !status || !reset) return null;

  const geom = { R, c, m };
  const vb = svg.viewBox.baseVal.width;
  const X = (t: number) => (t - t0) * u;
  const Y = (y: number) => (y1 - y) * u;
  const tL = t0 - 1;
  const tR = t0 + vb / u + 1;
  const osobye = [aKas, aB, aA];
  let a = aKas;

  const pokazat = (v: number, otPolzunka = false) => {
    a = Math.min(amax, Math.max(amin, v));
    const yAt = (t: number) => a * (t - m) - c;
    for (const l of [linia, hit]) {
      l.setAttribute('x1', String(X(tL)));
      l.setAttribute('y1', String(Y(yAt(tL))));
      l.setAttribute('x2', String(X(tR)));
      l.setAttribute('y2', String(Y(yAt(tR))));
    }
    /* Ручка — на уровне y = yh: прямая под любым наклоном её пересекает. */
    ruchka.setAttribute('cx', String(X(m + (yh + c) / a)));
    ruchka.setAttribute('cy', String(Y(yh)));
    const ts = tochkiDugi(geom, a);
    tochki.forEach((el, i) => {
      const t = ts[i];
      if (t === undefined) el.setAttribute('visibility', 'hidden');
      else {
        el.setAttribute('cx', String(X(t)));
        el.setAttribute('cy', String(Y(yAt(t))));
        el.setAttribute('visibility', 'visible');
      }
    });
    const n = chisloResheniy(geom, a);
    const nazv = blizko(a, aKas)
      ? ' — касание'
      : blizko(a, aB)
        ? ` — через (${R}; 0)`
        : blizko(a, aA)
          ? ` — через (0; ${R})`
          : '';
    const tochno = Math.abs(a * 100 - Math.round(a * 100)) < 1e-9;
    status.innerHTML = `<i>a</i> ${tochno ? '=' : '≈'} ${fmt(a)}${nazv}: <b>${resheniy(n)}</b>`;
    svg.classList.toggle('is-moved', !blizko(a, aKas));
    if (!otPolzunka) slider.value = String(a);
  };

  /* Положение указателя → угловой коэффициент прямой из A через него. */
  const kUkazatelya = (e: PointerEvent): number | null => {
    const r = svg.getBoundingClientRect();
    const sc = r.width / vb;
    const t = t0 + (e.clientX - r.left) / sc / u;
    const y = y1 - (e.clientY - r.top) / sc / u;
    if (Math.abs(t - m) < 1e-3) return null;
    let v = Math.min(amax, Math.max(amin, (y + c) / (t - m)));
    for (const s of osobye) if (Math.abs(v - s) < PRILIPANIE) v = s;
    return v;
  };

  const ctl = new AbortController();
  const { signal } = ctl;
  let tyanu = false;
  const idti = (e: PointerEvent) => {
    const v = kUkazatelya(e);
    if (v !== null) pokazat(v);
  };
  svg.addEventListener(
    'pointerdown',
    (e) => {
      if (
        !(e.target instanceof Element) ||
        e.target.closest('.c2-graf__ruchka, .c2-graf__hit') === null
      )
        return;
      tyanu = true;
      svg.classList.add('is-drag');
      svg.setPointerCapture(e.pointerId);
      e.preventDefault();
      idti(e);
    },
    { signal },
  );
  svg.addEventListener('pointermove', (e) => tyanu && idti(e), { signal });
  const otpustit = () => {
    tyanu = false;
    svg.classList.remove('is-drag');
  };
  svg.addEventListener('pointerup', otpustit, { signal });
  svg.addEventListener('pointercancel', otpustit, { signal });
  svg.addEventListener('lostpointercapture', otpustit, { signal });
  slider.addEventListener('input', () => pokazat(parseFloat(slider.value), true), { signal });
  reset.addEventListener('click', () => pokazat(aKas), { signal });

  panel.hidden = false;
  pokazat(aKas);
  return () => ctl.abort();
}

/** Оживить все такие рисунки внутри узла; возвращает функцию отмены. */
export function ozhivitGrafiki(root: HTMLElement): () => void {
  const otmeny = [...root.querySelectorAll<SVGSVGElement>('svg.c2-graf[data-akas]')]
    .map(ozhivit)
    .filter((f): f is () => void => f !== null);
  return () => otmeny.forEach((f) => f());
}
