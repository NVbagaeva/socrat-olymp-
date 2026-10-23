import { chertezhMosta, type RezhimMosta } from '@/lib/zadanie10/chertezh/most';
import type { Params } from '@/lib/zadanie10/types';

/**
 * Чертёж моста к задаче П-01 (SVG собирается при сборке страницы).
 * Мост выводится всегда, когда он нужен по условию, — и на сайте, и в
 * PDF-листах, независимо от настройки «картинки сюжетов».
 */
export function Most10({ params, rezhim }: { params: Params; rezhim: RezhimMosta }) {
  const { svg } = chertezhMosta(
    { a: Number(params.a), b: Number(params.b), c: Number(params.c), x: Number(params.x) },
    rezhim,
  );
  return <div className="z10-most-wrap" dangerouslySetInnerHTML={{ __html: svg }} />;
}
