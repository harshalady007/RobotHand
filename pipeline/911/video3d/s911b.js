// 9/11 reel sets B: Pentagon, Pennsylvania field, airport (parked + takeoff), Flight 93 cabin, security checkpoint, Afghanistan valley, globe
import * as THREE from 'three';
import { hash, tex, face, mat, ibox, plane, glowSprite, floorGlow, grain } from './tex.js';
import { Char } from './chars.js';
import { smokeT, heli, dust } from './sets_osama.js';
import { terrain, fbm, ridged, clouds, sky, heliFly, jet, house } from './kcommon.js';
import { GR, ll, GI, jeep, truck, FlagA, flagTexA } from './kamerica.js';
import { G, sm, lin, seg, lerp, airliner, blast, bldg, facadeMat, setDusk, cab, takeoffProfile } from './a911.js';
import { EV } from './s911a.js';

const dayLights = (S, hemi = 1.25, sun = 2.5, dir = [-300, 500, 400]) => { S.add(new THREE.HemisphereLight('#cfe6ff', '#b4a58a', hemi)); const d = new THREE.DirectionalLight('#fff0d0', sun); d.position.set(...dir); S.add(d); return d; };
const dayBg = (S, far = 6000) => { S.background = new THREE.Color('#8ec8f0'); S.fog = new THREE.Fog('#d4e8f6', far * .25, far); sky(S); };
const treeAt = (S, x, z, s = 1, y = 0) => { const tr = new THREE.Mesh(new THREE.CylinderGeometry(.35 * s, .5 * s, 4 * s, 6), new THREE.MeshStandardMaterial({ color: '#5a3f28' })); tr.position.set(x, y + 2 * s, z); S.add(tr); const fo = new THREE.Mesh(new THREE.IcosahedronGeometry(3.4 * s, 0), new THREE.MeshStandardMaterial({ color: ['#3f8f3a', '#4ca040', '#368432'][Math.floor(hash(x + z) * 3)], flatShading: true })); fo.position.set(x, y + 5.4 * s, z); fo.scale.set(1, 1.15, 1); S.add(fo); };

// ================= PENTAGON =================
export function buildPentagon() {
  const S = new THREE.Scene(); dayBg(S, 7000); dayLights(S);
  const solid = []; S.solid = solid;
  const gr = new THREE.Mesh(new THREE.PlaneGeometry(9000, 9000), new THREE.MeshStandardMaterial({ map: tex(256, 256, (c, W) => { c.fillStyle = '#7cc04a'; c.fillRect(0, 0, W, W); grain(c, W, W, .12, 3000); }, [90, 90]), roughness: 1 })); gr.rotation.x = -Math.PI / 2; gr.position.y = -.05; S.add(gr);
  const R0 = 239; const penta = (R, ang0) => { const pts = []; for (let k = 0; k < 5; k++) { const a = ang0 + k * 2 * Math.PI / 5; pts.push(new THREE.Vector2(R * Math.cos(a), R * Math.sin(a))); } return pts; };
  const A0 = Math.PI - Math.PI / 5; // face normal toward -x (west)
  const stoneMap = facadeMat('stone').side.map.clone(); stoneMap.repeat.set(1 / 16, 1 / 16); stoneMap.wrapS = stoneMap.wrapT = THREE.RepeatWrapping; stoneMap.needsUpdate = true;
  const sideM = new THREE.MeshStandardMaterial({ map: stoneMap, roughness: .75 }); const capM = new THREE.MeshStandardMaterial({ color: '#7d828c', roughness: .9 });
  [[239, 204], [189, 154], [139, 104]].forEach(([ro, ri], i) => {
    const sh = new THREE.Shape(penta(ro, A0)); sh.holes.push(new THREE.Path(penta(ri, A0)));
    const geo = new THREE.ExtrudeGeometry(sh, { depth: 23.5 - i * 2.5, bevelEnabled: false }); geo.rotateX(-Math.PI / 2);
    const m = new THREE.Mesh(geo, [capM, sideM]); S.add(m); solid.push(m);
  });
  const lawn = new THREE.Mesh(new THREE.ShapeGeometry(new THREE.Shape(penta(102, A0))), new THREE.MeshStandardMaterial({ color: '#8bd05a' })); lawn.rotation.x = -Math.PI / 2; lawn.position.y = .15; S.add(lawn);
  // parking lots + highway (Route 27 style) west of the building
  const lot = (w, d, x, z) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), new THREE.MeshStandardMaterial({ map: tex(256, 256, (c, W) => { c.fillStyle = '#4e535c'; c.fillRect(0, 0, W, W); c.strokeStyle = 'rgba(240,240,230,.7)'; c.lineWidth = 3; for (let i = 0; i < 16; i++) { c.beginPath(); c.moveTo(i * 16 + 4, 20); c.lineTo(i * 16 + 4, 100); c.moveTo(i * 16 + 4, 150); c.lineTo(i * 16 + 4, 230); c.stroke(); } grain(c, W, W, .1, 2000); }, [w / 60, d / 60]), roughness: .95 })); m.rotation.x = -Math.PI / 2; m.position.set(x, .02, z); S.add(m); };
  lot(260, 300, -440, 420); lot(260, 300, -440, -420); lot(200, 160, 380, 380);
  const hw = new THREE.Mesh(new THREE.PlaneGeometry(36, 3000), new THREE.MeshStandardMaterial({ map: tex(64, 512, (c, W, H) => { c.fillStyle = '#3d4249'; c.fillRect(0, 0, W, H); c.fillStyle = '#e8e8e0'; c.fillRect(4, 0, 3, H); c.fillRect(W - 7, 0, 3, H); c.fillStyle = '#f2c230'; for (let y = 0; y < H; y += 64) c.fillRect(W / 2 - 1.5, y, 3, 32); grain(c, W, H, .08, 800); }, [1, 24]), roughness: .95 })); hw.rotation.x = -Math.PI / 2; hw.position.set(-300, .04, 0); S.add(hw);
  S.cars = []; const CC = ['#d83a3a', '#2f6fd0', '#f5f5f0', '#2a2d33', '#37a84a', '#f0a020', '#8a8f98'];
  for (let i = 0; i < 16; i++) { const c = cab(S, CC[i % 7]); S.cars.push({ c, lane: i % 2 ? 1 : -1, v: 22 + hash(i * 3.3) * 8, z0: -1400 + hash(i * 5.1) * 2800 }); }
  // trees, monument
  for (let i = 0; i < 50; i++) { const x = -620 + hash(i * 1.7) * 1700, z = -700 + hash(i * 3.9) * 1400; const rr = Math.hypot(x, z); if (rr < 280 || Math.abs(x + 300) < 40 || (x < -300 && x > -600 && Math.abs(z) > 250 && Math.abs(z) < 580)) continue; treeAt(S, x, z, 1.5 + hash(i) * .8); }
  const mon = new THREE.Mesh(new THREE.CylinderGeometry(3.2, 9.5, 155, 4), new THREE.MeshStandardMaterial({ color: '#f2efe6', flatShading: true })); mon.rotation.y = Math.PI / 4; mon.position.set(2300, 77, -1700); S.add(mon); const tip = new THREE.Mesh(new THREE.ConeGeometry(3.2, 14, 4), new THREE.MeshStandardMaterial({ color: '#f2efe6', flatShading: true })); tip.rotation.y = Math.PI / 4; tip.position.set(2300, 162, -1700); S.add(tip);
  for (let i = 0; i < 18; i++) { const x = 900 + hash(i * 4.1) * 1600, z = -800 + hash(i * 6.3) * 1600; solid.push(bldg(S, ['glass', 'stone', 'tan'][i % 3], 60, 30 + hash(i) * 70, 60, x, z, 0)); }
  S.plane = airliner(S, { stripe: '#b3262e' }); S.plane.show(false);
  S.blast = blast(S, 46, { wind: [1, 0, .25], n: 28, rise: 1.0 }); S.blast.at([-193.4 + 1, 8, 0]);
  S.hit = [-193.4, 8, 0]; S.v = 237;
  S.path = (t) => { const d = S.v * ((EV.pentHit ?? 0) - t); return [S.hit[0] - d, 6.5 + Math.max(0, d) * .075, S.hit[2] - d * .03 + 0]; };
  S.reset = () => { S.plane.show(false); };
  S.update = (t) => { setDusk(0);
    S.cars.forEach((o, i) => { const z = o.z0 + o.lane * o.v * t, x = -300 + (o.lane === 1 ? 5.5 : -5.5); o.c.drive(x, 0, ((z + 1500) % 3000 + 3000) % 3000 - 1500, o.lane * o.v * t, o.lane === 1 ? -Math.PI / 2 : Math.PI / 2); });
    const th = EV.pentHit; if (th !== undefined) { const air = t < th; S.plane.show(air); if (air) S.plane.fly(t, S.path, { gear: false }); S.blast.update(t, th); }
  };
  S.chars = {}; return S;
}

