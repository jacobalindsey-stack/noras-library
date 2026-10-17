// scene.jsx — pixel-art biome scene with covered-wagon caravan
const { useRef, useEffect } = React;

// ===== Beast portrait SVGs (silhouettes) — used by roster UI =====
function BeastSilhouette({ glyph, color, size = 64, walk = false, t = 0 }) {
  const bob = walk ? Math.sin(t / 220) * 1.5 : 0;
  const stroke = "#0a0c10";
  const shapes = {
    bear: <g><ellipse cx="32" cy="36" rx="18" ry="14" /><circle cx="20" cy="22" r="9" /><circle cx="14" cy="14" r="3.2" /><circle cx="26" cy="14" r="3.2" /></g>,
    fox: <g><polygon points="14,38 50,40 40,18 32,28 24,18" /><polygon points="22,22 16,12 20,22" fill={stroke} /><polygon points="34,22 40,12 36,22" fill={stroke} /></g>,
    owl: <g><ellipse cx="32" cy="34" rx="14" ry="18" /><circle cx="26" cy="26" r="4" fill="#fff" /><circle cx="38" cy="26" r="4" fill="#fff" /><circle cx="26" cy="26" r="1.6" fill={stroke} /><circle cx="38" cy="26" r="1.6" fill={stroke} /><polygon points="29,32 32,36 35,32" fill={stroke} /></g>,
    otter: <g><ellipse cx="34" cy="36" rx="20" ry="10" /><circle cx="18" cy="30" r="8" /><circle cx="16" cy="26" r="1.6" fill={stroke} /></g>,
    bird: <g><polygon points="12,38 52,32 44,22 32,28 22,20 18,32" /><polygon points="42,28 52,18 46,30" /></g>,
    crab: <g><ellipse cx="32" cy="34" rx="16" ry="9" /><polygon points="18,30 10,24 18,28" /><polygon points="46,30 54,24 46,28" /><circle cx="26" cy="32" r="2" fill="#fff" /><circle cx="38" cy="32" r="2" fill="#fff" /></g>,
    beetle: <g><ellipse cx="32" cy="34" rx="14" ry="16" /><path d="M32 18 L32 50" stroke={stroke} strokeWidth="1.5" /><circle cx="32" cy="18" r="3" /></g>,
    jackal: <g><polygon points="14,42 50,40 46,22 38,28 32,18 26,28 18,22" /><polygon points="22,24 18,12 24,22" fill={stroke} /><polygon points="42,24 46,12 40,22" fill={stroke} /></g>,
    lizard: <g><path d="M10 36 Q22 24 32 32 Q42 40 54 32 L54 38 Q42 46 32 38 Q22 30 10 42 Z" /></g>,
    hare: <g><ellipse cx="32" cy="40" rx="14" ry="10" /><ellipse cx="24" cy="22" rx="4" ry="10" /><ellipse cx="32" cy="20" rx="4" ry="10" /><circle cx="22" cy="32" r="1.6" fill={stroke} /></g>,
    cat: <g><ellipse cx="32" cy="36" rx="16" ry="10" /><polygon points="20,26 16,16 24,24" /><polygon points="44,26 48,16 40,24" /><circle cx="26" cy="32" r="1.6" fill="#fff" /><circle cx="38" cy="32" r="1.6" fill="#fff" /></g>,
    vole: <g><ellipse cx="32" cy="38" rx="14" ry="8" /><circle cx="20" cy="34" r="6" /><circle cx="18" cy="30" r="1.6" fill={stroke} /></g>,
    toad: <g><ellipse cx="32" cy="40" rx="18" ry="9" /><circle cx="22" cy="30" r="6" /><circle cx="42" cy="30" r="6" /><circle cx="22" cy="28" r="2" fill="#fff" /><circle cx="42" cy="28" r="2" fill="#fff" /></g>,
    snake: <g><path d="M8 40 Q20 24 32 36 Q44 48 56 32 L56 38 Q44 54 32 42 Q20 30 8 46 Z" /></g>,
    moth: <g><ellipse cx="22" cy="32" rx="12" ry="8" /><ellipse cx="42" cy="32" rx="12" ry="8" /><ellipse cx="32" cy="34" rx="3" ry="10" /></g>,
    marmot: <g><ellipse cx="32" cy="40" rx="14" ry="12" /><circle cx="32" cy="22" r="9" /><circle cx="28" cy="20" r="1.6" fill={stroke} /><circle cx="36" cy="20" r="1.6" fill={stroke} /></g>,
    falcon: <g><polygon points="8,36 56,30 44,18 32,28 20,18 12,30" /></g>,
    goat: <g><ellipse cx="32" cy="38" rx="16" ry="10" /><circle cx="20" cy="28" r="8" /><polygon points="14,24 10,12 18,22" /><polygon points="22,22 18,10 22,20" /></g>,
    boar: <g><ellipse cx="32" cy="38" rx="18" ry="10" /><polygon points="14,36 6,34 14,30" /><circle cx="14" cy="34" r="1.4" fill="#fff" /></g>,
    eel: <g><path d="M6 32 Q16 22 26 32 Q36 42 46 32 Q54 26 58 32 L58 36 Q54 30 46 36 Q36 46 26 36 Q16 26 6 36 Z" /></g>,
    husk: <g><rect x="16" y="20" width="32" height="30" rx="3" /><rect x="22" y="14" width="20" height="10" rx="2" /><circle cx="26" cy="32" r="2" fill={stroke} /><circle cx="38" cy="32" r="2" fill={stroke} /></g>,
  };
  const shape = shapes[glyph] || shapes.bear;
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} style={{display:"block", overflow:"visible"}}>
      <g transform={`translate(0 ${bob})`} fill={color} stroke={stroke} strokeWidth="1.4" strokeLinejoin="round">
        {shape}
      </g>
    </svg>
  );
}

function ApprenticePortrait({ hue, size = 48, walk=false, t=0 }) {
  const bob = walk ? Math.sin(t/200 + (hue%6)) * 1.5 : 0;
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} style={{display:"block"}}>
      <g transform={`translate(0 ${bob})`}>
        <circle cx="32" cy="20" r="10" fill={`oklch(60% 0.12 ${hue})`} stroke="#0a0c10" strokeWidth="1.2" />
        <path d="M14 56 Q14 36 32 36 Q50 36 50 56 Z" fill={`oklch(45% 0.1 ${hue})`} stroke="#0a0c10" strokeWidth="1.2" />
        <path d="M22 22 Q22 12 32 12 Q42 12 42 22 L42 18 Q32 8 22 18 Z" fill="#1a1408" />
      </g>
    </svg>
  );
}

function RegionIcon({ id, size = 20 }) {
  const stroke = "currentColor"; const sw = 1.4; const fill = "none";
  const inner = {
    woods:     <g fill={fill} stroke={stroke} strokeWidth={sw}><path d="M6 18 L12 4 L18 18 Z" /><path d="M12 18 V22" /></g>,
    sea:       <g fill={fill} stroke={stroke} strokeWidth={sw}><path d="M3 14 Q7 11 12 14 Q17 17 21 14" /><path d="M3 18 Q7 15 12 18 Q17 21 21 18" /></g>,
    desert:    <g fill={fill} stroke={stroke} strokeWidth={sw}><circle cx="12" cy="9" r="3.2" /><path d="M3 18 Q9 14 12 18 Q16 22 21 18" /></g>,
    tundra:    <g fill={fill} stroke={stroke} strokeWidth={sw}><path d="M12 3 L12 21 M3 12 L21 12 M6 6 L18 18 M18 6 L6 18" /></g>,
    jungle:    <g fill={fill} stroke={stroke} strokeWidth={sw}><path d="M12 21 V8" /><path d="M12 14 Q6 12 4 6" /><path d="M12 12 Q18 10 20 4" /><path d="M12 16 Q8 16 6 14" /></g>,
    mountains: <g fill={fill} stroke={stroke} strokeWidth={sw}><path d="M3 19 L9 8 L13 14 L17 6 L21 19 Z" /></g>,
  };
  return (<svg viewBox="0 0 24 24" width={size} height={size} style={{display:"block"}}>{inner[id]}</svg>);
}

