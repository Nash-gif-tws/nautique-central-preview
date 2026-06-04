#!/usr/bin/env python3
"""Convert site JPG/PNG images to WebP alongside the originals (quality 82).
Idempotent: skips when an up-to-date .webp already exists. Run: python3 scripts/webp.py"""
import os
from PIL import Image

ROOTS = ['images', 'images/models']
EXTS = ('.jpg', '.jpeg', '.png')
converted = skipped = 0
saved_before = saved_after = 0

for root in ROOTS:
    if not os.path.isdir(root):
        continue
    for fn in sorted(os.listdir(root)):
        if not fn.lower().endswith(EXTS):
            continue
        src = os.path.join(root, fn)
        dst = os.path.splitext(src)[0] + '.webp'
        if os.path.exists(dst) and os.path.getmtime(dst) >= os.path.getmtime(src):
            skipped += 1
            continue
        try:
            im = Image.open(src)
            if im.mode in ('P', 'LA'):
                im = im.convert('RGBA')
            elif im.mode == 'CMYK':
                im = im.convert('RGB')
            im.save(dst, 'WEBP', quality=82, method=6)
            saved_before += os.path.getsize(src)
            saved_after += os.path.getsize(dst)
            converted += 1
        except Exception as e:
            print('skip', src, e)

print(f'converted {converted}, skipped {skipped}')
if saved_before:
    print(f'  {saved_before/1e6:.1f}MB -> {saved_after/1e6:.1f}MB ({100*saved_after/saved_before:.0f}%)')
