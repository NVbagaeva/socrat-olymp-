<?php
/*
 * Письмо заявки: текст по образцу §5.2 и файлы вложениями. §9.4, шаги 8–9.
 * Если вложения больше лимита одного письма, уходит несколько писем
 * с одинаковым текстом и пометкой «письмо 1 из N».
 * Письмо уходит только в ящик заявок — никогда на адрес из формы.
 */

declare(strict_types=1);

/* Модуль подключается только из otpravit.php. */
defined('ZAKAZ') || exit;

function zakaz_zagolovok(string $tekst): string
{
    return '=?UTF-8?B?' . base64_encode($tekst) . '?=';
}

function zakaz_mb(int $bayt): string
{
    if ($bayt < 100 * 1024) {
        return max(1, (int) round($bayt / 1024)) . ' КБ';
    }
    return str_replace('.', ',', (string) round($bayt / 1024 / 1024, 1)) . ' МБ';
}

function zakaz_tekst_pisma(string $id, array $z, array $fayly, bool $bezJs): string
{
    $vremya = (new DateTimeImmutable('now', new DateTimeZone('Europe/Moscow')))->format('d.m.Y H:i');
    $paket = ZAKAZ_UROVNI[$z['uroven']] . ($z['variantov'] > 1 ? ', вариантов: ' . $z['variantov'] : '');
    $otmetki = [];
    if ($z['rukopis']) {
        $otmetki[] = 'рукописный исходник';
    }
    if ($z['chertezhey'] > 0) {
        $otmetki[] = 'сложных чертежей: ' . $z['chertezhey'];
    }
    $istochnik = [];
    foreach ($z['utm'] as $k => $v) {
        $istochnik[] = $k . '=' . $v;
    }
    $vlozheniya = $fayly === []
        ? 'нет'
        : count($fayly) . ' шт., ' . zakaz_mb((int) array_sum(array_column($fayly, 'razmer')))
            . ' (' . implode(', ', array_column($fayly, 'tip')) . ')';

    $stroki = [
        'Заявка ' . $id . ' · ' . $vremya . ' МСК',
        '',
        'Имя: ' . $z['imya'],
        'Почта: ' . $z['pochta'],
        'Пакет: ' . $paket,
        'Задач: ' . $z['zadach'] . ' (по словам заказчика, уточнить по файлу)',
        'Срок: ' . ZAKAZ_SROKI[$z['srok']],
        'Отмечено в калькуляторе: ' . ($otmetki === [] ? '—' : implode('; ', $otmetki)),
        'Ссылка на исходник: ' . ($z['ssylka'] === '' ? '—' : $z['ssylka']),
        'Комментарий: ' . ($z['kommentariy'] === '' ? '—' : "\n" . $z['kommentariy']),
        '',
        'Расчёт калькулятора на странице:' . ($z['raschet'] === '' ? ' не считали' : "\n" . $z['raschet']),
        '',
        'Согласия: оферта ✓ · обработка данных ✓ · задачи в банк платформы: '
            . ($z['bank_otkaz'] ? 'ОТКАЗ' : 'не возражает'),
        'Источник: ' . ($istochnik === [] ? '—' : implode(' · ', $istochnik)),
        'Вложения: ' . $vlozheniya,
    ];
    if ($bezJs) {
        $stroki[] = 'Отправлено без JavaScript: проверка на бота была неполной.';
    }
    $stroki[] = '';
    $stroki[] = 'Ответ на это письмо уйдёт заказчику.';
    return implode("\r\n", $stroki);
}

/** Раскладывает файлы по письмам так, чтобы вложения каждого не превышали лимит. */
function zakaz_razlozhit(array $fayly, int $limit): array
{
    $gruppy = [[]];
    $ves = 0;
    foreach ($fayly as $f) {
        $tek = count($gruppy) - 1;
        if ($gruppy[$tek] !== [] && $ves + $f['razmer'] > $limit) {
            $gruppy[] = [];
            $tek++;
            $ves = 0;
        }
        $gruppy[$tek][] = $f;
        $ves += $f['razmer'];
    }
    return $gruppy;
}

