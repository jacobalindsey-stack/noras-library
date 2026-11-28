// Words on screen, in English and Croatian. Every device picks its own
// language: the big screen can be in English while Grandma's TV and the
// cousins' phones in Croatia show Croatian. It's saved on the device, and a
// phone or TV set to Croatian starts in Croatian by itself.
//
// Questions carry their own translations (see TOPICS.md); this file is only
// the game's own words. To add a language: add it to LANGS and give it a
// dictionary below (any word left out falls back to English).

export const LANGS = [
  { id: 'en', name: 'English', short: 'EN', speech: 'en-US' },
  { id: 'hr', name: 'Hrvatski', short: 'HR', speech: 'hr-HR' },
];
const KEY = 'slaphappy.lang.v1';

const D = {
  en: {
    language: 'Language',
    // title
    host_btn: 'Host the show', host_sub: 'on the big screen',
    join_btn: 'Join a team', join_sub: 'with your phone',
    watch_btn: 'Watch on another screen',
    rejoin: 'Back to {name} in {room}', resume: 'Back to the show in {room}',
    // joining
    join_title: 'Join the show', type_letters: 'Type the four letters on the big screen',
    join: 'Join', back: 'Back', err_four: 'The room has four letters.',
    err_vowels: "There's no show called {code}. Room letters never have vowels.",
    finding: 'Finding the show', reconnecting: 'Reconnecting',
    err_noroom: 'No show is using {code} right now. Check the letters on the big screen.',
    err_seats: 'That show already has every seat filled.',
    err_kicked: 'The big screen took your team out of the show. You can join again.',
    err_join: 'Something went wrong joining. Try again.',
    err_offline: "Can't reach the show. Check that this phone is online.",
    err_eight: 'That show already has eight teams.',
    wrap: "That's a wrap!", thanks: 'Thanks for playing Slap Happy', join_another: 'Join another show',
    // the team form
    your_team: 'Your team', team_name: 'Team name', team_color: 'Team color', buzzer_sound: 'Buzzer sound',
    ready: "We're ready", silly_name: 'Pick a silly name', name_needed: 'Give your team a name (or roll the dice).',
    team_here: 'Team on this screen', add_team: 'Add team', cancel: 'Cancel',
    c_cherry: 'Cherry', c_tangerine: 'Tangerine', c_lemon: 'Lemon', c_lime: 'Lime', c_aqua: 'Aqua', c_blueberry: 'Blueberry', c_grape: 'Grape', c_bubblegum: 'Bubblegum',
    bz_boing: 'Boing', bz_honk: 'Honk', bz_laser: 'Laser', bz_cowbell: 'Cowbell', bz_meow: 'Meow', bz_airhorn: 'Air horn', bz_quack: 'Quack', bz_whistle: 'Whistle', bz_badum: 'Ba-dum', bz_weewoo: 'Wee-woo',
    // the phone buzzer
    sound_onoff: 'Sound on or off', locked_in: 'Locked in!', too_early: 'Too early! Wait till it lights up.',
    slapped_q: 'Slapped! Is it you?', slap: 'Slap!', host_asleep: 'The big screen is asleep. Waiting for it',
    you_in: "You're in!", test_it: 'Slap the button to test it. The show starts soon.', change_team: 'Change team',
    get_ready: 'Get ready!', starting: 'The show is starting',
    bonus: 'Bonus round!', double_this: 'Double points for this one', next_q: 'Next question', eyes: 'Eyes on the big screen',
    wait: 'Wait', steal_it: 'Steal it!', slap_when: 'Slap when it lights up', slap_when_x: 'Slap when it lights up!',
    listen_q: 'Listen to the question.', read_q: 'Read the question.', slap_steal: 'Slap to steal!',
    sitting_out: 'Sitting out', others_steal: 'The other teams are trying to steal this one',
    so_close: 'So close!', beaten: 'Beaten!', first_picking: '{team} slapped first and is picking',
    picked_wrong: '{team} picked {L}. Wrong!', ran_out: '{team} ran out of time', get_ready_steal: 'Get ready to steal!',
    team_picked: '{team} picked',
    checking: 'Checking...', you_up: "You're up!", tap_answer: 'Tap your answer',
    out_of_time: 'Out of time!', not_that: 'Not that one!', chance_steal: 'The other teams get a chance to steal it', better_luck: 'Better luck on the next one',
    stolen: 'Stolen!', nailed: 'Nailed it!', team_got: '{team} got it!', team_stole: '{team} stole it!', answer_was: 'The answer was',
    nobody_got: 'Nobody got it', nobody_slapped: 'Nobody slapped', times_up: "Time's up!",
    paused: 'Paused', hang_tight: 'Hang tight', winner_is: 'And the winner is...',
    tied_win: 'Tied for the win!', champions: 'Champions!', great_playing: 'Great playing!', won_show: '{team} won the show',
    pts_one: '{n} point', pts_many: '{n} points',
    // the big screen
    music_onoff: 'Music on or off', leave_show: 'Leave the show', pause: 'Pause',
    join_phone: 'Join on your phone', room_letters: 'Room letters',
    farnote: 'Family far away? Open this page on their TV or iPad, tap Watch on another screen, and type the letters.',
    teams: 'Teams', add_local: 'Add a team on this screen',
    topics: 'Topics', no_topics: 'No topics found.', questions: 'Questions', time_slap: 'Time to slap',
    read_aloud: 'Read questions aloud', off: 'Off', on: 'On', start: 'Start the show',
    waiting_host: 'Waiting for the host to start the show',
    leave_q: 'Leave the show?', leave_note: 'Phones will be sent home. The teams can join a new show later.', leave: 'Leave', stay: 'Stay',
    net_warn: "Phones can't reach this show right now. Check the Wi-Fi, or add teams on this screen.",
    remove: 'Remove {name}', phone_asleep: 'phone asleep',
    empty_teams: "Scan the code or go to the address with each team's phone. Teams pop up here as they join.",
    test: 'Test', steal_coming: 'Steal coming', wait_for_it: 'Wait for it', slapped: 'Slapped!',
    resume_q: 'Pick up where you left off?', resume_note: 'Question {i} of {n}, scores kept.', back_lobby: 'Back to the lobby', keep_playing: 'Keep playing',
    say_lets_play: "Let's play Slap Happy!", say_welcome: 'Welcome to Slap Happy!',
    go: 'Go!', double_pts: 'Double points', question_n: 'Question {n}', of_n: 'of {n}',
    mixed: 'Mixed bag', mixed_n: 'Mixed bag of {n} topics', join_at: 'Join:', bonus_tag: 'Bonus round: double points',
    round: 'Question <b>{n}</b> of {total}', did_you_know: 'Did you know?', to_pick: 'to pick', to_slap: 'to slap',
    listen: 'Listen...', read_it: 'Read it...', steal_soon: 'Steal coming...', slap_now: 'Slap now!',
    pick_board: '{name}, pick on the board!', pick_phone: '{name}, pick on your phone!',
    says: '{name} says {L}!', not_L: 'Not {L}!', late_name: 'Out of time, {name}!',
    plus_for: '+{pts} for {name}!', stolen_pre: 'Stolen! ',
    ans_noslap: 'Nobody slapped. Here’s the answer', ans_nosteal: 'No steals. Here’s the answer', ans_skip: 'Here’s the answer', ans_nobody: 'Nobody got it. Here’s the answer',
    next_question: 'Next question', skip_q: 'Skip this question', end_now: 'End the show now', fix_scores: 'Fix the scores',
    take100: 'Take away 100', add100: 'Add 100',
    sound_v: 'Sound: {v}', music_v: 'Music: {v}', read_v: 'Read aloud: {v}', v_on: 'on', v_off: 'off',
    tie: "It's a tie!", winner_short: 'The winner is', play_again: 'Play again', change_setup: 'Change teams or topics', finish: 'Finish',
    watch_title: 'Watch the show', watch_go: 'Watch', show_full: 'That show is full.', err_generic: 'Something went wrong. Try again.',
    err_offline_screen: "Can't reach the show. Check that this screen is online.",
    connecting: 'Connecting to the show', waiting_big: 'Waiting for the big screen', big_dropped: 'The big screen dropped out. Waiting for it',
    watch_another: 'Watch another show', host_paused: 'The host paused the show',
  },
  hr: {
    language: 'Jezik',
    host_btn: 'Vodi kviz', host_sub: 'na velikom ekranu',
    join_btn: 'Uđi u ekipu', join_sub: 'svojim mobitelom',
    watch_btn: 'Gledaj na drugom ekranu',
    rejoin: 'Natrag u ekipu {name} ({room})', resume: 'Natrag u kviz {room}',
    join_title: 'Uđi u kviz', type_letters: 'Upiši četiri slova s velikog ekrana',
    join: 'Uđi', back: 'Natrag', err_four: 'Soba ima četiri slova.',
    err_vowels: 'Nema kviza {code}. Slova sobe nikad nemaju samoglasnike.',
    finding: 'Tražim kviz', reconnecting: 'Ponovno se spajam',
    err_noroom: 'Nijedan kviz trenutno ne koristi {code}. Provjeri slova na velikom ekranu.',
    err_seats: 'U tom kvizu su sva mjesta zauzeta.',
    err_kicked: 'Veliki ekran je maknuo vašu ekipu iz kviza. Možete opet ući.',
    err_join: 'Ulazak nije uspio. Pokušaj ponovno.',
    err_offline: 'Ne mogu doći do kviza. Provjeri je li mobitel spojen na internet.',
    err_eight: 'Taj kviz već ima osam ekipa.',
    wrap: 'Kraj kviza!', thanks: 'Hvala što ste igrali Slap Happy', join_another: 'Uđi u drugi kviz',
    your_team: 'Vaša ekipa', team_name: 'Ime ekipe', team_color: 'Boja ekipe', buzzer_sound: 'Zvuk tipke',
    ready: 'Spremni smo', silly_name: 'Izaberi šašavo ime', name_needed: 'Dajte ekipi ime (ili bacite kocku).',
    team_here: 'Ekipa na ovom ekranu', add_team: 'Dodaj ekipu', cancel: 'Odustani',
    c_cherry: 'Trešnja', c_tangerine: 'Mandarina', c_lemon: 'Limun', c_lime: 'Limeta', c_aqua: 'Tirkizna', c_blueberry: 'Borovnica', c_grape: 'Grožđe', c_bubblegum: 'Žvakaća',
    bz_boing: 'Boing', bz_honk: 'Trubica', bz_laser: 'Laser', bz_cowbell: 'Kravlje zvono', bz_meow: 'Mijau', bz_airhorn: 'Sirena', bz_quack: 'Kva-kva', bz_whistle: 'Zviždaljka', bz_badum: 'Ba-dum', bz_weewoo: 'Iju-iju',
    sound_onoff: 'Zvuk uključen ili isključen', locked_in: 'Odabrano!', too_early: 'Prerano! Čekaj da zasvijetli.',
    slapped_q: 'Lupili ste! Jeste li prvi?', slap: 'Lupi!', host_asleep: 'Veliki ekran spava. Čekamo ga',
    you_in: 'Unutra ste!', test_it: 'Lupite tipku da je isprobate. Kviz uskoro počinje.', change_team: 'Promijeni ekipu',
    get_ready: 'Pripremite se!', starting: 'Kviz počinje',
    bonus: 'Bonus runda!', double_this: 'Ovo pitanje nosi dvostruke bodove', next_q: 'Sljedeće pitanje', eyes: 'Gledajte veliki ekran',
    wait: 'Čekaj', steal_it: 'Ukradi!', slap_when: 'Lupi kad zasvijetli', slap_when_x: 'Lupite kad zasvijetli!',
    listen_q: 'Slušajte pitanje.', read_q: 'Pročitajte pitanje.', slap_steal: 'Lupi i ukradi!',
    sitting_out: 'Pauzirate', others_steal: 'Druge ekipe pokušavaju ukrasti ovo pitanje',
    so_close: 'Za dlaku!', beaten: 'Bili su brži!', first_picking: 'Ekipa {team} bila je najbrža i sad bira',
    picked_wrong: 'Ekipa {team} odabrala je {L}. Netočno!', ran_out: 'Ekipi {team} isteklo je vrijeme', get_ready_steal: 'Spremite se za krađu!',
    team_picked: 'Ekipa {team} odabrala je',
    checking: 'Provjeravamo...', you_up: 'Vi ste na redu!', tap_answer: 'Dodirnite odgovor',
    out_of_time: 'Isteklo je vrijeme!', not_that: 'Nije to!', chance_steal: 'Sad druge ekipe mogu ukrasti pitanje', better_luck: 'Više sreće sljedeći put',
    stolen: 'Ukradeno!', nailed: 'Pogodak!', team_got: 'Ekipa {team} je pogodila!', team_stole: 'Ekipa {team} je ukrala pitanje!', answer_was: 'Točan odgovor:',
    nobody_got: 'Nitko nije pogodio', nobody_slapped: 'Nitko nije lupio', times_up: 'Isteklo je vrijeme!',
    paused: 'Pauza', hang_tight: 'Samo trenutak', winner_is: 'A pobjednik je...',
    tied_win: 'Dijelite pobjedu!', champions: 'Prvaci!', great_playing: 'Odlično ste igrali!', won_show: 'Pobjednik kviza: {team}',
    pts_one: '{n} bod', pts_few: '{n} boda', pts_many: '{n} bodova',
    music_onoff: 'Glazba uključena ili isključena', leave_show: 'Napusti kviz', pause: 'Pauza',
    join_phone: 'Uđite mobitelom', room_letters: 'Slova sobe',
    farnote: 'Obitelj je daleko? Neka na televizoru ili iPadu otvore ovu stranicu, dodirnu Gledaj na drugom ekranu i upišu slova.',
    teams: 'Ekipe', add_local: 'Dodaj ekipu na ovom ekranu',
    topics: 'Teme', no_topics: 'Nema tema.', questions: 'Pitanja', time_slap: 'Vrijeme za lupanje',
    read_aloud: 'Čitaj pitanja naglas', off: 'Ne', on: 'Da', start: 'Počni kviz',
    waiting_host: 'Čekamo da domaćin pokrene kviz',
    leave_q: 'Napustiti kviz?', leave_note: 'Mobiteli će se vratiti na početak. Ekipe kasnije mogu ući u novi kviz.', leave: 'Napusti', stay: 'Ostani',
    net_warn: 'Mobiteli trenutno ne mogu doći do kviza. Provjerite Wi-Fi ili dodajte ekipe na ovom ekranu.',
    remove: 'Makni ekipu {name}', phone_asleep: 'mobitel spava',
    empty_teams: 'Svaka ekipa skenira kod ili otvori adresu na svom mobitelu. Ekipe se pojavljuju ovdje čim uđu.',
    test: 'Probaj', steal_coming: 'Krađa stiže', wait_for_it: 'Čekaj...', slapped: 'Lupili ste!',
    resume_q: 'Nastaviti gdje ste stali?', resume_note: 'Pitanje {i} od {n}, bodovi su sačuvani.', back_lobby: 'Natrag na početak', keep_playing: 'Nastavi igru',
    say_lets_play: 'Igramo Slap Happy!', say_welcome: 'Dobrodošli u Slap Happy!',
    go: 'Kreni!', double_pts: 'Dvostruki bodovi', question_n: 'Pitanje {n}', of_n: 'od {n}',
    mixed: 'Miješane teme', mixed_n: 'Miješano: {n} tema', join_at: 'Uđi:', bonus_tag: 'Bonus runda: dvostruki bodovi',
    round: 'Pitanje <b>{n}</b> od {total}', did_you_know: 'Jeste li znali?', to_pick: 'za odgovor', to_slap: 'za lupanje',
    listen: 'Slušajte...', read_it: 'Čitajte...', steal_soon: 'Krađa stiže...', slap_now: 'Lupi sad!',
    pick_board: '{name}, odaberite na ekranu!', pick_phone: '{name}, odaberite na mobitelu!',
    says: 'Ekipa {name} kaže {L}!', not_L: 'Nije {L}!', late_name: '{name}, isteklo vam je vrijeme!',
    plus_for: '+{pts} za ekipu {name}!', stolen_pre: 'Ukradeno! ',
    ans_noslap: 'Nitko nije lupio. Evo odgovora', ans_nosteal: 'Nitko nije ukrao. Evo odgovora', ans_skip: 'Evo odgovora', ans_nobody: 'Nitko nije pogodio. Evo odgovora',
    next_question: 'Sljedeće pitanje', skip_q: 'Preskoči pitanje', end_now: 'Završi kviz sada', fix_scores: 'Ispravi bodove',
    take100: 'Oduzmi 100', add100: 'Dodaj 100',
    sound_v: 'Zvuk: {v}', music_v: 'Glazba: {v}', read_v: 'Čitanje naglas: {v}', v_on: 'da', v_off: 'ne',
    tie: 'Neriješeno!', winner_short: 'Pobjednik je', play_again: 'Igraj ponovno', change_setup: 'Promijeni ekipe ili teme', finish: 'Završi',
    watch_title: 'Gledaj kviz', watch_go: 'Gledaj', show_full: 'Taj kviz je pun.', err_generic: 'Nešto nije u redu. Pokušaj ponovno.',
    err_offline_screen: 'Ne mogu doći do kviza. Provjeri je li ovaj ekran spojen na internet.',
    connecting: 'Spajam se na kviz', waiting_big: 'Čekam veliki ekran', big_dropped: 'Veliki ekran se odspojio. Čekamo ga',
    watch_another: 'Gledaj drugi kviz', host_paused: 'Domaćin je pauzirao kviz',
  },
};

