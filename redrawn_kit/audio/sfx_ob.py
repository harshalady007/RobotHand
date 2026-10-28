# executed inside mix_ob.py
exec("\n".join(l for l in open('/home/claude/france/sfx_fr.py').read().split("S = lambda at")[0].splitlines() if l.startswith('def ') or l.startswith('    ')))
SH = json.load(open('/home/claude/osama3d/shots.json')); CUT = [s[1] for s in SH[1:]]
def radio(dur, g=.15):
    n = int(dur * SR); x = bp(rng.standard_normal(n), 800, 3500) * (.5 + .5 * (np.sin(2 * np.pi * 7 * T(n)) > 0)); return x * env(n, .01, .05) * g
def ping(g=.3, f=1500):
    n = int(1.0 * SR); t = T(n); return (np.sin(2 * np.pi * f * t) * np.exp(-t * 4) + .3 * np.sin(2 * np.pi * f * 2.01 * t) * np.exp(-t * 6)) * g
def data_beeps(at, dur, g=.08):
    k = 0.0
    while k < dur: put('sfx', at + k, np.sin(2 * np.pi * (1500 + rng.random() * 1500) * T(int(.04 * SR))) * g); k += .09 + rng.random() * .15
S = lambda at, x, g=1.: put('sfx', at, x, g)
A = lambda at, x, g=1.: put('amb', at, x, g)

def rotor(dur, g=.4, rate=17.2, shape=None, muff=900):
    n = int(dur * SR); t = T(n)
    ph = (t * rate) % 1; slap = np.exp(-ph * 9)                      # blade slap pulses
    x = lp(rng.standard_normal(n), muff) * (.35 + 1.4 * slap) + np.sin(2 * np.pi * rate * t) * .25 * slap
    x += np.sin(2 * np.pi * 820 * t + 3 * np.sin(2 * np.pi * .3 * t)) * .035      # turbine whine
    e = shape(t) if shape is not None else env(n, .3, .4)
    return x * e * g
def flyby(dur, peak, g=.6):  # loud pass with doppler-ish brightness at peak
    return rotor(dur, g, 17.2 * 1.0, shape=lambda t: np.exp(-((t - peak) / (dur * .28)) ** 2), muff=1600)
def crickets(dur, g=.05):
    n = int(dur * SR); t = T(n); x = np.zeros(n)
    for f, r, ph in [(4300, 2.3, 0), (4700, 3.1, 1), (5100, 1.7, 2)]:
        x += np.sin(2 * np.pi * f * t) * ((np.sin(2 * np.pi * r * t + ph) > .6) * (np.sin(2 * np.pi * 38 * t) > 0))
    return lp(x.astype(float), 7000) * env(n, .4, .4) * g
def hum(dur, g=.05): n = int(dur * SR); t = T(n); return (np.sin(2 * np.pi * 120 * t) + .5 * np.sin(2 * np.pi * 240 * t)) * env(n, .1, .2) * g
def lockbeeps(at, until, g=.22):
    k = at; gap = .3
    while k < until: S(k, np.sin(2 * np.pi * 1800 * T(int(.05 * SR))) * g); k += gap; gap = max(.06, gap * .82)
    n = int(.6 * SR); S(until, np.sin(2 * np.pi * 1800 * T(n)) * env(n, .005, .2) * g)
def typing(at, dur, g=.18):
    k = at
    while k < at + dur: S(k, click(g * (.6 + rng.random() * .5), 1500 + rng.random() * 2000)); k += .06 + rng.random() * .1
def footsteps(at, dur, rate=.42, g=.25):
    k = at
    while k < at + dur: S(k, lp(rng.standard_normal(int(.08 * SR)), 900) * np.exp(-T(int(.08 * SR)) * 50) * g); k += rate
def ticks(at, until, gap=.11, g=.25):
    k = at; i = 0
    while k < until: S(k, click(g, 3200 if i % 2 else 2500)); k += gap; i += 1
def thud(g=.8):
    n = int(.5 * SR); t = T(n); return (np.sin(2 * np.pi * (90 * t - 60 * t * t)) * np.exp(-t * 14) + lp(rng.standard_normal(n), 1200) * np.exp(-t * 40) * .6) * g
def nvg_whine(g=.12):
    n = int(.9 * SR); t = T(n); f = 2500 + 6000 * (t / t[-1]) ** .5; return np.sin(2 * np.pi * np.cumsum(f) / SR) * env(n, .05, .3) * g
