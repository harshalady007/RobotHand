// "Who rules the Middle East?" sets: table map (overlays, flags, pins, tubes, crown), land stations (Saudi oil / mosque, Israel, Turkey), chess table + clash
import * as THREE from 'three';
import { hash, tex, face, ibox, glowSprite, grain } from './tex.js';
import { Char } from './chars.js';
import { sky, clouds, lights, tank, INSOL } from './kcommon.js';
import { OFFICIAL } from './sets_osama.js';
import { drawFlagM } from './mflags.js';
import { mkJet } from './kbase.js';
import { smokeT } from './sets_osama.js';

export const G = 9.81;
export const lin = x => Math.max(0, Math.min(1, x));
export const seg = (t, a, b) => lin((t - a) / (b - a));
export const eo = x => 1 - Math.pow(1 - lin(x), 3);
export const COL = { sa: '#2eaa56', il: '#3c82f0', ir: '#e24632', tr: '#f5a519', us: '#1f3a8a' };
export const DIP = (i, x = {}) => ({ ...OFFICIAL(i), arms: 'flag', seed: 2000 + i * 1.7, expr: 'neutral', ...x });
export const SOL = (i, x = {}) => INSOL(i, { body: '#7a8450', hatCol: '#5d6a3a', vest: '#55603a', ...x });
const M = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, flatShading: true, roughness: .7, ...o });
const box = (g, w, h, d, x, y, z, c, o) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), M(c, o)); m.position.set(x, y, z); g.add(m); return m; };
const cyl = (g, r0, r1, h, x, y, z, c, seg = 12, o) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(r0, r1, h, seg), M(c, o)); m.position.set(x, y, z); g.add(m); return m; };
const flagTex = k => tex(384, 256, (c, W, H) => { drawFlagM(c, k, W, H); c.lineWidth = 6; c.strokeStyle = '#2a1a12'; c.strokeRect(0, 0, W, H); });
export class FlagM {
  constructor(scene, kind, w = 1.5, h = 1, ph = null) {
    this.geo = new THREE.PlaneGeometry(w, h, 24, 12); this.geo.translate(w / 2, -h / 2, 0); this.base = this.geo.attributes.position.array.slice(); this.w = w;
    const m = flagTex(kind); this.mesh = new THREE.Mesh(this.geo, new THREE.MeshStandardMaterial({ map: m, side: THREE.DoubleSide, roughness: .8, emissive: 0xffffff, emissiveMap: m, emissiveIntensity: .3 }));
    this.g = new THREE.Group(); this.g.add(this.mesh); const H = ph || h * 2.6; this.ph = H - h * .15;
    const p = new THREE.Mesh(new THREE.CylinderGeometry(.03 * w, .035 * w, H, 8), new THREE.MeshStandardMaterial({ color: '#e8e2d2', metalness: .4, roughness: .4 })); p.position.set(0, -H / 2 + h * .15, 0); this.g.add(p); scene.add(this.g);
  }
  wave(t, amp = .1) { const p = this.geo.attributes.position.array, b = this.base; for (let i = 0; i < p.length; i += 3) { const x = b[i], y = b[i + 1], k = x / this.w; p[i + 2] = Math.sin(x * 6.3 / this.w - t * 6 + y * 1.5) * amp * k + Math.sin(x * 13.5 / this.w - t * 9) * amp * .25 * k; } this.geo.attributes.position.needsUpdate = true; this.geo.computeVertexNormals(); }
  at(x, y, z, ry = 0) { this.g.position.set(x, y + this.ph, z); this.g.rotation.y = ry; return this; }
}
const dayBg = (S, far = 1500, fogC = '#f4e8cf') => { S.background = new THREE.Color('#8ec8f0'); S.fog = new THREE.Fog(fogC, far * .25, far); sky(S, '#2f7fd8', '#7fc0f0', '#e4f3ff', '#e9dcc0'); };
// object bouncing under gravity: returns y for drop from h0 (restitution e)
export const bounceY = (tau, h0, e = .38) => { if (tau < 0) return h0; let T = Math.sqrt(2 * h0 / G), v = 0, u = tau; if (u < T) return h0 - .5 * G * u * u; u -= T; v = G * T * e; while (v > .6) { const f = 2 * v / G; if (u < f) return v * u - .5 * G * u * u; u -= f; v *= e; } return 0; };

