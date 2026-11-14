'use client';

/**
 * Данные задач тренажёра по банку раздела в браузере — общая часть
 * (№7, №6 и дальше). Файл прототипа качается один раз за визит (сбой
 * сети в кеше не застревает), решатель прототипов и KaTeX приезжают
 * вместе с первым файлом. Ответов в файлах нет — только отпечаток;
 * разбор и подсказки-вопросы строит решатель по параметрам задачи.
 */

/** Задача в файле прототипа: ключ, прототип и параметры для решателя. */
export interface ZadachaFayla {
  id: string;
  prototypeId: string;
  params: Record<string, unknown>;
}

export interface Zagruzka<Z extends ZadachaFayla, S, P = unknown> {
  /** Загрузить файлы прототипов (и KaTeX с решателем): после этого кеш отдаёт задачи сразу. */
  zagruzit(prototipy: readonly string[]): Promise<void>;
  /** Задача из уже загруженных; undefined — файл ещё не приехал или задачи нет. */
  izKesha(id: string): Z | undefined;
  /** Разбор решателем прототипа: считается один раз на задачу; null — решатель не приехал. */
  reshenie(z: Z): S | null;
  /** Набрать текст с формулами $…$; пока KaTeX не приехал — как есть. */
  nabrat(text: string): string;
  /** Прототип задачи (рисунок условия у №6); null — решатель не приехал. */
  prototip(id: string): P | null;
}

/**
 * Загрузчик раздела. `url` — адрес файла прототипа, `reshatel` — ленивый
 * импорт модуля прототипов раздела (он тяжёлый и в страницу не входит).
 */
export function createZagruzka<
  Z extends ZadachaFayla,
  S,
  P extends { solve(params: Z['params']): S } = { solve(params: Z['params']): S },
>({
  url,
  reshatel,
  nabor,
}: {
  url: (prototip: string) => string;
  reshatel: () => Promise<(id: string) => P>;
  /**
   * Набор формул раздела, если не обычный typeset (№11: крупные дроби в
   * условии, как в прежнем тренажёре). Нет — lib/tex, typeset.
   */
  nabor?: () => Promise<(text: string) => string>;
}): Zagruzka<Z, S, P> {
  const fayly = new Map<string, Promise<void>>();
  const zadachi = new Map<string, Z>();
  const resheniya = new Map<string, S>();
  let nabran: ((text: string) => string) | null = null;
  let prototip: ((id: string) => P) | null = null;
  let obshcheeZhdyot: Promise<void> | null = null;

  function zagruzitObshchee(): Promise<void> {
    obshcheeZhdyot ??= Promise.all([
      nabor === undefined ? import('@/lib/tex').then((tex) => tex.typeset) : nabor(),
      reshatel(),
    ]).then(([t, r]) => {
      nabran = t;
      prototip = r;
    });
    obshcheeZhdyot.catch(() => {
      obshcheeZhdyot = null;
    });
    return obshcheeZhdyot;
  }

  function zagruzitPrototip(p: string): Promise<void> {
    let zhdyot = fayly.get(p);
    if (zhdyot === undefined) {
      zhdyot = fetch(url(p)).then(async (r) => {
        if (!r.ok) throw new Error(`${p}.json: ${r.status}`);
        for (const z of (await r.json()) as Z[]) {
          zadachi.set(z.id, z);
        }
      });
      fayly.set(p, zhdyot);
      zhdyot.catch(() => {
        fayly.delete(p);
      });
    }
    return zhdyot;
  }

  return {
    async zagruzit(prototipy) {
      await Promise.all([zagruzitObshchee(), ...[...new Set(prototipy)].map(zagruzitPrototip)]);
    },
    izKesha(id) {
      return prototip === null ? undefined : zadachi.get(id);
    },
    reshenie(z) {
      const gotovo = resheniya.get(z.id);
      if (gotovo !== undefined) return gotovo;
      if (prototip === null) return null;
      try {
        const s = prototip(z.prototypeId).solve(z.params);
        resheniya.set(z.id, s);
        return s;
      } catch {
        return null;
      }
    },
    nabrat(text) {
      return nabran === null ? text : nabran(text);
    },
    prototip(id) {
      if (prototip === null) return null;
      try {
        return prototip(id);
      } catch {
        return null;
      }
    },
  };
}
