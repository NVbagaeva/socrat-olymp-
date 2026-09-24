<?php
/*
 * Проверки заявки: ловушка, поля, согласия, файлы. §9.4, шаги 2–3 и 5–7.
 * Браузер проверяет то же самое заранее, но только для удобства.
 */

declare(strict_types=1);

/* Модуль подключается только из otpravit.php. */
defined('ZAKAZ') || exit;

const ZAKAZ_UROVNI = [
    'nabor' => 'Только набор и вёрстка',
    'otvety' => 'Набор и ответы',
    'resheniya' => 'Набор и полные решения',
];
const ZAKAZ_SROKI = ['bazovyy' => 'обычный', '48' => '48 часов', '24' => '24 часа'];

/** Тип по расширению → какой тип должен оказаться по содержимому. */
const ZAKAZ_RASSHIRENIYA = [
    'pdf' => 'PDF', 'jpg' => 'JPG', 'jpeg' => 'JPG', 'png' => 'PNG',
    'heic' => 'HEIC', 'heif' => 'HEIC', 'docx' => 'DOCX',
];
const ZAKAZ_MIME = [
    'PDF' => 'application/pdf',
    'JPG' => 'image/jpeg',
    'PNG' => 'image/png',
    'HEIC' => 'image/heic',
    'DOCX' => 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

/**
 * Ловушка и время на форме. null — человек; строка — почему бот.
 * Поле t присылает браузер при отправке: сколько миллисекунд форма
 * была открыта. Разница считается в браузере, поэтому сбитые часы
 * на компьютере учителя ни на что не влияют. Без скриптов поля нет —
 * заявка принимается с пометкой.
 */
function zakaz_lovushka(array $post, bool &$bezJs): ?string
{
    if (trim((string) ($post['sayt'] ?? '')) !== '') {
        return 'lovushka';
    }
    $t = (string) ($post['t'] ?? '');
    if ($t === '') {
        $bezJs = true;
        return null;
    }
    if (!ctype_digit($t) || (int) $t < ZAKAZ_MIN_MS_NA_FORME) {
        return 'bystro';
    }
    return null;
}

/** Строка без служебных символов; переводы строки — только если можно. */
function zakaz_tekst(mixed $v, int $maks, bool $mnogostrochnyy = false): string
{
    $s = is_string($v) ? $v : '';
    if (!mb_check_encoding($s, 'UTF-8')) {
        return "\u{FFFD}";
    }
    $s = str_replace("\r\n", "\n", $s);
    $s = preg_replace($mnogostrochnyy ? '/[^\P{C}\n]/u' : '/\p{C}/u', '', $s) ?? '';
    $s = trim($s);
    return mb_strlen($s) > $maks ? "\u{FFFD}" : $s;
}

function zakaz_celoe(mixed $v, int $min, int $maks, string $pole): int
{
    $s = is_string($v) ? trim($v) : '';
    if (!preg_match('/^\d{1,4}$/', $s) || (int) $s < $min || (int) $s > $maks) {
        throw new ZakazOshibka('field:' . $pole);
    }
    return (int) $s;
}

/** @return array<string, mixed> */
function zakaz_proverit_polya(array $post): array
{
    $imya = zakaz_tekst($post['imya'] ?? '', 80);
    if ($imya === '' || $imya === "\u{FFFD}") {
        throw new ZakazOshibka('field:imya');
    }
    $pochta = zakaz_tekst($post['pochta'] ?? '', 120);
    if (!filter_var($pochta, FILTER_VALIDATE_EMAIL)) {
        throw new ZakazOshibka('field:pochta');
    }
    $uroven = (string) ($post['uroven'] ?? '');
    if (!array_key_exists($uroven, ZAKAZ_UROVNI)) {
        throw new ZakazOshibka('field:uroven');
    }
    $srok = (string) ($post['srok'] ?? 'bazovyy');
    if (!array_key_exists($srok, ZAKAZ_SROKI)) {
        throw new ZakazOshibka('field:srok');
    }
    $zadach = zakaz_celoe($post['zadach'] ?? '', 1, 300, 'zadach');
    $variantov = $uroven === 'nabor' ? 1 : zakaz_celoe($post['variantov'] ?? '1', 1, 12, 'variantov');
    $chertezhey = zakaz_celoe($post['chertezhey'] ?? '0', 0, 3600, 'chertezhey');

    $ssylka = zakaz_tekst($post['ssylka'] ?? '', 500);
    if ($ssylka !== '' && (!preg_match('~^https://~i', $ssylka) || !filter_var($ssylka, FILTER_VALIDATE_URL))) {
        throw new ZakazOshibka('field:ssylka');
    }
    $kommentariy = zakaz_tekst($post['kommentariy'] ?? '', 2000, true);
    if ($kommentariy === "\u{FFFD}") {
        throw new ZakazOshibka('field:kommentariy');
    }
    $raschet = zakaz_tekst($post['raschet'] ?? '', 2000, true);
    if ($raschet === "\u{FFFD}") {
        $raschet = '';
    }

    if (($post['soglasie_oferta'] ?? '') !== 'on' || ($post['soglasie_dannye'] ?? '') !== 'on') {
        throw new ZakazOshibka('consent');
    }

    $utm = [];
    foreach (['utm_source', 'utm_medium', 'utm_campaign'] as $k) {
        $v = (string) ($post[$k] ?? '');
        if (preg_match('/^[A-Za-z0-9_-]{1,100}$/', $v)) {
            $utm[$k] = $v;
        }
    }

    return [
        'imya' => $imya,
        'pochta' => $pochta,
        'uroven' => $uroven,
        'srok' => $srok,
        'zadach' => $zadach,
        'variantov' => $variantov,
        'chertezhey' => $chertezhey,
        'rukopis' => ($post['rukopis'] ?? '0') === '1',
        'ssylka' => $ssylka,
        'kommentariy' => $kommentariy,
        'raschet' => $raschet,
        'bank_otkaz' => ($post['bank_otkaz'] ?? '') === 'on',
        'utm' => $utm,
    ];
}

/** Тип по первым байтам файла, а не по расширению. */
function zakaz_tip_po_soderzhimomu(string $put): ?string
{
    $f = @fopen($put, 'rb');
    if ($f === false) {
        return null;
    }
    $nachalo = (string) fread($f, 16);
    fclose($f);

    if (str_starts_with($nachalo, '%PDF-')) {
        return 'PDF';
    }
    if (str_starts_with($nachalo, "\xFF\xD8\xFF")) {
        return 'JPG';
    }
    if (str_starts_with($nachalo, "\x89PNG\r\n\x1A\n")) {
        return 'PNG';
    }
    if (substr($nachalo, 4, 4) === 'ftyp'
        && in_array(substr($nachalo, 8, 4), ['heic', 'heix', 'heim', 'heis', 'hevc', 'hevx', 'mif1', 'msf1', 'heif'], true)) {
        return 'HEIC';
    }
    if (str_starts_with($nachalo, "PK\x03\x04") && zakaz_eto_docx($put)) {
        return 'DOCX';
    }
    return null;
}

/** DOCX — это архив, внутри которого есть документ Word. */
function zakaz_eto_docx(string $put): bool
{
    if (class_exists('ZipArchive')) {
        $zip = new ZipArchive();
        if ($zip->open($put) !== true) {
            return false;
        }
        $est = $zip->locateName('word/document.xml') !== false && $zip->locateName('[Content_Types].xml') !== false;
        $zip->close();
        return $est;
    }
    /* Без расширения zip: имена файлов архива лежат в нём открытым текстом. */
    $soderzhimoe = (string) file_get_contents($put);
    return str_contains($soderzhimoe, 'word/document.xml') && str_contains($soderzhimoe, '[Content_Types].xml');
}

/** Имя файла для письма: без служебных символов и путей, не длиннее 120 знаков. */
function zakaz_imya_fayla(string $imya, int $nomer, string $tip): string
{
    $imya = preg_replace('/[\p{C}\/\\\\:*?"<>|]/u', '', $imya) ?? '';
    $imya = trim($imya, " .");
    if ($imya === '' || !mb_check_encoding($imya, 'UTF-8')) {
        $imya = 'ishodnik-' . $nomer . '.' . strtolower($tip === 'JPG' ? 'jpg' : $tip);
    }
    return mb_strlen($imya) > 120 ? mb_substr($imya, -120) : $imya;
}

/**
 * @return list<array{put:string, imya:string, tip:string, mime:string, razmer:int}>
 */
function zakaz_proverit_fayly(mixed $fayly): array
{
    if (!is_array($fayly) || !isset($fayly['name']) || !is_array($fayly['name'])) {
        return [];
    }
    $spisok = [];
    $vsego = 0;
    foreach ($fayly['name'] as $i => $imya) {
        $oshibka = (int) ($fayly['error'][$i] ?? UPLOAD_ERR_NO_FILE);
        if ($oshibka === UPLOAD_ERR_NO_FILE) {
            continue;
        }
        if ($oshibka === UPLOAD_ERR_INI_SIZE || $oshibka === UPLOAD_ERR_FORM_SIZE) {
            throw new ZakazOshibka('too_big', 413);
        }
        $put = (string) ($fayly['tmp_name'][$i] ?? '');
        if ($oshibka !== UPLOAD_ERR_OK || !is_uploaded_file($put)) {
            throw new ZakazOshibka('send', 500);
        }
        $razmer = (int) filesize($put);
        if ($razmer === 0) {
            throw new ZakazOshibka('type');
        }
        $rasshirenie = strtolower(pathinfo((string) $imya, PATHINFO_EXTENSION));
        $ozhidaem = ZAKAZ_RASSHIRENIYA[$rasshirenie] ?? null;
        $tip = zakaz_tip_po_soderzhimomu($put);
        if ($ozhidaem === null || $tip !== $ozhidaem) {
            throw new ZakazOshibka('type');
        }
        $vsego += $razmer;
        $spisok[] = [
            'put' => $put,
            'imya' => zakaz_imya_fayla((string) $imya, count($spisok) + 1, $tip),
            'tip' => $tip,
            'mime' => ZAKAZ_MIME[$tip],
            'razmer' => $razmer,
        ];
    }
    if (count($spisok) > ZAKAZ_MAKS_FAYLOV) {
        throw new ZakazOshibka('too_many', 413);
    }
    if ($vsego > ZAKAZ_MAKS_BAYT) {
        throw new ZakazOshibka('too_big', 413);
    }
    return $spisok;
}
