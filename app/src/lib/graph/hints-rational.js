/* graph/hints-rational.js — подсказка тренажёра к задаче о гиперболе.

   Подсказка ведёт ученика вопросами, а не выдаёт коэффициенты. Шаги
   те же, что в полном решении (graph/solution-rational.js): тот же
   номер, то же название. Подсказка — начало цепочки решения: она
   кончается на шаге, где найдено то, о чём спрашивает задача.

   Шаг бывает двух видов:

     вопросы (questions) — вопрос и варианты ответа кнопками. Верный
       вариант ровно один. За неверный — короткое пояснение, почему
       нет, и можно выбрать ещё раз. За верный — вывод коэффициента.
       Вопросов в шаге может быть несколько, по очереди: у сдвига
       влево-вправо сначала «куда и на сколько», потом знак в
       знаменателе — на нём ошибаются чаще всего;
     поля (fields) — ввод чисел, как раньше. После верного ответа —
       подстановка и вычисление из полного решения.

   Порядок шагов по записи функции:

     k/x + a          вверх-вниз → k
     k/(x + a)        влево-вправо → k
     k/(x + a) + b    вверх-вниз → влево-вправо → k
     (kx + a)/(x + b) вверх-вниз (это k) → влево-вправо (это b) → a
     k/x и прямая     k по точке A → прямая через треугольник → уравнение
                      → корни → выбор корня → ордината B

   Задачи «найти f(x₀)» и «найти x» заканчиваются шагом «Ответ» с
   подстановкой. Формулы — TeX в $…$; набирает их тот, кто показывает
   подсказку (lib/trainer.ts). Модуль без DOM и без TypeScript: его
   читает и автопроверка scripts/check-rational-hints.mjs. */

import Line from './families/line.js';
import R from './generate-rational.js';
import Solution from './solution-rational.js';

var frac = Line.frac, mul = Line.mul, num = Line.num, isZero = Line.isZero;

/* ══════════════════════════════════════════════════════════
   Числа
   ══════════════════════════════════════════════════════════ */

/* Число для формулы: десятичная запятая, трети — дробью. */
function tex(f) {
  var q = Math.abs(f.q);
  while (q % 2 === 0) { q /= 2; }
  while (q % 5 === 0) { q /= 5; }
  if (q === 1) { return String(Math.round(num(f) * 1e6) / 1e6).replace('.', '{,}'); }
  return (f.p < 0 ? '-' : '') + '\\dfrac{' + Math.abs(f.p) + '}{' + f.q + '}';
}

/* Ответ в поле: так ученик его и наберёт — десятичной дробью, а
   неконечную (−1/3) — обыкновенной: «−0,333» с ключом не сойдётся. */
function plain(f) {
  var q = Math.abs(f.q);
  while (q % 2 === 0) { q /= 2; }
  while (q % 5 === 0) { q /= 5; }
  if (q === 1) { return String(Math.round(num(f) * 1e6) / 1e6).replace('.', ','); }
  return (f.p < 0 ? '-' : '') + Math.abs(f.p) + '/' + Math.abs(f.q);
}

/* Слагаемое со знаком: « + 3», « - 3»; нуль не пишется. */
function term(f) {
  if (isZero(f)) { return ''; }
  return (f.p > 0 ? ' + ' : ' - ') + tex(frac(Math.abs(f.p), f.q));
}

/* Число словами для кнопки: «2», «1,5». */
function words(f) { return R.valueText(f); }

function exact(o) { return o ? frac(o.p, o.q) : null; }

/* Правая часть прямой ax + b: «2x - 3», «-x + 1», «0,5x». */
function lineTexShort(a, b) {
  var n = num(a);
  var lead = n === 1 ? '' : n === -1 ? '-' : tex(a);
  return lead + 'x' + term(b);
}
function f0(v) { return Line.toFrac(v); }
function neg(f) { return mul(frac(-1), f); }

