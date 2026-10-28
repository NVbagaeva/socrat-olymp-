'use client';

import { useEffect } from 'react';

/* Не трогаем: листы для печати (A4) — у них свои правила; выкладки
   разборов (.vykladka) — их строки по ширине рвёт VykladkaKlient,
   он же меряет формулы в невидимых пробах. */
const SVOI_PRAVILA = '#sheet-pages, .sheet-page, .spr1-pdf, .vykladka';

/** Ближайший предок-блок: внутри него формула должна поместиться. */
function blok(el: HTMLElement): HTMLElement | null {
  for (let a = el.parentElement; a !== null; a = a.parentElement) {
    if (!getComputedStyle(a).display.startsWith('inline')) {
      return a;
    }
  }
  return null;
}

/** Правый край содержимого блока: без внутреннего поля. */
function kray(b: HTMLElement): number {
  const r = b.getBoundingClientRect();
  return r.right - (parseFloat(getComputedStyle(b).paddingRight) || 0);
}

function vylezaet(el: HTMLElement, b: HTMLElement): boolean {
  const k = kray(b) + 0.5;
  if (el.getBoundingClientRect().right > k) {
    return true;
  }
  /* Перенесённая формула — несколько строк: смотрим каждую часть. */
  for (const base of el.querySelectorAll<HTMLElement>('.katex-html > .base')) {
    if (base.getBoundingClientRect().right > k) {
      return true;
    }
  }
  return false;
}

function sbros(el: HTMLElement): void {
  const html = el.querySelector<HTMLElement>('.katex-html');
  el.removeAttribute('data-shirina');
  el.style.removeProperty('white-space');
  el.style.removeProperty('display');
  el.style.removeProperty('max-width');
  el.style.removeProperty('overflow-x');
  el.style.removeProperty('overflow-y');
  el.style.removeProperty('vertical-align');
  html?.style.removeProperty('white-space');
  const disp = el.parentElement;
  if (disp?.classList.contains('katex-display') === true) {
    disp.style.removeProperty('overflow-x');
    disp.style.removeProperty('overflow-y');
  }
}

/**
 * Длинные формулы на узком экране.
 *
 * По всему сайту формула KaTeX не рвётся (styles/base.css): если не
 * помещается в строку, она уходит на новую строку целиком. Но формула
 * шире самого блока на телефоне так вылезала за экран, и страница
 * ехала вбок. Здесь — только для таких формул, после вёрстки:
 *
 * 1. Строчной формуле разрешается перенос — KaTeX ставит его места
 *    после знаков отношения и действия (=, +, −, ·).
 * 2. Если и после переноса кусок шире блока (длинная дробь, формула
 *    в выключке), формула прокручивается вбок внутри себя, а не
 *    вместе со страницей.
 *
 * Пересчёт — при смене ширины окна, раскрытии <details> и появлении
 * новых формул (тренажёр, подсказки). Ничего не рисует.
 */
export function FormulyPoShirine() {
  useEffect(() => {
    let kadr = 0;
    let shirina = 0;
    const gotovye = new WeakSet<Element>();

    function proyti(vse: boolean): void {
      kadr = 0;
      const spisok: HTMLElement[] = [];
      for (const el of document.querySelectorAll<HTMLElement>('.katex')) {
        if (el.closest(SVOI_PRAVILA) !== null || el.parentElement?.closest('.katex') != null) {
          continue;
        }
        if (vse || !gotovye.has(el)) {
          spisok.push(el);
        }
      }
      /* Чтение и запись разведены: сначала все сбросы, потом замеры. */
      for (const el of spisok) {
        if (vse) {
          sbros(el);
        }
      }
      const shirokie: { el: HTMLElement; b: HTMLElement }[] = [];
      for (const el of spisok) {
        const r = el.getBoundingClientRect();
        if (r.width === 0) {
          /* Скрыта (закрытая вкладка или <details>) — посмотрим позже. */
          continue;
        }
        gotovye.add(el);
        const b = blok(el);
        /* Блок нулевой ширины — проба для замера, а не место на экране. */
        if (b !== null && b.getBoundingClientRect().width > 0 && vylezaet(el, b)) {
          shirokie.push({ el, b });
        }
      }
      const dlinnye: typeof shirokie = [];
      for (const s of shirokie) {
        if (s.el.parentElement?.classList.contains('katex-display') === true) {
          dlinnye.push(s);
          continue;
        }
        s.el.setAttribute('data-shirina', 'perenos');
        s.el.style.setProperty('white-space', 'normal');
        s.el.querySelector<HTMLElement>('.katex-html')?.style.setProperty('white-space', 'normal');
      }
      for (const s of shirokie) {
        if (!dlinnye.includes(s) && vylezaet(s.el, s.b)) {
          dlinnye.push(s);
        }
      }
      for (const { el } of dlinnye) {
        el.setAttribute('data-shirina', 'prokrutka');
        const disp = el.parentElement;
        if (disp?.classList.contains('katex-display') === true) {
          disp.style.setProperty('overflow-x', 'auto');
          disp.style.setProperty('overflow-y', 'hidden');
        } else {
          el.style.setProperty('display', 'inline-block');
          el.style.setProperty('max-width', '100%');
          el.style.setProperty('overflow-x', 'auto');
          el.style.setProperty('overflow-y', 'hidden');
          el.style.setProperty('vertical-align', 'middle');
        }
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
    /* Кадры живого чертежа стереометрии (.vr__kholst) — не повод
       обходить страницу заново: на вращении это каждый кадр. */
    const nablyudatel = new MutationObserver((zapisi) => {
      if (
        zapisi.every((z) => z.target instanceof Element && z.target.closest('.vr__kholst') !== null)
      ) {
        return;
      }
      zaplanirovat(false);
    });

    shirina = document.documentElement.clientWidth;
    /* Шрифты KaTeX грузятся после разметки и меняют ширину формул. */
    void document.fonts.ready.then(() => zaplanirovat(true));
    zaplanirovat(true);
    window.addEventListener('resize', onResize);
    document.addEventListener('toggle', onToggle, true);
    document.addEventListener('click', onToggle, true);
    /* Глава с content-visibility: auto появилась на экране — досчитать её. */
    document.addEventListener('contentvisibilityautostatechange', onToggle, true);
    nablyudatel.observe(document.body, { childList: true, subtree: true });
    return () => {
      window.removeEventListener('resize', onResize);
      document.removeEventListener('toggle', onToggle, true);
      document.removeEventListener('click', onToggle, true);
      document.removeEventListener('contentvisibilityautostatechange', onToggle, true);
      nablyudatel.disconnect();
      if (kadr !== 0) {
        window.cancelAnimationFrame(kadr);
      }
    };
  }, []);

  return null;
}
