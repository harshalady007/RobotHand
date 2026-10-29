// FZ1073 reel: sky (dive), airports (Dubai take-off / Tabuk landing), cockpit, cabin, Middle-East route map, flag hill
import * as THREE from 'three';
import { hash, tex, face, ibox, glowSprite, grain } from './tex.js';
import { Char } from './chars.js';
import { sky, clouds, lights, FlagK, fbm } from './kcommon.js';
import { G, sm, lin, seg, lerp, airliner, takeoffProfile } from './a911.js';
import { smokeT } from './sets_osama.js';

export { G, sm, lin, seg, lerp, takeoffProfile };
export const STRIPE = '#e8552b';
const ink = '#2a1a12';

// ---------------- characters ----------------
export const CAPT = (x = {}) => ({ body: '#1c2b52', hair: 'helmet', hairCol: '#16120e', hat: 'pcap', hatCol: '#14203f', collar: true, tie: '#e8552b', seed: 3010, expr: 'neutral', arms: 'down', stache: true, ...x });
export const COPI = (x = {}) => ({ body: '#3a3d46', hair: 'bald', sil: '#23262e', seed: 3020, expr: 'angry', arms: 'down', ...x });
export const RELIEF = (i, x = {}) => ({ body: '#1c2b52', hair: i ? 'bob' : 'helmet', hairCol: i ? '#7a4a24' : '#3a2a1a', hat: 'pcap', hatCol: '#14203f', collar: true, tie: '#e8552b', seed: 3030 + i * 3, expr: 'neutral', arms: 'down', ...x });
export const PAX = (i, x = {}) => ({ body: ['#d84a3a', '#2f78c8', '#e8b030', '#3aa05a', '#8a5ac8', '#e87a2a', '#2aa0a8', '#c84a8a', '#5a6a7a', '#a8c03a'][i % 10], hair: ['helmet', 'bob', 'bun', 'curly', 'helmet', 'gray', 'bald', 'bob', 'curly', 'helmet'][i % 10], hairCol: ['#2a1c10', '#6a3a1a', '#1a1a1a', '#8a5a2a', '#3a2a1a', '#4a3a2a'][i % 6], seed: 3100 + i * 1.7, expr: 'worried', arms: 'raise', collar: i % 3 === 0, stache: i % 7 === 3, glasses: i % 5 === 2, ...x });
export const CREWF = (i, x = {}) => ({ body: '#e8552b', hair: 'bun', hairCol: '#2a1c10', hat: undefined, collar: true, tie: '#ffffff', seed: 3300 + i * 1.3, expr: 'worried', arms: 'down', ...x });

const dayBg = (S, far = 9000, fogC = '#d4e8f6') => { S.background = new THREE.Color('#8ec8f0'); S.fog = new THREE.Fog(fogC, far * .3, far); sky(S, '#2f7fd8', '#7fc0f0', '#e4f3ff', '#cfe6f7'); };

// ================= SKY (exterior dive, cloud tops at cruise) =================
// dive(t0, y0): level cruise at 245 m/s, then pitch to -23 deg over 1.3 s (about -95 m/s, 18,000 ft/min). returns path(t)->[x,y,z], plane flies toward -Z
export function dive(t0, y0 = 10360, v = 245, gm = .40, z0 = 0) {
  return (t) => { const u = Math.max(0, t - t0); const N = 36; let X = 0, Y = 0; const du = u / N; for (let i = 0; i < N; i++) { const uu = (i + .5) * du; const gam = -gm * sm((uu - .15) / 1.3); X += v * Math.cos(gam) * du; Y += v * Math.sin(gam) * du; } return [0, y0 + Y, z0 - X]; };
}
export function buildSky() {
  const S = new THREE.Scene(); dayBg(S, 14000, '#dcecf8'); lights(S, '#fff4dc', 2.7, '#cfe6ff', '#c9b58a', 1.3, [-400, 900, 500]);
  const gr = new THREE.Mesh(new THREE.PlaneGeometry(60000, 60000), new THREE.MeshStandardMaterial({ map: tex(512, 512, (c, W) => { c.fillStyle = '#d9c08a'; c.fillRect(0, 0, W, W); for (let i = 0; i < 40; i++) { c.fillStyle = `rgba(${hash(i) > .5 ? '150,120,70' : '240,220,170'},.4)`; c.beginPath(); c.ellipse(hash(i + 1) * W, hash(i + 2) * W, 30 + hash(i + 3) * 90, 20 + hash(i + 4) * 50, hash(i) * 3, 0, 7); c.fill(); } }, [14, 14]), roughness: 1 })); gr.rotation.x = -Math.PI / 2; gr.position.y = 0; S.add(gr);
  S.cl = clouds(S, 140, [-9000, 9000, -16000, 6000], 9800, 10300, 4.2, 5);
  S.cl2 = clouds(S, 40, [-5000, 5000, -9000, 3000], 10650, 10900, 2.2, 9);
  S.air = airliner(S, { stripe: STRIPE });
  S.reset = () => { S.air.show(false); };
  S.update = () => { };
  S.chars = {};
  return S;
}

