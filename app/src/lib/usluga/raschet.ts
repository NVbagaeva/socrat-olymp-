/**
 * Расчёт цены и срока заказа «Материалы под ключ».
 *
 * Одна формула на калькулятор, форму и письмо заявки. Ставки и
 * правила — docs/SERVICE TEACHERS LANDING.md, §3 и §4, утверждены
 * 24.09.2026. Числа приходят из content/uchitelyam.ts, здесь их нет.
 *
 * Функция чистая: ни DOM, ни дат. Её проверяет scripts/check-usluga.mjs.
 */

export type Uroven = 'nabor' | 'otvety' | 'resheniya';
export type Srochnost = 'bazovyy' | '48' | '24';

export interface Stavki {
  /** Набор и вёрстка, за задачу. */
  nabor: number;
  /** Ответ с двойной проверкой, за задачу, сверх набора. */
  otvet: number;
  /** Полное решение, за задачу, сверх набора; ответ входит. */
  reshenie: number;
  /** Дополнительный вариант с ответами, за задачу. */
  variantOtvety: number;
  /** Дополнительный вариант с решениями, за задачу. */
  variantResheniya: number;
  /** Надбавка за рукописный исходник: доля от набора. */
  rukopisDolya: number;
  /** Сложный чертёж, за штуку. */
  slozhnyyChertezh: number;
  /** Сколько задач считается минимум. */
  minZadach: number;
  /** Надбавки за срочность: доля от суммы. */
  srochno48: number;
  srochno24: number;
}

export interface Sroki {
  /** Рабочих дней: набор и набор с ответами, один вариант. */
  korotkiy: number;
  /** Рабочих дней: решения или больше одного варианта. */
  dlinnyy: number;
  /** За каждые начатые 10 задач сверх первых десяти. */
  zaDesyatok: number;
  /** За каждый вариант сверх четырёх. */
  zaVariantSverh: number;
  /** За рукописный исходник. */
  zaRukopis: number;
}

export interface Zakaz {
  zadach: number;
  uroven: Uroven;
  variantov: number;
  rukopis: boolean;
  slozhnyhChertezhey: number;
  srochnost: Srochnost;
}

/** Почему срочность недоступна для этого заказа. */
export type PrichinaSrochnosti = 'zadach' | 'variantov' | 'rukopis' | 'resheniya' | 'net-mesta';

export interface Stroka {
  /** Что посчитано: «Набор и вёрстка, 10 задач × 200 ₽». */
  chto: string;
  summa: number;
}

export interface Raschet {
  /** Сколько задач легло в расчёт: не меньше минимума. */
  zadachVRaschete: number;
  stroki: Stroka[];
  /** Сумма без срочности. */
  baza: number;
  /** Надбавка за срочность в рублях. */
  srochnost: number;
  itogo: number;
  /** Рабочих дней для базового срока; для срочного — null. */
  rabochihDney: number | null;
  /** Часов для срочного срока; для базового — null. */
  chasov: number | null;
  /** Предоплата: вся сумма или половина. */
  predoplata: 'polnaya' | 'polovina';
  /** Первая страница на согласование. */
  soglasovanie: boolean;
}

/** Порог, с которого предоплата делится 50/50. */
export const POROG_POLOVINY = 5000;
/** Порог, с которого первая страница идёт на согласование. */
export const POROG_SOGLASOVANIYA = 4000;

const rub = (n: number) => `${n.toLocaleString('ru-RU')} ₽`;

/** Приводит ввод к допустимому: целые, не меньше единицы. */
export function normalizovat(z: Zakaz): Zakaz {
  const celoe = (n: number, min: number, max: number) =>
    Math.min(max, Math.max(min, Math.round(Number.isFinite(n) ? n : min)));
  const zadach = celoe(z.zadach, 1, 300);
  /* У набора без ответов вариантов нет: вариант — это новые числа
     с посчитанными ответами, иначе равную сложность не проверить. */
  const variantov = z.uroven === 'nabor' ? 1 : celoe(z.variantov, 1, 12);
  return {
    ...z,
    zadach,
    variantov,
    slozhnyhChertezhey: celoe(z.slozhnyhChertezhey, 0, zadach * variantov),
  };
}

