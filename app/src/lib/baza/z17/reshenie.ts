/**
 * База №17: решение уравнения по шагам — из разобранной записи.
 *
 * Класс уравнения определяется по дереву: есть логарифм —
 * логарифмическое, x в показателе — показательное, корень —
 * иррациональное, иначе многочлен: второй степени — квадратное,
 * первой (в том числе после сокращения x²) — линейное. Каждый класс
 * решается так, как решают на базовом уровне: перенос и приведение
 * подобных, дискриминант или вынесение множителя, возведение в
 * квадрат с проверкой, одно основание и равенство показателей,
 * определение логарифма и проверка ОДЗ. Все числа — точные дроби.
 */

import type { Etap, HintStep, Resheno } from '../types';
import {
  abs,
  del,
  minus,
  NOL,
  nol,
  ODIN,
  plus,
  prot,
  q,
  ravny,
  sravnit,
  step,
  texQ,
  texQs,
  tseloe,
  umn,
  zapisQ,
  znak,
  type Q,
} from './drobi';
import {
  estUzel,
  estX,
  koef,
  konstanta,
  mnMinus,
  mnogochlen,
  mnPlus,
  mnUmn,
  type Mn,
  type Osnovanie,
  type Uravnenie,
  type Uzel,
} from './razbor';
import type { Vopros } from './proverka';

/* ── Подсказки ───────────────────────────────────────────────── */

/**
 * Подсказка-вопрос: верный вариант и отвлекающие (как в №5). Повторы
 * убираются, место верного ответа зависит от sdvig.
 */
function vopros(
  question: string,
  verno: string,
  drugie: string[],
  sdvig: number,
  comment?: string,
): HintStep {
  const prochie = [...new Set(drugie)].filter((d) => d !== verno).slice(0, 2);
  const mesto = prochie.length === 0 ? 0 : sdvig % (prochie.length + 1);
  const options = [...prochie.slice(0, mesto), verno, ...prochie.slice(mesto)];
  return { question, options, correct: mesto, ...(comment === undefined ? {} : { comment }) };
}

/** Подсказка годится, только если есть хотя бы один отвлекающий вариант. */
const godna = (h: HintStep): boolean => h.options.length >= 2;

function hesh(s: string): number {
  let h = 0;
  for (const ch of s) h = (h * 31 + (ch.codePointAt(0) ?? 0)) % 1000003;
  return h;
}

/* ── Одночлены и их запись ───────────────────────────────────── */

/** Слагаемое c·x^d (d = 0, 1, 2). */
interface Chlen {
  c: Q;
  d: number;
}

/** Коэффициент при x: целый — как есть, дробный — обыкновенной дробью. */
function texKoef(a: Q): string {
  if (tseloe(a)) return a.n.toString();
  return `\\frac{${a.n.toString()}}{${a.d.toString()}}`;
}

const STEPEN_X = ['', 'x', 'x^2'];

function chlenyTex(spisok: readonly Chlen[]): string {
  const out = spisok
    .filter((ch) => !nol(ch.c))
    .map((ch, i) => {
      const a = abs(ch.c);
      const telo =
        ch.d === 0
          ? texQ(a)
          : `${ravny(a, ODIN) ? '' : texKoef(a)}${STEPEN_X[ch.d] ?? `x^${ch.d}`}`;
      if (znak(ch.c) < 0) return `-${telo}`;
      return i === 0 ? telo : `+${telo}`;
    })
    .join('');
  return out === '' ? '0' : out;
}

const izMn = (a: Mn): Chlen[] =>
  a
    .map((c, d) => ({ c, d }))
    .filter((ch) => !nol(ch.c))
    .reverse();

const mnTex = (a: Mn): string => chlenyTex(izMn(a));

const sobrat = (spisok: readonly Chlen[]): Chlen[] => {
  const m: Mn = [];
  for (const ch of spisok) m[ch.d] = plus(m[ch.d] ?? NOL, ch.c);
  return izMn(Array.from({ length: m.length }, (_, i) => m[i] ?? NOL));
};

const vMn = (spisok: readonly Chlen[]): Mn =>
  spisok.reduce<Mn>((s, ch) => {
    const t: Mn = Array.from({ length: ch.d + 1 }, (_, i) => (i === ch.d ? ch.c : NOL));
    return mnPlus(s, t);
  }, []);

const protChleny = (a: readonly Chlen[]): Chlen[] => a.map((ch) => ({ c: prot(ch.c), d: ch.d }));

/** Слагаемые выражения после раскрытия скобок — в порядке записи. */
function raskryt(u: Uzel): Chlen[] {
  switch (u.t) {
    case 'num':
      return [{ c: u.v, d: 0 }];
    case 'x':
      return [{ c: ODIN, d: 1 }];
    case 'sum':
      return u.chleny.flatMap((c) => (c.minus ? protChleny(raskryt(c.u)) : raskryt(c.u)));
    case 'mul': {
      const a = raskryt(u.a);
      const b = raskryt(u.b);
      return a.flatMap((x) => b.map((y) => ({ c: umn(x.c, y.c), d: x.d + y.d })));
    }
    case 'div': {
      const k = konstanta(u.b);
      return raskryt(u.a).map((x) => ({ c: del(x.c, k), d: x.d }));
    }
    case 'pow': {
      const k = konstanta(u.b);
      if (!ravny(k, q(2))) throw new Error('степень не 2');
      const a = raskryt(u.a);
      return sobrat(a.flatMap((x) => a.map((y) => ({ c: umn(x.c, y.c), d: x.d + y.d }))));
    }
    default:
      throw new Error(`не многочлен: ${u.s}`);
  }
}

/** Есть ли в выражении скобки, которые надо раскрыть. */
function skobki(u: Uzel): boolean {
  switch (u.t) {
    case 'sum':
      return u.chleny.some((c) => skobki(c.u));
    case 'mul':
      return u.a.t === 'sum' || u.b.t === 'sum' || skobki(u.a) || skobki(u.b);
    case 'pow':
      return u.a.t === 'sum';
    default:
      return false;
  }
}

const slagaemye = (u: Uzel): { minus: boolean; u: Uzel }[] =>
  u.t === 'sum' ? u.chleny : [{ minus: false, u }];

