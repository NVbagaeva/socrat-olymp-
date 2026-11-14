/* scripts/lib/mery-chertezha.mjs — мерки читаемости чертежа движка
   схем (lib/skhemy): по кадру и его экранной раскладке.

   Чертёж на листе — shirinaMm мм на ширину кадра W px. Меряется:
     • razmer — большая сторона рамки видимых линий, окружностей и
       точек, px;
     • радиусы видимых окружностей и дуг, px: наименьший — долей
       размера, отношение наибольшего к наименьшему;
     • подписанные отрезки (величина вдоль отрезка) — длина в мм и
       отношение наибольшего к наименьшему;
     • наименьший угол между видимыми отрезками, сходящимися в точке
       (общий конец или конец на другом отрезке), градусы; отрезки
       одной прямой (меньше 1°) не в счёт;
     • наименьшее расстояние между подписанными точками, мм. */

const d2 = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);

/** Точка p лежит на отрезке ab (по экрану, допуск в px). */
function naOtrezke(p, a, b, dop = 0.75) {
  const l = d2(a, b);
  if (l < 1e-9) return false;
  const t = ((p[0] - a[0]) * (b[0] - a[0]) + (p[1] - a[1]) * (b[1] - a[1])) / (l * l);
  if (t < -1e-6 || t > 1 + 1e-6) return false;
  const q = [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
  return d2(p, q) < dop;
}

function ugolMezhdu(v, a, b) {
  const u = [a[0] - v[0], a[1] - v[1]];
  const w = [b[0] - v[0], b[1] - v[1]];
  const c = (u[0] * w[0] + u[1] * w[1]) / (Math.hypot(...u) * Math.hypot(...w));
  return (Math.acos(Math.max(-1, Math.min(1, c))) * 180) / Math.PI;
}

/**
 * kadr — кадр схемy, vidim(el) — виден ли элемент, e — raskladka.
 * Отдаёт мерки и «где» — что именно наименьшее.
 */
export function meryChertezha(kadr, vidim, e, W, shirinaMm, H = 250, pole = 24) {
  const mm = shirinaMm / W;
  const v = (p) => e.preob.vEkran(p);
  const els = kadr.elementy.filter(vidim);
  const xs = [];
  const ys = [];
  const vz = (p, r = 0) => {
    xs.push(p[0] - r, p[0] + r);
    ys.push(p[1] - r, p[1] + r);
  };
  const otrezki = [];
  const krugi = [];
  for (const el of els) {
    if (el.vid === 'otrezok') {
      const a = v(el.a);
      const b = v(el.b);
      vz(a);
      vz(b);
      if (d2(a, b) > 0.5) otrezki.push({ id: el.id, a, b, rol: el.rol });
    } else if (el.vid === 'okruzhnost' || el.vid === 'duga') {
      const c = v(el.c);
      const r = el.r * e.preob.s;
      if (el.vid === 'okruzhnost') vz(c, r);
      krugi.push({ id: el.id, r });
    } else if (el.vid === 'tochka') vz(v(el.p));
  }
  const bw = Math.max(...xs) - Math.min(...xs);
  const bh = Math.max(...ys) - Math.min(...ys);
  const razmer = Math.max(bw, bh, 1);
  /* Заполнение кадра (без полей под подписи): меньшая из долей по ширине
     и по высоте. Фигура вписана в кадр — по одной стороне она во всю
     ширину; узкая высокая фигура на листе выходит мелкой. */
  const zapolnenie = Math.min(bw / (W - 2 * pole), bh / (H - 2 * pole));

  /* Окружности. */
  let minR = null;
  let otnR = 1;
  if (krugi.length > 0) {
    const rs = krugi.map((k) => k.r);
    const mn = Math.min(...rs);
    minR = { dolya: mn / razmer, mm: mn * mm, id: krugi.find((k) => k.r === mn).id };
    otnR = Math.max(...rs) / mn;
  }

  /* Подписанные отрезки. */
  const podp = els
    .filter((el) => el.vid === 'velichina' && 'otrezok' in el.yakor && !/^S/.test(el.tekst))
    .map((el) => ({ tekst: el.tekst, l: d2(v(el.yakor.otrezok[0]), v(el.yakor.otrezok[1])) * mm }));
  let minOtr = null;
  let otnOtr = 1;
  if (podp.length > 0) {
    const mn = Math.min(...podp.map((x) => x.l));
    minOtr = { mm: mn, tekst: podp.find((x) => x.l === mn).tekst };
    otnOtr = Math.max(...podp.map((x) => x.l)) / mn;
  }

  /* Углы между отрезками в общей точке. */
  let minUgol = null;
  const blizko = (p, q) => d2(p, q) < 0.75;
  for (let i = 0; i < otrezki.length; i += 1) {
    for (let j = i + 1; j < otrezki.length; j += 1) {
      const s = otrezki[i];
      const t = otrezki[j];
      const proby = [];
      for (const p of [s.a, s.b]) {
        for (const q of [t.a, t.b])
          if (blizko(p, q)) proby.push([p, s.a === p ? s.b : s.a, t.a === q ? t.b : t.a]);
        if (naOtrezke(p, t.a, t.b) && !blizko(p, t.a) && !blizko(p, t.b)) {
          const dal = s.a === p ? s.b : s.a;
          proby.push([p, dal, t.a], [p, dal, t.b]);
        }
      }
      for (const q of [t.a, t.b]) {
        if (naOtrezke(q, s.a, s.b) && !blizko(q, s.a) && !blizko(q, s.b)) {
          const dal = t.a === q ? t.b : t.a;
          proby.push([q, dal, s.a], [q, dal, s.b]);
        }
      }
      for (const [vv, a, b] of proby) {
        const u = ugolMezhdu(vv, a, b);
        if (u < 1 || u > 179) continue;
        const m = Math.min(u, 180 - u > 1 ? u : u);
        if (minUgol === null || m < minUgol.ugol) minUgol = { ugol: m, gde: `${s.id}∠${t.id}` };
      }
    }
  }

  /* Точки с подписями. */
  const imennye = els
    .filter((el) => el.vid === 'tochka' && el.imya)
    .map((el) => ({ imya: el.imya, p: v(el.p) }));
  let minTochki = null;
  for (let i = 0; i < imennye.length; i += 1)
    for (let j = i + 1; j < imennye.length; j += 1) {
      const d = d2(imennye[i].p, imennye[j].p) * mm;
      if (minTochki === null || d < minTochki.mm)
        minTochki = { mm: d, gde: `${imennye[i].imya}–${imennye[j].imya}` };
    }

  return {
    razmer,
    razmerMm: razmer * mm,
    zapolnenie,
    minR,
    otnR,
    minOtr,
    otnOtr,
    minUgol,
    minTochki,
  };
}
