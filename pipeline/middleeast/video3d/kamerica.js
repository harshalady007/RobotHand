import * as THREE from 'three';
import { OUT, hash, tex, face, mat, ibox, plane, glowSprite, grain } from './tex.js';
import { Char } from './chars.js';
import { puff, heli } from './sets_osama.js';
import { sm, lerp, fbm, ridged, terrain, clouds, lights, sky, jet, house } from './kcommon.js';

export const GR = 100; // globe radius
export const ll = (lon, lat, r = GR) => { const a = lon * Math.PI / 180, b = lat * Math.PI / 180; return new THREE.Vector3(r * Math.cos(a) * Math.cos(b), r * Math.sin(b), -r * Math.sin(a) * Math.cos(b)); };

// ---------- flags (own texture set; kit's FlagK only knows IN/PK/CN) ----------
export function flagTexA(kind) {
  return tex(384, 256, (c, W, H) => {
    if (kind === 'us') {
      for (let i = 0; i < 13; i++) { c.fillStyle = i % 2 ? '#ffffff' : '#c8102e'; c.fillRect(0, i * H / 13, W, H / 13 + 1); }
      c.fillStyle = '#1f3a8a'; c.fillRect(0, 0, W * .42, H * 7 / 13); c.fillStyle = '#fff';
      for (let r = 0; r < 5; r++) for (let k = 0; k < 6; k++) { c.beginPath(); c.arc(W * .42 / 6 * (k + .5) + (r % 2 ? 0 : 0), H * 7 / 13 / 5 * (r + .5), 5, 0, 7); c.fill(); }
    }
    if (kind === 'jp') { c.fillStyle = '#fff'; c.fillRect(0, 0, W, H); c.fillStyle = '#bc002d'; c.beginPath(); c.arc(W / 2, H / 2, H * .3, 0, 7); c.fill(); }
    if (kind === 'kr') { c.fillStyle = '#fff'; c.fillRect(0, 0, W, H); c.fillStyle = '#cd2e3a'; c.beginPath(); c.arc(W / 2, H / 2, H * .25, Math.PI, 0); c.fill(); c.fillStyle = '#0047a0'; c.beginPath(); c.arc(W / 2, H / 2, H * .25, 0, Math.PI); c.fill(); c.fillStyle = '#111'; for (const [x, y] of [[.2, .22], [.8, .22], [.2, .78], [.8, .78]]) { c.save(); c.translate(W * x, H * y); c.rotate(Math.atan2(x < .5 ? (.5 - y) : (y - .5), 1) * (x < .5 ? 1 : -1) + (y < .5 ? .5 : -.5)); c.fillRect(-22, -12, 44, 7); c.fillRect(-22, 0, 44, 7); c.fillRect(-22, 12, 44, 7); c.restore(); } }
    if (kind === 'nato') { c.fillStyle = '#0a3a8a'; c.fillRect(0, 0, W, H); c.strokeStyle = '#fff'; c.lineWidth = 5; c.beginPath(); c.arc(W / 2, H / 2, H * .3, 0, 7); c.stroke(); c.fillStyle = '#fff'; c.beginPath(); for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4 - Math.PI / 2, r = i % 2 ? H * .07 : H * .34; c.lineTo(W / 2 + Math.cos(a) * r, H / 2 + Math.sin(a) * r); } c.closePath(); c.fill(); }
    c.lineWidth = 6; c.strokeStyle = OUT; c.strokeRect(0, 0, W, H);
  });
}
export class FlagA {
  constructor(scene, kind, w = 1.5, h = 1, pole = true, ph = null) {
    this.geo = new THREE.PlaneGeometry(w, h, 24, 12); this.geo.translate(w / 2, -h / 2, 0); this.base = this.geo.attributes.position.array.slice(); this.w = w;
    const m = flagTexA(kind); this.mesh = new THREE.Mesh(this.geo, new THREE.MeshStandardMaterial({ map: m, side: THREE.DoubleSide, roughness: .8, emissive: 0xffffff, emissiveMap: m, emissiveIntensity: .25 }));
    this.g = new THREE.Group(); this.g.add(this.mesh); this.ph = 0;
    if (pole) { const H = ph || h * 2.6; this.ph = H - h * .15; const p = new THREE.Mesh(new THREE.CylinderGeometry(.03 * w, .035 * w, H, 8), new THREE.MeshStandardMaterial({ color: '#d9d4c8', metalness: .4, roughness: .4 })); p.position.set(0, -H / 2 + h * .15, 0); this.g.add(p); }
    scene.add(this.g);
  }
  wave(t, amp = .1) { const p = this.geo.attributes.position.array, b = this.base; for (let i = 0; i < p.length; i += 3) { const x = b[i], y = b[i + 1], k = x / this.w; p[i + 2] = Math.sin(x * 4.2 / this.w * 1.5 - t * 6 + y * 1.5) * amp * k + Math.sin(x * 9 / this.w * 1.5 - t * 9) * amp * .25 * k; } this.geo.attributes.position.needsUpdate = true; this.geo.computeVertexNormals(); }
  at(x, y, z, ry = 0) { this.g.position.set(x, y + this.ph, z); this.g.rotation.y = ry; return this; }
}

