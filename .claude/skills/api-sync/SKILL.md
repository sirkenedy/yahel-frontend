---
name: api-sync
description: Refresh the API client from the backend's OpenAPI description and report what changed and what it breaks. Use when the backend API changed or a call fails with an unexpected shape.
---

1. Make sure the backend is reachable. Locally it serves the description at `http://localhost:3200/docs/api-json`; otherwise set `API_SPEC_URL`.
2. Run `pnpm api:sync`.
3. Show the diff of `packages/api-client/spec/openapi.json` as a short list: endpoints added, removed, changed.
4. Run `pnpm typecheck`. List each error with the endpoint that caused it.
5. Response bodies are not declared by the backend yet, so `packages/api-client/src/types.ts` is hand-written. Update a type there only from evidence (the backend source or a real response). Never guess.
6. Add a typed method to `packages/api-client/src/client.ts` for any endpoint a feature needs, with a test in `client.test.ts`.
