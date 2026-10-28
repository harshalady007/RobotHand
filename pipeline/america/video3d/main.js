import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { buildGlobe, loadWorld, BASES, BASE, DC } from './kglobe.js';
import { buildBase } from './kbase.js';
import { buildSea, waveH } from './ksea.js';
import { heliFly } from './kcommon.js';
import { GR, ll } from './kamerica.js';
import { hash } from './tex.js';

const RW = 720, RH = 1280, OW = 1080, OH = 1920;
const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
renderer.setSize(RW, RH); renderer.setPixelRatio(1); renderer.toneMapping = THREE.NeutralToneMapping; renderer.toneMappingExposure = 1.0;
renderer.domElement.style.display = 'none'; document.body.appendChild(renderer.domElement);
const out = document.getElementById('out'); const ctx = out.getContext('2d');
const cam = new THREE.PerspectiveCamera(45, RW / RH, .2, 14000);
const composer = new EffectComposer(renderer);
const rp = new RenderPass(new THREE.Scene(), cam); composer.addPass(rp);
const bloom = new UnrealBloomPass(new THREE.Vector2(RW, RH), .3, .5, 1.15); composer.addPass(bloom);
composer.addPass(new OutputPass());
const B = { globe: buildGlobe, base: buildBase, sea: buildSea };
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
const WB = (w, n = 1) => { let k = 0; for (const x of WORDS) { if (norm(x.w) === norm(w)) { k++; if (k === n) return x.b; } } throw new Error('word ' + w + n); };
const proj = (p) => { const v = new THREE.Vector3(...p).project(cam); return [(v.x + 1) / 2 * OW, (1 - v.y) / 2 * OH, v.z]; };
const projV = v => proj([v.x, v.y, v.z]);

