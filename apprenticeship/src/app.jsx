// app.jsx — main state machine and game loop
const { useState: useStateApp, useEffect: useEffectApp, useRef: useRefApp } = React;

const TOTAL_LEAGUES = 2000;
const LEAGUES_PER_REGION = TOTAL_LEAGUES / 6;

const DIFF = {
  // hollowingBase: per-day passive rise · bondDrain: per-day base bond cost
  // startProv: provisions are a 0–100 stock, always begin full
  "Apprentice":   { hollowingBase: 0.8, bondDrain: 1.6, startCoin: 30, startProv: 100, startLore: 60, startMorale: 66 },
  "Keeper":       { hollowingBase: 1.2, bondDrain: 2.2, startCoin: 22, startProv: 100, startLore: 50, startMorale: 60 },
  "Grand Keeper": { hollowingBase: 1.8, bondDrain: 3.0, startCoin: 16, startProv: 100, startLore: 40, startMorale: 54 },
};

const PACE = {
  "Cautious": { leagues: 50,  bondDrainMul: 0.6, eventChance: 0.5,  hollowingMul: 0.7 },
  "Steady":   { leagues: 75,  bondDrainMul: 1.0, eventChance: 0.7,  hollowingMul: 1.0 },
  "Hurried":  { leagues: 110, bondDrainMul: 1.6, eventChance: 0.85, hollowingMul: 1.5 },
};
const RATION = {
  // perDay: provisions burned · bondMod: +heals / −frays bonds · moraleMod: daily morale shift
  "Meager":   { perDay: 2, bondMod: -1.5, moraleMod: -1.5 },
  "Standard": { perDay: 4, bondMod: 0,    moraleMod: 0 },
  "Generous": { perDay: 7, bondMod: 1.5,  moraleMod: 1.5 },
};
const WARD_COST = 18;   // Lore spent per Ward
const WARD_RELIEF = 12; // Hollowing removed per Ward

// Each region's town outpost — a guaranteed resupply stop once per leg.
const TOWN_OUTPOST = {
  woods:"w-cropring", sea:"s-tornpost", desert:"d-menneset",
  tundra:"t-thawmoot", jungle:"j-petalrun", mountains:"m-foothills",
};

function makeInitialState({ lead, party, difficulty }){
  const d = DIFF[difficulty];
  const { REGIONS, HOME_BONUS, OMENS, combineOmens } = window.WLData;
  const homeId = lead.home;
  const bonus = HOME_BONUS[homeId] || {};

  // Draw 2 distinct Omens — run modifiers that bend the rules all journey.
  const omens = window.WLUtil.pickN(OMENS.map(o => o.id), 2);
  const M = combineOmens(omens);

  // Always begin the full pilgrimage at The Woods (region 0) and cross all six.
  // Home is an *affinity* — a starting bonus + a morale lift while on home soil.
  const startProv = window.WLUtil.clamp(d.startProv + (bonus.provisions || 0) + (M.startProv || 0), 0, 100);
  const startLore = Math.max(0, d.startLore + (bonus.lore || 0) + (M.startLore || 0));
  const startCoin = Math.max(0, d.startCoin + (bonus.coin || 0) + (M.startCoin || 0));
  const startMorale = window.WLUtil.clamp(d.startMorale + (bonus.morale || 0) + (M.startMorale || 0), 0, 100);

  const base = {
    screen: "journey",
    difficulty,
    omens,                       // ids of this run's omens
    omensSeen: false,            // reveal card shown yet?
    homeRegion: homeId,
    homeNote: bonus.note || "",
    homeBonusPending: false, // becomes true the first time we enter the home leg
    homeBonusGiven: homeId === "woods", // Woods is the start; bonus applies immediately below
    lead: { ...lead, lost:false, bond:95 },
    party: party.map(p => ({ ...p, lost:false, bond:90 })),
    region: "woods",
    regionIdx: 0,
    regionProgress: 0,
    league: 0,
    day: 1,
    pace: "Steady",
    ration: "Standard",
    provisions: startProv,
    lore: startLore,
    coin: startCoin,
    morale: startMorale,
    hollowing: 0,
    hollowWarned: 0,          // last warning threshold crossed (70 / 90)
    reckoningPending: false,  // Grand-Keeper 100% encounter queued
    reckoningSurvived: 0,     // times the Reckoning was beaten this run
    sparedCount: 0,
    lostCount: 0,
    score: 0,
    usedEvents: [],
    // Per-leg tracking
    legStart: { day: 1, lore: startLore, coin: startCoin, lostCount: 0 },
    legLog: [],                  // completed-leg summaries
    legendaryFacedRegions: [],   // region ids whose legendary has been faced
    legendaryLog: [],            // { region, name, choice, outcome }
    townVisited: [],             // region ids whose town outpost (guaranteed resupply) has fired
    pendingEvent: null,
    pendingSkirmish: null,
    pendingKhronicle: null,
    pendingLegComplete: null,
    pendingLegendary: null,
    seenKhronicle: ["woods"],
    flavor: homeId === "woods"
      ? "Your home wood, hush-quiet and damp — and already the road makes it strange."
      : "Sycomore at your back, the long pilgrimage to Halois begins in The Woods.",
  };
  return base;
}

