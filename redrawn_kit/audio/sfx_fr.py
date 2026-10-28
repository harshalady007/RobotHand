# executed inside mix_fr.py (helpers, bus, put, wt, F, SR, N, D, rng available)
def jhash(n):
    v = np.sin(n * 127.1 + 311.7) * 43758.5453; return v - np.floor(v)
def echo(word, n, taps=((.16, .5), (.32, .3), (.48, .18), (.64, .1)), length=.75):
    a = wt(word, n); s = int(a * SR); seg = bus['vo'][s:s + int(length * SR)].copy(); seg = lp(seg, 3500)
    for d, g in taps: put('sfx', a + d, seg, g)
echo('burning', 1); echo('riots', 1); echo('matters', 1); echo('world', 1, taps=((.22, .5), (.44, .32), (.66, .2), (.88, .12)))
def siren(dur, g=.3):  # French two-tone "pin-pon"
    n = int(dur * SR); t = T(n); f = np.where((t % 1.0) < .5, 435, 580); ph = 2 * np.pi * np.cumsum(f) / SR
    x = np.sin(ph) + .4 * np.sin(2 * ph) + .2 * np.sin(3 * ph); return lp(x, 3000) * env(n, .05, .2) * g
def crowd_roar(dur, g=.3, mod=1.5): return noise_bed(dur, 250, 2600, g, mod) + noise_bed(dur, 80, 400, g * .6, .4)
def glass(g=.6):
    n = int(.9 * SR); t = T(n); x = np.zeros(n)
    for k in range(40): s = int((rng.random() ** 2) * n * .7); m = int(.015 * SR); f = 2500 + rng.random() * 6000; x[s:s + m] += np.sin(2 * np.pi * f * T(m)) * np.exp(-T(m) * 150) * (.3 + rng.random())
    x += hp(rng.standard_normal(n), 3000) * np.exp(-t * 9) * .6; return x * g
def mortar(g=.7):
    n = int(1.2 * SR); t = T(n); x = boom(1, 70, 1.2) * .8
    for k in range(25): s = int(.15 * SR + rng.random() * .8 * SR); m = int(.01 * SR); x[s:s + m] += hp(rng.standard_normal(m), 2000) * .5
    return x * g
def crackle(dur, g=.2):
    n = int(dur * SR); x = np.zeros(n)
    for k in range(int(dur * 60)): s = int(rng.random() * (n - 400)); m = int((.002 + rng.random() * .01) * SR); x[s:s + m] += rng.standard_normal(m) * rng.random()
    return (hp(x, 800) + lp(rng.standard_normal(n), 250) * .5) * env(n, .2, .3) * g
def bell(dur, g=.3):
    n = int(dur * SR); t = T(n); x = np.sin(2 * np.pi * 900 * t) * (np.sin(2 * np.pi * 30 * t) > 0); return lp(x.astype(float), 4000) * env(n, .01, .1) * g
def plink(g=.4, f=1800):
    n = int(.25 * SR); t = T(n); return np.sin(2 * np.pi * f * t * (1 + .5 * np.exp(-t * 40))) * np.exp(-t * 18) * g
def ching(g=.4):
    n = int(.8 * SR); t = T(n); x = sum(np.sin(2 * np.pi * f * t) * np.exp(-t * d) for f, d in [(2100, 5), (3150, 6), (4200, 8)]); return (x + hp(rng.standard_normal(n), 4000) * np.exp(-t * 30)) * g
def whistle(dur, g=.25):
    n = int(dur * SR); t = T(n); f = 3000 + 120 * np.sin(2 * np.pi * 28 * t); return np.sin(2 * np.pi * np.cumsum(f) / SR) * env(n, .02, .08) * g
def shutter(g=.4): x = click(g, 2500); return np.concatenate([x, np.zeros(int(.05 * SR)), click(g * .8, 1800)])
def metal(g=.5):
    n = int(.6 * SR); t = T(n); return (sum(np.sin(2 * np.pi * f * t + rng.random() * 6) for f in (320, 517, 893, 1240)) * np.exp(-t * 9) * .25 + lp(rng.standard_normal(n), 2000) * np.exp(-t * 30)) * g
