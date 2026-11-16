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

/* Макет шага тренажёра: как выглядит подсказка-вопрос. Задача — схема
   в духе №8 «Производная» (физический смысл); в работе — снимок экрана. */
function DemoPodskazka() {
  return (
    <div className="pz-demo" aria-label="Пример подсказки в тренажёре">
      <div className="pz-demo__bar">
        <span>Тренажёр · №8</span>
        <span>Задача 3 из 10</span>
      </div>
      <p className="pz-demo__usl">
        Точка движется по закону x(t) = t² − 4t + 7. Найдите её скорость в момент t = 5.
      </p>
      <div className="pz-demo__otvet pz-demo__otvet--oshibka">
        Ваш ответ: 12 <span>не сходится</span>
      </div>
      <div className="pz-demo__hint">
        <p className="pz-demo__hint-z">Подсказка учителя</p>
        <p>Что такое скорость точки, если известен закон движения x(t)?</p>
        <ul>
          <li>Значение x(5)</li>
          <li className="is-vybran">Производная x′(t) в момент t = 5</li>
          <li>Отношение x(5) к 5</li>
        </ul>
      </div>
    </div>
  );
}

function Otzyv() {
  return (
    <div className="pz-otzyv">
      <p>Место под отзыв</p>
      <span>
        Собрать: фото или скрин сообщения, имя и класс, письменное разрешение на публикацию
      </span>
    </div>
  );
}

/* ── Главная ─────────────────────────────────────────────────────── */

