/* ============================================================
   screen-shop.jsx — Screen 2: Grocery Shop (walk-in, no timer)
   ============================================================ */

function ToolIcon({ id, size=34 }) {
  const s=size; const out='#5a3a1c';
  const base={ position:'absolute', border:`2px solid ${out}` };
  const wrap={ position:'relative', width:s, height:s, display:'inline-block' };
  switch(id){
    case 'mixingBowl': return <span style={wrap}><span style={{ ...base, left:'14%', top:'40%', right:'14%', bottom:'14%', background:'#caa06a', borderRadius:'0 0 50% 50%' }} /><span style={{ ...base, left:'10%', top:'36%', right:'10%', height:'14%', background:'#e9d3a6', borderRadius:'40%' }} /></span>;
    case 'displayCase': return <span style={wrap}><span style={{ ...base, left:'12%', top:'24%', right:'12%', bottom:'16%', background:'#9ccadf' }} /><span style={{ position:'absolute', left:'12%', top:'46%', right:'12%', height:'2px', background:out }} /></span>;
    case 'pipingBag': return <span style={wrap}><span style={{ ...base, left:'24%', top:'14%', right:'24%', bottom:'30%', background:'#f4e4c1', borderRadius:'40% 40% 50% 50%' }} /><span style={{ ...base, left:'40%', top:'66%', right:'40%', bottom:'8%', background:'#caa06a' }} /></span>;
    case 'brickOven': return <span style={wrap}><span style={{ ...base, left:'10%', top:'20%', right:'10%', bottom:'12%', background:'#a9783f' }} /><span style={{ ...base, left:'28%', top:'40%', right:'28%', bottom:'12%', background:'#2b2823', borderRadius:'40% 40% 0 0' }} /><span style={{ position:'absolute', left:'10%', top:'34%', right:'10%', height:'2px', background:out }} /></span>;
    case 'cakePan': return <span style={wrap}><span style={{ ...base, left:'12%', top:'40%', right:'12%', bottom:'20%', background:'#caa06a', borderRadius:'14%' }} /><span style={{ position:'absolute', left:'0', top:'48%', width:'14%', height:'14%', border:`2px solid ${out}`, borderRadius:'50%' }} /><span style={{ position:'absolute', right:'0', top:'48%', width:'14%', height:'14%', border:`2px solid ${out}`, borderRadius:'50%' }} /></span>;
    case 'proofingOven': return <span style={wrap}><span style={{ ...base, left:'12%', top:'10%', right:'12%', bottom:'10%', background:'#7c5325' }} /><span style={{ ...base, left:'24%', top:'26%', right:'24%', bottom:'24%', background:'#f2c14e', borderRadius:'30% 30% 0 0' }} /><span style={{ position:'absolute', left:'38%', top:'72%', right:'38%', height:'8%', background:out }} /></span>;
    default: return <span style={wrap} />;
  }
}

function ItemCard({ children }) {
  return <Panel style={{ padding:8, display:'flex', flexDirection:'column', alignItems:'center', gap:5, width:90 }}>{children}</Panel>;
}

