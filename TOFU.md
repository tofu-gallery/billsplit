# Tofu gallery copy

This repository is Tofu's copy of **Nutlope/billsplit** (licence: MIT), listed in Tofu's app gallery as **billsplit**.

- `main` mirrors the upstream repository and is never committed to by Tofu.
- `tofu` carries Tofu's own changes; tags named `pin/<date>` mark the versions the gallery points to.
- A visitor who chooses this app gets a private snapshot of the pinned version in their own Tofu account. Their copy does not follow upstream updates.

## What the app is

BillSplit splits a restaurant bill. You take a photo of the receipt (or upload one), an AI vision model reads the restaurant name, date, items, tax and tip, then you add the people, tap who had what, and it shows who owes what. "Enter Manually" skips the photo and works without any AI key. There are no accounts and no database: the bill being split is kept in the visitor's own browser (`localStorage`).

## How Tofu runs it

- Framework preset: `nextjs` (Tofu's Vercel lane; this is a Next.js 16 app with a server route, so it does not fit the static lane).
- Root folder: the repository root (`''`).
- Install: `pnpm install --frozen-lockfile` with the committed `pnpm-lock.yaml` (lockfile 9.0; pnpm settings live in `pnpm-workspace.yaml`). `package.json` names no `packageManager`, so the platform picks the pnpm version. Which dependency build scripts run is `allowBuilds` in `pnpm-workspace.yaml` (read by pnpm 10.26 and later): autoevals, braintrust, esbuild and sharp, not better-sqlite3.
- Build: `pnpm run build`, which runs `tsc --noEmit` (TypeScript 7, over every `.ts`/`.tsx` file, tests and evals included) and then `next build`. `next.config.ts` turns off Next's own type check because of that first step. The build downloads the Instrument Sans font from Google Fonts (see the licence section).
- Output: `.next` (the Next.js default). `/` and `/app` are prerendered pages; `/api/vision` runs on the server. Next.js 16 needs Node.js 20.9 or newer.
- Environment variables: one, `TOGETHER_API_KEY`, the owner's own API key for **Together AI** (together.ai, the AI provider that runs the vision model). Save it as a hidden value; it is read on the server only. Without it the app still builds and runs, manual entry works, and scanning a receipt shows a plain "isn't set up yet" message (details below).
- Database: none. Storage bucket: none (upstream's S3 upload is not used by this copy).

## What Tofu changes

- `src/lib/client-receipt-scan.ts` (new) and `src/app/app/subpages/UploadOrManualBill.tsx`: the receipt photo is shrunk in the browser (to about 3 megapixels, as a JPEG) and sent to `/api/vision` as a data URL, which `scrapeBill` already accepted, instead of being uploaded to an S3 bucket first. This copy therefore needs no storage bucket and no storage keys. If a scan fails, the page now says why under the "Scrape the Bill" button instead of failing silently or moving on with an empty bill. The screens, their order and the split maths are unchanged.
- `src/lib/scrapeBill.ts`: the model call no longer goes through Braintrust tracing, so no Braintrust key is needed. The prompt, schema, model and request settings are unchanged.
- `src/lib/clients.ts`: the Together AI client is now created when a receipt is scanned, not when the server loads the module, and reads `TOGETHER_API_KEY` on the server only. The Together SDK throws when it has no key, so the old client could stop the app from building or answering before the owner added one; now a missing key raises `MissingTogetherApiKeyError` instead.
- `src/app/api/vision/route.ts`: a missing key answers 503 with a plain message telling the owner to add `TOGETHER_API_KEY` as a hidden value in Tofu's Keys & settings and deploy again.
- `src/lib/scrapeBill.test.ts` and `src/app/api/vision/route.test.ts`: updated to match (the Braintrust checks are gone; one new case covers the missing-key message).
- `src/app/layout.tsx`: upstream loaded Plausible analytics for its own site (`usebillsplit.com`) on every page, which would have sent every visit to a copy of this app to upstream's analytics account. This copy loads no analytics script, and its pages load nothing from other sites; the only outside service it calls is Together AI, from the server, with the owner's key.
- `pnpm-workspace.yaml` (2026-10-30): `allowBuilds` says `better-sqlite3: false` (it said `true`). Only `evalite`, upstream's dev-only eval tool, depends on better-sqlite3 (as a regular dependency, so a failed build stops the whole install), and this copy never loads it. better-sqlite3 11.10.0 ships prebuilt binaries for Node ABIs up to 131 (Node 23) and otherwise compiles from source, which fails against Node 26's V8 (`no member named 'GetPrototype' in 'v8::Object'`, `'GetIsolate' in 'v8::Context'`, `'This' in 'v8::PropertyCallbackInfo<v8::Value>'`; `gyp ERR! not ok`). Node 26 is the default of a new Vercel project since 2026-10-29, and pnpm 10.26 or later, which reads `allowBuilds`, stops the install there. pnpm 10.0 to 10.25 does not read `allowBuilds` and runs none of these scripts, so the change makes no difference there. The top-level `onlyBuiltDependencies` in `package.json` also names better-sqlite3; pnpm reads that list only under a `pnpm` key, so it does nothing, and it is left as it was.

Left as they were and no longer used by this copy: the S3 upload route and helpers (`src/app/api/s3-upload/`, `src/lib/s3.ts`, `src/lib/s3-receipt-storage.ts`, `src/lib/client-receipt-upload.ts`), the Braintrust helpers (`src/lib/braintrust.ts`, `src/lib/receipt-tracing.ts`, `src/lib/trace-safety.ts`), `scripts/verify-braintrust-trace.ts`, and the `braintrust`, AWS and `next-plausible` packages in `package.json` (dropping them would need a new `pnpm-lock.yaml`). `/api/vision` still deletes an S3 upload when one is named, which never happens here. Upstream's `README.md` still describes upstream's own setup (S3, Braintrust); this file describes the copy.

## The Together AI key

- This copy reads one setting: `TOGETHER_API_KEY`. It is the owner's own Together AI API key. Save it as a hidden value on the app's Keys & settings page in Tofu, then deploy again. It is read on the server only and never sent to the browser. The `S3_*` and `BRAINTRUST_*` names in `.example.env` are not needed.
- Because the key is the owner's, every receipt scanned is billed to the owner's Together AI account (default model `Qwen/Qwen3.5-9B`).
- There is no per-call limit yet: anyone who can open the app can scan receipts on the owner's key. To limit who can use it, make the app private in Tofu (only people you choose, or an access code).

## Upstream

- Repository: https://github.com/Nutlope/billsplit
- Commit: `7161171af4ddcf90c5aad068b0bbe6d0a42f6395` ("Security: upgrade Next.js to 16.3.8 and patch vulnerable dependencies (#7)"), the head of `main` when this copy was made. `tofu` is that commit plus Tofu's commits.

## Licence and caveats

- MIT, "Copyright (c) 2025 Riccardo Giorato" (`LICENSE`, unchanged). Licence files and copyright notices stay as they are; every file Tofu changes carries a note saying so.
- Font: Instrument Sans (SIL Open Font License 1.1), loaded through `next/font/google`: the build downloads it from Google Fonts and the app serves it itself, so visitors' browsers never contact Google.
- Names and links: "BillSplit" and its logo are upstream's. The header's "Star on GitHub" button and the footer's GitHub icon link to the upstream repository, the footer's X icon links to the upstream author's X account, and the footer's "Powered by Together.ai" link is upstream's Together AI referral link. Together AI's name is its own trademark.
- The home page's link-preview image points at `https://usebillsplit.com/og.png` on upstream's site (the same picture is in `public/og.png`); if that site changes, link previews of a copy lose their picture.
- No bundled data.

## Verification

Run on 2026-10-23 on macOS with Node.js 22.22.3, against `127.0.0.1` only, with no `TOGETHER_API_KEY` (or any other key) set and no `.env` file. No real AI key was used and nothing was deployed.

- `pnpm install --frozen-lockfile` (pnpm 12.8.1): installed, lockfile unchanged. The same frozen install in a clean copy with pnpm 10.34.8 also succeeded.
- `pnpm run build`: `tsc --noEmit` passed, then `next build` (Next.js 16.3.8, Turbopack) compiled and prerendered `/` and `/app`, with `/api/vision` and `/api/s3-upload` as server routes. The same build passed in the pnpm 10.34.8 copy.
- `pnpm run test:unit` (`vitest run --dir src`): 6 test files, 19 tests passed.
- `next start -p <free port> -H 127.0.0.1`: `GET /` 200, `GET /app?mode=camera` 200, `GET /app?mode=manual` 200. `POST /api/vision` with a small image data URL answered 503 with "Receipt scanning isn't set up yet. If this is your app, add your Together AI API key as the hidden value TOGETHER_API_KEY in Tofu's Keys & settings, then deploy again. Until then, go back and choose Enter Manually.", and the server log said `TOGETHER_API_KEY is not set, so receipts cannot be read`. (A request whose body is not JSON gets an empty 500, as upstream; the app itself never sends one.)
- Browser check (Chrome, through gstack's /browse with Aside): the home page renders ("Scan. Tap. Split."); "Scan Receipt" opens `/app?mode=camera`; a 600×900 PNG receipt and a 4032×3024 (12 MP, 5.6 MB) JPEG were each picked and "Scrape the Bill" pressed. Each time the message above appeared under the button within about half a second, the page stayed on the scan screen and the button could be pressed again; nothing crashed. The 12 MP photo reached `/api/vision` as a 0.74 MB request, because the browser shrinks it first. At phone size (375×812) the whole message is visible. Console: only the app's own `Error processing bill: ReceiptScanError: …` line per failed scan, no uncaught errors. Failed requests: only the expected `/api/vision` 503s. No requests to other sites (before the Plausible removal the page also loaded `https://plausible.io/js/script.js`).
- Key exposure: a build with `TOGETHER_API_KEY` set to a made-up marker value left no trace of the value anywhere in `.next` (browser files, prerendered pages or server files).
- Import check: `python3 -I simulate_import.py --one tofu-gallery/billsplit tofu '' no` (Tofu's shelf check, which reads the pushed branch the way Tofu's GitHub import filters it) kept all 76 tracked files and dropped none.

## Verification of the install on Node 26 (2026-10-30)

On a Mac, with the official Node.js 26.13.0 (npm 11.20.0) and 24.22.2 (npm 11.19.1), each downloaded and checked against nodejs.org's `SHASUMS256.txt`, from a tree made by `git archive` of the commit before this note (no `.git`), with `VERCEL=1`, `CI=1` and `NOW_BUILDER=1` set, no `TOGETHER_API_KEY` and nothing deployed. The install is `pnpm install --frozen-lockfile` with dependency scripts on, as the host runs it.

- Before the change, on Node.js 26.13.0: pnpm 10.34.9's install stopped in better-sqlite3's build (6 compile errors, `gyp ERR! not ok`); the same install on Node.js 24.22.2 compiled it. pnpm 10.25.0 installed and built the old tree, printing `Ignored build scripts: … better-sqlite3@11.10.0` (it does not read `allowBuilds`). pnpm 9.15.9 stopped at once on this repository's `pnpm-workspace.yaml` (`packages field missing or empty`).
- With the change: pnpm 10.34.9 on Node.js 26.13.0 and on 24.22.2, and pnpm 10.25.0 on 26.13.0: `pnpm install --frozen-lockfile` installed and `pnpm run build` passed (`tsc --noEmit`, then `next build`, Next.js 16.3.8).

## Still needs a real deploy to verify

- Tofu's Vercel lane installs and builds it (the platform chooses the pnpm version, which decides whether `allowBuilds` is read, and needs to reach Google Fonts during the build), and with no key the live app shows the same message and logs the same line.
- With the key saved as a hidden value and the app deployed again: a phone photo and a PNG screenshot both scan, fill in the items, tax and tip, and the split works. Together AI has not yet been shown to accept the base64 data URL with `Qwen/Qwen3.5-9B` and the JSON-schema response format (upstream only ever sent it a remote S3 link).
- A real phone photo's `/api/vision` request stays well under the hosting platform's 4.5 MB request limit (0.74 MB for the 12 MP test image here).
- Phone photos arrive the right way up (the browser applies the photo's rotation when shrinking it): check on iPhone Safari and Android Chrome.
