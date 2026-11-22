'use client';

import { useEffect, useLayoutEffect, useRef } from 'react';
import { Popugaj } from './Popugaj';
import './zherdochka.css';

export type VidZherdochki = 'steklo' | 'vetka';

/** Жесты попугайчика: длительность (мс) и как часто выпадает. */
const ZHESTY = [
  { id: 'naklon', ms: 2800, ves: 5 },
  { id: 'oglyad', ms: 3400, ves: 2 },
  { id: 'shag', ms: 1000, ves: 3 },
  { id: 'vstryaska', ms: 1400, ves: 2 },
  { id: 'chistka', ms: 3200, ves: 1 },
  { id: 'hvost', ms: 1100, ves: 1 },
] as const;
const KLYOV_MS = 950;
/** Насколько птица может отойти по жёрдочке от своего места, em. */
const SHAG_MAX = 0.13;
/** Размеры птицы, которые пробует подбор, — от большего к меньшему. */
const RAZMERY = [1.5, 1.38, 1.26, 1.14, 1, 0.88];

const rnd = (a: number, b: number) => a + Math.random() * (b - a);

function vybratZhest(krome: string | null) {
  const iz = ZHESTY.filter((z) => z.id !== krome);
  let r = Math.random() * iz.reduce((s, z) => s + z.ves, 0);
  for (const z of iz) {
    r -= z.ves;
    if (r <= 0) return z;
  }
  return iz[0]!;
}

const useIsoLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;

/**
 * Жёрдочка с волнистым попугайчиком. Ставится в строку сразу за словом:
 * в вёрстке занимает узкое место (--zh-mesto), остальное свешивается
 * вправо. Попугайчик смотрит влево, на текст.
 *
 * Живость: дыхание и покачивание жёрдочки идут сами (CSS), а жесты —
 * наклон головы, шажок, встряхивание, чистка пёрышек — включаются
 * отсюда через data-zhest со случайными паузами, чтобы не было
 * ощущения зацикленного ролика. При наведении и тапе — маленький
 * клевок. При prefers-reduced-motion птица просто сидит.
 *
 * podgon — подбор места в заголовке главной: птица берёт самый крупный
 * размер, при котором не задевает ни строки заголовка, ни фигуру, ни
 * край экрана, и встаёт правее самой длинной из соседних строк.
 */