/**
 * @return list<array{tema:string, zagolovki:string, telo:string}>
 */
function zakaz_sobrat_pisma(array $n, string $id, array $z, array $fayly, bool $bezJs): array
{
    $tekst = zakaz_tekst_pisma($id, $z, $fayly, $bezJs);
    $tema = 'Заявка ' . $id . ' · ' . ZAKAZ_UROVNI[$z['uroven']]
        . ($z['variantov'] > 1 ? ' · ' . $z['variantov'] . ' вар.' : '')
        . ' · ' . $z['zadach'] . ' задач · срок ' . ZAKAZ_SROKI[$z['srok']];
    $gruppy = zakaz_razlozhit($fayly, $n['limit_pisma_bayt']);
    $vsego = count($gruppy);
    $domen = substr(strrchr($n['ot'], '@') ?: '@budetege.ru', 1);

    $pisma = [];
    foreach ($gruppy as $i => $gruppa) {
        $granica = 'zakaz-' . bin2hex(random_bytes(12));
        $metka = $vsego > 1 ? ' (письмо ' . ($i + 1) . ' из ' . $vsego . ')' : '';
        $zagolovki = implode("\r\n", [
            'From: ' . zakaz_zagolovok($n['ot_imya']) . ' <' . $n['ot'] . '>',
            /* Почта заказчика уже проверена фильтром: переводов строки в ней нет. */
            'Reply-To: ' . $z['pochta'],
            'MIME-Version: 1.0',
            'Message-ID: <' . $id . '.' . ($i + 1) . '.' . bin2hex(random_bytes(4)) . '@' . $domen . '>',
            'Content-Type: multipart/mixed; boundary="' . $granica . '"',
        ]);
        $chasti = [];
        $chasti[] = "Content-Type: text/plain; charset=UTF-8\r\nContent-Transfer-Encoding: base64\r\n\r\n"
            . chunk_split(base64_encode($tekst . ($metka !== '' ? "\r\n\r\nЭто" . $metka . '.' : '')));
        foreach ($gruppa as $f) {
            $imya = $f['imya'];
            $zapasnoe = preg_replace('/[^A-Za-z0-9._-]/', '_', $imya) ?: 'fayl';
            $chasti[] = 'Content-Type: ' . $f['mime'] . '; name="' . $zapasnoe . '"' . "\r\n"
                . 'Content-Disposition: attachment; filename="' . $zapasnoe . '"; filename*=UTF-8\'\'' . rawurlencode($imya) . "\r\n"
                . "Content-Transfer-Encoding: base64\r\n\r\n"
                . chunk_split(base64_encode((string) file_get_contents($f['put'])));
        }
        $telo = '';
        foreach ($chasti as $chast) {
            $telo .= '--' . $granica . "\r\n" . $chast . "\r\n";
        }
        $telo .= '--' . $granica . "--\r\n";
        $pisma[] = ['tema' => zakaz_zagolovok($tema . $metka), 'zagolovki' => $zagolovki, 'telo' => $telo];
    }
    return $pisma;
}

/** Отправка: mail() хостинга; для проверки на своём компьютере — запись в файлы. */
function zakaz_otpravit(array $n, array $pisma, string $id): void
{
    foreach ($pisma as $i => $p) {
        if ($n['otpravka'] === 'fayl') {
            $papka = $n['papka'] . '/test-pisma';
            if (!is_dir($papka)) {
                @mkdir($papka, 0700, true);
            }
            $ok = file_put_contents(
                $papka . '/' . $id . '-' . ($i + 1) . '.eml',
                'To: ' . $n['komu'] . "\r\nSubject: " . $p['tema'] . "\r\n" . $p['zagolovki'] . "\r\n\r\n" . $p['telo'],
            ) !== false;
        } else {
            $ok = mail($n['komu'], $p['tema'], $p['telo'], $p['zagolovki'], '-f' . $n['ot']);
        }
        if (!$ok) {
            throw new ZakazOshibka('send', 502);
        }
    }
}