// ================= PENNSYLVANIA FIELD =================
export function buildField() {
  const S = new THREE.Scene(); dayBg(S, 5000); dayLights(S, 1.2, 2.4);
  const H = (x, z) => { const r = Math.hypot(x, z); const flat = 1 - sm(r / 140); return (fbm(x * .004 + 3, z * .004 + 5, 4) * 34 - 6) * (1 - flat * .95) + Math.pow(Math.max(0, (r - 700) / 900), 1.5) * 90 * fbm(x * .002, z * .002 + 9, 3); };
  S.h = H;
  terrain(S, { W: 4200, D: 4200, nx: 190, nz: 190, h: H, col: (x, y, z, ny) => { const r = Math.hypot(x, z); if (r < 24) return '#6e5a3e'; if (r < 60) return '#8a7a50'; const cx = Math.floor(x / 90), cz = Math.floor(z / 70); return ['#7cc04a', '#8cc84e', '#6fb444', '#a6cf5a', '#c9bf5a'][Math.floor(hash(cx * 3.7 + cz * 1.9) * 5)] ; } });
  for (let i = 0; i < 260; i++) { const x = -1800 + hash(i * 1.3) * 3600, z = -1800 + hash(i * 2.9) * 3600; if (Math.hypot(x, z) < 190) continue; treeAt(S, x, z, 1.8 + hash(i) * 1.4, H(x, z)); }
  // barn + silo
  const barn = ibox(26, 12, 16, { color: '#b5382a' }); barn.position.set(-260, H(-260, -150) + 6, -150); S.add(barn); const roof = ibox(27, 3, 17, { color: '#6a6f78' }); roof.position.set(-260, H(-260, -150) + 13.5, -150); S.add(roof);
  const silo = new THREE.Mesh(new THREE.CylinderGeometry(4, 4, 22, 14), new THREE.MeshStandardMaterial({ color: '#cfd4da' })); silo.position.set(-232, H(-232, -150) + 11, -150); S.add(silo);
  S.plane = airliner(S, { stripe: '#1f4fa8' }); S.plane.show(false);
  S.blast = blast(S, 34, { wind: [1, 0, .15], n: 26, rise: .9, col: '#2c2b30' }); S.blast.at([0, 1, 0]);
  S.vh = 200; S.dur = 2.4;
  S.path = (t) => { const tau = Math.max(-1, (EV.paHit ?? 0) - t); const d = S.vh * tau; return [-d, Math.max(-2, .62 * d), 14 + d * .0]; }; // 32 deg dive toward the field
  S.reset = () => { S.plane.show(false); };
  S.update = (t) => { setDusk(0); const th = EV.paHit; if (th !== undefined) { const air = t < th; S.plane.show(air); if (air) S.plane.fly(t, S.path, { gear: false, ground: 0, roll: (u) => Math.PI * .92 * sm((u - (th - 2.3)) / 2.1) }); S.blast.update(t, th); } };
  S.chars = {}; return S;
}