// ===========================================================
// PIXEL SCENE
// ===========================================================
const RES_W = 640, RES_H = 180;
const HORIZON = 96;     // where ground/water meets sky
const GROUND_TOP = 124;
const WAGON_X = 360;    // wagon stays near right-center; world scrolls

// Per-biome pixel palettes (day variant). Each palette has named slots so the
// composition routines stay simple.
const PIX = {
  woods: {
    sky:["#3a4a64","#5a6e88","#8294ac","#a6b6c4"],
    cloud:"#c8d2dc", cloudDark:"#8a96a4",
    mtnFar:"#3a4654", mtnNear:"#2c3640", snow:"#d4d6cc",
    forestFar:"#1e2c20", forestNear:"#152018", treeHL:"#2c3e26",
    water:"#2c3a4a", waterHL:"#5e708a",
    ground:"#283020", groundHL:"#3a4a30", groundDark:"#1a2014",
    trail:"#3e3528", trailEdge:"#2a2418",
  },
  sea: {
    sky:["#243648","#3a5468","#6786a0","#a8c0d4"],
    cloud:"#cdd6dc", cloudDark:"#8a98a8",
    mtnFar:"#3a4654", mtnNear:"#2c3640", snow:"#d4d6cc",
    forestFar:"#283848", forestNear:"#1a2632", treeHL:"#3a4c60",
    water:"#2c4a64", waterHL:"#82a4c4",
    ground:"#243048", groundHL:"#3a4c68", groundDark:"#161e2c",
    trail:"#3a4258", trailEdge:"#222a3a",
  },
  desert: {
    sky:["#5e3a2a","#8a5e3c","#c08456","#e0b48a"],
    cloud:"#e6c8a4", cloudDark:"#a0784a",
    mtnFar:"#6a4030", mtnNear:"#4a2c20", snow:"#e8c896",
    forestFar:"#7a4a30", forestNear:"#5a3220", treeHL:"#8a5a3c",
    water:"#a07050", waterHL:"#e0b48a",
    ground:"#6a4226", groundHL:"#8a5a36", groundDark:"#3a2014",
    trail:"#9e6e44", trailEdge:"#5a3a20",
  },
  tundra: {
    sky:["#2a3650","#42546e","#728aa6","#b4c8dc"],
    cloud:"#dde2e8", cloudDark:"#8e9aa8",
    mtnFar:"#4a5466", mtnNear:"#363e4e", snow:"#e6e6e0",
    forestFar:"#3a4658", forestNear:"#262e3c", treeHL:"#4a5468",
    water:"#5a728c", waterHL:"#a4bcd0",
    ground:"#a6b2c0", groundHL:"#cad4dc", groundDark:"#6e7c8c",
    trail:"#8a96a4", trailEdge:"#5e6878",
  },
  jungle: {
    sky:["#1a3030","#264846","#3e6c5c","#7aa090"],
    cloud:"#cdd6cc", cloudDark:"#7a988a",
    mtnFar:"#264638", mtnNear:"#1a3024", snow:"#c8d4b8",
    forestFar:"#143020", forestNear:"#0a1c12", treeHL:"#2a4a30",
    water:"#1e3e3a", waterHL:"#4a8068",
    ground:"#1a2c1c", groundHL:"#2a4226", groundDark:"#0c1610",
    trail:"#3a3a26", trailEdge:"#222418",
  },
  mountains: {
    sky:["#2c2e3e","#404458","#606880","#8a8a98"],
    cloud:"#c8c8d2", cloudDark:"#8a8a96",
    mtnFar:"#52576a", mtnNear:"#363a4a", snow:"#e8e8ea",
    forestFar:"#2c303e", forestNear:"#1c1e28", treeHL:"#3a3e4e",
    water:"#3a4c66", waterHL:"#7a8aa0",
    ground:"#2c2e3a", groundHL:"#444858", groundDark:"#16181f",
    trail:"#4e4e58", trailEdge:"#2e2e36",
  },
};

// Night override: darken sky/water/etc and replace clouds with stars
function nightOverride(p){
  return {
    ...p,
    sky:["#06080e","#0e1424","#1a2236","#2c3850"],
    cloud:"#f0e8c4", cloudDark:"#1c2236",  // stars effectively
    water:"#16223a", waterHL:"#3e5070",
    ground: darken(p.ground, 0.45),
    groundHL: darken(p.groundHL, 0.45),
    groundDark: darken(p.groundDark, 0.55),
    forestFar: darken(p.forestFar, 0.4),
    forestNear: darken(p.forestNear, 0.4),
    treeHL: darken(p.treeHL, 0.4),
    mtnFar: darken(p.mtnFar, 0.35),
    mtnNear: darken(p.mtnNear, 0.35),
    snow: darken(p.snow, 0.2),
    trail: darken(p.trail, 0.5),
    trailEdge: darken(p.trailEdge, 0.5),
  };
}
function darken(hex, amt){
  const c = hex.replace("#",""); const r=parseInt(c.slice(0,2),16),g=parseInt(c.slice(2,4),16),b=parseInt(c.slice(4,6),16);
  const k = 1 - amt;
  const nr = Math.max(0, Math.round(r*k)), ng = Math.max(0, Math.round(g*k)), nb = Math.max(0, Math.round(b*k));
  return "#" + [nr,ng,nb].map(v=>v.toString(16).padStart(2,"0")).join("");
}

// ----- Pixel drawing primitives -----
function px(ctx,x,y,w,h,c){ ctx.fillStyle=c; ctx.fillRect(x|0,y|0,w|0,h|0); }

// Sky: 4 horizontal bands
function drawSky(ctx, P){
  const stops = [0, HORIZON*0.35, HORIZON*0.65, HORIZON];
  for (let i=0;i<3;i++){
    px(ctx, 0, stops[i], RES_W, stops[i+1]-stops[i]+1, P.sky[i]);
  }
  // base just at horizon (smoother transition)
  px(ctx, 0, HORIZON-2, RES_W, 2, P.sky[3]);
}

// Stars (chunky single pixels)
function drawStars(ctx, P, t){
  ctx.fillStyle = "#f4e8c0";
  for (let i=0;i<60;i++){
    const x = ((i*127.7)%RES_W)|0;
    const y = (((i*53.3)%(HORIZON-12)) + 2)|0;
    const tw = ((Math.sin(t*0.002 + i)+1)*0.5);
    if (tw > 0.4) ctx.fillRect(x, y, 1, 1);
  }
  // a couple brighter twinkle stars
  for (let i=0;i<8;i++){
    const x = ((i*43.7)%RES_W)|0;
    const y = (((i*17.3)%(HORIZON-30)) + 4)|0;
    const tw = ((Math.sin(t*0.003 + i*1.7)+1)*0.5);
    if (tw > 0.6){
      ctx.fillRect(x, y, 1, 1);
      ctx.fillRect(x-1, y, 1, 1);
      ctx.fillRect(x+1, y, 1, 1);
      ctx.fillRect(x, y-1, 1, 1);
      ctx.fillRect(x, y+1, 1, 1);
    }
  }
}

