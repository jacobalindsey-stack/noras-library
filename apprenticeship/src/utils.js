// utils.js — small helpers, all attached to window
(function(){
  // Mulberry32 deterministic RNG
  function makeRng(seed){
    let s = seed >>> 0;
    return function(){
      s = (s + 0x6D2B79F5) >>> 0;
      let t = s;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function pick(arr, rng){ rng = rng || Math.random; return arr[Math.floor(rng() * arr.length)]; }
  function pickN(arr, n, rng){
    const copy = arr.slice();
    const out = [];
    for (let i=0;i<n && copy.length;i++){
      const idx = Math.floor((rng||Math.random)() * copy.length);
      out.push(copy.splice(idx,1)[0]);
    }
    return out;
  }
  function clamp(v, lo, hi){ return Math.max(lo, Math.min(hi, v)); }
  function uid(){ return Math.random().toString(36).slice(2,9); }

  // ===== Save/load =====
  const SAVE_KEY = "wilderlore:save:v1";
  function saveGame(payload){
    try {
      const obj = { v:1, ts: Date.now(), ...payload };
      localStorage.setItem(SAVE_KEY, JSON.stringify(obj));
      return true;
    } catch(e){
      console.warn("save failed", e);
      // Surface a visible warning so the player knows
      try {
        const id = "wl-save-warn-" + Date.now();
        const div = document.createElement("div");
        div.id = id;
        Object.assign(div.style, { position:"fixed", bottom:"24px", left:"50%", transform:"translateX(-50%)", zIndex:"99999",
          background:"#1a1408", color:"#e6c06a", border:"1px solid #5a3a1e", borderRadius:"6px", padding:"10px 18px",
          fontFamily:"sans-serif", fontSize:"13px", boxShadow:"0 4px 16px rgba(0,0,0,0.5)", pointerEvents:"auto" });
        div.textContent = "Save failed — your browser may not support offline storage.";
        document.body.appendChild(div);
        setTimeout(() => { try { document.getElementById(id)?.remove(); } catch(e2){} }, 5000);
      } catch(e2){}
      return false;
    }
  }
  function loadGame(){
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return null;
      const obj = JSON.parse(raw);
      if (!obj || obj.v !== 1) return null;
      return obj;
    } catch(e){ return null; }
  }
  function clearSave(){
    try { localStorage.removeItem(SAVE_KEY); } catch(e){}
  }
  function hasSave(){ return loadGame() != null; }

  window.WLUtil = { makeRng, pick, pickN, clamp, uid, saveGame, loadGame, clearSave, hasSave };
})();
