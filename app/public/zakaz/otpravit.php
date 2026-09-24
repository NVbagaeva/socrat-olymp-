<?php
/*
 * Обработчик заявок услуги «Материалы под ключ».
 * План — docs/SERVICE TEACHERS LANDING.md, раздел 9.
 *
 * Принимает форму со страницы /uchitelyam/, проверяет её по порядку
 * из §9.4 и отправляет заявку письмом в ящик заявок. Файлы уходят
 * вложениями и на хостинге не остаются: временные файлы PHP удаляются
 * сразу после отправки. В журнал пишется строка без персональных данных.
 *
 * Настройки — в ~/zakaz-private/config.php, вне веб-корня и вне
 * репозитория: репозиторий публичный. Образец — app/zakaz-config.example.php.
 */

declare(strict_types=1);

ini_set('display_errors', '0');

const ZAKAZ = true;

require __DIR__ . '/lib/nastroyki.php';
require __DIR__ . '/lib/otvet.php';
require __DIR__ . '/lib/zhurnal.php';
require __DIR__ . '/lib/chastota.php';
require __DIR__ . '/lib/proverka.php';
require __DIR__ . '/lib/pismo.php';

$nachalo = microtime(true);
/* exit не выполняет finally, поэтому уборка — на завершении скрипта.
   PHP и сам удаляет временные файлы в конце запроса; это страховка. */
register_shutdown_function('zakaz_udalit_vremennye');
$zapis = ['itog' => 'ok', 'faylov' => 0, 'bayt' => 0, 'tipy' => [], 'pisem' => 0];

try {
    $nastroyki = zakaz_nastroyki();
    zakaz_zhurnal_nastroit($nastroyki);

    $id = zakaz_nomer();
    $zapis['id'] = $id;

    /* Шаг 1. Метод и объём. Если объём больше post_max_size, PHP
       отдаёт пустые $_POST и $_FILES — поэтому смотрим заголовок. */
    if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
        zakaz_zakonchit($zapis, $nachalo, 'method', 405);
    }
    $obyom = (int) ($_SERVER['CONTENT_LENGTH'] ?? 0);
    if ($obyom > ZAKAZ_MAKS_ZAPROS || ($obyom > 0 && $_POST === [] && $_FILES === [])) {
        zakaz_zakonchit($zapis, $nachalo, 'too_big', 413);
    }

    /* Шаги 2–3. Ловушка и время на форме: боту отвечаем «успех». */
    $bezJs = false;
    $lovushka = zakaz_lovushka($_POST, $bezJs);
    if ($lovushka !== null) {
        $zapis['itog'] = 'trap:' . $lovushka;
        zakaz_zhurnal($zapis, $nachalo);
        zakaz_otvet_uspeh($id);
    }

    /* Шаг 4. Лимит частоты. */
    $klyuch = zakaz_klyuch_adresa($_SERVER['REMOTE_ADDR'] ?? '', $nastroyki['sol']);
    if (!zakaz_chastota_mozhno($nastroyki, $klyuch)) {
        zakaz_zakonchit($zapis, $nachalo, 'rate', 429);
    }

    /* Шаги 5–7. Поля, согласия, файлы. */
    $zayavka = zakaz_proverit_polya($_POST);
    $fayly = zakaz_proverit_fayly($_FILES['fayly'] ?? null);
    if ($fayly === [] && $zayavka['ssylka'] === '') {
        throw new ZakazOshibka('no_source', 400);
    }
    $zapis['faylov'] = count($fayly);
    $zapis['bayt'] = array_sum(array_column($fayly, 'razmer'));
    $zapis['tipy'] = array_values(array_unique(array_column($fayly, 'tip')));
    $zapis['istochnik'] = $zayavka['utm']['utm_source'] ?? '';

    /* Шаги 8–9. Письмо и отправка. */
    $pisma = zakaz_sobrat_pisma($nastroyki, $id, $zayavka, $fayly, $bezJs);
    zakaz_otpravit($nastroyki, $pisma, $id);
    $zapis['pisem'] = count($pisma);

    zakaz_chastota_zapisat($nastroyki, $klyuch);
    zakaz_zhurnal($zapis, $nachalo);
    zakaz_otvet_uspeh($id);
} catch (ZakazOshibka $e) {
    zakaz_zakonchit($zapis, $nachalo, $e->kod, $e->status);
} catch (Throwable $e) {
    error_log('zakaz: ' . get_class($e) . ' в ' . basename($e->getFile()) . ':' . $e->getLine());
    zakaz_zakonchit($zapis, $nachalo, 'send', 500);
}
