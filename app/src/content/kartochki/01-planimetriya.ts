/**
 * Карточки по теории задания №1 «Планиметрия».
 *
 * Каждая карточка опирается на тему справочника (content/spravochnik1):
 * `source` — якорь темы «k-<id>», туда ведёт «Повторить теорию».
 * Чертежи — чертежи тех же тем, рисует движок планиметрии.
 *
 * Примеры с числами — свои, не задачи ЕГЭ. Ответы вычислений и
 * формулы проверяет scripts/verify_cards.
 */

import type { Kartochka, Koloda, ProverkaFormuly } from '@/lib/kartochki/tipy';
import {
  centrOpisannoy,
  centrVpisannoy,
  dist,
  doPryamoy,
  gr,
  naOkr,
  ploshchad,
  rad,
  treugolnik,
  ugol,
  type P,
} from '@/lib/kartochki/schet';

const B = 'база' as const;
const E = 'важно для ЕГЭ' as const;

const kartochki: Kartochka[] = [
  /* ── Углы и параллельные прямые ── */
  {
    id: '1-smezhnye',
    task: 1,
    topic: 'ugly',
    type: 'svoystvo',
    front: 'Чему равна сумма смежных углов?',
    back: '$180^\\circ$',
    pochemu: 'Смежные углы вместе составляют развёрнутый угол.',
    figure: { dvizhok: 'plan', tema: 'smezhnye' },
    level: B,
    source: 'k-smezhnye',
  },
  {
    id: '1-vertikalnye',
    task: 1,
    topic: 'ugly',
    type: 'svoystvo',
    front: 'Какое свойство у вертикальных углов?',
    back: 'Вертикальные углы **равны**.',
    pochemu: 'Оба смежны с одним и тем же углом и дополняют его до $180^\\circ$.',
    figure: { dvizhok: 'plan', tema: 'vertikalnye' },
    level: B,
    source: 'k-vertikalnye',
  },
  {
    id: '1-parallelnye',
    task: 1,
    topic: 'ugly',
    type: 'svoystvo',
    front:
      'Две параллельные прямые пересечены секущей. Как связаны накрест лежащие, соответственные и односторонние углы?',
    back: 'Накрест лежащие углы равны, соответственные равны, односторонние в сумме дают $180^\\circ$.',
    figure: { dvizhok: 'plan', tema: 'parallelnye' },
    level: E,
    source: 'k-parallelnye',
  },
  {
    id: '1-odnostoronnie-l',
    task: 1,
    topic: 'ugly',
    type: 'verno',
    front: 'Односторонние углы при параллельных прямых и секущей равны.',
    verno: false,
    back: 'Неверно: односторонние углы в сумме дают $180^\\circ$.',
    pochemu: 'Равны они, только если оба прямые.',
    level: E,
    source: 'k-parallelnye',
  },
  {
    id: '1-bissektrisa-ugla',
    task: 1,
    topic: 'ugly',
    type: 'verno',
    front: 'Биссектрисы двух смежных углов перпендикулярны.',
    verno: true,
    back: 'Верно.',
    pochemu: 'Половины двух углов, которые в сумме дают $180^\\circ$, в сумме дают $90^\\circ$.',
    level: B,
    source: 'k-bissektrisa-ugla',
  },

  /* ── Треугольник ── */
  {
    id: '1-summa-uglov',
    task: 1,
    topic: 'treugolnik',
    type: 'svoystvo',
    front: 'Чему равна сумма углов треугольника?',
    back: '$\\angle A + \\angle B + \\angle C = 180^\\circ$',
    figure: { dvizhok: 'plan', tema: 'summa-uglov' },
    level: B,
    source: 'k-summa-uglov',
  },
  {
    id: '1-vneshniy-ugol',
    task: 1,
    topic: 'treugolnik',
    type: 'chertezh',
    front: 'Как найти отмеченный внешний угол треугольника?',
    back: 'Внешний угол равен **сумме двух внутренних углов, не смежных с ним**.',
    pochemu:
      'Он и смежный с ним внутренний угол дают $180^\\circ$ — как и сумма всех трёх углов треугольника.',
    figure: { dvizhok: 'plan', tema: 'vneshniy-ugol', povorot: true },
    level: E,
    source: 'k-vneshniy-ugol',
  },
  {
    id: '1-vneshniy-ugol-v',
    task: 1,
    topic: 'treugolnik',
    type: 'vychislenie',
    front:
      'Два угла треугольника равны $48^\\circ$ и $67^\\circ$. Найдите внешний угол при третьей вершине. Ответ дайте в градусах.',
    back: '$48^\\circ + 67^\\circ = 115^\\circ$',
    pochemu: 'Внешний угол — сумма двух внутренних, не смежных с ним.',
    otvet: '115',
    proverka: () => 180 - (180 - 48 - 67),
    level: E,
    source: 'k-vneshniy-ugol',
  },
  {
    id: '1-neravenstvo',
    task: 1,
    topic: 'treugolnik',
    type: 'svoystvo',
    front: 'Неравенство треугольника — что оно утверждает?',
    back: 'Каждая сторона треугольника **меньше суммы двух других**: $a < b + c$.',
    level: B,
    source: 'k-neravenstvo',
  },
  {
    id: '1-neravenstvo-l',
    task: 1,
    topic: 'treugolnik',
    type: 'verno',
    front: 'Существует треугольник со сторонами $3$, $4$ и $8$.',
    verno: false,
    back: 'Неверно: $8 > 3 + 4$.',
    pochemu: 'Сторона должна быть меньше суммы двух других.',
    level: B,
    source: 'k-neravenstvo',
  },
  {
    id: '1-ravnobedrennyy',
    task: 1,
    topic: 'treugolnik',
    type: 'svoystvo',
    front: 'Свойства равнобедренного треугольника?',
    back: 'Углы при основании равны. Медиана, проведённая к основанию, — она же биссектриса и высота.',
    figure: { dvizhok: 'plan', tema: 'ravnobedrennyy' },
    level: E,
    source: 'k-ravnobedrennyy',
  },
  {
    id: '1-ravnostoronniy',
    task: 1,
    topic: 'treugolnik',
    type: 'formula',
    front: 'Высота и площадь равностороннего треугольника со стороной $a$?',
    back: '$h = \\dfrac{a\\sqrt3}{2}$, $S = \\dfrac{a^2\\sqrt3}{4}$',
    figure: { dvizhok: 'plan', tema: 'ravnostoronniy' },
    level: E,
    source: 'k-ravnostoronniy',
  },

  /* ── Элементы треугольника ── */
  {
    id: '1-mediany',
    task: 1,
    topic: 'elementy',
    type: 'svoystvo',
    front: 'В каком отношении точка пересечения медиан делит каждую медиану?',
    back: '$2 : 1$, считая от вершины.',
    figure: { dvizhok: 'plan', tema: 'mediana' },
    level: E,
    source: 'k-mediana',
  },
  {
    id: '1-srednyaya-liniya',
    task: 1,
    topic: 'elementy',
    type: 'formula',
    front: 'Средняя линия треугольника: чему равна и как расположена?',
    back: 'Параллельна третьей стороне и равна её половине: $m = \\dfrac{a}{2}$.',
    figure: { dvizhok: 'plan', tema: 'srednyaya-liniya-treugolnika' },
    level: B,
    source: 'k-srednyaya-liniya-treugolnika',
  },
  {
    id: '1-bissektrisa',
    task: 1,
    topic: 'elementy',
    type: 'formula',
    front: 'Свойство биссектрисы треугольника: как она делит противоположную сторону?',
    back: 'На части, пропорциональные прилежащим сторонам: $\\dfrac{BD}{DC} = \\dfrac{AB}{AC}$.',
    figure: { dvizhok: 'plan', tema: 'bissektrisa-ugla' },
    level: E,
    source: 'k-bissektrisa-ugla',
  },
  {
    id: '1-bissektrisa-v',
    task: 1,
    topic: 'elementy',
    type: 'vychislenie',
    front: '$AD$ — биссектриса треугольника $ABC$, $AB = 6$, $AC = 9$, $BC = 10$. Найдите $BD$.',
    back: '$BD : DC = 6 : 9$, поэтому $BD = 10 \\cdot \\dfrac{6}{15} = 4$.',
    otvet: '4',
    proverka: () => (10 * 6) / (6 + 9),
    level: E,
    source: 'k-bissektrisa-ugla',
  },
  {
    id: '1-centr-opisannoy',
    task: 1,
    topic: 'elementy',
    type: 'svoystvo',
    front: 'Центр описанной окружности треугольника — точка пересечения каких прямых?',
    back: '**Серединных перпендикуляров** к сторонам.',
    pochemu: 'Каждая точка серединного перпендикуляра равноудалена от концов отрезка.',
    figure: { dvizhok: 'plan', tema: 'seredinnyy-perpendikulyar' },
    level: E,
    source: 'k-seredinnyy-perpendikulyar',
  },
  {
    id: '1-centr-vpisannoy',
    task: 1,
    topic: 'elementy',
    type: 'svoystvo',
    front: 'Центр вписанной окружности треугольника — точка пересечения каких прямых?',
    back: '**Биссектрис** углов треугольника.',
    pochemu: 'Каждая точка биссектрисы угла равноудалена от его сторон.',
    level: E,
    source: 'k-tochki-peresecheniya',
  },
  {
    id: '1-vysota-l',
    task: 1,
    topic: 'elementy',
    type: 'verno',
    front: 'Высота треугольника всегда лежит внутри треугольника.',
    verno: false,
    back: 'Неверно: у тупоугольного треугольника высоты из острых углов падают на продолжения сторон.',
    level: B,
    source: 'k-vysota',
  },

  /* ── Прямоугольный треугольник ── */
  {
    id: '1-pifagor',
    task: 1,
    topic: 'pryamougolnyy',
    type: 'formula',
    front: 'Теорема Пифагора?',
    back: '$c^2 = a^2 + b^2$',
    pochemu: 'Квадрат гипотенузы равен сумме квадратов катетов.',
    figure: { dvizhok: 'plan', tema: 'pifagor' },
    level: B,
    source: 'k-pifagor',
  },
  {
    id: '1-trig',
    task: 1,
    topic: 'pryamougolnyy',
    type: 'formula',
    front: 'Синус, косинус и тангенс острого угла прямоугольного треугольника?',
    back: '$\\sin A = \\dfrac{\\text{противолежащий катет}}{\\text{гипотенуза}}$, $\\cos A = \\dfrac{\\text{прилежащий катет}}{\\text{гипотенуза}}$, $\\operatorname{tg} A = \\dfrac{\\text{противолежащий}}{\\text{прилежащий}}$',
    figure: { dvizhok: 'plan', tema: 'trig' },
    level: E,
    source: 'k-trig',
  },
  {
    id: '1-sin-v',
    task: 1,
    topic: 'pryamougolnyy',
    type: 'vychislenie',
    front:
      'Катет прямоугольного треугольника равен $3$, гипотенуза — $5$. Чему равен синус острого угла, противолежащего катету $3$?',
    back: '$\\sin = \\dfrac{3}{5} = 0{,}6$',
    otvet: '0,6',
    proverka: () => 3 / 5,
    level: E,
    source: 'k-trig',
  },
  {
    id: '1-znacheniya',
    task: 1,
    topic: 'pryamougolnyy',
    type: 'svoystvo',
    front: 'Синус и косинус углов $30^\\circ$, $45^\\circ$, $60^\\circ$?',
    back: '$\\sin 30^\\circ = \\tfrac12,\\ \\sin 45^\\circ = \\tfrac{\\sqrt2}{2},\\ \\sin 60^\\circ = \\tfrac{\\sqrt3}{2}$; у косинуса те же числа в обратном порядке.',
    level: E,
    source: 'k-znacheniya',
  },
  {
    id: '1-tg-l',
    task: 1,
    topic: 'pryamougolnyy',
    type: 'verno',
    front: '$\\operatorname{tg} 30^\\circ = \\sqrt3$',
    verno: false,
    back: 'Неверно: $\\operatorname{tg} 30^\\circ = \\dfrac{\\sqrt3}{3}$, а $\\sqrt3$ — это $\\operatorname{tg} 60^\\circ$.',
    level: E,
    source: 'k-znacheniya',
  },
  {
    id: '1-tozhdestvo',
    task: 1,
    topic: 'pryamougolnyy',
    type: 'formula',
    front: 'Основное тригонометрическое тождество?',
    back: '$\\sin^2 A + \\cos^2 A = 1$',
    pochemu: 'Это теорема Пифагора, делённая на квадрат гипотенузы.',
    level: B,
    source: 'k-osnovnoe-tozhdestvo',
  },
  {
    id: '1-tozhdestvo-v',
    task: 1,
    topic: 'pryamougolnyy',
    type: 'vychislenie',
    front: 'Угол $A$ острый, $\\cos A = 0{,}8$. Найдите $\\sin A$.',
    back: '$\\sin A = \\sqrt{1 - 0{,}64} = 0{,}6$',
    otvet: '0,6',
    proverka: () => Math.sqrt(1 - 0.8 ** 2),
    level: E,
    source: 'k-osnovnoe-tozhdestvo',
  },
  {
    id: '1-tupoy-ugol',
    task: 1,
    topic: 'pryamougolnyy',
    type: 'formula',
    front: 'Синус и косинус тупого угла $180^\\circ - \\alpha$ через угол $\\alpha$?',
    back: '$\\sin(180^\\circ - \\alpha) = \\sin\\alpha$, $\\cos(180^\\circ - \\alpha) = -\\cos\\alpha$',
    pochemu: 'Синус смежных углов одинаков, косинус меняет знак.',
    level: E,
    source: 'k-trig-tupogo-ugla',
  },
  {
    id: '1-ugol-30',
    task: 1,
    topic: 'pryamougolnyy',
    type: 'svoystvo',
    front: 'Чему равен катет, лежащий против угла $30^\\circ$?',
    back: '**Половине гипотенузы**.',
    figure: { dvizhok: 'plan', tema: 'ugol-30' },
    level: E,
    source: 'k-ugol-30',
  },
  {
    id: '1-mediana-k-gipotenuze',
    task: 1,
    topic: 'pryamougolnyy',
    type: 'formula',
    front: 'Чему равна медиана, проведённая к гипотенузе?',
    back: 'Половине гипотенузы: $m = \\dfrac{c}{2}$.',
    pochemu: 'Середина гипотенузы — центр описанной окружности.',
    figure: { dvizhok: 'plan', tema: 'mediana-k-gipotenuze' },
    level: E,
    source: 'k-mediana-k-gipotenuze',
  },
  {
    id: '1-vysota-k-gipotenuze',
    task: 1,
    topic: 'pryamougolnyy',
    type: 'chertezh',
    front:
      'Высота $CH$ проведена к гипотенузе. Как она связана с отрезками гипотенузы и с катетами?',
    back: '$CH^2 = AH \\cdot HB$, $CH = \\dfrac{AC \\cdot BC}{AB}$',
    pochemu: 'Высота делит треугольник на два, подобных исходному.',
    figure: { dvizhok: 'plan', tema: 'vysota-k-gipotenuze', povorot: true },
    level: E,
    source: 'k-vysota-k-gipotenuze',
  },
  {
    id: '1-vysota-k-gipotenuze-v',
    task: 1,
    topic: 'pryamougolnyy',
    type: 'vychislenie',
    front:
      'Высота прямоугольного треугольника делит гипотенузу на отрезки $4$ и $9$. Найдите высоту.',
    back: '$h = \\sqrt{4 \\cdot 9} = 6$',
    otvet: '6',
    proverka: () => {
      /* Прямой угол при C: A(−4; 0), B(9; 0), C(0; h) — h из AC ⊥ BC. */
      const A: P = [-4, 0];
      const Bt: P = [9, 0];
      let lo = 0.01;
      let hi = 50;
      for (let i = 0; i < 100; i += 1) {
        const h = (lo + hi) / 2;
        /* Чем выше C, тем острее угол ACB. */
        if (gr(ugol(A, [0, h], Bt)) > 90) lo = h;
        else hi = h;
      }
      return lo;
    },
    level: E,
    source: 'k-vysota-k-gipotenuze',
  },

  /* ── Равенство и подобие ── */
  {
    id: '1-podobie',
    task: 1,
    topic: 'podobie',
    type: 'svoystvo',
    front: 'Признаки подобия треугольников?',
    back: 'По двум углам; по двум пропорциональным сторонам и углу между ними; по трём пропорциональным сторонам.',
    figure: { dvizhok: 'plan', tema: 'podobie' },
    level: E,
    source: 'k-podobie',
  },
  {
    id: '1-otnoshenie-ploshchadey',
    task: 1,
    topic: 'podobie',
    type: 'formula',
    front: 'Треугольники подобны с коэффициентом $k$. Чему равно отношение их площадей?',
    back: '$\\dfrac{S_2}{S_1} = k^2$',
    pochemu: 'Длины умножаются на $k$, а площадь — произведение двух длин.',
    level: E,
    source: 'k-otnoshenie-ploshchadey',
  },
  {
    id: '1-otnoshenie-ploshchadey-v',
    task: 1,
    topic: 'podobie',
    type: 'vychislenie',
    front:
      'Треугольники подобны, коэффициент подобия равен $3$. Площадь меньшего — $5$. Найдите площадь большего.',
    back: '$5 \\cdot 3^2 = 45$',
    otvet: '45',
    proverka: () => {
      const A: P = [0, 0];
      const Bt: P = [2, 0];
      const C: P = [0, 5];
      return ploshchad([3 * A[0], 3 * A[1]], [3 * Bt[0], 3 * Bt[1]], [3 * C[0], 3 * C[1]]);
    },
    level: E,
    source: 'k-otnoshenie-ploshchadey',
  },
  {
    id: '1-ravenstvo-l',
    task: 1,
    topic: 'podobie',
    type: 'verno',
    front: 'Если три угла одного треугольника равны трём углам другого, то треугольники равны.',
    verno: false,
    back: 'Неверно: они только **подобны** — размеры могут быть разными.',
    level: B,
    source: 'k-ravenstvo',
  },

  /* ── Площади ── */
  {
    id: '1-s-treugolnika',
    task: 1,
    topic: 'ploshchadi',
    type: 'formula',
    front: 'Площадь треугольника через сторону и высоту?',
    back: '$S = \\dfrac12\\, a h_a$',
    figure: { dvizhok: 'plan', tema: 'ploshchad-treugolnika' },
    level: B,
    source: 'k-ploshchad-treugolnika',
  },
  {
    id: '1-s-sinus',
    task: 1,
    topic: 'ploshchadi',
    type: 'formula',
    front: 'Площадь треугольника через две стороны и угол между ними?',
    back: '$S = \\dfrac12\\, ab \\sin C$',
    level: E,
    source: 'k-ploshchad-treugolnika',
  },
  {
    id: '1-geron',
    task: 1,
    topic: 'ploshchadi',
    type: 'formula',
    front: 'Формула Герона?',
    back: '$S = \\sqrt{p(p - a)(p - b)(p - c)}$, где $p = \\dfrac{a + b + c}{2}$ — полупериметр.',
    level: E,
    source: 'k-ploshchad-treugolnika',
  },
  {
    id: '1-geron-v',
    task: 1,
    topic: 'ploshchadi',
    type: 'vychislenie',
    front: 'Стороны треугольника равны $13$, $14$ и $15$. Найдите его площадь.',
    back: '$p = 21$, $S = \\sqrt{21 \\cdot 8 \\cdot 7 \\cdot 6} = 84$',
    otvet: '84',
    proverka: () => {
      /* Строим треугольник по сторонам и считаем площадь шнурком. */
      const a = 14;
      const b = 15;
      const c = 13;
      const x = (b * b + a * a - c * c) / (2 * a);
      return ploshchad([0, 0], [a, 0], [x, Math.sqrt(b * b - x * x)]);
    },
    level: E,
    source: 'k-ploshchad-treugolnika',
  },
  {
    id: '1-s-pr',
    task: 1,
    topic: 'ploshchadi',
    type: 'formula',
    front: 'Площадь треугольника через радиус вписанной окружности?',
    back: '$S = pr$, где $p$ — полупериметр.',
    level: E,
    source: 'k-ploshchad-treugolnika',
  },
  {
    id: '1-s-abc',
    task: 1,
    topic: 'ploshchadi',
    type: 'formula',
    front: 'Площадь треугольника через стороны и радиус описанной окружности?',
    back: '$S = \\dfrac{abc}{4R}$',
    level: E,
    source: 'k-ploshchad-treugolnika',
  },
  {
    id: '1-s-parallelogramma',
    task: 1,
    topic: 'ploshchadi',
    type: 'formula',
    front: 'Площадь параллелограмма?',
    back: '$S = a h_a = ab \\sin\\alpha$',
    figure: { dvizhok: 'plan', tema: 'ploshchad-parallelogramma' },
    level: B,
    source: 'k-ploshchad-parallelogramma',
  },
  {
    id: '1-s-romba',
    task: 1,
    topic: 'ploshchadi',
    type: 'formula',
    front: 'Площадь ромба через диагонали?',
    back: '$S = \\dfrac12\\, d_1 d_2$',
    figure: { dvizhok: 'plan', tema: 'ploshchad-romba' },
    level: E,
    source: 'k-ploshchad-romba',
  },
  {
    id: '1-s-trapecii',
    task: 1,
    topic: 'ploshchadi',
    type: 'formula',
    front: 'Площадь трапеции?',
    back: '$S = \\dfrac{a + b}{2}\\, h$',
    pochemu: 'Полусумма оснований — это средняя линия: $S = mh$.',
    figure: { dvizhok: 'plan', tema: 'ploshchad-trapecii' },
    level: B,
    source: 'k-ploshchad-trapecii',
  },
  {
    id: '1-s-trapecii-v',
    task: 1,
    topic: 'ploshchadi',
    type: 'vychislenie',
    front: 'Основания трапеции равны $3$ и $9$, высота — $5$. Найдите площадь трапеции.',
    back: '$\\dfrac{3 + 9}{2} \\cdot 5 = 30$',
    otvet: '30',
    proverka: () => ploshchad([0, 0], [9, 0], [5, 5], [2, 5]),
    level: B,
    source: 'k-ploshchad-trapecii',
  },

  /* ── Теоремы синусов и косинусов ── */
  {
    id: '1-kosinusov',
    task: 1,
    topic: 'sinkos',
    type: 'formula',
    front: 'Теорема косинусов?',
    back: '$c^2 = a^2 + b^2 - 2ab \\cos C$',
    figure: { dvizhok: 'plan', tema: 'teorema-kosinusov' },
    level: E,
    source: 'k-teorema-kosinusov',
  },
  {
    id: '1-sinusov',
    task: 1,
    topic: 'sinkos',
    type: 'formula',
    front: 'Теорема синусов?',
    back: '$\\dfrac{a}{\\sin A} = \\dfrac{b}{\\sin B} = \\dfrac{c}{\\sin C} = 2R$',
    pochemu: '$R$ — радиус описанной окружности.',
    figure: { dvizhok: 'plan', tema: 'teorema-sinusov' },
    level: E,
    source: 'k-teorema-sinusov',
  },
  {
    id: '1-sinusov-v',
    task: 1,
    topic: 'sinkos',
    type: 'vychislenie',
    front:
      'В треугольнике $ABC$ сторона $AB = 6$, $\\angle C = 30^\\circ$. Найдите радиус описанной окружности.',
    back: '$R = \\dfrac{AB}{2 \\sin C} = \\dfrac{6}{2 \\cdot 0{,}5} = 6$',
    otvet: '6',
    proverka: () => {
      /* C на окружности радиуса R видит хорду AB под углом 30°: R = AB / (2 sin 30°)
         проверяем обратным ходом — хорда окружности радиуса 6 под вписанным углом 30°. */
      const O: P = [0, 0];
      const A = naOkr(O, 6, 0);
      const Bt = naOkr(O, 6, 60);
      const C = naOkr(O, 6, 200);
      return Math.abs(gr(ugol(A, C, Bt)) - 30) < 1e-9 && Math.abs(dist(A, Bt) - 6) < 1e-9 ? 6 : NaN;
    },
    level: E,
    source: 'k-teorema-sinusov',
  },

  /* ── Четырёхугольники ── */
  {
    id: '1-summa-chetyrehugolnika',
    task: 1,
    topic: 'chetyrehugolniki',
    type: 'svoystvo',
    front: 'Чему равна сумма углов выпуклого четырёхугольника?',
    back: '$360^\\circ$',
    pochemu: 'Диагональ делит его на два треугольника.',
    level: B,
    source: 'k-summa-uglov-chetyrehugolnika',
  },
  {
    id: '1-parallelogramm',
    task: 1,
    topic: 'chetyrehugolniki',
    type: 'svoystvo',
    front: 'Свойства параллелограмма?',
    back: 'Противоположные стороны и углы равны; диагонали точкой пересечения делятся пополам; соседние углы в сумме дают $180^\\circ$.',
    figure: { dvizhok: 'plan', tema: 'parallelogramm' },
    level: E,
    source: 'k-parallelogramm',
  },
  {
    id: '1-pryamougolnik',
    task: 1,
    topic: 'chetyrehugolniki',
    type: 'svoystvo',
    front: 'Чем диагонали прямоугольника отличаются от диагоналей произвольного параллелограмма?',
    back: 'Диагонали прямоугольника **равны**.',
    figure: { dvizhok: 'plan', tema: 'pryamougolnik' },
    level: B,
    source: 'k-pryamougolnik',
  },
  {
    id: '1-romb',
    task: 1,
    topic: 'chetyrehugolniki',
    type: 'svoystvo',
    front: 'Свойство диагоналей ромба?',
    back: 'Диагонали ромба **перпендикулярны** и делят его углы пополам.',
    figure: { dvizhok: 'plan', tema: 'romb' },
    level: E,
    source: 'k-romb',
  },
  {
    id: '1-romb-l',
    task: 1,
    topic: 'chetyrehugolniki',
    type: 'verno',
    front: 'Диагонали ромба равны.',
    verno: false,
    back: 'Неверно: диагонали ромба перпендикулярны, а равны они у прямоугольника.',
    pochemu: 'Ромб с равными диагоналями — это квадрат.',
    level: E,
    source: 'k-romb',
  },
  {
    id: '1-srednyaya-trapecii',
    task: 1,
    topic: 'chetyrehugolniki',
    type: 'formula',
    front: 'Средняя линия трапеции?',
    back: 'Параллельна основаниям и равна их полусумме: $m = \\dfrac{a + b}{2}$.',
    figure: { dvizhok: 'plan', tema: 'trapeciya' },
    level: E,
    source: 'k-trapeciya',
  },
  {
    id: '1-ravnobedrennaya-trapeciya',
    task: 1,
    topic: 'chetyrehugolniki',
    type: 'svoystvo',
    front: 'Свойства равнобедренной трапеции?',
    back: 'Углы при каждом основании равны, диагонали равны.',
    figure: { dvizhok: 'plan', tema: 'ravnobedrennaya-trapeciya' },
    level: E,
    source: 'k-ravnobedrennaya-trapeciya',
  },

  /* ── Окружность ── */
  {
    id: '1-dlina-ploshchad',
    task: 1,
    topic: 'okruzhnost',
    type: 'formula',
    front: 'Длина окружности и площадь круга радиуса $R$?',
    back: '$C = 2\\pi R$, $S = \\pi R^2$',
    level: B,
    source: 'k-dlina-okruzhnosti',
  },
  {
    id: '1-duga-sektor',
    task: 1,
    topic: 'okruzhnost',
    type: 'formula',
    front: 'Длина дуги и площадь сектора с центральным углом $\\alpha$?',
    back: '$l = 2\\pi R \\cdot \\dfrac{\\alpha}{360^\\circ}$, $S = \\pi R^2 \\cdot \\dfrac{\\alpha}{360^\\circ}$',
    figure: { dvizhok: 'plan', tema: 'dlina-okruzhnosti' },
    level: E,
    source: 'k-dlina-okruzhnosti',
  },
  {
    id: '1-sektor-v',
    task: 1,
    topic: 'okruzhnost',
    type: 'vychislenie',
    front:
      'Радиус круга равен $6$, центральный угол сектора — $60^\\circ$. Найдите площадь сектора, делённую на $\\pi$.',
    back: '$\\dfrac{S}{\\pi} = 36 \\cdot \\dfrac{60^\\circ}{360^\\circ} = 6$',
    otvet: '6',
    proverka: () => {
      /* Сектор — многоугольник с мелким шагом по дуге. */
      const t: P[] = [[0, 0]];
      for (let i = 0; i <= 6000; i += 1) t.push(naOkr([0, 0], 6, (60 * i) / 6000));
      return Math.round((ploshchad(...t) / Math.PI) * 1000) / 1000;
    },
    level: E,
    source: 'k-dlina-okruzhnosti',
  },
  {
    id: '1-kasatelnaya',
    task: 1,
    topic: 'okruzhnost',
    type: 'svoystvo',
    front: 'Как расположены касательная и радиус, проведённый в точку касания?',
    back: 'Они **перпендикулярны**.',
    figure: { dvizhok: 'plan', tema: 'kasatelnaya' },
    level: E,
    source: 'k-kasatelnaya',
  },
  {
    id: '1-otrezki-kasatelnyh',
    task: 1,
    topic: 'okruzhnost',
    type: 'svoystvo',
    front:
      'Из одной точки к окружности проведены две касательные. Что можно сказать об их отрезках?',
    back: 'Отрезки касательных от точки до точек касания **равны**.',
    pochemu: 'Центр окружности лежит на биссектрисе угла между касательными.',
    figure: { dvizhok: 'plan', tema: 'otrezki-kasatelnyh' },
    level: E,
    source: 'k-otrezki-kasatelnyh',
  },
  {
    id: '1-vpisannyy-ugol',
    task: 1,
    topic: 'okruzhnost',
    type: 'chertezh',
    front:
      'Центральный угол $AOB$ и вписанный угол $ACB$ опираются на одну дугу. Как найти вписанный угол?',
    back: 'Вписанный угол равен **половине** центрального угла: $\\angle ACB = \\dfrac12\\,\\angle AOB$.',
    pochemu: 'Центральный угол равен угловой мере дуги, вписанный — её половине.',
    figure: { dvizhok: 'plan', tema: 'centralnyy-vpisannyy', povorot: true },
    level: E,
    source: 'k-centralnyy-vpisannyy',
  },
  {
    id: '1-vpisannyy-ugol-v',
    task: 1,
    topic: 'okruzhnost',
    type: 'vychislenie',
    front:
      'Центральный угол $AOB$ равен $130^\\circ$. Найдите вписанный угол $ACB$, если точка $C$ лежит на большей дуге $AB$. Ответ дайте в градусах.',
    back: '$\\dfrac{130^\\circ}{2} = 65^\\circ$',
    otvet: '65',
    proverka: () => {
      const O: P = [0, 0];
      return gr(ugol(naOkr(O, 5, 0), naOkr(O, 5, 250), naOkr(O, 5, 130)));
    },
    level: E,
    source: 'k-centralnyy-vpisannyy',
  },
  {
    id: '1-vpisannye-ugly',
    task: 1,
    topic: 'okruzhnost',
    type: 'chertezh',
    front: 'Углы $ACB$ и $ADB$ опираются на одну дугу. Что о них можно сказать?',
    back: 'Они **равны**. А вписанный угол, опирающийся на диаметр, — прямой.',
    figure: { dvizhok: 'plan', tema: 'vpisannye-ugly', povorot: true },
    level: E,
    source: 'k-vpisannye-ugly',
  },

  /* ── Вписанные и описанные, правильные многоугольники ── */
  {
    id: '1-vpisannyy-chetyrehugolnik',
    task: 1,
    topic: 'vpisannye',
    type: 'svoystvo',
    front: 'Когда около четырёхугольника можно описать окружность?',
    back: 'Когда сумма его **противоположных углов** равна $180^\\circ$.',
    figure: { dvizhok: 'plan', tema: 'vpisannyy-chetyrehugolnik' },
    level: E,
    source: 'k-vpisannyy-chetyrehugolnik',
  },
  {
    id: '1-vpisannyy-chetyrehugolnik-v',
    task: 1,
    topic: 'vpisannye',
    type: 'vychislenie',
    front:
      'Четырёхугольник $ABCD$ вписан в окружность, $\\angle A = 72^\\circ$. Найдите $\\angle C$. Ответ дайте в градусах.',
    back: '$180^\\circ - 72^\\circ = 108^\\circ$',
    otvet: '108',
    proverka: () => {
      /* A и C на окружности по разные стороны от хорды BD; ∠A = 72° — дуга BCD = 144°. */
      const O: P = [0, 0];
      const Bt = naOkr(O, 5, 0);
      const D = naOkr(O, 5, 144);
      const A = naOkr(O, 5, 250);
      const C = naOkr(O, 5, 70);
      return Math.abs(gr(ugol(Bt, A, D)) - 72) < 1e-9 ? gr(ugol(Bt, C, D)) : NaN;
    },
    level: E,
    source: 'k-vpisannyy-chetyrehugolnik',
  },
  {
    id: '1-opisannyy-chetyrehugolnik',
    task: 1,
    topic: 'vpisannye',
    type: 'svoystvo',
    front: 'Когда в четырёхугольник можно вписать окружность?',
    back: 'Когда суммы его **противоположных сторон** равны: $AB + CD = BC + AD$.',
    figure: { dvizhok: 'plan', tema: 'opisannyy-chetyrehugolnik' },
    level: E,
    source: 'k-opisannyy-chetyrehugolnik',
  },
  {
    id: '1-r-pravilnogo',
    task: 1,
    topic: 'vpisannye',
    type: 'formula',
    front: 'Радиусы описанной и вписанной окружностей правильного треугольника со стороной $a$?',
    back: '$R = \\dfrac{a\\sqrt3}{3}$, $r = \\dfrac{a\\sqrt3}{6}$, $R = 2r$',
    level: E,
    source: 'k-ravnostoronniy',
  },
  {
    id: '1-ugol-pravilnogo',
    task: 1,
    topic: 'vpisannye',
    type: 'formula',
    front: 'Сумма углов выпуклого $n$-угольника и угол правильного $n$-угольника?',
    back: 'Сумма $180^\\circ(n - 2)$; угол правильного $\\alpha_n = \\dfrac{180^\\circ(n - 2)}{n}$.',
    figure: { dvizhok: 'plan', tema: 'pravilnye-mnogougolniki' },
    level: E,
    source: 'k-pravilnye-mnogougolniki',
  },
  {
    id: '1-ugol-pravilnogo-v',
    task: 1,
    topic: 'vpisannye',
    type: 'vychislenie',
    front: 'Найдите угол правильного десятиугольника. Ответ дайте в градусах.',
    back: '$\\dfrac{180^\\circ \\cdot 8}{10} = 144^\\circ$',
    otvet: '144',
    proverka: () => {
      const O: P = [0, 0];
      return gr(ugol(naOkr(O, 1, 0), naOkr(O, 1, 36), naOkr(O, 1, 72)));
    },
    level: E,
    source: 'k-pravilnye-mnogougolniki',
  },
  {
    id: '1-shestiugolnik-l',
    task: 1,
    topic: 'vpisannye',
    type: 'verno',
    front: 'Сторона правильного шестиугольника равна радиусу описанной окружности.',
    verno: true,
    back: 'Верно: $a_6 = R$.',
    pochemu:
      'Радиусы в соседние вершины образуют равносторонний треугольник: центральный угол $60^\\circ$.',
    level: E,
    source: 'k-pravilnye-mnogougolniki',
  },
];

