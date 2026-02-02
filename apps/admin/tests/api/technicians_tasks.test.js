const assert = require('assert');
const path = require('path');
const tasksHandler = require(path.join(__dirname, '..', '..', '..', '..', 'api', 'technicians', 'tasks', 'index.ts'));
const progressHandler = require(path.join(__dirname, '..', '..', '..', '..', 'api', 'technicians', 'tasks', '[id]', 'progress.ts'));

function makeReq(method, headers, body, query) { return { method, headers: headers || {}, body: body || {}, query: query || {} }; }
function makeRes() { let _status = 200; let _body = null; return { status(code) { _status = code; return this; }, json(payload) { _body = payload; return this; }, get _result() { return { status: _status, body: _body }; } } }

async function testGetUnauthorized() {
  const req = makeReq('GET', {});
  const res = makeRes();
  await tasksHandler(req, res);
  const r = res._result;
  assert.strictEqual(r.status, 401);
}

async function testGetForbidden() {
  const req = makeReq('GET', { 'x-user-role': 'manager' });
  const res = makeRes();
  await tasksHandler(req, res);
  const r = res._result;
  assert.strictEqual(r.status, 403);
}

async function testGetOkTech() {
  const req = makeReq('GET', { 'x-user-role': 'technician' });
  const res = makeRes();
  await tasksHandler(req, res);
  const r = res._result;
  assert.strictEqual(r.status, 200);
  assert.ok(Array.isArray(r.body.tasks));
}

async function testPostProgressForbidden() {
  const req = makeReq('POST', { 'x-user-role': 'admin' }, { status: 'in_progress' }, { id: 't1' });
  const res = makeRes();
  await progressHandler(req, res);
  const r = res._result;
  assert.strictEqual(r.status, 403);
}

async function testPostProgressOk() {
  const req = makeReq('POST', { 'x-user-role': 'technician' }, { status: 'done' }, { id: 't1' });
  const res = makeRes();
  await progressHandler(req, res);
  const r = res._result;
  assert.strictEqual(r.status, 201);
  assert.ok(r.body.progress);
}

async function run() { await testGetUnauthorized(); console.log('testGetUnauthorized OK'); await testGetForbidden(); console.log('testGetForbidden OK'); await testGetOkTech(); console.log('testGetOkTech OK'); await testPostProgressForbidden(); console.log('testPostProgressForbidden OK'); await testPostProgressOk(); console.log('testPostProgressOk OK'); }
run().catch((e) => { throw e; });