// ---------- US characters ----------
export const GI = (i = 0, x = {}) => ({ body: ['#7a8358', '#6e7a52', '#85875f'][i % 3], hair: 'bald', hat: 'nvg', hatCol: '#8d8a62', vest: '#4a5038', arms: 'rifle', seed: 1200 + i * 1.7, zip: true, ...x });
export const PILOT = (i = 0, x = {}) => ({ body: '#c9692a', hair: 'bald', hat: 'nvg', hatCol: '#e6e6e6', vest: '#8f3d12', arms: 'down', seed: 1300 + i * 1.9, zip: true, ...x });
export const SAILOR = (i = 0, x = {}) => ({ body: '#f2f4f8', hair: 'bald', hat: 'milcap', hatCol: '#ffffff', collar: true, tie: '#1f3a8a', arms: 'down', seed: 1400 + i * 1.3, ...x });
export const CREW = (i = 0, x = {}) => ({ body: ['#e8d23a', '#3b8be0', '#d83a3a', '#37a84a'][i % 4], hair: 'bald', hat: 'nvg', hatCol: ['#e8d23a', '#3b8be0', '#d83a3a', '#37a84a'][i % 4], vest: '#f4f4f4', arms: 'down', seed: 1500 + i * 1.1, ...x });

// ---------- shared: wheel texture, shadow blob ----------
const hubT = () => tex(64, 64, (c) => { c.fillStyle = '#151515'; c.fillRect(0, 0, 64, 64); c.fillStyle = '#a0a0a0'; c.beginPath(); c.arc(32, 32, 16, 0, 7); c.fill(); c.strokeStyle = '#151515'; c.lineWidth = 5; for (let k = 0; k < 5; k++) { const a = k * Math.PI * 2 / 5; c.beginPath(); c.moveTo(32, 32); c.lineTo(32 + Math.cos(a) * 16, 32 + Math.sin(a) * 16); c.stroke(); } });
let HUB; const wheelMats = () => { HUB = HUB || hubT(); return [new THREE.MeshStandardMaterial({ color: '#16181c', roughness: .95 }), new THREE.MeshStandardMaterial({ map: HUB }), new THREE.MeshStandardMaterial({ map: HUB })]; };
const star = (c, x, y, r, col = '#fff') => { c.fillStyle = col; c.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * .4 : r; c.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } c.closePath(); c.fill(); };

// ---------- 6-wheel military truck (nose +X). wheel turn = distance / radius ----------
export function truck(S, col = '#6b7448') {
  const g = new THREE.Group(); S.add(g);
  const ch = ibox(8.2, .9, 2.5, { color: '#2a2e28' }); ch.position.set(0, 1.05, 0); g.add(ch);
  const doorT = face(col, (c, W, H) => { star(c, W * .5, H * .5, 40, '#f1f1ee'); c.fillStyle = '#26313c'; c.fillRect(W * .12, H * .1, W * .34, H * .32); }, { w: 128, h: 128 });
  const cab = ibox(2.6, 2.2, 2.6, { color: col, side: doorT, front: face(col, (c, W, H) => { c.fillStyle = '#26313c'; c.fillRect(W * .1, H * .12, W * .8, H * .36); }, { w: 128, h: 128 }) }); cab.position.set(2.9, 2.3, 0); g.add(cab);
  const hood = ibox(1.8, 1.0, 2.4, { color: col }); hood.position.set(4.6, 1.75, 0); g.add(hood);
  const bed = ibox(4.8, 2.3, 2.6, { color: '#6e7a48' }); bed.position.set(-1.6, 2.45, 0); g.add(bed);
  const tarp = new THREE.Mesh(new THREE.CylinderGeometry(1.3, 1.3, 4.8, 12, 1, false, 0, Math.PI), new THREE.MeshStandardMaterial({ color: '#7f8b55', flatShading: true })); tarp.rotation.z = Math.PI / 2; tarp.rotation.y = 0; tarp.rotation.order = 'ZYX'; tarp.position.set(-1.6, 3.6, 0); tarp.rotation.set(0, 0, Math.PI / 2); g.add(tarp);
  const wheels = []; const wm = wheelMats();
  for (const x of [3.5, -.9, -3.1]) for (const z of [-1.3, 1.3]) { const ax = new THREE.Group(); ax.position.set(x, .62, z); ax.rotation.x = Math.PI / 2; g.add(ax); const w = new THREE.Mesh(new THREE.CylinderGeometry(.62, .62, .5, 16), wm); ax.add(w); wheels.push(w); }
  return { g, r: .62, drive(x, y, z, dist, heading = 0) { g.position.set(x, y, z); g.rotation.y = heading; wheels.forEach(w => w.rotation.y = -dist / .62); } };
}

