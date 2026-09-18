/**
 * Задание №5, прототипы на сложение и вычитание вероятностей.
 *
 * Задачи 1–28 задачника Е. А. Ширяевой «ЕГЭпроф 2025». Восемь
 * прототипов: сложение несовместных, противоположное событие, три
 * прототипа на разность вложенных событий, два на сумму совместных
 * и один на условную вероятность.
 *
 * Здесь начинается то, о чём шла речь на разведке: числа связаны
 * условием на решаемость. У задач «больше 9» и «больше 8» вторая
 * вероятность не может быть меньше первой, у буханки сумма двух
 * вероятностей обязана превышать единицу, у автоматов с кофе
 * вероятность «закончится в обоих» не бывает больше, чем «закончится
 * в первом». Всё это проверяет `dopustimo`, и новые варианты
 * подобраны так, чтобы ограничение выполнялось с запасом.
 */

import { dec, konechnaya, num, text, type Params, type Prototype } from '../types';

/* ── Общее ───────────────────────────────────────────────────────── */

/** Без округления: ответ обязан быть конечной десятичной дробью. */
const tochno = (): null => null;

/** Вероятность, записанная числом от нуля до единицы. */
function veroyatnost(p: Params, key: string): number {
  return num(p, key);
}

/** Сложение чисел с отсечением плавающей запятой. */
function tochnee(value: number): number {
  return Math.round(value * 1e9) / 1e9;
}

/* ── 1. Экзамен по геометрии: две темы ───────────────────────────── */

const P01: Prototype = {
  id: 'p5-01',
  blok: 'slozhenie',
  nazvanie: 'Экзамен: вопрос по одной из двух тем',
  tip: 'Сложение вероятностей несовместных событий',
  zadachnik: [1, 4],
  format: 'десятичная',
  okruglenie: tochno,
  uslovie: (p) =>
    `На экзамене по геометрии школьник отвечает на один вопрос из списка экзаменационных вопросов. Вероятность того, что это вопрос по теме «${text(p, 'tema1')}», равна ${dec(num(p, 'p1'))}. Вероятность того, что это вопрос по теме «${text(p, 'tema2')}», равна ${dec(num(p, 'p2'))}. Вопросов, которые одновременно относятся к этим двум темам, нет. Найдите вероятность того, что на экзамене школьнику достанется вопрос по одной из этих двух тем.`,
  dopustimo: (p) => {
    const p1 = veroyatnost(p, 'p1');
    const p2 = veroyatnost(p, 'p2');
    return p1 > 0 && p2 > 0 && tochnee(p1 + p2) <= 1 && konechnaya(tochnee(p1 + p2));
  },
  otvet: (p) => tochnee(num(p, 'p1') + num(p, 'p2')),
  /* Второй путь: через событие «вопрос не по этим темам». */
  perebor: (p) => tochnee(1 - (1 - num(p, 'p1') - num(p, 'p2'))),
  shagi: (p) => {
    const p1 = num(p, 'p1');
    const p2 = num(p, 'p2');
    return [
      { text: 'Темы не пересекаются, значит события несовместны.', value: 0 },
      {
        text: `Для несовместных событий вероятности складываются: ${dec(p1)} + ${dec(p2)} = ${dec(tochnee(p1 + p2))}`,
        value: tochnee(p1 + p2),
      },
    ];
  },
  varianty: [
    {
      n: 1,
      source: 'задачник',
      ref: 'задачник 05, № 1',
      params: { p1: 0.2, tema1: 'Вписанная окружность', p2: 0.35, tema2: 'Внешние углы' },
    },
    {
      n: 2,
      source: 'задачник',
      ref: 'задачник 05, № 2',
      params: { p1: 0.25, tema1: 'Тригонометрия', p2: 0.35, tema2: 'Параллелограмм' },
    },
    {
      n: 3,
      source: 'задачник',
      ref: 'задачник 05, № 3',
      params: { p1: 0.25, tema1: 'Треугольник', p2: 0.1, tema2: 'Трапеция' },
    },
    {
      n: 4,
      source: 'задачник',
      ref: 'задачник 05, № 4',
      params: { p1: 0.45, tema1: 'Площадь', p2: 0.45, tema2: 'Углы' },
    },
    {
      n: 5,
      source: 'новый',
      ref: 'создан заново',
      params: { p1: 0.3, tema1: 'Синус и косинус', p2: 0.2, tema2: 'Медиана' },
    },
    {
      n: 6,
      source: 'новый',
      ref: 'создан заново',
      params: { p1: 0.12, tema1: 'Ромб', p2: 0.28, tema2: 'Окружность' },
    },
    {
      n: 7,
      source: 'новый',
      ref: 'создан заново',
      params: { p1: 0.4, tema1: 'Векторы', p2: 0.25, tema2: 'Подобие' },
    },
    {
      n: 8,
      source: 'новый',
      ref: 'создан заново',
      params: { p1: 0.35, tema1: 'Средняя линия', p2: 0.35, tema2: 'Симметрия' },
    },
    {
      n: 9,
      source: 'новый',
      ref: 'создан заново',
      params: { p1: 0.1, tema1: 'Пирамида', p2: 0.15, tema2: 'Призма' },
    },
    {
      n: 10,
      source: 'новый',
      ref: 'создан заново',
      params: { p1: 0.5, tema1: 'Биссектриса', p2: 0.3, tema2: 'Высота' },
    },
  ],
};

