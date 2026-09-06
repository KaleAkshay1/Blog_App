# Story backend

Express 5 and MongoDB API for Story. The project root contains only `frontend/` and `backend/`; each app owns its package, lockfile, configuration, tests, and dependencies.

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
| `npm.cmd test`             | Run API integration tests                                |
| `npm.cmd run seed`         | Add sample stories only if the posts collection is empty |
| `npm.cmd run format`       | Format backend code                                      |
| `npm.cmd run format:check` | Check backend formatting                                 |

## Code organization

```text
backend/
  src/
    app.js                Express setup and API router mounting
    server.js             Startup, database connection, and shutdown
    routes/
      index.js            Mount each route group under /api
      auth.route.js       Register, login, logout, and current session
      post.route.js       Public stories and owner-only story mutations
      me.route.js         The signed-in author's stories
      bookmark.route.js   Saved stories
      topic.route.js      Topic counts
      newsletter.route.js Newsletter subscriptions
      health.route.js     API/database health
    controllers/          Named request handlers for each route group
    middleware/           Sessions, access checks, ID checks, rate limits,
                          origin checks, and centralized errors
    validators/           Zod schemas for body and query validation
    models/               Mongoose User, Post, and Subscriber schemas
    config/               Environment, database lifecycle, and logging
    constants/            Shared categories
    utils/                Sessions, serialization, slugs, and app errors
    seeders/              Sample stories and standalone seed entry point
  tests/api.test.js        API integration suite
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

`PORT` defaults to 5000 and `HOST` to 127.0.0.1. `CLIENT_URL` contains the allowed frontend origins. `LOG_LEVEL` controls logging; `LOG_TO_FILE=false` disables log files. Otherwise, rotated logs are stored in `logs/combined.log` and `logs/error.log`. Set `SEED_ON_START=false` to skip sample data.

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

## Tests

`npm.cmd test` creates a uniquely named `story_test_*` database and drops only that database afterward. Set `TEST_MONGODB_URI` to use a different MongoDB test server. Tests cover authentication, validation, authorization, private drafts, publishing, filtering, bookmarks, subscriptions, and error responses.

Browser tests live in [frontend/tests/e2e](../frontend/tests/e2e) and run with `npm.cmd run test:e2e` from `frontend`. Install dependencies in both folders first.

## Production

Run with `NODE_ENV=production`, a private `MONGODB_URI`, a strong `JWT_SECRET`, and the exact frontend origin in `CLIENT_URL`. Build and host the frontend separately with an SPA fallback. Use HTTPS and a same-origin reverse proxy: serve the frontend at `/` and proxy `/api` to this API. Cookies are secure and same-site; cross-site cookie authentication is not configured.

Password reset, email verification, media uploads, newsletter delivery, and moderation are not included.
