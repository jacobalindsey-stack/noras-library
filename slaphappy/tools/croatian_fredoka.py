"""Add č ć đ Č Ć Đ (and š ž Š Ž) to the Latin Fredoka files, built from the
font's own pieces: c/C + its caron or acute, d + its hyphen bar, Đ = Ð.
Fredoka itself has no č, ć or đ, which Croatian needs.

Run from a folder holding the original @fontsource/fredoka files renamed
fredoka-500.woff2 / fredoka-500-ext.woff2 (latin and latin-ext subsets) and so
on for 600 and 700; it writes out-fredoka-<weight>.woff2 to copy into fonts/.
Needs fontTools and brotli (pip install fonttools brotli)."""
import sys
from fontTools.ttLib import TTFont
from fontTools.ttLib.tables._g_l_y_f import Glyph, GlyphComponent
from fontTools.pens.boundsPen import BoundsPen

def comp(name, x, y, scale=None):
    c = GlyphComponent(); c.glyphName = name; c.x = int(round(x)); c.y = int(round(y)); c.flags = 0x4
    if scale: c.transform = [[scale[0], 0], [0, scale[1]]]
    return c

def bounds(f, gn):
    p = BoundsPen(f.getGlyphSet()); f.getGlyphSet()[gn].draw(p); return p.bounds

def build(latin, ext, out):
    L, E = TTFont(latin), TTFont(ext)
    G, H = L['glyf'], L['hmtx']
    order = L.getGlyphOrder()
    def add(name, glyph, adv):
        if name not in order: order.append(name)
        G.glyphs[name] = glyph; H.metrics[name] = (adv, 0)
    # the caron mark, copied over from the extended file
    car = E['glyf']['uni030C']; car.expand(E['glyf'])
    add('uni030C', car, E['hmtx']['uni030C'][0])
    L.setGlyphOrder(order); G.setGlyphOrder(order)
    w = lambda g: H[g][0]
    def composite(name, parts, adv):
        g = Glyph(); g.numberOfContours = -1; g.components = parts
        add(name, g, adv)
    sc = {c.glyphName: c for c in E['glyf']['scaron'].components}['uni030C']
    Sc = {c.glyphName: c for c in E['glyf']['Scaron'].components}['uni030C']
    ea = {c.glyphName: c for c in G['eacute'].components}['acutecomb']
    Ea = {c.glyphName: c for c in G['Eacute'].components}['acutecomb']
    # centre a mark over a base by matching the mark's centre to the base's ink centre
    def centred(base, mark, y):
        bx0, _, bx1, _ = bounds(L, base); mx0, _, mx1, _ = bounds(L, mark)
        return (bx0 + bx1) / 2 - (mx0 + mx1) / 2, y
    composite('ccaron', [comp('c', 0, 0), comp('uni030C', *centred('c', 'uni030C', sc.y))], w('c'))
    composite('cacute', [comp('c', 0, 0), comp('acutecomb', *centred('c', 'acutecomb', ea.y))], w('c'))
    composite('scaron', [comp('s', 0, 0), comp('uni030C', *centred('s', 'uni030C', sc.y))], w('s'))
    composite('zcaron', [comp('z', 0, 0), comp('uni030C', *centred('z', 'uni030C', sc.y))], w('z'))
    composite('Ccaron', [comp('C', 0, 0), comp('uni030C', *centred('C', 'uni030C', Sc.y))], w('C'))
    composite('Cacute', [comp('C', 0, 0), comp('acutecomb', *centred('C', 'acutecomb', Ea.y))], w('C'))
    composite('Scaron', [comp('S', 0, 0), comp('uni030C', *centred('S', 'uni030C', Sc.y))], w('S'))
    composite('Zcaron', [comp('Z', 0, 0), comp('uni030C', *centred('Z', 'uni030C', Sc.y))], w('Z'))
    composite('Dcroat', [comp('Eth', 0, 0)], w('Eth'))
    # đ: the hyphen bar, shortened, across the top of the d's stem
    dx0, dy0, dx1, dy1 = bounds(L, 'd'); hx0, hy0, hx1, hy1 = bounds(L, 'hyphen')
    gs = L.getGlyphSet()
    stem = 0.27 * (dx1 - dx0)              # the stem is about the right quarter of the d
    k = min(1.0, (stem * 2.3) / (hx1 - hx0))
    cx = dx1 - stem / 2; cy = dy1 - 0.24 * (dy1 - dy0)
    bar_x = cx - k * (hx0 + hx1) / 2; bar_y = cy - (hy0 + hy1) / 2
    composite('dcroat', [comp('d', 0, 0), comp('hyphen', bar_x, bar_y, (k, 1.0))], max(w('d'), int(cx + k * (hx1 - hx0) / 2 + 20)))
    cps = {0x10D: 'ccaron', 0x107: 'cacute', 0x161: 'scaron', 0x17E: 'zcaron', 0x10C: 'Ccaron', 0x106: 'Cacute',
           0x160: 'Scaron', 0x17D: 'Zcaron', 0x110: 'Dcroat', 0x111: 'dcroat'}
    for t in L['cmap'].tables:
        if t.isUnicode(): t.cmap.update(cps)
    for n in cps.values(): G[n].recalcBounds(G)
    L.flavor = 'woff2'; L.save(out)
    print(out, 'ok, glyphs', len(L.getGlyphOrder()))

for wt in ('500', '600', '700'):
    build(f'fredoka-{wt}.woff2', f'fredoka-{wt}-ext.woff2', f'out-fredoka-{wt}.woff2')