/* ── 2. Температура тела ─────────────────────────────────────────── */

const P02: Prototype = {
  id: 'p5-02',
  blok: 'protivopolozhnoe',
  nazvanie: 'Температура тела: «или выше»',
  tip: 'Вероятность противоположного события',
  zadachnik: [5, 8],
  format: 'десятичная',
  okruglenie: tochno,
  uslovie: (p) =>
    `Вероятность того, что в случайный момент времени температура тела здорового человека окажется ниже 36,8 °C, равна ${dec(num(p, 'p'))}. Найдите вероятность того, что в случайный момент времени у здорового человека температура тела окажется 36,8 °C или выше.`,
  dopustimo: (p) => {
    const value = veroyatnost(p, 'p');
    return value > 0.5 && value < 1 && konechnaya(tochnee(1 - value));
  },
  otvet: (p) => tochnee(1 - num(p, 'p')),
  /* Второй путь: сумма вероятностей события и противоположного равна
     единице — проверяем именно это равенство, а не вычитание. */
  perebor: (p) => {
    const value = num(p, 'p');
    let protivopolozhnoe = 0;
    /* Шагаем по сотым долям: сумма долей, не покрытых событием. */
    for (let i = 0; i < 100; i += 1) {
      if (i / 100 >= value - 1e-9) {
        protivopolozhnoe += 0.01;
      }
    }
    return tochnee(protivopolozhnoe);
  },
  shagi: (p) => {
    const value = num(p, 'p');
    return [
      { text: '«Ниже 36,8 °C» и «36,8 °C или выше» — противоположные события.', value: 1 },
      {
        text: `Их вероятности в сумме дают 1: 1 − ${dec(value)} = ${dec(tochnee(1 - value))}`,
        value: tochnee(1 - value),
      },
    ];
  },
  varianty: [
    { n: 1, source: 'задачник', ref: 'задачник 05, № 5', params: { p: 0.87 } },
    { n: 2, source: 'задачник', ref: 'задачник 05, № 6', params: { p: 0.94 } },
    { n: 3, source: 'задачник', ref: 'задачник 05, № 7', params: { p: 0.89 } },
    { n: 4, source: 'задачник', ref: 'задачник 05, № 8', params: { p: 0.91 } },
    { n: 5, source: 'конспект', ref: 'конспект, № 21', params: { p: 0.81 } },
    { n: 6, source: 'новый', ref: 'создан заново', params: { p: 0.83 } },
    { n: 7, source: 'новый', ref: 'создан заново', params: { p: 0.96 } },
    { n: 8, source: 'новый', ref: 'создан заново', params: { p: 0.78 } },
    { n: 9, source: 'новый', ref: 'создан заново', params: { p: 0.9 } },
    { n: 10, source: 'новый', ref: 'создан заново', params: { p: 0.85 } },
  ],
};

