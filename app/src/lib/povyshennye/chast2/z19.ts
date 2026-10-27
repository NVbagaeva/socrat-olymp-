/**
 * №19: уравнение с параметром, которое раскладывается на множители
 * (log_b(a² − x²) − c)·(x − a)·(√(x − a) − m) = 0 при x > a, |x| < |a|.
 *
 * Корни: x = ±√(a² − N), N = b^c, и x = a + m². Структура ответа как
 * в образце: [−m²/2; −√N) ∪ {a*}, где a* = −(m⁴ + N)/(2m²) — значение,
 * при котором корень a + m² совпадает с √(a² − N). Нужно m⁴ > 4N.
 */

import { rat, ratTex, type Rat } from '@/lib/zadanie15/core/rational';
import { ratDecTex, korenTex } from './tex';
import type { Chast2Zadacha, Shablon2 } from './types';

export interface P19 {
  m: number;
  /** Основание логарифма. */
  b: number;
  /** Значение логарифма (в зеркальном виде равно m). */
  c: number;
  /**
   * Зеркальный вид (вариант 2): (a − x)^{1,5} и log(x² − a²), ответ —
   * «ровно один корень»: [m²/2; +∞) ∪ {a*}, a* = (m⁴ − N)/(2m²).
   */
  zerk?: boolean;
}

export function chisla19(p: P19) {
  const N = p.b ** p.c;
  const m2 = p.m * p.m;
  const levyy: Rat = rat(-m2, 2);
  const tochka: Rat = rat(-(m2 * m2 + N), 2 * m2);
  return { N, m2, levyy, tochka };
}

/** Коэффициент c/m перед (x − a)^{1,5}: «», «2», «\dfrac{2}{3}». */
function koef(c: number, m: number): string {
  const q = rat(c, m);
  if (q.d === 1n) return q.n === 1n ? '' : `${q.n}`;
  return ratTex(q);
}

/** Числа зеркального вида: граница m²/2 и точка совпадения корней. */
export function chisla19z(p: P19) {
  const N = p.b ** p.m;
  const m2 = p.m * p.m;
  return { N, m2, granica: rat(m2, 2), tochka: rat(m2 * m2 - N, 2 * m2) };
}