// ---------------- props ----------------
export function mosque(S, x, z, s = 1, ry = 0, wall = '#f4ead4', dome = '#ffffff') {
  const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry; g.scale.setScalar(s); S.add(g);
  const front = face(wall, (c, W, H) => { c.fillStyle = '#c9b48a'; for (let i = 0; i < 4; i++) { c.beginPath(); c.roundRect(24 + i * 58, 90, 40, 120, [20, 20, 0, 0]); c.fill(); } c.fillStyle = '#3b6a8a'; for (let i = 0; i < 4; i++) { c.beginPath(); c.roundRect(32 + i * 58, 100, 24, 60, [12, 12, 0, 0]); c.fill(); } }, { w: 256, h: 256 });
  const b = ibox(26, 11, 26, { color: wall, front, back: front, side: front }); b.position.y = 5.5; g.add(b);
  const d = new THREE.Mesh(new THREE.SphereGeometry(10, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2), M(dome, { roughness: .35, emissive: '#fff3d0', emissiveIntensity: .25, flatShading: false })); d.position.y = 11; g.add(d);
  cyl(g, .25, .25, 4, 0, 22.5, 0, '#f2b81c'); const cr = new THREE.Mesh(new THREE.TorusGeometry(.9, .22, 6, 14, 4.6), M('#f2b81c', { emissive: '#a87800', emissiveIntensity: .5 })); cr.position.set(0, 25.2, 0); cr.rotation.z = 1.2; g.add(cr);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) { const mx = sx * 15, mz = sz * 15; cyl(g, 1.5, 1.8, 30, mx, 15, mz, wall); cyl(g, 2.4, 2.4, .8, mx, 24, mz, '#d8c8a0'); cyl(g, 1.2, 1.3, 5, mx, 27.4, mz, wall); const cap = new THREE.Mesh(new THREE.ConeGeometry(1.5, 6, 10), M('#3aa0a0', { roughness: .4 })); cap.position.set(mx, 33, mz); g.add(cap); cyl(g, .12, .12, 2.5, mx, 37.2, mz, '#f2b81c'); }
  return g;
}
const palm = (S, x, z, s = 1) => { const tr = cyl(S, .35 * s, .5 * s, 9 * s, x, 4.5 * s, z, '#8a6a44', 6); for (let k = 0; k < 7; k++) { const lf = new THREE.Mesh(new THREE.ConeGeometry(.9 * s, 6 * s, 4), M('#3f9a3a')); lf.scale.set(1, 1, .25); const a = k * Math.PI * 2 / 7; lf.position.set(x + Math.cos(a) * 2.6 * s, 9 * s, z + Math.sin(a) * 2.6 * s); lf.rotation.set(0, -a, Math.PI / 2 - .6); S.add(lf); } };
function pumpjack(S, x, z, ry = 0, ph = 0) {
  const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry; g.scale.setScalar(2.4); S.add(g);
  box(g, 6, .8, 3, 0, .4, 0, '#c8c0a8'); box(g, .5, 5, .5, -.3, 3.2, 1, '#6a7078'); box(g, .5, 5, .5, -.3, 3.2, -1, '#6a7078'); box(g, 1.2, 2, 1.4, 4.2, 1.2, 0, '#4a5a68');
  const beam = new THREE.Group(); beam.position.set(0, 5.6, 0); g.add(beam); box(beam, 8.4, .5, .6, 0, 0, 0, '#e8553a'); box(beam, 1.8, 1.6, .7, 4.6, -.3, 0, '#e8553a'); const hh = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.4, .6, 14, 1, false, 0, Math.PI), M('#e8553a')); hh.rotation.set(Math.PI / 2, 0, Math.PI / 2); hh.position.set(-4.4, -.7, 0); beam.add(hh);
  const rod = box(g, .12, 4.6, .12, -5.2, 2.6, 0, '#d8d8d8'); box(g, .5, 1.5, .5, -5.2, .4, 0, '#2a2e34');
  return { g, beam, rod, ph, step(t) { const a = .26 * Math.sin(t * 2.5 + ph); beam.rotation.z = a; rod.position.y = 2.6 + 4.4 * Math.sin(a) * -.5 - .2; } };
}
function tanker(S, col = '#f1f1ee') {
  const g = new THREE.Group(); S.add(g);
  box(g, 2.4, 2.1, 2.6, 4.4, 2.2, 0, '#2f6fd8'); box(g, 1.3, 1.1, 2.62, 4.9, 2.7, 0, '#9fd0f0'); box(g, 11, .6, 2.4, -.8, 1.1, 0, '#3a3f48');
  const tk = cyl(g, 1.55, 1.55, 9, -1.2, 2.9, 0, col, 20, { roughness: .3, metalness: .3, flatShading: false }); tk.rotation.z = Math.PI / 2; cyl(g, 1.58, 1.58, .5, -1.2, 2.9, 0, '#2eaa56', 20).rotation.z = Math.PI / 2;
  const wm = new THREE.MeshStandardMaterial({ color: '#16181c', roughness: .95 }), hm = new THREE.MeshStandardMaterial({ color: '#b0b4bc' }); const wheels = [];
  for (const x of [4.4, -1.2, -3.4, -5.6]) for (const z of [-1.2, 1.2]) { const ax = new THREE.Group(); ax.position.set(x, .75, z); ax.rotation.x = Math.PI / 2; g.add(ax); const w = new THREE.Mesh(new THREE.CylinderGeometry(.75, .75, .5, 14), [wm, hm, hm]); ax.add(w); const sp = box(w, .18, .55, .18, .55, 0, 0, '#d8d8d8'); wheels.push(w); }
  return { g, r: .75, drive(x, y, z, dist, ry = 0) { g.position.set(x, y, z); g.rotation.y = ry; wheels.forEach(w => w.rotation.y = -dist / .75); } };
}
function skyline(S, x, z, n, spread, seed = 1) {
  const cols = ['#cfe0f0', '#e8dcc8', '#c4d4e4', '#f2e8d6', '#b8cce0'];
  for (let i = 0; i < n; i++) { const w = 14 + hash(i + seed) * 16, h = 24 + hash(i * 2 + seed) * 66, d = 14 + hash(i * 3 + seed) * 14; const fc = cols[i % 5]; const f = face(fc, (c, W, H) => { c.fillStyle = '#4a7aa8'; for (let r = 0; r < 12; r++) for (let k = 0; k < 4; k++) if (hash(r * 7 + k + i) > .25) c.fillRect(14 + k * 58, 14 + r * 20, 40, 12); }, { w: 256, h: 256 }); const b = ibox(w, h, d, { color: fc, front: f, back: f, side: f }); b.position.set(x + (i - n / 2) * spread + (hash(i + 9) - .5) * 6, h / 2, z - hash(i + 4) * 60); S.add(b); }
}
function radarDish(S, x, z) {
  const g = new THREE.Group(); g.position.set(x, 0, z); S.add(g); cyl(g, 1.6, 2.4, 10, 0, 5, 0, '#dfe3e8'); const yaw = new THREE.Group(); yaw.position.y = 11; g.add(yaw);
  const dish = new THREE.Mesh(new THREE.SphereGeometry(7, 22, 10, 0, Math.PI * 2, 0, 1.0), M('#f4f6f8', { side: THREE.DoubleSide, roughness: .4, flatShading: false })); dish.rotation.x = -Math.PI / 2 + .4; yaw.add(dish); cyl(yaw, .2, .2, 8, 0, 3.2, -3.4, '#8a909a').rotation.x = .75;
  const beam = new THREE.Mesh(new THREE.ConeGeometry(14, 90, 24, 1, true), new THREE.MeshBasicMaterial({ color: '#6ad0ff', transparent: true, opacity: .16, side: THREE.DoubleSide, depthWrite: false })); beam.geometry.translate(0, -45, 0); beam.rotation.x = Math.PI / 2 + .1; beam.position.set(0, 4.4, -6.4); yaw.add(beam);
  return { g, yaw, beam };
}
function satellite(S) {
  const g = new THREE.Group(); S.add(g); box(g, 4, 3, 3, 0, 0, 0, '#d8c060', { metalness: .6, roughness: .3 }); for (const s of [-1, 1]) { box(g, 9, .15, 4.4, s * 7, 0, 0, '#2a4a9a', { metalness: .5, roughness: .25 }); cyl(g, .12, .12, 2.5, s * 2.8, 0, 0, '#aaa').rotation.z = Math.PI / 2; }
  const glow = glowSprite('#7ad0ff', 14, .55); g.add(glow); return g;
}