/* ── Разность вложенных событий ──────────────────────────────────── */

/**
 * Общая проверка для трёх прототипов на разность: вероятность
 * широкого события строго больше вероятности вложенного, иначе
 * разность выходит нулевой или отрицательной.
 */
function raznostDopustima(shirokoe: number, uzkoe: number): boolean {
  return (
    uzkoe > 0 && shirokoe < 1 && shirokoe - uzkoe > 1e-9 && konechnaya(tochnee(shirokoe - uzkoe))
  );
}

/** Второй путь к разности: через противоположные события. */
function raznostPerebor(shirokoe: number, uzkoe: number): number {
  return tochnee(1 - (1 - shirokoe) - uzkoe);
}

/* ── 3. Тестирование: «ровно N задач» ────────────────────────────── */

const P03: Prototype = {
  id: 'p5-03',
  blok: 'raznost',
  nazvanie: 'Тестирование: решит ровно N задач',
  tip: 'Разность вероятностей вложенных событий',
  zadachnik: [9, 12],
  format: 'десятичная',
  okruglenie: tochno,
  uslovie: (p) => {
    const N = num(p, 'N');
    return `Вероятность того, что на тестировании по ${text(p, 'predmet')} учащийся А. верно решит больше ${N} задач, равна ${dec(num(p, 'bolshe'))}. Вероятность того, что А. верно решит больше ${N - 1} задач, равна ${dec(num(p, 'menshe'))}. Найдите вероятность того, что А. верно решит ровно ${N} задач.`;
  },
  dopustimo: (p) => {
    const N = num(p, 'N');
    return N >= 2 && raznostDopustima(num(p, 'menshe'), num(p, 'bolshe'));
  },
  otvet: (p) => tochnee(num(p, 'menshe') - num(p, 'bolshe')),
  perebor: (p) => raznostPerebor(num(p, 'menshe'), num(p, 'bolshe')),
  shagi: (p) => {
    const N = num(p, 'N');
    const shirokoe = num(p, 'menshe');
    const uzkoe = num(p, 'bolshe');
    return [
      {
        text: `«Больше ${N - 1} задач» — это «ровно ${N}» вместе с «больше ${N}»: второе событие вложено в первое.`,
        value: N,
      },
      {
        text: `Значит P(ровно ${N}) = ${dec(shirokoe)} − ${dec(uzkoe)} = ${dec(tochnee(shirokoe - uzkoe))}`,
        value: tochnee(shirokoe - uzkoe),
      },
    ];
  },
  varianty: [
    {
      n: 1,
      source: 'задачник',
      ref: 'задачник 05, № 9',
      params: { predmet: 'математике', N: 9, bolshe: 0.63, menshe: 0.75 },
    },
    {
      n: 2,
      source: 'задачник',
      ref: 'задачник 05, № 10',
      params: { predmet: 'физике', N: 6, bolshe: 0.77, menshe: 0.83 },
    },
    {
      n: 3,
      source: 'задачник',
      ref: 'задачник 05, № 11',
      params: { predmet: 'математике', N: 11, bolshe: 0.66, menshe: 0.76 },
    },
    {
      n: 4,
      source: 'задачник',
      ref: 'задачник 05, № 12',
      params: { predmet: 'физике', N: 6, bolshe: 0.61, menshe: 0.66 },
    },
    {
      n: 5,
      source: 'новый',
      ref: 'создан заново',
      params: { predmet: 'химии', N: 7, bolshe: 0.68, menshe: 0.79 },
    },
    {
      n: 6,
      source: 'новый',
      ref: 'создан заново',
      params: { predmet: 'биологии', N: 10, bolshe: 0.54, menshe: 0.71 },
    },
    {
      n: 7,
      source: 'новый',
      ref: 'создан заново',
      params: { predmet: 'математике', N: 12, bolshe: 0.45, menshe: 0.58 },
    },
    {
      n: 8,
      source: 'новый',
      ref: 'создан заново',
      params: { predmet: 'физике', N: 8, bolshe: 0.72, menshe: 0.8 },
    },
    {
      n: 9,
      source: 'новый',
      ref: 'создан заново',
      params: { predmet: 'информатике', N: 5, bolshe: 0.81, menshe: 0.95 },
    },
    {
      n: 10,
      source: 'новый',
      ref: 'создан заново',
      params: { predmet: 'химии', N: 9, bolshe: 0.39, menshe: 0.46 },
    },
  ],
};

