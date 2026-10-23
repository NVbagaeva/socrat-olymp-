/* scripts/check-opornye-5.mjs — опорные задачи задания №5: третий,
   независимый пересчёт ответа точными дробями и сверка ответа везде,
   где его видит ученик.

   check-veroyatnost.mjs уже сверяет два пути в числах с плавающей
   точкой (otvet и proverka). Здесь ответ каждой задачи заново выведен
   из условия и посчитан дробями без округлений (класс Fraction на
   BigInt) — так ошибка в обоих путях сразу не проскочит.

   Что проверяется:
     • в каждом блоке ровно 10 задач, блоки идут по порядку методов;
     • у каждой задачи есть точный ответ в таблице ниже, и он строго
       между 0 и 1;
     • ответ — конечная десятичная дробь, а если нет — в условии прямо
       сказано «Ответ округлите до …» и задача округляет до стольких же
       знаков;
     • один и тот же ответ в данных задачи (prepOtvet), в последнем шаге
       решения (значение и формула), в автопроверке карточки (отпечаток
       ответа принимает «0,4» и «0.4»).

   Запуск: pnpm test:opornye-5. */

import { requireSrc } from './lib/load-ts.mjs';

/* ── Точные дроби ──────────────────────────────────────────────── */

function gcd(a, b) {
  let x = a < 0n ? -a : a;
  let y = b < 0n ? -b : b;
  while (y !== 0n) [x, y] = [y, x % y];
  return x;
}

class Fraction {
  constructor(n, d = 1n) {
    if (d === 0n) throw new Error('деление на ноль');
    const s = d < 0n ? -1n : 1n;
    const g = gcd(n, d) || 1n;
    this.n = (s * n) / g;
    this.d = (s * d) / g;
  }
  static of(x, d) {
    if (d !== undefined) return new Fraction(BigInt(x), BigInt(d));
    if (typeof x === 'number' && Number.isInteger(x)) return new Fraction(BigInt(x));
    /* Десятичная запись строкой: '0.25' → 25/100. */
    const [cel, drob = ''] = String(x).split('.');
    return new Fraction(BigInt(cel + drob), 10n ** BigInt(drob.length));
  }
  add(o) {
    return new Fraction(this.n * o.d + o.n * this.d, this.d * o.d);
  }
  sub(o) {
    return new Fraction(this.n * o.d - o.n * this.d, this.d * o.d);
  }
  mul(o) {
    return new Fraction(this.n * o.n, this.d * o.d);
  }
  div(o) {
    return new Fraction(this.n * o.d, this.d * o.n);
  }
  pow(k) {
    let r = Fraction.of(1);
    for (let i = 0; i < k; i += 1) r = r.mul(this);
    return r;
  }
  lt(o) {
    return this.n * o.d < o.n * this.d;
  }
  toNumber() {
    return Number(this.n) / Number(this.d);
  }
  toString() {
    return `${this.n}/${this.d}`;
  }
  /** Конечная ли десятичная дробь: в знаменателе только двойки и пятёрки. */
  konechnaya() {
    let d = this.d;
    while (d % 2n === 0n) d /= 2n;
    while (d % 5n === 0n) d /= 5n;
    return d === 1n;
  }
  /** Десятичная запись с запятой, точная или округлённая до k знаков. */
  decimal(k) {
    let znakov = k;
    if (znakov === undefined) {
      znakov = 0;
      while ((this.n * 10n ** BigInt(znakov)) % this.d !== 0n) znakov += 1;
    }
    const m = 10n ** BigInt(znakov);
    const q = (this.n * m * 2n + this.d) / (this.d * 2n); /* округление половины вверх */
    const cel = q / m;
    const drob = (q % m).toString().padStart(znakov, '0').replace(/0+$/, '');
    return drob === '' ? `${cel}` : `${cel},${drob}`;
  }
}

const F = (x, d) => Fraction.of(x, d);
const ONE = F(1);
const sum = (...xs) => xs.reduce((a, b) => a.add(b), F(0));
const prod = (...xs) => xs.reduce((a, b) => a.mul(b), ONE);
const ne = (p) => ONE.sub(p);

/* ── Ответы, выведенные из условий заново ───────────────────────
   Строка — задача: что спрашивают и как это считается. Числа взяты
   из условия, а не из кода задачи. */

