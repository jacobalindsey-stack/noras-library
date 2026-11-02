// event-modal.jsx — displays an event, resolves a choice, then shows deltas
const { useState: useStateEM } = React;

function EventModal({ event, state, onResolve }){
  const [resolved, setResolved] = useStateEM(null);
  React.useEffect(() => { setResolved(null); window.WLAudio && window.WLAudio.play("open"); }, [event && event.id]);

  function pickChoice(choice){
    // Compute deltas — return { applied:[{label,delta,k}], text, party (mutated) }
    const applied = [];
    const partyDelta = []; // per-apprentice bond changes
    const stateDelta = {};
    const alive = state.party.filter(p => !p.lost);
    let messageBits = [];

    // Build a working copy of party for bond targeting
    const idxAlive = alive.map(p => state.party.indexOf(p));

    function addS(k, v){
      stateDelta[k] = (stateDelta[k]||0) + v;
    }

    for (const d of choice.deltas){
      const k = d.k, v = d.v;
      switch(k){
        case "provisions": case "lore": case "coin": case "morale":
        case "league": case "days": case "hollowing":
          addS(k, v);
          applied.push({ label: prettyKey(k), val: v });
          break;
        case "bondAll": {
          for (const idx of idxAlive) partyDelta.push({ idx, val: v });
          applied.push({ label: `All Bonds`, val: v });
          break;
        }
        case "bondRandom": {
          if (idxAlive.length){
            const idx = idxAlive[Math.floor(Math.random()*idxAlive.length)];
            partyDelta.push({ idx, val: v });
            applied.push({ label: `${state.party[idx].name}'s Bond`, val: v });
          }
          break;
        }
        case "bondRandomSet": {
          if (idxAlive.length){
            const idx = idxAlive[Math.floor(Math.random()*idxAlive.length)];
            const cur = state.party[idx].bond;
            partyDelta.push({ idx, set: v });
            applied.push({ label: `${state.party[idx].name}'s Bond`, val: v - cur });
          }
          break;
        }
        case "bondWeakest": {
          if (idxAlive.length){
            const idx = idxAlive.slice().sort((a,b)=> state.party[a].bond - state.party[b].bond)[0];
            partyDelta.push({ idx, val: v });
            applied.push({ label: `${state.party[idx].name}'s Bond`, val: v });
          }
          break;
        }
        case "bondWeakestSet": {
          if (idxAlive.length){
            const idx = idxAlive.slice().sort((a,b)=> state.party[a].bond - state.party[b].bond)[0];
            const cur = state.party[idx].bond;
            partyDelta.push({ idx, set: v });
            applied.push({ label: `${state.party[idx].name}'s Bond`, val: v - cur });
          }
          break;
        }
      }
    }

    setResolved({ choice, applied, stateDelta, partyDelta });
  }

  function commit(){
    onResolve(resolved);
  }

  if (resolved){
    return (
      <div className="overlay">
        <div className="event-card">
          <div className="event-head">
            <div className="tag">{event.tag}</div>
            <div className="day">Day {state.day}</div>
          </div>
          <div className="event-resolved">
            <p>{resolved.choice.flavor}</p>
            <div className="deltas">
              {resolved.applied.map((d,i) => (
                <div key={i} className={`delta ${d.val>0?"up":d.val<0?"down":""}`}>
                  {d.val>=0?"+":""}{d.val} {d.label}
                </div>
              ))}
              {resolved.applied.length === 0 && <div className="delta">No change</div>}
            </div>
            <button className="continue" onClick={commit}>Continue</button>
          </div>
        </div>
      </div>
    );
  }

  // Filter out specialty-locked choices the party doesn't have
  const partyHas = new Set(state.party.filter(p => !p.lost).map(p => p.specialty));
  const choices = event.choices.filter(c => !c.requiresSpecialty || partyHas.has(c.requiresSpecialty));

  return (
    <div className="overlay">
      <div className="event-card">
        <div className="event-head">
          <div className="tag">{event.tag}</div>
          <div className="day">Day {state.day} · league {Math.floor(state.league)}</div>
        </div>
        <div className="event-body">
          <h3>{event.title}</h3>
          <p>{event.text}</p>
          {event.journal && <p className="journal">{event.journal}</p>}
        </div>
        <div className="event-choices">
          {choices.map((c, i) => { const short = shortfall(c, state); return (
            <button key={i} className="choice" disabled={!!short} onClick={() => !short && pickChoice(c)}>
              <span>{c.label}</span>
              <span className="ch-flavor">{c.flavor}</span>
              {short && <span className="ch-cost">{short}</span>}
              {c.requiresSpecialty && (
                <span className="ch-cost">[{c.requiresSpecialty.toUpperCase()} only]</span>
              )}
            </button>
          ); })}
        </div>
      </div>
    </div>
  );
}

// A choice that spends Coin or Lore you don't have can't be taken.
function shortfall(choice, state){
  for (const d of choice.deltas || []){
    if ((d.k === "coin" || d.k === "lore") && d.v < 0 && (state[d.k] || 0) < -d.v)
      return `Needs ${-d.v} ${d.k === "coin" ? "coin" : "Lore"} · you have ${state[d.k] || 0}`;
  }
  return null;
}

function prettyKey(k){
  return { provisions:"Provisions", lore:"Lore", coin:"Coin", morale:"Morale", league:"Leagues", days:"Days", hollowing:"Hollowing" }[k] || k;
}

Object.assign(window, { EventModal, prettyKey, shortfall });
