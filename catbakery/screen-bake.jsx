/* ============================================================
   screen-bake.jsx — Screen 4: Baking / Crafting
   ============================================================ */

function IngLine({ id, need, have }) {
  const ok = have >= need;
  return (
    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
      <Ing id={id} size={26} />
      <Body size={18} color="#5a3a1c" style={{ flex:1 }}>{INGREDIENTS[id].name}</Body>
      <Body size={18} color={ok?'#4d9678':'#c14b56'} style={{ fontWeight:'bold' }}>{have}/{need}</Body>
    </div>
  );
}

function BakeScreen() {
  const { st, api, derived, nav, toast } = React.useContext(GameCtx);
  const bakeable = derived.unlockedRecipes;
  const [sel, setSel] = React.useState(bakeable[bakeable.length-1] || 'croissantsheen');
  const [queue, setQueue] = React.useState([]);   // entries: { rid, jam }
  const [jamFill, setJamFill] = React.useState(false);
  const [phase, setPhase] = React.useState('build'); // build | baking
  const [prog, setProg] = React.useState(0);
  const timer = React.useRef(null);

  // queued ingredient usage (incl. any berry-jam fills already queued)
  const queuedUse = {};
  queue.forEach(e => {
    Object.entries(RECIPES[e.rid].cost).forEach(([k,v]) => queuedUse[k]=(queuedUse[k]||0)+v);
    if (e.jam) queuedUse.jam = (queuedUse.jam||0)+1;
  });
  const invAfterQueue = (k) => (st.inv[k]||0) - (queuedUse[k]||0);
  const r = RECIPES[sel];
  const jamUnlocked = ingredientUnlocked(st,'jam');
  const wantJam = jamFill && !!r.jamOk;
  const canQueue = queue.length < derived.batch
    && Object.entries(r.cost).every(([k,v]) => invAfterQueue(k) >= v)
    && (!wantJam || invAfterQueue('jam') >= 1);

  const ovenMs = (st.tools.includes('proofingOven')?1500:0) + (st.tools.includes('brickOven')?1000:0);
  const tier = RECIPES[sel].tier || 0;
  const durationMs = Math.max(3800, (4600 + tier*1300) - skillLevel(st,sel)*220 - ovenMs);

  // results view if anything pending (covers quick-bake too)
  const showResults = st.pending.length > 0;

  // a sparkly bake earns an extra shimmer right after the oven ding
  const sparkledRef = React.useRef(false);
  React.useEffect(() => {
    if (showResults && st.pending.some(p=>p.sparkly) && !sparkledRef.current) {
      sparkledRef.current = true;
      const id = setTimeout(()=>{ window.SFX && SFX.sparkle(); }, 260);
      return ()=>clearTimeout(id);
    }
    if (!showResults) sparkledRef.current = false;
  }, [showResults, st.pending]);

  const finish = React.useCallback((q) => {
    if (timer.current) { clearInterval(timer.current); timer.current = null; }
    api.bakeBatch(q);
    window.SFX && SFX.bakeDone();
    setQueue([]); setPhase('build'); setProg(0);
  }, [api]);
  const startBake = () => {
    if (!queue.length) return;
    window.SFX && SFX.bakeStart();
    const q = queue;
    setPhase('baking'); setProg(0);
    const start = Date.now();
    timer.current = setInterval(() => {
      const p = Math.min(1, (Date.now()-start)/durationMs);
      setProg(p);
      if (p >= 1) finish(q);
    }, 70);
  };
  const speedUp = () => {
    const cost = 2;
    if (st.bleps < cost) return;
    api.raw(s => ({ ...s, bleps:s.bleps-cost }));
    finish(queue);
  };
  React.useEffect(()=>()=>{ if(timer.current) clearInterval(timer.current); },[]);

  return (
    <div style={{ position:'absolute', inset:0, background:'#b8915c', overflow:'hidden' }}>
      <div style={{ position:'absolute', inset:0, background:'#a9824d' }} className="dither" />
      <div style={{ position:'absolute', left:0, right:0, bottom:0, height:80, background:'#7c5325', borderTop:'4px solid #3c2614' }} className="dither" />

      {/* header */}
      <div style={{ position:'absolute', left:14, top:12, right:14, display:'flex', justifyContent:'center', alignItems:'center', zIndex:5 }}>
        <Panel tone="wood" style={{ padding:'6px 22px' }}><Title size={14} color="#fff4e0">🐾 Bake the Purrfect Pastry!</Title></Panel>
        <div style={{ position:'absolute', right:0, display:'flex', gap:8, alignItems:'center' }}>
          <Panel tone="dark" style={{ padding:'5px 12px', display:'flex', gap:6, alignItems:'center' }}><Blep size={16} /><Title size={12} color="#f2c14e">{st.bleps}</Title></Panel>
          <Btn variant="cream" onClick={()=>nav('bakery')} style={{ fontSize:10 }}>← BAKERY</Btn>
        </div>
      </div>

      {showResults ? (
        /* ---------- RESULTS ---------- */
        <div style={{ position:'absolute', left:14, right:14, top:70, bottom:14, zIndex:4 }}>
          <Panel style={{ height:'100%', padding:18, display:'flex', flexDirection:'column' }}>
            <Title size={13} style={{ textAlign:'center', marginBottom:14 }}>FRESH FROM THE OVEN!</Title>
            <div style={{ flex:1, display:'flex', gap:14, flexWrap:'wrap', justifyContent:'center', alignContent:'flex-start', overflow:'auto' }}>
              {st.pending.map(p => {
                const caseFull = st.caseItems.length >= derived.caseCap;
                const helpersFull = st.helpers.length >= derived.helperCap;
                const aCost = adoptCost(p);
                const isFinale = p.type==='cinnamonroll';
                const cantAdopt = isFinale ? false : (helpersFull || st.bleps < aCost);
                return (
                  <Panel key={p.uid} tone="cream" style={{ width:160, padding:12, display:'flex', flexDirection:'column', alignItems:'center', gap:8, position:'relative' }}>
                    {p.sparkly && <Pill color="#f2c14e" fg="#4a2f10" style={{ position:'absolute', top:6, right:6, fontSize:11 }}>✦ SPARKLY</Pill>}
                    {p.jammy && <Pill color="#a83b63" fg="#ffe9f0" style={{ position:'absolute', top:6, left:6, fontSize:11 }}>♥ JAM</Pill>}
                    <PixelPastry type={p.art} cell={5} />
                    <Title size={9} style={{ textAlign:'center' }}>{RECIPES[p.type].name}</Title>
                    <Body size={15} color="#7c5325" style={{ whiteSpace:'nowrap' }}>worth <Blep size={11} /> {p.value}</Body>
                    <div style={{ display:'flex', gap:6, width:'100%' }}>
                      <Btn variant="green" disabled={caseFull} onClick={()=>{ api.stockResult(p.uid); toast(caseFull?'Case full!':'Stocked for sale'); }} style={{ fontSize:9, flex:1, minHeight:0, padding:'8px 4px' }}>STOCK</Btn>
                      <Btn variant="berry" disabled={cantAdopt} onClick={()=>{ api.adoptResult(p.uid); window.SFX && !isFinale && SFX.adopt(); toast(isFinale?'💖':`Adopted! −${aCost} bleps · +1 batch`); }} style={{ fontSize:9, flex:1, minHeight:0, padding:'8px 4px' }}>
                        ADOPT{isFinale?'':<span style={{ display:'block', fontSize:8, marginTop:2 }}>−{aCost}</span>}
                      </Btn>
                    </div>
                  </Panel>
                );
              })}
            </div>
            <Body size={15} color="#7c5325" style={{ textAlign:'center', marginTop:8 }}>
              STOCK to sell · ADOPT (pay a care-package fee) for a helper that adds +1 batch slot, max {derived.helperCap}{st.caseItems.length>=derived.caseCap?' · case full, buy a Display Case!':''}
            </Body>
          </Panel>
        </div>
      ) : (
        /* ---------- BUILD / BAKING ---------- */
        <React.Fragment>
          {/* recipe list */}
          <div style={{ position:'absolute', left:14, top:70, width:180, bottom:14, zIndex:4 }}>
            <Well style={{ height:'100%', padding:10, overflowY:'auto', overflowX:'hidden' }} bg="#e9d3a6">
              <Title size={10} style={{ marginBottom:8 }}>RECIPES</Title>
              <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                {bakeable.map(rid => (
                  <button key={rid} onClick={()=>setSel(rid)} disabled={phase==='baking'}
                    style={{ cursor:'pointer', textAlign:'left', display:'flex', alignItems:'center', gap:6, padding:'5px 6px',
                      background: sel===rid?'#f2c14e':'#f4e4c1', border:`3px solid ${sel===rid?'#5a3a1c':'#caa06a'}`,
                      boxShadow: sel===rid?'inset 2px 2px 0 #f8d97e':'none', overflow:'hidden' }}>
                    <span style={{ flexShrink:0 }}><PixelPastry type={RECIPES[rid].art} cell={2.1} /></span>
                    <span style={{ fontFamily:"'VT323',monospace", fontSize:15, color:'#3c2614', lineHeight:1.05, whiteSpace:'normal', wordBreak:'break-word' }}>{RECIPES[rid].name}</span>
                  </button>
                ))}
              </div>
            </Well>
          </div>

          {/* center: pastry forming + ingredients */}
          <div style={{ position:'absolute', left:204, right:200, top:70, bottom:14, zIndex:4 }}>
            <Panel style={{ height:'100%', padding:16, display:'flex', flexDirection:'column', alignItems:'center' }}>
              <Title size={12} style={{ marginBottom:6 }}>{r.name}</Title>
              <div style={{ position:'relative', margin:'6px 0 10px' }}>
                <div style={{ transform: phase==='baking'?`scale(${0.7+prog*0.5})`:'scale(1.1)', transition:'transform .2s steps(2)', filter: phase==='baking'&&prog<1?'none':'none' }}>
                  <PixelPastry type={r.art} cell={7} />
                </div>
                {phase==='baking' && <div style={{ position:'absolute', inset:-10, pointerEvents:'none' }}>
                  {[0,1,2].map(i=><div key={i} style={{ position:'absolute', left:`${20+i*30}%`, top:-6, fontFamily:"'VT323',monospace", fontSize:20, color:'#fff', opacity:.7, animation:`steam 1s steps(4) ${i*0.3}s infinite` }}>~</div>)}
                </div>}
              </div>
              <Body size={17} color="#7c5325" style={{ textAlign:'center', minHeight:38, padding:'0 8px' }}>{r.blurb}</Body>

              {phase==='baking' ? (
                <div style={{ width:'100%', marginTop:'auto' }}>
                  <Body size={16} color="#5a3a1c" style={{ textAlign:'center', marginBottom:4 }}>BAKING… {Math.round(prog*100)}%</Body>
                  <Well style={{ height:22, padding:3 }} bg="#3c2614">
                    <div style={{ height:'100%', width:`${prog*100}%`, background:'#f2c14e', boxShadow:'inset 0 2px 0 #f8d97e' }} />
                  </Well>
                  <div style={{ display:'flex', justifyContent:'center', marginTop:10 }}>
                    <Btn variant="green" disabled={st.bleps<2} onClick={speedUp}>SPEED UP <span style={{ display:'inline-flex', alignItems:'center', gap:3 }}>(<Blep size={12} />2)</span></Btn>
                  </div>
                </div>
              ) : (
                <div style={{ width:'100%', marginTop:'auto' }}>
                  <Well style={{ padding:'8px 12px', marginBottom:10 }} bg="#f4e4c1">
                    {Object.entries(r.cost).map(([k,v]) => <IngLine key={k} id={k} need={v} have={invAfterQueue(k)} />)}
                    {wantJam && <IngLine id="jam" need={1} have={invAfterQueue('jam')} />}
                  </Well>
                  {r.jamOk && jamUnlocked && (
                    <button onClick={()=>setJamFill(j=>!j)} disabled={phase==='baking'}
                      style={{ width:'100%', marginBottom:10, cursor:'pointer', display:'flex', alignItems:'center', gap:8, padding:'7px 10px',
                        background: jamFill?'#a83b63':'#f4e4c1', border:`3px solid ${jamFill?'#5e2038':'#caa06a'}`,
                        boxShadow: jamFill?'inset 2px 2px 0 #c75d84':'none' }}>
                      <Ing id="jam" size={22} />
                      <span style={{ flex:1, textAlign:'left', fontFamily:"'VT323',monospace", fontSize:16, lineHeight:1.05, color: jamFill?'#ffe9f0':'#5a3a1c' }}>
                        {jamFill?'\u2665 BERRY JAM FILLING':'Add Berry Jam filling'}
                        <span style={{ display:'block', fontSize:13, opacity:.85 }}>+1 jam · sells +60% · more rep</span>
                      </span>
                      <span style={{ width:18, height:18, flexShrink:0, border:`2px solid ${jamFill?'#ffe9f0':'#7c5325'}`, background: jamFill?'#ffe9f0':'transparent', color:'#a83b63', fontFamily:"'VT323',monospace", fontSize:15, lineHeight:'15px', textAlign:'center' }}>{jamFill?'\u2713':''}</span>
                    </button>
                  )}
                  <Btn variant={canQueue?'gold':'wood'} disabled={!canQueue} onClick={()=>setQueue(q=>[...q,{ rid:sel, jam:wantJam }])} style={{ width:'100%' }}>
                    + ADD TO QUEUE {queue.length>=derived.batch ? '(full)' : ''}
                  </Btn>
                </div>
              )}
            </Panel>
          </div>

          {/* right: skill + queue */}
          <div style={{ position:'absolute', right:14, top:70, width:172, bottom:14, zIndex:4, display:'flex', flexDirection:'column', gap:10 }}>
            <Panel style={{ padding:12, textAlign:'center' }}>
              <Title size={10} style={{ marginBottom:6 }}>SKILL</Title>
              <ToolIcon id="mixingBowl" size={30} />
              <Title size={12} color="#c14b56" style={{ margin:'6px 0' }}>Lv {skillLevel(st,sel)}</Title>
              <Body size={15} color="#7c5325">Success Rate</Body>
              <Title size={14} color="#4d9678">{successRate(st,sel)}%</Title>
            </Panel>
            <Panel style={{ padding:12, flex:1, display:'flex', flexDirection:'column' }}>
              <Title size={10} style={{ marginBottom:8 }}>QUEUE {queue.length}/{derived.batch}</Title>
              <div style={{ display:'flex', flexDirection:'column', gap:6, flex:1 }}>
                {Array.from({length:derived.batch}).map((_,i)=>(
                  <Well key={i} style={{ height:42, display:'flex', alignItems:'center', gap:6, padding:'0 6px', overflow:'hidden' }} bg={queue[i]?'#f4e4c1':'#d8c39a'}>
                    {queue[i] ? <React.Fragment><span style={{ flexShrink:0 }}><PixelPastry type={RECIPES[queue[i].rid].art} cell={2} /></span><Body size={14} color="#3c2614" style={{ flex:1, lineHeight:1, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{RECIPES[queue[i].rid].name}{queue[i].jam?<span style={{ color:'#a83b63' }}> ♥</span>:''}</Body>
                      {phase!=='baking' && <button onClick={()=>setQueue(q=>q.filter((_,j)=>j!==i))} style={{ border:'none', background:'none', color:'#c14b56', cursor:'pointer', fontFamily:"'VT323',monospace", fontSize:18, flexShrink:0 }}>✕</button>}</React.Fragment>
                      : <Body size={13} color="#a9783f">empty</Body>}
                  </Well>
                ))}
              </div>
              {phase!=='baking' && <Btn variant="berry" disabled={!queue.length} onClick={startBake} style={{ width:'100%', marginTop:10 }}>BAKE! ({queue.length})</Btn>}
            </Panel>
            <Body size={14} color="#3c2614" style={{ textAlign:'center' }}>Batch = 1 + {st.helpers.length} helper{st.helpers.length!==1?'s':''}</Body>
          </div>
        </React.Fragment>
      )}
    </div>
  );
}

Object.assign(window, { BakeScreen });
