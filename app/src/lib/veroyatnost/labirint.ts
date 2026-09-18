/**
 * Лабиринт паука: задача 33 конспекта.
 *
 * Источник истины — рисунок `app/public/images/veroyatnost/labirint-glass.svg`.
 * Его геометрия сверена с оригиналом задачи, и ответ считается по ней, а
 * не записан числом: стены лежат в `STENY` тем же списком, что в
 * генераторе картинки `tools/gen_maze.py`, а вероятности выводятся из
 * них. Сдвинется стена — поедет и ответ, молча разойтись они не могут.
 *
 * Что в лабиринте: вход слева, четыре выхода — A, B, C, D — и три
 * тупика. Тупик здесь не ошибка условия, а законный исход: развернуться
 * паук не может, поэтому, зайдя в тупик, остаётся там навсегда.
 *
 *     Выход A   1/16     Выход C   1/16
 *     Выход B   1/4      Выход D   1/16
 *     тупик     9/16
 *
 * Прежняя версия этого файла описывала лабиринт двоичным деревом с пятью
 * выходами A–E и без тупиков. Дерево было неверным: выхода E на рисунке
 * нет, а развилки не все двойные. Считать по дереву больше нельзя —
 * считаем по стенам.
 *
 * Правило задачи: на каждом разветвлении паук равновероятно выбирает
 * один из путей, по которым ещё не полз.
 */

/** Прямоугольник стены в клетках: [c0, c1, r0, r1] включительно. */
export type Stena = readonly [number, number, number, number];

/** Размер сетки в мелких клетках — как в `tools/gen_maze.py`. */
export const KOLONOK = 54;
export const RYADOV = 44;

/**
 * Стены лабиринта. Список слово в слово повторяет `RECTS` из
 * `tools/gen_maze.py`; совпадение сверяет `pnpm test:veroyatnost`.
 *
 * Менять его нельзя: координаты сверены с оригиналом задачи.
 */
export const STENY: readonly Stena[] = [
  [0, 23, 0, 3],
  [30, 53, 0, 3], // верхняя стена, проём = выход D
  [0, 3, 10, 13],
  [0, 3, 20, 43], // левая стена: проём 4–9 = выход B, 14–19 = вход
  [50, 53, 10, 43], // правая стена: проём 4–9 = выход A
  [0, 43, 40, 43], // нижняя стена, проём 44–49 = выход C
  [20, 23, 4, 13], // вертикаль от верха
  [10, 13, 10, 23], // вертикаль слева внутри
  [30, 51, 10, 13], // длинная горизонталь справа
  [10, 33, 20, 23],
  [40, 51, 20, 23], // второй ряд
  [30, 33, 20, 29], // короткая вертикаль
  [10, 43, 30, 33], // третий ряд
  [40, 43, 30, 41], // вертикаль вниз
];

/* ── Решётка коридоров ───────────────────────────────────────────────
 *
 * Стены нарезаны с шагом 10 клеток: 4 клетки стена, 6 клеток коридор.
 * Значит, весь лабиринт — решётка 5 × 4 перекрёстков, а коридор между
 * соседними перекрёстками либо есть, либо перекрыт стеной. По этой
 * решётке и считается блуждание: возиться с отдельными клетками не
 * нужно, а проверить её глазами по рисунку легко.
 */

const SHAG = 10;
const TOLSHCHINA_STENY = 4;
const SHIRINA_KORIDORA = SHAG - TOLSHCHINA_STENY;

const STOLBTSY: readonly number[] = [4, 14, 24, 34, 44];
const RYADY: readonly number[] = [4, 14, 24, 34];

/** Перекрёсток решётки: номер столбца и ряда коридоров. */
export interface Uzel {
  i: number;
  j: number;
}

/**
 * Куда можно уйти с перекрёстка. Строка, а не объект: направление, с
 * которого паук пришёл, надо уметь просто вычесть из списка.
 *
 *   `u:2:1` — на соседний перекрёсток;
 *   `v:D`   — наружу через проём выхода D;
 *   `vh`    — наружу через вход.
 */
type Napravlenie = string;

const uzelKlyuch = (u: Uzel): Napravlenie => `u:${u.i}:${u.j}`;

/** Имена проёмов в рамке: сторона и номер коридора вдоль неё. */
const IMENA_PROEMOV: Readonly<Record<string, string>> = {
  'left:0': 'B',
  'right:0': 'A',
  'top:2': 'D',
  'bottom:4': 'C',
};
const VHOD_PROEM = 'left:1';

