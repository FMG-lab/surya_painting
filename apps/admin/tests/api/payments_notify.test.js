const assert = require('assert');
const path = require('path');
// require TS handler (tests runner registers ts-node)
const handler = require(path.join(__dirname, '..', '..', '..', '..', 'api', 'payments', 'notify', 'index.ts'));
const { Readable } = require('stream');

function makeReq(method, body) { return { method, body }; }
function makeRes() {
  let _status = 200; let _body = null;
  return { status(code) { _status = code; return this; }, json(payload) { _body = payload; return this; }, get _result() { return { status: _status, body: _body }; } };
}

async function testNotifyMissing() {
  const req = makeReq('POST', { });
  const res = makeRes();
  await handler(req, res);
  const r = res._result;
  assert.strictEqual(r.status, 422);
}

async function testNotifyFallback() {
  const req = makeReq('POST', { booking_code: 'SOME', amount: 150000 });
  const res = makeRes();
  await handler(req, res);
  const r = res._result;
  // fallback without supabase returns 200
  assert.strictEqual(r.status, 200);
  assert.ok(r.body.payment);
}

async function testNotifyMultipartFallback() {
  // create a simple multipart body
  const boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW';
  const parts = [];
  parts.push(`--${boundary}\r\nContent-Disposition: form-data; name="booking_code"\r\n\r\nSOME\r\n`);
  parts.push(`--${boundary}\r\nContent-Disposition: form-data; name="amount"\r\n\r\n150000\r\n`);
  parts.push(`--${boundary}\r\nContent-Disposition: form-data; name="proof"; filename="proof.txt"\r\nContent-Type: text/plain\r\n\r\nhello world\r\n`);
  parts.push(`--${boundary}--\r\n`);
  const bodyStr = parts.join('');
  const req = new Readable();
  req.push(bodyStr);
  req.push(null);
  req.headers = { 'content-type': `multipart/form-data; boundary=${boundary}` };
  req.method = 'POST';

  const res = makeRes();
  await handler(req, res);
  const r = res._result;
  assert.strictEqual(r.status, 200);
  assert.ok(r.body.payment);
}

async function run() { await testNotifyMissing(); console.log('testNotifyMissing OK'); await testNotifyFallback(); console.log('testNotifyFallback OK'); await testNotifyMultipartFallback(); console.log('testNotifyMultipartFallback OK'); }
run().catch((e) => { throw e; });
