import type { Metadata } from 'next';
import { KakNaiti14 } from '@/components/zadanie14/KakNaiti14';
import {
  KotikBanner14,
  KotikKartinka14,
  KotikPolosa14,
} from '@/components/zadanie14/KotikBanner14';
import { Kotik3d } from '@/components/zadanie14/kotik3d/Kotik3d';
import { MAKETY_ID } from '@/components/zadanie14/Krug14';
import { Okruzhnost14 } from '@/components/zadanie14/Okruzhnost14';
import { ZADANIE14, zadanie14Title } from '@/content/zadanie14';
import { ZADANIYA } from '@/lib/paths';
import { scopeOfPath } from '@/lib/trainerSession/scope';

export const metadata: Metadata = {
  title: zadanie14Title('Тренажёр: тригонометрическая окружность'),
};

const BASE = `${ZADANIYA}/${ZADANIE14.slug}`;
const ADRES = `${BASE}/okruzhnost/trenazher/`;
const MAKETY = `${BASE}/teoriya/#${MAKETY_ID}`;

/**
 * Вкладка «Окружность» №14: тренажёр раскладки углов по точкам
 * тригонометрической окружности. Адрес — …/okruzhnost/trenazher/:
 * раздел сессии «14:okruzhnost», и ссылка «продолжить» из кабинета
 * (trainerHref) ведёт ровно сюда.
 */
export default function Okruzhnost14Tab() {
  return (
    <section className="flow" aria-labelledby="ok14-title">
      <h2 className="ok14-title" id="ok14-title">
        Тренажёр: тригонометрическая окружность
      </h2>
      <Okruzhnost14
        base={ADRES}
        scope={scopeOfPath(ADRES) ?? '14:okruzhnost'}
        kotikPolny={
          <KotikBanner14
            href={MAKETY}
            className="ok14-kotik__banner"
            kartinka={<Kotik3d rezhim="banner" zapasnaya={<KotikKartinka14 />} />}
          />
        }
        kotikKartinka={<KotikKartinka14 />}
        kotikPolosa={<KotikPolosa14 href={MAKETY} />}
        spravka={<KakNaiti14 teoriyaHref={`${BASE}/teoriya/#t-p01-okruzhnost`} />}
      />
    </section>
  );
}
