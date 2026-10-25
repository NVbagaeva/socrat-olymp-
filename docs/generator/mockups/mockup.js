/* Поведение макетов. Без движка: лист собирается из пула MK.pool,
   seed — просто сдвиг по пулу. Всё ради того, чтобы макет кликался. */
(function () {
  'use strict';
  const MK = window.MK;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const MOCK = document.body.dataset.mockup; // 'a' | 'b'

  /* ── Иконки ─────────────────────────────────────────────────────── */
  const P = {
    percent: '<path d="M19 5 5 19"/><circle cx="7" cy="7" r="2.5"/><circle cx="17" cy="17" r="2.5"/>',
    flask: '<path d="M9 3h6M10 3v6l-5 9a2 2 0 0 0 2 3h10a2 2 0 0 0 2-3l-5-9V3"/><path d="M7.5 14h9"/>',
    car: '<path d="M5 16V11l2-5h10l2 5v5"/><path d="M3 16h18"/><circle cx="7.5" cy="17.5" r="1.8"/><circle cx="16.5" cy="17.5" r="1.8"/>',
    train: '<rect x="6" y="3" width="12" height="14" rx="3"/><path d="M6 11h12M9 21l1.5-4M15 21l-1.5-4"/><circle cx="9.5" cy="14" r=".8"/><circle cx="14.5" cy="14" r=".8"/>',
    boat: '<path d="M3 17h18l-2 3H5z"/><path d="M6 17V12h12v5M9 12V8h6v4M12 5v3"/>',
    cycle: '<path d="M20 12a8 8 0 1 1-2.3-5.6"/><path d="M20 4v4h-4"/>',
    gear: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1 7 17M17 7l2.1-2.1"/>',
    stairs: '<path d="M4 20h4v-4h4v-4h4V8h4"/>',
    bolt: '<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>',
    swap: '<path d="M4 8h13l-3-3M20 16H7l3 3"/>',
    star: '<path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>',
    x: '<path d="M6 6l12 12M18 6 6 18"/>',
    up: '<path d="M12 19V5M6 11l6-6 6 6"/>',
    down: '<path d="M12 5v14M6 13l6 6 6-6"/>',
    dots: '<circle cx="5" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="19" cy="12" r="1.6"/>',
    grip: '<circle cx="5" cy="5" r="1.5"/><circle cx="11" cy="5" r="1.5"/><circle cx="5" cy="11" r="1.5"/><circle cx="11" cy="11" r="1.5"/><circle cx="5" cy="17" r="1.5"/><circle cx="11" cy="17" r="1.5"/>',
    filter: '<path d="M4 6h16M7 12h10M10 18h4"/>',
    pdf: '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M9 13h6M9 17h6"/>',
    files: '<path d="M8 7V5a2 2 0 0 1 2-2h7l3 3v11a2 2 0 0 1-2 2h-2"/><rect x="4" y="7" width="12" height="14" rx="2"/>',
    link: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
    refresh: '<path d="M20 11a8 8 0 1 0-2.3 5.7"/><path d="M20 4v7h-7"/>',
    play: '<path d="M8 5v14l11-7z" fill="currentColor" stroke="none"/>',
  };
  const ico = (n, sw = 1.8) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${P[n]}</svg>`;
  const logo = '<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round"><path d="M5 18h14M7 15l9-9"/></svg>';

  /* ── Формулы: KaTeX в MathML, без внешних шрифтов ───────────────── */
  function tex(s) {
    return s.replace(/\$([^$]+)\$/g, (_, t) => {
      try { return window.katex ? window.katex.renderToString(t, { output: 'mathml', throwOnError: false }) : t; }
      catch (e) { return t; }
    });
  }
  const esc = (s) => s.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
  const plural = (n, a, b, c) => { const m10 = n % 10, m100 = n % 100; return m10 === 1 && m100 !== 11 ? a : m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14) ? b : c; };
  const topic = (id) => MK.topics.find((t) => t.id === id);

  /* ── Состояние ──────────────────────────────────────────────────── */
  const S = {
    preset: 'ege', src: 'mix', lv: [1, 2, 3], variants: 4, sostav: {},
    extras: { theory: false, examples: 0, qr: false, kind: 'Тренировочный вариант', date: '2026-10-24', teacher: 'Багаева Н.В.' },
    generated: false, variant: 0, view: 'student', seed: 0, zam: {}, order: null, pick: false, open: {}, step: 1, moreOpen: false,
  };
  function applyPreset(id) {
    const p = MK.presets.find((x) => x.id === id);
    S.preset = id; S.variants = p.variants; S.lv = p.lv.slice(); S.sostav = Object.assign({}, p.sostav);
    S.extras.kind = p.kind; S.pick = !!p.pickTopic; S.zam = {}; S.order = null; S.variant = 0;
  }
  applyPreset('ege');
  const touched = () => { S.preset = null; };
  const total = () => Object.values(S.sostav).reduce((a, b) => a + b, 0);
  const isPhone = () => $('#device').clientWidth <= 760;

  function lvText(lv) {
    const s = lv.slice().sort();
    if (s.length === 3) return '★–★★★';
    if (s.length === 1) return '★'.repeat(s[0]);
    if (s[1] - s[0] === 1) return '★'.repeat(s[0]) + '–' + '★'.repeat(s[1]);
    return '★ и ★★★';
  }
  function summaryShort() {
    const n = total(), v = S.variants;
    return `<b>${n} ${plural(n, 'задача', 'задачи', 'задач')}</b> · ${v} ${plural(v, 'вариант', 'варианта', 'вариантов')}`;
  }
  function summaryPlain() { return summary().replace(/<[^>]+>/g, ''); }
  function summary() {
    const n = total(), v = S.variants;
    const src = MK.sources.find((x) => x.id === S.src).short;
    return `<b>${n} ${plural(n, 'задача', 'задачи', 'задач')}</b> · ${v} ${plural(v, 'вариант', 'варианта', 'вариантов')} · ${lvText(S.lv)} · ${src}`;
  }

  /* ── Сборка листа из пула ───────────────────────────────────────── */
  function pickFrom(tid, slot, variant) {
    const all = MK.pool[tid];
    let pool = all.filter((t) => S.lv.includes(t.lv));
    let lvFallback = false;
    if (pool.length === 0) { pool = all; lvFallback = true; }
    if (S.src !== 'mix') { const f = pool.filter((t) => t.src === S.src); if (f.length) pool = f; }
    const k = (slot + variant + S.seed + (S.zam[`${tid}-${slot}`] || 0)) % pool.length;
    return Object.assign({ tid, key: `${tid}-${slot}`, lvFallback }, pool[k]);
  }
  function buildList(variant) {
    const out = [];
    for (const t of MK.topics) {
      const n = S.sostav[t.id] || 0;
      for (let i = 0; i < n; i++) out.push(pickFrom(t.id, i, variant));
    }
    if (S.order) {
      const pos = new Map(S.order.map((k, i) => [k, i]));
      out.sort((a, b) => (pos.has(a.key) ? pos.get(a.key) : 999) - (pos.has(b.key) ? pos.get(b.key) : 999));
    }
    return out;
  }
  function demoList() { return MK.demo.map((d) => Object.assign({ tid: d.topic, key: 'demo' + d.i }, MK.pool[d.topic][d.i])); }

  function qr() {
    let cells = '';
    const bits = '1111111010110111111110000010100101000001101110101100101011101101110100111010111011011101011001010111011000001010010100000111111101010101111111'.split('');
    bits.forEach((b, i) => { if (b === '1') cells += `<rect x="${i % 12}" y="${Math.floor(i / 12)}" width="1" height="1"/>`; });
    return `<svg class="sh-qr" viewBox="0 0 12 12" fill="#0f172a" aria-label="QR-код на ссылку набора">${cells}</svg>`;
  }
  function dateRu(iso) { if (!iso) return ''; const [y, m, d] = iso.split('-'); return `${d}.${m}.${y}`; }

  function sheetHtml(opts) {
    const demo = opts.demo;
    const list = demo ? demoList() : buildList(S.variant);
    const teacher = !demo && S.view === 'teacher';
    const vn = demo ? '' : (S.variants > 1 ? ` · Вариант ${S.variant + 1}` : '');
    const kind = demo ? 'Пример листа' : esc(S.extras.kind);
    let html = `<div class="sheet${demo ? ' is-demo' : ' is-live'}">
      <div class="sh-head"><div class="sh-logo">${logo}</div><div class="sh-brand">Будет на<br>ЕГЭ</div><div class="sh-div"></div>
        <div class="sh-course"><b>Профильная математика</b><br>Учитель: ${esc(S.extras.teacher || '')}</div>
        <div class="sh-tag">БОЛЬШЕ, ЧЕМ ПОДГОТОВКА<i></i><span style="display:block;margin-top:6px;letter-spacing:0;color:#667389;font-weight:500">${dateRu(S.extras.date)}</span></div>
        ${!demo && S.extras.qr ? qr() : ''}</div>
      <div class="sh-title"><span class="sh-chip">${MK.section.chip}</span><h3>${MK.section.title}</h3></div>
      <div class="sh-sub">${kind}${vn}${teacher ? ' · ответы и решения' : ''}</div>
      <div class="sh-fields"><b>Фамилия, имя</b><span></span><b>Дата</b><span class="d"></span></div>`;
    if (list.length === 0) {
      html += `<div class="sh-empty">В составе нет задач. Добавьте тему или выберите пресет.</div></div>`;
      return html;
    }
    let lastTopic = null, ord = 0;
    const bankNos = [];
    html += '<ol class="sh-list">';
    list.forEach((t, i) => {
      if (!demo && t.tid !== lastTopic && (S.extras.theory || S.extras.examples)) {
        html += '</ol>';
        if (S.extras.theory) html += `<div class="sh-theory"><b>${topic(t.tid).title}.</b> ${tex(MK.theory[t.tid])}</div>`;
        for (let e = 0; e < S.extras.examples; e++) {
          const ex = MK.pool[t.tid][(e + 1) % MK.pool[t.tid].length];
          html += `<div class="sh-ex"><b>Разобранный пример.</b> ${esc(ex.q)}<br><b>Решение.</b> ${tex(ex.s)} Ответ: ${ex.a}.</div>`;
        }
        html += `<ol class="sh-list" start="${ord + 1}">`;
      }
      lastTopic = t.tid; ord++;
      if (t.src === 'bank') bankNos.push(ord);
      html += `<li class="task" data-key="${t.key}" data-i="${i}" ${demo ? '' : 'draggable="true" tabindex="0"'}>
        ${demo ? '' : `<span class="task__grip" title="Перетащить">${ico('grip')}</span>`}
        <span class="task__no">${ord}</span>
        <div class="task__q">${tex(esc(t.q))}
          ${teacher ? `<div class="task__sol"><b>Ответ: ${t.a}.</b> ${tex(t.s)}</div>` : '<div class="task__ans">Ответ: <span></span></div>'}
        </div>
        ${demo ? '' : `<div class="task__tools" role="toolbar" aria-label="Действия с задачей ${ord}">
          <button data-act="swap" title="Заменить на похожую" aria-label="Заменить на похожую">${ico('swap')}</button><button data-act="lvl" title="Другой уровень" aria-label="Другой уровень">${ico('star')}</button><button data-act="del" title="Убрать из листа" aria-label="Убрать из листа">${ico('x')}</button></div>
          <button class="task__more" data-act="menu" aria-label="Действия с задачей ${ord}">${ico('dots')}</button>`}
      </li>`;
    });
    html += '</ol>';
    if (teacher) {
      const others = list.length - bankNos.length;
      const line = bankNos.length === 0 ? 'Все задачи — авторские, того же типа, что в открытом банке ФИПИ.'
        : others === 0 ? 'Все задачи — из открытого банка ФИПИ.'
        : `${bankNos.length === 1 ? 'Задача' : 'Задачи'} ${bankNos.join(', ')} — открытый банк ФИПИ, остальные — авторские.`;
      html += `<div class="sh-src">${line}</div>`;
    }
    html += `<div class="sh-foot"><span>Будет на ЕГЭ · Профильная математика</span><span>1 / ${Math.max(1, Math.ceil(list.length / 7))}</span></div></div>`;
    return html;
  }

  /* ── Предпросмотр ───────────────────────────────────────────────── */
  function renderPreview() {
    const pv = $('#pv');
    if (!pv) return;
    const demo = !S.generated;
    let bar;
    if (demo) {
      bar = `<div class="pv__demo"><span class="badge-demo">Пример</span><span>Так выглядит лист. Нажмите <b>«Сгенерировать»</b>, и здесь будет ваш набор.</span></div>`;
    } else {
      const tabs = S.variants > 1 ? `<div class="vtabs" role="group" aria-label="Вариант"><span>Вариант</span>${Array.from({ length: S.variants }, (_, i) => `<button aria-pressed="${S.variant === i}" data-var="${i}">${i + 1}</button>`).join('')}</div>` : '';
      bar = `${tabs}<div class="segm" role="group" aria-label="Чей лист"><button data-view="student" aria-pressed="${S.view === 'student'}">Ученик</button><button data-view="teacher" aria-pressed="${S.view === 'teacher'}">Учитель</button></div>
        <span class="sp"></span>
        <button class="btn btn--sm" data-pv="pdf">${ico('pdf')}Скачать PDF</button>
        <span class="act-desk"><button class="btn btn--sm" data-pv="all">${ico('files')}Всё одним файлом</button><button class="btn btn--sm btn--ghost" data-pv="link">${ico('link')}Ссылка на набор</button><button class="btn btn--sm btn--ghost" data-pv="kits">Мои комплекты</button></span>
        <button class="btn btn--sm btn--ghost act-phone" data-pv="more" aria-label="Ещё действия">${ico('dots')}</button>`;
    }
    pv.innerHTML = `<div class="pv__bar">${bar}</div><div class="pv__scroll">${sheetHtml({ demo })}</div>`;
    bindTasks(pv);
  }

  /* ── Состав ─────────────────────────────────────────────────────── */
  function rowHtml(t) {
    const n = S.sostav[t.id] || 0;
    const max = MK.limits.maxPerTopic;
    const meta = t.id === 'RZ' ? 'не входит в ЕГЭ' : `в банке ${t.bank}`;
    const ctrl = n === 0
      ? `<button class="add" data-add="${t.id}">+ Добавить</button>`
      : `<span class="step"><button data-dec="${t.id}" aria-label="${t.title}: меньше">−</button><output>${n}</output><button data-inc="${t.id}" ${n >= max ? 'disabled' : ''} aria-label="${t.title}: больше">+</button></span>`;
    const open = !!S.open[t.id];
    let html = `<div class="trow${n === 0 ? ' is-off' : ''}${open ? ' is-open' : ''}${S.pick && n > 0 ? ' is-pick' : ''}">
      <span class="ticon" style="background:${t.color}1a;color:${t.color}">${ico(t.icon)}</span>
      <button class="tname" data-open="${t.id}" aria-expanded="${open}"><b>${t.title}</b><small>${meta} · подтипы<span class="chev"></span></small></button>
      ${ctrl}</div>`;
    if (open) html += `<div class="subs">${MK.subtypes[t.id].map((s) => `<div><span>${s}</span><em>${n > 0 ? 'авто' : '—'}</em></div>`).join('')}</div>`;
    return html;
  }
  function sostavHtml(grid) {
    const n = total();
    return `<div class="sostav__h"><h2>Состав${S.variants > 1 ? ' варианта' : ''}</h2><span class="sostav__cnt">${n} ${plural(n, 'задача', 'задачи', 'задач')}</span></div>
      ${S.pick ? '<p class="limit" style="color:#1a4fb0;margin:0 8px 8px">Один тип: нажмите «+ Добавить» у нужной темы, остальные уберутся.</p>' : ''}
      ${grid ? `<div class="tgrid">${MK.topics.map(rowHtml).join('')}</div>` : MK.topics.map(rowHtml).join('')}
      <p class="limit">Не больше ${MK.limits.maxPerTopic} задач одного типа. Число по подтипам — в строке темы.</p>`;
  }
  function presetsHtml() {
    return `<div class="presets__h"><span class="lbl">Быстрый старт</span>${S.preset ? '' : '<span class="presets__own">своя настройка</span>'}</div>
      <div class="presets" role="group" aria-label="Пресеты">${MK.presets.map((p) => `<button class="preset" data-preset="${p.id}" aria-pressed="${S.preset === p.id}"><b>${p.title}</b><span>${p.sub}</span></button>`).join('')}</div>`;
  }
  function moreHtml() {
    const e = S.extras;
    return `<h3>Дополнительно</h3>
      <div class="opt"><div>Рамка с теорией<small>перед каждым типом задач</small></div><button class="switch" role="switch" aria-checked="${e.theory}" data-x="theory" aria-label="Рамка с теорией"></button></div>
      <div class="opt"><div>Разобранные примеры<small>на каждый тип</small></div><div class="segm" role="group" aria-label="Разобранных примеров">${[0, 1, 2].map((k) => `<button data-ex="${k}" aria-pressed="${e.examples === k}">${k}</button>`).join('')}</div></div>
      <div class="opt"><div>QR-код на ссылку<small>ученик откроет тот же набор</small></div><button class="switch" role="switch" aria-checked="${e.qr}" data-x="qr" aria-label="QR-код"></button></div>
      <div class="opt"><div>Вид работы<small>подпись в шапке листа</small></div><select id="kind-${MOCK}" data-kind>${MK.workKinds.map((k) => `<option ${k === e.kind ? 'selected' : ''}>${k}</option>`).join('')}</select></div>
      <div class="opt"><div>Дата</div><input type="date" id="date-${MOCK}" value="${e.date}" data-date></div>
      <div class="opt"><div>Учитель</div><input type="text" id="teacher-${MOCK}" value="${esc(e.teacher)}" data-teacher></div>`;
  }

  /* ── Полоса фильтров (А) ────────────────────────────────────────── */
  function stripHtml() {
    const src = MK.sources.find((x) => x.id === S.src);
    return `<div class="strip__filters">
        <div class="fld"><span class="lbl">Источник</span><button class="dd" data-pop="src">${src.title}</button></div>
        <div class="fld"><span class="lbl">Сложность</span><div class="stars" role="group" aria-label="Сложность">${[1, 2, 3].map((l) => `<button data-lv="${l}" aria-pressed="${S.lv.includes(l)}" title="${MK.levelWords[l]}">${'★'.repeat(l)}</button>`).join('')}</div></div>
        <div class="fld"><span class="lbl">Вариантов</span><span class="step"><button data-vdec aria-label="Вариантов меньше" ${S.variants <= 1 ? 'disabled' : ''}>−</button><output>${S.variants}</output><button data-vinc aria-label="Вариантов больше" ${S.variants >= 8 ? 'disabled' : ''}>+</button></span></div>
        <button class="btn btn--ghost" data-more aria-expanded="${S.moreOpen}">${ico('filter')}Дополнительно</button>
      </div>
      <div class="strip__go"><span class="sum" title="${summaryPlain()}">${summaryShort()}<small>${lvText(S.lv)} · ${MK.sources.find((x) => x.id === S.src).short}</small></span><button class="btn btn--primary go" data-go>${S.generated ? ico('refresh') + 'Перегенерировать всё' : ico('play') + 'Сгенерировать'}</button></div>
      <div class="strip__chips">
        <button class="is-filters" data-sheet="filters">${ico('filter')}Фильтры</button>
        <button data-sheet="filters">${src.title}</button>
        <button data-sheet="filters">${lvText(S.lv)}</button>
        <button data-sheet="filters">${S.variants} ${plural(S.variants, 'вариант', 'варианта', 'вариантов')}</button>
      </div>`;
  }

  /* ── Нижние листы (телефон) и поповеры (десктоп) ─────────────────── */
  const overlay = () => $('#overlay');
  function closeOverlay() { overlay().innerHTML = ''; }
  function openSheet(title, body, foot) {
    overlay().innerHTML = `<div class="scrim" data-close></div><div class="bsheet" role="dialog" aria-modal="true" aria-label="${title}"><div class="bsheet__grip"></div><div class="bsheet__h"><h2>${title}</h2><button class="btn btn--sm btn--ghost" data-close aria-label="Закрыть">${ico('x')}</button></div><div class="bsheet__body">${body}</div>${foot ? `<div class="bsheet__foot">${foot}</div>` : ''}</div>`;
  }
  function filtersBody() {
    return `<section><h3 class="sec-h">Откуда брать задачи</h3>${MK.sources.map((s) => `<button class="radio" role="radio" aria-checked="${S.src === s.id}" data-src="${s.id}"><i></i><span><b>${s.title}</b><small>${s.note}</small></span></button>`).join('')}</section>
      <section><h3 class="sec-h">Сложность</h3><div class="lvcards" role="group" aria-label="Сложность">${[1, 2, 3].map((l) => `<button data-lv="${l}" aria-pressed="${S.lv.includes(l)}"><b>${'★'.repeat(l)}</b><small>${MK.levelWords[l]}</small></button>`).join('')}</div><p class="hint" style="margin:8px 0 0">Можно выбрать несколько. Темы из состава не пропадают.</p></section>
      <section><h3 class="sec-h">Вариантов</h3><span class="step"><button data-vdec ${S.variants <= 1 ? 'disabled' : ''}>−</button><output>${S.variants}</output><button data-vinc ${S.variants >= 8 ? 'disabled' : ''}>+</button></span></section>
      <section class="more-in-sheet">${moreHtml()}</section>`;
  }
  function openFilters() {
    openSheet('Фильтры', filtersBody(), `<button class="btn btn--primary" data-close>Готово · ${total()} ${plural(total(), 'задача', 'задачи', 'задач')}</button>`);
  }
  function openPop(btn, html) {
    const r = btn.getBoundingClientRect();
    const d = $('#device').getBoundingClientRect();
    const top = r.bottom - d.top + 6, left = Math.min(r.left - d.left, d.width - 336);
    overlay().innerHTML = `<div class="scrim" data-close style="background:transparent"></div><div class="pop" style="top:${top}px;left:${left}px">${html}</div>`;
  }
  function taskMenu(key) {
    const list = S.generated ? buildList(S.variant) : [];
    const i = list.findIndex((t) => t.key === key);
    const t = list[i];
    openSheet(`Задача ${i + 1}`, `
      <button class="menu-item" data-tact="swap" data-key="${key}">${ico('swap')}Заменить на похожую</button>
      <div class="menu-item" style="cursor:default">${ico('star')}Другой уровень</div>
      <div class="menu-lv stars">${[1, 2, 3].map((l) => `<button data-tact="lvl" data-lv2="${l}" data-key="${key}" aria-pressed="${t && t.lv === l}">${'★'.repeat(l)}</button>`).join('')}</div>
      <button class="menu-item" data-tact="up" data-key="${key}" ${i <= 0 ? 'disabled style="opacity:.4"' : ''}>${ico('up')}Выше</button>
      <button class="menu-item" data-tact="down" data-key="${key}" ${i >= list.length - 1 ? 'disabled style="opacity:.4"' : ''}>${ico('down')}Ниже</button>
      <button class="menu-item danger" data-tact="del" data-key="${key}">${ico('x')}Убрать из листа</button>`);
  }
  function moreActions() {
    openSheet('Лист', `
      <button class="menu-item" data-pv="all">${ico('files')}Скачать всё одним файлом</button>
      <button class="menu-item" data-pv="link">${ico('link')}Скопировать ссылку на набор</button>
      <button class="menu-item" data-pv="kits">${ico('files')}Мои комплекты</button>`);
  }

  function toast(msg) {
    const host = isPhone() ? $('#device') : document.body;
    const el = document.createElement('div');
    el.className = 'toast'; el.textContent = msg; el.setAttribute('role', 'status');
    if (!isPhone()) { el.style.position = 'fixed'; }
    host.appendChild(el);
    setTimeout(() => el.remove(), 2200);
  }

  /* ── Действия над задачами ──────────────────────────────────────── */
  function currentKeys() { return buildList(S.variant).map((t) => t.key); }
  function taskAction(act, key, extra) {
    const tid = key.split('-')[0];
    if (act === 'swap') { S.zam[key] = (S.zam[key] || 0) + 1; toast('Задача заменена, остальные на месте'); }
    if (act === 'lvl') {
      const want = extra || (((buildList(S.variant).find((t) => t.key === key) || {}).lv || 1) % 3) + 1;
      const pool = MK.pool[tid];
      const has = pool.some((t) => t.lv === want);
      S.zam[key] = (S.zam[key] || 0) + 1;
      toast(has ? `Уровень ${'★'.repeat(want)}` : `У этой темы нет ${'★'.repeat(want)} — взяли ближайший`);
    }
    if (act === 'del') { S.sostav[tid] = Math.max(0, (S.sostav[tid] || 0) - 1); touched(); toast('Задача убрана из листа'); }
    if (act === 'up' || act === 'down') {
      const keys = currentKeys(); const i = keys.indexOf(key); const j = act === 'up' ? i - 1 : i + 1;
      if (j >= 0 && j < keys.length) { [keys[i], keys[j]] = [keys[j], keys[i]]; S.order = keys; }
    }
    closeOverlay(); render();
  }
  function bindTasks(root) {
    $$('.task[draggable="true"]', root).forEach((li) => {
      let timer = null;
      li.addEventListener('pointerdown', (e) => {
        if (e.pointerType !== 'touch' || e.target.closest('button')) return;
        timer = setTimeout(() => { timer = null; taskMenu(li.dataset.key); }, 500);
      });
      ['pointerup', 'pointercancel', 'pointerleave', 'pointermove'].forEach((ev) => li.addEventListener(ev, (e) => { if (ev !== 'pointermove' || Math.abs(e.movementY) > 3) { clearTimeout(timer); timer = null; } }));
      li.addEventListener('dragstart', (e) => { li.classList.add('is-drag'); e.dataTransfer.setData('text/plain', li.dataset.key); e.dataTransfer.effectAllowed = 'move'; });
      li.addEventListener('dragend', () => li.classList.remove('is-drag'));
      li.addEventListener('dragover', (e) => { e.preventDefault(); li.classList.add('is-over'); });
      li.addEventListener('dragleave', () => li.classList.remove('is-over'));
      li.addEventListener('drop', (e) => {
        e.preventDefault(); li.classList.remove('is-over');
        const from = e.dataTransfer.getData('text/plain'); const to = li.dataset.key;
        if (!from || from === to) return;
        const keys = currentKeys(); keys.splice(keys.indexOf(from), 1); keys.splice(keys.indexOf(to), 0, from);
        S.order = keys; render(); toast('Порядок изменён');
      });
    });
  }

  /* ── Генерация ──────────────────────────────────────────────────── */
  function generate(btn) {
    if (total() === 0) { toast('Добавьте хотя бы одну тему'); return; }
    $$('[data-go]').forEach((b) => b.classList.add('is-busy'));
    setTimeout(() => {
      const again = S.generated;
      if (again) S.seed++;
      S.generated = true; S.zam = {}; S.order = null; S.variant = 0;
      if (MOCK === 'b') S.step = 3;
      render();
      if (again) toast('Новые задачи, состав тот же');
      if (isPhone()) { const pv = $('#pv'); if (pv) $('#screen').scrollTo({ top: pv.offsetTop - 120, behavior: 'smooth' }); }
      else if (MOCK === 'a') { const pv = $('#pv'); if (pv && pv.getBoundingClientRect().top < 0) window.scrollTo({ top: 0, behavior: 'smooth' }); }
    }, 550);
  }
  /* Живой предпросмотр после первой генерации: seed и замены сохраняются. */
  function changed(msg) { if (S.generated && msg) toast(msg); render(); }

  /* ── Отрисовка страниц ──────────────────────────────────────────── */
  function renderA() {
    $('#strip').innerHTML = stripHtml();
    $('#presets').innerHTML = presetsHtml();
    $('#sostav').innerHTML = sostavHtml();
    const more = $('#more'); more.hidden = !S.moreOpen; if (S.moreOpen) more.innerHTML = moreHtml();
    $('#actbar').innerHTML = `<div class="sum">${summary()}</div><button class="btn btn--primary go" data-go>${S.generated ? ico('refresh') + 'Перегенерировать всё' : ico('play') + 'Сгенерировать'}</button>`;
    renderPreview();
  }
  function renderB() {
    const steps = [['Что', 'темы и количество'], ['Как', 'источник, сложность, варианты'], ['Результат', 'лист и скачивание']];
    $('#wiz').innerHTML = steps.map(([t, s], i) => `<button data-step="${i + 1}" ${S.step === i + 1 ? 'aria-current="step"' : ''} class="${S.step > i + 1 || (i === 2 && S.generated && S.step !== 3) ? 'is-done' : ''}" ${i === 2 && !S.generated ? 'disabled style="opacity:.55"' : ''}><i>${S.step > i + 1 ? '✓' : i + 1}</i><span><b>${t}</b><small>${s}</small></span></button>`).join('');
    const stage = $('#wstage');
    stage.classList.toggle('is-result', S.step === 3);
    const pane = $('#wpane');
    if (S.step === 1) {
      pane.innerHTML = `<h2>Что войдёт в лист</h2><p class="lead">Возьмите пресет или соберите состав по темам.</p>
        <div>${presetsHtml()}</div>
        <div class="card sostav">${sostavHtml(true)}</div>`;
    } else if (S.step === 2) {
      const src = S.src;
      pane.innerHTML = `<h2>Как собрать</h2><p class="lead">Значения по умолчанию подходят для большинства листов.</p>
        <div><span class="lbl">Откуда брать задачи</span><div class="ocards" style="margin-top:8px">${MK.sources.map((s) => `<button class="radio" role="radio" aria-checked="${src === s.id}" data-src="${s.id}"><i></i><span><b>${s.title}</b><small>${s.note}</small></span></button>`).join('')}</div></div>
        <div class="card" style="padding:14px 16px"><div class="opt" style="border:0"><div>Сложность<small>★ — ${MK.levelWords[1]}; ★★ — ${MK.levelWords[2]}; ★★★ — ${MK.levelWords[3]}</small></div><div class="stars">${[1, 2, 3].map((l) => `<button data-lv="${l}" aria-pressed="${S.lv.includes(l)}">${'★'.repeat(l)}</button>`).join('')}</div></div>
        <div class="opt"><div>Вариантов<small>у всех вариантов одинаковый состав</small></div><span class="step"><button data-vdec ${S.variants <= 1 ? 'disabled' : ''}>−</button><output>${S.variants}</output><button data-vinc ${S.variants >= 8 ? 'disabled' : ''}>+</button></span></div>
        <div class="opt"><div>Дополнительно<small>теория, примеры, QR-код, шапка листа</small></div><button class="btn btn--sm" data-more aria-expanded="${S.moreOpen}">${S.moreOpen ? 'Свернуть' : 'Показать'}</button></div></div>
        <div class="card more" ${S.moreOpen ? '' : 'hidden'}>${moreHtml()}</div>`;
    } else {
      const src = MK.sources.find((x) => x.id === S.src).short;
      pane.innerHTML = `<div class="recap"><button data-step="1">${total()} ${plural(total(), 'задача', 'задачи', 'задач')}<span>изменить</span></button><button data-step="2">${S.variants} ${plural(S.variants, 'вариант', 'варианта', 'вариантов')} · ${lvText(S.lv)} · ${src}<span>изменить</span></button></div>
        <div class="pv" id="pv"></div>`;
    }
    const foot = $('#wfoot');
    if (S.step === 1) foot.innerHTML = `<span class="sum">${summary()}</span><button class="btn btn--primary go" data-next>Дальше: как собрать</button>`;
    else if (S.step === 2) foot.innerHTML = `<span class="sum">${summary()}</span><button class="btn" data-step="1">Назад</button><button class="btn btn--primary go" data-go>${ico('play')}Сгенерировать</button>`;
    else foot.innerHTML = `<span class="sum">${summary()}</span><button class="btn btn--primary go" data-go>${ico('refresh')}Перегенерировать всё</button>`;
    const mini = $('#mini');
    mini.hidden = S.step === 3;
    if (S.step !== 3) {
      mini.innerHTML = `<div class="pv"><div class="pv__bar"><div class="pv__demo">${S.generated ? '<b>Ваш лист</b>' : '<span class="badge-demo">Пример</span>'}<span>${S.generated ? 'обновляется при изменении' : 'лист появится после шага 2'}</span></div></div><div class="pv__scroll">${sheetHtml({ demo: !S.generated })}</div></div>`;
    } else renderPreview();
  }
  function render() { if (MOCK === 'a') renderA(); else renderB(); }

  /* ── События ────────────────────────────────────────────────────── */
  document.addEventListener('click', (e) => {
    const b = e.target.closest('button, [data-close]');
    if (!b) return;
    const d = b.dataset;
    if (d.close !== undefined) { closeOverlay(); render(); return; }
    if (d.preset) { applyPreset(d.preset); changed('Пресет применён'); return; }
    if (d.add) {
      if (S.pick) { S.sostav = {}; S.sostav[d.add] = 6; S.preset = 'one'; }
      else { S.sostav[d.add] = 1; touched(); }
      changed(); return;
    }
    if (d.inc) { S.sostav[d.inc] = Math.min(MK.limits.maxPerTopic, (S.sostav[d.inc] || 0) + 1); touched(); changed(); return; }
    if (d.dec) { S.sostav[d.dec] = Math.max(0, (S.sostav[d.dec] || 0) - 1); touched(); changed(); return; }
    if (d.open && b.classList.contains('tname')) { S.open[d.open] = !S.open[d.open]; render(); return; }
    if (d.lv && !d.tact) {
      const l = +d.lv; const has = S.lv.includes(l);
      if (has && S.lv.length === 1) { toast('Нужен хотя бы один уровень'); return; }
      S.lv = has ? S.lv.filter((x) => x !== l) : S.lv.concat(l).sort(); touched();
      const inSheet = !!b.closest('.bsheet'); changed(S.generated ? 'Лист обновлён: состав тот же' : null);
      if (inSheet) openFilters(); return;
    }
    if (d.vinc !== undefined || d.vdec !== undefined) {
      S.variants = Math.max(1, Math.min(8, S.variants + (d.vinc !== undefined ? 1 : -1))); if (S.variant >= S.variants) S.variant = 0; touched();
      const inSheet = !!b.closest('.bsheet'); changed(); if (inSheet) openFilters(); return;
    }
    if (d.src) { S.src = d.src; touched(); const inSheet = !!b.closest('.bsheet'); closeOverlay(); changed(S.generated ? 'Лист обновлён' : null); if (inSheet) openFilters(); return; }
    if (d.pop === 'src') { openPop(b, MK.sources.map((s) => `<button class="pop__opt" role="menuitemradio" aria-checked="${S.src === s.id}" data-src="${s.id}"><b>${s.title}</b><small>${s.note}</small></button>`).join('')); return; }
    if (d.more !== undefined) { S.moreOpen = !S.moreOpen; render(); if (MOCK === 'a' && S.moreOpen) $('#more').scrollIntoView({ block: 'nearest', behavior: 'smooth' }); return; }
    if (d.x) { S.extras[d.x] = !S.extras[d.x]; const inSheet = !!b.closest('.bsheet'); changed(); if (inSheet) openFilters(); return; }
    if (d.ex !== undefined) { S.extras.examples = +d.ex; const inSheet = !!b.closest('.bsheet'); changed(); if (inSheet) openFilters(); return; }
    if (d.sheet === 'filters') { openFilters(); return; }
    if (d.go !== undefined) { generate(b); return; }
    if (d.next !== undefined) { if (total() === 0) { toast('Добавьте хотя бы одну тему'); return; } S.step = 2; render(); return; }
    if (d.step) { const s = +d.step; if (s === 3 && !S.generated) return; S.step = s; render(); return; }
    if (d.var !== undefined) { S.variant = +d.var; render(); return; }
    if (d.view) { S.view = d.view; render(); return; }
    if (d.pv === 'more') { moreActions(); return; }
    if (d.pv === 'pdf') { toast(`PDF: ${S.view === 'teacher' ? 'лист учителя' : 'лист ученика'}, вариант ${S.variant + 1}`); return; }
    if (d.pv === 'all') { closeOverlay(); toast(`Один файл: ${S.variants} ${plural(S.variants, 'вариант', 'варианта', 'вариантов')} ученика и ответы учителя`); return; }
    if (d.pv === 'link') {
      closeOverlay();
      const code = `/zadaniya/11/generator/?n=${encodeURIComponent(Object.entries(S.sostav).filter(([, n]) => n).map(([k, n]) => k + n).join('.'))}&lv=${S.lv.join('')}&v=${S.variants}&src=${S.src}&seed=K7Q2M${S.seed}`;
      try { navigator.clipboard.writeText('https://budetnaege.ru' + code).catch(() => {}); } catch (err) { /* нет буфера — показываем текст */ }
      toast('Ссылка на набор скопирована'); return;
    }
    if (d.pv === 'kits') { closeOverlay(); toast('Мои комплекты: прошлые наборы с кодами — как сейчас'); return; }
    if (d.pv === 'regen') { closeOverlay(); S.seed++; S.zam = {}; S.order = null; render(); toast('Новые задачи, состав тот же'); return; }
    if (d.act === 'menu') { taskMenu(b.closest('.task').dataset.key); return; }
    if (d.act) { taskAction(d.act, b.closest('.task').dataset.key); return; }
    if (d.tact) { taskAction(d.tact, d.key, d.lv2 ? +d.lv2 : undefined); return; }
  });
  document.addEventListener('change', (e) => {
    const t = e.target;
    if (t.dataset.kind !== undefined) { S.extras.kind = t.value; render(); }
    if (t.dataset.date !== undefined) { S.extras.date = t.value; render(); }
  });
  document.addEventListener('input', (e) => {
    if (e.target.dataset.teacher !== undefined) { S.extras.teacher = e.target.value; const pv = $('#pv'); if (pv) { const c = pv.querySelector('.sh-course'); if (c) c.innerHTML = `<b>Профильная математика</b><br>Учитель: ${esc(S.extras.teacher)}`; } }
  });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') { closeOverlay(); } });
  window.addEventListener('scroll', () => { const pop = $('.pop'); if (pop) closeOverlay(); }, { passive: true });

  /* ── Панель макета: десктоп / телефон, состояние из адреса ───────── */
  function setView(v) {
    /* На настоящем телефоне рамка не нужна: раскладку переключает ширина. */
    document.body.classList.toggle('view-phone', v === 'phone' && window.innerWidth > 760);
    $$('[data-view-mk]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.viewMk === v)));
    try { localStorage.setItem('mk-view', v); } catch (err) { /* без хранилища */ }
    closeOverlay(); render();
  }
  $$('[data-view-mk]').forEach((b) => b.addEventListener('click', () => setView(b.dataset.viewMk)));
  /* Состояние из адреса: ?view=phone&state=done… или якорь #phone-done-teacher
     (внутри артефакта до страницы доходит только простой якорь). */
  const params = new URLSearchParams(location.search);
  const tok = location.hash.replace('#', '').split('-').filter(Boolean);
  const map = { phone: ['view', 'phone'], desktop: ['view', 'desktop'], done: ['state', 'done'], teacher: ['teacher', '1'], filters: ['sheet', 'filters'], task: ['sheet', 'task'], more: ['more', '1'], step2: ['step', '2'], step3: ['state', 'done'], src: ['pop', 'src'] };
  tok.forEach((t) => { if (map[t]) params.set(map[t][0], map[t][1]); });
  let v0 = params.get('view');
  if (!v0) { try { v0 = localStorage.getItem('mk-view'); } catch (err) { v0 = null; } }
  if (params.get('state') === 'done') { S.generated = true; if (MOCK === 'b') S.step = 3; }
  if (params.get('teacher')) S.view = 'teacher';
  if (params.get('step')) S.step = +params.get('step');
  if (params.get('more')) S.moreOpen = true;
  setView(v0 === 'phone' ? 'phone' : 'desktop');
  if (params.get('sheet') === 'filters') openFilters();
  if (params.get('sheet') === 'task') { const k = buildList(0)[2]; if (k) taskMenu(k.key); }
  if (params.get('pop') === 'src') { const b = $('[data-pop="src"]'); if (b) openPop(b, MK.sources.map((s) => `<button class="pop__opt" aria-checked="${S.src === s.id}" data-src="${s.id}"><b>${s.title}</b><small>${s.note}</small></button>`).join('')); }
})();
