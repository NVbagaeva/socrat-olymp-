/**
 * Базовая математика: типы данных раздела задания.
 *
 * Раздел базы описывается данными (content/baza), а не своей разметкой:
 * оболочка, вкладки и экраны у всех 21 задания общие (components/baza).
 * Вкладка, для которой данных ещё нет, показывает «Материал готовится».
 */

import type { Koloda } from '@/lib/kartochki/tipy';
import type { TipOtveta } from '@/lib/otvet/tipy';
import type { Rng } from '@/lib/veroyatnost/generator';

export type { TipOtveta };

/** Идентификаторы вкладок раздела базы. */
export type VkladkaBazy =
  'o-zadanii' | 'teoriya' | 'kartochki' | 'opornye' | 'trenazher' | 'generator';

/** Паспорт задания: что проверяет и как записывается ответ. */
export interface PasportZadaniya {
  /** Одна строка под заголовком: что нужно сделать в задании. */
  lead: string;
  /** Основной тип ответа номера. */
  otvet: TipOtveta;
}

/* ── Банк задач раздела ─────────────────────────────────────────
   Формат тот же, что у разделов профиля с тренажёром по банку (№6, №7,
   №10): прототип умеет подобрать числа, написать условие и решить
   задачу по шагам; в браузер уходят условие, параметры и отпечаток
   ответа (lib/baza/secret.ts), решение считается на месте. */

export type Params = Record<string, number | string | number[]>;

/** Шаг разбора: заголовок и строки (формулы — в $…$). */
export interface Etap {
  title: string;
  lines: string[];
}

/** Подсказка-вопрос тренажёра: варианты и номер верного. */
export interface HintStep {
  question: string;
  options: string[];
  correct: number;
  comment?: string;
}

export interface Resheno {
  /** Ответ в записи бланка: «0,25», «4132». */
  otvet: string;
  /** Тип lyuboe: все допустимые ответы. */
  dopustimye?: string[];
  etapy: Etap[];
  hints: HintStep[];
}

export interface Prototip {
  /** «P01» — номер прототипа в разделе. */
  id: string;
  /** Группа выбора тем (GruppaBazy.id). */
  gruppa: string;
  title: string;
  tip: TipOtveta;
  /** Сколько задач прототипа в банке. Не больше, чем разных наборов чисел. */
  zadach: number;
  generate(rng: Rng): Params;
  text(params: Params): string;
  solve(params: Params): Resheno;
  /**
   * Независимый пересчёт ответа по числам условия — другим способом,
   * чем solve (перебором, через целые). Его сверяет pnpm test:baza:
   * задача с расхождением в банк не попадает.
   */
  proverka(params: Params): string;
  /**
   * Чертёж условия — SVG-разметка по числам задачи (№12 «Планиметрия»).
   * Строится на сборке и уходит в браузер вместе с условием.
   */
  risunok?(params: Params): string;
}

/** Группа прототипов в выборе тем тренажёра. */
export interface GruppaBazy {
  id: string;
  nazvanie: string;
  /** Значок группы, TeX. */
  znak: string;
  ton: 'blue' | 'navy' | 'orange' | 'terra' | 'green';
}

/** Задача банка на сборке: с открытым ответом. */
export interface ZadachaBazy {
  /** «P01-03». */
  id: string;
  prototypeId: string;
  params: Params;
  text: string;
  otvet: string;
  dopustimye?: string[];
  tip: TipOtveta;
  /** SVG чертежа условия, если он есть у прототипа. */
  risunok?: string;
}

/** Задача для браузера: ответ — отпечатком. */
export interface ZadachaLite {
  id: string;
  prototypeId: string;
  params: Params;
  text: string;
  /** SVG чертежа условия. */
  risunok?: string;
  seal: string;
}

/* ── Опорные задачи ─────────────────────────────────────────── */

export interface MikroZadacha {
  id: string;
  uslovie: string;
  otvet: string;
  podskazka: string;
  razbor: string[];
  /** Независимый пересчёт ответа (pnpm test:baza). */
  proverka: () => string;
}

export interface BlokOpornyh {
  slug: string;
  nazvanie: string;
  /** Описание для карточки блока — без формул. */
  opisanie: string;
  /** «Запомни»: правило блока, с формулами. */
  zapomni: string;
  /** Значок блока, TeX. */
  znak: string;
  zadachi: MikroZadacha[];
}

export interface NavykOpornyh {
  id: string;
  nazvanie: string;
  lead: string;
  ton: GruppaBazy['ton'];
  bloki: BlokOpornyh[];
}

/* ── Теория ─────────────────────────────────────────────────── */

/** Разобранный пример теории: условие, шаги, ответ. */
export interface PrimerTeorii {
  uslovie: string;
  shagi: string[];
  otvet: string;
}

/**
 * Сверка уравнения перебором (pnpm test:baza): запись в синтаксисе
 * разборщика №17 (lib/baza/z17/razbor.ts) и все корни по возрастанию
 * записью бланка; «net» — корней нет, «lyuboe» — подходит любое число.
 */
