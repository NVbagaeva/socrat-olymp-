/**
 * Материалы к заданию. Названия заданы автором; ни у одного пока нет
 * содержимого, кроме интерактивной тетради — у неё есть страница.
 */

export type MaterialId = 'notebook' | 'practice-pdf' | 'theory-short' | 'video';

export interface Material {
  id: MaterialId;
  title: string;
  /** active — материал открывается, soon — карточка помечена «Готовится». */
  status: 'active' | 'soon';
}

export const materials: Material[] = [
  { id: 'notebook', title: 'Интерактивная тетрадь', status: 'active' },
  { id: 'practice-pdf', title: 'PDF-практикум', status: 'soon' },
  { id: 'theory-short', title: 'Краткая теория', status: 'soon' },
  { id: 'video', title: 'Видеоразборы', status: 'soon' },
];

export function findMaterial(id: MaterialId): Material | undefined {
  return materials.find((item) => item.id === id);
}
