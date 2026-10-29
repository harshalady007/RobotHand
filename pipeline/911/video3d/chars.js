// Reference-style cartoon character drawn to a 2D canvas (768x1024), used as a billboard texture.
import * as THREE from 'three';

export const OUT = '#2a1a12';
const CW = 768, CH = 1024, CX = 384;

function ell(c, x, y, rx, ry, r = 0) { c.beginPath(); c.ellipse(x, y, rx, ry, r, 0, Math.PI * 2); }
function stroke(c, w, col = OUT) { c.lineWidth = w; c.strokeStyle = col; c.lineCap = 'round'; c.lineJoin = 'round'; c.stroke(); }
function ln(c, pts, w, col = OUT) { c.beginPath(); c.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) c.lineTo(pts[i][0], pts[i][1]); stroke(c, w, col); }
function qd(c, a, m, b, w, col = OUT) { c.beginPath(); c.moveTo(a[0], a[1]); c.quadraticCurveTo(m[0], m[1], b[0], b[1]); stroke(c, w, col); }
function shadeCol(hex, k) { const n = parseInt(hex.slice(1), 16); let r = n >> 16, g = (n >> 8) & 255, b = n & 255; r = Math.round(r * k); g = Math.round(g * k); b = Math.round(b * k); return `rgb(${Math.min(255, r)},${Math.min(255, g)},${Math.min(255, b)})`; }


// fit placard text inside the board: 1 or 2 lines, font shrinks until it fits
function fitSign(c, txt, maxW, maxH, cy) {
  const words = txt.split(' ');
  let lines = [txt];
  const width = (l, f) => { c.font = `bold ${f}px "DejaVu Sans"`; return c.measureText(l).width; };
  if (words.length > 1 && width(txt, 54) > maxW) {
    let best = null;
    for (let i = 1; i < words.length; i++) { const L = [words.slice(0, i).join(' '), words.slice(i).join(' ')]; const w = Math.max(width(L[0], 54), width(L[1], 54)); if (!best || w < best.w) best = { L, w }; }
    lines = best.L;
  }
  let f = 54; const lh = 1.08;
  while (f > 14 && (Math.max(...lines.map(l => width(l, f))) > maxW || lines.length * f * lh > maxH)) f -= 2;
  c.font = `bold ${f}px "DejaVu Sans"`;
  lines.forEach((l, i) => c.fillText(l, 0, cy + (i - (lines.length - 1) / 2) * f * lh));
}


function drawSmallFlag(c, kind, fw, fh, wv) {
  if (kind === 'in') { ['#ff9933', '#ffffff', '#138808'].forEach((col, i) => { c.fillStyle = col; c.fillRect(0, i * fh / 3 + wv * (i / 3) * .3, fw, fh / 3 + 1); }); c.strokeStyle = '#000080'; c.lineWidth = 3; c.beginPath(); c.arc(fw / 2, fh / 2, fh * .14, 0, 7); c.stroke(); for (let k = 0; k < 12; k++) { const a = k * Math.PI / 6; c.beginPath(); c.moveTo(fw / 2, fh / 2); c.lineTo(fw / 2 + Math.cos(a) * fh * .14, fh / 2 + Math.sin(a) * fh * .14); c.lineWidth = 1.5; c.stroke(); } return; }
  if (kind === 'pk') { c.fillStyle = '#01411c'; c.fillRect(0, 0, fw, fh); c.fillStyle = '#fff'; c.fillRect(0, 0, fw * .25, fh); c.beginPath(); c.arc(fw * .62, fh / 2, fh * .3, 0, 7); c.fill(); c.fillStyle = '#01411c'; c.beginPath(); c.arc(fw * .68, fh * .45, fh * .27, 0, 7); c.fill(); c.fillStyle = '#fff'; c.font = '28px sans-serif'; c.fillText('★', fw * .66, fh * .5); return; }
  if (kind === 'cn') { c.fillStyle = '#de2910'; c.fillRect(0, 0, fw, fh); c.fillStyle = '#ffde00'; c.font = '40px sans-serif'; c.fillText('★', 10, 42); c.font = '14px sans-serif'; for (const [x, y] of [[52, 12], [62, 26], [62, 42], [52, 54]]) c.fillText('★', x, y); return; }
  for (let i = 0; i < 7; i++) { c.fillStyle = i % 2 ? '#ffffff' : '#c8102e'; c.fillRect(0, i * fh / 7 + wv * (i / 7) * .3, fw, fh / 7 + 1); } c.fillStyle = '#1f3a8a'; c.fillRect(0, 0, fw * .42, fh * .54);
}

