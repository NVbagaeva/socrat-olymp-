import type { Metadata } from 'next';
import './ob-avtore.css';

/* Оглавление черновиков «Об авторе» — только для разработки
   (page.dev.tsx: маршрут есть лишь в `next dev` или со флагом
   GALEREYA=1). В меню не входит, в обычной сборке страницы нет. */
export const metadata: Metadata = {
  title: 'Об авторе — два варианта композиции',
  robots: { index: false, follow: false },
};

const VARIANTY = [
  {
    href: '/styleguide/ob-avtore/portret/',
    title: 'Вариант «Портрет»',
    lead: 'Крупное фото и имя в первом экране, дальше спокойная лента блоков в две колонки.',
  },
  {
    href: '/styleguide/ob-avtore/razvorot/',
    title: 'Вариант «Журнальный разворот»',
    lead: 'Асимметричная сетка, крупная типографика, бюст и рукописные пометки на полях.',
  },
];

export default function Page() {
  return (
    <main className="oa oa-oglavlenie">
      <div className="oa-wrap">
        <p className="oa-kicker">Служебная страница</p>
        <h1 className="oa-h2">«Об авторе»: два варианта композиции</h1>
        <p className="oa-text">
          Настоящие тексты и картинки боевой страницы. Рамки с пунктиром — места, где текста на
          странице сейчас нет.
        </p>
        <div className="oa-polza">
          {VARIANTY.map((item) => (
            <a
              className="oa-steklo oa-polza__karta oa-oglavlenie__link"
              href={item.href}
              key={item.href}
            >
              <b className="oa-h3 oa-h3--big">{item.title}</b>
              <span className="oa-text">{item.lead}</span>
            </a>
          ))}
        </div>
      </div>
    </main>
  );
}
