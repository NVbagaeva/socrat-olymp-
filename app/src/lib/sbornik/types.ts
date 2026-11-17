/**
 * Задача «Интерактивного сборника для поступающих в вузы» — как её
 * пишет tools/sbornik (схема: data/sbornik/schema.json).
 *
 * Ответ хранится не одной записью, а тем, что нужно для проверки:
 * число — значением; выражение — значениями в точках внутри области
 * определения (точки выбрал sympy, там же сверил ответ с условием);
 * ответ по случаям — кусками с промежутками.
 */

export type Uroven = 1 | 2 | 3;

/** Значение выражения в точке: переменные и «=» — значение. */
export type Tochka = Readonly<Record<string, number>>;

export interface OtvetChislo {
  vid: 'chislo';
  tex: string;
  zapis: string;
  znachenie: number;
  /** Нужна точная запись: приближённая десятичная не засчитывается. */
  tochno: boolean;
  forma?: readonly Forma[];
}

export type Forma = 'bez-kornya-v-znamenatele' | 'proizvedenie' | 'summa-kvadratov';

export interface OtvetVyrazhenie {
  vid: 'vyrazhenie';
  tex: string;
  zapis: string;
  peremennye: readonly string[];
  tochki: readonly Tochka[];
  forma?: readonly Forma[];
}

export interface Oblast {
  lo: number | null;
  hi: number | null;
  loZakr: boolean;
  hiZakr: boolean;
  tex: string;
}

export interface Kusok extends Omit<OtvetVyrazhenie, 'vid'> {
  vid: 'vyrazhenie';
  oblast: Oblast;
}

export interface OtvetKusochnyi {
  vid: 'kusochnyi';
  peremennaya: string;
  kuski: readonly Kusok[];
  tex: string;
}

export interface PoleChisla {
  podpis: string;
  tex: string;
  zapis: string;
  znachenie: number;
  tochno: boolean;
}

export interface OtvetChisla {
  vid: 'chisla';
  polya: readonly PoleChisla[];
  tex: string;
}

export type Otvet = OtvetChislo | OtvetVyrazhenie | OtvetKusochnyi | OtvetChisla;

export interface ShagDannye {
  chto: string;
  tex?: string;
}

/** Задача в файле банка. */
export interface ZadachaDannye {
  id: string;
  glava: number;
  tip: string;
  podtip: string;
  uroven: Uroven;
  uslovie: string;
  formula?: string;
  dopolnenie?: string;
  otvet: Otvet;
  razbor: readonly ShagDannye[];
  podskazki: readonly string[];
  proverka: { iskhod: string; usloviya: readonly string[] };
}

/**
 * Задача, готовая к показу: тексты набраны KaTeX на сборке, ответ — для
 * проверки в браузере. Служебная часть (proverka) на сайт не уходит.
 */
export interface ZadachaHtml {
  id: string;
  tip: string;
  uroven: Uroven;
  uslovieHtml: string;
  formulaHtml?: string;
  dopolnenieHtml?: string;
  otvet: Otvet;
  otvetHtml: string;
  shagi: readonly { chtoHtml: string; formulaHtml: string }[];
  podskazkiHtml: readonly string[];
}

/** Ввод ученика. */
export type VvodSbornika =
  | { vid: 'odno'; tex: string }
  | { vid: 'kuski'; kuski: readonly { oblast: string; tex: string }[] }
  | { vid: 'polya'; polya: readonly string[] };