// opts: body, hair('helmet'|'bob'|'gray'|'curly'|'bun'|'bald'), hairCol, face(-1..1), back, expr, arms, sit, sitDir, glasses, stache, tie, collar, t, seed, phoneGlow, blush, mug
export function drawChar(c, o) {
  c.clearRect(0, 0, CW, CH);
  const t = o.t || 0, seed = o.seed || 0, face = o.face || 0;
  const R = 128;
  const drop = o.sit ? 150 : 0;
  const hy = 150 + drop + Math.sin(t * 2 + seed) * 2.5; // head center
  const bTop = hy + 90, bBot = bTop + 410, bW = 106;
  const legTop = bBot - 25;
  const lw = 10;
  // ---- legs ----
  if (o.sit) {
    const d = o.sitDir || 1;
    for (const k of [-1, 1]) {
      const x0 = CX + k * 34;
      ln(c, [[x0, legTop], [x0 + d * 150, legTop + 8], [x0 + d * 150 + k * 4, 1000]], 9);
      ell(c, x0 + d * 150 + d * 14, 1004, 22, 9); c.fillStyle = OUT; c.fill();
    }
  } else {
    const st = o.walk ? Math.sin(t * 7 + seed) * 22 : 0;
    for (const k of [-1, 1]) {
      const x0 = CX + k * 36; const x1 = CX + k * 44 + k * st;
      ln(c, [[x0, legTop], [x1, 1000]], 9);
      ell(c, x1 + k * 10, 1004, 22, 9); c.fillStyle = OUT; c.fill();
    }
  }
  // ---- arms (behind body when back view) ----
  const sh = [CX - bW + 18, bTop + 110], sh2 = [CX + bW - 18, bTop + 110];
  const A = o.arms || 'down'; const d = o.armDir || 1;
  const tw = Math.sin(t * 16 + seed) * 7, tw2 = Math.cos(t * 19 + seed) * 7;
  let arms = [];
  const midY = bTop + 260;
  switch (A) {
    case 'down': arms = [[sh, [CX - bW - 30, midY + 120], [CX - bW - 34, midY - 40]], [sh2, [CX + bW + 30, midY + 120], [CX + bW + 34, midY - 40]]]; break;
    case 'type': arms = [[sh, [CX + d * 235, bTop + 165 + tw], [CX + d * 70, bTop + 230]], [sh2, [CX + d * 300, bTop + 158 + tw2], [CX + d * 210, bTop + 215]]]; break;
    case 'raise': arms = [[sh, [CX - bW - 30, midY + 120], [CX - bW - 34, midY - 40]], [sh2, [CX + bW + 120, bTop - 40], [CX + bW + 110, bTop + 80]]]; break;
    case 'point': arms = [[sh, [CX - bW - 30, midY + 120], [CX - bW - 34, midY - 40]], [sh2, [CX + d * 300, bTop + 60], [CX + d * 200, bTop + 130]]]; break;
    case 'chin': arms = [[sh, [CX - bW - 30, midY + 120], [CX - bW - 34, midY - 40]], [sh2, [CX + face * 40 + 30, hy + 105], [CX + bW + 40, bTop + 180]]]; break;
    case 'phone': arms = [[sh, [CX - 18, bTop + 150], [CX - bW - 30, bTop + 230]], [sh2, [CX + 22, bTop + 150], [CX + bW + 30, bTop + 230]]]; break;
    case 'mug': arms = [[sh, [CX - bW - 30, midY + 120], [CX - bW - 34, midY - 40]], [sh2, [CX + 40, bTop + 175], [CX + bW + 60, bTop + 230]]]; break;
    case 'lectern': arms = [[sh, [CX - 150, midY - 30], [CX - bW - 50, midY - 100]], [sh2, [CX + 150, midY - 30], [CX + bW + 50, midY - 100]]]; break;
    case 'sign': arms = [[sh, [CX - 150, bTop + 205 + tw * .4], [CX - bW - 40, bTop + 230]], [sh2, [CX + 150, bTop + 205 - tw * .4], [CX + bW + 40, bTop + 230]]]; break;
    case 'shield': arms = [[sh, [CX + 40, bTop + 180], [CX - bW - 30, bTop + 220]], [sh2, [CX + 150, bTop + 120], [CX + bW + 40, bTop + 200]]]; break;
    case 'box': arms = [[sh, [CX - 90, bTop + 230], [CX - bW - 30, bTop + 220]], [sh2, [CX + 90, bTop + 230], [CX + bW + 30, bTop + 220]]]; break;
    case 'broom': arms = [[sh, [CX - 40, bTop + 170], [CX - bW - 20, bTop + 200]], [sh2, [CX + 30, bTop + 260], [CX + bW + 30, bTop + 230]]]; break;
    case 'pager': arms = [[sh, [CX - 30, bTop + 120], [CX - bW - 30, bTop + 210]], [sh2, [CX + 30, bTop + 125], [CX + bW + 30, bTop + 210]]]; break;
    case 'sling': arms = [[sh, [CX - bW - 30, bTop + 380], [CX - bW - 34, bTop + 220]], [sh2, [CX - 20, bTop + 200], [CX + bW + 20, bTop + 240]]]; break;
    case 'rifle': arms = [[sh, [CX - 70, bTop + 250], [CX - bW - 40, bTop + 220]], [sh2, [CX + 60, bTop + 150], [CX + bW + 40, bTop + 160]]]; break;
    case 'cheer': arms = [[sh, [CX - bW - 110, bTop - 120 + tw], [CX - bW - 110, bTop + 60]], [sh2, [CX + bW + 110, bTop - 120 + tw2], [CX + bW + 110, bTop + 60]]]; break;
    case 'flag': arms = [[sh, [CX - bW - 30, midY + 120], [CX - bW - 34, midY - 40]], [sh2, [CX + bW + 100, bTop - 70 + tw], [CX + bW + 110, bTop + 80]]]; break;
    case 'gesture': arms = [[sh, [CX - bW - 30, midY + 120], [CX - bW - 34, midY - 40]], [sh2, [CX + bW + 170 + tw, bTop + 110 + tw2], [CX + bW + 90, bTop + 210]]]; break;
  }
  const drawArm = (a) => { qd(c, a[0], a[2], a[1], 9); ell(c, a[1][0], a[1][1], 15, 15); c.fillStyle = '#f6f1e6'; c.fill(); stroke(c, 6); };
  const front = A === 'pager' || A === 'sling' || A === 'shield' || A === 'box' || A === 'broom' || A === 'sign' || A === 'phone' || A === 'mug' || A === 'chin' || A === 'raise' || A === 'gesture' || A === 'point' || A === 'rifle' || A === 'cheer' || A === 'flag';
  if (!front || o.back) arms.forEach(drawArm);
  // ---- body (bean) ----
  c.beginPath();
  c.moveTo(CX, bTop - 6);
  c.bezierCurveTo(CX + bW * .95, bTop - 6, CX + bW * 1.08, bTop + 120, CX + bW * 1.06, bTop + 240);
  c.bezierCurveTo(CX + bW * 1.04, bBot - 30, CX + bW * .7, bBot, CX, bBot);
  c.bezierCurveTo(CX - bW * .7, bBot, CX - bW * 1.04, bBot - 30, CX - bW * 1.06, bTop + 240);
  c.bezierCurveTo(CX - bW * 1.08, bTop + 120, CX - bW * .95, bTop - 6, CX, bTop - 6);
  c.closePath();
  const g = c.createLinearGradient(CX - bW, 0, CX + bW, 0);
  g.addColorStop(0, shadeCol(o.body, 1.12)); g.addColorStop(.55, o.body); g.addColorStop(1, shadeCol(o.body, .72));
  c.fillStyle = g; c.fill(); stroke(c, 8);
  // body details
  if (!o.back) {
    if (o.zip) ln(c, [[CX + face * 20, bTop + 30], [CX + face * 20, bBot - 30]], 4, shadeCol(o.body, .55));
    if (o.collar) { qd(c, [CX - 46 + face * 20, bTop + 6], [CX + face * 20, bTop + 64], [CX + 46 + face * 20, bTop + 6], 5); }
    if (o.tie) { c.beginPath(); const tx = CX + face * 22; c.moveTo(tx - 10, bTop + 30); c.lineTo(tx + 10, bTop + 30); c.lineTo(tx + 16, bTop + 160); c.lineTo(tx, bTop + 185); c.lineTo(tx - 16, bTop + 160); c.closePath(); c.fillStyle = o.tie; c.fill(); stroke(c, 4); }
    if (o.lapel) { ln(c, [[CX - 50 + face * 20, bTop + 10], [CX - 20 + face * 20, bTop + 170]], 4, shadeCol(o.body, .5)); ln(c, [[CX + 50 + face * 20, bTop + 10], [CX + 60 + face * 20, bTop + 170]], 4, shadeCol(o.body, .5)); }
  }
  if (o.vest) { c.beginPath(); c.roundRect(CX - bW * .92, bTop + 40, bW * 1.84, 250, 30); c.fillStyle = o.vest; c.fill(); stroke(c, 6); if (!o.back) for (let k = 0; k < 3; k++) { c.beginPath(); c.roundRect(CX - 78 + k * 54, bTop + 190, 44, 70, 8); c.fillStyle = shadeCol(o.vest, 1.18); c.fill(); stroke(c, 4); } }
  if (A === 'rifle' && !o.back) { c.save(); c.translate(CX, bTop + 200); c.rotate(-.55); c.fillStyle = '#1b1c1e'; c.beginPath(); c.roundRect(-190, -16, 330, 34, 6); c.fill(); stroke(c, 5); c.beginPath(); c.roundRect(-40, 14, 30, 60, 5); c.fill(); stroke(c, 4); c.beginPath(); c.roundRect(-10, -40, 70, 26, 5); c.fill(); stroke(c, 4); c.beginPath(); c.roundRect(130, -9, 90, 18, 4); c.fill(); stroke(c, 4); c.restore(); }
  if (front && !o.back) arms.forEach(drawArm);
  if (A === 'flag' && !o.back) { const hx = CX + bW + 100, hy2 = bTop - 70 + tw; ln(c, [[hx, hy2 + 40], [hx, hy2 - 260]], 7, '#6b4a2e'); c.save(); c.translate(hx, hy2 - 260); const fw = 150, fh = 96, wv = Math.sin(t * 6 + seed) * 8; drawSmallFlag(c, o.flagKind, fw, fh, wv); c.lineWidth = 4; c.strokeStyle = OUT; c.strokeRect(0, 0, fw, fh); c.restore(); ell(c, hx, hy2, 15, 15); c.fillStyle = '#f6f1e6'; c.fill(); stroke(c, 6); }
  if (A === 'phone') { c.save(); c.translate(CX + 2, bTop + 120); c.rotate(-.08); c.fillStyle = '#16161c'; c.beginPath(); c.roundRect(-30, -50, 60, 96, 10); c.fill(); stroke(c, 5);
    c.fillStyle = o.phoneGlow || '#bfe9ff'; c.beginPath(); c.roundRect(-23, -42, 46, 80, 6); c.fill(); c.restore(); }
  if (A === 'sign' && !o.back) { c.save(); c.translate(CX, bTop + 195); c.rotate(Math.sin(t * 3 + seed) * .05); c.fillStyle = '#6b4a2e'; c.fillRect(-8, 0, 16, 170); c.lineWidth = 5; c.strokeStyle = OUT; c.strokeRect(-8, 0, 16, 170); c.beginPath(); c.roundRect(-165, -150, 330, 170, 6); c.fillStyle = o.signBg || '#f4efe2'; c.fill(); stroke(c, 7); c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = o.signCol || '#b5302a'; fitSign(c, o.sign || 'СВОБОДА', 290, 140, -64); c.restore();
    for (const k of [-1, 1]) { ell(c, CX + k * 150, bTop + 205, 15, 15); c.fillStyle = '#f6f1e6'; c.fill(); stroke(c, 6); } }
  if (A === 'pager' && !o.back) { c.save(); c.translate(CX, bTop + 110); c.fillStyle = '#1a1a1e'; c.beginPath(); c.roundRect(-46, -30, 92, 60, 10); c.fill(); stroke(c, 5); c.fillStyle = o.pagerGlow || '#9ad48a'; c.fillRect(-34, -20, 68, 26); c.restore(); }
  if (A === 'sling' && !o.back) { c.fillStyle = '#f4f1ea'; c.beginPath(); c.moveTo(CX - 60, bTop + 20); c.lineTo(CX + 60, bTop + 180); c.lineTo(CX + 40, bTop + 230); c.lineTo(CX - 70, bTop + 230); c.closePath(); c.fill(); stroke(c, 5); }
  if (A === 'box' && !o.back) { c.fillStyle = '#c69a5a'; c.beginPath(); c.roundRect(CX - 110, bTop + 170, 220, 150, 6); c.fill(); stroke(c, 7); ln(c, [[CX - 110, bTop + 215], [CX + 110, bTop + 215]], 4, 'rgba(60,40,20,.6)'); for (const k of [-1, 1]) { ell(c, CX + k * 90, bTop + 230, 15, 15); c.fillStyle = '#f6f1e6'; c.fill(); stroke(c, 6); } }
  if (A === 'broom' && !o.back) { ln(c, [[CX - 90, bTop + 90], [CX + 120, 980]], 10, '#8a5a30'); c.beginPath(); c.moveTo(CX + 70, 960); c.lineTo(CX + 190, 960); c.lineTo(CX + 210, 1010); c.lineTo(CX + 50, 1010); c.closePath(); c.fillStyle = '#d9b45a'; c.fill(); stroke(c, 6); }
  if (A === 'shield' && !o.back) { c.save(); c.globalAlpha = .55; c.beginPath(); c.roundRect(CX - 150, bTop + 20, 300, 520, 26); c.fillStyle = '#b9d2ee'; c.fill(); c.restore(); c.beginPath(); c.roundRect(CX - 150, bTop + 20, 300, 520, 26); stroke(c, 9); c.font = 'bold 56px "DejaVu Sans"'; c.textAlign = 'center'; c.fillStyle = '#ffffff'; c.strokeStyle = OUT; c.lineWidth = 6; c.strokeText('POLICE', CX, bTop + 130); c.fillText('POLICE', CX, bTop + 130); for (const k of [-1, 1]) { ell(c, CX + k * 120, bTop + 190, 15, 15); c.fillStyle = '#f6f1e6'; c.fill(); stroke(c, 6); } }
  if (A === 'mug') { c.fillStyle = '#efe7d6'; c.beginPath(); c.roundRect(CX + 40, bTop + 128, 46, 54, 8); c.fill(); stroke(c, 5); c.beginPath(); c.arc(CX + 90, bTop + 154, 13, -1.4, 1.4); stroke(c, 5); }
  // ---- head ----
  const fx = CX + face * 4;
  const hc = o.hairCol || '#4a2c1c';
  if (o.hair === 'bob' && !o.back) { // hair behind head
    c.beginPath(); c.moveTo(fx - R - 18, hy + 10); c.bezierCurveTo(fx - R - 30, hy - R - 40, fx + R + 30, hy - R - 40, fx + R + 18, hy + 10);
    c.quadraticCurveTo(fx + R + 40, hy + 92, fx + R - 10, hy + 86); c.lineTo(fx - R + 10, hy + 86); c.quadraticCurveTo(fx - R - 40, hy + 92, fx - R - 18, hy + 10); c.closePath(); c.fillStyle = hc; c.fill(); stroke(c, 8);
  }
  ell(c, fx, hy, R, R * 1.0); c.fillStyle = '#f7f2e8'; c.fill();
  // soft head shade
  c.save(); ell(c, fx, hy, R, R); c.clip(); const hg = c.createRadialGradient(fx - R * .35, hy - R * .3, R * .2, fx, hy, R * 1.15); hg.addColorStop(0, 'rgba(255,255,255,0)'); hg.addColorStop(1, 'rgba(120,100,120,.28)'); c.fillStyle = hg; c.fillRect(fx - R, hy - R, 2 * R, 2 * R); c.restore();
  ell(c, fx, hy, R, R); stroke(c, 8);
  if (o.back) {
    if (o.hair !== 'bald') { c.save(); ell(c, fx, hy, R, R); c.clip(); c.fillStyle = o.hair === 'gray' ? '#b9b2a6' : hc; c.fillRect(fx - R - 4, hy - R - 4, 2 * R + 8, o.hair === 'bob' ? 2 * R + 8 : R * 1.25); c.restore(); ell(c, fx, hy, R, R); stroke(c, 8); }
    drawHat(c, o, fx, hy, R, face, true);
    if (o.hair === 'bob' && !o.hat) { c.beginPath(); c.moveTo(fx - R - 10, hy + 40); c.quadraticCurveTo(fx, hy + 120, fx + R + 10, hy + 40); c.lineTo(fx + R + 10, hy + 70); c.quadraticCurveTo(fx, hy + 140, fx - R - 10, hy + 70); c.closePath(); c.fillStyle = hc; c.fill(); stroke(c, 7); }
    return;
  }
  // hair front
  const H = o.hair || 'helmet';
  if (H === 'helmet' || H === 'gray') {
    const col = H === 'gray' ? '#bcb5a8' : hc;
    c.beginPath(); c.moveTo(fx - R + 2, hy + 6);
    c.bezierCurveTo(fx - R - 14, hy - R - 30, fx + R + 14, hy - R - 30, fx + R - 2, hy + 6);
    c.bezierCurveTo(fx + R - 10, hy - 40, fx + R * .4 + face * 20, hy - 58, fx + face * 30 + 10, hy - 56);
    c.bezierCurveTo(fx - R * .5, hy - 60, fx - R + 8, hy - 40, fx - R + 2, hy + 6);
    c.closePath(); c.fillStyle = col; c.fill(); stroke(c, 8);
    qd(c, [fx + face * 30 + 14, hy - 60], [fx + face * 22 + 4, hy - 100], [fx + face * 10 - 10, hy - R - 2], 5, shadeCol(col.startsWith('#') ? col : '#4a2c1c', .6));
  }
  if (H === 'bob') {
    c.beginPath(); c.moveTo(fx - R + 2, hy + 10); c.bezierCurveTo(fx - R - 10, hy - R - 34, fx + R + 10, hy - R - 34, fx + R - 2, hy + 10);
    c.bezierCurveTo(fx + R - 30, hy - 50, fx + face * 30 + 30, hy - 66, fx + face * 30 - 4, hy - 54); c.bezierCurveTo(fx - R * .5, hy - 40, fx - R + 10, hy - 30, fx - R + 2, hy + 10); c.closePath(); c.fillStyle = hc; c.fill(); stroke(c, 8);
  }
  if (H === 'curly') { for (let i = 0; i < 8; i++) { const a = Math.PI * (1.0 + i * .143); ell(c, fx + Math.cos(a) * R * .86, hy + Math.sin(a) * R * .86, 34, 34); c.fillStyle = hc; c.fill(); stroke(c, 6); } }
  if (H === 'bun') { ell(c, fx, hy - R - 18, 40, 34); c.fillStyle = hc; c.fill(); stroke(c, 7); c.beginPath(); c.moveTo(fx - R + 2, hy - 4); c.bezierCurveTo(fx - R, hy - R - 22, fx + R, hy - R - 22, fx + R - 2, hy - 4); c.quadraticCurveTo(fx, hy - 76, fx - R + 2, hy - 4); c.fillStyle = hc; c.fill(); stroke(c, 7); }
  drawHat(c, o, fx, hy, R, face, false);
  if (o.cap) { c.beginPath(); c.moveTo(fx - R - 6, hy - 40); c.bezierCurveTo(fx - R, hy - R - 46, fx + R, hy - R - 46, fx + R + 6, hy - 40); c.closePath(); c.fillStyle = o.cap; c.fill(); stroke(c, 8); ln(c, [[fx - R - 10, hy - 40], [fx + R + 60 * Math.sign(face || 1), hy - 40]], 10); }
  // face features
  const E = o.expr || 'neutral';
  const ex = 38, ey = hy + 2, ff = fx + face * 40;
  const blink = ((t + seed * 1.37) % 3.8) < .12;
  const brow = (x, ang, oy = 0, w = 36) => { c.save(); c.translate(x, ey - 46 + oy); c.rotate(ang); ln(c, [[-w / 2, 0], [w / 2, 0]], 11); c.restore(); };
  if (o.nvgDown) { }
  else if (o.sunglasses) {
    for (const k of [-1, 1]) { c.beginPath(); c.roundRect(ff + k * ex - 34, ey - 22, 68, 40, 16); c.fillStyle = '#141014'; c.fill(); }
    ln(c, [[ff - 6, ey - 8], [ff + 6, ey - 8]], 8);
  } else if (E === 'surprised') {
    for (const k of [-1, 1]) { ell(c, ff + k * ex, ey, 22, 26); c.fillStyle = '#fff'; c.fill(); stroke(c, 6); ell(c, ff + k * ex + face * 6, ey + 2, 9, 11); c.fillStyle = OUT; c.fill(); }
  } else if (E === 'happy') {
    for (const k of [-1, 1]) qd(c, [ff + k * ex - 16, ey + 4], [ff + k * ex, ey - 14], [ff + k * ex + 16, ey + 4], 8);
  } else if (E === 'suspicious' || E === 'tired') {
    for (const k of [-1, 1]) { ell(c, ff + k * ex + face * 4, ey + 4, 9, 9); c.fillStyle = OUT; c.fill(); ln(c, [[ff + k * ex - 18, ey - 4], [ff + k * ex + 18, ey - 4]], 7); }
  } else {
    for (const k of [-1, 1]) { if (blink) ln(c, [[ff + k * ex - 11, ey], [ff + k * ex + 11, ey]], 6); else { ell(c, ff + k * ex + (o.look ? o.look[0] : 0), ey + (o.look ? o.look[1] : 0), 9.5, 14); c.fillStyle = OUT; c.fill(); } }
  }
  if (o.glasses) { c.lineWidth = 6; c.strokeStyle = OUT; for (const k of [-1, 1]) { c.beginPath(); c.roundRect(ff + k * ex - 28, ey - 24, 56, 46, 14); c.stroke(); } ln(c, [[ff - 10, ey - 6], [ff + 10, ey - 6]], 6); }
  // brows
  const BR = { neutral: [0, 0], smile: [0, -4], frown: [.28, 4], worried: [-.32, -2], surprised: [0, -14], happy: [0, -8], suspicious: [.1, 0], angry: [.38, 6], tired: [-.1, 2], smirk: [0, 0] }[E] || [0, 0];
  if (o.nvgDown) { }
  else if (E === 'suspicious') { brow(ff - ex, .05, 2); brow(ff + ex, -.22, -10); }
  else if (E === 'smirk') { brow(ff - ex, 0, 0); brow(ff + ex, -.2, -8); }
  else { brow(ff - ex, BR[0], BR[1]); brow(ff + ex, -BR[0], BR[1]); }
  // mustache
  const my = hy + 64;
  if (o.stache) { c.beginPath(); c.moveTo(ff - 36, my - 6); c.quadraticCurveTo(ff, my - 34, ff + 36, my - 6); c.quadraticCurveTo(ff, my - 18, ff - 36, my - 6); c.fillStyle = o.hair === 'gray' ? '#bcb5a8' : hc; c.fill(); stroke(c, 5); }
  const mY = my + (o.stache ? 8 : 0);
  if (E === 'smile' || E === 'happy') qd(c, [ff - 22, mY - 4], [ff, mY + 16], [ff + 22, mY - 4], 7);
  else if (E === 'frown' || E === 'worried' || E === 'angry') qd(c, [ff - 18, mY + 6], [ff, mY - 8], [ff + 18, mY + 6], 7);
  else if (E === 'surprised') { ell(c, ff, mY + 4, 10, 13); c.fillStyle = OUT; c.fill(); }
  else if (E === 'smirk' || E === 'suspicious') qd(c, [ff - 14, mY + 2], [ff + 6, mY + 6], [ff + 22, mY - 8], 7);
  else ln(c, [[ff - 14, mY], [ff + 14, mY]], 7);
  if (o.beard) { c.beginPath(); c.moveTo(ff - R * .78, hy + 20); c.quadraticCurveTo(ff - R * .8, hy + R * 1.5, ff, hy + R * 1.95); c.quadraticCurveTo(ff + R * .8, hy + R * 1.5, ff + R * .78, hy + 20); c.quadraticCurveTo(ff + 40, hy + 50, ff + 24, mY + 14); c.quadraticCurveTo(ff, mY + 26, ff - 24, mY + 14); c.quadraticCurveTo(ff - 40, hy + 50, ff - R * .78, hy + 20); c.closePath(); c.fillStyle = o.beard; c.fill(); stroke(c, 6); for (let i = 0; i < 6; i++) ln(c, [[ff - 50 + i * 20, hy + 90 + (i % 2) * 20], [ff - 46 + i * 19, hy + 150 + (i % 3) * 18]], 3, 'rgba(60,50,40,.45)'); }
  if (o.bandage) { c.save(); ell(c, fx, hy, R, R); c.clip(); c.fillStyle = '#f4f1ea'; c.fillRect(fx - R, hy - 62, 2 * R, 34); c.strokeStyle = 'rgba(120,110,100,.6)'; c.lineWidth = 3; for (let i = 0; i < 6; i++) { c.beginPath(); c.moveTo(fx - R + i * 46, hy - 62); c.lineTo(fx - R + 20 + i * 46, hy - 28); c.stroke(); } c.restore(); c.beginPath(); c.rect(fx - R, hy - 62, 2 * R, 34); }
  if (o.mask) { c.save(); ell(c, fx, hy, R - 4, R - 4); c.clip(); c.fillStyle = '#16161a'; c.fillRect(fx - R, hy + 22, 2 * R, R); c.restore(); }
  if (o.mark) { c.save(); c.globalAlpha = .55; c.fillStyle = '#9a3b3b'; c.beginPath(); c.ellipse(fx + 18 + face * 30, hy - 70, 30, 16, -.3, 0, 7); c.fill(); c.restore(); }
  if (o.blush) { c.save(); c.globalAlpha = .35; c.fillStyle = '#ff7a7a'; ell(c, ff - 62, ey + 40, 20, 10); c.fill(); ell(c, ff + 62, ey + 40, 20, 10); c.fill(); c.restore(); }
}


