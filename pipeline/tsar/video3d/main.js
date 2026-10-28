import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { buildSpace, buildArctic, buildSky, loadEarth, ringTheta, ll, NZ, EARTH_R, carryBomb, bombState } from './tsar_a.js';
import { buildHangar, buildVillage, buildMapT, loadArcticMap, haversine } from './tsar_b.js';
import { sm } from './kcommon.js';
import { hash } from './tex.js';

const RW = 720, RH = 1280, OW = 1080, OH = 1920;
const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
renderer.setSize(RW, RH); renderer.setPixelRatio(1); renderer.toneMapping = THREE.NeutralToneMapping; renderer.toneMappingExposure = 1.0;
renderer.domElement.style.display = 'none'; document.body.appendChild(renderer.domElement);
const out = document.getElementById('out'); const ctx = out.getContext('2d');
const cam = new THREE.PerspectiveCamera(45, RW / RH, .2, 22000);
const composer = new EffectComposer(renderer);
const rp = new RenderPass(new THREE.Scene(), cam); composer.addPass(rp);
const bloom = new UnrealBloomPass(new THREE.Vector2(RW, RH), .3, .5, 1.15); composer.addPass(bloom);
composer.addPass(new OutputPass());
const B = { space: buildSpace, arctic: buildArctic, sky: buildSky, hangar: buildHangar, village: buildVillage, map: buildMapT };
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
const fmt = n => Math.round(n).toLocaleString('en-US');

