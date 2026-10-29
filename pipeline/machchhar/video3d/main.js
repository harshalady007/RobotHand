import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { buildSky, buildAirport, buildCockpit, buildCabin, buildMapME, buildFlagHill, loadMap, dive, takeoffProfile, CAPT, COPI, RELIEF, PAX, G } from './smit.js';
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
const B = { sky: buildSky, dxb: () => buildAirport('dxb'), tbk: () => buildAirport('tbk'), cock: buildCockpit, cabin: buildCabin, map: buildMapME, flag: buildFlagHill };
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

// ---------- shots ----------
let SHOTS = []; let EV = {};
const lookAt = (p) => p;
function buildShots() {
  const sh = (set, a, b, o) => SHOTS.push({ set, a, b, ...o });
  const E = EV;
  // flight geometry
  const dxbX0 = -900, tLift = 10.95, tpDxb = takeoffProfile(tLift - 31.6);
  const dxbPath = t => { const s = tpDxb(t); return [dxbX0 + s.s, s.y, 0]; };
  const tTD = 39.55, xTD = 600, aDec = 3.2, vApp = 72;
  const sRoll = t => { const u = Math.max(0, t - tTD); return vApp * u - .5 * aDec * u * u * (u < vApp / aDec ? 1 : 0) - (u >= vApp / aDec ? 0 : 0); };
  const sApp = t => { if (t >= tTD) { const u = Math.min(t - tTD, vApp / aDec); return vApp * u - .5 * aDec * u * u; } return -vApp * (tTD - t); };
  const hApp = s => { const a = -s; if (a <= 0) return 0; if (a > 150) return 150 * .0524 / 1.35 + (a - 150) * .0524; return (150 * .0524 / 1.35) * Math.pow(a / 150, 1.35); };
  const tbkPath = t => { const s = sApp(t); return [xTD + s, hApp(s) + 0, 0]; };
  EV.tTD = tTD; EV.tLift = tLift;
  const ck = (o = {}) => o;
  const CPOS = { cap: [-.55, -.3, .4], fo: [.55, -.3, .4] };

  // ---------- 1 hook ----------
  const c1 = W('Your', 2) - .06;
  sh('cock', 0, c1, { fov: 54, bloom: .25, shake: .002, punch: [W('stabbed'), .07], cam: t => ({ p: mix([-.15, 1.55, -1.7], [-.25, 1.52, -1.8], ease(t / c1)), l: [-.35, 1.3, .4] }),
    chars: t => { const hit = t > W('stabbed') - .02; return { cap: { p: [CPOS.cap[0] - (hit ? .06 : 0), -.3, .5], s: { expr: hit ? 'surprised' : 'neutral', bandage: false } }, fo: { p: CPOS.fo, s: { expr: 'angry', arms: hit ? 'point' : 'down', armDir: -1 } } }; },
    over: t => { chipAt(t, W('pilot') - .05, OW / 2, 520, 'PILOT ATTACKED', '#ff5a4a'); } });
  // ---------- 2 plane plunging ----------
  const c2 = W('182') - .06; const d2 = dive(1.75, 10360, 245, .40);
  sh('sky', c1, c2, { fov: 52, bloom: .3, shake: .003, punch: [W('plunging'), .06], cam: t => { const P = d2(t); return { p: [P[0] + 120, 10360 + 6, P[2] + 6], l: [P[0], P[1], P[2]] }; }, fx: (S, t) => { S.air.show(true); S.air.fly(t, d2, { gear: false }); },
    over: t => { stamp(t, W('plunging') - .02, [{ t: 'PLUNGING', c: '#ff5a4a' }], 520, '#ff5a4a', -.05, 150); } });
  // ---------- 3 182 lives ----------
  const c3 = W('182') + 1.55, c3b = W('one', 1) - .28;
  const pax = (n, z, x0, o = {}) => { const r = {}; for (let i = 0; i < n; i++) { const side = i % 2 ? 1 : -1; r['p' + i] = { p: [side * (.95 + (Math.floor(i / 2) % 3) * .52), -.2, z + Math.floor(i / 2) * 1.3 - .5], s: { arms: 'raise', expr: 'worried', ...o } }; } return r; };
  sh('cabin', c2, c3, { fov: 62, bloom: .2, shake: .004, cam: t => ({ p: mix([0, 1.7, 17], [0, 1.6, 12.5], ease(seg(t, c2, c3))), l: [0, 1.45, -2] }), chars: t => pax(10, 1, 0, { expr: 'worried' }),
    fx: (S, t) => { S.masks.forEach(m => m.visible = false); }, over: t => { stamp(t, W('182') - .02, [{ t: '182', size: 300 }, { t: 'LIVES ON BOARD', size: 70, c: '#ffffff' }], 500, '#ffd23f', -.05, 200, 2.4); } });
  sh('cabin', c3, c3b, { fov: 52, bloom: .2, shake: .005, cam: t => ({ p: mix([.2, 1.5, 8], [0, 1.5, 6.4], ease(seg(t, c3, c3b))), l: [0, 1.5, 1.5] }), chars: t => pax(8, 1, 0, { expr: 'surprised' }), over: t => { chipAt(t, W('line') - .05, OW / 2, 520, 'ALL AT RISK', '#ff5a4a'); } });
  // ---------- 4 one man refuses ----------
  const c4 = W('give') - .06, c4b = W('September') - .33;
  sh('cock', c3b, c4, { fov: 46, bloom: .3, punch: [W('one', 1), .06], cam: t => ({ p: mix([-.2, 1.5, -1.6], [-.4, 1.5, -1.35], ease(seg(t, c3b, c4))), l: [-.55, 1.4, .4] }), chars: t => ({ cap: { p: CPOS.cap, s: { expr: 'worried', bandage: true } } }),
    over: t => { stamp(t, W('man') - .1, [{ t: 'ONE MAN', size: 150, c: '#ffd23f' }], 330, '#ffd23f', -.05, 150); } });
  sh('cock', c4, c4b, { fov: 44, bloom: .35, cam: t => ({ p: mix([-.45, 1.5, -1.25], [-.5, 1.48, -1.05], ease(seg(t, c4, c4b))), l: [-.55, 1.42, .4] }), chars: t => ({ cap: { p: CPOS.cap, s: { expr: 'angry', bandage: true } } }),
    over: t => chipAt(t, W('give') - .05, OW / 2, 480, 'NEVER GIVES UP', '#ffffff') });
  // ---------- 5 Dubai take-off ----------
  const c5 = W('Fly', 1) - .1;
  sh('dxb', c4b, c5, { fov: 52, bloom: .25, cam: t => { const P = dxbPath(t); return { p: [P[0] + 8 + (t - c4b) * 2, 9 - (t - c4b) * .8, 100], l: [P[0], P[1] + 4, 0] }; },
    fx: (S, t) => { S.mover.show(true); const st = tpDxb(t); S.mover.fly(t, dxbPath, { alpha: t => tpDxb(t).rot, dist: st.s, gear: undefined, ground: 0 }); }, over: t => { calCard(t, W('September') - .02, OW / 2, 520); chipAt(t, W('2026') + .2, OW / 2, 900, 'DUBAI', '#ffd23f'); } });
  // ---------- 6 Flight 1073 climbing ----------
  const c6 = W('flying') - .05;
  sh('dxb', c5, c6, { fov: 50, bloom: .25, cam: t => { const P0 = dxbPath(c5); return { p: [P0[0] + 220, 2.0, 120], l: [dxbPath(t)[0], dxbPath(t)[1] + 4, 0] }; },
    fx: (S, t) => { S.mover.show(true); const st = tpDxb(t); S.mover.fly(t, dxbPath, { alpha: t => tpDxb(t).rot, dist: st.s, ground: 0 }); }, over: t => { chipAt(t, W('Flight') - .1, OW / 2, 520, 'FLIGHT FZ1073', '#ffffff'); chipAt(t, W('1073') + .1, OW / 2, 640, 'BOEING 737 MAX 8', '#ffd23f', undefined, 36); } });
  // ---------- 7 route map ----------
  const c7 = W('Indian', 1) - .05;
  sh('map', c6, c7, { fov: 46, bloom: .3, cam: t => { const k = ease(seg(t, c6, c7)); const C = SETS.map.P(45, 28.5, 0); return { p: [C.x + mix([34], [24], k)[0], mix([66], [54], k)[0], C.z + 1], l: [C.x - 1, 0, C.z] }; },
    fx: (S, t) => { S.pins.dxb.set(t, c6); S.pins.tlv.set(t, W('Tel Aviv') - .4); const k = eo(seg(t, c6 + .2, c7 - .1)); S.r1.set(k); S.placeIcon(S.r1, k); },
    over: t => { const dp = SETS.map.P(...SETS.map.PL.dxb, 3), tp = SETS.map.P(...SETS.map.PL.tlv, 3); const [x1, y1] = proj([dp.x, dp.y, dp.z]); const [x2, y2] = proj([tp.x, tp.y, tp.z]); chipAt(t, W('Dubai', 2) - .05, x1, y1 - 120, 'DUBAI', '#ff9933', undefined, 34); chipAt(t, W('Tel Aviv') - .05, x2, y2 - 120, 'TEL AVIV', '#6ab4ff', undefined, 34); } });
  // ---------- 8 Indian captain Smit ----------
  const c8 = W('allegedly') - .2;
  sh('cock', c7, c8, { fov: 50, bloom: .3, cam: t => ({ p: mix([-.3, 1.55, -1.8], [-.45, 1.52, -1.6], ease(seg(t, c7, c8))), l: [-.5, 1.3, .4] }), chars: t => ({ cap: { p: CPOS.cap, s: { expr: 'smile' } }, fo: { p: CPOS.fo, s: { expr: 'neutral' } } }),
    over: t => { chipAt(t, W('Captain', 1) - .05, OW / 2, 480, 'CAPTAIN SMIT MACHCHHAR', '#ffffff', undefined, 36); const k = ob(seg(t, W('Indian', 1), W('Indian', 1) + .3)); if (k > 0) { ctx.save(); ctx.translate(OW / 2, 1240); ctx.scale(k, k); flagIn(-70, -46, 140, t); ctx.restore(); } } });
  // ---------- 9 allegedly attacked ----------
  const c9 = W('attacked') + .5, c9b = W('The', 2) - .22;
  const hit = W('attacked') + .02; EV.hit = hit;
  sh('cock', c8, c9, { fov: 68, bloom: .3, shake: .0015, punch: [hit, .09], cam: t => ({ p: mix([0, 1.6, -1.85], [0, 1.58, -1.7], ease(seg(t, c8, c9))), l: [0, 1.32, .4] }),
    chars: t => { const a = t > hit; const lunge = eo(seg(t, hit - .25, hit)); return { cap: { p: [CPOS.cap[0] - (a ? .08 : 0), -.3, .5], s: { expr: a ? 'surprised' : 'neutral', bandage: a } }, fo: { p: [CPOS.fo[0] - .25 * lunge, -.3, .5 - .05 * lunge], s: { expr: 'angry', arms: 'point', armDir: -1 } } }; },
    over: t => { chipAt(t, W('allegedly') - .05, OW / 2, 480, 'ALLEGEDLY', '#ffd23f'); } });
  sh('cock', c9, c9b, { fov: 52, bloom: .3, shake: .004, cam: t => ({ p: mix([.2, 1.55, -1.7], [.35, 1.5, -1.45], ease(seg(t, c9, c9b))), l: [.55, 1.35, .4] }), chars: t => ({ fo: { p: CPOS.fo, s: { expr: 'angry', arms: 'point', armDir: -1 } }, cap: { p: [-.62, -.35, .5], s: { expr: 'tired', bandage: true } } }),
    over: t => { chipAt(t, W('own') - .1, OW / 2, 480, 'HIS OWN CO-PILOT', '#ff5a4a'); } });
  // ---------- 10 aircraft plunges ----------
  const c10 = W('as') - .0; const d10 = dive(19.7, 10360, 245, .40);
  sh('sky', c9b, c10, { fov: 54, bloom: .3, shake: .004, punch: [W('plunges'), .07], cam: t => { const P = d10(t); return { p: [P[0] + 80, 10360 + 30, P[2] - 110], l: [P[0], P[1] - 4, P[2]] }; }, fx: (S, t) => { S.air.show(true); S.air.fly(t, d10, { gear: false }); },
    over: t => { stamp(t, W('plunges') - .02, [{ t: 'PLUNGES', c: '#ff5a4a' }], 500, '#ff5a4a', -.05, 120); altBar(t, W('plunges'), c10 + 1.2); chipAt(t, W('dangerously') - .1, OW / 2, 700, 'SQUAWK 7700', '#ffd23f', undefined, 36); } });
  // ---------- 11 chaos ----------
  const c11 = W('Severely') - .1;
  sh('cabin', c10, c11, { fov: 60, bloom: .25, shake: .012, cam: t => ({ p: mix([.3, 1.6, 8.0], [-.2, 1.5, 6.4], ease(seg(t, c10, c11))), l: [0, 1.5, -1] }), chars: t => { const r = pax(10, 0, 0, { expr: 'surprised', arms: Math.sin(t * 9) > 0 ? 'cheer' : 'raise' }); return r; },
    fx: (S, t) => { S.masks.forEach(m => m.visible = true); S.itemsAt(t, c10, true); }, over: t => { stamp(t, W('chaos') - .02, [{ t: 'CHAOS', c: '#ff5a4a' }], 520, '#ff5a4a', .05, 190, 1.4); chipAt(t, W('erupts') + .0, OW / 2, 760, 'SQUAWK 7500', '#ff5a4a', undefined, 36, 1.0); } });
  // ---------- 12 severely wounded ----------
  const c12 = W('this', 1) - .06;
  sh('cock', c11, c12, { fov: 50, bloom: .3, shake: .0025, cam: t => ({ p: mix([-.35, 1.3, -1.7], [-.45, 1.2, -1.5], ease(seg(t, c11, c12))), l: [-.58, 1.0, .4] }), chars: t => ({ cap: { p: [-.58 - .02 * Math.sin(t * 3), -.75, .5], s: { expr: 'tired', bandage: true, arms: 'down' } } }),
    over: t => { chipAt(t, W('Severely') - .02, OW / 2, 480, 'SEVERELY WOUNDED', '#ff5a4a'); } });
  // ---------- 13 refuses to surrender ----------
  const c13 = W('refuses', 2) - .02, c13b = W('He') - .02;
  sh('cock', c12, c13, { fov: 48, bloom: .3, cam: t => ({ p: mix([-.45, 1.2, -1.6], [-.5, 1.4, -1.5], ease(seg(t, c12, c13))), l: [-.58, 1.2, .4] }), chars: t => { const k = ease(seg(t, c12, c13)); return { cap: { p: [-.58, -.75 + .35 * k, .5], s: { expr: 'worried', bandage: true } } }; },
    over: t => chipAt(t, W('Indian', 2) - .05, OW / 2, 480, 'INDIAN CAPTAIN', '#ff9933') });
  sh('cock', c13, c13b, { fov: 46, bloom: .4, punch: [W('refuses', 2), .06], cam: t => ({ p: mix([-.5, 1.5, -1.4], [-.54, 1.5, -1.2], ease(seg(t, c13, c13b))), l: [-.58, 1.4, .4] }), chars: t => ({ cap: { p: [-.58, -.4, .5], s: { expr: 'angry', bandage: true } } }),
    over: t => { stamp(t, W('refuses', 2) - .05, [{ t: 'REFUSES', c: '#ffd23f' }, { t: 'TO SURRENDER', size: 80, c: '#ffffff' }], 330, '#ffd23f', -.05, 140); } });
  // ---------- 14 fights back, reaches ----------
  const c14 = W('one', 2) - .1;
  sh('cock', c13b, c14, { fov: 62, bloom: .3, shake: .003, cam: t => ({ p: mix([.6, 1.4, 1.55], [.5, 1.3, 1.35], ease(seg(t, c13b, c14))), l: [-.3, .95, .2] }), chars: t => { const k = eo(seg(t, c13b + .3, c14)); return { cap: { p: [-.58 + .3 * k, -.5 + .1 * k, .5 - .2 * k], s: { expr: 'angry', bandage: true } } }; },
    fx: (S, t) => { const k = eo(seg(t, c13b + .3, c14)); S.arm(V([-.5 + .2 * k, 1.0, .5]), V([-.4 + .35 * k, 1.0 - .38 * k, .45 - .15 * k])); S.press(t, 1e9); },
    over: t => chipAt(t, W('fights') - .05, OW / 2, 480, 'FIGHTS BACK', '#ffd23f') });
  // ---------- 15 the one button ----------
  const c15 = W('cockpit') - .05; const tPress = W('door') + .0; EV.press = tPress;
  sh('cock', c14, c15, { fov: 56, bloom: .5, punch: [W('one', 2), .08], cam: t => { const k = ease(seg(t, c14, c15)); return { p: mix([.3, 1.3, 1.7], [.2, 1.1, 1.5], k), l: [-.05, .62, .25] }; }, fx: (S, t) => { S.arm(V([-.45, 1.0, .5]), V([-.08, .68, .33])); S.press(t, 1e9); },
    over: t => { stamp(t, W('button') - .05, [{ t: 'ONE BUTTON', c: '#ffd23f' }], 330, '#ffd23f', -.05, 115); } });
  // ---------- 16 press + door opens ----------
  const c16 = W('release') - .25, c16b = W('Passengers') - .05;
  sh('cock', c15, c16, { fov: 56, bloom: .5, shake: .004, cam: t => ({ p: mix([.8, 1.3, 1.4], [.55, 1.2, 1.3], ease(seg(t, c15, c16))), l: [-.1, .65, .25] }),
    fx: (S, t) => { S.arm(V([-.45, 1.0, .5]), V([-.05, .64 + .0, .3])); S.press(t, tPress); }, chars: t => ({ cap: { p: [-.55, -.5, .45], s: { expr: 'tired', bandage: true } } }),
    over: t => { chipAt(t, W('cockpit') - .1, OW / 2, 480, 'COCKPIT DOOR', '#ffffff'); } });
  sh('cock', c16, c16b, { fov: 66, bloom: .4, shake: .004, cam: t => ({ p: [0, 1.55, -1.65], l: [0, 1.2, 1.9] }), chars: t => ({ cap: { p: [-.55, -.55, .4], s: { expr: 'tired', bandage: true } } }),
    fx: (S, t) => { S.press(t, tPress); S.door(ease(seg(t, tPress + .05, tPress + .7))); }, over: t => { chipAt(t, W('release') - .1, OW / 2, 480, 'DOOR RELEASE', '#3aff6a'); } });
  // ---------- 17 passengers rush in ----------
  const c17 = W('overpower') - .05, c17b = W('Two') - .27;
  const run = (n, t, t0, v = 4.4) => { const r = {}; for (let i = 0; i < n; i++) { const z = 8.5 - v * (t - t0) + i * 1.4 + (i % 2) * .6; r['p' + i] = { p: [(i % 3 - 1) * .5, -.15, z], s: { arms: 'raise', expr: 'angry', walk: true } }; } return r; };
  sh('cabin', c16b, c17, { fov: 58, bloom: .2, shake: .006, cam: t => ({ p: [0, 1.55, -4.4], l: [0, 1.4, 6] }), chars: t => run(9, t, c16b), fx: (S, t) => { S.door(1); },
    over: t => { chipAt(t, W('rush') - .05, OW / 2, 480, 'PASSENGERS RUSH IN', '#ffd23f'); } });
  sh('cabin', c17, c17b, { fov: 56, bloom: .2, shake: .006, cam: t => ({ p: mix([.3, 1.6, 2.0], [.1, 1.6, 1.5], ease(seg(t, c17, c17b))), l: [0, 1.2, -4.0] }), fx: (S, t) => { S.door(1); },
    chars: t => ({ fo: { p: [0, -.95, -3.0], s: { expr: 'angry', arms: 'box' } }, p0: { p: [-.95, -.2, -3.9], s: { arms: 'raise', expr: 'angry' } }, p1: { p: [.95, -.2, -3.8], s: { arms: 'raise', expr: 'angry' } }, p2: { p: [-.4, -.2, -4.4], s: { arms: 'raise', expr: 'angry' } }, p3: { p: [.4, -.2, -4.5], s: { arms: 'cheer', expr: 'angry' } } }),
    over: t => { chipAt(t, W('attacker') - .1, OW / 2, 480, 'ATTACKER OVERPOWERED', '#ffffff', undefined, 34); } });
  // ---------- 18 two pilots take control ----------
  const c18 = W('and', 5) - .06;
  sh('cock', c17b, c18, { fov: 74, bloom: .3, cam: t => ({ p: mix([0, 1.6, -1.88], [0, 1.58, -1.75], ease(seg(t, c17b, c18))), l: [0, 1.3, .4] }), chars: t => ({ r0: { p: CPOS.cap, s: { expr: 'neutral' } }, r1: { p: CPOS.fo, s: { expr: 'neutral' } } }),
    over: t => { chipAt(t, W('Two') - .05, OW / 2, 480, 'TWO PILOTS TAKE CONTROL', '#ffd23f', undefined, 34); } });
  // ---------- 19 landing at Tabuk ----------
  const c19 = W('Tabuk') - .06; EV.td = tTD;
  sh('tbk', c18, c19, { fov: 52, bloom: .3, punch: [tTD, .07], cam: t => { const P = tbkPath(t); return { p: [xTD + 70 - (t - c18) * 6, 2.4 + (t - c18) * .3, 62], l: [P[0] + 6, P[1] + 3, 0] }; },
    fx: (S, t) => { S.mover.show(true); const s = sApp(t); S.mover.fly(t, tbkPath, { gear: true, alpha: t => t < tTD ? .06 : Math.max(0, .06 * (1 - (t - tTD) / 1.2)), dist: Math.max(0, s), ground: 0 }); S.smoke(t, tTD, [xTD, 0, 0]); },
    over: t => { chipAt(t, W('land') - .05, OW / 2, 480, 'LANDS SAFELY', '#3aff6a'); } });
  // ---------- 20 map: Tabuk ----------
  const c20 = W('Everyone') - .27;
  sh('map', c19, c20, { fov: 46, bloom: .3, cam: t => { const k = ease(seg(t, c19, c20)); const C = SETS.map.P(37.2, 29.6, 0); return { p: [C.x + 4 - k * 2, mix([36], [30], k)[0], C.z + 12], l: [C.x, 0, C.z - 1] }; },
    fx: (S, t) => { S.pins.tlv.set(t, c19 - 5); S.pins.alert.set(t, c19 - 5); S.pins.tbk.set(t, W('Tabuk')); S.r1.set(1); const k = eo(seg(t, c19 + .1, c20 - .1)); S.r2.set(k); S.placeIcon(S.r2, k); },
    over: t => { const tp = SETS.map.P(...SETS.map.PL.tbk, 5), ap = SETS.map.P(...SETS.map.PL.alert, 5); const [x1, y1] = proj([tp.x, tp.y, tp.z]), [x2, y2] = proj([ap.x, ap.y, ap.z]); chipAt(t, W('Tabuk') + .0, x1 + 120, y1 + 10, 'TABUK', '#ffd23f'); chipAt(t, c19 + .3, x2 + 150, y2 - 20, 'DIVERTED', '#ff5a4a', undefined, 34); chipAt(t, W('Saudi') - .05, OW / 2, 1160, 'SAUDI ARABIA', '#ffffff', undefined, 38); } });
  // ---------- 21 everyone survived ----------
  const c21 = W('And', 6) - .06;
  const cheer = (t, base) => { const r = {}; for (let i = 0; i < 8; i++) r['c' + i] = { p: [base + (i - 3.5) * 2.0 + (i % 2) * .4, 0, 150 + (i % 3) * 3 - 22], s: { arms: i % 2 ? 'cheer' : 'raise', expr: 'happy', walk: false } }; return r; };
  sh('tbk', c20, c21, { fov: 56, bloom: .35, punch: [W('survived'), .06], cam: t => ({ p: mix([302, 2.0, 116], [302, 2.3, 121], ease(seg(t, c20, c21))), l: [300, 3.2, 160] }), chars: t => cheer(t, 300), fx: (S, t) => { S.parked.show(true); },
    over: t => { stamp(t, W('survived') - .15, [{ t: 'EVERYONE', size: 110, c: '#ffffff' }, { t: 'SURVIVED', size: 150, c: '#3aff6a' }], 480, '#3aff6a', -.05, 150, 1.5); } });
  // ---------- 22 courage: ambulance ----------
  const c22 = W('defining') - .2; const ambPath = t => 120 + 18 * (t - c21);
  sh('tbk', c21, c22, { fov: 52, bloom: .3, cam: t => { const x = ambPath(t); return { p: [x + 17, 2.0, 121], l: [x + 2, 1.8, 110] }; },
    chars: t => { const r = {}; for (let i = 0; i < 4; i++) r['c' + i] = { p: [175 + i * 3, 0, 114 + (i % 2) * 2], s: { arms: i % 2 ? 'raise' : 'down', expr: 'worried' } }; return r; },
    fx: (S, t) => { S.parked.show(true); const d = ambPath(t); S.amb[0].g.visible = true; S.amb[0].drive(d, 0, 110, d - 120, 0, t); },
    over: t => { stamp(t, W('courage') - .1, [{ t: 'COURAGE', c: '#ffd23f' }], 520, '#ffd23f', -.05, 160, 2.0); chipAt(t, W('Indian', 3) - .05, OW / 2, 700, 'INDIAN CAPTAIN', '#ff9933'); } });
  // ---------- 23 defining moment ----------
  const c23 = W('terrifying') - .3;
  sh('cock', c22, c23, { fov: 56, bloom: .6, punch: [W('defining'), .06], cam: t => { const k = ease(seg(t, c22, c23)); return { p: mix([.5, 1.25, 1.65], [.25, 1.1, 1.5], k), l: [-.05, .66, .25] }; }, chars: t => ({ cap: { p: [-.45, -.55, .45], s: { expr: 'worried', bandage: true } } }), fx: (S, t) => { S.arm(V([-.45, 1.0, .5]), V([-.05, .65, .3])); S.press(t, c22 - 100); S.door(1); },
    over: t => { stamp(t, W('defining') - .05, [{ t: 'THE', size: 70, c: '#ffffff' }, { t: 'DEFINING MOMENT', size: 78, c: '#ffd23f' }], 330, '#ffd23f', -.05, 110); } });
  const c23b = W('Wounded', 2) - .27;
  sh('cabin', c23, c23b, { fov: 56, bloom: .3, cam: t => ({ p: mix([.2, 1.6, 9], [.0, 1.6, 6.6], ease(seg(t, c23, c23b))), l: [0, 1.5, -3] }), chars: t => pax(8, 1, 0, { expr: 'worried', arms: 'down' }), fx: (S, t) => { S.door(1); },
    over: t => { chipAt(t, W('terrifying') - .05, OW / 2, 480, 'TERRIFYING ORDEAL', '#ff5a4a'); } });
  // ---------- 24 wounded, fighting for his life ----------
  const c24 = W('yet') - .05;
  sh('cock', c23b, c24, { fov: 46, bloom: .35, cam: t => ({ p: mix([-.45, 1.4, -1.7], [-.5, 1.3, -1.5], ease(seg(t, c23b, c24))), l: [-.58, 1.15, .4] }), chars: t => ({ cap: { p: [-.58, -.65, .4], s: { expr: 'tired', bandage: true } } }),
    over: t => { stamp(t, W('Wounded', 2) - .05, [{ t: 'WOUNDED', c: '#ff5a4a' }], 330, '#ff5a4a', -.05, 130, 1.5); chipAt(t, W('life') - .15, OW / 2, 640, 'FIGHTING FOR HIS LIFE', '#ffffff', undefined, 34); } });
  // ---------- 25 still fighting for everyone ----------
  const c25 = W('Captain', 4) - .33;
  sh('cabin', c24, c25, { fov: 56, bloom: .3, cam: t => ({ p: mix([.1, 1.55, 5.5], [0, 1.5, 3.4], ease(seg(t, c24, c25))), l: [0, 1.35, -1] }), fx: (S, t) => { S.door(1); },
    chars: t => { const r = pax(8, 4, 0, { expr: 'worried', arms: 'down' }); r.cap = { p: [0, 0, 0.6], s: { expr: 'angry', bandage: true, arms: 'point', face: 0 } }; return r; },
    over: t => { chipAt(t, W('still') - .05, OW / 2, 480, 'STILL FIGHTING', '#ffd23f'); chipAt(t, W('everyone', 2) + .0, OW / 2, 760, 'FOR EVERYONE ON BOARD', '#ffffff', undefined, 32); } });
  // ---------- 26 name + Indian flag ----------
  const c26 = W('Follow') - .05;
  sh('flag', c25, c26, { fov: 55, bloom: .4, punch: [W('Captain', 4), .06], cam: t => { const k = ease(seg(t, c25, c26)); return { p: mix([0, 1.8, 6.4], [0, 2.1, 5.2], k), l: [.3, 3.2, -10] }; }, chars: t => ({ cap: { p: [-.3, 0, 0], s: { arms: 'flag', flagKind: 'in', expr: 'smile', bandage: true } } }),
    over: t => { stamp(t, W('Captain', 4) - .02, [{ t: 'CAPTAIN', size: 76, c: '#ffffff' }, { t: 'SMIT MACHCHHAR', size: 76, c: '#ffd23f' }], 330, '#ffd23f', -.04, 100); chipAt(t, W('remember') - .05, OW / 2, 740, 'REMEMBER THE NAME', '#ffffff'); } });
  sh('flag', c26, TL.duration, { fov: 55, bloom: .45, logo: true, cam: t => { const k = ease(seg(t, c26, TL.duration)); return { p: mix([0, 2.1, 5.2], [0, 3.0, 8.5], k), l: [.3, mix([3.2], [5.4], k)[0], -10] }; }, chars: t => ({}) });
  EV.flashes = [W('stabbed'), W('plunging'), W('182'), W('man'), W('September'), hit, W('plunges'), W('chaos'), tPress + .05, W('overpower'), tTD, W('survived'), W('defining'), W('Captain', 4) - .02];
}
// ---------- captions ----------
let GROUPS = [];
const EMPH = new Set(['stabbed', 'plunging', '182', 'lives', 'refuses', 'give', 'september', '2026', '1073', 'telaviv', 'attacked', 'copilot', 'plunges', 'dangerously', 'chaos', 'wounded', 'bleeding', 'fights', 'button', 'release', 'cockpit', 'overpower', 'offduty', 'land', 'tabuk', 'survived', 'courage', 'defining', 'ordeal', 'fighting', 'remember', 'name', 'machchhar', 'smit', 'allegedly', 'surrender', 'life', 'follow']);
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
  const f0 = W('Stories') - .1, press = W('stories', 2) + .25; EV.fpress = press; const bk = ob(seg(t, f0, f0 + .4));
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
  LOGO = new Image(); LOGO.src = 'logo.png'; await LOGO.decode(); await loadMap();
  Object.keys(B).forEach(getSet);
  buildShots(); buildCaptions();
  FLASH = EV.flashes;
  EV.cuts = SHOTS.map(s => +s.a.toFixed(3)).slice(1); EV.pops = [W('stabbed'), W('plunging'), W('182'), W('man'), W('September'), W('Flight'), W('Smit'), W('allegedly'), W('plunges'), W('chaos'), W('Severely'), W('refuses', 2), W('fights'), W('button'), W('release'), W('overpower'), W('Two'), W('survived'), W('courage'), W('defining'), W('Wounded', 2), W('Captain', 4), W('remember')];
  window.EVT = { ...EV, duration: TL.duration, redrawn: W('Redrawn'), follow: W('Follow') };
  return SHOTS.map(s => [s.set, +s.a.toFixed(2), +s.b.toFixed(2)]);
};
window.render = (t) => drawFrame(t); window.SETS = SETS; window.SHOTS = SHOTS;
window.dbg = (setKey, p, l, fov, t = 0, fxs = '', chs = '') => { const shot = { set: setKey, a: -99, b: 99, fov, cam: () => ({ p, l }), fx: fxs ? new Function('S', 't', 'EV', 'THREE', fxs) : null, chars: chs ? new Function('t', 'return (' + chs + ')') : null }; if (shot.fx) { const f = shot.fx; shot.fx = (S, tt) => f(S, tt, EV, THREE); } SHOTS.unshift(shot); drawFrame(t, true); SHOTS.shift(); };
window.hires = (on) => { const w = on ? 1080 : RW, h = on ? 1920 : RH; renderer.setSize(w, h); composer.setSize(w, h); cam.aspect = 9 / 16; cam.updateProjectionMatrix(); };
window.ready = true;