function GlavnayaA() {
  return (
    <div className="pz-ekran">
      <header className="pz-shapka">
        <span className="pz-logo">Будет на ЕГЭ</span>
        <nav>
          <span>Задания</span>
          <span>Варианты</span>
          <span>Репетиторам</span>
          <span>Об авторе</span>
          <span>Тарифы</span>
        </nav>
        <span className="pz-knopka pz-knopka--mal">Начать бесплатно</span>
      </header>

      <section className="pz-hero">
        <div className="pz-hero__text">
          <Metka>ЕГЭ · профильная математика</Metka>
          <h3 className="pz-h1">Подготовка, где подсказывает учитель, а не ответ в конце</h3>
          <p className="pz-lid">
            Все 12 заданий первой части и задачи второй: теория, опорные задачи и тренажёр. Ошибся —
            подсказка задаёт вопрос к следующему шагу, как на занятии.
          </p>
          <div className="pz-ryad">
            <span className="pz-knopka">Начать бесплатно</span>
            <span className="pz-ssylka">
              Тарифы — от {rubli(PLATNYE.uchenik.tsena30)} в месяц →
            </span>
          </div>
          <Avtor kompakt />
        </div>
        <DemoPodskazka />
      </section>

      <div className="pz-fakty">
        <div>
          <b>3 800+</b>
          <span>задач с ответами</span>
        </div>
        <div>
          <b>12</b>
          <span>заданий первой части — полностью</span>
        </div>
        <div>
          <b>6</b>
          <span>генераторов вариантов</span>
        </div>
        <div>
          <b>{rubli(0)}</b>
          <span>чтобы начать, без карты</span>
        </div>
      </div>

      <section className="pz-sek">
        <h4 className="pz-h2">Каждое задание — один путь от «не понимаю» до «решаю сам»</h4>
        <ol className="pz-put">
          <li>
            <b>О задании</b>
            <span>Что спрашивают, сколько баллов, где теряют</span>
          </li>
          <li>
            <b>Теория</b>
            <span>Только то, что нужно для этого номера</span>
          </li>
          <li>
            <b>Опорные задачи</b>
            <span>Главные приёмы с разбором</span>
          </li>
          <li>
            <b>Тренажёр</b>
            <span>Свои числа у каждой задачи, подсказки-вопросы</span>
          </li>
          <li>
            <b>Вариант</b>
            <span>Проверить себя как на экзамене</span>
          </li>
        </ol>
      </section>

      <section className="pz-sek pz-tri">
        <article>
          <Metka>Ученику</Metka>
          <h5>Понять, а не запомнить</h5>
          <p>Тренажёр с подсказками, работа над ошибками и варианты с баллами.</p>
          <span className="pz-ssylka">Выбрать задание →</span>
        </article>
        <article>
          <Metka>Родителю</Metka>
          <h5>Видно, что ребёнок занимается</h5>
          <p>Прогресс по каждому заданию и история решений. Без автопродления и привязки карты.</p>
          <span className="pz-ssylka">Что входит в доступ →</span>
        </article>
        <article>
          <Metka>Репетитору</Metka>
          <h5>Вариант с разными числами за минуту</h5>
          <p>Лист ученика, лист учителя с ответами и разбор. Каждому своё — списать не у кого.</p>
          <span className="pz-ssylka">Собрать вариант →</span>
        </article>
      </section>

      <section className="pz-sek pz-sravn">
        <h4 className="pz-h2">Чем это не похоже на сборник задач</h4>
        <table>
          <thead>
            <tr>
              <th />
              <th>Обычный банк задач</th>
              <th>Будет на ЕГЭ</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Застрял</td>
              <td>Смотришь ответ или решение целиком</td>
              <td>Вопрос к следующему шагу и вторая попытка</td>
            </tr>
            <tr>
              <td>Задачи</td>
              <td>Одни и те же у всех, ответы гуглятся</td>
              <td>Те же прототипы ФИПИ, свои числа</td>
            </tr>
            <tr>
              <td>Порядок</td>
              <td>Тысячи задач без маршрута</td>
              <td>Теория → опорные → тренажёр → вариант</td>
            </tr>
            <tr>
              <td>Кто составил</td>
              <td>Не указано</td>
              <td>Учитель и эксперт ГИА, имя на каждом листе</td>
            </tr>
          </tbody>
        </table>
      </section>

      <section className="pz-sek pz-dva">
        <div>
          <Metka>Отзывы</Metka>
          <h4 className="pz-h2">Что говорят ученики и коллеги</h4>
          <div className="pz-otzyvy">
            <Otzyv />
            <Otzyv />
          </div>
        </div>
        <div className="pz-cena">
          <Metka>Тарифы</Metka>
          <p className="pz-cena__z">Начните бесплатно. Полный доступ — когда понадобится.</p>
          <p className="pz-cena__ch">
            {rubli(PLATNYE.uchenik.tsena30)} <span>за {PERIOD_DNEY} дней</span>
          </p>
          <p className="pz-cena__p">
            Или {rubli(tsenaDoEge('uchenik') ?? 0)} сразу {DO_EGE.podpis}. Пробные {PROBNYY.dney}{' '}
            дней — без карты. Без автопродления.
          </p>
          <span className="pz-knopka">Посмотреть тарифы</span>
        </div>
      </section>
    </div>
  );
}

