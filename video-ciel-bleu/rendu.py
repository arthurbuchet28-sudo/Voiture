"""Rendu de la vidéo « Pourquoi le ciel est bleu » : animations vectorielles (cairo) -> ffmpeg.

Usage : python3 rendu.py            (vidéo complète)
        python3 rendu.py --apercu   (une image PNG par phase dans build/apercu)
"""
import json, math, os, random, subprocess, sys
from multiprocessing import Pool

import cairo

ICI = os.path.dirname(os.path.abspath(__file__))
BUILD = os.path.join(ICI, "build")
W, H, FPS = 1920, 1080, 30
XF = 0.6           # durée du fondu enchaîné entre scènes
MARGE = 0.5        # marge après le dernier mot avant la transition
TAU = 2 * math.pi

# ---------------------------------------------------------------- palette
def hexa(h, a=1.0):
    if not isinstance(h, str):
        return tuple(h)
    return (int(h[1:3], 16) / 255, int(h[3:5], 16) / 255, int(h[5:7], 16) / 255, a)

NUIT, NUIT2 = "#0B1430", "#1A2B5C"
CIEL_H, CIEL_B = "#2F6FCF", "#9ED4F4"
BLEU, ROUGE, VIOLET, VERT = "#4FA8FF", "#FF5A4E", "#A770FF", "#5FD68A"
JAUNE, ORANGE, BLANC = "#FFD36B", "#FF8C42", "#FFF8EC"
OCRE, ROUILLE = "#D49A62", "#9C4A26"
POLICE = "Inter"


def mix(c1, c2, k):
    a, b = hexa(c1) if isinstance(c1, str) else c1, hexa(c2) if isinstance(c2, str) else c2
    return tuple(a[i] + (b[i] - a[i]) * k for i in range(4))


def clamp(x, a=0.0, b=1.0):
    return max(a, min(b, x))


def ease(x):
    x = clamp(x)
    return x * x * (3 - 2 * x)


def prog(t, t0, d):
    return ease((t - t0) / d) if d > 0 else float(t >= t0)


def fenetre(t, t0, t1, f=0.35):
    """1 entre t0 et t1, avec fondus doux aux bords."""
    return prog(t, t0, f) * (1 - prog(t, t1 - f, f))


# ---------------------------------------------------------------- primitives
def src(ctx, c, a=None):
    c = hexa(c) if isinstance(c, str) else c
    ctx.set_source_rgba(c[0], c[1], c[2], c[3] if a is None else a * c[3])


def degrade_v(ctx, stops, y0=0, y1=H, x0=0, x1=W):
    g = cairo.LinearGradient(0, y0, 0, y1)
    for p, c in stops:
        g.add_color_stop_rgba(p, *(hexa(c) if isinstance(c, str) else c))
    ctx.set_source(g)
    ctx.rectangle(x0, y0, x1 - x0, y1 - y0)
    ctx.fill()


def couche(ctx, alpha, fn):
    if alpha <= 0.002:
        return
    if alpha >= 0.998:
        fn()
        return
    ctx.push_group()
    fn()
    ctx.pop_group_to_source()
    ctx.paint_with_alpha(alpha)


def halo(ctx, x, y, r, c, a=1.0):
    g = cairo.RadialGradient(x, y, 0, x, y, r)
    cc = hexa(c) if isinstance(c, str) else c
    g.add_color_stop_rgba(0, cc[0], cc[1], cc[2], a)
    g.add_color_stop_rgba(0.35, cc[0], cc[1], cc[2], a * 0.35)
    g.add_color_stop_rgba(1, cc[0], cc[1], cc[2], 0)
    ctx.set_source(g)
    ctx.arc(x, y, r, 0, TAU)
    ctx.fill()


def soleil(ctx, x, y, r, c=JAUNE, a=1.0, t=0.0, rayons=True):
    halo(ctx, x, y, r * 3.2, c, 0.55 * a)
    if rayons:
        ctx.save()
        ctx.translate(x, y)
        ctx.rotate(t * 0.25)
        src(ctx, c, 0.35 * a)
        ctx.set_line_width(max(2, r * 0.07))
        ctx.set_line_cap(cairo.LINE_CAP_ROUND)
        for k in range(12):
            ang = k * TAU / 12
            l = r * (1.35 + 0.12 * math.sin(t * 3 + k))
            ctx.move_to(math.cos(ang) * r * 1.15, math.sin(ang) * r * 1.15)
            ctx.line_to(math.cos(ang) * l * 1.2, math.sin(ang) * l * 1.2)
        ctx.stroke()
        ctx.restore()
    g = cairo.RadialGradient(x - r * .3, y - r * .3, r * .1, x, y, r)
    cc = hexa(c)
    g.add_color_stop_rgba(0, 1, 1, .95, a)
    g.add_color_stop_rgba(1, cc[0], cc[1], cc[2], a)
    ctx.set_source(g)
    ctx.arc(x, y, r, 0, TAU)
    ctx.fill()


def trait_lumineux(ctx, pts, c, w, a=1.0):
    ctx.set_line_cap(cairo.LINE_CAP_ROUND)
    ctx.set_line_join(cairo.LINE_JOIN_ROUND)
    for k, (ww, aa) in enumerate([(w * 3.2, .12), (w * 1.9, .25), (w, 1.0)]):
        ctx.new_path()
        ctx.move_to(*pts[0])
        for p in pts[1:]:
            ctx.line_to(*p)
        src(ctx, c, aa * a)
        ctx.set_line_width(ww)
        ctx.stroke()


def onde(ctx, x0, x1, y, amp, lam, phase, c, w=7, a=1.0):
    pts = []
    x = x0
    while x <= x1:
        env = clamp((x - x0) / 60) * clamp((x1 - x) / 60)
        pts.append((x, y + amp * env * math.sin(TAU * (x - phase) / lam)))
        x += 3
    trait_lumineux(ctx, pts, c, w, a)


def nuage(ctx, x, y, s, a=1.0, teinte=BLANC):
    bulles = [(-1.1, .25, .55), (-.55, -.15, .7), (.1, -.35, .85), (.75, -.05, .65),
              (1.25, .25, .5), (0, .25, .6), (-.6, .3, .5), (.65, .3, .55)]
    ctx.new_path()
    for bx, by, br in bulles:
        ctx.new_sub_path()
        ctx.arc(x + bx * s, y + by * s, br * s, 0, TAU)
    g = cairo.LinearGradient(0, y - s, 0, y + s * .8)
    c = hexa(teinte)
    g.add_color_stop_rgba(0, c[0], c[1], c[2], a)
    g.add_color_stop_rgba(1, c[0] * .82, c[1] * .86, c[2] * .95, a)
    ctx.set_source(g)
    ctx.fill()


