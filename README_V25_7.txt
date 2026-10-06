RNDM Chat v25.7

WHAT CHANGED
- Calls v2: persistent Supabase signaling instead of one-shot Realtime broadcast.
- STUN + TURN fallback, ICE buffering, 30-second connection timeout and retry-friendly states.
- Calls can be tested from two tabs/devices even on the same RNDM account.
- Global censorship toggle in Admin Center.
- Personal censorship toggle in Profile.
- Profanity is masked with * at display time across old and new content.
- Existing database text is NOT destroyed, so disabling censorship restores the original view.

DATABASE
The connected Supabase project was already migrated automatically.
supabase_v25_7_calls_censorship.sql is included only as a backup/reference.
