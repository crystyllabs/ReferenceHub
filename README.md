# ReferenceHub

ReferenceHub is a dependency-free public profile that summarizes approved professional references from a Google Apps Script endpoint. It displays profile details, a frequency-weighted cloud of reviewer-selected qualities, collaboration areas, narrative summaries, statements, and featured reviews.

## Run locally

Serve this directory with any static HTTP server, then open `index.html`. Opening the file directly can work, but an HTTP server better matches production behavior.

The public data endpoint is configured by `API_URL` in `script.js`. Only approved, public-safe fields should ever be returned by that endpoint.

## Architecture and scaling

- The browser loads approved data through JSONP because Google Apps Script endpoints do not consistently support cross-origin `fetch` for this use case.
- Reviews and statements render in batches, preventing an increasingly large DOM as submissions grow.
- Charts aggregate the full approved dataset in the browser. This is appropriate for hundreds of reviews, not tens of thousands.
- Profile links accept only HTTP and HTTPS URLs. User-provided text is inserted with `textContent`, not HTML.
- Narrative summaries use grounded local templates by default. The API can provide `workingWithSummary` (or `aiSummary`) and `executiveSummary` fields when server-side AI generation is added.

Before the approved dataset reaches roughly 1,000 records, move filtering, aggregates, and pagination to the server. Return a versioned response such as `{ schemaVersion, profile, summary, insights, reviews, nextCursor }`. At that point, replace JSONP with a same-origin API or a service that supports CORS, request validation, rate limiting, caching, monitoring, and cursor pagination.

## Production checklist

- Keep approval/moderation authoritative on the server; never send private submissions to the browser.
- Restrict the endpoint to read-only public data and avoid personal email addresses or internal notes.
- Generate AI summaries on the server after moderation. Never put an AI provider key in `script.js`, and require summaries to stay grounded in approved feedback.
- Add caching at the API or hosting edge and invalidate it when an approved review changes.
- Add a content security policy at the host. Allow scripts only from the site and the configured Apps Script origin while JSONP remains in use.
- Add automated tests for response normalization, rating boundaries, selection parsing, empty states, and pagination.
- Add uptime/error monitoring for the data endpoint and privacy-aware analytics for page performance.
- Pin a custom domain, HTTPS, accessibility checks, and a deployment preview workflow before broader rollout.

## Known constraints

The spreadsheet question text currently acts as the API field name. Renaming a form question can silently remove data from the UI. The next API version should expose stable field keys and perform the spreadsheet-to-API mapping on the server.