def molecule(ctx, x, y, ang, s=1.0, a=1.0, lueur=0.0):
    if lueur > 0:
        halo(ctx, x, y, 60 * s, BLEU, .9 * lueur * a)
    dx, dy = math.cos(ang) * 8 * s, math.sin(ang) * 8 * s
    for sx in (-1, 1):
        ctx.new_path()
        ctx.arc(x + sx * dx, y + sx * dy, 9 * s, 0, TAU)
        src(ctx, "#DCE6FF", .22 * a)
        ctx.fill_preserve()
        src(ctx, "#FFFFFF", .75 * a)
        ctx.set_line_width(2)
        ctx.stroke()


def bonhomme(ctx, x, y, s=1.0, c="#F4E9D8", a=1.0, regard=-0.4):
    """Petit observateur stylisé ; (x, y) = position des pieds."""
    src(ctx, c, a)
    ctx.new_path()
    ctx.arc(x, y - 112 * s, 20 * s, 0, TAU)
    ctx.fill()
    ctx.set_line_cap(cairo.LINE_CAP_ROUND)
    ctx.set_line_width(14 * s)
    ctx.move_to(x, y - 88 * s); ctx.line_to(x, y - 40 * s)
    ctx.move_to(x, y - 40 * s); ctx.line_to(x - 14 * s, y)
    ctx.move_to(x, y - 40 * s); ctx.line_to(x + 14 * s, y)
    ctx.move_to(x, y - 78 * s); ctx.line_to(x - 22 * s, y - 52 * s)
    ctx.move_to(x, y - 78 * s); ctx.line_to(x + 24 * s, y - 100 * s)  # bras levé vers le ciel
    ctx.stroke()


def texte(ctx, s, x, y, taille, c=BLANC, a=1.0, gras=True, ancre="centre", ombre=True):
    if a <= 0.002:
        return
    ctx.select_font_face(POLICE, cairo.FONT_SLANT_NORMAL,
                         cairo.FONT_WEIGHT_BOLD if gras else cairo.FONT_WEIGHT_NORMAL)
    ctx.set_font_size(taille)
    e = ctx.text_extents(s)
    if ancre == "centre":
        x0 = x - e.width / 2 - e.x_bearing
    elif ancre == "droite":
        x0 = x - e.width - e.x_bearing
    else:
        x0 = x
    if ombre:
        src(ctx, "#000814", .45 * a)
        ctx.move_to(x0 + 2, y + 3)
        ctx.show_text(s)
    src(ctx, c, a)
    ctx.move_to(x0, y)
    ctx.show_text(s)
    return e


def rect_arrondi(ctx, x, y, w, h, r):
    ctx.new_path()
    ctx.arc(x + w - r, y + r, r, -TAU / 4, 0)
    ctx.arc(x + w - r, y + h - r, r, 0, TAU / 4)
    ctx.arc(x + r, y + h - r, r, TAU / 4, TAU / 2)
    ctx.arc(x + r, y + r, r, TAU / 2, 3 * TAU / 4)
    ctx.close_path()


def sous_titre(ctx, s, a, accent=BLEU):
    """Bandeau de mots-clés en bas de l'écran."""
    if a <= 0.002:
        return
    ctx.select_font_face(POLICE, cairo.FONT_SLANT_NORMAL, cairo.FONT_WEIGHT_BOLD)
    ctx.set_font_size(44)
    e = ctx.text_extents(s)
    lw, lh = e.width + 110, 88
    y = 1080 - 70 - lh + (1 - a) * 18
    rect_arrondi(ctx, (W - lw) / 2, y, lw, lh, lh / 2)
    src(ctx, "#08122A", .72 * a)
    ctx.fill()
    ctx.new_path()
    ctx.arc((W - lw) / 2 + 36, y + lh / 2, 8, 0, TAU)
    src(ctx, accent, a)
    ctx.fill()
    texte(ctx, s, W / 2 + 14, y + lh / 2 + 15, 44, BLANC, a, ombre=False)


def titre(ctx, s, a, y=140, taille=68, c=BLANC):
    texte(ctx, s, W / 2, y + (1 - a) * -14, taille, c, a)


def vignette(ctx):
    g = cairo.RadialGradient(W / 2, H / 2, H * .45, W / 2, H / 2, H * 1.05)
    g.add_color_stop_rgba(0, 0, 0, 0, 0)
    g.add_color_stop_rgba(1, 0, 0, .04, .42)
    ctx.set_source(g)
    ctx.paint()


def etoiles(ctx, t, n=90, graine=3, a=1.0):
    r = random.Random(graine)
    for _ in range(n):
        x, y, ph = r.uniform(0, W), r.uniform(0, H * .8), r.uniform(0, TAU)
        k = .35 + .35 * math.sin(t * 1.7 + ph)
        src(ctx, "#FFFFFF", k * a)
        ctx.new_path()
        ctx.arc(x, y, r.uniform(.8, 2.0), 0, TAU)
        ctx.fill()


def collines(ctx, y0, c, amp=40, f=1.0, ph=0.0):
    ctx.new_path()
    ctx.move_to(0, H)
    x = 0
    while x <= W:
        ctx.line_to(x, y0 - amp * (math.sin(x / 260 * f + ph) * .6 + math.sin(x / 113 * f + ph * 2) * .25))
        x += 8
    ctx.line_to(W, H)
    ctx.close_path()
    src(ctx, c)
    ctx.fill()


# ---------------------------------------------------------------- scènes
class Scene:
    nom = ""
    accent = BLEU

    def __init__(self, mots, offset):
        self.mots, self.off = mots, offset
        self.dernier = offset + mots[-1]["t"] + mots[-1]["d"]

    def c(self, mot, n=1):
        """Instant (temps local de scène) de la n-ième occurrence du mot prononcé."""
        k = 0
        for m in self.mots:
            if m["mot"].lower() == mot.lower():
                k += 1
                if k == n:
                    return self.off + m["t"]
        raise KeyError(f"{self.nom}: mot introuvable « {mot} » ({n})")

    def phases(self):
        """[(début, fonction_dessin)] : chaque phase a un fond opaque, fondu enchaîné."""
        raise NotImplementedError

    def textes(self):
        """[(début, fin, texte)] sous-titres mots-clés."""
        return []

    def dessiner(self, ctx, t):
        ph = self.phases()
        for i, (t0, fn) in enumerate(ph):
            if i + 1 < len(ph) and t >= ph[i + 1][0] + .6:
                continue
            a = 1.0 if i == 0 else prog(t, t0, .6)
            if a > 0:
                couche(ctx, a, lambda fn=fn: fn(ctx, t))
        for t0, t1, s in self.textes():
            sous_titre(ctx, s, fenetre(t, t0, t1), self.accent)