const STENA_KLETKI: ReadonlySet<string> = (() => {
  const kletki = new Set<string>();
  for (const [c0, c1, r0, r1] of STENY) {
    for (let c = c0; c <= c1; c += 1) {
      for (let r = r0; r <= r1; r += 1) {
        kletki.add(`${c}:${r}`);
      }
    }
  }
  return kletki;
})();

/** Свободен ли прямоугольник клеток [c0, c1) × [r0, r1) целиком. */
function svobodno(c0: number, c1: number, r0: number, r1: number): boolean {
  for (let c = c0; c < c1; c += 1) {
    for (let r = r0; r < r1; r += 1) {
      if (c < 0 || c >= KOLONOK || r < 0 || r >= RYADOV || STENA_KLETKI.has(`${c}:${r}`)) {
        return false;
      }
    }
  }
  return true;
}

interface Reshetka {
  /** Перекрёстки решётки. */
  uzly: Uzel[];
  /** С каждого перекрёстка — куда с него можно уйти. */
  napravleniya: Map<Napravlenie, Napravlenie[]>;
  /** Проёмы в рамке: имя проёма → перекрёсток, к которому он ведёт. */
  proemy: Map<string, Uzel>;
}

function sobrat(): Reshetka {
  const uzly: Uzel[] = [];
  const napravleniya = new Map<Napravlenie, Napravlenie[]>();
  const proemy = new Map<string, Uzel>();

  for (let i = 0; i < STOLBTSY.length; i += 1) {
    for (let j = 0; j < RYADY.length; j += 1) {
      uzly.push({ i, j });
      napravleniya.set(uzelKlyuch({ i, j }), []);
    }
  }

  const svyazat = (a: Uzel, b: Uzel): void => {
    napravleniya.get(uzelKlyuch(a))?.push(uzelKlyuch(b));
    napravleniya.get(uzelKlyuch(b))?.push(uzelKlyuch(a));
  };

  const stolbets = (i: number): number => STOLBTSY[i] ?? 0;
  const ryad = (j: number): number => RYADY[j] ?? 0;

  /* Коридор между соседями по горизонтали — это кусок стены между их
     столбцами. Свободен — коридор есть. */
  for (let i = 0; i + 1 < STOLBTSY.length; i += 1) {
    for (let j = 0; j < RYADY.length; j += 1) {
      const most = svobodno(
        stolbets(i) + SHIRINA_KORIDORA,
        stolbets(i + 1),
        ryad(j),
        ryad(j) + SHIRINA_KORIDORA,
      );
      if (most) {
        svyazat({ i, j }, { i: i + 1, j });
      }
    }
  }
  for (let i = 0; i < STOLBTSY.length; i += 1) {
    for (let j = 0; j + 1 < RYADY.length; j += 1) {
      const most = svobodno(
        stolbets(i),
        stolbets(i) + SHIRINA_KORIDORA,
        ryad(j) + SHIRINA_KORIDORA,
        ryad(j + 1),
      );
      if (most) {
        svyazat({ i, j }, { i, j: j + 1 });
      }
    }
  }

  /* Проёмы в рамке: кусок поля между краем сетки и крайним коридором. */
  for (let j = 0; j < RYADY.length; j += 1) {
    if (svobodno(0, stolbets(0), ryad(j), ryad(j) + SHIRINA_KORIDORA)) {
      proemy.set(`left:${j}`, { i: 0, j });
    }
    const posledniy = STOLBTSY.length - 1;
    if (
      svobodno(stolbets(posledniy) + SHIRINA_KORIDORA, KOLONOK, ryad(j), ryad(j) + SHIRINA_KORIDORA)
    ) {
      proemy.set(`right:${j}`, { i: posledniy, j });
    }
  }
  for (let i = 0; i < STOLBTSY.length; i += 1) {
    if (svobodno(stolbets(i), stolbets(i) + SHIRINA_KORIDORA, 0, ryad(0))) {
      proemy.set(`top:${i}`, { i, j: 0 });
    }
    const posledniy = RYADY.length - 1;
    if (
      svobodno(
        stolbets(i),
        stolbets(i) + SHIRINA_KORIDORA,
        ryad(posledniy) + SHIRINA_KORIDORA,
        RYADOV,
      )
    ) {
      proemy.set(`bottom:${i}`, { i, j: posledniy });
    }
  }

  /* Проём выхода — такое же направление с перекрёстка, как коридор:
     дойдя до него, паук на развилке выбирает между «наружу» и
     «дальше по лабиринту». */
  for (const [imya, uzel] of proemy) {
    const vyhod = IMENA_PROEMOV[imya];
    if (vyhod !== undefined) {
      napravleniya.get(uzelKlyuch(uzel))?.push(`v:${vyhod}`);
    }
  }

  proverkaDereva(uzly, napravleniya);
  return { uzly, napravleniya, proemy };
}

