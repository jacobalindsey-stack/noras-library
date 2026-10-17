// milestones.jsx — Leg-Complete chapter card + Legendary Beast capstone encounter
const { useState: useStateMS } = React;

// ============================================================
// Leg-Complete chapter card — shown when crossing a region border.
// Game-y: clear reward chips + a big score popup.
// ============================================================
function LegComplete({ summary, state, onContinue }){
  const s = summary;
  const chapNum = ["I","II","III","IV","V","VI"][s.index] || (s.index+1);
  const delta = (n) => (n > 0 ? `+${n}` : `${n}`);

  return (
    <div className="overlay">
      <div className="legcard">
        <div className="legcard-top">
          <div className="legcard-eyebrow">Chapter {chapNum} · Complete</div>
          <h2 className="legcard-title">{s.name} — crossed</h2>
          <div className="legcard-sub">You leave {s.capital} behind and step onto the next road.</div>
        </div>

        <div className="legcard-score">
          <div className="score-pop">+{s.score}</div>
          <div className="score-cap">Renown earned this leg</div>
        </div>

        <div className="legcard-chips">
          <div className="chip2"><span className="k">Days on this leg</span><span className="v">{s.days}</span></div>
          <div className={`chip2 ${s.loreDelta>=0?"good":"bad"}`}><span className="k">Lore</span><span className="v">{delta(s.loreDelta)}</span></div>
          <div className={`chip2 ${s.coinDelta>=0?"good":"bad"}`}><span className="k">Coin</span><span className="v">{delta(s.coinDelta)}</span></div>
          <div className={`chip2 ${s.bondsLost>0?"bad":"good"}`}><span className="k">Bonds lost</span><span className="v">{s.bondsLost}</span></div>
        </div>

        {s.legendary ? (
          <div className="legcard-legend met">
            <span className="dot">✦</span>
            <div>
              <div className="ll-name">{s.legendary.name} — faced</div>
              <div className="ll-choice">You chose to {s.legendary.choice.toLowerCase()}.</div>
            </div>
          </div>
        ) : (
          <div className="legcard-legend miss">
            <span className="dot">✦</span>
            <div>
              <div className="ll-name">No legendary stirred here</div>
              <div className="ll-choice">The {s.name.replace("The ","")}'s great Beast slept on.</div>
            </div>
          </div>
        )}

        <div className="legcard-foot">
          <button className="btn" onClick={onContinue}>March on</button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Legendary Beast capstone encounter
// ============================================================
function LegendaryEncounter({ data, onResolve }){
  const [picked, setPicked] = useStateMS(null);
  const beast = window.WLData.REGIONS.find(r => r.id === data.region);

  return (
    <div className="overlay">
      <div className="legend-modal">
        <div className="legend-banner">
          <span className="lb-eyebrow">Legendary Beast</span>
          <div className="lb-portrait">
            <BeastSilhouette glyph={data.glyph} color="#d4a14a" size={96} walk={true} t={performance.now()} />
          </div>
          <h2 className="lb-name">{data.name}</h2>
          <div className="lb-kind">{data.kind}</div>
        </div>

        <div className="legend-body">
          <h3 className="lb-title">{data.title}</h3>

          {!picked ? (
            <>
              <p className="lb-intro">{data.intro}</p>
              <div className="legend-choices">
                {data.choices.map(c => (
                  <button key={c.id} className="legend-choice" onClick={() => setPicked(c)}>
                    <span className="lc-label">{c.label}</span>
                    <span className="lc-desc">{c.desc}</span>
                    <span className="lc-score">+{c.score} renown</span>
                  </button>
                ))}
              </div>
            </>
          ) : (
            <div className="legend-result">
              <p className="lr-text">{picked.result}</p>
              <div className="lr-chips">
                {picked.deltas.map((d, i) => (
                  <span key={i} className={`chip2 ${d.v>=0?"good":"bad"}`}>
                    <span className="k">{prettyLegendKey(d.k)}</span>
                    <span className="v">{d.v>0?`+${d.v}`:d.v}</span>
                  </span>
                ))}
                <span className="chip2 score"><span className="k">Renown</span><span className="v">+{picked.score}</span></span>
              </div>
              <button className="btn" onClick={() => onResolve(picked)}>Continue the journey</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function prettyLegendKey(k){
  return { provisions:"Provisions", lore:"Lore", coin:"Coin", morale:"Morale",
    league:"Leagues", days:"Days", hollowing:"Hollowing", bondAll:"All Bonds", bondRandom:"A Bond" }[k] || k;
}

Object.assign(window, { LegComplete, LegendaryEncounter });
