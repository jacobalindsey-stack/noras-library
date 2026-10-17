/* ============================================================
   screen-bakery.jsx — Screen 1: Main Store / home base
   ============================================================ */

function ChalkPastry({ rid, st, compact }) {
  const r = RECIPES[rid];
  const sk = skillLevel(st, rid);
  return (
    <div style={{ display:'flex', alignItems:'center', gap:compact?7:10, padding:'3px 0' }}>
      <div style={{ width:compact?26:30, flexShrink:0, display:'flex', justifyContent:'center' }}><PixelPastry type={r.art} cell={compact?1.9:2.2} /></div>
      <div style={{ flex:1, minWidth:0, fontFamily:"'VT323',monospace", fontSize:compact?18:21, lineHeight:1.05, color:'#f0e7d2', letterSpacing:compact?0:.5 }}>{r.name}</div>
      <div style={{ display:'flex', gap:1, flexShrink:0 }}>{[1,2,3].map(i=><Star key={i} size={compact?9:11} filled={i<=Math.min(3,sk)} />)}</div>
      <div style={{ display:'flex', alignItems:'center', gap:4, flexShrink:0, fontFamily:"'Press Start 2P',monospace", fontSize:compact?10:12, color:'#f2c14e' }}>
        <Blep size={compact?12:15} />{r.sells}
      </div>
    </div>
  );
}