class Accroche(Scene):
    nom = "accroche"

    def phases(self):
        return [(0, self.ciel)]

    def ciel(self, ctx, t):
        degrade_v(ctx, [(0, CIEL_H), (1, CIEL_B)])
        for k, (y, s, v) in enumerate([(300, 70, 22), (420, 52, 30), (270, 46, 38), (560, 64, 18)]):
            x = (k * 560 + t * v) % (W + 500) - 250
            nuage(ctx, x, y, s, .92)
        collines(ctx, 960, "#2C5E4A", 30, .8, 1)
        collines(ctx, 1010, "#1F4637", 26, 1.3, 4)
        # loupe sur l'air : molécules incolores
        tl, ta = self.c("L'air"), self.c("Alors")
        al = fenetre(t, tl - .2, ta + .2, .5)
        if al > 0:
            cx, cy, R = W / 2, 560, 250 * (.85 + .15 * ease((t - tl + .2) / .5))

            def loupe():
                ctx.save()
                ctx.new_path(); ctx.arc(cx, cy, R, 0, TAU); ctx.clip()
                degrade_v(ctx, [(0, "#E9EEF3"), (1, "#CBD5DF")], cy - R, cy + R, cx - R, cx + R)
                r = random.Random(7)
                for _ in range(26):
                    x0, y0 = r.uniform(cx - R, cx + R), r.uniform(cy - R, cy + R)
                    vx, vy, ph = r.uniform(-30, 30), r.uniform(-30, 30), r.uniform(0, TAU)
                    x = cx - R + (x0 - cx + R + vx * t) % (2 * R)
                    y = cy - R + (y0 - cy + R + vy * t) % (2 * R)
                    dx, dy = math.cos(ph + t), math.sin(ph + t)
                    for sx in (-1, 1):
                        ctx.new_path(); ctx.arc(x + sx * dx * 9, y + sx * dy * 9, 10, 0, TAU)
                        src(ctx, "#FFFFFF", .55); ctx.fill_preserve()
                        src(ctx, "#7D8A99", .9); ctx.set_line_width(2); ctx.stroke()
                ctx.restore()
                ctx.new_path(); ctx.arc(cx, cy, R, 0, TAU)
                src(ctx, "#FFFFFF", .95); ctx.set_line_width(14); ctx.stroke()
                ctx.set_line_width(26); ctx.set_line_cap(cairo.LINE_CAP_ROUND)
                ctx.move_to(cx + R * .72, cy + R * .72); ctx.line_to(cx + R * 1.12, cy + R * 1.12)
                src(ctx, "#33415C"); ctx.stroke()
            couche(ctx, al, loupe)
        aq = prog(t, ta + .3, .5)
        if aq > 0:
            s = 1 + .04 * math.sin((t - ta) * 4)
            texte(ctx, "?", W / 2, 690, 380 * s * (.6 + .4 * aq), BLANC, aq)
        titre(ctx, "Le ciel n'a pas de couleur…", fenetre(t, .4, ta - .1), 150, 76)
        titre(ctx, "…alors pourquoi est-il bleu ?", prog(t, ta, .5), 150, 76)

    def textes(self):
        return [(self.c("transparent") - .2, self.c("Alors") - .1, "L'air est transparent")]


class Lumiere(Scene):
    nom = "lumiere"
    accent = JAUNE

    def phases(self):
        return [(0, self.prisme), (self.c("Chaque") - .3, self.ondes)]

    def prisme(self, ctx, t):
        degrade_v(ctx, [(0, NUIT), (1, NUIT2)])
        etoiles(ctx, t, 70, 11, .6)
        sx, sy = 250, 470
        soleil(ctx, sx, sy, 80, JAUNE, 1, t)
        px, py, ps = 980, 520, 230                     # prisme
        tp = self.c("prisme") - 1.4
        ap = prog(t, tp, .7)
        # faisceau blanc soleil -> prisme
        fb = prog(t, .5, 1.6)
        if fb > 0:
            ex, ey = px - ps * .32, py
            trait_lumineux(ctx, [(sx + 70, sy + 8), (sx + 70 + (ex - sx - 70) * fb, sy + 8 + (ey - sy - 8) * fb)],
                           BLANC, 14, 1)
        # arc-en-ciel
        ta = self.c("arc-en-ciel") - .35
        fa = prog(t, ta, 1.1)
        cols = [ROUGE, ORANGE, JAUNE, VERT, "#3FC7E6", BLEU, VIOLET]
        if fa > 0 and ap > .5:
            ox, oy = px + ps * .2, py + 10
            for k, c in enumerate(cols):
                ang = -.20 + k * .066
                L = 900 * fa
                x2, y2 = ox + math.cos(ang) * L, oy + math.sin(ang) * L
                g = cairo.LinearGradient(ox, oy, x2, y2)
                cc = hexa(c)
                g.add_color_stop_rgba(0, *cc[:3], .95)
                g.add_color_stop_rgba(1, *cc[:3], .75)
                ctx.set_source(g)
                ctx.new_path()
                ctx.move_to(ox, oy - 6)
                ctx.line_to(ox + math.cos(ang - .034) * L, oy + math.sin(ang - .034) * L)
                ctx.line_to(ox + math.cos(ang + .034) * L, oy + math.sin(ang + .034) * L)
                ctx.line_to(ox, oy + 6)
                ctx.close_path()
                ctx.fill()
        if ap > 0:
            ctx.save()
            ctx.translate(px, py + (1 - ap) * 40)
            ctx.new_path()
            ctx.move_to(0, -ps * .62); ctx.line_to(ps * .55, ps * .38); ctx.line_to(-ps * .55, ps * .38)
            ctx.close_path()
            g = cairo.LinearGradient(-ps * .5, -ps * .6, ps * .5, ps * .4)
            g.add_color_stop_rgba(0, .85, .93, 1, .55 * ap)
            g.add_color_stop_rgba(1, .45, .6, .9, .25 * ap)
            ctx.set_source(g); ctx.fill_preserve()
            ctx.set_source_rgba(1, 1, 1, .9 * ap); ctx.set_line_width(4); ctx.stroke()
            ctx.restore()
        titre(ctx, "Lumière blanche = toutes les couleurs", prog(t, self.c("mélange") - .2, .6), 140, 64)

    def ondes(self, ctx, t):
        degrade_v(ctx, [(0, NUIT), (1, NUIT2)])
        etoiles(ctx, t, 70, 11, .6)
        tc = self.c("Chaque") - .3
        lb, lr = 92, 92 * 700 / 450
        for (y, lam, c, mot, lab, sub) in [(420, lb, BLEU, "courte", "Bleu", "onde courte"),
                                          (700, lr, ROUGE, "longue", "Rouge", "onde longue")]:
            a = prog(t, tc + .2, .6)
            x1 = 360 + (1720 - 360) * prog(t, tc + .2, 1.2)
            pulse = 1 + .35 * math.exp(-((t - self.c("Retiens") - .4) ** 2) / .15) * (c == BLEU)
            onde(ctx, 360, x1, y, 90, lam, t * 260, c, 8 * pulse, a)
            al = prog(t, self.c(mot) - .1, .4)
            texte(ctx, lab, 300, y - 6, 54, c, al, ancre="droite")
            texte(ctx, sub, 300, y + 48, 34, BLANC, al * .85, gras=False, ancre="droite")
            if al > 0:   # règle de longueur d'onde
                x0 = 900
                src(ctx, BLANC, .7 * al); ctx.set_line_width(3)
                yy = y + 130
                ctx.move_to(x0, yy); ctx.line_to(x0 + lam, yy)
                for xx in (x0, x0 + lam):
                    ctx.move_to(xx, yy - 12); ctx.line_to(xx, yy + 12)
                ctx.stroke()
                texte(ctx, "≈ 450 nm" if c == BLEU else "≈ 700 nm", x0 + lam + 24, yy + 12, 30, BLANC, al * .8,
                      gras=False, ancre="gauche")
        titre(ctx, "Chaque couleur = une onde", prog(t, tc + .1, .6), 140, 64)

    def textes(self):
        return [(self.c("mélange") - .1, self.c("Chaque") - .3, "La lumière du Soleil est un mélange"),
                (self.c("Retiens") - .1, self.dernier + .9, "Courte = bleu · Longue = rouge")]


