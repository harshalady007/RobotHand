import * as THREE from 'three';
import { OUT, hash, tex, face, mat, basic, ibox, plane, glowSprite, floorGlow, sline, grain } from './tex.js';
import { Char, drawChar } from './chars.js';
import { fire, crowd, person, Flag } from './sets.js';

export const SEAL = (i = 0, x = {}) => ({ body: ['#5b6450', '#56604c', '#606a52'][i % 3], hair: 'bald', hat: 'nvg', hatCol: '#5a5a44', vest: '#3e4535', arms: 'rifle', nvgDown: true, seed: 400 + i * 1.7, ...x });
export const OBL = { body: '#cfc8b6', hair: 'bald', hat: 'turban', beard: '#8f8a80', stache: true, hairCol: '#8f8a80', seed: 450 };
export const OFFICIAL = (i) => ({ body: ['#2b3040', '#3a3a44', '#23262e', '#4a4038', '#30343c', '#3a3026'][i % 6], hair: ['helmet', 'gray', 'bob', 'helmet', 'gray', 'bun'][i % 6], hairCol: ['#3a2618', '#888', '#6b4428', '#1d1612', '#999', '#5b3a1e'][i % 6], collar: true, lapel: true, tie: ['#7a1f2a', '#1f4fa0', '', '#4a4a4a', '#6a1f1f', ''][i % 6], seed: 470 + i });
export const PRES = { body: '#22252e', hair: 'helmet', hairCol: '#2a2422', collar: true, lapel: true, tie: '#27408b', seed: 490 };
export const LOCAL = (i, x = {}) => ({ body: ['#d8cfb8', '#a8b8c0', '#c9b090', '#8a9a7a', '#e0d8c8', '#b0a090'][i % 6], hair: ['helmet', 'helmet', 'bald', 'curly'][i % 4], hairCol: '#1d1612', hat: i % 3 === 0 ? 'turban' : undefined, hatCol: '#e8e2d2', stache: i % 2 === 0, seed: 600 + i * 1.3, ...x });

export const smokeT = tex(128, 128, (c) => { for (let i = 0; i < 6; i++) { const g = c.createRadialGradient(40 + hash(i) * 48, 40 + hash(i + 3) * 48, 0, 64, 64, 60); g.addColorStop(0, 'rgba(255,255,255,.55)'); g.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = g; c.fillRect(0, 0, 128, 128); } });

export function skyDome(S, top = '#04060e', mid = '#0e1830', hor = '#2a3a5c') {
  const t = tex(16, 256, (c, W, H) => { const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, top); g.addColorStop(.55, mid); g.addColorStop(1, hor); c.fillStyle = g; c.fillRect(0, 0, W, H); });
  const m = new THREE.Mesh(new THREE.SphereGeometry(600, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshBasicMaterial({ map: t, side: THREE.BackSide, fog: false, depthWrite: false })); m.renderOrder = -1; S.add(m); return m;
}
export function stars(S, n = 1500, R = 420) {
  const pos = new Float32Array(n * 3), col = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) { const a = hash(i * 1.31) * Math.PI * 2, e = Math.asin(hash(i * 2.71)) * .92 + .04; pos.set([Math.cos(a) * Math.cos(e) * R, Math.sin(e) * R, Math.sin(a) * Math.cos(e) * R], i * 3); const b = .35 + hash(i * 5.3) * .65; col.set([b * .92, b * .95, b], i * 3); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  const p = new THREE.Points(g, new THREE.PointsMaterial({ size: 2.0, sizeAttenuation: false, vertexColors: true, fog: false, toneMapped: false })); S.add(p); return p;
}

// ---------- explosion / breach puff ----------
const puffT = tex(128, 128, (c) => { for (let i = 0; i < 7; i++) { const g = c.createRadialGradient(36 + hash(i) * 56, 36 + hash(i + 3) * 56, 0, 64, 64, 60); g.addColorStop(0, 'rgba(255,255,255,.7)'); g.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = g; c.fillRect(0, 0, 128, 128); } });
export function puff(scene, x, y, z, size = 1, col = '#9a9690') {
  const g = new THREE.Group(); g.position.set(x, y, z); g.visible = false; scene.add(g);
  const sp = []; for (let i = 0; i < 8; i++) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: puffT, transparent: true, depthWrite: false, color: col })); g.add(s); sp.push(s); }
  const fl = glowSprite('#ffe2a0', 2.5 * size, 0); g.add(fl);
  const light = new THREE.PointLight('#ffd08a', 0, 10 * size, 1.4); g.add(light);
  return { g, update(t, t0) { const k = t - t0; g.visible = k > 0; if (k <= 0) return;
    const f = Math.max(0, 1 - k / .22); fl.material.opacity = f; fl.scale.setScalar(2.5 * size * (1 + k * 2)); light.intensity = 12 * size * f;
    sp.forEach((s, i) => { const a = i / 8 * Math.PI * 2; const r = Math.min(1, k * 1.6) * .7 * size; s.position.set(Math.cos(a) * r, Math.sin(a) * r * .6 + k * .35 * size, (hash(i) - .5) * .3 + .4 * size); const sc = size * (.5 + Math.min(1, k * 1.2) * 1.5); s.scale.set(sc, sc, 1); s.material.opacity = .8 * Math.max(0, 1 - k / 3.5); }); } };
}

// ---------- rotor-wash dust ring ----------
export function dust(S, n = 16, col = '#a89a80') {
  const g = new THREE.Group(); S.add(g); const sp = [];
  for (let i = 0; i < n; i++) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: smokeT, transparent: true, depthWrite: false, color: col, opacity: 0 })); g.add(s); sp.push(s); }
  return { g, update(t, x, z, alt, k = 1) { g.position.set(x, 0, z); const a = k * Math.max(0, 1 - alt / 16);
    sp.forEach((s, i) => { const life = ((t * .8 + i / n) % 1); const ang = i / n * Math.PI * 2 + hash(i) * .6; const r = 4 + life * 16; s.position.set(Math.cos(ang) * r, .8 + life * 2.6, Math.sin(ang) * r); const sc = 2.5 + life * 6; s.scale.set(sc, sc, 1); s.material.opacity = .5 * a * Math.sin(life * Math.PI); }); } };
}

// ---------- stealth helicopter (nose toward local -Z), ground contact at y=0 ----------
export function heli(S, o = {}) {
  const g = new THREE.Group(); g.rotation.order = 'YXZ'; S.add(g);
  const col = o.col || '#3c4149';
  const skin = (w = 256, h = 256) => face(col, (c, W, H) => { grain(c, W, H, .08, 1500); for (let i = 1; i < 4; i++) sline(c, i * W / 4, 0, i * W / 4, H, 2, 'rgba(0,0,0,.25)'); }, { w, h });
  const sk = skin();
  const cab = ibox(2.7, 2.3, 6.6, { color: col, side: sk, top: sk, front: sk, back: sk }); cab.position.set(0, 1.95, 0); g.add(cab);
  const doorW = face('#2a2e34', (c, W, H) => { c.fillStyle = '#141820'; c.fillRect(W * .12, H * .12, W * .32, H * .4); c.fillRect(W * .56, H * .12, W * .32, H * .4); }, { w: 256, h: 128 });
  for (const s of [-1, 1]) { const d = plane(3.6, 1.6, mat(doorW, { emis: .05 })); d.position.set(s * 1.36, 2.05, -.4); d.rotation.y = s * Math.PI / 2; g.add(d); }
  const nose = ibox(2.4, 1.5, 2.6, { color: col, side: sk, top: sk, front: sk }); nose.position.set(0, 1.55, -4.5); g.add(nose);
  const wsG = new THREE.Group(); wsG.position.set(0, 2.6, -3.45); wsG.rotation.y = Math.PI; g.add(wsG);
  const wsM = new THREE.MeshStandardMaterial({ color: '#0e141a', roughness: .12, metalness: .7, emissive: '#3a0a08', emissiveIntensity: .35 });
  const ws = plane(2.35, 1.35, wsM); ws.rotation.x = -.62; wsG.add(ws);
  const eng = ibox(1.7, .75, 3.4, { color: col, side: sk, top: sk }); eng.position.set(0, 3.45, -.2); g.add(eng);
  const boom = new THREE.Mesh(new THREE.CylinderGeometry(.32, .62, 7.4, 6), new THREE.MeshStandardMaterial({ color: col, roughness: .7, flatShading: true })); boom.rotation.x = Math.PI / 2; boom.position.set(0, 2.45, 6.8); g.add(boom);
  const fin = ibox(.22, 2.5, 1.5, { color: col }); fin.position.set(0, 3.5, 10.3); fin.rotation.x = -.35; g.add(fin);
  const stab = ibox(3.4, .12, .9, { color: col }); stab.position.set(0, 2.35, 9.8); g.add(stab);
  const tailR = new THREE.Group(); tailR.position.set(.32, 4.1, 10.6); g.add(tailR);
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(.45, .45, .14, 16), new THREE.MeshStandardMaterial({ color: '#2a2e34' })); hub.rotation.z = Math.PI / 2; tailR.add(hub);
  const tBlades = new THREE.Group(); tailR.add(tBlades);
  for (let k = 0; k < 4; k++) { const b = new THREE.Mesh(new THREE.BoxGeometry(.05, 1.5, .18), new THREE.MeshStandardMaterial({ color: '#1e2126' })); b.geometry.translate(0, .75, 0); b.rotation.x = k * Math.PI / 2; tBlades.add(b); }
  for (const [x, z, r] of [[-1.25, -2.6, .38], [1.25, -2.6, .38], [0, 9.0, .25]]) { const w = new THREE.Mesh(new THREE.CylinderGeometry(r, r, .26, 14), new THREE.MeshStandardMaterial({ color: '#111' })); w.rotation.z = Math.PI / 2; w.position.set(x, r, z); g.add(w); const st = ibox(.12, .5, .12, { color: '#2a2a2a' }); st.position.set(x, r + .45, z); g.add(st); }
  const mast = new THREE.Mesh(new THREE.CylinderGeometry(.18, .22, .9, 10), new THREE.MeshStandardMaterial({ color: '#2a2e34' })); mast.position.set(0, 4.15, -.5); g.add(mast);
  const rotor = new THREE.Group(); rotor.position.set(0, 4.6, -.5); g.add(rotor);
  const blades = new THREE.Group(); rotor.add(blades);
  for (let k = 0; k < 4; k++) { const b = new THREE.Mesh(new THREE.BoxGeometry(8.2, .07, .52), new THREE.MeshStandardMaterial({ color: '#1b1e22', roughness: .6 })); b.geometry.translate(4.1, 0, 0); b.rotation.y = k * Math.PI / 2; blades.add(b); }
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(.55, .55, .25, 16), new THREE.MeshStandardMaterial({ color: '#2a2e34' })); rotor.add(cap);
  const disc = new THREE.Mesh(new THREE.CircleGeometry(8.3, 48), new THREE.MeshBasicMaterial({ color: '#0a0c10', transparent: true, opacity: .16, depthWrite: false, side: THREE.DoubleSide })); disc.rotation.x = -Math.PI / 2; rotor.add(disc);
  const cockpitGlow = glowSprite('#ff3a2a', 1.4, .35); cockpitGlow.position.set(0, 2.4, -3.4); g.add(cockpitGlow);
  let yaw = o.yaw || 0;
  return { g, rotor, blades, tBlades,
    spin(t, rate = 4.3) { blades.rotation.y = -t * rate * Math.PI * 2; tBlades.rotation.x = t * rate * 4.6 * Math.PI * 2; },
    place(p, ry = 0, rx = 0, rz = 0) { g.position.set(p[0], p[1], p[2]); g.rotation.set(rx, ry, rz); },
    // follow a path p(t) -> [x,y,z]: heading from velocity, nose-down pitch with forward speed, bank into turns
    fly(t, path, opt = {}) {
      const p = path(t), p2 = path(t + .06), p0 = path(t - .06);
      const vx = (p2[0] - p0[0]) / .12, vz = (p2[2] - p0[2]) / .12, vy = (p2[1] - p0[1]) / .12, sp = Math.hypot(vx, vz);
      if (sp > 1.5) yaw = Math.atan2(-vx, -vz); else if (opt.yaw !== undefined) yaw = opt.yaw;
      const p3 = path(t + .3), vx3 = (p3[0] - p2[0]) / .24, vz3 = (p3[2] - p2[2]) / .24; const yaw2 = Math.hypot(vx3, vz3) > 1.5 ? Math.atan2(-vx3, -vz3) : yaw;
      let dy = yaw2 - yaw; while (dy > Math.PI) dy -= 2 * Math.PI; while (dy < -Math.PI) dy += 2 * Math.PI;
      const pa = path(t + .18), pb = path(t - .18); const spA = Math.hypot(pa[0] - p2[0], pa[2] - p2[2]) / .12, spB = Math.hypot(p0[0] - pb[0], p0[2] - pb[2]) / .12; const acc = (spA - spB) / .3;
      const pitch = Math.max(-.22, Math.min(.2, sp * .0018 + acc * .008));
      g.position.set(p[0], p[1], p[2]); g.rotation.set(-pitch, yaw, Math.max(-.35, Math.min(.35, -dy * 1.2)));
      this.spin(t); return { sp, vy };
    } };
}

