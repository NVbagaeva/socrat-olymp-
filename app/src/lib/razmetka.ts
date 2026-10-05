/**
 * Разметка строки текста: обычный текст, формулы и выделение.
 *
 * Один разбор на весь сайт. Строки контента пишутся так:
 *   $…$     — формула TeX, её набирает KaTeX;
 *   **…**   — полужирное выделение автора.
 *
 * Выделение может содержать формулы: «идёт **от конца $\vec{b}$ к
 * концу $\vec{a}$**». Раньше каждый компонент разбирал строку своим
 * регулярным выражением, и жирный оборот съедал формулу целиком —
 * на странице оставались «$\vec{b}$». Здесь формула распознаётся
 * первой и никогда не дробится, а звёздочки только переключают
 * признак «полужирное» у соседних кусков.
 *
 * Модуль без KaTeX и без React: его берут и набор на сервере
 * (lib/tex.ts), и клиентские экраны, и разбор теории (Phrases).
 */

export interface Kusok {
  text: string;
  /** Формула TeX без долларов. */
  math?: boolean;
  /** Внутри **…**. */
  strong?: boolean;
}

/** Строка → куски по порядку. Соседний обычный текст склеивается. */
export function razmetka(text: string): Kusok[] {
  const out: Kusok[] = [];
  let strong = false;
  let plain = '';

  function flush(): void {
    if (plain !== '') {
      out.push(strong ? { text: plain, strong: true } : { text: plain });
      plain = '';
    }
  }

  let i = 0;
  while (i < text.length) {
    const ch = text[i] as string;
    if (ch === '$') {
      const end = text.indexOf('$', i + 1);
      /* Непарный доллар — обычный знак: его поймает проверка сайта. */
      if (end > i + 1) {
        flush();
        const tex = text.slice(i + 1, end);
        out.push(strong ? { text: tex, math: true, strong: true } : { text: tex, math: true });
        i = end + 1;
        continue;
      }
    }
    if (ch === '*' && text[i + 1] === '*') {
      flush();
      strong = !strong;
      i += 2;
      continue;
    }
    plain += ch;
    i += 1;
  }
  flush();
  return out;
}

/** Есть ли в строке разметка: формулы или выделение. */
export function estRazmetka(text: string): boolean {
  return /\$[^$]+\$|\*\*/.test(text);
}
