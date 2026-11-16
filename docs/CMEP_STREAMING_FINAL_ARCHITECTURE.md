# CMEP Streaming — architecture (source and local verification)

CMEP web and API remain the identity and authorization authority. The platform inspection API creates inspection records, signs short-lived streaming credentials and exposes internal verification/event/end operations. The separate Node.js streaming service validates the token through the platform HTTP adapter, then uses WebSocket signaling and mediasoup SFU for browser Publisher/Viewer media. Platform inspection/event records are persistent; streaming room, peer, producer and consumer state is process memory.

The CMEP UI integrates `InspectionPanel` into listing detail and listing-linked chat. Publisher and Viewer media clients remain separate browser pages opened through signed, short-lived URLs; the platform does not embed the media player in the inspection detail screen. The current room model supports one publisher and one designated viewer; multi-viewer is not implemented. Reconnect/session reattachment is not established.

Local changes in this branch add a readiness contract (`/healthz` liveness remains 200; `/readyz` is 503 until signaling and worker are ready) and wire `MAX_ROOMS` into room admission. This does not change the platform architecture or prove production behavior. See the API, security and network documents in this directory. Production deployment: **BLOCKED / NOT RUN**.
