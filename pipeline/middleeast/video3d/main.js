import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { buildMap, buildLand, buildTable, loadMapM, LX, CITY, PROXY, BASES, COL, G, bounceY } from './me.js';
import { buildBase } from './kbase.js';
import { buildSea, waveH } from './ksea.js';
import { hash } from './tex.js';
const RW = 720, RH = 1280, OW = 1080, OH = 1920;
const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
renderer.setSize(RW, RH); renderer.setPixelRatio(1); renderer.toneMapping = THREE.NeutralToneMapping; renderer.toneMappingExposure = 1.0;
renderer.domElement.style.display = 'none'; document.body.appendChild(renderer.domElement);
const out = document.getElementById('out'); const ctx = out.getContext('2d');
const cam = new THREE.PerspectiveCamera(45, RW / RH, .1, 20000);
const composer = new EffectComposer(renderer);
const rp = new RenderPass(new THREE.Scene(), cam); composer.addPass(rp);
const bloom = new UnrealBloomPass(new THREE.Vector2(RW, RH), .3, .5, 1.15); composer.addPass(bloom);
composer.addPass(new OutputPass());
const B = { map: buildMap, land: buildLand, table: buildTable, base: buildBase, sea: buildSea };
const SETS = {}; const getSet = k => SETS[k] || (SETS[k] = B[k]());
let TL, WORDS, LOGO;
const V = a => new THREE.Vector3(...a);
const lin = x => Math.max(0, Math.min(1, x));
const ease = x => { x = lin(x); return x < .5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2; };
const eo = x => { x = lin(x); return 1 - Math.pow(1 - x, 3); };
const ob = x => { x = lin(x); const c1 = 1.7, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); };
const seg = (t, a, b) => lin((t - a) / (b - a));
const mix = (a, b, k) => a.map((v, i) => v + (b[i] - v) * k);
const norm = s => s.replace(/[^A-Za-z0-9']/g, '').toLowerCase();
const W = (w, n = 1) => { let k = 0; for (const x of WORDS) { if (norm(x.w) === norm(w)) { k++; if (k === n) return x.a; } } throw new Error('word ' + w + n); };
const proj = (p) => { const v = new THREE.Vector3(...p).project(cam); return [(v.x + 1) / 2 * OW, (1 - v.y) / 2 * OH, v.z]; };

// ---------- overlay helpers ----------
function chip(x, y, txt, col = '#ffd23f', bg = 'rgba(8,10,14,.84)', size = 42) {
  ctx.save(); ctx.font = `800 ${size}px Montserrat`; const w = ctx.measureText(txt).width + size * 1.1, h = size * 1.6;
  ctx.fillStyle = bg; ctx.beginPath(); ctx.roundRect(x - w / 2, y - h / 2, w, h, h / 2); ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = col; ctx.stroke();
  ctx.fillStyle = col; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(txt, x, y + 2); ctx.restore();
}
let CUR = null; const LOWSET = ['cock', 'cabin'];
function chipAt(t, t0, x, y, txt, col, bg, size, hold = 1e9) { if (CUR && LOWSET.includes(CUR.set) && y < 1000) y = 1120 + (y - 480) * .25; const k = ob(seg(t, t0, t0 + .22)) * (1 - seg(t, t0 + hold, t0 + hold + .15)); if (k <= .01) return; ctx.save(); ctx.translate(x, y); ctx.scale(k, k); ctx.translate(-x, -y); chip(x, y, txt, col, bg, size); ctx.restore(); }
function stamp(t, t0, lines, y = 560, col = '#ffd23f', rot = -.06, size = 190, hold = 1e9) {
  const k = ob(seg(t, t0, t0 + .22)) * (1 - seg(t, t0 + hold, t0 + hold + .2)); if (k <= .01) return;
  ctx.save(); ctx.translate(OW / 2, y); ctx.rotate(rot); ctx.scale(k * (1 + .12 * (1 - seg(t, t0, t0 + .5))), k); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';
  lines.forEach((l, i) => { const sz = (typeof l === 'string' ? size : l.size || size); const txt = typeof l === 'string' ? l : l.t; const c = typeof l === 'string' ? col : (l.c || col); ctx.font = `900 ${sz}px Montserrat`; ctx.shadowColor = 'rgba(0,0,0,.6)'; ctx.shadowBlur = 16; ctx.shadowOffsetY = 8; ctx.lineWidth = sz * .12; ctx.strokeStyle = '#0a0a0a'; const yy = i * size * .95 - (lines.length - 1) * size * .475; ctx.strokeText(txt, 0, yy); ctx.shadowColor = 'transparent'; ctx.fillStyle = c; ctx.fillText(txt, 0, yy); });
  ctx.restore();
}
function flagIn(x, y, w, t = 0) { const h = w * .66; ctx.save(); ctx.translate(x, y); ['#ff9933', '#ffffff', '#138808'].forEach((c, i) => { ctx.fillStyle = c; ctx.beginPath(); ctx.moveTo(0, i * h / 3 + Math.sin(t * 6) * 2); for (let k = 0; k <= 10; k++) ctx.lineTo(w * k / 10, i * h / 3 + Math.sin(t * 6 + k * .7) * 5); for (let k = 10; k >= 0; k--) ctx.lineTo(w * k / 10, (i + 1) * h / 3 + 1 + Math.sin(t * 6 + k * .7) * 5); ctx.closePath(); ctx.fill(); }); ctx.strokeStyle = '#000080'; ctx.lineWidth = w * .02; ctx.beginPath(); ctx.arc(w / 2, h / 2 + Math.sin(t * 6 + 3.5) * 5, h * .13, 0, 7); ctx.stroke(); ctx.lineWidth = 6; ctx.strokeStyle = '#0a0a0a'; ctx.strokeRect(0, 0, w, h); ctx.restore(); }
function calCard(t, t0, x, y, d = '30', m = 'SEPT', yr = '2026') { const k = ob(seg(t, t0, t0 + .3)); if (k <= .01) return; ctx.save(); ctx.translate(x, y); ctx.rotate(-.05); ctx.scale(k, k); ctx.shadowColor = 'rgba(0,0,0,.5)'; ctx.shadowBlur = 20; ctx.shadowOffsetY = 10; ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.roundRect(-210, -230, 420, 460, 30); ctx.fill(); ctx.shadowColor = 'transparent'; ctx.fillStyle = '#e8552b'; ctx.beginPath(); ctx.roundRect(-210, -230, 420, 120, [30, 30, 0, 0]); ctx.fill(); ctx.lineWidth = 8; ctx.strokeStyle = '#0a0a0a'; ctx.beginPath(); ctx.roundRect(-210, -230, 420, 460, 30); ctx.stroke(); ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = '900 76px Montserrat'; ctx.fillText(m, 0, -168); ctx.fillStyle = '#10141c'; ctx.font = '900 230px Montserrat'; ctx.fillText(d, 0, 20); ctx.font = '800 80px Montserrat'; ctx.fillText(yr, 0, 165); ctx.restore(); }
function altBar(t, a, b) { const k = seg(t, a, b), vis = seg(t, a - .1, a + .2); if (vis <= 0) return; ctx.save(); ctx.globalAlpha = vis; const x = 960, y0 = 420, h = 560; ctx.fillStyle = 'rgba(8,10,14,.82)'; ctx.beginPath(); ctx.roundRect(x - 44, y0 - 70, 88, h + 140, 30); ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = '#ff5a4a'; ctx.stroke(); ctx.fillStyle = '#fff'; ctx.fillRect(x - 5, y0, 10, h); const yy = y0 + h * (.05 + .88 * eo(k)); ctx.fillStyle = '#ff5a4a'; ctx.beginPath(); ctx.moveTo(x - 30, yy - 24); ctx.lineTo(x + 30, yy - 24); ctx.lineTo(x, yy + 26); ctx.closePath(); ctx.fill(); ctx.fillStyle = '#ffd23f'; ctx.font = '800 26px Montserrat'; ctx.textAlign = 'center'; ctx.fillText('ALT', x, y0 - 36); ctx.restore(); }

// ---------- extra overlays ----------
function qmark(t, t0, y = 820, size = 420, hold = 1e9) { const k = ob(seg(t, t0, t0 + .25)) * (1 - seg(t, t0 + hold, t0 + hold + .15)); if (k <= .01) return; ctx.save(); ctx.translate(OW / 2, y); ctx.rotate(Math.sin(t * 2.2) * .06); ctx.scale(k, k); ctx.font = `900 ${size}px Montserrat`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round'; ctx.shadowColor = 'rgba(0,0,0,.55)'; ctx.shadowBlur = 18; ctx.shadowOffsetY = 10; ctx.lineWidth = size * .1; ctx.strokeStyle = '#0a0a0a'; ctx.strokeText('?', 0, 0); ctx.shadowColor = 'transparent'; ctx.fillStyle = '#ffd23f'; ctx.fillText('?', 0, 0); ctx.restore(); }
function redX(t, t0, x, y, s = 240) { const k = seg(t, t0, t0 + .22); if (k <= 0) return; ctx.save(); ctx.translate(x, y); ctx.lineCap = 'round'; ctx.shadowColor = 'rgba(0,0,0,.5)'; ctx.shadowBlur = 14; ctx.shadowOffsetY = 8; for (const [pass, w, col] of [[0, s * .17, '#0a0a0a'], [1, s * .11, '#ff2a2a']]) { ctx.lineWidth = w; ctx.strokeStyle = col; ctx.beginPath(); const a = Math.min(1, k * 2); ctx.moveTo(-s / 2, -s / 2); ctx.lineTo(-s / 2 + s * a, -s / 2 + s * a); if (k > .5) { const b = (k - .5) * 2; ctx.moveTo(s / 2, -s / 2); ctx.lineTo(s / 2 - s * b, -s / 2 + s * b); } ctx.stroke(); } ctx.restore(); }
const pchip = (t, t0, p, txt, col, size = 30, dy = -70, dx = 0) => { const [x, y, z] = proj(p); if (z < 1 && y > 150 && y < 1250) chipAt(t, t0, Math.max(150, Math.min(OW - 150, x + dx)), y + dy, txt, col, undefined, size); };
const lead = (x0, y0, z0, psi0, om, v, t0) => u => { const s = u - t0, R = v / om; return [x0 + R * (Math.cos(psi0) - Math.cos(psi0 + om * s)), y0 + 1.2 * Math.sin(s * 1.3), z0 + R * (Math.sin(psi0 + om * s) - Math.sin(psi0))]; };
const takeoff = (t0, x0, z, v0 = 45, a = 9, vr = 78) => { const tr = (vr - v0) / a; const xr = x0 + v0 * tr + .5 * a * tr * tr; return t => { const s = t - t0; if (s <= 0) return [x0, 1.45, z]; if (s <= tr) return [x0 + v0 * s + .5 * a * s * s, 1.45, z]; const s2 = s - tr; return [xr + vr * s2 + .5 * a * 1.2 * s2 * s2, 1.45 + 2.6 * s2 * s2, z]; }; };

// ---------- shots ----------
let SHOTS = []; let EV = {};
function buildShots() {
  const sh = (set, a, b, o) => SHOTS.push({ set, a, b, ...o });
  const E = EV; const END = TL.duration; const X = LX;
  const MP = (lon, lat, y = 0) => SETS.map.P(lon, lat, y);
  const onAx = (cf, t, f, y = 0) => { const c = cf(t); return [c.p[0] + (c.l[0] - c.p[0]) * f, y, c.p[2] + (c.l[2] - c.p[2]) * f]; };
  const orbit = (t, t0, r, y, a0, rate, c = [0, 0, -2]) => { const a = a0 + (t - t0) * rate; return { p: [c[0] + r * Math.sin(a), y, c[2] + r * Math.cos(a)], l: [c[0], 0, c[2]] }; };
  const cuts = [0, W('Wrong') - .06, W('Saudi') - .06, W('holiest') - .08, W('Israel') - .06, W('strongest') - .1, W('Iran') - .06, W('proxies') - .1, W('Turkey') - .06, W('an') - .12, W('And', 2) - .06, 20.5, W('allies') - .12, W("Here's", 2) - .1, W('Not') - .1, W('Money') - .1, W('weapons') + .6, W('all') - .1, W('Nobody') - .1, W('Everyone') - .04, W('So') - .1, W('rules', 2) + .28, W('Nobody', 2) - .06, W('never') - .38, W('Follow') - .08, END];
  E.cuts = cuts.slice(1, -1);
  // 1 hook: map dive
  const c1 = cuts[1];
  sh('map', 0, c1, { fov: 46, bloom: .25, punch: [W('East'), .06], cam: t => ({ p: mix([0, 105, 84], [0, 70, 54], ease(t / c1)), l: [0, 0, -6] }), over: t => { stamp(t, W('Who') + .02, [{ t: 'WHO RULES', size: 150 }, { t: 'THE MIDDLE EAST?', size: 78, c: '#ffffff' }], 470, '#ffd23f', -.04, 150); } });
  // 2 wrong question
  const c2 = cuts[2];
  sh('map', c1, c2, { fov: 46, bloom: .3, shake: .002, punch: [W('Wrong'), .08], cam: t => ({ p: mix([-10, 64, 52], [6, 58, 44], ease(seg(t, c1, c2))), l: [0, 0, -8] }),
    over: t => { qmark(t, c1 - .02, 760, 440); redX(t, W('Wrong') + .2, OW / 2, 760, 330); stamp(t, W('Wrong') - .02, [{ t: 'WRONG', c: '#ff5a4a', size: 170 }, { t: 'QUESTION', c: '#ffffff', size: 90 }], 450, '#ff5a4a', -.05, 170); chipAt(t, W("Here's") - .02, OW / 2, 1030, "HERE'S WHY", '#ffd23f'); } });
  // 3 Saudi oil + cash
  const c3 = cuts[3], tCash = W('cash') - .18;
  const cam3 = t => { const k = ease(seg(t, c2, c3)); return { p: [mix([-14], [6], k)[0], mix([3.4], [4.4], k)[0], mix([13], [9], k)[0]], l: [mix([-4], [4], k)[0], mix([5], [13], ease(seg(t, tCash - .3, tCash + .4)))[0], -30] }; };
  sh('land', c2, c3, { fov: 54, bloom: .3, punch: [tCash, .05], cam: cam3,
    fx: (S, t) => { S.tk.forEach((k, i) => { k.g.visible = true; const d = 16 * (t - c2); k.drive(-30 + d - i * 24, 0, -9, d); }); S.coinsAt(t, tCash, 4, -17, 28); }, chars: t => ({ d0: { p: onAx(cam3, t, .14), s: { flagKind: 'sa', expr: 'smile' } } }),
    over: t => { chipAt(t, W('Saudi') - .05, OW / 2, 470, 'SAUDI ARABIA', '#2eaa56', 'rgba(255,255,255,.92)'); chipAt(t, W('oil') - .1, OW / 2, 600, 'OIL', '#ffd23f'); stamp(t, tCash + .05, [{ t: 'CASH', size: 190, c: '#ffd23f' }], 470, '#ffd23f', -.05, 190, 1.0); } });
  // 4 holiest sites
  const c4 = cuts[4];
  sh('land', c3, c4, { fov: 58, bloom: .35, cam: t => { const k = ease(seg(t, c3, c4)); return { p: [X.mq + mix([-16], [-2], k)[0], mix([7], [15], k)[0], mix([36], [16], k)[0]], l: [X.mq, 24, -50] }; },
    over: t => { chipAt(t, W('holiest') - .05, OW / 2, 470, 'HOLIEST SITES IN ISLAM', '#ffffff', undefined, 36); chipAt(t, W('sites') + .1, OW / 2, 590, 'MECCA & MEDINA', '#ffd23f'); } });
  // 5 Israel intelligence
  const c5 = cuts[5];
  const cam5 = t => { const k = ease(seg(t, c4, c5)); return { p: [X.il + mix([8], [16], k)[0], mix([6], [11], k)[0], mix([16], [4], k)[0]], l: [X.il + 26, 12, -50] }; };
  sh('land', c4, c5, { fov: 52, bloom: .3, cam: cam5,
    chars: t => ({ d1: { p: onAx(cam5, t, .16), s: { flagKind: 'il', expr: 'smile' } } }),
    over: t => { chipAt(t, W('Israel') - .02, OW / 2, 470, 'ISRAEL', '#3c82f0', 'rgba(255,255,255,.92)'); chipAt(t, W('sharpest') - .05, OW / 2, 590, 'SHARPEST INTELLIGENCE', '#ffffff', undefined, 34); } });
  // 6 Israel military: jets
  const c6 = cuts[6]; const ld = lead(X.il - 70, 30, -60, 1.3, -.07, 100, c5);
  const wg = (dx, dz) => u => { const p = ld(u), s = u - c5, ps = 1.3 - .07 * s; return [p[0] + dx * Math.cos(ps) + dz * Math.sin(ps), p[1] + 1, p[2] - dx * Math.sin(ps) + dz * Math.cos(ps)]; };
  sh('land', c5, c6, { fov: 54, bloom: .3, punch: [W('strongest'), .05], cam: t => { const p = ld(t); return { p: [p[0] + 9, p[1] - 3, p[2] + 48], l: [p[0] - 2, p[1] + 1, p[2]] }; },
    fx: (S, t) => { S.jets[0].show(true); S.jets[0].fly(t, ld); S.jets[1].show(true); S.jets[1].fly(t, wg(-11, 15)); S.jets[2].show(true); S.jets[2].fly(t, wg(11, 15)); },
    over: t => { chipAt(t, W('strongest') + .05, OW / 2, 470, 'MILITARY MIGHT', '#ffd23f'); } });
  // 7 Iran on the map
  const c7 = cuts[7];
  sh('map', c6, c7, { fov: 46, bloom: .3, punch: [W('Iran'), .06], cam: t => { const k = ease(seg(t, c6, c7)); const a = MP(...CITY.ir); return { p: [mix([22], [a.x + 3], k)[0], mix([66], [38], k)[0], mix([26], [a.z + 18], k)[0]], l: [mix([6], [a.x - 1], k)[0], 0, mix([-10], [a.z + 2], k)[0]] }; },
    fx: (S, t) => { S.ov('ir', seg(t, W('Iran') - .1, W('Iran') + .45)); S.flag('ir', t, W('Iran') + .1); },
    over: t => { chipAt(t, W('Iran') - .02, OW / 2, 470, 'IRAN', '#e24632', 'rgba(255,255,255,.92)'); stamp(t, W('front') - .05, [{ t: 'NO', size: 90, c: '#ffffff' }, { t: 'FRONT LINE', size: 100, c: '#ffd23f' }], 640, '#ffd23f', -.04, 100); redX(t, W('line') + .0, OW / 2, 650, 300); } });
  // 8 proxies
  const c8 = cuts[8]; const px = W('proxies');
  sh('map', c7, c8, { fov: 46, bloom: .3, cam: t => ({ p: mix([-2, 80, 52], [6, 64, 38], ease(seg(t, c7, c8))), l: [0, 0, -4] }),
    fx: (S, t) => { S.ov('ir', 1); S.flag('ir', t, -1); S.fl.ir.g.visible = true; S.fl.ir.at(S.flagPos.ir.x, 0, S.flagPos.ir.z); S.fl.ir.wave(t, .5); ['lb', 'iq', 'ye', 'gz'].forEach((k, i) => S.px[k].set(t, px - .1 + i * .13, 6)); S.tubes.px.forEach((tb, i) => tb.set(eo(seg(t, px - .1 + i * .13, px + .55 + i * .1)), t)); },
    over: t => { [['lb', 'LEBANON'], ['iq', 'IRAQ'], ['ye', 'YEMEN'], ['gz', 'GAZA']].forEach(([k, n], i) => pchip(t, px + .3 + i * .13, SETS.map.P(...PROXY[k], 2.5), n, '#ff6a5a', 30, -55)); chipAt(t, px + .0, OW / 2, 470, 'IRAN-BACKED GROUPS', '#ff6a5a', undefined, 36); } });
  // 9 Turkey army
  const c9 = cuts[9];
  sh('land', c8, c9, { fov: 52, bloom: .3, punch: [W('massive'), .05], cam: t => { const k = seg(t, c8, c9); return { p: [X.tr, 2.8, mix([15], [11], k)[0]], l: [X.tr, 3.2, -30] }; },
    fx: (S, t) => { S.tanksTR.forEach((k, i) => { k.g.visible = i < 3; const d = 9 * (t - c8); k.drive(X.tr + (i % 2 ? 6.5 : -6.5), 0, -58 + d - i * 16, d, -Math.PI / 2); }); }, chars: t => { const r = {}; for (let i = 0; i < 12; i++) { const row = Math.floor(i / 4), col = i % 4; r['s' + i] = { p: [X.tr + (col - 1.5) * 2.6 + (row % 2) * .6, 0, 2 - row * 4.2 + 1.4 * (t - c8)], s: { walk: true, arms: 'rifle', expr: 'neutral' } }; } return r; },
    over: t => { chipAt(t, W('Turkey') - .02, OW / 2, 470, 'TURKEY', '#f5a519', 'rgba(255,255,255,.92)'); chipAt(t, W('massive') - .05, OW / 2, 590, 'MASSIVE ARMY', '#ffffff'); } });
  // 10 empire's ambition: Ottoman-era lands glow
  const c10 = cuts[10];
  sh('map', c9, c10, { fov: 46, bloom: .3, cam: t => ({ p: mix([-10, 82, 30], [-6, 70, 12], ease(seg(t, c9, c10))), l: [-8, 0, -10] }),
    fx: (S, t) => { S.ov('tr', seg(t, c9, c9 + .4)); S.flag('tr', t, c9 + .1); S.ov('ott', seg(t, W("empire's") - .1, W("empire's") + .6), .8); },
    over: t => { chipAt(t, W("empire's") - .05, OW / 2, 470, "EMPIRE'S AMBITION", '#ffc428', undefined, 38); chipAt(t, W('ambition') + .1, OW / 2, 570, 'OTTOMAN-ERA LANDS (APPROX.)', '#ffffff', undefined, 26); } });
  // 11 US carrier group
  const c11 = cuts[11]; const cvx = t => -30 + 8 * (t - c10);
  sh('sea', c10, c11, { fov: 52, bloom: .25, cam: t => ({ p: [cvx(t) - 20, 34, 150], l: [cvx(t) + 40, 14, -44] }),
    fx: (S, t) => { S.cv.g.visible = true; S.cv.place(cvx(t) + 40, -44, 0, t, 8); const d = S.dd[0]; d.g.visible = true; d.place(cvx(t) - 20, 4, 0, t, 8); S.fl.us.g.visible = false; },
    over: t => { chipAt(t, W('United') - .05, OW / 2, 470, 'UNITED STATES', '#ffffff', 'rgba(31,58,138,.92)'); } });
  // 12 US bases
  const c12 = cuts[12]; const j12 = takeoff(c11 - .6, -150, 0, 48, 10);
  sh('base', c11, c12, { fov: 52, bloom: .25, cam: t => { const p = j12(t); return { p: [p[0] + 16, 3.6, 30], l: [p[0] + 2, 3.6, 0] }; },
    fx: (S, t) => { S.fl.us.g.visible = true; for (let i = 0; i < 5; i++) S.jets[i].show(true), S.jets[i].park(-60 + i * 22, -52 - (i % 2) * 12); const j = S.jets[9]; j.show(true); j.fly(t, j12, .95); },
    over: t => { chipAt(t, W('bases') - .05, OW / 2, 470, 'US BASES', '#ffffff', 'rgba(31,58,138,.92)'); } });
  // 13 bases on the map + allies
  const c13 = cuts[13]; const bk = Object.keys(BASES);
  sh('map', c12, c13, { fov: 46, bloom: .3, cam: t => ({ p: mix([8, 84, 48], [0, 62, 34], ease(seg(t, c12, c13))), l: [6, 0, -3] }),
    fx: (S, t) => { S.ov('sa', 1, .5); S.ov('il', 1, .5); S.ov('tr', 1, .5); bk.forEach((k, i) => S.bs[k].set(t, c12 + .05 + i * .15, 7)); S.tubes.us.forEach((tb, i) => tb.set(eo(seg(t, W('allies') + i * .15, W('allies') + .7 + i * .15)), t)); },
    over: t => { pchip(t, c12 + .5, SETS.map.P(...BASES.udeid, 3), 'AL UDEID', '#9ec0ff', 26, -62, 55); pchip(t, c12 + .8, SETS.map.P(...BASES.incirlik, 3), 'INCIRLIK', '#9ec0ff', 26, -62); pchip(t, c12 + 1.1, SETS.map.P(...BASES.djibouti, 3), 'DJIBOUTI', '#9ec0ff', 26, -62); chipAt(t, W('allies') + .0, OW / 2, 470, 'ALLIES ON EVERY SIDE', '#ffffff', undefined, 36); chipAt(t, W('Always') - .02, OW / 2, 590, 'ALWAYS IN THE ROOM', '#ffd23f', undefined, 34); } });
  // 14 the twist
  const c14 = cuts[14];
  sh('map', c13, c14, { fov: 46, bloom: .35, shake: .003, punch: [W('twist'), .08], cam: t => orbit(t, c13, 66, 56, .1, .9, [2, 0, -4]),
    fx: (S, t) => { for (const k of ['sa', 'il', 'ir', 'tr']) { S.ov(k, 1, .75); S.flag(k, t, -1); S.fl[k].g.visible = true; const p = S.flagPos[k]; S.fl[k].at(p.x, 0, p.z); S.fl[k].wave(t, .5); } },
    over: t => { stamp(t, W("Here's", 2) - .02, [{ t: "HERE'S THE", size: 90, c: '#ffffff' }, { t: 'TWIST', size: 230, c: '#ffd23f' }], 520, '#ffd23f', -.05, 200); } });
  // 15 not one holds the whole map
  const c15 = cuts[15];
  sh('map', c14, c15, { fov: 42, bloom: .3, cam: t => ({ p: mix([0, 108, 14], [0, 98, 8], ease(seg(t, c14, c15))), l: [0, 0, -6] }),
    fx: (S, t) => { const o = [['sa', 'ir', 'il', 'tr']]; ['sa', 'il', 'ir', 'tr'].forEach((k, i) => S.ov(k, seg(t, W('Not') - .1 + i * .2, W('Not') + .3 + i * .2), .85)); },
    over: t => { stamp(t, W('Not') - .02, [{ t: 'NOT ONE', size: 130, c: '#ffffff' }, { t: 'HOLDS THE WHOLE MAP', size: 62, c: '#ffd23f' }], 440, '#ffd23f', -.04, 130); qmark(t, W('whole') - .05, 1000, 240, 1.6); } });
  // 16-18 clash on the table
  const c16 = cuts[16], c17 = cuts[17], c18 = cuts[18]; const tPop = [W('Money') - .05, W('weapons') - .05, W('faith') - .05, W('alliances') - .05]; const tHit = W('crashing') + .42; E.tHit = tHit;
  const clashFx = (S, t) => { S.clash(t, tPop, tHit); S.pc.forEach(p => p.m.visible = true); };
  const icoChip = (t, i, txt, col) => { const C = [[-17, -17], [17, -17], [-17, 17], [17, 17]][i]; pchip(t, tPop[i] + .1, [C[0], 14, C[1]], txt, col, 34, -40); };
  sh('table', c15, c16, { fov: 48, bloom: .3, cam: t => ({ p: mix([0, 66, 70], [-6, 58, 62], ease(seg(t, c15, c16))), l: [0, 2, 2] }), fx: clashFx,
    over: t => { icoChip(t, 0, 'MONEY', '#ffd23f'); icoChip(t, 1, 'WEAPONS', '#ff6a5a'); } });
  sh('table', c16, c17, { fov: 48, bloom: .3, cam: t => orbit(t, c16, 76, 50, -.15, .5, [0, 0, 0]), fx: clashFx,
    over: t => { icoChip(t, 0, 'MONEY', '#ffd23f'); icoChip(t, 1, 'WEAPONS', '#ff6a5a'); icoChip(t, 2, 'FAITH', '#ffffff'); icoChip(t, 3, 'ALLIANCES', '#6ab4ff'); } });
  sh('table', c17, c18, { fov: 50, bloom: .4, shake: .004, punch: [tHit, .1], cam: t => ({ p: mix([0, 48, 66], [0, 32, 52], ease(seg(t, c17, tHit))), l: [0, 4, 0] }), fx: clashFx,
    over: t => { stamp(t, W('crashing') - .05, [{ t: 'ALL CRASHING', size: 110, c: '#ffd23f' }], 470, '#ffd23f', -.05, 110, 1.6); } });
  // 19 board
  const c19 = cuts[19];
  sh('table', c18, c19, { fov: 50, bloom: .3, cam: t => ({ p: mix([-34, 14, 52], [30, 20, 44], ease(seg(t, c18, c19))), l: [0, 3, 0] }), fx: (S, t) => { S.pc.forEach(p => p.m.visible = true); S.king.visible = true; },
    over: t => { chipAt(t, W('Nobody') - .05, OW / 2, 470, 'NOBODY OWNS THE BOARD', '#ffffff', undefined, 36); } });
  // 20 everyone is playing for it
  const c20 = cuts[20]; const PPOS = [[-25, -44], [-12.5, -48], [0, -52], [12.5, -48], [25, -44]];
  sh('table', c19, c20, { fov: 52, bloom: .3, cam: t => ({ p: mix([0, 30, 76], [0, 26, 66], ease(seg(t, c19, c20))), l: [0, 10, -26] }),
    fx: (S, t) => { S.pc.forEach((p, i) => { p.m.visible = true; S.slide(p, t, c19 + .15 + i * .06, p.x0 * .3, p.z0 * .3, .3); }); },
    chars: t => { const r = {}; PPOS.forEach(([x, z], i) => r['p' + i] = { p: [x, 0, z], s: { flagKind: ['sa', 'il', 'ir', 'tr', 'us'][i], arms: Math.sin(t * 4 + i) > .6 ? 'cheer' : 'flag', expr: 'angry' } }); return r; },
    over: t => { chipAt(t, W('Everyone') + .0, OW / 2, 470, 'EVERYONE PLAYS', '#ffd23f'); } });
  // 21-22 who really rules?
  const c21 = cuts[21], c22 = cuts[22], tDrop = W('Nobody', 2); E.tDrop = tDrop; const hit = tDrop + Math.sqrt(2 * 10 / G); E.hit = hit;
  const crown = (S, t) => { S.crownAt(t, tDrop, S.P(44, 25.5)); };
  sh('map', c20, c21, { fov: 50, bloom: .4, cam: t => ({ p: mix([0, 15, 48], [0, 17, 36], ease(seg(t, c20, c21))), l: [0, 9, 0] }), fx: crown, over: t => { qmark(t, c20 + .05, 560, 400); } });
  sh('map', c21, c22, { fov: 50, bloom: .4, cam: t => ({ p: mix([10, 14, 32], [5, 13, 24], ease(seg(t, c21, c22))), l: [0, 9.5, 0] }), fx: crown, over: t => { qmark(t, c21, 560, 400); } });
  const c23 = cuts[23];
  // 23 nobody: crown drops
  sh('map', c22, c23, { fov: 50, bloom: .35, shake: .002, punch: [hit, .09], cam: t => ({ p: mix([14, 16, 26], [8, 10, 20], ease(seg(t, c22, c23))), l: [1, 4, 0] }), fx: (S, t) => { crown(S, t); for (const k of ['sa', 'il', 'ir', 'tr']) S.ov(k, 1, .5); },
    over: t => { stamp(t, tDrop - .02, [{ t: 'NOBODY.', size: 200, c: '#ffd23f' }], 470, '#ffd23f', -.05, 200, 1.9); } });
  // 24 never stops
  const c24 = cuts[24];
  sh('map', c23, c24, { fov: 46, bloom: .3, cam: t => orbit(t, c23, 64, 52, .5, 1.0, [0, 0, -2]), fx: (S, t) => { crown(S, t); ['sa', 'il', 'ir', 'tr'].forEach((k, i) => { const ph = (t * .9 + i * .25) % 1; S.ov(k, 1, .25 + .6 * Math.max(0, Math.sin(ph * Math.PI))); }); S.tubes.px.forEach(tb => tb.set(1, t)); S.tubes.us.forEach(tb => tb.set(1, t)); },
    over: t => { stamp(t, W('never') - .06, [{ t: 'NEVER', size: 170, c: '#ffffff' }, { t: 'STOPS', size: 170, c: '#ffd23f' }], 480, '#ffd23f', -.05, 170, 1.4); } });
  // 25 end card on the map
  sh('map', c24, END, { fov: 46, bloom: .45, logo: true, cam: t => { const k = ease(seg(t, c24, END)); return { p: mix([0, 76, 58], [0, 100, 74], k), l: [0, 0, -4] }; }, fx: (S, t) => { crown(S, t); ['sa', 'il', 'ir', 'tr'].forEach(k => S.ov(k, 1, .6)); } });
  E.flashes = [W('Wrong'), W('Saudi'), tCash, W('Israel'), W('strongest'), W('Iran'), W('proxies') , W('Turkey'), W("empire's"), W('United'), W('bases'), W("Here's", 2), W('Not'), tHit, W('Nobody'), hit, W('never')];
}

// ---------- captions ----------
let GROUPS = [];
const EMPH = new Set(['wrong', 'question', 'saudi', 'oil', 'cash', 'holiest', 'israel', 'intelligence', 'army', 'iran', 'proxies', 'everywhere', 'turkey', 'massive', 'empires', 'ambition', 'bases', 'allies', 'twist', 'map', 'money', 'weapons', 'faith', 'alliances', 'crashing', 'nobody', 'board', 'playing', 'rules', 'never', 'stops', 'follow', 'headlines', 'sharpest', 'strongest']);
function buildCaptions() {
  const ws = WORDS; let i = 0;
  while (i < ws.length) {
    const g = [ws[i]]; const w0 = ws[i].w;
    if (i + 1 < ws.length && !/[.,?!:]$/.test(w0) && ws[i + 1].a - ws[i].a < .55 && (w0.length + ws[i + 1].w.length) <= 14) { const em = EMPH.has(norm(w0)); const em2 = EMPH.has(norm(ws[i + 1].w)); if (!(em && em2)) g.push(ws[i + 1]); }
    GROUPS.push({ txt: g.map(x => x.w).join(' ').replace(/[,.]$/, '').replace(/[?!]$/, m => m), a: g[0].a, last: g[g.length - 1], em: g.some(x => EMPH.has(norm(x.w))) });
    i += g.length;
  }
  GROUPS.forEach((g, k) => { const n = GROUPS[k + 1]; g.b = n ? Math.min(n.a, g.last.b + .25) : g.last.b + .4; });
}
function drawCaption(t) {
  const g = GROUPS.find(g => t >= g.a && t < g.b); if (!g) return;
  const k = lin((t - g.a) / .08); const big = g.em; const sc = 1 + (big ? .25 : .08) * (1 - k);
  ctx.save(); ctx.translate(OW / 2, 1344); ctx.scale(sc, sc);
  let fs = big ? 96 : 80; ctx.font = `800 ${fs}px Montserrat`; while (ctx.measureText(g.txt).width > 940 && fs > 40) { fs -= 4; ctx.font = `800 ${fs}px Montserrat`; }
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';
  ctx.shadowColor = 'rgba(0,0,0,.7)'; ctx.shadowBlur = 10; ctx.shadowOffsetX = 4; ctx.shadowOffsetY = 6; ctx.lineWidth = 11; ctx.strokeStyle = '#0a0a0a'; ctx.strokeText(g.txt, 0, 0);
  ctx.shadowColor = 'transparent'; ctx.fillStyle = big ? '#ffd23f' : '#ffffff'; ctx.fillText(g.txt, 0, 0); ctx.restore();
}
const noise = document.createElement('canvas'); noise.width = noise.height = 256;
{ const n = noise.getContext('2d'), d = n.createImageData(256, 256); for (let i = 0; i < d.data.length; i += 4) { const v = Math.random() * 255; d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 255; } n.putImageData(d, 0, 0); }

// ---------- logo end card ----------
function drawLogo(t) {
  const a0 = W('Follow') - .02; if (t < a0 - .2) return;
  const aR = W('Redrawn') - .1;
  const fade = 1 - seg(t, TL.duration - .5, TL.duration - .05);
  ctx.save(); ctx.globalAlpha = fade;
  ctx.fillStyle = `rgba(10,20,40,${.5 * eo(seg(t, a0 - .1, a0 + .35))})`; ctx.fillRect(0, 0, OW, OH);
  const cx = OW / 2, cy = 700; const k = ob(seg(t, aR, aR + .5)); const R = 340 * k;
  if (R > 1) {
    const gr = ctx.createRadialGradient(cx, cy, R * .9, cx, cy, R * 1.4); gr.addColorStop(0, 'rgba(255,200,100,.6)'); gr.addColorStop(1, 'rgba(255,140,60,0)'); ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(cx, cy, R * 1.4, 0, 7); ctx.fill();
    ctx.save(); ctx.translate(cx, cy); ctx.rotate((1 - k) * -.6 + Math.sin(t * .8) * .01); ctx.beginPath(); ctx.arc(0, 0, R, 0, 7); ctx.clip(); ctx.drawImage(LOGO, -R * 1.035, -R * 1.035, R * 2.07, R * 2.07);
    const sx = (seg(t, aR + .5, aR + 1.4) * 2 - 1) * R * 1.6; const sw = ctx.createLinearGradient(sx - 120, -R, sx + 120, R); sw.addColorStop(0, 'rgba(255,255,255,0)'); sw.addColorStop(.5, 'rgba(255,245,220,.45)'); sw.addColorStop(1, 'rgba(255,255,255,0)'); ctx.globalCompositeOperation = 'screen'; ctx.fillStyle = sw; ctx.fillRect(-R, -R, 2 * R, 2 * R); ctx.restore();
    ctx.lineWidth = 10; ctx.strokeStyle = '#ffffff'; ctx.beginPath(); ctx.arc(cx, cy, R, 0, 7); ctx.stroke();
  }
  const fl = 1 - seg(t, aR, aR + .25); if (t >= aR && fl > 0) { ctx.fillStyle = `rgba(255,240,210,${fl * .7})`; ctx.fillRect(0, 0, OW, OH); }
  const hk = eo(seg(t, W('Stories') - .35, W('Stories') + .1));
  if (hk > 0) { ctx.globalAlpha = fade * hk; ctx.font = '800 66px Montserrat'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round'; ctx.lineWidth = 9; ctx.strokeStyle = '#000'; const yy = 1130 + (1 - hk) * 30; ctx.strokeText('@redrawn.stories', cx, yy); ctx.fillStyle = '#ffffff'; ctx.fillText('@redrawn.stories', cx, yy); }
  const f0 = W('Stories') - .1, press = W('headlines') + .15; EV.fpress = press; const bk = ob(seg(t, f0, f0 + .4));
  if (bk > 0) {
    const pressed = t > press; const pk = 1 - .1 * Math.sin(Math.PI * seg(t, press - .08, press + .2)); const bw = 440 * bk * pk, bh = 124 * bk * pk; ctx.globalAlpha = fade; const by = 1500;
    ctx.fillStyle = pressed ? '#3a3f48' : '#0095f6'; ctx.beginPath(); ctx.roundRect(cx - bw / 2, by - bh / 2, bw, bh, 28); ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = 'rgba(0,0,0,.55)'; ctx.stroke();
    ctx.fillStyle = '#fff'; ctx.font = `800 ${Math.round(60 * bk * pk)}px Montserrat`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(pressed ? 'Following ✓' : 'Follow', cx, by + 3);
    const hin = eo(seg(t, press - .9, press - .15)) * (1 - eo(seg(t, press + .35, press + .9))); if (hin > 0) { const tap = Math.sin(Math.PI * seg(t, press - .12, press + .12)); const hx = cx + 90 + (1 - hin) * 260, hy = by + 70 + (1 - hin) * 260 - tap * -14; ctx.save(); ctx.translate(hx, hy); ctx.rotate(-.35); ctx.fillStyle = '#f6d7b0'; ctx.strokeStyle = '#2a1a12'; ctx.lineWidth = 8; ctx.lineJoin = 'round'; ctx.beginPath(); ctx.roundRect(-34, -20, 68, 120, 30); ctx.fill(); ctx.stroke(); ctx.beginPath(); ctx.roundRect(-18, -86, 36, 90, 18); ctx.fill(); ctx.stroke(); ctx.restore(); }
    if (t > press - .1 && t < press + .6) { const r = seg(t, press - .1, press + .6); ctx.strokeStyle = `rgba(255,255,255,${1 - r})`; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(cx + 80, by + 8, 30 + r * 90, 0, 7); ctx.stroke(); }
  }
  ctx.restore();
}
let FLASH = [];
function drawFrame(t, noCap) {
  const shot = SHOTS.find(s => t >= s.a && t < s.b) || SHOTS[SHOTS.length - 1]; CUR = shot;
  const S = getSet(shot.set);
  cam.fov = shot.fov || 45;
  const c = shot.cam(t); cam.position.set(...c.p); cam.lookAt(V(c.l));
  if (shot.punch) { const p = seg(t, shot.punch[0], shot.punch[0] + .1) * (1 - seg(t, shot.punch[0] + .1, shot.punch[0] + .55)); cam.fov *= 1 - shot.punch[1] * eo(p); }
  cam.fov *= 1 + .06 * (1 - eo(seg(t, shot.a, shot.a + .2)));
  cam.updateProjectionMatrix(); cam.lookAt(V(c.l));
  if (shot.shake) { cam.position.x += Math.sin(t * 37) * shot.shake * 40 * (shot.set === 'sky' ? 6 : 1); cam.position.y += Math.cos(t * 29) * shot.shake * 40 * (shot.set === 'sky' ? 6 : 1); cam.lookAt(V(c.l)); }
  cam.updateMatrixWorld();
  S.reset && S.reset();
  S.update(t, cam);
  if (shot.fx) shot.fx(S, t);
  const cs = shot.chars ? shot.chars(t) : {};
  for (const [k, ch] of Object.entries(S.chars || {})) { const q = cs[k]; if (!q) { ch.mesh.visible = ch.shadow.visible = false; continue; } ch.set(V(q.p), { ...q.s, t }, cam); }
  rp.scene = S.scene || S; bloom.strength = shot.bloom ?? .3;
  composer.render();
  ctx.globalAlpha = 1; ctx.drawImage(renderer.domElement, 0, 0, OW, OH);
  const vg = ctx.createRadialGradient(OW / 2, OH * .48, OH * .36, OW / 2, OH * .5, OH * .8); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.26)'); ctx.fillStyle = vg; ctx.fillRect(0, 0, OW, OH);
  ctx.save(); ctx.globalAlpha = .05; ctx.globalCompositeOperation = 'overlay'; const ox = Math.floor(hash(Math.floor(t * 30)) * 256), oy = Math.floor(hash(Math.floor(t * 30) + 5) * 256); ctx.translate(-ox, -oy); ctx.fillStyle = ctx.createPattern(noise, 'repeat'); ctx.fillRect(0, 0, OW + 256, OH + 256); ctx.restore();
  if (shot.over && !window.NOOVER) shot.over(t);
  for (const f of FLASH) { const a = 1 - seg(t, f, f + .18); if (t >= f && a > 0) { ctx.fillStyle = `rgba(255,255,255,${a * .5})`; ctx.fillRect(0, 0, OW, OH); } }
  const fin = t < .25 ? 1 - t / .25 : 0; if (fin > 0) { ctx.fillStyle = `rgba(0,0,0,${fin})`; ctx.fillRect(0, 0, OW, OH); }
  if (shot.logo && !window.NOOVER) drawLogo(t);
  if (t < W('Follow') - .02 && !window.NOCAP) drawCaption(t);
}

window.setup = async (tl) => {
  TL = tl; WORDS = tl.words;
  for (const f of ['800 76px Montserrat', '900 76px Montserrat', 'bold 40px Montserrat']) await document.fonts.load(f);
  LOGO = new Image(); LOGO.src = 'logo.png'; await LOGO.decode(); await loadMapM();
  Object.keys(B).forEach(getSet);
  buildShots(); buildCaptions();
  FLASH = EV.flashes;
  EV.pops = [W('Wrong'), W('Saudi'), W('oil'), W('cash'), W('holiest'), W('Israel'), W('Iran'), W('proxies'), W('Turkey'), W('United'), W('twist'), W('Not'), W('Money'), W('weapons'), W('faith'), W('alliances'), EV.tHit, W('Nobody'), W('Nobody', 2), W('never')];
  window.EVT = { ...EV, duration: TL.duration, redrawn: W('Redrawn'), follow: W('Follow'), fpress: EV.fpress };
  return SHOTS.map(s => [s.set, +s.a.toFixed(2), +s.b.toFixed(2)]);
};
window.render = (t) => drawFrame(t); window.SETS = SETS; window.SHOTS = SHOTS;
window.dbg = (setKey, p, l, fov, t = 0, fxs = '', chs = '') => { const shot = { set: setKey, a: -99, b: 99, fov, cam: () => ({ p, l }), fx: fxs ? new Function('S', 't', 'EV', 'THREE', fxs) : null, chars: chs ? new Function('t', 'return (' + chs + ')') : null }; if (shot.fx) { const f = shot.fx; shot.fx = (S, tt) => f(S, tt, EV, THREE); } SHOTS.unshift(shot); drawFrame(t, true); SHOTS.shift(); };
window.hires = (on) => { const w = on ? 1080 : RW, h = on ? 1920 : RH; renderer.setSize(w, h); composer.setSize(w, h); cam.aspect = 9 / 16; cam.updateProjectionMatrix(); };
window.ready = true;