class Rayleigh(Scene):
    nom = "rayleigh"

    def __init__(self, *a):
        super().__init__(*a)
        r = random.Random(42)
        self.mol = []
        for i in range(12):
            for j in range(6):
                x = 400 + i * 120 + r.uniform(-35, 35)
                y = 260 + j * 110 + r.uniform(-35, 35)
                self.mol.append((x, y, r.uniform(0, TAU), r.uniform(.4, 1.2)))
        bande = [m for m in self.mol if 420 < m[1] < 620]
        self.photons = []
        t, tfin = .2, 40
        while t < tfin:
            y0 = r.uniform(470, 570)
            if r.random() < .5:
                self.photons.append(("r", t, [(190, y0), (2100, y0 + r.uniform(-15, 15))]))
            m = r.choice(bande)
            ang = r.uniform(0, TAU)
            if abs(math.cos(ang)) > .9 and math.cos(ang) > 0:
                ang += 1.4
            d1 = r.uniform(250, 520)
            p2 = (m[0] + math.cos(ang) * d1, m[1] + math.sin(ang) * d1)
            ang2 = ang + r.uniform(-2.2, 2.2)
            p3 = (p2[0] + math.cos(ang2) * 900, p2[1] + math.sin(ang2) * 900)
            self.photons.append(("b", t + r.uniform(0, .05), [(190, y0), (m[0], m[1]), p2, p3]))
            t += 1 / 16
        self.rayons = [(r.uniform(.15, .85) * math.pi, r.uniform(0, 1.6), r.uniform(.9, 1.3)) for _ in range(60)]

    def phases(self):
        return [(0, self.diffusion), (self.c("Imagine") - .3, self.ponton),
                (self.c("Le", 4) - .3, self.observateur), (self.c("Et", 3) - .2, self.nuages)]

    @staticmethod
    def le_long(pts, s):
        for (x0, y0), (x1, y1) in zip(pts, pts[1:]):
            L = math.hypot(x1 - x0, y1 - y0)
            if s <= L:
                return x0 + (x1 - x0) * s / L, y0 + (y1 - y0) * s / L, (x1 - x0) / L, (y1 - y0) / L, s
            s -= L
        return None

    def diffusion(self, ctx, t):
        degrade_v(ctx, [(0, NUIT), (1, NUIT2)])
        tm = self.c("molécules")
        hl = math.exp(-((t - tm - .3) ** 2) / .2)
        lueurs = {}
        v = 720
        a_ph = prog(t, .3, .8)
        for kind, t0, pts in self.photons:
            age = t - t0
            if age < 0:
                continue
            p = self.le_long(pts, age * v)
            if p is None:
                continue
            x, y, dx, dy, _ = p
            if x > W + 40 or x < -40 or y < -40 or y > H + 40:
                continue
            if kind == "r":
                trait_lumineux(ctx, [(x - dx * 40, y - dy * 40), (x, y)], ROUGE, 5, .9 * a_ph)
            else:
                d0 = math.hypot(pts[1][0] - pts[0][0], pts[1][1] - pts[0][1])
                apres = age * v - d0
                fade = 1 if apres < 0 else clamp(1 - apres / 1100)
                if 0 <= apres < 120:
                    lueurs[pts[1]] = max(lueurs.get(pts[1], 0), 1 - apres / 120)
                trait_lumineux(ctx, [(x - dx * 44, y - dy * 44), (x, y)], BLEU, 6, fade * a_ph)
        for (x, y, ph, vr) in self.mol:
            jx, jy = 3 * math.sin(t * 2.1 + ph), 3 * math.cos(t * 1.7 + ph)
            molecule(ctx, x + jx, y + jy, ph + t * vr, 1 + .35 * hl, 1, lueurs.get((x, y), 0) * .8)
        soleil(ctx, 120, 520, 72, JAUNE, 1, t)
        titre(ctx, "Diffusion de Rayleigh", prog(t, self.c("intéressant") - .3, .6), 140, 68)
        ar = prog(t, self.c("rouge") - .2, .5)
        texte(ctx, "Rouge : tout droit →", 1880, 640, 38, ROUGE, ar, ancre="droite")
        texte(ctx, "Bleu : dévié dans tous les sens", 1880, 870, 38, BLEU, ar, ancre="droite")

    def ponton(self, ctx, t):
        degrade_v(ctx, [(0, "#0E4C66"), (1, "#127A8A")])
        t0 = self.c("Imagine")
        # houle : grandes bandes qui passent sans être gênées
        for k in range(6):
            x = (k * 420 + (t - t0) * 160) % (W + 420) - 210
            g = cairo.LinearGradient(x - 130, 0, x + 130, 0)
            g.add_color_stop_rgba(0, 1, 1, 1, 0)
            g.add_color_stop_rgba(.5, 1, 1, 1, .2)
            g.add_color_stop_rgba(1, 1, 1, 1, 0)
            ctx.set_source(g); ctx.rectangle(x - 130, 0, 260, H); ctx.fill()
        piquets = [(960, 150 + i * 125) for i in range(7)]
        # vaguelettes : fines rides qui arrivent de la gauche puis ricochent
        src(ctx, "#DDF6FF", .55); ctx.set_line_width(3)
        for k in range(30):
            x = (k * 34 + (t - t0) * 120) % (34 * 30)
            if x < 945:
                ctx.move_to(x, 120); ctx.line_to(x, 940)
        ctx.stroke()
        for (px, py) in piquets:
            for k in range(6):
                r = ((t - t0) * 120 + k * 34) % 204
                ctx.new_path(); ctx.arc(px, py, 20 + r, 0, TAU)
                src(ctx, "#DDF6FF", .5 * (1 - r / 204)); ctx.set_line_width(3); ctx.stroke()
        for (px, py) in piquets:
            ctx.new_path(); ctx.arc(px, py, 17, 0, TAU); src(ctx, "#6B4A2E"); ctx.fill()
            ctx.new_path(); ctx.arc(px - 4, py - 4, 7, 0, TAU); src(ctx, "#A57B52"); ctx.fill()
        a1 = prog(t, self.c("vaguelettes") - .1, .4)
        a2 = prog(t, self.c("houle") - .1, .4)
        texte(ctx, "petites vagues", 470, 90, 40, "#DDF6FF", a1)
        texte(ctx, "→ ricochent", 1450, 90, 40, "#DDF6FF", a1)

    def observateur(self, ctx, t, ciel_k=None):
        t0 = self.c("Le", 4)
        k = prog(t, t0 - .3, 2.0) if ciel_k is None else ciel_k
        degrade_v(ctx, [(0, mix(NUIT, CIEL_H, k)), (1, mix(NUIT2, CIEL_B, k))])
        r = random.Random(5)
        for _ in range(140):
            x, y, ph = r.uniform(0, W), r.uniform(0, 820), r.uniform(0, TAU)
            src(ctx, "#FFFFFF", .25 + .2 * math.sin(t * 2 + ph))
            ctx.new_path(); ctx.arc(x, y, 2.2, 0, TAU); ctx.fill()
        ox, oy = W / 2, 820
        if ciel_k is None:
            for ang, d0, sp in self.rayons:
                ph = ((t - t0) * .55 * sp + d0) % 1.6
                if ph > 1:
                    continue
                R = 950 * (1 - ph)
                x, y = ox - math.cos(ang) * R, oy - 20 - math.sin(ang) * R
                dx, dy = math.cos(ang), math.sin(ang)
                trait_lumineux(ctx, [(x - dx * 50, y - dy * 50), (x, y)], BLEU, 5, .9 * clamp(ph * 5))
        collines(ctx, 880, "#21473A", 22, .9, 2)
        bonhomme(ctx, ox, 870, 1.0)
        if ciel_k is None:
            soleil(ctx, 210, 190, 60, JAUNE, 1, t)

    def nuages(self, ctx, t):
        self.observateur(ctx, t, ciel_k=1.0)
        soleil(ctx, 210, 190, 60, JAUNE, 1, t)
        tn = self.c("nuages")
        x = 2300 - (2300 - 1250) * prog(t, tn - .4, 1.6)
        tr = self.c("renvoient") - .3
        ab = prog(t, tr, .8)
        nuage(ctx, x, 360, 150, 1, mix("#D9DEE6", BLANC, ab))
        if ab > 0:
            r = random.Random(9)
            for k in range(36):
                c = [ROUGE, VERT, BLEU][k % 3]
                ang = r.uniform(0, TAU)
                ph = ((t - tr) * .9 + r.uniform(0, 1)) % 1
                L = 160 + ph * 520
                cx, cy = x + math.cos(ang) * L, 360 + math.sin(ang) * L * .8
                dx, dy = math.cos(ang), math.sin(ang) * .8
                trait_lumineux(ctx, [(cx - dx * 40, cy - dy * 40), (cx, cy)], c, 5, ab * (1 - ph))
            nuage(ctx, x, 360, 150, 1, BLANC)

    def textes(self):
        return [(self.c("Surtout") - .1, self.c("Imagine") - .3, "Onde courte → très déviée"),
                (self.c("vaguelettes") - .1, self.c("Le", 4) - .3, "Petites vagues ricochent, la houle passe"),
                (self.c("Le", 4), self.c("Et", 3) - .3, "Le bleu vient de partout"),
                (self.c("nuages") - .2, self.c("renvoient") - .3, "Et les nuages ?"),
                (self.c("renvoient") - .2, self.dernier + .9, "Toutes les couleurs → blanc")]


