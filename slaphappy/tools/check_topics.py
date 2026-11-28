#!/usr/bin/env python3
"""Check Slap Happy topic files (slaphappy/topics/*.json) against TOPICS.md.

Run from anywhere:  python3 slaphappy/tools/check_topics.py
Exits with status 1 if any topic has a problem that would break or spoil a show.
"""
import json, re, sys, collections
from pathlib import Path

HERE = Path(__file__).resolve().parent.parent / 'topics'

# A safety net, not a substitute for reading the questions.
NOPE = re.compile(r"\b(beer|wine|vodka|whisk(e)?y|drunk|alcohol|cigarette|smok(e|ing)|marijuana|cocaine|heroin|drug dealer|"
                  r"sex|sexy|nude|naked|porn|kill(ed|ing)?|murder|blood(y)?|gore|corpse|suicide|torture|gun|shoot(ing)?|"
                  r"casino|gambl(e|ing)|damn|hell|crap)\b", re.I)

def main():
    problems, warnings = [], []
    man_path = HERE / 'manifest.json'
    try:
        man = json.loads(man_path.read_text(encoding='utf-8'))
    except Exception as e:
        print(f'manifest.json: cannot read it ({e})'); return 1
    listed = man.get('topics', [])
    files = sorted(p.name for p in HERE.glob('*.json') if p.name != 'manifest.json')
    for f in files:
        if f not in listed: warnings.append(f'{f}: is in the folder but not listed in manifest.json, so the game won\'t load it')
    ids = set()
    every = {}
    total = 0
    for f in listed:
        p = HERE / f
        where = f
        if not p.exists(): problems.append(f'{where}: listed in manifest.json but the file is missing'); continue
        try:
            t = json.loads(p.read_text(encoding='utf-8'))
        except Exception as e:
            problems.append(f'{where}: not valid JSON ({e})'); continue
        tid = t.get('id', '')
        if not re.fullmatch(r'[a-z0-9-]{2,30}', tid or ''): problems.append(f'{where}: id must be lowercase letters, digits or dashes')
        if tid in ids: problems.append(f'{where}: id "{tid}" is used by another topic')
        ids.add(tid)
        if f != f'{tid}.json': warnings.append(f'{where}: file name should be {tid}.json')
        for k in ('title', 'emoji'):
            if not t.get(k): problems.append(f'{where}: missing "{k}"')
        if not t.get('sources'): warnings.append(f'{where}: no "sources" listed')
        qs = t.get('questions')
        if not isinstance(qs, list) or not qs: problems.append(f'{where}: no questions'); continue
        seen = set()
        levels = collections.Counter()
        for i, q in enumerate(qs, 1):
            w = f'{where} question {i}'
            text = (q.get('q') or '').strip()
            if not text: problems.append(f'{w}: no question text'); continue
            low = text.lower()
            if low in seen: problems.append(f'{w}: duplicate of an earlier question')
            elif low in every: problems.append(f'{w}: same question as in {every[low]}')
            seen.add(low); every.setdefault(low, where)
            if len(text) > 140: warnings.append(f'{w}: {len(text)} characters, long for the big screen (aim for under 110)')
            lv = q.get('level')
            if lv not in (1, 2, 3): problems.append(f'{w}: level must be 1, 2 or 3')
            else: levels[lv] += 1
            fact = (q.get('fact') or '').strip()
            if not fact: problems.append(f'{w}: no fact')
            elif len(fact) > 220: warnings.append(f'{w}: fact is {len(fact)} characters (aim for under 200)')
            ch = q.get('choices')
            ans = q.get('answer')
            if ch is None:
                problems.append(f'{w}: no "choices" (every question is multiple choice)'); continue
            if True:
                if not isinstance(ch, list) or not (2 <= len(ch) <= 4): problems.append(f'{w}: choices must be a list of 2 to 4'); continue
                if len(set(map(str, ch))) != len(ch): problems.append(f'{w}: two choices are the same')
                if not isinstance(ans, int) or isinstance(ans, bool) or not (0 <= ans < len(ch)): problems.append(f'{w}: answer must be the position of the right choice, counting from 0')
                for c in ch:
                    if len(str(c)) > 32: warnings.append(f'{w}: choice "{c}" is long (aim for under 26 characters)')
                if any(re.search(r'all of the above|none of the above|both', str(c), re.I) for c in ch) and not q.get('fixed'):
                    warnings.append(f'{w}: "all/none of the above" choices need "fixed": true')
            blob = ' '.join([text, fact, ' '.join(map(str, ch or [])), str(ans)])
            m = NOPE.search(blob)
            if m: warnings.append(f'{w}: contains "{m.group(0)}"; make sure it suits 10-year-olds')
        total += len(qs)
        print(f'{where}: {len(qs)} questions (level 1: {levels[1]}, level 2: {levels[2]}, level 3: {levels[3]})')
        if len(qs) < 30: warnings.append(f'{where}: only {len(qs)} questions; aim for 40 or more')
    for w in warnings: print('  note:', w)
    for p in problems: print('  PROBLEM:', p)
    print(f'{len(listed)} topic(s), {total} questions, {len(problems)} problem(s), {len(warnings)} note(s)')
    return 1 if problems else 0

if __name__ == '__main__':
    sys.exit(main())
