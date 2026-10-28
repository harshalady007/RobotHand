// TSAR BOMBA sets A: space (Earth + shockwave laps), arctic (blast site, 1u = 100 m), sky (Tu-95, 1u = 1 m)
import * as THREE from 'three';
import { ConvexGeometry } from 'three/addons/geometries/ConvexGeometry.js';
import { OUT, hash, tex, face, ibox, plane, glowSprite, grain } from './tex.js';
import { sm, lerp, fbm, ridged, terrain, clouds, lights, sky, jet } from './kcommon.js';
import { smokeT } from './sets_osama.js';

export const EARTH_R = 100;
export const ll = (lat, lon, R = EARTH_R) => { const a = (lat) * Math.PI / 180, p = (lon + 180) * Math.PI / 180; return new THREE.Vector3(-R * Math.cos(p) * Math.cos(a), R * Math.sin(a), R * Math.sin(p) * Math.cos(a)); };
export const NZ = [73.4, 54.7];
const lin = x => Math.max(0, Math.min(1, x));
const eo = x => { x = lin(x); return 1 - Math.pow(1 - x, 3); };
export let EARTH_IMG = null;
export async function loadEarth() { const img = new Image(); img.src = 'assets/earth.png'; await img.decode(); EARTH_IMG = img; }

// ================= SPACE =================
export function buildSpace() {
  const S = new THREE.Scene(); S.background = new THREE.Color('#10316e');
  const bg = tex(8, 256, (c, W, H) => { const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#16408a'); g.addColorStop(.5, '#1f5cb8'); g.addColorStop(1, '#3a7ad6'); c.fillStyle = g; c.fillRect(0, 0, W, H); });
  const dome = new THREE.Mesh(new THREE.SphereGeometry(900, 24, 16), new THREE.MeshBasicMaterial({ map: bg, side: THREE.BackSide, fog: false, depthWrite: false })); dome.renderOrder = -10; S.add(dome);
  const N = 900, pos = new Float32Array(N * 3); for (let i = 0; i < N; i++) { const a = hash(i * 1.31) * 6.283, e = Math.asin(hash(i * 2.71) * 2 - 1); pos.set([Math.cos(a) * Math.cos(e) * 700, Math.sin(e) * 700, Math.sin(a) * Math.cos(e) * 700], i * 3); }
  const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.BufferAttribute(pos, 3)); S.add(new THREE.Points(sg, new THREE.PointsMaterial({ size: 2.4, sizeAttenuation: false, color: '#ffffff', fog: false, toneMapped: false })));
  const t = new THREE.Texture(EARTH_IMG); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; t.needsUpdate = true;
  const earth = new THREE.Mesh(new THREE.SphereGeometry(EARTH_R, 96, 64), new THREE.MeshStandardMaterial({ map: t, roughness: 1, emissive: '#ffffff', emissiveMap: t, emissiveIntensity: .42 })); S.add(earth);
  const ct = tex(1024, 512, (c, W, H) => { for (let i = 0; i < 90; i++) { const x = hash(i * 1.7) * W, y = H * (.12 + .76 * hash(i * 3.1)), r = 20 + hash(i * 5.3) * 60; for (let k = 0; k < 4; k++) { const g = c.createRadialGradient(x + k * r * .5, y + (hash(i + k) - .5) * 20, 0, x + k * r * .5, y, r); g.addColorStop(0, 'rgba(255,255,255,.75)'); g.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = g; c.fillRect(0, 0, W, H); } } });
  const cl = new THREE.Mesh(new THREE.SphereGeometry(EARTH_R * 1.012, 64, 48), new THREE.MeshStandardMaterial({ map: ct, transparent: true, opacity: .55, depthWrite: false, roughness: 1 })); S.add(cl);
  const halo = glowSprite('#6fc0ff', EARTH_R * 2.7, .7); halo.renderOrder = -5; S.add(halo);
  lights(S, '#fff6e0', 2.2, '#cfe6ff', '#4a6aa0', .9, [-120, 160, 220]);
  const src = ll(NZ[0], NZ[1], 1).normalize(); S.src = src;
  const rings = []; for (let i = 0; i < 3; i++) { const m = new THREE.Mesh(new THREE.TorusGeometry(1, .026 + i * .005, 8, 160), new THREE.MeshBasicMaterial({ color: ['#fff2a0', '#ffb03a', '#ff6a3a'][i], transparent: true, opacity: 1 - i * .28, toneMapped: false, depthWrite: false, depthTest: false })); m.renderOrder = 4 + i; m.visible = false; S.add(m); rings.push(m); }
  const pin = glowSprite('#ff3a2a', 16, .95); pin.position.copy(src.clone().multiplyScalar(EARTH_R * 1.01)); S.add(pin); S.pin = pin;
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), src);
  // theta = great-circle distance of the ring from the source; lag = rings trailing behind
  S.wave = (theta) => { rings.forEach((m, i) => { const th = Math.max(.02, theta - i * .09); const R = EARTH_R * 1.007; m.visible = theta > .02 && Math.sin(th) > .01; m.scale.setScalar(R * Math.sin(th)); m.position.copy(src).multiplyScalar(R * Math.cos(th)); m.quaternion.copy(q); }); };
  S.reset = () => { rings.forEach(m => m.visible = false); pin.material.opacity = 0; };
  S.update = (t, cam) => { cl.rotation.y = t * .02; };
  S.chars = {};
  return S;
}
// ring path: total path length L (radians); one lap = 2*pi (source -> antipode -> back)
export const ringTheta = (L) => { const m = ((L % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI); return m < Math.PI ? m : 2 * Math.PI - m; };

// ================= ARCTIC (1u = 100 m, ground zero at origin) =================
const fireT = tex(256, 256, (c, W, H) => { const g = c.createRadialGradient(128, 128, 10, 128, 128, 128); g.addColorStop(0, '#fff6c8'); g.addColorStop(.55, '#ffc34a'); g.addColorStop(1, '#ff7a1a'); c.fillStyle = g; c.fillRect(0, 0, W, H); for (let i = 0; i < 70; i++) { c.fillStyle = `rgba(${hash(i) > .5 ? '255,240,160' : '230,80,20'},.28)`; c.beginPath(); c.arc(hash(i * 2.3) * W, hash(i * 4.1) * H, 8 + hash(i * 7.7) * 26, 0, 7); c.fill(); } });
export function buildArctic() {
  const S = new THREE.Scene(); S.background = new THREE.Color('#bfe0f8'); S.fog = new THREE.Fog('#dcecf8', 3500, 12000);
  sky(S, '#2f7fd8', '#7ec0f0', '#eaf5ff', '#dcecf8');
  const cx = z => 30 * Math.sin(z * .004);
  const base = (x, z) => { const d = Math.abs(x - cx(z) - 80); const w = 520 + 160 * Math.sin(z * .006 + 1); const land = sm((w - d) / 70); const hills = .35 + 1.8 * ridged(x * .0035 + 3, z * .0035) + .6 * fbm(x * .02, z * .02); return -4 + land * (4.6 + hills * 1.2); };
  const H = (x, z) => { let h = base(x, z); const d = Math.hypot(x, z); const w = sm((420 - d) / 260); return lerp(h, .35 + .15 * fbm(x * .03, z * .03), w); };
  S.h = H;
  terrain(S, { W: 3600, D: 5200, nx: 300, nz: 380, cz: -300, h: H, col: (x, y, z, ny) => { const sl = 1 - ny; if (y < .3) return '#a19a88'; if (sl > .2) return '#8f949c'; const n = fbm(x * .05, z * .05), n2 = fbm(x * .012 + 7, z * .012); if (n2 > .47) return n > .5 ? '#f6faff' : '#e1ecf6'; return n > .58 ? '#b4c49c' : (n > .42 ? '#d3ddc2' : '#9fb28a'); } });
  const sea = new THREE.Mesh(new THREE.PlaneGeometry(26000, 26000), new THREE.MeshStandardMaterial({ color: '#3b9fe6', roughness: .8, emissive: '#1f6fb0', emissiveIntensity: .3 })); sea.rotation.x = -Math.PI / 2; sea.position.y = 0; S.add(sea);
  const floeG = new THREE.CylinderGeometry(1, 1, .12, 7), floeM = new THREE.MeshStandardMaterial({ color: '#f4f9ff', flatShading: true, roughness: .8, emissive: '#cfe6ff', emissiveIntensity: .25 });
  for (let i = 0; i < 280; i++) { const a = hash(i * 3.3) * 6.283, r = 700 + Math.pow(hash(i * 1.9), .8) * 5200; const x = Math.cos(a) * r, z = Math.sin(a) * r; if (H(x, z) > -.5) continue; const m = new THREE.Mesh(floeG, floeM); const s = 3 + hash(i * 7.1) * 16; m.scale.set(s, 1, s * (.6 + hash(i) * .6)); m.rotation.y = hash(i * 9.1) * 3; m.position.set(x, .03, z); S.add(m); }
  for (let i = 0; i < 320; i++) { const x = -2000 + hash(i * 2.9) * 1800, z = -500 + hash(i * 4.3) * 2000; if (H(x, z) > -.5) continue; const m = new THREE.Mesh(floeG, floeM); const s = 2 + hash(i * 7.7) * 9; m.scale.set(s, 1, s * (.6 + hash(i + 3) * .6)); m.rotation.y = hash(i * 9.1) * 3; m.position.set(x, .03, z); S.add(m); }
  clouds(S, 26, [-5000, 5000, -7000, 3000], 700, 2400, 1.6, 4);
  const sun = lights(S, '#fff0d8', 2.3, '#cfe4fa', '#b4c6dc', 1.05, [900, 1200, 1400]);
  // ---- blast ----
  const B = new THREE.Group(); S.add(B); S.B = B;
  const flash = glowSprite('#fff6d8', 1, 0); flash.renderOrder = 5; B.add(flash);
  const fire = new THREE.Mesh(new THREE.SphereGeometry(1, 28, 18), new THREE.MeshBasicMaterial({ map: fireT, transparent: true, toneMapped: false })); B.add(fire);
  const fglow = glowSprite('#ff9a30', 1, 0); B.add(fglow);
  const fl = new THREE.PointLight('#ffb060', 0, 4200, 1.0); B.add(fl);
  const puffs = [], mkp = (n, grp) => { for (let i = 0; i < n; i++) { const m = new THREE.Mesh(new THREE.SphereGeometry(1, 14, 10), new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 1, emissive: '#000000' })); m.userData = { i, grp }; B.add(m); puffs.push(m); } };
  mkp(70, 'cap'); mkp(24, 'fill'); mkp(10, 'stem');
  const stemM = new THREE.Mesh(new THREE.CylinderGeometry(.8, 1.15, 1, 22), new THREE.MeshStandardMaterial({ color: '#f4ece0', roughness: 1, emissive: '#000000' })); B.add(stemM);
  const skirt = []; for (let i = 0; i < 30; i++) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: smokeT, transparent: true, depthWrite: false, color: '#e8e4dc', opacity: 0 })); B.add(s); skirt.push(s); }
  const ring = new THREE.Mesh(new THREE.RingGeometry(.94, 1, 128), new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false, toneMapped: false })); ring.rotation.x = -Math.PI / 2; ring.position.y = .5; B.add(ring);
  const dome = new THREE.Mesh(new THREE.SphereGeometry(1, 48, 20, 0, 6.283, 0, 1.5708), new THREE.MeshBasicMaterial({ color: '#fff8e8', transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide, toneMapped: false })); B.add(dome);
  // fallout flakes
  const NF = 400, fg = new THREE.BufferGeometry(); fg.setAttribute('position', new THREE.BufferAttribute(new Float32Array(NF * 3), 3)); const flakes = new THREE.Points(fg, new THREE.PointsMaterial({ color: '#6a7078', size: 4, sizeAttenuation: false, transparent: true, opacity: 0 })); flakes.frustumCulled = false; B.add(flakes);
  // measuring markers (8 km, height ladder)
  const labT = (txt, col = '#fff', w = 640, h = 128, size = 72) => tex(w, h, (c, W, Hh) => { c.font = `900 ${size}px Montserrat`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.lineJoin = 'round'; c.lineWidth = size / 4.5; c.strokeStyle = '#0a0a0a'; c.strokeText(txt, W / 2, Hh / 2 + 4); c.fillStyle = col; c.fillText(txt, W / 2, Hh / 2 + 4); });
  const lad = []; const ladder = (h, txt, col) => { const g = new THREE.Group(); const l = new THREE.Mesh(new THREE.PlaneGeometry(230, 2.6), new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: .95, depthWrite: false, toneMapped: false, side: THREE.DoubleSide })); l.position.set(-130, h, 0); g.add(l); const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: labT(txt, col), transparent: true, depthWrite: false })); s.scale.set(150, 30, 1); s.position.set(-190, h + 17, 0); g.add(s); g.visible = false; B.add(g); lad.push(g); return g; };
  S.ladder = [ladder(88, 'EVEREST 8.8 km', '#ffffff'), ladder(110, 'AIRLINERS ~11 km', '#ffd23f'), ladder(640, 'CLOUD TOP ~64 km', '#ff5a3a')];
  const Q = (a, b, k) => a + (b - a) * k;
  // tau = seconds since detonation (story time, compressed)
  S.blast = (tau, o = {}) => {
    const on = tau > 0; B.visible = true;
    const f = lin(1 - tau / .55); flash.material.opacity = on ? f : 0; flash.scale.setScalar(900 + 3500 * eo(tau / .5)); flash.position.set(0, 40, 0);
    const rf = on ? 40 * eo(tau / 1.1) : 0; const yf = 40 + 70 * sm(tau / 6);
    const cool = lin((tau - 3.0) / 2.6);
    fire.visible = on && cool < 1; fire.scale.setScalar(Math.max(.01, rf)); fire.position.set(0, yf, 0); fire.material.opacity = 1 - cool; fire.rotation.y = tau * .3;
    fglow.material.opacity = on ? .6 * (1 - cool * .8) : 0; fglow.scale.setScalar(Math.max(1, rf * 3.4)); fglow.position.set(0, yf, 0);
    fl.intensity = on ? 520 * (1 - cool * .9) * lin(tau / .2) : 0; fl.position.set(0, yf, 0);
    // cloud (starts hidden inside the fireball, then rolls up out of it)
    const T2 = 2.0; const rise = sm((tau - T2) / 7.8); const yc = yf + 480 * rise; const grow = lin((tau - T2) / 3); const Rc = 20 + 205 * sm((tau - T2) / 7.5); const rc = 14 + 40 * sm((tau - T2) / 7.5); const sr = 14 + 32 * sm((tau - T2) / 6);
    const vis = on && tau > T2 - .4; const warm = 1 - lin((tau - T2) / 8);
    puffs.forEach(m => { const { i, grp } = m.userData; m.visible = vis; if (!vis) return; let x, y, z, r;
      if (grp === 'cap') { const a = i / 70 * 6.283, b = i * 2.399 + tau * 1.3; const rr = Rc + rc * Math.cos(b); x = rr * Math.cos(a); z = rr * Math.sin(a); y = yc + rc * .85 * Math.sin(b); r = rc * .72 * (.85 + .3 * hash(i * 3.7)); }
      else if (grp === 'fill') { const a = hash(i * 5.1) * 6.283, rr = Rc * .9 * Math.sqrt(hash(i * 2.2)); x = rr * Math.cos(a); z = rr * Math.sin(a); y = yc + rc * (.1 + .7 * hash(i * 6.6)) * (1 - rr / Rc * .4); r = rc * (.8 + .5 * hash(i)); }
      else { const u = (i + .5) / 10; const top = yc - rc * .6; const aa = i * 2.4 + tau * .6; x = Math.cos(aa) * sr * .75; z = Math.sin(aa) * sr * .75; y = Q(sr, top, u); r = sr * (.5 + .22 * hash(i * 4.4)) * (1.05 - .25 * u); }
      m.position.set(x, y, z); m.scale.setScalar(Math.max(.5, r * (grp === 'stem' ? lin((tau - T2 + .4) / 2) : grow)));
      const hot = grp === 'stem' ? warm * (1 - sm(y / 360)) : warm * .8; const c = new THREE.Color().lerpColors(new THREE.Color('#fbf3e6'), new THREE.Color('#ff8a2a'), lin(hot)); const shade = .8 + .22 * hash(i * 9.9); m.material.color.copy(c).multiplyScalar(shade); m.material.emissive.copy(c).multiplyScalar(.12 + .3 * lin(hot)); });
    { const top = Math.max(1, yc - rc * .6); stemM.visible = vis; stemM.position.set(0, top / 2, 0); stemM.scale.set(sr * (.9 + .1 * Math.sin(tau)), top, sr * (.9 + .1 * Math.sin(tau))); const hot = warm * .7; const c = new THREE.Color().lerpColors(new THREE.Color('#f1e8da'), new THREE.Color('#ff8a2a'), lin(hot)); stemM.material.color.copy(c); stemM.material.emissive.copy(c).multiplyScalar(.12 + .3 * lin(hot)); }
    skirt.forEach((s, i) => { const k = lin((tau - .15) / 1.2); const a = i / 30 * 6.283 + hash(i) * .4; const r = (60 + 380 * eo((tau - .1) / 5)) * (.7 + .5 * hash(i * 3)); s.position.set(Math.cos(a) * r, 8 + 14 * hash(i * 7) + 25 * eo(tau / 3), Math.sin(a) * r); const sc = 70 + 90 * hash(i * 2); s.scale.set(sc * 2, sc, 1); s.material.opacity = on ? .16 * k * (1 - lin((tau - 5) / 6)) : 0; });
    const rs = 340 * Math.pow(Math.max(0, tau), .92) * (o.sw || 1); ring.scale.setScalar(Math.max(.01, rs)); ring.material.opacity = on ? .85 * lin(1 - tau / 6) : 0;
    dome.scale.setScalar(Math.max(.01, rs * .85)); dome.material.opacity = on ? .05 * lin(1 - tau / 3.2) : 0;
    // fallout
    const fa = o.fall || 0; flakes.material.opacity = fa; if (fa > 0) { const p = fg.attributes.position.array; for (let i = 0; i < NF; i++) { const a = hash(i * 2.1) * 6.283, r = 60 + hash(i * 4.7) * 700; const y0 = 120 + hash(i * 6.3) * 520; const yy = ((y0 - tau * 14 - i * .5) % 640 + 640) % 640; p[i * 3] = Math.cos(a) * r + tau * 20; p[i * 3 + 1] = yy; p[i * 3 + 2] = Math.sin(a) * r; } fg.attributes.position.needsUpdate = true; }
  };
  S.noBlast = () => { B.visible = false; };
  // pre-blast: chute + bomb exaggerated so it reads from kilometres away
  const chute = new THREE.Group(); S.add(chute); S.chute = chute;
  const dm = new THREE.Mesh(new THREE.SphereGeometry(6, 20, 10, 0, 6.283, 0, 1.45), new THREE.MeshStandardMaterial({ map: chuteTex(), side: THREE.DoubleSide, emissive: '#ffffff', emissiveMap: chuteTex(), emissiveIntensity: .4 })); dm.position.y = 8.6; chute.add(dm);
  const bm = new THREE.Mesh(new THREE.CylinderGeometry(.7, .7, 4.8, 12), new THREE.MeshStandardMaterial({ color: '#ffffff', emissive: '#ffffff', emissiveIntensity: .4 })); chute.add(bm);
  const ln = new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints([...Array(12)].flatMap((_, i) => { const a = i / 12 * 6.283; return [new THREE.Vector3(Math.cos(a) * 6.0, 7.8, Math.sin(a) * 6.0), new THREE.Vector3(0, 2.2, 0)]; })), new THREE.LineBasicMaterial({ color: '#333' })); chute.add(ln);
  S.chute.visible = false;
  S.reset = () => { S.chute.visible = false; B.visible = false; S.ladder.forEach(l => l.visible = false); flash.material.opacity = 0; fl.intensity = 0; flakes.material.opacity = 0; };
  S.update = (t, cam) => { if (cam) S.sky.position.copy(cam.position); };
  S.chars = {};
  return S;
}
export function chuteTex() { return tex(512, 64, (c, W, H) => { for (let i = 0; i < 16; i++) { c.fillStyle = i % 2 ? '#ffffff' : '#e8342a'; c.fillRect(i * W / 16, 0, W / 16 + 1, H); } c.strokeStyle = 'rgba(0,0,0,.35)'; c.lineWidth = 3; for (let i = 0; i < 16; i++) { c.beginPath(); c.moveTo(i * W / 16, 0); c.lineTo(i * W / 16, H); c.stroke(); } }); }