export function Zherdochka({
  vid = 'steklo',
  podgon = true,
}: {
  vid?: VidZherdochki;
  podgon?: boolean;
}) {
  const root = useRef<HTMLSpanElement>(null);

  /* Подбор места и размера. Читаем вёрстку только при изменении
     размеров, не в анимации. */
  useIsoLayoutEffect(() => {
    const el = root.current;
    if (el === null) return;
    const gotov = () => el.setAttribute('data-gotov', '');
    if (!podgon) {
      gotov();
      return;
    }
    const title = el.closest('h1');
    const hero = el.closest('.hero__in');
    const kristall = hero?.querySelector('.hero__kristall') ?? null;
    const shiroko = window.matchMedia('(min-width: 1024px)');

    const podognat = () => {
      el.style.removeProperty('--zh-k');
      el.style.removeProperty('--zh-sdvig');
      if (title === null || hero === null) return;
      const stil = getComputedStyle(el);
      const em = parseFloat(stil.fontSize);
      const dlina = parseFloat(stil.getPropertyValue('--zh-dlina')) || 1.75;
      const yakor = el.getBoundingClientRect();
      const zherd = yakor.bottom + 0.3 * em; // верх жёрдочки
      /* Правая граница. Две колонки — край рамки фигуры (у самой фигуры
         внутри рамки есть свои поля). Одна колонка — поле страницы. */
      let predel: number;
      if (shiroko.matches && kristall !== null) {
        const ramka = kristall.getBoundingClientRect();
        predel = ramka.left + 0.04 * ramka.width;
      } else {
        predel = hero.getBoundingClientRect().right - 5;
      }
      /* Строки заголовка: прямоугольники текста, кроме самой сцены. */
      const stroki: DOMRect[] = [];
      const walker = document.createTreeWalker(title, NodeFilter.SHOW_TEXT);
      const range = document.createRange();
      for (let n = walker.nextNode(); n !== null; n = walker.nextNode()) {
        if (el.contains(n)) continue;
        range.selectNodeContents(n);
        stroki.push(...range.getClientRects());
      }
      /* На узком экране обычный размер держит сама вёрстка (--zh-mesto):
         здесь только увеличиваем, если есть куда. */
      const razmery = shiroko.matches ? RAZMERY : RAZMERY.filter((k) => k > 1);
      for (const k of razmery) {
        const verh = zherd - 1.1 * k * em;
        let levo = yakor.left + 0.2 * em;
        for (const r of stroki) {
          if (r.bottom > verh + 0.12 * em && r.top < zherd) {
            levo = Math.max(levo, r.right + 0.24 * em);
          }
        }
        if (levo + dlina * k * em <= predel) {
          el.style.setProperty('--zh-k', String(k));
          el.style.setProperty('--zh-sdvig', `${(levo - yakor.left - 0.2 * em).toFixed(1)}px`);
          return;
        }
      }
      if (shiroko.matches) el.style.setProperty('--zh-k', String(RAZMERY.at(-1)));
    };

    podognat();
    gotov();
    const ro = new ResizeObserver(podognat);
    if (title !== null) ro.observe(title);
    void document.fonts?.ready.then(podognat);
    return () => ro.disconnect();
  }, [podgon]);

  /* Жесты со случайными паузами. */
  useEffect(() => {
    const el = root.current;
    if (el === null) return;
    const tiho = window.matchMedia('(prefers-reduced-motion: reduce)');
    let zhestT = 0;
    let morgT = 0;
    let snyatT = 0;
    let shag = 0;
    let proshly: string | null = null;

    const sygrat = (id: string, ms: number) => {
      window.clearTimeout(snyatT);
      if (id === 'naklon') {
        /* То клювом вниз (разглядывает), то вверх; угол каждый раз свой. */
        const vniz = Math.random() < 0.6;
        el.style.setProperty('--pg-ugol', `${vniz ? rnd(11, 19) : -rnd(9, 15)}deg`);
      }
      if (id === 'shag') {
        const kuda = shag > 0.04 ? -1 : shag < -0.04 ? 1 : Math.random() < 0.5 ? -1 : 1;
        shag = Math.max(-SHAG_MAX, Math.min(SHAG_MAX, shag + kuda * rnd(0.05, 0.1)));
        el.style.setProperty('--zh-shag', `${shag.toFixed(3)}em`);
      }
      el.setAttribute('data-zhest', id);
      snyatT = window.setTimeout(() => el.removeAttribute('data-zhest'), ms);
    };

    const sleduyushchiy = (pauza: number) => {
      zhestT = window.setTimeout(() => {
        if (document.hidden || el.getAttribute('data-zhest') !== null) {
          sleduyushchiy(1500);
          return;
        }
        const z = vybratZhest(proshly);
        proshly = z.id;
        sygrat(z.id, z.ms);
        sleduyushchiy(z.ms + rnd(1800, 6500));
      }, pauza);
    };
    const morgat = () => {
      morgT = window.setTimeout(
        () => {
          if (!document.hidden) {
            el.setAttribute('data-morg', Math.random() < 0.2 ? '2' : '1');
            window.setTimeout(() => el.removeAttribute('data-morg'), 520);
          }
          morgat();
        },
        rnd(2200, 6000),
      );
    };

    const start = () => {
      stop();
      if (tiho.matches) return;
      sleduyushchiy(rnd(2600, 4200));
      morgat();
    };
    const stop = () => {
      window.clearTimeout(zhestT);
      window.clearTimeout(morgT);
      window.clearTimeout(snyatT);
      el.removeAttribute('data-zhest');
      el.removeAttribute('data-morg');
    };

    /* Клевок — на наведение мыши и на тап. */
    const ptica = el.querySelector('.popugaj');
    const klyov = () => {
      if (tiho.matches || el.getAttribute('data-zhest') === 'klyov') return;
      sygrat('klyov', KLYOV_MS);
    };
    ptica?.addEventListener('pointerenter', klyov);
    ptica?.addEventListener('pointerdown', klyov);

    start();
    tiho.addEventListener('change', start);
    return () => {
      stop();
      tiho.removeEventListener('change', start);
      ptica?.removeEventListener('pointerenter', klyov);
      ptica?.removeEventListener('pointerdown', klyov);
    };
  }, []);

  return (
    <span ref={root} className={`zherdochka zherdochka--${vid}`} aria-hidden="true">
      <span className="zherdochka__mesto">
        <span className="zherdochka__scena">
          <span className="zherdochka__kach">
            <span className="zherdochka__prosad">
              {vid === 'steklo' ? <Steklo /> : <Vetka />}
              <span className="zherdochka__ptica">
                <Popugaj />
              </span>
            </span>
          </span>
        </span>
      </span>
    </span>
  );
}

/* Обе жёрдочки — в рамке 200×44, верх перекладины под лапками — y = 14. */

