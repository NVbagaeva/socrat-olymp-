/**
 * Список ключевых схем №18 в согласованном порядке. Собранная схема
 * лежит в SOBRANNYE; остальные пока показываются плиткой «Скоро».
 */

import type { Skhema18, SkhemaVSpiske } from './tipy';
import { SKHEMA_BABOCHKA } from './babochka';
import { SKHEMA_BISSEKTRISA } from './bissektrisa';
import { SKHEMA_CHETYRE_TOCHKI } from './chetyreTochki';
import { SKHEMA_MENELAY } from './menelay';
import {
  SKHEMA_METOD,
  SKHEMA_OBSHCHAYA_VYSOTA,
  SKHEMA_OBSHCHIY_UGOL,
  SKHEMA_RELSY,
} from './ploshchadi';
import { SKHEMA_RAVNOBOKAYA } from './ravnobokaya';
import { SKHEMA_KASATELNAYA } from './kasatelnaya';
import { SKHEMA_KASAYUSHCHIESYA } from './kasayushchiesya';
import { SKHEMA_MEDIANA } from './mediana';
import { SKHEMA_OBSHCHAYA_KASATELNAYA } from './obshchayaKasatelnaya';
import { SKHEMA_OTREZKI_KASATELNYH } from './otrezkiKasatelnyh';
import { SKHEMA_RAVNYE_UGLY } from './ravnyeUgly';
import { SKHEMA_SEKUSHCHIE } from './sekushchie';
import { SKHEMA_PRYAMYE_UGLY } from './pryamyeUgly';
import { SKHEMA_SREDLIN_TRAP } from './sredlinTrap';
import { SKHEMA_SREDLIN_TREUG } from './sredlinTreug';
import { SKHEMA_STEPEN_TOCHKI } from './stepenTochki';
import { SKHEMA_TREZUBEC } from './trezubec';
import { SKHEMA_UGLY_DUGI } from './uglyDugi';
import { SKHEMA_VPISANNYY } from './vpisannyy';
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
    nazvanie: 'Вписанный четырёхугольник',
    klassicheskaya: false,
  },
  {
    no: 10,
    id: 'sredlin-treug',
    gruppa: 'treugolnik',
    nazvanie: 'Средняя линия треугольника',
    klassicheskaya: false,
  },
  {
    no: 11,
    id: 'sredlin-trap',
    gruppa: 'trapeciya',
    nazvanie: 'Средняя линия трапеции',
    klassicheskaya: false,
  },
  {
    no: 12,
    id: 'kasatelnaya-sekushchaya',
    gruppa: 'kasatelnye',
    nazvanie: 'Касательная и секущая',
    klassicheskaya: false,
  },
  {
    no: 13,
    id: 'otrezki-kasatelnyh',
    gruppa: 'kasatelnye',
    nazvanie: 'Отрезки касательных и полупериметр',
    klassicheskaya: false,
  },
  {
    no: 14,
    id: 'kasayushchiesya',
    gruppa: 'kasatelnye',
    nazvanie: 'Касающиеся окружности',
    klassicheskaya: false,
  },
  {
    no: 15,
    id: 'obshchaya-kasatelnaya',
    gruppa: 'kasatelnye',
    nazvanie: 'Общая касательная двух окружностей',
    klassicheskaya: false,
  },
  {
    no: 16,
    id: 'babochka',
    gruppa: 'trapeciya',
    nazvanie: '«Бабочка» в трапеции',
    klassicheskaya: false,
  },
  {
    no: 17,
    id: 'chetyre-tochki',
    gruppa: 'trapeciya',
    nazvanie: 'Замечательное свойство трапеции',
    klassicheskaya: false,
  },
  {
    no: 18,
    id: 'ravnobokaya',
    gruppa: 'trapeciya',
    nazvanie: 'Равнобедренная трапеция',
    klassicheskaya: false,
  },
  {
    no: 19,
    id: 'menelay-cheva',
    gruppa: 'otnosheniya',
    nazvanie: 'Теоремы Менелая и Чевы',
    klassicheskaya: true,
  },
  {
    no: 20,
    id: 'metod-ploshchadey',
    gruppa: 'ploshchadi',
    nazvanie: 'Метод площадей',
    klassicheskaya: false,
  },
  {
    no: 21,
    id: 'obshchaya-vysota',
    gruppa: 'ploshchadi',
    nazvanie: 'Площади треугольников с общей высотой',
    klassicheskaya: false,
  },
  {
    no: 22,
    id: 'obshchiy-ugol',
    gruppa: 'ploshchadi',
    nazvanie: 'Площади треугольников с общим углом',
    klassicheskaya: false,
  },
  {
    no: 23,
    id: 'relsy-evklida',
    gruppa: 'ploshchadi',
    nazvanie: '«Рельсы Евклида»',
    klassicheskaya: false,
  },
  {
    no: 24,
    id: 'stepen-tochki',
    gruppa: 'okruzhnost',
    nazvanie: 'Степень точки',
    klassicheskaya: false,
  },
];

/** Собранные схемы: по ним живые чертежи, страницы и карточки. */
export const SOBRANNYE: readonly Skhema18[] = [
  SKHEMA_VYSOTY,
  SKHEMA_BISSEKTRISA,
  SKHEMA_MEDIANA,
  SKHEMA_SEKUSHCHIE,
  SKHEMA_RAVNYE_UGLY,
  SKHEMA_PRYAMYE_UGLY,
  SKHEMA_TREZUBEC,
  SKHEMA_UGLY_DUGI,
  SKHEMA_VPISANNYY,
  SKHEMA_SREDLIN_TREUG,
  SKHEMA_SREDLIN_TRAP,
  SKHEMA_KASATELNAYA,
  SKHEMA_OTREZKI_KASATELNYH,
  SKHEMA_KASAYUSHCHIESYA,
  SKHEMA_OBSHCHAYA_KASATELNAYA,
  SKHEMA_BABOCHKA,
  SKHEMA_CHETYRE_TOCHKI,
  SKHEMA_RAVNOBOKAYA,
  SKHEMA_MENELAY,
  SKHEMA_METOD,
  SKHEMA_OBSHCHAYA_VYSOTA,
  SKHEMA_OBSHCHIY_UGOL,
  SKHEMA_RELSY,
  SKHEMA_STEPEN_TOCHKI,
];

export function skhema18(id: string): Skhema18 | undefined {
  return SOBRANNYE.find((s) => s.id === id);
}
