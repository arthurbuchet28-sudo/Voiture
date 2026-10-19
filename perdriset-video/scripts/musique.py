"""
Musique originale de la pub Perdriset (28 s), composée par synthèse : libre de droits.
120 BPM, 4/4, une mesure = 2 s. Grille : C G Am F ×2, C G Am Em, F, C.
Les impacts et les « whoosh » tombent sur les changements de scène de la composition `Perdriset`.

Usage : python3 scripts/musique.py public/musique-brute.wav
(le mastering — réverbération, limiteur, −16 LUFS — est fait ensuite par ffmpeg, cf. README)
"""
import sys
import wave

import numpy as np

SR = 44100
DUR = 28.0
N = int(SR * DUR)
BEAT = 0.5
rng = np.random.default_rng(7)
t = np.arange(N) / SR

# Changements de scène (s) — doivent suivre src/config.ts
SCENES = [3.0, 6.0, 11.0, 15.0, 19.8, 23.8]

CHORDS = {
    "C": [60, 64, 67, 72],
    "G": [59, 62, 67, 71],
    "Am": [57, 60, 64, 69],
    "F": [57, 60, 65, 69],
    "Em": [55, 59, 64, 67],
}
ROOTS = {"C": 36, "G": 43, "Am": 45, "F": 41, "Em": 40}
BARS = ["C", "G", "Am", "F", "C", "G", "Am", "F", "C", "G", "Am", "Em", "F", "C"]


def hz(m):
    return 440.0 * 2 ** ((m - 69) / 12)


def env_adsr(n, a, d, s, r):
    """Enveloppe ADSR (en secondes) sur n échantillons."""
    e = np.ones(n) * s
    ia, id_, ir = int(a * SR), int(d * SR), int(r * SR)
    ia = min(ia, n)
    e[:ia] = np.linspace(0, 1, ia, endpoint=False)
    end_d = min(ia + id_, n)
    e[ia:end_d] = np.linspace(1, s, end_d - ia, endpoint=False)
    if ir > 0 and ir < n:
        e[n - ir :] *= np.linspace(1, 0, ir)
    return e


def smooth(x, k):
    """Passe-bas simple (moyenne glissante)."""
    k = max(1, int(k))
    c = np.cumsum(np.concatenate([np.zeros(k), x]))
    return (c[k:] - c[:-k]) / k


def automation(points):
    """Courbe de volume à partir de (temps, valeur)."""
    ts, vs = zip(*points)
    return np.interp(t, ts, vs)


def add(buf, sig, start):
    i = int(start * SR)
    j = min(N, i + len(sig))
    if i < N:
        buf[i:j] += sig[: j - i]


# ── Pad : accords tenus, saw adoucie (harmoniques décroissantes), léger désaccord stéréo ──
padL = np.zeros(N)
padR = np.zeros(N)
for b, name in enumerate(BARS):
    start = b * 2.0
    n = int(2.25 * SR)
    tt = np.arange(n) / SR
    e = env_adsr(n, 0.35, 0.4, 0.8, 0.5)
    for m in CHORDS[name]:
        f = hz(m)
        for side, det in ((padL, -0.12), (padR, 0.12)):
            s = np.zeros(n)
            for h in range(1, 7):
                s += np.sin(2 * np.pi * f * h * (1 + det / 100) * tt + h) / (h ** 1.6)
            add(side, s * e * 0.07, start)

# ── Arpège pincé en croches (accord + octave), qui donne le mouvement ──
arp = np.zeros(N)
for b, name in enumerate(BARS):
    notes = [x + 12 for x in CHORDS[name]]
    pattern = [0, 1, 2, 3, 2, 1, 2, 3]
    for k, p in enumerate(pattern):
        st = b * 2.0 + k * BEAT / 2
        n = int(0.45 * SR)
        tt = np.arange(n) / SR
        f = hz(notes[p])
        s = np.sin(2 * np.pi * f * tt) + 0.35 * np.sin(4 * np.pi * f * tt) + 0.12 * np.sin(6 * np.pi * f * tt)
        add(arp, s * np.exp(-tt * 9) * 0.11, st)

# ── Basse : fondamentale en noires, sinus + octave, légère saturation ──
bass = np.zeros(N)
for b, name in enumerate(BARS):
    f = hz(ROOTS[name] + 12)
    for k in range(4):
        n = int(0.48 * SR)
        tt = np.arange(n) / SR
        s = np.sin(2 * np.pi * f * tt) + 0.3 * np.sin(4 * np.pi * f * tt)
        s = np.tanh(s * 1.4) * env_adsr(n, 0.01, 0.15, 0.6, 0.08)
        add(bass, s * 0.16, b * 2.0 + k * BEAT)