// ================= AIRPORT (apron with parked airliners + runway take-off) =================
export function buildAirport() {
  const S = new THREE.Scene(); dayBg(S, 6500); const sun = dayLights(S, 1.2, 2.6, [-300, 400, 500]);
  const solid = []; S.solid = solid;
  const gr = new THREE.Mesh(new THREE.PlaneGeometry(9000, 9000), new THREE.MeshStandardMaterial({ map: tex(256, 256, (c, W) => { c.fillStyle = '#86c455'; c.fillRect(0, 0, W, W); grain(c, W, W, .12, 3000); }, [90, 90]), roughness: 1 })); gr.rotation.x = -Math.PI / 2; gr.position.y = -.1; S.add(gr);
  const flat = (w, d, x, z, t, y = .05) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), new THREE.MeshStandardMaterial({ map: t, roughness: .95, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 })); m.rotation.x = -Math.PI / 2; m.position.set(x, y, z); S.add(m); return m; };
  const rwT = tex(2048, 128, (c, W, Hh) => { c.fillStyle = '#4b5059'; c.fillRect(0, 0, W, Hh); grain(c, W, Hh, .12, 5000); c.fillStyle = '#f4f4f0'; for (let x = 160; x < W - 160; x += 80) c.fillRect(x, Hh / 2 - 3, 44, 6); c.fillRect(0, 6, W, 4); c.fillRect(0, Hh - 10, W, 4); for (const s of [0, 1]) for (let k = 0; k < 6; k++) c.fillRect(s ? W - 100 : 40, 22 + k * 15, 66, 8); });
  flat(3200, 46, 0, 0, rwT, .06);
  const apT = tex(512, 256, (c, W, Hh) => { c.fillStyle = '#a9adb5'; c.fillRect(0, 0, W, Hh); grain(c, W, Hh, .1, 3000); c.strokeStyle = 'rgba(70,76,86,.45)'; c.lineWidth = 2; for (let i = 0; i <= 8; i++) { c.beginPath(); c.moveTo(i * W / 8, 0); c.lineTo(i * W / 8, Hh); c.stroke(); } for (let j = 0; j <= 4; j++) { c.beginPath(); c.moveTo(0, j * Hh / 4); c.lineTo(W, j * Hh / 4); c.stroke(); } });
  flat(520, 190, 0, 190, apT, .055);
  flat(1400, 16, 0, 80, tex(256, 32, (c, W, Hh) => { c.fillStyle = '#555a63'; c.fillRect(0, 0, W, Hh); grain(c, W, Hh, .1, 600); c.fillStyle = '#f2c230'; c.fillRect(0, Hh / 2 - 1, W, 3); }), .058);
  // terminal + jet bridges + tower
  const tf = face('#cfd8e2', (c, W, H) => { c.fillStyle = '#7fb6e6'; for (let k = 0; k < 16; k++) c.fillRect(8 + k * 64, 40, 54, 120); c.fillStyle = '#9aa7b4'; c.fillRect(0, H - 30, W, 30); }, { w: 1024, h: 256, border: false });
  const term = ibox(420, 22, 46, { color: '#cfd8e2', front: tf, back: tf }); term.position.set(0, 11, 300); S.add(term); solid.push(term);
  const troof = ibox(424, 2.5, 50, { color: '#8a929c' }); troof.position.set(0, 23, 300); S.add(troof);
  for (const x of [-120, -40, 40, 120]) { const jb = ibox(5, 5, 30, { color: '#e8ebef' }); jb.position.set(x + 14, 7, 262); S.add(jb); }
  const tw = ibox(7, 38, 7, { color: '#dfe3e8' }); tw.position.set(-260, 19, 300); S.add(tw); solid.push(tw); const cb = ibox(14, 6, 14, { color: '#3a5a7a' }); cb.position.set(-260, 41, 300); S.add(cb); solid.push(cb);
  // hangars + trees on horizon
  for (let i = 0; i < 6; i++) { const b = ibox(60, 16, 40, { color: ['#d7dde4', '#c7d0da'][i % 2] }); b.position.set(-700 + i * 110, 8, 420); S.add(b); solid.push(b); }
  for (let i = 0; i < 80; i++) { const x = -1700 + hash(i * 1.7) * 3400, z = -300 - hash(i * 3.1) * 900; treeAt(S, x, z, 2 + hash(i) * 1.2); }
  for (let i = 0; i < 24; i++) { const hx = -2600 + i * 220 + hash(i) * 60, hh = 90 + hash(i + 3) * 220; const m = new THREE.Mesh(new THREE.ConeGeometry(260 + hash(i) * 160, hh, 5), new THREE.MeshStandardMaterial({ color: '#6f9a63', flatShading: true })); m.position.set(hx, hh / 2 - 6, -1800); S.add(m); }
  S.parked = [-120, -40, 40, 120].map((x, i) => { const a = airliner(S, { stripe: ['#1f4fa8', '#b3262e', '#2a6a4a', '#1f4fa8'][i] }); a.g.position.set(x, 0, 180); a.g.rotation.set(0, -Math.PI / 2, 0); a.shd.position.set(x, .12, 180); a.shd.rotation.z = Math.PI / 2; return a; });
  // 19 silhouettes: 5+5+5+4
  const SIL = (i) => ({ body: '#1b1f2a', hair: 'bald', hat: i % 2 ? 'hood' : undefined, hatCol: '#1b1f2a', arms: 'down', sil: '#1b1f2a', seed: 600 + i * 1.7, walk: false, expr: 'neutral' });
  S.chars = {}; for (let i = 0; i < 19; i++) S.chars['s' + i] = new Char(S, SIL(i), 2.4);
  // other aircraft in the sky for the take-off shot
  S.skyPlanes = [0, 1, 2].map((i) => airliner(S, { stripe: ['#b3262e', '#2a6a4a', '#1f4fa8'][i] }));
  S.tow = takeoffProfile(0);
  S.depart = airliner(S, { stripe: '#1f4fa8' });
  S.reset = () => { S.skyPlanes.forEach(p => p.show(false)); S.depart.show(false); S.parked.forEach(p => p.show(true)); };
  S.update = (t) => { setDusk(0); };
  S.hideParked = () => S.parked.forEach(p => p.show(false));
  return S;
}