// Scale a skirmish event's foe by an Omen multiplier (tougher / gentler Beasts).
function scaleSkirmish(ev, mul){
  if (!ev || !ev.skirmish || !mul || mul === 1) return ev;
  return {
    ...ev,
    skirmish: {
      ...ev.skirmish,
      hp: Math.max(20, Math.round(ev.skirmish.hp * mul)),
      attack: Math.max(3, Math.round(ev.skirmish.attack * mul)),
    },
  };
}

function homeFlavor(id){
  return {
    woods:     "Damp mosses, hush-quiet pines — your home, but already strange behind you.",
    sea:       "Salt wind at your back, the Tornpost light fading into mist.",
    desert:    "The Menneset bells fall away. Sand reaches to every horizon.",
    tundra:    "Thawmoot dwindles on the ice. Your breath crystallizes already.",
    jungle:    "Petalrun's canopy closes overhead. The forest hums with too many eyes.",
    mountains: "The high passes rise around you — the long road to Halois has begun.",
  }[id] || "Your caravan sets out for Halois.";
}

function App(){
  const [screen, setScreen] = useStateApp("title");
  const [difficulty, setDifficulty] = useStateApp("Keeper");
  const [state, setState] = useStateApp(null);
  const [toasts, setToasts] = useStateApp([]);
  const [dayNight, setDayNight] = useStateApp("day");
  const [endingKind, setEndingKind] = useStateApp(null);
  const [savedAt, setSavedAt] = useStateApp(null);
  const [hasSavedRun, setHasSavedRun] = useStateApp(() => window.WLUtil.hasSave());

  // Auto-save whenever journey state changes meaningfully
  useEffectApp(() => {
    if (screen !== "journey" || !state) return;
    const ok = window.WLUtil.saveGame({ state, difficulty, dayNight });
    if (ok){ setSavedAt(Date.now()); setHasSavedRun(true); }
  }, [state, screen, difficulty, dayNight]);

  // Ambient audio pad — follows biome + day/night while on the journey
  useEffectApp(() => {
    if (!window.WLAudio) return;
    if (screen === "journey" && state){
      window.WLAudio.startAmbient(state.region, dayNight);
    } else {
      window.WLAudio.stopAmbient();
    }
    return () => window.WLAudio && window.WLAudio.stopAmbient();
  }, [screen, state && state.region, dayNight]);

  function addToast(label, val){
    const id = window.WLUtil.uid();
    setToasts(ts => [...ts, { id, label, val }]);
    setTimeout(() => setToasts(ts => ts.filter(t => t.id !== id)), 2200);
  }

  // ----- Flow handlers -----
  function startCreation(diff){
    if (diff === null){ setScreen("title"); return; }
    setDifficulty(diff);
    setScreen("briefing");
  }
  function startRun(payload){
    if (!payload){ setScreen("title"); return; }
    const init = makeInitialState(payload);
    setState(init);
    setEndingKind(null);
    setDayNight("day");
    setScreen("journey");
  }
  function continueRun(){
    const saved = window.WLUtil.loadGame();
    if (!saved) return;
    setDifficulty(saved.difficulty || "Keeper");
    setState(saved.state);
    setDayNight(saved.dayNight || "day");
    setEndingKind(null);
    setScreen("journey");
  }
  function discardSave(){
    window.WLUtil.clearSave();
    setHasSavedRun(false);
    setSavedAt(null);
  }
  function saveAndQuit(){
    if (state) window.WLUtil.saveGame({ state, difficulty, dayNight });
    setHasSavedRun(true);
    setScreen("title");
  }

  // Pick an event for current region/state, honoring day/night
  function pickEvent(s){
    const { EVENTS_BY_BIOME } = window.WLData;
    const okTime = e => !e.when || e.when === dayNight;
    const biomePool = (EVENTS_BY_BIOME[s.region] || []).filter(e => !s.usedEvents.includes(e.id) && okTime(e));
    const anyPool = (EVENTS_BY_BIOME.any || []).filter(e => !s.usedEvents.includes(e.id) && okTime(e));
    const useBiome = biomePool.length && (Math.random() < 0.75 || !anyPool.length);
    const pool = useBiome ? biomePool : (anyPool.length ? anyPool : biomePool);
    if (!pool.length) return null;
    return pool[Math.floor(Math.random()*pool.length)];
  }

  // Choose a legendary for a region, varying by day/night so runs differ
  function pickLegendary(regionId){
    const data = window.WLData.LEGENDARIES[regionId];
    if (!data) return null;
    if (Array.isArray(data)){
      const timed = data.filter(l => !l.when || l.when === dayNight);
      const pool = timed.length ? timed : data;
      return pool[Math.floor(Math.random()*pool.length)];
    }
    return data; // legacy single object
  }

  function applyDeltas(s, stateDelta, partyDelta, applied){
    let next = { ...s };
    const M = window.WLData.combineOmens(s.omens);
    for (const [k, v] of Object.entries(stateDelta)){
      // Omens can amplify resupply: positive provisions gains scale by resupplyMul
      let val = v;
      if (k === "provisions" && v > 0 && M.resupplyMul && M.resupplyMul !== 1){
        val = Math.round(v * M.resupplyMul);
      }
      if (k === "league" || k === "days" || k === "hollowing" || k === "sparedCount"){
        next[k === "league" ? "league" : k === "days" ? "day" : k === "hollowing" ? "hollowing" : "sparedCount"] =
          (next[k === "league" ? "league" : k === "days" ? "day" : k === "hollowing" ? "hollowing" : "sparedCount"] || 0) + val;
      } else if (k in next){
        next[k] = (next[k] || 0) + val;
      }
    }
    // Clamp
    next.morale = window.WLUtil.clamp(next.morale, 0, 100);
    next.hollowing = window.WLUtil.clamp(next.hollowing, 0, 100);
    next.lore = Math.max(0, next.lore);
    next.coin = Math.max(0, next.coin);
    next.provisions = window.WLUtil.clamp(next.provisions, 0, 100);

    // Apply bond changes (clone party array)
    const party = next.party.map(p => ({...p}));
    const lead = {...next.lead};
    function getByIdx(idx){
      if (idx === -1) return lead;
      return party[idx];
    }
    // map idx 0 = lead, 1..3 = party. But effect system used state.party indices for the *party* array;
    // we'll merge lead and party into a combined view for delta application:
    const combined = [lead, ...party];
    for (const d of partyDelta){
      if (d.idxAll){
        combined.forEach(c => {
          if (!c.lost){
            if (d.set != null) c.bond = window.WLUtil.clamp(d.set, 0, 100);
            else c.bond = window.WLUtil.clamp(c.bond + d.val, 0, 100);
          }
        });
      } else {
        // d.idx referred to position in state.party, which already includes lead at top in events?
        // In events we built idxAlive from state.party — but state.party DOES NOT contain lead.
        // So index 0..2 = companions. We map those to party array.
        const target = party[d.idx];
        if (target && !target.lost){
          if (d.set != null) target.bond = window.WLUtil.clamp(d.set, 0, 100);
          else target.bond = window.WLUtil.clamp(target.bond + d.val, 0, 100);
        }
      }
    }
    next.party = party;
    next.lead = lead;

    // Toast announcements for applied
    if (applied){
      for (const a of applied){
        addToast(a.label, a.val);
      }
    }
    return next;
  }

  function resolveEvent(resolved){
    setState(s => {
      let next = applyDeltas(s, resolved.stateDelta, resolved.partyDelta, resolved.applied);
      const ev = s.pendingEvent || s.pendingSkirmish;
      if (ev) next.usedEvents = [...s.usedEvents, ev.id];
      next.pendingEvent = null;
      next.pendingSkirmish = null;

      // The Reckoning (Grand-Keeper 100% encounter) resolves specially
      if (ev && ev.id === "reckoning"){
        const won = resolved.kind === "defeat" || resolved.kind === "spared" || resolved.kind === "bonded";
        if (won){
          next.hollowing = 40;
          next.reckoningPending = false;
          next.reckoningSurvived = (s.reckoningSurvived || 0) + 1;
          next.hollowWarned = 0;
          next.flavor = "You drove the silence back. It will return — but not today.";
          window.WLAudio && window.WLAudio.play("victory");
          addToast("The Hollowing repelled", +1);
        } else {
          window.WLAudio && window.WLAudio.play("hollowwarn");
          setEndingKind("hollowed");
          setScreen("ending");
          return next;
        }
      } else {
        // Ordinary event: a small sound cue by net outcome
        const net = (resolved.applied || []).reduce((a,d)=> a + (typeof d.val === "number" ? d.val : 0), 0);
        window.WLAudio && window.WLAudio.play(net >= 0 ? "good" : "bad");
      }
      next = checkLosses(next);
      next = maybeEnd(next);
      return next;
    });
  }

  // Player-controlled defense against the Hollowing — spend Lore to ward it.
  function wardHollowing(){
    setState(s => {
      const M = window.WLData.combineOmens(s.omens);
      const cost = Math.max(4, Math.round(WARD_COST * M.wardCostMul));
      const reliefFull = Math.round(WARD_RELIEF * M.wardReliefMul);
      if (s.lore < cost || s.hollowing <= 0) return s;
      window.WLAudio && window.WLAudio.play("ward");
      const relief = Math.min(reliefFull, s.hollowing);
      addToast("Lore", -cost);
      addToast("Hollowing warded", -relief);
      return {
        ...s,
        lore: Math.max(0, s.lore - cost),
        hollowing: window.WLUtil.clamp(s.hollowing - reliefFull, 0, 100),
        hollowWarned: s.hollowing - reliefFull < 70 ? 0 : s.hollowWarned,
        morale: window.WLUtil.clamp(s.morale + 2, 0, 100),
      };
    });
  }

  function checkLosses(s){
    let lostThisStep = 0;
    const part = s.party.map(p => {
      if (!p.lost && p.bond <= 0){ lostThisStep++; return { ...p, lost:true, bond:0 }; }
      return p;
    });
    const lead = (!s.lead.lost && s.lead.bond <= 0)
      ? (lostThisStep++, { ...s.lead, lost:true, bond:0 })
      : s.lead;
    if (lostThisStep > 0){
      addToast("A Bond broke", -lostThisStep);
      window.WLAudio && window.WLAudio.play("bondbreak");
      // A breaking Bond feeds the silence and shakes the caravan
      return {
        ...s, party: part, lead,
        lostCount: s.lostCount + lostThisStep,
        hollowing: window.WLUtil.clamp(s.hollowing + 6 * lostThisStep, 0, 100),
        morale: window.WLUtil.clamp(s.morale - 12 * lostThisStep, 0, 100),
      };
    }
    return { ...s, party: part, lead };
  }

  function maybeEnd(s){
    const aliveCount = s.party.filter(p=>!p.lost).length + (s.lead.lost?0:1);
    if (aliveCount <= 0){
      setEndingKind("broken");
      setScreen("ending");
      return s;
    }
    if (s.hollowing >= 100){
      // Grand Keeper gets a fighting chance: the risky Reckoning encounter.
      if (s.difficulty === "Grand Keeper"){
        if (!s.reckoningPending && !s.pendingSkirmish){
          window.WLAudio && window.WLAudio.play("hollowwarn");
          return {
            ...s, reckoningPending:true, hollowing:99,
            pendingSkirmish: window.WLData.RECKONING,
            flavor:"The Hollowing crests. A shape of pure silence unfolds across the trail to meet you.",
          };
        }
        // already in the Reckoning — hold at 99 until it resolves
        return s;
      }
      // Other modes: a BAD but survivable consequence — a Bond is torn away,
      // morale collapses, and the silence is beaten back only partway.
      const alive = [{p:s.lead, lead:true}, ...s.party.map((p,i)=>({p,i,lead:false}))].filter(x=>!x.p.lost);
      if (alive.length){
        const weakest = alive.slice().sort((a,b)=>a.p.bond-b.p.bond)[0];
        let party = s.party.map(p=>({...p}));
        let lead = {...s.lead};
        if (weakest.lead) lead.lost = true, lead.bond = 0;
        else { party[weakest.i].lost = true; party[weakest.i].bond = 0; }
        window.WLAudio && window.WLAudio.play("bondbreak");
        addToast("The Hollowing took one of you", -1);
        const after = {
          ...s, party, lead,
          lostCount: s.lostCount + 1,
          hollowing: 70,
          morale: window.WLUtil.clamp(s.morale - 25, 0, 100),
          flavor:"The Hollowing crests — and when it recedes, one of your caravan is simply… gone.",
        };
        const stillAlive = after.party.filter(p=>!p.lost).length + (after.lead.lost?0:1);
        if (stillAlive <= 0){ setEndingKind("hollowed"); setScreen("ending"); }
        return after;
      }
      setEndingKind("hollowed");
      setScreen("ending");
      return s;
    }
    if (s.regionIdx >= 5 && s.regionProgress >= 100){
      setEndingKind("halois");
      window.WLAudio && window.WLAudio.play("arrive");
      setScreen("ending");
      return s;
    }
    return s;
  }

  function advance(){
    setState(s => {
      if (s.pendingEvent || s.pendingSkirmish || s.pendingKhronicle) return s;

      const D = DIFF[s.difficulty];
      const P = PACE[s.pace];
      const R = RATION[s.ration];
      const M = window.WLData.combineOmens(s.omens);

      let next = { ...s };
      // Time + distance (Omens can speed/slow the march)
      const leagues = P.leagues * M.leagueMul;
      next.day = s.day + 1;
      next.league = s.league + leagues;

      // Region progression
      const startLeague = LEAGUES_PER_REGION * s.regionIdx;
      const progress = Math.max(0, Math.min(100, ((next.league - startLeague) / LEAGUES_PER_REGION) * 100));
      next.regionProgress = progress;

      // Crossed into next region? Build a leg summary, then advance the region.
      let crossedTo = null;
      let legSummary = null;
      if (next.regionProgress >= 100 && next.regionIdx < 5){
        const leavingIdx = s.regionIdx;
        const leaving = window.WLData.REGIONS[leavingIdx];
        const ls = s.legStart || { day:1, lore:next.lore, coin:next.coin, lostCount:0 };
        const legend = (s.legendaryLog || []).find(l => l.region === leaving.id) || null;
        legSummary = {
          id: leaving.id,
          name: leaving.name,
          capital: leaving.capital,
          index: leavingIdx,
          days: Math.max(1, next.day - ls.day),
          loreDelta: next.lore - ls.lore,
          coinDelta: next.coin - ls.coin,
          bondsLost: next.lostCount - ls.lostCount,
          legendary: legend ? { name: legend.name, choice: legend.choiceLabel, outcome: legend.outcome } : null,
        };
        // Score the leg: surviving the leg + lore gained + meeting the legendary cleanly
        const legScore = 60
          + Math.max(0, legSummary.loreDelta) * 2
          - legSummary.bondsLost * 40
          + (legend ? 30 : 0);
        legSummary.score = Math.max(0, Math.round(legScore));
        next.score = (s.score || 0) + legSummary.score;
        next.legLog = [...(s.legLog || []), legSummary];

        // Advance region
        next.regionIdx = leavingIdx + 1;
        next.region = window.WLData.REGIONS[next.regionIdx].id;
        const newStart = LEAGUES_PER_REGION * next.regionIdx;
        next.regionProgress = Math.max(0, Math.min(100, ((next.league - newStart) / LEAGUES_PER_REGION) * 100));
        crossedTo = next.region;
        next.flavor = `You cross into ${window.WLData.REGIONS[next.regionIdx].name}.`;

        // Reset per-leg snapshot for the new region
        next.legStart = { day: next.day, lore: next.lore, coin: next.coin, lostCount: next.lostCount };

        // Home affinity: a lift the first time the caravan reaches the home land
        if (next.region === s.homeRegion && !s.homeBonusGiven){
          next.homeBonusGiven = true;
          next.morale = window.WLUtil.clamp(next.morale + 12, 0, 100);
          next.party = next.party.map(p => p.lost ? p : { ...p, bond: window.WLUtil.clamp(p.bond + 8, 0, 100) });
          next.lead = next.lead.lost ? next.lead : { ...next.lead, bond: window.WLUtil.clamp(next.lead.bond + 8, 0, 100) };
          next.flavor = `Home soil — ${window.WLData.REGIONS[next.regionIdx].name}. The caravan walks taller.`;
        }
      }

      // ---- Provisions (0–100 stock) — Omens shift the burn rate ----
      const eaten = Math.max(1, Math.round(R.perDay * M.provDrainMul));
      next.provisions = window.WLUtil.clamp(s.provisions - eaten, 0, 100);
      const starving = next.provisions <= 0;
      const lowProv = next.provisions > 0 && next.provisions < 20;

      // ---- Morale: responds to rations, hunger, hollowing dread (+ Omen drift) ----
      let moraleShift = R.moraleMod + (M.moraleDay || 0);
      if (starving) moraleShift -= 5;            // empty bellies sink spirits fast
      else if (lowProv) moraleShift -= 1.5;
      if (next.hollowing > 70) moraleShift -= 2; // the dread of the silence
      else if (next.hollowing > 45) moraleShift -= 1;
      next.morale = window.WLUtil.clamp((next.morale ?? s.morale) + moraleShift, 0, 100);
      const morale = next.morale;

      // ---- Bonds: a clear daily cost shaped by pace, food, morale, hollowing ----
      // Generous rations + high morale + low hollowing can net a small RECOVERY.
      let drain = D.bondDrain * P.bondDrainMul * M.bondDrainMul;  // base cost of the march
      drain -= R.bondMod;                            // Generous heals, Meager frays
      if (starving) drain += 3;                      // starvation frays Bonds
      if (morale < 25) drain += 2.5;                 // despair frays Bonds
      else if (morale > 70) drain -= 1.5;            // high spirits ease the march
      drain += (next.hollowing / 100) * 3;           // the silence gnaws at Bonds
      const party = next.party.map(p => p.lost ? p : { ...p, bond: window.WLUtil.clamp(p.bond - drain, 0, 100) });
      let lead = next.lead.lost ? next.lead : { ...next.lead, bond: window.WLUtil.clamp(next.lead.bond - drain, 0, 100) };
      next.party = party;
      next.lead = lead;

      // ---- Hollowing: steady passive rise + hunger/despair accelerate it (× Omen) ----
      let hTick = D.hollowingBase * P.hollowingMul * M.hollowingMul;
      if (starving) hTick += 1.5;
      if (morale < 25) hTick += 1.0;
      next.hollowing = window.WLUtil.clamp((next.hollowing ?? s.hollowing) + hTick, 0, 100);

      // Toasts + march sound
      window.WLAudio && window.WLAudio.play("march");
      addToast(`Day ${next.day}`, null);
      addToast("Provisions", -eaten);
      if (drain < 0) addToast("Bonds recover", +Math.round(-drain));

      // Hollowing threshold warnings (a chime + a word of dread)
      const prevWarned = s.hollowWarned || 0;
      if (next.hollowing >= 90 && prevWarned < 90){
        next.hollowWarned = 90;
        window.WLAudio && window.WLAudio.play("hollowwarn");
        addToast("The Hollowing is nearly upon you", -1);
      } else if (next.hollowing >= 70 && prevWarned < 70){
        next.hollowWarned = 70;
        window.WLAudio && window.WLAudio.play("hollowwarn");
        addToast("The Hollowing is spreading", -1);
      }

      // Check losses from drain
      next = checkLosses(next);

      // Modal priority on a march:
      //   1. Leg-Complete chapter card (then it chains to the Khronicle)
      //   2. Legendary capstone (fires once per leg, near its end)
      //   3. Khronicle (if no leg card queued it)
      //   4. Random road event
      const facedLegendary = (next.legendaryFacedRegions || []).includes(next.region);
      const townId = TOWN_OUTPOST[next.region];
      const townDue = townId
        && !(next.townVisited || []).includes(next.region)
        && !next.usedEvents.includes(townId)
        && next.regionProgress >= 28;
      if (legSummary){
        next.pendingLegComplete = legSummary;
        // Remember which Khronicle to show after the chapter card
        if (crossedTo && !s.seenKhronicle.includes(crossedTo)){
          next._khronicleAfterLeg = crossedTo;
          next.seenKhronicle = [...s.seenKhronicle, crossedTo];
        }
      } else if (townDue){
        // Guaranteed town stop — reliable resupply once per leg
        const ev = window.WLData.EVENTS_BY_ID[townId];
        if (ev){
          next.pendingEvent = ev;
          next.townVisited = [...(next.townVisited || []), next.region];
        }
      } else if (!facedLegendary && next.regionProgress >= 68 && window.WLData.LEGENDARIES[next.region]){
        const leg = pickLegendary(next.region);
        if (leg){
          next.legendaryFacedRegions = [...(next.legendaryFacedRegions || []), next.region];
          next.pendingLegendary = { region: next.region, ...leg };
          window.WLAudio && window.WLAudio.play("legendary");
        }
      } else if (crossedTo && !s.seenKhronicle.includes(crossedTo)){
        next.pendingKhronicle = crossedTo;
        next.seenKhronicle = [...s.seenKhronicle, crossedTo];
      } else if (Math.random() < Math.min(0.95, P.eventChance * M.eventChanceMul)){
        const ev = pickEvent(next);
        if (ev){
          if (ev.skirmish) next.pendingSkirmish = scaleSkirmish(ev, M.skirmishMul);
          else next.pendingEvent = ev;
        }
      }

      next = maybeEnd(next);
      return next;
    });
  }

  function camp(){
    setState(s => {
      let next = { ...s };
      next.day = s.day + 1;
      const cost = RATION[s.ration].perDay;
      next.provisions = window.WLUtil.clamp(s.provisions - cost, 0, 100);
      const fed = next.provisions > 0;
      // Resting is the player's main Bond recovery — but only works when fed.
      const M = window.WLData.combineOmens(s.omens);
      const restHeal = Math.round(((fed ? 7 : 3) + (s.morale > 60 ? 3 : 0)) * M.campHealMul);
      next.morale = window.WLUtil.clamp(next.morale + (fed ? 5 : 1), 0, 100);
      next.party = next.party.map(p => p.lost ? p : { ...p, bond: window.WLUtil.clamp(p.bond + restHeal, 0, 100) });
      next.lead = next.lead.lost ? next.lead : { ...next.lead, bond: window.WLUtil.clamp(next.lead.bond + restHeal, 0, 100) };
      // The silence does not rest with you
      next.hollowing = window.WLUtil.clamp(next.hollowing + DIFF[s.difficulty].hollowingBase * 0.5, 0, 100);
      window.WLAudio && window.WLAudio.play("camp");
      addToast(fed ? "Camped — Bonds steadied" : "Camped hungry — little rest", +restHeal);
      addToast("Provisions", -cost);
      next = maybeEnd(next);
      return next;
    });
  }

  function closeKhronicle(){
    setState(s => ({ ...s, pendingKhronicle: null }));
  }

  function closeLegComplete(){
    setState(s => {
      const next = { ...s, pendingLegComplete: null };
      // Chain into the new region's Khronicle if one was queued
      if (s._khronicleAfterLeg){
        next.pendingKhronicle = s._khronicleAfterLeg;
        next._khronicleAfterLeg = null;
      }
      return next;
    });
  }

  function resolveLegendary(choice){
    setState(s => {
      const leg = s.pendingLegendary;
      if (!leg) return s;
      // Translate legendary deltas into the same shape applyDeltas expects
      const stateDelta = {};
      const partyDelta = [];
      const applied = [];
      const alive = s.party.filter(p => !p.lost);
      const idxAlive = alive.map(p => s.party.indexOf(p));
      const pretty = { provisions:"Provisions", lore:"Lore", coin:"Coin", morale:"Morale", league:"Leagues", days:"Days", hollowing:"Hollowing" };
      for (const d of choice.deltas){
        if (d.k === "bondAll"){
          for (const idx of idxAlive) partyDelta.push({ idx, val: d.v });
          applied.push({ label:"All Bonds", val:d.v });
        } else if (d.k === "bondRandom"){
          if (idxAlive.length){
            const idx = idxAlive[Math.floor(Math.random()*idxAlive.length)];
            partyDelta.push({ idx, val:d.v });
            applied.push({ label:`${s.party[idx].name}'s Bond`, val:d.v });
          }
        } else {
          stateDelta[d.k] = (stateDelta[d.k]||0) + d.v;
          applied.push({ label: pretty[d.k] || d.k, val:d.v });
        }
      }
      let next = applyDeltas(s, stateDelta, partyDelta, applied);
      next.score = (next.score || 0) + (choice.score || 0);
      next.legendaryLog = [...(s.legendaryLog || []), {
        region: leg.region, name: leg.name, choiceLabel: choice.label, outcome: choice.result, score: choice.score || 0,
      }];
      next.pendingLegendary = null;
      window.WLAudio && window.WLAudio.play(choice.score >= 120 ? "victory" : "good");
      addToast(`${leg.name} faced`, +(choice.score || 0));
      next = checkLosses(next);
      next = maybeEnd(next);
      return next;
    });
  }

  function restart(){
    window.WLUtil.clearSave();
    setHasSavedRun(false);
    setSavedAt(null);
    setState(null);
    setEndingKind(null);
    setScreen("title");
  }

  // ----- Render -----
  if (screen === "title"){
    return (<>
      <TitleScreen onStart={startCreation} hasSave={hasSavedRun} onContinue={continueRun} onDiscard={discardSave} />
      <Tweaks />
    </>);
  }
  if (screen === "briefing"){
    return (<>
      <Briefing onContinue={() => setScreen("creation")} onBack={() => setScreen("title")} />
      <Tweaks />
    </>);
  }
  if (screen === "creation"){
    return (<>
      <CharacterCreation difficulty={difficulty} onStart={startRun} />
      <Tweaks />
    </>);
  }
  if (screen === "ending"){
    return (<>
      <Ending state={state} kind={endingKind} onRestart={restart} />
      <Tweaks />
    </>);
  }
  // journey
  const wardMods = state ? window.WLData.combineOmens(state.omens) : null;
  const effWardCost = wardMods ? Math.max(4, Math.round(WARD_COST * wardMods.wardCostMul)) : WARD_COST;
  const effWardRelief = wardMods ? Math.round(WARD_RELIEF * wardMods.wardReliefMul) : WARD_RELIEF;
  return (
    <div className="app">
      <Journey
        state={state}
        setState={setState}
        onAdvance={advance}
        onCamp={camp}
        onWard={wardHollowing}
        wardCost={effWardCost}
        wardRelief={effWardRelief}
        onSaveQuit={saveAndQuit}
        savedAt={savedAt}
        toasts={toasts}
        dayNight={dayNight}
        setDayNight={setDayNight}
      />
      {!state.omensSeen && state.omens && state.omens.length > 0 &&
        !state.pendingEvent && !state.pendingSkirmish && !state.pendingKhronicle &&
        !state.pendingLegComplete && !state.pendingLegendary && (
        <OmenReveal omens={state.omens} onContinue={() => setState(s => ({ ...s, omensSeen:true }))} />
      )}
      {state.pendingEvent && (
        <EventModal key={state.pendingEvent.id} event={state.pendingEvent} state={state} onResolve={resolveEvent} />
      )}
      {state.pendingSkirmish && (
        <Skirmish key={state.pendingSkirmish.id} event={state.pendingSkirmish} state={state} onResolve={resolveEvent} />
      )}
      {state.pendingLegendary && (
        <LegendaryEncounter key={state.pendingLegendary.region} data={state.pendingLegendary} onResolve={resolveLegendary} />
      )}
      {state.pendingLegComplete && (
        <LegComplete summary={state.pendingLegComplete} state={state} onContinue={closeLegComplete} />
      )}
      {state.pendingKhronicle && (
        <Khronicle regionId={state.pendingKhronicle} state={state} dayNight={dayNight} onContinue={closeKhronicle} />
      )}
      <Tweaks />
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);
