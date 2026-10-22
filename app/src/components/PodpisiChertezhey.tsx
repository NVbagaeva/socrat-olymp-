'use client';

import { useEffect } from 'react';

/* Листы для печати (A4) живут по своим правилам — их не трогаем. */
const PECHAT = '#sheet-pages, .sheet-page, .spr1-pdf';
/** Мельче этого подпись на экране не читается. */
const MIN_PX = 10;
/** Во сколько раз подпись может вырасти, не больше. */
const MAX_ROST = 1.6;
/** Иконки и формулы не трогаем — только чертежи. */
const MIN_SHIRINA = 120;
const SHAGI = [1, 0.75, 0.5, 0.25];

function nalozheniya(korobki: DOMRect[]): number {
  let n = 0;
  korobki.forEach((a, i) => {
    for (const b of korobki.slice(i + 1)) {
      const x = Math.min(a.right, b.right) - Math.max(a.left, b.left);
      const y = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
      if (x > 1 && y > 1) {
        n += 1;
      }
    }
  });
  return n;
}

function podognat(svg: SVGSVGElement): void {
  const podpisi = [...svg.querySelectorAll<SVGTextElement>('text')];
  for (const t of podpisi) {
    t.style.removeProperty('font-size');
  }
  const vb = svg.viewBox.baseVal;
  const r = svg.getBoundingClientRect();
  if (podpisi.length === 0 || vb === null || vb.width === 0 || r.width < MIN_SHIRINA) {
    return;
  }
  /* Масштаб чертежа: сколько экранных пикселей в единице viewBox. */
  const k = Math.min(r.width / vb.width, r.height / (vb.height || vb.width));
  const MIN = MIN_PX / k;
  const ishodnye = podpisi.map((t) => parseFloat(getComputedStyle(t).fontSize) || 0);
  if (!ishodnye.some((fs) => fs > 0 && fs < MIN)) {
    return;
  }
  const korobki = () => podpisi.map((t) => t.getBoundingClientRect()).filter((b) => b.width > 0);
  const bylo = nalozheniya(korobki());
  /* Крупнее — только пока подписи не налезают друг на друга сильнее,
     чем в исходном чертеже; иначе рост уменьшается шагами. */
  for (const shag of SHAGI) {
    podpisi.forEach((t, i) => {
      const fs = ishodnye[i] ?? 0;
      if (fs <= 0 || fs >= MIN) {
        return;
      }
      const nado = Math.min(MIN, fs * MAX_ROST);
      t.style.setProperty('font-size', `${(fs + (nado - fs) * shag).toFixed(2)}px`);
    });
    if (nalozheniya(korobki()) <= bylo) {
      return;
    }
  }
  for (const t of podpisi) {
    t.style.removeProperty('font-size');
  }
}

/**
 * Подписи чертежей на узком экране.
 *
 * Чертёж масштабируется по ширине через viewBox — вместе с ним
 * мельчают и подписи: на телефоне цифры у осей выходили по 6px.
 * Здесь подпись, которая на экране мельче 10px, подрастает (не больше
 * чем в 1,6 раза) — ровно настолько, чтобы подписи не налезали друг
 * на друга. На широком экране чертёж не меняется. Ничего не рисует.
 */
export function PodpisiChertezhey() {
  useEffect(() => {
    let kadr = 0;
    let shirina = 0;
    const gotovye = new WeakSet<SVGSVGElement>();

    function proyti(vse: boolean): void {
      kadr = 0;
      for (const svg of document.querySelectorAll<SVGSVGElement>('main svg[viewBox]')) {
        if (svg.closest(PECHAT) !== null || svg.closest('.katex') !== null) {
          continue;
        }
        if (!vse && gotovye.has(svg)) {
          continue;
        }
        if (svg.getBoundingClientRect().width === 0) {
          continue;
        }
        gotovye.add(svg);
        podognat(svg);
      }
    }

    let vsePoSmene = false;
    function zaplanirovat(vse: boolean): void {
      vsePoSmene ||= vse;
      if (kadr === 0) {
        kadr = window.requestAnimationFrame(() => {
          const v = vsePoSmene;
          vsePoSmene = false;
          proyti(v);
        });
      }
    }

    function onResize(): void {
      const w = document.documentElement.clientWidth;
      if (w !== shirina) {
        shirina = w;
        zaplanirovat(true);
      }
    }
    const onToggle = () => zaplanirovat(false);
    /* Чертёж перерисовался на месте (тренажёр, ползунок): пересчитать. */
    const nablyudatel = new MutationObserver((zapisi) => {
      for (const z of zapisi) {
        const svg = z.target instanceof Element ? z.target.closest('svg') : null;
        if (svg instanceof SVGSVGElement) {
          gotovye.delete(svg);
        }
      }
      zaplanirovat(false);
    });

    shirina = document.documentElement.clientWidth;
    void document.fonts.ready.then(() => zaplanirovat(true));
    zaplanirovat(true);
    window.addEventListener('resize', onResize);
    document.addEventListener('toggle', onToggle, true);
    document.addEventListener('click', onToggle, true);
    nablyudatel.observe(document.body, { childList: true, subtree: true });
    return () => {
      window.removeEventListener('resize', onResize);
      document.removeEventListener('toggle', onToggle, true);
      document.removeEventListener('click', onToggle, true);
      nablyudatel.disconnect();
      if (kadr !== 0) {
        window.cancelAnimationFrame(kadr);
      }
    };
  }, []);

  return null;
}
