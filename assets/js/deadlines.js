/* Работа со сроками сдачи. Считаем от локальной полуночи, чтобы «сегодня»
   не сдвигалось из-за времени суток и часового пояса. */

(function () {
  'use strict';

  var MONTHS = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
                'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];

  function midnight(date) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  }

  /* '2026-09-07' -> Date в местном времени (без сдвига на UTC). */
  function parseDate(value) {
    var parts = String(value || '').split('-');
    if (parts.length !== 3) return null;
    var date = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    return isNaN(date.getTime()) ? null : date;
  }

  function daysLeft(deadline) {
    var date = parseDate(deadline);
    if (!date) return null;
    return Math.round((midnight(date) - midnight(new Date())) / 86400000);
  }

  function formatDate(value) {
    var date = parseDate(value);
    if (!date) return '';
    return date.getDate() + ' ' + MONTHS[date.getMonth()];
  }

  function plural(n, forms) {
    var mod10 = n % 10;
    var mod100 = n % 100;
    if (mod10 === 1 && mod100 !== 11) return forms[0];
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return forms[1];
    return forms[2];
  }

  /* Статус задания: сначала отметка ученика, потом срок. */
  function status(deadline, done) {
    if (done) return { key: 'done', label: 'Сдано', modifier: 'due--done' };

    var left = daysLeft(deadline);
    if (left === null) return { key: 'none', label: 'Без срока', modifier: '' };

    if (left < 0) {
      var late = Math.abs(left);
      return {
        key: 'late',
        label: 'Просрочено на ' + late + ' ' + plural(late, ['день', 'дня', 'дней']),
        modifier: 'due--late'
      };
    }
    if (left === 0) return { key: 'today', label: 'Срок сегодня', modifier: 'due--today' };
    if (left === 1) return { key: 'soon', label: 'Завтра', modifier: 'due--soon' };
    if (left <= 3) return { key: 'soon', label: 'Осталось ' + left + ' дня', modifier: 'due--soon' };

    return {
      key: 'later',
      label: 'До ' + formatDate(deadline),
      modifier: ''
    };
  }

  window.Deadlines = {
    parseDate: parseDate,
    daysLeft: daysLeft,
    formatDate: formatDate,
    plural: plural,
    status: status
  };
})();
