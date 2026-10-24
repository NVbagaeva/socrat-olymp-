/**
 * Работы-варианты пробного кабинета — в браузере, пока у сайта нет
 * сервера. Правила — те же, что в базе (20261024120000_raboty_chast2.sql):
 *
 *   выдаёт вариант репетитор и только своим ученикам;
 *   ученик видит свои работы, меняет ответы до срока (или задание на
 *     доработке), сдаёт один раз;
 *   при сдаче часть 1 проверяется сразу, задания 14–20 без ответа и фото
 *     получают 0 «не приступал» (если часть 2 проверяет учитель);
 *   проверяет только учитель, выдавший работу, пока ведёт ученика;
 *   балл не выше максимума, каждое изменение — в истории;
 *   завершить проверку можно, только когда оценены все 14–20;
 *   фото видят ученик и его учитель; у фото срок хранения.
 *
 * Пользователи и связи «учитель — ученик» — из пробного кабинета
 * (lib/kabinet/localDb.ts). Данные работ — в localStorage
 * (budetege:raboty:v1), файлы фото — в IndexedDB (blobs.ts).
 */

import { MAX_BALL, PART2_NUMBERS } from '@/content/variantOnline/bally';
import { proverit } from '@/lib/chast2/sravnenie';
import { readVvod } from '@/lib/chast2/sostoyanie';
import { KabinetError } from '@/lib/kabinet/api';
import { readDb as readKabinet, type Db as KabinetDb } from '@/lib/kabinet/localDb';
import type { Person } from '@/lib/kabinet/types';
import { sameAnswer } from '@/lib/variant/online/normalize';
import type { RabotyApi, UploadMeta } from './api';
import { idbBlobs, type BlobStore } from './blobs';
import { klyuchi as loadKlyuchi, poleKlyucha, type Klyuchi } from './klyuchi';
import { konetsUchebnogoGoda, scoreOf } from './score';
import type {
  Answer,
  CheckRow,
  CheckWork,
  Grade,
  GradeReason,
  IssuedWork,
  MarkLayer,
  Notice,
  Photo,
  StudentWork,
  SubStatus,
  Submission,
  VariantWork,
} from './types';

export const RABOTY_KEY = 'budetege:raboty:v1';

/** Ограничения — как в сервисе загрузки (infra/lite/uploads). */
export const MAX_PHOTOS = 6;
export const MAX_PHOTO_BYTES = 3_000_000;

interface SubRow {
  id: string;
  workId: string;
  userId: string;
  status: SubStatus;
  submittedAt: string | null;
  checkedAt: string | null;
  checkedBy: string | null;
  comment: string | null;
}

export interface RDb {
  v: 1;
  works: VariantWork[];
  recipients: { workId: string; userId: string; assignedAt: string; dueOverride: string | null }[];
  subs: SubRow[];
  answers: (Answer & { subId: string })[];
  photos: (Photo & { subId: string })[];
  marks: { photoId: string; layer: MarkLayer; updatedBy: string; updatedAt: string }[];
  grades: (Grade & { subId: string; updatedBy: string | null })[];
  history: {
    subId: string;
    taskNo: number | null;
    oldBall: number | null;
    newBall: number | null;
    reason: GradeReason;
    changedBy: string | null;
    changedAt: string;
  }[];
  notices: (Notice & { userId: string })[];
}

export function emptyRDb(): RDb {
  return {
    v: 1,
    works: [],
    recipients: [],
    subs: [],
    answers: [],
    photos: [],
    marks: [],
    grades: [],
    history: [],
    notices: [],
  };
}

/** Где лежат данные: localStorage браузера или память (проверки). */
export interface RStore {
  read(): RDb;
  write(db: RDb): void;
}