// ================= AIRPORT (Dubai / Tabuk) =================
const palm = (S, x, z, s = 1) => {
  const tr = new THREE.Mesh(new THREE.CylinderGeometry(.35 * s, .5 * s, 9 * s, 6), new THREE.MeshStandardMaterial({ color: '#8a6a44' })); tr.position.set(x, 4.5 * s, z); S.add(tr);
  for (let k = 0; k < 7; k++) { const lf = new THREE.Mesh(new THREE.ConeGeometry(.9 * s, 6 * s, 4), new THREE.MeshStandardMaterial({ color: '#3f9a3a', flatShading: true })); lf.scale.set(1, 1, .25); const a = k * Math.PI * 2 / 7; lf.position.set(x + Math.cos(a) * 2.6 * s, 9 * s, z + Math.sin(a) * 2.6 * s); lf.rotation.set(0, -a, Math.PI / 2 - .6); S.add(lf); }
};
export function ambulance(S) {
  const g = new THREE.Group(); S.add(g);
  const body = ibox(5.2, 2.4, 2.1, { color: '#f4f6f8' }); body.position.y = 1.9; g.add(body);
  const cab = ibox(1.8, 1.7, 2.0, { color: '#f4f6f8', front: face('#f4f6f8', (c, W, H) => { c.fillStyle = '#26313c'; c.fillRect(W * .1, H * .12, W * .8, H * .4); }, { w: 128, h: 128 }) }); cab.position.set(3.3, 1.55, 0); g.add(cab);
  const side = face('#f4f6f8', (c, W, H) => { c.fillStyle = '#e03a3a'; c.fillRect(0, H * .6, W, H * .12); c.fillRect(W * .42, H * .18, W * .16, H * .4); c.fillRect(W * .3, H * .3, W * .4, H * .16); }, { w: 256, h: 128 });
  const sideM = new THREE.Mesh(new THREE.PlaneGeometry(4.8, 2.0), new THREE.MeshStandardMaterial({ map: side, emissive: '#ffffff', emissiveMap: side, emissiveIntensity: .2 })); sideM.position.set(-.1, 1.9, 1.06); g.add(sideM); const sideN = sideM.clone(); sideN.position.z = -1.06; sideN.rotation.y = Math.PI; g.add(sideN);
  const siren = ibox(1.2, .3, .6, { color: '#ff3030', emis: .7 }); siren.position.set(1.2, 3.25, 0); g.add(siren); const sg = glowSprite('#ff4040', 5, .0); sg.position.set(1.2, 3.5, 0); g.add(sg);
  const wm = new THREE.MeshStandardMaterial({ color: '#16181c', roughness: .95 }); const wheels = [];
  for (const [x, z] of [[2.9, 1.0], [-1.6, 1.0], [2.9, -1.0], [-1.6, -1.0]]) { const ax = new THREE.Group(); ax.position.set(x, .55, z); ax.rotation.x = Math.PI / 2; g.add(ax); const w = new THREE.Mesh(new THREE.CylinderGeometry(.55, .55, .35, 16), [wm, new THREE.MeshStandardMaterial({ color: '#b0b0b0' }), new THREE.MeshStandardMaterial({ color: '#b0b0b0' })]); ax.add(w); wheels.push(w); }
  return { g, r: .55, drive(x, y, z, dist, heading = 0, t = 0) { g.position.set(x, y, z); g.rotation.y = heading; wheels.forEach(w => w.rotation.y = -dist / .55); sg.material.opacity = Math.sin(t * 14) > 0 ? .9 : .1; } };
}
// runway along x at z=0 (width 46), apron on +z side, terminal behind apron
export function buildAirport(kind) {
  const dxb = kind === 'dxb';
  const S = new THREE.Scene(); dayBg(S, 9000, dxb ? '#f3e6cf' : '#e8eef4');
  lights(S, dxb ? '#ffe2b0' : '#fff0d0', dxb ? 2.5 : 2.7, '#cfe6ff', '#cdb98a', 1.25, dxb ? [-400, 380, 300] : [-300, 600, 400]);
  const solid = []; S.solid = solid;
  const gr = new THREE.Mesh(new THREE.PlaneGeometry(14000, 14000), new THREE.MeshStandardMaterial({ map: tex(256, 256, (c, W) => { c.fillStyle = dxb ? '#e6cf9c' : '#d6bf92'; c.fillRect(0, 0, W, W); grain(c, W, W, .14, 3000); }, [120, 120]), roughness: 1 })); gr.rotation.x = -Math.PI / 2; gr.position.y = -.1; S.add(gr);
  const flat = (w, d, x, z, t, y = .05) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), new THREE.MeshStandardMaterial({ map: t, roughness: .95, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 })); m.rotation.x = -Math.PI / 2; m.position.set(x, y, z); S.add(m); return m; };
  const rwT = tex(2048, 128, (c, W, Hh) => { c.fillStyle = '#4b5059'; c.fillRect(0, 0, W, Hh); grain(c, W, Hh, .12, 5000); c.fillStyle = '#f4f4f0'; for (let x = 160; x < W - 160; x += 80) c.fillRect(x, Hh / 2 - 3, 44, 6); c.fillRect(0, 6, W, 4); c.fillRect(0, Hh - 10, W, 4); for (const s of [0, 1]) for (let k = 0; k < 6; k++) c.fillRect(s ? W - 100 : 40, 22 + k * 15, 66, 8); });
  flat(4200, 46, 300, 0, rwT, .06);
  const apT = tex(512, 256, (c, W, Hh) => { c.fillStyle = '#a9adb5'; c.fillRect(0, 0, W, Hh); grain(c, W, Hh, .1, 3000); c.strokeStyle = 'rgba(70,76,86,.45)'; c.lineWidth = 2; for (let i = 0; i <= 8; i++) { c.beginPath(); c.moveTo(i * W / 8, 0); c.lineTo(i * W / 8, Hh); c.stroke(); } for (let j = 0; j <= 4; j++) { c.beginPath(); c.moveTo(0, j * Hh / 4); c.lineTo(W, j * Hh / 4); c.stroke(); } });
  flat(560, 190, 300, 190, apT, .055);
  flat(4000, 16, 300, 80, tex(256, 32, (c, W, Hh) => { c.fillStyle = '#555a63'; c.fillRect(0, 0, W, Hh); grain(c, W, Hh, .1, 600); c.fillStyle = '#f2c230'; c.fillRect(0, Hh / 2 - 1, W, 3); }), .058);
  // terminal + tower
  const tf = face('#e6ddc9', (c, W, H) => { c.fillStyle = '#7fb6e6'; for (let k = 0; k < 16; k++) c.fillRect(8 + k * 64, 40, 54, 120); c.fillStyle = '#b9a98a'; c.fillRect(0, H - 30, W, 30); }, { w: 1024, h: 256, border: false });
  const term = ibox(420, 22, 46, { color: '#e6ddc9', front: tf, back: tf }); term.position.set(300, 11, 330); S.add(term); solid.push(term);
  const troof = ibox(424, 2.5, 50, { color: '#a89878' }); troof.position.set(300, 23, 330); S.add(troof);
  const tw = ibox(7, 38, 7, { color: '#dfe3e8' }); tw.position.set(60, 19, 330); S.add(tw); solid.push(tw); const cb = ibox(14, 6, 14, { color: '#3a5a7a' }); cb.position.set(60, 41, 330); S.add(cb); solid.push(cb);
  for (let i = 0; i < 40; i++) palm(S, 40 + i * 14 + hash(i) * 6, 370 + hash(i + 3) * 10, 1.4 + hash(i) * .5);
  if (dxb) {
    // skyline: tapering tower (Burj-like), glass towers
    const tower = new THREE.Group(); S.add(tower); const seg = [[60, 330], [48, 250], [38, 190], [28, 130], [18, 90], [10, 60]]; let yy = 0;
    seg.forEach(([w, h], i) => { const b = ibox(w, h, w, { color: ['#c9dcf0', '#bcd2e8', '#b0c8e0', '#a6bfd8', '#9ab4d0', '#90abc8'][i] }); b.position.set(0, yy + h / 2, 0); tower.add(b); yy += h * .92; }); const sp = new THREE.Mesh(new THREE.ConeGeometry(2, 90, 6), new THREE.MeshStandardMaterial({ color: '#dfe6ee' })); sp.position.y = yy + 40; tower.add(sp); tower.position.set(-250, 0, -2300); solid.push(tower);
    for (let i = 0; i < 22; i++) { const h = 80 + hash(i) * 260; const b = ibox(50 + hash(i + 2) * 40, h, 50 + hash(i + 3) * 40, { color: ['#d2e4f4', '#e4d8c8', '#c8d8e8', '#f0e6d4'][i % 4] }); b.position.set(-1100 + i * 130 + hash(i) * 40, h / 2, -2200 - hash(i + 5) * 700); S.add(b); solid.push(b); }
    for (let i = 0; i < 20; i++) { const m = new THREE.Mesh(new THREE.SphereGeometry(300 + hash(i) * 200, 8, 6), new THREE.MeshStandardMaterial({ color: '#e0c48a', flatShading: true })); m.scale.set(1.8, .22, 1); m.position.set(-3000 + i * 330, -10, -1500 - hash(i) * 600); S.add(m); }
  } else {
    for (let i = 0; i < 26; i++) { const hh = 160 + hash(i) * 330; const m = new THREE.Mesh(new THREE.ConeGeometry(500 + hash(i + 1) * 500, hh * .45, 7), new THREE.MeshStandardMaterial({ color: ['#b59a74', '#a88c68', '#c4a880', '#9c8260'][i % 4], flatShading: true })); m.rotation.y = hash(i + 7) * 3; m.scale.set(1 + hash(i + 9), 1, .7 + hash(i + 8) * .5); m.position.set(-3400 + i * 270 + hash(i) * 120, hh * .22 - 8, -1900 - hash(i + 4) * 800); S.add(m); }
    for (let i = 0; i < 6; i++) { const b = ibox(60, 16, 40, { color: ['#e8e2d2', '#d7d0c0'][i % 2] }); b.position.set(-120 + i * 110, 8, 440); S.add(b); solid.push(b); }
  }
  // aircraft
  S.mover = airliner(S, { stripe: STRIPE });
  S.parked = airliner(S, { stripe: STRIPE }); S.parked.g.rotation.set(0, -Math.PI / 2, 0); S.parked.g.position.set(300, 0, 180); S.parked.shd.position.set(300, .12, 180); S.parked.shd.rotation.z = Math.PI / 2;
  S.amb = [0, 1, 2].map(() => ambulance(S)); S.trucks = [];
  S.chars = {}; for (let i = 0; i < 10; i++) S.chars['c' + i] = new Char(S, PAX(i, { arms: 'cheer', expr: 'happy' }), 2.4);
  // tyre smoke at touchdown
  S.smokeS = []; for (let i = 0; i < 9; i++) { const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: smokeT, transparent: true, depthWrite: false, color: '#f2f2f2', opacity: 0 })); sp.visible = false; S.add(sp); S.smokeS.push(sp); }
  S.smoke = (t, t0, pos) => { S.smokeS.forEach((sp, i) => { const age = t - t0 - i * .07; sp.visible = age > 0 && age < 2.6; if (!sp.visible) return; sp.position.set(pos[0] + (hash(i) - .5) * 8 + age * 4 + i * 5, 1.2 + age * 2.2, 3.5 + (hash(i + 3) - .5) * 5 * (i % 2 ? 1 : -1)); const sc = 5 + age * 11; sp.scale.set(sc, sc, 1); sp.material.opacity = .8 * (1 - age / 2.6) * Math.min(1, age / .12); }); };
  S.reset = () => { S.smokeS.forEach(sp => sp.visible = false); S.mover.show(false); S.parked.show(false); S.amb.forEach(a => a.g.visible = false); };
  S.update = () => { };
  return S;
}