// ---------- white SUV (nose +X) ----------
export function suv(S, col = '#ecebe4') {
  const g = new THREE.Group(); S.add(g);
  const body = ibox(4.4, 1.25, 2.0, { color: col }); body.position.y = 1.05; g.add(body);
  const win = face(col, (c, W, H) => { c.fillStyle = '#26313c'; c.fillRect(W * .06, H * .12, W * .4, H * .62); c.fillRect(W * .52, H * .12, W * .42, H * .62); }, { w: 256, h: 96 });
  const top = ibox(2.9, 1.0, 1.9, { color: col, side: win, front: win, back: win }); top.position.set(-.25, 2.15, 0); g.add(top);
  const hubT = tex(64, 64, (c) => { c.fillStyle = '#151515'; c.fillRect(0, 0, 64, 64); c.fillStyle = '#9a9a9a'; c.beginPath(); c.arc(32, 32, 16, 0, 7); c.fill(); c.strokeStyle = '#151515'; c.lineWidth = 5; for (let k = 0; k < 5; k++) { const a = k * Math.PI * 2 / 5; c.beginPath(); c.moveTo(32, 32); c.lineTo(32 + Math.cos(a) * 16, 32 + Math.sin(a) * 16); c.stroke(); } });
  const wheels = [];
  for (const [x, z] of [[1.45, 1.0], [-1.45, 1.0], [1.45, -1.0], [-1.45, -1.0]]) { const ax = new THREE.Group(); ax.position.set(x, .46, z); ax.rotation.x = Math.PI / 2; g.add(ax); const w = new THREE.Mesh(new THREE.CylinderGeometry(.46, .46, .3, 18), [new THREE.MeshStandardMaterial({ color: '#141414' }), new THREE.MeshStandardMaterial({ map: hubT }), new THREE.MeshStandardMaterial({ map: hubT })]); ax.add(w); wheels.push(w); }
  const hl = [glowSprite('#fff2c8', 1.1, 0), glowSprite('#fff2c8', 1.1, 0)]; hl[0].position.set(2.25, 1.0, .65); hl[1].position.set(2.25, 1.0, -.65); g.add(...hl);
  const beam = new THREE.SpotLight('#fff0c8', 0, 30, .5, .6, 1.2); beam.position.set(2.3, 1.1, 0); beam.target.position.set(12, 0, 0); g.add(beam, beam.target);
  const tl = [glowSprite('#ff2a1a', .6, 0), glowSprite('#ff2a1a', .6, 0)]; tl[0].position.set(-2.25, 1.1, .7); tl[1].position.set(-2.25, 1.1, -.7); g.add(...tl);
  return { g, drive(x, z, dist, lights, brake = 0) { g.position.set(x, 0, z); wheels.forEach(w => w.rotation.y = -dist / .46); hl.forEach(h => h.material.opacity = lights ? .95 : 0); beam.intensity = lights ? 40 : 0; tl.forEach(h => h.material.opacity = lights ? .5 + brake * .5 : 0); } };
}

// ---------- top-down person (for satellite view) ----------
function topPerson(S, col = '#cfc8b6') {
  const g = new THREE.Group(); S.add(g);
  const sh = new THREE.Mesh(new THREE.CircleGeometry(.55, 20), new THREE.MeshBasicMaterial({ color: col })); sh.scale.set(1, .6, 1); sh.rotation.x = -Math.PI / 2; sh.position.y = .3; g.add(sh);
  const hd = new THREE.Mesh(new THREE.CircleGeometry(.3, 20), new THREE.MeshBasicMaterial({ color: '#f1ece0' })); hd.rotation.x = -Math.PI / 2; hd.position.y = .35; g.add(hd);
  const shd = new THREE.Mesh(new THREE.CircleGeometry(.6, 20), new THREE.MeshBasicMaterial({ color: '#000', transparent: true, opacity: .35 })); shd.rotation.x = -Math.PI / 2; shd.position.set(.35, .02, .25); g.add(shd);
  return g;
}

// ---------- houses ----------
function houseFront(base, night, seed, floors = 2, cols = 4, door = true) {
  return face(base, (c, W, H) => {
    const fh = H / floors;
    for (let f = 0; f < floors; f++) for (let k = 0; k < cols; k++) {
      if (door && f === 0 && k === Math.floor(cols / 2)) { c.fillStyle = '#4a3a2a'; c.fillRect(k * W / cols + W / cols * .25, H - fh * .75, W / cols * .5, fh * .75); c.lineWidth = 4; c.strokeStyle = OUT; c.strokeRect(k * W / cols + W / cols * .25, H - fh * .75, W / cols * .5, fh * .75); continue; }
      if (hash(seed * 3 + f * 5 + k) < .3) continue;
      const x = k * W / cols + W / cols * .3, y = f * fh + fh * .3, w = W / cols * .4, h = fh * .34; const lit = night && hash(seed + f * 7 + k * 3) > .55;
      c.fillStyle = lit ? '#ffc977' : (night ? '#10141c' : '#3a4250'); c.fillRect(x, y, w, h); c.lineWidth = 3; c.strokeStyle = OUT; c.strokeRect(x, y, w, h);
    }
    grain(c, W, H, .07, 2500);
  }, { w: 256, h: 256 });
}
function neighbour(S, x, z, w, h, d, seed, night) {
  const base = ['#e2d6bc', '#d8c8a8', '#ece4d2', '#cdbb98', '#e8dcc4'][seed % 5];
  const b = ibox(w, h, d, { color: base, front: houseFront(base, night, seed, Math.max(1, Math.round(h / 3.3)), 3), back: houseFront(base, night, seed + 9, Math.max(1, Math.round(h / 3.3)), 3) }, { frontEmis: night ? .5 : 0 }); b.position.set(x, h / 2, z); S.add(b);
  const tk = new THREE.Mesh(new THREE.CylinderGeometry(.6, .6, 1.1, 14), new THREE.MeshStandardMaterial({ color: '#2a2a2e' })); tk.position.set(x + w / 4, h + .55, z); S.add(tk);
  return b;
}
function tree(S, x, z, s = 1) {
  const tr = new THREE.Mesh(new THREE.CylinderGeometry(.25 * s, .35 * s, 3 * s, 8), new THREE.MeshStandardMaterial({ color: '#4a3424' })); tr.position.set(x, 1.5 * s, z); S.add(tr);
  const fo = new THREE.Mesh(new THREE.IcosahedronGeometry(2.4 * s, 0), new THREE.MeshStandardMaterial({ color: '#3a5a2a', flatShading: true, roughness: .9 })); fo.position.set(x, 4.2 * s, z); fo.scale.set(1, 1.15, 1); S.add(fo);
}
function wire(S, a, b, sag = 1.2, col = '#141414') {
  const pts = []; for (let k = 0; k <= 16; k++) { const u = k / 16; pts.push(new THREE.Vector3(a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u - Math.sin(u * Math.PI) * sag, a[2] + (b[2] - a[2]) * u)); }
  const l = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color: col })); S.add(l); return l;
}

