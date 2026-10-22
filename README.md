# 100X Longevity — native app (iOS + Android)

Expo SDK 57 · React Native 0.86 · Expo Router · TypeScript.

```
src/
  engine/engine.ts     Scoring engine and 100X matrix (pure TypeScript, no UI)
  engine/form.ts       Intake sections and fields
  state/               Session (AuthContext) and saved answers (on-device, per account)
  api.ts               Server address (extra.apiUrl; same origin on web)
  app/sign-in.tsx, app/sign-up.tsx   Email + password screens (shown when signed out)
  app/welcome.tsx      First-launch disclaimer
  app/(tabs)/          Intake, Results, Matrix, Ask, Rules screens (signed in only)
server/ask-worker/     Cloudflare Worker: accounts on D1 (/api/auth/*), Ask via OpenRouter (/api/ask), serves the web build
  migrations/          D1 schema (users, sessions, sign-in lockout, Ask hourly limit)
store/                 Privacy policy, store listing copy, review notes, store graphics
assets/                App icon, adaptive icon, splash, store icon (512) and feature graphic
```

## Run it on your phone (5 minutes)

```bash
npm install
npx expo start
```
Scan the QR code with the Expo Go app (Android) or the Camera app (iPhone). Signing in on a phone needs a server: set `extra.apiUrl` in `app.json` to a deployed Worker, or to `http://<your-computer's-LAN-IP>:8787` while the Docker setup below is running.

## Run the web version in Docker

Builds the web version of the app and serves it, plus the API, on the local Cloudflare Workers runtime with a local D1 database — the same setup `wrangler deploy` ships.

```bash
echo "OPENROUTER_API_KEY=sk-or-v1-..." > .env   # optional; without it Ask returns 503 not_configured
docker compose up --build
```
Open http://localhost:8787 and create an account. The web app calls the API on its own origin, so it needs no `apiUrl`. Accounts live in the `wrangler-state` volume; `docker compose down -v` wipes them.

## Check before every release

```bash
npm run typecheck                    # TypeScript
npx tsx scripts/check-engine.ts      # example client must score 70X / Foundation / 80X
npx expo-doctor                      # dependency and config checks
```

## Things to change before publishing

| Where | What |
|---|---|
| `app.json` → `ios.bundleIdentifier`, `android.package` | Currently `com.championsgroup.longevity100x`. Change now if you want a different ID — it can never change after the first store upload. |
| `app.json` → `extra.privacyPolicyUrl` | Public URL of `store/privacy-policy.html` (fill in the [BRACKETS] first). |
| `app.json` → `extra.apiUrl` | Base URL of your deployed Worker (see below), e.g. `https://longevity100x-ask.<you>.workers.dev`. The phone apps need it to sign in and to use Ask. |
| `store/review-notes.md` | A working demo account for App Review (sign-in is required). |
| `eas.json` → `submit.production.ios.ascAppId` | Apple ID of the app record in App Store Connect. |

## Deploy the server (Cloudflare Workers + D1, free tier)

One Worker serves the web app, accounts (`/api/auth/*`) and Ask (`/api/ask`). Ask calls `anthropic/claude-haiku-5.5` through OpenRouter (`MODEL` in `wrangler.toml`), limited to `ASK_LIMIT_PER_HOUR` questions per account. Before switching models, compare them with `OPENROUTER_API_KEY=... npx tsx scripts/bench-ask.ts 2`.

```bash
npx expo export -p web                       # web build -> dist/ (the worker serves it)
cd server/ask-worker
npm ci
npx wrangler login
npx wrangler d1 create longevity100x         # first time only: paste the printed database_id into wrangler.toml
npx wrangler d1 migrations apply longevity100x --remote
npx wrangler secret put OPENROUTER_API_KEY   # from openrouter.ai/settings/keys (set a credit limit on the key)
npx wrangler deploy                          # prints https://longevity100x-ask.<you>.workers.dev
```
Put the printed URL in `extra.apiUrl`. The API key never ships inside the app.

Accounts: email + password (PBKDF2-SHA256, 100,000 iterations, per-user salt); sessions are 30-day bearer tokens stored only as SHA-256 hashes; 10 wrong passwords lock an email for 15 minutes. Not built yet: password reset by email (needs an email-sending service).

## Build and submit

See **100X Longevity – App Store & Play Store Deployment Guide.pdf** for the full walkthrough. Short version:

```bash
npx eas-cli@latest login
npx eas-cli@latest init                                   # links the project to your Expo account
npx eas-cli@latest build -p android --profile production  # .aab for Google Play
npx eas-cli@latest build -p ios --profile production      # .ipa for the App Store
npx eas-cli@latest submit -p android
npx eas-cli@latest submit -p ios
```

Updates later: bump `version` in `app.json` for store releases (build numbers auto-increment), or push JavaScript-only fixes with EAS Update.