// Chunky clouds drifting across upper sky. Pseudo-random fixed shapes.
function drawClouds(ctx, P, t){
  const speed = 0.0036;
  const cloudSet = [
    {y:14, w:42, h:6, off:0,    pattern:"AABBBAA"},
    {y:8,  w:32, h:5, off:80,   pattern:"AABBAA" },
    {y:20, w:50, h:7, off:160,  pattern:"AABBBBAA"},
    {y:26, w:38, h:6, off:240,  pattern:"AABBBA" },
    {y:10, w:28, h:5, off:320,  pattern:"ABBA"   },
    {y:32, w:46, h:6, off:400,  pattern:"AABBBAA"},
    {y:16, w:34, h:5, off:480,  pattern:"AABBA"  },
  ];
  const periodicX = (off) => {
    const total = RES_W + 200;
    return ((off - t*speed) % total + total) % total - 100;
  };
  for (const c of cloudSet){
    const cx = periodicX(c.off);
    // Cloud bottom (darker)
    px(ctx, cx, c.y+c.h-2, c.w, 2, P.cloudDark);
    // Cloud body
    px(ctx, cx+2, c.y, c.w-4, c.h, P.cloud);
    // Cloud highlights — chunky bumps on top
    const bumpW = Math.floor(c.w/6);
    for (let i=0;i<3;i++){
      px(ctx, cx + 4 + i*bumpW*2, c.y-1, bumpW, 1, P.cloud);
    }
    // Cloud tapered edges
    px(ctx, cx, c.y+2, 2, c.h-2, P.cloud);
    px(ctx, cx+c.w-2, c.y+2, 2, c.h-2, P.cloud);
  }
}

// Distant mountain layer (snow-capped) — parallax slow
function drawMountains(ctx, P, biome, t){
  const scroll = Math.floor(t*0.0054) % 200;
  const baseY = HORIZON - 1;

  // Far range
  const peaks = [
    {x:10,  h:24, w:34},
    {x:48,  h:32, w:42},
    {x:90,  h:38, w:50},
    {x:142, h:30, w:40},
    {x:182, h:42, w:54},
    {x:230, h:34, w:44},
    {x:276, h:28, w:38},
    {x:316, h:30, w:42},
    {x:360, h:36, w:50},
  ];
  // Repeat at +RES_W for seamless wrap
  for (let pass=0; pass<2; pass++){
    for (const p of peaks){
      const cx = p.x - scroll + pass*400;
      if (cx + p.w < -10 || cx - p.w > RES_W+10) continue;
      drawTriangleMountain(ctx, cx, baseY, p.w, p.h, P.mtnFar, P.snow, biome);
    }
  }
  // Near range (smaller, slightly forward)
  const scroll2 = Math.floor(t*0.0105) % 240;
  const peaks2 = [
    {x:0,   h:18, w:26},
    {x:38,  h:22, w:32},
    {x:78,  h:16, w:24},
    {x:112, h:24, w:36},
    {x:158, h:20, w:30},
    {x:200, h:18, w:28},
    {x:242, h:26, w:38},
    {x:286, h:20, w:30},
  ];
  for (let pass=0; pass<2; pass++){
    for (const p of peaks2){
      const cx = p.x - scroll2 + pass*330;
      if (cx + p.w < -10 || cx - p.w > RES_W+10) continue;
      drawTriangleMountain(ctx, cx, baseY+2, p.w, p.h, P.mtnNear, P.snow, biome, true);
    }
  }
}
function drawTriangleMountain(ctx, cx, baseY, w, h, color, snowColor, biome, isNear){
  // Build mountain as scanlines (chunky)
  for (let dy=0; dy<h; dy++){
    const t = dy/h;
    const ww = Math.floor((w/2) * (1 - t));
    px(ctx, cx-ww, baseY-dy, ww*2, 1, color);
  }
  // Snow cap (top ~30%)
  if (biome !== "desert" && biome !== "jungle"){
    for (let dy=Math.floor(h*0.65); dy<h; dy++){
      const t = dy/h;
      const ww = Math.floor((w/2)*(1-t));
      // jagged inner snow
      const jag = ((cx*7 + dy*5) % 3) - 1;
      const sw = Math.max(0, ww - 1 + jag);
      px(ctx, cx-sw, baseY-dy, sw*2, 1, snowColor);
    }
  }
  // Shadow side (right)
  if (!isNear){
    const shade = darken(color, 0.18);
    for (let dy=0; dy<h; dy++){
      const t = dy/h;
      const ww = Math.floor((w/2)*(1-t));
      px(ctx, cx, baseY-dy, ww, 1, shade);
    }
  }
}

// Forest strip just under the mountains
function drawForestStrip(ctx, P, biome, t){
  const scroll = Math.floor(t*0.018) % 16;
  const y = HORIZON - 4;
  // Solid base
  px(ctx, 0, y, RES_W, 6, P.forestFar);
  // Tree silhouettes (chunky pines)
  for (let x=-scroll; x<RES_W+8; x+=4){
    const seed = ((x*13)|0)%9;
    const th = 4 + (seed % 4);
    drawPineSilhouette(ctx, x, y+5, th, P.forestNear);
  }
}
function drawPineSilhouette(ctx, x, baseY, h, color){
  for (let dy=0; dy<h; dy++){
    const t = dy/h;
    const ww = Math.max(1, Math.floor((1-t)*2.5));
    px(ctx, x-ww, baseY-dy, ww*2+1, 1, color);
  }
}

// River/water (or terrain) horizontal mid band
function drawMidStrip(ctx, P, biome, t){
  const y = HORIZON;
  const h = GROUND_TOP - HORIZON;
  // For sea/woods/mountains/tundra → river; desert → sand; jungle → river too
  if (biome === "desert"){
    // Dune band
    px(ctx, 0, y, RES_W, h, P.water); // reuse 'water' slot as sand-mid color (already orange-ish)
    // dune ripples
    for (let i=0;i<8;i++){
      const dx = (i*44 - Math.floor(t*0.012)) % (RES_W+44);
      const xx = (dx + RES_W) % (RES_W+44) - 22;
      px(ctx, xx, y + 4, 22, 1, P.waterHL);
      px(ctx, xx+12, y + 10, 16, 1, P.waterHL);
    }
  } else {
    // Water band — solid color, dashed wave lines, sparse horizon sparkle
    px(ctx, 0, y, RES_W, h, P.water);
    const scroll = Math.floor(t*0.015);
    // 4 wave lines spaced across the band
    for (let row=3; row<h-1; row+=5){
      for (let x=0; x<RES_W; x+=16){
        const off = ((row*17 + scroll) % 16);
        const sx = ((x + off) % RES_W + RES_W) % RES_W;
        px(ctx, sx, y+row, 5, 1, P.waterHL);
      }
    }
    // Sparse sparkles at horizon
    for (let x=0;x<RES_W;x+=4){
      if (((x*3 + Math.floor(t*0.024))%23) < 2){
        px(ctx, x, y+1, 1, 1, P.waterHL);
      }
    }
  }
}

// Foreground ground (where wagon and trail sit)
function drawGround(ctx, P, biome, t){
  const y = GROUND_TOP;
  const h = RES_H - GROUND_TOP;
  // Base
  px(ctx, 0, y, RES_W, h, P.ground);
  // Highlight band near top edge
  px(ctx, 0, y, RES_W, 1, P.groundHL);
  // Trail (dirt road) running across, slightly curved
  const trailY = y + 28;
  px(ctx, 0, trailY-3, RES_W, 8, P.trail);
  px(ctx, 0, trailY-4, RES_W, 1, P.trailEdge);
  px(ctx, 0, trailY+5, RES_W, 1, P.trailEdge);
  // Trail dapples (scrolling pebbles)
  const scroll = Math.floor(t*0.054) % 6;
  for (let x=-scroll; x<RES_W; x+=6){
    const seed = (x*7)|0;
    px(ctx, x, trailY-1 + (seed%3), 1, 1, P.trailEdge);
  }
  // Grass tufts in front of and behind trail
  if (biome !== "desert" && biome !== "tundra"){
    for (let i=0;i<RES_W/3;i++){
      const x = (i*3 - scroll*2 + (i*7)%4) % RES_W;
      const ty = y + 4 + ((i*5)%8);
      if (ty < trailY-5) px(ctx, x, ty, 1, 1, P.groundHL);
    }
    for (let i=0;i<RES_W/2;i++){
      const x = (i*2 - scroll*3 + (i*11)%3) % RES_W;
      const ty = trailY + 6 + ((i*7)%14);
      if (ty < RES_H-1) px(ctx, x, ty, 1, 1, P.groundDark);
      if ((i%5)===0 && ty < RES_H-2) px(ctx, x, ty-1, 1, 1, P.groundHL);
    }
  } else if (biome === "tundra"){
    // snow flecks
    for (let i=0;i<RES_W;i+=5){
      const x = (i - scroll*2)|0;
      const ty = y + ((i*3)%10);
      if (ty < trailY-5) px(ctx, x, ty, 1, 1, P.snow);
    }
  } else {
    // desert grit
    for (let i=0;i<RES_W;i+=4){
      const x = (i - scroll*2)|0;
      const ty = y + ((i*5)%10);
      if (ty < trailY-5) px(ctx, x, ty, 1, 1, P.groundDark);
    }
  }
  return trailY;
}