// ---------- overlay helpers ----------
function chip(x, y, txt, col = '#ffd23f', bg = 'rgba(8,10,14,.84)', size = 42) {
  ctx.save(); ctx.font = `800 ${size}px Montserrat`; const w = ctx.measureText(txt).width + size * 1.1, h = size * 1.6;
  ctx.fillStyle = bg; ctx.beginPath(); ctx.roundRect(x - w / 2, y - h / 2, w, h, h / 2); ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = col; ctx.stroke();
  ctx.fillStyle = col; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(txt, x, y + 2); ctx.restore();
}
function chipAt(t, t0, x, y, txt, col, bg, size, t1 = 1e9) { const k = ob(seg(t, t0, t0 + .22)) * (1 - seg(t, t1 - .15, t1)); if (k <= .01) return; ctx.save(); ctx.translate(x, y); ctx.scale(k, k); ctx.translate(-x, -y); chip(x, y, txt, col, bg, size); ctx.restore(); }
function stamp(t, t0, lines, y = 560, col = '#ffd23f', rot = -.06, size = 190, hold = 1e9) {
  const k = ob(seg(t, t0, t0 + .22)) * (1 - seg(t, t0 + hold, t0 + hold + .2)); if (k <= .01) return;
  ctx.save(); ctx.translate(OW / 2, y); ctx.rotate(rot); ctx.scale(k * (1 + .12 * (1 - seg(t, t0, t0 + .5))), k); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';
  lines.forEach((l, i) => { const sz = (typeof l === 'string' ? size : l.size || size); const txt = typeof l === 'string' ? l : l.t; const c = typeof l === 'string' ? col : (l.c || col); ctx.font = `900 ${sz}px Montserrat`; ctx.shadowColor = 'rgba(0,0,0,.6)'; ctx.shadowBlur = 16; ctx.shadowOffsetY = 8; ctx.lineWidth = sz * .12; ctx.strokeStyle = '#0a0a0a'; const yy = i * size * .95 - (lines.length - 1) * size * .475; ctx.strokeText(txt, 0, yy); ctx.shadowColor = 'transparent'; ctx.fillStyle = c; ctx.fillText(txt, 0, yy); });
  ctx.restore();
}
function bigNum(x, y, txt, sub, col = '#fff', sz = 120) { ctx.save(); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round'; ctx.font = `900 ${sz}px Montserrat`; ctx.lineWidth = sz * .13; ctx.strokeStyle = '#0a0a0a'; ctx.strokeText(txt, x, y); ctx.fillStyle = col; ctx.fillText(txt, x, y); if (sub) { ctx.font = '800 44px Montserrat'; ctx.lineWidth = 9; ctx.strokeText(sub, x, y + sz * .7); ctx.fillStyle = '#fff'; ctx.fillText(sub, x, y + sz * .7); } ctx.restore(); }
function crossX(x, y, k, s = 70) { ctx.save(); ctx.lineWidth = 22; ctx.lineCap = 'round'; ctx.strokeStyle = '#ff3b30'; ctx.shadowColor = 'rgba(0,0,0,.6)'; ctx.shadowBlur = 12; ctx.beginPath(); ctx.moveTo(x - s, y - s); ctx.lineTo(x - s + 2 * s * Math.min(1, k * 2), y - s + 2 * s * Math.min(1, k * 2)); ctx.stroke(); if (k > .5) { ctx.beginPath(); ctx.moveTo(x + s, y - s); ctx.lineTo(x + s - 2 * s * Math.min(1, (k - .5) * 2), y - s + 2 * s * Math.min(1, (k - .5) * 2)); ctx.stroke(); } ctx.restore(); }
function calCard(t, t0, t1) {
  const k = ob(seg(t, t0, t0 + .3)) * (1 - seg(t, t1 - .2, t1)); if (k <= .01) return; const cx = OW / 2, cy = 560;
  ctx.save(); ctx.translate(cx, cy); ctx.rotate(-.04); ctx.scale(k * .88, k * .88); ctx.shadowColor = 'rgba(0,0,0,.45)'; ctx.shadowBlur = 30; ctx.shadowOffsetY = 14;
  ctx.fillStyle = '#fffdf6'; ctx.beginPath(); ctx.roundRect(-290, -300, 580, 600, 40); ctx.fill(); ctx.shadowColor = 'transparent'; ctx.fillStyle = '#e8342a'; ctx.beginPath(); ctx.roundRect(-290, -300, 580, 150, [40, 40, 0, 0]); ctx.fill();
  ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = '900 84px Montserrat'; ctx.fillText('OCTOBER', 0, -225); ctx.fillStyle = '#16161c'; ctx.font = '900 270px Montserrat'; ctx.fillText('30', 0, -20); ctx.font = '900 130px Montserrat'; ctx.fillStyle = '#e8342a'; ctx.fillText('1961', 0, 190);
  ctx.strokeStyle = '#2a1a12'; ctx.lineWidth = 8; ctx.beginPath(); ctx.roundRect(-290, -300, 580, 600, 40); ctx.stroke(); ctx.restore();
}
// 100 MT bar -> cut to 50
function barChart(t) {
  const g = eo(seg(t, W('original'), W('100') + .5)); if (g <= 0) return; const cut = ease(seg(t, W('50') - .15, W('50') + .5)); const h0 = 520, base = 1040, cx = OW / 2, bw = 250;
  const hh = h0 * g * (1 - .5 * cut);
  ctx.save(); ctx.fillStyle = 'rgba(8,10,14,.72)'; ctx.beginPath(); ctx.roundRect(cx - 360, base - 640, 720, 700, 36); ctx.fill();
  ctx.fillStyle = '#ffffff'; ctx.fillRect(cx - 300, base, 600, 8);
  const gr = ctx.createLinearGradient(0, base - hh, 0, base); gr.addColorStop(0, cut > .5 ? '#ffd23f' : '#ff5a3a'); gr.addColorStop(1, cut > .5 ? '#ff9a2a' : '#c81e1e'); ctx.fillStyle = gr; ctx.beginPath(); ctx.roundRect(cx - bw / 2, base - hh, bw, hh, 14); ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = '#0a0a0a'; ctx.stroke();
  if (cut > 0 && cut < 1) { ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.setLineDash([16, 12]); ctx.strokeStyle = '#fff'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(cx - 300, base - h0 * g); ctx.lineTo(cx + 300, base - h0 * g); ctx.stroke(); ctx.setLineDash([]); }
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round'; const val = Math.round(100 - 50 * cut); ctx.font = '900 118px Montserrat'; ctx.lineWidth = 16; ctx.strokeStyle = '#0a0a0a'; const ty = base - hh - 70; const txt = `${Math.round(val * g)} MT`; ctx.strokeText(txt, cx, ty); ctx.fillStyle = cut > .5 ? '#ffd23f' : '#ffffff'; ctx.fillText(txt, cx, ty);
  ctx.font = '800 40px Montserrat'; ctx.fillStyle = '#9ad0ff'; ctx.fillText(cut > .5 ? 'WHAT WAS TESTED' : 'ORIGINAL DESIGN', cx, base + 50);
  if (cut > .05 && cut < 1.01) { const sx = cx + 210, sy = base - h0 * g * .75; ctx.font = '120px sans-serif'; ctx.save(); ctx.translate(sx, sy); ctx.rotate(-.5 + cut * 1.0); ctx.fillText('✂', 0, 0); ctx.restore(); }
  ctx.restore();
}
function halfPower(t, t0) { const k = ob(seg(t, t0, t0 + .3)); if (k <= .01) return; ctx.save(); ctx.translate(OW / 2, 520); ctx.scale(k, k); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round'; ctx.font = '900 150px Montserrat'; ctx.lineWidth = 20; ctx.strokeStyle = '#0a0a0a'; ctx.strokeText('50 MT', 0, 0); ctx.fillStyle = '#ffd23f'; ctx.fillText('50 MT', 0, 0); ctx.font = '900 76px Montserrat'; ctx.lineWidth = 14; ctx.strokeText('STILL HUGE', 0, 100); ctx.fillStyle = '#fff'; ctx.fillText('STILL HUGE', 0, 100); ctx.restore(); }
function dotGrid(t, t0, t1) {
  const p = ease(seg(t, t0, t1)); const cols = 66, rows = 51, N = cols * rows, n = Math.round(3333 * p); const gx = 120, gy = 400, gw = 840, gh = 610; const dx = gw / cols, dy = gh / rows;
  ctx.save(); ctx.fillStyle = 'rgba(8,16,40,.78)'; ctx.beginPath(); ctx.roundRect(gx - 40, gy - 150, gw + 80, gh + 290, 36); ctx.fill();
  for (let i = 0; i < N; i++) { const c = i % cols, r = Math.floor(i / cols); const on = i < n; ctx.fillStyle = on ? (i === n - 1 ? '#ffffff' : '#ff8a2a') : 'rgba(255,255,255,.07)'; ctx.beginPath(); ctx.arc(gx + c * dx + dx / 2, gy + r * dy + dy / 2, dx * .36, 0, 7); ctx.fill(); }
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round'; ctx.font = '800 38px Montserrat'; ctx.fillStyle = '#9ad0ff'; ctx.fillText('1 DOT = 1 HIROSHIMA BOMB', OW / 2, gy - 100);
  ctx.font = '900 130px Montserrat'; ctx.lineWidth = 18; ctx.strokeStyle = '#0a0a0a'; const s = `${fmt(n)}×`; ctx.strokeText(s, OW / 2, gy + gh + 95); ctx.fillStyle = '#ffd23f'; ctx.fillText(s, OW / 2, gy + gh + 95); ctx.restore();
}
function areaCompare(t, t0) {
  const k = ob(seg(t, t0, t0 + .35)); if (k <= .01) return; const cx = OW / 2, cy = 640, R = 330 * k; const g = eo(seg(t, t0 + .1, t0 + .7));
  ctx.save(); const gr = ctx.createRadialGradient(cx, cy, 10, cx, cy, R); gr.addColorStop(0, '#ffe08a'); gr.addColorStop(.6, '#ff8a2a'); gr.addColorStop(1, '#d8341a'); ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(cx, cy, R, 0, 7); ctx.fill(); ctx.lineWidth = 9; ctx.strokeStyle = '#0a0a0a'; ctx.stroke();
  ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(cx, cy, 6 * k, 0, 7); ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = '#0a0a0a'; ctx.stroke();
  ctx.globalAlpha = g; ctx.strokeStyle = '#fff'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(cx + 8, cy + 4); ctx.lineTo(cx + 150, cy - 60); ctx.stroke(); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round'; ctx.font = '900 60px Montserrat'; ctx.lineWidth = 12; ctx.strokeStyle = '#0a0a0a'; ctx.strokeText('HIROSHIMA', cx + 150, cy - 125); ctx.fillStyle = '#fff'; ctx.fillText('HIROSHIMA', cx + 150, cy - 125); ctx.font = '900 56px Montserrat'; ctx.strokeText('15 kt', cx + 150, cy - 70); ctx.fillStyle = '#ffd23f'; ctx.fillText('15 kt', cx + 150, cy - 70);
  ctx.font = '900 84px Montserrat'; ctx.lineWidth = 14; ctx.strokeText('50,000 kt', cx, cy + 150); ctx.fillStyle = '#fff'; ctx.fillText('50,000 kt', cx, cy + 150); ctx.font = '800 40px Montserrat'; ctx.lineWidth = 9; ctx.strokeText('(AREA TO SCALE)', cx, cy + 215); ctx.fillText('(AREA TO SCALE)', cx, cy + 215); ctx.restore();
}
function clock(t, t0, t1, x = OW / 2, y = 560, R = 200) {
  const k = ob(seg(t, t0, t0 + .3)) * (1 - seg(t, t1 - .2, t1)); if (k <= .01) return; const m = 27 + 5 * ease(seg(t, t0 + .2, t0 + 1.5));
  ctx.save(); ctx.translate(x, y); ctx.scale(k, k); ctx.shadowColor = 'rgba(0,0,0,.5)'; ctx.shadowBlur = 24; ctx.shadowOffsetY = 10; ctx.fillStyle = '#fffdf6'; ctx.beginPath(); ctx.arc(0, 0, R, 0, 7); ctx.fill(); ctx.shadowColor = 'transparent'; ctx.lineWidth = 14; ctx.strokeStyle = '#d8202a'; ctx.stroke();
  ctx.strokeStyle = '#16161c'; ctx.lineCap = 'round'; for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6; ctx.lineWidth = i % 3 ? 6 : 12; ctx.beginPath(); ctx.moveTo(Math.sin(a) * R * .82, -Math.cos(a) * R * .82); ctx.lineTo(Math.sin(a) * R * .93, -Math.cos(a) * R * .93); ctx.stroke(); }
  const hr = (11 + m / 60) / 12 * Math.PI * 2, mn = m / 60 * Math.PI * 2; ctx.lineWidth = 16; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.sin(hr) * R * .5, -Math.cos(hr) * R * .5); ctx.stroke(); ctx.lineWidth = 10; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.sin(mn) * R * .78, -Math.cos(mn) * R * .78); ctx.stroke(); ctx.fillStyle = '#d8202a'; ctx.beginPath(); ctx.arc(0, 0, 14, 0, 7); ctx.fill();
  ctx.restore(); chipAt(t, t0 + .2, x, y + R + 70, 'MOSCOW TIME  11:32', '#ffd23f', 'rgba(8,10,14,.86)', 44, t1);
}
function altTape(t, a, b, label, from, to) {
  const k = seg(t, a, a + .25) * (1 - seg(t, b - .2, b)); if (k <= .01) return; const x = 150, y0 = 420, y1 = 1080; ctx.save(); ctx.globalAlpha = k; ctx.fillStyle = 'rgba(8,10,14,.78)'; ctx.beginPath(); ctx.roundRect(x - 60, y0 - 40, 120, y1 - y0 + 80, 30); ctx.fill(); ctx.strokeStyle = '#59d0ff'; ctx.lineWidth = 5; ctx.stroke();
  ctx.strokeStyle = '#fff'; ctx.lineWidth = 4; for (let i = 0; i <= 10; i++) { const yy = y0 + (y1 - y0) * i / 10; ctx.beginPath(); ctx.moveTo(x - 30, yy); ctx.lineTo(x - (i % 5 ? 10 : 2), yy); ctx.stroke(); }
  const p = ease(seg(t, a + .1, b - .3)); const yy = y0 + (y1 - y0) * (from + (to - from) * p); ctx.fillStyle = '#ff4a3a'; ctx.beginPath(); ctx.moveTo(x + 4, yy); ctx.lineTo(x + 50, yy - 20); ctx.lineTo(x + 50, yy + 20); ctx.fill(); ctx.restore();
  chipAt(t, a, 540, 470, label, '#59d0ff', 'rgba(8,10,14,.86)', 48, b);
}
function measure(p1, p2, txt, k) { const a = proj(p1), c = proj(p2); if (k <= 0) return; ctx.save(); ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 10; ctx.lineCap = 'round'; ctx.shadowColor = 'rgba(0,0,0,.6)'; ctx.shadowBlur = 10; const mx = a[0] + (c[0] - a[0]) * k, my = a[1] + (c[1] - a[1]) * k; ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(mx, my); ctx.stroke(); for (const q of [a, [mx, my]]) { ctx.beginPath(); ctx.moveTo(q[0], q[1] - 34); ctx.lineTo(q[0], q[1] + 34); ctx.stroke(); } ctx.restore(); if (k > .95) chip((a[0] + c[0]) / 2, (a[1] + c[1]) / 2 - 90, txt, '#ffffff', 'rgba(8,10,14,.86)', 76); }
function frost(t, a, b) { }
function flashWhite(t, f0, amp = .55, dur = .18) { const a = 1 - seg(t, f0, f0 + dur); if (t >= f0 && a > 0) { ctx.fillStyle = `rgba(255,255,255,${a * amp})`; ctx.fillRect(0, 0, OW, OH); } }
function speedChip(t, a, b) { chipAt(t, a, 540, 380, '⏩ TIME-LAPSE ×5', '#ffd23f', 'rgba(8,10,14,.86)', 40, b); }

