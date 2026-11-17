/**
 * Банк сборника на сборке: читает data/sbornik/glava-N/tip-*.json и
 * набирает тексты KaTeX. Только для серверных страниц и файлов данных —
 * в браузер уходит ZadachaKlient: ответ отпечатками, решение закрыто.
 */

import fs from 'node:fs';
import path from 'node:path';
import { typeset, typesetKrupno } from '@/lib/tex';
import { TIPY } from '@/content/sbornik';
import { strokaObedineniya } from './proverka';
import type { Otkrytoe, Otvet, ProverkaKlient, Tochka, TochkaKlient, ZadachaDannye, ZadachaKlient } from './types';
import { otpechatokStroki, otpechatokZnacheniya, ustoychivo, zakryt } from './zamok';

const DATA = path.join(process.cwd(), 'src', 'data', 'sbornik');

const cache = new Map<string, readonly ZadachaDannye[]>();

/** Задачи типа «1.2» из файла банка; файла ещё нет — пусто. */
export function zadachiTipa(tip: string): readonly ZadachaDannye[] {
  const got = cache.get(tip);
  if (got !== undefined) return got;
  const glava = tip.split('.')[0]!;
  const file = path.join(DATA, `glava-${glava}`, `tip-${tip}.json`);
  const list: ZadachaDannye[] = fs.existsSync(file)
    ? (JSON.parse(fs.readFileSync(file, 'utf8')) as ZadachaDannye[])
    : [];
  cache.set(tip, list);
  return list;
}

/** Все задачи главы в порядке типов. */
export function zadachiGlavy(glava: number): readonly ZadachaDannye[] {
  return (TIPY[glava] ?? []).flatMap((t) => zadachiTipa(t.id));
}

/** Формула отдельной строкой: дроби крупные. */
export function formulaHtml(tex: string): string {
  return typesetKrupno(`$\\displaystyle ${tex}$`);
}

/**
 * Выражение условия: все дроби — \dfrac. Иначе вложенная дробь
 * «многоэтажного» выражения набирается мелким кеглем, как индекс.
 */
export function formulaUsloviyaHtml(tex: string): string {
  return formulaHtml(tex.replace(/\\frac(?![a-zA-Z])/g, '\\dfrac'));
}

export function otvetTex(otvet: Otvet): string {
  return otvet.tex;
}

/**
 * Куски ответа для показа: соседние с одним и тем же выражением
 * сливаются в объединение — «$2-x$ при $x\in(-\infty;-2)\cup(-2;0)$».
 */
export function kuskiOtveta(otvet: Extract<Otvet, { vid: 'kusochnyi' }>): { tex: string; oblast: string }[] {
  const out: { tex: string; zapis: string; oblast: string[] }[] = [];
  for (const k of otvet.kuski) {
    const last = out[out.length - 1];
    if (last !== undefined && last.zapis === k.zapis) last.oblast.push(k.oblast.tex);
    else out.push({ tex: k.tex, zapis: k.zapis, oblast: [k.oblast.tex] });
  }
  return out.map((k) => ({ tex: k.tex, oblast: k.oblast.join('\\cup') }));
}

/** Ответ строкой, дроби крупные: в ответе $\\frac{a+7b}{ab}$ мелкая дробь не читается. */
function krupno(text: string): string {
  return typesetKrupno(text.replace(/\\frac(?![a-zA-Z])/g, '\\dfrac'));
}

export function otvetHtml(otvet: Otvet): string {
  if (otvet.vid === 'kusochnyi') {
    return kuskiOtveta(otvet)
      .map((k) => krupno(`$${k.tex}$ при $${otvet.peremennaya}\\in${k.oblast}$`))
      .join('; ');
  }
  if (otvet.vid === 'chisla') {
    return otvet.polya.map((p) => krupno(`$${p.podpis}=${p.tex}$`)).join(', ');
  }
  return krupno(`$${otvet.tex}$`);
}