/* Варианты кнопками стоят не по порядку: иначе верный всегда был бы
   первым. Перемешивание детерминированное — по номеру задачи, чтобы
   одна и та же задача показывала кнопки одинаково. */
function shuffle(list, key) {
  var h = 2166136261;
  for (var i = 0; i < key.length; i++) { h = Math.imul(h ^ key.charCodeAt(i), 16777619) >>> 0; }
  var out = list.slice();
  for (var j = out.length - 1; j > 0; j--) {
    h = Math.imul(h ^ (h >>> 15), 2246822507) >>> 0;
    var r = h % (j + 1);
    var tmp = out[j]; out[j] = out[r]; out[r] = tmp;
  }
  return out;
}

/* ══════════════════════════════════════════════════════════
   Сдвиги
   ══════════════════════════════════════════════════════════ */

/* Сдвиг — направление и величина. key — то, по чему автопроверка
   сверяет вариант с ключом: «up 2», «down 2», «none 0». */
function shiftKey(dir, n) { return dir + ' ' + (dir === 'none' ? '0' : plain(n)); }

var VERTICAL_WORDS = {
  up: function (n) { return 'поднялась на ' + words(n); },
  down: function (n) { return 'опустилась на ' + words(n); },
  none: function () { return 'не сдвигалась'; }
};

var HORIZONTAL_WORDS = {
  right: function (n) { return 'вправо на ' + words(n); },
  left: function (n) { return 'влево на ' + words(n); },
  none: function () { return 'не сдвигалась'; }
};

/* Правдоподобные ошибки к сдвигу value: другое направление на ту же
   величину, то же направление на соседнюю величину и «не сдвигалась»
   (ошибка «асимптота — это ось»). Четыре разных сдвига [{ dir, n }],
   первый — верный. Без сдвига верна «не сдвигалась», остальные — на 1
   и 2 в разные стороны. */
function shiftChoices(value, plus, minus) {
  var n = frac(Math.abs(value.p), value.q);
  if (isZero(value)) {
    return [{ dir: 'none', n: n }, { dir: plus, n: frac(1) }, { dir: minus, n: frac(1) },
      { dir: plus, n: frac(2) }];
  }
  var dir = value.p > 0 ? plus : minus;
  var near = num(n) > 1 ? Line.sub(n, frac(1)) : Line.add(n, frac(1));
  return [{ dir: dir, n: n }, { dir: dir === plus ? minus : plus, n: n }, { dir: dir, n: near },
    { dir: 'none', n: frac(0) }];
}

/* Вопрос «вверх или вниз». name — буква сдвига в формуле этого типа
   (у (kx + a)/(x + b) это k). */
function upDownQuestion(t, name, key) {
  var choices = shiftChoices(t, 'up', 'down');
  var right = choices[0];
  var options = choices.map(function (c, i) {
    var why = null;
    if (i > 0) {
      if (c.dir === 'none') {
        why = 'Нет: без сдвига горизонтальной асимптотой была бы сама ось $Ox$, $y = 0$. ' +
          'А пунктир проходит не по оси.';
      } else if (c.dir !== right.dir) {
        why = 'Нет: пунктир проходит ' + (right.dir === 'up' ? 'выше' : 'ниже') +
          ' оси $Ox$ — гипербола ' + (right.dir === 'up' ? 'поднялась' : 'опустилась') +
          ', а не ' + (right.dir === 'up' ? 'опустилась' : 'поднялась') + '.';
      } else {
        why = 'Нет: посчитай клетки от оси $Ox$ до горизонтального пунктира — их не ' +
          words(c.n) + '.';
      }
    }
    return { text: VERTICAL_WORDS[c.dir](c.n), right: i === 0, why: why, key: shiftKey(c.dir, c.n) };
  });
  var said = right.dir === 'none' ? 'гипербола не сдвигалась' : 'гипербола ' + VERTICAL_WORDS[right.dir](right.n);
  return {
    prompt: 'Посмотри на горизонтальную асимптоту (пунктир). Что произошло с гиперболой ' +
      '$y = \\dfrac{k}{x}$ — сдвиг вверх или вниз и на сколько?',
    options: shuffle(options, key + ':ud'),
    right: 'Верно: ' + said + ' $\\Rightarrow$ асимптота $y = ' + tex(t) + '$ $\\Rightarrow$ $' +
      name + ' = ' + tex(t) + '$.',
    answer: shiftKey(right.dir, right.n)
  };
}