function drawForegroundTree(ctx, P, x, baseY, h, t){
  // trunk
  px(ctx, x, baseY-h, 1, 1, "#1a1410");
  px(ctx, x, baseY-h+1, 1, 1, "#1a1410");
  px(ctx, x, baseY-h+2, 1, 1, "#2a1e14");
  // foliage tiers
  for (let tier=0; tier<5; tier++){
    const ty = baseY - h - 1 - tier*2;
    const tw = Math.floor(1 + (5-tier)*1.4);
    px(ctx, x-tw, ty, tw*2+1, 1, P.forestNear);
    px(ctx, x-tw+1, ty-1, tw*2-1, 1, P.treeHL);
  }
  // tip
  px(ctx, x, baseY - h - 11, 1, 1, P.forestNear);
}

// ----- Wagon, horse, walkers -----
function drawWagon(ctx, x, y, t, palette, daynight){
  const bob = Math.floor(Math.sin(t*0.008)*0.6);
  y += bob;
  // Wagon canopy — covered wagon arc
  // Top arch (3 rows tapering)
  px(ctx, x+3, y,   20, 1, "#e6e0c8");
  px(ctx, x+2, y+1, 22, 1, "#e6e0c8");
  px(ctx, x+1, y+2, 24, 1, "#e6e0c8");
  // Canvas body
  px(ctx, x,   y+3, 26, 6, "#dad2b6");
  px(ctx, x,   y+3, 26, 1, "#e6e0c8"); // highlight top of canvas
  px(ctx, x,   y+8, 26, 1, "#a99b78"); // shadow bottom
  // Canvas ribs (vertical darker lines)
  for (let r=0; r<5; r++){
    px(ctx, x+4+r*4, y+3, 1, 6, "#bcaf8a");
  }
  // Wagon bed (wood)
  px(ctx, x,   y+9,  26, 3, "#5a3a1e");
  px(ctx, x,   y+9,  26, 1, "#8a5e34");
  px(ctx, x,   y+11, 26, 1, "#3a2410");
  // Side board planks
  for (let r=0; r<4; r++) px(ctx, x+2+r*6, y+10, 1, 1, "#3a2410");
  // Lantern at back-right
  const flick = Math.floor(t*0.01) % 2;
  px(ctx, x+25, y+5, 1, 3, "#241810");
  px(ctx, x+25, y+6, 1, 1, flick ? "#f6c46a" : "#f4b04a");
  // Lantern glow halo
  if (daynight === "night"){
    ctx.fillStyle = "rgba(244, 196, 106, 0.35)";
    ctx.fillRect(x+22, y+3, 7, 7);
    ctx.fillStyle = "rgba(244, 196, 106, 0.18)";
    ctx.fillRect(x+20, y+1, 11, 11);
  }
  // Wheels
  const wheelSpin = Math.floor(t*0.0075) % 4;
  drawWheel(ctx, x+4,  y+12, wheelSpin);
  drawWheel(ctx, x+20, y+12, wheelSpin);
  // Driver on front bench
  drawDriver(ctx, x-2, y+4, t);
  // Yoke / harness
  px(ctx, x-6, y+10, 6, 1, "#3a2410");
  px(ctx, x-6, y+11, 6, 1, "#241810");
}
function drawWheel(ctx, cx, cy, spin){
  // Wheel is 5x5 with hub and spokes
  const k = "#1a1208";
  const ring = "#3a2410";
  // ring
  px(ctx, cx-2, cy-2, 5, 1, k);
  px(ctx, cx-2, cy+2, 5, 1, k);
  px(ctx, cx-2, cy-1, 1, 3, k);
  px(ctx, cx+2, cy-1, 1, 3, k);
  // inner ring (slightly lighter)
  px(ctx, cx-1, cy-1, 3, 3, ring);
  // hub
  px(ctx, cx,   cy,   1, 1, "#8a5e34");
  // spokes rotating
  if (spin===0){ px(ctx,cx-1,cy,1,1,k); px(ctx,cx+1,cy,1,1,k); px(ctx,cx,cy-1,1,1,k); px(ctx,cx,cy+1,1,1,k); }
  if (spin===1){ px(ctx,cx-1,cy-1,1,1,k); px(ctx,cx+1,cy+1,1,1,k); px(ctx,cx-1,cy+1,1,1,k); px(ctx,cx+1,cy-1,1,1,k); }
  if (spin===2){ px(ctx,cx-1,cy,1,1,k); px(ctx,cx+1,cy,1,1,k); px(ctx,cx,cy-1,1,1,k); px(ctx,cx,cy+1,1,1,k); }
  if (spin===3){ px(ctx,cx-1,cy+1,1,1,k); px(ctx,cx+1,cy-1,1,1,k); px(ctx,cx-1,cy-1,1,1,k); px(ctx,cx+1,cy+1,1,1,k); }
}
function drawDriver(ctx, x, y, t){
  const bob = Math.floor(Math.sin(t*0.009)*0.5);
  y += bob;
  // hat
  px(ctx, x,   y,   3, 1, "#1a1208");
  px(ctx, x-1, y+1, 5, 1, "#1a1208");
  // head
  px(ctx, x,   y+2, 3, 1, "#d8b078");
  // body
  px(ctx, x,   y+3, 3, 2, "#3a4a3a");
  // arms (holding reins)
  px(ctx, x+3, y+3, 2, 1, "#3a4a3a");
}

function drawHorse(ctx, x, y, t){
  const trot = Math.floor(t*0.0048) % 2;
  const c = "#3a2818";   // dark coat
  const c2 = "#5e3e22";  // lighter
  const m = "#1a1208";   // mane/tail
  // body
  px(ctx, x,   y,   8, 3, c);
  px(ctx, x,   y,   8, 1, c2);
  // neck
  px(ctx, x+7, y-2, 2, 4, c);
  px(ctx, x+7, y-2, 1, 4, c2);
  // head
  px(ctx, x+8, y-3, 3, 2, c);
  px(ctx, x+10,y-2, 1, 1, c2);
  px(ctx, x+10,y-3, 1, 1, c2); // ear
  // mane
  px(ctx, x+6, y-1, 1, 2, m);
  px(ctx, x+7, y-3, 1, 1, m);
  // tail
  px(ctx, x-1, y+1, 1, 3, m);
  // legs
  if (trot===0){
    px(ctx, x,   y+3, 1, 3, c);
    px(ctx, x+2, y+3, 1, 4, c);
    px(ctx, x+5, y+3, 1, 3, c);
    px(ctx, x+7, y+3, 1, 4, c);
  } else {
    px(ctx, x,   y+3, 1, 4, c);
    px(ctx, x+2, y+3, 1, 3, c);
    px(ctx, x+5, y+3, 1, 4, c);
    px(ctx, x+7, y+3, 1, 3, c);
  }
}

