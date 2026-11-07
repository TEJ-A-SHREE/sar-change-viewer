# shared/

Things both the frontend and backend depend on.

- `contracts/analysis.schema.json` — the JSON Schema for every request and response.
  This is the single source of truth. The TypeScript and Python types are hand-written
  mirrors of it (see the header comment in each). CI checks that all three declare the
  same `contractVersion`.
