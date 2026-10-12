import Link from 'next/link';
import { Tex } from '@/components/ui/Tex';
import { TEORIYA_7_TEKSTY } from '@/content/teoriya7';
import { kodNaSayte, prototype } from '@/lib/zadanie7/prototypes';

const T = TEORIYA_7_TEKSTY;

/** «Где на ЕГЭ»: прототипы карточки, по нажатию — тренажёр с ними. */
export function GdeNaEge7({ prototipy, trenazher }: { prototipy: string[]; trenazher: string }) {
  if (prototipy.length === 0) {
    return null;
  }
  return (
    <p className="z7-gde">
      <span className="z7-gde__label">{T.gdeNaEge}:</span>
      {prototipy.map((id) => (
        <Link className="z7-gde__chip" href={`${trenazher}?tipy=${id}`} key={id}>
          {kodNaSayte(id)} <Tex text={prototype(id).title} />
        </Link>
      ))}
    </p>
  );
}
