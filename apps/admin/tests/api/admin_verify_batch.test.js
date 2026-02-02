const assert = require('assert');
const path = require('path');
const handler = require(path.join(__dirname, '..', '..', '..', '..', 'api', 'admin', 'payments', 'verify-batch', 'index.ts'));

function makeReq(method, headers, body) { return { method, headers: headers || {}, body: body || {} }; }
function makeRes() { let _status = 200; let _body = null; return { status(code) { _status = code; return this; }, json(payload) { _body = payload; return this; }, get _result() { return { status: _status, body: _body }; } } }

async function testPostUnauthorized() {
  const req = makeReq('POST', {}, { payment_ids: ['p1'] });
  const res = makeRes();
  await handler(req, res);
  const r = res._result;
  assert.strictEqual(r.status, 401);
}

async function testPostForbidden() {
  const req = makeReq('POST', { 'x-user-role': 'technician' }, { payment_ids: ['p1'] });
  const res = makeRes();
  await handler(req, res);
  const r = res._result;
  assert.strictEqual(r.status, 403);
}

async function testPostOkAdminFallback() {
  const req = makeReq('POST', { 'x-user-role': 'admin' }, { payment_ids: ['p1'] });
  const res = makeRes();
  await handler(req, res);
  const r = res._result;
  assert.strictEqual(r.status, 200);
  assert.ok(Array.isArray(r.body.results));
}

async function run() { await testPostUnauthorized(); console.log('testPostUnauthorized OK'); await testPostForbidden(); console.log('testPostForbidden OK'); await testPostOkAdminFallback(); console.log('testPostOkAdminFallback OK'); }
run().catch((e) => { throw e; });