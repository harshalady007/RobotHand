// 9/11 reel sets A: Lower Manhattan (day -> dusk, twin towers, impacts, collapse dust, Tribute beams), memorial plaza
import * as THREE from 'three';
import { hash, tex, face, mat, ibox, plane, glowSprite, floorGlow, grain } from './tex.js';
import { Char } from './chars.js';
import { smokeT } from './sets_osama.js';
import { fbm } from './kcommon.js';
import { G, sm, lin, seg, lerp, airliner, blast, bldg, facadeMat, setDusk, cab, FAC } from './a911.js';
import { FlagA } from './kamerica.js';

export const EV = {}; // absolute event times, filled by main.js

const skyTex = (k) => tex(8, 256, (c, W, H) => {
  const mixc = (a, b) => { const A = new THREE.Color(a), B = new THREE.Color(b); return '#' + A.lerp(B, k).getHexString(); };
  const g = c.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, mixc('#3a86dc', '#16215a')); g.addColorStop(.35, mixc('#7dbdf0', '#3a3f86')); g.addColorStop(.52, mixc('#e8f4ff', '#f2905a')); g.addColorStop(.62, mixc('#e8f4ff', '#f2905a')); g.addColorStop(1, mixc('#cfe0ee', '#2a2a4a'));
  c.fillStyle = g; c.fillRect(0, 0, W, H);
});

