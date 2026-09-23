/* graph/konus3d.js — конус, секущая плоскость и парабола сечения.

   Чертёж строится вычислением, а не подгонкой: конус задан в трёх
   измерениях, плоскость — формулой, параллельной одной образующей,
   а линия их пересечения считается точками и проецируется той же
   проекцией, что и сам конус. Поэтому кривая лежит на конусе по
   построению, а не «на глаз».

   Условие параболы. Плоскость с нормалью n даёт в сечении параболу
   тогда и только тогда, когда она параллельна образующей: n · g = 0,
   где g — направление образующей. Отсюда и берётся нормаль, а не
   подбирается наклоном.

   Все числа модуля — в единицах самого конуса (радиус основания R,
   высота H). В пиксели их переводит проекция в конце.
*/

/** Конус: вершина сверху, ось вертикальна, основание радиуса R внизу. */
var KONUS = { R: 1, H: 2.2 };

/* Взгляд: поворот вокруг оси и подъём над плоскостью основания.
   Одна проекция на весь чертёж — ни у одного элемента своей нет. */
var VZGLYAD = { azimut: 18, podyem: 26 };

/* Доля высоты, на которой стоит вершина параболы. Меньше единицы
   с заметным запасом: вершина не должна упираться в вершину конуса. */
var VERSHINA = 0.72;

/** Поля прямоугольника секущей плоскости вокруг дуги, в долях радиуса. */
var POLYA = { vverh: 0.22, vniz: 0.2, vbok: 0.16 };

function grad(a) { return (a * Math.PI) / 180; }

/** Единичный вектор. */
function norm(v) {
  var d = Math.hypot(v[0], v[1], v[2]);
  return [v[0] / d, v[1] / d, v[2] / d];
}
function skal(a, b) { return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]; }
function plus(a, b, k) { return [a[0] + b[0] * k, a[1] + b[1] * k, a[2] + b[2] * k]; }

/**
 * Геометрия чертежа в трёх измерениях.
 *
 * Ось z вверх, основание лежит в z = 0, вершина конуса в z = H.
 * Плоскость: n · X = d, где n взята из условия параллельности
 * образующей, а d выбрано так, чтобы вершина параболы села на нужную
 * долю высоты.
 */
function geometriya(nastr) {
  var R = nastr.R;
  var H = nastr.H;
  /* Образующая, которой параллельна плоскость: та, что смотрит
     в сторону −x. Направление — от вершины к точке основания. */
  var g = [-R, 0, -H];
  /* n · g = 0: −R·nx − H·nz = 0. При nz = 1 получаем nx = −H/R. */
  var n = [-H / R, 0, 1];
  /* Вершина параболы стоит на высоте (H + d)/2, отсюда d. */
  var zВершины = (nastr.dolya === undefined ? VERSHINA : nastr.dolya) * H;
  var d = 2 * zВершины - H;

  /* Подстановка z = d + (H/R)·x в уравнение конуса даёт
     y² = k² − 2k·x, где k = R(H − d)/H, то есть параболу. */
  var k = (R * (H - d)) / H;
  var xПоY = function (y) { return (k * k - y * y) / (2 * k); };
  var zПоX = function (x) { return d + (H / R) * x; };

  /* Концы дуги: там, где плоскость выходит через основание, z = 0. */
  var xКонца = (-d * R) / H;
  var yКонца = Math.sqrt(Math.max(0, R * R - xКонца * xКонца));

  var tochka = function (y) {
    var x = xПоY(y);
    return [x, y, zПоX(x)];
  };

  return { R: R, H: H, g: g, n: n, d: d, k: k, tochka: tochka,
           yКонца: yКонца, vershina: tochka(0) };
}

/** Точки дуги параболы от одного конца до другого. */
function dugaParaboly(geom, shagov) {
  var tochki = [];
  for (var i = 0; i <= shagov; i++) {
    var y = -geom.yКонца + (2 * geom.yКонца * i) / shagov;
    tochki.push(geom.tochka(y));
  }
  return tochki;
}