/** Зеркальный вид: u = a − x ≥ 0, log_b(x² − a²) = m, ровно один корень. */
function sobratZerk(p: P19): Chast2Zadacha {
  const { N, m2, granica, tochka } = chisla19z(p);
  if (p.c !== p.m || !(Number(tochka.n) / Number(tochka.d) < m2 / 2))
    throw new Error('z19: зеркальный вид требует c = m и a* < m²/2');
  const L = `\\log_{${p.b}}\\left(x^2-a^2\\right)`;
  const u = '(a-x)^{1{,}5}';
  const uslovie =
    `Найдите все значения $a$, при каждом из которых уравнение\n` +
    `$\\displaystyle ${u}+${p.m}x-\\left(x+\\dfrac{1}{${p.m}}${u}\\right)${L}=${p.m}a-a${L}$\n` +
    `имеет ровно один корень.`;
  const grTex = ratDecTex(granica);
  const tochTex = ratTex(tochka);
  const otvet = `\\left[${grTex};\\ +\\infty\\right)\\cup\\left\\{${tochTex}\\right\\}`;
  const m4 = m2 * m2;
  return {
    no: 19,
    shablon: 'z19.logKoren',
    uslovie,
    risunok: null,
    punkty: [
      {
        bukva: null,
        podpis: 'Множество значений $a$',
        pole: {
          vid: 'promezhutki',
          verno: {
            kuski: [
              {
                t: 'interval',
                lo: grTex.replace('{,}', ','),
                loZakr: true,
                hi: 'inf',
                hiZakr: false,
              },
              { t: 'tochka', x: tochTex },
            ],
          },
        },
      },
    ],
    otvet: `$a\\in${otvet}$`,
    reshenie: [
      {
        title: 'Раскладываем на множители',
        lines: [
          `Обозначим $L=${L}$ и $u=a-x$. Перенесём всё влево: $u^{1{,}5}+${p.m}(x-a)+(a-x)L-\\dfrac{1}{${p.m}}u^{1{,}5}L=0$.`,
          `Так как $x-a=-u$, получаем $u^{1{,}5}-${p.m}u-\\dfrac{L}{${p.m}}\\left(u^{1{,}5}-${p.m}u\\right)=0$, то есть`,
          `$\\left(${p.m}-${L}\\right)(a-x)\\left(\\sqrt{a-x}-${p.m}\\right)=0$.`,
        ],
      },
      {
        title: 'Условия',
        lines: [
          `Степень $(a-x)^{1{,}5}$ определена при $x\\le a$, логарифм — при $x^2-a^2>0$, то есть $|x|>|a|$.`,
          `Множитель $a-x=0$ даёт $x=a$, но тогда $x^2-a^2=0$ — это не корень.`,
        ],
      },
      {
        title: 'Корни первого множителя',
        lines: [
          `$${L}=${p.m}$ $\\Leftrightarrow$ $x^2=a^2+${N}$, $x=\\pm\\sqrt{a^2+${N}}$. Условие $|x|>|a|$ выполнено всегда.`,
          `Корень $\\sqrt{a^2+${N}}>|a|\\ge a$ не подходит ($x\\le a$ нарушено), корень $-\\sqrt{a^2+${N}}<-|a|\\le a$ подходит при любом $a$.`,
        ],
      },
      {
        title: 'Корень второго множителя',
        lines: [
          `$\\sqrt{a-x}=${p.m}$ $\\Leftrightarrow$ $x=a-${m2}$. Условие $x\\le a$ выполнено, условие $|x|>|a|$: $(a-${m2})^2>a^2$, $${2 * m2}a<${m4}$, $a<${grTex}$.`,
        ],
      },
      {
        title: 'Совпадение корней',
        lines: [
          `Корень $a-${m2}$ совпадает с $-\\sqrt{a^2+${N}}$, когда $a-${m2}<0$ и $(a-${m2})^2=a^2+${N}$: $${2 * m2}a=${m4 - N}$, $a=${tochTex}$ — это меньше $${grTex}$.`,
        ],
      },
      {
        title: 'Считаем корни',
        lines: [
          `При $a\\ge${grTex}$ — один корень $-\\sqrt{a^2+${N}}$;`,
          `при $a<${grTex}$ — два корня, кроме $a=${tochTex}$, когда они совпадают.`,
          `Ровно один корень: $a\\in${otvet}$.`,
        ],
      },
    ],
    razbor: [
      {
        slovo: 'Переносим всё влево и группируем',
        formula: `\\left(${p.m}-${L}\\right)(a-x)\\left(\\sqrt{a-x}-${p.m}\\right)=0`,
      },
      { slovo: 'Условия: $x\\le a$ и $x^2-a^2>0$', formula: '|x|>|a|,\\ x\\le a' },
      {
        slovo: 'Первый множитель: подходит только отрицательный корень',
        formula: `x=-\\sqrt{a^2+${N}}`,
      },
      { slovo: 'Второй множитель', formula: `x=a-${m2},\\ a<${grTex}` },
      { slovo: 'Корни совпадают', formula: `a=${tochTex}` },
      { slovo: 'Ровно один корень', formula: otvet },
    ],
    utochnenie: {
      u: `исключением точки $${grTex}$ и/или точки $${tochTex}$`,
      u2: `промежуток $\\left[${grTex};\\ +\\infty\\right)$ множества значений $a$, возможно, с включением или исключением граничной точки`,
      u3: `исследованию уравнения $\\left(${L}-${p.m}\\right)\\left(\\sqrt{a-x}-${p.m}\\right)=0$ при условиях $x<a$, $|x|>|a|$`,
    },
    kontrol: {
      zerk: true,
      granica: m2 / 2,
      tochka: Number(tochka.n) / Number(tochka.d),
      N,
    },
  };
}

