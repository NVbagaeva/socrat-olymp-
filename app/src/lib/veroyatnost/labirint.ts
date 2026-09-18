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
 * Рисунок лабиринта, а не схема дерева.
 *
 * Дерево говорит, какие развилки есть и куда ведут; как именно повернуть
 * коридор на бумаге, оно не знает — это работа художника. Поэтому
 * геометрия задана вручную в `RISUNOK`, но **формой повторяет дерево**:
 * у развилки обязаны быть обе ветки, у выхода — ни одной. Несовпадение
 * роняет сборку в `sobrat`, так что нарисовать один лабиринт, а считать
 * ответ по другому нельзя.
 *
 * Коридоры — широкие прямоугольные трубы одной толщины с прямыми
 * поворотами; выходы упираются в край и подписаны снаружи.
 */

/** Толщина коридора. Одна на весь рисунок. */
const TOLSHCHINA = 22;
/** Края лабиринта: за ними только подписи. */
const LEVO = 120;
const PRAVO = 700;
const VERH = 90;
const NIZ = 460;
/** Отступ подписи от края коридора. */
const OTSTUP = 18;

/** Ход коридора: отрезок по горизонтали или по вертикали. */
type Hod =
  | { vid: 'gorizont'; x1: number; x2: number; y: number }
  | { vid: 'vertikal'; y1: number; y2: number; x: number };

const g = (x1: number, x2: number, y: number): Hod => ({ vid: 'gorizont', x1, x2, y });
const v = (y1: number, y2: number, x: number): Hod => ({ vid: 'vertikal', y1, y2, x });

/** С какой стороны от конца коридора ставится подпись выхода. */
type Storona = 'sverhu' | 'snizu' | 'sprava';

/**
 * Геометрия ветки. Повторяет форму дерева: `verh` и `niz` есть ровно
 * у тех веток, которым в дереве отвечает развилка.
 */
interface Vetka {
  /** Ходы от предыдущей развилки до этой. */
  hody: Hod[];
  /** Где кончается коридор выхода и куда смотрит подпись. */
  konec?: { x: number; y: number; storona: Storona };
  verh?: Vetka;
  niz?: Vetka;
}

/**
 * Разводка коридоров. Считана с рисунка задачи: вход слева, первая
 * развилка ведёт вверх и вниз, выходы упираются в верхний, правый и
 * нижний края.
 */
const RISUNOK: Vetka = {
  /* Входной коридор слева и первая развилка: вверх или вниз. */
  hody: [g(LEVO, 200, 290), v(165, 410, 200)],
  verh: {
    /* Вверх и направо — до второй развилки. */
    hody: [g(200, 300, 165)],
    /* Вверх до верхнего края. */
    verh: { hody: [v(VERH, 165, 300)], konec: { x: 300, y: VERH, storona: 'sverhu' } },
    /* Направо, потом вверх, потом опять направо — до правого края. */
    niz: {
      hody: [g(300, 470, 165), v(115, 165, 470), g(470, PRAVO, 115)],
      konec: { x: PRAVO, y: 115, storona: 'sprava' },
    },
  },
  niz: {
    /* Вниз и направо — до третьей развилки. */
    hody: [g(200, 300, 410)],
    /* Вниз до нижнего края. */
    verh: { hody: [v(410, NIZ, 300)], konec: { x: 300, y: NIZ, storona: 'snizu' } },
    niz: {
      /* Направо, ступенькой вверх и опять направо — до четвёртой развилки. */
      hody: [g(300, 380, 410), v(340, 410, 380), g(380, 500, 340)],
      /* Вверх и направо — до правого края. */
      verh: {
        hody: [v(245, 340, 500), g(500, PRAVO, 245)],
        konec: { x: PRAVO, y: 245, storona: 'sprava' },
      },
      /* Направо и вниз — до нижнего края. */
      niz: {
        hody: [g(500, 580, 340), v(340, NIZ, 580)],
        konec: { x: 580, y: NIZ, storona: 'snizu' },
      },
    },
  },
};

interface Pryamougolnik {
  x: number;
  y: number;
  shirina: number;
  vysota: number;
}

/**
 * Ход в прямоугольник. Концы вытянуты на полтолщины: иначе на
 * повороте остаётся незакрашенный квадратик и угол выходит со
 * ступенькой вместо прямого.
 */
function vPryamougolnik(hod: Hod): Pryamougolnik {
  const pol = TOLSHCHINA / 2;
  if (hod.vid === 'gorizont') {
    const x = Math.min(hod.x1, hod.x2) - pol;
    return {
      x,
      y: hod.y - pol,
      shirina: Math.abs(hod.x2 - hod.x1) + TOLSHCHINA,
      vysota: TOLSHCHINA,
    };
  }
  const y = Math.min(hod.y1, hod.y2) - pol;
  return {
    x: hod.x - pol,
    y,
    shirina: TOLSHCHINA,
    vysota: Math.abs(hod.y2 - hod.y1) + TOLSHCHINA,
  };
}

interface Podpis {
  text: string;
  x: number;
  y: number;
  yakor: 'start' | 'middle' | 'end';
}

interface Sborka {
  /** Ход и путь ветки, которой он принадлежит: '', 'в', 'вн' и так далее. */
  hody: { hod: Hod; put: string }[];
  podpisi: Podpis[];
}

/**
 * Обход дерева вместе с разводкой. Форму сверяем на каждом узле: где
 * в дереве развилка, там у разводки обязаны быть обе ветки, а где
 * выход — обязан быть конец коридора.
 */