// ---------- plane path (1u = 1 m): integrated heading/speed so bank = atan(v*yawRate/g) ----------
const T0 = 28.0, V0 = 235; let PC = new Map();
function planeState(t) {
  const key = Math.round(t * 500); if (PC.has(key)) return PC.get(key); let x = 0, y = 0, z = 0, psi = 0, tt = T0; const dt = .02; const tr = W('released');
  while (tt < t - 1e-9) { const h = Math.min(dt, t - tt); const v = V0 + 38 * sm((tt - 31.7) / 2.5); const bank = .5 * sm((tt - 32.3) / 1.4) * (1 - sm((tt - 36.2) / 2.4)); psi += 9.81 * Math.tan(bank) / v * h; x += Math.cos(psi) * v * h; z -= Math.sin(psi) * v * h; y += (tt > tr + .2 ? 7 * sm((tt - tr - .2) / 1.5) : 0) * h; tt += h; }
  const r = [x, y, z, psi]; PC.set(key, r); return r;
}
const planePath = t => { const p = planeState(t); return [p[0], p[1], p[2]]; };
// shock-time-lapse plane: story time s(t); plane y drops 1000 m over 14 story-seconds after the wave arrives
const TA = W0 => 0;
let TLS = {};
function storyS(t) { const ta = TLS.ta; let s = 0; const dt = .02; for (let u = ta; u < t - 1e-9; u += dt) { const r = sm((u - TLS.t4) / .35); s += dt * (1 + 4 * r); } return s; }
const V2 = 270, PL2 = { SS: 4, TD: 12 };
function plane2(t) { const s = storyS(t); const x = V2 * s; const q = lin((s - PL2.SS) / PL2.TD); const dy = -1000 * (1 - Math.cos(Math.PI * q)) / 2; return [x, dy, 0]; }

