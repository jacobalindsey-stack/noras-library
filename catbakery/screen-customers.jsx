/* ============================================================
   screen-customers.jsx — Screen 3: Customer Dialogue / Side-Quest
   Shares Bubble + portrait engine with the shop.
   ============================================================ */

function reqText(q) {
  const r = q.require; const parts = [];
  if (r.pastry) parts.push(`${r.qty}× ${RECIPES[r.pastry].name}`);
  if (r.ingredient) parts.push(`${r.iqty}× ${INGREDIENTS[r.ingredient].name}`);
  if (r.critBake) parts.push(`A crit-success ${RECIPES[r.critBake].name}`);
  return parts;
}

function CustomersScreen() {
  const { st, api, derived, nav, toast } = React.useContext(GameCtx);
  const [snoozed, setSnoozed] = React.useState([]);
  const [current, setCurrent] = React.useState(null);
  const [line, setLine] = React.useState(0);
  const [result, setResult] = React.useState(null);
  const usedRef = React.useRef([]);

  const pick = React.useCallback(() => {
    setResult(null); setLine(0);
    const availQuest = Object.keys(QUESTS).find(id => st.quests[id]==='available' && !snoozed.includes(id));
    if (availQuest) { setCurrent({ kind:'quest', q:QUESTS[availQuest], who:QUESTS[availQuest].giver }); return; }
    // eligible visits: pastry obtainable + level high enough
    let pool = CUSTOMER_VISITS.filter(v =>
      (v.wants==='breadsheen' || derived.unlockedRecipes.includes(v.wants)) &&
      derived.level >= (v.minLevel||1));
    let fresh = pool.filter(v => !usedRef.current.includes(v.id));
    if (!fresh.length) { usedRef.current = []; fresh = pool; }
    // weighted by rarity: regulars common, tourists medium, VIPs rare
    const WEIGHT = { regular:6, tourist:4, rare:2 };
    const bag = [];
    fresh.forEach(v => { const w = WEIGHT[v.rarity]||3; for (let i=0;i<w;i++) bag.push(v); });
    const v = bag.length ? bag[Math.floor(Math.random()*bag.length)] : (pool[0] || CUSTOMER_VISITS[0]);
    usedRef.current.push(v.id);
    setCurrent({ kind:'sale', visit:v, who:v.who });
  }, [st.quests, snoozed, derived.unlockedRecipes, derived.level]);

  React.useEffect(() => { if (!current) pick(); }, [current, pick]);
  if (!current) return null;

  const char = CHARACTERS[current.who];
  const accessory = { duchess:'tiara', whiskerton:'monocle', marmalade:'chefhat', mayor:'tiara', gateau:'chefhat', luna:'monocle' }[current.who];
  const lines = current.kind==='quest' ? [current.q.pitch] : current.visit.lines;
  const lastLine = line >= lines.length-1;

  const matching = current.kind==='sale'
    ? st.caseItems
    : [];

  return (
    <div style={{ position:'absolute', inset:0, background:'#d7b98c', overflow:'hidden' }}>
      <div style={{ position:'absolute', inset:0, background:'#cdab7c' }} className="dither" />
      <div style={{ position:'absolute', left:0, right:0, bottom:0, height:70, background:'#a9783f', borderTop:'4px solid #7c5325' }} className="dither" />
      {/* window decoration */}
      <div style={{ position:'absolute', right:24, top:18, width:90, height:70, background:'#9ccadf', border:'4px solid #7c5325' }}><div style={{ position:'absolute', left:'50%', top:0, bottom:0, width:3, background:'#7c5325' }} /></div>

      {/* top bar */}
      <div style={{ position:'absolute', left:14, top:12, right:14, display:'flex', justifyContent:'space-between', alignItems:'center', zIndex:5 }}>
        <Title size={12} color="#3c2614">CUSTOMERS</Title>
        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
          <Panel tone="dark" style={{ padding:'5px 12px', display:'flex', gap:6, alignItems:'center' }}><Blep size={16} /><Title size={12} color="#f2c14e">{st.bleps}</Title></Panel>
          <Btn variant="cream" onClick={()=>nav('bakery')} style={{ fontSize:10 }}>← BAKERY</Btn>
        </div>
      </div>

      {/* portrait + name */}
      <div style={{ position:'absolute', left:30, top:70, width:200, display:'flex', flexDirection:'column', alignItems:'center', gap:8, zIndex:4 }}>
        <div style={{ transform:'scale(1.05)' }}><CatFace id={char.id} breed={char.cat} size={150} accessory={accessory} /></div>
        <Panel tone="wood" style={{ padding:'8px 16px', textAlign:'center' }}>
          <Title size={12} color="#fff4e0">{char.name}</Title>
          <Body size={14} color="#f0e7d2" style={{ marginTop:4, whiteSpace:'nowrap' }}>{char.role}</Body>
        </Panel>
        {char.kind && char.kind!=='shop' && (
          <Pill color={char.kind==='rare'?'#c14b56':char.kind==='tourist'?'#6fa8c4':'#6fbf9a'} fg={char.kind==='tourist'?'#fff':'#16352a'} style={{ fontSize:12 }}>
            {char.kind==='rare'?'★ VIP':char.kind==='tourist'?'✈ TOURIST':'♥ REGULAR'}
          </Pill>
        )}
      </div>

      {/* speech bubble */}
      <div style={{ position:'absolute', left:248, top:78, right:24, zIndex:4 }}>
        <Bubble style={{ minHeight:96, fontSize:22, cursor: result?'default':'pointer' }}>
          <div onClick={()=>{ if(!result && !lastLine) setLine(l=>l+1); }}>
            “{result ? result.text : lines[line]}”
            {!result && !lastLine && <span style={{ float:'right', color:'#a9783f' }}>▸</span>}
          </div>
        </Bubble>
      </div>

      {/* action area */}
      <div style={{ position:'absolute', left:248, right:24, bottom:84, top:200, zIndex:4 }}>
        {result ? (
          <div style={{ display:'flex', gap:10, alignItems:'flex-end', height:'100%' }}>
            <Btn variant="green" big onClick={()=>{ setSnoozed([]); setCurrent(null); }}>NEXT CUSTOMER ▸</Btn>
            <Btn variant="cream" onClick={()=>nav('bakery')}>DONE FOR NOW</Btn>
          </div>
        ) : !lastLine ? (
          <div style={{ display:'flex', gap:10, alignItems:'flex-start' }}>
            <Btn variant="gold" big onClick={()=>setLine(l=>l+1)}>NEXT ▸</Btn>
            <Btn variant="cream" onClick={()=>setLine(lines.length-1)}>SKIP ▸▸</Btn>
          </div>
        ) : current.kind==='quest' ? (
          <Panel style={{ padding:16 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
              <Title size={12} color="#c14b56">SPECIAL REQUEST: {current.q.title}</Title>
            </div>
            {current.q.story && <Body size={15} color="#7c5325" style={{ marginBottom:8, fontStyle:'italic', lineHeight:1.05 }}>{current.q.story}</Body>}
            <div style={{ display:'flex', gap:24, marginBottom:12, flexWrap:'wrap' }}>
              <div>
                <Body size={16} color="#7c5325" style={{ marginBottom:4 }}>Requires:</Body>
                {reqText(current.q).map((t,i)=><Body key={i} size={18} color="#3c2614" style={{ whiteSpace:'nowrap' }}>• {t}</Body>)}
              </div>
              <div>
                <Body size={16} color="#7c5325" style={{ marginBottom:4 }}>Reward:</Body>
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <Pill color="#2b2823" fg="#f2c14e"><span style={{ display:'inline-flex', alignItems:'center', gap:4 }}><Blep size={13} />{current.q.reward.bleps}</span></Pill>
                  <Pill color="#6fbf9a" fg="#16352a">+{current.q.reward.rep} REP</Pill>
                </div>
              </div>
            </div>
            <div style={{ display:'flex', gap:10 }}>
              <Btn variant="green" big onClick={()=>{ api.acceptQuest(current.q.id); window.SFX && SFX.questAccept(); toast(`Quest accepted: ${current.q.title}`); setResult({ text:"Wonderful! I shall return for it. Don\u2019t keep me waiting~" }); }}>ACCEPT QUEST</Btn>
              <Btn variant="wood" onClick={()=>{ setSnoozed(s=>[...s,current.q.id]); setCurrent(null); }}>LATER</Btn>
            </div>
          </Panel>
        ) : (
          <Panel style={{ padding:14, height:'100%', display:'flex', flexDirection:'column' }}>
            <Body size={19} color="#3c2614" style={{ marginBottom:10, flexShrink:0 }}>
              They&apos;d like <b>{current.visit.wantText}</b>. Pick a pastry from your case:
            </Body>
            {matching.length===0 ? (
              <div style={{ flex:1, display:'flex', flexDirection:'column', justifyContent:'center', alignItems:'center', gap:12 }}>
                <Body size={20} color="#a9783f">Your sales case is empty!</Body>
                <Btn variant="gold" onClick={()=>nav('bake')}>GO BAKE SOMETHING</Btn>
              </div>
            ) : (
              <div style={{ display:'flex', gap:10, flexWrap:'wrap', flex:1, alignContent:'flex-start', overflowY:'auto', overflowX:'hidden' }}>
                {matching.map(item => {
                  const match = item.type===current.visit.wants;
                  const jamWin = current.visit.wantsJam && item.jammy;
                  return (
                    <button key={item.uid} onClick={()=>{
                        const r = RECIPES[item.type];
                        let rep = r.rep + (current.visit.tipRep||0) + (current.visit.kind?2:0) + (item.sparkly?2:0) + (item.jammy?2:0);
                        if (current.visit.wantsJam && item.jammy) rep += 3;
                        if (current.visit.wants && current.visit.wants!==item.type) rep = Math.max(0,Math.round(rep*0.4));
                        api.serve(current.visit, item.uid);
                        window.SFX && SFX.sell(); if (match) setTimeout(()=>SFX.meow(), 160);
                        toast(`+${item.value} bleps · +${rep} rep`);
                        setResult({ text: jamWin
                          ? "Berry jam inside — oh, you READ my mind! Bless you, baker."
                          : match
                          ? (current.visit.kind ? "Oh thank you! You\u2019re the kindest baker ever." : "Purrfect. Exactly what I wanted!")
                          : (current.visit.wantsJam ? "Lovely\u2026 though I did dream of a little berry jam inside." : "Hm, not quite what I asked for\u2026 but I\u2019ll take it.") });
                      }}
                      style={{ cursor:'pointer', background:'none', border:'none', padding:0 }}>
                      <Well style={{ width:96, height:90, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', position:'relative', boxShadow: jamWin?'0 0 0 3px #a83b63':match?'0 0 0 3px #6fbf9a':undefined }} bg="#f4e4c1">
                        {match && <div style={{ position:'absolute', top:2, left:4 }}><Pill color="#6fbf9a" fg="#16352a" style={{ fontSize:11 }}>WANTS</Pill></div>}
                        {item.jammy && <div style={{ position:'absolute', top:2, right:4 }}><Pill color="#a83b63" fg="#ffe9f0" style={{ fontSize:11 }}>♥</Pill></div>}
                        <PixelPastry type={item.art} cell={3.6} />
                        <Body size={14} color="#7c5325" style={{ marginTop:2 }}><Blep size={11} /> {item.value}</Body>
                      </Well>
                    </button>
                  );
                })}
              </div>
            )}
          </Panel>
        )}
      </div>
    </div>
  );
}

Object.assign(window, { CustomersScreen });
