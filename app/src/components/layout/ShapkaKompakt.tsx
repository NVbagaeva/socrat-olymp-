'use client';

import { useEffect } from 'react';
import './shapka-kompakt.css';

/** Прокрутили дальше — шапка компактная; вернулись выше — обычная. */
const VNIZ = 24;
const VVERH = 8;

/**
 * Компактная шапка при прокрутке: ставит .is-kompakt на ближайшую
 * .site-head. Сама шапка — серверная, здесь только слушатель прокрутки.
 * Два порога (24 и 8 px), а не один: у самой границы класс не мигает
 * туда-сюда. Высоту строки и поле под шапкой меняет CSS (site.css) так,
 * что место шапки в потоке остаётся прежним.
 */
export function ShapkaKompakt() {
  useEffect(() => {
    const shapka = document.querySelector<HTMLElement>('.site-head');
    if (shapka === null) return undefined;
    let kadr = 0;
    const obnovit = () => {
      kadr = 0;
      const y = window.scrollY;
      const sejchas = shapka.classList.contains('is-kompakt');
      if (!sejchas && y > VNIZ) shapka.classList.add('is-kompakt');
      else if (sejchas && y < VVERH) shapka.classList.remove('is-kompakt');
    };
    const naProkrutku = () => {
      if (kadr === 0) kadr = requestAnimationFrame(obnovit);
    };
    obnovit();
    window.addEventListener('scroll', naProkrutku, { passive: true });
    return () => {
      window.removeEventListener('scroll', naProkrutku);
      if (kadr !== 0) cancelAnimationFrame(kadr);
    };
  }, []);
  return null;
}
