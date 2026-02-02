const assert = require('assert');
const path = require('path');
const handler = require(path.join(__dirname, '..', '..', '..', '..', 'api', 'admin', 'payments', 'proof', 'index.ts'));

function makeReq(method, headers, query) { return { method, headers: headers || {}, query: query || {} }; }
function makeRes() { let _status = 200; let _body = null; return { status(code) { _status = code; return this; }, json(payload) { _body = payload; return this; }, get _result() { return { status: _status, body: _body }; } } }

async function testGetUnauthorized() {
  const req = makeReq('GET', {}, { payment_id: 'p1' });
  const res = makeRes();
  await handler(req, res);
  const r = res._result;
  assert.strictEqual(r.status, 401);
}

async function testGetForbidden() {
  const req = makeReq('GET', { 'x-user-role': 'technician' }, { payment_id: 'p1' });
  const res = makeRes();
  await handler(req, res);
  const r = res._result;
  assert.strictEqual(r.status, 403);
}

async function testGetAdminFallbackNotFound() {
  const req = makeReq('GET', { 'x-user-role': 'admin' }, { payment_id: 'p1' });
  const res = makeRes();
  await handler(req, res);
  const r = res._result;
  // fallback without db returns 404 as no proof
  assert.strictEqual(r.status, 404);
}

async function run() { await testGetUnauthorized(); console.log('testGetUnauthorized OK'); await testGetForbidden(); console.log('testGetForbidden OK'); await testGetAdminFallbackNotFound(); console.log('testGetAdminFallbackNotFound OK'); }
run().catch((e) => { throw e; });