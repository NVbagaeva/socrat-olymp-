import type { ReactNode } from 'react';
import type { LogStore } from '@/lib/progressLog';
import type { Reading } from '@/lib/otvet';
import type { SyncedStore } from '@/lib/syncedStore';
import type { Zagruzka, ZadachaFayla } from '@/lib/trening/zagruzka';
import type { PayloadBanka } from '@/lib/trening/bank';
import type { VyborBanka } from '@/lib/trening/vybor';
import type { IkonkaName, Shag } from '../../steklo';
import type { EkranZadachiLabels } from '../EkranZadachi';
import type { ItogiLabels } from '../ItogiSessii';
import type { PodskazkaVoprosyLabels, VoprosPodskazki } from '../PodskazkaVoprosy';
import type { ProgressPanelLabels } from '../ProgressPanel';
import type { VyborTemLabels } from '../VyborTem';

/**
 * Подписи тренажёра по банку: режимы, выбор тем, экран задачи, итоги,
 * прогресс. Тексты — у раздела (content/…), здесь только их форма.
 */
export interface TekstyBanka {
  title: string;
  rezhimy: {
    title: string;
    mix: { zag: string; lead: (n: number) => string };
    temy: { zag: string; lead: string };
    oshibki: { zag: string; lead: (n: number) => string };
    otlozhennye: (n: number) => string;
  };
  vybor: Omit<VyborTemLabels, 'itog'> & {
    itog: (n: number, vsegoTipov: number, skolko: number | null, taymer: boolean) => string;
    istochnik: string;
    istochniki: { vse: string; fipi: string; new: string };
    istochnikPusto: string;
    /** Формулировка (№6): все, сюжетные, стандартные. */
    stil?: string;
    stili?: { vse: string; syuzhet: string; standart: string };
  };
  ekran: Omit<EkranZadachiLabels, 'vernoLead'> & {
    vernoLead: (sek: number | null) => string;
    nevernoDrob: string;
    zagruzka: string;
    oshibkaZagruzki: string;
    povtorit: string;
    piPodskazka: string;
    zakladka: (tip: string) => string;
    voprosy: PodskazkaVoprosyLabels;
    /** Вердикт «число верное, единицы нет» (№13): попытка засчитана как неверная. */
    edinicy?: { zag: string; lead: string };
  };
  itogi: Omit<ItogiLabels, 'title' | 'lead' | 'rabota'> & {
    title: (dolya: number) => string;
    lead: (sek: number, srednee: number | null, sRazborom: number) => string;
    rabota: (n: number) => string;
    prosel: string;
  };
  progress: ProgressPanelLabels & {
    povtorit: string;
    schet: (resheno: number, vsego: number) => string;
    oshibki: string;
    oshibokNet: string;
    otlozhennye: string;
    otlozhennyhNet: string;
    istoriya: string;
    istoriiNet: string;
  };
}

/** Задача в файле прототипа: ключ, прототип, параметры, условие и отпечаток ответа. */
export interface ZadachaBanka extends ZadachaFayla {
  text: string;
  seal: string;
}

/**
 * Раздел для тренажёра по банку. Объект живёт в клиентском модуле
 * раздела: в нём функции (загрузчик, разбор, проверка ответа), их
 * нельзя передать с сервера пропсом.
 */
export interface RazdelBanka<Z extends ZadachaBanka, S> {
  /** Номер задания: закладки, история, ключ сессии по умолчанию. */
  razdel: string;
  /** Какие ключи у задач раздела. */
  klyuch: RegExp;
  log: LogStore;
  vybor: SyncedStore<VyborBanka>;
  zagruzka: Zagruzka<Z, S, unknown>;
  T: TekstyBanka;
  /**
   * Ответ ученика по правилам бланка и отпечаток задачи; 'pi' — ответ
   * записан через π; 'edinicy' — число верное, а единицы нет (№13).
   * z и rezhim — для разделов, которым мало отпечатка (№13: ответы в
   * чужих единицах, выбор схемы в «Определи тип»).
   */
  proverit: (
    vvod: string,
    seal: string,
    z: Z,
    rezhim: string | undefined,
  ) => Reading | { kind: 'pi' } | { kind: 'edinicy' };
  /** Под условием: рисунок, вопрос после рисунка, откуда задача. */
  pod: (z: Z, rezhim?: string) => ReactNode;
  /** Решение шагами сцены, панель под ними и подсказка-вопросы. */
  shagi: (s: S, rezhim?: string) => Shag[];
  posle?: (s: S, rezhim?: string) => ReactNode;
  voprosy: (s: S, rezhim?: string) => VoprosPodskazki[];
  /**
   * Своё поле ответа вместо числа (№13, «Определи тип»: кнопки схем).
   * null — обычное поле. Значение — строка, как у числа.
   */
  pole?: (
    z: Z,
    rezhim: string | undefined,
    ui: {
      value: string;
      onValue: (value: string) => void;
      zakryto: boolean;
      verno: boolean | null;
    },
  ) => ReactNode | null;
  /**
   * Особый режим — четвёртая карточка на старте (№13: «Определи тип»):
   * все типы вперемешку, задачи решаются по-своему (payload.rezhim).
   */
  dopRezhimy?: { id: string; ikonka: IkonkaName; zag: string; lead: (n: number) => string }[];
  /**
   * Выбор в «Выбрать темы», как отвечать (№13: «Только число / С
   * оформлением»): '' — обычный ответ, иначе id особого режима.
   */
  otvetVybora?: { title: string; sposoby: { id: string; label: string }[] };
  /**
   * Уровень в «Выбрать темы» (№13: ★ базовый, ★★ повышенный). Уровень
   * прототипа — поле `u` каталога.
   */
  urovni?: { title: string; labels: { vse: string; '1': string; '2': string }; pusto: string };
  /** Можно ли проверять ответ: своё поле с несколькими частями (№13, «С оформлением»). */
  gotov?: (z: Z, rezhim: string | undefined, value: string) => boolean;
  /** Запись прежнего тренажёра раздела, которую не понимает общий разбор (№13: тренажёр с фильтрами). */
  prezhnyayaZapis?: (packed: unknown) => PayloadBanka | null;
  /** Ссылка на одну задачу: закладка. */
  zadachaHref: (id: string) => string;
  /** Переключатель формулировки в выборе тем (№6). */
  stil?: boolean;
  /** Без переключателя источника задач (№2: все задачи строит генератор). */
  bezIstochnika?: boolean;
  /**
   * Своя подсказка вместо вопросов (№2: шаги решения по одному). otkryto —
   * сколько шагов открыто (с 1), dalshe — открыть следующий.
   */
  podskazka?: (s: S, ui: { otkryto: number; dalshe: () => void }) => ReactNode;
}