// ================= COCKPIT =================
export function buildCockpit() {
  const S = new THREE.Scene(); S.background = new THREE.Color('#dfe8f2');
  S.add(new THREE.HemisphereLight('#ffffff', '#b9c4d8', 1.0)); const pl = new THREE.PointLight('#fff4e0', 2, 10, 1.6); pl.position.set(0, 1.4, -1); S.add(pl);
  const Wd = 3.2, Ht = 2.4, L = 3.8, z0 = -1.9;
  const wallM = new THREE.MeshStandardMaterial({ color: '#cdd5df', roughness: .8, emissive: '#aab4c4', emissiveIntensity: .25 });
  const mkW = (w, h, x, y, z, ry, rx = 0) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), wallM); m.position.set(x, y, z); m.rotation.set(rx, ry, 0); S.add(m); return m; };
  mkW(L, Ht, -Wd / 2, Ht / 2, 0, Math.PI / 2); mkW(L, Ht, Wd / 2, Ht / 2, 0, -Math.PI / 2);
  const fl = new THREE.Mesh(new THREE.PlaneGeometry(Wd, L), new THREE.MeshStandardMaterial({ color: '#2b3f6e', roughness: .9 })); fl.rotation.x = -Math.PI / 2; S.add(fl);
  const ce = new THREE.Mesh(new THREE.PlaneGeometry(Wd, L), new THREE.MeshBasicMaterial({ color: '#c9d0da' })); ce.rotation.x = Math.PI / 2; ce.position.y = Ht; S.add(ce);
  // overhead panel
  const ovT = face('#a4aebc', (c, W, H) => { for (let i = 0; i < 40; i++) { c.fillStyle = hash(i) > .5 ? '#ffd23f' : '#5fe08a'; c.fillRect(8 + (i % 10) * 24, 10 + Math.floor(i / 10) * 24, 10, 10); } }); const ov = ibox(1.6, .18, 1.4, { color: '#bfc7d2', top: ovT, bottom: ovT }); ov.position.set(0, Ht - .1, -.6); S.add(ov);
  // windscreen (emissive sky with clouds, scrolls)
  const skyT = tex(1024, 256, (c, W, H) => { const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#2f7fd8'); g.addColorStop(.55, '#8ec8f0'); g.addColorStop(.6, '#ffffff'); g.addColorStop(1, '#e8f4ff'); c.fillStyle = g; c.fillRect(0, 0, W, H); for (let i = 0; i < 26; i++) { const x = hash(i) * W, y = H * .6 + hash(i + 3) * H * .35; const r = 30 + hash(i + 5) * 60; const gg = c.createRadialGradient(x, y, 0, x, y, r); gg.addColorStop(0, 'rgba(255,255,255,.95)'); gg.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = gg; c.fillRect(x - r, y - r, 2 * r, 2 * r); } }); skyT.wrapS = THREE.RepeatWrapping;
  const wsM = new THREE.MeshBasicMaterial({ map: skyT, toneMapped: false }); const ws = new THREE.Mesh(new THREE.PlaneGeometry(Wd, 1.25), wsM); ws.position.set(0, 1.75, z0 + .02); S.add(ws);
      // dash with screens
  const scr = face('#10202e', (c, W, H) => { for (let i = 0; i < 6; i++) { c.fillStyle = ['#3ad0ff', '#5fe08a', '#ffd23f', '#ff7a4a'][i % 4]; c.fillRect(14 + (i % 3) * 78, 16 + Math.floor(i / 3) * 52, 66, 34); } }, { w: 256, h: 128 });
  const dash = ibox(Wd - .2, .7, .5, { color: '#3a4250', front: scr, back: scr }); dash.position.set(0, .7, z0 + .8); S.add(dash);
  // center pedestal + door release
  const ped = ibox(.55, .55, 1.5, { color: '#9aa4b2', top: face('#6a7482', (c, W, H) => { c.fillStyle = '#222'; c.fillRect(W * .15, 20, W * .15, H * .5); c.fillRect(W * .7, 20, W * .15, H * .5); c.fillStyle = '#d83a3a'; c.fillRect(W * .2, 30, W * .05, 50); c.fillStyle = '#ffd23f'; c.fillRect(W * .75, 30, W * .05, 50); c.fillStyle = '#10161e'; c.fillRect(W * .12, H * .68, W * .76, H * .22); }, { w: 128, h: 256 }) }); ped.position.set(0, .28, z0 + 1.7); S.add(ped);
  const btnM = new THREE.MeshStandardMaterial({ color: '#ff3a2a', emissive: '#ff3a2a', emissiveIntensity: .8 });
  const btn = new THREE.Mesh(new THREE.CylinderGeometry(.075, .075, .05, 20), btnM); btn.position.set(.0, .59, z0 + 2.2); S.add(btn);
  const ringB = new THREE.Mesh(new THREE.RingGeometry(.09, .13, 32), new THREE.MeshBasicMaterial({ color: '#ffd23f', transparent: true, side: THREE.DoubleSide, depthWrite: false })); ringB.rotation.x = -Math.PI / 2; ringB.position.set(0, .6, z0 + 2.2); S.add(ringB);
  const bglow = glowSprite('#ff6a4a', .9, 0); bglow.position.set(0, .7, z0 + 2.2); S.add(bglow);
  S.btnPos = new THREE.Vector3(0, .62, z0 + 2.2);
  // seats
  for (const x of [-.8, .8]) { const sb = ibox(.6, 1.2, .18, { color: '#2f55a8' }); sb.position.set(x, .95, z0 + 2.85); S.add(sb); const sc = ibox(.6, .16, .7, { color: '#26468c' }); sc.position.set(x, .42, z0 + 2.4); S.add(sc); }
  // aft door (hinge on +x side), cabin glimpse behind
  const zD = z0 + L - .02;
  const cabinT = tex(256, 512, (c, W, H) => { c.fillStyle = '#e8eef6'; c.fillRect(0, 0, W, H); const vx = W / 2, vy = H * .42; c.fillStyle = '#2b3f6e'; c.beginPath(); c.moveTo(0, H); c.lineTo(W, H); c.lineTo(vx + 14, vy + 10); c.lineTo(vx - 14, vy + 10); c.fill(); for (let i = 0; i < 9; i++) { const k = i / 9, y = vy + 10 + (H - vy - 10) * k * k, w = 14 + (W * .5 - 14) * k * k; c.fillStyle = '#2f55a8'; c.fillRect(vx - w - 24 * k * k, y - 28 * k * k, 26 * k * k + 6, 40 * k * k + 6); c.fillRect(vx + w - 4 + 12 * k * k, y - 28 * k * k, 26 * k * k + 6, 40 * k * k + 6); } });
  const glimpse = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 2.0), new THREE.MeshBasicMaterial({ map: cabinT, color: '#b8c0d0' })); glimpse.position.set(0, 1.0, zD + .6); glimpse.rotation.y = Math.PI; S.add(glimpse);
  { const sh = new THREE.Shape(); sh.moveTo(-Wd / 2, 0); sh.lineTo(Wd / 2, 0); sh.lineTo(Wd / 2, Ht); sh.lineTo(-Wd / 2, Ht); sh.lineTo(-Wd / 2, 0); const hole = new THREE.Path(); hole.moveTo(-.52, 0); hole.lineTo(.52, 0); hole.lineTo(.52, 2.1); hole.lineTo(-.52, 2.1); hole.lineTo(-.52, 0); sh.holes.push(hole); const aw = new THREE.Mesh(new THREE.ShapeGeometry(sh), wallM); aw.rotation.y = Math.PI; aw.position.set(0, 0, zD + .02); S.add(aw); const fw = new THREE.Mesh(new THREE.PlaneGeometry(Wd, Ht), wallM); fw.position.set(0, Ht / 2, z0 - .02); S.add(fw); }
  const dpiv = new THREE.Group(); dpiv.position.set(-.5, 0, zD); S.add(dpiv);
  const doorM = ibox(1.0, 2.05, .09, { color: '#cfd2d8', front: face('#cfd2d8', (c, W, H) => { c.fillStyle = '#26313c'; c.beginPath(); c.arc(W / 2, H * .3, 18, 0, 7); c.fill(); c.fillStyle = '#9aa0aa'; c.fillRect(W * .62, H * .5, 10, 24); }, { w: 128, h: 256 }), back: face('#cfd2d8', null, { w: 128, h: 256 }) }); doorM.position.set(.5, 1.025, 0); dpiv.add(doorM);
  const frameD = ibox(1.2, 2.2, .06, { color: '#6a7280' }); frameD.position.set(0, 1.1, zD + .06); S.add(frameD);
  S.chars = { cap: new Char(S, CAPT(), 2.3), fo: new Char(S, COPI(), 2.3), r0: new Char(S, RELIEF(0), 2.3), r1: new Char(S, RELIEF(1), 2.3), };
  // arm + hand reaching the button (3D, hand = sphere, sleeve = cylinder)
  const arm = new THREE.Group(); S.add(arm); const sleeve = new THREE.Mesh(new THREE.CylinderGeometry(.07, .08, 1, 10), new THREE.MeshStandardMaterial({ color: '#1c2b52' })); sleeve.geometry.translate(0, .5, 0); arm.add(sleeve); const hand = new THREE.Mesh(new THREE.SphereGeometry(.1, 14, 10), new THREE.MeshStandardMaterial({ color: '#f1c9a0' })); arm.add(hand);
  S.arm = (from, to) => { arm.visible = true; const d = to.clone().sub(from); sleeve.position.copy(from); sleeve.scale.set(1, d.length(), 1); sleeve.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.clone().normalize()); sleeve.position.copy(from); hand.position.copy(to); };
  S.z0 = z0; S.dpiv = dpiv; S.btn = btn;
  S.reset = () => { arm.visible = false; dpiv.rotation.y = 0; btn.position.y = .59; btnM.color.set('#ff3a2a'); btnM.emissive.set('#ff3a2a'); bglow.material.opacity = 0; ringB.material.opacity = 0; };
  S.press = (t, tp) => { const k = lin((t - tp) / .15); btn.position.y = .59 - .035 * Math.sin(Math.PI * Math.min(1, k)) * (t < tp + .3 ? 1 : 0) - (t >= tp + .3 ? .0 : 0); if (t > tp + .08) { btnM.color.set('#3aff6a'); btnM.emissive.set('#3aff6a'); } const pulse = t < tp ? .5 + .5 * Math.sin(t * 12) : Math.max(0, 1 - (t - tp) * 1.5); bglow.material.opacity = pulse * .8; ringB.material.opacity = t < tp ? .5 + .5 * Math.sin(t * 12) : 0; ringB.scale.setScalar(1 + .3 * Math.sin(t * 12)); };
  S.door = (k) => { dpiv.rotation.y = -k * 1.35; };
  S.update = (t) => { skyT.offset.x = t * .3; };
  return S;
}