/**
 * Коридоры обязаны образовывать дерево: связное и без петель.
 *
 * Петля означала бы, что паук может вернуться на перекрёсток, где уже
 * был, а правило «выбирает путь, по которому ещё не полз» такого случая
 * не описывает — ответ перестал бы быть определён. Обход же по петле не
 * кончился бы вовсе, поэтому проверяем до счёта, а не после: лучше
 * внятная ошибка, чем переполнение стека.
 */
function proverkaDereva(uzly: Uzel[], napravleniya: Map<Napravlenie, Napravlenie[]>): void {
  const koridorov =
    [...napravleniya.values()].reduce(
      (s, spisok) => s + spisok.filter((n) => n.startsWith('u:')).length,
      0,
    ) / 2;
  if (koridorov !== uzly.length - 1) {
    throw new Error(
      `Коридоры лабиринта не дерево: ${koridorov} коридоров при ${uzly.length} перекрёстках`,
    );
  }

  const vidno = new Set<Napravlenie>();
  const ochered: Napravlenie[] = uzly[0] === undefined ? [] : [uzelKlyuch(uzly[0])];
  while (ochered.length > 0) {
    const gde = ochered.pop() as Napravlenie;
    if (vidno.has(gde)) {
      continue;
    }
    vidno.add(gde);
    for (const sosed of napravleniya.get(gde) ?? []) {
      if (sosed.startsWith('u:') && !vidno.has(sosed)) {
        ochered.push(sosed);
      }
    }
  }
  if (vidno.size !== uzly.length) {
    throw new Error(
      `Лабиринт распался на части: от входа достижимы ${vidno.size} перекрёстков из ${uzly.length}`,
    );
  }
}

/** Лабиринт целиком: решётка коридоров, собранная по стенам. */
export const LABIRINT: Reshetka = sobrat();

/** Перекрёсток, в который паук попадает со входа. */
function vhodnoyUzel(): Uzel {
  const uzel = LABIRINT.proemy.get(VHOD_PROEM);
  if (uzel === undefined) {
    throw new Error('В рамке нет проёма для входа');
  }
  return uzel;
}

/** Сколько дорог вперёд у паука, пришедшего на перекрёсток `otkuda`. */
function dorogiVpered(gde: Napravlenie, otkuda: Napravlenie): Napravlenie[] {
  return (LABIRINT.napravleniya.get(gde) ?? []).filter((n) => n !== otkuda);
}

export interface Ishody {
  /** Вероятность выйти через каждый выход. */
  vyhody: Record<string, number>;
  /** Вероятность застрять в тупике. */
  tupik: number;
}

/**
 * Куда приходит паук. Обход в глубину: на каждом перекрёстке доля
 * вероятности делится поровну между дорогами вперёд, в тупике —
 * оседает.
 */
function obhodom(): Ishody {
  const vyhody: Record<string, number> = {};
  let tupik = 0;

  const idti = (gde: Napravlenie, otkuda: Napravlenie, p: number): void => {
    const dalshe = dorogiVpered(gde, otkuda);
    if (dalshe.length === 0) {
      tupik += p;
      return;
    }
    for (const sled of dalshe) {
      const dolya = p / dalshe.length;
      if (sled.startsWith('v:')) {
        const imya = sled.slice(2);
        vyhody[imya] = (vyhody[imya] ?? 0) + dolya;
      } else {
        idti(sled, gde, dolya);
      }
    }
  };

  idti(uzelKlyuch(vhodnoyUzel()), 'vh', 1);
  return { vyhody, tupik };
}

/**
 * То же самое вторым путём — волной по направленным коридорам.
 *
 * Здесь нет рекурсии и нет понятия «ветка»: вероятность лежит на парах
 * «где паук и откуда пришёл» и на каждом шаге вся разом сдвигается
 * вперёд, пока не осядет на выходах и в тупиках. Алгоритм другой,
 * ответ обязан получиться тот же — на этом и держится проверка.
 */
