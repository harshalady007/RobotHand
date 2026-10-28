import * as THREE from 'three';
import { OUT, hash, tex, face, mat, ibox, plane, glowSprite, floorGlow, sline, grain } from './tex.js';
import { Char } from './chars.js';
import { skyDome, smokeT } from './sets_osama.js';

export const sm = (x) => { x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x); };
export const lerp = (a, b, k) => a + (b - a) * k;
const h2 = (x, y) => { const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return s - Math.floor(s); };
export function vnoise(x, y) { const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi; const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf); return h2(xi, yi) * (1 - u) * (1 - v) + h2(xi + 1, yi) * u * (1 - v) + h2(xi, yi + 1) * (1 - u) * v + h2(xi + 1, yi + 1) * u * v; }
export function fbm(x, y, o = 5) { let a = .5, f = 1, s = 0; for (let i = 0; i < o; i++) { s += a * vnoise(x * f, y * f); f *= 2; a *= .5; } return s; }
export function ridged(x, y, o = 5) { let a = .5, f = 1, s = 0; for (let i = 0; i < o; i++) { const n = 1 - Math.abs(2 * vnoise(x * f, y * f) - 1); s += a * n * n; f *= 2; a *= .5; } return s; }

// terrain mesh: h(x,z) height, col(x,y,z,slope)->THREE.Color hex string
export function terrain(S, { W, D, nx, nz, cx = 0, cz = 0, h, col }) {
  const geo = new THREE.PlaneGeometry(W, D, nx, nz); geo.rotateX(-Math.PI / 2);
  const p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) p.setY(i, h(p.getX(i) + cx, p.getZ(i) + cz));
  geo.computeVertexNormals(); const n = geo.attributes.normal; const cols = new Float32Array(p.count * 3); const c = new THREE.Color();
  for (let i = 0; i < p.count; i++) { c.set(col(p.getX(i) + cx, p.getY(i), p.getZ(i) + cz, n.getY(i))); cols[i * 3] = c.r; cols[i * 3 + 1] = c.g; cols[i * 3 + 2] = c.b; }
  geo.setAttribute('color', new THREE.BufferAttribute(cols, 3));
  const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 1 })); m.position.set(cx, 0, cz); S.add(m); return m;
}
export function clouds(S, n, area, y0, y1, scale = 1, seed = 1) {
  const t = tex(256, 128, (c, W, H) => { for (let i = 0; i < 9; i++) { const x = 40 + hash(i * 1.7 + seed) * 176, y = 70 + hash(i * 3.3 + seed) * 20 - Math.abs(x - 128) * .12, r = 24 + hash(i * 5.1) * 22; const g = c.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, 'rgba(255,255,255,.95)'); g.addColorStop(.7, 'rgba(255,255,255,.75)'); g.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = g; c.fillRect(0, 0, W, H); } });
  const list = [];
  for (let i = 0; i < n; i++) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, transparent: true, depthWrite: false, fog: false, opacity: .9, color: '#ffffff' })); const k = (60 + hash(i * 2.3 + seed) * 110) * scale; s.scale.set(k * 2, k, 1); s.position.set(area[0] + hash(i * 3.1 + seed) * (area[1] - area[0]), y0 + hash(i * 7.7 + seed) * (y1 - y0), area[2] + hash(i * 9.3 + seed) * (area[3] - area[2])); S.add(s); list.push(s); }
  return list;
}
export function lights(S, sun = '#fff0d0', sunI = 2.4, hemiSky = '#bfe0ff', hemiG = '#7a9a5a', hemiI = 1.15, dir = [-60, 90, 70]) {
  S.add(new THREE.HemisphereLight(hemiSky, hemiG, hemiI)); const d = new THREE.DirectionalLight(sun, sunI); d.position.set(...dir); S.add(d); return d;
}
// ---------- flags ----------
export function flagTexK(kind) {
  return tex(384, 256, (c, W, H) => {
    if (kind === 'in') { ['#ff9933', '#ffffff', '#138808'].forEach((col, i) => { c.fillStyle = col; c.fillRect(0, i * H / 3, W, H / 3 + 1); }); c.strokeStyle = '#000080'; c.lineWidth = 5; c.beginPath(); c.arc(W / 2, H / 2, 38, 0, 7); c.stroke(); c.lineWidth = 2.5; for (let k = 0; k < 24; k++) { const a = k * Math.PI / 12; c.beginPath(); c.moveTo(W / 2, H / 2); c.lineTo(W / 2 + Math.cos(a) * 38, H / 2 + Math.sin(a) * 38); c.stroke(); } }
    if (kind === 'pk') { c.fillStyle = '#01411c'; c.fillRect(0, 0, W, H); c.fillStyle = '#fff'; c.fillRect(0, 0, W / 4, H); c.beginPath(); c.arc(W * .62, H * .5, 76, 0, 7); c.fill(); c.fillStyle = '#01411c'; c.beginPath(); c.arc(W * .68, H * .44, 66, 0, 7); c.fill(); c.fillStyle = '#fff'; c.font = '64px sans-serif'; c.fillText('★', W * .66, H * .56); }
    if (kind === 'cn') { c.fillStyle = '#de2910'; c.fillRect(0, 0, W, H); c.fillStyle = '#ffde00'; c.font = '110px sans-serif'; c.fillText('★', 24, 120); c.font = '38px sans-serif'; for (const [x, y] of [[130, 36], [160, 70], [160, 110], [130, 146]]) c.fillText('★', x, y); }
    c.lineWidth = 6; c.strokeStyle = OUT; c.strokeRect(0, 0, W, H);
  });
}
export class FlagK {
  constructor(scene, kind, w = 1.5, h = 1, pole = true) {
    this.geo = new THREE.PlaneGeometry(w, h, 24, 12); this.geo.translate(w / 2, -h / 2, 0); this.base = this.geo.attributes.position.array.slice(); this.w = w;
    const m = flagTexK(kind); this.mesh = new THREE.Mesh(this.geo, new THREE.MeshStandardMaterial({ map: m, side: THREE.DoubleSide, roughness: .8, emissive: 0xffffff, emissiveMap: m, emissiveIntensity: .22 }));
    this.g = new THREE.Group(); this.g.add(this.mesh);
    this.ph = pole ? h * 2.6 - h * .15 : 0; this.hasPole = pole; if (pole) { const ph = h * 2.6; const p = new THREE.Mesh(new THREE.CylinderGeometry(.03 * w, .035 * w, ph, 8), new THREE.MeshStandardMaterial({ color: '#d9d4c8', metalness: .4, roughness: .4 })); p.position.set(0, h / 2 * 0 - ph / 2 + h * .15, 0); this.g.add(p); }
    scene.add(this.g);
  }
  wave(t, amp = .1) { const p = this.geo.attributes.position.array, b = this.base; for (let i = 0; i < p.length; i += 3) { const x = b[i], y = b[i + 1], k = x / this.w; p[i + 2] = Math.sin(x * 4.2 / this.w * 1.5 - t * 6 + y * 1.5) * amp * k + Math.sin(x * 9 / this.w * 1.5 - t * 9) * amp * .25 * k; } this.geo.attributes.position.needsUpdate = true; this.geo.computeVertexNormals(); }
  at(x, y, z) { this.g.position.set(x, y + this.ph, z); return this; }
}
// ---------- characters ----------
const olive = '#5f7a3a';
export const INSOL = (i = 0, x = {}) => ({ body: olive, hair: 'bald', hat: 'nvg', hatCol: '#5c7040', vest: '#46562e', arms: 'rifle', seed: 800 + i * 1.7, zip: true, ...x });
export const PKSOL = (i = 0, x = {}) => ({ body: '#7b8561', hair: 'bald', hat: 'nvg', hatCol: '#6e7a52', vest: '#566040', arms: 'rifle', seed: 850 + i * 1.7, zip: true, stache: true, hairCol: '#2a1c10', ...x });
export const SIACH = (i = 0, x = {}) => ({ body: ['#e8503a', '#2f78c8', '#f0a020', '#e8503a'][i % 4], hair: 'bald', hat: 'ushanka', hatCol: '#4a3a30', hatLite: '#6a5648', vest: '#f4f6fa', seed: 900 + i * 1.7, ...x });
export const FARMER = (i = 0, x = {}) => ({ body: ['#d8cfb8', '#b9d0a0', '#e0c27a'][i % 3], hair: 'helmet', hairCol: '#2a1c10', hat: 'turban', hatCol: ['#e8e2d2', '#c0603a', '#3a6aa0'][i % 3], stache: true, seed: 950 + i * 1.3, ...x });
export const KASH = (i = 0, x = {}) => ({ body: ['#c98a4a', '#8a6a4a', '#b05a3a', '#7a8a5a'][i % 4], hair: i % 2 ? 'bob' : 'helmet', hairCol: '#2a1c10', hat: i % 3 === 0 ? 'turban' : undefined, hatCol: '#e8e2d2', stache: i % 4 === 0, seed: 700 + i * 1.3, expr: 'smile', ...x });

