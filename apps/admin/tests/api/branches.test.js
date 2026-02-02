const assert = require('assert');

function testListBranchesFallback() {
  const data = require('../../../../api/admin/branches/utils.js').loadFixture();
  assert.ok(Array.isArray(data), 'expected array');
  assert.ok(data.length >= 1, 'expected at least one branch');
  console.log('testListBranchesFallback OK');
}

function testGetBranchByIdFallback() {
  const found = require('../../../../api/admin/branches/utils.js').findBranchById('00000000-0000-0000-0000-000000000001');
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
