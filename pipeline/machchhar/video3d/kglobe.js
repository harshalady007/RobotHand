import * as THREE from 'three';
import { GR, ll, jet, tex, glowSprite, sky, clouds, hash, FlagA } from './kamerica.js';

export const MAPW = {};
export async function loadWorld() {
  const img = new Image(); img.src = 'assets/map_world.png'; await img.decode();
  const t = new THREE.Texture(img); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; t.generateMipmaps = true; t.minFilter = THREE.LinearMipmapLinearFilter; t.needsUpdate = true; MAPW.tex = t;
  MAPW.us = (await (await fetch('assets/us_outline.json')).json()).us;
}
// [key, name, lat, lon]  (approximate site locations, reel scale)
export const DC = [38.9, -77.04];
export const BASES = [
  ['ramstein', 'Ramstein', 49.44, 7.6], ['lakenheath', 'Lakenheath', 52.41, .56], ['aviano', 'Aviano', 46.03, 12.6], ['rota', 'Rota', 36.64, -6.35], ['naples', 'Naples', 40.85, 14.27], ['poland', 'Redzikowo', 54.48, 17.1], ['incirlik', 'Incirlik', 37.0, 35.43], ['souda', 'Souda Bay', 35.53, 24.15],
  ['yokosuka', 'Yokosuka', 35.29, 139.67], ['kadena', 'Kadena', 26.36, 127.77], ['misawa', 'Misawa', 40.7, 141.37], ['humphreys', 'Camp Humphreys', 36.96, 127.03], ['guam', 'Guam', 13.58, 144.93], ['darwin', 'Darwin', -12.43, 130.87], ['singapore', 'Singapore', 1.45, 103.82], ['subic', 'Subic Bay', 14.8, 120.27],
  ['udeid', 'Al Udeid', 25.12, 51.32], ['bahrain', 'Bahrain', 26.2, 50.6], ['djibouti', 'Djibouti', 11.55, 43.15], ['diego', 'Diego Garcia', -7.32, 72.42], ['kuwait', 'Kuwait', 29.35, 47.52], ['uae', 'Al Dhafra', 24.25, 54.55],
  ['gitmo', 'Guantanamo', 19.9, -75.2], ['pituffik', 'Pituffik', 76.53, -68.7], ['sotocano', 'Soto Cano', 14.38, -87.62], ['hawaii', 'Pearl Harbor', 21.35, -157.95], ['alaska', 'Eielson', 64.66, -147.1],
  ['lajes', 'Lajes', 38.76, -27.09], ['keflavik', 'Keflavik', 63.98, -22.6], ['romania', 'Deveselu', 44.08, 24.1], ['kogal', 'M. Kogalniceanu', 44.36, 28.49], ['vaernes', 'Vaernes', 63.45, 10.9], ['sultan', 'Prince Sultan', 24.06, 47.58], ['muwaffaq', 'Muwaffaq', 31.83, 36.78], ['manda', 'Manda Bay', -2.25, 40.9], ['pinegap', 'Pine Gap', -23.8, 133.74], ['estonia', 'Amari', 59.26, 24.2], ['lith', 'Siauliai', 55.9, 23.4], ['hungary', 'Papa', 47.36, 17.5], ['bulg', 'Novo Selo', 42.1, 26.2], ['spain2', 'Moron', 37.17, -5.6], ['belgium', 'Chievres', 50.58, 3.83], ['nl', 'Volkel', 51.65, 5.7], ['oman', 'Thumrait', 17.67, 54.02], ['niger', 'Agadez', 16.97, 7.99], ['peru', 'Callao', -12.05, -77.15], ['colombia', 'Tolemaida', 4.27, -74.65], ['honshu', 'Atsugi', 35.45, 139.45], ['okinawa2', 'Futenma', 26.28, 127.76], ['osan', 'Osan', 37.09, 127.03], ['wake', 'Wake Is.', 19.28, 166.65],
];
export const BASE = Object.fromEntries(BASES.map(b => [b[0], b]));

