import type { ReactNode } from 'react';
import { IkonkaNomer, IkonkaVKruge, IT } from '@/components/ui/IkonkaVKruge';

/**
 * Значки разделов задания №3 — тела в стеклянном круге.
 *
 * Общие для генератора, тренажёра, опорных задач и «Собрать вариант»:
 * ключ — slug раздела (lib/zadanie3/index.ts). Рисунок — inline SVG,
 * загружать нечего, поэтому сломаться нечему. Неизвестный ключ — римская
 * цифра раздела в том же круге, а не текст ключа.
 *
 * Чертёж по правилам стереометрии: видимые рёбра сплошные, невидимые —
 * тонкий пунктир, основания тел вращения — эллипсы с пунктирной задней
 * половиной. Рёбра синие, грани — голубое стекло, один акцент оранжевым.
 * Все фигуры — в одном viewBox 0 0 40 40 и в одной рамке ≈ 24×24;
 * круг и стекло — общие (components/ui/IkonkaVKruge).
 */

export type VidTela =
  | 'parallelepiped'
  | 'prizma'
  | 'piramida'
  | 'konus'
  | 'cilindr'
  | 'shar'
  | 'vpisannyy-cilindr'
  | 'vpisannaya-sfera';

const NAZVANIYA: Record<VidTela, string> = {
  parallelepiped: 'Параллелепипед',
  prizma: 'Призма',
  piramida: 'Пирамида',
  konus: 'Конус',
  cilindr: 'Цилиндр',
  shar: 'Шар',
  'vpisannyy-cilindr': 'Цилиндр, вписанный в призму',
  'vpisannaya-sfera': 'Шар, вписанный в куб',
};

export const VIDY_TEL = Object.keys(NAZVANIYA) as VidTela[];

export function estIkonkaTela(vid: string): vid is VidTela {
  return Object.hasOwn(NAZVANIYA, vid);
}

/* Части рисунка: v — видимое ребро, h — невидимое, a — акцент. */
const V = IT.v;
const H = IT.h;
const A = IT.a;