const { razvilokDoVyhoda } = requireSrc('lib/veroyatnost/labirint');

const TOCHNO = {
  /* Складываем и вычитаем вероятности (методы 1–3) */
  'k5-19': sum(F('0.51'), F('0.23')), // курица или рыба — несовместные
  'k5-20': F('0.87').sub(F('0.63')), // больше года, но меньше двух — вложенные
  'k5-21': ne(F('0.81')), // 36,8 или выше — противоположное
  'k5-22': F('0.9').sub(F('0.7')),
  'k5-23': F('0.82').sub(F('0.51')),
  'k5-24': ONE.sub(F('0.17')).sub(F('0.08')), // от 3 до 4 кг
  'k5-sp-1': ne(F('0.04')),
  'k5-sp-2': sum(F('0.15'), F('0.3'), F('0.25')),
  'k5-sp-3': F('0.8').sub(F('0.35')),
  'k5-sp-4': ONE.sub(F('0.3')).sub(F('0.15')),
  /* Совместные события (метод 4) */
  'k5-25': F('0.92').add(F('0.83')).sub(ONE),
  'k5-26': F('0.97').add(F('0.92')).sub(ONE),
  'k5-62': ne(F('0.3').add(F('0.3')).sub(F('0.12'))),
  'k5-sv-1': F('0.3').add(F('0.4')).sub(F('0.1')),
  'k5-sv-2': F('0.6').add(F('0.5')).sub(F('0.35')),
  'k5-sv-3': F('0.7').add(F('0.5')).sub(F('0.8')),
  'k5-sv-4': F('0.45').sub(F('0.2')),
  'k5-sv-5': ne(F('0.25').add(F('0.25')).sub(F('0.1'))),
  'k5-sv-6': ne(F('0.4').add(F('0.3')).sub(F('0.15'))),
  'k5-sv-7': F('0.95').add(F('0.9')).sub(ONE),
  /* Произведение двух событий (метод 6) */
  'k5-27': F(1, 10).pow(3),
  'k5-28': prod(F('0.6'), F('0.4')),
  'k5-29': ne(F('0.9')).pow(3),
  'k5-30': F('0.7').pow(3),
  'k5-31': prod(ne(F('0.2')), F('0.2').pow(3)),
  'k5-32': prod(ne(F('0.7')), ne(F('0.75')), ne(F('0.8'))),
  'k5-33': F(1, 2).pow(razvilokDoVyhoda('D')), // на каждой развилке одна дорога из двух
  'k5-34': prod(F('0.56'), F('0.3')),
  'k5-35': F(1, 3 * 10 * 9), // кодов, где ровно две цифры совпадают, — 270
  'k5-36': prod(ne(F('0.4')), ne(F('0.7'))),
  /* «Хотя бы» (метод 7) */
  'k5-37': ne(prod(ne(F('0.8')), ne(F('0.25')))),
  'k5-41': ne(F(2, 10).pow(2)),
  'k5-42': ne(F('0.1').pow(2)),
  'k5-43': ne(F('0.3').pow(2)),
  'k5-hb-1': ne(ne(F('0.9')).pow(3)),
  'k5-hb-2': ne(ne(F('0.2')).pow(3)),
  'k5-hb-3': ne(prod(ne(F('0.95')), ne(F('0.9')))),
  'k5-hb-4': ne(prod(ne(F('0.5')), ne(F('0.6')), ne(F('0.8')))),
  'k5-hb-5': ne(F('0.9').pow(3)),
  'k5-hb-6': F('0.9')
    .pow(3)
    .add(F(3).mul(F('0.9').pow(2)).mul(F('0.1'))),
  /* Выбор без возвращения (метод 8): упорядоченные пары без возвращения */
  'k5-38': F(2 * 3 * 3, 10 * 9),
  'k5-39': F(2 * 10 * 9, 25 * 24),
  'k5-40': F(2 * 7 * 3, 15 * 14),
  'k5-bv-1': F(2 * 2 * 3, 5 * 4),
  'k5-bv-2': F(2 * 6 * 10, 16 * 15),
  'k5-bv-3': F(2 * 3 * 1, 6 * 5),
  'k5-bv-4': F(2 * 6 * 5, 16 * 15),
  'k5-bv-5': F(2 * 7 * 3, 21 * 20),
  'k5-bv-6': F(2 * 1, 5 * 4),
  'k5-bv-7': F(2 * 1 + 3 * 2, 5 * 4),
  /* Дерево, формула полной вероятности (метод 9) */
  'k5-44': sum(prod(F('0.6'), F('0.03')), prod(F('0.4'), F('0.01'))),
  'k5-45': sum(prod(F('0.25'), F('0.7')), prod(F('0.75'), ne(F('0.8')))),
  'k5-46': sum(prod(F('0.45'), F('0.2')), prod(ne(F('0.45')), F('0.04'))),
  'k5-47': F('0.3')
    .sub(F('0.15'))
    .div(F('0.3').sub(F('0.05'))), // 0,05x + 0,3(1 − x) = 0,15
  'k5-48': sum(F('0.4').pow(2), prod(F(2), F('0.4'), ne(F('0.4').add(F('0.4'))))), // ВВ, ВН, НВ
  'k5-49': sum(prod(F(3), F('0.2'), F('0.8').pow(2)), F('0.2').pow(3)), // нечётное число смен из трёх
  'k5-50': sum(prod(F('0.05'), F('0.9')), prod(ne(F('0.05')), F('0.01'))),
  'k5-dr-1': sum(prod(F('0.6'), F('0.1')), prod(F('0.4'), F('0.05'))),
  'k5-dr-2': sum(prod(F('0.8'), F('0.1')), prod(F('0.2'), F('0.25'))),
  'k5-dr-3': sum(prod(F('0.5'), F('0.01')), prod(F('0.3'), F('0.02')), prod(F('0.2'), F('0.05'))),
  /* Разбор случаев и подсчёт вариантов */
  'k5-55': F(2 * 6, 20), // одна пятирублёвая из двух и две десятирублёвые из четырёх, C(6,3) = 20
  'k5-56': prod(F(1, 6), ne(F('0.7')), ne(F('0.4'))),
  'k5-57': F('0.092').div(F('0.73')),
  'k5-58': F(10 * 9 * 8 * 7, 10 ** 4),
  'k5-59': F(30, 84), // за семь лет с разным днём недели 1 января — 30 месяцев из 84
  'k5-60': sum(prod(F('0.2'), F('0.8')), prod(F('0.2'), F('0.2'), F('0.8'))),
  'k5-61': F('0.6')
    .pow(3)
    .add(prod(F('0.6'), F('0.6'), F('0.9')))
    .sub(prod(F('0.6').pow(3), F('0.9'))),
  'k5-sl-1': F(10, 25),
  'k5-sl-2': F(2 * 3, 4 * 3),
  'k5-sl-3': prod(ne(F('0.7')), F('0.7')),
};

