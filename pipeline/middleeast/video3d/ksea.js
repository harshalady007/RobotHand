import * as THREE from 'three';
import { hash, tex, face, ibox, glowSprite, grain, sm, fbm, ridged, terrain, clouds, lights, sky, jet, house, FlagA, SAILOR, CREW, GI, Char, star } from './kamerica.js';
import { mkJet } from './kbase.js';

export const waveH = (x, z, t) => .55 * Math.sin(.045 * x + .8 * t) + .38 * Math.sin(.06 * z - .9 * t + .02 * x) + .2 * Math.sin(.11 * (x + z) + 1.3 * t);

// ship hull: pointed bow, nose +X, waterline y=0
function hullGeo(L, B, bowLen, y0, y1) {
  const s = new THREE.Shape(); s.moveTo(-L / 2, -B / 2); s.lineTo(L / 2 - bowLen, -B / 2); s.quadraticCurveTo(L / 2 - bowLen * .25, -B / 2 * .9, L / 2, 0); s.quadraticCurveTo(L / 2 - bowLen * .25, B / 2 * .9, L / 2 - bowLen, B / 2); s.lineTo(-L / 2, B / 2); s.closePath();
  const g = new THREE.ExtrudeGeometry(s, { depth: y1 - y0, bevelEnabled: false, curveSegments: 10 }); g.rotateX(-Math.PI / 2); g.translate(0, y0, 0); return g;
}
const M = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, flatShading: true, roughness: .6, metalness: .1, ...o });
const box = (g, w, h, d, x, y, z, col, o) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), M(col, o)); m.position.set(x, y, z); g.add(m); return m; };
const cyl = (g, r, h, x, y, z, col, rx = 0, rz = 0, seg = 12) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, seg), M(col)); m.position.set(x, y, z); m.rotation.set(rx, 0, rz); g.add(m); return m; };
const winT = (col) => face(col, (c, W, H) => { c.fillStyle = '#243846'; c.fillRect(8, H * .2, W - 16, H * .35); c.fillStyle = 'rgba(255,255,255,.25)'; for (let i = 1; i < 8; i++) c.fillRect(i * W / 8, H * .2, 3, H * .35); }, { w: 256, h: 64 });

export function destroyer(S, flag = 'us') {
  const g = new THREE.Group(); g.rotation.order = 'YZX'; S.add(g);
  const hull = new THREE.Mesh(hullGeo(96, 12.5, 26, -3.5, 5.5), M('#9ba5af')); g.add(hull);
  box(g, 80, .25, 11, -4, 5.6, 0, '#6e7882'); // deck
  const hullStripe = new THREE.Mesh(hullGeo(96.4, 12.9, 26, -3.5, .2), M('#2b3037')); g.add(hullStripe);
  box(g, 26, 8, 9, 0, 9.6, 0, '#aeb7c0'); // superstructure
  const bridge = ibox(11, 4.4, 8.6, { color: '#aeb7c0', side: winT('#aeb7c0'), front: winT('#aeb7c0'), back: winT('#aeb7c0') }); bridge.position.set(5, 15.8, 0); g.add(bridge);
  box(g, 7, 6.5, 7, -7, 17, 0, '#8d98a3'); cyl(g, 1.1, 8, 6, 22, 0, '#7a838d'); box(g, 5.5, .5, 1.2, 6, 26.2, 0, '#c8d0d8');
  const fun = (x) => { const f = box(g, 5, 7, 5.5, x, 17.5, 0, '#7a838d'); f.rotation.z = .12; return f; }; fun(-12); fun(-18);
  cyl(g, 2.4, 1.2, 30, 6.4, 0, '#8d98a3'); box(g, 4.6, 2.2, 3.6, 30.6, 8, 0, '#9ba5af'); cyl(g, .32, 7, 34.4, 8.3, 0, '#4a525c', 0, Math.PI / 2, 8);
  box(g, 10, .3, 6, 17, 5.8, 0, '#2f353c'); box(g, 18, .22, 10.4, -37, 5.7, 0, '#59616b');
  const fl = new FlagA(g, flag, 5.2, 3.4, true, 11); fl.at(-46, 5.5, 0, Math.PI); g.userData.flag = fl;
  const num = tex(256, 64, (c, W, H) => { c.fillStyle = 'rgba(0,0,0,0)'; c.font = '900 44px Montserrat'; c.fillStyle = '#fff'; c.textAlign = 'center'; c.fillText('DDG 62', W / 2, 46); });
  for (const s of [-1, 1]) { const n = new THREE.Mesh(new THREE.PlaneGeometry(14, 3.5), new THREE.MeshBasicMaterial({ map: num, transparent: true })); n.position.set(22, 2.6, s * 6.28); n.rotation.y = s > 0 ? 0 : Math.PI; g.add(n); }
  return mkShip(S, g, 96, 12.5);
}

