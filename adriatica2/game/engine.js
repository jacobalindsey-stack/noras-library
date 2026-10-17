(function() {
if (window.GameEngine) return;
// ADRIATICA — Game Engine
// Pure state machine. No DOM, no audio. Emits actions for the renderer.
// Persists to localStorage automatically.

const SAVE_KEY = 'adriatica-save-v2';

class GameEngine {
  constructor() {
    this.listeners = {};
    this.state = this._defaultState();
    this._load();
  }

  _defaultState() {
    return {
      currentScene: null,
      previousScene: null,
      chapter: 0,
      flags: {},           // persistent flags like heardForest, sentToOmis
      counters: {},        // per-scene WAIT/LOOK counters: { 'scene:verb:target': n }
      inventory: [],       // items the player has been given
      notebook: {
        weirdThings: [],   // { id, text }
        didaSays: [],      // { id, text }
        facts: [],         // { id, title, text }
        noticed: [],       // { id, text }
      },
      visited: {},         // scenes visited: { sceneId: visitCount }
      performanceMode: false,
    };
  }

  // --- Event system ---
  on(event, fn) {
    (this.listeners[event] = this.listeners[event] || []).push(fn);
    return () => { this.listeners[event] = this.listeners[event].filter(f => f !== fn); };
  }
  emit(event, data) {
    (this.listeners[event] || []).forEach(fn => fn(data));
  }

  // --- Persistence ---
  _save() {
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(this.state)); } catch(e) {}
  }
  _load() {
    try {
      const saved = localStorage.getItem(SAVE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        const def = this._defaultState();
        this.state = { ...def, ...parsed };
        // Deep-merge the notebook so saves written before a section existed
        // don't leave that section undefined (the renderer reads .length).
        this.state.notebook = { ...def.notebook, ...(parsed.notebook || {}) };
        Object.keys(def.notebook).forEach(k => {
          if (!Array.isArray(this.state.notebook[k])) this.state.notebook[k] = [];
        });
        ['flags', 'counters', 'visited'].forEach(k => {
          if (!this.state[k] || typeof this.state[k] !== 'object') this.state[k] = {};
        });
        if (!Array.isArray(this.state.inventory)) this.state.inventory = [];
      }
    } catch(e) {}
  }
  resetGame() {
    this.state = this._defaultState();
    this._save();
    this.emit('reset');
  }

  // --- Flags ---
  setFlag(flag, value = true) {
    this.state.flags[flag] = value;
    this._save();
    this.emit('flagChanged', { flag, value });
  }
  hasFlag(flag) { return !!this.state.flags[flag]; }

  // --- Inventory ---
  addItem(item) {
    if (!this.state.inventory.includes(item)) {
      this.state.inventory.push(item);
      this._save();
      this.emit('itemAdded', { item });
    }
  }
  hasItem(item) { return this.state.inventory.includes(item); }
  removeItem(item) {
    this.state.inventory = this.state.inventory.filter(i => i !== item);
    this._save();
  }

  // --- Counters ---
  _counterKey(scene, verb, target = '_scene') {
    return `${scene}:${verb}:${target}`;
  }
  getCounter(scene, verb, target) {
    return this.state.counters[this._counterKey(scene, verb, target)] || 0;
  }
  incrementCounter(scene, verb, target) {
    const key = this._counterKey(scene, verb, target);
    this.state.counters[key] = (this.state.counters[key] || 0) + 1;
    this._save();
    return this.state.counters[key];
  }

  // Repeat text may be a single string or a list to cycle through.
  _pick(value, n) {
    if (Array.isArray(value)) {
      if (!value.length) return null;
      return value[Math.max(0, n) % value.length];
    }
    return value;
  }

  // Mirrors the renderer's show/hide rules, so "things I haven't looked at"
  // only ever counts things she can actually see.
  _visible(hs) {
    if (hs.hideWhen && this.hasFlag(hs.hideWhen)) return false;
    if (hs.showWhen && !this.hasFlag(hs.showWhen)) return false;
    return true;
  }

  // --- Her own noise floor ---
  // The coast is always singing; it does not know she is there. Nothing about
  // hearing it is about the coast getting louder — it is about her getting
  // quieter. So LISTEN is never a dwell timer: it is a reading of how much of
  // her own noise is still in the way, and the puzzles are what lower it.
  //
  // Returns 0..1, where 1 is quiet enough to hear anything.
  quietness(sceneId, sceneDef) {
    if (!sceneDef) return 0;
    let q = 0;

    // The biggest source of her own noise is unspent curiosity. A question she
    // has not asked yet is a question she is still asking in her head, so
    // looking at things is what buys quiet — the action verb feeds the payoff.
    const looks = (sceneDef.hotspots || []).filter(h => this._visible(h) && h.verbs && h.verbs.look);
    if (looks.length) {
      // Graded, not all-or-nothing, and a rung she cannot open yet counts as
      // spent — otherwise a gated object (the museum relief) makes its whole
      // scene permanently unhearable, which is the exact dead end this system
      // is supposed to make impossible.
      let progress = 0;
      looks.forEach(h => {
        const ladder = (h.verbs.look.ladder || []);
        if (!ladder.length) { progress += 1; return; }
        const seen = this.getCounter(sceneId, 'look', h.id);
        if (seen >= ladder.length) { progress += 1; return; }
        const next = ladder[seen];
        if (next && next.gate && !this.hasFlag(next.gate)) { progress += 1; return; }
        progress += seen / ladder.length;
      });
      q += 0.62 * (progress / looks.length);
    } else {
      q += 0.62;
    }

    // Somewhere she has been before is somewhere she is not busy arriving in.
    // This is what "a place you keep coming back to gets louder" actually is:
    // not the place changing, her attention settling.
    const visits = Math.max(0, (this.state.visited[sceneId] || 1) - 1);
    q += Math.min(visits, 2) * 0.09;

    // Anything she has understood elsewhere that bears on this place. Authored
    // per scene, so a clue found in one scene is what quiets her in another.
    const helps = (sceneDef.wait && sceneDef.wait.quietedBy) || [];
    if (helps.length) {
      const got = helps.filter(f => this.hasFlag(f)).length;
      q += 0.2 * (got / helps.length);
    }

    // Dida taught her how to do this. Once he has, she is better at it
    // everywhere — the chain is the only thing that transmits.
    if (this.hasFlag('didaKnows')) q += 0.1;

    return Math.max(0, Math.min(1, q));
  }

  // How quiet this place needs her to be. Loud places ask for more.
  quietNeeded(sceneDef) {
    const w = sceneDef && sceneDef.wait;
    return (w && typeof w.needsQuiet === 'number') ? w.needsQuiet : 0.6;
  }

  // What is loudest in her right now — the honest clue channel. Never an
  // instruction: a description of her own noise, which she has to interpret.
  //
  // Indexed by unspent RUNGS, not unspent objects. In a one-object room (the
  // cave wall, the relief, the boy on the quay) the object count is 1 from the
  // first refusal to the last, so the escalating authored lines could never
  // escalate, and the generic line said "Almost" to a player at seventeen
  // per cent — the single most misleading sentence in the game.
  noiseReport(sceneId, sceneDef) {
    const looks = (sceneDef.hotspots || []).filter(h => this._visible(h) && h.verbs && h.verbs.look);
    let rungs = 0, things = 0;
    looks.forEach(h => {
      const ladder = (h.verbs.look.ladder || []);
      const left = Math.max(0, ladder.length - this.getCounter(sceneId, 'look', h.id));
      if (left > 0) { things++; rungs += left; }
    });
    const w = sceneDef.wait || {};
    if (rungs && w.noiseFromQuestions) return this._pick(w.noiseFromQuestions, rungs - 1);
    if (things > 1) {
      return "She closed her eyes and got, mostly, herself. There were still " + (things > 3 ? 'several' : 'a couple of') +
        " things here she had not actually looked at, and they were all still talking in her head.";
    }
    if (things === 1) {
      const ratio = this.quietness(sceneId, sceneDef) / (this.quietNeeded(sceneDef) || 1);
      return ratio >= 0.8
        ? "Almost. Underneath her own pulse there was something else, a long way down, and one unanswered question sitting on top of it like a hand on a string."
        : "Mostly her own blood — and one thing in this place she has walked straight past without ever properly looking at, which is now the only thing she can think about.";
    }
    if (w.noiseText) return w.noiseText;
    return "Nothing yet. Her own blood, mostly, and the sound her jacket made when she breathed.";
  }

  // --- Notebook ---
  addNotebookEntry(section, entry) {
    const list = this.state.notebook[section];
    if (list && !list.find(e => e.id === entry.id)) {
      list.push(entry);
      this._save();
      this.emit('notebookEntry', { section, entry });
    }
  }

  // --- Scene navigation ---
  goToScene(sceneId, sceneDef) {
    const prevScene = this.state.currentScene;
    this.state.previousScene = prevScene;
    this.state.currentScene = sceneId;
    this.state.visited[sceneId] = (this.state.visited[sceneId] || 0) + 1;
    this._save();
    const isFirstVisit = this.state.visited[sceneId] === 1;
    this.emit('sceneChange', { sceneId, sceneDef, isFirstVisit, previousScene: prevScene });
    return { isFirstVisit };
  }

  // An exit may carry a route: a list of { gate, done, to, label }.
  // The first branch that is OPEN (gate set) and NOT DONE wins, so one
  // door points at whatever is unfinished rather than at whatever is
  // newest. A finished destination is skipped, never sealed behind her.
  resolveExit(exit) {
    if (!exit || !exit.route) return exit;
    for (const branch of exit.route) {
      const open = !branch.gate || this.hasFlag(branch.gate);
      const done = branch.done && this.hasFlag(branch.done);
      if (open && !done) return { ...exit, ...branch, route: null };
    }
    return null;
  }

  // An exit may require SEVERAL flags (an island's own content complete
  // before the road home opens). Returns the first one still missing.
  missingGate(exit) {
    if (!exit) return null;
    if (exit.gate && !this.hasFlag(exit.gate)) return exit.gate;
    for (const f of exit.gates || []) {
      if (!this.hasFlag(f)) return f;
    }
    return null;
  }

  hasVisited(sceneId) { return (this.state.visited[sceneId] || 0) > 0; }
  visitCount(sceneId) { return this.state.visited[sceneId] || 0; }

  // --- Verb processing ---
  // Returns { text, actions, vision, sound } or null if nothing happens
  processVerb(verb, sceneId, sceneDef, targetId = null) {
    const result = { text: null, actions: [], vision: null, sound: null, bgSwap: null, plate: null };

    if (verb === 'wait') {
      return this._processWait(sceneId, sceneDef, result);
    }
    if (verb === 'look') {
      return this._processLook(sceneId, sceneDef, targetId, result);
    }
    if (verb === 'talk') {
      return this._processTalk(sceneId, sceneDef, targetId, result);
    }
    if (verb === 'give') {
      return this._processGive(sceneId, sceneDef, targetId, result);
    }
    return null;
  }

  _processWait(sceneId, sceneDef, result) {
    if (!sceneDef.wait) return null;
    const wait = sceneDef.wait;

    // Check gate
    if (wait.gate && !this.hasFlag(wait.gate)) {
      result.text = wait.gateText || "Nothing happens.";
      return result;
    }

    // Check "any N of these flags" gate (P10: two clues of three)
    if (wait.requireAny) {
      const have = (wait.requireAny.flags || []).filter(f => this.hasFlag(f)).length;
      if (have < (wait.requireAny.count || 1)) {
        result.text = wait.requireAny.text || "Nothing happens yet.";
        return result;
      }
    }

    // She is not quiet enough yet. Costs her nothing but tells her honestly
    // what is in the way, so LISTEN is the instrument and LOOK is the work.
    const ladder = wait.ladder || [];
    const alreadyIn = this.getCounter(sceneId, 'wait', '_scene');
    if (alreadyIn < ladder.length && this.quietness(sceneId, sceneDef) < this.quietNeeded(sceneDef)) {
      result.text = this.noiseReport(sceneId, sceneDef);
      result.tooLoud = true;
      return result;
    }

    const count = this.incrementCounter(sceneId, 'wait');

    if (count <= ladder.length) {
      const rung = ladder[count - 1];
      // A rung can be a string or an object { text, delay, actions, vision, sound, bgSwap }
      if (typeof rung === 'string') {
        result.text = rung;
      } else {
        // A rung may wait on a flag set elsewhere. Hold here without spending
        // it, so she can come back later and pick the beat up.
        if (rung.gate && !this.hasFlag(rung.gate)) {
          const held = this.incrementCounter(sceneId, 'hold', 'r' + count);
          result.text = this._pick(rung.gateText, held - 1) || "Nothing more happens.";
          this.state.counters[this._counterKey(sceneId, 'wait', '_scene')] = count - 1;
          this._save();
          return result;
        }
        // Inverse gate: something she did pushed this beat out of reach for a
        // moment. Waiting is what undoes it — the flag clears as she passes —
        // so it costs her a cycle and can never become a dead end.
        if (rung.gateNot && this.hasFlag(rung.gateNot)) {
          result.text = rung.gateNotText || "Nothing more happens.";
          this.setFlag(rung.gateNot, false);
          this.state.counters[this._counterKey(sceneId, 'wait', '_scene')] = count - 1;
          this._save();
          return result;
        }
        result.text = rung.text;
        result.delay = rung.delay || 0;
        result.vision = rung.vision || null;
        result.sound = rung.sound || null;
        result.bgSwap = rung.bgSwap || null;
        result.plate = rung.plate || null;
        if (rung.actions) result.actions = result.actions.concat(rung.actions);
        if (rung.flag) this.setFlag(rung.flag);
        if (rung.addItem) this.addItem(rung.addItem);
        if (rung.notebook) this.addNotebookEntry(rung.notebook.section, rung.notebook.entry);
      }
    } else {
      // Past the ladder
      if (wait.afterMax) {
        result.text = this._pick(wait.afterMax, count - ladder.length - 1);
      } else {
        return null; // nothing more to say
      }
    }

    // Check if ladder is complete
    if (count === ladder.length && wait.onComplete) {
      const oc = wait.onComplete;
      if (oc.flag) this.setFlag(oc.flag);
      if (oc.message) result.actions.push({ type: 'message', text: oc.message });
      if (oc.vision) result.vision = oc.vision;
      if (oc.sound) result.sound = oc.sound;
      if (oc.plate) result.plate = oc.plate;
      if (oc.notebook) this.addNotebookEntry(oc.notebook.section, oc.notebook.entry);
      if (oc.addItem) this.addItem(oc.addItem);
      if (oc.unlock) result.actions.push({ type: 'unlock', target: oc.unlock });
      if (oc.goTo) result.actions.push({ type: 'goto', to: oc.goTo, delay: oc.goToDelay || 4000 });
      if (oc.ending) result.actions.push({ type: 'ending', id: oc.ending, delay: oc.endingDelay || 6000 });
    }

    return result;
  }

  _processLook(sceneId, sceneDef, targetId, result) {
    // Find the hotspot
    const hotspot = targetId
      ? (sceneDef.hotspots || []).find(h => h.id === targetId)
      : null;

    if (!hotspot || !hotspot.verbs || !hotspot.verbs.look) return null;
    const look = hotspot.verbs.look;

    // Check for gate on specific rung
    const count = this.incrementCounter(sceneId, 'look', targetId);
    // After she reads the notebook, a parallel ladder takes over where one
    // was written. Same actions and gates, different words.
    const perf = this.hasFlag('performanceMode') ? (look.performance || null) : null;
    const ladder = look.ladder || [];

    // Some rungs may be gated
    if (count <= ladder.length) {
      const rung = ladder[count - 1];
      const swap = perf && perf[count - 1];
      if (typeof rung === 'string') {
        result.text = swap || rung;
      } else if (rung.gate && !this.hasFlag(rung.gate)) {
        // Gated rung — don't advance, but DO count the refusals, so the gate
        // text can escalate. A single fixed line repeated forever is how a
        // player concludes a puzzle is broken rather than unfinished.
        const held = this.incrementCounter(sceneId, 'lookhold', targetId + ':' + count);
        result.text = this._pick(rung.gateText, held - 1) || "She looks again but finds nothing new.";
        result.held = held;
        // A held look is fruitless from where the player is sitting: the picture
        // said no. Count it (after the first, which is information) so the
        // room's own nudge engages.
        if (held > 1) result.repeat = true;
        // Decrement counter since we didn't actually advance
        this.state.counters[this._counterKey(sceneId, 'look', targetId)] = count - 1;
        this._save();
      } else {
        result.text = swap || rung.text || rung;
        if (rung.actions) result.actions = result.actions.concat(rung.actions);
        if (rung.vision) result.vision = rung.vision;
        if (rung.sound) result.sound = rung.sound;
        if (rung.flag) this.setFlag(rung.flag);
        if (rung.addItem) this.addItem(rung.addItem);
        if (rung.plate) result.plate = rung.plate;
      }
    } else {
      const past = count - ladder.length - 1;
      const rep = (perf && look.exhaustedPerformance) || look.exhausted;
      result.text = this._pick(rep, past) || "She's already looked at this.";
      result.repeat = true;
    }

    // Check for onComplete at specific count
    if (look.onComplete && count === (look.completeAt || ladder.length)) {
      const oc = look.onComplete;
      if (oc.flag) this.setFlag(oc.flag);
      if (oc.unlock) result.actions.push({ type: 'unlock', target: oc.unlock });
      if (oc.notebook) this.addNotebookEntry(oc.notebook.section, oc.notebook.entry);
    }

    return result;
  }

  _processTalk(sceneId, sceneDef, targetId, result) {
    const hotspot = targetId
      ? (sceneDef.hotspots || []).find(h => h.id === targetId)
      : null;

    if (!hotspot || !hotspot.verbs || !hotspot.verbs.talk) return null;
    const talk = hotspot.verbs.talk;

    // Talk can be gated
    if (talk.gate && !this.hasFlag(talk.gate)) {
      // Count the refusals so the line can escalate. Dida's "Well?" is the most
      // tapped gate in the game and it used to be one sentence, forever.
      const held = this.incrementCounter(sceneId, 'talkhold', targetId);
      result.text = this._pick(talk.gateText, held - 1) || "They don't seem interested in talking.";
      if (held > 1) result.repeat = true;
      return result;
    }

    // Talk can have a ladder too, or just a single response
    if (talk.ladder) {
      const count = this.incrementCounter(sceneId, 'talk', targetId);
      if (count <= talk.ladder.length) {
        const rung = talk.ladder[count - 1];
        if (typeof rung === 'object' && rung.gate && !this.hasFlag(rung.gate)) {
          // Gated rung — hold here, don't advance the ladder, and escalate.
          const held = this.incrementCounter(sceneId, 'talkhold', targetId + ':' + count);
          result.text = this._pick(rung.gateText, held - 1) || "The conversation stops short.";
          this.state.counters[this._counterKey(sceneId, 'talk', targetId)] = count - 1;
          this._save();
          if (held > 1) result.repeat = true;
          return result;
        }
        // Inverse gate: this line belongs to a road not taken. Hold the ladder
        // rather than spending it, and say so.
        if (typeof rung === 'object' && rung.gateNot && this.hasFlag(rung.gateNot)) {
          result.text = rung.gateNotText || "There is nothing left to say about it.";
          this.state.counters[this._counterKey(sceneId, 'talk', targetId)] = count - 1;
          this._save();
          result.repeat = true;
          return result;
        }        result.text = typeof rung === 'string' ? rung : rung.text;
        if (typeof rung === 'object') {
          if (rung.actions) result.actions = result.actions.concat(rung.actions);
          if (rung.flag) this.setFlag(rung.flag);
          if (rung.addItem) this.addItem(rung.addItem);
        }
      } else {
        result.text = talk.exhausted || talk.ladder[talk.ladder.length - 1];
        if (typeof result.text === 'object') result.text = result.text.text;
        result.repeat = true;
      }
    } else {
      result.text = talk.text;
      if (talk.flag) this.setFlag(talk.flag);
    }

    if (talk.onComplete) {
      const count = this.getCounter(sceneId, 'talk', targetId);
      if (count === (talk.completeAt || 1)) {
        const oc = talk.onComplete;
        if (oc.flag) this.setFlag(oc.flag);
        if (oc.notebook) this.addNotebookEntry(oc.notebook.section, oc.notebook.entry);
      }
    }

    return result;
  }

  _processGive(sceneId, sceneDef, targetId, result) {
    const hotspot = targetId
      ? (sceneDef.hotspots || []).find(h => h.id === targetId)
      : null;

    if (!hotspot || !hotspot.verbs || !hotspot.verbs.give) return null;
    const give = hotspot.verbs.give;

    if (give.gate && !this.hasFlag(give.gate)) {
      result.text = give.gateText || "Not now.";
      return result;
    }

    // An inverse gate: a choice she has already made the other way. Used at the
    // ending, where handing the stone on and keeping it are supposed to be one
    // decision — nothing stopped a player doing BOTH, which turns a choice into
    // a pair of cutscenes and empties the last scene of meaning.
    if (give.gateNot && this.hasFlag(give.gateNot)) {
      result.text = give.gateNotText || "That moment has gone.";
      result.repeat = true;
      return result;
    }

    // A gift already given does not happen twice. Without this, a second tin of
    // sardines re-ran the whole beat and handed her a SECOND wooden cup —
    // including after she had already given the first one away.
    if (give.flag && this.hasFlag(give.flag) && !give.repeatable) {
      result.text = give.doneText || "She has already done that, and it stayed done.";
      result.repeat = true;
      return result;
    }

    // GIVE checks what item the player is trying to give
    // The renderer should handle item selection; here we process the result
    // For now, give is keyed by item id
    if (give.requires && !this.hasItem(give.requires)) {
      result.text = give.noItemText || "She has nothing to give.";
      return result;
    }

    result.text = give.text;
    if (give.consumeItem) this.removeItem(give.requires);
    if (give.flag) this.setFlag(give.flag);
    if (give.vision) result.vision = give.vision;
    if (give.plate) result.plate = give.plate;
    if (give.notebook) this.addNotebookEntry(give.notebook.section, give.notebook.entry);
    if (give.addItem) this.addItem(give.addItem);
    if (give.actions) result.actions = result.actions.concat(give.actions);

    return result;
  }
}



window.GameEngine = GameEngine;
})();