export function buildNYC() {
  const S = new THREE.Scene(); S.fog = new THREE.Fog('#d4e8f6', 1800, 9000); S.background = new THREE.Color('#8ec8f0');
  const sky = new THREE.Mesh(new THREE.SphereGeometry(12000, 24, 16), new THREE.MeshBasicMaterial({ map: skyTex(0), side: THREE.BackSide, fog: false, depthWrite: false })); sky.renderOrder = -10; S.add(sky);
  const hemi = new THREE.HemisphereLight('#cfe6ff', '#b4a58a', 1.25); S.add(hemi);
  const sun = new THREE.DirectionalLight('#fff0d0', 2.5); sun.position.set(-500, 700, 800); S.add(sun);
  const water = new THREE.Mesh(new THREE.PlaneGeometry(30000, 30000), new THREE.MeshStandardMaterial({ color: '#3f9bd6', roughness: .25, metalness: .1, emissive: '#2a6fa8', emissiveIntensity: .25 })); water.rotation.x = -Math.PI / 2; water.position.y = -2.5; S.add(water);
  // island
  const poly = [[-430, -2600], [980, -2600], [980, -300], [520, 520], [90, 800], [-210, 660], [-430, 300]];
  const sh = new THREE.Shape(poly.map(([x, z]) => new THREE.Vector2(x, -z)));
  const asT = tex(256, 256, (c, W) => { c.fillStyle = '#5b606a'; c.fillRect(0, 0, W, W); grain(c, W, W, .1, 3000); }, [60, 60]);
  const isl = new THREE.Mesh(new THREE.ShapeGeometry(sh), new THREE.MeshStandardMaterial({ map: asT, roughness: .95 })); isl.rotation.x = -Math.PI / 2; isl.position.y = -.05; S.add(isl);
  const solid = []; S.solid = solid;
  const reg = (m) => { m.userData.solid = true; solid.push(m); return m; };
  // far shores (New Jersey west, Brooklyn east, Staten Island south)
  const shore = (x0, x1, z0, z1, col) => { const m = new THREE.Mesh(new THREE.BoxGeometry(x1 - x0, 3, z1 - z0), new THREE.MeshStandardMaterial({ color: col, roughness: 1 })); m.position.set((x0 + x1) / 2, -.5, (z0 + z1) / 2); S.add(m); };
  shore(-6500, -2300, -4000, 2500, '#8fb872'); shore(2300, 6500, -4000, 2500, '#a3bd7c'); shore(-2500, 3000, 2400, 6000, '#8fb872');
  for (let i = 0; i < 40; i++) { const x = -2800 - hash(i * 3.1) * 500, z = -1200 + hash(i * 7.7) * 1500, h = 25 + hash(i + 2) * 110; reg(bldg(S, ['glass', 'stone', 'brick'][i % 3], 50 + hash(i) * 40, h, 50 + hash(i + 1) * 40, x, z, 0)); }
  for (let i = 0; i < 50; i++) { const x = 2600 + hash(i * 3.3) * 800, z = -1200 + hash(i * 5.3) * 2200, h = 14 + hash(i + 3) * 40; reg(bldg(S, ['tan', 'brick', 'stone'][i % 3], 60, h, 60, x, z, 0)); }
  // blocks
  const TW = [{ x: -45, z: -35 }, { x: 55, z: 40 }]; // North tower, South tower
  const inSuper = (x, z) => x > -200 && x < 200 && z > -170 && z < 150;
  for (let i = 0; i < 9; i++) for (let j = 0; j < 23; j++) {
    const cx = -380 + i * 150 + 75, cz = -1540 + j * 100 + 50; if (cx > 930 || inSuper(cx, cz)) continue;
    const sl = ibox(130, .3, 80, { color: '#d4cdbe' }); sl.position.set(cx, .1, cz); S.add(sl);
    const nb = 1 + (hash(i * 7 + j * 13) > .5 ? 1 : 0); const downtown = cz > -500 && cx < 600;
    for (let b = 0; b < nb; b++) {
      const w = nb === 1 ? 70 + hash(i * 3 + j) * 30 : 48, d = 44 + hash(i + j * 5) * 16; const ox = nb === 1 ? 0 : (b ? 32 : -32);
      let hh = 20 + Math.pow(hash(i * 17 + j * 31 + b * 5), 1.6) * (downtown ? 150 : 90); if (cz > 150) hh = Math.min(hh, 16 + hash(i + j * 3 + b) * 26);
      const kind = ['glass', 'stone', 'brick', 'tan', 'dark', 'red'][Math.floor(hash(i * 5 + j * 11 + b) * 6)];
      reg(bldg(S, kind, w, hh, d, cx + ox, cz + (hash(b + i) - .5) * 6, .2));
    }
    for (const [tx, tz] of [[-58, -38], [58, -38], [-58, 38], [58, 38]]) { const tr = new THREE.Mesh(new THREE.CylinderGeometry(.3, .4, 3.4, 6), new THREE.MeshStandardMaterial({ color: '#5a3f28' })); tr.position.set(cx + tx, 1.7, cz + tz); S.add(tr); const fo = new THREE.Mesh(new THREE.IcosahedronGeometry(2.6, 0), new THREE.MeshStandardMaterial({ color: '#4a9a3e', flatShading: true })); fo.position.set(cx + tx, 4.6, cz + tz); S.add(fo); }
  }
  // plaza superblock
  const plaza = new THREE.Mesh(new THREE.BoxGeometry(400, .3, 320), new THREE.MeshStandardMaterial({ map: tex(256, 256, (c, W) => { c.fillStyle = '#d9d2c2'; c.fillRect(0, 0, W, W); c.strokeStyle = 'rgba(120,110,95,.5)'; c.lineWidth = 3; for (let i = 0; i <= 8; i++) { c.beginPath(); c.moveTo(i * 32, 0); c.lineTo(i * 32, W); c.stroke(); c.beginPath(); c.moveTo(0, i * 32); c.lineTo(W, i * 32); c.stroke(); } grain(c, W, W, .08, 1500); }, [10, 8]), roughness: .9 })); plaza.position.set(0, .1, -10); S.add(plaza);
  // fountain-ish sphere + trees on plaza
  for (let i = 0; i < 26; i++) { const x = -170 + hash(i * 2.7) * 340, z = -150 + hash(i * 5.9) * 290; if (Math.abs(x - TW[0].x) < 50 && Math.abs(z - TW[0].z) < 50) continue; if (Math.abs(x - TW[1].x) < 50 && Math.abs(z - TW[1].z) < 50) continue; const tr = new THREE.Mesh(new THREE.CylinderGeometry(.3, .45, 4, 6), new THREE.MeshStandardMaterial({ color: '#5a3f28' })); tr.position.set(x, 2.1, z); S.add(tr); const fo = new THREE.Mesh(new THREE.IcosahedronGeometry(3.2, 0), new THREE.MeshStandardMaterial({ color: ['#3f8f3a', '#4ca040', '#5aa84a'][i % 3], flatShading: true })); fo.position.set(x, 5.8, z); S.add(fo); }
  // ---- twin towers ----
  const steel = facadeMat('steel'); const TH = [417, 415];
  const tw = TW.map((p, i) => {
    const g = new THREE.Group(); g.position.set(p.x, 0, p.z); S.add(g);
    const geo = new THREE.BoxGeometry(63.5, 1, 63.5); const uv = geo.attributes.uv; const sc = [[63.5, 1], [63.5, 1], [1, 1], [1, 1], [63.5, 1], [63.5, 1]];
    const body = new THREE.Mesh(geo, [steel.side, steel.side, steel.roof, steel.roof, steel.side, steel.side]); // unit-height box scaled in y -> UV set per frame below
    const geoB = new THREE.BoxGeometry(63.5, TH[i], 63.5); const uvB = geoB.attributes.uv; const sc2 = [[63.5, TH[i]], [63.5, TH[i]], [1, 1], [1, 1], [63.5, TH[i]], [63.5, TH[i]]];
    for (let f = 0; f < 6; f++) for (let k = 0; k < 4; k++) { const id = f * 4 + k; uvB.setXY(id, uvB.getX(id) * sc2[f][0] / 16, uvB.getY(id) * sc2[f][1] / 16 * 1.0); }
    const bodyM = new THREE.Mesh(geoB, [steel.side, steel.side, steel.roof, steel.roof, steel.side, steel.side]); bodyM.position.y = TH[i] / 2; g.add(bodyM); reg(bodyM);
    const lobby = ibox(70, 12, 70, { color: '#b9bfc8' }); lobby.position.y = 6; g.add(lobby); reg(lobby);
    const top = new THREE.Group(); g.add(top); const cap = ibox(64.5, 6, 64.5, { color: '#aab2bb' }); cap.position.y = TH[i] + 3; top.add(cap);
    if (i === 0) { const an = new THREE.Mesh(new THREE.CylinderGeometry(.6, 1.6, 110, 8), new THREE.MeshStandardMaterial({ color: '#c9ced4' })); an.position.y = TH[i] + 55; top.add(an); const bl = glowSprite('#ff3a2a', 14, .9); bl.position.y = TH[i] + 108; top.add(bl); g.userData.beacon = bl; }
    // impact gash (dark + glow) on the facade facing the camera side, created hidden
    const gash = new THREE.Mesh(new THREE.PlaneGeometry(46, 17), new THREE.MeshBasicMaterial({ map: tex(256, 96, (c, W, H) => { c.clearRect(0, 0, W, H); c.fillStyle = '#1a0e0a'; c.beginPath(); c.moveTo(W * .5, 4); c.lineTo(W * .56, H * .32); c.lineTo(W - 10, H * .42); c.lineTo(W * .6, H * .56); c.lineTo(W * .62, H - 6); c.lineTo(W * .5, H * .66); c.lineTo(W * .38, H - 6); c.lineTo(W * .4, H * .56); c.lineTo(10, H * .42); c.lineTo(W * .44, H * .32); c.closePath(); c.fill(); const gr = c.createRadialGradient(W / 2, H / 2, 4, W / 2, H / 2, 70); gr.addColorStop(0, 'rgba(255,170,60,.9)'); gr.addColorStop(1, 'rgba(255,90,20,0)'); c.fillStyle = gr; c.globalCompositeOperation = 'source-atop'; c.fillRect(0, 0, W, H); }), transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 })); gash.visible = false; g.add(gash);
    return { g, body: bodyM, top, geo: geoB, gash, H: TH[i], p };
  });
  S.tw = tw;
  // ---- effects: impacts + dust (collapse) ----
  const bl = [blast(S, 70, { wind: [1, 0, .6], n: 30, rise: 1.15 }), blast(S, 70, { wind: [1, 0, .6], n: 30, rise: 1.15 })];
  const dustS = []; for (let i = 0; i < 120; i++) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: smokeT, transparent: true, depthWrite: false, color: '#b9b2a3', opacity: 0 })); S.add(s); dustS.push(s); }
  S.dust = dustS;
  // aircraft (two jets used for both impacts)
  S.planes = [airliner(S, { stripe: '#1f4fa8' }), airliner(S, { stripe: '#b3262e' })];
  S.planes.forEach(p => p.show(false));
  // ---- boats ----
  const ferry = () => { const g = new THREE.Group(); S.add(g); const h = ibox(38, 4, 11, { color: '#f2f2ee' }); h.position.y = 2.5; g.add(h); const rd = ibox(38.2, 1.2, 11.2, { color: '#e04a2a' }); rd.position.y = 1.2; g.add(rd); const up = ibox(26, 4, 9.4, { color: '#f7f7f3', side: face('#f7f7f3', (c, W, H) => { c.fillStyle = '#26313c'; for (let k = 0; k < 6; k++) c.fillRect(8 + k * 40, 20, 28, 40); }, { w: 256, h: 96 }) }); up.position.set(-2, 6.5, 0); g.add(up); const st = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.4, 5, 8), new THREE.MeshStandardMaterial({ color: '#d93a2a' })); st.position.set(-3, 10.5, 0); g.add(st); return g; };
  S.ferries = [ferry(), ferry(), ferry()];
  S.cars = []; { const CC = ['#f5c518', '#f5c518', '#f5c518', '#d83a3a', '#2f6fd0', '#f5f5f0', '#2a2d33']; const RX = [-230, 220, 370, 520, 670]; for (let i = 0; i < 26; i++) { const c = cab(S, CC[i % 7]); S.cars.push({ c, x: RX[i % 5] + (i % 2 ? 4.5 : -4.5), dir: i % 2 ? 1 : -1, v: 9 + hash(i * 7.7) * 5, z0: -1400 + hash(i * 5.3) * 2000 }); } }
  // wind-blown flags + props
  S.flag = new FlagA(S, 'us', 14, 9, true, 60).at(-60, 12, 150);
  // street people for ground shots
  const COM = (i, x = {}) => ({ body: ['#3a4a6a', '#6a3a3a', '#2f5a48', '#7a5a2a', '#4a3a5a', '#5a6a7a'][i % 6], hair: ['helmet', 'bob', 'bun', 'curly', 'helmet', 'gray'][i % 6], hairCol: ['#2a1c10', '#6a3a1a', '#1a1a1a', '#8a5a2a', '#3a2a1a', '#4a3a2a'][i % 6], collar: i % 2 === 0, tie: i % 3 === 0 ? '#b5302a' : undefined, seed: 300 + i * 1.7, ...x });
  S.COM = COM;
  S.chars = {}; for (let i = 0; i < 6; i++) S.chars['c' + i] = new Char(S, COM(i, { arms: ['mug', 'phone', 'down', 'down', 'phone', 'down'][i] }), 2.4);
  S.tod = (k) => { S.dusk = k; sky.material.map = skyTex(k); sky.material.map.needsUpdate = true; S.fog.color.set(new THREE.Color('#d4e8f6').lerp(new THREE.Color('#5a4a7a'), k)); hemi.intensity = lerp(1.25, .85, k); hemi.color.set(new THREE.Color('#cfe6ff').lerp(new THREE.Color('#7a86c8'), k)); sun.intensity = lerp(2.5, 1.5, k); sun.color.set(new THREE.Color('#fff0d0').lerp(new THREE.Color('#ff9a5a'), k)); sun.position.set(-500, lerp(700, 120, k), lerp(800, 600, k)); water.material.color.set(new THREE.Color('#3f9bd6').lerp(new THREE.Color('#2a4a8a'), k)); water.material.emissiveIntensity = lerp(.25, .35, k); setDusk(k); };
  // tribute beams
  const beamT = tex(64, 512, (c, W, H) => { const g = c.createLinearGradient(0, H, 0, 0); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(.5, 'rgba(255,255,255,.6)'); g.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = g; c.fillRect(0, 0, W, H); const g2 = c.createLinearGradient(0, 0, W, 0); g2.addColorStop(0, 'rgba(0,0,0,.9)'); g2.addColorStop(.5, 'rgba(0,0,0,0)'); g2.addColorStop(1, 'rgba(0,0,0,.9)'); c.globalCompositeOperation = 'destination-out'; c.fillStyle = g2; c.fillRect(0, 0, W, H); });
  S.beams = TW.map((p) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(24, 30, 3000, 24, 1, true), new THREE.MeshBasicMaterial({ map: beamT, color: '#bcd8ff', transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false })); m.position.set(p.x, 1500, p.z); S.add(m); const gl = floorGlow('#9ec4ff', 150, 150, 0); gl.position.set(p.x, .6, p.z); S.add(gl); m.userData.gl = gl; return m; });
  S.beamK = 0;
  S.reset = () => { S.planes.forEach(p => p.show(false)); };
  S.update = (t, cam) => {
    // everything below is a pure function of t and EV
    S.flag.wave(t, 1.2);
    S.cars.forEach(o => { const z = (((o.z0 + o.dir * o.v * t + 1500) % 2100) + 2100) % 2100 - 1500; o.c.drive(o.x, 0.3, z, o.dir * o.v * t, o.dir === 1 ? -Math.PI / 2 : Math.PI / 2); });
    S.ferries.forEach((f, i) => { const v = [7.5, 9.5, 6.5][i], x0 = [-950, -1300, 1250][i], z0 = [900, -1500, -200][i], dir = [-1, 1, -1][i]; const z = z0 + dir * v * t; f.position.set(x0, -1 + Math.sin(t * .9 + i) * .25, z); f.rotation.set(Math.sin(t * .7 + i) * .01, Math.atan2(-dir, 0) , Math.sin(t * .8 + i * 2) * .015); });
    tw.forEach((T, i) => {
      const hitT = i === 0 ? EV.hit1 : EV.hit2, fallT = i === 0 ? EV.fall1 : EV.fall2;
      T.gash.visible = hitT !== undefined && t > hitT && !(fallT !== undefined && t > fallT);
      const dropK = fallT !== undefined && t > fallT ? (t - fallT) : 0; const c = 12.0; const drop = Math.min(T.H, .5 * 5.2 * Math.pow(dropK * c, 2)); // time-lapsed free-ish fall (a = 5.2 m/s^2)
      const hh = Math.max(.01, T.H - drop); T.body.scale.y = hh / T.H; T.body.position.y = hh / 2; T.top.position.y = -(T.H - hh); T.g.visible = hh > 1.5 || dropK === 0;
      if (T.g.userData.beacon) T.g.userData.beacon.material.opacity = .55 + .45 * Math.sin(t * 5) > .5 ? .9 : .1;
    });
    // impact placement per cam-facing faces (set by main via EV.face1/2 = {pos,dir,rotY})
    [0, 1].forEach(i => { const f = i === 0 ? EV.face1 : EV.face2; if (!f) return; const T = tw[i]; T.gash.position.set(f.pos[0] - T.p.x, f.pos[1], f.pos[2] - T.p.z); T.gash.rotation.y = f.rotY; bl[i].at([f.pos[0] + (i === 0 ? 3 : 0), f.pos[1], f.pos[2] - (i === 1 ? 3 : 0)]); bl[i].g.rotation.set(0, 0, 0); });
    bl[0].update(t, EV.hit1 ?? 1e9, EV.fall1 !== undefined ? EV.fall1 + 1.2 : 1e9); bl[1].update(t, EV.hit2 ?? 1e9, EV.fall2 !== undefined ? EV.fall2 + 1.2 : 1e9);
    // dust clouds from collapse
    S.dust.forEach((s, i) => { const T = tw[i % 2], f = i % 2 === 0 ? EV.fall1 : EV.fall2; if (f === undefined || t < f) { s.material.opacity = 0; return; } const k = (t - f) + 0; const a = hash(i * 2.3) * 6.28, r0 = 30 + hash(i * 5.1) * 40; const sp = 60 + hash(i + 3) * 90; const rr = r0 + Math.min(k, 3.2) * sp; const yy = Math.min(300, 40 + k * 230) * hash(i + 7); s.position.set(T.p.x + Math.cos(a) * rr * (.35 + .65 * (1 - yy / 320)) + k * 25, 14 + yy, T.p.z + Math.sin(a) * rr * (.35 + .65 * (1 - yy / 320)) * .8); const sc = 120 + k * 150 * (.5 + hash(i + 11)); s.scale.set(sc, sc * .85, 1); s.material.opacity = Math.min(1, k * 2.4) * .92 * (1 - seg(k, 3.5, 6.5)); s.material.color.set(i % 3 ? '#b9b2a3' : '#9a9488'); });
    S.beams.forEach((m) => { m.material.opacity = S.beamK * .85; m.userData.gl.material.opacity = S.beamK * .6; m.rotation.y = t * .1; });
    S.chars && Object.values(S.chars).forEach(() => { });
  };
  // aerial/ground helpers used by main.js
  S.bounds = () => solid.map(m => new THREE.Box3().setFromObject(m));
  return S;
}

