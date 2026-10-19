"""Découpe les planches Gemini, retire le fond blanc (remplissage depuis les bords), exporte en WebP et génère src/assets.js."""
import base64, io, json, sys
import numpy as np
from PIL import Image
from scipy import ndimage as ndi

RAW = '/home/claude/cartographe/assets/raw/'
OUT = '/home/claude/cartographe/assets/out/'

def b64(im, q=84, fmt='WEBP'):
    buf = io.BytesIO(); im.save(buf, fmt, quality=q, method=6)
    return 'data:image/webp;base64,' + base64.b64encode(buf.getvalue()).decode()

def remove_bg(im, fill_holes=False):
    a = np.asarray(im.convert('RGB')).astype(np.float32)
    mn = a.min(axis=2); mx = a.max(axis=2)
    near = (mn >= 236) & ((mx - mn) <= 18)
    lab, n = ndi.label(near)
    border = set(np.unique(np.concatenate([lab[0, :], lab[-1, :], lab[:, 0], lab[:, -1]]))) - {0}
    bg = np.isin(lab, list(border)) if border else np.zeros_like(near)
    if fill_holes: bg = near  # intérieurs vides (étoile creuse)
    ring = ndi.binary_dilation(bg, iterations=3)
    t = np.clip((mn - 218.0) / (247.0 - 218.0), 0, 1)
    t = t * t * (3 - 2 * t)
    alpha = np.where(bg, 0.0, np.where(ring, 1.0 - t, 1.0))
    alpha = np.where(bg, 0.0, alpha)
    # décontamination : retire le blanc mélangé sur les bords semi-transparents
    af = np.maximum(alpha, 1e-3)[..., None]
    rgb = np.clip((a - 255.0 * (1 - af)) / af, 0, 255)
    rgb = np.where(alpha[..., None] > 0.98, a, rgb)
    out = np.dstack([rgb, alpha * 255]).astype(np.uint8)
    return Image.fromarray(out, 'RGBA')

def bbox_alpha(im, thr=18):
    al = np.asarray(im)[..., 3]
    ys, xs = np.where(al > thr)
    return (xs.min(), ys.min(), xs.max() + 1, ys.max() + 1)

