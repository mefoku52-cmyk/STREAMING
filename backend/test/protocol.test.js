'use strict';
const test = require('node:test'); const assert = require('node:assert/strict');
const { parseMessage } = require('../src/protocol');
test('parses supported request', () => assert.equal(parseMessage('{"id":1,"method":"createRoom","data":{}}').method, 'createRoom'));
test('rejects unsupported method', () => assert.throws(() => parseMessage('{"id":1,"method":"shell"}')));
test('rejects invalid JSON', () => assert.throws(() => parseMessage('{')));