class Violet(Scene):
    nom = "violet"
    accent = VIOLET

    def phases(self):
        return [(0, self.ondes), (self.c("Soleil") - .4, self.raisons), (self.c("Verdict") - .3, self.verdict)]

    def ondes(self, ctx, t):
        degrade_v(ctx, [(0, "#140F33"), (1, "#24205A")])
        etoiles(ctx, t, 60, 4, .5)
        for (y, nm, c, t0) in [(330, 700, ROUGE, 0), (530, 450, BLEU, 0), (760, 400, VIOLET, self.c("violet") - .2)]:
            a = prog(t, t0, .5)
            onde(ctx, 420, 1700, y, 70, 92 * nm / 450, t * 240, c, 7, a)
            texte(ctx, f"{nm} nm", 380, y + 12, 36, c, a, ancre="droite")
        ap = prog(t, self.c("courte") - .1, .4)
        texte(ctx, "encore plus courte !", 1700, 880, 40, VIOLET, ap, ancre="droite")
        titre(ctx, "Pourquoi pas violet ?", prog(t, .3, .6), 150, 72)

    def raisons(self, ctx, t):
        degrade_v(ctx, [(0, "#140F33"), (1, "#24205A")])
        etoiles(ctx, t, 60, 4, .5)
        titre(ctx, "Pourquoi pas violet ?", 1, 150, 72)
        cartes = [(self.c("Soleil") - .2, "① Moins émis", self.icone_spectre),
                  (self.c("partie") - .2, "② Filtré en altitude", self.icone_atmo),
                  (self.c("surtout") - .2, "③ Œil peu sensible", self.icone_oeil)]
        for i, (t0, lab, ico) in enumerate(cartes):
            a = prog(t, t0, .5)
            if a <= 0:
                continue
            x, y = 150 + i * 560, 260 + (1 - a) * 40

            def carte(x=x, y=y, lab=lab, ico=ico, t0=t0):
                rect_arrondi(ctx, x, y, 500, 560, 36)
                src(ctx, "#FFFFFF", .08); ctx.fill_preserve()
                src(ctx, VIOLET, .5); ctx.set_line_width(3); ctx.stroke()
                ctx.save(); rect_arrondi(ctx, x, y, 500, 560, 36); ctx.clip()
                ico(ctx, x + 250, y + 230, t - t0)
                ctx.restore()
                texte(ctx, lab, x + 250, y + 500, 40, BLANC, 1)
            couche(ctx, a, carte)

    def icone_spectre(self, ctx, cx, cy, t):
        soleil(ctx, cx - 150, cy - 150, 34, JAUNE, 1, t, rayons=False)
        cols = [VIOLET, BLEU, "#3FC7E6", VERT, JAUNE, ORANGE, ROUGE]
        hs = [.52, .82, .93, 1.0, .97, .92, .85]
        for k, (c, h) in enumerate(zip(cols, hs)):
            hh = 230 * h * ease(t / .8 - k * .05)
            x = cx - 175 + k * 52
            rect_arrondi(ctx, x, cy + 130 - hh, 40, max(hh, 1), 8)
            src(ctx, c); ctx.fill()
        src(ctx, BLANC, .6); ctx.set_line_width(3)
        ctx.move_to(cx - 190, cy + 134); ctx.line_to(cx + 190, cy + 134); ctx.stroke()

    def icone_atmo(self, ctx, cx, cy, t):
        ctx.new_path(); ctx.arc(cx, cy + 520, 420, 0, TAU); src(ctx, "#2B6CB0"); ctx.fill()
        ctx.new_path(); ctx.arc(cx, cy + 520, 560, 0, TAU); ctx.arc_negative(cx, cy + 520, 520, TAU, 0)
        src(ctx, "#C9B6FF", .35); ctx.fill()
        for k in range(5):
            x = cx - 160 + k * 80
            ph = (t * .8 + k * .21) % 1
            c = VIOLET if k % 2 == 0 else BLEU
            ystop = cy - 20 if c == VIOLET else cy + 120
            y = cy - 200 + ph * 340
            if y > ystop:
                if c == VIOLET:
                    halo(ctx, x, ystop, 26, VIOLET, .8 * (1 - ph))
                    continue
            trait_lumineux(ctx, [(x, y - 50), (x, min(y, ystop))], c, 5, 1)

    def icone_oeil(self, ctx, cx, cy, t):
        ctx.save(); ctx.translate(cx, cy + 40)
        ctx.new_path()
        ctx.move_to(-150, 0); ctx.curve_to(-70, -95, 70, -95, 150, 0); ctx.curve_to(70, 95, -70, 95, -150, 0)
        src(ctx, "#FFFFFF", .95); ctx.fill_preserve(); src(ctx, VIOLET); ctx.set_line_width(4); ctx.stroke()
        ctx.new_path(); ctx.arc(0, 0, 52, 0, TAU); src(ctx, "#3D7DD8"); ctx.fill()
        ctx.new_path(); ctx.arc(0, 0, 22, 0, TAU); src(ctx, "#0B1430"); ctx.fill()
        ctx.new_path(); ctx.arc(14, -16, 9, 0, TAU); src(ctx, "#FFFFFF"); ctx.fill()
        ctx.restore()
        # courbe de sensibilité : faible côté violet
        g = cairo.LinearGradient(cx - 180, 0, cx + 180, 0)
        for p, c in [(0, VIOLET), (.25, BLEU), (.55, VERT), (.8, JAUNE), (1, ROUGE)]:
            g.add_color_stop_rgba(p, *hexa(c))
        ctx.new_path()
        k = ease(t / .8)
        for i in range(61):
            x = -180 + i * 6
            yv = math.exp(-((x - 30) / 85) ** 2)
            ctx.line_to(cx + x, cy - 90 - 120 * yv * k)
        ctx.set_source(g); ctx.set_line_width(7); ctx.stroke()

    def verdict(self, ctx, t):
        t0 = self.c("Verdict")
        k = prog(t, t0, 1.0)
        degrade_v(ctx, [(0, mix("#3D2C8F", CIEL_H, k)), (1, mix("#8E7BE0", CIEL_B, k))])
        for i, (y, s, v) in enumerate([(260, 60, 25), (420, 48, 35)]):
            nuage(ctx, (i * 900 + t * v) % (W + 400) - 200, y, s, .9)
        collines(ctx, 960, "#2C5E4A", 30, .8, 1)
        texte(ctx, "= bleu ciel", W / 2, 600, 120, BLANC, prog(t, self.c("bleu") - .2, .5))

    def textes(self):
        return [(self.c("Verdict") - .1, self.dernier + .9, "Violet + bleu + œil → bleu ciel")]


