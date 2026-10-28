import json, numpy as np, soundfile as sf
from scipy.signal import butter, sosfilt
SR = 48000
rng = np.random.default_rng(7)
TL = json.load(open('/home/claude/osama3d/timeline.json'))
D = TL['duration']; N = int(D * SR)
PRE, CUTS, INS = TL['pre'], TL['cuts'], TL['ins']
def F(t): return t  # timeline words already in final time
W = {}
for w in TL['words']:
    k = w['w'].strip('.,?!').lower(); W.setdefault(k, []).append(w['a'])
def wt(k, n=1): return W[k.strip('.,?!').lower()][n - 1]

def bp(x, lo, hi, order=2): return sosfilt(butter(order, [lo, hi], 'band', fs=SR, output='sos'), x)
def lp(x, f, order=2): return sosfilt(butter(order, f, 'low', fs=SR, output='sos'), x)
def hp(x, f, order=2): return sosfilt(butter(order, f, 'high', fs=SR, output='sos'), x)
def env(n, a, r): e = np.ones(n); A = max(1, int(a * SR)); R = max(1, int(r * SR)); e[:A] = np.linspace(0, 1, A); e[-R:] *= np.linspace(1, 0, R); return e
def T(n): return np.arange(n) / SR
bus = {k: np.zeros(N) for k in ('vo', 'sfx', 'music', 'amb')}
def put(b, at, x, g=1.0):
    s = int(at * SR)
    if s < 0: x = x[-s:]; s = 0
    e = min(N, s + len(x)); bus[b][s:e] += x[:e - s] * g

# ---------------- VO assembly ----------------
vo, sr = sf.read('vo_edit.wav', dtype='float32'); assert sr == SR
cuts = [0] + [int(c * SR) for c in CUTS] + [len(vo)]
pos = PRE
for i in range(len(cuts) - 1):
    part = vo[cuts[i]:cuts[i + 1]].astype(np.float64)
    put('vo', pos, part); pos += len(part) / SR + (INS[i] if i < len(INS) else 0)
# ---------------- synth helpers ----------------
def boom(g=1., f0=60, dur=1.8):
    n = int(dur * SR); t = T(n); x = np.sin(2 * np.pi * (f0 * t - 18 * t ** 2)) * np.exp(-t * 2.4)
    x += lp(rng.standard_normal(n), 900) * np.exp(-t * 9) * .9
    return np.tanh(x * 1.6) * g
def hit(g=1.):  # cinematic impact: boom + metallic ring
    n = int(2.2 * SR); t = T(n); x = boom(1, 55, 2.2)
    for f in (220, 331, 497, 750): x += np.sin(2 * np.pi * f * t + rng.random() * 6) * np.exp(-t * 3) * .08
    x += hp(rng.standard_normal(n), 3000) * np.exp(-t * 18) * .5
    return x * g
def whoosh(dur=.5, g=.5, up=True):
    n = int(dur * SR); t = T(n); x = rng.standard_normal(n); out = np.zeros(n)
    for k in range(8):
        sl = slice(k * n // 8, (k + 1) * n // 8); f = 400 + (k / 7 if up else 1 - k / 7) * 3500; out[sl] = bp(x, f * .6, f * 1.4)[sl]
    return out * np.sin(np.pi * t / t[-1]) ** 2 * g
def riser(dur, g=.4):
    n = int(dur * SR); t = T(n); x = hp(rng.standard_normal(n), 800) * (t / t[-1]) ** 2
    x += np.sin(2 * np.pi * (200 * t + 300 * t ** 2 / dur)) * (t / t[-1]) ** 2 * .3
    return x * g
def revwhoosh(dur=.9, g=.6): return whoosh(dur, g, True) * np.linspace(0, 1, int(dur * SR)) ** 2
def click(g=.5, f=3000):
    n = int(.03 * SR); t = T(n); return bp(rng.standard_normal(n), f * .7, f * 1.3) * np.exp(-t * 200) * g
def pop(g=.5, f=500):
    n = int(.16 * SR); t = T(n); return np.sin(2 * np.pi * (f * t + 600 * t ** 2)) * np.exp(-t * 28) * g
def alarm(dur, g=.5):
    n = int(dur * SR); t = T(n); car = np.sin(2 * np.pi * 2400 * t) + .6 * np.sin(2 * np.pi * 3170 * t) + .3 * np.sin(2 * np.pi * 4900 * t)
    gate = (np.sin(2 * np.pi * 22 * t) > 0).astype(float); gate = lp(gate, 400)
    return car * gate * env(n, .005, .05) * g
def phone(dur, g=.3):
    n = int(dur * SR); t = T(n); car = np.sin(2 * np.pi * 1000 * t) + np.sin(2 * np.pi * 1200 * t)
    gate = ((t % 1.2) < .7) * (np.sin(2 * np.pi * 20 * t) > 0); return car * lp(gate.astype(float), 300) * g
def noise_bed(dur, lo, hi, g, mod=0):
    n = int(dur * SR); t = T(n); x = bp(rng.standard_normal(n), lo, hi)
    if mod: x *= 1 + .5 * np.sin(2 * np.pi * mod * t + rng.random() * 6)
    return x * env(n, .3, .4) * g
def stomp(g=.6):
    n = int(.25 * SR); t = T(n); return (np.sin(2 * np.pi * 70 * t) * np.exp(-t * 22) + lp(rng.standard_normal(n), 1500) * np.exp(-t * 40) * .5) * g
def snare(g=.3):
    n = int(.2 * SR); t = T(n); return (hp(rng.standard_normal(n), 1500) * np.exp(-t * 25) + np.sin(2 * np.pi * 190 * t) * np.exp(-t * 30) * .5) * g
def crack(g=.6):
    n = int(.35 * SR); t = T(n); x = np.zeros(n)
    for k in range(6): s = int(rng.random() * n * .6); m = int(.02 * SR); x[s:s + m] += hp(rng.standard_normal(m), 1200) * np.exp(-np.arange(m) / SR * 120)
    return (x + lp(rng.standard_normal(n), 300) * np.exp(-t * 10) * .6) * g
def heartbeat(g=.7):
    n = int(.6 * SR); t = T(n); b = lambda tt: np.sin(2 * np.pi * 50 * tt) * np.exp(-tt * 18) * (tt >= 0)
    return (b(t) + .7 * b(t - .22)) * g
def tick(g=.35, f=2500): return click(g, f)
def glitch(dur=.5, g=.4):
    n = int(dur * SR); x = np.zeros(n); k = 0
    while k < n: L = int((.02 + rng.random() * .05) * SR); x[k:k + L] = (np.sign(np.sin(2 * np.pi * (200 + rng.random() * 1800) * T(min(L, n - k)))) * .6 if rng.random() > .3 else 0); k += L
    return lp(x, 6000) * g
def static(dur, g=.25): n = int(dur * SR); return hp(rng.standard_normal(n), 2000) * env(n, .01, .1) * g
def engine(dur, g=.5):
    n = int(dur * SR); t = T(n); x = sum(np.sin(2 * np.pi * f * t * (1 + .02 * np.sin(2 * np.pi * 3 * t))) / (i + 1) for i, f in enumerate([38, 76, 114, 152]))
    x += lp(rng.standard_normal(n), 400) * .8; return x * env(n, .4, .5) * g
def drum(g=.7): return boom(g, 45, 1.4)

exec(open('sfx_ob.py').read())