function drawWalker(ctx, x, y, t, hue, phase){
  // small 3x7 walker, side view
  const step = (Math.floor(t*0.0042) + phase) % 4;
  const bob = step === 1 || step === 3 ? -1 : 0;
  y += bob;
  // hue → cloak color via simple HSL approx (use pre-quantized chunks)
  const cloak = pickCloakColor(hue);
  const cloakHL = darken(cloak, -0.15) || cloak;
  // hat / hair
  px(ctx, x,   y,   3, 1, "#1a1208");
  // head
  px(ctx, x,   y+1, 3, 1, "#d8b078");
  // body (cloak)
  px(ctx, x,   y+2, 3, 3, cloak);
  px(ctx, x,   y+2, 3, 1, cloakHL);
  // arms swinging
  if (step%2===0){ px(ctx,x-1,y+2,1,2,cloak); px(ctx,x+3,y+3,1,2,cloak);}
  else           { px(ctx,x-1,y+3,1,2,cloak); px(ctx,x+3,y+2,1,2,cloak);}
  // legs
  if (step%2===0){
    px(ctx,x,  y+5,1,2,"#2a1810");
    px(ctx,x+2,y+5,1,1,"#2a1810");
  } else {
    px(ctx,x,  y+5,1,1,"#2a1810");
    px(ctx,x+2,y+5,1,2,"#2a1810");
  }
}
function pickCloakColor(hue){
  // Quantize a hue to a fixed pixel palette so figures don't shimmer
  const h = ((hue%360)+360)%360;
  if (h < 30 || h >= 330) return "#8a3a32";
  if (h < 70)  return "#a86a2a";
  if (h < 130) return "#3a6a3e";
  if (h < 190) return "#2a5a6e";
  if (h < 250) return "#3a4682";
  if (h < 290) return "#6a3a72";
  return "#8a3a5a";
}

// ----- Particles (pixel-style) -----
function drawPixelParticles(ctx, biome, t, daynight){
  if (daynight === "night" && biome === "woods"){
    // fireflies
    ctx.fillStyle = "#f4dc8a";
    for (let i=0;i<10;i++){
      const x = (((i*73 + t*0.05))%RES_W)|0;
      const y = (HORIZON + 6 + ((i*47)%(GROUND_TOP-HORIZON-10)))|0;
      const blink = (Math.sin(t*0.005 + i)+1)*0.5;
      if (blink > 0.5) ctx.fillRect(x, y, 1, 1);
    }
  }
  if (biome === "tundra" || (biome === "mountains" && daynight === "night")){
    // snow
    ctx.fillStyle = "#e8eaee";
    for (let i=0;i<35;i++){
      const x = (((i*53.7 + t*0.06))%RES_W)|0;
      const y = (((i*31.1 + t*0.08))%RES_H)|0;
      ctx.fillRect(x, y, 1, 1);
    }
  }
  if (biome === "sea"){
    // rain
    ctx.fillStyle = "#b8c8d4";
    for (let i=0;i<40;i++){
      const x = (((i*41.7 + t*0.04))%RES_W)|0;
      const y = (((i*23.1 + t*0.5))%(RES_H-20))|0;
      ctx.fillRect(x, y, 1, 2);
    }
  }
  if (biome === "desert"){
    // sand grains
    ctx.fillStyle = "#e8c89a";
    for (let i=0;i<30;i++){
      const x = (((i*61.3 + t*0.16))%(RES_W+20))-10|0;
      const y = ((HORIZON + (i*17)%(RES_H-HORIZON-10)))|0;
      ctx.fillRect(x, y, 2, 1);
    }
  }
  if (biome === "jungle"){
    // spores
    ctx.fillStyle = "#d6a8d4";
    for (let i=0;i<14;i++){
      const x = (((i*83 + t*0.03))%RES_W)|0;
      const y = ((HORIZON + 4 + ((i*19 + Math.sin(t*0.003+i)*8)%(GROUND_TOP-HORIZON-8))))|0;
      const blink = (Math.sin(t*0.004 + i)+1)*0.5;
      if (blink > 0.4) ctx.fillRect(x, y, 1, 1);
    }
  }
}

// ===========================================================
// BIOME-SPECIFIC FEATURES — landmarks & decor unique to each region.
// Called by drawPixelScene at two layer points: 'mid' (between mountains
// and the river/dunes, sits on the horizon line) and 'fore' (after the
// trail is drawn, in front of the ground band).
// ===========================================================
function drawBiomeFeatures(ctx, biome, P, t, daynight, phase){
  switch (biome){
    case "woods":     return phase === "mid" ? drawWoodsMid(ctx, P, t, daynight)     : drawWoodsFore(ctx, P, t);
    case "sea":       return phase === "mid" ? drawSeaMid(ctx, P, t, daynight)       : drawSeaFore(ctx, P, t);
    case "desert":    return phase === "mid" ? drawDesertMid(ctx, P, t, daynight)    : drawDesertFore(ctx, P, t);
    case "tundra":    return phase === "mid" ? drawTundraMid(ctx, P, t, daynight)    : drawTundraFore(ctx, P, t);
    case "jungle":    return phase === "mid" ? drawJungleMid(ctx, P, t, daynight)    : drawJungleFore(ctx, P, t);
    case "mountains": return phase === "mid" ? drawMountainsMid(ctx, P, t, daynight) : drawMountainsFore(ctx, P, t);
  }
}

// ---------- WOODS: standing stones in distance, deer + boulders foreground ----------
function drawWoodsMid(ctx, P, t){
  // Three menhir stones at horizon line, slow parallax
  const scroll = Math.floor(t*0.012) % 220;
  for (let pass=0; pass<2; pass++){
    for (const [bx, h, w] of [[40,12,4],[60,16,5],[78,10,4],[180,14,5],[300,12,4],[420,16,6],[560,11,4]]){
      const x = bx - scroll + pass*440;
      if (x < -10 || x > RES_W+10) continue;
      // stone slab
      px(ctx, x, HORIZON-h, w, h, P.forestNear);
      px(ctx, x, HORIZON-h, w, 1, P.treeHL);
      px(ctx, x+w-1, HORIZON-h+1, 1, h-1, "#0a0c10");
    }
  }
}
function drawWoodsFore(ctx, P, t){
  const scroll = Math.floor(t*0.045);
  // Boulders scattered
  const slots = [[20,2],[120,3],[260,2],[440,3],[600,2]];
  for (const [bx, sz] of slots){
    const x = ((bx - scroll) % (RES_W+80) + (RES_W+80)) % (RES_W+80) - 40;
    if (x < -10 || x > RES_W) continue;
    const y = GROUND_TOP + 8;
    // boulder
    for (let dy=0; dy<sz*2; dy++){
      const w = Math.max(2, sz*3 - Math.abs(dy-sz));
      px(ctx, x-w/2|0, y-dy, w, 1, P.groundDark);
    }
    px(ctx, x-sz, y-sz*2, sz, 1, P.groundHL);
  }
}