// ---------- jet (nose -Z) ----------
export function jet(S, o = {}) {
  const g = new THREE.Group(); g.rotation.order = 'YXZ'; S.add(g);
  const col = o.col || '#aeb8c4';
  const M = new THREE.MeshStandardMaterial({ color: col, flatShading: true, roughness: .45, metalness: .25 });
  const fus = new THREE.Mesh(new THREE.CylinderGeometry(.85, 1.05, 9, 12), M); fus.rotation.x = Math.PI / 2; g.add(fus);
  const nose = new THREE.Mesh(new THREE.ConeGeometry(.85, 4.2, 12), M); nose.rotation.x = -Math.PI / 2; nose.position.z = -6.6; g.add(nose);
  const noz = new THREE.Mesh(new THREE.CylinderGeometry(.9, .7, 1.6, 12), new THREE.MeshStandardMaterial({ color: '#3a3e44', metalness: .6, roughness: .4 })); noz.rotation.x = Math.PI / 2; noz.position.z = 5.2; g.add(noz);
  const can = new THREE.Mesh(new THREE.SphereGeometry(.8, 12, 8), new THREE.MeshStandardMaterial({ color: '#1a2838', roughness: .1, metalness: .8, emissive: '#10243a', emissiveIntensity: .4 })); can.scale.set(.85, .7, 2.2); can.position.set(0, .85, -2.6); g.add(can);
  const tri = (pts, mt) => { const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pts.flat(), 3)); geo.computeVertexNormals(); const m = new THREE.Mesh(geo, mt); return m; };
  const WM = new THREE.MeshStandardMaterial({ color: col, flatShading: true, roughness: .45, metalness: .25, side: THREE.DoubleSide });
  for (const s of [-1, 1]) {
    g.add(tri([[s * .8, 0, 3.6], [s * .8, 0, -3.2], [s * 7, -.1, 3.9]], WM));
    g.add(tri([[s * .8, 0, 5], [s * .8, 0, 2.6], [s * 3.2, 0, 5.2]], WM));
    g.add(tri([[s * 3.0, -.05, 3.7], [s * 7, -.1, 3.9], [s * 5.6, -.1, 3.2]], new THREE.MeshStandardMaterial({ color: o.tip || '#e8e8e8', side: THREE.DoubleSide, flatShading: true })));
  }
  const fin = tri([[0, .7, 4.8], [0, 4.2, 5.4], [0, .7, 1.6]], WM); g.add(fin);
  const band = [['#ff9933', 0], ['#ffffff', 1], ['#138808', 2]];
  if (o.tail) { o.tail.forEach((cl, i) => { const b = tri([[.02, 1.2 + i * .8, 4.9 - i * .15], [.02, 1.9 + i * .8, 5.05 - i * .15], [.02, 1.2 + i * .8, 3.2 - i * .1]], new THREE.MeshBasicMaterial({ color: cl, side: THREE.DoubleSide })); g.add(b); }); }
  const glow = glowSprite('#ff9a40', 5, .0); glow.position.z = 6.4; g.add(glow);
  let prevYaw = 0;
  return { g, glow,
    fly(t, path, ab = .8) {
      const d = .08; const p = path(t), pa = path(t + d), pb = path(t - d);
      const vx = (pa[0] - pb[0]) / (2 * d), vy = (pa[1] - pb[1]) / (2 * d), vz = (pa[2] - pb[2]) / (2 * d); const hs = Math.hypot(vx, vz);
      const yaw = Math.atan2(-vx, -vz);
      const q = path(t + .3), r = path(t - .1); const y1 = Math.atan2(-(q[0] - p[0]), -(q[2] - p[2])), y0 = Math.atan2(-(p[0] - r[0]), -(p[2] - r[2]));
      let dy = y1 - y0; while (dy > Math.PI) dy -= 2 * Math.PI; while (dy < -Math.PI) dy += 2 * Math.PI; const yawRate = dy / .4;
      const bank = Math.max(-1.0, Math.min(1.0, Math.atan(hs * yawRate / 9.81)));
      g.position.set(...p); g.rotation.set(Math.atan2(vy, hs), yaw, bank); glow.material.opacity = ab; return { sp: Math.hypot(vx, vy, vz) };
    } };
}
// ---------- tank (nose +X) ----------
export function tank(S, col = '#6b7a4a') {
  const g = new THREE.Group(); S.add(g);
  const hull = ibox(6.4, 1.3, 3.0, { color: col }); hull.position.y = 1.15; g.add(hull);
  const slope = ibox(1.6, .9, 2.8, { color: col }); slope.position.set(3.3, 1.0, 0); slope.rotation.z = -.5; g.add(slope);
  const tur = ibox(3.0, .95, 2.4, { color: col }); tur.position.set(-.4, 2.25, 0); g.add(tur);
  const barrel = new THREE.Mesh(new THREE.CylinderGeometry(.16, .2, 4.6, 10), new THREE.MeshStandardMaterial({ color: '#3d4630', roughness: .6 })); barrel.rotation.z = Math.PI / 2; const bg = new THREE.Group(); bg.position.set(1.0, 2.3, 0); barrel.position.x = 2.3; bg.add(barrel); g.add(bg);
  const hat = ibox(.8, .35, .8, { color: '#3d4630' }); hat.position.set(-.8, 2.9, .3); g.add(hat);
  const tkM = new THREE.MeshStandardMaterial({ color: '#1f2226', roughness: .9 });
  const wheels = [];
  for (const z of [-1.75, 1.75]) {
    const tr = new THREE.Mesh(new THREE.BoxGeometry(7.0, 1.2, .8), tkM); tr.position.set(0, .75, z); g.add(tr);
    for (let i = 0; i < 6; i++) { const ax = new THREE.Group(); ax.position.set(-2.7 + i * 1.08, .62, z * 1.06); ax.rotation.x = Math.PI / 2; g.add(ax); const w = new THREE.Mesh(new THREE.CylinderGeometry(.52, .52, .3, 14), [new THREE.MeshStandardMaterial({ color: '#5a5f66' }), new THREE.MeshStandardMaterial({ color: '#7a8088' }), new THREE.MeshStandardMaterial({ color: '#7a8088' })]); ax.add(w); const sp = new THREE.Mesh(new THREE.BoxGeometry(.15, .12, .32), new THREE.MeshStandardMaterial({ color: '#222' })); sp.position.set(.34, 0, 0); w.add(sp); wheels.push(w); }
  }
  const flash = glowSprite('#ffd27a', 3, 0); flash.position.set(4.6, 2.3, 0); bg.add(flash);
  return { g, drive(x, y, z, dist, fireK = 0, rot = 0) { g.position.set(x, y, z); g.rotation.y = rot; wheels.forEach(w => w.rotation.y = -dist / .52); bg.position.x = 1.0 - .5 * fireK; flash.material.opacity = fireK > .6 ? 1 : 0; } };
}
// ---------- dove (side-view plane) ----------
export function dove(S) {
  const mk = (wing) => tex(256, 160, (c) => { c.clearRect(0, 0, 256, 160); c.fillStyle = '#ffffff'; c.strokeStyle = OUT; c.lineWidth = 6; c.beginPath(); c.ellipse(118, 92, 62, 28, -.08, 0, 7); c.fill(); c.stroke(); c.beginPath(); c.arc(188, 70, 22, 0, 7); c.fill(); c.stroke(); c.fillStyle = '#f5a623'; c.beginPath(); c.moveTo(208, 66); c.lineTo(236, 74); c.lineTo(208, 80); c.closePath(); c.fill(); c.stroke(); c.fillStyle = '#222'; c.beginPath(); c.arc(194, 66, 4, 0, 7); c.fill(); c.fillStyle = '#fff'; c.beginPath(); c.moveTo(64, 96); c.lineTo(14, 112); c.lineTo(60, 120); c.fill(); c.stroke(); c.beginPath(); if (wing) { c.moveTo(80, 84); c.quadraticCurveTo(100, 10, 150, 14); c.quadraticCurveTo(140, 56, 140, 84); } else { c.moveTo(80, 92); c.quadraticCurveTo(100, 150, 150, 152); c.quadraticCurveTo(140, 120, 140, 96); } c.fill(); c.stroke(); });
  const ta = mk(true), tb = mk(false);
  const m = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 1.5), new THREE.MeshBasicMaterial({ map: ta, transparent: true, side: THREE.DoubleSide, alphaTest: .3 }));
  const g = new THREE.Group(); g.add(m); S.add(g);
  return { g, set(t, p, yaw) { g.position.set(...p); g.rotation.y = yaw; m.material.map = Math.floor(t * 7) % 2 ? ta : tb; m.material.needsUpdate = true; } };
}
// ---------- spark / sparks ----------
export function sparks(S, n = 24) {
  const g = new THREE.Group(); S.add(g); const sp = [];
  for (let i = 0; i < n; i++) { const s = glowSprite('#ffc860', .35, 0); g.add(s); sp.push(s); }
  return { g, update(t, p, on) { g.position.set(...p); sp.forEach((s, i) => { const ph = (t * 3 + i / n) % 1; const a = hash(i * 3.3) * 6.28, v = 1.5 + hash(i * 7.1) * 2.5; s.position.set(Math.cos(a) * v * ph, 1.5 * ph * (1.2 + hash(i)) - 5 * ph * ph, Math.sin(a) * v * ph); s.material.opacity = on * (1 - ph); s.scale.setScalar(.35 * (1 - ph * .6)); }); } };
}
export function sky(S, top = '#3f8fe0', mid = '#8ec8f0', hor = '#e8f4ff', below = '#cfe0ee') {
  const t = tex(8, 512, (c, W, H) => { const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, top); g.addColorStop(.30, mid); g.addColorStop(.49, hor); g.addColorStop(.51, hor); g.addColorStop(1, below); c.fillStyle = g; c.fillRect(0, 0, W, H); });
  const m = new THREE.Mesh(new THREE.SphereGeometry(9000, 24, 16), new THREE.MeshBasicMaterial({ map: t, side: THREE.BackSide, fog: false, depthWrite: false })); m.renderOrder = -10; S.add(m); S.sky = m; return m;
}
export function house(S, x, y, z, w, d, h, ry = 0, wall = '#b98a5a', roof = '#9a4a3a') {
  const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = ry; S.add(g);
  const win = face(wall, (c, W, H) => { c.fillStyle = '#3b2a1c'; for (let i = 0; i < 3; i++) { c.fillRect(30 + i * 70, 40, 34, 50); c.fillRect(30 + i * 70, 140, 34, 50); } c.fillStyle = '#ffe9a0'; c.fillRect(34, 44, 26, 18); c.strokeStyle = 'rgba(60,40,20,.35)'; c.lineWidth = 3; for (let k = 0; k < 6; k++) { c.beginPath(); c.moveTo(0, k * 42); c.lineTo(W, k * 42); c.stroke(); } }, { w: 256, h: 256 });
  const b = ibox(w, h, d, { color: wall, front: win, back: win }); b.position.y = h / 2; g.add(b);
  const r = new THREE.Mesh(new THREE.ConeGeometry(Math.max(w, d) * .78, h * .62, 4), new THREE.MeshStandardMaterial({ color: roof, flatShading: true, roughness: .8 })); r.rotation.y = Math.PI / 4; r.scale.set(w / Math.max(w, d), 1, d / Math.max(w, d)); r.position.y = h + h * .31; g.add(r);
  return g;
}
// physically-based heli attitude from a path: nose-down with forward accel, bank = atan(v*yawRate/g), heading from velocity
export function heliFly(h, t, path, hold = 0) {
  const d = .1, p = path(t), pa = path(t + d), pb = path(t - d);
  const vx = (pa[0] - pb[0]) / (2 * d), vz = (pa[2] - pb[2]) / (2 * d), vy = (pa[1] - pb[1]) / (2 * d); const sp = Math.hypot(vx, vz);
  const p2 = path(t + 2 * d), p0 = path(t - 2 * d); const ax = (p2[0] - 2 * p[0] + p0[0]) / (4 * d * d), az = (p2[2] - 2 * p[2] + p0[2]) / (4 * d * d);
  let yaw = h.yaw ?? hold; if (sp > 1.2) yaw = Math.atan2(-vx, -vz); h.yaw = yaw;
  const fwd = sp > 1.2 ? (ax * vx + az * vz) / sp : 0; const lat = sp > 1.2 ? (-ax * vz + az * vx) / sp : 0;
  const pitch = Math.max(-.35, Math.min(.35, Math.atan2(fwd, 9.81) * .8 + sp * .004));
  const bank = Math.max(-.5, Math.min(.5, Math.atan2(sp * ((sp > 1.2 ? (vx * az - vz * ax) / (sp * sp) : 0)) * -1, 9.81)));
  h.g.position.set(p[0], p[1], p[2]); h.g.rotation.set(-pitch, yaw, bank); h.spin(t); return { sp, pitch, bank };
}
export function tractor(S, col = '#2e8b3a') {
  const g = new THREE.Group(); S.add(g);
  const b = ibox(3.2, 1.2, 1.7, { color: col }); b.position.set(.4, 1.5, 0); g.add(b); const hood = ibox(1.6, 1.0, 1.3, { color: col }); hood.position.set(1.9, 1.35, 0); g.add(hood);
  const cab = ibox(1.5, 1.5, 1.5, { color: '#d9d4c8' }); cab.position.set(-.5, 2.7, 0); g.add(cab); const ex = new THREE.Mesh(new THREE.CylinderGeometry(.08, .08, 1.2, 6), new THREE.MeshStandardMaterial({ color: '#222' })); ex.position.set(2.2, 2.4, .4); g.add(ex);
  const tM = new THREE.MeshStandardMaterial({ color: '#16181c', roughness: .95 }), hM = new THREE.MeshStandardMaterial({ color: '#e6c84a' }); const wheels = [];
  for (const [x, r, wd] of [[-.9, 1.05, .6], [2.0, .6, .4]]) for (const z of [-1.1, 1.1]) { const ax = new THREE.Group(); ax.position.set(x, r, z); ax.rotation.x = Math.PI / 2; g.add(ax); const w = new THREE.Mesh(new THREE.CylinderGeometry(r, r, wd, 16), [tM, hM, hM]); ax.add(w); for (let k = 0; k < 8; k++) { const l = new THREE.Mesh(new THREE.BoxGeometry(.12, wd * 1.05, r * .28), tM); l.position.set(Math.cos(k * .785) * r, 0, Math.sin(k * .785) * r); l.rotation.y = -k * .785; w.add(l); } wheels.push([w, r]); }
  return { g, drive(x, y, z, dist, rot = 0) { g.position.set(x, y, z); g.rotation.y = rot; wheels.forEach(([w, r]) => w.rotation.y = -dist / r); } };
}
