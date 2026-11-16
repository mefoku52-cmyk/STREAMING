# CMEP Streaming — rollback plan

**Plan only; not executed or tested.** Platform release/restore scripts are source artifacts; Streaming production rollback mechanism and artifact provenance are unverified.

Before release, identify incident owner, current/previous immutable artifacts, config/secret versions, schema compatibility, recordings and active-session impact. Verify backup and restore integrity in isolated staging. Do not automatically roll back the database with the application; preserve forward/backward schema compatibility.

For application rollback: stop rollout, capture logs/metrics, return to an approved known-good artifact through the provider's actual deployment mechanism, then validate `/healthz`, `/readyz`, WSS, adapter calls, inspection API and cleanup. Restarting Streaming may terminate in-memory rooms; no session recovery guarantee exists. Preserve recordings separately.

Stop and escalate if target revision, data compatibility, backup, keys, owner or provider rollback path is unknown. Production rollback has not been rehearsed.