// ---------- SEA: lighthouse on rocky island, distant sails ----------
function drawSeaMid(ctx, P, t, daynight){
  // Distant sails (slow scroll)
  const scrollSails = Math.floor(t*0.009) % 360;
  for (let pass=0; pass<2; pass++){
    for (const [bx, sz] of [[60,1],[140,2],[220,1],[340,2],[440,1]]){
      const x = bx - scrollSails + pass*360;
      if (x < -10 || x > RES_W+10) continue;
      const y = HORIZON + 4;
      // hull
      px(ctx, x, y, 4+sz, 1, "#1a1f28");
      // sail
      px(ctx, x+1, y-1-sz, 1, 1+sz, "#dad2b6");
      px(ctx, x+2, y-1-sz*2, 1, 1+sz, "#dad2b6");
    }
  }
  // Lighthouse on rocky island (medium parallax)
  const scrollLH = Math.floor(t*0.018) % 480;
  for (let pass=0; pass<2; pass++){
    const baseX = 220 - scrollLH + pass*480;
    if (baseX < -40 || baseX > RES_W+40) continue;
    // Rocky island
    px(ctx, baseX-12, HORIZON, 24, 4, "#3a3a48");
    px(ctx, baseX-10, HORIZON-1, 20, 1, "#52576a");
    px(ctx, baseX-6,  HORIZON-2, 12, 1, "#3a3a48");
    // Lighthouse tower (white + red stripes)
    const lx = baseX-1, ly = HORIZON-14;
    px(ctx, lx, ly, 4, 10, "#e6e0c8");
    px(ctx, lx, ly+2, 4, 1, "#8a3a32");
    px(ctx, lx, ly+5, 4, 1, "#8a3a32");
    px(ctx, lx, ly+8, 4, 1, "#8a3a32");
    // Lamp room
    px(ctx, lx-1, ly-2, 6, 2, "#3a3a48");
    px(ctx, lx, ly-1, 4, 1, daynight === "night" ? "#f6c46a" : "#d4a14a");
    // Roof
    px(ctx, lx, ly-3, 4, 1, "#8a3a32");
    px(ctx, lx+1, ly-4, 2, 1, "#8a3a32");
    // Glow at night
    if (daynight === "night"){
      ctx.fillStyle = "rgba(244,196,106,0.25)";
      ctx.fillRect(lx-6, ly-4, 16, 4);
    }
  }
}
function drawSeaFore(ctx, P, t){
  // Driftwood / shells on the beach side of trail
  const scroll = Math.floor(t*0.04);
  for (const [bx, k] of [[40,0],[160,1],[300,0],[460,1],[580,0]]){
    const x = ((bx - scroll) % (RES_W+80) + (RES_W+80)) % (RES_W+80) - 40;
    if (x < -8 || x > RES_W) continue;
    const y = GROUND_TOP + 6;
    if (k === 0){
      // driftwood log
      px(ctx, x, y, 7, 1, "#5a3a1e");
      px(ctx, x, y-1, 7, 1, "#8a5e34");
      px(ctx, x+1, y+1, 5, 1, "#3a2410");
    } else {
      // shell pile
      px(ctx, x+1, y, 3, 1, "#e6e0c8");
      px(ctx, x, y-1, 1, 1, "#e6e0c8");
      px(ctx, x+4, y-1, 1, 1, "#e6e0c8");
    }
  }
}

// ---------- DESERT: distant pyramid, saguaro cacti, vultures ----------
function drawDesertMid(ctx, P, t, daynight){
  // Pyramid (slow parallax)
  const scroll = Math.floor(t*0.014) % 380;
  for (let pass=0; pass<2; pass++){
    for (const [bx, h, w] of [[100, 22, 28], [320, 18, 22], [500, 26, 32]]){
      const x = bx - scroll + pass*380;
      if (x < -40 || x > RES_W+40) continue;
      // Stepped pyramid
      for (let dy=0; dy<h; dy++){
        const ww = Math.floor((w/2) * (1 - dy/h));
        px(ctx, x-ww, HORIZON-dy, ww*2, 1, "#6a4030");
        // Sun side highlight
        px(ctx, x-ww, HORIZON-dy, ww, 1, "#8a5a3c");
      }
      // Step lines
      for (let dy=4; dy<h; dy+=4){
        const ww = Math.floor((w/2) * (1 - dy/h));
        px(ctx, x-ww-1, HORIZON-dy, ww*2+2, 1, "#4a2c20");
      }
    }
  }
  // Vultures circling (always 2-3)
  for (let i=0;i<3;i++){
    const cx = (RES_W*0.4 + Math.sin(t*0.0008 + i*2)*120) | 0;
    const cy = (30 + Math.cos(t*0.0008 + i*2)*8 + i*4) | 0;
    drawVulture(ctx, cx, cy, t+i*200);
  }
}
function drawVulture(ctx, x, y, t){
  const flap = Math.floor(t*0.005) % 3;
  if (flap === 0){
    px(ctx, x-3, y+1, 7, 1, "#1a1208");
    px(ctx, x, y, 1, 1, "#1a1208");
  } else if (flap === 1){
    px(ctx, x-3, y, 3, 1, "#1a1208");
    px(ctx, x+1, y, 3, 1, "#1a1208");
    px(ctx, x, y+1, 1, 1, "#1a1208");
  } else {
    px(ctx, x-2, y-1, 2, 1, "#1a1208");
    px(ctx, x+1, y-1, 2, 1, "#1a1208");
    px(ctx, x-1, y+1, 3, 1, "#1a1208");
  }
}
function drawDesertFore(ctx, P, t){
  // Saguaro cacti
  const scroll = Math.floor(t*0.06);
  const slots = [[40, 0], [140, 1], [260, 0], [380, 1], [500, 0], [620, 1]];
  for (const [bx, kind] of slots){
    const x = ((bx - scroll) % (RES_W+120) + (RES_W+120)) % (RES_W+120) - 60;
    if (x < -10 || x > RES_W) continue;
    const y = GROUND_TOP + 12;
    drawSaguaro(ctx, x, y, kind);
  }
  // Sun-bleached bones / skull occasionally
  const sk = Math.floor(t*0.04);
  const bx = ((200 - sk) % (RES_W*2)) - RES_W*0.5;
  if (bx >= 0 && bx < RES_W){
    const y = GROUND_TOP + 22;
    px(ctx, bx|0, y, 4, 2, "#dad2b6");
    px(ctx, (bx|0)+1, y-1, 2, 1, "#dad2b6");
  }
}
function drawSaguaro(ctx, x, y, kind){
  const c = "#3a6a3e", c2 = "#2a4a30";
  // trunk
  px(ctx, x, y-12, 2, 12, c);
  px(ctx, x, y-12, 1, 12, c2);
  // arms
  if (kind === 0){
    // left arm
    px(ctx, x-3, y-8, 1, 4, c);
    px(ctx, x-3, y-9, 1, 1, c);
    px(ctx, x-2, y-9, 1, 1, c);
    // right arm
    px(ctx, x+2, y-6, 1, 3, c);
    px(ctx, x+2, y-7, 1, 1, c);
  } else {
    // tall single arm
    px(ctx, x+2, y-9, 1, 6, c);
    px(ctx, x+2, y-10, 1, 1, c);
    px(ctx, x+3, y-10, 1, 1, c);
  }
}

