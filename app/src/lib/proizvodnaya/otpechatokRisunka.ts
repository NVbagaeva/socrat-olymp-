/**
 * Отпечаток рисунка задания №9: по нему банк и автотест узнают
 * повтор. Повтор — тот же рисунок с точностью до сдвига (по x и по y)
 * и отражения (слева направо, сверху вниз): узлы кривой, отмеченные
 * точки, отрезок, касательная и закраска переводятся одним и тем же
 * преобразованием, из четырёх вариантов отражения берётся наименьшая
 * запись.
 *
 * Класс формы — грубое описание кривой: что нарисовано, сколько
 * экстремумов (нулей у графика f′), куда кривая идёт в начале и какой
 * у неё «ритм» — расстояния между экстремумами. По нему видно, что
 * двадцать задач прототипа не одна и та же волна в разных вариациях.
 */

import { ekstremumyUzlov, nuliUzlov } from './chtenie';
import type { Figura, Generated, Zapros } from './types';

type T = (x: number, y: number) => [number, number];

function zapis(fig: Figura, zapros: Zapros | null, sx: 1 | -1, sy: 1 | -1): string {
  const xs = fig.uzly.map((u) => u.x * sx);
  const x0 = Math.min(...xs);
  const first = fig.uzly[sx === 1 ? 0 : fig.uzly.length - 1];
  const y0 = first === undefined ? 0 : first.y * sy;
  const t: T = (x, y) => [x * sx - x0, y * sy - y0];
  const tx = (x: number) => x * sx - x0;
  /* Заданный наклон в узле (парабола, касательная) — часть формы: при
     отражении по одной оси он меняет знак, по обеим — нет. */
  const uzly = fig.uzly
    .map((u) => {
      const [x, y] = t(u.x, u.y);
      return { x, y, m: u.m === undefined ? '' : `:${Math.round(u.m * sx * sy * 1000) / 1000}` };
    })
    .sort((a, b) => a.x - b.x)
    .map((u) => `${u.x}:${u.y}${u.m}`)
    .join(',');
  const metki = (fig.metki ?? [])
    .map(tx)
    .sort((a, b) => a - b)
    .join(',');
  const otrezok =
    zapros?.p !== undefined && zapros.q !== undefined
      ? [tx(zapros.p), tx(zapros.q)].sort((a, b) => a - b).join('..')
      : '';
  const kas =
    fig.kasatelnaya === undefined
      ? ''
      : [t(...fig.kasatelnaya.a), t(...fig.kasatelnaya.b)]
          .sort((a, b) => a[0] - b[0])
          .map(([x, y]) => `${x}:${y}`)
          .join('/');
  const zal =
    fig.zalivka === undefined
      ? ''
      : [tx(fig.zalivka.a), tx(fig.zalivka.b)].sort((a, b) => a - b).join('..');
  return `${fig.rezhim}|${uzly}|m${metki}|o${otrezok}|k${kas}|z${zal}`;
}

/** Отпечаток рисунка: одинаков у рисунков, совпадающих после сдвига и отражения. */
export function otpechatokRisunka(fig: Figura, zapros: Zapros | null): string {
  const out: string[] = [];
  for (const sx of [1, -1] as const) {
    for (const sy of [1, -1] as const) {
      out.push(zapis(fig, zapros, sx, sy));
    }
  }
  return out.sort()[0] as string;
}

/** Отпечаток задачи: рисунок, а у задач без рисунка — подпись параметров. */
export function otpechatokZadachi(t: Generated): string {
  return t.risunok === null ? `bez-risunka|${t.signature}` : otpechatokRisunka(t.risunok, t.zapros);
}

/** Класс формы кривой: число экстремумов (нулей f′), начальное направление, ритм. */
export function klassFormy(fig: Figura | null): string {
  if (fig === null) {
    return 'bez-risunka';
  }
  if (fig.rezhim === 'lomanaya' || fig.rezhim === 'zalivka' || fig.rezhim === 'pryamaya') {
    return `${fig.rezhim}|${fig.uzly.length}`;
  }
  const opornye =
    fig.rezhim === 'fprime'
      ? nuliUzlov(fig.uzly).map((z) => z.x)
      : ekstremumyUzlov(fig.uzly).map((e) => e.x);
  const a = fig.uzly[0];
  const b = fig.uzly[1];
  const start = a === undefined || b === undefined ? 0 : Math.sign(b.y - a.y);
  /* Ритм: расстояния между соседними опорными точками, грубо — «тесно» (2–3) или «широко» (4+). */
  const ritm = opornye
    .slice(1)
    .map((x, i) => (x - (opornye[i] as number) <= 3 ? 't' : 'w'))
    .join('');
  return `${fig.rezhim}|${opornye.length}|${start > 0 ? 'up' : 'down'}|${ritm}`;
}

/** Часть адреса галереи прототипа: точки в коде заменены дефисами (9.2.1 → 9-2-1). */
export function slugPrototipa(id: string): string {
  return id.replace(/\./g, '-');
}
