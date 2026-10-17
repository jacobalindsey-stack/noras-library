// skirmish.jsx — tap-timing Beast skirmish mini-encounter
const { useState: useStateSk, useEffect: useEffectSk, useRef: useRefSk } = React;

function Skirmish({ event, state, onResolve }){
  const sk = event.skirmish;
  const totalRounds = sk.rounds;
  const isCorrupted = /husk|hollow/i.test(sk.foe) || event.title.includes("Hollow") || event.title.includes("Husk");
  const canBond = !isCorrupted && Math.random() < 0.5;

  // Player Lore "HP" (drawn from state)
  const [foeHp, setFoeHp] = useStateSk(sk.hp);
  const [playerLore, setPlayerLore] = useStateSk(Math.min(100, state.lore));
  const [round, setRound] = useStateSk(1);
  const [needle, setNeedle] = useStateSk(0);         // 0..1
  const [dir, setDir] = useStateSk(1);
  const [target, setTarget] = useStateSk({ pos: 0.5, width: 0.18 });
  const [running, setRunning] = useStateSk(true);
  const [logMsg, setLogMsg] = useStateSk("Time your channel — release in the gold window.");
  const [done, setDone] = useStateSk(null); // {result:"defeat"|"spared"|"bonded"|"backlash"}
  const speedRef = useRefSk(0.9);

  // Animate needle
  useEffectSk(() => {
    if (!running) return;
    let raf, last = performance.now();
    function loop(now){
      const dt = (now - last) / 1000; last = now;
      setNeedle(n => {
        let next = n + dir * speedRef.current * dt;
        if (next > 1) { next = 1 - (next - 1); setDir(-1); }
        else if (next < 0) { next = -next; setDir(1); }
        return next;
      });
      raf = requestAnimationFrame(loop);
    }
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [running, dir]);

  function newTarget(){
    const width = Math.max(0.12, 0.24 - round*0.018);
    const pos = 0.18 + Math.random()*0.64;
    setTarget({ pos, width });
    speedRef.current = 0.72 + round * 0.11;
  }
  useEffectSk(() => { newTarget(); }, [round]);

  function channel(){
    if (!running) return;
    const lo = target.pos - target.width/2;
    const hi = target.pos + target.width/2;
    const hit = needle >= lo && needle <= hi;
    const center = Math.abs(needle - target.pos) / (target.width/2);
    if (hit){
      const damage = Math.round(sk.attack + (1 - center) * 12);
      const nextFoeHp = Math.max(0, foeHp - damage);
      setFoeHp(nextFoeHp);
      setLogMsg(`Channel struck — ${damage} damage.`);
      window.WLAudio && window.WLAudio.play("hit");
      if (nextFoeHp <= 0) { finish("defeat"); return; }
      // Foe counter: depends on accuracy
      const counter = Math.max(0, Math.round(sk.attack * 0.4 - (1-center)*6));
      if (counter > 0){
        setPlayerLore(L => Math.max(0, L - counter));
      }
      advance();
    } else {
      const backlash = Math.round(sk.attack * 0.8);
      setPlayerLore(L => Math.max(0, L - backlash));
      setLogMsg(`Backlash! Lore ${backlash} lost.`);
      window.WLAudio && window.WLAudio.play("miss");
      if (playerLore - backlash <= 0) { finish("backlash"); return; }
      advance();
    }
  }

  function advance(){
    if (round >= totalRounds){
      // Time-out victory only if foe HP <= 60% of max
      if (foeHp < sk.hp * 0.5) finish("defeat");
      else finish("retreated");
    } else {
      setTimeout(() => setRound(r => r+1), 350);
    }
  }

  function spare(){
    if (isCorrupted){ setLogMsg("This thing has no Bond to spare. Channel through."); return; }
    finish("spared");
  }
  function bond(){
    finish("bonded");
  }

  function finish(kind){
    setRunning(false);
    setDone({ kind });
    if (window.WLAudio){
      if (kind === "defeat" || kind === "bonded") window.WLAudio.play("victory");
      else if (kind === "backlash") window.WLAudio.play("bad");
      else if (kind === "spared") window.WLAudio.play("good");
    }
  }

  function commit(){
    // Apply rewards / costs
    const applied = [];
    const stateDelta = {};
    const partyDelta = [];

    const loreSpent = Math.min(state.lore, Math.max(0, Math.min(100, state.lore) - playerLore));
    if (loreSpent > 0){ stateDelta.lore = -loreSpent; applied.push({ label:"Lore", val:-loreSpent }); }

    if (done.kind === "defeat"){
      const prov = 16 + Math.floor(Math.random()*8);
      const morale = 6;
      stateDelta.provisions = prov;
      stateDelta.morale = morale;
      applied.push({ label:"Provisions", val:prov });
      applied.push({ label:"Morale", val:morale });
      if (Math.random() < 0.35){ stateDelta.coin = 4; applied.push({ label:"Coin", val:4 }); }
    } else if (done.kind === "retreated"){
      stateDelta.morale = -4;
      applied.push({ label:"Morale", val:-4 });
    } else if (done.kind === "spared"){
      stateDelta.morale = 10;
      stateDelta.hollowing = -1;
      applied.push({ label:"Morale", val:10 });
      applied.push({ label:"Hollowing", val:-1 });
      // Spared Beasts add to a count
      stateDelta.sparedCount = 1;
    } else if (done.kind === "bonded"){
      // Heal weakest bond significantly
      const alive = state.party.map((p,i)=>({p,i})).filter(x=>!x.p.lost);
      if (alive.length){
        const weakest = alive.slice().sort((a,b)=>a.p.bond-b.p.bond)[0];
        const cur = weakest.p.bond;
        partyDelta.push({ idx: weakest.i, set: Math.min(100, cur+30) });
        applied.push({ label:`${weakest.p.name}'s Bond`, val: Math.min(100, cur+30) - cur });
      }
      stateDelta.morale = 6;
      stateDelta.sparedCount = 1;
      applied.push({ label:"Morale", val:6 });
    } else if (done.kind === "backlash"){
      stateDelta.morale = -8;
      partyDelta.push({ idxAll:true, val:-6 });
      applied.push({ label:"Morale", val:-8 });
      applied.push({ label:"All Bonds", val:-6 });
    }

    onResolve({ applied, stateDelta, partyDelta, kind: done.kind });
  }

  const summary = done ? {
    defeat:    `${sk.foe} downed. Trophies and provisions collected.`,
    retreated: `${sk.foe} held its ground; your caravan slips past.`,
    spared:    `${sk.foe} watched you pass, then turned for the trees.`,
    bonded:    `${sk.foe} pressed its forehead against your weakest apprentice. A bond began.`,
    backlash:  `Your Lore guttered out. The caravan staggers on, hurt.`,
  }[done.kind] : null;

  return (
    <div className="overlay">
      <div className="skirmish-card">
        <div className="skirmish-head">
          <div className="tag" style={{fontFamily:"var(--journal)", letterSpacing:"0.3em", fontSize:10, color:"var(--gold)"}}>SKIRMISH</div>
          <h3>{event.title}</h3>
          <div className="round">{done ? "Resolved" : `Round ${round} / ${totalRounds}`}</div>
        </div>
        <div className="skirmish-arena">
          <div className="hpbars">
            <div>
              <div className="lbl">Your Lore</div>
              <div className="bar"><div className="fill" style={{width: `${playerLore}%`}} /></div>
            </div>
            <div className="foe-side" style={{textAlign:"right"}}>
              <div className="lbl">{sk.foe}</div>
              <div className="bar"><div className="fill" style={{width: `${(foeHp/sk.hp)*100}%`, marginLeft:"auto"}} /></div>
            </div>
          </div>
          <div className="you"><ApprenticePortrait hue={50} size={72} /></div>
          <div className="foe"><BeastSilhouette glyph={sk.foeGlyph} color={sk.foeColor} size={84} /></div>
        </div>

        {!done && (
          <div className="skirmish-controls">
            <div className="skirmish-meter" onClick={channel}>
              <div className="target" style={{
                left: `${(target.pos - target.width/2)*100}%`,
                width: `${target.width*100}%`,
              }} />
              <div className="needle" style={{ left: `${needle*100}%` }} />
            </div>
            <div className="skirmish-actions">
              <button className="channel" onClick={channel}>Channel</button>
              <button className="alt" onClick={spare} disabled={isCorrupted}>Spare</button>
              {canBond && <button className="alt" onClick={bond}>Offer Bond</button>}
              <span className="hint">{isCorrupted ? "Corrupted Beast — cannot be spared." : "Land in the gold."}</span>
            </div>
            <div className="skirmish-log">{logMsg}</div>
          </div>
        )}

        {done && (
          <div className="event-resolved" style={{background:"#10131a", color:"var(--ink)"}}>
            <p style={{color:"var(--ink-dim)"}}>{summary}</p>
            <button className="continue" onClick={commit}>Continue</button>
          </div>
        )}
      </div>
    </div>
  );
}

window.Skirmish = Skirmish;
