// khronicle.jsx — newspaper-styled interlude between Wilderlands
function Khronicle({ regionId, state, dayNight, onContinue }){
  const dispatch = window.WLData.KHRON_DISPATCHES[regionId];
  if (!dispatch) return null;
  const briefing = (window.WLData.KHRON_BRIEFING || {})[regionId];

  // Substitution helpers
  const lead = state.lead;
  const leadFirst = (lead.name || "An apprentice").split(" ")[0];
  const leadLast  = (lead.name || "").split(" ").slice(1).join(" ") || "Unknown";

  function fill(s){
    return s
      .replace(/{HOLLOWING}/g, "Hollowing")
      .replace(/{LEAD}/g, leadFirst)
      .replace(/{LEADLAST}/g, leadLast)
      .replace(/{ADVICE}/g, state.pace === "Hurried" ? "slow their pace" : "press on without delay");
  }

  const day = state.day;
  const dateStr = `Day ${day} of the Long Apprenticeship`;
  const lossLine = state.lostCount > 0
    ? `One apprentice already lost; the caravan presses on.`
    : `The caravan presses on, intact.`;

  return (
    <div className="overlay">
      <div className="khron">
        <div className="khron-masthead">
          <div className="pre">— PUBLISHED THIS DAY IN HALOIS —</div>
          <h2>{dispatch.masthead}</h2>
          <div className="sub">
            <span>{dispatch.section}</span>
            <span>{dateStr}</span>
          </div>
        </div>
        <div className="khron-grid">
          <div className="khron-lead">
            <h3>{fill(dispatch.lead.title)}</h3>
            <div className="by">By a Khronicle Courier · Filed from the Road</div>
            <p>{fill(dispatch.lead.body)}</p>
            <p style={{fontStyle:"italic", color:"#5a4a30"}}>{lossLine}</p>
          </div>
          <div className="khron-side">
            {dispatch.briefs.map((b, i) => (
              <div key={i} className="khron-brief">
                <h4>{b.h}</h4>
                <p>{fill(b.p)}</p>
              </div>
            ))}
            <div className="khron-brief">
              <h4>Caravan Notice</h4>
              <p>Caravan of {leadFirst} {leadLast}: {state.party.filter(p=>!p.lost).length} of 4 apprentices Bonded and on the road. Pace, {state.pace.toLowerCase()}. Provisions, {state.provisions}.</p>
            </div>
          </div>
        </div>

        {briefing && (
          <div className="khron-briefing">
            <div className="kb-head">
              <span className="kb-stamp">Trail Briefing</span>
              <span className="kb-region">{(window.WLData.REGIONS.find(r=>r.id===regionId)||{}).name} · the road ahead</span>
            </div>
            <p className="kb-lede">{briefing.lede}</p>
            <ul className="kb-watch">
              {briefing.watch.map((w,i) => <li key={i}>{w}</li>)}
            </ul>
            <div className="kb-legend">
              <span className="kb-legend-mark">✦</span>
              <span>{dayNight === "night" ? briefing.legNight : briefing.legDay} <em>Toggle day/night on the trail to change which warden you meet.</em></span>
            </div>
          </div>
        )}

        <div className="khron-foot">
          <button className="btn" onClick={onContinue}>Fold the paper and march on</button>
        </div>
      </div>
    </div>
  );
}
window.Khronicle = Khronicle;
