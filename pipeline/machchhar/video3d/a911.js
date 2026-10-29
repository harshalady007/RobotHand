// 9/11 reel: airliner model with real attitude physics, impact/smoke FX, facade materials, cars/boats
import * as THREE from 'three';
import { hash, tex, face, mat, ibox, plane, glowSprite, grain } from './tex.js';
import { smokeT } from './sets_osama.js';

export const G = 9.81;
export const sm = (x) => { x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x); };
export const lin = x => Math.max(0, Math.min(1, x));
export const seg = (t, a, b) => lin((t - a) / (b - a));
export const lerp = (a, b, k) => a + (b - a) * k;

// ---------- airliner (nose -Z, ~48 m, twin engines). ground contact y=0 with gear down ----------
let HUB;
const hubTex = () => HUB || (HUB = tex(64, 64, (c) => { c.fillStyle = '#16181c'; c.fillRect(0, 0, 64, 64); c.fillStyle = '#b0b0b0'; c.beginPath(); c.arc(32, 32, 16, 0, 7); c.fill(); c.strokeStyle = '#16181c'; c.lineWidth = 5; for (let k = 0; k < 5; k++) { const a = k * Math.PI * 2 / 5; c.beginPath(); c.moveTo(32, 32); c.lineTo(32 + Math.cos(a) * 16, 32 + Math.sin(a) * 16); c.stroke(); } }));
export function airliner(S, o = {}) {
  const g = new THREE.Group(); g.rotation.order = 'YXZ'; S.add(g);
  const stripe = o.stripe || '#1f4fa8', belly = o.belly || '#c9d0d8';
  const bodyT = tex(256, 512, (c, W, H) => {
    // u around the barrel, v along the length (tail->nose). window rows at both flanks
    c.fillStyle = '#f6f7f9'; c.fillRect(0, 0, W, H);
    c.fillStyle = belly; c.fillRect(W * .40, 0, W * .20, H); c.fillRect(0, 0, W * .05, H); c.fillRect(W * .95, 0, W * .05, H);
    for (const u of [.2, .7]) { c.fillStyle = stripe; c.fillRect(W * (u - .03), 0, W * .06, H); }
    c.fillStyle = '#243447'; for (const u of [.12, .78]) for (let i = 0; i < 38; i++) { const y = H * (.12 + i * .0215); c.fillRect(W * u - 3, y, 7, 11); }
    grain(c, W, H, .05, 1500);
  });
  const M = new THREE.MeshStandardMaterial({ map: bodyT, roughness: .45, metalness: .15 });
  const prof = [[0, -24.4], [.7, -24.0], [1.5, -23.0], [2.2, -21.2], [2.6, -18.5], [2.78, -14], [2.8, 0], [2.78, 12], [2.5, 17], [1.9, 20.5], [1.2, 23], [.55, 25], [0, 25.6]].map(([r, z]) => new THREE.Vector2(r, z));
  const fus = new THREE.Mesh(new THREE.LatheGeometry(prof, 28), M); fus.rotation.x = Math.PI / 2; fus.position.y = 4.9; g.add(fus);
  const WM = new THREE.MeshStandardMaterial({ color: '#dfe3e8', roughness: .5, metalness: .2, flatShading: true });
  const slab = (pts, th, mt, y0) => { const sh = new THREE.Shape(pts.map(([x, z]) => new THREE.Vector2(x, -z))); const geo = new THREE.ExtrudeGeometry(sh, { depth: th, bevelEnabled: false }); geo.rotateX(-Math.PI / 2); const m = new THREE.Mesh(geo, mt); m.position.y = y0; return m; };
  for (const s of [-1, 1]) {
    const w = slab([[s * 2.4, -1.5], [s * 2.4, 9], [s * 23.5, 14.5], [s * 23.5, 11.5]], .5, WM, 3.0); g.add(w);
    const tipc = new THREE.Mesh(new THREE.BoxGeometry(.2, 1.7, 2.8), new THREE.MeshStandardMaterial({ color: stripe })); tipc.position.set(s * 23.5, 3.9, 12.8); g.add(tipc);
    const e = new THREE.Mesh(new THREE.CylinderGeometry(1.25, 1.1, 4.6, 14), new THREE.MeshStandardMaterial({ color: '#cfd5dc', roughness: .4, metalness: .3 })); e.rotation.x = Math.PI / 2; e.position.set(s * 8.2, 1.7, 1.6); g.add(e);
    const inl = new THREE.Mesh(new THREE.CylinderGeometry(.9, .9, .3, 14), new THREE.MeshStandardMaterial({ color: '#2a2d33' })); inl.rotation.x = Math.PI / 2; inl.position.set(s * 8.2, 1.7, -.8); g.add(inl);
    g.add(slab([[s * 1.2, 20], [s * 1.2, 24.5], [s * 9.5, 26.5], [s * 9.5, 24.7]], .3, WM, 6.4));
  }
  const finM = new THREE.MeshStandardMaterial({ color: stripe, roughness: .5, side: THREE.DoubleSide, flatShading: true });
  const fg = new THREE.BufferGeometry(); fg.setAttribute('position', new THREE.Float32BufferAttribute([0, 7.2, 13, 0, 7.4, 24.8, 0, 17.5, 25.2, 0, 17.5, 21.6], 3)); fg.setIndex([0, 1, 2, 0, 2, 3]); fg.computeVertexNormals(); g.add(new THREE.Mesh(fg, finM));
  const ck = new THREE.Mesh(new THREE.BoxGeometry(2.1, .5, .9), new THREE.MeshStandardMaterial({ color: '#0f1c2a', roughness: .1, metalness: .7 })); ck.position.set(0, 5.9, -21.3); ck.rotation.x = .5; g.add(ck);
  // landing gear
  const gear = new THREE.Group(); g.add(gear); const wheels = []; const dm = new THREE.MeshStandardMaterial({ color: '#2a2d33', roughness: .8 });
  const wmats = [new THREE.MeshStandardMaterial({ color: '#16181c', roughness: .95 }), new THREE.MeshStandardMaterial({ map: hubTex() }), new THREE.MeshStandardMaterial({ map: hubTex() })];
  const bogie = (x, z, n) => { const st = new THREE.Mesh(new THREE.CylinderGeometry(.2, .2, 1.9, 8), dm); st.position.set(x, 1.4, z); gear.add(st); for (let k = 0; k < n; k++) { const ax = new THREE.Group(); ax.position.set(x, .6, z + (k - (n - 1) / 2) * 1.5); ax.rotation.z = Math.PI / 2; gear.add(ax); const w = new THREE.Mesh(new THREE.CylinderGeometry(.6, .6, .5, 16), wmats); ax.add(w); wheels.push(w); } };
  bogie(-3.5, 3, 3); bogie(3.5, 3, 3); bogie(0, -17, 2);
  const glow = glowSprite('#ffb060', 4, 0); glow.position.set(0, 3, 26); g.add(glow);
  const shd = new THREE.Mesh(new THREE.CircleGeometry(1, 24), new THREE.MeshBasicMaterial({ color: 0, transparent: true, opacity: .3, depthWrite: false })); shd.rotation.x = -Math.PI / 2; shd.scale.set(26, 13, 1); S.add(shd);
  const api = { g, gear, wheels, shd,
    show(v) { g.visible = v; shd.visible = v; },
    // pose from a path p(t)->[x,y,z]: heading from velocity, pitch = flight-path angle + alpha, bank = atan(v*yawRate/g) (or forced roll)
    fly(t, path, o2 = {}) {
      const d = .05, p = path(t), pa = path(t + d), pb = path(t - d);
      const vx = (pa[0] - pb[0]) / (2 * d), vy = (pa[1] - pb[1]) / (2 * d), vz = (pa[2] - pb[2]) / (2 * d); const hs = Math.hypot(vx, vz);
      const hd = (u) => { const a = path(u + .12), b = path(u - .12); return Math.atan2(-(a[0] - b[0]), -(a[2] - b[2])); };
      const yaw = hs > .5 ? hd(t) : (g.userData.yaw ?? 0); g.userData.yaw = yaw;
      let dy = hd(t + .2) - hd(t - .2); while (dy > Math.PI) dy -= 2 * Math.PI; while (dy < -Math.PI) dy += 2 * Math.PI; const yr = dy / .4;
      let bank = hs > 3 ? Math.max(-.7, Math.min(.7, Math.atan(hs * yr / G))) : 0; if (o2.roll) bank = o2.roll(t);
      const pitch = (hs > .5 ? Math.atan2(vy, hs) : 0) + (o2.alpha ? o2.alpha(t) : 0);
      g.position.set(p[0], p[1], p[2]); g.rotation.set(pitch, yaw, bank);
      const alt = p[1]; gear.visible = o2.gear !== undefined ? o2.gear : alt < 14;
      const sp = Math.hypot(vx, vy, vz); if (o2.dist !== undefined) wheels.forEach(w => w.rotation.y = o2.dist / .6);
      shd.visible = g.visible && alt < 400; shd.position.set(p[0], (o2.ground || 0) + .15, p[2]); shd.rotation.z = -yaw; const k = 1 - Math.min(.6, alt / 600); shd.scale.set(26 * k, 13 * k, 1); shd.material.opacity = .3 * (1 - Math.min(1, alt / 500));
      return { sp, vy, hs, yaw, bank, pitch };
    } };
  return api;
}
// ground roll with constant acceleration, rotation at vr, then constant climb: returns {x(t),y(t),dist(t),alpha(t)} along +x (callers rotate/offset)
export function takeoffProfile(t0, a = 2.6, vr = 78, climbDeg = 11, v2 = 92) {
  const tr = vr / a, sr = .5 * a * tr * tr, tRot = 3.2; const cl = climbDeg * Math.PI / 180;
  // after liftoff: speed rises vr->v2 (a/3), flight path angle ramps up to climb over 3 s
  const gam = (tt) => cl * sm(tt / 3.0);
  const state = (t) => { const tt = t - t0; if (tt <= 0) return { s: 0, y: 0, v: 0, gam: 0, rot: 0 }; if (tt <= tr + tRot * .5) return { s: .5 * a * tt * tt, y: 0, v: a * tt, gam: 0, rot: tt > tr ? sm((tt - tr) / (tRot * .5)) * .1 : 0 };
    const tl = tr + tRot * .5; const sL = .5 * a * tl * tl, vL = a * tl; const u = tt - tl; const a2 = a / 3; const v = Math.min(v2, vL + a2 * u); const dd = (v + vL) / 2 * u; let y = 0, s = sL; const N = 24; let sx = 0; for (let i = 0; i < N; i++) { const uu = u * (i + .5) / N, vv = Math.min(v2, vL + a2 * uu), gg = gam(uu); sx += vv * Math.cos(gg) * u / N; y += vv * Math.sin(gg) * u / N; } return { s: sL + sx, y, v, gam: gam(u), rot: .1 }; };
  return state;
}

