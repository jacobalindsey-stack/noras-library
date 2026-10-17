/* ============================================================
   screen-extras.jsx — Recipes book, Upgrades, Adopt, Quests, Win
   ============================================================ */

function reqTextX(q) {
  const r = q.require; const parts = [];
  if (r.pastry) parts.push(`${r.qty}× ${RECIPES[r.pastry].name}`);
  if (r.ingredient) parts.push(`${r.iqty}× ${INGREDIENTS[r.ingredient].name}`);
  if (r.critBake) parts.push(`Crit-success ${RECIPES[r.critBake].name}`);
  return parts;
}

function SubShell({ title, children, nav, bg='#d7b98c' }) {
  return (
    <div style={{ position:'absolute', inset:0, background:bg, overflow:'hidden' }}>
      <div style={{ position:'absolute', inset:0, background:'rgba(60,38,20,0.04)' }} className="dither" />
      <div style={{ position:'absolute', left:14, top:12, right:14, display:'flex', justifyContent:'space-between', alignItems:'center', zIndex:5 }}>
        <Panel tone="wood" style={{ padding:'6px 18px' }}><Title size={13} color="#fff4e0">{title}</Title></Panel>
        <Btn variant="cream" onClick={()=>nav('bakery')} style={{ fontSize:10 }}>← BAKERY</Btn>
      </div>
      <div style={{ position:'absolute', left:14, right:14, top:66, bottom:14, zIndex:3 }}>{children}</div>
    </div>
  );
}

