/**
 * Дроби и проценты (ЕГЭ база): доли ↔ десятичные ↔ проценты, процент
 * от числа по частям, степени двойки, кубы, корни.
 */

import { chisloTex, chisloText } from '../chislo';
import { sdelat, znach } from '../primer';
import type { Priyom, Shag, Zveno } from '../types';

const num = (s: string | undefined): number => Number(s ?? '0');

function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b);
}

/* ── Доли, десятичные, проценты ────────────────────────────── */

type Vid = 'fd' | 'fp' | 'dp' | 'pd';

const ZNAM: Record<1 | 2 | 3, number[]> = {
  1: [2, 4, 5, 10],
  2: [4, 5, 8, 20],
  3: [8, 20, 25, 40, 50],
};

/** Во сколько раз домножить знаменатель до 10, 100 или 1000. */
function doKruglogo(b: number): number {
  for (const r of [10, 100, 1000, 10000]) if (r % b === 0) return r / b;
  return 1;
}

const frac = (a: number | string, b: number | string): Zveno => ({
  e: `${a}/${b}`,
  tex: `\\frac{${a}}{${b}}`,
});

export const doliProcenty: Priyom = {
  id: 'doli-procenty',
  gruppa: 'doli',
  deystvie: 'doli',
  deystviya: ['doli'],
  desyatichnye: [1, 2, 3],
  sozdat(rng, o) {
    const b = rng.pick(ZNAM[o.uroven]);
    let a = rng.int(1, b - 1);
    while (gcd(a, b) !== 1) a = rng.int(1, b - 1);
    const percent = znach(`${a}/${b}*100`);
    const celyy = /^\d+$/.test(percent);
    let vidy: Vid[] = o.desyatichnye ? ['fd', 'fp', 'dp', 'pd'] : ['fp'];
    if (!o.desyatichnye && !celyy) return null;
    if (o.uroven === 1) vidy = vidy.filter((v) => v !== 'pd');
    return this.iz([String(a), String(b)], o.uroven, rng.pick(vidy));
  },
  iz(d, uroven, v) {
    const a = d[0] as string;
    const b = d[1] as string;
    const vid = (v ?? 'fd') as Vid;
    const dec = znach(`${a}/${b}`);
    const p = znach(`${a}/${b}*100`);
    const base = { priyom: 'doli-procenty' as const, uroven, deystvie: 'doli' as const, d, v: vid };
    if (vid === 'fd') {
      return sdelat({ ...base, expr: `${a}/${b}`, tex: `\\frac{${a}}{${b}}`, text: `${a}/${b}` });
    }
    if (vid === 'fp') {
      return sdelat({
        ...base,
        expr: `${a}/${b}*100`,
        tex: `\\frac{${a}}{${b}}`,
        text: `${a}/${b}`,
        ed: '%',
      });
    }
    if (vid === 'dp') {
      return sdelat({
        ...base,
        expr: `${dec}*100`,
        tex: chisloTex(dec),
        text: chisloText(dec),
        ed: '%',
      });
    }
    return sdelat({
      ...base,
      expr: `${p}/100`,
      tex: `${chisloTex(p)}\\,\\%`,
      text: `${chisloText(p)} %`,
    });
  },
  razbor(p) {
    const a = num(p.d[0]);
    const b = num(p.d[1]);
    const f = doKruglogo(b);
    const dec = znach(`${a}/${b}`);
    const pr = znach(`${a}/${b}*100`);
    const toDec: Shag = {
      tekst: `Домножаем числитель и знаменатель на $${f}$, чтобы в знаменателе стало $${b * f}$.`,
      cep: [frac(a, b), frac(a * f, b * f), dec],
    };
    const toPr: Shag = { tekst: 'Доля → проценты: умножаем на $100$.', cep: [`${dec}*100`, pr] };
    switch (p.v as Vid) {
      case 'fd':
        return [toDec];
      case 'fp':
        return [toDec, toPr];
      case 'dp':
        return [toPr];
      default:
        return [{ tekst: 'Проценты → дробь: делим на $100$.', cep: [`${pr}/100`, dec] }];
    }
  },
};