// ================= MEMORIAL PLAZA (two reflecting pools in the footprints) =================
export function buildMemorial() {
  const S = new THREE.Scene(); S.fog = new THREE.Fog('#f0d9bc', 500, 3200); S.background = new THREE.Color('#e8c89a');
  const sky = new THREE.Mesh(new THREE.SphereGeometry(6000, 24, 16), new THREE.MeshBasicMaterial({ map: skyTex(.45), side: THREE.BackSide, fog: false, depthWrite: false })); sky.renderOrder = -10; S.add(sky);
  S.add(new THREE.HemisphereLight('#ffe8c8', '#8a7a68', 1.15)); const sun = new THREE.DirectionalLight('#ffc888', 2.3); sun.position.set(300, 220, 400); S.add(sun);
  const gr = new THREE.Mesh(new THREE.PlaneGeometry(2400, 2400), new THREE.MeshStandardMaterial({ map: tex(256, 256, (c, W) => { c.fillStyle = '#cfc7b6'; c.fillRect(0, 0, W, W); c.strokeStyle = 'rgba(120,110,95,.45)'; c.lineWidth = 3; for (let i = 0; i <= 8; i++) { c.beginPath(); c.moveTo(i * 32, 0); c.lineTo(i * 32, W); c.stroke(); c.beginPath(); c.moveTo(0, i * 32); c.lineTo(W, i * 32); c.stroke(); } grain(c, W, W, .08, 1500); }, [60, 60]), roughness: .95 })); gr.rotation.x = -Math.PI / 2; S.add(gr);
  const solid = []; S.solid = solid;
  const poolW = 36;
  const waterT = tex(128, 128, (c, W) => { c.fillStyle = '#10243c'; c.fillRect(0, 0, W, W); c.fillStyle = 'rgba(160,210,255,.25)'; for (let i = 0; i < 14; i++) c.fillRect(0, i * 9 + (i % 2) * 3, W, 2); }, [4, 4]);
  S.pools = [-34, 34].map((x, i) => {
    const g = new THREE.Group(); g.position.set(x, 0, 0); S.add(g);
    const rim = ibox(poolW + 6, 1.1, poolW + 6, { color: '#2a2d33', top: face('#2c2f36', (c, W, H) => { c.fillStyle = '#cfa760'; c.fillRect(8, 8, W - 16, 10); }, { w: 128, h: 128 }) }); rim.position.y = .55; g.add(rim); solid.push(rim);
    const wat = new THREE.Mesh(new THREE.PlaneGeometry(poolW - 1, poolW - 1), new THREE.MeshStandardMaterial({ map: waterT, roughness: .15, metalness: .4, emissive: '#2a5a9a', emissiveIntensity: .35 })); wat.rotation.x = -Math.PI / 2; wat.position.y = 1.18; g.add(wat);
    const void_ = ibox(7, .2, 7, { color: '#02060c' }); void_.position.y = 1.2; g.add(void_);
    return { g, wat };
  });
  for (let i = 0; i < 60; i++) { const x = -120 + hash(i * 2.9) * 240, z = -80 + hash(i * 6.1) * 170; if (Math.abs(Math.abs(x) - 34) < 26 && Math.abs(z) < 26) continue; if (x > -75 && x < 10 && z > 14) continue; const tr = new THREE.Mesh(new THREE.CylinderGeometry(.4, .6, 5, 6), new THREE.MeshStandardMaterial({ color: '#5a3f28' })); tr.position.set(x, 2.5, z); S.add(tr); const fo = new THREE.Mesh(new THREE.IcosahedronGeometry(3.8, 0), new THREE.MeshStandardMaterial({ color: ['#6a9a3a', '#7aa844', '#b0903a', '#5a8a3a'][i % 4], flatShading: true })); fo.position.set(x, 7.2, z); S.add(fo); }
  // modern glass tower (One WTC-like) + low buildings behind
  const f = facadeMat('glass'); const sp = new THREE.Mesh(new THREE.CylinderGeometry(20, 52, 360, 4, 1), new THREE.MeshStandardMaterial({ color: '#a9c8e4', roughness: .3, metalness: .2, flatShading: true, emissive: '#7aa6d6', emissiveIntensity: .45 })); sp.rotation.y = Math.PI / 4; sp.position.set(-190, 180, -230); S.add(sp);
  const spire = new THREE.Mesh(new THREE.CylinderGeometry(.5, 1.3, 120, 8), new THREE.MeshStandardMaterial({ color: '#dfe5ec' })); spire.position.set(-190, 420, -230); S.add(spire);
  for (let i = 0; i < 14; i++) { const x = -260 + i * 40 + hash(i) * 10, h = 40 + hash(i + 3) * 120; const b = bldg(S, ['glass', 'stone', 'brick', 'tan'][i % 4], 34, h, 34, x, -190 - hash(i * 2) * 30, 0); solid.push(b); }
  // visitors
  const VIS = (i, x = {}) => ({ body: ['#3a4a6a', '#6a3a3a', '#2f5a48', '#7a5a2a', '#4a3a5a', '#5a6a7a'][i % 6], hair: ['helmet', 'bob', 'bun', 'curly', 'helmet', 'gray'][i % 6], hairCol: ['#2a1c10', '#6a3a1a', '#1a1a1a', '#8a5a2a', '#3a2a1a', '#4a3a2a'][i % 6], seed: 500 + i * 1.7, expr: 'worried', ...x });
  S.chars = { v0: new Char(S, VIS(0, { arms: 'down' }), 2.4), v1: new Char(S, VIS(1, { arms: 'flag', flagKind: 'us' }), 2.4), v2: new Char(S, VIS(2, { arms: 'down', hair: 'gray' }), 2.4), v3: new Char(S, VIS(3, { arms: 'chin' }), 2.4), v4: new Char(S, VIS(4, { arms: 'down' }), 2.4) };
  S.flags = [new FlagA(S, 'us', 5, 3.2, true, 22).at(-8, 0, 52), new FlagA(S, 'us', 5, 3.2, true, 22).at(8, 0, 56)];
  S.dusk = .5; S.reset = () => { };
  S.update = (t) => { setDusk(.45); S.pools.forEach((p, i) => { p.wat.material.map.offset.y = -t * .35; p.wat.material.map.needsUpdate = false; }); S.flags.forEach((f, i) => f.wave(t + i, .5)); };
  return S;
}
