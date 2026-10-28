import * as THREE from 'three';
import { hash, tex, face, ibox, glowSprite, grain, sm, lerp, fbm, ridged, terrain, clouds, lights, sky, jet, heli, house, FlagA, GI, PILOT, CREW, truck, jeep, cargoPlane, Char, star, smokeTrail } from './kamerica.js';

// jet with landing gear that retracts once airborne
export function mkJet(S, o = {}) {
  const j = jet(S, { col: o.col || '#b4bcc6', tip: o.tip || '#1f3a8a' });
  j.g.traverse(m => { if (m.material && m.material.metalness !== undefined) { m.material.metalness = .05; m.material.roughness = .7; } });
  const gear = new THREE.Group(); j.g.add(gear);
  const bm = new THREE.MeshStandardMaterial({ color: '#2a2d33', roughness: .8 });
  for (const [x, z] of [[0, -3.6], [-1.5, 1.8], [1.5, 1.8]]) { const l = new THREE.Mesh(new THREE.CylinderGeometry(.09, .09, .75, 6), bm); l.position.set(x, -.65, z); gear.add(l); const w = new THREE.Mesh(new THREE.CylinderGeometry(.26, .26, .2, 10), bm); w.rotation.z = Math.PI / 2; w.position.set(x, -1.0, z); gear.add(w); }
  const sh = new THREE.Mesh(new THREE.CircleGeometry(1, 20), new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: .3, depthWrite: false })); sh.rotation.x = -Math.PI / 2; sh.scale.set(7, 3.4, 1); S.add(sh);
  const o2 = { ...j, gear, sh, GY: 1.45,
    park(x, z, yaw = -Math.PI / 2) { j.g.position.set(x, 1.45, z); j.g.rotation.set(0, yaw, 0); gear.visible = true; sh.visible = j.g.visible; sh.position.set(x, .12, z); sh.rotation.z = -yaw; j.glow.material.opacity = 0; },
    fly(t, path, ab = .9) { const r = j.fly(t, path, ab); const p = j.g.position; gear.visible = p.y < 7; sh.visible = j.g.visible; sh.position.set(p.x, .12, p.z); sh.scale.set(7 * (1 - Math.min(.5, p.y / 120)), 3.4 * (1 - Math.min(.5, p.y / 120)), 1); sh.rotation.z = -j.g.rotation.y; sh.material.opacity = .3 * Math.max(0, 1 - p.y / 80); return r; },
    show(v) { j.g.visible = v; sh.visible = v; } };
  return o2;
}