// ---------- TUNDRA: aurora, distant cairn, ice floes ----------
function drawTundraMid(ctx, P, t, daynight){
  // Aurora bands (only at night)
  if (daynight === "night"){
    const colors = ["rgba(122,200,160,0.18)", "rgba(160,140,220,0.14)", "rgba(120,180,220,0.16)"];
    for (let band=0; band<3; band++){
      ctx.fillStyle = colors[band];
      for (let x=0; x<RES_W; x+=2){
        const phase = t*0.0006 + band*1.3;
        const y = 12 + band*8 + Math.sin(x*0.04 + phase)*4 + Math.cos(x*0.02 + phase)*3;
        ctx.fillRect(x, y|0, 2, 6);
      }
    }
  }
  // Cairn stone stack
  const scroll = Math.floor(t*0.018) % 400;
  for (let pass=0; pass<2; pass++){
    const x = 180 - scroll + pass*400;
    if (x > -20 && x < RES_W+20){
      // Stack of 5 rocks tapering up
      for (let i=0;i<5;i++){
        const w = 6 - i;
        px(ctx, x-w/2|0, HORIZON-2-i*2, w, 2, "#5e6878");
        px(ctx, x-w/2|0, HORIZON-2-i*2, w, 1, "#8a96a4");
      }
    }
    // A second smaller cairn
    const x2 = 480 - scroll + pass*400;
    if (x2 > -20 && x2 < RES_W+20){
      for (let i=0;i<3;i++){
        const w = 5 - i;
        px(ctx, x2-w/2|0, HORIZON-2-i*2, w, 2, "#5e6878");
        px(ctx, x2-w/2|0, HORIZON-2-i*2, w, 1, "#8a96a4");
      }
    }
  }
}
function drawTundraFore(ctx, P, t){
  // Ice floes in foreground (between trail and viewer), no specific scroll
  const scroll = Math.floor(t*0.04);
  const slots = [[60, 6], [180, 8], [330, 7], [480, 6], [620, 8]];
  for (const [bx, w] of slots){
    const x = ((bx - scroll) % (RES_W+80) + (RES_W+80)) % (RES_W+80) - 40;
    if (x < -10 || x > RES_W) continue;
    const y = GROUND_TOP + 14;
    // Ice chunk with shadow
    px(ctx, x, y, w, 3, "#dde2e8");
    px(ctx, x, y, w, 1, "#ffffff");
    px(ctx, x, y+3, w, 1, "#9ec2d8");
  }
  // A frozen tree stump occasionally
  const sk = Math.floor(t*0.035);
  for (const [bx] of [[120],[340],[540]]){
    const x = ((bx - sk) % (RES_W+200) + (RES_W+200)) % (RES_W+200) - 100;
    if (x < -10 || x > RES_W) continue;
    const y = GROUND_TOP + 8;
    // bare tree
    px(ctx, x, y-10, 1, 10, "#3a3a3a");
    px(ctx, x-2, y-10, 1, 3, "#3a3a3a");
    px(ctx, x+2, y-9, 1, 3, "#3a3a3a");
    px(ctx, x-1, y-12, 1, 2, "#3a3a3a");
    px(ctx, x+1, y-12, 1, 2, "#3a3a3a");
    // snow cap on branches
    px(ctx, x, y-13, 1, 1, "#e6e6e0");
    px(ctx, x-2, y-11, 1, 1, "#e6e6e0");
    px(ctx, x+2, y-10, 1, 1, "#e6e6e0");
  }
}

// ---------- JUNGLE: ziggurat ruin, palm trees, parrots ----------
function drawJungleMid(ctx, P, t, daynight){
  // Stepped ziggurat (slow parallax)
  const scroll = Math.floor(t*0.016) % 460;
  for (let pass=0; pass<2; pass++){
    const x = 200 - scroll + pass*460;
    if (x > -50 && x < RES_W+50){
      // 4 tiers
      const tiers = [[34, 4], [28, 4], [22, 4], [14, 4]];
      let cy = HORIZON;
      for (const [w, h] of tiers){
        for (let dy=0; dy<h; dy++){
          px(ctx, x-w/2|0, cy-dy-1, w, 1, "#2a4a30");
        }
        // top edge highlight
        px(ctx, x-w/2|0, cy-h, w, 1, "#3a6a3e");
        // step shadow
        px(ctx, x-w/2|0, cy-1, w, 1, "#1a3020");
        cy -= h;
      }
      // top idol/altar
      px(ctx, x-1, cy-3, 2, 3, "#5e3a2a");
      // moss highlights
      px(ctx, x-10, HORIZON-1, 2, 1, "#7aa090");
      px(ctx, x+8, HORIZON-1, 2, 1, "#7aa090");
    }
  }
  // Parrot flecks across the sky (small bright dots)
  for (let i=0;i<6;i++){
    const x = (((i*97 + t*0.04))%RES_W)|0;
    const y = (20 + ((i*23)%20))|0;
    const flap = (Math.sin(t*0.012 + i*1.7)+1)*0.5;
    ctx.fillStyle = flap > 0.5 ? "#d4a14a" : "#8a3a32";
    ctx.fillRect(x, y, 1, 1);
    ctx.fillRect(x+1, y, 1, 1);
  }
}
function drawJungleFore(ctx, P, t){
  // Palm-fern fronds at foreground
  const scroll = Math.floor(t*0.06);
  const slots = [[20,0],[110,1],[210,0],[330,1],[440,0],[560,1],[640,0]];
  for (const [bx, kind] of slots){
    const x = ((bx - scroll) % (RES_W+140) + (RES_W+140)) % (RES_W+140) - 70;
    if (x < -10 || x > RES_W) continue;
    const y = GROUND_TOP + 16;
    if (kind === 0){
      // Palm tree
      px(ctx, x, y-16, 1, 16, "#3a2410");
      // fronds
      px(ctx, x-4, y-17, 4, 1, "#2a4a30");
      px(ctx, x+1, y-17, 4, 1, "#2a4a30");
      px(ctx, x-3, y-18, 3, 1, "#3a6a3e");
      px(ctx, x+1, y-18, 3, 1, "#3a6a3e");
      px(ctx, x-1, y-19, 3, 1, "#3a6a3e");
    } else {
      // Big fern bush
      for (let i=0; i<3; i++){
        const fw = 6-i;
        px(ctx, x-fw, y-2-i*2, fw*2, 1, "#143020");
        px(ctx, x-fw+1, y-3-i*2, fw*2-2, 1, "#2a4a30");
      }
    }
  }
}

