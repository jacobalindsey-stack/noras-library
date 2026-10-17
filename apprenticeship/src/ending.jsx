// ending.jsx — final screen with one of three Hollowing explanations + license rank
function Ending({ state, kind, onRestart }){
  const { ENDINGS } = window.WLData;

  // Decide which Hollowing explanation to reveal
  let revealKey = "fracture";
  const spared = state.sparedCount || 0;
  const hollowingProgress = state.hollowing; // higher = closer
  const aliveCount = state.party.filter(p => !p.lost).length + (state.lead.lost ? 0 : 1);
  // Heuristic: high spared → bond-friendly → "fracture"; many losses + low spared → "cult"; in between → "legendary"
  if (kind === "halois") {
    if (spared >= 3 && aliveCount >= 3) revealKey = "fracture";
    else if (state.lostCount >= 2 || spared === 0) revealKey = "cult";
    else revealKey = "legendary";
  } else if (kind === "hollowed") {
    revealKey = "legendary";
  } else {
    revealKey = "cult";
  }

  const reveal = ENDINGS[revealKey];

  const verdictMap = {
    halois:   { v:"YOU REACHED HALOIS", t:"The Gold-and-Slate Doors", b:"You stood your caravan before the Grand Keeper's hall and were welcomed in." },
    hollowed: { v:"THE HOLLOWING FOUND YOU FIRST", t:"A Quiet Country", b:"The patches met along the road, and the road went quiet. Some of you walked on into Halois without a sound." },
    broken:   { v:"YOUR CARAVAN BROKE", t:"Four Bonds, All Frayed", b:"Without Bonds, an apprentice is just a child far from home. The Guild will name no licensee from this caravan." },
  };
  const verdict = verdictMap[kind] || verdictMap.broken;

  // ----- License rank: rewards survivors, lore, low hollowing, legendaries -----
  const legendsFaced = (state.legendaryLog || []).length;
  const lands = (state.legLog || []).length + (kind === "halois" ? 1 : 0);
  const finalScore = Math.round(
    (state.score || 0)
    + aliveCount * 120
    + (state.lore || 0) * 1.5
    + Math.max(0, 100 - hollowingProgress) * 3
    + legendsFaced * 40
  );
  const rank = licenseRank(kind, finalScore, aliveCount);

  return (
    <div className="ending">
      <div className="ending-card">
        <div className="verdict">{verdict.v}</div>
        <h2>{verdict.t}</h2>
        <p>{verdict.b}</p>

        {/* License rank banner */}
        <div className="rank-banner">
          <div className="rank-eyebrow">The Guild Confers</div>
          <div className="rank-title">{rank.title}</div>
          <div className="rank-score"><span className="rs-num">{finalScore.toLocaleString()}</span> <span className="rs-cap">total renown</span></div>
          <div className="rank-blurb">{rank.blurb}</div>
        </div>

        <div className="score">
          <div className="cell"><div className="lbl">Days</div><div className="val">{state.day}</div></div>
          <div className="cell"><div className="lbl">Apprentices</div><div className="val">{aliveCount} / 4</div></div>
          <div className="cell"><div className="lbl">Lands Crossed</div><div className="val">{lands} / 6</div></div>
          <div className="cell"><div className="lbl">Legends Faced</div><div className="val">{legendsFaced}</div></div>
          <div className="cell"><div className="lbl">Lore</div><div className="val">{state.lore}</div></div>
          <div className="cell"><div className="lbl">Lore Intact</div><div className="val">{Math.max(0, 100 - hollowingProgress)}%</div></div>
        </div>

        {/* Leg-by-leg recap */}
        {(state.legLog || []).length > 0 && (
          <div className="ending-ledger">
            <div className="el-head">The Pilgrimage, Land by Land</div>
            {(state.legLog || []).map((l, i) => (
              <div key={i} className="el-row">
                <span className="el-name">{l.name}</span>
                <span className="el-days">{l.days}d</span>
                <span className={`el-lore ${l.loreDelta>=0?"good":"bad"}`}>{l.loreDelta>=0?`+${l.loreDelta}`:l.loreDelta} lore</span>
                <span className="el-legend">{l.legendary ? `✦ ${l.legendary.name}` : "—"}</span>
                <span className="el-score">+{l.score}</span>
              </div>
            ))}
          </div>
        )}

        <div style={{margin:"18px auto 0", maxWidth:520, textAlign:"left",
          background:"rgba(212,161,74,0.06)", border:"1px solid var(--rule)", borderRadius:3, padding:"16px 20px"}}>
          <div style={{fontFamily:"var(--journal)", letterSpacing:"0.3em", fontSize:11, color:"var(--gold)", marginBottom:6}}>
            {reveal.verdict}
          </div>
          <div style={{fontFamily:"var(--serif)", fontStyle:"italic", fontSize:26, color:"var(--ink)", marginBottom:8}}>
            {reveal.title}
          </div>
          <p style={{fontFamily:"var(--serif)", fontSize:15, lineHeight:1.55, color:"var(--ink-dim)"}}>{reveal.body}</p>
        </div>
        <div style={{marginTop:24}}>
          <button className="btn" onClick={onRestart}>New Run</button>
        </div>
      </div>
    </div>
  );
}

function licenseRank(kind, score, aliveCount){
  if (kind === "broken")   return { title:"Unlicensed — The Caravan That Broke", blurb:"The Guild keeps your name, but confers no license. Walk the road again." };
  if (kind === "hollowed") return { title:"Unlicensed — Lost to the Hollowing", blurb:"What the road took, the Guild cannot give back. But your maps will help the next caravan." };
  // Reached Halois — grade it
  if (score >= 2600) return { title:"Grand Keeper's Chosen", blurb:"The highest honor the hall confers. Your caravan will be sung of for a generation." };
  if (score >= 2000) return { title:"Licensed Keeper, First Circle", blurb:"Few caravans arrive so whole, so learned. The First Circle is yours." };
  if (score >= 1400) return { title:"Licensed Keeper, Second Circle", blurb:"A strong, sure pilgrimage. The Guild welcomes you to the Second Circle." };
  if (score >= 850)  return { title:"Licensed Keeper, Third Circle", blurb:"You arrived, and you arrived a Keeper. The Third Circle opens its doors." };
  return { title:"Licensed Apprentice", blurb:"You reached the gate by the skin of your Bonds. The license is real — barely." };
}
window.Ending = Ending;
