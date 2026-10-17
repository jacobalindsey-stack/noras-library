/* ============================================================
   ui-kit.jsx — shared retro components
   Bevel buttons, panels, chalkboard, rep bar, speech bubbles,
   and the reusable Dialogue scene (shop + customers share it).
   ============================================================ */

const BTN_VARIANTS = {
  wood:  { bg:'#a9783f', lt:'#caa06a', dk:'#7c5325', bd:'#3c2614', fg:'#fff4e0' },
  cream: { bg:'#e9d3a6', lt:'#fbf1dc', dk:'#caa06a', bd:'#5a3a1c', fg:'#5a3a1c' },
  green: { bg:'#6fbf9a', lt:'#9ad9bd', dk:'#4d9678', bd:'#2f5e49', fg:'#16352a' },
  berry: { bg:'#c14b56', lt:'#d97883', dk:'#9a3640', bd:'#5a1f25', fg:'#fff0ef' },
  gold:  { bg:'#f2c14e', lt:'#f8d97e', dk:'#d99a35', bd:'#5a3a1c', fg:'#4a2f10' },
};

function Btn({ variant='wood', onClick, disabled, children, style={}, big, title }) {
  const v = BTN_VARIANTS[variant] || BTN_VARIANTS.wood;
  const [down,setDown] = React.useState(false);
  const pad = big ? '12px 22px' : '9px 16px';
  return (
    <button title={title} disabled={disabled} onPointerDown={()=>setDown(true)} onPointerUp={()=>setDown(false)} onPointerLeave={()=>setDown(false)}
      onClick={(e)=>{ if(!disabled && onClick){ window.SFX && SFX.click(); onClick(e); } }}
      style={{ fontFamily:"'Press Start 2P',monospace", fontSize: big?13:10, letterSpacing:.5,
        color:v.fg, background:v.bg, border:`3px solid ${v.bd}`, padding:pad, cursor:disabled?'not-allowed':'pointer',
        minHeight:44, lineHeight:1.4, imageRendering:'pixelated', position:'relative', userSelect:'none',
        opacity:disabled?0.45:1, transition:'none',
        boxShadow: down && !disabled
          ? `inset 3px 3px 0 ${v.dk}, inset -3px -3px 0 ${v.lt}`
          : `inset 3px 3px 0 ${v.lt}, inset -3px -3px 0 ${v.dk}`,
        transform: down && !disabled ? 'translate(1px,1px)' : 'none',
        ...style }}>
      {children}
    </button>
  );
}

/* small icon+label button used for the bakery action bar */
function ActionBtn({ icon, label, sub, variant='wood', onClick, disabled }) {
  const v = BTN_VARIANTS[variant];
  return (
    <Btn variant={variant} onClick={onClick} disabled={disabled} style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 16px', flex:1 }}>
      <span style={{ display:'flex', alignItems:'center' }}>{icon}</span>
      <span style={{ display:'flex', flexDirection:'column', alignItems:'flex-start', gap:3, textAlign:'left' }}>
        <span>{label}</span>
        {sub && <span style={{ fontFamily:"'VT323',monospace", fontSize:13, opacity:.85, letterSpacing:0 }}>{sub}</span>}
      </span>
    </Btn>
  );
}

function Panel({ children, style={}, tone='cream' }) {
  const map = {
    cream:{ bg:'#f4e4c1', bd:'#5a3a1c', lt:'#fbf1dc', dk:'#e9d3a6' },
    wood: { bg:'#a9783f', bd:'#3c2614', lt:'#caa06a', dk:'#7c5325' },
    dark: { bg:'#3c2614', bd:'#1f1209', lt:'#5a3a1c', dk:'#2b1a0d' },
  };
  const t = map[tone]||map.cream;
  return (
    <div style={{ background:t.bg, border:`3px solid ${t.bd}`,
      boxShadow:`inset 3px 3px 0 ${t.lt}, inset -3px -3px 0 ${t.dk}`, ...style }}>
      {children}
    </div>
  );
}

/* inset well (sunk look) for cases, inventories */
function Well({ children, style={}, bg='#e9d3a6' }) {
  return (
    <div style={{ background:bg, border:'3px solid #3c2614',
      boxShadow:'inset 3px 3px 0 #7c5325, inset -3px -3px 0 #caa06a', ...style }}>{children}</div>
  );
}

function Title({ children, size=14, color='#3c2614', style={} }) {
  return <div style={{ fontFamily:"'Press Start 2P',monospace", fontSize:size, color, lineHeight:1.5, ...style }}>{children}</div>;
}
function Body({ children, size=17, color='#5a3a1c', style={} }) {
  return <div style={{ fontFamily:"'VT323',monospace", fontSize:size, color, lineHeight:1.2, ...style }}>{children}</div>;
}