/* ── Процент от числа по частям ────────────────────────────── */

const PROC: Record<1 | 2 | 3, string[]> = {
  1: ['10', '50', '25', '20'],
  2: ['15', '5', '30', '40', '60', '75'],
  3: ['12', '35', '45', '120', '2.5', '7.5'],
};

/** Шаг N: на что должно делиться число, чтобы p % от него было целым. */
function shagChisla(p: string): number {
  /* p % от N целое ⇔ N·p/100 целое. */
  for (let m = 1; m <= 1000; m += 1) if (/^-?\d+$/.test(znach(`${m}*${p}/100`))) return m;
  return 1000;
}

export const procentOtChisla: Priyom = {
  id: 'procent-ot-chisla',
  gruppa: 'doli',
  deystvie: 'doli',
  deystviya: ['doli'],
  desyatichnye: [3],
  sozdat(rng, o) {
    let list = PROC[o.uroven];
    if (!o.desyatichnye) list = list.filter((p) => !p.includes('.'));
    const p = rng.pick(list);
    const m = shagChisla(p);
    let N = m * rng.int(Math.max(1, Math.ceil(40 / m)), Math.max(2, Math.floor(1000 / m)));
    if (N === 100) N += m;
    return this.iz([p, String(N)], o.uroven);
  },
  iz(d, uroven) {
    const p = d[0] as string;
    const N = d[1] as string;
    return sdelat({
      priyom: 'procent-ot-chisla',
      uroven,
      deystvie: 'doli',
      d,
      expr: `${N}*${p}/100`,
      tex: `${chisloTex(p)}\\,\\%\\ \\text{от}\\ ${chisloTex(N)}`,
      text: `${chisloText(p)} % от ${chisloText(N)}`,
    });
  },
  razbor(pr) {
    const p = pr.d[0] as string;
    const N = pr.d[1] as string;
    const ans = znach(pr.expr);
    const P = (s: string) => `$${chisloTex(s)}\\,\\%$`;
    const prostye: Record<string, [number, string]> = {
      '50': [2, 'половина'],
      '25': [4, 'четверть'],
      '20': [5, 'пятая часть'],
    };
    const pz = prostye[p];
    if (pz !== undefined) {
      return [{ tekst: `${P(p)} — ${pz[1]} числа.`, cep: [`${N}/${pz[0]}`, ans] }];
    }
    if (p === '75') {
      const q = znach(`${N}/4`);
      return [
        { tekst: `${P('25')} — четверть числа.`, cep: [`${N}/4`, q] },
        { tekst: `${P('75')} — всё число без четверти.`, cep: [`${N}-${q}`, ans] },
      ];
    }
    if (p === '120') {
      const q = znach(`${N}/5`);
      return [
        { tekst: `${P('20')} — пятая часть числа.`, cep: [`${N}/5`, q] },
        { tekst: `${P('120')} — всё число и ещё ${P('20')}.`, cep: [`${N}+${q}`, ans] },
      ];
    }
    const ten = znach(`${N}/10`);
    const shagi: Shag[] = [{ tekst: `${P('10')} — десятая часть числа.`, cep: [`${N}/10`, ten] }];
    const parts: string[] = [];
    const sostav: string[] = [];
    const a = Math.floor(Number(p) / 10);
    const rem = znach(`${p}-${a * 10}`);
    if (a === 1) {
      parts.push(ten);
      sostav.push(P('10'));
    } else if (a > 1) {
      const A = znach(`${ten}*${a}`);
      shagi.push({
        tekst: `${P(String(10 * a))} — это ${a} раза по ${P('10')}.`,
        cep: [`${ten}*${a}`, A],
      });
      parts.push(A);
      sostav.push(P(String(10 * a)));
    }
    if (rem === '5' || rem === '7.5') {
      const five = znach(`${ten}/2`);
      shagi.push({ tekst: `${P('5')} — половина от ${P('10')}.`, cep: [`${ten}/2`, five] });
      parts.push(five);
      sostav.push(P('5'));
    }
    if (rem === '2.5' || rem === '7.5') {
      const q = znach(`${ten}/4`);
      shagi.push({ tekst: `${P('2.5')} — четверть от ${P('10')}.`, cep: [`${ten}/4`, q] });
      parts.push(q);
      sostav.push(P('2.5'));
    }
    if (rem === '2') {
      const one = znach(`${N}/100`);
      const two = znach(`${one}*2`);
      shagi.push({
        tekst: `${P('1')} — сотая часть числа, ${P('2')} — вдвое больше.`,
        cep: [`${N}/100*2`, `${one}*2`, two],
      });
      parts.push(two);
      sostav.push(P('2'));
    }
    if (parts.length > 1) {
      shagi.push({ tekst: `${P(p)} = ${sostav.join(' + ')}.`, cep: [parts.join('+'), ans] });
    }
    return shagi;
  },
};

