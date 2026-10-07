/**
 * HTML блоков разбора — один рендер для тренажёра, опорных задач,
 * листа учителя (печать, PDF), рамок «Разбор задачи» генератора и
 * служебной страницы проверки аналогов.
 *
 * Сворачиваемые блоки — <details>: без JavaScript, клавиатура и
 * экранный диктор работают сами. Где их раскрыть, решает место вывода
 * (Kontekst): на сайте правило пропорции раскрыто в первой задаче и
 * свёрнуто дальше; в печати сворачивать нельзя — первый раз блок
 * печатается целиком, дальше — строкой-ссылкой.
 */

import { LOVUSHKI } from '@/content/teoriya11';
import { type Blok, type Yach, izStroki } from './bloki';

export interface Kontekst {
  typeset: (text: string) => string;
  /** Печать: без <details>, повтор — строкой-ссылкой. */
  pechat?: boolean;
  /**
   * Счётчик уже показанных сворачиваемых блоков на листе/странице:
   * правило и признаки целиком — только первый раз.
   */
  pokazano?: { pravilo: boolean; priznaki: boolean };
  /** Раскрыть правило пропорции (первая задача тренировки). */
  praviloOtkryto?: boolean;
}

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** Клетка краткой записи: число, «?» (цветом) или x (с заменой). */
function yachHtml(y: Yach, k: Kontekst, zamena: boolean): string {
  const ed = y.pct
    ? '<span class="prc-pct">%</span>'
    : y.ed
      ? `<span class="prc-ed">(${esc(y.ed)})</span>`
      : '';
  if (y.neizv === '?') {
    return `<span class="prc-q">?</span>${ed}`;
  }
  if (y.neizv) {
    const x = k.typeset(`$${y.neizv}$`);
    // На сайте «?» уплывает, на его место встаёт x; в печати — только x.
    return `<span class="prc-x${zamena ? ' prc-x--zamena' : ''}"><span class="prc-x__q" aria-hidden="true">?</span><span class="prc-x__v">${x}</span></span>${ed}`;
  }
  return `<span class="prc-num">${k.typeset(`$${y.tex}$`)}</span>${ed}`;
}

/** Цвета членов пропорции: крайние — синие, средние — оранжевые. */
const KRAY = '\\color{#1f5fd0}';
const SRED = '\\color{#c75f12}';

function drobHtml(top: string, bottom: string, k: Kontekst, podpis?: string): string {
  return `<span class="prc-drob">${k.typeset(`$\\dfrac{${top}}{${bottom}}$`)}${podpis ? `<span class="prc-drob__podpis">${esc(podpis)}</span>` : ''}</span>`;
}

/** Пропорция «крест-накрест»: стрелки поверх двух дробей (SVG). */
function krestHtml(a: string, b: string, c: string, d: string, k: Kontekst): string {
  const t = (s: string) => k.typeset(`$${s}$`);
  return `<div class="prc-krest" role="img" aria-label="Крайние члены умножаются друг на друга, средние — друг на друга">
<span class="prc-krest__a prc-kray">${t(a)}</span><span class="prc-krest__c prc-sred">${t(c)}</span>
<span class="prc-krest__l1"></span><span class="prc-krest__eq">${t('=')}</span><span class="prc-krest__l2"></span>
<span class="prc-krest__b prc-sred">${t(b)}</span><span class="prc-krest__d prc-kray">${t(d)}</span>
<svg class="prc-krest__svg" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><line x1="22" y1="26" x2="78" y2="74" class="prc-krest__kray"/><line x1="22" y1="74" x2="78" y2="26" class="prc-krest__sred"/></svg>
</div>`;
}