def hiss(dur, g=.3): n = int(dur * SR); return hp(rng.standard_normal(n), 2500) * env(n, .01, dur * .8) * g
def swish(g=.2): n = int(.35 * SR); t = T(n); return bp(rng.standard_normal(n), 800, 3000) * np.sin(np.pi * t / t[-1]) ** 2 * g
def alarm_bell(dur, g=.2): return bell(dur, g)
S = lambda at, x, g=1.: put('sfx', at, x, g)
A = lambda at, x, g=1.: put('amb', at, x, g)
# ---- cold open (0-0.9s before VO) ----
A(0.0, siren(4.5, .22)); A(0.0, crowd_roar(5.0, .14)); S(.12, mortar(.9)); S(.6, riser(.3, .3))
S(wt('burning'), hit(.9)); A(.3, crackle(5.5, .25))
S(wt('riots') - .05, glass(.55)); S(wt('riots'), hit(.85)); S(wt('france', 1) - .2, hiss(1.0, .25)); S(wt('protests') + .1, metal(.35)); S(wt('france', 1) + .25, metal(.4))
# ---- school ----
c3 = wt('it') - .1
S(c3, bell(1.2, .14)); A(c3, noise_bed(2.6, 400, 2500, .1, 2.5))
# drips: plink each time drip lands (t*1.3 integer) inside classroom shot
c4, c5 = wt('more', 1) - .1, wt('but', 2) - .1
k = np.ceil(c4 * 1.3) / 1.3
while k < c5: S(k, plink(.45, 1700 + rng.random() * 300)); k += 1 / 1.3
S(wt('conditions'), boom(.4, 60, .9))
# ---- march ----
c6 = wt('but', 2) - .1; A(c6, crowd_roar(2.2, .3, 2)); kk = c6
while kk < wt('rising') - .1: S(kk, stomp(.35)); S(kk + .25, snare(.12)); kk += .5
S(wt('anger', 2), whistle(.5, .14))
# ---- prices ----
c7 = wt('rising') - .1
for i in range(10): S(c7 + .35 + i * .18, pop(.18, 600 + i * 80))
S(wt('costs'), ching(.45)); S(wt('inequality'), boom(.4, 55, .9))
S(wt('frustration') - .1, boom(.55, 45, 1.4)); S(wt('spending'), metal(.25))
# ---- map pings ----
sp0, sp1 = wt('local'), wt('movement')
for i in range(12): st = sp0 - .3 if i == 0 else sp0 + (i / 12) * (sp1 - sp0 + .3); S(st, plink(.35, 900 + i * 90))
S(wt('nationwide'), riser(.8, .3)); S(wt('movement'), hit(.7))
# ---- calendar ----
S(wt('october') + .05, whoosh(.35, .5)); S(wt('2026'), hit(.95)); S(wt('2026') - .5, riser(.5, .3))
# ---- huge crowd ----
c11 = wt('hundreds') - .1; A(c11, crowd_roar(3.3, .42, 1.2))
for i in range(5): S(c11 + .3 + i * .55, whistle(.35, .12))
S(wt('thousands'), boom(.6, 50, 1.4))
# ---- turn violent ----
A(wt('while', 1) - .1, crowd_roar(2.6, .16, 1)); S(wt('some') - .2, riser(1.0, .4))
S(wt('violent', 1), hit(1.0)); S(wt('violent', 1) + .38, glass(.7))
# ---- looted / attacked / fires / clashed ----
S(wt('looted') - .05, glass(.7)); A(wt('shops'), alarm_bell(1.0, .08))
S(wt('attacked') - .05, boom(.7, 60, .8)); S(wt('attacked') + .15, metal(.5)); S(wt('buildings'), metal(.35))
S(wt('fires') - .25, whoosh(.5, .7, True)); S(wt('fires'), boom(.9, 45, 1.6)); A(wt('fires'), crackle(1.6, .4))
c16 = wt('and', 3) - .1; A(c16, crowd_roar(2.2, .3, 3)); S(c16 + .2, mortar(.6)); S(wt('clashed'), metal(.7)); S(wt('clashed') + .25, metal(.5)); S(wt('demonstrators') - .3, hiss(1.2, .3)); S(wt('demonstrators') + .3, mortar(.5))
# ---- press: shutter clicks synced to flash pattern ----
p0, p1 = wt('authorities') - .1, wt('while', 2) - .1
for f in range(int(p0 * 6), int(p1 * 6)):
    if jhash(f * 7) > .78: S(f / 6, shutter(.35))