def cells(im, cols, rows):
    W, H = im.size
    for r in range(rows):
        for c in range(cols):
            yield im.crop((c * W // cols, r * H // rows, (c + 1) * W // cols, (r + 1) * H // rows))

def sprites(path, names, cols, rows, maxdim, holes=()):
    sheet = Image.open(path).convert('RGB')
    res = {}; crops = []
    for i, cell in enumerate(cells(sheet, cols, rows)):
        rgba = remove_bg(cell, fill_holes=(names[i] in holes))
        bb = bbox_alpha(rgba); crops.append(rgba.crop(bb))
    big = max(max(c.size) for c in crops); k = maxdim / big
    for name, c in zip(names, crops):
        w, h = max(1, round(c.size[0] * k)), max(1, round(c.size[1] * k))
        im = c.resize((w, h), Image.LANCZOS)
        res[name] = {'src': b64(im, 86), 'w': w, 'h': h}
        im.save(OUT + name + '.png')
    return res

def portraits(path, names, size):
    sheet = Image.open(path).convert('RGB'); res = {}
    for name, cell in zip(names, cells(sheet, 2, 2)):
        rgba = remove_bg(cell); bb = bbox_alpha(rgba, 30)
        w, h = bb[2] - bb[0], bb[3] - bb[1]; s = max(w, h)
        cxm, cym = (bb[0] + bb[2]) // 2, bb[1] + s // 2   # on garde le haut de la tête, centré
        sq = Image.new('RGBA', (s, s), (0, 0, 0, 0))
        sq.paste(rgba.crop(bb), ((s - w) // 2, 0))
        im = sq.resize((size, size), Image.LANCZOS)
        res[name] = b64(im, 86); im.save(OUT + name + '.png')
    return res

A = {}
A['stamps'] = {}
A['stamps'].update(sprites(RAW + 'tampons-habitat.jpg', ['village', 'ferme', 'auberge', 'chapelle', 'abbaye', 'tannerie'], 3, 2, 200))
A['stamps'].update(sprites(RAW + 'tampons-eau.jpg', ['moulin', 'pont', 'pont_casse', 'gue', 'source', 'lac'], 3, 2, 200))
A['ui'] = {}
A['ui'].update(sprites(RAW + 'ui-outils.jpg', ['carnet', 'boussole', 'plume', 'regle', 'loupe', 'sceau'], 3, 2, 144))
A['ui'].update(sprites(RAW + 'ui-jetons.jpg', ['jeton_question', 'jeton_eclaireur', 'etoile', 'etoile_vide', 'eponge', 'fanion'], 3, 2, 144, holes=('etoile_vide',)))
A['portraits'] = {}
A['portraits'].update(portraits(RAW + 'portraits-1.jpg', ['odo', 'bartolo', 'pip', 'odile'], 256))
A['portraits'].update(portraits(RAW + 'portraits-2.jpg', ['gaspard', 'rufus', 'hermance', 'roi'], 256))
p = Image.open(RAW + 'parchemin.jpg').convert('RGB'); A['parchment'] = b64(p, 80)
t = Image.open(RAW + 'titre.jpg').convert('RGB'); A['title'] = b64(t, 80)

def scene(path, w=720, q=76):
    im = Image.open(path).convert('RGB'); k = w / im.size[0]
    return b64(im.resize((w, round(im.size[1] * k)), Image.LANCZOS), q)
A['scenes'] = {'moulins': scene(RAW + 'scene-moulins.jpg'), 'riviere': scene(RAW + 'scene-riviere.jpg'), 'chateau': scene(RAW + 'scene-chateau.jpg')}
for k, v in A['scenes'].items(): print('scene', k, round(len(v) / 1024), 'Ko')


# --- lot 3 : relief, fortifications, sceaux, ornements, roi/Orlan, rose, table, icône ---
A['stamps'].update(sprites(RAW + 'lieux-relief.jpg', ['montagne', 'colline', 'col', 'falaise', 'marais', 'rochers'], 3, 2, 200))
A['stamps'].update(sprites(RAW + 'lieux-fortifs.jpg', ['tour', 'fort', 'ville_fortifiee', 'chateau', 'mine', 'ruines'], 3, 2, 200))
A['ui'].update(sprites(RAW + 'ui-sceaux.jpg', ['sceau_rubans', 'enveloppe', 'sceau_brise', 'verdict_ok', 'verdict_presque', 'verdict_rate'], 3, 2, 160, holes=('verdict_ok', 'verdict_presque', 'verdict_rate')))
def boxes(path, spec, holes=()):
    sheet = Image.open(path).convert('RGB'); res = {}
    for name, (maxdim, box) in spec.items():
        rgba = remove_bg(sheet.crop(box), fill_holes=(name in holes)); bb = bbox_alpha(rgba); c = rgba.crop(bb)
        k = maxdim / max(c.size); w, h = max(1, round(c.size[0] * k)), max(1, round(c.size[1] * k))
        im = c.resize((w, h), Image.LANCZOS); res[name] = {'src': b64(im, 86), 'w': w, 'h': h}; im.save(OUT + name + '.png')
    return res
A['ui'].update(boxes(RAW + 'ui-ornements.jpg', {
    'coin': (200, (20, 30, 410, 400)), 'separateur': (420, (445, 80, 1240, 180)), 'bandeau': (420, (445, 205, 1240, 395)),
    'punaise': (160, (110, 440, 360, 730)), 'cadre_rond': (260, (440, 460, 830, 780)), 'etiquette': (200, (910, 400, 1230, 830))}, holes=('cadre_rond', 'coin', 'separateur')))
A['portraits'].update(portraits(RAW + 'portraits-roi.jpg', ['roi_furieux', 'roi_severe', 'roi_content', 'roi_ravi'], 256))
A['portraits'].update(portraits(RAW + 'portraits-orlan.jpg', ['orlan', 'orlan_triste', 'orlan_clin', 'orlan_dos'], 256))
A['ui'].update(sprites(RAW + 'rose.jpg', ['rose'], 1, 1, 420, holes=('rose',)))
tb = Image.open(RAW + 'table.jpg').convert('RGB').resize((512, 512), Image.LANCZOS); A['table'] = b64(tb, 70)
ic = Image.open(RAW + 'icone.jpg').convert('RGB')
ic.resize((512, 512), Image.LANCZOS).save(OUT + 'icon-512.png'); ic.resize((192, 192), Image.LANCZOS).save(OUT + 'icon-192.png')
A['icon'] = b64(ic.resize((96, 96), Image.LANCZOS), 82)

js = '/* Généré par assets/process.py — ne pas modifier à la main */\nwindow.ASSETS = ' + json.dumps(A, separators=(',', ':')) + ';\n'
open('/home/claude/cartographe/src/assets.js', 'w').write(js)
print('assets.js', round(len(js) / 1024), 'Ko')
for k, v in A['stamps'].items(): print(k, v['w'], v['h'], round(len(v['src']) / 1024), 'Ko')
