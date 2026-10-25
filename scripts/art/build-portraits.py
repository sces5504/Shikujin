"""Build every pilot portrait variant from transparent full-body source art.

Usage: python3 scripts/art/build-portraits.py <path-to-20261020-checkout>

The source checkout is only read. Outputs go to assets/ in this repo:
four-column sheets for the original pilots (asset contract v1.5) and
single-column files for pilots added in 2.0.
"""
import math
import random
import sys
from pathlib import Path

from PIL import Image, ImageChops, ImageDraw, ImageEnhance, ImageFilter

ROOT = Path(__file__).resolve().parents[2]
CELL_W, CELL_H = 384, 1024
SHEET = ["akari", "rin", "yuki", "mio"]
SINGLE = ["hisa", "sakuya"]
PILOTS = {
    "akari": ("art/characters/stellar10/standards/io.png", "#ffc18b"),
    "rin": ("art/characters/standard/maiden-02/v1.png", "#c2afff"),
    "yuki": ("art/characters/stellar10/standards/titania.png", "#8bf8ed"),
    "mio": ("art/characters/standard/maiden-04/v1.png", "#f38c9e"),
    "hisa": ("art/characters/standard/maiden-03/v1.png", "#ff6b7d"),
    "sakuya": ("art/characters/stellar10/standards/pluto.png", "#b9c4ff"),
}
BACKDROP = "art/world/bridge.webp"
COSMOS = "art/world/cosmos.webp"


def rgb(hex_color):
    h = hex_color.lstrip("#")
    return tuple(int(h[i : i + 2], 16) for i in (0, 2, 4))


def frame(figure, height_ratio, top_pad=0.025):
    """Crop a portrait-shaped window starting just above the head."""
    alpha = figure.getchannel("A")
    x0, y0, x1, y1 = alpha.getbbox()
    fig_h = y1 - y0
    head = alpha.crop((x0, y0, x1, y0 + int(fig_h * 0.16)))
    # Horizontal centre of the head band keeps faces aligned between pilots.
    px = head.load()
    cols = [sum(1 for j in range(head.height) if px[i, j] > 40) for i in range(head.width)]
    total = sum(cols) or 1
    cx = x0 + sum(i * c for i, c in enumerate(cols)) / total
    crop_h = fig_h * height_ratio
    crop_w = crop_h * CELL_W / CELL_H
    top = y0 - fig_h * top_pad
    box = (int(cx - crop_w / 2), int(top), int(cx + crop_w / 2), int(top + crop_h))
    canvas = Image.new("RGBA", (box[2] - box[0], box[3] - box[1]), (0, 0, 0, 0))
    canvas.alpha_composite(figure, (-box[0], -box[1]))
    return canvas.resize((CELL_W, CELL_H), Image.LANCZOS)


def cover(image, w=CELL_W, h=CELL_H, focus=0.5):
    s = max(w / image.width, h / image.height)
    im = image.resize((math.ceil(image.width * s), math.ceil(image.height * s)), Image.LANCZOS)
    left = int((im.width - w) * focus)
    return im.crop((left, 0, left + w, h)).convert("RGBA")


def tint(image, color, amount):
    layer = Image.new("RGBA", image.size, rgb(color) + (int(255 * amount),))
    out = image.copy()
    out.alpha_composite(layer)
    return out


def vignette(image, strength=0.65, color=(3, 8, 14)):
    w, h = image.size
    mask = Image.new("L", (w, h), 0)
    d = ImageDraw.Draw(mask)
    for i in range(40):
        t = i / 40
        d.rectangle((int(w * t * 0.5), int(h * t * 0.35), int(w - w * t * 0.5), int(h - h * t * 0.2)), fill=int(255 * t))
    mask = mask.filter(ImageFilter.GaussianBlur(40))
    dark = Image.new("RGBA", (w, h), color + (255,))
    inv = ImageChops.invert(mask).point(lambda v: int(v * strength))
    out = image.copy()
    out.paste(dark, (0, 0), inv)
    return out


def rim(figure, color, radius=6, alpha=0.9):
    """Coloured outer glow that separates the character from busy backgrounds."""
    a = figure.getchannel("A").filter(ImageFilter.MaxFilter(radius * 2 + 1)).filter(ImageFilter.GaussianBlur(radius))
    glow = Image.new("RGBA", figure.size, rgb(color) + (0,))
    glow.putalpha(a.point(lambda v: int(v * alpha)))
    return glow


def compose(bg, figure, glow_color=None, glow=0.0):
    out = bg.copy()
    if glow_color:
        out.alpha_composite(rim(figure, glow_color, 8, glow))
    out.alpha_composite(figure)
    return out


def bridge_bg(src, color, warm=False, alarm=False):
    bg = cover(Image.open(src / BACKDROP), focus=0.45).filter(ImageFilter.GaussianBlur(5 if warm else 2.5))
    if warm:
        bg = ImageEnhance.Brightness(bg).enhance(0.9)
        bg = tint(bg, "#ffb070", 0.28)
    elif alarm:
        bg = ImageEnhance.Brightness(ImageEnhance.Color(bg).enhance(0.4)).enhance(0.55)
        bg = tint(bg, "#ff2a3a", 0.22)
    else:
        bg = ImageEnhance.Brightness(bg).enhance(0.8)
        bg = tint(bg, color, 0.12)
    return vignette(bg, 0.7)


