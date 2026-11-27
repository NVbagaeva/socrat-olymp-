import type { ReactNode } from 'react';
import { assetUrl } from '@/lib/assetUrl';

/* Портрет первого экрана: фото в скруглённой рамке на синей подложке.
   За ним — приглушённые окружность и парабола (статичные). У нижних
   углов рамки — учебный натюрморт: мраморный бюст и стеклянная
   пирамида. Плашка с формулой убрана: она наезжала на построение. */
export function Stsena({ children }: { children: ReactNode }) {
  return (
    <div className="oa-portret">
      <svg className="oa-portret__geo" viewBox="0 0 400 400" aria-hidden="true" focusable="false">
        <circle className="oa-portret__krug" cx="200" cy="200" r="186" />
        <path className="oa-portret__parabola" d="M24 40 Q200 520 376 40" />
      </svg>
      <figure className="oa-portret__ramka">{children}</figure>
      <img
        className="oa-portret__byust"
        src={assetUrl('/images/author/bust-marble-400.webp')}
        srcSet={`${assetUrl('/images/author/bust-marble-400.webp')} 400w, ${assetUrl('/images/author/bust-marble-675.webp')} 675w`}
        sizes="(max-width: 767px) 90px, 140px"
        alt=""
        aria-hidden="true"
        width="675"
        height="900"
        decoding="async"
      />
      <img
        className="oa-portret__piramida"
        src={assetUrl('/images/glass/piramida-steklo.webp')}
        srcSet={`${assetUrl('/images/glass/piramida-steklo.webp')} 500w, ${assetUrl('/images/glass/piramida-steklo-large.webp')} 1000w`}
        sizes="(max-width: 767px) 80px, 120px"
        alt=""
        aria-hidden="true"
        width="500"
        height="443"
        decoding="async"
      />
    </div>
  );
}