/* ── 4. Прибор: год и два года ───────────────────────────────────── */

const P04: Prototype = {
  id: 'p5-04',
  blok: 'raznost',
  nazvanie: 'Прибор: прослужит меньше двух лет, но больше года',
  tip: 'Разность вероятностей вложенных событий',
  zadachnik: [13, 14],
  format: 'десятичная',
  okruglenie: tochno,
  uslovie: (p) =>
    `Вероятность того, что новый ${text(p, 'predmet')} прослужит больше года, равна ${dec(num(p, 'god'))}. Вероятность того, что он прослужит больше двух лет, равна ${dec(num(p, 'dva'))}. Найдите вероятность того, что он прослужит меньше двух лет, но больше года.`,
  dopustimo: (p) => raznostDopustima(num(p, 'god'), num(p, 'dva')),
  otvet: (p) => tochnee(num(p, 'god') - num(p, 'dva')),
  perebor: (p) => raznostPerebor(num(p, 'god'), num(p, 'dva')),
  shagi: (p) => {
    const god = num(p, 'god');
    const dva = num(p, 'dva');
    return [
      {
        text: '«Прослужит больше двух лет» вложено в «прослужит больше года»: всё, что дожило до двух лет, дожило и до года.',
        value: 1,
      },
      {
        text: `Остаётся разность: ${dec(god)} − ${dec(dva)} = ${dec(tochnee(god - dva))}`,
        value: tochnee(god - dva),
      },
    ];
  },
  varianty: [
    {
      n: 1,
      source: 'задачник',
      ref: 'задачник 05, № 13',
      params: { predmet: 'сканер', god: 0.94, dva: 0.87 },
    },
    {
      n: 2,
      source: 'задачник',
      ref: 'задачник 05, № 14',
      params: { predmet: 'тостер', god: 0.93, dva: 0.82 },
    },
    {
      n: 3,
      source: 'конспект',
      ref: 'конспект, № 22',
      params: { predmet: 'мобильный телефон', god: 0.9, dva: 0.7 },
    },
    {
      n: 4,
      source: 'новый',
      ref: 'создан заново',
      params: { predmet: 'чайник', god: 0.95, dva: 0.9 },
    },
    {
      n: 5,
      source: 'новый',
      ref: 'создан заново',
      params: { predmet: 'пылесос', god: 0.88, dva: 0.74 },
    },
    {
      n: 6,
      source: 'новый',
      ref: 'создан заново',
      params: { predmet: 'принтер', god: 0.9, dva: 0.72 },
    },
    {
      n: 7,
      source: 'новый',
      ref: 'создан заново',
      params: { predmet: 'ноутбук', god: 0.97, dva: 0.85 },
    },
    {
      n: 8,
      source: 'новый',
      ref: 'создан заново',
      params: { predmet: 'холодильник', god: 0.99, dva: 0.93 },
    },
    {
      n: 9,
      source: 'новый',
      ref: 'создан заново',
      params: { predmet: 'миксер', god: 0.86, dva: 0.71 },
    },
    {
      n: 10,
      source: 'новый',
      ref: 'создан заново',
      params: { predmet: 'роутер', god: 0.92, dva: 0.83 },
    },
  ],
};

/* ── 5. Автобус: число пассажиров ────────────────────────────────── */

