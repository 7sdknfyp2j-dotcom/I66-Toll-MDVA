# I-66 Toll Checker — Cloudflare Pages

Clean Cloudflare Pages version of the I-66 toll Home Screen app.

## What it does

Shows toll status for:

1. Route 267 / Dulles Toll Road eastbound to Fairfax Drive
2. Route 267 / Dulles Toll Road eastbound to Washington Blvd

Outside weekday eastbound tolling hours, it shows `$0.00 / No toll for this trip right now`.

During the weekday eastbound tolling window, it displays that live active-hour pricing lookup still needs to be added.

## Cloudflare Pages setup

1. Create a new GitHub repository.
2. Upload these files/folders to the repository root:
   - `index.html`
   - `app.js`
   - `manifest.json`
   - `service-worker.js`
   - `icons/`
   - `functions/`
   - `README.md`
3. In Cloudflare, go to **Workers & Pages**.
4. Create a new Pages project.
5. Connect to GitHub.
6. Select this repository.
7. Use these settings:
   - Framework preset: None
   - Build command: leave blank
   - Build output directory: `.`
   - Root directory: leave blank
8. Deploy.

## Test

Open:

`https://YOUR-PROJECT.pages.dev/api/toll`

Then open the main app:

`https://YOUR-PROJECT.pages.dev`

## iPhone Home Screen

Open the app URL in Safari, tap Share, then Add to Home Screen.