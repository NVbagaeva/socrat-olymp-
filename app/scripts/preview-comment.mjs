#!/usr/bin/env node
/* scripts/preview-comment.mjs — комментарий со снимками к pull request.

   Читает опись, собранную preview-shots.mjs, и пишет её картинками
   в комментарий. Комментарий один на pull request: он находится
   по скрытой метке и переписывается на каждый пуш, чтобы лента
   не зарастала повторами.

   Нужные переменные окружения:
     SHOTS_DIR   — папка со снимками и opis.json
     SHOTS_BASE  — адрес, по которому снимки уже выложены
     GITHUB_REPOSITORY, PR_NUMBER, GITHUB_TOKEN — куда писать
   DRY_RUN=1 печатает готовый текст и никуда не ходит. */

import fs from 'node:fs';
import path from 'node:path';

const METKA = '<!-- preview-shots -->';

function telo(opis, baza) {
  const strok = [METKA, '## Снимки страниц', ''];
  strok.push(
    'Собрано из этой ветки. Нажмите на картинку, чтобы открыть её целиком — ' +
      'страницы сняты во всю высоту.',
    '',
  );
  for (const put of opis.puti) {
    strok.push(`<details><summary><b>${put}</b></summary>`, '');
    for (const shirina of opis.shiriny) {
      const snimok = opis.snimki.find((s) => s.put === put && s.shirina === shirina);
      if (snimok === undefined) {
        continue;
      }
      strok.push(`**${shirina}**`, '', `![${put} на ${shirina}](${baza}/${snimok.fayl})`, '');
    }
    strok.push('</details>', '');
  }
  strok.push(
    '<sub>Страницы по умолчанию заданы в `app/scripts/preview-shots.mjs`. Чтобы снять ещё ' +
      'одну, напишите в описании pull request строку `превью: /адрес/`.</sub>',
  );
  return strok.join('\n');
}

async function api(put, metod, telo) {
  const otvet = await fetch(`https://api.github.com${put}`, {
    method: metod,
    headers: {
      accept: 'application/vnd.github+json',
      authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
      'content-type': 'application/json',
      'user-agent': 'preview-shots',
    },
    body: telo === undefined ? undefined : JSON.stringify(telo),
  });
  if (!otvet.ok) {
    throw new Error(`${metod} ${put}: ${otvet.status} ${await otvet.text()}`);
  }
  return otvet.json();
}

async function main() {
  const papka = process.env.SHOTS_DIR;
  const baza = process.env.SHOTS_BASE;
  if (papka === undefined || baza === undefined) {
    throw new Error('Нужны SHOTS_DIR и SHOTS_BASE');
  }
  const opis = JSON.parse(fs.readFileSync(path.join(papka, 'opis.json'), 'utf8'));
  const text = telo(opis, baza);

  if (process.env.DRY_RUN === '1') {
    console.log(text);
    return;
  }

  const repo = process.env.GITHUB_REPOSITORY;
  const nomer = process.env.PR_NUMBER;
  if (repo === undefined || nomer === undefined) {
    throw new Error('Нужны GITHUB_REPOSITORY и PR_NUMBER');
  }
  /* Своих комментариев на pull request немного, ста хватает с запасом. */
  const est = await api(`/repos/${repo}/issues/${nomer}/comments?per_page=100`, 'GET');
  const svoy = est.find((c) => typeof c.body === 'string' && c.body.includes(METKA));
  if (svoy === undefined) {
    await api(`/repos/${repo}/issues/${nomer}/comments`, 'POST', { body: text });
    console.log('Комментарий создан');
  } else {
    await api(`/repos/${repo}/issues/comments/${svoy.id}`, 'PATCH', { body: text });
    console.log(`Комментарий ${svoy.id} обновлён`);
  }
}

await main();