// ================= ABBOTTABAD: COMPOUND + TOWN + ACADEMY =================
export const CPOLY = [[-27, 18], [24, 18], [30, -14], [6, -36], [-28, -24]];
export function buildCompound() {
  const S = new THREE.Scene();
  const skyN = skyDome(S); const st = stars(S);
  const gT = tex(512, 512, (c, W) => { c.fillStyle = '#6f7a48'; c.fillRect(0, 0, W, W); for (let i = 0; i < 40; i++) { c.fillStyle = `rgba(${90 + hash(i) * 60 | 0},${100 + hash(i + 1) * 50 | 0},50,.35)`; c.fillRect(hash(i + 2) * W, hash(i + 3) * W, 60 + hash(i + 4) * 120, 40 + hash(i + 5) * 90); } grain(c, W, W, .1, 6000); }, [30, 30]);
  const ground = plane(1400, 1400, mat(gT)); ground.rotation.x = -Math.PI / 2; ground.position.z = -200; S.add(ground);
  const road = plane(1400, 7, mat(tex(256, 64, (c, W, H) => { c.fillStyle = '#7a7060'; c.fillRect(0, 0, W, H); grain(c, W, H, .15, 3000); }, [60, 1]))); road.rotation.x = -Math.PI / 2; road.position.set(0, .03, 24.5); S.add(road);
  // courtyard dirt
  const cs = new THREE.Shape(CPOLY.map(p => new THREE.Vector2(p[0], -p[1])));
  const cy = new THREE.Mesh(new THREE.ShapeGeometry(cs), mat(tex(256, 256, (c, W) => { c.fillStyle = '#a89270'; c.fillRect(0, 0, W, W); grain(c, W, W, .14, 5000); for (let i = 0; i < 10; i++) { c.fillStyle = 'rgba(80,110,50,.45)'; c.fillRect(hash(i) * W, hash(i + 9) * W, 30, 18); } }, [6, 6])));
  cy.rotation.x = -Math.PI / 2; cy.position.y = .04; S.add(cy);
  // perimeter walls (4.6-5.4 tall) + barbed wire
  const wT = face('#d4c9ae', (c, W, H) => { for (let r = 0; r < 8; r++) sline(c, 0, r * H / 8, W, r * H / 8, 2, 'rgba(90,70,50,.18)'); grain(c, W, H, .1, 3000); for (let i = 0; i < 5; i++) { c.fillStyle = 'rgba(80,60,40,.12)'; c.fillRect(hash(i) * W, H * .7, 40, H * .3); } }, { w: 512, h: 128, rep: [1, 1] });
  const walls = [];
  for (let i = 0; i < CPOLY.length; i++) {
    const a = CPOLY[i], b = CPOLY[(i + 1) % CPOLY.length]; const dx = b[0] - a[0], dz = b[1] - a[1], L = Math.hypot(dx, dz); const h = i === 0 ? 4.6 : 5.4;
    const w = ibox(L + .5, h, .55, { color: '#d4c9ae', front: wT, back: wT }); w.position.set((a[0] + b[0]) / 2, h / 2, (a[1] + b[1]) / 2); w.rotation.y = Math.atan2(-dz, dx); S.add(w); walls.push(w);
    const pts = []; const n = Math.ceil(L * 3); for (let k = 0; k <= n; k++) { const u = k / n; const ang = u * L * 9; pts.push(new THREE.Vector3(a[0] + dx * u - Math.sin(ang) * .18 * dz / L, h + .3 + Math.cos(ang) * .18, a[1] + dz * u + Math.sin(ang) * .18 * dx / L)); }
    S.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color: '#2a2a2a' })));
  }
  const gate = ibox(5.2, 4.2, .18, { color: '#3a4038', front: face('#3a4038', (c, W, H) => { for (let k = 1; k < 8; k++) sline(c, k * W / 8, 0, k * W / 8, H, 3, 'rgba(0,0,0,.35)'); }) }); gate.position.set(14, 2.1, 18.32); S.add(gate);
  // main house: 2 floors + 3rd floor with privacy wall
  const mk = (night) => { const g = new THREE.Group(); S.add(g);
    const base = '#e9e2d0';
    const f1 = ibox(18, 6.8, 12, { color: base, front: houseFront(base, night, 41, 2, 5, true), side: houseFront(base, night, 43, 2, 4, false), back: houseFront(base, night, 47, 2, 5, false) }, { frontEmis: night ? .35 : 0 }); f1.position.set(-2, 3.4, -8); g.add(f1);
    const f3 = ibox(9, 3.3, 7, { color: base, front: houseFront(base, night, 51, 1, 3, false), side: houseFront(base, night, 53, 1, 2, false) }, { frontEmis: night ? .35 : 0 }); f3.position.set(-4, 8.45, -10); g.add(f3);
    const pw = ibox(8, 2.1, .3, { color: base }); pw.position.set(4.5, 7.85, -2.3); g.add(pw);
    const pw2 = ibox(.3, 2.1, 7, { color: base }); pw2.position.set(.5, 7.85, -5.8); g.add(pw2);
    for (const [x, z, w, d] of [[-2, -8, 18, 12], [-4, -10, 9, 7]]) { const par = ibox(w + .3, .5, d + .3, { color: '#d8d0bc' }); par.position.set(x, x === -2 ? 7.05 : 10.35, z); g.add(par); }
    const annex = ibox(8, 3.6, 6, { color: base, front: houseFront(base, night, 61, 1, 3, true) }, { frontEmis: night ? .35 : 0 }); annex.position.set(15, 1.8, 3); g.add(annex);
    return g; };
  const houseD = mk(false), houseN = mk(true); houseN.visible = false;
  const door = new THREE.Vector3(-2, 1.4, -1.95);
  // trash fire in courtyard (they burned their trash)
  const trash = fire(S, 12, 0, -22, .55, 7);
  // outside: neighbours with electric poles + wires (compound has none)
  const nbD = [], nbN = [];
  const NB = [[-40, 40, 12, 7, 10], [-14, 42, 14, 6.5, 9], [10, 40, 10, 9, 10], [32, 44, 16, 6.5, 11], [52, 36, 12, 7, 9], [-60, 30, 12, 6, 10], [-52, -2, 10, 6.5, 12], [-56, -40, 14, 7, 10], [48, 6, 12, 6.5, 10], [56, -30, 10, 9, 12], [-20, 70, 14, 6.5, 12], [24, 72, 12, 6.5, 10], [70, 50, 12, 9, 10], [-84, 52, 16, 6.5, 12]];
  NB.forEach(([x, z, w, h, d], i) => { nbD.push(neighbour(S, x, z, w, h, d, i, false)); const n = neighbour(S, x, z, w, h, d, i, true); n.visible = false; nbN.push(n); });
  const poles = []; for (let i = -6; i <= 6; i++) { const x = i * 16, z = 28.5; const p = new THREE.Mesh(new THREE.CylinderGeometry(.14, .18, 8.5, 8), new THREE.MeshStandardMaterial({ color: '#5a5048' })); p.position.set(x, 4.25, z); S.add(p); const cb = ibox(1.6, .12, .12, { color: '#3a3430' }); cb.position.set(x, 8.2, z); S.add(cb); poles.push([x, 8.2, z]); }
  for (let i = 0; i < poles.length - 1; i++) for (const o of [-.7, 0, .7]) wire(S, [poles[i][0] + o, poles[i][1], poles[i][2]], [poles[i + 1][0] + o, poles[i + 1][1], poles[i + 1][2]], 1.0);
  [[-32, 0], [-16, 1], [16, 2], [32, 3]].forEach(([px, k]) => { const nb = NB[k]; wire(S, [px, 8.1, 28.5], [nb[0], nb[3] - .3, nb[1] - nb[4] / 2], .6); });
  [[-62, 22], [-38, 30], [-8, 30], [38, 30], [44, 2], [60, 22], [-70, 0], [74, 40]].forEach(([x, z], i) => tree(S, x, z, .9 + hash(i) * .5));
  [[-12, -18], [20, -8]].forEach(([x, z], i) => tree(S, x, z, .7));
  // mountains
  const mtM = new THREE.MeshStandardMaterial({ color: '#3a4a34', flatShading: true, roughness: 1 });
  for (let i = 0; i < 16; i++) { const r = 80 + hash(i) * 90, h = 50 + hash(i + 3) * 80; const m = new THREE.Mesh(new THREE.ConeGeometry(r, h, 7, 1), mtM); m.position.set(-500 + i * 70 + hash(i + 7) * 30, h / 2 - 2, -360 - hash(i + 9) * 120); m.rotation.y = hash(i) * 3; S.add(m); }
  // ---- Pakistan Military Academy (pushed closer for the reveal; labelled 1.3 km) ----
  const AC = new THREE.Vector3(150, 0, -110);
  const pg = plane(70, 44, mat(tex(256, 256, (c, W) => { c.fillStyle = '#cdb88e'; c.fillRect(0, 0, W, W); grain(c, W, W, .1, 3000); c.strokeStyle = 'rgba(255,255,255,.6)'; c.lineWidth = 4; c.strokeRect(12, 12, W - 24, W - 24); }))); pg.rotation.x = -Math.PI / 2; pg.position.set(AC.x, .05, AC.z); S.add(pg);
  const brick = face('#a8573c', (c, W, H) => { for (let k = 0; k < 10; k++) { c.fillStyle = '#efe6d4'; c.beginPath(); c.moveTo(k * W / 10 + 6, H); c.lineTo(k * W / 10 + 6, H * .45); c.arc(k * W / 10 + W / 20, H * .45, W / 20 - 6, Math.PI, 0); c.lineTo(k * W / 10 + W / 10 - 6, H); c.fill(); c.fillStyle = '#3a2a22'; c.fillRect(k * W / 10 + 12, H * .55, W / 10 - 24, H * .45); } c.fillStyle = '#efe6d4'; c.fillRect(0, 0, W, H * .1); }, { w: 512, h: 128 });
  for (const [dx, dz, ry] of [[0, -32, 0], [-44, 0, Math.PI / 2], [44, 0, -Math.PI / 2]]) { const b = ibox(64, 9, 9, { color: '#a8573c', front: brick, back: brick }); b.position.set(AC.x + dx, 4.5, AC.z + dz); b.rotation.y = ry; S.add(b); }
  const tower = ibox(9, 18, 9, { color: '#a8573c', front: face('#a8573c', (c, W, H) => { c.fillStyle = '#efe6d4'; c.beginPath(); c.arc(W / 2, H * .25, W * .2, 0, 7); c.fill(); c.strokeStyle = OUT; c.lineWidth = 6; c.stroke(); sline(c, W / 2, H * .25, W / 2, H * .17, 5); sline(c, W / 2, H * .25, W * .58, H * .25, 5); }, { w: 128, h: 256 }) }); tower.position.set(AC.x, 9, AC.z - 32); S.add(tower);
  const fpole = new THREE.Mesh(new THREE.CylinderGeometry(.15, .2, 16, 8), new THREE.MeshStandardMaterial({ color: '#ddd' })); fpole.position.set(AC.x, 8, AC.z + 18); S.add(fpole);
  const pk = new Flag(S, 'pk', 6, 4); pk.mesh.position.set(AC.x + .15, 15.8, AC.z + 18);
  const cadets = crowd(S, 48, [0, 1, 0, 1], i => ({ body: '#6b6f4a', hair: 'helmet', hairCol: '#1d1612', cap: '#4d5a36', seed: 700 + i }), 2.0);
  cadets.list.forEach((s, i) => s.position.set(AC.x - 18 + (i % 8) * 4.5, 0, AC.z - 8 + Math.floor(i / 8) * 3.2));
  // distance marker
  const distG = new THREE.Group(); S.add(distG);
  const dashes = []; const A0 = new THREE.Vector3(0, 6, 0), B0 = new THREE.Vector3(AC.x, 6, AC.z); const nd = 40;
  for (let k = 0; k < nd; k++) { const u = (k + .5) / nd; const d = new THREE.Mesh(new THREE.BoxGeometry(1.6, .35, .7), new THREE.MeshBasicMaterial({ color: '#ffd23f', toneMapped: false })); d.position.lerpVectors(A0, B0, u); d.position.y = 6 + Math.sin(u * Math.PI) * 18; d.lookAt(B0.x, d.position.y, B0.z); d.rotateY(Math.PI / 2); distG.add(d); dashes.push(d); }
  const lblT = tex(512, 160, (c, W, H) => { c.fillStyle = 'rgba(10,10,14,.85)'; c.beginPath(); c.roundRect(6, 6, W - 12, H - 12, 26); c.fill(); c.lineWidth = 8; c.strokeStyle = '#ffd23f'; c.stroke(); c.fillStyle = '#ffd23f'; c.font = '800 92px Montserrat'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('1.3 KM', W / 2, H / 2 + 4); });
  const lbl = new THREE.Sprite(new THREE.SpriteMaterial({ map: lblT, transparent: true, depthTest: false, toneMapped: false })); lbl.scale.set(30, 9.4, 1); lbl.position.set(AC.x / 2, 34, AC.z / 2); distG.add(lbl);
  const acT = tex(1024, 140, (c, W, H) => { c.fillStyle = 'rgba(10,10,14,.85)'; c.beginPath(); c.roundRect(6, 6, W - 12, H - 12, 26); c.fill(); c.lineWidth = 6; c.strokeStyle = '#fff'; c.stroke(); c.fillStyle = '#fff'; c.font = '800 64px Montserrat'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('MILITARY ACADEMY', W / 2, H / 2 + 4); });
  const acL = new THREE.Sprite(new THREE.SpriteMaterial({ map: acT, transparent: true, depthTest: false, toneMapped: false })); acL.scale.set(44, 6, 1); acL.position.set(AC.x, 30, AC.z - 10); distG.add(acL);
  const hideT = tex(512, 140, (c, W, H) => { c.fillStyle = 'rgba(160,16,16,.9)'; c.beginPath(); c.roundRect(6, 6, W - 12, H - 12, 26); c.fill(); c.lineWidth = 6; c.strokeStyle = '#fff'; c.stroke(); c.fillStyle = '#fff'; c.font = '800 64px Montserrat'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('COMPOUND', W / 2, H / 2 + 4); });
  const cL = new THREE.Sprite(new THREE.SpriteMaterial({ map: hideT, transparent: true, depthTest: false, toneMapped: false })); cL.scale.set(26, 7, 1); cL.position.set(0, 22, -6); distG.add(cL);
  distG.visible = false;
  // vehicles, helicopters, people
  const car = suv(S);
  const h1 = heli(S), h2 = heli(S); const wreck = heli(S, { col: '#353a40' }); wreck.g.visible = false;
  const wreckFire = fire(S, -24, 2.5, -10, 1.6, 12);
  const dst = dust(S), dst2 = dust(S);
  const breach = puff(S, door.x, door.y, door.z + .4, 1.0);
  const pacer = topPerson(S); pacer.visible = false;
  // lighting
  const hemi = new THREE.HemisphereLight('#fff4e0', '#6a6050', 1.25); S.add(hemi);
  const sun = new THREE.DirectionalLight('#fff0d0', 1.6); sun.position.set(-60, 120, 60); S.add(sun);
  const moonless = new THREE.DirectionalLight('#5a6aa0', 0); moonless.position.set(30, 80, 40); S.add(moonless);
  const lamps = []; for (const [x, z] of [[-32, 27], [0, 27], [32, 27], [64, 27]]) { const p = new THREE.PointLight('#ffc070', 0, 26, 1.4); p.position.set(x, 7.5, z); S.add(p); const gs = glowSprite('#ffc070', 2.2, 0); gs.position.set(x, 7.6, z - .6); S.add(gs); lamps.push([p, gs]); }
  const chars = {}; for (let i = 0; i < 6; i++) chars['s' + i] = new Char(S, SEAL(i)); for (let i = 0; i < 6; i++) chars['l' + i] = new Char(S, LOCAL(i));
  chars.kid0 = new Char(S, person(31, { body: '#d9483b' }), 1.3); chars.kid1 = new Char(S, person(32, { body: '#3d6fb6' }), 1.25);
  const api = { scene: S, chars, st, houseD, houseN, nbD, nbN, door, trash, car, h1, h2, wreck, wreckFire, dst, dst2, breach, pacer, distG, dashes, lbl, acL, cL, pk, cadets, hemi, sun, moonless, lamps, AC, gate,
    setMode(night) { S.background = new THREE.Color(night ? '#0a1024' : '#8fb4dc'); S.fog = night ? new THREE.Fog('#141c34', 90, 520) : new THREE.Fog('#c8d8e4', 150, 700); st.visible = night; houseD.visible = !night; houseN.visible = night; nbD.forEach(b => b.visible = !night); nbN.forEach(b => b.visible = night);
      hemi.color.set(night ? '#7a8ad0' : '#fff4e0'); hemi.groundColor.set(night ? '#1a1a2a' : '#6a6050'); hemi.intensity = night ? 1.25 : 1.25; sun.intensity = night ? 0 : 1.6; moonless.intensity = night ? .9 : 0; skyN.visible = night; lamps.forEach(([p, g]) => { p.intensity = night ? 9 : 0; g.material.opacity = night ? .8 : 0; }); mtM.color.set(night ? '#141a26' : '#3a4a34'); },
    update(t) { pk.wave(t, .3); cadets.update(t, 0); } };
  return api;
}