class Coucher(Scene):
    nom = "coucher"
    accent = ORANGE

    def __init__(self, *a):
        super().__init__(*a)
        r = random.Random(17)
        self.fuites = [(r.uniform(.05, .9), r.uniform(0, 1), r.choice((-1, 1)) * r.uniform(.6, 1.4)) for _ in range(46)]

    def phases(self):
        return [(0, self.schema), (self.c("Ce") - .3, self.paysage)]

    def schema(self, ctx, t):
        degrade_v(ctx, [(0, NUIT), (1, NUIT2)])
        etoiles(ctx, t, 80, 8, .5)
        CX, CY, R, RA = W / 2, 2250, 1500, 1680
        g = cairo.RadialGradient(CX, CY, R, CX, CY, RA)
        g.add_color_stop_rgba(0, .45, .72, 1, .55); g.add_color_stop_rgba(1, .45, .72, 1, 0)
        ctx.set_source(g); ctx.new_path(); ctx.arc(CX, CY, RA, 0, TAU); ctx.fill()
        g = cairo.LinearGradient(0, 750, 0, H)
        g.add_color_stop_rgba(0, *hexa("#2E7DB8")); g.add_color_stop_rgba(1, *hexa("#123A63"))
        ctx.set_source(g); ctx.new_path(); ctx.arc(CX, CY, R, 0, TAU); ctx.fill()
        ox, oy = CX, CY - R
        # trajet de midi (reste affiché en pointillés pour comparer)
        k = prog(t, self.c("bas") - .2, 1.8)
        ang = k * math.pi / 2
        dist = 600 + 240 * k
        sx, sy = ox - math.sin(ang) * dist, oy - math.cos(ang) * dist
        ctx.save(); ctx.set_dash([14, 12]); src(ctx, JAUNE, .55 * k); ctx.set_line_width(4)
        ctx.move_to(ox, oy - 600); ctx.line_to(ox, oy - 30); ctx.stroke(); ctx.restore()
        # entrée dans l'atmosphère
        dx, dy = (ox - sx) / math.hypot(ox - sx, oy - sy), (oy - sy) / math.hypot(ox - sx, oy - sy)
        fx, fy = sx - CX, sy - CY
        b = fx * dx + fy * dy
        cc = fx * fx + fy * fy - RA * RA
        s_in = -b - math.sqrt(max(b * b - cc, 0))
        ex, ey = sx + dx * s_in, sy + dy * s_in
        trait_lumineux(ctx, [(sx, sy), (ex, ey)], BLANC, 6, .6)
        L = math.hypot(ox - ex, oy - ey)
        n = 24
        pts = [(ex + (ox - ex) * i / n, ey + (oy - ey) * i / n) for i in range(n + 1)]
        rou = prog(t, self.c("route") - .2, 1.0)
        for i in range(n):
            u = i / n
            c = mix(BLANC, mix(JAUNE, ROUGE, u), rou * u ** .7) if L > 300 else hexa(BLANC)
            trait_lumineux(ctx, [pts[i], pts[i + 1]], c, 12, 1)
        # le bleu s'échappe sur le côté
        if rou > 0:
            nx, ny = -dy, dx
            for u, ph0, sgn in self.fuites:
                ph = ((t - self.c("route")) * .7 + ph0) % 1
                bx, by = ex + (ox - ex) * u, ey + (oy - ey) * u
                d = 20 + ph * 260
                x, y = bx + nx * sgn * d + dx * ph * 60, by + ny * sgn * d + dy * ph * 60
                trait_lumineux(ctx, [(x - nx * sgn * 26, y - ny * sgn * 26), (x, y)], BLEU, 4, rou * (1 - ph))
        soleil(ctx, sx, sy, 56, mix(JAUNE, ORANGE, k), 1, t)
        bonhomme(ctx, ox, oy, .55)
        texte(ctx, "Midi : trajet court", ox + 40, oy - 360, 40, JAUNE, prog(t, .5, .5) * (1 - .45 * k), ancre="gauche")
        texte(ctx, "Coucher : trajet long", (ex + ox) / 2, oy - 90, 44, ORANGE, prog(t, self.c("traverse") - .2, .5))

    def paysage(self, ctx, t):
        t0 = self.c("Ce")
        k = prog(t, t0 - .3, 6.5)
        if k < .5:
            hb, bb = mix(CIEL_H, "#3C3A8C", k * 2), mix(CIEL_B, ORANGE, k * 2)
        else:
            hb, bb = mix("#3C3A8C", "#1E0F3A", k * 2 - 1), mix(ORANGE, "#E0453A", k * 2 - 1)
        mid = mix(mix(CIEL_B, "#FF9F6B", min(1, k * 1.6)), "#C2365A", clamp(k * 2 - 1))
        degrade_v(ctx, [(0, hb), (.62, mid), (1, bb)])
        sy = 520 + 360 * k
        soleil(ctx, W * .62, sy, 78 + 18 * k, mix(JAUNE, "#FF5530", k), 1, t, rayons=False)
        halo(ctx, W * .62, sy, 700, mix(ORANGE, ROUGE, k), .35 * k)
        collines(ctx, 900, mix("#2C5E4A", "#3A1C3E", k), 34, .7, 3)
        collines(ctx, 960, mix("#1F4637", "#24102C", k), 30, 1.1, 5)
        bonhomme(ctx, 520, 930, .7, mix("#F4E9D8", "#1A0B22", k))

    def textes(self):
        return [(self.c("route") - .2, self.c("Ce") - .3, "Le bleu se perd en route"),
                (self.c("L'orange") - .2, self.c("Et", 3) - .2, "Il reste l'orange et le rouge"),
                (self.c("Et", 3) - .1, self.dernier + .9, "Le bleu ? Il éclaire d'autres ciels")]


