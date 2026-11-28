// Slap Happy: the title screen, and the split between the big screen (host)
// and the phones (teams). Phones arrive straight on the join screen from the
// QR code (?join=ABCD).

import { $, q, isPhone, blockZoom, esc, bindTaps } from './common.js';
import { isCode } from './net.js';
import { unlock, play, primeSpeech } from './sound.js';
import { startHost, savedShow, startMirror } from './host.js';
import { startTeam, savedTeam } from './team.js';
import { t, lang, setLang, onLang, langSwitch } from './i18n.js';

blockZoom();
const app = $('#app');
document.documentElement.classList.toggle('phone', isPhone());
addEventListener('resize', () => document.documentElement.classList.toggle('phone', isPhone()));

let offLang = null;
function title() {
  if (offLang) offLang();
  offLang = onLang(() => { if ($('.screen.title', app)) title(); });
  const show = savedShow();
  const team = savedTeam();
  const phone = isPhone();
  const hostBtn = `<button class="btn big gold" data-act="host">${t('host_btn')}<small>${t('host_sub')}</small></button>`;
  const joinBtn = `<button class="btn big pink" data-act="join">${t('join_btn')}<small>${t('join_sub')}</small></button>`;
  app.innerHTML = `
  <div class="screen title">
    <div class="rays turn"></div>
    ${langSwitch('corner')}
    <div class="title-wrap">
      <div class="marquee chase"><h1 class="logo"><span class="w1">Slap</span><span class="w2">Happy</span></h1></div>
      <div class="title-btns">${phone ? joinBtn + hostBtn : hostBtn + joinBtn}</div>
      <button class="btn ghost watch" data-act="watch">${t('watch_btn')}</button>
      ${team && phone ? `<button class="btn ghost resume" data-act="rejoin">${t('rejoin', { name: esc(team.name), room: esc(team.room) })}</button>` : ''}
      ${show && !phone ? `<button class="btn ghost resume" data-act="resume">${t('resume', { room: esc(show.room) })}</button>` : ''}
    </div>
  </div>`;
  bindTaps(app.firstElementChild, {
    lang: id => { play('pop'); setLang(id); },
    host: () => { play('pop'); primeSpeech('', lang()); startHost(app, { fresh: true }); },
    resume: () => { play('pop'); primeSpeech('', lang()); startHost(app, { fresh: false }); },
    join: () => { play('pop'); startTeam(app, { back: title }); },
    rejoin: () => { play('pop'); startTeam(app, { code: team.room, back: title }); },
    watch: () => { play('pop'); primeSpeech('', lang()); startMirror(app, { code: '', back: title }); },
  });
}

const joinCode = (q.get('join') || '').toUpperCase();
const watchCode = (q.get('watch') || '').toUpperCase();
if (isCode(joinCode)) startTeam(app, { code: joinCode, back: title });
else if (isCode(watchCode)) startMirror(app, { code: watchCode, back: title });
else if (q.get('host') !== null) startHost(app, { fresh: !savedShow() });
else title();

window.SLAP = window.SLAP || {};
window.SLAP.title = title;
window.SLAP.unlock = unlock;