export function localStore(): RStore {
  const area = (): Storage | null => {
    try {
      return typeof window === 'undefined' ? null : window.localStorage;
    } catch {
      return null;
    }
  };
  return {
    read() {
      try {
        const raw = area()?.getItem(RABOTY_KEY);
        if (raw == null) return emptyRDb();
        const d = JSON.parse(raw) as Partial<RDb>;
        return d.v === 1 ? { ...emptyRDb(), ...d } : emptyRDb();
      } catch {
        return emptyRDb();
      }
    },
    write(db) {
      try {
        area()?.setItem(RABOTY_KEY, JSON.stringify(db));
      } catch {
        /* Нет места: данные живут до перезагрузки. */
      }
    },
  };
}

export function memoryStore(): RStore {
  let db = emptyRDb();
  return {
    read: () => structuredClone(db),
    write: (d) => {
      db = structuredClone(d);
    },
  };
}

export interface LocalRabotyOptions {
  store?: RStore;
  blobs?: BlobStore;
  /** Пользователи и связи кабинета. */
  kabinet?: () => KabinetDb;
  now?: () => Date;
  keys?: (code: string, versiya: number) => Promise<Klyuchi | null>;
  /** Сеть: false — загрузка фото падает с «offline» (очередь повторит). */
  online?: () => boolean;
  /** URL файла: в браузере — object URL. */
  toUrl?: (blob: Blob) => string;
}

function fail(code: string, message: string): never {
  throw new KabinetError(code, message);
}