function sobrat(uzel: Uzel, vetka: Vetka, out: Sborka, put = ''): void {
  vetka.hody.forEach((hod) => out.hody.push({ hod, put }));

  if (uzel.vid === 'vyhod') {
    const konec = vetka.konec;
    if (konec === undefined || vetka.verh !== undefined || vetka.niz !== undefined) {
      throw new Error(`Разводка не сходится с деревом на выходе ${uzel.imya}`);
    }
    const podpis = `Выход ${uzel.imya}`;
    if (konec.storona === 'sprava') {
      out.podpisi.push({ text: podpis, x: konec.x + OTSTUP, y: konec.y + 7, yakor: 'start' });
    } else if (konec.storona === 'sverhu') {
      out.podpisi.push({ text: podpis, x: konec.x, y: konec.y - OTSTUP - 8, yakor: 'middle' });
    } else {
      out.podpisi.push({ text: podpis, x: konec.x, y: konec.y + OTSTUP + 20, yakor: 'middle' });
    }
    return;
  }

  if (vetka.verh === undefined || vetka.niz === undefined || vetka.konec !== undefined) {
    throw new Error('Разводка не сходится с деревом на развилке');
  }
  sobrat(uzel.verh, vetka.verh, out, `${put}в`);
  sobrat(uzel.niz, vetka.niz, out, `${put}н`);
}

/** Площадь пересечения двух прямоугольников. */
function ploshchadPeresecheniya(a: Pryamougolnik, b: Pryamougolnik): number {
  const poX = Math.min(a.x + a.shirina, b.x + b.shirina) - Math.max(a.x, b.x);
  const poY = Math.min(a.y + a.vysota, b.y + b.vysota) - Math.max(a.y, b.y);
  return poX > 0 && poY > 0 ? poX * poY : 0;
}

/**
 * Проверка рисунка: коридоры разных веток не должны пересекаться.
 *
 * Если два коридора наложатся, на картинке появится проход, которого
 * в дереве нет: паук сможет попасть из одной ветки в другую, и
 * нарисованные вероятности перестанут совпадать с посчитанными.
 *
 * Ветка со своим продолжением стыкуется как угодно — это один и тот же
 * путь. Две дороги от одной развилки обязаны сойтись ровно в ней, и
 * общего у них не больше одного квадрата коридора; всё, что шире, —
 * уже общий кусок пути, то есть срез.
 */
export function proverkaRisunka(uzel: Uzel = LABIRINT): string[] {
  const sborka: Sborka = { hody: [], podpisi: [] };
  sobrat(uzel, RISUNOK, sborka);
  const bedy: string[] = [];

  for (let i = 0; i < sborka.hody.length; i += 1) {
    for (let j = i + 1; j < sborka.hody.length; j += 1) {
      const a = sborka.hody[i] as { hod: Hod; put: string };
      const b = sborka.hody[j] as { hod: Hod; put: string };
      /* Одна ветка продолжает другую — стык законный. */
      if (a.put.startsWith(b.put) || b.put.startsWith(a.put)) {
        continue;
      }
      const obshchee = ploshchadPeresecheniya(vPryamougolnik(a.hod), vPryamougolnik(b.hod));
      if (obshchee > TOLSHCHINA * TOLSHCHINA) {
        bedy.push(`коридоры веток «${a.put}» и «${b.put}» имеют общий кусок площадью ${obshchee}`);
      }
    }
  }
  return bedy;
}

/**
 * Чертёж лабиринта готовой разметкой SVG.
 *
 * Рисуется на сборке: в браузер уезжает готовая строка, движка там
 * нет. Подписи — обычные <text> внутри того же SVG, а не слой поверх
 * картинки, и берутся из имён выходов в дереве.
 *
 * Коридоры рисуются дважды: сначала под обводку, потом заливкой
 * поверх. Так тёмный контур обходит лабиринт снаружи, а внутренних
 * швов на стыках труб не видно.
 *
 * Цвета и шрифт заданы классами, а не значениями: их берёт таблица
 * стилей раздела из токенов проекта.
 */
export function chertezhLabirinta(uzel: Uzel = LABIRINT): string {
  const sborka: Sborka = { hody: [], podpisi: [] };
  sobrat(uzel, RISUNOK, sborka);

  const pryamougolniki = sborka.hody.map((h) => vPryamougolnik(h.hod));
  const kak = (klass: string): string =>
    pryamougolniki
      .map(
        (r) =>
          `<rect x="${r.x}" y="${r.y}" width="${r.shirina}" height="${r.vysota}" class="${klass}" />`,
      )
      .join('');

  sborka.podpisi.push({ text: 'Вход', x: LEVO - OTSTUP, y: 297, yakor: 'end' });

  const podpisi = sborka.podpisi
    .map(
      (p) =>
        `<text x="${p.x}" y="${p.y}" text-anchor="${p.yakor}" class="lab-podpis">${p.text}</text>`,
    )
    .join('');

  const imena = vyhody(uzel).join(', ');
  return [
    `<svg viewBox="0 0 860 540" role="img" `,
    `aria-label="Лабиринт: вход слева, ${razvilki(uzel)} развилки, выходы ${imena}">`,
    `<g class="lab-obvodka">${kak('lab-obvodka-hod')}</g>`,
    `<g class="lab-koridory">${kak('lab-koridor')}</g>`,
    podpisi,
    '</svg>',
  ].join('');
}