// ================= NIGHT VALLEY (helicopter flight) =================
export function buildValley() {
  const S = new THREE.Scene(); S.background = new THREE.Color('#050812'); S.fog = new THREE.Fog('#1a2640', 120, 620);
  skyDome(S, '#03050c', '#0c1630', '#34466e'); stars(S, 1800);
  const geo = new THREE.PlaneGeometry(900, 3000, 150, 400); geo.rotateX(-Math.PI / 2);
  const pa = geo.attributes.position; for (let i = 0; i < pa.count; i++) { const x = pa.getX(i), z = pa.getZ(i); const ridge = Math.max(0, Math.abs(x) - 70) * .22; const h = ridge + Math.sin(x * .03 + z * .011) * 6 + Math.sin(z * .025 - x * .02) * 5 + Math.sin(x * .09) * Math.cos(z * .07) * 2; pa.setY(i, Math.max(-2, h)); }
  geo.computeVertexNormals();
  const terr = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: '#2a3426', flatShading: true, roughness: 1 })); terr.position.z = -1200; S.add(terr);
  // scattered village lights on the valley floor
  const lp = [], lc = []; for (let i = 0; i < 900; i++) { const x = (hash(i * 3.3) - .5) * 150, z = -hash(i * 7.1) * 2800 + 200; if (hash(Math.floor(z / 90) + 3) < .45) continue; lp.push(x, 1.2, z); lc.push(1, .78 + hash(i) * .15, .45); }
  const lg = new THREE.BufferGeometry(); lg.setAttribute('position', new THREE.Float32BufferAttribute(lp, 3)); lg.setAttribute('color', new THREE.Float32BufferAttribute(lc, 3));
  S.add(new THREE.Points(lg, new THREE.PointsMaterial({ size: 3, sizeAttenuation: false, vertexColors: true, toneMapped: false })));
  const mtM = new THREE.MeshStandardMaterial({ color: '#10141e', flatShading: true });
  for (let i = 0; i < 30; i++) { const r = 90 + hash(i) * 80, h = 90 + hash(i + 3) * 110, s = i % 2 ? 1 : -1; const m = new THREE.Mesh(new THREE.ConeGeometry(r, h, 6), mtM); m.position.set(s * (220 + hash(i + 5) * 120), h / 2 - 5, -i * 100 + 100); S.add(m); }
  S.add(new THREE.HemisphereLight('#7a8ad0', '#10121a', 1.2));
  const dl = new THREE.DirectionalLight('#8090c8', 1.0); dl.position.set(40, 80, 30); S.add(dl);
  const h1 = heli(S), h2 = heli(S);
  return { scene: S, chars: {}, h1, h2, update() { } };
}

// ================= HELICOPTER CABIN (SEALs in transit) =================
export function buildCabin() {
  const S = new THREE.Scene(); S.background = new THREE.Color('#020306');
  const inT = face('#2c3036', (c, W, H) => { for (let i = 0; i < 8; i++) sline(c, i * W / 8, 0, i * W / 8, H, 3, 'rgba(0,0,0,.4)'); for (let i = 0; i < 30; i++) { c.fillStyle = 'rgba(200,200,200,.25)'; c.beginPath(); c.arc(hash(i) * W, hash(i + 4) * H, 3, 0, 7); c.fill(); } grain(c, W, H, .08); }, { w: 512, h: 256 });
  const back = plane(9, 3.2, mat(inT)); back.position.set(0, 1.6, -1.4); S.add(back);
  const floor = plane(9, 4, mat(face('#202328', (c, W, H) => { for (let i = 0; i < 12; i++) sline(c, 0, i * H / 12, W, i * H / 12, 3, 'rgba(0,0,0,.4)'); }, { w: 256, h: 256 }))); floor.rotation.x = -Math.PI / 2; floor.position.set(0, 0, .6); S.add(floor);
  const ceil = plane(9, 4, mat(inT)); ceil.rotation.x = Math.PI / 2; ceil.position.set(0, 3.2, .6); S.add(ceil);
  const leftW = plane(4, 3.2, mat(inT)); leftW.rotation.y = Math.PI / 2; leftW.position.set(-4.5, 1.6, .6); S.add(leftW);
  const bench = ibox(8, .25, .8, { color: '#5a4a3a' }); bench.position.set(0, .38, -.95); S.add(bench);
  // open door on right: night ground streaming past (physics: moving backward relative to us)
  const outT = tex(512, 512, (c, W) => { c.fillStyle = '#121a14'; c.fillRect(0, 0, W, W); for (let i = 0; i < 80; i++) { c.fillStyle = `rgba(40,60,36,${.4 + hash(i) * .5})`; c.fillRect(hash(i) * W, hash(i + 2) * W, 40 + hash(i + 3) * 90, 20 + hash(i + 5) * 50); } for (let i = 0; i < 26; i++) { c.fillStyle = '#ffcf80'; c.fillRect(hash(i + 50) * W, hash(i + 70) * W, 3, 3); } }, [2, 2]);
  const ground = plane(60, 60, basic(outT)); ground.rotation.x = -Math.PI / 2; ground.position.set(20, -30, 0); S.add(ground);
  const doorFrame = ibox(.2, 3.2, .2, { color: '#1a1c20' }); doorFrame.position.set(4.4, 1.6, 1.6); S.add(doorFrame);
  const red = new THREE.PointLight('#ff3a2a', 3.2, 9, 1.3); red.position.set(0, 2.9, .8); S.add(red);
  const rg = glowSprite('#ff3a2a', .25, .7); rg.position.set(-1.5, 3.1, -.6); S.add(rg); const rg2 = glowSprite('#ff3a2a', .25, .7); rg2.position.set(1.8, 3.1, -.6); S.add(rg2);
  S.add(new THREE.HemisphereLight('#8a9ac0', '#101010', .8));
  const chars = {}; for (let i = 0; i < 5; i++) chars['s' + i] = new Char(S, SEAL(i + 10, { nvgDown: false, arms: 'rifle', expr: i % 2 ? 'suspicious' : 'neutral' }));
  return { scene: S, chars, outT, update(t) { outT.offset.x = (t * .9) % 1; } };
}

