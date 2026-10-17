/* ============================================================
   icons.jsx — flat/pixel CSS icons: currency, rep star,
   ingredients, NPC cat faces, baker avatar.
   ============================================================ */

/* ---- Blep coin (currency) ---- */
function Blep({ size=20 }) {
  const s = size;
  return (
    <span style={{ display:'inline-block', position:'relative', width:s, height:s, verticalAlign:'middle' }}>
      <span style={{ position:'absolute', inset:0, background:'#f2a9b8', border:`${Math.max(2,s*0.1)}px solid #7a3340`, borderRadius:'50%', boxShadow:'inset 2px 2px 0 #f8cdd6, inset -2px -2px 0 #d97f93' }} />
      {/* paw */}
      <span style={{ position:'absolute', left:'50%', top:'54%', transform:'translate(-50%,-50%)', width:s*0.4, height:s*0.32, background:'#7a3340', borderRadius:'50% 50% 48% 48%' }} />
      <span style={{ position:'absolute', left:'30%', top:'30%', width:s*0.12, height:s*0.16, background:'#7a3340', borderRadius:'50%' }} />
      <span style={{ position:'absolute', left:'46%', top:'24%', width:s*0.12, height:s*0.16, background:'#7a3340', borderRadius:'50%' }} />
      <span style={{ position:'absolute', left:'62%', top:'30%', width:s*0.12, height:s*0.16, background:'#7a3340', borderRadius:'50%' }} />
    </span>
  );
}

/* ---- Rep star ---- */
function Star({ size=18, filled=true }) {
  const s = size; const star='polygon(50% 0,61% 35%,98% 35%,68% 57%,79% 91%,50% 70%,21% 91%,32% 57%,2% 35%,39% 35%)';
  return (
    <span style={{ display:'inline-block', position:'relative', width:s, height:s, verticalAlign:'middle' }}>
      <span style={{ position:'absolute', inset:0, background:'#5a3a1c', clipPath:star }} />
      <span style={{ position:'absolute', inset:'10%', background: filled?'#f2c14e':'#cdb88f', clipPath:star }} />
    </span>
  );
}

/* ---- Ingredient icons ---- */
function Ing({ id, size=30 }) {
  const s = size; const out='#5a3a1c';
  const box = { position:'relative', width:s, height:s, display:'inline-block', verticalAlign:'middle' };
  const B = (st)=>({ position:'absolute', border:`2px solid ${out}`, ...st });
  switch(id){
    case 'flour': return (<span style={box}>
      <span style={B({ left:'18%', top:'14%', right:'18%', bottom:'6%', background:'#efe2c4', borderRadius:'30% 30% 14% 14%' })} />
      <span style={B({ left:'30%', top:'8%', right:'30%', height:'16%', background:'#d9c79a', borderRadius:'40%' })} />
      <span style={{ position:'absolute', left:'42%', top:'46%', width:s*0.14, height:s*0.14, background:'#c9b27e', borderRadius:'50%' }} />
    </span>);
    case 'sugar': return (<span style={box}>
      <span style={B({ left:'20%', top:'24%', right:'20%', bottom:'8%', background:'#f6f0e2', borderRadius:'10%' })} />
      <span style={B({ left:'14%', top:'12%', right:'14%', height:'20%', background:'#cdb88f', borderRadius:'20%' })} />
      <span style={{ position:'absolute', left:'34%', top:'48%', width:s*0.1, height:s*0.1, background:'#cdb88f' }} />
      <span style={{ position:'absolute', left:'54%', top:'62%', width:s*0.1, height:s*0.1, background:'#cdb88f' }} />
    </span>);
    case 'butter': return (<span style={box}>
      <span style={B({ left:'12%', top:'34%', right:'10%', bottom:'18%', background:'#f2c14e' })} />
      <span style={B({ left:'12%', top:'22%', right:'30%', height:'24%', background:'#f8d97e' })} />
    </span>);
    case 'milk': return (<span style={box}>
      <span style={B({ left:'28%', top:'8%', right:'28%', height:'18%', background:'#f6f0e2' })} />
      <span style={B({ left:'18%', top:'24%', right:'18%', bottom:'8%', background:'#f9f5ec', borderRadius:'10% 10% 14% 14%' })} />
      <span style={{ position:'absolute', left:'22%', top:'42%', right:'22%', height:'22%', background:'#9ccadf' }} />
    </span>);
    case 'egg': return (<span style={box}>
      <span style={B({ left:'24%', top:'12%', right:'24%', bottom:'10%', background:'#f9f5ec', borderRadius:'50% 50% 50% 50% / 60% 60% 42% 42%' })} />
      <span style={{ position:'absolute', left:'38%', top:'48%', width:s*0.24, height:s*0.24, background:'#f2c14e', borderRadius:'50%' }} />
    </span>);
    case 'cinnamon': return (<span style={box}>
      <span style={{ position:'absolute', inset:'8%', background:'#f2c98a', borderRadius:'50%', filter:'none', boxShadow:'0 0 0 2px #f2c14e' }} />
      <span style={B({ left:'22%', top:'22%', right:'22%', bottom:'22%', background:'#d98a44', borderRadius:'50%' })} />
      <span style={{ position:'absolute', left:'34%', top:'34%', width:'32%', height:'32%', border:`2px solid #6e3f15`, borderRadius:'50%', borderRightColor:'transparent' }} />
    </span>);
    case 'frosting': return (<span style={box}>
      <span style={B({ left:'24%', top:'28%', right:'24%', bottom:'10%', background:'#f9f5ec', borderRadius:'30% 30% 14% 14%' })} />
      <span style={B({ left:'34%', top:'10%', right:'34%', height:'24%', background:'#f6f0e2', borderRadius:'50% 50% 10% 10%' })} />
    </span>);
    case 'jam': return (<span style={box}>
      <span style={B({ left:'20%', top:'24%', right:'20%', bottom:'8%', background:'#c14b56', borderRadius:'12%' })} />
      <span style={B({ left:'16%', top:'12%', right:'16%', height:'18%', background:'#cdb88f', borderRadius:'20%' })} />
    </span>);
    default: return <span style={box} />;
  }
}