// ---------- MOUNTAINS: wooden watchtower, eagles, suspension bridge ----------
function drawMountainsMid(ctx, P, t, daynight){
  // Watchtower on a peak
  const scroll = Math.floor(t*0.013) % 480;
  for (let pass=0; pass<2; pass++){
    const x = 260 - scroll + pass*480;
    if (x > -20 && x < RES_W+20){
      // base rocks (peak)
      for (let dy=0;dy<10;dy++){
        const w = 10 - Math.floor(dy/2);
        px(ctx, x-w/2|0, HORIZON-dy, w, 1, "#363a4a");
      }
      // tower shaft
      px(ctx, x-2, HORIZON-18, 4, 8, "#5e3a2a");
      px(ctx, x-2, HORIZON-18, 1, 8, "#8a5e34");
      // tower roof
      px(ctx, x-3, HORIZON-19, 6, 1, "#3a2410");
      px(ctx, x-2, HORIZON-20, 4, 1, "#3a2410");
      px(ctx, x-1, HORIZON-21, 2, 1, "#3a2410");
      // window
      px(ctx, x-1, HORIZON-15, 2, 2, daynight === "night" ? "#f6c46a" : "#1a1208");
    }
    // Suspension bridge between distant peaks
    const bx = 80 - scroll + pass*480;
    if (bx > -20 && bx < RES_W+20){
      // two posts
      px(ctx, bx,    HORIZON-3, 1, 4, "#2a1810");
      px(ctx, bx+20, HORIZON-3, 1, 4, "#2a1810");
      // rope line (slight sag)
      for (let i=0;i<21;i++){
        const sag = Math.floor(Math.sin(i*0.15)*2);
        px(ctx, bx+i, HORIZON-2+sag, 1, 1, "#3a2410");
      }
      // planks
      for (let i=2;i<19;i+=3){
        px(ctx, bx+i, HORIZON+1, 2, 1, "#5a3a1e");
      }
    }
  }
  // Eagle soaring
  for (let i=0;i<2;i++){
    const cx = (RES_W*0.5 + Math.sin(t*0.0006 + i*3)*180) | 0;
    const cy = (20 + Math.cos(t*0.0009 + i*3)*8 + i*6) | 0;
    drawEagle(ctx, cx, cy, t+i*400);
  }
}
function drawEagle(ctx, x, y, t){
  const flap = Math.floor(t*0.004) % 2;
  if (flap === 0){
    px(ctx, x-4, y, 9, 1, "#1a1208");
    px(ctx, x, y+1, 1, 1, "#1a1208");
    px(ctx, x-2, y-1, 1, 1, "#1a1208");
    px(ctx, x+2, y-1, 1, 1, "#1a1208");
  } else {
    px(ctx, x-3, y+1, 7, 1, "#1a1208");
    px(ctx, x-2, y+2, 1, 1, "#1a1208");
    px(ctx, x+2, y+2, 1, 1, "#1a1208");
    px(ctx, x, y, 1, 1, "#1a1208");
  }
}
function drawMountainsFore(ctx, P, t){
  // Tumbled boulders along trail
  const scroll = Math.floor(t*0.055);
  for (const [bx, sz] of [[30,3],[160,4],[300,3],[460,4],[600,3]]){
    const x = ((bx - scroll) % (RES_W+80) + (RES_W+80)) % (RES_W+80) - 40;
    if (x < -10 || x > RES_W) continue;
    const y = GROUND_TOP + 10;
    for (let dy=0; dy<sz*2; dy++){
      const w = Math.max(2, sz*3 - Math.abs(dy-sz));
      px(ctx, x-w/2|0, y-dy, w, 1, "#444858");
    }
    px(ctx, x-sz+1, y-sz*2+1, sz, 1, "#7a8aa0");
  }
}
function drawPixelScene(ctx, biome, daynight, t, party, wagonX){
  const baseP = PIX[biome] || PIX.woods;
  const P = daynight === "night" ? nightOverride(baseP) : baseP;

  // Sky
  drawSky(ctx, P);
  if (daynight === "night") drawStars(ctx, P, t);
  drawClouds(ctx, P, t);

  // Mountains
  drawMountains(ctx, P, biome, t);

  // Forest strip just under mountains (skip desert)
  if (biome !== "desert" && biome !== "tundra"){
    drawForestStrip(ctx, P, biome, t);
  } else if (biome === "tundra") {
    // snow-covered low ridge
    px(ctx, 0, HORIZON-3, RES_W, 4, P.snow);
    px(ctx, 0, HORIZON-3, RES_W, 1, "#c0c8d2");
  }

  // Mid strip (river / dunes)
  drawMidStrip(ctx, P, biome, t);

  // Biome-specific mid features (lighthouses, pyramids, ziggurat, etc.)
  drawBiomeFeatures(ctx, biome, P, t, daynight, "mid");

  // Ground + trail
  const trailY = drawGround(ctx, P, biome, t);

  // Biome-specific foreground (cacti, fronds, ice floes, etc.)
  drawBiomeFeatures(ctx, biome, P, t, daynight, "fore");

  // Particles
  drawPixelParticles(ctx, biome, t, daynight);

  // Caravan position advances across the scene with leg progress
  const WX = (wagonX == null ? WAGON_X : wagonX) | 0;
  // Horse first (in front of wagon i.e. to the left since wagon moves left-ward)
  drawHorse(ctx, WX - 12, trailY-4, t);
  // Wagon
  drawWagon(ctx, WX, trailY-11, t, P, daynight);

  // Walkers behind the wagon (party — up to 4 figures spaced behind)
  if (party && party.length){
    const aliveParty = party.filter(p=>!p.lost);
    const max = Math.min(4, aliveParty.length);
    for (let i=0; i<max; i++){
      const p = aliveParty[i];
      const wx = WX + 30 + i*8;
      const wy = trailY - 6;
      drawWalker(ctx, wx, wy, t, p.hue, i);
    }
  }

  // Subtle vignette at edges (just for the very top corners)
  if (daynight !== "night"){
    ctx.fillStyle = "rgba(0,0,0,0.18)";
    ctx.fillRect(0, 0, RES_W, 4);
    ctx.fillRect(0, RES_H-3, RES_W, 3);
  } else {
    ctx.fillStyle = "rgba(0,0,0,0.35)";
    ctx.fillRect(0, 0, RES_W, 3);
    ctx.fillRect(0, RES_H-3, RES_W, 3);
  }
}

// ===== Component =====
function BiomeScene({ biome, dayNight, moving, party, progress, t }) {
  const canvasRef = useRef(null);
  const offRef = useRef(null);
  const animRef = useRef(null);
  const sizeRef = useRef({ w: 800, h: 480 });
  const partyRef = useRef(party);
  const progressRef = useRef(progress || 0);
  const wagonXRef = useRef(null);
  useEffect(() => { partyRef.current = party; });
  useEffect(() => { progressRef.current = progress || 0; }, [progress]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.imageSmoothingEnabled = false;
    let mounted = true;
    wagonXRef.current = null; // re-seat the caravan when the leg/biome changes

    // Offscreen low-res canvas
    if (!offRef.current){
      offRef.current = document.createElement("canvas");
      offRef.current.width = RES_W;
      offRef.current.height = RES_H;
    }
    const off = offRef.current;
    const octx = off.getContext("2d");
    octx.imageSmoothingEnabled = false;

    function resize(){
      const r = canvas.getBoundingClientRect();
      // Pin canvas to integer pixel size matching DOM size
      canvas.width  = Math.max(2, Math.floor(r.width));
      canvas.height = Math.max(2, Math.floor(r.height));
      ctx.imageSmoothingEnabled = false;
      sizeRef.current = { w: canvas.width, h: canvas.height };
    }
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    function tick(now){
      if (!mounted) return;
      // Draw at low res. Scale time globally so all parallax/animation rates
      // drop proportionally — pilgrimage pace, not stagecoach race.
      const TIME_SCALE = 0.30;
      // Caravan creeps across the scene as the leg progresses (eased).
      const minX = 150, maxX = RES_W - 200;
      const targetX = minX + (maxX - minX) * Math.max(0, Math.min(1, progressRef.current));
      if (wagonXRef.current == null) wagonXRef.current = targetX;
      else wagonXRef.current += (targetX - wagonXRef.current) * 0.04;
      drawPixelScene(octx, biome, dayNight, now * TIME_SCALE, partyRef.current, wagonXRef.current);
      // Upscale to canvas — fit by smaller axis, then zoom in to make features bigger.
      // Anchor the wagon row to ~78% of canvas height so the caravan stays visible
      // when zoom crops the edges.
      const { w, h } = sizeRef.current;
      const ZOOM = 1.7;
      const scale = Math.min(w / RES_W, h / RES_H) * ZOOM;
      const dw = RES_W * scale, dh = RES_H * scale;
      const wagonInternalY = 152; // pixel-y of the wagon row
      const targetDisplayY = h * 0.78;
      const dx = Math.floor((w - dw) / 2);
      const dy = Math.floor(targetDisplayY - wagonInternalY * scale);
      ctx.imageSmoothingEnabled = false;
      ctx.fillStyle = "#04060a";
      ctx.fillRect(0, 0, w, h);
      ctx.drawImage(off, 0, 0, RES_W, RES_H, dx, dy, dw, dh);
      animRef.current = requestAnimationFrame(tick);
    }
    animRef.current = requestAnimationFrame(tick);
    return () => { mounted = false; cancelAnimationFrame(animRef.current); ro.disconnect(); };
  }, [biome, dayNight]);

  return (
    <div className="scene-inner" style={{position:"absolute", inset:0}}>
      <canvas ref={canvasRef} style={{display:"block", imageRendering:"pixelated", width:"100%", height:"100%"}} />
    </div>
  );
}

function useTicker(running = true) {
  const [t, setT] = React.useState(0);
  useEffect(() => {
    if (!running) return;
    let raf, last = performance.now();
    function loop(now){
      setT(prev => prev + (now - last));
      last = now;
      raf = requestAnimationFrame(loop);
    }
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [running]);
  return t;
}

// Compatibility export — some older code expected this.
const BIOME_PALETTES = PIX;

Object.assign(window, { BeastSilhouette, ApprenticePortrait, RegionIcon, BiomeScene, useTicker, BIOME_PALETTES });
