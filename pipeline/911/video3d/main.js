import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { heliFly } from './kcommon.js';
import { hash } from './tex.js';
import { ll, GR } from './kamerica.js';
import { sm, takeoffProfile, setDusk } from './a911.js';
import { buildNYC, buildMemorial, EV } from './s911a.js';
import { buildPentagon, buildField, buildAirport, buildCabin, buildCheckpoint, buildAfghan, buildGlobe9, loadWorld, PLACES, AIRPORTS } from './s911b.js';

const RW = 720, RH = 1280, OW = 1080, OH = 1920;
const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
renderer.setSize(RW, RH); renderer.setPixelRatio(1); renderer.toneMapping = THREE.NeutralToneMapping; renderer.toneMappingExposure = 1.0;
renderer.domElement.style.display = 'none'; document.body.appendChild(renderer.domElement);
const out = document.getElementById('out'); const ctx = out.getContext('2d');
const cam = new THREE.PerspectiveCamera(45, RW / RH, .2, 20000);
const composer = new EffectComposer(renderer);
const rp = new RenderPass(new THREE.Scene(), cam); composer.addPass(rp);
const bloom = new UnrealBloomPass(new THREE.Vector2(RW, RH), .3, .5, 1.15); composer.addPass(bloom);
composer.addPass(new OutputPass());
const B = { nyc: buildNYC, mem: buildMemorial, pent: buildPentagon, field: buildField, air: buildAirport, cabin: buildCabin, check: buildCheckpoint, afg: buildAfghan, globe: buildGlobe9 };
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
function clockPill(t, t0, txt, ampm) {
  const k = ob(seg(t, t0, t0 + .25)); if (k <= 0) return; const x = OW / 2, y = 430;
  ctx.save(); ctx.translate(x, y); ctx.scale(k, k); ctx.fillStyle = 'rgba(8,10,14,.88)'; ctx.beginPath(); ctx.roundRect(-300, -100, 600, 200, 44); ctx.fill(); ctx.lineWidth = 8; ctx.strokeStyle = '#ffd23f'; ctx.stroke();
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = '900 150px Montserrat'; ctx.fillStyle = '#ffd23f'; ctx.fillText(txt, -50, 6); ctx.font = '900 64px Montserrat'; ctx.fillStyle = '#fff'; ctx.fillText(ampm, 215, 26); ctx.restore();
}
function calCard(t, t0, hold = 1e9) {
  const k = ob(seg(t, t0, t0 + .26)) * (1 - seg(t, t0 + hold, t0 + hold + .2)); if (k <= .01) return;
  ctx.save(); ctx.translate(OW / 2, 640); ctx.rotate(-.04); ctx.scale(k, k);
  ctx.shadowColor = 'rgba(0,0,0,.5)'; ctx.shadowBlur = 30; ctx.shadowOffsetY = 16; ctx.fillStyle = '#fbf8ef'; ctx.beginPath(); ctx.roundRect(-300, -330, 600, 660, 36); ctx.fill(); ctx.shadowColor = 'transparent';
  ctx.fillStyle = '#d62828'; ctx.beginPath(); ctx.roundRect(-300, -330, 600, 150, [36, 36, 0, 0]); ctx.fill();
  ctx.fillStyle = '#fff'; ctx.font = '900 84px Montserrat'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('SEPTEMBER', 0, -254);
  ctx.fillStyle = '#16181f'; ctx.font = '900 360px Montserrat'; ctx.fillText('11', 0, -30);
  ctx.fillStyle = '#d62828'; ctx.font = '900 120px Montserrat'; ctx.fillText('2001', 0, 215);
  ctx.restore();
}
function counter(t, t0, t1, final, y = 520) {
  const k0 = ob(seg(t, t0, t0 + .2)); if (k0 <= 0) return; const k = eo(seg(t, t0, t1)); const v = Math.round(final * k); const done = t >= t1; const pop = done ? 1 + .1 * Math.max(0, 1 - (t - t1) / .25) : 1;
  ctx.save(); ctx.translate(OW / 2, y); ctx.scale(k0 * pop, k0 * pop); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round'; ctx.font = '900 230px Montserrat'; ctx.shadowColor = 'rgba(0,0,0,.6)'; ctx.shadowBlur = 20; ctx.shadowOffsetY = 10; ctx.lineWidth = 30; ctx.strokeStyle = '#0a0a0a'; ctx.strokeText(v.toLocaleString('en-US'), 0, 0); ctx.shadowColor = 'transparent'; ctx.fillStyle = done ? '#ffd23f' : '#ffffff'; ctx.fillText(v.toLocaleString('en-US'), 0, 0);
  ctx.font = '900 70px Montserrat'; ctx.lineWidth = 14; ctx.strokeText('PEOPLE', 0, 150); ctx.fillStyle = '#fff'; ctx.fillText('PEOPLE', 0, 150); ctx.restore();
}
function gdot(lon, lat) { const S = SETS.globe; return proj(S.P(lat, lon, 2).toArray()); }
const gVis = (lon, lat) => { const p = SETS.globe.P(lat, lon, 0).clone().normalize(); return p.dot(cam.position.clone().normalize()) > .2; };
// India-POV disputed areas: PoK + Aksai Chin sit inside India's border (hatched on the texture); label who holds them
function occ(t, t0, below = false) {
  const k = ob(seg(t, t0, t0 + .3)); if (k <= 0) return; const pts = [[73.6, 35.2, -1, 'Pakistan', '#3fe06a'], [79.2, 35.0, 1, 'China', '#ff6a5a']];
  ctx.save(); ctx.globalAlpha = Math.min(1, k * 2);
  for (const [lo, la, side, who, col] of pts) { if (!gVis(lo, la)) continue; const [x, y] = gdot(lo, la); if (x < 60 || x > OW - 60 || y < 160 || y > 1180) continue; const tx = Math.max(200, Math.min(OW - 200, x + side * 150)), ty = below ? y + 170 + (side > 0 ? 90 : 0) : y - 150 - (side > 0 ? 80 : 0);
    ctx.strokeStyle = col; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(tx, below ? ty - 40 : ty + 30); ctx.stroke(); ctx.fillStyle = col; ctx.beginPath(); ctx.arc(x, y, 7, 0, 7); ctx.fill(); chip(tx, ty - 26, 'occupied by', '#fff', 'rgba(8,10,14,.86)', 28); chip(tx, ty + 26, who, col, 'rgba(8,10,14,.86)', 34); }
  ctx.restore();
}
function desat(k) { if (k <= 0) return; ctx.save(); ctx.globalCompositeOperation = 'saturation'; ctx.fillStyle = `rgba(128,128,128,${k})`; ctx.fillRect(0, 0, OW, OH); ctx.restore(); }
function dim(k, col = '0,0,0') { if (k <= 0) return; ctx.fillStyle = `rgba(${col},${k})`; ctx.fillRect(0, 0, OW, OH); }

