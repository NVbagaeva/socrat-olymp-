/**
 * Лабиринт паука: чертёж к задаче 33 конспекта.
 *
 * ВАЖНО. В конспекте лабиринт нарисован картинкой, а картинку из PDF
 * прочитать нельзя — там нет ни текста, ни координат. Поэтому схема
 * ниже восстановлена, а не перенесена: её надо сверить с оригиналом.
 * Если лабиринт у автора другой, правится только дерево `LABIRINT` —
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
 * Восстановленная схема: три развилки, пять выходов.
 * Лабиринт намеренно несимметричный — иначе задача сводится к
 * «выходов четыре, значит каждый по четверти», и дерево исходов
 * рисовать незачем.
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

const SHAG_X = 92;
const SHAG_Y = 38;
const POLYA = 18;
/** Длина входного хода слева от первой развилки. */
const VHOD = 40;

interface Tochka {
  x: number;
  y: number;
}

interface Razmetka {
  hody: string[];
  vyhody: { imya: string; tochka: Tochka }[];
}

/**
 * Раскладка: колонку задаёт глубина, строку — полоса, отведённая
 * ветке. Ходы рисуются уголком «вбок, потом вверх или вниз»: так
 * видно, что на развилке путей ровно два и назад пути нет.
 */
function razlozhit(uzel: Uzel, x: number, sverhu: number, snizu: number, out: Razmetka): Tochka {
  if (uzel.vid === 'vyhod') {
    const tochka = { x, y: (sverhu + snizu) / 2 };
    out.vyhody.push({ imya: uzel.imya, tochka });
    return tochka;
  }
  const seredina = (sverhu + snizu) / 2;
  const verh = razlozhit(uzel.verh, x + SHAG_X, sverhu, seredina, out);
  const niz = razlozhit(uzel.niz, x + SHAG_X, seredina, snizu, out);
  const uzelY = (verh.y + niz.y) / 2;
  for (const tochka of [verh, niz]) {
    const ugol = x + SHAG_X / 2;
    out.hody.push(
      `<path d="M ${x} ${uzelY} H ${ugol} V ${tochka.y} H ${tochka.x}" class="lab-hod" />`,
    );
  }
  out.hody.push(`<circle cx="${x}" cy="${uzelY}" r="4" class="lab-uzel" />`);
  return { x, y: uzelY };
}

/**
 * Чертёж лабиринта готовой разметкой SVG.
 *
 * Рисуется на сборке: в браузер уезжает готовая строка, движка там
 * нет. Цвета заданы классами, а не значениями, — их задаёт таблица
 * стилей раздела, как и у остальных чертежей проекта.
 */
export function chertezhLabirinta(uzel: Uzel = LABIRINT): string {
  const spisok = vyhody(uzel);
  const vysota = spisok.length * SHAG_Y;
  const glubinaMax = Math.max(...spisok.map((imya) => glubina(uzel, imya)));
  const shirina = VHOD + glubinaMax * SHAG_X + 40;

  const razmetka: Razmetka = { hody: [], vyhody: [] };
  const koren = razlozhit(uzel, POLYA + VHOD, POLYA, POLYA + vysota, razmetka);

  const podpisi = razmetka.vyhody.map(
    ({ imya, tochka }) =>
      `<text x="${tochka.x + 12}" y="${tochka.y + 5}" class="lab-vyhod">${imya}</text>`,
  );

  return [
    `<svg viewBox="0 0 ${shirina + POLYA * 2} ${vysota + POLYA * 2}" role="img" `,
    `aria-label="Схема лабиринта: вход слева, три развилки и выходы ${spisok.join(', ')}">`,
    `<path d="M ${POLYA} ${koren.y} H ${koren.x}" class="lab-hod" />`,
    `<text x="${POLYA}" y="${koren.y - 12}" class="lab-vhod">Вход</text>`,
    ...razmetka.hody,
    ...podpisi,
    '</svg>',
  ].join('');
}
