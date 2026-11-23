/**
 * Шапки разделов банка — одна вёрстка на все разделы обеих частей
 * (components/tasks/shapka/SectionHeader.tsx).
 *
 * Номер ЕГЭ, часть и балл здесь не пишутся: их даёт структура экзамена
 * (content/struktura.js), название — список разделов (content/tasks.ts).
 * Здесь только то, что нужно самой шапке: короткое описание (не длиннее
 * двух строк на компьютере), время на экзамене, стеклянная картинка и
 * подпись к живому чертежу, который встаёт на её место по первому
 * касанию.
 *
 * Картинки — серия images/shapki/zadanie-NN (номер ЕГЭ-2027); у №3
 * остаётся прежняя картинка раздела.
 *
 * Время — то же, что на вкладке «О задании» в фактах раздела («≈ 3» —
 * «минуты на экзамене»). У разделов второй части фактов со временем
 * нет — у них оценка по демоверсии ЕГЭ-2027 (235 минут на весь экзамен).
 */

import type { RazdelKod } from './struktura';

/** Что делает живой чертёж: от этого — подсказка на чипе и курсор. */
export type VidZhivogo = 'krutit' | 'tyanut' | 'nazhat';

export interface ShapkaRazdela {
  /** Описание под заголовком: до двух строк, без «мы». */
  lead: string;
  /** Минут на экзамене, число без «≈». */
  minuty: number;
  /**
   * Картинка без расширения и размера: к ней дописывается «-560.webp» и
   * «-280.webp». Пустая строка — у раздела своя картинка (svoya).
   */
  kartinka: string;
  /** Своя картинка сайта (№3): один файл на оба размера. */
  svoya?: { src560: string; src280: string };
  /** Подсказка на чипе у картинки. */
  podskazka: string;
  vid: VidZhivogo;
  /** Объёмная фигура — крутится в 3D. */
  obyomnaya: boolean;
  /** Описание живого чертежа для скринридера. */
  opisanie: string;
}

const SHAPKI_DIR = '/images/shapki/zadanie-';

