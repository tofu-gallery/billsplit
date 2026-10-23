# Tofu gallery copy

This repository is Tofu's copy of **Nutlope/billsplit** (licence: MIT), listed in Tofu's app gallery as **billsplit**.

- `main` mirrors the upstream repository and is never committed to by Tofu.
- `tofu` carries Tofu's own changes; tags named `pin/<date>` mark the versions the gallery points to.
- A visitor who chooses this app gets a private snapshot of the pinned version in their own Tofu account. Their copy does not follow upstream updates.

How Tofu runs it: Next.js. Needs the owner’s own AI provider API key.

## What Tofu changes

- `src/lib/client-receipt-scan.ts` (new) and `src/app/app/subpages/UploadOrManualBill.tsx`: the receipt photo is shrunk in the browser (to about 3 megapixels, as a JPEG) and sent to `/api/vision` as a data URL, which `scrapeBill` already accepted, instead of being uploaded to an S3 bucket first. This copy therefore needs no storage bucket and no storage keys. If a scan fails, the page now says why under the "Scrape the Bill" button instead of failing silently or moving on with an empty bill. The screens, their order and the split maths are unchanged.
- `src/lib/scrapeBill.ts`: the model call no longer goes through Braintrust tracing, so no Braintrust key is needed. The prompt, schema, model and request settings are unchanged.
- `src/lib/clients.ts`: the Together AI client is now created when a receipt is scanned, not when the server loads the module, and reads `TOGETHER_API_KEY` on the server only. The Together SDK throws when it has no key, so the old client could stop the app from building or answering before the owner added one; now a missing key raises `MissingTogetherApiKeyError` instead.
- `src/app/api/vision/route.ts`: a missing key answers 503 with a plain message telling the owner to add `TOGETHER_API_KEY` as a hidden value in Tofu's Keys & settings and deploy again.
- `src/lib/scrapeBill.test.ts` and `src/app/api/vision/route.test.ts`: updated to match (the Braintrust checks are gone; one new case covers the missing-key message).

Left as they were and no longer used by this copy: the S3 upload route and helpers (`src/app/api/s3-upload/`, `src/lib/s3.ts`, `src/lib/s3-receipt-storage.ts`, `src/lib/client-receipt-upload.ts`), the Braintrust helpers (`src/lib/braintrust.ts`, `src/lib/receipt-tracing.ts`, `src/lib/trace-safety.ts`), `scripts/verify-braintrust-trace.ts`, and the `braintrust` and AWS packages in `package.json` (dropping them would need a new `pnpm-lock.yaml`). `/api/vision` still deletes an S3 upload when one is named, which never happens here.

## The Together AI key

- This copy reads one setting: `TOGETHER_API_KEY`. It is the owner's own Together AI API key. Save it as a hidden value on the app's Keys & settings page in Tofu, then deploy again. It is read on the server only and never sent to the browser. The `S3_*` and `BRAINTRUST_*` names in `.example.env` are not needed.
- Because the key is the owner's, every receipt scanned is billed to the owner's Together AI account (default model `Qwen/Qwen3.5-9B`).
- There is no per-call limit yet: anyone who can open the app can scan receipts on the owner's key. To limit who can use it, make the app private in Tofu (only people you choose, or an access code).

## Needs a real deploy to verify

- The app builds and goes live on Tofu's Next.js lane with no `TOGETHER_API_KEY` set. The build runs `tsc --noEmit` over every `.ts` file, tests included, and none of these changes were built or tested here.
- With no key: scanning a receipt shows "Receipt scanning isn't set up yet…" under the button, `/api/vision` answers 503, and the runtime log says `TOGETHER_API_KEY is not set`.
- With the key saved as a hidden value and the app deployed again: a phone photo (about 12 MP JPEG) and a PNG screenshot both scan, fill in the items, tax and tip, and the split works as before.
- Together AI accepts the base64 data URL with `Qwen/Qwen3.5-9B` and the JSON-schema response format (upstream only ever sent it a remote S3 link).
- The `/api/vision` request for a large photo stays well under the hosting platform's 4.5 MB request limit (expect roughly 0.5–2 MB in the browser's network panel).
- Phone photos arrive the right way up (the browser applies the photo's rotation when shrinking it): check on iPhone Safari and Android Chrome.
- The key's value appears nowhere in the page source or the `_next/static` files.

## Licence

MIT. Licence files and copyright notices stay as they are; every file Tofu changes carries a note saying so.