# ── Batterie : grosse caisse sur les temps, charleston à contretemps, claquement doux sur 2 et 4 ──
kick = np.zeros(N)
hats = np.zeros(N)
clap = np.zeros(N)
nk = int(0.35 * SR)
tk = np.arange(nk) / SR
kick_one = np.sin(2 * np.pi * (45 * tk + (110 / 18) * (1 - np.exp(-18 * tk)))) * np.exp(-tk * 9)
nh = int(0.08 * SR)
noise_h = rng.standard_normal(nh)
hat_one = (noise_h - smooth(noise_h, 3)) * np.exp(-np.arange(nh) / SR * 60) * 0.5
nc = int(0.2 * SR)
noise_c = rng.standard_normal(nc)
clap_one = (noise_c - smooth(noise_c, 12)) * np.exp(-np.arange(nc) / SR * 22) * 0.35
for i in range(int(DUR / BEAT)):
    st = i * BEAT
    add(kick, kick_one * 0.42, st)
    add(hats, hat_one, st + BEAT / 2)
    if i % 2 == 1:
        add(clap, clap_one, st)

# ── Effets : montée (riser) vers le logo, impacts, « whoosh » sur chaque changement de scène ──
fx = np.zeros(N)
nr = int(1.5 * SR)
tr = np.arange(nr) / SR
noise_r = rng.standard_normal(nr)
riser = smooth(noise_r, 3) * (tr / 1.5) ** 2.5 * 0.2
riser += np.sin(2 * np.pi * (300 * tr + 400 * tr ** 2)) * (tr / 1.5) ** 3 * 0.05
add(fx, riser, 3.0 - 1.5)


def impact(strength):
    n = int(1.8 * SR)
    tt = np.arange(n) / SR
    boom = np.sin(2 * np.pi * (38 * tt + 30 * (1 - np.exp(-8 * tt)) / 8)) * np.exp(-tt * 2.6)
    nz = rng.standard_normal(n)
    burst = smooth(nz, 6) * np.exp(-tt * 14) * 0.6
    shimmer = sum(np.sin(2 * np.pi * hz(m) * tt) for m in (84, 88, 91, 96)) * np.exp(-tt * 2.2) * 0.05
    return (boom * 0.5 + burst + shimmer) * strength


def whoosh(length=0.7):
    n = int(length * SR)
    tt = np.arange(n) / SR
    nz = rng.standard_normal(n)
    shape = np.sin(np.pi * tt / length) ** 2
    return (nz - smooth(nz, 2)) * 0.6 * shape * 0.18 + smooth(nz, 8) * shape * 0.25


add(fx, impact(1.0), 3.0)
for s in SCENES[1:-1]:
    add(fx, whoosh(), s - 0.42)
add(fx, whoosh(0.9), SCENES[-1] - 0.6)
add(fx, impact(0.9), SCENES[-1])

# ── Arrangement : volumes par section ──
intro, logo, drop, outro = 3.0, 6.0, 11.0, 23.8
pad_v = automation([(0, 0), (1.2, 0.9), (intro, 1), (outro, 0.85), (outro + 0.3, 1.1), (DUR - 1.3, 1.1), (DUR, 0)])
arp_v = automation([(0, 0), (0.6, 0.0), (1.4, 0.6), (intro, 0.7), (logo, 0.9), (outro, 1), (outro + 1, 0.8), (DUR - 1.2, 0.6), (DUR, 0)])
bass_v = automation([(0, 0), (intro - 0.01, 0), (intro, 1), (outro, 1), (outro + 0.01, 0.8), (DUR - 1.2, 0.6), (DUR, 0)])
kick_v = automation([(0, 0), (logo - 0.01, 0), (logo, 1), (outro - 0.01, 1), (outro, 0)])
hat_v = automation([(0, 0), (drop - 0.01, 0), (drop, 1), (outro - 0.01, 1), (outro, 0)])
clap_v = automation([(0, 0), (drop - 0.01, 0), (drop, 1), (outro - 0.01, 1), (outro, 0)])

mono = arp * arp_v + bass * bass_v + kick * kick_v + hats * hat_v * 0.8 + clap * clap_v * 0.5 + fx
L = padL * pad_v + mono + hats * hat_v * 0.15
R = padR * pad_v + mono - hats * hat_v * 0.15
st = np.stack([L, R], axis=1)
st /= np.max(np.abs(st)) * 1.05

with wave.open(sys.argv[1], "wb") as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes((st * 32767).astype("<i2").tobytes())
print("ok", sys.argv[1])