// ---------- shots ----------
let SHOTS = [], FLASH = [], CUTS = [], IMPACTS = [];
const gcam = (lat, lon, d) => ({ p: ll(lon, lat, d).toArray(), l: [0, 0, 0] });
const gmix = (a, b, k) => gcam(a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k);
function buildShots() {
  const sh = (set, a, b, o) => SHOTS.push({ set, a, b, ...o });
  const N = () => SETS.nyc;
  const nycTod = k => S => { S.tod(k); };
  const T = {
    s1: W('normal'), s2: W('Tuesday') + .0, stop: W('stopped'), sep: W('September') - .16, nine: W('19') - .09, took: W('took') + .17, coord: W('coordinated') + .25, flag: W('against') + .2, two: W('Two') - .11,
    hit1: EV.hit1, s9: W('struck') + .57, hit2: EV.hit2, pent0: W('A', 2) - 0, pentHit: EV.pentHit, pa0: W('fourth') - .02, cabin0: W('after') + .0, fall: W('Both') - .05, mem: W('2,977') + .0, mem2: W('people') - .06, war0: W('America') + .0, afg0: W('U.S.') + .0, chk: W('and', 3) + .0, air: W('across') - .04, one: W('One', 2) - .02, nev: W('lost', 2) + .0, nf: W('Never', 2) - .78, end: W('Follow')
  };
  // 1 aerial, morning, clock
  sh('nyc', 0, T.s1 + .4, { fov: 56, bloom: .25, fx: nycTod(0), cam: t => { const k = ease(t / (T.s1 + .4)); return { p: mix([-430, 250, 1050], [-300, 265, 800], k), l: [10, 190, 0] }; }, over: t => clockPill(t, W('8:46') + .02, '8:46', 'AM') });
  // 2 street: commuters walk toward camera, then the world stops
  const sTop = T.stop; const walkZ = (i, t) => [127.5, 129.5, 131, 132.5, 134][i] + 1.35 * (Math.min(t, sTop) - (T.s1 + .4));
  sh('nyc', T.s1 + .4, T.sep, { fov: 52, bloom: .2, punch: [sTop, .09], fx: (S, t) => { S.tod(0); S.flag.g.visible = true; },
    cam: t => { const u = seg(t, sTop, sTop + .6); return { p: [2, 1.7, 142], l: [1, mix([2.6], [30], ease(u * u))[0], 100] }; },
    chars: t => { const st = t >= sTop; const f = i => ({ p: [[-1.7, 1.0, -.3, 2.0, -2.5][i], 0, walkZ(i, t)], s: { walk: !st, expr: st ? 'surprised' : 'smile', face: st ? 0 : 0, arms: st && i % 2 ? 'chin' : (['mug', 'phone', 'down', 'down', 'phone'][i]) } }); return { c0: f(0), c1: f(1), c2: f(2), c3: f(3), c4: f(4) }; },
    over: t => { chipAt(t, W('Tuesday') - .1, OW / 2, 520, 'TUESDAY MORNING', '#ffffff'); desat(.9 * seg(t, sTop, sTop + .25) * (1 - seg(t, sTop + .55, sTop + .8))); } });
  // 3 date
  sh('nyc', T.sep, T.nine, { fov: 55, bloom: .25, fx: nycTod(.15), cam: t => { const k = ease(seg(t, T.sep, T.nine)); return { p: mix([1250, 280, 780], [1000, 300, 600], k), l: [0, 200, 0] }; }, over: t => calCard(t, W('September') - .02) });
  // 4 nineteen silhouettes on the apron
  sh('air', T.nine, T.took, { fov: 52, bloom: .2, fx: (S, t) => { },
    cam: t => { const k = ease(seg(t, T.nine, T.took)); return { p: mix([40, 1.7, 131], [41, 2.0, 134], k), l: [40, 5.0, 170] }; },
    chars: t => { const o = {}; let n = 0; for (let r = 0; r < 5; r++) for (let c = 0; c < (r === 4 ? 3 : 4); c++) { const x = 40 + (c - (r === 4 ? 1 : 1.5)) * 1.7 + (r % 2 ? .4 : -.2), z = 138 + r * 2.3 + (t - T.nine) * 1.2; o['s' + n] = { p: [x, 0, z], s: { walk: true, back: true } }; n++; } return o; },
    over: t => { stamp(t, W('19') - .02, [{ t: '19', size: 330 }, { t: 'HIJACKERS', size: 96 }], 560, '#ff4a3a', -.05, 200, 1.5); chipAt(t, W('Al Qaeda') + .0, OW / 2, 330, 'AL QAEDA', '#ffffff'); } });
  // 5 four planes: one takes off (real roll + rotation), three already climbing out
  const tl = W('took') + .17 + 1.1; const prof = takeoffProfile(0); const XL = 140, tlift = 31.4; const t0 = tl - tlift; const sL = prof(tlift).s;
  const dep = t => { const st = prof(t - t0); return { x: XL + st.s - sL, y: st.y, st }; };
  const depPath = t => { const d = dep(t); return [d.x, d.y, 0]; };
  const camT = t => { const d = dep(t); return { p: [d.x - 8 - Math.max(0, d.y) * .1, 11 + d.y * .3, 118], l: [d.x + 2, 4 + d.y * .5, 0] }; };
  sh('air', T.took, T.coord, { fov: 56, bloom: .2, shake: .002,
    cam: camT,
    fx: (S, t) => { S.hideParked(); S.depart.show(true); const tt = t - t0; const alpha = u => { const a = u - 31.0; return a < 0 ? 0 : (u < tlift ? .21 * sm(a / 1.4) : .21 - .14 * sm((u - tlift) / 2.0)); }; const lift = tlift; S.depart.fly(t, depPath, { gear: dep(t).y < 14, alpha: u => alpha(u - t0), dist: dep(t).x * 0 + (prof(t - t0).s) , ground: 0 });
      [[-70, 70, -110, 70, 14], [70, 105, -150, 115, 12], [-260, 55, -80, 62, 16]].forEach((c, i) => { const P = S.skyPlanes[i]; P.show(true); P.fly(t, u => [XL + (c[0]) + (u - T.took) * c[3], c[1] + (u - T.took) * c[4], c[2] - (u - T.took) * 14], { gear: false }); }); },
    over: t => { stamp(t, W('four') - .02, [{ t: '4', size: 330 }, { t: 'PLANES', size: 96 }], 560, '#ffd23f', -.05, 200, 1.4); } });
  // 6 coordinated attack: four flights converge on three sites (globe)
  const arcFx = (S, t) => { S.pins.nyc.set(t, W('coordinated') + .0); S.pins.dc.set(t, W('coordinated') + .15); S.pins.pa.set(t, W('attack')); };
  sh('globe', T.coord, T.flag, { fov: 40, bloom: .3, cam: t => { const k = ease(seg(t, T.coord, T.flag)); return gmix([40, -80, 150], [40, -76.5, 130], k); }, fx: (S, t) => { arcFx(S, t); S.flightArcs.forEach((a, i) => a.set(eo(seg(t, W('coordinated') + i * .16, W('coordinated') + i * .16 + .55)))); }, over: t => { chipAt(t, W('coordinated') + .0, OW / 2, 470, 'ONE COORDINATED ATTACK', '#ff6a5a', undefined, 38); } });
  // 7 against the United States: big flag, skyline behind
  sh('nyc', T.flag, T.two, { fov: 50, bloom: .25, fx: nycTod(0), cam: t => { const k = ease(seg(t, T.flag, T.two)); return { p: mix([-78, 50, 222], [-70, 56, 208], k), l: [-52, 66, 150] }; }, over: t => chipAt(t, W('United') - .1, OW / 2, 470, 'UNITED STATES', '#ffffff') });
  // 8 plane 1 hits the North Tower
  const p1 = t => { const d = 196 * (EV.hit1 - t); return [-77.25 - d, 360 + d * .01, -35 - d * .1]; };
  sh('nyc', T.two, T.s9, { fov: 58, bloom: .3, punch: [EV.hit1, .08], shakeAfter: EV.hit1, fx: (S, t) => { S.tod(0); S.planes[0].show(t < EV.hit1); if (t < EV.hit1) S.planes[0].fly(t, p1, { gear: false }); S.planes[1].show(false); },
    cam: t => { const k = ease(seg(t, T.two, T.s9)); return { p: mix([-340, 255, 300], [-310, 262, 250], k), l: [-60, 290, -35] }; } });
  // 9 plane 2 hits the South Tower; both burning
  const p2 = t => { const d = 263 * (EV.hit2 - t); return [50 + d * .16, 305, 72.25 + d]; };
  sh('nyc', T.s9, T.pent0, { fov: 60, bloom: .3, punch: [EV.hit2, .08], shakeAfter: EV.hit2, fx: (S, t) => { S.tod(0); S.planes[0].show(false); S.planes[1].show(t < EV.hit2); if (t < EV.hit2) S.planes[1].fly(t, p2, { gear: false }); },
    cam: t => { const k = ease(seg(t, T.s9, T.pent0)); return { p: mix([-120, 300, 520], [-210, 330, 560], k), l: [10, 290, 20] }; }, over: t => chipAt(t, W('New') - .05, OW / 2, 470, 'NEW YORK CITY', '#ffffff') });
  // 10 Pentagon
  sh('pent', T.pent0, T.pa0, { fov: 54, bloom: .3, punch: [EV.pentHit, .08], shakeAfter: EV.pentHit, cam: t => { const k = ease(seg(t, T.pent0, T.pa0)); return { p: mix([-640, 330, 470], [-330, 34, 215], k * k * (3 - 2 * k)), l: mix([-120, 0, 0], [-196, 12, -4], ease(seg(t, T.pent0, T.pent0 + 1.0))) }; }, over: t => chipAt(t, W('Pentagon') - .05, OW / 2, 470, 'THE PENTAGON', '#ffffff') });
  // 11 Pennsylvania
  sh('field', T.pa0, T.cabin0, { fov: 56, bloom: .3, punch: [EV.paHit, .07], shakeAfter: EV.paHit, cam: t => { const k = ease(seg(t, T.pa0, T.cabin0)); return { p: mix([62, 50, 250], [52, 44, 238], k), l: [-12, 36, 0] }; }, over: t => chipAt(t, W('Pennsylvania') - .05, OW / 2, 470, 'PENNSYLVANIA', '#ffffff') });
  // 12 Flight 93 cabin: passengers rush the cockpit with a trolley (rolls at walking speed, wheels turn with distance)
  const cabV = 2.6;
  sh('cabin', T.cabin0, T.fall, { fov: 60, bloom: .2, shake: .0016,
    fx: (S, t) => { const zc = 3.6 - cabV * (t - T.cabin0); S.cart.set(zc, cabV * (t - T.cabin0)); },
    cam: t => ({ p: [0, 1.8, -3.7], l: [0, 1.15, 4] }),
    chars: t => { const u = t - T.cabin0; const o = {}; const pos = [[0, 4.4], [-.5, 5.7], [.5, 6.0], [-.3, 7.3], [.45, 7.7], [-.5, 9.0]]; pos.forEach(([x, z], i) => { o['p' + i] = { p: [x, 0, z - cabV * u], s: { walk: true } }; }); return o; },
    over: t => { chipAt(t, W('passengers') - .05, OW / 2, 300, 'FLIGHT 93', '#ffffff'); stamp(t, W('fought') - .02, [{ t: 'FOUGHT', size: 150 }, { t: 'BACK', size: 200 }], 560, '#ffd23f', -.05, 200, 1.0); } });
  // 13 both towers fall (time-lapsed collapse into dust)
  sh('nyc', T.fall, T.mem, { fov: 58, bloom: .3, shakeAfter: EV.fall2, fx: (S, t) => { S.tod(0); S.planes.forEach(p => p.show(false)); }, cam: t => { const k = ease(seg(t, T.fall, T.mem)); return { p: mix([-120, 150, 880], [-60, 170, 800], k), l: [10, 215, 0] }; } });
  // 14 memorial: counter
  sh('mem', T.mem, T.mem2, { fov: 54, bloom: .3, cam: t => { const k = ease(seg(t, T.mem, T.mem2)); return { p: mix([-90, 16, 86], [-60, 52, 64], k), l: [-34, 2, 4] }; }, over: t => counter(t, W('2,977') - .02, T.mem2 - .1, 2977, 540) });
  // 15 memorial people
  const memEnd = W('America') - .0;
  sh('mem', T.mem2, memEnd, { fov: 46, bloom: .3, cam: t => { const k = ease(seg(t, T.mem2, memEnd)); return { p: mix([-31, 1.7, 38], [-31.5, 1.8, 35], k), l: [-34, 3, 22] }; },
    chars: t => ({ v0: { p: [-37.4, 0, 28], s: { face: .3 } }, v1: { p: [-34.6, 0, 26.5], s: { arms: 'flag', flagKind: 'us' } }, v2: { p: [-32.2, 0, 28.5], s: { face: -.3 } }, v3: { p: [-29.8, 0, 27], s: { arms: 'chin' } } }),
    over: t => { chipAt(t, W('lives', 1) - .1, OW / 2, 470, '2,977 LIVES', '#ffd23f'); } });
  // 16 war on terror (globe)
  sh('globe', memEnd, T.afg0, { fov: 40, bloom: .3, cam: t => { const k = ease(seg(t, memEnd, T.afg0)); return gmix([38, -78, 150], [36, 72, 176], k); }, fx: (S, t) => { S.pins.dc.set(t, memEnd); S.pins.kabul.set(t, W('war') + .35); const u = seg(t, W('war') - .05, W('terror') + .5); S.arcWar.set(eo(u)); S.placeJet(S.arcWar, eo(u)); },
    over: t => { stamp(t, W('war') - .02, [{ t: 'WAR ON', size: 150 }, { t: 'TERROR', size: 200, c: '#ff4a3a' }], 460, '#ffffff', -.05, 180, 1.8); occ(t, W('terror') + .1); } });
  // 17 Afghanistan: helicopters flare and land (heliFly attitude), jets pass overhead (jet.fly), soldiers on the pad
  const hA = t => { const u = t - T.afg0; return [22 + 6 * seg(u, 0, 2.1) + Math.sin(u * .8) * 2, Math.max(6, 28 - 9 * u + .8 * u * u), -42 + 30 * u - 2 * u * u]; };
  const hB = t => { const u = t - T.afg0; return [-4 + 14 * seg(u, 0, 2.1), Math.max(7, 40 - 12 * u + 1 * u * u), -105 + 34 * u - 2.4 * u * u]; };
  sh('afg', T.afg0, T.chk, { fov: 56, bloom: .25, shake: .002,
    cam: t => { const k = ease(seg(t, T.afg0, T.chk)); return { p: mix([30, 3.0, 50], [28, 3.6, 46], k), l: [26, 14, -20] }; },
    fx: (S, t) => { heliFly(S.helis[0], t, hA); heliFly(S.helis[1], t, hB); S.dust.update(t, 28, 6, Math.max(0, hA(t)[1]), 1);
      S.jets[0].fly(t, u => [4, 78, -330 + (u - T.afg0) * 235], .9); S.jets[1].fly(t, u => [46, 92, -400 + (u - T.afg0) * 245], .9);
      S.jeeps.forEach((j, i) => { const d = 9 * (t - T.afg0) + i * 11; j.drive(-8, 0, 30 - d * 0 + 24 - d, d, Math.PI * 0 - Math.PI / 2 * 0 + 0); }); },
    chars: t => { const o = {}; for (let i = 0; i < 4; i++) o['g' + i] = { p: [[40, 45, 36, 49][i], 0, [41, 38, 36, 40][i]], s: { walk: true, back: i % 2 === 0, arms: i % 2 ? 'rifle' : 'down' } }; return o; },
    over: t => { chipAt(t, W('forces') - .1, OW / 2, 400, 'OCT 2001', '#ffffff'); chipAt(t, W('Afghanistan') - .1, OW / 2, 520, 'AFGHANISTAN', '#ffd23f'); } });
  // 18 security checkpoint
  sh('check', T.chk, T.air, { fov: 52, bloom: .2, cam: t => { const k = ease(seg(t, T.chk, T.air)); return { p: mix([-.8, 1.55, 5.4], [.2, 1.6, 4.6], k), l: [.3, 1.5, -4] }; },
    chars: t => { const u = t - T.chk; return { o0: { p: [.7, 0, -5.6], s: { arms: 'point', face: -.4 } }, o1: { p: [3.6, 0, -6.4], s: {} }, t0: { p: [-1.6, 0, -9 + 2.2 * u], s: { walk: true } }, t1: { p: [-2.4, 0, -1.2 + .5 * u], s: { walk: true } }, t2: { p: [-3.7, 0, 1.2 + .5 * u], s: { walk: true } } }; },
    over: t => { chipAt(t, W('security') - .1, OW / 2, 470, 'AIRPORT SECURITY', '#ffffff'); chipAt(t, W('changed') - .05, OW / 2, 590, 'CHANGED', '#ffd23f'); } });
  // 19 across the world: airports light up
  sh('globe', T.air, T.one, { fov: 40, bloom: .3, cam: t => { const k = ease(seg(t, T.air, T.one)); return gmix([24, -62, 235], [24, 112, 235], k); }, fx: (S, t) => { S.air.forEach((p, i) => p.set(t, T.air + 1.5 * lin((p.lon + 62) / 174) - .1, 5)); }, over: t => { chipAt(t, W('across') - .05, OW / 2, 330, 'ACROSS THE WORLD', '#ffffff'); occ(t, T.air + .75, true); } });
  // 20 one morning: skyline at dusk, no towers
  sh('nyc', T.one, T.nev, { fov: 55, bloom: .35, fx: (S, t) => { S.tod(.82); S.beamK = 0; S.planes.forEach(p => p.show(false)); }, cam: t => { const k = ease(seg(t, T.one, T.nev)); return { p: mix([-260, 150, 1050], [-170, 160, 930], k), l: [0, 120, 0] }; }, over: t => { chipAt(t, W('morning') - .1, OW / 2, 470, 'ONE MORNING', '#ffffff'); chipAt(t, W('thousands') - .1, OW / 2, 590, 'THOUSANDS LOST', '#ffd23f'); } });
  // 21 a world that would never be the same: tribute beams rise
  sh('nyc', T.nev, T.nf, { fov: 55, bloom: .55, fx: (S, t) => { S.tod(.95); S.beamK = ease(seg(t, T.nev + .2, T.nev + 1.8)); S.planes.forEach(p => p.show(false)); }, cam: t => { const k = ease(seg(t, T.nev, T.nf)); return { p: mix([-140, 85, 980], [-80, 100, 920], k), l: [0, 250 + 70 * k, 0] }; }, over: t => chipAt(t, W('never', 1) - .05, OW / 2, 470, 'NEVER THE SAME', '#ffffff') });
  // 22 never forget
  sh('nyc', T.nf, T.end, { fov: 52, bloom: .6, punch: [W('Never', 2), .05], fx: (S, t) => { S.tod(1); S.beamK = 1; S.planes.forEach(p => p.show(false)); }, cam: t => { const k = ease(seg(t, T.nf, T.end)); return { p: mix([-60, 100, 1000], [-10, 115, 940], k), l: [0, 330, 0] }; }, over: t => stamp(t, W('Never', 2) - .02, [{ t: 'NEVER', size: 200 }, { t: 'FORGET', size: 200, c: '#ffffff' }], 560, '#ffd23f', -.04, 200) });
  // 23 end card on the beams
  sh('nyc', T.end, TL.duration, { fov: 52, bloom: .6, logo: true, fx: (S, t) => { S.tod(1); S.beamK = 1; S.planes.forEach(p => p.show(false)); }, cam: t => ({ p: mix([-10, 115, 940], [50, 140, 880], ease(seg(t, T.end, TL.duration))), l: [0, 330, 0] }) });
  SHOTS.forEach((s, i) => { if (i) CUTS.push(+s.a.toFixed(3)); });
}
// ---------- captions: 1-2 words, white + black outline, key words yellow and bigger ----------
let GROUPS = [];
const EMPH = new Set(['846', 'tuesday', 'stopped', '2001', '19', 'alqaeda', 'hijackers', 'four', 'planes', 'coordinated', 'attack', 'two', 'struck', 'towers', 'pentagon', 'pennsylvania', 'fought', 'fell', '2977', 'lives', 'war', 'terror', 'afghanistan', 'security', 'changed', 'thousands', 'never', 'forget', 'world', 'twin', 'september', 'normal']);
function buildCaptions() {
  const ws = WORDS; let i = 0;
  while (i < ws.length) {
    const g = [ws[i]]; const w0 = ws[i].w;
    if (i + 1 < ws.length && !/[.,?!:]$/.test(w0) && ws[i + 1].a - ws[i].a < .55 && (w0.length + ws[i + 1].w.length) <= 14) g.push(ws[i + 1]);
    GROUPS.push({ words: g.map(x => ({ t: x.w.replace(/[,.]$/, '').replace(/[?!]$/, m => m), em: EMPH.has(norm(x.w.split(' ')[0])) || EMPH.has(norm(x.w)) })), a: g[0].a, last: g[g.length - 1] });
    i += g.length;
  }
  GROUPS.forEach((g, k) => { const n = GROUPS[k + 1]; g.b = n ? Math.min(n.a, g.last.b + .25) : g.last.b + .4; });
}
function drawCaption(t) {
  const g = GROUPS.find(g => t >= g.a && t < g.b); if (!g) return;
  const k = lin((t - g.a) / .08); const anyEm = g.words.some(w => w.em); const sc = 1 + (anyEm ? .22 : .08) * (1 - k);
  ctx.save(); ctx.translate(OW / 2, 1344); ctx.scale(sc, sc); ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic'; ctx.lineJoin = 'round';
  let big = 104, small = 80; const measure = () => g.words.map(w => { ctx.font = `800 ${w.em ? big : small}px Montserrat`; return ctx.measureText(w.t).width; });
  let ws = measure(); const gap = 26; while (ws.reduce((a, b) => a + b, 0) + gap * (g.words.length - 1) > 940 && big > 44) { big -= 4; small -= 3; ws = measure(); }
  const tot = ws.reduce((a, b) => a + b, 0) + gap * (g.words.length - 1); let x = -tot / 2;
  g.words.forEach((w, i) => { ctx.font = `800 ${w.em ? big : small}px Montserrat`; const y = 30; ctx.shadowColor = 'rgba(0,0,0,.7)'; ctx.shadowBlur = 10; ctx.shadowOffsetX = 4; ctx.shadowOffsetY = 6; ctx.lineWidth = 12; ctx.strokeStyle = '#0a0a0a'; ctx.strokeText(w.t, x, y); ctx.shadowColor = 'transparent'; ctx.fillStyle = w.em ? '#ffd23f' : '#ffffff'; ctx.fillText(w.t, x, y); x += ws[i] + gap; });
  ctx.restore();
}
const noise = document.createElement('canvas'); noise.width = noise.height = 256;
{ const n = noise.getContext('2d'), d = n.createImageData(256, 256); for (let i = 0; i < d.data.length; i += 4) { const v = Math.random() * 255; d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 255; } n.putImageData(d, 0, 0); }

