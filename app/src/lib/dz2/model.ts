/**
 * Новая выдача ДЗ — корзина и мастер выдачи (docs/kabinet-dz2.md).
 * Чистые функции, без браузера: проверяет scripts/check-dz2.mjs.
 *
 * Корзина — элементы из разных разделов, которые учитель добавил кнопкой
 * «В домашку». Мастер дописывает к ним настройки и получателей и собирает
 * запрос dz2_save. Задачи с ответами собираются в браузере учителя:
 * у опорных — в момент добавления (блок фиксированный), у тренажёра — при
 * выдаче, из запаса генератора (у каждого ученика свой набор, если
 * включены «индивидуальные числа»).
 */

export type VidElementa = 'opornye' | 'trenazher' | 'kartochki' | 'variant' | 'teoriya';

/** Готовая задача для ДЗ: условие, ответ в нормальной записи, разбор. */
export interface ZadachaDz {
  kind: string;
  task_ref: string;
  question_html: string;
  risunok?: string;
  level?: 1 | 2 | 3;
  /** Нормальная запись ответа ЕГЭ: «0.25», «-3». */
  answer: string;
  /** Шаги разбора для подсказок и решения: {shagi: [{chto, tex}]}. */
  razbor?: { shagi: { chto: string; tex?: string }[] };
}

export interface ElementKorziny {
  /** Ключ в корзине: повторное «В домашку» того же не дублирует. */
  key: string;
  vid: VidElementa;
  /** Номер хранения раздела. */
  task_no: number;
  title: string;
  /** Что именно — для показа и для «Повторить ДЗ». */
  spec: Record<string, unknown>;
  /** Опорные: все задачи блока (как собрал «В домашку»). */
  tasks?: ZadachaDz[];
  /**
   * Опорные: какие задачи блока идут в ДЗ — task_ref в порядке блока.
   * Нет поля — все задачи.
   */
  vybrany?: string[];
  /** Тренажёр: типы (подтипы генератора), сколько задач в запасе, цель. */
  tipy?: string[];
  zapas?: number;
  goal_kind?: 'all' | 'count' | 'streak';
  goal_n?: number;
  /** Вариант: выданная работа. */
  variant_work_id?: string;
}

export interface Korzina {
  v: 1;
  elementy: ElementKorziny[];
}

export const PUSTAYA_KORZINA: Korzina = { v: 1, elementy: [] };
export const PREDEL_ELEMENTOV = 30;

export function dobavit(k: Korzina, e: ElementKorziny): Korzina {
  if (k.elementy.some((x) => x.key === e.key)) {
    /* Повторное «В домашку» того же блока обновляет задачи, а выбор
       учителя сохраняет — для задач, которые остались в блоке. */
    return {
      ...k,
      elementy: k.elementy.map((x) => (x.key === e.key ? sVyborom(e, x.vybrany) : x)),
    };
  }
  if (k.elementy.length >= PREDEL_ELEMENTOV) return k;
  return { ...k, elementy: [...k.elementy, e] };
}

export function ubrat(k: Korzina, key: string): Korzina {
  return { ...k, elementy: k.elementy.filter((x) => x.key !== key) };
}

export function sdvinut(k: Korzina, key: string, na: -1 | 1): Korzina {
  const i = k.elementy.findIndex((x) => x.key === key);
  const j = i + na;
  if (i < 0 || j < 0 || j >= k.elementy.length) return k;
  const el = [...k.elementy];
  const a = el[i];
  const b = el[j];
  if (a === undefined || b === undefined) return k;
  el[i] = b;
  el[j] = a;
  return { ...k, elementy: el };
}

export function izmenit(k: Korzina, key: string, patch: Partial<ElementKorziny>): Korzina {
  return { ...k, elementy: k.elementy.map((x) => (x.key === key ? { ...x, ...patch, key: x.key } : x)) };
}

/* ── Выбор задач опорного блока ─────────────────────────────────── */

/** Элемент с выбором задач: только те, что есть в блоке; все или ни одной — без поля. */
function sVyborom(e: ElementKorziny, vybrany: readonly string[] | undefined): ElementKorziny {
  const { vybrany: _staryy, ...bez } = e;
  if (vybrany === undefined || e.tasks === undefined) return bez;
  const est = new Set(vybrany);
  const ostalis = e.tasks.filter((z) => est.has(z.task_ref)).map((z) => z.task_ref);
  return ostalis.length === e.tasks.length ? bez : { ...bez, vybrany: ostalis };
}