// ================= MAP TABLE =================
export const MAPM = { tex: {} };
export async function loadMapM() {
  const load = async n => { const im = new Image(); im.src = `assets/${n}.png`; await im.decode(); const t = new THREE.Texture(im); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; t.needsUpdate = true; return t; };
  MAPM.meta = await (await fetch('assets/map_me.json')).json();
  for (const n of ['map_me', 'ov_sa', 'ov_il', 'ov_ir', 'ov_tr', 'ov_ott']) MAPM.tex[n] = await load(n);
}
export const CITY = { sa: [46.7, 24.7], il: [35.1, 31.9], ir: [51.4, 35.7], tr: [32.9, 39.9] };
export const PROXY = { lb: [35.8, 33.9], iq: [44.4, 33.3], ye: [44.2, 15.4], gz: [34.4, 31.5] };
export const BASES = { udeid: [51.3, 25.1], bahrain: [50.6, 26.2], dhafra: [54.5, 24.25], arifjan: [48.1, 29.1], jordan: [36.8, 31.8], incirlik: [35.4, 37.0], djibouti: [43.1, 11.5] };
export function buildMap() {
  const S = new THREE.Scene(); S.background = new THREE.Color('#f0dfbd'); S.fog = new THREE.Fog('#f0dfbd', 260, 700);
  lights(S, '#fff2d8', 2.3, '#fff4e0', '#b08a5a', 1.25, [-40, 90, 70]);
  const { meta, tex: T } = MAPM; const s = 2.0; const w = (meta.lon1 - meta.lon0) * meta.cos * s, h = (meta.lat1 - meta.lat0) * s; S.W = w; S.Hh = h;
  const table = new THREE.Mesh(new THREE.PlaneGeometry(1400, 1400), new THREE.MeshStandardMaterial({ color: '#a8703c', roughness: .9 })); table.rotation.x = -Math.PI / 2; table.position.y = -.9; S.add(table);
  const g = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ map: T.map_me, roughness: .95, emissive: '#ffffff', emissiveMap: T.map_me, emissiveIntensity: .32 })); g.rotation.x = -Math.PI / 2; S.add(g);
  const edge = ibox(w + 2.4, .9, h + 2.4, { color: '#fff6e4' }); edge.position.y = -.5; S.add(edge);
  const latm = (meta.lat0 + meta.lat1) / 2, lonm = (meta.lon0 + meta.lon1) / 2;
  const P = (lon, lat, y = 0) => new THREE.Vector3((lon - lonm) * meta.cos * s, y, -(lat - latm) * s); S.P = P;
  S.ovl = {}; for (const k of ['ott', 'sa', 'il', 'ir', 'tr']) { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: T['ov_' + k], transparent: true, opacity: 0, depthWrite: false, toneMapped: false })); m.rotation.x = -Math.PI / 2; m.position.y = .12; m.renderOrder = 2; m.visible = false; S.add(m); S.ovl[k] = m; }
  S.ov = (k, a, o = 1) => { const m = S.ovl[k]; const e = eo(a); m.visible = a > .001 && o > 0; m.material.opacity = e * o; m.position.y = .15 + 5 * (1 - e) + (k === 'ott' ? 0 : .06); };
  // flags planted on capitals (drop under gravity + bounce)
  const FW = 4.2, FH = 2.8; S.fl = {}; for (const k of ['sa', 'il', 'ir', 'tr', 'us']) { S.fl[k] = new FlagM(S, k, FW, FH, 9); S.fl[k].g.visible = false; }
  S.flagPos = { sa: P(...CITY.sa), il: P(...CITY.il), ir: P(...CITY.ir), tr: P(...CITY.tr), us: P(...BASES.udeid) };
  S.flag = (k, t, t0, h0 = 9) => { const f = S.fl[k], p = S.flagPos[k]; f.g.visible = t >= t0; if (!f.g.visible) return; f.at(p.x, bounceY(t - t0, h0, .3), p.z, 0); f.wave(t + p.x, .5); };
  const mkPin = (col, sc = 1.4, lon, lat) => { const gp = new THREE.Group(); gp.position.copy(P(lon, lat)); gp.visible = false; S.add(gp); const cone = new THREE.Mesh(new THREE.ConeGeometry(.5 * sc, 1.5 * sc, 14), M(col, { roughness: .3, emissive: col, emissiveIntensity: .5, flatShading: false })); cone.rotation.x = Math.PI; cone.position.y = .75 * sc; gp.add(cone); const hd = new THREE.Mesh(new THREE.SphereGeometry(.55 * sc, 16, 12), M(col, { roughness: .3, emissive: col, emissiveIntensity: .5, flatShading: false })); hd.position.y = 1.7 * sc; gp.add(hd);
    const ring = new THREE.Mesh(new THREE.RingGeometry(.9, 1.15, 40), new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false })); ring.rotation.x = -Math.PI / 2; ring.position.y = .2; S.add(ring); ring.position.x = gp.position.x; ring.position.z = gp.position.z;
    return { g: gp, set(t, t0, h0 = 7) { const tau = t - t0; gp.visible = tau >= 0; ring.visible = gp.visible; if (!gp.visible) return; gp.position.y = bounceY(tau, h0, .3); const tf = Math.sqrt(2 * h0 / G); const r = (tau * 1.1) % 1; ring.material.opacity = tau > tf ? (1 - r) * .85 : 0; ring.scale.setScalar(2 + r * 5 * sc); }, hide() { gp.visible = false; ring.visible = false; } };
  };
  S.px = {}; for (const [k, v] of Object.entries(PROXY)) S.px[k] = mkPin('#e8302a', 1.2, ...v);
  S.bs = {}; for (const [k, v] of Object.entries(BASES)) S.bs[k] = mkPin('#2a58d8', 1.1, ...v);
  // tubes with travelling pulses
  const tube = (A, B, col, lift, rad = .2) => {
    const m = A.clone().lerp(B, .5); m.y += lift; const curve = new THREE.QuadraticBezierCurve3(A, m, B); const geo = new THREE.TubeGeometry(curve, 64, rad, 6, false); const mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: col, emissive: col, emissiveIntensity: .7, roughness: .3 })); mesh.visible = false; S.add(mesh);
    const pul = []; for (let i = 0; i < 3; i++) { const p = new THREE.Mesh(new THREE.SphereGeometry(rad * 2.1, 10, 8), new THREE.MeshBasicMaterial({ color: '#ffffff' })); p.visible = false; S.add(p); pul.push(p); }
    return { mesh, curve, set(k, t = 0) { mesh.visible = k > .001; geo.setDrawRange(0, Math.floor(geo.index.count * lin(k) / 6) * 6); pul.forEach((p, i) => { p.visible = k > .98; if (p.visible) p.position.copy(curve.getPoint(((t * .55 + i / 3) % 1))); }); } };
  };
  S.tubes = { px: Object.values(PROXY).map(v => tube(P(...CITY.ir, 1), P(...v, 1), '#ff4a3a', 7, .26)), us: ['sa', 'il', 'tr'].map(k => tube(P(...BASES.udeid, 1), P(...CITY[k], 1), '#4a8aff', 6, .22)) };
  // crown
  const crown = new THREE.Group(); S.add(crown); const gold = M('#ffc928', { metalness: .5, roughness: .25, emissive: '#a87000', emissiveIntensity: .5 }); const rg = new THREE.Mesh(new THREE.CylinderGeometry(4, 3.4, 2.6, 5, 1, true), gold); rg.material.side = THREE.DoubleSide; crown.add(rg);
  for (let i = 0; i < 5; i++) { const a = i * Math.PI * 2 / 5; const c = new THREE.Mesh(new THREE.ConeGeometry(.8, 3.2, 4), gold); c.position.set(Math.cos(a) * 3.9, 2.8, Math.sin(a) * 3.9); crown.add(c); const jb = new THREE.Mesh(new THREE.SphereGeometry(.6, 10, 8), M(['#e8302a', '#2a8ae8', '#2eaa56'][i % 3], { emissive: '#222', emissiveIntensity: .4 })); jb.position.set(Math.cos(a) * 3.9, 4.6, Math.sin(a) * 3.9); crown.add(jb); }
  const cb = new THREE.Mesh(new THREE.TorusGeometry(3.7, .3, 6, 20), gold); cb.rotation.x = Math.PI / 2; cb.position.y = -1.2; crown.add(cb); crown.visible = false; S.crown = crown;
  const cglow = glowSprite('#ffe08a', 26, .0); crown.add(cglow); S.cglow = cglow;
  // crown: hover+spin until tDrop, then free fall + bounces + settles tilted
  S.crownAt = (t, tDrop, c) => { crown.visible = true; const hov = 10; if (t < tDrop) { crown.position.set(c.x, hov + .6 * Math.sin(t * 2.4), c.z); crown.rotation.set(.18, t * 1.6, .1); cglow.material.opacity = .5; } else { const tau = t - tDrop; crown.position.set(c.x + 1.2 * Math.min(1, tau), Math.max(1.4, bounceY(tau, hov, .32) + 1.4), c.z); const k = Math.min(1, tau / 1.2); crown.rotation.set(.18 + (.55 - .18) * k + 2.2 * (1 - k) * Math.sin(tau * 3), t * 1.6 * (1 - k) + 1.2 * k, .1 + .35 * k); cglow.material.opacity = .5 * (1 - k); } };
  S.reset = () => { Object.values(S.ovl).forEach(m => { m.visible = false; m.material.opacity = 0; }); Object.values(S.fl).forEach(f => f.g.visible = false); Object.values(S.px).forEach(p => p.hide()); Object.values(S.bs).forEach(p => p.hide()); Object.values(S.tubes).flat().forEach(t => t.set(0)); crown.visible = false; };
  S.update = () => { };
  S.chars = {};
  return S;
}

