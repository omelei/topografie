"""
Het logo van leer.nu, uit de levering van de ontwerper (ADR-113).

De ontwerper leverde het beeldmerk als SVG (de ring met het naaldje) en het
woordbeeld alleen als PNG, gezet in Hanken Grotesk 600. De app laadt geen
lettertype van een ander domein en levert alleen Archivo en Public Sans mee, dus
wordt het woordbeeld hier uitgesneden tot paden — uit precies het lettertype dat
in de uitwerking van de ontwerper zit ingebed, op 600, met de letterafstand
(-0,02 em), de kerning en de maten van het rondje zoals die uitwerking ze zet.

Wat dit schrijft:

- docs/logo/svg/woordbeeld-inkt.svg en -papier.svg: het woordbeeld als paden;
- docs/logo/svg/favicon.svg: de ring zonder naald op een inktvlak (onder 20 px
  valt het naaldje weg, zegt de uitwerking);
- src/design/logo.ts: dezelfde paden en maten, voor Wordmark en Brandmark;
- public/logo/: de favicon, de app-iconen en de sociale kaart.

Draaien vanuit de root van de repo:  python tools/logo/maak-logo.py
Nodig: fontTools (met brotli) en Pillow.
"""

import base64
import io
import json
import re
import shutil
from pathlib import Path

from fontTools.pens.boundsPen import BoundsPen
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[2]
LOGO = ROOT / "docs" / "logo"
BUNDEL = LOGO / "uitwerking" / "leer-nu-logo-uitwerking.html"

INKT = "#1A201B"
PAPIER = "#FBFAF6"

# De uitwerking zet het woordbeeld op 132 px met een rondje van 63 px, 3 px
# tussenruimte aan weerszijden en het rondje 2 px boven de basislijn.
LETTERGROOTTE = 132
RONDJE = 63 / LETTERGROOTTE
TUSSEN = 3 / LETTERGROOTTE
OPTIL = 2 / LETTERGROOTTE
LETTERAFSTAND = -0.02
GEWICHT = 600

# Het beeldmerk, in het vak van 100 uit beeldmerk-inkt.svg.
MERK = {"cx": 50, "cy": 50, "r": 38, "stroke": 13}
NAALD = [(31, 41), (69, 41), (50, 65)]
# Onder 20 px: alleen de ring, dikker (de favicon van 16 in de uitwerking).
MERK_KLEIN = {"r": 36, "stroke": 18}


def getal(v: float) -> str:
    s = f"{round(v, 1):.1f}"
    return s[:-2] if s.endswith(".0") else s


def lettertype() -> TTFont:
    html = BUNDEL.read_text(encoding="utf-8")
    manifest = json.loads(
        re.search(r'<script type="__bundler/manifest">(.*?)</script>', html, re.S).group(1)
    )
    for asset in manifest.values():
        if not asset["mime"].startswith("font/"):
            continue
        font = TTFont(io.BytesIO(base64.b64decode(asset["data"])))
        if all(ord(c) in font.getBestCmap() for c in "leernu"):
            return instantiateVariableFont(font, {"wght": GEWICHT})
    raise SystemExit("Geen lettertype met de letters van leer.nu in de uitwerking.")


def kerning(font: TTFont, links: str, rechts: str) -> float:
    """De aanpassing die de kern-feature van GPOS tussen twee glyphs zet."""
    if "GPOS" not in font:
        return 0
    gpos = font["GPOS"].table
    lookups = sorted(
        {i for fr in gpos.FeatureList.FeatureRecord if fr.FeatureTag == "kern"
         for i in fr.Feature.LookupListIndex}
    )
    totaal = 0.0
    for index in lookups:
        lookup = gpos.LookupList.Lookup[index]
        for st in lookup.SubTable:
            if lookup.LookupType == 9:
                st = st.ExtSubTable
            if getattr(st, "LookupType", 2) != 2:
                continue
            dekking = st.Coverage.glyphs
            if links not in dekking:
                continue
            if st.Format == 1:
                paar = next(
                    (p for p in st.PairSet[dekking.index(links)].PairValueRecord
                     if p.SecondGlyph == rechts),
                    None,
                )
                if paar is None:
                    continue
                totaal += getattr(paar.Value1, "XAdvance", 0) or 0
            else:
                c1 = st.ClassDef1.classDefs.get(links, 0)
                c2 = st.ClassDef2.classDefs.get(rechts, 0)
                totaal += getattr(st.Class1Record[c1].Class2Record[c2].Value1, "XAdvance", 0) or 0
            break
    return totaal