/* ── Проверки формул: случайная фигура → формула и прямой счёт ── */

const proverki: ProverkaFormuly[] = [
  {
    kartochka: '1-tozhdestvo',
    sluchay: (rnd) => {
      const a = 1 + rnd() * 9;
      const b = 1 + rnd() * 9;
      const A = ugol([0, 0], [b, 0], [0, a]);
      return { poFormule: 1, pryamo: Math.sin(A) ** 2 + Math.cos(A) ** 2 };
    },
  },
  {
    kartochka: '1-otnoshenie-ploshchadey',
    sluchay: (rnd) => {
      const [A, Bt, C] = treugolnik(rnd);
      const k = 0.2 + rnd() * 5;
      const s = (p: P): P => [k * p[0], k * p[1]];
      return { poFormule: k * k, pryamo: ploshchad(s(A), s(Bt), s(C)) / ploshchad(A, Bt, C) };
    },
  },
  {
    kartochka: '1-s-treugolnika',
    sluchay: (rnd) => {
      const [A, Bt, C] = treugolnik(rnd);
      return { poFormule: 0.5 * dist(Bt, C) * doPryamoy(A, Bt, C), pryamo: ploshchad(A, Bt, C) };
    },
  },
  {
    kartochka: '1-dlina-ploshchad',
    sluchay: (rnd) => {
      const R = 1 + rnd() * 9;
      const t: P[] = [];
      let l = 0;
      for (let i = 0; i < 6000; i += 1) {
        t.push(naOkr([0, 0], R, (360 * i) / 6000));
        if (i > 0) l += dist(t[i - 1]!, t[i]!);
      }
      l += dist(t[t.length - 1]!, t[0]!);
      /* Многоугольник из 6000 сторон: до круга меньше 1e-6 от величины. */
      return { poFormule: 2 * Math.PI * R + Math.PI * R * R, pryamo: l + ploshchad(...t) };
    },
  },
  {
    kartochka: '1-summa-uglov',
    sluchay: (rnd) => {
      const [A, Bt, C] = treugolnik(rnd);
      return { poFormule: 180, pryamo: gr(ugol(Bt, A, C) + ugol(A, Bt, C) + ugol(A, C, Bt)) };
    },
  },
  {
    kartochka: '1-vneshniy-ugol',
    sluchay: (rnd) => {
      const [A, Bt, C] = treugolnik(rnd);
      /* Продолжение AC за C: точка D = C + (C − A). */
      const D: P = [2 * C[0] - A[0], 2 * C[1] - A[1]];
      return { poFormule: gr(ugol(Bt, A, C) + ugol(A, Bt, C)), pryamo: gr(ugol(Bt, C, D)) };
    },
  },
  {
    kartochka: '1-ravnostoronniy',
    sluchay: (rnd) => {
      const a = 1 + rnd() * 9;
      const C: P = [a / 2, (a * Math.sqrt(3)) / 2];
      return { poFormule: (a * a * Math.sqrt(3)) / 4, pryamo: ploshchad([0, 0], [a, 0], C) };
    },
  },
  {
    kartochka: '1-mediany',
    sluchay: (rnd) => {
      const [A, Bt, C] = treugolnik(rnd);
      const M: P = [(Bt[0] + C[0]) / 2, (Bt[1] + C[1]) / 2];
      const G: P = [(A[0] + Bt[0] + C[0]) / 3, (A[1] + Bt[1] + C[1]) / 3];
      return { poFormule: 2, pryamo: dist(A, G) / dist(G, M) };
    },
  },
  {
    kartochka: '1-srednyaya-liniya',
    sluchay: (rnd) => {
      const [A, Bt, C] = treugolnik(rnd);
      const M: P = [(A[0] + Bt[0]) / 2, (A[1] + Bt[1]) / 2];
      const N: P = [(A[0] + C[0]) / 2, (A[1] + C[1]) / 2];
      return { poFormule: dist(Bt, C) / 2, pryamo: dist(M, N) };
    },
  },
  {
    kartochka: '1-bissektrisa',
    sluchay: (rnd) => {
      const [A, Bt, C] = treugolnik(rnd);
      /* D — точка BC, где углы BAD и DAC равны: ищем делением пополам. */
      let lo = 0;
      let hi = 1;
      for (let i = 0; i < 80; i += 1) {
        const t = (lo + hi) / 2;
        const D: P = [Bt[0] + t * (C[0] - Bt[0]), Bt[1] + t * (C[1] - Bt[1])];
        if (ugol(Bt, A, D) < ugol(D, A, C)) lo = t;
        else hi = t;
      }
      const D: P = [Bt[0] + lo * (C[0] - Bt[0]), Bt[1] + lo * (C[1] - Bt[1])];
      return { poFormule: dist(A, Bt) / dist(A, C), pryamo: dist(Bt, D) / dist(D, C) };
    },
  },
  {
    kartochka: '1-pifagor',
    sluchay: (rnd) => {
      const a = 1 + rnd() * 9;
      const b = 1 + rnd() * 9;
      return { poFormule: Math.sqrt(a * a + b * b), pryamo: dist([a, 0], [0, b]) };
    },
  },
  {
    kartochka: '1-trig',
    sluchay: (rnd) => {
      const a = 1 + rnd() * 9;
      const b = 1 + rnd() * 9;
      /* C(0; 0) — прямой угол, A(b; 0), B(0; a): против A катет a. */
      const A: P = [b, 0];
      return { poFormule: a / Math.hypot(a, b), pryamo: Math.sin(ugol([0, 0], A, [0, a])) };
    },
  },
  {
    kartochka: '1-tupoy-ugol',
    sluchay: (rnd) => {
      const al = 5 + rnd() * 80;
      return { poFormule: -Math.cos(rad(al)), pryamo: Math.cos(rad(180 - al)) };
    },
  },
  {
    kartochka: '1-ugol-30',
    sluchay: (rnd) => {
      const c = 1 + rnd() * 9;
      const A: P = [0, 0];
      const Bt = naOkr(A, c, 30);
      const C: P = [Bt[0], 0];
      return { poFormule: c / 2, pryamo: dist(Bt, C) };
    },
  },
  {
    kartochka: '1-mediana-k-gipotenuze',
    sluchay: (rnd) => {
      const a = 1 + rnd() * 9;
      const b = 1 + rnd() * 9;
      const M: P = [a / 2, b / 2];
      return { poFormule: Math.hypot(a, b) / 2, pryamo: dist([0, 0], M) };
    },
  },
  {
    kartochka: '1-vysota-k-gipotenuze',
    sluchay: (rnd) => {
      const a = 1 + rnd() * 9;
      const b = 1 + rnd() * 9;
      const C: P = [0, 0];
      const A: P = [b, 0];
      const Bt: P = [0, a];
      const h = doPryamoy(C, A, Bt);
      return { poFormule: (a * b) / Math.hypot(a, b), pryamo: h };
    },
  },
  {
    kartochka: '1-s-sinus',
    sluchay: (rnd) => {
      const [A, Bt, C] = treugolnik(rnd);
      return {
        poFormule: 0.5 * dist(C, A) * dist(C, Bt) * Math.sin(ugol(A, C, Bt)),
        pryamo: ploshchad(A, Bt, C),
      };
    },
  },
  {
    kartochka: '1-geron',
    sluchay: (rnd) => {
      const [A, Bt, C] = treugolnik(rnd);
      const a = dist(Bt, C);
      const b = dist(A, C);
      const c = dist(A, Bt);
      const p = (a + b + c) / 2;
      return { poFormule: Math.sqrt(p * (p - a) * (p - b) * (p - c)), pryamo: ploshchad(A, Bt, C) };
    },
  },
  {
    kartochka: '1-s-pr',
    sluchay: (rnd) => {
      const [A, Bt, C] = treugolnik(rnd);
      const p = (dist(Bt, C) + dist(A, C) + dist(A, Bt)) / 2;
      const r = doPryamoy(centrVpisannoy(A, Bt, C), A, Bt);
      return { poFormule: p * r, pryamo: ploshchad(A, Bt, C) };
    },
  },
  {
    kartochka: '1-s-abc',
    sluchay: (rnd) => {
      const [A, Bt, C] = treugolnik(rnd);
      const R = dist(centrOpisannoy(A, Bt, C), A);
      return {
        poFormule: (dist(Bt, C) * dist(A, C) * dist(A, Bt)) / (4 * R),
        pryamo: ploshchad(A, Bt, C),
      };
    },
  },
  {
    kartochka: '1-s-parallelogramma',
    sluchay: (rnd) => {
      const a = 1 + rnd() * 9;
      const b = 1 + rnd() * 9;
      const al = 10 + rnd() * 160;
      const D = naOkr([0, 0], b, al);
      return {
        poFormule: a * b * Math.sin(rad(al)),
        pryamo: ploshchad([0, 0], [a, 0], [a + D[0], D[1]], D),
      };
    },
  },
  {
    kartochka: '1-s-romba',
    sluchay: (rnd) => {
      const d1 = 1 + rnd() * 9;
      const d2 = 1 + rnd() * 9;
      return {
        poFormule: (d1 * d2) / 2,
        pryamo: ploshchad([-d1 / 2, 0], [0, -d2 / 2], [d1 / 2, 0], [0, d2 / 2]),
      };
    },
  },
  {
    kartochka: '1-s-trapecii',
    sluchay: (rnd) => {
      const a = 2 + rnd() * 8;
      const b = 1 + rnd() * 8;
      const h = 1 + rnd() * 8;
      const x = rnd() * 4 - 2;
      return {
        poFormule: ((a + b) / 2) * h,
        pryamo: ploshchad([0, 0], [a, 0], [x + b, h], [x, h]),
      };
    },
  },
  {
    kartochka: '1-srednyaya-trapecii',
    sluchay: (rnd) => {
      const a = 2 + rnd() * 8;
      const b = 1 + rnd() * 8;
      const h = 1 + rnd() * 8;
      const x = rnd() * 4 - 2;
      /* Середины боковых сторон (0;0)–(x;h) и (a;0)–(x+b;h). */
      return { poFormule: (a + b) / 2, pryamo: dist([x / 2, h / 2], [(a + x + b) / 2, h / 2]) };
    },
  },
  {
    kartochka: '1-kosinusov',
    sluchay: (rnd) => {
      const [A, Bt, C] = treugolnik(rnd);
      const a = dist(Bt, C);
      const b = dist(A, C);
      return {
        poFormule: a * a + b * b - 2 * a * b * Math.cos(ugol(A, C, Bt)),
        pryamo: dist(A, Bt) ** 2,
      };
    },
  },
  {
    kartochka: '1-sinusov',
    sluchay: (rnd) => {
      const [A, Bt, C] = treugolnik(rnd);
      const R = dist(centrOpisannoy(A, Bt, C), A);
      return { poFormule: 2 * R, pryamo: dist(Bt, C) / Math.sin(ugol(Bt, A, C)) };
    },
  },
  {
    kartochka: '1-duga-sektor',
    sluchay: (rnd) => {
      const R = 1 + rnd() * 9;
      const al = 10 + rnd() * 340;
      const t: P[] = [[0, 0]];
      let l = 0;
      for (let i = 0; i <= 4000; i += 1) {
        const q = naOkr([0, 0], R, (al * i) / 4000);
        if (i > 0) l += dist(t[t.length - 1]!, q);
        t.push(q);
      }
      return {
        poFormule: Math.PI * R * R * (al / 360) + 2 * Math.PI * R * (al / 360),
        pryamo: ploshchad(...t) + l,
      };
    },
  },
  {
    kartochka: '1-otrezki-kasatelnyh',
    sluchay: (rnd) => {
      const r = 1 + rnd() * 4;
      const d = r + 0.5 + rnd() * 6;
      /* Точки касания из M(d; 0): угол при центре arccos(r/d). */
      const f = gr(Math.acos(r / d));
      const M: P = [d, 0];
      return { poFormule: dist(M, naOkr([0, 0], r, f)), pryamo: dist(M, naOkr([0, 0], r, -f)) };
    },
  },
  {
    kartochka: '1-kasatelnaya',
    sluchay: (rnd) => {
      const r = 1 + rnd() * 4;
      const d = r + 0.5 + rnd() * 6;
      const T = naOkr([0, 0], r, gr(Math.acos(r / d)));
      return { poFormule: 90, pryamo: gr(ugol([0, 0], T, [d, 0])) };
    },
  },
  {
    kartochka: '1-vpisannyy-ugol',
    sluchay: (rnd) => {
      const a = rnd() * 150;
      const b = a + 20 + rnd() * 150;
      const c = b + 5 + rnd() * (355 - b);
      const O: P = [0, 0];
      const A = naOkr(O, 3, a);
      const Bt = naOkr(O, 3, b);
      const C = naOkr(O, 3, c);
      return { poFormule: gr(ugol(A, O, Bt)) / 2, pryamo: gr(ugol(A, C, Bt)) };
    },
  },
  {
    kartochka: '1-vpisannyy-chetyrehugolnik',
    sluchay: (rnd) => {
      const u = [0, 1, 2, 3].map(() => rnd() * 360).sort((x, y) => x - y);
      const [A, Bt, C, D] = u.map((g) => naOkr([0, 0], 2, g)) as [P, P, P, P];
      return { poFormule: 180, pryamo: gr(ugol(D, A, Bt) + ugol(Bt, C, D)) };
    },
  },
  {
    kartochka: '1-r-pravilnogo',
    sluchay: (rnd) => {
      const a = 1 + rnd() * 9;
      const A: P = [0, 0];
      const Bt: P = [a, 0];
      const C: P = [a / 2, (a * Math.sqrt(3)) / 2];
      return {
        poFormule: (a * Math.sqrt(3)) / 3 + (a * Math.sqrt(3)) / 6,
        pryamo: dist(centrOpisannoy(A, Bt, C), A) + doPryamoy(centrVpisannoy(A, Bt, C), A, Bt),
      };
    },
  },
  {
    kartochka: '1-ugol-pravilnogo',
    sluchay: (rnd) => {
      const n = 3 + Math.floor(rnd() * 15);
      const O: P = [0, 0];
      const v = (i: number) => naOkr(O, 1, (360 * i) / n);
      return { poFormule: (180 * (n - 2)) / n, pryamo: gr(ugol(v(0), v(1), v(2))) };
    },
  },
];

const KOLODA_1: Koloda = {
  task: 1,
  slug: '1',
  title: 'Планиметрия',
  teoriya: 'teoriya/',
  podtemy: [
    { id: 'ugly', title: 'Углы и параллельные прямые' },
    { id: 'treugolnik', title: 'Треугольник' },
    { id: 'elementy', title: 'Медиана, биссектриса, средняя линия' },
    { id: 'pryamougolnyy', title: 'Прямоугольный треугольник' },
    { id: 'podobie', title: 'Равенство и подобие' },
    { id: 'ploshchadi', title: 'Площади' },
    { id: 'sinkos', title: 'Теоремы синусов и косинусов' },
    { id: 'chetyrehugolniki', title: 'Четырёхугольники' },
    { id: 'okruzhnost', title: 'Окружность' },
    { id: 'vpisannye', title: 'Вписанные и описанные, правильные многоугольники' },
  ],
  kartochki,
  proverki,
};

export default KOLODA_1;
