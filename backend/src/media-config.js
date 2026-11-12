'use strict';
function intEnv(k, d) {
  const n = Number(process.env[k] ?? d);
  if (!Number.isInteger(n) || n < 1 || n > 65535) throw Error(`invalid ${k}`);
  return n;
}
function loadMediaConfig() {
  const announcedIp = (process.env.ANNOUNCED_IP || '').trim();
  const listenIps = [{ ip: '127.0.0.1' }];
  if (announcedIp) listenIps.push({ ip: '0.0.0.0', announcedIp });
  return Object.freeze({
    rtpMin: intEnv('RTC_MIN_PORT', 60000),
    rtpMax: intEnv('RTC_MAX_PORT', 60100),
    listenIps,
    ffmpegPath: process.env.FFMPEG_PATH || 'ffmpeg',
    rtmpUrl: process.env.RTMP_URL || '',
    recorderEnabled: process.env.ENABLE_RECORDER === '1',
    recVideoMsPort: intEnv('REC_VIDEO_MS_PORT', 7120),
    recVideoMsRtcpPort: intEnv('REC_VIDEO_MS_RTCP_PORT', 7121),
    recVideoFfPort: intEnv('REC_VIDEO_FF_PORT', 7130),
    recVideoFfRtcpPort: intEnv('REC_VIDEO_FF_RTCP_PORT', 7131),
    recAudioMsPort: intEnv('REC_AUDIO_MS_PORT', 7122),
    recAudioMsRtcpPort: intEnv('REC_AUDIO_MS_RTCP_PORT', 7123),
    recAudioFfPort: intEnv('REC_AUDIO_FF_PORT', 7132),
    recAudioFfRtcpPort: intEnv('REC_AUDIO_FF_RTCP_PORT', 7133),
  });
}
module.exports = { loadMediaConfig };