// ================= MAP: PAKISTAN / AFGHANISTAN =================
const PKP = [[61.6, 25.2], [63.3, 25.2], [64.6, 25.3], [66.6, 25.4], [67.0, 24.8], [67.5, 23.9], [68.2, 23.7], [68.8, 24.3], [70.0, 24.2], [70.8, 25.2], [70.3, 25.7], [70.0, 26.5], [69.5, 27.0], [70.5, 28.0], [71.9, 27.9], [72.8, 28.9], [73.4, 29.9], [74.5, 30.9], [74.6, 31.8], [75.3, 32.3], [74.6, 33.0], [74.1, 34.0], [73.9, 34.6], [74.5, 35.3], [75.8, 36.0], [75.0, 37.0], [74.0, 36.8], [72.6, 36.8], [71.2, 36.1], [71.6, 35.2], [71.1, 34.5], [70.0, 34.0], [69.9, 33.1], [69.5, 33.0], [69.2, 32.5], [69.3, 31.9], [68.6, 31.7], [67.8, 31.5], [66.9, 31.3], [66.4, 30.0], [66.2, 29.8], [64.3, 29.5], [62.5, 29.4], [60.9, 29.8], [61.8, 28.6], [62.8, 28.2], [62.8, 27.2], [63.3, 26.7], [61.9, 26.2]];
const AFP = [[60.9, 29.8], [62.5, 29.4], [64.3, 29.5], [66.2, 29.8], [66.4, 30.0], [66.9, 31.3], [67.8, 31.5], [68.6, 31.7], [69.3, 31.9], [69.2, 32.5], [69.5, 33.0], [69.9, 33.1], [70.0, 34.0], [71.1, 34.5], [71.6, 35.2], [71.2, 36.1], [72.6, 36.8], [74.0, 36.8], [74.9, 37.2], [73.0, 37.4], [71.6, 37.9], [70.8, 38.4], [70.0, 37.6], [69.3, 37.1], [67.8, 37.2], [66.5, 37.4], [65.6, 37.3], [64.7, 37.1], [63.0, 35.9], [62.2, 35.3], [61.1, 35.6], [60.9, 34.4], [60.5, 33.7], [60.9, 33.0], [60.6, 31.5], [61.7, 31.4], [61.8, 30.8]];
const BORDER = AFP.slice(0, 18);
export function buildMapPK() {
  const S = new THREE.Scene(); S.background = new THREE.Color('#05070c'); S.fog = new THREE.Fog('#05070c', 10, 24);
  const tT = tex(512, 512, (c, W) => { c.fillStyle = '#122038'; c.fillRect(0, 0, W, W); for (let i = 0; i <= 16; i++) { sline(c, i * 32, 0, i * 32, W, 2, 'rgba(120,170,220,.15)'); sline(c, 0, i * 32, W, i * 32, 2, 'rgba(120,170,220,.15)'); } }, [4, 4]);
  const tb = plane(24, 24, mat(tT, { emis: .3 })); tb.rotation.x = -Math.PI / 2; S.add(tb);
  const sc = .62, cx = 68.5, cy = 31.0; const P = (lon, lat) => new THREE.Vector2((lon - cx) * sc * .86, -(lat - cy) * sc);
  const land = (pts, col, h) => { const shp = new THREE.Shape(pts.map(p => P(p[0], p[1]))); const geo = new THREE.ExtrudeGeometry(shp, { depth: h, bevelEnabled: false }); geo.rotateX(Math.PI / 2); geo.translate(0, h, 0);
    const lt = tex(512, 512, (c, W) => { c.fillStyle = col; c.fillRect(0, 0, W, W); grain(c, W, W, .08, 6000); }); const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ map: lt, roughness: .85 })); S.add(m); S.add(new THREE.LineSegments(new THREE.EdgesGeometry(geo, 30), new THREE.LineBasicMaterial({ color: '#2a1a12' }))); return m; };
  land(PKP, '#e8dcc0', .14); land(AFP, '#a89c86', .08);
  const label = (txt, x, z, s, col = 'rgba(40,30,20,.75)', rot = 0) => { const t = tex(1024, 160, (c, W, H) => { c.font = '800 110px Montserrat'; c.fillStyle = col; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(txt, W / 2, H / 2); }); const m = plane(s, s * .156, new THREE.MeshBasicMaterial({ map: t, transparent: true, depthWrite: false })); m.rotation.x = -Math.PI / 2; m.rotation.z = rot; m.position.set(x, .2, z); S.add(m); return m; };
  const p1 = P(69.2, 29.2); label('PAKISTAN', p1.x, p1.y, 3.4, 'rgba(60,40,24,.55)', .25);
  const p2 = P(65.5, 33.6); label('AFGHANISTAN', p2.x, p2.y, 3.2, 'rgba(40,30,20,.5)');
  const p3 = P(64.5, 23.6); label('ARABIAN SEA', p3.x, p3.y, 2.4, 'rgba(160,200,240,.55)');
  // border (Durand line) highlight
  const bpts = BORDER.map(p => { const v = P(p[0], p[1]); return new THREE.Vector3(v.x, .2, v.y); });
  const bcurve = new THREE.CatmullRomCurve3(bpts); const border = new THREE.Mesh(new THREE.TubeGeometry(bcurve, 200, .035, 6), new THREE.MeshBasicMaterial({ color: '#ff3a2a', transparent: true, opacity: 0, toneMapped: false })); S.add(border);
  const pin = (lon, lat, col, name, big) => { const p = P(lon, lat); const g = new THREE.Group(); g.position.set(p.x, .16, p.y); S.add(g);
    const dot = new THREE.Mesh(new THREE.CylinderGeometry(big ? .09 : .06, big ? .09 : .06, .03, 20), new THREE.MeshStandardMaterial({ color: col, emissive: col, emissiveIntensity: 0 })); g.add(dot);
    const glow = glowSprite(col, big ? 1.1 : .6, 0); glow.position.y = .05; g.add(glow);
    const ring = new THREE.Mesh(new THREE.RingGeometry(.1, .14, 32), new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0, side: THREE.DoubleSide, toneMapped: false })); ring.rotation.x = -Math.PI / 2; ring.position.y = .02; g.add(ring);
    const lt = tex(512, 96, (c) => { c.font = `800 ${big ? 60 : 48}px Montserrat`; c.lineWidth = 10; c.strokeStyle = '#000'; c.fillStyle = '#fff'; c.strokeText(name, 10, 64); c.fillText(name, 10, 64); });
    const lab = new THREE.Sprite(new THREE.SpriteMaterial({ map: lt, transparent: true, depthWrite: false, depthTest: false, opacity: 0 })); lab.center.set(0, .5); lab.scale.set(big ? 1.7 : 1.3, big ? .32 : .25, 1); lab.position.set(.12, .3, 0); g.add(lab);
    return { g, dot, glow, ring, lab }; };
  const abb = pin(73.22, 34.17, '#ff2a1a', 'Abbottabad', true);
  const isb = pin(73.05, 33.68, '#ffffff', 'Islamabad', false);
  const jal = pin(70.45, 34.43, '#4aa8ff', 'Jalalabad', false);
  // route Jalalabad -> Abbottabad (dashes revealed over time) + helicopter icon
  const A = P(70.45, 34.43), B = P(73.22, 34.17); const ctrl = P(71.9, 34.75);
  const qp = u => new THREE.Vector3((1 - u) * (1 - u) * A.x + 2 * (1 - u) * u * ctrl.x + u * u * B.x, .24, (1 - u) * (1 - u) * A.y + 2 * (1 - u) * u * ctrl.y + u * u * B.y);
  const dashes = []; for (let k = 0; k < 26; k++) { const u = (k + .5) / 26; const d = new THREE.Mesh(new THREE.BoxGeometry(.12, .02, .045), new THREE.MeshBasicMaterial({ color: '#ffd23f', toneMapped: false })); d.position.copy(qp(u)); const nx = qp(Math.min(1, u + .01)); d.lookAt(nx); d.rotateY(Math.PI / 2); d.visible = false; S.add(d); dashes.push(d); }
  const hiT = tex(128, 128, (c) => { c.translate(64, 64); c.fillStyle = '#ffd23f'; c.strokeStyle = '#000'; c.lineWidth = 6; c.beginPath(); c.roundRect(-12, -34, 24, 50, 10); c.fill(); c.stroke(); c.fillRect(-3, 10, 6, 44); c.strokeRect(-3, 10, 6, 44); c.beginPath(); c.moveTo(-50, -14); c.lineTo(50, -14); c.moveTo(0, -60); c.lineTo(0, 30); c.lineWidth = 7; c.stroke(); });
  const hic = new THREE.Mesh(new THREE.PlaneGeometry(.5, .5), new THREE.MeshBasicMaterial({ map: hiT, transparent: true, depthWrite: false, toneMapped: false })); hic.rotation.x = -Math.PI / 2; hic.position.y = .3; hic.visible = false; S.add(hic);
  const airT = tex(1024, 140, (c, W, H) => { c.fillStyle = 'rgba(160,16,16,.92)'; c.beginPath(); c.roundRect(6, 6, W - 12, H - 12, 30); c.fill(); c.lineWidth = 6; c.strokeStyle = '#fff'; c.stroke(); c.fillStyle = '#fff'; c.font = '800 66px Montserrat'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('PAKISTANI AIRSPACE', W / 2, H / 2 + 4); });
  const air = new THREE.Sprite(new THREE.SpriteMaterial({ map: airT, transparent: true, depthTest: false, opacity: 0, toneMapped: false })); air.scale.set(2.2, .3, 1); const bm = P(70.6, 33.2); air.position.set(bm.x + .9, .8, bm.y + .5); S.add(air);
  const spot = new THREE.SpotLight('#ffe6c8', 60, 20, .6, .5, 1.2); spot.position.set(1, 9, 3); spot.target.position.set(1.5, 0, -1.5); S.add(spot, spot.target);
  S.add(new THREE.HemisphereLight('#6a7aa0', '#100808', .55));
  return { scene: S, chars: {}, P, abb, isb, jal, dashes, hic, qp, border, air, update() { } };
}

