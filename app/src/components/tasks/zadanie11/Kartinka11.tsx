import { assetUrl } from '@/lib/assetUrl';
import { kartinka11 } from '@/lib/zadanie11/kartinki';

/**
 * Картинка к задаче №11 (lib/zadanie11/kartinki.ts) — как есть, во всю
 * ширину колонки, без обрезки. Нет картинки у подтипа — ничего (пустых
 * рамок нет).
 */
export function Kartinka11({ podtip }: { podtip: string }) {
  const k = kartinka11(podtip);
  if (k === undefined) {
    return null;
  }
  return (
    <img
      className="z11-kartinka"
      src={assetUrl(k.src)}
      alt={k.alt}
      width={k.width}
      height={k.height}
      decoding="async"
      loading="lazy"
    />
  );
}

/** Есть ли картинка у подтипа: слот выводится только тогда. */
export function estKartinka11(podtip: string): boolean {
  return kartinka11(podtip) !== undefined;
}