// ---------- fire / impact / smoke ----------
const flameBall = tex(128, 128, (c) => { const g = c.createRadialGradient(64, 64, 2, 64, 64, 62); g.addColorStop(0, 'rgba(255,246,190,1)'); g.addColorStop(.28, 'rgba(255,196,60,1)'); g.addColorStop(.6, 'rgba(240,96,20,.95)'); g.addColorStop(.85, 'rgba(150,30,10,.5)'); g.addColorStop(1, 'rgba(90,10,0,0)'); c.fillStyle = g; c.fillRect(0, 0, 128, 128); });
export function blast(S, R = 40, o = {}) {
  const g = new THREE.Group(); g.visible = false; S.add(g); const wind = o.wind || [1, 0, .3]; const rise = o.rise || 1;
  const fl = []; for (let i = 0; i < 12; i++) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: flameBall, transparent: true, depthWrite: false, toneMapped: false })); g.add(s); fl.push(s); }
  const flash = glowSprite('#fff1c0', R * 4, 0); g.add(flash);
  const N = o.n || 26, sp = []; for (let i = 0; i < N; i++) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: smokeT, transparent: true, depthWrite: false, color: o.col || '#2c2b30', opacity: 0 })); g.add(s); sp.push(s); }
  const deb = []; for (let i = 0; i < 12; i++) { const m = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshStandardMaterial({ color: i % 3 ? '#8a8d93' : '#c9c3b4', flatShading: true })); g.add(m); deb.push(m); }
  const light = new THREE.PointLight('#ff9a40', 0, R * 12, 1.2); g.add(light);
  const dir = o.dir || [0, 0, 1];
  return { g, at(p) { g.position.set(...p); return this; },
    update(t, t0, tEnd = 1e9) {
      const k = t - t0; g.visible = k > 0 && t < tEnd; if (!g.visible) return;
      const f = Math.max(0, 1 - k / .35); flash.material.opacity = f; flash.scale.setScalar(R * 4 * (1 + k * 3)); light.intensity = 4000 * f * (R / 40) * (R / 40) + 300 * (R / 40) * Math.max(0, 1 - k / 6);
      fl.forEach((s, i) => { const a = hash(i * 3.3) * 6.28, e = hash(i * 7.1) * .8; const life = 1.0 + hash(i) * .6; const u = Math.min(1, k / life); const r = R * (.2 + u * .6) * (.4 + hash(i + 9)); s.position.set(Math.cos(a) * r * .8 + dir[0] * u * R * .3, Math.sin(e) * r * .7 + u * R * .55 * rise, Math.sin(a) * r * .4 + dir[2] * u * R * .3); const sc = R * (.7 + u * 1.1) * (.55 + hash(i + 4) * .6); s.scale.set(sc, sc, 1); s.material.opacity = Math.max(0, 1 - u) * .95; });
      const L = 9; sp.forEach((s, i) => { const Dt = L / N; const age = (k - i * Dt * .55); if (age < 0) { s.material.opacity = 0; return; } const a2 = age % L; const u = a2 / L; const rs = 22 * rise; const jx = (hash(i * 2.7) - .5) * R * .7, jz = (hash(i * 5.1) - .5) * R * .5;
        s.position.set(jx + wind[0] * (u * u * R * 7) , a2 * rs * (R / 40) + R * .3, jz + wind[2] * (u * u * R * 7)); const sc = R * (1.1 + u * 4.2) * (.8 + hash(i) * .5); s.scale.set(sc, sc, 1);
        const gv = Math.round(40 + 70 * u); s.material.color.setRGB(gv / 255, gv / 255, (gv + 4) / 255); s.material.opacity = (o.op ?? .8) * Math.min(1, a2 / .25) * (1 - u * u) * Math.min(1, (k - i * Dt * .55) / .2); });
      deb.forEach((m, i) => { const a = hash(i * 1.9) * 6.28, v = R * (.8 + hash(i + 2) * 2.2), vy = R * (.5 + hash(i + 7) * 1.4); const g0 = G; const x = Math.cos(a) * v * k * .5 + dir[0] * v * k * .3, z = Math.sin(a) * v * k * .25 + dir[2] * v * k * .3; const y = vy * k - .5 * g0 * k * k * 3.2; m.visible = y > -R * .5 && k < 4; m.position.set(x, y, z); const s = (.012 + hash(i + 3) * .02) * R; m.scale.set(s, s * .6, s * 1.2); m.rotation.set(k * (2 + i * .2), k * (1.5 + i * .3), 0); });
    } };
}