/* ---- Reputation / level bar ---- */
function RepBar({ band, width='100%', showStars=true }) {
  return (
    <div style={{ width }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:5 }}>
        <Title size={11}>LEVEL {band.lvl}</Title>
        {showStars && <div style={{ display:'flex', gap:2 }}>{[1,2,3,4,5].map(i=><Star key={i} size={13} filled={i<=band.lvl} />)}</div>}
      </div>
      <Well style={{ height:18, padding:2, position:'relative' }} bg="#2b2823">
        <div style={{ height:'100%', width:`${band.pct*100}%`, background:'#6fbf9a', boxShadow:'inset 0 2px 0 #9ad9bd, inset 0 -2px 0 #4d9678', transition:'width .4s steps(8)' }} />
      </Well>
      <Body size={14} style={{ textAlign:'right', marginTop:2, color:'#7c5325' }}>
        {band.atMax ? 'MAX' : `${band.into} / ${band.span} rep`}
      </Body>
    </div>
  );
}

/* ---- Speech bubble (pointer optional) ---- */
function Bubble({ children, style={}, point='left' }) {
  return (
    <div style={{ position:'relative', background:'#fbf1dc', border:'3px solid #5a3a1c', padding:'14px 16px',
      boxShadow:'4px 4px 0 #3c2614', fontFamily:"'VT323',monospace", fontSize:20, color:'#3c2614', lineHeight:1.15, ...style }}>
      {children}
      <div style={{ position:'absolute', bottom:-14, [point]:28, width:0, height:0,
        borderLeft:'10px solid transparent', borderRight:'10px solid transparent', borderTop:'14px solid #5a3a1c' }} />
      <div style={{ position:'absolute', bottom:-9, [point]:31, width:0, height:0,
        borderLeft:'7px solid transparent', borderRight:'7px solid transparent', borderTop:'10px solid #fbf1dc' }} />
    </div>
  );
}

/* ---- Pill / tag ---- */
function Pill({ children, color='#c14b56', fg='#fff0ef', style={} }) {
  return <span style={{ fontFamily:"'VT323',monospace", fontSize:14, background:color, color:fg, padding:'2px 8px',
    border:'2px solid #3c2614', whiteSpace:'nowrap', ...style }}>{children}</span>;
}

/* ---- Finale checklist (the road to the Cinnamon Roll Cat) ---- */
function FinaleChecklist({ fin, dense=false, mini=false }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:mini?4:(dense?4:6), width:'100%' }}>
      {fin.items.map(it=>(
        <div key={it.key} style={{ display:'flex', alignItems:'center', gap:7 }}>
          <span style={{ width:15, height:15, flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center',
            background: it.done?'#6fbf9a':'#d8c39a', border:'2px solid #3c2614', boxShadow: it.done?'inset 1px 1px 0 #9ad9bd':'none',
            fontFamily:"'VT323',monospace", fontSize:13, color:'#16352a', lineHeight:1 }}>{it.done?'\u2713':''}</span>
          <Body size={mini?14:(dense?15:16)} color={it.done?'#3c2614':'#7c5325'} style={{ flex:1, minWidth:0, lineHeight:1.05,
            whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis',
            textDecoration: it.done?'line-through':'none', opacity: it.done?0.85:1 }}>
            {(mini||dense) ? it.short : it.label}
          </Body>
          {!mini && <Body size={dense?13:14} color={it.done?'#4d9678':'#a9783f'} style={{ flexShrink:0, whiteSpace:'nowrap', fontWeight:'bold' }}>{it.detail}</Body>}
        </div>
      ))}
    </div>
  );
}

/* ---- Toast feed (floating +bleps / +rep) ---- */
function Toasts({ items }) {
  return (
    <div style={{ position:'absolute', top:14, left:'50%', transform:'translateX(-50%)', display:'flex', flexDirection:'column', gap:6, zIndex:50, pointerEvents:'none' }}>
      {items.map(t => (
        <div key={t.id} style={{ fontFamily:"'VT323',monospace", fontSize:19, color:'#fff', background:t.bad?'#c14b56':'#3c2614',
          border:'3px solid '+(t.bad?'#5a1f25':'#1f1209'), padding:'5px 14px', boxShadow:'3px 3px 0 rgba(0,0,0,.3)',
          animation:'toastpop .3s steps(3)' }}>{t.msg}</div>
      ))}
    </div>
  );
}

/* sound on/off toggle — reads + writes the global SFX mute flag */
function SoundToggle({ style={} }) {
  const [muted, setMuted] = React.useState(window.SFX ? SFX.isMuted() : false);
  return (
    <Btn variant="cream" title={muted?'Sound: off':'Sound: on'}
      onClick={()=>{ if(window.SFX){ setMuted(SFX.toggleMute()); } }}
      style={{ fontSize:13, padding:'5px 8px', minHeight:0, fontFamily:'"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif', ...style }}>
      {muted ? '🔇' : '🔊'}
    </Btn>
  );
}

Object.assign(window, { Btn, ActionBtn, Panel, Well, Title, Body, RepBar, Bubble, Pill, FinaleChecklist, Toasts, SoundToggle, BTN_VARIANTS });
