/* ============================================================
   pastry-art.jsx — cat-pastry render treatments
   Three styles, all "placeholder-grade" (drop-in real art later):
     SlotPastry   — honest labeled sprite slot
     FlatPastry   — flat-vector CSS illustration
     PixelPastry  — procedural chunky pixel sprite
   Exports to window for use by the canvas + game.
   ============================================================ */
const { useMemo } = React;

/* palette per pastry type */
const PASTRY_PALETTE = {
  croissant: { body:'#e0a44e', shade:'#b87a32', hi:'#f3cd86', out:'#5a3a1c' },
  macaron:   { body:'#f0a7b6', shade:'#d97f93', hi:'#fad0d9', out:'#7a3340' },
  bread:     { body:'#cf9a5e', shade:'#a8763f', hi:'#e7c596', out:'#5a3a1c' },
  muffin:    { body:'#c98a52', shade:'#9c6633', hi:'#e3b178', out:'#5a3a1c' },
  cake:      { body:'#f3d9a8', shade:'#d9b274', hi:'#fcecc9', out:'#7c5325' },
  cinnamon:  { body:'#d98a44', shade:'#b3672a', hi:'#f2c98a', out:'#6e3f15' },
};
const PASTRY_LABEL = {
  croissant:'CROISSANTSHEEN', macaron:'MACARONSHEEN', bread:'BREADSHEEN',
  muffin:'MUFFINSHEEN', cake:'CAKESHEEN', cinnamon:'CINNAMON ROLL CAT',
};

/* ---------- shared cute face (flat) ---------- */
function FlatFace({ c, eyes='open' }) {
  return (
    <div style={{ position:'absolute', inset:0, pointerEvents:'none' }}>
      {/* eyes */}
      {eyes === 'open' ? (
        <>
          <div style={{ position:'absolute', left:'34%', top:'48%', width:9, height:11, background:c.out, borderRadius:'50%' }}>
            <div style={{ position:'absolute', left:2, top:1, width:3, height:3, background:'#fff' }} />
          </div>
          <div style={{ position:'absolute', left:'57%', top:'48%', width:9, height:11, background:c.out, borderRadius:'50%' }}>
            <div style={{ position:'absolute', left:2, top:1, width:3, height:3, background:'#fff' }} />
          </div>
        </>
      ) : (
        <>
          <div style={{ position:'absolute', left:'33%', top:'52%', width:11, height:6, borderBottom:`3px solid ${c.out}`, borderRadius:'0 0 60% 60%' }} />
          <div style={{ position:'absolute', left:'56%', top:'52%', width:11, height:6, borderBottom:`3px solid ${c.out}`, borderRadius:'0 0 60% 60%' }} />
        </>
      )}
      {/* blush */}
      <div style={{ position:'absolute', left:'24%', top:'58%', width:9, height:6, background:c.shade, opacity:.7, borderRadius:'50%' }} />
      <div style={{ position:'absolute', left:'67%', top:'58%', width:9, height:6, background:c.shade, opacity:.7, borderRadius:'50%' }} />
      {/* mouth */}
      <div style={{ position:'absolute', left:'46%', top:'62%', width:10, height:7, borderBottom:`2.5px solid ${c.out}`, borderRadius:'0 0 80% 80%' }} />
    </div>
  );
}

function FlatEar({ c, side }) {
  const x = side === 'l' ? '24%' : '60%';
  const rot = side === 'l' ? -8 : 8;
  return (
    <div style={{ position:'absolute', left:x, top:'13%', width:24, height:22, transform:`rotate(${rot}deg)`, zIndex:0 }}>
      <div style={{ position:'absolute', inset:0, background:c.out, clipPath:'polygon(50% 0, 8% 100%, 92% 100%)' }} />
      <div style={{ position:'absolute', inset:'18% 18% 0 18%', background:c.body, clipPath:'polygon(50% 0, 8% 100%, 92% 100%)' }} />
      <div style={{ position:'absolute', inset:'42% 36% 6% 36%', background:c.shade, clipPath:'polygon(50% 0, 8% 100%, 92% 100%)' }} />
    </div>
  );
}