/** Рисунки тел: fill — заливка силуэта «стекло», остальное — линии поверх. */
function risunok(vid: VidTela, fill: string): ReactNode {
  switch (vid) {
    case 'parallelepiped':
      /* Куб в косоугольной проекции: передняя грань 16×16, сдвиг (8, −6). */
      return (
        <>
          <path d="M8 14 L16 8 H32 V24 L24 30 H8 Z" fill={fill} />
          <path className={H} d="M16 8 V24 H32 M16 24 L8 30" />
          <path className={A} d="M8 30 L32 8" />
          <path className={V} d="M8 14 H24 V30 H8 Z M8 14 L16 8 H32 L24 14 M24 30 L32 24 V8" />
        </>
      );
    case 'prizma':
      /* Треугольная призма: заднее ребро основания AC — невидимое. */
      return (
        <>
          <path d="M8 12 L32 9 V26 L22 33 L8 29 Z" fill={fill} />
          <path className={H} d="M8 29 L32 26" />
          <path className={V} d="M8 12 L22 16 L32 9 Z M8 12 V29 L22 33 L32 26 V9 M22 16 V33" />
          <circle className="it-t" cx="32" cy="9" r="2" />
        </>
      );
    case 'piramida':
      /* Четырёхугольная пирамида: вершина S — акцент, ребро SD и стороны
         основания у D — невидимые. */
      return (
        <>
          <path d="M20 7 L7 28 L21 32 L33 26 Z" fill={fill} />
          <path className={H} d="M7 28 L19 23 L33 26 M19 23 L20 7" />
          <path className={V} d="M20 7 L7 28 L21 32 L33 26 Z M20 7 L21 32" />
          <circle className="it-t" cx="20" cy="7" r="2" />
        </>
      );
    case 'konus':
      /* Конус: высота из вершины в центр основания — акцент. */
      return (
        <>
          <path d="M20 7 L8 28 A12 4 0 0 0 32 28 Z" fill={fill} />
          <path className={H} d="M8 28 A12 4 0 0 1 32 28" />
          <path className={A} d="M20 7 V28" />
          <path className={V} d="M20 7 L8 28 A12 4 0 0 0 32 28 Z" />
          <circle className="it-t" cx="20" cy="28" r="1.4" />
        </>
      );
    case 'cilindr':
      /* Цилиндр: ось — акцент; задняя половина нижнего основания — пунктир. */
      return (
        <>
          <path d="M9 11 V28 A11 3.6 0 0 0 31 28 V11 Z" fill={fill} />
          <path className={H} d="M9 28 A11 3.6 0 0 1 31 28" />
          <path className={A} d="M20 11 V28" />
          <ellipse className={V} cx="20" cy="11" rx="11" ry="3.6" />
          <path className={V} d="M9 11 V28 A11 3.6 0 0 0 31 28 V11" />
        </>
      );
    case 'shar':
      /* Шар: экватор — эллипс с пунктирной задней половиной, радиус — акцент. */
      return (
        <>
          <circle cx="20" cy="20" r="12" fill={fill} />
          <path className={H} d="M8 20 A12 3.8 0 0 1 32 20" />
          <path className={V} d="M8 20 A12 3.8 0 0 0 32 20" />
          <path className={A} d="M20 20 H32" />
          <circle className={V} cx="20" cy="20" r="12" />
          <circle className="it-t" cx="20" cy="20" r="1.4" />
        </>
      );
    case 'vpisannyy-cilindr':
      /* Правильная четырёхугольная призма (основание — ромб в проекции)
         и вписанный в неё цилиндр — акцентом. */
      return (
        <>
          <path d="M8 11 L20 7 L32 11 V29 L20 33 L8 29 Z" fill={fill} />
          <path className={H} d="M8 29 L20 25 L32 29 M20 7 V25" />
          <path className={`${A} it-a--h`} d="M11.5 29 A8.5 2.8 0 0 1 28.5 29" />
          <path className={A} d="M11.5 11 V29 A8.5 2.8 0 0 0 28.5 29 V11" />
          <ellipse className={A} cx="20" cy="11" rx="8.5" ry="2.8" />
          <path
            className={V}
            d="M8 11 L20 7 L32 11 L20 15 Z M8 11 V29 L20 33 L32 29 V11 M20 15 V33"
          />
        </>
      );
    case 'vpisannaya-sfera':
      /* Куб (основание — ромб в проекции) и вписанный шар — акцентом. */
      return (
        <>
          <path d="M8 13 L20 9 L32 13 V27 L20 31 L8 27 Z" fill={fill} />
          <path className={H} d="M8 27 L20 23 L32 27 M20 9 V23" />
          <path className={`${A} it-a--h`} d="M13 20 A7 2.3 0 0 1 27 20" />
          <path className={A} d="M13 20 A7 2.3 0 0 0 27 20" />
          <circle className={A} cx="20" cy="20" r="7" />
          <path
            className={V}
            d="M8 13 L20 9 L32 13 L20 17 Z M8 13 V27 L20 31 L32 27 V13 M20 17 V31"
          />
        </>
      );
  }
}

export interface IkonkaTelaProps {
  /** slug раздела №3: «parallelepiped», «konus»… */
  vid: string;
  /** Римская цифра раздела — запасной значок, если рисунка нет. */
  nomer?: string;
  /** Подпись для чтения с экрана; по умолчанию — название тела. */
  label?: string;
  className?: string;
}

export function IkonkaTela({ vid, nomer, label, className }: IkonkaTelaProps) {
  if (!estIkonkaTela(vid)) {
    return (
      <IkonkaNomer
        nomer={nomer ?? '•'}
        label={label ?? (nomer === undefined ? 'Раздел' : `Раздел ${nomer}`)}
        {...(className === undefined ? {} : { className })}
      />
    );
  }
  return (
    <IkonkaVKruge
      risunok={(steklo) => risunok(vid, steklo)}
      label={label ?? NAZVANIYA[vid]}
      {...(className === undefined ? {} : { className })}
    />
  );
}
