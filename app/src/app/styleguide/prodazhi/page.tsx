import type { Metadata } from 'next';
import { assetUrl } from '@/lib/assetUrl';
import {
  BESPLATNO,
  DO_EGE,
  PERIOD_DNEY,
  PLATNYE,
  PROBNYY,
  rubli,
  segodnya,
  tsenaDoEge,
  type Rol,
} from '@/lib/tarify/config';
import './prodazhi.css';

/* Служебная страница аудита продаж (docs/audit-prodazhi.md): макеты-
   предложения главной и тарифов, по два варианта. Это не боевые
   страницы — только картинка для выбора. Цены и лимиты берутся из
   lib/tarify/config.ts, правила тарифов здесь не меняются. Отзывов,
   цифр учеников и баллов нет: на их месте — пустые рамки «собрать». */
export const metadata: Metadata = {
  title: 'Будет на ЕГЭ — макеты продаж',
  robots: { index: false, follow: false },
};

const PORTRET = assetUrl('/images/author/nata-portrait.webp');
const KRISTALL = assetUrl('/hero/hero-kristall-600.webp');
const LAMPA = assetUrl('/images/lightbulb.webp');

/* Сколько 30-дневных оплат понадобится до конца срока «До ЕГЭ» —
   для честного якоря цены: «помесячно вышло бы …». */
function mesyacevDoEge(): number {
  const ot = new Date(`${segodnya()}T00:00:00Z`).getTime();
  const do_ = new Date(`${DO_EGE.data}T00:00:00Z`).getTime();
  return Math.max(1, Math.ceil((do_ - ot) / (PERIOD_DNEY * 86400000)));
}

function Yakor({ rol }: { rol: Rol }) {
  const ege = tsenaDoEge(rol);
  if (ege === null) return null;
  const n = mesyacevDoEge();
  const pomesyachno = PLATNYE[rol].tsena30 * n;
  if (pomesyachno <= ege) return null;
  return (
    <p className="pz-yakor">
      <s>{rubli(pomesyachno)}</s> помесячно ({n} × {rubli(PLATNYE[rol].tsena30)}) —{' '}
      <b>выгоднее на {rubli(pomesyachno - ege)}</b>
    </p>
  );
}

function Metka({ children }: { children: React.ReactNode }) {
  return <p className="pz-metka">{children}</p>;
}

function Avtor({ kompakt = false }: { kompakt?: boolean }) {
  return (
    <figure className={kompakt ? 'pz-avtor pz-avtor--kompakt' : 'pz-avtor'}>
      <img src={PORTRET} alt="" width={600} height={953} loading="lazy" />
      <figcaption>
        <b>Наталия Витальевна Багаева</b>
        <span>
          Учитель математики, эксперт ГИА. РУДН с отличием, магистратура НИУ ВШЭ и Центра
          педагогического мастерства.
        </span>
        {!kompakt && (
          <span className="pz-avtor__s">
            Руководит методобъединением математики в гимназии «Сократ». Готовила
            физико-математические классы и олимпиадников.
          </span>
        )}
      </figcaption>
    </figure>
  );
}

/* ── Тарифы ──────────────────────────────────────────────────────── */

