<?php
/*
 * Лимит частоты. §9.4, шаг 4. С одного адреса — не больше 3 заявок
 * за 10 минут и 10 за сутки; со всех вместе — не больше 30 в час.
 * Адрес хранится только хешем с солью, которая меняется каждые сутки.
 * Считаются отправленные заявки: ошибка в поле не съедает попытку.
 */

declare(strict_types=1);

/* Модуль подключается только из otpravit.php. */
defined('ZAKAZ') || exit;

const ZAKAZ_LIMITY = [
    ['okno' => 600, 'maks' => 3, 'obshiy' => false],
    ['okno' => 86400, 'maks' => 10, 'obshiy' => false],
    ['okno' => 3600, 'maks' => 30, 'obshiy' => true],
];

function zakaz_klyuch_adresa(string $adres, string $sol): string
{
    return hash('sha256', $adres . '|' . $sol . '|' . gmdate('Y-m-d'));
}

function zakaz_chastota_papka(array $nastroyki): string
{
    $papka = $nastroyki['papka'] . '/rate';
    if (!is_dir($papka)) {
        @mkdir($papka, 0700, true);
    }
    return $papka;
}

/** @return list<int> */
function zakaz_chastota_otmetki(string $fayl): array
{
    if (!is_file($fayl)) {
        return [];
    }
    $sutki = time() - 86400;
    $otmetki = array_map('intval', array_filter(explode("\n", (string) file_get_contents($fayl))));
    return array_values(array_filter($otmetki, static fn (int $t) => $t > $sutki));
}

function zakaz_chastota_mozhno(array $nastroyki, string $klyuch): bool
{
    $papka = zakaz_chastota_papka($nastroyki);
    zakaz_chastota_pochistit($papka);
    $svoi = zakaz_chastota_otmetki($papka . '/' . $klyuch);
    $vse = zakaz_chastota_otmetki($papka . '/vse');
    $seychas = time();
    foreach (ZAKAZ_LIMITY as $l) {
        $spisok = $l['obshiy'] ? $vse : $svoi;
        $v_okne = count(array_filter($spisok, static fn (int $t) => $t > $seychas - $l['okno']));
        if ($v_okne >= $l['maks']) {
            return false;
        }
    }
    return true;
}

function zakaz_chastota_zapisat(array $nastroyki, string $klyuch): void
{
    $papka = zakaz_chastota_papka($nastroyki);
    foreach ([$klyuch, 'vse'] as $imya) {
        $fayl = $papka . '/' . $imya;
        $otmetki = zakaz_chastota_otmetki($fayl);
        $otmetki[] = time();
        @file_put_contents($fayl, implode("\n", $otmetki) . "\n", LOCK_EX);
    }
}

/** Записи старше суток удаляются: вчерашний хеш уже ни с чем не совпадёт. */
function zakaz_chastota_pochistit(string $papka): void
{
    foreach (glob($papka . '/*') ?: [] as $fayl) {
        if (is_file($fayl) && filemtime($fayl) < time() - 86400) {
            @unlink($fayl);
        }
    }
}