/* ── Линейное уравнение kx = m ───────────────────────────────── */

interface Chast {
  etapy: Etap[];
  hints: HintStep[];
  x: Q;
}

const uravnenieTex = (L: readonly Chlen[], R: readonly Chlen[]): string =>
  `${chlenyTex(L)}=${chlenyTex(R)}`;

/**
 * Линейное уравнение: слева и справа — слагаемые не выше первой
 * степени, подобные уже приведены. Перенос и деление.
 */
function lineynoe(L: readonly Chlen[], R: readonly Chlen[], sdvig: number): Chast {
  const a1 = vMn(L);
  const b1 = vMn(R);
  const k = minus(koef(a1, 1), koef(b1, 1));
  const m = minus(koef(b1, 0), koef(a1, 0));
  if (nol(k)) throw new Error('коэффициент при x равен нулю');
  const x = del(m, k);
  const etapy: Etap[] = [];
  const hints: HintStep[] = [];
  const kx = (kk: Q): string =>
    ravny(kk, ODIN) ? 'x' : ravny(kk, q(-1)) ? '-x' : `${texKoef(kk)}x`;
  const gotovo = nol(koef(b1, 1)) && nol(koef(a1, 0)) && L.length === 1;
  if (!gotovo) {
    const sleva: Chlen[] = [
      ...L.filter((ch) => ch.d === 1),
      ...protChleny(R.filter((ch) => ch.d === 1)),
    ];
    const sprava: Chlen[] = [
      ...R.filter((ch) => ch.d === 0),
      ...protChleny(L.filter((ch) => ch.d === 0)),
    ];
    etapy.push({
      title: 'Перенесём слагаемые',
      lines: [
        'Слагаемые с $x$ соберём в левой части, числа — в правой. При переносе через знак «=» слагаемое меняет знак:',
        ...new Set([`$${uravnenieTex(sleva, sprava)}$`, `$${kx(k)}=${texQ(m)}$`]),
      ],
    });
    const drugie: string[] = [];
    const kNeverno = plus(koef(a1, 1), koef(b1, 1));
    if (!nol(koef(b1, 1)) && !nol(kNeverno)) drugie.push(`$${kx(kNeverno)}=${texQ(m)}$`);
    if (!nol(koef(a1, 0))) drugie.push(`$${kx(k)}=${texQ(plus(koef(b1, 0), koef(a1, 0)))}$`);
    if (!nol(m)) drugie.push(`$${kx(k)}=${texQ(prot(m))}$`);
    const h = vopros(
      'Что получится, если перенести слагаемые с $x$ влево, а числа вправо?',
      `$${kx(k)}=${texQ(m)}$`,
      drugie,
      sdvig,
      'При переносе в другую часть слагаемое меняет знак.',
    );
    if (godna(h)) hints.push(h);
  }
  if (ravny(k, ODIN)) {
    /* x уже найден переносом — спросим ответ по исходному виду. */
    const h = vopros(
      `Чему равен $x$, если $${uravnenieTex(L, R)}$?`,
      `$${texQ(x)}$`,
      [`$${texQ(plus(koef(b1, 0), koef(a1, 0)))}$`, `$${texQ(prot(x))}$`],
      sdvig + 1,
      'Число из левой части переносим вправо с противоположным знаком.',
    );
    if (godna(h)) hints.push(h);
    return { etapy, hints, x };
  }
  const lines: string[] = [];
  if (gotovo) lines.push(`$${kx(k)}=${texQ(m)}$`);
  lines.push(
    `Уравнение имеет вид $ax=b$, где $a=${texQ(k)}$, $b=${texQ(m)}$. Коэффициент $a\\ne0$ — корень один: делим обе части на $a$ (на ненулевое число делить можно).`,
  );
  if (ravny(k, ODIN)) lines.push(`$x=${texQ(x)}$`);
  else if (ravny(k, q(-1))) lines.push(`$x=${texQ(x)}$ (меняем знак у обеих частей).`);
  else if (tseloe(k) && tseloe(m) && znak(k) > 0) {
    lines.push(`$x=\\dfrac{${texQ(m)}}{${texQ(k)}}=${texQ(x)}$`);
  } else if (tseloe(del(ODIN, k))) {
    lines.push(`$x=${texQs(m)}\\cdot ${texQs(del(ODIN, k))}=${texQ(x)}$`);
  } else lines.push(`$x=${texQs(m)}:${texQs(k)}=${texQ(x)}$`);
  etapy.push({ title: 'Найдём $x$', lines });
  const neverno: string[] = [];
  if (!nol(x)) neverno.push(`$${texQ(prot(x))}$`);
  if (!nol(m)) neverno.push(`$${texQ(del(k, m))}$`);
  neverno.push(`$${texQ(minus(m, k))}$`);
  hints.push(
    vopros(
      `Чему равен $x$, если $${kx(k)}=${texQ(m)}$?`,
      `$${texQ(x)}$`,
      neverno,
      sdvig + 1,
      'Делим правую часть на коэффициент при $x$.',
    ),
  );
  return { etapy, hints, x };
}

/* ── I. Линейные (и сводящиеся к ним) ────────────────────────── */