/** «Стекло»: голубая стеклянная перекладина с бликом и золотыми колечками. */
function Steklo() {
  return (
    <svg className="zherdochka__palka" viewBox="0 0 200 44" focusable="false">
      <defs>
        <linearGradient id="zh-steklo" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0.96" />
          <stop offset="0.3" stopColor="#d9e8ff" stopOpacity="0.9" />
          <stop offset="0.68" stopColor="#8db6f6" stopOpacity="0.82" />
          <stop offset="1" stopColor="#3f7de0" stopOpacity="0.9" />
        </linearGradient>
        <radialGradient id="zh-shar" cx="0.35" cy="0.3" r="0.8">
          <stop offset="0" stopColor="#cfe1ff" />
          <stop offset="0.45" stopColor="#4f8bec" />
          <stop offset="1" stopColor="#173f9c" />
        </radialGradient>
        <linearGradient id="zh-zoloto" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff0c4" />
          <stop offset="0.45" stopColor="#f0b24e" />
          <stop offset="1" stopColor="#b9701c" />
        </linearGradient>
        <radialGradient id="zh-ten">
          <stop offset="0" stopColor="#1f5fd0" stopOpacity="0.3" />
          <stop offset="0.6" stopColor="#1f5fd0" stopOpacity="0.1" />
          <stop offset="1" stopColor="#1f5fd0" stopOpacity="0" />
        </radialGradient>
      </defs>
      <ellipse cx="100" cy="36" rx="84" ry="4.5" fill="url(#zh-ten)" />
      <rect
        x="6"
        y="14"
        width="188"
        height="10"
        rx="5"
        fill="url(#zh-steklo)"
        stroke="#1f5fd0"
        strokeOpacity="0.32"
        strokeWidth="0.6"
      />
      <path
        d="M30 22.2h118"
        fill="none"
        stroke="#1b4fb4"
        strokeOpacity="0.28"
        strokeWidth="0.8"
        strokeLinecap="round"
      />
      <path
        d="M28 16.3h104M142 16.3h14"
        fill="none"
        stroke="#fff"
        strokeWidth="1.3"
        strokeLinecap="round"
        opacity="0.95"
      />
      {[20, 180].map((x) => (
        <g key={x}>
          <rect x={x - 1.7} y="13" width="3.4" height="12" rx="1.3" fill="url(#zh-zoloto)" />
          <path d={`M${x - 0.6} 14.2v3`} stroke="#fff" strokeWidth="0.7" opacity="0.8" />
        </g>
      ))}
      {[6, 194].map((x) => (
        <g key={x}>
          <circle cx={x} cy="19" r="6" fill="url(#zh-shar)" />
          <ellipse cx={x - 1.6} cy="16.6" rx="2" ry="1.2" fill="#fff" opacity="0.85" />
        </g>
      ))}
    </svg>
  );
}

/** «Веточка»: светлое дерево с бликом и парой полупрозрачных листиков. */
function Vetka() {
  return (
    <svg className="zherdochka__palka" viewBox="0 0 200 44" focusable="false">
      <defs>
        <linearGradient id="zh-derevo" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f3dfbd" />
          <stop offset="0.45" stopColor="#c99a63" />
          <stop offset="1" stopColor="#85603a" />
        </linearGradient>
        <linearGradient id="zh-list" x1="0.1" y1="0" x2="0.9" y2="1">
          <stop offset="0" stopColor="#e2f7b8" stopOpacity="0.95" />
          <stop offset="0.5" stopColor="#74c657" stopOpacity="0.9" />
          <stop offset="1" stopColor="#2b9a4e" stopOpacity="0.92" />
        </linearGradient>
        <radialGradient id="zh-ten-v">
          <stop offset="0" stopColor="#3c2a14" stopOpacity="0.2" />
          <stop offset="0.6" stopColor="#3c2a14" stopOpacity="0.07" />
          <stop offset="1" stopColor="#3c2a14" stopOpacity="0" />
        </radialGradient>
      </defs>
      <ellipse cx="98" cy="36" rx="82" ry="4.2" fill="url(#zh-ten-v)" />
      {/* Боковой побег с листиками — справа, за хвостом птицы. */}
      <path
        d="M152 15.5C158 11 163 5 166-1"
        fill="none"
        stroke="#a87c4a"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <g>
        <path d="M166-1C165-10 171-17 181-19c1 9-4 16-15 18z" fill="url(#zh-list)" />
        <path
          d="M166.5-1.5C170-7 175-12 180-18"
          fill="none"
          stroke="#f1ffd6"
          strokeWidth="0.7"
          opacity="0.8"
        />
        <path d="M161 5C167 1 176 2 182 8c-7 4-15 3-21-3z" fill="url(#zh-list)" />
        <path
          d="M161.5 5C168 4 175 5 181 7.8"
          fill="none"
          stroke="#f1ffd6"
          strokeWidth="0.7"
          opacity="0.8"
        />
      </g>
      <path
        d="M4 15.2C60 13.4 130 13.6 195 16.2c2.6.9 2.6 2.9 0 3.6C130 22 60 23.6 4 23.4c-3.4-1.6-3.4-6.600 0-8.2z"
        fill="url(#zh-derevo)"
        stroke="#7a5632"
        strokeOpacity="0.35"
        strokeWidth="0.5"
      />
      <path
        d="M12 16.300C60 14.900 120 15 178 16.800"
        fill="none"
        stroke="#fff8e6"
        strokeWidth="1.1"
        strokeLinecap="round"
        opacity="0.75"
      />
      <path
        d="M70 19.500q4-1.200 8 0M118 19.200q3-1 6 0"
        fill="none"
        stroke="#6d4a26"
        strokeWidth="0.6"
        strokeLinecap="round"
        opacity="0.5"
      />
      {/* Листик у левого кончика. */}
      <path d="M14 22.500C9 26 7 32 9 38c6-2 9-8 5-15.500z" fill="url(#zh-list)" />
      <path
        d="M13.600 23.500C11 28 9.800 33 9.300 37.500"
        fill="none"
        stroke="#f1ffd6"
        strokeWidth="0.7"
        opacity="0.8"
      />
    </svg>
  );
}
