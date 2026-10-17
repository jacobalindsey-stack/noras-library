// journey.jsx — paneled "trail-game" HUD: framed Status / Stores / Actions
const { useState: useStateJ, useEffect: useEffectJ, useRef: useRefJ } = React;

function Journey({ state, setState, onAdvance, onCamp, onWard, wardCost, wardRelief, onSaveQuit, savedAt, toasts, dayNight, setDayNight }){
  const { REGIONS } = window.WLData;
  const RATION_DRAIN = { Meager: 2, Standard: 4, Generous: 7 };
  const omenMods = window.WLData.combineOmens ? window.WLData.combineOmens(state.omens) : { provDrainMul:1 };
  const drain = Math.max(1, Math.round((RATION_DRAIN[state.ration] ?? 4) * (omenMods.provDrainMul || 1)));
  const region = REGIONS.find(r => r.id === state.region);
  const t = useTicker(true);

  const [cursor, setCursor] = useStateJ(0);
  const [rosterOpen, setRosterOpen] = useStateJ(false);
  const [muted, setMuted] = useStateJ(window.WLAudio ? window.WLAudio.isMuted() : false);

  const allBondsBroken = state.party.every(p => p.lost) && state.lead.lost;
  const canWard = state.lore >= (wardCost||18) && state.hollowing > 0;

  // Aggregate party bonds (averaged among alive)
  const alive = [state.lead, ...state.party].filter(p => !p.lost);
  const aliveCount = alive.length;
  const bondAvg = aliveCount ? Math.round(alive.reduce((a,p)=>a+p.bond,0) / aliveCount) : 0;
  const totalLeagues = 2000;
  const leaguePct = Math.min(100, Math.round((state.league / totalLeagues) * 100));

  function sfx(name){ window.WLAudio && window.WLAudio.play(name); }
  function cyclePace(){
    sfx("select");
    const opts = ["Cautious","Steady","Hurried"];
    const idx = opts.indexOf(state.pace);
    setState(s => ({ ...s, pace: opts[(idx+1) % opts.length] }));
  }
  function cycleRation(){
    sfx("select");
    const opts = ["Meager","Standard","Generous"];
    const idx = opts.indexOf(state.ration);
    setState(s => ({ ...s, ration: opts[(idx+1) % opts.length] }));
  }
  function toggleRoster(){ sfx("select"); setRosterOpen(o => !o); }
  function toggleLight(){ sfx("daynight"); setDayNight(d => d === "day" ? "night" : "day"); }
  function toggleMute(){ const m = window.WLAudio ? window.WLAudio.toggleMute() : !muted; setMuted(m); if(!m) sfx("select"); }

  const actions = [
    { key:"1", label:"March on",        sub:"advance one stage",                run: onAdvance,    disabled: allBondsBroken },
    { key:"2", label:"Make camp",       sub:"rest a day — recover Bonds",       run: onCamp,       disabled: false },
    { key:"3", label:`Pace · ${state.pace}`,      sub:"Cautious · Steady · Hurried",  run: cyclePace,   disabled:false },
    { key:"4", label:`Rations · ${state.ration}`, sub:"Meager · Standard · Generous", run: cycleRation, disabled:false },
    { key:"5", label:"Ward the Hollowing", sub:`spend ${wardCost||18} Lore → −${wardRelief||12} Hollowing`, run: () => canWard && onWard(), disabled: !canWard },
    { key:"6", label:"Inspect roster",  sub:"the Apprentices and their Beasts", run: toggleRoster, disabled: false },
    { key:"7", label: dayNight === "day" ? "Wait for dusk" : "Wait for dawn",  sub:"shift day / night", run: toggleLight, disabled: false },
  ];

  // Keyboard handlers
  useEffectJ(() => {
    function onKey(e){
      if (state.pendingEvent || state.pendingSkirmish || state.pendingKhronicle || state.pendingLegComplete || state.pendingLegendary || !state.omensSeen) return;
      if (e.key === "ArrowDown") { setCursor(c => (c+1) % actions.length); sfx("move"); e.preventDefault(); }
      else if (e.key === "ArrowUp") { setCursor(c => (c-1+actions.length) % actions.length); sfx("move"); e.preventDefault(); }
      else if (e.key === "Enter") { const a = actions[cursor]; if (a && !a.disabled) a.run(); e.preventDefault(); }
      else if (e.key === "Tab") { toggleRoster(); e.preventDefault(); }
      else if (e.key === "Escape") { if (rosterOpen) setRosterOpen(false); }
      else if (e.key === "s" || e.key === "S") { onSaveQuit?.(); }
      else if (e.key === "m" || e.key === "M") { toggleMute(); }
      else if (/^[1-7]$/.test(e.key)){
        const i = parseInt(e.key,10) - 1;
        if (i < actions.length){ setCursor(i); const a = actions[i]; if (a && !a.disabled) a.run(); }
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [cursor, state, rosterOpen, dayNight, muted, canWard]);

  // Caravan position across the scene reflects progress through the current leg
  const legProgress = Math.max(0, Math.min(1, state.regionProgress / 100));

  // Build display strings
  const weather = describeWeather(region.id, dayNight);

  return (
    <div className="journey-v2">
      {/* Top header strip */}
      <header className="jv-header">
        <div className="jv-brand">
          <span className="jv-mark">✦</span>
          <span className="jv-title">Wilderlore</span>
          <span className="jv-subtitle">·&nbsp; The Long Apprenticeship</span>
        </div>
        <div className="jv-meta">
          <div className="jv-region"><RegionIcon id={region.id} size={14} /> {region.name}</div>
          <div className="jv-date">Day&nbsp;<b>{state.day}</b> &nbsp;·&nbsp; League&nbsp;<b>{Math.floor(state.league)}</b>&nbsp;/&nbsp;{totalLeagues}</div>
          <div className="jv-weather"><WeatherGlyph kind={weather.kind} /> {weather.label}</div>
        </div>
      </header>

      {/* Scene */}
      <section className="jv-scene">
        <BiomeScene biome={region.id} dayNight={dayNight} moving={true} party={[state.lead, ...state.party]} progress={legProgress} t={t} />
        <div className="jv-progress">
          <div className="jv-progress-track">
            {REGIONS.map((r,i) => (
              <div key={r.id} className={`seg ${i < state.regionIdx ? "done" : i === state.regionIdx ? "cur" : ""}`}>
                <span className="lbl">{r.name.replace("The ","")}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Flavor banner */}
      <div className="jv-banner">
        <span className="bracket">‖</span>
        <span className="banner-text">{state.flavor || `Caravan of ${state.lead.name} presses on into ${region.name}.`}</span>
        <span className="bracket">‖</span>
      </div>

      {/* Three panels */}
      <section className="jv-panels">

        <Panel title="Status">
          <Stat icon={<HeartGlyph />}   label="Bonds"      value={`${bondAvg}%`}  pct={bondAvg}          color="var(--bond)" />
          <Stat icon={<MoraleGlyph />}  label="Morale"     value={`${Math.round(state.morale)}%`}  pct={state.morale}   color="var(--morale)" />
          <Stat icon={<HollowGlyph />}  label="Hollowing"  value={`${Math.round(state.hollowing)}%`} pct={state.hollowing} color="var(--crimson)" warnAt={70} />
          <Stat icon={<ProvGlyph />}    label="Provisions" value={`${state.provisions}`} pct={Math.min(100, state.provisions)} color="var(--provisions)" />
          <div className="jv-statlist">
            <Row k="Party"    v={`${aliveCount} of ${state.party.length + 1}`} />
            <Row k="Pace"     v={state.pace} />
            <Row k="Rations"  v={state.ration} />
            <Row k="Trail"    v={`${leaguePct}% to Halois`} />
          </div>
        </Panel>

        <Panel title="Stores">
          <StoreRow icon={<ProvGlyph />}  label="Provisions" value={state.provisions}    unit={`rations · −${drain}/day`} />
          <StoreRow icon={<LoreGlyph />}  label="Lore"       value={state.lore}          unit="motes" />
          <StoreRow icon={<CoinGlyph />}  label="Coin"       value={state.coin}          unit="marks" />
          <StoreRow icon={<PartyGlyph />} label="Apprentices" value={aliveCount}         unit={`of ${state.party.length+1}`} />
          <StoreRow icon={<BeastGlyph />} label="Beasts"     value={aliveCount}          unit="bonded" />
          <div className="jv-storenote">
            {state.provisions < 12 ? "Rations run thin — the next town will resell. The Beasts grow restless."
              : state.provisions < 30 ? "Stores hold. Watch for a town to resupply."
              : "The wagon is well-stocked."}
          </div>
        </Panel>

        <Panel title="Ledger" className="jv-ledger">
          <ul className="jv-legs">
            {REGIONS.map((r, i) => {
              const done = i < state.regionIdx;
              const cur = i === state.regionIdx;
              const log = (state.legLog || []).find(l => l.id === r.id);
              const legend = (state.legendaryLog || []).some(l => l.region === r.id);
              return (
                <li key={r.id} className={`jv-leg ${done ? "done" : cur ? "cur" : "upcoming"}`}>
                  <span className="leg-mark">{done ? "✓" : cur ? "▸" : "·"}</span>
                  <span className="leg-name">{r.name.replace("The ","")}</span>
                  {legend && <span className="leg-legend" title="Legendary faced">✦</span>}
                  <span className="leg-meta">
                    {done && log ? `${log.days}d` : cur ? `${Math.round(state.regionProgress)}%` : ""}
                  </span>
                </li>
              );
            })}
          </ul>
          <div className="jv-ledger-foot">
            <div className="lf-row"><span className="k">Renown</span><span className="v gold">{state.score || 0}</span></div>
            <div className="lf-row"><span className="k">Lands crossed</span><span className="v">{state.regionIdx} / 6</span></div>
            <div className="lf-row"><span className="k">Legends faced</span><span className="v">{(state.legendaryLog || []).length}</span></div>
            <OmenBadges omens={state.omens} />
            {state.homeNote && <div className="lf-note">{state.homeNote}</div>}
          </div>
        </Panel>

        <Panel title="Actions" className="jv-actions">
          <ul className="jv-menu">
            {actions.map((a, i) => (
              <li
                key={a.key}
                className={`jv-mi ${cursor === i ? "on" : ""} ${a.disabled ? "off" : ""}`}
                onMouseEnter={() => setCursor(i)}
                onClick={() => !a.disabled && a.run()}
              >
                <span className="pointer">{cursor === i ? "▸" : " "}</span>
                <span className="num">{a.key}.</span>
                <span className="lab">{a.label}</span>
                <span className="sub">{a.sub}</span>
              </li>
            ))}
          </ul>
        </Panel>

      </section>

      {/* Footer hints */}
      <footer className="jv-foot">
        <div className="hints">
          <Kbd glyph="↑↓"/> <span>Move</span>
          <Kbd glyph="↵"/>  <span>Select</span>
          <Kbd glyph="1–6"/> <span>Quick</span>
        </div>
        <div className="jv-savestate">
          <SaveDot fresh={savedAt && Date.now() - savedAt < 1500} />
          <span>{savedAt ? `Auto-saved · ${formatSavedAt(savedAt)}` : "Saving…"}</span>
        </div>
        <div className="hints right">
          <button className="jv-savebtn" onClick={toggleMute} title="Toggle sound (M)"><Kbd glyph={muted ? "🔇" : "🔊"} /> <span>{muted ? "Muted" : "Sound"}</span></button>
          <Kbd glyph="TAB"/> <span>Roster</span>
          <button className="jv-savebtn" onClick={() => onSaveQuit?.()}><Kbd glyph="S"/> <span>Save &amp; quit</span></button>
          <Kbd glyph="ESC"/> <span>Close</span>
        </div>
      </footer>

      {/* Roster overlay */}
      {rosterOpen && (
        <div className="jv-roster-overlay" onClick={() => setRosterOpen(false)}>
          <div className="jv-roster-card" onClick={e => e.stopPropagation()}>
            <div className="jv-roster-head">
              <span className="eyebrow">The Roster</span>
              <h3>Caravan of {state.lead.name}</h3>
              <button className="jv-close" onClick={() => setRosterOpen(false)}>close ✕</button>
            </div>
            <div className="jv-roster-grid">
              {[state.lead, ...state.party].map(p => {
                const bondClass = p.bond > 50 ? "" : p.bond > 25 ? "low" : "crit";
                return (
                  <div key={p.id} className={`jv-rcard ${p.lost ? "dead" : ""}`}>
                    <div className="pp"><ApprenticePortrait hue={p.hue} size={56} walk={!p.lost} t={t+p.hue*17} /></div>
                    <div className="who">
                      <div className="nm">{p.name}{p.isLead && <span className="lead-star">★</span>}</div>
                      <div className="beast">{p.beast.name} the {p.beast.kind}</div>
                      <div className="specialty">{p.specialtyName}</div>
                      <div className={`bondbar ${bondClass}`}><div className="fill" style={{width: `${Math.max(0,p.bond)}%`}} /></div>
                      <div className="bondnum">Bond · {p.lost ? "broken" : `${Math.round(p.bond)}%`}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <div className="toasts">
        {toasts.map(t => (
          <div key={t.id} className={`toast ${t.val>0?"up":t.val<0?"down":""}`}>
            <span>{t.label}</span>
            {t.val != null && <span className="chip">{t.val>=0?"+":""}{t.val}</span>}
          </div>
        ))}
      </div>
    </div>
  );
}

// ===== Small UI primitives =====
function Panel({ title, className, children }){
  return (
    <div className={`jv-panel ${className||""}`}>
      <div className="jv-panel-head">{title}</div>
      <div className="jv-panel-body">{children}</div>
    </div>
  );
}

function Stat({ icon, label, value, pct, color, warnAt }){
  const warn = warnAt != null && pct >= warnAt;
  return (
    <div className={`jv-stat ${warn ? "warn" : ""}`}>
      <span className="jv-stat-icon">{icon}</span>
      <span className="jv-stat-label">{label}</span>
      <span className="jv-stat-bar"><span className="fill" style={{width:`${Math.max(0,Math.min(100,pct))}%`, background:color}} /></span>
      <span className="jv-stat-val">{value}</span>
    </div>
  );
}

function StoreRow({ icon, label, value, unit }){
  return (
    <div className="jv-store">
      <span className="jv-stat-icon">{icon}</span>
      <span className="jv-store-label">{label}</span>
      <span className="jv-store-dot" />
      <span className="jv-store-val">{value} <em>{unit}</em></span>
    </div>
  );
}

function Row({ k, v }){
  return (<div className="jv-row"><span className="k">{k}</span><span className="d" /><span className="v">{v}</span></div>);
}

function Kbd({ glyph }){ return <kbd className="jv-kbd">{glyph}</kbd>; }

function SaveDot({ fresh }){
  return <span className={`jv-savedot ${fresh ? "fresh" : ""}`} />;
}
function formatSavedAt(ts){
  const s = Math.max(0, Math.floor((Date.now() - ts)/1000));
  if (s < 5) return "just now";
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s/60);
  if (m < 60) return `${m}m ago`;
  return new Date(ts).toLocaleTimeString([], { hour:"2-digit", minute:"2-digit" });
}

// ===== Glyphs (small inline SVGs, in our gold/ink) =====
function gIcon(d, vb="0 0 16 16"){
  return <svg viewBox={vb} width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">{d}</svg>;
}
const HeartGlyph  = () => gIcon(<path d="M8 13.5s-5-3.2-5-6.8A2.7 2.7 0 0 1 8 5a2.7 2.7 0 0 1 5 1.7c0 3.6-5 6.8-5 6.8z"/>);
const MoraleGlyph = () => gIcon(<><path d="M8 2v3"/><path d="M8 11v3"/><path d="M3 8h3"/><path d="M10 8h3"/><circle cx="8" cy="8" r="2"/></>);
const HollowGlyph = () => gIcon(<><circle cx="8" cy="8" r="5"/><circle cx="8" cy="8" r="1.5" fill="currentColor"/></>);
const ProvGlyph   = () => gIcon(<><path d="M3 7c0-2 2-4 5-4s5 2 5 4-2 4-5 4-5-2-5-4z"/><path d="M8 11v3"/></>);
const LoreGlyph   = () => gIcon(<><path d="M3 3h7l3 3v7H3z"/><path d="M10 3v3h3"/><path d="M5 8h5"/><path d="M5 10h5"/></>);
const CoinGlyph   = () => gIcon(<><circle cx="8" cy="8" r="5"/><path d="M6 8h4"/><path d="M8 6v4"/></>);
const PartyGlyph  = () => gIcon(<><circle cx="6" cy="6" r="2"/><circle cx="11" cy="7" r="1.6"/><path d="M2 13c0-2 2-3 4-3s4 1 4 3"/><path d="M9 13c0-1.4 1.5-2.4 3-2.4s2 .6 2 2"/></>);
const BeastGlyph  = () => gIcon(<><path d="M3 11c0-3 2-5 5-5s5 2 5 5"/><circle cx="6" cy="4" r="1"/><circle cx="10" cy="4" r="1"/><path d="M6 5L6 7"/><path d="M10 5L10 7"/></>);

function WeatherGlyph({ kind }){
  if (kind === "moon")   return gIcon(<path d="M11 9.5A4 4 0 0 1 6.5 5a4 4 0 1 0 4.5 4.5z"/>);
  if (kind === "rain")   return gIcon(<><path d="M4 8a3 3 0 0 1 6 0h2a2 2 0 1 1 0 4H4a2 2 0 1 1 0-4z"/><path d="M6 13l-1 2"/><path d="M9 13l-1 2"/></>);
  if (kind === "snow")   return gIcon(<><path d="M8 3v10"/><path d="M3 8h10"/><path d="M5 5l6 6"/><path d="M11 5l-6 6"/></>);
  if (kind === "sand")   return gIcon(<><path d="M3 10c2-3 4-3 6 0s4 3 6 0"/><path d="M2 13h12"/></>);
  if (kind === "cloud")  return gIcon(<path d="M4 11a3 3 0 0 1 1-5 3 3 0 0 1 5-1 3 3 0 0 1 3 6H4z"/>);
  return gIcon(<circle cx="8" cy="8" r="3.2"/>); // sun
}

function describeWeather(biome, daynight){
  if (daynight === "night") return { kind:"moon", label:"Nightfall" };
  switch(biome){
    case "woods":     return { kind:"cloud", label:"Mossfall" };
    case "sea":       return { kind:"rain",  label:"Salt rain" };
    case "desert":    return { kind:"sand",  label:"Veiling wind" };
    case "tundra":    return { kind:"snow",  label:"Snow" };
    case "jungle":    return { kind:"cloud", label:"Spore haze" };
    case "mountains": return { kind:"cloud", label:"High mist" };
    default:          return { kind:"sun",   label:"Clear" };
  }
}

Object.assign(window, { Journey });