/** Задачи элемента, которые идут в ДЗ: выбранные, в порядке блока. */
export function vybrannye(e: ElementKorziny): ZadachaDz[] {
  if (e.tasks === undefined) return [];
  if (e.vybrany === undefined) return e.tasks;
  const est = new Set(e.vybrany);
  return e.tasks.filter((z) => est.has(z.task_ref));
}

/** Отметить или снять задачу блока. */
export function otmetit(k: Korzina, key: string, taskRef: string, vkl: boolean): Korzina {
  return {
    ...k,
    elementy: k.elementy.map((x) => {
      if (x.key !== key || x.tasks === undefined) return x;
      const sejchas = new Set(vybrannye(x).map((z) => z.task_ref));
      if (vkl) sejchas.add(taskRef);
      else sejchas.delete(taskRef);
      const refs = x.tasks.filter((z) => sejchas.has(z.task_ref)).map((z) => z.task_ref);
      return refs.length === x.tasks.length ? sVyborom(x, undefined) : { ...x, vybrany: refs };
    }),
  };
}

/** Отметить все задачи блока или снять все. */
export function otmetitVse(k: Korzina, key: string, vkl: boolean): Korzina {
  return {
    ...k,
    elementy: k.elementy.map((x) =>
      x.key !== key || x.tasks === undefined ? x : vkl ? sVyborom(x, undefined) : { ...x, vybrany: [] },
    ),
  };
}

export function v(k: Korzina, key: string): boolean {
  return k.elementy.some((x) => x.key === key);
}

export function razobrat(raw: unknown): Korzina {
  if (typeof raw !== 'object' || raw === null) return PUSTAYA_KORZINA;
  const x = raw as Partial<Korzina>;
  if (x.v !== 1 || !Array.isArray(x.elementy)) return PUSTAYA_KORZINA;
  return {
    v: 1,
    elementy: x.elementy
      .filter(
        (e): e is ElementKorziny =>
          typeof e === 'object' &&
          e !== null &&
          typeof e.key === 'string' &&
          typeof e.title === 'string' &&
          typeof e.task_no === 'number' &&
          ['opornye', 'trenazher', 'kartochki', 'variant', 'teoriya'].includes(e.vid),
      )
      .map((e) =>
        e.vybrany === undefined || (Array.isArray(e.vybrany) && e.vybrany.every((r) => typeof r === 'string'))
          ? e
          : sVyborom(e, undefined),
      )
      .slice(0, PREDEL_ELEMENTOV),
  };
}

/* ── Настройки выдачи ───────────────────────────────────────────── */

export interface Nastroyki {
  title: string;
  note: string;
  /** Кому: классы и отдельные ученики. */
  klassy: string[];
  ucheniki: string[];
  /** Публикация и дедлайн — по Москве, «ГГГГ-ММ-ДДTчч:мм»; пусто — сразу / без срока. */
  publish_msk: string;
  due_msk: string;
  after_due: 'late_ok' | 'closed';
  hints_allowed: boolean;
  attempts_limit: 1 | 2 | 3 | null;
  solutions_when: 'instant' | 'after_due' | 'never';
  individual: boolean;
  kontrol: boolean;
}

export const NASTROYKI_PO_UMOLCHANIYU: Nastroyki = {
  title: '',
  note: '',
  klassy: [],
  ucheniki: [],
  publish_msk: '',
  due_msk: '',
  after_due: 'late_ok',
  hints_allowed: true,
  attempts_limit: null,
  solutions_when: 'instant',
  individual: false,
  kontrol: false,
};

/**
 * Контрольная (В-9 и задание): одна попытка, без подсказок, «Запомни» и
 * разобранный пример выключены, решения — после дедлайна.
 */
export function kontrolnaya(n: Nastroyki, vkl: boolean): Nastroyki {
  return vkl
    ? { ...n, kontrol: true, hints_allowed: false, attempts_limit: 1, solutions_when: n.due_msk === '' ? 'never' : 'after_due' }
    : { ...n, kontrol: false, hints_allowed: true, attempts_limit: null, solutions_when: 'instant' };
}

/** «ГГГГ-ММ-ДДTчч:мм» по Москве → ISO в UTC. Москва без перехода на летнее время: UTC+3. */
export function mskVUtc(msk: string): string | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(msk);
  if (m === null) return null;
  const t = Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]), Number(m[4]) - 3, Number(m[5]));
  return Number.isNaN(t) ? null : new Date(t).toISOString();
}

/** ISO → «ГГГГ-ММ-ДДTчч:мм» по Москве (для полей мастера). */
export function utcVMsk(iso: string): string {
  const d = new Date(Date.parse(iso) + 3 * 3600 * 1000);
  return d.toISOString().slice(0, 16);
}

