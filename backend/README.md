# Story backend

Express 5 and MongoDB API for Story. The frontend and backend each own their package, lockfile, configuration, and dependencies. Run them from separate terminals.

## Run locally

Requires Node.js 22.14+ and MongoDB. From the project root, in the backend terminal:

```powershell
cd backend
npm.cmd install
npm.cmd run dev
```

The API listens at **http://127.0.0.1:5000/api**. Start the frontend in a second terminal using [its instructions](../frontend/README.md). On macOS/Linux, use `npm` instead of `npm.cmd`.

Run subsequent backend commands from this folder:

| Command                    | Purpose                                                  |
| -------------------------- | -------------------------------------------------------- |
| `npm.cmd run dev`          | Start the API and restart it when source files change    |
| `npm.cmd start`            | Start the API without watching                           |
| `npm.cmd run seed`         | Add sample stories only if the posts collection is empty |
| `npm.cmd run format`       | Format backend code                                      |
| `npm.cmd run format:check` | Check backend formatting                                 |

## MVC organization

Mongoose schemas form the model layer. Controllers handle requests and return JSON; routes map URLs to those controllers. The React frontend is the view layer, so the API does not need server-rendered templates.

```text
backend/
  src/
    app.js                Express setup and API router mounting
    server.js             Startup, database connection, and shutdown
    routes/
      index.js            Mount each route group under /api
      auth.route.js       Register, login, logout, and current session
      post.route.js       Public stories and owner-only story mutations
      comment.route.js    Comments and replies nested under a story
      me.route.js         The signed-in author's stories
      bookmark.route.js   Saved stories
      topic.route.js      Topic counts
      newsletter.route.js Newsletter subscriptions
      health.route.js     API/database health
    controllers/          Named request handlers for each route group
    middleware/           Sessions, access checks, ID checks, rate limits,
                          origin checks, request logging, and centralized errors
    validators/           Zod schemas for body and query validation
    models/               Mongoose User, Post, Subscriber, Like, and Comment schemas
    config/               Environment, database lifecycle, and logging
    constants/            Shared categories
    utils/                Sessions, serialization, slugs, and app errors
    seeders/              Sample stories and standalone seed entry point
  .vscode/launch.json      Debug API launch configuration
  .env.example            Available environment settings
  package.json
  package-lock.json
```

To debug a request, start with its path in `routes/index.js`, open the matching route file, then follow its named handler into `controllers/`. For example, `PUT /api/posts/:id` goes through `post.route.js`, `requireAuth`, `validateStoryId`, and `updatePost` in `post.controller.js`. Body/query rules live in `validators/post.validator.js`; errors go to `middleware/error.middleware.js`.

Open **backend as the folder in VS Code**, select **Debug API** in Run and Debug, and press F5. Set breakpoints in controllers or middleware. Stop any other API instance on port 5000 first. This folder also includes format-on-save settings.

## Environment and logs

From this folder, optionally create your configuration:

```powershell
Copy-Item .env.example .env
```

MongoDB defaults to `mongodb://127.0.0.1:27017/story_blog`. Set `MONGODB_URI` for a different local database or MongoDB Atlas. Development inserts nine sample articles on the first start if the posts collection is empty. Sample editorial accounts have random passwords; register your own account in the frontend.

Set `JWT_SECRET` to a random string of at least 32 characters for stable sessions. You can generate a value with:

```powershell
node -e "console.log(require('node:crypto').randomBytes(48).toString('hex'))"
```

Without it, development uses a random secret for each API process, so restarting the API signs users out. Accounts and stories persist.

`PORT` defaults to 5000 and `HOST` to 127.0.0.1. `CLIENT_URL` contains the allowed frontend origins. Set `SEED_ON_START=false` to skip sample data.

### Winston logging