const P05: Prototype = {
  id: 'p5-05',
  blok: 'raznost',
  nazvanie: 'Автобус: число пассажиров в промежутке',
  tip: 'Разность вероятностей вложенных событий',
  zadachnik: [15, 16],
  format: 'десятичная',
  okruglenie: tochno,
  uslovie: (p) => {
    const bolshe = num(p, 'bolshe');
    const menshe = num(p, 'menshe');
    return `Из районного центра в деревню ежедневно ходит автобус. Вероятность того, что в понедельник в автобусе окажется меньше ${bolshe} пассажиров, равна ${dec(num(p, 'pBolshe'))}. Вероятность того, что окажется меньше ${menshe} пассажиров, равна ${dec(num(p, 'pMenshe'))}. Найдите вероятность того, что число пассажиров будет от ${menshe} до ${bolshe - 1} включительно.`;
  },
  dopustimo: (p) => {
    const bolshe = num(p, 'bolshe');
    const menshe = num(p, 'menshe');
    return (
      Number.isInteger(bolshe) &&
      Number.isInteger(menshe) &&
      menshe >= 1 &&
      bolshe > menshe + 1 &&
      raznostDopustima(num(p, 'pBolshe'), num(p, 'pMenshe'))
    );
  },
  otvet: (p) => tochnee(num(p, 'pBolshe') - num(p, 'pMenshe')),
  perebor: (p) => raznostPerebor(num(p, 'pBolshe'), num(p, 'pMenshe')),
  shagi: (p) => {
    const bolshe = num(p, 'bolshe');
    const menshe = num(p, 'menshe');
    const pB = num(p, 'pBolshe');
    const pM = num(p, 'pMenshe');
    return [
      {
        text: `«Меньше ${menshe}» вложено в «меньше ${bolshe}»: оба события считают одни и те же малые числа пассажиров.`,
        value: 1,
      },
      {
        text: `От ${menshe} до ${bolshe - 1} остаётся разность: ${dec(pB)} − ${dec(pM)} = ${dec(tochnee(pB - pM))}`,
        value: tochnee(pB - pM),
      },
    ];
  },
  varianty: [
    {
      n: 1,
      source: 'задачник',
      ref: 'задачник 05, № 15',
      params: { bolshe: 23, pBolshe: 0.87, menshe: 14, pMenshe: 0.61 },
    },
    {
      n: 2,
      source: 'задачник',
      ref: 'задачник 05, № 16',
      params: { bolshe: 20, pBolshe: 0.79, menshe: 11, pMenshe: 0.61 },
    },
    {
      n: 3,
      source: 'конспект',
      ref: 'конспект, № 23',
      params: { bolshe: 18, pBolshe: 0.82, menshe: 10, pMenshe: 0.51 },
    },
    {
      n: 4,
      source: 'новый',
      ref: 'создан заново',
      params: { bolshe: 30, pBolshe: 0.93, menshe: 20, pMenshe: 0.68 },
    },
    {
      n: 5,
      source: 'новый',
      ref: 'создан заново',
      params: { bolshe: 22, pBolshe: 0.85, menshe: 12, pMenshe: 0.57 },
    },
    {
      n: 6,
      source: 'новый',
      ref: 'создан заново',
      params: { bolshe: 28, pBolshe: 0.91, menshe: 18, pMenshe: 0.7 },
    },
    {
      n: 7,
      source: 'новый',
      ref: 'создан заново',
      params: { bolshe: 15, pBolshe: 0.76, menshe: 8, pMenshe: 0.49 },
    },
    {
      n: 8,
      source: 'новый',
      ref: 'создан заново',
      params: { bolshe: 19, pBolshe: 0.88, menshe: 9, pMenshe: 0.65 },
    },
    {
      n: 9,
      source: 'новый',
      ref: 'создан заново',
      params: { bolshe: 26, pBolshe: 0.94, menshe: 16, pMenshe: 0.72 },
    },
    {
      n: 10,
      source: 'новый',
      ref: 'создан заново',
      params: { bolshe: 24, pBolshe: 0.8, menshe: 13, pMenshe: 0.61 },
    },
  ],
};

/* ── 6. Буханка хлеба: масса в промежутке ────────────────────────── */

