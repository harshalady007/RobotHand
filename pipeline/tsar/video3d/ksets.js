import * as THREE from 'three';
import { OUT, hash, tex, face, mat, ibox, plane, glowSprite, floorGlow, sline, grain } from './tex.js';
import { Char } from './chars.js';
import { heli, puff, smokeT } from './sets_osama.js';
import { sm, lerp, fbm, ridged, terrain, clouds, lights, sky, house, FlagK, SIACH, FARMER, KASH, INSOL, PKSOL, tractor } from './kcommon.js';
import { person } from './sets.js';

// ================= SIACHEN GLACIER =================
export function buildGlacier() {
  const S = new THREE.Scene(); S.background = new THREE.Color('#9fd0f5'); S.fog = new THREE.Fog('#dcecf8', 500, 3000);
  sky(S, '#2f7fd8', '#8cc4f2', '#eaf5ff', '#e6f0fa');
  const base = (x, z) => { const ax = Math.abs(x); const m = sm((ax - 70) / 300); const r = ridged(x * .006 + 11, z * .006); let h = m * (260 + 520 * r); h += (fbm(x * .03, z * .03) - .5) * 5 * (1 - m); h += sm((-z - 500) / 400) * 520 * (.6 + .5 * ridged(x * .005, z * .005 + 3)); return h; };
  const pads = [{ x: 0, z: -40, r: 38, b: 40, y: 0 }];
  const H = (x, z) => { let h = base(x, z); for (const p of pads) { const d = Math.hypot(x - p.x, z - p.z); const w = sm((p.r + p.b - d) / p.b); if (w > 0) h = lerp(h, p.y, w); } return h; };
  S.h = H;
  terrain(S, { W: 2000, D: 2600, nx: 200, nz: 260, cz: -700, h: H, col: (x, y, z, ny) => { const sl = 1 - ny; if (sl > .52) return y > 150 ? '#a09a94' : '#aaa49c'; if (y < 6 && fbm(x * .05, z * .05) > .6 && sl < .2) return '#b9d7f0'; return sl > .3 ? '#b9cde2' : (fbm(x * .04, z * .04) > .5 ? '#e4eefa' : '#d3e2f2'); } });
  clouds(S, 18, [-900, 900, -1800, 200], 420, 800, 1.1, 9);
  lights(S, '#fff4e0', 2.0, '#cfe4fa', '#b4c6dc', 1.0, [40, 100, 110]);
  // camp
  const tentM = col => new THREE.MeshStandardMaterial({ color: col, flatShading: true, roughness: .8 });
  [[-12, -48, '#ff8a3a'], [-6, -56, '#ffd23f'], [30, -56, '#ff8a3a'], [-20, -40, '#e8e2d2']].forEach(([x, z, col], i) => { const t = new THREE.Mesh(new THREE.ConeGeometry(3.4, 3.2, 4), tentM(col)); t.rotation.y = Math.PI / 4 + i * .2; t.position.set(x, 1.6, z); S.add(t); });
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(.08, .1, 9, 8), new THREE.MeshStandardMaterial({ color: '#cfcfcf', metalness: .6 })); pole.position.set(-2, 4.5, -62); S.add(pole);
  S.flag = new FlagK(S, 'in', 3.2, 2.1, false).at(-2, 9, -62);
  for (let i = -3; i <= 3; i++) { const b = ibox(1.4, .8, .9, { color: '#cfc7b0' }); b.position.set(-8 + i * 1.5, .4, -30); S.add(b); }
  const hpad = new THREE.Mesh(new THREE.CircleGeometry(7, 28), new THREE.MeshStandardMaterial({ color: '#d8dee6' })); hpad.rotation.x = -Math.PI / 2; hpad.position.set(16, .08, -46); S.add(hpad);
  const hmark = tex(128, 128, (c) => { c.fillStyle = '#ff5a3a'; c.font = '900 100px Montserrat'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('H', 64, 68); }); const hp = new THREE.Mesh(new THREE.PlaneGeometry(6, 6), new THREE.MeshBasicMaterial({ map: hmark, transparent: true })); hp.rotation.x = -Math.PI / 2; hp.position.set(16, .1, -46); S.add(hp);
  S.heli = heli(S, { col: '#eceff3' });
  // blowing snow (pure function of t, wraps around camera)
  const N = 1400, sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.BufferAttribute(new Float32Array(N * 3), 3));
  const snow = new THREE.Points(sg, new THREE.PointsMaterial({ color: '#ffffff', size: 3.2, sizeAttenuation: false, transparent: true, opacity: .9, depthWrite: false })); snow.frustumCulled = false; S.add(snow);
  S.snowUpdate = (t, cam) => { const p = sg.attributes.position.array; const BX = 90, BY = 45, BZ = 90; for (let i = 0; i < N; i++) { const x0 = hash(i * 1.1) * BX, y0 = hash(i * 2.3) * BY, z0 = hash(i * 3.7) * BZ; const wx = 7 + 3 * Math.sin(t * .7 + i), fall = 1.3; const x = ((x0 + wx * t - cam.position.x) % BX + BX) % BX + cam.position.x - BX / 2, y = ((y0 - fall * t - cam.position.y) % BY + BY) % BY + cam.position.y - BY / 2, z = ((z0 + 2 * t - cam.position.z) % BZ + BZ) % BZ + cam.position.z - BZ / 2; p[i * 3] = x; p[i * 3 + 1] = y; p[i * 3 + 2] = z; } sg.attributes.position.needsUpdate = true; };
  S.chars = { s0: new Char(S, SIACH(0, { arms: 'rifle', face: -.4 }), 2.0), s1: new Char(S, SIACH(1, { arms: 'down', expr: 'tired' }), 2.0), s2: new Char(S, SIACH(2, { arms: 'point', face: .5 }), 2.0), s3: new Char(S, SIACH(3, { arms: 'flag', flagKind: 'in', expr: 'smile' }), 2.0) };
  S.reset = () => { S.heli.g.position.y = -999; }; S.update = (t, cam) => { if (cam) S.sky.position.copy(cam.position); S.flag.wave(t, .22); S.snowUpdate(t, cam); };
  return S;
}