class Mars(Scene):
    nom = "mars"
    accent = OCRE

    def __init__(self, *a):
        super().__init__(*a)
        r = random.Random(23)
        self.poussiere = [(r.uniform(0, W), r.uniform(200, 900), r.uniform(20, 70), r.uniform(1.5, 3.5)) for _ in range(120)]

    def phases(self):
        return [(0, self.mars), (self.c("Bref") - .3, self.fin)]

    def mars(self, ctx, t):
        tc = self.c("Mais") - .2
        k = prog(t, tc, 3.0)
        degrade_v(ctx, [(0, mix("#C0844F", "#2E2630", k)), (.7, mix(OCRE, "#6D5A5A", k)),
                        (1, mix("#ECC9A0", "#8A7466", k))])
        sx = 1260
        sy = 300 + 400 * k
        if k > 0:
            halo(ctx, sx, sy, 420, "#8FC4F5", .85 * k)
            halo(ctx, sx, sy, 170, "#CFE6FF", .7 * k)
        soleil(ctx, sx, sy, 34, mix("#FFF2D6", "#EAF4FF", k), 1, t, rayons=False)
        for (x0, y0, v, rr) in self.poussiere:
            x = (x0 + t * v) % W
            src(ctx, mix("#F2C79A", "#9AA9C8", k * .6), .35)
            ctx.new_path(); ctx.arc(x, y0 + 8 * math.sin(t + x0), rr, 0, TAU); ctx.fill()
        collines(ctx, 760, mix("#B5652F", "#4A2A22", k), 40, .5, 2)
        collines(ctx, 860, mix(ROUILLE, "#3A1E18", k), 50, .8, 6)
        # cailloux
        r = random.Random(4)
        for _ in range(14):
            x, y = r.uniform(0, W), r.uniform(900, 1060)
            ctx.save(); ctx.translate(x, y); ctx.scale(1, .55)
            ctx.new_path(); ctx.arc(0, 0, r.uniform(10, 28), 0, TAU); ctx.restore()
            src(ctx, mix("#6E3218", "#2A1410", k)); ctx.fill()
        self.rover(ctx, 520, 925, mix("#E7D9C4", "#3B3434", k), t)
        titre(ctx, "Et sur Mars ?", prog(t, .3, .6) * (1 - prog(t, tc, .6)), 150, 72)
        titre(ctx, "Le monde à l'envers", prog(t, tc, .6), 150, 72, "#DDEBFF")

    def rover(self, ctx, x, y, c, t):
        src(ctx, c)
        rect_arrondi(ctx, x - 110, y - 70, 220, 50, 10); ctx.fill()
        ctx.set_line_width(8); ctx.move_to(x + 70, y - 70); ctx.line_to(x + 70, y - 170); ctx.stroke()
        rect_arrondi(ctx, x + 50, y - 200, 60, 32, 8); ctx.fill()
        for dx in (-85, 0, 85):
            ctx.new_path(); ctx.arc(x + dx, y - 6, 22, 0, TAU); src(ctx, "#2A2222"); ctx.fill()
        tf = self.c("photographié")
        fl = math.exp(-((t - tf - .2) ** 2) / .02)
        if fl > .01:
            halo(ctx, x + 112, y - 184, 160, "#FFFFFF", fl)

    def fin(self, ctx, t):
        degrade_v(ctx, [(0, NUIT), (1, "#24508F")])
        etoiles(ctx, t, 90, 2, .6)
        r = random.Random(31)
        soleil(ctx, W / 2, 330, 64, JAUNE, 1, t)
        for _ in range(40):
            ang, ph0 = r.uniform(0, TAU), r.uniform(0, 1)
            ph = (t * .5 + ph0) % 1
            d = 110 + ph * 520
            x, y = W / 2 + math.cos(ang) * d, 330 + math.sin(ang) * d * .7
            trait_lumineux(ctx, [(x - math.cos(ang) * 30, y - math.sin(ang) * 21), (x, y)], BLEU, 4, 1 - ph)
        a = prog(t, self.c("Bref") + .2, .7)
        texte(ctx, "Le ciel bleu :", W / 2, 700, 76, BLANC, a)
        texte(ctx, "de la lumière éparpillée", W / 2, 800, 76, "#9FD3FF", a)

    def textes(self):
        return [(self.c("jour") - .2, self.c("Mais") - .3, "Jour : ciel ocre"),
                (self.c("bleu") - .3, self.c("Bref") - .3, "Coucher de soleil : bleu !")]