const P06: Prototype = {
  id: 'p5-06',
  blok: 'summa-sovmestnyh',
  nazvanie: 'Буханка: масса между двумя границами',
  tip: 'Сумма вероятностей совместных событий',
  zadachnik: [17, 20],
  format: 'десятичная',
  okruglenie: tochno,
  uslovie: (p) =>
    `При выпечке хлеба производится контрольное взвешивание свежей буханки. Известно, что вероятность того, что масса окажется меньше ${num(p, 'verh')} г, равна ${dec(num(p, 'pVerh'))}. Вероятность того, что масса окажется больше ${num(p, 'niz')} г, равна ${dec(num(p, 'pNiz'))}. Найдите вероятность того, что масса буханки больше ${num(p, 'niz')} г, но меньше ${num(p, 'verh')} г.`,
  dopustimo: (p) => {
    const verh = num(p, 'verh');
    const niz = num(p, 'niz');
    const pV = num(p, 'pVerh');
    const pN = num(p, 'pNiz');
    /* Границы обязаны пересекаться (нижняя строго меньше верхней),
       иначе события несовместны и «сумма минус единица» бессмысленна.
       Сумма вероятностей должна превышать единицу — ровно на величину
       ответа. */
    return niz < verh && pV < 1 && pN < 1 && pV + pN - 1 > 1e-9 && konechnaya(tochnee(pV + pN - 1));
  },
  otvet: (p) => tochnee(num(p, 'pVerh') + num(p, 'pNiz') - 1),
  /* Второй путь: единица минус два «хвоста» — лёгкая и тяжёлая
     буханки, события несовместные. */
  perebor: (p) => tochnee(1 - (1 - num(p, 'pNiz')) - (1 - num(p, 'pVerh'))),
  shagi: (p) => {
    const verh = num(p, 'verh');
    const niz = num(p, 'niz');
    const pV = num(p, 'pVerh');
    const pN = num(p, 'pNiz');
    return [
      {
        text: `Буханка легче ${niz} г встречается с вероятностью 1 − ${dec(pN)} = ${dec(tochnee(1 - pN))}, тяжелее ${verh} г — с вероятностью 1 − ${dec(pV)} = ${dec(tochnee(1 - pV))}.`,
        value: tochnee(1 - pN),
      },
      {
        text: `Остальное — искомый промежуток: 1 − ${dec(tochnee(1 - pN))} − ${dec(tochnee(1 - pV))} = ${dec(tochnee(pV + pN - 1))}`,
        value: tochnee(pV + pN - 1),
      },
    ];
  },
  varianty: [
    {
      n: 1,
      source: 'задачник',
      ref: 'задачник 05, № 17',
      params: { verh: 810, pVerh: 0.96, niz: 790, pNiz: 0.82 },
    },
    {
      n: 2,
      source: 'задачник',
      ref: 'задачник 05, № 18',
      params: { verh: 810, pVerh: 0.98, niz: 790, pNiz: 0.83 },
    },
    {
      n: 3,
      source: 'задачник',
      ref: 'задачник 05, № 19',
      params: { verh: 815, pVerh: 0.98, niz: 785, pNiz: 0.86 },
    },
    {
      n: 4,
      source: 'задачник',
      ref: 'задачник 05, № 20',
      params: { verh: 805, pVerh: 0.95, niz: 795, pNiz: 0.81 },
    },
    {
      n: 5,
      source: 'конспект',
      ref: 'конспект, № 26',
      params: { verh: 810, pVerh: 0.97, niz: 790, pNiz: 0.92 },
    },
    {
      n: 6,
      source: 'новый',
      ref: 'создан заново',
      params: { verh: 800, pVerh: 0.94, niz: 790, pNiz: 0.85 },
    },
    {
      n: 7,
      source: 'новый',
      ref: 'создан заново',
      params: { verh: 820, pVerh: 0.97, niz: 780, pNiz: 0.86 },
    },
    {
      n: 8,
      source: 'новый',
      ref: 'создан заново',
      params: { verh: 810, pVerh: 0.93, niz: 790, pNiz: 0.94 },
    },
    {
      n: 9,
      source: 'новый',
      ref: 'создан заново',
      params: { verh: 815, pVerh: 0.95, niz: 785, pNiz: 0.9 },
    },
    {
      n: 10,
      source: 'новый',
      ref: 'создан заново',
      params: { verh: 825, pVerh: 0.98, niz: 775, pNiz: 0.94 },
    },
  ],
};

