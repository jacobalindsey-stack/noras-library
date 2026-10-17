/* ============================================================
   screen-intro.jsx — animated title screen
   A cozy dusk city street: twilight sky, lit skyline, string
   lights, and the glowing corner bakery as the hero. Custom art
   (sprites/intro/intro-bg.png, intro-bakery.png) auto-swaps in
   when present; otherwise the Building/scene draws procedurally.
   ============================================================ */

/* Flip an entry to true the moment its PNG is delivered into sprites/intro/.
   Until then the scene draws procedurally and makes NO image request (no 404s). */
const INTRO_ART = { bg:true, bakery:true };

/* render an image, but fall back to procedural art if it 404s/errs */
function IntroImg({ src, alt='', style={}, className, fallback=null }) {
  const [err, setErr] = React.useState(false);
  if (err) return fallback;
  return <img src={src} alt={alt} className={className} style={style} onError={()=>setErr(true)} />;
}

/* a soft pixel cloud (cluster of rounded blocks) */
function Cloud({ tint='#7e5d86' }) {
  return (
    <div style={{ position:'relative', width:120, height:34 }}>
      <div style={{ position:'absolute', left:0,  bottom:0, width:120, height:18, background:tint, borderRadius:9 }} />
      <div style={{ position:'absolute', left:18, bottom:8, width:44,  height:26, background:tint, borderRadius:13 }} />
      <div style={{ position:'absolute', left:54, bottom:10,width:40,  height:24, background:tint, borderRadius:12 }} />
    </div>
  );
}

/* rising chimney smoke — staggered billowing puffs */
function ChimneySmoke({ left='50%', top='0%' }) {
  const puffs = [
    { d:3.4, delay:0,   x:0,  w:17 },
    { d:3.9, delay:0.55,x:3,  w:22 },
    { d:3.5, delay:1.1, x:-4, w:15 },
    { d:4.2, delay:1.65,x:4,  w:25 },
    { d:3.7, delay:2.2, x:-2, w:19 },
    { d:4.0, delay:2.75,x:2,  w:23 },
    { d:3.6, delay:3.3, x:-3, w:16 },
  ];
  return (
    <div style={{ position:'absolute', left, top, width:0, height:0, zIndex:6, pointerEvents:'none' }}>
      {puffs.map((p,i)=>(
        <div key={i} style={{ position:'absolute', left:p.x, bottom:0, width:p.w, height:p.w, borderRadius:'50%',
          background:'rgba(238,230,216,0.9)', animation:`smokepuff ${p.d}s ease-out ${p.delay}s infinite` }} />
      ))}
    </div>
  );
}