// ---------- facade materials (shared). cell texture covers 4x4 windows; UVs are scaled per building ----------
export const FAC = {};
export function facadeMat(kind) {
  if (FAC[kind]) return FAC[kind];
  const P = { glass: ['#7c9fc0', '#3e6b97', '#b8d4ea'], brick: ['#cf9f78', '#6b4a3a', '#e8c9a8'], stone: ['#e2dccd', '#7b8794', '#f2ede0'], tan: ['#c4b49a', '#5a6470', '#e4d6bd'], steel: ['#d3d8de', '#44525f', '#e6eaee'], dark: ['#8d96a3', '#2d3b4a', '#b5bdc8'], red: ['#c26a50', '#5a3a30', '#e2987e'] }[kind];
  const lit = []; const rnd = (i) => hash(i * 12.9 + kind.length * 7.7);
  const map = tex(256, 256, (c, W, H) => { c.fillStyle = P[0]; c.fillRect(0, 0, W, H); for (let r = 0; r < 4; r++) for (let k = 0; k < 4; k++) { const narrow = kind === 'steel'; const x = k * 64 + (narrow ? 12 : 10), y = r * 64 + 14, w = narrow ? 40 : 44, h = 36; c.fillStyle = P[1]; c.fillRect(x, y, w, h); c.fillStyle = 'rgba(255,255,255,.14)'; c.fillRect(x, y, w, 10); if (narrow) { c.fillStyle = P[1]; c.fillRect(k * 64 + 31, y, 3, h); } } c.fillStyle = 'rgba(0,0,0,.08)'; for (let r = 0; r < 4; r++) c.fillRect(0, r * 64 + 56, W, 8); grain(c, W, H, .06, 1200); });
  map.wrapS = map.wrapT = THREE.RepeatWrapping;
  const em = tex(256, 256, (c, W, H) => { c.fillStyle = '#000'; c.fillRect(0, 0, W, H); for (let r = 0; r < 4; r++) for (let k = 0; k < 4; k++) if (rnd(r * 4 + k + 1) > .38) { c.fillStyle = rnd(r + k * 5) > .5 ? '#ffd9a0' : '#fff2c8'; c.fillRect(k * 64 + (kind === 'steel' ? 12 : 10), r * 64 + 14, kind === 'steel' ? 40 : 44, 36); } }); em.wrapS = em.wrapT = THREE.RepeatWrapping;
  const roof = new THREE.MeshStandardMaterial({ color: kind === 'glass' || kind === 'dark' ? '#6d7684' : '#8a8f97', roughness: .9 });
  const side = new THREE.MeshStandardMaterial({ map, emissiveMap: em, emissive: '#ffffff', emissiveIntensity: 0, roughness: .6, metalness: .05 });
  return FAC[kind] = { side, roof, kind };
}
export function setDusk(k) { Object.values(FAC).forEach(f => { f.side.emissiveIntensity = k * .8; f.roof.color.set(k > .5 ? '#4a505c' : '#8a8f97'); }); }
// box building with window cells (4 m bays) scaled onto each side
export function bldg(S, kind, w, h, d, x, z, y0 = 0, cell = 16) {
  const f = facadeMat(kind); const geo = new THREE.BoxGeometry(w, h, d); const uv = geo.attributes.uv;
  const sc = [[d, h], [d, h], [1, 1], [1, 1], [w, h], [w, h]]; // +x -x +y -y +z -z
  for (let fcs = 0; fcs < 6; fcs++) for (let i = 0; i < 4; i++) { const idx = fcs * 4 + i; uv.setXY(idx, uv.getX(idx) * sc[fcs][0] / cell, uv.getY(idx) * sc[fcs][1] / cell); }
  const m = new THREE.Mesh(geo, [f.side, f.side, f.roof, f.roof, f.side, f.side]); m.position.set(x, y0 + h / 2, z); S.add(m); return m;
}