CLASSES = [Accroche, Lumiere, Rayleigh, Violet, Coucher, Mars]


# ---------------------------------------------------------------- montage
def montage():
    tim = json.load(open(os.path.join(BUILD, "audio", "timings.json")))
    scenes, debut = [], 0.0
    for i, (cls, s) in enumerate(zip(CLASSES, tim)):
        off = .5 if i == 0 else XF + .1
        sc = cls(s["mots"], off)
        fin_voix = sc.dernier
        duree = fin_voix + (3.0 if i == len(CLASSES) - 1 else MARGE + XF)
        sc.debut, sc.duree, sc.audio, sc.duree_audio = debut, duree, s["fichier"], s["duree"]
        scenes.append(sc)
        debut += duree - XF
    total = scenes[-1].debut + scenes[-1].duree
    return scenes, total


def image(ctx, scenes, total, T):
    for i, sc in enumerate(scenes):
        t = T - sc.debut
        if t < 0 or t > sc.duree:
            continue
        a = 1.0 if i == 0 else prog(t, 0, XF)
        couche(ctx, a, lambda sc=sc, t=t: sc.dessiner(ctx, t))
    vignette(ctx)
    noir = max(1 - prog(T, 0, .6), prog(T, total - 1.0, 1.0))
    if noir > 0:
        ctx.set_source_rgba(0, 0, 0, noir)
        ctx.paint()


def rendre_segment(args):
    k, f0, f1, chemin = args
    scenes, total = montage()
    surf = cairo.ImageSurface(cairo.FORMAT_ARGB32, W, H)
    ctx = cairo.Context(surf)
    ff = subprocess.Popen(["ffmpeg", "-y", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "bgra",
                           "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-", "-c:v", "libx264", "-preset", "medium",
                           "-crf", "18", "-pix_fmt", "yuv420p", "-r", str(FPS), chemin], stdin=subprocess.PIPE)
    for f in range(f0, f1):
        ctx.set_source_rgb(0, 0, 0); ctx.paint()
        image(ctx, scenes, total, f / FPS)
        surf.flush()
        ff.stdin.write(surf.get_data())
    ff.stdin.close()
    ff.wait()
    return chemin


def main():
    scenes, total = montage()
    print("Découpage (début → fin, voix) :")
    for sc in scenes:
        print(f"  {sc.nom:9s} {sc.debut:6.2f} → {sc.debut + sc.duree:6.2f} s   voix {sc.debut + sc.off:6.2f} → "
              f"{sc.debut + sc.dernier:6.2f} s (fichier {sc.duree_audio:.2f} s)")
    print(f"  total : {total:.2f} s")

    if "--apercu" in sys.argv:
        d = os.path.join(BUILD, "apercu"); os.makedirs(d, exist_ok=True)
        surf = cairo.ImageSurface(cairo.FORMAT_ARGB32, W, H); ctx = cairo.Context(surf)
        instants = [float(x) for x in sys.argv[sys.argv.index("--apercu") + 1:]] or \
            [sc.debut + t0 + 1.5 for sc in scenes for t0, _ in sc.phases()]
        for T in instants:
            ctx.set_source_rgb(0, 0, 0); ctx.paint(); image(ctx, scenes, total, T)
            surf.write_to_png(os.path.join(d, f"t{T:06.2f}.png"))
        print("aperçus :", d)
        return

    nb = int(round(total * FPS))
    parts = 8
    segs = [(k, nb * k // parts, nb * (k + 1) // parts, os.path.join(BUILD, f"seg{k}.mp4")) for k in range(parts)]
    with Pool(4) as p:
        p.map(rendre_segment, segs)
    liste = os.path.join(BUILD, "segments.txt")
    with open(liste, "w") as f:
        f.writelines(f"file '{s[3]}'\n" for s in segs)
    video = os.path.join(BUILD, "video_muette.mp4")
    subprocess.check_call(["ffmpeg", "-y", "-loglevel", "error", "-f", "concat", "-safe", "0", "-i", liste,
                           "-c", "copy", video])
    # piste audio : chaque voix posée à son instant exact
    entrees, filtres = [], []
    for i, sc in enumerate(scenes):
        entrees += ["-i", sc.audio]
        ms = int(round((sc.debut + sc.off) * 1000))
        filtres.append(f"[{i + 1}:a]aresample=48000,adelay={ms}:all=1[a{i}]")
    filtres.append("".join(f"[a{i}]" for i in range(len(scenes))) +
                   f"amix=inputs={len(scenes)}:normalize=0:duration=longest,apad,atrim=0:{total:.3f}[aout]")
    sortie = os.path.join(ICI, "pourquoi-le-ciel-est-bleu.mp4")
    subprocess.check_call(["ffmpeg", "-y", "-loglevel", "error", "-i", video] + entrees +
                          ["-filter_complex", ";".join(filtres), "-map", "0:v", "-map", "[aout]",
                           "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart",
                           "-t", f"{total:.3f}", sortie])
    print("Vidéo :", sortie)


if __name__ == "__main__":
    main()