// ================= LAND stations (x offsets 2000 apart so fog hides the others) =================
export const LX = { sa: 0, mq: 2000, il: 4000, tr: 6000 };
export function buildLand() {
  const S = new THREE.Scene(); dayBg(S, 1500, '#f6e9cc'); lights(S, '#fff0d0', 2.6, '#cfe6ff', '#cdb98a', 1.3, [-120, 200, 180]);
  const gt = tex(256, 256, (c, W) => { c.fillStyle = '#ecd7a2'; c.fillRect(0, 0, W, W); grain(c, W, W, .14, 3000); }, [200, 200]);
  const gr = new THREE.Mesh(new THREE.PlaneGeometry(20000, 20000), new THREE.MeshStandardMaterial({ map: gt, roughness: 1 })); gr.rotation.x = -Math.PI / 2; gr.position.y = -.05; S.add(gr);
  const road = (x, z, len, w = 12) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(len, w), new THREE.MeshStandardMaterial({ map: tex(512, 64, (c, W, Hh) => { c.fillStyle = '#4b5059'; c.fillRect(0, 0, W, Hh); grain(c, W, Hh, .1, 1500); c.fillStyle = '#f2c230'; for (let i = 0; i < 8; i++) c.fillRect(i * 64 + 8, Hh / 2 - 2, 36, 4); }), roughness: .95, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 })); m.rotation.x = -Math.PI / 2; m.position.set(x, .04, z); S.add(m); };
  const dunes = (x0, n, c0 = '#e2c88a') => { for (let i = 0; i < n; i++) { const m = new THREE.Mesh(new THREE.SphereGeometry(1, 10, 6), M(['#e6cf96', '#dcc080', '#ead7a4'][i % 3])); const a = (i / n) * Math.PI * 1.2 + Math.PI * .1; const r = 260 + hash(i) * 260; m.scale.set(120 + hash(i + 2) * 160, 14 + hash(i + 3) * 26, 70 + hash(i + 4) * 80); m.position.set(x0 + Math.cos(a) * r * 1.5, -2, -Math.sin(a) * r - 120); S.add(m); } };
  clouds(S, 18, [-1200, 1200, -1400, -300], 260, 520, 1.1, 5);
  // ---- Saudi oil station ----
  const X = LX.sa; dunes(X, 16); road(X, -16, 900, 14);
  S.jacks = [0, 1, 2, 3, 4].map(i => pumpjack(S, X - 30 + i * 17, -32 - (i % 2) * 9, 0, i * 1.3)); S.jacks.forEach(j => j.g.rotation.y = Math.PI);
  [[-60, -70], [-40, -84], [-80, -90]].forEach(([dx, dz], i) => { cyl(S, 9, 9, 8, X + dx - 10, 4, dz, '#e8e4da', 20); cyl(S, 9.05, 9.05, 1.3, X + dx - 10, 5.4, dz, '#2eaa56', 20); });
  cyl(S, .6, .8, 34, X + 50, 17, -66, '#8a909a'); S.flare = glowSprite('#ffb040', 12, .9); S.flare.position.set(X + 50, 37, -66); S.add(S.flare); S.flare2 = glowSprite('#ff6a20', 7, .9); S.flare2.position.set(X + 50, 36, -66); S.add(S.flare2);
  S.tk = [0, 1, 2].map(i => tanker(S, ['#f1f1ee', '#e8f0f8', '#f4efe2'][i]));
  // coins (gravity shower) + pile
  S.coinN = 90; S.coins = new THREE.InstancedMesh(new THREE.CylinderGeometry(1, 1, .24, 18), M('#ffc928', { metalness: .6, roughness: .25, emissive: '#a87000', emissiveIntensity: .55 }), S.coinN); S.coins.frustumCulled = false; S.add(S.coins);
  const emb = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 1, 18), M('#c8f0c0')); // banknote stacks
  S.cash = []; for (let i = 0; i < 4; i++) { const b = ibox(3.4, 1.4, 1.6, { color: '#7cc070', front: face('#7cc070', (c, W, H) => { c.fillStyle = '#e8f5e0'; c.fillRect(W * .1, H * .1, W * .8, H * .8); c.fillStyle = '#3a8a4a'; c.font = `bold ${H * .6}px sans-serif`; c.textAlign = 'center'; c.fillText('$', W / 2, H * .75); }, { w: 128, h: 64 }) }); b.visible = false; S.add(b); S.cash.push(b); }
  const M4 = new THREE.Matrix4(), Q = new THREE.Quaternion(), E = new THREE.Euler(), SC = new THREE.Vector3(), PP = new THREE.Vector3();
  S.coinsAt = (t, t0, cx, cz, hCam = 26) => { for (let i = 0; i < S.coinN; i++) { const d = hash(i * 1.3) * 1.5, tau = t - t0 - d; const x = cx + (hash(i * 2.1) - .5) * 12, z = cz + (hash(i * 3.7) - .5) * 5; const r = tau < 0 ? 0 : 1; const hs = hCam + hash(i * 5.3) * 14; const ang = Math.min(tau, 1.6) * (4 + hash(i) * 6); const pile = 1.3 * Math.exp(-(((x - cx) / 4) ** 2 + ((z - cz) / 2.4) ** 2)); const y = tau < 0 ? -50 : Math.max(.2 + pile * (hash(i + 8) * .8), bounceY(tau, hs, .25)); E.set(ang, 0, tau < .0 ? 0 : ang * .3); Q.setFromEuler(E); SC.set(1.2, 1.2, 1.2); PP.set(x, y, z); M4.compose(PP, Q, SC); S.coins.setMatrixAt(i, M4); } S.coins.instanceMatrix.needsUpdate = true; S.cash.forEach((b, i) => { const tau = t - t0 - .3 - i * .25; b.visible = tau > 0; b.position.set(cx - 9 + i * 6, bounceY(tau, 14, .2) + .8, cz + 4); b.rotation.y = .3 * i; }); };
  // ---- Mosque station ----
  const MX = LX.mq; dunes(MX, 10); const plaza = new THREE.Mesh(new THREE.PlaneGeometry(260, 260), new THREE.MeshStandardMaterial({ map: tex(256, 256, (c, W) => { c.fillStyle = '#f2ead8'; c.fillRect(0, 0, W, W); c.strokeStyle = '#d8ccb0'; c.lineWidth = 3; for (let i = 0; i <= 8; i++) { c.beginPath(); c.moveTo(i * 32, 0); c.lineTo(i * 32, W); c.moveTo(0, i * 32); c.lineTo(W, i * 32); c.stroke(); } }, [4, 4]), roughness: .9 })); plaza.rotation.x = -Math.PI / 2; plaza.position.set(MX, .03, -40); S.add(plaza);
  mosque(S, MX, -50, 1.5); mosque(S, MX - 90, -85, .9, .3); mosque(S, MX + 90, -85, .9, -.3, '#efe2c4');
  for (let i = 0; i < 14; i++) { const px = MX - 120 + i * 18; if (Math.abs(px - MX) > 34) palm(S, px, -6 + (i % 2) * 6, 1.1 + hash(i) * .4); }
  S.mq = { glow: glowSprite('#ffe9a8', 140, .4) }; S.mq.glow.position.set(MX, 40, -130); S.add(S.mq.glow);
  // ---- Israel station: skyline, radar, satellite, jets, tanks ----
  const IX = LX.il; dunes(IX, 10, '#e6d29c'); road(IX, -22, 900, 14); skyline(S, IX, -120, 14, 22, 3); skyline(S, IX + 60, -190, 10, 26, 8);
  S.radar = radarDish(S, IX + 26, -50); S.radar.g.scale.setScalar(2); S.sat = satellite(S); S.sat2 = satellite(S);
  S.jets = [0, 1, 2].map(i => mkJet(S, { col: '#c4ccd6', tip: '#2a58c8' })); S.tanksIL = [0, 1, 2, 3].map(i => tank(S, '#86905a'));
  // ---- Turkey station: road column of tanks + marching soldiers, skyline of domes ----
  const TX = LX.tr; dunes(TX, 8, '#d9c98e'); road(TX, -16, 900, 16);
  for (let i = 0; i < 6; i++) mosque(S, TX - 150 + i * 60, -150 - hash(i) * 40, .8 + hash(i + 3) * .5, 0, ['#f4ead4', '#efe2c4', '#f8f0e0'][i % 3]);
  const sea = new THREE.Mesh(new THREE.PlaneGeometry(900, 90), new THREE.MeshStandardMaterial({ color: '#3aa0e8', roughness: .3, emissive: '#0b5aa0', emissiveIntensity: .3 })); sea.rotation.x = -Math.PI / 2; sea.position.set(TX, .02, -105); S.add(sea);
  S.tanksTR = [0, 1, 2, 3, 4].map(i => tank(S, '#7a8a52')); S.flTR = new FlagM(S, 'tr', 6, 4, 16).at(TX + 12, 0, -24); S.flIL = new FlagM(S, 'il', 5, 3.3, 14).at(IX - 30, 0, -34); S.flSA = new FlagM(S, 'sa', 5, 3.3, 14).at(X - 30, 0, -26);
  S.chars = {};
  for (let i = 0; i < 4; i++) S.chars['d' + i] = new Char(S, DIP(i), 3.6);
  for (let i = 0; i < 24; i++) S.chars['s' + i] = new Char(S, SOL(i, { walk: true, arms: 'rifle' }), 3.0);
  S.reset = () => { S.tk.forEach(k => k.g.visible = false); S.coins.visible = false; S.cash.forEach(b => b.visible = false); S.jets.forEach(j => j.show(false)); S.tanksIL.forEach(k => k.g.visible = false); S.tanksTR.forEach(k => k.g.visible = false); S.coins.visible = true; };
  S.update = (t) => { S.jacks.forEach(j => j.step(t)); S.flare.material.opacity = .75 + .25 * Math.sin(t * 17); S.flare2.material.opacity = .7 + .3 * Math.sin(t * 23 + 1); S.flTR.wave(t, .5); S.flIL.wave(t + 1, .5); S.flSA.wave(t + 2, .5); S.radar.yaw.rotation.y = t * 1.2 + 1; S.radar.beam.material.opacity = .12 + .05 * Math.sin(t * 6); const a = t * .12; S.sat.position.set(IX - 40 + 50 * Math.cos(a), 95 + 8 * Math.sin(a), -90 - 20 * Math.sin(a)); S.sat.rotation.y = a; S.sat2.position.set(IX + 80, 130, -140); S.sat2.rotation.y = -a; };
  return S;
}

