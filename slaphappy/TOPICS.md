# Slap Happy topic modules

Each trivia topic is one JSON file in `slaphappy/topics/`. The game loads every
file listed in `slaphappy/topics/manifest.json`, so adding a topic is two steps:

1. Save the new file as `slaphappy/topics/<id>.json`.
2. Add `"<id>.json"` to the `topics` list in `manifest.json`.

Every question is multiple choice: the team that slaps first picks A, B, C
or D on its own phone and the game knows straight away whether it's right.
A wrong pick crosses that choice out and the other teams can steal.

Then run the checker and push:

```
python3 slaphappy/tools/check_topics.py
```

The checker prints every problem it finds and exits with an error if any file
is broken. The game itself also skips a broken question (and says why in the
browser console) rather than crashing, but don't rely on that.

## Who the questions are for

Families: adults and kids aged 10 to 12 playing together.

- **Nothing adult-only.** No alcohol, drugs, smoking, gambling, sex or romance,
  gore, graphic violence, crime details, horror, frightening disasters or
  death tolls, swearing, or hot-button politics and religion debates. Animals
  are never hurt in a question or a fact. (History is fine when it's told the
  way a good kids' museum would tell it.)
- **A 10-year-old should be able to read the question aloud** without help.
  Plain words, short sentences.
- **Mix the difficulty.** Roughly a third each of `level` 1, 2 and 3:
  1 = most 10-year-olds know it, 2 = a curious kid or most adults,
  3 = a stumper that makes the fact feel like a reward.
- **Every question earns its fact.** The fact shows after the answer is
  revealed and is half the fun. Make it surprising, true and specific.
- **Fair answers only.** Exactly one choice is right, and no wrong choice is
  arguably right. Avoid "always" and "never" traps, trick wording, and facts
  that experts still argue about. When a number is fuzzy, ask for
  "about" and space the choices far apart.
- **No real living people** as the subject of jokes. Famous people, books and
  cartoons are fine to ask about (title or name only, no quoted lyrics or
  passages).

## The file format

```json
{
  "id": "cats",
  "title": "Cats",
  "emoji": "🐱",
  "blurb": "Purrs, paws, whiskers and the big cats of the wild",
  "version": 1,
  "checked": "2026-11-27",
  "sources": ["https://..."],
  "questions": [
    {
      "q": "Which big cat can purr but can't roar?",
      "choices": ["Cheetah", "Lion", "Tiger", "Jaguar"],
      "answer": 0,
      "level": 2,
      "fact": "Cheetahs also chirp like birds to call to their cubs.",
      "src": "https://...",
      "hr": { "q": "Koja velika mačka može presti, ali ne može rikati?", "choices": ["Gepard", "Lav", "Tigar", "Jaguar"], "fact": "Gepardi i cvrkuću poput ptica kad dozivaju svoje mladunce." }
    },
    {
      "q": "True or false: milk is a good drink for grown-up cats.",
      "choices": ["True", "False"],
      "answer": 1,
      "level": 2,
      "fixed": true,
      "fact": "Most grown-up cats can't digest milk well. Fresh water is best."
    }
  ]
}
```

| Field | Required | Notes |
|---|---|---|
| `id` | yes | Lowercase letters, digits and dashes. Matches the file name. |
| `title` | yes | Shown on the topic button in the lobby. One or two words. |
| `emoji` | yes | One emoji for the topic button and the show screen. |
| `blurb` | no | One line about the topic. |
| `version`, `checked` | no | Bump `version` when you edit; `checked` is the date facts were last verified. |
| `sources` | yes | Pages the facts were checked against. |
| `questions[].q` | yes | The question, ideally under 110 characters (the big screen shrinks long ones). |
| `questions[].choices` | yes | 2 to 4 different answers, each ideally under 26 characters (they appear as buttons on a phone). Four is best: a wrong pick crosses one out and the others can steal. |
| `questions[].answer` | yes | The position of the right choice, **counting from 0**. |
| `questions[].level` | yes | 1, 2 or 3 (see above). The show opens with easier ones and builds. |
| `questions[].fact` | yes | One or two sentences, under 200 characters. |
| `questions[].fixed` | no | `true` keeps the choices in the order written (use for numbers and ranges, and for True/False). Otherwise the game shuffles them each time. |
| `questions[].src` | no | A page that backs up this particular question, for anything numeric or surprising. |
| `hr` (topic) | no | Croatian `title` and `blurb` for the topic button. |
| `questions[].hr` | no | The question in Croatian: `q`, `choices` and `fact`. The choices must be **in the same order** as the English ones (same number, right answer in the same place). A question without it shows in English on Croatian screens. |

## Croatian (and other languages)

Every screen and phone picks its own language (the EN | HR switch; a phone or
TV set to Croatian starts in Croatian), so each question can carry a Croatian
version in an `hr` block. Write it as a native speaker would say it to a
10-year-old, not word for word:

- Metric units: convert miles, feet, pounds and °F, numbers rounded the same
  way in every choice ("Oko 15 km", "Oko 3.700 m", "30.000 °C"). Croatian
  numbers use a dot for thousands and a comma for decimals.
- Use the names Croatian children know: Ivica i Marica, Pepeljuga,
  Cvilidreta, Ružno pače, Mačak u čizmama, Alisa u Zemlji čudesa.
- If a question only works in English (a pun, an English collective noun),
  ask the same idea a Croatian way, keeping the same right answer position.
- True/False is `["Točno", "Netočno"]`.

The checker reports any question without `hr`, and any `hr` whose choices
don't line up with the English.

Tips:

- Write the right answer first (`"answer": 0`) if that's easier; the game
  shuffles choices unless `fixed` is set.
- True/False questions: `"choices": ["True", "False"]` with `"fixed": true`.
- Aim for 40 or more questions per topic so a family can play a few shows
  before repeats. The game asks questions this device hasn't asked before
  first.
- A show is 10, 15 or 20 questions. Every fifth question is a double-points
  bonus round.

## Asking a research run for a new topic

Paste something like this into a research chat, then hand the result to a
coding session along with this file:

> Write a Slap Happy trivia topic about **<topic>** as a JSON file following
> the format and rules in slaphappy/TOPICS.md (adults and kids 10-12 playing
> together, nothing adult-only). 45 questions, a third each at levels 1, 2
> and 3, all multiple choice: mostly 4 choices, plus 3 to 5 True/False.
> No question without choices. Every question gets a surprising one- or
> two-sentence fact.
> Check every answer and fact against reliable sources, list them in
> `sources`, and put a `src` on anything numeric or surprising. Give every
> question an `hr` block (natural Croatian for a 10-year-old, metric units,
> choices in the same order as the English) and the topic an `hr` title and
> blurb.