/**
 * Можно ли этот заказ сделать срочно. Пустой список — можно.
 * Ограничения — §4.1: 48 часов — до 10 задач, до 4 вариантов, без
 * рукописи; 24 часа — до 10 задач, до 2 вариантов, без решений и рукописи.
 */
export function prichinyBezSrochnosti(
  z: Zakaz,
  srok: Exclude<Srochnost, 'bazovyy'>,
  mestoSvobodno: boolean,
): PrichinaSrochnosti[] {
  const n = normalizovat(z);
  const prichiny: PrichinaSrochnosti[] = [];
  if (!mestoSvobodno) prichiny.push('net-mesta');
  if (n.zadach > 10) prichiny.push('zadach');
  if (n.variantov > (srok === '48' ? 4 : 2)) prichiny.push('variantov');
  if (n.rukopis) prichiny.push('rukopis');
  if (srok === '24' && n.uroven === 'resheniya') prichiny.push('resheniya');
  return prichiny;
}

export function poschitat(vvod: Zakaz, s: Stavki, sr: Sroki): Raschet {
  const z = normalizovat(vvod);
  const n = Math.max(z.zadach, s.minZadach);
  const dop = z.variantov - 1;
  const stroki: Stroka[] = [];

  stroki.push({ chto: `Набор и вёрстка: ${n} × ${rub(s.nabor)}`, summa: n * s.nabor });
  if (z.uroven === 'otvety') {
    stroki.push({ chto: `Ответы: ${n} × ${rub(s.otvet)}`, summa: n * s.otvet });
  }
  if (z.uroven === 'resheniya') {
    stroki.push({ chto: `Решения: ${n} × ${rub(s.reshenie)}`, summa: n * s.reshenie });
  }
  if (dop > 0) {
    const stavka = z.uroven === 'resheniya' ? s.variantResheniya : s.variantOtvety;
    stroki.push({
      chto: `Ещё ${dop} вар.: ${dop} × ${n} × ${rub(stavka)}`,
      summa: dop * n * stavka,
    });
  }
  if (z.rukopis) {
    const zaZadachu = Math.round(s.nabor * s.rukopisDolya);
    stroki.push({ chto: `Рукописный исходник: ${n} × ${rub(zaZadachu)}`, summa: n * zaZadachu });
  }
  if (z.slozhnyhChertezhey > 0) {
    stroki.push({
      chto: `Сложные чертежи: ${z.slozhnyhChertezhey} × ${rub(s.slozhnyyChertezh)}`,
      summa: z.slozhnyhChertezhey * s.slozhnyyChertezh,
    });
  }

  const baza = stroki.reduce((sum, st) => sum + st.summa, 0);
  const dolya = z.srochnost === '48' ? s.srochno48 : z.srochnost === '24' ? s.srochno24 : 0;
  const srochnost = Math.round(baza * dolya);
  const itogo = baza + srochnost;

  let rabochihDney: number | null = null;
  let chasov: number | null = null;
  if (z.srochnost === 'bazovyy') {
    const dlinnyy = z.uroven === 'resheniya' || z.variantov > 1;
    rabochihDney =
      (dlinnyy ? sr.dlinnyy : sr.korotkiy) +
      sr.zaDesyatok * Math.max(0, Math.ceil((z.zadach - 10) / 10)) +
      sr.zaVariantSverh * Math.max(0, z.variantov - 4) +
      (z.rukopis ? sr.zaRukopis : 0);
  } else {
    chasov = Number(z.srochnost);
  }

  return {
    zadachVRaschete: n,
    stroki,
    baza,
    srochnost,
    itogo,
    rabochihDney,
    chasov,
    predoplata: itogo > POROG_POLOVINY ? 'polovina' : 'polnaya',
    soglasovanie: itogo >= POROG_SOGLASOVANIYA,
  };
}
