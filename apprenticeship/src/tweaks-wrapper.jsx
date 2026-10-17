// tweaks-wrapper.jsx — Tweaks panel mounted globally for the game.
// Exposes a <Tweaks /> component to render inside the App.
const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  panelScale: 1.0,
  panelText: 1.0,
  bannerScale: 1.0,
  headerScale: 1.0,
  sceneHeight: 0,
}/*EDITMODE-END*/;

function Tweaks(){
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);

  // CSS to apply. We use the `zoom` property to scale chunks of the HUD
  // because it reflows surrounding layout (transform:scale doesn't). Each
  // tweak targets a specific region so the user can pick what to enlarge.
  const css = `
    .jv-panels       { zoom: ${t.panelScale}; }
    .jv-panel-body   { font-size: ${Math.round(t.panelText * 100)}% !important; }
    .jv-banner       { zoom: ${t.bannerScale}; }
    .jv-header       { zoom: ${t.headerScale}; }
    ${t.sceneHeight > 0 ? `.jv-scene { min-height: ${t.sceneHeight}px; }` : ""}
    /* When panel text scales up, pull stat / store rows to inherit too so
       numbers grow with the labels rather than staying static px. */
    .jv-stat, .jv-stat-label, .jv-stat-val,
    .jv-store, .jv-store-label, .jv-store-val,
    .jv-row .k, .jv-row .v,
    .jv-mi .lab, .jv-mi .num, .jv-mi .sub,
    .jv-storenote { font-size: inherit !important; }
  `;

  return (
    <>
      <style>{css}</style>
      <TweaksPanel title="Tweaks">
        <TweakSection label="HUD Size" />
        <TweakSlider label="Panel card"   value={t.panelScale}   min={0.8} max={1.6} step={0.05}
                     onChange={(v) => setTweak("panelScale", v)} />
        <TweakSlider label="Panel text"   value={t.panelText}    min={0.9} max={1.8} step={0.05}
                     onChange={(v) => setTweak("panelText", v)} />
        <TweakSlider label="Header strip" value={t.headerScale}  min={0.9} max={1.4} step={0.05}
                     onChange={(v) => setTweak("headerScale", v)} />
        <TweakSlider label="Flavor banner" value={t.bannerScale} min={0.9} max={1.5} step={0.05}
                     onChange={(v) => setTweak("bannerScale", v)} />
        <TweakSection label="Scene" />
        <TweakSlider label="Scene height" value={t.sceneHeight}  min={0} max={520} step={20} unit="px"
                     onChange={(v) => setTweak("sceneHeight", v)} />
      </TweaksPanel>
    </>
  );
}

window.Tweaks = Tweaks;