function raskrytieSkobok(ur: Uravnenie, sdvig: number): { etap?: Etap; hint?: HintStep } {
  if (!skobki(ur.L) && !skobki(ur.R)) return {};
  const lines: string[] = [];
  let hint: HintStep | undefined;
  for (const storona of [ur.L, ur.R]) {
    for (const ch of slagaemye(storona)) {
      if (!skobki(ch.u)) continue;
      const r = raskryt(ch.u);
      const s = ch.minus ? protChleny(r) : r;
      const zapis = `${ch.minus ? '-' : ''}${ch.u.s}`;
      if (ch.u.t === 'pow') {
        const vnutri = slagaemye(ch.u.a);
        const raznost = vnutri.some((v, i) => i > 0 && v.minus);
        lines.push(
          `По формуле квадрата ${raznost ? 'разности' : 'суммы'} $(a${raznost ? '-' : '+'}b)^2=a^2${raznost ? '-' : '+'}2ab+b^2$: $${zapis}=${chlenyTex(s)}$.`,
        );
        if (hint === undefined && s.length === 3) {
          const [A, B, C] = s as [Chlen, Chlen, Chlen];
          hint = vopros(
            `Чему равно $${zapis}$?`,
            `$${chlenyTex(s)}$`,
            [chlenyTex([A, C]), chlenyTex([A, { c: del(B.c, q(2)), d: B.d }, C])].map(
              (t) => `$${t}$`,
            ),
            sdvig,
            'Удвоенное произведение $2ab$ не забываем.',
          );
        }
      } else {
        lines.push(`$${zapis}=${chlenyTex(s)}$`);
        if (hint === undefined && s.length >= 2) {
          const posl = s.length - 1;
          const v1 = s.map((c, i) => (i === posl ? { c: prot(c.c), d: c.d } : c));
          const v2 = s.map((c, i) => (i === 0 ? { c: prot(c.c), d: c.d } : c));
          hint = vopros(
            `Как раскрыть скобки в $${zapis}$?`,
            `$${chlenyTex(s)}$`,
            [`$${chlenyTex(v1)}$`, `$${chlenyTex(v2)}$`],
            sdvig,
            'Множитель перед скобкой умножаем на каждое слагаемое в скобках — вместе с его знаком.',
          );
        }
      }
    }
  }
  lines.push(`Уравнение примет вид: $${uravnenieTex(raskryt(ur.L), raskryt(ur.R))}$`);
  return { etap: { title: 'Раскроем скобки', lines }, ...(hint === undefined ? {} : { hint }) };
}

function reshitLineynoe(ur: Uravnenie, sdvig: number): Chast {
  const etapy: Etap[] = [];
  const hints: HintStep[] = [];
  const sk = raskrytieSkobok(ur, sdvig);
  if (sk.etap !== undefined) etapy.push(sk.etap);
  if (sk.hint !== undefined && godna(sk.hint)) hints.push(sk.hint);
  const L0 = raskryt(ur.L);
  const R0 = raskryt(ur.R);
  let L = sobrat(L0);
  let R = sobrat(R0);
  const lines: string[] = [];
  const kv = (s: Chlen[]): Q => s.find((c) => c.d === 2)?.c ?? NOL;
  const est2 = (s: Chlen[]): boolean => s.some((c) => c.d === 2);
  if (est2(L0) && !est2(L)) lines.push('Слагаемые с $x^2$ в левой части взаимно уничтожаются.');
  if (L.length !== L0.length || R.length !== R0.length || est2(L) || est2(R)) {
    if (est2(L) || est2(R)) {
      if (!ravny(kv(L), kv(R))) throw new Error('не линейное');
      lines.push(`$${uravnenieTex(L, R)}$`);
      lines.push(
        `В обеих частях есть $${chlenyTex([{ c: kv(L), d: 2 }])}$ — вычтем его из обеих частей:`,
      );
      L = L.filter((c) => c.d < 2);
      R = R.filter((c) => c.d < 2);
    }
    lines.push(`$${uravnenieTex(L, R)}$`);
    etapy.push({ title: 'Приведём подобные', lines });
  }
  const lin = lineynoe(L, R, sdvig + 1);
  return { etapy: [...etapy, ...lin.etapy], hints: [...hints, ...lin.hints], x: lin.x };
}

/* ── II. Квадратные ─────────────────────────────────────────── */

function koren2(a: Q): Q | undefined {
  if (znak(a) < 0) return undefined;
  const s = (n: bigint): bigint | undefined => {
    let r = BigInt(Math.round(Math.sqrt(Number(n))));
    while (r * r > n) r -= 1n;
    while ((r + 1n) * (r + 1n) <= n) r += 1n;
    return r * r === n ? r : undefined;
  };
  const ch = s(a.n);
  const zn = s(a.d);
  return ch === undefined || zn === undefined ? undefined : q(ch, zn);
}