/* Вопросы о сдвиге влево-вправо: куда и на сколько, затем знак числа
   в знаменателе. s — абсцисса вертикальной асимптоты, name — буква в
   знаменателе x + name. */
function leftRightQuestions(s, name, key) {
  var choices = shiftChoices(s, 'right', 'left');
  var right = choices[0];
  var options = choices.map(function (c, i) {
    var why = null;
    if (i > 0) {
      if (c.dir === 'none') {
        why = 'Нет: без сдвига вертикальной асимптотой была бы сама ось $Oy$, $x = 0$. ' +
          'А пунктир проходит не по оси.';
      } else if (c.dir !== right.dir) {
        why = 'Нет: пунктир ' + (right.dir === 'right' ? 'справа' : 'слева') + ' от оси $Oy$ — ' +
          'гипербола ушла ' + (right.dir === 'right' ? 'вправо' : 'влево') + '. Здесь смотрим ' +
          'только на рисунок; знак в формуле — следующий вопрос.';
      } else {
        why = 'Нет: посчитай клетки от оси $Oy$ до вертикального пунктира — их не ' +
          words(c.n) + '.';
      }
    }
    return { text: HORIZONTAL_WORDS[c.dir](c.n), right: i === 0, why: why, key: shiftKey(c.dir, c.n) };
  });

  var value = neg(s);                       /* буква в знаменателе: x + value = x − s */
  var denominator = 'x' + term(value);
  var shown = right.dir === 'none' ? 'сдвига нет' : 'сдвиг ' + HORIZONTAL_WORDS[right.dir](right.n);
  var first = {
    prompt: 'Посмотри на вертикальную асимптоту (пунктир). Куда сдвинулась гипербола — ' +
      'влево или вправо и на сколько?',
    options: shuffle(options, key + ':lr'),
    right: 'Верно: ' + shown + ' $\\Rightarrow$ асимптота $x = ' + tex(s) + '$.',
    answer: shiftKey(right.dir, right.n)
  };

  /* Второй вопрос — знак. Варианты: верный, тот же модуль с другим
     знаком (главная ошибка), соседняя величина, нуль. */
  var values = [value, s, Line.add(value, frac(value.p >= 0 ? 1 : -1)), frac(0)];
  if (isZero(value)) { values = [frac(0), frac(1), frac(-1), frac(2)]; }
  var seen = {};
  var signOptions = [];
  values.forEach(function (v, i) {
    var text = '$' + name + ' = ' + tex(v) + '$';
    if (seen[text]) { return; }
    seen[text] = true;
    var why = null;
    if (i > 0) {
      if (num(v) === -num(value) && !isZero(value)) {
        why = 'Это ошибка знака. Асимптота $x = ' + tex(s) + '$ — там знаменатель равен нулю: ' +
          '$x + ' + name + ' = 0$ при $x = ' + tex(s) + '$, значит $' + name + ' = ' + tex(value) +
          '$ и в знаменателе $' + denominator + '$. Сдвиг ' +
          (num(s) > 0 ? 'вправо — в скобке минус.' : 'влево — в скобке плюс.');
      } else if (isZero(v)) {
        why = 'Нет: при $' + name + ' = 0$ асимптотой была бы ось $Oy$, а график сдвинут.';
      } else {
        why = 'Нет: число в знаменателе по модулю равно сдвигу — проверь, на сколько клеток ' +
          'сдвинута асимптота.';
      }
    }
    signOptions.push({ text: text, right: i === 0, why: why, key: name + '=' + plain(v) });
  });
  var second = {
    prompt: 'Какое тогда $' + name + '$ в знаменателе $x + ' + name + '$?',
    options: shuffle(signOptions, key + ':sign'),
    right: 'Верно: асимптота $x = ' + tex(s) + '$ $\\Rightarrow$ в знаменателе $' + denominator +
      '$ $\\Rightarrow$ $' + name + ' = ' + tex(value) + '$.',
    answer: name + '=' + plain(value)
  };
  return [first, second];
}