S(wt('extremist'), boom(.45, 55, 1.0))
# ---- newspaper ----
S(wt('while', 2) - .1, swish(.35)); S(wt('crisis'), hit(.8))
# ---- aftermath: broom swishes ----
c19, c20 = wt('now') - .1, wt('and', 5) - .1; kk = c19 + .2
while kk < c20: S(kk, swish(.14)); kk += .6
S(wt('order'), boom(.4, 60, 1.0)); S(wt('grievances'), boom(.4, 55, 1.0))
# ---- reflective ending ----
hb = wt('because') - .1
for i in range(6): S(hb + i * .8, heartbeat(.55))
A(hb, lp(siren(5.5, .07), 1200))
# ---- logo ----
lg = wt('this') - .12
S(lg - .9, revwhoosh(.9, .55)); S(lg, hit(1.0)); S(lg + .05, ching(.25))
S(wt('follow') - .05, pop(.5, 520)); S(wt('world') - .1, click(.8, 2200)); S(wt('world'), ching(.3))

# ---------------- music: tense pulse in A minor, 110 bpm ----------------
t = T(N); bpm = 110; beat = 60 / bpm; root = 55.0
prog = [0, 0, -4, -2]
mus = np.zeros(N)
for i in range(int(D / (beat * 8)) + 1):
    s0 = int(i * beat * 8 * SR); n = int((beat * 8 + .5) * SR)
    if s0 >= N: break
    tt = T(n); f = root * 2 ** (prog[i % 4] / 12)
    pad = sum(np.sin(2 * np.pi * f * m * tt * (1 + d)) for m in (1, 1.5, 2, 3) for d in (-.003, .003)) / 8
    e = min(N, s0 + n); mus[s0:e] += (pad * env(n, .6, .6) * .5)[:e - s0]
put('music', 0, mus * .5)
k = 0.0
while k < D:
    n = int(beat / 2 * SR); tt = T(n); i = int(k / (beat * 8)) % 4; f = root * 2 * 2 ** (prog[i] / 12)
    x = (2 * ((f * tt) % 1) - 1) * np.exp(-tt * 9); put('music', k, lp(x, 1000) * .22); k += beat / 2
k = wt('burning')
while k < D - 2:
    n = int(.3 * SR); tt = T(n); put('music', k, np.sin(2 * np.pi * (55 * tt - 40 * tt ** 2)) * np.exp(-tt * 12) * .35)
    put('music', k + beat / 2, hp(rng.standard_normal(int(.05 * SR)), 6000) * np.exp(-T(int(.05 * SR)) * 60) * .08); k += beat
g = np.ones(N)
def dip(a, b, lvl=.15, r=.08):
    i0, i1 = int(a * SR), int(b * SR); g[i0:i1] = np.minimum(g[i0:i1], lvl); R = int(r * SR)
    g[max(0, i0 - R):i0] = np.minimum(g[max(0, i0 - R):i0], np.linspace(1, lvl, len(g[max(0, i0 - R):i0]))); g[i1:i1 + R] = np.minimum(g[i1:i1 + R], np.linspace(lvl, 1, len(g[i1:i1 + R])))
dip(0, .9, .35); dip(wt('violent', 1) + .2, wt('shops') - .05, .08); dip(wt('now') - .1, wt('because') - .1, .5); dip(wt('because') - .1, lg, .3); dip(lg + .3, D, .6, .3)
bus['music'] *= g
voe = np.abs(bus['vo']); voe = lp(voe, 8); voe /= voe.max() + 1e-9; duck = 1 - .55 * np.clip(voe * 3, 0, 1)
mix = bus['vo'] * 1.0 + bus['sfx'] * .55 + bus['amb'] * .6 + bus['music'] * .5 * duck
mix = np.tanh(mix * 1.15) / np.tanh(1.15)
fe = int((D - .8) * SR); mix[fe:] *= np.linspace(1, 0, N - fe)
mix /= np.max(np.abs(mix)) * 1.05
sf.write('mix.wav', np.stack([mix, mix], 1).astype(np.float32), SR)
print('ok', D)