function reshitKvadratnoe(ur: Uravnenie, vopr: Vopros, sdvig: number): Resheno {
  const L = sobrat(raskryt(ur.L));
  const R = sobrat(raskryt(ur.R));
  const P = mnMinus(vMn(L), vMn(R));
  const [c, b, a] = [koef(P, 0), koef(P, 1), koef(P, 2)];
  if (!ravny(a, ODIN)) throw new Error('старший коэффициент не 1');
  const etapy: Etap[] = [];
  const hints: HintStep[] = [];
  let korni: [Q, Q];
  if (nol(b)) {
    /* x² = k */
    const k = prot(c);
    const tsel = [{ c: ODIN, d: 2 }];
    const uzhe = L.length === 1 && L[0]?.d === 2 && R.every((ch) => ch.d === 0);
    if (!uzhe) {
      etapy.push({
        title: 'Перенесём число вправо',
        lines: [`При переносе число меняет знак: $${uravnenieTex(tsel, [{ c: k, d: 0 }])}$`],
      });
      hints.push(
        vopros(
          'Что получится, если перенести число в правую часть?',
          `$x^2=${texQ(k)}$`,
          [`$x^2=${texQ(prot(k))}$`],
          sdvig,
          'При переносе число меняет знак.',
        ),
      );
    }
    const r = koren2(k);
    if (r === undefined || nol(r)) throw new Error('не полный квадрат');
    etapy.push({
      title: 'Найдём корни',
      lines: [
        `Справа положительное число, поэтому корней два — противоположные числа: $${texQ(r)}^2=${texQ(k)}$ и $(${texQ(prot(r))})^2=${texQ(k)}$.`,
        `$x^2=${texQ(k)}\\iff\\left[\\begin{aligned}&x=${texQ(prot(r))},\\\\&x=${texQ(r)}.\\end{aligned}\\right.$`,
        `Короче: $x=\\pm\\sqrt{${texQ(k)}}=\\pm ${texQ(r)}$.`,
      ],
    });
    hints.push(
      vopros(
        `Какие корни у уравнения $x^2=${texQ(k)}$?`,
        `$${texQ(prot(r))}$ и $${texQ(r)}$`,
        [`только $${texQ(r)}$`, `$${texQ(prot(del(k, q(2))))}$ и $${texQ(del(k, q(2)))}$`],
        sdvig + 1,
        'У положительного числа два квадратных корня — противоположные числа.',
      ),
    );
    korni = [prot(r), r];
  } else if (nol(c)) {
    /* x² + bx = 0 */
    const tsel: Chlen[] = [
      { c: ODIN, d: 2 },
      { c: b, d: 1 },
    ];
    const uzhe = R.length === 0;
    if (!uzhe) {
      etapy.push({
        title: 'Перенесём всё в левую часть',
        lines: [`При переносе слагаемое меняет знак: $${chlenyTex(tsel)}=0$`],
      });
      hints.push(
        vopros(
          'Что получится, если перенести всё в левую часть?',
          `$${chlenyTex(tsel)}=0$`,
          [`$${chlenyTex([tsel[0] as Chlen, { c: prot(b), d: 1 }])}=0$`],
          sdvig,
          'При переносе слагаемое меняет знак.',
        ),
      );
    }
    const skob = (bb: Q): string =>
      chlenyTex([
        { c: ODIN, d: 1 },
        { c: bb, d: 0 },
      ]);
    etapy.push({
      title: 'Вынесем $x$ за скобки',
      lines: [
        `$x(${skob(b)})=0$`,
        'Произведение равно нулю, когда хотя бы один множитель равен нулю, — переходим к совокупности («или»):',
        `$\\left[\\begin{aligned}&x=0,\\\\&${skob(b)}=0\\end{aligned}\\right.\\iff\\left[\\begin{aligned}&x=0,\\\\&x=${texQ(prot(b))}.\\end{aligned}\\right.$`,
        'Делить обе части на $x$ нельзя: так потерялся бы корень $x=0$.',
      ],
    });
    hints.push(
      vopros(
        `Как разложить на множители $${chlenyTex(tsel)}$?`,
        `$x(${skob(b)})$`,
        [`$x(${skob(prot(b))})$`, `$x^2(1${znak(b) < 0 ? '-' : '+'}${texQ(abs(b))})$`],
        sdvig + 1,
        'Общий множитель $x$ выносим за скобки.',
      ),
    );
    korni = [NOL, prot(b)];
  } else {
    /* x² + bx + c = 0 */
    const tsel: Chlen[] = [
      { c: ODIN, d: 2 },
      { c: b, d: 1 },
      { c, d: 0 },
    ];
    const uzhe = R.length === 0;
    if (!uzhe) {
      etapy.push({
        title: 'Перенесём всё в левую часть',
        lines: [`При переносе слагаемое меняет знак: $${chlenyTex(tsel)}=0$`],
      });
      const neverno = sobrat([...L, ...R]);
      hints.push(
        vopros(
          'Что получится, если перенести всё в левую часть?',
          `$${chlenyTex(tsel)}=0$`,
          [
            `$${chlenyTex(neverno)}=0$`,
            `$${chlenyTex(tsel.map((t) => (t.d === 0 ? { c: prot(t.c), d: 0 } : t)))}=0$`,
          ],
          sdvig,
          'При переносе слагаемое меняет знак.',
        ),
      );
    }
    const D = minus(umn(b, b), umn(q(4), c));
    const s = koren2(D);
    if (s === undefined || nol(s)) throw new Error('дискриминант не квадрат');
    etapy.push({
      title: 'Дискриминант',
      lines: [
        `$a=1$, $b=${texQ(b)}$, $c=${texQ(c)}$.`,
        `$D=b^2-4ac=${texQs(b)}^2-4\\cdot 1\\cdot ${texQs(c)}=${texQ(D)}$.`,
        `$D>0$ — корней два, $\\sqrt{D}=${texQ(s)}$.`,
      ],
    });
    hints.push(
      vopros(
        `Чему равен дискриминант уравнения $${chlenyTex(tsel)}=0$?`,
        `$${texQ(D)}$`,
        [`$${texQ(plus(umn(b, b), umn(q(4), c)))}$`, `$${texQ(minus(umn(b, b), umn(q(2), c)))}$`],
        sdvig + 1,
        '$D=b^2-4ac$; следите за знаком $c$.',
      ),
    );
    const x1 = del(minus(prot(b), s), q(2));
    const x2 = del(plus(prot(b), s), q(2));
    etapy.push({
      title: 'Корни',
      lines: [
        `$x_{1,2}=\\dfrac{-b\\pm\\sqrt{D}}{2a}=\\dfrac{${texQ(prot(b))}\\pm ${texQ(s)}}{2}$`,
        `$x_1=\\dfrac{${texQ(prot(b))}-${texQ(s)}}{2}=${texQ(x1)}$, $x_2=\\dfrac{${texQ(prot(b))}+${texQ(s)}}{2}=${texQ(x2)}$.`,
        `Проверка по теореме Виета: $x_1+x_2=${texQ(plus(x1, x2))}=-b$, $x_1\\cdot x_2=${texQ(umn(x1, x2))}=c$.`,
      ],
    });
    korni = [x1, x2];
  }
  korni.sort(sravnit);
  const [k1, k2] = korni;
  const otvet = vopr === 'menshiy' ? k1 : k2;
  const drugoy = vopr === 'menshiy' ? k2 : k1;
  const slovo = vopr === 'menshiy' ? 'Меньший' : 'Больший';
  etapy.push({
    title: 'Выберем ответ',
    lines: [`Корни: $${texQ(k1)}$ и $${texQ(k2)}$. ${slovo} из них — $${texQ(otvet)}$.`],
  });
  hints.push(
    vopros(
      `Корни уравнения — $${texQ(k1)}$ и $${texQ(k2)}$. Что записать в ответ?`,
      `$${texQ(otvet)}$`,
      [`$${texQ(drugoy)}$`, `$${texQ(prot(otvet))}$`],
      sdvig + 2,
      `В условии просят ${vopr === 'menshiy' ? 'меньший' : 'больший'} корень.`,
    ),
  );
  return { otvet: zapisQ(otvet), etapy, hints: hints.filter(godna) };
}

/* ── III. Иррациональные ────────────────────────────────────── */