function newId(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

/** Ключ хранения — как в бакете: raboty/<работа>/<задание>/<id>.jpg. */
export function objectKey(subId: string, taskNo: number, id: string): string {
  return `raboty/${subId}/${String(taskNo).padStart(2, '0')}/${id}.jpg`;
}

/** Первые байты JPEG — проверка по содержимому, а не по имени файла. */
async function isJpeg(blob: Blob): Promise<boolean> {
  const head = new Uint8Array(await blob.slice(0, 3).arrayBuffer());
  return head[0] === 0xff && head[1] === 0xd8 && head[2] === 0xff;
}

export function createLocalRaboty(opts: LocalRabotyOptions = {}): RabotyApi {
  const store = opts.store ?? localStore();
  const blobs = opts.blobs ?? idbBlobs();
  const kab = opts.kabinet ?? readKabinet;
  const clock = opts.now ?? (() => new Date());
  const iso = () => clock().toISOString();
  const keyCache = new Map<string, Promise<Klyuchi | null>>();
  const keysOf = (code: string, v: number) => {
    const k = `${code}|${v}`;
    let p = keyCache.get(k);
    if (p === undefined) {
      p = (opts.keys ?? loadKlyuchi)(code, v);
      keyCache.set(k, p);
    }
    return p;
  };
  const online = opts.online ?? (() => typeof navigator === 'undefined' || navigator.onLine);
  const toUrl = opts.toUrl ?? ((b: Blob) => URL.createObjectURL(b));
  const urls = new Map<string, string>();

  const listeners = new Set<() => void>();
  const emit = () => listeners.forEach((l) => l());
  if (typeof window !== 'undefined') {
    window.addEventListener('storage', (e) => {
      if (e.key === null || e.key === RABOTY_KEY) emit();
    });
  }

  function change<T>(fn: (db: RDb) => T): T {
    const db = store.read();
    const out = fn(db);
    store.write(db);
    emit();
    return out;
  }

  /* ── Кто ── */
  function me(): { id: string; role: 'student' | 'tutor' | 'admin' } {
    const k = kab();
    const u = k.users.find((x) => x.id === k.currentUserId);
    if (u === undefined) fail('not_authenticated', 'Войдите в кабинет');
    return { id: u.id, role: u.role };
  }
  function personOf(id: string): Person {
    const u = kab().users.find((x) => x.id === id);
    return u
      ? { id: u.id, role: u.role, name: u.name }
      : { id, role: 'student', name: 'Удалённый аккаунт' };
  }
  const isMyStudent = (tutorId: string, studentId: string) =>
    kab().links.some(
      (l) => l.tutorId === tutorId && l.studentId === studentId && l.endedAt === null,
    );
  const parentPending = (userId: string) => {
    const u = kab().users.find((x) => x.id === userId);
    return u !== undefined && u.parentEmail !== null && u.parentConfirmedAt === null;
  };

  /* ── Помощники ── */
  const workOf = (db: RDb, id: string) => db.works.find((w) => w.id === id);
  function deadline(db: RDb, workId: string, userId: string): string | null {
    const r = db.recipients.find((x) => x.workId === workId && x.userId === userId);
    return r?.dueOverride ?? workOf(db, workId)?.dueAt ?? null;
  }
  function checks(db: RDb, subId: string, userId: string): SubRow {
    const s = db.subs.find((x) => x.id === subId);
    const w = s && workOf(db, s.workId);
    if (!s || !w || w.tutorId !== userId || !isMyStudent(userId, s.userId)) {
      fail('forbidden', 'Это не ваша работа на проверку');
    }
    return s;
  }
  function mySub(db: RDb, workId: string): SubRow {
    const u = me();
    if (
      u.role !== 'student' ||
      !db.recipients.some((r) => r.workId === workId && r.userId === u.id)
    ) {
      fail('not_your_work', 'Эта работа выдана не вам');
    }
    if (parentPending(u.id)) fail('progress_not_allowed', 'Ждём согласия родителя');
    let s = db.subs.find((x) => x.workId === workId && x.userId === u.id);
    if (s === undefined) {
      s = {
        id: newId(),
        workId,
        userId: u.id,
        status: 'draft',
        submittedAt: null,
        checkedAt: null,
        checkedBy: null,
        comment: null,
      };
      db.subs.push(s);
    }
    return s;
  }
  function canEdit(db: RDb, s: SubRow, taskNo: number): boolean {
    const w = workOf(db, s.workId);
    if (w === undefined) return false;
    if (s.status === 'draft') {
      const d = deadline(db, s.workId, s.userId);
      return w.closedAt === null && (d === null || d > iso());
    }
    return (
      s.status === 'returned' &&
      db.grades.some((g) => g.subId === s.id && g.taskNo === taskNo && g.naDorabotke)
    );
  }
  /** Записать балл с историей (триггеры grades_max и grades_log). */
  function putGrade(
    db: RDb,
    subId: string,
    taskNo: number,
    patch: Partial<Grade>,
    reason: GradeReason,
    by: string | null,
  ) {
    const max = MAX_BALL[taskNo as keyof typeof MAX_BALL];
    if (max === undefined) fail('bad_task', 'Нет такого задания');
    if (
      patch.ball !== undefined &&
      (patch.ball < 0 || patch.ball > max || !Number.isInteger(patch.ball))
    ) {
      fail('ball_over_max', `За №${taskNo} не больше ${max} балл.`);
    }
    const old = db.grades.find((g) => g.subId === subId && g.taskNo === taskNo);
    const oldBall = old?.ball ?? null;
    const oldManual = old?.vruchnuyu ?? false;
    const next: Grade & { subId: string; updatedBy: string | null } = {
      subId,
      taskNo,
      ball: 0,
      kriteriy: null,
      ili: null,
      nePristupal: false,
      vruchnuyu: false,
      naDorabotke: false,
      comment: null,
      ...old,
      ...patch,
      updatedBy: by,
      updatedAt: iso(),
    };
    if (old === undefined) db.grades.push(next);
    else Object.assign(old, next);
    if (oldBall !== next.ball || oldManual !== next.vruchnuyu) {
      db.history.push({
        subId,
        taskNo,
        oldBall,
        newBall: next.ball,
        reason,
        changedBy: by,
        changedAt: iso(),
      });
    }
  }
  function notify(db: RDb, userId: string, kind: Notice['kind'], payload: Record<string, unknown>) {
    db.notices.push({ id: newId(), userId, kind, payload, createdAt: iso(), readAt: null });
  }
  const strip = <T extends { subId: string }>({ subId: _s, ...rest }: T): Omit<T, 'subId'> => rest;
  const subView = (s: SubRow): Submission => ({
    id: s.id,
    status: s.status,
    submittedAt: s.submittedAt,
    checkedAt: s.checkedAt,
    comment: s.comment,
  });
  function marksOf(db: RDb, photoIds: Set<string>): Record<string, MarkLayer> {
    return Object.fromEntries(
      db.marks.filter((m) => photoIds.has(m.photoId)).map((m) => [m.photoId, m.layer]),
    );
  }

  /** Срок хранения истёк — фото удаляются (как budetege-photos.timer). */
  async function udalitIstekshie() {
    const now = iso();
    const gone = store.read().photos.filter((p) => p.expiresAt <= now);
    if (gone.length === 0) return;
    for (const p of gone) await blobs.del(p.id);
    change((db) => {
      const ids = new Set(gone.map((p) => p.id));
      db.photos = db.photos.filter((p) => !ids.has(p.id));
      db.marks = db.marks.filter((m) => !ids.has(m.photoId));
    });
  }

  function studentView(db: RDb, w: VariantWork, userId: string): StudentWork {
    const s = db.subs.find((x) => x.workId === w.id && x.userId === userId) ?? null;
    const photos = s === null ? [] : db.photos.filter((p) => p.subId === s.id).map(strip);
    const all = s === null ? [] : db.grades.filter((g) => g.subId === s.id);
    /* До проверки ученик видит часть 1 и задания, возвращённые на доработку. */
    const visible =
      s === null
        ? []
        : s.status === 'checked'
          ? all
          : all.filter((g) => g.taskNo <= 13 || (s.status === 'returned' && g.naDorabotke));
    const nos = [...Array.from({ length: 13 }, (_, i) => i + 1), ...PART2_NUMBERS];
    return {
      work: w,
      tutor: personOf(w.tutorId),
      deadline: deadline(db, w.id, userId),
      submission: s === null ? null : subView(s),
      answers: s === null ? [] : db.answers.filter((a) => a.subId === s.id).map(strip),
      photos: photos.sort((a, b) => a.taskNo - b.taskNo || a.position - b.position),
      grades: visible.map(({ subId: _s, updatedBy: _u, ...g }) => g),
      marks:
        s?.status === 'checked' || s?.status === 'returned'
          ? marksOf(db, new Set(photos.map((p) => p.id)))
          : {},
      score: s === null || s.status === 'draft' ? null : scoreOf(visible, s.status),
      editable:
        s === null ? (canEditNew(db, w, userId) ? nos : []) : nos.filter((n) => canEdit(db, s, n)),
    };
  }
  function canEditNew(db: RDb, w: VariantWork, userId: string): boolean {
    const d = deadline(db, w.id, userId);
    return w.closedAt === null && (d === null || d > iso());
  }

  const api: RabotyApi = {
    /* ── Ученик ── */
    async myWorks() {
      await udalitIstekshie();
      const u = me();
      const db = store.read();
      return db.recipients
        .filter((r) => r.userId === u.id)
        .flatMap((r) => {
          const w = workOf(db, r.workId);
          return w ? [studentView(db, w, u.id)] : [];
        })
        .sort((a, b) => b.work.createdAt.localeCompare(a.work.createdAt));
    },

    async studentWork(workId) {
      await udalitIstekshie();
      const u = me();
      const db = store.read();
      const w = workOf(db, workId);
      if (!w || !db.recipients.some((r) => r.workId === workId && r.userId === u.id)) return null;
      return studentView(db, w, u.id);
    },

    async saveAnswer(workId, taskNo, punkt, vvod) {
      const value =
        taskNo <= 13 ? (typeof vvod === 'string' ? vvod.slice(0, 40) : '') : readVvod(vvod);
      if (JSON.stringify(value).length > 4000) fail('too_long', 'Слишком длинный ответ');
      change((db) => {
        const s = mySub(db, workId);
        if (!canEdit(db, s, taskNo)) fail('closed', 'Срок прошёл или работа сдана');
        const row = db.answers.find(
          (a) => a.subId === s.id && a.taskNo === taskNo && a.punkt === punkt,
        );
        if (row) Object.assign(row, { vvod: value, auto: null, updatedAt: iso() });
        else
          db.answers.push({
            subId: s.id,
            taskNo,
            punkt,
            vvod: value,
            auto: null,
            updatedAt: iso(),
          });
      });
    },

    async uploadPhoto(workId, taskNo, jpeg, meta: UploadMeta, onProgress) {
      if (!online()) fail('offline', 'Нет связи — фото отправится, когда она появится');
      if (taskNo < 14 || taskNo > 20) fail('bad_task', 'Фото — только к заданиям 14–20');
      if (jpeg.size < 1 || jpeg.size > MAX_PHOTO_BYTES) fail('too_big', 'Фото больше 3 МБ');
      if (!(await isJpeg(jpeg))) fail('not_image', 'Это не фотография');
      const id = newId();
      const photo = change((db) => {
        const s = mySub(db, workId);
        if (!canEdit(db, s, taskNo)) fail('closed', 'Срок прошёл или работа сдана');
        const mine = db.photos.filter((p) => p.subId === s.id && p.taskNo === taskNo);
        if (mine.length >= MAX_PHOTOS) fail('too_many', `Не больше ${MAX_PHOTOS} фото к заданию`);
        const p: Photo & { subId: string } = {
          subId: s.id,
          id,
          taskNo,
          position: Math.max(0, ...mine.map((x) => x.position)) + 1,
          bytes: jpeg.size,
          width: meta.width,
          height: meta.height,
          createdAt: iso(),
          expiresAt: konetsUchebnogoGoda(clock()).toISOString(),
        };
        db.photos.push(p);
        return strip(p);
      });
      try {
        await blobs.put(id, jpeg);
      } catch (e) {
        change((db) => {
          db.photos = db.photos.filter((p) => p.id !== id);
        });
        throw e;
      }
      onProgress?.(1);
      return photo;
    },

    async deletePhoto(photoId) {
      change((db) => {
        const p = db.photos.find((x) => x.id === photoId);
        const s = p && db.subs.find((x) => x.id === p.subId);
        if (!p || !s || s.userId !== me().id) fail('not_found', 'Фото не найдено');
        if (!canEdit(db, s, p.taskNo)) fail('closed', 'Срок прошёл или работа сдана');
        db.photos = db.photos.filter((x) => x.id !== photoId);
        db.photos
          .filter((x) => x.subId === s.id && x.taskNo === p.taskNo)
          .sort((a, b) => a.position - b.position)
          .forEach((x, i) => {
            x.position = i + 1;
          });
      });
      await blobs.del(photoId);
    },

    async orderPhotos(workId, taskNo, ids) {
      change((db) => {
        const s = mySub(db, workId);
        if (!canEdit(db, s, taskNo)) fail('closed', 'Срок прошёл или работа сдана');
        const mine = db.photos.filter((p) => p.subId === s.id && p.taskNo === taskNo);
        if (ids.length !== mine.length || !mine.every((p) => ids.includes(p.id))) {
          fail('bad_order', 'Список фото устарел — обновите страницу');
        }
        for (const p of mine) p.position = ids.indexOf(p.id) + 1;
      });
    },

    async submitWork(workId) {
      const db0 = store.read();
      const w0 = workOf(db0, workId);
      if (!w0) fail('not_your_work', 'Эта работа выдана не вам');
      const k = await keysOf(w0.code, w0.versiya);
      change((db) => {
        const s = mySub(db, workId);
        const w = workOf(db, workId)!;
        const u = me();
        if (s.status === 'returned') {
          for (const g of db.grades.filter((x) => x.subId === s.id && x.naDorabotke)) {
            putGrade(db, s.id, g.taskNo, { naDorabotke: false }, 'return', u.id);
          }
          s.status = 'submitted';
          s.submittedAt = iso();
        } else if (s.status === 'draft') {
          if (!canEditNew(db, w, u.id)) fail('closed', 'Срок сдачи прошёл');
          s.status = 'submitted';
          s.submittedAt = iso();
          const answers = db.answers.filter((a) => a.subId === s.id);
          /* Часть 1: ответ совпал с ключом — балл задания. */
          for (const item of k?.part1 ?? []) {
            const a = answers.find((x) => x.taskNo === item.taskNo && x.punkt === '');
            const right = typeof a?.vvod === 'string' && sameAnswer(a.vvod, item.answer);
            putGrade(db, s.id, item.taskNo, { ball: right ? 1 : 0 }, 'auto', null);
          }
          /* Часть 2: автопроверка ответа — подсказка учителю, не балл. */
          for (const a of answers.filter((x) => x.taskNo >= 14 && k !== null)) {
            const pole = poleKlyucha(k!, a.taskNo, a.punkt);
            a.auto = pole === null ? null : proverit(pole, readVvod(a.vvod));
          }
          if (w.part2Mode === 'teacher') {
            for (const no of PART2_NUMBERS) {
              const est =
                answers.some((a) => a.taskNo === no) ||
                db.photos.some((p) => p.subId === s.id && p.taskNo === no);
              if (!est) putGrade(db, s.id, no, { ball: 0, nePristupal: true }, 'auto', null);
            }
          }
        } else {
          fail('already_submitted', 'Работа уже сдана');
        }
        notify(db, w.tutorId, 'work_submitted', {
          work_id: workId,
          submission_id: s.id,
          title: w.title,
        });
      });
    },

    async photoUrl(photoId) {
      const u = me();
      const db = store.read();
      const p = db.photos.find((x) => x.id === photoId);
      const s = p && db.subs.find((x) => x.id === p.subId);
      const w = s && workOf(db, s.workId);
      const allowed =
        s !== undefined &&
        w !== undefined &&
        (s.userId === u.id || (w.tutorId === u.id && isMyStudent(u.id, s.userId)));
      /* Чужое фото — «не найдено», как 404 у сервиса: не подсказываем, что оно есть. */
      if (!allowed || p === undefined) fail('not_found', 'Фото не найдено');
      const cached = urls.get(photoId);
      if (cached !== undefined) return cached;
      const blob = await blobs.get(photoId);
      if (blob === null) fail('not_found', 'Фото не найдено');
      const url = toUrl(blob);
      urls.set(photoId, url);
      return url;
    },

    /* ── Учитель ── */
    async issueWork(input) {
      const u = me();
      if (u.role !== 'tutor') fail('forbidden', 'Вариант выдаёт репетитор');
      const k = kab();
      if (
        input.classId !== null &&
        !k.classes.some((c) => c.id === input.classId && c.tutorId === u.id)
      ) {
        fail('forbidden', 'Чужой класс');
      }
      if (input.dueAt !== null && input.dueAt <= iso()) fail('bad_due', 'Срок уже прошёл');
      if (input.title.trim() === '') fail('bad_title', 'Нужно название');
      const students = new Set(input.students);
      if (input.classId !== null) {
        for (const m of k.members.filter((x) => x.classId === input.classId))
          students.add(m.studentId);
      }
      if (students.size === 0) fail('no_recipients', 'Некому выдать');
      for (const s of students)
        if (!isMyStudent(u.id, s)) fail('not_your_student', 'Это не ваш ученик');
      return change((db) => {
        const id = newId();
        db.works.push({
          id,
          tutorId: u.id,
          classId: input.classId,
          title: input.title.trim().slice(0, 120),
          note: input.note?.trim() || null,
          code: input.code,
          versiya: input.versiya,
          part2Mode: input.part2Mode,
          dueAt: input.dueAt,
          createdAt: iso(),
          closedAt: null,
        });
        for (const s of students) {
          db.recipients.push({ workId: id, userId: s, assignedAt: iso(), dueOverride: null });
          notify(db, s, 'work_issued', { work_id: id, title: input.title.trim() });
        }
        return id;
      });
    },

    async extendWork(workId, until, studentId = null) {
      const u = me();
      if (until <= iso()) fail('bad_due', 'Срок уже прошёл');
      change((db) => {
        const w = workOf(db, workId);
        if (!w || w.tutorId !== u.id) fail('forbidden', 'Чужая работа');
        if (studentId === null) w.dueAt = until;
        else {
          const r = db.recipients.find((x) => x.workId === workId && x.userId === studentId);
          if (!r) fail('not_recipient', 'Работа этому ученику не выдана');
          r.dueOverride = until;
        }
      });
    },

    async issuedWorks(): Promise<IssuedWork[]> {
      const u = me();
      const db = store.read();
      return db.works
        .filter((w) => w.tutorId === u.id)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .map((w) => ({
          work: w,
          recipients: db.recipients
            .filter((r) => r.workId === w.id)
            .map((r) => {
              const s = db.subs.find((x) => x.workId === w.id && x.userId === r.userId);
              return {
                student: personOf(r.userId),
                deadline: deadline(db, w.id, r.userId),
                status: s?.status ?? 'none',
                submissionId: s?.id ?? null,
                score: s
                  ? scoreOf(
                      db.grades.filter((g) => g.subId === s.id),
                      s.status,
                    )
                  : null,
              };
            }),
        }));
    },

    async checkList(): Promise<CheckRow[]> {
      const u = me();
      if (u.role !== 'tutor') return [];
      const db = store.read();
      return db.subs
        .filter((s) => s.status !== 'draft')
        .flatMap((s) => {
          const w = workOf(db, s.workId);
          if (!w || w.tutorId !== u.id || !isMyStudent(u.id, s.userId)) return [];
          const d = deadline(db, w.id, s.userId);
          return [
            {
              submissionId: s.id,
              workId: w.id,
              title: w.title,
              code: w.code,
              versiya: w.versiya,
              student: personOf(s.userId),
              status: s.status,
              submittedAt: s.submittedAt,
              checkedAt: s.checkedAt,
              late: d !== null && s.submittedAt !== null && s.submittedAt > d,
              score: scoreOf(
                db.grades.filter((g) => g.subId === s.id),
                s.status,
              ),
            },
          ];
        })
        .sort((a, b) => (b.submittedAt ?? '').localeCompare(a.submittedAt ?? ''));
    },

    async checkWork(submissionId): Promise<CheckWork | null> {
      const u = me();
      const db = store.read();
      const s = db.subs.find((x) => x.id === submissionId);
      const w = s && workOf(db, s.workId);
      if (!s || !w || w.tutorId !== u.id || !isMyStudent(u.id, s.userId)) return null;
      const photos = db.photos
        .filter((p) => p.subId === s.id)
        .map(strip)
        .sort((a, b) => a.taskNo - b.taskNo || a.position - b.position);
      const grades = db.grades.filter((g) => g.subId === s.id);
      return {
        work: w,
        student: personOf(s.userId),
        deadline: deadline(db, w.id, s.userId),
        submission: subView(s),
        answers: db.answers.filter((a) => a.subId === s.id).map(strip),
        photos,
        grades: grades.map(({ subId: _s, updatedBy: _u, ...g }) => g),
        marks: marksOf(db, new Set(photos.map((p) => p.id))),
        score: scoreOf(grades, s.status),
        history: db.history
          .filter((h) => h.subId === s.id)
          .map((h) => ({
            taskNo: h.taskNo,
            oldBall: h.oldBall,
            newBall: h.newBall,
            reason: h.reason,
            by: h.changedBy === null ? 'автоматически' : personOf(h.changedBy).name,
            at: h.changedAt,
          })),
      };
    },

    async startCheck(submissionId) {
      const u = me();
      change((db) => {
        const s = checks(db, submissionId, u.id);
        if (s.status === 'checked') {
          db.history.push({
            subId: s.id,
            taskNo: null,
            oldBall: null,
            newBall: null,
            reason: 'reopen',
            changedBy: u.id,
            changedAt: iso(),
          });
        } else if (s.status !== 'submitted' && s.status !== 'checking') {
          fail('not_submitted', 'Работа ещё не сдана');
        }
        s.status = 'checking';
      });
    },

    async setGrade(submissionId, taskNo, ball, kriteriy, ili, comment) {
      const u = me();
      change((db) => {
        const s = checks(db, submissionId, u.id);
        if (taskNo < 14 || taskNo > 20) fail('part2_only', 'Балл части 1 — правкой части 1');
        if (s.status !== 'checking') fail('not_checking', 'Сначала откройте проверку');
        putGrade(
          db,
          s.id,
          taskNo,
          { ball, kriteriy, ili, comment: comment?.trim() || null, nePristupal: false },
          'grade',
          u.id,
        );
      });
    },

    async overridePart1(submissionId, taskNo, right, comment) {
      const u = me();
      change((db) => {
        const s = checks(db, submissionId, u.id);
        if (taskNo < 1 || taskNo > 13) fail('part1_only', 'Только задания 1–13');
        if (s.status !== 'checking') fail('not_checking', 'Сначала откройте проверку');
        putGrade(
          db,
          s.id,
          taskNo,
          { ball: right ? 1 : 0, vruchnuyu: true, comment: comment?.trim() || null },
          'part1',
          u.id,
        );
      });
    },

    async returnTask(submissionId, taskNo, comment) {
      const u = me();
      change((db) => {
        const s = checks(db, submissionId, u.id);
        if (s.status !== 'checking') fail('not_checking', 'Сначала откройте проверку');
        putGrade(
          db,
          s.id,
          taskNo,
          { naDorabotke: true, comment: comment?.trim() || null },
          'return',
          u.id,
        );
        s.status = 'returned';
        notify(db, s.userId, 'task_returned', {
          submission_id: s.id,
          task_no: taskNo,
          work_id: s.workId,
        });
      });
    },

    async finishCheck(submissionId, comment) {
      const u = me();
      change((db) => {
        const s = checks(db, submissionId, u.id);
        if (s.status !== 'checking') fail('not_checking', 'Сначала откройте проверку');
        const left = PART2_NUMBERS.filter(
          (no) => !db.grades.some((g) => g.subId === s.id && g.taskNo === no && !g.naDorabotke),
        );
        if (left.length > 0)
          fail('not_graded', `Не оценены ${left.map((n) => `№${n}`).join(', ')}`);
        const reopened = db.history.some((h) => h.subId === s.id && h.reason === 'reopen');
        s.status = 'checked';
        s.checkedAt = iso();
        s.checkedBy = u.id;
        s.comment = comment?.trim() || s.comment;
        db.history.push({
          subId: s.id,
          taskNo: null,
          oldBall: null,
          newBall: null,
          reason: 'finish',
          changedBy: u.id,
          changedAt: iso(),
        });
        const score = scoreOf(
          db.grades.filter((g) => g.subId === s.id),
          'checked',
        );
        notify(db, s.userId, reopened ? 'work_regraded' : 'work_checked', {
          submission_id: s.id,
          work_id: s.workId,
          ...score,
        });
      });
    },

    async savePhotoMarks(photoId, layer) {
      const u = me();
      change((db) => {
        const p = db.photos.find((x) => x.id === photoId);
        if (!p) fail('not_found', 'Фото не найдено');
        checks(db, p.subId, u.id);
        if (JSON.stringify(layer).length > 200_000) fail('too_big', 'Слишком много пометок');
        const row = db.marks.find((m) => m.photoId === photoId);
        if (row) Object.assign(row, { layer, updatedBy: u.id, updatedAt: iso() });
        else db.marks.push({ photoId, layer, updatedBy: u.id, updatedAt: iso() });
      });
    },

    /* ── Общее ── */
    async notices() {
      const u = me();
      return store
        .read()
        .notices.filter((n) => n.userId === u.id)
        .map(({ userId: _u, ...n }) => n)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    },

    async readNotices() {
      const u = me();
      change((db) => {
        for (const n of db.notices) if (n.userId === u.id && n.readAt === null) n.readAt = iso();
      });
    },

    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
  return api;
}
