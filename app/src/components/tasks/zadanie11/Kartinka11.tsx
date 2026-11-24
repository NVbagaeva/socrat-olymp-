import { KartinkaZadachi } from '@/components/ui/KartinkaZadachi';
import { kartinka11 } from '@/lib/zadanie11/kartinki';

/**
 * Картинка сюжета подтипа №11 (lib/zadanie11/kartinki.ts) — для примера
 * типа во вкладке «О задании». Нет картинки у подтипа — ничего (пустых
 * рамок нет).
 */
export function Kartinka11({ podtip }: { podtip: string }) {
  const k = kartinka11(podtip);
  if (k === undefined) {
    return null;
  }
  return <KartinkaZadachi src={k.src} src280={k.src280} alt={k.alt} />;
}

/** Есть ли картинка у подтипа: слот выводится только тогда. */
export function estKartinka11(podtip: string): boolean {
  return kartinka11(podtip) !== undefined;
}
