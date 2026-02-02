const assert = require('assert');
const path = require('path');
const handler = require(path.join(__dirname, '..', '..', '..', '..', 'api', 'manager', 'bookings', 'index.ts'));

function makeReq(method, headers) { return { method, headers: headers || {} }; }
function makeRes() { let _status = 200; let _body = null; return { status(code) { _status = code; return this; }, json(payload) { _body = payload; return this; }, get _result() { return { status: _status, body: _body }; } } }

async function testGetUnauthorized() {
  const req = makeReq('GET', {});
  const res = makeRes();
  await handler(req, res);
  const r = res._result;
  assert.strictEqual(r.status, 401);
}

async function testGetForbidden() {
  const req = makeReq('GET', { 'x-user-role': 'technician' });
  const res = makeRes();
  await handler(req, res);
  const r = res._result;
  assert.strictEqual(r.status, 403);
}

async function testGetOkManager() {
  const req = makeReq('GET', { 'x-user-role': 'manager' });
  const res = makeRes();
  await handler(req, res);
  const r = res._result;
  assert.strictEqual(r.status, 200);
  assert.ok(Array.isArray(r.body.bookings));
}

async function run() { await testGetUnauthorized(); console.log('testGetUnauthorized OK'); await testGetForbidden(); console.log('testGetForbidden OK'); await testGetOkManager(); console.log('testGetOkManager OK'); }
run().catch((e) => { throw e; });