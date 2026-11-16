# Deployment decision record

Decision: **NO-GO / BLOCKED** for production as of 2026-11-16.

Reasons: no confirmed provider or production checkout; no confirmed mediasoup-capable network with public announced IP and UDP range; no production TURN/TLS/WSS; no verified secret manager values; no confirmed database migration/backup/restore; no reviewed production rollback; and no production smoke evidence. The user-provided specification requires stopping where infrastructure is unknown rather than configuring by assumption.

Next required input/action: connect the authorized production/staging provider or provide the actual attached workspace/environment through the approved integration. Separately approve a release window after staging acceptance. No production resources were modified.
