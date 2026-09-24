<?php
/* Настройки обработчика и общие постоянные. */

declare(strict_types=1);

/* Модуль подключается только из otpravit.php. */
defined('ZAKAZ') || exit;

/** Те же числа, что LIMITY в app/src/content/uchitelyam.ts. */
const ZAKAZ_MAKS_FAYLOV = 10;
const ZAKAZ_MAKS_BAYT = 25 * 1024 * 1024;
/** Весь запрос: файлы плюс поля и служебная разметка. */
const ZAKAZ_MAKS_ZAPROS = 30 * 1024 * 1024;
const ZAKAZ_MIN_MS_NA_FORME = 3000;

final class ZakazOshibka extends RuntimeException
{
    public function __construct(public readonly string $kod, public readonly int $status = 400)
    {
        parent::__construct($kod);
    }
}

/** Папка вне веб-корня: настройки, счётчики частоты, журнал. */
function zakaz_privatnaya_papka(): string
{
    $iz = getenv('ZAKAZ_PRIVATE');
    if (is_string($iz) && $iz !== '') {
        return rtrim($iz, '/');
    }
    return dirname((string) ($_SERVER['DOCUMENT_ROOT'] ?? __DIR__ . '/../..')) . '/zakaz-private';
}

/**
 * @return array{komu:string, ot:string, ot_imya:string, sol:string,
 *   limit_pisma_bayt:int, otpravka:string, papka:string}
 */
function zakaz_nastroyki(): array
{
    $papka = zakaz_privatnaya_papka();
    $fayl = $papka . '/config.php';
    if (!is_file($fayl)) {
        error_log('zakaz: нет файла настроек');
        throw new ZakazOshibka('send', 500);
    }
    $n = require $fayl;
    if (!is_array($n) || !filter_var($n['komu'] ?? '', FILTER_VALIDATE_EMAIL) || strlen((string) ($n['sol'] ?? '')) < 16) {
        error_log('zakaz: настройки заполнены не полностью');
        throw new ZakazOshibka('send', 500);
    }
    return [
        'komu' => (string) $n['komu'],
        'ot' => (string) ($n['ot'] ?? $n['komu']),
        'ot_imya' => (string) ($n['ot_imya'] ?? 'Материалы под ключ'),
        'sol' => (string) $n['sol'],
        'limit_pisma_bayt' => (int) ($n['limit_pisma_bayt'] ?? 18 * 1024 * 1024),
        'otpravka' => in_array($n['otpravka'] ?? 'mail', ['mail', 'fayl'], true) ? (string) ($n['otpravka'] ?? 'mail') : 'mail',
        'papka' => $papka,
    ];
}

/** Номер заявки: 260926-1940-K7 — дата, время по Москве и два случайных знака. */
function zakaz_nomer(): string
{
    $vremya = new DateTimeImmutable('now', new DateTimeZone('Europe/Moscow'));
    $znaki = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    $hvost = $znaki[random_int(0, strlen($znaki) - 1)] . $znaki[random_int(0, strlen($znaki) - 1)];
    return $vremya->format('dmy-Hi') . '-' . $hvost;
}

/** Временные файлы загрузки удаляются при любом исходе. */
function zakaz_udalit_vremennye(): void
{
    $f = $_FILES['fayly']['tmp_name'] ?? [];
    foreach ((array) $f as $put) {
        if (is_string($put) && $put !== '' && is_file($put)) {
            @unlink($put);
        }
    }
}