export function buildBase() {
  const S = new THREE.Scene(); S.background = new THREE.Color('#8ec8f0'); S.fog = new THREE.Fog('#d4e8f6', 600, 3200);
  sky(S);
  lights(S, '#fff0d0', 2.5, '#c4e2ff', '#b4bca8', 1.2, [-80, 110, 90]);
  clouds(S, 16, [-1200, 1200, -1700, -400], 280, 560, 1.15, 3);
  // ---- terrain: flat airfield, hills far away ----
  const H = (x, z) => { const hz = sm((-z - 300) / 420), hx = sm((Math.abs(x) - 520) / 520); const r = ridged(x * .004 + 2, z * .004 + 7); let h = hz * (50 + 220 * r) + hx * (30 + 120 * r); return h; };
  S.h = H;
  const FIELD = ['#7cc04a', '#8cc84e', '#6fb444', '#97cf5a'];
  terrain(S, { W: 3400, D: 3000, nx: 170, nz: 150, cz: -500, h: H, col: (x, y, z, ny) => { const sl = 1 - ny; if (sl > .42) return y > 120 ? '#9a9487' : '#7f8a68'; if (y > 130) return '#cfd8d0'; if (y > 40) return '#5c9a44'; const cx = Math.floor(x / 60), cz = Math.floor(z / 50); return FIELD[Math.floor(hash(cx * 3.7 + cz * 1.9) * 4)]; } });
  // ---- tarmac ----
  const flat = (w, d, x, z, t, y = .08, ro = 1) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), new THREE.MeshStandardMaterial({ map: t, roughness: .95, polygonOffset: true, polygonOffsetFactor: -ro, polygonOffsetUnits: -ro })); m.rotation.x = -Math.PI / 2; m.position.set(x, y, z); S.add(m); return m; };
  const rwT = tex(2048, 128, (c, W, Hh) => { c.fillStyle = '#4b5059'; c.fillRect(0, 0, W, Hh); grain(c, W, Hh, .12, 5000); c.fillStyle = '#f4f4f0'; for (let x = 140; x < W - 140; x += 72) c.fillRect(x, Hh / 2 - 3, 40, 6); c.fillRect(0, 6, W, 4); c.fillRect(0, Hh - 10, W, 4); for (const s of [0, 1]) for (let k = 0; k < 6; k++) c.fillRect(s ? W - 90 : 30, 22 + k * 15, 60, 8); });
  flat(520, 33, 0, 0, rwT, .08, 2);
  const apT = tex(512, 256, (c, W, Hh) => { c.fillStyle = '#a9adb5'; c.fillRect(0, 0, W, Hh); grain(c, W, Hh, .1, 3000); c.strokeStyle = 'rgba(70,76,86,.45)'; c.lineWidth = 2; for (let i = 0; i <= 8; i++) { c.beginPath(); c.moveTo(i * W / 8, 0); c.lineTo(i * W / 8, Hh); c.stroke(); } for (let j = 0; j <= 4; j++) { c.beginPath(); c.moveTo(0, j * Hh / 4); c.lineTo(W, j * Hh / 4); c.stroke(); } c.strokeStyle = '#f2c230'; c.lineWidth = 5; c.beginPath(); c.moveTo(0, Hh * .62); c.lineTo(W, Hh * .62); c.stroke(); });
  flat(330, 66, 10, -62, apT, .07, 1);
  flat(330, 14, 10, -23, tex(256, 32, (c, W, Hh) => { c.fillStyle = '#555a63'; c.fillRect(0, 0, W, Hh); grain(c, W, Hh, .1, 600); c.fillStyle = '#f2c230'; c.fillRect(0, Hh / 2 - 1, W, 3); }), .075, 1);
  // ---- hangars (arched) ----
  const hangar = (x, z, sc = 1) => {
    const g = new THREE.Group(); g.position.set(x, 0, z); g.scale.setScalar(sc); S.add(g);
    const shellT = tex(256, 64, (c, W, Hh) => { c.fillStyle = '#cfd8e2'; c.fillRect(0, 0, W, Hh); c.fillStyle = '#9fb0c2'; for (let i = 0; i < 16; i++) c.fillRect(i * 16, 0, 3, Hh); c.fillStyle = '#d6422f'; c.fillRect(0, Hh - 10, W, 10); }, [1, 1]);
    const shell = new THREE.Mesh(new THREE.CylinderGeometry(15, 15, 36, 24, 1, true, Math.PI / 2, Math.PI), new THREE.MeshStandardMaterial({ map: shellT, side: THREE.DoubleSide, roughness: .6, flatShading: false })); shell.rotation.x = Math.PI / 2; g.add(shell);
    const doorT = tex(256, 256, (c, W, Hh) => { c.fillStyle = '#7c8794'; c.fillRect(0, 0, W, Hh); c.fillStyle = '#5a6572'; c.fillRect(W * .08, Hh * .5, W * .84, Hh * .5); c.strokeStyle = '#2a2a2a'; c.lineWidth = 4; for (let i = 1; i < 6; i++) { c.beginPath(); c.moveTo(W * .08 + i * W * .14, Hh * .5); c.lineTo(W * .08 + i * W * .14, Hh); c.stroke(); } c.fillStyle = '#f2c230'; for (let i = 0; i < 12; i++) c.fillRect(W * .08 + i * 20, Hh * .5, 10, 8); });
    for (const s of [-1, 1]) { const cap = new THREE.Mesh(new THREE.CircleGeometry(15, 24, 0, Math.PI), new THREE.MeshStandardMaterial(s > 0 ? { map: doorT, roughness: .7 } : { color: '#aab4c0', roughness: .7 })); cap.position.z = s * 18; if (s < 0) cap.rotation.y = Math.PI; g.add(cap); }
    return g;
  };
  [-110, -60, -10, 40].forEach(x => hangar(x, -108));
  // ---- tower ----
  const tw = new THREE.Group(); tw.position.set(-150, 0, -58); S.add(tw);
  const shaft = ibox(5, 20, 5, { color: '#dfe3e8' }); shaft.position.y = 10; tw.add(shaft);
  const cabT = face('#3a5a7a', (c, W, Hh) => { c.fillStyle = '#9fd0f0'; c.fillRect(8, 20, W - 16, Hh - 50); c.fillStyle = '#3a5a7a'; for (let i = 1; i < 5; i++) c.fillRect(i * W / 5 - 3, 20, 6, Hh - 50); }, { w: 256, h: 128 });
  const cab = ibox(10, 4, 10, { color: '#dfe3e8', side: cabT, front: cabT, back: cabT }); cab.position.y = 22; tw.add(cab);
  const roof = ibox(11.5, .7, 11.5, { color: '#c8402f' }); roof.position.y = 24.4; tw.add(roof);
  const mast = new THREE.Mesh(new THREE.CylinderGeometry(.15, .15, 4, 6), new THREE.MeshStandardMaterial({ color: '#222' })); mast.position.y = 27; tw.add(mast);
  const radar = ibox(7, .7, .4, { color: '#b8c0c8' }); radar.position.y = 29.2; tw.add(radar); S.radar = radar;
  const beacon = glowSprite('#ff3320', 9, 0); beacon.position.set(0, 25.4, 0); tw.add(beacon); S.beacon = beacon;
  // ---- barracks, tanks, trees ----
  [[-190, -160, 26, 14, 9], [-150, -165, 26, 14, 9], [-110, -170, 26, 14, 9], [110, -160, 30, 16, 10], [150, -170, 30, 16, 10]].forEach(([x, z, w, d, h], i) => house(S, x, 0, z, w, d, h, 0, ['#d8cdb6', '#c9d4dc', '#e6dcc8'][i % 3], '#8a4a3a'));
  for (const x of [190, 205, 220]) { const tk = new THREE.Mesh(new THREE.CylinderGeometry(7, 7, 10, 18), new THREE.MeshStandardMaterial({ color: '#f1f1ee', roughness: .5 })); tk.position.set(x, 5, -120); S.add(tk); const st = new THREE.Mesh(new THREE.CylinderGeometry(7.05, 7.05, 1.6, 18), new THREE.MeshStandardMaterial({ color: '#d6422f' })); st.position.set(x, 6, -120); S.add(st); }
  const tree = (x, z, s = 1) => { const tr = new THREE.Mesh(new THREE.CylinderGeometry(.4 * s, .55 * s, 4 * s, 7), new THREE.MeshStandardMaterial({ color: '#5a3f28' })); tr.position.set(x, 2 * s, z); S.add(tr); const fo = new THREE.Mesh(new THREE.IcosahedronGeometry(3.6 * s, 0), new THREE.MeshStandardMaterial({ color: ['#3f8f3a', '#4ca040', '#368432'][Math.floor(hash(x + z) * 3)], flatShading: true })); fo.position.set(x, 6.6 * s, z); fo.scale.set(1, 1.2, 1); S.add(fo); };
  for (let i = 0; i < 70; i++) { const x = -420 + hash(i * 1.3) * 840, z = -190 - hash(i * 2.9) * 120 - (i % 3) * 20; if (Math.abs(x) < 60 && z > -190) continue; tree(x, z, .9 + hash(i) * .8); }
  for (let i = 0; i < 40; i++) { const x = -480 + hash(i * 4.1) * 960, z = 40 + hash(i * 5.7) * 80; tree(x, z, .8 + hash(i * 2) * .9); }
  // ---- flags ----
  S.fl = { us: new FlagA(S, 'us', 5.2, 3.5, true, 10).at(-30, 0, -36), nato: new FlagA(S, 'nato', 5.2, 3.5, true, 10).at(-42, 0, -36), jp: new FlagA(S, 'jp', 5.2, 3.5, true, 10).at(-54, 0, -36), kr: new FlagA(S, 'kr', 5.2, 3.5, true, 10).at(-66, 0, -36) };
  // ---- movers ----
  S.jets = []; for (let i = 0; i < 18; i++) S.jets.push(mkJet(S));
  S.helis = [heli(S, { col: '#5d6c4a' }), heli(S, { col: '#5d6c4a' }), heli(S, { col: '#5d6c4a' })];
  S.trucks = []; for (let i = 0; i < 4; i++) S.trucks.push(truck(S, i % 2 ? '#6b7448' : '#77804f'));
  S.jeeps = [jeep(S), jeep(S, '#6f7a4e')];
  S.c17 = cargoPlane(S);
  S.dust = smokeTrail(S, 28, '#cfc8b8');
  // crates for loading
  S.crates = []; for (let i = 0; i < 6; i++) { const c = ibox(1.8, 1.4, 1.8, { color: ['#7f8b55', '#8a7a4a', '#5d6c4a'][i % 3] }); S.add(c); S.crates.push(c); }
  // ---- characters ----
  const ch = {}; for (let i = 0; i < 8; i++) ch['g' + i] = new Char(S, GI(i), 2.4);
  ch.pil0 = new Char(S, PILOT(0), 2.4); ch.pil1 = new Char(S, PILOT(1, { arms: 'raise' }), 2.4);
  for (let i = 0; i < 4; i++) ch['c' + i] = new Char(S, CREW(i), 2.4);
  ch.off = new Char(S, GI(2, { arms: 'point', hat: 'milcap', hatCol: '#3a4a36', body: '#4a5a3e', vest: undefined }), 2.4);
  S.chars = ch;
  S.hideAll = () => { S.jets.forEach(j => j.show(false)); S.helis.forEach(h => h.g.visible = false); S.trucks.forEach(t => t.g.visible = false); S.jeeps.forEach(t => t.g.visible = false); S.c17.g.visible = false; S.crates.forEach(c => c.visible = false); Object.values(S.fl).forEach(f => f.g.visible = false); S.dust.g.visible = false; };
  S.reset = S.hideAll;
  S.update = (t, cam) => { Object.values(S.fl).forEach((f, i) => f.wave(t + i * 1.3, .22)); S.radar.rotation.y = t * 2.6; };
  return S;
}