function TarifyA() {
  return (
    <div className="pz-ekran">
      <header className="pz-t-shapka">
        <Metka>Тарифы</Metka>
        <h3 className="pz-h1 pz-c">Занимайтесь бесплатно. Полный доступ — когда понадобится</h3>
        <p className="pz-lid pz-c">
          Без автопродления и привязки карты. {PROBNYY.dney} дней полного доступа — бесплатно.
        </p>
        <div className="pz-pereklyuchatel">
          <span className="is-on">Я ученик</span>
          <span>Я учитель</span>
          <span>Я родитель</span>
        </div>
      </header>

      <div className="pz-plashki">
        <article className="pz-plashka pz-plashka--glavnaya">
          <span className="pz-plashka__metka">Выгоднее всего</span>
          <h5>Ученик · до ЕГЭ</h5>
          <p className="pz-plashka__cena">{rubli(tsenaDoEge('uchenik') ?? 0)}</p>
          <p className="pz-plashka__srok">одна оплата, доступ {DO_EGE.podpis}</p>
          <Yakor rol="uchenik" />
          <ul className="pz-galki">
            <li>Подсказки учителя во всех тренажёрах</li>
            <li>Тренажёр без ограничений, все опорные задачи</li>
            <li>Работа над ошибками, прогресс и история</li>
            <li>Все варианты с баллами, включая повышенной сложности</li>
          </ul>
          <span className="pz-knopka pz-knopka--teplaya">Узнать об открытии оплаты</span>
          <small>Оплата откроется скоро. Пока — занимайтесь бесплатно.</small>
        </article>
        <article className="pz-plashka">
          <h5>Ученик · 30 дней</h5>
          <p className="pz-plashka__cena">{rubli(PLATNYE.uchenik.tsena30)}</p>
          <p className="pz-plashka__srok">за {PERIOD_DNEY} дней, без автопродления</p>
          <ul className="pz-galki">
            <li>Всё то же, что «до ЕГЭ»</li>
            <li>Удобно, чтобы подтянуть одну тему</li>
          </ul>
          <span className="pz-knopka pz-knopka--steklo">
            Попробовать {PROBNYY.dney} дней бесплатно
          </span>
        </article>
        <article className="pz-plashka pz-plashka--tiho">
          <h5>Бесплатно</h5>
          <p className="pz-plashka__cena">{rubli(0)}</p>
          <p className="pz-plashka__srok">навсегда, без карты</p>
          <ul className="pz-galki">
            <li>Теория и «О задании» целиком</li>
            <li>{BESPLATNO.trenazherVDen} задач тренажёра в день</li>
            <li>Первый блок опорных задач</li>
          </ul>
          <span className="pz-knopka pz-knopka--steklo">Начать заниматься</span>
        </article>
      </div>

      <section className="pz-sek pz-dva">
        <Avtor kompakt />
        <div className="pz-garantii">
          <p>
            <b>Без автопродления.</b> Доступ заканчивается сам, карта не привязывается.
          </p>
          <p>
            <b>Возврат за оставшиеся дни.</b> По условиям оферты, если передумали.
          </p>
          <p>
            <b>Прогресс сохраняется.</b> Ничего не пропадает, когда срок закончится.
          </p>
        </div>
      </section>

      <section className="pz-sek">
        <h4 className="pz-h2">Частые вопросы</h4>
        <div className="pz-faq">
          <p>Чем это лучше бесплатных сайтов с задачами?</p>
          <p>Подойдёт, если ребёнок сдаёт базу?</p>
          <p>Можно ли отменить и вернуть деньги?</p>
          <p>Нужен ли тариф ученикам моего репетитора?</p>
          <p>Чем пробный доступ отличается от бесплатного?</p>
          <p>Будет ли автопродление?</p>
        </div>
      </section>
    </div>
  );
}

function TarifyB() {
  return (
    <div className="pz-ekran pz-ekran--b">
      <header className="pz-t-shapka">
        <Metka>Тарифы</Metka>
        <h3 className="pz-h1 pz-c">Один доступ — до самого экзамена</h3>
        <p className="pz-lid pz-c">
          Выберите, кто будет заниматься. Начать можно бесплатно, а полный доступ — попробовать{' '}
          {PROBNYY.dney} дней без карты.
        </p>
      </header>

      <div className="pz-dva-puti">
        <article>
          <img src={LAMPA} alt="" width={200} height={181} loading="lazy" />
          <Metka>Для ученика</Metka>
          <h5>Ученик</h5>
          <p className="pz-plashka__cena">
            {rubli(tsenaDoEge('uchenik') ?? 0)} <span>{DO_EGE.podpis}</span>
          </p>
          <Yakor rol="uchenik" />
          <p className="pz-plashka__srok">
            или {rubli(PLATNYE.uchenik.tsena30)} за {PERIOD_DNEY} дней
          </p>
          <p>Тренажёр без ограничений, работа над ошибками, все варианты с баллами.</p>
          <span className="pz-knopka">Попробовать {PROBNYY.dney} дней бесплатно</span>
        </article>
        <article className="pz-dva-puti__teplyy">
          <img src={KRISTALL} alt="" width={600} height={600} loading="lazy" />
          <Metka>Для репетитора и учителя</Metka>
          <h5>Репетитор</h5>
          <p className="pz-plashka__cena">
            {rubli(tsenaDoEge('repetitor') ?? 0)} <span>{DO_EGE.podpis}</span>
          </p>
          <Yakor rol="repetitor" />
          <p className="pz-plashka__srok">
            или {rubli(PLATNYE.repetitor.tsena30)} за {PERIOD_DNEY} дней
          </p>
          <p>Генератор без ограничений, листы с решениями, классы и домашние задания.</p>
          <span className="pz-knopka pz-knopka--teplaya">
            Попробовать {PROBNYY.dney} дней бесплатно
          </span>
        </article>
      </div>

      <div className="pz-polosa">
        <b>Бесплатно, навсегда:</b> теория, первые опорные задачи, {BESPLATNO.trenazherVDen} задач
        тренажёра в день. <span className="pz-ssylka">Начать →</span>
      </div>

      <div className="pz-skoro">
        <div>
          <b>Оплата откроется скоро</b>
          <p>
            Сообщим в Telegram-канале в день открытия. Почту не собираем — подписка в один клик.
          </p>
        </div>
        <span className="pz-knopka pz-knopka--steklo">Подписаться на канал</span>
      </div>
    </div>
  );
}