/* ── 7. Два автомата с кофе ──────────────────────────────────────── */

const P07: Prototype = {
  id: 'p5-07',
  blok: 'summa-sovmestnyh',
  nazvanie: 'Два автомата: кофе останется в обоих',
  tip: 'Сумма вероятностей совместных событий',
  zadachnik: [21, 24],
  format: 'десятичная',
  okruglenie: tochno,
  uslovie: (p) =>
    `В торговом центре два одинаковых автомата продают кофе. Вероятность того, что к концу дня в первом автомате закончится кофе, равна ${dec(num(p, 'p'))}. Вероятность того, что кофе закончится во втором автомате, такая же. Вероятность того, что кофе закончится в обоих автоматах, равна ${dec(num(p, 'oba'))}. Найдите вероятность того, что к концу дня кофе останется в обоих автоматах.`,
  dopustimo: (p) => {
    const one = num(p, 'p');
    const oba = num(p, 'oba');
    /* «Закончится в обоих» — часть события «закончится в первом»,
       поэтому его вероятность не может быть больше. И сумма
       вероятностей «хотя бы в одном» обязана остаться меньше единицы. */
    return (
      one > 0 && oba > 0 && oba < one && 2 * one - oba < 1 && konechnaya(tochnee(1 - 2 * one + oba))
    );
  },
  otvet: (p) => tochnee(1 - 2 * num(p, 'p') + num(p, 'oba')),
  /* Второй путь: раскладываем на четыре клетки таблицы событий —
     кончился в обоих, только в первом, только во втором, ни в одном. */
  perebor: (p) => {
    const one = num(p, 'p');
    const oba = num(p, 'oba');
    const tolkoPervyy = one - oba;
    const tolkoVtoroy = one - oba;
    return tochnee(1 - (oba + tolkoPervyy + tolkoVtoroy));
  },
  shagi: (p) => {
    const one = num(p, 'p');
    const oba = num(p, 'oba');
    const hotyaBy = tochnee(2 * one - oba);
    return [
      {
        text: `Кофе закончится хотя бы в одном автомате: ${dec(one)} + ${dec(one)} − ${dec(oba)} = ${dec(hotyaBy)} — общую часть вычитаем, чтобы не считать её дважды.`,
        value: hotyaBy,
      },
      {
        text: `«Останется в обоих» — противоположное событие: 1 − ${dec(hotyaBy)} = ${dec(tochnee(1 - hotyaBy))}`,
        value: tochnee(1 - hotyaBy),
      },
    ];
  },
  varianty: [
    { n: 1, source: 'задачник', ref: 'задачник 05, № 21', params: { p: 0.1, oba: 0.03 } },
    { n: 2, source: 'задачник', ref: 'задачник 05, № 22', params: { p: 0.1, oba: 0.05 } },
    { n: 3, source: 'задачник', ref: 'задачник 05, № 23', params: { p: 0.2, oba: 0.05 } },
    { n: 4, source: 'задачник', ref: 'задачник 05, № 24', params: { p: 0.2, oba: 0.06 } },
    { n: 5, source: 'конспект', ref: 'конспект, № 62', params: { p: 0.3, oba: 0.12 } },
    { n: 6, source: 'новый', ref: 'создан заново', params: { p: 0.15, oba: 0.04 } },
    { n: 7, source: 'новый', ref: 'создан заново', params: { p: 0.25, oba: 0.08 } },
    { n: 8, source: 'новый', ref: 'создан заново', params: { p: 0.3, oba: 0.1 } },
    { n: 9, source: 'новый', ref: 'создан заново', params: { p: 0.12, oba: 0.03 } },
    { n: 10, source: 'новый', ref: 'создан заново', params: { p: 0.4, oba: 0.15 } },
  ],
};

/* ── 8. Две кости при условии ────────────────────────────────────── */

