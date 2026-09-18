/**
 * Лабиринт паука: чертёж к задаче 33 конспекта.
 *
 * Схему подтвердил автор: пять выходов A–E, у A, B и C вероятность по
 * 0,25, у D и E — по 0,125. Ответ задачи 0,125.
 *
 * Развилок при этом четыре, а не три, как говорилось раньше: в дереве,
 * где на каждой развилке ровно две дороги, выходов всегда на одну
 * больше, чем развилок. Пять выходов при трёх развилках невозможны.
 * Вероятности автор назвал верно — ошибочным был только счёт развилок,
 * и он ни на что не влиял: ответ считается по дереву.
 *
 * Дерево ниже и есть эта схема. Картинка лабиринта из конспекта для
 * сверки не годится: в PDF она растровая, а присланный отдельно файл
 * labirint-clean.png — декоративный рисунок без подписанных выходов,
 * по нему структуру не прочитать. Поэтому источник истины здесь —
 * слова автора, а не изображение.
 *
 * Если схема всё-таки поменяется, правится только дерево `LABIRINT`:
 * и чертёж, и ответ задачи пересчитаются сами, потому что оба
 * считаются по нему, а не записаны числами.
 *
 * Правило задачи: развернуться паук не может, поэтому на каждой
 * развилке он равновероятно выбирает один из путей вперёд.
 */

/** Узел лабиринта: либо развилка на два пути, либо выход. */
export type Uzel = { vid: 'razvilka'; verh: Uzel; niz: Uzel } | { vid: 'vyhod'; imya: string };

const vyhod = (imya: string): Uzel => ({ vid: 'vyhod', imya });

/**
 * Схема автора: четыре развилки, пять выходов.
 *
 * Лабиринт несимметричный: до A, B и C паук проходит две развилки, до
 * D и E — три. Отсюда 0,25 у первых трёх и 0,125 у последних двух.
 * Автотест сверяет эти числа с чертежом при каждой сборке.
 */
export const LABIRINT: Uzel = {
  vid: 'razvilka',
  verh: { vid: 'razvilka', verh: vyhod('A'), niz: vyhod('B') },
  niz: {
    vid: 'razvilka',
    verh: vyhod('C'),
    niz: { vid: 'razvilka', verh: vyhod('D'), niz: vyhod('E') },
  },
};

/** Вероятность прийти к выходу с этим именем. */
export function veroyatnostVyhoda(uzel: Uzel, imya: string, shans = 1): number {
  if (uzel.vid === 'vyhod') {
    return uzel.imya === imya ? shans : 0;
  }
  return (
    veroyatnostVyhoda(uzel.verh, imya, shans / 2) + veroyatnostVyhoda(uzel.niz, imya, shans / 2)
  );
}

/** Все выходы лабиринта в порядке обхода сверху вниз. */
export function vyhody(uzel: Uzel): string[] {
  return uzel.vid === 'vyhod' ? [uzel.imya] : [...vyhody(uzel.verh), ...vyhody(uzel.niz)];
}

/** Сколько в лабиринте развилок. */
export function razvilki(uzel: Uzel): number {
  return uzel.vid === 'vyhod' ? 0 : 1 + razvilki(uzel.verh) + razvilki(uzel.niz);
}

/** Сколько развилок проходит паук до этого выхода. */
export function glubina(uzel: Uzel, imya: string): number {
  if (uzel.vid === 'vyhod') {
    return uzel.imya === imya ? 0 : -1;
  }
  for (const vetka of [uzel.verh, uzel.niz]) {
    const dalshe = glubina(vetka, imya);
    if (dalshe >= 0) {
      return dalshe + 1;
    }
  }
  return -1;
}

/* ── Чертёж ──────────────────────────────────────────────────────── */

/**
 * Толщина коридора. Одна на всю схему — и это не договорённость, а
 * устройство: коридоры рисуются прямоугольниками ровно этой ширины,
 * поэтому веток разной толщины на чертеже не бывает.
 */
const TOLSHCHINA = 14;
/** Расстояние между соседними выходами по вертикали. */
const SHAG_Y = 64;
/** Расстояние между колонками развилок. */
const SHAG_X = 128;
/** Длина входного коридора слева от первой развилки. */
const VHOD = 70;
/** Поля вокруг чертежа. */
const POLYA = 16;
/** Отступ подписи от конца коридора. */
const OTSTUP = 16;
/** Место справа под буквы выходов. */
const POD_PODPISI = 44;

interface Vyhod {
  imya: string;
  x: number;
  y: number;
}

interface Razmetka {
  koridory: string[];
  vyhody: Vyhod[];
  /** Сколько выходов уже разложено: по нему считается строка. */
  razlozheno: number;
}

