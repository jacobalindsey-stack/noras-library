/* ============================================================
   game-state.jsx — state model, persistence, actions, selectors
   Single source of truth. Exposed via GameCtx + useGameStore().
   ============================================================ */
const SAVE_KEY = 'catbakery.save.v2';
/* The Hall of Fame lives in its OWN key so it survives a New Game / reset. */
const HOF_KEY = 'catbakery.hof.v1';
function loadHighScores(){
  try { const raw = localStorage.getItem(HOF_KEY); if (raw) return JSON.parse(raw); } catch(e){}
  return [];
}
function saveHighScore(entry){
  const list = loadHighScores();
  list.push(entry);
  list.sort((a,b) => (b.rep - a.rep) || (b.sold - a.sold) || (b.ts - a.ts));
  const top = list.slice(0, 8);
  try { localStorage.setItem(HOF_KEY, JSON.stringify(top)); } catch(e){}
  return top;
}

function freshState() {
  return {
    bleps: 60,
    rep: 0,
    inv: { flour:2, sugar:1, butter:1, milk:0, egg:1, cinnamon:0, frosting:0, jam:0 },
    tools: ['mixingBowl'],
    caseItems: [],          // {uid,type,art,sparkly,value}
    helpers: [],            // {uid,type,art,sparkly}
    pending: [],            // freshly baked, await STOCK/ADOPT
    skill: {},              // recipeId -> xp
    quests: Object.fromEntries(Object.keys(QUESTS).map(id => [id, 'locked'])),
    metCustomers: [],       // character ids
    visitsSeen: [],         // visit ids consumed
    critMacaronMade: false,
    critBakes: {},          // recipeId -> true once a crit-success of it is baked
    session: { sold:0, earned:0, customers:0 },
    cityServes: 0,          // patrons served while at the Big City (finale gate)
    won: false,
    seenIntro: false,
  };
}

function loadState() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (raw) return { ...freshState(), ...JSON.parse(raw) };
  } catch(e){}
  return freshState();
}

/* ---------- pure selectors ---------- */
function levelFromRep(rep) {
  let lvl = 1;
  for (let i=1; i<=MAX_LEVEL; i++) if (rep >= LEVEL_THRESHOLDS[i]) lvl = i;
  return lvl;
}
function repBand(rep) {
  const lvl = levelFromRep(rep);
  const base = LEVEL_THRESHOLDS[lvl];
  const next = lvl < MAX_LEVEL ? LEVEL_THRESHOLDS[lvl+1] : base;
  const span = Math.max(1, next - base);
  return { lvl, base, next, into: rep - base, span, pct: lvl<MAX_LEVEL ? Math.min(1,(rep-base)/span) : 1, atMax: lvl>=MAX_LEVEL };
}
function caseCapacity(st){ return 4 + (st.tools.includes('displayCase')?2:0); }
/* helper (adoption) capacity — the alley garage / food truck only have room for two
   dozing cats. Once you move up to a real storefront (the Corner Bakery, Lvl 3),
   the extra space opens up the 3rd and 4th adoption slots.                       */
function helperCap(st){ return levelFromRep(st.rep) >= 3 ? 4 : 2; }

/* ---------- FINALE gating ----------
   The legendary Cinnamon Roll Cat can only be baked once the baker has truly
   earned it: reach the Big City, own the Proofing Oven, finish EVERY special
   order, and keep the grand pâtisserie humming for a good while.            */
