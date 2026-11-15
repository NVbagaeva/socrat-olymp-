import Link from 'next/link';
import { OPTIMIZACIYA13 } from '@/content/ekonomicheskie13';
import { glavaHref13 } from '@/lib/zadanie13/links';
import { glavaHref21 } from '@/lib/zadanie21/links';
import { YakorTipa } from '../karta/YakorTipa';
import { ZadachiIzVariantov13 } from './ZadachiIzVariantov13';

/**
 * Вкладка «На оптимизацию» — второй вид задач задания (ЕГЭ-2027): все
 * задачи прежнего №17 вида «на оптимизацию» из вариантов, по сюжетам.
 * У каждой — условие, решение по этапам и ответ (данные вариантов).
 */
export function Optimizaciya13() {
  const T = OPTIMIZACIYA13;
  return (
    <div className="kz z13-karta z13-opt">
      <YakorTipa />
      <section className="kz-razdel" aria-labelledby="z13-opt-title">
        <div className="kz-razdel__head">
          <h2 className="stk-h3" id="z13-opt-title">
            {T.title}
          </h2>
          <p className="stk-lead">{T.lead}</p>
          <p className="stk-lead z13-opt__demo">{T.demo}</p>
        </div>
        <div className="kz-knopki z13-opt__knopki">
          <Link className="stk-btn stk-btn--primary" href={glavaHref13('optimizaciya')}>
            {T.teoriya}
          </Link>
          <Link className="stk-btn stk-btn--tihaya" href={glavaHref21('otrezok')}>
            {T.teoriya12}
          </Link>
        </div>
        <ZadachiIzVariantov13 vid="optimizaciya" />
      </section>
    </div>
  );
}