function reshitIrratsionalnoe(ur: Uravnenie, sdvig: number): Chast {
  const etapy: Etap[] = [];
  const hints: HintStep[] = [];
  let pod: Uzel;
  let c: Q;
  if (ur.L.t === 'sqrt') {
    pod = ur.L.a;
    c = konstanta(ur.R);
  } else if (
    ur.L.t === 'div' &&
    ur.L.b.t === 'sqrt' &&
    ur.R.t === 'div' &&
    ravny(konstanta(ur.L.a), konstanta(ur.R.a))
  ) {
    pod = ur.L.b.a;
    c = konstanta(ur.R.b);
    etapy.push({
      title: 'Сравним знаменатели',
      lines: [
        'Дроби с одинаковыми числителями равны, когда равны их знаменатели:',
        `$\\sqrt{${pod.s}}=${texQ(c)}$`,
      ],
    });
    hints.push(
      vopros(
        `Что следует из равенства $${ur.s}$?`,
        `$\\sqrt{${pod.s}}=${texQ(c)}$`,
        [`$\\sqrt{${pod.s}}=\\frac{1}{${texQ(c)}}$`, `$${pod.s}=${texQ(c)}$`],
        sdvig + 2,
        'Числители равны — значит, равны и знаменатели.',
      ),
    );
  } else throw new Error(`иррациональное не того вида: ${ur.s}`);
  if (znak(c) <= 0) throw new Error('правая часть не положительна');
  const c2 = umn(c, c);
  etapy.push({
    title: 'Возведём в квадрат',
    lines: [
      `Правая часть $${texQ(c)}$ положительна, поэтому обе части можно возвести в квадрат:`,
      `$${pod.s}=${texQ(c)}^2=${texQ(c2)}$`,
    ],
  });
  hints.push(
    vopros(
      `Что получится, если возвести в квадрат обе части $\\sqrt{${pod.s}}=${texQ(c)}$?`,
      `$${pod.s}=${texQ(c2)}$`,
      [`$${pod.s}=${texQ(c)}$`, `$${pod.s}=${texQ(umn(c, q(2)))}$`],
      sdvig,
      'Квадрат корня — подкоренное выражение, а правую часть тоже возводим в квадрат.',
    ),
  );
  const L = sobrat(raskryt(pod));
  let x: Q;
  if (L.length === 1 && L[0]?.d === 1 && ravny(L[0].c, ODIN)) x = c2;
  else {
    const lin = lineynoe(L, [{ c: c2, d: 0 }], sdvig + 1);
    etapy.push(...lin.etapy);
    hints.push(...lin.hints);
    x = lin.x;
  }
  etapy.push({
    title: 'Проверка',
    lines: [
      `При $x=${texQ(x)}$ под корнем $${texQ(c2)}\\ge 0$, и $\\sqrt{${texQ(c2)}}=${texQ(c)}$ — равенство верное.`,
      `Ответ: $${texQ(x)}$.`,
    ],
  });
  return { etapy, hints, x };
}

/* ── IV. Показательные ──────────────────────────────────────── */

interface Stepen {
  osn: Q;
  pok: Mn;
  /** Показатель, как он записан в условии. */
  pokS: string;
}

/** k, при котором c^k = v (|k| ≤ 64), или undefined. */
function pokazatel(v: Q, c: Q): number | undefined {
  if (ravny(v, ODIN)) return 0;
  for (let k = 1; k <= 64; k += 1) {
    if (ravny(step(c, k), v)) return k;
    if (ravny(step(c, -k), v)) return -k;
  }
  return undefined;
}

function osnTex(c: Q): string {
  if (tseloe(c)) return c.n.toString();
  return `\\left(\\frac{${c.n.toString()}}{${c.d.toString()}}\\right)`;
}

const stepenTex = (c: Q, pok: string): string => `${osnTex(c)}^{${pok}}`;

function stepenUzla(u: Uzel): Stepen | undefined {
  if (u.t !== 'pow' || !estX(u.b) || estX(u.a)) return undefined;
  return { osn: konstanta(u.a), pok: mnogochlen(u.b), pokS: u.b.s };
}

type StoronaExp =
  { vid: 'konst'; v: Q; s: string } | { vid: 'stepeni'; a: Stepen; op?: 'umn' | 'del'; b?: Stepen };

function storonaExp(u: Uzel): StoronaExp {
  if (!estX(u)) return { vid: 'konst', v: konstanta(u), s: u.s };
  const a = stepenUzla(u);
  if (a !== undefined) return { vid: 'stepeni', a };
  if (u.t === 'mul' || u.t === 'div') {
    const x = stepenUzla(u.a);
    const y = stepenUzla(u.b);
    if (x !== undefined && y !== undefined) {
      return { vid: 'stepeni', a: x, op: u.t === 'mul' ? 'umn' : 'del', b: y };
    }
  }
  throw new Error(`показательная часть не того вида: ${u.s}`);
}

/** Целое «прочтение» основания: 6 и 1/6 — оба 6. */
function tseloeOsn(b: Q): Q | undefined {
  if (tseloe(b) && b.n > 1n) return b;
  if (b.n === 1n && b.d > 1n) return q(b.d);
  return undefined;
}

function vybratOsnovanie(osnovaniya: Q[], konst: Q[]): Q {
  const vse = [...osnovaniya, ...konst];
  const goditsya = (c: Q, neotr: boolean): boolean =>
    vse.every((v) => {
      const k = pokazatel(v, c);
      return k !== undefined && (!neotr || k >= 0);
    });
  const [b0] = osnovaniya;
  if (b0 === undefined) throw new Error('нет степеней');
  if (!tseloe(b0) && goditsya(b0, true)) return b0;
  const kandidaty = osnovaniya.map(tseloeOsn).filter((c): c is Q => c !== undefined);
  for (const c of kandidaty) if (goditsya(c, false)) return c;
  /* Наименьшее целое, степенями которого служат все основания. */
  const t = kandidaty[0];
  if (t !== undefined) {
    for (let g = 2n; g <= t.n; g += 1n) {
      if (goditsya(q(g), false)) return q(g);
    }
  }
  throw new Error('нет общего основания');
}

/** Показатель k·u записью «2(2x-6)», «-(2x+13)». */
function kRaz(k: number, u: Mn, zapis: string): string {
  const odin = izMn(u).length === 1;
  const t = zapis;
  if (odin) return mnTex(mnUmn(u, [q(k)]));
  if (k === -1) return `-(${t})`;
  return `${k}(${t})`;
}

