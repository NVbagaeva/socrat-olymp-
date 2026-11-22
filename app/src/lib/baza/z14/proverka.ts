/**
 * База, задание №14: независимый пересчёт ответа.
 *
 * Не пользуется ни деревом, ни шагами разбора (razbor.ts): запись TeX
 * переписывается в плоскую строку со скобками («\frac{a}{b}» →
 * «((a)/(b))», смешанное число «2\frac{1}{3}» → «(2+((1)/(3)))»),
 * а та считается сортировочной станцией (два стека — чисел и знаков)
 * в дробях из BigInt. Ответ переводится в запись бланка своим делением.
 */

interface B {
  p: bigint;
  q: bigint;
}

const abs = (x: bigint): bigint => (x < 0n ? -x : x);

function nodB(a: bigint, b: bigint): bigint {
  let [x, y] = [abs(a), abs(b)];
  while (y !== 0n) [x, y] = [y, x % y];
  return x;
}

function b(p: bigint, q: bigint): B {
  if (q === 0n) throw new Error('деление на ноль');
  const g = nodB(p, q);
  const s = q < 0n ? -1n : 1n;
  return { p: (s * p) / g, q: (s * q) / g };
}

/** Плоская запись: числа, + - * / ( ) и «~» — унарный минус. */
function ploskaya(texZapis: string): string[] {
  const src = texZapis.replace(/\\left|\\right|\s+/g, '').replace(/\\cdot/g, '*');
  const out: string[] = [];
  /* Что закрыть, когда закроется фигурная скобка. */
  const figurnye: ('chislitel' | 'znamenatel' | 'znamenatelSmesh')[] = [];
  let smeshDalee = false;
  let i = 0;
  while (i < src.length) {
    const rest = src.slice(i);
    const chislo = /^\d+(,\d+)?/.exec(rest);
    if (chislo !== null) {
      i += chislo[0].length;
      const smesh = !chislo[0].includes(',') && src.startsWith('\\frac', i);
      if (smesh) {
        out.push('(', chislo[0], '+');
        smeshDalee = true;
      } else {
        out.push(chislo[0]);
      }
      continue;
    }
    if (rest.startsWith('\\frac{')) {
      out.push('(', '(');
      figurnye.push('chislitel');
      i += 6;
      continue;
    }
    const ch = rest[0] ?? '';
    i += 1;
    if (ch === '}') {
      const chto = figurnye.pop();
      if (chto === 'chislitel') {
        if (src[i] !== '{') throw new Error('нет знаменателя');
        i += 1;
        out.push(')', '/', '(');
        figurnye.push(smeshDalee ? 'znamenatelSmesh' : 'znamenatel');
        smeshDalee = false;
      } else if (chto === 'znamenatel') {
        out.push(')', ')');
      } else if (chto === 'znamenatelSmesh') {
        out.push(')', ')', ')');
      } else {
        throw new Error('лишняя скобка');
      }
    } else if (ch === ':') {
      out.push('/');
    } else if (ch === '-') {
      const pred = out[out.length - 1];
      const unarnyy = pred === undefined || pred === '(' || '+-*/~'.includes(pred);
      out.push(unarnyy ? '~' : '-');
    } else if ('+*()'.includes(ch)) {
      out.push(ch);
    } else {
      throw new Error(`знак «${ch}»`);
    }
  }
  if (figurnye.length > 0) throw new Error('не закрыта дробь');
  return out;
}

const PRIORITET: Record<string, number> = { '+': 1, '-': 1, '*': 2, '/': 2, '~': 3 };

/** Значение выражения — сортировочной станцией. */
export function znachenieB(texZapis: string): B {
  const chisla: B[] = [];
  const znaki: string[] = [];
  const primenit = (): void => {
    const z = znaki.pop();
    if (z === '~') {
      const x = chisla.pop();
      if (x === undefined) throw new Error('минус без числа');
      chisla.push({ p: -x.p, q: x.q });
      return;
    }
    const r = chisla.pop();
    const l = chisla.pop();
    if (l === undefined || r === undefined || z === undefined) throw new Error('не хватает чисел');
    if (z === '+') chisla.push(b(l.p * r.q + r.p * l.q, l.q * r.q));
    else if (z === '-') chisla.push(b(l.p * r.q - r.p * l.q, l.q * r.q));
    else if (z === '*') chisla.push(b(l.p * r.p, l.q * r.q));
    else chisla.push(b(l.p * r.q, l.q * r.p));
  };
  for (const t of ploskaya(texZapis)) {
    if (/^\d/.test(t)) {
      const [c = '0', d = ''] = t.split(',');
      chisla.push(b(BigInt(c + d), 10n ** BigInt(d.length)));
    } else if (t === '(') {
      znaki.push(t);
    } else if (t === ')') {
      while (znaki[znaki.length - 1] !== '(') primenit();
      znaki.pop();
    } else if (t === '~') {
      znaki.push(t);
    } else {
      const pr = PRIORITET[t] ?? 0;
      while (znaki.length > 0) {
        const verh = znaki[znaki.length - 1] ?? '(';
        if (verh === '(' || (PRIORITET[verh] ?? 0) < pr) break;
        primenit();
      }
      znaki.push(t);
    }
  }
  while (znaki.length > 0) primenit();
  const x = chisla.pop();
  if (x === undefined || chisla.length > 0) throw new Error('выражение не сошлось');
  return x;
}

/** Запись бланка: делим уголком, пока не кончится остаток. */
export function zapisB(x: B): string {
  let ost = abs(x.p);
  const tseloe = ost / x.q;
  ost %= x.q;
  let cifry = '';
  while (ost !== 0n) {
    if (cifry.length > 20) throw new Error('бесконечная дробь');
    ost *= 10n;
    cifry += String(ost / x.q);
    ost %= x.q;
  }
  return `${x.p < 0n ? '−' : ''}${tseloe}${cifry === '' ? '' : `,${cifry}`}`;
}

export function proveritVyrazhenie(texZapis: string): string {
  return zapisB(znachenieB(texZapis));
}
