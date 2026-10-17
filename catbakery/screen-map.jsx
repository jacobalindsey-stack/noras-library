/* ============================================================
   screen-map.jsx — "Your Bakery Journey": the premises climb
   from a humble Alley Garage up to a Big City Pâtisserie.
   ============================================================ */

const JOURNEY_NODES = [
  { n:1, x:96,  y:236 },
  { n:2, x:276, y:200 },
  { n:3, x:452, y:166 },
  { n:4, x:628, y:134 },
  { n:5, x:792, y:110 },
];

function Stair({ a, b, on }) {
  const midx = b.x;
  return (
    <React.Fragment>
      <div style={{ position:'absolute', left:Math.min(a.x,b.x), top:a.y+30, width:Math.abs(b.x-a.x), height:6, background:on?'#d99a35':'#9a795a', border:'2px solid #3c2614', borderLeft:'none', borderRight:'none' }} />
      <div style={{ position:'absolute', left:midx-1, top:Math.min(a.y,b.y)+30, width:6, height:Math.abs(b.y-a.y), background:on?'#d99a35':'#9a795a', border:'2px solid #3c2614', borderTop:'none', borderBottom:'none' }} />
    </React.Fragment>
  );
}

function MapScreen() {
  const { st, derived, nav } = React.useContext(GameCtx);
  const lvl = derived.level;
  const venue = venueForLevel(lvl);
  const next = lvl < 5 ? VENUES[lvl] : null;
  const totalRecipes = RECIPE_ORDER.length;
  const totalChars = Object.keys(CHARACTERS).length;

  return (
    <div style={{ position:'absolute', inset:0, background:'#cfe2ec', overflow:'hidden' }}>
      {/* sky + ground */}
      <div style={{ position:'absolute', inset:0, background:'#bcd7e4' }} className="dither" />
      <div style={{ position:'absolute', left:0, right:0, bottom:0, height:200, background:'#cdb079' }} className="dither" />
      <div style={{ position:'absolute', left:0, right:0, bottom:200, height:4, background:'#a9783f' }} />
      {/* drifting clouds */}
      {[[80,46,60],[360,30,80],[600,58,52],[770,38,70]].map((c,i)=>(
        <div key={i} style={{ position:'absolute', left:c[0], top:c[1], width:c[2], height:c[2]*0.5, background:'#eaf3f8', border:'3px solid #a9c6d4', borderRadius:'50%' }} />
      ))}

      {/* header */}
      <div style={{ position:'absolute', left:0, right:0, top:14, display:'flex', justifyContent:'center', zIndex:6 }}>
        <Panel tone="wood" style={{ padding:'8px 24px' }}><Title size={15} color="#fff4e0">🐾 YOUR BAKERY JOURNEY 🐾</Title></Panel>
      </div>
      <div style={{ position:'absolute', right:14, top:16, zIndex:7 }}>
        <Btn variant="cream" onClick={()=>nav('bakery')} style={{ fontSize:10 }}>← BAKERY</Btn>
      </div>

      {/* the climbing path of premises */}
      <div style={{ position:'absolute', left:0, top:48, right:0, height:320, zIndex:3 }}>
        {JOURNEY_NODES.slice(0,-1).map((nd,i)=><Stair key={i} a={nd} b={JOURNEY_NODES[i+1]} on={lvl>nd.n} />)}
        {JOURNEY_NODES.map(nd => {
          const v = VENUES[nd.n-1];
          const unlocked = lvl >= nd.n;
          const done = lvl > nd.n;
          const here = lvl === nd.n;
          const size = 58 + nd.n*7;
          return (
            <div key={nd.n} style={{ position:'absolute', left:nd.x - size/2, top:nd.y - size, width:size, display:'flex', flexDirection:'column', alignItems:'center' }}>
              {here && <div style={{ marginBottom:2, animation:'nodepulse 1.1s steps(2) infinite' }}><Pill color={v.theme.accent} fg="#fff">YOU ARE HERE</Pill></div>}
              <div style={{ animation: here?'nodepulse 1.4s steps(2) infinite':'none' }}>
                <Building id={v.id} size={size} dim={!unlocked} />
              </div>
              <div style={{ marginTop:4, background: here?'#fbf1dc':'#e9d3a6', border:`3px solid ${here?v.theme.accent:'#5a3a1c'}`, padding:'3px 8px', boxShadow:'2px 2px 0 #3c2614', textAlign:'center', minWidth:size+20 }}>
                <Title size={8} color="#3c2614" style={{ lineHeight:1.3 }}>{v.name}</Title>
              </div>
              <div style={{ marginTop:3 }}>
                {done ? <Pill color="#6fbf9a" fg="#16352a" style={{ fontSize:11 }}>★ DONE</Pill>
                  : here ? <Pill color="#2b2823" fg="#f2c14e" style={{ fontSize:11 }}>Lv {nd.n}</Pill>
                  : <Pill color="#5a3a1c" style={{ fontSize:11 }}>🔒 Lv {nd.n}</Pill>}
              </div>
            </div>
          );
        })}
      </div>

      {/* bottom: current premises + progress + goal */}
      <div style={{ position:'absolute', left:14, right:14, bottom:14, height:150, zIndex:6, display:'flex', gap:12 }}>
        <Panel style={{ flex:1.1, padding:'12px 16px', display:'flex', flexDirection:'column', justifyContent:'center', gap:6 }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <Building id={venue.id} size={42} />
            <div>
              <Title size={11} color="#3c2614">{venue.name}</Title>
              <Body size={15} color="#a9783f">{venue.type}</Body>
            </div>
          </div>
          <Body size={16} color="#7c5325" style={{ lineHeight:1.05 }}>{venue.tagline}</Body>
          <RepBar band={derived.band} />
        </Panel>
        <Panel style={{ flex:0.85, padding:'12px 16px', display:'flex', flexDirection:'column', justifyContent:'center', gap:9 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', gap:8 }}><Body size={16} style={{ whiteSpace:'nowrap' }}>Recipes</Body><Body size={16} color="#3c2614" style={{ fontWeight:'bold', whiteSpace:'nowrap' }}>{derived.unlockedRecipes.length} / {totalRecipes}</Body></div>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', gap:8 }}><Body size={16} style={{ whiteSpace:'nowrap' }}>Customers Met</Body><Body size={16} color="#3c2614" style={{ fontWeight:'bold', whiteSpace:'nowrap' }}>{st.metCustomers.length} / {totalChars}</Body></div>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', gap:8 }}><Body size={16} style={{ whiteSpace:'nowrap' }}>Helpers</Body><Body size={16} color="#3c2614" style={{ fontWeight:'bold', whiteSpace:'nowrap' }}>{st.helpers.length} / {derived.helperCap}</Body></div>
        </Panel>
        <Panel tone="dark" style={{ flex:1.05, padding:'12px 16px', display:'flex', flexDirection:'column', justifyContent:'center', gap:5 }}>
          {next ? <React.Fragment>
            <Title size={10} color="#f2c14e">NEXT UPGRADE</Title>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <Building id={next.id} size={36} dim />
              <Body size={17} color="#f0e7d2" style={{ lineHeight:1.05 }}>Reach Level {next.n} to move into the <b style={{ color:'#fff4e0' }}>{next.name}</b>!</Body>
            </div>
          </React.Fragment> : <React.Fragment>
            <Title size={10} color="#f2c14e">FINAL DREAM</Title>
            <Body size={17} color="#f0e7d2" style={{ lineHeight:1.1 }}>You&apos;ve made it to the big city! Bake & adopt the legendary Cinnamon Roll Cat to complete your story.</Body>
          </React.Fragment>}
        </Panel>
      </div>
    </div>
  );
}

Object.assign(window, { MapScreen });