function reshitPokazatelnoe(
  ur: Uravnenie,
  sdvig: number,
  predvaritelno: { etapy: Etap[]; hints: HintStep[] } = { etapy: [], hints: [] },
): Chast {
  const etapy: Etap[] = [...predvaritelno.etapy];
  const hints: HintStep[] = [...predvaritelno.hints];
  const L = storonaExp(ur.L);
  const R = storonaExp(ur.R);
  const stepeni = [L, R].flatMap((s) =>
    s.vid === 'stepeni' ? [s.a, ...(s.b === undefined ? [] : [s.b])] : [],
  );
  const konst = [L, R].flatMap((s) => (s.vid === 'konst' ? [s] : []));
  const c = vybratOsnovanie(
    stepeni.map((s) => s.osn),
    konst.map((s) => s.v),
  );
  /* Показатель степени после перехода к основанию c. */
  const novyy = (s: Stepen): Mn => mnUmn(s.pok, [q(pokazatel(s.osn, c) ?? 0)]);
  const lines: string[] = [];
  let hintOsn: HintStep | undefined;
  for (const s of stepeni) {
    const k = pokazatel(s.osn, c) ?? 0;
    if (k === 1) continue;
    const pokS = s.pokS;
    const iskh = stepenTex(s.osn, pokS);
    const itog = stepenTex(c, mnTex(novyy(s)));
    if (k === -1 && tseloe(c)) {
      lines.push(`$${iskh}=${stepenTex(c, kRaz(-1, s.pok, s.pokS))}=${itog}$`);
    } else {
      const promezh = `\\left(${stepenTex(c, String(k))}\\right)^{${pokS}}`;
      const umnozh = stepenTex(c, kRaz(k, s.pok, s.pokS));
      lines.push(`$${iskh}=${promezh}=${umnozh === itog ? itog : `${umnozh}=${itog}`}$`);
    }
    if (hintOsn === undefined) {
      const neverno1 = mnPlus(s.pok, [NOL]).map((v, i) => (i === 1 ? umn(v, q(k)) : v));
      hintOsn = vopros(
        `Как записать $${iskh}$ степенью числа $${osnTex(c)}$?`,
        `$${itog}$`,
        [`$${stepenTex(c, mnTex(neverno1))}$`, `$${stepenTex(c, mnTex(mnUmn(s.pok, [q(-k)])))}$`],
        sdvig,
        `$${osnTex(s.osn)}=${stepenTex(c, String(k))}$, при возведении степени в степень показатели перемножаются.`,
      );
    }
  }
  let hintKonst: HintStep | undefined;
  for (const s of konst) {
    const k = pokazatel(s.v, c) ?? 0;
    lines.push(
      k === 0
        ? `$${s.s}=${stepenTex(c, '0')}$ — любое число в нулевой степени равно $1$.`
        : `$${s.s}=${stepenTex(c, String(k))}$`,
    );
    if (hintKonst === undefined && k !== 1) {
      hintKonst = vopros(
        `Как записать $${s.s}$ степенью числа $${osnTex(c)}$?`,
        `$${stepenTex(c, String(k))}$`,
        [stepenTex(c, String(-k)), stepenTex(c, String(k + 1))].map((t) => `$${t}$`),
        sdvig + 1,
        `Сколько раз нужно умножить $${osnTex(c)}$ само на себя?`,
      );
    }
  }
  if (lines.length > 0) {
    etapy.push({
      title: `Приведём к основанию $${osnTex(c)}$`,
      lines: [`Запишем все степени и числа как степени числа $${osnTex(c)}$:`, ...lines],
    });
  }
  /* Сложение (вычитание) показателей. */
  const itogStorony = (s: StoronaExp): Mn => {
    if (s.vid === 'konst') return [q(pokazatel(s.v, c) ?? 0)];
    const u = novyy(s.a);
    if (s.b === undefined) return u;
    const v = novyy(s.b);
    return s.op === 'umn' ? mnPlus(u, v) : mnMinus(u, v);
  };
  let hintSum: HintStep | undefined;
  const linesSum: string[] = [];
  for (const s of [L, R]) {
    if (s.vid !== 'stepeni' || s.b === undefined) continue;
    const u = novyy(s.a);
    const v = novyy(s.b);
    const umnozh = s.op === 'umn';
    const w = umnozh ? mnPlus(u, v) : mnMinus(u, v);
    linesSum.push(
      `$${stepenTex(c, mnTex(u))}${umnozh ? '\\cdot ' : ':'}${stepenTex(c, mnTex(v))}=${stepenTex(c, `(${mnTex(u)})${umnozh ? '+' : '-'}(${mnTex(v)})`)}=${stepenTex(c, mnTex(w))}$`,
    );
    const nev = umnozh ? mnMinus(u, v) : mnPlus(u, v);
    const nev2 = umnozh ? mnUmn(u, [q(2)]) : mnPlus(mnMinus(u, v), [umn(koef(v, 0), q(2))]);
    hintSum = vopros(
      `Чему равно $${stepenTex(c, mnTex(u))}${umnozh ? '\\cdot ' : ':'}${stepenTex(c, mnTex(v))}$?`,
      `$${stepenTex(c, mnTex(w))}$`,
      [`$${stepenTex(c, mnTex(nev))}$`, `$${stepenTex(c, mnTex(nev2))}$`],
      sdvig + 2,
      umnozh
        ? 'При умножении степеней с одинаковым основанием показатели складываются.'
        : 'При делении степеней с одинаковым основанием показатели вычитаются — вычитается весь второй показатель.',
    );
  }
  if (linesSum.length > 0) {
    const vse = [L, R].every((s) => s.vid !== 'stepeni' || s.b === undefined || s.op === 'umn');
    const nikto = [L, R].every((s) => s.vid !== 'stepeni' || s.b === undefined || s.op === 'del');
    etapy.push({
      title: vse ? 'Сложим показатели' : nikto ? 'Вычтем показатели' : 'Сложим и вычтем показатели',
      lines: [
        vse
          ? 'При умножении степеней с одинаковым основанием показатели складываются:'
          : 'При делении степеней с одинаковым основанием показатели вычитаются:',
        ...linesSum,
      ],
    });
  }
  const U = itogStorony(L);
  const V = itogStorony(R);
  etapy.push({
    title: 'Приравняем показатели',
    lines: [
      `$${stepenTex(c, mnTex(U))}=${stepenTex(c, mnTex(V))}$`,
      `Основания одинаковые, значит, равны и показатели: $${mnTex(U)}=${mnTex(V)}$.`,
    ],
  });
  const lin = lineynoe(izMn(U), izMn(V), sdvig + 3);
  for (const h of [hintKonst, hintOsn, hintSum]) if (h !== undefined && godna(h)) hints.push(h);
  return { etapy: [...etapy, ...lin.etapy], hints: [...hints, ...lin.hints].slice(-4), x: lin.x };
}