// ---------- Humvee-ish jeep (nose +X) ----------
export function jeep(S, col = '#7b8558') {
  const g = new THREE.Group(); S.add(g);
  const body = ibox(4.2, 1.2, 2.2, { color: col }); body.position.y = 1.15; g.add(body);
  const win = face(col, (c, W, H) => { c.fillStyle = '#26313c'; c.fillRect(W * .08, H * .15, W * .38, H * .6); c.fillRect(W * .54, H * .15, W * .38, H * .6); star(c, W * .5, H * .85, 14, '#eee'); }, { w: 256, h: 96 });
  const top = ibox(2.6, 1.0, 2.0, { color: col, side: win, front: win, back: win }); top.position.set(-.3, 2.15, 0); g.add(top);
  const gun = new THREE.Mesh(new THREE.CylinderGeometry(.08, .08, 1.4, 8), new THREE.MeshStandardMaterial({ color: '#222' })); gun.rotation.z = Math.PI / 2; gun.position.set(.6, 2.95, 0); g.add(gun);
  const wheels = []; const wm = wheelMats();
  for (const [x, z] of [[1.4, 1.1], [-1.4, 1.1], [1.4, -1.1], [-1.4, -1.1]]) { const ax = new THREE.Group(); ax.position.set(x, .5, z); ax.rotation.x = Math.PI / 2; g.add(ax); const w = new THREE.Mesh(new THREE.CylinderGeometry(.5, .5, .4, 16), wm); ax.add(w); wheels.push(w); }
  return { g, r: .5, drive(x, y, z, dist, heading = 0) { g.position.set(x, y, z); g.rotation.y = heading; wheels.forEach(w => w.rotation.y = -dist / .5); } };
}

// ---------- aircraft attitude from path (nose -Z): pitch from climb angle, bank from lateral acceleration ----------
export function flyAttitude(g, t, path) {
  const d = .08; const p = path(t), pa = path(t + d), pb = path(t - d);
  const vx = (pa[0] - pb[0]) / (2 * d), vy = (pa[1] - pb[1]) / (2 * d), vz = (pa[2] - pb[2]) / (2 * d); const hs = Math.hypot(vx, vz);
  const q = path(t + .3), r = path(t - .1);
  const y1 = Math.atan2(-(q[0] - p[0]), -(q[2] - p[2])), y0 = Math.atan2(-(p[0] - r[0]), -(p[2] - r[2]));
  let dy = y1 - y0; while (dy > Math.PI) dy -= 2 * Math.PI; while (dy < -Math.PI) dy += 2 * Math.PI; const yawRate = dy / .4;
  const yaw = hs > .5 ? Math.atan2(-vx, -vz) : (g.userData.yaw ?? 0); g.userData.yaw = yaw;
  const bank = hs > 5 ? Math.max(-.9, Math.min(.9, Math.atan(hs * yawRate / 9.81))) : 0;
  g.position.set(...p); g.rotation.order = 'YXZ'; g.rotation.set(hs > .5 ? Math.atan2(vy, hs) : 0, yaw, bank); return { sp: Math.hypot(vx, vy, vz), vy };
}