// ================= FLIGHT 93 CABIN =================
export function buildCabin() {
  const S = new THREE.Scene(); S.background = new THREE.Color('#e8eef6'); S.fog = new THREE.Fog('#f2f4f8', 30, 80);
  S.add(new THREE.HemisphereLight('#ffffff', '#b9c4d8', 1.7)); const pl = new THREE.PointLight('#fff4e0', 40, 40, 1.3); pl.position.set(0, 2.0, 4); S.add(pl); const pl2 = new THREE.PointLight('#fff4e0', 30, 30, 1.3); pl2.position.set(0, 2.0, 12); S.add(pl2);
  const L = 40, Wd = 4.4, Ht = 2.5; const z0 = -6;
  const wallT = tex(1024, 256, (c, W, H) => { c.fillStyle = '#ece7da'; c.fillRect(0, 0, W, H); for (let k = 0; k < 14; k++) { const x = 20 + k * 72; const g = c.createLinearGradient(0, 90, 0, 170); g.addColorStop(0, '#6fb4f2'); g.addColorStop(1, '#d6ecff'); c.fillStyle = '#d7d1c2'; c.beginPath(); c.roundRect(x - 6, 78, 56, 104, 26); c.fill(); c.fillStyle = g; c.beginPath(); c.roundRect(x, 84, 44, 92, 22); c.fill(); } c.fillStyle = '#c9c2b0'; c.fillRect(0, H - 24, W, 24); }, [L / 14.4, 1]);
  for (const s of [-1, 1]) { const w = new THREE.Mesh(new THREE.PlaneGeometry(L, Ht), new THREE.MeshStandardMaterial({ map: wallT, emissive: '#ffffff', emissiveMap: wallT, emissiveIntensity: .3, roughness: .8 })); w.position.set(s * Wd / 2, Ht / 2, z0 + L / 2); w.rotation.y = -s * Math.PI / 2; S.add(w); }
  const fl = new THREE.Mesh(new THREE.PlaneGeometry(Wd, L), new THREE.MeshStandardMaterial({ map: tex(128, 128, (c, W) => { c.fillStyle = '#2b3f6e'; c.fillRect(0, 0, W, W); c.fillStyle = '#3a5590'; for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) if ((i + j) % 2) c.fillRect(i * 16, j * 16, 16, 16); }, [2, 22]), roughness: .9 })); fl.rotation.x = -Math.PI / 2; fl.position.set(0, 0, z0 + L / 2); S.add(fl);
  const ce = new THREE.Mesh(new THREE.PlaneGeometry(Wd, L), new THREE.MeshStandardMaterial({ color: '#f4f2ea', emissive: '#fff6e0', emissiveIntensity: .5 })); ce.rotation.x = Math.PI / 2; ce.position.set(0, Ht, z0 + L / 2); S.add(ce);
  for (const s of [-1, 1]) { const bin = ibox(1.15, .5, L, { color: '#efe9dc' }); bin.position.set(s * 1.5, Ht - .4, z0 + L / 2); S.add(bin); }
  const lightStrip = new THREE.Mesh(new THREE.PlaneGeometry(.35, L), new THREE.MeshBasicMaterial({ color: '#fffbe8' })); lightStrip.rotation.x = Math.PI / 2; lightStrip.position.set(0, Ht - .03, z0 + L / 2); S.add(lightStrip);
  // seats (instanced)
  const seatBack = new THREE.InstancedMesh(new THREE.BoxGeometry(.5, .95, .12), new THREE.MeshStandardMaterial({ color: '#2f55a8', roughness: .85 }), 200), seatCush = new THREE.InstancedMesh(new THREE.BoxGeometry(.5, .14, .5), new THREE.MeshStandardMaterial({ color: '#26468c', roughness: .85 }), 200), head = new THREE.InstancedMesh(new THREE.BoxGeometry(.4, .22, .1), new THREE.MeshStandardMaterial({ color: '#f1efe9', roughness: .9 }), 200);
  let n = 0; const M4 = new THREE.Matrix4(); for (let r = 0; r < 16; r++) for (const s of [-1, 1]) for (let k = 0; k < 3; k++) { const x = s * (.95 + k * .52), z = z0 + 3 + r * 1.0; M4.makeTranslation(x, .75, z + .2); seatBack.setMatrixAt(n, M4); M4.makeTranslation(x, .45, z - .02); seatCush.setMatrixAt(n, M4); M4.makeTranslation(x, 1.3, z + .22); head.setMatrixAt(n, M4); n++; }
  S.add(seatBack, seatCush, head);
  const door = ibox(1.4, 2.1, .1, { color: '#cfd2d8', front: face('#cfd2d8', (c, W, H) => { c.fillStyle = '#26313c'; c.beginPath(); c.arc(W / 2, H * .3, 22, 0, 7); c.fill(); c.fillStyle = '#9aa0aa'; c.fillRect(W * .62, H * .52, 14, 30); }, { w: 128, h: 256 }) }); door.position.set(0, 1.05, z0 + 1.0); S.add(door);
  // cart on wheels pushed by the lead passenger (rolls at the passengers' speed)
  const cart = new THREE.Group(); S.add(cart); const cb = ibox(.5, 1.0, .9, { color: '#b9bcc4' }); cb.position.y = .75; cart.add(cb); const cstripe = ibox(.52, .15, .92, { color: '#d83a3a' }); cstripe.position.y = 1.1; cart.add(cstripe);
  const cw = []; for (const [x, z] of [[-.2, .35], [.2, .35], [-.2, -.35], [.2, -.35]]) { const ax = new THREE.Group(); ax.position.set(x, .12, z); ax.rotation.z = Math.PI / 2; cart.add(ax); const w = new THREE.Mesh(new THREE.CylinderGeometry(.12, .12, .06, 12), new THREE.MeshStandardMaterial({ color: '#222' })); ax.add(w); cw.push(w); }
  S.cart = { g: cart, set(z, dist) { cart.position.set(0, 0, z); cw.forEach(w => w.rotation.y = dist / .12); } };
  const P = (i, x = {}) => ({ body: ['#3a4a6a', '#6a3a3a', '#2f5a48', '#7a5a2a', '#4a3a5a', '#5a6a7a'][i % 6], hair: ['helmet', 'bob', 'bun', 'curly', 'helmet', 'gray'][i % 6], hairCol: ['#2a1c10', '#6a3a1a', '#1a1a1a', '#8a5a2a', '#3a2a1a', '#4a3a2a'][i % 6], seed: 700 + i * 1.7, expr: 'angry', arms: 'raise', walk: true, collar: i % 2 === 0, ...x });
  S.chars = {}; for (let i = 0; i < 6; i++) S.chars['p' + i] = new Char(S, P(i, i === 0 ? { arms: 'box' } : {}), 2.3);
  S.z0 = z0; S.reset = () => { }; S.update = () => { setDusk(0); };
  return S;
}