export function carrier(S) {
  const g = new THREE.Group(); g.rotation.order = 'YZX'; S.add(g);
  g.add(new THREE.Mesh(hullGeo(210, 30, 52, -5, 16), M('#8d98a3')));
  g.add(new THREE.Mesh(hullGeo(210.6, 30.4, 52, -5, .3), M('#8a2a22')));
  const deckT = tex(1024, 256, (c, W, H) => { c.fillStyle = '#4f555e'; c.fillRect(0, 0, W, H); grain(c, W, H, .1, 3000); c.strokeStyle = '#f4f4f0'; c.lineWidth = 6; c.beginPath(); c.moveTo(60, H * .5); c.lineTo(W - 60, H * .5); c.stroke(); c.setLineDash([30, 24]); c.beginPath(); c.moveTo(80, H * .2); c.lineTo(W - 230, H * .88); c.stroke(); c.setLineDash([]); c.fillStyle = '#f4f4f0'; c.font = '900 90px Montserrat'; c.textAlign = 'center'; c.save(); c.translate(W * .86, H * .5); c.rotate(Math.PI / 2); c.fillText('73', 0, 0); c.restore(); });
  const ds = new THREE.Shape(); ds.moveTo(-108, -22); ds.lineTo(72, -22); ds.lineTo(106, -9); ds.lineTo(106, 9); ds.lineTo(72, 22); ds.lineTo(-108, 22); ds.closePath();
  const dg = new THREE.ExtrudeGeometry(ds, { depth: 1.2, bevelEnabled: false }); dg.rotateX(-Math.PI / 2); dg.translate(0, 16, 0);
  const uv = dg.attributes.uv, p = dg.attributes.position; for (let i = 0; i < uv.count; i++) uv.setXY(i, (p.getX(i) + 108) / 214, (p.getZ(i) + 22) / 44);
  g.add(new THREE.Mesh(dg, [new THREE.MeshStandardMaterial({ map: deckT, roughness: .9 }), M('#6e7882')].reverse()));
  box(g, 18, 20, 9, 30, 27, 15, '#aeb7c0'); box(g, 10, 5, 9.4, 30, 38, 15, '#9ba5af'); cyl(g, .5, 14, 28, 46, 15, '#7a838d'); box(g, 8, .5, 1.4, 28, 52, 15, '#c8d0d8');
  const jets = []; for (let i = 0; i < 6; i++) { const j = mkJet(S); S.remove(j.g); S.remove(j.sh); g.add(j.g); j.g.position.set(-80 + i * 18, 17.6 + 1.45, -8 + (i % 2) * 14 - 6); j.g.rotation.set(0, Math.PI / 2 + (i % 2 ? .4 : -.2), 0); j.g.visible = true; j.glow.material.opacity = 0; jets.push(j); }
  const fl = new FlagA(g, 'us', 7, 4.6, true, 15); fl.at(-104, 17.2, 18, Math.PI); g.userData.flag = fl;
  return mkShip(S, g, 210, 30);
}