def sting(g=.35):  # news brass-like stab
    n = int(1.3 * SR); t = T(n); x = 0
    for f in (146.8, 220, 293.7, 349.2): x = x + np.sign(np.sin(2 * np.pi * f * t)) * .25 + np.sin(2 * np.pi * f * 2 * t) * .15
    return lp(x, 2600) * np.exp(-t * 2.2) * env(n, .01, .3) * g
def tinnitus(dur, g=.08): n = int(dur * SR); t = T(n); return np.sin(2 * np.pi * 4200 * t) * np.exp(-t * 1.4) * env(n, .01, .3) * g
def chime(g=.3):
    n = int(1.2 * SR); t = T(n); return sum(np.sin(2 * np.pi * f * t) * np.exp(-t * 3) for f in (1046.5, 1318.5, 1568)) * g / 3 * 2
def errbuzz(g=.2): n = int(.25 * SR); t = T(n); return lp(np.sign(np.sin(2 * np.pi * 180 * t)), 2500) * env(n, .005, .05) * g
def snare_roll(at, dur, g=.18):
    k = at; i = 0
    while k < at + dur: S(k, snare(g * (1.3 if i % 4 == 0 else .7))); k += .125; i += 1
def birds(dur, g=.05):
    n = int(dur * SR); x = np.zeros(n)
    for k in range(int(dur * 3)):
        s = int(rng.random() * (n - SR * .3)); m = int(.12 * SR); tt = T(m); f = 3000 + rng.random() * 2500
        x[s:s + m] += np.sin(2 * np.pi * (f * tt + 4000 * tt * tt * (1 if rng.random() > .5 else -1))) * np.sin(np.pi * tt / tt[-1])
    return x * g

echo('changed', 1); echo('over', 1); echo('academy', 1, taps=((.2, .45), (.4, .28), (.6, .16))); echo('events', 1, taps=((.22, .5), (.44, .32), (.66, .2), (.88, .12)))
# transitions: whoosh into every cut (lighter on emotional ones)
for c in CUT:
    if 21 < c < 23.8 or c > 64: continue
    S(c - .28, whoosh(.36, .28))