// ================= SECURITY CHECKPOINT =================
export function buildCheckpoint() {
  const S = new THREE.Scene(); S.background = new THREE.Color('#dfe8f2'); S.fog = new THREE.Fog('#e8eef6', 40, 120);
  S.add(new THREE.HemisphereLight('#ffffff', '#c4ccd8', 1.5)); const pl = new THREE.PointLight('#fff6e8', 60, 50, 1.2); pl.position.set(0, 5.5, 2); S.add(pl);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(80, 80), new THREE.MeshStandardMaterial({ map: tex(256, 256, (c, W) => { c.fillStyle = '#d9d7d0'; c.fillRect(0, 0, W, W); c.strokeStyle = 'rgba(120,115,105,.45)'; c.lineWidth = 3; c.strokeRect(0, 0, W, W); grain(c, W, W, .06, 1200); }, [30, 30]), roughness: .25, metalness: .1 })); floor.rotation.x = -Math.PI / 2; S.add(floor);
  const back = new THREE.Mesh(new THREE.PlaneGeometry(60, 9), new THREE.MeshStandardMaterial({ map: tex(1024, 256, (c, W, H) => { c.fillStyle = '#cdd6e0'; c.fillRect(0, 0, W, H); const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#6fb4f2'); g.addColorStop(1, '#e4f3ff'); c.fillStyle = g; for (let k = 0; k < 9; k++) c.fillRect(20 + k * 112, 20, 96, 190); c.fillStyle = '#7d8a98'; for (let k = 0; k <= 9; k++) c.fillRect(14 + k * 112, 14, 8, 200); }), emissive: '#ffffff', emissiveIntensity: .25, roughness: .6 })); back.position.set(0, 4.5, -18); S.add(back);
  const ceil = new THREE.Mesh(new THREE.PlaneGeometry(80, 80), new THREE.MeshStandardMaterial({ color: '#f4f4f0' })); ceil.rotation.x = Math.PI / 2; ceil.position.y = 7.5; S.add(ceil);
  for (let i = 0; i < 8; i++) { const lg = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 14), new THREE.MeshBasicMaterial({ color: '#fffbee' })); lg.rotation.x = Math.PI / 2; lg.position.set(-9 + i * 2.6, 7.45, -2); S.add(lg); }
  const sg = ibox(11, 1.8, .25, { color: '#1a4a8a', front: face('#1a4a8a', (c, W, H) => { c.fillStyle = '#fff'; c.font = '900 64px Montserrat'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('SECURITY CHECKPOINT', W / 2, H / 2); }, { w: 1024, h: 160, border: false }) }); sg.position.set(0, 5.6, -9); S.add(sg); const sg2 = sg.clone(); sg2.rotation.y = Math.PI; sg2.position.z = -8.8; S.add(sg2);
  const solid = []; S.solid = solid;
  // X-ray belt (conveyor): belt texture scrolls at belt speed, bins ride it at the same speed
  const BV = .45; S.BV = BV;
  const beltT = tex(64, 256, (c, W, H) => { c.fillStyle = '#23262c'; c.fillRect(0, 0, W, H); c.fillStyle = '#34383f'; for (let i = 0; i < 16; i++) c.fillRect(0, i * 16, W, 6); }, [1, 6]);
  const belt = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 12), new THREE.MeshStandardMaterial({ map: beltT, roughness: .8 })); belt.rotation.x = -Math.PI / 2; belt.position.set(2.6, 1.0, -3); S.add(belt); S.belt = belt;
  const bx = ibox(1.5, .9, 12, { color: '#8e959e' }); bx.position.set(2.6, .45, -3); S.add(bx); solid.push(bx);
  const xr = ibox(2.0, 1.7, 3.4, { color: '#3c4a5a' }); xr.position.set(2.6, 1.9, -3); S.add(xr); solid.push(xr); const tun = ibox(1.5, 1.1, 3.5, { color: '#10141a' }); tun.position.set(2.6, 1.75, -3); S.add(tun);
  const mon = ibox(.9, .7, .1, { color: '#0e1a14', front: face('#0e1a14', (c, W, H) => { c.fillStyle = '#58ff9a'; c.font = '900 40px Montserrat'; c.textAlign = 'center'; c.fillText('SCAN', W / 2, 52); c.strokeStyle = '#58ff9a'; c.lineWidth = 3; c.strokeRect(20, 70, W - 40, H - 90); }, { w: 192, h: 160, border: false }), }, { frontEmis: .9 }); mon.position.set(1.2, 2.2, -1.2); mon.rotation.y = .5; S.add(mon);
  S.bins = []; for (let i = 0; i < 5; i++) { const b = ibox(.7, .16, .5, { color: '#2e8bd9' }); const bag = ibox(.5, .22, .34, { color: ['#d83a3a', '#2a2d33', '#37a84a', '#e0a020', '#7a4aa8'][i] }); bag.position.y = .2; b.add(bag); S.add(b); S.bins.push(b); }
  // metal detector arch
  const arch = new THREE.Group(); arch.position.set(-1.6, 0, -3); S.add(arch); for (const s of [-1, 1]) { const p = ibox(.35, 2.3, .6, { color: '#c8ccd2' }); p.position.set(s * .6, 1.15, 0); arch.add(p); } const top = ibox(1.6, .3, .6, { color: '#c8ccd2' }); top.position.y = 2.3; arch.add(top); const gl = glowSprite('#39e07a', .6, .9); gl.position.set(0, 2.3, .35); arch.add(gl); S.archGlow = gl;
  // stanchions
  for (let i = 0; i < 8; i++) { const p = new THREE.Mesh(new THREE.CylinderGeometry(.05, .07, 1.0, 8), new THREE.MeshStandardMaterial({ color: '#c9a640', metalness: .6, roughness: .3 })); p.position.set(-4.4, .5, -.5 + i * 1.1); S.add(p); const q = p.clone(); q.position.x = -2.9; S.add(q); }
  const ST = (i, x = {}) => ({ body: '#24488a', hair: ['bald', 'helmet', 'bun'][i % 3], hairCol: '#2a1c10', hat: 'milcap', hatCol: '#1a3568', collar: true, tie: '#101820', seed: 900 + i * 1.7, expr: 'neutral', ...x });
  const TR = (i, x = {}) => ({ body: ['#3a4a6a', '#6a3a3a', '#2f5a48', '#7a5a2a', '#4a3a5a', '#5a6a7a'][i % 6], hair: ['helmet', 'bob', 'bun', 'curly', 'helmet', 'gray'][i % 6], hairCol: ['#2a1c10', '#6a3a1a', '#1a1a1a', '#8a5a2a', '#3a2a1a', '#4a3a2a'][i % 6], seed: 950 + i * 1.7, ...x });
  S.chars = { o0: new Char(S, ST(0, { arms: 'point' }), 2.3), o1: new Char(S, ST(1, { arms: 'down' }), 2.3), o2: new Char(S, ST(2, { arms: 'gesture' }), 2.3), t0: new Char(S, TR(0, { arms: 'box', expr: 'worried' }), 2.3), t1: new Char(S, TR(1, { arms: 'phone', expr: 'worried' }), 2.3), t2: new Char(S, TR(2, { arms: 'box', expr: 'worried' }), 2.3), t3: new Char(S, TR(3, { arms: 'down', expr: 'worried' }), 2.3) };
  S.reset = () => { };
  S.update = (t) => { setDusk(0); belt.material.map.offset.y = (t * BV / 12 * 6) % 1; belt.material.map.needsUpdate = false; S.bins.forEach((b, i) => { b.position.set(2.6, 1.1, 3 - ((i * 2.4 + t * BV) % 12)); }); S.archGlow.material.opacity = .55 + .35 * Math.sin(t * 6); };
  return S;
}