def main() -> None:
    font = lettertype()
    upm = font["head"].unitsPerEm
    cmap = font.getBestCmap()
    glyphs = font.getGlyphSet()
    hmtx = font["hmtx"]

    # Plaats de letters op de basislijn (y omhoog), met kerning en letterafstand.
    def woord(tekst: str, x: float):
        geplaatst = []
        for i, ch in enumerate(tekst):
            naam = cmap[ord(ch)]
            geplaatst.append((naam, x))
            stap = hmtx[naam][0]
            if i + 1 < len(tekst):
                stap += kerning(font, naam, cmap[ord(tekst[i + 1])])
            x += stap + LETTERAFSTAND * upm
        return geplaatst, x

    leer, x = woord("leer", 0)
    rondje_x = x + TUSSEN * upm
    breedte_rondje = RONDJE * upm
    nu, _ = woord("nu", rondje_x + breedte_rondje + TUSSEN * upm)
    letters = leer + nu

    # De inktgrenzen: links de l, rechts de u, boven de stok van de l.
    grenzen = []
    for naam, x in letters:
        pen = BoundsPen(glyphs)
        glyphs[naam].draw(pen)
        xmin, ymin, xmax, ymax = pen.bounds
        grenzen.append((xmin + x, ymin, xmax + x, ymax))
    links = min(g[0] for g in grenzen)
    rechts = max(g[2] for g in grenzen)
    boven = max(g[3] for g in grenzen)
    onder = min(g[1] for g in grenzen)  # de overshoot onder de basislijn

    s = breedte_rondje / 100
    optil = OPTIL * upm
    boven = max(boven, optil + 100 * s)

    breedte = rechts - links
    hoogte = boven  # de basislijn ligt op de onderkant van het vak

    paden = []
    for naam, x in letters:
        pen = SVGPathPen(glyphs, ntos=getal)
        glyphs[naam].draw(TransformPen(pen, (1, 0, 0, -1, x - links, hoogte)))
        paden.append(pen.getCommands())

    merk_x = rondje_x - links
    merk_top = hoogte - (optil + 100 * s)
    rondje = {
        "cx": getal(merk_x + MERK["cx"] * s),
        "cy": getal(merk_top + MERK["cy"] * s),
        "r": getal(MERK["r"] * s),
        "stroke": getal(MERK["stroke"] * s),
    }
    naald = "M{} L{} L{} Z".format(
        *(f"{getal(merk_x + px * s)} {getal(merk_top + py * s)}" for px, py in NAALD)
    )
    doorzakken = -onder  # hoe ver de ronde letters onder de basislijn gaan

    # --- docs/logo/svg -----------------------------------------------------
    svg_map = LOGO / "svg"
    svg_map.mkdir(parents=True, exist_ok=True)
    for naam, kleur in (("inkt", INKT), ("papier", PAPIER)):
        (svg_map / f"woordbeeld-{naam}.svg").write_text(
            f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {getal(breedte)} '
            f'{getal(hoogte + doorzakken)}" fill="{kleur}">'
            + "".join(f'<path d="{d}"/>' for d in paden)
            + f'<circle cx="{rondje["cx"]}" cy="{rondje["cy"]}" r="{rondje["r"]}" fill="none" '
            f'stroke="{kleur}" stroke-width="{rondje["stroke"]}"/>'
            + f'<path d="{naald}"/></svg>\n',
            encoding="utf-8",
        )

    # De favicon: het tegeltje van 16 uit de uitwerking. Onder 20 px valt het
    # naaldje weg en blijft de ring over.
    k = 11 / 100
    favicon = (
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16">'
        f'<rect width="16" height="16" rx="4" fill="{INKT}"/>'
        f'<circle cx="8" cy="8" r="{round(MERK_KLEIN["r"] * k, 2)}" '
        f'fill="none" stroke="{PAPIER}" stroke-width="{round(MERK_KLEIN["stroke"] * k, 2)}"/></svg>\n'
    )
    (svg_map / "favicon.svg").write_text(favicon, encoding="utf-8")

    # --- src/design/logo.ts ------------------------------------------------
    ts = f"""/**
 * The logo, as path data (ADR-113). Generated by tools/logo/maak-logo.py —
 * do not edit by hand; run the script again.
 *
 * The wordmark is Hanken Grotesk 600, cut to outlines from the font embedded in
 * the designer's own uitwerking (docs/logo/uitwerking), with the letter spacing
 * and the kerning it sets — so the name needs no font and is the same on every
 * machine. Between the words stands the beeldmerk: a ring with a needle,
 * lifted {getal(optil)} units off the baseline as the uitwerking draws it.
 * logo.test.ts holds these numbers to docs/logo/svg.
 */

/** The wordmark's drawing box: the letters stand on the baseline at its bottom. */
export const LOCKUP = {{ width: {getal(breedte)}, height: {getal(hoogte)} }} as const;

/** How far the round letters dip below the baseline, drawn outside the box. */
export const LOCKUP_DOORZAKKEN = {getal(doorzakken)};

/** The x-height of the letters, in the box's units: what a path behind the name matches. */
export const LOCKUP_X_HOOGTE = {getal(font["OS/2"].sxHeight)};

/** l, e, e, r, n, u — each already in its place in the box. */
export const LOCKUP_GLYPHS: readonly string[] = [
{chr(10).join(f"  '{d}'," for d in paden)}
];

/** The beeldmerk between the words: a ring, and the needle inside it. */
export const LOCKUP_MERK = {{
  cx: {rondje["cx"]},
  cy: {rondje["cy"]},
  r: {rondje["r"]},
  stroke: {rondje["stroke"]},
  naald: '{naald}',
}} as const;

/** The beeldmerk on its own, on the box of 100 of beeldmerk-inkt.svg. */
export const MERK = {{
  size: 100,
  cx: {MERK["cx"]},
  cy: {MERK["cy"]},
  r: {MERK["r"]},
  stroke: {MERK["stroke"]},
  naald: 'M31 41 L69 41 L50 65 Z',
}} as const;

/** Below {20} px the needle goes and the ring is drawn heavier, as the favicon is. */
export const MERK_KLEIN = {{ r: {MERK_KLEIN["r"]}, stroke: {MERK_KLEIN["stroke"]} }} as const;
export const MERK_NAALD_VANAF_PX = 20;

/** The smallest the wordmark is drawn, in px of box height. */
export const LOCKUP_MIN_PX = 20;
"""
    (ROOT / "src" / "design" / "logo.ts").write_text(ts, encoding="utf-8", newline="\n")

    # --- public/logo -------------------------------------------------------
    png = LOGO / "png"
    pub = ROOT / "public" / "logo"
    (pub / "svg").mkdir(parents=True, exist_ok=True)
    (pub / "png").mkdir(parents=True, exist_ok=True)
    shutil.copyfile(svg_map / "favicon.svg", pub / "svg" / "favicon.svg")
    shutil.copyfile(png / "favicon-32.png", pub / "png" / "favicon-32.png")
    shutil.copyfile(png / "social-kaart-1200x630.png", pub / "png" / "social-kaart-1200x630.png")

    # The rounded icon as delivered, for the manifest's "any".
    icoon = Image.open(png / "app-icoon-1024.png").convert("RGBA")
    for maat in (192, 512):
        icoon.resize((maat, maat), Image.LANCZOS).save(pub / "png" / f"app-icoon-{maat}.png")

    # Full bleed, for iOS (which rounds the corners itself) and for Android's
    # maskable, whose safe zone the mark already sits inside: the app icon's
    # own proportions, a mark of 532 on 1024.
    def vol(maat: int) -> Image.Image:
        groot = maat * 4
        beeld = Image.new("RGB", (groot, groot), INKT)
        teken = ImageDraw.Draw(beeld)
        kk = 532 / 1024 * groot / 100
        o = (groot - 100 * kk) / 2
        c = groot / 2
        buiten = MERK["r"] * kk + MERK["stroke"] * kk / 2
        teken.ellipse(
            [c - buiten, c - buiten, c + buiten, c + buiten],
            outline=PAPIER,
            width=round(MERK["stroke"] * kk),
        )
        teken.polygon([(o + px * kk, o + py * kk) for px, py in NAALD], fill=PAPIER)
        return beeld.resize((maat, maat), Image.LANCZOS)

    vol(180).save(pub / "png" / "apple-touch-icon-180.png")
    vol(512).save(pub / "png" / "app-icoon-maskable-512.png")

    print(f"woordbeeld {getal(breedte)} x {getal(hoogte)} (+{getal(doorzakken)} onder de basislijn)")
    print(f"rondje {rondje}, naald {naald}")
    print("kerning", {f"{a}{b}": kerning(font, cmap[ord(a)], cmap[ord(b)]) for a, b in ("le", "ee", "er", "nu")})


if __name__ == "__main__":
    main()
