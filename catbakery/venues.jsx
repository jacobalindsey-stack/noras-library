/* ============================================================
   venues.jsx — venue helpers + flat retro scenery
     venueForLevel(level)  -> venue object
     Building({id,size})   -> little storefront icon (journey ladder)
     LightFixture({type})  -> hanging ceiling light for the bakery
     VenueProps({id})      -> floor prop cluster for the bakery
   Flat fills only; simple shapes. Exports to window.
   ============================================================ */

function venueForLevel(level){ return VENUES[Math.max(0, Math.min(VENUES.length-1, level-1))]; }

/* ---------- tiny building icons for the journey ladder ---------- */
function Building({ id, size=88, dim=false }) {
  const W = size, H = size; const out='#3c2614';
  const F = (s)=>({ position:'absolute', border:`3px solid ${out}`, ...s });
  const op = dim ? 0.5 : 1;
  let body = null;
  if (id==='garage') body = (<React.Fragment>
    <div style={F({ left:'12%', bottom:'8%', right:'12%', top:'34%', background:'#9ba0a6' })} />
    {/* roll-up door */}
    <div style={F({ left:'22%', bottom:'8%', right:'22%', top:'48%', background:'#cfd2d6' })} />
    {[0,1,2].map(i=><div key={i} style={{ position:'absolute', left:'22%', right:'22%', bottom:`${16+i*14}%`, height:2, background:'#8b8f95' }} />)}
    {/* flat roof */}
    <div style={F({ left:'8%', top:'26%', right:'8%', height:'12%', background:'#7e8388' })} />
  </React.Fragment>);
  else if (id==='truck') body = (<React.Fragment>
    {/* van body */}
    <div style={F({ left:'8%', top:'34%', right:'20%', bottom:'22%', background:'#4f8f8c' })} />
    {/* cab */}
    <div style={F({ right:'6%', top:'46%', width:'20%', bottom:'22%', background:'#5fa19d' })} />
    {/* serving hatch */}
    <div style={F({ left:'14%', top:'42%', width:'34%', height:'20%', background:'#efece2' })} />
    {/* awning */}
    <div style={{ position:'absolute', left:'10%', top:'36%', width:'40%', height:'8%', background:'#c14b56' }} />
    {/* wheels */}
    <div style={{ position:'absolute', left:'18%', bottom:'8%', width:'14%', height:'14%', background:out, borderRadius:'50%' }} />
    <div style={{ position:'absolute', right:'18%', bottom:'8%', width:'14%', height:'14%', background:out, borderRadius:'50%' }} />
  </React.Fragment>);
  else if (id==='corner') body = (<React.Fragment>
    <div style={F({ left:'12%', top:'30%', right:'12%', bottom:'8%', background:'#efd9b3' })} />
    {/* awning stripes */}
    <div style={{ position:'absolute', left:'8%', top:'26%', right:'8%', height:'12%', background:'#6fbf9a', borderTop:`3px solid ${out}`, display:'flex' }}>
      {[0,1,2,3,4].map(i=><div key={i} style={{ flex:1, background:i%2?'#fbf1dc':'transparent' }} />)}
    </div>
    {/* window + door */}
    <div style={F({ left:'18%', top:'44%', width:'30%', height:'26%', background:'#9ccadf' })} />
    <div style={F({ right:'20%', top:'44%', width:'20%', bottom:'8%', background:'#a9783f' })} />
  </React.Fragment>);
  else if (id==='neighborhood') body = (<React.Fragment>
    <div style={F({ left:'8%', top:'22%', right:'8%', bottom:'8%', background:'#c49463' })} />
    {/* gable roof */}
    <div style={{ position:'absolute', left:'4%', top:'8%', right:'4%', height:'18%', background:'#7c5325', clipPath:'polygon(50% 0,100% 100%,0 100%)', border:'none' }} />
    {/* sign band */}
    <div style={{ position:'absolute', left:'18%', top:'30%', right:'18%', height:'9%', background:'#5a3a1c' }} />
    {/* two windows */}
    <div style={F({ left:'16%', top:'46%', width:'24%', height:'22%', background:'#9ccadf' })} />
    <div style={F({ right:'16%', top:'46%', width:'24%', height:'22%', background:'#9ccadf' })} />
    {/* door + planter */}
    <div style={F({ left:'42%', top:'58%', width:'16%', bottom:'8%', background:'#7c5325' })} />
    <div style={{ position:'absolute', left:'14%', bottom:'8%', width:'12%', height:'10%', background:'#6fbf9a', border:`2px solid ${out}` }} />
  </React.Fragment>);
  else if (id==='bigcity') body = (<React.Fragment>
    <div style={F({ left:'8%', top:'18%', right:'8%', bottom:'8%', background:'#f4e4c1' })} />
    {/* cornice */}
    <div style={F({ left:'4%', top:'12%', right:'4%', height:'10%', background:'#f2c14e' })} />
    {/* flag */}
    <div style={{ position:'absolute', left:'48%', top:'2%', width:2, height:'14%', background:out }} />
    <div style={{ position:'absolute', left:'50%', top:'3%', width:'12%', height:'7%', background:'#c14b56', border:`2px solid ${out}` }} />
    {/* arched windows */}
    {[0,1,2].map(i=><div key={i} style={F({ left:`${16+i*24}%`, top:'40%', width:'16%', height:'30%', background:'#9ccadf', borderRadius:'50% 50% 0 0' })} />)}
    {/* columns/door */}
    <div style={F({ left:'42%', bottom:'8%', width:'16%', height:'22%', background:'#f2c14e', borderRadius:'40% 40% 0 0' })} />
  </React.Fragment>);
  return <div style={{ position:'relative', width:W, height:H, opacity:op, filter:dim?'grayscale(0.7)':'none' }}>{body}</div>;
}