// ================= CABIN =================
export function buildCabin() {
  const S = new THREE.Scene(); S.background = new THREE.Color('#e8eef6'); S.fog = new THREE.Fog('#f2f4f8', 30, 80);
  S.add(new THREE.HemisphereLight('#ffffff', '#b9c4d8', 1.1)); const pl = new THREE.PointLight('#fff4e0', 8, 30, 1.6); pl.position.set(0, 2.0, 4); S.add(pl); const pl2 = new THREE.PointLight('#fff4e0', 8, 30, 1.6); pl2.position.set(0, 2.0, 12); S.add(pl2);
  const L = 40, Wd = 4.4, Ht = 2.5, z0 = -6;
  const wallT = tex(1024, 256, (c, W, H) => { c.fillStyle = '#ece7da'; c.fillRect(0, 0, W, H); for (let k = 0; k < 14; k++) { const x = 20 + k * 72; const g = c.createLinearGradient(0, 90, 0, 170); g.addColorStop(0, '#6fb4f2'); g.addColorStop(1, '#d6ecff'); c.fillStyle = '#d7d1c2'; c.beginPath(); c.roundRect(x - 6, 78, 56, 104, 26); c.fill(); c.fillStyle = g; c.beginPath(); c.roundRect(x, 84, 44, 92, 22); c.fill(); } c.fillStyle = '#c9c2b0'; c.fillRect(0, H - 24, W, 24); }, [L / 14.4, 1]);
  for (const s of [-1, 1]) { const w = new THREE.Mesh(new THREE.PlaneGeometry(L, Ht), new THREE.MeshStandardMaterial({ map: wallT, emissive: '#ffffff', emissiveMap: wallT, emissiveIntensity: .3, roughness: .8 })); w.position.set(s * Wd / 2, Ht / 2, z0 + L / 2); w.rotation.y = -s * Math.PI / 2; S.add(w); }
  const fl = new THREE.Mesh(new THREE.PlaneGeometry(Wd, L), new THREE.MeshStandardMaterial({ map: tex(128, 128, (c, W) => { c.fillStyle = '#2b3f6e'; c.fillRect(0, 0, W, W); c.fillStyle = '#3a5590'; for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) if ((i + j) % 2) c.fillRect(i * 16, j * 16, 16, 16); }, [2, 22]), roughness: .9 })); fl.rotation.x = -Math.PI / 2; fl.position.set(0, 0, z0 + L / 2); S.add(fl);
  const ce = new THREE.Mesh(new THREE.PlaneGeometry(Wd, L), new THREE.MeshStandardMaterial({ color: '#e8e6de', emissive: '#fff6e0', emissiveIntensity: .12 })); ce.rotation.x = Math.PI / 2; ce.position.set(0, Ht, z0 + L / 2); S.add(ce);
  for (const s of [-1, 1]) { const bin = ibox(1.15, .5, L, { color: '#efe9dc' }); bin.position.set(s * 1.5, Ht - .4, z0 + L / 2); S.add(bin); }
  const ls = new THREE.Mesh(new THREE.PlaneGeometry(.35, L), new THREE.MeshBasicMaterial({ color: '#fffbe8' })); ls.rotation.x = Math.PI / 2; ls.position.set(0, Ht - .03, z0 + L / 2); S.add(ls);
  const seatBack = new THREE.InstancedMesh(new THREE.BoxGeometry(.5, .95, .12), new THREE.MeshStandardMaterial({ color: '#2f55a8', roughness: .85 }), 200), seatCush = new THREE.InstancedMesh(new THREE.BoxGeometry(.5, .14, .5), new THREE.MeshStandardMaterial({ color: '#26468c', roughness: .85 }), 200), head = new THREE.InstancedMesh(new THREE.BoxGeometry(.4, .22, .1), new THREE.MeshStandardMaterial({ color: '#f1efe9', roughness: .9 }), 200);
  let n = 0; const M4 = new THREE.Matrix4(); for (let r = 0; r < 16; r++) for (const s of [-1, 1]) for (let k = 0; k < 3; k++) { const x = s * (.95 + k * .52), z = z0 + 3 + r * 1.0; M4.makeTranslation(x, .75, z + .2); seatBack.setMatrixAt(n, M4); M4.makeTranslation(x, .45, z - .02); seatCush.setMatrixAt(n, M4); M4.makeTranslation(x, 1.3, z + .22); head.setMatrixAt(n, M4); n++; }
  S.add(seatBack, seatCush, head);
  // cockpit door at the front of the cabin (hinged, swings forward into the cockpit)
  const zD = z0 + 1.0; const dp = new THREE.Group(); dp.position.set(-.55, 0, zD); S.add(dp);
  const doorF = face('#cfd2d8', (c, W, H) => { c.fillStyle = '#26313c'; c.beginPath(); c.arc(W / 2, H * .3, 22, 0, 7); c.fill(); c.fillStyle = '#9aa0aa'; c.fillRect(W * .62, H * .52, 14, 30); }, { w: 128, h: 256 });
  const dm = ibox(1.1, 2.1, .1, { color: '#cfd2d8', front: doorF, back: doorF }); dm.position.set(.55, 1.05, 0); dp.add(dm);
  const dframe = ibox(1.3, 2.3, .06, { color: '#6a7280' }); dframe.position.set(0, 1.1, zD - .08); S.add(dframe);
  const cockGlow = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 2.1), new THREE.MeshBasicMaterial({ color: '#cfe8ff' })); cockGlow.position.set(0, 1.05, zD - .06); S.add(cockGlow);
  // loose items thrown by the dive: ballistic arcs under gravity
  S.items = []; for (let i = 0; i < 18; i++) { const m = new THREE.Mesh(new THREE.BoxGeometry(.14, .17, .14), new THREE.MeshStandardMaterial({ color: ['#e8552b', '#ffffff', '#3a8ae8', '#ffd23f'][i % 4] })); m.visible = false; S.add(m); S.items.push(m); }
  S.itemsAt = (t, t0, on) => { S.items.forEach((m, i) => { const per = 1.5 + hash(i) * .8; const ph = hash(i + 4) * per; const tau = ((t - t0) + ph) % per; const v0 = 4 + hash(i + 9) * 3; const x0 = (hash(i + 1) - .5) * 2.6, z0i = -3.5 + hash(i + 2) * 5; m.visible = on && t >= t0; m.position.set(x0 + (hash(i + 3) - .5) * tau, .9 + v0 * tau - .5 * G * tau * tau * .5, z0i + (hash(i + 5) - .5) * 1.5 * tau); m.rotation.set(tau * 5, tau * 3, 0); }); };
  // oxygen masks swinging on tubes
  S.masks = []; for (let i = 0; i < 14; i++) { const g = new THREE.Group(); const m = new THREE.Mesh(new THREE.ConeGeometry(.12, .2, 8), new THREE.MeshStandardMaterial({ color: '#ffd23f' })); m.position.y = -.5; g.add(m); const tb = new THREE.Mesh(new THREE.CylinderGeometry(.01, .01, .5, 5), new THREE.MeshStandardMaterial({ color: '#e8e8e8' })); tb.position.y = -.25; g.add(tb); g.position.set((i % 2 ? 1 : -1) * (.55 + hash(i) * .5), Ht - .1, z0 + 4 + i * 1.3); g.visible = false; S.add(g); S.masks.push(g); }
  S.chars = {}; for (let i = 0; i < 14; i++) S.chars['p' + i] = new Char(S, PAX(i), 2.3);
  S.chars.cap = new Char(S, CAPT(), 2.3); S.chars.fo = new Char(S, COPI(), 2.3); S.chars.cr = new Char(S, CREWF(0), 2.3);
  S.z0 = z0; S.zD = zD; S.door = (k) => { dp.rotation.y = k * 1.4; };
  S.reset = () => { S.masks.forEach(m => m.visible = false); S.items.forEach(m => m.visible = false); dp.rotation.y = 0; };
  S.update = (t) => { S.masks.forEach((m, i) => { if (m.visible) m.rotation.z = Math.sin(t * 6 + i) * .35; }); };
  return S;
}

