# CLAUDE.md

## Documentation Conventions

### API Endpoint Sections

When documenting API endpoints, strictly follow this sequence:

1. **cURL** — example command to call the endpoint
2. **Request** — request body schema/example (omit for endpoints with no body, e.g. GET)
3. **Response** — response body example

## Changelog

The changelog at `upmatches-docs/docs/changelog.md` serves as a bookmark so the agent can quickly see where it left off based on the last commit. Users can click any commit ID to jump to that commit on GitHub.

**Each time you complete a task**, update the changelog:

1. Run `git log --oneline` to get the current commit history.
2. **Regenerate the entire table** from `git log` — do not assume previous hashes are still valid, because the `dev` branch frequently has squash commits that rewrite history and invalidate old hashes.
3. Each row: `| YYYY-MM-DD | [\`<short-hash>\`](https://github.com/weehong/upmatches-wiki/commit/<short-hash>) | <commit message> |`
4. Most recent commit first.
5. **Verify there are no broken links** — every commit hash in the table must exist in the current branch.

## General Rules

### No Guessing

Never guess or assume UI layouts, configuration steps, or external service interfaces. If you don't know the current state of an external tool or service, ask the user to provide details or a screenshot first. Do not waste time giving outdated or speculative instructions.