/* ---------- ceiling light fixtures ---------- */
function LightFixture({ type, x='50%' }) {
  const out='#3c2614';
  const wire = (h)=>(<div style={{ position:'absolute', left:'50%', top:0, width:2, height:h, background:out, transform:'translateX(-50%)' }} />);
  let el;
  if (type==='bulb') el = (<div style={{ position:'relative', width:40, height:60 }}>{wire(30)}
    <div style={{ position:'absolute', left:'50%', top:30, transform:'translateX(-50%)', width:16, height:18, background:'#f2c14e', border:`2px solid ${out}`, borderRadius:'40% 40% 50% 50%', boxShadow:'0 0 0 3px rgba(242,193,78,0.25)' }} /></div>);
  else if (type==='string') el = (<div style={{ position:'relative', width:150, height:42 }}>
    <div style={{ position:'absolute', left:0, right:0, top:6, height:2, background:out, borderRadius:'0 0 60% 60%' }} />
    {[0,1,2,3,4].map(i=><div key={i} style={{ position:'absolute', left:`${8+i*21}%`, top:12, width:9, height:11, background:['#f2c14e','#f2a9b8','#6fbf9a','#f2c14e','#f2a9b8'][i], border:`2px solid ${out}`, borderRadius:'50%' }} />)}
  </div>);
  else if (type==='pendant') el = (<div style={{ position:'relative', width:50, height:56 }}>{wire(24)}
    <div style={{ position:'absolute', left:'50%', top:24, transform:'translateX(-50%)', width:34, height:20, background:'#a9783f', border:`3px solid ${out}`, borderRadius:'50% 50% 12% 12%' }} />
    <div style={{ position:'absolute', left:'50%', top:40, transform:'translateX(-50%)', width:14, height:8, background:'#f2c14e' }} /></div>);
  else if (type==='pendant2') el = (<div style={{ position:'relative', width:120, height:56 }}>
    {[20,84].map((lx,i)=><React.Fragment key={i}>
      <div style={{ position:'absolute', left:lx+15, top:0, width:2, height:22, background:out }} />
      <div style={{ position:'absolute', left:lx, top:22, width:32, height:18, background:'#5a3a1c', border:`3px solid ${out}`, borderRadius:'50% 50% 12% 12%' }} />
      <div style={{ position:'absolute', left:lx+11, top:36, width:12, height:8, background:'#f2c14e' }} />
    </React.Fragment>)}
  </div>);
  else if (type==='chandelier') el = (<div style={{ position:'relative', width:120, height:64 }}>{wire(16)}
    <div style={{ position:'absolute', left:'50%', top:16, transform:'translateX(-50%)', width:80, height:10, background:'#f2c14e', border:`2px solid ${out}`, borderRadius:'40%' }} />
    {[12,40,68,96].map((lx,i)=><React.Fragment key={i}>
      <div style={{ position:'absolute', left:lx+8, top:24, width:2, height:12, background:out }} />
      <div style={{ position:'absolute', left:lx+3, top:34, width:12, height:14, background:'#fbf1dc', border:`2px solid ${out}`, borderRadius:'40% 40% 50% 50%', boxShadow:'0 0 0 2px rgba(242,193,78,0.3)' }} />
    </React.Fragment>)}
    <div style={{ position:'absolute', left:'50%', top:14, transform:'translateX(-50%)', width:16, height:8, background:'#d99a35', border:`2px solid ${out}` }} />
  </div>);
  return <div style={{ position:'absolute', left:x, top:0, transform:'translateX(-50%)' }}>{el}</div>;
}

