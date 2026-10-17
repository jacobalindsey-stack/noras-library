/* ============================================================
   app.jsx — router, scale-to-fit stage, intro, toasts, win watch
   ============================================================ */
const BASE_W = 960, BASE_H = 540;

function useScale(ref) {
  const [scale, setScale] = React.useState(1);
  React.useEffect(() => {
    const fit = () => {
      const el = ref && ref.current;
      const w = el ? el.clientWidth  : window.innerWidth;
      const h = el ? el.clientHeight : window.innerHeight;
      setScale(Math.min(w/BASE_W, h/BASE_H));
    };
    fit();
    // ResizeObserver tracks the stage box smoothly across iOS URL-bar show/hide
    let ro;
    if (window.ResizeObserver && ref && ref.current) { ro = new ResizeObserver(fit); ro.observe(ref.current); }
    window.addEventListener('resize', fit);
    window.addEventListener('orientationchange', fit);
    if (window.visualViewport) window.visualViewport.addEventListener('resize', fit);
    return () => {
      if (ro) ro.disconnect();
      window.removeEventListener('resize', fit);
      window.removeEventListener('orientationchange', fit);
      if (window.visualViewport) window.visualViewport.removeEventListener('resize', fit);
    };
  }, [ref]);
  return scale;
}

/* ---------- Intro / title ---------- */
/* Intro lives in screen-intro.jsx (animated dusk-city title screen). */