export function containerShip(S, hullCol = '#25406a') {
  const g = new THREE.Group(); g.rotation.order = 'YZX'; S.add(g);
  g.add(new THREE.Mesh(hullGeo(170, 26, 34, -5, 7), M(hullCol))); g.add(new THREE.Mesh(hullGeo(170.4, 26.4, 34, -5, .2), M('#8a2a22')));
  box(g, 160, .3, 25, -2, 7.1, 0, '#59616b');
  box(g, 13, 24, 22, -66, 19, 0, '#f1f1ee'); const wb = ibox(13.2, 3, 22.4, { color: '#f1f1ee', side: winT('#f1f1ee'), front: winT('#f1f1ee'), back: winT('#f1f1ee') }); wb.position.set(-66, 28, 0); g.add(wb); cyl(g, 2.4, 8, -70, 34, 0, '#d6422f');
  const pal = ['#d6422f', '#2f78d8', '#e8b020', '#3aa65a', '#f0f0ee', '#8a4ad8', '#ee7a2a', '#2a9fb0'];
  const cnt = 11 * 10 * 3; const im = new THREE.InstancedMesh(new THREE.BoxGeometry(11.4, 2.5, 2.4), new THREE.MeshStandardMaterial({ roughness: .6, flatShading: true }), cnt); let k = 0; const mm = new THREE.Matrix4(), cc = new THREE.Color();
  for (let i = 0; i < 11; i++) for (let j = 0; j < 10; j++) for (let l = 0; l < 3; l++) { mm.makeTranslation(-48 + i * 12 + 2, 8.5 + l * 2.6, -11.2 + j * 2.5 + 1.25); im.setMatrixAt(k, mm); cc.set(pal[Math.floor(hash(i * 7.1 + j * 3.3 + l * 1.7) * pal.length)]); im.setColorAt(k, cc); k++; }
  g.add(im);
  return mkShip(S, g, 170, 26);
}