const CITY_PATRONS_NEEDED = 12;   // patrons to serve at the Big City before the finale
function allQuestsDone(st){ return Object.values(st.quests).every(s => s === 'done'); }
function finaleChecklist(st){
  const lvl = levelFromRep(st.rep);
  const doneQ = Object.values(st.quests).filter(s=>s==='done').length;
  const totalQ = Object.keys(QUESTS).length;
  const items = [
    { key:'venue',  label:'Open the Big City P\u00e2tisserie', short:'Big City P\u00e2tisserie', done: lvl>=5,
      detail: lvl>=5?'Open':'Reach Lvl 5' },
    { key:'oven',   label:'Install the Proofing Oven', short:'Proofing Oven', done: st.tools.includes('proofingOven'),
      detail: st.tools.includes('proofingOven')?'Owned':'Upgrades' },
    { key:'quests', label:'Complete every Special Order', short:'Special Orders', done: allQuestsDone(st),
      detail: `${doneQ}/${totalQ}` },
    { key:'city',   label:'Serve the city\u2019s patrons', short:'Serve patrons', done: st.cityServes>=CITY_PATRONS_NEEDED,
      detail: `${Math.min(st.cityServes,CITY_PATRONS_NEEDED)}/${CITY_PATRONS_NEEDED}` },
  ];
  return { items, ready: items.every(i=>i.done) };
}
function finaleReady(st){ return finaleChecklist(st).ready; }
function batchSize(st){ return Math.min(5, 1 + st.helpers.length); }
function skillLevel(st, rid){ return 1 + Math.floor((st.skill[rid]||0)/3); }
function recipeUnlocked(st, rid) {
  const r = RECIPES[rid]; const lvl = levelFromRep(st.rep);
  if (r.unlock.start) return true;
  if (r.unlock.level && lvl < r.unlock.level) return false;
  if (r.unlock.tool && !st.tools.includes(r.unlock.tool)) return false;
  return true;
}
function ingredientUnlocked(st, id){
  // the Golden Cinnamon is the finale ingredient — the town only funds it once
  // every side-quest is done and you've kept the Big City pâtisserie busy.
  if (id === 'cinnamon') return finaleReady(st);
  const g = INGREDIENTS[id]; if (!g.unlockLevel) return true;
  return levelFromRep(st.rep) >= g.unlockLevel;
}
function haveCost(st, cost){ return Object.entries(cost).every(([k,v]) => (st.inv[k]||0) >= v); }
function sellPrice(st, rid, sparkly){
  const r = RECIPES[rid];
  const sk = skillLevel(st, rid);
  let p = Math.round(r.sells * (1 + (sk-1)*0.06));
  if (sparkly) p = Math.round(p * 1.5);
  return p;
}
/* adoption fee — a welcome-home care package, on top of forfeiting the sale */
function adoptCost(item){ return Math.max(6, Math.round((item.value||10) * 0.5)); }
function successRate(st, rid){
  const sk = skillLevel(st, rid);
  let rate = 60 + sk*8;
  if (st.tools.includes('brickOven')) rate += 15;
  if (st.tools.includes('proofingOven')) rate += 20;
  return Math.min(98, rate);
}
let _uid = 1; const newUid = () => 'p'+(_uid++)+'_'+Math.floor(Math.random()*9999);

/* ---------- store hook ---------- */
const GameCtx = React.createContext(null);

