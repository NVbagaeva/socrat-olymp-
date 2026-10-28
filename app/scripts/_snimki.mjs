import { chromium, devices } from 'playwright';
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path';
const OUT = '/home/user/vr-wt/app/out'; const DIR = '/home/user/vr-wt/docs/stereo-vrashchenie-snimki';
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.woff2': 'font/woff2', '.svg': 'image/svg+xml', '.png': 'image/png', '.webp': 'image/webp', '.txt': 'text/plain' };
const server = http.createServer((req, res) => { let f = path.join(OUT, decodeURIComponent(req.url.split('?')[0])); if (fs.existsSync(f) && fs.statSync(f).isDirectory()) f = path.join(f, 'index.html'); if (!fs.existsSync(f)) { res.writeHead(404); res.end(); return; } res.writeHead(200, { 'content-type': MIME[path.extname(f)] ?? 'application/octet-stream' }); fs.createReadStream(f).pipe(res); });
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const BASE = 'http://127.0.0.1:' + server.address().port;
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const SIZES = { '390': { ...devices['iPhone 13'], viewport: { width: 390, height: 844 } }, '1440': { viewport: { width: 1440, height: 900 } } };
async function povernut(p, el, dx, dy) { const bx = await el.boundingBox(); const x = bx.x + bx.width * 0.4, y = bx.y + bx.height * 0.5; await p.mouse.move(x, y); await p.mouse.down(); for (let i = 1; i <= 15; i++) await p.mouse.move(x + dx * i / 15, y + dy * i / 15); await p.mouse.up(); await p.waitForTimeout(1200); }
async function snimok(name, url, sel, opts = {}) {
  for (const [w, o] of Object.entries(SIZES)) {
    const ctx = await b.newContext({ ...o, hasTouch: w === '390' });
    await ctx.addInitScript(() => { localStorage.setItem('budetege:cookie-notice:v1', '{"seen":true}'); localStorage.setItem('budetege:onboarding:v1', '{"welcomeSeen":true}'); });
    const p = await ctx.newPage(); await p.goto(BASE + url, { waitUntil: 'networkidle' });
    if (opts.pered) await opts.pered(p);
    const el = p.locator(sel).nth(opts.idx ?? 0); await el.scrollIntoViewIfNeeded(); await p.waitForTimeout(600);
    await el.screenshot({ path: `${DIR}/${name}-${w}-do.png` });
    const vr = el.locator('.vr__oblast').first();
    await povernut(p, (await vr.count()) ? vr : el, opts.dx ?? 110, opts.dy ?? 18);
    await el.screenshot({ path: `${DIR}/${name}-${w}-posle.png` });
    await ctx.close();
  }
}
await snimok('trenazher3-cilindr', '/zadaniya/3/trenazher/?tipy=P03-63', '.z3t__fig--3d', { pered: async (p) => { await p.waitForTimeout(2000); await p.getByRole('button', { name: 'Начать тренировку' }).filter({ visible: true }).first().click(); await p.waitForTimeout(2500); } });
await snimok('trenazher3-prizma', '/zadaniya/3/trenazher/?tipy=P03-24', '.z3t__fig--3d', { pered: async (p) => { await p.waitForTimeout(2000); await p.getByRole('button', { name: 'Начать тренировку' }).filter({ visible: true }).first().click(); await p.waitForTimeout(2500); } });
await snimok('generator3', '/zadaniya/3/generator/', '.gen-task__fig--3d', { pered: async (p) => { await p.waitForTimeout(2000); await p.getByRole('button', { name: /Сгенерировать/ }).first().click(); await p.waitForTimeout(6000); } });
await snimok('teoriya3', '/zadaniya/3/teoriya/', '.z3d', { idx: 3 });
await snimok('opornye-nazhmi', '/zadaniya/3/opornye-zadachi/chitayu-chertezh/', '.o3-nazhmi', { pered: async (p) => { for (let i = 0; i < 10 && (await p.locator('.o3-nazhmi').count()) === 0; i++) { await p.getByRole('button', { name: 'Следующая задача' }).first().click(); await p.waitForTimeout(300); } } });
await snimok('razbor15', '/zadaniya/15/razbor/ploshchad-secheniya/', '.z3d');
await snimok('razbor3', '/zadaniya/3/razbor/diagonali/', '.z3d');
await b.close(); server.close();
