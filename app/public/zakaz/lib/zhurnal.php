<?php
/*
 * Журнал: строка на запрос, файл на месяц. §9.5.
 * Пишется: время, номер, итог, число и размер файлов, их типы, число
 * писем, метка источника, время обработки. Не пишется никогда: имя,
 * почта, адрес отправителя, имена файлов, комментарий, ссылка.
 */

declare(strict_types=1);

/* Модуль подключается только из otpravit.php. */
defined('ZAKAZ') || exit;

$GLOBALS['zakaz_zhurnal_papka'] = null;

function zakaz_zhurnal_nastroit(array $nastroyki): void
{
    $papka = $nastroyki['papka'] . '/log';
    if (!is_dir($papka)) {
        @mkdir($papka, 0700, true);
    }
    $GLOBALS['zakaz_zhurnal_papka'] = $papka;
    ini_set('log_errors', '1');
    ini_set('error_log', $papka . '/php-errors.log');
}

function zakaz_zhurnal(array $zapis, float $nachalo): void
{
    $papka = $GLOBALS['zakaz_zhurnal_papka'] ?? null;
    if (!is_string($papka) || !is_dir($papka)) {
        return;
    }
    $stroka = [
        'vremya' => gmdate('c'),
        'id' => $zapis['id'] ?? '',
        'itog' => $zapis['itog'] ?? '',
        'faylov' => $zapis['faylov'] ?? 0,
        'bayt' => $zapis['bayt'] ?? 0,
        'tipy' => $zapis['tipy'] ?? [],
        'pisem' => $zapis['pisem'] ?? 0,
        'istochnik' => $zapis['istochnik'] ?? '',
        'ms' => (int) round((microtime(true) - $nachalo) * 1000),
    ];
    $mesyac = gmdate('Y-m');
    @file_put_contents(
        $papka . '/' . $mesyac . '.log',
        json_encode($stroka, JSON_UNESCAPED_UNICODE) . "\n",
        FILE_APPEND | LOCK_EX,
    );
    zakaz_zhurnal_pochistit($papka, $mesyac);
}

/** Журналы старше трёх месяцев удаляются. */
function zakaz_zhurnal_pochistit(string $papka, string $mesyac): void
{
    $granica = (new DateTimeImmutable($mesyac . '-01', new DateTimeZone('UTC')))->modify('-3 months')->format('Y-m');
    foreach (glob($papka . '/????-??.log') ?: [] as $fayl) {
        if (basename($fayl, '.log') < $granica) {
            @unlink($fayl);
        }
    }
}