/* ── Степени, кубы, корни ──────────────────────────────────── */

export const stepeniKubyKorni: Priyom = {
  id: 'stepeni-kuby-korni',
  gruppa: 'doli',
  deystvie: 'doli',
  deystviya: ['doli', 'kvadraty'],
  sozdat(rng, o) {
    if (o.uroven === 1) {
      const t = rng.int(0, 15);
      if (t < 9) return this.iz(['2', String(t + 2)], 1);
      if (t < 13) return this.iz(['3', String(t - 7)], 1);
      return this.iz(['5', String(t - 11)], 1);
    }
    if (o.uroven === 2) {
      const t = rng.int(0, 12);
      if (t < 9) return this.iz([String(t + 2), '3'], 2);
      return this.iz(['4', String(t - 7)], 2);
    }
    if (rng.chance(0.1)) return this.iz(['2', String(rng.int(11, 12))], 3);
    return this.iz([String(rng.int(11, 30))], 3, 'koren');
  },
  iz(d, uroven, v) {
    if (v === 'koren') {
      const n = num(d[0]);
      return sdelat({
        priyom: 'stepeni-kuby-korni',
        uroven,
        deystvie: 'doli',
        d,
        v,
        expr: `sqrt(${n * n})`,
      });
    }
    return sdelat({
      priyom: 'stepeni-kuby-korni',
      uroven,
      deystvie: 'doli',
      d,
      expr: `${d[0]}^${d[1]}`,
    });
  },
  razbor(p) {
    if (p.v === 'koren') {
      const n = num(p.d[0]);
      const N = n * n;
      return [
        {
          tekst: `Ищем число, квадрат которого $${chisloTex(String(N))}$. Оно между $${Math.floor(n / 10) * 10}$ и $${Math.floor(n / 10) * 10 + 10}$, последняя цифра квадрата — $${N % 10}$.`,
          cep: [`${n}^2`, `${N}`],
        },
        { cep: [`sqrt(${N})`, `${n}`] },
      ];
    }
    const a = num(p.d[0]);
    const n = num(p.d[1]);
    const ans = znach(p.expr);
    if (n === 2) return [{ cep: [p.expr, `${a}*${a}`, ans] }];
    if (n === 3) {
      return [
        {
          tekst: 'Куб — квадрат, умноженный ещё раз на число.',
          cep: [p.expr, `${a}^2*${a}`, `${a * a}*${a}`, ans],
        },
      ];
    }
    if (n % 2 === 0) {
      const h = n / 2;
      const v = znach(`${a}^${h}`);
      return [
        {
          tekst: `$${a}^{${n}} = ${a}^{${h}}\\cdot ${a}^{${h}}$.`,
          cep: [p.expr, `${a}^${h}*${a}^${h}`, `${v}*${v}`, ans],
        },
      ];
    }
    const v = znach(`${a}^${n - 1}`);
    return [
      {
        tekst: `$${a}^{${n}} = ${a}^{${n - 1}}\\cdot ${a}$.`,
        cep: [p.expr, `${a}^${n - 1}*${a}`, `${v}*${a}`, ans],
      },
    ];
  },
};

export const DOLI: readonly Priyom[] = [doliProcenty, procentOtChisla, stepeniKubyKorni];