[Winston](https://github.com/winstonjs/winston) is configured in `src/config/logger.js`. Logs include timestamps and levels, with colors in an interactive development terminal. Database connections, reconnections, shutdowns, server startup, account activity, story changes, and request failures are logged.

Each HTTP request gets an `X-Request-ID` response header. Request summaries include that ID, the method, path, response status, and duration. Bodies, cookies, and query strings are excluded; MongoDB connection strings are redacted from error messages and stack traces.

Example startup output:

```text
2026-09-06 14:00:00.000 [story-api] info: Connecting to MongoDB...
2026-09-06 14:00:00.050 [story-api] info: MongoDB connected {"host":"127.0.0.1","database":"story_blog"}
2026-09-06 14:00:00.100 [story-api] info: Story API is ready at http://127.0.0.1:5000/api
```

`LOG_LEVEL=http` includes request summaries; `info` keeps lifecycle and application events. JSON logs are stored in `logs/combined.log` and `logs/error.log`, with up to five 5 MB files per log. Set `LOG_TO_FILE=false` for terminal output only. Log files are ignored by Git and Prettier.

### Prettier formatting

[Prettier](https://prettier.io/docs/configuration) is installed locally in this backend. `npm.cmd run format` applies `.prettierrc.json` to the code: two spaces, single quotes, no semicolons, trailing commas, and a 100-character print width. `npm.cmd run format:check` checks formatting without changing files. The frontend has its own configuration and commands.

## API routes

All routes return JSON and authenticated requests use an HTTP-only session cookie.

| Method | Route                | Handler file               | Purpose                                                        |
| ------ | -------------------- | -------------------------- | -------------------------------------------------------------- |
| GET    | `/api/health`        | `health.controller.js`     | API/database health                                            |
| POST   | `/api/auth/register` | `auth.controller.js`       | Create an account and session                                  |
| POST   | `/api/auth/login`    | `auth.controller.js`       | Sign in                                                        |
| POST   | `/api/auth/logout`   | `auth.controller.js`       | Clear the session                                              |
| GET    | `/api/auth/me`       | `auth.controller.js`       | Current user, or null                                          |
| GET    | `/api/topics`        | `topic.controller.js`      | Topics with published article counts                           |
| GET    | `/api/posts`         | `post.controller.js`       | Published posts; search, category, sort, page, limit, featured |
| GET    | `/api/posts/:slug`   | `post.controller.js`       | Published story or your own draft                              |
| POST   | `/api/posts`         | `post.controller.js`       | Create a story; authenticated                                  |
| PUT    | `/api/posts/:id`     | `post.controller.js`       | Update editable fields; owner only                             |
| DELETE | `/api/posts/:id`     | `post.controller.js`       | Delete a story; owner only                                     |
| GET    | `/api/me/posts`      | `post.controller.js`       | Your drafts and published stories                              |
| GET    | `/api/bookmarks`     | `bookmark.controller.js`   | Your saved published stories                                   |
| PUT    | `/api/bookmarks/:id` | `bookmark.controller.js`   | Set bookmark with `{ "saved": true/false }`                    |
| POST   | `/api/newsletter`    | `newsletter.controller.js` | Subscribe with `{ "email": "..." }`                            |

The API uses bcrypt password hashing, seven-day JWT cookies, Zod validation, origin checks for mutations, Helmet headers, rate limits, and server-side ownership checks. Newsletter subscriptions are stored in MongoDB; email delivery is not configured.

## Likes, comments, and replies

Published articles support one like per account and threaded comments. Anyone can read the counts and conversation; writes require the existing session cookie. Drafts do not expose these endpoints, including to their author. Unpublishing retains discussion data privately; deleting a post removes its likes and comments.

| Method | Route                                        | Purpose                                                                       |
| ------ | -------------------------------------------- | ----------------------------------------------------------------------------- |
| GET    | `/api/posts/:id/engagement`                  | Like count, whether the current user liked it, and active comment/reply count |
| PUT    | `/api/posts/:id/like`                        | Set like state with `{ "liked": true }` or `{ "liked": false }`               |
| GET    | `/api/posts/:id/comments`                    | Paginated top-level threads, newest first                                     |
| POST   | `/api/posts/:id/comments`                    | Add a comment with `{ "content": "..." }`                                     |
| GET    | `/api/posts/:id/comments/:commentId/replies` | Paginated replies to a top-level thread, oldest first                         |
| POST   | `/api/posts/:id/comments/:commentId/replies` | Reply to a comment or an existing reply with `{ "content": "..." }`           |
| PATCH  | `/api/posts/:id/comments/:commentId`         | Edit your own comment or reply with `{ "content": "..." }`                    |
| DELETE | `/api/posts/:id/comments/:commentId`         | Remove your own comment text while preserving the conversation                |

These routes use the MongoDB post ID, not its slug. List endpoints accept `page` and `limit` (default 10, maximum 30). Comment bodies contain plain text between 1 and 2,000 characters after trimming. The author and parent thread are assigned by the server. Comment creation, replies, and edits share a limit of 60 requests per account per 15 minutes.

The `Like` model has a unique `(post, user)` index, and setting the same like state repeatedly is idempotent. Like responses contain `likeCount` and `likedByMe`; lists of users who liked a story are not exposed.

The `Comment` model stores replies under the original top-level comment, with a separate `replyTo` reference identifying the comment being answered. A reply to a reply therefore stays in the same readable thread. Only the original author can edit or delete their contribution. Deleting clears the stored text and hides the author from the response, leaving a placeholder so other replies remain readable. Pagination and thread reply totals include placeholders; the overall `commentCount` counts only active comments and replies.

New collections and indexes are managed by Mongoose when the backend connects. Existing articles work without reseeding. Controllers log like and comment activity through Winston using IDs and request IDs, without logging comment text.

## In-app notifications, sharing, and reports

New likes and comments notify the story author. Replies notify the author of the comment being answered and the story author, with duplicate recipients and self-notifications excluded. Unliking removes the corresponding like notification; deleting a comment removes its notification. Existing likes and comments are not backfilled.

Notifications are persisted in the `Notification` collection and are visible only to their recipient. Their feed and unread count exclude unpublished or deleted stories. Deleting a story also removes its notifications and reports. Repeated like requests and repeated shares to the same recipient do not generate duplicate notifications.

| Method | Route                                     | Purpose                                                               |
| ------ | ----------------------------------------- | --------------------------------------------------------------------- |
| GET    | `/api/notifications?page=1&limit=20`      | Your notifications, pagination, and unread count                      |
| PATCH  | `/api/notifications/:notificationId/read` | Mark one of your notifications as read                                |
| PATCH  | `/api/notifications/read-all`             | Mark all your notifications as read                                   |
| POST   | `/api/posts/:id/share`                    | Send a story to a registered member with `{ "email": "..." }`         |
| POST   | `/api/posts/:id/reports`                  | Record a private report with `{ "reason": "spam", "details": "..." }` |

All these routes require authentication. Share recipients are looked up by exact email; there is no public member directory. Reporting supports `spam`, `harassment`, `misinformation`, `copyright`, and `other`, with optional details up to 2,000 characters. The `Report` collection stores one pending report per reporter and story. Reports are not exposed to the story author. Reports are stored for review; an administrative review screen and automated moderation are not included.

Likes, shares, and reports share a limit of 60 requests per account per 15 minutes. The frontend refreshes notification counts every 30 seconds while visible and when the tab regains focus. No email or operating-system push notifications are sent.

Run `npm.cmd run test:social` from this folder for the social-feature regression suite. It uses Node's built-in test runner and a unique `story_social_test_*` MongoDB database, and deletes only that test database afterward. Set `TEST_MONGODB_URI` to use a separate test server.

## Deployment

Run with `NODE_ENV=production`, a private `MONGODB_URI`, a strong `JWT_SECRET`, and the exact frontend origin in `CLIENT_URL`. Build and host the frontend separately with an SPA fallback. Use HTTPS and a same-origin reverse proxy: serve the frontend at `/` and proxy `/api` to this API. Cookies are secure and same-site; cross-site cookie authentication is not configured.

Password reset, email verification, media uploads, newsletter delivery, and moderation are not included.
