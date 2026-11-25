/**
 * Ответ опорной задачи для «В домашку» учителя (этап 4в, docs/kabinet-dz2.md):
 * закрыт ключом «id|otvet», как разбор, и открывается только по нажатию
 * кнопки. Добавляется на странице блока, а не в данных раздела: файлы
 * содержания (lib/zadanieN/opornye.ts) редизайн не трогает
 * (scripts/check-redesign.mjs).
 */

export function sOtvetomDz<T extends { id: string }>(
  zadachi: readonly T[],
  iskhodnye: readonly { id: string; answer: number | string }[],
  sealText: (text: string, seed: string) => string,
): (T & { otvet: string })[] {
  const otvety = new Map(iskhodnye.map((z) => [z.id, String(z.answer)]));
  return zadachi.map((z) => {
    const otvet = otvety.get(z.id);
    if (otvet === undefined) throw new Error(`нет ответа опорной задачи ${z.id}`);
    return { ...z, otvet: sealText(otvet, `${z.id}|otvet`) };
  });
}
