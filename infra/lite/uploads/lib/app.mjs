/* Сервис загрузки фото решений части 2 и автопроверки ответов.
   Маршруты (Caddy отдаёт их по адресу /uploads/v1/…, проверив apikey):

     POST   /photo?work=&task=&pos=   тело — изображение; ответ { id, width, height, bytes }
     DELETE /photo/<id>
     POST   /order        { work, task, ids: [...] } — новый порядок фото задания
     GET    /photo/<id>/url           { url, expires } — подписанная ссылка на 10 минут
     POST   /proverka     { work }    автопроверка ответов 14–20: { results: [{ task, punkt, auto }] }

   Кто вызывает — из JWT (Authorization: Bearer). Права проверяют
   функции базы под ролью пользователя (my_submission, can_edit_task,
   can_read_photo); сервис пишет фото и итоги автопроверки под своей
   ролью (service_role). */

import { randomUUID } from 'node:crypto';
import { verifyJwt } from './jwt.mjs';
import { ImageError, prepare } from './image.mjs';
import { proverit } from '../vendor/sravnenie.mjs';

const URL_SECONDS = 600;
const MAX_PER_HOUR = 60;
const UUID = /^[0-9a-f-]{36}$/;

class HttpError extends Error {
  constructor(status, code, message) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

/** Запрос в транзакции от имени пользователя: auth.uid() = sub, роль authenticated. */
async function asUser(pool, sub, fn) {
  const c = await pool.connect();
  try {
    await c.query('begin');
    await c.query("select set_config('request.jwt.claim.sub', $1, true)", [sub]);
    await c.query('set local role authenticated');
    const out = await fn(c);
    await c.query('commit');
    return out;
  } catch (e) {
    await c.query('rollback').catch(() => {});
    if (e.code === '42501' || /forbidden|not_your|closed|progress_not_allowed/.test(e.message ?? '')) {
      throw new HttpError(403, 'forbidden', e.message);
    }
    throw e;
  } finally {
    c.release();
  }
}

/** Запрос под ролью сервиса. */
async function asService(pool, fn) {
  const c = await pool.connect();
  try {
    await c.query('begin');
    await c.query('set local role service_role');
    const out = await fn(c);
    await c.query('commit');
    return out;
  } catch (e) {
    await c.query('rollback').catch(() => {});
    throw e;
  } finally {
    c.release();
  }
}

async function readBody(req, limit) {
  /* Слишком большой файл отсекается по заголовку, не дочитывая тело. */
  if (Number(req.headers['content-length'] ?? 0) > limit) {
    throw new HttpError(413, 'too_big', 'Файл больше 4 МБ');
  }
  const chunks = [];
  let size = 0;
  for await (const ch of req) {
    size += ch.length;
    if (size > limit) throw new HttpError(413, 'too_big', 'Файл больше 4 МБ');
    chunks.push(ch);
  }
  return Buffer.concat(chunks);
}

function send(res, status, body) {
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' });
  res.end(JSON.stringify(body));
}

// keepDays — срок хранения фото в днях (PHOTO_KEEP_DAYS); не задан — до
// конца учебного года (31 августа), и в любом случае не дольше него.
export function createApp({ pool, storage, jwtSecret, now = () => Date.now(), maxPerHour = MAX_PER_HOUR, keepDays = null }) {
  /** Права на задание: работа своя, задание можно менять, в работе — фото учителю. */
  async function editableSubmission(sub, work, task) {
    return asUser(pool, sub, async (c) => {
      const s = (await c.query('select public.my_submission($1) as id', [work])).rows[0].id;
      const ok = (await c.query('select public.can_edit_task($1, $2::smallint) as ok', [s, task])).rows[0].ok;
      if (!ok) throw new HttpError(403, 'closed', 'Срок прошёл или работа сдана');
      const mode = (await c.query('select part2_mode from public.variant_works where id = $1', [work])).rows[0]?.part2_mode;
      if (mode !== 'teacher') throw new HttpError(403, 'self_check', 'В самопроверке фото не отправляются');
      return s;
    });
  }

  async function uploadPhoto(sub, q, body) {
    const work = q.get('work');
    const task = Number(q.get('task'));
    const pos = Number(q.get('pos'));
    if (!UUID.test(work ?? '') || !(task >= 14 && task <= 20) || !(pos >= 1 && pos <= 6)) {
      throw new HttpError(400, 'bad_request', 'Нужны work, task 14–20 и pos 1–6');
    }
    const submission = await editableSubmission(sub, work, task);
    const recent = await asService(pool, async (c) =>
      Number((await c.query(
        "select count(*) from public.photos where submission_id = $1 and created_at > now() - interval '1 hour'",
        [submission])).rows[0].count));
    if (recent >= maxPerHour) throw new HttpError(429, 'rate', 'Слишком много загрузок, попробуйте через час');
    let img;
    try {
      img = await prepare(body);
    } catch (e) {
      if (e instanceof ImageError) throw new HttpError(e.status, e.code, e.message);
      throw e;
    }
    const id = randomUUID();
    const key = `raboty/${submission}/${String(task).padStart(2, '0')}/${id}.jpg`;
    await storage.put(key, img.data);
    const old = await asService(pool, async (c) => {
      const prev = (await c.query(
        'delete from public.photos where submission_id = $1 and task_no = $2 and position = $3 returning object_key',
        [submission, task, pos])).rows;
      await c.query(
        `insert into public.photos (id, submission_id, task_no, position, object_key, bytes, width, height, expires_at)
         values ($1, $2, $3, $4, $5, $6, $7, $8,
                 case when $9::int is null then public.konets_uchebnogo_goda(now())
                      else least(public.konets_uchebnogo_goda(now()), now() + make_interval(days => $9::int)) end)`,
        [id, submission, task, pos, key, img.bytes, img.width, img.height, keepDays]);
      return prev;
    }).catch(async (e) => {
      await storage.remove(key).catch(() => {});
      throw e;
    });
    for (const p of old) await storage.remove(p.object_key).catch(() => {});
    return { id, width: img.width, height: img.height, bytes: img.bytes };
  }

  async function photoOfUser(sub, id) {
    return asService(pool, async (c) =>
      (await c.query(
        `select p.id, p.object_key, p.task_no, s.work_id from public.photos p
           join public.submissions s on s.id = p.submission_id
          where p.id = $1 and s.user_id = $2`, [id, sub])).rows[0]);
  }

  async function deletePhoto(sub, id) {
    const p = await photoOfUser(sub, id);
    if (p === undefined) throw new HttpError(404, 'not_found', 'Нет такого фото');
    await editableSubmission(sub, p.work_id, p.task_no);
    await asService(pool, (c) => c.query('delete from public.photos where id = $1', [id]));
    await storage.remove(p.object_key).catch(() => {});
    return { ok: true };
  }

  async function reorder(sub, body) {
    const { work, task, ids } = body;
    if (!UUID.test(work ?? '') || !(task >= 14 && task <= 20) || !Array.isArray(ids) || ids.length > 6) {
      throw new HttpError(400, 'bad_request', 'Нужны work, task и ids');
    }
    const submission = await editableSubmission(sub, work, task);
    await asService(pool, async (c) => {
      const rows = (await c.query(
        'select * from public.photos where submission_id = $1 and task_no = $2', [submission, task])).rows;
      if (rows.length !== ids.length || !ids.every((i) => rows.some((r) => r.id === i))) {
        throw new HttpError(400, 'bad_order', 'Порядок не совпадает с фото задания');
      }
      await c.query('delete from public.photos where submission_id = $1 and task_no = $2', [submission, task]);
      for (const [i, pid] of ids.entries()) {
        const r = rows.find((x) => x.id === pid);
        await c.query(
          `insert into public.photos (id, submission_id, task_no, position, object_key, bytes, width, height, created_at, expires_at)
           values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
          [r.id, r.submission_id, r.task_no, i + 1, r.object_key, r.bytes, r.width, r.height, r.created_at, r.expires_at]);
      }
    });
    return { ok: true };
  }

  async function photoUrl(sub, id) {
    const row = await asService(pool, async (c) =>
      (await c.query(
        'select object_key, public.can_read_photo(id, $2) as ok from public.photos where id = $1', [id, sub])).rows[0]);
    /* Чужое и несуществующее фото неотличимы: 404 в обоих случаях. */
    if (row === undefined || !row.ok) throw new HttpError(404, 'not_found', 'Нет такого фото');
    return { url: await storage.signedUrl(row.object_key, URL_SECONDS), expires: now() + URL_SECONDS * 1000 };
  }

  async function proverka(sub, body) {
    const work = body?.work;
    if (!UUID.test(work ?? '')) throw new HttpError(400, 'bad_request', 'Нужен work');
    const submission = await asUser(pool, sub, async (c) =>
      (await c.query('select public.my_submission($1) as id', [work])).rows[0].id);
    return asService(pool, async (c) => {
      const w = (await c.query('select variant_code, versiya from public.variant_works where id = $1', [work])).rows[0];
      const keys = (await c.query(
        `select task_no, punkt, pole from public.variant_keys
          where variant_code = $1 and versiya = $2 and task_no >= 14`, [w.variant_code, w.versiya])).rows;
      const answers = (await c.query(
        'select task_no, punkt, vvod from public.submission_answers where submission_id = $1 and task_no >= 14',
        [submission])).rows;
      const results = [];
      for (const a of answers) {
        const k = keys.find((x) => x.task_no === a.task_no && x.punkt === a.punkt);
        if (k === undefined) continue;
        let auto;
        try {
          auto = proverit(k.pole, a.vvod);
        } catch {
          auto = 'uchitel';
        }
        await c.query(
          'update public.submission_answers set auto = $4 where submission_id = $1 and task_no = $2 and punkt = $3',
          [submission, a.task_no, a.punkt, auto]);
        results.push({ task: a.task_no, punkt: a.punkt, auto });
      }
      return { results };
    });
  }

  return async function handle(req, res) {
    try {
      const url = new URL(req.url ?? '/', 'http://x');
      if (url.pathname === '/health') return send(res, 200, { ok: true });
      const token = (req.headers.authorization ?? '').replace(/^Bearer\s+/i, '');
      const user = verifyJwt(token, jwtSecret, now());
      if (user === null) throw new HttpError(401, 'auth', 'Войдите в кабинет');
      const m = /^\/photo\/([0-9a-f-]{36})(\/url)?$/.exec(url.pathname);
      if (req.method === 'POST' && url.pathname === '/photo') {
        return send(res, 200, await uploadPhoto(user.sub, url.searchParams, await readBody(req, 4 * 1024 * 1024)));
      }
      if (req.method === 'DELETE' && m && !m[2]) return send(res, 200, await deletePhoto(user.sub, m[1]));
      if (req.method === 'GET' && m && m[2]) return send(res, 200, await photoUrl(user.sub, m[1]));
      if (req.method === 'POST' && url.pathname === '/order') {
        return send(res, 200, await reorder(user.sub, JSON.parse((await readBody(req, 10_000)).toString('utf8'))));
      }
      if (req.method === 'POST' && url.pathname === '/proverka') {
        return send(res, 200, await proverka(user.sub, JSON.parse((await readBody(req, 10_000)).toString('utf8'))));
      }
      throw new HttpError(404, 'not_found', 'Нет такого адреса');
    } catch (e) {
      if (e instanceof HttpError) {
        /* Тело могло остаться недочитанным — соединение не переиспользовать. */
        if (e.status === 413) res.setHeader('connection', 'close');
        return send(res, e.status, { code: e.code, message: e.message });
      }
      console.error(e);
      return send(res, 500, { code: 'server', message: 'Ошибка сервера' });
    }
  };
}