export type OshibkaVydachi =
  | 'net_nazvaniya'
  | 'net_elementov'
  | 'net_poluchateley'
  | 'srok_proshel'
  | 'srok_ranshe_publikacii'
  | 'reshenia_bez_sroka'
  | 'cel_bolshe_zapasa'
  | 'net_vybrannyh_zadach';

/** Что мешает выдать. Пусто — можно. */
export function proverit(k: Korzina, n: Nastroyki, now = Date.now()): OshibkaVydachi[] {
  const out: OshibkaVydachi[] = [];
  if (n.title.trim() === '') out.push('net_nazvaniya');
  if (k.elementy.length === 0) out.push('net_elementov');
  if (n.klassy.length === 0 && n.ucheniki.length === 0) out.push('net_poluchateley');
  const due = n.due_msk === '' ? null : mskVUtc(n.due_msk);
  const pub = n.publish_msk === '' ? null : mskVUtc(n.publish_msk);
  if (due !== null && Date.parse(due) <= now) out.push('srok_proshel');
  if (due !== null && pub !== null && Date.parse(due) <= Date.parse(pub)) out.push('srok_ranshe_publikacii');
  if (n.solutions_when === 'after_due' && due === null) out.push('reshenia_bez_sroka');
  if (k.elementy.some((e) => e.vid === 'trenazher' && (e.goal_n ?? 0) > (e.zapas ?? 0))) out.push('cel_bolshe_zapasa');
  if (k.elementy.some((e) => e.tasks !== undefined && vybrannye(e).length === 0)) out.push('net_vybrannyh_zadach');
  return out;
}

/* ── Запрос dz2_save ────────────────────────────────────────────── */

/** Задачи элемента: общие или по ученикам (индивидуальные числа). */
export type ZadachiElementa = { obshchie: ZadachaDz[] } | { poUchenikam: Record<string, ZadachaDz[]> };

export function zapros(
  k: Korzina,
  n: Nastroyki,
  zadachi: Record<string, ZadachiElementa>,
  status: 'draft' | 'template',
  id?: string,
): Record<string, unknown> {
  const due = n.due_msk === '' ? null : mskVUtc(n.due_msk);
  const pub = n.publish_msk === '' ? null : mskVUtc(n.publish_msk);
  return {
    ...(id === undefined ? {} : { id }),
    status,
    title: n.title.trim(),
    note: n.note.trim(),
    publish_at: pub,
    due_at: due,
    after_due: n.after_due,
    hints_allowed: n.hints_allowed && !n.kontrol,
    attempts_limit: n.attempts_limit,
    solutions_when: n.solutions_when,
    individual: n.individual,
    kontrol: n.kontrol,
    targets: status === 'template'
      ? []
      : [...n.klassy.map((c) => ({ class_id: c })), ...n.ucheniki.map((s) => ({ student_id: s }))],
    items: k.elementy.map((e, i) => {
      const z = zadachi[e.key];
      const tasks =
        z === undefined
          ? []
          : 'obshchie' in z
            ? z.obshchie.map((t, j) => ({ ...t, position: j + 1 }))
            : Object.entries(z.poUchenikam).flatMap(([student, list]) =>
                list.map((t, j) => ({ ...t, position: j + 1, student_id: student })),
              );
      return {
        position: i + 1,
        kind: e.vid,
        task_no: e.task_no,
        title: e.title,
        spec: e.spec,
        goal_kind: e.vid === 'trenazher' ? (e.goal_kind ?? 'all') : 'all',
        goal_n: e.vid === 'trenazher' && (e.goal_kind ?? 'all') !== 'all' ? (e.goal_n ?? null) : null,
        variant_work_id: e.vid === 'variant' ? (e.variant_work_id ?? null) : null,
        tasks,
      };
    }),
  };
}

/**
 * Ответ в нормальной записи ЕГЭ — та же запись, что normalize_ege_answer
 * в базе: запятая → точка, минусы → «-», без лишних нулей. null — не число.
 */
export function normalnayaZapis(otvet: string): string | null {
  const v = otvet.trim().replace(/[−‒–—‐‑﹣－]/g, '-');
  const m = /^(-?)(\d+)(?:[.,](\d+))?$/.exec(v);
  if (m === null) return null;
  const whole = (m[2] ?? '0').replace(/^0+(\d)/, '$1');
  const frac = (m[3] ?? '').replace(/0+$/, '');
  const body = frac === '' ? whole : `${whole}.${frac}`;
  return m[1] === '-' && body !== '0' ? `-${body}` : body;
}