/** b^x + k·b^x = N: общий множитель, затем b^x = число. */
function reshitVynesenie(ur: Uravnenie, sdvig: number): Chast {
  if (ur.L.t !== 'sum') throw new Error('не сумма');
  let osn: Q | undefined;
  let summa = NOL;
  const koefy: Q[] = [];
  for (const ch of ur.L.chleny) {
    let k = ODIN;
    let u = ch.u;
    if (u.t === 'mul' && !estX(u.a)) {
      k = konstanta(u.a);
      u = u.b;
    }
    const s = stepenUzla(u);
    if (s === undefined || !ravny(koef(s.pok, 1), ODIN) || !nol(koef(s.pok, 0))) {
      throw new Error('не b^x');
    }
    if (osn !== undefined && !ravny(osn, s.osn)) throw new Error('разные основания');
    osn = s.osn;
    if (ch.minus) k = prot(k);
    koefy.push(k);
    summa = plus(summa, k);
  }
  if (osn === undefined || nol(summa)) throw new Error('пустая сумма');
  const N = konstanta(ur.R);
  const v = del(N, summa);
  const bx = stepenTex(osn, 'x');
  const skob = koefy
    .map((k, i) => (i === 0 ? texQ(k) : `${znak(k) < 0 ? '-' : '+'}${texQ(abs(k))}`))
    .join('');
  const etapy: Etap[] = [
    {
      title: `Вынесем $${bx}$ за скобки`,
      lines: [
        `$${ur.L.s}=(${skob})\\cdot ${bx}=${texQ(summa)}\\cdot ${bx}$`,
        `$${texQ(summa)}\\cdot ${bx}=${texQ(N)}$`,
        `Разделим обе части на $${texQ(summa)}$: $${bx}=${tseloe(v) ? texQ(v) : `\\frac{${texQ(N)}}{${texQ(summa)}}=${texQ(v)}`}$.`,
      ],
    },
  ];
  const hints: HintStep[] = [
    vopros(
      `Чему равно $${ur.L.s}$?`,
      `$${texQ(summa)}\\cdot ${bx}$`,
      [
        `$${texQ(minus(summa, ODIN))}\\cdot ${bx}$`,
        `$${texQ(summa)}\\cdot ${stepenTex(osn, '2x')}$`,
      ],
      sdvig,
      `$${bx}$ — общий множитель: $${bx}=1\\cdot ${bx}$.`,
    ),
  ];
  const vTex = texQ(v);
  const prostoe: Uravnenie = {
    L: {
      t: 'pow',
      a: { t: 'num', v: osn, s: osnTex(osn) },
      b: { t: 'x', s: 'x' },
      s: bx,
    },
    R: { t: 'num', v, s: vTex },
    s: `${bx}=${vTex}`,
  };
  return reshitPokazatelnoe(prostoe, sdvig + 1, { etapy, hints });
}

/* ── V. Логарифмические ─────────────────────────────────────── */

interface ChlenLog {
  minus: boolean;
  log?: { osn: Osnovanie; arg: Uzel };
  v?: Q;
}

function chlenyLog(u: Uzel): ChlenLog[] {
  return slagaemye(u).map((ch) => {
    if (ch.u.t === 'log') return { minus: ch.minus, log: { osn: ch.u.osn, arg: ch.u.a } };
    if (estX(ch.u) || estUzel(ch.u, 'log')) throw new Error(`не логарифм: ${ch.u.s}`);
    return { minus: ch.minus, v: konstanta(ch.u) };
  });
}

const logTex = (o: Osnovanie): string =>
  o.vid === 'lg' ? '\\lg' : o.vid === 'e' ? '\\ln' : `\\log_{${o.u.s}}`;