/* ---------- RECIPES BOOK ---------- */
function RecipesScreen() {
  const { st, nav } = React.useContext(GameCtx);
  const unlockText = (r) => r.unlock.start ? 'From the start'
    : `Lvl ${r.unlock.level}${r.unlock.tool?` + ${TOOLS[r.unlock.tool].name}`:''}${r.unlock.ingredient?` + ${INGREDIENTS[r.unlock.ingredient].name}`:''}`;
  return (
    <SubShell title="RECIPE BOOK" nav={nav}>
      <Well style={{ height:'100%', padding:14, display:'flex', gap:12, flexWrap:'wrap', alignContent:'flex-start', overflow:'auto' }} bg="#e9d3a6">
        {RECIPE_ORDER.map(rid => {
          const r = RECIPES[rid]; const open = recipeUnlocked(st,rid);
          return (
            <Panel key={rid} style={{ width:288, padding:12, display:'flex', gap:12, opacity:open?1:0.78, position:'relative', alignItems:'flex-start' }}>
              <Well style={{ width:80, height:80, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, filter:open?'none':'grayscale(1) brightness(0.8)' }} bg="#f4e4c1">
                <PixelPastry type={r.art} cell={4} />
              </Well>
              <div style={{ flex:1, minWidth:0, display:'flex', flexDirection:'column', gap:5 }}>
                <Title size={11} color={r.finale?'#c14b56':'#3c2614'}>{r.name}</Title>
                <Body size={14} color="#7c5325" style={{ lineHeight:1.05, display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden' }}>{r.blurb}</Body>
                <div style={{ display:'flex', flexWrap:'wrap', gap:6, alignItems:'center' }}>
                  {Object.entries(r.cost).map(([k,v])=>(
                    <span key={k} style={{ display:'inline-flex', alignItems:'center', gap:2 }}><Ing id={k} size={17} /><Body size={13} color="#5a3a1c">×{v}</Body></span>
                  ))}
                </div>
                <div style={{ display:'flex', gap:6, alignItems:'center', flexWrap:'wrap' }}>
                  {open ? <React.Fragment>
                    <Pill color="#2b2823" fg="#f2c14e"><span style={{ display:'inline-flex', alignItems:'center', gap:3 }}><Blep size={11} />{r.sells}</span></Pill>
                    <Pill color="#6fbf9a" fg="#16352a">+{r.rep} rep</Pill>
                    {r.jamOk && <Pill color="#a83b63" fg="#ffe9f0">♥ jam</Pill>}
                    <Body size={13} color="#7c5325">skill {skillLevel(st,rid)}</Body>
                  </React.Fragment> : <Pill color="#5a3a1c">🔒 {unlockText(r)}</Pill>}
                </div>
              </div>
            </Panel>
          );
        })}
      </Well>
    </SubShell>
  );
}

/* ---------- UPGRADES (tools) ---------- */
function UpgradesScreen() {
  const { st, api, derived, nav, toast } = React.useContext(GameCtx);
  return (
    <SubShell title="UPGRADES & TOOLS" nav={nav}>
      <Well style={{ height:'100%', padding:14, display:'flex', gap:14, flexWrap:'wrap', alignContent:'flex-start', overflow:'auto' }} bg="#e9d3a6">
        {['mixingBowl', ...TOOL_ORDER].map(id => {
          const t = TOOLS[id]; const owned = st.tools.includes(id);
          const locked = derived.level < t.level; const afford = st.bleps>=t.price;
          return (
            <Panel key={id} style={{ width:210, padding:14, display:'flex', flexDirection:'column', alignItems:'center', gap:8, opacity:locked&&!owned?0.72:1 }}>
              <ToolIcon id={id} size={46} />
              <Title size={10} style={{ textAlign:'center' }}>{t.name}</Title>
              <Body size={16} color="#7c5325" style={{ textAlign:'center', minHeight:40 }}>{t.desc}</Body>
              {owned ? <Pill color="#6fbf9a" fg="#16352a">★ OWNED</Pill>
                : locked ? <Pill color="#5a3a1c">🔒 Requires Level {t.level}</Pill>
                : <Btn variant={afford?'gold':'wood'} disabled={!afford} onClick={()=>{ api.buyTool(id); window.SFX && SFX.buy(); toast(`Bought ${t.name}!`); }}>
                    <span style={{ display:'inline-flex', alignItems:'center', gap:4 }}><Blep size={14} />{t.price}</span>
                  </Btn>}
            </Panel>
          );
        })}
      </Well>
    </SubShell>
  );
}

/* ---------- ADOPT ---------- */
function AdoptScreen() {
  const { st, api, nav, toast, derived } = React.useContext(GameCtx);
  const cap = derived.helperCap;
  const moreSpaceComing = cap < 4;   // garage/truck only fit two cats
  return (
    <SubShell title="ADOPTION CORNER" nav={nav}>
      <div style={{ height:'100%', display:'flex', flexDirection:'column', gap:12 }}>
        <Panel tone="dark" style={{ padding:'12px 16px', flexShrink:0 }}>
          <Body size={18} color="#f0e7d2">Turn a baked cat-pastry into a <b style={{ color:'#f2c14e' }}>helper</b> — each adds <b style={{ color:'#f2c14e' }}>+1 batch slot</b> for a small <b style={{ color:'#f2c14e' }}>care-package fee</b> (and forfeits the sale). Up to <b style={{ color:'#f2c14e' }}>{cap} helpers</b>{moreSpaceComing?'; slots 3–4 unlock at the Corner Bakery (Lvl 3)':''}. Tap <b style={{ color:'#f2c14e' }}>↩</b> to return a helper to the case anytime.</Body>
        </Panel>
        <div style={{ flex:1, display:'flex', gap:12, minHeight:0 }}>
          <Panel style={{ flex:1, padding:14 }}>
            <Title size={11} style={{ marginBottom:10 }}>YOUR HELPERS ({st.helpers.length}/{cap}) · batch {batchSize(st)}</Title>
            <div style={{ display:'flex', gap:14, flexWrap:'wrap' }}>
              {st.helpers.length===0 && <Body size={18} color="#a9783f" style={{ flexBasis:'100%' }}>No helpers yet. Adopt one from your case →</Body>}
              {st.helpers.map(h=>{
                const caseFull = st.caseItems.length >= derived.caseCap;
                return (
                <div key={h.uid} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
                  <Well style={{ width:96, height:96, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:2, position:'relative' }} bg="#f4e4c1">
                    {h.jammy && <Pill color="#a83b63" fg="#ffe9f0" style={{ position:'absolute', top:3, right:3, fontSize:10 }}>♥</Pill>}
                    <PixelPastry type={h.art} cell={4} />
                    <Body size={13} color="#7c5325">{RECIPES[h.type].name}</Body>
                  </Well>
                  <button disabled={caseFull} title={caseFull?'Sales case is full':'Move back into the sales case'}
                    onClick={()=>{ if(caseFull){ window.SFX && SFX.denied(); } else { window.SFX && SFX.back(); } api.returnHelper(h.uid); toast(caseFull?'Case full!':'Returned to the case'); }}
                    style={{ cursor:caseFull?'not-allowed':'pointer', opacity:caseFull?0.5:1, border:'2px solid #7c5325', background:'#e9d3a6', color:'#5a3a1c', fontFamily:"'VT323',monospace", fontSize:14, padding:'2px 8px', whiteSpace:'nowrap' }}>
                    ↩ to stock
                  </button>
                </div>
              );})}
              {/* locked future slots when the venue is still too small */}
              {moreSpaceComing && Array.from({length: 4-Math.max(cap, st.helpers.length)}).map((_,i)=>(
                <div key={'lock'+i} style={{ width:96, height:124, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:6,
                  border:'3px dashed #b89a6a', background:'rgba(124,83,37,0.06)', color:'#a9783f', textAlign:'center', padding:6 }}>
                  <div style={{ fontSize:22 }}>🔒</div>
                  <Body size={12} color="#a9783f" style={{ lineHeight:1.05 }}>Opens at the Corner Bakery (Lvl 3)</Body>
                </div>
              ))}
            </div>
          </Panel>
          <Panel style={{ flex:1, padding:14 }}>
            <Title size={11} style={{ marginBottom:10 }}>ADOPT FROM CASE</Title>
            <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
              {st.caseItems.length===0 && <Body size={18} color="#a9783f">Your case is empty. Bake something first!</Body>}
              {st.caseItems.map(it=>{
                const c = adoptCost(it);
                const blocked = st.helpers.length>=cap || st.bleps<c;
                return (
                <button key={it.uid} disabled={blocked} onClick={()=>{ api.adoptFromCase(it.uid); window.SFX && it.type!=='cinnamonroll' && SFX.adopt(); toast(it.type==='cinnamonroll'?'💖':`Adopted! −${c} bleps`); }}
                  style={{ cursor:blocked?'not-allowed':'pointer', background:'none', border:'none', padding:0, opacity:blocked?0.5:1 }}>
                  <Well style={{ width:96, height:96, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:1, position:'relative' }} bg="#f4e4c1">
                    {it.jammy && <Pill color="#a83b63" fg="#ffe9f0" style={{ position:'absolute', top:3, right:3, fontSize:10 }}>♥</Pill>}
                    <PixelPastry type={it.art} cell={3.4} />
                    <Body size={13} color="#c14b56" style={{ whiteSpace:'nowrap', lineHeight:1 }}>adopt ♥</Body>
                    <Body size={12} color="#7c5325" style={{ whiteSpace:'nowrap', lineHeight:1 }}><Blep size={10} /> {c}</Body>
                  </Well>
                </button>
              );})}
            </div>
          </Panel>
        </div>
      </div>
    </SubShell>
  );
}

/* ---------- QUESTS LOG ---------- */
function QuestsScreen() {
  const { st, api, nav, toast, derived } = React.useContext(GameCtx);
  const canFulfill = (id) => {
    const q = QUESTS[id]; const r = q.require;
    if (r.pastry && st.caseItems.filter(p=>p.type===r.pastry).length < r.qty) return false;
    if (r.ingredient && (st.inv[r.ingredient]||0) < r.iqty) return false;
    if (r.critBake && !(st.critBakes && st.critBakes[r.critBake])) return false;
    return true;
  };
  return (
    <SubShell title="SPECIAL ORDERS" nav={nav}>
      <Well style={{ height:'100%', padding:14, display:'flex', flexDirection:'column', gap:12, overflow:'auto' }} bg="#e9d3a6">
        {derived.level>=5 && !st.won && (
          <Panel style={{ padding:14, display:'flex', gap:14, alignItems:'center', border:'3px solid #c14b56' }}>
            <div style={{ flexShrink:0 }}><PixelPastry type="cinnamon" cell={3.1} /></div>
            <div style={{ flex:1, minWidth:0 }}>
              <Title size={12} color="#c14b56" style={{ marginBottom:8 }}>★ THE ROAD TO THE CINNAMON ROLL CAT</Title>
              <FinaleChecklist fin={derived.finale} />
              <Body size={15} color="#7c5325" style={{ marginTop:8, lineHeight:1.1 }}>{derived.finale.ready
                ? 'The town pitched in! The Golden Cinnamon now waits in the Grocery delivery cart — bake the legend, then adopt it to win.'
                : 'Finish every step and the whole town will fund your Golden Cinnamon — the last ingredient for the finale.'}</Body>
            </div>
          </Panel>
        )}
        {Object.values(QUESTS).map(q => {
          const status = st.quests[q.id]; const giver = CHARACTERS[q.giver];
          const acc = { duchess:'tiara', whiskerton:'monocle', mayor:'tiara', gateau:'chefhat' }[q.giver];
          return (
            <Panel key={q.id} style={{ padding:14, display:'flex', gap:14, alignItems:'center', opacity:status==='locked'?0.7:1 }}>
              <CatFace id={giver.id} breed={giver.cat} size={64} accessory={acc} />
              <div style={{ flex:1 }}>
                <Title size={11} color="#c14b56">{q.title}</Title>
                <Body size={16} color="#7c5325" style={{ margin:'3px 0' }}>from {giver.name}</Body>
                {q.story && <Body size={15} color="#a9783f" style={{ fontStyle:'italic', lineHeight:1.05, marginBottom:4 }}>{q.story}</Body>}
                <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginTop:4 }}>
                  {reqTextX(q).map((t,i)=><Pill key={i} color="#caa06a" fg="#3c2614">{t}</Pill>)}
                  <Pill color="#2b2823" fg="#f2c14e"><span style={{ display:'inline-flex', alignItems:'center', gap:3 }}><Blep size={11} />{q.reward.bleps}</span></Pill>
                  <Pill color="#6fbf9a" fg="#16352a">+{q.reward.rep} rep</Pill>
                </div>
              </div>
              <div style={{ width:130, textAlign:'center' }}>
                {status==='locked' && <Pill color="#5a3a1c">🔒 Not yet</Pill>}
                {status==='available' && <Body size={16} color="#a9783f">Visit Customers to accept</Body>}
                {status==='active' && <Btn variant={canFulfill(q.id)?'green':'wood'} disabled={!canFulfill(q.id)} onClick={()=>{ api.fulfillQuest(q.id); window.SFX && SFX.questDone(); toast(`Quest complete! +${q.reward.bleps} bleps, +${q.reward.rep} rep`); }} style={{ fontSize:9 }}>{canFulfill(q.id)?'FULFILL':'NEED ITEMS'}</Btn>}
                {status==='done' && <Pill color="#6fbf9a" fg="#16352a">★ COMPLETE</Pill>}
              </div>
            </Panel>
          );
        })}
      </Well>
    </SubShell>
  );
}