/** Шапки по коду раздела. Номер картинки — номер ЕГЭ-2027. */
export const SHAPKI: Readonly<Partial<Record<RazdelKod, ShapkaRazdela>>> = {
  planimetriya: {
    lead: 'Углы, площади и окружности — задачи по готовому чертежу, от простых к олимпиадным.',
    minuty: 3,
    kartinka: `${SHAPKI_DIR}01`,
    podskazka: 'Потяни вершину',
    vid: 'tyanut',
    obyomnaya: false,
    opisanie:
      'Треугольник с описанной и вписанной окружностями. Вершины двигаются по описанной окружности, вписанная пересчитывается.',
  },
  vektory: {
    lead: 'Длина вектора, скалярное произведение и угол — по координатам и по клетчатому рисунку.',
    minuty: 3,
    kartinka: `${SHAPKI_DIR}02`,
    podskazka: 'Потяни точку',
    vid: 'tyanut',
    obyomnaya: false,
    opisanie:
      'Два вектора на клетчатой плитке. Концы векторов двигаются по узлам сетки, координаты и сумма пересчитываются.',
  },
  stereometriya: {
    lead: 'Многогранники и тела вращения: длины, площади поверхностей и объёмы. Ответ — число.',
    minuty: 3,
    kartinka: '',
    svoya: {
      src560: '/images/zadaniya/3/kub-shar-560.webp',
      src280: '/images/zadaniya/3/kub-shar-560.webp',
    },
    podskazka: 'Покрути',
    vid: 'krutit',
    obyomnaya: true,
    opisanie: 'Стеклянный куб с вписанным шаром. Его можно вращать во все стороны.',
  },
  veroyatnost: {
    lead: 'Классическое определение вероятности: монеты, кости, жеребьёвка и выбор наугад.',
    minuty: 2,
    /* Квадрат из прежней картинки шапки №4
       (images/zadanie-04/shapka-veroyatnost-prostaya.webp, сама она не
       тронута): композиция целиком, по центру, как у остальных. */
    kartinka: `${SHAPKI_DIR}04`,
    podskazka: 'Нажми',
    vid: 'nazhat',
    obyomnaya: true,
    opisanie:
      'Игральная кость. Нажатие подбрасывает её, рядом — счётчик исходов и частота выпавшей грани.',
  },
  'slozhnaya-veroyatnost': {
    lead: 'Сложение и умножение вероятностей, условная вероятность и дерево исходов.',
    minuty: 4,
    kartinka: `${SHAPKI_DIR}05`,
    podskazka: 'Нажми на ветку',
    vid: 'nazhat',
    obyomnaya: false,
    opisanie:
      'Дерево вероятностей и игральная кость. Нажатие на ветку подсвечивает путь и считает произведение вероятностей.',
  },
  uravneniya: {
    lead: 'Линейные, дробные, иррациональные, показательные, логарифмические и тригонометрические.',
    minuty: 3,
    kartinka: `${SHAPKI_DIR}06`,
    podskazka: 'Потяни гирьку',
    vid: 'tyanut',
    obyomnaya: false,
    opisanie:
      'Весы с гирьками. Гирьки переносятся между чашами, весы наклоняются, при равновесии виден найденный x.',
  },
  vychisleniya: {
    lead: 'Степени, корни, логарифмы и тригонометрия: числовые выражения и буквенные преобразования.',
    minuty: 3,
    kartinka: `${SHAPKI_DIR}07`,
    podskazka: 'Нажми',
    vid: 'nazhat',
    obyomnaya: false,
    opisanie:
      'Корень и стопка кубиков. Нажатие выносит множитель из-под корня по шагам, кубики перестраиваются.',
  },
  proizvodnaya: {
    lead: 'Касательная, график производной и первообразная: читать график и считать по нему.',
    minuty: 3,
    kartinka: `${SHAPKI_DIR}08`,
    podskazka: 'Потяни точку',
    vid: 'tyanut',
    obyomnaya: false,
    opisanie:
      'График функции с касательной. Точка двигается по кривой, касательная поворачивается, рядом знак производной.',
  },
  'prikladnye-zadachi': {
    lead: 'Формула из физики или экономики: подставить данные, решить уравнение или неравенство.',
    minuty: 5,
    kartinka: `${SHAPKI_DIR}09`,
    podskazka: 'Потяни мяч',
    vid: 'tyanut',
    obyomnaya: false,
    opisanie:
      'Траектория брошенного мяча. Угол и сила броска меняются, отмечаются наибольшая высота и дальность.',
  },
  'tekstovye-zadachi': {
    lead: 'Движение, работа, проценты, смеси и сплавы: перевести условие на язык уравнения.',
    minuty: 6,
    kartinka: `${SHAPKI_DIR}10`,
    podskazka: 'Нажми',
    vid: 'nazhat',
    obyomnaya: false,
    opisanie:
      'Две машины на дороге едут навстречу. Скорости задаются бегунками, точка встречи подсвечивается.',
  },
  'grafiki-funkciy': {
    lead: 'Прямая, парабола, гипербола, корень, показательная и логарифмическая функции по графику.',
    minuty: 4,
    kartinka: `${SHAPKI_DIR}11`,
    podskazka: 'Потяни прямую',
    vid: 'tyanut',
    obyomnaya: false,
    opisanie:
      'Парабола и прямая на плитке. Прямую можно сдвигать и поворачивать, точки пересечения пересчитываются.',
  },
  'naibolshee-naimenshee': {
    lead: 'Точки максимума и минимума, наибольшее и наименьшее значение функции на отрезке.',
    minuty: 5,
    kartinka: `${SHAPKI_DIR}12`,
    podskazka: 'Потяни отрезок',
    vid: 'tyanut',
    obyomnaya: false,
    opisanie:
      'График функции и отрезок [a; b]. Концы отрезка двигаются, на нём отмечены наибольшее и наименьшее значения.',
  },
  'uravnenie-s-otborom': {
    lead: 'Решить уравнение и отобрать корни на промежутке — по кругу, по графику или перебором.',
    minuty: 15,
    kartinka: `${SHAPKI_DIR}13`,
    podskazka: 'Потяни точку',
    vid: 'tyanut',
    obyomnaya: false,
    opisanie:
      'Единичная окружность. Точка ведётся по окружности, угол показывается в радианах, подсвечиваются серии решений.',
  },
  'stereometriya-dokazatelstvo': {
    lead: 'Пункт а — доказательство, пункт б — вычисление: сечения, углы и расстояния.',
    minuty: 25,
    kartinka: `${SHAPKI_DIR}14`,
    podskazka: 'Покрути',
    vid: 'krutit',
    obyomnaya: true,
    opisanie:
      'Пирамида с сечением. Её можно вращать во все стороны, бегунок двигает секущую плоскость.',
  },
  neravenstvo: {
    lead: 'Показательные, логарифмические и дробно-рациональные неравенства методом интервалов.',
    minuty: 15,
    kartinka: `${SHAPKI_DIR}15`,
    podskazka: 'Потяни точку',
    vid: 'tyanut',
    obyomnaya: false,
    opisanie:
      'Числовая прямая с промежутком. Концы промежутка двигаются, нажатие делает точку выколотой или закрашенной.',
  },
  ekonomika: {
    lead: 'Кредиты и вклады с решением: схемы платежей и задачи на оптимизацию.',
    minuty: 25,
    kartinka: `${SHAPKI_DIR}16`,
    podskazka: 'Потяни бегунок',
    vid: 'tyanut',
    obyomnaya: false,
    opisanie:
      'Столбики вклада и стопка монет. Бегунки ставки и срока меняют рост вклада и итоговую сумму.',
  },
  'planimetriya-dokazatelstvo': {
    lead: 'Пункт а — доказать утверждение о фигуре, пункт б — найти длину, угол или площадь.',
    minuty: 25,
    kartinka: `${SHAPKI_DIR}17`,
    podskazka: 'Потяни окружность',
    vid: 'tyanut',
    obyomnaya: false,
    opisanie:
      'Две касающиеся окружности и их общая касательная. Малая окружность двигается вокруг большой, касательная перестраивается.',
  },
  parametr: {
    lead: 'Уравнения и системы с параметром: графический метод, свойства функций, оценки.',
    minuty: 30,
    kartinka: `${SHAPKI_DIR}18`,
    podskazka: 'Потяни бегунок',
    vid: 'tyanut',
    obyomnaya: false,
    opisanie:
      'Пучок прямых через закреплённую точку и график. Бегунок параметра поворачивает прямую, показано число решений.',
  },
  chisla: {
    lead: 'Числа и их свойства: делимость, оценки, примеры и контрпримеры.',
    minuty: 30,
    kartinka: `${SHAPKI_DIR}19`,
    podskazka: 'Покрути',
    vid: 'krutit',
    obyomnaya: true,
    opisanie:
      'Головоломка из кубиков. Её можно вращать, нажатие на деталь выдвигает и возвращает её.',
  },
};