function praviloTelo(b: Extract<Blok, { vid: 'pravilo' }>, k: Kontekst): string {
  const t = (s: string) => k.typeset(s);
  const cv = (m: 'a' | 'b' | 'c' | 'd', s: string) =>
    `${m === 'a' || m === 'd' ? KRAY : SRED}{${s}}`;
  const kr = (m: 'a' | 'b' | 'c' | 'd') => (m === 'a' || m === 'd' ? 'крайний' : 'средний');
  return `<div class="prc-pravilo__telo">
<p>${t('**Пропорция** — равенство двух отношений:')}</p>
<div class="prc-pravilo__zapisi">
<span>${t(`$\\dfrac{${KRAY}{a}}{${SRED}{b}}=\\dfrac{${SRED}{c}}{${KRAY}{d}}$`)}</span>
<span class="prc-pravilo__ili">или</span>
<span>${t(`$${KRAY}{a}:${SRED}{b}=${SRED}{c}:${KRAY}{d}$`)}</span>
</div>
<p class="prc-pravilo__legenda"><span class="prc-kray">крайние</span> — ${t('$a$ и $d$')} (стоят «по краям»), <span class="prc-sred">средние</span> — ${t('$b$ и $c$')} (стоят «в середине»).</p>
<p>${t('**Основное свойство:** произведение крайних равно произведению средних — умножаем «крест-накрест».')}</p>
${krestHtml('a', 'b', 'c', 'd', k)}
<p class="prc-pravilo__formula">${t(`$${KRAY}{a}\\cdot${KRAY}{d}=${SRED}{b}\\cdot${SRED}{c}$`)}</p>
<ul class="prc-pravilo__kak">
<li>${t('**Неизвестный крайний** = произведение средних : известный крайний.')}</li>
<li>${t('**Неизвестный средний** = произведение крайних : известный средний.')}</li>
</ul>
<p class="prc-pravilo__nash">${t(`В нашей пропорции $\\dfrac{${cv('a', b.a)}}{${cv('b', b.b)}}=\\dfrac{${cv('c', b.c)}}{${cv('d', b.d)}}$ крайние — $${b.a}$ и $${b.d}$, средние — $${b.b}$ и $${b.c}$. Неизвестное $${b[b.neizv]}$ — ${kr(b.neizv)} член.`)}</p>
</div>`;
}

const PRIZNAKI: [string, string][] = [
  ['на $2$', 'последняя цифра чётная: $3\\,48\\underline{6}$'],
  ['на $3$', 'сумма цифр делится на $3$: $41\\,760$ → $4+1+7+6+0=18$'],
  ['на $4$', 'две последние цифры — число, делящееся на $4$: $7\\,3\\underline{16}$'],
  ['на $5$', 'оканчивается на $0$ или $5$: $1\\,24\\underline{5}$'],
  ['на $9$', 'сумма цифр делится на $9$: $5\\,814$ → $5+8+1+4=18$'],
  ['на $10$', 'оканчивается нулём: $2\\,73\\underline{0}$'],
  ['на $25$', 'оканчивается на $00$, $25$, $50$ или $75$: $3\\,4\\underline{75}$'],
];

function priznakiTelo(k: Kontekst): string {
  return `<ul class="prc-priznaki__list">${PRIZNAKI.map(([na, kak]) => `<li><b>${k.typeset(na)}</b> — ${k.typeset(kak)}</li>`).join('')}</ul>
<p class="prc-priznaki__sovet">${k.typeset('**Совет:** сначала разложи знаменатель на множители и проверь, на что делится числитель.')}</p>`;
}

/** Сворачиваемый блок: на сайте <details>, в печати — целиком или ссылкой. */
function svorach(
  cls: string,
  zagolovok: string,
  zagolovokSvernut: string,
  telo: () => string,
  open: boolean,
  k: Kontekst,
  kluch: 'pravilo' | 'priznaki',
): string {
  if (k.pechat) {
    if (k.pokazano?.[kluch]) {
      return `<p class="${cls} ${cls}--ssylka">${esc(zagolovok)} — см. первый разбор листа.</p>`;
    }
    if (k.pokazano) k.pokazano[kluch] = true;
    return `<div class="${cls} is-print"><p class="${cls}__summary">${esc(zagolovok)}</p>${telo()}</div>`;
  }
  return `<details class="${cls}"${open ? ' open' : ''}><summary><span class="${cls}__open">${esc(zagolovok)}</span><span class="${cls}__closed">${esc(zagolovokSvernut)}</span></summary>${telo()}</details>`;
}

