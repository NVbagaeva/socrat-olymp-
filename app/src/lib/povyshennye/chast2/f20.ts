/**
 * №20 (варианты 11–12): коллекцию раскладывают в одинаковые большие
 * альбомы (k штук, e мест пустые) или в маленькие (k + d штук, тоже e
 * пустых мест). Вместимость большого B ∈ (B₀; B₁), маленького s ∈ (s₀; s₁).
 *
 * N = kB − e = (k + d)s − e ⇒ k(B − s) = d·s, k = ds/(B − s).
 * Оценка k по границам, затем перебор k: B = s(k + d)/k — целое в
 * границах. а) возможно ли k = k₀; б), в) наименьшее и наибольшее N.
 */

import type { Chast2Zadacha, Shablon2 } from './types';

/** [кого (род. мн.), что (вин. мн.), альбомы (им. мн.), альбомов (род. мн.), в одном альбоме, мест (род. мн.)]. */
const PREDMETY = [
  ['марок', 'марки', 'альбомы', 'альбомов', 'альбоме', 'ячеек'],
  ['открыток', 'открытки', 'альбомы', 'альбомов', 'альбоме', 'кармашков'],
  ['фотографий', 'фотографии', 'фотоальбомы', 'фотоальбомов', 'фотоальбоме', 'кармашков'],
  ['значков', 'значки', 'планшеты', 'планшетов', 'планшете', 'гнёзд'],
  ['коллекционных карточек', 'карточки', 'папки', 'папок', 'папке', 'кармашков'],
  ['монет', 'монеты', 'кляссеры', 'кляссеров', 'кляссере', 'ячеек'],
] as const;

/** [у кого (род. п.), чьи]. */
const LYUDI = [
  ['Анны Сергеевны', 'её'],
  ['Олега Петровича', 'его'],
  ['Марины Викторовны', 'её'],
  ['Дениса Андреевича', 'его'],
  ['Ольги Николаевны', 'её'],
  ['Виктора Семёновича', 'его'],
] as const;

export interface PF20 {
  /** Пустых мест в последнем альбоме. */
  e: number;
  /** На сколько больше маленьких альбомов. */
  d: number;
  /** Границы вместимости большого: B₀ < B < B₁. */
  B0: number;
  B1: number;
  s0: number;
  s1: number;
  /** а) может ли k равняться k₀. */
  k0: number;
  predmet: number;
  kto: number;
}

export interface Variant20 {
  k: number;
  s: number;
  B: number;
  N: number;
}

export function variantyF20(p: PF20): Variant20[] {
  const out: Variant20[] = [];
  for (let B = p.B0 + 1; B < p.B1; B += 1)
    for (let s = p.s0 + 1; s < p.s1; s += 1) {
      if (B <= s || (p.d * s) % (B - s) !== 0) continue;
      const k = (p.d * s) / (B - s);
      if (p.e >= s) continue;
      out.push({ k, s, B, N: k * B - p.e });
    }
  return out.sort((a, b) => a.k - b.k || a.s - b.s);
}