export function shapkaRazdela(kod: RazdelKod): ShapkaRazdela {
  const s = SHAPKI[kod];
  if (s === undefined) throw new Error(`Нет шапки раздела «${kod}» в content/shapki.ts`);
  return s;
}

/** Адреса картинки для компьютера и телефона. */
export function kartinkaShapki(s: ShapkaRazdela): { src560: string; src280: string } {
  return s.svoya ?? { src560: `${s.kartinka}-560.webp`, src280: `${s.kartinka}-280.webp` };
}

/** Подписи шапки и кольца прогресса. */
export const SHAPKA_TEKSTY = {
  krohi: { glavnaya: 'Главная', bank: 'Банк заданий' },
  uroven: 'Профиль',
  chast: (n: number) => `Часть ${n}`,
  minuty: (n: number) => `≈ ${n} ${forma(n, 'минута', 'минуты', 'минут')}`,
  ball: (n: number) => `${n} ${forma(n, 'балл', 'балла', 'баллов')}`,
  zagolovok: (nomer: number, nazvanie: string) => `Задание №${nomer}. ${nazvanie}`,
  proydeno: (n: number, iz: number) => `Пройдено ${n} из ${iz}`,
  razbivka: (op: [number, number] | null, tr: [number, number] | null) =>
    [
      op === null ? null : `Опорные задачи ${op[0]}/${op[1]}`,
      tr === null ? null : `Тренажёр ${tr[0]}/${tr[1]}`,
    ]
      .filter(Boolean)
      .join(' · '),
  gost: 'Войдите — прогресс будет сохраняться',
  proyden: 'Раздел пройден',
  pravilo: 'Тип тренажёра освоен после трёх верных ответов подряд без подсказок.',
  ozhivit: 'Оживить чертёж',
} as const;

function forma(n: number, odin: string, dva: string, pyat: string): string {
  const sto = n % 100;
  if (sto >= 11 && sto <= 14) return pyat;
  const des = n % 10;
  if (des === 1) return odin;
  if (des >= 2 && des <= 4) return dva;
  return pyat;
}
