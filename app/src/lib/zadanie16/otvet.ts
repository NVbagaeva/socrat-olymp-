/**
 * Ответ неравенства задания №16 — множество на числовой прямой:
 * объединение промежутков и отдельных точек.
 *
 * Одна и та же запись разбирается и у ответа из данных (TeX:
 * «(-\infty;\,-3]\cup(2;\,5)»), и у ответа ученика («(-беск; -3] U
 * (2; 5)»). Оба приводятся к одному виду — промежутки по порядку,
 * соседние склеены, — и сравниваются числами с допуском: так
 * «[1;2]∪(2;3)» и «[1;3)» — один ответ, а «0,5» и «1/2» — одно число.
 *
 * Числа: целые, десятичные (через запятую или точку), дроби a/b и
 * \frac{a}{b}, корни √n, sqrt(n), \sqrt{n} с множителем перед ними.
 * Логарифмы появятся вместе с главами про них.
 */

/** Промежуток: концы и включены ли они. Точка — промежуток [a; a]. */
export interface Promezhutok16 {
  ot: number;
  do: number;
  /** Левый конец входит в ответ (квадратная скобка). */
  otVkl: boolean;
  /** Правый конец входит в ответ. */
  doVkl: boolean;
}

/** Множество — промежутки по возрастанию, без пересечений и стыков. */
export type Mnozhestvo16 = Promezhutok16[];

export type Razbor16 = { ok: true; mnozhestvo: Mnozhestvo16 } | { ok: false; oshibka: string };

/** Числа считаются равными, если ближе этого. */
const DOPUSK = 1e-9;

/* Сравниваются записи без пробелов: «нет решений» → «нетрешений». */
const PUSTO = /^(?:∅|\{\}|\\varnothing|\\emptyset|нетрешений|решенийнет|пустоемножество|нет)$/i;
const VSE = /^(?:r|ℝ|\\mathbb\{?r\}?|\(-∞;\+?∞\)|x∈r|x∈ℝ|любоечисло|всечисла)$/i;

/** Запись к одному виду: TeX-команды — в знаки, пробелы долой. */
function privesti(zapis: string): string {
  return (
    zapis
      .replace(/\\left|\\right|\\[,;:! ]|\\quad|\\qquad/g, '')
      /* Десятичная запятая TeX: 1{,}5. */
      .replace(/\{,\}/g, ',')
      .replace(/\\infty|\\infin|беск(?:онечность)?|inf(?:inity)?/gi, '∞')
      .replace(/\\cup|\\bigcup/g, '∪')
      .replace(/\\in\b/g, '∈')
      .replace(/\\\{/g, '{')
      .replace(/\\\}/g, '}')
      .replace(/[−–—]/g, '-')
      .replace(/\s+/g, '')
      /* «x ∈ …» в №16, «a ∈ …», «k ∈ …» — у параметров №19. */
      .replace(/^[a-z]∈/i, '')
  );
}

/**
 * Число из записи: «-3», «2,5», «7/2», «\frac{7}{2}», «2√3», «-sqrt(5)».
 * Не число — null.
 */
export function chislo16(zapis: string): number | null {
  let s = zapis.replace(/\s+/g, '').replace(/[−–—]/g, '-');
  if (s === '') {
    return null;
  }
  if (/^[+-]?∞$/.test(s)) {
    return s.startsWith('-') ? -Infinity : Infinity;
  }
  let znak = 1;
  if (s.startsWith('-')) {
    znak = -1;
    s = s.slice(1);
  } else if (s.startsWith('+')) {
    s = s.slice(1);
  }
  /* Короткие записи KaTeX: \frac15, \frac9{16} — к виду \frac{1}{5}. */
  s = s.replace(/^(\\[dt]?frac)(\d)/, '$1{$2}').replace(/^(\\[dt]?frac\{[^{}]+\})(\d)$/, '$1{$2}');
  const frac = /^\\[dt]?frac\{([^{}]+)\}\{([^{}]+)\}$/.exec(s);
  if (frac) {
    const a = chislo16(frac[1] ?? '');
    const b = chislo16(frac[2] ?? '');
    return a === null || b === null || b === 0 ? null : (znak * a) / b;
  }
  /* Дробь a/b: делим по последней черте, у каждой части — свой разбор. */
  const cherta = s.lastIndexOf('/');
  if (cherta > 0) {
    const a = chislo16(s.slice(0, cherta));
    const b = chislo16(s.slice(cherta + 1));
    return a === null || b === null || b === 0 ? null : (znak * a) / b;
  }
  const koren = /^(\d+(?:[.,]\d+)?)?(?:√|\\sqrt|sqrt)[{(]?(\d+(?:[.,]\d+)?)[})]?$/.exec(s);
  if (koren) {
    const mnozhitel = koren[1] === undefined ? 1 : Number(koren[1].replace(',', '.'));
    return znak * mnozhitel * Math.sqrt(Number((koren[2] ?? '').replace(',', '.')));
  }
  if (/^\d+(?:[.,]\d+)?$/.test(s)) {
    return znak * Number(s.replace(',', '.'));
  }
  return null;
}

/**
 * Концы внутри скобок. Разделитель — точка с запятой; если её нет,
 * запятая (тогда дробные числа пишутся через точку).
 */
function chasti(vnutri: string): string[] {
  if (vnutri.includes(';')) {
    return vnutri.split(';');
  }
  return vnutri.split(',');
}