// ================= DESK / EVIDENCE WALL (poster, calendar, string board, stamp, stopwatch, years) =================
function portrait(c, x, y, w, h) {
  const cv = document.createElement('canvas'); cv.width = 768; cv.height = 1024; drawChar(cv.getContext('2d'), { ...OBL, expr: 'neutral', t: 0 });
  c.drawImage(cv, 384 - 230, 0, 460, 560, x, y, w, h);
}
export function buildDesk() {
  const S = new THREE.Scene(); S.background = new THREE.Color('#0e0b09');
  const wallT = tex(512, 256, (c, W, H) => { c.fillStyle = '#4a3c30'; c.fillRect(0, 0, W, H); for (let i = 0; i < 16; i++) sline(c, i * 32, 0, i * 32, H, 2, 'rgba(0,0,0,.18)'); grain(c, W, H, .07); }, [16, 2]);
  const wall = plane(140, 8, mat(wallT)); wall.position.set(50, 3, -1.2); S.add(wall);
  const cork = (x, w, h, y = 2.0) => { const fr = ibox(w + .3, h + .3, .12, { color: '#5a3a22' }); fr.position.set(x, y, -1.12); S.add(fr); const ck = plane(w, h, mat(tex(256, 256, (c, W) => { c.fillStyle = '#b88a58'; c.fillRect(0, 0, W, W); grain(c, W, W, .18, 6000); }, [2, 2]))); ck.position.set(x, y, -1.05); S.add(ck); };
  // --- station 0: WANTED poster
  cork(0, 5, 3.6);
  const posterT = tex(512, 700, (c, W, H) => { c.fillStyle = '#efe4c8'; c.fillRect(0, 0, W, H); grain(c, W, H, .1, 4000); c.fillStyle = '#1d1a1a'; c.font = '900 120px Montserrat'; c.textAlign = 'center'; c.fillText('WANTED', W / 2, 130); c.fillStyle = '#efe4c8'; c.fillRect(56, 160, W - 112, 330); portrait(c, 56, 160, W - 112, 330); c.lineWidth = 6; c.strokeStyle = '#1d1a1a'; c.strokeRect(56, 160, W - 112, 330); c.fillStyle = '#8a1f1f'; c.font = '800 44px Montserrat'; c.fillText('$25,000,000', W / 2, 560); c.fillStyle = '#1d1a1a'; c.font = '800 34px Montserrat'; c.fillText('REWARD', W / 2, 605); c.font = '700 22px Montserrat'; c.fillText('FBI MOST WANTED', W / 2, 655); c.lineWidth = 10; c.strokeRect(5, 5, W - 10, H - 10); });
  const posterG = new THREE.Group(); posterG.position.set(0, 3.55, -1.0); S.add(posterG);
  const poster = plane(1.9, 2.6, mat(posterT, { emis: .12 })); poster.position.y = -1.3; poster.position.z = .02; posterG.add(poster);
  const pinM = new THREE.Mesh(new THREE.SphereGeometry(.06, 12, 8), new THREE.MeshStandardMaterial({ color: '#c8102e' })); pinM.position.set(0, -.1, .08); posterG.add(pinM);
  const tgtT = tex(256, 256, (c, W) => { c.strokeStyle = '#ff2a2a'; c.lineWidth = 10; c.beginPath(); c.arc(128, 128, 90, 0, 7); c.stroke(); c.beginPath(); c.arc(128, 128, 40, 0, 7); c.stroke(); for (const [a, b, d, e] of [[128, 8, 128, 70], [128, 186, 128, 248], [8, 128, 70, 128], [186, 128, 248, 128]]) { c.beginPath(); c.moveTo(a, b); c.lineTo(d, e); c.stroke(); } });
  const tgt = plane(1.6, 1.6, new THREE.MeshBasicMaterial({ map: tgtT, transparent: true, depthWrite: false, toneMapped: false, opacity: 0 })); tgt.position.set(0, -1.05, .06); posterG.add(tgt);
  const decT = tex(512, 160, (c, W, H) => { c.save(); c.translate(W / 2, H / 2); c.strokeStyle = '#d01818'; c.lineWidth = 14; c.strokeRect(-236, -66, 472, 132); c.fillStyle = '#d01818'; c.font = '900 92px Montserrat'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('DECEASED', 0, 6); c.restore(); });
  const dec = plane(1.8, .56, new THREE.MeshBasicMaterial({ map: decT, transparent: true, depthWrite: false, opacity: 0 })); dec.position.set(0, -1.1, .07); dec.rotation.z = .2; posterG.add(dec);
  // tally marks of years around poster
  // --- station 20: calendar MAY 1 2011
  const calT = tex(512, 700, (c, W, H) => { c.fillStyle = '#f3ecd8'; c.fillRect(0, 0, W, H); c.fillStyle = '#8a1f1f'; c.fillRect(0, 0, W, 170); c.fillStyle = '#fff'; c.font = 'bold 74px "DejaVu Sans"'; c.textAlign = 'center'; c.fillText('MAY', W / 2, 100); c.font = 'bold 40px "DejaVu Sans"'; c.fillText('2011', W / 2, 150); c.fillStyle = '#1d1a1a'; c.font = 'bold 330px "DejaVu Sans"'; c.fillText('1', W / 2, 510); c.font = 'bold 44px "DejaVu Sans"'; c.fillStyle = '#8a1f1f'; c.fillText('SUNDAY', W / 2, 610); c.lineWidth = 8; c.strokeStyle = OUT; c.strokeRect(4, 4, W - 8, H - 8); });
  const cal = plane(.5, .68, mat(calT, { emis: .15 })); cal.position.set(20, 1.75, -1.1); S.add(cal);
  const pageT = tex(256, 350, (c, W, H) => { c.fillStyle = '#f3ecd8'; c.fillRect(0, 0, W, H); c.fillStyle = '#8a1f1f'; c.fillRect(0, 0, W, 60); c.fillStyle = '#fff'; c.font = 'bold 40px "DejaVu Sans"'; c.textAlign = 'center'; c.fillText('APRIL', W / 2, 45); c.fillStyle = '#1d1a1a'; c.font = 'bold 150px "DejaVu Sans"'; c.fillText('30', W / 2, 250); c.lineWidth = 5; c.strokeStyle = OUT; c.strokeRect(2, 2, W - 4, H - 4); });
  const pgG = new THREE.PlaneGeometry(.5, .68); pgG.translate(0, -.34, 0); const page = new THREE.Mesh(pgG, new THREE.MeshStandardMaterial({ map: pageT, side: THREE.DoubleSide })); page.position.set(20, 1.75 + .34, -1.08); S.add(page);
  // --- station 40: string board (courier trail)
  cork(40, 8, 4.2, 2.2);
  const icons = ['courier', 'phone', 'car', 'courier2', 'pin', 'compound'];
  const photoPos = [[-3.2, 1.0], [-1.4, -.7], [.2, 1.1], [1.6, -.6], [2.6, 1.0], [3.1, -.9]];
  const photos = photoPos.map(([x, y], i) => { const t = tex(256, 300, (c, W, H) => { c.fillStyle = '#f6f2e8'; c.fillRect(0, 0, W, H); c.fillStyle = i === 5 ? '#c8b890' : '#2a2a30'; c.fillRect(16, 16, W - 32, 210); c.save(); c.translate(W / 2, 120);
      if (icons[i].startsWith('courier')) { c.fillStyle = '#8a8a8a'; c.beginPath(); c.arc(0, -30, 40, 0, 7); c.fill(); c.beginPath(); c.ellipse(0, 70, 70, 60, 0, Math.PI, 0); c.fill(); c.fillStyle = '#fff'; c.font = 'bold 70px Montserrat'; c.textAlign = 'center'; c.fillText('?', 0, -6); }
      if (icons[i] === 'phone') { c.fillStyle = '#9ab'; c.fillRect(-30, -60, 60, 110); c.fillStyle = '#2a2a30'; c.fillRect(-22, -48, 44, 74); }
      if (icons[i] === 'car') { c.fillStyle = '#eee'; c.fillRect(-80, -10, 160, 40); c.fillRect(-50, -40, 90, 32); c.fillStyle = '#111'; c.beginPath(); c.arc(-45, 32, 16, 0, 7); c.arc(45, 32, 16, 0, 7); c.fill(); }
      if (icons[i] === 'pin') { c.fillStyle = '#d62828'; c.beginPath(); c.arc(0, -20, 34, Math.PI, 0); c.lineTo(0, 50); c.closePath(); c.fill(); c.fillStyle = '#fff'; c.beginPath(); c.arc(0, -20, 13, 0, 7); c.fill(); }
      if (icons[i] === 'compound') { c.fillStyle = '#efe8d8'; c.fillRect(-60, -30, 90, 70); c.fillRect(-40, -60, 45, 30); c.strokeStyle = '#3a3020'; c.lineWidth = 6; c.strokeRect(-90, -80, 180, 150); c.strokeStyle = '#d01818'; c.lineWidth = 8; c.beginPath(); c.arc(0, 0, 95, 0, 7); c.stroke(); }
      c.restore(); c.fillStyle = '#2a2a2a'; c.font = 'bold 30px "DejaVu Sans"'; c.textAlign = 'center'; c.fillText(['COURIER', 'CALLS', 'VEHICLE', 'CONTACT', 'ABBOTTABAD', 'TARGET?'][i], W / 2, 272); });
    const m = plane(.85, 1.0, mat(t, { emis: .12 })); m.position.set(40 + x, 2.2 + y, -1.0 + i * .002); m.rotation.z = (hash(i) - .5) * .18; S.add(m);
    const pn = new THREE.Mesh(new THREE.SphereGeometry(.05, 10, 8), new THREE.MeshStandardMaterial({ color: '#c8102e' })); pn.position.set(40 + x, 2.2 + y + .42, -.93); S.add(pn); return pn.position.clone(); });
  const strings = []; for (let i = 0; i < photos.length - 1; i++) { const a = photos[i], b = photos[i + 1]; const L = a.distanceTo(b); const cyl = new THREE.Mesh(new THREE.CylinderGeometry(.014, .014, 1, 6), new THREE.MeshBasicMaterial({ color: '#d01818', toneMapped: false })); cyl.geometry.translate(0, .5, 0); cyl.position.copy(a); cyl.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize()); cyl.userData.L = L; S.add(cyl); strings.push(cyl); }
  // --- station 60: folder + stamp
  const tbl = ibox(3.2, .1, 1.8, { color: '#5a3a24', top: tex(256, 256, (c, W) => { c.fillStyle = '#5a3a24'; c.fillRect(0, 0, W, W); for (let i = 0; i < 10; i++) sline(c, 0, i * 26, W, i * 26 + 8, 3, 'rgba(30,15,6,.4)'); grain(c, W, W, .06); }) }); tbl.position.set(60, .75, 0); S.add(tbl);
  const fT = tex(512, 680, (c, W, H) => { c.fillStyle = '#d6b07a'; c.fillRect(0, 0, W, H); c.fillStyle = '#3a2a1a'; c.font = '800 46px Montserrat'; c.textAlign = 'center'; c.fillText('OPERATION', W / 2, 150); c.font = '900 56px Montserrat'; c.fillText('NEPTUNE SPEAR', W / 2, 220); c.save(); c.translate(W / 2, 330); c.rotate(-.12); c.strokeStyle = '#8a1f1f'; c.lineWidth = 8; c.strokeRect(-170, -40, 340, 80); c.fillStyle = '#8a1f1f'; c.font = '800 46px Montserrat'; c.fillText('TOP SECRET', 0, 16); c.restore(); c.lineWidth = 6; c.strokeStyle = OUT; c.strokeRect(3, 3, W - 6, H - 6); });
  const folder = plane(.75, 1.0, mat(fT, { emis: .1 })); folder.rotation.x = -Math.PI / 2; folder.rotation.z = .05; folder.position.set(60, .805, 0); S.add(folder);
  const apT = tex(512, 180, (c, W, H) => { c.translate(W / 2, H / 2); c.strokeStyle = '#1f8a3a'; c.lineWidth = 14; c.strokeRect(-230, -70, 460, 140); c.fillStyle = '#1f8a3a'; c.font = '900 76px Montserrat'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('APPROVED', 0, 6); });
  const approved = plane(.62, .22, new THREE.MeshBasicMaterial({ map: apT, transparent: true, depthWrite: false, opacity: 0 })); approved.rotation.x = -Math.PI / 2; approved.rotation.z = .18; approved.position.set(60.02, .812, .22); S.add(approved);
  const stamp = new THREE.Group(); S.add(stamp);
  const sb = ibox(.36, .1, .16, { color: '#2a2a2a' }); sb.position.y = .05; stamp.add(sb); const sneck = new THREE.Mesh(new THREE.CylinderGeometry(.04, .05, .18, 12), new THREE.MeshStandardMaterial({ color: '#3a2a1a' })); sneck.position.y = .19; stamp.add(sneck); const sk = new THREE.Mesh(new THREE.SphereGeometry(.08, 16, 12), new THREE.MeshStandardMaterial({ color: '#8a1f1f' })); sk.position.y = .32; stamp.add(sk);
  // --- station 80: stopwatch
  const swT = tex(512, 512, () => { });
  swT.userData.draw = (min) => { const c = swT.userData.canvas.getContext('2d'), W = 512; c.clearRect(0, 0, W, W); c.fillStyle = '#f4efe2'; c.beginPath(); c.arc(256, 256, 236, 0, 7); c.fill(); c.lineWidth = 16; c.strokeStyle = OUT; c.stroke();
    c.fillStyle = 'rgba(214,40,40,.85)'; c.beginPath(); c.moveTo(256, 256); c.arc(256, 256, 200, -Math.PI / 2, -Math.PI / 2 + min / 60 * Math.PI * 2); c.closePath(); c.fill();
    for (let i = 0; i < 60; i++) { const a = i / 60 * Math.PI * 2 - Math.PI / 2, r1 = i % 5 ? 200 : 180; sline(c, 256 + Math.cos(a) * r1, 256 + Math.sin(a) * r1, 256 + Math.cos(a) * 214, 256 + Math.sin(a) * 214, i % 5 ? 4 : 8, '#2a1a12'); }
    c.fillStyle = '#2a1a12'; c.font = 'bold 40px "DejaVu Sans"'; c.textAlign = 'center'; c.textBaseline = 'middle'; for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2 - Math.PI / 2; c.fillText(String(i * 5), 256 + Math.cos(a) * 146, 256 + Math.sin(a) * 146); }
    const a = min / 60 * Math.PI * 2 - Math.PI / 2; sline(c, 256, 256, 256 + Math.cos(a) * 190, 256 + Math.sin(a) * 190, 10, '#111'); c.fillStyle = '#111'; c.beginPath(); c.arc(256, 256, 16, 0, 7); c.fill();
    c.fillStyle = '#d01818'; c.font = '800 34px Montserrat'; c.fillText('MIN', 256, 340); swT.needsUpdate = true; };
  swT.userData.draw(0);
  const sw = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, .3, 48), [new THREE.MeshStandardMaterial({ color: '#b8b8b8', metalness: .6, roughness: .3 }), new THREE.MeshStandardMaterial({ map: swT, emissive: 0xffffff, emissiveMap: swT, emissiveIntensity: .25 }), new THREE.MeshStandardMaterial({ color: '#888' })]); sw.rotation.x = Math.PI / 2; sw.position.set(80, 2.0, -.7); S.add(sw);
  const crown = new THREE.Mesh(new THREE.CylinderGeometry(.14, .14, .3, 16), new THREE.MeshStandardMaterial({ color: '#b8b8b8', metalness: .6, roughness: .3 })); crown.position.set(80, 3.12, -.7); S.add(crown);
  // --- station 100: years counter
  const yrT = tex(1024, 512, () => { });
  yrT.userData.draw = (y, flip) => { const c = yrT.userData.canvas.getContext('2d'), W = 1024, H = 512; c.fillStyle = '#0d0d10'; c.fillRect(0, 0, W, H); const s = String(y);
    for (let i = 0; i < 4; i++) { const x = 70 + i * 225; c.fillStyle = '#1f1f24'; c.beginPath(); c.roundRect(x, 60, 200, 300, 22); c.fill(); c.lineWidth = 6; c.strokeStyle = '#000'; c.stroke(); c.fillStyle = i === 3 && flip > 0 ? `rgba(242,227,196,${1 - flip * .6})` : '#f2e3c4'; c.font = '900 230px Montserrat'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(s[i], x + 100, 218); c.fillStyle = '#000'; c.fillRect(x, 207, 200, 6); }
    c.fillStyle = '#ffd23f'; c.font = '800 54px Montserrat'; c.textAlign = 'center'; c.fillText('SEP 2001  →  MAY 2011', W / 2, 445); yrT.needsUpdate = true; };
  yrT.userData.draw(2001, 0);
  const yr = plane(2.4, 1.2, new THREE.MeshBasicMaterial({ map: yrT, toneMapped: false })); yr.position.set(100, 2.1, -1.0); S.add(yr);
  // light
  S.add(new THREE.HemisphereLight('#ffe8c8', '#2a1a10', .75));
  for (const x of [0, 20, 40, 60, 80, 100]) { const k = new THREE.PointLight('#ffd9a0', 7, 9, 1.3); k.position.set(x + .6, 3.6, 2.2); S.add(k); }
  const flick = new THREE.PointLight('#ffe0b0', 6, 7, 1.3); flick.position.set(-1, 4.2, 1.5); S.add(flick);
  return { scene: S, chars: {}, posterG, poster, tgt, dec, page, strings, approved, stamp, swT, yrT, flick, update(t) { } };
}