/* ---------- 1. FLAT VECTOR ---------- */
function FlatPastry({ type='croissant', size=110, eyes='open' }) {
  const c = PASTRY_PALETTE[type] || PASTRY_PALETTE.croissant;
  const S = size;
  // body shape per type
  const bodyEls = [];
  if (type === 'macaron') {
    bodyEls.push(
      <div key="b" style={{ position:'absolute', left:'12%', top:'24%', right:'12%', bottom:'14%', background:c.body, border:`3px solid ${c.out}`, borderRadius:'46% 46% 40% 40%' }} />,
      <div key="f" style={{ position:'absolute', left:'14%', top:'52%', right:'14%', height:'14%', background:c.hi, borderTop:`2px solid ${c.out}`, borderBottom:`2px solid ${c.out}` }} />
    );
  } else if (type === 'cake') {
    bodyEls.push(
      <div key="b" style={{ position:'absolute', left:'16%', top:'30%', right:'16%', bottom:'12%', background:c.body, border:`3px solid ${c.out}`, borderRadius:'18% 18% 14% 14%' }} />,
      <div key="d" style={{ position:'absolute', left:'16%', top:'46%', right:'16%', height:'9%', background:c.shade }} />,
      <div key="d2" style={{ position:'absolute', left:'16%', top:'64%', right:'16%', height:'9%', background:c.shade }} />
    );
  } else {
    // croissant / bread / muffin / cinnamon — rounded blob
    bodyEls.push(
      <div key="b" style={{ position:'absolute', left:'14%', top:'26%', right:'14%', bottom:'12%', background:c.body, border:`3px solid ${c.out}`, borderRadius: type==='bread' ? '50% 50% 44% 44%' : '46% 46% 42% 42%' }} />,
      <div key="sh" style={{ position:'absolute', left:'14%', bottom:'12%', right:'14%', height:'24%', background:c.shade, borderRadius:'0 0 44% 44%', opacity:.55 }} />
    );
    if (type === 'croissant') bodyEls.push(
      <div key="r1" style={{ position:'absolute', left:'30%', top:'34%', width:'4px', height:'40%', background:c.shade, transform:'rotate(-12deg)', borderRadius:2 }} />,
      <div key="r2" style={{ position:'absolute', left:'66%', top:'34%', width:'4px', height:'40%', background:c.shade, transform:'rotate(12deg)', borderRadius:2 }} />
    );
    if (type === 'cinnamon') bodyEls.push(
      <div key="sw" style={{ position:'absolute', left:'34%', top:'42%', width:'32%', height:'32%', border:`3px solid ${c.shade}`, borderRadius:'50%', borderRightColor:'transparent' }} />
    );
  }
  return (
    <div style={{ position:'relative', width:S, height:S }}>
      <FlatEar c={c} side="l" />
      <FlatEar c={c} side="r" />
      {bodyEls}
      <FlatFace c={c} eyes={eyes} />
    </div>
  );
}

/* Which pastry ids have a real PNG sprite delivered (sprites/pastries/<id>.png).
   If an id is here, PixelPastry draws the PNG; otherwise the procedural grid.
   Add an id the moment its PNG lands — that's the whole per-id handoff switch. */
const PASTRY_SPRITES = {
  bread:1, croissant:1, muffin:1, macaron:1, cake:1, cinnamon:1,
};