// wrap a ship: pose from path, wake, bow spray
function mkShip(S, g, L, B) {
  const wakeT = tex(512, 256, (c, W, H) => { c.clearRect(0, 0, W, H); const gr = c.createLinearGradient(W, 0, 0, 0); gr.addColorStop(0, 'rgba(255,255,255,.95)'); gr.addColorStop(.5, 'rgba(255,255,255,.55)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = gr; c.beginPath(); c.moveTo(W * .56, H * .5 - 22); c.lineTo(0, H * .5 - 70); c.lineTo(0, H * .5 + 70); c.lineTo(W * .56, H * .5 + 22); c.closePath(); c.fill(); c.strokeStyle = gr; c.lineWidth = 12; c.beginPath(); c.moveTo(W * .6, H * .5); c.lineTo(W * .05, H * .06); c.moveTo(W * .6, H * .5); c.lineTo(W * .05, H * .94); c.stroke(); });
  const wake = new THREE.Mesh(new THREE.PlaneGeometry(L * 2.0, L * 1.1), new THREE.MeshBasicMaterial({ map: wakeT, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 })); wake.rotation.x = -Math.PI / 2; S.add(wake);
  const o = { g, L, B, wake, place(x, z, heading, t, speed = 10) {
    const hx = Math.cos(heading), hz = -Math.sin(heading); const hy = waveH(x, z, t);
    const f = waveH(x + hx * L * .4, z + hz * L * .4, t), b = waveH(x - hx * L * .4, z - hz * L * .4, t);
    const sx = -hz, sz = hx; const r1 = waveH(x + sx * B * .5, z + sz * B * .5, t), r2 = waveH(x - sx * B * .5, z - sz * B * .5, t);
    g.position.set(x, hy * .8 + .2, z); g.rotation.set(Math.atan2(r1 - r2, B) * .6, heading, Math.atan2(f - b, L * .8) * .8);
    wake.visible = speed > 1 && g.visible; wake.position.set(x - hx * L * .5, hy + .6, z - hz * L * .5); wake.rotation.z = heading; wake.material.opacity = Math.min(1, speed / 8);
    if (g.userData.flag) g.userData.flag.wave(t, .3);
  } };
  return o;
}

export function buildSea() {
  const S = new THREE.Scene(); S.background = new THREE.Color('#8ec8f0'); S.fog = new THREE.Fog('#d4e8f6', 700, 3600);
  sky(S);
  lights(S, '#fff0d4', 2.2, '#d8ecff', '#a8c8e8', 1.5, [-100, 200, 140]); const fillL = new THREE.DirectionalLight('#ffffff', 1.1); fillL.position.set(60, 120, -200); S.add(fillL);
  clouds(S, 16, [-1400, 1400, -1800, 400], 300, 620, 1.2, 8);
  // water
  const N = 150, SZ = 1500; const wg = new THREE.PlaneGeometry(SZ, SZ, N, N); wg.rotateX(-Math.PI / 2); const wp = wg.attributes.position;
  const wm = new THREE.Mesh(wg, new THREE.MeshStandardMaterial({ color: '#2f95de', flatShading: true, roughness: .3, metalness: .05, emissive: '#0b5aa0', emissiveIntensity: .38 })); S.add(wm);
  const far = new THREE.Mesh(new THREE.PlaneGeometry(14000, 14000), new THREE.MeshBasicMaterial({ color: '#3d9ee2', fog: true })); far.rotation.x = -Math.PI / 2; far.position.y = -1.2; S.add(far);
  // quay + land
  const conc = tex(512, 128, (c, W, H) => { c.fillStyle = '#b4b8bf'; c.fillRect(0, 0, W, H); grain(c, W, H, .1, 2000); c.strokeStyle = 'rgba(70,76,86,.4)'; c.lineWidth = 2; for (let i = 0; i <= 16; i++) { c.beginPath(); c.moveTo(i * W / 16, 0); c.lineTo(i * W / 16, H); c.stroke(); } c.fillStyle = '#f2c230'; c.fillRect(0, H - 14, W, 6); });
  const quay = ibox(520, 3.4, 80, { color: '#b4b8bf', top: conc, front: conc, side: conc }); quay.position.set(0, 1.7, -100); S.add(quay);
  const H = (x, z) => { const hz = sm((-z - 330) / 500); return 3 + hz * (60 + 260 * ridged(x * .004 + 5, z * .004 + 2)) + sm((Math.abs(x) - 700) / 400) * 120; };
  terrain(S, { W: 3200, D: 1700, nx: 160, nz: 85, cz: -950, h: H, col: (x, y, z, ny) => { const sl = 1 - ny; if (y > 150) return sl > .4 ? '#8f9188' : '#6a9a50'; if (sl > .4) return '#7f8c70'; return ['#7cc04a', '#8cc84e', '#6fb444'][Math.floor(hash(Math.floor(x / 50) * 3.1 + Math.floor(z / 40) * 1.7) * 3)]; } });
  // dock buildings
  [[-170, -175, 70, 22, 18], [-80, -180, 60, 20, 14], [120, -178, 76, 22, 16], [210, -190, 50, 24, 20]].forEach(([x, z, w, d, h], i) => { const b = ibox(w, h, d, { color: ['#d8d2c4', '#c4ced8', '#e6ddc8', '#cdd6c8'][i] }); b.position.set(x, 3.4 + h / 2, z); S.add(b); const r = ibox(w + 1, 1.2, d + 1, { color: '#8a4a3a' }); r.position.set(x, 3.4 + h + .6, z); S.add(r); });
  // gantry cranes
  const crane = (x) => { const gC = new THREE.Group(); gC.position.set(x, 3.4, -78); S.add(gC); const red = '#d6422f'; for (const [dx, dz] of [[-6, -10], [6, -10], [-6, 8], [6, 8]]) box(gC, 1.6, 34, 1.6, dx, 17, dz, red); box(gC, 15, 2, 28, 0, 34, -1, red); box(gC, 3, 3, 70, 0, 36, -28 + 15, '#f1f1ee'); box(gC, 5, 6, 5, 0, 38, -5, '#2a2a30'); };
  [-120, -10, 100].forEach(crane);
  // containers on the quay
  { const pal = ['#d6422f', '#2f78d8', '#e8b020', '#3aa65a', '#f0f0ee', '#ee7a2a']; const im = new THREE.InstancedMesh(new THREE.BoxGeometry(12, 2.6, 2.5), new THREE.MeshStandardMaterial({ roughness: .6, flatShading: true }), 120); const mm = new THREE.Matrix4(), cc = new THREE.Color(); let k = 0; for (let i = 0; i < 10; i++) for (let j = 0; j < 4; j++) for (let l = 0; l < 3; l++) { mm.makeTranslation(-200 + i * 13, 3.4 + 1.3 + l * 2.6, -125 - j * 2.7); im.setMatrixAt(k, mm); cc.set(pal[Math.floor(hash(i * 5.1 + j * 2.3 + l) * 6)]); im.setColorAt(k, cc); k++; } S.add(im); }
  S.fl = { us: new FlagA(S, 'us', 7.5, 5, true, 18).at(-30, 3.4, -66), jp: new FlagA(S, 'jp', 7.5, 5, true, 18).at(-44, 3.4, -66), kr: new FlagA(S, 'kr', 7.5, 5, true, 18).at(-58, 3.4, -66) };
  // ships
  S.dd = [destroyer(S), destroyer(S, 'us'), destroyer(S, 'jp')]; S.cs = [containerShip(S), containerShip(S, '#3a2a5a'), containerShip(S, '#2a5a4a'), containerShip(S, '#5a3a2a')]; S.cv = carrier(S);
  S.jets = []; for (let i = 0; i < 4; i++) S.jets.push(mkJet(S));
  // anchor (gravity drop) + chain + splash: bright gold, big, outlined so it reads against sea and hull
  const ag = new THREE.Group(); S.add(ag); const gold = '#f5b81c', dark = '#1a1208';
  const aM = (c) => new THREE.MeshStandardMaterial({ color: c, flatShading: true, roughness: .45, metalness: .1, emissive: '#7a5200', emissiveIntensity: .45 });
  const oM = new THREE.MeshBasicMaterial({ color: dark, side: THREE.BackSide });
  const part = (geo, x, y, z, rx = 0, ry = 0, rz = 0) => { const m = new THREE.Mesh(geo, aM(gold)); m.position.set(x, y, z); m.rotation.set(rx, ry, rz); ag.add(m); const o = new THREE.Mesh(geo, oM); o.position.copy(m.position); o.rotation.copy(m.rotation); o.scale.setScalar(1.22); ag.add(o); };
  part(new THREE.CylinderGeometry(.5, .5, 7, 10), 0, 0, 0);                         // shank
  part(new THREE.CylinderGeometry(.4, .4, 4.6, 10), 0, 3.2, 0, 0, 0, Math.PI / 2);   // stock
  part(new THREE.TorusGeometry(.85, .26, 8, 14), 0, 4.4, 0);                        // ring
  part(new THREE.TorusGeometry(2.9, .5, 8, 20, Math.PI), 0, -3.0, 0, 0, 0, Math.PI);  // curved arms
  for (const s of [-1, 1]) part(new THREE.ConeGeometry(1.1, 2.2, 4), s * 2.9, -3.0, 0, 0, 0, s * -2.0); // flukes
  ag.scale.setScalar(1.15); ag.visible = false; S.anchor = ag;
  const links = []; for (let i = 0; i < 18; i++) { const l = new THREE.Mesh(new THREE.TorusGeometry(.7, .22, 6, 10), M('#d9dde4')); l.visible = false; S.add(l); links.push(l); } S.links = links;
  const splashT = tex(64, 64, (c) => { const gr = c.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = gr; c.fillRect(0, 0, 64, 64); });
  S.splash = []; for (let i = 0; i < 26; i++) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: splashT, transparent: true, depthWrite: false, opacity: 0 })); S.add(s); S.splash.push(s); }
  S.splashRing = new THREE.Mesh(new THREE.RingGeometry(.9, 1.2, 40), new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false })); S.splashRing.rotation.x = -Math.PI / 2; S.add(S.splashRing);
  // anchor drop: released at t0 from hawse (x,y,z), free fall under g, enters water, splash
  S.dropAnchor = (t, t0, hx, hy, hz, wy = 0) => { const G = 9.81, k = t - t0; if (k < 0) { ag.visible = false; links.forEach(l => l.visible = false); return; } const fall = hy - wy; const tf = Math.sqrt(2 * fall / G); const y = k < tf ? hy - .5 * G * k * k : wy - Math.min(8, (k - tf) * 3.5); const dr = 6.5 * sm(Math.min(1, k / tf)); const az = hz + dr; ag.visible = true; ag.position.set(hx, y + 4, az); ag.rotation.set(0, 0, Math.sin(k * 3) * (k < tf ? .18 : .04));
    links.forEach((l, i) => { const u = (i + 1) / links.length; l.visible = true; l.position.set(hx, hy + (y + 4 + 4.4 - hy) * u, hz + dr * u); l.rotation.set(i % 2 ? 0 : Math.PI / 2, 0, 0); });
    const ks = k - tf; S.splashRing.visible = ks > 0 && ks < 1.4; if (ks > 0) { S.splashRing.position.set(hx, wy + .25, az); S.splashRing.scale.setScalar(1 + ks * 7); S.splashRing.material.opacity = Math.max(0, .9 - ks * .65); }
    S.splash.forEach((s, i) => { if (ks < 0 || ks > 1.6) { s.material.opacity = 0; return; } const a = hash(i * 3.3) * 6.28, v = 3 + hash(i * 7.1) * 7, vy = 8 + hash(i * 5.9) * 9; const x = hx + Math.cos(a) * v * ks * .6, z = az + Math.sin(a) * v * ks * .6, yy = wy + vy * ks - .5 * G * ks * ks; s.position.set(x, Math.max(wy, yy), z); s.scale.setScalar(1.6 + ks * 2.4); s.material.opacity = Math.max(0, 1 - ks / 1.5) * (yy > wy - .2 ? 1 : 0); }); };
  // chars on the quay
  const ch = {}; for (let i = 0; i < 4; i++) ch['s' + i] = new Char(S, SAILOR(i), 2.4); for (let i = 0; i < 3; i++) ch['c' + i] = new Char(S, CREW(i), 2.4); ch.g0 = new Char(S, GI(0), 2.4); S.chars = ch;
  S.hideAll = () => { S.dd.forEach(s => { s.g.visible = false; s.wake.visible = false; }); S.cs.forEach(s => { s.g.visible = false; s.wake.visible = false; }); S.cv.g.visible = false; S.cv.wake.visible = false; S.jets.forEach(j => j.show(false)); ag.visible = false; links.forEach(l => l.visible = false); S.splashRing.visible = false; S.splash.forEach(s => s.material.opacity = 0); };
  S.reset = S.hideAll;
  S.update = (t, cam) => { for (let i = 0; i < wp.count; i++) wp.setY(i, waveH(wp.getX(i), wp.getZ(i), t)); wp.needsUpdate = true; wg.computeVertexNormals(); wm.position.set(Math.round(cam.position.x / 10) * 10 * 0, 0, 0); Object.values(S.fl).forEach((f, i) => f.wave(t + i, .22)); };
  return S;
}
