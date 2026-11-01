/**
 * Оглавления банков №4 и №5 и файлы вариантов — на сборке.
 *
 * Страницы тренажёра и листа получают оглавление (dannye45.ts), а
 * маршруты app/zadaniya/{4,5}/dannye/ отдают по варианту в файле.
 * Версия варианта в оглавлении — отпечаток того самого JSON, что
 * лежит в файле: банк собирается детерминированно (отпечатки и
 * шифр разбора зависят только от задачи), поэтому страница и файл,
 * собранные разными процессами сборки, сходятся.
 */

import { fingerprint } from '@/lib/secret';
import {
  SOL_USLOVIYA,
  type IndeksLista,
  type IndeksPool,
  type IndeksUznay,
  type Nabor45,
} from './dannye45';
import {
  bank4Pool,
  bank5Pool,
  uznayMetodPool,
  type Pool,
  type PoolVariant,
  type UznayPool,
  type UznayVariant,
} from './pool';

/** Версия файла варианта: отпечаток его JSON. */
function versiya(variant: PoolVariant | UznayVariant): string {
  return fingerprint('v45:', JSON.stringify(variant)).slice(0, 10);
}

export function bankPool(zadanie: 4 | 5): Pool {
  return zadanie === 4 ? bank4Pool() : bank5Pool();
}

const uznayKesh = new Map<4 | 5, UznayPool>();

/** «Узнай метод» считается один раз на процесс, как и банк. */
export function uznayPool(zadanie: 4 | 5): UznayPool {
  let pool = uznayKesh.get(zadanie);
  if (pool === undefined) {
    pool = uznayMetodPool(zadanie);
    uznayKesh.set(zadanie, pool);
  }
  return pool;
}

/** Оглавление банка отработки: подписи прототипов, номера и версии вариантов. */
export function indeksPool(zadanie: 4 | 5): IndeksPool {
  const pool = bankPool(zadanie);
  return {
    bloki: pool.bloki,
    kinds: pool.kinds.map(({ variants, ...kind }) => ({
      ...kind,
      variants: variants.map((v) => ({ n: v.n, v: versiya(v) })),
    })),
  };
}

/** Оглавление «Узнай метод». */
export function indeksUznay(zadanie: 4 | 5): IndeksUznay {
  return {
    kinds: uznayPool(zadanie).kinds.map(({ variants, ...kind }) => ({
      ...kind,
      variants: variants.map((v) => ({ n: v.n, v: versiya(v) })),
    })),
  };
}

/** Оглавление листа: то же, что у тренажёра, и отпечаток условия варианта. */
export function indeksLista(zadanie: 4 | 5): IndeksLista {
  const pool = bankPool(zadanie);
  return {
    bloki: pool.bloki,
    kinds: pool.kinds.map(({ variants, ...kind }) => ({
      ...kind,
      variants: variants.map((v) => ({
        n: v.n,
        v: versiya(v),
        u: fingerprint(SOL_USLOVIYA, v.uslovie),
      })),
    })),
  };
}

/** Параметры маршрута файлов: прототип и имя файла «<n>.json». */
export interface ParametryFayla {
  kind: string;
  fail: string;
}

/** Все файлы набора — для generateStaticParams. */
export function vseFayly(zadanie: 4 | 5, nabor: Nabor45): ParametryFayla[] {
  const kinds = nabor === 'uznay' ? uznayPool(zadanie).kinds : bankPool(zadanie).kinds;
  return kinds.flatMap((kind) =>
    kind.variants.map((v) => ({ kind: kind.id, fail: `${v.n}.json` })),
  );
}

/** Содержимое файла: вариант набора как есть. Нет такого — null. */
export function faylVarianta(
  zadanie: 4 | 5,
  nabor: Nabor45,
  { kind, fail }: ParametryFayla,
): PoolVariant | UznayVariant | null {
  const m = /^(\d+)\.json$/.exec(fail);
  if (m === null) {
    return null;
  }
  const n = Number(m[1]);
  const kinds: readonly { id: string; variants: readonly (PoolVariant | UznayVariant)[] }[] =
    nabor === 'uznay' ? uznayPool(zadanie).kinds : bankPool(zadanie).kinds;
  return kinds.find((k) => k.id === kind)?.variants.find((v) => v.n === n) ?? null;
}

/** Ответ маршрута файла варианта. */
export async function otvetFayla(
  zadanie: 4 | 5,
  nabor: Nabor45,
  params: Promise<ParametryFayla>,
): Promise<Response> {
  const variant = faylVarianta(zadanie, nabor, await params);
  return variant === null
    ? new Response('нет такого варианта', { status: 404 })
    : Response.json(variant);
}