/* ── Проверка ──────────────────────────────────────────────────── */

const { PODGOTOVKA_5, prepOtvet } = requireSrc('lib/veroyatnost/index');
const { METODY_5 } = requireSrc('lib/veroyatnost/metody5');
const { prep5Pool } = requireSrc('lib/veroyatnost/pool');
const { answerMatches, klyuchZadachi } = requireSrc('lib/veroyatnost/secret');

const oshibki = [];
const pool = new Map(
  prep5Pool()
    .flatMap((blok) => blok.zadachi)
    .map((z) => [z.id, z]),
);
const OKRUGLI = { 2: /округлите до сотых/i, 3: /округлите до тысячных/i };

/* Блоки: по десять задач, порядок — порядок методов. Блок без метода
   собирает несколько методов: первый — методы 1–3, последний —
   задачи методов без своего блока. */
const nomerMetoda = (blok, i) =>
  blok.metod === undefined ? (i === 0 ? 0 : 99) : METODY_5.find((m) => m.id === blok.metod)?.nomer;
PODGOTOVKA_5.forEach((blok, i) => {
  if (blok.zadachi.length !== 10)
    oshibki.push(`блок ${blok.id}: задач ${blok.zadachi.length}, а не 10`);
  if (blok.metod !== undefined && nomerMetoda(blok, i) === undefined) {
    oshibki.push(`блок ${blok.id}: нет метода ${blok.metod} в metody5.ts`);
  }
  if (i > 0 && nomerMetoda(blok, i) <= nomerMetoda(PODGOTOVKA_5[i - 1], i - 1)) {
    oshibki.push(`блок ${blok.id} стоит не по порядку методов`);
  }
});