/** Горизонтальный коридор от x1 до x2 по средней линии y. */
function gorizont(x1: number, x2: number, y: number): string {
  const x = Math.min(x1, x2);
  const shirina = Math.abs(x2 - x1);
  return `<rect x="${x}" y="${y - TOLSHCHINA / 2}" width="${shirina}" height="${TOLSHCHINA}" class="lab-koridor" />`;
}

/** Вертикальный коридор от y1 до y2 по средней линии x. */
function vertikal(y1: number, y2: number, x: number): string {
  const y = Math.min(y1, y2);
  const vysota = Math.abs(y2 - y1);
  return `<rect x="${x - TOLSHCHINA / 2}" y="${y}" width="${TOLSHCHINA}" height="${vysota}" class="lab-koridor" />`;
}

/** Левый край колонки узлов этой глубины. */
function stolbec(glubina: number): number {
  return POLYA + VHOD + glubina * SHAG_X;
}

/**
 * Раскладка дерева.
 *
 * Выходы идут сверху вниз с одинаковым шагом, развилка встаёт ровно
 * посередине между своими двумя дорогами. Коридоры — прямоугольники
 * одной ширины; на повороте горизонтальный и вертикальный
 * перекрываются, поэтому угол получается прямым и сплошным, без
 * скруглений и стыков.
 *
 * Возвращает среднюю линию узла по вертикали.
 */
function razlozhit(uzel: Uzel, glubina: number, out: Razmetka): number {
  if (uzel.vid === 'vyhod') {
    const y = POLYA + TOLSHCHINA / 2 + out.razlozheno * SHAG_Y;
    out.razlozheno += 1;
    out.vyhody.push({ imya: uzel.imya, x: stolbec(glubina), y });
    return y;
  }

  const verhY = razlozhit(uzel.verh, glubina + 1, out);
  const nizY = razlozhit(uzel.niz, glubina + 1, out);
  const y = (verhY + nizY) / 2;

  const x = stolbec(glubina);
  /* Коридор раздваивается посередине между колонками. */
  const razvilka = x + SHAG_X / 2;
  const deti = stolbec(glubina + 1);

  out.koridory.push(gorizont(x, razvilka, y));
  /* Вертикаль вытянута на полтолщины в обе стороны: иначе на повороте
     остаётся незакрашенный квадратик в пол-коридора — угол выходит со
     ступенькой вместо прямого. */
  out.koridory.push(vertikal(verhY - TOLSHCHINA / 2, nizY + TOLSHCHINA / 2, razvilka));
  out.koridory.push(gorizont(razvilka, deti, verhY));
  out.koridory.push(gorizont(razvilka, deti, nizY));
  return y;
}

/**
 * Чертёж лабиринта готовой разметкой SVG.
 *
 * Рисуется на сборке: в браузер уезжает готовая строка, движка там
 * нет. Подписи — обычные <text> внутри того же SVG, а не слой поверх
 * картинки: они едут вместе с чертежом и не могут от него отъехать.
 *
 * Цвета и шрифт заданы классами, а не значениями: их берёт таблица
 * стилей раздела из токенов проекта — коридор красится в
 * --color-primary, подписи в --color-text. Фон прозрачный, подложки
 * и рамки у чертежа нет.
 */
export function chertezhLabirinta(uzel: Uzel = LABIRINT): string {
  const spisok = vyhody(uzel);
  const razmetka: Razmetka = { koridory: [], vyhody: [], razlozheno: 0 };
  const korenY = razlozhit(uzel, 0, razmetka);

  /* Входной коридор: от левого поля до первой развилки. */
  const vhod = gorizont(POLYA, stolbec(0) + SHAG_X / 2, korenY);

  const podpisi = razmetka.vyhody.map(
    ({ imya, x, y }) =>
      `<text x="${x + OTSTUP}" y="${y}" dominant-baseline="central" class="lab-vyhod">${imya}</text>`,
  );

  const shirina = Math.max(...razmetka.vyhody.map((v) => v.x)) + OTSTUP + POD_PODPISI;
  /* Высота — по краям крайних коридоров, а не по числу шагов: иначе
     под нижним выходом остаётся пустая полоса в полшага. */
  const vysota = 2 * POLYA + TOLSHCHINA + (spisok.length - 1) * SHAG_Y;

  return [
    `<svg viewBox="0 0 ${shirina} ${vysota}" role="img" `,
    `aria-label="Схема лабиринта: вход слева, ${razvilki(uzel)} развилки и выходы ${spisok.join(', ')}">`,
    vhod,
    ...razmetka.koridory,
    `<text x="${POLYA}" y="${korenY - TOLSHCHINA / 2 - 12}" class="lab-vhod">Вход</text>`,
    ...podpisi,
    '</svg>',
  ].join('');
}