// ================= AFGHANISTAN VALLEY =================
export function buildAfghan() {
  const S = new THREE.Scene(); S.background = new THREE.Color('#9ccaf0'); S.fog = new THREE.Fog('#e6ddc8', 500, 4200); sky(S, '#2f7fd8', '#8ec4ee', '#f2e8d0', '#e4d8bc');
  dayLights(S, 1.25, 2.6, [-300, 500, 300]); clouds(S, 10, [-1500, 1500, -2600, -600], 420, 800, 1.2, 5);
  const H = (x, z) => { const w = Math.abs(x); const wall = sm((w - 110) / 520); const r = ridged(x * .003 + 1.2, z * .003 + 4.1, 5); const n = fbm(x * .01, z * .01, 3); return (wall * (160 + 760 * r) + n * 6) * (1 - .0) - 2 + (w < 90 ? 0 : n * 8) - (w < 60 ? 2 : 0); };
  S.h = H;
  terrain(S, { W: 3000, D: 4200, nx: 190, nz: 230, cz: -1200, h: H, col: (x, y, z, ny) => { const sl = 1 - ny; if (y > 520) return '#f2f4f8'; if (sl > .38) return y > 300 ? '#8d8272' : '#a9967a'; if (Math.abs(x) < 40) return '#92ad60'; if (y > 200) return '#b7a283'; return ['#cdb98f', '#c4af85', '#d4c196'][Math.floor(hash(Math.floor(x / 40) * 3.1 + Math.floor(z / 40)) * 3)]; } });
  const river = new THREE.Mesh(new THREE.PlaneGeometry(14, 4200), new THREE.MeshStandardMaterial({ color: '#4aa6d8', roughness: .2, metalness: .1, emissive: '#2a6a9a', emissiveIntensity: .25 })); river.rotation.x = -Math.PI / 2; river.position.set(-28, H(-28, -300) + .2, -1200); S.add(river);
  const solid = []; S.solid = solid;
  const mud = ['#c9b184', '#bfa578', '#d3bc92']; for (let i = 0; i < 16; i++) { const x = (i % 2 ? 55 : -85) + hash(i) * 30, z = -40 - i * 55 - hash(i + 3) * 40; const b = ibox(10 + hash(i) * 6, 5 + hash(i + 2) * 2, 8 + hash(i + 5) * 4, { color: mud[i % 3] }); b.position.set(x, H(x, z) + 2.8, z); S.add(b); solid.push(b); }
  for (let i = 0; i < 20; i++) { const x = -60 + hash(i * 3) * 130, z = 40 - hash(i * 7) * 900; if (Math.abs(x) < 30 || z > -20) continue; treeAt(S, x, z, 1.2 + hash(i) * .7, H(x, z)); }
  // base pad + flag + GIs
  const pad = new THREE.Mesh(new THREE.CircleGeometry(24, 28), new THREE.MeshStandardMaterial({ color: '#b9a57e', roughness: 1 })); pad.rotation.x = -Math.PI / 2; pad.position.set(38, H(38, 20) + .12, 20); S.add(pad);
  S.flag = new FlagA(S, 'us', 3.2, 2.1, true, 9).at(48, H(48, 12), 12);
  S.jeeps = [jeep(S, '#c7b080'), jeep(S, '#bfa878')];
  S.helis = [heli(S, { col: '#5d6c4a' }), heli(S, { col: '#5d6c4a' })]; S.dust = dust(S, 14, '#cdb88c');
  S.jets = [jet(S, { col: '#b4bcc6', tip: '#1f3a8a' }), jet(S, { col: '#b4bcc6', tip: '#1f3a8a' })];
  S.chars = {}; for (let i = 0; i < 5; i++) S.chars['g' + i] = new Char(S, GI(i, { hat: 'nvg', hatCol: '#a89a72', body: '#9a9068', vest: '#6a6446', arms: i % 2 ? 'rifle' : 'down' }), 2.4);
  S.reset = () => { S.helis.forEach(h => h.g.visible = true); S.jets.forEach(j => j.g.visible = true); };
  S.update = (t) => { setDusk(0); S.flag.wave(t, .3); };
  return S;
}

