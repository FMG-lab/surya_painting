const assert = require('assert');

const path = require('path');
const branchUtils = require(path.join(__dirname, '..', '..', '..', '..', 'lib', 'server', 'branches.ts'));

function testListBranchesFallback() {
  const data = branchUtils.loadBranchesFixture();
  assert.ok(Array.isArray(data), 'expected array');
  assert.ok(data.length >= 1, 'expected at least one branch');
  console.log('testListBranchesFallback OK');
}

function testGetBranchByIdFallback() {
  const path = require('path');
  const branchUtils = require(path.join(__dirname, '..', '..', '..', '..', 'lib', 'server', 'branches.ts'));
  const found = branchUtils.findBranchById('00000000-0000-0000-0000-000000000001');
  assert.ok(found, 'expected branch object');
  assert.strictEqual(found.id, '00000000-0000-0000-0000-000000000001');
  console.log('testGetBranchByIdFallback OK');
}

try {
  testListBranchesFallback();
  testGetBranchByIdFallback();
  console.log('All API tests OK');
} catch (e) {
  console.error(e);
  process.exit(1);
}
