import { about } from '@/content/about';
import { site } from '@/content/site';
import { assetUrl } from '@/lib/assetUrl';

/* Черновик композиции «Об авторе» (шаг 0). Все тексты — из боевой
   страницы (content/about.ts) и общей оболочки (content/site.ts);
   новых фактов нет. Где текста на странице сейчас нет, стоит пометка
   `todo` — на её месте показывается рамка «место под текст». */

const telegram = site.footer.links.find((link) => link.label === 'Telegram');
const uchitelyam = site.nav.find((item) => item.label === 'Учителям');

export const IMYA = { familiya: 'Багаева', imya: 'Наталия', otchestvo: 'Витальевна' } as const;
export const POLNOE_IMYA = `${IMYA.familiya} ${IMYA.imya} ${IMYA.otchestvo}`;

/* Строка под именем: текущий подзаголовок без «Я» в начале. */
export const KTO_YA =
  'Учитель математики и создатель платформы для подготовки к ЕГЭ по профильной математике.';

export const FOTO = {
  src: about.hero.photo.src,
  srcSet: about.hero.photo.srcSet,
  width: about.hero.photo.width,
  height: about.hero.photo.height,
  alt: `${POLNOE_IMYA}, учитель математики и автор платформы`,
};

export const BYUST = {
  src: assetUrl('/images/author/bust-marble.png'),
  width: 675,
  height: 900,
  alt: 'Мраморный бюст в античном стиле',
};

export interface Nadpis {
  src: string;
  width: number;
  height: number;
  /** Текст самой рукописной пометки — он же alt. */
  alt: string;
}

export const NADPISI = {
  opyt: {
    src: assetUrl('/images/nadpisi/nadpis-opyt-vdohnovlyaet.png'),
    width: 800,
    height: 541,
    alt: 'Рукописная пометка: «Опыт вдохновляет идти дальше»',
  },
  znaniya: {
    src: assetUrl('/images/nadpisi/nadpis-znaniya-opyt-lyudi.png'),
    width: 800,
    height: 569,
    alt: 'Рукописная пометка: «Знания. Опыт. Люди. Возможности»',
  },
  prototipy: {
    src: assetUrl('/images/nadpisi/nadpis-te-zhe-prototipy.png'),
    width: 800,
    height: 398,
    alt: 'Рукописная пометка: «Те же прототипы. Другие числа. Настоящее обучение»',
  },
  vmeste: {
    src: assetUrl('/images/nadpisi/nadpis-vmeste-k-bolshemu.png'),
    width: 800,
    height: 560,
    alt: 'Рукописная пометка: «Вместе к большему»',
  },
  grafik: {
    src: assetUrl('/images/nadpisi/zagolovok-odin-prototip.png'),
    width: 1000,
    height: 661,
    alt: 'Рукописная пометка с графиком: «Один прототип — тысячи уникальных задач»',
  },
} satisfies Record<string, Nadpis>;

export const BLOKI = {
  podhod: {
    metka: 'Как я учу',
    title: about.principles.title,
    items: about.principles.items,
    todo: 'Место под 2–3 предложения о том, как вы ведёте урок и готовите к экзамену (вопрос 1). Сейчас на странице есть только четыре принципа ниже.',
  },
  put: {
    metka: 'Образование и опыт',
    title: about.path.title,
    lead: about.path.lead,
    points: about.path.points,
    todo: 'Место под строку об образовании: вуз, факультет, год (вопрос 2). Сейчас на странице есть только слова «Математическое образование».',
  },
  sajt: {
    metka: 'О сайте и зачем он',
    title: about.problem.title,
    paragraphs: about.problem.paragraphs,
    engine: about.engine,
    personal: about.personal,
  },
  polza: {
    metka: 'Чем могу быть полезна',
    title: about.cta.title,
    ucheniku: {
      komu: 'Ученику',
      todo: 'Место под 1–2 предложения для ученика (вопрос 3): на странице сейчас нет текста, обращённого к ученику.',
      action: { label: 'Начать заниматься', href: site.headerActions.signup.href },
    },
    uchitelyu: {
      komu: 'Учителю и репетитору',
      text: about.cta.lead,
      action: {
        label: 'Учителям',
        href: uchitelyam && 'href' in uchitelyam ? uchitelyam.href : '/#how',
      },
    },
  },
  svyaz: {
    metka: 'Как связаться',
    title: 'Как связаться',
    telegram: {
      label: 'Telegram-канал: t.me/budet_na_ege_math',
      href: telegram?.href ?? 'https://t.me/budet_na_ege_math',
    },
    todo: 'Место под личный контакт: почта, Telegram для сообщений (вопрос 4). Сейчас на сайте есть только ссылка на канал.',
  },
} as const;
