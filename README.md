# Lumira for Cloudflare Workers

Lumira is a full stack application. Deploy it as a **Cloudflare Worker**, not as a static Pages site. The application uses D1 to save count results and identification records; images are processed only during the current session. The source previously hosted in ChatGPT Sites uses a separate database and bucket: existing records do not move automatically.

## Before the first deployment

1. Create a D1 database named `lumira-db` in the same Cloudflare account. Copy its database ID into `wrangler.jsonc` in place of `00000000-0000-4000-8000-000000000000`.
2. Apply the schema to the new database in order:

   ```sh
   pnpm exec wrangler d1 execute lumira-db --remote --file drizzle/0000_long_psynapse.sql
   pnpm exec wrangler d1 execute lumira-db --remote --file drizzle/0001_grey_cardiac.sql
   pnpm exec wrangler d1 execute lumira-db --remote --file drizzle/0002_absent_stellaris.sql
   pnpm exec wrangler d1 execute lumira-db --remote --file drizzle/0003_ai_usage.sql
   ```

3. Protect the **entire application and its API routes** with a Cloudflare Access policy for your account before adding real data. The record APIs allow reading and deletion and do not implement user authentication. Protecting only preview deployments is insufficient.
4. Optional organism identification requires Worker secrets `PLANTNET_API_KEY` for plants and/or `OPENAI_API_KEY` for other groups. Add them as secrets in Cloudflare's dashboard or via `wrangler secret put`. Do not commit keys to GitHub. Without a key, the corresponding feature shows an unavailable message. Object counting and solution calculations do not require these keys.

## Deploy

Use Node.js 22.13+ and pnpm 11. In your project directory:

```sh
pnpm install --frozen-lockfile
pnpm build
pnpm exec wrangler deploy --config dist/server/wrangler.json
```

The `pnpm deploy` shortcut builds and deploys. Sign into the correct Cloudflare account with `pnpm exec wrangler login`, or configure an API token and account ID for CI. If using Cloudflare Workers Git integration, set the build command to `pnpm build` and the deploy command to `pnpm exec wrangler deploy --config dist/server/wrangler.json`; install dependencies with pnpm. A project created as **Pages** cannot run this server-backed build by setting output to `dist`.

## Changes from the Sites source

The application source and its API routes were retained. The Sites-specific build plugin and platform resource declarations were replaced with standard Cloudflare Workers configuration. The build produces `dist/server/index.js` and `dist/client`, and a Wrangler dry run packages the Worker with DB and ASSETS bindings.

Images selected for counting stay in the browser during the session. Images sent for organism identification are processed by the configured provider, but Lumira does not save them. Saved results and point coordinates do not contain the original image.

## Optional AI image analysis (free-tier Gemini project)

Create a Gemini API key in Google AI Studio **from a project that remains on the Free tier**. Set `GEMINI_API_KEY` as a Cloudflare Worker secret, never in GitHub. Check the project tier and its current per-model rate limits in AI Studio. A key from a billed project can incur charges; this app cannot stop provider-side billing.

Apply `drizzle/0003_ai_usage.sql` once in D1. Optionally set Worker variable `AI_DAILY_REQUEST_LIMIT` to a **conservative whole-number request count per model per Pacific day**, lower than the actual RPD limit shown in AI Studio. At 80% of that configured cap, Lumira warns and switches from Gemini 2.5 Flash to the free-tier Gemini 2.5 Flash-Lite model. HTTP 429 also triggers fallback. This is a local request counter, **not** the provider's actual remaining quota; requests from other apps, per-minute and token limits remain unknown. Without this variable it reports that it cannot estimate proximity and relies on the provider's 429 response.

Colony and cell counting fall back to the on-device color-threshold algorithm when AI is unavailable. Identification uses Pl@ntNet when configured for plants, otherwise Gemini; when no image-capable provider is available, identification cannot be automatic. All AI-marked points and identifications need human review. Images sent to an external model are processed under the provider's terms; Lumira does not store them. Keep Cloudflare Access enabled to prevent strangers exhausting the quota.