function drawHat(c, o, fx, hy, R, face, back) {
  if (o.hat === 'fedora') {
    c.beginPath(); c.ellipse(fx, hy - R + 30, R + 46, 26, 0, 0, 7); c.fillStyle = o.hatCol || '#2a2420'; c.fill(); stroke(c, 7);
    c.beginPath(); c.moveTo(fx - R + 6, hy - R + 30); c.bezierCurveTo(fx - R + 6, hy - R - 70, fx + R - 6, hy - R - 70, fx + R - 6, hy - R + 30); c.closePath(); c.fill(); stroke(c, 7);
    c.fillStyle = '#5a1a1a'; c.fillRect(fx - R + 8, hy - R + 4, 2 * R - 16, 18);
  }
  if (o.hat === 'nvg') {
    const col = o.hatCol || '#5a5a44';
    c.beginPath(); c.moveTo(fx - R - 12, hy - 4); c.bezierCurveTo(fx - R - 16, hy - R - 56, fx + R + 16, hy - R - 56, fx + R + 12, hy - 4); c.lineTo(fx + R + 4, hy + 6); c.lineTo(fx - R - 4, hy + 6); c.closePath(); c.fillStyle = col; c.fill(); stroke(c, 8);
    ln(c, [[fx - R + 4, hy - 40], [fx + R - 4, hy - 40]], 5, shadeCol(col, .6));
    if (back) { c.beginPath(); c.roundRect(fx - 40, hy - 70, 80, 50, 10); c.fillStyle = '#2a2c24'; c.fill(); stroke(c, 5); }
    else { c.beginPath(); c.roundRect(fx - 20 + face * 30, hy - R - 2, 40, 36, 6); c.fillStyle = '#2a2c24'; c.fill(); stroke(c, 5);
      if (o.nvgDown) { const ff2 = fx + face * 40; c.beginPath(); c.roundRect(ff2 - 92, hy - 46, 184, 64, 22); c.fillStyle = '#1e201c'; c.fill(); stroke(c, 6);
        for (const k of [-3, -1, 1, 3]) { ell(c, ff2 + k * 21, hy - 14, 17, 17); c.fillStyle = '#7dff6a'; c.fill(); c.lineWidth = 4; c.strokeStyle = '#0c1a0a'; c.stroke(); ell(c, ff2 + k * 21 - 5, hy - 19, 5, 5); c.fillStyle = '#eaffe0'; c.fill(); } } }
  }
  if (o.hat === 'turban') {
    const col = o.hatCol || '#f1ece0';
    c.beginPath(); c.moveTo(fx - R - 8, hy - 30); c.bezierCurveTo(fx - R - 18, hy - R - 50, fx + R + 18, hy - R - 50, fx + R + 8, hy - 30); c.quadraticCurveTo(fx, hy - 62, fx - R - 8, hy - 30); c.closePath(); c.fillStyle = col; c.fill(); stroke(c, 8);
    for (let i = 0; i < 4; i++) qd(c, [fx - R + 6, hy - 50 - i * 26], [fx + 10, hy - 90 - i * 30 + (i % 2) * 24], [fx + R - 6, hy - 56 - i * 22], 4, 'rgba(120,110,90,.55)');
  }
  if (o.hat === 'nurse') { c.beginPath(); c.roundRect(fx - 60, hy - R - 34, 120, 52, 10); c.fillStyle = '#ffffff'; c.fill(); stroke(c, 6); c.fillStyle = '#d62828'; c.fillRect(fx - 8, hy - R - 26, 16, 36); c.fillRect(fx - 18, hy - R - 16, 36, 16); }

  if (o.hat === 'riot') {
    c.beginPath(); c.moveTo(fx - R - 14, hy + 10); c.bezierCurveTo(fx - R - 18, hy - R - 50, fx + R + 18, hy - R - 50, fx + R + 14, hy + 10); c.closePath(); c.fillStyle = o.hatCol || '#1f2a44'; c.fill(); stroke(c, 8);
    if (!back) { c.save(); c.globalAlpha = .35; c.beginPath(); c.roundRect(fx - R - 4, hy - 40, 2 * R + 8, 120, 30); c.fillStyle = '#9fc0e8'; c.fill(); c.restore(); c.beginPath(); c.roundRect(fx - R - 4, hy - 40, 2 * R + 8, 120, 30); stroke(c, 5); ln(c, [[fx - R + 10, hy - 30], [fx - 20, hy - 30]], 6, 'rgba(255,255,255,.7)'); }
  }
  if (o.hat === 'hood') {
    c.beginPath(); c.moveTo(fx - R - 22, hy + 70); c.bezierCurveTo(fx - R - 34, hy - R - 50, fx + R + 34, hy - R - 50, fx + R + 22, hy + 70); c.lineTo(fx + R - 6, hy + 70);
    if (!back) { c.bezierCurveTo(fx + R + 4, hy - R + 20, fx - R - 4, hy - R + 20, fx - R + 6, hy + 70); }
    c.closePath(); c.fillStyle = o.hatCol || '#18181c'; c.fill(); stroke(c, 8);
  }

  if (o.hat === 'ushanka') {
    const col = o.hatCol || '#6b4a32', lite = o.hatLite || '#8a6446';
    for (const k of [-1, 1]) { c.beginPath(); c.ellipse(fx + k * (R - 4), hy + 18, 34, 60, k * .1, 0, 7); c.fillStyle = col; c.fill(); stroke(c, 7); }
    c.beginPath(); c.moveTo(fx - R - 10, hy - 34); c.bezierCurveTo(fx - R - 10, hy - R - 58, fx + R + 10, hy - R - 58, fx + R + 10, hy - 34); c.closePath(); c.fillStyle = col; c.fill(); stroke(c, 8);
    for (let i = 0; i < 9; i++) { const x = fx - R + 20 + i * 26; ln(c, [[x, hy - R - 10 + Math.abs(i - 4) * 6], [x + 6, hy - R + 12 + Math.abs(i - 4) * 6]], 3, 'rgba(40,25,15,.45)'); }
    if (!back) { c.beginPath(); c.roundRect(fx - R - 6, hy - 70, 2 * R + 12, 46, 22); c.fillStyle = lite; c.fill(); stroke(c, 7); }
  }
  if (o.hat === 'milcap') {
    c.beginPath(); c.ellipse(fx, hy - R + 4, R + 26, 40, 0, 0, 7); c.fillStyle = o.hatCol || '#4d5f3b'; c.fill(); stroke(c, 7);
    c.fillStyle = '#b5302a'; c.fillRect(fx - R + 4, hy - R + 20, 2 * R - 8, 24); c.lineWidth = 6; c.strokeStyle = OUT; c.strokeRect(fx - R + 4, hy - R + 20, 2 * R - 8, 24);
    if (!back) { c.beginPath(); c.moveTo(fx - R + 10, hy - R + 46); c.quadraticCurveTo(fx + face * 30, hy - R + 86, fx + R - 10, hy - R + 46); c.closePath(); c.fillStyle = '#1b1712'; c.fill(); stroke(c, 5);
      c.save(); c.translate(fx + face * 20, hy - R + 4); c.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? 7 : 16; c.lineTo(Math.cos(a) * r, Math.sin(a) * r); } c.closePath(); c.fillStyle = '#e8b82e'; c.fill(); c.restore(); }
  }
}