// ================= INTEL ROOM + SITUATION ROOM =================
export function buildIntel() {
  const S = new THREE.Scene(); S.background = new THREE.Color('#04060c');
  const fl = plane(120, 30, mat(tex(64, 64, (c, W) => { c.fillStyle = '#10141e'; c.fillRect(0, 0, W, W); }))); fl.rotation.x = -Math.PI / 2; fl.position.x = 20; S.add(fl);
  const scrT = tex(1024, 512, () => { });
  const drawScr = (c, W, H, t, mode) => {
    const red = mode === 'alert', grn = mode === 'feed' || mode === 'id';
    c.fillStyle = grn ? '#04140a' : '#06142a'; c.fillRect(0, 0, W, H);
    c.strokeStyle = grn ? 'rgba(90,255,120,.16)' : 'rgba(80,180,255,.2)'; c.lineWidth = 2; for (let i = 0; i < 32; i++) { c.beginPath(); c.moveTo(i * 32, 0); c.lineTo(i * 32, H); c.stroke(); } for (let i = 0; i < 16; i++) { c.beginPath(); c.moveTo(0, i * 32); c.lineTo(W, i * 32); c.stroke(); }
    if (mode === 'search' || mode === 'net') {
      c.fillStyle = 'rgba(90,190,255,.3)'; c.beginPath(); const pts = [[300, 120], [420, 90], [560, 110], [640, 170], [700, 260], [650, 330], [560, 400], [430, 420], [360, 360], [300, 260]]; c.moveTo(...pts[0]); pts.forEach(p => c.lineTo(...p)); c.closePath(); c.fill();
      const a = t * 2.2; c.save(); c.translate(500, 260); const g = c.createConicGradient ? c.createConicGradient(a, 0, 0) : null; if (g) { g.addColorStop(0, 'rgba(120,220,255,.55)'); g.addColorStop(.12, 'rgba(120,220,255,0)'); g.addColorStop(1, 'rgba(120,220,255,0)'); c.fillStyle = g; c.beginPath(); c.arc(0, 0, 230, 0, 7); c.fill(); } c.strokeStyle = 'rgba(120,220,255,.6)'; c.lineWidth = 3; for (const r of [80, 160, 230]) { c.beginPath(); c.arc(0, 0, r, 0, 7); c.stroke(); } c.restore();
      if (mode === 'search') { c.fillStyle = '#fff'; c.font = '900 180px Montserrat'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.globalAlpha = .6 + .4 * Math.sin(t * 5); c.fillText('?', 500, 260); c.globalAlpha = 1; c.fillStyle = 'rgba(6,20,42,.9)'; c.fillRect(640, 30, 360, 70); c.strokeStyle = '#6ad0ff'; c.strokeRect(640, 30, 360, 70); c.fillStyle = '#9ae6ff'; c.font = 'bold 30px "DejaVu Sans Mono"'; c.textAlign = 'left'; c.fillText('LOCATION: ????', 660, 76); }
      c.textAlign = 'left'; c.textBaseline = 'alphabetic';
    }
    if (mode === 'feed') { // night-vision overhead feed of the compound
      c.save(); c.translate(W / 2, H / 2); c.rotate(.15); c.fillStyle = 'rgba(120,255,140,.18)'; c.fillRect(-260, -190, 520, 380); c.strokeStyle = '#7dff8a'; c.lineWidth = 6; c.beginPath(); c.moveTo(-240, -170); c.lineTo(230, -170); c.lineTo(260, 120); c.lineTo(20, 190); c.lineTo(-250, 110); c.closePath(); c.stroke(); c.fillStyle = 'rgba(160,255,170,.45)'; c.fillRect(-140, -110, 180, 120); c.fillRect(110, -40, 80, 60); c.restore();
      c.strokeStyle = '#7dff8a'; c.lineWidth = 3; c.beginPath(); c.arc(W / 2 - 20, H / 2 - 10, 60 + Math.sin(t * 6) * 6, 0, 7); c.stroke(); c.beginPath(); c.moveTo(W / 2 - 110, H / 2 - 10); c.lineTo(W / 2 + 70, H / 2 - 10); c.moveTo(W / 2 - 20, H / 2 - 100); c.lineTo(W / 2 - 20, H / 2 + 80); c.stroke();
      c.fillStyle = '#7dff8a'; c.font = 'bold 28px "DejaVu Sans Mono"'; c.fillText('● LIVE  01:05:12', 30, 50); c.fillText('ABBOTTABAD', 30, H - 30);
      for (let i = 0; i < 400; i++) { c.fillStyle = `rgba(160,255,170,${hash(i + Math.floor(t * 20) * 13) * .25})`; c.fillRect(hash(i * 3 + Math.floor(t * 20)) * W, hash(i * 5 + Math.floor(t * 20)) * H, 3, 3); }
    }
    if (mode === 'id') {
      for (let i = 0; i < 26; i++) { const y = 40 + i * 17; const ph = t * 3 + i * .5; c.fillStyle = '#7dff8a'; c.beginPath(); c.arc(260 + Math.sin(ph) * 40, y, 6, 0, 7); c.fill(); c.fillStyle = '#4ad0ff'; c.beginPath(); c.arc(260 - Math.sin(ph) * 40, y, 6, 0, 7); c.fill(); c.strokeStyle = 'rgba(200,255,210,.5)'; c.lineWidth = 2; c.beginPath(); c.moveTo(260 + Math.sin(ph) * 40, y); c.lineTo(260 - Math.sin(ph) * 40, y); c.stroke(); }
      const k = Math.min(1, t * .9 % 100); for (let r = 0; r < 6; r++) for (let q = 0; q < 8; q++) { c.fillStyle = hash(r * 14 + q) > .4 ? '#7dff8a' : 'rgba(125,255,138,.25)'; c.fillRect(330 + q * 46, 70 + r * 34, 38, 22); }
      c.fillStyle = 'rgba(10,60,20,.94)'; c.fillRect(322, 290, 380, 170); c.strokeStyle = '#7dff8a'; c.lineWidth = 6; c.strokeRect(322, 290, 380, 170); c.fillStyle = '#c8ffd0'; c.font = '900 50px Montserrat'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('IDENTITY', 512, 335); c.fillText('CONFIRMED', 512, 385); c.font = '700 30px Montserrat'; c.fillText('DNA MATCH  ✓', 512, 432); c.textAlign = 'left'; c.textBaseline = 'alphabetic';
    }
  };
  scrT.userData.draw = (t, mode) => { const c = scrT.userData.canvas.getContext('2d'); drawScr(c, 1024, 512, t, mode); scrT.needsUpdate = true; };
  scrT.userData.draw(0, 'net');
  const wall = plane(9, 4.5, new THREE.MeshBasicMaterial({ map: scrT, toneMapped: false })); wall.position.set(0, 2.6, -4); S.add(wall);
  const frame = ibox(9.3, 4.8, .1, { color: '#1a1a22' }); frame.position.set(0, 2.6, -4.08); S.add(frame);
  const sideT = tex(512, 512, (c, W, H) => { c.fillStyle = '#06142a'; c.fillRect(0, 0, W, H); for (let i = 0; i < 12; i++) { c.fillStyle = `rgba(106,208,255,${.3 + hash(i) * .5})`; c.fillRect(30, 30 + i * 38, 100 + hash(i + 2) * 330, 18); } });
  for (const s of [-1, 1]) { const sw = plane(3, 2.2, new THREE.MeshBasicMaterial({ map: sideT, toneMapped: false })); sw.position.set(s * 5.4, 2.4, -3.2); sw.rotation.y = -s * .6; S.add(sw); }
  for (let r = 0; r < 2; r++) for (let k = 0; k < 4; k++) { const d = ibox(1.3, .75, .7, { color: '#22262e' }); d.position.set(-2.4 + k * 1.6, .375, -1.6 + r * 1.6); S.add(d); const mon = plane(.6, .38, new THREE.MeshBasicMaterial({ map: sideT, toneMapped: false })); mon.position.set(-2.4 + k * 1.6, 1.05, -1.75 + r * 1.6); S.add(mon); }
  const glow = new THREE.PointLight('#5ab0ff', 8, 12, 1.2); glow.position.set(0, 2.6, -2.5); S.add(glow);
  // situation room at x=40: wood panel wall, screen, long table
  const panT = tex(512, 256, (c, W, H) => { c.fillStyle = '#5a3e2a'; c.fillRect(0, 0, W, H); for (let i = 0; i < 8; i++) { c.strokeStyle = 'rgba(0,0,0,.35)'; c.lineWidth = 4; c.strokeRect(i * 64 + 6, 10, 52, H - 20); } grain(c, W, H, .06); }, [3, 1]);
  const pan = plane(16, 6, mat(panT)); pan.position.set(40, 3, -4.2); S.add(pan);
  const scr2T = tex(1024, 512, () => { }); scr2T.userData.draw = (t) => { drawScr(scr2T.userData.canvas.getContext('2d'), 1024, 512, t, 'feed'); scr2T.needsUpdate = true; }; scr2T.userData.draw(0);
  const scr2 = plane(5.2, 2.6, new THREE.MeshBasicMaterial({ map: scr2T, toneMapped: false })); scr2.position.set(40, 3.0, -4.1); S.add(scr2);
  const ctab = ibox(3.0, .12, 7, { color: '#3a2618', top: tex(256, 256, (c, W) => { c.fillStyle = '#4a3020'; c.fillRect(0, 0, W, W); grain(c, W, W, .08); }) }); ctab.position.set(40, .9, 0); S.add(ctab);
  for (let i = 0; i < 5; i++) { const lap = plane(.4, .28, new THREE.MeshBasicMaterial({ map: sideT, toneMapped: false })); lap.position.set(40 + (i % 2 ? .9 : -.9), 1.1, -2.6 + i * 1.3); lap.rotation.y = i % 2 ? -Math.PI / 2 + .3 : Math.PI / 2 - .3; S.add(lap); }
  const glow2 = new THREE.PointLight('#9affb0', 6, 12, 1.2); glow2.position.set(40, 3, -2.5); S.add(glow2);
  const ceilL = new THREE.PointLight('#ffe8c8', 5, 10, 1.3); ceilL.position.set(40, 4.5, 1); S.add(ceilL);
  S.add(new THREE.HemisphereLight('#4a6aa0', '#05060a', .45));
  const chars = {}; for (let i = 0; i < 6; i++) chars['a' + i] = new Char(S, { ...person(i + 80, { body: ['#2a2e38', '#3a3a44', '#22262e'][i % 3] }), emissive: .2 });
  for (let i = 0; i < 7; i++) chars['o' + i] = new Char(S, { ...OFFICIAL(i), emissive: .22 });
  return { scene: S, chars, scrT, scr2T, glow, update(t) { scr2T.userData.draw(t); } };
}

