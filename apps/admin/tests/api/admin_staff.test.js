const assert = require('assert');
const path = require('path');
const handler = require(path.join(__dirname, '..', '..', '..', '..', 'api', 'admin', 'staff', 'index.ts'));

function makeReq(method, headers, body) { return { method, headers: headers || {}, body }; }
function makeRes() {
  let _status = 200; let _body = null; let _headersSent = false;
  return { status(code) { _status = code; return this; }, json(payload) { _body = payload; _headersSent = true; return this; }, get _result() { return { status: _status, body: _body, headersSent: _headersSent }; } };
}

async function testGetStaffUnauthorized() {
  const req = makeReq('GET', {});
  const res = makeRes();
  await handler(req, res);
  const r = res._result;
  assert.strictEqual(r.status, 401);
}

async function testGetStaffForbidden() {
  const req = makeReq('GET', { 'x-user-role': 'technician' });
  const res = makeRes();
  await handler(req, res);
  const r = res._result;
  assert.strictEqual(r.status, 403);
}

async function testGetStaffOkAdmin() {
  const req = makeReq('GET', { 'x-user-role': 'admin' });
  const res = makeRes();
  await handler(req, res);
  const r = res._result;
  assert.strictEqual(r.status, 200);
  assert.ok(Array.isArray(r.body.staff));
}

async function testPostStaffForbidden() {
  const req = makeReq('POST', { 'x-user-role': 'manager' }, { name: 'New', role: 'technician' });
  const res = makeRes();
  await handler(req, res);
  const r = res._result;
  assert.strictEqual(r.status, 403);
}

async function testPostStaffOkAdmin() {
  const req = makeReq('POST', { 'x-user-role': 'admin' }, { name: 'New', role: 'technician' });
  const res = makeRes();
  await handler(req, res);
  const r = res._result;
  assert.strictEqual(r.status, 201);
  assert.ok(r.body.staff);
}

async function run() { await testGetStaffUnauthorized(); console.log('testGetStaffUnauthorized OK'); await testGetStaffForbidden(); console.log('testGetStaffForbidden OK'); await testGetStaffOkAdmin(); console.log('testGetStaffOkAdmin OK'); await testPostStaffForbidden(); console.log('testPostStaffForbidden OK'); await testPostStaffOkAdmin(); console.log('testPostStaffOkAdmin OK'); }
run().catch((e) => { throw e; });