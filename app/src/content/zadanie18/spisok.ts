/**
 * Список ключевых схем №18 в согласованном порядке. Собранная схема
 * лежит в SOBRANNYE; остальные пока показываются плиткой «Скоро».
 */

import type { Skhema18, SkhemaVSpiske } from './tipy';
import { SKHEMA_VYSOTY } from './vysoty';

export const SPISOK_SKHEM: readonly SkhemaVSpiske[] = [
  {
    no: 1,
    id: 'vysoty',
    gruppa: 'treugolnik',
    nazvanie: 'Высоты треугольника и ортоцентр',
    klassicheskaya: true,
  },
  {
    no: 2,
    id: 'bissektrisa',
    gruppa: 'treugolnik',
    nazvanie: 'Биссектриса: отношение сторон и равнобедренный треугольник',
    klassicheskaya: false,
  },
  {
    no: 3,
    id: 'udvoenie-mediany',
    gruppa: 'treugolnik',
    nazvanie: 'Удвоение медианы',
    klassicheskaya: false,
  },
  {
    no: 4,
    id: 'dve-sekushchie',
    gruppa: 'okruzhnost',
    nazvanie: 'Две секущие из одной точки',
    klassicheskaya: true,
  },
  {
    no: 5,
    id: 'ravnye-ugly',
    gruppa: 'okruzhnost',
    nazvanie: 'Общая сторона и равные углы',
    klassicheskaya: true,
  },
  {
    no: 6,
    id: 'pryamye-ugly',
    gruppa: 'okruzhnost',
    nazvanie: 'Общая сторона и прямые углы',
    klassicheskaya: true,
  },
  {
    no: 7,
    id: 'trezubec',
    gruppa: 'okruzhnost',
    nazvanie: 'Лемма о трезубце',
    klassicheskaya: true,
  },
  {
    no: 8,
    id: 'ugly-i-dugi',
    gruppa: 'okruzhnost',
    nazvanie: 'Углы между хордами и секущими',
    klassicheskaya: false,
  },
  {
    no: 9,
    id: 'chetyrekhugolniki',
    gruppa: 'okruzhnost',
    nazvanie: 'Вписанный и описанный четырёхугольник',
    klassicheskaya: false,
  },
  {
    no: 10,
    id: 'kasatelnaya-sekushchaya',
    gruppa: 'kasatelnye',
    nazvanie: 'Касательная и секущая',
    klassicheskaya: false,
  },
  {
    no: 11,
    id: 'otrezki-kasatelnyh',
    gruppa: 'kasatelnye',
    nazvanie: 'Отрезки касательных и полупериметр',
    klassicheskaya: false,
  },
  {
    no: 12,
    id: 'kasayushchiesya',
    gruppa: 'kasatelnye',
    nazvanie: 'Касающиеся окружности',
    klassicheskaya: false,
  },
  {
    no: 13,
    id: 'obshchaya-kasatelnaya',
    gruppa: 'kasatelnye',
    nazvanie: 'Общая касательная двух окружностей',
    klassicheskaya: false,
  },
  {
    no: 14,
    id: 'babochka',
    gruppa: 'trapeciya',
    nazvanie: '«Бабочка» в трапеции',
    klassicheskaya: false,
  },
  {
    no: 15,
    id: 'chetyre-tochki',
    gruppa: 'trapeciya',
    nazvanie: 'Замечательное свойство трапеции',
    klassicheskaya: false,
  },
  {
    no: 16,
    id: 'ravnobokaya',
    gruppa: 'trapeciya',
    nazvanie: 'Равнобедренная трапеция',
    klassicheskaya: false,
  },
  {
    no: 17,
    id: 'menelay-cheva',
    gruppa: 'otnosheniya',
    nazvanie: 'Теоремы Менелая и Чевы',
    klassicheskaya: true,
  },
];

/** Собранные схемы: по ним живые чертежи, страницы и карточки. */
export const SOBRANNYE: readonly Skhema18[] = [SKHEMA_VYSOTY];

export function skhema18(id: string): Skhema18 | undefined {
  return SOBRANNYE.find((s) => s.id === id);
}
