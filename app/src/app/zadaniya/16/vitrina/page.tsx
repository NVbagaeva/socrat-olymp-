import type { Metadata } from 'next';
import { Chertezh16 } from '@/components/zadanie16/Chertezh16';
import { Rabota16 } from '@/components/zadanie16/Rabota16';
import { Tex } from '@/components/ui/Tex';
import { PRIMER_OTVETA_16 } from '@/content/teoriya16';
import { katex } from '@/lib/graph/katex';
import { typeset } from '@/lib/tex';
import { PRIMERY_CHERTEZHEY_16, PROBNAYA_RABOTA_16 } from '@/lib/zadanie16/primery';
import 'katex/dist/katex.min.css';
import '../zadanie16.css';

export const metadata: Metadata = {
  title: 'Витрина чертежей · Задание 16 — Будет на ЕГЭ',
  robots: { index: false, follow: false },
};

/**
 * Служебная страница: чертежи задания №16 (прямая метода интервалов,
 * эскизы парабол) и пробная работа с проверкой ответа — для ручной
 * проверки движка. noindex, ссылок на неё из меню нет.
 */
export default function Vitrina16Page() {
  return (
    <main className="z16-vit">
      <h1 className="z16-vit__title">Витрина чертежей · задание 16</h1>
      <ul className="z16-vit__grid">
        {PRIMERY_CHERTEZHEY_16.map((p) => (
          <li className="z16-card" key={p.id}>
            <h2 className="z16-card__title">
              <Tex text={p.title} />
            </h2>
            <Chertezh16 spec={p.spec} />
          </li>
        ))}
      </ul>
      <h2 className="z16-vit__title">Пробная работа</h2>
      <Rabota16
        primerHtml={typeset(PRIMER_OTVETA_16)}
        zadaniya={PROBNAYA_RABOTA_16.map((z) => ({
          id: z.id,
          uslovieHtml: typeset(z.uslovie),
          otvet: z.otvet,
          otvetHtml: katex.renderToString(z.otvet, { throwOnError: true }),
        }))}
      />
    </main>
  );
}