// ---------- wheeled vehicle: yellow cab (nose +X), wheel angle = distance / radius ----------
export function cab(S, col = '#f5c518') {
  const g = new THREE.Group(); S.add(g);
  const body = ibox(4.6, .95, 1.9, { color: col }); body.position.y = .85; g.add(body);
  const win = face(col, (c, W, H) => { c.fillStyle = '#26313c'; c.fillRect(W * .08, H * .12, W * .38, H * .66); c.fillRect(W * .54, H * .12, W * .38, H * .66); }, { w: 256, h: 96 });
  const top = ibox(2.5, .9, 1.8, { color: col, side: win, front: win, back: win }); top.position.set(-.3, 1.75, 0); g.add(top);
  const sign = ibox(.7, .25, .35, { color: '#fff4c0' }); sign.position.set(-.3, 2.35, 0); g.add(sign);
  const wm = [new THREE.MeshStandardMaterial({ color: '#16181c', roughness: .95 }), new THREE.MeshStandardMaterial({ map: hubTex() }), new THREE.MeshStandardMaterial({ map: hubTex() })];
  const wheels = []; for (const [x, z] of [[1.5, .95], [-1.5, .95], [1.5, -.95], [-1.5, -.95]]) { const ax = new THREE.Group(); ax.position.set(x, .4, z); ax.rotation.x = Math.PI / 2; g.add(ax); const w = new THREE.Mesh(new THREE.CylinderGeometry(.4, .4, .3, 16), wm); ax.add(w); wheels.push(w); }
  return { g, r: .4, drive(x, y, z, dist, heading = 0) { g.position.set(x, y, z); g.rotation.y = heading; wheels.forEach(w => w.rotation.y = -dist / .4); } };
}
export { smokeT };