/* ---- NPC cat face ---- */
const CAT_COLORS = {
  orange:{ fur:'#e0a44e', shade:'#b87a32', out:'#5a3a1c' },
  gray:  { fur:'#9aa0a6', shade:'#71767c', out:'#3a3d42' },
  cream: { fur:'#f0e0c0', shade:'#d8c39a', out:'#7c5325' },
  white: { fur:'#f6f0e6', shade:'#dcd2c0', out:'#7c6a52' },
  tabby: { fur:'#c8975a', shade:'#9c6f38', out:'#5a3a1c' },
};
/* Character ids with a delivered portrait-card PNG (sprites/characters/<id>.png).
   Cards are 48×58 and rendered crisp-scaled (pixelated) to match the pastries.
   When CatFace gets an `id` that's here it draws the card; otherwise the
   procedural face (used for generic / not-yet-delivered cats). */
const CHAR_SPRITES = {
  marmalade:1, bramble:1, pip:1, clementine:1, hopkins:1, dot:1, skipper:1,
  juniper:1, basil:1, olive:1, rosco:1, marigold:1, duchess:1, whiskerton:1,
  mayor:1, gateau:1, luna:1,
};
const CHAR_CARD_RATIO = 58/48; // delivered portrait-card aspect (h/w)

function CatFace({ breed='orange', size=72, accessory, id }) {
  if (id && CHAR_SPRITES[id]) {
    const w = Math.round(size), h = Math.round(size * CHAR_CARD_RATIO);
    return (
      <img src={(window.SPRITE_DATA && window.SPRITE_DATA['characters/'+id]) || `sprites/characters/${id}.png`} alt={id} width={w} height={h}
        className="pixelated"
        style={{ display:'inline-block', verticalAlign:'middle', width:w, height:h, imageRendering:'pixelated' }} />
    );
  }
  const c = CAT_COLORS[breed] || CAT_COLORS.orange; const s=size;
  const ear = (x,rot)=>(<span style={{ position:'absolute', left:x, top:'2%', width:s*0.26, height:s*0.26, transform:`rotate(${rot}deg)` }}>
    <span style={{ position:'absolute', inset:0, background:c.out, clipPath:'polygon(50% 0,8% 100%,92% 100%)' }} />
    <span style={{ position:'absolute', inset:'20% 16% 0 16%', background:c.fur, clipPath:'polygon(50% 0,8% 100%,92% 100%)' }} />
  </span>);
  return (
    <span style={{ position:'relative', width:s, height:s, display:'inline-block' }}>
      {ear('14%',-12)} {ear('60%',12)}
      <span style={{ position:'absolute', left:'8%', top:'18%', right:'8%', bottom:'6%', background:c.fur, border:`3px solid ${c.out}`, borderRadius:'46% 46% 44% 44%' }} />
      {breed==='tabby' && <><span style={{ position:'absolute', left:'30%', top:'22%', width:'6%', height:'18%', background:c.shade }} /><span style={{ position:'absolute', left:'64%', top:'22%', width:'6%', height:'18%', background:c.shade }} /></>}
      {/* eyes */}
      <span style={{ position:'absolute', left:'30%', top:'46%', width:s*0.1, height:s*0.13, background:c.out, borderRadius:'50%' }}><span style={{ position:'absolute', left:1, top:1, width:s*0.04, height:s*0.04, background:'#fff' }} /></span>
      <span style={{ position:'absolute', left:'58%', top:'46%', width:s*0.1, height:s*0.13, background:c.out, borderRadius:'50%' }}><span style={{ position:'absolute', left:1, top:1, width:s*0.04, height:s*0.04, background:'#fff' }} /></span>
      {/* nose + whiskers */}
      <span style={{ position:'absolute', left:'46%', top:'60%', width:s*0.08, height:s*0.06, background:'#c14b56', borderRadius:'40%' }} />
      <span style={{ position:'absolute', left:'30%', top:'56%', width:s*0.18, height:'2px', background:c.out }} />
      <span style={{ position:'absolute', left:'52%', top:'56%', width:s*0.18, height:'2px', background:c.out }} />
      {/* accessories */}
      {accessory==='tiara' && <span style={{ position:'absolute', left:'30%', top:'8%', width:'40%', height:'14%', background:'#f2c14e', border:`2px solid ${c.out}`, clipPath:'polygon(0 100%,20% 30%,40% 100%,60% 30%,80% 100%,100% 30%,100% 100%)' }} />}
      {accessory==='monocle' && <span style={{ position:'absolute', left:'54%', top:'42%', width:s*0.2, height:s*0.2, border:`2px solid #f2c14e`, borderRadius:'50%' }} />}
      {accessory==='chefhat' && <span style={{ position:'absolute', left:'18%', top:'-6%', width:'64%', height:'22%', background:'#f9f5ec', border:`2px solid ${c.out}`, borderRadius:'40% 40% 10% 10%' }} />}
    </span>
  );
}

