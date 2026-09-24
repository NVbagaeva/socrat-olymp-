<?php
/* Ответ браузеру: JSON для формы со скриптом, переход — без него. */

declare(strict_types=1);

/* Модуль подключается только из otpravit.php. */
defined('ZAKAZ') || exit;

function zakaz_hochet_json(): bool
{
    return str_contains((string) ($_SERVER['HTTP_ACCEPT'] ?? ''), 'application/json');
}

function zakaz_otvet_uspeh(string $id): never
{
    if (zakaz_hochet_json()) {
        http_response_code(200);
        header('Content-Type: application/json; charset=utf-8');
        header('Cache-Control: no-store');
        echo json_encode(['ok' => true, 'id' => $id], JSON_UNESCAPED_UNICODE);
    } else {
        header('Location: /uchitelyam/zayavka-otpravlena/?id=' . rawurlencode($id), true, 303);
    }
    exit;
}

function zakaz_otvet_oshibka(string $kod, int $status): never
{
    if (zakaz_hochet_json()) {
        http_response_code($status);
        header('Content-Type: application/json; charset=utf-8');
        header('Cache-Control: no-store');
        echo json_encode(['ok' => false, 'code' => $kod], JSON_UNESCAPED_UNICODE);
    } else {
        header('Location: /uchitelyam/zayavka-ne-ushla/?code=' . rawurlencode($kod), true, 303);
    }
    exit;
}

/** Записать итог в журнал и ответить ошибкой. */
function zakaz_zakonchit(array $zapis, float $nachalo, string $kod, int $status): never
{
    $zapis['itog'] = $kod;
    zakaz_zhurnal($zapis, $nachalo);
    zakaz_otvet_oshibka($kod, $status);
}