// Billboard: plane that faces the camera around Y, texture redrawn each frame
export class Char {
  constructor(scene, opts, height = 2.0) {
    this.cv = document.createElement('canvas'); this.cv.width = CW; this.cv.height = CH;
    this.ctx = this.cv.getContext('2d');
    this.tex = new THREE.CanvasTexture(this.cv); this.tex.colorSpace = THREE.SRGBColorSpace; this.tex.anisotropy = 4;
    const mat = new THREE.MeshLambertMaterial({ map: this.tex, transparent: true, alphaTest: 0.35, emissive: 0xffffff, emissiveMap: this.tex, emissiveIntensity: opts.emissive ?? 0.28, side: THREE.DoubleSide });
    const w = height * CW / CH;
    const geo = new THREE.PlaneGeometry(w, height); geo.translate(0, height / 2 - height * 0.012, 0);
    this.mesh = new THREE.Mesh(geo, mat); this.opts = opts; scene.add(this.mesh);
    // contact shadow
    const sh = new THREE.Mesh(new THREE.CircleGeometry(height * 0.17, 24), new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: .35, depthWrite: false }));
    sh.rotation.x = -Math.PI / 2; sh.scale.set(1, .45, 1); sh.position.y = 0.006; this.shadow = sh; scene.add(sh);
    this.pos = new THREE.Vector3();
  }
  set(pos, state, cam) {
    Object.assign(this.cur = {}, this.opts, state);
    this.mesh.position.copy(pos); this.shadow.position.set(pos.x, pos.y + 0.006, pos.z);
    if (this.cur.sit) this.shadow.position.x += (this.cur.sitDir || 1) * 0.25;
    this.mesh.rotation.set(0, Math.atan2(cam.position.x - pos.x, cam.position.z - pos.z), 0);
    drawChar(this.ctx, this.cur);
    if (this.cur.sil) { const c = this.ctx; c.save(); c.globalCompositeOperation = 'source-atop'; c.fillStyle = this.cur.sil; c.fillRect(0, 0, CW, CH); c.restore(); }
    this.tex.needsUpdate = true;
    this.mesh.visible = this.shadow.visible = state.visible !== false;
  }
}