// ---------- logo end card ----------
function drawLogo(t) {
  const a0 = W('Follow') - .02; if (t < a0 - .2) return;
  const aR = W('Redrawn') - .1;
  const fade = 1 - seg(t, TL.duration - .45, TL.duration - .02);
  ctx.save(); ctx.globalAlpha = fade;
  ctx.fillStyle = `rgba(6,10,28,${.5 * eo(seg(t, a0 - .1, a0 + .35))})`; ctx.fillRect(0, 0, OW, OH);
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
  const f0 = W('Stories') - .1, press = W('Stories') + 1.0; const bk = ob(seg(t, f0, f0 + .4));
  if (bk > 0) {
    const pressed = t > press; const pk = 1 - .1 * Math.sin(Math.PI * seg(t, press - .08, press + .2)); const bw = 440 * bk * pk, bh = 124 * bk * pk; ctx.globalAlpha = fade; const by = 1500;
    ctx.fillStyle = pressed ? '#3a3f48' : '#0095f6'; ctx.beginPath(); ctx.roundRect(cx - bw / 2, by - bh / 2, bw, bh, 28); ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = 'rgba(0,0,0,.55)'; ctx.stroke();
    ctx.fillStyle = '#fff'; ctx.font = `800 ${Math.round(60 * bk * pk)}px Montserrat`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(pressed ? 'Following ✓' : 'Follow', cx, by + 3);
    const hin = eo(seg(t, press - .75, press - .12)) * (1 - eo(seg(t, press + .3, press + .75))); if (hin > 0) { const tap = Math.sin(Math.PI * seg(t, press - .12, press + .12)); const hx = cx + 90 + (1 - hin) * 260, hy = by + 70 + (1 - hin) * 260 - tap * -14; ctx.save(); ctx.translate(hx, hy); ctx.rotate(-.35); ctx.fillStyle = '#f6d7b0'; ctx.strokeStyle = '#2a1a12'; ctx.lineWidth = 8; ctx.lineJoin = 'round'; ctx.beginPath(); ctx.roundRect(-34, -20, 68, 120, 30); ctx.fill(); ctx.stroke(); ctx.beginPath(); ctx.roundRect(-18, -86, 36, 90, 18); ctx.fill(); ctx.stroke(); ctx.restore(); }
    if (t > press - .1 && t < press + .6) { const r = seg(t, press - .1, press + .6); ctx.strokeStyle = `rgba(255,255,255,${1 - r})`; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(cx + 80, by + 8, 30 + r * 90, 0, 7); ctx.stroke(); }
  }
  ctx.restore();
}
function drawFrame(t, shot, nocam) {
  const S = getSet(shot.set);
  cam.fov = shot.fov || 45;
  const c = shot.cam(t); cam.position.set(...c.p); cam.lookAt(V(c.l));
  if (shot.punch) { const p = seg(t, shot.punch[0], shot.punch[0] + .1) * (1 - seg(t, shot.punch[0] + .1, shot.punch[0] + .55)); cam.fov *= 1 - shot.punch[1] * eo(p); }
  cam.fov *= 1 + .06 * (1 - eo(seg(t, shot.a, shot.a + .2)));
  cam.updateProjectionMatrix(); cam.lookAt(V(c.l));
  const sc = shot.set === 'nyc' || shot.set === 'pent' || shot.set === 'field' ? 40 : 40;
  if (shot.shake) { cam.position.x += Math.sin(t * 37) * shot.shake * sc; cam.position.y += Math.cos(t * 29) * shot.shake * sc; cam.lookAt(V(c.l)); }
  if (shot.shakeAfter !== undefined && t > shot.shakeAfter) { const k = Math.max(0, 1 - (t - shot.shakeAfter) / .9); const amp = shot.set === 'nyc' ? 2.2 : shot.set === 'pent' ? 1.0 : .9; cam.position.x += Math.sin(t * 61) * amp * k; cam.position.y += Math.cos(t * 47) * amp * k; cam.lookAt(V(c.l)); }
  cam.updateMatrixWorld();
  S.reset && S.reset();
  S.update(t, cam);
  if (shot.fx) shot.fx(S, t);
  const cs = shot.chars ? shot.chars(t) : {};
  for (const [k, ch] of Object.entries(S.chars || {})) { const q = cs[k]; if (!q) { ch.mesh.visible = ch.shadow.visible = false; continue; } ch.set(V(q.p), { ...q.s, t }, cam); }
  rp.scene = S.scene || S; bloom.strength = shot.bloom ?? .3;
  composer.render();
  ctx.globalAlpha = 1; ctx.drawImage(renderer.domElement, 0, 0, OW, OH);
  return S;
}
function render(t) {
  const shot = SHOTS.find(s => t >= s.a && t < s.b) || SHOTS[SHOTS.length - 1];
  drawFrame(t, shot);
  const vg = ctx.createRadialGradient(OW / 2, OH * .48, OH * .36, OW / 2, OH * .5, OH * .8); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.28)'); ctx.fillStyle = vg; ctx.fillRect(0, 0, OW, OH);
  ctx.save(); ctx.globalAlpha = .05; ctx.globalCompositeOperation = 'overlay'; const ox = Math.floor(hash(Math.floor(t * 30)) * 256), oy = Math.floor(hash(Math.floor(t * 30) + 5) * 256); ctx.translate(-ox, -oy); ctx.fillStyle = ctx.createPattern(noise, 'repeat'); ctx.fillRect(0, 0, OW + 256, OH + 256); ctx.restore();
  if (shot.over) shot.over(t);
  for (const f of FLASH) { const a = 1 - seg(t, f, f + .18); if (t >= f && a > 0) { ctx.fillStyle = `rgba(255,255,255,${a * .55})`; ctx.fillRect(0, 0, OW, OH); } }
  const fin = t < .25 ? 1 - t / .25 : 0; if (fin > 0) { ctx.fillStyle = `rgba(0,0,0,${fin})`; ctx.fillRect(0, 0, OW, OH); }
  if (shot.logo) drawLogo(t);
  if (t < W('Follow') - .02 && !window.NOCAP) drawCaption(t);
}
// camera-vs-geometry audit: reports any frame whose camera sits inside a building/prop box or below terrain
function audit() {
  const bad = []; const box = new THREE.Box3(); const pt = new THREE.Vector3();
  for (const s of SHOTS) { const S = getSet(s.set); S.updateMatrixWorld(true); const boxes = (S.solid || []).map(m => new THREE.Box3().setFromObject(m));
    for (let t = s.a; t < s.b; t += .1) { s.fx && 0; const c = s.cam(t); pt.set(...c.p); for (const bx of boxes) if (bx.containsPoint(pt)) { bad.push([s.set, +t.toFixed(2), 'inside solid', c.p.map(v => +v.toFixed(1))]); break; } if (S.h) { const g = S.h(c.p[0], c.p[2]); if (c.p[1] < g + 1.0) bad.push([s.set, +t.toFixed(2), 'below terrain', c.p.map(v => +v.toFixed(1)), +g.toFixed(1)]); } if (s.set !== 'globe' && c.p[1] < .8) bad.push([s.set, +t.toFixed(2), 'below floor', c.p]); } }
  return bad;
}
window.audit = audit;
window.setup = async (tl) => {
  TL = tl; WORDS = tl.words;
  for (const f of ['800 76px Montserrat', '900 76px Montserrat', 'bold 40px Montserrat']) await document.fonts.load(f);
  LOGO = new Image(); LOGO.src = 'logo.png'; await LOGO.decode(); await loadWorld();
  // absolute event times (sets read these as pure functions of t)
  EV.hit1 = W('struck') + .05; EV.hit2 = W('towers', 1) + .35; EV.fall2 = W('Both') + .25; EV.fall1 = W('towers', 2) + .12; EV.pentHit = W('Pentagon') + .2; EV.paHit = W('Pennsylvania') - .06;
  EV.face1 = { pos: [-77.5, 362, -35], rotY: -Math.PI / 2 }; EV.face2 = { pos: [50, 305, 72.5], rotY: 0 };
  Object.keys(B).forEach(getSet);
  buildShots(); buildCaptions();
  FLASH = [EV.hit1, EV.hit2, EV.pentHit, EV.paHit, EV.fall2, EV.fall1, W('September') - .02, W('19') - .02, W('war') - .02, W('Never', 2) - .02, W('Then')];
  IMPACTS = [EV.hit1, EV.hit2, EV.pentHit, EV.paHit, EV.fall2, EV.fall1];
  window.EVT = { hits: IMPACTS, flashes: FLASH, cuts: CUTS, pop: [W('8:46'), W('Tuesday'), W('September') - .02, W('19'), W('four'), W('coordinated'), W('United'), W('New'), W('Pentagon'), W('Pennsylvania'), W('passengers'), W('fought'), W('2,977'), W('lives', 1), W('war'), W('Afghanistan'), W('security'), W('across'), W('morning'), W('never', 1), W('Never', 2)], stop: W('stopped'), then: W('Then'), takeoff: W('took') + .17 + 1.1, press: W('Stories') + 1.0, redrawn: W('Redrawn') - .1, afg: W('U.S.'), chk: W('and', 3), follow: W('Follow'), pauses: tl.pauses || [], duration: tl.duration };
  return SHOTS.map(s => [s.set, +s.a.toFixed(2), +s.b.toFixed(2)]);
};
window.render = render; window.drawFrame = drawFrame; window.SETS = SETS; window.SHOTS = SHOTS;
window.dbg = (setKey, p, l, fov, t = 0, fxs = '') => { const shot = { set: setKey, a: -99, b: 99, fov, cam: () => ({ p, l }), fx: fxs ? new Function('S', 't', 'EV', fxs) : null }; if (shot.fx) { const f = shot.fx; shot.fx = (S, tt) => f(S, tt, EV); } SHOTS.unshift(shot); render(t); SHOTS.shift(); };
window.hires = (on) => { const w = on ? 1080 : RW, h = on ? 1920 : RH; renderer.setSize(w, h); composer.setSize(w, h); cam.aspect = 9 / 16; cam.updateProjectionMatrix(); };
window.EVC = EV; window.ready = true;
