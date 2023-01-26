<p align="center">
  <svg xmlns="http://www.w3.org/2000/svg" width="64px" height="64px" viewBox="0 0 80 80">
  <path d="M 25.797 40.006 L 36.52 19.13 C 37.057 18.09 38.151 17.457 39.32 17.51 L 45.73 17.83" fill="none" stroke="currentColor"  stroke-linecap="round" stroke-linejoin="round" stroke-width="3"/>
  <path d="M57.73,18.39l8.48.47a3,3,0,0,1,2.63,4.08l-16.74,42a3,3,0,0,1-3.38,1.82l-29.29-6a3,3,0,0,1-2.05-4.29L26.06,39.5" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="3"/>
  <polyline points="64.08 21.9 48.38 60.35 22.02 55.57" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="3"/>
  <path d="M53.93,22.06l-6.24-.4a2.1,2.1,0,0,1-1.95-2.09V15.28A2.08,2.08,0,0,1,48,13.2l8.61.59a2.08,2.08,0,0,1,1.66,3.12L55.87,21A2.07,2.07,0,0,1,53.93,22.06Z" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="3"/>
  <line x1="38.91" y1="28.8" x2="54.48" y2="30.19" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="3"/>
  <line x1="36.82" y1="33.38" x2="52.39" y2="35" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="3"/>
  <line x1="34.853" y1="38.033" x2="50.29" y2="39.81" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="3"/>
  <line x1="32.793" y1="42.573" x2="48.2" y2="44.62" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="3"/>
  <path class="pen" d="M36.7,38.34,41.92,49.5l-11-5.36a2.49,2.49,0,0,1-.59-.41L11.62,25.06c-1.17-1.17-.77-3.45.88-5.11h0c1.66-1.66,3.95-2.05,5.11-.88L36.27,37.72A2.29,2.29,0,0,1,36.7,38.34Z" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="3"/>
</svg>
</p>

## Quick Note

[![Built with open-wc recommendations](https://img.shields.io/badge/built%20with-open--wc-blue.svg)](https://github.com/open-wc)

Quick note is a web frontend for couchdb, to easily create, modify and delete documents, including attachments.

## Quickstart

To get started:

```sh
npm run start
# requires node 10 & npm 6 or higher
```
This application will forward all data requests to localhost:5984. You can edit the file web-dev-server.config.mjs to change this behavior.

The application is designed to work better with peruser couchdb config ; but still regular configuration is working. You will still need to set couchdb property `admin_only_all_dbs = false` in section `chttpd`
You will need to create a database named _users, and create new users (optional with peruser config), and grant access to new databases (created within fauxton) for these users.

## Scripts

- `start` runs your app for development, reloading on file changes
- `start:build` runs your app after it has been built using the build command
- `build` builds your app and outputs it in your `dist` directory
- `test` runs your test suite with Web Test Runner
- `lint` runs the linter for your project