function Intro({ onStart, hasSave }) {
  // fixed, memoized random layouts so nothing jitters between renders
  const stars = React.useMemo(()=>Array.from({length:50},(_,i)=>({
    id:i, x:Math.random()*100, y:Math.random()*54, s:Math.random()<0.22?3:2,
    d:1.4+Math.random()*2.6, delay:Math.random()*3 })),[]);
  const skyline = React.useMemo(()=>{
    const a=[]; let x=-2;
    while(x<103){ const w=4.5+Math.random()*6; const h=46+Math.random()*92;
      a.push({ id:a.length, x, w, h }); x += w + 0.5 + Math.random()*1.4; }
    return a;
  },[]);
  const crumbs = React.useMemo(()=>Array.from({length: window.LOW_FX?7:16},(_,i)=>({
    id:i, x:Math.random()*100, d:6+Math.random()*7, delay:Math.random()*8,
    c:['#f2c14e','#f2a9b8','#fbf1dc','#6fbf9a'][i%4], s:4+Math.random()*4 })),[]);

  // warm window-lights that flicker along the painted skyline band (~64–80% down)
  const winLights = React.useMemo(()=>Array.from({length: window.LOW_FX?14:34},(_,i)=>({
    id:i, x:3+Math.random()*94, y:65+Math.random()*14,
    s:Math.random()<0.25?3:2, warm:Math.random()<0.7,
    d:1.6+Math.random()*2.8, delay:Math.random()*4 })),[]);
  // a few extra twinkling stars up in the dusk sky
  const skyTwinkles = React.useMemo(()=>Array.from({length: window.LOW_FX?8:18},(_,i)=>({
    id:i, x:Math.random()*100, y:4+Math.random()*42, s:Math.random()<0.3?3:2,
    d:1.8+Math.random()*2.6, delay:Math.random()*3 })),[]);

  const floaters = [
    { art:'croissant', x:'7%',  top:'15%', cell:3.4, d:5.4, delay:0   },
    { art:'macaron',   x:'90%', top:'11%', cell:3.0, d:6.3, delay:1.1 },
    { art:'cinnamon',  x:'91%', top:'33%', cell:3.2, d:5.0, delay:0.5 },
    { art:'muffin',    x:'5%',  top:'36%', cell:2.8, d:6.9, delay:1.7 },
    { art:'cake',      x:'15%', top:'56%', cell:2.6, d:6.1, delay:0.9 },
    { art:'bread',     x:'85%', top:'57%', cell:2.7, d:5.7, delay:2.1 },
    { art:'macaron',   x:'2%',  top:'72%', cell:2.3, d:7.4, delay:0.3 },
    { art:'croissant', x:'95%', top:'74%', cell:2.4, d:6.6, delay:1.5 },
    { art:'muffin',    x:'78%', top:'20%', cell:2.2, d:8.0, delay:2.6 },
  ];

  // procedural far-backdrop (used when no painted intro-bg.png is supplied)
  const proceduralBackdrop = (
    <React.Fragment>
      {/* stars */}
      {stars.map(s=>(
        <div key={s.id} style={{ position:'absolute', left:`${s.x}%`, top:`${s.y}%`, width:s.s, height:s.s,
          background:'#fdf3d8', animation:`twinkle ${s.d}s steps(2) ${s.delay}s infinite` }} />
      ))}
      {/* moon + glow */}
      <div style={{ position:'absolute', right:'13%', top:'13%', width:52, height:52, background:'#fdf3d8', borderRadius:'50%',
        boxShadow:'0 0 0 6px rgba(253,243,216,.16), 0 0 34px 12px rgba(253,243,216,.22)' }}>
        <div style={{ position:'absolute', left:12, top:13, width:10, height:10, background:'#ecdcb8', borderRadius:'50%', opacity:.55 }} />
        <div style={{ position:'absolute', left:30, top:30, width:7,  height:7,  background:'#ecdcb8', borderRadius:'50%', opacity:.45 }} />
      </div>
      {/* drifting clouds */}
      {[{top:'15%',d:52,delay:0,sc:1,t:'#75566f'},{top:'31%',d:72,delay:-26,sc:.8,t:'#6a4d6a'},{top:'7%',d:92,delay:-50,sc:1.25,t:'#80607e'}].map((c,i)=>(
        <div key={i} style={{ position:'absolute', top:c.top, left:0, transform:`scale(${c.sc})`, opacity:.5,
          animation:`drift ${c.d}s linear ${c.delay}s infinite` }}><Cloud tint={c.t} /></div>
      ))}
      {/* skyline silhouette + lit windows */}
      <div style={{ position:'absolute', left:0, right:0, bottom:84, height:150 }}>
        {skyline.map(b=>{
          const cols=Math.max(1,Math.round(b.w/2.2)), rows=Math.max(2,Math.round(b.h/22));
          return (
            <div key={b.id} style={{ position:'absolute', left:`${b.x}%`, bottom:0, width:`${b.w}%`, height:b.h,
              background:'#241d44', borderTop:'2px solid #2e2656' }}>
              <div style={{ position:'absolute', inset:'8px 5px', display:'grid',
                gridTemplateColumns:`repeat(${cols},1fr)`, gridAutoRows:'5px', gap:'6px 4px' }}>
                {Array.from({length:cols*rows}).map((_,k)=>{
                  const lit=Math.random()<0.5;
                  return <div key={k} style={{ background: lit?(Math.random()<0.7?'#f2c14e':'#9ccadf'):'#1d1838',
                    opacity: lit?(0.55+Math.random()*0.45):0.5,
                    animation: lit&&Math.random()<0.3?`twinkle ${2+Math.random()*3}s steps(2) ${Math.random()*3}s infinite`:'none' }} />;
                })}
              </div>
            </div>
          );
        })}
      </div>
      {/* flanking storefronts on the street */}
      <div style={{ position:'absolute', left:'2%',  bottom:78, opacity:.82, filter:'brightness(.8)' }}><Building id="neighborhood" size={120} /></div>
      <div style={{ position:'absolute', left:'14%', bottom:78, opacity:.7,  filter:'brightness(.7)' }}><Building id="garage" size={92} /></div>
      <div style={{ position:'absolute', right:'2%', bottom:78, opacity:.82, filter:'brightness(.8)' }}><Building id="bigcity" size={120} /></div>
      <div style={{ position:'absolute', right:'14%',bottom:78, opacity:.7,  filter:'brightness(.7)' }}><Building id="truck" size={100} /></div>
      {/* ground / sidewalk */}
      <div style={{ position:'absolute', left:0, right:0, bottom:0, height:84, background:'#3f3020', borderTop:'4px solid #5a4636' }} className="dither" />
      <div style={{ position:'absolute', left:0, right:0, bottom:60, height:3, background:'rgba(90,70,54,.6)' }} />
    </React.Fragment>
  );

  // procedural hero bakery (used when no painted intro-bakery.png is supplied)
  const proceduralBakery = (
    <div style={{ position:'relative', width:176, height:176 }}>
      {/* warm window glow overlay on the corner shop's window */}
      <div style={{ position:'absolute', left:'18%', top:'44%', width:'30%', height:'26%', background:'#f8d97e',
        boxShadow:'0 0 16px 6px rgba(248,217,126,.6)', border:'3px solid #3c2614' }} />
      <Building id="corner" size={176} />
    </div>
  );

  return (
    <div style={{ position:'absolute', inset:0, overflow:'hidden',
      background:'linear-gradient(#20294f 0%, #3a2e63 34%, #6e4c7e 58%, #b86b6e 78%, #e89a6a 100%)' }}>

      {/* ---- far backdrop (painted plate or procedural) ---- */}
      <div style={{ position:'absolute', inset:0, zIndex:1 }}>
        {INTRO_ART.bg ? (
          <IntroImg src={(window.SPRITE_DATA && window.SPRITE_DATA['intro/intro-bg']) || "sprites/intro/intro-bg.png"}
            style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover', imageRendering:'pixelated' }}
            className="pixelated" fallback={proceduralBackdrop} />
        ) : proceduralBackdrop}
      </div>

      {/* ---- twinkle overlay: flickering city windows + extra stars (only over the painted plate) ---- */}
      {INTRO_ART.bg && (
        <div className="fx-ambient" style={{ position:'absolute', inset:0, zIndex:2, pointerEvents:'none' }}>
          {skyTwinkles.map(s=>(
            <div key={'s'+s.id} style={{ position:'absolute', left:`${s.x}%`, top:`${s.y}%`, width:s.s, height:s.s,
              background:'#fdf3d8', animation:`twinkle ${s.d}s steps(2) ${s.delay}s infinite` }} />
          ))}
          {winLights.map(w=>(
            <div key={'w'+w.id} style={{ position:'absolute', left:`${w.x}%`, top:`${w.y}%`, width:w.s, height:w.s,
              background: w.warm?'#ffce6a':'#bfe0f0',
              boxShadow: w.warm?'0 0 3px 1px rgba(255,200,90,.7)':'0 0 3px 1px rgba(160,205,230,.6)',
              animation:`lampflick ${w.d}s steps(3) ${w.delay}s infinite` }} />
          ))}
        </div>
      )}

      {/* ---- string lights across the top ---- */}
      <div style={{ position:'absolute', left:0, right:0, top:-6, zIndex:8, animation:'sway 6s ease-in-out infinite', transformOrigin:'top center' }}>
        {[14,32,50,68,86].map((lx,i)=><LightFixture key={i} type="string" x={`${lx}%`} />)}
      </div>

      {/* ---- hero bakery, centered on the cobbled plaza ---- */}
      <div style={{ position:'absolute', left:'50%', bottom:14, transform:'translateX(-50%)', zIndex:5,
        display:'flex', flexDirection:'column', alignItems:'center' }}>
        <div style={{ position:'relative' }}>
          {/* warm grounding glow pooled under the shop */}
          <div style={{ position:'absolute', left:'50%', bottom:'4%', width:330, height:240, transform:'translateX(-50%)',
            background:'radial-gradient(ellipse at center, rgba(248,217,126,.45), rgba(248,217,126,0) 70%)',
            animation:'glowpulse 4s steps(8) infinite', zIndex:-1 }} />
          {/* chimney smoke (aimed at the art's chimney, upper-right) */}
          <ChimneySmoke left="76%" top="3%" />
          {INTRO_ART.bakery ? (
            <IntroImg src={(window.SPRITE_DATA && window.SPRITE_DATA['intro/intro-bakery']) || "sprites/intro/intro-bakery.png"}
              style={{ display:'block', width:270, height:'auto', imageRendering:'pixelated' }}
              className="pixelated" fallback={proceduralBakery} />
          ) : proceduralBakery}
          {/* swinging OPEN sign — only for the procedural shop (the art has its own signage) */}
          {!INTRO_ART.bakery && (
          <div style={{ position:'absolute', left:-6, top:'40%', transformOrigin:'top center', animation:'sway 3.4s ease-in-out infinite' }}>
            <div style={{ width:2, height:10, background:'#3c2614', margin:'0 auto' }} />
            <div style={{ background:'#c14b56', color:'#fff0ef', border:'3px solid #5a1f25', boxShadow:'2px 2px 0 #3c2614',
              fontFamily:"'Press Start 2P',monospace", fontSize:9, padding:'4px 7px' }}>OPEN</div>
          </div>
          )}
        </div>
      </div>

      {/* ---- floating cat-pastries ---- */}
      {floaters.map((f,i)=>(
        <div key={i} style={{ position:'absolute', left:f.x, top:f.top, zIndex:7,
          animation:`floaty ${f.d}s ease-in-out ${f.delay}s infinite` }}>
          <PixelPastry type={f.art} cell={f.cell} />
        </div>
      ))}

      {/* ---- falling sparkles / crumbs ---- */}
      {crumbs.map(c=>(
        <div key={c.id} style={{ position:'absolute', left:`${c.x}%`, top:'-2%', width:c.s, height:c.s, background:c.c, zIndex:7,
          animation:`fall ${c.d}s linear ${c.delay}s infinite` }} />
      ))}

      {/* ---- title + tagline + buttons ---- */}
      <div style={{ position:'absolute', left:0, right:0, top:38, zIndex:9, display:'flex', flexDirection:'column', alignItems:'center', textAlign:'center', padding:'0 20px' }}>
        <div style={{ fontFamily:"'Press Start 2P',monospace", fontSize:11, color:'#f8d97e', letterSpacing:2, opacity:.9, marginBottom:10, textShadow:'2px 2px 0 #3c2614' }}>✦ A COZY PIXEL BAKERY ✦</div>
        <div style={{ animation:'bob 3.6s ease-in-out infinite' }}>
          <div style={{ fontFamily:"'Press Start 2P',monospace", fontSize:42, lineHeight:1.18, color:'#f2c14e',
            textShadow:'5px 5px 0 #c14b56, 8px 8px 0 #5a1f25, 0 0 24px rgba(242,193,78,.5)' }}>
            THE CAT<br/>BAKERY
          </div>
        </div>
        <Body size={19} color="#fbe7c8" style={{ maxWidth:600, marginTop:14, textShadow:'1px 1px 0 #3c2614' }}>
          Bake living cat-pastries, serve a town of cats, and journey toward the legendary <span style={{ color:'#f2a9b8' }}>Cinnamon Roll Cat</span>.
        </Body>
        <div style={{ display:'flex', gap:14, marginTop:22 }}>
          <Btn variant="gold" big onClick={()=>onStart(false)}>{hasSave?'▸ CONTINUE':'▸ START BAKING'}</Btn>
          {hasSave && <Btn variant="berry" onClick={()=>onStart(true)}>NEW GAME</Btn>}
        </div>
      </div>

      {/* ---- footer + vignette ---- */}
      <div style={{ position:'absolute', left:0, right:0, bottom:8, zIndex:9, textAlign:'center',
        fontFamily:"'VT323',monospace", fontSize:15, color:'#fbe7c8', opacity:.85, textShadow:'1px 1px 0 #3c2614' }}>
        2026 by Nora
      </div>
      <div style={{ position:'absolute', inset:0, zIndex:10, pointerEvents:'none',
        boxShadow:'inset 0 0 120px 30px rgba(28,17,9,.45)' }} />
    </div>
  );
}

Object.assign(window, { Intro });