// ================= TABLE: chess board, clash icons =================
const lathe = (pts, col, seg = 14) => new THREE.Mesh(new THREE.LatheGeometry(pts.map(p => new THREE.Vector2(...p)), seg), M(col, { flatShading: false, roughness: .35, metalness: .15 }));
const PAWN = [[0, 0], [1.4, 0], [1.5, .3], [.8, .6], [.7, 1.6], [1.1, 1.9], [.5, 2.3], [.9, 2.7], [.9, 3.2], [.5, 3.6], [0, 3.7]].map(([a, b]) => [a * 1.15, b * 1.15]);
const KING = [[0, 0], [1.8, 0], [1.9, .4], [1.0, .9], [.8, 3.2], [1.4, 3.6], [1.0, 4.0], [1.3, 4.5], [1.0, 5.2], [0, 5.3]].map(([a, b]) => [a * 1.15, b * 1.15]);
const ROOK = [[0, 0], [1.6, 0], [1.7, .4], [1.0, .9], [1.0, 3.0], [1.5, 3.2], [1.5, 4.0], [1.1, 4.0], [1.1, 3.6], [0, 3.6]].map(([a, b]) => [a * 1.15, b * 1.15]);
export function buildTable() {
  const S = new THREE.Scene(); S.background = new THREE.Color('#e8d4ac'); S.fog = new THREE.Fog('#e8d4ac', 160, 520);
  lights(S, '#fff0d8', 2.4, '#fff4e0', '#b08a5a', 1.2, [-30, 90, 60]);
  const tbl = new THREE.Mesh(new THREE.PlaneGeometry(900, 900), new THREE.MeshStandardMaterial({ map: tex(256, 256, (c, W) => { c.fillStyle = '#9a6234'; c.fillRect(0, 0, W, W); for (let i = 0; i < 26; i++) { c.fillStyle = `rgba(${hash(i) > .5 ? '60,30,10' : '210,150,90'},.18)`; c.fillRect(0, i * 10, W, 3 + hash(i) * 4); } }, [8, 8]), roughness: .8 })); tbl.rotation.x = -Math.PI / 2; tbl.position.y = -.01; S.add(tbl);
  const SQ = 6.4, BW = SQ * 8; S.SQ = SQ; const bt = tex(512, 512, (c, W) => { for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) { c.fillStyle = (i + j) % 2 ? '#c98a4a' : '#f6e8c4'; c.fillRect(i * 64, j * 64, 64, 64); } });
  const bd = new THREE.Mesh(new THREE.BoxGeometry(BW + 5, 2, BW + 5), M('#5a3418')); bd.position.y = -.0; bd.position.y = .1; S.add(bd); const top = new THREE.Mesh(new THREE.PlaneGeometry(BW, BW), new THREE.MeshStandardMaterial({ map: bt, roughness: .6 })); top.rotation.x = -Math.PI / 2; top.position.y = 1.12; S.add(top); S.BY = 1.12;
  S.sq = (i, j) => [(i - 3.5) * SQ, (j - 3.5) * SQ];
  const cols = [COL.sa, COL.il, COL.ir, COL.tr, COL.us, '#8a8a92']; S.pieces = [];
  const place = (geo, c, i, j, sc = 1) => { const m = lathe(geo, c); const [x, z] = S.sq(i, j); m.position.set(x, S.BY, z); m.scale.setScalar(sc); S.add(m); S.pieces.push({ m, x0: x, z0: z, r: 1.6 * sc }); return m; };
  S.king = place(KING, '#cfcfd8', 3.5, 3.5, 1.6); S.king.position.set(0, S.BY, 0); S.pieces[0].x0 = 0; S.pieces[0].z0 = 0;
  const layout = [[0, 1, 5], [1, 5, 2], [2, 6, 6], [3, 2, 1], [4, 5, 5], [0, 6, 4], [1, 1, 2], [2, 2, 6], [3, 6, 1], [4, 1, 5], [0, 3, 6], [1, 6, 3], [2, 3, 1], [3, 5, 6], [4, 4, 2], [0, 4, 1], [1, 2, 4], [2, 5, 3]];
  layout.forEach(([c, i, j], n) => place(n % 3 === 0 ? ROOK : PAWN, cols[c], i, j, 1.15));
  S.pc = S.pieces.slice(1);
  // slide: piece from its home towards (tx,tz) under friction mu (a = mu*g), stops by itself
  S.slide = (p, t, t0, tx, tz, mu = .3) => { const dx = tx - p.x0, dz = tz - p.z0, L = Math.hypot(dx, dz) || 1; const a = mu * G * 8; const v0 = Math.sqrt(2 * a * L); const tau = Math.max(0, t - t0); const ts = v0 / a; const s = tau < ts ? v0 * tau - .5 * a * tau * tau : L; p.m.position.set(p.x0 + dx / L * s, S.BY, p.z0 + dz / L * s); };
  // clash icons
  const ico = {}; const coin = new THREE.Group(); for (let i = 0; i < 6; i++) { const c = new THREE.Mesh(new THREE.CylinderGeometry(2.6, 2.6, .7, 20), M('#ffc928', { metalness: .6, roughness: .25, emissive: '#a87000', emissiveIntensity: .5 })); c.position.set(i % 2 * .25, .4 + i * .72, 0); coin.add(c); } ico.money = coin;
  const rk = new THREE.Group(); const body = cyl(rk, 1.3, 1.3, 7, 0, 3.5, 0, '#e8e8ee'); const cone = new THREE.Mesh(new THREE.ConeGeometry(1.3, 3, 14), M('#e8302a')); cone.position.y = 8.5; rk.add(cone); for (let i = 0; i < 3; i++) { const f = box(rk, .2, 2.6, 2.2, 0, 1.2, 0, '#e8302a'); f.rotation.y = i * 2.094; f.position.set(Math.sin(i * 2.094) * 1.6, 1.2, Math.cos(i * 2.094) * 1.6); } rk.rotation.z = .35; ico.weapons = rk;
  const fa = new THREE.Group(); const dm = new THREE.Mesh(new THREE.SphereGeometry(3.6, 18, 10, 0, Math.PI * 2, 0, Math.PI / 2), M('#ffffff', { flatShading: false })); dm.position.y = 3; fa.add(dm); cyl(fa, 3.7, 3.7, 3, 0, 1.5, 0, '#f4ead4'); cyl(fa, .5, .5, 1, 0, 7.5, 0, '#f2b81c'); const cr2 = new THREE.Mesh(new THREE.TorusGeometry(.9, .22, 6, 14, 4.6), M('#f2b81c')); cr2.position.y = 8.9; cr2.rotation.z = 1.2; fa.add(cr2); cyl(fa, .7, .8, 9, 4.8, 4.5, 0, '#f4ead4'); const cap = new THREE.Mesh(new THREE.ConeGeometry(.9, 2.4, 8), M('#3aa0a0')); cap.position.set(4.8, 10.2, 0); fa.add(cap); ico.faith = fa;
  const al = new THREE.Group(); const f1 = new FlagM(al, 'sa', 3.6, 2.4, 8), f2 = new FlagM(al, 'il', 3.6, 2.4, 8), f3 = new FlagM(al, 'tr', 3.6, 2.4, 8); f1.at(-3, 0, 0); f2.at(0, 0, 0); f3.at(3, 0, 0); f1.g.rotation.z = .12; f3.g.rotation.z = -.12; ico.allies = al; S.alF = [f1, f2, f3];
  S.ico = ico; Object.values(ico).forEach(g => { g.visible = false; S.add(g); });
  S.sparks = []; for (let i = 0; i < 34; i++) { const s = glowSprite(['#ffd23f', '#ff7a3a', '#ffffff'][i % 3], 2.6, 0); S.add(s); S.sparks.push(s); }
  S.shock = new THREE.Mesh(new THREE.RingGeometry(.8, 1.1, 48), new THREE.MeshBasicMaterial({ color: '#ffe9a0', transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false })); S.shock.rotation.x = -Math.PI / 2; S.add(S.shock);
  S.flash = glowSprite('#fff2c0', 60, 0); S.add(S.flash);
  const CORN = [[-17, -17], [17, -17], [-17, 17], [17, 17]], ORDER = ['money', 'weapons', 'faith', 'allies'];
  // icons pop in at tPop[i] (drop under gravity), then at tHit are pulled to the centre (constant accel), collide, rebound with e=.4, spin, settle
  S.clash = (t, tPop, tHit) => { const T = .7; ORDER.forEach((k, i) => { const g = ico[k], [cx, cz] = CORN[i]; g.visible = t >= tPop[i]; if (!g.visible) return; const tp = t - tPop[i]; let x = cx, z = cz, y = S.BY + bounceY(tp, 12, .3), ry = tp * 1.5; if (t >= tHit - T) { const u = t - (tHit - T); if (u < T) { const k2 = (u / T) ** 2; x = cx * (1 - k2 * .86); z = cz * (1 - k2 * .86); y = S.BY + Math.max(0, bounceY(tp, 12, .3)); } else { const w = u - T; const d = Math.hypot(cx, cz); const vx = -cx / d * 9, vz = -cz / d * 9; const rv = .4 * 2 * (cx * cx + cz * cz) ** .5 / T; x = cx * .14 - (cx / d) * 0 + (cx / d) * (rv * .5) * Math.min(w, .9) * 1.0; z = cz * .14 + (cz / d) * (rv * .5) * Math.min(w, .9) * 1.0; y = S.BY + bounceY(w, 0.01, .4) + Math.max(0, 7 * w - 4.9 * 2 * w * w) * (w < 1.4 ? 1 : 0); ry += w * 9; } } g.position.set(x, y, z); g.rotation.y = ry; }); S.alF.forEach((f, i) => f.wave(t + i, .3));
    const w = t - tHit; S.sparks.forEach((s, i) => { if (w < 0 || w > 1.3) { s.material.opacity = 0; return; } const a = hash(i * 3.3) * 6.28, v = 14 + hash(i * 7.1) * 22, vy = 14 + hash(i * 5.9) * 18; s.position.set(Math.cos(a) * v * w * .6, S.BY + 2 + vy * w - .5 * G * 3 * w * w, Math.sin(a) * v * w * .6); s.material.opacity = Math.max(0, 1 - w / 1.3); }); S.shock.visible = w > 0 && w < 1.2; S.shock.position.y = S.BY + .3; S.shock.scale.setScalar(1 + w * 26); S.shock.material.opacity = Math.max(0, .9 - w * .8); S.flash.position.set(0, S.BY + 6, 0); S.flash.material.opacity = w > 0 && w < .5 ? (1 - w / .5) * .9 : 0; };
  S.chars = {}; for (let i = 0; i < 5; i++) S.chars['p' + i] = new Char(S, DIP(i, { flagKind: ['sa', 'il', 'ir', 'tr', 'us'][i] }), 17);
  S.reset = () => { Object.values(ico).forEach(g => g.visible = false); S.sparks.forEach(s => s.material.opacity = 0); S.shock.visible = false; S.flash.material.opacity = 0; S.pieces.forEach(p => p.m.position.set(p.x0, S.BY, p.z0)); };
  S.update = () => { };
  return S;
}