const stroki = [];
for (const blok of PODGOTOVKA_5) {
  for (const zadacha of blok.zadachi) {
    const id = zadacha.id;
    const tochno = TOCHNO[id];
    const oshibka = (chto) => oshibki.push(`${id}: ${chto}`);
    if (tochno === undefined) {
      oshibka('нет точного ответа в таблице TOCHNO');
      continue;
    }
    if (!(F(0).lt(tochno) && tochno.lt(ONE))) oshibka(`ответ ${tochno} не в (0; 1)`);

    /* Конечная дробь или явное «округлите» в условии. */
    const znakov = zadacha.okruglenie;
    if (znakov === undefined) {
      if (!tochno.konechnaya())
        oshibka(`ответ ${tochno} — бесконечная дробь, а округления в условии нет`);
    } else if (!OKRUGLI[znakov]?.test(zadacha.uslovie)) {
      oshibka(`округление до ${znakov} знаков, а в условии этого не сказано`);
    } else if (tochno.konechnaya() && tochno.decimal() === tochno.decimal(znakov)) {
      oshibka(`округление до ${znakov} знаков не нужно: ответ и так ${tochno.decimal()}`);
    }
    const zapis = znakov === undefined ? tochno.decimal() : tochno.decimal(znakov);
    const chislo = Number(zapis.replace(',', '.'));

    /* Данные задачи: ответ, который сверяет сайт. */
    if (Math.abs(prepOtvet(zadacha) - chislo) > 1e-9)
      oshibka(`в данных ${prepOtvet(zadacha)}, точно ${zapis}`);

    /* Решение: значение и формула последнего шага. */
    const posledniy = zadacha.shagi.at(-1);
    if (posledniy?.value === undefined || Math.abs(posledniy.value - chislo) > 1e-9) {
      oshibka(`последний шаг решения ${posledniy?.value}, точно ${zapis}`);
    }
    const tex = zapis.replace(',', '{,}');
    const formula = (posledniy?.formula ?? '').replace(/\s+/g, ' ');
    if (
      !new RegExp(`(=|\\\\approx) ?(\\\\mathbf\\{)?${tex.replace(/[{}]/g, '\\$&')}\\}?$`).test(
        formula,
      )
    ) {
      oshibka(`формула последнего шага не кончается ответом ${tex}: «${formula.slice(-60)}»`);
    }

    /* Автопроверка карточки: отпечаток ответа в пуле. */
    const vPule = pool.get(id);
    if (vPule === undefined) oshibka('задачи нет в пуле опорных задач');
    else {
      for (const vvod of [zapis, zapis.replace(',', '.')]) {
        if (!answerMatches(vvod, vPule.seal, klyuchZadachi(id)))
          oshibka(`автопроверка не принимает «${vvod}»`);
      }
      if (answerMatches('0,123456', vPule.seal, klyuchZadachi(id)))
        oshibka('автопроверка принимает чужой ответ');
    }
    stroki.push(`${blok.id.padEnd(18)} ${id.padEnd(8)} ${String(tochno).padEnd(10)} ${zapis}`);
  }
}

for (const id of Object.keys(TOCHNO)) {
  if (!PODGOTOVKA_5.some((blok) => blok.zadachi.some((z) => z.id === id))) {
    oshibki.push(`${id}: есть в таблице TOCHNO, но нет в блоках`);
  }
}

console.log(`Опорные задачи №5: блоков ${PODGOTOVKA_5.length}, задач ${stroki.length}`);
for (const blok of PODGOTOVKA_5) console.log(`  ${blok.nazvanie} — ${blok.zadachi.length}`);
if (process.argv.includes('--list')) stroki.forEach((s) => console.log(`  ${s}`));
if (oshibki.length > 0) {
  console.error(`\nРасхождения — ${oshibki.length}:`);
  oshibki.forEach((o) => console.error(`  ${o}`));
  process.exit(1);
}
console.log('Точные ответы, данные задач, решения и автопроверка совпадают.');