function Game() {
  const store = useGameStore();
  const { st, api, derived } = store;
  const [screen, setScreen] = React.useState('bakery');
  const [intro, setIntro] = React.useState(!st.seenIntro);
  const [toasts, setToasts] = React.useState([]);
  const [paused, setPaused] = React.useState(false);
  const [upgrade, setUpgrade] = React.useState(null);
  const tid = React.useRef(0);

  const toast = React.useCallback((msg, bad=false) => {
    const id = ++tid.current;
    setToasts(t => [...t, { id, msg, bad }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 1900);
  }, []);

  const nav = React.useCallback((s) => setScreen(s), []);

  // watch for win
  React.useEffect(() => { if (st.won) { window.SFX && SFX.win(); setScreen('win'); } }, [st.won]);

  // level-up = a venue upgrade: show the Grand Opening splash
  const prevLvl = React.useRef(derived.level);
  React.useEffect(() => {
    if (derived.level > prevLvl.current) {
      prevLvl.current = derived.level;
      if (!intro) { window.SFX && SFX.levelUp(); setUpgrade(venueForLevel(derived.level)); }
    }
  }, [derived.level, intro]);

  const toTitle = React.useCallback(() => { setScreen('bakery'); setIntro(true); }, []);
  const ctx = { ...store, nav, toast, openMenu: () => setPaused(true), toTitle };

  if (intro) return (
    <GameCtx.Provider value={ctx}>
      <Intro hasSave={st.seenIntro || st.rep>0 || st.session.sold>0}
        onStart={(isNew) => { if (isNew) api.newGame(); api.markIntroSeen(); setIntro(false); setScreen('bakery'); }} />
    </GameCtx.Provider>
  );

  const SCREENS = {
    bakery: BakeryScreen, shop: ShopScreen, customers: CustomersScreen,
    bake: BakeScreen, map: MapScreen, recipes: RecipesScreen,
    upgrades: UpgradesScreen, adopt: AdoptScreen, quests: QuestsScreen, win: WinScreen,
  };
  const Active = SCREENS[screen] || BakeryScreen;

  return (
    <GameCtx.Provider value={ctx}>
      <Active />
      <Toasts items={toasts} />
      {paused && <PauseMenu st={st}
        onResume={()=>setPaused(false)}
        onQuit={()=>{ setPaused(false); setScreen('bakery'); setIntro(true); }}
        onNew={()=>{ api.newGame(); setPaused(false); setScreen('bakery'); }} />}
      {upgrade && <UpgradeSplash venue={upgrade} onClose={()=>{ setUpgrade(null); setScreen('bakery'); }} onJourney={()=>{ setUpgrade(null); setScreen('map'); }} />}
    </GameCtx.Provider>
  );
}

/* ---------- Grand Opening / venue upgrade splash ---------- */
function UpgradeSplash({ venue, onClose, onJourney }) {
  const confetti = React.useMemo(()=>Array.from({length:38},(_,i)=>({
    id:i, x:Math.random()*100, d:2.2+Math.random()*2.6, delay:Math.random()*2.2,
    c:[venue.theme.accent,'#f2c14e','#6fbf9a','#f2a9b8','#fbf1dc'][i%5], s:6+Math.random()*8 })),[venue]);
  return (
    <div style={{ position:'absolute', inset:0, zIndex:90, background:'rgba(28,17,9,0.8)', display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden' }}>
      {confetti.map(c=>(
        <div key={c.id} style={{ position:'absolute', left:`${c.x}%`, top:-20, width:c.s, height:c.s, background:c.c,
          animation:`confetti ${c.d}s steps(12) ${c.delay}s infinite`, border:'1px solid rgba(0,0,0,.2)' }} />
      ))}
      <Panel tone="cream" style={{ width:520, padding:'22px 26px', display:'flex', flexDirection:'column', alignItems:'center', gap:12, position:'relative' }}>
        <Title size={11} color={venue.theme.accent} style={{ letterSpacing:1 }}>· YOU&apos;VE MOVED UP IN THE WORLD ·</Title>
        <Title size={20} color="#3c2614" style={{ textShadow:`3px 3px 0 ${venue.theme.accent}` }}>GRAND OPENING</Title>
        <div style={{ position:'relative', margin:'2px 0' }}>
          <div style={{ background:venue.theme.wall, border:'3px solid #3c2614', padding:'14px 26px', boxShadow:'4px 4px 0 #3c2614' }}>
            <Building id={venue.id} size={132} />
          </div>
          {/* NOW OPEN stamp */}
          <div style={{ position:'absolute', right:-22, bottom:-14, transform:'rotate(-12deg)', background:'#c14b56', color:'#fff0ef',
            border:'3px solid #5a1f25', boxShadow:'3px 3px 0 #3c2614', padding:'5px 12px', fontFamily:"'Press Start 2P',monospace", fontSize:12 }}>
            NOW OPEN!
          </div>
        </div>
        <Title size={16} color="#3c2614" style={{ marginTop:4 }}>{venue.name}</Title>
        <Body size={18} color="#a9783f" style={{ marginTop:-4 }}>{venue.type}</Body>
        <Body size={19} color="#5a3a1c" style={{ textAlign:'center', lineHeight:1.1, maxWidth:420 }}>{venue.tagline}</Body>
        <Panel tone="wood" style={{ padding:'8px 14px', width:'100%', textAlign:'center' }}>
          <Body size={15} color="#f8d97e" style={{ marginBottom:2 }}>NOW UNLOCKED</Body>
          <Body size={17} color="#fff4e0" style={{ lineHeight:1.05 }}>{venue.unlocks}</Body>
        </Panel>
        <div style={{ display:'flex', gap:10, marginTop:2 }}>
          <Btn variant="gold" big onClick={onClose}>▸ OPEN FOR BUSINESS</Btn>
          <Btn variant="cream" onClick={onJourney}>SEE JOURNEY</Btn>
        </div>
      </Panel>
    </div>
  );
}

/* ---------- Pause / Save menu ---------- */
function PauseMenu({ st, onResume, onQuit, onNew }) {
  // Two taps instead of window.confirm(): browsers in sandboxed frames (like a
  // Claude artifact) refuse confirm() dialogs, which left NEW GAME doing nothing.
  const [armed, setArmed] = React.useState(false);
  React.useEffect(() => { if (!armed) return; const t = setTimeout(() => setArmed(false), 4000); return () => clearTimeout(t); }, [armed]);
  return (
    <div onClick={onResume} style={{ position:'absolute', inset:0, zIndex:80, background:'rgba(28,17,9,0.72)', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div onClick={e=>e.stopPropagation()}>
        <Panel tone="cream" style={{ width:360, padding:24, display:'flex', flexDirection:'column', alignItems:'center', gap:14 }}>
          <Title size={18} color="#3c2614">PAUSED</Title>
          <Panel tone="wood" style={{ padding:'10px 14px', width:'100%', display:'flex', flexDirection:'column', alignItems:'center', gap:5 }}>
            <Body size={16} color="#fff4e0" style={{ textAlign:'center', lineHeight:1.05 }}>✓ Progress saves automatically</Body>
            <Body size={15} color="#f0e7d2" style={{ textAlign:'center' }}>Lv {levelFromRep(st.rep)} · {st.bleps} bleps · {st.rep} rep</Body>
          </Panel>
          <Btn variant="gold" big onClick={onResume} style={{ width:'100%' }}>▸ RESUME</Btn>
          <Btn variant="green" onClick={onQuit} style={{ width:'100%' }}>SAVE &amp; QUIT TO TITLE</Btn>
          <Btn variant="berry" onClick={() => { if (armed) onNew(); else setArmed(true); }} style={{ width:'100%' }}>{armed ? 'TAP AGAIN: ERASE BAKERY' : 'NEW GAME'}</Btn>
          <Body size={14} color="#7c5325" style={{ textAlign:'center', marginTop:2 }}>Quit any time — your bakery will be exactly as you left it.</Body>
        </Panel>
      </div>
    </div>
  );
}

function Root() {
  const stageRef = React.useRef(null);
  const scale = useScale(stageRef);
  return (
    <React.Fragment>
      <div className="rotate-warn">
        <div style={{ textAlign:'center' }}>
          <div style={{ fontSize:40, marginBottom:10 }}>📱↻</div>
          <Title size={14} color="#f2c14e">PLEASE ROTATE</Title>
          <Body size={20} color="#fbf1dc" style={{ marginTop:8 }}>The Cat Bakery is best in landscape!</Body>
        </div>
      </div>
      <div className="stage" ref={stageRef}>
        <div className="frame" style={{ width:BASE_W, height:BASE_H, transform:`scale(${scale})` }}>
          <Game />
        </div>
      </div>
    </React.Fragment>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<Root/>);