// ================= DAM + FARMS =================
export function buildWater() {
  const S = new THREE.Scene(); S.background = new THREE.Color('#9fd0f5'); S.fog = new THREE.Fog('#dff0fa', 400, 2600); sky(S);
  const xr = z => 8 * Math.sin(z * .012);
  const base = (x, z) => { const ax = Math.abs(x); const gor = sm((-z - 10) / 60); const m = sm((ax - 44) / 70) * (120 + 260 * ridged(x * .01 + 4, z * .01)) * gor; const out = sm((z - 60) / 20) * 0; return m + (fbm(x * .03, z * .03) - .5) * 2 * (1 - gor); };
  const H = (x, z) => { let h = base(x, z); const d = Math.abs(x - xr(z)); if (z > -28) h = Math.min(h, -2.4 + d * d * .02 + sm((d - 12) / 8) * 2.4) ; return h; };
  S.h = H;
  const FIELD = ['#7cc04a', '#d9c23a', '#5fa83e', '#a8d05a', '#8cc84a', '#6bb544'];
  terrain(S, { W: 1400, D: 1600, nx: 280, nz: 320, cz: 100, h: H, col: (x, y, z, ny) => { const sl = 1 - ny; if (sl > .5) return '#8a8276'; if (y > 60) return y > 160 ? '#f4f8ff' : '#8f897d'; if (y < -.2) return '#bfa36a'; if (z < -20) return '#6a9a4a'; const lane = Math.floor((x + 400) / 36); const cell = Math.floor(z / 30); return FIELD[Math.floor(hash(lane * 3.7 + cell * 1.3) * 6)]; } });
  lights(S);
  clouds(S, 16, [-800, 800, -600, 600], 300, 650, 1.1, 5);
  // dam
  const conc = face('#cfcac0', (c, W, Hh) => { c.strokeStyle = 'rgba(90,86,80,.35)'; c.lineWidth = 3; for (let i = 0; i < 20; i++) { c.beginPath(); c.moveTo(i * W / 20, 0); c.lineTo(i * W / 20, Hh); c.stroke(); } for (let j = 0; j < 6; j++) { c.beginPath(); c.moveTo(0, j * Hh / 6); c.lineTo(W, j * Hh / 6); c.stroke(); } grain(c, W, Hh, .08, 2000); }, { w: 512, h: 128 });
  const dam = ibox(92, 40, 10, { color: '#cfcac0', front: conc, back: conc, top: conc }); dam.position.set(0, 20, -30); S.add(dam);
  for (const x of [-26, 0, 26]) { const gt = ibox(10, 12, 1, { color: '#2a3a4a' }); gt.position.set(x, 21, -24.6); S.add(gt); }
  const bar = ibox(92, 1.6, 1, { color: '#e8e3d8' }); bar.position.set(0, 40.8, -25.5); S.add(bar);
  const wtex = tex(256, 256, (c, W) => { c.fillStyle = '#2fa0dc'; c.fillRect(0, 0, W, W); for (let i = 0; i < 60; i++) { c.fillStyle = `rgba(255,255,255,${.15 + hash(i) * .35})`; c.fillRect(hash(i * 1.3) * W, hash(i * 2.9) * W, 5 + hash(i) * 22, 3 + hash(i * 3) * 3); } }, [3, 5]);
  const res = new THREE.Mesh(new THREE.PlaneGeometry(82, 420), new THREE.MeshStandardMaterial({ map: wtex, roughness: .2, emissive: '#1b78b0', emissiveIntensity: .3 })); res.rotation.x = -Math.PI / 2; res.position.set(0, 37, -245); S.add(res);
  // river + canals (flowing texture)
  const ft = tex(128, 256, (c, W, Hh) => { c.fillStyle = '#2fa8e6'; c.fillRect(0, 0, W, Hh); for (let i = 0; i < 40; i++) { c.fillStyle = `rgba(255,255,255,${.25 + hash(i) * .35})`; c.fillRect(hash(i * 1.3) * W, hash(i * 2.9) * Hh, 3 + hash(i) * 10, 5 + hash(i * 3) * 14); } }, null);
  ft.wrapS = ft.wrapT = THREE.RepeatWrapping; S.ft = ft;
  const ribbon = (xf, z0, z1, wd, rep) => { const pts = []; for (let z = z0; z <= z1; z += 8) pts.push([xf(z), z]); const pos = [], uv = [], idx = []; pts.forEach(([x, z], i) => { pos.push(x - wd / 2, -.9, z, x + wd / 2, -.9, z); uv.push(0, i * 8 / rep, 1, i * 8 / rep); if (i < pts.length - 1) { const j = i * 2; idx.push(j, j + 1, j + 2, j + 1, j + 3, j + 2); } }); const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals(); const m = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ map: ft, roughness: .2, emissive: '#1d86c4', emissiveIntensity: .3, side: THREE.DoubleSide })); S.add(m); return m; };
  ribbon(xr, -24, 700, 20, 24);
  for (const [cx, w] of [[-70, 5], [-135, 5], [75, 5], [140, 5]]) { const m = ribbon(z => cx + Math.sin(z * .02) * 3, 20, 700, w, 18); m.position.y = .85; }
  // gate jets (ballistic: x = v t, y = y0 - g t^2 / 2)
  const NJ = 10 * 3 * 40, jg = new THREE.BufferGeometry(); jg.setAttribute('position', new THREE.BufferAttribute(new Float32Array(NJ * 3), 3));
  const jets = new THREE.Points(jg, new THREE.PointsMaterial({ color: '#d4f0ff', map: smokeT, size: 1.8, sizeAttenuation: true, transparent: true, opacity: .75, depthWrite: false })); jets.frustumCulled = false; S.add(jets);
  const GRAV = 9.81, V0 = 11, Y0 = 18; const tFall = (V0 * 0 + Math.sqrt(2 * (Y0 + 1) / GRAV));
  S.jetUpdate = (t) => { const p = jg.attributes.position.array; let n = 0; for (const gx of [-26, 0, 26]) for (let r = 0; r < 10; r++) for (let i = 0; i < 40; i++) { const tau = ((t * .9 + i / 40 + r * .13) % 1) * tFall; const spread = (hash(i * 7 + r * 13 + gx) - .5) * 9; p[n * 3] = gx + spread; p[n * 3 + 1] = Y0 + 3 - .5 * GRAV * tau * tau + 3 * 0; p[n * 3 + 2] = -24 + V0 * tau * (.9 + .2 * hash(i + r)); n++; } jg.attributes.position.needsUpdate = true; };
  const foam = []; for (const gx of [-26, 0, 26]) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: smokeT, transparent: true, depthWrite: false, color: '#ffffff', opacity: .8 })); s.position.set(gx, 2.5, -4); s.scale.set(28, 10, 1); S.add(s); foam.push(s); }
  // powerhouse + pylons
  const ph = ibox(16, 8, 10, { color: '#d9d4c8' }); ph.position.set(-60, 4, -6); S.add(ph); const phr = ibox(17, 1, 11, { color: '#2a5f9a' }); phr.position.set(-60, 8.5, -6); S.add(phr);
  const bolt = tex(128, 128, (c) => { c.fillStyle = '#ffd23f'; c.strokeStyle = '#111'; c.lineWidth = 8; c.beginPath(); c.moveTo(78, 6); c.lineTo(30, 70); c.lineTo(62, 70); c.lineTo(46, 122); c.lineTo(100, 52); c.lineTo(68, 52); c.closePath(); c.stroke(); c.fill(); }); const bs = new THREE.Mesh(new THREE.PlaneGeometry(5, 5), new THREE.MeshBasicMaterial({ map: bolt, transparent: true })); bs.position.set(-60, 4.5, -.9); S.add(bs); S.bolt = bs;
  const pyl = []; for (let i = 0; i < 9; i++) { const z = 6 + i * 52, x = -60 + i * 12 + 0; const g = new THREE.Group(); g.position.set(x, 0, z); const mm = new THREE.MeshStandardMaterial({ color: '#8a8f98', metalness: .5, roughness: .5 }); for (const s of [-1, 1]) { const l = new THREE.Mesh(new THREE.CylinderGeometry(.12, .2, 26, 5), mm); l.position.set(s * 1.6, 13, 0); l.rotation.z = -s * .05; g.add(l); } const ca = new THREE.Mesh(new THREE.BoxGeometry(11, .4, .4), mm); ca.position.y = 24; g.add(ca); const cb = new THREE.Mesh(new THREE.BoxGeometry(8, .4, .4), mm); cb.position.y = 19; g.add(cb); S.add(g); pyl.push([x, z]); }
  const wm = new THREE.LineBasicMaterial({ color: '#1a1a1a' }); for (const oy of [-5, 0, 5]) { const pts = []; for (let i = 0; i < pyl.length - 1; i++) { const [x0, z0] = pyl[i], [x1, z1] = pyl[i + 1]; for (let k = 0; k <= 8; k++) { const u = k / 8; pts.push(new THREE.Vector3(lerp(x0, x1, u) + oy, 24 - (oy === 0 ? 0 : 5) - 3 * Math.sin(u * Math.PI), lerp(z0, z1, u))); } } const lg = new THREE.BufferGeometry().setFromPoints(pts); S.add(new THREE.Line(lg, wm)); }
  // valve wheel on dam
  const wheel = new THREE.Group(); wheel.position.set(30, 44.4, -25); S.add(wheel); const wr = new THREE.Mesh(new THREE.TorusGeometry(1.5, .2, 8, 24), new THREE.MeshStandardMaterial({ color: '#d4261c', metalness: .3, roughness: .4 })); wheel.add(wr); for (let k = 0; k < 4; k++) { const sp = new THREE.Mesh(new THREE.BoxGeometry(3, .18, .18), new THREE.MeshStandardMaterial({ color: '#d4261c' })); sp.rotation.z = k * Math.PI / 4; wheel.add(sp); } const stem = ibox(.6, 3, .6, { color: '#555' }); stem.position.set(30, 42.6, -25.4); S.add(stem); wheel.position.set(30, 44.2, -25.6); wheel.rotation.x = 0;
  S.flagIn = new FlagK(S, 'in', 4, 2.6, false).at(-36, 60, -30); const fpole = new THREE.Mesh(new THREE.CylinderGeometry(.18, .22, 22, 8), new THREE.MeshStandardMaterial({ color: '#e0e0e0', metalness: .6 })); fpole.position.set(-36, 51, -30); S.add(fpole); S.flagIn.at(-36, 61, -30);
  // farms
  const farmH = [[-55, 140], [-95, 210], [100, 250], [60, 320], [-30, 380], [120, 150]]; farmH.forEach(([x, z], i) => house(S, x, 0, z, 9, 7, 5, i * .7, '#d9c9a0', '#b04a3a'));
  for (let i = 0; i < 30; i++) { const x = (hash(i * 3) - .5) * 300, z = 60 + hash(i * 5) * 360; if (Math.abs(x - xr(z)) < 16) continue; const t = new THREE.Mesh(new THREE.IcosahedronGeometry(3.2, 1), new THREE.MeshStandardMaterial({ color: ['#4a9a3a', '#5aa63a', '#3d8a3a'][i % 3], flatShading: true })); t.position.set(x, 5.5, z); S.add(t); const tr = new THREE.Mesh(new THREE.CylinderGeometry(.35, .5, 3, 6), new THREE.MeshStandardMaterial({ color: '#5a3d28' })); tr.position.set(x, 1.5, z); S.add(tr); }
  // city skyline
  for (let i = 0; i < 26; i++) { const w = 12 + hash(i * 2) * 14, h = 26 + hash(i * 3.1) * 70, x = -190 + i * 15 + hash(i) * 6, z = 520 + hash(i * 7) * 50; const win = face(['#e6ebf2', '#f0e6d0', '#d8e4f0'][i % 3], (c, W, Hh) => { c.fillStyle = '#5a7a9a'; for (let r = 0; r < 12; r++) for (let q = 0; q < 6; q++) { c.fillStyle = hash(r * 7 + q + i) > .85 ? '#ffe08a' : '#7fa4cc'; c.fillRect(10 + q * 38, 12 + r * 40, 22, 26); } }, { w: 256, h: 512 }); const b = ibox(w, h, w, { color: '#c9d4e0', front: win, back: win, side: win }); b.position.set(x, h / 2, z); S.add(b); }
  S.flagPk = new FlagK(S, 'pk', 6, 4, false).at(-10, 142, 500); const fp2 = new THREE.Mesh(new THREE.CylinderGeometry(.35, .4, 55, 8), new THREE.MeshStandardMaterial({ color: '#e0e0e0', metalness: .6 })); fp2.position.set(-10, 114, 500); S.add(fp2); S.flagPk.at(-10, 140, 500);
  S.tractor = tractor(S); S.tractor2 = tractor(S, '#c0392b');
  S.chars = { f0: new Char(S, FARMER(0, { arms: 'cheer', expr: 'happy' }), 2.0), f1: new Char(S, FARMER(1, { arms: 'raise', expr: 'happy' }), 2.0), f2: new Char(S, FARMER(2, { arms: 'broom' }), 2.0), op: new Char(S, INSOL(3, { arms: 'gesture', hat: 'nvg', expr: 'smile' }), 2.0), op2: new Char(S, person(2, { arms: 'point', hat: 'riot', hatCol: '#e0a020' }), 2.0) };
  S.reset = () => { S.tractor.g.position.y = -999; S.tractor2.g.position.y = -999; };
  S.update = (t, cam) => { if (cam) S.sky.position.copy(cam.position); S.ft.offset.y = -(t * 1.2) % 1; wtex.offset.y = -(t * .15) % 1; S.jetUpdate(t); S.flagIn.wave(t, .3); S.flagPk.wave(t + 1, .4); foam.forEach((f, i) => { f.material.opacity = .7 + .15 * Math.sin(t * 5 + i); }); wheel.rotation.z = t * 1.8; };
  return S;
}

