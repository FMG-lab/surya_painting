const assert = require('assert');
const path = require('path');
const handler = require(path.join(__dirname, '..', '..', '..', '..', 'api', 'bookings', 'index.ts'));

function makeReq(method, body) {
  return { method, body };
}

function makeRes() {
  let _status = 200;
  let _body = null;
  return {
    status(code) { _status = code; return this; },
    json(payload) { _body = payload; return this; },
    get _result() { return { status: _status, body: _body }; }
  };
}

async function testCreateBookingFallback() {
  const req = makeReq('POST', { branch_id: '00000000-0000-0000-0000-000000000001', customer_name: 'Test' });
  const res = makeRes();
  await handler(req, res);
  const r = res._result;
  assert.strictEqual(r.status, 201);
  assert.ok(r.body.booking);
  assert.ok(r.body.booking.code_human);
}

async function run() {
  await testCreateBookingFallback();
  console.log('testCreateBookingFallback OK');
}

run().catch((e) => { throw e; });