/* ---------- WIN + HALL OF FAME ---------- */
function WinScreen() {
  const { st, api, toTitle } = React.useContext(GameCtx);
  const [name, setName] = React.useState('');
  const [scores, setScores] = React.useState(() => loadHighScores());
  const [recorded, setRecorded] = React.useState(false);
  const [myTs, setMyTs] = React.useState(0);
  const confetti = React.useMemo(()=>Array.from({length:46},(_,i)=>({
    id:i, x:Math.random()*100, d:2.4+Math.random()*3, delay:Math.random()*3,
    c:['#f2c14e','#c14b56','#6fbf9a','#f2a9b8','#fbf1dc'][i%5], s:6+Math.random()*8 })),[]);

  const record = () => {
    const ts = Date.now();
    const entry = { name:(name.trim()||'ANONYMOUS CAT').slice(0,14).toUpperCase(), rep:st.rep, sold:st.session.sold, helpers:st.helpers.length, ts };
    setScores(saveHighScore(entry)); setMyTs(ts); setRecorded(true);
    window.SFX && SFX.questDone && SFX.questDone();
  };
  const playAgain = () => { api.newGame(); window.SFX && SFX.buy && SFX.buy(); toTitle(); };

  return (
    <div style={{ position:'absolute', inset:0, background:'#3c2614', overflow:'hidden' }}>
      <div style={{ position:'absolute', inset:0, background:'#4a2f1a' }} className="dither" />
      {confetti.map(c=>(
        <div key={c.id} style={{ position:'absolute', left:`${c.x}%`, top:-20, width:c.s, height:c.s, background:c.c,
          animation:`confetti ${c.d}s steps(12) ${c.delay}s infinite`, border:'1px solid rgba(0,0,0,.2)' }} />
      ))}
      <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', gap:26, zIndex:3, padding:'18px 34px' }}>
        {/* LEFT — spinning trophy + title + stats */}
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:8, flexShrink:0, width:262 }}>
          <Title size={9} color="#f2a9b8">· you did it, baker ·</Title>
          <div style={{ position:'relative', margin:'6px 0 4px' }}>
            <div style={{ position:'absolute', inset:-14, border:'4px dashed #f2c14e', borderRadius:'50%', animation:'spin 8s linear infinite' }} />
            <div style={{ transform:'scale(1.05)', animation:'trophybob 3s steps(6) infinite' }}><PixelPastry type="cinnamon" cell={5} /></div>
          </div>
          <Title size={17} color="#f2c14e" style={{ textShadow:'3px 3px 0 #c14b56', lineHeight:1.3, textAlign:'center' }}>THE CINNAMON<br/>ROLL CAT</Title>
          <Bubble point="left" style={{ fontSize:14, flexShrink:0, marginTop:4 }}>
            From an alley garage to a grand city pâtisserie — your bakery is complete, and the Cinnamon Roll Cat chose <i>you.</i>
          </Bubble>
          <div style={{ display:'flex', gap:18, marginTop:2 }}>
            <div style={{ textAlign:'center' }}><Title size={14} color="#fff4e0">{st.session.sold}</Title><Body size={13} color="#caa06a">sold</Body></div>
            <div style={{ textAlign:'center' }}><Title size={14} color="#fff4e0">{st.rep}</Title><Body size={13} color="#caa06a">rep</Body></div>
            <div style={{ textAlign:'center' }}><Title size={14} color="#fff4e0">{st.helpers.length}</Title><Body size={13} color="#caa06a">helpers</Body></div>
          </div>
        </div>

        {/* RIGHT — Hall of Fame */}
        <Panel tone="cream" style={{ width:418, padding:'14px 16px', display:'flex', flexDirection:'column', gap:10, alignSelf:'stretch', maxHeight:'100%' }}>
          <Title size={13} color="#3c2614" style={{ textAlign:'center', textShadow:'2px 2px 0 #f2c14e' }}>★ HALL OF FAME ★</Title>

          {!recorded ? (
            <div style={{ display:'flex', flexDirection:'column', gap:7 }}>
              <Body size={16} color="#7c5325" style={{ textAlign:'center', lineHeight:1.05 }}>Carve your name into the bakery ledger:</Body>
              <div style={{ display:'flex', gap:8 }}>
                <input value={name} maxLength={14} autoFocus
                  onChange={e=>setName(e.target.value)}
                  onKeyDown={e=>{ if(e.key==='Enter') record(); }}
                  placeholder="YOUR NAME"
                  style={{ flex:1, minWidth:0, fontFamily:"'VT323',monospace", fontSize:22, textTransform:'uppercase', color:'#3c2614',
                    background:'#fbf1dc', border:'3px solid #7c5325', boxShadow:'inset 2px 2px 0 #d8c39a', padding:'6px 10px', outline:'none' }} />
                <Btn variant="gold" onClick={record}>RECORD ▸</Btn>
              </div>
            </div>
          ) : (
            <Body size={15} color="#4d9678" style={{ textAlign:'center' }}>✓ Recorded! You&apos;re in the books forever.</Body>
          )}

          <Well style={{ flex:1, minHeight:120, padding:'8px 6px', overflowY:'auto' }} bg="#e9d3a6">
            {scores.length===0 ? (
              <Body size={16} color="#a9783f" style={{ textAlign:'center', padding:'14px 0' }}>No legends yet — you&apos;re the first!</Body>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:3 }}>
                {/* header row */}
                <div style={{ display:'flex', alignItems:'center', gap:8, padding:'0 8px 2px' }}>
                  <Body size={13} color="#a9783f" style={{ width:24 }}>#</Body>
                  <Body size={13} color="#a9783f" style={{ flex:1 }}>BAKER</Body>
                  <Body size={13} color="#a9783f" style={{ width:54, textAlign:'right' }}>REP</Body>
                  <Body size={13} color="#a9783f" style={{ width:48, textAlign:'right' }}>SOLD</Body>
                </div>
                {scores.map((s,i)=>{
                  const mine = s.ts===myTs;
                  return (
                    <div key={s.ts+'-'+i} style={{ display:'flex', alignItems:'center', gap:8, padding:'4px 8px',
                      background: mine?'#f2c14e':(i%2?'#f4e4c1':'transparent'),
                      border: mine?'2px solid #c14b56':'2px solid transparent' }}>
                      <Body size={17} color={i===0?'#c14b56':'#7c5325'} style={{ width:24, fontWeight:'bold' }}>{i+1}</Body>
                      <Body size={17} color="#3c2614" style={{ flex:1, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{s.name}{i===0?' 👑':''}</Body>
                      <Body size={17} color="#3c2614" style={{ width:54, textAlign:'right' }}>{s.rep}</Body>
                      <Body size={17} color="#7c5325" style={{ width:48, textAlign:'right' }}>{s.sold}</Body>
                    </div>
                  );
                })}
              </div>
            )}
          </Well>

          <Btn variant="gold" big onClick={playAgain} style={{ width:'100%' }}>★ PLAY AGAIN ★</Btn>
        </Panel>
      </div>
    </div>
  );
}

Object.assign(window, { RecipesScreen, UpgradesScreen, AdoptScreen, QuestsScreen, WinScreen });
