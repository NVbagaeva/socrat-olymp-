/**
 * Слоты иллюстраций сюжетов задания №10.
 *
 * У каждого прототипа есть место под картинку сюжета:
 *   public/illustrations/zadanie-10/<id прототипа>.webp  — основной файл;
 *   public/illustrations/zadanie-10/<id прототипа>.png   — запасной.
 * Картинки нарисовал автор (по одной на сюжет П-01…П-29). Новые
 * прототипы берут картинку родственного сюжета (FAYL). Пока файла нет,
 * слот ничего не выводит: никаких заглушек «Иллюстрация готовится».
 * Пустые слоты перечисляет `pnpm test:illyustracii-10`.
 *
 * Модуль серверный (node:fs): наличие файлов проверяется при сборке.
 */

import fs from 'node:fs';
import path from 'node:path';
import { assetUrl } from '../assetUrl';
import { PROTOTYPES } from './prototypes';

export const PAPKA_ILLYUSTRACIY = '/illustrations/zadanie-10';

export interface Illyustraciya {
  id: string;
  webp: string;
  png: string;
  alt: string;
  width: number;
  height: number;
}

function publicDir(): string {
  return path.join(process.cwd(), 'public');
}

/** Ширина и высота PNG из заголовка IHDR. */
export function razmerPng(file: string): { width: number; height: number } | null {
  try {
    const buf = fs.readFileSync(file);
    if (buf.length < 24 || buf.toString('ascii', 1, 4) !== 'PNG') {
      return null;
    }
    return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
  } catch {
    return null;
  }
}

/** Новые прототипы с тем же сюжетом, что у прототипа из классификации. */
const FAYL: Record<string, string> = { P30: 'P20', P31: 'P21', P32: 'P21', P34: 'P27' };

/** Что нарисовано на картинке — alt по-русски. */
const ALT: Record<string, string> = {
  P01: 'Висячий мост над водой: два пилона, провисающие цепи и вертикальные ванты, по мосту едет грузовик',
  P02: 'Газета и карточка рейтинга издания: звёзды и шкалы оценок',
  P03: 'Сумка из интернет-магазина, пять звёзд отзывов и карточка покупателя',
  P04: 'Вилка в розетке и предохранитель в цепи, рядом значок тока',
  P05: 'Аккумулятор, подключённый через резистор к лампе накаливания',
  P06: 'Мини-печь и масляный обогреватель, включённые в одну розетку',
  P07: 'Настольная лампа, собирающая линза и экран, на котором видно изображение лампы',
  P08: 'Тепловоз едет мимо платформы, от него расходятся звуковые волны',
  P09: 'Колонка и микрофон на тележках едут навстречу друг другу, между ними звуковые волны',
  P10: 'Батискаф под водой посылает ультразвуковой сигнал ко дну',
  P11: 'Автомобиль тормозит на дороге, рядом шкала тормозного пути и знак внимания',
  P12: 'Мотоциклист выезжает из города и разгоняется по шоссе',
  P13: 'Лебёдка наматывает трос на барабан, стрелка показывает угол поворота',
  P14: 'Коробки с товаром, ценник, монеты и график выручки с наибольшим значением',
  P15: 'Цилиндрический бак с краном у дна: вода вытекает, уровень опускается',
  P16: 'Электроплитка с раскалённой спиралью, термометр и график температуры',
  P17: 'Волейбольный мяч подброшен вверх, отмечена высота и секундомер',
  P18: 'Спортивный автомобиль разгоняется по дороге, рядом спидометр',
  P19: 'Маяк на скале, луч взгляда касается линии горизонта над морем',
  P20: 'Яркая звезда, излучающая свет, вокруг орбиты планет',
  P21: 'Цилиндр с поршнем резко сжимает газ, рядом манометр',
  P22: 'Контейнер с радиоактивным изотопом, кубики вещества уменьшаются, песочные часы',
  P23: 'Водолазный колокол опускают на цепи под воду',
  P24: 'Старый телевизор, конденсатор и график убывающего напряжения',
  P25: 'Радиатор отопления: по трубе течёт горячая вода и остывает',
  P26: 'Футбольный мяч летит по дуге, у мяча отмечен угол броска',
  P27: 'Груз на пружине колеблется вверх-вниз, рядом синусоида',
  P28: 'Два шара катятся под углом друг к другу и сталкиваются',
  P29: 'Теннисный мячик летит по дуге над кирпичной стеной',
  P33: 'Лазерный луч проходит через дифракционную решётку: на изогнутом экране яркие точки-максимумы, угол отсчитан от перпендикуляра к решётке',
};

/** Файл картинки прототипа (без расширения). */
export function faylSlota(id: string): string {
  return FAYL[id] ?? id;
}

export function putiSlota(id: string): { webp: string; png: string } {
  const f = faylSlota(id);
  return { webp: `${PAPKA_ILLYUSTRACIY}/${f}.webp`, png: `${PAPKA_ILLYUSTRACIY}/${f}.png` };
}

/** alt картинки: что на ней нарисовано; для пустого слота — сюжет прототипа. */
export function altSlota(id: string, zapasnoy: string): string {
  return ALT[faylSlota(id)] ?? zapasnoy;
}

/** Иллюстрация прототипа или null, если картинку ещё не положили. */
export function illyustraciya(id: string): Illyustraciya | null {
  const proto = PROTOTYPES.find((p) => p.id === id);
  if (proto === undefined) {
    return null;
  }
  const { webp, png } = putiSlota(id);
  const fWebp = path.join(publicDir(), webp);
  const fPng = path.join(publicDir(), png);
  if (!fs.existsSync(fWebp) || !fs.existsSync(fPng)) {
    return null;
  }
  const r = razmerPng(fPng);
  if (r === null) {
    return null;
  }
  return { id, webp: assetUrl(webp), png: assetUrl(png), alt: altSlota(id, proto.alt), ...r };
}

/** Слоты всех прототипов: заполнен ли каждый. */
export function slotyIllyustraciy(): { id: string; title: string; alt: string; est: boolean }[] {
  return PROTOTYPES.map((p) => ({
    id: p.id,
    title: p.title,
    alt: altSlota(p.id, p.alt),
    est: illyustraciya(p.id) !== null,
  }));
}
