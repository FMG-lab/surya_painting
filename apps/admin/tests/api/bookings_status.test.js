const assert = require('assert');
const path = require('path');
const handler = require(path.join(__dirname, '..', '..', '..', '..', 'api', 'bookings', '[code]', 'status.ts'));

function makeReq(method, query) {
  return { method, query };
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

async function testStatusMissingCode() {
  const req = makeReq('GET', {});
  const res = makeRes();
  await handler(req, res);
  const r = res._result;
  assert.strictEqual(r.status, 400);
}

async function run() {
  await testStatusMissingCode();
  console.log('testStatusMissingCode OK');
}

run().catch((e) => { throw e; });