// ================= Tu-95 + bomb + chute (1u = 1 m) =================
const star = (c, x, y, r, col) => { c.fillStyle = col; c.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * .42 : r; c.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } c.closePath(); c.fill(); };
export function tu95(S) {
  const j = jet(S); j.g.children.forEach(c => c.visible = false); const g = j.g;
  const metal = new THREE.MeshStandardMaterial({ color: '#cfd6de', metalness: .35, roughness: .4, emissive: '#6a7a8c', emissiveIntensity: .22 });
  const dark = new THREE.MeshStandardMaterial({ color: '#2b3340', metalness: .6, roughness: .3 });
  const add = (m, x, y, z) => { m.position.set(x, y, z); g.add(m); return m; };
  const fus = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 2.2, 34, 18), metal); fus.rotation.x = Math.PI / 2; add(fus, 0, 0, 0);
  const nose = new THREE.Mesh(new THREE.ConeGeometry(2.2, 8, 18), metal); nose.rotation.x = -Math.PI / 2; add(nose, 0, 0, -21);
  const tail = new THREE.Mesh(new THREE.CylinderGeometry(.55, 2.2, 13, 16), metal); tail.rotation.x = Math.PI / 2; add(tail, 0, .2, 23.5);
  const glass = new THREE.Mesh(new THREE.SphereGeometry(1, 14, 10), new THREE.MeshStandardMaterial({ color: '#16232f', roughness: .1, metalness: .8, emissive: '#18344c', emissiveIntensity: .5 })); glass.scale.set(1.5, 1.0, 2.6); add(glass, 0, 1.15, -15.2);
  const belly = new THREE.Mesh(new THREE.CylinderGeometry(2.24, 2.24, 20, 18, 1, false, Math.PI * .72, Math.PI * .56), new THREE.MeshStandardMaterial({ color: '#f0f2f5', roughness: .5 })); belly.rotation.x = Math.PI / 2; add(belly, 0, 0, 3);
  const hull = (pts, mt) => new THREE.Mesh(new ConvexGeometry(pts.map(p => new THREE.Vector3(...p))), mt);
  for (const s of [-1, 1]) {
    g.add(hull([[s * 1.6, .5, -3.5], [s * 1.6, -.7, -3.5], [s * 1.6, .5, 7.5], [s * 1.6, -.7, 7.5], [s * 25.5, .2, 10.5], [s * 25.5, -.1, 10.5], [s * 25.5, .2, 14.2], [s * 25.5, -.1, 14.2]], metal));
    g.add(hull([[s * 1.2, 0, 19], [s * 1.2, .3, 23.5], [s * 9.5, .1, 25.4], [s * 9.5, .2, 27.4], [s * 1.2, -.3, 23.5]], metal));
    for (const [ex, ph] of (s > 0 ? [[8, 0], [15.5, 1]] : [[-8, 1], [-15.5, 0]])) {
      const lez = -3.5 + (Math.abs(ex) - 1.6) / 23.9 * 14, nz = lez - 1.2;
      const nac = new THREE.Mesh(new THREE.CylinderGeometry(1.0, 1.15, 9, 12), metal); nac.rotation.x = Math.PI / 2; add(nac, ex, -.35, nz + 1); const spn = new THREE.Mesh(new THREE.ConeGeometry(.95, 2.0, 12), new THREE.MeshStandardMaterial({ color: '#d9dde2', metalness: .5, roughness: .3 })); spn.rotation.x = -Math.PI / 2; add(spn, ex, -.35, nz - 4.5 - 1);
      const pg = new THREE.Group(); pg.position.set(ex, -.35, nz - 4.4); g.add(pg);
      const disc = new THREE.Mesh(new THREE.CircleGeometry(3.3, 28), new THREE.MeshBasicMaterial({ color: '#dfe6ee', transparent: true, opacity: .3, side: THREE.DoubleSide, depthWrite: false })); pg.add(disc);
      const bl = new THREE.Group(); pg.add(bl); for (let k = 0; k < 8; k++) { const b = new THREE.Mesh(new THREE.BoxGeometry(.34, 3.2, .06), new THREE.MeshStandardMaterial({ color: '#e9eef3', emissive: '#9aa8b8', emissiveIntensity: .4 })); b.geometry.translate(0, 1.7, 0); b.rotation.z = k * Math.PI / 4; bl.add(b); }
      (g.userData.props = g.userData.props || []).push({ bl, dir: ph ? 1 : -1 });
    }
  }
  g.add(hull([[0, 1.5, 17.5], [0, 1.5, 23.5], [0, 11.5, 23.2], [0, 11.5, 25.8], [0, 2.5, 25.8], [.18, 1.5, 17.5], [-.18, 1.5, 17.5]], metal));
  const fin = new THREE.Mesh(new THREE.PlaneGeometry(5.5, 6.5), new THREE.MeshBasicMaterial({ map: tex(128, 128, (c, W, H) => { c.clearRect(0, 0, W, H); star(c, 64, 70, 46, '#e8342a'); c.strokeStyle = '#7a1010'; c.lineWidth = 5; c.stroke(); }), transparent: true, side: THREE.DoubleSide })); fin.rotation.y = Math.PI / 2; add(fin, .25, 5.8, 22); const fin2 = fin.clone(); fin2.position.x = -.25; g.add(fin2);
  const w = new THREE.Mesh(new THREE.PlaneGeometry(3, 3), fin.material); w.rotation.x = -Math.PI / 2; add(w, 14, .45, 11); const w2 = w.clone(); w2.position.x = -14; g.add(w2);
  const spin = (t, rev = 12.5) => g.userData.props.forEach(p => p.bl.rotation.z = p.dir * t * rev * 6.283);
  const fly = j.fly; j.spin = spin; return j;
}
export function bombMesh() {
  const g = new THREE.Group(); const M = new THREE.MeshStandardMaterial({ color: '#f6f6f2', roughness: .45, emissive: '#e8e8e0', emissiveIntensity: .25 });
  const body = new THREE.Mesh(new THREE.CylinderGeometry(1.05, 1.05, 6.2, 18), M); body.rotation.x = Math.PI / 2; g.add(body);
  const nose = new THREE.Mesh(new THREE.ConeGeometry(1.05, 2.0, 18), M); nose.rotation.x = -Math.PI / 2; nose.position.z = -4.1; g.add(nose);
  const tailc = new THREE.Mesh(new THREE.CylinderGeometry(.5, 1.05, 2.4, 14), M); tailc.rotation.x = Math.PI / 2; tailc.position.z = 4.3; g.add(tailc);
  for (const z of [-1.2, 1.6]) { const b = new THREE.Mesh(new THREE.CylinderGeometry(1.07, 1.07, .55, 18), new THREE.MeshStandardMaterial({ color: '#e8342a', emissive: '#a01010', emissiveIntensity: .3 })); b.rotation.x = Math.PI / 2; b.position.z = z; g.add(b); }
  return g;
}
export function chuteMesh(R = 22) {
  const g = new THREE.Group(); const T = chuteTex();
  const dome = new THREE.Mesh(new THREE.SphereGeometry(R, 40, 16, 0, 6.283, 0, 1.4), new THREE.MeshStandardMaterial({ map: T, side: THREE.DoubleSide, emissive: '#ffffff', emissiveMap: T, emissiveIntensity: .35, roughness: .8 })); g.add(dome);
  const pts = []; for (let i = 0; i < 24; i++) { const a = i / 24 * 6.283, rr = R * Math.sin(1.4), yy = R * Math.cos(1.4); pts.push(new THREE.Vector3(Math.cos(a) * rr, yy, Math.sin(a) * rr), new THREE.Vector3(0, -R * 1.5, 0)); }
  const lines = new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color: '#2a2a2a' })); g.add(lines);
  g.userData = { dome, lines, R }; return g;
}
// bomb state after release at tr (deterministic integration): returns {p:[x,y,z], v:[vx,vy], open}
export function bombState(t, tr, p0, v0, topen = .5) {
  const g = 9.81; let x = p0[0], y = p0[1], vx = v0[0], vy = v0[1]; const dt = .01; const n = Math.max(0, Math.floor((t - tr) / dt)); let open = 0;
  for (let i = 0; i < n; i++) { const tt = i * dt; open = sm((tt - topen) / .9); const k = .0006 + .0085 * open * open; const sp = Math.hypot(vx, vy); const ax = -k * sp * vx, ay = -g - k * sp * vy; vx += ax * dt; vy += ay * dt; x += vx * dt; y += vy * dt; }
  return { p: [x, y, p0[2]], v: [vx, vy], open: sm((t - tr - topen) / .9) };
}
export function buildSky() {
  const S = new THREE.Scene(); S.background = new THREE.Color('#9fd0f5'); S.fog = new THREE.Fog('#dcecf8', 1800, 9000);
  sky(S, '#2a78d6', '#76bdf0', '#e8f4ff', '#dcecf8');
  lights(S, '#fff4e0', 2.5, '#cfe6ff', '#9ab4d4', 1.1, [300, 500, 400]);
  const deck = clouds(S, 110, [-9000, 12000, -9000, 9000], -1700, -1350, 5.5, 3);
  const near = []; for (let i = 0; i < 160; i++) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: smokeT, transparent: true, depthWrite: false, color: '#ffffff', opacity: .7 })); const k = 25 + hash(i * 3.3) * 55; s.scale.set(k * 1.8, k, 1); s.userData = { x: -3500 + hash(i * 1.1) * 7000, y: -260 + hash(i * 2.3) * 520, z: -900 + hash(i * 3.7) * 1800 }; S.add(s); near.push(s); }
  S.near = near; S.plane = tu95(S); S.bomb = bombMesh(); S.add(S.bomb); S.chute = chuteMesh(); S.add(S.chute); S.chute.visible = false;
  S.chars = {}; S.shock = new THREE.Mesh(new THREE.SphereGeometry(1, 40, 24), new THREE.MeshBasicMaterial({ color: '#fff4d8', transparent: true, opacity: 0, side: THREE.BackSide, depthWrite: false, toneMapped: false })); S.shock.visible = false; S.add(S.shock);
  S.glow = glowSprite('#ffd070', 900, 0); S.add(S.glow);
  S.reset = () => { S.plane.g.position.y = -99999; S.bomb.visible = false; S.chute.visible = false; S.shock.visible = false; S.glow.material.opacity = 0; };
  S.update = (t, cam) => { if (cam) { S.sky.position.copy(cam.position); S.near.forEach(s => { const u = s.userData; s.position.set(cam.position.x + ((u.x - cam.position.x + 3500) % 7000 + 7000) % 7000 - 3500, cam.position.y + u.y * .6, u.z); const d = s.position.distanceTo(cam.position); s.material.opacity = .7 * lin((d - 30) / 120); }); } };
  return S;
}
// attach bomb under the plane
export function carryBomb(S) { const P = S.plane.g; S.bomb.visible = true; const off = new THREE.Vector3(0, -2.55, 3.5); P.updateMatrixWorld(true); S.bomb.position.copy(off.applyMatrix4(P.matrixWorld)); S.bomb.quaternion.copy(P.quaternion); }