/**
 * Видимость точки боковой поверхности.
 *
 * Конус выпуклый, поэтому точка видна тогда, когда внешняя нормаль
 * поверхности смотрит на зрителя. Нормаль в точке с азимутом θ —
 * (H·cos θ, H·sin θ, R).
 */
function vidnaTochka(p, geom, kamera) {
  var th = Math.atan2(p[1], p[0]);
  var n = [geom.H * Math.cos(th), geom.H * Math.sin(th), geom.R];
  return skal(n, kamera) > 0;
}

/** Проекция: экранные оси взгляда по азимуту и подъёму. */
function proekciya(vzglyad) {
  var g1 = grad(vzglyad.azimut);
  var g2 = grad(vzglyad.podyem);
  var vpravo = [-Math.sin(g1), Math.cos(g1), 0];
  var vverh = [-Math.cos(g1) * Math.sin(g2), -Math.sin(g1) * Math.sin(g2), Math.cos(g2)];
  var kamera = [Math.cos(g1) * Math.cos(g2), Math.sin(g1) * Math.cos(g2), Math.sin(g2)];
  return { vpravo: vpravo, vverh: vverh, kamera: kamera };
}

/** Путь SVG по списку экранных точек. */
function put(tochki) {
  return 'M ' + tochki.map(function (t) {
    return t[0].toFixed(1) + ' ' + t[1].toFixed(1);
  }).join(' L ');
}

/** Куски списка точек по признаку видимости. */
function kuski(tochki, vidno) {
  var out = [];
  var tek = null;
  for (var i = 0; i < tochki.length; i++) {
    if (tek === null || tek.vidno !== vidno[i]) {
      tek = { vidno: vidno[i], tochki: [tochki[i]] };
      out.push(tek);
    } else {
      tek.tochki.push(tochki[i]);
    }
    /* Точка на границе принадлежит обоим кускам: иначе между сплошной
       и штриховой частью остаётся разрыв. */
    if (i + 1 < tochki.length && vidno[i + 1] !== vidno[i]) {
      tek.tochki.push(tochki[i + 1]);
    }
  }
  return out;
}

/**
 * Чертёж целиком: пути SVG и числа для проверки.
 *
 * Возвращает координаты уже в системе картинки, но сами построения
 * до последнего шага идут в единицах конуса.
 */