// ================= NEW YORK: TRIBUTE IN LIGHT =================
export function buildNYC() {
  const S = new THREE.Scene(); S.background = new THREE.Color('#03050c'); S.fog = new THREE.Fog('#050814', 80, 420);
  stars(S, 900);
  const water = plane(800, 300, new THREE.MeshStandardMaterial({ color: '#05080f', roughness: .15, metalness: .6 })); water.rotation.x = -Math.PI / 2; water.position.set(0, 0, -60); S.add(water);
  const sky = []; for (let i = 0; i < 46; i++) { const w = 6 + hash(i) * 9, h = 14 + hash(i + 3) * 46 * (Math.abs(i - 23) < 8 ? 1.5 : 1), x = -160 + i * 7 + hash(i + 5) * 3, z = -120 - hash(i + 7) * 30;
    const b = ibox(w, h, 8, { color: '#0c111c', front: face('#0c111c', (c, W, H) => { for (let r = 0; r < 30; r++) for (let k = 0; k < 6; k++) if (hash(i * 97 + r * 7 + k) > .78) { c.fillStyle = hash(r + k) > .5 ? '#ffd9a0' : '#cfe0ff'; c.fillRect(10 + k * 40, 10 + r * 33, 18, 14); } }, { w: 256, h: 1024, border: false }) }, { frontEmis: .9 }); b.position.set(x, h / 2, z); S.add(b); }
  const beamT = tex(64, 512, (c, W, H) => { const g = c.createLinearGradient(0, H, 0, 0); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(.5, 'rgba(255,255,255,.55)'); g.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = g; c.fillRect(0, 0, W, H); const g2 = c.createLinearGradient(0, 0, W, 0); g2.addColorStop(0, 'rgba(0,0,0,.8)'); g2.addColorStop(.5, 'rgba(0,0,0,0)'); g2.addColorStop(1, 'rgba(0,0,0,.8)'); c.globalCompositeOperation = 'destination-out'; c.fillStyle = g2; c.fillRect(0, 0, W, H); });
  const beams = []; for (const x of [-7, 7]) { const m = new THREE.Mesh(new THREE.CylinderGeometry(4.5, 3, 500, 24, 1, true), new THREE.MeshBasicMaterial({ map: beamT, color: '#9ec4ff', transparent: true, opacity: .55, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false })); m.position.set(x, 250, -128); S.add(m); beams.push(m); }
  const refl = floorGlow('#6a9aff', 30, 160, .25); refl.position.set(0, .05, -50); S.add(refl);
  S.add(new THREE.HemisphereLight('#3a4a7a', '#000', .5));
  return { scene: S, chars: {}, beams, update(t) { beams.forEach((b, i) => b.material.opacity = .5 + .05 * Math.sin(t * 2 + i)); } };
}

// ================= WASHINGTON: CROWD + PODIUM =================
export function buildDC() {
  const S = new THREE.Scene(); S.background = new THREE.Color('#060914'); S.fog = new THREE.Fog('#070a16', 40, 220);
  stars(S, 800);
  const gnd = plane(400, 300, mat(tex(256, 256, (c, W) => { c.fillStyle = '#2a3a26'; c.fillRect(0, 0, W, W); grain(c, W, W, .1, 3000); }, [40, 30]))); gnd.rotation.x = -Math.PI / 2; gnd.position.z = -60; S.add(gnd);
  const plaza = plane(60, 30, mat(tex(256, 256, (c, W) => { c.fillStyle = '#8a8478'; c.fillRect(0, 0, W, W); grain(c, W, W, .1, 3000); }, [6, 3]))); plaza.rotation.x = -Math.PI / 2; plaza.position.set(0, .03, 2); S.add(plaza);
  // white neoclassical building (generic), floodlit
  const fac = face('#f2efe6', (c, W, H) => { for (let f = 0; f < 2; f++) for (let k = 0; k < 9; k++) { if (k === 4) continue; c.fillStyle = '#ffd890'; c.fillRect(20 + k * W / 9, 30 + f * H / 2, W / 9 - 50, H / 2 - 70); c.lineWidth = 4; c.strokeStyle = '#8a8478'; c.strokeRect(20 + k * W / 9, 30 + f * H / 2, W / 9 - 50, H / 2 - 70); } }, { w: 1024, h: 256 });
  const bld = ibox(56, 14, 14, { color: '#f2efe6', front: fac }, { frontEmis: .25 }); bld.position.set(0, 7, -30); S.add(bld);
  for (let k = 0; k < 6; k++) { const col = new THREE.Mesh(new THREE.CylinderGeometry(.55, .6, 12, 16), new THREE.MeshStandardMaterial({ color: '#f6f3ea', emissive: '#fff4e0', emissiveIntensity: .15 })); col.position.set(-7.5 + k * 3, 6, -21); S.add(col); }
  const ped = new THREE.Shape([new THREE.Vector2(-10, 0), new THREE.Vector2(10, 0), new THREE.Vector2(0, 4)]); const pgeo = new THREE.ExtrudeGeometry(ped, { depth: 9, bevelEnabled: false }); const pm = new THREE.Mesh(pgeo, new THREE.MeshStandardMaterial({ color: '#f2efe6', emissive: '#fff4e0', emissiveIntensity: .12 })); pm.position.set(0, 12, -30); S.add(pm);
  const roof = ibox(20, 1, 9, { color: '#f2efe6' }); roof.position.set(0, 12, -25.5); S.add(roof);
  const fl1 = new THREE.SpotLight('#fff2dc', 60, 60, .7, .5, 1.3); fl1.position.set(0, 2, 2); fl1.target.position.set(0, 8, -24); S.add(fl1, fl1.target);
  // fence
  for (let i = 0; i < 40; i++) { const b = new THREE.Mesh(new THREE.CylinderGeometry(.05, .05, 2.2, 6), new THREE.MeshStandardMaterial({ color: '#111' })); b.position.set(-20 + i, 1.1, -12); S.add(b); }
  const rail = ibox(40, .1, .1, { color: '#111' }); rail.position.set(0, 2.1, -12); S.add(rail);
  // crowd celebrating
  const cr = crowd(S, 90, [-22, 22, -10, 8], i => person(i + 120, { arms: ['flag', 'cheer', 'down', 'flag', 'cheer'][i % 5], back: i % 3 !== 0, expr: 'happy' }));
  const flags = []; for (let i = 0; i < 7; i++) { const f = new Flag(S, 'us', 2.4, 1.5); const x = -15 + i * 5 + hash(i) * 2, z = -6 + hash(i + 3) * 10; f.mesh.position.set(x, 4.2, z); const pole = new THREE.Mesh(new THREE.CylinderGeometry(.04, .04, 4.2, 6), new THREE.MeshStandardMaterial({ color: '#c9c2b0' })); pole.position.set(x, 2.1, z); S.add(pole); flags.push(f); }
  const lamps = []; for (const x of [-18, 18]) { const p = new THREE.PointLight('#ffd9a0', 14, 30, 1.3); p.position.set(x, 6, 0); S.add(p); const g = glowSprite('#ffd9a0', 2, .8); g.position.set(x, 6, 0); S.add(g); }
  S.add(new THREE.HemisphereLight('#6a7ab0', '#100c08', .6));
  // ---- podium room at x=200 ----
  const pwT = face('#efe6d0', (c, W, H) => { for (let k = 0; k < 5; k++) { c.fillStyle = 'rgba(200,180,140,.35)'; c.fillRect(k * W / 5 + 20, 0, 28, H); } c.fillStyle = 'rgba(170,140,90,.35)'; c.fillRect(0, H * .12, W, 14); }, { w: 512, h: 256 });
  const pw = plane(16, 8, mat(pwT)); pw.position.set(200, 4, -6); S.add(pw);
  const carpet = plane(3, 30, mat(tex(64, 256, (c, W, H) => { c.fillStyle = '#9a1a1e'; c.fillRect(0, 0, W, H); c.fillStyle = '#d8b050'; c.fillRect(2, 0, 4, H); c.fillRect(W - 6, 0, 4, H); }, [1, 6]))); carpet.rotation.x = -Math.PI / 2; carpet.position.set(200, .02, 4); S.add(carpet);
  const pfl = plane(16, 30, mat(tex(256, 256, (c, W) => { c.fillStyle = '#6a4a30'; c.fillRect(0, 0, W, W); for (let i = 0; i < 16; i++) sline(c, i * 16, 0, i * 16, W, 2, 'rgba(0,0,0,.25)'); }, [4, 6]))); pfl.rotation.x = -Math.PI / 2; pfl.position.set(200, .01, 4); S.add(pfl);
  const lecT = face('#5a3a24', (c, W, H) => { c.fillStyle = '#1f3a8a'; c.beginPath(); c.arc(W / 2, H * .38, W * .26, 0, 7); c.fill(); c.lineWidth = 8; c.strokeStyle = '#d8b050'; c.stroke(); c.fillStyle = '#d8b050'; c.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? 14 : 34; c.lineTo(W / 2 + Math.cos(a) * r, H * .38 + Math.sin(a) * r); } c.closePath(); c.fill(); }, { w: 256, h: 384 });
  const lec = ibox(1.1, 1.45, .7, { color: '#5a3a24', front: lecT, back: lecT }); lec.position.set(200, .72, 1.2); S.add(lec);
  const mic = new THREE.Mesh(new THREE.CylinderGeometry(.015, .015, .5, 6), new THREE.MeshStandardMaterial({ color: '#111' })); mic.position.set(200, 1.65, 1.35); mic.rotation.x = .5; S.add(mic);
  const pflags = []; for (const x of [-2.4, 2.4]) { const f = new Flag(S, 'us', 1.6, 1.0); f.mesh.position.set(200 + x - .8, 3.1, -4.8); const pole = new THREE.Mesh(new THREE.CylinderGeometry(.03, .03, 3.2, 6), new THREE.MeshStandardMaterial({ color: '#d8b050' })); pole.position.set(200 + x - .8, 1.6, -4.8); S.add(pole); pflags.push(f); }
  const pl = new THREE.SpotLight('#fff4e0', 14, 16, .5, .5, 1.2); pl.position.set(200, 5, 6); pl.target.position.set(200, 1.5, 0); S.add(pl, pl.target);
  const pl2 = new THREE.PointLight('#ffe8c8', 6, 14, 1.3); pl2.position.set(200, 4, -2); S.add(pl2);
  const chars = { pres: new Char(S, PRES) };
  return { scene: S, chars, cr, flags, pflags, update(t) { cr.update(t, 1); flags.forEach((f, i) => f.wave(t + i, .16)); pflags.forEach((f, i) => f.wave(t * .3 + i, .03)); } };
}
