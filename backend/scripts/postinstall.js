#!/usr/bin/env node
'use strict';
// Copies the mediasoup-client browser bundle into web/vendor so the static
// web UI never depends on node_modules at runtime. Fails soft: if the bundle
// is missing (e.g. install without network), a warning is printed and the
// provisioning script scripts/provision-worker.sh documents manual steps.
const fs = require('node:fs');
const path = require('node:path');
const src = path.join(__dirname, '..', 'node_modules', 'mediasoup-client', 'dist', 'mediasoup-client.min.js');
const outDir = path.join(__dirname, '..', '..', 'web', 'vendor');
try {
  fs.mkdirSync(outDir, { recursive: true });
  fs.copyFileSync(src, path.join(outDir, 'mediasoup-client.min.js'));
  process.stdout.write('mediasoup-client bundle copied to web/vendor\n');
} catch (e) {
  process.stdout.write(`postinstall: bundle copy skipped (${e.message}); run scripts/provision-worker.sh\n`);
}
