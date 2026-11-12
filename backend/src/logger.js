'use strict';
const levels = { debug: 10, info: 20, warn: 30, error: 40 };
const threshold = levels[process.env.LOG_LEVEL || 'info'] ?? 20;
function write(level, message, fields = {}) {
  if ((levels[level] || 20) < threshold) return;
  const safe = { ...fields };
  for (const k of Object.keys(safe)) if (/token|secret|key|password/i.test(k)) safe[k] = '[REDACTED]';
  process.stdout.write(JSON.stringify({ time: new Date().toISOString(), level, message, ...safe }) + '\n');
}
module.exports = Object.fromEntries(Object.keys(levels).map(level => [level, (message, fields) => write(level, message, fields)]));