export function chertyozh(nastr) {
  var opt = nastr || {};
  var geom = geometriya({ R: opt.R || KONUS.R, H: opt.H || KONUS.H,
                          dolya: opt.vershina === undefined ? VERSHINA : opt.vershina });
  var vid = proekciya({
    azimut: opt.azimut === undefined ? VZGLYAD.azimut : opt.azimut,
    podyem: opt.podyem === undefined ? VZGLYAD.podyem : opt.podyem,
  });
  var storona = opt.storona || 1000;
  var shagov = opt.shagov || 240;

  /* Все точки чертежа сначала собираются в трёх измерениях, потом
     проецируются разом: одна проекция на весь чертёж. */
  var duga = dugaParaboly(geom, shagov);
  var obod = [];
  for (var i = 0; i <= 360; i++) {
    var th = grad(i);
    obod.push([geom.R * Math.cos(th), geom.R * Math.sin(th), 0]);
  }
  var vershinaKonusa = [0, 0, geom.H];

  /* Прямоугольник секущей плоскости: вдоль образующей, которой она
     параллельна, и поперёк неё. Поля взяты от дуги, чтобы плоскость
     выходила за конус, но не занимала весь чертёж. */
  var u = norm(geom.g);
  var v = [0, 1, 0];
  var aКонца = skal([duga[0][0] - geom.vershina[0], duga[0][1] - geom.vershina[1],
                     duga[0][2] - geom.vershina[2]], u);
  var a0 = -POLYA.vverh * geom.R;
  var a1 = aКонца + POLYA.vniz * geom.R;
  var b = geom.yКонца + POLYA.vbok * geom.R;
  var ugly = [
    plus(plus(geom.vershina, u, a0), v, -b),
    plus(plus(geom.vershina, u, a0), v, b),
    plus(plus(geom.vershina, u, a1), v, b),
    plus(plus(geom.vershina, u, a1), v, -b),
  ];

  /* Общий масштаб и сдвиг: чертёж вписывается в квадрат стороной
     storona с небольшим полем. */
  var ploskie = function (p) {
    return [skal(p, vid.vpravo), -skal(p, vid.vverh)];
  };
  var vse = duga.concat(obod, [vershinaKonusa], ugly).map(ploskie);
  var xs = vse.map(function (p) { return p[0]; });
  var ys = vse.map(function (p) { return p[1]; });
  var minX = Math.min.apply(null, xs), maxX = Math.max.apply(null, xs);
  var minY = Math.min.apply(null, ys), maxY = Math.max.apply(null, ys);
  var pole = storona * 0.04;
  var mash = (storona - 2 * pole) / Math.max(maxX - minX, maxY - minY);
  var sdvigX = pole + (storona - 2 * pole - (maxX - minX) * mash) / 2;
  var sdvigY = pole + (storona - 2 * pole - (maxY - minY) * mash) / 2;
  var ekran = function (p) {
    var q = ploskie(p);
    return [sdvigX + (q[0] - minX) * mash, sdvigY + (q[1] - minY) * mash];
  };

  var vidnoDuga = duga.map(function (p) { return vidnaTochka(p, geom, vid.kamera); });
  var vidnoObod = obod.map(function (p) { return vidnaTochka(p, geom, vid.kamera); });

  var kuskiDugi = kuski(duga, vidnoDuga);
  var kuskiOboda = kuski(obod, vidnoObod);

  /* Силуэт конуса: две образующие, по которым поверхность уходит за
     себя, и видимая часть обода между ними. */
  var granica = [];
  for (var j = 0; j < obod.length - 1; j++) {
    if (vidnoObod[j] !== vidnoObod[j + 1]) { granica.push(obod[j]); }
  }
  var vidimyyObod = obod.filter(function (_, idx) { return vidnoObod[idx]; });
  var zalivkaKonusa = [vershinaKonusa].concat(vidimyyObod).map(ekran);

  return {
    viewBox: '0 0 ' + storona + ' ' + storona,
    konus: {
      zalivka: put(zalivkaKonusa) + ' Z',
      obrazuyushchie: granica.map(function (t) {
        return put([ekran(vershinaKonusa), ekran(t)]);
      }),
      obodVidno: kuskiOboda.filter(function (k) { return k.vidno; })
        .map(function (k) { return put(k.tochki.map(ekran)); }),
      obodSkryto: kuskiOboda.filter(function (k) { return !k.vidno; })
        .map(function (k) { return put(k.tochki.map(ekran)); }),
    },
    ploskost: {
      zalivka: put(ugly.map(ekran)) + ' Z',
    },
    parabola: {
      vidno: kuskiDugi.filter(function (k) { return k.vidno; })
        .map(function (k) { return put(k.tochki.map(ekran)); }),
      skryto: kuskiDugi.filter(function (k) { return !k.vidno; })
        .map(function (k) { return put(k.tochki.map(ekran)); }),
    },
    /* Всё, что нужно проверке: сами числа, а не картинка. */
    svedeniya: {
      R: geom.R, H: geom.H, n: geom.n, d: geom.d, obrazuyushchaya: geom.g,
      vershinaParaboly: geom.vershina,
      konec1: duga[0], konec2: duga[duga.length - 1],
      tochkiDugi: duga,
      uglyPloskosti: ugly,
    },
  };
}
