import type { Metadata } from 'next';
import { BANK } from '@/lib/proizvodnaya/bank';
import { slugPrototipa } from '@/lib/proizvodnaya/otpechatokRisunka';
import { PROTOTYPES } from '@/lib/proizvodnaya/prototypes';
import { href } from '@/lib/paths';
import './galereya.css';

/* Служебная галерея банка задания №9: список прототипов со ссылками на
   страницы, где все аналоги банка нарисованы сеткой. В меню сайта её
   нет, поисковикам она закрыта. */

export const metadata: Metadata = {
  title: 'Банк задания №9 — галерея рисунков',
  robots: { index: false, follow: false },
};

export default function Galereya9() {
  const count = new Map(BANK.map((e) => [e.prototype, e.variants.length]));
  return (
    <main className="g9">
      <h1 className="t-h2">Банк задания №9: галерея</h1>
      <p className="g9__stat">
        Служебная страница для просмотра банка глазами. Выберите прототип — откроются все его
        аналоги с рисунком ученика и ответом.
      </p>
      <nav className="g9__nav" aria-label="Прототипы">
        {PROTOTYPES.map((p) => (
          <a key={p.id} href={href('styleguide', 'zadanie-9', slugPrototipa(p.id))}>
            {p.id} · {count.get(p.id) ?? 0}
          </a>
        ))}
      </nav>
    </main>
  );
}
