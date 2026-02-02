const assert = require('assert');
const path = require('path');
const handler = require(path.join(__dirname, '..', '..', '..', '..', 'api', 'payments', 'banks', 'index.ts'));

function makeReq(method) { return { method }; }
function makeRes() {
  let _status = 200; let _body = null;
  return { status(code) { _status = code; return this; }, json(payload) { _body = payload; return this; }, get _result() { return { status: _status, body: _body }; } };
}

async function testBanks() {
  const req = makeReq('GET');
  const res = makeRes();
  await handler(req, res);
  const r = res._result;
  assert.strictEqual(r.status, 200);
  assert.ok(Array.isArray(r.body.banks));
}

async function run() { await testBanks(); console.log('testBanks OK'); }
run().catch((e) => { throw e; });
