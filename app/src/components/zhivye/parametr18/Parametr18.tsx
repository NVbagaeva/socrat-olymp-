import { ZHIVOY_19 } from '@/content/zadanie19';
import { PARAMETR18 } from '@/content/zhivye18';
import { zhivoy19, type Zhivoy19 } from '@/lib/zadanie19/zhivye';
import { ZhivayaKartochka } from '../Kartochka';
import { ParametrLazy } from './ParametrLazy';

/** Заголовок — по тому, что движет параметр (как у прежнего блока). */
function zagolovok(z: Zhivoy19): string {
  if (z.vid === 'sdvig') return ZHIVOY_19.titleSdvig;
  if (z.vid === 'okruzhnost') return ZHIVOY_19.titleOkruzhnost;
  if (z.vid === 'gorizontal') return ZHIVOY_19.titleGorizontal;
  if (z.vid === 'grafik') return ZHIVOY_19.titleGrafik;
  if (z.vid === 'parametr') return ZHIVOY_19.titleParametr;
  return ZHIVOY_19.title;
}

/**
 * Живая сцена параметра (теория №18) по описанию id из
 * lib/zadanie19/zhivye.ts: стеклянная карточка, сцена — ленивым куском.
 * Заменила Zhivoy19 со слайдером.
 */
export function ZhivoyParametr18({ id }: { id: string }) {
  const z = zhivoy19(id);
  if (z === undefined) return null;
  const T = PARAMETR18;
  const lead =
    z.mnozhestvo !== undefined
      ? T.lead.mnozhestvo
      : z.resheniy !== undefined
        ? T.lead.resheniy
        : T.lead.itog;
  return (
    <ZhivayaKartochka id={`zv18-${id}`} nad={T.nad} zag={zagolovok(z)} lead={lead}>
      <ParametrLazy id={id} />
    </ZhivayaKartochka>
  );
}
