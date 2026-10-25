/**
 * Банк задания №3 для тренажёра: то, что уезжает в браузер.
 *
 * Собирается на сборке. Условия набирает KaTeX, чертежи рисует
 * движок solid/ — в браузер уходит готовая разметка, ни движка, ни
 * KaTeX там не нужно.
 *
 * Чертёж хранится один на прототип, а не на вариант: у десяти
 * вариантов одного прототипа чертёж совпадает — числа стоят в
 * условии, а не на картинке. Исключение — ступенчатые тела, у них
 * числа на самом чертеже, и там чертёж свой у каждого варианта.
 * Иначе банк весил бы вдесятеро больше без единого нового пикселя.
 *
 * Ответы и разборы закрыты (см. secret.ts): открытым текстом в
 * бандл они не попадают.
 */

import { szhat, tekstyPodpisey } from '../chertezh3';
import { katex } from '../graph/katex';
import { renderSolid } from '../solid';
import { texPlain, typeset } from '../tex';
import { chertezhVarianta, estScenariy } from './chertezhi';
import { RAZDELY, type Razdel } from './index';
import { klyuchZadachi, sealAnswer, sealText } from './secret';
import { type Prototype } from './types';

export interface PoolVariant {
  /** Номер варианта в прототипе, 1…10. */
  n: number;
  uslovieHtml: string;
  /** Отпечаток верного ответа. Самого ответа здесь нет. */
  seal: string;
  /** Закрытый разбор: шаги через перевод строки. */
  steps: string;
  /** Чертёж варианта. null — берётся общий чертёж прототипа. */
  svg: string | null;
  /**
   * Сценарий интерактивного чертежа (многогранники), закрытый тем же
   * отпечатком: по размерам тела иногда видно ответ. null — чертёж
   * прежний, статичный (тела вращения).
   */
  scena: string | null;
  /** Ссылки шагов разбора на элементы чертежа, закрытые: JSON string[][]. */
  stepRefs: string | null;
}

export interface PoolKind {
  /** Идентификатор прототипа: он же тип задания для фильтра. */
  id: string;
  /** Название типа на кнопке фильтра; формулы в нём — $…$. */
  title: string;
  /** То же название, набранное KaTeX на сборке. */
  titleHtml: string;
  /** Оно же обычным текстом — для подписи чертежа (aria-label). */
  titlePlain: string;
  /** Римский номер раздела: по нему фильтрует общий тренажёр. */
  group: string;
  /** Название раздела на кнопке фильтра общего тренажёра. */
  groupTitle: string;
  /** Формат ответа: подсказывает, чего ждать от поля ввода. */
  format: Prototype['format'];
  /** Общий чертёж прототипа (пусто, если чертежи — сценарии). */
  svg: string;
  /** Подписи сценариев прототипа, свёрстанные KaTeX: TeX → HTML. */
  podpisiHtml: Record<string, string> | null;
  variants: PoolVariant[];
}

/** Подсказка у поля ответа «в долях π»: формула набирается на сборке. */
const PI_HINT = 'Ответ уже делённый на $\\pi$ — саму $\\pi$ писать не нужно.';

export interface Pool {
  /** Подсказка у поля ответа «в долях π», набранная KaTeX. */
  piHintHtml: string;
  /** Римский номер раздела или 'all' у общего тренажёра. */
  razdel: string;
  title: string;
  kinds: PoolKind[];
}

/** У прототипа числа стоят на самом чертеже — чертёж свой у варианта. */
function perVariant(prototype: Prototype): boolean {
  const first = prototype.varianty[0];
  if (first === undefined) {
    return false;
  }
  return (prototype.chertezh(first.params).measures ?? []).length > 0;
}

function kindOf(razdel: Razdel, prototype: Prototype): PoolKind {
  const first = prototype.varianty[0];
  if (first === undefined) {
    throw new Error(`У прототипа ${prototype.id} нет вариантов`);
  }
  const own = perVariant(prototype);
  const scenarii = estScenariy(prototype);
  const podpisi = new Set<string>();
  const variants = prototype.varianty.map((variant) => {
    /* Отпечаток — с ключом задачи: у одного ответа в двух вариантах
       отпечатки разные. */
    const seal = sealAnswer(
      prototype.otvet(variant.params),
      klyuchZadachi(prototype.id, variant.n),
    );
    /* Шаги набираются KaTeX здесь, на сборке: в закрытый разбор
       уходит готовая вёрстка, по строке на шаг. */
    const steps = prototype
      .shagi(variant.params)
      .map((step) => typeset(step.text).replace(/\n/g, ' '))
      .join('\n');
    const ch = scenarii ? chertezhVarianta(prototype, variant) : null;
    if (ch && ch.oshibki.length > 0) {
      throw new Error(`Чертёж ${prototype.id}#${variant.n}: ${ch.oshibki.join('; ')}`);
    }
    if (ch) tekstyPodpisey(ch.scenariy).forEach((t) => podpisi.add(t));
    return {
      n: variant.n,
      uslovieHtml: typeset(prototype.uslovie(variant.params)),
      seal,
      /* Разбор закрыт тем же отпечатком: без него не раскрыть. */
      steps: sealText(steps, seal),
      svg: own && !ch ? renderSolid(prototype.chertezh(variant.params)) : null,
      scena: ch ? sealText(JSON.stringify(szhat(ch.scenariy)), seal) : null,
      stepRefs: ch ? sealText(JSON.stringify(ch.shagi), seal) : null,
    };
  });
  return {
    id: prototype.id,
    title: prototype.nazvanie,
    titleHtml: typeset(prototype.nazvanie),
    titlePlain: texPlain(prototype.nazvanie),
    group: razdel.nomer,
    groupTitle: razdel.nazvanie,
    format: prototype.format,
    svg: scenarii ? '' : renderSolid(prototype.chertezh(first.params)),
    podpisiHtml: scenarii
      ? Object.fromEntries(
          [...podpisi].map((t) => [t, katex.renderToString(t, { throwOnError: true })]),
        )
      : null,
    variants,
  };
}

/** Банк одного раздела. */
export function razdelPool(razdel: Razdel): Pool {
  return {
    razdel: razdel.nomer,
    title: razdel.nazvanie,
    piHintHtml: typeset(PI_HINT),
    kinds: razdel.prototipy.map((prototype) => kindOf(razdel, prototype)),
  };
}

/** Банк целиком: общий смешанный тренажёр по всем восьми разделам. */
export function wholePool(): Pool {
  return {
    razdel: 'all',
    title: 'Весь банк задания №3',
    piHintHtml: typeset(PI_HINT),
    kinds: RAZDELY.flatMap((razdel) =>
      razdel.prototipy.map((prototype) => kindOf(razdel, prototype)),
    ),
  };
}
