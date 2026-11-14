import { texPlain } from '@/lib/tex';
import type { Razbor11 } from '@/lib/zadanie11/trening/reshatel';

/** Ответ примера для бланка: число с запятой и минусом; у задачи с выбором — верный вариант. */
export function otvetPrimera11(r: Razbor11, vybory: readonly string[] | undefined): string {
  if (r.vybor !== undefined && vybory !== undefined) {
    return texPlain(vybory[r.vybor - 1] ?? '');
  }
  return String(r.answer).replace('.', ',').replace('-', '−');
}