// ---------- shots ----------
let SHOTS = [], FLASH = [], PUNCH = [];
function buildShots() {
  const sh = (set, a, b, o) => SHOTS.push({ set, a, b, ...o });
  const dur = TL.duration, vend = TL.voEnd;
  const tdet = W('detonated');
  TLS = { ta: W('bomber', 3) - .06, t4: W('shockwave', 2) - .2 }; const tArr = W('still') - .4, tEnd = W('metres') + .0; PL2.SS = storyS(tArr); PL2.TD = storyS(tEnd) - PL2.SS;
  const tauK = [[tdet, 0], [39.9, 1.4], [41.82, 2.6], [43.3, 3.3], [44.5, 4.2], [46.3, 6.0], [48.2, 8.0], [49.9, 9.4]];
  const tau = t => { if (t <= tauK[0][0]) return -1; for (let i = 1; i < tauK.length; i++) if (t <= tauK[i][0]) { const [t0, a] = tauK[i - 1], [t1, b] = tauK[i]; return a + (b - a) * (t - t0) / (t1 - t0); } return 9.4 + (t - 49.9) * .3; };
  const blast = (S, t, o) => { S.blast(tau(t), o); };
  // ===== 1 hook: the mushroom, one explosion =====
  const c1 = W('its') - .06;
  sh('arctic', 0, c1, { fov: 52, bloom: .3, shake: .003, punch: [W('explosion'), .08], cam: t => { const k = ease(t / c1); return { p: [mix([420, 40, 1280], [300, 30, 1130], k)].flat(), l: [-10, 300, 0] }; }, fx: (S, t) => { S.blast(8.2 + t * .25); }, over: t => { } });
  // ===== 2-3 space: shockwave laps =====
  const c3 = W('entire') - .06, c4 = W('october') - .06;
  const s0 = 1.95, s1 = 5.4; const Lw = t => 6 * Math.PI * seg(t, s0, s1);
  const src = ll(NZ[0], NZ[1], 1).normalize(); const perp = new THREE.Vector3().crossVectors(src, new THREE.Vector3(0, 1, 0)).normalize(); const up2 = new THREE.Vector3().crossVectors(perp, src).normalize();
  const orbit = (ang, el, d) => { const v = src.clone().multiplyScalar(Math.cos(ang) * Math.cos(el)).add(perp.clone().multiplyScalar(Math.sin(ang) * Math.cos(el))).add(up2.clone().multiplyScalar(Math.sin(el))); return v.multiplyScalar(d); };
  const spaceFx = (S, t) => { S.wave(ringTheta(Lw(t))); S.pin.material.opacity = .9; S.pin.scale.setScalar(16 + 5 * Math.sin(t * 9)); };
  const lapT = [0, 1, 2, 3].map(i => { let lo = s0, hi = s1; for (let k = 0; k < 24; k++) { const m = (lo + hi) / 2; if (Lw(m) < i * 2 * Math.PI) lo = m; else hi = m; } return hi; });
  const spaceOver = t => { chipAt(t, W('shockwave') + .1, OW / 2, 470, 'SHOCKWAVE', '#ffd23f', undefined, undefined, lapT[1]); for (let i = 1; i <= 3; i++) { if (t >= lapT[i]) stamp(t, lapT[i], [{ t: i + '×', c: i === 3 ? '#ff4a3a' : '#ffd23f' }], 640, i === 3 ? '#ff4a3a' : '#ffd23f', -.05, i === 3 ? 330 : 240, i === 3 ? 1e9 : .55); } };
  sh('space', c1, c3, { fov: 46, bloom: .45, punch: [s0 + .2, .05], cam: t => { const k = ease(seg(t, c1, c3)); return { p: orbit(.45 + k * .5, .35 - k * .15, 335).toArray(), l: [0, 0, 0] }; }, fx: spaceFx, over: spaceOver });
  sh('space', c3, c4, { fov: 46, bloom: .45, cam: t => { const k = ease(seg(t, c3, c4)); return { p: orbit(1.1 + k * .8, .25 + k * .1, 335 - k * 14).toArray(), l: [0, 0, 0] }; }, fx: spaceFx, over: spaceOver });
  // ===== 4 map: Oct 30 1961 =====
  const c5 = W('the', 2) - .05;
  sh('map', c4, c5, { fov: 46, bloom: .3, cam: t => { const k = ease(seg(t, c4, c5)); const P = SETS.map.P(73.4, 54.7); return { p: [mix([P.x - 4, 24, P.z + 22], [P.x - 2.5, 19, P.z + 17], k)].flat(), l: [P.x - 1, 0, P.z - 1.5] }; }, fx: (S, t) => { S.pins.nz.set(t, c4 + .12); S.lab.nz.visible = t > c4 + .5; }, over: t => { calCard(t, W('october') + .02, c5 - .05); } });
  // ===== 5 Arctic Ocean aerial =====
  const c6 = W('soviet') - .03;
  sh('arctic', c5, c6, { fov: 56, bloom: .25, cam: t => { const k = ease(seg(t, c5, c6)); return { p: [mix([-1250, 34, 800], [-900, 24, 450], k)].flat(), l: [mix([-300, 6, 100], [60, 14, 0], k)].flat() }; }, fx: (S, t) => { S.noBlast(); }, over: t => { chipAt(t, W('arctic') - .05, OW / 2, 470, 'ARCTIC OCEAN', '#59d0ff'); } });
  // ===== 6 Soviet Union: flag + engineers =====
  const c7 = W('weapon') + .02;
  sh('hangar', c6, c7, { fov: 50, bloom: .25, cam: t => { const k = ease(seg(t, c6, c7)); return { p: [mix([9.4, 2.6, 9.6], [11.2, 2.9, 8.2], k)].flat(), l: [12.4, 2.6, -7] }; }, chars: t => ({ e1: { p: [10.6, 0, 3.0], s: { face: -.3, arms: 'point', expr: 'smile' } }, off: { p: [13.9, 0, 2.7], s: { face: -.5, arms: 'down', expr: 'smirk' } } }), fx: (S, t) => { S.tarp(0); }, over: t => { chipAt(t, W('soviet') - .02, OW / 2, 470, 'SOVIET UNION', '#ff4a3a'); } });
  // ===== 7 weapon never seen: tarp pulled =====
  const c8 = W('it', 1) - .06; const tp0 = W('never') - .1, tp1 = W('seen') + .35;
  sh('hangar', c7, c8, { fov: 54, bloom: .3, punch: [W('seen'), .06], cam: t => { const k = ease(seg(t, c7, c8)); return { p: [mix([-3, 2.4, 17], [2.5, 3.4, 15], k)].flat(), l: [0, 2.2, 0] }; }, chars: t => ({ e0: { p: [-2.7, 0, 6.6], s: { face: .4, arms: 'point' } }, e3: { p: [2.6, 0, 6.8], s: { face: -.4, arms: 'chin', expr: 'surprised' } } }), fx: (S, t) => { S.tarp(ease(seg(t, tp0, tp1))); }, over: t => { chipAt(t, W('world') - .05, OW / 2, 470, 'NEVER SEEN BEFORE', '#ffd23f'); } });
  // ===== 8 Tsar Bomba =====
  const c9 = W('the', 6) - .06;
  sh('hangar', c8, c9, { fov: 50, bloom: .3, cam: t => { const k = ease(seg(t, c8, c9)); return { p: [mix([8.8, 2.0, 9.6], [-1.5, 2.6, 8.4], k)].flat(), l: [mix([3.2, 1.9, 0], [-.5, 1.9, 0], k)].flat() }; }, chars: t => ({ e1: { p: [-4.6, 0, 4.2], s: { face: .5, arms: 'gesture', expr: 'happy' } } }), fx: (S, t) => { S.tarp(1); }, over: t => { stamp(t, W('tsar') - .02, [{ t: 'TSAR', size: 240 }, { t: 'BOMBA', size: 240 }], 560, '#ffd23f', -.05, 240); } });
  // ===== 9 original design 100 MT =====
  const c10 = W('megatons') + .1;
  sh('hangar', c9, c10, { fov: 52, bloom: .25, cam: t => { const k = ease(seg(t, c9, c10)); return { p: [mix([-10.5, 3.2, 10.6], [-9.2, 3.4, 8.8], k)].flat(), l: [-9, 3.0, -5] }; }, chars: t => ({ e0: { p: [-11.2, 0, -2.6], s: { face: .3, arms: 'point', expr: 'smile' } }, e2: { p: [-6.8, 0, -2.6], s: { face: -.3, arms: 'chin', expr: 'worried' } } }), fx: (S, t) => { S.tarp(1); S.boardDraw('hundred', seg(t, W('100') - .05, W('100') + .3), t); }, over: t => { chipAt(t, W('original') - .02, OW / 2, 470, 'ORIGINAL DESIGN', '#ffd23f'); } });
  // ===== 10 engineers cut it to 50 =====
  const c11 = W('reduce') - .06;
  sh('hangar', c10, c11, { fov: 52, bloom: .25, cam: t => { const k = ease(seg(t, c10, c11)); return { p: [mix([4, 2.4, 11], [1, 2.8, 9], k)].flat(), l: [0, 2.2, 0] }; }, chars: t => ({ e1: { p: [-3.8, 0, 5.2], s: { face: .5, arms: 'point', expr: 'smile' } }, e3: { p: [4.0, 0, 5.4], s: { face: -.4, arms: 'gesture', expr: 'happy' } } }), fx: (S, t) => { S.tarp(1); S.boardDraw('cut', seg(t, W('engineers'), W('50') + .6), t); }, over: t => barChart(t) });
  // ===== 11 radioactive fallout =====
  const c12 = W('even') - .05;
  sh('hangar', c11, c12, { fov: 50, bloom: .35, cam: t => { const k = ease(seg(t, c11, c12)); return { p: [mix([-2, 2.4, 11], [1.5, 3.2, 9.5], k)].flat(), l: [0, 3.6, 0] }; }, chars: t => ({ e2: { p: [-3.6, 0, 5.2], s: { face: .4, arms: 'point', expr: 'worried' } }, e0: { p: [3.8, 0, 5.4], s: { face: -.4, arms: 'down', expr: 'tired' } } }), fx: (S, t) => { S.tarp(1); S.rad.visible = true; S.rad.position.set(0, 5.0 + .2 * Math.sin(t * 5), .5); S.rad.scale.setScalar(1.7 * ob(seg(t, W('radioactive') - .1, W('radioactive') + .2))); }, over: t => { chipAt(t, W('reduce') - .05, OW / 2, 470, 'LESS FALLOUT', '#7dff6a'); const k = seg(t, W('fallout') - .1, W('fallout') + .35); if (k > 0) { const pp = proj(SETS.hangar.rad.position.toArray()); crossX(pp[0], pp[1], k, 110); } } });
  // ===== 12 half power =====
  const c13 = W('3000') - .1;
  sh('hangar', c12, c13, { fov: 50, bloom: .3, cam: t => { const k = ease(seg(t, c12, c13)); const a = -.6 + k * 1.3; return { p: [Math.sin(a) * 15, 2.6, Math.cos(a) * 15], l: [0, 2.0, 0] }; }, chars: t => ({ e1: { p: [-4.4, 0, 5.4], s: { face: .5, arms: 'cheer', expr: 'happy' } }, off: { p: [4.6, 0, 5.6], s: { face: -.6, arms: 'point', expr: 'smirk' } } }), fx: (S, t) => { S.tarp(1); }, over: t => halfPower(t, W('half') - .15) });
  // ===== 13 3000x Hiroshima =====
  const c14 = W('hiroshima') - .05, c15 = W('it', 4) - .06;
  sh('sky', c13, c14, { fov: 50, bloom: .2, bg2d: true, cam: t => ({ p: [0, 0, 80], l: [0, 0, 0] }), fx: (S, t) => { S.plane.g.position.y = -9999; }, over: t => { dotGrid(t, c13, c14 - .1); } });
  sh('sky', c14, c15, { fov: 50, bloom: .2, bg2d: true, punch: [W('hiroshima'), .05], cam: t => ({ p: [0, 0, 80], l: [0, 0, 0] }), fx: (S, t) => { S.plane.g.position.y = -9999; }, over: t => { areaCompare(t, c14); stamp(t, W('hiroshima') + .25, [{ t: '3,000+ ×', size: 130, c: '#ffd23f' }], 1120, '#ffd23f', -.04, 130, 1.0); } });
  // ===== 14-16 Tu-95 =====
  const c16 = W('tu95') - .05, c17 = W('the', 8) - .06, c18 = W('fast') + .38;
  const pl = (S, t) => { S.plane.fly(t, planePath); S.plane.spin(t); carryBomb(S); S.bomb.visible = t < W('released'); };
  const follow = (t, off, look = [0, 0, 0]) => { const p = planePath(t); return { p: [p[0] + off[0], p[1] + off[1], p[2] + off[2]], l: [p[0] + look[0], p[1] + look[1], p[2] + look[2]] }; };
  sh('sky', c15, c16, { fov: 56, bloom: .2, cam: t => { const k = ease(seg(t, c15, c16)); return follow(t, mix([-100, 12, 96], [-62, 0, 118], k), [8, -1, 0]); }, fx: pl, over: t => { chipAt(t, W('modified') - .05, OW / 2, 470, 'MODIFIED TU-95', '#ffd23f'); } });
  sh('sky', c16, c17, { fov: 58, bloom: .2, cam: t => { const k = ease(seg(t, c16, c17)); return follow(t, mix([60, -14, -96], [100, 6, -80], k), [0, -1, 0]); }, fx: pl, over: t => { stamp(t, W('tu95') - .02, [{ t: 'Tu-95', size: 200 }], 640, '#ffd23f', -.05, 200, .9); chipAt(t, W('bomber', 1) - .05, OW / 2, 860, 'BOMBER', '#ffffff'); } });
  sh('sky', c17, c18, { fov: 60, bloom: .2, shake: .002, cam: t => { const k = ease(seg(t, c17, c18)); return follow(t, mix([-90, 22, 100], [-150, 34, 70], k), [20, 0, 0]); }, fx: pl, over: t => { chipAt(t, W('away') - .05, OW / 2, 470, 'GET AWAY FAST', '#ff6a3a'); } });
  // ===== 17 release + parachute =====
  const tr = W('released'), c19 = W('at', 2) - .06;
  const rel = () => { const p = planeState(tr); const v = V0 + 38 * sm((tr - 31.7) / 2.5); return { p0: [p[0] + 3.5 * Math.cos(p[3]) * 0, p[1] - 2.55, p[2]], v0: [v * Math.cos(p[3]), 0] }; };
  const bombFx = (S, t) => { S.plane.fly(t, planePath); S.plane.spin(t); if (t < tr) { carryBomb(S); S.bomb.visible = true; S.chute.visible = false; return; }
    const { p0, v0 } = rel(); const st = bombState(t, tr, p0, v0); const open = st.open; S.bomb.visible = true;
    const vd = new THREE.Vector3(st.v[0], st.v[1], 0).normalize(); const hang = new THREE.Vector3(.3, -.95, 0).normalize(); const dir = vd.clone().lerp(hang, open).normalize(); const sw = Math.sin((t - tr) * 1.4) * .08 * open;
    S.bomb.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, -1), dir); S.bomb.position.set(st.p[0], st.p[1], st.p[2]);
    S.chute.visible = open > .02; const R = 22; const sy = open * .75 + .25; S.chute.scale.set(open * .9 + .05, sy, open * .9 + .05); S.chute.position.set(st.p[0] - 1.2 * (1 - open), st.p[1] + R * 1.5 * sy + 2.5, st.p[2]); S.chute.rotation.set(0, 0, sw * 1.4); };
  const relP = t => { const { p0, v0 } = rel(); return bombState(t, tr, p0, v0).p; };
  sh('sky', c18, c19, { fov: 58, bloom: .25, cam: t => { const pp = planePath(t); const fol = [pp[0] - 70, pp[1] - 6, pp[2] + 80]; const u = sm((t - tr + .5) / .9); const bs = t >= tr ? relP(t) : [pp[0], pp[1] - 2.5, pp[2]]; const pos = mix(fol, [bs[0] - 38, bs[1] + 4, bs[2] + 82], u); const look = mix([pp[0] + 10, pp[1] - 3, pp[2]], [bs[0] + 4, bs[1] + 12, bs[2]], u); return { p: pos, l: look }; }, fx: bombFx, over: t => { chipAt(t, W('released') - .02, OW / 2, 470, 'BOMB RELEASED', '#ff6a3a', undefined, undefined, W('parachute') + .2); chipAt(t, W('parachute') + .15, OW / 2, 470, 'PARACHUTE', '#ffffff'); } });
    // ===== 18 11:32 Moscow time (map + clock) =====
  const c20 = 37.5;
  sh('map', c19, c20, { fov: 46, bloom: .3, cam: t => { const k = ease(seg(t, c19, c20)); const A = SETS.map.P(63, 44); return { p: [A.x + 1, 34 - 4 * k, A.z + 22 - 2 * k], l: [A.x, 0, A.z + .5] }; }, fx: (S, t) => { S.pins.mos.set(t, c19 + .1); S.pins.nz.set(t, c19 + .35); S.lab.mos.visible = t > c19 + .5; S.lab.nz.visible = t > c19 + .7; S.arcDraw(S.arcNM, seg(t, c19 + .5, c19 + 1.8)); }, over: t => { clock(t, c19, c20, OW / 2, 560, 190); } });
  // ===== 19 detonation: ground view =====
  const c21 = W('frozen') - .08;
  sh('arctic', c20, c21, { fov: 46, bloom: .35, punch: [tdet, .07], shakeAfter: tdet, cam: t => { const k = ease(seg(t, c20, c21)); return { p: [mix([250, 6, 330], [270, 10, 340], k)].flat(), l: [mix([0, 52, 0], [0, 58, 0], k)].flat() }; }, fx: (S, t) => { if (t < tdet) { S.noBlast(); S.chute.visible = true; const y = 40 + (tdet - t) * 14 * 1.8 + 0; S.chute.position.set(0, 40 + (tdet - t) * 15, 0); } else blast(S, t); }, over: t => { if (t < tdet + .1) { const pp = proj([0, 40 + Math.max(0, tdet - t) * 15 + 6, 0]); ctx.save(); ctx.strokeStyle = '#ffd23f'; ctx.lineWidth = 8; ctx.setLineDash([22, 14]); ctx.beginPath(); ctx.arc(pp[0], pp[1], 62 + 6 * Math.sin(t * 9), 0, 7); ctx.stroke(); ctx.restore(); chip(pp[0], pp[1] - 130, 'THE BOMB', '#ffd23f', 'rgba(8,10,14,.86)', 38); } altTape(t, tdet + .1, c21, '4 KM UP', .95, .45); } });
  // ===== 20 frozen island =====
  const c22 = W('the', 10);
  sh('arctic', c21, c22 - .0, { fov: 50, bloom: .35, shakeAfter: 0, cam: t => { const k = ease(seg(t, c21, c22)); return { p: [mix([420, 22, 480], [380, 30, 430], k)].flat(), l: [0, 60, 0] }; }, fx: (S, t) => { blast(S, t); }, over: t => { chipAt(t, W('frozen') - .02, OW / 2, 470, 'FROZEN ISLAND', '#9ad8ff'); } });
  // ===== 21 fireball =====
  const c23 = W('eight') + .05;
  sh('arctic', c22, c23, { fov: 50, bloom: .4, shake: .004, cam: t => { const k = ease(seg(t, c22, c23)); return { p: [mix([250, 40, 280], [270, 50, 310], k)].flat(), l: [0, 70, 0] }; }, fx: (S, t) => { blast(S, t); }, over: t => { stamp(t, W('fireball') - .02, [{ t: 'FIREBALL', size: 150 }], 470, '#ff9a2a', -.05, 150, 1.4); } });
  // ===== 22 8 km wide =====
  const c24 = W('the', 11) - .05;
  sh('arctic', c23, c24, { fov: 50, bloom: .35, cam: t => { const k = ease(seg(t, c23, c24)); return { p: [mix([330, 70, 370], [360, 85, 400], k)].flat(), l: [0, 78, 0] }; }, fx: (S, t) => { blast(S, t); }, over: t => { measure([-40, 80, 0], [40, 80, 0], '8 km', eo(seg(t, W('kilometres', 2) - .3, W('kilometres', 2) + .3))); } });
  // ===== 23 mushroom cloud =====
  const c25 = W('64') - .06;
  sh('arctic', c24, c25, { fov: 52, bloom: .3, cam: t => { const k = ease(seg(t, c24, c25)); return { p: [mix([250, 50, 560], [200, 70, 500], k)].flat(), l: [0, 200, 0] }; }, fx: (S, t) => { blast(S, t); }, over: t => { stamp(t, W('mushroom') - .02, [{ t: 'MUSHROOM', size: 130 }, { t: 'CLOUD', size: 130 }], 480, '#ffffff', -.04, 130, 1.5); } });
  // ===== 24 64 km ladder =====
  const c26 = W('upper') - .06;
  sh('arctic', c25, c26, { fov: 62, bloom: .3, cam: t => { const k = ease(seg(t, c25, c26)); return { p: [mix([150, 40, 1050], [110, 60, 1000], k)].flat(), l: [-60, 285, 0] }; }, fx: (S, t) => { blast(S, t); S.ladder.forEach((l, i) => l.visible = t > W('64') - .1 + i * .1); }, over: t => { const k = eo(seg(t, W('64') - .05, W('kilometres', 3) + .5)); bigNum(OW / 2 + 190, 480, `${Math.round(64 * k)} km`, 'HIGH', '#ff5a3a', 150); } });
  // ===== 25 upper atmosphere =====
  const c27 = W('bomber', 3) - .06;
  sh('arctic', c26, c27, { fov: 58, bloom: .4, cam: t => { const k = ease(seg(t, c26, c27)); return { p: [mix([380, 780, 900], [300, 880, 760], k)].flat(), l: [0, 500, 0] }; }, fx: (S, t) => { blast(S, t); }, over: t => { chipAt(t, W('upper') - .02, OW / 2, 470, 'UPPER ATMOSPHERE', '#9ad8ff'); } });
  // ===== 26-28 plane knocked down =====
  const c28 = W('shockwave', 2) - .08, c29 = W('thousand') - .15, c30 = W('windows') - .06;
  const tp = t => plane2(t); const fl2 = (S, t) => { S.plane.fly(t, tp); S.plane.spin(t); S.bomb.visible = false; const p = tp(t); S.shock.visible = false; const gap = Math.max(0, (PL2.SS - storyS(t)) * 105); S.glow.position.set(p[0] - gap - 700, p[1] + 60, p[2]); S.glow.material.opacity = .85; S.glow.scale.setScalar(900); };
  const fol = (t, off, look = [0, 0, 0]) => { const p = tp(t); return { p: [p[0] + off[0], p[1] + off[1], p[2] + off[2]], l: [p[0] + look[0], p[1] + look[1], p[2] + look[2]] }; };
  sh('sky', c27, c28, { fov: 52, bloom: .3, cam: t => { const k = ease(seg(t, c27, c28)); return fol(t, mix([-150, 30, 220], [-200, 20, 180], k), [0, 0, 0]); }, fx: fl2, over: t => { chipAt(t, W('far') - .02, OW / 2, 470, '45 KM AWAY', '#ffd23f'); } });
  const wave = (S, t) => { const p = tp(t); const gap = Math.max(0, (PL2.SS - storyS(t)) * 105); S.shock.visible = gap > 0 || storyS(t) < PL2.SS + 2.2; const r = 420; S.shock.scale.set(r * .06, r, r); S.shock.position.set(p[0] - gap - 40, p[1], p[2]); S.shock.rotation.y = 0; S.shock.material.opacity = .22 * (1 - lin((storyS(t) - PL2.SS) / 2.2)); };
  sh('sky', c28, c29, { fov: 58, bloom: .4, shake: .005, punch: [W('shockwave', 2), .07], cam: t => { const k = ease(seg(t, c28, c29)); return fol(t, mix([-70, 25, 110], [-45, -8, 100], k), [10, -4, 0]); }, fx: (S, t) => { fl2(S, t); wave(S, t); }, over: t => { stamp(t, W('shockwave', 2) - .02, [{ t: 'SHOCKWAVE', size: 130, c: '#ff4a3a' }], 620, '#ff4a3a', -.05, 130, 1.4); speedChip(t, c28 + .2, c30); } });
  sh('sky', c29, c30, { fov: 60, bloom: .3, cam: t => { const k = ease(seg(t, c29, c30)); return fol(t, mix([-60, 60, 120], [-90, 120, 110], k), [0, -10, 0]); }, fx: (S, t) => { fl2(S, t); wave(S, t); }, over: t => { const d = Math.max(0, -tp(t)[1]); bigNum(OW / 2, 560, `−${fmt(d / 10 * 10)} m`, 'DROPPED', '#ff5a3a', 150); speedChip(t, c28 + .2, c30); } });
  // ===== 29 windows shatter =====
  const c31 = W('as', 2) - .05; const tw = W('windows') + .23;
  sh('village', c30, c31, { fov: 50, bloom: .3, shake: .003, cam: t => { const k = ease(seg(t, c30, c31)); return { p: [mix([5, 3.0, 12], [-1, 3.2, 9.5], k)].flat(), l: [mix([1, 3.2, -12], [-3, 3.2, -12], k)].flat() }; }, chars: t => ({ v0: { p: [1.6, 0, 4.4], s: { face: -.2, expr: 'surprised', arms: 'point' } }, v2: { p: [-2.0, 0, 5.4], s: { face: .3, arms: 'raise', expr: 'surprised' } } }), fx: (S, t) => { S.shock(t, tw, 26, 40); }, over: t => { chipAt(t, W('windows') - .02, OW / 2, 470, 'WINDOWS SHATTER', '#9ad8ff'); } });
  // ===== 30 as far away as Finland (map) =====
  const c32 = W('in', 1) - .06;
  sh('map', c31, c32, { fov: 46, bloom: .3, cam: t => { const k = ease(seg(t, c31, c32)); const A = SETS.map.P(70.5, 41); return { p: [A.x + 1 - k * 1, 31 - 4 * k, A.z + 20 - 2 * k], l: [A.x, 0, A.z + 1] }; }, fx: (S, t) => { S.pins.nz.set(t, -1); S.pins.nz.g.visible = true; S.pins.nz.g.position.y = 0; S.pins.fin.set(t, c31 + .4); S.lab.nz.visible = true; S.lab.fin.visible = t > c31 + .6; const r = 1250 * eo(seg(t, c31 - .1, c31 + 1.0)); S.ring(0, r * .55, .9); S.ring(1, r * .8, .6); S.ring(2, r, .4); S.arcDraw(S.arcNF, seg(t, c31 + .2, c31 + 1.0)); S.lab.km.visible = t > c31 + .8; }, over: t => { stamp(t, W('finland') - .02, [{ t: 'FINLAND', size: 170, c: '#6ec2ff' }], 1100, '#6ec2ff', -.04, 170, 1.0); } });
  // ===== 31 Kuzka's mother =====
  const c33 = W("Kuzka's") - .1;
  sh('hangar', c32, c33, { fov: 50, bloom: .3, cam: t => { const k = ease(seg(t, c32, c33)); return { p: [mix([6, 2.3, 11], [2.6, 2.6, 8.4], k)].flat(), l: [0, 2.6, 2] }; }, chars: t => ({ boss: { p: [-0.5, 0, 4.4], s: { face: .2, arms: 'raise', expr: 'angry' } } }), fx: (S, t) => { S.tarp(1); }, over: t => { chipAt(t, W('russian') - .05, OW / 2, 470, 'IN RUSSIAN', '#ff4a3a'); } });
  const c34 = W('and', 2) - .06;
  sh('hangar', c33, c34, { fov: 48, bloom: .3, shake: .006, cam: t => { const k = ease(seg(t, c33, c34)); return { p: [mix([-3.2, 2.6, 8.4], [-1.4, 2.8, 7.2], k)].flat(), l: [-.4, 2.6, 2] }; }, chars: t => ({ boss: { p: [-0.5, 0, 4.4], s: { face: .2, arms: t % .4 < .2 ? 'raise' : 'gesture', expr: 'angry' } } }), fx: (S, t) => { S.tarp(1); }, over: t => { stamp(t, W("Kuzka's") - .02, [{ t: 'КУЗЬКИНА', size: 140, c: '#ffd23f' }, { t: 'МАТЬ', size: 180, c: '#ffd23f' }], 520, '#ffd23f', -.05, 150); chipAt(t, W('threat') - .05, OW / 2, 860, 'A THREAT', '#ff4a3a'); } });
  // ===== 32-34 Sakharov =====
  const c35 = W('andrei') - .06, c36 = W('became') + .5, c37 = W('limits') + .55;
  sh('hangar', c34, c35, { fov: 50, bloom: .25, cam: t => { const k = ease(seg(t, c34, c35)); return { p: [mix([-3, 2.6, 8], [-6.5, 2.8, 5.5], k)].flat(), l: [-9, 3.0, -4] }; }, chars: t => ({ e0: { p: [-11.4, 0, -2.2], s: { face: .3, arms: 'point', expr: 'smile' } }, e1: { p: [-7.2, 0, -2.0], s: { face: -.3, arms: 'gesture', expr: 'happy' } } }), fx: (S, t) => { S.tarp(1); S.boardDraw('eq', 0, t); }, over: t => { chipAt(t, W('designers') - .05, OW / 2, 470, 'ONE OF ITS DESIGNERS', '#ffd23f'); } });
  sh('hangar', c35, c36, { fov: 46, bloom: .25, punch: [W('sakharov'), .05], cam: t => { const k = ease(seg(t, c35, c36)); return { p: [mix([-7.4, 2.7, 5.2], [-8.4, 2.8, 4.4], k)].flat(), l: [-9, 2.9, -2.6] }; }, chars: t => ({ sci: { p: [-9, 0, -2.6], s: { face: .1, arms: 'lectern', expr: 'worried' } } }), fx: (S, t) => { S.tarp(1); S.boardDraw('eq', 0, t); }, over: t => { stamp(t, W('andrei') - .02, [{ t: 'ANDREI', size: 150, c: '#ffffff' }, { t: 'SAKHAROV', size: 150, c: '#ffd23f' }], 520, '#ffd23f', -.04, 150, 2.0); } });
  sh('hangar', c36, c37, { fov: 50, bloom: .3, cam: t => { const k = ease(seg(t, c36, c37)); return { p: [mix([10, 2.7, 12.6], [10, 3.0, 11], k)].flat(), l: [10, 2.4, 0] }; }, chars: t => ({ sci: { p: [10, 0, .4], s: { face: 0, arms: 'lectern', expr: 'angry' } }, c0: { p: [8.7, 0, 5.4], s: { arms: 'cheer' } }, c1: { p: [11.3, 0, 5.8], s: { arms: 'raise' } }, c2: { p: [9.4, 0, 3.4], s: { arms: 'cheer' } }, c3: { p: [10.9, 0, 3.0], s: { arms: 'raise' } } }), fx: (S, t) => { S.tarp(1); S.stopSign.visible = true; }, over: t => { chipAt(t, W('loudest') - .05, OW / 2, 470, 'LOUDEST VOICES', '#ff6a3a'); } });
  sh('hangar', c37, vend + .05, { fov: 48, bloom: .35, cam: t => { const k = ease(seg(t, c37, vend)); return { p: [mix([8, 3.4, 10.5], [10, 4.2, 7.5], k)].flat(), l: [10, 5.0, -10] }; }, chars: t => ({ c0: { p: [6.4, 0, 3.4], s: { arms: 'raise', expr: 'happy' } }, c3: { p: [13.6, 0, 3.6], s: { arms: 'cheer', expr: 'happy' } } }), fx: (S, t) => { S.tarp(1); S.stopSign.visible = true; S.stopSign.scale.setScalar(1 + .6 * ob(seg(t, c37, c37 + .4))); }, over: t => { chipAt(t, W('nuclear') - .05, OW / 2, 470, 'LIMIT NUCLEAR TESTS', '#ffd23f'); } });
  // ===== end card =====
  sh('space', vend + .05, dur, { fov: 46, bloom: .5, logo: true, cam: t => { const k = ease(seg(t, vend, dur)); return { p: [-150 + k * 40, 150, 240 - k * 20], l: [0, 0, 0] }; }, fx: (S, t) => { S.wave(0); S.pin.material.opacity = 0; } });
  FLASH.push(W('explosion'), W('three') + .2, W('tsar'), W('100'), W('seen'), tdet, W('shockwave', 2), W("Kuzka's"), W('sakharov') - .1);
}
// ---------- captions ----------
let GROUPS = [];
const EMPH = new Set(['explosion', 'shockwave', 'earth', 'three', 'arctic', 'soviet', 'weapon', 'tsar', 'bomba', '100', 'megatons', '50', 'fallout', '3000', 'hiroshima', 'tu95', 'parachute', '1132', 'detonated', 'fireball', '64', 'mushroom', 'kilometres', 'thousand', 'windows', 'finland', 'threat', 'sakharov', 'testing', 'nuclear', 'seen', 'half', 'island', 'frozen']);
function buildCaptions() {
  const ws = WORDS; let i = 0;
  while (i < ws.length) {
    const g = [ws[i]]; const w0 = ws[i].w;
    if (i + 1 < ws.length && !/[.,?!:]$/.test(w0) && ws[i + 1].a - ws[i].a < .55 && (w0.length + ws[i + 1].w.length) <= 14) { const em = EMPH.has(norm(w0)); const em2 = EMPH.has(norm(ws[i + 1].w)); if (!(em && em2)) g.push(ws[i + 1]); }
    GROUPS.push({ txt: g.map(x => x.w).join(' ').replace(/[,.]$/, ''), a: g[0].a, last: g[g.length - 1], em: g.some(x => EMPH.has(norm(x.w))) });
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

// ---------- logo end card (voice-less: logo pops, handle, Follow tapped) ----------
function drawLogo(t) {
  const vend = TL.voEnd; const a0 = vend + .1; if (t < a0 - .2) return;
  const aR = vend + .35;
  const fade = 1 - seg(t, TL.duration - .45, TL.duration - .02);
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
  const hk = eo(seg(t, aR + .5, aR + .9));
  if (hk > 0) { ctx.globalAlpha = fade * hk; ctx.font = '800 66px Montserrat'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round'; ctx.lineWidth = 9; ctx.strokeStyle = '#000'; const yy = 1130 + (1 - hk) * 30; ctx.strokeText('@redrawn.stories', cx, yy); ctx.fillStyle = '#ffffff'; ctx.fillText('@redrawn.stories', cx, yy); }
  const f0 = aR + .8, press = aR + 2.1; const bk = ob(seg(t, f0, f0 + .4));
  if (bk > 0) {
    const pressed = t > press; const pk = 1 - .1 * Math.sin(Math.PI * seg(t, press - .08, press + .2)); const bw = 440 * bk * pk, bh = 124 * bk * pk; ctx.globalAlpha = fade; const by = 1500;
    ctx.fillStyle = pressed ? '#3a3f48' : '#0095f6'; ctx.beginPath(); ctx.roundRect(cx - bw / 2, by - bh / 2, bw, bh, 28); ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = 'rgba(0,0,0,.55)'; ctx.stroke();
    ctx.fillStyle = '#fff'; ctx.font = `800 ${Math.round(60 * bk * pk)}px Montserrat`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(pressed ? 'Following ✓' : 'Follow', cx, by + 3);
    const hin = eo(seg(t, press - .9, press - .15)) * (1 - eo(seg(t, press + .35, press + .9))); if (hin > 0) { const tap = Math.sin(Math.PI * seg(t, press - .12, press + .12)); const hx = cx + 90 + (1 - hin) * 260, hy = by + 70 + (1 - hin) * 260 - tap * -14; ctx.save(); ctx.translate(hx, hy); ctx.rotate(-.35); ctx.fillStyle = '#f6d7b0'; ctx.strokeStyle = '#2a1a12'; ctx.lineWidth = 8; ctx.lineJoin = 'round'; ctx.beginPath(); ctx.roundRect(-34, -20, 68, 120, 30); ctx.fill(); ctx.stroke(); ctx.beginPath(); ctx.roundRect(-18, -86, 36, 90, 18); ctx.fill(); ctx.stroke(); ctx.restore(); }
    if (t > press - .1 && t < press + .6) { const r = seg(t, press - .1, press + .6); ctx.strokeStyle = `rgba(255,255,255,${1 - r})`; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(cx + 80, by + 8, 30 + r * 90, 0, 7); ctx.stroke(); }
  }
  ctx.restore();
}
function render(t) {
  const shot = SHOTS.find(s => t >= s.a && t < s.b) || SHOTS[SHOTS.length - 1];
  const S = getSet(shot.set);
  cam.fov = shot.fov || 45; cam.near = shot.set === 'arctic' || shot.set === 'space' ? 3 : .2; cam.far = shot.set === 'sky' ? 40000 : 22000;
  const c = shot.cam(t); cam.position.set(...c.p); cam.lookAt(V(c.l));
  if (shot.punch) { const p = seg(t, shot.punch[0], shot.punch[0] + .1) * (1 - seg(t, shot.punch[0] + .1, shot.punch[0] + .55)); cam.fov *= 1 - shot.punch[1] * eo(p); }
  cam.fov *= 1 + .06 * (1 - eo(seg(t, shot.a, shot.a + .2)));
  cam.updateProjectionMatrix(); cam.lookAt(V(c.l));
  if (shot.shake) { cam.position.x += Math.sin(t * 37) * shot.shake * 40; cam.position.y += Math.cos(t * 29) * shot.shake * 40; cam.lookAt(V(c.l)); }
  if (shot.shakeAfter !== undefined && t > shot.shakeAfter) { const k = Math.max(0, 1 - (t - shot.shakeAfter) / 1.4); const m = shot.set === 'arctic' ? 5 : .3; cam.position.x += Math.sin(t * 61) * m * k; cam.position.y += Math.cos(t * 47) * m * k; cam.lookAt(V(c.l)); }
  cam.updateMatrixWorld();
  S.reset && S.reset();
  S.update(t, cam);
  if (shot.fx) shot.fx(S, t);
  const cs = shot.chars ? shot.chars(t) : {};
  for (const [k, ch] of Object.entries(S.chars || {})) { const q = cs[k]; if (!q) { ch.mesh.visible = ch.shadow.visible = false; continue; } ch.set(V(q.p), { ...q.s, t }, cam); }
  rp.scene = S.scene || S; bloom.strength = shot.bloom ?? .3;
  composer.render();
  ctx.globalAlpha = 1;
  if (shot.bg2d) { const g = ctx.createLinearGradient(0, 0, 0, OH); g.addColorStop(0, '#2a78d6'); g.addColorStop(.6, '#76bdf0'); g.addColorStop(1, '#cfe6fa'); ctx.fillStyle = g; ctx.fillRect(0, 0, OW, OH); } else ctx.drawImage(renderer.domElement, 0, 0, OW, OH);
  const vg = ctx.createRadialGradient(OW / 2, OH * .48, OH * .36, OW / 2, OH * .5, OH * .8); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.28)'); ctx.fillStyle = vg; ctx.fillRect(0, 0, OW, OH);
  ctx.save(); ctx.globalAlpha = .05; ctx.globalCompositeOperation = 'overlay'; const ox = Math.floor(hash(Math.floor(t * 30)) * 256), oy = Math.floor(hash(Math.floor(t * 30) + 5) * 256); ctx.translate(-ox, -oy); ctx.fillStyle = ctx.createPattern(noise, 'repeat'); ctx.fillRect(0, 0, OW + 256, OH + 256); ctx.restore();
  if (shot.over && !window.NOOVER) shot.over(t);
  for (const f of FLASH) if (!window.NOOVER) { const a = 1 - seg(t, f, f + .18); if (t >= f && a > 0) { ctx.fillStyle = `rgba(255,255,255,${a * .55})`; ctx.fillRect(0, 0, OW, OH); } }
  const td = W('detonated'); flashWhite(t, td - .02, .95, .5);
  const fin = t < .25 ? 1 - t / .25 : 0; if (fin > 0) { ctx.fillStyle = `rgba(0,0,0,${fin})`; ctx.fillRect(0, 0, OW, OH); }
  if (shot.logo) drawLogo(t);
  if (t < TL.voEnd && !window.NOCAP) drawCaption(t);
}
window.setup = async (tl) => {
  TL = tl; WORDS = tl.words;
  for (const f of ['800 76px Montserrat', '900 76px Montserrat', 'bold 40px Montserrat']) await document.fonts.load(f);
  await document.fonts.load('900 76px Montserrat', 'КУЗЬКИНА МАТЬ'); await document.fonts.load('800 76px Montserrat', 'КУЗЬКИНА');
  LOGO = new Image(); LOGO.src = 'logo.png'; await LOGO.decode(); await loadEarth(); await loadArcticMap();
  Object.keys(B).forEach(getSet);
  buildShots(); buildCaptions();
  return SHOTS.map(s => [s.set, +s.a.toFixed(2), +s.b.toFixed(2)]);
};
window.render = render; window.SETS = SETS; window.planeState = planeState; window.ready = true;
