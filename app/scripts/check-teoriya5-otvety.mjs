/**
 * Ответы разобранных задач теории №5 (content/veroyatnost-teoriya5):
 * каждое число пересчитывается здесь из условия точной арифметикой
 * дробей и сверяется с ответом и с выкладками, что стоят в тексте.
 * Поменял условие — пересчитай ответ, иначе проверка упадёт.
 *
 *   node scripts/check-teoriya5-otvety.mjs
 */
import { requireSrc } from './lib/load-ts.mjs';

const { SOVMESTNYE, NEZAVISIMYE, USLOVNAYA } = requireSrc('content/veroyatnost-teoriya5');

/* ── Точные дроби на BigInt ─────────────────────────────────────── */
const gcd = (a, b) => (b === 0n ? (a < 0n ? -a : a) : gcd(b, a % b));
function D(n, d = 1n) {
  if (typeof n === 'string') {
    const [c, f = ''] = n.replace(',', '.').split('.');
    return D(BigInt(c + f), 10n ** BigInt(f.length));
  }
  const g = gcd(BigInt(n), BigInt(d)) || 1n;
  const s = BigInt(d) < 0n ? -1n : 1n;
  return { n: (s * BigInt(n)) / g, d: (s * BigInt(d)) / g };
}
const add = (a, b) => D(a.n * b.d + b.n * a.d, a.d * b.d);
const sub = (a, b) => D(a.n * b.d - b.n * a.d, a.d * b.d);
const mul = (a, b) => D(a.n * b.n, a.d * b.d);
const div = (a, b) => D(a.n * b.d, a.d * b.n);
const eq = (a, b) => a.n === b.n && a.d === b.d;
const show = (a) => `${a.n}/${a.d}`;
const ONE = D(1);

/** Ответ из текста: «0,52» или «$\dfrac{1}{3}$». */
function izOtveta(otvet) {
  const m = /\\dfrac\{(\d+)\}\{(\d+)\}/.exec(otvet);
  return m ? D(BigInt(m[1]), BigInt(m[2])) : D(otvet.trim());
}

const oshibki = [];
function proverit(imya, poluchil, ozhidal) {
  if (!eq(poluchil, ozhidal)) {
    oshibki.push(`${imya}: в тексте ${show(poluchil)}, пересчёт даёт ${show(ozhidal)}`);
  }
}
/** Число в выкладке шага присутствует: «0{,}48» и т. п. */
function vVykladke(imya, zadacha, chislo) {
  const tex = zadacha.shagi.flatMap((s) => s.stroki ?? []).join(' ');
  const zapis = chislo.replace(',', '{,}');
  if (!tex.includes(zapis)) oshibki.push(`${imya}: в выкладках нет промежуточного ${chislo}`);
}

/* Глава 1. */
proverit('кубик: 2 или 5', izOtveta(SOVMESTNYE.nesovm.zadacha.otvet), add(D(1, 6), D(1, 6)));
{
  const z = SOVMESTNYE.sovm.zadacha;
  const sum = sub(add(D('0,3'), D('0,3')), D('0,12'));
  vVykladke('кофе', z, '0,48');
  proverit('кофе', izOtveta(z.otvet), sub(ONE, sum));
}

/* Глава 2. */
proverit('орёл и 6', izOtveta(NEZAVISIMYE.umnozhenie.zadacha.otvet), mul(D(1, 2), D(1, 6)));
{
  const { biatlon, prodavtsy, popytki } = NEZAVISIMYE.zadachi;
  const p = D('0,8');
  const q = sub(ONE, p);
  proverit('биатлон', izOtveta(biatlon.otvet), mul(mul(mul(p, p), p), mul(q, q)));
  vVykladke('биатлон', biatlon, '0,16');
  vVykladke('биатлон', biatlon, '0,0256');
  const zanyat = D('0,4');
  proverit('продавцы', izOtveta(prodavtsy.otvet), sub(ONE, mul(zanyat, zanyat)));
  /* Перебор из «Почему»: свободен ровно один или оба. */
  const svob = sub(ONE, zanyat);
  proverit(
    'продавцы перебором',
    izOtveta(prodavtsy.otvet),
    add(add(mul(svob, zanyat), mul(zanyat, svob)), mul(svob, svob)),
  );
  const promah = sub(ONE, D('0,6'));
  vVykladke('попытки', popytki, '0,064');
  proverit('попытки', izOtveta(popytki.otvet), sub(ONE, mul(mul(promah, promah), promah)));
}
/* «Не путай!»: 1/6 · 1/6 = 1/36. */
if (
  !NEZAVISIMYE.neputay.primer.shagi.some((s) => (s.stroki ?? []).join().includes('\\dfrac{1}{36}'))
)
  oshibki.push('не путай: нет 1/36');

/* Глава 3. */
proverit('кубик: 6 при чётном', izOtveta(USLOVNAYA.formula.zadacha.otvet), div(D(1, 6), D(3, 6)));
{
  const z = USLOVNAYA.polnaya.zadacha;
  const a = mul(D('0,45'), D('0,03'));
  const b = mul(D('0,55'), D('0,01'));
  vVykladke('стёкла', z, '0,0135');
  vVykladke('стёкла', z, '0,0055');
  proverit('стёкла', izOtveta(z.otvet), add(a, b));
}
{
  const z = USLOVNAYA.obratnaya.zadacha;
  const bol = mul(D('0,05'), D('0,95'));
  const zdor = mul(D('0,95'), D('0,05'));
  vVykladke('тест', z, '0,0475');
  proverit('тест', izOtveta(z.otvet), div(bol, add(bol, zdor)));
}
{
  const L = USLOVNAYA.layfhak;
  const N = D(1000);
  const muzh = mul(N, D('0,48'));
  const zhen = sub(N, muzh);
  const pens = mul(N, D('0,126'));
  const zhenPens = mul(zhen, D('0,15'));
  const muzhPens = sub(pens, zhenPens);
  for (const [imya, x] of Object.entries({ muzh, zhen, pens, zhenPens, muzhPens })) {
    if (x.d !== 1n) oshibki.push(`пенсионеры: ${imya} не целое при 1000 (${show(x)})`);
  }
  /* При 100 людях пенсионеров было бы дробное число — так и сказано в шаге 1. */
  if (mul(D(100), D('0,126')).d === 1n)
    oshibki.push('пенсионеры: при 100 тоже целое — шаг 1 неверен');
  proverit('пенсионеры', izOtveta(L.zadacha.otvet), div(muzhPens, muzh));
  vVykladke('пенсионеры', L.zadacha, '480');
  if (!L.proportsiya.reshenie.join(' ').includes(String(zhenPens.n)))
    oshibki.push('пенсионеры: пропорция не даёт 78');
  /* Таблица: числа и суммы по строкам и столбцам. */
  const [m, w, t] = L.tablitsa.stroki.map((s) => s.chisla.map((x) => D(x)));
  const ozhid = [
    [muzhPens, sub(muzh, muzhPens), muzh],
    [zhenPens, sub(zhen, zhenPens), zhen],
    [pens, sub(N, pens), N],
  ];
  [m, w, t].forEach((stroka, r) =>
    stroka.forEach((x, c) => proverit(`таблица [${r}][${c}]`, x, ozhid[r][c])),
  );
}

if (oshibki.length > 0) {
  console.error(`Теория №5: ответы не сходятся:\n  ${oshibki.join('\n  ')}`);
  process.exit(1);
}
console.log('Теория №5: все ответы и промежуточные числа разобранных задач сходятся.');