export function buildGlobe() {
  const S = new THREE.Scene(); S.background = new THREE.Color('#8ec8f0');
  sky(S, '#2f7fd8', '#7fc0f0', '#e4f3ff', '#cfe6f7');
  const hl = new THREE.HemisphereLight('#ffffff', '#9fc4e8', 1.1); S.add(hl);
  const sun = new THREE.DirectionalLight('#fff4dc', 2.2); S.add(sun); S.add(sun.target);
  const globe = new THREE.Mesh(new THREE.SphereGeometry(GR, 128, 96), new THREE.MeshStandardMaterial({ map: MAPW.tex, roughness: .9, metalness: 0, emissive: '#ffffff', emissiveMap: MAPW.tex, emissiveIntensity: .32 })); S.add(globe);
  const halo = new THREE.Mesh(new THREE.SphereGeometry(GR * 1.03, 48, 32), new THREE.MeshBasicMaterial({ color: '#cfeaff', transparent: true, opacity: .28, side: THREE.BackSide, depthWrite: false })); S.add(halo);
  const hg = glowSprite('#bfe3ff', GR * 3.0, .5); hg.position.set(0, 0, 0); S.add(hg); S.halo = hg;
  S.P = (lon, lat, alt = 0) => ll(lon, lat, GR + alt);
  const up = new THREE.Vector3(0, 1, 0);
  // ---- pins (stand on the surface, bounce in) ----
  const pins = {};
  const mkPin = (key, lon, lat, col, sc = 1) => {
    const g = new THREE.Group(); const n = ll(lon, lat, 1); g.position.copy(ll(lon, lat, GR)); g.quaternion.setFromUnitVectors(up, n); g.visible = false; S.add(g);
    const inner = new THREE.Group(); g.add(inner);
    const cone = new THREE.Mesh(new THREE.ConeGeometry(.9 * sc, 3.0 * sc, 12), new THREE.MeshStandardMaterial({ color: col, roughness: .3, emissive: col, emissiveIntensity: .5 })); cone.rotation.x = Math.PI; cone.position.y = 1.5 * sc; inner.add(cone);
    const head = new THREE.Mesh(new THREE.SphereGeometry(1.35 * sc, 16, 12), new THREE.MeshStandardMaterial({ color: col, roughness: .25, emissive: col, emissiveIntensity: .6 })); head.position.y = 3.7 * sc; inner.add(head);
    const ring = new THREE.Mesh(new THREE.RingGeometry(1.6 * sc, 2.0 * sc, 40), new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false })); ring.rotation.x = -Math.PI / 2; ring.position.y = .25; g.add(ring);
    const glow = glowSprite(col, 9 * sc, .5); glow.position.y = 3.6 * sc; inner.add(glow);
    const mats = [cone.material, head.material, ring.material, glow.material]; const o = { g, key, mats, set(t, t0, h0 = 14) { const tau = t - t0; g.visible = tau >= 0 && t0 < 1e8; if (!g.visible) return; const G = 90; let y; const tf = Math.sqrt(2 * h0 / G); if (tau < tf) y = h0 - .5 * G * tau * tau; else { const v = G * tf * .32, u = tau - tf, tb = 2 * v / G; y = u < tb ? v * u - .5 * G * u * u : 0; } inner.position.y = Math.max(0, y); const r = (tau * 1.3) % 1; ring.material.opacity = tau > tf ? (1 - r) * .85 : 0; ring.scale.setScalar(1 + r * 3); }, setScale(s) { g.scale.setScalar(s); } };
    pins[key] = o; return o;
  };
  mkPin('dc', DC[1], DC[0], '#ffd23f', 1.5);
  BASES.forEach(b => mkPin(b[0], b[3], b[2], '#2f6fe0', 1));
  S.pins = pins;
  const BLUE = new THREE.Color('#2f6fe0'), RED = new THREE.Color('#ff2a1a'); S.tint = (k) => { Object.values(pins).forEach(p => { if (p.key === 'dc') return; p.mats.forEach(m => { m.color.copy(BLUE).lerp(RED, k); if (m.emissive) m.emissive.copy(BLUE).lerp(RED, k); }); }); };
  // ---- arcs (great-circle, lofted) ----
  const arcs = {};
  const arcPts = (a, b, hk, n = 90) => { const A = ll(a[1], a[0], 1), B = ll(b[1], b[0], 1); const ang = A.angleTo(B); const pts = []; for (let i = 0; i <= n; i++) { const u = i / n; const s = Math.sin(ang); const v = s < 1e-4 ? A.clone() : A.clone().multiplyScalar(Math.sin((1 - u) * ang) / s).add(B.clone().multiplyScalar(Math.sin(u * ang) / s)); pts.push(v.normalize().multiplyScalar(GR + 1.2 + Math.sin(Math.PI * u) * hk * ang * GR * .5)); } return pts; };
  const mkArc = (key, a, b, col, hk = .55, rad = .65) => {
    const pts = arcPts(a, b, hk); const curve = new THREE.CatmullRomCurve3(pts); const geo = new THREE.TubeGeometry(curve, 90, rad, 6, false);
    const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: col, emissive: col, emissiveIntensity: .9, roughness: .4 })); m.visible = false; S.add(m);
    const total = geo.index.count; const o = { m, pts, curve, ang: ll(a[1], a[0], 1).angleTo(ll(b[1], b[0], 1)), set(k) { m.visible = k > 0; geo.setDrawRange(0, Math.floor(Math.min(1, k) * 90) * 36); }, at(u) { return curve.getPointAt(Math.max(0, Math.min(1, u))); }, tan(u) { return curve.getTangentAt(Math.max(.001, Math.min(.999, u))); } };
    arcs[key] = o; return o;
  };
  S.arcs = arcs;
  mkArc('dcDarwin', DC, [BASE.darwin[2], BASE.darwin[3]], '#ffd23f', .6, .7);
  mkArc('dcGuam', DC, [BASE.guam[2], BASE.guam[3]], '#ffd23f', .5, .6);
  // hop chain across the Pacific (bases erase distance)
  const chain = [['dcHi', DC, [BASE.hawaii[2], BASE.hawaii[3]]], ['hiGuam', [BASE.hawaii[2], BASE.hawaii[3]], [BASE.guam[2], BASE.guam[3]]], ['guamDar', [BASE.guam[2], BASE.guam[3]], [BASE.darwin[2], BASE.darwin[3]]]];
  chain.forEach(([k, a, b]) => mkArc(k, a, b, '#47e08a', .35, .6));
  // message arcs: base -> rival capitals (red)
  const MOSCOW = [55.75, 37.62], BEIJING = [39.9, 116.4];
  [['msgPol', BASE.poland, MOSCOW], ['msgRom', BASE.romania, MOSCOW], ['msgKor', BASE.humphreys, BEIJING], ['msgJp', BASE.kadena, BEIJING], ['msgGu', BASE.guam, BEIJING], ['msgEst', BASE.estonia, MOSCOW]].forEach(([k, a, b]) => mkArc(k, [a[2], a[3]], b, '#ff4a3a', .22, .5));
  // ---- travelling icons ----
  const jg = new THREE.Group(); const jj = jet(S, { col: '#e9eef4' }); S.remove(jj.g); jj.g.rotation.set(0, Math.PI, 0); jj.g.scale.setScalar(.8); jg.add(jj.g); jg.visible = false; S.add(jg); S.jetIcon = jg; S.jetObj = jj;
  S.placeJet = (arc, u) => { const p = arc.at(u), q = arc.at(Math.min(1, u + .02)); jg.visible = u > 0 && u < 1.001; jg.position.copy(p); jg.up.copy(p.clone().normalize()); jg.lookAt(q); };
  const envT = tex(160, 110, (c) => { c.fillStyle = '#fffdf2'; c.strokeStyle = '#2a1a12'; c.lineWidth = 7; c.beginPath(); c.roundRect(8, 10, 144, 90, 10); c.fill(); c.stroke(); c.beginPath(); c.moveTo(8, 14); c.lineTo(80, 64); c.lineTo(152, 14); c.stroke(); c.fillStyle = '#d9322a'; c.beginPath(); c.arc(80, 66, 14, 0, 7); c.fill(); });
  S.env = []; for (let i = 0; i < 6; i++) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: envT, transparent: true, depthWrite: false })); s.scale.set(9, 6.2, 1); s.visible = false; S.add(s); S.env.push(s); }
  // ---- shipping lanes: dots flowing along surface polylines ----
  const lanes = [];
  const mkLane = (pts, col, n = 22) => { const v = pts.map(p => ll(p[1], p[0], GR + .8)); const segs = []; let L = 0; const cum = [0]; const dense = []; for (let i = 0; i < v.length - 1; i++) { const A = v[i].clone().normalize(), B = v[i + 1].clone().normalize(); const ang = A.angleTo(B); const m = Math.max(2, Math.ceil(ang * 40)); for (let k = 0; k < m; k++) { const u = k / m; const s = Math.sin(ang); dense.push(A.clone().multiplyScalar(Math.sin((1 - u) * ang) / s).add(B.clone().multiplyScalar(Math.sin(u * ang) / s)).normalize().multiplyScalar(GR + .9)); } } dense.push(v[v.length - 1]); for (let i = 1; i < dense.length; i++) { L += dense[i].distanceTo(dense[i - 1]); cum.push(L); }
    const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(dense), new THREE.LineBasicMaterial({ color: col, transparent: true, opacity: .0 })); S.add(line);
    const dots = []; for (let i = 0; i < n; i++) { const s = new THREE.Mesh(new THREE.BoxGeometry(2.6, 1.0, 1.4), new THREE.MeshStandardMaterial({ color: col, emissive: col, emissiveIntensity: .8 })); s.visible = false; S.add(s); dots.push(s); }
    const o = { dense, cum, L, dots, line, set(k, t) { line.material.opacity = k * .9; dots.forEach((d, i) => { const dd = ((i / n) * L + t * 22) % L; d.visible = k > 0 && dd / L <= k; if (!d.visible) return; let j = 1; while (j < cum.length - 1 && cum[j] < dd) j++; const u = (dd - cum[j - 1]) / (cum[j] - cum[j - 1] + 1e-9); d.position.lerpVectors(dense[j - 1], dense[j], Math.min(1, u)); const nrm = d.position.clone().normalize(); d.up.copy(nrm); d.lookAt(d.position.clone().add(dense[j].clone().sub(dense[j - 1]))); }); } };
    lanes.push(o); return o; };
  S.lanes = {
    asiaEu: mkLane([[31, 122], [22, 114], [10, 108], [1.3, 104], [5.5, 95], [6, 80], [12.5, 51], [14, 42.5], [27, 34], [31.5, 32.4], [35, 18], [36, -5.5], [44, -9], [50, -1.5], [51.9, 4]], '#ffb02e'),
    pacific: mkLane([[35, 139.7], [40, 170], [45, -170], [42, -140], [34, -120.5]], '#ff7a3a'),
    gulf: mkLane([[29, 49], [26.4, 56.5], [23, 62], [12.5, 51], [8, 70], [6, 80]], '#ffd23f'),
    atl: mkLane([[40.5, -73.8], [44, -45], [47, -20], [50, -5], [51.9, 4]], '#ff9a3a'),
  };
  // ---- glowing US border ring ----
  { const pts = MAPW.us.filter((_, i) => i % 3 === 0).map(c => ll(c[0], c[1], GR + .8)); const crv = new THREE.CatmullRomCurve3(pts, true); const g = new THREE.TubeGeometry(crv, 260, .5, 6, true); const m = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ color: '#ffffff', emissive: '#7fd0ff', emissiveIntensity: 1.2 })); m.visible = false; S.add(m); S.usRing = m; }
  // ---- ring of influence (rival rings) ----
  const rings = []; for (const [lon, lat] of [[104, 35], [90, 61]]) { const r = new THREE.Mesh(new THREE.RingGeometry(14, 15.5, 60), new THREE.MeshBasicMaterial({ color: '#ff3a2a', transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false })); const g = new THREE.Group(); g.position.copy(ll(lon, lat, GR + 1)); g.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), ll(lon, lat, 1)); g.add(r); g.visible = false; S.add(g); rings.push({ g, r }); } S.rivalRings = rings;
  S.reset = () => {
    Object.values(pins).forEach(p => p.g.visible = false); Object.values(arcs).forEach(a => a.set(0)); jg.visible = false; S.env.forEach(e => e.visible = false);
    Object.values(S.lanes).forEach(l => l.set(0, 0)); S.usRing.visible = false; rings.forEach(r => r.g.visible = false);
  };
  S.update = (t, cam) => {
    const d = cam.position.clone().normalize(); sun.position.copy(d.clone().multiplyScalar(400).add(new THREE.Vector3(120, 160, 60))); sun.target.position.set(0, 0, 0);
    S.usRing.material.emissiveIntensity = 1.0 + .5 * Math.sin(t * 6);
    const ps = Math.max(.85, Math.min(2.0, (cam.position.length() - 90) / 170)); Object.values(pins).forEach(p => p.setScale(ps));
  };
  S.chars = {};
  return S;
}
