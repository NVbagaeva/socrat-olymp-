import Image from 'next/image';
import Link from 'next/link';
import { ZADANIE13, ZAGLUSHKI_13 } from '@/content/zadanie13';
import { assetUrl } from '@/lib/assetUrl';
import { ZADANIYA } from '@/lib/paths';

/** Вкладка №13, которая ещё не готова: что в ней будет и ссылка на теорию. */
export function Zaglushka13({ vkladka }: { vkladka: keyof typeof ZAGLUSHKI_13 }) {
  const z = ZAGLUSHKI_13[vkladka] ?? { title: 'Вкладка готовится', text: '' };
  return (
    <section className="task-stub" aria-labelledby="z13-stub-title">
      <div className="task-stub__art">
        <Image
          src={assetUrl(`/images/task-${ZADANIE13.no}.webp`)}
          alt=""
          width={240}
          height={240}
        />
      </div>
      <div className="task-stub__text">
        <h2 id="z13-stub-title" className="t-h4">
          {z.title}
        </h2>
        <p className="task-stub__lead">{z.text}</p>
        <Link
          className="btn btn--primary task-stub__cta"
          href={`${ZADANIYA}/${ZADANIE13.slug}/teoriya/`}
        >
          Открыть теорию
          <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path d="M5 12h13M12 6l6 6-6 6" />
          </svg>
        </Link>
      </div>
    </section>
  );
}