const VARIANTY_GLAVNOY = [
  {
    href: '/styleguide/prodazhi/glavnaya-1/',
    nazvanie: 'Главная · вариант 1 «В первом экране»',
    tekst:
      'Под лидом — тихая ссылка «Тарифы — от 390 ₽ в месяц» и плашка автора: фото, имя, одна строка. На телефоне — под кнопкой «Начать бесплатно». Короткий блок цен — в конце страницы, после банка заданий.',
  },
  {
    href: '/styleguide/prodazhi/glavnaya-2/',
    nazvanie: 'Главная · вариант 2 «Отдельными блоками»',
    tekst:
      'Первый экран почти не меняется: ссылка на тарифы — строкой под дверями. Плашка автора — отдельной узкой полосой после блока «вечер». Блок цен — перед банком заданий.',
  },
];

export default function Page() {
  return (
    <main className="pz">
      <header className="pz-vvod">
        <p className="pz-metka">Служебная страница · аудит продаж</p>
        <h1>Добавки главной и макеты тарифов</h1>
        <p>
          Главная остаётся как есть: первый экран, кристалл, двери, показатели, блок «вечер», банк
          заданий, переключатель уровня, заставка и попугай на месте. Добавляются только плашка
          автора и цены. Два варианта размещения открываются на настоящей главной — выберите один.
          Ниже — макеты страницы тарифов (для волны 3). Подробности — docs/audit-prodazhi.md.
        </p>
      </header>

      <section className="pz-variant">
        <h2>Главная: где поставить автора и цены</h2>
        <div className="pz-ssylki">
          {VARIANTY_GLAVNOY.map((v) => (
            <a key={v.href} className="pz-ssylka-karta" href={v.href}>
              <b>{v.nazvanie}</b>
              <span>{v.tekst}</span>
              <span className="pz-ssylka">Открыть →</span>
            </a>
          ))}
        </div>
      </section>

      <section className="pz-variant">
        <h2>Тарифы · вариант А «Сначала выгодный» — выбран для волны 3</h2>
        <p className="pz-pochemu">
          Первая плашка — «до ЕГЭ» с честным якорем (помесячно вышло бы дороже). Бесплатный —
          последним и тише. Состояние «оплата скоро» — не серая мёртвая кнопка, а понятный следующий
          шаг. Рядом — автор и три гарантии, ниже — вопросы, которые задают родители.
        </p>
        <TarifyA />
      </section>

      <section className="pz-variant">
        <h2>Тарифы · вариант Б «Два пути»</h2>
        <p className="pz-pochemu">
          Две большие колонки: ученик и репетитор, у каждой — цена до ЕГЭ и запасной вариант на 30
          дней. Бесплатный доступ — строкой. Пока оплаты нет — подписка на канал, без сбора почты.
        </p>
        <TarifyB />
      </section>
    </main>
  );
}