function CaseSlot({ item, onAdopt, canAdopt, compact }) {
  const W = compact ? 88 : 104;
  const H = compact ? 78 : 96;
  const cell = compact ? 3.2 : 4;
  if (!item) return <Well style={{ width:W, height:H, display:'flex', alignItems:'center', justifyContent:'center' }} bg="#d8c39a">
    <Body size={14} color="#a9783f">empty</Body></Well>;
  const r = RECIPES[item.type];
  return (
    <div style={{ position:'relative', width:W }}>
      <Well style={{ height:H, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', position:'relative' }} bg="#f4e4c1">
        {item.sparkly && <div style={{ position:'absolute', top:3, right:5, fontFamily:"'VT323',monospace", fontSize:14, color:'#d99a35' }}>✦</div>}
        {item.jammy && <div style={{ position:'absolute', top:3, left:5, fontFamily:"'VT323',monospace", fontSize:15, color:'#a83b63' }}>♥</div>}
        <PixelPastry type={item.art} cell={cell} />
      </Well>
      <div style={{ display:'flex', gap:3, marginTop:3 }}>
        <Pill color="#2b2823" fg="#f2c14e" style={{ flex:1, textAlign:'center', fontSize:13 }}>
          <Blep size={11} /> {item.value}
        </Pill>
        {canAdopt && <button onClick={onAdopt} title="Adopt as helper"
          style={{ border:'2px solid #5a1f25', background:'#c14b56', color:'#fff', fontFamily:"'VT323',monospace", fontSize:12, cursor:'pointer', padding:'0 6px' }}>♥</button>}
      </div>
    </div>
  );
}

function BakeryScreen() {
  const { st, api, derived, nav, toast, openMenu } = React.useContext(GameCtx);
  const sellable = derived.unlockedRecipes.filter(r => !RECIPES[r].finale || (derived.level>=5));
  const slots = Array.from({ length: derived.caseCap }, (_,i)=> st.caseItems[i] || null);
  const lowBleps = st.bleps < 5;
  const venue = venueForLevel(derived.level);
  const t = venue.theme;
  const nextVenue = derived.level < 5 ? VENUES[derived.level] : null;
  const motes = React.useMemo(()=>Array.from({length: window.LOW_FX?5:11},(_,i)=>({
    id:i, x:5+Math.random()*90, y:16+Math.random()*48, s:Math.random()<0.4?3:2,
    d:5+Math.random()*5, delay:Math.random()*6 })),[]);
  const finaleDone = derived.finale.items.filter(i=>i.done).length;

  return (
    <div style={{ position:'absolute', inset:0, background:t.wall, overflow:'hidden' }}>
      {/* wall texture */}
      <div style={{ position:'absolute', inset:0, background:t.wall2, opacity:0.5 }} className="dither" />
      {/* pixel-stepped light gradient down the wall (banded, not smooth) */}
      <div style={{ position:'absolute', left:0, right:0, top:0, bottom:150, pointerEvents:'none', background:
        'linear-gradient(180deg,'
        + ' rgba(255,244,214,0.22) 0%, rgba(255,244,214,0.22) 13%,'
        + ' rgba(255,244,214,0.12) 13%, rgba(255,244,214,0.12) 28%,'
        + ' rgba(255,244,214,0.04) 28%, rgba(255,244,214,0.04) 46%,'
        + ' rgba(60,38,20,0) 46%, rgba(60,38,20,0) 64%,'
        + ' rgba(60,38,20,0.07) 64%, rgba(60,38,20,0.07) 82%,'
        + ' rgba(60,38,20,0.15) 82%, rgba(60,38,20,0.15) 100%)' }} />
      {/* warm glow pooling toward the sales case */}
      <div style={{ position:'absolute', right:40, top:110, width:600, height:340, pointerEvents:'none',
        background:'radial-gradient(ellipse at center, rgba(248,217,126,0.20), rgba(248,217,126,0) 70%)' }} />
      {/* drifting dust motes */}
      <div className="fx-ambient" style={{ position:'absolute', inset:0, pointerEvents:'none' }}>
      {motes.map(m=>(
        <div key={m.id} style={{ position:'absolute', left:`${m.x}%`, top:`${m.y}%`, width:m.s, height:m.s, borderRadius:'50%',
          background:'rgba(255,244,214,0.8)',
          animation:`mote ${m.d}s ease-in-out ${m.delay}s infinite` }} />
      ))}
      </div>
      {/* floor band */}
      <div style={{ position:'absolute', left:0, right:0, bottom:0, height:150, background:t.floor }} className="dither" />
      <div style={{ position:'absolute', left:0, right:0, bottom:150, height:4, background:t.counterBd, opacity:0.5 }} />

      {/* header sign — shows the current venue (constrained to the left column so it never reaches the chalkboard) */}
      <div style={{ position:'absolute', left:14, top:12, width:248, display:'flex', alignItems:'center', gap:10, zIndex:4 }}>
        <Baker size={56} />
        <Panel style={{ flex:1, minWidth:0, padding:'7px 12px', background:t.signBg, border:`3px solid ${t.signBd}`, boxShadow:`inset 2px 2px 0 rgba(255,255,255,.25), inset -2px -2px 0 rgba(0,0,0,.18)` }}>
          <Title size={9} color={t.signFg} style={{ opacity:.85, marginBottom:3 }}>THE CAT BAKERY</Title>
          <Title size={11} color={t.signFg} style={{ lineHeight:1.3, wordBreak:'break-word' }}>{venue.name}</Title>
        </Panel>
      </div>

      {/* LEFT: stats */}
      <div style={{ position:'absolute', left:14, top:96, width:248, display:'flex', flexDirection:'column', gap:8, zIndex:3 }}>
        <Panel style={{ padding:'8px 12px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <Title size={12}>BLEPS</Title>
          <div style={{ display:'flex', alignItems:'center', gap:6 }}><Blep size={20} /><Title size={16} color="#c14b56">{st.bleps}</Title></div>
        </Panel>
        <Panel style={{ padding:'10px 12px' }}><RepBar band={derived.band} /></Panel>
        <Panel style={{ padding:'10px 12px' }}>
          <Title size={11} style={{ marginBottom:7 }}>TODAY&apos;S STATS</Title>
          {[['Sold',st.session.sold],['Earned',st.session.earned],['Customers',st.session.customers]].map(([k,v])=>(
            <div key={k} style={{ display:'flex', justifyContent:'space-between' }}>
              <Body size={17}>{k}</Body><Body size={17} color="#3c2614" style={{ fontWeight:'bold' }}>{v}</Body>
            </div>
          ))}
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <Body size={17}>Reputation</Body>
            <div style={{ display:'flex', gap:1 }}>{[1,2,3,4,5].map(i=><Star key={i} size={13} filled={i<=derived.band.lvl} />)}</div>
          </div>
        </Panel>
      </div>

      {/* adopted helpers — lounging on the floor under the stats column, where the venue props used to sit */}
      <div style={{ position:'absolute', left:18, bottom:96, width:240, zIndex:3 }}>
        <Title size={9} color="#f0e7d2" style={{ marginBottom:4, opacity:.9, textShadow:'1px 1px 0 rgba(0,0,0,.45)' }}>HELPERS · {st.helpers.length}/{derived.helperCap}</Title>
        {st.helpers.length === 0 ? (
          <Body size={14} color="#f0e7d2" style={{ opacity:.8, textShadow:'1px 1px 0 rgba(0,0,0,.4)' }}>No helpers yet — adopt a pastry-cat from the sales case.</Body>
        ) : (
          <div style={{ display:'flex', gap:14, alignItems:'flex-end' }}>
            {st.helpers.slice(0,4).map(h=>(
              <div key={h.uid} title={`${PASTRY_LABEL[h.art]||h.art}, snoozing`} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:2 }}>
                <PixelPastry type={h.art} cell={2.4} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* CENTER: chalkboard */}
      <div style={{ position:'absolute', left:274, top:12, right:14, height:196, zIndex:3 }}>
        <div style={{ height:'100%', background:'#2b2823', border:'5px solid #6b4423', boxShadow:'inset 0 0 0 3px #3c2614, 4px 4px 0 #3c2614', padding:'12px 18px', position:'relative' }}>
          <div style={{ textAlign:'center', fontFamily:"'Press Start 2P',monospace", fontSize:13, color:'#f0e7d2', marginBottom:6, letterSpacing:1 }}>· TODAY&apos;S OFFERINGS ·</div>
          <div style={{ position:'absolute', left:18, right:18, top:42, bottom:10, overflow:'hidden', columnCount: sellable.length>4?2:1, columnGap:20, columnRule: sellable.length>4?'2px solid rgba(240,231,210,0.18)':'none' }}>
            {sellable.map(r => <ChalkPastry key={r} rid={r} st={st} compact={sellable.length>4} />)}
          </div>
        </div>
      </div>

      {/* CENTER: sales case — beveled glass display cabinet */}
      <div style={{ position:'absolute', left:274, top:222, right:14, bottom:104, zIndex:3, display:'flex', flexDirection:'column' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginBottom:6 }}>
          <Title size={11} color="#5a3a1c">SALES CASE</Title>
          <Body size={15} color="#7c5325" style={{ whiteSpace:'nowrap' }}>{st.caseItems.length} / {derived.caseCap} slots</Body>
        </div>
        {/* brass cabinet shell */}
        <div style={{ position:'relative', flex:1, minHeight:0, overflow:'hidden',
          border:'4px solid #d99a35', boxShadow:'inset 0 0 0 2px #b87a32, 0 4px 0 #7c5325, 0 0 0 2px #3c2614' }}>
          {/* warm under-shelf light strip */}
          <div style={{ position:'absolute', left:0, right:0, top:0, height:5, zIndex:4, pointerEvents:'none',
            background:'linear-gradient(180deg,#fbe7c8,#f2c14e)', boxShadow:'0 2px 6px rgba(248,217,126,.55)' }} />
          <Well style={{ height:'100%', padding:'16px 12px 12px', display:'flex', gap:10, flexWrap:'wrap', alignItems:'center', alignContent:'center', overflowY:'auto' }} bg="#caa06a">
            {slots.map((it,i)=>(
              <CaseSlot key={i} item={it} compact={derived.caseCap>4} canAdopt={!!it && st.helpers.length<derived.helperCap && st.bleps>=adoptCost(it)} onAdopt={()=>{ const c=adoptCost(it); api.adoptFromCase(it.uid); window.SFX && it.type!=='cinnamonroll' && SFX.adopt(); toast(it.type==='cinnamonroll'?'A legend joins you…':`Adopted! −${c} bleps · +1 batch`); }} />
            ))}
          </Well>
          {/* glass overlay (reflections + travelling gleam) */}
          <div style={{ position:'absolute', inset:0, zIndex:5, pointerEvents:'none' }}>
            <div style={{ position:'absolute', left:0, right:0, top:0, height:'44%', background:'linear-gradient(180deg, rgba(255,255,255,0.16), rgba(255,255,255,0))' }} />
            <div style={{ position:'absolute', top:'-20%', left:'9%', width:22, height:'140%', background:'rgba(255,255,255,0.10)', transform:'skewX(-18deg)' }} />
            <div style={{ position:'absolute', top:'-20%', left:'15%', width:11, height:'140%', background:'rgba(255,255,255,0.07)', transform:'skewX(-18deg)' }} />
            <div style={{ position:'absolute', top:'-20%', left:0, width:48, height:'140%',
              background:'linear-gradient(90deg, rgba(255,255,255,0), rgba(255,255,255,0.22), rgba(255,255,255,0))',
              animation:'casegleam 6.5s ease-in-out 1.5s infinite' }} />
            <div style={{ position:'absolute', inset:0, boxShadow:'inset 0 2px 0 rgba(255,255,255,.22), inset 0 -3px 0 rgba(60,38,20,.22)' }} />
          </div>
        </div>
      </div>

      {/* right-side strip controls — sit in the floor band (same strip as helpers), above the counter */}
      <div style={{ position:'absolute', right:14, bottom:104, zIndex:30, display:'flex', alignItems:'center', gap:8 }}>
        {derived.level>=5 && !st.won && (
          <button onClick={()=>nav('quests')} title="The road to the Cinnamon Roll Cat"
            style={{ background: derived.finale.ready?'#6fbf9a':'#f2c14e', color:'#3c2614', border:'3px solid #5a3a1c', boxShadow:'3px 3px 0 #3c2614',
              fontFamily:"'VT323',monospace", fontSize:16, padding:'5px 11px', cursor:'pointer', display:'flex', alignItems:'center', gap:7 }}>
            <span style={{ display:'inline-block', animation:'trophybob 2.6s steps(6) infinite' }}><PixelPastry type="cinnamon" cell={1.5} /></span>
            {derived.finale.ready ? 'Finale ready!' : `Finale ${finaleDone}/4`}
          </button>
        )}
        {Object.values(st.quests).some(s=>s==='active') && (
          <button onClick={()=>nav('quests')} title="Active special orders"
            style={{ background:'#c14b56', color:'#fff', border:'3px solid #5a1f25', boxShadow:'3px 3px 0 #3c2614',
              fontFamily:"'VT323',monospace", fontSize:16, padding:'6px 12px', cursor:'pointer' }}>
            ✦ Special Orders
          </button>
        )}
        <SoundToggle />
        <Btn variant="wood" onClick={()=>openMenu && openMenu()} title="Save / Quit" style={{ fontSize:9, padding:'6px 9px', minHeight:0 }}>☰</Btn>
      </div>

      {/* BOTTOM action bar (the counter) */}
      <div style={{ position:'absolute', left:0, right:0, bottom:0, height:92, background:t.counter, borderTop:`4px solid ${t.counterBd}`, boxShadow:`inset 0 3px 0 ${t.counterLt}, inset 0 -3px 0 ${t.counterDk}`, display:'flex', alignItems:'center', gap:8, padding:'0 12px', zIndex:5 }}>
        <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
          <div style={{ display:'flex', gap:5 }}>
            <Btn variant="cream" onClick={()=>nav('upgrades')} style={{ fontSize:9, padding:'6px 9px', minHeight:0 }}>UPGRADES</Btn>
            <Btn variant="cream" onClick={()=>nav('recipes')} style={{ fontSize:9, padding:'6px 9px', minHeight:0 }}>RECIPES</Btn>
            <Btn variant="cream" onClick={()=>nav('map')} style={{ fontSize:9, padding:'6px 9px', minHeight:0 }}>JOURNEY</Btn>
          </div>
          {lowBleps && <Btn variant="berry" onClick={()=>{ api.quickBake(); window.SFX && SFX.bakeDone(); toast('Quick Bake! A free Breadsheen'); nav('bake'); }} style={{ fontSize:9, padding:'6px 9px', minHeight:0 }}>QUICK BAKE</Btn>}
        </div>
        <div style={{ flex:1, display:'flex', gap:8 }}>
          <ActionBtn variant="gold"  icon={<PixelPastry type="croissant" cell={2.4} />} label="BAKE" sub="make pastries" onClick={()=>nav('bake')} />
          <ActionBtn variant="green" icon={<Ing id="flour" size={26} />} label="GROCERY" sub="buy stock" onClick={()=>nav('shop')} />
          <ActionBtn variant="cream" icon={<CatFace id="clementine" size={30} />} label="CUSTOMERS" sub={`serve`} onClick={()=>nav('customers')} />
          <ActionBtn variant="berry" icon={<span style={{ fontFamily:"'VT323',monospace", fontSize:24, color:'#fff' }}>♥</span>} label="ADOPT" sub={`${st.helpers.length}/${derived.helperCap} helpers`} onClick={()=>nav('adopt')} />
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { BakeryScreen });
