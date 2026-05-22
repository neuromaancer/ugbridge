# UG Bridge

A static browser tool for Uyghur Arabic script (**UEY**) and Uyghur Latin
Yéziqi (**ULY**).

UG Bridge can convert text, search a Uyghur-English dictionary, study alphabet
forms, and play speech when a browser or custom TTS endpoint is available.

Live app: <https://ugbr1dge.web.app>

```text
ياخشىمۇسىز  ⇄  yaxshimusiz
```

## Terminology

- **UEY** means **Uyghur Ereb Yéziqi**: the Arabic-based script commonly used
  for Uyghur.
- **ULY** means **Uyghur Latin Yéziqi**: a Latin-alphabet writing system for
  Uyghur.

## Features

- **Home**: overview page with quick entry points into the main tools.
- **Convert**: UEY ⇄ ULY conversion with colored segment highlighting.
- **Visible letter bridge**: ULY → UEY output shows each UEY segment with its
  matching ULY token underneath.
- **Dictionary**: offline Uyghur-English lookup by UEY, ULY, or English.
- **Dictionary suggestions**: autocomplete with keyboard selection.
- **Learn UEY**: local-only learning path, quick practice, ULY input, UEY
  output, IPA hints, and per-letter breakdown.
- **Alphabet**: all 32 UEY letters with IPA, examples, joining forms, and
  word-initial hamza vowel forms.
- **Smart direction**: strong UEY/ULY script signals automatically switch the
  converter direction.
- **Custom words**: browser-local fixed UEY/ULY mappings for names and
  exceptions.
- **Recent conversions**: browser-local history for quick restore.
- **ULY input helper**: quick inserts for `é`, `ö`, `ü`, `sh`, `ch`, `gh`,
  `ng`, and `zh`.
- **Share, copy, batch text**: share URLs, copy outputs, upload `.txt`, and
  download converted `.txt`.
- **PWA app shell**: installable static app with offline shell caching.
- **TTS settings**: browser speech, local MMS, Hugging Face Space-style proxy,
  or a custom endpoint.

## Quick Start

Requirements:

- Node 18 or newer
- npm

```bash
npm install
npm run dev
```

The dev server runs at <http://localhost:5173>.

Useful commands:

```bash
npm test                 # run unit tests once
npm run test:watch       # watch tests
npm run typecheck        # TypeScript check
npm run build            # production build in dist/
npm run preview          # preview production build
npm run deploy           # build + deploy to Firebase Hosting
npm run dictionary:build # rebuild generated dictionary shards
```

## Stack

- Vite + React 18 + TypeScript
- Tailwind CSS v3
- Lucide React icons
- Vitest + Testing Library
- Firebase Hosting
- Firebase Web SDK initialized for future Auth / Firestore use
- Static app architecture; no backend is required for core features

Tailwind is intentionally kept on v3 while the project supports Node 18.
Tailwind v4 should wait until the runtime baseline is Node 20 or newer.

## Project Structure

```text
src/
├── components/              # React UI components
├── hooks/                   # React hooks that bridge UI and pure libraries
├── lib/
│   ├── converter/           # pure UEY/ULY conversion logic
│   ├── dictionary/          # pure dictionary search helpers
│   ├── tts/                 # TTS provider interface and implementations
│   ├── conversion-history.ts
│   ├── custom-transliterations.ts
│   └── firebase.ts
├── App.tsx                  # view, direction, and app composition state
├── main.tsx
└── index.css

tests/                       # Vitest specs
public/
├── dictionary/              # generated static dictionary shards
├── manifest.webmanifest
├── icon.svg
└── sw.js

scripts/
└── build_dictionary_dataset.mjs

firebase.json
.firebaserc
AGENTS.md                    # project notes for agent workflows
SECURITY.md                  # vulnerability reporting and secret handling
```

`src/lib/` must stay pure and free of React imports. Stateful UI coordination
belongs in hooks or `App.tsx`; components should mostly receive props and emit
events.

## Conversion

### UEY → ULY

- Character mapping lives in
  [src/lib/converter/mapping-table.ts](src/lib/converter/mapping-table.ts).