function ShopScreen() {
  const { st, api, derived, nav, toast } = React.useContext(GameCtx);
  const [tab, setTab] = React.useState('pantry');

  const greet = derived.level>=5
    ? "A Big City p\u00e2tissier shopping with little old me? I\u2019m honoured! Finest flour in the land, coming up."
    : derived.level>=4
    ? "Word is your bakeshop\u2019s the talk of the neighbourhood. The good flour\u2019s on the left, baker."
    : derived.level>=3
    ? "A real storefront now, eh? They grow up so fast. What\u2019ll it be?"
    : derived.level>=2
    ? "Heard you\u2019ve got a food truck rolling! Stock up \u2014 busy days ahead."
    : "Welcome, welcome! Every great bakery starts with one humble sack of flour.";

  // delivery cart: at the Big City it always teases the finale Golden Cinnamon;
  // before that, the best rare item currently available.
  const rareOrder = ['frosting','jam'];
  const cart = derived.level>=5 ? 'cinnamon' : (rareOrder.find(id => ingredientUnlocked(st,id)) || 'jam');
  const cartG = INGREDIENTS[cart];
  const cartLocked = !ingredientUnlocked(st, cart);
  const fin = derived.finale;
  const finDone = fin.items.filter(i=>i.done).length;

  return (
    <div style={{ position:'absolute', inset:0, background:'#caa06a', overflow:'hidden' }}>
      <div style={{ position:'absolute', inset:0, background:'#b88f5a' }} className="dither" />
      {/* shelves backdrop */}
      <div style={{ position:'absolute', left:0, right:0, top:0, height:118, background:'#7c5325', borderBottom:'4px solid #3c2614' }} className="dither-strong" />

      {/* header: Marmalade + greeting */}
      <div style={{ position:'absolute', left:14, top:12, right:14, display:'flex', alignItems:'flex-start', gap:12, zIndex:3 }}>
        <CatFace id="marmalade" breed="orange" size={84} />
        <div style={{ flex:1, position:'relative' }}>
          <Bubble style={{ maxWidth:430, fontSize:19 }}>{greet}</Bubble>
          <Body size={15} color="#f0e7d2" style={{ marginTop:14, marginLeft:4 }}>— Marmalade, shopkeeper</Body>
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap:8, alignItems:'flex-end' }}>
          <Panel tone="dark" style={{ padding:'7px 14px', display:'flex', alignItems:'center', gap:8 }}>
            <Blep size={20} /><Title size={15} color="#f2c14e">{st.bleps}</Title>
          </Panel>
          <Btn variant="cream" onClick={()=>nav('bakery')} style={{ fontSize:10 }}>← BAKERY</Btn>
        </div>
      </div>

      {/* tabs */}
      <div style={{ position:'absolute', left:14, top:142, display:'flex', gap:6, zIndex:4 }}>
        <Btn variant={tab==='pantry'?'gold':'wood'} onClick={()=>setTab('pantry')} style={{ fontSize:11 }}>PANTRY</Btn>
        <Btn variant={tab==='tools'?'gold':'wood'} onClick={()=>setTab('tools')} style={{ fontSize:11 }}>TOOLS</Btn>
      </div>

      {/* main grid */}
      <div style={{ position:'absolute', left:14, top:188, right:226, bottom:70, zIndex:3 }}>
        <Well style={{ height:'100%', padding:14, display:'flex', gap:8, flexWrap:'wrap', alignContent:'flex-start', overflowY:'auto', overflowX:'hidden' }} bg="#e9d3a6">
          {tab==='pantry' && [...COMMON_ING, ...['jam','frosting'].filter(id=>ingredientUnlocked(st,id))].map(id => {
            const g = INGREDIENTS[id]; const afford = st.bleps>=g.price;
            return (
              <ItemCard key={id}>
                <Ing id={id} size={36} />
                <Title size={9} style={{ textAlign:'center', lineHeight:1.15 }}>{g.name}</Title>
                {g.rare && <Body size={12} color="#a83b63" style={{ textAlign:'center', lineHeight:1 }}>{id==='jam'?'premium fill':'cake topping'}</Body>}
                <Body size={15} color="#7c5325">own: {st.inv[id]||0}</Body>
                <Btn variant={afford?'green':'wood'} disabled={!afford} onClick={()=>{ api.buyIngredient(id); window.SFX && SFX.buy(); toast(`+1 ${g.name}`); }} style={{ fontSize:9, padding:'7px 10px', minHeight:0, width:'100%' }}>
                  <span style={{ display:'inline-flex', alignItems:'center', gap:4 }}><Blep size={13} />{g.price}</span>
                </Btn>
              </ItemCard>
            );
          })}
          {tab==='tools' && TOOL_ORDER.map(id => {
            const t = TOOLS[id]; const owned = st.tools.includes(id);
            const locked = derived.level < t.level; const afford = st.bleps>=t.price;
            return (
              <Panel key={id} style={{ padding:10, display:'flex', flexDirection:'column', alignItems:'center', gap:5, width:128, opacity:locked?0.7:1 }}>
                <ToolIcon id={id} size={38} />
                <Title size={9} style={{ textAlign:'center', minHeight:24 }}>{t.name}</Title>
                <Body size={14} color="#7c5325" style={{ textAlign:'center', minHeight:34, lineHeight:1.05 }}>{t.desc}</Body>
                {owned ? <Pill color="#6fbf9a" fg="#16352a">OWNED</Pill>
                  : locked ? <Pill color="#5a3a1c">🔒 Level {t.level}</Pill>
                  : <Btn variant={afford?'gold':'wood'} disabled={!afford} onClick={()=>{ api.buyTool(id); window.SFX && SFX.buy(); toast(`Bought ${t.name}!`); }} style={{ fontSize:9, padding:'7px 10px', minHeight:0, width:'100%' }}>
                      <span style={{ display:'inline-flex', alignItems:'center', gap:4 }}><Blep size={13} />{t.price}</span>
                    </Btn>}
              </Panel>
            );
          })}
        </Well>
      </div>

      {/* Delivery Cart */}
      <div style={{ position:'absolute', right:14, top:188, width:200, bottom:70, zIndex:3 }}>
        <Panel tone="wood" style={{ height:'100%', padding:12, display:'flex', flexDirection:'column', alignItems:'center', gap:7, overflowY:'auto' }}>
          {cart==='cinnamon' ? (
            <React.Fragment>
              <Pill color="#c14b56" style={{ fontSize:13 }}>★ THE FINALE ★</Pill>
              <Well style={{ width:60, height:60, display:'flex', alignItems:'center', justifyContent:'center', position:'relative' }} bg="#f4e4c1">
                <div style={{ filter: cartLocked?'grayscale(.55) brightness(.9)':'none' }}><Ing id="cinnamon" size={38} /></div>
                {cartLocked && <div style={{ position:'absolute', right:-4, bottom:-4, fontSize:14 }}>🔒</div>}
              </Well>
              <Title size={10} color="#f8d97e" style={{ textAlign:'center' }}>Golden Cinnamon</Title>
              {cartLocked ? (
                <React.Fragment>
                  <Body size={13} color="#fff4e0" style={{ textAlign:'center', lineHeight:1.05 }}>Funded by the town once you&apos;ve earned it ({finDone}/4):</Body>
                  <FinaleChecklist fin={fin} mini />
                </React.Fragment>
              ) : (
                <React.Fragment>
                  <Body size={14} color="#9ad9bd" style={{ textAlign:'center', lineHeight:1.05 }}>The whole city pitched in — claim your Golden Cinnamon!</Body>
                  <Body size={15} color="#fff4e0">own: {st.inv.cinnamon||0}</Body>
                  <Btn variant={st.bleps>=cartG.price?'berry':'cream'} disabled={st.bleps<cartG.price} onClick={()=>{ api.buyIngredient('cinnamon'); window.SFX && SFX.buy(); toast('+1 Golden Cinnamon!'); }} style={{ fontSize:10, width:'100%' }}>
                    <span style={{ display:'inline-flex', alignItems:'center', gap:4 }}><Blep size={14} />{cartG.price}</span>
                  </Btn>
                </React.Fragment>
              )}
            </React.Fragment>
          ) : (
            <React.Fragment>
              <Pill color="#c14b56" style={{ fontSize:13 }}>★ DELIVERY ★</Pill>
              <Body size={14} color="#fff4e0" style={{ textAlign:'center' }}>Today&apos;s special:</Body>
              <Well style={{ width:96, height:96, display:'flex', alignItems:'center', justifyContent:'center' }} bg="#f4e4c1">
                <Ing id={cart} size={56} />
              </Well>
              <Title size={10} color="#fff4e0" style={{ textAlign:'center' }}>{cartG.name}</Title>
              {cartLocked
                ? <Body size={15} color="#f8d97e" style={{ textAlign:'center' }}>Arrives at Level {cartG.unlockLevel}</Body>
                : <React.Fragment>
                    <Body size={15} color="#fff4e0">own: {st.inv[cart]||0}</Body>
                    <Btn variant={st.bleps>=cartG.price?'berry':'cream'} disabled={st.bleps<cartG.price} onClick={()=>{ api.buyIngredient(cart); window.SFX && SFX.buy(); toast(`+1 ${cartG.name}!`); }} style={{ fontSize:10, width:'100%' }}>
                      <span style={{ display:'inline-flex', alignItems:'center', gap:4 }}><Blep size={14} />{cartG.price}</span>
                    </Btn>
                  </React.Fragment>}
            </React.Fragment>
          )}
        </Panel>
      </div>

      {/* inventory strip */}
      <div style={{ position:'absolute', left:14, right:14, bottom:10, height:50, zIndex:4 }}>
        <Panel tone="dark" style={{ height:'100%', padding:'6px 14px', display:'flex', alignItems:'center', gap:16 }}>
          <Title size={10} color="#f0e7d2">PANTRY</Title>
          <div style={{ display:'flex', gap:14, flex:1, flexWrap:'wrap' }}>
            {[...COMMON_ING, ...rareOrder].filter(id=> (st.inv[id]||0)>0 || COMMON_ING.includes(id)).map(id=>(
              <div key={id} style={{ display:'flex', alignItems:'center', gap:4 }}>
                <Ing id={id} size={24} /><Body size={16} color="#f0e7d2">×{st.inv[id]||0}</Body>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}

Object.assign(window, { ShopScreen, ToolIcon });