export interface SverkaUravneniya {
  ur: string;
  korni: readonly string[] | 'net' | 'lyuboe';
}

/** Шаг разбора в рамке «Пример»: подпись (что делаем и почему), выкладки, пояснение. */
export interface ShagRazbora {
  label: string;
  formuly?: string[];
  paras?: string[];
}

/** Разбор по шагам в рамке «Пример» (components/teoriya/Ramki.tsx). */
export interface RazborTeorii {
  title: string;
  uslovie?: string;
  shagi: ShagRazbora[];
  /** Итог: «Ответ: $-2{,}5$.» */
  otvet: string;
  sverka?: SverkaUravneniya;
}

/** Тон ветки схемы и рамки случая: зелёный — корни есть, синий, терракотовый — корней нет… */
export type TonTeorii = 'zel' | 'sin' | 'terra' | 'oranzh' | 'navy';

/** Ветка схемы-развилки: условие, итог, формула, вложенная развилка. */
export interface VetkaRazvilki {
  esli: string;
  ton: TonTeorii;
  itog?: string;
  /** TeX без $. */
  formula?: string;
  punkty?: string[];
  dalshe?: Razvilka;
}

export interface Razvilka {
  vopros: string;
  vetki: VetkaRazvilki[];
}

export type BlokTeorii =
  /* Рамки теории сайта (components/teoriya/Ramki.tsx): разделы, где они
     есть, рисуются в «стеклянном» слое .teor-steklo. */
  /** Подпункт раздела: заголовок с якорем — он же пункт «Содержания». */
  | { vid: 'podpunkt'; id: string; title: string }
  | {
      vid: 'opredelenie';
      title?: string;
      paras: string[];
      /** TeX без $. */
      formula?: string;
      spisok?: string[];
      /** Шаги алгоритма с номерами в кружках. */
      algoritm?: string[];
      /** Ссылка внутри страницы: «к разделу о линейных». */
      ssylka?: { href: string; text: string };
    }
  | { vid: 'glavnaya'; formula: string; podpis?: string }
  | { vid: 'razvilka'; title?: string; razvilka: Razvilka }
  /** Рамка «Случай»: условие → вывод → объяснение → разборы → запись ответа. */
  | {
      vid: 'sluchay';
      /** Подпись-плашка: «Случай 1», «Вид 2». */
      metka: string;
      ton: TonTeorii;
      title: string;
      /** TeX без $: выкладка случая. */
      formula?: string;
      vyvod: string;
      paras: string[];
      razbory: RazborTeorii[];
      zapis: string;
    }
  /** Раскрывающийся «Пример»: кнопка открывает разбор по шагам. */
  | { vid: 'razbor'; razbor: RazborTeorii }
  /** «Важно», «Вывод», «Лайфхак» — всегда с задачей-обоснованием. */
  | { vid: 'vazhnoZadacha'; title?: string; paras: string[]; razbor: RazborTeorii }
  | { vid: 'vyvodZadacha'; title?: string; paras: string[]; razbor: RazborTeorii }
  | {
      vid: 'layfhakZadacha';
      title?: string;
      paras: string[];
      formula?: string;
      razbor: RazborTeorii;
    }
  | { vid: 'tablica'; title?: string; head: string[]; rows: string[][] }
  /** «Проверь себя»: набор задач lib/baza/proverka-teorii.ts. */
  | { vid: 'proverka'; nabor: string }
  | { vid: 'tekst'; text: string }
  | { vid: 'formula'; tex: string }
  | { vid: 'zapomni'; text: string }
  | { vid: 'vazhno'; text: string; primer: string }
  | { vid: 'layfhak'; text: string }
  | { vid: 'spisok'; punkty: string[] }
  | { vid: 'primer'; primer: PrimerTeorii }
  /** Чертёж темы справочника планиметрии (lib/planimetriya/spravochnik-chertezhi). */
  | { vid: 'chertezh'; tema: string; podpis?: string }
  /**
   * Готовый чертёж — SVG-разметка, построенная на сборке (тела №13
   * «Стереометрия» — движком lib/solid, см. lib/baza/z13/ris.ts).
   */
  | { vid: 'risunok'; svg: string; podpis?: string };

export interface RazdelTeorii {
  id: string;
  title: string;
  bloki: BlokTeorii[];
}

/* ── Раздел целиком ─────────────────────────────────────────── */

/** Наполнение раздела задания базы. Нет поля — вкладка «готовится». */
export interface RazdelBazy {
  slug: string;
  /** Тексты «О задании»: что проверяется и типы задач. */
  oZadanii?: { title: string; text: string[]; tipy: { title: string; primer: string }[] };
  teoriya?: RazdelTeorii[];
  gruppy?: GruppaBazy[];
  prototipy?: Prototip[];
  opornye?: NavykOpornyh[];
  /** Колода карточек «Знаю / Не знаю» (формат — lib/kartochki/tipy.ts). */
  kartochki?: Koloda;
}
