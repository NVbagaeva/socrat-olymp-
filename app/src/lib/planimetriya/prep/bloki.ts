/**
 * Блоки тренировок навыков задания №1 — порядок, названия, адреса.
 * Порядок — как в теории: углы, прямоугольный треугольник,
 * четырёхугольники, площади, Пифагор, тригонометрия, окружность.
 */

import {
  BLOK_CHETYREHUGOLNIKI,
  BLOK_KASATELNYE,
  BLOK_OKRUZHNOST,
  BLOK_PIFAGOR,
  BLOK_PLOSHCHADI,
  BLOK_PRYAMOUGOLNYY,
  BLOK_SMEZHNYE,
  BLOK_SUMMA,
  BLOK_TRIG,
} from './mikro';
import type { Blok, Mikro } from './types';

export const BLOKI: Blok[] = [
  {
    id: 'P1-1',
    slug: 'summa-uglov',
    no: '01',
    nazvanie: 'Сумма углов и равнобедренный треугольник',
    lead: 'Третий угол, углы при основании, внешний угол',
    formuly: [
      '\\angle A + \\angle B + \\angle C = 180^\\circ',
      '\\angle_{\\text{внеш}} = \\angle A + \\angle B',
      'AC = BC \\Rightarrow \\angle A = \\angle B',
    ],
    zadachi: BLOK_SUMMA,
  },
  {
    id: 'P1-2',
    slug: 'smezhnye-i-parallelnye',
    no: '02',
    nazvanie: 'Смежные углы и параллельные прямые',
    lead: 'Смежные, вертикальные, накрест лежащие и односторонние углы',
    formuly: [
      '\\alpha_{\\text{смеж}} + \\beta_{\\text{смеж}} = 180^\\circ',
      '\\text{вертикальные и накрест лежащие углы равны}',
      '\\alpha_{\\text{одност}} + \\beta_{\\text{одност}} = 180^\\circ',
    ],
    zadachi: BLOK_SMEZHNYE,
  },
  {
    id: 'P1-3',
    slug: 'pryamougolnyy-treugolnik',
    no: '03',
    nazvanie: 'Прямоугольный треугольник',
    lead: 'Острые углы, медиана к гипотенузе, высота, катет против 30°',
    formuly: [
      '\\angle A + \\angle B = 90^\\circ',
      'CM = \\dfrac{AB}{2}',
      'a_{30^\\circ} = \\dfrac{c}{2}',
    ],
    zadachi: BLOK_PRYAMOUGOLNYY,
  },
  {
    id: 'P1-4',
    slug: 'chetyrehugolniki',
    no: '04',
    nazvanie: 'Углы четырёхугольников',
    lead: 'Параллелограмм, ромб, прямоугольник, трапеция; высоты и биссектрисы',
    formuly: [
      '\\angle A + \\angle B = 180^\\circ\\ (\\text{параллелограмм})',
      '\\angle A + \\angle B + \\angle C + \\angle D = 360^\\circ',
      '\\angle AOB = 90^\\circ + \\dfrac{\\angle C}{2}',
    ],
    zadachi: BLOK_CHETYREHUGOLNIKI,
  },
  {
    id: 'P1-5',
    slug: 'ploshchadi',
    no: '05',
    nazvanie: 'Площади и средние линии',
    lead: 'Треугольник, параллелограмм, трапеция, ромб, подобие',
    formuly: [
      'S_{\\triangle} = \\dfrac12 ah = \\dfrac12 ab\\sin C',
      'S_{\\text{трап}} = \\dfrac{a + b}{2}h',
      'S_2 = k^2 S_1',
    ],
    zadachi: BLOK_PLOSHCHADI,
  },
  {
    id: 'P1-6',
    slug: 'pifagor',
    no: '06',
    nazvanie: 'Теорема Пифагора и особые треугольники',
    lead: 'Гипотенуза, катет, диагональ, высота',
    formuly: ['c^2 = a^2 + b^2', 'c = a\\sqrt2\\ (45^\\circ),\\quad h = \\dfrac{a\\sqrt3}{2}'],
    zadachi: BLOK_PIFAGOR,
  },
  {
    id: 'P1-7',
    slug: 'trigonometriya',
    no: '07',
    nazvanie: 'Синус, косинус и тангенс',
    lead: 'По сторонам прямоугольного треугольника и обратно',
    formuly: [
      '\\sin A = \\dfrac{BC}{AB},\\ \\cos A = \\dfrac{AC}{AB},\\ \\operatorname{tg} A = \\dfrac{BC}{AC}',
      '\\sin^2 A + \\cos^2 A = 1',
    ],
    zadachi: BLOK_TRIG,
  },
  {
    id: 'P1-8',
    slug: 'vpisannye-ugly',
    no: '08',
    nazvanie: 'Центральные и вписанные углы',
    lead: 'Дуги, вписанный угол, угол на диаметр',
    formuly: [
      '\\angle ACB = \\dfrac12\\smile AB = \\dfrac12\\angle AOB',
      '\\text{угол на диаметр} = 90^\\circ',
    ],
    zadachi: BLOK_OKRUZHNOST,
  },
  {
    id: 'P1-9',
    slug: 'kasatelnye-i-okruzhnosti',
    no: '09',
    nazvanie: 'Касательные, вписанная и описанная окружности',
    lead: 'Радиус и касательная, отрезки касательных, описанный и вписанный четырёхугольник',
    formuly: ['OA \\perp CA', 'AB + CD = BC + AD', '\\angle A + \\angle C = 180^\\circ'],
    zadachi: BLOK_KASATELNYE,
  },
];

export function blokBySlug(slug: string): Blok | undefined {
  return BLOKI.find((b) => b.slug === slug);
}

export function mikroById(id: string): Mikro | undefined {
  for (const b of BLOKI) {
    const found = b.zadachi.find((m) => m.id === id);
    if (found !== undefined) return found;
  }
  return undefined;
}