var REMIND_UP_DOWN = 'Сдвиг вверх-вниз работает напрямую: $+2$ — вверх на 2, $-2$ — вниз на 2.';
var REMIND_LEFT_RIGHT = 'Сдвиг влево-вправо работает наоборот: если к $x$ прибавляется число — ' +
  'гипербола сдвигается влево, если отнимается — вправо. $\\dfrac{k}{x+3}$ — влево на 3, ' +
  '$\\dfrac{k}{x-3}$ — вправо на 3.';
var REMIND_WHOLE = 'Выдели целую часть: $\\dfrac{kx+a}{x+b} = k + \\dfrac{a-kb}{x+b}$. ' +
  'Дробь справа — гипербола, сдвинутая на $k$ вверх-вниз: горизонтальная асимптота $y = k$.';

/* ══════════════════════════════════════════════════════════
   Шаги
   ══════════════════════════════════════════════════════════ */

/* Формулы шага полного решения — их показывает подсказка после
   верного ответа: подстановка и вычисление по шагам. */
function solutionTex(step) {
  return (step.blocks || []).filter(function (b) { return b.type === 'formula' && b.tex; })
    .map(function (b) { return b.tex; });
}

function base(solutionStep) {
  return { number: solutionStep.number, title: solutionStep.title, id: solutionStep.id };
}

/* Формула с найденными сдвигами и буквой k — в неё ученик подставляет
   точку. */
function shiftedTex(c, form) {
  var co = R.coefficients(c, form);
  if (form === 'basic') { return 'y = \\dfrac{k}{x}'; }
  if (form === 'shift-y') { return 'y = \\dfrac{k}{x}' + term(co.a); }
  if (form === 'shift-x') { return 'y = \\dfrac{k}{x' + term(co.a) + '}'; }
  if (form === 'shift-xy') { return 'y = \\dfrac{k}{x' + term(co.a) + '}' + term(co.b); }
  return 'y = \\dfrac{' + (num(co.k) === 1 ? '' : num(co.k) === -1 ? '-' : tex(co.k)) + 'x + a}{x' +
    term(co.b) + '}';
}

function pointStep(sol, c, form, marks) {
  var co = R.coefficients(c, form);
  var name = form === 'linear' ? 'a' : 'k';
  var tuples = marks.map(function (p) { return [plain(f0(p.x)), plain(f0(p.y)), plain(co[name])]; });
  return Object.assign(base(sol), {
    kind: 'fields',
    text: 'Выбери отмеченную точку на графике и подставь её координаты в формулу с найденными ' +
      'сдвигами: $' + shiftedTex(c, form) + '$. Найди $' + name + '$.',
    fields: [{ label: 'x_0 =', answer: tuples[0][0] }, { label: 'y_0 =', answer: tuples[0][1] },
      { label: name + ' =', answer: tuples[0][2] }],
    /* Подходит любая отмеченная точка: у (kx + a)/(x + b) их две. */
    variants: tuples,
    wrong: 'Проверь: точка должна быть отмечена на графике, её координаты — целые числа по клеткам. ' +
      'Подставь $x_0$ и $y_0$ в формулу и вырази $' + name + '$, следи за знаками в скобках.',
    after: solutionTex(sol)
  });
}

