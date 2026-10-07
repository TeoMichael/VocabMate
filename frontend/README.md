# VocabMate frontend

The React interface for your personal vocabulary library and learning sessions.
See the [project README](../README.md) for PostgreSQL and API setup.

## Run locally

From this directory:

```sh
npm ci
# Copy .env.example to .env only if the API address needs changing.
npm run dev
```

The default API address is `http://localhost:5080/api`. Override it with
`VITE_API_URL` in an ignored `.env` file. The Vite development server runs at
`http://localhost:5173`.

## Checks

```sh
npm run build
npm run lint
npm run format:check
```

## Source layout

- `pages/`: library, learning sessions, dashboard, statistics and authentication.
- `components/`: shared controls, navigation, tables and import/topic dialogs.
- `context/`: authentication state and the `useAuth` hook.
- `lib/`: Axios client, API calls, formatting and resource loading.
- `types.ts`: API response and request types.
- `index.css`: the learning interface and responsive layouts, using Tailwind CSS.

JWT tokens stay in browser-tab session storage. Axios attaches tokens centrally,
and unauthorized API responses return the user to login. Quiz answers and learning
progress are saved by the API; the quiz page URL can resume an unfinished session.
