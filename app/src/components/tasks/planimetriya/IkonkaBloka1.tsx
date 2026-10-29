import { clsx } from 'clsx';
import { useId } from 'react';
import type { ReactNode } from 'react';
import '@/components/stereo/ikonka-tela.css';

/**
 * Значки блоков I–X задания №1 — фигура в стеклянном круге, как значки
 * тел №3 (components/stereo/IkonkaTela): тот же круг, те же классы и
 * цвета из токенов. Линии фигуры синие, заливка — голубое стекло,
 * акцент типа задач оранжевым: дуга угла, средняя линия, вписанная или
 * описанная окружность, касательная.
 *
 * Все фигуры — в viewBox 0 0 40 40 и в рамке ≈ 24×24. Название блока
 * всегда стоит рядом текстом; неизвестный блок — его римская цифра.
 */

/* Части рисунка: v — линия фигуры, a — акцент, t — точка. */
const V = 'it-v';
const A = 'it-a';
const T = 'it-t';

function risunok(blok: string, steklo: string): ReactNode {
  const fill = `url(#${steklo})`;
  switch (blok) {
    case 'I':
      /* Углы в треугольнике: треугольник и дуга угла. */
      return (
        <>
          <path d="M8 30 L20 9 L32 30 Z" fill={fill} />
          <path className={A} d="M16 30 A8 8 0 0 0 11.97 23.06" />
          <path className={V} d="M8 30 L20 9 L32 30 Z" />
        </>
      );
    case 'II':
      /* Четырёхугольники: параллелограмм, диагонали и их точка пересечения. */
      return (
        <>
          <path d="M8 29 L13 11 H32 L27 29 Z" fill={fill} />
          <path className={V} d="M8 29 L13 11 H32 L27 29 Z M8 29 L32 11 M13 11 L27 29" />
          <circle className={T} cx="20" cy="20" r="2" />
        </>
      );
    case 'III':
      /* Площадь и теорема Пифагора: прямоугольный треугольник. */
      return (
        <>
          <path d="M9 9 V31 H31 Z" fill={fill} />
          <path className={A} d="M9 25.5 H14.5 V31" />
          <path className={V} d="M9 9 V31 H31 Z" />
        </>
      );
    case 'IV':
      /* Подобие: треугольник и средняя линия. */
      return (
        <>
          <path d="M8 31 L20 9 L32 31 Z" fill={fill} />
          <path className={A} d="M14 20 H26" />
          <path className={V} d="M8 31 L20 9 L32 31 Z" />
        </>
      );
    case 'V':
      /* Тригонометрия: прямоугольный треугольник и острый угол. */
      return (
        <>
          <path d="M8 31 H32 V13 Z" fill={fill} />
          <path className={A} d="M17 31 A9 9 0 0 0 15.2 25.6" />
          <path className={V} d="M8 31 H32 V13 Z M28 31 V27 H32" />
        </>
      );
    case 'VI':
      /* Углы в окружности: вписанный угол и центральный на ту же дугу. */
      return (
        <>
          <circle cx="20" cy="20" r="12" fill={fill} />
          <path className={A} d="M8.72 15.9 L20 20 L31.28 15.9" />
          <path className={V} d="M8.72 15.9 L20 32 L31.28 15.9" />
          <circle className={V} cx="20" cy="20" r="12" />
          <circle className={T} cx="20" cy="20" r="1.6" />
        </>
      );
    case 'VII':
      /* Вписанная окружность: треугольник и вписанный круг. */
      return (
        <>
          <path d="M7 32 L20 8 L33 32 Z" fill={fill} />
          <circle className={A} cx="20" cy="24.26" r="7.74" />
          <path className={V} d="M7 32 L20 8 L33 32 Z" />
        </>
      );
    case 'VIII':
      /* Описанная окружность: вписанный четырёхугольник. */
      return (
        <>
          <path d="M9.61 14 L29.19 12.29 L30.39 26 L14 30.39 Z" fill={fill} />
          <circle className={A} cx="20" cy="20" r="12" />
          <path className={V} d="M9.61 14 L29.19 12.29 L30.39 26 L14 30.39 Z" />
        </>
      );
    case 'IX':
      /* Теорема синусов: тупоугольный треугольник у хорды и радиус R. */
      return (
        <>
          <circle cx="20" cy="20" r="12" fill={fill} />
          <path className={A} d="M20 20 L31.28 15.9" />
          <path className={V} d="M8.72 15.9 H31.28 L20 8 Z" />
          <circle className={V} cx="20" cy="20" r="12" />
          <circle className={T} cx="20" cy="20" r="1.6" />
        </>
      );
    case 'X':
      /* Ещё темы: касательная (акцент) и секущая из одной точки. */
      return (
        <>
          <circle cx="16" cy="22" r="9" fill={fill} />
          <path className={A} d="M33 10 L14.5 13.13" />
          <path className={V} d="M33 10 L7.31 24.33" />
          <circle className={V} cx="16" cy="22" r="9" />
          <circle className={T} cx="33" cy="10" r="2" />
        </>
      );
    default:
      return null;
  }
}

export function IkonkaBloka1({ blok, className }: { blok: string; className?: string }) {
  /* Своя заливка у каждого значка: id без двоеточий — для Safari. */
  const steklo = `ib1-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;
  const pic = risunok(blok, steklo);
  if (pic === null) {
    return (
      <span className={clsx('ikonka-tela ikonka-tela--nomer', className)} aria-hidden="true">
        <span className="no-math-check">{blok || '•'}</span>
      </span>
    );
  }
  return (
    <span className={clsx('ikonka-tela', className)} aria-hidden="true">
      <svg viewBox="0 0 40 40" aria-hidden="true" focusable="false">
        <defs>
          <linearGradient id={steklo} x1="0" y1="0" x2="0.4" y2="1">
            <stop offset="0" className="it-g0" />
            <stop offset="1" className="it-g1" />
          </linearGradient>
        </defs>
        {pic}
      </svg>
    </span>
  );
}
