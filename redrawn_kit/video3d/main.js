import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { BokehPass } from 'three/addons/postprocessing/BokehPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { buildCompound, buildValley, buildCabin, buildMapPK, buildDesk, buildIntel, buildNYC, buildDC } from './sets_osama.js';
import { hash } from './tex.js';

const RW = 720, RH = 1280, OW = 1080, OH = 1920;
const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
renderer.setSize(RW, RH); renderer.setPixelRatio(1);
renderer.toneMapping = THREE.NeutralToneMapping; renderer.toneMappingExposure = 1.0;
renderer.domElement.style.display = 'none'; document.body.appendChild(renderer.domElement);
const out = document.getElementById('out'); const ctx = out.getContext('2d');
const cam = new THREE.PerspectiveCamera(45, RW / RH, .05, 1200);
const composer = new EffectComposer(renderer);
const rp = new RenderPass(new THREE.Scene(), cam); composer.addPass(rp);
const bokeh = new BokehPass(new THREE.Scene(), cam, { focus: 3, aperture: .004, maxblur: .012 }); composer.addPass(bokeh);
const bloom = new UnrealBloomPass(new THREE.Vector2(RW, RH), .45, .5, .86); composer.addPass(bloom);
composer.addPass(new OutputPass());

const B = { compound: buildCompound, valley: buildValley, cabin: buildCabin, map: buildMapPK, desk: buildDesk, intel: buildIntel, nyc: buildNYC, dc: buildDC };
const SETS = {}; const getSet = k => SETS[k] || (SETS[k] = B[k]());
let TL, WORDS, LOGO;
const V = a => new THREE.Vector3(...a);
const ease = x => { x = Math.max(0, Math.min(1, x)); return x < .5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2; };
const eo = x => { x = Math.max(0, Math.min(1, x)); return 1 - Math.pow(1 - x, 3); };
const ei = x => { x = Math.max(0, Math.min(1, x)); return x * x * x; };
const ob = x => { x = Math.max(0, Math.min(1, x)); const c1 = 1.7, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); };
const lin = x => Math.max(0, Math.min(1, x));
const seg = (t, a, b) => lin((t - a) / (b - a));
const mix = (a, b, k) => a.map((v, i) => v + (b[i] - v) * k);
const W = (w, n = 1) => { let k = 0; for (const x of WORDS) { if (x.w.replace(/[^A-Za-z0-9']/g, '') === w) { k++; if (k === n) return x.a; } } throw new Error('word ' + w + n); };
const proj = (p) => { const v = new THREE.Vector3(...p).project(cam); return [(v.x + 1) / 2 * OW, (1 - v.y) / 2 * OH, v.z]; };

// ---------- 2D overlay helpers ----------
function chip(x, y, txt, col = '#ffd23f', bg = 'rgba(8,10,14,.82)', size = 40) {
  ctx.save(); ctx.font = `800 ${size}px Montserrat`; const w = ctx.measureText(txt).width + size * 1.1, h = size * 1.6;
  ctx.fillStyle = bg; ctx.beginPath(); ctx.roundRect(x - w / 2, y - h / 2, w, h, h / 2); ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = col; ctx.stroke();
  ctx.fillStyle = col; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(txt, x, y + 2); ctx.restore();
}
function reticle(x, y, r, col, t, label) {
  ctx.save(); ctx.strokeStyle = col; ctx.lineWidth = 5; const k = r * .35;
  for (const [sx, sy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) { ctx.beginPath(); ctx.moveTo(x + sx * r, y + sy * (r - k)); ctx.lineTo(x + sx * r, y + sy * r); ctx.lineTo(x + sx * (r - k), y + sy * r); ctx.stroke(); }
  ctx.beginPath(); ctx.moveTo(x - 14, y); ctx.lineTo(x + 14, y); ctx.moveTo(x, y - 14); ctx.lineTo(x, y + 14); ctx.stroke();
  if (label) { ctx.font = '800 34px Montserrat'; ctx.fillStyle = col; ctx.textAlign = 'center'; ctx.fillText(label, x, y - r - 20); }
  ctx.restore();
}
function hudFrame(t, title, col = '#9effa8') {
  ctx.save(); ctx.strokeStyle = col; ctx.lineWidth = 4; ctx.globalAlpha = .85; const m = 70;
  for (const [x, y, dx, dy] of [[m, 330, 1, 1], [OW - m, 330, -1, 1], [m, OH - 330, 1, -1], [OW - m, OH - 330, -1, -1]]) { ctx.beginPath(); ctx.moveTo(x, y + dy * 70); ctx.lineTo(x, y); ctx.lineTo(x + dx * 70, y); ctx.stroke(); }
  ctx.font = '700 32px "DejaVu Sans Mono"'; ctx.fillStyle = col; ctx.textAlign = 'left';
  if (Math.sin(t * 6) > -.3) { ctx.fillStyle = '#ff4040'; ctx.beginPath(); ctx.arc(m + 22, 390, 11, 0, 7); ctx.fill(); }
  ctx.fillStyle = col; ctx.fillText(title, m + 46, 401);
  ctx.textAlign = 'right'; ctx.fillText("34°10'N 73°14'E", OW - m - 10, 401);
  const s = Math.floor(t * 10) / 10; ctx.fillText('T+' + s.toFixed(1), OW - m - 10, OH - 360);
  ctx.restore();
}

let SHOTS = [];
function buildShots() {
  const sh = (set, a, b, o) => SHOTS.push({ set, a, b, ...o });
  // ---------------- COLD OPEN ----------------
  const c1 = W('the', 1) - .1;
  const p1 = t => [-4, 28 + Math.sin(t * 1.3) * .6, 70 - 80 * t], p1b = t => [18, 33, 108 - 80 * t];
  sh('valley', 0, c1, { fov: 42, bloom: .6, shake: .006,
    cam: t => ({ p: [10 - t * 1.5, 17 + t * .8, -122], l: mix(p1(t), [-2, 26, -60], .15) }),
    fx: (S, t) => { S.h1.fly(t, p1); S.h2.fly(t, p1b); } });
  const c2 = W('Then') - .1;
  sh('desk', c1, c2, { from: [0, 2.4, 4.6], to: [0, 2.35, 3.3], lf: [0, 1.75, -1], lt: [0, 1.8, -1], fov: 46, bloom: .5, punch: [W('wanted'), .07],
    fx: (S, t) => { S.flick.intensity = 6 * (hash(Math.floor(t * 14)) > .18 ? 1 : .25); } });
  const c3 = W('May') - .1, chg = W('changed');
  const pfly = t => { const u = (t - (chg - 1.0)) / 2.4; return [mix([60, 34, 150], [-70, 26, -170], u)].flat(); };
  sh('compound', c2, c3, { night: true, from: [34, 13, 78], to: [27, 11, 62], lf: [0, 6, -8], lt: [-2, 6, -8], fov: 50, bloom: .7, punch: [chg, .06], shakeAfter: chg,
    fx: (S, t) => { if (t > chg - 1.1 && t < chg + 1.5) { S.h1.g.visible = true; S.h1.fly(t, pfly); } } });
  // ---------------- DATE / PLACE ----------------
  const c4 = W('Abbottabad') - .1;
  sh('desk', c3, c4, { from: [20.12, 1.78, 1.0], to: [20.04, 1.76, .62], lf: [20, 1.75, -1.1], lt: [20, 1.75, -1.1], fov: 46, punch: [W('2011'), .08],
    fx: (S, t) => { const k = eo(seg(t, W('May') + .02, W('May') + .4)); S.page.rotation.x = -k * 2.9; S.page.visible = k < .98; } });
  const c5 = W('While') - .1;
  sh('map', c4, c5, { bloom: .8, fov: 50,
    cam: t => { const S = SETS.map, a = S.abb.g.position; const k = ease(seg(t, c4, c5)); return { p: [a.x + .5 - k * .2, 8.5 - k * 3.0, a.z + 3.6 - k * 1.4], l: [a.x + .6, 0, a.z] }; },
    fx: (S, t) => { pinPop(S.abb, t, W('Abbottabad')); pinPop(S.isb, t, W('Pakistan') + .1); pinPop(S.jal, t, 1e9); S.dashes.forEach(d => d.visible = false); S.hic.visible = false; S.border.material.opacity = 0; S.air.material.opacity = 0; } });
  // ---------------- INGRESS ----------------
  const c6 = W('crossed') - .1;
  const p6 = t => [0, 30 + Math.sin(t) * .8, -400 - 82 * (t - c5)], p6b = t => [-16, 34, -372 - 82 * (t - c5)];
  sh('valley', c5, c6, { fov: 48, bloom: .6,
    cam: t => { const h = p6(t); return { p: [h[0] + 16 - (t - c5) * 1.5, h[1] + 1.5, h[2] + 22], l: [h[0] - 1, h[1] + 1.2, h[2] - 3] }; },
    fx: (S, t) => { S.h1.fly(t, p6); S.h2.fly(t, p6b); } });
  const c7 = W('carrying') - .1;
  sh('map', c6, c7, { bloom: .8, fov: 50,
    cam: t => { const S = SETS.map, m = S.qp(.45); const k = ease(seg(t, c6, c7)); return { p: [m.x + .1 + k * .2, 8.6 - k * .8, m.z + 4.2 - k * .5], l: [m.x + .2, 0, m.z - .4] }; },
    fx: (S, t) => { const k = seg(t, c6 + .1, c7 - .15); S.dashes.forEach((d, i) => d.visible = (i + .5) / S.dashes.length <= k); S.hic.visible = true; S.hic.position.copy(S.qp(k)).setY(.32); const n = S.qp(Math.min(1, k + .02)); S.hic.rotation.set(-Math.PI / 2, 0, Math.atan2(-(n.x - S.hic.position.x), -(n.z - S.hic.position.z)));
      pinPop(S.abb, t, -1); pinPop(S.isb, t, -1); pinPop(S.jal, t, c6 - .4); const bx = k > .2 ? 1 : 0; S.border.material.opacity = bx * (.55 + .45 * Math.sin(t * 16)); S.air.material.opacity = eo(seg(t, W('Pakistani', 1), W('Pakistani', 1) + .2)); } });
  const c8 = W('Their') - .1;
  sh('cabin', c7, c8, { from: [3.9, 1.55, 2.0], to: [3.4, 1.5, 1.4], lf: [-2.2, 1.0, -.7], lt: [-2.4, 1.0, -.7], fov: 50, bloom: .7, shake: .012, punch: [W('secret'), .06],
    chars: () => { const o = {}; [-3.2, -1.8, -.4, 1.0, 2.4].forEach((x, i) => o['s' + i] = { p: [x, 0, -.5], s: { sit: true, sitDir: 1, face: .45 } }); return o; } });
  // ---------------- TARGET ----------------
  const c9 = W('the', 3) - .1;
  sh('desk', c8, c9, { from: [0, 2.3, 3.4], to: [0, 2.28, 2.6], lf: [0, 1.8, -1], lt: [0, 1.85, -1], fov: 46, bloom: .6, punch: [W('Osama'), .08],
    fx: (S, t) => { const k = ob(seg(t, W('Osama') - .15, W('Osama') + .3)); S.tgt.material.opacity = seg(t, W('Osama') - .15, W('Osama')); S.tgt.scale.setScalar(2.4 - 1.4 * k); S.tgt.rotation.z = (1 - k) * 1.2; } });
  const c10 = W('But', 1) - .1;
  sh('nyc', c9, c10, { from: [0, 5, 44], to: [0, 8, 32], lf: [0, 36, -120], lt: [0, 40, -120], fov: 56, bloom: .9, over: (t) => { const k = eo(seg(t, W('September') - .1, W('September') + .3)); if (k > 0) { ctx.globalAlpha = k; chip(OW / 2, 470, 'SEPTEMBER 11, 2001', '#ffffff', 'rgba(8,10,14,.75)', 46); ctx.globalAlpha = 1; } } });
  // ---------------- THE HUNT ----------------
  const c11 = W('Intelligence') - .1;
  sh('intel', c10, c11, { from: [0, 2.3, 4.4], to: [0, 2.4, 2.5], lf: [0, 2.5, -4], lt: [0, 2.6, -4], fov: 50, bloom: .8, screen: 'search', chars: analysts });
  const c12 = W('tracing') - .1;
  sh('intel', c11, c12, { from: [-4.6, 1.5, 2.2], to: [-3.7, 1.65, 1.0], lf: [.4, 1.5, -2.4], lt: [.6, 1.6, -2.6], fov: 50, bloom: .7, screen: 'net', chars: analysts });
  const c13 = W('Eventually') - .1;
  sh('desk', c12, c13, { from: [36.5, 3.1, 2.7], to: [43.2, 1.6, 2.6], lf: [36.8, 3.1, -1], lt: [43.1, 1.35, -1], fov: 48, bloom: .7,
    fx: (S, t) => { S.strings.forEach((s, i) => { const k = eo(seg(t, c12 + .15 + i * .45, c12 + .55 + i * .45)); s.scale.y = Math.max(.001, s.userData.L * k); s.visible = k > 0; }); } });
  // ---------------- THE COMPOUND ----------------
  const c14 = W('surrounded') - .1;
  const carX = t => { const T = c14 - c13 - .2, x0 = -34, x1 = 9.5, v0 = 2 * (x1 - x0) / T; const u = Math.min(T, Math.max(0, t - c13)); return x0 + v0 * u - .5 * (v0 / T) * u * u; };
  sh('compound', c13, c14, { fov: 46, bloom: .4,
    cam: t => { const x = carX(t); const k = ease(seg(t, c13, c14)); return { p: [x - 14 + k * 4, 38 - k * 8, 58 - k * 6], l: [x + 2 + k * 2, 0, 18 - k * 6] }; },
    fx: (S, t) => { const x = carX(t); S.car.g.visible = true; S.car.drive(x, 23.2, x + 34, false, t > c14 - .9 ? 1 : 0); },
    over: t => { const x = carX(t); const [sx, sy] = proj([x, 1.2, 23.2]); reticle(sx, sy, 90, '#ff3a3a', t, 'TRACKING'); hudFrame(t - c13, 'SURVEILLANCE', '#ff6a6a'); const k = eo(seg(t, W('mysterious') - .1, W('mysterious') + .25)); if (k > 0) { const [cx, cy] = proj([0, 10, -8]); ctx.globalAlpha = k; reticle(cx, cy, 150, '#ffd23f', t, '?'); ctx.globalAlpha = 1; } } });
  const c15 = W('with') - .1;
  sh('compound', c14, c15, { from: [9, 1.0, 31], to: [6, 1.3, 28.5], lf: [6, 4, 18], lt: [3, 8.5, 18], fov: 54, bloom: .4, punch: [W('walls'), .07],
    chars: t => ({ l0: { p: [16 - (t) * 1.3, 0, 22.6], s: { walk: true, face: -.5 } } }) });
  const c16 = W('After', 1) - .1;
  sh('compound', c15, c16, { from: [44, 15, 52], to: [36, 13, 44], lf: [6, 3, 6], lt: [4, 3.5, 4], fov: 50, bloom: .45, trash: true,
    over: t => { const k1 = eo(seg(t, W('obvious') - .1, W('obvious') + .2)), k2 = eo(seg(t, W('ordinary') - .1, W('ordinary') + .2)); if (k1 > 0) { ctx.globalAlpha = k1; chip(OW / 2, 520, '✕  NO PHONE LINE', '#ff5a4a'); } if (k2 > 0) { ctx.globalAlpha = k2; chip(OW / 2, 640, '✕  NO INTERNET', '#ff5a4a'); } ctx.globalAlpha = 1; } });
  const c17 = W('the', 5) - .1;
  const pacer = t => [7 + Math.cos(t * .9) * 4.5, 0, 6 + Math.sin(t * .9) * 3];
  sh('compound', c16, c17, { fov: 40, bloom: .3, post: 'sat',
    cam: t => { const k = ease(seg(t, c16, c17)); const z = 175 - k * 35; return { p: [2, z, -6.6], l: [2, 0, -7] }; },
    fx: (S, t) => { S.pacer.visible = true; const p = pacer(t); S.pacer.position.set(p[0], .1, p[2]); },
    over: t => { const p = pacer(t); const [sx, sy] = proj([p[0], 0, p[2]]); reticle(sx, sy, 60, '#ffffff', t, 'UNKNOWN MAN'); hudFrame(t - c16, 'SATELLITE • 2011', '#ffffff'); } });
  // ---------------- GREEN LIGHT ----------------
  const c18 = W('Under') - .1, ap = W('approved') + .04;
  sh('desk', c17, c18, { from: [60, 2.3, 2.0], to: [60.05, 2.1, 1.65], lf: [60, .8, 0], lt: [60, .8, .05], fov: 46, bloom: .5, punch: [ap, .09], shakeAfter: ap,
    fx: (S, t) => { let y; if (t < ap - .22) y = 1.75; else if (t < ap) { const u = (t - (ap - .22)); y = 1.75 - .5 * (.94 / (.22 * .22)) * 2 * u * u / 2 * 2; y = Math.max(.81, 1.75 - .94 * (u / .22) * (u / .22)); } else if (t < ap + .2) y = .81; else y = .81 + eo(seg(t, ap + .2, ap + .55)) * .9;
      S.stamp.position.set(60.02, y, .22); S.approved.material.opacity = t >= ap ? 1 : 0; } });
  const c19 = W('US') - .1, arr = c19 - .15;
  const hp1 = t => { const u = eo(seg(t, c18 - 1.6, arr)); return mix([-150, 40, 70], [-14, 10, -12], u); };
  const hp2 = t => { const u = eo(seg(t, c18 - 1.2, arr + .5)); return mix([-140, 46, 110], [-52, 0, -34], u); };
  sh('compound', c18, c19, { night: true, from: [40, 14, 46], to: [33, 13, 38], lf: [-10, 8, -8], lt: [-12, 9, -10], fov: 52, bloom: .7, shake: .004,
    fx: (S, t) => { S.h1.g.visible = S.h2.g.visible = true; const a = S.h1.fly(t, hp1, { yaw: S.h1.g.rotation.y }); S.h2.fly(t, hp2); const q = hp1(t), q2 = hp2(t); S.dst.update(t, q[0], q[2], q[1]); S.dst2.update(t, q2[0], q2[2], q2[1]); } });
  const c20 = W('The', 1) - .1, br = W('compound', 2) + .3;
  sh('compound', c19, c20, { night: true, post: 'nvg', from: [9.5, 1.75, 12], to: [4.8, 1.7, 5.8], lf: [-1, 1.6, -2], lt: [-2, 1.5, -2], fov: 50, bloom: .9, shakeAfter: br, punch: [br, .08],
    fx: (S, t) => { S.breach.update(t, br); S.wreck.g.visible = true; placeWreck(S); },
    chars: t => { const k = seg(t, 0, br - c19 - .2); return { s0: { p: mix([4, 0, 5.5], [-.4, 0, .4], k), s: { back: true, walk: k < 1 } }, s1: { p: mix([7.5, 0, 7.5], [1.8, 0, 1.2], k), s: { back: true, walk: k < 1 } }, s2: { p: mix([1, 0, 9], [-3.6, 0, .9], k), s: { back: true, walk: k < 1 } } }; } });
  // ---------------- THE RAID ----------------
  const c21 = W('BinLaden') - .1;
  sh('desk', c20, c21, { from: [80, 2.0, 4.2], to: [80, 2.0, 3.4], lf: [80, 2.0, -.7], lt: [80, 2.0, -.7], fov: 46, bloom: .6, punch: [W('hour'), .06],
    fx: (S, t) => S.swT.userData.draw(40 * eo(seg(t, c20 + .15, W('hour') + .1))) });
  const c22 = W('and', 1) - .1, kl = W('killed');
  sh('desk', c21, c22, { from: [0, 2.3, 3.4], to: [0, 2.3, 3.15], lf: [0, 1.8, -1], lt: [0, 1.8, -1], fov: 46, bloom: .6, punch: [kl, .1], shakeAfter: kl,
    fx: (S, t) => { S.tgt.material.opacity = 0; const k = ob(seg(t, kl - .05, kl + .2)); S.dec.material.opacity = t > kl - .05 ? 1 : 0; S.dec.scale.setScalar(2.4 - 1.4 * k); } });
  const c23 = W('for', 1) - .1;
  const lift = t => { const u = t - (c22 - .3); const y = Math.max(0, 3.2 * u * u + 1.2 * u); const f = Math.max(0, u - .9); return [-52 + f * f * 12, y, -34 - f * f * 10]; };
  sh('compound', c22, c23, { night: true, from: [22, 15, 34], to: [18, 15.5, 30], lf: [-36, 5, -24], lt: [-38, 7, -26], fov: 52, bloom: .8,
    fx: (S, t) => { S.wreck.g.visible = true; placeWreck(S); S.wreckFire.g.position.set(-19, 1.8, -12); S.wreckFire.update(t, 1); S.h2.g.visible = true; const q = lift(t); S.h2.fly(t, lift, { yaw: -.55 }); S.dst.update(t, q[0], q[2], q[1]); } });
  const c24 = W('Hours') - .1;
  sh('intel', c23, c24, { from: [0, 2.6, 5.4], to: [0, 2.6, 4.4], lf: [0, 2.6, -4], lt: [0, 2.6, -4], fov: 50, bloom: .7, screen: 'id', punch: [W('identification') + .2, .05], chars: t => analysts(t, true) });
  // ---------------- ANNOUNCEMENT ----------------
  const c25 = W('announced') - .1;
  sh('dc', c24, c25, { from: [200, 1.85, 6.6], to: [200, 1.85, 5.4], lf: [200, 1.75, 0], lt: [200, 1.8, 0], fov: 44, bloom: .5,
    chars: () => ({ pres: { p: [200, 0, .5], s: { arms: 'down', expr: 'neutral' } } }),
    over: t => tvOverlay(t, c24) });
  const c26 = W('After', 2) - .1;
  sh('dc', c25, c26, { from: [-5, 3.4, 23], to: [-2, 4.4, 15], lf: [0, 6, -20], lt: [0, 6.5, -20], fov: 54, bloom: .7, shake: .003 });
  // ---------------- AFTERMATH ----------------
  const c27 = W('the', 10) - .1;
  sh('desk', c26, c27, { from: [100, 2.1, 5.8], to: [100, 2.1, 5.0], lf: [100, 2.1, -1], lt: [100, 2.1, -1], fov: 46, bloom: .5, punch: [W('decade'), .06],
    fx: (S, t) => { const k = seg(t, c26 + .1, W('decade') + .25); const y = 2001 + Math.floor(k * 10 + 1e-6); S.yrT.userData.draw(Math.min(2011, y), (k * 10) % 1); } });
  const c28 = W('But', 2) - .1, fall = W('hunt') + .05;
  sh('desk', c27, c28, { from: [0, 2.1, 4.6], to: [0, 2.0, 4.3], lf: [0, 1.9, -1], lt: [0, 1.85, -1], fov: 46, bloom: .5,
    fx: (S, t) => { S.tgt.material.opacity = 0; S.dec.material.opacity = 1; S.dec.scale.setScalar(1); const u = Math.max(0, t - fall); S.posterG.position.set(Math.sin(u * 7) * .06 * u, 3.55 - .5 * 10.5 * u * u, -1.0 + u * .25); S.posterG.rotation.set(-u * .6, 0, Math.sin(u * 9) * .12 * Math.min(1, u * 3)); } });
  const c29 = W('How') - .1;
  sh('compound', c28, c29, { night: true, from: [16, 3.2, 36], to: [11, 3.8, 29], lf: [-2, 9, -8], lt: [-3, 9.5, -8], fov: 50, bloom: .7 });
  const c30 = W('so') - .1;
  sh('compound', c29, c30, { from: [26, 2.0, 30], to: [21, 2.2, 29], lf: [12, 2.6, 21], lt: [10, 2.8, 20], fov: 52, bloom: .4,
    chars: t => ({ l0: { p: [18.5 - t * 1.3, 0, 22.6], s: { walk: true, face: -.5 } }, l1: { p: [4 + t * 1.2, 0, 23.6], s: { walk: true, face: .5 } }, l2: { p: [8 + t * .9, 0, 26.0], s: { walk: true, face: .4 } }, l3: { p: [16 - t * 1.0, 0, 26.6], s: { walk: true, face: -.4 } }, kid0: { p: [11.8, 0, 20.6], s: { expr: 'happy', arms: 'raise', face: -.3 } }, kid1: { p: [13.4, 0, 20.4], s: { expr: 'happy', face: .3 } } }) });
  const c31 = W('This') - .1, acd = W('academy');
  sh('compound', c30, c31, { fov: 52, bloom: .45, punch: [acd, .05],
    cam: t => { const k = ease(seg(t, c30, c31 - .4)); return { p: mix([18, 16, 52], [-40, 110, 100], k), l: mix([0, 4, -8], [60, 0, -50], k) }; },
    fx: (S, t) => { S.distG.visible = true; const k = seg(t, W('close') - .1, acd); S.dashes.forEach((d, i) => d.visible = (i + .5) / S.dashes.length <= k); S.lbl.material.opacity = eo(seg(t, acd - .1, acd + .2)); S.acL.material.opacity = eo(seg(t, W('military') - .1, W('military') + .2)); S.cL.material.opacity = eo(seg(t, c30 + .2, c30 + .5)); } });
  sh('compound', c31, TL.duration, { night: true, from: [40, 22, 96], to: [36, 24, 90], lf: [0, 26, -60], lt: [0, 28, -60], fov: 54, bloom: .8, logo: true });
}
function analysts(t, cheer) { const o = {}; for (let i = 0; i < 6; i++) o['a' + i] = { p: [-2.4 + (i % 4) * 1.6, -.45, -1.05 + Math.floor(i / 4) * 1.6], s: { back: true, arms: cheer && i % 2 ? 'raise' : 'down' } }; return o; }
function pinPop(p, t, t0) { const k = eo(seg(t, t0, t0 + .18)); p.dot.material.emissiveIntensity = 2.5 * k; p.glow.material.opacity = .9 * k; const r = ((t - t0) * 1.6) % 1; p.ring.material.opacity = k * (1 - r); p.ring.scale.setScalar(1 + r * 4); p.lab.material.opacity = k; p.g.scale.setScalar(t < t0 ? 1 : 1 + .6 * (1 - ob(seg(t, t0, t0 + .3))) * 0); }
function placeWreck(S) { S.wreck.place([-19, 1.4, -12], -Math.PI / 2 + .18, -.3, .12); S.wreck.blades.rotation.y = .5; }
function tvOverlay(t, a) {
  ctx.save();
  ctx.fillStyle = '#c8102e'; ctx.beginPath(); ctx.roundRect(70, 300, 150, 62, 10); ctx.fill(); ctx.fillStyle = '#fff'; ctx.font = '800 40px Montserrat'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('LIVE', 145, 333);
  const k = eo(seg(t, a + .2, a + .55)); const y = 1540 + (1 - k) * 260;
  ctx.fillStyle = '#c8102e'; ctx.fillRect(0, y, OW * k, 84); ctx.fillStyle = '#fff'; ctx.textAlign = 'left'; ctx.font = '900 46px Montserrat'; ctx.fillText('BREAKING NEWS', 50, y + 44);
  ctx.fillStyle = 'rgba(250,250,250,.95)'; ctx.fillRect(0, y + 84, OW * k, 96); ctx.fillStyle = '#111'; ctx.font = '800 52px Montserrat'; ctx.fillText('BIN LADEN IS DEAD', 50, y + 134);
  ctx.restore();
}

// ---------- captions ----------
let GROUPS = [];
function buildCaptions() {
  const ws = WORDS; let i = 0;
  while (i < ws.length) {
    let g = [ws[i]]; let j = i + 1;
    while (j < ws.length) { const cur = g.map(x => x.w).join(' '); const nx = ws[j].w; const gap = ws[j].a - ws[j - 1].a; const ok = gap < .5 && (cur.length <= 4 || nx.replace(/[^A-Za-z]/g, '').length <= 2) && (cur.length + nx.length + 1) <= 13 && !/[.,?!:]$/.test(cur); if (!ok) break; g.push(ws[j]); j++; }
    GROUPS.push({ txt: g.map(x => x.w).join(' '), a: g[0].a, last: g[g.length - 1] }); i = j;
  }
  GROUPS.forEach((g, k) => { const n = GROUPS[k + 1]; g.b = n ? Math.min(n.a, g.last.b + .25) : g.last.b + .4; });
}
const EMPH = /(changed|2011|Abbottabad|helicopters|secret|Osama|11th|couriers|mysterious|walls|approved|darkness|SEALs|hour|killed|identification|Obama|decade|over\.|question|plain|academy|wanted)/i;
function drawCaption(t) {
  const g = GROUPS.find(g => t >= g.a && t < g.b); if (!g) return;
  const k = lin((t - g.a) / .08); const big = EMPH.test(g.txt);
  const sc = 1 + (big ? .22 : .07) * (1 - k);
  ctx.save(); ctx.translate(OW / 2, 1352); ctx.scale(sc, sc);
  ctx.font = `800 ${big ? 86 : 76}px Montserrat`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';
  ctx.shadowColor = 'rgba(0,0,0,.75)'; ctx.shadowBlur = 10; ctx.shadowOffsetX = 4; ctx.shadowOffsetY = 6;
  ctx.lineWidth = 9; ctx.strokeStyle = '#0a0a0a'; ctx.strokeText(g.txt, 0, 0);
  ctx.shadowColor = 'transparent'; ctx.fillStyle = big ? '#ffd23f' : '#ffffff'; ctx.fillText(g.txt, 0, 0); ctx.restore();
}
const noise = document.createElement('canvas'); noise.width = noise.height = 256;
{ const n = noise.getContext('2d'), d = n.createImageData(256, 256); for (let i = 0; i < d.data.length; i += 4) { const v = Math.random() * 255; d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 255; } n.putImageData(d, 0, 0); }

// ---------- logo end card ----------
function drawLogo(t) {
  const a0 = W('This') - .12; if (t < a0 - .2) return;
  const k = ob(seg(t, a0, a0 + .55)); const fade = 1 - seg(t, TL.duration - .9, TL.duration - .1);
  ctx.save(); ctx.globalAlpha = fade;
  ctx.fillStyle = `rgba(0,0,0,${.55 * eo(seg(t, a0 - .2, a0 + .3))})`; ctx.fillRect(0, 0, OW, OH);
  const cx = OW / 2, cy = 700, R = 360 * k;
  if (R > 1) {
    const gr = ctx.createRadialGradient(cx, cy, R * .9, cx, cy, R * 1.35); gr.addColorStop(0, 'rgba(255,190,90,.55)'); gr.addColorStop(1, 'rgba(255,120,40,0)'); ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(cx, cy, R * 1.35, 0, 7); ctx.fill();
    ctx.save(); ctx.translate(cx, cy); ctx.rotate((1 - k) * -.5 + Math.sin(t * .8) * .01); ctx.beginPath(); ctx.arc(0, 0, R, 0, 7); ctx.clip();
    ctx.drawImage(LOGO, -R * 1.035, -R * 1.035, R * 2.07, R * 2.07);
    const sx = (seg(t, a0 + .6, a0 + 1.5) * 2 - 1) * R * 1.6; const sw = ctx.createLinearGradient(sx - 120, -R, sx + 120, R); sw.addColorStop(0, 'rgba(255,255,255,0)'); sw.addColorStop(.5, 'rgba(255,245,220,.45)'); sw.addColorStop(1, 'rgba(255,255,255,0)'); ctx.globalCompositeOperation = 'screen'; ctx.fillStyle = sw; ctx.fillRect(-R, -R, 2 * R, 2 * R);
    ctx.restore();
  }
  const fl = 1 - seg(t, a0, a0 + .25); if (t >= a0 && fl > 0) { ctx.fillStyle = `rgba(255,240,210,${fl * .7})`; ctx.fillRect(0, 0, OW, OH); }
  const hk = eo(seg(t, W('RedrawnStories') - .1, W('RedrawnStories') + .35));
  if (hk > 0) { ctx.globalAlpha = fade * hk; ctx.font = '800 64px Montserrat'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round'; ctx.lineWidth = 8; ctx.strokeStyle = '#000'; ctx.strokeText('@redrawn.stories', cx, 1150 + (1 - hk) * 30); ctx.fillStyle = '#f2e3c4'; ctx.fillText('@redrawn.stories', cx, 1150 + (1 - hk) * 30); }
  const f0 = W('history'), press = W('worldchanging');
  const bk = ob(seg(t, f0 - .05, f0 + .4));
  if (bk > 0) {
    const pressed = t > press; const pk = 1 - .12 * Math.sin(Math.PI * seg(t, press - .1, press + .15));
    const bw = 420 * bk * pk, bh = 120 * bk * pk; ctx.globalAlpha = fade;
    ctx.fillStyle = pressed ? '#3a3a3a' : '#0095f6'; ctx.beginPath(); ctx.roundRect(cx - bw / 2, 1545 - bh / 2, bw, bh, 26); ctx.fill();
    ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(0,0,0,.6)'; ctx.stroke();
    ctx.fillStyle = '#fff'; ctx.font = `800 ${Math.round(58 * bk * pk)}px Montserrat`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(pressed ? 'Following ✓' : 'Follow', cx, 1548);
    if (t > press - .1 && t < press + .6) { const r = seg(t, press - .1, press + .6); ctx.strokeStyle = `rgba(255,255,255,${1 - r})`; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(cx + 120, 1560, 30 + r * 90, 0, 7); ctx.stroke(); }
  }
  ctx.restore();
}

let FLASH = [];
function resetSet(shot, S, t) {
  if (shot.set === 'compound') { S.setMode(!!shot.night); S.h1.g.visible = S.h2.g.visible = false; S.wreck.g.visible = false; S.wreckFire.update(t, 0); S.trash.update(t, shot.trash ? 1 : 0); S.car.g.visible = false; S.dst.update(t, 0, 0, 99, 0); S.dst2.update(t, 0, 0, 99, 0); S.breach.update(t, 1e9); S.pacer.visible = false; S.distG.visible = false; }
  if (shot.set === 'desk') { S.tgt.material.opacity = 0; S.dec.material.opacity = 0; S.approved.material.opacity = 0; S.stamp.position.set(60.02, 1.75, .22); S.posterG.position.set(0, 3.55, -1.0); S.posterG.rotation.set(0, 0, 0); S.page.visible = true; S.page.rotation.x = 0; S.strings.forEach(s => { s.visible = true; s.scale.y = s.userData.L; }); }
  if (shot.set === 'intel') S.scrT.userData.draw(t, shot.screen || 'net');
}
function render(t) {
  const shot = SHOTS.find(s => t >= s.a && t < s.b) || SHOTS[SHOTS.length - 1];
  const S = getSet(shot.set); const lt = (t - shot.a) / (shot.b - shot.a); const e = ease(lt);
  cam.fov = shot.fov || 45;
  let look;
  if (shot.cam) { const c = shot.cam(t); cam.position.set(...c.p); look = V(c.l); }
  else { cam.position.copy(V(shot.from).lerp(V(shot.to), e)); look = V(shot.lf).lerp(V(shot.lt), e); }
  if (shot.punch) { const p = seg(t, shot.punch[0], shot.punch[0] + .12) * (1 - seg(t, shot.punch[0] + .12, shot.punch[0] + .7)); cam.fov *= 1 - shot.punch[1] * eo(p); }
  cam.fov *= 1 + .05 * (1 - eo(seg(t, shot.a, shot.a + .22)));
  cam.lookAt(look);
  if (shot.shake) { cam.position.x += Math.sin(t * 37) * shot.shake; cam.position.y += Math.cos(t * 29) * shot.shake; cam.lookAt(look); }
  cam.rotation.z += Math.sin(t * .9) * .003; cam.updateProjectionMatrix();
  resetSet(shot, S, t);
  S.update(t);
  if (shot.shakeAfter && t > shot.shakeAfter) { const k = Math.max(0, 1 - (t - shot.shakeAfter) / .8); cam.position.x += Math.sin(t * 61) * .03 * k; cam.position.y += Math.cos(t * 47) * .03 * k; }
  if (shot.fx) shot.fx(S, t);
  const cs = shot.chars ? shot.chars(t - shot.a) : {};
  for (const [k, ch] of Object.entries(S.chars)) { const c = cs[k]; if (!c || shot.hideChars) { ch.mesh.visible = ch.shadow.visible = false; continue; } ch.set(V(c.p), { ...c.s, t }, cam); if (Math.abs(c.p[1]) > .01) ch.shadow.visible = false; }
  rp.scene = S.scene; bokeh.scene = S.scene; bokeh.enabled = !!shot.dof;
  if (shot.dof) { bokeh.uniforms.focus.value = shot.dof.focus ?? cam.position.distanceTo(look); bokeh.uniforms.aperture.value = (shot.dof.ap ?? .008) * .1; bokeh.uniforms.maxblur.value = .016; }
  bloom.strength = shot.bloom ?? .45;
  composer.render();
  ctx.globalAlpha = 1;
  if (shot.post === 'nvg') { ctx.filter = 'grayscale(1) brightness(2.3) contrast(1.25)'; ctx.drawImage(renderer.domElement, 0, 0, OW, OH); ctx.filter = 'none'; ctx.save(); ctx.globalCompositeOperation = 'multiply'; ctx.fillStyle = '#6dff7e'; ctx.fillRect(0, 0, OW, OH); ctx.restore(); }
  else if (shot.post === 'sat') { ctx.filter = 'grayscale(1) contrast(1.2) brightness(1.05)'; ctx.drawImage(renderer.domElement, 0, 0, OW, OH); ctx.filter = 'none'; }
  else ctx.drawImage(renderer.domElement, 0, 0, OW, OH);
  const vg = ctx.createRadialGradient(OW / 2, OH * .48, OH * .3, OW / 2, OH * .5, OH * .78); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, `rgba(0,0,0,${shot.post === 'nvg' ? .85 : .52})`); ctx.fillStyle = vg; ctx.fillRect(0, 0, OW, OH);
  ctx.save(); ctx.globalAlpha = shot.post === 'nvg' ? .14 : .045; ctx.globalCompositeOperation = 'overlay'; const ox = Math.floor(hash(Math.floor(t * 30)) * 256), oy = Math.floor(hash(Math.floor(t * 30) + 5) * 256); ctx.translate(-ox, -oy); ctx.fillStyle = ctx.createPattern(noise, 'repeat'); ctx.fillRect(0, 0, OW + 256, OH + 256); ctx.restore();
  if (shot.post === 'nvg') { ctx.save(); ctx.font = '700 32px "DejaVu Sans Mono"'; ctx.fillStyle = '#b8ffc0'; ctx.fillText('NVG  ●  REC', 80, 400); ctx.restore(); }
  if (shot.over) shot.over(t);
  for (const f of FLASH) { const a = 1 - seg(t, f, f + .18); if (t >= f && a > 0) { ctx.fillStyle = `rgba(255,255,255,${a * .5})`; ctx.fillRect(0, 0, OW, OH); } }
  const fin = t < .2 ? 1 - t / .2 : 0; if (fin > 0) { ctx.fillStyle = `rgba(0,0,0,${fin})`; ctx.fillRect(0, 0, OW, OH); }
  if (shot.logo) drawLogo(t);
  if (t < TL.duration - .9 && !window.NOCAP) drawCaption(t);
}
window.setup = async (tl) => {
  TL = tl; WORDS = tl.words;
  for (const f of ['800 76px Montserrat', '900 76px Montserrat', 'bold 40px Montserrat', 'bold 54px "DejaVu Sans"', 'bold 30px "DejaVu Sans Mono"']) await document.fonts.load(f);
  LOGO = new Image(); LOGO.src = 'logo.png'; await LOGO.decode();
  Object.keys(B).forEach(getSet);
  buildShots(); buildCaptions();
  FLASH = [W('changed'), W('2011'), W('approved') + .04, W('compound', 2) + .3, W('killed')];
  return SHOTS.map(s => [s.set, +s.a.toFixed(2), +s.b.toFixed(2)]);
};
window.render = render; window.ready = true;