function start() {
  try {
    const u = new URLSearchParams(location.search).get('lang');
    if (u && D[u]) { localStorage.setItem(KEY, u); return u; }
    const s = localStorage.getItem(KEY);
    if (s && D[s]) return s;
  } catch (e) {}
  const nav = (navigator.languages && navigator.languages[0]) || navigator.language || 'en';
  return /^hr\b/i.test(nav) ? 'hr' : 'en';
}
let cur = start();
document.documentElement.lang = cur;
const listeners = new Set();

export const lang = () => cur;
export const langInfo = (id = cur) => LANGS.find(l => l.id === id) || LANGS[0];
export function setLang(id) {
  if (!D[id] || id === cur) return;
  cur = id;
  document.documentElement.lang = id;
  try { localStorage.setItem(KEY, id); } catch (e) {}
  for (const f of [...listeners]) { try { f(id); } catch (e) { console.error(e); } }
}
// a screen asks to be redrawn when the language changes; returns a way to stop
export function onLang(f) { listeners.add(f); return () => listeners.delete(f); }

// t('says', { name, L }): fills {name} and {L}. Values go in as given, so
// escape anything a player typed before passing it.
export function t(key, vars) {
  let s = (D[cur] && D[cur][key]) ?? D.en[key] ?? key;
  if (vars) s = s.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? vars[k] : m));
  return s;
}
// "1 point / 2 points" in English; Croatian has three forms (1 bod, 2 boda, 5 bodova)
export function tn(key, n, vars = {}) {
  let form = 'many';
  if (cur === 'hr') {
    const a = n % 10, b = n % 100;
    form = a === 1 && b !== 11 ? 'one' : a >= 2 && a <= 4 && (b < 12 || b > 14) ? 'few' : 'many';
  } else if (n === 1) form = 'one';
  const k = (D[cur] && D[cur][`${key}_${form}`]) ? `${key}_${form}` : `${key}_${form === 'few' ? 'many' : form}`;
  return t(k, { ...vars, n });
}
export function placeText(n) {
  if (cur === 'hr') return `${n}. mjesto`;
  const sfx = n % 10 === 1 && n % 100 !== 11 ? 'st' : n % 10 === 2 && n % 100 !== 12 ? 'nd' : n % 10 === 3 && n % 100 !== 13 ? 'rd' : 'th';
  return `${n}${sfx} place`;
}

// Pick this device's language out of something with translations:
// a string, an { en, hr } object, or a question with a `tr` block.
export function loc(x) {
  if (x == null) return '';
  if (typeof x === 'string') return x;
  return x[cur] ?? x.en ?? '';
}
// a question (or topic) in this device's language, falling back to English
export function qx(q) {
  if (!q) return q;
  const tr = q.tr && q.tr[cur];
  return tr ? { ...q, ...tr } : q;
}

// The little EN | HR switch. Screens bind data-act="lang" to setLang.
export function langSwitch(cls = '') {
  return `<div class="langs ${cls}" role="group" aria-label="${t('language')}">${LANGS.map(l =>
    `<button class="lg${l.id === cur ? ' on' : ''}" data-act="lang" data-arg="${l.id}" aria-pressed="${l.id === cur}" title="${l.name}" lang="${l.id}">${l.short}</button>`).join('')}</div>`;
}
