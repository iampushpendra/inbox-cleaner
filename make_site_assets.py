"""Generate the site's favicon.ico and social og-image.png.

Both URLs are referenced by docs/ but neither file exists, so every crawl of the
site records a 404 for each. Regenerate with: python3 make_site_assets.py
"""
from PIL import Image, ImageDraw, ImageFont

BLUE = '#1a73e8'
LIGHT = '#d2e3fc'
INK = '#202124'


def envelope(d, x, y, w, h, fill, flap):
    """Draw an envelope body+flap. x,y,w,h is the body box."""
    d.rectangle([x, y, x + w, y + h], fill=fill)
    d.polygon([(x, y), (x + w // 2, y + int(h * 0.52)), (x + w, y)], fill=flap)


def icon(size):
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    pad = max(1, size // 10)
    d.rounded_rectangle([pad, pad, size - pad, size - pad], radius=size // 4, fill=BLUE)
    ew, eh = int(size * 0.58), int(size * 0.40)
    ex, ey = (size - ew) // 2, (size - eh) // 2 + size // 16
    envelope(d, ex, ey, ew, eh, 'white', LIGHT)
    return img


def font(size, bold=False):
    """Best available system font; falls back to PIL's bitmap default."""
    names = (['/System/Library/Fonts/Supplemental/Arial Bold.ttf'] if bold else []) + [
        '/System/Library/Fonts/Supplemental/Arial.ttf',
        '/System/Library/Fonts/Helvetica.ttc',
    ]
    for name in names:
        try:
            return ImageFont.truetype(name, size)
        except OSError:
            continue
    return ImageFont.load_default()


def og_image():
    """1200x630 social card. Brand colours only; no invented stats or screenshots."""
    W, H = 1200, 630
    img = Image.new('RGB', (W, H), '#ffffff')
    d = ImageDraw.Draw(img)
    d.rectangle([0, 0, W, 14], fill=BLUE)

    # Paste through the alpha mask; a plain convert('RGB') would flatten the
    # transparent padding to black and draw a box around the icon.
    img.paste(icon(96), (90, 96), icon(96))
    d.text((210, 118), 'Inbox Cleaner', font=font(44, bold=True), fill=INK)

    d.text((90, 250), 'See who is filling', font=font(72, bold=True), fill=INK)
    d.text((90, 340), 'your Gmail.', font=font(72, bold=True), fill=INK)
    d.text((90, 452), 'Free Chrome extension  ·  Select senders, then move their mail to Trash',
           font=font(30), fill='#5f6368')
    d.text((90, 502), 'Gmail Trash keeps mail for 30 days — you can restore it.',
           font=font(26), fill='#80868b')
    return img


icon(32).save('docs/favicon.ico', sizes=[(16, 16), (32, 32), (48, 48)])
print('  docs/favicon.ico')
og_image().save('docs/og-image.png')
print('  docs/og-image.png')