- Hamza `ئ` is dropped as a vowel-onset marker.
- Arabic punctuation (`،` `؟` `؛`) converts to Latin punctuation.
- Unknown characters pass through.
- Forward conversion outputs canonical `é` for `ې`.

### ULY → UEY

- Longest-match scan handles digraphs such as `sh`, `ch`, `gh`, `ng`, and `zh`.
- Word-initial vowels receive hamza: `alma` → `ئالما`.
- Adjacent vowels receive an internal hamza carrier when needed:
  `saet` → `سائەت`.
- Case-insensitive input is accepted.
- `ë` is accepted as a compatibility alias, but `é` is the canonical ULY form.
- Latin punctuation (`,` `;` `?`) converts to Arabic punctuation.

Standard Uyghur text round-trips cleanly for common inputs:

```ts
ulyToUey(ueyToUly(uey)) === uey
```

Known caveat: Persian kaf `ک` maps forward to `k`, and reverse conversion
normalizes it to Arabic kaf `ك`.

## Dictionary

The dictionary imports the Apache-2.0 Hugging Face dataset
[`anke01/uyghur-dictionary-dataset`](https://huggingface.co/datasets/anke01/uyghur-dictionary-dataset).

The build script imports the English ⇄ Uyghur files:

- `ug-en.jsonl`
- `en-ug.jsonl`

and generates static JSON shards under `public/dictionary/`.

```bash
npm run dictionary:build
```

Generated data is committed so Firebase Hosting can serve it directly. The app
does not download the whole dictionary on page load; it lazy-loads only the
relevant shard for the active query and search mode.

Current generated size:

- about 350k Uyghur headwords
- about 725k English definitions

## Text To Speech

Speech always receives the **UEY Arabic-script text**, even when the visible
input is ULY.

The default provider is the browser's Web Speech API. Most desktop browsers do
not ship a Uyghur voice, so the UI warns when no `ug-*` voice is available.

The app also supports a user-provided TTS API from the **TTS API** control. The
endpoint should accept:

```http
POST /api/tts
Authorization: Bearer <optional key>
Content-Type: application/json

{ "text": "ياخشىمۇسىز", "voice": "ug-CN-YilianNeural" }
```

and return audio such as `audio/wav` or `audio/mpeg`.

For local neural TTS, run the Uyghur MMS-TTS model:

```bash
npm run tts:mms
```

Then point the frontend at it in `.env.local`:

```bash
VITE_TTS_ENDPOINT=http://127.0.0.1:7861/api/tts
```

The MMS model is
[`facebook/mms-tts-uig-script_arabic`](https://hf.co/facebook/mms-tts-uig-script_arabic).
It is useful for local or separate-server experiments, but its license is
CC-BY-NC-4.0, so treat it as non-commercial unless replaced with a
commercial-friendly model.

## Configuration

Environment variables go in `.env.local` and are ignored by git. See
[.env.example](.env.example) for the supported Firebase and TTS settings.
See [SECURITY.md](SECURITY.md) for vulnerability reporting and secret-handling
guidance.

Firebase Web `apiKey` values are public project identifiers, not secrets.
Real access must be protected with Firebase Security Rules and Authentication.

## Deployment

Firebase Hosting serves the static `dist/` build.

One-time login:

```bash
npx firebase-tools login
```

Deploy:

```bash
npm run deploy
```

The command runs `tsc -b && vite build` and deploys the result using the project
configured in [.firebaserc](.firebaserc).

## Testing

The test suite covers converter behavior, round-trip expectations, IPA hints,
alphabet data, dictionary search, custom transliterations, history, and TTS
settings.

```bash
npm test
npm run typecheck
npm run build
```

## License

Application code is released under the MIT License. See [LICENSE](LICENSE).

The generated dictionary shards in `public/dictionary/` are derived from the
Apache-2.0 [`anke01/uyghur-dictionary-dataset`](https://huggingface.co/datasets/anke01/uyghur-dictionary-dataset).
Keep that attribution when redistributing the generated data.
