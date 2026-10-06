RNDM Chat v25.1 FAST

Database changes were applied directly to Supabase project Rndm:
- missing foreign-key indexes
- hot-path composite indexes
- RLS auth.uid() initplan optimization
- duplicate permissive SELECT policies removed while preserving access semantics
- v25 referrals/admin migration applied

Client changes:
- profile cache survives page navigation for 90 seconds
- user_state session cache for 30 seconds
- heartbeat throttled to max once per minute
- typing uses Realtime instead of polling every 1.5 seconds
- random chat backup polling reduced
- Supabase test checks tables in parallel
- profile stats load in parallel

Upload all files to GitHub Pages. No SQL needs to be run for the current connected Supabase project.