function answerStep(sol, meta, c) {
  var q = meta.query;
  var s = c.s, t = c.t;
  var answer = exact(meta.answer);
  var step = Object.assign(base(sol), { kind: 'fields', after: solutionTex(sol), variants: null });
  if (meta.rule === 'coef-sum') {
    step.text = 'Сложи найденные коэффициенты: $k + a + b$.';
    step.fields = [{ label: 'k + a + b =', answer: plain(answer) }];
    step.wrong = 'Проверь знаки слагаемых: сдвиг влево-вправо входит в формулу с обратным знаком.';
    return step;
  }
  if (q && q.type === 'value-at') {
    var x0 = exact(q.x0);
    step.text = 'Подставь $x = ' + tex(x0) + '$ в найденную формулу и посчитай. Смешанную ' +
      'дробь удобнее перевести в неправильную.';
    step.fields = [{ label: 'f(' + tex(x0) + ') =', answer: plain(answer) }];
    step.wrong = 'Сначала посчитай знаменатель, потом дробь, потом прибавь сдвиг.';
    return step;
  }
  var y0 = exact(q.y0);
  step.text = 'Реши уравнение $f(x) = ' + tex(y0) + '$. ОДЗ: знаменатель не равен нулю, $' +
    (isZero(s) ? 'x \\ne 0' : 'x \\ne ' + tex(s)) + '$. Перенеси сдвиг вверх-вниз, ' +
    '$\\dfrac{' + tex(c.m) + '}{x' + term(neg(s)) + '} = ' + tex(y0) + term(neg(t)) +
    '$, затем найди знаменатель и $x$ и проверь, что корень входит в ОДЗ.';
  step.fields = [{ label: 'x =', answer: plain(answer) }];
  step.wrong = 'Проверь, что вычел(ла) сдвиг до того, как перевернуть дробь.';
  return step;
}

/* Сколько шагов в подсказке: до шага, где найдено то, о чём спрашивают. */
var ASKED_STEP = {
  'coef-k': function (form) { return form === 'linear' ? 'horizontal' : 'k'; },
  'coef-a': function (form) {
    return form === 'shift-y' ? 'horizontal' : form === 'linear' ? 'k' : 'vertical';
  },
  'coef-b': function (form) { return form === 'linear' ? 'vertical' : 'horizontal'; }
};

function singleHints(task, solution) {
  var meta = task.meta;
  var form = meta.form;
  var c = R.curve(exact(meta.m), exact(meta.s), exact(meta.t));
  var marks = meta.points.filter(function (p) { return p.role === 'mark'; });
  var key = task.id + ':' + meta.seed;
  var steps = [];

  solution.forEach(function (sol) {
    if (sol.id === 'horizontal') {
      var name = form === 'shift-y' ? 'a' : form === 'linear' ? 'k' : 'b';
      steps.push(Object.assign(base(sol), {
        kind: 'questions', focus: 'horizontal',
        reminder: form === 'linear' ? REMIND_WHOLE + ' ' + REMIND_UP_DOWN : REMIND_UP_DOWN,
        strong: false,
        questions: [upDownQuestion(c.t, name, key)]
      }));
    } else if (sol.id === 'vertical') {
      steps.push(Object.assign(base(sol), {
        kind: 'questions', focus: 'vertical',
        reminder: REMIND_LEFT_RIGHT,
        strong: true,
        questions: leftRightQuestions(c.s, form === 'linear' ? 'b' : 'a', key)
      }));
    } else if (sol.id === 'k') {
      steps.push(pointStep(sol, c, form, marks));
    } else if (sol.id === 'answer' && !ASKED_STEP[meta.rule]) {
      steps.push(answerStep(sol, meta, c));
    }
  });

  var asked = ASKED_STEP[meta.rule];
  if (asked) {
    var id = asked(form);
    var at = steps.findIndex(function (st) { return st.id === id; });
    return at === -1 ? steps : steps.slice(0, at + 1);
  }
  return steps;
}