def energy_bg(src, color):
    bg = cover(Image.open(src / COSMOS), focus=0.3)
    bg = tint(ImageEnhance.Brightness(bg).enhance(0.7), color, 0.25)
    d = ImageDraw.Draw(bg, "RGBA")
    rnd = random.Random(color)
    cx, cy = CELL_W / 2, CELL_H * 0.32
    c = rgb(color)
    for _ in range(140):
        a = rnd.uniform(0, math.tau)
        r0, r1 = rnd.uniform(40, 160), rnd.uniform(500, 1200)
        width = rnd.choice([1, 2, 2, 3, 5])
        col = c + (rnd.randint(70, 190),) if rnd.random() < 0.7 else (255, 255, 255, rnd.randint(60, 150))
        d.line((cx + math.cos(a) * r0, cy + math.sin(a) * r0, cx + math.cos(a) * r1, cy + math.sin(a) * r1), fill=col, width=width)
    flare = Image.new("RGBA", bg.size, (0, 0, 0, 0))
    fd = ImageDraw.Draw(flare)
    for i in range(30, 0, -1):
        fd.ellipse((cx - i * 9, cy - i * 9, cx + i * 9, cy + i * 9), fill=c + (int(9 * (31 - i) / 3),))
    bg.alpha_composite(flare.filter(ImageFilter.GaussianBlur(12)))
    return vignette(bg, 0.45)


def damage(figure, seed):
    """Soot, scorch marks and scratches, clipped to the character silhouette."""
    rnd = random.Random(seed)
    w, h = figure.size
    soot = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(soot)
    for _ in range(22):
        x, y, r = rnd.uniform(0, w), rnd.uniform(h * 0.34, h), rnd.uniform(18, 70)
        d.ellipse((x - r, y - r * 0.7, x + r, y + r * 0.7), fill=(20, 14, 12, rnd.randint(60, 140)))
    soot = soot.filter(ImageFilter.GaussianBlur(14))
    marks = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    md = ImageDraw.Draw(marks)
    for _ in range(9):
        x, y = rnd.uniform(w * 0.15, w * 0.85), rnd.uniform(h * 0.4, h * 0.92)
        a, l = rnd.uniform(-0.9, 0.9) + math.pi / 2, rnd.uniform(30, 90)
        md.line((x, y, x + math.cos(a) * l, y + math.sin(a) * l), fill=(40, 20, 18, 200), width=3)
        md.line((x + 2, y, x + 2 + math.cos(a) * l * 0.8, y + math.sin(a) * l * 0.8), fill=(255, 190, 150, 120), width=1)
    layer = Image.alpha_composite(soot, marks)
    layer.putalpha(ImageChops.multiply(layer.getchannel("A"), figure.getchannel("A")))
    worn = ImageEnhance.Brightness(ImageEnhance.Color(figure).enhance(0.8)).enhance(0.88)
    worn.alpha_composite(layer)
    return worn


def sparks(image, seed):
    rnd = random.Random(seed)
    d = ImageDraw.Draw(image, "RGBA")
    for _ in range(40):
        x, y = rnd.uniform(0, CELL_W), rnd.uniform(CELL_H * 0.3, CELL_H)
        l = rnd.uniform(6, 22)
        d.line((x, y, x + rnd.uniform(-4, 4), y - l), fill=(255, rnd.randint(140, 210), 90, rnd.randint(120, 230)), width=2)
    return image


def variants(src, pilot):
    path, color = PILOTS[pilot]
    figure = Image.open(src / path).convert("RGBA")
    bust = frame(figure, 0.56)
    close = frame(figure, 0.44, 0.015)
    roomy = frame(figure, 0.64, 0.04)
    return {
        "portrait": compose(bridge_bg(src, color), bust, color, 0.35),
        "radio": bust,
        "burst": Image.alpha_composite(rim(close, color, 5, 0.85), close),
        "ultimate": compose(energy_bg(src, color), close, color, 0.95),
        "memory": compose(bridge_bg(src, color, warm=True), roomy, "#ffd2a0", 0.3),
        "damaged": sparks(compose(bridge_bg(src, color, alarm=True), damage(bust, pilot)), pilot),
    }


def save(image, name, transparent):
    out = image if transparent else image.convert("RGB")
    out.save(ROOT / "assets" / name, "WEBP", quality=84, method=6)


def main():
    src = Path(sys.argv[1]).resolve()
    built = {p: variants(src, p) for p in SHEET + SINGLE}
    sheet_names = {
        "portrait": "pilots.webp",
        "radio": "pilots-radio.webp",
        "burst": "pilots-burst.webp",
        "ultimate": "pilots-ultimate.webp",
        "memory": "pilots-memory.webp",
        "damaged": "pilots-damaged.webp",
    }
    for kind, name in sheet_names.items():
        sheet = Image.new("RGBA", (CELL_W * 4, CELL_H), (0, 0, 0, 0))
        for i, pilot in enumerate(SHEET):
            sheet.alpha_composite(built[pilot][kind], (i * CELL_W, 0))
        save(sheet, name, kind in ("radio", "burst"))
    for pilot in SINGLE:
        for kind, image in built[pilot].items():
            save(image, f"pilot-{pilot}-{kind}.webp", kind in ("radio", "burst"))
    print("portraits written:", len(sheet_names), "sheets,", len(SINGLE) * 6, "single files")


if __name__ == "__main__":
    main()