// ================= MAP (Middle East / India-POV) =================
export const MAPME = {};
export async function loadMap() {
  const meta = await (await fetch('assets/map_me.json')).json(); const img = new Image(); img.src = 'assets/map_me.png'; await img.decode();
  const t = new THREE.Texture(img); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; t.needsUpdate = true; MAPME.meta = meta; MAPME.tex = t;
}
export function buildMapME() {
  const S = new THREE.Scene(); S.background = new THREE.Color('#e9d8b8'); S.fog = new THREE.Fog('#e9d8b8', 220, 600);
  lights(S, '#fff2d8', 2.2, '#fff4e0', '#b08a5a', 1.2, [-30, 80, 60]);
  const { meta, tex: mt } = MAPME; const s = 2.0; const w = (meta.lon1 - meta.lon0) * meta.cos * s, h = (meta.lat1 - meta.lat0) * s;
  const table = new THREE.Mesh(new THREE.PlaneGeometry(900, 900), new THREE.MeshStandardMaterial({ color: '#b07a46', roughness: .9 })); table.rotation.x = -Math.PI / 2; table.position.y = -.5; S.add(table);
  const g = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ map: mt, roughness: .95, emissive: '#ffffff', emissiveMap: mt, emissiveIntensity: .3 })); g.rotation.x = -Math.PI / 2; S.add(g);
  const edge = ibox(w + 1.6, .5, h + 1.6, { color: '#f6efe0' }); edge.position.y = -.28; S.add(edge);
  const latm = (meta.lat0 + meta.lat1) / 2, lonm = (meta.lon0 + meta.lon1) / 2;
  const P = (lon, lat, y = 0) => new THREE.Vector3((lon - lonm) * meta.cos * s, y, -(lat - latm) * s); S.P = P;
  const PL = { dxb: [55.37, 25.25], tlv: [34.89, 32.01], tbk: [36.62, 28.37], alert: [37.6, 30.6] }; S.PL = PL;
  const pin = (lon, lat, col, sc = 1.6) => { const gp = new THREE.Group(); gp.position.copy(P(lon, lat)); gp.visible = false; S.add(gp); const cone = new THREE.Mesh(new THREE.ConeGeometry(.45 * sc, 1.3 * sc, 14), new THREE.MeshStandardMaterial({ color: col, roughness: .3, emissive: col, emissiveIntensity: .45 })); cone.rotation.x = Math.PI; cone.position.y = .65 * sc; gp.add(cone); const hd = new THREE.Mesh(new THREE.SphereGeometry(.6 * sc, 18, 14), new THREE.MeshStandardMaterial({ color: col, roughness: .25, emissive: col, emissiveIntensity: .6 })); hd.position.y = 1.65 * sc; gp.add(hd); const ring = new THREE.Mesh(new THREE.RingGeometry(.7 * sc, .9 * sc, 40), new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false })); ring.rotation.x = -Math.PI / 2; ring.position.y = .08; gp.add(ring);
    return { g: gp, set(t, t0, h0 = 6) { const tau = t - t0; gp.visible = tau >= 0; if (!gp.visible) return; const tf = Math.sqrt(2 * h0 / 40); let y; if (tau < tf) y = h0 - .5 * 40 * tau * tau; else { const u = tau - tf; y = Math.abs(Math.sin(u * 9)) * h0 * .25 * Math.exp(-u * 6); } gp.position.y = y; const r = (tau * 1.3) % 1; ring.material.opacity = tau > tf ? (1 - r) * .9 : 0; ring.scale.setScalar(1 + r * 3.2); } }; };
  S.pins = { dxb: pin(...PL.dxb, '#ff9933'), tlv: pin(...PL.tlv, '#3a8ae8'), tbk: pin(...PL.tbk, '#ffd23f'), alert: pin(...PL.alert, '#ff3a3a', 1.2) };
  const route = (a, b, col, lift, rad = .22) => { const A = P(...a, .6), B = P(...b, .6); const m = A.clone().lerp(B, .5); m.y += lift; const curve = new THREE.CatmullRomCurve3([A, A.clone().lerp(m, .5).setY(A.y + lift * .6), m, m.clone().lerp(B, .5).setY(B.y + lift * .6), B]); const geo = new THREE.TubeGeometry(curve, 80, rad, 6, false); const mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: col, emissive: col, emissiveIntensity: .9, roughness: .4 })); mesh.visible = false; S.add(mesh); return { mesh, curve, set(k) { mesh.visible = k > 0; geo.setDrawRange(0, Math.floor(Math.min(1, k) * 80) * 36); }, at(u) { return curve.getPointAt(Math.max(0, Math.min(1, u))); } }; };
  S.r1 = route(PL.dxb, PL.tlv, '#ffd23f', 3.5); S.r2 = route(PL.alert, PL.tbk, '#ff4a3a', 1.4, .26);
  S.icon = airliner(S, { stripe: STRIPE }); S.icon.g.scale.setScalar(.09); S.icon.shd.visible = false; S.icon.gear.visible = false;
  S.placeIcon = (rt, u) => { const p = rt.at(u), q = rt.at(Math.min(1, u + .02)); S.icon.g.visible = true; S.icon.g.position.copy(p); S.icon.g.position.y += .4; S.icon.g.rotation.set(0, Math.atan2(-(q.x - p.x), -(q.z - p.z)), 0); S.icon.shd.visible = false; };
  S.reset = () => { Object.values(S.pins).forEach(p => p.g.visible = false); S.r1.set(0); S.r2.set(0); S.icon.g.visible = false; S.icon.shd.visible = false; };
  S.update = () => { S.icon.shd.visible = false; S.icon.gear.visible = false; };
  S.chars = {};
  return S;
}