function sobrat(p: P19): Chast2Zadacha {
  if (p.zerk === true) return sobratZerk(p);
  const { N, m2, levyy, tochka } = chisla19(p);
  if (!(m2 * m2 > 4 * N) || p.c < 2) throw new Error('z19: не та структура ответа');
  const L = `\\log_{${p.b}}\\left(a^2-x^2\\right)`;
  const u = '(x-a)^{1{,}5}';
  const k = koef(p.c, p.m);
  const cx = `${p.c}x`;
  const uslovie =
    `Найдите все значения $a$, при каждом из которых уравнение\n` +
    `$\\displaystyle \\left(a+\\dfrac{1}{${p.m}}${u}\\right)${L}+${cx}-${k}${u}=${p.c}a+x${L}$\n` +
    `имеет ровно два корня.`;
  const levTex = ratDecTex(levyy);
  const kor = korenTex(rat(N));
  const tochTex = ratTex(tochka);
  const otvet = `\\left[${levTex};\\ -${kor}\\right)\\cup\\left\\{${tochTex}\\right\\}`;
  const m4 = m2 * m2;

  return {
    no: 19,
    shablon: 'z19.logKoren',
    uslovie,
    risunok: null,
    punkty: [
      {
        bukva: null,
        podpis: 'Множество значений $a$',
        pole: {
          vid: 'promezhutki',
          verno: {
            kuski: [
              {
                t: 'interval',
                lo: levTex.replace('{,}', ','),
                loZakr: true,
                hi: `-${kor}`,
                hiZakr: false,
              },
              { t: 'tochka', x: tochTex },
            ],
          },
        },
      },
    ],
    otvet: `$a\\in${otvet}$`,
    reshenie: [
      {
        title: 'Раскладываем на множители',
        lines: [
          `Обозначим $L=${L}$ и $u=x-a$. Перенесём всё влево: $(a-x)L+\\dfrac{1}{${p.m}}u^{1{,}5}L+${p.c}(x-a)-${k === '' ? '' : `${k}\\,`}u^{1{,}5}=0$.`,
          `Так как $a-x=-u$, получаем $L\\left(\\dfrac{u^{1{,}5}}{${p.m}}-u\\right)-${p.c}\\left(\\dfrac{u^{1{,}5}}{${p.m}}-u\\right)=0$, то есть`,
          `$\\left(${L}-${p.c}\\right)(x-a)\\left(\\sqrt{x-a}-${p.m}\\right)=0$.`,
        ],
      },
      {
        title: 'Условия',
        lines: [
          `Степень $(x-a)^{1{,}5}$ определена при $x\\ge a$, логарифм — при $a^2-x^2>0$, то есть $|x|<|a|$.`,
          `Множитель $x-a=0$ даёт $x=a$, но тогда $a^2-x^2=0$ — это не корень. Значит, $x>a$ и $|x|<|a|$, откуда $a<0$ и $a<x<-a$.`,
        ],
      },
      {
        title: 'Корни первого множителя',
        lines: [
          `$${L}=${p.c}$ $\\Leftrightarrow$ $a^2-x^2=${N}$, $x=\\pm\\sqrt{a^2-${N}}$. Корни есть при $a^2\\ge${N}$, $a\\le-${kor}$, и оба лежат в $(a;-a)$, так как $\\sqrt{a^2-${N}}<|a|$.`,
          `При $a<-${kor}$ это два разных корня, при $a=-${kor}$ — один корень $x=0$.`,
        ],
      },
      {
        title: 'Корень второго множителя',
        lines: [
          `$\\sqrt{x-a}=${p.m}$ $\\Leftrightarrow$ $x=a+${m2}$. Условие $x>a$ выполнено, условие $x<-a$ даёт $a+${m2}<-a$, то есть $a<${levTex}$.`,
        ],
      },
      {
        title: 'Совпадение корней',
        lines: [
          `Корни $\\pm\\sqrt{a^2-${N}}$ различны при $a<-${kor}$. Корень $a+${m2}$ совпадает с одним из них, когда $(a+${m2})^2=a^2-${N}$: $${2 * m2}a=-${m4 + N}$, $a=${tochTex}$.`,
          `При этом $a+${m2}=${ratTex(rat(m4 - N, 2 * m2))}>0$, то есть совпадает он с корнем $\\sqrt{a^2-${N}}$, а $${tochTex}<${levTex}$ — корень $a+${m2}$ при этом $a$ существует.`,
        ],
      },
      {
        title: 'Считаем корни',
        lines: [
          `Так как $${m2 * m2}>4\\cdot${N}$, имеем $${levTex}<-${kor}$. Тогда:`,
          `при $a<${tochTex}$ и при $${tochTex}<a<${levTex}$ — три корня;`,
          `при $a=${tochTex}$ — два корня;`,
          `при $${levTex}\\le a<-${kor}$ — два корня (корень $a+${m2}$ не подходит);`,
          `при $a=-${kor}$ — один корень; при $a>-${kor}$ корней нет.`,
        ],
      },
    ],
    razbor: [
      {
        slovo: 'Переносим всё влево и группируем',
        formula: `\\left(${L}-${p.c}\\right)(x-a)\\left(\\sqrt{x-a}-${p.m}\\right)=0`,
      },
      { slovo: 'Условия: $x>a$ и $a^2-x^2>0$', formula: 'a<0,\\ a<x<-a' },
      { slovo: 'Первый множитель', formula: `x=\\pm\\sqrt{a^2-${N}},\\ a<-${kor}` },
      { slovo: 'Второй множитель', formula: `x=a+${m2},\\ a<${levTex}` },
      { slovo: 'Корни совпадают', formula: `a=${tochTex}` },
      { slovo: 'Ровно два корня', formula: otvet },
    ],
    utochnenie: {
      u: `включением точки $-${kor}$ и/или исключением точки $${levTex}$`,
      u2: `промежуток $\\left[${levTex};\\ -${kor}\\right)$ множества значений $a$, возможно, с включением или исключением одной или двух граничных точек`,
      u3: `исследованию уравнения $\\left(${L}-${p.c}\\right)\\left(\\sqrt{x-a}-${p.m}\\right)=0$ при условиях $x>a$, $x<-a$, $a<0$`,
    },
    kontrol: {
      levyy: Number(levyy.n) / Number(levyy.d),
      pravyy: -Math.sqrt(N),
      tochka: Number(tochka.n) / Number(tochka.d),
    },
  };
}

export const Z19_LOG_KOREN: Shablon2<P19> = {
  no: 19,
  prototip: 'Параметр: произведение «логарифм − число» на «корень − число», ровно два корня',
  sobrat,
};