# 1) COLD OPEN: helicopters roaring in
S(0, hit(.9)); S(0, boom(.7, 45, 2.0))
A(0, rotor(2.6, .55, shape=lambda t: .25 + .75 * np.clip(t / 2.2, 0, 1) ** 2, muff=1300))
S(1.3, riser(.9, .3))
# 2) WANTED poster
pc = CUT[0]; S(pc, hit(.95)); A(pc, hum(3.0, .05)); S(wt('wanted') - .02, boom(.6, 50, 1.5)); S(wt('terrorist'), plink(.2, 900))
# 3) compound at night + flyover
A(CUT[1], crickets(3.2, .06)); chg = wt('changed')
A(chg - 1.1, flyby(2.6, 1.1, .75)); S(chg, hit(1.15)); S(chg, boom(.9, 40, 2.4)); S(chg - .6, riser(.6, .35))
# 4) calendar
S(wt('may') + .02, swish(.35)); S(wt('2011'), hit(.95)); S(wt('2011') - .45, riser(.45, .3))
# 5) map pin
S(wt('abbottabad'), boom(.6, 60, 1.2)); S(wt('abbottabad'), plink(.35, 1200)); S(wt('pakistan') + .1, plink(.25, 1600))
# 6) valley tracking: rotors loud
A(CUT[4], rotor(CUT[5] - CUT[4] + .25, .6, muff=1500)); S(wt('helicopters'), boom(.45, 55, 1.2))
# 7) route
k = CUT[5] + .1
while k < CUT[6] - .1: S(k, plink(.12, 2400)); k += .14
pk1 = wt('pakistani', 1); S(pk1, alarm(.5, .12)); S(pk1, hit(.6))
# 8) cabin interior rumble + radio
A(CUT[6], rotor(CUT[7] - CUT[6] + .2, .45, muff=380)); S(wt('secret') - .2, radio(.5, .14)); S(wt('mission', 1), click(.4, 2000))
# 9) target lock
lockbeeps(CUT[7] + .15, wt('osama'), .2); S(wt('osama'), hit(1.0)); S(wt('laden', 1), boom(.4, 50, 1.0))
# 10) New York: solemn
S(CUT[8], ching(.18)); A(CUT[8], noise_bed(2.8, 60, 220, .12, .1))
# 11) intel search
for i in range(3): S(CUT[9] + .1 + i * .48, ping(.2, 1300))
S(wt('him') - .3, riser(.35, .25))
# 12) analysts typing
typing(CUT[10] + .05, CUT[11] - CUT[10] - .1)
# 13) string board
for i in range(5): S(CUT[11] + .15 + i * .45, swish(.18)); S(CUT[11] + .5 + i * .45, pop(.22, 420 + i * 40))
S(wt('couriers'), boom(.4, 55, 1.0))
# 14) car tracking
A(CUT[12], engine(CUT[13] - CUT[12], .25)); data_beeps(CUT[12] + .1, 2.6, .06); S(CUT[13] - .9, whistle(.35, .06))
S(wt('mysterious') - .5, riser(.5, .3)); S(wt('compound', 1), hit(.85))
# 15) walls
A(CUT[13], noise_bed(1.6, 300, 1500, .1, .2)); S(wt('walls'), boom(.6, 45, 1.6))
# 16) no phone / internet
A(CUT[14], crackle(2.5, .1)); S(wt('obvious') - .05, errbuzz(.18)); S(wt('ordinary') - .05, errbuzz(.18))
# 17) satellite
data_beeps(CUT[15], 1.4, .06); S(CUT[15] + .3, shutter(.3)); S(CUT[15] + .9, shutter(.3))
# 18) approved stamp
ap = wt('approved') + .04; S(ap - .24, swish(.3)); S(ap, thud(1.0)); S(ap, hit(.8))
# 19) helicopters arrive
A(CUT[17] - .3, rotor(CUT[18] - CUT[17] + .9, .75, shape=lambda t: np.clip(t / 1.0, 0, 1) * (1 - .3 * np.clip((t - 1.3) / .5, 0, 1)), muff=1500)); A(CUT[17] + .5, noise_bed(1.4, 400, 3000, .12, 0))
S(wt('darkness'), boom(.6, 40, 1.8))
# 20) NVG approach + breach
S(CUT[18] - .05, nvg_whine(.14)); A(CUT[18], rotor(CUT[19] - CUT[18], .2, muff=500)); footsteps(CUT[18] + .15, wt('compound', 2) - CUT[18] - .1, .36, .22)
br = wt('compound', 2) + .3; S(br - .5, riser(.5, .35)); S(br, boom(1.1, 38, 2.4)); S(br, hit(1.0)); S(br + .02, glass(.35)); S(br + .1, tinnitus(1.6, .07))
# 21) stopwatch
ticks(CUT[19] + .05, wt('hour'), .1, .22); S(wt('hour'), ching(.3)); S(wt('hour'), boom(.4, 55, 1.0))
# 22) DECEASED
kl = wt('killed'); S(kl - .2, swish(.3)); S(kl - .05, thud(1.0)); S(kl - .05, hit(1.1)); S(kl - .05, boom(.8, 40, 2.2))
# 23) liftoff + wreck burning
A(CUT[21], rotor(CUT[22] - CUT[21] + .3, .6, muff=1400)); A(CUT[21], crackle(1.6, .14)); S(CUT[21] + .1, boom(.5, 45, 1.6))
# 24) ID confirmed
data_beeps(CUT[22], .9, .07); S(wt('identification') + .35, chime(.35))
# 25) announcement
S(CUT[23], sting(.4)); S(CUT[23] + .4, shutter(.25)); S(CUT[23] + .9, shutter(.22)); S(CUT[23] + 1.5, shutter(.25))
# 26) crowd celebrating
A(CUT[24] - .1, crowd_roar(CUT[25] - CUT[24] + .3, .26, 2.2)); S(CUT[24] + .3, whistle(.4, .1)); S(CUT[24] + 1.1, whistle(.3, .08))
# 27) years flipping
y0 = CUT[25] + .1; y1 = wt('decade') + .25
for i in range(10): S(y0 + (y1 - y0) * (i + 1) / 10, click(.35, 2200))
S(wt('decade'), boom(.5, 50, 1.4))
# 28) poster falls
fl = wt('hunt') + .05; S(fl, pop(.3, 700)); S(fl + .05, whoosh(.35, .25, False)); S(wt('over') + .1, thud(.5)); S(wt('over'), hit(.7))
# 29) ominous night
A(CUT[27], noise_bed(1.8, 50, 160, .25, .2)); A(CUT[27], crickets(1.8, .05))
for i in range(3): S(CUT[27] + .2 + i * .6, heartbeat(.55))
S(wt('question') - .4, riser(.4, .3)); S(wt('question'), boom(.4, 45, 1.2))
# 30) daytime town
A(CUT[28], birds(3.6, .05)); A(CUT[28], noise_bed(3.6, 200, 1500, .05, .1)); S(wt('plain'), boom(.4, 55, 1.0))
# 31) academy reveal
S(CUT[29], revwhoosh(.6, .4)); snare_roll(CUT[29] + .2, CUT[30] - CUT[29] - .5, .14); S(wt('academy'), hit(1.1)); S(wt('academy'), boom(.8, 40, 2.0))
# 32) logo
lg = wt('this') - .12
S(lg - .9, revwhoosh(.9, .55)); S(lg, hit(1.0)); S(lg + .05, ching(.25)); S(wt('history') - .05, pop(.5, 520)); S(wt('world-changing') - .1, click(.8, 2200)); S(wt('world-changing'), ching(.3))