// ---------- transport aircraft (nose -Z), ground contact y=0 ----------
export function cargoPlane(S) {
  const g = new THREE.Group(); g.rotation.order = 'YXZ'; S.add(g);
  const M = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, flatShading: true, roughness: .5, metalness: .2, ...o });
  const grey = '#9aa4ae';
  const fus = new THREE.Mesh(new THREE.CylinderGeometry(3.3, 3.3, 34, 14), M(grey)); fus.rotation.x = Math.PI / 2; fus.position.set(0, 4.8, 2); g.add(fus);
  const nose = new THREE.Mesh(new THREE.ConeGeometry(3.3, 9, 14), M(grey)); nose.rotation.x = -Math.PI / 2; nose.position.set(0, 4.8, -23.5); g.add(nose);
  const tail = new THREE.Mesh(new THREE.ConeGeometry(3.3, 14, 14), M(grey)); tail.rotation.x = Math.PI / 2; tail.position.set(0, 6.2, 26); tail.scale.set(1, 1, .65); tail.rotation.set(Math.PI / 2 + .12, 0, 0); g.add(tail);
  const can = new THREE.Mesh(new THREE.SphereGeometry(1.5, 12, 8), new THREE.MeshStandardMaterial({ color: '#1a2838', roughness: .1, metalness: .8 })); can.scale.set(1.1, .7, 1.4); can.position.set(0, 7.3, -22); g.add(can);
  const tri = (pts, mt) => { const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pts.flat(), 3)); geo.computeVertexNormals(); return new THREE.Mesh(geo, mt); };
  const WM = M(grey, { side: THREE.DoubleSide });
  for (const s of [-1, 1]) {
    g.add(tri([[s * 2.8, 7.2, -3], [s * 2.8, 7.2, 7], [s * 26, 8.4, 6], [s * 26, 8.4, 2.5]].slice(0, 3), WM)); g.add(tri([[s * 2.8, 7.2, -3], [s * 26, 8.4, 6], [s * 26, 8.4, 2.5]], WM));
    g.add(tri([[s * 2, 12, 25], [s * 10, 12.4, 29], [s * 2, 12.2, 31]], WM));
    for (const x of [9, 17]) { const e = new THREE.Mesh(new THREE.CylinderGeometry(1.15, 1.0, 5, 12), M('#6c737b')); e.rotation.x = Math.PI / 2; e.position.set(s * x, 5.4 + (x > 12 ? .3 : 0), 1 + (x > 12 ? 2.5 : 0)); g.add(e); }
  }
  const fin = tri([[0, 9, 24], [0, 20, 30], [0, 9, 31]], WM); g.add(fin); const fin2 = tri([[0, 9, 24], [0, 20, 30], [0, 20, 31.5], [0, 9, 31]].slice(0, 3), WM); g.add(fin2);
  const stab = tri([[-9, 19.4, 30], [9, 19.4, 30], [0, 19.4, 25.5]], WM); g.add(stab);
  const wm = wheelMats(); const wheels = [];
  for (const s of [-1, 1]) for (const z of [-1, 2.2, 5.4]) { const p = ibox(.9, .9, 1.2, { color: '#55606a' }); p.position.set(s * 3.4, 1.9, z); g.add(p); const ax = new THREE.Group(); ax.position.set(s * 3.5, 1.0, z); ax.rotation.x = Math.PI / 2; g.add(ax); const w = new THREE.Mesh(new THREE.CylinderGeometry(1.0, 1.0, .8, 14), wm); ax.add(w); wheels.push(w); }
  const nw = new THREE.Group(); nw.position.set(0, 1.0, -16); nw.rotation.x = Math.PI / 2; g.add(nw); const nwm = new THREE.Mesh(new THREE.CylinderGeometry(.9, .9, .6, 14), wm); nw.add(nwm); wheels.push(nwm);
  const gearUp = []; // everything wheel-ish hides when airborne
  const ramp = ibox(5.4, .25, 7.8, { color: '#6e7a48' }); ramp.position.set(0, .95, 30.3); ramp.rotation.x = .256; g.add(ramp);
  const flagT = flagTexA('us'); const fl = new THREE.Mesh(new THREE.PlaneGeometry(4, 2.6), new THREE.MeshBasicMaterial({ map: flagT, side: THREE.DoubleSide })); fl.position.set(.25, 16, 28); fl.rotation.y = Math.PI / 2; g.add(fl);
  const glow = glowSprite('#ffb060', 6, 0); glow.position.set(0, 5, 32); g.add(glow);
  return { g, wheels, fly(t, path, dist = null) { const r = flyAttitude(g, t, path); const air = g.position.y > 2.2; wheels.forEach(w => { if (dist !== null) w.rotation.y = -dist / 1.0; w.parent.visible = !air; }); return r; } };
}

// ---------- dust / tyre smoke puff cluster (cheap) ----------
export function smokeTrail(S, n = 24, col = '#e8e8e8') {
  const g = new THREE.Group(); S.add(g); const sp = [];
  for (let i = 0; i < n; i++) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex(64, 64, (c) => { const gr = c.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,255,255,.8)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = gr; c.fillRect(0, 0, 64, 64); }), transparent: true, depthWrite: false, color: col, opacity: 0 })); g.add(s); sp.push(s); }
  // pos(t)->[x,y,z]; emits behind along time
  return { g, update(t, pos, life = 1.6, size = 1.2, op = .5, t0 = -1e9) { sp.forEach((s, i) => { const te = t - i * (life / n); if (te < t0) { s.material.opacity = 0; return; } const p = pos(te); const k = (t - te) / life; s.position.set(p[0], p[1] + k * 1.2, p[2]); s.scale.setScalar(size * (1 + k * 4)); s.material.opacity = op * (1 - k); }); } };
}

export { jet, heli, puff, house, sm, lerp, fbm, ridged, terrain, clouds, lights, sky, hash, tex, face, mat, ibox, plane, glowSprite, grain, Char, OUT, star };
