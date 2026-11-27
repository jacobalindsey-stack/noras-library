// Buzzes you can feel. Android phones use the vibration API. iPhones have no
// vibration API, but Safari ticks the Taptic Engine when a switch control is
// flipped, so we flip a hidden one (works best straight after a tap).

const canVibrate = typeof navigator.vibrate === 'function';
const isIOS = !canVibrate && ('ontouchend' in document) && /iP(hone|ad|od)|Macintosh/.test(navigator.userAgent);
let label = null;

function tick() {
  if (!isIOS) return;
  try {
    if (!label) {
      label = document.createElement('label');
      label.setAttribute('aria-hidden', 'true');
      label.style.cssText = 'position:fixed;left:-200px;top:0;width:1px;height:1px;overflow:hidden;opacity:0;pointer-events:none';
      const input = document.createElement('input');
      input.type = 'checkbox'; input.setAttribute('switch', ''); input.tabIndex = -1;
      label.appendChild(input);
      document.body.appendChild(label);
    }
    label.click();
  } catch (e) {}
}

const PATTERNS = {
  tap: [12],
  slap: [35, 40, 70],
  armed: [25],
  out: [90],
  up: [60, 50, 60, 50, 140],
  win: [40, 60, 40, 60, 40, 60, 220],
  lose: [220],
  champ: [80, 60, 80, 60, 80, 60, 400],
};

export function haptic(kind = 'tap') {
  const p = PATTERNS[kind] || PATTERNS.tap;
  if (canVibrate) {
    // Chrome refuses (and complains) until the page has been tapped once
    if (navigator.userActivation && !navigator.userActivation.hasBeenActive) return;
    try { navigator.vibrate(p); } catch (e) {}
    return;
  }
  if (!isIOS) return;
  // one tick per pulse in the pattern, spaced the same way
  let t = 0;
  for (let i = 0; i < p.length; i += 2) { const at = t; setTimeout(tick, at); t += p[i] + (p[i + 1] || 0); }
}
export const hapticsAvailable = canVibrate || isIOS;
