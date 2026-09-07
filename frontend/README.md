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
      discussion/        Likes, comment forms, threads, editing, and deletion
      ui/                Shared Button, Dialog, Input, Textarea
    context/auth.tsx     Authentication and saved-story state
    hooks/               Cancellable API loading
    lib/api.ts           Typed API client and shared API types
    lib/images.ts        Bundled image mappings
    lib/utils.ts         Shared helpers
    index.css            Tailwind theme and responsive styles
  public/                Favicon and bundled sample photographs
  scripts/               Image download utility
  .vscode/               Formatting settings when this folder is opened
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
| `npm.cmd run format`          | Format frontend code                      |
| `npm.cmd run format:check`    | Check frontend formatting                 |
| `npm.cmd run images:download` | Download the sample photographs           |

The Vite development and preview servers proxy `/api` to `http://127.0.0.1:5000`. Keep `VITE_API_URL` empty for that setup or a same-origin production proxy. See `.env.example`.

## Included features

- Responsive discovery page with a featured article, six topics, search, sorting, and pagination.
- Markdown stories with related articles, author details, and share-link copying.
- Registration, sign-in, sign-out, and persistent reading lists.
- Persistent article likes with a count and a reversible like button.
- Comments and replies with pagination, author-only editing/deletion, and sign-in prompts.
- Author dashboard with private drafts and published articles.
- Markdown editor with preview, cover-image URL, topic, word count, and reading-time estimate.
- Create, edit, publish, unpublish, and delete your own articles, with delete confirmation.
- Newsletter subscription form and loading, error, empty, and missing-page states.

Cover images use public HTTPS URLs; file uploading is not included. Newsletter subscriptions are stored by the API, but no email service is configured. Sample Unsplash images are bundled in `public/images/` with source information in `sources.json`. Fonts use Google Fonts with system fallbacks.

## Article discussions

Open any published story and scroll below the author information to like it or join its conversation. Anonymous readers can browse discussions; signing in enables liking, commenting, and replying.

Comments show newest first. Expand a thread to read replies in chronological order, or select **Reply** on a comment or reply to answer that person. Replies remain grouped under the original comment. The thread switches to the page containing your newly posted reply.

Your own contributions have **Edit** and **Delete** controls. Editing displays an edited marker, and deleting asks for confirmation. Deleted text becomes a placeholder so existing replies remain readable. Comment text is rendered as plain text, with a 2,000-character limit and whitespace-only comments rejected. Failed submissions retain the typed content and show an error.

Likes and discussion data are stored by the backend and reload when an article is opened or refreshed. Successful actions update the visible counts and thread. Live updates from other readers do not use WebSockets or polling. Draft articles have no discussion controls.

## Notifications, sharing, and reporting

Signed-in members have a notification bell with an unread badge. Open it to see new likes and comments on your stories, replies to your contributions, and stories shared with you. Selecting a notification opens the story and marks it read. **Mark all as read** clears your unread count. The badge refreshes every 30 seconds while the tab is visible and when you return to the tab; the page also has a manual refresh button. Notifications are in-app only.

Use **Share this story** to copy a link for anyone or send a story to another registered member by email. The recipient receives an in-app notification; no email is sent. Use **Report story** to submit a private reason and optional details. Reports are recorded for review and do not notify the story's author. There is currently no administrative review screen.

New UI components live under `components/social/`, with notifications in `pages/notifications.tsx` and `context/notifications.tsx`. Drafts do not expose discussion, direct-share, or report controls.

## Formatting

Prettier is installed in this frontend with its own `.prettierrc.json`. Run `npm.cmd run format` to format the source, styles, and configuration files. The configuration uses two spaces, single quotes, no semicolons, trailing commas, and a 100-character print width. `npm.cmd run format:check` checks formatting without changing files.

The `.vscode` settings enable formatting on save when the Prettier extension is installed. Dependencies, generated builds, lockfiles, environment files, and bundled photographs are excluded from formatting.

## Production

Run `npm.cmd run build` and host `dist/` with an SPA fallback to `index.html`. Serve over HTTPS and proxy `/api` to the API on the same origin. A different API base can be provided through `VITE_API_URL` at build time, but cookie authentication still requires a same-site deployment and an allowed backend `CLIENT_URL`.

Open this folder in VS Code to use its format-on-save settings. The existing shadcn components are editable under `src/components/ui/`.
