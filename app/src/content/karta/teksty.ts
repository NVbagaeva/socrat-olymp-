/** Тексты «Карты ЕГЭ». */

export const KARTA_TEKST = {
  nazvanie: 'Карта ЕГЭ',
  privet: (imya: string) => `Привет, ${imya}!`,
  privetBezImeni: 'Привет!',
  osvoeno: (n: number, vsego: number) => `Освоено ${n} из ${vsego} заданий`,
  prognoz: 'прогноз',
  prognozMalo: 'Решите ещё немного, чтобы увидеть прогноз',
  prognozChto: 'Как считается прогноз',
  prognozKak:
    'По каждому заданию берём ваши последние пять попыток каждого типа задач: доля верных — шанс решить такое на экзамене. Складываем баллы заданий с этими шансами и переводим первичный балл в тестовый по шкале сайта. Это оценка по тому, что вы решали здесь, а не обещание.',
  chast: (n: 1 | 2) => `Часть ${n}`,
  proliv: 'Пролив ЕГЭ',
  skoro: 'Скоро',
  pozzhe: 'Прогресс появится позже',
  pozzheChto:
    'Тренажёр этого задания ещё готовится — теорию и опорные задачи можно смотреть уже сейчас.',
  skoroChto: 'Этот раздел ещё не открыт. Он появится на карте, как только выйдет на сайте.',
  otkrytRazdel: 'Открыть раздел',
  oZadanii: 'О задании',
  progressPoTipam: 'Прогресс по типам задач',
  stoitPovtorit: 'Стоит повторить:',
  prodolzhit: 'Продолжить тренировку',
  nachat: 'Начать тренировку',
  opornye: 'Опорные задачи',
  zakladka: { dobavit: 'Добавить раздел в избранное', ubrat: 'Убрать раздел из избранного' },
  zakryt: 'Закрыть',
  bolshe: 'Приблизить',
  menshe: 'Отдалить',
  vesMir: 'Весь мир',
  legenda: {
    zagolovok: 'Обозначения',
    osvoeno: 'Освоено',
    vProcesse: 'В процессе',
    neNachato: 'Не начато',
    povtorit: 'Стоит повторить',
    sleduyushchaya: 'Рекомендуем следующей',
    put: 'Рекомендуемый путь',
  },
  materik: (osvoeno: number, vsego: number) => `Освоено ${osvoeno} из ${vsego}`,
  gost: {
    tekst: 'Войдите, чтобы карта запоминала прогресс',
    chto: 'Сейчас карта собрана из того, что вы решали в этом браузере.',
    knopka: 'Войти',
  },
  karta:
    'Карта заданий ЕГЭ: 20 областей. Перемещайтесь клавишей Tab, Enter открывает область, Esc закрывает.',
  status: {
    'ne-nachato': 'не начато',
    'v-processe': 'в процессе',
    osvoeno: 'освоено',
    pozzhe: 'прогресс появится позже',
    skoro: 'скоро',
  },
  gorod: {
    osvoeno: 'пройдено',
    'v-processe': 'в процессе',
    'ne-nachato': 'не начато',
    tekushchaya: 'текущая тема',
  },
  novoe: (nazvanie: string) => `Освоено: ${nazvanie}`,
} as const;

/** Подпись области для экранного диктора. */
export function oblastDlyaDiktora(o: {
  no: number;
  nazvanie: string;
  sostoyanie: keyof typeof KARTA_TEKST.status;
  procent: number;
  povtoritGruppy: readonly string[];
  sleduyushchaya: boolean;
}): string {
  const chasti = [`Задание ${o.no}, ${o.nazvanie}`, KARTA_TEKST.status[o.sostoyanie]];
  if (o.sostoyanie === 'v-processe') chasti.push(`освоено ${o.procent} % типов`);
  if (o.povtoritGruppy.length > 0) {
    chasti.push(`стоит повторить: ${o.povtoritGruppy.join(', ').toLowerCase()}`);
  }
  if (o.sleduyushchaya) chasti.push('рекомендуем следующей');
  return `${chasti.join('. ')}.`;
}

/** Название в две строки для подписи на острове. */
export function vDveStroki(nazvanie: string): string[] {
  if (nazvanie.length <= 12 || !nazvanie.includes(' ')) return [nazvanie];
  const slova = nazvanie.split(' ');
  let luchshe = 1;
  let raznica = Infinity;
  for (let i = 1; i < slova.length; i += 1) {
    const a = slova.slice(0, i).join(' ').length;
    const b = slova.slice(i).join(' ').length;
    if (Math.abs(a - b) < raznica) {
      raznica = Math.abs(a - b);
      luchshe = i;
    }
  }
  return [slova.slice(0, luchshe).join(' '), slova.slice(luchshe).join(' ')];
}
