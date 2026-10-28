import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { buildKashmir, xr } from './kash.js';
import { buildMap, loadMaps } from './kmap.js';
import { buildGlacier, buildWater, buildStage } from './ksets.js';
import { heliFly } from './kcommon.js';
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
const B = { kash: buildKashmir, map: buildMap, glac: buildGlacier, water: buildWater, stage: buildStage };
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

// ---------- shots ----------
let SHOTS = [];
const A_STAGE = { cx: 0 };
function buildShots() {
  const sh = (set, a, b, o) => SHOTS.push({ set, a, b, ...o });
  let R, Kc; const LN = () => SETS.kash.line; const RG = () => SETS.kash.ridge; const SMT = () => SETS.kash.summit;
  const LNcam = (k, dx = 0, dy = 0, dz = 0) => { const L = LN(); return { p: [L.x - 4 + dx, 1.55 + dy, L.z + 9.5 - k * 2.2 + dz], l: [L.x - 4, 1.7, L.z - 10] }; };
  const LNch = (o = {}) => { const L = LN(); return { a0: { p: [L.x - 5.0, 0, L.z + 2.6], s: { arms: 'rifle', face: .5, ...(o.a || {}) } }, a1: { p: [L.x - 2.8, 0, L.z - 2.4], s: { arms: 'rifle', face: -.5, ...(o.b || {}) } } }; };
  const t_fight = W('fight');
  // 1 hook: aerial flyover
  const c2 = W('both') - .08;
  sh('kash', 0, c2, { fov: 62, bloom: .25, punch: [W('valley'), .05], cam: t => { const k = ease(t / c2); return { p: [mix([70, 150, 330], [-10, 62, -30], k)].flat(), l: [-10, 70 - 20 * k, -520] }; } });
  // 2 face-off at the line
  const c3 = W('This') - .06;
  sh('kash', c2, c3, { fov: 50, bloom: .2, punch: [t_fight, .06], cam: (t) => LNcam(ease(seg(t, c2, c3))), chars: t => LNch({ a: { expr: 'angry' }, b: { expr: 'angry' } }), shake: .003 });
  // 3 this is Kashmir - map zoom
  const c4 = W('In') - .06;
  sh('map', c3, c4, { fov: 46, bloom: .3, cam: t => { const k = ease(seg(t, c3, c4)); return { p: [mix([4, 26, 18], [-1.2, 8.5, 2.6], k)].flat(), l: [mix([0, 0, 0], [-1.0, 0, -2.2], k)].flat() }; },
    fx: (S, t) => { S.pins.kash.set(t, W('Kashmir', 1)); }, over: t => { stamp(t, W('Kashmir', 1) - .02, ['KASHMIR'], 430, '#ffd23f', -.05, 185); } });
  // 4 1947 year
  const c5 = W('split') - .1;
  sh('map', c4, c5, { fov: 46, bloom: .3, cam: t => { const k = ease(seg(t, c4, c5)); return { p: [mix([-3, 28, 20], [0, 22, 14], k)].flat(), l: [0, 0, 2 - 2 * k] }; },
    fx: (S, t) => { S.pins.kash.set(t, -1); S.pins.del.set(t, 1e9); }, over: t => { stamp(t, W('1947') - .02, ['1947'], 520, '#ffd23f', -.06, 260); chipAt(t, W('Britain') - .1, OW / 2, 800, 'BRITISH RAJ ENDS', '#ffffff'); } });
  // 5 split line
  const c6 = W('undecided') - .12;
  sh('map', c5, c6, { fov: 46, bloom: .3, cam: t => { const k = ease(seg(t, c5, c6)); return { p: [mix([-2, 24, 13], [1, 18, 8], k)].flat(), l: [0, 0, 1 - k * 1.2] }; },
    fx: (S, t) => { S.pins.kash.set(t, -1); S.reveal(S.partW, seg(t, W('split'), W('in', 2) + .5), t); },
    over: t => { stamp(t, W('split') + .25, [{ t: 'SPLIT', c: '#ff4a3a' }], 330, '#ff4a3a', -.08, 130, 1.4); } });
  // 6 undecided
  const c7 = W('Within') - .06;
  sh('map', c6, c7, { fov: 46, bloom: .3, cam: t => { const k = ease(seg(t, c6, c7)); return { p: [mix([82, 12, 9], [79.4, 10.5, 5.5], k)].flat(), l: [mix([80, 0, 1], [79.3, 0, -.3], k)].flat() }; },
    fx: (S, t) => { const q = S.q; const c = S.close; const p = c.P(75.2, 34.5, 2.6 + Math.sin(t * 3) * .25); q.visible = true; q.position.copy(p); q.scale.setScalar(3.2 * ob(seg(t, c6, c6 + .3))); S.pins.cKash.set(t, c6 - 2); },
    over: t => chipAt(t, W('undecided') - .1, OW / 2, 520, 'UNDECIDED', '#ffd23f') });
  // 7a/b war: jets cross, then explosions
  const c8 = W('India', 2) + .5, c8b = W('war') - .05;
  const jp1 = t => [-30 + (t - c7) * 12, 85 - (t - c7) * 10, -330 + (t - c7) * 235];
  const jp2 = t => [38 - (t - c7) * 14, 100 - (t - c7) * 10, -380 + (t - c7) * 245];
  sh('kash', c7, c8, { fov: 60, bloom: .25, cam: t => { const j = jp1(t), q = jp2(t); return { p: [0, 30, 30], l: [(j[0] + q[0]) / 2, (j[1] + q[1]) / 2 + 4, (j[2] + q[2]) / 2] }; }, fx: (S, t) => { S.jets[0].fly(t, jp1); S.jets[1].fly(t, jp2); }, over: t => { chipAt(t, W('Within') + .1, OW / 2, 480, '1947–48', '#ffd23f'); } });
  const c9 = W('then') - .06;
  const jq1 = t => [-20 + (t - c8) * 6, 70 + (t - c8) * 22, 20 - (t - c8) * 250], jq2 = t => [25 - (t - c8) * 8, 80 + (t - c8) * 25, 40 - (t - c8) * 255];
  sh('kash', c8, c9, { fov: 58, bloom: .3, shake: .006, cam: t => ({ p: [-10, 48, 110], l: [0, 72 + (t - c8) * 12, -170] }), fx: (S, t) => { S.jets[0].fly(t, jq1); S.jets[1].fly(t, jq2); S.expl[0].update(t, c8 + .1); S.expl[1].update(t, c8 + .4); S.expl[2].update(t, W('war') + .0); S.expl[3].update(t, W('war') + .25); } });
  // 8 then again and again: 3 micro cuts
  const m1 = c9, m2 = c9 + (W('again', 2) - c9) * .34, m3 = c9 + (W('again', 2) - c9) * .66, m4 = W('In', 3) - .06;
  const tkx = t => -62 + 12 * (t - m1);
  sh('kash', m1, m2, { fov: 52, bloom: .25, shake: .004, cam: t => ({ p: [tkx(t) + 12, 2.4, 150 + (t - m1) * 2], l: [tkx(t) + 1, 1.9, 130] }), fx: (S, t) => { const x = tkx(t), z = 130; S.tank.drive(x, S.h(x, z) + .02, z, 12 * (t - m1), (t - m1 > .25 && t - m1 < .38) ? 1 : 0); S.expl[4].update(t, m1 + .3); }, over: t => stamp(t, m1, ['1965'], 520, '#ffd23f', -.05, 220, .6) });
  sh('kash', m2, m3, { fov: 58, bloom: .3, shake: .008, cam: t => ({ p: [30, 30, 70], l: [0, 70, -200] }), fx: (S, t) => { S.jets[0].fly(t, u => [-80 + (u - m2) * 70, 60 + (u - m2) * 20, -240 + (u - m2) * 320]); S.jets[1].fly(t, u => [95 - (u - m2) * 75, 80, -260 + (u - m2) * 330]); S.expl[1].update(t, m2 + .1); S.expl[3].update(t, m2 + .3); }, over: t => stamp(t, m2, ['1971'], 520, '#ffd23f', .05, 220, .6) });
  sh('kash', m3, m4, { fov: 52, bloom: .3, shake: .005, cam: t => LNcam(.5, 5, .5, 3), chars: t => { const L = LN(); const u = t - m3; return { a0: { p: [L.x - 5.0, 0, L.z + 3.5 - u * 2.4], s: { arms: 'rifle', back: true, walk: true } }, a2: { p: [L.x - 2.6, 0, L.z + 5.0 - u * 2.1], s: { arms: 'rifle', back: true, walk: true } } }; }, fx: (S, t) => { S.expl[5].update(t, m3 + .15); }, over: t => stamp(t, m3, [{ t: 'KARGIL', size: 120 }, { t: '1999', size: 220 }], 540, '#ffd23f', -.05, 140, .7) });
  // 9 1972
  const c10 = W('froze') - .15;
  sh('kash', m4, c10, { fov: 50, bloom: .2, cam: t => { const k = ease(seg(t, m4, c10)); return LNcam(k, 4 - k * 4, .1); }, chars: t => LNch(), over: t => { stamp(t, W('1972') - .02, ['1972'], 520, '#ffd23f', -.05, 230); chipAt(t, W('1972') + .35, OW / 2, 760, 'SIMLA AGREEMENT', '#ffffff'); } });
  // 10 froze into a line
  const c11 = W('The', 2) - .06;
  sh('kash', c10, c11, { fov: 52, bloom: .3, cam: t => { const L = LN(); const k = ease(seg(t, c10, c11)); return { p: [L.x + 12 - k * 4, 10 - k * 5.5, L.z + 14 - k * 3], l: [L.x - 5, 0, L.z - 2] }; }, chars: t => LNch({ a: { expr: 'tired' }, b: { expr: 'tired' } }), fx: (S, t) => { S.locGlow.material.opacity = .6 * eo(seg(t, W('froze'), W('line') + .1)) * (.75 + .25 * Math.sin(t * 9)); }, over: t => frost(t, W('froze') - .05, c11) });
  // 11 line of control on the close map
  const c12 = W('not') - .06;
  sh('map', c11, c12, { fov: 46, bloom: .35, cam: t => { const k = ease(seg(t, c11, c12)); return { p: [mix([80.5, 14, 10], [79, 12.4, 6.5], k)].flat(), l: [mix([79.5, 0, -1], [78.2, 0, -1.3], k)].flat() }; }, fx: (S, t) => { S.reveal(S.locC, seg(t, c11 + .1, c12 - .1), t); S.pins.cKash.set(t, -1); }, over: t => { chipAt(t, W('control', 1) - .2, OW / 2, 480, 'LINE OF CONTROL', '#ff6a5a'); chipAt(t, W('control', 1) + .1, OW / 2, 590, '≈ 740 km', '#ffffff'); } });
  // 12 not a border, ceasefire
  const c13 = W('But') - .06;
  sh('kash', c12, c13, { fov: 52, bloom: .25, cam: t => { const k = ease(seg(t, c12, c13)); return LNcam(k * .6, -5 + k * 5, 0, -1); }, chars: t => LNch(),
    over: t => { const k = seg(t, W('border') - .1, W('border') + .5); chipAt(t, W('border') - .25, OW / 2, 520, 'NOT A BORDER', '#ffffff'); if (k > 0) crossX(OW / 2 - 262, 520, k, 34); chipAt(t, W('ceasefire') - .05, OW / 2, 700, 'CEASEFIRE', '#ffd23f'); } });
  // 13 but why
  const c14 = W('so', 1) + .1;
  sh('kash', c13, c14, { fov: 54, bloom: .25, cam: t => { const k = ease(seg(t, c13, c14)); return { p: [mix([143, 2.1, 85], [142.6, 2.0, 80], k)].flat(), l: [142.4, 2.5, 70] }; }, chars: t => ({ b0: { p: [141.3, 0, 73.5], s: { arms: 'chin', expr: 'worried' } }, b1: { p: [144.1, 0, 74.5], s: { arms: 'gesture', expr: 'worried' } } }), over: t => { const k = ob(seg(t, W('why'), W('why') + .3)); if (k > 0) { ctx.save(); ctx.translate(OW / 2, 520); ctx.scale(k, k); ctx.font = '900 360px Montserrat'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineWidth = 36; ctx.lineJoin = 'round'; ctx.strokeStyle = '#0a0a0a'; ctx.strokeText('?', 0, 0); ctx.fillStyle = '#ffd23f'; ctx.fillText('?', 0, 0); ctx.restore(); } } });
  const c15 = W('Water') + .3;
  sh('kash', c14, W('Water') - .02, { fov: 58, bloom: .25, punch: [W('much'), .08], cam: t => ({ p: [mix([100, 60, 70], [20, 30, -40], ease(seg(t, c14, W('Water'))))].flat(), l: [-10, 30, -400] }) });
  // WATER slam: dam spill
  sh('water', W('Water') - .02, c15 + .8, { fov: 60, bloom: .35, shake: .006, cam: t => { const k = ease(seg(t, W('Water'), c15 + .8)); return { p: [0, 7 + k * 3, 70 - k * 8], l: [0, 20, -25] }; }, over: t => stamp(t, W('Water') - .02, [{ t: 'WATER', c: '#59d0ff' }], 520, '#59d0ff', -.05, 230) });
  // rivers
  const c16 = W('flow') - .05;
  sh('map', c15 + .8, c16, { fov: 46, bloom: .35, cam: t => { const k = ease(seg(t, c15 + .8, c16)); return { p: [mix([82.5, 11, 8], [80, 9, 4], k)].flat(), l: [mix([80.5, 0, -.5], [79.2, 0, -1.2], k)].flat() }; }, fx: (S, t) => { S.flowSet(1, t); S.pins.cKash.set(t, -1); }, over: t => { const c = SETS.map.close; const pts = [['INDUS', 77.0, 33.9, '#59d0ff', 'Indus'], ['JHELUM', 73.8, 33.9, '#9be3ff', 'rivers'], ['CHENAB', 75.6, 32.5, '#59d0ff', 'feed']]; pts.forEach(([n, lo, la, col, wd]) => { const [x, y] = projV(c.P(lo, la, 1)); chipAt(t, W(wd) + (n === 'INDUS' ? -.05 : .0), x, y, n, col, 'rgba(8,10,14,.84)', 34); }); } });
  const c17 = W('For', 2) - .05;
  sh('kash', c16, c17, { fov: 55, bloom: .25, cam: t => { const k = (t - c16) * 40; const z = -420 - k; return { p: [xr(z) + 6, 16 - ease(seg(t, c16, c17)) * 7, z + 30], l: [xr(z - 60), 10, z - 60] }; } });
  // Pakistan: farms, cities
  const c18 = W('farms') + .55;
  const tractorX = t => -50 + 4.5 * (t - c17);
  sh('water', c17, c18, { fov: 55, bloom: .2, cam: t => { const k = ease(seg(t, c17, c18)); const x = tractorX(t) - 20; return { p: [x - 8 + k * 2, 3.4 - k * .8, 236], l: [x + 2, 1.8, 252] }; }, fx: (S, t) => { const z = 252, x = tractorX(t) - 20; S.tractor.drive(x, 0, z, 4.5 * (t - c17), 0); S.tractor2.drive(-110 + 5.0 * (t - c17), 0, 262, 5.0 * (t - c17), 0); },
    chars: t => { const x = tractorX(t) - 20; return { f0: { p: [x + 9, 0, 246], s: { arms: 'cheer', expr: 'happy' } }, f1: { p: [x + 12, 0, 249], s: { arms: 'raise', expr: 'happy' } } }; }, over: t => { chipAt(t, W('farms') - .1, OW / 2, 480, 'FARMS', '#9be86a'); } });
  const c19 = W('For', 4) - .05;
  sh('water', c18, c19, { fov: 55, bloom: .25, cam: t => { const k = ease(seg(t, c18, c19)); return { p: [mix([-20, 20, 380], [-12, 36, 440], k)].flat(), l: [mix([-10, 30, 520], [-10, 50, 520], k)].flat() }; }, over: t => chipAt(t, W('cities') - .1, OW / 2, 480, 'CITIES', '#ffd23f') });
  // India: power / irrigation
  const c20 = W('and', 5) - .05;
  sh('water', c19, c20, { fov: 55, bloom: .3, cam: t => { const k = ease(seg(t, c19, c20)); return { p: [mix([-70, 5, 60], [-30, 14, 70], k)].flat(), l: [mix([-45, 20, -20], [-10, 24, -30], k)].flat() }; }, over: t => { chipAt(t, W('power') - .1, OW / 2, 470, 'POWER', '#ffd23f'); chipAt(t, W('irrigation') - .1, OW / 2, 580, 'IRRIGATION', '#59d0ff'); } });
  const c21 = W('Location') - .08;
  sh('water', c20, c21, { fov: 50, bloom: .3, cam: t => { const k = ease(seg(t, c20, c21)); return { p: [mix([30, 49.5, -18], [31.5, 47, -14], k)].flat(), l: [30, 45.5, -25] }; }, chars: t => ({ op: { p: [28.2, 40.8, -21], s: { arms: 'gesture', expr: 'smile' } } }), over: t => { chipAt(t, W('control', 2) - .1, OW / 2, 480, 'UPSTREAM', '#ffd23f'); } });
  // LOCATION
  const c22 = W('Kashmir', 4) - .08;
  sh('map', c21, c22, { fov: 46, bloom: .3, cam: t => { const k = ease(seg(t, c21, c22)); return { p: [mix([-1.5, 14, 9], [-1, 11, 6], k)].flat(), l: [-1, 0, -2] }; }, fx: (S, t) => { S.pins.kash.set(t, W('Location') + .02); }, over: t => stamp(t, W('Location') - .02, ['LOCATION'], 430, '#ffd23f', -.05, 150) });
  // meets: arrows
  const c23 = W('Afghanistan') - .12, c24 = W('Whoever') - .06;
  const arrowsFx = (S, t) => { S.pins.kash.set(t, -1); S.arr.sa.set(eo(seg(t, W('South'), W('South') + .5))); S.arr.cn.set(eo(seg(t, W('China', 1), W('China', 1) + .4))); S.arr.af.set(eo(seg(t, W('Afghanistan'), W('Afghanistan') + .4))); S.arr.ca.set(eo(seg(t, W('Central'), W('Central') + .4))); S.mflags.cn.g.visible = t > W('China', 1); S.mflags.in.g.visible = t > W('South'); S.mflags.pk.g.visible = t > W('Afghanistan') - .6; };
  const arrOver = t => { const w = SETS.map.wide; const lab = (txt, lon, lat, t0, col) => { const [x, y] = projV(w.P(lon, lat, 1)); chipAt(t, t0, x, y, txt, col, 'rgba(8,10,14,.84)', 34); }; lab('SOUTH ASIA', 77.5, 26, W('South') + .1, '#ff9933'); lab('CHINA', 87, 38, W('China', 1) + .1, '#ff6a5a'); lab('AFGHANISTAN', 65, 36.6, W('Afghanistan') + .1, '#ffd23f'); lab('CENTRAL ASIA', 72, 42.4, W('Central') + .1, '#59d0ff'); };
  sh('map', c22, c23, { fov: 48, bloom: .3, cam: t => { const k = ease(seg(t, c22, c23)); return { p: [mix([-.5, 24, 12], [0, 22, 10], k)].flat(), l: [0, 0, -2.5] }; }, fx: arrowsFx, over: arrOver });
  sh('map', c23, c24, { fov: 48, bloom: .3, cam: t => { const k = ease(seg(t, c23, c24)); return { p: [mix([0, 21, 11], [1.5, 17, 9], k)].flat(), l: [mix([0, 0, -2.5], [-1, 0, -3], k)].flat() }; }, fx: arrowsFx, over: arrOver });
  // high ground
  const c25 = W('from') - .05;
  sh('kash', c24, c25, { fov: 52, bloom: .25, punch: [W('high'), .06], cam: t => { const S0 = SMT(); const k = ease(seg(t, c24, c25)); return { p: [S0.x + 8 - k * 3, S0.y + .2 + k * 2.4, S0.z + 10 - k * 1], l: [S0.x, S0.y + 2.6 + k * .6, S0.z] }; }, chars: t => { const S0 = SMT(); return { a2: { p: [S0.x, S0.y, S0.z + .5], s: { arms: 'flag', flagKind: 'in', face: -.3, expr: 'smile' } } }; }, over: t => chipAt(t, W('high') - .1, OW / 2, 440, 'THE HIGH GROUND', '#ffd23f') });
  // Siachen
  const c26 = W('to', 2) - .08;
  const hpath = t => { const u = eo(seg(t, c25 - 1.0, c26 - .2)); return mix([46, 24, -92], [16, .25, -46], u); };
  sh('glac', c25, c26, { fov: 56, bloom: .25, cam: t => { const k = ease(seg(t, c25, c26)); return { p: [mix([-6, 2.4, -17], [-5, 2.2, -19], k)].flat(), l: [mix([6, 4.2, -42], [9, 3.6, -42], k)].flat() }; }, fx: (S, t) => { heliFly(S.heli, t, hpath); },
    chars: t => ({ s0: { p: [1, 0, -29], s: { arms: 'rifle', face: .4 } }, s1: { p: [5, 0, -31], s: { arms: 'down', expr: 'tired' } }, s3: { p: [-3, 0, -30], s: { arms: 'flag', flagKind: 'in', expr: 'smile', face: .3 } } }),
    over: t => { const k = seg(t, W('Siachen'), W('highest') + .5); chipAt(t, W('Siachen') - .05, OW / 2, 470, 'SIACHEN GLACIER', '#59d0ff'); if (k > 0) { const alt = Math.round(3600 + 1400 * eo(k)); bigNum(OW / 2, 700, alt >= 5000 ? '5,000+ m' : alt.toLocaleString('en-US') + ' m', 'ALTITUDE', '#ffffff'); thermo(930, 640, eo(seg(t, W('world\'s'), W('battlefield') + .3))); ctx.fillStyle = '#5ec8ff'; ctx.font = '900 46px Montserrat'; ctx.textAlign = 'center'; ctx.fillText('−50°C', 930, 860); } } });
  // passes below: convoy descending the mountain road (nose-first, wheels spin with distance)
  const c27 = W('and', 7) - .06;
  sh('kash', c26, c27, { fov: 54, bloom: .2, cam: t => { const S = SETS.kash; const d = 16 * (t - c26) + 40; const p = S.roadP(Math.max(0, 1 - d / S.roadL)); return { p: [p[0] - 26, p[1] + 9, p[2] + 32], l: [p[0], p[1] + 2.5, p[2]] }; }, fx: (S, t) => { const d = 16 * (t - c26) + 40; for (let i = 0; i < 3; i++) S.jeepAt(i, d - i * 14); } });
  // identity
  const c28 = W('For', 5) - .06;
  sh('kash', c27, c28, { fov: 54, bloom: .25, cam: t => { const k = ease(seg(t, c27, c28)); return { p: [mix([152, 2.0, 74], [150, 2.1, 70], k)].flat(), l: [150, 2.5, 58] }; }, chars: t => ({ v0: { p: [150, 0, 62], s: { arms: 'mug' } }, b2: { p: [147.6, 0, 63], s: { arms: 'down', expr: 'smile' } }, b3: { p: [152.5, 0, 62.5], s: { arms: 'gesture', expr: 'smile' } } }), over: t => stamp(t, W('identity') - .02, ['IDENTITY'], 430, '#ffd23f', -.05, 175) });
  // crown
  const c29 = W('For', 6) - .06;
  sh('stage', c28, c29, { fov: 46, bloom: .4, punch: [W('crown'), .06], cam: t => { const k = ease(seg(t, c28, c29)); return { p: [mix([-.2, 2.1, 7.4], [.2, 1.9, 5.8], k)].flat(), l: [-.4, 1.7, 0] }; }, chars: t => ({ ind: { p: [-1.9, 0, 0], s: { arms: 'point', face: .7, expr: 'smirk' } } }), over: t => { chipAt(t, W('crown') - .1, OW / 2, 380, 'WON’T GIVE UP', '#ff9933'); } });
  // story of birth
  const c30 = W('unfinished') - .1;
  sh('stage', c29, c30, { fov: 44, bloom: .3, cam: t => { const k = ease(seg(t, c29, c30)); return { p: [mix([100.3, 2.6, 8.6], [99.6, 2.4, 7.4], k)].flat(), l: [99.2, 1.7, 0] }; }, fx: (S, t) => { S.bookDraw(0, t); }, chars: t => ({ pak: { p: [97.6, 0, -.2], s: { arms: 'chin', expr: 'worried', face: .5 } } }) });
  const c31 = W('Add') - .06;
  sh('stage', c30, c31, { fov: 44, bloom: .3, cam: t => { const k = ease(seg(t, c30, c31)); return { p: [mix([100.2, 2.9, 5.6], [100.1, 2.6, 4.6], k)].flat(), l: [100, 1.7, .2] }; }, fx: (S, t) => { S.bookDraw(eo(seg(t, c30, c31 - .15)), t); S.pen.position.set(100.9, 2.1, 1.0); S.pen.rotation.set(-.4, 0, -.7); }, chars: t => ({ pak: { p: [97.6, 0, -.2], s: { arms: 'chin', expr: 'worried', face: .5 } } }), over: t => chipAt(t, W('unfinished') + .1, OW / 2, 470, 'UNFINISHED', '#ffffff') });
  // Aksai Chin
  const c32 = W('three') - .08;
  sh('map', c31, c32, { fov: 46, bloom: .4, cam: t => { const k = ease(seg(t, c31, c32)); return { p: [mix([84.5, 10, 7], [86, 8, 3.4], k)].flat(), l: [mix([84.5, 0, -.6], [85.6, 0, -1.8], k)].flat() }; }, fx: (S, t) => { S.pins.cAks.set(t, W('Aksai Chin') - .1); S.mflags.ccn.g.visible = t > W('China', 2) + .1; }, over: t => { chipAt(t, W('Aksai Chin') + .1, OW / 2, 470, 'AKSAI CHIN', '#ff6a5a'); } });
  // three nuclear powers
  const c33 = W('with') - .06;
  sh('map', c32, c33, { fov: 48, bloom: .45, cam: t => { const k = ease(seg(t, c32, c33)); return { p: [mix([0, 24, 13], [-.5, 17, 7], k)].flat(), l: [mix([0, 0, -1], [-.5, 0, -2], k)].flat() }; }, fx: (S, t) => { S.pins.kash.set(t, -1); S.nuke.in.set(t, W('three')); S.nuke.pk.set(t, W('nuclear')); S.nuke.cn.set(t, W('powers') - .1); }, over: t => stamp(t, W('three') - .02, [{ t: '3', size: 260 }, { t: 'NUCLEAR POWERS', size: 92 }], 540, '#ff4a3a', -.05, 200, 3.2) });
  // millions of people
  const c34 = W('So', 2) - .06;
  sh('kash', c33, c34, { fov: 55, bloom: .25, cam: t => { const k = ease(seg(t, c33, c34)); return { p: [mix([160, 3, 130], [150, 22, 140], k)].flat(), l: [150, mix([4, 6], [3, 6], k)[0], 55] }; }, fx: (S, t) => { S.cr.list.forEach(s => s.visible = true); }, chars: t => ({ b0: { p: [140, 0, 78], s: { arms: 'raise', expr: 'happy' } }, b2: { p: [160, 0, 76], s: { arms: 'cheer', expr: 'happy' } }, v1: { p: [150, 0, 84], s: { arms: 'cheer', expr: 'happy' } } }) });
  // bridge
  const c35 = W('or') - .04;
  sh('kash', c34, c35, { fov: 50, bloom: .4, cam: t => { const b = SETS.kash.bridge; const k = ease(seg(t, c34, c35)); return { p: [b.x - 26 + k * 6, 3.8 + k * .8, b.z + 11 - k * 3], l: [b.x + 4, 4.2, b.z] }; }, fx: (S, t) => { const b = S.bridge; const u = (t - c34) / (c35 - c34); S.dove.set(t, [b.x - 14 + 38 * u, 6.2 + .9 * Math.sin(u * 7), b.z + 3.5 - u * .5], 0); }, chars: t => { const b = SETS.kash.bridge; return { peace: { p: [b.x + 6, 3.0, b.z + .3], s: { arms: 'raise', expr: 'happy' } } }; } });
  // fuse
  const c36 = W('Follow') - .05, boom = c36 - .55;
  sh('kash', c35, c36, { fov: 52, bloom: .4, cam: t => { const f = SETS.kash.fuse; const k = ease(seg(t, c35, c36)); return { p: [mix([f.x + 6, 2.2, f.z - 2], [f.x + 8, 3.2, f.z - 20], k)].flat(), l: [mix([f.x - 3, 1.8, f.z - 24], [f.x - 3, 2.6, f.z - 26], k)].flat() }; }, shakeAfter: boom, fx: (S, t) => { const sb = seg(t, c35 + .2, boom - .02); S.fuseSet(sb, t < boom ? 1 : 0); S.bomb.visible = t < boom; S.blast.update(t, boom); } });
  sh('kash', c36, TL.duration, { fov: 52, bloom: .45, logo: true, cam: t => ({ p: [mix([-140, 120, 260], [-60, 96, 200], ease(seg(t, c36, TL.duration)))].flat(), l: [-40, 30, -200] }) });
  FLASHT.push(boom);
}
let FLASHT = [];
// ---------- captions ----------
let GROUPS = [];
const EMPH = new Set(['kashmir', 'valley', 'fight', '1947', '1972', 'split', 'war', 'line', 'control', 'border', 'ceasefire', 'water', 'rivers', 'indus', 'lifeline', 'power', 'irrigation', 'upstream', 'location', 'mountains', 'high', 'siachen', 'highest', 'battlefield', 'identity', 'crown', 'unfinished', 'birth', 'aksai', 'three', 'nuclear', 'millions', 'bridge', 'peace', 'fuse', 'conflict', 'follow', 'undecided', 'nations', 'again', 'never', 'drawn']);
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
  const f0 = W('Stories') - .1, press = W('The', 11) + .55; const bk = ob(seg(t, f0, f0 + .4));
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
  if (shot.over) shot.over(t);
  for (const f of FLASH) { const a = 1 - seg(t, f, f + .18); if (t >= f && a > 0) { ctx.fillStyle = `rgba(255,255,255,${a * .55})`; ctx.fillRect(0, 0, OW, OH); } }
  const fin = t < .25 ? 1 - t / .25 : 0; if (fin > 0) { ctx.fillStyle = `rgba(0,0,0,${fin})`; ctx.fillRect(0, 0, OW, OH); }
  if (shot.logo) drawLogo(t);
  if (t < W('Follow') - .02 && !window.NOCAP) drawCaption(t);
}
window.setup = async (tl) => {
  TL = tl; WORDS = tl.words;
  for (const f of ['800 76px Montserrat', '900 76px Montserrat', 'bold 40px Montserrat']) await document.fonts.load(f);
  LOGO = new Image(); LOGO.src = 'logo.png'; await LOGO.decode(); await loadMaps();
  Object.keys(B).forEach(getSet);
  buildShots(); buildCaptions();
  FLASH = [W('Kashmir', 1), W('1947'), W('war'), W('again', 1), W('again', 2), W('1972'), W('froze'), W('Water'), W('Location'), W('three'), ...FLASHT, W('Aksai Chin') - .02];
  return SHOTS.map(s => [s.set, +s.a.toFixed(2), +s.b.toFixed(2)]);
};
window.render = render; window.ready = true;
