const assert = require('assert');
const path = require('path');
const handler = require(path.join(__dirname, '..', '..', '..', '..', 'api', 'admin', 'branches', 'index.ts')).default;

// Minimal NowRequest / NowResponse mocks
function makeReq(method: string, query?: any, headers?: any, body?: any) {
  return { method, query: query || {}, headers: headers || {}, body } as any;
}

function makeRes() {
  let _status = 200;
  let _body: any = null;
  return {
    status(code: number) {
      _status = code;
      return this;
    },
    json(payload: any) {
      _body = payload;
      return this;
    },
    get _result() {
      return { status: _status, body: _body };
    }
  } as any;
}

async function testListBranchesFallback() {
  // test via utils directly
  const data = require('../../../../api/admin/branches/utils.js').loadFixture();
  assert.ok(Array.isArray(data), 'expected array');
  assert.ok(data.length >= 1, 'expected at least one branch');
}

async function testGetBranchByIdFallback() {
  const found = require('../../../../api/admin/branches/utils.js').findBranchById('00000000-0000-0000-0000-000000000001');
  assert.ok(found, 'expected branch object');
  assert.strictEqual(found.id, '00000000-0000-0000-0000-000000000001');
}

async function run() {
  await testListBranchesFallback();
  console.log('testListBranchesFallback OK');
  await testGetBranchByIdFallback();
  console.log('testGetBranchByIdFallback OK');
}

run().catch((e) => { throw e; });
