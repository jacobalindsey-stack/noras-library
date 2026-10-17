// title.jsx — title screen + difficulty selector
const { useState: useStateTitle } = React;

function TitleScreen({ onStart, hasSave, onContinue, onDiscard }){
  const [difficulty, setDifficulty] = useStateTitle("Keeper");
  const [confirmDiscard, setConfirmDiscard] = useStateTitle(false);
  return (
    <div className="title">
      <div className="title-bg">
        {/* layered silhouette of mountains for the title */}
        <svg viewBox="0 0 800 480" preserveAspectRatio="xMidYMax slice">
          <defs>
            <radialGradient id="haze" cx="50%" cy="40%" r="60%">
              <stop offset="0%" stopColor="rgba(212,161,74,0.18)" />
              <stop offset="100%" stopColor="rgba(0,0,0,0)" />
            </radialGradient>
          </defs>
          <rect x="0" y="0" width="800" height="480" fill="url(#haze)" />
          <path d="M0 360 L80 280 L150 320 L220 240 L300 320 L380 220 L460 320 L540 260 L620 320 L700 290 L800 340 L800 480 L0 480 Z" fill="#1a1f28" />
          <path d="M0 400 L100 350 L200 380 L320 320 L420 360 L520 310 L620 360 L720 340 L800 380 L800 480 L0 480 Z" fill="#0e1218" />
          <path d="M0 440 L120 410 L240 430 L360 400 L500 430 L640 410 L800 440 L800 480 L0 480 Z" fill="#06070a" />
          {/* Caravan silhouette walking */}
          <g transform="translate(380 410)" opacity="0.85">
            <circle r="6" fill="#d4a14a" />
            <circle cx="20" r="5" fill="#d4a14a" />
            <circle cx="38" r="5" fill="#d4a14a" />
            <circle cx="56" r="5" fill="#d4a14a" />
          </g>
        </svg>
      </div>
      <div className="title-content">
        <div className="title-eyebrow">A Caravan Game in the Wilderlands</div>
        <h1>The Long<br/>Apprenticeship</h1>
        <h2>Sycomore · Tornpost · Menneset · Thawmoot · Petalrun · Halois</h2>
        <p className="title-blurb">
          Every five years the apprentices walk to Halois to be licensed. This year, caravans are vanishing,
          Beasts abandoning their Keepers, and a quiet thing called <em>the Hollowing</em> dims the Lore
          wherever it touches. The Grand Keeper has summoned every party still on the road.
        </p>
        <div className="title-actions">
          {hasSave && !confirmDiscard && (
            <div className="title-resume">
              <button className="btn" onClick={onContinue}>Resume your journey</button>
              <button className="btn ghost small" onClick={() => setConfirmDiscard(true)}>or start a new caravan…</button>
            </div>
          )}
          {(!hasSave || confirmDiscard) && (
            <>
              <div className="title-diff">
                {["Apprentice","Keeper","Grand Keeper"].map(d => (
                  <button key={d} className={d===difficulty ? "on" : ""} onClick={() => setDifficulty(d)}>{d}</button>
                ))}
              </div>
              <button className="btn" onClick={() => { if (confirmDiscard) onDiscard?.(); onStart(difficulty); }}>
                {confirmDiscard ? "Abandon old & begin anew" : "Begin the Pilgrimage"}
              </button>
              {confirmDiscard && (
                <button className="btn ghost small" onClick={() => setConfirmDiscard(false)}>Keep the saved journey</button>
              )}
            </>
          )}
        </div>
        <div className="title-foot">— published this fortnight by The Keeper's Khronicle</div>
      </div>
    </div>
  );
}

window.TitleScreen = TitleScreen;