function reshitLogarifmicheskoe(ur: Uravnenie, sdvig: number): Chast {
  const L = chlenyLog(ur.L);
  const R = chlenyLog(ur.R);
  const sX = [...L, ...R].filter((c) => c.log !== undefined && estX(c.log.arg));
  const A = sX[0]?.log;
  if (sX.length !== 1 || A === undefined) throw new Error('не один логарифм с x');
  const o = A.osn;
  const lg = logTex(o);
  const As = A.arg.s;
  const etapy: Etap[] = [
    {
      title: 'Область допустимых значений',
      lines: [`Под логарифмом должно стоять положительное число: $${As}>0$.`],
    },
  ];
  const hints: HintStep[] = [];
  let v: Q;
  const lines: string[] = [];
  let neverno: Q[] = [];
  const odin = (s: ChlenLog[]): boolean => s.length === 1 && s[0]?.minus === false;
  const konstLog = (c: ChlenLog | undefined): { s: string; v: Q } => {
    if (c?.log === undefined) throw new Error('ждали логарифм числа');
    return { s: c.log.arg.s, v: konstanta(c.log.arg) };
  };
  if (L.length === 1 && odin(R) && R[0]?.log !== undefined) {
    /* log A = log K */
    const K = konstLog(R[0]);
    v = K.v;
    etapy.push({
      title: 'Уберём логарифмы',
      lines: [
        'Логарифмы с одинаковым основанием равны, значит, равны и выражения под ними:',
        `$${As}=${K.s}$`,
      ],
    });
  } else if (L.length === 1 && R.length === 1 && R[0]?.v !== undefined) {
    /* log_b A = n */
    const n = R[0].minus ? prot(R[0].v) : R[0].v;
    const b = o.vid === 'lg' ? q(10) : o.vid === 'uzel' ? konstanta(o.u) : undefined;
    if (b === undefined || !tseloe(n)) throw new Error('основание не число');
    v = step(b, Number(n.n));
    const bS =
      o.vid === 'lg'
        ? '10'
        : tseloe(b)
          ? o.vid === 'uzel'
            ? o.u.s
            : ''
          : `\\left(${o.vid === 'uzel' ? o.u.s : ''}\\right)`;
    lines.push(
      `По определению логарифма $${lg}(${As})=${texQ(n)}$ означает, что $${As}=${bS}^{${texQ(n)}}$:`,
      `$${As}=${bS}^{${texQ(n)}}=${texQ(v)}$`,
    );
    etapy.push({ title: 'По определению логарифма', lines });
    neverno = [umn(b, n), znak(n) < 0 ? step(b, -Number(n.n)) : step(b, Number(n.n) + 1)];
  } else if (L.length === 2 && odin(R) && R[0]?.log !== undefined) {
    const M = konstLog(R[0]);
    const [p0, p1] = L as [ChlenLog, ChlenLog];
    if (p0.log !== undefined && estX(p0.log.arg) && !p0.minus) {
      const K = konstLog(p1);
      if (!p1.minus) {
        /* log A + log K = log M */
        v = del(M.v, K.v);
        lines.push(
          'Сумма логарифмов с одинаковым основанием равна логарифму произведения:',
          `$${lg}\\left(${K.s}\\cdot(${As})\\right)=${lg} ${M.s}$`,
          'Логарифмы равны — равны и выражения под ними:',
          `$${K.s}\\cdot(${As})=${M.s}$`,
          `$${As}=${M.s}:${K.s}=${texQ(v)}$`,
        );
        neverno = [minus(M.v, K.v), umn(M.v, K.v)];
      } else {
        /* log A − log K = log M */
        v = umn(M.v, K.v);
        lines.push(
          'Разность логарифмов с одинаковым основанием равна логарифму частного:',
          `$${lg}\\dfrac{${As}}{${K.s}}=${lg} ${M.s}$`,
          'Логарифмы равны — равны и выражения под ними:',
          `$\\dfrac{${As}}{${K.s}}=${M.s}$`,
          `$${As}=${M.s}\\cdot ${K.s}=${texQ(v)}$`,
        );
        neverno = [del(M.v, K.v), plus(M.v, K.v)];
      }
    } else if (p1.log !== undefined && estX(p1.log.arg) && p1.minus && !p0.minus) {
      /* log K − log A = log M */
      const K = konstLog(p0);
      v = del(K.v, M.v);
      lines.push(
        'Разность логарифмов с одинаковым основанием равна логарифму частного:',
        `$${lg}\\dfrac{${K.s}}{${As}}=${lg} ${M.s}$`,
        'Логарифмы равны — равны и выражения под ними:',
        `$\\dfrac{${K.s}}{${As}}=${M.s}$`,
        `$${As}=${K.s}:${M.s}=${texQ(v)}$`,
      );
      neverno = [del(M.v, K.v), minus(K.v, M.v)];
    } else throw new Error(`логарифмы не того вида: ${ur.s}`);
    etapy.push({ title: 'Соберём логарифмы', lines });
  } else throw new Error(`логарифмическое не того вида: ${ur.s}`);
  if (znak(v) <= 0) throw new Error('под логарифмом не положительное');
  if (neverno.length > 0) {
    const h = vopros(
      'Какое уравнение получится без логарифмов?',
      `$${As}=${texQ(v)}$`,
      neverno.filter((n) => !ravny(n, v)).map((n) => `$${As}=${texQ(n)}$`),
      sdvig,
      'Пользуемся определением и свойствами логарифма.',
    );
    if (godna(h)) hints.push(h);
  }
  hints.push(
    vopros(
      'Какое условие должен выполнять найденный корень?',
      `$${As}>0$`,
      [`$x>0$`, `$${As}\\ge 0$`],
      sdvig + 1,
      'Логарифм определён только для положительных чисел.',
    ),
  );
  const arg = sobrat(raskryt(A.arg));
  const lin = lineynoe(arg, [{ c: v, d: 0 }], sdvig + 2);
  etapy.push(...lin.etapy);
  hints.push(...lin.hints.slice(-1));
  etapy.push({
    title: 'Проверка',
    lines: [
      `При $x=${texQ(lin.x)}$ под логарифмом $${As}=${texQ(v)}>0$ — корень подходит.`,
      `Ответ: $${texQ(lin.x)}$.`,
    ],
  });
  return { etapy, hints, x: lin.x };
}

/* ── Решение целиком ────────────────────────────────────────── */

export function reshit(ur: Uravnenie, vopr: Vopros): Resheno {
  const sdvig = hesh(ur.s);
  const est = (t: Uzel['t']): boolean => estUzel(ur.L, t) || estUzel(ur.R, t);
  const vPokazatele = (u: Uzel): boolean => {
    if (u.t === 'pow' && estX(u.b)) return true;
    if (u.t === 'sum') return u.chleny.some((c) => vPokazatele(c.u));
    if (u.t === 'mul' || u.t === 'div') return vPokazatele(u.a) || vPokazatele(u.b);
    return false;
  };
  let chast: Chast;
  if (est('log')) chast = reshitLogarifmicheskoe(ur, sdvig);
  else if (vPokazatele(ur.L) || vPokazatele(ur.R)) {
    chast = ur.L.t === 'sum' ? reshitVynesenie(ur, sdvig) : reshitPokazatelnoe(ur, sdvig);
  } else if (est('sqrt')) chast = reshitIrratsionalnoe(ur, sdvig);
  else {
    const P = mnMinus(mnogochlen(ur.L), mnogochlen(ur.R));
    if (P.length === 3) return reshitKvadratnoe(ur, vopr, sdvig);
    chast = reshitLineynoe(ur, sdvig);
  }
  if (vopr !== 'koren') throw new Error('у линейного уравнения один корень');
  return { otvet: zapisQ(chast.x), etapy: chast.etapy, hints: chast.hints.filter(godna) };
}