// ================= FLAG HILL (finale: tricolour + captain) =================
export function buildFlagHill() {
  const S = new THREE.Scene(); dayBg(S, 3000, '#f4e8d0'); lights(S, '#fff0d0', 2.6, '#cfe6ff', '#8fbf6a', 1.3, [-60, 120, 140]);
  const hill = new THREE.Mesh(new THREE.CylinderGeometry(60, 140, 8, 28), new THREE.MeshStandardMaterial({ color: '#79b85a', flatShading: true })); hill.position.y = -4.05; S.add(hill);
  const gr = new THREE.Mesh(new THREE.CircleGeometry(900, 40), new THREE.MeshStandardMaterial({ color: '#8cc26a' })); gr.rotation.x = -Math.PI / 2; gr.position.y = -8.5; S.add(gr);
  S.clouds = clouds(S, 18, [-250, 250, -300, -100], 30, 90, .35, 4);
  S.flag = new FlagK(S, 'in', 9, 6, true); S.flag.at(-3.5, -6, -10);
  const sun = glowSprite('#ffe9a0', 90, .75); sun.position.set(-10, 20, -120); S.add(sun);
  S.conf = []; for (let i = 0; i < 70; i++) { const m = new THREE.Mesh(new THREE.PlaneGeometry(.22, .14), new THREE.MeshBasicMaterial({ color: ['#ff9933', '#ffffff', '#138808'][i % 3], side: THREE.DoubleSide })); S.add(m); S.conf.push(m); }
  S.chars = { cap: new Char(S, CAPT({ bandage: true, expr: 'smile' }), 2.6) };
  S.reset = () => { }; S.update = (t) => { S.flag.wave(t, .55); S.conf.forEach((m, i) => { const per = 7 + hash(i) * 4; const tau = (t * 1 + hash(i + 3) * per) % per; const v = 1.6; m.position.set(-9 + hash(i + 1) * 18 + Math.sin(tau * 2 + i) * .8, 14 - v * tau, -8 + hash(i + 2) * 12); m.rotation.set(tau * 3 + i, tau * 2, tau); m.visible = m.position.y > 0; }); };
  return S;
}