/* ---------- 2. PIXEL SPRITE (real PNG if delivered, else procedural) ---------- */
function PixelPastry({ type='croissant', cell=7 }) {
  const c = PASTRY_PALETTE[type] || PASTRY_PALETTE.croissant;
  // grid computed unconditionally so hook order stays stable across types
  const grid = useMemo(() => {
    const W = 14, H = 14;
    const g = Array.from({ length: H }, () => Array(W).fill(null));
    const cx = 6.5, cy = 8, rx = type==='croissant' ? 6 : 5.2, ry = 5;
    for (let y=0; y<H; y++) for (let x=0; x<W; x++) {
      const d = ((x-cx)/rx)**2 + ((y-cy)/ry)**2;
      if (d <= 1) g[y][x] = y > cy+1 ? 's' : 'b';
      if (d > 0.78 && d <= 1.06) g[y][x] = 'o';
    }
    // ears
    [[3,3,4,2],[9,3,10,2]].forEach(([ax,ay])=>{
      g[ay][ax]='b'; g[ay-1] && (g[ay-1][ax]='o'); g[ay][ax]='b'; g[ay+1] && (g[ay+1][ax-0]='b');
    });
    const earCells=[[4,2],[3,3],[4,3],[9,2],[10,3],[9,3]];
    earCells.forEach(([x,y])=>{ if(g[y]) g[y][x]='b'; });
    [[4,2],[9,2]].forEach(([x,y])=>{ if(g[y]) g[y][x]='o'; });
    // eyes
    [[5,7],[8,7]].forEach(([x,y])=>{ if(g[y]) g[y][x]='e'; });
    // blush
    [[4,9],[9,9]].forEach(([x,y])=>{ if(g[y]&&g[y][x]) g[y][x]='p'; });
    // macaron filling line
    if (type==='macaron') for (let x=2;x<12;x++){ if(g[9]&&g[9][x]) g[9][x]='h'; }
    return g;
  }, [type]);
  const COL = { b:c.body, s:c.shade, o:c.out, e:c.out, h:c.hi, p:'#e98aa0' };
  // real sprite path: render the delivered PNG crisp-scaled to the same footprint
  if (PASTRY_SPRITES[type]) {
    const px = 14 * cell;
    return (
      <img className="pixelated" src={(window.SPRITE_DATA && window.SPRITE_DATA['pastries/'+type]) || `sprites/pastries/${type}.png`}
        alt={PASTRY_LABEL[type] || type} width={px} height={px}
        style={{ display:'block', imageRendering:'pixelated' }} />
    );
  }
  return (
    <div className="pixelated" style={{ display:'grid', gridTemplateColumns:`repeat(14, ${cell}px)`, gridTemplateRows:`repeat(14, ${cell}px)`, width:14*cell, height:14*cell }}>
      {grid.flatMap((row,y)=>row.map((v,x)=>(
        <div key={x+'-'+y} style={{ background: v ? COL[v] : 'transparent' }} />
      )))}
    </div>
  );
}

/* ---------- 3. HONEST SLOT ---------- */
function SlotPastry({ type='croissant', size=110 }) {
  const c = PASTRY_PALETTE[type] || PASTRY_PALETTE.croissant;
  return (
    <div style={{ position:'relative', width:size, height:size, background:c.hi,
      border:`3px dashed ${c.out}`, display:'flex', alignItems:'center', justifyContent:'center' }}
      className="dither-strong">
      <div style={{ position:'absolute', top:4, left:6, fontSize:9, color:c.out, opacity:.5 }} className="font-body">art slot</div>
      {/* tiny paw watermark */}
      <div style={{ position:'relative', opacity:.55 }}>
        <div style={{ width:20, height:16, background:c.out, borderRadius:'50% 50% 48% 48%' }} />
        <div style={{ position:'absolute', top:-7, left:-1, width:6, height:8, background:c.out, borderRadius:'50%' }} />
        <div style={{ position:'absolute', top:-9, left:7, width:6, height:8, background:c.out, borderRadius:'50%' }} />
        <div style={{ position:'absolute', top:-7, left:15, width:6, height:8, background:c.out, borderRadius:'50%' }} />
      </div>
    </div>
  );
}

Object.assign(window, { FlatPastry, PixelPastry, SlotPastry, PASTRY_PALETTE, PASTRY_LABEL, PASTRY_SPRITES });