// ---------- overlay helpers ----------
function chip(x, y, txt, col = '#ffd23f', bg = 'rgba(8,10,14,.84)', size = 42) {
  ctx.save(); ctx.font = `800 ${size}px Montserrat`; const w = ctx.measureText(txt).width + size * 1.1, h = size * 1.6;
  ctx.fillStyle = bg; ctx.beginPath(); ctx.roundRect(x - w / 2, y - h / 2, w, h, h / 2); ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = col; ctx.stroke();
  ctx.fillStyle = col; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(txt, x, y + 2); ctx.restore();
}
function chipAt(t, t0, x, y, txt, col, bg, size) { const k = ob(seg(t, t0, t0 + .22)); if (k <= 0) return; ctx.save(); ctx.translate(x, y); ctx.scale(k, k); ctx.translate(-x, -y); chip(x, y, txt, col, bg, size); ctx.restore(); }
function stamp(t, t0, lines, y = 560, col = '#ffd23f', rot = -.06, size = 190, hold = 1e9) {
  const k = ob(seg(t, t0, t0 + .22)) * (1 - seg(t, t0 + hold, t0 + hold + .2)); if (k <= .01) return;
  ctx.save(); ctx.translate(OW / 2, y); ctx.rotate(rot); ctx.scale(k * (1 + .12 * (1 - seg(t, t0, t0 + .5))), k); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';
  lines.forEach((l, i) => { const sz = (typeof l === 'string' ? size : l.size || size); const txt = typeof l === 'string' ? l : l.t; const c = typeof l === 'string' ? col : (l.c || col); ctx.font = `900 ${sz}px Montserrat`; ctx.shadowColor = 'rgba(0,0,0,.6)'; ctx.shadowBlur = 16; ctx.shadowOffsetY = 8; ctx.lineWidth = sz * .12; ctx.strokeStyle = '#0a0a0a'; const yy = i * size * .95 - (lines.length - 1) * size * .475; ctx.strokeText(txt, 0, yy); ctx.shadowColor = 'transparent'; ctx.fillStyle = c; ctx.fillText(txt, 0, yy); });
  ctx.restore();
}
function frost(t, a, b) { const k = seg(t, a, a + .3) * (1 - seg(t, b - .3, b)); if (k <= 0) return; ctx.save(); const g = ctx.createRadialGradient(OW / 2, OH / 2, OH * .28, OW / 2, OH / 2, OH * .62); g.addColorStop(0, 'rgba(200,235,255,0)'); g.addColorStop(1, `rgba(215,240,255,${.75 * k})`); ctx.fillStyle = g; ctx.fillRect(0, 0, OW, OH); ctx.strokeStyle = `rgba(255,255,255,${.7 * k})`; ctx.lineWidth = 3; for (let i = 0; i < 40; i++) { const edge = i % 4, u = hash(i * 3.1), L = 40 + hash(i * 5.3) * 120; let x = edge === 0 ? u * OW : edge === 1 ? OW : edge === 2 ? u * OW : 0, y = edge === 0 ? 0 : edge === 1 ? u * OH : edge === 2 ? OH : u * OH; const dx = edge === 1 ? -1 : edge === 3 ? 1 : (hash(i) - .5), dy = edge === 0 ? 1 : edge === 2 ? -1 : (hash(i + 2) - .5); ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + dx * L * k, y + dy * L * k); ctx.stroke(); } ctx.restore(); }
function crossX(x, y, k, s = 70) { ctx.save(); ctx.lineWidth = 22; ctx.lineCap = 'round'; ctx.strokeStyle = '#ff3b30'; ctx.shadowColor = 'rgba(0,0,0,.6)'; ctx.shadowBlur = 12; ctx.beginPath(); ctx.moveTo(x - s, y - s); ctx.lineTo(x - s + 2 * s * Math.min(1, k * 2), y - s + 2 * s * Math.min(1, k * 2)); ctx.stroke(); if (k > .5) { ctx.beginPath(); ctx.moveTo(x + s, y - s); ctx.lineTo(x + s - 2 * s * Math.min(1, (k - .5) * 2), y - s + 2 * s * Math.min(1, (k - .5) * 2)); ctx.stroke(); } ctx.restore(); }
function thermo(x, y, k) { ctx.save(); ctx.translate(x, y); ctx.fillStyle = 'rgba(8,10,14,.82)'; ctx.beginPath(); ctx.roundRect(-60, -170, 120, 340, 30); ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = '#5ec8ff'; ctx.stroke(); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.roundRect(-14, -140, 28, 200, 14); ctx.fill(); ctx.fillStyle = '#5ec8ff'; ctx.beginPath(); ctx.arc(0, 90, 30, 0, 7); ctx.fill(); ctx.fillRect(-9, 90 - 200 * (1 - k * .9) * .9, 18, 200 * (1 - k * .9) * .9); ctx.restore(); }
function bigNum(x, y, txt, sub, col = '#fff') { ctx.save(); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round'; ctx.font = '900 120px Montserrat'; ctx.lineWidth = 16; ctx.strokeStyle = '#0a0a0a'; ctx.strokeText(txt, x, y); ctx.fillStyle = col; ctx.fillText(txt, x, y); ctx.font = '800 44px Montserrat'; ctx.lineWidth = 9; ctx.strokeText(sub, x, y + 84); ctx.fillStyle = '#fff'; ctx.fillText(sub, x, y + 84); ctx.restore(); }

// ---------- extra overlays ----------
function clockFace(x, y, r, k) {
  ctx.save(); ctx.translate(x, y); ctx.fillStyle = '#fff'; ctx.strokeStyle = '#0a0a0a'; ctx.lineWidth = 12; ctx.shadowColor = 'rgba(0,0,0,.5)'; ctx.shadowBlur = 14; ctx.beginPath(); ctx.arc(0, 0, r, 0, 7); ctx.fill(); ctx.shadowColor = 'transparent'; ctx.stroke();
  ctx.lineWidth = 6; for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6; ctx.beginPath(); ctx.moveTo(Math.sin(a) * r * .8, -Math.cos(a) * r * .8); ctx.lineTo(Math.sin(a) * r * .92, -Math.cos(a) * r * .92); ctx.stroke(); }
  ctx.lineCap = 'round'; const am = k * Math.PI * 2 * 14, ah = am / 12; ctx.lineWidth = 10; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.sin(am) * r * .74, -Math.cos(am) * r * .74); ctx.stroke(); ctx.lineWidth = 14; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.sin(ah) * r * .48, -Math.cos(ah) * r * .48); ctx.stroke(); ctx.fillStyle = '#d6322a'; ctx.beginPath(); ctx.arc(0, 0, 12, 0, 7); ctx.fill(); ctx.restore();
}
function calendar(x, y, w, k) {
  ctx.save(); ctx.translate(x, y); ctx.scale(k, k); ctx.fillStyle = '#fff'; ctx.strokeStyle = '#0a0a0a'; ctx.lineWidth = 10; ctx.shadowColor = 'rgba(0,0,0,.5)'; ctx.shadowBlur = 14; ctx.beginPath(); ctx.roundRect(-w / 2, -w / 2, w, w, 26); ctx.fill(); ctx.shadowColor = 'transparent'; ctx.stroke();
  ctx.fillStyle = '#d6322a'; ctx.beginPath(); ctx.roundRect(-w / 2, -w / 2, w, w * .26, [26, 26, 0, 0]); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#9aa3ad'; for (let r = 0; r < 4; r++) for (let c = 0; c < 7; c++) ctx.fillRect(-w / 2 + 18 + c * (w - 36) / 7, -w / 2 + w * .34 + r * w * .15, (w - 36) / 7 - 8, w * .1);
  ctx.restore();
}
function counter(x, y, v, txt, sub) { bigNum(x, y, txt, sub, '#ffd23f'); }
function lens(t, a, b) { const k = seg(t, a, b); if (k <= 0 || k >= 1) return; ctx.save(); const s = .6 + k * 3.2, al = 1 - seg(t, b - .18, b); ctx.globalAlpha = al; ctx.translate(OW / 2 - 40 * k, 760); ctx.scale(s, s); ctx.lineWidth = 22; ctx.strokeStyle = '#fff'; ctx.shadowColor = 'rgba(0,0,0,.5)'; ctx.shadowBlur = 16; ctx.fillStyle = 'rgba(255,255,255,.12)'; ctx.beginPath(); ctx.arc(0, 0, 170, 0, 7); ctx.fill(); ctx.stroke(); ctx.lineCap = 'round'; ctx.lineWidth = 46; ctx.strokeStyle = '#0a0a0a'; ctx.beginPath(); ctx.moveTo(120, 120); ctx.lineTo(250, 250); ctx.stroke(); ctx.lineWidth = 30; ctx.strokeStyle = '#ffd23f'; ctx.beginPath(); ctx.moveTo(120, 120); ctx.lineTo(250, 250); ctx.stroke(); ctx.restore(); }
function gchip(t, t0, lon, lat, txt, col = '#fff', size = 32, dx = 0, dy = 0, alt = 2) { const S = SETS.globe; const p = S.P(lon, lat, alt); const n = p.clone().normalize(); const cd = cam.position.clone().sub(p).normalize(); if (n.dot(cd) < .18) return; const [x, y] = projV(p); chipAt(t, t0, x + dx, y + dy, txt, col, 'rgba(8,10,14,.84)', size); }
function gdot(lon, lat) { const S = SETS.globe; const p = S.P(lon, lat, 2); const [x, y] = projV(p); return [x, y]; }
function shieldX(t, t0, x, y, k = 1) { const a = ob(seg(t, t0, t0 + .25)); if (a <= 0) return; ctx.save(); ctx.translate(x, y); ctx.scale(a * k, a * k); ctx.fillStyle = '#2f6fe0'; ctx.strokeStyle = '#0a0a0a'; ctx.lineWidth = 14; ctx.shadowColor = 'rgba(0,0,0,.5)'; ctx.shadowBlur = 16; ctx.beginPath(); ctx.moveTo(-110, -130); ctx.lineTo(110, -130); ctx.lineTo(110, 10); ctx.quadraticCurveTo(110, 100, 0, 150); ctx.quadraticCurveTo(-110, 100, -110, 10); ctx.closePath(); ctx.fill(); ctx.shadowColor = 'transparent'; ctx.stroke(); ctx.fillStyle = '#fff'; ctx.beginPath(); for (let i = 0; i < 10; i++) { const an = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? 26 : 66; ctx.lineTo(Math.cos(an) * r, -10 + Math.sin(an) * r); } ctx.closePath(); ctx.fill(); ctx.restore(); }