function sobrat(p: PF20): Chast2Zadacha {
  const P = PREDMETY[p.predmet];
  const L = LYUDI[p.kto];
  if (!P || !L) throw new Error('f20: сюжет');
  const [kogo, chto, alb, albov, vAlbome, mest] = P;
  const [uKogo, chi] = L;
  const V = variantyF20(p);
  if (V.length === 0) throw new Error('f20: нет вариантов');
  const Nmin = Math.min(...V.map((v) => v.N));
  const Nmax = Math.max(...V.map((v) => v.N));
  const aDa = V.some((v) => v.k === p.k0);
  /* Оценка k: ds/(B − s) при s₀ < s < s₁, B − s ∈ [B₀ + 1 − (s₁ − 1); B₁ − 1 − (s₀ + 1)]. */
  const mMin = p.B0 + 1 - (p.s1 - 1);
  const mMax = p.B1 - 1 - (p.s0 + 1);
  if (mMin <= 0) throw new Error('f20: B ≤ s');
  const kLo = (p.d * (p.s0 + 1)) / mMax;
  const kHi = (p.d * (p.s1 - 1)) / mMin;
  const kVse: number[] = [];
  for (let k = Math.ceil(kLo); k <= Math.floor(kHi); k += 1) kVse.push(k);
  const dec = (x: number) => String(Math.round(x * 100) / 100).replace('.', '{,}');
  const uslovie =
    `У ${uKogo} есть коллекция ${kogo}. Если все ${chi} ${chto} разложить в одинаковые большие ${alb}, то понадобится $k$ ${albov}, причём $${p.e}$ ${mest} в одном ${vAlbome} останутся пустыми. ` +
    `Если же разложить их в одинаковые маленькие ${alb}, понадобится $k+${p.d}$ ${albov}, и снова $${p.e}$ ${mest} в одном ${vAlbome} останутся пустыми. ` +
    `Известно, что в большом ${vAlbome} больше $${p.B0}$, но меньше $${p.B1}$ ${mest}, а в маленьком — больше $${p.s0}$, но меньше $${p.s1}$ ${mest}.\n` +
    `а) Может ли $k$ быть равно $${p.k0}$?\n` +
    `б) Какое наименьшее количество ${kogo} может быть в коллекции у ${uKogo}?\n` +
    `в) Какое наибольшее количество ${kogo} может быть в коллекции у ${uKogo}?`;
  const poK = kVse.map((k) => {
    const vk = V.filter((v) => v.k === k);
    const BT = `B=\\dfrac{${k + p.d}s}{${k}}`;
    return vk.length === 0
      ? `$k=${k}$: $${BT}$ — целых $B$ в нужных границах нет.`
      : `$k=${k}$: $${BT}$; ${vk.map((v) => `$s=${v.s}$, $B=${v.B}$, $N=${k}\\cdot${v.B}-${p.e}=${v.N}$`).join('; ')}.`;
  });
  const vMin = V.find((v) => v.N === Nmin)!;
  const vMax = V.find((v) => v.N === Nmax)!;
  const vA = V.find((v) => v.k === p.k0);
  return {
    no: 20,
    shablon: 'f20.albomy',
    uslovie,
    risunok: null,
    punkty: [
      { bukva: 'а', podpis: 'Ответ', pole: { vid: 'danet', verno: aDa } },
      { bukva: 'б', podpis: 'Наименьшее количество', pole: { vid: 'chislo', verno: String(Nmin) } },
      { bukva: 'в', podpis: 'Наибольшее количество', pole: { vid: 'chislo', verno: String(Nmax) } },
    ],
    otvet: `а) ${aDa ? 'да' : 'нет'}; б) $${Nmin}$; в) $${Nmax}$`,
    reshenie: [
      {
        title: 'Уравнение',
        lines: [
          `Пусть $B$ и $s$ — вместимости большого и маленького альбома, $N$ — число предметов. Тогда $N=kB-${p.e}=(k+${p.d})s-${p.e}$, откуда $kB=(k+${p.d})s$, $k(B-s)=${p.d}s$, $k=\\dfrac{${p.d}s}{B-s}$.`,
          `Границы: $${p.s0 + 1}\\le s\\le${p.s1 - 1}$, $${p.B0 + 1}\\le B\\le${p.B1 - 1}$, поэтому $${mMin}\\le B-s\\le${mMax}$.`,
          `Значит, $k\\ge\\dfrac{${p.d}\\cdot${p.s0 + 1}}{${mMax}}\\approx${dec(kLo)}$ и $k\\le\\dfrac{${p.d}\\cdot${p.s1 - 1}}{${mMin}}\\approx${dec(kHi)}$, то есть $k\\in\\{${kVse.join(',\\,')}\\}$.`,
        ],
      },
      { title: 'Перебор', lines: poK },
      {
        title: 'а)',
        lines: [
          aDa
            ? `Да: при $s=${vA!.s}$, $B=${vA!.B}$ получаем $k=${p.k0}$, $N=${vA!.N}$: $${p.k0}\\cdot${vA!.B}-${p.e}=${p.k0 + p.d}\\cdot${vA!.s}-${p.e}=${vA!.N}$.`
            : kVse.includes(p.k0)
              ? `Нет: при $k=${p.k0}$ подходящих $s$ и $B$ нет (см. перебор).`
              : `Нет: $k=${p.k0}$ не входит в возможные значения $k$.`,
        ],
      },
      {
        title: 'б), в)',
        lines: [
          `Наименьшее $N=${Nmin}$ (при $k=${vMin.k}$, $B=${vMin.B}$, $s=${vMin.s}$), наибольшее $N=${Nmax}$ (при $k=${vMax.k}$, $B=${vMax.B}$, $s=${vMax.s}$).`,
        ],
      },
    ],
    razbor: [
      { slovo: 'Приравниваем два способа подсчёта', formula: `k(B-s)=${p.d}s` },
      { slovo: 'Оценка $k$ по границам вместимостей', formula: `k\\in\\{${kVse.join(',\\,')}\\}` },
      {
        slovo: 'Перебор и ответы',
        formula: `${aDa ? '\\text{да}' : '\\text{нет}'};\\ ${Nmin};\\ ${Nmax}`,
      },
    ],
    kontrol: { Nmin, Nmax, a: aDa ? 1 : 0, varianty: V.length },
  };
}

export const F20_ALBOMY: Shablon2<PF20> = {
  no: 20,
  prototip: 'Раскладка коллекции по альбомам двух размеров: k(B − s) = ds, оценка и перебор',
  sobrat,
};