// ================= STAGE: CROWN + STORY BOOK =================
export function buildStage() {
  const S = new THREE.Scene(); S.background = new THREE.Color('#8ec8f0'); S.fog = new THREE.Fog('#cfe6f7', 120, 600);
  lights(S, '#fff0d0', 2.4, '#cfe6ff', '#a08a70', 1.1, [-20, 40, 40]);
  const panel = (x) => { const t = tex(1024, 512, (c, W, Hh) => { const g = c.createLinearGradient(0, 0, 0, Hh); g.addColorStop(0, '#3f8fe0'); g.addColorStop(.7, '#bfe3fa'); g.addColorStop(1, '#f4f9ff'); c.fillStyle = g; c.fillRect(0, 0, W, Hh); const ridge = (y0, amp, col, seed, snow) => { c.fillStyle = col; c.beginPath(); c.moveTo(0, Hh); for (let x = 0; x <= W; x += 16) { const y = y0 - amp * (.5 + .5 * Math.sin(x * .006 + seed) * Math.sin(x * .017 + seed * 2)) - amp * .6 * hash(x * .13 + seed); c.lineTo(x, y); } c.lineTo(W, Hh); c.closePath(); c.fill(); if (snow) { c.fillStyle = '#ffffff'; c.globalAlpha = .9; c.beginPath(); c.moveTo(0, Hh); for (let x = 0; x <= W; x += 16) { const y = y0 - amp * (.5 + .5 * Math.sin(x * .006 + seed) * Math.sin(x * .017 + seed * 2)) - amp * .6 * hash(x * .13 + seed); c.lineTo(x, y); } c.lineTo(W, y0 - amp * .7); for (let x = W; x >= 0; x -= 16) { const y = y0 - amp * (.5 + .5 * Math.sin(x * .006 + seed) * Math.sin(x * .017 + seed * 2)) - amp * .6 * hash(x * .13 + seed) + 40; c.lineTo(x, y); } c.closePath(); c.fill(); c.globalAlpha = 1; } }; ridge(330, 200, '#8fa0b8', 1, true); ridge(380, 140, '#6f8aa8', 5, false); ridge(430, 90, '#4f8a5a', 9, false); c.fillStyle = '#3aa9e0'; c.fillRect(0, 462, W, 50); for (let i = 0; i < 30; i++) { const px = hash(i * 3) * W; c.fillStyle = '#2f6b34'; c.beginPath(); c.moveTo(px, 440); c.lineTo(px + 14, 400 - hash(i) * 40); c.lineTo(px + 28, 440); c.fill(); } }); const m = new THREE.Mesh(new THREE.PlaneGeometry(70, 35), new THREE.MeshBasicMaterial({ map: t, fog: false })); m.position.set(x, 14, -26); S.add(m); };
  panel(0); panel(100);
  const floor = (x) => { const f = new THREE.Mesh(new THREE.PlaneGeometry(70, 60), new THREE.MeshStandardMaterial({ map: tex(256, 256, (c, W) => { c.fillStyle = '#7fbf5a'; c.fillRect(0, 0, W, W); grain(c, W, W, .12, 3000); for (let i = 0; i < 60; i++) { c.fillStyle = ['#ffd23f', '#ff8ad8', '#ffffff'][i % 3]; c.beginPath(); c.arc(hash(i * 3) * W, hash(i * 7) * W, 2.5, 0, 7); c.fill(); } }, [8, 8]), roughness: 1 })); f.rotation.x = -Math.PI / 2; f.position.set(x, 0, 4); S.add(f); }; floor(0); floor(100);
  // India crown on pedestal
  const ped = ibox(1.5, 1.2, 1.5, { color: '#f1ece0' }); ped.position.set(0, .6, 0); S.add(ped); const ped2 = ibox(1.9, .22, 1.9, { color: '#d9d2c0' }); ped2.position.set(0, 1.3, 0); S.add(ped2);
  const crown = new THREE.Group(); crown.position.set(0, 2.1, 0); S.add(crown); const gold = new THREE.MeshStandardMaterial({ color: '#ffcf3a', metalness: .85, roughness: .22, emissive: '#aa7a10', emissiveIntensity: .35 });
  const cush = new THREE.Mesh(new THREE.CylinderGeometry(.62, .7, .22, 24), new THREE.MeshStandardMaterial({ color: '#b3202c' })); cush.position.set(0, -.55, 0); crown.add(cush);
  const ring = new THREE.Mesh(new THREE.CylinderGeometry(.55, .6, .42, 28, 1, true), gold); ring.material.side = THREE.DoubleSide; crown.add(ring);
  for (let k = 0; k < 5; k++) { const a = k * Math.PI * 2 / 5; const sp = new THREE.Mesh(new THREE.ConeGeometry(.16, .62, 10), gold); sp.position.set(Math.cos(a) * .5, .5, Math.sin(a) * .5); crown.add(sp); const ball = new THREE.Mesh(new THREE.SphereGeometry(.09, 10, 8), new THREE.MeshStandardMaterial({ color: '#ff3a4a', emissive: '#aa1020', emissiveIntensity: .8 })); ball.position.set(Math.cos(a) * .5, .85, Math.sin(a) * .5); crown.add(ball); const gem = new THREE.Mesh(new THREE.OctahedronGeometry(.09), new THREE.MeshStandardMaterial({ color: ['#3fa7ff', '#6adb6a', '#ff4a8a'][k % 3], emissive: '#222', emissiveIntensity: .6 })); gem.position.set(Math.cos(a) * .57, 0, Math.sin(a) * .57); crown.add(gem); }
  S.crown = crown; const cg = glowSprite('#ffd870', 6, .55); cg.position.set(0, 2.6, .4); S.add(cg); S.crownGlow = cg;
  const sparkles = []; for (let i = 0; i < 8; i++) { const s = glowSprite('#fff3c0', .8, 0); S.add(s); sparkles.push(s); } S.sparkles = sparkles;
  S.fIn = new FlagK(S, 'in', 2.4, 1.6).at(-5, 0, -8); S.fIn.g.children[1] && 0;
  // Pakistan: desk + open book
  const desk = ibox(4.4, .2, 2.4, { color: '#8a5a32' }); desk.position.set(100, 1.2, .2); S.add(desk); for (const [x, z] of [[-1.9, -.9], [1.9, -.9], [-1.9, 1.0], [1.9, 1.0]]) { const l = ibox(.2, 1.2, .2, { color: '#6a4424' }); l.position.set(100 + x, .6, z + .2); S.add(l); }
  const bc = document.createElement('canvas'); bc.width = 1024; bc.height = 512; const bt = new THREE.CanvasTexture(bc); bt.colorSpace = THREE.SRGBColorSpace; S.bookT = bt;
  const book = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 1.6), new THREE.MeshBasicMaterial({ map: bt })); book.rotation.x = -1.05; book.position.set(100, 1.9, .5); S.add(book); const cover = ibox(3.5, .12, 1.8, { color: '#2a5f3a' }); cover.position.set(100, 1.38, .5); cover.rotation.x = -.05; S.add(cover);
  S.bookDraw = (k, t) => { const c = bc.getContext('2d'); c.fillStyle = '#f6efd8'; c.fillRect(0, 0, 1024, 512); c.fillStyle = '#e3d6b4'; c.fillRect(508, 0, 8, 512); c.fillStyle = '#01411c'; c.font = '900 64px Montserrat'; c.textAlign = 'center'; c.fillText('1947', 256, 90); c.fillRect(150, 112, 212, 8); c.fillStyle = '#5a4a30'; for (let i = 0; i < 7; i++) c.fillRect(70, 160 + i * 44, 372 - (i % 3) * 40, 12); c.font = '900 52px Montserrat'; c.fillStyle = '#01411c'; c.fillText('THE STORY OF', 768, 100); c.fillText('A NATION', 768, 160);
    const lines = Math.floor(k * 6); c.fillStyle = '#2a2a60'; for (let i = 0; i < lines; i++) c.fillRect(580, 200 + i * 44, 360 - (i % 3) * 50, 12); const last = k * 6 - lines; c.fillRect(580, 200 + lines * 44, last * 300, 12);
    if (k >= 1) { c.fillStyle = '#2a2a60'; c.font = '900 60px Montserrat'; c.fillText('. . .', 700, 200 + 6 * 44 + 20); }
    if (Math.sin(t * 8) > 0) { c.fillStyle = '#2a2a60'; c.fillRect(580 + (k >= 1 ? 340 : last * 300), 180 + Math.min(6, lines) * 44, 6, 40); } bt.needsUpdate = true; };
  S.fPk = new FlagK(S, 'pk', 2.4, 1.6).at(95, 0, -8);
  const pen = new THREE.Mesh(new THREE.CylinderGeometry(.04, .04, 1.0, 8), new THREE.MeshStandardMaterial({ color: '#1a1a60' })); S.add(pen); S.pen = pen;
  S.chars = { ind: new Char(S, INSOL(0, { arms: 'lectern', hat: 'turban', hatCol: '#ff9933', hair: 'helmet', hairCol: '#2a1c10', stache: true, body: '#3a5a8a', vest: undefined, expr: 'smirk' }), 2.0), pak: new Char(S, PKSOL(0, { arms: 'chin', hat: 'milcap', hatCol: '#01411c', body: '#f0ece0', vest: undefined, expr: 'worried' }), 2.0) };
  S.reset = () => { }; S.update = (t) => { S.crown.rotation.y = t * .8; S.crown.position.y = 2.1 + Math.sin(t * 2) * .05; S.crownGlow.material.opacity = .45 + .15 * Math.sin(t * 3); S.sparkles.forEach((s, i) => { const ph = (t * 1.2 + i / 8) % 1; s.position.set(Math.cos(i * 2.4) * (.7 + hash(i) * .5), 2 + ph * 1.4, Math.sin(i * 2.4) * .6 + .3); s.material.opacity = Math.sin(ph * Math.PI) * .9; s.scale.setScalar(.8 * Math.sin(ph * Math.PI) + .1); }); S.fIn.wave(t, .08); S.fPk.wave(t + 1, .08); };
  return S;
}