/* ---- Baker (human) avatar ---- */
function Baker({ size=72 }) {
  // delivered portrait card for the human baker
  const w = Math.round(size), h = Math.round(size * CHAR_CARD_RATIO);
  return (
    <img src={(window.SPRITE_DATA && window.SPRITE_DATA['characters/baker']) || 'sprites/characters/baker.png'} alt="baker" width={w} height={h}
      className="pixelated"
      style={{ display:'inline-block', verticalAlign:'middle', width:w, height:h, imageRendering:'pixelated' }} />
  );
}
function BakerProcedural({ size=72 }) {
  const s=size; const out='#5a3a1c';
  return (
    <span style={{ position:'relative', width:s, height:s, display:'inline-block' }}>
      {/* hair */}
      <span style={{ position:'absolute', left:'14%', top:'22%', right:'14%', bottom:'8%', background:'#6b4423', border:`3px solid ${out}`, borderRadius:'46% 46% 40% 40%' }} />
      {/* face */}
      <span style={{ position:'absolute', left:'22%', top:'30%', right:'22%', bottom:'14%', background:'#f0c9a0', border:`3px solid ${out}`, borderRadius:'44%' }} />
      {/* chef hat */}
      <span style={{ position:'absolute', left:'16%', top:'2%', right:'16%', height:'26%', background:'#f9f5ec', border:`3px solid ${out}`, borderRadius:'46% 46% 16% 16%' }} />
      <span style={{ position:'absolute', left:'16%', top:'24%', right:'16%', height:'8%', background:'#e9ddc8', border:`2px solid ${out}` }} />
      {/* eyes + smile */}
      <span style={{ position:'absolute', left:'34%', top:'48%', width:s*0.07, height:s*0.1, background:out, borderRadius:'50%' }} />
      <span style={{ position:'absolute', left:'56%', top:'48%', width:s*0.07, height:s*0.1, background:out, borderRadius:'50%' }} />
      <span style={{ position:'absolute', left:'40%', top:'62%', width:s*0.2, height:s*0.08, borderBottom:`3px solid ${out}`, borderRadius:'0 0 80% 80%' }} />
      <span style={{ position:'absolute', left:'28%', top:'58%', width:s*0.08, height:s*0.05, background:'#e89aa0', opacity:.6, borderRadius:'50%' }} />
      <span style={{ position:'absolute', left:'62%', top:'58%', width:s*0.08, height:s*0.05, background:'#e89aa0', opacity:.6, borderRadius:'50%' }} />
    </span>
  );
}

Object.assign(window, { Blep, Star, Ing, CatFace, Baker, BakerProcedural, CAT_COLORS, CHAR_SPRITES });