// ---------- shots ----------
let SHOTS = [];
let FLASHT = [];
const GC = (lon, lat, d, aim = 1) => { const dir = ll(lon, lat, 1); return { p: dir.clone().multiplyScalar(d).toArray(), l: dir.clone().multiplyScalar(GR * aim).toArray() }; };
const GCm = (a, b, k, e = true) => { const u = e ? ease(k) : k; return GC(a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u, a[2] + (b[2] - a[2]) * u, (a[3] ?? 1) + ((b[3] ?? 1) - (a[3] ?? 1)) * u); };
const sm01 = x => { x = lin(x); return x * x * (3 - 2 * x); };
// jet ground roll (constant accel) then rotation + climb; nose-first along +x
const takeoff = (t0, x0, z, v0 = 55, a = 9, vr = 78) => { const tr = (vr - v0) / a; const xr = x0 + v0 * tr + .5 * a * tr * tr; return t => { const s = t - t0; if (s <= 0) return [x0, 1.45, z]; if (s <= tr) return [x0 + v0 * s + .5 * a * s * s, 1.45, z]; const s2 = s - tr; return [xr + vr * s2 + .5 * a * 1.2 * s2 * s2, 1.45 + 2.6 * s2 * s2, z]; }; };
// helicopter: vertical climb, then tilts forward and accelerates (heliFly derives pitch/bank from the path)
const heliUp = (t0, x0, z0, ax = 3.2, tf = 1.3) => t => { const s = Math.max(0, t - t0); const y = 14 * sm01(s / 2.2) * (1 + .15 * Math.max(0, s - 2.2)); const f = Math.max(0, s - tf); return [x0 + .5 * ax * f * f, y, z0 - .25 * f * f]; };
// constant-speed turn (heading psi: 0 = +z, pi/2 = +x), bank follows from v*yawRate/g inside jet.fly
const turnP = (x0, y0, z0, psi0, om, v, t0) => u => { const s = u - t0, R = v / om; return [x0 + R * (Math.cos(psi0) - Math.cos(psi0 + om * s)), y0 + 1.5 * Math.sin(s * 1.3), z0 + R * (Math.sin(psi0 + om * s) - Math.sin(psi0))]; };
function buildShots() {
  const sh = (set, a, b, o) => SHOTS.push({ set, a, b, ...o });
  const t10k = W('10,000'), tBec = W('Because'), tAnd1 = W('and', 1), tIn1 = W('In', 1), tIn2 = W('In', 2), tAnc = W('anchor'), tWhen = W('When'), tTr = W('troops'), tHrs = W('hours'), tThese = W('These'), tGl1 = W('global', 1), tTrade = W('trade'), tBut = W('But'), tEvery = W('Every'), tWere = W("We're"), tAm2 = W('America', 2), tIt2 = W('It', 2), tAround = W('around'), tTh1 = W("That's", 1), tTh2 = W("That's", 2), tFol = W('Follow');
  const END = TL.duration;
  // 1 hook: chase camera behind a jet on its take-off roll, base sliding past
  const c1 = t10k - .05; const j1 = takeoff(0, -118, 6, 52, 10);
  sh('base', 0, c1, { fov: 54, bloom: .25, punch: [W('bases', 1), .05], cam: t => { const p = j1(t); return { p: [p[0] - 24, 5.5, 15], l: [p[0] + 26, 4.2, -6] }; },
    fx: (S, t) => { S.fl.us.g.visible = true; S.fl.nato.g.visible = true; for (let i = 0; i < 9; i++) S.jets[i].show(true), S.jets[i].park(-90 + i * 22, -52 - (i % 2) * 14); const j = S.jets[9]; j.show(true); j.fly(t, j1, .95); const h = S.helis[0]; h.g.visible = true; heliFly(h, t, () => [60, 0, -40], 0); },
    over: t => { chipAt(t, W('military') - .05, OW / 2, 470, 'U.S. MILITARY BASE ABROAD', '#ffffff', 'rgba(8,10,14,.84)', 38); } });
  // 2 10,000 miles: DC -> Darwin arc, jet crossing the Pacific
  sh('globe', c1, tBec - .06, { fov: 45, bloom: .3, cam: t => GCm([-85, 30, 410, .8], [-140, 22, 400, .85], seg(t, c1, tBec - .06)),
    fx: (S, t) => { S.pins.dc.set(t, c1 + .05, 12); const k = eo(seg(t, t10k, tBec - .3)); S.arcs.dcDarwin.set(k * .6); S.placeJet(S.arcs.dcDarwin, k * .6 * .995); },
    over: t => { const k = eo(seg(t, t10k - .02, tBec - .3)); const v = Math.round(10000 * k / 100) * 100; counter(OW / 2, 440, v, '≈ ' + v.toLocaleString('en-US') + ' mi', ''); chipAt(t, t10k + .1, OW / 2, 590, 'WASHINGTON → DARWIN, AUSTRALIA', '#ffffff', 'rgba(8,10,14,.84)', 30); } });
  // 3 distance is the enemy: tiny ship in endless ocean (camera looks away from the coast)
  sh('sea', tBec - .06, tAnd1 - .04, { fov: 50, bloom: .25, punch: [W('enemy') - .1, .06], cam: t => { const k = ease(seg(t, tBec - .06, tAnd1 - .04)); return { p: mix([30, 12, -40], [14, 9, -30], k), l: [0, 9, 700] }; },
    fx: (S, t) => { const d = S.dd[0]; d.g.visible = true; d.place(-60 + 7 * (t - tBec), 700, 0, t, 7); },
    over: t => { stamp(t, W('distance') - .02, [{ t: 'DISTANCE', c: '#ff4a3a' }], 540, '#ff4a3a', -.05, 148, 1.1); } });
  // 4 bases erase it: Pacific hop chain
  sh('globe', tAnd1 - .04, tIn1 - .06, { fov: 45, bloom: .3, cam: t => GCm([-160, 26, 400, .8], [150, 6, 380, .85], seg(t, tAnd1 - .04, tIn1 - .06)),
    fx: (S, t) => { S.pins.hawaii.set(t, W('bases', 2) - .05, 12); S.pins.guam.set(t, W('erase') - .05, 12); S.pins.darwin.set(t, W('it') - .05, 12); S.arcs.dcHi.set(1); S.arcs.hiGuam.set(eo(seg(t, W('bases', 2), W('erase')))); S.arcs.guamDar.set(eo(seg(t, W('erase'), W('it') + .2))); },
    over: t => { gchip(t, W('bases', 2), BASE.hawaii[3], BASE.hawaii[2], 'HAWAII', '#fff', 30, 0, -70); gchip(t, W('erase') - .05, BASE.guam[3], BASE.guam[2], 'GUAM', '#fff', 30, 0, -70); gchip(t, W('it') - .05, BASE.darwin[3], BASE.darwin[2], 'DARWIN', '#fff', 30, 0, -70); } });
  // 5 Europe: NATO front line
  sh('base', tIn1 - .06, tIn2 - .06, { fov: 48, bloom: .25, punch: [W("NATO's"), .06], cam: t => { const k = ease(seg(t, tIn1 - .06, tIn2 - .06)); return { p: mix([-36, 1.7, -18.5], [-35.5, 2.3, -17.2], k), l: mix([-37, 4.6, -36], [-36, 5.4, -36], k) }; },
    fx: (S, t) => { S.fl.us.g.visible = true; S.fl.nato.g.visible = true; for (let i = 0; i < 6; i++) S.jets[i].show(true), S.jets[i].park(-6 + i * 20, -52 - (i % 2) * 14); },
    chars: t => ({ g0: { p: [-34.4, 0, -27.6], s: { arms: 'rifle', face: .3 } }, g1: { p: [-38.6, 0, -27.6], s: { arms: 'rifle', face: -.3 } }, off: { p: [-36.5, 0, -25.2], s: { arms: 'point', face: 0, expr: 'smile' } } }),
    over: t => { chipAt(t, W('Europe') - .05, OW / 2, 440, 'EUROPE', '#ffffff'); stamp(t, W("NATO's") - .02, [{ t: 'NATO', c: '#59d0ff' }], 600, '#59d0ff', -.05, 200, 1.2); } });
  // 6 Japan & South Korea: troop counts
  sh('globe', tIn2 - .06, tAnc - .1, { fov: 45, bloom: .3, cam: t => GCm([150, 28, 400, .7], [132, 33, 262, 1], seg(t, tIn2 - .06, tAnc - .1)),
    fx: (S, t) => { [['yokosuka', 0], ['kadena', .08], ['misawa', .16], ['honshu', .2], ['humphreys', .5], ['osan', .56], ['guam', .7]].forEach(([k, d]) => S.pins[k].set(t, W('Japan') + d, 10)); },
    over: t => { gchip(t, W('Japan') + .15, 139, 36.5, 'JAPAN ≈ 54,000', '#ffd23f', 34, -130, -190); gchip(t, W('South Korea') + .1, 127, 36.8, 'S. KOREA ≈ 23,500', '#ffd23f', 34, -180, -300); } });
  // 7 anchor: US destroyer in a Japanese port, anchor falls under gravity
  const dx7 = -70, dz7 = -8;
  sh('sea', tAnc - .1, tWhen - .06, { fov: 50, bloom: .25, punch: [tAnc, .06], cam: t => { const k = ease(seg(t, tAnc - .1, tWhen - .06)); return { p: mix([-52, 13, 58], [-44, 10, 46], k), l: [-30, 3.5, -8] }; },
    fx: (S, t) => { const cv = S.cv; cv.g.visible = true; cv.place(40, -44, 0, t, 0); S.fl.jp.g.visible = true; const d = S.dd[0]; d.g.visible = true; d.place(dx7, dz7, 0, t, 0); const wy = waveH(dx7 + 41, dz7 + 3.2, t); S.dropAnchor(t, tAnc + .05, dx7 + 41, 5.6, dz7 + 3.4, wy); },
    chars: t => { const y = 6.1 + waveH(dx7 + 30, dz7, t) * .8; return { s0: { p: [dx7 + 31, y, dz7 - 2.4], s: { arms: 'cheer', face: .3, expr: 'happy' } }, s1: { p: [dx7 + 36.5, y, dz7 + 1.6], s: { arms: 'raise', face: .1, expr: 'happy' } } }; },
    over: t => { chipAt(t, tAnc + 1.3, OW / 2, 440, 'EAST ASIA', '#ffffff'); stamp(t, W('grip') - .02, [{ t: 'GRIP', c: '#ff4a3a' }], 600, '#ff4a3a', -.05, 200, 1.0); } });
  // 8 crisis alarm: troops sprint toward the tower, beacon flashing
  sh('base', tWhen - .06, tTr - .05, { fov: 50, bloom: .3, cam: t => { const k = ease(seg(t, tWhen - .06, tTr - .05)); return { p: mix([-150, 2.4, -12], [-150, 3.0, -15], k), l: [-150, 5.5, -48] }; },
    fx: (S, t) => { S.beacon.material.opacity = .8 + .2 * Math.sin(t * 16); for (let i = 0; i < 3; i++) S.jets[i].show(true), S.jets[i].park(-120 + i * 22, -48 - (i % 2) * 10); },
    chars: t => { const u = t - (tWhen - .06); const z = -29 - 4.2 * u; return { g0: { p: [-152.6, 0, z], s: { arms: 'rifle', walk: true, back: true } }, g1: { p: [-147.4, 0, z - 2.5], s: { arms: 'rifle', walk: true, back: true } }, pil0: { p: [-150, 0, z + 3.5], s: { arms: 'down', walk: true, back: true } } }; },
    over: t => { const f = .5 + .5 * Math.sin(t * 14); ctx.fillStyle = `rgba(255,30,20,${.08 + .1 * f})`; ctx.fillRect(0, 0, OW, OH); stamp(t, W('crisis') - .05, [{ t: 'CRISIS', c: '#ff4a3a' }], 520, '#ff4a3a', -.05, 200, 1.1); } });
  // 9 troops + jets: helicopter lifts off and leans into forward flight, jet scrambles
  const tAnd3 = W('and', 3), tJets = W('jets');
  sh('base', tTr - .05, tAnd3 + .55, { fov: 52, bloom: .25, shake: .003, punch: [tJets, .05], cam: t => { const k = ease(seg(t, tTr - .05, tAnd3 + .55)); return { p: mix([-6, 4.5, -3], [4, 7, -4], k), l: mix([-19, 7.5, -26], [-14, 9, -26], k) }; },
    fx: (S, t) => { const h = S.helis[0]; h.g.visible = true; heliFly(h, t, heliUp(tTr, -20, -26, 3.4, 1.4), 0); S.dust.g.visible = true; S.dust.update(t, te => [-20, .6, -26], 1.2, 3, .45 * (1 - sm01((t - tTr) / 2.2))); const j = S.jets[8]; j.show(true); j.fly(t, takeoff(tJets - .3, -75, -15, 58, 10), .95); for (let i = 0; i < 3; i++) S.jets[i].show(true), S.jets[i].park(14 + i * 20, -56); },
    chars: t => ({ g0: { p: [-14, 0, -22], s: { arms: 'rifle', walk: true, face: -.6 } }, g1: { p: [-27, 0, -23], s: { arms: 'rifle', walk: true, face: .6 } } }),
    over: t => { chipAt(t, tTr - .02, OW / 2, 440, 'TROOPS', '#ffd23f'); chipAt(t, tJets - .02, OW / 2, 550, 'JETS', '#ffd23f'); } });
  // 10 supplies: trucks roll nose-first up the C-17 ramp (wheel spin = distance / radius)
  sh('base', tAnd3 + .55, tHrs - .02, { fov: 50, bloom: .25, cam: t => { const k = ease(seg(t, tAnd3 + .55, tHrs - .02)); return { p: mix([-24, 3.6, -33], [-18, 4.2, -34], k), l: [3, 3.4, -47.5] }; },
    fx: (S, t) => { const c = S.c17; c.g.visible = true; c.g.position.set(40, 0, -48); c.g.rotation.set(0, -Math.PI / 2, 0); c.wheels.forEach(w => w.parent.visible = true); const sp = 6, x0 = -8; for (let i = 0; i < 2; i++) { const tr = S.trucks[i]; tr.g.visible = true; const x = x0 - i * 13 + sp * (t - (tAnd3 + .55)); const rp = x > 5.5 ? sm01((x - 5.5) / 7.5) : 0; tr.drive(x, 1.9 * rp, -48, x, 0); tr.g.rotation.z = (rp > 0 && rp < 1) ? .254 : 0; tr.g.visible = x < 17; } },
    chars: t => ({ c0: { p: [4.5, 0, -43], s: { arms: 'point', face: .5 } }, c1: { p: [-9, 0, -43.5], s: { arms: 'raise', face: .4 } } }),
    over: t => { chipAt(t, W('supplies') - .02, OW / 2, 440, 'SUPPLIES', '#ffd23f'); } });
  // 11 hours, not weeks: jets in a banking turn over the sea
  const lead = turnP(-8, 52, 40, .05, -.11, 90, tHrs);
  const wing = (dx, dz) => u => { const p = lead(u), s = u - tHrs, ps = .05 - .11 * s; return [p[0] + dx * Math.cos(ps) + dz * Math.sin(ps), p[1] + 1, p[2] - dx * Math.sin(ps) + dz * Math.cos(ps)]; };
  sh('sea', tHrs - .02, tThese - .06, { fov: 54, bloom: .3, cam: t => { const p = lead(t); return { p: [p[0] * .5 + 8, p[1] - 3, p[2] - 78], l: [p[0] - 3, p[1] + 3, p[2]] }; },
    fx: (S, t) => { S.jets[0].show(true); S.jets[0].fly(t, lead); S.jets[1].show(true); S.jets[1].fly(t, wing(-10, -14)); S.jets[2].show(true); S.jets[2].fly(t, wing(10, -14)); },
    over: t => { const a = ob(seg(t, tHrs - .02, tHrs + .25)); if (a > 0) clockFace(300, 430, 135 * a, seg(t, tHrs, tHrs + 1.0)); chipAt(t, tHrs, 300, 620, 'HOURS', '#ffd23f'); const w0 = W('weeks') - .1; const b = ob(seg(t, w0, w0 + .25)); if (b > 0) { calendar(780, 430, 250, b); chipAt(t, w0, 780, 620, 'WEEKS', '#ffffff'); const k = seg(t, w0 + .2, w0 + .6); if (k > 0) crossX(780, 470, k, 85); } } });
  // 12 guard allies
  sh('sea', tThese - .06, tGl1 - .05, { fov: 50, bloom: .25, cam: t => { const k = ease(seg(t, tThese - .06, tGl1 - .05)); return { p: mix([-26, 12, 120], [-10, 11, 100], k), l: [10, 12, -10] }; },
    fx: (S, t) => { const u = t - tThese; S.dd[0].g.visible = true; S.dd[0].place(-40 + 12 * u, -5, 0, t, 12); S.dd[1].g.visible = true; S.dd[1].place(-10 + 12 * u, -50, 0, t, 12); S.dd[2].g.visible = true; S.dd[2].place(-70 + 12 * u, 30, 0, t, 12); },
    over: t => { chipAt(t, W('allies') - .05, OW / 2, 470, 'ALLIES', '#59d0ff'); } });
  // 13 shipping lanes: container ships under escort
  sh('sea', tGl1 - .05, tTrade - .05, { fov: 52, bloom: .25, cam: t => { const k = ease(seg(t, tGl1 - .05, tTrade - .05)); return { p: mix([-70, 22, 170], [-30, 30, 190], k), l: [20, 8, -20] }; },
    fx: (S, t) => { const u = t - tGl1; for (let i = 0; i < 3; i++) { const c = S.cs[i]; c.g.visible = true; c.place(-70 + 9 * u + i * 40, 30 - 35 * i, 0, t, 9); } S.dd[0].g.visible = true; S.dd[0].place(-20 + 10 * u, 62, 0, t, 10); },
    over: t => { chipAt(t, W('shipping') - .05, OW / 2, 470, 'SHIPPING LANES', '#ffd23f'); } });
  // 14 trade keeps flowing: lanes on the globe
  sh('globe', tTrade - .05, tBut - .06, { fov: 45, bloom: .3, cam: t => GCm([40, 25, 400, .7], [95, 18, 370, .85], seg(t, tTrade - .05, tBut - .06)),
    fx: (S, t) => { const k = eo(seg(t, tTrade - .05, tTrade + .5)); Object.values(S.lanes).forEach(l => l.set(k, t)); },
    over: t => { gchip(t, tTrade + .1, 32.5, 30, 'SUEZ', '#fff', 30, 0, -50); gchip(t, tTrade + .25, 56.3, 26.5, 'HORMUZ', '#fff', 30, 0, -50); gchip(t, tTrade + .4, 101, 2.5, 'MALACCA', '#fff', 30, 0, -50); chipAt(t, tTrade + .45, OW / 2, 440, '≈ 80% OF TRADE GOES BY SEA', '#ffffff', 'rgba(8,10,14,.84)', 34); } });
  // 15 look closer: magnifier dive onto Asia
  sh('globe', tBut - .06, tEvery - .04, { fov: 45, bloom: .3, cam: t => GCm([60, 30, 560, .5], [100, 40, 300, 1], seg(t, tBut - .06, tEvery - .04)), over: t => { lens(t, tBut + .05, tEvery - .04); } });
  // 16a every base is also a message to rivals
  const tMsg = W('message'); const ring = ['humphreys', 'kadena', 'yokosuka', 'guam', 'subic', 'singapore', 'poland', 'romania', 'estonia', 'misawa', 'osan'];
  sh('globe', tEvery - .04, tMsg + .05, { fov: 45, bloom: .3, cam: t => GCm([100, 40, 330, 1], [85, 44, 380, 1], seg(t, tEvery - .04, tMsg + .05)),
    fx: (S, t) => { ring.forEach((k, i) => S.pins[k].set(t, tEvery + i * .05, 10)); },
    over: t => { gchip(t, W('base') + .0, 104, 34, 'CHINA', '#ff6a5a', 40); gchip(t, W('base') + .15, 75, 58, 'RUSSIA', '#ff6a5a', 40); } });
  sh('globe', tMsg + .05, tWere - .06, { fov: 45, bloom: .35, cam: t => GCm([85, 44, 380, 1], [70, 46, 390, 1], seg(t, tMsg + .05, tWere - .06)),
    fx: (S, t) => { ring.forEach((k, i) => S.pins[k].set(t, 0, 10)); S.rivalRings.forEach((r, i) => { r.g.visible = true; const q = ((t * .9 + i * .5) % 1); r.r.material.opacity = (1 - q) * .8; r.r.scale.setScalar(.6 + q * 1.1); });
      ['msgPol', 'msgRom', 'msgEst', 'msgKor', 'msgJp', 'msgGu'].forEach((k, i) => { const kk = eo(seg(t, tMsg + .05 + i * .05, tMsg + .75 + i * .05)); S.arcs[k].set(kk); const e = S.env[i]; const u = ((t - (tMsg + .1)) * .45 + i * .15) % 1; e.position.copy(S.arcs[k].at(u * Math.min(1, kk))); e.visible = kk > .05; }); },
    over: t => { gchip(t, tMsg + .05, 104, 34, 'CHINA', '#ff6a5a', 40); gchip(t, tMsg + .1, 70, 58, 'RUSSIA', '#ff6a5a', 40); const k = seg(t, W('rivals') - .3, W('rivals') + .3); if (k > 0) occ(t, k); } });
  // 17 we're already here
  sh('base', tWere - .06, tAm2 - .06, { fov: 46, bloom: .3, punch: [tWere + .1, .08], cam: t => { const k = ease(seg(t, tWere - .06, tAm2 - .06)); return { p: mix([-8, 1.5, -5.5], [-8, 1.7, -7], k), l: [-8, 2.4, -20] }; },
    fx: (S, t) => { S.fl.us.g.visible = true; for (let i = 0; i < 4; i++) S.jets[i].show(true), S.jets[i].park(-30 + i * 24, -40); },
    chars: t => ({ g0: { p: [-8, 0, -14], s: { arms: 'flag', flagKind: 'us', face: 0, expr: 'smile' } }, g1: { p: [-11.6, 0, -15.5], s: { arms: 'rifle', face: .2 } }, g2: { p: [-4.4, 0, -15.5], s: { arms: 'rifle', face: -.2 } } }),
    over: t => { stamp(t, W('already') - .02, [{ t: 'ALREADY', size: 130 }, { t: 'HERE', c: '#ff4a3a' }], 520, '#ffd23f', -.05, 210, 1.15); } });
  // 18 doesn't just defend its borders
  sh('globe', tAm2 - .06, tIt2 - .06, { fov: 45, bloom: .35, cam: t => GCm([-98, 38, 330, 1], [-96, 40, 400, .8], seg(t, tAm2 - .06, tIt2 - .06)),
    fx: (S, t) => { S.usRing.visible = true; S.pins.dc.set(t, tAm2 - .05, 10); },
    over: t => { shieldX(t, W('defend') - .02, OW / 2, 440, 1); gchip(t, W('borders') - .02, -98, 40, 'ITS OWN BORDERS', '#ffffff', 32, 0, 110); } });
  // 19 parks its power: rows of jets from above
  sh('base', tIt2 - .06, tAround - .04, { fov: 50, bloom: .25, cam: t => { const k = ease(seg(t, tIt2 - .06, tAround - .04)); return { p: mix([-95, 90, -10], [-60, 42, 20], k), l: mix([-50, 0, -56], [-45, 0, -56], k) }; },
    fx: (S, t) => { for (let i = 0; i < 18; i++) { const row = Math.floor(i / 9), col = i % 9; S.jets[i].show(true); S.jets[i].park(-110 + col * 22 + row * 8, -45 - row * 17, -Math.PI / 2); } S.helis.forEach((h, i) => { h.g.visible = true; h.g.position.set(60 + i * 18, 0, -44); h.g.rotation.set(0, -1.57, 0); h.spin(t); }); },
    over: t => { chipAt(t, W('parks') - .05, OW / 2, 470, 'PARKED', '#ffd23f'); } });
  // 20 around the world
  sh('globe', tAround - .04, tTh1 - .06, { fov: 45, bloom: .3, cam: t => GCm([-70, 25, 400, .8], [20, 22, 390, .8], seg(t, tAround - .04, tTh1 - .06)),
    fx: (S, t) => { BASES.forEach((b, i) => S.pins[b[0]].set(t, tAround - .1 + hash(i * 1.7) * .9, 12)); S.pins.dc.set(t, tAround - .1, 12); } });
  // 21 not just defense
  sh('base', tTh1 - .06, tTh2 - .06, { fov: 46, bloom: .3, cam: t => { const k = ease(seg(t, tTh1 - .06, tTh2 - .06)); return { p: mix([-5.5, 1.5, -5.5], [-5.5, 1.7, -7], k), l: [-5.5, 2.6, -20] }; },
    fx: (S, t) => { S.fl.us.g.visible = true; for (let i = 0; i < 4; i++) S.jets[i].show(true), S.jets[i].park(-30 + i * 24, -40); },
    chars: t => ({ g0: { p: [-6.9, 0, -14.5], s: { arms: 'rifle', face: .1, expr: 'angry' } }, g1: { p: [-4.1, 0, -15.5], s: { arms: 'rifle', face: -.2, expr: 'angry' } } }),
    over: t => { shieldX(t, tTh1 + .02, OW / 2, 470, 1); const k = seg(t, W('not', 2), W('not', 2) + .3); if (k > 0) crossX(OW / 2, 470, k, 140); } });
  // 22 dominance
  sh('globe', tTh2 - .06, tFol - .05, { fov: 45, bloom: .4, shake: .004, punch: [W('dominance') - .05, .08], cam: t => GCm([-30, 28, 400, .8], [60, 22, 370, .85], seg(t, tTh2 - .06, tFol - .05)),
    fx: (S, t) => { BASES.forEach((b, i) => S.pins[b[0]].set(t, 0, 12)); S.pins.dc.set(t, 0, 12); S.tint(seg(t, W('dominance') - .1, W('dominance') + .2)); },
    over: t => { stamp(t, W('dominance') - .03, [{ t: 'DOMINANCE', c: '#ff3a2a' }], 560, '#ff3a2a', -.05, 128, 1e9); } });
  // 23 end card
  sh('globe', tFol - .05, END, { fov: 45, bloom: .45, logo: true, cam: t => GCm([60, 22, 400, .85], [120, 18, 420, .8], seg(t, tFol - .05, END)), fx: (S, t) => { BASES.forEach((b, i) => S.pins[b[0]].set(t, 0, 12)); S.pins.dc.set(t, 0, 12); S.tint(1); } });
  FLASHT.push(W('dominance') - .03);
}
function occ(t, k) { const [x1, y1] = gdot(73.6, 35.2), [x2, y2] = gdot(79.2, 35.0); ctx.save(); ctx.globalAlpha = Math.min(1, k * 2); const ch = (x, y, tx, ty, l1, l2, col) => { ctx.strokeStyle = col; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(tx, ty); ctx.stroke(); ctx.fillStyle = col; ctx.beginPath(); ctx.arc(x, y, 7, 0, 7); ctx.fill(); chip(tx, ty - 22, l1, '#fff', 'rgba(8,10,14,.86)', 22); chip(tx, ty + 18, l2, col, 'rgba(8,10,14,.86)', 26); }; ch(x1, y1, x1 - 150, y1 - 170, 'occupied by', 'Pakistan', '#3fe06a'); ch(x2, y2, x2 + 150, y2 - 170, 'occupied by', 'China', '#ff6a5a'); ctx.restore(); }