function useGameStore() {
  const [st, setSt] = React.useState(loadState);
  React.useEffect(() => {
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(st)); } catch(e){}
  }, [st]);

  // unlock quests as level rises (data-driven by each quest's `level`)
  React.useEffect(() => {
    setSt(s => {
      const lvl = levelFromRep(s.rep); const q = { ...s.quests }; let ch=false;
      Object.values(QUESTS).forEach(quest => {
        if (lvl >= quest.level && q[quest.id]==='locked'){ q[quest.id]='available'; ch=true; }
      });
      return ch ? { ...s, quests:q } : s;
    });
  }, [st.rep]);

  const api = React.useMemo(() => ({
    raw: setSt,
    newGame(){ setSt(freshState()); },
    markIntroSeen(){ setSt(s => ({ ...s, seenIntro:true })); },

    buyIngredient(id){
      setSt(s => {
        if (!ingredientUnlocked(s,id)) return s;
        const price = INGREDIENTS[id].price;
        if (s.bleps < price) return s;
        return { ...s, bleps:s.bleps-price, inv:{ ...s.inv, [id]:(s.inv[id]||0)+1 } };
      });
    },
    buyTool(id){
      setSt(s => {
        const t = TOOLS[id];
        if (s.tools.includes(id)) return s;
        if (levelFromRep(s.rep) < t.level) return s;
        if (s.bleps < t.price) return s;
        return { ...s, bleps:s.bleps-t.price, tools:[...s.tools, id] };
      });
    },

    // bake a batch -> results land in pending. Each entry is { rid, jam } (jam =
    // optional berry-jam fill that costs +1 jam and sells at a premium).
    bakeBatch(entries){
      setSt(s => {
        const norm = entries.map(e => typeof e==='string' ? { rid:e, jam:false } : e);
        // verify combined cost (including any berry-jam fills)
        const need = {};
        norm.forEach(({rid,jam}) => {
          Object.entries(RECIPES[rid].cost).forEach(([k,v]) => need[k]=(need[k]||0)+v);
          if (jam) need.jam = (need.jam||0)+1;
        });
        if (!Object.entries(need).every(([k,v]) => (s.inv[k]||0)>=v)) return s;
        const inv = { ...s.inv }; Object.entries(need).forEach(([k,v]) => inv[k]-=v);
        const skill = { ...s.skill };
        let crit = s.critMacaronMade;
        const critBakes = { ...s.critBakes };
        const results = norm.map(({rid,jam}) => {
          skill[rid] = (skill[rid]||0)+1;
          const rate = successRate({ ...s, skill }, rid);
          const roll = Math.random()*100;
          const success = roll < rate;
          const sparkly = success && (Math.random()*100 < 12 + skillLevel({...s,skill},rid)*2);
          if (sparkly) { critBakes[rid] = true; if (rid==='macaronsheen') crit = true; }
          let value = sellPrice({...s,skill}, rid, sparkly);
          if (jam) value = Math.round(value * 1.6);   // berry-jam premium
          return { uid:newUid(), type:rid, art:RECIPES[rid].art, sparkly, jammy:!!jam, value };
        });
        return { ...s, inv, skill, pending:[...s.pending, ...results], critMacaronMade:crit, critBakes };
      });
    },
    quickBake(){
      setSt(s => {
        const r = RECIPES.breadsheen;
        const res = { uid:newUid(), type:'breadsheen', art:'bread', sparkly:false, value: r.sells, quick:true };
        return { ...s, pending:[...s.pending, res] };
      });
    },
    stockResult(uid){
      setSt(s => {
        const item = s.pending.find(p=>p.uid===uid); if (!item) return s;
        if (s.caseItems.length >= caseCapacity(s)) return s;
        return { ...s, pending:s.pending.filter(p=>p.uid!==uid), caseItems:[...s.caseItems, item] };
      });
    },
    adoptResult(uid){
      setSt(s => {
        const item = s.pending.find(p=>p.uid===uid); if (!item) return s;
        // finale: adopting the cinnamon roll cat triggers the win (always free)
        if (item.type==='cinnamonroll') return { ...s, pending:s.pending.filter(p=>p.uid!==uid), won:true };
        if (s.helpers.length >= helperCap(s)) return s;
        const cost = adoptCost(item);
        if (s.bleps < cost) return s;
        return { ...s, bleps:s.bleps-cost, pending:s.pending.filter(p=>p.uid!==uid), helpers:[...s.helpers, { uid:item.uid, type:item.type, art:item.art, sparkly:item.sparkly, jammy:item.jammy }] };
      });
    },
    // return a helper back to the sales case (frees a batch slot, re-stockable)
    returnHelper(uid){
      setSt(s => {
        const h = s.helpers.find(x=>x.uid===uid); if (!h) return s;
        if (s.caseItems.length >= caseCapacity(s)) return s; // no room in case
        let value = sellPrice(s, h.type, h.sparkly);
        if (h.jammy) value = Math.round(value * 1.6);
        return { ...s,
          helpers: s.helpers.filter(x=>x.uid!==uid),
          caseItems: [...s.caseItems, { uid:h.uid, type:h.type, art:h.art, sparkly:h.sparkly, jammy:h.jammy, value }] };
      });
    },

    discardResult(uid){ setSt(s => ({ ...s, pending:s.pending.filter(p=>p.uid!==uid) })); },

    // adopt straight from the sales case
    adoptFromCase(uid){
      setSt(s => {
        const item = s.caseItems.find(p=>p.uid===uid); if (!item) return s;
        if (item.type==='cinnamonroll') return { ...s, caseItems:s.caseItems.filter(p=>p.uid!==uid), won:true };
        if (s.helpers.length>=helperCap(s)) return s;
        const cost = adoptCost(item);
        if (s.bleps < cost) return s;
        return { ...s, bleps:s.bleps-cost, caseItems:s.caseItems.filter(p=>p.uid!==uid), helpers:[...s.helpers, { uid:item.uid, type:item.type, art:item.art, sparkly:item.sparkly, jammy:item.jammy }] };
      });
    },

    // sell a stocked pastry to a customer
    serve(visit, uid, opts={}){
      setSt(s => {
        const item = s.caseItems.find(p=>p.uid===uid); if (!item) return s;
        const r = RECIPES[item.type];
        let rep = r.rep + (visit.tipRep||0) + (visit.kind?2:0) + (item.sparkly?2:0) + (item.jammy?2:0);
        if (visit.wantsJam && item.jammy) rep += 3;   // they were craving a jam-filled treat
        // wrong order still sells but less rep
        if (visit.wants && visit.wants!==item.type) rep = Math.max(0, Math.round(rep*0.4));
        const met = s.metCustomers.includes(visit.who) ? s.metCustomers : [...s.metCustomers, visit.who];
        const atCity = levelFromRep(s.rep) >= 5;
        return { ...s,
          caseItems:s.caseItems.filter(p=>p.uid!==uid),
          bleps:s.bleps+item.value,
          rep:s.rep+rep,
          metCustomers:met,
          cityServes: s.cityServes + (atCity?1:0),
          visitsSeen:[...s.visitsSeen, visit.id],
          session:{ sold:s.session.sold+1, earned:s.session.earned+item.value, customers:s.session.customers+1 },
        };
      });
    },
    dismissVisit(visit){
      setSt(s => ({ ...s, visitsSeen:[...s.visitsSeen, visit.id],
        metCustomers: s.metCustomers.includes(visit.who)?s.metCustomers:[...s.metCustomers, visit.who],
        session:{ ...s.session, customers:s.session.customers+1 } }));
    },

    acceptQuest(id){ setSt(s => ({ ...s, quests:{ ...s.quests, [id]:'active' },
      metCustomers: s.metCustomers.includes(QUESTS[id].giver)?s.metCustomers:[...s.metCustomers, QUESTS[id].giver] })); },
    fulfillQuest(id){
      setSt(s => {
        const q = QUESTS[id]; const req = q.require;
        let caseItems = [...s.caseItems]; const inv = { ...s.inv };
        if (req.pastry){
          const matches = caseItems.filter(p=>p.type===req.pastry);
          if (matches.length < req.qty) return s;
          const remove = matches.slice(0, req.qty).map(p=>p.uid);
          caseItems = caseItems.filter(p=>!remove.includes(p.uid));
        }
        if (req.ingredient){ if ((inv[req.ingredient]||0) < req.iqty) return s; inv[req.ingredient]-=req.iqty; }
        if (req.critBake){ if (!s.critBakes || !s.critBakes[req.critBake]) return s; }
        return { ...s, caseItems, inv,
          bleps:s.bleps+q.reward.bleps, rep:s.rep+q.reward.rep,
          quests:{ ...s.quests, [id]:'done' } };
      });
    },
  }), []);

  const derived = {
    band: repBand(st.rep),
    level: levelFromRep(st.rep),
    caseCap: caseCapacity(st),
    helperCap: helperCap(st),
    batch: batchSize(st),
    unlockedRecipes: RECIPE_ORDER.filter(r=>recipeUnlocked(st,r)),
    finale: finaleChecklist(st),
  };

  return { st, api, derived };
}

Object.assign(window, {
  GameCtx, useGameStore, freshState,
  levelFromRep, repBand, caseCapacity, helperCap, batchSize, skillLevel,
  recipeUnlocked, ingredientUnlocked, haveCost, sellPrice, successRate, adoptCost,
  allQuestsDone, finaleChecklist, finaleReady, CITY_PATRONS_NEEDED,
  loadHighScores, saveHighScore,
});