/* ---------- floor prop clusters (sit on the bakery floor) ---------- */
function VenueProps({ id }) {
  const out='#3c2614';
  const box = { position:'absolute', display:'inline-block' };
  let els;
  if (id==='garage') els = (<React.Fragment>
    {/* cardboard boxes */}
    <div style={{ ...box, left:0, bottom:0, width:44, height:36, background:'#caa06a', border:`3px solid ${out}` }}><div style={{ position:'absolute', left:'50%', top:0, width:2, height:'100%', background:'#a9783f' }} /></div>
    <div style={{ ...box, left:30, bottom:36, width:34, height:28, background:'#b8915c', border:`3px solid ${out}` }} />
    {/* toolbox */}
    <div style={{ ...box, left:74, bottom:0, width:42, height:24, background:'#c14b56', border:`3px solid ${out}` }}><div style={{ position:'absolute', left:'30%', top:-6, width:'40%', height:8, border:`3px solid ${out}`, borderBottom:'none', borderRadius:'40% 40% 0 0' }} /></div>
    {/* oil can */}
    <div style={{ ...box, left:122, bottom:0, width:24, height:30, background:'#8b8f95', border:`3px solid ${out}` }}><div style={{ position:'absolute', right:-8, top:4, width:10, height:3, background:out }} /></div>
  </React.Fragment>);
  else if (id==='truck') els = (<React.Fragment>
    {/* crate */}
    <div style={{ ...box, left:0, bottom:0, width:46, height:38, background:'#a9783f', border:`3px solid ${out}` }}>{[0,1].map(i=><div key={i} style={{ position:'absolute', left:0, right:0, top:`${30+i*30}%`, height:2, background:'#7c5325' }} />)}</div>
    {/* gas canister */}
    <div style={{ ...box, left:54, bottom:0, width:30, height:40, background:'#c14b56', border:`3px solid ${out}`, borderRadius:'14% 14% 0 0' }}><div style={{ position:'absolute', left:'30%', top:-6, width:'40%', height:8, background:out }} /></div>
    {/* traffic cone */}
    <div style={{ ...box, left:94, bottom:0, width:0, height:0, borderLeft:'16px solid transparent', borderRight:'16px solid transparent', borderBottom:`36px solid #e0823c`, filter:'none' }} />
    <div style={{ ...box, left:90, bottom:0, width:40, height:6, background:'#3c2614' }} />
  </React.Fragment>);
  else if (id==='corner') els = (<React.Fragment>
    {/* potted plant */}
    <div style={{ ...box, left:0, bottom:0, width:34, height:24, background:'#c14b56', border:`3px solid ${out}` }} />
    <div style={{ ...box, left:2, bottom:24, width:30, height:30, background:'#6fbf9a', borderRadius:'50% 50% 40% 40%', border:`3px solid ${out}` }} />
    {/* flour sacks */}
    <div style={{ ...box, left:48, bottom:0, width:40, height:44, background:'#efe2c4', border:`3px solid ${out}`, borderRadius:'30% 30% 8% 8%' }}><div style={{ position:'absolute', left:'50%', top:'46%', transform:'translateX(-50%)', fontFamily:"'VT323',monospace", fontSize:12, color:'#a9783f' }}>FLOUR</div></div>
    <div style={{ ...box, left:84, bottom:0, width:34, height:34, background:'#e9d3a6', border:`3px solid ${out}`, borderRadius:'30% 30% 8% 8%' }} />
  </React.Fragment>);
  else if (id==='neighborhood') els = (<React.Fragment>
    {/* stacked cookbooks */}
    {['#c14b56','#6fbf9a','#d99a35'].map((c,i)=><div key={i} style={{ ...box, left:2-i, bottom:i*12, width:48-i*2, height:12, background:c, border:`3px solid ${out}` }} />)}
    {/* potted plant */}
    <div style={{ ...box, left:66, bottom:0, width:30, height:22, background:'#a9783f', border:`3px solid ${out}` }} />
    <div style={{ ...box, left:60, bottom:22, width:42, height:40, background:'#5c8540', borderRadius:'60% 60% 30% 30%', border:`3px solid ${out}` }} />
    {/* cat bed */}
    <div style={{ ...box, left:112, bottom:0, width:46, height:20, background:'#f2a9b8', border:`3px solid ${out}`, borderRadius:'50%' }} />
  </React.Fragment>);
  else if (id==='bigcity') els = (<React.Fragment>
    {/* velvet rope posts */}
    <div style={{ ...box, left:0, bottom:0, width:8, height:48, background:'#f2c14e', border:`3px solid ${out}` }}><div style={{ position:'absolute', left:-2, top:-8, width:10, height:10, background:'#d99a35', border:`2px solid ${out}`, borderRadius:'50%' }} /></div>
    <div style={{ ...box, left:70, bottom:0, width:8, height:48, background:'#f2c14e', border:`3px solid ${out}` }}><div style={{ position:'absolute', left:-2, top:-8, width:10, height:10, background:'#d99a35', border:`2px solid ${out}`, borderRadius:'50%' }} /></div>
    <div style={{ ...box, left:6, bottom:32, width:66, height:14, background:'#c14b56', border:`2px solid ${out}`, borderRadius:'0 0 70% 70%' }} />
    {/* marble urn with flowers */}
    <div style={{ ...box, left:98, bottom:0, width:34, height:30, background:'#e9e2d2', border:`3px solid ${out}`, borderRadius:'20% 20% 50% 50%' }} />
    {[ '#f2a9b8','#f2c14e','#c14b56'].map((c,i)=><div key={i} style={{ ...box, left:100+i*11, bottom:28, width:12, height:14, background:c, border:`2px solid ${out}`, borderRadius:'50%' }} />)}
  </React.Fragment>);
  return <div style={{ position:'relative', width:'100%', height:'100%' }}>{els}</div>;
}

Object.assign(window, { venueForLevel, Building, LightFixture, VenueProps });
