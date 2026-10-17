// omens.jsx — Omen reveal card (run start) + small HUD badge list
const { useState: useStateOm } = React;

function OmenReveal({ omens, onContinue }){
  const { OMENS_BY_ID } = window.WLData;
  const list = (omens || []).map(id => OMENS_BY_ID[id]).filter(Boolean);
  React.useEffect(() => { window.WLAudio && window.WLAudio.play("legendary"); }, []);

  return (
    <div className="overlay">
      <div className="omen-card">
        <div className="omen-top">
          <div className="omen-eyebrow">The Omens are Read</div>
          <h2 className="omen-title">This Pilgrimage</h2>
          <div className="omen-sub">The Khronicle's augurs cast the year ahead. These signs hold for the whole road.</div>
        </div>

        <div className="omen-list">
          {list.map(o => (
            <div key={o.id} className={`omen-row ${o.type}`}>
              <div className="omen-glyph"><BeastSilhouette glyph={o.glyph} color={omenColor(o.type)} size={52} /></div>
              <div className="omen-body">
                <div className="omen-row-head">
                  <span className="omen-name">{o.name}</span>
                  <span className={`omen-tag ${o.type}`}>{o.type === "boon" ? "Boon" : o.type === "bane" ? "Bane" : "Mixed"}</span>
                </div>
                <div className="omen-blurb">{o.blurb}</div>
                <div className="omen-effects">{omenEffects(o)}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="omen-foot">
          <button className="btn" onClick={onContinue}>Take to the road</button>
        </div>
      </div>
    </div>
  );
}

function omenColor(type){
  return type === "boon" ? "#9ec2b7" : type === "bane" ? "#c2705e" : "#d4a14a";
}

// Human-readable effect chips from an omen's mods
function omenEffects(o){
  const labels = {
    hollowingMul:"Hollowing", provDrainMul:"Provision use", bondDrainMul:"Bond wear",
    eventChanceMul:"Encounters", leagueMul:"March speed", skirmishMul:"Beast strength",
    wardCostMul:"Ward cost", wardReliefMul:"Ward power", campHealMul:"Camp rest", resupplyMul:"Resupply",
    moraleDay:"Daily morale", startProv:"Start provisions", startCoin:"Start coin",
    startLore:"Start Lore", startMorale:"Start morale",
  };
  const out = [];
  for (const [k, v] of Object.entries(o.mods)){
    let txt;
    if (k.endsWith("Mul")){
      const pct = Math.round((v - 1) * 100);
      txt = `${labels[k]} ${pct > 0 ? "+" : ""}${pct}%`;
    } else {
      txt = `${labels[k]} ${v > 0 ? "+" : ""}${v}`;
    }
    // good/bad coloring: lower hollowing/drain/cost/beast = good
    const lowerIsGood = ["hollowingMul","provDrainMul","bondDrainMul","skirmishMul","wardCostMul","eventChanceMul"].includes(k);
    let good;
    if (k.endsWith("Mul")) good = lowerIsGood ? v < 1 : v > 1;
    else good = v > 0;
    out.push(<span key={k} className={`omen-eff ${good ? "good" : "bad"}`}>{txt}</span>);
  }
  return out;
}

// Compact badges for the HUD ledger panel
function OmenBadges({ omens }){
  const { OMENS_BY_ID } = window.WLData;
  const list = (omens || []).map(id => OMENS_BY_ID[id]).filter(Boolean);
  if (!list.length) return null;
  return (
    <div className="omen-badges">
      {list.map(o => (
        <span key={o.id} className={`omen-badge ${o.type}`} title={o.blurb}>
          <span className="ob-dot" /> {o.name}
        </span>
      ))}
    </div>
  );
}

Object.assign(window, { OmenReveal, OmenBadges });
