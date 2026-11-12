# Port allocation

All loopback by default; every value overridable via `.env`. Chosen to avoid
the running live-prototype (8402–8405 HTTP, 7020–7033 recorder, RTC
10000–59999).

| Service | Default | Env | Notes |
|---|---|---|---|
| Signaling HTTP+WS+static | 8504 | `SIGNALING_PORT` | one port for everything |
| Python static server (optional) | 8502 | `WEB_PORT` | serves `web/` only, loopback |
| mediasoup RTC (UDP/TCP) | 60000–60100 | `RTC_MIN_PORT`/`RTC_MAX_PORT` | 101 ports ≈ 33 transports |
| Recorder: mediasoup video | 7120/7121 | `REC_VIDEO_MS_PORT(_RTCP_PORT)` | PlainTransport listen |
| Recorder: mediasoup audio | 7122/7123 | `REC_AUDIO_MS_PORT(_RTCP_PORT)` | PlainTransport listen |
| Recorder: FFmpeg video | 7130/7131 | `REC_VIDEO_FF_PORT(_RTCP_PORT)` | SDP listen side |
| Recorder: FFmpeg audio | 7132/7133 | `REC_AUDIO_FF_PORT(_RTCP_PORT)` | SDP listen side |
| RTMP output (optional) | none | `RTMP_URL` | e.g. rtmp://127.0.0.1:19350/live/key |

Why two port sets per recorded stream: the SDP handed to FFmpeg makes FFmpeg
bind its own RTP/RTCP ports; if mediasoup's PlainTransport used the same
ports, one side would fail with EADDRINUSE. This mirrors live-prototype
(7020/7021 mediasoup + 7030/7031 ffmpeg).

LAN access: set `SIGNALING_HOST=0.0.0.0` and `RTC_ANNOUNCED_IP=<lan-ip>` so ICE
candidates are usable from other devices. Plain HTTP serves the pages, but
getUserMedia requires a secure context — Android Chrome needs HTTPS or the
`unsafely-treat-insecure-origin-as-secure` flag for `http://<lan-ip>:8504`.