/** Сколько пар из разрешённых граней дают нужную сумму. */
function paryBezZapreta(zapret: number, summa: number): { ok: number; vsego: number } {
  let ok = 0;
  let vsego = 0;
  for (let a = 1; a <= 6; a += 1) {
    for (let b = 1; b <= 6; b += 1) {
      if (a === zapret || b === zapret) {
        continue;
      }
      vsego += 1;
      if (a + b === summa) {
        ok += 1;
      }
    }
  }
  return { ok, vsego };
}

const P08: Prototype = {
  id: 'p5-08',
  blok: 'uslovnaya',
  nazvanie: 'Две кости: сумма при известном условии',
  tip: 'Условная вероятность',
  zadachnik: [25, 28],
  format: 'десятичная',
  okruglenie: tochno,
  uslovie: (p) => {
    const zapret = num(p, 'zapret');
    const slovo = zapret === 6 ? 'шесть очков' : 'единица';
    return `Игральную кость бросили два раза. Известно, что ${slovo} ${zapret === 6 ? 'не выпало' : 'не выпала'} ни разу. Найдите при этом условии вероятность события «сумма очков равна ${num(p, 's')}».`;
  },
  dopustimo: (p) => {
    const zapret = num(p, 'zapret');
    const s = num(p, 's');
    if (zapret !== 1 && zapret !== 6) {
      return false;
    }
    const { ok, vsego } = paryBezZapreta(zapret, s);
    return ok > 0 && konechnaya(ok / vsego);
  },
  otvet: (p) => {
    const { ok, vsego } = paryBezZapreta(num(p, 'zapret'), num(p, 's'));
    return ok / vsego;
  },
  /* Второй путь: считаем по определению условной вероятности —
     P(A и B) : P(B), где обе вероятности берутся от всех 36 исходов. */
  perebor: (p) => {
    const zapret = num(p, 'zapret');
    const s = num(p, 's');
    let iAiB = 0;
    let iB = 0;
    for (let a = 1; a <= 6; a += 1) {
      for (let b = 1; b <= 6; b += 1) {
        const uslovie = a !== zapret && b !== zapret;
        if (uslovie) {
          iB += 1;
          if (a + b === s) {
            iAiB += 1;
          }
        }
      }
    }
    return iAiB / 36 / (iB / 36);
  },
  shagi: (p) => {
    const zapret = num(p, 'zapret');
    const s = num(p, 's');
    const { ok, vsego } = paryBezZapreta(zapret, s);
    return [
      {
        text: `Условие отбрасывает все броски с ${zapret === 6 ? 'шестёркой' : 'единицей'}: остаётся 5 × 5 = ${vsego} равновозможных пар.`,
        value: vsego,
      },
      { text: `Сумму ${s} среди них дают ${ok}.`, value: ok },
      { text: `P = ${ok} : ${vsego} = ${dec(ok / vsego)}`, value: ok / vsego },
    ];
  },
  varianty: [
    { n: 1, source: 'задачник', ref: 'задачник 05, № 25', params: { zapret: 6, s: 8 } },
    { n: 2, source: 'задачник', ref: 'задачник 05, № 26', params: { zapret: 6, s: 9 } },
    { n: 3, source: 'задачник', ref: 'задачник 05, № 27', params: { zapret: 6, s: 7 } },
    { n: 4, source: 'задачник', ref: 'задачник 05, № 28', params: { zapret: 6, s: 10 } },
    { n: 5, source: 'новый', ref: 'создан заново', params: { zapret: 6, s: 6 } },
    { n: 6, source: 'новый', ref: 'создан заново', params: { zapret: 6, s: 5 } },
    { n: 7, source: 'новый', ref: 'создан заново', params: { zapret: 6, s: 4 } },
    { n: 8, source: 'новый', ref: 'создан заново', params: { zapret: 6, s: 3 } },
    { n: 9, source: 'новый', ref: 'создан заново', params: { zapret: 1, s: 11 } },
    { n: 10, source: 'новый', ref: 'создан заново', params: { zapret: 1, s: 9 } },
  ],
};

export const SUMMY: readonly Prototype[] = [P01, P02, P03, P04, P05, P06, P07, P08];
