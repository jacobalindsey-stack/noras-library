// character-creation.jsx — name, home region, starter Beast, party preview
const { useState: useStateCC, useMemo: useMemoCC } = React;

function CharacterCreation({ difficulty, onStart }){
  const { REGIONS, BEASTS, NAMES_FIRST, NAMES_LAST, SPECIALTIES, HOME_BONUS } = window.WLData;
  const { pick, pickN } = window.WLUtil;

  function bonusTag(id){
    const b = HOME_BONUS[id] || {};
    const parts = [];
    if (b.lore)       parts.push(`+${b.lore} Lore`);
    if (b.provisions) parts.push(`+${b.provisions} Prov`);
    if (b.coin)       parts.push(`+${b.coin} Coin`);
    if (b.morale)     parts.push(`+${b.morale} Morale`);
    return parts.join(" · ");
  }

  const [name, setName] = useStateCC("");
  const [region, setRegion] = useStateCC("woods");
  const [beastIdx, setBeastIdx] = useStateCC(0);

  // Generate a stable party of 3 companions
  const party = useMemoCC(() => {
    const used = new Set([region]);
    const others = REGIONS.filter(r => !used.has(r.id));
    const partyRegs = pickN(others, 3);
    return partyRegs.map((r, i) => {
      const beast = pick(BEASTS[r.id]);
      const spec = SPECIALTIES[i % SPECIALTIES.length];
      const first = pick(NAMES_FIRST);
      const last = pick(NAMES_LAST);
      return {
        id: window.WLUtil.uid(),
        name: `${first} ${last}`,
        home: r.id,
        beast,
        specialty: spec.id,
        specialtyName: spec.name,
        hue: (Math.random()*360)|0,
        bond: 90,
      };
    });
  }, [region]);

  const currentRegion = REGIONS.find(r => r.id === region);
  const beasts = BEASTS[region];
  const beast = beasts[beastIdx];
  const valid = name.trim().length > 0;

  function begin(){
    if (!valid) return;
    const lead = {
      id: window.WLUtil.uid(),
      name: name.trim(),
      home: region,
      beast,
      specialty: "scholar", // player gets scholar (so they always have one)
      specialtyName: "Scholar",
      hue: 50,
      bond: 95,
      isLead: true,
    };
    onStart({ lead, party, difficulty });
  }

  return (
    <div className="creation">
      <div className="creation-head">
        <div className="eyebrow">Roster — {difficulty}</div>
        <h2>Form your caravan</h2>
      </div>
      <div className="creation-body">
        <div className="field">
          <label>Your name, apprentice</label>
          <input
            value={name}
            placeholder="e.g. Mira Holloway"
            onChange={e => setName(e.target.value)}
            maxLength={32}
          />
        </div>

        <div className="field">
          <label>Birthplace — a starting bonus, <em>not</em> your route (every caravan walks The Woods → Halois)</label>
          <div className="region-grid">
            {REGIONS.map(r => (
              <button key={r.id} className={`region-card ${r.id===region ? "on" : ""}`}
                onClick={() => { setRegion(r.id); setBeastIdx(0); }}>
                <div style={{display:"flex", alignItems:"center", gap:8}}>
                  <span className="region-icon" style={{color: r.id===region ? "var(--gold)" : "var(--ink-dim)"}}><RegionIcon id={r.id} size={22} /></span>
                  <div className="rname">{r.name}</div>
                </div>
                <div className="rlore"><span className="rbonus">{bonusTag(r.id)}</span> · {r.lore}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="field">
          <label>Your bonded Beast — chosen from {currentRegion.name}</label>
          <div className="beast-grid">
            {beasts.map((b, i) => (
              <button key={b.name} className={`beast-card ${i===beastIdx ? "on" : ""}`}
                onClick={() => setBeastIdx(i)}>
                <div className="beast-portrait"><BeastSilhouette glyph={b.glyph} color={b.color} size={56} /></div>
                <div className="bname">{b.name}</div>
                <div className="btag">{b.kind}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="field">
          <label>Your fellow apprentices — assigned by the Guild</label>
          <div className="party-preview">
            {party.map(p => (
              <div className="party-mini" key={p.id}>
                <div className="pp"><ApprenticePortrait hue={p.hue} size={44} /></div>
                <div>
                  <div className="pn">{p.name}</div>
                  <div className="ps">{p.beast.name} the {p.beast.kind} · {p.specialtyName}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="creation-actions">
          <button className="btn ghost" onClick={() => onStart(null)}>Back</button>
          <button className="btn" onClick={begin} disabled={!valid}>Set out for Halois</button>
        </div>
      </div>
    </div>
  );
}

window.CharacterCreation = CharacterCreation;
