// extra flags (sa, il, ir, tr, us) drawn to any canvas context; shared by billboard chars and 3D cloth flags
export function drawFlagM(c, kind, W, H, wv = 0) {
  c.save();
  if (kind === 'sa') {
    c.fillStyle = '#0a7a3a'; c.fillRect(0, 0, W, H); c.fillStyle = '#fff'; c.strokeStyle = '#fff';
    c.font = `bold ${H * .22}px "DejaVu Sans"`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('لا إله إلا الله محمد رسول الله', W / 2, H * .36);
    c.lineWidth = H * .028; c.beginPath(); c.moveTo(W * .2, H * .68); c.lineTo(W * .8, H * .68); c.stroke(); c.fillRect(W * .24, H * .64, W * .03, H * .09); c.fillRect(W * .74, H * .655, W * .05, H * .05);
  } else if (kind === 'il') {
    c.fillStyle = '#fff'; c.fillRect(0, 0, W, H); c.fillStyle = '#0a46a8'; c.fillRect(0, H * .1, W, H * .12); c.fillRect(0, H * .78, W, H * .12);
    c.strokeStyle = '#0a46a8'; c.lineWidth = H * .035; const R = H * .2; for (const s of [1, -1]) { c.beginPath(); for (let i = 0; i < 3; i++) { const a = -Math.PI / 2 * s + i * 2.0944; const x = W / 2 + Math.cos(a) * R, y = H / 2 + Math.sin(a) * R; i ? c.lineTo(x, y) : c.moveTo(x, y); } c.closePath(); c.stroke(); }
  } else if (kind === 'ir') {
    c.fillStyle = '#1a9a3a'; c.fillRect(0, 0, W, H / 3 + 1); c.fillStyle = '#fff'; c.fillRect(0, H / 3, W, H / 3 + 1); c.fillStyle = '#d8281e'; c.fillRect(0, H * 2 / 3, W, H / 3 + 1);
    c.strokeStyle = '#d8281e'; c.lineWidth = H * .035; c.beginPath(); c.arc(W / 2, H / 2, H * .1, .5, 5.8); c.stroke(); c.beginPath(); c.moveTo(W / 2, H * .4); c.lineTo(W / 2, H * .6); c.stroke();
  } else if (kind === 'tr') {
    c.fillStyle = '#e30a17'; c.fillRect(0, 0, W, H); c.fillStyle = '#fff'; c.beginPath(); c.arc(W * .4, H / 2, H * .25, 0, 7); c.fill(); c.fillStyle = '#e30a17'; c.beginPath(); c.arc(W * .46, H / 2, H * .2, 0, 7); c.fill();
    c.fillStyle = '#fff'; c.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? H * .06 : H * .13; const x = W * .6 + Math.cos(a) * r, y = H / 2 + Math.sin(a) * r; i ? c.lineTo(x, y) : c.moveTo(x, y); } c.closePath(); c.fill();
  } else if (kind === 'us') {
    for (let i = 0; i < 13; i++) { c.fillStyle = i % 2 ? '#ffffff' : '#c8102e'; c.fillRect(0, i * H / 13, W, H / 13 + 1); }
    c.fillStyle = '#1f3a8a'; c.fillRect(0, 0, W * .42, H * 7 / 13); c.fillStyle = '#fff'; for (let r = 0; r < 5; r++) for (let k = 0; k < 6; k++) { c.beginPath(); c.arc(W * .42 / 6 * (k + .5), H * 7 / 13 / 5 * (r + .5), H * .02, 0, 7); c.fill(); }
  }
  c.restore();
}
export const MFLAGS = ['sa', 'il', 'ir', 'tr', 'us'];