/** Разбор записи ответа. Ошибка — короткая подсказка ученику. */
export function razobrat16(zapis: string): Razbor16 {
  const s = privesti(zapis);
  if (s === '') {
    return { ok: false, oshibka: 'Введите ответ.' };
  }
  if (PUSTO.test(s)) {
    return { ok: true, mnozhestvo: [] };
  }
  if (VSE.test(s)) {
    return {
      ok: true,
      mnozhestvo: [{ ot: -Infinity, do: Infinity, otVkl: false, doVkl: false }],
    };
  }
  /* Отдельные точки без скобок: «1; 4». */
  const bezSkobok = /^[^()[\]{}]+;[^()[\]{}]+$/.test(s) && !/[∪Uu]/.test(s);
  const kuski = (bezSkobok ? `{${s}}` : s).split(/∪|[Uu]/).filter((k) => k !== '');
  const out: Promezhutok16[] = [];
  for (const kusok of kuski) {
    const tochki = /^\{(.+)\}$/.exec(kusok);
    if (tochki) {
      for (const t of chasti(tochki[1] ?? '')) {
        const x = chislo16(t);
        if (x === null || !Number.isFinite(x)) {
          return { ok: false, oshibka: `Не понял число «${t}».` };
        }
        out.push({ ot: x, do: x, otVkl: true, doVkl: true });
      }
      continue;
    }
    const m = /^([[(])(.+)([\])])$/.exec(kusok);
    if (!m) {
      const x = chislo16(kusok);
      if (x !== null && Number.isFinite(x)) {
        out.push({ ot: x, do: x, otVkl: true, doVkl: true });
        continue;
      }
      return {
        ok: false,
        oshibka: 'Запишите ответ промежутками: концы — через «;», объединение — знаком «∪».',
      };
    }
    const koncy = chasti(m[2] ?? '');
    const [a, b] = koncy;
    if (a === undefined || b === undefined || koncy.length !== 2) {
      return { ok: false, oshibka: `В промежутке «${kusok}» нужны два конца через «;».` };
    }
    const ot = chislo16(a);
    const do_ = chislo16(b);
    if (ot === null || do_ === null) {
      return { ok: false, oshibka: `Не понял концы промежутка «${kusok}».` };
    }
    const otVkl = m[1] === '[';
    const doVkl = m[3] === ']';
    if ((otVkl && !Number.isFinite(ot)) || (doVkl && !Number.isFinite(do_))) {
      return { ok: false, oshibka: 'Бесконечность всегда берётся в круглую скобку.' };
    }
    if (ot > do_ || (ot === do_ && !(otVkl && doVkl))) {
      return { ok: false, oshibka: `В промежутке «${kusok}» левый конец больше правого.` };
    }
    out.push({ ot, do: do_, otVkl, doVkl });
  }
  return { ok: true, mnozhestvo: normalizovat16(out) };
}

const blizko = (a: number, b: number) =>
  a === b || (Number.isFinite(a) && Number.isFinite(b) && Math.abs(a - b) < DOPUSK);

/** Промежутки по порядку; пересекающиеся и стыкующиеся склеены. */
export function normalizovat16(mn: readonly Promezhutok16[]): Mnozhestvo16 {
  const sorted = [...mn].sort((p, q) => p.ot - q.ot || Number(q.otVkl) - Number(p.otVkl));
  const out: Promezhutok16[] = [];
  for (const p of sorted) {
    const last = out[out.length - 1];
    /* Склеиваем, если перекрываются или стыкуются хотя бы одной
       включённой точкой: [1;2]∪(2;3) = [1;3), а (1;2)∪(2;3) — нет. */
    if (
      last !== undefined &&
      (p.ot < last.do - DOPUSK || (blizko(p.ot, last.do) && (p.otVkl || last.doVkl)))
    ) {
      if (p.do > last.do + DOPUSK) {
        last.do = p.do;
        last.doVkl = p.doVkl;
      } else if (blizko(p.do, last.do)) {
        last.doVkl = last.doVkl || p.doVkl;
      }
      continue;
    }
    out.push({ ...p });
  }
  return out;
}

/** Одно ли это множество. */
export function ravny16(a: Mnozhestvo16, b: Mnozhestvo16): boolean {
  return (
    a.length === b.length &&
    a.every((p, i) => {
      const q = b[i];
      return (
        q !== undefined &&
        blizko(p.ot, q.ot) &&
        blizko(p.do, q.do) &&
        p.otVkl === q.otVkl &&
        p.doVkl === q.doVkl
      );
    })
  );
}

/** Пересечение двух множеств — решение системы из двух условий. */
export function peresechenie16(a: Mnozhestvo16, b: Mnozhestvo16): Mnozhestvo16 {
  const out: Promezhutok16[] = [];
  for (const p of a) {
    for (const q of b) {
      const ot = Math.max(p.ot, q.ot);
      const do_ = Math.min(p.do, q.do);
      const otVkl = blizko(p.ot, q.ot) ? p.otVkl && q.otVkl : p.ot > q.ot ? p.otVkl : q.otVkl;
      const doVkl = blizko(p.do, q.do) ? p.doVkl && q.doVkl : p.do < q.do ? p.doVkl : q.doVkl;
      if (ot < do_ - DOPUSK || (blizko(ot, do_) && otVkl && doVkl)) {
        out.push({ ot, do: do_, otVkl, doVkl });
      }
    }
  }
  return normalizovat16(out);
}

export type Proverka16 = 'verno' | 'neverno' | { oshibka: string };

/** Проверка ответа ученика по ответу из данных (TeX). */
export function proverit16(otvetUchenika: string, etalon: string): Proverka16 {
  const e = razobrat16(etalon);
  if (!e.ok) {
    throw new Error(`Ответ в данных не разбирается: ${etalon} — ${e.oshibka}`);
  }
  const u = razobrat16(otvetUchenika);
  if (!u.ok) {
    return { oshibka: u.oshibka };
  }
  return ravny16(u.mnozhestvo, e.mnozhestvo) ? 'verno' : 'neverno';
}
