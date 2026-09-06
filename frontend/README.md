# Story frontend

React 19, TypeScript, Vite, Tailwind CSS v4, and editable shadcn/ui components. Runtime communication with the [backend](../backend/README.md) happens through HTTP.

## Run locally

Requires Node.js 22.14+. From the project root, in the frontend terminal:

```powershell
cd frontend
npm.cmd install
npm.cmd run dev
```

Open **http://127.0.0.1:5173**. Start the backend in a second terminal:

```powershell
# From the project root in the second terminal
cd backend
npm.cmd install
npm.cmd run dev
```

MongoDB must be running for the API. The frontend and backend each have their own dependencies and lockfile. Run commands inside the relevant folder. On macOS/Linux, use `npm` instead of `npm.cmd`.

## Code organization

```text
frontend/
  src/
    main.tsx             React entry point and providers
    App.tsx              Page routes
    pages/               Discover, story, topics, about, dashboard, editor
    components/          Navigation, auth dialog, story cards, feedback
      ui/                Shared Button, Dialog, Input, Textarea
    context/auth.tsx     Authentication and saved-story state
    hooks/               Cancellable API loading
    lib/api.ts           Typed API client and shared API types
    lib/images.ts        Bundled image mappings
    lib/utils.ts         Shared helpers
    index.css            Tailwind theme and responsive styles
  tests/e2e/             Playwright browser tests
  public/                Favicon and bundled sample photographs
  scripts/               Image download utility
  .vscode/               Formatting settings when this folder is opened
  playwright.config.ts   Browser and local server configuration
  vite.config.ts         Vite and API proxy
  package.json
  package-lock.json
```

For a page issue, find its route in `App.tsx`, then open its page in `pages/`. Shared rendering lives in `components/`, session state in `context/auth.tsx`, and request handling in `lib/api.ts` and `hooks/use-resource.ts`. Use browser developer tools to inspect the request and its JSON error, then follow the corresponding backend route if needed.

## Commands

Run these from `frontend`:

| Command                       | Purpose                                   |
| ----------------------------- | ----------------------------------------- |
| `npm.cmd run dev`             | Start the frontend development server     |
| `npm.cmd run build`           | Type-check and build to `dist/`           |
| `npm.cmd run preview`         | Preview the production build on port 4173 |
| `npm.cmd run test:e2e`        | Run the complete browser flows            |
| `npm.cmd run format`          | Format frontend code                      |
| `npm.cmd run format:check`    | Check frontend formatting                 |
| `npm.cmd run images:download` | Download the sample photographs           |

The Vite development and preview servers proxy `/api` to `http://127.0.0.1:5000`. Keep `VITE_API_URL` empty for that setup or a same-origin production proxy. See `.env.example`.

## Included features

- Responsive discovery page with a featured article, six topics, search, sorting, and pagination.
- Markdown stories with related articles, author details, and share-link copying.
- Registration, sign-in, sign-out, and persistent reading lists.
- Author dashboard with private drafts and published articles.
- Markdown editor with preview, cover-image URL, topic, word count, and reading-time estimate.
- Create, edit, publish, unpublish, and delete your own articles, with delete confirmation.
- Newsletter subscription form and loading, error, empty, and missing-page states.

Cover images use public HTTPS URLs; file uploading is not included. Newsletter subscriptions are stored by the API, but no email service is configured. Sample Unsplash images are bundled in `public/images/` with source information in `sources.json`. Fonts use Google Fonts with system fallbacks.

## Browser tests

Install dependencies in both app folders, make sure MongoDB is running, then run `npm.cmd run test:e2e` here. Playwright starts the API and Vite independently, waits for API health and the frontend, and stops the servers it starts. Existing local servers can be reused outside CI.

Windows uses installed Microsoft Edge. Other systems use Playwright Chromium; install it with `npx playwright install chromium`. Set `PLAYWRIGHT_CHANNEL` to use another installed browser channel.

The tests cover desktop/mobile discovery plus registration, drafts, publishing, bookmarks, editing, deletion, and sign-out. Tests create a unique account and clean up only that account and its articles using the backend models. This direct backend import is confined to test cleanup.

Screenshots and failure artifacts are written to `test-results/` inside this folder. Historical screenshots and the existing npm cache are retained in the ignored `.local/` folder.

## Production

Run `npm.cmd run build` and host `dist/` with an SPA fallback to `index.html`. Serve over HTTPS and proxy `/api` to the API on the same origin. A different API base can be provided through `VITE_API_URL` at build time, but cookie authentication still requires a same-site deployment and an allowed backend `CLIENT_URL`.

Open this folder in VS Code to use its format-on-save settings. The existing shadcn components are editable under `src/components/ui/`.
