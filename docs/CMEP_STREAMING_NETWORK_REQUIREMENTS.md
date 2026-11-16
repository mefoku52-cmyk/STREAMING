# CMEP Streaming — network requirements

Production sizing and ports must be set from the actual provider/network; do not copy example values blindly.

- HTTPS for CMEP UI/API and WSS for signaling; valid certificate and trusted origin.
- Publicly routable announced IPv4/IPv6 address reachable by mediasoup worker. NAT behavior must be tested from the target mobile and desktop networks.
- Open the configured mediasoup RTC UDP range inbound/outbound at host firewall, cloud firewall and provider network layers. TCP fallback policy must be verified if used.
- TURN/STUN service and credential strategy for restrictive NAT/mobile networks; test relay candidate selection and media flow, not just ICE gathering.
- Long-lived WebSocket proxy support, upgrade headers, idle/read timeouts and health-check separation.
- Private platform-to-streaming HTTP verification/event/end path; internal key never exposed to browsers.
- Separate public browser endpoint from private adapter endpoint if topology supports it.

Current environment, public IP, DNS, TLS, TURN, port reachability and firewall are **NEVERIFIED**. No network/production probe was performed.
