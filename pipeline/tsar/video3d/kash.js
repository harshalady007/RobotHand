import * as THREE from 'three';
import { OUT, hash, tex, face, mat, ibox, plane, glowSprite, floorGlow, sline, grain } from './tex.js';
import { Char } from './chars.js';
import { puff, suv } from './sets_osama.js';
import { crowd, person } from './sets.js';
import { sm, lerp, fbm, ridged, terrain, clouds, lights, sky, house, FlagK, INSOL, PKSOL, KASH, jet, tank, dove, sparks } from './kcommon.js';

export const xr = z => 40 * Math.sin(z * .004 + 1);
export function buildKashmir() {
  const S = new THREE.Scene(); S.background = new THREE.Color('#8ec8f0'); S.fog = new THREE.Fog('#cfe6f7', 700, 3400);
  sky(S);
  const base = (x, z) => {
    const ax = Math.abs(x); const half = 170 + 60 * Math.sin(z * .0035);
    const m = sm((ax - half) / 520); const r = ridged(x * .004 + 3, z * .004);
    let h = m * (380 + 520 * r) * (.7 + .5 * fbm(x * .003, z * .003 + 9));
    h += sm((-z - 1100) / 500) * 700 * (.6 + .6 * ridged(x * .004, z * .004));
    h += (fbm(x * .02, z * .02) - .5) * 8 * (1 - m * .6);
    const lx = (x + 40) / 170, lz = (z + 10) / 115; h -= Math.max(0, 1 - (lx * lx + lz * lz)) * 9;
    return h;
  };
  const pads = [];
  const PAD = (x, z, r, b, y) => pads.push({ x, z, r, b, y: y ?? base(x, z) });
  PAD(150, 60, 48, 40, 0); PAD(xr(-150), -150, 36, 34, 1.4); PAD(-110, -262, 42, 36, 0); PAD(-372, -330, 30, 60);
  PAD(70, -520, 34, 50, 0); PAD(10, 200, 60, 50, 0); PAD(-20, 330, 60, 50, 0);
  const H = (x, z) => {
    let h = base(x, z);
    for (const p of pads) { const d = Math.hypot(x - p.x, z - p.z); const w = sm((p.r + p.b - d) / p.b); if (w > 0) h = lerp(h, p.y, w); }
    const half = 170 + 60 * Math.sin(z * .0035); const ax = Math.abs(x);
    if (z < 420 && ax < half + 80) { const d = Math.abs(x - xr(z)); const w = sm((24 - d) / 16) * sm((half + 80 - ax) / 60); h = lerp(h, Math.min(h, -3.2 + d * d * .012), w); }
    return h;
  };
  S.h = H;
  const FIELD = ['#8cc63f', '#e6c93b', '#6fb04a', '#b6d46a', '#d9b43a', '#a5d05a'];
  terrain(S, { W: 2800, D: 3600, nx: 280, nz: 360, cz: -1100, h: H, col: (x, y, z, ny) => {
    const sl = 1 - ny;
    if (y < -.9) return '#cdb98a';
    if (y < 14 && sl < .22) { const cx = Math.floor((x + z * .3) / 46), cz = Math.floor(z / 40); return FIELD[Math.floor(hash(cx * 3.1 + cz * 7.7) * 6)]; }
    const sn = 300 + fbm(x * .01, z * .01) * 200;
    if (y > sn && sl < .62) return sl > .36 ? '#cddcee' : '#f7faff';
    if (sl > .5) return y > 200 ? '#8f877b' : '#7e7668';
    if (y < 230) return fbm(x * .02, z * .02) > .52 ? '#3f7d3c' : '#6aa24d';
    return sl > .36 ? '#948c7e' : '#a79f8f';
  } });
  clouds(S, 26, [-1200, 1200, -2400, 300], 380, 900, 1.2, 3);
  lights(S);
  // pines
  const pn = 2600, pg = new THREE.ConeGeometry(2.2, 8, 6); pg.translate(0, 4.6, 0);
  const pines = new THREE.InstancedMesh(pg, new THREE.MeshStandardMaterial({ flatShading: true, roughness: 1 }), pn); const dm = new THREE.Object3D(); let k = 0, tries = 0; const cc = new THREE.Color();
  while (k < pn && tries < 40000) { tries++; const x = (hash(tries * 1.31) - .5) * 2000, z = -hash(tries * 2.17) * 2200 + 300; const y = H(x, z); if (y < 12 || y > 230) continue; const sl = Math.abs(H(x + 5, z) - H(x - 5, z)) / 10; if (sl > .7) continue; if (fbm(x * .02, z * .02) < .46) continue; const s = 1.2 + hash(tries * 3.3) * 1.5; dm.position.set(x, y - .4, z); dm.scale.set(s, s * (1 + hash(tries) * .6), s); dm.updateMatrix(); pines.setMatrixAt(k, dm.matrix); cc.set(hash(tries) > .5 ? '#2f6b34' : '#3d7d3a'); pines.setColorAt(k, cc); k++; }
  pines.count = k; S.add(pines);
  // chinar / orchard trees on valley floor
  const ch = 260, cg = new THREE.IcosahedronGeometry(3.4, 1); cg.translate(0, 7, 0); const chin = new THREE.InstancedMesh(cg, new THREE.MeshStandardMaterial({ flatShading: true, roughness: 1 }), ch);
  const tg = new THREE.CylinderGeometry(.35, .5, 4.5, 6); tg.translate(0, 2.2, 0); const trunk = new THREE.InstancedMesh(tg, new THREE.MeshStandardMaterial({ color: '#5a3d28', flatShading: true }), ch); k = 0; tries = 0;
  while (k < ch && tries < 20000) { tries++; const x = (hash(tries * 1.9) - .5) * 700, z = -hash(tries * 2.9) * 700 + 380; const y = H(x, z); if (y < -.3 || y > 6) continue; if (Math.hypot(x - 150, z - 60) < 52) continue; if (Math.hypot(x - xr(-150), z + 150) < 40 || Math.hypot(x + 110, z + 262) < 46) continue; const lx = (x + 40) / 190, lz = (z + 10) / 130; if (lx * lx + lz * lz < 1) continue; const s = .8 + hash(tries * 5.5) * .7; dm.position.set(x, y, z); dm.scale.set(s, s, s); dm.updateMatrix(); chin.setMatrixAt(k, dm.matrix); trunk.setMatrixAt(k, dm.matrix); cc.set(['#d9532b', '#e8902f', '#c4432a', '#e6b13a', '#5aa63a'][Math.floor(hash(tries * 7.7) * 5)]); chin.setColorAt(k, cc); k++; }
  chin.count = trunk.count = k; S.add(chin, trunk);
  // lake + river
  const wt = tex(256, 256, (c, W) => { c.fillStyle = '#3aa9e0'; c.fillRect(0, 0, W, W); for (let i = 0; i < 40; i++) { c.strokeStyle = `rgba(255,255,255,${.12 + hash(i) * .25})`; c.lineWidth = 2 + hash(i + 3) * 3; c.beginPath(); const y = hash(i * 1.7) * W, x = hash(i * 3.1) * W; c.moveTo(x, y); c.quadraticCurveTo(x + 30, y - 6, x + 70, y); c.stroke(); } }, [6, 4]);
  const waterM = new THREE.MeshStandardMaterial({ map: wt, roughness: .18, metalness: .15, emissive: '#1b78b0', emissiveIntensity: .28 });
  const lake = new THREE.Mesh(new THREE.CircleGeometry(1, 56), waterM); lake.rotation.x = -Math.PI / 2; lake.scale.set(180, 120, 1); lake.position.set(-40, -1.15, -10); S.add(lake);
  const rt = tex(128, 256, (c, W, Hh) => { c.fillStyle = '#2fa0dc'; c.fillRect(0, 0, W, Hh); for (let i = 0; i < 26; i++) { c.fillStyle = `rgba(255,255,255,${.25 + hash(i) * .3})`; c.fillRect(hash(i * 1.3) * W, hash(i * 2.9) * Hh, 4 + hash(i) * 14, 3); } }, [1, 200]);
  const rpts = []; for (let z = 420; z > -1700; z -= 12) rpts.push(new THREE.Vector3(xr(z), 0, z));
  const rg = new THREE.BufferGeometry(); const rp = [], ru = [], ri = []; rpts.forEach((p, i) => { const a = rpts[Math.max(0, i - 1)], b = rpts[Math.min(rpts.length - 1, i + 1)]; const dx = b.x - a.x, dz = b.z - a.z, l = Math.hypot(dx, dz); const nx = -dz / l, nz = dx / l; const wd = 8.2; rp.push(p.x + nx * wd, -1.35 + (p.z < -300 ? Math.max(0, (-300 - p.z) * .0) : 0), p.z + nz * wd, p.x - nx * wd, -1.35, p.z - nz * wd); ru.push(0, i * 3, 1, i * 3); if (i < rpts.length - 1) { const j = i * 2; ri.push(j, j + 1, j + 2, j + 1, j + 3, j + 2); } });
  rg.setAttribute('position', new THREE.Float32BufferAttribute(rp, 3)); rg.setAttribute('uv', new THREE.Float32BufferAttribute(ru, 2)); rg.setIndex(ri); rg.computeVertexNormals();
  const rmat = new THREE.MeshStandardMaterial({ map: rt, roughness: .2, emissive: '#1d86c4', emissiveIntensity: .3, side: THREE.DoubleSide }); rmat.map.repeat.set(1, 1); const river = new THREE.Mesh(rg, rmat); S.add(river);
  // houseboats + shikaras
  const boats = [];
  for (const [x, z, w] of [[-120, -48, 15], [-96, -62, 13], [-12, -70, 14], [-150, 2, 12]]) { const g = new THREE.Group(); g.position.set(x, -1.0, z); const b = ibox(w, 2.2, 4.2, { color: '#8a5a32' }); b.position.y = 1.1; g.add(b); const r = ibox(w + 1, .5, 5, { color: '#c0392b' }); r.position.y = 3.4; g.add(r); const up = ibox(w - 2, 1.6, 3.4, { color: '#d9b48a' }); up.position.y = 2.9; g.add(up); S.add(g); }
  for (let i = 0; i < 4; i++) { const g = new THREE.Group(); const hull = ibox(5.4, .6, 1.5, { color: ['#e0b04a', '#e06a4a', '#4aa0e0', '#8ac04a'][i] }); hull.position.y = .3; g.add(hull); const bow = ibox(1.2, .5, 1.0, { color: '#e8e0c8' }); bow.position.set(2.9, .6, 0); bow.rotation.z = .5; g.add(bow); const can = ibox(2.4, 1.5, 1.4, { color: ['#d9534f', '#f0ad4e', '#5bc0de', '#5cb85c'][i] }); can.position.set(.5, 1.5, 0); g.add(can); S.add(g); boats.push({ g, x0: -80 + i * 22, z0: 20 + i * 14 }); }
  S.boat = (i, t) => { const b = boats[i]; return [b.x0 + t * .35 + Math.sin(t * .4 + i) * .5, -1.0 + Math.sin(t * 1.3 + i) * .08, b.z0 + Math.sin(t * .25 + i) * .8]; };
  // village
  const vh = [[118, 38, 7, 6, 5, 0, '#b98a5a', '#9a4a3a'], [132, 18, 8, 6, 5.5, .1, '#c9a070', '#4a7a6a'], [168, 14, 8, 7, 5, -.1, '#a87a4a', '#9a4a3a'], [192, 34, 7, 6, 5, .2, '#c9a070', '#9a4a3a'], [198, 70, 8, 7, 5.5, 1.4, '#b98a5a', '#4a7a6a'], [196, 100, 8, 6, 5, 1.6, '#a87a4a', '#9a4a3a'], [110, 92, 7, 6, 5, 3.0, '#c9a070', '#9a4a3a'], [148, 112, 9, 7, 6, 3.2, '#b98a5a', '#4a7a6a'], [176, 112, 8, 6, 5, 3.0, '#a87a4a', '#9a4a3a'], [104, 66, 7, 6, 5, 1.6, '#c9a070', '#9a4a3a']];
  vh.forEach(a => house(S, a[0], H(a[0], a[1]), a[1], a[2], a[3], a[4], a[5], a[6], a[7]));
  const cr = crowd(S, 130, [112, 190, 28, 100], i => KASH(i, { arms: ['down', 'raise', 'cheer', 'down'][i % 4], back: i % 4 === 3 }), 2.3);
  cr.list.forEach(s => s.visible = false); S.cr = cr;
  // mountain terrace (summit / Kargil) + floor LoC fence
  const rd = pads[3]; S.ridge = { x: rd.x, y: rd.y, z: rd.z };
  const LN = { x: 70, y: 0, z: -520 }; S.line = LN;
  const wireM = new THREE.MeshStandardMaterial({ color: '#9a9ea6', metalness: .7, roughness: .4 });
  for (let i = -8; i <= 4; i++) { const p = new THREE.Mesh(new THREE.CylinderGeometry(.08, .1, 2.1, 6), new THREE.MeshStandardMaterial({ color: '#5a4630' })); p.position.set(LN.x + i * 2.2, 1.05, LN.z); S.add(p); }
  for (const yy of [.5, 1.0, 1.55]) { const w = new THREE.Mesh(new THREE.CylinderGeometry(.025, .025, 29, 5), wireM); w.rotation.z = Math.PI / 2; w.position.set(LN.x - 7.7, yy, LN.z); S.add(w); }
  for (let i = -17; i <= 8; i++) { const b = new THREE.Mesh(new THREE.ConeGeometry(.07, .22, 4), wireM); b.position.set(LN.x + i * 1.1, [.58, 1.08, 1.63][Math.abs(i) % 3], LN.z + .02); S.add(b); }
  const sb = (cx, cy, cz, x, z, w) => { const b = ibox(w, .9, .9, { color: '#b6a47a' }); b.position.set(cx + x, cy + .45, cz + z); S.add(b); const b2 = ibox(w * .7, .8, .9, { color: '#a89668' }); b2.position.set(cx + x, cy + 1.25, cz + z); S.add(b2); };
  sb(LN.x, 0, LN.z, -14, 3.6, 3.2); sb(LN.x, 0, LN.z, 3, -4.5, 3.2); sb(LN.x, 0, LN.z, -12, -5.5, 2.6);
  sb(rd.x, rd.y, rd.z, 3, 0, 3); sb(rd.x, rd.y, rd.z, -3, 3, 2.6);
  S.fIn = new FlagK(S, 'in', 1.8, 1.2).at(LN.x - 11, 0, LN.z + 4.2); S.fPk = new FlagK(S, 'pk', 1.8, 1.2).at(LN.x - 6, 0, LN.z - 4.4); S.fPk.g.rotation.y = Math.PI;
  const gl = new THREE.Mesh(new THREE.PlaneGeometry(60, 3), new THREE.MeshBasicMaterial({ color: '#ff5a3a', transparent: true, opacity: 0, depthWrite: false })); gl.rotation.x = -Math.PI / 2; gl.position.set(LN.x - 6, .08, LN.z); S.add(gl); S.locGlow = gl;
  // isolated summit diorama high above everything (sky + clouds around it)
  { const SM = { x: 0, y: 2300, z: -1500 }; S.summit = SM; const rock = new THREE.Mesh(new THREE.CylinderGeometry(3.2, 15, 16, 7), new THREE.MeshStandardMaterial({ color: '#8a8478', flatShading: true, roughness: 1 })); rock.position.set(SM.x, SM.y - 8, SM.z); S.add(rock); const snow = new THREE.Mesh(new THREE.CylinderGeometry(3.25, 5.2, 4, 7), new THREE.MeshStandardMaterial({ color: '#f4f8ff', flatShading: true })); snow.position.set(SM.x, SM.y - 2, SM.z); S.add(snow); for (let i = 0; i < 6; i++) { const r = new THREE.Mesh(new THREE.DodecahedronGeometry(2 + i % 3, 0), new THREE.MeshStandardMaterial({ color: '#7a7468', flatShading: true })); r.position.set(SM.x + Math.cos(i * 1.1) * 7, SM.y - 12 - i, SM.z + Math.sin(i * 1.1) * 7); S.add(r); }
    clouds(S, 18, [SM.x - 160, SM.x + 160, SM.z - 160, SM.z + 100], SM.y - 90, SM.y - 25, .5, 21); S.fSum = new FlagK(S, 'in', 2.4, 1.6).at(SM.x - 1.6, SM.y, SM.z - .4); }
  // mountain road for the convoy
  const roadP = s => { const x = 185 + 70 * s + 22 * Math.sin(s * 9), z = -260 - 380 * s; return [x, H(x, z) + .25, z]; };
  { const N = 160, pos = [], idx = []; for (let i = 0; i <= N; i++) { const s = i / N, a = roadP(Math.max(0, s - .004)), b = roadP(Math.min(1, s + .004)); const dx = b[0] - a[0], dz = b[2] - a[2], l = Math.hypot(dx, dz), nx = -dz / l, nz = dx / l; const p = roadP(s); for (const sd of [-1, 1]) { const x = p[0] + nx * 3.6 * sd, z = p[2] + nz * 3.6 * sd; pos.push(x, H(x, z) + .3, z); } if (i < N) { const j = i * 2; idx.push(j, j + 1, j + 2, j + 1, j + 3, j + 2); } } const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals(); S.add(new THREE.Mesh(g, new THREE.MeshStandardMaterial({ color: '#4b4b55', roughness: 1, side: THREE.DoubleSide }))); }
  let roadL = 0; { let p = roadP(0); for (let i = 1; i <= 200; i++) { const q = roadP(i / 200); roadL += Math.hypot(q[0] - p[0], q[2] - p[2]); p = q; } }
  S.roadL = roadL; S.roadP = roadP;
  S.jeepAt = (i, dist) => { const s = Math.max(0, Math.min(1, 1 - dist / roadL)); const p = roadP(s), q = roadP(Math.max(0, s - .006)); const dx = q[0] - p[0], dz = q[2] - p[2]; const hl = Math.hypot(dx, dz); const j = S.jeeps[i]; j.drive(p[0], p[2], dist, true, 0); j.g.position.y = p[1]; j.g.rotation.order = 'YZX'; j.g.rotation.set(0, Math.atan2(-dz, dx), Math.atan2(q[1] - p[1], hl)); return p; };
  // bridge
  const bx = xr(-150), bz = -150; S.bridge = { x: bx, z: bz };
  const wood = face('#9a6a3a', (c, W, Hh) => { c.strokeStyle = 'rgba(40,24,10,.55)'; c.lineWidth = 3; for (let i = 0; i < 18; i++) { c.beginPath(); c.moveTo(i * W / 18, 0); c.lineTo(i * W / 18, Hh); c.stroke(); } grain(c, W, Hh, .1, 600); }, { w: 512, h: 64 });
  const deck = ibox(32, .5, 4, { color: '#9a6a3a', top: wood, side: wood }); deck.position.set(bx, 2.6, bz); S.add(deck);
  for (const s of [-1, 1]) { const r = ibox(32, .18, .18, { color: '#6a4424' }); r.position.set(bx, 3.7, bz + s * 1.9); S.add(r); const r2 = ibox(32, .12, .12, { color: '#6a4424' }); r2.position.set(bx, 3.1, bz + s * 1.9); S.add(r2); for (let i = -7; i <= 7; i++) { const p = ibox(.2, 1.2, .2, { color: '#6a4424' }); p.position.set(bx + i * 2.1, 3.2, bz + s * 1.9); S.add(p); } }
  for (const x of [-12, -4, 4, 12]) for (const s of [-1, 1]) { const p = ibox(.9, 6.2, .9, { color: '#5a3a20' }); p.position.set(bx + x, -.6, bz + s * 1.5); S.add(p); }
  for (const s of [-1, 1]) { const a = ibox(5, 3, 5, { color: '#8e8a80' }); a.position.set(bx + s * 17.5, 1.4, bz); S.add(a); }
  const pcol = ['#ff4d4d', '#ffd23f', '#3fa7ff', '#6adb6a', '#ff8ad8']; for (let i = 0; i < 16; i++) { const f = new THREE.Mesh(new THREE.PlaneGeometry(1.1, .9), new THREE.MeshBasicMaterial({ color: pcol[i % 5], side: THREE.DoubleSide })); const u = (i + .5) / 16; f.position.set(bx - 15 + u * 30, 5.2 - Math.sin(u * Math.PI) * 0 - 1.2 * Math.sin(u * Math.PI), bz); f.rotation.y = Math.PI / 2; S.add(f); }
  const dv = dove(S); dv.g.scale.setScalar(2.2); S.dove = dv;
  for (const s of [-1, 1]) { const gg = glowSprite('#ffe0a0', 10, .5); gg.position.set(bx + s * 40, 8, bz - 40); S.add(gg); }
  // fuse + bomb
  const fx = -110, fz = -262; S.fuse = { x: fx, z: fz };
  const bomb = new THREE.Mesh(new THREE.SphereGeometry(2.6, 24, 18), new THREE.MeshStandardMaterial({ color: '#1c1e24', roughness: .35, metalness: .3 })); bomb.position.set(fx - 3, 2.6, fz - 26); S.add(bomb); S.bomb = bomb; S.blast = puff(S, fx - 3, 4, fz - 26, 12, '#6a645c');
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(.7, .8, .8, 12), new THREE.MeshStandardMaterial({ color: '#8a8e96', metalness: .7, roughness: .3 })); cap.position.set(fx - 3, 5.3, fz - 26); S.add(cap);
  const shine = new THREE.Mesh(new THREE.SphereGeometry(.5, 10, 8), new THREE.MeshBasicMaterial({ color: '#fff' })); shine.scale.set(1, .6, .5); shine.position.set(fx - 4.2, 3.9, fz - 23.7); shine.material.transparent = true; shine.material.opacity = .7; S.add(shine);
  const fpath = s => { const x = fx + 9 * Math.sin(s * 6.5) * (1 - s * .55), z = fz + 6 - 32 * s; return [x, .12 + (s > .85 ? (s - .85) / .15 * 5.1 : 0), z]; };
  const fp = fpath; S.fusePath = s => { const a = fp(s); return a; };
  const NSEG = 70, segs = [];
  for (let i = 0; i < NSEG; i++) { const a = fp(i / NSEG), b = fp((i + 1) / NSEG); const m = new THREE.Mesh(new THREE.CylinderGeometry(.09, .09, 1, 5), new THREE.MeshStandardMaterial({ color: '#e8d9a8' })); const L = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]); m.scale.y = L; m.position.set((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2); m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(b[0] - a[0], b[1] - a[1], b[2] - a[2]).normalize()); S.add(m); segs.push(m); }
  const sp = glowSprite('#ffb040', 2.4, 1); S.add(sp); const spl = new THREE.PointLight('#ff9a30', 0, 14, 1.5); S.add(spl); const spk = sparks(S, 22);
  S.fuseSet = (s, on = 1) => { const sb = Math.max(0, Math.min(1, s)); segs.forEach((m, i) => { m.visible = (i + 1) / NSEG > sb; }); const p = fp(sb); sp.position.set(p[0], p[1] + .15, p[2]); sp.material.opacity = on; sp.scale.setScalar(2.2 + Math.sin(sb * 400) * .5); spl.position.set(p[0], p[1] + 1, p[2]); spl.intensity = 30 * on; spk.update(sb * 14, [p[0], p[1], p[2]], on); };
  S.fIn2 = new FlagK(S, 'in', 1.8, 1.2).at(fx - 14, 0, fz + 4); S.fPk2 = new FlagK(S, 'pk', 1.8, 1.2).at(fx + 14, 0, fz + 4); S.fPk2.g.rotation.y = Math.PI;
  // war: explosions on hillsides
  S.expl = [[-215, -150], [225, -210], [-230, -300], [240, -110], [-205, -60]].map(([x, z]) => { const y = H(x, z); return puff(S, x, y + 8, z, 20, '#6a645c'); }); S.expl.push(puff(S, LN.x - 12, H(LN.x - 12, LN.z - 100) + 8, LN.z - 100, 22, '#6a645c'));
  S.jets = [jet(S, { tail: ['#ff9933', '#ffffff', '#138808'], tip: '#ff9933' }), jet(S, { col: '#9fb59a', tail: ['#01411c', '#ffffff'], tip: '#01411c' })]; S.jets.forEach(j => j.g.scale.setScalar(2.6));
  S.tank = tank(S); S.tank2 = tank(S, '#7a8056'); S.jeeps = [suv(S, '#5f7a3a'), suv(S, '#5f7a3a'), suv(S, '#5f7a3a')];
  S.chars = { a0: new Char(S, INSOL(0, { arms: 'rifle', face: .5 }), 2.4), a1: new Char(S, PKSOL(0, { arms: 'rifle', face: -.5 }), 2.4), a2: new Char(S, INSOL(1, { arms: 'flag', flagKind: 'in', expr: 'smile' }), 2.4), a3: new Char(S, PKSOL(1, { arms: 'flag', flagKind: 'pk', expr: 'smile' }), 2.4), b0: new Char(S, KASH(0, { arms: 'point' }), 2.0), b1: new Char(S, KASH(1, { arms: 'down' }), 2.0), b2: new Char(S, KASH(2, { arms: 'down' }), 2.0), b3: new Char(S, KASH(3, { arms: 'gesture' }), 2.0), q0: new Char(S, KASH(5, { arms: 'type' }), 2.0), peace: new Char(S, KASH(2, { arms: 'raise', expr: 'happy' }), 2.0), v0: new Char(S, KASH(4, { arms: 'mug' }), 2.0), v1: new Char(S, person(3, { arms: 'cheer', expr: 'happy' }), 2.0), v2: new Char(S, INSOL(2, { arms: 'point', face: .4 }), 2.0) };
  const flagsAll = [S.fIn, S.fPk, S.fIn2, S.fPk2, S.fSum];
  S.reset = () => { S.jeeps.forEach(j => j.g.position.y = -999); S.jets.forEach(j => j.g.position.y = -999); S.tank.g.position.y = -999; S.tank2.g.position.y = -999; S.jeeps.forEach(j => j.g.position.y = -999); S.dove.g.position.y = -999; S.expl.forEach(e => e.update(0, 1e9)); S.locGlow.material.opacity = 0; S.fuseSet(0, 0); S.cr.list.forEach(s => s.visible = false); S.bomb.visible = true; S.blast.update(0, 1e9); };
  S.update = (t, cam) => { if (cam) S.sky.position.copy(cam.position); wt.offset.x = (t * .03) % 1; rt.offset.y = -(t * .9) % 1; flagsAll.forEach((f, i) => f.wave(t + i, .14)); S.boats = boats; boats.forEach((b, i) => { const p = S.boat(i, t); b.g.position.set(...p); }); S.cr.update(t, 1); };
  return S;
}