function GlavnayaB() {
  return (
    <div className="pz-ekran pz-ekran--b">
      <section className="pz-hero pz-hero--b">
        <div className="pz-hero__text">
          <Metka>ЕГЭ · профильная математика</Metka>
          <h3 className="pz-h1">Каждое задание ЕГЭ — так, как его объясняет учитель</h3>
          <p className="pz-lid">
            Теория, опорные задачи и тренажёр с подсказками. Составила Наталия Багаева — учитель
            математики и эксперт ГИА.
          </p>
        </div>
        <img className="pz-hero__kristall" src={KRISTALL} alt="" width={600} height={600} />
        <div className="pz-dveri">
          <article>
            <h5>Я готовлюсь к ЕГЭ</h5>
            <p>
              Начните с любого задания бесплатно: теория, опорные задачи и {BESPLATNO.trenazherVDen}{' '}
              задач тренажёра в день.
            </p>
            <span className="pz-knopka">Начать бесплатно</span>
            <small>
              Полный доступ — {rubli(PLATNYE.uchenik.tsena30)} за {PERIOD_DNEY} дней
            </small>
          </article>
          <article>
            <h5>Я репетитор или учитель</h5>
            <p>Варианты с разными числами, лист ответов и разбор — за минуту. Классы и домашние.</p>
            <span className="pz-knopka pz-knopka--teplaya">Собрать вариант</span>
            <small>
              Тариф «Репетитор» — {rubli(PLATNYE.repetitor.tsena30)} за {PERIOD_DNEY} дней
            </small>
          </article>
        </div>
      </section>

      <section className="pz-sek">
        <Metka>Как это выглядит внутри</Metka>
        <h4 className="pz-h2">Три экрана, ради которых сюда возвращаются</h4>
        <div className="pz-vnutri">
          <figure>
            <DemoPodskazka />
            <figcaption>Тренажёр: подсказка — вопрос, а не ответ</figcaption>
          </figure>
          <figure>
            <div className="pz-list">
              <p className="pz-list__z">Вариант 2 · лист ученика</p>
              <p>1. Найдите значение выражения …</p>
              <p>2. Имеется два сплава …</p>
              <p>3. Точка движется по закону …</p>
              <p className="pz-list__s">у соседа — другие числа</p>
            </div>
            <figcaption>Генератор: у каждого ученика свои числа</figcaption>
          </figure>
          <figure>
            <div className="pz-list pz-list--uchitel">
              <p className="pz-list__z">Лист учителя</p>
              <p>В1: 6 · 14 · −2 · 0,25</p>
              <p>В2: 9 · 18 · −1 · 0,75</p>
              <p>Разбор каждого номера</p>
            </div>
            <figcaption>Один лист ответов на весь класс</figcaption>
          </figure>
        </div>
        <p className="pz-primechanie">
          В макете — схемы. В работе — настоящие снимки экранов сайта (их можно снять скриптом, без
          новых картинок).
        </p>
      </section>

      <section className="pz-sek pz-dva">
        <Avtor />
        <div>
          <Metka>Почему мне можно доверить подготовку</Metka>
          <ul className="pz-galki">
            <li>Проверяю работы ЕГЭ как эксперт ГИА — знаю, за что снимают баллы</li>
            <li>Все задачи — прототипы открытого банка ФИПИ, без «авторских» сюрпризов</li>
            <li>Подсказки написаны так, как я веду занятие</li>
          </ul>
          <span className="pz-ssylka">Об авторе →</span>
        </div>
      </section>
    </div>
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
          <span>Я репетитор</span>
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

export default function Page() {
  return (
    <main className="pz">
      <header className="pz-vvod">
        <p className="pz-metka">Служебная страница · аудит продаж</p>
        <h1>Макеты главной и тарифов</h1>
        <p>
          По два варианта на страницу, чтобы выбрать направление. Это схемы, не боевые страницы:
          цены и лимиты — из lib/tarify/config.ts, отзывов и цифр учеников нет, на их месте рамки
          «собрать». Подробности и обоснование — docs/audit-prodazhi.md.
        </p>
      </header>

      <section className="pz-variant">
        <h2>Главная · вариант А «Учитель рядом»</h2>
        <p className="pz-pochemu">
          Оффер — о выгоде ученика (подсказка учителя вместо ответа). Справа — живой кусок продукта
          вместо абстрактной фигуры. Автор и цена видны на первом экране. Ниже — маршрут задания,
          три аудитории, сравнение со «сборником задач», место под отзывы и цена.
        </p>
        <GlavnayaA />
      </section>

      <section className="pz-variant">
        <h2>Главная · вариант Б «Две двери с ценой»</h2>
        <p className="pz-pochemu">
          Ближе к нынешней главной: кристалл и «двери» остаются, но в каждой двери — кнопка и цена
          своей аудитории. Второй экран — «как это выглядит внутри», третий — автор и экспертиза.
        </p>
        <GlavnayaB />
      </section>

      <section className="pz-variant">
        <h2>Тарифы · вариант А «Сначала выгодный»</h2>
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
