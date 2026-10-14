"""Miniature de la vidéo (même style graphique que rendu.py).

Usage : python3 miniature.py  ->  miniature.png (1280×720) et miniature-1920.png (1920×1080)
"""
import math, os, random

import cairo

from rendu import (BLANC, BLEU, CIEL_B, CIEL_H, JAUNE, OCRE, ORANGE, POLICE, TAU, W, H,
                   bonhomme, collines, degrade_v, halo, hexa, mix, rect_arrondi, soleil,
                   trait_lumineux, vignette)

ICI = os.path.dirname(os.path.abspath(__file__))


def texte_gras(ctx, s, x, y, taille, c, contour=10):
    ctx.select_font_face(POLICE, cairo.FONT_SLANT_NORMAL, cairo.FONT_WEIGHT_BOLD)
    ctx.set_font_size(taille)
    e = ctx.text_extents(s)
    ctx.new_path()
    ctx.move_to(x + 4, y + 6)
    ctx.text_path(s)
    ctx.set_source_rgba(0, .03, .1, .45)
    ctx.fill()
    ctx.new_path()
    ctx.move_to(x, y)
    ctx.text_path(s)
    ctx.set_source_rgba(.03, .07, .18, 1)
    ctx.set_line_width(contour)
    ctx.set_line_join(cairo.LINE_JOIN_ROUND)
    ctx.stroke_preserve()
    ctx.set_source_rgba(*hexa(c))
    ctx.fill()
    return e


def dessiner(ctx):
    # ciel : bleu de jour à gauche, coucher de soleil à droite
    degrade_v(ctx, [(0, "#1E5BC6"), (.75, CIEL_H), (1, CIEL_B)])
    ctx.push_group()
    degrade_v(ctx, [(0, "#3A2A7A"), (.45, "#E0457A"), (.78, ORANGE), (1, "#FFD27F")])
    ctx.pop_group_to_source()
    m = cairo.LinearGradient(820, 0, 1500, 0)
    m.add_color_stop_rgba(0, 0, 0, 0, 0)
    m.add_color_stop_rgba(1, 0, 0, 0, 1)
    ctx.mask(m)

    sx, sy = 1500, 760
    halo(ctx, sx, sy, 900, ORANGE, .55)
    # le bleu éparpillé par l'air, qui part du soleil vers tout le ciel
    r = random.Random(12)
    for _ in range(70):
        ang = r.uniform(math.pi * .95, math.pi * 1.75)
        d = r.uniform(240, 1300)
        x, y = sx + math.cos(ang) * d, sy + math.sin(ang) * d * .75
        if y > 860 or x < -20:
            continue
        L = r.uniform(30, 60)
        dx, dy = math.cos(ang), math.sin(ang) * .75
        trait_lumineux(ctx, [(x - dx * L, y - dy * L), (x, y)], "#7CC4FF", 6, .55 + .4 * r.random())
    soleil(ctx, sx, sy, 150, mix(JAUNE, ORANGE, .45), 1, 0.6)

    collines(ctx, 900, "#2A1A3E", 34, .7, 3)
    collines(ctx, 965, "#170D24", 28, 1.1, 5)
    bonhomme(ctx, 1180, 955, 1.25, "#170D24")
    vignette(ctx)

    # titre
    texte_gras(ctx, "POURQUOI", 90, 250, 150, BLANC, 14)
    texte_gras(ctx, "LE CIEL EST", 90, 420, 150, BLANC, 14)
    ctx.select_font_face(POLICE, cairo.FONT_SLANT_NORMAL, cairo.FONT_WEIGHT_BOLD)
    ctx.set_font_size(190)
    e = ctx.text_extents("BLEU ?")
    bx, by = 70, 470
    ctx.save()
    ctx.translate(bx, by)
    ctx.rotate(-.035)
    rect_arrondi(ctx, 0, 0, e.width + 90, 240, 34)
    ctx.set_source_rgba(1, 1, 1, 1)
    ctx.fill()
    ctx.select_font_face(POLICE, cairo.FONT_SLANT_NORMAL, cairo.FONT_WEIGHT_BOLD)
    ctx.set_font_size(190)
    ctx.move_to(45 - e.x_bearing, 195)
    ctx.set_source_rgba(*hexa("#1F6FE0"))
    ctx.show_text("BLEU ?")
    ctx.restore()

    # pastille « couchers orange »
    rect_arrondi(ctx, 90, 770, 700, 92, 46)
    ctx.set_source_rgba(.03, .07, .18, .78)
    ctx.fill()
    ctx.new_path(); ctx.arc(140, 816, 18, 0, TAU)
    ctx.set_source_rgba(*hexa(ORANGE)); ctx.fill()
    ctx.select_font_face(POLICE, cairo.FONT_SLANT_NORMAL, cairo.FONT_WEIGHT_BOLD)
    ctx.set_font_size(52)
    ctx.set_source_rgba(*hexa(BLANC))
    ctx.move_to(178, 834)
    ctx.show_text("…et les couchers orange")

    # badge Mars : planète ocre + coucher de soleil bleu
    mx, my, mr = 1720, 175, 118
    halo(ctx, mx, my, mr * 2.1, "#9FD0FF", .9)
    g = cairo.RadialGradient(mx - 40, my - 45, 10, mx, my, mr)
    g.add_color_stop_rgba(0, *hexa("#FFC27A"))
    g.add_color_stop_rgba(.6, *hexa("#E0703A"))
    g.add_color_stop_rgba(1, *hexa("#9A3412"))
    ctx.set_source(g)
    ctx.new_path(); ctx.arc(mx, my, mr, 0, TAU); ctx.fill()
    ctx.new_path(); ctx.arc(mx, my, mr, 0, TAU)
    ctx.set_source_rgba(1, 1, 1, .9); ctx.set_line_width(6); ctx.stroke()
    ctx.save()
    ctx.translate(mx, my + mr + 20); ctx.rotate(.05)
    rect_arrondi(ctx, -140, -40, 280, 80, 40)
    ctx.set_source_rgba(1, 1, 1, 1); ctx.fill()
    ctx.set_font_size(46)
    e = ctx.text_extents("+ MARS")
    ctx.move_to(-e.width / 2 - e.x_bearing, 16)
    ctx.set_source_rgba(*hexa("#9C4A26")); ctx.show_text("+ MARS")
    ctx.restore()


def main():
    for nom, w, h in [("miniature.png", 1280, 720), ("miniature-1920.png", 1920, 1080)]:
        surf = cairo.ImageSurface(cairo.FORMAT_ARGB32, w, h)
        ctx = cairo.Context(surf)
        ctx.scale(w / W, h / H)
        dessiner(ctx)
        surf.write_to_png(os.path.join(ICI, nom))
        print(os.path.join(ICI, nom))


if __name__ == "__main__":
    main()