/** Иррациональна ли запись верного числа: тогда десятичная дробь — не ответ. */
function irracionalnoe(zapis: string): boolean {
  return /sqrt|root|pi|\^\(?-?\d+\/\d+/.test(zapis);
}

/** Точки проверки: значение — отпечатком; точки на границе округления — прочь. */
function tochkiKlient(id: string, tochki: readonly Tochka[]): TochkaKlient[] {
  const out: TochkaKlient[] = [];
  for (const pt of tochki) {
    const { '=': v, ...vars } = pt;
    if (v === undefined || !ustoychivo(v)) continue;
    out.push({ ...vars, '#': otpechatokZnacheniya(v)! });
  }
  if (out.length < 4) throw new Error(`сборник ${id}: устойчивых точек проверки ${out.length} < 4`);
  return out;
}

/** Проверка ответа для браузера: только отпечатки. */
export function proverkaKlient(id: string, otvet: Otvet): ProverkaKlient {
  switch (otvet.vid) {
    case 'chislo':
      if (!ustoychivo(otvet.znachenie)) throw new Error(`сборник ${id}: ответ на границе округления`);
      return {
        vid: 'chislo',
        o: otpechatokZnacheniya(otvet.znachenie)!,
        irr: irracionalnoe(otvet.zapis),
        ...(otvet.forma === undefined ? {} : { forma: otvet.forma }),
      };
    case 'vyrazhenie':
      return {
        vid: 'vyrazhenie',
        peremennye: otvet.peremennye,
        tochki: tochkiKlient(id, otvet.tochki),
        ...(otvet.forma === undefined ? {} : { forma: otvet.forma }),
      };
    case 'kusochnyi': {
      const v = otvet.peremennaya;
      return {
        vid: 'kusochnyi',
        peremennaya: v,
        bukvy: [...new Set(otvet.kuski.flatMap((k) => k.peremennye))].filter((b) => b !== v),
        oblast: otpechatokStroki(
          strokaObedineniya(
            otvet.kuski.map((k) => ({
              lo: k.oblast.lo ?? -Infinity,
              hi: k.oblast.hi ?? Infinity,
              loZakr: k.oblast.loZakr,
              hiZakr: k.oblast.hiZakr,
            })),
          ),
        ),
        tochki: otvet.kuski.flatMap((k) => tochkiKlient(id, k.tochki)),
      };
    }
    case 'chisla':
      return {
        vid: 'chisla',
        polya: otvet.polya.map((p) => {
          if (!ustoychivo(p.znachenie)) throw new Error(`сборник ${id}: ответ на границе округления`);
          return { podpis: p.podpis, o: otpechatokZnacheniya(p.znachenie)!, irr: irracionalnoe(p.zapis) };
        }),
      };
  }
}

/** Решение и ответ задачи, набранные KaTeX, — то, что закрывается. */
export function otkrytoe(z: ZadachaDannye): Otkrytoe {
  return {
    otvetHtml: otvetHtml(z.otvet),
    otvetTex: z.otvet.tex,
    shagi: z.razbor.map((s) => ({
      chtoHtml: typeset(s.chto),
      formulaHtml: s.tex === undefined || s.tex === '' ? '' : formulaHtml(s.tex),
    })),
  };
}

/** Задача для браузера: тексты набраны, ответ — отпечатками, решение закрыто. */
export function vKlient(z: ZadachaDannye): ZadachaKlient {
  return {
    id: z.id,
    tip: z.tip,
    uroven: z.uroven,
    uslovieHtml: typeset(z.uslovie),
    ...(z.formula === undefined ? {} : { formulaHtml: formulaUsloviyaHtml(z.formula) }),
    ...(z.dopolnenie === undefined ? {} : { dopolnenieHtml: typeset(z.dopolnenie) }),
    podskazkiHtml: z.podskazki.map((p) => typeset(p)),
    proverka: proverkaKlient(z.id, z.otvet),
    zakryto: zakryt(JSON.stringify(otkrytoe(z)), z.id),
  };
}

/** Номер задачи для человека: «1.2.17». */
export function nomerZadachi(id: string): string {
  const [g, t, n] = id.split('.');
  return `${g}.${t}.${Number(n)}`;
}
