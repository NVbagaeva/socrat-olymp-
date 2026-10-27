/**
 * Тренажёр с фильтрами сверху: типы, общие для всех разделов.
 *
 * Раздел задаёт только конфиг (темы → подтипы, уровни, есть ли выбор
 * источника) и список задач, из которых тренажёр выбирает. Панель
 * фильтров, счётчики, ссылка, порядок задач и сессия — общие.
 * План — docs/trenazher-filtry/01-plan.md.
 */

/** ★, ★★, ★★★. */
export type Uroven = 1 | 2 | 3;

/** Откуда задача: открытый банк ФИПИ или нет. */
export type Istochnik = 'fipi' | 'new';

export interface FiltrPodtip {
  /** Идентификатор движка: '12Q.B'. */
  id: string;
  /** Код на чипе: '12Q.B'. */
  code: string;
  title: string;
  /** Название с формулами, набранное KaTeX; нет — title текстом. */
  titleHtml?: string;
}

export interface FiltrTema {
  /** 'quadratic'. */
  id: string;
  title: string;
  /** Короткое название для строки-сводки: «параболы». */
  short: string;
  podtipy: FiltrPodtip[];
}

/**
 * Дополнительное поле раздела: не сужает список задач, а меняет, как
 * задача решается (№13: «Определить тип», «С оформлением»; №6:
 * формулировка). Первый вариант — по умолчанию.
 */
export interface DopPole {
  id: string;
  title: string;
  varianty: { id: string; title: string; hint?: string }[];
}

/** Готовый набор раздела рядом с «Быстрым стартом»: «Определи тип» №13. */
export interface NaborRazdela {
  id: string;
  title: string;
  sub: string;
  /** Значения дополнительных полей набора. */
  dop: Record<string, string>;
}

/** Конфиг раздела: только то, чем разделы отличаются. */
export interface TrenazherConfig {
  /** Номер раздела для сводки: '12'. */
  razdel: string;
  /** Раздел сессии и запомненных фильтров: '12:quadratic', '12'. */
  scope: string;
  temy: FiltrTema[];
  /** Подписи уровней. Пусто — сложность у раздела не размечена: фильтра нет. */
  urovni: { uroven: Uroven; words: string }[];
  /** Есть задачи и из банка, и не из банка: показывать выбор источника. */
  istochnik: boolean;
  dop?: DopPole[];
  nabory?: NaborRazdela[];
}

/**
 * Задача, из которых тренажёр выбирает. Список конечный: числа на
 * чипах и счётчик «Найдено» — длина этого списка под фильтром.
 */
export interface ZadachaRef {
  /** Ключ задачи: '12Q.B-07'. По нему — статистика и сборка. */
  key: string;
  podtip: string;
  uroven: Uroven | null;
  istochnik: Istochnik;
  /** Правило ответа (№12): им сужают набор ярлыки прежних адресов. */
  pravilo?: string;
}

export type IstochnikFiltra = 'vse' | Istochnik;
/** 0 — без ограничения. */
export type Skolko = 5 | 10 | 20 | 0;
export type Rezhim = 'podskazki' | 'bez' | 'vremya';
export type Poryadok = 'prostye' | 'sluchayno';
export type Moi = 'vse' | 'nereshennye' | 'oshibki';

/** Что можно снять кнопкой «Расширить фильтры». */
export type FiltrPole = 'tipy' | 'istochnik' | 'urovni' | 'moi' | 'pravila';

export interface Filtr {
  /** Выбранные подтипы. Пусто — все. */
  tipy: string[];
  istochnik: IstochnikFiltra;
  /** Выбранные уровни. Пусто — все. */
  urovni: Uroven[];
  skolko: Skolko;
  rezhim: Rezhim;
  poryadok: Poryadok;
  moi: Moi;
  /** Правила ответа (ярлыки прежних адресов №12). Пусто — все. */
  pravila: string[];
  /** Подпись фильтра по правилам: «абсцисса второй точки». */
  pravilaTitle?: string;
  /** В каком порядке ученик сужал выбор: последний снимается первым. */
  poryadokSuzheniya: FiltrPole[];
  /** Дополнительные поля раздела: только отличные от первого варианта. */
  dop: Record<string, string>;
}

/** Что известно об ученике: из статистики раздела. */
export interface Statistika {
  /** Ключи задач, решённых верно. */
  resheno: ReadonlySet<string>;
  /** Ключи задач, в которых была ошибка или подсказка. */
  oshibki: ReadonlySet<string>;
}