/* Гипербола k/x и прямая. */
function lineHints(task, solution) {
  var meta = task.meta;
  var cross = meta.intersection;
  var A = meta.points.filter(function (p) { return p.role === 'cross'; })[0];
  var P = meta.points.filter(function (p) { return p.role === 'line'; })[0];
  var k = exact(meta.m);
  var a = exact(meta.line.k), b = exact(meta.line.b);
  var xA = f0(A.x), yA = f0(A.y);
  var xB = exact(cross.B.x), yB = exact(cross.B.y);
  var key = task.id + ':' + meta.seed;
  var steps = [];

  solution.forEach(function (sol) {
    if (sol.id === 'k') {
      steps.push(Object.assign(base(sol), {
        kind: 'fields',
        text: 'Точка $A(' + tex(xA) + ';\\, ' + tex(yA) + ')$ лежит на графике $f(x) = \\dfrac{k}{x}$: ' +
          'подставь её координаты, $k = x_A \\cdot y_A$.',
        fields: [{ label: 'k =', answer: plain(k) }], variants: null,
        wrong: 'Перемножь координаты точки $A$, следи за знаками.',
        after: solutionTex(sol)
      }));
    } else if (sol.id === 'line') {
      var lineA = meta.rule === 'line-a';
      steps.push(Object.assign(base(sol), {
        kind: 'fields',
        text: 'Прямая $g(x) = ax + b$ проходит через $A(' + tex(xA) + ';\\, ' + tex(yA) + ')$ и $(' +
          tex(f0(P.x)) + ';\\, ' + tex(f0(P.y)) + ')$. Построй треугольник наклона, как у линейной ' +
          'функции: катеты по клеткам, $a = \\operatorname{tg} \\alpha$ — вертикальный катет делить ' +
          'на горизонтальный; если прямая убывает — со знаком минус' +
          (lineA ? '.' : '. Затем $b = y_A - a \\cdot x_A$.'),
        fields: lineA ? [{ label: 'a =', answer: plain(a) }]
          : [{ label: 'a =', answer: plain(a) }, { label: 'b =', answer: plain(b) }],
        variants: null,
        wrong: 'Считай катеты по клеткам между двумя точками прямой. Знак $a$ — по направлению: ' +
          'вверх слева направо — плюс, вниз — минус.',
        after: solutionTex(sol)
      }));
    } else if (sol.id === 'equation') {
      var eqRight = '$\\dfrac{' + tex(k) + '}{x} = ' + lineTexShort(a, b) + '$';
      steps.push(Object.assign(base(sol), {
        kind: 'questions', focus: null, reminder: null, strong: false,
        questions: [{
          prompt: 'Какое уравнение задаёт точки пересечения графиков?',
          options: shuffle([
            { text: eqRight, right: true, why: null, key: 'eq' },
            { text: '$\\dfrac{' + tex(k) + '}{x} = 0$', right: false, key: 'eq-zero',
              why: 'Нет: в точках пересечения равны значения двух функций — гиперболы и прямой.' },
            { text: '$' + tex(k) + 'x = ' + lineTexShort(a, b) + '$', right: false, key: 'eq-kx',
              why: 'Нет: у гиперболы $f(x) = \\dfrac{k}{x}$, а не $kx$.' }
          ], key + ':eq'),
          right: 'Верно: значения функций в точке пересечения равны.',
          answer: 'eq'
        }]
      }));
    } else if (sol.id === 'odz') {
      steps.push(Object.assign(base(sol), {
        kind: 'questions', focus: null, reminder: null, strong: false,
        questions: [{
          prompt: 'Какие значения $x$ недопустимы?',
          options: shuffle([
            { text: '$x \\ne 0$', right: true, why: null, key: 'x!=0' },
            { text: '$x \\ne ' + tex(xA) + '$', right: false, key: 'x!=xA',
              why: 'Нет: при $x = ' + tex(xA) + '$ знаменатель не равен нулю — это абсцисса точки $A$.' },
            { text: 'ограничений нет', right: false, key: 'none',
              why: 'Нет: $x$ стоит в знаменателе, а на ноль делить нельзя.' }
          ], key + ':odz'),
          right: 'Верно: ОДЗ — $x \\ne 0$, знаменатель не равен нулю.',
          answer: 'x!=0'
        }]
      }));
    } else if (sol.id === 'quadratic') {
      steps.push(Object.assign(base(sol), {
        kind: 'fields',
        text: 'Умножь обе части на $x \\ne 0$ (по ОДЗ) и перенеси всё в одну часть: ' +
          'получится $ax^2 + bx - k = 0$. Запиши коэффициенты этого уравнения.',
        fields: [{ label: '\\text{при } x^2:', answer: plain(a) }, { label: '\\text{при } x:', answer: plain(b) },
          { label: '\\text{свободный член:}', answer: plain(neg(k)) }],
        variants: null,
        wrong: 'Свободный член — это $-k$: при переносе $k$ меняет знак.',
        after: solutionTex(sol)
      }));
    } else if (sol.id === 'roots') {
      steps.push(Object.assign(base(sol), {
        kind: 'fields',
        text: 'Реши уравнение. Один корень известен заранее — это абсцисса точки $A$. Второй — по ' +
          'теореме Виета: $x_A \\cdot x_B = \\dfrac{-k}{a}$, или через дискриминант.',
        fields: [{ label: 'x_1 =', answer: plain(xA) }, { label: 'x_2 =', answer: plain(xB) }],
        variants: [[plain(xA), plain(xB)], [plain(xB), plain(xA)]],
        wrong: 'Проверь коэффициенты уравнения и знак свободного члена.',
        after: solutionTex(sol)
      }));
    } else if (sol.id === 'choose') {
      var options = [
        { text: '$x = ' + tex(xB) + '$', right: true, why: null, key: 'x=' + plain(xB) },
        { text: '$x = ' + tex(xA) + '$', right: false, key: 'x=' + plain(xA),
          why: 'Нет: это абсцисса точки $A$ — она отмечена на рисунке. Точке $B$ соответствует ' +
            'другой корень.' }
      ];
      steps.push(Object.assign(base(sol), {
        kind: 'questions', focus: null, reminder: null, strong: false,
        questions: [{
          prompt: 'Какой корень подходит — абсцисса точки $B$? (Оба корня не равны нулю и входят в ОДЗ.)',
          options: shuffle(options, key + ':root'),
          right: 'Верно: $x_B = ' + tex(xB) + '$ — точка $A$ уже отмечена, $B$ — второй корень.',
          answer: 'x=' + plain(xB)
        }]
      }));
    } else if (sol.id === 'ordinate') {
      steps.push(Object.assign(base(sol), {
        kind: 'fields',
        text: 'Подставь $x_B$ в формулу гиперболы: $y_B = \\dfrac{k}{x_B}$. Проверь себя по прямой.',
        fields: [{ label: 'y_B =', answer: plain(yB) }], variants: null,
        wrong: 'Подставляй найденный $x_B$, а не абсциссу $A$.',
        after: solutionTex(sol)
      }));
    }
  });
  return steps;
}

/**
 * Шаги подсказки к задаче о гиперболе из движка (meta.family ===
 * 'rational'). Каждый шаг: { number, title, id, kind, … } — номер и
 * название из полного решения.
 */
function fromTask(task) {
  var solution = Solution.fromTask(task);
  return task.meta.form === 'line' ? lineHints(task, solution) : singleHints(task, solution);
}

const api = { fromTask: fromTask };

export default api;
export { fromTask };