// ---------- captions ----------
let GROUPS = [];
const EMPH = new Set(['miles', 'distance', 'enemy', 'erase', "nato's", 'japan', 'south', 'grip', 'crisis', 'hours', 'weeks', 'shipping', 'trade', 'message', 'rivals', 'already', 'borders', 'parks', 'world', 'defense', 'dominance', 'follow', 'troops', 'jets', 'supplies', 'allies', 'bases']);
function buildCaptions() {
  const ws = WORDS; let i = 0;
  while (i < ws.length) {
    const g = [ws[i]]; const w0 = ws[i].w;
    if (i + 1 < ws.length && !/[.,?!:]$/.test(w0) && ws[i + 1].a - ws[i].a < .55 && (w0.length + ws[i + 1].w.length) <= 14) { const em = EMPH.has(norm(w0.split(' ')[0])); const em2 = EMPH.has(norm(ws[i + 1].w.split(' ')[0])); if (!(em && em2)) g.push(ws[i + 1]); }
    GROUPS.push({ txt: g.map(x => x.w).join(' ').replace(/[,.]$/, '').replace(/[?!]$/, m => m), a: g[0].a, last: g[g.length - 1], em: g.some(x => EMPH.has(norm(x.w.split(' ')[0]))) });
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
  const aR = W('redrawnstories') - .05;
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
  const hk = eo(seg(t, aR + .3, aR + .75));
  if (hk > 0) { ctx.globalAlpha = fade * hk; ctx.font = '800 66px Montserrat'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round'; ctx.lineWidth = 9; ctx.strokeStyle = '#000'; const yy = 1130 + (1 - hk) * 30; ctx.strokeText('@redrawn.stories', cx, yy); ctx.fillStyle = '#ffffff'; ctx.fillText('@redrawn.stories', cx, yy); }
  const f0 = W('for') - .05, press = W('global', 2) + .15; const bk = ob(seg(t, f0, f0 + .4));
  if (bk > 0) {
    const pressed = t > press; const pk = 1 - .1 * Math.sin(Math.PI * seg(t, press - .08, press + .2)); const bw = 440 * bk * pk, bh = 124 * bk * pk; ctx.globalAlpha = fade; const by = 1500;
    ctx.fillStyle = pressed ? '#3a3f48' : '#0095f6'; ctx.beginPath(); ctx.roundRect(cx - bw / 2, by - bh / 2, bw, bh, 28); ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = 'rgba(0,0,0,.55)'; ctx.stroke();
    ctx.fillStyle = '#fff'; ctx.font = `800 ${Math.round(60 * bk * pk)}px Montserrat`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(pressed ? 'Following ✓' : 'Follow', cx, by + 3);
    // tapping hand (cartoon): slides in, taps, retreats
    const hin = eo(seg(t, press - .9, press - .15)) * (1 - eo(seg(t, press + .35, press + .9))); if (hin > 0) { const tap = Math.sin(Math.PI * seg(t, press - .12, press + .12)); const hx = cx + 90 + (1 - hin) * 260, hy = by + 70 + (1 - hin) * 260 - tap * -14; ctx.save(); ctx.translate(hx, hy); ctx.rotate(-.35); ctx.fillStyle = '#f6d7b0'; ctx.strokeStyle = '#2a1a12'; ctx.lineWidth = 8; ctx.lineJoin = 'round'; ctx.beginPath(); ctx.roundRect(-34, -20, 68, 120, 30); ctx.fill(); ctx.stroke(); ctx.beginPath(); ctx.roundRect(-18, -86, 36, 90, 18); ctx.fill(); ctx.stroke(); ctx.restore(); }
    if (t > press - .1 && t < press + .6) { const r = seg(t, press - .1, press + .6); ctx.strokeStyle = `rgba(255,255,255,${1 - r})`; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(cx + 80, by + 8, 30 + r * 90, 0, 7); ctx.stroke(); }
  }
  ctx.restore();
}
let FLASH = [];
function render(t) {
  const shot = SHOTS.find(s => t >= s.a && t < s.b) || SHOTS[SHOTS.length - 1];
  const S = getSet(shot.set);
  cam.fov = shot.fov || 45;
  const c = shot.cam(t); cam.position.set(...c.p); cam.lookAt(V(c.l));
  if (shot.punch) { const p = seg(t, shot.punch[0], shot.punch[0] + .1) * (1 - seg(t, shot.punch[0] + .1, shot.punch[0] + .55)); cam.fov *= 1 - shot.punch[1] * eo(p); }
  cam.fov *= 1 + .06 * (1 - eo(seg(t, shot.a, shot.a + .2)));
  cam.updateProjectionMatrix(); cam.lookAt(V(c.l));
  if (shot.shake) { cam.position.x += Math.sin(t * 37) * shot.shake * 40; cam.position.y += Math.cos(t * 29) * shot.shake * 40; cam.lookAt(V(c.l)); }
  if (shot.shakeAfter && t > shot.shakeAfter) { const k = Math.max(0, 1 - (t - shot.shakeAfter) / .8); cam.position.x += Math.sin(t * 61) * .35 * k; cam.position.y += Math.cos(t * 47) * .35 * k; cam.lookAt(V(c.l)); }
  cam.updateMatrixWorld();
  S.reset && S.reset();
  S.update(t, cam);
  if (shot.fx) shot.fx(S, t);
  const cs = shot.chars ? shot.chars(t) : {};
  for (const [k, ch] of Object.entries(S.chars || {})) { const q = cs[k]; if (!q) { ch.mesh.visible = ch.shadow.visible = false; continue; } ch.set(V(q.p), { ...q.s, t }, cam); }
  rp.scene = S.scene || S; bloom.strength = shot.bloom ?? .3;
  composer.render();
  ctx.globalAlpha = 1; ctx.drawImage(renderer.domElement, 0, 0, OW, OH);
  const vg = ctx.createRadialGradient(OW / 2, OH * .48, OH * .36, OW / 2, OH * .5, OH * .8); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.28)'); ctx.fillStyle = vg; ctx.fillRect(0, 0, OW, OH);
  ctx.save(); ctx.globalAlpha = .05; ctx.globalCompositeOperation = 'overlay'; const ox = Math.floor(hash(Math.floor(t * 30)) * 256), oy = Math.floor(hash(Math.floor(t * 30) + 5) * 256); ctx.translate(-ox, -oy); ctx.fillStyle = ctx.createPattern(noise, 'repeat'); ctx.fillRect(0, 0, OW + 256, OH + 256); ctx.restore();
  if (shot.over && !window.NOOVER) shot.over(t);
  for (const f of FLASH) { const a = 1 - seg(t, f, f + .18); if (t >= f && a > 0) { ctx.fillStyle = `rgba(255,255,255,${a * .55})`; ctx.fillRect(0, 0, OW, OH); } }
  const fin = t < .25 ? 1 - t / .25 : 0; if (fin > 0) { ctx.fillStyle = `rgba(0,0,0,${fin})`; ctx.fillRect(0, 0, OW, OH); }
  if (shot.logo) drawLogo(t);
  if (t < W('redrawnstories') - .05 && !window.NOCAP) drawCaption(t);
}
window.setup = async (tl) => {
  TL = tl; WORDS = tl.words;
  for (const f of ['800 76px Montserrat', '900 76px Montserrat', 'bold 40px Montserrat']) await document.fonts.load(f);
  LOGO = new Image(); LOGO.src = 'logo.png'; await LOGO.decode(); await loadWorld();
  Object.keys(B).forEach(getSet);
  buildShots(); buildCaptions();
  FLASH = [W('erase') - .05, W('crisis') - .05, W('anchor') + .9, W('message'), W('already') - .05, ...FLASHT];
  return SHOTS.map(s => [s.set, +s.a.toFixed(2), +s.b.toFixed(2)]);
};
window.render = render; window.DBG = { SETS, cam, get SHOTS() { return SHOTS; } }; window.ready = true;
