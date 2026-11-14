import { typeset } from '@/lib/tex';
import type { Shag as ShagRazbora, Vopros } from '@/lib/proizvodnaya/types';
import type { Shag } from '../steklo';
import type { VoprosPodskazki } from '../trening/PodskazkaVoprosy';

/** Последний шаг разбора генератора — «Ответ»: на карте ответ стоит своей строкой. */
const OTVET = 'Ответ';

/** Строка шага из одной формулы — «$…$» целиком: показывается выносной. */
function odnaFormula(line: string): string | null {
  const m = /^\$([^$]+)\$$/.exec(line.trim());
  return m === null ? null : (m[1] as string);
}

/** Строки шага → HTML: формула строкой — выносная, остальное — абзацами. */
function strokiHtml(stroki: readonly string[]): string {
  return stroki
    .map((line) => {
      const tex = odnaFormula(line);
      return tex === null
        ? `<p>${typeset(line)}</p>`
        : `<div class="z9-vykladka">${typeset(`$\\displaystyle ${tex}$`)}</div>`;
    })
    .join('');
}

/**
 * Разбор генератора №9 → шаги «Стеклянной сцены». Названия и строки —
 * дословно из генератора, набраны KaTeX. Работает и на сборке, и в
 * браузере.
 */
export function shagiIz9(shagi: readonly ShagRazbora[], { bezOtveta = false } = {}): Shag[] {
  return shagi
    .filter((s) => !(bezOtveta && s.zagolovok === OTVET))
    .map((s) => ({
      zagolovok: s.zagolovok.replace(/\$/g, ''),
      ...(s.zagolovok.includes('$') ? { zagolovokHtml: typeset(s.zagolovok) } : {}),
      chtoHtml: strokiHtml(s.stroki),
      formulaHtml: '',
    }));
}

/** Ответ разбора: «**Ответ: -0,5**» → «−0,5». */
export function otvet9(shagi: readonly ShagRazbora[]): string {
  const stroka = shagi.find((s) => s.zagolovok === OTVET)?.stroki.at(-1) ?? '';
  return stroka
    .replace(/\*\*/g, '')
    .replace(/^Ответ:\s*/, '')
    .trim()
    .replace(/^-/, '−');
}

/** Лесенка вопросов генератора → подсказка-вопросы общего тренажёра (пояснения неверных кнопок — тоже). */
export function voprosy9(podskazka: readonly Vopros[]): VoprosPodskazki[] {
  return podskazka.map((v) => ({
    voprosHtml: typeset(v.vopros),
    variantyHtml: v.knopki.map((k) => typeset(k.tekst)),
    verno: Math.max(
      0,
      v.knopki.findIndex((k) => k.verno),
    ),
    ...(v.itog === undefined || v.itog === '' ? {} : { kommentariyHtml: typeset(v.itog) }),
    pochemuHtml: v.knopki.map((k) => (k.pochemu === undefined ? '' : typeset(k.pochemu))),
  }));
}
