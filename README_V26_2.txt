RNDM Chat v26.2 — Unified UI cleanup

- Removed retired topbar/top/bottom/mobile navigation from HTML on every page.
- Removed legacy navigation scripts that recreated the old interface.
- rndm-shell.js now removes any legacy navigation inserted later by stale code.
- Clips upload hooks were preserved outside the retired header.
- Cache/service-worker version bumped to 26.2 so iPhone/PWA refreshes the shell.