# ---------------- music: military tension pulse, D minor, 96 bpm ----------------
bpm = 96; beat = 60 / bpm; root = 36.71  # D1
motif = [0, 0, 3, 0, 7, 0, 5, 3]
k = CUT[0]; i = 0
while k < D:
    n = int(beat / 2 * SR); tt = T(n); f = root * 2 * 2 ** (motif[i % 8] / 12)
    x = (np.sin(2 * np.pi * f * tt) + .5 * np.sin(4 * np.pi * f * tt)) * np.exp(-tt * 7); put('music', k, x * .35); k += beat / 2; i += 1
pad = np.zeros(N)
for j in range(int(D / (beat * 8)) + 1):
    s0 = int(j * beat * 8 * SR); n = int((beat * 8 + .5) * SR)
    if s0 >= N: break
    tt = T(n); f = root * 4 * 2 ** ([0, 0, -4, -2][j % 4] / 12)
    p = sum(np.sin(2 * np.pi * f * m * tt * (1 + d)) for m in (1, 1.2, 1.5) for d in (-.003, .003)) / 6
    e = min(N, s0 + n); pad[s0:e] += (p * env(n, .6, .6) * .4)[:e - s0]
put('music', 0, pad * .5)
k = chg + .1
while k < D - 2:  # taiko-ish drum pulse after "everything changed"
    n = int(.3 * SR); tt = T(n); put('music', k, np.sin(2 * np.pi * (55 * tt - 40 * tt ** 2)) * np.exp(-tt * 12) * .32)
    put('music', k + beat / 2, hp(rng.standard_normal(int(.05 * SR)), 6000) * np.exp(-T(int(.05 * SR)) * 60) * .07); k += beat
g = np.ones(N)
def dip(a, b, lvl=.15, r=.08):
    i0, i1 = int(a * SR), int(b * SR); g[i0:i1] = np.minimum(g[i0:i1], lvl); R = int(r * SR)
    g[max(0, i0 - R):i0] = np.minimum(g[max(0, i0 - R):i0], np.linspace(1, lvl, len(g[max(0, i0 - R):i0]))); g[i1:i1 + R] = np.minimum(g[i1:i1 + R], np.linspace(lvl, 1, len(g[i1:i1 + R])))
dip(0, CUT[0], .25); dip(chg, chg + 1.0, .12, .3); dip(CUT[8], CUT[9], .12, .3); dip(br, br + .9, .1, .2); dip(CUT[27], CUT[28], .3, .3); dip(lg + .3, D, .55, .3)
bus['music'] *= g
voe = np.abs(bus['vo']); voe = lp(voe, 8); voe /= voe.max() + 1e-9; duck = 1 - .55 * np.clip(voe * 3, 0, 1)
amb_duck = 1 - .35 * np.clip(voe * 3, 0, 1)
mix = bus['vo'] * 1.0 + bus['sfx'] * .55 + bus['amb'] * .6 * amb_duck + bus['music'] * .5 * duck
mix = np.tanh(mix * 1.15) / np.tanh(1.15)
fe = int((D - .8) * SR); mix[fe:] *= np.linspace(1, 0, N - fe)
mix /= np.max(np.abs(mix)) * 1.05
sf.write('mix.wav', np.stack([mix, mix], 1).astype(np.float32), SR)
print('ok', D)