export function blokHtml(b: Blok, k: Kontekst): string {
  switch (b.vid) {
    case 'zapis': {
      // В печати и на листах анимации нет: x стоит сразу.
      const zamena = b.zamena === true && k.pechat !== true;
      return `<div class="prc-zapis${zamena ? ' prc-zapis--zamena' : ''}">${b.stroki
        .map(
          (s) =>
            `<span class="prc-zapis__l">${yachHtml(s.l, k, zamena)}</span><span class="prc-zapis__t">—</span><span class="prc-zapis__r">${yachHtml(s.r, k, zamena)}${s.note ? ` <span class="prc-zapis__note">${k.typeset(s.note)}</span>` : ''}</span>`,
        )
        .join('')}</div>`;
    }
    case 'proporciya': {
      const mark = (m: 'a' | 'b' | 'c' | 'd', s: string) =>
        b.neizv === m ? `\\color{#c75f12}{${s}}` : s;
      return `<div class="prc-prop">${drobHtml(mark('a', b.a), mark('b', b.b), k, b.podpisi?.[0])}<span class="prc-prop__eq">${k.typeset('$=$')}</span>${drobHtml(mark('c', b.c), mark('d', b.d), k, b.podpisi?.[1])}</div>`;
    }
    case 'pravilo':
      return svorach(
        'prc-pravilo',
        'Правило: как найти неизвестный член пропорции',
        'Напомнить правило пропорции',
        () => praviloTelo(b, k),
        k.praviloOtkryto === true,
        k,
        'pravilo',
      );
    case 'sokr': {
      // Разложение знаменателя — вступление, не шаг: шаги — сокращения.
      const [first, ...rest] = b.shagi;
      const vvod = first !== undefined && first.na === 1 && first.tex === '' ? first : null;
      const shagi = vvod === null ? b.shagi : rest;
      return `${vvod === null ? '' : `<p class="prc-sokr__vvod">${k.typeset(vvod.tekst)}</p>`}<ol class="prc-sokr">${shagi
        .map(
          (s) =>
            `<li><p class="prc-sokr__t">${k.typeset(s.tekst)}</p>${s.tex ? `<p class="prc-sokr__f">${k.typeset(`$${s.tex}$`)}</p>` : ''}</li>`,
        )
        .join('')}</ol>`;
    }
    case 'priznaki':
      return svorach(
        'prc-priznaki',
        'Признаки делимости',
        'Признаки делимости',
        () => priznakiTelo(k),
        false,
        k,
        'priznaki',
      );
    case 'plashka':
      return `<div class="prc-plashka">${k.typeset(b.tekst)}</div>`;
    case 'spravka100': {
      const l = LOVUSHKI.sto;
      const telo = `<span class="prc-spravka__telo"><b>${k.typeset(l?.title ?? '')}</b> ${k.typeset('Сравниваем всегда с чем-то: за $100\\,\\%$ берём то, **с чем сравниваем**, — величину после слов «чем» и «от».')} ${k.typeset(l?.text ?? '')}</span>`;
      if (k.pechat) {
        return '';
      }
      return `<details class="prc-spravka"><summary>Правило 100 %</summary>${telo}</details>`;
    }
  }
}

/** Строка разбора: блок — его HTML, обычная строка — формулы KaTeX. */
export function strokaHtml(line: string, k: Kontekst): string {
  const b = izStroki(line);
  return b === null ? k.typeset(line) : blokHtml(b, k);
}

/** Есть ли в строке блок (для разметки: блоку нужен div, а не p). */
export const etoBlok = (line: string): boolean => izStroki(line) !== null;
