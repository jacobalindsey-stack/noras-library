// Slap Happy: the title screen, and the split between the big screen (host)
// and the phones (teams). Phones arrive straight on the join screen from the
// QR code (?join=ABCD).

import { $, q, isPhone, blockZoom, esc, bindTaps } from './common.js';
import { isCode } from './net.js';
import { unlock, play } from './sound.js';
import { startHost, savedShow } from './host.js';
import { startTeam, savedTeam } from './team.js';

blockZoom();
const app = $('#app');
document.documentElement.classList.toggle('phone', isPhone());
addEventListener('resize', () => document.documentElement.classList.toggle('phone', isPhone()));

function title() {
  const show = savedShow();
  const team = savedTeam();
  const phone = isPhone();
  const hostBtn = `<button class="btn big gold" data-act="host">Host the show<small>on the big screen</small></button>`;
  const joinBtn = `<button class="btn big pink" data-act="join">Join a team<small>with your phone</small></button>`;
  app.innerHTML = `
  <div class="screen title">
    <div class="rays turn"></div>
    <div class="title-wrap">
      <div class="marquee chase"><h1 class="logo"><span class="w1">Slap</span><span class="w2">Happy</span></h1></div>
      <div class="title-btns">${phone ? joinBtn + hostBtn : hostBtn + joinBtn}</div>
      ${team && phone ? `<button class="btn ghost resume" data-act="rejoin">Back to ${esc(team.name)} in ${esc(team.room)}</button>` : ''}
      ${show && !phone ? `<button class="btn ghost resume" data-act="resume">Back to the show in ${esc(show.room)}</button>` : ''}
    </div>
  </div>`;
  bindTaps(app.firstElementChild, {
    host: () => { play('pop'); startHost(app, { fresh: true }); },
    resume: () => { play('pop'); startHost(app, { fresh: false }); },
    join: () => { play('pop'); startTeam(app, { back: title }); },
    rejoin: () => { play('pop'); startTeam(app, { code: team.room, back: title }); },
  });
}

const joinCode = (q.get('join') || '').toUpperCase();
if (isCode(joinCode)) startTeam(app, { code: joinCode, back: title });
else if (q.get('host') !== null) startHost(app, { fresh: !savedShow() });
else title();

window.SLAP = window.SLAP || {};
window.SLAP.title = title;
window.SLAP.unlock = unlock;