function volnoy(): Ishody {
  const vyhody: Record<string, number> = {};
  let tupik = 0;

  /* Ключ состояния — «перекрёсток, откуда пришли». */
  let volna = new Map<string, number>([[`${uzelKlyuch(vhodnoyUzel())}|vh`, 1]]);

  while (volna.size > 0) {
    const sled = new Map<string, number>();
    for (const [sostoyanie, p] of volna) {
      const [gde = '', otkuda = ''] = sostoyanie.split('|');
      const dorogi = dorogiVpered(gde, otkuda);
      if (dorogi.length === 0) {
        tupik += p;
        continue;
      }
      for (const kuda of dorogi) {
        const dolya = p / dorogi.length;
        if (kuda.startsWith('v:')) {
          const imya = kuda.slice(2);
          vyhody[imya] = (vyhody[imya] ?? 0) + dolya;
        } else {
          const klyuch = `${kuda}|${gde}`;
          sled.set(klyuch, (sled.get(klyuch) ?? 0) + dolya);
        }
      }
    }
    volna = sled;
  }

  return { vyhody, tupik };
}

const ISHODY = obhodom();
const ISHODY_VOLNOY = volnoy();

/** Вероятность прийти к выходу с этим именем. */
export function veroyatnostVyhoda(imya: string): number {
  return ISHODY.vyhody[imya] ?? 0;
}

/** Та же вероятность, посчитанная вторым способом. */
export function veroyatnostVyhodaVolnoy(imya: string): number {
  return ISHODY_VOLNOY.vyhody[imya] ?? 0;
}

/** Вероятность застрять в тупике. */
export function veroyatnostTupika(): number {
  return ISHODY.tupik;
}

/** Все выходы лабиринта по алфавиту. */
export function vyhody(): string[] {
  return Object.values(IMENA_PROEMOV).sort();
}

/** Перекрёстки, с которых нет дороги вперёд ни при каком приходе. */
export function tupiki(): Uzel[] {
  return LABIRINT.uzly.filter((u) => (LABIRINT.napravleniya.get(uzelKlyuch(u)) ?? []).length === 1);
}

/** Перекрёстки, где паук выбирает из нескольких дорог. */
export function razvilki(): Uzel[] {
  return LABIRINT.uzly.filter((u) => (LABIRINT.napravleniya.get(uzelKlyuch(u)) ?? []).length > 2);
}

/**
 * Сколько разветвлений паук проходит по дороге к этому выходу.
 *
 * Дорога единственная: коридоры образуют дерево, петель в нём нет. Путь
 * ищется в глубину, а считаются на нём только те перекрёстки, где дорог
 * вперёд больше одной, — остальные паук проходит не выбирая.
 */
export function razvilokDoVyhoda(imya: string): number {
  const iskat = (gde: Napravlenie, otkuda: Napravlenie): number | null => {
    const dalshe = dorogiVpered(gde, otkuda);
    for (const sled of dalshe) {
      if (sled === `v:${imya}`) {
        return dalshe.length > 1 ? 1 : 0;
      }
      if (!sled.startsWith('v:')) {
        const dalshe2 = iskat(sled, gde);
        if (dalshe2 !== null) {
          return dalshe2 + (dalshe.length > 1 ? 1 : 0);
        }
      }
    }
    return null;
  };
  return iskat(uzelKlyuch(vhodnoyUzel()), 'vh') ?? -1;
}

/* ── Рисунок ─────────────────────────────────────────────────────── */

/** Размеры файла картинки: нужны, чтобы страница не дёргалась при загрузке. */
const RISUNOK_SHIRINA = 908;
const RISUNOK_VYSOTA = 688;

/**
 * Разметка чертежа к задаче.
 *
 * Картинка — готовый файл, а не построение на лету: её собирает
 * `tools/gen_maze.py`, и она же сверена с оригиналом задачи. Рисовать
 * её второй раз здесь значило бы завести второй источник истины.
 *
 * Фон у файла прозрачный, подложки под ним нет. Ширину и высоту тега
 * проставляем явно — иначе при загрузке страница дёргается.
 */
export function chertezhLabirinta(): string {
  const imena = vyhody().join(', ');
  return [
    '<img src="/images/veroyatnost/labirint-glass.svg"',
    ` width="${RISUNOK_SHIRINA}" height="${RISUNOK_VYSOTA}"`,
    ` alt="Лабиринт: вход слева, выходы ${imena}, в лабиринте есть тупики"`,
    ' />',
  ].join('');
}