// ================= GLOBE (India-POV Natural Earth texture) =================
export const MAPW = {};
export async function loadWorld() {
  const img = new Image(); img.src = 'assets/map_world.png'; await img.decode();
  const t = new THREE.Texture(img); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; t.generateMipmaps = true; t.minFilter = THREE.LinearMipmapLinearFilter; t.needsUpdate = true; MAPW.tex = t;
}
export const AIRPORTS = [[40.64, -73.78], [51.47, -.46], [49.0, 2.55], [50.03, 8.57], [25.25, 55.36], [28.56, 77.1], [19.09, 72.87], [1.36, 103.99], [35.55, 139.78], [40.08, 116.6], [-33.94, 151.18], [-23.43, -46.47], [-26.14, 28.25], [33.94, -118.4], [43.68, -79.63], [19.44, -99.07], [30.12, 31.4], [41.26, 28.74], [40.47, -3.56], [22.31, 113.92], [37.46, 126.44], [-1.32, 36.93], [6.58, 3.32], [-33.39, -70.79], [55.97, 37.41], [-37.67, 144.84], [13.69, 100.75], [24.96, 46.7]];
export const PLACES = { nyc: [40.71, -74.0], dc: [38.9, -77.04], pa: [40.05, -78.9], kabul: [34.55, 69.2], bos: [42.36, -71.0], ewr: [40.69, -74.17], iad: [38.95, -77.46] };
export function buildGlobe9() {
  const S = new THREE.Scene(); S.background = new THREE.Color('#8ec8f0'); sky(S, '#2f7fd8', '#7fc0f0', '#e4f3ff', '#cfe6f7');
  S.add(new THREE.HemisphereLight('#ffffff', '#9fc4e8', 1.1)); const sun = new THREE.DirectionalLight('#fff4dc', 2.2); S.add(sun); S.add(sun.target);
  const globe = new THREE.Mesh(new THREE.SphereGeometry(GR, 128, 96), new THREE.MeshStandardMaterial({ map: MAPW.tex, roughness: .9, metalness: 0, emissive: '#ffffff', emissiveMap: MAPW.tex, emissiveIntensity: .32 })); S.add(globe);
  S.add(new THREE.Mesh(new THREE.SphereGeometry(GR * 1.03, 48, 32), new THREE.MeshBasicMaterial({ color: '#cfeaff', transparent: true, opacity: .28, side: THREE.BackSide, depthWrite: false })));
  S.P = (lat, lon, alt = 0) => ll(lon, lat, GR + alt);
  const up = new THREE.Vector3(0, 1, 0);
  const mkPin = (lat, lon, col, sc = 1) => {
    const g = new THREE.Group(); g.position.copy(ll(lon, lat, GR)); g.quaternion.setFromUnitVectors(up, ll(lon, lat, 1)); g.visible = false; S.add(g); const inner = new THREE.Group(); g.add(inner);
    const cone = new THREE.Mesh(new THREE.ConeGeometry(.9 * sc, 3.0 * sc, 12), new THREE.MeshStandardMaterial({ color: col, roughness: .3, emissive: col, emissiveIntensity: .5 })); cone.rotation.x = Math.PI; cone.position.y = 1.5 * sc; inner.add(cone);
    const head = new THREE.Mesh(new THREE.SphereGeometry(1.35 * sc, 16, 12), new THREE.MeshStandardMaterial({ color: col, roughness: .25, emissive: col, emissiveIntensity: .6 })); head.position.y = 3.7 * sc; inner.add(head);
    const ring = new THREE.Mesh(new THREE.RingGeometry(1.6 * sc, 2.0 * sc, 40), new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false })); ring.rotation.x = -Math.PI / 2; ring.position.y = .25; g.add(ring);
    const glow = glowSprite(col, 9 * sc, .5); glow.position.y = 3.6 * sc; inner.add(glow);
    return { g, set(t, t0, h0 = 14) { const tau = t - t0; g.visible = tau >= 0; if (!g.visible) return; const tf = Math.sqrt(2 * h0 / 90); let y; if (tau < tf) y = h0 - .5 * 90 * tau * tau; else { const u = tau - tf; y = Math.abs(Math.sin(u * 9)) * h0 * .28 * Math.exp(-u * 6); } inner.position.y = y; const pu = (tau * 1.1) % 1; ring.scale.setScalar(1 + pu * 3.4); ring.material.opacity = tau > tf ? (1 - pu) * .8 : 0; } };
  };
  S.pins = { nyc: mkPin(...PLACES.nyc, '#ff3a2a', .5), dc: mkPin(...PLACES.dc, '#ff3a2a', .5), pa: mkPin(...PLACES.pa, '#ff3a2a', .5), kabul: mkPin(...PLACES.kabul, '#ffd23f', .9) };
  S.air = AIRPORTS.map(([la, lo]) => Object.assign(mkPin(la, lo, '#2f8fff', .9), { lon: lo }));
  const arcPts = (a, b, hk, n = 90) => { const A = ll(a[1], a[0], 1), B = ll(b[1], b[0], 1); const ang = A.angleTo(B); const pts = []; for (let i = 0; i <= n; i++) { const u = i / n; const s = Math.sin(ang); const v = s < 1e-4 ? A.clone() : A.clone().multiplyScalar(Math.sin((1 - u) * ang) / s).add(B.clone().multiplyScalar(Math.sin(u * ang) / s)); pts.push(v.normalize().multiplyScalar(GR + 1 + Math.sin(u * Math.PI) * GR * hk * ang / Math.PI * 2.2)); } return pts; };
  S.arc = (a, b, col, hk = .35, rad = .8) => { const curve = new THREE.CatmullRomCurve3(arcPts(a, b, hk)); const geo = new THREE.TubeGeometry(curve, 90, rad, 6, false); const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: col, emissive: col, emissiveIntensity: .9, roughness: .4 })); m.visible = false; S.add(m); return { m, curve, set(k) { m.visible = k > 0; geo.setDrawRange(0, Math.floor(Math.min(1, k) * 90) * 36); }, at(u) { return curve.getPointAt(Math.max(0, Math.min(1, u))); } }; };
  S.arcWar = S.arc(PLACES.dc, PLACES.kabul, '#ffd23f', .45, 1.0);
  S.flightArcs = [S.arc(PLACES.bos, PLACES.nyc, '#ff4a3a', .6, .45), S.arc([42.3, -71.2], [40.6, -74.2], '#ff7a3a', 1.1, .45), S.arc(PLACES.iad, PLACES.dc, '#ff4a3a', .8, .45), S.arc(PLACES.ewr, PLACES.pa, '#ff7a3a', .5, .45)];
  const jj = jet(S, { col: '#e9eef4' }); S.remove(jj.g); jj.g.rotation.set(0, Math.PI, 0); jj.g.scale.setScalar(.9); const jg = new THREE.Group(); jg.add(jj.g); jg.visible = false; S.add(jg); S.jetIcon = jg;
  S.placeJet = (arc, u) => { const p = arc.at(u), q = arc.at(Math.min(1, u + .02)); jg.visible = u > 0 && u < 1.001; jg.position.copy(p); jg.up.copy(p.clone().normalize()); jg.lookAt(q); };
  // glowing US border
  S.reset = () => { Object.values(S.pins).forEach(p => p.g.visible = false); S.air.forEach(p => p.g.visible = false); S.arcWar.set(0); S.flightArcs.forEach(a => a.set(0)); jg.visible = false; };
  S.update = (t, cam) => { const d = cam.position.clone().normalize(); sun.position.copy(d.clone().multiplyScalar(400).add(new THREE.Vector3(120, 160, 60))); const ps = Math.max(.7, Math.min(3.2, (cam.position.length() - 90) / 60)); [...Object.values(S.pins), ...S.air].forEach(p => p.g.scale.setScalar(ps)); };
  S.chars = {};
  return S;
}
